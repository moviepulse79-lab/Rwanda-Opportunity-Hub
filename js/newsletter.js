document.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("newsletterForm");
    const emailInput = document.getElementById("newsletterEmail");
    const consentInput = document.getElementById("newsletterConsent");
    const button = document.getElementById("newsletterButton");
    const message = document.getElementById("newsletterMessage");

    if (!form) return;

    form.addEventListener("submit", async (event) => {

        event.preventDefault();

        const email = emailInput.value.trim();

        if (!email) {
            message.textContent = "Please enter your email address.";
            return;
        }

        if (!consentInput.checked) {
            message.textContent =
                "Please confirm that you want to receive updates.";
            return;
        }

        button.disabled = true;
        button.textContent = "…";

        message.textContent = "Subscribing...";

        try {

            const response = await fetch(
                "/.netlify/functions/subscribe",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        email: email
                    })
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message ||
                    "Unable to subscribe right now."
                );
            }

            message.textContent =
                "You're subscribed! 🎉";

            emailInput.value = "";
            consentInput.checked = false;

        } catch (error) {

            console.error(
                "Newsletter subscription error:",
                error
            );

            message.textContent =
                error.message ||
                "Something went wrong. Please try again.";

        } finally {

            button.disabled = false;
            button.textContent = "→";

        }

    });

});
