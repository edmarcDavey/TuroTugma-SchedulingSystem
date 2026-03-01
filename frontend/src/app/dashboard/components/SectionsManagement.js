import { useRef, useState } from "react";

const JUNIOR_HIGH_GRADES = [7, 8, 9, 10];
const SENIOR_HIGH_GRADES = [11, 12];
const TRACK_OPTIONS = ["HUMSS", "STEM", "ABM", "TVL", "GAS"];
const THEME_LIBRARY = {
  Trees: ["Narra", "Molave", "Mahogany", "Acacia", "Yakal", "Bamboo", "Kamagong", "Talisay", "Banaba", "Agoho", "Ipil", "Santol", "Balete", "Dao", "Mango"],
  Flowers: ["Sampaguita", "Gumamela", "Rosal", "Orchid", "Dahlia", "Sunflower", "Ilang-Ilang", "Bougainvillea", "Everlasting", "Camia", "Jasmine", "Santan", "Rafflesia", "Daisy", "Lilac"],
  Rivers: ["Agos", "Ilog", "Batis", "Marikina", "Cagayan", "Pasig", "Pampanga", "Agusan", "Abra", "Iponan", "Jalaur", "Bicol", "Loboc", "Magat", "Pulangi"],
  Mountains: ["Apo", "Pulag", "Banahaw", "Mayon", "Arayat", "Kitanglad", "Makiling", "Isarog", "Kanlaon", "Kalatungan", "Pinatubo", "Halcon", "Matutum", "Malindang", "Talinis"],
  Birds: ["Agila", "Maya", "Kalaw", "Sarimanok", "Kingfisher", "Heron", "Egret", "Parrot", "Falcon", "Sparrow", "Nightingale", "Kite", "Swift", "Albatross", "Oriole"],
  Gems: ["Ruby", "Sapphire", "Emerald", "Topaz", "Amethyst", "Opal", "Jade", "Pearl", "Garnet", "Onyx", "Quartz", "Amber", "Diamond", "Beryl", "Tourmaline"],
  Scholars: ["Rizal", "Bonifacio", "Mabini", "Quezon", "Luna", "Del Pilar", "Jacinto", "Aguinaldo", "Recto", "Laurel", "Zobel", "Pardo", "Panganiban", "Dizon", "Avancena"],
  Scientists: ["Newton", "Einstein", "Darwin", "Curie", "Galileo", "Faraday", "Pascal", "Kepler", "Hawking", "Tesla", "Ampere", "Boyle", "Maxwell", "Ohm", "Bohr"],
  Innovators: ["Turing", "Lovelace", "Pasteur", "Edison", "Bell", "Jobs", "Wozniak", "BernersLee", "Goodall", "Morse", "Diesel", "Ford", "Marconi", "Watt", "Hopper"],
  Writers: ["Shakespeare", "Tolstoy", "Poe", "Austen", "Homer", "Dante", "Dickens", "Hugo", "Neruda", "Orwell", "Twain", "Steinbeck", "Cervantes", "Hemingway", "Tagore"],
  Values: ["Integrity", "Respect", "Excellence", "Discipline", "Compassion", "Honesty", "Courage", "Service", "Perseverance", "Unity", "Humility", "Patience", "Kindness", "Gratitude", "Responsibility"],
  Islands: ["Luzon", "Visayas", "Mindanao", "Palawan", "Panay", "Negros", "Samar", "Leyte", "Bohol", "Cebu", "Siargao", "Camiguin", "Mindoro", "Masbate", "Romblon"],
  Seas: ["Sulu", "Visayan", "Sibuyan", "Bohol", "Celebes", "Philippine", "Camotes", "Jolo", "Arafura", "Coral", "Timor", "Banda", "Java", "Flores", "Solomon"],
  Provinces: ["Ilocos", "Bataan", "Batangas", "Bulacan", "Laguna", "Cavite", "Rizal", "Quezon", "Albay", "Capiz", "Iloilo", "Leyte", "Sorsogon", "Zambales", "Tarlac"],
  Elements: ["Hydrogen", "Helium", "Lithium", "Beryllium", "Boron", "Carbon", "Nitrogen", "Oxygen", "Fluorine", "Neon", "Sodium", "Magnesium", "Aluminum", "Silicon", "Phosphorus"],
  MythicalCreatures: ["Dragon", "Phoenix", "Griffin", "Unicorn", "Pegasus", "Hydra", "Kraken", "Sphinx", "Minotaur", "Mermaid", "Cyclops", "Basilisk", "Centaur", "Leviathan", "Sylph"],
  Instruments: ["Violin", "Cello", "Piano", "Guitar", "Flute", "Clarinet", "Trumpet", "Saxophone", "Drums", "Harp", "Ukulele", "Trombone", "Oboe", "Bassoon", "Tambourine"],
  Colors: ["Azure", "Crimson", "Violet", "Indigo", "Cobalt", "Teal", "Coral", "Olive", "Amber", "Scarlet", "Lilac", "Mint", "Maroon", "Sienna", "Periwinkle"],
  Festivals: ["Sinulog", "AtiAtihan", "Dinagyang", "Panagbenga", "Kadayawan", "Pahiyas", "MassKara", "Higantes", "Moriones", "Sandugo", "Kaamulan", "Pintados", "T'nalak", "Ibalong", "Parada"],
  Architects: ["Gaudi", "Wright", "Hadid", "Niemeyer", "LeCorbusier", "Mies", "Piano", "Aalto", "Pei", "Saarinen", "Kahn", "Foster", "Calatrava", "Ando", "Gehry"],
  Planets: ["Mercury", "Venus", "Earth", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"],
  Constellations: ["Orion", "Lyra", "Aquila", "Draco", "Hydra", "Phoenix", "Perseus", "Cassiopeia", "Pegasus", "Cygnus", "Taurus", "Scorpius"],
  Horoscopes: ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"],
  Shapes: ["Circle", "Triangle", "Square", "Rectangle", "Pentagon", "Hexagon", "Heptagon", "Octagon", "Nonagon", "Decagon"],
};
const THEME_NAMES = Object.keys(THEME_LIBRARY);
const GRADES_IN_ORDER = [...JUNIOR_HIGH_GRADES, ...SENIOR_HIGH_GRADES];
const INITIAL_THEME_BY_GRADE = buildInitialThemeByGrade();

export default function SectionsManagement() {
  const initialCreatedSections = getInitialCreatedSections();
  const [jhsConfig, setJhsConfig] = useState(() => initialCreatedSections?.jhs || createInitialLevelConfig(JUNIOR_HIGH_GRADES, "jhs"));
  const [shsConfig, setShsConfig] = useState(() => initialCreatedSections?.shs || createInitialLevelConfig(SENIOR_HIGH_GRADES, "shs"));
  const [saveNotice, setSaveNotice] = useState("");
  const [saveNoticeType, setSaveNoticeType] = useState("success");
  const noticeTimerRef = useRef(null);
  const [createdSections, setCreatedSections] = useState(initialCreatedSections);
  const [isEditMode, setIsEditMode] = useState(false);

  const showSectionCreation = !createdSections || isEditMode;

  const showNotice = (message, type = "success") => {
    if (noticeTimerRef.current) {
      window.clearTimeout(noticeTimerRef.current);
    }

    setSaveNotice(message);
    setSaveNoticeType(type);

    noticeTimerRef.current = window.setTimeout(() => {
      setSaveNotice("");
    }, 2600);
  };

  const handleCreateSections = () => {
    const totalSections = [...Object.values(jhsConfig), ...Object.values(shsConfig)].reduce(
      (total, gradeConfig) => total + gradeConfig.sections.length,
      0
    );

    if (totalSections === 0) {
      showNotice("No sections yet. Please create sections first.", "error");
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

  const handleEditSections = () => {
    if (!createdSections) {
      return;
    }

    setJhsConfig(createdSections.jhs);
    setShsConfig(createdSections.shs);
    setIsEditMode(true);
    showNotice("Edit mode enabled.", "success");
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
      const current = prev[grade];

      return {
        ...prev,
        [grade]: {
          ...current,
          theme,
          sections: buildSections(level, grade, theme, current.count, current.sections, false),
        },
      };
    });
  };

  const handleCountChange = (level, grade, value) => {
    const setter = level === "jhs" ? setJhsConfig : setShsConfig;
    const parsed = Number.parseInt(value || "0", 10);
    const count = Number.isNaN(parsed) ? 0 : Math.max(0, Math.min(parsed, 20));

    setter((prev) => {
      const current = prev[grade];

      return {
        ...prev,
        [grade]: {
          ...current,
          count,
          sections: buildSections(level, grade, current.theme, count, current.sections, true),
        },
      };
    });
  };

  const handleSectionNameChange = (level, grade, index, value) => {
    const setter = level === "jhs" ? setJhsConfig : setShsConfig;

    setter((prev) => {
      const current = prev[grade];
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

  const handleSectionMetaChange = (level, grade, index, value) => {
    const setter = level === "jhs" ? setJhsConfig : setShsConfig;

    setter((prev) => {
      const current = prev[grade];
      const sections = current.sections.map((section, sectionIndex) => {
        if (sectionIndex !== index) {
          return section;
        }

        if (level === "jhs") {
          return { ...section, classification: value };
        }

        return { ...section, track: value };
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
            Configure grade-level sections, naming themes, and JHS/SHS classifications.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
          {showSectionCreation ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {isEditMode ? (
                <button type="button" onClick={handleCancelEdit} style={secondaryActionStyle()}>
                  Cancel
                </button>
              ) : null}

              <button type="button" onClick={handleCreateSections} style={primaryActionStyle()}>
                {isEditMode ? "Save Changes" : "Create Sections"}
              </button>
            </div>
          ) : (
            <button type="button" onClick={handleEditSections} style={secondaryActionStyle()}>
              Edit Sections
            </button>
          )}

          {saveNotice ? (
            <div
              role="status"
              aria-live="polite"
              style={{
                background: saveNoticeType === "error" ? "#b53f4e" : "#2f5f3a",
                color: "#ffffff",
                borderRadius: 10,
                padding: "10px 14px",
                fontSize: 13,
                fontWeight: 600,
                boxShadow: "0 10px 24px rgba(15, 27, 45, 0.2)",
                zIndex: 5,
                maxWidth: 340,
              }}
            >
              {saveNotice}
            </div>
          ) : null}
        </div>
      </div>

      {showSectionCreation ? (
        <>
          <SectionsContainer
            title="Junior High School (Grade 7-10)"
            subtitle="Set naming theme, section count, and classification (Regular or Special)."
            level="jhs"
            grades={JUNIOR_HIGH_GRADES}
            config={jhsConfig}
            onThemeChange={handleThemeChange}
            onCountChange={handleCountChange}
            onSectionNameChange={handleSectionNameChange}
            onSectionMetaChange={handleSectionMetaChange}
          />

          <SectionsContainer
            title="Senior High School (Grade 11-12)"
            subtitle="Set naming theme, section count, and track per section."
            level="shs"
            grades={SENIOR_HIGH_GRADES}
            config={shsConfig}
            onThemeChange={handleThemeChange}
            onCountChange={handleCountChange}
            onSectionNameChange={handleSectionNameChange}
            onSectionMetaChange={handleSectionMetaChange}
          />
        </>
      ) : (
        <CreatedSectionsView createdSections={createdSections} />
      )}
    </>
  );
}

function CreatedSectionsView({ createdSections }) {
  return (
    <>
      <CreatedLevelBlock title="Junior High School (Grade 7-10)" level="jhs" grades={JUNIOR_HIGH_GRADES} config={createdSections?.jhs || {}} />
      <CreatedLevelBlock title="Senior High School (Grade 11-12)" level="shs" grades={SENIOR_HIGH_GRADES} config={createdSections?.shs || {}} />
    </>
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
              <p style={{ margin: "2px 0 0", color: "#5a668a", fontSize: 12 }}>Theme: {gradeConfig.theme}</p>

              {sections.length === 0 ? (
                <p style={{ margin: "10px 0 0", color: "#8a96b6", fontSize: 12 }}>No sections created yet.</p>
              ) : (
                <div style={{ marginTop: 8, display: "grid", gap: 6 }}>
                  {sections.map((section, index) => {
                    const isSpecial = level === "jhs" && section.classification === "Special";

                    return (
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
                        <span
                          style={{
                            color: isSpecial ? "#3B4197" : "#4d5a84",
                            fontSize: 11,
                            fontWeight: 700,
                            whiteSpace: "nowrap",
                            background: isSpecial ? "#e9edff" : "#f2f4f8",
                            borderRadius: 999,
                            border: isSpecial ? "1px solid #cdd5ff" : "1px solid #d9dfea",
                            padding: "3px 8px",
                          }}
                        >
                          {level === "jhs" ? section.classification : section.track || "No track"}
                        </span>
                      </div>
                    );
                  })}
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
  onThemeChange,
  onCountChange,
  onSectionNameChange,
  onSectionMetaChange,
}) {
  return (
    <div style={{ background: "#ffffff", border: "1px solid #e3e7ef", borderRadius: 14, padding: 16, marginBottom: 16 }}>
      <h2 style={{ margin: 0, color: "#1f2c6f", fontSize: 18 }}>{title}</h2>
      <p style={{ margin: "6px 0 0", color: "#5d698d", fontSize: 13 }}>{subtitle}</p>

      <div style={{ display: "grid", gap: 14, marginTop: 14 }}>
        {grades.map((grade) => {
          const gradeConfig = config[grade];

          return (
            <div key={grade} style={{ border: "1px solid #e3e7ef", borderRadius: 12, padding: 12, background: "#fbfcff" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 170px", gap: 10, alignItems: "end" }}>
                <div>
                  <p style={{ margin: 0, color: "#1f2c6f", fontSize: 14, fontWeight: 700 }}>Grade {grade}</p>
                  <p style={{ margin: "2px 0 0", color: "#5f6b90", fontSize: 12 }}>Naming Theme</p>
                  <select value={gradeConfig.theme} onChange={(event) => onThemeChange(level, grade, event.target.value)} style={selectStyle()}>
                    {THEME_NAMES.map((theme) => (
                      <option key={theme} value={theme}>
                        {theme}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <p style={{ margin: 0, color: "#5f6b90", fontSize: 12 }}>Number of Sections</p>
                  <input
                    type="number"
                    min={0}
                    max={20}
                    value={gradeConfig.count}
                    onChange={(event) => onCountChange(level, grade, event.target.value)}
                    style={inputStyle()}
                  />
                </div>
              </div>

              {gradeConfig.count > 0 ? (
                <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
                  {gradeConfig.sections.map((section, index) => (
                    <div key={`${grade}-${index}`} style={{ display: "grid", gridTemplateColumns: "44px 1fr 220px", gap: 10, alignItems: "center" }}>
                      <span style={indexPillStyle()}>{index + 1}</span>

                      <input
                        type="text"
                        value={section.name}
                        onChange={(event) => onSectionNameChange(level, grade, index, event.target.value)}
                        style={inputStyle()}
                      />

                      {level === "jhs" ? (
                        <select
                          value={section.classification}
                          onChange={(event) => onSectionMetaChange(level, grade, index, event.target.value)}
                          style={selectStyle()}
                        >
                          <option value="Regular">Regular</option>
                          <option value="Special">Special</option>
                        </select>
                      ) : (
                        <select
                          value={section.track}
                          onChange={(event) => onSectionMetaChange(level, grade, index, event.target.value)}
                          style={selectStyle()}
                        >
                          <option value="">Select Track</option>
                          {TRACK_OPTIONS.map((track) => (
                            <option key={track} value={track}>
                              {track}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ margin: "10px 0 0", color: "#7a86a7", fontSize: 12 }}>Set section count to generate section rows.</p>
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

function createInitialLevelConfig(grades, level) {
  return grades.reduce((accumulator, grade) => {
    const theme = INITIAL_THEME_BY_GRADE[grade] || THEME_NAMES[0];

    accumulator[grade] = {
      theme,
      count: 0,
      sections: buildSections(level, grade, theme, 0, [], false),
    };

    return accumulator;
  }, {});
}

function buildSections(level, grade, theme, count, previousSections = [], keepExistingNames = true) {
  const size = Number.isFinite(count) ? count : 0;

  return Array.from({ length: size }, (_, index) => {
    const previous = previousSections[index];
    const generatedName = generateSectionName(theme, grade, index);

    if (level === "jhs") {
      return {
        name: keepExistingNames ? previous?.name || generatedName : generatedName,
        classification: previous?.classification || "Regular",
      };
    }

    return {
      name: keepExistingNames ? previous?.name || generatedName : generatedName,
      track: previous?.track || "",
    };
  });
}

function generateSectionName(theme, grade, index) {
  const words = THEME_LIBRARY[theme] || THEME_LIBRARY.Trees;
  const raw = words[index % words.length];
  const cycle = Math.floor(index / words.length);
  const suffix = cycle > 0 ? ` ${cycle + 1}` : "";

  return `Grade ${grade} - ${raw}${suffix}`;
}

function buildInitialThemeByGrade() {
  const shuffledThemes = [...THEME_NAMES];

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
