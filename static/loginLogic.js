// static/loginLogic.js

const loginForm = document.getElementById('loginForm'); 

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    // Grab the value from the role dropdown
    const selectedRole = document.getElementById('role').value;

    const { data, error } = await window.supabaseClient.auth.signInWithPassword({
        email: email,
        password: password,
    });

    if (error) {
        console.error("Login failed:", error.message);
        alert("Error: " + error.message);
    } else {
        console.log("Login successful!", data);
        
        // Redirect dynamically based on the dropdown selection
        window.location.href = selectedRole; 
    }
});