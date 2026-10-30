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
- **Grade 11 (Strengthened SHS — DO 017, s. 2026)**:
  - **Academic Pathway**: Organized into Clusters (*Arts, Social Sciences & Humanities*, *Business & Entrepreneurship*, *STEM*, *Sports, Health & Wellness*, *Field Experience/Research*).
  - **TechPro Pathway**: Organized into Areas (*ICT Support & Programming*, *Hospitality & Tourism*, *Industrial Technologies*, *Agri-Fishery & Food*, *Creative Arts & Design*, *Construction & Building*).
  - **Trimester Calendar**: 3 Terms (Term 1, Term 2, Term 3). Grade 11 Core subjects run across all 3 terms (160 hours each), while Academic electives complete in 1 term (80h or 160h) and TechPro electives span all 3 terms (320 hours).
- **Grade 12 (Legacy / Transition Cohort)**: Retains legacy 2-semester format and strands (STEM, ABM, HUMSS, GAS, TVL-ICT, TVL-HE) until pilot or subsequent phase rollouts.

### 3.3. Subjects Management
- **Subject Code & Name**: Canonical codes (e.g., `MATH`, `SCI`, `ENG`, `FIL`, `COMM11`, `GENMATH11`, `GENSCI11`, `LCS11`, `PKLP11`, `AP`, `VE`/`ESP`, `MAPEH`, `TLE`, `HGP`, `SPASPEC`).
- **Weekly Workload & Curriculum Hours**: 
  - `classesPerWeek` & `dailyMinutes`: Weekly meeting patterns.
  - `totalHours`: Official DepEd instructional hours requirement (160h for Core across 3 terms, 80h/160h for single-term electives, 320h for TechPro).
- **Delivery Period & Trimester Scoping**: Configurable as `All 3 Terms`, `Term 1`, `Term 2`, `Term 3`, or legacy semesters (`First Semester`, `Last Semester`).
- **Grade Level & Exclusivity**: Binds subjects to specific grade levels or marks them as Universal across JHS/SHS.
- **Clean & Ultra-Compact Form Layout**:
  - **Line 1 (Identity & Classification)**: `Subject Name`, `Subject Code`, `School Level`, `Grade Level`, and `Subject Type` arranged in a single neat line.
  - **Line 2 (Workload, Scope & Teaching Mode)**: `Daily Duration (minutes)`, `Classes per Week`, `Program Target Scope (JHS)` (or SHS Delivery Term, Required Hours, and Strand), `Teaching Mode` (defaults to `Single Teacher`), and `Number of Teachers` (when breakout is selected) arranged inline in a single neat line.
  - **Breakout Stream Rows**: When `Multi-Teacher Breakout` is enabled, individual 2-column rows appear cleanly underneath for each stream (`Stream Name` and `Qualification / Teacher` selector).
- **Teaching Faculty Allocation Mode**: 
  - **Single Teacher (Default)**: Standard DepEd rule for 99% of subjects (including special sections like SP-STEM electives and SPJ journalism). Exactly 1 teacher is assigned per period.
  - **Multi-Teacher Breakout**: Configurable for subjects that split into concurrent discipline streams during a single period (e.g., SPA Specialization, SPS Sports streams, TVL workshop stations). Allows defining the required teacher count (2–6) and separate individual input fields for each stream/specialization.

### 3.4. Faculty Management
- **Profile & Identification**: Teacher Name, Sex, DepEd Employee ID, Position/Designation (`Teacher I–III`, `Master Teacher I–V`, `Head Teacher I–VI`), Appointment Category (`Permanent`, `Provisional`, `Contractual`, `Substitute`), and Working Arrangement (`Full-Time`, `Part-Time`).
- **Educational Background & Major Qualification**: Tracks Degree, Major (e.g., Mathematics, English, Filipino, Science, Araling Panlipunan, TLE, ICT), and Minor teaching background for intelligent multi-teacher dynamic stream allocation.
- **DepEd Ancillary Assignments**:
  - **Auto-Commit on Save**: Any ancillary role typed in the input field is automatically committed and saved even if the user clicks "Save Changes" directly without clicking the "Add" button first.
  - **DepEd Ancillary Datalist & Quick Add**: Built-in suggestions from the DepEd Ancillary Pool (`School DRRM Coordinator`, `School ICT Coordinator`, `School Property Custodian`, `School Guidance Coordinator`, `Grade Level Coordinator`, `Subject Area Coordinator`, etc.). Clickable quick-add chips allow one-click role addition.
  - **DepEd Workload Presets**: Interactive buttons apply statutory teaching load relief per DepEd guidelines:
    - **Major Credit (-4 periods / 4h credit)**: Credits 4 teaching periods/week for major roles (e.g., Registrar, Guidance Coordinator, Property Custodian).
    - **Minor Credit (-2 periods / 2h credit)**: Credits 2 teaching periods/week for minor roles (e.g., Grade Level Chair, Canteen Manager).
