<script src="../static/supabaseClient.js"></script>
<script>
    document.addEventListener('DOMContentLoaded', async () => {
        // Parse access session from link redirect
        const { data: { session }, error } = await window.supabaseClient.auth.getSession();

        if (error || !session) {
            console.error("Activation link invalid or expired.");
            alert("Activation link has expired or is invalid. Please log in or request a new invite.");
            window.location.href = "login.html";
            return;
        }

        console.log("Account successfully activated for user:", session.user.email);
        
        // Redirect to login or setup after 3 seconds
        setTimeout(() => {
            window.location.href = "login.html";
        }, 3000);
    });
</script>