import fs from 'fs';
import path from 'path';

const subjectHeaders = [
  'Subject Name',
  'Subject Code',
  'School Level',
  'Subject Type',
  'Daily Minutes',
  'Classes per Week',
  'Grade Level',
  'Semester',
  'Program Scope',
  'Strand'
];

const subjectsData = [
  // JHS Core Subjects (Unified across Grades 7–10, 60 mins, 4 meetings/week)
  ['English', 'ENG', 'JHS', 'Core', '60', '4', 'Grades 7–10', '', 'Universal', ''],
  ['Mathematics', 'MATH', 'JHS', 'Core', '60', '4', 'Grades 7–10', '', 'Universal', ''],
  ['Science', 'SCI', 'JHS', 'Core', '60', '4', 'Grades 7–10', '', 'Universal', ''],
  ['Filipino', 'FIL', 'JHS', 'Core', '60', '4', 'Grades 7–10', '', 'Universal', ''],
  ['Araling Panlipunan', 'AP', 'JHS', 'Core', '60', '4', 'Grades 7–10', '', 'Universal', ''],
  ['Values Education', 'VE', 'JHS', 'Core', '60', '4', 'Grades 7–10', '', 'Universal', ''],
  ['MAPEH', 'MAPEH', 'JHS', 'Core', '60', '4', 'Grades 7–10', '', 'Universal', ''],

  // JHS Enrichment Subjects
  ['HGP', 'HGP', 'JHS', 'Enrichment', '60', '1', 'Grades 7–10', '', 'Universal', ''],
  ['Aral Program', 'ARAL', 'JHS', 'Enrichment', '60', '1', 'Grades 7–10', '', 'Regular', ''],

  // JHS Specialized / Program Subjects
  ['Technology and Livelihood Education (TLE)', 'TLE', 'JHS', 'Specialized', '60', '4', 'Grades 7–10', '', 'Regular, SPA', ''],
  ['SPA Specialization', 'SPASPEC', 'JHS', 'Specialized', '60', '4', 'Grades 7–10', '', 'SPA', ''],
  ['ICT (SPJ)', 'ICT-SPJ', 'JHS', 'Specialized', '60', '4', 'Grades 7–10', '', 'SPJ', ''],
  ['ICT (SP-STEM)', 'ICT-STEM', 'JHS', 'Specialized', '60', '3', 'Grades 7–10', '', 'SP-STEM', ''],

  // JHS Enhanced STEM Subjects (Grade 7 SP-STEM Exclusively - DEVREAD is 1 hr/wk, ELEMALG & ENVSCI are 3 hrs/wk)
  ['Developmental Reading', 'DEVREAD', 'JHS', 'Specialized', '60', '1', '7', '', 'SP-STEM', ''],
  ['Elementary Algebra', 'ELEMALG', 'JHS', 'Specialized', '60', '3', '7', '', 'SP-STEM', ''],
  ['Environmental Science', 'ENVSCI', 'JHS', 'Specialized', '60', '3', '7', '', 'SP-STEM', ''],

  // SHS Core Subjects
  ['Oral Communication in Context', 'ORALCOM', 'SHS', 'Core', '50', '4', '11', 'First Semester', '', ''],
  ['General Mathematics', 'GENMATH', 'SHS', 'Core', '50', '4', '11', 'First Semester', '', ''],
  ['Earth and Life Science', 'EARTHSCI', 'SHS', 'Core', '50', '4', '11', 'First Semester', '', ''],
  ['Komunikasyon at Pananaliksik', 'KOMPAN', 'SHS', 'Core', '50', '4', '11', 'First Semester', '', ''],
  ['Physical Education and Health 1', 'PEH1', 'SHS', 'Core', '50', '2', '11', 'First Semester', '', ''],

  ['21st Century Literature', 'LIT21', 'SHS', 'Core', '50', '4', '11', 'Last Semester', '', ''],
  ['Statistics and Probability', 'STATPROB', 'SHS', 'Core', '50', '4', '11', 'Last Semester', '', ''],
  ['Physical Science', 'PHYSCI', 'SHS', 'Core', '50', '4', '11', 'Last Semester', '', ''],
  ['Personal Development', 'PERDEV', 'SHS', 'Core', '50', '4', '11', 'Last Semester', '', ''],
  ['Physical Education and Health 2', 'PEH2', 'SHS', 'Core', '50', '2', '11', 'Last Semester', '', ''],

  ['Understanding Culture, Society, and Politics', 'UCSP', 'SHS', 'Core', '50', '4', '12', 'First Semester', '', ''],
  ['Media and Information Literacy', 'MIL', 'SHS', 'Core', '50', '4', '12', 'First Semester', '', ''],

  // SHS Applied Subjects
  ['Empowerment Technologies', 'EMPTECH', 'SHS', 'Applied', '50', '4', '11', 'First Semester', '', ''],
  ['English for Academic and Professional Purposes', 'EAPP', 'SHS', 'Applied', '50', '4', '11', 'Last Semester', '', ''],
  ['Practical Research 1', 'PRACRES1', 'SHS', 'Applied', '50', '4', '11', 'Last Semester', '', ''],
  ['Practical Research 2', 'PRACRES2', 'SHS', 'Applied', '50', '4', '12', 'First Semester', '', ''],
  ['Entrepreneurship', 'ENTREP', 'SHS', 'Applied', '50', '4', '12', 'Last Semester', '', ''],

  // SHS Specialized Subjects
  ['Pre-Calculus', 'PRECALC', 'SHS', 'Specialized', '50', '4', '11', 'First Semester', '', 'STEM'],
  ['Basic Calculus', 'BASCALC', 'SHS', 'Specialized', '50', '4', '11', 'Last Semester', '', 'STEM'],
  ['General Physics 1', 'GENPHYS1', 'SHS', 'Specialized', '50', '4', '12', 'First Semester', '', 'STEM'],
  ['General Physics 2', 'GENPHYS2', 'SHS', 'Specialized', '50', '4', '12', 'Last Semester', '', 'STEM'],
  ['General Chemistry 1', 'GENCHEM1', 'SHS', 'Specialized', '50', '4', '11', 'First Semester', '', 'STEM'],
  ['General Chemistry 2', 'GENCHEM2', 'SHS', 'Specialized', '50', '4', '11', 'Last Semester', '', 'STEM'],
  ['Creative Writing', 'CREWRITE', 'SHS', 'Specialized', '50', '4', '11', 'First Semester', '', 'HUMSS'],
  ['Philippine Politics and Governance', 'PPG', 'SHS', 'Specialized', '50', '4', '11', 'Last Semester', '', 'HUMSS'],
  ['Fundamentals of ABM 1', 'FABM1', 'SHS', 'Specialized', '50', '4', '11', 'First Semester', '', 'ABM'],
  ['Fundamentals of ABM 2', 'FABM2', 'SHS', 'Specialized', '50', '4', '11', 'Last Semester', '', 'ABM'],
  ['Computer Systems Servicing 1', 'CSS1', 'SHS', 'Specialized', '50', '4', '11', 'First Semester', '', 'TVL'],
  ['Computer Systems Servicing 2', 'CSS2', 'SHS', 'Specialized', '50', '4', '11', 'Last Semester', '', 'TVL'],
];

