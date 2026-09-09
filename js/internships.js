const loadMoreInternships =
    document.getElementById("loadMoreInternships");

const INTERNSHIPS_PER_PAGE = 12;

let displayedInternshipCount =
    INTERNSHIPS_PER_PAGE;

// =========================================
// INTERNSHIPS
// SUPABASE + JOB OPPORTUNITIES API
// =========================================

const internshipsGrid =
    document.getElementById("internshipsGrid");

const internshipCount =
    document.getElementById("internshipCount");

const internshipSearch =
    document.getElementById("internshipSearch");

const internshipFilters =
    document.querySelectorAll(".internship-filter");

let internships = [];




if (loadMoreInternships) {

    loadMoreInternships.addEventListener(
        "click",
        () => {

            displayedInternshipCount +=
                INTERNSHIPS_PER_PAGE;

            displayInternships.isFiltering = true;

            displayInternships(
                getCurrentFilteredInternships()
            );

            displayInternships.isFiltering = false;

        }
    );

}


function getCurrentFilteredInternships() {

    const searchTerm =
        internshipSearch
            ? internshipSearch.value
                .toLowerCase()
                .trim()
            : "";

    const activeFilter =
        document
            .querySelector(
                ".internship-filter.active"
            )
            ?.dataset
            ?.filter
            ?.toLowerCase()
            .trim() || "all";


    return internships.filter(
        internship => {

            const title =
                String(
                    internship.title || ""
                ).toLowerCase();

            const organization =
                String(
                    internship.organization || ""
                ).toLowerCase();

            const field =
                String(
                    internship.field || ""
                ).toLowerCase();

            const category =
                String(
                    internship.category || ""
                ).toLowerCase();

            const location =
                String(
                    internship.location || ""
                ).toLowerCase();


            const matchesSearch =
                !searchTerm ||
                title.includes(searchTerm) ||
                organization.includes(searchTerm) ||
                field.includes(searchTerm) ||
                category.includes(searchTerm) ||
                location.includes(searchTerm);


            let matchesFilter = true;


            if (activeFilter !== "all") {

                matchesFilter =
                    field.includes(activeFilter) ||
                    category.includes(activeFilter) ||
                    title.includes(activeFilter);

            }


            return (
                matchesSearch &&
                matchesFilter
            );

        }
    );

}
// =========================================
// LOAD INTERNSHIPS
// =========================================
async function loadInternships() {

    if (!internshipsGrid) return;

    internshipsGrid.innerHTML = `
        <div class="no-results">
            <h3>Loading internships...</h3>
            <p>Finding internship opportunities...</p>
        </div>
    `;

    // =========================================
    // SUPABASE INTERNSHIPS
    // =========================================

    let supabaseInternships = [];

    try {

        const {
            data,
            error
        } = await supabaseClient
            .from("opportunities")
            .select("*")
            .eq("type", "internship")
            .order("created_at", {
                ascending: false
            });

        if (error) {

            console.error(
                "Supabase internships error:",
                error
            );

        } else {

            supabaseInternships = data || [];

        }

    } catch (error) {

        console.error(
            "Supabase loading failed:",
            error
        );

    }


   // =========================================
// API INTERNSHIPS
// =========================================

let apiInternships = [];

try {

    const apiUrls = [

        // Normal Rwanda jobs
        "https://api.jobopportunitiesapi.org/public/jobs?country=RW&limit=50",

        // Rwanda internship classification
        "https://api.jobopportunitiesapi.org/public/jobs?country=RW&employment_type=Internship&limit=50",

        // Rwanda intern seniority
        "https://api.jobopportunitiesapi.org/public/jobs?country=RW&seniority=Intern&limit=50"

    ];

    const responses = await Promise.all(
        apiUrls.map(url =>
            fetch(url)
                .then(res => {
                    if (!res.ok) {
                        throw new Error(
                            `API error ${res.status}`
                        );
                    }

                    return res.json();
                })
                .catch(error => {

                    console.error(
                        "API request failed:",
                        error
                    );

                    return {
                        data: []
                    };

                })
        )
    );


    // =========================================
    // COMBINE ALL API RESULTS
    // =========================================

    let allJobs = [];

    responses.forEach(result => {

        if (Array.isArray(result.data)) {

            allJobs.push(
                ...result.data
            );

        }

    });


    console.log(
        "TOTAL RAW RW API JOBS:",
        allJobs.length
    );


    // =========================================
    // REMOVE DUPLICATES
    // =========================================

    const uniqueJobs = [];

    const seenIds = new Set();

    allJobs.forEach(job => {

        const id =
            job.id ||
            job.slug ||
            `${job.company}-${job.title}`;

        if (seenIds.has(id)) {
            return;
        }

        seenIds.add(id);

        uniqueJobs.push(job);

    });


    console.log(
        "UNIQUE RW API JOBS:",
        uniqueJobs.length
    );


    // =========================================
    // FIND INTERNSHIPS
    // =========================================

    apiInternships = uniqueJobs
        .filter(job => {

            const title =
                String(
                    job.title || ""
                ).toLowerCase();

            const employment =
                String(
                    job.employment_type || ""
                ).toLowerCase();

            const seniority =
                String(
                    job.seniority || ""
                ).toLowerCase();


            return (

                employment.includes("intern") ||

                seniority === "intern" ||

                title.includes("intern") ||

                title.includes("trainee") ||

                title.includes("attachment") ||

                title.includes("graduate programme") ||

                title.includes("graduate program") ||

                title.includes("graduate trainee")

            );

        })
        .map(job => ({

            id:
                `api-internship-${job.id}`,

            api_id:
                job.id,

            slug:
                job.slug,

            title:
                job.title ||
                "Untitled Internship",

            organization:
                job.company ||
                "Unknown Organization",

            type:
                "internship",

            location:
                job.location ||
                job.city ||
                "Rwanda",

            field:
                job.category ||
                "Not specified",

            category:
                job.category ||
                "",

            duration:
                job.duration ||
                "Not specified",

            deadline:
                job.deadline ||
                null,

            description:
                job.description ||
                "",

            posted_date:
                job.posted_at ||
                null,

            apply_url:
                job.apply_url ||
                "",

            company_logo:
                job.company_logo ||
                "",

            source:
                job.source ||
                "",

            employment_type:
                job.employment_type ||
                "",

            seniority:
                job.seniority ||
                "",

            isApiJob:
                true,

            isApiInternship:
                true

        }));


    console.log(
        "API INTERNSHIPS LOADED:",
        apiInternships.length
    );


    // VERY IMPORTANT:
    // See exactly what the API is returning
    console.table(
        uniqueJobs.map(job => ({
            title: job.title,
            company: job.company,
            employment: job.employment_type,
            seniority: job.seniority,
            category: job.category
        }))
    );


} catch (error) {

    console.error(
        "API internship loading failed:",
        error
    );

}
// =========================================
// SECOND API - HOPIN INTERNSHIPS
// =========================================

let hopinInternships = [];

try {

    const response = await fetch(
        "https://api.hopinjobs.com/api/internships?is_unofficial=true"
    );

    if (!response.ok) {
        throw new Error(
            `Hopin API failed: ${response.status}`
        );
    }

    const result = await response.json();

    console.log(
        "HOPIN RAW INTERNSHIPS:",
        result
    );

    const jobs =
        result.internships ||
        result.data ||
        [];

    hopinInternships = jobs.map(job => ({

        id:
            `hopin-internship-${job.id}`,

        api_id:
            job.id,

        slug:
            job.slug,

        title:
            job.title ||
            "Untitled Internship",

        organization:
            job.company?.name ||
            job.company ||
            "Unknown Organization",

        type:
            "internship",

        location:
            job.location ||
            job.city ||
            job.country ||
            "Remote",

        field:
            job.industry ||
            job.category ||
            "Not specified",

        category:
            job.category ||
            job.industry ||
            "",

        duration:
            job.duration ||
            "Not specified",

        deadline:
            job.deadline ||
            null,

        description:
            job.description ||
            "",

        posted_date:
            job.posted_at ||
            job.created_at ||
            null,

        apply_url:
            job.apply_url ||
            job.url ||
            job.application_url ||
            "",

        company_logo:
            job.company_logo ||
            job.company?.logo ||
            "",

        source:
            "Hopin Jobs",

        stipend:
            job.stipend ||
            null,

        isApiJob:
            true,

        isApiInternship:
            true,

        apiSource:
            "hopin"

    }));


    console.log(
        "HOPIN INTERNSHIPS LOADED:",
        hopinInternships.length
    );

} catch (error) {

    console.error(
        "Hopin internship API failed:",
        error
    );

}


    // =========================================
    // COMBINE API + SUPABASE
    // =========================================

    internships = [
    ...apiInternships,
    ...hopinInternships,
    ...supabaseInternships
];


    // =========================================
    // REMOVE DUPLICATES
    // =========================================

    const seen = new Set();

    internships =
        internships.filter(internship => {

            const title =
                String(
                    internship.title || ""
                )
                    .toLowerCase()
                    .trim();

            const organization =
                String(
                    internship.organization || ""
                )
                    .toLowerCase()
                    .trim();

            const key =
                `${title}|${organization}`;

            if (seen.has(key)) {
                return false;
            }

            seen.add(key);

            return true;

        });


    console.log(
        "TOTAL INTERNSHIPS:",
        internships.length
    );


    // =========================================
    // DISPLAY
    // =========================================

    displayInternships(internships);
}


