# TuroTugma: Smart Scheduling System
## Comprehensive User Manual & Administrator Guide

---

## 1. System Overview & Philosophy

**TuroTugma** is an automated and manual timetable generation and conflict-management system tailored to the **Department of Education (DepEd) MATATAG Curriculum** standards for Philippine Junior High Schools (JHS) and Senior High Schools (SHS).

The system balances three core objectives:
1. **Curricular Compliance**: Enforces required weekly meeting counts (`classesPerWeek`), daily lesson duration, grade exclusivity, and specialization tracks (Regular, SPA, SPJ, SP-STEM, and SHS Strands).
2. **Faculty Welfare**: Eliminates double-booking, distributes teacher workloads fairly, and strictly respects teacher unavailable periods and ancillary/administrative task assignments.
3. **Pedagogical Balance**: Enforces the 1-meeting-per-day rule for recurring subjects (avoiding student fatigue), ensures contiguous double periods when configured, and anchors class advisory assignments (e.g., Monday 1st Period Homeroom Guidance Program).

---

## 2. System Architecture & Workflow

```
[ School Profile & Sessions ] 
            ↓
  [ Sections Setup ]  ↔  [ Subjects Workload ]  ↔  [ Faculty & Specializations ]
                                  ↓
                      [ Schedule Generator ]
                                  ↓
      [ Pass 1: Locked Subjects & Class Adviser Priority ]
                                  ↓
      [ Pass 2: Flexible Allocation & Daily Balance ]
                                  ↓
      [ Recovery Pass: Unmet Subject Quota Fulfillment ]
                                  ↓
      [ Live Evaluation & Auto-Fix Conflict Resolution ]
                                  ↓
                  [ Save Draft / Publish Schedule ]
                                  ↓
                        [ Public Dashboard ]
```

---

## 3. Core Modules Guide

### 3.1. School Profile & Settings
- **Session Types**: Configure Regular Sessions (e.g., Mon–Thu) and Shortened Sessions (e.g., Friday).
- **Period Calculation & Bell Schedules**: Define period counts (typically 7–8 periods for Regular, 6–7 for Shortened), start/end times, and period durations (45–60 minutes).
- **DepEd Breaks**: Set standardized Morning Break (20 mins), Lunch Break (60 mins), and optional Afternoon Break.
- **Constraints Configuration**: Toggle automatic enforcement of:
  - No Teacher Double-Booking
  - Teacher Unavailable Periods
  - Teacher Expertise & Grade Matching
  - Student Core Subject Daily Balancing
  - Placement Rules (Homeroom / Class Adviser locks)

### 3.2. Sections Management
- **Grade 7 to 10 (JHS)**:
  - **Regular Sections**: Take standard DepEd core subjects + TLE + Aral Program + HGP.
  - **SPA (Special Program in the Arts)**: Takes core subjects + TLE + SPA Specialization + HGP.
  - **SPJ (Special Program in Journalism)**: Takes core subjects + ICT/Journalism + HGP.
  - **SP-STEM (Special Program in Science, Technology & Engineering)**: Takes core subjects + enhanced STEM electives (Environmental Science, Developmental Reading, Elementary Algebra, ICT) + HGP.
- **Grade 11 to 12 (SHS)**: Classified by Academic and TVL Strands (STEM, ABM, HUMSS, GAS, TVL-ICT, TVL-HE).

### 3.3. Subjects Management
- **Subject Code & Name**: Canonical codes (e.g., `MATH`, `SCI`, `ENG`, `FIL`, `AP`, `VE`/`ESP`, `MAPEH`, `TLE`, `HGP`).
- **Weekly Workload (`classesPerWeek`)**: Specifies how many recurring daily meetings the class must receive per week (typically 4 meetings/week for core subjects, 1 meeting/week for HGP).
- **Grade Level & Exclusivity**: Binds subjects to specific grade levels or marks them as Universal across JHS/SHS.

### 3.4. Faculty Management
- **Subject Expertise**: Assigns Primary Major and Secondary Minor teaching qualifications.
- **Grade Level Assignments**: Authorizes which grade levels (e.g., Grade 7, Grade 9) the teacher is certified to instruct.
- **Unavailable Periods**: Explicitly marks periods when a teacher cannot teach due to ancillary duties, administrative work, or part-time schedules.
- **Maximum Load Tracking**: Visual progress bars monitor weekly assigned teaching load against DepEd limits.

---

## 4. Conflict Detection Matrix

