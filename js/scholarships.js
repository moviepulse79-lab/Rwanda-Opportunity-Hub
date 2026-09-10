// =========================================
// ROH SCHOLARSHIPS
// SUPABASE + LIVE OPEN SCHOLARSHIPS API
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
// LIVE API
// =========================================

const SCHOLARSHIP_API =
    "https://scholarships.grudged.io/api/scholarships?availability=open&limit=50";


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


        return data || [];

    } catch (error) {

        console.error(
            "Supabase scholarships failed:",
            error
        );

        return [];

    }

}


// =========================================
// LOAD LIVE API SCHOLARSHIPS
// =========================================

async function loadApiScholarships() {

    try {

        const response =
            await fetch(
                SCHOLARSHIP_API
            );


        if (!response.ok) {

            throw new Error(
                `Scholarship API error: ${response.status}`
            );

        }


        const result =
            await response.json();


        const results =
            Array.isArray(result.results)
                ? result.results
                : [];


        console.log(
            "Live scholarship API:",
            result
        );


        // =====================================
        // FILTER API RESULTS
        // =====================================

        const usable =
            results.filter(
                scholarship => {

                    const residency =
                        scholarship
                            .eligibility
                            ?.residency || [];

                    const citizenship =
                        scholarship
                            .eligibility
                            ?.citizenship || [];

                    const tags =
                        scholarship
                            .eligibility
                            ?.tags || [];


                    const residencyText =
                        residency
                            .join(" ")
                            .toLowerCase();


                    const citizenshipText =
                        citizenship
                            .join(" ")
                            .toLowerCase();


                    const tagsText =
                        tags
                            .join(" ")
                            .toLowerCase();


                    // Reject obvious US-only opportunities
                    const usOnly =
                        (
                            residency.length > 0 &&
                            residency.every(
                                country =>
                                    String(country)
                                        .toLowerCase() === "us"
                            )
                        )
                        ||
                        (
                            citizenship.length > 0 &&
                            citizenship.every(
                                country =>
                                    String(country)
                                        .toLowerCase() === "us"
                            )
                        );


                    if (usOnly) {
                        return false;
                    }


                    // Keep worldwide/international opportunities
                    return (
                        residencyText.includes("international") ||
                        residencyText.includes("worldwide") ||
                        residencyText.includes("global") ||
                        tagsText.includes("international") ||
                        tagsText.includes("worldwide") ||
                        tagsText.includes("global") ||
                        residency.length === 0
                    );

                }
            );


        // =====================================
        // CONVERT API FORMAT TO ROH FORMAT
        // =====================================

        return usable.map(
            scholarship => {

                const educationLevels =
                    scholarship
                        .eligibility
                        ?.education_level || [];


                const residency =
                    scholarship
                        .eligibility
                        ?.residency || [];


                const otherEligibility =
                    scholarship
                        .eligibility
                        ?.other || [];


                const award =
                    scholarship.award || {};


                const deadline =
                    scholarship.deadline || {};


                const links =
                    scholarship.links || {};


                let level =
                    educationLevels.length
                        ? educationLevels.join(", ")
                        : "See official details";


                let location =
                    residency.length
                        ? residency.join(", ")
                        : "International";


                let awardText =
                    "";


                if (
                    award.amount_max !== null &&
                    award.amount_max !== undefined
                ) {

                    awardText =
                        `${award.currency || ""} ${award.amount_max.toLocaleString()}`;

                } else {

                    awardText =
                        "See official details";

                }


                let requirements =
                    otherEligibility.length
                        ? otherEligibility.join("\n")
                        : "Check the official scholarship eligibility requirements.";


                return {

                    id:
                        `api-${scholarship.id}`,

                    title:
                        scholarship.name ||
                        "Scholarship Opportunity",

                    organization:
                        scholarship.sponsor ||
                        "Unknown Organization",

                    type:
                        "scholarship",

                    description:
                        `Live scholarship opportunity from ${scholarship.sponsor || "the listed sponsor"}.`,

                    requirements,

                    deadline:
                        deadline.date ||
                        null,

                    link:
                        links.apply_url ||
                        links.info_url ||
                        "#",

                    location,

                    category:
                        "international",

                    duration:
                        null,

                    level,

                    posted:
                        scholarship.provenance
                            ?.last_verified ||
                        null,

                    funding:
                        awardText,

                    isApiScholarship:
                        true,

                    apiId:
                        scholarship.id,

                    sourceUrl:
                        links.info_url ||
                        scholarship.provenance
                            ?.source_url ||
                        "",

                    availability:
                        scholarship.availability ||
                        scholarship.status ||
                        "active"

                };

            }
        );


    } catch (error) {

        console.error(
            "Live scholarship API failed:",
            error
        );

        return [];

    }

}


// =========================================
// LOAD EVERYTHING
// =========================================

async function loadScholarships() {

    if (!scholarshipsGrid) {
        return;
    }


    scholarshipsGrid.innerHTML = `
        <div class="no-results">
            <h3>Loading scholarships...</h3>
            <p>Checking available opportunities.</p>
        </div>
    `;


    try {

        const [
            supabaseScholarships,
            apiScholarships
        ] = await Promise.all([

            loadSupabaseScholarships(),

            loadApiScholarships()

        ]);


        // =====================================
        // COMBINE BOTH SOURCES
        // =====================================

        scholarships = [
            ...supabaseScholarships,
            ...apiScholarships
        ];


        console.log(
            "Supabase scholarships:",
            supabaseScholarships.length
        );


        console.log(
            "Live API scholarships:",
            apiScholarships.length
        );


        console.log(
            "Total scholarships:",
            scholarships.length
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
                <p>Please try again later.</p>
            </div>
        `;

    }

}


// =========================================
// DISPLAY SCHOLARSHIPS
// =========================================

function displayScholarships(list) {

    if (!scholarshipsGrid) {
        return;
    }


    scholarshipsGrid.innerHTML = "";


    if (!list.length) {

        scholarshipsGrid.innerHTML = `
            <div class="no-results">
                <h3>No scholarships found</h3>
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
            // API / MANUAL BADGE
            // =================================

            const sourceBadge =
                scholarship.isApiScholarship
                    ? `
                        <span class="verified-badge">
                            🌐 Live
                        </span>
                    `
                    : `
                        <span class="verified-badge">
                            ✓ Verified
                        </span>
                    `;


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
                        href="opportunity.html?id=${encodeURIComponent(
                            scholarship.id
                        )}&type=scholarship"
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
// FORMAT DEADLINE
// =========================================

function formatDeadline(date) {

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
            year: "numeric",
            month: "long",
            day: "numeric"
        }
    );

}


// =========================================
// ESCAPE HTML
// =========================================

function escapeHtml(value) {

    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// =========================================
// FILTER SCHOLARSHIPS
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
