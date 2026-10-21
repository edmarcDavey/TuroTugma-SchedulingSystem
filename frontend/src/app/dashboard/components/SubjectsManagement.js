import { useEffect, useRef, useState } from "react";
import * as XLSX from "xlsx";

const JHS_GRADES = [7, 8, 9, 10];
const SHS_GRADES = [11, 12];
const JHS_GRADE_BAND = "7-10";

const JHS_PROGRAM_SCOPES = [
  { value: "Universal", label: "Universal (All Sections)" },
  { value: "Regular", label: "Regular Only" },
  { value: "Intervention", label: "Intervention / Targeted Remediation (ARAL)" },
  { value: "SP-STEM", label: "SP-STEM Only (Special Program in STEM)" },
  { value: "SPA", label: "SPA Only (Special Program in Arts)" },
  { value: "SPJ", label: "SPJ Only (Special Program in Journalism)" },
];

const SHS_CLUSTERS = [
  "STEM (Science, Tech, Eng, Math)",
  "Business & Entrepreneurship (ABM)",
  "Arts, Social Sciences & Humanities (HUMSS)",
  "ICT (Information & Comm Tech)",
  "Industrial Arts & Maritime",
  "Agriculture & Fishery Arts",
  "Family & Consumer Science",
  "Sports, Health & Wellness",
  "General Academic / Electives",
];

const JHS_SUBJECT_TYPES = ["Core", "Specialized", "Enrichment"];
const SHS_SUBJECT_TYPES = ["Core", "Applied", "Specialized", "Enrichment"];
const SHS_SEMESTERS = ["First Semester", "Last Semester"];
const SUBJECTS_STORAGE_KEY = "turotugma_subjects";

function formatSubjectPeriodSlot(slot) {
  if (!slot || slot === "any") return null;
  if (slot === "first" || slot === "1") return "1st Period";
  if (slot === "last") return "Last Period";
  if (slot === "morning") return "Morning Classes";
  if (slot === "afternoon") return "Afternoon Classes";
  if (slot.includes("-")) {
    const parts = slot.split("-").map(Number);
    const getOrd = (n) => {
      const mod100 = n % 100;
      const mod10 = n % 10;
      return `${n}${mod100 >= 11 && mod100 <= 13 ? "th" : mod10 === 1 ? "st" : mod10 === 2 ? "nd" : mod10 === 3 ? "rd" : "th"}`;
    };
    return `${getOrd(parts[0])} & ${getOrd(parts[1])} Periods`;
  }
  const n = Number(slot);
  if (!isNaN(n) && n > 0) {
    const mod100 = n % 100;
    const mod10 = n % 10;
    const suffix = mod100 >= 11 && mod100 <= 13 ? "th" : mod10 === 1 ? "st" : mod10 === 2 ? "nd" : mod10 === 3 ? "rd" : "th";
    return `${n}${suffix} Period`;
  }
  return slot;
}

const EMPTY_FORM = {
  subjectName: "",
  subjectCode: "",
  schoolLevel: "jhs",
  gradeLevel: JHS_GRADE_BAND,
  subjectType: "Core",
  dailyMinutes: "",
  classesPerWeek: "",
  programScope: "Universal",
  strand: "",
  semester: "",
};

