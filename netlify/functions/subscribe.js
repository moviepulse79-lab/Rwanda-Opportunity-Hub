exports.handler = async function (event) {

    if (event.httpMethod !== "POST") {
        return {
            statusCode: 405,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: "Method not allowed."
            })
        };
    }

    try {

        const body = JSON.parse(event.body || "{}");

        const email = String(body.email || "")
            .trim()
            .toLowerCase();

        if (!email) {
            return {
                statusCode: 400,
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    message: "Email address is required."
                })
            };
        }

        const emailRegex =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            return {
                statusCode: 400,
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    message: "Please enter a valid email address."
                })
            };
        }

        const resendApiKey =
            process.env.RESEND_API_KEY;

        if (!resendApiKey) {

            console.error(
                "RESEND_API_KEY is not configured."
            );

            return {
                statusCode: 500,
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    message:
                        "Newsletter service is not configured yet."
                })
            };
        }

        /*
         * =========================================
         * 1. ADD SUBSCRIBER TO RESEND
         * =========================================
         */

        const contactResponse = await fetch(
            "https://api.resend.com/contacts",
            {
                method: "POST",

                headers: {
                    "Authorization":
                        `Bearer ${resendApiKey}`,

                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    email: email,
                    unsubscribed: false,
                    segments: [
                        {
                            id:
                                "a83c6dec-e783-4e41-b283-0677e98a8b60"
                        }
                    ]
                })
            }
        );

        const contactData =
            await contactResponse.json();

        if (!contactResponse.ok) {

            console.error(
                "Resend contact error:",
                contactData
            );

            /*
             * If the email already exists,
             * don't treat it as a fatal error.
             */
            const alreadyExists =
                contactResponse.status === 409 ||
                String(contactData?.message || "")
                    .toLowerCase()
                    .includes("already");

            if (!alreadyExists) {

                return {
                    statusCode: contactResponse.status,
                    headers: {
                        "Content-Type":
                            "application/json"
                    },
                    body: JSON.stringify({
                        message:
                            contactData?.message ||
                            "Unable to subscribe this email."
                    })
                };
            }
        }

        /*
         * =========================================
         * 2. SEND NOTIFICATION TO YOU
         * =========================================
         */

        const notificationResponse = await fetch(
            "https://api.resend.com/emails",
            {
                method: "POST",

                headers: {
                    "Authorization":
                        `Bearer ${resendApiKey}`,

                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({

                    from:
                        "Rwanda Opportunity Hub <onboarding@resend.dev>",

                    to: [
                        "moviepulse79@gmail.com"
                    ],

                    subject:
                        "🎉 New Rwanda Opportunity Hub Subscriber",

                    html: `
                        <div style="font-family:Arial,sans-serif;line-height:1.6;">

                            <h2>
                                🎉 New Newsletter Subscriber
                            </h2>

                            <p>
                                Someone just subscribed to
                                <strong>Rwanda Opportunity Hub</strong>.
                            </p>

                            <p>
                                <strong>Subscriber email:</strong><br>
                                ${email}
                            </p>

                            <p>
                                You can now contact them personally
                                if you want to welcome them.
                            </p>

                            <hr>

                            <p style="color:#666;font-size:13px;">
                                This notification was generated automatically
                                by Rwanda Opportunity Hub.
                            </p>

                        </div>
                    `
                })
            }
        );

        const notificationData =
            await notificationResponse.json();

        if (!notificationResponse.ok) {

            /*
             * The subscriber was already saved,
             * so don't tell the visitor their signup failed
             * just because your notification failed.
             */

            console.error(
                "Notification email error:",
                notificationData
            );
        }

        /*
         * =========================================
         * 3. SUCCESS
         * =========================================
         */

        return {
            statusCode: 200,

            headers: {
                "Content-Type":
                    "application/json"
            },

            body: JSON.stringify({
                success: true,
                message:
                    "Successfully subscribed."
            })
        };

    } catch (error) {

        console.error(
            "Newsletter function error:",
            error
        );

        return {
            statusCode: 500,

            headers: {
                "Content-Type":
                    "application/json"
            },

            body: JSON.stringify({
                message:
                    "Something went wrong. Please try again."
            })
        };
    }
};
