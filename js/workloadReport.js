/**
 * Faculty Workload Quantification Report Controller
 * Kandili Workspace - DepEd Magna Carta Compliance Engine
 */

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initReportExport();
    loadReportData();
});

/* ==========================================================================
   1. Navigation
   ========================================================================== */
function initNavigation() {
    // Back to Directory
    document.getElementById('btnBackDirectory')?.addEventListener('click', () => {
        window.location.href = 'workload_reports_directory.html';
    });

    // Refresh Page
    document.getElementById('refreshBtn')?.addEventListener('click', () => {
        window.location.reload();
    });
}

/* ==========================================================================
   2. Print & PDF Export Engine
   ========================================================================== */
function initReportExport() {
    // Print Button
    document.getElementById('btnPrintReport')?.addEventListener('click', () => {
        window.print();
    });

    // Download PDF with html2pdf
    document.getElementById('downloadPdfBtn')?.addEventListener('click', () => {
        const element = document.getElementById('reportDocumentSheet');
        const codeElem = document.getElementById('reportTeacherCode');
        const teacherCode = codeElem ? codeElem.textContent.trim() : 'TEACHER';

        if (!element) return;

        const options = {
            margin: [10, 10, 10, 10],
            filename: `Kandili_Workload_Audit_${teacherCode}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        if (typeof html2pdf !== 'undefined') {
            html2pdf().set(options).from(element).save();
        } else {
            window.print();
        }
    });
}

/* ==========================================================================
   3. Dynamic Report Data Parser
   ========================================================================== */
function loadReportData() {
    const urlParams = new URLSearchParams(window.location.search);
    const teacherCode = urlParams.get('code');

    if (!teacherCode) return;

    // Faculty Mock Directory (Used if offline/demo; syncs to Supabase when active)
    const facultyRoster = {
        'TCH-012': {
            name: 'Juan Dela Cruz',
            department: 'Araling Panlipunan',
            position: 'Teacher III',
            tier: 'CRITICAL OVERLOAD',
            totalHours: '48.0 Hours / Week',
            teachingHours: '20.0 hrs/wk',
            ancillaryHours: '28.0 hrs/wk',
            evaluation: 'Exceeds statutory threshold by 8.0 hrs/wk. Immediate task offloading required.'
        },
        'TCH-018': {
            name: 'Maria Santos',
            department: 'Science',
            position: 'Master Teacher I',
            tier: 'HIGH LOAD',
            totalHours: '42.0 Hours / Week',
            teachingHours: '22.0 hrs/wk',
            ancillaryHours: '20.0 hrs/wk',
            evaluation: 'Exceeds standard threshold by 2.0 hrs/wk. Reallocation recommended.'
        },
        'TCH-004': {
            name: 'Ramon Garcia',
            department: 'Mathematics',
            position: 'Teacher II',
            tier: 'OPTIMAL',
            totalHours: '36.0 Hours / Week',
            teachingHours: '24.0 hrs/wk',
            ancillaryHours: '12.0 hrs/wk',
            evaluation: 'Workload is within Magna Carta (R.A. 4670) compliant limits.'
        }
    };

    const record = facultyRoster[teacherCode];
    if (record) {
        document.getElementById('reportFacultyName').textContent = record.name;
        document.getElementById('reportTeacherCode').textContent = teacherCode;
        document.getElementById('reportDepartment').textContent = record.department;
        document.getElementById('reportPosition').textContent = record.position;
        document.getElementById('reportStatusTier').textContent = record.tier;
        document.getElementById('reportTotalHours').textContent = record.totalHours;
        document.getElementById('subtotalTeachingLoad').textContent = record.teachingHours;
        document.getElementById('subtotalAncillaryLoad').textContent = record.ancillaryHours;

        const evalElem = document.getElementById('evaluationText');
        if (evalElem) {
            evalElem.innerHTML = `<i class="fas fa-info-circle"></i> ${record.evaluation}`;
            if (record.tier === 'OPTIMAL') {
                evalElem.className = 'text-success font-bold evaluation-text';
                document.getElementById('reportStatusTier').className = 'tier-val text-success';
            }
        }
    }
}