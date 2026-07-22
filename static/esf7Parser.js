// static/esf7Parser.js

/**
 * Parses an eSF7 Spreadsheet (XLSX/CSV) and uploads structured workloads to Supabase
 */
async function parseAndUploadESF7(file, teacherId, schoolYear = '2025-2026') {
    if (!file || !teacherId) {
        throw new Error("Missing file or target teacher ID.");
    }

    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });

                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                const teachingLoads = [];
                const ancillaryDuties = [];

                jsonRows.forEach((row) => {
                    if (!row || row.length < 2) return;

                    const titleOrCategory = row[0]?.toString().trim();
                    const gradeLevel = row[1]?.toString().trim() || 'Grade 7';
                    const value = parseFloat(row[2]) || 0;
                    const rowType = row[3]?.toString().trim().toLowerCase(); 

                    if (!titleOrCategory || value <= 0) return;

                    if (rowType === 'ancillary' || titleOrCategory.toLowerCase().includes('ancillary') || titleOrCategory.toLowerCase().includes('coordinator')) {
                        ancillaryDuties.push({
                            teacher_id: teacherId,
                            duty_title: titleOrCategory,
                            hours_per_week: value,
                            school_year: schoolYear
                        });
                    } else {
                        teachingLoads.push({
                            teacher_id: teacherId,
                            subject_category: titleOrCategory,
                            grade_level: gradeLevel,
                            minutes_per_week: Math.round(value),
                            school_year: schoolYear
                        });
                    }
                });

                // 1. Clear existing workloads for current school year
                await window.supabaseClient.from('teaching_loads').delete().eq('teacher_id', teacherId).eq('school_year', schoolYear);
                await window.supabaseClient.from('ancillary_duties').delete().eq('teacher_id', teacherId).eq('school_year', schoolYear);

                // 2. Insert into teaching_loads
                if (teachingLoads.length > 0) {
                    const { error: tErr } = await window.supabaseClient.from('teaching_loads').insert(teachingLoads);
                    if (tErr) throw tErr;
                }

                // 3. Insert into ancillary_duties
                if (ancillaryDuties.length > 0) {
                    const { error: aErr } = await window.supabaseClient.from('ancillary_duties').insert(ancillaryDuties);
                    if (aErr) throw aErr;
                }

                // 4. Upload raw spreadsheet to Storage Bucket for audit
                const filePath = `${teacherId}/${Date.now()}_${file.name}`;
                await window.supabaseClient.storage.from('esf7-files').upload(filePath, file);

                resolve({
                    success: true,
                    teachingCount: teachingLoads.length,
                    ancillaryCount: ancillaryDuties.length
                });

            } catch (err) {
                console.error("eSF7 Ingestion Error:", err);
                reject(err);
            }
        };

        reader.onerror = (err) => reject(err);
        reader.readAsArrayBuffer(file);
    });
}