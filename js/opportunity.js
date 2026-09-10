document.addEventListener("DOMContentLoaded", () => {

    const params = new URLSearchParams(window.location.search);

    const apiJob = params.get("apiJob");
    const id = params.get("id");
    const requestedType = params.get("type");

    console.log("Opportunity:", {
        apiJob,
        id,
        requestedType
    });


    // ==========================================
    // HELPERS
    // ==========================================

    function cleanText(text) {

        return String(text || "")
            .replace(/\r/g, "")
            .replace(/\u00a0/g, " ")
            .trim();

    }


    function addListItem(list, text) {

        if (!list || !text) return;

        const li = document.createElement("li");

        li.textContent = String(text)
            .replace(/^[-•●▪◦*]\s*/, "")
            .trim();

        list.appendChild(li);

    }


    function formatDate(date) {

        if (!date) {
            return "Not specified";
        }

        const parsed = new Date(date);

        if (Number.isNaN(parsed.getTime())) {
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
    // DESCRIPTION PARSER
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
            .filter(Boolean);

        let section = "about";


        lines.forEach(line => {

            const cleanLine = line
                .replace(/^[-•●▪◦*]\s*/, "")
                .trim();

            if (!cleanLine) return;

            const lower = cleanLine.toLowerCase();


            // RESPONSIBILITIES

            if (
                /^(what you will be doing|what you'll be doing|responsibilities|responsibility|key responsibilities|duties|your responsibilities|job responsibilities|role responsibilities)/i.test(lower)
            ) {

                section = "responsibilities";
                return;

            }


            // REQUIREMENTS

            if (
                /^(requirements|requirement|qualifications|qualification|minimum requirements|minimum qualifications|required qualifications|what we're looking for|what we are looking for|who we're looking for|who we are looking for|skills|experience required|eligibility|eligibility requirements)/i.test(lower)
            ) {

                section = "requirements";
                return;

            }


            // WHAT WE OFFER / FUNDING

            if (
                /^(what we offer|what's in it for you|whats in it for you|what is in it for you|benefits|perks|we offer|our offer|employee benefits|why work for|why join us|what you get|funding|scholarship benefits|award benefits|financial support)/i.test(lower)
            ) {

                section = "offer";
                return;

            }


            // APPLICATION

            if (
                /^(how to apply|how do i apply|application|apply now|to apply|application process|interested candidates|application procedure)/i.test(lower)
            ) {

                section = "application";
                return;

            }


            // ABOUT

            if (
                /^(about the job|about the opportunity|about|overview|job overview|role overview|position overview|the role|about us|company overview|scholarship overview|programme overview)/i.test(lower)
            ) {

                section = "about";
                return;

            }


            // ADD CONTENT

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


        return result;

    }


    // ==========================================
    // GET DESCRIPTION CONTENT
    // ==========================================

    function getDescriptionSections(opportunity) {

        const parsed =
            parseDescription(
                opportunity.description || ""
            );

        return {

            about:
                parsed.about.length
                    ? parsed.about
                    : opportunity.description
                        ? [cleanText(opportunity.description)]
                        : [],

            responsibilities:
                opportunity.responsibilities ||
                parsed.responsibilities ||
                [],

            requirements:
                opportunity.requirements ||
                parsed.requirements ||
                [],

            offer:
                opportunity.whatWeOffer ||
                parsed.offer ||
                [],

            application:
                opportunity.application ||
                parsed.application ||
                []

        };

    }


    // ==========================================
    // SET PAGE TYPE
    // ==========================================

    function isScholarship(opportunity) {

        return (
            opportunity.type === "scholarship" ||
            requestedType === "scholarship"
        );

    }


    // ==========================================
    // DISPLAY OPPORTUNITY
    // ==========================================

    function displayOpportunity(opportunity) {

        console.log(
            "DISPLAYING OPPORTUNITY:",
            opportunity
        );


        const scholarship =
            isScholarship(opportunity);


        // ======================================
        // PAGE TITLE
        // ======================================

        document.title =
            `${opportunity.title || "Opportunity"} | Rwanda Opportunity Hub`;


        // ======================================
        // TITLE
        // ======================================

        const title =
            document.querySelector(
                ".opportunity-title-area h1"
            );

        if (title) {

            title.textContent =
                opportunity.title ||
                "Untitled Opportunity";

        }


        // ======================================
        // ORGANIZATION
        // ======================================

        const organization =
            document.querySelector(
                ".organization-name"
            );

        if (organization) {

            organization.textContent =
                opportunity.organization ||
                "Unknown Organization";

        }


        // ======================================
        // BREADCRUMB
        // ======================================

        const breadcrumb =
            document.querySelector(
                ".breadcrumb span:last-child"
            );

        if (breadcrumb) {

            breadcrumb.textContent =
                opportunity.title ||
                "Opportunity";

        }


        // ======================================
        // BREADCRUMB LINK
        // ======================================

        const breadcrumbLink =
            document.querySelector(
                ".breadcrumb a"
            );

        if (breadcrumbLink) {

            if (scholarship) {

                breadcrumbLink.textContent =
                    "Scholarships";

                breadcrumbLink.href =
                    "scholarships.html";

            } else {

                breadcrumbLink.textContent =
                    "Jobs";

                breadcrumbLink.href =
                    "jobs.html";

            }

        }


        // ======================================
        // TYPE BADGE
        // ======================================

        const jobBadge =
            document.querySelector(
                ".job-type-badge"
            );

        if (jobBadge) {

            if (scholarship) {

                jobBadge.textContent =
                    "SCHOLARSHIP";

            } else {

                jobBadge.textContent =
                    String(
                        opportunity.type ||
                        "FULL TIME"
                    ).toUpperCase();

            }

        }


        // ======================================
        // LOGOS
        // ======================================

        document
            .querySelectorAll(".large-company-logo")
            .forEach(logo => {

                if (opportunity.company_logo) {

                    logo.innerHTML = `
                        <img
                            src="${opportunity.company_logo}"
                            alt="${opportunity.organization || ""}"
                        >
                    `;

                } else {

                    logo.textContent =
                        String(
                            opportunity.organization ||
                            "O"
                        )
                        .charAt(0)
                        .toUpperCase();

                }

            });


        // ======================================
        // HEADER META
        // ======================================

        const meta =
            document.querySelectorAll(
                ".header-meta span"
            );


        if (meta[0]) {

            meta[0].textContent =
                `📍 ${opportunity.location || "International"}`;

        }


        if (meta[1]) {

            if (scholarship) {

                meta[1].textContent =
                    `🎓 ${opportunity.level || "All Levels"}`;

            } else {

                meta[1].textContent =
                    `💼 ${opportunity.type || "Job"}`;

            }

        }


        if (meta[2]) {

            meta[2].textContent =
                `🏷 ${opportunity.category || "General"}`;

        }


        // ======================================
        // DESCRIPTION
        // ======================================

        const sections =
            getDescriptionSections(
                opportunity
            );


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


            if (sections.about.length) {

                sections.about.forEach(text => {

                    const p =
                        document.createElement("p");

                    p.textContent =
                        cleanText(text);

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
                !scholarship &&
                sections.responsibilities.length
            ) {

                sections.responsibilities.forEach(item => {

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
                sections.requirements.length
            ) {

                sections.requirements.forEach(item => {

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
                sections.offer.length
            ) {

                sections.offer.forEach(item => {

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
        // HOW TO APPLY
        // ======================================

        const applicationSection =
            [...document.querySelectorAll(
                ".content-block"
            )]
            .find(block =>
                block.querySelector("h2")
                    ?.textContent
                    .trim()
                    .toLowerCase() ===
                "how to apply"
            );


        if (applicationSection) {

            const paragraphs =
                applicationSection
                    .querySelectorAll("p");


            if (
                scholarship &&
                sections.application.length
            ) {

                paragraphs[0].textContent =
                    sections.application.join(" ");

            } else if (!scholarship) {

                paragraphs[0].textContent =
                    "Interested candidates should prepare an updated CV and submit their application through the organization's official application process.";

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

                applyButton.style.display =
                    "";

            } else {

                applyButton.style.display =
                    "none";

            }

        }


        // ======================================
        // APPLY NOTE
        // ======================================

        const applyNote =
            document.querySelector(
                ".apply-note"
            );

        if (applyNote) {

            applyNote.textContent =
                scholarship
                    ? "You will be redirected to the official scholarship application or information page."
                    : "You will be redirected to the organization's official application page.";

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
                opportunity.location ||
                "International";

        }


        if (infoItems[1]) {

            if (scholarship) {

                infoItems[1].textContent =
                    opportunity.level ||
                    "All Levels";

            } else {

                infoItems[1].textContent =
                    opportunity.type ||
                    "Full Time";

            }

        }


        if (infoItems[2]) {

            if (scholarship) {

                infoItems[2].textContent =
                    opportunity.funding ||
                    "See official details";

            } else {

                infoItems[2].textContent =
                    opportunity.experience ||
                    "Not specified";

            }

        }


        if (infoItems[3]) {

            infoItems[3].textContent =
                opportunity.category ||
                "General";

        }


        if (infoItems[4]) {

            infoItems[4].textContent =
                formatDate(
                    opportunity.posted ||
                    opportunity.posted_date ||
                    opportunity.created_at
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
                opportunity.organization ||
                "Unknown Organization";

        }


        const orgDescription =
            document.querySelector(
                ".organization-card p"
            );

        if (orgDescription) {

            orgDescription.textContent =
                scholarship
                    ? `Learn more about scholarships offered by ${opportunity.organization || "this organization"}.`
                    : `Explore opportunities from ${opportunity.organization || "this organization"}.`;

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
        // DEADLINE LABEL
        // ======================================

        const deadlineLabel =
            document.querySelector(
                ".deadline-warning span"
            );

        if (deadlineLabel) {

            deadlineLabel.textContent =
                scholarship
                    ? "APPLICATION DEADLINE"
                    : "APPLICATION DEADLINE";

        }


        // ======================================
        // SHARE
        // ======================================

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
    // LOAD SUPABASE OPPORTUNITY
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
    // LOAD API JOB
    // ==========================================

    async function loadApiOpportunity() {

        try {

            console.log(
                "Loading API job:",
                apiJob
            );


            const response =
                await fetch(
                    `https://api.jobopportunitiesapi.org/public/jobs/${encodeURIComponent(apiJob)}`
                );


            if (!response.ok) {

                throw new Error(
                    `API error: ${response.status}`
                );

            }


            const result =
                await response.json();


            const job =
                result.data ||
                result;


            if (!job) {

                throw new Error(
                    "Job data not found."
                );

            }


            const description =
                job.description ||
                result.description ||
                result.data?.description ||
                "";


            const parsed =
                parseDescription(
                    description
                );


            const opportunity = {

                id:
                    `api-${job.id}`,

                api_id:
                    job.id,

                slug:
                    job.slug,

                isApiJob:
                    true,

                title:
                    job.title ||
                    "Untitled Job",

                organization:
                    job.company ||
                    "Unknown Organization",

                location:
                    job.location ||
                    job.city ||
                    "Rwanda",

                type:
                    "job",

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


            displayOpportunity(
                opportunity
            );


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
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
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


            if (!data || !data.length) {
                return;
            }


            data.forEach(item => {

                const card =
                    document.createElement(
                        "div"
                    );

                card.className =
                    "related-card";


                card.innerHTML = `

                    <h3>
                        ${item.title || ""}
                    </h3>

                    <p>
                        ${item.organization || ""}
                    </p>

                    <a
                        href="opportunity.html?id=${item.id}&type=${encodeURIComponent(item.type || "")}"
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

        const main =
            document.querySelector(
                "main"
            );

        if (!main) return;


        const firstSection =
            main.querySelector(
                ".opportunity-section"
            );


        if (firstSection) {

            firstSection.innerHTML = `

                <div class="section-container">

                    <section class="content-block">

                        <h2>
                            Error
                        </h2>

                        <p>
                            ${message}
                        </p>

                    </section>

                </div>

            `;

        }

    }


    // ==========================================
    // SOCIAL SHARING
    // ==========================================

    function setupSharing(opportunity) {

        const shareUrl =
            window.location.href;

        const title =
            opportunity.title ||
            "Opportunity";

        const text =
            `Check out this opportunity on Rwanda Opportunity Hub: ${title}`;


        // TOP SHARE BUTTON

        const shareButton =
            document.getElementById(
                "shareButton"
            );


        if (shareButton) {

            shareButton.onclick =
                async () => {

                    if (navigator.share) {

                        try {

                            await navigator.share({
                                title,
                                text,
                                url: shareUrl
                            });

                        } catch (error) {

                            if (
                                error.name !==
                                "AbortError"
                            ) {

                                console.error(
                                    "Share failed:",
                                    error
                                );

                            }

                        }

                    } else {

                        try {

                            await navigator.clipboard
                                .writeText(
                                    shareUrl
                                );


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


        // WHATSAPP

        const whatsapp =
            document.getElementById(
                "shareWhatsApp"
            );


        if (whatsapp) {

            whatsapp.onclick = () => {

                const message =
                    `${text}\n\n${shareUrl}`;


                const whatsappUrl =
                    `https://wa.me/?text=${encodeURIComponent(
                        message
                    )}`;


                window.open(
                    whatsappUrl,
                    "_blank"
                );

            };

        }


        // FACEBOOK

        const facebook =
            document.getElementById(
                "shareFacebook"
            );


        if (facebook) {

            facebook.onclick = () => {

                const facebookUrl =
                    `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                        shareUrl
                    )}`;


                window.open(
                    facebookUrl,
                    "_blank",
                    "width=600,height=500"
                );

            };

        }


        // LINKEDIN

        const linkedin =
            document.getElementById(
                "shareLinkedIn"
            );


        if (linkedin) {

            linkedin.onclick = () => {

                const linkedinUrl =
                    `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                        shareUrl
                    )}`;


                window.open(
                    linkedinUrl,
                    "_blank",
                    "width=600,height=600"
                );

            };

        }

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
