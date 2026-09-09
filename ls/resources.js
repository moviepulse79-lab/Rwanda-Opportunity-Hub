
// =========================================
// RESOURCES FROM SUPABASE
// =========================================

const resourcesGrid =
    document.getElementById("resourcesGrid");

const resourceSearch =
    document.getElementById("resourceSearch");

const resourceFilters =
    document.querySelectorAll(".resource-filter");


let resources = [];

let currentResourceFilter = "all";


// =========================================
// LOAD RESOURCES
// =========================================

async function loadResources() {

    if (!resourcesGrid) return;


    resourcesGrid.innerHTML = `
        <div class="no-results">
            <h3>Loading resources...</h3>
            <p>Please wait.</p>
        </div>
    `;


    const {
        data,
        error
    } = await supabaseClient
        .from("opportunities")
        .select("*")
        .eq("type", "resource")
        .order("created_at", {
            ascending: false
        });


    if (error) {

        console.error(
            "Failed to load resources:",
            error
        );


        resourcesGrid.innerHTML = `
            <div class="no-results">
                <h3>Unable to load resources</h3>
                <p>Please try again later.</p>
            </div>
        `;

        return;
    }


    resources = data || [];


    displayResources(resources);

}


// =========================================
// DISPLAY RESOURCES
// =========================================

function displayResources(data) {

    if (!resourcesGrid) return;


    if (data.length === 0) {

        resourcesGrid.innerHTML = `

            <div class="no-results">

                <h3>
                    No resources found
                </h3>

                <p>
                    Try another search or category.
                </p>

            </div>

        `;

        return;
    }


    resourcesGrid.innerHTML =
        data.map(resource => `

        <article class="resource-card">

            <div class="resource-icon">
                📚
            </div>


            <span class="resource-type">
                Resource
            </span>


            <h3>
                ${resource.title || "Untitled Resource"}
            </h3>


            <p>
                ${resource.description || "No description available."}
            </p>


            <a
                href="opportunity.html?id=${resource.id}&type=resource"
                class="resource-link"
            >
                Read Guide →
            </a>

        </article>

    `).join("");

}


// =========================================
// SEARCH + FILTER
// =========================================

function filterResources() {

    const searchTerm =
        resourceSearch
            ? resourceSearch.value
                .toLowerCase()
                .trim()
            : "";


    const filtered =
        resources.filter(resource => {

            const title =
                resource.title?.toLowerCase() || "";

            const description =
                resource.description?.toLowerCase() || "";

            const organization =
                resource.organization?.toLowerCase() || "";

            const type =
                resource.type?.toLowerCase() || "";


            const matchesSearch =

                title.includes(searchTerm)

                ||

                description.includes(searchTerm)

                ||

                organization.includes(searchTerm)

                ||

                type.includes(searchTerm);


            /*
                We currently don't have a
                separate category column.

                The type column identifies
                the resource.
            */

            const matchesFilter =

                currentResourceFilter === "all"

                ||

                type.includes(
                    currentResourceFilter.toLowerCase()
                );


            return (
                matchesSearch &&
                matchesFilter
            );

        });


    displayResources(filtered);

}


// =========================================
// SEARCH
// =========================================

if (resourceSearch) {

    resourceSearch.addEventListener(
        "input",
        filterResources
    );

}


// =========================================
// FILTER BUTTONS
// =========================================

resourceFilters.forEach(button => {

    button.addEventListener(
        "click",
        () => {

            resourceFilters.forEach(btn => {

                btn.classList.remove(
                    "active"
                );

            });


            button.classList.add(
                "active"
            );


            currentResourceFilter =
                button.dataset.filter;


            filterResources();

        }
    );

});


// =========================================
// START
// =========================================

loadResources();

