// =========================================
// ROH SCHOLARSHIPS
// SUPABASE + EXTERNAL SCHOLARSHIPS
// =========================================


// =========================================
// DOM
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
// DATA
// =========================================

let scholarships = [];


// =========================================
// EXTERNAL SCHOLARSHIPS
// =========================================
// External sources will be added here.
// We intentionally do NOT put API keys in
// this frontend file.
//
// Example structure:
//
// {
//     id: "external-123",
//     title: "...",
//     organization: "...",
//     level: "Masters",
//     location: "Japan",
//     funding: "Fully Funded",
//     deadline: "...",
//     description: "...",
//     apply_url: "...",
//     source: "HEC Rwanda",
//     isExternal: true
// }


// =========================================
// LOAD SUPABASE SCHOLARSHIPS
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


        return (data || []).map(scholarship => ({

            ...scholarship,

            isExternal: false,

            source:
                scholarship.source ||
                "Rwanda Opportunity Hub"

        }));


    } catch (error) {

        console.error(
            "Failed to load Supabase scholarships:",
            error
        );

        return [];

    }

}


// =========================================
// LOAD EXTERNAL SCHOLARSHIPS
// =========================================
// This function is intentionally separate.
// Later we can connect HEC/API/RSS data here
// without touching the rest of the page.
//
// IMPORTANT:
// Do not put secret API keys in this file.
//
// =========================================

async function loadExternalScholarships() {

    /*
        EXTERNAL SOURCE PLACEHOLDER

        We will connect the real source here.

        The returned objects MUST follow this
        structure:

        {
            id,
            title,
            organization,
            level,
            location,
            funding,
            deadline,
            description,
            apply_url,
            source,
            isExternal: true
        }
    */


    return [];

}


// =========================================
// NORMALIZE SCHOLARSHIP
// =========================================

function normalizeScholarship(scholarship) {

    return {

        ...scholarship,

        title:
            scholarship.title ||
            "Scholarship Opportunity",

        organization:
            scholarship.organization ||
            "Organization not specified",

        level:
            scholarship.level ||
            "All Levels",

        location:
            scholarship.location ||
            "International",

        funding:
            scholarship.funding ||
            "Scholarship",

        deadline:
            scholarship.deadline ||
            "No deadline",

        description:
            scholarship.description ||
            "",

        source:
            scholarship.source ||
            "Rwanda Opportunity Hub",

        apply_url:
            scholarship.apply_url ||
            scholarship.link ||
            "#",

        isExternal:
            scholarship.isExternal === true

    };

}


// =========================================
// DEDUPLICATE
// =========================================

function deduplicateScholarships(list) {

    const seen = new Map();

    list.forEach(scholarship => {

        const title =
            scholarship.title
                ?.toLowerCase()
                .trim()
                .replace(/\s+/g, " ") || "";

        const organization =
            scholarship.organization
                ?.toLowerCase()
                .trim()
                .replace(/\s+/g, " ") || "";

        const key =
            `${title}|${organization}`;


        if (!seen.has(key)) {

            seen.set(
                key,
                scholarship
            );

        }

    });


    return Array.from(
        seen.values()
    );

}


// =========================================
// LOAD EVERYTHING
// =========================================

async function loadScholarships() {

    if (!scholarshipsGrid) return;


    scholarshipsGrid.innerHTML = `
        <div class="no-results">
            <h3>Loading scholarships...</h3>
            <p>
                Finding opportunities for students
                in Rwanda and abroad.
            </p>
        </div>
    `;


    try {

        const [
            supabaseScholarships,
            externalScholarships
        ] = await Promise.all([

            loadSupabaseScholarships(),

            loadExternalScholarships()

        ]);


        const combined = [

            ...supabaseScholarships,

            ...externalScholarships

        ];


        scholarships =
            deduplicateScholarships(
                combined.map(
                    normalizeScholarship
                )
            );


        displayScholarships(
            scholarships
        );


    } catch (error) {

        console.error(
            "Scholarship loading error:",
            error
        );


        scholarshipsGrid.innerHTML = `
            <div class="no-results">
                <h3>Unable to load scholarships</h3>
                <p>
                    Please try again later.
                </p>
            </div>
        `;

    }

}


