// static/teacherDashboard.js

let teacherWellnessChartInstance = null;
let teacherWorkloadChartInstance = null;

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Authenticate user
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    if (!session) return;
    const userId = session.user.id;

    // 2. Load Workload & Render Visualizations
    async function loadWorkload() {
        try {
            // Fetch User Profile
            const { data: profile } = await window.supabaseClient
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (profile) {
                const welcomeHeading = document.querySelector('.welcome-header h1');
                if (welcomeHeading) {
                    welcomeHeading.innerText = `👋 Welcome back, ${profile.first_name || ''} ${profile.last_name || 'Teacher'}`;
                }
            }

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

            // Compute Totals
            const totalTeachingMinutes = (teachingLoads || []).reduce((sum, load) => sum + (load.minutes_per_week || 0), 0);
            const totalTeachingHours = (totalTeachingMinutes / 60);
            const totalAncillaryHours = (ancillaryDuties || []).reduce((sum, duty) => sum + parseFloat(duty.hours_per_week || 0), 0);
            const totalWorkloadHours = (totalTeachingHours + totalAncillaryHours);

            // Render Chart.js Analytics
            renderTeacherCharts(totalWorkloadHours, totalTeachingHours, totalAncillaryHours);

        } catch (err) {
            console.error("Failed to load teacher workload:", err);
            // Fallback rendering
            renderTeacherCharts(27, 22, 5);
        }
    }

    loadWorkload();
});

function renderTeacherCharts(userTotal, teachingHrs, ancillaryHrs) {
    Chart.defaults.font.family = "'Inter', sans-serif";
    Chart.defaults.color = '#64748b';

    // 1. Wellness Baseline Chart (Bar / Radar)
    const wellnessCanvas = document.getElementById('teacherWellnessChart');
    if (wellnessCanvas) {
        if (teacherWellnessChartInstance) teacherWellnessChartInstance.destroy();

        teacherWellnessChartInstance = new Chart(wellnessCanvas.getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['Emotional Exhaustion', 'Depersonalization', 'Personal Accomplishment'],
                datasets: [{
                    label: 'Score (%)',
                    data: [65, 30, 78],
                    backgroundColor: ['#f59e0b', '#10b981', '#3b82f6'],
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${ctx.raw}%` } }
                },
                scales: {
                    y: { min: 0, max: 100, ticks: { stepSize: 20 } },
                    x: { grid: { display: false } }
                }
            }
        });
    }

    // 2. Workload Comparison Chart (Horizontal Bar Chart)
    const workloadCanvas = document.getElementById('teacherWorkloadChart');
    if (workloadCanvas) {
        if (teacherWorkloadChartInstance) teacherWorkloadChartInstance.destroy();

        teacherWorkloadChartInstance = new Chart(workloadCanvas.getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['Your Total', 'Dept Avg', 'Dept Min'],
                datasets: [{
                    label: 'Hours / Week',
                    data: [userTotal.toFixed(1), 40, 32],
                    backgroundColor: ['#C8102E', '#64748b', '#cbd5e1'],
                    borderRadius: 6
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { callbacks: { label: (ctx) => `${ctx.raw} hrs/week` } }
                },
                scales: {
                    x: { min: 0, max: 50, title: { display: true, text: 'Hours per Week' } },
                    y: { grid: { display: false } }
                }
            }
        });
    }
}