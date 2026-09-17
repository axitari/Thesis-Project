/**
 * Faculty Workload Quantification Report Logic
 * Dynamically parses teacher codes, fetches dataset records, and renders audit values.
 */

document.addEventListener('DOMContentLoaded', () => {
    initReportData();
});

function initReportData() {
    const workloadDatabase = {
        'TCH-012': {
            name: 'Juan Dela Cruz',
            dept: 'Araling Panlipunan',
            position: 'Teacher III',
            hours: '48.0 Hours / Week',
            status: 'CRITICAL OVERLOAD',
            theme: 'danger',
            teachingLoadSubtotal: '20.0 hrs/wk',
            ancillaryLoadSubtotal: '28.0 hrs/wk',
            evaluation: '<i class="fas fa-triangle-exclamation"></i> Exceeds statutory threshold by 8.0 hrs/wk. Immediate task offloading required.'
        },
        'TCH-003': {
            name: 'Maria Santos',
            dept: 'Science',
            position: 'Teacher II',
            hours: '40.0 Hours / Week',
            status: 'HIGH LOAD / AT CAPACITY',
            theme: 'warning',
            teachingLoadSubtotal: '25.0 hrs/wk',
            ancillaryLoadSubtotal: '15.0 hrs/wk',
            evaluation: '<i class="fas fa-circle-exclamation"></i> Meets maximum 40.0 hrs/wk statutory threshold. Monitor to avoid overload.'
        },
        'TCH-008': {
            name: 'Ramon Garcia',
            dept: 'Mathematics',
            position: 'Teacher I',
            hours: '36.0 Hours / Week',
            status: 'OPTIMAL WORKLOAD',
            theme: 'success',
            teachingLoadSubtotal: '20.0 hrs/wk',
            ancillaryLoadSubtotal: '16.0 hrs/wk',
            evaluation: '<i class="fas fa-circle-check"></i> Workload strictly compliant with Magna Carta guidelines. Eligible for assistance duties.'
        },
        'TCH-018': {
            name: 'Ana Reyes',
            dept: 'English',
            position: 'Master Teacher I',
            hours: '46.5 Hours / Week',
            status: 'CRITICAL OVERLOAD',
            theme: 'danger',
            teachingLoadSubtotal: '22.5 hrs/wk',
            ancillaryLoadSubtotal: '24.0 hrs/wk',
            evaluation: '<i class="fas fa-triangle-exclamation"></i> Exceeds maximum threshold by 6.5 hrs/wk. Rebalancing advisory duty recommended.'
        },
        'TCH-004': {
            name: 'Leo Bautista',
            dept: 'MAPEH',
            position: 'Teacher I',
            hours: '28.0 Hours / Week',
            status: 'UNDERLOAD CAPACITY',
            theme: 'info',
            teachingLoadSubtotal: '18.0 hrs/wk',
            ancillaryLoadSubtotal: '10.0 hrs/wk',
            evaluation: '<i class="fas fa-arrow-down"></i> Currently 12.0 hrs below 40.0 hrs threshold. High availability for task redistribution.'
        }
    };

    // 1. Parse URL Parameter
    const urlParams = new URLSearchParams(window.location.search);
    const teacherCode = urlParams.get('code') || 'TCH-012';
    const reportData = workloadDatabase[teacherCode] || workloadDatabase['TCH-012'];

    // 2. Render Text Metadata
    const elemCode = document.getElementById('reportTeacherCode');
    const elemName = document.getElementById('reportFacultyName');
    const elemDept = document.getElementById('reportDepartment');
    const elemPos = document.getElementById('reportPosition');
    const elemHours = document.getElementById('reportTotalHours');
    const elemStatus = document.getElementById('reportStatusTier');
    const elemEval = document.getElementById('evaluationText');
    const elemTierBox = document.getElementById('tierBoxContainer');

    if (elemCode) elemCode.textContent = teacherCode;
    if (elemName) elemName.textContent = reportData.name;
    if (elemDept) elemDept.textContent = reportData.dept;
    if (elemPos) elemPos.textContent = reportData.position;
    if (elemHours) elemHours.textContent = reportData.hours;

    // 3. Render Status Tier and Theme Styling
    if (elemStatus) {
        elemStatus.textContent = reportData.status;
        elemStatus.className = `tier-val text-${reportData.theme}`;
    }

    if (elemTierBox) {
        elemTierBox.className = `overall-tier-box ${reportData.theme === 'danger' ? '' : reportData.theme}`;
    }

    if (elemEval) {
        elemEval.className = `font-bold evaluation-text text-${reportData.theme}`;
        elemEval.innerHTML = reportData.evaluation;
    }
}

// PDF Direct Download Handler
document.getElementById('downloadPdfBtn')?.addEventListener('click', () => {
    const reportCard = document.querySelector('.report-card');
    const teacherCode = document.getElementById('reportTeacherCode')?.textContent.trim() || 'FACULTY';
    
    if (!reportCard) return;

    const opt = {
        margin:       [10, 10, 10, 10], // mm: top, left, bottom, right
        filename:     `eSF7_Workload_Report_${teacherCode}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // Generate & direct download PDF
    html2pdf().set(opt).from(reportCard).save();
});