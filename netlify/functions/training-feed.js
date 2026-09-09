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
  const BASE = "https://www.elearning.rtb.gov.rw";

  console.log("=================================");
  console.log("Loading RTB courses...");

  try {
    // Public RTB Moodle search queries
    const queries = [
      "software development",
      "networking",
      "computer",
      "hospitality",
      "tourism",
      "food processing",
      "business",
      "agriculture",
      "multimedia",
      "automotive"
    ];

    const allCourses = [];

    for (const query of queries) {
      try {
        const url =
          BASE +
          "/course/search.php?search=" +
          encodeURIComponent(query);

        console.log("RTB search:", query);

        const response = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0",
            "Accept": "text/html,application/xhtml+xml"
          }
        });

        if (!response.ok) {
          console.warn(
            `RTB search failed: ${query} HTTP ${response.status}`
          );
          continue;
        }

        const html = await response.text();

        console.log(
          `RTB ${query} HTML length:`,
          html.length
        );

        /*
         * Moodle course search results contain links like:
         *
         * /course/view.php?id=1492
         *
         * The course title is inside the same link.
         */
        const courseRegex =
          /<a[^>]+href=["']([^"']*\/course\/view\.php\?id=\d+[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;

        let match;

        while ((match = courseRegex.exec(html)) !== null) {
          let link = match[1];

          let title = match[2]
            .replace(/<[^>]+>/g, " ")
            .replace(/&nbsp;/gi, " ")
            .replace(/&amp;/gi, "&")
            .replace(/&#39;/gi, "'")
            .replace(/&quot;/gi, '"')
            .replace(/&#x27;/gi, "'")
            .replace(/\s+/g, " ")
            .trim();

          if (!title || title.length < 3) {
            continue;
          }

          if (link.startsWith("/")) {
            link = BASE + link;
          }

          if (!link.startsWith("http")) {
            continue;
          }

          const idMatch = link.match(
            /course\/view\.php\?id=(\d+)/
          );

          if (!idMatch) {
            continue;
          }

          const courseId = idMatch[1];

          allCourses.push({
            id: courseId,
            title,
            link
          });
        }

      } catch (error) {
        console.warn(
          `RTB query failed: ${query}`,
          error.message
        );
      }
    }

    console.log(
      "RTB raw courses discovered:",
      allCourses.length
    );

    // -------------------------------------------------
    // Remove duplicate courses
    // -------------------------------------------------

    const uniqueCourses = removeDuplicates(
      allCourses.map(course => ({
        ...course,
        id: "rtb-" + course.id
      }))
    );

    console.log(
      "RTB unique courses:",
      uniqueCourses.length
    );

    // -------------------------------------------------
    // Convert to ROH training objects
    // -------------------------------------------------

    const trainings = uniqueCourses
      .map(course => {

        const title = cleanText(course.title);

        if (!title) {
          return null;
        }

        return {
          id: course.id,

          title,

          organization:
            "Rwanda TVET Board (RTB)",

          type:
            "training",

          category:
            inferTrainingCategory(title),

          location:
            "Rwanda",

          country:
            "Rwanda",

          mode:
            "Online / E-learning",

          level:
            inferTrainingLevel(title),

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
            new Date().toISOString()
        };
      })
      .filter(Boolean);

    // -------------------------------------------------
    // Final duplicate protection
    // -------------------------------------------------

    const finalTrainings =
      removeDuplicates(trainings);

    console.log(
      "RTB trainings found:",
      finalTrainings.length
    );

    return finalTrainings;

  } catch (error) {

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
