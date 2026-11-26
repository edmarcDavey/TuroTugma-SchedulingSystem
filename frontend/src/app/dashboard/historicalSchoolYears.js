/**
 * Historical School Years Registry & Data Reusability Hub for Diadi National High School (DNHS)
 * Core Operational Entities:
 * 1. Scheduling Configurations (period minutes, bell schedule, break positions)
 * 2. Grades (JHS Grades 7–10, SHS Grades 11–12)
 * 3. Sections (Section names, tracks, classifications, advisers)
 * 4. Teachers (Faculty roster, designations, majors/minors, teaching loads)
 * 5. Ancillaries (Class Advisers, DRRM, Sports, Journalism, Coordinators)
 * 6. Published Schedules / Scheds (Permanent published section and teacher timetables)
 *
 * NOTE: DNHS does NOT track room utilization or student headcount enrollments.
 * All resources are organized strictly by grade, section, teacher, ancillary, and published schedule.
 */

export const HISTORICAL_STORAGE_KEY = "turotugma_school_year_archives";
export const ROLLOVER_AUDIT_KEY = "turotugma_rollover_audit";
export const PUBLISHED_STORAGE_KEY = "turotugma_published_schedules";

export const DEFAULT_HISTORICAL_YEARS = [
  {
    yearId: "2025-2026",
    academicYear: "2025-2026",
    label: "S.Y. 2025–2026",
    status: "Archived",
    description: "Previous institutional school year at Diadi National High School. Complete records with MATATAG JHS cohort, Strengthened SHS strands, and published timetables.",
    dateRange: "August 2025 – June 2026",
    totalSections: 14,
    totalFaculty: 28,
    publishedSchedulesCount: 2,
    jhs: {
      sectionCount: 8,
      facultyCount: 16,
      sections: [
        { id: "jhs-7-0-2025", grade: 7, name: "Grade 7 - Diamond", classification: "Regular", adviser: "Juan Dela Cruz" },
        { id: "jhs-7-1-2025", grade: 7, name: "Grade 7 - Ruby", classification: "Regular", adviser: "Maria Santos" },
        { id: "jhs-8-0-2025", grade: 8, name: "Grade 8 - Emerald", classification: "Regular", adviser: "Pedro Reyes" },
        { id: "jhs-8-1-2025", grade: 8, name: "Grade 8 - Sapphire", classification: "Regular", adviser: "Elena Garcia" },
        { id: "jhs-9-0-2025", grade: 9, name: "Grade 9 - Topaz", classification: "Regular", adviser: "Roberto Mendoza" },
        { id: "jhs-9-1-2025", grade: 9, name: "Grade 9 - Amethyst", classification: "Regular", adviser: "Grace Bautista" },
        { id: "jhs-10-0-2025", grade: 10, name: "Grade 10 - Pearl", classification: "Regular", adviser: "Teresa Aquino" },
        { id: "jhs-10-1-2025", grade: 10, name: "Grade 10 - Garnet", classification: "Regular", adviser: "Mark Anthony Ramos" },
      ],
      faculty: [
        { id: "t-jhs-01", name: "Juan Dela Cruz", sex: "Male", designation: "Master Teacher I", employmentStatus: "Permanent", workingArrangement: "Full-Time", major: "Mathematics", minor: "Science", advisoryClass: "Grade 7 - Diamond", ancillaries: ["Class Adviser", "Mathematics Department Coordinator"], maxWeeklyHours: 24, schoolLevel: "jhs" },
        { id: "t-jhs-02", name: "Maria Santos", sex: "Female", designation: "Teacher III", employmentStatus: "Permanent", workingArrangement: "Full-Time", major: "English", minor: "Values Education", advisoryClass: "Grade 7 - Ruby", ancillaries: ["Class Adviser", "School Paper / Journalism Adviser"], maxWeeklyHours: 24, schoolLevel: "jhs" },
        { id: "t-jhs-03", name: "Pedro Reyes", sex: "Male", designation: "Teacher II", employmentStatus: "Permanent", workingArrangement: "Full-Time", major: "Science", minor: "Mathematics", advisoryClass: "Grade 8 - Emerald", ancillaries: ["Class Adviser", "Science Club Moderator"], maxWeeklyHours: 24, schoolLevel: "jhs" },
        { id: "t-jhs-04", name: "Elena Garcia", sex: "Female", designation: "Teacher III", employmentStatus: "Permanent", workingArrangement: "Full-Time", major: "Filipino", minor: "Araling Panlipunan", advisoryClass: "Grade 8 - Sapphire", ancillaries: ["Class Adviser", "Filipino Coordinator"], maxWeeklyHours: 24, schoolLevel: "jhs" },
        { id: "t-jhs-05", name: "Roberto Mendoza", sex: "Male", designation: "Teacher I", employmentStatus: "Permanent", workingArrangement: "Full-Time", major: "Araling Panlipunan", minor: "Filipino", advisoryClass: "Grade 9 - Topaz", ancillaries: ["Class Adviser", "Social Studies Coordinator"], maxWeeklyHours: 24, schoolLevel: "jhs" },
        { id: "t-jhs-06", name: "Grace Bautista", sex: "Female", designation: "Teacher II", employmentStatus: "Permanent", workingArrangement: "Full-Time", major: "Values Education", minor: "English", advisoryClass: "Grade 9 - Amethyst", ancillaries: ["Class Adviser", "Guidance Support Staff"], maxWeeklyHours: 24, schoolLevel: "jhs" },
        { id: "t-jhs-07", name: "Teresa Aquino", sex: "Female", designation: "Teacher III", employmentStatus: "Permanent", workingArrangement: "Full-Time", major: "TLE", minor: "ICT", advisoryClass: "Grade 10 - Pearl", ancillaries: ["Class Adviser", "TLE / Canteen Coordinator"], maxWeeklyHours: 24, schoolLevel: "jhs" },
        { id: "t-jhs-08", name: "Mark Anthony Ramos", sex: "Male", designation: "Teacher I", employmentStatus: "Permanent", workingArrangement: "Full-Time", major: "MAPEH", minor: "Values Education", advisoryClass: "Grade 10 - Garnet", ancillaries: ["Class Adviser", "Sports Development Officer"], maxWeeklyHours: 24, schoolLevel: "jhs" },
        { id: "t-jhs-09", name: "Cynthia Flores", sex: "Female", designation: "Teacher II", employmentStatus: "Permanent", workingArrangement: "Full-Time", major: "Mathematics", minor: "Physics", advisoryClass: "None", ancillaries: ["DRRM Assistant Coordinator"], maxWeeklyHours: 24, schoolLevel: "jhs" },
        { id: "t-jhs-10", name: "Arlene Villanueva", sex: "Female", designation: "Teacher I", employmentStatus: "Permanent", workingArrangement: "Full-Time", major: "English", minor: "Journalism", advisoryClass: "None", ancillaries: ["Reading / Literacy Coordinator"], maxWeeklyHours: 24, schoolLevel: "jhs" },
        { id: "t-jhs-11", name: "Jose Manalo", sex: "Male", designation: "Teacher II", employmentStatus: "Permanent", workingArrangement: "Full-Time", major: "Science", minor: "Chemistry", advisoryClass: "None", ancillaries: ["Science Laboratory In-Charge"], maxWeeklyHours: 24, schoolLevel: "jhs" },
        { id: "t-jhs-12", name: "Maricar Dizon", sex: "Female", designation: "Teacher I", employmentStatus: "Permanent", workingArrangement: "Full-Time", major: "Filipino", minor: "Literature", advisoryClass: "None", ancillaries: ["Cultural Affairs Committee"], maxWeeklyHours: 24, schoolLevel: "jhs" },
        { id: "t-jhs-13", name: "Rolando Pascual", sex: "Male", designation: "Teacher III", employmentStatus: "Permanent", workingArrangement: "Full-Time", major: "Araling Panlipunan", minor: "Economics", advisoryClass: "None", ancillaries: ["DRRM Coordinator"], maxWeeklyHours: 24, schoolLevel: "jhs" },
        { id: "t-jhs-14", name: "Beverly Cruz", sex: "Female", designation: "Teacher I", employmentStatus: "Permanent", workingArrangement: "Full-Time", major: "MAPEH", minor: "Music", advisoryClass: "None", ancillaries: ["SPA Coordinator"], maxWeeklyHours: 24, schoolLevel: "jhs" },
        { id: "t-jhs-15", name: "Christopher David", sex: "Male", designation: "Teacher II", employmentStatus: "Permanent", workingArrangement: "Full-Time", major: "TLE", minor: "Industrial Arts", advisoryClass: "None", ancillaries: ["ICT Laboratory In-Charge"], maxWeeklyHours: 24, schoolLevel: "jhs" },
        { id: "t-jhs-16", name: "Mary Jane Ocampo", sex: "Female", designation: "Teacher I", employmentStatus: "Permanent", workingArrangement: "Full-Time", major: "Values Education", minor: "Guidance", advisoryClass: "None", ancillaries: ["Values Education Coordinator"], maxWeeklyHours: 24, schoolLevel: "jhs" },
      ],
      config: {
        schoolStartTime: "07:30",
        schoolEndTime: "17:00",
        periodDuration: 60,
        periodsPerDay: 8,
        shortenedDuration: 45,
        dayAssignments: {
          Monday: "regular",
          Tuesday: "regular",
          Wednesday: "regular",
          Thursday: "regular",
          Friday: "shortened",
          Saturday: "off",
          Sunday: "off",
        },
        breaks: {
          morning: { enabled: true, duration: 20, afterPeriod: 2 },
          lunch: { enabled: true, duration: 60, afterPeriod: 4 },
          afternoon: { enabled: true, duration: 10, afterPeriod: 6 },
        },
        scheds: [
          { period: 1, time: "07:30 – 08:30", type: "instructional", label: "1st Period (60m)" },
          { period: 2, time: "08:30 – 09:30", type: "instructional", label: "2nd Period (60m)" },
          { period: "break-morning", time: "09:30 – 09:50", type: "break", label: "Morning Recess (20m)" },
          { period: 3, time: "09:50 – 10:50", type: "instructional", label: "3rd Period (60m)" },
          { period: 4, time: "10:50 – 11:50", type: "instructional", label: "4th Period (60m)" },
          { period: "break-lunch", time: "11:50 – 12:50", type: "break", label: "Lunch Break (60m)" },
          { period: 5, time: "12:50 – 13:50", type: "instructional", label: "5th Period (60m)" },
          { period: 6, time: "13:50 – 14:50", type: "instructional", label: "6th Period (60m)" },
          { period: "break-afternoon", time: "14:50 – 15:00", type: "break", label: "Afternoon Break (10m)" },
          { period: 7, time: "15:00 – 16:00", type: "instructional", label: "7th Period (60m)" },
          { period: 8, time: "16:00 – 17:00", type: "instructional", label: "8th Period (60m)" },
        ],
      },
      publishedSchedule: {
        id: "sched-jhs-2025-2026",
        status: "published",
        scheduleType: "jhs",
        schoolYear: "2025-2026",
        publishedAt: "2025-08-22T08:30:00.000Z",
        totalWeeklyHours: 30,
        periodsPerDay: 8,
        timetableSnippet: [
          { day: "Mon", period: 1, time: "07:30 – 08:30", subject: "Mathematics 7", teacher: "Juan Dela Cruz", section: "Grade 7 - Diamond" },
          { day: "Mon", period: 2, time: "08:30 – 09:30", subject: "English 7", teacher: "Maria Santos", section: "Grade 7 - Diamond" },
          { day: "Mon", period: 3, time: "09:50 – 10:50", subject: "Science 7", teacher: "Jose Manalo", section: "Grade 7 - Diamond" },
          { day: "Mon", period: 4, time: "10:50 – 11:50", subject: "Filipino 7", teacher: "Maricar Dizon", section: "Grade 7 - Diamond" },
          { day: "Mon", period: 5, time: "12:50 – 13:50", subject: "Araling Panlipunan 7", teacher: "Roberto Mendoza", section: "Grade 7 - Diamond" },
          { day: "Mon", period: 6, time: "13:50 – 14:50", subject: "Values Education 7", teacher: "Grace Bautista", section: "Grade 7 - Diamond" },
          { day: "Mon", period: 7, time: "15:00 – 16:00", subject: "MAPEH 7", teacher: "Mark Anthony Ramos", section: "Grade 7 - Diamond" },
          { day: "Mon", period: 8, time: "16:00 – 17:00", subject: "Homeroom Guidance (HGP)", teacher: "Juan Dela Cruz", section: "Grade 7 - Diamond" },
        ],
      },
    },
    shs: {
      sectionCount: 6,
      facultyCount: 12,
      sections: [
        { id: "shs-11-0-2025", grade: 11, name: "Grade 11 - STEM Newton", track: "Academic", cluster: "STEM (Science, Tech, Eng, Math)", adviser: "Dr. Fernando Castro" },
        { id: "shs-11-1-2025", grade: 11, name: "Grade 11 - HUMSS Rizal", track: "Academic", cluster: "HUMSS (Humanities & Social Sci)", adviser: "Liza Macaraeg" },
        { id: "shs-11-2-2025", grade: 11, name: "Grade 11 - TVL Tesla", track: "TVL", cluster: "TVL: ICT & Computer Systems", adviser: "Engr. Daniel Panganiban" },
        { id: "shs-12-0-2025", grade: 12, name: "Grade 12 - STEM Einstein", track: "Academic", cluster: "STEM (Science, Tech, Eng, Math)", adviser: "Ronald Gutierrez" },
        { id: "shs-12-1-2025", grade: 12, name: "Grade 12 - HUMSS Mabini", track: "Academic", cluster: "HUMSS (Humanities & Social Sci)", adviser: "Jocelyn Navarro" },
        { id: "shs-12-2-2025", grade: 12, name: "Grade 12 - TVL Edison", track: "TVL", cluster: "TVL: Electrical & TechPro", adviser: "Jonathan Santos" },
      ],
      faculty: [
        { id: "t-shs-01", name: "Dr. Fernando Castro", sex: "Male", designation: "Master Teacher II", employmentStatus: "Permanent", workingArrangement: "Full-Time", major: "STEM", minor: "Physics & Calculus", advisoryClass: "Grade 11 - STEM Newton", ancillaries: ["Class Adviser", "SHS Research Coordinator"], maxWeeklyHours: 24, schoolLevel: "shs" },
        { id: "t-shs-02", name: "Liza Macaraeg", sex: "Female", designation: "Teacher III", employmentStatus: "Permanent", workingArrangement: "Full-Time", major: "HUMSS", minor: "Politics & Literature", advisoryClass: "Grade 11 - HUMSS Rizal", ancillaries: ["Class Adviser", "HUMSS Strand Coordinator"], maxWeeklyHours: 24, schoolLevel: "shs" },
        { id: "t-shs-03", name: "Engr. Daniel Panganiban", sex: "Male", designation: "Teacher II", employmentStatus: "Permanent", workingArrangement: "Full-Time", major: "TVL", minor: "Computer Systems Servicing", advisoryClass: "Grade 11 - TVL Tesla", ancillaries: ["Class Adviser", "TVL Workshop In-Charge"], maxWeeklyHours: 24, schoolLevel: "shs" },
        { id: "t-shs-04", name: "Ronald Gutierrez", sex: "Male", designation: "Teacher II", employmentStatus: "Permanent", workingArrangement: "Full-Time", major: "Science", minor: "Chemistry & Biology", advisoryClass: "Grade 12 - STEM Einstein", ancillaries: ["Class Adviser", "STEM Strand Coordinator"], maxWeeklyHours: 24, schoolLevel: "shs" },
        { id: "t-shs-05", name: "Jocelyn Navarro", sex: "Female", designation: "Teacher III", employmentStatus: "Permanent", workingArrangement: "Full-Time", major: "English", minor: "Research & EAPP", advisoryClass: "Grade 12 - HUMSS Mabini", ancillaries: ["Class Adviser", "Work Immersion Focal Person"], maxWeeklyHours: 24, schoolLevel: "shs" },
        { id: "t-shs-06", name: "Jonathan Santos", sex: "Male", designation: "Teacher II", employmentStatus: "Permanent", workingArrangement: "Full-Time", major: "TVL", minor: "Electronics & TechPro", advisoryClass: "Grade 12 - TVL Edison", ancillaries: ["Class Adviser", "Electrical Lab In-Charge"], maxWeeklyHours: 24, schoolLevel: "shs" },
        { id: "t-shs-07", name: "Angela Soriano", sex: "Female", designation: "Teacher I", employmentStatus: "Permanent", workingArrangement: "Full-Time", major: "ABM", minor: "Entrepreneurship", advisoryClass: "None", ancillaries: ["Entrepreneurship / ABM Coordinator"], maxWeeklyHours: 24, schoolLevel: "shs" },
        { id: "t-shs-08", name: "Ryan Villanueva", sex: "Male", designation: "Teacher II", employmentStatus: "Permanent", workingArrangement: "Full-Time", major: "MAPEH", minor: "PE & Health 1-4", advisoryClass: "None", ancillaries: ["SHS Sports Coordinator"], maxWeeklyHours: 24, schoolLevel: "shs" },
        { id: "t-shs-09", name: "Melanie Cortez", sex: "Female", designation: "Teacher I", employmentStatus: "Permanent", workingArrangement: "Full-Time", major: "Social Sciences", minor: "Philosophy & UCSP", advisoryClass: "None", ancillaries: ["Guidance Counselor Designate"], maxWeeklyHours: 24, schoolLevel: "shs" },
        { id: "t-shs-10", name: "Gregoria Valdez", sex: "Female", designation: "Teacher III", employmentStatus: "Permanent", workingArrangement: "Full-Time", major: "Humanities", minor: "Contemporary Arts", advisoryClass: "None", ancillaries: ["Arts & Culture Coordinator"], maxWeeklyHours: 24, schoolLevel: "shs" },
        { id: "t-shs-11", name: "Katherine Ilagan", sex: "Female", designation: "Teacher I", employmentStatus: "Permanent", workingArrangement: "Full-Time", major: "English", minor: "Media & Info Literacy", advisoryClass: "None", ancillaries: ["School Publication Associate"], maxWeeklyHours: 24, schoolLevel: "shs" },
        { id: "t-shs-12", name: "Victoriano Ramos", sex: "Male", designation: "Teacher II", employmentStatus: "Permanent", workingArrangement: "Full-Time", major: "Mathematics", minor: "Statistics & Probability", advisoryClass: "None", ancillaries: ["Senior High Assessment Focal"], maxWeeklyHours: 24, schoolLevel: "shs" },
      ],
      config: {
        schoolStartTime: "07:30",
        schoolEndTime: "17:00",
        periodDuration: 60,
        periodsPerDay: 8,
        shortenedDuration: 45,
        dayAssignments: {
          Monday: "regular",
          Tuesday: "regular",
          Wednesday: "regular",
          Thursday: "regular",
          Friday: "shortened",
          Saturday: "off",
          Sunday: "off",
        },
        breaks: {
          morning: { enabled: true, duration: 20, afterPeriod: 2 },
          lunch: { enabled: true, duration: 60, afterPeriod: 4 },
          afternoon: { enabled: true, duration: 10, afterPeriod: 6 },
        },
        scheds: [
          { period: 1, time: "07:30 – 08:30", type: "instructional", label: "1st Period (60m)" },
          { period: 2, time: "08:30 – 09:30", type: "instructional", label: "2nd Period (60m)" },
          { period: "break-morning", time: "09:30 – 09:50", type: "break", label: "Morning Recess (20m)" },
          { period: 3, time: "09:50 – 10:50", type: "instructional", label: "3rd Period (60m)" },
          { period: 4, time: "10:50 – 11:50", type: "instructional", label: "4th Period (60m)" },
          { period: "break-lunch", time: "11:50 – 12:50", type: "break", label: "Lunch Break (60m)" },
          { period: 5, time: "12:50 – 13:50", type: "instructional", label: "5th Period (60m)" },
          { period: 6, time: "13:50 – 14:50", type: "instructional", label: "6th Period (60m)" },
          { period: "break-afternoon", time: "14:50 – 15:00", type: "break", label: "Afternoon Break (10m)" },
          { period: 7, time: "15:00 – 16:00", type: "instructional", label: "7th Period (60m)" },
          { period: 8, time: "16:00 – 17:00", type: "instructional", label: "8th Period (60m)" },
        ],
      },
      publishedSchedule: {
        id: "sched-shs-2025-2026",
        status: "published",
        scheduleType: "shs-first",
        schoolYear: "2025-2026",
        publishedAt: "2025-08-22T08:30:00.000Z",
        totalWeeklyHours: 32,
        periodsPerDay: 8,
        timetableSnippet: [
          { day: "Mon", period: 1, time: "07:30 – 08:30", subject: "Pre-Calculus", teacher: "Dr. Fernando Castro", section: "Grade 11 - STEM Newton" },
          { day: "Mon", period: 2, time: "08:30 – 09:30", subject: "General Chemistry 1", teacher: "Ronald Gutierrez", section: "Grade 11 - STEM Newton" },
          { day: "Mon", period: 3, time: "09:50 – 10:50", subject: "Empowerment Technologies", teacher: "Engr. Daniel Panganiban", section: "Grade 11 - STEM Newton" },
          { day: "Mon", period: 4, time: "10:50 – 11:50", subject: "Oral Communication", teacher: "Jocelyn Navarro", section: "Grade 11 - STEM Newton" },
          { day: "Mon", period: 5, time: "12:50 – 13:50", subject: "Komunikasyon at Pananaliksik", teacher: "Liza Macaraeg", section: "Grade 11 - STEM Newton" },
          { day: "Mon", period: 6, time: "13:50 – 14:50", subject: "General Mathematics", teacher: "Victoriano Ramos", section: "Grade 11 - STEM Newton" },
          { day: "Mon", period: 7, time: "15:00 – 16:00", subject: "PE and Health 1", teacher: "Ryan Villanueva", section: "Grade 11 - STEM Newton" },
          { day: "Mon", period: 8, time: "16:00 – 17:00", subject: "Personal Development", teacher: "Melanie Cortez", section: "Grade 11 - STEM Newton" },
        ],
      },
    },
  },

  {
    yearId: "2024-2025",
    academicYear: "2024-2025",
    label: "S.Y. 2024–2025",
    status: "Archived",
    description: "Historical institutional academic year. JHS sections followed Philippine indigenous trees naming scheme; SHS offered STEM, HUMSS, and TVL clusters.",
    dateRange: "August 2024 – June 2025",
    totalSections: 14,
    totalFaculty: 26,
    publishedSchedulesCount: 2,
    jhs: {
      sectionCount: 8,
      facultyCount: 15,
      sections: [
        { id: "jhs-7-0-2024", grade: 7, name: "Grade 7 - Narra", classification: "Regular", adviser: "Juan Dela Cruz" },
        { id: "jhs-7-1-2024", grade: 7, name: "Grade 7 - Molave", classification: "Regular", adviser: "Maria Santos" },
        { id: "jhs-8-0-2024", grade: 8, name: "Grade 8 - Mahogany", classification: "Regular", adviser: "Pedro Reyes" },
        { id: "jhs-8-1-2024", grade: 8, name: "Grade 8 - Acacia", classification: "Regular", adviser: "Elena Garcia" },
        { id: "jhs-9-0-2024", grade: 9, name: "Grade 9 - Yakal", classification: "Regular", adviser: "Roberto Mendoza" },
        { id: "jhs-9-1-2024", grade: 9, name: "Grade 9 - Kamagong", classification: "Regular", adviser: "Grace Bautista" },
        { id: "jhs-10-0-2024", grade: 10, name: "Grade 10 - Ipil", classification: "Regular", adviser: "Teresa Aquino" },
        { id: "jhs-10-1-2024", grade: 10, name: "Grade 10 - Dao", classification: "Regular", adviser: "Mark Anthony Ramos" },
      ],
      faculty: [
        { id: "t-jhs-24-01", name: "Juan Dela Cruz", sex: "Male", designation: "Teacher III", employmentStatus: "Permanent", workingArrangement: "Full-Time", major: "Mathematics", minor: "Science", advisoryClass: "Grade 7 - Narra", ancillaries: ["Class Adviser", "Math Lead"], maxWeeklyHours: 24, schoolLevel: "jhs" },
        { id: "t-jhs-24-02", name: "Maria Santos", sex: "Female", designation: "Teacher II", employmentStatus: "Permanent", workingArrangement: "Full-Time", major: "English", minor: "Values Education", advisoryClass: "Grade 7 - Molave", ancillaries: ["Class Adviser", "Journalism Coach"], maxWeeklyHours: 24, schoolLevel: "jhs" },
        { id: "t-jhs-24-03", name: "Pedro Reyes", sex: "Male", designation: "Teacher II", employmentStatus: "Permanent", workingArrangement: "Full-Time", major: "Science", minor: "Mathematics", advisoryClass: "Grade 8 - Mahogany", ancillaries: ["Class Adviser", "Science Moderator"], maxWeeklyHours: 24, schoolLevel: "jhs" },
        { id: "t-jhs-24-04", name: "Elena Garcia", sex: "Female", designation: "Teacher II", employmentStatus: "Permanent", workingArrangement: "Full-Time", major: "Filipino", minor: "Araling Panlipunan", advisoryClass: "Grade 8 - Acacia", ancillaries: ["Class Adviser"], maxWeeklyHours: 24, schoolLevel: "jhs" },
        { id: "t-jhs-24-05", name: "Roberto Mendoza", sex: "Male", designation: "Teacher I", employmentStatus: "Permanent", workingArrangement: "Full-Time", major: "Araling Panlipunan", minor: "Filipino", advisoryClass: "Grade 9 - Yakal", ancillaries: ["Class Adviser"], maxWeeklyHours: 24, schoolLevel: "jhs" },
        { id: "t-jhs-24-06", name: "Grace Bautista", sex: "Female", designation: "Teacher I", employmentStatus: "Permanent", workingArrangement: "Full-Time", major: "Values Education", minor: "English", advisoryClass: "Grade 9 - Kamagong", ancillaries: ["Class Adviser", "Guidance Associate"], maxWeeklyHours: 24, schoolLevel: "jhs" },
        { id: "t-jhs-24-07", name: "Teresa Aquino", sex: "Female", designation: "Teacher II", employmentStatus: "Permanent", workingArrangement: "Full-Time", major: "TLE", minor: "ICT", advisoryClass: "Grade 10 - Ipil", ancillaries: ["Class Adviser", "Canteen Manager"], maxWeeklyHours: 24, schoolLevel: "jhs" },
        { id: "t-jhs-24-08", name: "Mark Anthony Ramos", sex: "Male", designation: "Teacher I", employmentStatus: "Permanent", workingArrangement: "Full-Time", major: "MAPEH", minor: "Values Education", advisoryClass: "Grade 10 - Dao", ancillaries: ["Class Adviser", "Sports Coach"], maxWeeklyHours: 24, schoolLevel: "jhs" },
        { id: "t-jhs-24-09", name: "Cynthia Flores", sex: "Female", designation: "Teacher I", employmentStatus: "Permanent", workingArrangement: "Full-Time", major: "Mathematics", minor: "Physics", advisoryClass: "None", ancillaries: ["DRRM Assistant"], maxWeeklyHours: 24, schoolLevel: "jhs" },
        { id: "t-jhs-24-10", name: "Arlene Villanueva", sex: "Female", designation: "Teacher I", employmentStatus: "Permanent", workingArrangement: "Full-Time", major: "English", minor: "Journalism", advisoryClass: "None", ancillaries: ["Literacy Coordinator"], maxWeeklyHours: 24, schoolLevel: "jhs" },
        { id: "t-jhs-24-11", name: "Jose Manalo", sex: "Male", designation: "Teacher I", employmentStatus: "Permanent", workingArrangement: "Full-Time", major: "Science", minor: "Chemistry", advisoryClass: "None", ancillaries: ["Lab Assistant"], maxWeeklyHours: 24, schoolLevel: "jhs" },
        { id: "t-jhs-24-12", name: "Maricar Dizon", sex: "Female", designation: "Teacher I", employmentStatus: "Permanent", workingArrangement: "Full-Time", major: "Filipino", minor: "Literature", advisoryClass: "None", ancillaries: ["Cultural Focal"], maxWeeklyHours: 24, schoolLevel: "jhs" },
        { id: "t-jhs-24-13", name: "Rolando Pascual", sex: "Male", designation: "Teacher II", employmentStatus: "Permanent", workingArrangement: "Full-Time", major: "Araling Panlipunan", minor: "Economics", advisoryClass: "None", ancillaries: ["DRRM Coordinator"], maxWeeklyHours: 24, schoolLevel: "jhs" },
        { id: "t-jhs-24-14", name: "Beverly Cruz", sex: "Female", designation: "Teacher I", employmentStatus: "Permanent", workingArrangement: "Full-Time", major: "MAPEH", minor: "Music", advisoryClass: "None", ancillaries: ["Choir Director"], maxWeeklyHours: 24, schoolLevel: "jhs" },
        { id: "t-jhs-24-15", name: "Christopher David", sex: "Male", designation: "Teacher I", employmentStatus: "Permanent", workingArrangement: "Full-Time", major: "TLE", minor: "Industrial Arts", advisoryClass: "None", ancillaries: ["ICT Lab Custodian"], maxWeeklyHours: 24, schoolLevel: "jhs" },
      ],
      config: {
        schoolStartTime: "07:30",
        schoolEndTime: "17:00",
        periodDuration: 60,
        periodsPerDay: 8,
        shortenedDuration: 45,
        dayAssignments: {
          Monday: "regular",
          Tuesday: "regular",
          Wednesday: "regular",
          Thursday: "regular",
          Friday: "shortened",
          Saturday: "off",
          Sunday: "off",
        },
        breaks: {
          morning: { enabled: true, duration: 20, afterPeriod: 2 },
          lunch: { enabled: true, duration: 60, afterPeriod: 4 },
          afternoon: { enabled: true, duration: 10, afterPeriod: 6 },
        },
        scheds: [
          { period: 1, time: "07:30 – 08:30", type: "instructional", label: "1st Period (60m)" },
          { period: 2, time: "08:30 – 09:30", type: "instructional", label: "2nd Period (60m)" },
          { period: "break-morning", time: "09:30 – 09:50", type: "break", label: "Morning Recess (20m)" },
          { period: 3, time: "09:50 – 10:50", type: "instructional", label: "3rd Period (60m)" },
          { period: 4, time: "10:50 – 11:50", type: "instructional", label: "4th Period (60m)" },
          { period: "break-lunch", time: "11:50 – 12:50", type: "break", label: "Lunch Break (60m)" },
          { period: 5, time: "12:50 – 13:50", type: "instructional", label: "5th Period (60m)" },
          { period: 6, time: "13:50 – 14:50", type: "instructional", label: "6th Period (60m)" },
          { period: "break-afternoon", time: "14:50 – 15:00", type: "break", label: "Afternoon Break (10m)" },
          { period: 7, time: "15:00 – 16:00", type: "instructional", label: "7th Period (60m)" },
          { period: 8, time: "16:00 – 17:00", type: "instructional", label: "8th Period (60m)" },
        ],
      },
      publishedSchedule: {
        id: "sched-jhs-2024-2025",
        status: "published",
        scheduleType: "jhs",
        schoolYear: "2024-2025",
        publishedAt: "2024-08-20T08:30:00.000Z",
        totalWeeklyHours: 30,
        periodsPerDay: 8,
        timetableSnippet: [
          { day: "Mon", period: 1, time: "07:30 – 08:30", subject: "Mathematics 7", teacher: "Juan Dela Cruz", section: "Grade 7 - Narra" },
          { day: "Mon", period: 2, time: "08:30 – 09:30", subject: "English 7", teacher: "Maria Santos", section: "Grade 7 - Narra" },
          { day: "Mon", period: 3, time: "09:50 – 10:50", subject: "Science 7", teacher: "Pedro Reyes", section: "Grade 7 - Narra" },
          { day: "Mon", period: 4, time: "10:50 – 11:50", subject: "Filipino 7", teacher: "Elena Garcia", section: "Grade 7 - Narra" },
          { day: "Mon", period: 5, time: "12:50 – 13:50", subject: "Araling Panlipunan 7", teacher: "Roberto Mendoza", section: "Grade 7 - Narra" },
          { day: "Mon", period: 6, time: "13:50 – 14:50", subject: "Values Education 7", teacher: "Grace Bautista", section: "Grade 7 - Narra" },
          { day: "Mon", period: 7, time: "15:00 – 16:00", subject: "MAPEH 7", teacher: "Mark Anthony Ramos", section: "Grade 7 - Narra" },
          { day: "Mon", period: 8, time: "16:00 – 17:00", subject: "Homeroom Guidance", teacher: "Juan Dela Cruz", section: "Grade 7 - Narra" },
        ],
      },
    },
    shs: {
      sectionCount: 6,
      facultyCount: 11,
      sections: [
        { id: "shs-11-0-2024", grade: 11, name: "Grade 11 - STEM Galilei", track: "Academic", cluster: "STEM (Science, Tech, Eng, Math)", adviser: "Dr. Fernando Castro" },
        { id: "shs-11-1-2024", grade: 11, name: "Grade 11 - HUMSS Bonifacio", track: "Academic", cluster: "HUMSS (Humanities & Social Sci)", adviser: "Liza Macaraeg" },
        { id: "shs-11-2-2024", grade: 11, name: "Grade 11 - TVL Ford", track: "TVL", cluster: "TVL: ICT & Computer Systems", adviser: "Engr. Daniel Panganiban" },
        { id: "shs-12-0-2024", grade: 12, name: "Grade 12 - STEM Archimedes", track: "Academic", cluster: "STEM (Science, Tech, Eng, Math)", adviser: "Ronald Gutierrez" },
        { id: "shs-12-1-2024", grade: 12, name: "Grade 12 - HUMSS Del Pilar", track: "Academic", cluster: "HUMSS (Humanities & Social Sci)", adviser: "Jocelyn Navarro" },
        { id: "shs-12-2-2024", grade: 12, name: "Grade 12 - TVL Bell", track: "TVL", cluster: "TVL: Electrical & TechPro", adviser: "Jonathan Santos" },
      ],
      faculty: [
        { id: "t-shs-24-01", name: "Dr. Fernando Castro", sex: "Male", designation: "Master Teacher I", employmentStatus: "Permanent", workingArrangement: "Full-Time", major: "STEM", minor: "Physics & Calculus", advisoryClass: "Grade 11 - STEM Galilei", ancillaries: ["Class Adviser", "SHS Research Lead"], maxWeeklyHours: 24, schoolLevel: "shs" },
        { id: "t-shs-24-02", name: "Liza Macaraeg", sex: "Female", designation: "Teacher II", employmentStatus: "Permanent", workingArrangement: "Full-Time", major: "HUMSS", minor: "Politics & Literature", advisoryClass: "Grade 11 - HUMSS Bonifacio", ancillaries: ["Class Adviser", "Social Studies Lead"], maxWeeklyHours: 24, schoolLevel: "shs" },
        { id: "t-shs-24-03", name: "Engr. Daniel Panganiban", sex: "Male", designation: "Teacher II", employmentStatus: "Permanent", workingArrangement: "Full-Time", major: "TVL", minor: "Computer Systems Servicing", advisoryClass: "Grade 11 - TVL Ford", ancillaries: ["Class Adviser", "TVL Workshop Lead"], maxWeeklyHours: 24, schoolLevel: "shs" },
        { id: "t-shs-24-04", name: "Ronald Gutierrez", sex: "Male", designation: "Teacher I", employmentStatus: "Permanent", workingArrangement: "Full-Time", major: "Science", minor: "Chemistry & Biology", advisoryClass: "Grade 12 - STEM Archimedes", ancillaries: ["Class Adviser"], maxWeeklyHours: 24, schoolLevel: "shs" },
        { id: "t-shs-24-05", name: "Jocelyn Navarro", sex: "Female", designation: "Teacher II", employmentStatus: "Permanent", workingArrangement: "Full-Time", major: "English", minor: "Research & EAPP", advisoryClass: "Grade 12 - HUMSS Del Pilar", ancillaries: ["Class Adviser", "Immersion Focal"], maxWeeklyHours: 24, schoolLevel: "shs" },
        { id: "t-shs-24-06", name: "Jonathan Santos", sex: "Male", designation: "Teacher I", employmentStatus: "Permanent", workingArrangement: "Full-Time", major: "TVL", minor: "Electronics & TechPro", advisoryClass: "Grade 12 - TVL Bell", ancillaries: ["Class Adviser"], maxWeeklyHours: 24, schoolLevel: "shs" },
        { id: "t-shs-24-07", name: "Angela Soriano", sex: "Female", designation: "Teacher I", employmentStatus: "Permanent", workingArrangement: "Full-Time", major: "ABM", minor: "Entrepreneurship", advisoryClass: "None", ancillaries: ["ABM Coordinator"], maxWeeklyHours: 24, schoolLevel: "shs" },
        { id: "t-shs-24-08", name: "Ryan Villanueva", sex: "Male", designation: "Teacher I", employmentStatus: "Permanent", workingArrangement: "Full-Time", major: "MAPEH", minor: "PE & Health 1-4", advisoryClass: "None", ancillaries: ["Sports Focal"], maxWeeklyHours: 24, schoolLevel: "shs" },
        { id: "t-shs-24-09", name: "Melanie Cortez", sex: "Female", designation: "Teacher I", employmentStatus: "Permanent", workingArrangement: "Full-Time", major: "Social Sciences", minor: "Philosophy & UCSP", advisoryClass: "None", ancillaries: ["Guidance Designate"], maxWeeklyHours: 24, schoolLevel: "shs" },
        { id: "t-shs-24-10", name: "Gregoria Valdez", sex: "Female", designation: "Teacher II", employmentStatus: "Permanent", workingArrangement: "Full-Time", major: "Humanities", minor: "Contemporary Arts", advisoryClass: "None", ancillaries: ["Arts Focal"], maxWeeklyHours: 24, schoolLevel: "shs" },
        { id: "t-shs-24-11", name: "Victoriano Ramos", sex: "Male", designation: "Teacher I", employmentStatus: "Permanent", workingArrangement: "Full-Time", major: "Mathematics", minor: "Statistics & Probability", advisoryClass: "None", ancillaries: ["SHS Evaluation Lead"], maxWeeklyHours: 24, schoolLevel: "shs" },
      ],
      config: {
        schoolStartTime: "07:30",
        schoolEndTime: "17:00",
        periodDuration: 60,
        periodsPerDay: 8,
        shortenedDuration: 45,
        dayAssignments: {
          Monday: "regular",
          Tuesday: "regular",
          Wednesday: "regular",
          Thursday: "regular",
          Friday: "shortened",
          Saturday: "off",
          Sunday: "off",
        },
        breaks: {
          morning: { enabled: true, duration: 20, afterPeriod: 2 },
          lunch: { enabled: true, duration: 60, afterPeriod: 4 },
          afternoon: { enabled: true, duration: 10, afterPeriod: 6 },
        },
        scheds: [
          { period: 1, time: "07:30 – 08:30", type: "instructional", label: "1st Period (60m)" },
          { period: 2, time: "08:30 – 09:30", type: "instructional", label: "2nd Period (60m)" },
          { period: "break-morning", time: "09:30 – 09:50", type: "break", label: "Morning Recess (20m)" },
          { period: 3, time: "09:50 – 10:50", type: "instructional", label: "3rd Period (60m)" },
          { period: 4, time: "10:50 – 11:50", type: "instructional", label: "4th Period (60m)" },
          { period: "break-lunch", time: "11:50 – 12:50", type: "break", label: "Lunch Break (60m)" },
          { period: 5, time: "12:50 – 13:50", type: "instructional", label: "5th Period (60m)" },
          { period: 6, time: "13:50 – 14:50", type: "instructional", label: "6th Period (60m)" },
          { period: "break-afternoon", time: "14:50 – 15:00", type: "break", label: "Afternoon Break (10m)" },
          { period: 7, time: "15:00 – 16:00", type: "instructional", label: "7th Period (60m)" },
          { period: 8, time: "16:00 – 17:00", type: "instructional", label: "8th Period (60m)" },
        ],
      },
      publishedSchedule: {
        id: "sched-shs-2024-2025",
        status: "published",
        scheduleType: "shs-first",
        schoolYear: "2024-2025",
        publishedAt: "2024-08-20T08:30:00.000Z",
        totalWeeklyHours: 32,
        periodsPerDay: 8,
        timetableSnippet: [
          { day: "Mon", period: 1, time: "07:30 – 08:30", subject: "Pre-Calculus", teacher: "Dr. Fernando Castro", section: "Grade 11 - STEM Galilei" },
          { day: "Mon", period: 2, time: "08:30 – 09:30", subject: "General Chemistry 1", teacher: "Ronald Gutierrez", section: "Grade 11 - STEM Galilei" },
          { day: "Mon", period: 3, time: "09:50 – 10:50", subject: "Empowerment Technologies", teacher: "Engr. Daniel Panganiban", section: "Grade 11 - STEM Galilei" },
          { day: "Mon", period: 4, time: "10:50 – 11:50", subject: "Oral Communication", teacher: "Jocelyn Navarro", section: "Grade 11 - STEM Galilei" },
          { day: "Mon", period: 5, time: "12:50 – 13:50", subject: "Komunikasyon at Pananaliksik", teacher: "Liza Macaraeg", section: "Grade 11 - STEM Galilei" },
          { day: "Mon", period: 6, time: "13:50 – 14:50", subject: "General Mathematics", teacher: "Victoriano Ramos", section: "Grade 11 - STEM Galilei" },
          { day: "Mon", period: 7, time: "15:00 – 16:00", subject: "PE and Health 1", teacher: "Ryan Villanueva", section: "Grade 11 - STEM Galilei" },
          { day: "Mon", period: 8, time: "16:00 – 17:00", subject: "Personal Development", teacher: "Melanie Cortez", section: "Grade 11 - STEM Galilei" },
        ],
      },
    },
  },

  {
    yearId: "2023-2024",
    academicYear: "2023-2024",
    label: "S.Y. 2023–2024",
    status: "Archived",
    description: "Foundational institutional school year record. JHS sections named after core moral values; SHS offered foundational STEM, HUMSS, and TVL cohorts.",
    dateRange: "August 2023 – June 2024",
    totalSections: 13,
    totalFaculty: 24,
    publishedSchedulesCount: 2,
    jhs: {
      sectionCount: 8,
      facultyCount: 14,
      sections: [
        { id: "jhs-7-0-2023", grade: 7, name: "Grade 7 - Integrity", classification: "Regular", adviser: "Juan Dela Cruz" },
        { id: "jhs-7-1-2023", grade: 7, name: "Grade 7 - Respect", classification: "Regular", adviser: "Maria Santos" },
        { id: "jhs-8-0-2023", grade: 8, name: "Grade 8 - Excellence", classification: "Regular", adviser: "Pedro Reyes" },
        { id: "jhs-8-1-2023", grade: 8, name: "Grade 8 - Discipline", classification: "Regular", adviser: "Elena Garcia" },
        { id: "jhs-9-0-2023", grade: 9, name: "Grade 9 - Compassion", classification: "Regular", adviser: "Roberto Mendoza" },
        { id: "jhs-9-1-2023", grade: 9, name: "Grade 9 - Honesty", classification: "Regular", adviser: "Grace Bautista" },
        { id: "jhs-10-0-2023", grade: 10, name: "Grade 10 - Service", classification: "Regular", adviser: "Teresa Aquino" },
        { id: "jhs-10-1-2023", grade: 10, name: "Grade 10 - Unity", classification: "Regular", adviser: "Mark Anthony Ramos" },
      ],
      faculty: [
        { id: "t-jhs-23-01", name: "Juan Dela Cruz", sex: "Male", designation: "Teacher II", employmentStatus: "Permanent", workingArrangement: "Full-Time", major: "Mathematics", minor: "Science", advisoryClass: "Grade 7 - Integrity", ancillaries: ["Class Adviser", "Math In-Charge"], maxWeeklyHours: 24, schoolLevel: "jhs" },
        { id: "t-jhs-23-02", name: "Maria Santos", sex: "Female", designation: "Teacher II", employmentStatus: "Permanent", workingArrangement: "Full-Time", major: "English", minor: "Values Education", advisoryClass: "Grade 7 - Respect", ancillaries: ["Class Adviser", "English In-Charge"], maxWeeklyHours: 24, schoolLevel: "jhs" },
        { id: "t-jhs-23-03", name: "Pedro Reyes", sex: "Male", designation: "Teacher I", employmentStatus: "Permanent", workingArrangement: "Full-Time", major: "Science", minor: "Mathematics", advisoryClass: "Grade 8 - Excellence", ancillaries: ["Class Adviser", "Science In-Charge"], maxWeeklyHours: 24, schoolLevel: "jhs" },
        { id: "t-jhs-23-04", name: "Elena Garcia", sex: "Female", designation: "Teacher I", employmentStatus: "Permanent", workingArrangement: "Full-Time", major: "Filipino", minor: "Araling Panlipunan", advisoryClass: "Grade 8 - Discipline", ancillaries: ["Class Adviser"], maxWeeklyHours: 24, schoolLevel: "jhs" },
        { id: "t-jhs-23-05", name: "Roberto Mendoza", sex: "Male", designation: "Teacher I", employmentStatus: "Permanent", workingArrangement: "Full-Time", major: "Araling Panlipunan", minor: "Filipino", advisoryClass: "Grade 9 - Compassion", ancillaries: ["Class Adviser"], maxWeeklyHours: 24, schoolLevel: "jhs" },
        { id: "t-jhs-23-06", name: "Grace Bautista", sex: "Female", designation: "Teacher I", employmentStatus: "Permanent", workingArrangement: "Full-Time", major: "Values Education", minor: "English", advisoryClass: "Grade 9 - Honesty", ancillaries: ["Class Adviser", "Guidance Associate"], maxWeeklyHours: 24, schoolLevel: "jhs" },
        { id: "t-jhs-23-07", name: "Teresa Aquino", sex: "Female", designation: "Teacher I", employmentStatus: "Permanent", workingArrangement: "Full-Time", major: "TLE", minor: "ICT", advisoryClass: "Grade 10 - Service", ancillaries: ["Class Adviser"], maxWeeklyHours: 24, schoolLevel: "jhs" },
        { id: "t-jhs-24-08", name: "Mark Anthony Ramos", sex: "Male", designation: "Teacher I", employmentStatus: "Permanent", workingArrangement: "Full-Time", major: "MAPEH", minor: "Values Education", advisoryClass: "Grade 10 - Unity", ancillaries: ["Class Adviser", "Sports In-Charge"], maxWeeklyHours: 24, schoolLevel: "jhs" },
        { id: "t-jhs-23-09", name: "Cynthia Flores", sex: "Female", designation: "Teacher I", employmentStatus: "Permanent", workingArrangement: "Full-Time", major: "Mathematics", minor: "Physics", advisoryClass: "None", ancillaries: ["DRRM Assistant"], maxWeeklyHours: 24, schoolLevel: "jhs" },
        { id: "t-jhs-23-10", name: "Arlene Villanueva", sex: "Female", designation: "Teacher I", employmentStatus: "Permanent", workingArrangement: "Full-Time", major: "English", minor: "Journalism", advisoryClass: "None", ancillaries: ["Reading Coordinator"], maxWeeklyHours: 24, schoolLevel: "jhs" },
        { id: "t-jhs-23-11", name: "Jose Manalo", sex: "Male", designation: "Teacher I", employmentStatus: "Permanent", workingArrangement: "Full-Time", major: "Science", minor: "Chemistry", advisoryClass: "None", ancillaries: ["Lab Assistant"], maxWeeklyHours: 24, schoolLevel: "jhs" },
        { id: "t-jhs-23-12", name: "Rolando Pascual", sex: "Male", designation: "Teacher I", employmentStatus: "Permanent", workingArrangement: "Full-Time", major: "Araling Panlipunan", minor: "Economics", advisoryClass: "None", ancillaries: ["DRRM Coordinator"], maxWeeklyHours: 24, schoolLevel: "jhs" },
        { id: "t-jhs-23-13", name: "Beverly Cruz", sex: "Female", designation: "Teacher I", employmentStatus: "Permanent", workingArrangement: "Full-Time", major: "MAPEH", minor: "Music", advisoryClass: "None", ancillaries: ["Choir Coordinator"], maxWeeklyHours: 24, schoolLevel: "jhs" },
        { id: "t-jhs-23-14", name: "Christopher David", sex: "Male", designation: "Teacher I", employmentStatus: "Permanent", workingArrangement: "Full-Time", major: "TLE", minor: "Industrial Arts", advisoryClass: "None", ancillaries: ["ICT Custodian"], maxWeeklyHours: 24, schoolLevel: "jhs" },
      ],
      config: {
        schoolStartTime: "07:30",
        schoolEndTime: "17:00",
        periodDuration: 60,
        periodsPerDay: 8,
        shortenedDuration: 45,
        dayAssignments: {
          Monday: "regular",
          Tuesday: "regular",
          Wednesday: "regular",
          Thursday: "regular",
          Friday: "shortened",
          Saturday: "off",
          Sunday: "off",
        },
        breaks: {
          morning: { enabled: true, duration: 20, afterPeriod: 2 },
          lunch: { enabled: true, duration: 60, afterPeriod: 4 },
          afternoon: { enabled: true, duration: 10, afterPeriod: 6 },
        },
        scheds: [
          { period: 1, time: "07:30 – 08:30", type: "instructional", label: "1st Period (60m)" },
          { period: 2, time: "08:30 – 09:30", type: "instructional", label: "2nd Period (60m)" },
          { period: "break-morning", time: "09:30 – 09:50", type: "break", label: "Morning Recess (20m)" },
          { period: 3, time: "09:50 – 10:50", type: "instructional", label: "3rd Period (60m)" },
          { period: 4, time: "10:50 – 11:50", type: "instructional", label: "4th Period (60m)" },
          { period: "break-lunch", time: "11:50 – 12:50", type: "break", label: "Lunch Break (60m)" },
          { period: 5, time: "12:50 – 13:50", type: "instructional", label: "5th Period (60m)" },
          { period: 6, time: "13:50 – 14:50", type: "instructional", label: "6th Period (60m)" },
          { period: "break-afternoon", time: "14:50 – 15:00", type: "break", label: "Afternoon Break (10m)" },
          { period: 7, time: "15:00 – 16:00", type: "instructional", label: "7th Period (60m)" },
          { period: 8, time: "16:00 – 17:00", type: "instructional", label: "8th Period (60m)" },
        ],
      },
      publishedSchedule: {
        id: "sched-jhs-2023-2024",
        status: "published",
        scheduleType: "jhs",
        schoolYear: "2023-2024",
        publishedAt: "2023-08-21T08:30:00.000Z",
        totalWeeklyHours: 30,
        periodsPerDay: 8,
        timetableSnippet: [
          { day: "Mon", period: 1, time: "07:30 – 08:30", subject: "Mathematics 7", teacher: "Juan Dela Cruz", section: "Grade 7 - Integrity" },
          { day: "Mon", period: 2, time: "08:30 – 09:30", subject: "English 7", teacher: "Maria Santos", section: "Grade 7 - Integrity" },
          { day: "Mon", period: 3, time: "09:50 – 10:50", subject: "Science 7", teacher: "Pedro Reyes", section: "Grade 7 - Integrity" },
          { day: "Mon", period: 4, time: "10:50 – 11:50", subject: "Filipino 7", teacher: "Elena Garcia", section: "Grade 7 - Integrity" },
          { day: "Mon", period: 5, time: "12:50 – 13:50", subject: "Araling Panlipunan 7", teacher: "Roberto Mendoza", section: "Grade 7 - Integrity" },
          { day: "Mon", period: 6, time: "13:50 – 14:50", subject: "Values Education 7", teacher: "Grace Bautista", section: "Grade 7 - Integrity" },
          { day: "Mon", period: 7, time: "15:00 – 16:00", subject: "MAPEH 7", teacher: "Mark Anthony Ramos", section: "Grade 7 - Integrity" },
          { day: "Mon", period: 8, time: "16:00 – 17:00", subject: "Homeroom Guidance", teacher: "Juan Dela Cruz", section: "Grade 7 - Integrity" },
        ],
      },
    },
    shs: {
      sectionCount: 5,
      facultyCount: 10,
      sections: [
        { id: "shs-11-0-2023", grade: 11, name: "Grade 11 - STEM Curie", track: "Academic", cluster: "STEM (Science, Tech, Eng, Math)", adviser: "Dr. Fernando Castro" },
        { id: "shs-11-1-2023", grade: 11, name: "Grade 11 - HUMSS Jacinto", track: "Academic", cluster: "HUMSS (Humanities & Social Sci)", adviser: "Liza Macaraeg" },
        { id: "shs-11-2-2023", grade: 11, name: "Grade 11 - TVL Whitney", track: "TVL", cluster: "TVL: ICT & Computer Systems", adviser: "Engr. Daniel Panganiban" },
        { id: "shs-12-0-2023", grade: 12, name: "Grade 12 - STEM Pasteur", track: "Academic", cluster: "STEM (Science, Tech, Eng, Math)", adviser: "Ronald Gutierrez" },
        { id: "shs-12-1-2023", grade: 12, name: "Grade 12 - HUMSS Luna", track: "Academic", cluster: "HUMSS (Humanities & Social Sci)", adviser: "Jocelyn Navarro" },
      ],
      faculty: [
        { id: "t-shs-23-01", name: "Dr. Fernando Castro", sex: "Male", designation: "Teacher III", employmentStatus: "Permanent", workingArrangement: "Full-Time", major: "STEM", minor: "Physics & Calculus", advisoryClass: "Grade 11 - STEM Curie", ancillaries: ["Class Adviser", "Science Coordinator"], maxWeeklyHours: 24, schoolLevel: "shs" },
        { id: "t-shs-23-02", name: "Liza Macaraeg", sex: "Female", designation: "Teacher I", employmentStatus: "Permanent", workingArrangement: "Full-Time", major: "HUMSS", minor: "Politics & Literature", advisoryClass: "Grade 11 - HUMSS Jacinto", ancillaries: ["Class Adviser"], maxWeeklyHours: 24, schoolLevel: "shs" },
        { id: "t-shs-23-03", name: "Engr. Daniel Panganiban", sex: "Male", designation: "Teacher I", employmentStatus: "Permanent", workingArrangement: "Full-Time", major: "TVL", minor: "Computer Systems Servicing", advisoryClass: "Grade 11 - TVL Whitney", ancillaries: ["Class Adviser", "TechVoc Coordinator"], maxWeeklyHours: 24, schoolLevel: "shs" },
        { id: "t-shs-23-04", name: "Ronald Gutierrez", sex: "Male", designation: "Teacher I", employmentStatus: "Permanent", workingArrangement: "Full-Time", major: "Science", minor: "Chemistry & Biology", advisoryClass: "Grade 12 - STEM Pasteur", ancillaries: ["Class Adviser"], maxWeeklyHours: 24, schoolLevel: "shs" },
        { id: "t-shs-23-05", name: "Jocelyn Navarro", sex: "Female", designation: "Teacher I", employmentStatus: "Permanent", workingArrangement: "Full-Time", major: "English", minor: "Research & EAPP", advisoryClass: "Grade 12 - HUMSS Luna", ancillaries: ["Class Adviser", "Immersion Coordinator"], maxWeeklyHours: 24, schoolLevel: "shs" },
        { id: "t-shs-23-06", name: "Jonathan Santos", sex: "Male", designation: "Teacher I", employmentStatus: "Permanent", workingArrangement: "Full-Time", major: "TVL", minor: "Electronics & TechPro", advisoryClass: "None", ancillaries: ["Electrical In-Charge"], maxWeeklyHours: 24, schoolLevel: "shs" },
        { id: "t-shs-23-07", name: "Angela Soriano", sex: "Female", designation: "Teacher I", employmentStatus: "Permanent", workingArrangement: "Full-Time", major: "ABM", minor: "Entrepreneurship", advisoryClass: "None", ancillaries: ["ABM In-Charge"], maxWeeklyHours: 24, schoolLevel: "shs" },
        { id: "t-shs-23-08", name: "Ryan Villanueva", sex: "Male", designation: "Teacher I", employmentStatus: "Permanent", workingArrangement: "Full-Time", major: "MAPEH", minor: "PE & Health 1-4", advisoryClass: "None", ancillaries: ["Sports Coordinator"], maxWeeklyHours: 24, schoolLevel: "shs" },
        { id: "t-shs-23-09", name: "Melanie Cortez", sex: "Female", designation: "Teacher I", employmentStatus: "Permanent", workingArrangement: "Full-Time", major: "Social Sciences", minor: "Philosophy & UCSP", advisoryClass: "None", ancillaries: ["Guidance Assistant"], maxWeeklyHours: 24, schoolLevel: "shs" },
        { id: "t-shs-23-10", name: "Victoriano Ramos", sex: "Male", designation: "Teacher I", employmentStatus: "Permanent", workingArrangement: "Full-Time", major: "Mathematics", minor: "Statistics & Probability", advisoryClass: "None", ancillaries: ["Evaluation Coordinator"], maxWeeklyHours: 24, schoolLevel: "shs" },
      ],
      config: {
        schoolStartTime: "07:30",
        schoolEndTime: "17:00",
        periodDuration: 60,
        periodsPerDay: 8,
        shortenedDuration: 45,
        dayAssignments: {
          Monday: "regular",
          Tuesday: "regular",
          Wednesday: "regular",
          Thursday: "regular",
          Friday: "shortened",
          Saturday: "off",
          Sunday: "off",
        },
        breaks: {
          morning: { enabled: true, duration: 20, afterPeriod: 2 },
          lunch: { enabled: true, duration: 60, afterPeriod: 4 },
          afternoon: { enabled: true, duration: 10, afterPeriod: 6 },
        },
        scheds: [
          { period: 1, time: "07:30 – 08:30", type: "instructional", label: "1st Period (60m)" },
          { period: 2, time: "08:30 – 09:30", type: "instructional", label: "2nd Period (60m)" },
          { period: "break-morning", time: "09:30 – 09:50", type: "break", label: "Morning Recess (20m)" },
          { period: 3, time: "09:50 – 10:50", type: "instructional", label: "3rd Period (60m)" },
          { period: 4, time: "10:50 – 11:50", type: "instructional", label: "4th Period (60m)" },
          { period: "break-lunch", time: "11:50 – 12:50", type: "break", label: "Lunch Break (60m)" },
          { period: 5, time: "12:50 – 13:50", type: "instructional", label: "5th Period (60m)" },
          { period: 6, time: "13:50 – 14:50", type: "instructional", label: "6th Period (60m)" },
          { period: "break-afternoon", time: "14:50 – 15:00", type: "break", label: "Afternoon Break (10m)" },
          { period: 7, time: "15:00 – 16:00", type: "instructional", label: "7th Period (60m)" },
          { period: 8, time: "16:00 – 17:00", type: "instructional", label: "8th Period (60m)" },
        ],
      },
      publishedSchedule: {
        id: "sched-shs-2023-2024",
        status: "published",
        scheduleType: "shs-first",
        schoolYear: "2023-2024",
        publishedAt: "2023-08-21T08:30:00.000Z",
        totalWeeklyHours: 32,
        periodsPerDay: 8,
        timetableSnippet: [
          { day: "Mon", period: 1, time: "07:30 – 08:30", subject: "Pre-Calculus", teacher: "Dr. Fernando Castro", section: "Grade 11 - STEM Curie" },
          { day: "Mon", period: 2, time: "08:30 – 09:30", subject: "General Chemistry 1", teacher: "Ronald Gutierrez", section: "Grade 11 - STEM Curie" },
          { day: "Mon", period: 3, time: "09:50 – 10:50", subject: "Empowerment Technologies", teacher: "Engr. Daniel Panganiban", section: "Grade 11 - STEM Curie" },
          { day: "Mon", period: 4, time: "10:50 – 11:50", subject: "Oral Communication", teacher: "Jocelyn Navarro", section: "Grade 11 - STEM Curie" },
          { day: "Mon", period: 5, time: "12:50 – 13:50", subject: "Komunikasyon at Pananaliksik", teacher: "Liza Macaraeg", section: "Grade 11 - STEM Curie" },
          { day: "Mon", period: 6, time: "13:50 – 14:50", subject: "General Mathematics", teacher: "Victoriano Ramos", section: "Grade 11 - STEM Curie" },
          { day: "Mon", period: 7, time: "15:00 – 16:00", subject: "PE and Health 1", teacher: "Ryan Villanueva", section: "Grade 11 - STEM Curie" },
          { day: "Mon", period: 8, time: "16:00 – 17:00", subject: "Personal Development", teacher: "Melanie Cortez", section: "Grade 11 - STEM Curie" },
        ],
      },
    },
  },
];

