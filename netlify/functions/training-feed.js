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


// =========================================
// RTB
// =========================================

async function loadRTB() {

    console.log("Loading RTB...");


    const response =
        await fetch(
            RTB_URL,
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
            `RTB HTTP ${response.status}`
        );

    }


    const html =
        await response.text();


    console.log(
        "RTB HTML length:",
        html.length
    );


    const trainings = [];


    const seen =
        new Set();


    // -----------------------------------------
    // Find ALL Moodle course links
    // -----------------------------------------

    const patterns = [

        /href=["']([^"']*course\/view\.php\?id=\d+[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi,

        /<a[^>]+href=["']([^"']*\/course\/view\.php\?id=\d+[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi

    ];


    for (const regex of patterns) {

        let match;


        while (
            (match =
                regex.exec(html)) !== null
        ) {

            const href =
                decodeHTML(
                    match[1]
                );


            const title =
                cleanText(
                    match[2]
                );


            if (
                !title ||
                title.length < 3
            ) {
                continue;
            }


            if (
                /login|search|home|dashboard|course categories/i.test(
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
                /software|network|telecommunication|multimedia|\bict\b|computer|programming|cyber|information technology/i.test(
                    lower
                )
            ) {

                category =
                    "technology";

            }
            else if (
                /design|graphic|fashion|interior/i.test(
                    lower
                )
            ) {

                category =
                    "design";

            }
            else if (
                /business|management|finance|accounting|entrepreneur|marketing/i.test(
                    lower
                )
            ) {

                category =
                    "business";

            }


            let level =
                "TVET";


            const levelMatch =
                title.match(
                    /(?:LEVEL|L)\s*(THREE|FOUR|FIVE|SIX|\d+)/i
                );


            if (levelMatch) {

                level =
                    `Level ${levelMatch[1]}`;

            }


            trainings.push({

                id:
                    makeID(
                        "rtb",
                        title,
                        "Rwanda TVET Board"
                    ),

                title,

                organization:
                    "Rwanda TVET Board",

                type:
                    "training",

                category,

                location:
                    "Rwanda",

                country:
                    "Rwanda",

                mode:
                    "Online / E-learning",

                level,

                duration:
                    "Self-paced",

                deadline:
                    "Open / See course",

                description:
                    "TVET learning course available through the Rwanda TVET Board e-learning platform.",

                requirements:
                    "Access requirements may vary by course. Check the official RTB course page.",

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

    }


    console.log(
        "RTB trainings found:",
        trainings.length
    );


    return trainings;

}


// =========================================
// REMOVE DUPLICATES
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