function formatCsvLine(row) {
  return row.map(cell => {
    const text = String(cell || '');
    if (text.includes(',') || text.includes('"') || text.includes('\n')) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  }).join(',');
}

const subjectsCsvContent = [
  formatCsvLine(subjectHeaders),
  ...subjectsData.map(formatCsvLine)
].join('\n');

const facultyHeaders = [
  'Name',
  'Sex',
  'Employee ID',
  'Position',
  'Employment Status',
  'Email',
  'Contact',
  'Degree',
  'Major',
  'Minor',
  'Ancillary Assignments',
  'Unavailable Periods',
  'Subject Expertise',
  'Grade Level Assignments'
];

const firstNamesMale = [
  "Juan", "Jose", "Mark", "Gabriel", "Christian", "Angelo", "Paolo", "Rafael", "Emmanuel", "Francis",
  "Jerome", "Joshua", "Ramon", "Eduardo", "Danilo", "Ferdinand", "Antonio", "Dominic", "Carlos", "Victor",
  "Renato", "Vicente", "Manuel", "Ricardo", "Gilbert", "Edgardo", "Joel", "Roderick", "Bartholomew", "Stephen",
  "Benjamin", "Nathaniel", "Alexander", "Christopher", "Jonathan", "Matthew", "Timothy", "Nicholas", "Anthony", "Patrick"
];

const firstNamesFemale = [
  "Maria", "Ana", "Cristina", "Grace", "Angelica", "Patricia", "Jennifer", "Michelle", "Stephanie", "Katherine",
  "Rosemary", "Elena", "Teresa", "Cecilia", "Veronica", "Luz", "Corazon", "Carmela", "Rowena", "Divina",
  "Jasmine", "Clarissa", "Gwendolyn", "Bernadette", "Maricel", "Rosario", "Josefina", "Virginia", "Consuelo", "Esperanza"
];

const lastNames = [
  "Santos", "Reyes", "Cruz", "Bautista", "Ocampo", "Garcia", "Mendoza", "Torres", "Tomas", "Andrada",
  "Gonzales", "Ramos", "Aquino", "Villanueva", "Castillo", "Flores", "Navarro", "Mercado", "Aguilar", "Valenzuela",
  "Del Rosario", "De Leon", "Perez", "Santiago", "Soriano", "Corpuz", "Manalo", "Dela Rosa", "Pineda", "Valdez",
  "Fernandez", "Sison", "Tiongson", "Dizon", "Guerrero", "Marquez", "Pascual", "Salvador", "Ventura", "Cabrera",
  "Serrano", "Morales", "Cordero", "Miranda", "Padilla", "Rosales", "Velasco", "Zapata", "Gutierrez", "Alvarez"
];

