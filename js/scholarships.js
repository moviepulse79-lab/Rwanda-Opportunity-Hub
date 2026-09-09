// =========================================
// SUPABASE SCHOLARSHIPS
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
// LOAD FROM SUPABASE
// =========================================

async function loadScholarships() {

    if (!scholarshipsGrid) return;

    scholarshipsGrid.innerHTML = `
        <div class="no-results">
            <h3>Loading scholarships...</h3>
            <p>Please wait.</p>
        </div>
    `;


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
            "Failed to load scholarships:",
            error
        );

        scholarshipsGrid.innerHTML = `
            <div class="no-results">
                <h3>Unable to load scholarships</h3>
                <p>Please try again later.</p>
            </div>
        `;

        return;
    }


    scholarships = data || [];

    displayScholarships(scholarships);
}


// =========================================
// DISPLAY
// =========================================

function displayScholarships(list) {

    if (!scholarshipsGrid) return;

    scholarshipsGrid.innerHTML = "";


    if (list.length === 0) {

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


    list.forEach(scholarship => {

        const card =
            document.createElement("article");

        card.className =
            "scholarship-card";


        card.innerHTML = `

            <div class="scholarship-card-top">

                <div class="scholarship-icon">
                    🎓
                </div>

                <span class="verified-badge">
                    ✓ Verified
                </span>

            </div>


            <h3>
                ${scholarship.title}
            </h3>


            <p class="scholarship-organization">
                ${scholarship.organization}
            </p>


            <div class="scholarship-meta">

                <span>
                    🎓 ${scholarship.level || "All Levels"}
                </span>

                <span>
                    📍 ${scholarship.location || "International"}
                </span>

                <span>
                    💰 ${scholarship.funding || scholarship.type || "Scholarship"}
                </span>

            </div>


            <div class="scholarship-bottom">

                <span class="scholarship-deadline">
                    Deadline:
                    ${scholarship.deadline || "No deadline"}
                </span>


                <a
                    href="opportunity.html?id=${scholarship.id}&type=scholarship"
                >
                    View Details →
                </a>

            </div>

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
            ? searchInput.value.toLowerCase().trim()
            : "";


    const activeFilter =
        document
            .querySelector(".filter-btn.active")
            ?.dataset.filter || "all";


    const filtered =
        scholarships.filter(scholarship => {

            const title =
                scholarship.title?.toLowerCase() || "";

            const organization =
                scholarship.organization?.toLowerCase() || "";

            const location =
                scholarship.location?.toLowerCase() || "";


            const matchesSearch =

                title.includes(searchTerm)

                ||

                organization.includes(searchTerm)

                ||

                location.includes(searchTerm);


            let matchesFilter = true;


            // If your filter buttons use:
            // undergraduate / masters / phd

            if (activeFilter !== "all") {

                const level =
                    scholarship.level
                        ?.toLowerCase() || "";

                matchesFilter =
                    level.includes(activeFilter);

            }


            return (
                matchesSearch &&
                matchesFilter
            );

        });


    displayScholarships(filtered);

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

filterButtons.forEach(button => {

    button.addEventListener(
        "click",
        () => {

            filterButtons.forEach(btn => {

                btn.classList.remove("active");

            });


            button.classList.add("active");


            filterScholarships();

        }
    );

});


// =========================================
// START
// =========================================

loadScholarships();