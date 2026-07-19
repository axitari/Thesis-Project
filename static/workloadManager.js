// static/workloadManager.js

document.addEventListener('DOMContentLoaded', () => {
    const teachingLoadForm = document.getElementById('teachingLoadForm');

    if (teachingLoadForm) {
        teachingLoadForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // 1. Get user session
            const { data: { session } } = await window.supabaseClient.auth.getSession();
            if (!session) return;

            // 2. Gather values
            const subject = document.getElementById('subjectCategory').value;
            const minutes = parseInt(document.getElementById('minutesPerWeek').value);

            // 3. Insert into Supabase 'teaching_loads' table
            const { error } = await window.supabaseClient
                .from('teaching_loads')
                .insert([
                    { 
                        teacher_id: session.user.id, 
                        subject_category: subject,
                        grade_level: subject, 
                        minutes_per_week: minutes 
                    }
                ]);

            if (error) {
                alert("Error adding class: " + error.message);
            } else {
                alert("Class added successfully!");
                location.reload(); // Refresh to update the UI
            }
        });
    }
});