// Exact 80 Teachers: 64 JHS Only, 8 SHS Only, 8 Both JHS & SHS
const facultyProfiles = [];

const positions = ["Teacher I", "Teacher II", "Teacher III", "Master Teacher I", "Master Teacher II"];
const ancillaries = ["", "Grade Level Chairman", "ICT Coordinator", "School Registrar Assistant", "Property Custodian Assistant", "DRRM Coordinator", "Canteen Coordinator"];

let teacherCounter = 1;

function generateProfile({ levelType, dept, degree, major, minor, subjects, grades, customName, customSex, customEmail, customPosition }) {
  const isMale = customSex ? (customSex === "Male") : (teacherCounter % 2 === 1);
  const firstName = isMale 
    ? firstNamesMale[teacherCounter % firstNamesMale.length]
    : firstNamesFemale[teacherCounter % firstNamesFemale.length];
  const lastName = lastNames[teacherCounter % lastNames.length];
  const middleInitial = String.fromCharCode(65 + (teacherCounter % 26));

  const name = customName || `${firstName} ${middleInitial}. ${lastName}`;
  const sex = customSex || (isMale ? "Male" : "Female");
  const empId = `EMP-2026-${String(teacherCounter).padStart(3, '0')}`;
  const position = customPosition || positions[teacherCounter % positions.length];
  const status = (teacherCounter % 8 === 0) ? "Probationary" : "Regular";
  const email = customEmail || `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(/\s+/g, '')}${teacherCounter}@deped.gov.ph`;
  const contact = `0917${String(1000000 + (teacherCounter * 8765)).slice(-7)}`;

  const ancillary = ancillaries[teacherCounter % ancillaries.length];
  const unavailable = (teacherCounter % 7 === 0) ? "P1" : (teacherCounter % 9 === 0) ? "P8" : "";

  facultyProfiles.push([
    name,
    sex,
    empId,
    position,
    status,
    email,
    contact,
    degree,
    major,
    minor,
    ancillary,
    unavailable,
    subjects.join("; "),
    grades.join("; ")
  ]);

  teacherCounter++;
}

// 1. Generate 64 JHS Only Teachers
const jhsDepts = [
  { dept: "Mathematics", count: 11, subjects: ["Mathematics", "Elementary Algebra"] },
  { dept: "Science", count: 12, subjects: ["Science", "Environmental Science"] },
  { dept: "English", count: 11, subjects: ["English", "Developmental Reading"] },
  { dept: "Filipino", count: 8, subjects: ["Filipino"] },
  { dept: "Araling Panlipunan", count: 8, subjects: ["Araling Panlipunan"] },
  {
    dept: "MAPEH",
    count: 6,
    teachers: [
      { name: "Cherry Mae Garing", sex: "Female", email: "cherry.garing@deped.gov.ph", position: "Teacher I", subjects: ["MAPEH", "SPA Specialization (Media Arts)", "SPA Specialization"] },
      { name: "Alpha Mae Ambatali", sex: "Female", email: "alpha.ambatali@deped.gov.ph", position: "Teacher II", subjects: ["MAPEH", "SPA Specialization (Dance Arts)", "SPA Specialization"] },
      { name: "May Bitla", sex: "Female", email: "may.bitla@deped.gov.ph", position: "Teacher III", subjects: ["MAPEH", "SPA Specialization (Instrumental Music)", "SPA Specialization"] },
      { name: "Joshua Z. Reyes", sex: "Male", email: "joshua.reyes@deped.gov.ph", position: "Master Teacher I", subjects: ["MAPEH", "SPA Specialization (Visual Arts)", "SPA Specialization"] },
      { name: "Gwendolyn A. Cruz", sex: "Female", email: "gwendolyn.cruz@deped.gov.ph", position: "Teacher II", subjects: ["MAPEH", "SPA Specialization"] },
      { name: "Eduardo B. Bautista", sex: "Male", email: "eduardo.bautista@deped.gov.ph", position: "Master Teacher II", subjects: ["MAPEH", "SPA Specialization"] }
    ]
  },
  { dept: "TLE / ICT", count: 4, subjects: ["Technology and Livelihood Education (TLE)", "ICT (SPJ)", "ICT (SP-STEM)", "ICT"] },
  { dept: "Values / Guidance", count: 4, subjects: ["Values Education", "HGP", "Aral Program"] }
];

