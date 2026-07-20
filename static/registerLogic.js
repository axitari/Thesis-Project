// static/registerLogic.js

const registerForm = document.getElementById('registerForm');

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const role = document.getElementById('role').value;

    // Maps the frontend HTML value attributes to the database ENUM values
    const formRoleToEnum = {
        'Teacher': 'teacher',
        'Master Teacher': 'teacher',
        'Principal': 'principal'
    };
    const normalizedRole = formRoleToEnum[role];

    if (!normalizedRole) {
        console.error(`No enum mapping for role "${role}" — check register.html dropdown values.`);
        alert('Something went wrong with the selected role. Please contact an administrator.');
        return;
    }

    // Pass all profile data as secure registration metadata to the Auth signup
    const { data, error } = await window.supabaseClient.auth.signUp({
        email: email,
        password: password,
        options: {
            data: {
                first_name: firstName,
                last_name: lastName,
                role: normalizedRole
            }
        }
    });

    if (error) {
        console.error("Registration failed:", error.message);
        alert("Registration Error: " + error.message);
        return;
    }

    console.log("Registration successful! Backend trigger handling profile creation.", data);
    alert("Success! Account successfully created. You may now log in.");

    window.location.href = "login.html";
});