const DEFAULT_ARCHIVE_SUBJECTS_JHS = [
  { id: "jhs-eng", subjectCode: "ENG", subjectName: "English", schoolLevel: "jhs", subjectType: "Core", gradeLevel: "7-10", classesPerWeek: 4, dailyMinutes: 60, programScope: "Universal" },
  { id: "jhs-math", subjectCode: "MATH", subjectName: "Mathematics", schoolLevel: "jhs", subjectType: "Core", gradeLevel: "7-10", classesPerWeek: 4, dailyMinutes: 60, programScope: "Universal" },
  { id: "jhs-sci", subjectCode: "SCI", subjectName: "Science", schoolLevel: "jhs", subjectType: "Core", gradeLevel: "7-10", classesPerWeek: 4, dailyMinutes: 60, programScope: "Universal" },
  { id: "jhs-fil", subjectCode: "FIL", subjectName: "Filipino", schoolLevel: "jhs", subjectType: "Core", gradeLevel: "7-10", classesPerWeek: 4, dailyMinutes: 60, programScope: "Universal" },
  { id: "jhs-ap", subjectCode: "AP", subjectName: "Araling Panlipunan", schoolLevel: "jhs", subjectType: "Core", gradeLevel: "7-10", classesPerWeek: 4, dailyMinutes: 60, programScope: "Universal" },
  { id: "jhs-ve", subjectCode: "VE", subjectName: "Values Education (EsP)", schoolLevel: "jhs", subjectType: "Core", gradeLevel: "7-10", classesPerWeek: 4, dailyMinutes: 60, programScope: "Universal" },
  { id: "jhs-mapeh", subjectCode: "MAPEH", subjectName: "MAPEH", schoolLevel: "jhs", subjectType: "Core", gradeLevel: "7-10", classesPerWeek: 4, dailyMinutes: 60, programScope: "Universal" },
  { id: "jhs-tle", subjectCode: "TLE", subjectName: "Technology & Livelihood Education", schoolLevel: "jhs", subjectType: "Specialized", gradeLevel: "7-10", classesPerWeek: 4, dailyMinutes: 60, programScope: "Regular, SPA" },
  { id: "jhs-spaspec", subjectCode: "SPASPEC", subjectName: "SPA Specialization", schoolLevel: "jhs", subjectType: "Specialized", gradeLevel: "7-10", classesPerWeek: 4, dailyMinutes: 60, programScope: "SPA", teachingMode: "breakout", requiredTeachers: 3 },
  { id: "jhs-ict-spj", subjectCode: "ICT-SPJ", subjectName: "ICT (SPJ)", schoolLevel: "jhs", subjectType: "Specialized", gradeLevel: "7-10", classesPerWeek: 4, dailyMinutes: 60, programScope: "SPJ" },
  { id: "jhs-ict-stem", subjectCode: "ICT-STEM", subjectName: "ICT (SP-STEM)", schoolLevel: "jhs", subjectType: "Specialized", gradeLevel: "7-10", classesPerWeek: 3, dailyMinutes: 60, programScope: "SP-STEM" },
  { id: "jhs-elemalg", subjectCode: "ELEMALG", subjectName: "Elementary Algebra", schoolLevel: "jhs", subjectType: "Specialized", gradeLevel: "7", classesPerWeek: 3, dailyMinutes: 60, programScope: "SP-STEM" },
  { id: "jhs-envsci", subjectCode: "ENVSCI", subjectName: "Environmental Science", schoolLevel: "jhs", subjectType: "Specialized", gradeLevel: "7", classesPerWeek: 3, dailyMinutes: 60, programScope: "SP-STEM" },
  { id: "jhs-devread", subjectCode: "DEVREAD", subjectName: "Developmental Reading", schoolLevel: "jhs", subjectType: "Specialized", gradeLevel: "7", classesPerWeek: 1, dailyMinutes: 60, programScope: "SP-STEM" },
  { id: "jhs-hgp", subjectCode: "HGP", subjectName: "Homeroom Guidance (HGP)", schoolLevel: "jhs", subjectType: "Enrichment", gradeLevel: "7-10", classesPerWeek: 1, dailyMinutes: 60, programScope: "Universal" },
  { id: "jhs-aral", subjectCode: "ARAL", subjectName: "Aral Program", schoolLevel: "jhs", subjectType: "Enrichment", gradeLevel: "7-10", classesPerWeek: 1, dailyMinutes: 60, programScope: "Regular" },
];

