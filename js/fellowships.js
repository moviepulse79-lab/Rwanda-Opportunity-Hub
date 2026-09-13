// =========================================
// RWANDA OPPORTUNITY HUB
// FELLOWSHIPS - SUPABASE + CHANCEHUB + GRANTS.GOV
// =========================================


// =========================================
// ELEMENTS
// =========================================

const fellowshipsGrid =
    document.getElementById("fellowshipsGrid");

const fellowshipSearch =
    document.getElementById("fellowshipSearch");

const fellowshipCount =
    document.getElementById("fellowshipCount");

const fellowshipFilters =
    document.querySelectorAll(".fellowship-filter");


let fellowships = [];

let currentFilter = "all";


// =========================================
// API SOURCES
// =========================================

// SOURCE 1
// ChanceHub public opportunities API
const CHANCEHUB_API =
    "https://chancehub.ai/api/opportunities";


// SOURCE 2
// Grants.gov public Search2 API
const GRANTS_API =
    "https://api.grants.gov/v1/api/search2";


// =========================================
// ESCAPE HTML
// =========================================

function escapeHtml(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// =========================================
// SAFE URL
// =========================================

function safeUrl(value) {

    if (!value) {
        return "";
    }

    try {

        const url =
            new URL(value);

        if (
            url.protocol === "http:" ||
            url.protocol === "https:"
        ) {
            return url.href;
        }

    } catch (error) {

        return "";

    }

    return "";

}


// =========================================
// NORMALIZE TEXT
// =========================================

function normalizeText(value) {

    return String(value || "")
        .trim()
        .toLowerCase();

}


// =========================================
// NORMALIZE SUPABASE FELLOWSHIP
// =========================================

function normalizeSupabaseFellowship(item) {

    return {

        id:
            `supabase-${item.id}`,

        originalId:
            item.id,

        title:
            item.title ||
            "Untitled Fellowship",

        organization:
            item.organization ||
            "Organization",

        type:
            "Fellowship",

        location:
            item.location ||
            "International",

        duration:
            item.duration ||
            "Not specified",

        level:
            item.level ||
            "All Levels",

        deadline:
            item.deadline ||
            "No deadline",

        description:
            item.description ||
            "",

        requirements:
            item.requirements ||
            "",

        category:
            item.category ||
            "Fellowship",

        link:
            safeUrl(item.link),

        source:
            "Supabase",

        sourceType:
            "supabase",

        verified:
            true

    };

}


// =========================================
// LOAD SUPABASE FELLOWSHIPS
// =========================================

async function loadSupabaseFellowships() {

    try {

        const {
            data,
            error
        } = await supabaseClient
            .from("opportunities")
            .select("*")
            .eq("type", "fellowship")
            .order("created_at", {
                ascending: false
            });


        if (error) {

            console.error(
                "Supabase fellowship error:",
                error
            );

            return [];

        }


        return (data || [])
            .map(
                normalizeSupabaseFellowship
            );


    } catch (error) {

        console.error(
            "Supabase fellowship exception:",
            error
        );

        return [];

    }

}


// =========================================
// LOAD CHANCEHUB
// =========================================

async function loadChanceHubFellowships() {

    try {

        const response =
            await fetch(
                `${CHANCEHUB_API}?locale=en&limit=100`,
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
                `ChanceHub HTTP ${response.status}`
            );

        }


        const result =
            await response.json();


        console.log(
            "ChanceHub response:",
            result
        );


        let records = [];


        if (Array.isArray(result)) {

            records = result;

        }

        else if (
            Array.isArray(result.data)
        ) {

            records = result.data;

        }

        else if (
            Array.isArray(result.results)
        ) {

            records = result.results;

        }

        else if (
            Array.isArray(result.opportunities)
        ) {

            records =
                result.opportunities;

        }


        // =====================================
        // KEEP FELLOWSHIP-RELATED RESULTS
        // =====================================

        const fellowshipRecords =
            records.filter(item => {

                const text = normalizeText(
                    [
                        item.title,
                        item.name,
                        item.type,
                        item.category,
                        item.description,
                        item.summary,
                        item.tags
                    ]
                    .filter(Boolean)
                    .join(" ")
                );


                return (
                    text.includes("fellowship") ||
                    text.includes("fellowships")
                );

            });


        return fellowshipRecords.map(
            item => {

                const title =
                    item.title ||
                    item.name ||
                    "Fellowship Opportunity";


                const organization =
                    item.organization ||
                    item.organisation ||
                    item.provider ||
                    item.host ||
                    "ChanceHub";


                const location =
                    item.location ||
                    item.country ||
                    item.city ||
                    "International";


                const link =
                    safeUrl(
                        item.url ||
                        item.link ||
                        item.source_url ||
                        item.application_url
                    );


                return {

                    id:
                        `chancehub-${item.id || title}`,

                    originalId:
                        item.id || title,

                    title,

                    organization,

                    type:
                        "Fellowship",

                    location,

                    duration:
                        item.duration ||
                        "Not specified",

                    level:
                        item.level ||
                        item.education_level ||
                        "All Levels",

                    deadline:
                        item.deadline ||
                        item.close_date ||
                        item.closing_date ||
                        "No deadline",

                    description:
                        item.description ||
                        item.summary ||
                        "",

                    requirements:
                        item.requirements ||
                        "",

                    category:
                        item.category ||
                        "Fellowship",

                    link,

                    source:
                        "ChanceHub",

                    sourceType:
                        "chancehub",

                    verified:
                        false

                };

            }
        );


    } catch (error) {

        console.error(
            "ChanceHub fellowship error:",
            error
        );

        return [];

    }

}


