let editingOpportunityId = null;
async function loadAdminData() {

    // =========================================
    // GET OPPORTUNITIES FROM SUPABASE
    // =========================================

    const { data: opportunities, error } =
        await supabaseClient
            .from("opportunities")
            .select("*")
            .order("created_at", {
                ascending: false
            });

    if (error) {

        console.error(
            "Supabase opportunities error:",
            error
        );

        return;
    }

// =========================================
// GET API JOBS
// =========================================

let apiJobs = [];

try {

    const apiResponse = await fetch(
        "https://api.jobopportunitiesapi.org/public/jobs?country=RW&limit=50"
    );

    if (!apiResponse.ok) {
        throw new Error(
            `API request failed: ${apiResponse.status}`
        );
    }

    const apiResult = await apiResponse.json();

    apiJobs = (apiResult.data || []).map(job => ({

        id: `api-${job.id}`,

        api_id: job.id,

        slug: job.slug,

        title: job.title || "Untitled Job",

        organization: job.company || "Unknown Company",

        type: "job",

        location:
            job.location ||
            job.city ||
            "Rwanda",

        description:
            job.description || "",

        deadline:
            job.deadline || null,

        posted:
            job.posted_at || null,

        posted_date:
            job.posted_at || null,

        link:
            job.apply_url || "",

        apply_url:
            job.apply_url || "",

        company_logo:
            job.company_logo || "",

        category:
            job.category || "",

        source:
            job.source || "",

        isApiJob: true

    }));

    console.log(
        "API jobs loaded:",
        apiJobs.length,
        apiJobs
    );

} catch (error) {

    console.error(
        "Failed to load API jobs:",
        error
    );

}


// =========================================
// COMBINE SUPABASE + API JOBS
// =========================================

const supabaseOpportunities =
    opportunities || [];

const allOpportunities = [
    ...apiJobs,
    ...supabaseOpportunities
];


// Remove duplicates by title + organization

const uniqueOpportunities = [];

const seen = new Set();

allOpportunities.forEach(item => {

    const key =
        `${(item.title || "").toLowerCase().trim()}|` +
        `${(item.organization || "").toLowerCase().trim()}`;

    if (!seen.has(key)) {

        seen.add(key);

        uniqueOpportunities.push(item);
    }

});


// Use the final combined list

const combinedOpportunities =
    uniqueOpportunities;


    // =========================================
    // FILTER OPPORTUNITIES
    // =========================================

const jobsData = combinedOpportunities.filter(
    item =>
        item.type?.toLowerCase() === "job"
);

const scholarshipsData = combinedOpportunities.filter(
    item =>
        item.type?.toLowerCase() === "scholarship"
);

const fellowshipsData = combinedOpportunities.filter(
    item =>
        item.type?.toLowerCase() === "fellowship"
);

const trainingData = combinedOpportunities.filter(
    item =>
        item.type?.toLowerCase() === "training"
);

const resourcesData = combinedOpportunities.filter(
    item =>
        item.type?.toLowerCase() === "resource"
);

    // =========================================
    // GET PENDING SUBMISSIONS
    // =========================================

    const {
        data: submissions,
        error: submissionError
    } = await supabaseClient
        .from("pending_submissions")
        .select("*")
        .eq("status", "pending")
        .order("created_at", {
            ascending: false
        });

    if (submissionError) {

        console.error(
            "Pending submissions error:",
            submissionError
        );
    }

    const pendingSubmissions =
        submissions || [];


    // =========================================
    // STATISTICS
    // =========================================

    const total =
        document.getElementById(
            "totalOpportunities"
        );

    const jobs =
        document.getElementById(
            "totalJobs"
        );

    const scholarship =
        document.getElementById(
            "totalScholarships"
        );

    const resource =
        document.getElementById(
            "totalResources"
        );


    if (total) {
        total.textContent =
    combinedOpportunities.length;

    if (jobs) {

        jobs.textContent =
            jobsData.length;
    }

    if (scholarship) {

        scholarship.textContent =
            scholarshipsData.length;
    }

    if (resource) {

        resource.textContent =
            resourcesData.length;
    }
    }

    // =========================================
    // CREATE OPPORTUNITY ROW
    // =========================================

  function createOpportunityRow(item) {
    return `
        <div class="admin-table-row">

            <div class="table-title">
                <strong>${item.title || "Untitled"}</strong>
                <span>${item.organization || ""}</span>
            </div>

            <span class="table-badge">
                ${item.type || "Unknown"}
            </span>

            <span>
                ${item.location || "N/A"}
            </span>

            <span>
                ${item.deadline || "No deadline"}
            </span>

            <div class="table-actions">

               <button
    class="view-btn"
    onclick="${
        item.isApiJob
            ? `window.location.href='opportunity.html?apiJob=${encodeURIComponent(item.slug || item.api_id)}'`
            : `viewOpportunity('${item.id}')`
    }"
>
    View
</button>
  ${
        item.isApiJob
            ? `
                <span class="table-badge">
                    API
                </span>
              `
            : `
                <button
                    class="edit-btn"
                    onclick="editOpportunity('${item.id}')"
                >
                    Edit
                </button>

                <button
                    class="delete-btn"
                    onclick="deleteOpportunity('${item.id}')"
                >
                    Delete
                </button>
              `
    }

   </div>
    `;
}


    // =========================================
    // RECENT OPPORTUNITIES
    // =========================================

    const recentItems =
    combinedOpportunities.slice(0, 8);

    if (recent) {

        if (recentItems.length === 0) {

            recent.innerHTML = `
                <div class="empty-state">

                    <h3>
                        No opportunities yet
                    </h3>

                    <p>
                        Add your first opportunity
                        from the dashboard.
                    </p>

                </div>
            `;

        } else {

            recent.innerHTML = `
                <div class="admin-table">

                    <div class="admin-table-head">

                        <span>Opportunity</span>
                        <span>Type</span>
                        <span>Location</span>
                        <span>Deadline</span>
                        <span>Action</span>

                    </div>

                    ${recentItems
                        .map(createOpportunityRow)
                        .join("")}

                </div>
                  </div>
            `;
        }
    }


    // =========================================
    // ALL OPPORTUNITIES
    // =========================================

    const all =
        document.getElementById(
            "allOpportunities"
        );

    if (all) {

        if (combinedOpportunities.length === 0) {

            all.innerHTML = `
                <div class="empty-state">

                    <h3>
                        No opportunities found
                    </h3>

                </div>
            `;

        } else {

            all.innerHTML = `
                <div class="admin-table">

                    <div class="admin-table-head">

                        <span>Opportunity</span>
                        <span>Type</span>
                        <span>Location</span>
                        <span>Deadline</span>
                        <span>Action</span>

                    </div>

                    ${combinedOpportunities
    .map(createOpportunityRow)
    .join("")}
                </div>
            `;
        }
    }


    // =========================================
    // PENDING SUBMISSIONS
    // =========================================

    const pendingBox =
        document.getElementById(
            "pendingSubmissions"
        );

    if (pendingBox) {

        if (pendingSubmissions.length === 0) {

            pendingBox.innerHTML = `
                <div class="empty-state">

                    <h3>
                        No pending submissions
                    </h3>

                    <p>
                        New user submissions will
                        appear here for review.
                    </p>

                </div>
            `;

        } else {

            pendingBox.innerHTML = `

                <div class="admin-table">

                    <div class="admin-table-head">

                        <span>
                            Opportunity
                        </span>

                        <span>
                            Type
                        </span>

                        <span>
                            Organization
                        </span>

                        <span>
                            Deadline
                        </span>

                        <span>
                            Action
                        </span>

                    </div>

                    ${pendingSubmissions
                        .map(item => `

                        <div class="admin-table-row">

                            <div class="table-title">

                                <strong>
                                    ${item.title || "Untitled"}
                                </strong>

                                <span>
                                    ${item.location || "N/A"}
                                </span>

                            </div>

                            <span class="table-badge">
                                ${item.type || "Unknown"}
                            </span>

                            <span>
                                ${item.organization || "N/A"}
                            </span>

                            <span>
                                ${item.deadline || "No deadline"}
                            </span>

                            <div class="table-actions">

                                <button
                                    class="view-btn"
                                    onclick="
                                        viewSubmission(${item.id})
                                    "
                                >
                                    View
                                </button>

                                <button
                                    class="admin-primary-btn"
                                    onclick="
                                        approveSubmission(${item.id})
                                    "
                                >
                                    ✓ Approve
                                </button>

                                <button
                                    class="admin-secondary-btn"
                                    onclick="
                                        rejectSubmission(${item.id})
                                    "
                                >
                                    ✕ Reject
                                </button>

                            </div>

                        </div>

                    `).join("")}

                </div>
            `;
        }
    }


    // =========================================
    // RESOURCES
    // =========================================

    const resourceBox =
        document.getElementById(
            "adminResources"
        );

    if (resourceBox) {

        if (resourcesData.length === 0) {

            resourceBox.innerHTML = `
                <div class="empty-state">

                    <h3>
                        No resources found
                    </h3>

                </div>
            `;

        } else {

            resourceBox.innerHTML = `
                <div class="admin-table">

                    <div class="admin-table-head">

                        <span>Resource</span>
                        <span>Category</span>
                        <span>Action</span>

                    </div>

                    ${resourcesData
                        .map(resource => `

                        <div class="admin-table-row">

                            <div class="table-title">

                                <strong>
                                    ${resource.title || "Untitled"}
                                </strong>

                                <span>
                                    ${resource.description || ""}
                                </span>

                            </div>

                            <span>
                                ${resource.category || "General"}
                            </span>

                            <div>

                                <button
                                    class="view-btn"
                                    onclick="
                                        window.location.href =
                                        'resource.html?id=${resource.id}'
                                    "
                                >
                                    View
                                </button>

                            </div>

                        </div>

                    `).join("")}

                </div>
            `;
        }
    }


    // =========================================
    // SECTION NAVIGATION
    // =========================================

    const navLinks =
        document.querySelectorAll(
            ".admin-nav-link"
        );

    const sections =
        document.querySelectorAll(
            ".admin-section"
        );

    const pageTitle =
        document.getElementById(
            "pageTitle"
        );


    function showSection(sectionName) {

        sections.forEach(section => {

            section.classList.remove(
                "active"
            );

        });


        const selected =
            document.getElementById(
                sectionName + "Section"
            );


        if (selected) {

            selected.classList.add(
                "active"
            );
        }


        navLinks.forEach(link => {

            link.classList.remove(
                "active"
            );


            if (
                link.dataset.section ===
                sectionName
            ) {

                link.classList.add(
                    "active"
                );
            }
        });


        const titles = {

            dashboard:
                "Dashboard",

            opportunities:
                "Opportunities",

            submissions:
                "Pending Submissions",

            resources:
                "Resources",

            advertisements:
                "Advertisements",

            add:
                "Add Opportunity"

        };


        if (pageTitle) {

            pageTitle.textContent =
                titles[sectionName] ||
                "Dashboard";
        }
    }


    // =========================================
    // NAVIGATION EVENTS
    // =========================================

    navLinks.forEach(link => {

        link.addEventListener(
            "click",
            event => {

                event.preventDefault();

                showSection(
                    link.dataset.section
                );

            }
        );

    });


    // =========================================
    // OTHER SECTION BUTTONS
    // =========================================

    document
        .querySelectorAll(
            "[data-section]"
        )
        .forEach(button => {

            if (
                button.classList.contains(
                    "admin-nav-link"
                )
            ) {
                return;
            }


            button.addEventListener(
                "click",
                () => {

                    showSection(
                        button.dataset.section
                    );

                }
            );

        });


    // =========================================
    // ADMIN ADD OPPORTUNITY FORM
    // =========================================

   const form = document.getElementById("opportunityForm");

if (form) {

    form.addEventListener("submit", async event => {

        event.preventDefault();

        const formData = new FormData(form);

        const opportunity = {

            title: formData.get("title"),

            organization: formData.get("organization"),

            type: formData.get("type"),

            location: formData.get("location"),

            description: formData.get("description"),

            requirements: formData.get("requirements"),

            deadline: formData.get("deadline") || null,

            link: formData.get("link"),

            posted: formData.get("posted") || null

        };


        // =====================================
        // EDIT MODE
        // =====================================

        if (editingOpportunityId) {

            const { data, error } = await supabaseClient

                .from("opportunities")

                .update(opportunity)

                .eq("id", editingOpportunityId)

                .select();


            if (error) {

                console.error(error);

                alert(
                    "Failed to update opportunity.\n\n" +
                    error.message
                );

                return;
            }


            alert("Opportunity updated successfully.");

        }


        // =====================================
        // ADD MODE
        // =====================================

        else {

            const { data, error } = await supabaseClient

                .from("opportunities")

                .insert([opportunity])

                .select();


            if (error) {

                console.error(error);

                alert(
                    "Failed to add opportunity.\n\n" +
                    error.message
                );

                return;
            }


            alert("Opportunity published successfully.");

        }


        // =====================================
        // RESET
        // =====================================

        editingOpportunityId = null;

        form.reset();


        // Restore heading
        const heading =
            document.querySelector("#addSection h2");

        if (heading) {
            heading.textContent = "Add Opportunity";
        }


        // Restore description
        const paragraph =
            document.querySelector("#addSection .panel-header p");

        if (paragraph) {
            paragraph.textContent =
                "Create a new opportunity.";
        }


        // Restore button
        const submitButton =
            form.querySelector("button[type='submit']");

        if (submitButton) {
            submitButton.textContent =
                "Publish Opportunity";
        }


        // Reload admin data
        await loadAdminData();

    });

}
    // =========================================
// LOAD ADVERTISEMENTS
// =========================================

const {
    data: advertisements,
    error: advertisementError
} = await supabaseClient
    .from("advertisements")
    .select("*")
    .order("created_at", {
        ascending: false
    });

if (advertisementError) {
    console.error(
        "Advertisements error:",
        advertisementError
    );
}

const advertisementsData = advertisements || [];

// =========================================
// DISPLAY ADVERTISEMENTS
// =========================================

const advertisementBox =
    document.getElementById("adminAdvertisements");

if (advertisementBox) {

    if (advertisementsData.length === 0) {

        advertisementBox.innerHTML = `
            <div class="empty-state">
                <h3>No advertisement requests</h3>
                <p>
                    New advertisement requests
                    will appear here.
                </p>
            </div>
        `;

    } else {

        advertisementBox.innerHTML = `

            <div class="admin-table">

                <div class="admin-table-head">
    <span>Organization</span>
    <span>Type</span>
    <span>Contact</span>
    <span>Budget</span>
    <span>Status</span>
    <span>Placement</span>
    <span>Action</span>
</div>

                ${advertisementsData.map(ad => `

                    <div class="admin-table-row">

                        <div class="table-title">
                            <strong>
                                ${ad.organization || "Unknown"}
                            </strong>

                            <span>
                                ${ad.full_name || ""}
                            </span>
                        </div>

                        <span class="table-badge">
                            ${ad.advertisement_type || "N/A"}
                        </span>

                        <span>
                            ${ad.email || "N/A"}
                        </span>

                        <span>
                            ${ad.budget || "N/A"}
                        </span>

                        <span class="table-badge">
                            ${ad.status || "pending"}
                        </span>

                        <span class="table-badge">
    ${
        Array.isArray(ad.placements) && ad.placements.length
            ? ad.placements.join(", ")
            : "No placement"
    }
</span>

                        <div class="table-actions">

                            <button
                                class="view-btn"
                                onclick="viewAdvertisement(${ad.id})"
                            >
                                View
                            </button>

                            ${
                                ad.status === "pending"
                                ? `
                                    <button
                                        class="admin-primary-btn"
                                        onclick="approveAdvertisement(${ad.id})"
                                    >
                                        ✓ Approve
                                    </button>

                                    <button
                                        class="admin-secondary-btn"
                                        onclick="rejectAdvertisement(${ad.id})"
                                    >
                                        ✕ Reject
                                    </button>
                                `
                                : ""
                            }

                        </div>

                    </div>

                `).join("")}

            </div>
        `;
    }
}



}



