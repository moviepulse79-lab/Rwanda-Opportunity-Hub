exports.handler = async function () {

    try {

        const apiKey = process.env.SCHOLARSHIP_API_KEY;

        if (!apiKey) {

            return {
                statusCode: 500,
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    error: "Scholarship API key is not configured."
                })
            };

        }


        const response = await fetch(
            "https://api.scholarshipapi.com/v1/search",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`
                },

                body: JSON.stringify({
                    q: "international students",
                    limit: 50
                })
            }
        );


        if (!response.ok) {

            const errorText = await response.text();

            console.error(
                "ScholarshipAPI error:",
                response.status,
                errorText
            );

            return {
                statusCode: response.status,
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    error: "Scholarship API request failed."
                })
            };

        }


        const data = await response.json();


        return {
            statusCode: 200,

            headers: {
                "Content-Type": "application/json",
                "Cache-Control": "public, max-age=1800"
            },

            body: JSON.stringify(data)
        };


    } catch (error) {

        console.error(
            "Scholarship function error:",
            error
        );

        return {
            statusCode: 500,

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                error: "Unable to load scholarships."
            })
        };

    }

};
