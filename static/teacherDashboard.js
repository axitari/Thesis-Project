// static/teacherDashboard.js

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Authenticate user
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    if (!session) return;
    const userId = session.user.id;

    // 2. ONLY Fetch Workload Data (eSF7 specific)
    async function loadWorkload() {
        // Fetch Teaching Loads
        const { data: teachingLoads } = await window.supabaseClient
            .from('teaching_loads')
            .select('*')
            .eq('teacher_id', userId);

        // Fetch Ancillary Duties
        const { data: ancillaryDuties } = await window.supabaseClient
            .from('ancillary_duties')
            .select('*')
            .eq('teacher_id', userId);

        // Compute Totals (Strictly eSF7 compliance)
        // Teaching Load = Sum of minutes_per_week
        const totalTeachingMinutes = teachingLoads.reduce((sum, load) => sum + load.minutes_per_week, 0);
        
        // Ancillary Duties = Sum of hours_per_week (Excluded from teaching load total)
        const totalAncillaryHours = ancillaryDuties.reduce((sum, duty) => sum + parseFloat(duty.hours_per_week), 0);

        // Update Dashboard UI with these values
        console.log("Workload loaded successfully");
        // Update your HTML elements here (e.g., document.getElementById('teaching-total').innerText = ...)
    }

    loadWorkload();
});