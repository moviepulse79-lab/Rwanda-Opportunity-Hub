// =========================================
// RWANDA OPPORTUNITY HUB
// NETLIFY FUNCTION
// LIVE TRAINING FEED
//
// Sources:
// - RISA Digital Skills
// - Rwanda TVET Board (RTB)
//
// This function fetches public pages server-side
// so training.js does NOT need to bypass CORS.
// =========================================

const RISA_URL =
    "https://dev.services.gov.rw/jw/web/userview/DigitalSkillsApp_V2/DigitalSkillsApp_V2/_/courses_to_request";

const RTB_URL =
    "https://www.elearning.rtb.gov.rw/course/index.php?browse=courses";


// =========================================
// BASIC HELPERS
// =========================================

function cleanText(value = "") {

    return String(value)
        .replace(/<[^>]*>/g, " ")
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/&#x27;/gi, "'")
        .replace(/\s+/g, " ")
        .trim();

}


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
        .trim();

}


function absoluteURL(url, base) {

    if (!url) {
        return base;
    }

    try {
        return new URL(url, base).href;
    }
    catch {
        return base;
    }

}


function safeDate(value) {

    if (!value) {
        return null;
    }

    const match =
        String(value).match(
            /\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4}/
        );

    if (match) {
        return match[0];
    }

    return String(value).trim();

}


// =========================================
// RISA
// =========================================

