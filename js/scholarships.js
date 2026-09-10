
// =========================================
// ROH SCHOLARSHIPS
// SUPABASE + OPPORTUNITIES FOR AFRICANS
// =========================================
//
// IMPORTANT:
// - Supabase records are NEVER modified.
// - Existing Supabase scholarships remain untouched.
// - OFA scholarships are displayed live only.
// - OFA results are NOT inserted into Supabase.
// - Fellowships are NOT included here.
// - Expired opportunities are rejected.
// - Only scholarship-category posts are accepted.
// =========================================


// =========================================
// ELEMENTS
// =========================================

const scholarshipsGrid =
    document.getElementById("scholarshipsGrid");

const scholarshipCount =
    document.getElementById("scholarshipCount");

const searchInput =
    document.getElementById("scholarshipSearch");

const filterButtons =
    document.querySelectorAll(".filter-btn");
// =========================================
// STATE
// =========================================

let scholarships = [];

let filteredScholarships = [];

let visibleScholarships = 12;

const LOAD_MORE_COUNT = 12;


// =========================================
// OFA SOURCE
// =========================================
//
// Opportunities For Africans
//
// We search Rwanda-related posts through
// the WordPress REST API and then keep only
// posts belonging to the Scholarships category.
//
// =========================================

const OFA_API =
    "https://www.opportunitiesforafricans.com/wp-json/wp/v2/posts";

const OFA_SEARCH_TERM =
    "rwanda";

const OFA_SOURCE_URL =
    "https://www.opportunitiesforafricans.com/?s=rwanda";


// =========================================
// CURRENT DATE
// =========================================

function todayISO() {

    const now = new Date();

    return now.toISOString().split("T")[0];

}


// =========================================
// LOAD SUPABASE
// =========================================

async function loadSupabaseScholarships() {

    try {

        const {
            data,
            error
        } = await supabaseClient

            .from("opportunities")

            .select("*")

            .eq(
                "type",
                "scholarship"
            )

            .order(
                "created_at",
                {
                    ascending: false
                }
            );


        if (error) {

            console.error(
                "Supabase scholarships error:",
                error
            );

            return [];

        }


        return (
            data || []
        ).map(

            scholarship => ({

                ...scholarship,

                isApiScholarship:
                    false,

                isApiJob:
                    false,

                source:
                    "Supabase"

            })

        );


    } catch (error) {

        console.error(
            "Supabase loading failed:",
            error
        );

        return [];

    }

}


// =========================================
// LOAD OFA
// =========================================