const DEFAULT_ARCHIVE_SUBJECTS_SHS = [
  { id: "shs-oralcom", subjectCode: "ORALCOM", subjectName: "Oral Communication in Context", schoolLevel: "shs", subjectType: "Core", gradeLevel: "11", classesPerWeek: 4, dailyMinutes: 60, semester: "First Semester" },
  { id: "shs-genmath", subjectCode: "GENMATH", subjectName: "General Mathematics", schoolLevel: "shs", subjectType: "Core", gradeLevel: "11", classesPerWeek: 4, dailyMinutes: 60, semester: "First Semester" },
  { id: "shs-earthsci", subjectCode: "EARTHSCI", subjectName: "Earth and Life Science", schoolLevel: "shs", subjectType: "Core", gradeLevel: "11", classesPerWeek: 4, dailyMinutes: 60, semester: "First Semester" },
  { id: "shs-kompan", subjectCode: "KOMPAN", subjectName: "Komunikasyon at Pananaliksik", schoolLevel: "shs", subjectType: "Core", gradeLevel: "11", classesPerWeek: 4, dailyMinutes: 60, semester: "First Semester" },
  { id: "shs-perdev", subjectCode: "PERDEV", subjectName: "Personal Development", schoolLevel: "shs", subjectType: "Core", gradeLevel: "11", classesPerWeek: 4, dailyMinutes: 60, semester: "First Semester" },
  { id: "shs-peh1", subjectCode: "PEH1", subjectName: "Physical Education and Health 1", schoolLevel: "shs", subjectType: "Core", gradeLevel: "11", classesPerWeek: 2, dailyMinutes: 60, semester: "First Semester" },
  { id: "shs-emptech", subjectCode: "EMPTECH", subjectName: "Empowerment Technologies", schoolLevel: "shs", subjectType: "Applied", gradeLevel: "11", classesPerWeek: 4, dailyMinutes: 60, semester: "First Semester" },
  { id: "shs-precalc", subjectCode: "PRECALC", subjectName: "Pre-Calculus", schoolLevel: "shs", subjectType: "Specialized", gradeLevel: "11", classesPerWeek: 4, dailyMinutes: 60, strand: "STEM", semester: "First Semester" },
  { id: "shs-genchem1", subjectCode: "GENCHEM1", subjectName: "General Chemistry 1", schoolLevel: "shs", subjectType: "Specialized", gradeLevel: "11", classesPerWeek: 4, dailyMinutes: 60, strand: "STEM", semester: "First Semester" },
  { id: "shs-crewrite", subjectCode: "CREWRITE", subjectName: "Creative Writing", schoolLevel: "shs", subjectType: "Specialized", gradeLevel: "11", classesPerWeek: 4, dailyMinutes: 60, strand: "HUMSS", semester: "First Semester" },
  { id: "shs-css1", subjectCode: "CSS1", subjectName: "Computer Systems Servicing 1", schoolLevel: "shs", subjectType: "Specialized", gradeLevel: "11", classesPerWeek: 4, dailyMinutes: 60, strand: "TVL", semester: "First Semester" },
];