// =========================================
// LOAD GRANTS.GOV FELLOWSHIPS
// =========================================

async function loadGrantsGovFellowships() {

    try {

        const requestBody = {

            rows: 50,

            keyword:
                "fellowship",

            oppStatuses:
                "posted|forecasted",

            eligibilities:
                "",

            agencies:
                "",

            aln:
                "",

            fundingCategories:
                ""

        };


        const response =
            await fetch(
                GRANTS_API,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Accept":
                            "application/json"
                    },

                    body:
                        JSON.stringify(
                            requestBody
                        )
                }
            );


        if (!response.ok) {

            throw new Error(
                `Grants.gov HTTP ${response.status}`
            );

        }


        const result =
            await response.json();


        console.log(
            "Grants.gov response:",
            result
        );


        const records =
            result?.data?.oppHits || [];


        return records.map(
            item => {

                const title =
                    item.title ||
                    "Fellowship Opportunity";


                const organization =
                    item.agencyName ||
                    item.agencyCode ||
                    "Grants.gov";


                const deadline =
                    item.closeDate ||
                    "No deadline";


                const applicationUrl =
                    item.id
                        ? `https://www.grants.gov/search-results-detail/${encodeURIComponent(item.id)}`
                        : "";


                return {

                    id:
                        `grants-${item.id || item.number || title}`,

                    originalId:
                        item.id ||
                        item.number,

                    title,

                    organization,

                    type:
                        "Fellowship",

                    location:
                        "United States",

                    duration:
                        "Not specified",

                    level:
                        "All Levels",

                    deadline,

                    description:
                        `Fellowship-related opportunity from ${organization}.`,

                    requirements:
                        "",

                    category:
                        "Fellowship",

                    link:
                        safeUrl(
                            applicationUrl
                        ),

                    source:
                        "Grants.gov",

                    sourceType:
                        "grants",

                    verified:
                        false

                };

            }
        );


    } catch (error) {

        console.error(
            "Grants.gov fellowship error:",
            error
        );

        return [];

    }

}


// =========================================
// DEDUPLICATE FELLOWSHIPS
// =========================================

function deduplicateFellowships(
    data
) {

    const seen =
        new Map();


    data.forEach(
        fellowship => {

            const title =
                normalizeText(
                    fellowship.title
                );

            const organization =
                normalizeText(
                    fellowship.organization
                );


            const key =
                `${title}|${organization}`;


            if (!seen.has(key)) {

                seen.set(
                    key,
                    fellowship
                );

            }

        }
    );


    return Array.from(
        seen.values()
    );

}


// =========================================
// LOAD ALL FELLOWSHIPS
// =========================================

async function loadFellowships() {

    if (!fellowshipsGrid) {
        return;
    }


    fellowshipsGrid.innerHTML = `

        <div class="no-results">

            <h3>
                Loading fellowships...
            </h3>

            <p>
                Checking verified and live sources.
            </p>

        </div>

    `;


    const [

        supabaseFellowships,

        chanceHubFellowships,

        grantsFellowships

    ] = await Promise.all([

        loadSupabaseFellowships(),

        loadChanceHubFellowships(),

        loadGrantsGovFellowships()

    ]);


    console.log(
        "Supabase fellowships:",
        supabaseFellowships.length
    );

    console.log(
        "ChanceHub fellowships:",
        chanceHubFellowships.length
    );

    console.log(
        "Grants.gov fellowships:",
        grantsFellowships.length
    );


    // =====================================
    // COMBINE ALL SOURCES
    // =====================================

    fellowships =
        deduplicateFellowships([

            ...supabaseFellowships,

            ...chanceHubFellowships,

            ...grantsFellowships

        ]);


    console.log(
        "Total fellowships after deduplication:",
        fellowships.length
    );


    displayFellowships(
        fellowships
    );

}


// =========================================
// DISPLAY FELLOWSHIPS
// =========================================

