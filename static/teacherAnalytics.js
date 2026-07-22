// static/teacherAnalytics.js

let trendChartInstance = null;

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Auth Check
    if (typeof checkAuthAndRole === 'function') {
        checkAuthAndRole('teacher');
    }

    // 2. Fetch real assessment data
    await loadTeacherAnalytics();
});

async function loadTeacherAnalytics() {
    try {
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        if (!session) return;

        // Query the teacher's past burnout assessments ordered by date
        const { data: logs, error } = await window.supabaseClient
            .from('burnout_assessments')
            .select('*')
            .eq('teacher_id', session.user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching burnout analytics:", error.message);
            return;
        }

        if (!logs || logs.length === 0) {
            console.log("No burnout assessments found for teacher.");
            return;
        }

        // Most recent assessment
        const latest = logs[0];

        // 1. Update Metric Cards
        updateMetricCards(latest, logs);

        // 2. Populate History Log Table
        renderHistoryTable(logs);

        // 3. Render Longitudinal Chart.js
        renderTrajectoryChart(logs.slice().reverse());

    } catch (err) {
        console.error("Failed to load teacher analytics:", err);
    }
}

function updateMetricCards(latest, logs) {
    // Overall Risk Index Card
    const riskNum = document.querySelector('.metric-card .metric-number');
    const riskBadge = document.querySelector('.metric-card .status-badge');
    const riskFooter = document.querySelector('.metric-card .metric-footer');

    if (riskNum) riskNum.textContent = latest.risk_index;

    if (riskBadge) {
        if (latest.risk_index > 70) {
            riskBadge.textContent = 'High Risk';
            riskBadge.className = 'status-badge status-overload';
            riskBadge.style.cssText = 'background: #fef2f2; color: #b91c1c; margin-left: auto;';
        } else if (latest.risk_index >= 50) {
            riskBadge.textContent = 'Moderate Risk';
            riskBadge.className = 'status-badge status-pending';
            riskBadge.style.cssText = 'background: #fffbeb; color: #b45309; margin-left: auto;';
        } else {
            riskBadge.textContent = 'Low Risk';
            riskBadge.className = 'status-badge status-active';
            riskBadge.style.cssText = 'background: #f0fdf4; color: #15803d; margin-left: auto;';
        }
    }

    if (riskFooter && logs.length > 1) {
        const diff = (latest.risk_index - logs[1].risk_index).toFixed(1);
        const isUp = diff >= 0;
        riskFooter.innerHTML = `<i class="fas fa-arrow-${isUp ? 'up' : 'down'}" style="color: ${isUp ? '#e11d48' : '#10b981'};"></i> ${isUp ? '+' : ''}${diff} points since last survey`;
    }

    // EE Subscale Card
    const eeCards = document.querySelectorAll('.metric-card');
    if (eeCards[1]) {
        eeCards[1].querySelector('.metric-number').textContent = latest.ee_score;
        const fill = eeCards[1].querySelector('.subscale-bar-fill');
        if (fill) fill.style.width = `${Math.min(100, Math.round((latest.ee_score / 54) * 100))}%`;
    }

    // DP Subscale Card
    if (eeCards[2]) {
        eeCards[2].querySelector('.metric-number').textContent = latest.dp_score;
        const fill = eeCards[2].querySelector('.subscale-bar-fill');
        if (fill) fill.style.width = `${Math.min(100, Math.round((latest.dp_score / 30) * 100))}%`;
    }

    // PA Subscale Card
    if (eeCards[3]) {
        eeCards[3].querySelector('.metric-number').textContent = latest.pa_score;
        const fill = eeCards[3].querySelector('.subscale-bar-fill');
        if (fill) fill.style.width = `${Math.min(100, Math.round((latest.pa_score / 48) * 100))}%`;
    }
}

function renderHistoryTable(logs) {
    const tableBody = document.querySelector('.data-table tbody');
    const logsCount = document.querySelector('.card-title span');

    if (logsCount) logsCount.textContent = `${logs.length} Survey${logs.length > 1 ? 's' : ''} Completed`;
    if (!tableBody) return;

    tableBody.innerHTML = '';

    logs.forEach(log => {
        const dateStr = new Date(log.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });

        let badgeClass = 'status-active';
        let statusText = 'Low Risk';
        if (log.risk_index > 70) {
            badgeClass = 'status-overload';
            statusText = 'High Risk';
        } else if (log.risk_index >= 50) {
            badgeClass = 'status-pending';
            statusText = 'Moderate';
        }

        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${dateStr}</strong></td>
            <td>${log.ee_score} / 54</td>
            <td>${log.dp_score} / 30</td>
            <td>${log.pa_score} / 48</td>
            <td><strong style="color: ${log.risk_index > 70 ? '#e11d48' : log.risk_index >= 50 ? '#f59e0b' : '#10b981'}">${log.risk_index} / 100</strong></td>
            <td><span class="status-badge ${badgeClass}">${statusText}</span></td>
            <td><button class="btn-outline btn-sm" onclick="window.location.href='teacher_report.html?id=${log.id}'"><i class="fas fa-file-alt"></i> View Report</button></td>
        `;
        tableBody.appendChild(row);
    });
}

function renderTrajectoryChart(orderedLogs) {
    const canvas = document.getElementById('burnoutTrendChart');
    if (!canvas) return;

    if (trendChartInstance) trendChartInstance.destroy();

    const labels = orderedLogs.map(l => new Date(l.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    const riskData = orderedLogs.map(l => l.risk_index);

    trendChartInstance = new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Composite Risk Index',
                data: riskData,
                borderColor: '#e11d48',
                backgroundColor: 'rgba(225, 29, 72, 0.1)',
                borderWidth: 3,
                pointRadius: 5,
                pointBackgroundColor: '#e11d48',
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { min: 0, max: 100 },
                x: { grid: { display: false } }
            }
        }
    });
}