export default function SubjectsManagement() {
  const offeredLevels = getOfferedLevels();
  const [subjects, setSubjects] = useState(() => getInitialSubjects());
  const [formState, setFormState] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [notice, setNotice] = useState("");
  const [noticeType, setNoticeType] = useState("success");
  const [noticeVisible, setNoticeVisible] = useState(false);
  const [importFileName, setImportFileName] = useState("");
  const [importPreviewRows, setImportPreviewRows] = useState([]);
  const [importErrors, setImportErrors] = useState([]);
  const [isParsingImport, setIsParsingImport] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ open: false, title: "", message: "", confirmLabel: "Confirm", onConfirm: null, onCancel: null });
  const noticeTimerRef = useRef(null);
  const formCardRef = useRef(null);

  const showNotice = (message, type = "success") => {
    if (noticeTimerRef.current) {
      window.clearTimeout(noticeTimerRef.current);
    }

    setNotice(message);
    setNoticeType(type);
    setNoticeVisible(true);

    noticeTimerRef.current = window.setTimeout(() => {
      setNoticeVisible(false);
      window.setTimeout(() => {
        setNotice("");
      }, 280);
    }, 2600);
  };

  useEffect(() => {
    if (!notice) {
      return undefined;
    }

    const handle = window.requestAnimationFrame(() => {
      setNoticeVisible(true);
    });

    return () => {
      window.cancelAnimationFrame(handle);
    };
  }, [notice]);

  const persistSubjects = (nextSubjects) => {
    setSubjects(nextSubjects);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(SUBJECTS_STORAGE_KEY, JSON.stringify(nextSubjects));
      window.dispatchEvent(new CustomEvent("turotugma_subjects_updated", { detail: nextSubjects }));
    }
  };

  const handleFormField = (field, value) => {
    setFormState((prev) => {
      const next = { ...prev, [field]: value };

      if (field === "schoolLevel") {
        if (value === "jhs") {
          next.gradeLevel = JHS_GRADE_BAND;
          next.subjectType = "Core";
          next.programScope = "Universal";
          next.strand = "";
          next.semester = "";
        } else {
          next.gradeLevel = "11";
          next.subjectType = "Core";
          next.programScope = "Universal";
        }
      }

      if (field === "subjectType") {
        if (next.schoolLevel === "shs" && value === "Core") {
          next.strand = "";
        }
      }

      return next;
    });
  };

  const handleSaveSubject = () => {
    const validationError = validateSubjectForm(formState);
    if (validationError) {
      showNotice(validationError, "error");
      return;
    }

    const normalized = normalizeSubject(formState, editingId);

    if (editingId) {
      const current = subjects.find((subject) => subject.id === editingId);
      if (!current) {
        showNotice("Selected subject could not be found.", "error");
        return;
      }

      const unchanged = JSON.stringify(stripAuditFields(current)) === JSON.stringify(stripAuditFields(normalized));
      if (unchanged) {
        showNotice("No changes to save.", "error");
        return;
      }

      const nextSubjects = subjects.map((subject) =>
        subject.id === editingId ? { ...normalized, createdAt: subject.createdAt, updatedAt: new Date().toISOString() } : subject
      );

      persistSubjects(nextSubjects);
      setEditingId(null);
      setFormState(EMPTY_FORM);
      showNotice("Subject updated successfully.", "success");
      return;
    }

    const normalizedContextKey = createContextKey(normalized);
    const duplicate = subjects.some((subject) => createContextKey(subject) === normalizedContextKey);

    if (duplicate) {
      showNotice("Duplicate subject code for this context is not allowed.", "error");
      return;
    }

    const nextSubjects = [...subjects, normalized];
    persistSubjects(nextSubjects);
    setFormState(EMPTY_FORM);
    showNotice("Subject added successfully.", "success");
  };

  const handleEditSubject = (subject) => {
    setEditingId(subject.id);
    setFormState({
      subjectName: subject.subjectName,
      subjectCode: subject.subjectCode,
      schoolLevel: subject.schoolLevel,
      gradeLevel: String(subject.gradeLevel),
      subjectType: normalizeSubjectTypeByLevel(subject.subjectType, subject.schoolLevel),
      dailyMinutes: subject.dailyMinutes != null ? String(subject.dailyMinutes) : "",
      classesPerWeek: subject.classesPerWeek != null ? String(subject.classesPerWeek) : "",
      programScope: subject.programScope || "Universal",
      strand: subject.strand || "",
      semester: subject.semester || "",
    });

    window.requestAnimationFrame(() => {
      formCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    showNotice("Edit mode enabled.", "success");
  };

  const handleDeleteSubject = (subjectId) => {
    const targetSubject = subjects.find((s) => s.id === subjectId);
    const subjectName = targetSubject?.subjectName || "this subject";

    setConfirmModal({
      open: true,
      title: "Delete Subject",
      message: `Are you sure you want to delete "${subjectName}"?`,
      confirmLabel: "Delete",
      onConfirm: () => {
        const nextSubjects = subjects.filter((subject) => subject.id !== subjectId);
        persistSubjects(nextSubjects);

        if (editingId === subjectId) {
          setEditingId(null);
          setFormState(EMPTY_FORM);
        }

        showNotice("Subject removed.", "success");
        setConfirmModal({ open: false });
      },
      onCancel: () => setConfirmModal({ open: false }),
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormState(EMPTY_FORM);
    showNotice("Edit cancelled.", "success");
  };

  const handleImportFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setIsParsingImport(true);
    setImportFileName(file.name);
    setImportPreviewRows([]);
    setImportErrors([]);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];

      if (!firstSheetName) {
        showNotice("No worksheet found in selected file.", "error");
        return;
      }

      const worksheet = workbook.Sheets[firstSheetName];
      const rows = XLSX.utils.sheet_to_json(worksheet, { defval: "", raw: false });

      if (!rows.length) {
        showNotice("File is empty. Please provide at least one subject row.", "error");
        return;
      }

      const existingKeys = new Set(subjects.map((subject) => createContextKey(subject)));
      const importKeys = new Set();
      const nextPreviewRows = [];
      const nextErrors = [];

      rows.forEach((row, index) => {
        const lineNumber = index + 2;
        const mapped = mapImportedRowToForm(row);

        if (!mapped) {
          nextErrors.push(`Row ${lineNumber}: Could not map row fields to expected columns.`);
          return;
        }

        const validationError = validateSubjectForm(mapped);
        if (validationError) {
          nextErrors.push(`Row ${lineNumber}: ${validationError}`);
          return;
        }

        const key = createContextKey(mapped);
        if (existingKeys.has(key) || importKeys.has(key)) {
          nextErrors.push(`Row ${lineNumber}: Duplicate subject code/context detected.`);
          return;
        }

        importKeys.add(key);
        nextPreviewRows.push({
          subjectName: mapped.subjectName.trim(),
          subjectCode: mapped.subjectCode.trim().toUpperCase(),
          schoolLevel: mapped.schoolLevel,
          gradeLevel: mapped.schoolLevel === "shs" ? Number.parseInt(mapped.gradeLevel, 10) : (mapped.gradeLevel || JHS_GRADE_BAND),
          subjectType: mapped.subjectType,
          dailyMinutes: mapped.dailyMinutes,
          classesPerWeek: mapped.classesPerWeek,
          hoursPerWeek: mapped.hoursPerWeek,
          programScope: mapped.programScope || "Universal",
          semester: mapped.semester,
          strand: mapped.strand,
        });
      });

      setImportPreviewRows(nextPreviewRows);
      setImportErrors(nextErrors);
    } catch {
      showNotice("Could not parse file. Ensure it is a valid Excel or CSV spreadsheet.", "error");
    } finally {
      setIsParsingImport(false);
    }
  };

  const handleImportValidRows = () => {
    if (!importPreviewRows.length) {
      showNotice("No valid rows available for import.", "error");
      return;
    }

    const now = new Date().toISOString();
    const preparedSubjects = importPreviewRows.map((row) => ({
      id: createSubjectId(),
      ...row,
      createdAt: now,
      updatedAt: now,
    }));

    const nextSubjects = [...subjects, ...preparedSubjects];
    persistSubjects(nextSubjects);

    setImportPreviewRows([]);
    setImportErrors([]);
    setImportFileName("");
    showNotice(`Successfully imported ${preparedSubjects.length} subject(s).`, "success");
  };

  const handleLoadDepEdSubjects = async () => {
    try {
      let text = "";
      try {
        const res = await fetch("/deped_matatag_subjects.csv");
        if (res.ok) {
          text = await res.text();
        }
      } catch {
        // Fallback to embedded dataset below if fetch fails
      }

      if (!text || !text.includes("Subject Name")) {
        text = `Subject Name,Subject Code,School Level,Subject Type,Daily Minutes,Classes per Week,Grade Level,Semester,Program Scope,Strand
English,ENG,JHS,Core,60,4,Grades 7–10,,Universal,
Mathematics,MATH,JHS,Core,60,4,Grades 7–10,,Universal,
Science,SCI,JHS,Core,60,4,Grades 7–10,,Universal,
Filipino,FIL,JHS,Core,60,4,Grades 7–10,,Universal,
Araling Panlipunan,AP,JHS,Core,60,4,Grades 7–10,,Universal,
Values Education,VE,JHS,Core,60,4,Grades 7–10,,Universal,
MAPEH,MAPEH,JHS,Core,60,4,Grades 7–10,,Universal,
HGP,HGP,JHS,Enrichment,60,1,Grades 7–10,,Universal,
Aral Program,ARAL,JHS,Enrichment,60,1,Grades 7–10,,Regular,
Technology and Livelihood Education (TLE),TLE,JHS,Specialized,60,4,Grades 7–10,,"Regular, SPA",
SPA Specialization,SPASPEC,JHS,Specialized,60,4,Grades 7–10,,SPA,
ICT,ICT,JHS,Specialized,60,4,Grades 7–10,,"SPJ, SP-STEM",
Developmental Reading,DEVREAD,JHS,Specialized,60,3,7,,SP-STEM,
Elementary Algebra,ELEMALG,JHS,Specialized,60,3,7,,SP-STEM,
Environmental Science,ENVSCI,JHS,Specialized,60,3,7,,SP-STEM,
Oral Communication in Context,ORALCOM,SHS,Core,50,4,11,First Semester,,
General Mathematics,GENMATH,SHS,Core,50,4,11,First Semester,,
Earth and Life Science,EARTHSCI,SHS,Core,50,4,11,First Semester,,
Komunikasyon at Pananaliksik,KOMPAN,SHS,Core,50,4,11,First Semester,,
Physical Education and Health 1,PEH1,SHS,Core,50,2,11,First Semester,,
21st Century Literature,LIT21,SHS,Core,50,4,11,Last Semester,,
Statistics and Probability,STATPROB,SHS,Core,50,4,11,Last Semester,,
Physical Science,PHYSCI,SHS,Core,50,4,11,Last Semester,,
Personal Development,PERDEV,SHS,Core,50,4,11,Last Semester,,
Physical Education and Health 2,PEH2,SHS,Core,50,2,11,Last Semester,,
"Understanding Culture, Society, and Politics",UCSP,SHS,Core,50,4,12,First Semester,,
Media and Information Literacy,MIL,SHS,Core,50,4,12,First Semester,,
Empowerment Technologies,EMPTECH,SHS,Applied,50,4,11,First Semester,,
English for Academic and Professional Purposes,EAPP,SHS,Applied,50,4,11,Last Semester,,
Practical Research 1,PRACRES1,SHS,Applied,50,4,11,Last Semester,,
Practical Research 2,PRACRES2,SHS,Applied,50,4,12,First Semester,,
Inquiries, Investigations, and Immersion,3I,SHS,Applied,50,4,12,Last Semester,,
General Physics 1,GENPHYS1,SHS,Specialized,50,4,12,First Semester,,STEM
General Chemistry 1,GENCHEM1,SHS,Specialized,50,4,12,First Semester,,STEM
Pre-Calculus,PRECALC,SHS,Specialized,50,4,11,First Semester,,STEM
Basic Calculus,BASICCALC,SHS,Specialized,50,4,11,Last Semester,,STEM
Business Math,BUSMATH,SHS,Specialized,50,4,11,First Semester,,ABM
Organization and Management,ORGMGT,SHS,Specialized,50,4,11,First Semester,,ABM
Fundamentals of ABM 1,FABM1,SHS,Specialized,50,4,11,Last Semester,,ABM
Disciplines and Ideas in the Social Sciences,DISS,SHS,Specialized,50,4,11,First Semester,,HUMSS
Creative Writing,CREATIVEWR,SHS,Specialized,50,4,11,First Semester,,HUMSS
World Religions and Belief Systems,WORLDREL,SHS,Specialized,50,4,11,Last Semester,,HUMSS
Computer Programming 1,COMPPROG1,SHS,Specialized,50,4,11,First Semester,,TVL
Computer Programming 2,COMPPROG2,SHS,Specialized,50,4,11,Last Semester,,TVL`;
      }

      const workbook = XLSX.read(text, { type: "string" });
      const sheetName = workbook.SheetNames[0];
      const rawRows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });
      const preparedMap = new Map();
      rawRows.forEach((row) => {
        const item = mapImportedRowToForm(row);
        if (item) {
          const key = createContextKey(item);
          if (!preparedMap.has(key)) {
            preparedMap.set(key, item);
          }
        }
      });
      const preparedSubjects = Array.from(preparedMap.values());
      persistSubjects(preparedSubjects);
      showNotice(`Successfully loaded ${preparedSubjects.length} DepEd Subjects Catalog!`, "success");
    } catch (err) {
      console.error("Subject load error:", err);
      showNotice("Failed to load DepEd subject dataset.", "error");
    }
  };

  const handleClearAllSubjects = () => {
    setConfirmModal({
      open: true,
      title: "Clear All Subjects",
      message: "Are you sure you want to clear ALL subjects? This action cannot be undone.",
      confirmLabel: "Clear All",
      onConfirm: () => {
        persistSubjects([]);
        showNotice("All subjects cleared.", "success");
        setConfirmModal({ open: false });
      },
      onCancel: () => setConfirmModal({ open: false }),
    });
  };

  const jhsSubjects = subjects.filter((subject) => subject.schoolLevel === "jhs");
  const shsSubjects = subjects.filter((subject) => subject.schoolLevel === "shs");

  return (
    <>
      <div style={{ marginBottom: 18, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
        <div>
          <h1 style={{ margin: 0, color: "#1f2c6f", fontSize: 30 }}>Subjects</h1>
          <p style={{ margin: "8px 0 0", color: "#5b6787", fontSize: 14 }}>
            Manage JHS core & special program subjects (SP-STEM, SPA, SPJ) and SHS tracks & elective clusters.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <button type="button" onClick={handleClearAllSubjects} style={dangerActionStyle()}>
            Clear All Subjects
          </button>

          {notice ? (
            <div
              role="status"
              aria-live="polite"
              style={{
                position: "fixed",
                top: 24,
                right: 24,
                zIndex: 100000,
                background: noticeType === "error" ? "#dc2626" : noticeType === "info" ? "#2563eb" : noticeType === "warning" ? "#d97706" : "#16a34a",
                color: "#ffffff",
                borderRadius: 10,
                padding: "12px 18px",
                fontSize: 13,
                fontWeight: 700,
                boxShadow: "0 10px 30px rgba(15, 23, 42, 0.25)",
                transition: "opacity 240ms ease, transform 240ms ease",
                opacity: noticeVisible ? 1 : 0,
                transform: noticeVisible ? "translateY(0)" : "translateY(-6px)",
                maxWidth: 400,
                display: "flex",
                alignItems: "center",
                gap: 8,
                pointerEvents: "none",
              }}
            >
              <span>{noticeType === "error" ? "!" : noticeType === "info" ? "i" : noticeType === "warning" ? "!" : "✓"}</span>
              <span>{notice}</span>
            </div>
          ) : null}
        </div>
      </div>

      <div ref={formCardRef} style={{ background: "#ffffff", border: "1px solid #e3e7ef", borderRadius: 14, padding: 16, marginBottom: 16 }}>
        <h2 style={{ margin: 0, color: "#1f2c6f", fontSize: 18 }}>{editingId ? "Edit Subject" : "Add Subject"}</h2>
        <p style={{ margin: "6px 0 0", color: "#5d698d", fontSize: 13 }}>
          Configure subject details, weekly workload, and target program / cluster scope.
        </p>

        <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 12 }}>
          <Field label="Subject Name">
            <input
              type="text"
              placeholder="e.g., Advanced Biology"
              value={formState.subjectName}
              onChange={(event) => handleFormField("subjectName", event.target.value)}
              style={inputStyle()}
            />
          </Field>

          <Field label="Subject Code">
            <input
              type="text"
              placeholder="e.g., BIO101"
              value={formState.subjectCode}
              onChange={(event) => handleFormField("subjectCode", event.target.value)}
              style={inputStyle()}
            />
          </Field>

          <Field label="School Level">
            <select value={formState.schoolLevel} onChange={(event) => handleFormField("schoolLevel", event.target.value)} style={selectStyle()}>
              <option value="jhs">Junior High School</option>
              <option value="shs">Senior High School</option>
            </select>
          </Field>

          {formState.schoolLevel === "shs" ? (
            <Field label="Grade Level (SHS)">
              <select value={formState.gradeLevel} onChange={(event) => handleFormField("gradeLevel", event.target.value)} style={selectStyle()}>
                {SHS_GRADES.map((grade) => (
                  <option key={grade} value={String(grade)}>
                    Grade {grade}
                  </option>
                ))}
              </select>
            </Field>
          ) : (
            <Field label="Grade Level (JHS)">
              <select value={formState.gradeLevel || "7"} onChange={(event) => handleFormField("gradeLevel", event.target.value)} style={selectStyle()}>
                <option value="7">Grade 7</option>
                <option value="8">Grade 8</option>
                <option value="9">Grade 9</option>
                <option value="10">Grade 10</option>
                <option value="7-10">Grades 7–10 (Shared)</option>
              </select>
            </Field>
          )}

          <Field label="Subject Type">
            <select value={formState.subjectType} onChange={(event) => handleFormField("subjectType", event.target.value)} style={selectStyle()}>
              {getSubjectTypesForLevel(formState.schoolLevel).map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Daily Duration (minutes)">
            <input
              type="number"
              min={15}
              max={120}
              step="1"
              value={formState.dailyMinutes}
              onChange={(event) => handleFormField("dailyMinutes", event.target.value)}
              style={inputStyle()}
            />
          </Field>

          <Field label="Classes per Week">
            <input
              type="number"
              min={1}
              max={8}
              step="1"
              value={formState.classesPerWeek}
              onChange={(event) => handleFormField("classesPerWeek", event.target.value)}
              style={inputStyle()}
            />
          </Field>

          {formState.schoolLevel === "jhs" ? (
            <Field label="Program Target Scope (JHS)">
              <select
                value={formState.programScope || "Universal"}
                onChange={(event) => handleFormField("programScope", event.target.value)}
                style={selectStyle()}
              >
                {JHS_PROGRAM_SCOPES.map((scope) => (
                  <option key={scope.value} value={scope.value}>
                    {scope.label}
                  </option>
                ))}
              </select>
            </Field>
          ) : (
            <>
              <Field label="Semester (SHS)">
                <select
                  value={formState.semester}
                  onChange={(event) => handleFormField("semester", event.target.value)}
                  style={selectStyle()}
                >
                  <option value="">Select Semester</option>
                  {SHS_SEMESTERS.map((semester) => (
                    <option key={semester} value={semester}>
                      {semester}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Elective Cluster Scope (SHS)">
                <select
                  value={formState.strand}
                  onChange={(event) => handleFormField("strand", event.target.value)}
                  style={selectStyle()}
                  disabled={formState.subjectType === "Core"}
                >
                  <option value="">{formState.subjectType === "Core" ? "All Clusters (Core)" : "Select Target Cluster"}</option>
                  {SHS_CLUSTERS.map((cluster) => (
                    <option key={cluster} value={cluster}>
                      {cluster}
                    </option>
                  ))}
                </select>
              </Field>
            </>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 14 }}>
          {editingId ? (
            <button type="button" onClick={handleCancelEdit} style={secondaryActionStyle()}>
              Cancel
            </button>
          ) : null}

          <button type="button" onClick={handleSaveSubject} style={primaryActionStyle()}>
            {editingId ? "Save Changes" : "Add Subject"}
          </button>
        </div>
      </div>

      <div style={{ background: "#ffffff", border: "1px solid #e3e7ef", borderRadius: 14, padding: 16, marginBottom: 16 }}>
        <h2 style={{ margin: 0, color: "#1f2c6f", fontSize: 18 }}>Import Subjects (Excel/CSV)</h2>
        <p style={{ margin: "6px 0 0", color: "#5d698d", fontSize: 13 }}>
          Accepted headers: Subject Name, Subject Code, School Level, Subject Type, Daily Minutes, Classes per Week, Program Scope / Strand.
        </p>

        <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <input type="file" accept=".xlsx,.xls,.csv" onChange={handleImportFileChange} style={{ ...inputStyle(), paddingTop: 7, height: 38 }} />
          <button type="button" onClick={handleImportValidRows} style={primaryActionStyle()} disabled={!importPreviewRows.length || isParsingImport}>
            Import Valid Rows
          </button>
          <button type="button" onClick={handleLoadDepEdSubjects} style={{ ...primaryActionStyle(), background: "#1e40af" }}>
            Load DepEd Subjects Catalog
          </button>
          {isParsingImport ? <span style={{ color: "#5a678d", fontSize: 12 }}>Parsing file...</span> : null}
        </div>

        {importFileName ? (
          <p style={{ margin: "10px 0 0", color: "#5a678d", fontSize: 12 }}>
            File: {importFileName} • Valid rows: {importPreviewRows.length} • Errors: {importErrors.length}
          </p>
        ) : null}

        {importErrors.length ? (
          <div style={{ marginTop: 10, border: "1px solid #f1d1d6", background: "#fff7f8", borderRadius: 10, padding: 10 }}>
            <p style={{ margin: 0, color: "#a44652", fontSize: 12, fontWeight: 700 }}>Import Errors</p>
            <ul style={{ margin: "8px 0 0", paddingLeft: 18, color: "#8a4a55", fontSize: 12, display: "grid", gap: 4 }}>
              {importErrors.slice(0, 8).map((error, index) => (
                <li key={`${error}-${index}`}>{error}</li>
              ))}
            </ul>
            {importErrors.length > 8 ? <p style={{ margin: "8px 0 0", color: "#8a4a55", fontSize: 12 }}>+{importErrors.length - 8} more error(s)</p> : null}
          </div>
        ) : null}

        {importPreviewRows.length ? (
          <div style={{ marginTop: 10, border: "1px solid #dce3f2", background: "#fbfcff", borderRadius: 10, padding: 10 }}>
            <p style={{ margin: 0, color: "#334174", fontSize: 12, fontWeight: 700 }}>Preview (first 8 valid rows)</p>
            <div style={{ marginTop: 8, display: "grid", gap: 6 }}>
              {importPreviewRows.slice(0, 8).map((row, index) => (
                <div key={`${row.subjectCode}-${row.schoolLevel}-${index}`} style={{ display: "grid", gridTemplateColumns: "1.4fr 0.8fr 0.8fr 0.8fr 0.8fr 0.9fr", gap: 8, alignItems: "center", border: "1px solid #e5eaf4", background: "#fff", borderRadius: 8, padding: "7px 8px" }}>
                  <span style={{ color: "#27356f", fontSize: 12, fontWeight: 700 }}>{row.subjectName}</span>
                  <span style={pillStyle()}>{row.subjectCode}</span>
                  <span style={pillStyle()}>{row.schoolLevel === "shs" ? `Grade ${row.gradeLevel}` : "Grade 7-10"}</span>
                  <span style={pillStyle(row.subjectType !== "Core")}>{row.subjectType}</span>
                  <span style={pillStyle()}>{row.dailyMinutes ? `${row.dailyMinutes} min` : "—"}</span>
                  <span style={pillStyle()}>{row.classesPerWeek ? `${row.classesPerWeek} classes` : "—"}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {offeredLevels !== "shs_only" ? (
        <SubjectsLevelPanel
          title="Junior High School Subjects"
          subtitle="Grouped by grade level & special program targeting (STE, SPA, SPJ, Universal)."
          subjects={jhsSubjects}
          editingId={editingId}
          onEdit={handleEditSubject}
          onDelete={handleDeleteSubject}
        />
      ) : null}

      {offeredLevels !== "jhs_only" ? (
        <SubjectsLevelPanel
          title="Senior High School Subjects"
          subtitle="Grouped by semester context, grade level, and elective cluster."
          subjects={shsSubjects}
          editingId={editingId}
          onEdit={handleEditSubject}
          onDelete={handleDeleteSubject}
        />
      ) : null}

      <ConfirmationModal
        open={confirmModal.open}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel={confirmModal.confirmLabel}
        onConfirm={confirmModal.onConfirm}
        onCancel={confirmModal.onCancel}
      />
    </>
  );
}

function ConfirmationModal({ open, message, onConfirm, onCancel, title = "Confirmation", confirmLabel = "Confirm" }) {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, width: 440, maxWidth: "90%", padding: 24, boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)" }}>
        <h3 style={{ margin: "0 0 10px", color: "#1e293b", fontSize: 18, fontWeight: 700 }}>{title}</h3>
        <p style={{ margin: "0 0 20px", color: "#475569", fontSize: 14, lineHeight: 1.5 }}>{message}</p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <button type="button" onClick={onCancel} style={{ padding: "9px 18px", borderRadius: 8, background: "#f1f5f9", color: "#475569", fontWeight: 600, border: "1px solid #cbd5e1", cursor: "pointer" }}>Cancel</button>
          <button type="button" onClick={onConfirm} style={{ padding: "9px 18px", borderRadius: 8, background: "#b53f4e", color: "#fff", fontWeight: 700, border: "none", cursor: "pointer" }}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

function SubjectsLevelPanel({ title, subtitle, subjects, editingId, onEdit, onDelete }) {
  return (
    <div style={{ background: "#ffffff", border: "1px solid #e3e7ef", borderRadius: 14, padding: 16, marginBottom: 16 }}>
      <h2 style={{ margin: 0, color: "#1f2c6f", fontSize: 18 }}>{title}</h2>
      <p style={{ margin: "6px 0 0", color: "#5d698d", fontSize: 13 }}>{subtitle}</p>

      {subjects.length === 0 ? (
        <p style={{ margin: "12px 0 0", color: "#7a86a7", fontSize: 13 }}>No subjects added yet.</p>
      ) : (
        <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
          {subjects
            .slice()
            .sort((left, right) => {
              const byGrade = getGradeSortValue(left) - getGradeSortValue(right);
              if (byGrade !== 0) {
                return byGrade;
              }

              const bySemester = (left.semester || "").localeCompare(right.semester || "");
              if (bySemester !== 0) {
                return bySemester;
              }

              return left.subjectName.localeCompare(right.subjectName);
            })
            .map((subject) => (
              <SubjectRow key={subject.id} subject={subject} isEditing={editingId === subject.id} onEdit={onEdit} onDelete={onDelete} />
            ))}
        </div>
      )}
    </div>
  );
}

function renderScopeBadge(subject) {
  if (subject.schoolLevel === "jhs") {
    const scope = subject.programScope || "Universal";
    let badgeStyle = { bg: "#f2f4f8", border: "#d9dfea", color: "#4d5a84" };

    if (scope === "STE" || scope === "SP-STEM") {
      badgeStyle = { bg: "#e6f4ea", border: "#a8dab5", color: "#137333" };
    } else if (scope === "SPA") {
      badgeStyle = { bg: "#f3e8ff", border: "#d8b4fe", color: "#6b21a8" };
    } else if (scope === "SPJ") {
      badgeStyle = { bg: "#fff7ed", border: "#ffedd5", color: "#c2410c" };
    }

    return (
      <span
        style={{
          color: badgeStyle.color,
          fontSize: 11,
          fontWeight: 700,
          whiteSpace: "nowrap",
          background: badgeStyle.bg,
          borderRadius: 999,
          border: `1px solid ${badgeStyle.border}`,
          padding: "3px 8px",
          display: "inline-flex",
          justifyContent: "center",
        }}
      >
        {scope === "Universal" ? "Universal (All)" : (scope === "STE" || scope === "SP-STEM") ? "SP-STEM Only" : scope === "SPA" ? "SPA Only" : scope === "SPJ" ? "SPJ Only" : scope}
      </span>
    );
  }

  const cluster = subject.strand || "";
  const isCore = subject.subjectType === "Core" || !cluster;

  return (
    <span
      style={{
        color: isCore ? "#4d5a84" : "#2a3778",
        fontSize: 11,
        fontWeight: 700,
        whiteSpace: "nowrap",
        background: isCore ? "#f2f4f8" : "#e9edff",
        borderRadius: 999,
        border: isCore ? "1px solid #d9dfea" : "1px solid #cdd5ff",
        padding: "3px 8px",
        display: "inline-flex",
        justifyContent: "center",
      }}
    >
      {isCore ? "All Clusters (Core)" : cluster.split(" (")[0]}
    </span>
  );
}

function SubjectRow({ subject, isEditing, onEdit, onDelete }) {
  const isShs = subject.schoolLevel === "shs";

  return (
    <div
      style={{
        border: isEditing ? "1px solid #cdd5ff" : "1px solid #e3e7ef",
        borderRadius: 10,
        background: isEditing ? "#f3f6ff" : "#fbfcff",
        padding: "10px 12px",
        display: "grid",
        gridTemplateColumns: isShs ? "1.2fr 0.8fr 0.8fr 0.8fr 0.8fr 1.3fr 1.3fr auto" : "1.4fr 0.8fr 0.8fr 0.8fr 0.8fr 1.1fr auto",
        alignItems: "center",
        gap: 8,
      }}
    >
      <div>
        <p style={{ margin: 0, color: "#25336f", fontSize: 13, fontWeight: 700 }}>{subject.subjectName}</p>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginTop: 2 }}>
          <span style={{ color: "#5d698f", fontSize: 11 }}>{subject.subjectCode}</span>
          {subject.isDoublePeriod ? (
            <span style={{ fontSize: 10, fontWeight: 700, background: "#e0e7ff", color: "#3730a3", border: "1px solid #c7d2fe", padding: "1px 6px", borderRadius: 4 }}>
              Double Period
            </span>
          ) : null}
          {subject.preferredDay && subject.preferredDay !== "any" ? (
            <span style={{ fontSize: 10, fontWeight: 700, background: "#eff6ff", color: "#1e40af", border: "1px solid #bfdbfe", padding: "1px 6px", borderRadius: 4 }}>
              {subject.preferredDay}
            </span>
          ) : null}
          {subject.preferredPeriodSlot && subject.preferredPeriodSlot !== "any" ? (
            <span style={{ fontSize: 10, fontWeight: 700, background: "#f4f7ff", color: "#1f2c6f", border: "1px solid #bfdbfe", padding: "1px 6px", borderRadius: 4 }}>
              {formatSubjectPeriodSlot(subject.preferredPeriodSlot)}
            </span>
          ) : null}
        </div>
      </div>

      <span style={pillStyle()}>{String(subject.gradeLevel || "").includes("7-10") ? "Grades 7–10" : `Grade ${subject.gradeLevel || 7}`}</span>
      <span style={pillStyle(subject.subjectType !== "Core")}>{subject.subjectType}</span>
      <span style={pillStyle()}>{subject.dailyMinutes ? `${subject.dailyMinutes} min` : "—"}</span>
      <span style={pillStyle()}>{subject.classesPerWeek ? `${subject.classesPerWeek} classes` : "—"}</span>

      {renderScopeBadge(subject)}

      {isShs ? <span style={pillStyle()}>{subject.semester || "Semester N/A"}</span> : null}

      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
        <button type="button" onClick={() => onEdit(subject)} style={smallActionStyle()}>
          Edit
        </button>
        <button type="button" onClick={() => onDelete(subject.id)} style={smallDangerStyle()}>
          Delete
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <span style={{ margin: 0, color: "#5f6b90", fontSize: 12 }}>{label}</span>
      {children}
    </label>
  );
}

function inputStyle() {
  return {
    width: "100%",
    height: 36,
    border: "1px solid #cfd7ef",
    borderRadius: 9,
    padding: "0 10px",
    fontSize: 13,
    color: "#1f2c6f",
    boxSizing: "border-box",
    background: "#ffffff",
  };
}

function selectStyle() {
  return {
    ...inputStyle(),
    appearance: "none",
  };
}

function pillStyle(highlight = false) {
  return {
    color: highlight ? "#3B4197" : "#4d5a84",
    fontSize: 11,
    fontWeight: 700,
    whiteSpace: "nowrap",
    background: highlight ? "#e9edff" : "#f2f4f8",
    borderRadius: 999,
    border: highlight ? "1px solid #cdd5ff" : "1px solid #d9dfea",
    padding: "3px 8px",
    display: "inline-flex",
    justifyContent: "center",
  };
}

function primaryActionStyle() {
  return {
    border: "none",
    background: "#3B4197",
    color: "#ffffff",
    borderRadius: 10,
    padding: "10px 14px",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace: "nowrap",
  };
}

function secondaryActionStyle() {
  return {
    border: "1px solid #cfd7ef",
    background: "#ffffff",
    color: "#2f3a73",
    borderRadius: 10,
    padding: "10px 14px",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace: "nowrap",
  };
}

function dangerActionStyle() {
  return {
    border: "1px solid #e7c4cb",
    background: "#fff6f7",
    color: "#b53f4e",
    borderRadius: 10,
    padding: "10px 14px",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace: "nowrap",
  };
}

function smallActionStyle() {
  return {
    border: "1px solid #d3daf0",
    background: "#ffffff",
    color: "#2f3a73",
    borderRadius: 8,
    padding: "6px 8px",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
  };
}

function smallDangerStyle() {
  return {
    ...smallActionStyle(),
    color: "#b53f4e",
    border: "1px solid #e7c4cb",
    background: "#fff6f7",
  };
}

function validateSubjectForm(formState) {
  if (formState.schoolLevel !== "jhs" && formState.schoolLevel !== "shs") {
    return "School Level must be JHS or SHS.";
  }

  if (!formState.subjectName.trim()) {
    return "Subject Name is required.";
  }

  if (!formState.subjectCode.trim()) {
    return "Subject Code is required.";
  }

  if (!formState.subjectType) {
    return "Subject Type is required.";
  }

  const allowedTypes = getSubjectTypesForLevel(formState.schoolLevel);
  if (!allowedTypes.includes(formState.subjectType)) {
    return formState.schoolLevel === "jhs"
      ? "Junior High Subject Type must be Core, Specialized, or Enrichment."
      : "Senior High Subject Type must be Core, Applied, Specialized, or Enrichment.";
  }

  const daily = Number.parseFloat(formState.dailyMinutes);
  const classes = Number.parseInt(String(formState.classesPerWeek), 10);

  if (Number.isNaN(daily) || daily < 15 || daily > 120) {
    return "Daily Duration must be between 15 and 120 minutes.";
  }

  if (Number.isNaN(classes) || classes < 1 || classes > 8) {
    return "Classes per Week must be between 1 and 8.";
  }

  if (formState.schoolLevel === "shs" && !formState.semester) {
    return "Semester is required for Senior High School subjects.";
  }

  return null;
}

function normalizeSubject(formState, existingId = null) {
  const dailyMinutes = normalizeDailyMinutes(formState.dailyMinutes);
  const classesPerWeek = normalizeClassesPerWeek(formState.classesPerWeek);
  const hoursPerWeek = computeHoursPerWeekFromWorkload(dailyMinutes, classesPerWeek);
  const now = new Date().toISOString();

  return {
    id: existingId || createSubjectId(),
    subjectName: formState.subjectName.trim(),
    subjectCode: formState.subjectCode.trim().toUpperCase(),
    schoolLevel: formState.schoolLevel,
    gradeLevel: formState.schoolLevel === "shs" ? Number.parseInt(formState.gradeLevel, 10) : (formState.gradeLevel || JHS_GRADE_BAND),
    subjectType: normalizeSubjectTypeByLevel(formState.subjectType, formState.schoolLevel),
    dailyMinutes,
    classesPerWeek,
    hoursPerWeek,
    programScope: formState.schoolLevel === "jhs" ? (formState.programScope || "Universal") : "Universal",
    semester: formState.schoolLevel === "shs" ? formState.semester : "",
    strand: formState.schoolLevel === "shs" && formState.subjectType !== "Core" ? formState.strand : "",
    createdAt: now,
    updatedAt: now,
  };
}

function getSubjectTypesForLevel(schoolLevel) {
  return schoolLevel === "shs" ? SHS_SUBJECT_TYPES : JHS_SUBJECT_TYPES;
}

function normalizeSubjectTypeByLevel(subjectType, schoolLevel) {
  const normalized = String(subjectType || "").trim().toLowerCase();

  if (schoolLevel === "shs") {
    if (normalized === "applied") {
      return "Applied";
    }
    if (normalized === "specialized") {
      return "Specialized";
    }
    if (normalized === "enrichment") {
      return "Enrichment";
    }
    if (normalized === "core") {
      return "Core";
    }

    return "";
  }

  if (normalized === "specialized") {
    return "Specialized";
  }
  if (normalized === "enrichment") {
    return "Enrichment";
  }
  if (normalized === "core") {
    return "Core";
  }

  return "";
}

function normalizeDailyMinutes(value) {
  const parsed = Number.parseFloat(value);
  if (Number.isNaN(parsed)) {
    return 0;
  }

  const rounded = Math.round(parsed);
  if (rounded <= 0) return 0;
  if (rounded > 120) return 120;
  return rounded;
}

function normalizeClassesPerWeek(value) {
  const parsed = Number.parseInt(String(value), 10);
  if (Number.isNaN(parsed)) return 0;
  if (parsed <= 0) return 0;
  if (parsed > 8) return 8;
  return parsed;
}

function computeHoursPerWeekFromWorkload(dailyMinutes, classesPerWeek) {
  if (Number.isNaN(dailyMinutes) || Number.isNaN(classesPerWeek) || dailyMinutes <= 0 || classesPerWeek <= 0) {
    return 0;
  }

  return Math.round((dailyMinutes * classesPerWeek / 60) * 100) / 100;
}

function createSubjectId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createContextKey(subject) {
  const schoolLevel = String(subject.schoolLevel || "").toLowerCase();
  const gradeLevel = schoolLevel === "shs" ? String(subject.gradeLevel || "") : String(subject.gradeLevel || JHS_GRADE_BAND);
  const semester = schoolLevel === "shs" ? String(subject.semester || "").toLowerCase() : "";
  const subjectType = String(subject.subjectType || "").toLowerCase();
  const programScope = schoolLevel === "jhs" ? String(subject.programScope || "universal").toLowerCase() : "universal";
  const strand = schoolLevel === "shs" && subjectType !== "core" ? String(subject.strand || "").toLowerCase() : "all";

  return [
    String(subject.subjectCode || "").trim().toLowerCase(),
    schoolLevel,
    gradeLevel,
    semester,
    programScope,
    strand,
  ].join("|");
}

function mapImportedRowToForm(row) {
  if (!row || typeof row !== "object") {
    return null;
  }

  const normalizedRow = Object.entries(row).reduce((accumulator, [key, value]) => {
    accumulator[normalizeHeaderKey(key)] = String(value ?? "").trim();
    return accumulator;
  }, {});

  const subjectName = pickValue(normalizedRow, ["subjectname", "subject", "name"]);
  const subjectCode = pickValue(normalizedRow, ["subjectcode", "code"]);
  const schoolLevel = normalizeSchoolLevel(pickValue(normalizedRow, ["schoollevel", "level"]));
  const subjectType = normalizeSubjectType(pickValue(normalizedRow, ["subjecttype", "type"]), schoolLevel);
  const dailyMinutes = pickValue(normalizedRow, ["dailymintutes", "dailyminutes", "dailyduration", "dailymins"]);
  const classesPerWeek = pickValue(normalizedRow, ["classesperweek", "classesweekly", "sessionsperweek", "classes"]);
  const gradeLevelRaw = pickValue(normalizedRow, ["gradelevel", "grade"]);
  const semester = normalizeSemester(pickValue(normalizedRow, ["semester", "term"]));
  const programScope = pickValue(normalizedRow, ["programscope", "scope", "program"]);
  const strand = pickValue(normalizedRow, ["strand", "cluster"]);
  const isDoublePeriod = pickValue(normalizedRow, ["isdoubleperiod", "doubleperiod"]);
  const preferredDay = pickValue(normalizedRow, ["preferredday", "day"]);
  const preferredPeriodSlot = pickValue(normalizedRow, ["preferredperiodslot", "preferredslot", "slot"]);

  if (!subjectName && !subjectCode && !schoolLevel && !subjectType && !dailyMinutes && !classesPerWeek) {
    return null;
  }

  const normalizedDailyMinutes = normalizeDailyMinutes(dailyMinutes);
  const normalizedClassesPerWeek = normalizeClassesPerWeek(classesPerWeek);
  const derivedHoursPerWeek = computeHoursPerWeekFromWorkload(normalizedDailyMinutes, normalizedClassesPerWeek);

  let cleanName = subjectName;
  let cleanCode = subjectCode;
  if (schoolLevel === "jhs" && subjectType === "Core") {
    cleanName = subjectName.replace(/\s+\d+$/g, "").trim();
    cleanCode = subjectCode.replace(/\d+$/g, "").trim();
  }

  return {
    id: `SUBJ-${cleanCode || "x"}-${Math.floor(Math.random() * 100000)}`,
    subjectName: cleanName,
    subjectCode: cleanCode,
    schoolLevel,
    gradeLevel: schoolLevel === "shs" ? normalizeShsGrade(gradeLevelRaw) : (normalizeJhsGrade(gradeLevelRaw) || "7-10"),
    subjectType,
    dailyMinutes: normalizedDailyMinutes,
    classesPerWeek: normalizedClassesPerWeek,
    hoursPerWeek: derivedHoursPerWeek,
    programScope: programScope || "Universal",
    semester: schoolLevel === "shs" ? semester : "",
    strand: schoolLevel === "shs" && subjectType !== "Core" ? strand : "",
    isDoublePeriod: Boolean(isDoublePeriod),
    preferredDay: preferredDay || "any",
    preferredPeriodSlot: preferredPeriodSlot || "any",
  };
}

function normalizeHeaderKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/gu, "");
}

function pickValue(row, keys) {
  for (const key of keys) {
    if (row[key]) {
      return row[key];
    }
  }

  return "";
}

function normalizeSchoolLevel(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) {
    return "";
  }

  if (normalized.includes("senior") || normalized === "shs") {
    return "shs";
  }

  if (normalized.includes("junior") || normalized === "jhs") {
    return "jhs";
  }

  return "";
}

function normalizeSubjectType(value, schoolLevel) {
  const normalized = String(value || "").trim().toLowerCase();

  if (schoolLevel === "shs") {
    if (normalized === "applied") {
      return "Applied";
    }
    if (normalized === "specialized") {
      return "Specialized";
    }
    if (normalized === "enrichment") {
      return "Enrichment";
    }
    if (normalized === "core") {
      return "Core";
    }

    return "";
  }

  if (normalized === "specialized") {
    return "Specialized";
  }
  if (normalized === "enrichment") {
    return "Enrichment";
  }
  if (normalized === "core") {
    return "Core";
  }

  return "";
}

function normalizeSemester(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) {
    return "";
  }

  if (normalized.includes("first") || normalized === "1" || normalized === "1st") {
    return "First Semester";
  }

  if (normalized.includes("last") || normalized.includes("second") || normalized === "2" || normalized === "2nd") {
    return "Last Semester";
  }

  return "";
}

function normalizeShsGrade(value) {
  const parsed = Number.parseInt(String(value || "").trim(), 10);
  if (parsed === 11 || parsed === 12) {
    return String(parsed);
  }

  return "";
}

function normalizeJhsGrade(value) {
  const text = String(value || "").trim();
  if (!text) return "7-10";

  const lower = text.toLowerCase();
  if (
    text.includes("7-10") ||
    text.includes("7–10") ||
    lower.includes("7-10") ||
    lower.includes("7–10") ||
    lower.includes("universal") ||
    lower.includes("shared") ||
    lower.includes("all")
  ) {
    return "7-10";
  }

  if (text === "7" || lower === "grade 7") return "7";
  if (text === "8" || lower === "grade 8") return "8";
  if (text === "9" || lower === "grade 9") return "9";
  if (text === "10" || lower === "grade 10") return "10";

  const matched = text.match(/\b(7|8|9|10)\b/);
  if (matched && !text.includes("-") && !text.includes("–")) {
    return matched[1];
  }

  return "7-10";
}

function stripAuditFields(subject) {
  const { createdAt, updatedAt, ...rest } = subject;
  return rest;
}

function getGradeSortValue(subject) {
  if (subject.schoolLevel === "jhs") {
    return 7;
  }

  const parsed = Number.parseInt(String(subject.gradeLevel), 10);
  return Number.isNaN(parsed) ? 99 : parsed;
}

function getInitialSubjects() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(SUBJECTS_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    let needsSync = false;
    const synchronized = parsed.map((subject) => {
      const schoolLevel = subject.schoolLevel === "shs" ? "shs" : "jhs";
      const normalizedType = normalizeSubjectTypeByLevel(subject.subjectType, schoolLevel);
      const code = String(subject.subjectCode || "").trim().toUpperCase();

      let dailyMinutes = Number(subject.dailyMinutes) || 60;
      let classesPerWeek = Number(subject.classesPerWeek) || 4;
      let hoursPerWeek = Number(subject.hoursPerWeek);

      const isStemEnhanced = code === "DEVREAD" || code === "ELEMALG" || code === "ENVSCI";
      if (isStemEnhanced) {
        if (classesPerWeek !== 3 || dailyMinutes !== 60 || hoursPerWeek !== 3) {
          dailyMinutes = 60;
          classesPerWeek = 3;
          hoursPerWeek = 3;
          needsSync = true;
        }
      } else if (code === "HGP" || code === "ARAL") {
        if (classesPerWeek !== 1 || dailyMinutes !== 60 || hoursPerWeek !== 1) {
          dailyMinutes = 60;
          classesPerWeek = 1;
          hoursPerWeek = 1;
          needsSync = true;
        }
      } else if (schoolLevel === "jhs" && (normalizedType === "Core" || code === "TLE" || code === "SPASPEC" || code === "ICT")) {
        if (classesPerWeek !== 4 || dailyMinutes !== 60 || hoursPerWeek !== 4) {
          dailyMinutes = 60;
          classesPerWeek = 4;
          hoursPerWeek = 4;
          needsSync = true;
        }
      }

      if (Number.isNaN(hoursPerWeek) || !hoursPerWeek) {
        hoursPerWeek = Math.round(((dailyMinutes * classesPerWeek) / 60) * 100) / 100;
        needsSync = true;
      }

      if (schoolLevel === "jhs") {
        let cleanName = subject.subjectName || "";
        let cleanCode = subject.subjectCode || "";
        if (normalizedType === "Core") {
          cleanName = cleanName.replace(/\s+\d+$/g, "").trim();
          cleanCode = cleanCode.replace(/\d+$/g, "").trim();
        }
        return {
          ...subject,
          subjectName: cleanName,
          subjectCode: cleanCode,
          schoolLevel,
          subjectType: normalizedType,
          dailyMinutes,
          classesPerWeek,
          hoursPerWeek,
          programScope: subject.programScope || "Universal",
          gradeLevel: subject.gradeLevel || JHS_GRADE_BAND,
          semester: "",
          strand: "",
        };
      }

      return {
        ...subject,
        schoolLevel,
        subjectType: normalizedType,
        dailyMinutes,
        classesPerWeek,
        hoursPerWeek,
        strand: normalizedType !== "Core" ? subject.strand || "" : "",
      };
    });

    if (needsSync && typeof window !== "undefined") {
      window.localStorage.setItem(SUBJECTS_STORAGE_KEY, JSON.stringify(synchronized));
    }

    return synchronized;
  } catch {
    return [];
  }
}

function getOfferedLevels() {
  if (typeof window === "undefined") return "both";
  try {
    const raw = window.localStorage.getItem("turotugma_school_profile");
    if (!raw) return "both";
    const parsed = JSON.parse(raw);
    return parsed.offeredLevels || "both";
  } catch {
    return "both";
  }
}
