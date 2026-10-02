// ======================================
// ROH JOBS — SUPABASE LIVE JOBS
// =========================================

const jobsGrid = document.getElementById("jobsGrid");
const jobsCount = document.getElementById("jobsCount");

const jobSearch = document.getElementById("jobSearch");
const locationFilter = document.getElementById("locationFilter");
const typeFilter = document.getElementById("typeFilter");
const experienceFilter = document.getElementById("experienceFilter");
const categoryFilter = document.getElementById("categoryFilter");

const jobSearchButton = document.getElementById("jobSearchButton");
const clearFilters = document.getElementById("clearFilters");
const loadMore = document.getElementById("loadMore");
const noResults = document.getElementById("noResults");

let jobs = [];
let filteredJobs = [];
let visibleJobs = 24;


// =========================================
// LOAD JOBS FROM SUPABASE
// =========================================

async function loadJobs() {

    if (!jobsGrid) return;

    jobsGrid.innerHTML = `
        <div class="no-results">
            <h3>Loading jobs...</h3>
            <p>Finding the latest opportunities.</p>
        </div>
    `;

    try {

       const { data, error } = await supabaseClient
    .from("opportunities")
    .select("*")
    .eq("type", "job")
    .or("status.is.null,status.neq.closed")
    .order("created_at", { ascending: false });

        if (error) {
            throw error;
        }

        jobs = data || [];

        filteredJobs = [...jobs];

        console.log(
            "ROH JOBS LOADED:",
            jobs.length
        );

        displayJobs();

    } catch (error) {

        console.error(
            "Failed to load jobs:",
            error
        );

        jobsGrid.innerHTML = `
            <div class="no-results">
                <h3>Unable to load jobs</h3>
                <p>Please try again later.</p>
            </div>
        `;

        if (jobsCount) {
            jobsCount.textContent = "0";
        }

    }

}


// =========================================
// DISPLAY JOBS
// =========================================

function displayJobs() {

    if (!jobsGrid) return;

    jobsGrid.innerHTML = "";

    const jobsToShow =
        filteredJobs.slice(
            0,
            visibleJobs
        );


    // COUNT

    if (jobsCount) {

        jobsCount.textContent =
            filteredJobs.length;

    }


    // NO RESULTS

    if (filteredJobs.length === 0) {

        jobsGrid.innerHTML = `
            <div class="no-results">
                <h3>No jobs found</h3>
                <p>Try changing your search or filters.</p>
            </div>
        `;

        if (loadMore) {

            loadMore.parentElement.style.display =
                "none";

        }

        return;

    }


    // CREATE CARDS

    jobsToShow.forEach(job => {

        const card =
            document.createElement("article");

        card.className = "job-card";


        const organization =
            job.organization ||
            "Company";


        const firstLetter =
            organization
                .charAt(0)
                .toUpperCase();


        const location =
            job.location ||
            "Rwanda";


        const experience =
            job.experience ||
            "Not specified";


        const category =
            job.category ||
            "Job";


        const jobType =
            job.employment_type ||
            job.duration ||
            "Job";


        const deadline =
            job.deadline
                ? `Deadline: ${formatDate(job.deadline)}`
                : "No deadline";


        card.innerHTML = `

            <div class="job-card-top">

                <div class="company-logo">

                    ${
                        job.company_logo
                            ? `
                                <img
                                    src="${escapeHtml(job.company_logo)}"
                                    alt="${escapeHtml(organization)}"
                                    style="
                                        width:100%;
                                        height:100%;
                                        object-fit:contain;
                                        border-radius:inherit;
                                    "
                                >
                              `
                            : escapeHtml(firstLetter)
                    }

                </div>


                <span class="verified-badge">
                    ✓ Verified
                </span>

            </div>


            <span class="job-type-badge">
                ${escapeHtml(category)}
            </span>


            <h3>
                ${escapeHtml(
                    job.title ||
                    "Untitled Job"
                )}
            </h3>


            <p class="job-company">
                ${escapeHtml(organization)}
            </p>


            <div class="job-meta">

                <span>
                    📍 ${escapeHtml(location)}
                </span>

                <span>
                    🎓 ${escapeHtml(experience)}
                </span>

            </div>


            <div class="job-card-bottom">

                <span class="deadline">

                    ${escapeHtml(deadline)}

                </span>


                <a
                    href="opportunity.html?id=${encodeURIComponent(job.id)}&type=job"
                >
                    View Job →
                </a>

            </div>

        `;


        jobsGrid.appendChild(card);

    });


    // LOAD MORE

    if (loadMore) {

        if (
            filteredJobs.length >
            visibleJobs
        ) {

            loadMore.parentElement.style.display =
                "flex";

        } else {

            loadMore.parentElement.style.display =
                "none";

        }

    }

}