// =========================================
// DISPLAY
// =========================================

function displayScholarships(list) {

    if (!scholarshipsGrid) return;


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


    list.forEach(scholarship => {

        const card =
            document.createElement("article");


        card.className =
            "scholarship-card";


        // =====================================
        // SOURCE BADGE
        // =====================================

        const badge =
            scholarship.isExternal

                ? `
                    <span class="verified-badge external-badge">
                        🌍 International
                    </span>
                  `

                : `
                    <span class="verified-badge">
                        ✓ Verified
                    </span>
                  `;


        // =====================================
        // DETAILS URL
        // =====================================

        let detailsUrl;


        if (scholarship.isExternal) {

            detailsUrl =
                scholarship.apply_url &&
                scholarship.apply_url !== "#"

                    ? scholarship.apply_url

                    : "#";

        } else {

            detailsUrl =
                `opportunity.html?id=${encodeURIComponent(
                    scholarship.id
                )}&type=scholarship`;

        }


        // =====================================
        // CARD
        // =====================================

        card.innerHTML = `

            <div class="scholarship-card-top">

                <div class="scholarship-icon">
                    🎓
                </div>

                ${badge}

            </div>


            <h3>
                ${escapeHTML(
                    scholarship.title
                )}
            </h3>


            <p class="scholarship-organization">

                ${escapeHTML(
                    scholarship.organization
                )}

            </p>


            <div class="scholarship-meta">

                <span>
                    🎓
                    ${escapeHTML(
                        scholarship.level
                    )}
                </span>


                <span>
                    📍
                    ${escapeHTML(
                        scholarship.location
                    )}
                </span>


                <span>
                    💰
                    ${escapeHTML(
                        scholarship.funding
                    )}
                </span>

            </div>


            <div class="scholarship-bottom">

                <span class="scholarship-deadline">

                    Deadline:
                    ${escapeHTML(
                        scholarship.deadline
                    )}

                </span>


                ${
                    detailsUrl !== "#"

                        ? `
                            <a
                                href="${escapeAttribute(
                                    detailsUrl
                                )}"
                                ${
                                    scholarship.isExternal
                                        ? 'target="_blank" rel="noopener noreferrer"'
                                        : ""
                                }
                            >
                                ${
                                    scholarship.isExternal
                                        ? "Apply / View →"
                                        : "View Details →"
                                }
                            </a>
                          `

                        : `
                            <span>
                                Details unavailable
                            </span>
                          `
                }

            </div>


            ${
                scholarship.isExternal
                    ? `
                        <small class="scholarship-source">
                            Source:
                            ${escapeHTML(
                                scholarship.source
                            )}
                        </small>
                      `
                    : ""
            }

        `;


        scholarshipsGrid.appendChild(card);

    });


    if (scholarshipCount) {

        scholarshipCount.textContent =
            `${list.length} Opportunities`;

    }

}


// =========================================
// SEARCH + FILTER
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
                        ?.toLowerCase() || "";


                const organization =
                    scholarship.organization
                        ?.toLowerCase() || "";


                const location =
                    scholarship.location
                        ?.toLowerCase() || "";


                const level =
                    scholarship.level
                        ?.toLowerCase() || "";


                const funding =
                    scholarship.funding
                        ?.toLowerCase() || "";


                const description =
                    scholarship.description
                        ?.toLowerCase() || "";


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

                    funding.includes(
                        searchTerm
                    )

                    ||

                    description.includes(
                        searchTerm
                    );


                let matchesFilter =
                    true;


                // =================================
                // LEVEL FILTERS
                // =================================

                if (
                    activeFilter !== "all"
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
// SEARCH INPUT
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
// HTML SAFETY
// =========================================

function escapeHTML(value) {

    return String(value || "")
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


function escapeAttribute(value) {

    return escapeHTML(value);

}


// =========================================
// START
// =========================================

loadScholarships();
