/* =========================================
   MOBILE MENU
========================================= */

const menuToggle = document.getElementById("menuToggle");
const mobileMenu = document.getElementById("mobileMenu");

if (menuToggle && mobileMenu) {

    menuToggle.addEventListener("click", () => {

        mobileMenu.classList.toggle("show");

    });

}


/* =========================================
   HERO SEARCH
========================================= */

const searchButton = document.getElementById("searchButton");
const heroSearch = document.getElementById("heroSearch");
const heroCategory = document.getElementById("heroCategory");

if (searchButton) {

    searchButton.addEventListener("click", () => {

        const search = heroSearch.value.trim();
        const category = heroCategory.value;

       let page = "jobs.html";

if (category === "scholarships") {
    page = "scholarships.html";
}

if (category === "internships") {
    page = "internships.html";
}

if (category === "fellowships") {
    page = "fellowships.html";
}

if (category === "training") {
    page = "training.html";
}

if (category === "resources") {
    page = "resources.html";
}

        const params = new URLSearchParams();

        if (search) {
            params.set("search", search);
        }

        window.location.href =
            page +
            (params.toString() ? "?" + params.toString() : "");

    });

}


/* =========================================
   ENTER KEY SEARCH
========================================= */

if (heroSearch) {

    heroSearch.addEventListener("keydown", (event) => {

        if (event.key === "Enter") {

            searchButton.click();

        }

    });

}

// =========================================
// LOAD APPROVED ADVERTISEMENTS
// =========================================

async function loadApprovedAdvertisements() {

    const adContainer =
        document.getElementById("publicAdvertisement");

    const adSection =
        document.getElementById("publicAdvertisementSection");

    if (!adContainer || !adSection) return;

    const { data, error } = await supabaseClient
        .from("advertisements")
        .select("*")
        .eq("status", "approved")
        .order("created_at", {
            ascending: false
        });

    if (error) {
        console.error(
            "Public advertisements error:",
            error
        );

        adSection.style.display = "none";
        return;
    }

    if (!data || data.length === 0) {
        adSection.style.display = "none";
        return;
    }

    adSection.style.display = "block";

    adContainer.innerHTML = data.map(ad => {

        const website = ad.website
            ? ad.website
            : "#";

        return `
            <a
                href="${website}"
                target="_blank"
                rel="noopener noreferrer"
                class="public-ad"
            >

                <div class="public-ad-content">

                    <span class="public-ad-label">
                        Advertisement
                    </span>

                    <h3>
                        ${ad.organization || "Sponsored"}
                    </h3>

                    <p>
                        ${ad.message || ""}
                    </p>

                    <span class="public-ad-link">
                        Visit Website →
                    </span>

                </div>

            </a>
        `;

    }).join("");
}