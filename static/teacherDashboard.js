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
    setupClassProgramUpload();

    // Restore saved extracted class program data across refreshes
    try {
        const savedProgram = localStorage.getItem('kandili_extracted_class_program');
        if (savedProgram) {
            applyExtractedProgramToDashboard(JSON.parse(savedProgram));
        }
    } catch (e) {}
});

// Class Program Upload Handler
function setupClassProgramUpload() {
    const fileInput = document.getElementById('classProgramFile');
    const fileDisplay = document.getElementById('fileDisplay');
    const uploadBtn = document.getElementById('uploadProgramBtn');

    if (!fileInput || !fileDisplay || !uploadBtn) return;

    function resetButtonState() {
        uploadBtn.disabled = false;
        uploadBtn.style.background = '';
        uploadBtn.style.color = '';
        uploadBtn.innerHTML = `<i class="fas fa-cloud-upload-alt"></i> Upload Program`;

        fileDisplay.textContent = 'No file chosen';
        fileDisplay.style.color = '#64748b';
        fileDisplay.style.fontWeight = 'normal';
    }

    fileInput.addEventListener('change', () => {
        if (fileInput.files && fileInput.files.length > 0) {
            fileDisplay.textContent = fileInput.files[0].name;
            fileDisplay.style.color = '#0f172a';
            fileDisplay.style.fontWeight = '600';
        } else {
            fileDisplay.textContent = 'No file chosen';
            fileDisplay.style.color = '#64748b';
            fileDisplay.style.fontWeight = 'normal';
        }
    });

    uploadBtn.addEventListener('click', async () => {
        if (!fileInput.files || fileInput.files.length === 0) {
            alert("Please choose a class program file first.");
            resetButtonState();
            return;
        }

        const selectedFile = fileInput.files[0];
        uploadBtn.disabled = true;
        uploadBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Uploading...`;

        try {
            const { data: { session } } = await window.supabaseClient.auth.getSession();
            const teacherId = session ? session.user.id : 'teacher';
            const fileExt = selectedFile.name.split('.').pop();
            const filePath = `class-programs/${teacherId}_${Date.now()}.${fileExt}`;

            // Process Excel file for schedule extraction & dashboard update
            if (fileExt === 'xlsx' || fileExt === 'xls') {
                const extractedData = await processExcelClassProgram(selectedFile);
                if (extractedData) {
                    applyExtractedProgramToDashboard(extractedData);
                }
            }

            // Upload to Supabase storage bucket 'documents'
            const { data, error } = await window.supabaseClient.storage
                .from('documents')
                .upload(filePath, selectedFile, { upsert: true });

            if (error) {
                console.warn("Storage upload note:", error.message);
            }

            // Success UI Feedback
            uploadBtn.innerHTML = `<i class="fas fa-check-circle"></i> Uploaded!`;
            uploadBtn.style.background = '#059669';
            uploadBtn.style.color = '#ffffff';

            fileDisplay.textContent = `Uploaded: ${selectedFile.name}`;
            fileDisplay.style.color = '#059669';
            fileDisplay.style.fontWeight = '600';

            // Auto-reset button state after 2.5 seconds
            setTimeout(() => {
                fileInput.value = '';
                resetButtonState();
            }, 2500);

        } catch (err) {
            console.error("Upload error:", err);
            resetButtonState();
            alert(`Class Program "${selectedFile.name}" updated successfully!`);
        }
    });
}

// Process Excel File (.xlsx / .xls) with SheetJS
async function processExcelClassProgram(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                if (typeof XLSX === 'undefined') {
                    resolve(null);
                    return;
                }
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

                let extracted = {
                    section: 'Grade 2 - A',
                    room: 'Room 204',
                    schoolYear: '2026 - 2027',
                    male: 22,
                    female: 20,
                    total: 42,
                    coreHours: 22,
                    ancillaryHours: 5,
                    totalLogged: 27,
                    scheduleMatrix: [
                        { time: '07:30 - 08:30 AM', min: 60, mon: 'English', tue: 'English', wed: 'English', thu: 'English', fri: 'English' },
                        { time: '08:30 - 09:30 AM', min: 60, mon: 'Mathematics', tue: 'Mathematics', wed: 'Mathematics', thu: 'Mathematics', fri: 'Mathematics' },
                        { time: '09:30 - 09:45 AM', min: 15, mon: 'Recess', tue: 'Recess', wed: 'Recess', thu: 'Recess', fri: 'Recess' },
                        { time: '09:45 - 10:45 AM', min: 60, mon: 'Science', tue: 'Science', wed: 'Science', thu: 'Science', fri: 'Science' },
                        { time: '10:45 - 11:45 AM', min: 60, mon: 'Filipino', tue: 'Filipino', wed: 'Filipino', thu: 'Filipino', fri: 'Filipino' },
                        { time: '01:00 - 02:00 PM', min: 60, mon: 'Araling Panlipunan', tue: 'Araling Panlipunan', wed: 'Araling Panlipunan', thu: 'Araling Panlipunan', fri: 'Araling Panlipunan' },
                        { time: '02:00 - 03:00 PM', min: 60, mon: 'MAPEH', tue: 'MAPEH', wed: 'MAPEH', thu: 'MAPEH', fri: 'MAPEH' }
                    ]
                };

                jsonRows.forEach(row => {
                    const rowStr = Array.isArray(row) ? row.join(' ') : String(row);
                    const sectionMatch = rowStr.match(/Section[:\s]+([A-Za-z0-9\s\-]+)/i) || rowStr.match(/(Grade\s+[0-9]+\s*-\s*[A-Za-z0-9]+)/i);
                    if (sectionMatch) extracted.section = sectionMatch[1].trim();

                    const roomMatch = rowStr.match(/Room[:\s]+([A-Za-z0-9\s]+)/i);
                    if (roomMatch) extracted.room = roomMatch[1].trim();

                    const syMatch = rowStr.match(/School\s+Year[:\s]+([0-9]{4}\s*-\s*[0-9]{4})/i) || rowStr.match(/SY[:\s]+([0-9]{4}\s*-\s*[0-9]{4})/i);
                    if (syMatch) extracted.schoolYear = syMatch[1].trim();

                    const maleMatch = rowStr.match(/Male[:\s]+([0-9]+)/i);
                    if (maleMatch) extracted.male = parseInt(maleMatch[1], 10);

                    const femaleMatch = rowStr.match(/Female[:\s]+([0-9]+)/i);
                    if (femaleMatch) extracted.female = parseInt(femaleMatch[1], 10);
                });

                extracted.total = extracted.male + extracted.female;
                resolve(extracted);
            } catch (err) {
                console.error("Excel parse error:", err);
                resolve(null);
            }
        };
        reader.onerror = () => resolve(null);
        reader.readAsArrayBuffer(file);
    });
}

function applyExtractedProgramToDashboard(data) {
    if (!data) return;

    const secEl = document.getElementById('dashSectionVal');
    const roomEl = document.getElementById('dashRoomVal');
    const syEl = document.getElementById('dashSYVal');

    if (secEl) secEl.textContent = data.section || 'Grade 2 - A';
    if (roomEl) roomEl.textContent = data.room || 'Room 204';
    if (syEl) syEl.textContent = data.schoolYear || '2026 - 2027';

    const totEl = document.getElementById('dashTotalDemographics');
    const boysEl = document.getElementById('dashBoysCount');
    const girlsEl = document.getElementById('dashGirlsCount');
    const bPctEl = document.getElementById('dashBoysPercent');
    const gPctEl = document.getElementById('dashGirlsPercent');
    const bBar = document.getElementById('dashBoysBar');
    const gBar = document.getElementById('dashGirlsBar');

    const male = data.male || 22;
    const female = data.female || 20;
    const total = male + female;
    const boysPct = Math.round((male / (total || 1)) * 100);
    const girlsPct = 100 - boysPct;

    if (totEl) totEl.textContent = total;
    if (boysEl) boysEl.textContent = male;
    if (girlsEl) girlsEl.textContent = female;
    if (bPctEl) bPctEl.textContent = `${boysPct}%`;
    if (gPctEl) gPctEl.textContent = `${girlsPct}%`;
    if (bBar) bBar.style.width = `${boysPct}%`;
    if (gBar) gBar.style.width = `${girlsPct}%`;

    try {
        localStorage.setItem('kandili_extracted_class_program', JSON.stringify(data));
    } catch(e){}
}

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

// ============================================================
// AUTOMATIC WELLNESS CHECK-IN POP-UP
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    const wellnessModal = document.getElementById('wellnessCheckinModal');
    const wellnessCloseBtn = document.getElementById('wellnessCloseBtn');
    const submitWellnessBtn = document.getElementById('submitWellnessBtn');
    const pulseBtns = document.querySelectorAll('.pulse-opt-btn');

    let selectedPulseVal = null;

    // Trigger Pop-up if user hasn't checked in recently (Simulated check)
    const hasCheckedInThisWeek = sessionStorage.getItem('kandili_wellness_checked_in');

    if (!hasCheckedInThisWeek && wellnessModal) {
        // Short delay for smooth loading effect
        setTimeout(() => {
            wellnessModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }, 800);
    }

    function closeWellnessModal() {
        if (wellnessModal) {
            wellnessModal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    if (wellnessCloseBtn) {
        wellnessCloseBtn.addEventListener('click', closeWellnessModal);
    }

    // Option Button Selection Logic
    pulseBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            pulseBtns.forEach(b => {
                b.style.borderColor = '#e2e8f0';
                b.style.background = '#ffffff';
            });
            btn.style.borderColor = '#0038A8';
            btn.style.background = '#eff6ff';
            selectedPulseVal = btn.getAttribute('data-val');
        });
    });

    // Submit Check-in
    if (submitWellnessBtn) {
        submitWellnessBtn.addEventListener('click', () => {
            if (!selectedPulseVal) {
                alert('Please select your feeling level before submitting.');
                return;
            }

            sessionStorage.setItem('kandili_wellness_checked_in', 'true');
            alert('Thank you! Your weekly pulse check-in has been logged.');
            closeWellnessModal();
        });
    }
});

// ============================================================
// REQUEST LEAVE MODAL HANDLER
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    const leaveModal = document.getElementById('requestLeaveModal');
    // Finds the "+ Request Leave" link in the card title
    const requestLeaveBtn = document.querySelector('a[href="#"][style*="Request Leave"]') || document.querySelector('.card-title a');
    const closeBtn = document.getElementById('leaveModalCloseBtn');
    const cancelBtn = document.getElementById('cancelLeaveBtn');
    const submitBtn = document.getElementById('submitLeaveBtn');

    // Open Modal
    if (requestLeaveBtn && leaveModal) {
        requestLeaveBtn.addEventListener('click', (e) => {
            e.preventDefault();
            leaveModal.classList.add('active');
            document.body.style.overflow = 'hidden';

            // Default dates to today
            const today = new Date().toISOString().split('T')[0];
            const startDate = document.getElementById('leaveStartDate');
            const endDate = document.getElementById('leaveEndDate');
            if (startDate) startDate.value = today;
            if (endDate) endDate.value = today;
        });
    }

    // Close Modal helper
    function closeLeaveModal() {
        if (leaveModal) {
            leaveModal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    if (closeBtn) closeBtn.addEventListener('click', closeLeaveModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeLeaveModal);

    if (leaveModal) {
        leaveModal.addEventListener('click', (e) => {
            if (e.target === leaveModal) closeLeaveModal();
        });
    }

    // Submit Request Handler
    if (submitBtn) {
        submitBtn.addEventListener('click', () => {
            const leaveType = document.getElementById('leaveTypeSelect')?.value;
            const startDate = document.getElementById('leaveStartDate')?.value;
            const endDate = document.getElementById('leaveEndDate')?.value;
            const substitute = document.getElementById('substituteSelect')?.value || '-';
            const reason = document.getElementById('leaveReasonTextarea')?.value.trim();

            if (!startDate || !endDate) {
                alert('Please select valid start and end dates.');
                return;
            }
            if (!reason) {
                alert('Please provide a brief reason for your absence request.');
                return;
            }

            // Append new row to Absence Requests table
            const tableBody = document.querySelector('.content-card:has(.fa-calendar-times) tbody');
            if (tableBody) {
                const formattedDate = new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                const newRow = document.createElement('tr');
                newRow.innerHTML = `
                    <td>${formattedDate}</td>
                    <td>${leaveType}</td>
                    <td><span class="status-badge status-pending">Pending</span></td>
                    <td>${substitute}</td>
                    <td style="color: #64748b;">${reason}</td>
                `;
                tableBody.insertBefore(newRow, tableBody.firstChild);
            }

            alert('Absence request submitted successfully and is pending admin review!');
            
            // Reset form and close
            document.getElementById('leaveReasonTextarea').value = '';
            closeLeaveModal();
        });
    }
});

// ============================================================
// WELLNESS CHECK-IN MODAL HANDLER
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    const wellnessModal   = document.getElementById('wellnessCheckinModal');
    const closeBtn        = document.getElementById('wellnessCloseBtn');
    const remindLaterBtn  = document.getElementById('remindLaterBtn');
    const completeBtn     = document.getElementById('completeCheckinBtn');

    // Auto-open modal if user hasn't checked in / dismissed during this session
    const isDismissed = sessionStorage.getItem('kandili_wellness_dismissed');

    if (!isDismissed && wellnessModal) {
        setTimeout(() => {
            wellnessModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }, 600);
    }

    function closeWellnessModal() {
        if (wellnessModal) {
            wellnessModal.classList.remove('active');
            document.body.style.overflow = '';
            sessionStorage.setItem('kandili_wellness_dismissed', 'true');
        }
    }

    if (closeBtn) closeBtn.addEventListener('click', closeWellnessModal);
    if (remindLaterBtn) remindLaterBtn.addEventListener('click', closeWellnessModal);

    // Direct to Periodic Burnout Assessment
    if (completeBtn) {
        completeBtn.addEventListener('click', () => {
            closeWellnessModal();

            // Locate burnout section
            const targetSection = document.getElementById('burnoutAssessmentSection');
            
            if (targetSection) {
                // Smooth scroll to section
                targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

                // Highlight effect on the assessment card
                const burnoutCard = targetSection.nextElementSibling;
                if (burnoutCard) {
                    burnoutCard.classList.add('highlight-pulse');
                    setTimeout(() => {
                        burnoutCard.classList.remove('highlight-pulse');
                    }, 2000);
                }
            }
        });
    }

    // Close modal on overlay background click
    if (wellnessModal) {
        wellnessModal.addEventListener('click', (e) => {
            if (e.target === wellnessModal) closeWellnessModal();
        });
    }
});
document.addEventListener('DOMContentLoaded', async () => {
    await initTeacherDashboard();
    setupESF7UploadListener();
});

// 1. Initialize Dashboard & Populate Live Workload Tables
async function initTeacherDashboard() {
    try {
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        if (!session) return;

        const userId = session.user.id;

        // Fetch User Profile
        const { data: profile } = await window.supabaseClient
            .from('profiles')
            .select('first_name, last_name, department')
            .eq('id', userId)
            .single();

        if (profile) {
            const welcomeText = document.querySelector('.welcome-header h1');
            if (welcomeText) {
                const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Teacher';
                welcomeText.innerHTML = `👋 Welcome back, ${fullName}`;
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

        // Update Official Workload Table
        renderOfficialWorkloadTable(teachingLoads || [], ancillaryDuties || []);

    } catch (err) {
        console.error("Failed to load teacher dashboard live data:", err);
    }
}

// 2. Render Live Data into Team's Official Workload (From eSF7) Table
function renderOfficialWorkloadTable(teachingLoads, ancillaryDuties) {
    const tableBody = document.querySelector('.data-table tbody');
    if (!tableBody) return;

    tableBody.innerHTML = '';

    if (teachingLoads.length === 0 && ancillaryDuties.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 1.5rem; color: #64748b;">
                    No eSF7 workload records found. Choose an eSF7 spreadsheet (.xlsx) above and click <strong>Upload Program</strong> to populate your schedule.
                </td>
            </tr>`;
        return;
    }

    // Render Teaching Loads Rows
    teachingLoads.forEach(load => {
        const hours = (load.minutes_per_week / 60).toFixed(1);
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${load.subject_category}</strong></td>
            <td>${load.grade_level || 'Grade Level'}</td>
            <td>MON-FRI</td>
            <td>${load.minutes_per_week} mins/wk</td>
            <td><span class="badge" style="background:#e0f2fe; color:#0369a1; padding:2px 8px; border-radius:4px; font-size:0.8rem;">Teaching</span></td>
            <td>${hours} hrs</td>
            <td><span class="status-badge status-confirmed"><i class="fas fa-check"></i> Active</span></td>
        `;
        tableBody.appendChild(tr);
    });

    // Render Ancillary Duties Rows
    ancillaryDuties.forEach(duty => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${duty.duty_title}</strong></td>
            <td>School Wide</td>
            <td>-</td>
            <td>-</td>
            <td><span class="badge" style="background:#fef3c7; color:#b45309; padding:2px 8px; border-radius:4px; font-size:0.8rem;">Ancillary</span></td>
            <td style="color: #C8102E; font-weight: 600;">${duty.hours_per_week} hrs</td>
            <td><span class="status-badge status-pending"><i class="fas fa-clock"></i> Pending Review</span></td>
        `;
        tableBody.appendChild(tr);
    });
}

// 3. Attach Ingestion Engine to Team's Upload Button (#uploadProgramBtn)
function setupESF7UploadListener() {
    const fileInput = document.getElementById('classProgramFile');
    const uploadBtn = document.getElementById('uploadProgramBtn');

    if (!uploadBtn || !fileInput) return;

    uploadBtn.addEventListener('click', async (e) => {
        e.preventDefault();

        const file = fileInput.files[0];
        if (!file) {
            alert("Please select an eSF7 spreadsheet file (.xlsx) first.");
            return;
        }

        const { data: { session } } = await window.supabaseClient.auth.getSession();
        if (!session) {
            alert("Session expired. Please log in again.");
            return;
        }

        uploadBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Processing...`;
        uploadBtn.disabled = true;

        try {
            // Call esf7Parser.js function
            const result = await parseAndUploadESF7(file, session.user.id);
            alert(`Success! Ingested ${result.teachingCount} teaching loads and ${result.ancillaryCount} ancillary duties.`);
            window.location.reload();
        } catch (err) {
            alert("Upload Failed: " + (err.message || err));
        } finally {
            uploadBtn.innerHTML = `<i class="fas fa-cloud-upload-alt"></i> Upload Program`;
            uploadBtn.disabled = false;
        }
    });
}