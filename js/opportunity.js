document.addEventListener("DOMContentLoaded", () => {

    const params = new URLSearchParams(window.location.search);

    const apiJob = params.get("apiJob");
    const id = params.get("id");

    console.log("Opportunity:", { apiJob, id });


    // ==========================================
    // HELPERS
    // ==========================================

    function cleanText(text) {
        return String(text || "")
            .replace(/\r/g, "")
            .replace(/\u00a0/g, " ")
            .trim();
    }


    function getLines(text) {
        return cleanText(text)
            .split("\n")
            .map(line => line.trim())
            .filter(Boolean);
    }


    function isHeading(line) {

        const value = line
            .toLowerCase()
            .replace(/[’']/g, "'")
            .replace(/:/g, "")
            .trim();

        return [
            "about",
            "about the job",
            "about the opportunity",
            "overview",

            "responsibilities",
            "responsibility",
            "key responsibilities",
            "duties",
            "what you will be doing",
            "what you'll be doing",

            "requirements",
            "requirement",
            "qualifications",
            "minimum requirements",
            "required qualifications",

            "what we offer",
            "what's in it for you",
            "whats in it for you",
            "benefits",
            "perks",

            "how to apply",
            "application"
        ].includes(value);
    }


    function normalizeHeading(line) {

        return cleanText(line)
            .toLowerCase()
            .replace(/[’']/g, "'")
            .replace(/:/g, "")
            .trim();
    }


    // ==========================================
    // PARSE DESCRIPTION
    // ==========================================

    function parseDescription(description) {

    const result = {
        about: [],
        responsibilities: [],
        requirements: [],
        offer: [],
        application: []
    };

    if (!description || typeof description !== "string") {
        return result;
    }

    const lines = description
        .replace(/\r/g, "")
        .split("\n")
        .map(line => line.trim())
        .filter(line => line.length > 0);

    let section = "about";

    lines.forEach(line => {

        // Remove bullet characters
        const cleanLine = line
            .replace(/^[-•●▪◦*]\s*/, "")
            .trim();

        if (!cleanLine) return;

        const lower = cleanLine.toLowerCase();

        // ==============================
        // RESPONSIBILITIES
        // ==============================
        if (
            /^(what you will be doing|what you'll be doing|responsibilities|responsibility|key responsibilities|duties|your responsibilities|job responsibilities|role responsibilities)/i.test(lower)
        ) {
            section = "responsibilities";
            return;
        }

        // ==============================
        // REQUIREMENTS
        // ==============================
        if (
            /^(requirements|requirement|qualifications|qualification|minimum requirements|minimum qualifications|required qualifications|what we're looking for|what we are looking for|who we're looking for|who we are looking for|skills|experience required)/i.test(lower)
        ) {
            section = "requirements";
            return;
        }

        // ==============================
        // WHAT WE OFFER
        // ==============================
        if (
            /^(what we offer|what's in it for you|whats in it for you|what is in it for you|benefits|perks|we offer|our offer|employee benefits|why work for|why join us|what you get)/i.test(lower)
        ) {
            section = "offer";
            return;
        }

        // ==============================
        // APPLICATION
        // ==============================
        if (
            /^(how to apply|how do i apply|application|apply now|to apply|application process|interested candidates)/i.test(lower)
        ) {
            section = "application";
            return;
        }

        // ==============================
        // ABOUT / INTRO
        // ==============================
        if (
            /^(about the job|about the opportunity|about|overview|job overview|role overview|position overview|the role|about us|company overview)/i.test(lower)
        ) {
            section = "about";
            return;
        }

        // ==============================
        // ADD CONTENT
        // ==============================

        if (section === "about") {
            result.about.push(cleanLine);

        } else if (section === "responsibilities") {
            result.responsibilities.push(cleanLine);

        } else if (section === "requirements") {
            result.requirements.push(cleanLine);

        } else if (section === "offer") {
            result.offer.push(cleanLine);

        } else if (section === "application") {
            result.application.push(cleanLine);
        }

    });

    console.log("PARSED DESCRIPTION:", result);

    return result;
}


    // ==========================================
    // CREATE LIST ITEM
    // ==========================================

    function addListItem(list, text) {

        const li = document.createElement("li");

        li.textContent = text
            .replace(/^[-•*]\s*/, "")
            .trim();

        list.appendChild(li);
    }


    // ==========================================
    // DISPLAY API JOB
    // ==========================================

    async function loadApiOpportunity() {

        try {

            console.log("Loading API job:", apiJob);

            const response = await fetch(
                `https://api.jobopportunitiesapi.org/public/jobs/${encodeURIComponent(apiJob)}`
            );


            if (!response.ok) {

                throw new Error(
                    `API error: ${response.status}`
                );

            }


            const result = await response.json();

            console.log("API RESPONSE:", result);


            const job = result.data || result;


            if (!job) {
                throw new Error("Job data not found.");
            }


            const description =
    job.description ||
    result.description ||
    result.data?.description ||
    "";

console.log("RAW DESCRIPTION:", description);

const parsed = parseDescription(description);

console.log("PARSED DESCRIPTION:", parsed);


            console.log("PARSED DESCRIPTION:", parsed);


             const opportunity = {
    id: `api-${job.id}`,
    api_id: job.id,
    slug: job.slug,
    isApiJob: true,
    title: job.title || "Untitled Job",

                organization:
                    job.company ||
                    "Unknown Organization",

                location:
                    job.location ||
                    job.city ||
                    "Rwanda",

                type: "job",

                category:
                    job.category ||
                    "General",

                experience:
                    job.seniority ||
                    "Not specified",

                posted_date:
                    job.posted_at ||
                    "",

                deadline:
                    job.deadline ||
                    "",

                description,

                responsibilities:
                    parsed.responsibilities,

                requirements:
                    parsed.requirements,

                whatWeOffer:
                    parsed.offer,

                application:
                    parsed.application,

                link:
                    job.apply_url ||
                    "#",

                company_logo:
                    job.company_logo ||
                    "",

                source:
                    job.source ||
                    ""

            };


            displayOpportunity(opportunity);

        } catch (error) {

            console.error(
                "API opportunity error:",
                error
            );

            showError(
                "Unable to load this job opportunity."
            );

        }

    }


    // ==========================================
    // DISPLAY OPPORTUNITY
    // ==========================================

    function displayOpportunity(opportunity) {

        console.log(
            "DISPLAYING:",
            opportunity
        );


        // --------------------------------------
        // TITLE
        // --------------------------------------

        const title =
            document.querySelector(
                ".opportunity-title-area h1"
            );

        if (title) {
            title.textContent =
                opportunity.title;
        }


        // --------------------------------------
        // ORGANIZATION
        // --------------------------------------

        const organization =
            document.querySelector(
                ".organization-name"
            );

        if (organization) {

            organization.textContent =
                opportunity.organization;

        }


        // --------------------------------------
        // BREADCRUMB
        // --------------------------------------

        const breadcrumb =
            document.querySelector(
                ".breadcrumb span:last-child"
            );

        if (breadcrumb) {

            breadcrumb.textContent =
                opportunity.title;

        }


        // --------------------------------------
        // LOGOS
        // --------------------------------------

        document
            .querySelectorAll(".large-company-logo")
            .forEach(logo => {

                if (opportunity.company_logo) {

                    logo.innerHTML = `
                        <img
                            src="${opportunity.company_logo}"
                            alt="${opportunity.organization}"
                        >
                    `;

                } else {

                    logo.textContent =
                        opportunity.organization
                            .charAt(0)
                            .toUpperCase();

                }

            });


        // --------------------------------------
        // HEADER META
        // --------------------------------------

        const meta =
            document.querySelectorAll(
                ".header-meta span"
            );


        if (meta[0]) {

            meta[0].textContent =
                `📍 ${opportunity.location}`;

        }


        if (meta[1]) {

            meta[1].textContent =
                `💼 ${opportunity.type || "Job"}`;

        }


        if (meta[2]) {

            meta[2].textContent =
                `🏷 ${opportunity.category || "General"}`;

        }


        // ======================================
        // ABOUT
        // ======================================

        const aboutBlock =
            document.getElementById(
                "aboutOpportunityBlock"
            );

        const aboutContent =
            document.getElementById(
                "aboutOpportunityContent"
            );


        if (aboutBlock && aboutContent) {

            aboutContent.innerHTML = "";


            const aboutLines =
                opportunity.description
                    ? parseDescription(
                        opportunity.description
                    ).about
                    : [];


            if (aboutLines.length) {

                aboutLines.forEach(line => {

                    const p =
                        document.createElement("p");

                    p.textContent =
                        line.replace(
                            /^[-•*]\s*/,
                            ""
                        );

                    aboutContent.appendChild(p);

                });

            } else {

                const p =
                    document.createElement("p");

                p.textContent =
                    "No description provided.";

                aboutContent.appendChild(p);

            }

        }


        // ======================================
        // RESPONSIBILITIES
        // ======================================

        const responsibilitiesBlock =
            document.getElementById(
                "responsibilitiesBlock"
            );

        const responsibilitiesList =
            document.getElementById(
                "responsibilitiesList"
            );


        if (
            responsibilitiesBlock &&
            responsibilitiesList
        ) {

            responsibilitiesList.innerHTML = "";


            if (
                opportunity.responsibilities &&
                opportunity.responsibilities.length
            ) {

                opportunity.responsibilities
                    .forEach(item => {

                        addListItem(
                            responsibilitiesList,
                            item
                        );

                    });

                responsibilitiesBlock.style.display =
                    "";

            } else {

                responsibilitiesBlock.style.display =
                    "none";

            }

        }


        // ======================================
        // REQUIREMENTS
        // ======================================

        const requirementsBlock =
            document.getElementById(
                "requirementsBlock"
            );

        const requirementsList =
            document.getElementById(
                "requirementsList"
            );


        if (
            requirementsBlock &&
            requirementsList
        ) {

            requirementsList.innerHTML = "";


            if (
                opportunity.requirements &&
                opportunity.requirements.length
            ) {

                opportunity.requirements
                    .forEach(item => {

                        addListItem(
                            requirementsList,
                            item
                        );

                    });

                requirementsBlock.style.display =
                    "";

            } else {

                requirementsBlock.style.display =
                    "none";

            }

        }


        // ======================================
        // WHAT WE OFFER
        // ======================================

        const offerBlock =
            document.getElementById(
                "whatWeOfferBlock"
            );

        const offerList =
            document.getElementById(
                "whatWeOfferList"
            );


        if (
            offerBlock &&
            offerList
        ) {

            offerList.innerHTML = "";


            if (
                opportunity.whatWeOffer &&
                opportunity.whatWeOffer.length
            ) {

                opportunity.whatWeOffer
                    .forEach(item => {

                        addListItem(
                            offerList,
                            item
                        );

                    });

                offerBlock.style.display =
                    "";

            } else {

                offerBlock.style.display =
                    "none";

            }

        }


        // ======================================
        // APPLY BUTTON
        // ======================================

        const applyButton =
            document.querySelector(
                ".apply-button"
            );


        if (applyButton) {

            if (
                opportunity.link &&
                opportunity.link !== "#"
            ) {

                applyButton.href =
                    opportunity.link;

                applyButton.target =
                    "_blank";

                applyButton.rel =
                    "noopener noreferrer";

            } else {

                applyButton.style.display =
                    "none";

            }

        }


        // ======================================
        // QUICK INFO
        // ======================================

        const infoItems =
            document.querySelectorAll(
                ".info-item strong"
            );


        if (infoItems[0]) {

            infoItems[0].textContent =
                opportunity.location;

        }


        if (infoItems[1]) {

            infoItems[1].textContent =
                "Full Time";

        }


        if (infoItems[2]) {

            infoItems[2].textContent =
                opportunity.experience ||
                "Not specified";

        }


        if (infoItems[3]) {

            infoItems[3].textContent =
                opportunity.category ||
                "General";

        }


        if (infoItems[4]) {

            infoItems[4].textContent =
                formatDate(
                    opportunity.posted_date
                );

        }


        if (infoItems[5]) {

            infoItems[5].textContent =
                opportunity.deadline
                    ? formatDate(
                        opportunity.deadline
                    )
                    : "Not specified";

        }


        // ======================================
        // ORGANIZATION CARD
        // ======================================

        const orgStrong =
            document.querySelector(
                ".organization-profile strong"
            );

        if (orgStrong) {

            orgStrong.textContent =
                opportunity.organization;

        }


        const orgDescription =
            document.querySelector(
                ".organization-card p"
            );

        if (orgDescription) {

            orgDescription.textContent =
                `Explore opportunities from ${opportunity.organization}.`;

        }


        // ======================================
        // DEADLINE CARD
        // ======================================

        const deadlineStrong =
            document.querySelector(
                ".deadline-warning strong"
            );

        if (deadlineStrong) {

            deadlineStrong.textContent =
                opportunity.deadline
                    ? formatDate(
                        opportunity.deadline
                    )
                    : "No deadline specified";

        }


        // ======================================
        // APPLICATION NOTE
        // ======================================

        const applicationSection =
            [...document.querySelectorAll(
                ".content-block"
            )]
            .find(block =>
                block.querySelector("h2")?.textContent
                    .trim()
                    .toLowerCase() ===
                "how to apply"
            );


        if (applicationSection) {

            const paragraphs =
                applicationSection
                    .querySelectorAll("p");


            if (opportunity.application?.length) {

                paragraphs[0].textContent =
                    opportunity.application.join(" ");

            }

        }
// ======================================
// SHARE OPPORTUNITY
// ======================================

const shareButton = document.getElementById("shareButton");

if (shareButton) {

    shareButton.onclick = async () => {

        const shareUrl = window.location.href;

        const shareData = {
            title: opportunity.title || "Opportunity",
            text: `Check out this opportunity on Rwanda Opportunity Hub: ${opportunity.title}`,
            url: shareUrl
        };

        try {

            // Mobile / supported browsers
            if (navigator.share) {

                await navigator.share(shareData);

            } else {

                // Desktop fallback
                await navigator.clipboard.writeText(shareUrl);

                const originalText =
                    shareButton.innerHTML;

                shareButton.innerHTML =
                    "✓ Link Copied!";

                setTimeout(() => {

                    shareButton.innerHTML =
                        originalText;

                }, 2000);

            }

        } catch (error) {

            // User pressed Cancel
            if (error.name !== "AbortError") {

                console.error(
                    "Share failed:",
                    error
                );

                // Final fallback
                try {

                    await navigator.clipboard.writeText(
                        shareUrl
                    );

                    alert(
                        "Opportunity link copied!"
                    );

                } catch (copyError) {

                    console.error(
                        "Copy failed:",
                        copyError
                    );

                }

            }

        }

    };

}
setupSharing(opportunity);
        // ======================================
        // RELATED
        // ======================================

        if (!opportunity.isApiJob) {

            loadRelatedOpportunities(
                opportunity
            );

        }

    }


    // ==========================================
    // SUPABASE OPPORTUNITY
    // ==========================================

    async function loadSupabaseOpportunity() {

        try {

            if (
                typeof supabaseClient ===
                "undefined"
            ) {

                throw new Error(
                    "Supabase client not found."
                );

            }


            const {
                data,
                error
            } = await supabaseClient

                .from("opportunities")

                .select("*")

                .eq("id", id)

                .single();


            if (error) {

                throw error;

            }


            if (!data) {

                throw new Error(
                    "Opportunity not found."
                );

            }


            data.isApiJob = false;

            displayOpportunity(
                data
            );


            loadRelatedOpportunities(
                data
            );


        } catch (error) {

            console.error(
                "Supabase opportunity error:",
                error
            );

            showError(
                "Opportunity not found."
            );

        }

    }


    // ==========================================
    // RELATED OPPORTUNITIES
    // ==========================================

    async function loadRelatedOpportunities(
        opportunity
    ) {

        const grid =
            document.getElementById(
                "relatedGrid"
            );


        if (!grid) return;


        try {

            const {
                data,
                error
            } = await supabaseClient

                .from("opportunities")

                .select("*")

                .eq(
                    "type",
                    opportunity.type
                )

                .neq(
                    "id",
                    opportunity.id
                )

                .limit(4);


            if (error) {

                console.error(
                    "Related opportunities error:",
                    error
                );

                return;

            }


            grid.innerHTML = "";


            data.forEach(item => {

                const card =
                    document.createElement("div");

                card.className =
                    "related-card";


                card.innerHTML = `

                    <h3>
                        ${item.title}
                    </h3>

                    <p>
                        ${item.organization || ""}
                    </p>

                    <a
                        href="opportunity.html?id=${item.id}"
                    >
                        View Opportunity →
                    </a>

                `;


                grid.appendChild(card);

            });


        } catch (error) {

            console.error(
                "Related error:",
                error
            );

        }

    }


    // ==========================================
    // ERROR
    // ==========================================

    function showError(message) {

        const content =
            document.querySelector(
                ".opportunity-content"
            );


        if (!content) return;


        content.innerHTML = `

            <div class="content-block">

                <h2>
                    Error
                </h2>

                <p>
                    ${message}
                </p>

            </div>

        `;

    }


    // ==========================================
    // DATE FORMAT
    // ==========================================

    function formatDate(date) {

        if (!date) {
            return "Not specified";
        }


        const parsed =
            new Date(date);


        if (
            Number.isNaN(
                parsed.getTime()
            )
        ) {

            return date;

        }


        return parsed.toLocaleDateString(
            "en-US",
            {
                year: "numeric",
                month: "long",
                day: "numeric"
            }
        );

    }


    // ==========================================
    // START
    // ==========================================

    if (apiJob) {

        loadApiOpportunity();

    } else if (id) {

        loadSupabaseOpportunity();

    } else {

        showError(
            "No opportunity selected."
        );

    }

});

// ======================================
// SOCIAL SHARING
// ======================================

function setupSharing(opportunity) {

    const shareUrl = window.location.href;

    const title =
        opportunity.title || "Opportunity";

    const text =
        `Check out this opportunity on Rwanda Opportunity Hub: ${title}`;

    // ----------------------------------
    // TOP SHARE BUTTON
    // ----------------------------------

    const shareButton =
        document.getElementById("shareButton");

    if (shareButton) {

        shareButton.onclick = async () => {

            if (navigator.share) {

                try {

                    await navigator.share({
                        title: title,
                        text: text,
                        url: shareUrl
                    });

                } catch (error) {

                    if (error.name !== "AbortError") {
                        console.error("Share failed:", error);
                    }

                }

            } else {

                try {

                    await navigator.clipboard.writeText(shareUrl);

                    const oldText =
                        shareButton.innerHTML;

                    shareButton.innerHTML =
                        "✓ Link Copied!";

                    setTimeout(() => {

                        shareButton.innerHTML =
                            oldText;

                    }, 2000);

                } catch (error) {

                    prompt(
                        "Copy this opportunity link:",
                        shareUrl
                    );

                }

            }

        };

    }


    // ----------------------------------
    // WHATSAPP
    // ----------------------------------

    const whatsapp =
        document.getElementById("shareWhatsApp");

    if (whatsapp) {

        whatsapp.onclick = () => {

            const message =
                `${text}\n\n${shareUrl}`;

            const whatsappUrl =
                `https://wa.me/?text=${encodeURIComponent(message)}`;

            window.open(
                whatsappUrl,
                "_blank"
            );

        };

    }


    // ----------------------------------
    // FACEBOOK
    // ----------------------------------

    const facebook =
        document.getElementById("shareFacebook");

    if (facebook) {

        facebook.onclick = () => {

            const facebookUrl =
                `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;

            window.open(
                facebookUrl,
                "_blank",
                "width=600,height=500"
            );

        };

    }


    // ----------------------------------
    // LINKEDIN
    // ----------------------------------

    const linkedin =
        document.getElementById("shareLinkedIn");

    if (linkedin) {

        linkedin.onclick = () => {

            const linkedinUrl =
                `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;

            window.open(
                linkedinUrl,
                "_blank",
                "width=600,height=600"
            );

        };

    }

}
