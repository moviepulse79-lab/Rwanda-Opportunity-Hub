
// =========================================
// ADVERTISEMENT FORM
// =========================================

document.addEventListener("DOMContentLoaded", () => {

    const form =
        document.getElementById("advertisementForm");

    const message =
        document.getElementById("formMessage");

    const submitButton =
        document.getElementById("submitAdvertisement");


    if (!form) {
        console.error("Advertisement form not found.");
        return;
    }


    // =========================================
    // SUBMIT FORM
    // =========================================

    form.addEventListener("submit", async (event) => {

        // IMPORTANT:
        // Stop normal browser form submission
        event.preventDefault();


        if (!supabaseClient) {

            console.error(
                "Supabase client is not available."
            );

            message.textContent =
                "Unable to connect to the server.";

            message.style.color = "red";

            return;
        }


        // Disable button while submitting
        submitButton.disabled = true;

        submitButton.textContent =
            "Submitting...";


        // Get form values
        const fullName =
            document.getElementById("fullName").value.trim();

        const organization =
            document.getElementById("organization").value.trim();

        const email =
            document.getElementById("email").value.trim();

        const phone =
            document.getElementById("phone").value.trim();

        const advertisementType =
            document.getElementById("advertisementType").value;

        const website =
            document.getElementById("website").value.trim();

        const messageText =
            document.getElementById("message").value.trim();

        const budget =
            document.getElementById("budget").value;

            const placementCheckboxes =
    document.querySelectorAll(
        'input[name="placements"]:checked'
    );

const placements =
    Array.from(placementCheckboxes)
        .map(checkbox => checkbox.value);


        // =========================================
        // VALIDATION
        // =========================================

if (
    !fullName ||
    !organization ||
    !email ||
    !advertisementType ||
    !messageText ||
    placements.length === 0
) {

message.textContent =
    "Please fill in all required fields and select at least one advertisement placement.";

            message.style.color = "red";

            submitButton.disabled = false;

            submitButton.textContent =
                "Submit Advertisement Request";

            return;
        }


        // =========================================
        // PREPARE DATA
        // =========================================

        const advertisement = {

            full_name: fullName,

            organization: organization,

            email: email,

            phone: phone || null,

            advertisement_type:
                advertisementType,

            website:
                website || null,

            message:
                messageText,

            budget:
                budget || null,

                 placements:
        placements,

            status:
                "pending"
        };


        console.log(
            "Submitting advertisement:",
            advertisement
        );


        // =========================================
        // SEND TO SUPABASE
        // =========================================

       const { error } = await supabaseClient
    .from("advertisements")
    .insert([advertisement]);


        // =========================================
        // ERROR
        // =========================================

        if (error) {
    console.error("Advertisement submission error:", error);
    console.error("Error message:", error.message);
    console.error("Error details:", error.details);
    console.error("Error hint:", error.hint);
    console.error("Error code:", error.code);

            message.textContent =
                "Something went wrong. Please try again.";

            message.style.color = "red";

            submitButton.disabled = false;

            submitButton.textContent =
                "Submit Advertisement Request";

            return;
        }


        // =========================================
        // SUCCESS
        // =========================================

        console.log("Advertisement submitted successfully!");


        message.textContent =
            "✅ Advertisement request submitted successfully! Our team will review it before publication.";

        message.style.color =
            "green";


        // Clear form
        form.reset();


        // Restore button
        submitButton.disabled = false;

        submitButton.textContent =
            "Submit Advertisement Request";

    });

});

