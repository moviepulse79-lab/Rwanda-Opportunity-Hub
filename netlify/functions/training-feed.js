// =========================================
// RWANDA OPPORTUNITY HUB
// NETLIFY FUNCTION
// LIVE TRAINING FEED
//
// Sources:
// - RISA Digital Skills
// - Rwanda TVET Board (RTB)
//
// Server-side scraping/proxy
// =========================================

const RISA_URL =
    "https://dev.services.gov.rw/jw/web/userview/DigitalSkillsApp_V2/DigitalSkillsApp_V2/_/courses_to_request";

const RTB_URL =
    "https://www.elearning.rtb.gov.rw/course/index.php?browse=courses";


// =========================================
// HELPERS
// =========================================

function decodeHTML(value = "") {

    return String(value)
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/&#x27;/gi, "'")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">")
        .replace(/&#(\d+);/g, (_, code) =>
            String.fromCharCode(Number(code))
        )
        .replace(/&#x([0-9a-f]+);/gi, (_, code) =>
            String.fromCharCode(parseInt(code, 16))
        );
}


function cleanText(value = "") {

    return decodeHTML(
        String(value)
            .replace(/<script[\s\S]*?<\/script>/gi, " ")
            .replace(/<style[\s\S]*?<\/style>/gi, " ")
            .replace(/<[^>]*>/g, " ")
            .replace(/\s+/g, " ")
            .trim()
    );

}


function absoluteURL(url, base) {

    if (!url) {
        return base;
    }

    try {

        return new URL(
            decodeHTML(url),
            base
        ).href;

    } catch {

        return base;

    }

}


function makeID(prefix, title, organization) {

    const raw =
        `${prefix}-${title}-${organization}`;

    return raw
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .substring(0, 100);

}


function safeDate(value) {

    if (!value) {
        return null;
    }

    const match =
        String(value).match(
            /\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4}/
        );

    return match
        ? match[0]
        : String(value).trim();

}


// =========================================
// RISA
// =========================================