function inferThemeFromSectionNames(sections = [], yearId = "") {
  const joined = sections.map((s) => s?.name || "").join(" ").toLowerCase();
  if (joined.includes("diamond") || joined.includes("ruby") || joined.includes("emerald") || joined.includes("sapphire")) return "Gems & Precious Stones";
  if (joined.includes("narra") || joined.includes("molave") || joined.includes("mahogany") || joined.includes("acacia")) return "Philippine Native Trees";
  if (joined.includes("integrity") || joined.includes("respect") || joined.includes("excellence") || joined.includes("discipline")) return "DepEd Core Values";
  if (joined.includes("newton") || joined.includes("einstein") || joined.includes("curie") || joined.includes("tesla") || joined.includes("galileo")) return "World Scientists & Innovators";
  if (joined.includes("rizal") || joined.includes("mabini") || joined.includes("bonifacio") || joined.includes("luna")) return "Philippine National Heroes";
  if (joined.includes("orion") || joined.includes("lyra") || joined.includes("aquila")) return "Constellations";
  if (joined.includes("mercury") || joined.includes("venus") || joined.includes("jupiter")) return "Planets";
  if (yearId === "2025-2026") return "Gems & Scientists";
  if (yearId === "2024-2025") return "Philippine Trees & Heroes";
  return "Core Values & Scientists";
}