function displayFellowships(data) {

    if (!fellowshipsGrid) {
        return;
    }


    if (fellowshipCount) {

        fellowshipCount.textContent =
            `${data.length} Opportunities`;

    }


    if (!data.length) {

        fellowshipsGrid.innerHTML = `

            <div class="no-results">

                <h3>
                    No fellowships found
                </h3>

                <p>
                    Try another search or category.
                </p>

            </div>

        `;

        return;

    }


    fellowshipsGrid.innerHTML =

        data.map(
            fellowship => {


                // =================================
                // SOURCE BADGE
                // =================================

                let sourceBadge = "";


                if (
                    fellowship.sourceType ===
                    "supabase"
                ) {

                    sourceBadge = `

                        <span
                            class="verified-badge"
                            style="
                                background:#087f5b;
                                color:#fff;
                            "
                        >
                            ✓ Verified
                        </span>

                    `;

                }

                else if (
                    fellowship.sourceType ===
                    "chancehub"
                ) {

                    sourceBadge = `

                        <span
                            class="verified-badge"
                            style="
                                background:#2563eb;
                                color:#fff;
                            "
                        >
                            🌐 ChanceHub
                        </span>

                    `;

                }

                else if (
                    fellowship.sourceType ===
                    "grants"
                ) {

                    sourceBadge = `

                        <span
                            class="verified-badge"
                            style="
                                background:#7c3aed;
                                color:#fff;
                            "
                        >
                            🇺🇸 Grants.gov
                        </span>

                    `;

                }


                // =================================
                // ACTION BUTTON
                // =================================

                let actionButton = "";


                if (
                    fellowship.sourceType ===
                    "supabase"
                ) {

                    actionButton = `

                        <a
                            href="opportunity.html?id=${encodeURIComponent(
                                fellowship.originalId
                            )}&type=fellowship"
                        >
                            View Details →
                        </a>

                    `;

                }

                else if (
                    fellowship.link
                ) {

                    actionButton = `

                        <a
                            href="${escapeHtml(
                                fellowship.link
                            )}"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Apply / View →
                        </a>

                    `;

                }

                else {

                    actionButton = `

                        <span>
                            Details unavailable
                        </span>

                    `;

                }


                return `

                    <article
                        class="fellowship-card"
                    >


                        <div
                            class="fellowship-card-top"
                        >

                            <div
                                class="fellowship-icon"
                            >
                                🤝
                            </div>

                            ${sourceBadge}

                        </div>


                        <span
                            class="fellowship-type"
                        >
                            Fellowship
                        </span>


                        <h3>
                            ${escapeHtml(
                                fellowship.title
                            )}
                        </h3>


                        <p
                            class="fellowship-organization"
                        >
                            ${escapeHtml(
                                fellowship.organization
                            )}
                        </p>


                        <div
                            class="fellowship-meta"
                        >

                            <span>
                                📍
                                ${escapeHtml(
                                    fellowship.location
                                )}
                            </span>


                            <span>
                                ⏱
                                ${escapeHtml(
                                    fellowship.duration
                                )}
                            </span>


                            <span>
                                🎓
                                ${escapeHtml(
                                    fellowship.level
                                )}
                            </span>

                        </div>


                        <div
                            class="fellowship-bottom"
                        >

                            <span
                                class="fellowship-deadline"
                            >

                                Deadline:
                                ${escapeHtml(
                                    fellowship.deadline
                                )}

                            </span>


                            ${actionButton}

                        </div>


                    </article>

                `;

            }
        ).join("");

}


// =========================================
// FILTER FELLOWSHIPS
// =========================================

function filterFellowships() {

    const searchTerm =

        fellowshipSearch

            ? fellowshipSearch.value
                .toLowerCase()
                .trim()

            : "";


    const filtered =

        fellowships.filter(
            fellowship => {


                const title =
                    normalizeText(
                        fellowship.title
                    );


                const organization =
                    normalizeText(
                        fellowship.organization
                    );


                const type =
                    normalizeText(
                        fellowship.type
                    );


                const location =
                    normalizeText(
                        fellowship.location
                    );


                const category =
                    normalizeText(
                        fellowship.category
                    );


                const level =
                    normalizeText(
                        fellowship.level
                    );


                const description =
                    normalizeText(
                        fellowship.description
                    );


                const source =
                    normalizeText(
                        fellowship.source
                    );


                // =================================
                // SEARCH
                // =================================

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

                    level.includes(
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


                // =================================
                // FILTER
                // =================================

                let matchesFilter =
                    true;


                if (
                    currentFilter !==
                    "all"
                ) {

                    const filter =
                        normalizeText(
                            currentFilter
                        );


                    matchesFilter =

                        type.includes(
                            filter
                        )

                        ||

                        category.includes(
                            filter
                        )

                        ||

                        location.includes(
                            filter
                        )

                        ||

                        level.includes(
                            filter
                        )

                        ||

                        source.includes(
                            filter
                        )

                        ||

                        description.includes(
                            filter
                        );

                }


                return (
                    matchesSearch &&
                    matchesFilter
                );

            }
        );


    displayFellowships(
        filtered
    );

}


// =========================================
// SEARCH
// =========================================

if (fellowshipSearch) {

    fellowshipSearch.addEventListener(
        "input",
        filterFellowships
    );

}


// =========================================
// FILTER BUTTONS
// =========================================

fellowshipFilters.forEach(
    button => {

        button.addEventListener(
            "click",
            () => {


                fellowshipFilters.forEach(
                    btn => {

                        btn.classList.remove(
                            "active"
                        );

                    }
                );


                button.classList.add(
                    "active"
                );


                currentFilter =
                    button.dataset.filter ||
                    "all";


                filterFellowships();

            }
        );

    }
);


// =========================================
// START
// =========================================

loadFellowships();