async function loadRISA() {

    const response =
        await fetch(
            RISA_URL,
            {
                headers: {
                    "User-Agent":
                        "Rwanda Opportunity Hub Training Aggregator",
                    "Accept":
                        "text/html,application/xhtml+xml"
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


    const trainings = [];


    // -----------------------------------------
    // Find table rows
    // -----------------------------------------

    const rowMatches =
        html.match(
            /<tr[\s\S]*?<\/tr>/gi
        ) || [];


    for (const row of rowMatches) {

        const cells =
            row.match(
                /<t[dh][^>]*>[\s\S]*?<\/t[dh]>/gi
            ) || [];


        if (cells.length < 5) {
            continue;
        }


        const values =
            cells.map(
                cell =>
                    decodeHTML(
                        cleanText(cell)
                    )
            );


        const joined =
            values.join(" | ");


        // Ignore header rows
        if (
            /Training Title/i.test(joined) &&
            /Provider/i.test(joined)
        ) {
            continue;
        }


        /*
            Expected RISA structure:

            Training Title
            Level
            Provider
            Mode
            Dates
            Duration
            Seats
            Submission Status
            Details / Action
        */

        const title =
            values[1] ||
            values[0];


        if (
            !title ||
            /training title/i.test(title) ||
            title.length < 2
        ) {
            continue;
        }


        const level =
            values[2] ||
            "All Levels";


        const provider =
            values[3] ||
            "RISA";


        const mode =
            values[4] ||
            "Not specified";


        const dates =
            values[5] ||
            "";


        const duration =
            values[6] ||
            "Not specified";


        const seats =
            values[7] ||
            "";


        // -------------------------------------
        // Find course/details link
        // -------------------------------------

        const linkMatch =
            row.match(
                /href\s*=\s*["']([^"']+)["']/i
            );


        const link =
            linkMatch
                ? absoluteURL(
                    decodeHTML(
                        linkMatch[1]
                    ),
                    RISA_URL
                )
                : RISA_URL;


        trainings.push({

            id:
                `risa-${Buffer.from(
                    `${title}-${provider}`
                ).toString("base64")
                    .replace(/[^a-zA-Z0-9]/g, "")
                    .substring(0, 24)}`,

            title:

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

            mode:

                mode,

            level:

                level,

            duration:

                duration,

            deadline:

                safeDate(dates) ||
                "See training dates",

            description:

                `Training available through the RISA Digital Skills catalogue. ${seats}`,

            requirements:

                "Check the official RISA training page for eligibility and application requirements.",

            link:

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

            seats:

                seats

        });

    }


    // -----------------------------------------
    // Fallback parser
    // -----------------------------------------

    /*
       Some Joget versions can change the table
       markup. If no rows were detected, look for
       visible training names in the page.
    */

    if (!trainings.length) {

        const text =
            cleanText(html);


        console.warn(
            "RISA page loaded but no table rows were detected."
        );


        console.log(
            "RISA page length:",
            text.length
        );

    }


    return trainings;

}


// =========================================
// RTB
// =========================================

async function loadRTB() {

    const response =
        await fetch(
            RTB_URL,
            {
                headers: {
                    "User-Agent":
                        "Rwanda Opportunity Hub Training Aggregator",
                    "Accept":
                        "text/html,application/xhtml+xml"
                }
            }
        );


    if (!response.ok) {

        throw new Error(
            `RTB HTTP ${response.status}`
        );

    }


    const html =
        await response.text();


    const trainings = [];


    /*
        Moodle course pages normally contain:

        /course/view.php?id=123

        We extract course titles and links.
    */

    const courseRegex =
        /<a[^>]+href=["']([^"']*\/course\/view\.php\?id=\d+[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;


    const seen =
        new Set();


    let match;


    while (
        (match =
            courseRegex.exec(html)) !== null
    ) {

        const href =
            decodeHTML(
                match[1]
            );


        const rawTitle =
            match[2];


        const title =
            decodeHTML(
                cleanText(rawTitle)
            );


        if (
            !title ||
            title.length < 3
        ) {
            continue;
        }


        if (
            /home|login|search|course categories/i.test(
                title
            )
        ) {
            continue;
        }


        const link =
            absoluteURL(
                href,
                RTB_URL
            );


        const key =
            `${title.toLowerCase()}-${link}`;


        if (
            seen.has(key)
        ) {
            continue;
        }


        seen.add(key);


        let category =
            "vocational";


        const lower =
            title.toLowerCase();


        if (
            lower.includes("software") ||
            lower.includes("network") ||
            lower.includes("telecommunication") ||
            lower.includes("multimedia") ||
            lower.includes("ict") ||
            lower.includes("computer")
        ) {

            category =
                "technology";

        }
        else if (
            lower.includes("design") ||
            lower.includes("graphic") ||
            lower.includes("interior")
        ) {

            category =
                "design";

        }
        else if (
            lower.includes("business") ||
            lower.includes("management") ||
            lower.includes("finance") ||
            lower.includes("entrepreneur")
        ) {

            category =
                "business";

        }


        let level =
            "TVET";


        const levelMatch =
            title.match(
                /LEVEL\s+(THREE|FOUR|FIVE|\d+)/i
            );


        if (levelMatch) {

            level =
                `Level ${levelMatch[1]}`;

        }


        trainings.push({

            id:

                `rtb-${Buffer.from(
                    title
                ).toString("base64")
                    .replace(/[^a-zA-Z0-9]/g, "")
                    .substring(0, 24)}`,

            title:

                title,

            organization:

                "Rwanda TVET Board",

            type:

                "training",

            category:

                category,

            location:

                "Rwanda",

            country:

                "Rwanda",

            mode:

                "Online / E-learning",

            level:

                level,

            duration:

                "Self-paced",

            deadline:

                "Open / See course",

            description:

                `TVET learning course available through the Rwanda TVET Board e-learning platform.`,

            requirements:

                "Access requirements may vary by course. Check the official RTB course page.",

            link:

                link,

            source:

                "Rwanda TVET Board",

            verified:

                true,

            isExternal:

                true,

            created_at:

                new Date().toISOString()

        });

    }


    return trainings;

}


// =========================================
// DEDUPLICATE
// =========================================

function removeDuplicates(
    trainings
) {

    const unique =
        [];

    const seen =
        new Set();


    for (
        const training
        of trainings
    ) {

        const title =
            String(
                training.title || ""
            )
                .toLowerCase()
                .replace(
                    /[^a-z0-9]+/g,
                    " "
                )
                .trim();


        const organization =
            String(
                training.organization || ""
            )
                .toLowerCase()
                .replace(
                    /[^a-z0-9]+/g,
                    " "
                )
                .trim();


        const key =
            `${title}-${organization}`;


        if (
            !seen.has(key)
        ) {

            seen.add(key);

            unique.push(
                training
            );

        }

    }


    return unique;

}


// =========================================
// NETLIFY HANDLER
// =========================================

exports.handler =
    async function () {

        const started =
            Date.now();


        try {

            const [
                risaResult,
                rtbResult
            ] =
                await Promise.allSettled(
                    [
                        loadRISA(),
                        loadRTB()
                    ]
                );


            const risa =
                risaResult.status ===
                    "fulfilled"
                    ? risaResult.value
                    : [];


            const rtb =
                rtbResult.status ===
                    "fulfilled"
                    ? rtbResult.value
                    : [];


            if (
                risaResult.status ===
                "rejected"
            ) {

                console.error(
                    "RISA feed failed:",
                    risaResult.reason
                );

            }


            if (
                rtbResult.status ===
                "rejected"
            ) {

                console.error(
                    "RTB feed failed:",
                    rtbResult.reason
                );

            }


            const trainings =
                removeDuplicates(
                    [
                        ...risa,
                        ...rtb
                    ]
                );


            return {

                statusCode: 200,

                headers: {

                    "Content-Type":
                        "application/json",

                    "Access-Control-Allow-Origin":
                        "*",

                    "Access-Control-Allow-Methods":
                        "GET, OPTIONS",

                    "Access-Control-Allow-Headers":
                        "Content-Type",

                    /*
                        Let Netlify/CDN cache the
                        feed for 15 minutes.
                    */

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

                        trainings:

                            trainings

                    })

            };

        }
        catch (error) {

            console.error(
                "Training feed error:",
                error
            );


            return {

                statusCode: 500,

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
                            "Unable to load training sources.",

                        trainings:
                            []

                    })

            };

        }

    };
