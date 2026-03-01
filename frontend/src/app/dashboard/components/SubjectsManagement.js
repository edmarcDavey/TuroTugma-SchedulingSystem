import { useRef, useState } from "react";
import * as XLSX from "xlsx";

const JHS_GRADES = [7, 8, 9, 10];
const SHS_GRADES = [11, 12];
const JHS_GRADE_BAND = "7-10";
const SHS_STRANDS = ["HUMSS", "STEM", "ABM", "TVL", "GAS"];
const JHS_SUBJECT_TYPES = ["Core", "Specialized"];
const SHS_SUBJECT_TYPES = ["Core", "Applied"];
const SHS_SEMESTERS = ["First Semester", "Last Semester"];
const SUBJECTS_STORAGE_KEY = "turotugma_subjects";

const EMPTY_FORM = {
  subjectName: "",
  subjectCode: "",
  schoolLevel: "jhs",
  gradeLevel: JHS_GRADE_BAND,
  subjectType: "Core",
  hoursPerWeek: "",
  strand: "",
  semester: "",
};

export default function SubjectsManagement() {
  const [subjects, setSubjects] = useState(() => getInitialSubjects());
  const [formState, setFormState] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [notice, setNotice] = useState("");
  const [noticeType, setNoticeType] = useState("success");
  const [importFileName, setImportFileName] = useState("");
  const [importPreviewRows, setImportPreviewRows] = useState([]);
  const [importErrors, setImportErrors] = useState([]);
  const [isParsingImport, setIsParsingImport] = useState(false);
  const noticeTimerRef = useRef(null);
  const formCardRef = useRef(null);

  const showNotice = (message, type = "success") => {
    if (noticeTimerRef.current) {
      window.clearTimeout(noticeTimerRef.current);
    }

    setNotice(message);
    setNoticeType(type);

    noticeTimerRef.current = window.setTimeout(() => {
      setNotice("");
    }, 2600);
  };

  const persistSubjects = (nextSubjects) => {
    setSubjects(nextSubjects);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(SUBJECTS_STORAGE_KEY, JSON.stringify(nextSubjects));
    }
  };

  const handleFormField = (field, value) => {
    setFormState((prev) => {
      const next = { ...prev, [field]: value };

      if (field === "schoolLevel") {
        if (value === "jhs") {
          next.gradeLevel = JHS_GRADE_BAND;
          next.subjectType = "Core";
          next.strand = "";
          next.semester = "";
        } else {
          next.gradeLevel = "11";
          next.subjectType = "Core";
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
      hoursPerWeek: String(subject.hoursPerWeek),
      strand: subject.strand || "",
      semester: subject.semester || "",
    });

    window.requestAnimationFrame(() => {
      formCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    showNotice("Edit mode enabled.", "success");
  };

  const handleDeleteSubject = (subjectId) => {
    const nextSubjects = subjects.filter((subject) => subject.id !== subjectId);
    persistSubjects(nextSubjects);

    if (editingId === subjectId) {
      setEditingId(null);
      setFormState(EMPTY_FORM);
    }

    showNotice("Subject removed.", "success");
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
          gradeLevel: mapped.schoolLevel === "shs" ? Number.parseInt(mapped.gradeLevel, 10) : JHS_GRADE_BAND,
          subjectType: mapped.subjectType,
          hoursPerWeek: normalizeHoursPerWeek(mapped.hoursPerWeek),
          semester: mapped.schoolLevel === "shs" ? mapped.semester : "",
          strand: mapped.schoolLevel === "shs" ? mapped.strand : "",
        });
      });

      setImportPreviewRows(nextPreviewRows);
      setImportErrors(nextErrors);

      if (!nextPreviewRows.length) {
        showNotice("No valid rows found. Please check your file headers and values.", "error");
      } else {
        showNotice(`Parsed ${nextPreviewRows.length} valid row(s) from ${file.name}.`, "success");
      }
    } catch {
      showNotice("Failed to parse file. Use .xlsx, .xls, or .csv format.", "error");
      setImportPreviewRows([]);
      setImportErrors([]);
    } finally {
      setIsParsingImport(false);
      event.target.value = "";
    }
  };

  const handleImportValidRows = () => {
    if (!importPreviewRows.length) {
      showNotice("No valid rows ready to import.", "error");
      return;
    }

    const existingKeys = new Set(subjects.map((subject) => createContextKey(subject)));
    const newSubjects = [];

    importPreviewRows.forEach((row) => {
      const key = createContextKey(row);
      if (existingKeys.has(key)) {
        return;
      }

      existingKeys.add(key);
      const now = new Date().toISOString();
      newSubjects.push({
        ...row,
        id: createSubjectId(),
        createdAt: now,
        updatedAt: now,
      });
    });

    if (!newSubjects.length) {
      showNotice("All preview rows already exist in your current subject list.", "error");
      return;
    }

    persistSubjects([...subjects, ...newSubjects]);
    setImportPreviewRows([]);
    setImportErrors([]);
    setImportFileName("");
    showNotice(`Imported ${newSubjects.length} subject(s) successfully.`, "success");
  };

  const jhsSubjects = subjects.filter((subject) => subject.schoolLevel === "jhs");
  const shsSubjects = subjects.filter((subject) => subject.schoolLevel === "shs");

  return (
    <>
      <div style={{ marginBottom: 18, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
        <div>
          <h1 style={{ margin: 0, color: "#1f2c6f", fontSize: 30 }}>Subjects</h1>
          <p style={{ margin: "8px 0 0", color: "#5b6787", fontSize: 14 }}>
            Manage JHS and SHS subjects with grade level, type, semester context, strand, and weekly hours.
          </p>
        </div>

        {notice ? (
          <div
            role="status"
            aria-live="polite"
            style={{
              background: noticeType === "error" ? "#b53f4e" : "#2f5f3a",
              color: "#ffffff",
              borderRadius: 10,
              padding: "10px 14px",
              fontSize: 13,
              fontWeight: 600,
              boxShadow: "0 10px 24px rgba(15, 27, 45, 0.2)",
              maxWidth: 360,
            }}
          >
            {notice}
          </div>
        ) : null}
      </div>

      <div ref={formCardRef} style={{ background: "#ffffff", border: "1px solid #e3e7ef", borderRadius: 14, padding: 16, marginBottom: 16 }}>
        <h2 style={{ margin: 0, color: "#1f2c6f", fontSize: 18 }}>{editingId ? "Edit Subject" : "Add Subject"}</h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 10, marginTop: 12 }}>
          <Field label="Subject Name">
            <input
              type="text"
              value={formState.subjectName}
              onChange={(event) => handleFormField("subjectName", event.target.value)}
              style={inputStyle()}
            />
          </Field>

          <Field label="Subject Code">
            <input
              type="text"
              value={formState.subjectCode}
              onChange={(event) => handleFormField("subjectCode", event.target.value.toUpperCase())}
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
            <Field label="Grade Coverage (JHS)">
              <input type="text" value="Grade 7 to 10 (shared)" readOnly style={{ ...inputStyle(), background: "#f5f7ff", color: "#4d5a84" }} />
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

          <Field label="Hours per Week">
            <input
              type="number"
              min={1}
              max={20}
              step="0.25"
              value={formState.hoursPerWeek}
              onChange={(event) => handleFormField("hoursPerWeek", event.target.value)}
              style={inputStyle()}
            />
          </Field>

          <Field label="Semester (SHS)">
            <select
              value={formState.semester}
              onChange={(event) => handleFormField("semester", event.target.value)}
              style={selectStyle()}
              disabled={formState.schoolLevel !== "shs"}
            >
              <option value="">Select Semester</option>
              {SHS_SEMESTERS.map((semester) => (
                <option key={semester} value={semester}>
                  {semester}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Strand (SHS)">
            <select
              value={formState.strand}
              onChange={(event) => handleFormField("strand", event.target.value)}
              style={selectStyle()}
              disabled={formState.schoolLevel !== "shs" || formState.subjectType === "Core"}
            >
              <option value="">{formState.subjectType === "Core" ? "All Strands (Core)" : "Select Strand"}</option>
              {SHS_STRANDS.map((strand) => (
                <option key={strand} value={strand}>
                  {strand}
                </option>
              ))}
            </select>
          </Field>
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
          Accepted headers: Subject Name, Subject Code, School Level, Subject Type, Hours per Week, and for SHS: Grade Level, Semester, Strand.
        </p>

        <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <input type="file" accept=".xlsx,.xls,.csv" onChange={handleImportFileChange} style={{ ...inputStyle(), paddingTop: 7, height: 38 }} />
          <button type="button" onClick={handleImportValidRows} style={primaryActionStyle()} disabled={!importPreviewRows.length || isParsingImport}>
            Import Valid Rows
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
                <div key={`${row.subjectCode}-${row.schoolLevel}-${index}`} style={{ display: "grid", gridTemplateColumns: "1.4fr 0.8fr 0.8fr 1fr 1fr", gap: 8, alignItems: "center", border: "1px solid #e5eaf4", background: "#fff", borderRadius: 8, padding: "7px 8px" }}>
                  <span style={{ color: "#27356f", fontSize: 12, fontWeight: 700 }}>{row.subjectName}</span>
                  <span style={pillStyle()}>{row.subjectCode}</span>
                  <span style={pillStyle()}>{row.schoolLevel === "shs" ? `Grade ${row.gradeLevel}` : "Grade 7-10"}</span>
                  <span style={pillStyle(row.subjectType !== "Core")}>{row.subjectType}</span>
                  <span style={pillStyle()}>{`${formatHoursPerWeek(row.hoursPerWeek)} hrs/wk`}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <SubjectsLevelPanel
        title="Junior High School Subjects"
        subtitle="Grouped by grade level with shared subject offerings."
        subjects={jhsSubjects}
        editingId={editingId}
        onEdit={handleEditSubject}
        onDelete={handleDeleteSubject}
      />

      <SubjectsLevelPanel
        title="Senior High School Subjects"
        subtitle="Grouped by semester context and grade level."
        subjects={shsSubjects}
        editingId={editingId}
        onEdit={handleEditSubject}
        onDelete={handleDeleteSubject}
      />
    </>
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
        gridTemplateColumns: isShs ? "1.2fr 0.8fr 0.8fr 0.9fr 0.7fr 1.3fr auto" : "1.4fr 0.9fr 0.9fr 0.8fr auto",
        alignItems: "center",
        gap: 8,
      }}
    >
      <div>
        <p style={{ margin: 0, color: "#25336f", fontSize: 13, fontWeight: 700 }}>{subject.subjectName}</p>
        <p style={{ margin: "2px 0 0", color: "#5d698f", fontSize: 11 }}>{subject.subjectCode}</p>
      </div>

      {isShs ? <span style={pillStyle()}>{`Grade ${subject.gradeLevel}`}</span> : null}
      <span style={pillStyle(subject.subjectType !== "Core")}>{subject.subjectType}</span>
      <span style={pillStyle()}>{`${formatHoursPerWeek(subject.hoursPerWeek)} hrs/wk`}</span>

      <span style={pillStyle()}>{subject.schoolLevel.toUpperCase()}</span>

      {isShs ? <span style={pillStyle()}>{`${subject.semester} • ${subject.subjectType === "Core" ? "All Strands" : subject.strand}`}</span> : null}

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
      ? "Junior High Subject Type must be Core or Specialized."
      : "Senior High Subject Type must be Core or Applied.";
  }

  const hours = Number.parseFloat(formState.hoursPerWeek);
  if (Number.isNaN(hours) || hours <= 0) {
    return "Hours per Week is required and must be greater than 0.";
  }

  if (formState.schoolLevel === "shs") {
    if (!formState.gradeLevel) {
      return "Grade Level is required for Senior High subjects.";
    }

    if (!formState.semester) {
      return "Semester is required for Senior High subjects.";
    }

    if (formState.subjectType === "Applied" && !formState.strand) {
      return "Strand is required for Applied Senior High subjects.";
    }
  }

  return "";
}