- **Class Adviser Designation & Advisory Section**:
  - Designated via the 1-load credit toggle per **DepEd DO 005, s. 2024** (caps actual classroom teaching at 25 hrs/week instead of 30 hrs by granting 5 hours/week advisory credit).
  - Activating the Class Adviser toggle reveals a dedicated **Advisory Section** selector with both a dropdown of active school sections and custom text input.
  - Advisory Homeroom Guidance Program (HGP) periods are automatically linked to the teacher's designated advisory section.
- **Subject Expertise**: Assigns Primary Major and Secondary Minor teaching qualifications.
- **Grade Level Assignments**: Authorizes which grade levels (e.g., Grade 7, Grade 9) the teacher is certified to instruct.
- **Unavailable Periods**: Explicitly marks periods when a teacher cannot teach due to ancillary duties, administrative work, or part-time schedules.
- **Maximum Load Tracking**: Visual progress bars monitor weekly assigned teaching load against DepEd limits (Balanced: 20–30h for regular, 16–25h for Class Advisers; Overload: >30h regular, >25h adviser).
- **Cross-Component Synchronization**: Automatically persists updates to `localStorage` under `turotugma_faculty` and synchronizes in real-time across Subjects Management and Schedule Generator via dual custom events (`turotugma:faculty-updated` and `turotugma_faculty_updated`).

### 3.5. Multi-Teacher & Specialization Breakout Management (SPA, SPS, TVL, Co-Teaching)
Under **DepEd Order No. 21, s. 2019** and the **MATATAG Curriculum Framework**, certain specialized subjects require concurrent teaching breakout streams during a single period (e.g., Period 4). Rather than having one teacher handle the entire class, the section divides into concurrent discipline streams (e.g., **Economics & History** for Araling Panlipunan; **Media Arts, Dance Arts & Instrumental Music** for SPA; **Cookery & EIM** for TLE), each instructed simultaneously by a dedicated teacher.

#### 1. Controlling Multi-Teacher Requirements in Subjects Management
- By default, **all subjects are Single Teacher**. Special section subjects (e.g., Environmental Science or Developmental Reading in SP-STEM, Journalism in SPJ) default to 1 teacher.
- When adding or editing a subject in [SubjectsManagement.js](file:///c:/xampp/htdocs/SchedulingSystem/frontend/src/app/dashboard/components/SubjectsManagement.js):
  - In **Line 3 (Teaching Mode)**, select **"Multi-Teacher Breakout"** from the dropdown.
  - Select the required number of teachers (2 to 6).
  - Clean 2-column rows appear for each stream with:
    - **Stream / Specialization Name**: Input field for the stream title (e.g., `Visual Arts`, `Dance Arts`, `Economics`, `History`).
    - **Qualification / Teacher**: Clean selector with two optgroups:
      - **Auto-Match by Major (Any Free Specialist)**: Defaults to auto-matching by stream name or choosing any specific major (e.g., `Arts / Fine Arts`, `Dance`, `Economics`, `History`, `TLE`). The generator dynamically and randomly distributes sections across **any free teacher** holding that qualification rather than limiting to a single person.
      - **Lock Specific Teacher (Optional Override)**: Allows the scheduler to still lock in a specific faculty member if desired.
- Subjects with multi-teacher breakouts display a `Breakout (X Teachers)` badge in the subject catalog.

#### 2. Hybrid Auto-Scheduling Protocol
During automated schedule generation, the scheduler allocates teachers using a **4-tier Hybrid matching protocol**:
1. **Tier 1 (Specific Teacher Lock)**: If the scheduler explicitly locked in a specific teacher for that stream, the engine assigns them first (provided they are free and unblocked).
2. **Tier 2 (Major / Specialization Qualification — Dynamic Pool)**: If set to Major matching (or auto-match), the engine searches for **any active teacher** whose `major`, `minor`, `specialization`, or `subjectExpertise` matches that discipline. The engine balances teaching loads across all qualified teachers with randomized tie-breaking, ensuring fair faculty rotation across multiple sections.
3. **Tier 3 (Candidate Reuse)**: For the primary stream, the candidate teacher assigned to the parent subject is reused if free.
4. **Tier 4 (Department Fallback)**: If no specific sub-specialist is available, the engine automatically selects any available teacher from the parent department (e.g., MAPEH, Araling Panlipunan, TLE) sorted by lowest workload, guaranteeing zero double-booking and zero unscheduled periods.

#### 3. Manual Grid Editing & Verification
- In the manual grid editor, selecting any multi-teacher subject opens an interactive **"Set / Edit X Teachers"** button and dedicated modal rather than a single teacher dropdown.
- Existing assignments feature an interactive breakout badge (e.g., `ECONOMICS – Maria Santos; HISTORY – Juan Dela Cruz`). Clicking the badge opens the breakout assignment modal.
- The modal performs real-time validation:
  - **No Duplicate Stream Teachers**: A teacher selected for Stream 1 cannot be selected for Stream 2 in the same period.
  - **No Section Double-Booking**: Teachers currently scheduled in other sections at that period are disabled and labeled with the conflicting section name.
  - **Restriction Enforcement**: Teachers with blocked unavailable periods are disabled.
  - Applying the breakout assignment updates teaching load percentages and re-evaluates all schedule constraints automatically.

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
