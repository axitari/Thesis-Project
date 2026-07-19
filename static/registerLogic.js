// static/registerLogic.js

const registerForm = document.getElementById('registerForm');

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const role = document.getElementById('role').value;

    // The database's role column is a Postgres enum that ONLY accepts:
    // 'admin', 'principal', 'teacher'. There is no separate enum value for
    // Master Teacher — confirmed by querying enum_range() directly — so we
    // map it down to 'teacher' here. Any future new dropdown option MUST be
    // added to this map, or the insert below will fail with an invalid enum
    // value error.
    const formRoleToEnum = {
        'Teacher': 'teacher',
        'Master Teacher': 'teacher',
        'Principal / School Head': 'principal'
    };
    const normalizedRole = formRoleToEnum[role];

    if (!normalizedRole) {
        console.error(`No enum mapping for role "${role}" — check register.html's role dropdown values against formRoleToEnum.`);
        alert('Something went wrong with the selected role. Please contact an administrator.');
        return;
    }

    // NOTE: division/school are collected on this form but the existing
    // "profiles" table (built by teammate) doesn't have matching columns yet
    // (it has "position" and "specialization" instead, which may or may not
    // be meant for this). Not inserting them for now — revisit once that's
    // confirmed, otherwise this data is silently dropped just like before.

    // Step 1: create the actual login credentials in Supabase Auth
    const { data, error } = await window.supabaseClient.auth.signUp({
        email: email,
        password: password,
    });

    if (error) {
        console.error("Registration failed:", error.message);
        alert("Error: " + error.message);
        return;
    }

    const userId = data.user ? data.user.id : null;

    if (!userId) {
        console.error("Sign up succeeded but no user id was returned.");
        alert("Account created, but we couldn't finish setting up your profile. Please contact an administrator.");
        return;
    }

    // Step 2: create the profile row.
    // email removed — the profiles table does not have an email column;
    // email already lives on auth.users and is available via session.user.email
    const { error: profileError } = await window.supabaseClient
        .from('profiles')
        .insert({
            id: userId,
            first_name: firstName,
            last_name: lastName,
            role: normalizedRole
        });

    if (profileError) {
        console.error("Profile creation failed:", profileError.message);
        alert("Account created, but profile setup failed: " + profileError.message + "\nPlease contact an administrator.");
        return;
    }

    console.log("Registration successful!", data);
    alert("Success! Check your email for a confirmation link, or go log in if email confirmation is disabled.");

    window.location.href = "login.html";
});