function normalizeSubject(formState, editingId) {
  const now = new Date().toISOString();

  return {
    id: editingId || createSubjectId(),
    subjectName: formState.subjectName.trim(),
    subjectCode: formState.subjectCode.trim().toUpperCase(),
    schoolLevel: formState.schoolLevel,
    gradeLevel: formState.schoolLevel === "shs" ? Number.parseInt(formState.gradeLevel, 10) : JHS_GRADE_BAND,
    subjectType: normalizeSubjectTypeByLevel(formState.subjectType, formState.schoolLevel),
    hoursPerWeek: normalizeHoursPerWeek(formState.hoursPerWeek),
    semester: formState.schoolLevel === "shs" ? formState.semester : "",
    strand: formState.schoolLevel === "shs" && formState.subjectType === "Applied" ? formState.strand : "",
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
    if (normalized === "applied" || normalized === "specialized") {
      return "Applied";
    }

    return "Core";
  }

  if (normalized === "specialized") {
    return "Specialized";
  }

  return "Core";
}

function normalizeHoursPerWeek(value) {
  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? 0 : Math.round(parsed * 100) / 100;
}

function formatHoursPerWeek(value) {
  const parsed = Number.parseFloat(value);
  if (Number.isNaN(parsed)) {
    return "0";
  }

  return parsed % 1 === 0 ? String(parsed) : String(parsed).replace(/(\.\d*?[1-9])0+$/u, "$1");
}

