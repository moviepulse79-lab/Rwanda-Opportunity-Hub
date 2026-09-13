const params = new URLSearchParams(
    window.location.search
);

const resourceId =
    Number(params.get("id"));


const resource =
    resources.find(
        item => item.id === resourceId
    );


// =========================================
// CHECK RESOURCE
// =========================================

if (!resource) {

    document.title =
        "Resource Not Found | Rwanda Opportunity Hub";


    const title =
        document.getElementById(
            "resourceTitle"
        );

    if (title) {

        title.textContent =
            "Resource Not Found";

    }

} else {


    // =========================================
    // PAGE TITLE
    // =========================================

    document.title =
        `${resource.title} | Rwanda Opportunity Hub`;


    // =========================================
    // BASIC INFORMATION
    // =========================================

    document.getElementById(
        "resourceType"
    ).textContent =
        resource.type;


    document.getElementById(
        "resourceTitle"
    ).textContent =
        resource.title;


    document.getElementById(
        "resourceDescription"
    ).textContent =
        resource.description;


    // =========================================
    // RESOURCE CONTENT
    // =========================================

    const content =
        document.getElementById(
            "resourceContent"
        );


    content.innerHTML = `

        <h2>
            Introduction
        </h2>

        <p>
            ${resource.description}
        </p>


        <h2>
            Why This Resource Matters
        </h2>

        <p>
            Access to reliable information and
            trusted learning resources can help
            students, graduates, job seekers,
            professionals and entrepreneurs make
            better career and education decisions.
        </p>


        <h2>
            How to Use This Resource
        </h2>

        <ul>

            <li>
                Read the information carefully before
                applying or registering.
            </li>

            <li>
                Check the official requirements and
                eligibility conditions.
            </li>

            <li>
                Prepare your documents and information
                before starting an application.
            </li>

            <li>
                Always verify important deadlines and
                instructions on the official website.
            </li>

            <li>
                Never pay money to an unofficial person
                promising guaranteed opportunities.
            </li>

        </ul>


        <h2>
            Who Can Benefit?
        </h2>

        <p>
            This resource may be useful for Rwandan
            students, graduates, job seekers,
            professionals, entrepreneurs and anyone
            looking to develop their skills or access
            new opportunities.
        </p>


        ${
            resource.link
                ? `
                    <div
                        class="official-resource-box"
                        style="
                            margin-top: 30px;
                            padding: 25px;
                            border-radius: 12px;
                            background: #111;
                            border: 1px solid #087f5b;
                        "
                    >

                        <h2>
                            Visit the Official Resource
                        </h2>

                        <p>
                            Use the official website below
                            to access the full resource,
                            application or information.
                        </p>

                        <a
                            href="${resource.link}"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="resource-button"
                            style="
                                display: inline-block;
                                margin-top: 10px;
                                padding: 12px 20px;
                                background: #087f5b;
                                color: white;
                                text-decoration: none;
                                border-radius: 8px;
                                font-weight: 600;
                            "
                        >
                            Visit Official Resource →
                        </a>

                    </div>
                `
                : ""
        }


        <h2>
            Final Advice
        </h2>

        <p>
            Always use official sources when applying
            for jobs, scholarships, training programmes
            or other opportunities. Keep your CV,
            certificates and professional profile
            updated, and continue developing your skills.
        </p>

    `;


    // =========================================
    // RELATED RESOURCES
    // =========================================

    const related =
        document.getElementById(
            "relatedResources"
        );


    const relatedResources =
        resources
            .filter(
                item =>
                    item.id !== resource.id &&
                    item.category === resource.category
            )
            .slice(0, 3);


    if (relatedResources.length > 0) {

        related.innerHTML =
            relatedResources
                .map(item => `

                    <a
                        href="resource.html?id=${item.id}"
                        class="related-resource"
                    >

                        <span class="related-icon">
                            ${item.icon}
                        </span>

                        <span>
                            ${item.title}
                        </span>

                    </a>

                `)
                .join("");

    } else {

        related.innerHTML = `

            <p>
                More resources coming soon.
            </p>

        `;

    }


    // =========================================
    // SHARE RESOURCE
    // =========================================

    const shareButton =
        document.getElementById(
            "shareResource"
        );


    if (shareButton) {

        shareButton.addEventListener(
            "click",
            async () => {

                const shareData = {

                    title:
                        resource.title,

                    text:
                        resource.description,

                    url:
                        window.location.href

                };


                if (
                    navigator.share
                ) {

                    try {

                        await navigator.share(
                            shareData
                        );

                    } catch (error) {

                        console.log(
                            "Share cancelled."
                        );

                    }

                } else {

                    try {

                        await navigator.clipboard
                            .writeText(
                                window.location.href
                            );


                        shareButton.textContent =
                            "✓ Link Copied!";


                        setTimeout(() => {

                            shareButton.textContent =
                                "↗ Share Resource";

                        }, 2000);


                    } catch (error) {

                        alert(
                            "Copy this page URL to share the resource."
                        );

                    }

                }

            }
        );

    }

}
