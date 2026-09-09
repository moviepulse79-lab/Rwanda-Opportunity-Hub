// =========================================
// RWANDA OPPORTUNITY HUB
// TRAINING — SUPABASE + EXTERNAL SOURCES
// =========================================


// =========================================
// DOM ELEMENTS
// =========================================

const trainingsGrid =
    document.getElementById("trainingsGrid");

const trainingSearch =
    document.getElementById("trainingSearch");

const trainingCount =
    document.getElementById("trainingCount");

const trainingFilters =
    document.querySelectorAll(".training-filter");


// =========================================
// GLOBAL DATA
// =========================================

let trainings = [];

let currentTrainingFilter = "all";


// =========================================
// EXTERNAL TRAINING SOURCES
// =========================================
//
// IMPORTANT:
// Only put a URL here when the source provides
// a real browser-accessible JSON feed/API.
//
// Do NOT put private API keys in this file.
//
// Example:
// {
//     name: "Example Training API",
//     url: "https://example.com/api/trainings"
// }
//
// The list is intentionally empty until we
// confirm a real public API/feed.
// =========================================

const externalTrainingFeeds = [

    // Example:
    //
    // {
    //     name: "Training Source",
    //     url: "https://example.com/public/trainings.json"
    // }

];


// =========================================
// SOURCE INFORMATION
// =========================================
//
// These official pages are useful sources,
// but they are NOT treated as fake APIs.
// They can be linked from training records.
// =========================================

const trainingSources = {

    risa: {
        name: "RISA Digital Skills",
        url:
            "https://dev.services.gov.rw/jw/web/userview/DigitalSkillsApp_V2/DigitalSkillsApp_V2/_/courses_to_request"
    },

    rtb: {
        name: "Rwanda TVET Board",
        url:
            "https://www.elearning.rtb.gov.rw/"
    }

};


// =========================================
// HELPERS
// =========================================

function cleanText(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/\s+/g, " ")
        .trim();

}


function normalize(value) {

    return cleanText(value)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim();

}


function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


