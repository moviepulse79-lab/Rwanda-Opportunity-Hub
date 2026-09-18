// =========================================
// ROH NEWSLETTER SUBSCRIPTION
// =========================================

document.addEventListener("DOMContentLoaded", () => {

    const newsletterForm =
        document.getElementById("newsletterForm");

    const newsletterEmail =
        document.getElementById("newsletterEmail");

    const newsletterButton =
        document.getElementById("newsletterButton");

    const newsletterMessage =
        document.getElementById("newsletterMessage");


    if (!newsletterForm) return;


    newsletterForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const email =
                newsletterEmail.value
                    .trim()
                    .toLowerCase();


            if (!email) {

                newsletterMessage.textContent =
                    "Please enter your email address.";

                return;

            }


            if (!newsletterEmail.checkValidity()) {

                newsletterMessage.textContent =
                    "Please enter a valid email address.";

                return;

            }


            newsletterButton.disabled = true;

            newsletterButton.textContent =
                "...";

            newsletterMessage.textContent =
                "Subscribing...";


            try {

                const {
                    data,
                    error
                } = await window.supabaseClient

                    .from("newsletter_subscribers")

                    .insert([
                        {
                            email: email
                        }
                    ]);


                if (error) {

                    // Already subscribed
                    if (
                        error.code === "23505"
                    ) {

                        newsletterMessage.textContent =
                            "You're already subscribed.";

                    } else {

                        console.error(
                            "Newsletter subscription error:",
                            error
                        );

                        newsletterMessage.textContent =
                            "Something went wrong. Please try again.";

                    }

                    return;

                }


                newsletterEmail.value = "";


                newsletterMessage.textContent =
                    "You're subscribed! 🎉";


            } catch (error) {

                console.error(
                    "Newsletter error:",
                    error
                );

                newsletterMessage.textContent =
                    "Something went wrong. Please try again.";

            } finally {

                newsletterButton.disabled =
                    false;

                newsletterButton.textContent =
                    "→";

            }

        }
    );

});