async function loadRISA() {

    console.log("Loading RISA...");

    const response =
        await fetch(
            RISA_URL,
            {
                headers: {
                    "User-Agent":
                        "Mozilla/5.0 Rwanda Opportunity Hub",
                    "Accept":
                        "text/html,application/xhtml+xml,text/html"
                }
            }
        );


    if (!response.ok) {

        throw new Error(
            `RISA HTTP ${response.status}`
        );

    }


    const html =
        await response.text();


    console.log(
        "RISA HTML length:",
        html.length
    );


    const trainings = [];


    // -----------------------------------------
    // METHOD 1
    // Parse table rows
    // -----------------------------------------

    const rows =
        html.match(
            /<tr\b[^>]*>[\s\S]*?<\/tr>/gi
        ) || [];


    console.log(
        "RISA table rows:",
        rows.length
    );


    for (const row of rows) {

        const cells =
            row.match(
                /<td\b[^>]*>[\s\S]*?<\/td>/gi
            ) || [];


        if (cells.length < 5) {
            continue;
        }


        const values =
            cells.map(
                cell => cleanText(cell)
            );


        // Remove empty cells
        const cleaned =
            values.filter(
                value => value.trim() !== ""
            );


        if (cleaned.length < 5) {
            continue;
        }


        const joined =
            cleaned.join(" | ");


        // -------------------------------------
        // Skip headers
        // -------------------------------------

        if (
            /training title/i.test(joined) ||
            /^n#\s*\|/i.test(joined)
        ) {

            continue;

        }


        /*
            Actual RISA structure observed:

            N#
            Training Title
            Level
            Provider
            Mode
            Dates
            Duration
            Seats
            Submission Status
        */


        let titleIndex = -1;


        // Find a real training title.
        // Skip numeric N# values.

        for (
            let i = 0;
            i < cleaned.length;
            i++
        ) {

            const value =
                cleaned[i];


            if (
                /^\d+$/.test(value)
            ) {
                continue;
            }


            if (
                /^(entrant|beginner|intermediate|advanced|expert|level)/i.test(value)
            ) {
                continue;
            }


            if (
                /online|physical|classroom|instructor|self-paced/i.test(value)
            ) {
                continue;
            }


            if (
                /days?|weeks?|months?/i.test(value)
            ) {
                continue;
            }


            if (
                /seats?\s*(left|full)/i.test(value)
            ) {
                continue;
            }


            if (
                /you can apply|closed|not available/i.test(value)
            ) {
                continue;
            }


            // Date value
            if (
                /\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4}/i.test(value)
            ) {
                continue;
            }


            // First suitable value is the title
            if (
                value.length >= 3
            ) {

                titleIndex = i;
                break;

            }

        }


        if (
            titleIndex === -1
        ) {

            continue;

        }


        const title =
            cleaned[titleIndex];


        if (
            !title ||
            title.length < 3
        ) {

            continue;

        }


        // -------------------------------------
        // Remaining fields
        // -------------------------------------

        const remaining =
            cleaned.slice(
                titleIndex + 1
            );


        const level =
            remaining.find(
                value =>
                    /entrant|beginner|intermediate|advanced|expert|level/i.test(value)
            ) ||
            "All Levels";


        const provider =
            remaining.find(
                value =>
                    !/entrant|beginner|intermediate|advanced|expert|level/i.test(value) &&
                    !/online|physical|classroom|instructor|self-paced/i.test(value) &&
                    !/\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4}/i.test(value) &&
                    !/days?|weeks?|months?/i.test(value) &&
                    !/seats?\s*(left|full)/i.test(value) &&
                    !/you can apply|closed|not available/i.test(value)
            ) ||
            "RISA";


        const mode =
            remaining.find(
                value =>
                    /online|physical|classroom|instructor|self-paced/i.test(value)
            ) ||
            "Not specified";


        const dates =
            remaining.find(
                value =>
                    /\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4}/i.test(value)
            ) ||
            "";


        const duration =
            remaining.find(
                value =>
                    /\b\d+\s*(day|days|week|weeks|month|months)\b/i.test(value)
            ) ||
            "Not specified";


        const seats =
            remaining.find(
                value =>
                    /seats?\s*(left|full)/i.test(value)
            ) ||
            "";


        // -------------------------------------
        // Details / Apply link
        // -------------------------------------

        const links =
            [
                ...row.matchAll(
                    /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi
                )
            ];


        let link =
            RISA_URL;


        for (const item of links) {

            const href =
                item[1];


            const linkText =
                cleanText(item[2]);


            if (
                /view details|apply|request/i.test(linkText)
            ) {

                link =
                    absoluteURL(
                        href,
                        RISA_URL
                    );

                break;

            }

        }


        trainings.push({

            id:
                makeID(
                    "risa",
                    title,
                    provider
                ),

            title,

            organization:
                provider,

            type:
                "training",

            category:
                "technology",

            location:
                "Rwanda",

            country:
                "Rwanda",

            mode,

            level,

            duration,

            deadline:
                safeDate(dates) ||
                "See training dates",

            description:
                `Live training opportunity from the RISA Digital Skills catalogue. ${seats}`,

            requirements:
                "Check the official RISA training page for eligibility and application requirements.",

            link,

            source:
                "RISA Digital Skills",

            verified:
                true,

            isExternal:
                true,

            created_at:
                new Date().toISOString(),

            start_date:
                dates,

            seats

        });

    }


    // -----------------------------------------
    // METHOD 2
    // Fallback: extract known RISA-style
    // training information from visible text
    // -----------------------------------------

    if (
        trainings.length === 0
    ) {

        console.log(
            "RISA table parser found 0. Trying fallback parser..."
        );


        const text =
            cleanText(html);


        /*
            Look for blocks containing:
            training name + level + provider
        */

        const blocks =
            text.split(/\n+/)
                .map(
                    x => x.trim()
                )
                .filter(
                    x => x.length > 3
                );


        for (
            let i = 0;
            i < blocks.length;
            i++
        ) {

            const current =
                blocks[i];


            if (
                /available trainings/i.test(current)
            ) {
                continue;
            }


            if (
                /training title/i.test(current)
            ) {
                continue;
            }


            if (
                /you can apply/i.test(current)
            ) {

                continue;

            }

        }

    }


    console.log(
        "RISA trainings found:",
        trainings.length
    );


    return trainings;

}