// =========================================
// APPROVE SUBMISSION
// =========================================

async function approveSubmission(id) {

    const confirmed = confirm(
        "Are you sure you want to approve this submission?"
    );

    if (!confirmed) {
        return;
    }

    // -----------------------------------------
    // GET SUBMISSION
    // -----------------------------------------

    const {
        data: submission,
        error: submissionError
    } = await supabaseClient
        .from("pending_submissions")
        .select("*")
        .eq("id", id)
        .eq("status", "pending")
        .single();

    if (submissionError) {

        console.error(
            "Submission load error:",
            submissionError
        );

        alert(
            "Could not load submission."
        );

        return;
    }

    // -----------------------------------------
    // CREATE PUBLISHED OPPORTUNITY
    // -----------------------------------------

    const opportunity = {

        title:
            submission.title,

        organization:
            submission.organization,

        type:
            submission.type,

        location:
            submission.location,

        description:
            submission.description,

        requirements:
            submission.requirements,

        deadline:
            submission.deadline,

        link:
            submission.link,

        posted:
            submission.posted_date || null
    };

    console.log(
        "Publishing opportunity:",
        opportunity
    );

    // -----------------------------------------
    // INSERT INTO OPPORTUNITIES
    // -----------------------------------------

    const {
        data: publishedOpportunity,
        error: insertError
    } = await supabaseClient
        .from("opportunities")
        .insert([
            opportunity
        ])
        .select()
        .single();

    if (insertError) {

        console.error(
            "Approval insert error:",
            insertError
        );

        alert(
            "Could not publish opportunity. Check the Console."
        );

        return;
    }

    // -----------------------------------------
    // MARK SUBMISSION AS APPROVED
    // -----------------------------------------

    const {
        error: updateError
    } = await supabaseClient
        .from("pending_submissions")
        .update({
            status: "approved"
        })
        .eq("id", id)
        .eq("status", "pending");

    if (updateError) {

        console.error(
            "Status update error:",
            updateError
        );

        alert(
            "The opportunity was published, but its submission status could not be updated."
        );

        return;
    }

    console.log(
        "Published opportunity:",
        publishedOpportunity
    );

    alert(
        "✅ Opportunity approved and published!"
    );

    await loadAdminData();
}



