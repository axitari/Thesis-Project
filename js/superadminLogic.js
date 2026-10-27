/**
 * Superadmin School Hub Logic v4.1
 * Bulletproof school switcher and demographic rendering
 */

// School Data Profiles
const schoolData = {
    ROVCMS: {
        code: 'ROVCMS',
        fullName: 'Raul O.V. Causing Memorial School (ROVCMS)',
        schoolId: '115204',
        district: 'District II',
        division: 'Division of Iloilo Province',
        location: 'District II, Division of Iloilo Province',
        principal: 'Mylene Panaguiton',
        learners: '780',
        facultyCount: '24',
        primarySec: '12',
        intermediateSec: '12',
        sections: [
            { grade: 'Grade 1', name: 'Mabini', model: 'Self-Contained Advisory' },
            { grade: 'Grade 1', name: 'Bonifacio', model: 'Self-Contained Advisory' },
            { grade: 'Grade 2', name: 'Rizal', model: 'Self-Contained Advisory' },
            { grade: 'Grade 2', name: 'Del Pilar', model: 'Self-Contained Advisory' },
            { grade: 'Grade 3', name: 'Luna', model: 'Self-Contained Advisory' },
            { grade: 'Grade 4', name: 'Diamond', model: 'Departmentalized Delivery' },
            { grade: 'Grade 5', name: 'Emerald', model: 'Departmentalized Delivery' },
            { grade: 'Grade 6', name: 'Ruby', model: 'Departmentalized Delivery' }
        ],
        faculty: [
            { code: 'TCH-ROV-001', name: 'Sarah Cruz', grade: 'Grade 2 (Rizal)', model: 'Self-Contained' },
            { code: 'TCH-ROV-004', name: 'Juan Dela Cruz', grade: 'Grade 5 (Math/Sci)', model: 'Departmentalized' },
            { code: 'TCH-ROV-008', name: 'Elena Torres', grade: 'Grade 1 (Mabini)', model: 'Self-Contained' },
            { code: 'TCH-ROV-015', name: 'Roberto Diaz', grade: 'Grade 6 (English)', model: 'Departmentalized' }
        ]
    },
    LJES: {
        code: 'LJES',
        fullName: 'Lopez Jaena Elementary School (LJES)',
        schoolId: '115208',
        district: 'District I',
        division: 'Division of Iloilo Province',
        location: 'District I, Division of Iloilo Province',
        principal: 'Dr. Arthur S. Morales',
        learners: '540',
        facultyCount: '18',
        primarySec: '8',
        intermediateSec: '8',
        sections: [
            { grade: 'Grade 1', name: 'Sampaguita', model: 'Self-Contained Advisory' },
            { grade: 'Grade 2', name: 'Camia', model: 'Self-Contained Advisory' },
            { grade: 'Grade 3', name: 'Ilang-Ilang', model: 'Self-Contained Advisory' },
            { grade: 'Grade 4', name: 'Narra', model: 'Departmentalized Delivery' },
            { grade: 'Grade 5', name: 'Molave', model: 'Departmentalized Delivery' }
        ],
        faculty: [
            { code: 'TCH-LJE-002', name: 'Maria Santos', grade: 'Grade 3 (Ilang-Ilang)', model: 'Self-Contained' },
            { code: 'TCH-LJE-006', name: 'Carlos Mendoza', grade: 'Grade 4 (AP/Filipino)', model: 'Departmentalized' },
            { code: 'TCH-LJE-011', name: 'Jocelyn Reyes', grade: 'Grade 2 (Camia)', model: 'Self-Contained' }
        ]
    },
    SMES: {
        code: 'SMES',
        fullName: 'San Miguel Elementary School (SMES)',
        schoolId: '115215',
        district: 'District III',
        division: 'Division of Iloilo Province',
        location: 'District III, Division of Iloilo Province',
        principal: 'Grace H. Villanueva',
        learners: '420',
        facultyCount: '14',
        primarySec: '6',
        intermediateSec: '6',
        sections: [
            { grade: 'Grade 1', name: 'Aguinaldo', model: 'Self-Contained Advisory' },
            { grade: 'Grade 2', name: 'Quezon', model: 'Self-Contained Advisory' },
            { grade: 'Grade 5', name: 'Tandang Sora', model: 'Departmentalized Delivery' },
            { grade: 'Grade 6', name: 'Lapu-Lapu', model: 'Departmentalized Delivery' }
        ],
        faculty: [
            { code: 'TCH-SME-001', name: 'Ramon Garcia', grade: 'Grade 6 (Science)', model: 'Departmentalized' },
            { code: 'TCH-SME-005', name: 'Patricia Ramos', grade: 'Grade 1 (Aguinaldo)', model: 'Self-Contained' },
            { code: 'TCH-SME-009', name: 'Dennis Alcantara', grade: 'Grade 5 (Math)', model: 'Departmentalized' }
        ]
    }
};

