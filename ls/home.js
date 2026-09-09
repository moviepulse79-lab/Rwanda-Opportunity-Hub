document.addEventListener("DOMContentLoaded", async () => {

    const container =
        document.getElementById("homeOpportunities");

    if (!container) return;

    try {

       const { data, error } =
    await  window.supabaseClient
        .from("opportunities")
        .select("*")
        .order("created_at", {
            ascending: false
        })
        .limit(6);

        if (error) {
            console.error("Failed to load homepage opportunities:", error);
            return;
        }

        if (!data || data.length === 0) {

            container.innerHTML = `
                <div class="no-results">
                    <h3>No opportunities available</h3>
                    <p>Check back soon for new opportunities.</p>
                </div>
            `;

            return;
        }

        container.innerHTML = data.map(opportunity => {

            const type =
                (opportunity.type || "job").toLowerCase();

            const typeClass =
                type === "scholarship"
                    ? "scholarship"
                    : type === "internship"
                    ? "internship"
                    : type === "fellowship"
                    ? "fellowship"
                    : "job";

            const initial =
                (opportunity.organization || "O")
                    .charAt(0)
                    .toUpperCase();

            return `

                <article class="opportunity-card">

                    <div class="opportunity-top">

                        <span class="opportunity-type ${typeClass}">
                            ${type.toUpperCase()}
                        </span>

                        <span class="verified-badge">
                            ✓ Verified
                        </span>

                    </div>

                    <div class="organization">

                        <div class="organization-logo">
                            ${initial}
                        </div>

                        <div>
                            <strong>
                                ${opportunity.organization || ""}
                            </strong>

                            <small>
                                ${opportunity.location || "Rwanda"}
                            </small>
                        </div>

                    </div>

                    <h3>
                        ${opportunity.title || "Untitled Opportunity"}
                    </h3>

                    <p>
                        ${opportunity.description || ""}
                    </p>

                    <div class="opportunity-meta">

                        <span>
                            📍 ${opportunity.location || "Rwanda"}
                        </span>

                        <span>
                            💼 ${opportunity.type || "Opportunity"}
                        </span>

                    </div>

                    <div class="opportunity-footer">

                        <span class="deadline">
                            Deadline:
                            ${opportunity.deadline || "No deadline"}
                        </span>

                        <a href="opportunity.html?id=${opportunity.id}&type=${type}">
                            View →
                        </a>

                    </div>

                </article>

            `;

        }).join("");

    } catch (error) {

        console.error(
            "Homepage loading error:",
            error
        );

    }

});