// =========================================
// REJECT SUBMISSION
// =========================================

async function rejectSubmission(id) {

    const confirmed =
        confirm(
            "Are you sure you want to reject this submission?"
        );


    if (!confirmed) {
        return;
    }


    const {
        error
    } = await supabaseClient
        .from("pending_submissions")
        .update({
            status: "rejected"
        })
        .eq("id", id)
        .eq("status", "pending");


    if (error) {

        console.error(
            "Reject submission error:",
            error
        );

        alert(
            "Could not reject submission."
        );

        return;
    }


    alert(
        "❌ Submission rejected."
    );


    // Refresh list
    await loadAdminData();
}
// =========================================
// VIEW ADVERTISEMENT
// =========================================

async function viewAdvertisement(id) {

    const {
        data,
        error
    } = await supabaseClient
        .from("advertisements")
        .select("*")
        .eq("id", id)
        .single();

    if (error) {

        console.error(
            "View advertisement error:",
            error
        );

        alert("Could not load advertisement.");
        return;
    }

    alert(
        `ADVERTISEMENT\n\n` +

        `ORGANIZATION:\n${data.organization || "N/A"}\n\n` +

        `CONTACT NAME:\n${data.full_name || "N/A"}\n\n` +

        `EMAIL:\n${data.email || "N/A"}\n\n` +

        `PHONE:\n${data.phone || "N/A"}\n\n` +

        `TYPE:\n${data.advertisement_type || "N/A"}\n\n` +

        `WEBSITE:\n${data.website || "N/A"}\n\n` +

        `BUDGET:\n${data.budget || "N/A"}\n\n` +

        `MESSAGE:\n${data.message || "N/A"}\n\n` +
      `STATUS:\n${data.status || "N/A"}\n\n` +

`PAGES:\n${
    Array.isArray(data.placements)
        ? data.placements.join(", ")
        : "N/A"
}`
    );
}