export function enrichHistoricalYearAnalytics(yearObj) {
  if (!yearObj) return yearObj;

  const enrichLevel = (lvlData, levelKey) => {
    if (!lvlData) return lvlData;
    const sections = Array.isArray(lvlData.sections) ? lvlData.sections : [];
    const faculty = Array.isArray(lvlData.faculty) ? lvlData.faculty : [];
    const subjects = Array.isArray(lvlData.subjects) && lvlData.subjects.length > 0
      ? lvlData.subjects
      : (levelKey === "shs" ? DEFAULT_ARCHIVE_SUBJECTS_SHS : DEFAULT_ARCHIVE_SUBJECTS_JHS);

    // Compute grade-level themes
    const grades = levelKey === "shs" ? [11, 12] : [7, 8, 9, 10];
    const sectionThemesByGrade = lvlData.sectionThemesByGrade || {};
    grades.forEach((g) => {
      if (!sectionThemesByGrade[g]) {
        const gSecs = sections.filter((s) => Number(s.grade) === g);
        sectionThemesByGrade[g] = {
          grade: g,
          theme: gSecs[0]?.theme || inferThemeFromSectionNames(gSecs, yearObj.yearId),
          count: gSecs.length,
          sampleNames: gSecs.map((s) => String(s.name || "").replace(/^Grade\s*\d+\s*-\s*/i, "")).slice(0, 4),
        };
      }
    });

    // Compute Ancillary & Advisory summary
    const advisersList = [];
    const coordinatorsList = [];
    faculty.forEach((f) => {
      if (f.advisoryClass && f.advisoryClass !== "None") {
        advisersList.push({ teacherName: f.name, sectionName: f.advisoryClass, major: f.major });
      }
      const anc = Array.isArray(f.ancillaries) ? f.ancillaries : (Array.isArray(f.ancillaryAssignments) ? f.ancillaryAssignments : []);
      anc.forEach((role) => {
        if (String(role).toLowerCase() !== "class adviser") {
          coordinatorsList.push({ teacherName: f.name, role, designation: f.designation });
        }
      });
    });

    // Compute Department / Major distribution
    const deptCounts = {};
    faculty.forEach((f) => {
      const m = f.major || f.department || "General";
      deptCounts[m] = (deptCounts[m] || 0) + 1;
    });

    // Compute Program / Classification distribution
    const programCounts = {};
    sections.forEach((s) => {
      const p = levelKey === "shs" ? (s.cluster ? s.cluster.split(" (")[0] : (s.track || "Academic")) : (s.classification || "Regular");
      programCounts[p] = (programCounts[p] || 0) + 1;
    });

    // Compute Subject type distribution
    const subjectTypeCounts = { Core: 0, Specialized: 0, Applied: 0, Enrichment: 0 };
    let totalWeeklyPeriodsPerSection = 0;
    subjects.forEach((sub) => {
      const t = sub.subjectType || "Core";
      subjectTypeCounts[t] = (subjectTypeCounts[t] || 0) + 1;
      if (t === "Core" || sub.programScope === "Universal") {
        totalWeeklyPeriodsPerSection += Number(sub.classesPerWeek) || 4;
      }
    });

    return {
      ...lvlData,
      sectionCount: sections.length,
      facultyCount: faculty.length,
      subjectCount: subjects.length,
      subjects,
      sectionThemesByGrade,
      ancillarySummary: {
        advisersCount: advisersList.length,
        coordinatorsCount: coordinatorsList.length,
        totalRolesCount: advisersList.length + coordinatorsList.length,
        advisersList,
        coordinatorsList,
      },
      analytics: {
        deptCounts,
        programCounts,
        subjectTypeCounts,
        totalWeeklyPeriodsAssigned: sections.length * Math.max(30, totalWeeklyPeriodsPerSection),
        conflictsCount: 0,
      },
    };
  };

  const enrichedJhs = enrichLevel(yearObj.jhs, "jhs");
  const enrichedShs = enrichLevel(yearObj.shs, "shs");

  const totalSubjects = (enrichedJhs?.subjectCount || 0) + (enrichedShs?.subjectCount || 0);
  const totalAncillaries =
    (enrichedJhs?.ancillarySummary?.totalRolesCount || 0) +
    (enrichedShs?.ancillarySummary?.totalRolesCount || 0);
  const totalThemes =
    Object.keys(enrichedJhs?.sectionThemesByGrade || {}).length +
    Object.keys(enrichedShs?.sectionThemesByGrade || {}).length;

  return {
    ...yearObj,
    totalSections: (enrichedJhs?.sectionCount || 0) + (enrichedShs?.sectionCount || 0),
    totalFaculty: (enrichedJhs?.facultyCount || 0) + (enrichedShs?.facultyCount || 0),
    totalSubjects,
    totalAncillaries,
    totalThemes,
    jhs: enrichedJhs,
    shs: enrichedShs,
  };
}

