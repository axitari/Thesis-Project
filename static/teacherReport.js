document.addEventListener('DOMContentLoaded', () => {
    // Auth Guard check for teacher role
    if (typeof checkAuthAndRole === 'function') {
        checkAuthAndRole('teacher');
    }

    const printBtn = document.getElementById('printReportBtn');
    if (printBtn) {
        printBtn.addEventListener('click', () => {
            window.print();
        });
    }
});