// =========================================
// APPROVE ADVERTISEMENT
// =========================================

async function approveAdvertisement(id) {

    const confirmed = confirm(
        "Are you sure you want to approve this advertisement?"
    );

    if (!confirmed) return;

    const {
        error
    } = await supabaseClient
        .from("advertisements")
        .update({
            status: "approved"
        })
        .eq("id", id);

    if (error) {

        console.error(
            "Approve advertisement error:",
            error
        );

        alert(
            "Could not approve advertisement."
        );

        return;
    }

    alert(
        "✅ Advertisement approved!"
    );

    await loadAdminData();
}


// =========================================
// REJECT ADVERTISEMENT
// =========================================

async function rejectAdvertisement(id) {

    const confirmed = confirm(
        "Are you sure you want to reject this advertisement?"
    );

    if (!confirmed) return;

    const {
        error
    } = await supabaseClient
        .from("advertisements")
        .update({
            status: "rejected"
        })
        .eq("id", id);

    if (error) {

        console.error(
            "Reject advertisement error:",
            error
        );

        alert(
            "Could not reject advertisement."
        );

        return;
    }

    alert(
        "❌ Advertisement rejected."
    );

    await loadAdminData();
}

// =====================================
// VIEW OPPORTUNITY
// =====================================

function viewOpportunity(id) {
    window.location.href = `opportunity.html?id=${id}`;
}