/**
 * Validates an academic year string (e.g. "2026-2027").
 * Checks format (YYYY-YYYY), numeric range (2000-2099), and consecutive year span (endYear === startYear + 1).
 * Optionally compares against currentYear to detect rollover mismatches.
 */
export function validateAcademicYearLabel(rawVal, options = {}) {
  const { isRolloverTarget = false, currentYear = "" } = options;
  const trimmed = String(rawVal || "").trim().replace(/–/g, "-");

  if (!trimmed) {
    return {
      valid: false,
      normalized: "",
      error: "Academic Year label is required (format: YYYY-YYYY, e.g., 2026-2027).",
    };
  }

  if (/[a-zA-Z]/.test(trimmed)) {
    return {
      valid: false,
      normalized: trimmed,
      error: "Invalid characters: Letters are not allowed. Enter two 4-digit years separated by a hyphen (e.g., 2026-2027).",
    };
  }

  const match = trimmed.match(/^(\d{4})\s*-\s*(\d{4})$/);
  if (!match) {
    return {
      valid: false,
      normalized: trimmed,
      error: "Invalid format: Must follow YYYY-YYYY format (e.g., 2026-2027).",
    };
  }

  const startYear = parseInt(match[1], 10);
  const endYear = parseInt(match[2], 10);
  const normalized = `${startYear}-${endYear}`;

  if (startYear < 2000 || startYear > 2099 || endYear < 2001 || endYear > 2100) {
    return {
      valid: false,
      normalized,
      error: `Out of range (${normalized}): Academic year must be between 2000-2001 and 2099-2100.`,
    };
  }

  if (endYear <= startYear) {
    return {
      valid: false,
      normalized,
      expected: `${startYear}-${startYear + 1}`,
      error: `Year mismatch (${normalized}): End year (${endYear}) must be 1 year after start year (${startYear}). Expected ${startYear}-${startYear + 1}.`,
    };
  }

  if (endYear !== startYear + 1) {
    return {
      valid: false,
      normalized,
      expected: `${startYear}-${startYear + 1}`,
      error: `Year span mismatch (${normalized}): School year must span 1 consecutive academic year (${startYear}-${startYear + 1}), not ${endYear - startYear} years.`,
    };
  }

  if (isRolloverTarget && currentYear) {
    const cleanCur = String(currentYear).trim().replace(/–/g, "-");
    const curMatch = cleanCur.match(/^(\d{4})-(\d{4})$/);
    if (curMatch) {
      const curStart = parseInt(curMatch[1], 10);
      const expectedNext = `${curStart + 1}-${curStart + 2}`;
      if (normalized === cleanCur) {
        return {
          valid: false,
          normalized,
          expected: expectedNext,
          error: `Duplicate year mismatch: S.Y. ${normalized} is already the current active school year. Expected ${expectedNext}.`,
        };
      }
      if (startYear < curStart) {
        return {
          valid: false,
          normalized,
          expected: expectedNext,
          error: `Chronological mismatch: Target year (${normalized}) is earlier than current active year (${cleanCur}). Expected ${expectedNext}.`,
        };
      }
      if (startYear > curStart + 1) {
        return {
          valid: true,
          normalized,
          expected: expectedNext,
          warning: `Notice: Skipping ahead ${startYear - curStart} years from ${cleanCur} to ${normalized} (consecutive next year is ${expectedNext}).`,
        };
      }
    }
  }

  return { valid: true, normalized, startYear, endYear, error: null, warning: null };
}

/**
 * Loads the historical school years from local storage, fallback to defaults
 */
export function getHistoricalSchoolYears() {
  if (typeof window === "undefined") return DEFAULT_HISTORICAL_YEARS.map(enrichHistoricalYearAnalytics);
  try {
    const raw = window.localStorage.getItem(HISTORICAL_STORAGE_KEY);
    if (!raw) {
      const enrichedDefaults = DEFAULT_HISTORICAL_YEARS.map(enrichHistoricalYearAnalytics);
      window.localStorage.setItem(HISTORICAL_STORAGE_KEY, JSON.stringify(enrichedDefaults));
      return enrichedDefaults;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const validList = parsed.filter((y) => y && validateAcademicYearLabel(y.academicYear || y.yearId).valid);
      if (validList.length > 0) {
        if (validList.length !== parsed.length) {
          window.localStorage.setItem(HISTORICAL_STORAGE_KEY, JSON.stringify(validList.map(enrichHistoricalYearAnalytics)));
        }
        return validList.map(enrichHistoricalYearAnalytics);
      }
    }
    const enrichedDefaults = DEFAULT_HISTORICAL_YEARS.map(enrichHistoricalYearAnalytics);
    window.localStorage.setItem(HISTORICAL_STORAGE_KEY, JSON.stringify(enrichedDefaults));
    return enrichedDefaults;
  } catch (e) {
    return DEFAULT_HISTORICAL_YEARS.map(enrichHistoricalYearAnalytics);
  }
}

/**
 * Saves modified historical school years list
 */
export function saveHistoricalSchoolYears(yearsList) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(HISTORICAL_STORAGE_KEY, JSON.stringify(yearsList));
  } catch (e) {
    console.error("Failed to save historical school years:", e);
  }
}

/**
 * Reuses / Copies Sections from a Historical Year into the active school year
 */
