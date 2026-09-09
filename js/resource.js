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
            Why This Matters
        </h2>

        <p>
            Preparing yourself properly can make a
            major difference when applying for
            opportunities. Taking time to understand
            what organizations are looking for can
            help you present your skills and experience
            more effectively.
        </p>


        <h2>
            Practical Tips
        </h2>

        <ul>

            <li>
                Understand the opportunity before
                applying.
            </li>

            <li>
                Prepare your documents carefully.
            </li>

            <li>
                Highlight your relevant skills and
                experience.
            </li>

            <li>
                Check all requirements and deadlines.
            </li>

            <li>
                Submit your application early whenever
                possible.
            </li>

        </ul>


        <h2>
            Final Advice
        </h2>

        <p>
            Keep improving your skills, stay informed
            about new opportunities and continue
            building your professional profile.
            Consistency can open doors to new
            opportunities.
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

                    title: resource.title,

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