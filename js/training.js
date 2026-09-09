// =========================================
// RWANDA OPPORTUNITY HUB
// TRAINING PAGE
//
// Sources:
// 1. Supabase
// 2. RISA Digital Skills
// 3. Rwanda TVET Board
// =========================================


// =========================================
// DOM
// =========================================

const trainingsGrid =
    document.getElementById("trainingsGrid");

const trainingSearch =
    document.getElementById("trainingSearch");

const trainingCount =
    document.getElementById("trainingCount");

const trainingFilters =
    document.querySelectorAll(
        ".training-filter"
    );


// =========================================
// GLOBAL DATA
// =========================================

let trainings = [];

let currentTrainingFilter =
    "all";

let trainingsPerPage = 12;
let visibleTrainingCount = 12;
// =========================================
// HELPERS
// =========================================

function cleanText(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
        .replace(/\s+/g, " ")
        .trim();

}


function normalize(value) {

    return cleanText(value)
        .toLowerCase()
        .replace(
            /[^a-z0-9]+/g,
            " "
        )
        .trim();

}


function escapeHTML(value) {

    return String(
        value ?? ""
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
// SUPABASE
// =========================================

async function loadSupabaseTrainings() {

    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from(
                    "opportunities"
                )
                .select("*")
                .eq(
                    "type",
                    "training"
                )
                .order(
                    "created_at",
                    {
                        ascending:
                            false
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
            training => ({

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
                    `opportunity.html?id=${encodeURIComponent(
                        training.id
                    )}&type=training`,

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

            })
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
// LIVE EXTERNAL TRAININGS
// =========================================

async function loadLiveTrainings() {

    try {

        const response =
            await fetch(
                "/.netlify/functions/training-feed",
                {
                    method:
                        "GET",

                    headers: {
                        "Accept":
                            "application/json"
                    },

                    cache:
                        "no-store"
                }
            );


        if (!response.ok) {

            throw new Error(
                `Training feed HTTP ${response.status}`
            );

        }


        const result =
            await response.json();


        console.log(
            "LIVE TRAINING FEED:",
            result
        );


        if (
            !result.success
        ) {

            console.warn(
                "Training feed returned unsuccessful response."
            );

            return [];

        }


        const records =
            Array.isArray(
                result.trainings
            )
                ? result.trainings
                : [];


        console.log(
            "RISA TRAININGS:",
            result.sources?.risa ||
            0
        );


        console.log(
            "RTB TRAININGS:",
            result.sources?.rtb ||
            0
        );


        return records.map(
            training => ({

                id:
                    training.id,

                title:
                    training.title ||
                    "Untitled Training",

                organization:
                    training.organization ||
                    "Training Provider",

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
                    "See official source",

                description:
                    training.description ||
                    "",

                requirements:
                    training.requirements ||
                    "",

                link:
                    training.link ||
                    "#",

                source:
                    training.source ||
                    "External Source",

                verified:
                    training.verified !==
                    false,

                isExternal:
                    true,

                created_at:
                    training.created_at ||
                    null,

                seats:
                    training.seats ||
                    "",

                start_date:
                    training.start_date ||
                    ""

            })
        );

    }
    catch (error) {

        console.error(
            "Live training feed failed:",
            error
        );

        return [];

    }

}


// =========================================
// REMOVE DUPLICATES
// =========================================

function removeDuplicateTrainings(
    trainingList
) {

    const unique =
        [];

    const seen =
        new Set();


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


            if (
                !seen.has(key)
            ) {

                seen.add(
                    key
                );

                unique.push(
                    training
                );

            }

        }
    );


    return unique;

}


// =========================================
// CATEGORY
// =========================================

function getTrainingCategory(
    training
) {

    const text =
        normalize(
            [
                training.category,
                training.title,
                training.description,
                training.organization
            ].join(" ")
        );


    // Technology
    if (
        text.includes("technology") ||
        text.includes("technology") ||
        text.includes("ict") ||
        text.includes("computer") ||
        text.includes("programming") ||
        text.includes("software") ||
        text.includes("digital") ||
        text.includes("network") ||
        text.includes("telecommunication") ||
        text.includes("cybersecurity") ||
        text.includes("data science") ||
        text.includes("artificial intelligence") ||
        text.includes("machine learning")
    ) {

        return "technology";

    }


    // Business
    if (
        text.includes("business") ||
        text.includes("entrepreneur") ||
        text.includes("management") ||
        text.includes("finance") ||
        text.includes("accounting") ||
        text.includes("marketing")
    ) {

        return "business";

    }


    // Design
    if (
        text.includes("design") ||
        text.includes("creative") ||
        text.includes("graphic") ||
        text.includes("ui") ||
        text.includes("ux") ||
        text.includes("multimedia")
    ) {

        return "design";

    }


    // Vocational
    if (
        text.includes("vocational") ||
        text.includes("tvet") ||
        text.includes("technical") ||
        text.includes("agriculture") ||
        text.includes("construction") ||
        text.includes("hospitality") ||
        text.includes("tourism") ||
        text.includes("manufacturing") ||
        text.includes("welding") ||
        text.includes("masonry") ||
        text.includes("plumbing") ||
        text.includes("food processing") ||
        text.includes("food and beverage") ||
        text.includes("solar energy")
    ) {

        return "vocational";

    }


    return "professional";

}


// =========================================
// DISPLAY TRAININGS + LOAD MORE
// =========================================

function displayTrainings(data) {

    if (!trainingsGrid) {
        return;
    }

    // Total matching opportunities
    if (trainingCount) {
        trainingCount.textContent =
            `${data.length} Opportunities`;
    }

    // No results
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

        removeLoadMoreButton();

        return;
    }

    // Only show the number currently allowed
    const visibleTrainings =
        data.slice(
            0,
            visibleTrainingCount
        );

    trainingsGrid.innerHTML =
        visibleTrainings.map(
            training => {

                const category =
                    getTrainingCategory(
                        training
                    );

                const isExternal =
                    training.isExternal;

                const detailsLink =
                    isExternal
                        ? training.link || "#"
                        : `opportunity.html?id=${encodeURIComponent(
                            training.id
                          )}&type=training`;

                const actionText =
                    isExternal
                        ? "View / Apply →"
                        : "View Details →";

                const sourceText =
                    training.source ||
                    "Rwanda Opportunity Hub";

                return `

                    <article
                        class="training-card"
                        data-category="${escapeHTML(
                            category
                        )}"
                    >

                        <div
                            class="training-card-top"
                        >

                            <div
                                class="training-icon"
                            >
                                📚
                            </div>

                            <span
                                class="verified-badge"
                            >
                                ✓ Verified
                            </span>

                        </div>


                        <span
                            class="training-type"
                        >
                            ${escapeHTML(
                                category
                            )}
                        </span>


                        <h3>
                            ${escapeHTML(
                                training.title
                            )}
                        </h3>


                        <p
                            class="training-organization"
                        >
                            ${escapeHTML(
                                training.organization
                            )}
                        </p>


                        <div
                            class="training-meta"
                        >

                            <span>
                                📍
                                ${escapeHTML(
                                    training.location
                                )}
                            </span>

                            <span>
                                ⏱
                                ${escapeHTML(
                                    training.duration
                                )}
                            </span>

                            <span>
                                🎓
                                ${escapeHTML(
                                    training.level
                                )}
                            </span>

                        </div>


                        ${
                            training.mode
                                ? `
                                    <div
                                        class="training-mode"
                                        style="
                                            margin-top:8px;
                                            font-size:13px;
                                            opacity:.8;
                                        "
                                    >
                                        💻
                                        ${escapeHTML(
                                            training.mode
                                        )}
                                    </div>
                                  `
                                : ""
                        }


                        ${
                            training.seats
                                ? `
                                    <div
                                        style="
                                            margin-top:6px;
                                            font-size:13px;
                                            opacity:.8;
                                        "
                                    >
                                        👥
                                        ${escapeHTML(
                                            training.seats
                                        )}
                                    </div>
                                  `
                                : ""
                        }


                        <div
                            class="training-source"
                            style="
                                font-size:12px;
                                opacity:.75;
                                margin-top:10px;
                            "
                        >
                            Source:
                            ${escapeHTML(
                                sourceText
                            )}
                        </div>


                        <div
                            class="training-bottom"
                        >

                            <span
                                class="training-deadline"
                            >
                                ${escapeHTML(
                                    training.deadline
                                )}
                            </span>


                            <a
                                href="${escapeHTML(
                                    detailsLink
                                )}"
                                ${
                                    isExternal
                                        ? 'target="_blank" rel="noopener noreferrer"'
                                        : ""
                                }
                            >
                                ${actionText}
                            </a>

                        </div>

                    </article>

                `;

            }
        ).join("");


    // Update Load More button
    updateLoadMoreButton(
        data.length
    );
}


// =========================================
// LOAD MORE BUTTON
// =========================================

function updateLoadMoreButton(
    totalResults
) {

    removeLoadMoreButton();

    // Nothing else to load
    if (
        visibleTrainingCount >=
        totalResults
    ) {
        return;
    }

    const remaining =
        totalResults -
        visibleTrainingCount;

    const button =
        document.createElement(
            "button"
        );

    button.id =
        "loadMoreTrainings";

    button.type =
        "button";

    button.className =
        "load-more-training-btn";

    button.innerHTML = `
        Load More
        <span>
            (${Math.min(
                trainingsPerPage,
                remaining
            )} more)
        </span>
    `;

    button.addEventListener(
        "click",
        () => {

          
visibleTrainingCount +=
    trainingsPerPage;

filterTrainings(false);
        }
    );


    // Put button after the grid
    trainingsGrid.parentNode.insertBefore(
        button,
        trainingsGrid.nextSibling
    );
}


// =========================================
// REMOVE LOAD MORE BUTTON
// =========================================

function removeLoadMoreButton() {

    const existingButton =
        document.getElementById(
            "loadMoreTrainings"
        );

    if (existingButton) {
        existingButton.remove();
    }

}




// =========================================
// FILTER + SEARCH
// =========================================

function filterTrainings(
    resetPagination = true
) {

    const searchTerm =
        trainingSearch
            ? normalize(
                trainingSearch.value
            )
            : "";


    const filtered =
        trainings.filter(
            training => {

                const searchableText =
                    normalize(
                        [
                            training.title,
                            training.organization,
                            training.location,
                            training.category,
                            training.description,
                            training.source,
                            training.level,
                            training.mode
                        ].join(" ")
                    );


                const matchesSearch =
                    !searchTerm ||
                    searchableText.includes(
                        searchTerm
                    );


                const category =
                    getTrainingCategory(
                        training
                    );


                const matchesFilter =
                    currentTrainingFilter ===
                        "all" ||
                    category ===
                        currentTrainingFilter;


                return (
                    matchesSearch &&
                    matchesFilter
                );

            }
        );


    if (resetPagination) {
        visibleTrainingCount = 12;
    }


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
// SEARCH BUTTON
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
// LOAD EVERYTHING
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

        // Load both at the same time
        const [
            supabaseTrainings,
            liveTrainings
        ] =
            await Promise.all([
                loadSupabaseTrainings(),
                loadLiveTrainings()
            ]);


        trainings = [

            ...liveTrainings,

            ...supabaseTrainings

        ];


        trainings =
            removeDuplicateTrainings(
                trainings
            );


        console.log(
            "================================="
        );


        console.log(
            "TOTAL ROH TRAININGS:",
            trainings.length
        );


        console.log(
            "LIVE TRAININGS:",
            liveTrainings.length
        );


        console.log(
            "SUPABASE TRAININGS:",
            supabaseTrainings.length
        );


        console.log(
            "================================="
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
// REFRESH
// =========================================

async function refreshTrainings() {

    console.log(
        "Refreshing ROH training listings..."
    );


    await loadTrainings();

}


// =========================================
// START
// =========================================

loadTrainings();