export function reuseSectionsFromYear(historicalYearObj, targetLevel = "both") {
  if (typeof window === "undefined" || !historicalYearObj) return { success: false, count: 0 };
  try {
    const existingRaw = window.localStorage.getItem("turotugma_sections_created");
    let existingObj = { jhs: {}, shs: {} };
    if (existingRaw) {
      try {
        const parsed = JSON.parse(existingRaw);
        if (parsed && typeof parsed === "object") existingObj = parsed;
      } catch (e) {}
    }

    let count = 0;

    // Convert JHS sections array into grade-grouped object format expected by SectionsManagement
    if (targetLevel === "both" || targetLevel === "jhs") {
      const jhsSections = historicalYearObj.jhs?.sections || [];
      const jhsThemes = historicalYearObj.jhs?.sectionThemesByGrade || {};
      const jhsGrouped = {};
      [7, 8, 9, 10].forEach((g) => {
        const gradeSecs = jhsSections.filter((s) => Number(s.grade) === g);
        const themeName = jhsThemes[g]?.theme || gradeSecs[0]?.theme || ("Historical S.Y. " + historicalYearObj.academicYear);
        jhsGrouped[g] = {
          count: gradeSecs.length,
          totalSections: gradeSecs.length,
          theme: themeName,
          sections: gradeSecs.map((s) => ({
            name: s.name,
            classification: s.classification || "Regular",
          })),
        };
        count += gradeSecs.length;
      });
      existingObj.jhs = jhsGrouped;
    }

    // Convert SHS sections array into grade-grouped object format
    if (targetLevel === "both" || targetLevel === "shs") {
      const shsSections = historicalYearObj.shs?.sections || [];
      const shsThemes = historicalYearObj.shs?.sectionThemesByGrade || {};
      const shsGrouped = {};
      [11, 12].forEach((g) => {
        const gradeSecs = shsSections.filter((s) => Number(s.grade) === g);
        const themeName = shsThemes[g]?.theme || gradeSecs[0]?.theme || ("Historical S.Y. " + historicalYearObj.academicYear);
        shsGrouped[g] = {
          count: gradeSecs.length,
          totalSections: gradeSecs.length,
          theme: themeName,
          sections: gradeSecs.map((s) => ({
            name: s.name,
            track: s.track || "Academic",
            cluster: s.cluster || "STEM (Science, Tech, Eng, Math)",
          })),
        };
        count += gradeSecs.length;
      });
      existingObj.shs = shsGrouped;
    }

    existingObj.createdAt = new Date().toISOString();
    existingObj.importedFromYear = historicalYearObj.academicYear;

    window.localStorage.setItem("turotugma_sections_created", JSON.stringify(existingObj));
    window.dispatchEvent(new Event("turotugma:sections-updated"));
    return { success: true, count };
  } catch (err) {
    console.error("Error reusing sections:", err);
    return { success: false, count: 0, error: err.message };
  }
}

/**
 * Reuses / Copies Subjects Catalog from a Historical Year into the active school year
 */
export function reuseSubjectsFromYear(historicalYearObj, targetLevel = "both") {
  if (typeof window === "undefined" || !historicalYearObj) return { success: false, count: 0 };
  try {
    const enriched = enrichHistoricalYearAnalytics(historicalYearObj);
    const existingRaw = window.localStorage.getItem("turotugma_subjects");
    let currentSubjects = [];
    if (existingRaw) {
      try {
        const parsed = JSON.parse(existingRaw);
        if (Array.isArray(parsed)) currentSubjects = parsed;
      } catch (e) {}
    }

    const jhsSubjs = enriched.jhs?.subjects || DEFAULT_ARCHIVE_SUBJECTS_JHS;
    const shsSubjs = enriched.shs?.subjects || DEFAULT_ARCHIVE_SUBJECTS_SHS;

    let nextSubjects = [];
    if (targetLevel === "both") {
      nextSubjects = [...jhsSubjs, ...shsSubjs];
    } else if (targetLevel === "jhs") {
      const keptShs = currentSubjects.filter((s) => s?.schoolLevel === "shs");
      nextSubjects = [...jhsSubjs, ...keptShs];
    } else if (targetLevel === "shs") {
      const keptJhs = currentSubjects.filter((s) => s?.schoolLevel !== "shs");
      nextSubjects = [...keptJhs, ...shsSubjs];
    }

    window.localStorage.setItem("turotugma_subjects", JSON.stringify(nextSubjects));
    window.dispatchEvent(new CustomEvent("turotugma_subjects_updated", { detail: nextSubjects }));
    window.dispatchEvent(new Event("turotugma:subjects-updated"));
    return { success: true, count: nextSubjects.length };
  } catch (err) {
    console.error("Error reusing subjects:", err);
    return { success: false, count: 0, error: err.message };
  }
}

/**
 * Reuses / Copies Section Naming Themes & Vocabulary from a Historical Year
 */
export function reuseNamingThemesFromYear(historicalYearObj) {
  if (typeof window === "undefined" || !historicalYearObj) return { success: false, count: 0 };
  try {
    if (historicalYearObj.namingSchemes && typeof historicalYearObj.namingSchemes === "object") {
      window.localStorage.setItem("turotugma_naming_schemes", JSON.stringify(historicalYearObj.namingSchemes));
      return { success: true, count: Object.keys(historicalYearObj.namingSchemes).length };
    }
    return { success: true, count: 6 };
  } catch (err) {
    return { success: false, count: 0, error: err.message };
  }
}

/**
 * Reuses / Copies Faculty Roster & Ancillaries from a Historical Year into the active school year
 */
export function reuseFacultyFromYear(historicalYearObj, targetLevel = "both", includeAncillaries = true) {
  if (typeof window === "undefined" || !historicalYearObj) return { success: false, count: 0 };
  try {
    let importedFaculty = [];
    if (targetLevel === "both") {
      importedFaculty = [
        ...(historicalYearObj.jhs?.faculty || []),
        ...(historicalYearObj.shs?.faculty || []),
      ];
    } else if (targetLevel === "jhs") {
      importedFaculty = historicalYearObj.jhs?.faculty || [];
    } else if (targetLevel === "shs") {
      importedFaculty = historicalYearObj.shs?.faculty || [];
    }

    const nextFaculty = importedFaculty.map((f, idx) => {
      const ancList = includeAncillaries
        ? (Array.isArray(f.ancillaries) ? f.ancillaries : (f.advisoryClass && f.advisoryClass !== "None" ? ["Class Adviser"] : []))
        : [];
      return {
        ...f,
        id: f.id || `teacher-import-${idx + 1}`,
        advisoryClass: includeAncillaries ? (f.advisoryClass || "None") : "None",
        isClassAdviser: includeAncillaries ? Boolean(f.advisoryClass && f.advisoryClass !== "None") : false,
        ancillaries: ancList,
        ancillaryAssignments: ancList,
        updatedAt: new Date().toISOString(),
        importedFromYear: historicalYearObj.academicYear,
      };
    });

    window.localStorage.setItem("turotugma_faculty", JSON.stringify(nextFaculty));
    window.dispatchEvent(new Event("turotugma_faculty_updated"));
    window.dispatchEvent(new Event("turotugma:faculty-updated"));
    return { success: true, count: nextFaculty.length };
  } catch (err) {
    console.error("Error reusing faculty:", err);
    return { success: false, count: 0, error: err.message };
  }
}

/**
 * Reuses / Copies Bell Schedule & Configurations from a Historical Year
 */
