// static/registerLogic.js

const registerForm = document.getElementById('registerForm'); // Adjust ID to match your friend's HTML

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Assuming the HTML has inputs with these IDs
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    // Supabase sign up
    const { data, error } = await window.supabaseClient.auth.signUp({
        email: email,
        password: password,
    });

    if (error) {
        console.error("Registration failed:", error.message);
        alert("Error: " + error.message);
    } else {
        console.log("Registration successful!", data);
        alert("Success! Check your email for a confirmation link, or go log in if email confirmation is disabled.");
        
        // Redirect back to login page
        window.location.href = "login.html";
    }
});