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

/**
 * Loads the historical school years from local storage, fallback to defaults
 */
export function getHistoricalSchoolYears() {
  if (typeof window === "undefined") return DEFAULT_HISTORICAL_YEARS;
  try {
    const raw = window.localStorage.getItem(HISTORICAL_STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(HISTORICAL_STORAGE_KEY, JSON.stringify(DEFAULT_HISTORICAL_YEARS));
      return DEFAULT_HISTORICAL_YEARS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    window.localStorage.setItem(HISTORICAL_STORAGE_KEY, JSON.stringify(DEFAULT_HISTORICAL_YEARS));
    return DEFAULT_HISTORICAL_YEARS;
  } catch (e) {
    return DEFAULT_HISTORICAL_YEARS;
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
      const jhsGrouped = {};
      [7, 8, 9, 10].forEach((g) => {
        const gradeSecs = jhsSections.filter((s) => Number(s.grade) === g);
        jhsGrouped[g] = {
          totalSections: gradeSecs.length,
          theme: "Historical S.Y. " + historicalYearObj.academicYear,
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
      const shsGrouped = {};
      [11, 12].forEach((g) => {
        const gradeSecs = shsSections.filter((s) => Number(s.grade) === g);
        shsGrouped[g] = {
          totalSections: gradeSecs.length,
          theme: "Historical S.Y. " + historicalYearObj.academicYear,
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
 * Reuses / Copies Faculty Roster & Ancillaries from a Historical Year into the active school year
 */
export function reuseFacultyFromYear(historicalYearObj, targetLevel = "both") {
  if (typeof window === "undefined" || !historicalYearObj) return { success: false, count: 0 };
  try {
    const existingRaw = window.localStorage.getItem("turotugma_faculty");
    let currentFaculty = [];
    if (existingRaw) {
      try {
        const parsed = JSON.parse(existingRaw);
        if (Array.isArray(parsed)) currentFaculty = parsed;
      } catch (e) {}
    }

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

    // Format into standard faculty structure including ancillaries and advisoryClass
    const nextFaculty = importedFaculty.map((f, idx) => ({
      ...f,
      id: f.id || `teacher-import-${idx + 1}`,
      ancillaries: Array.isArray(f.ancillaries) ? f.ancillaries : (f.advisoryClass && f.advisoryClass !== "None" ? ["Class Adviser"] : []),
      updatedAt: new Date().toISOString(),
      importedFromYear: historicalYearObj.academicYear,
    }));

    window.localStorage.setItem("turotugma_faculty", JSON.stringify(nextFaculty));
    window.dispatchEvent(new Event("turotugma_faculty_updated"));
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
  const facRes = reuseFacultyFromYear(historicalYearObj, "both");
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
      importedFaculty: facRes.count || 0,
      configurationsUpdated: cfgRes.success,
      publishedSchedulesUpdated: schedRes.count || 0,
      action: `Full data reuse from S.Y. ${historicalYearObj.academicYear} (Sections, Faculty, Scheds)`,
    });
    window.localStorage.setItem(ROLLOVER_AUDIT_KEY, JSON.stringify(auditList.slice(0, 30)));
  } catch (e) {}

  return {
    success: secRes.success && facRes.success && cfgRes.success,
    importedSections: secRes.count,
    importedFaculty: facRes.count,
    importedSchedules: schedRes.count,
  };
}
