
// =========================================
// ROH ADVERTISEMENT SYSTEM
// =========================================

async function loadAdvertisements() {

    const pageName = document.body.dataset.page;

    if (!pageName) {
        console.log("No page name found.");
        return;
    }

    // =========================================
    // LOAD APPROVED ADS
    // =========================================

    const {
        data: advertisements,
        error
    } = await supabaseClient
        .from("advertisements")
        .select("*")
        .eq("status", "approved");

    if (error) {
        console.error(
            "Advertisement loading error:",
            error
        );
        return;
    }


    // =========================================
    // FILTER ADS BY PAGE
    // =========================================

    const pageAdvertisements =
        (advertisements || []).filter(ad => {

            if (!Array.isArray(ad.placements)) {
                return false;
            }

            return (
                ad.placements.includes(pageName) ||
                ad.placements.includes("all")
            );

        });


    // =========================================
    // FIND CONTAINER
    // =========================================

    const container =
        document.getElementById(
            "publicAdvertisement"
        );

    if (!container) {

        console.log(
            "Public advertisement container not found."
        );

        return;
    }


    // =========================================
    // NO ADS
    // =========================================

    if (pageAdvertisements.length === 0) {

        container.innerHTML = "";

        return;
    }


    // =========================================
    // CREATE AD
    // =========================================

    function createAdvertisement(ad) {

        const type =
            (ad.advertisement_type || "")
                .toLowerCase()
                .trim();


        // =====================================
        // SPONSORED PROMOTION
        // =====================================

        if (type === "sponsored") {

            return `

                <article class="roh-ad roh-ad-sponsored">

                    <div class="sponsored-accent"></div>

                    <div class="sponsored-icon">
                        📣
                    </div>

                    <div class="sponsored-content">

                        <span class="sponsored-label">
                            Sponsored Promotion
                        </span>

                        <h3>
                            ${ad.organization || "Advertisement"}
                        </h3>

                        <p>
                            ${
                                ad.message ||
                                "Discover this sponsored promotion."
                            }
                        </p>

                    </div>

                    ${
                        ad.website
                        ? `
                            <a
                                href="${ad.website}"
                                target="_blank"
                                rel="noopener noreferrer"
                                class="sponsored-button"
                            >
                                Visit
                                <span>→</span>
                            </a>
                        `
                        : ""
                    }

                </article>

            `;
        }


        // =====================================
        // FEATURED OPPORTUNITY
        // =====================================

        if (type === "featured_opportunity") {

            return `

                <article class="roh-ad roh-ad-featured">

                    <div class="featured-visual">

                        <div class="featured-circle">
                            ⭐
                        </div>

                        <span>
                            FEATURED
                        </span>

                    </div>


                    <div class="featured-content">

                        <div class="featured-label">
                            Featured Opportunity
                        </div>

                        <h3>
                            ${ad.organization || "Featured Opportunity"}
                        </h3>

                        <p>
                            ${
                                ad.message ||
                                "Explore this featured opportunity."
                            }
                        </p>

                    </div>


                    ${
                        ad.website
                        ? `
                            <a
                                href="${ad.website}"
                                target="_blank"
                                rel="noopener noreferrer"
                                class="featured-button"
                            >
                                Explore
                                <span>→</span>
                            </a>
                        `
                        : ""
                    }

                </article>

            `;
        }


        // =====================================
        // PREMIUM BANNER
        // =====================================

        if (type === "banner") {

            return `

                <article class="roh-ad roh-ad-banner">

                    <div class="banner-glow"></div>

                    <div class="banner-icon">
                        ✨
                    </div>


                    <div class="banner-content">

                        <span class="banner-label">
                            PREMIUM SPONSOR
                        </span>

                        <h3>
                            ${ad.organization || "Advertisement"}
                        </h3>

                        <p>
                            ${
                                ad.message ||
                                "Discover something worth your attention."
                            }
                        </p>

                    </div>


                    ${
                        ad.website
                        ? `
                            <a
                                href="${ad.website}"
                                target="_blank"
                                rel="noopener noreferrer"
                                class="banner-button"
                            >
                                Learn More
                                <span>→</span>
                            </a>
                        `
                        : ""
                    }

                </article>

            `;
        }


        // =====================================
        // OTHER / FALLBACK
        // =====================================

        return `

            <article class="roh-ad roh-ad-default">

                <div class="default-icon">
                    📢
                </div>

                <div class="default-content">

                    <span class="default-label">
                        Sponsored
                    </span>

                    <h3>
                        ${ad.organization || "Advertisement"}
                    </h3>

                    <p>
                        ${
                            ad.message ||
                            "Discover this advertisement."
                        }
                    </p>

                </div>


                ${
                    ad.website
                    ? `
                        <a
                            href="${ad.website}"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="default-button"
                        >
                            Visit
                            <span>→</span>
                        </a>
                    `
                    : ""
                }

            </article>

        `;
    }


    // =========================================
    // DISPLAY ADS
    // =========================================

    container.innerHTML =
        pageAdvertisements
            .map(createAdvertisement)
            .join("");
}


// =========================================
// LOAD ADS
// =========================================

document.addEventListener(
    "DOMContentLoaded",
    loadAdvertisements
);