// =====================================
// EDIT OPPORTUNITY
// =====================================

async function editOpportunity(id) {

    try {

        const { data, error } = await supabaseClient
            .from("opportunities")
            .select("*")
            .eq("id", id)
            .single();

        if (error) {
            console.error(error);
            alert("Failed to load opportunity.");
            return;
        }

        if (!data) {
            alert("Opportunity not found.");
            return;
        }

        // Save the ID we're editing
        editingOpportunityId = id;

        // Fill the form
        document.getElementById("opportunityTitle").value =
            data.title || "";

        document.getElementById("opportunityOrganization").value =
            data.organization || "";

        document.getElementById("opportunityType").value =
            data.type || "";

        document.getElementById("opportunityLocation").value =
            data.location || "";

        document.getElementById("opportunityLink").value =
            data.link || "";

        document.getElementById("opportunityDeadline").value =
            data.deadline || "";

        document.getElementById("opportunityPosted").value =
            data.posted || "";

        document.getElementById("opportunityDescription").value =
            data.description || "";

        document.getElementById("opportunityRequirements").value =
            data.requirements || "";

        // Change page title
        const addSection = document.getElementById("addSection");

        const heading = addSection.querySelector("h2");
        const paragraph = addSection.querySelector("p");

        if (heading) {
            heading.textContent = "Edit Opportunity";
        }

        if (paragraph) {
            paragraph.textContent =
                "Update the opportunity information.";
        }

        // Change submit button
        const submitButton = document.querySelector(
            "#opportunityForm button[type='submit']"
        );

        if (submitButton) {
            submitButton.textContent = "Update Opportunity";
        }

        // Show Add/Edit section
        document.querySelectorAll(".admin-section").forEach(section => {
            section.classList.remove("active");
        });

        addSection.classList.add("active");

        // Update sidebar active state
        document.querySelectorAll(".admin-nav-link").forEach(link => {
            link.classList.remove("active");
        });

        const addNav = document.querySelector(
            '.admin-nav-link[data-section="add"]'
        );

        if (addNav) {
            addNav.classList.add("active");
        }

        document.getElementById("pageTitle").textContent =
            "Edit Opportunity";

        // Scroll to form
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    } catch (err) {

        console.error(err);
        alert("Something went wrong while loading the opportunity.");

    }
}