let currentSelectedSchool = 'ROVCMS';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Lock active user role to admin
    sessionStorage.setItem('kandili_user_role', 'admin');

    // 2. Setup Topbar & Actions
    initAdminHeader();

    // 3. Initialize the school node filter and registry
    initSchoolFilter();
    renderManagedSchools();

    // 4. Initialize Forms & Search
    initModelAutoSelector();
    initSectionCreation();
    initFacultySearch();

    // 5. Initial Render
    loadSchoolData('ROVCMS');
});

// Setup date, refresh, and logout
function initAdminHeader() {
    const dateElem = document.getElementById('adminDateDisplay');
    if (dateElem) {
        const now = new Date();
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        dateElem.innerHTML = `<i class="far fa-calendar-alt"></i> ${now.toLocaleDateString('en-US', options)}`;
    }

    document.getElementById('navRefreshBtn')?.addEventListener('click', () => {
        window.location.reload();
    });

    document.getElementById('sidebarLogoutBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        if (typeof kandiliLogout === 'function') {
            kandiliLogout();
        } else if (confirm("Log out of the Superadmin Console?")) {
            window.location.href = "../login.html";
        }
    });
}

// 1. School node filter and registry
function initSchoolFilter() {
    const schoolFilter = document.getElementById('adminSchoolFilter');
    schoolFilter?.addEventListener('change', () => {
        const schoolKey = schoolFilter.value;
        if (!schoolData[schoolKey]) return;

        currentSelectedSchool = schoolKey;
        loadSchoolData(schoolKey);
    });
}

function renderManagedSchools() {
    if (typeof renderAdminSchoolNodes === 'function') {
        renderAdminSchoolNodes();
        return;
    }

    const schoolsTable = document.getElementById('adminSchoolsTableBody');
    if (!schoolsTable) return;

    schoolsTable.innerHTML = Object.values(schoolData).map(school => `
        <tr>
            <td><strong>${school.code}</strong> — ${school.fullName}</td>
            <td>${school.schoolId}</td>
            <td>${school.location.split(',')[0]}</td>
            <td><span class="badge-status-active">Managed</span></td>
        </tr>
    `).join('');
}