async function loadOFAScholarships() {

    try {

        const url =
            `${OFA_API}?search=${encodeURIComponent(
                OFA_SEARCH_TERM
            )}&per_page=100&_embed`;


        const response =
            await fetch(
                url,
                {
                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );


        if (!response.ok) {

            throw new Error(
                `OFA API returned HTTP ${response.status}`
            );

        }


        const posts =
            await response.json();


        if (!Array.isArray(posts)) {

            return [];

        }


        console.log(
            "OFA raw posts:",
            posts.length
        );


        const results = [];


        for (
            const post of posts
        ) {

            try {

                const scholarship =
                    await normalizeOFAPost(
                        post
                    );


                if (
                    scholarship &&
                    isValidLiveScholarship(
                        scholarship
                    )
                ) {

                    results.push(
                        scholarship
                    );

                }

            } catch (error) {

                console.warn(
                    "Could not process OFA post:",
                    error
                );

            }

        }


        return deduplicateScholarships(
            results
        );


    } catch (error) {

        console.warn(
            "OFA scholarships unavailable:",
            error
        );

        return [];

    }

}


// =========================================
// NORMALIZE OFA POST
// =========================================

async function normalizeOFAPost(
    post
) {

    if (!post) {

        return null;

    }


    const title =
        cleanText(
            post.title?.rendered ||
            ""
        );


    if (!title) {

        return null;

    }


    const content =
        post.content?.rendered ||
        "";


    const excerpt =
        cleanText(
            post.excerpt?.rendered ||
            ""
        );


    const fullText =
        cleanText(
            `${title} ${excerpt} ${content}`
        );


    // =====================================
    // CATEGORY CHECK
    // =====================================
    //
    // This is VERY important.
    //
    // OFA Rwanda search results contain:
    // scholarships
    // fellowships
    // internships
    // jobs
    // challenges
    // training
    //
    // We only accept scholarship posts.
    // =====================================

    const categories =
        getPostCategories(
            post
        );


    const isScholarshipCategory =
        categories.some(
            category =>
                category.includes(
                    "scholarship"
                ) ||
                category.includes(
                    "bursary"
                )
        );


    if (
        !isScholarshipCategory
    ) {

        return null;

    }


    // =====================================
    // REJECT FELLOWSHIPS
    // =====================================

    const fellowshipWords = [
        "fellowship",
        "fellows programme",
        "fellows program"
    ];


    const looksLikeFellowship =
        fellowshipWords.some(
            word =>
                title
                    .toLowerCase()
                    .includes(word)
        );


    if (
        looksLikeFellowship
    ) {

        return null;

    }


    // =====================================
    // AFRICA / RWANDA ELIGIBILITY
    // =====================================

    if (
        !isAfricaOrRwandaRelevant(
            fullText
        )
    ) {

        return null;

    }


    // =====================================
    // DEADLINE
    // =====================================

    const deadline =
        extractDeadline(
            fullText
        );


    // If an article contains an explicit
    // expired deadline, reject it.
    if (
        deadline &&
        isPastDate(
            deadline
        )
    ) {

        return null;

    }


    // =====================================
    // APPLICATION LINK
    // =====================================

    const applicationLink =
        extractApplicationLink(
            content
        );


    // We require a usable link.
    if (
        !applicationLink
    ) {

        return null;

    }


    // =====================================
    // ORGANIZATION
    // =====================================

    const organization =
        extractOrganization(
            fullText,
            title
        );


    // =====================================
    // LEVEL
    // =====================================

    const level =
        extractEducationLevel(
            fullText
        );


    // =====================================
    // FUNDING
    // =====================================

    const funding =
        extractFunding(
            fullText
        );


    // =====================================
    // LOCATION
    // =====================================

    const location =
        extractLocation(
            fullText
        );


    // =====================================
    // REQUIREMENTS
    // =====================================

    const requirements =
        extractRequirements(
            fullText
        );


    return {

        id:
            `ofa-${post.id}`,

        apiId:
            post.id,

        apiSource:
            "ofa",

        title,

        organization,

        type:
            "scholarship",

        description:
            excerpt ||
            `Scholarship opportunity published by ${organization}.`,

        requirements,

        deadline,

        link:
            applicationLink,

        sourceLink:
            post.link ||
            OFA_SOURCE_URL,

        location,

        category:
            "international",

        level,

        funding,

        posted:
            post.date ||
            null,

        isApiScholarship:
            true,

        isApiJob:
            false,

        source:
            "Opportunities For Africans"

    };

}


// =========================================
// GET POST CATEGORIES
// =========================================

function getPostCategories(
    post
) {

    const categories = [];


    const embedded =
        post?._embedded;


    const terms =
        embedded?.["wp:term"];


    if (
        Array.isArray(terms)
    ) {

        terms.forEach(
            group => {

                if (
                    !Array.isArray(
                        group
                    )
                ) {

                    return;

                }


                group.forEach(
                    term => {

                        if (
                            term?.taxonomy ===
                            "category"
                        ) {

                            categories.push(
                                String(
                                    term.name ||
                                    ""
                                )
                                    .toLowerCase()
                                    .trim()
                            );

                        }

                    }
                );

            }
        );

    }


    return categories;

}


// =========================================
// AFRICA / RWANDA RELEVANCE
// =========================================

function isAfricaOrRwandaRelevant(
    text
) {

    const value =
        String(
            text || ""
        )
            .toLowerCase();


    const africaTerms = [

        "rwanda",

        "rwandan",

        "africa",

        "african",

        "africans",

        "sub-saharan africa",

        "east africa",

        "east african",

        "eac",

        "commonwealth",

        "eligible african countries",

        "african countries"

    ];


    return africaTerms.some(
        term =>
            value.includes(
                term
            )
    );

}


// =========================================
// DEADLINE EXTRACTION
// =========================================

function extractDeadline(
    text
) {

    const value =
        String(
            text || ""
        );


    // =====================================
    // ISO DATE
    // =====================================

    let match =
        value.match(
            /\b(20\d{2})[-\/](\d{1,2})[-\/](\d{1,2})\b/
        );


    if (match) {

        return normalizeDate(
            match[1],
            match[2],
            match[3]
        );

    }


    // =====================================
    // DAY MONTH YEAR
    // =====================================

    const months = {

        january: "01",
        february: "02",
        march: "03",
        april: "04",
        may: "05",
        june: "06",
        july: "07",
        august: "08",
        september: "09",
        october: "10",
        november: "11",
        december: "12"

    };


    const monthPattern =
        Object.keys(
            months
        ).join("|");


    const dayMonthYear =
        new RegExp(
            `\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(${monthPattern})\\s+(20\\d{2})\\b`,
            "i"
        );


    match =
        value.match(
            dayMonthYear
        );


    if (match) {

        return normalizeDate(
            match[3],
            months[
                match[2]
                    .toLowerCase()
            ],
            match[1]
        );

    }


    // =====================================
    // MONTH DAY YEAR
    // =====================================

    const monthDayYear =
        new RegExp(
            `\\b(${monthPattern})\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:,)?\\s+(20\\d{2})\\b`,
            "i"
        );


    match =
        value.match(
            monthDayYear
        );


    if (match) {

        return normalizeDate(
            match[3],
            months[
                match[1]
                    .toLowerCase()
            ],
            match[2]
        );

    }


    return null;

}


// =========================================
// NORMALIZE DATE
// =========================================

function normalizeDate(
    year,
    month,
    day
) {

    const y =
        String(
            year
        );


    const m =
        String(
            month
        ).padStart(
            2,
            "0"
        );


    const d =
        String(
            day
        ).padStart(
            2,
            "0"
        );


    const date =
        `${y}-${m}-${d}`;


    const parsed =
        new Date(
            `${date}T00:00:00`
        );


    if (
        Number.isNaN(
            parsed.getTime()
        )
    ) {

        return null;

    }


    return date;

}


// =========================================
// VALIDATE DATE
// =========================================

function isPastDate(
    date
) {

    if (!date) {

        return false;

    }


    const today =
        todayISO();


    return (
        date <
        today
    );

}


// =========================================
// VALID LIVE SCHOLARSHIP
// =========================================

function isValidLiveScholarship(
    scholarship
) {

    if (!scholarship) {

        return false;

    }


    if (
        !scholarship.title ||
        !scholarship.link
    ) {

        return false;

    }


    if (
        scholarship.link ===
        "#"
    ) {

        return false;

    }


    // =====================================
    // DEADLINE
    // =====================================

    if (
        scholarship.deadline &&
        isPastDate(
            scholarship.deadline
        )
    ) {

        return false;

    }


    // =====================================
    // SCHOLARSHIP ONLY
    // =====================================

    const title =
        scholarship.title
            .toLowerCase();


    if (
        title.includes(
            "fellowship"
        )
    ) {

        return false;

    }


    return true;

}


// =========================================
// APPLICATION LINK EXTRACTION
// =========================================

function extractApplicationLink(
    html
) {

    if (!html) {

        return null;

    }


    try {

        const parser =
            new DOMParser();


        const doc =
            parser.parseFromString(
                html,
                "text/html"
            );


        const anchors =
            Array.from(
                doc.querySelectorAll(
                    "a[href]"
                )
            );


        // =================================
        // FIRST PRIORITY:
        // APPLY / APPLICATION BUTTONS
        // =================================

        for (
            const anchor
            of anchors
        ) {

            const text =
                (
                    anchor.textContent ||
                    ""
                )
                    .toLowerCase()
                    .trim();


            const href =
                anchor.href ||
                "";


            if (
                !isUsableUrl(
                    href
                )
            ) {

                continue;

            }


            if (
                text.includes(
                    "apply"
                ) ||
                text.includes(
                    "application"
                ) ||
                text.includes(
                    "register"
                ) ||
                text.includes(
                    "submit application"
                )
            ) {

                return href;

            }

        }


        // =================================
        // SECOND PRIORITY:
        // LINKS CONTAINING APPLY
        // =================================

        for (
            const anchor
            of anchors
        ) {

            const href =
                anchor.href ||
                "";


            if (
                !isUsableUrl(
                    href
                )
            ) {

                continue;

            }


            const lower =
                href.toLowerCase();


            if (
                lower.includes(
                    "apply"
                ) ||
                lower.includes(
                    "application"
                ) ||
                lower.includes(
                    "admission"
                )
            ) {

                return href;

            }

        }


        return null;


    } catch (error) {

        console.warn(
            "Application link extraction failed:",
            error
        );

        return null;

    }

}


// =========================================
// VALID URL
// =========================================

function isUsableUrl(
    url
) {

    if (!url) {

        return false;

    }


    try {

        const parsed =
            new URL(
                url
            );


        if (
            parsed.protocol !==
            "http:" &&
            parsed.protocol !==
            "https:"
        ) {

            return false;

        }


        return true;


    } catch {

        return false;

    }

}


// =========================================
// ORGANIZATION
// =========================================

function extractOrganization(
    text,
    title
) {

    const value =
        String(
            text || ""
        );


    const patterns = [

        /(?:offered by|provided by|sponsored by|organised by|organized by)\s+([^.\n]+)/i,

        /(?:university of|university|college of)\s+([^.\n]+)/i

    ];


    for (
        const pattern
        of patterns
    ) {

        const match =
            value.match(
                pattern
            );


        if (
            match &&
            match[0]
        ) {

            return cleanText(
                match[0]
            );

        }

    }


    // Try the beginning of the
    // title as a reasonable fallback.

    const titleParts =
        String(
            title || ""
        ).split(
            " - "
        );


    if (
        titleParts.length > 1
    ) {

        return cleanText(
            titleParts[0]
        );

    }


    return "Opportunities For Africans";

}


// =========================================
// EDUCATION LEVEL
// =========================================

function extractEducationLevel(
    text
) {

    const value =
        String(
            text || ""
        ).toLowerCase();


    const levels = [];


    if (
        value.includes(
            "undergraduate"
        ) ||
        value.includes(
            "bachelor"
        ) ||
        value.includes(
            "bachelors"
        )
    ) {

        levels.push(
            "Undergraduate"
        );

    }


    if (
        value.includes(
            "master"
        ) ||
        value.includes(
            "masters"
        ) ||
        value.includes(
            "postgraduate"
        )
    ) {

        levels.push(
            "Masters"
        );

    }


    if (
        value.includes(
            "phd"
        ) ||
        value.includes(
            "doctoral"
        ) ||
        value.includes(
            "doctorate"
        )
    ) {

        levels.push(
            "PhD"
        );

    }


    if (
        value.includes(
            "diploma"
        )
    ) {

        levels.push(
            "Diploma"
        );

    }


    if (
        value.includes(
            "high school"
        ) ||
        value.includes(
            "secondary school"
        )
    ) {

        levels.push(
            "High School"
        );

    }


    if (!levels.length) {

        return "See official details";

    }


    return [
        ...new Set(
            levels
        )
    ].join(
        ", "
    );

}


// =========================================
// FUNDING
// =========================================

function extractFunding(
    text
) {

    const value =
        String(
            text || ""
        );


    const lower =
        value.toLowerCase();


    if (
        lower.includes(
            "fully funded"
        )
    ) {

        return "Fully Funded";

    }


    if (
        lower.includes(
            "fully-funded"
        )
    ) {

        return "Fully Funded";

    }


    if (
        lower.includes(
            "tuition"
        ) &&
        lower.includes(
            "stipend"
        )
    ) {

        return "Tuition + Stipend";

    }


    if (
        lower.includes(
            "tuition"
        )
    ) {

        return "Tuition Support";

    }


    if (
        lower.includes(
            "partial funding"
        ) ||
        lower.includes(
            "partially funded"
        )
    ) {

        return "Partially Funded";

    }


    if (
        lower.includes(
            "scholarship"
        )
    ) {

        return "Scholarship";

    }


    return "See official details";

}


// =========================================
// LOCATION
// =========================================

function extractLocation(
    text
) {

    const value =
        String(
            text || ""
        );


    const lower =
        value.toLowerCase();


    if (
        lower.includes(
            "rwanda"
        )
    ) {

        return "Rwanda / Africa";

    }


    if (
        lower.includes(
            "east africa"
        )
    ) {

        return "East Africa";

    }


    if (
        lower.includes(
            "africa"
        ) ||
        lower.includes(
            "african countries"
        )
    ) {

        return "Africa / International";

    }


    return "International";

}


// =========================================
// REQUIREMENTS
// =========================================

function extractRequirements(
    text
) {

    const value =
        String(
            text || ""
        );


    const lower =
        value.toLowerCase();


    const requirements = [];


    if (
        lower.includes(
            "african"
        )
    ) {

        requirements.push(
            "Applicants must meet the stated African eligibility requirements."
        );

    }


    if (
        lower.includes(
            "rwanda"
        )
    ) {

        requirements.push(
            "Rwandan applicants should check the official eligibility requirements."
        );

    }


    if (
        lower.includes(
            "undergraduate"
        ) ||
        lower.includes(
            "bachelor"
        )
    ) {

        requirements.push(
            "Undergraduate eligibility may apply."
        );

    }


    if (
        lower.includes(
            "master"
        )
    ) {

        requirements.push(
            "Masters eligibility may apply."
        );

    }


    if (
        lower.includes(
            "phd"
        ) ||
        lower.includes(
            "doctoral"
        )
    ) {

        requirements.push(
            "Doctoral eligibility may apply."
        );

    }


    if (
        !requirements.length
    ) {

        return "Check the official scholarship eligibility requirements.";

    }


    requirements.push(
        "See the official opportunity page for complete requirements."
    );


    return [
        ...new Set(
            requirements
        )
    ].join(
        "\n"
    );

}


// =========================================
// CLEAN TEXT
// =========================================

function cleanText(
    value
) {

    if (!value) {

        return "";

    }


    const div =
        document.createElement(
            "div"
        );


    div.innerHTML =
        String(
            value
        );


    return (
        div.textContent ||
        div.innerText ||
        ""
    )
        .replace(
            /\s+/g,
            " "
        )
        .trim();

}


// =========================================
// DEDUPLICATE
// =========================================

function deduplicateScholarships(
    list
) {

    const seen =
        new Set();


    return list.filter(
        scholarship => {

            const key =
                `${String(
                    scholarship.title ||
                    ""
                )
                    .toLowerCase()
                    .replace(
                        /\s+/g,
                        " "
                    )
                    .trim()
                }|${String(
                    scholarship.organization ||
                    ""
                )
                    .toLowerCase()
                    .replace(
                        /\s+/g,
                        " "
                    )
                    .trim()
                }`;


            if (
                seen.has(
                    key
                )
            ) {

                return false;

            }


            seen.add(
                key
            );


            return true;

        }
    );

}


// =========================================
// LOAD ALL SOURCES
// =========================================

async function loadScholarships() {

    if (
        !scholarshipsGrid
    ) {

        return;

    }


    scholarshipsGrid.innerHTML = `

        <div class="no-results">

            <h3>
                Loading scholarships...
            </h3>

            <p>
                Checking verified and live opportunities.
            </p>

        </div>

    `;


    try {

        const [
            supabaseScholarships,
            ofaScholarships
        ] = await Promise.all([

            loadSupabaseScholarships(),

            loadOFAScholarships()

        ]);


        // =====================================
        // COMBINE
        // =====================================
        //
        // Supabase first.
        // External opportunities second.
        //
        // Nothing is written back to Supabase.
        // =====================================

        scholarships =
            deduplicateScholarships([

                ...supabaseScholarships,

                ...ofaScholarships

            ]);


        console.log(
            "================================="
        );

        console.log(
            "ROH SCHOLARSHIP SOURCES"
        );

        console.log(
            "Supabase:",
            supabaseScholarships.length
        );

        console.log(
            "Opportunities For Africans:",
            ofaScholarships.length
        );

        console.log(
            "TOTAL:",
            scholarships.length
        );

        console.log(
            "================================="
        );


        visibleScholarships =
            LOAD_MORE_COUNT;


        filterScholarships();


    } catch (error) {

        console.error(
            "Scholarship loading error:",
            error
        );


        const fallback =
            await loadSupabaseScholarships();


        scholarships =
            fallback;


        visibleScholarships =
            LOAD_MORE_COUNT;


        filterScholarships();

    }

}


// =========================================
// DISPLAY
// =========================================

function displayScholarships(
    list
) {

    if (
        !scholarshipsGrid
    ) {

        return;

    }


    scholarshipsGrid.innerHTML =
        "";


    if (
        !list.length
    ) {

        scholarshipsGrid.innerHTML = `

            <div class="no-results">

                <h3>
                    No scholarships found
                </h3>

                <p>
                    Try another search or filter.
                </p>

            </div>

        `;


        if (
            scholarshipCount
        ) {

            scholarshipCount.textContent =
                "0 Opportunities";

        }


        removeLoadMoreButton();


        return;

    }


    const visibleList =
        list.slice(
            0,
            visibleScholarships
        );


    visibleList.forEach(
        scholarship => {

            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "scholarship-card";


            // =================================
            // SOURCE BADGE
            // =================================

            let sourceBadge =
                "";


            if (
                scholarship.source ===
                "Supabase"
            ) {

                sourceBadge = `

                    <span class="verified-badge">
                        ✓ Verified
                    </span>

                `;

            } else {

                sourceBadge = `

                    <span class="verified-badge">
                        🌐 Live
                    </span>

                `;

            }


            // =================================
            // DEADLINE
            // =================================

            const deadlineText =
                scholarship.deadline
                    ? formatDeadline(
                        scholarship.deadline
                    )
                    : "No deadline specified";


            // =================================
            // FUNDING
            // =================================

            const funding =
                scholarship.funding ||
                "Scholarship";


            // =================================
            // DETAILS LINK
            // =================================

            let detailsUrl =
                "";


            if (
                scholarship.isApiScholarship
            ) {

                // =================================
                // API SCHOLARSHIP
                // =================================
                //
                // Store the complete record so
                // opportunity.js can read it.
                // =================================

                const storageKey =
                    `roh-scholarship-${scholarship.id}`;


                try {

                    sessionStorage.setItem(

                        storageKey,

                        JSON.stringify(
                            scholarship
                        )

                    );

                } catch (error) {

                    console.warn(
                        "Could not save scholarship to sessionStorage:",
                        error
                    );

                }


                detailsUrl =
                    `opportunity.html?apiScholarship=${encodeURIComponent(
                        storageKey
                    )}&type=scholarship`;

            } else {

                // =================================
                // SUPABASE SCHOLARSHIP
                // =================================

                detailsUrl =
                    `opportunity.html?id=${encodeURIComponent(
                        scholarship.id
                    )}&type=scholarship`;

            }


            // =================================
            // CARD
            // =================================

            card.innerHTML = `

                <div class="scholarship-card-top">

                    <div class="scholarship-icon">
                        🎓
                    </div>

                    ${sourceBadge}

                </div>


                <h3>
                    ${escapeHtml(
                        scholarship.title
                    )}
                </h3>


                <p class="scholarship-organization">

                    ${escapeHtml(
                        scholarship.organization
                    )}

                </p>


                <div class="scholarship-meta">

                    <span>

                        🎓

                        ${escapeHtml(
                            scholarship.level ||
                            "All Levels"
                        )}

                    </span>


                    <span>

                        📍

                        ${escapeHtml(
                            scholarship.location ||
                            "International"
                        )}

                    </span>


                    <span>

                        💰

                        ${escapeHtml(
                            funding
                        )}

                    </span>

                </div>


                <div class="scholarship-bottom">

                    <span class="scholarship-deadline">

                        Deadline:

                        ${escapeHtml(
                            deadlineText
                        )}

                    </span>


                    <a
                        href="${detailsUrl}"
                    >
                        View Details →
                    </a>

                </div>

            `;


            scholarshipsGrid.appendChild(
                card
            );

        }
    );


    // =========================================
    // COUNT
    // =========================================

    if (
        scholarshipCount
    ) {

        scholarshipCount.textContent =
            `${list.length} Opportunities`;

    }


    // =========================================
    // LOAD MORE
    // =========================================

    updateLoadMoreButton(
        list
    );

}


// =========================================
// LOAD MORE BUTTON
// =========================================

function updateLoadMoreButton(
    list
) {

    removeLoadMoreButton();


    if (
        visibleScholarships >=
        list.length
    ) {

        return;

    }


    const wrapper =
        document.createElement(
            "div"
        );


    wrapper.id =
        "loadMoreScholarshipsWrapper";


    wrapper.style.textAlign =
        "center";

    wrapper.style.margin =
        "30px 0";


    const button =
        document.createElement(
            "button"
        );


    button.id =
        "loadMoreScholarships";


    button.type =
        "button";


    button.textContent =
        "Load More Scholarships";


    button.style.cursor =
        "pointer";


    button.addEventListener(
        "click",
        () => {

            visibleScholarships +=
                LOAD_MORE_COUNT;


            displayScholarships(
                list
            );

        }
    );


    wrapper.appendChild(
        button
    );


    scholarshipsGrid.parentNode
        ?.appendChild(
            wrapper
        );

}


// =========================================
// REMOVE LOAD MORE
// =========================================

function removeLoadMoreButton() {

    const existing =
        document.getElementById(
            "loadMoreScholarshipsWrapper"
        );


    if (
        existing
    ) {

        existing.remove();

    }

}


// =========================================
// DATE FORMAT
// =========================================

function formatDeadline(
    date
) {

    if (!date) {

        return "No deadline specified";

    }


    const parsed =
        new Date(
            `${date}T00:00:00`
        );


    if (
        Number.isNaN(
            parsed.getTime()
        )
    ) {

        return String(
            date
        );

    }


    return parsed.toLocaleDateString(
        "en-US",
        {

            year:
                "numeric",

            month:
                "long",

            day:
                "numeric"

        }
    );

}


// =========================================
// HTML ESCAPE
// =========================================

function escapeHtml(
    value
) {

    return String(
        value || ""
    )

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


// =========================================
// FILTER
// =========================================

function filterScholarships() {

    const searchTerm =
        searchInput

            ? searchInput.value
                .toLowerCase()
                .trim()

            : "";


    const activeFilter =
        document
            .querySelector(
                ".filter-btn.active"
            )
            ?.dataset.filter ||

        "all";


    const filtered =
        scholarships.filter(
            scholarship => {

                const title =
                    scholarship.title
                        ?.toLowerCase() ||
                    "";


                const organization =
                    scholarship.organization
                        ?.toLowerCase() ||
                    "";


                const location =
                    scholarship.location
                        ?.toLowerCase() ||
                    "";


                const level =
                    scholarship.level
                        ?.toLowerCase() ||
                    "";


                const category =
                    scholarship.category
                        ?.toLowerCase() ||
                    "";


                const description =
                    scholarship.description
                        ?.toLowerCase() ||
                    "";


                const requirements =
                    scholarship.requirements
                        ?.toLowerCase() ||
                    "";


                const matchesSearch =
                    title.includes(
                        searchTerm
                    )

                    ||

                    organization.includes(
                        searchTerm
                    )

                    ||

                    location.includes(
                        searchTerm
                    )

                    ||

                    level.includes(
                        searchTerm
                    )

                    ||

                    description.includes(
                        searchTerm
                    )

                    ||

                    requirements.includes(
                        searchTerm
                    );


                let matchesFilter =
                    true;


                // =================================
                // INTERNATIONAL
                // =================================

                if (
                    activeFilter ===
                    "international"
                ) {

                    matchesFilter =

                        category.includes(
                            "international"
                        )

                        ||

                        (
                            location &&
                            !location.includes(
                                "rwanda"
                            )
                        );

                }


                // =================================
                // EDUCATION LEVEL
                // =================================

                else if (
                    activeFilter !==
                    "all"
                ) {

                    matchesFilter =
                        level.includes(
                            activeFilter
                        );

                }


                return (
                    matchesSearch &&
                    matchesFilter
                );

            }
        );


    filteredScholarships =
        filtered;


    // Reset pagination when
    // search/filter changes.

    visibleScholarships =
        LOAD_MORE_COUNT;


    displayScholarships(
        filtered
    );

}


// =========================================
// SEARCH
// =========================================

if (
    searchInput
) {

    searchInput.addEventListener(
        "input",
        filterScholarships
    );

}





// =========================================
// FILTER BUTTONS
// =========================================

filterButtons.forEach(
    button => {

        button.addEventListener(
            "click",
            () => {

                filterButtons.forEach(
                    btn => {

                        btn.classList.remove(
                            "active"
                        );

                    }
                );


                button.classList.add(
                    "active"
                );


                filterScholarships();

            }
        );

    }
);


// =========================================
// START
// =========================================

loadScholarships();

