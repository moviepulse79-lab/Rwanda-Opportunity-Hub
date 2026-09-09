
// =========================================
// TRAINING FROM SUPABASE
// =========================================

const trainingsGrid =
    document.getElementById("trainingsGrid");

const trainingSearch =
    document.getElementById("trainingSearch");

const trainingCount =
    document.getElementById("trainingCount");

const trainingFilters =
    document.querySelectorAll(".training-filter");


let trainings = [];

let currentTrainingFilter = "all";


// =========================================
// LOAD TRAININGS FROM SUPABASE
// =========================================

async function loadTrainings() {

    if (!trainingsGrid) return;


    trainingsGrid.innerHTML = `
        <div class="no-results">
            <h3>Loading training programs...</h3>
            <p>Please wait.</p>
        </div>
    `;


    const {
        data,
        error
    } = await supabaseClient
        .from("opportunities")
        .select("*")
        .eq("type", "training")
        .order("created_at", {
            ascending: false
        });


    if (error) {

        console.error(
            "Failed to load trainings:",
            error
        );


        trainingsGrid.innerHTML = `
            <div class="no-results">
                <h3>Unable to load training programs</h3>
                <p>Please try again later.</p>
            </div>
        `;

        return;
    }


    trainings = data || [];


    displayTrainings(trainings);

}


// =========================================
// DISPLAY TRAININGS
// =========================================

function displayTrainings(data) {

    if (!trainingsGrid) return;


    if (trainingCount) {

        trainingCount.textContent =
            `${data.length} Opportunities`;

    }


    if (data.length === 0) {

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
        data.map(training => `

        <article class="training-card">


            <div class="training-card-top">

                <div class="training-icon">
                    📚
                </div>

                <span class="verified-badge">
                    ✓ Verified
                </span>

            </div>


            <span class="training-type">
                ${training.type || "Training"}
            </span>


            <h3>
                ${training.title || "Untitled Training"}
            </h3>


            <p class="training-organization">
                ${training.organization || "Organization"}
            </p>


            <div class="training-meta">

                <span>
                    📍 ${training.location || "Rwanda"}
                </span>

                <span>
                    ⏱ ${training.duration || "Not specified"}
                </span>

                <span>
                    🎓 ${training.level || "All Levels"}
                </span>

            </div>


            <div class="training-bottom">

                <span class="training-deadline">

                    Deadline:
                    ${training.deadline || "No deadline"}

                </span>


                <a
                    href="opportunity.html?id=${training.id}&type=training"
                >
                    View Details →
                </a>

            </div>


        </article>

    `).join("");

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
        trainings.filter(training => {

            const title =
                training.title?.toLowerCase() || "";

            const organization =
                training.organization?.toLowerCase() || "";

            const type =
                training.type?.toLowerCase() || "";

            const location =
                training.location?.toLowerCase() || "";


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
                category column in Supabase.

                The type column determines
                that this is a training.
            */

            const matchesFilter =

                currentTrainingFilter === "all"

                ||

                type.includes(
                    currentTrainingFilter.toLowerCase()
                );


            return (
                matchesSearch &&
                matchesFilter
            );

        });


    displayTrainings(filtered);

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

trainingFilters.forEach(button => {

    button.addEventListener(
        "click",
        () => {

            trainingFilters.forEach(btn => {

                btn.classList.remove("active");

            });


            button.classList.add("active");


            currentTrainingFilter =
                button.dataset.filter;


            filterTrainings();

        }
    );

});


// =========================================
// START
// =========================================

loadTrainings();