function removeDuplicates(trainings) {
  const seen = new Set();

  return trainings.filter(training => {
    const key = (
      training.link ||
      training.id ||
      training.title ||
      ""
    ).toLowerCase().trim();

    if (!key || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

// =========================================
// RTB
// =========================================

async function loadRTB() {

    const BASE =
        "https://www.elearning.rtb.gov.rw";

    console.log("=================================");
    console.log("Loading RTB courses...");

    try {

        /*
         * RTB Moodle search pages.
         *
         * We use several searches because RTB's
         * catalogue contains many different fields.
         */

        const queries = [
            "software",
            "networking",
            "computer",
            "programming",
            "database",
            "business",
            "hospitality",
            "tourism",
            "agriculture",
            "food",
            "multimedia",
            "automotive"
        ];


        const courses = [];


        // =========================================
        // FETCH SEARCH RESULTS
        // =========================================

        for (const query of queries) {

            try {

                const searchURL =
                    BASE +
                    "/course/search.php?perpage=all&search=" +
                    encodeURIComponent(query);


                console.log(
                    "RTB search:",
                    query
                );


                const response =
                    await fetch(
                        searchURL,
                        {
                            headers: {
                                "User-Agent":
                                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36",

                                "Accept":
                                    "text/html,application/xhtml+xml"
                            }
                        }
                    );


                if (!response.ok) {

                    console.warn(
                        "RTB HTTP error:",
                        query,
                        response.status
                    );

                    continue;

                }


                const html =
                    await response.text();


                console.log(
                    "RTB HTML length:",
                    query,
                    html.length
                );


                // =================================
                // FIND ALL COURSE URLs
                // =================================

                const hrefRegex =
                    /href\s*=\s*["']([^"']*course\/view\.php\?id=\d+[^"']*)["']/gi;


                let match;


                while (
                    (match =
                        hrefRegex.exec(html)) !== null
                ) {

                    let href =
                        match[1];


                    // Decode HTML entities
                    href =
                        decodeHTML(href);


                    // Convert relative URL
                    if (
                        href.startsWith("/")
                    ) {

                        href =
                            BASE + href;

                    }


                    if (
                        !href.startsWith("http")
                    ) {

                        continue;

                    }


                    // Extract Moodle course ID
                    const idMatch =
                        href.match(
                            /course\/view\.php\?id=(\d+)/i
                        );


                    if (!idMatch) {

                        continue;

                    }


                    const courseId =
                        idMatch[1];


                    // =================================
                    // FIND TITLE NEAR THE LINK
                    // =================================

                    /*
                     * Get a chunk around the link.
                     *
                     * Moodle puts the course title
                     * close to its course URL.
                     */

                    const position =
                        match.index;


                    const chunkStart =
                        Math.max(
                            0,
                            position - 1500
                        );


                    const chunkEnd =
                        Math.min(
                            html.length,
                            position + 2500
                        );


                    const chunk =
                        html.substring(
                            chunkStart,
                            chunkEnd
                        );


                    let title = "";


                    // ---------------------------------
                    // Try aria-label
                    // ---------------------------------

                    const ariaMatch =
                        chunk.match(
                            /aria-label\s*=\s*["']([^"']+)["']/i
                        );


                    if (
                        ariaMatch
                    ) {

                        title =
                            cleanText(
                                ariaMatch[1]
                            );

                    }


                    // ---------------------------------
                    // Try title=""
                    // ---------------------------------

                    if (!title) {

                        const titleAttr =
                            chunk.match(
                                /title\s*=\s*["']([^"']+)["']/i
                            );


                        if (
                            titleAttr
                        ) {

                            title =
                                cleanText(
                                    titleAttr[1]
                                );

                        }

                    }


                    // ---------------------------------
                    // Extract anchor containing URL
                    // ---------------------------------

                    if (!title) {

                        const anchorRegex =
                            new RegExp(
                                "<a[^>]+href=[\"']" +
                                href
                                    .replace(
                                        /[.*+?^${}()|[\]\\]/g,
                                        "\\$&"
                                    ) +
                                "[\"'][^>]*>([\\\\s\\\\S]*?)<\\\\/a>",
                                "i"
                            );


                        const anchorMatch =
                            chunk.match(
                                anchorRegex
                            );


                        if (
                            anchorMatch
                        ) {

                            title =
                                cleanText(
                                    anchorMatch[1]
                                );

                        }

                    }


                    // ---------------------------------
                    // Another generic anchor fallback
                    // ---------------------------------

                    if (!title) {

                        const genericAnchor =
                            chunk.match(
                                /<a[^>]*>([\s\S]*?)<\/a>/gi
                            );


                        if (
                            genericAnchor
                        ) {

                            for (
                                const anchor
                                of genericAnchor
                            ) {

                                const text =
                                    cleanText(
                                        anchor
                                    );


                                if (
                                    text.length >= 4 &&
                                    text.length <= 180 &&
                                    !/^(home|courses|search|login|log in|dashboard)$/i.test(text)
                                ) {

                                    title =
                                        text;

                                    break;

                                }

                            }

                        }

                    }


                    if (!title) {

                        continue;

                    }


                    // Remove obvious navigation text
                    title =
                        cleanText(title);


                    if (
                        !title ||
                        title.length < 3 ||
                        title.length > 250
                    ) {

                        continue;

                    }


                    if (
                        /^(home|dashboard|courses|course search|search courses|login|log in)$/i.test(title)
                    ) {

                        continue;

                    }


                    courses.push({

                        id:
                            courseId,

                        title,

                        link:
                            href

                    });

                }

            }
            catch (error) {

                console.warn(
                    "RTB query failed:",
                    query,
                    error.message
                );

            }

        }


        console.log(
            "RTB raw courses:",
            courses.length
        );


        // =========================================
        // REMOVE DUPLICATES
        // =========================================

        const uniqueCourses =
            removeDuplicates(
                courses.map(course => ({

                    ...course,

                    id:
                        "rtb-" +
                        course.id

                }))
            );


        console.log(
            "RTB unique courses:",
            uniqueCourses.length
        );


        // =========================================
        // CONVERT TO ROH FORMAT
        // =========================================

        const trainings =
            uniqueCourses
                .map(course => {

                    const title =
                        cleanText(
                            course.title
                        );


                    if (!title) {

                        return null;

                    }


                    return {

                        id:
                            course.id,

                        title,

                        organization:
                            "Rwanda TVET Board (RTB)",

                        type:
                            "training",

                        category:
                            inferTrainingCategory(
                                title
                            ),

                        location:
                            "Rwanda",

                        country:
                            "Rwanda",

                        mode:
                            "Online / E-learning",

                        level:
                            inferTrainingLevel(
                                title
                            ),

                        duration:
                            "Self-paced",

                        deadline:
                            "",

                        description:
                            `Training course available through the official RTB E-Learning platform.`,

                        requirements:
                            "Check the official RTB E-Learning platform for course access and enrollment requirements.",

                        link:
                            course.link,

                        source:
                            "RTB E-Learning",

                        verified:
                            true,

                        isExternal:
                            true,

                        created_at:
                            new Date()
                                .toISOString()

                    };

                })
                .filter(Boolean);


        const finalTrainings =
            removeDuplicates(
                trainings
            );


        console.log(
            "RTB trainings found:",
            finalTrainings.length
        );


        return finalTrainings;

    }
    catch (error) {

        console.error(
            "RTB feed error:",
            error
        );

        return [];

    }

}


// =========================================
// NETLIFY FUNCTION
// =========================================

exports.handler =
    async function () {

        const started =
            Date.now();


        try {

            const results =
                await Promise.allSettled(
                    [
                        loadRISA(),
                        loadRTB()
                    ]
                );


            const risa =
                results[0].status === "fulfilled"
                    ? results[0].value
                    : [];


            const rtb =
                results[1].status === "fulfilled"
                    ? results[1].value
                    : [];


            if (
                results[0].status === "rejected"
            ) {

                console.error(
                    "RISA ERROR:",
                    results[0].reason
                );

            }


            if (
                results[1].status === "rejected"
            ) {

                console.error(
                    "RTB ERROR:",
                    results[1].reason
                );

            }


            const trainings =
                removeDuplicates(
                    [
                        ...risa,
                        ...rtb
                    ]
                );


            console.log(
                "FINAL TRAINING COUNT:",
                trainings.length
            );


            return {

                statusCode:
                    200,

                headers: {

                    "Content-Type":
                        "application/json",

                    "Access-Control-Allow-Origin":
                        "*",

                    "Access-Control-Allow-Methods":
                        "GET, OPTIONS",

                    "Access-Control-Allow-Headers":
                        "Content-Type",

                    "Cache-Control":
                        "public, max-age=900, s-maxage=900"

                },

                body:
                    JSON.stringify({

                        success:
                            true,

                        generated_at:
                            new Date()
                                .toISOString(),

                        duration_ms:
                            Date.now() -
                            started,

                        count:
                            trainings.length,

                        sources: {

                            risa:
                                risa.length,

                            rtb:
                                rtb.length

                        },

                        trainings

                    })

            };

        }
        catch (error) {

            console.error(
                "TRAINING FEED ERROR:",
                error
            );


            return {

                statusCode:
                    500,

                headers: {

                    "Content-Type":
                        "application/json",

                    "Access-Control-Allow-Origin":
                        "*"

                },

                body:
                    JSON.stringify({

                        success:
                            false,

                        error:
                            error.message,

                        trainings:
                            []

                    })

            };

        }

    };
