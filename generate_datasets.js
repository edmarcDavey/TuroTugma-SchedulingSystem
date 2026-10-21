const fs = require('fs');
const path = require('path');

// 1. GENERATE DEPED MATATAG SUBJECTS CSV
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
  ['ICT', 'ICT', 'JHS', 'Specialized', '60', '4', 'Grades 7–10', '', 'SPJ, SP-STEM', ''],

  // JHS Enhanced STEM Subjects (Grade 7 SP-STEM Exclusively - 3 hrs/wk across 3 meetings × 60m)
  ['Developmental Reading', 'DEVREAD', 'JHS', 'Specialized', '60', '3', '7', '', 'SP-STEM', ''],
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

// 2. GENERATE 100 FACULTY PROFILES CSV
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
  "Benjamin", "Nathaniel", "Alexander", "Christopher", "Jonathan", "Matthew", "Timothy", "Nicholas", "Anthony", "Patrick",
  "Kenneth", "Dennis", "Raymond", "Eugene", "Arthur", "Bernard", "Frederick", "Gregory", "Lawrence", "Philip"
];

const firstNamesFemale = [
  "Maria", "Ana", "Cristina", "Grace", "Angelica", "Patricia", "Jennifer", "Michelle", "Stephanie", "Katherine",
  "Rosemary", "Elena", "Teresa", "Cecilia", "Veronica", "Luz", "Corazon", "Carmela", "Rowena", "Divina",
  "Jasmine", "Clarissa", "Gwendolyn", "Bernadette", "Maricel", "Rosario", "Josefina", "Virginia", "Consuelo", "Esperanza",
  "Beatriz", "Jacqueline", "Doris", "Evelyn", "Florence", "Gladys", "Helena", "Irene", "Judith", "Lorraine",
  "Margaret", "Norma", "Priscilla", "Rachel", "Sylvia", "Vivian", "Yolanda", "Zenaida", "Abigail", "Belinda"
];

const lastNames = [
  "Santos", "Reyes", "Cruz", "Bautista", "Ocampo", "Garcia", "Mendoza", "Torres", "Tomas", "Andrada",
  "Gonzales", "Ramos", "Aquino", "Villanueva", "Castillo", "Flores", "Navarro", "Mercado", "Aguilar", "Valenzuela",
  "Del Rosario", "De Leon", "Perez", "Santiago", "Soriano", "Corpuz", "Manalo", "Dela Rosa", "Pineda", "Valdez",
  "Fernandez", "Sison", "Tiongson", "Dizon", "Guerrero", "Marquez", "Pascual", "Salvador", "Ventura", "Cabrera",
  "Serrano", "Morales", "Cordero", "Miranda", "Padilla", "Rosales", "Velasco", "Zapata", "Gutierrez", "Alvarez",
  "Enriquez", "Beltran", "Zamora", "Abad", "Bonifacio", "Calderon", "Delos Santos", "Estrada", "Fajardo", "Gallego",
  "Hernandez", "Ibarra", "Javier", "Lacson", "Macapagal", "Nieves", "Ortega", "Peña", "Quirino", "Rivera",
  "Salazar", "Tolentino", "Urbano", "Villarreal", "Yambao", "Zobel", "Abenojar", "Bulan", "Clemente", "Domingo",
  "Escobar", "Galang", "Hermosa", "Ignacio", "Jimenez", "Katigbak", "Legaspi", "Magno", "Nolasco", "Ong"
];

const departmentSpecs = [
  {
    dept: "Mathematics",
    count: 14,
    degree: "Bachelor of Secondary Education",
    major: "Mathematics",
    minor: "Physics",
    subjects: ["Mathematics", "General Mathematics", "Elementary Algebra", "Pre-Calculus", "Basic Calculus"],
    grades: ["Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"]
  },
  {
    dept: "Science",
    count: 16,
    degree: "BS Secondary Education",
    major: "General Science",
    minor: "Chemistry",
    subjects: ["Science", "Environmental Science", "Earth and Life Science", "Physical Science", "General Physics 1", "General Chemistry 1"],
    grades: ["Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"]
  },
  {
    dept: "English",
    count: 14,
    degree: "Bachelor of Secondary Education",
    major: "English",
    minor: "Journalism",
    subjects: ["English", "Developmental Reading", "Oral Communication in Context", "21st Century Literature", "English for Academic and Professional Purposes", "Practical Research 1"],
    grades: ["Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"]
  },
  {
    dept: "Filipino",
    count: 12,
    degree: "BSEd Filipino",
    major: "Filipino",
    minor: "Panitikan",
    subjects: ["Filipino", "Komunikasyon at Pananaliksik"],
    grades: ["Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11"]
  },
  {
    dept: "Araling Panlipunan",
    count: 12,
    degree: "BSEd Social Studies",
    major: "Social Studies",
    minor: "History",
    subjects: ["Araling Panlipunan", "Understanding Culture, Society, and Politics", "Philippine Politics and Governance"],
    grades: ["Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"]
  },
  {
    dept: "MAPEH",
    count: 10,
    degree: "Bachelor of Physical Education",
    major: "MAPEH",
    minor: "Sports Science",
    subjects: ["MAPEH", "SPA Specialization", "Physical Education and Health 1", "Physical Education and Health 2"],
    grades: ["Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"]
  },
  {
    dept: "TLE / TVL / ICT",
    count: 12,
    degree: "BS Industrial Education",
    major: "Technology and Livelihood Education",
    minor: "Computer Education",
    subjects: ["Technology and Livelihood Education (TLE)", "ICT", "Empowerment Technologies", "Computer Systems Servicing 1", "Entrepreneurship"],
    grades: ["Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"]
  },
  {
    dept: "Values Education / Guidance",
    count: 10,
    degree: "BSEd Values Education",
    major: "Values Education",
    minor: "Guidance and Counseling",
    subjects: ["Values Education", "HGP", "Aral Program", "Personal Development"],
    grades: ["Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11"]
  }
];

