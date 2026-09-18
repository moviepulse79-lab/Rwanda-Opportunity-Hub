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

        const response = await fetch(
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

        const data = await response.json();

        if (!response.ok) {

            console.error(
                "Resend API error:",
                data
            );

            return {
                statusCode: response.status,
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    message:
                        data?.message ||
                        "Resend could not add this email."
                })
            };

        }

        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json"
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
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message:
                    "Something went wrong. Please try again."
            })
        };

    }

};