// 2. Load School Profile, Demographics, Sections & Faculty
function loadSchoolData(schoolKey) {
    const data = schoolData[schoolKey];
    if (!data) return;
    currentSelectedSchool = schoolKey;

    const schoolFilter = document.getElementById('adminSchoolFilter');
    if (schoolFilter && schoolFilter.value !== 'all') schoolFilter.value = schoolKey;

    // Header Demographics
    const titleEl = document.getElementById('currentSchoolTitle');
    const locEl = document.getElementById('currentSchoolLocation');
    const princEl = document.getElementById('currentSchoolPrincipal');

    if (titleEl) titleEl.textContent = data.fullName;
    if (locEl) {
        const icon = document.createElement('i');
        icon.className = 'fas fa-location-dot';
        const schoolId = document.createElement('strong');
        schoolId.textContent = data.schoolId;
        locEl.replaceChildren(
            icon,
            document.createTextNode(` ${data.location} • School ID: `),
            schoolId
        );
    }
    if (princEl) princEl.textContent = data.principal;

    // Stats
    const learnersEl = document.getElementById('demoLearners');
    const facultyEl = document.getElementById('demoFaculty');
    const priSecEl = document.getElementById('demoPrimarySec');
    const intSecEl = document.getElementById('demoIntermediateSec');

    if (learnersEl) learnersEl.textContent = data.learners;
    if (facultyEl) facultyEl.textContent = data.facultyCount;
    if (priSecEl) priSecEl.textContent = data.primarySec;
    if (intSecEl) intSecEl.textContent = data.intermediateSec;

    // Update labels in forms and sections
    document.querySelectorAll('.activeSchoolCodeLabel').forEach(el => {
        el.textContent = data.code;
    });

    // Populate Sections Table
    const secTable = document.getElementById('sectionsTableBody');
    if (secTable) {
        secTable.innerHTML = data.sections.map(s => `
            <tr>
                <td><strong>${s.grade}</strong></td>
                <td>${s.name}</td>
                <td><span class="badge-status-active">${s.model}</span></td>
            </tr>
        `).join('');
    }

    // Populate Faculty Roster Table
    renderFacultyTable(data.faculty);
}

function renderFacultyTable(facultyList) {
    const facTable = document.getElementById('schoolFacultyTableBody');
    if (!facTable) return;

    if (!facultyList || facultyList.length === 0) {
        facTable.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#94a3b8; padding: 1.5rem;">No faculty registered for this school node.</td></tr>`;
        return;
    }

    facTable.innerHTML = facultyList.map(f => `
        <tr>
            <td><strong>${f.code}</strong></td>
            <td>${f.name}</td>
            <td>${f.grade}</td>
            <td>${f.model}</td>
            <td><span class="badge-status-active">Verified</span></td>
        </tr>
    `).join('');
}

// 3. Auto-Select Model (Grades 1-3 vs 4-6)
function initModelAutoSelector() {
    const gradeSelect = document.getElementById('secGrade');
    const modelInput = document.getElementById('secModel');

    gradeSelect?.addEventListener('change', () => {
        const val = gradeSelect.value;
        if (val.includes('Grade 1') || val.includes('Grade 2') || val.includes('Grade 3')) {
            modelInput.value = 'Self-Contained Advisory (Single Class)';
        } else {
            modelInput.value = 'Departmentalized Delivery (Multi-Subject)';
        }
    });
}

// 4. Add Section to Current School
function initSectionCreation() {
    const form = document.getElementById('createSectionForm');
    form?.addEventListener('submit', (e) => {
        e.preventDefault();
        const grade = document.getElementById('secGrade').value;
        const name = document.getElementById('secName').value.trim();
        const model = document.getElementById('secModel').value;

        if (!name) return;

        schoolData[currentSelectedSchool].sections.unshift({
            grade,
            name,
            model
        });

        alert(`Section "${name}" added to ${currentSelectedSchool}!`);
        form.reset();
        document.getElementById('secModel').value = 'Self-Contained Advisory (Single Class)';
        loadSchoolData(currentSelectedSchool);
    });
}

// 5. Faculty Filter Search
function initFacultySearch() {
    const input = document.getElementById('facultySearchInput');
    input?.addEventListener('input', () => {
        const query = (input.value || '').toLowerCase().trim();
        const allFaculty = schoolData[currentSelectedSchool]?.faculty || [];
        
        const filtered = allFaculty.filter(f => 
            f.name.toLowerCase().includes(query) || 
            f.code.toLowerCase().includes(query) ||
            f.grade.toLowerCase().includes(query)
        );

        renderFacultyTable(filtered);
    });
}