The live evaluation engine ([evaluateSchedule](file:///c:/xampp/htdocs/SchedulingSystem/frontend/src/app/dashboard/components/ScheduleGenerator.js)) continuously verifies the schedule against 11 distinct constraints.

| # | Conflict Identifier | Trigger Condition | Visual Indicator in Grid |
|---|---------------------|-------------------|--------------------------|
| **1** | **Teacher Double-Booking** | A teacher is assigned to teach two or more sections simultaneously during the exact same day and period slot. | Red border and red highlight on the overlapping timetable cells. |
| **2** | **Under-Scheduled Subject Quota** | A section has fewer assigned meetings than the required weekly quota (e.g., Science has 3 of 4 required recurring daily periods). | Tracked in the Conflicts Side Drawer; does not falsely flag already-scheduled valid periods as invalid. |
| **3** | **Same-Day Duplicate Subject** | A subject without a double-period setting is scheduled more than once on the same day for a single section (e.g., two English periods on Tuesday). | Red cell border and warning banner on both duplicate periods. |
| **4** | **Weekly Quota Exceeded** | A subject is scheduled more times than its configured `classesPerWeek` (e.g., 5 periods assigned for a 4-period subject). | Red cell border on the extra period. |
| **5** | **Teacher Restricted / Unavailable Period** | A teacher is assigned during a period blocked in Period Restrictions or marked unavailable. | Red cell border and teacher unavailability warning. |
| **6** | **Subject Period Restriction** | A subject is scheduled during a period restricted in the master schedule configuration. | Red cell border. |
| **7** | **Teacher Expertise / Grade Mismatch** | An assigned teacher lacks DepEd expertise in the subject or is assigned outside authorized grade levels. | Red cell border and expertise mismatch flag. |
| **8** | **Placement Rule Lock Mismatch** | A subject violates a priority lock (e.g., Homeroom Guidance Program scheduled on a day other than Monday 1st Period). | Red cell border on the displaced slot. |
| **9** | **Non-Consecutive Double Period** | A subject configured as a 2-period Double Period block is placed in broken, non-consecutive slots on the same day. | Red cell borders on both slots. |
| **10** | **Specialized Subject Limit Exceeded** | A section is assigned more specialized subjects than authorized by DepEd curriculum rules for its classification. | Red cell border on extraneous specialized subject. |
| **11** | **Invalid Period for Section Settings** | A class is placed on an inactive day or period outside the section's session parameters. | Red cell border on invalid slot. |

---

## 5. Automated Conflict Resolution (Auto-Fix Engine)

When administrators click **"Auto-Fix All"**, the system does **NOT** merely hide or recolor warnings. It actively executes multi-pass data mutations across `schedule.assignments` using 7 specialized strategies:

```
[ Conflict Detected ]
          ↓
[ Strategy 0: Under-Scheduled Subjects ] ──→ Direct Open-Slot Placement / Intra-Section Relocation
          ↓
[ Strategy 1: Same-Day Duplicates ] ─────→ Cross-Day Slot Swapping
          ↓
[ Strategy 2: Teacher Double-Booking ] ──→ Alternate Faculty Reassignment / Period Swap
          ↓
[ Strategy 3: Teacher Restrictions ] ────→ Qualified Substitute Matching
          ↓
[ Strategy 4: Specialized Subject Cap ] ─→ Curriculum Track Alignment
          ↓
[ Strategy 5: Generic Minimizing Swap ] ─→ Mathematical Intra-Section Slot Permutation
          ↓
[ Strategy 6: Duplicate Daily Sessions ] → Unscheduled Slot Relocation
          ↓
[ Re-Evaluate Schedule & Update Grid ]
```

### Detailed Strategy Workflows:

#### Strategy 0: Missing Recurring Periods (Under-Scheduled Quota)
1. **Direct Placement**: Scans for empty slots on weekdays where the subject is not yet scheduled. If found, assigns an eligible teacher (prioritizing the teacher already assigned to that subject in other cells of the section).
2. **Intra-Section Relocation**: If empty slots exist on open days but the subject's teacher is occupied during those slots, shifts a flexible, non-locked subject from an occupied slot into the empty slot, freeing the period for the required subject.
3. **Excess-Quota Replacement**: If all slots in the section are full, locates any subject that exceeds its required quota and swaps out the excess period.

#### Strategy 1 & 6: Same-Day Duplicate Elimination
- Preserves the primary session on that day.
- Identifies an open day lacking that subject and relocates the duplicate session.
- If all other days are full, executes a 2-way slot swap with another subject across different days.

#### Strategy 2: Double-Booking Resolution
- Queries the faculty database for teachers possessing Primary or Secondary expertise in the subject who are free during that period.
- If found, updates Section B's assignment to the available teacher.
- If no substitute is available, swaps Section B's period with another period of Section B where the original teacher is free.

#### Strategy 3: Unavailable & Restricted Period Resolution
- Automatically substitutes the restricted teacher with a qualified, unrestricted teacher.
- If no substitute is available, relocates the period to an approved time window.

---

## 6. Structural Capacity Limits & Scheduler Troubleshooting

### Why might Auto-Fix report "No further auto-fixes available"?
Auto-Fix respects the laws of mathematics. It will never silently delete subjects or assign two teachers to one period to fake a clean report.

**Common Scenarios**:
1. **Curricular Overload (Workload Exceeds Weekly Slots)**:
   - *Example*: Grade 7 SP-STEM requires 12 subjects totaling **45 periods/week**.
   - *The Physical Limit*: If your school operates an 8-period schedule with a 6-period shortened Friday, the weekly capacity is **38 periods**.
   - *Solution*: Open **School Profile & Settings** -> **Scheduling Configurations** tab -> Increase daily period counts, or adjust elective subject workload in **Subjects Management**.

2. **Faculty Shortage in a Specialized Subject**:
   - *Example*: All certified Science teachers are already teaching other sections during every open slot of a section.
   - *Result*: The system cannot place the missing Science period without creating a teacher double-booking.
   - *Solution*: In **Faculty Management**, authorize a qualified teacher's secondary subject expertise or hire/assign additional faculty for that department.

---

## 7. Manual Cell Editing & Overrides

For full administrative control, schedulers can manually adjust any cell directly on the grid:
1. **Click Any Grid Cell**: Opens the interactive inline editor showing the current Subject and Teacher.
2. **Select New Subject**: The dropdown filters to subjects eligible for that section's grade level and classification.
3. **Select Eligible Teacher**: The teacher dropdown highlights faculty with verified expertise, marking teachers who have conflicting schedules or restrictions.
4. **Instant Validation**: Once updated, the grid instantly runs live validation and updates the Assignment Validation counter (`Valid: X, Invalid: Y`).
5. **Save Draft / Publish**: Save internal working copies or publish the finalized schedule to make it visible to faculty, students, and parents on the Public Dashboard.

---

*TuroTugma Timetable System • Developed for Philippine Public and Private Secondary Schools*
