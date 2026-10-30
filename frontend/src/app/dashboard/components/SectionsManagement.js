import { useEffect, useRef, useState } from "react";

const JUNIOR_HIGH_GRADES = [7, 8, 9, 10];
const SENIOR_HIGH_GRADES = [11, 12];
const GRADES_IN_ORDER = [...JUNIOR_HIGH_GRADES, ...SENIOR_HIGH_GRADES];

const JHS_PROGRAM_OPTIONS = [
  { value: "Regular", label: "Regular Curriculum" },
  { value: "SP-STEM", label: "SP-STEM (Special Program in STEM)" },
  { value: "SPA", label: "SPA (Special Program in Arts)" },
  { value: "SPJ", label: "SPJ (Special Program in Journalism)" },
];

const SHS_TRACK_OPTIONS = [
  { value: "Academic", label: "Academic Track" },
  { value: "TechPro", label: "TechPro Track (TVL)" },
];

const SHS_CLUSTER_OPTIONS = [
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

const DEFAULT_NAMING_SCHEMES = {
  Gems: ["Diamond", "Emerald", "Ruby", "Sapphire", "Topaz", "Amethyst", "Opal", "Jade", "Pearl", "Garnet", "Onyx", "Quartz", "Amber", "Beryl", "Tourmaline"],
  Trees: ["Narra", "Molave", "Mahogany", "Acacia", "Yakal", "Bamboo", "Kamagong", "Talisay", "Banaba", "Agoho", "Ipil", "Santol", "Balete", "Dao", "Mango"],
  Flowers: ["Sampaguita", "Gumamela", "Rosal", "Orchid", "Dahlia", "Sunflower", "Ilang-Ilang", "Bougainvillea", "Everlasting", "Camia", "Jasmine", "Santan", "Daisy", "Lilac"],
  Values: ["Integrity", "Respect", "Excellence", "Discipline", "Compassion", "Honesty", "Courage", "Service", "Perseverance", "Unity", "Humility", "Patience", "Kindness", "Gratitude", "Responsibility"],
  "Philippine Heroes": ["Rizal", "Bonifacio", "Mabini", "Quezon", "Luna", "Del Pilar", "Jacinto", "Aguinaldo", "Recto", "Laurel", "Silang", "TandangSora"],
  Scientists: ["Newton", "Einstein", "Darwin", "Curie", "Galileo", "Faraday", "Pascal", "Kepler", "Hawking", "Tesla", "Ampere", "Boyle", "Maxwell", "Ohm", "Bohr"],
  Constellations: ["Orion", "Lyra", "Aquila", "Draco", "Hydra", "Phoenix", "Perseus", "Cassiopeia", "Pegasus", "Cygnus", "Taurus", "Scorpius"],
  Planets: ["Mercury", "Venus", "Earth", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune"],
  Mountains: ["Apo", "Pulag", "Banahaw", "Mayon", "Arayat", "Kitanglad", "Makiling", "Kanlaon", "Pinatubo", "Matutum"],
  Rivers: ["Agos", "Ilog", "Batis", "Marikina", "Cagayan", "Pasig", "Pampanga", "Agusan", "Abra", "Bicol"],
  Birds: ["Agila", "Maya", "Kalaw", "Sarimanok", "Kingfisher", "Heron", "Egret", "Parrot", "Falcon", "Swift"],
  Colors: ["Azure", "Crimson", "Violet", "Indigo", "Cobalt", "Teal", "Coral", "Amber", "Scarlet", "Lilac"],
};

const NAMING_SCHEMES_STORAGE_KEY = "turotugma_naming_schemes";

function getStoredNamingSchemes() {
  if (typeof window === "undefined") return DEFAULT_NAMING_SCHEMES;
  try {
    const raw = window.localStorage.getItem(NAMING_SCHEMES_STORAGE_KEY);
    if (!raw) return DEFAULT_NAMING_SCHEMES;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && Object.keys(parsed).length > 0) {
      return parsed;
    }
    return DEFAULT_NAMING_SCHEMES;
  } catch {
    return DEFAULT_NAMING_SCHEMES;
  }
}

export default function SectionsManagement() {
  const offeredLevels = getOfferedLevels();
  const initialCreatedSections = getInitialCreatedSections();
  const [namingSchemes, setNamingSchemes] = useState(() => getStoredNamingSchemes());
  const [schemeModalOpen, setSchemeModalOpen] = useState(false);

  const [jhsConfig, setJhsConfig] = useState(() =>
    initialCreatedSections?.jhs || createInitialLevelConfig(JUNIOR_HIGH_GRADES, "jhs", namingSchemes)
  );
  const [shsConfig, setShsConfig] = useState(() =>
    initialCreatedSections?.shs || createInitialLevelConfig(SENIOR_HIGH_GRADES, "shs", namingSchemes)
  );

  const [saveNotice, setSaveNotice] = useState("");
  const [saveNoticeType, setSaveNoticeType] = useState("success");
  const noticeTimerRef = useRef(null);
  const [createdSections, setCreatedSections] = useState(initialCreatedSections);
  const [isEditMode, setIsEditMode] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ open: false, title: "", message: "", confirmLabel: "Confirm", onConfirm: null, onCancel: null });

  const showSectionCreation = !createdSections || isEditMode;

  const showNotice = (message, type = "success") => {
    if (noticeTimerRef.current) {
      window.clearTimeout(noticeTimerRef.current);
    }

    setSaveNotice(message);
    setSaveNoticeType(type);

    noticeTimerRef.current = window.setTimeout(() => {
      setSaveNotice("");
    }, 2800);
  };

  const handleSaveNamingSchemes = (updatedSchemes) => {
    setNamingSchemes(updatedSchemes);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(NAMING_SCHEMES_STORAGE_KEY, JSON.stringify(updatedSchemes));
    }
    showNotice("Naming schemes updated successfully.", "success");
  };

  const handleResetNamingSchemes = () => {
    setNamingSchemes(DEFAULT_NAMING_SCHEMES);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(NAMING_SCHEMES_STORAGE_KEY, JSON.stringify(DEFAULT_NAMING_SCHEMES));
    }
    showNotice("Naming schemes reset to defaults.", "info");
  };

  const handleCreateSections = () => {
    const totalSections = [...Object.values(jhsConfig), ...Object.values(shsConfig)].reduce(
      (total, gradeConfig) => total + (gradeConfig?.sections?.length || 0),
      0
    );

    if (totalSections === 0) {
      showNotice("No sections configured yet. Please enter total sections for at least one grade.", "error");
      return;
    }

    const payload = {
      jhs: jhsConfig,
      shs: shsConfig,
      createdAt: new Date().toISOString(),
    };

    if (isEditMode && createdSections) {
      const previous = JSON.stringify({ jhs: createdSections.jhs, shs: createdSections.shs });
      const next = JSON.stringify({ jhs: payload.jhs, shs: payload.shs });

      if (previous === next) {
        showNotice("No changes to save.", "error");
        return;
      }
    }

    window.localStorage.setItem("turotugma_sections_created", JSON.stringify(payload));
    setCreatedSections(payload);
    setIsEditMode(false);
    showNotice(isEditMode ? "Sections updated successfully." : "Sections created successfully.", "success");
  };

  const handleClearAllSections = () => {
    setConfirmModal({
      open: true,
      title: "Clear All Sections",
      message: "Are you sure you want to clear ALL created sections? This cannot be undone.",
      confirmLabel: "Clear All",
      onConfirm: () => {
        window.localStorage.removeItem("turotugma_sections_created");
        setCreatedSections(null);
        setJhsConfig(createInitialLevelConfig(JUNIOR_HIGH_GRADES, "jhs", namingSchemes));
        setShsConfig(createInitialLevelConfig(SENIOR_HIGH_GRADES, "shs", namingSchemes));
        setIsEditMode(false);
        showNotice("All sections cleared.", "success");
        setConfirmModal({ open: false });
      },
      onCancel: () => setConfirmModal({ open: false }),
    });
  };

  const handleEditSections = () => {
    if (!createdSections) {
      return;
    }

    setJhsConfig(createdSections.jhs);
    setShsConfig(createdSections.shs);
    setIsEditMode(true);
    showNotice("Edit mode enabled. You can adjust section counts, schemes, or manually edit names.", "info");
  };

  const handleCancelEdit = () => {
    if (!createdSections) {
      return;
    }

    setJhsConfig(createdSections.jhs);
    setShsConfig(createdSections.shs);
    setIsEditMode(false);
    showNotice("Edit cancelled.", "success");
  };

  const handleThemeChange = (level, grade, theme) => {
    const setter = level === "jhs" ? setJhsConfig : setShsConfig;

    setter((prev) => {
      const current = prev[grade] || { theme, count: 0, sections: [] };

      return {
        ...prev,
        [grade]: {
          ...current,
          theme,
          sections: buildSections(level, grade, theme, current.count, current.sections, false, namingSchemes, true),
        },
      };
    });
  };

  const handleCountChange = (level, grade, value) => {
    const setter = level === "jhs" ? setJhsConfig : setShsConfig;
    const parsed = Number.parseInt(value || "0", 10);

    if (parsed > 20) {
      showNotice(`Maximum limit reached: Grade ${grade} cannot exceed 20 sections.`, "warning");
    } else if (parsed < 0) {
      showNotice(`Section count cannot be negative for Grade ${grade}.`, "warning");
    }

    const count = Number.isNaN(parsed) ? 0 : Math.max(0, Math.min(parsed, 20));

    setter((prev) => {
      const current = prev[grade] || { theme: Object.keys(namingSchemes)[0] || "Gems", count: 0, sections: [] };

      return {
        ...prev,
        [grade]: {
          ...current,
          count,
          sections: buildSections(level, grade, current.theme, count, current.sections, true, namingSchemes),
        },
      };
    });
  };

  const handleSectionNameChange = (level, grade, index, value) => {
    const setter = level === "jhs" ? setJhsConfig : setShsConfig;

    setter((prev) => {
      const current = prev[grade];
      if (!current) return prev;
      const sections = current.sections.map((section, sectionIndex) =>
        sectionIndex === index ? { ...section, name: value } : section
      );

      return {
        ...prev,
        [grade]: {
          ...current,
          sections,
        },
      };
    });
  };

  const handleSectionMetaChange = (level, grade, index, field, value) => {
    const setter = level === "jhs" ? setJhsConfig : setShsConfig;

    setter((prev) => {
      const current = prev[grade];
      if (!current) return prev;
      const sections = current.sections.map((section, sectionIndex) => {
        if (sectionIndex !== index) {
          return section;
        }

        return { ...section, [field]: value };
      });

      return {
        ...prev,
        [grade]: {
          ...current,
          sections,
        },
      };
    });
  };

  return (
    <>
      <div style={{ marginBottom: 18, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
        <div>
          <h1 style={{ margin: 0, color: "#1f2c6f", fontSize: 30 }}>Sections</h1>
          <p style={{ margin: "8px 0 0", color: "#5b6787", fontSize: 14 }}>
            Configure grade-level section counts, automated naming schemes, JHS Special Programs, and SHS tracks & elective clusters.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              type="button"
              onClick={() => setSchemeModalOpen(true)}
              style={secondaryActionStyle()}
              title="Configure automated section naming vocabulary and schemes"
            >
              Naming Schemes
            </button>

            {showSectionCreation ? (
              <>
                {isEditMode ? (
                  <button type="button" onClick={handleCancelEdit} style={secondaryActionStyle()}>
                    Cancel
                  </button>
                ) : null}

                <button type="button" onClick={handleCreateSections} style={primaryActionStyle()}>
                  {isEditMode ? "Save Changes" : "Create Sections"}
                </button>
                <button type="button" onClick={handleClearAllSections} style={dangerActionStyle()}>
                  Clear Sections
                </button>
              </>
            ) : (
              <>
                <button type="button" onClick={handleEditSections} style={primaryActionStyle()}>
                  Edit Sections
                </button>
                <button type="button" onClick={handleClearAllSections} style={dangerActionStyle()}>
                  Clear Sections
                </button>
              </>
            )}
          </div>

          {saveNotice ? (
            <div
              role="status"
              aria-live="polite"
              style={{
                position: "fixed",
                top: 24,
                right: 24,
                zIndex: 100000,
                background: saveNoticeType === "error" ? "#dc2626" : saveNoticeType === "info" ? "#2563eb" : saveNoticeType === "warning" ? "#d97706" : "#16a34a",
                color: "#ffffff",
                borderRadius: 10,
                padding: "12px 18px",
                fontSize: 13,
                fontWeight: 700,
                boxShadow: "0 10px 30px rgba(15, 23, 42, 0.25)",
                maxWidth: 420,
                display: "flex",
                alignItems: "center",
                gap: 8,
                pointerEvents: "none",
              }}
            >
              <span>{saveNoticeType === "error" ? "!" : saveNoticeType === "info" ? "i" : saveNoticeType === "warning" ? "!" : "✓"}</span>
              <span>{saveNotice}</span>
            </div>
          ) : null}
        </div>
      </div>

      {showSectionCreation ? (
        <>
          {offeredLevels !== "shs_only" ? (
            <SectionsContainer
              title="Junior High School (Grade 7-10)"
              subtitle="Set section counts per grade level. Special Programs (SPA, SPJ, SP-STEM) are automatically allocated first, and subsequent sections default to Regular Curriculum."
              level="jhs"
              grades={JUNIOR_HIGH_GRADES}
              config={jhsConfig}
              schemeLibrary={namingSchemes}
              onThemeChange={handleThemeChange}
              onCountChange={handleCountChange}
              onSectionNameChange={handleSectionNameChange}
              onSectionMetaChange={handleSectionMetaChange}
            />
          ) : null}

          {offeredLevels !== "jhs_only" ? (
            <SectionsContainer
              title="Senior High School (Grade 11-12)"
              subtitle="Set section counts per grade level. DepEd Tracks & Elective Clusters (STEM, HUMSS, ABM, TechPro ICT) are automatically distributed across sections."
              level="shs"
              grades={SENIOR_HIGH_GRADES}
              config={shsConfig}
              schemeLibrary={namingSchemes}
              onThemeChange={handleThemeChange}
              onCountChange={handleCountChange}
              onSectionNameChange={handleSectionNameChange}
              onSectionMetaChange={handleSectionMetaChange}
            />
          ) : null}
        </>
      ) : (
        <CreatedSectionsView createdSections={createdSections} offeredLevels={offeredLevels} />
      )}

      <SchemeConfigModal
        open={schemeModalOpen}
        onClose={() => setSchemeModalOpen(false)}
        schemes={namingSchemes}
        onSaveSchemes={handleSaveNamingSchemes}
        onResetSchemes={handleResetNamingSchemes}
      />

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

function SchemeConfigModal({ open, onClose, schemes, onSaveSchemes, onResetSchemes }) {
  const schemeNames = Object.keys(schemes);
  const [selectedScheme, setSelectedScheme] = useState(() => schemeNames[0] || "Gems");
  const [editedWords, setEditedWords] = useState("");
  const [newSchemeName, setNewSchemeName] = useState("");
  const [newSchemeWords, setNewSchemeWords] = useState("");
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [modalNotice, setModalNotice] = useState("");

  useEffect(() => {
    if (schemes[selectedScheme]) {
      setEditedWords(schemes[selectedScheme].join(", "));
    } else if (schemeNames.length > 0) {
      setSelectedScheme(schemeNames[0]);
      setEditedWords(schemes[schemeNames[0]].join(", "));
    }
  }, [selectedScheme, schemes]);

  if (!open) return null;

  const showModalMsg = (msg) => {
    setModalNotice(msg);
    setTimeout(() => setModalNotice(""), 2600);
  };

  const handleSelectScheme = (name) => {
    setSelectedScheme(name);
    setIsAddingNew(false);
    if (schemes[name]) {
      setEditedWords(schemes[name].join(", "));
    }
  };

  const handleSaveActiveScheme = () => {
    const wordsList = editedWords
      .split(/[,;\n]+/)
      .map((w) => w.trim())
      .filter(Boolean);

    if (wordsList.length === 0) {
      showModalMsg("Please provide at least one vocabulary word.");
      return;
    }

    const updated = {
      ...schemes,
      [selectedScheme]: wordsList,
    };
    onSaveSchemes(updated);
    showModalMsg(`Saved "${selectedScheme}" with ${wordsList.length} vocabulary words.`);
  };

  const handleAddNewScheme = (e) => {
    e.preventDefault();
    const trimmed = newSchemeName.trim();
    if (!trimmed) {
      showModalMsg("Scheme name cannot be empty.");
      return;
    }
    const wordsList = newSchemeWords
      .split(/[,;\n]+/)
      .map((w) => w.trim())
      .filter(Boolean);

    if (wordsList.length === 0) {
      showModalMsg("Please provide at least one vocabulary word.");
      return;
    }

    const updated = {
      ...schemes,
      [trimmed]: wordsList,
    };
    onSaveSchemes(updated);
    setSelectedScheme(trimmed);
    setIsAddingNew(false);
    setNewSchemeName("");
    setNewSchemeWords("");
    showModalMsg(`Created new scheme "${trimmed}".`);
  };

  const handleDeleteScheme = (name) => {
    if (Object.keys(schemes).length <= 1) {
      showModalMsg("Cannot delete the only remaining scheme.");
      return;
    }
    const updated = { ...schemes };
    delete updated[name];
    onSaveSchemes(updated);
    const nextKey = Object.keys(updated)[0];
    setSelectedScheme(nextKey);
    showModalMsg(`Scheme "${name}" deleted.`);
  };

  const activeWordsList = editedWords
    .split(/[,;\n]+/)
    .map((w) => w.trim())
    .filter(Boolean);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 99999 }}>
      <div style={{ background: "#ffffff", borderRadius: 16, width: 760, maxWidth: "94%", maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 25px 50px -12px rgba(15,23,42,0.25)", border: "1px solid #cbd5e1" }}>
        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ margin: 0, color: "#1f2c6f", fontSize: 20, fontWeight: 700 }}>Automated Section Naming Schemes</h2>
            <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 13 }}>
              Configure predefined naming schemes and vocabulary. Sections follow the pattern: <strong>Grade [grade] - [VocabularyWord]</strong>.
            </p>
          </div>
          <button type="button" onClick={onClose} style={{ background: "transparent", border: "none", fontSize: 20, color: "#64748b", cursor: "pointer", padding: 4 }}>
            ✕
          </button>
        </div>

        {/* Notice toast inside modal */}
        {modalNotice && (
          <div style={{ background: "#e0f2fe", color: "#0369a1", padding: "8px 24px", fontSize: 13, fontWeight: 600, borderBottom: "1px solid #bae6fd" }}>
            {modalNotice}
          </div>
        )}

        {/* Content Body */}
        <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", flex: 1, minHeight: 340, overflow: "hidden" }}>
          {/* Left Schemes Sidebar */}
          <div style={{ borderRight: "1px solid #e2e8f0", background: "#f8fafc", padding: 14, overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Schemes ({schemeNames.length})</span>
              <button
                type="button"
                onClick={() => setIsAddingNew(true)}
                style={{
                  background: isAddingNew ? "#3b4197" : "#eef2ff",
                  color: isAddingNew ? "#ffffff" : "#3b4197",
                  border: "1px solid #c7d2fe",
                  borderRadius: 6,
                  padding: "3px 8px",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                + New
              </button>
            </div>

            <div style={{ display: "grid", gap: 4 }}>
              {schemeNames.map((name) => {
                const count = schemes[name]?.length || 0;
                const isSelected = !isAddingNew && selectedScheme === name;
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => handleSelectScheme(name)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 10px",
                      borderRadius: 8,
                      border: isSelected ? "1px solid #3b4197" : "1px solid transparent",
                      background: isSelected ? "#eef2ff" : "transparent",
                      color: isSelected ? "#1f2c6f" : "#334155",
                      fontWeight: isSelected ? 700 : 500,
                      fontSize: 13,
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
                    <span style={{ fontSize: 11, color: isSelected ? "#3b4197" : "#94a3b8", fontWeight: 600 }}>{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Editor Panel */}
          <div style={{ padding: 20, overflowY: "auto" }}>
            {isAddingNew ? (
              <form onSubmit={handleAddNewScheme}>
                <h3 style={{ margin: "0 0 14px", color: "#1f2c6f", fontSize: 16 }}>Create New Naming Scheme</h3>
                <div style={{ marginBottom: 14 }}>
                  <label htmlFor="new-scheme-name-input" style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                    Scheme Name
                  </label>
                  <input
                    id="new-scheme-name-input"
                    type="text"
                    value={newSchemeName}
                    onChange={(e) => setNewSchemeName(e.target.value)}
                    placeholder="e.g. Core Values, Local Heroes, Virtues"
                    style={inputStyle()}
                    required
                  />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label htmlFor="new-scheme-words-input" style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                    Vocabulary Words (separated by commas or new lines)
                  </label>
                  <textarea
                    id="new-scheme-words-input"
                    rows={6}
                    value={newSchemeWords}
                    onChange={(e) => setNewSchemeWords(e.target.value)}
                    placeholder="e.g. Maka-Diyos, Makatao, Makakalikasan, Makabansa"
                    style={{ ...inputStyle(), height: "auto", padding: "10px", lineHeight: 1.5, resize: "vertical" }}
                    required
                  />
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button type="submit" style={primaryActionStyle()}>
                    Add Scheme
                  </button>
                  <button type="button" onClick={() => setIsAddingNew(false)} style={secondaryActionStyle()}>
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div>
                    <h3 style={{ margin: 0, color: "#1f2c6f", fontSize: 17, fontWeight: 700 }}>{selectedScheme}</h3>
                    <p style={{ margin: "3px 0 0", color: "#64748b", fontSize: 12 }}>
                      {activeWordsList.length} vocabulary words configured
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteScheme(selectedScheme)}
                    style={{
                      background: "#fee2e2",
                      border: "1px solid #fecaca",
                      color: "#dc2626",
                      borderRadius: 8,
                      padding: "6px 12px",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Delete Scheme
                  </button>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label htmlFor="edit-vocabulary-words-input" style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                    Vocabulary Words (separated by commas or new lines)
                  </label>
                  <textarea
                    id="edit-vocabulary-words-input"
                    rows={6}
                    value={editedWords}
                    onChange={(e) => setEditedWords(e.target.value)}
                    placeholder="Enter words separated by commas..."
                    style={{ ...inputStyle(), height: "auto", padding: "10px", lineHeight: 1.5, resize: "vertical" }}
                  />
                </div>

                {/* Live Section Name Preview */}
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: 12, marginBottom: 16 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>Generated Section Name Preview</span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                    {activeWordsList.slice(0, 6).map((word, idx) => (
                      <span
                        key={idx}
                        style={{
                          background: "#ffffff",
                          border: "1px solid #cbd5e1",
                          borderRadius: 6,
                          padding: "4px 8px",
                          fontSize: 12,
                          color: "#1e293b",
                          fontWeight: 600,
                        }}
                      >
                        Grade 7 - {word}
                      </span>
                    ))}
                    {activeWordsList.length > 6 && (
                      <span style={{ fontSize: 12, color: "#64748b", alignSelf: "center" }}>
                        +{activeWordsList.length - 6} more
                      </span>
                    )}
                  </div>
                </div>

                <button type="button" onClick={handleSaveActiveScheme} style={primaryActionStyle()}>
                  Save Scheme Words
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "14px 24px", borderTop: "1px solid #e2e8f0", background: "#f8fafc", display: "flex", justifyContent: "space-between", alignItems: "center", borderRadius: "0 0 16px 16px" }}>
          <button
            type="button"
            onClick={onResetSchemes}
            style={{
              background: "transparent",
              border: "1px solid #cbd5e1",
              borderRadius: 8,
              padding: "7px 12px",
              color: "#64748b",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            ↺ Restore Default Presets
          </button>
          <button type="button" onClick={onClose} style={secondaryActionStyle()}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function CreatedSectionsView({ createdSections, offeredLevels = "both" }) {
  return (
    <>
      {offeredLevels !== "shs_only" ? (
        <CreatedLevelBlock title="Junior High School (Grade 7-10)" level="jhs" grades={JUNIOR_HIGH_GRADES} config={createdSections?.jhs || {}} />
      ) : null}
      {offeredLevels !== "jhs_only" ? (
        <CreatedLevelBlock title="Senior High School (Grade 11-12)" level="shs" grades={SENIOR_HIGH_GRADES} config={createdSections?.shs || {}} />
      ) : null}
    </>
  );
}

function renderSectionBadge(level, section) {
  if (level === "jhs") {
    let cls = section.classification || "Regular";
    if (cls === "Special" || cls === "STE") cls = "SP-STEM";

    let badgeStyle = { bg: "#f1f5f9", border: "#cbd5e1", color: "#475569" };

    if (cls === "SP-STEM") {
      badgeStyle = { bg: "#e0f2fe", border: "#38bdf8", color: "#0369a1" };
    } else if (cls === "SPA") {
      badgeStyle = { bg: "#f3e8ff", border: "#c084fc", color: "#7e22ce" };
    } else if (cls === "SPJ") {
      badgeStyle = { bg: "#fff7ed", border: "#fb923c", color: "#c2410c" };
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
        }}
      >
        {cls === "SP-STEM" ? "SP-STEM" : cls === "SPA" ? "SPA (Arts)" : cls === "SPJ" ? "SPJ (Journalism)" : "Regular"}
      </span>
    );
  }

  const track = section.track || "Academic";
  const cluster = section.cluster || section.strand || "";

  let clusterStyle = { bg: "#f1f5f9", border: "#cbd5e1", color: "#475569" };
  const lowerCluster = cluster.toLowerCase();
  if (lowerCluster.includes("stem")) {
    clusterStyle = { bg: "#ecfeff", border: "#67e8f9", color: "#0e7490" };
  } else if (lowerCluster.includes("abm") || lowerCluster.includes("business")) {
    clusterStyle = { bg: "#ecfdf5", border: "#6ee7b7", color: "#047857" };
  } else if (lowerCluster.includes("humss") || lowerCluster.includes("social")) {
    clusterStyle = { bg: "#fff1f2", border: "#fda4af", color: "#be123c" };
  } else if (lowerCluster.includes("ict") || lowerCluster.includes("industrial") || lowerCluster.includes("tech") || track === "TechPro") {
    clusterStyle = { bg: "#f5f3ff", border: "#c4b5fd", color: "#6d28d9" };
  }

  return (
    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
      <span
        style={{
          color: track === "TechPro" ? "#7c2d12" : "#1e40af",
          fontSize: 11,
          fontWeight: 700,
          whiteSpace: "nowrap",
          background: track === "TechPro" ? "#ffedd5" : "#dbeafe",
          borderRadius: 999,
          border: track === "TechPro" ? "1px solid #fed7aa" : "1px solid #bfdbfe",
          padding: "3px 8px",
        }}
      >
        {track}
      </span>
      {cluster ? (
        <span
          style={{
            color: clusterStyle.color,
            fontSize: 11,
            fontWeight: 600,
            whiteSpace: "nowrap",
            background: clusterStyle.bg,
            borderRadius: 999,
            border: `1px solid ${clusterStyle.border}`,
            padding: "3px 8px",
          }}
        >
          {cluster.split(" (")[0]}
        </span>
      ) : null}
    </div>
  );
}

function CreatedLevelBlock({ title, level, grades, config }) {
  return (
    <div style={{ background: "#ffffff", border: "1px solid #e3e7ef", borderRadius: 14, padding: 16, marginBottom: 16 }}>
      <h2 style={{ margin: 0, color: "#1f2c6f", fontSize: 18 }}>{title}</h2>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${grades.length}, minmax(0, 1fr))`, gap: 10, marginTop: 12 }}>
        {grades.map((grade) => {
          const gradeConfig = config[grade];
          const sections = gradeConfig?.sections || [];

          return (
            <div key={`${level}-${grade}`} style={{ border: "1px solid #e3e7ef", borderRadius: 12, padding: 12, background: "#fbfcff" }}>
              <p style={{ margin: 0, color: "#20306f", fontSize: 14, fontWeight: 700 }}>Grade {grade}</p>
              <p style={{ margin: "2px 0 0", color: "#5a668a", fontSize: 12 }}>Scheme: {gradeConfig?.theme || "Custom"}</p>

              {sections.length === 0 ? (
                <p style={{ margin: "10px 0 0", color: "#8a96b6", fontSize: 12 }}>No sections created yet.</p>
              ) : (
                <div style={{ marginTop: 8, display: "grid", gap: 6 }}>
                  {sections.map((section, index) => (
                    <div
                      key={`${level}-${grade}-section-${index}`}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 8,
                        border: "1px solid #e3e7ef",
                        borderRadius: 8,
                        padding: "6px 8px",
                        background: "#ffffff",
                      }}
                    >
                      <span style={{ color: "#2a376f", fontSize: 12, fontWeight: 600 }}>{section.name}</span>
                      {renderSectionBadge(level, section)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SectionsContainer({
  title,
  subtitle,
  level,
  grades,
  config,
  schemeLibrary = {},
  onThemeChange,
  onCountChange,
  onSectionNameChange,
  onSectionMetaChange,
}) {
  const schemeNames = Object.keys(schemeLibrary);

  return (
    <div style={{ background: "#ffffff", border: "1px solid #e3e7ef", borderRadius: 14, padding: 16, marginBottom: 16 }}>
      <h2 style={{ margin: 0, color: "#1f2c6f", fontSize: 18 }}>{title}</h2>
      <p style={{ margin: "6px 0 0", color: "#5d698d", fontSize: 13 }}>{subtitle}</p>

      <div style={{ display: "grid", gap: 14, marginTop: 14 }}>
        {grades.map((grade) => {
          const gradeConfig = config[grade] || { theme: schemeNames[0] || "Gems", count: 0, sections: [] };

          return (
            <div key={grade} style={{ border: "1px solid #e3e7ef", borderRadius: 12, padding: 14, background: "#fbfcff" }}>
              {/* Header and Automated Section Naming Controls */}
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 12, paddingBottom: 10, borderBottom: "1px solid #edf2f7" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color: "#1f2c6f", fontSize: 16, fontWeight: 700 }}>Grade {grade}</span>
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 14 }}>
                  {/* Total Sections input */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <label htmlFor={`grade-${grade}-count`} style={{ color: "#475569", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>
                      Total Sections:
                    </label>
                    <input
                      id={`grade-${grade}-count`}
                      type="number"
                      min={0}
                      max={20}
                      value={gradeConfig.count}
                      onChange={(event) => onCountChange(level, grade, event.target.value)}
                      style={{
                        ...inputStyle(),
                        width: 68,
                        textAlign: "center",
                        fontWeight: 700,
                        borderColor: gradeConfig.count >= 20 ? "#f59e0b" : "#cfd7ef",
                        background: gradeConfig.count >= 20 ? "#fffbeb" : "#ffffff",
                      }}
                    />
                    {gradeConfig.count >= 20 && (
                      <span
                        title="Maximum of 20 sections allowed per grade level"
                        style={{
                          fontSize: 11,
                          color: "#b45309",
                          background: "#fef3c7",
                          border: "1px solid #fde68a",
                          padding: "2px 7px",
                          borderRadius: 6,
                          fontWeight: 700,
                          whiteSpace: "nowrap",
                        }}
                      >
                        Max limit (20)
                      </span>
                    )}
                  </div>

                  {/* Automated Naming Scheme Selector */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <label htmlFor={`grade-${grade}-theme`} style={{ color: "#475569", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>
                      Naming Scheme:
                    </label>
                    <select
                      id={`grade-${grade}-theme`}
                      value={gradeConfig.theme || schemeNames[0] || "Gems"}
                      onChange={(event) => onThemeChange(level, grade, event.target.value)}
                      style={{ ...selectStyle(), minWidth: 150 }}
                    >
                      {schemeNames.map((schemeName) => (
                        <option key={schemeName} value={schemeName}>
                          {schemeName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Section Rows */}
              {gradeConfig.sections.length > 0 ? (
                <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
                  {gradeConfig.sections.map((section, index) => {
                    const jhsClass =
                      section.classification === "Special" || section.classification === "STE"
                        ? "SP-STEM"
                        : section.classification || "Regular";

                    const isJhsSpa = jhsClass === "SPA";
                    const isJhsSpj = jhsClass === "SPJ";
                    const isJhsStem = jhsClass === "SP-STEM";

                    return (
                      <div
                        key={`${grade}-${index}`}
                        style={{
                          display: "grid",
                          gridTemplateColumns: level === "jhs" ? "36px 1fr 220px" : "36px 1fr 150px 240px",
                          gap: 10,
                          alignItems: "center",
                          background: "#ffffff",
                          padding: "8px 10px",
                          borderRadius: 8,
                          border: "1px solid #e2e8f0",
                        }}
                      >
                        <span style={indexPillStyle()}>{index + 1}</span>

                        {/* Administrator can manually edit any generated section name */}
                        <input
                          type="text"
                          value={section.name}
                          onChange={(event) => onSectionNameChange(level, grade, index, event.target.value)}
                          placeholder={`Grade ${grade} - Section Name`}
                          style={{ ...inputStyle(), fontWeight: 600 }}
                        />

                        {level === "jhs" ? (
                          <select
                            value={jhsClass}
                            onChange={(event) => onSectionMetaChange(level, grade, index, "classification", event.target.value)}
                            style={{
                              ...selectStyle(),
                              width: "100%",
                              fontWeight: 700,
                              background: isJhsSpa ? "#faf5ff" : isJhsSpj ? "#fff7ed" : isJhsStem ? "#f0f9ff" : "#ffffff",
                              borderColor: isJhsSpa ? "#c084fc" : isJhsSpj ? "#fb923c" : isJhsStem ? "#38bdf8" : "#cfd7ef",
                              color: isJhsSpa ? "#7e22ce" : isJhsSpj ? "#c2410c" : isJhsStem ? "#0369a1" : "#1f2c6f",
                            }}
                          >
                            {JHS_PROGRAM_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <>
                            <select
                              value={section.track || "Academic"}
                              onChange={(event) => onSectionMetaChange(level, grade, index, "track", event.target.value)}
                              style={{
                                ...selectStyle(),
                                width: "100%",
                                fontWeight: 700,
                                background: section.track === "TechPro" ? "#fff7ed" : "#eff6ff",
                                borderColor: section.track === "TechPro" ? "#fed7aa" : "#bfdbfe",
                                color: section.track === "TechPro" ? "#9a3412" : "#1e40af",
                              }}
                            >
                              {SHS_TRACK_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                            <select
                              value={section.cluster || SHS_CLUSTER_OPTIONS[0]}
                              onChange={(event) => onSectionMetaChange(level, grade, index, "cluster", event.target.value)}
                              style={{ ...selectStyle(), width: "100%", fontWeight: 600 }}
                            >
                              {SHS_CLUSTER_OPTIONS.map((cluster) => (
                                <option key={cluster} value={cluster}>
                                  {cluster}
                                </option>
                              ))}
                            </select>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p style={{ margin: "12px 0 0", color: "#7a86a7", fontSize: 13, fontStyle: "italic" }}>
                  Set Total Sections above to configure Grade {grade} sections.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
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

function indexPillStyle() {
  return {
    display: "inline-flex",
    width: 36,
    height: 28,
    borderRadius: 8,
    background: "#e9edff",
    color: "#2a3778",
    fontSize: 12,
    fontWeight: 700,
    alignItems: "center",
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

function createInitialLevelConfig(grades, level, schemeLibrary) {
  const initialThemes = buildInitialThemeByGrade(Object.keys(schemeLibrary));

  return grades.reduce((accumulator, grade) => {
    const theme = initialThemes[grade] || Object.keys(schemeLibrary)[0] || "Gems";

    accumulator[grade] = {
      theme,
      count: 0,
      sections: buildSections(level, grade, theme, 0, [], false, schemeLibrary),
    };

    return accumulator;
  }, {});
}

function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
  }
  return arr;
}

export function getAutomatedJhsClassification(index, totalCount) {
  if (totalCount === 1) {
    return "Regular";
  }
  if (totalCount === 2) {
    return index === 0 ? "SPA" : "Regular";
  }
  if (totalCount === 3) {
    if (index === 0) return "SPA";
    if (index === 1) return "SPJ";
    return "Regular";
  }
  // totalCount >= 4:
  // Order: SPA, SPJ, SP-STEM, and the rest Regular
  if (index === 0) return "SPA";
  if (index === 1) return "SPJ";
  if (index === 2) return "SP-STEM";
  return "Regular";
}

export const SHS_AUTOMATED_PROGRAMS_ORDER = [
  { track: "Academic", cluster: "STEM (Science, Tech, Eng, Math)" },
  { track: "Academic", cluster: "Arts, Social Sciences & Humanities (HUMSS)" },
  { track: "Academic", cluster: "Business & Entrepreneurship (ABM)" },
  { track: "TechPro", cluster: "ICT (Information & Comm Tech)" },
  { track: "TechPro", cluster: "Industrial Arts & Maritime" },
  { track: "TechPro", cluster: "Family & Consumer Science" },
  { track: "TechPro", cluster: "Agriculture & Fishery Arts" },
  { track: "Academic", cluster: "General Academic / Electives" },
];

export function getAutomatedShsTrackCluster(index, totalCount) {
  if (totalCount === 1) {
    return { track: "Academic", cluster: "General Academic / Electives" };
  }
  const preset = SHS_AUTOMATED_PROGRAMS_ORDER[index % SHS_AUTOMATED_PROGRAMS_ORDER.length];
  return {
    track: preset.track,
    cluster: preset.cluster,
  };
}

function buildSections(
  level,
  grade,
  theme,
  count,
  previousSections = [],
  keepExistingNames = true,
  schemeLibrary = DEFAULT_NAMING_SCHEMES,
  randomize = false
) {
  const size = Number.isFinite(count) ? count : 0;
  const rawWords = schemeLibrary[theme] || schemeLibrary["Gems"] || (Object.values(schemeLibrary)[0] || []);
  const words = randomize ? shuffleArray(rawWords) : [...rawWords];

  const allPreviousWereDefaultRegular =
    previousSections.length > 0 &&
    previousSections.every((s) => !s.classification || s.classification === "Regular");

  const allPreviousShsWereDefault =
    previousSections.length > 0 &&
    previousSections.every(
      (s) =>
        (!s.track || s.track === "Academic") &&
        (!s.cluster || s.cluster === "STEM (Science, Tech, Eng, Math)")
    );

  return Array.from({ length: size }, (_, index) => {
    const previous = previousSections[index];
    const rawWord = words.length > 0 ? words[index % words.length] : `Section ${index + 1}`;
    const cycle = words.length > 0 ? Math.floor(index / words.length) : 0;
    const suffix = cycle > 0 ? ` ${cycle + 1}` : "";
    const generatedName = `Grade ${grade} - ${rawWord}${suffix}`;

    let name = generatedName;
    if (keepExistingNames && previous?.name) {
      name = previous.name;
    }

    if (level === "jhs") {
      let classification = previous?.classification;
      if (classification === "Special" || classification === "STE") classification = "SP-STEM";
      if (!classification || allPreviousWereDefaultRegular) {
        classification = getAutomatedJhsClassification(index, size);
      }
      return {
        name,
        classification,
      };
    }

    const autoShs = getAutomatedShsTrackCluster(index, size);
    return {
      name,
      track: !allPreviousShsWereDefault && previous?.track ? previous.track : autoShs.track,
      cluster: !allPreviousShsWereDefault && previous?.cluster ? previous.cluster : autoShs.cluster,
    };
  });
}

function buildInitialThemeByGrade(schemeNames) {
  const names = schemeNames && schemeNames.length > 0 ? schemeNames : Object.keys(DEFAULT_NAMING_SCHEMES);
  const shuffledThemes = [...names];

  for (let index = shuffledThemes.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    const temp = shuffledThemes[index];
    shuffledThemes[index] = shuffledThemes[randomIndex];
    shuffledThemes[randomIndex] = temp;
  }

  return GRADES_IN_ORDER.reduce((accumulator, grade, gradeIndex) => {
    accumulator[grade] = shuffledThemes[gradeIndex % shuffledThemes.length];
    return accumulator;
  }, {});
}

function getInitialCreatedSections() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem("turotugma_sections_created");
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    if (!parsed?.jhs || !parsed?.shs) {
      return null;
    }

    return parsed;
  } catch {
    return null;
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