jhsDepts.forEach(d => {
  for (let i = 0; i < d.count; i++) {
    const tConfig = d.teachers ? d.teachers[i] : null;
    generateProfile({
      levelType: "jhs_only",
      dept: d.dept,
      degree: "Bachelor of Secondary Education",
      major: d.dept,
      minor: "Education",
      subjects: tConfig ? tConfig.subjects : d.subjects,
      grades: ["Grade 7", "Grade 8", "Grade 9", "Grade 10"],
      customName: tConfig ? tConfig.name : undefined,
      customSex: tConfig ? tConfig.sex : undefined,
      customEmail: tConfig ? tConfig.email : undefined,
      customPosition: tConfig ? tConfig.position : undefined,
    });
  }
});

// 2. Generate 8 SHS Only Teachers
const shsOnlySpecs = [
  { dept: "SHS STEM Math/Sci", count: 2, subjects: ["Pre-Calculus", "Basic Calculus", "General Physics 1", "General Chemistry 1"], grades: ["Grade 11", "Grade 12"] },
  { dept: "SHS English/Humss", count: 2, subjects: ["Oral Communication in Context", "21st Century Literature", "English for Academic and Professional Purposes", "Practical Research 1"], grades: ["Grade 11", "Grade 12"] },
  { dept: "SHS Social Sciences", count: 1, subjects: ["Komunikasyon at Pananaliksik", "Understanding Culture, Society, and Politics", "Philippine Politics and Governance"], grades: ["Grade 11", "Grade 12"] },
  { dept: "SHS PE & Health", count: 1, subjects: ["Physical Education and Health 1", "Physical Education and Health 2", "Personal Development"], grades: ["Grade 11", "Grade 12"] },
  { dept: "SHS TVL & ABM", count: 2, subjects: ["Empowerment Technologies", "Computer Systems Servicing 1", "Fundamentals of ABM 1", "Entrepreneurship"], grades: ["Grade 11", "Grade 12"] }
];

shsOnlySpecs.forEach(d => {
  for (let i = 0; i < d.count; i++) {
    generateProfile({
      levelType: "shs_only",
      dept: d.dept,
      degree: "BS / BSEd Senior High Specialist",
      major: d.dept,
      minor: "Specialization",
      subjects: d.subjects,
      grades: ["Grade 11", "Grade 12"]
    });
  }
});

// 3. Generate 8 Both JHS & SHS Teachers
const bothSpecs = [
  { dept: "Math (JHS+SHS)", subjects: ["Mathematics", "General Mathematics", "Statistics and Probability"] },
  { dept: "Science (JHS+SHS)", subjects: ["Science", "Earth and Life Science", "Physical Science"] },
  { dept: "English (JHS+SHS)", subjects: ["English", "Oral Communication in Context", "Practical Research 1"] },
  { dept: "Filipino (JHS+SHS)", subjects: ["Filipino", "Komunikasyon at Pananaliksik"] },
  { dept: "AP (JHS+SHS)", subjects: ["Araling Panlipunan", "Understanding Culture, Society, and Politics"] },
  { dept: "MAPEH (JHS+SHS)", subjects: ["MAPEH", "Physical Education and Health 1"] },
  { dept: "TLE (JHS+SHS)", subjects: ["Technology and Livelihood Education (TLE)", "Empowerment Technologies"] },
  { dept: "EsP (JHS+SHS)", subjects: ["Edukasyon sa Pagpapakakatao (EsP)", "Personal Development"] }
];

bothSpecs.forEach(d => {
  generateProfile({
    levelType: "both",
    dept: d.dept,
    degree: "BSEd Multi-Grade Specialist",
    major: d.dept,
    minor: "Curriculum Integration",
    subjects: d.subjects,
    grades: ["Grade 9", "Grade 10", "Grade 11", "Grade 12"]
  });
});

const facultyCsvContent = [
  formatCsvLine(facultyHeaders),
  ...facultyProfiles.map(formatCsvLine)
].join('\n');

const rootSubjectsPath = 'c:/xampp/htdocs/SchedulingSystem/deped_matatag_subjects.csv';
const publicSubjectsPath = 'c:/xampp/htdocs/SchedulingSystem/frontend/public/deped_matatag_subjects.csv';
const rootFacultyPath = 'c:/xampp/htdocs/SchedulingSystem/faculty_100_profiles.csv';
const publicFacultyPath = 'c:/xampp/htdocs/SchedulingSystem/frontend/public/faculty_100_profiles.csv';

fs.writeFileSync(rootSubjectsPath, subjectsCsvContent, 'utf8');
fs.writeFileSync(publicSubjectsPath, subjectsCsvContent, 'utf8');
fs.writeFileSync(rootFacultyPath, facultyCsvContent, 'utf8');
fs.writeFileSync(publicFacultyPath, facultyCsvContent, 'utf8');

console.log(`Generated dataset cleanly: 80 Faculty Profiles (${facultyProfiles.length} total)`);
