(async () => {

    const {
        data: { session }
    } = await supabaseClient.auth.getSession();

    if (!session) {

        window.location.href = "login.html";

        return;
    }

    console.log(
        "Admin authenticated:",
        session.user.email
    );

})();