
// =========================================
// FELLOWSHIPS FROM SUPABASE
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
// LOAD FELLOWSHIPS FROM SUPABASE
// =========================================

async function loadFellowships() {

    if (!fellowshipsGrid) return;


    fellowshipsGrid.innerHTML = `
        <div class="no-results">
            <h3>Loading fellowships...</h3>
            <p>Please wait.</p>
        </div>
    `;


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
            "Failed to load fellowships:",
            error
        );


        fellowshipsGrid.innerHTML = `
            <div class="no-results">
                <h3>Unable to load fellowships</h3>
                <p>Please try again later.</p>
            </div>
        `;

        return;
    }


    fellowships = data || [];


    displayFellowships(fellowships);

}


// =========================================
// DISPLAY FELLOWSHIPS
// =========================================

function displayFellowships(data) {

    if (!fellowshipsGrid) return;


    if (fellowshipCount) {

        fellowshipCount.textContent =
            `${data.length} Opportunities`;

    }


    if (data.length === 0) {

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
        data.map(fellowship => `

        <article class="fellowship-card">


            <div class="fellowship-card-top">

                <div class="fellowship-icon">
                    🤝
                </div>

                <span class="verified-badge">
                    ✓ Verified
                </span>

            </div>


            <span class="fellowship-type">
                ${fellowship.type || "Fellowship"}
            </span>


            <h3>
                ${fellowship.title || "Untitled Fellowship"}
            </h3>


            <p class="fellowship-organization">
                ${fellowship.organization || "Organization"}
            </p>


            <div class="fellowship-meta">

                <span>
                    📍 ${fellowship.location || "International"}
                </span>

                <span>
                    ⏱ ${fellowship.duration || "Not specified"}
                </span>

                <span>
                    🎓 ${fellowship.level || "All Levels"}
                </span>

            </div>


            <div class="fellowship-bottom">

                <span class="fellowship-deadline">

                    Deadline:
                    ${fellowship.deadline || "No deadline"}

                </span>


                <a
                    href="opportunity.html?id=${fellowship.id}&type=fellowship"
                >
                    View Details →
                </a>

            </div>


        </article>

    `).join("");

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
        fellowships.filter(fellowship => {

            const title =
                fellowship.title?.toLowerCase() || "";

            const organization =
                fellowship.organization?.toLowerCase() || "";

            const type =
                fellowship.type?.toLowerCase() || "";

            const location =
                fellowship.location?.toLowerCase() || "";


            const matchesSearch =

                title.includes(searchTerm)

                ||

                organization.includes(searchTerm)

                ||

                type.includes(searchTerm)

                ||

                location.includes(searchTerm);


            /*
                We don't currently have a
                separate category column in
                Supabase, so filters use the
                type for now.
            */

            const matchesFilter =

                currentFilter === "all"

                ||

                type.includes(
                    currentFilter.toLowerCase()
                );


            return (
                matchesSearch &&
                matchesFilter
            );

        });


    displayFellowships(filtered);

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

fellowshipFilters.forEach(button => {

    button.addEventListener(
        "click",
        () => {

            fellowshipFilters.forEach(btn => {

                btn.classList.remove("active");

            });


            button.classList.add("active");


            currentFilter =
                button.dataset.filter;


            filterFellowships();

        }
    );

});


// =========================================
// START
// =========================================

loadFellowships();
