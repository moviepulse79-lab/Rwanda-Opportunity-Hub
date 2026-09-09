// =========================================
// ROH JOBS — SUPABASE + LIVE RWANDA API
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
let visibleJobs = 6;


// =========================================
// LOAD LIVE RWANDA JOBS API
// =========================================

async function loadApiJobs() {

    try {

        const response = await fetch(
            "https://api.jobopportunitiesapi.org/public/jobs?country=RW&limit=50"
        );

        if (!response.ok) {
            throw new Error("Jobs API request failed");
        }

        const result = await response.json();

        console.log("LIVE RWANDA API JOBS:", result.data);

        const apiJobs = (result.data || []).map(job => ({

            id: `api-${job.id}`,

            api_id: job.id,

            slug: job.slug,

            title: job.title || "Untitled Job",

            organization:
                job.company || "Company",

            location:
                job.location ||
                job.city ||
                "Rwanda",

            experience:
                job.seniority ||
                "Not specified",

            category:
                job.category ||
                "Other",

            duration:
                job.employment_type ||
                "Job",

            type: "job",

            deadline:
                job.deadline ||
                "No deadline",

            description:
                job.description ||
                "",

            posted_date:
                job.posted_at ||
                null,

            apply_url:
                job.apply_url ||
                "#",

            company_logo:
                job.company_logo ||
                "",

            source:
                job.source ||
                "Job Opportunities API",

            isApiJob: true

        }));

        return apiJobs;

    } catch (error) {

        console.error(
            "Rwanda Jobs API error:",
            error
        );

        return [];

    }

}


// =========================================
// LOAD SUPABASE + API JOBS
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

        // -----------------------------
        // SUPABASE JOBS
        // -----------------------------

        const {
            data: supabaseJobs,
            error
        } = await supabaseClient
            .from("opportunities")
            .select("*")
            .eq("type", "job")
            .order("created_at", {
                ascending: false
            });


        if (error) {

            console.error(
                "Supabase jobs error:",
                error
            );

        }


        // -----------------------------
        // LIVE API JOBS
        // -----------------------------

        const apiJobs =
            await loadApiJobs();


        // -----------------------------
        // COMBINE BOTH
        // -----------------------------

        jobs = [
            ...(apiJobs || []),
            ...(supabaseJobs || [])
        ];


        // Remove duplicates by title + organization

        const uniqueJobs = [];

        const seen = new Set();

        jobs.forEach(job => {

            const key =
                `${(job.title || "").toLowerCase()}-${(job.organization || "").toLowerCase()}`;

            if (!seen.has(key)) {

                seen.add(key);

                uniqueJobs.push(job);

            }

        });


        jobs = uniqueJobs;

        filteredJobs = [...jobs];

        console.log(
            "TOTAL ROH JOBS:",
            jobs.length
        );

        console.log(
            "API JOBS:",
            apiJobs.length
        );

        console.log(
            "SUPABASE JOBS:",
            supabaseJobs?.length || 0
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

    }

}


// =========================================
// DISPLAY JOBS
// =========================================

function displayJobs() {

    if (!jobsGrid) return;

    jobsGrid.innerHTML = "";

    const jobsToShow =
        filteredJobs.slice(0, visibleJobs);


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
            job.company ||
            "Company";


        const firstLetter =
            organization
                .charAt(0)
                .toUpperCase();


        // API JOB

        if (job.isApiJob) {

            const applyUrl =
                job.apply_url || "#";


            card.innerHTML = `

                <div class="job-card-top">

                    <div class="company-logo">

                        ${
                            job.company_logo
                                ? `<img
                                    src="${job.company_logo}"
                                    alt="${organization}"
                                    style="width:100%;height:100%;object-fit:contain;border-radius:inherit;"
                                  >`
                                : firstLetter
                        }

                    </div>

                    <span class="verified-badge">
                        ✓ Verified
                    </span>

                </div>


                <span class="job-type-badge">
                    ${job.category || "Job"}
                </span>


                <h3>
                    ${job.title}
                </h3>


                <p class="job-company">
                    ${organization}
                </p>


                <div class="job-meta">

                    <span>
                        📍 ${job.location}
                    </span>

                    <span>
                        🎓 ${job.experience}
                    </span>

                </div>


                <div class="job-card-bottom">

                    <span class="deadline">
                        ${job.posted_date
                            ? `Posted: ${formatDate(job.posted_date)}`
                            : "Recently posted"
                        }
                    </span>


                    <a href="opportunity.html?apiJob=${encodeURIComponent(job.slug || job.api_id)}">
    View Job →
</a>

                </div>

            `;

        }


        // SUPABASE JOB

        else {

            card.innerHTML = `

                <div class="job-card-top">

                    <div class="company-logo">
                        ${firstLetter}
                    </div>

                    <span class="verified-badge">
                        ✓ Verified
                    </span>

                </div>


                <span class="job-type-badge">
                    ${job.category || "Job"}
                </span>


                <h3>
                    ${job.title || "Untitled Job"}
                </h3>


                <p class="job-company">
                    ${organization}
                </p>


                <div class="job-meta">

                    <span>
                        📍 ${job.location || "Rwanda"}
                    </span>

                    <span>
                        🎓 ${job.experience || "Not specified"}
                    </span>

                </div>


                <div class="job-card-bottom">

                    <span class="deadline">
                        Deadline:
                        ${job.deadline || "No deadline"}
                    </span>


                    <a
                        href="opportunity.html?id=${job.id}&type=job"
                    >
                        View Job →
                    </a>

                </div>

            `;

        }


        jobsGrid.appendChild(card);

    });


    // LOAD MORE

    if (loadMore) {

        if (filteredJobs.length > visibleJobs) {

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

    try {

        return new Date(date).toLocaleDateString(
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
// FILTER JOBS
// =========================================

function filterJobs() {

    const search =
        jobSearch
            ? jobSearch.value.toLowerCase().trim()
            : "";

    const location =
        locationFilter
            ? locationFilter.value.toLowerCase()
            : "";

    const type =
        typeFilter
            ? typeFilter.value.toLowerCase()
            : "";

    const experience =
        experienceFilter
            ? experienceFilter.value.toLowerCase()
            : "";

    const category =
        categoryFilter
            ? categoryFilter.value.toLowerCase()
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
                (job.description || "")
                    .toLowerCase();

            const jobLocation =
                (job.location || "")
                    .toLowerCase();

            const jobType =
                (
                    job.duration ||
                    job.type ||
                    ""
                ).toLowerCase();

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


    visibleJobs = 6;

    displayJobs();

}


// =========================================
// SEARCH
// =========================================

if (jobSearchButton) {

    jobSearchButton.addEventListener(
        "click",
        filterJobs
    );

}


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


            filteredJobs = [...jobs];

            visibleJobs = 6;

            displayJobs();

        }
    );

}


// =========================================
// LOAD MORE
// =========================================

if (loadMore) {

    loadMore.addEventListener(
        "click",
        () => {

            visibleJobs += 6;

            displayJobs();

        }
    );

}


// =========================================
// START
// =========================================

loadJobs();