const positions = ["Teacher I", "Teacher II", "Teacher III", "Master Teacher I", "Master Teacher II", "Head Teacher I"];
const ancillaries = [
  "",
  "Grade 7 Coordinator",
  "Grade 8 Coordinator",
  "Grade 9 Coordinator",
  "Grade 10 Coordinator",
  "Grade 11 Coordinator",
  "Grade 12 Coordinator",
  "ICT Coordinator",
  "School Registrar Assistant",
  "Property Custodian Assistant",
  "DRRM Coordinator",
  "BAC Member",
  "Subject Department Chairman",
  "Guidance Counselor Assistant"
];
const unavailables = ["", "P1", "P8", "P1, P8", "P2", "P7"];

const facultyRows = [];
let teacherCounter = 1;

departmentSpecs.forEach(spec => {
  for (let i = 0; i < spec.count; i++) {
    const isMale = (teacherCounter % 2 === 1);
    const firstName = isMale 
      ? firstNamesMale[(teacherCounter * 7) % firstNamesMale.length]
      : firstNamesFemale[(teacherCounter * 5) % firstNamesFemale.length];
    const lastName = lastNames[(teacherCounter * 11) % lastNames.length];
    const middleInitial = String.fromCharCode(65 + ((teacherCounter * 3) % 26));
    
    const name = `${firstName} ${middleInitial}. ${lastName}`;
    const sex = isMale ? "Male" : "Female";
    const empId = `EMP-2026-${String(teacherCounter).padStart(3, '0')}`;
    const position = positions[teacherCounter % positions.length];
    const status = (teacherCounter % 10 === 0) ? "Probationary" : "Regular";
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(/\s+/g, '')}${teacherCounter}@deped.gov.ph`;
    const contact = `0917${String(1000000 + (teacherCounter * 8765)).slice(-7)}`;
    
    // Pick 2-4 subjects from expertise pool
    const startSubIndex = (i * 2) % spec.subjects.length;
    const assignedSubjects = [
      spec.subjects[startSubIndex],
      spec.subjects[(startSubIndex + 1) % spec.subjects.length],
      spec.subjects[(startSubIndex + 2) % spec.subjects.length]
    ].filter(Boolean);
    const subjectExpertiseStr = Array.from(new Set(assignedSubjects)).join("; ");

    // Pick 2-3 grade levels
    const assignedGrades = [
      spec.grades[i % spec.grades.length],
      spec.grades[(i + 1) % spec.grades.length],
      spec.grades[(i + 2) % spec.grades.length]
    ].filter(Boolean);
    const gradeLevelAssignmentsStr = Array.from(new Set(assignedGrades)).join("; ");

    const ancillary = ancillaries[(teacherCounter * 4) % ancillaries.length];
    const unavailable = unavailables[(teacherCounter * 3) % unavailables.length];

    facultyRows.push([
      name,
      sex,
      empId,
      position,
      status,
      email,
      contact,
      spec.degree,
      spec.major,
      spec.minor,
      ancillary,
      unavailable,
      subjectExpertiseStr,
      gradeLevelAssignmentsStr
    ]);

    teacherCounter++;
  }
});

const facultyCsvContent = [
  formatCsvLine(facultyHeaders),
  ...facultyRows.map(formatCsvLine)
].join('\n');

// WRITE FILES TO ROOT AND FRONTEND/PUBLIC
const rootSubjectsPath = 'c:/xampp/htdocs/SchedulingSystem/deped_matatag_subjects.csv';
const publicSubjectsPath = 'c:/xampp/htdocs/SchedulingSystem/frontend/public/deped_matatag_subjects.csv';
const rootFacultyPath = 'c:/xampp/htdocs/SchedulingSystem/faculty_100_profiles.csv';
const publicFacultyPath = 'c:/xampp/htdocs/SchedulingSystem/frontend/public/faculty_100_profiles.csv';

fs.writeFileSync(rootSubjectsPath, subjectsCsvContent, 'utf8');
fs.writeFileSync(publicSubjectsPath, subjectsCsvContent, 'utf8');
fs.writeFileSync(rootFacultyPath, facultyCsvContent, 'utf8');
fs.writeFileSync(publicFacultyPath, facultyCsvContent, 'utf8');

console.log(`Generated ${subjectsData.length} Subjects in ${rootSubjectsPath}`);
console.log(`Generated ${facultyRows.length} Faculty Profiles in ${rootFacultyPath}`);
