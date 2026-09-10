
// =========================================
// ROH SCHOLARSHIPS
// SUPABASE + OPEN SCHOLARSHIPS API + WORQNOW
// =========================================
//
// IMPORTANT:
// - Supabase records are NEVER modified.
// - Your existing 12 scholarships remain untouched.
// - API scholarships are displayed live only.
// - API results are NOT inserted into Supabase.
// =========================================


const scholarshipsGrid =
    document.getElementById("scholarshipsGrid");

const scholarshipCount =
    document.getElementById("scholarshipCount");

const searchInput =
    document.getElementById("scholarshipSearch");

const filterButtons =
    document.querySelectorAll(".filter-btn");


let scholarships = [];


// =========================================
// API SOURCES
// =========================================

const OPEN_SCHOLARSHIPS_API =
    "https://scholarships.grudged.io/api/scholarships?availability=open&limit=50";


const WORQNOW_COUNTRIES = [
    "uk",
    "usa",
    "ca",
    "au",
    "de",
    "ie",
    "nl"
];


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
            .eq("type", "scholarship")
            .order("created_at", {
                ascending: false
            });


        if (error) {

            console.error(
                "Supabase scholarships error:",
                error
            );

            return [];

        }


        return (data || []).map(
            scholarship => ({

                ...scholarship,

                isApiScholarship: false,

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
// LOAD OPEN SCHOLARSHIPS API
// =========================================

async function loadOpenScholarships() {

    try {

        const response =
            await fetch(
                OPEN_SCHOLARSHIPS_API
            );


        if (!response.ok) {

            throw new Error(
                `Open Scholarships API returned ${response.status}`
            );

        }


        const result =
            await response.json();


        const results =
            Array.isArray(result.results)
                ? result.results
                : [];


        console.log(
            "Open Scholarships API:",
            results.length,
            "raw records"
        );


        const normalized =
            results
                .filter(
                    isUsefulOpenScholarship
                )
                .map(
                    normalizeOpenScholarship
                );


        const valid =
            normalized.filter(
                isValidLiveScholarship
            );


        console.log(
            "Open Scholarships API:",
            valid.length,
            "valid current scholarships"
        );


        console.log(
            "Open Scholarships API rejected:",
            normalized.length - valid.length
        );


        return valid;


    } catch (error) {

        console.warn(
            "Open Scholarships API unavailable:",
            error
        );

        return [];

    }

}





// =========================================
// FILTER OPEN SCHOLARSHIPS
// =========================================

function isUsefulOpenScholarship(
    scholarship
) {

    if (!scholarship) {
        return false;
    }


    const eligibility =
        scholarship.eligibility || {};


    const residency =
        Array.isArray(
            eligibility.residency
        )
            ? eligibility.residency
            : [];


    const citizenship =
        Array.isArray(
            eligibility.citizenship
        )
            ? eligibility.citizenship
            : [];


    const residencyText =
        residency
            .join(" ")
            .toLowerCase();


    const citizenshipText =
        citizenship
            .join(" ")
            .toLowerCase();


    /*
     * We do NOT automatically throw away
     * every US record here.
     *
     * The API is currently US-heavy, but
     * some records may have broader eligibility.
     */


    const clearlyUSOnly =

        residency.length > 0 &&
        residency.every(
            country => {

                const value =
                    String(country)
                        .toLowerCase()
                        .trim();

                return (
                    value === "us" ||
                    value === "usa" ||
                    value === "united states"
                );

            }
        );


    const clearlyUSCitizensOnly =

        citizenship.length > 0 &&
        citizenship.every(
            country => {

                const value =
                    String(country)
                        .toLowerCase()
                        .trim();

                return (
                    value === "us" ||
                    value === "usa" ||
                    value === "united states"
                );

            }
        );


    /*
     * Keep records that are not explicitly
     * US-residency/citizenship restricted.
     */

    if (
        clearlyUSOnly ||
        clearlyUSCitizensOnly
    ) {

        return false;

    }


    return true;

}


// =========================================
// NORMALIZE OPEN SCHOLARSHIP
// =========================================

function normalizeOpenScholarship(
    scholarship
) {

    const eligibility =
        scholarship.eligibility || {};

    const award =
        scholarship.award || {};

    const links =
        scholarship.links || {};


    const educationLevels =
        Array.isArray(
            eligibility.education_level
        )
            ? eligibility.education_level
            : [];


    const residency =
        Array.isArray(
            eligibility.residency
        )
            ? eligibility.residency
            : [];


    const other =
        Array.isArray(
            eligibility.other
        )
            ? eligibility.other
            : [];


    let funding =
        "See official details";


    if (
        award.amount_max !== null &&
        award.amount_max !== undefined
    ) {

        const amount =
            Number(
                award.amount_max
            );


        if (!Number.isNaN(amount)) {

            funding =
                `${award.currency || "USD"} ${amount.toLocaleString()}`;

        }

    }


    return {

        id:
            `open-${scholarship.id}`,

        title:
            scholarship.name ||
            "Live Scholarship Opportunity",

        organization:
            scholarship.sponsor ||
            "Listed Scholarship Sponsor",

        type:
            "scholarship",

        description:
            `Live scholarship opportunity from ${
                scholarship.sponsor ||
                "the listed sponsor"
            }.`,

        requirements:
            other.length
                ? other.join("\n")
                : "Check the official scholarship eligibility requirements.",

        deadline:
            scholarship.deadline?.date ||
            scholarship.deadline ||
            null,

       link:
    links.apply_url ||
    null,

        location:
            residency.length
                ? residency.join(", ")
                : "International",

        category:
            "international",

        level:
            educationLevels.length
                ? educationLevels.join(", ")
                : "See official details",

        funding,

        posted:
            scholarship.provenance
                ?.last_verified ||
            null,

        isApiScholarship:
            true,

        source:
            "Open Scholarships",

        apiSource:
            "open-scholarships"

    };

}


// =========================================
// LOAD WORQNOW
// =========================================

async function loadWorqNowScholarships() {

    const allResults = [];


    for (
        const country
        of WORQNOW_COUNTRIES
    ) {

        try {

            const url =
                `https://api.worqnow.ai/education/${country}/scholarships`;


            const response =
                await fetch(url);


            if (!response.ok) {

                console.warn(
                    `WorqNow ${country}: HTTP ${response.status}`
                );

                continue;

            }


            const result =
                await response.json();


            console.log(
                `WorqNow ${country}:`,
                result
            );


            const records =
                extractWorqNowRecords(
                    result
                );


            records.forEach(
                scholarship => {

                    allResults.push(
                        normalizeWorqNowScholarship(
                            scholarship,
                            country
                        )
                    );

                }
            );


        } catch (error) {

            console.warn(
                `WorqNow ${country} unavailable:`,
                error
            );

        }

    }


   const deduplicated =
    deduplicateApiScholarships(
        allResults
    );


const valid =
    deduplicated.filter(
        isValidLiveScholarship
    );


console.log(
    "WorqNow:",
    allResults.length,
    "raw records"
);


console.log(
    "WorqNow:",
    valid.length,
    "valid current scholarships"
);


console.log(
    "WorqNow rejected:",
    deduplicated.length - valid.length
);


return valid;

}


// =========================================
// EXTRACT WORQNOW RECORDS
// =========================================

function extractWorqNowRecords(
    result
) {

    if (
        Array.isArray(result)
    ) {

        return result;

    }


    if (
        Array.isArray(
            result.data
        )
    ) {

        return result.data;

    }


    if (
        Array.isArray(
            result.results
        )
    ) {

        return result.results;

    }


    if (
        Array.isArray(
            result.scholarships
        )
    ) {

        return result.scholarships;

    }


    return [];

}


// =========================================
// NORMALIZE WORQNOW
// =========================================

function normalizeWorqNowScholarship(
    scholarship,
    country
) {

    const title =

        scholarship.title ||
        scholarship.name ||
        scholarship.scholarship_name ||
        "International Scholarship";


    const organization =

        scholarship.organization ||
        scholarship.provider ||
        scholarship.university ||
        scholarship.institution ||
        scholarship.sponsor ||
        "International Institution";


    const description =

        scholarship.description ||
        scholarship.summary ||
        scholarship.details ||
        "See the official scholarship information.";

const deadline =

    scholarship.deadline ||
    scholarship.close_date ||
    scholarship.closing_date ||
    scholarship.application_deadline ||
    scholarship.deadline_date ||
    scholarship.deadlineDate ||
    scholarship.applicationDeadline ||
    scholarship.closeDate ||
    scholarship.close_date_time ||
    null;
 


  const link =

    scholarship.apply_url ||
    scholarship.application_url ||
    null;


    const level =

        scholarship.level ||
        scholarship.degree ||
        scholarship.degree_level ||
        scholarship.study_level ||
        "See official details";


    const funding =

        scholarship.funding ||
        scholarship.amount ||
        scholarship.award ||
        scholarship.value ||
        "See official details";


    const location =

        scholarship.location ||
        scholarship.country ||
        countryName(country);


    const requirements =

        scholarship.requirements ||
        scholarship.eligibility ||
        "Check the official scholarship eligibility requirements.";


    return {

        id:
            `worqnow-${country}-${slugify(title)}`,

        title,

        organization,

        type:
            "scholarship",

        description,

        requirements:

            Array.isArray(requirements)
                ? requirements.join("\n")
                : String(requirements),

        deadline,

        link,

        location,

        category:
            "international",

        level,

        funding:

            Array.isArray(funding)
                ? funding.join(", ")
                : String(funding),

        posted:
            scholarship.posted ||
            scholarship.created_at ||
            null,

        isApiScholarship:
            true,

        source:
            "WorqNow",

        apiSource:
            "worqnow"

    };

}


// =========================================
// COUNTRY NAME
// =========================================

function countryName(
    country
) {

    const names = {

        uk:
            "United Kingdom",

        usa:
            "United States",

        ca:
            "Canada",

        au:
            "Australia",

        de:
            "Germany",

        ie:
            "Ireland",

        nl:
            "Netherlands"

    };


    return (
        names[country] ||
        "International"
    );

}
// =========================================
// LIVE SCHOLARSHIP QUALITY CHECK
// =========================================

function getValidFutureDeadline(value) {

    if (!value) {
        return null;
    }

    // Handle objects such as:
    // { date: "2026-10-06" }
    if (
        typeof value === "object" &&
        value !== null
    ) {

        value =
            value.date ||
            value.value ||
            value.datetime ||
            value.timestamp ||
            null;

    }

    if (!value) {
        return null;
    }

    const text =
        String(value).trim();

    if (!text) {
        return null;
    }

    const date =
        new Date(text);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return null;
    }

    // Reject obviously invalid historical data.
    // ROH should not show old deadlines.
    const currentYear =
        new Date().getFullYear();

    if (
        date.getFullYear() < currentYear
    ) {
        return null;
    }

    // Deadline must still be open.
    const today =
        new Date();

    today.setHours(
        0,
        0,
        0,
        0
    );

    date.setHours(
        23,
        59,
        59,
        999
    );

    if (
        date < today
    ) {
        return null;
    }

    return text;

}


// =========================================
// VALID APPLICATION LINK
// =========================================

function getValidApplicationLink(
    value
) {

    if (!value) {
        return null;
    }

    const text =
        String(value).trim();

    if (
        !text ||
        text === "#" ||
        text.toLowerCase() === "null" ||
        text.toLowerCase() === "undefined"
    ) {
        return null;
    }

    try {

        const url =
            new URL(
                text,
                window.location.origin
            );

        if (
            url.protocol !== "http:" &&
            url.protocol !== "https:"
        ) {
            return null;
        }

        return url.href;

    } catch {

        return null;

    }

}


// =========================================
// FINAL API QUALITY CHECK
// =========================================

function isValidLiveScholarship(
    scholarship
) {

    if (!scholarship) {
        return false;
    }

    const title =
        String(
            scholarship.title || ""
        ).trim();

    const organization =
        String(
            scholarship.organization || ""
        ).trim();

    const deadline =
        getValidFutureDeadline(
            scholarship.deadline
        );

    const link =
        getValidApplicationLink(
            scholarship.link
        );

    if (!title) {
        return false;
    }

    if (!organization) {
        return false;
    }

    // No valid future deadline = reject
    if (!deadline) {
        return false;
    }

    // No real application link = reject
    if (!link) {
        return false;
    }

    return true;

}

// =========================================
// SLUGIFY
// =========================================

function slugify(
    value
) {

    return String(value || "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .substring(0, 80);

}


// =========================================
// DEDUPLICATE API RESULTS
// =========================================

function deduplicateApiScholarships(
    list
) {

    const seen =
        new Set();

    return list.filter(
        scholarship => {

            const key =

                `${String(
                    scholarship.title
                )
                    .toLowerCase()
                    .trim()
                }|${String(
                    scholarship.organization
                )
                    .toLowerCase()
                    .trim()
                }`;


            if (
                seen.has(key)
            ) {

                return false;

            }


            seen.add(key);

            return true;

        }
    );

}


// =========================================
// LOAD ALL SOURCES
// =========================================

async function loadScholarships() {

    if (!scholarshipsGrid) {
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

            openScholarships,

            worqNowScholarships

        ] = await Promise.all([

            loadSupabaseScholarships(),

            loadOpenScholarships(),

            loadWorqNowScholarships()

        ]);


        // =====================================
        // COMBINE WITHOUT MODIFYING SUPABASE
        // =====================================

        scholarships = [

            ...supabaseScholarships,

            ...openScholarships,

            ...worqNowScholarships

        ];


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
            "Open Scholarships:",
            openScholarships.length
        );


        console.log(
            "WorqNow:",
            worqNowScholarships.length
        );


        console.log(
            "TOTAL:",
            scholarships.length
        );


        console.log(
            "================================="
        );


        displayScholarships(
            scholarships
        );


    } catch (error) {

        console.error(
            "Scholarship loading error:",
            error
        );


        // Even if APIs fail,
        // try to keep Supabase visible.

        const fallback =
            await loadSupabaseScholarships();


        scholarships =
            fallback;


        displayScholarships(
            scholarships
        );

    }

}


// =========================================
// DISPLAY
// =========================================

function displayScholarships(
    list
) {

    if (!scholarshipsGrid) {
        return;
    }


    scholarshipsGrid.innerHTML = "";


    if (!list.length) {

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


        if (scholarshipCount) {

            scholarshipCount.textContent =
                "0 Opportunities";

        }


        return;

    }


    list.forEach(
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

            let sourceBadge = "";


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

            let detailsUrl = "";


       if (scholarship.isApiScholarship) {

    const storageKey =
        `roh-scholarship-${scholarship.id}`;

    sessionStorage.setItem(
        storageKey,
        JSON.stringify(scholarship)
    );

    detailsUrl =
        `opportunity.html?apiScholarship=${encodeURIComponent(
            storageKey
        )}&type=scholarship`;

} else {

    detailsUrl =
        `opportunity.html?id=${encodeURIComponent(
            scholarship.id
        )}&type=scholarship`;
} 


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


    if (scholarshipCount) {

        scholarshipCount.textContent =
            `${list.length} Opportunities`;

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
        new Date(date);


    if (
        Number.isNaN(
            parsed.getTime()
        )
    ) {

        return String(date);

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


    displayScholarships(
        filtered
    );

}


// =========================================
// SEARCH
// =========================================

if (searchInput) {

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

