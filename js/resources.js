document.addEventListener("DOMContentLoaded", () => {

    const resourcesGrid = document.getElementById("resourcesGrid");
    const searchInput = document.getElementById("resourceSearch");
    const filterButtons = document.querySelectorAll(".resource-filter");

    if (!resourcesGrid) {
        console.error("Resources grid not found.");
        return;
    }

    // Make sure resources data exists
    const resources = Array.isArray(window.resources)
        ? window.resources
        : [];

    let activeFilter = "all";


    // =========================================
    // RENDER RESOURCES
    // =========================================

    function renderResources() {

        const searchTerm = searchInput
            ? searchInput.value.toLowerCase().trim()
            : "";


        const filteredResources = resources.filter(resource => {

            const matchesFilter =
                activeFilter === "all" ||
                resource.category === activeFilter;

            const searchableText = `
                ${resource.title || ""}
                ${resource.description || ""}
                ${resource.type || ""}
            `.toLowerCase();

            const matchesSearch =
                searchableText.includes(searchTerm);

            return matchesFilter && matchesSearch;

        });


        resourcesGrid.innerHTML = "";


        // No results
        if (filteredResources.length === 0) {

            resourcesGrid.innerHTML = `
                <div class="no-resources">
                    <h3>No resources found</h3>
                    <p>
                        Try another search or choose a different category.
                    </p>
                </div>
            `;

            return;
        }


        // Create cards
        filteredResources.forEach(resource => {

            const card = document.createElement("article");

            card.className = "resource-card";


            card.innerHTML = `

                <div class="resource-icon">
                    ${resource.icon || "📚"}
                </div>

                <div class="resource-content">

                    <span class="resource-type">
                        ${resource.type || "Resource"}
                    </span>

                    <h3>
                        ${resource.title || "Untitled Resource"}
                    </h3>

                    <p>
                        ${resource.description || ""}
                    </p>

                    <a
                        href="resource.html?id=${resource.id}"
                        class="resource-link"
                    >
                        Explore Resource →
                    </a>

                </div>

            `;


            resourcesGrid.appendChild(card);

        });

    }


    // =========================================
    // FILTER BUTTONS
    // =========================================

    filterButtons.forEach(button => {

        button.addEventListener("click", () => {

            filterButtons.forEach(btn => {
                btn.classList.remove("active");
            });

            button.classList.add("active");

            activeFilter =
                button.dataset.filter || "all";

            renderResources();

        });

    });


    // =========================================
    // SEARCH
    // =========================================

    if (searchInput) {

        searchInput.addEventListener(
            "input",
            renderResources
        );

    }


    // =========================================
    // INITIAL LOAD
    // =========================================

    renderResources();

});