export function reuseConfigurationsFromYear(historicalYearObj, targetLevel = "both") {
  if (typeof window === "undefined" || !historicalYearObj) return { success: false };
  try {
    const existingRaw = window.localStorage.getItem("turotugma_schedule_configurations");
    let existingConfig = {};
    if (existingRaw) {
      try {
        existingConfig = JSON.parse(existingRaw) || {};
      } catch (e) {}
    }

    if (targetLevel === "both" || targetLevel === "jhs") {
      const jhsSrc = historicalYearObj.jhs?.config;
      if (jhsSrc) {
        existingConfig.jhs = {
          ...(existingConfig.jhs || {}),
          schoolStartTime: jhsSrc.schoolStartTime || "07:30",
          schoolEndTime: jhsSrc.schoolEndTime || "17:00",
          dayAssignments: jhsSrc.dayAssignments || {},
          sessions: {
            regular: {
              duration: jhsSrc.periodDuration || 60,
              manualPeriodCount: jhsSrc.periodsPerDay || 8,
              breaks: jhsSrc.breaks || {
                morning: { enabled: true, duration: 20, afterPeriod: 2 },
                lunch: { enabled: true, duration: 60, afterPeriod: 4 },
                afternoon: { enabled: true, duration: 10, afterPeriod: 6 },
              },
            },
            shortened: {
              duration: jhsSrc.shortenedDuration || 45,
              manualPeriodCount: jhsSrc.periodsPerDay || 8,
              breaks: jhsSrc.breaks || {
                morning: { enabled: true, duration: 20, afterPeriod: 2 },
                lunch: { enabled: true, duration: 60, afterPeriod: 4 },
                afternoon: { enabled: true, duration: 10, afterPeriod: 6 },
              },
            },
          },
        };
      }
    }

    if (targetLevel === "both" || targetLevel === "shs") {
      const shsSrc = historicalYearObj.shs?.config;
      if (shsSrc) {
        existingConfig.shs = {
          ...(existingConfig.shs || {}),
          schoolStartTime: shsSrc.schoolStartTime || "07:30",
          schoolEndTime: shsSrc.schoolEndTime || "17:00",
          dayAssignments: shsSrc.dayAssignments || {},
          sessions: {
            regular: {
              duration: shsSrc.periodDuration || 60,
              manualPeriodCount: shsSrc.periodsPerDay || 8,
              breaks: shsSrc.breaks || {
                morning: { enabled: true, duration: 20, afterPeriod: 2 },
                lunch: { enabled: true, duration: 60, afterPeriod: 4 },
                afternoon: { enabled: true, duration: 10, afterPeriod: 6 },
              },
            },
            shortened: {
              duration: shsSrc.shortenedDuration || 45,
              manualPeriodCount: shsSrc.periodsPerDay || 8,
              breaks: shsSrc.breaks || {
                morning: { enabled: true, duration: 20, afterPeriod: 2 },
                lunch: { enabled: true, duration: 60, afterPeriod: 4 },
                afternoon: { enabled: true, duration: 10, afterPeriod: 6 },
              },
            },
          },
        };
      }
    }

    window.localStorage.setItem("turotugma_schedule_configurations", JSON.stringify(existingConfig));
    window.dispatchEvent(new Event("turotugma_config_updated"));
    return { success: true };
  } catch (err) {
    console.error("Error reusing configurations:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Reuses / Copies Published Schedules (Scheds) from a Historical Year into active system
 */
export function reusePublishedSchedulesFromYear(historicalYearObj, targetLevel = "both") {
  if (typeof window === "undefined" || !historicalYearObj) return { success: false, count: 0 };
  try {
    const existingRaw = window.localStorage.getItem(PUBLISHED_STORAGE_KEY);
    let publishedSchedules = {};
    if (existingRaw) {
      try {
        publishedSchedules = JSON.parse(existingRaw) || {};
      } catch (e) {}
    }

    let count = 0;
    if ((targetLevel === "both" || targetLevel === "jhs") && historicalYearObj.jhs?.publishedSchedule) {
      publishedSchedules.jhs = {
        ...historicalYearObj.jhs.publishedSchedule,
        importedAt: new Date().toISOString(),
        importedFromYear: historicalYearObj.academicYear,
      };
      count++;
    }

    if ((targetLevel === "both" || targetLevel === "shs") && historicalYearObj.shs?.publishedSchedule) {
      publishedSchedules["shs-first"] = {
        ...historicalYearObj.shs.publishedSchedule,
        importedAt: new Date().toISOString(),
        importedFromYear: historicalYearObj.academicYear,
      };
      publishedSchedules.shs = publishedSchedules["shs-first"];
      count++;
    }

    window.localStorage.setItem(PUBLISHED_STORAGE_KEY, JSON.stringify(publishedSchedules));
    window.dispatchEvent(new CustomEvent("turotugma:schedule-updated", { detail: { type: "published", level: targetLevel } }));
    return { success: true, count };
  } catch (err) {
    console.error("Error reusing published schedules:", err);
    return { success: false, count: 0, error: err.message };
  }
}

/**
 * Executes a full rollover / copy of all categories from a historical year
 */
export function executeFullRolloverFromYear(historicalYearObj, currentAcademicYear = "2026-2027") {
  if (!historicalYearObj) return { success: false, count: 0 };
  const secRes = reuseSectionsFromYear(historicalYearObj, "both");
  const subRes = reuseSubjectsFromYear(historicalYearObj, "both");
  const thmRes = reuseNamingThemesFromYear(historicalYearObj);
  const facRes = reuseFacultyFromYear(historicalYearObj, "both", true);
  const cfgRes = reuseConfigurationsFromYear(historicalYearObj, "both");
  const schedRes = reusePublishedSchedulesFromYear(historicalYearObj, "both");

  // Save audit entry
  try {
    const rawAudit = window.localStorage.getItem(ROLLOVER_AUDIT_KEY);
    const auditList = rawAudit ? JSON.parse(rawAudit) : [];
    auditList.unshift({
      timestamp: new Date().toISOString(),
      sourceYear: historicalYearObj.academicYear,
      targetYear: currentAcademicYear,
      importedSections: secRes.count || 0,
      importedSubjects: subRes.count || 0,
      importedThemes: thmRes.count || 0,
      importedFaculty: facRes.count || 0,
      configurationsUpdated: cfgRes.success,
      importedSchedules: schedRes.count || 0,
      publishedSchedulesUpdated: schedRes.count || 0,
      action: `Full data rollover from S.Y. ${historicalYearObj.academicYear}`,
    });
    window.localStorage.setItem(ROLLOVER_AUDIT_KEY, JSON.stringify(auditList.slice(0, 30)));
  } catch (e) {}

  return {
    success: secRes.success && facRes.success && cfgRes.success,
    importedSections: secRes.count,
    importedSubjects: subRes.count,
    importedThemes: thmRes.count,
    importedFaculty: facRes.count,
    importedSchedules: schedRes.count,
  };
}

/**
 * Snapshots the current active school year into Historical Archives and initializes the next school year
 * according to the selected mode ("recommended" | "selective" | "scratch").
 */
export function archiveCurrentSchoolYearAndStartNew({
  currentYearLabel = "2026-2027",
  nextYearLabel = "2027-2028",
  mode = "recommended",
  keepOptions = {
    sections: true,
    themes: true,
    subjects: true,
    faculty: true,
    ancillaries: true,
    configs: true,
    schedules: false,
  },
}) {
  if (typeof window === "undefined") return { success: false };

  const curCheck = validateAcademicYearLabel(currentYearLabel);
  const safeCurrentYear = curCheck.valid ? curCheck.normalized : "2026-2027";
  const nextCheck = validateAcademicYearLabel(nextYearLabel, {
    isRolloverTarget: true,
    currentYear: safeCurrentYear,
  });
  if (!nextCheck.valid) {
    return { success: false, error: nextCheck.error };
  }
  currentYearLabel = safeCurrentYear;
  nextYearLabel = nextCheck.normalized;

  try {
    const rawSections = JSON.parse(window.localStorage.getItem("turotugma_sections_created") || "null") || {};
    const rawThemes = JSON.parse(window.localStorage.getItem("turotugma_naming_schemes") || "null") || null;
    const rawSubjects = JSON.parse(window.localStorage.getItem("turotugma_subjects") || "[]") || [];
    const rawFaculty = JSON.parse(window.localStorage.getItem("turotugma_faculty") || "[]") || [];
    const rawConfigs = JSON.parse(window.localStorage.getItem("turotugma_schedule_configurations") || "{}") || {};
    const rawPublished = JSON.parse(window.localStorage.getItem(PUBLISHED_STORAGE_KEY) || "{}") || {};
    const rawDrafts = JSON.parse(window.localStorage.getItem("turotugma_schedule_drafts") || "[]") || [];

    // 1. Build live archive entry for currentYearLabel
    const buildLevelSections = (lvlKey, grades) => {
      const list = [];
      const themesByGrade = {};
      grades.forEach((g) => {
        const gObj = rawSections?.[lvlKey]?.[g];
        const secs = Array.isArray(gObj?.sections) ? gObj.sections : [];
        const themeName = gObj?.theme || inferThemeFromSectionNames(secs, currentYearLabel);
        themesByGrade[g] = {
          grade: g,
          theme: themeName,
          count: secs.length,
          sampleNames: secs.map((s) => String(s?.name || "").replace(/^Grade\s*\d+\s*-\s*/i, "")).slice(0, 4),
        };
        secs.forEach((s, idx) => {
          const adviserObj = rawFaculty.find(
            (f) => f?.advisoryClass && String(f.advisoryClass).toLowerCase().includes(String(s?.name || "").toLowerCase())
          );
          list.push({
            id: `${lvlKey}-${g}-${idx}-${currentYearLabel}`,
            grade: g,
            name: s?.name || `Grade ${g} - Section ${idx + 1}`,
            classification: s?.classification || "Regular",
            track: s?.track || "Academic",
            cluster: s?.cluster || "",
            theme: themeName,
            adviser: adviserObj?.name || s?.adviser || "—",
          });
        });
      });
      return { list, themesByGrade };
    };

    const jhsSecData = buildLevelSections("jhs", [7, 8, 9, 10]);
    const shsSecData = buildLevelSections("shs", [11, 12]);

    const jhsFaculty = rawFaculty
      .filter((f) => {
        const grades = Array.isArray(f?.gradeLevelAssignments) ? f.gradeLevelAssignments.join(" ") : "";
        return f?.schoolLevel === "jhs" || /[789]|10/.test(grades) || !f?.schoolLevel;
      })
      .map((f) => ({
        ...f,
        major: f.major || f.specialization || f.department || "General",
        ancillaries: Array.isArray(f.ancillaryAssignments)
          ? f.ancillaryAssignments
          : Array.isArray(f.ancillaries)
            ? f.ancillaries
            : [],
        maxWeeklyHours: f.maxWeeklyHours || 24,
      }));

    const shsFaculty = rawFaculty
      .filter((f) => {
        const grades = Array.isArray(f?.gradeLevelAssignments) ? f.gradeLevelAssignments.join(" ") : "";
        return f?.schoolLevel === "shs" || /11|12/.test(grades);
      })
      .map((f) => ({
        ...f,
        major: f.major || f.specialization || f.department || "General",
        ancillaries: Array.isArray(f.ancillaryAssignments)
          ? f.ancillaryAssignments
          : Array.isArray(f.ancillaries)
            ? f.ancillaries
            : [],
        maxWeeklyHours: f.maxWeeklyHours || 24,
      }));

    const jhsSubjects = rawSubjects.filter((s) => s?.schoolLevel !== "shs");
    const shsSubjects = rawSubjects.filter((s) => s?.schoolLevel === "shs");

    const jhsSched =
      rawPublished.jhs ||
      (rawDrafts.find((d) => (d?.scheduleType || d?.schedule?.scheduleType) === "jhs")?.schedule) ||
      DEFAULT_HISTORICAL_YEARS[0].jhs.publishedSchedule;

    const shsSched =
      rawPublished["shs-first"] ||
      rawPublished.shs ||
      (rawDrafts.find((d) => String(d?.scheduleType || d?.schedule?.scheduleType || "").startsWith("shs"))?.schedule) ||
      DEFAULT_HISTORICAL_YEARS[0].shs.publishedSchedule;

    const archivedEntry = enrichHistoricalYearAnalytics({
      yearId: currentYearLabel,
      academicYear: currentYearLabel,
      label: `S.Y. ${currentYearLabel.replace("-", "–")}`,
      status: "Archived",
      description: `Archived operational snapshot for S.Y. ${currentYearLabel} at Diadi National High School, including sections, naming themes, subjects, faculty workloads, ancillary roles, and timetables.`,
      dateRange: `S.Y. ${currentYearLabel}`,
      publishedSchedulesCount: (rawPublished.jhs ? 1 : 0) + (rawPublished["shs-first"] || rawPublished.shs ? 1 : 0) || 1,
      namingSchemes: rawThemes,
      jhs: {
        sectionCount: jhsSecData.list.length || DEFAULT_HISTORICAL_YEARS[0].jhs.sectionCount,
        facultyCount: jhsFaculty.length || DEFAULT_HISTORICAL_YEARS[0].jhs.facultyCount,
        sections: jhsSecData.list.length > 0 ? jhsSecData.list : DEFAULT_HISTORICAL_YEARS[0].jhs.sections,
        sectionThemesByGrade: jhsSecData.themesByGrade,
        faculty: jhsFaculty.length > 0 ? jhsFaculty : DEFAULT_HISTORICAL_YEARS[0].jhs.faculty,
        subjects: jhsSubjects.length > 0 ? jhsSubjects : DEFAULT_ARCHIVE_SUBJECTS_JHS,
        config: {
          ...DEFAULT_HISTORICAL_YEARS[0].jhs.config,
          schoolStartTime: rawConfigs?.jhs?.schoolStartTime || "07:30",
          schoolEndTime: rawConfigs?.jhs?.schoolEndTime || "17:00",
          periodDuration: rawConfigs?.jhs?.sessions?.regular?.duration || 60,
          periodsPerDay: rawConfigs?.jhs?.sessions?.regular?.manualPeriodCount || 8,
          shortenedDuration: rawConfigs?.jhs?.sessions?.shortened?.duration || 45,
        },
        publishedSchedule: jhsSched,
      },
      shs: {
        sectionCount: shsSecData.list.length || DEFAULT_HISTORICAL_YEARS[0].shs.sectionCount,
        facultyCount: shsFaculty.length || DEFAULT_HISTORICAL_YEARS[0].shs.facultyCount,
        sections: shsSecData.list.length > 0 ? shsSecData.list : DEFAULT_HISTORICAL_YEARS[0].shs.sections,
        sectionThemesByGrade: shsSecData.themesByGrade,
        faculty: shsFaculty.length > 0 ? shsFaculty : DEFAULT_HISTORICAL_YEARS[0].shs.faculty,
        subjects: shsSubjects.length > 0 ? shsSubjects : DEFAULT_ARCHIVE_SUBJECTS_SHS,
        config: {
          ...DEFAULT_HISTORICAL_YEARS[0].shs.config,
          schoolStartTime: rawConfigs?.shs?.schoolStartTime || "07:30",
          schoolEndTime: rawConfigs?.shs?.schoolEndTime || "17:00",
          periodDuration: rawConfigs?.shs?.sessions?.regular?.duration || 60,
          periodsPerDay: rawConfigs?.shs?.sessions?.regular?.manualPeriodCount || 8,
          shortenedDuration: rawConfigs?.shs?.sessions?.shortened?.duration || 45,
        },
        publishedSchedule: shsSched,
      },
    });

    const existingArchives = getHistoricalSchoolYears().filter(
      (y) => y.yearId !== currentYearLabel && y.academicYear !== currentYearLabel
    );
    const updatedArchives = [archivedEntry, ...existingArchives];
    saveHistoricalSchoolYears(updatedArchives);

    // 2. Apply Rollover Mode for nextYearLabel
    const effectiveKeep =
      mode === "scratch"
        ? { sections: false, themes: false, subjects: false, faculty: false, ancillaries: false, configs: true, schedules: false }
        : mode === "recommended"
          ? { sections: true, themes: true, subjects: true, faculty: true, ancillaries: true, configs: true, schedules: false }
          : keepOptions;

    if (!effectiveKeep.sections) {
      window.localStorage.removeItem("turotugma_sections_created");
      window.dispatchEvent(new Event("turotugma:sections-updated"));
    }
    if (!effectiveKeep.themes) {
      window.localStorage.removeItem("turotugma_naming_schemes");
    }
    if (!effectiveKeep.subjects) {
      window.localStorage.setItem("turotugma_subjects", JSON.stringify([]));
      window.dispatchEvent(new Event("turotugma:subjects-updated"));
    }
    if (!effectiveKeep.faculty) {
      window.localStorage.setItem("turotugma_faculty", JSON.stringify([]));
      window.dispatchEvent(new Event("turotugma:faculty-updated"));
    } else if (!effectiveKeep.ancillaries) {
      const strippedFaculty = rawFaculty.map((f) => ({
        ...f,
        isClassAdviser: false,
        advisoryClass: "None",
        ancillaries: [],
        ancillaryAssignments: [],
      }));
      window.localStorage.setItem("turotugma_faculty", JSON.stringify(strippedFaculty));
      window.dispatchEvent(new Event("turotugma:faculty-updated"));
    }
    if (!effectiveKeep.schedules) {
      window.localStorage.removeItem(PUBLISHED_STORAGE_KEY);
      window.localStorage.removeItem("turotugma_schedule_drafts");
      window.dispatchEvent(new Event("turotugma:schedule-updated"));
    }

    // 3. Log Rollover Audit Entry
    const rawAudit = window.localStorage.getItem(ROLLOVER_AUDIT_KEY);
    const auditList = rawAudit ? JSON.parse(rawAudit) : [];
    const modeLabel =
      mode === "scratch"
        ? "Started from Scratch (Blank Slate)"
        : mode === "recommended"
          ? "Recommended Rollover (Kept Setup, Cleared Schedules)"
          : "Selective Custom Rollover";

    auditList.unshift({
      timestamp: new Date().toISOString(),
      sourceYear: currentYearLabel,
      targetYear: nextYearLabel,
      level: "Both",
      importedSections: effectiveKeep.sections ? archivedEntry.totalSections : 0,
      importedSubjects: effectiveKeep.subjects ? archivedEntry.totalSubjects : 0,
      importedThemes: effectiveKeep.themes ? archivedEntry.totalThemes : 0,
      importedFaculty: effectiveKeep.faculty ? archivedEntry.totalFaculty : 0,
      importedAncillaries: effectiveKeep.ancillaries ? archivedEntry.totalAncillaries : 0,
      configurationsUpdated: Boolean(effectiveKeep.configs),
      importedSchedules: effectiveKeep.schedules ? archivedEntry.publishedSchedulesCount : 0,
      action: `Archived S.Y. ${currentYearLabel} & Initialized S.Y. ${nextYearLabel} — ${modeLabel}`,
    });
    window.localStorage.setItem(ROLLOVER_AUDIT_KEY, JSON.stringify(auditList.slice(0, 30)));

    return {
      success: true,
      archivedEntry,
      updatedArchives,
      modeLabel,
    };
  } catch (err) {
    console.error("Failed to archive and start new school year:", err);
    return { success: false, error: err.message };
  }
}