function displayInternships(list) {

    if (!internshipsGrid) return;

    if (internshipCount) {
        internshipCount.textContent =
            `${list.length} Opportunities`;
    }

    if (!list.length) {

        internshipsGrid.innerHTML = `
            <div class="no-results">
                <h3>No internships found</h3>
                <p>
                    There are currently no internship
                    opportunities available.
                </p>
            </div>
        `;

        if (loadMoreInternships) {
            loadMoreInternships.style.display = "none";
        }

        return;
    }


    // Reset to first 12 when displaying a new
    // filtered/search result
    if (
        !displayInternships.isFiltering
    ) {
        displayedInternshipCount =
            INTERNSHIPS_PER_PAGE;
    }


    const visibleInternships =
        list.slice(
            0,
            displayedInternshipCount
        );


    internshipsGrid.innerHTML = "";


    visibleInternships.forEach(
        internship => {

            const card =
                document.createElement("article");

            card.className =
                "internship-card";


            let detailsLink;


            if (internship.isApiInternship) {

                detailsLink =
                    `opportunity.html?apiJob=${
                        encodeURIComponent(
                            internship.slug ||
                            internship.api_id
                        )
                    }`;

            } else {

                detailsLink =
                    `opportunity.html?id=${
                        encodeURIComponent(
                            internship.id
                        )
                    }&type=internship`;

            }


            card.innerHTML = `

                <div class="internship-card-top">

                    <div class="internship-icon">
                        💼
                    </div>

                    <span class="verified-badge">
                        ✓ Verified
                    </span>

                </div>


                <span class="internship-type">
                    Internship
                </span>


                <h3>
                    ${escapeHTML(
                        internship.title ||
                        "Untitled Internship"
                    )}
                </h3>


                <p class="internship-organization">
                    ${escapeHTML(
                        internship.organization ||
                        "Organization"
                    )}
                </p>


                <div class="internship-meta">

                    <span>
                        📍
                        ${escapeHTML(
                            internship.location ||
                            "Rwanda"
                        )}
                    </span>

                    <span>
                        🧑‍💻
                        ${escapeHTML(
                            internship.field ||
                            "Not specified"
                        )}
                    </span>

                    <span>
                        ⏱
                        ${escapeHTML(
                            internship.duration ||
                            "Not specified"
                        )}
                    </span>

                </div>


                <div class="internship-bottom">

                    <span class="internship-deadline">

                        Deadline:

                        ${
                            internship.deadline
                                ? escapeHTML(
                                    internship.deadline
                                )
                                : "No deadline"
                        }

                    </span>


                    <a href="${detailsLink}">
                        View Details →
                    </a>

                </div>

            `;


            internshipsGrid.appendChild(card);

        }
    );


    // =========================================
    // LOAD MORE BUTTON
    // =========================================

    if (loadMoreInternships) {

        if (
            displayedInternshipCount <
            list.length
        ) {

            loadMoreInternships.style.display =
                "inline-block";

            loadMoreInternships.textContent =
                `Load More Internships`;

        } else {

            loadMoreInternships.style.display =
                "none";

        }

    }

}


// =========================================
// FILTER INTERNSHIPS
// =========================================
function filterInternships() {

    displayedInternshipCount =
        INTERNSHIPS_PER_PAGE;

    const filtered =
        getCurrentFilteredInternships();

    displayInternships.isFiltering = true;

    displayInternships(filtered);

    displayInternships.isFiltering = false;

}

// =========================================
// SEARCH LISTENER
// =========================================

if (internshipSearch) {

    internshipSearch.addEventListener(
        "input",
        filterInternships
    );

}


// =========================================
// FILTER BUTTONS
// =========================================

internshipFilters.forEach(button => {

    button.addEventListener(
        "click",
        () => {

            internshipFilters.forEach(btn => {

                btn.classList.remove(
                    "active"
                );

            });


            button.classList.add(
                "active"
            );


            filterInternships();

        }
    );

});


// =========================================
// ESCAPE HTML
// =========================================

function escapeHTML(value) {

    return String(value)

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
// START
// =========================================

loadInternships();