// =========================================
// FORMAT DATE
// =========================================

function formatDate(date) {

    if (!date) {
        return "";
    }

    try {

        return new Date(date)
            .toLocaleDateString(
                "en-RW",
                {
                    day: "numeric",
                    month: "short",
                    year: "numeric"
                }
            );

    } catch {

        return date;

    }

}


// =========================================
// ESCAPE HTML
// =========================================

function escapeHtml(value) {

    if (value === null ||
        value === undefined) {

        return "";

    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// =========================================
// FILTER JOBS
// =========================================

function filterJobs() {

    const search =
        jobSearch
            ? jobSearch.value
                .toLowerCase()
                .trim()
            : "";


    const location =
        locationFilter
            ? locationFilter.value
                .toLowerCase()
            : "";


    const type =
        typeFilter
            ? typeFilter.value
                .toLowerCase()
            : "";


    const experience =
        experienceFilter
            ? experienceFilter.value
                .toLowerCase()
            : "";


    const category =
        categoryFilter
            ? categoryFilter.value
                .toLowerCase()
            : "";


    filteredJobs =
        jobs.filter(job => {

            const title =
                (job.title || "")
                    .toLowerCase();


            const organization =
                (job.organization || "")
                    .toLowerCase();


            const description =
                (
                    job.description ||
                    job.full_description ||
                    ""
                )
                .toLowerCase();


            const jobLocation =
                (job.location || "")
                    .toLowerCase();


            const jobType =
                (
                    job.employment_type ||
                    job.duration ||
                    ""
                )
                .toLowerCase();


            const jobExperience =
                (job.experience || "")
                    .toLowerCase();


            const jobCategory =
                (job.category || "")
                    .toLowerCase();


            const matchesSearch =
                !search ||
                title.includes(search) ||
                organization.includes(search) ||
                description.includes(search);


            const matchesLocation =
                !location ||
                jobLocation.includes(location);


            const matchesType =
                !type ||
                jobType.includes(type);


            const matchesExperience =
                !experience ||
                jobExperience.includes(experience);


            const matchesCategory =
                !category ||
                jobCategory.includes(category);


            return (
                matchesSearch &&
                matchesLocation &&
                matchesType &&
                matchesExperience &&
                matchesCategory
            );

        });


    visibleJobs = 24;

    displayJobs();

}


// =========================================
// SEARCH BUTTON
// =========================================

if (jobSearchButton) {

    jobSearchButton.addEventListener(
        "click",
        filterJobs
    );

}


// =========================================
// ENTER TO SEARCH
// =========================================

if (jobSearch) {

    jobSearch.addEventListener(
        "keydown",
        event => {

            if (event.key === "Enter") {

                filterJobs();

            }

        }
    );

}


// =========================================
// FILTER EVENTS
// =========================================

[
    locationFilter,
    typeFilter,
    experienceFilter,
    categoryFilter

].forEach(filter => {

    if (filter) {

        filter.addEventListener(
            "change",
            filterJobs
        );

    }

});


// =========================================
// CLEAR FILTERS
// =========================================

if (clearFilters) {

    clearFilters.addEventListener(
        "click",
        () => {

            if (jobSearch)
                jobSearch.value = "";

            if (locationFilter)
                locationFilter.value = "";

            if (typeFilter)
                typeFilter.value = "";

            if (experienceFilter)
                experienceFilter.value = "";

            if (categoryFilter)
                categoryFilter.value = "";


            filteredJobs =
                [...jobs];

            visibleJobs = 24;

            displayJobs();

        }
    );

}

// =========================================
// LOAD MORE
// =========================================

if (loadMore) {

    const loadMoreContainer =
        loadMore.closest(".load-more");

    if (filteredJobs.length > visibleJobs) {

        if (loadMoreContainer) {
            loadMoreContainer.style.display = "flex";
        }

        loadMore.style.display = "inline-flex";

    } else {

        if (loadMoreContainer) {
            loadMoreContainer.style.display = "none";
        }

    }

}


// =========================================
// START
// =========================================

loadJobs();