function formatDate(date) {

    if (!date) {
        return "No deadline";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
        return escapeHTML(date);
    }

    return parsedDate.toLocaleDateString(
        "en-GB",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}


// =========================================
// NORMALIZE SUPABASE TRAINING
// =========================================

function normalizeSupabaseTraining(training) {

    return {

        id:
            training.id,

        title:
            training.title ||
            "Untitled Training",

        organization:
            training.organization ||
            "Organization",

        type:
            "training",

        category:
            training.category ||
            "professional",

        location:
            training.location ||
            "Rwanda",

        country:
            training.country ||
            "Rwanda",

        mode:
            training.mode ||
            "Not specified",

        level:
            training.level ||
            "All Levels",

        duration:
            training.duration ||
            "Not specified",

        deadline:
            training.deadline ||
            "No deadline",

        description:
            training.description ||
            "",

        requirements:
            training.requirements ||
            "",

        link:
            training.link ||
            `opportunity.html?id=${training.id}&type=training`,

        source:
            training.source ||
            "Rwanda Opportunity Hub",

        verified:
            true,

        isExternal:
            false,

        created_at:
            training.created_at ||
            null

    };

}


// =========================================
// NORMALIZE EXTERNAL TRAINING
// =========================================
//
// This allows future public APIs to plug into
// ROH without changing the card system.
// =========================================

function normalizeExternalTraining(
    training,
    sourceName
) {

    return {

        id:
            training.id ||
            `external-${Date.now()}-${Math.random()
                .toString(36)
                .substring(2, 9)}`,

        title:
            training.title ||
            training.name ||
            "Untitled Training",

        organization:
            training.organization ||
            training.provider ||
            training.company ||
            sourceName ||
            "Training Provider",

        type:
            "training",

        category:
            (
                training.category ||
                training.field ||
                training.topic ||
                "professional"
            ).toLowerCase(),

        location:
            training.location ||
            "Rwanda",

        country:
            training.country ||
            "Rwanda",

        mode:
            training.mode ||
            training.delivery_mode ||
            "Not specified",

        level:
            training.level ||
            "All Levels",

        duration:
            training.duration ||
            "Not specified",

        deadline:
            training.deadline ||
            training.application_deadline ||
            "No deadline",

        description:
            training.description ||
            "",

        requirements:
            training.requirements ||
            "",

        link:
            training.link ||
            training.url ||
            "#",

        source:
            training.source ||
            sourceName ||
            "External Source",

        verified:
            training.verified !== false,

        isExternal:
            true,

        created_at:
            training.created_at ||
            null

    };

}


// =========================================
// LOAD EXTERNAL JSON FEEDS
// =========================================

async function loadExternalTrainingFeeds() {

    if (!externalTrainingFeeds.length) {

        console.log(
            "No public training JSON feeds configured."
        );

        return [];

    }


    const results = [];


    for (
        const feed
        of externalTrainingFeeds
    ) {

        try {

            const response =
                await fetch(
                    feed.url,
                    {
                        method: "GET",
                        headers: {
                            "Accept":
                                "application/json"
                        }
                    }
                );


            if (!response.ok) {

                throw new Error(
                    `HTTP ${response.status}`
                );

            }


            const result =
                await response.json();


            /*
                Support several common API shapes:

                [
                    {...},
                    {...}
                ]

                {
                    data: [...]
                }

                {
                    results: [...]
                }

                {
                    opportunities: [...]
                }

                {
                    trainings: [...]
                }
            */

            const records =

                Array.isArray(result)

                    ? result

                    : Array.isArray(result.data)

                        ? result.data

                        : Array.isArray(result.results)

                            ? result.results

                            : Array.isArray(
                                result.opportunities
                            )

                                ? result.opportunities

                                : Array.isArray(
                                    result.trainings
                                )

                                    ? result.trainings

                                    : [];


            const normalized =
                records.map(
                    training =>
                        normalizeExternalTraining(
                            training,
                            feed.name
                        )
                );


            results.push(
                ...normalized
            );


            console.log(
                `${feed.name}: ${normalized.length} trainings`
            );

        }

        catch (error) {

            console.warn(
                `Training source failed: ${feed.name}`,
                error
            );

        }

    }


    return results;

}


// =========================================
// REMOVE DUPLICATES
// =========================================

function removeDuplicateTrainings(
    trainingList
) {

    const unique = [];

    const seen = new Set();


    trainingList.forEach(
        training => {

            const title =
                normalize(
                    training.title
                );

            const organization =
                normalize(
                    training.organization
                );


            const key =
                `${title}-${organization}`;


            if (!seen.has(key)) {

                seen.add(key);

                unique.push(training);

            }

        }
    );


    return unique;

}


// =========================================
// LOAD SUPABASE TRAININGS
// =========================================

async function loadSupabaseTrainings() {

    try {

        const {
            data,
            error
        } = await supabaseClient

            .from("opportunities")

            .select("*")

            .eq(
                "type",
                "training"
            )

            .order(
                "created_at",
                {
                    ascending: false
                }
            );


        if (error) {

            console.error(
                "Supabase trainings error:",
                error
            );

            return [];

        }


        return (
            data || []
        ).map(
            normalizeSupabaseTraining
        );

    }

    catch (error) {

        console.error(
            "Supabase training request failed:",
            error
        );

        return [];

    }

}


// =========================================
// LOAD ALL TRAININGS
// =========================================

async function loadTrainings() {

    if (!trainingsGrid) {
        return;
    }


    trainingsGrid.innerHTML = `

        <div class="no-results">

            <h3>
                Loading training programs...
            </h3>

            <p>
                Finding the latest opportunities.
            </p>

        </div>

    `;


    try {

        // -------------------------------------
        // SUPABASE
        // -------------------------------------

        const supabaseTrainings =
            await loadSupabaseTrainings();


        // -------------------------------------
        // EXTERNAL PUBLIC FEEDS
        // -------------------------------------

        const externalTrainings =
            await loadExternalTrainingFeeds();


        // -------------------------------------
        // COMBINE
        // -------------------------------------

        trainings = [

            ...externalTrainings,

            ...supabaseTrainings

        ];


        // -------------------------------------
        // REMOVE DUPLICATES
        // -------------------------------------

        trainings =
            removeDuplicateTrainings(
                trainings
            );


        // -------------------------------------
        // SORT
        // -------------------------------------
        //
        // Newest records first when a date exists.
        // External records without dates remain.
        // -------------------------------------

        trainings.sort(
            (a, b) => {

                const dateA =
                    new Date(
                        a.created_at || 0
                    ).getTime();


                const dateB =
                    new Date(
                        b.created_at || 0
                    ).getTime();


                return dateB - dateA;

            }
        );


        console.log(
            "TOTAL ROH TRAININGS:",
            trainings.length
        );


        console.log(
            "SUPABASE TRAININGS:",
            supabaseTrainings.length
        );


        console.log(
            "EXTERNAL TRAININGS:",
            externalTrainings.length
        );


        displayTrainings(
            trainings
        );

    }

    catch (error) {

        console.error(
            "Failed to load trainings:",
            error
        );


        trainingsGrid.innerHTML = `

            <div class="no-results">

                <h3>
                    Unable to load training programs
                </h3>

                <p>
                    Please try again later.
                </p>

            </div>

        `;

    }

}


// =========================================
// GET TRAINING CATEGORY
// =========================================

function getTrainingCategory(
    training
) {

    const category =
        normalize(
            training.category
        );


    if (
        category.includes("technology") ||
        category.includes("tech") ||
        category.includes("ict") ||
        category.includes("computer") ||
        category.includes("programming") ||
        category.includes("software") ||
        category.includes("digital")
    ) {

        return "technology";

    }


    if (
        category.includes("business") ||
        category.includes("entrepreneur") ||
        category.includes("management") ||
        category.includes("finance")
    ) {

        return "business";

    }


    if (
        category.includes("design") ||
        category.includes("creative") ||
        category.includes("ui") ||
        category.includes("ux")
    ) {

        return "design";

    }


    if (
        category.includes("vocational") ||
        category.includes("tvet") ||
        category.includes("technical") ||
        category.includes("agriculture") ||
        category.includes("construction") ||
        category.includes("hospitality") ||
        category.includes("manufacturing")
    ) {

        return "vocational";

    }


    return "professional";

}


// =========================================
// DISPLAY TRAININGS
// =========================================

function displayTrainings(
    data
) {

    if (!trainingsGrid) {
        return;
    }


    if (trainingCount) {

        trainingCount.textContent =
            `${data.length} Opportunities`;

    }


    if (!data.length) {

        trainingsGrid.innerHTML = `

            <div class="no-results">

                <h3>
                    No training programs found
                </h3>

                <p>
                    Try another search or category.
                </p>

            </div>

        `;

        return;

    }


    trainingsGrid.innerHTML =

        data.map(
            training => {

                const category =
                    getTrainingCategory(
                        training
                    );


                const isExternal =
                    training.isExternal;


                let detailsLink;


                if (isExternal) {

                    detailsLink =
                        training.link ||
                        "#";

                }

                else {

                    detailsLink =
                        `opportunity.html?id=${encodeURIComponent(
                            training.id
                        )}&type=training`;

                }


                return `

                    <article
                        class="training-card"
                        data-category="${escapeHTML(
                            category
                        )}"
                    >


                        <div class="training-card-top">

                            <div class="training-icon">
                                📚
                            </div>


                            <span class="verified-badge">

                                ✓ Verified

                            </span>

                        </div>


                        <span class="training-type">

                            ${escapeHTML(
                                training.category ||
                                "Training"
                            )}

                        </span>


                        <h3>

                            ${escapeHTML(
                                training.title ||
                                "Untitled Training"
                            )}

                        </h3>


                        <p
                            class="training-organization"
                        >

                            ${escapeHTML(
                                training.organization ||
                                "Organization"
                            )}

                        </p>


                        <div class="training-meta">


                            <span>

                                📍
                                ${escapeHTML(
                                    training.location ||
                                    "Rwanda"
                                )}

                            </span>


                            <span>

                                ⏱
                                ${escapeHTML(
                                    training.duration ||
                                    "Not specified"
                                )}

                            </span>


                            <span>

                                🎓
                                ${escapeHTML(
                                    training.level ||
                                    "All Levels"
                                )}

                            </span>


                        </div>


                        <div
                            class="training-source"
                            style="
                                font-size: 12px;
                                opacity: .75;
                                margin-top: 10px;
                            "
                        >

                            Source:
                            ${escapeHTML(
                                training.source ||
                                "Rwanda Opportunity Hub"
                            )}

                        </div>


                        <div
                            class="training-bottom"
                        >

                            <span
                                class="training-deadline"
                            >

                                Deadline:
                                ${escapeHTML(
                                    training.deadline ||
                                    "No deadline"
                                )}

                            </span>


                            <a
                                href="${escapeHTML(
                                    detailsLink
                                )}"
                                ${isExternal
                                    ? 'target="_blank" rel="noopener noreferrer"'
                                    : ""}
                            >

                                ${isExternal
                                    ? "Apply / View →"
                                    : "View Details →"}

                            </a>


                        </div>


                    </article>

                `;

            }
        ).join("");

}


// =========================================
// FILTER + SEARCH
// =========================================

function filterTrainings() {

    const searchTerm =

        trainingSearch

            ? trainingSearch.value
                .toLowerCase()
                .trim()

            : "";


    const filtered =

        trainings.filter(
            training => {

                const title =
                    normalize(
                        training.title
                    );


                const organization =
                    normalize(
                        training.organization
                    );


                const type =
                    normalize(
                        training.type
                    );


                const location =
                    normalize(
                        training.location
                    );


                const category =
                    normalize(
                        training.category
                    );


                const description =
                    normalize(
                        training.description
                    );


                const source =
                    normalize(
                        training.source
                    );


                const matchesSearch =

                    !searchTerm

                    ||

                    title.includes(
                        searchTerm
                    )

                    ||

                    organization.includes(
                        searchTerm
                    )

                    ||

                    type.includes(
                        searchTerm
                    )

                    ||

                    location.includes(
                        searchTerm
                    )

                    ||

                    category.includes(
                        searchTerm
                    )

                    ||

                    description.includes(
                        searchTerm
                    )

                    ||

                    source.includes(
                        searchTerm
                    );


                const trainingCategory =
                    getTrainingCategory(
                        training
                    );


                const matchesFilter =

                    currentTrainingFilter ===
                    "all"

                    ||

                    trainingCategory ===
                    currentTrainingFilter;


                return (
                    matchesSearch &&
                    matchesFilter
                );

            }
        );


    displayTrainings(
        filtered
    );

}


// =========================================
// SEARCH
// =========================================

if (trainingSearch) {

    trainingSearch.addEventListener(
        "input",
        filterTrainings
    );

}


// =========================================
// FILTER BUTTONS
// =========================================

trainingFilters.forEach(
    button => {

        button.addEventListener(
            "click",
            () => {

                trainingFilters.forEach(
                    btn => {

                        btn.classList.remove(
                            "active"
                        );

                    }
                );


                button.classList.add(
                    "active"
                );


                currentTrainingFilter =
                    button.dataset.filter ||
                    "all";


                filterTrainings();

            }
        );

    }
);


// =========================================
// OPTIONAL SEARCH BUTTON
// =========================================

const trainingSearchButton =
    document.querySelector(
        ".training-search button"
    );


if (trainingSearchButton) {

    trainingSearchButton.addEventListener(
        "click",
        filterTrainings
    );

}


// =========================================
// START
// =========================================

loadTrainings();


// =========================================
// OPTIONAL GLOBAL REFRESH
// =========================================
//
// You can manually call:
// refreshTrainings();
//
// from the browser console.
// =========================================

async function refreshTrainings() {

    console.log(
        "Refreshing ROH training listings..."
    );

    await loadTrainings();

}