// =====================================
// DELETE OPPORTUNITY
// =====================================
async function deleteOpportunity(id) {

    const confirmed = confirm(
        "Are you sure you want to delete this opportunity?"
    );

    if (!confirmed) return;

    console.log("DELETE ID:", id);

    // First check if Supabase can find this exact row
    const { data: existing, error: findError } = await supabaseClient
        .from("opportunities")
        .select("id, title")
        .eq("id", id);

    console.log("ROW FOUND:", existing);
    console.log("FIND ERROR:", findError);

    if (findError) {
        alert("Could not find opportunity:\n\n" + findError.message);
        return;
    }

    if (!existing || existing.length === 0) {
        alert(
            "The ID sent to delete does not match any database row.\n\n" +
            "ID: " + id
        );
        return;
    }

    // Delete
    const { error: deleteError } = await supabaseClient
        .from("opportunities")
        .delete()
        .eq("id", id);

    if (deleteError) {

        console.error("DELETE ERROR:", deleteError);

        alert(
            "Delete failed:\n\n" +
            deleteError.message
        );

        return;
    }

    // Verify deletion
    const { data: check } = await supabaseClient
        .from("opportunities")
        .select("id")
        .eq("id", id);

    if (check && check.length > 0) {

        alert(
            "The row was NOT deleted.\n\n" +
            "This is most likely a Supabase RLS DELETE policy problem."
        );

        console.error(
            "DELETE BLOCKED OR FILTER DID NOT MATCH:",
            check
        );

        return;
    }

    alert("Opportunity deleted successfully!");

    await loadAdminData();
}

// =========================================
// LOAD ADMIN DATA
// =========================================

loadAdminData();