function createSubjectId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createContextKey(subject) {
  const schoolLevel = String(subject.schoolLevel || "").toLowerCase();
  const gradeLevel = schoolLevel === "shs" ? String(subject.gradeLevel || "") : JHS_GRADE_BAND;
  const semester = schoolLevel === "shs" ? String(subject.semester || "").toLowerCase() : "";
  const subjectType = String(subject.subjectType || "").toLowerCase();
  const strand = schoolLevel === "shs" && subjectType === "applied" ? String(subject.strand || "").toLowerCase() : "all";

  return [
    String(subject.subjectCode || "").trim().toLowerCase(),
    schoolLevel,
    gradeLevel,
    semester,
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
  const hoursPerWeek = pickValue(normalizedRow, ["hoursperweek", "hours", "hoursweekly", "hrsperweek"]);
  const gradeLevelRaw = pickValue(normalizedRow, ["gradelevel", "grade"]);
  const semester = normalizeSemester(pickValue(normalizedRow, ["semester", "term"]));
  const strand = normalizeStrand(pickValue(normalizedRow, ["strand"]));

  if (!subjectName && !subjectCode && !schoolLevel && !subjectType && !hoursPerWeek) {
    return null;
  }

  return {
    subjectName,
    subjectCode,
    schoolLevel,
    gradeLevel: schoolLevel === "shs" ? normalizeShsGrade(gradeLevelRaw) : JHS_GRADE_BAND,
    subjectType,
    hoursPerWeek,
    semester: schoolLevel === "shs" ? semester : "",
    strand: schoolLevel === "shs" && subjectType === "Applied" ? strand : "",
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
    if (normalized === "applied" || normalized === "specialized") {
      return "Applied";
    }

    if (normalized === "core") {
      return "Core";
    }

    return "";
  }

  if (normalized === "specialized") {
    return "Specialized";
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

function normalizeStrand(value) {
  const normalized = String(value || "").trim().toUpperCase();
  if (!normalized) {
    return "";
  }

  const match = SHS_STRANDS.find((strand) => strand.toUpperCase() === normalized);
  return match || "";
}

function normalizeShsGrade(value) {
  const parsed = Number.parseInt(String(value || "").trim(), 10);
  if (parsed === 11 || parsed === 12) {
    return String(parsed);
  }

  return "";
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

    return parsed.map((subject) => {
      const schoolLevel = subject.schoolLevel === "shs" ? "shs" : "jhs";
      const normalizedType = normalizeSubjectTypeByLevel(subject.subjectType, schoolLevel);

      if (schoolLevel === "jhs") {
        return {
          ...subject,
          schoolLevel,
          subjectType: normalizedType,
          gradeLevel: JHS_GRADE_BAND,
          semester: "",
          strand: "",
        };
      }

      return {
        ...subject,
        schoolLevel,
        subjectType: normalizedType,
        strand: normalizedType === "Applied" ? subject.strand || "" : "",
      };
    });
  } catch {
    return [];
  }
}
