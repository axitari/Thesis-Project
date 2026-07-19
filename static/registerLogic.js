// static/registerLogic.js

const registerForm = document.getElementById('registerForm');

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const role = document.getElementById('role').value;

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
    // TODO: confirm with teammate the exact casing/spelling used in the
    // "role" column (e.g. "Teacher" vs "teacher" vs "TEACHER"). Whatever
    // value goes in here MUST exactly match what loginLogic.js looks up,
    // or the post-login redirect will silently fall through to the default.
    // Normalized to lowercase so it matches the convention already used in
    // the profiles table (confirmed via testing: stored roles are lowercase,
    // e.g. "teacher" not "Teacher"). loginLogic.js also normalizes to
    // lowercase when reading this back, so this is a belt-and-suspenders fix.
    const normalizedRole = role.trim().toLowerCase();

    const { error: profileError } = await window.supabaseClient
        .from('profiles')
        .insert({
            id: userId,
            name: `${firstName} ${lastName}`.trim(),
            email: email,
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