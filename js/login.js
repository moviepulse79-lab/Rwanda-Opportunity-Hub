const loginForm = document.getElementById("loginForm");
const message = document.getElementById("message");

loginForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    message.textContent = "Signing in...";

    const email =
        document.getElementById("email").value.trim();

    const password =
        document.getElementById("password").value;

    const { data, error } =
        await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });

    if (error) {

        console.error("Login error:", error);

        message.textContent = error.message;

        return;
    }

    console.log("Logged in:", data.user);

    window.location.href = "admin.html";

});