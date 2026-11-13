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
The **Scheduling Configurations** panel organizes configuration into four clean, unnumbered administrative domains:
- **School Operating Hours**: Defines official school opening and closing times (`Daily Start Time` and `Daily End Time`).
- **Session & Calendar Settings**: 
  - Dynamic Session Modes (Regular vs. Shortened Sessions with interactive day-by-day calendar pills).
  - Bell Schedule engine: Period durations (45–60 mins), period calculation modes (Manual vs. Auto-Calculate), and DepEd standardized breaks (Morning Break 20m, Lunch 60m, Afternoon 15m) with drag-and-drop chronological timeline reordering.
- **Scheduling Engine & Constraints**: Structured into three distinct operational cards:
    - Teacher assignment priority policy:
      - **Consolidated Plantilla Loading (Recommended)**: Consolidates sections onto regular teachers until they achieve the 20–25h DepEd Balanced quota (4–5 sections/teacher), directly eliminating underload.
      - **Capacity-Based Allocation**: Spreads teaching periods evenly across all available faculty.
      - **Prioritize Permanent Faculty**: Prioritizes permanent before provisional/contractual staff.
      - **Hybrid Weighted Priority**: 30% Permanent, 70% capacity distribution.
    - Weekly teaching period cap with dynamic contact hour conversion badge (e.g., `24 periods ≈ 24.0 contact hrs/wk | DepEd DO 005 Balanced`).
    - **DepEd DO 005 Advisory (5h) & Major Ancillary (4h) Load Relief Offsets**: Automatically deducts classroom teaching requirements for Class Advisers (-1 class / 5h credit) and Major Coordinators (DRRM, ICT, Property Custodian: 4h credit) so teachers remain within balanced limits.
    - **Distinct Subject Preparations Cap**: Enforces an explicit limit on distinct curriculum preparations (e.g., Max 2–3 preps per teacher) to prevent preparation fatigue.
  - **Anti-Conflict Hard Constraints**: Enforces No Double-Booking, respects Teacher Unavailable Periods, and enforces verified Subject Expertise and Grade Level certifications.
  - **Curricular & Institutional Routines**: Spreads core academic subjects across days to avoid cognitive overload, and reserves Flag Ceremony and Room Maintenance / Cleaners routines.
- **Subject Placement Rules**: Controls subject-specific period constraints (Homeroom Guidance Monday Period 1 lock, contiguous double-period rules, and preferred time-of-day placements).

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

#### 3. Unified Manual Grid Editing & Verification
- In the manual grid editor, all timetable cells use a clean, standardized teacher selector dropdown.
- Cells display the scheduled subject and the assigned faculty member cleanly, with full real-time conflict checking and unavailable period validation.
- All faculty assignment updates automatically recalculate teacher workloads and enforce DepEd DO 005 statutory contact limits.

### 3.6. Schedule Generator & Consolidated Plantilla Balanced Allocation
When generating or re-generating a timetable, the system executes a three-phase allocation engine:
1. **Pass 0 (Consolidated Plantilla Course Pre-Allocation)**:
   - Prioritizes **Permanent / Regular** faculty members, consolidating their teaching assignments across 4 to 5 section courses within their specialization (18–25 contact periods/week, 4–5 classes).
   - Replaces fragmented 1-section assignments with full teaching loads, eliminating widespread underload (`< 20h`) and ensuring faculty achieve the **Balanced Target Load (DepEd DO 005, s. 2024)**.
   - Designates 1 unique regular Class Adviser per section for Monday Period 1 Homeroom Guidance (HGP), ensuring zero double-bookings.
2. **Pass 1 & 2 (Conflict-Free Latin-Square Slot Allocation)**:
   - Rotates subject periods across sections so multi-section regular teachers never double-book.
   - Automatically maintains curriculum slot continuity and daily subject quotas with 0 conflicts.
3. **Instant Generation Summary Feedback Overlay**:
   - **Executive Metrics**: Pops up immediately upon schedule generation with a clean TuroTugma Blue glassmorphic backdrop.
   - **4 Key Operational Metrics**:
     1. **Periods Scheduled**: Total periods allocated across all section templates (100% curriculum placement, e.g. 678/678 periods).
     2. **Workload Balance (DO 005)**: Count of teachers achieving the statutory Balanced target load (20–25h/wk) and confirmed 0 Overload count.
     3. **Conflict Engine**: Live count of unresolved conflicts with verified 0 double-bookings.
     4. **Faculty Deployed**: Count of active teaching staff deployed vs. staff reserved for full-time ancillary/administrative duties.
   - **Auto-Dismiss & Hover Pause**: Displays for 6 seconds with a shrinking progress countdown bar. Hovering over the overlay pauses the timer, allowing administrators to inspect the numbers.
   - **One-Click Publish Shortcut**: Direct **"Publish Schedule"** button to immediately commit compliant timetables without navigating through menus.

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

## 8. Subject Distribution & Teacher Coverage Checklist (Pre-Publishing Verification)

To guarantee that no section is left unstaffed before generating or publishing a master timetable, the **Schedule Generator** features an integrated **Subject Distribution & Teacher Coverage Checklist** accessible directly from the toolbar's **"Subject Checklist"** trigger.

### Key Capabilities & Coverage Ratios:
1. **Dynamic Section-to-Teacher Ratios & Curricular Exclusivity**:
   - Calculates the exact staffing coverage ratio based strictly on **eligible / applicable sections** rather than blindly dividing by total sections in the grade:
     $$\text{Assigned Sections with Qualified Teachers} \quad / \quad \text{Applicable Sections Required}$$
   - **Curricular Exclusivity in Action**:
     - **Universal Subjects** (e.g. *English, Math, Science, AP, VE, MAPEH, HGP*): Apply to all sections in that grade (e.g., **`8 / 8`** or **`7 / 7`**).
     - **SP-STEM Exclusive Subjects** (e.g. *DEVREAD, ELEMALG, ENVSCI, Research, Biotech, ICT-STEM*): If only 1 section in Grade 7 is SP-STEM (*7-STE Einstein*), the requirement is **1 section**, displaying **`1 / 1`** *(not 1/7)* with a distinct `SP-STEM Exclusive (1 Section)` badge.
     - **SPA / SPJ Exclusive Subjects** (e.g. *SPASPEC, ICT-SPJ*): Displays **`1 / 1`** or matching SPA/SPJ section count.
     - **Regular-Only Subjects** (e.g. standard *TLE*, *ARAL*): If 6 of 7 sections are Regular, displays **`6 / 6`** with a `Regular Exclusive (6 Sections)` badge (SP-STEM sections taking specialized subjects are not counted).
     - **SHS Strand-Specific Subjects** (e.g. *Pre-Calculus 11* for STEM): Displays **`1 / 1`** for the 1 STEM section, never penalizing non-STEM sections (*HUMSS, TVL*).
     - **HGP (Homeroom Guidance)**: **`32 / 32`** (Universal across all sections, verified against class advisers).
2. **Interactive Section Accordion & Class Adviser Inspector**:
   - Clicking any subject row expands to reveal only the sections that **actually take that subject**.
   - Displays the assigned faculty name, plantilla designation, major, and the section's official **Class Adviser** (e.g. `👤 Juan Dela Cruz`).
   - Includes an inline **Change / Assign Class Adviser** dropdown allowing schedulers to set or update class advisers directly on the fly, permanently persisting to the school profile.
3. **One-Click Quick Assign**:
   - For unassigned sections, an inline teacher selector allows schedulers to immediately assign qualified faculty with matching subject majors directly from the checklist without hunting through grid cells.
4. **Smart Actions Toolbar**:
   - **`⚡ Sync HGP to Advisers`**: Automatically assigns each section's Homeroom Guidance (HGP) period to its designated Class Adviser in accordance with DepEd guidelines with a single click.
   - **`✨ Auto-Distribute Unassigned`**: Intelligently scans unassigned subject loads, identifies faculty members possessing matching subject specializations under the 24 contact hours/week statutory load limit, and distributes them automatically across all applicable sections.
   - **`📄 Export CSV (SF7)`**: Exports a comprehensive DepEd School Form 7 / Subject Allocation audit matrix containing subject codes, titles, grade levels, assigned faculty rosters, and distribution percentages.
5. **Filters & Search**:
   - Search by subject code, title, or grade.
   - Quick-toggle status pills: **All**, **Needs Attention** (subjects with unassigned sections), and **Complete**.

### 8.1. Draft Management, Publication Confirmation & Visibility Control

To ensure master schedules are thoroughly verified before school-wide release, TuroTugma implements a structured draft and publication lifecycle:

1. **Quota-Safe Draft Saving**:
   - Clicking **"Save Draft"** captures the current timetable state—including manual cell overrides, teacher allocations, and custom slots.
   - Saves drafts safely with automatic browser storage quota handling, retaining the 10 most recent drafts and preventing `QuotaExceededError`.
   - Allows saving working drafts at any time, even prior to running a full automated generation.

2. **Publish Confirmation Engine**:
   - Clicking **"Publish"** initiates comprehensive validation of two primary criteria: **Scheduling Conflicts** and **Subject Distribution Completeness**:
     - **0 Conflicts + 100% Subject Distribution**: Prompts an official publication confirmation modal:
       > *"All curriculum subjects are 100% distributed across all sections with 0 scheduling conflicts. Proceed to publish the official timetable?"*
       Clicking **"Publish Official Schedule"** commits the schedule into active publication.
     - **Active Conflicts (> 0)**: Displays an amber alert warning indicating the exact count of double-bookings or overlapping restrictions before prompting confirmation (*"Publish Anyway"*).
     - **Incomplete Subject Distribution (< 100%)**: Displays an alert with the distribution percentage, reminding the scheduler that some sections lack assigned subject teachers before asking for confirmation.

3. **Admin vs. Public Timetable Views**:
   - **Admin Dashboard (`Time Tables`)**:
     - Lists **both** officially published schedules and recent working drafts.
     - Features distinct status badges: `Published Active (Visible in Public Final Timetables)` vs. `Saved Draft (Internal Admin View Only)`.
     - Administrators can inspect, restore, delete, or export any draft or published version.
   - **Public Homepage (`Final Time Tables`)**:
     - **Strict Privacy Isolation**: Drafts are completely hidden and inaccessible to public visitors, students, and parents.
     - Only schedules with an active `published` status appear.
     - Displays the verified **"Official Published Schedule (Public View)"** status badge.
     - When multiple schedules are published (e.g., both JHS and SHS), an integrated selector allows visitors to seamlessly switch between published curricular levels.

## 9. Official DepEd Signatory Rosters: JHS vs. SHS Governance Architecture

DepEd administrative guidelines mandate distinct approval hierarchies between Junior High School and Senior High School due to curriculum governance, tracking licenses, and voucher subsidies:

### Why JHS and SHS Signatories Differ
1. **Junior High School (Grades 7–10)**:
   - Operates under standard school-based curriculum implementation (MATATAG / BEC).
   - Approval is operational and handled within the **District Level**:
     - **Prepared by**: Timetable Committee / Subject Coordinators (Chairpersons of MAPEH/SPA, Science/Math, AP/EsP/TLE, Language/SPJ).
     - **Conformed**: Assistant Principal / Head Teacher Designate.
     - **Recommending Approval**: Secondary School Principal.
     - **Approved**: Public Schools District Supervisor (PSDS) / District-In-Charge.

2. **Senior High School (Grades 11–12)**:
   - Operates under specialized track and strand program offerings regulated by DepEd Order (DO) 017 (e.g. STEM, HUMSS, ABM, TVL).
   - Approval is statutory and requires endorsement from the **Schools Division Office (SDO)**:
     - **Prepared by**: Secondary School Principal (submitting the division program and Form 7).
     - **Reviewed**: Chief Education Supervisor, Curriculum Implementation Division (CID).
     - **Recommending Approval**: Assistant Schools Division Superintendent (ASDS).
     - **Approved**: Schools Division Superintendent (SDS).

### How TuroTugma Manages Level-Specific Signatories
- **School Profile & Settings (Tab 1 — Header & Signatories)**: Administrators can toggle between **Junior High School (District Level)** and **Senior High School (Division SDO Level)** to customize committee rosters, official plantilla titles, and preview the authentic print layout directly below the institutional profile.
- **Automatic Timetable Level Detection**: When displaying or exporting timetables in **Time Tables** or the Public Homepage, TuroTugma automatically detects the section's grade level and embeds the matching DepEd print footer without requiring manual intervention.

## 10. Simplified School Profile Setup, Live Merged Letterhead Preview & Level-Specific Seals

To make configuration effortless and intuitive, TuroTugma features a clean, simplified School Profile setup organized into 3 purpose-built tabs:

### The 3 Core Configuration Tabs
1. **School Profile**:
   - **School Profile (Basic Information)**:
     - **School Type**: Dropdown supporting *Basic Education (K-12)*, *Higher Education (CHED)*, *Technical-Vocational (TESDA)*, and *Integrated / Others*.
     - **Name of the School**: Text input for the official school name (e.g. `Diadi National High School`).
     - **School ID (Optional)**: Optional text input for the official institutional identifier (can be left blank for private/vocational institutions).
     - **Curricular Levels Offered**: Dropdown supporting *Both Junior High School & Senior High School (Integrated K-12)*, *Junior High School Only (Grades 7 to 10)*, and *Senior High School Only (Grades 11 and 12)*.
     *(Note: School Head and Plantilla Position are configured directly within the Signatories roster to avoid duplicate entries).*
   - **Timetable Letterhead, Official Seals & Signatories**:
     - Controlled by a **Single Master Switch** at the top: **Junior High School (JHS)** vs **Senior High School (SHS)**. There are no redundant duplicate switches across the tab.
     - **Dynamic Single Live Preview**: Only one letterhead preview is displayed at a time, instantly adapting to whichever level is actively selected:
       - **JHS Format**: Centered Circular DepEd Seal -> *Republic of the Philippines* -> *Department of Education* -> *Region II – Cagayan Valley* (Region line included) -> *Schools Division of Nueva Vizcaya* -> *DIADI NATIONAL HIGH SCHOOL* (Uppercase) -> `<hr />` divider -> *CLASSROOM PROGRAM* -> *S.Y. 2026 - 2027* -> *7 ALBERT EINSTEIN* -> Timetable Grid -> Operational Committee Signatories -> Footer bar with DepEd Corporate Wordmark (DO 001 Torch) and authentic Diadi NHS Crest.
       - **SHS Format**: Centered Circular DepEd Seal -> *Republic of the Philippines* -> *Department of Education* -> *Schools Division of Nueva Vizcaya* (Region line omitted for SDO Form 7) -> *Diadi National High School* (Title case) -> `<hr />` divider -> *CLASSROOM PROGRAM* -> *S.Y. 2026 - 2027* -> *11 STEM - ALBERT EINSTEIN* -> Timetable Grid -> 4-Column Statutory SDO Approval Signatories -> Footer bar with Tri-Logo (DepEd Corporate Wordmark + Bagong Pilipinas + authentic Diadi NHS Crest).
     - **Official Insignia, Seals & Masthead Formats (Integrated Directly Here)**:
       - Positioned immediately beneath the preview for real-time visual feedback (no separate card below).
       - Automatically follows the active level switch (JHS or SHS).
       - **DepEd Circular Seal (Header Masthead — Up in Header)**: Prescribed circular coat of arms centered at the top of the letterhead above *Republic of the Philippines* with custom upload and reset controls.
       - **DepEd Corporate Text Logo / Wordmark (Signatories Footer — Down with Signatories)**: Prescribed horizontal DO 001 torch wordmark placed on the footer line beside approval signatories.
       - **"Bagong Pilipinas" Governance Logo**: Prescribed national governance insignia under OP MC No. 24, s. 2023 placed down beside signatories.
       - **Diadi National High School Official Crest**: Authentic institutional emblem of Diadi National High School (Est. 1980), Poblacion, Diadi, Nueva Vizcaya, replacing synthetic vector/AI approximations with genuine high-resolution crest artwork.
       - One-click presets: *Tri-Logo Footer* (DepEd Wordmark + BP + School Crest), *DepEd Wordmark + School Crest*, *School Crest Only*, and *Clean Text-Only*.
       - One-click helper: "Copy Seals to Both JHS & SHS".
     - **DepEd Official Signatory Rosters (Integrated Directly Here)**:
       - Automatically follows the active level switch (JHS committee or SHS 4-column statutory SDO approval).
       - Plantilla naming and designation fields for each level with "Reset Defaults" and "Save Signatory Roster".
   - **Governance & Campus Locations**:
     - Administrative Hierarchy: DepEd Region, Schools Division Office (SDO), District Jurisdiction.
     - Contact Coordinates: Campus Physical Address, Official Email, School Website / Portal.

2. **Scheduling Configurations**:
   - **Operation Hours**: Standard institutional schedule for Diadi National High School defaults to **07:30 AM – 05:00 PM** (570 minutes / 9.5 hours daily operating window, Single Whole-Day Session).
   - **Days of Operations & Session Selector**:
     - Operating days (Monday through Sunday) with pill toggles.
     - Defaults: Monday to Thursday are *Regular Session* (Blue), Friday is *Shortened Session* (Light Blue), and Saturday & Sunday are *Off Days* (Greyed out).
     - Color legend: Blue for active session type, Light Blue for other session type, Greyed out for not selected (off days).
   - **Interactive Period Visualization**:
     - Clean, focused period timeline displaying instructional periods from 1st Period to Nth Period with scheduled breaks (Morning Recess, Lunch Break, Afternoon Break) slotted in between.
     - Drag-and-drop handles and arrow buttons (▲/▼) to reorder breaks between periods.
   - **Period Duration Control & Break Configuration**:
     - Custom instructional period durations (defaults to 60m regular, 45m shortened) and daily period counts.
     - **Instructional Time Shortfall Alert**: Proactive detection that alerts the user whenever period duration is set below 60 minutes. Reminds the user that required timing is 60 minutes for 4 meetings per week (240 mins/week total), and that the ideal period duration is 60 minutes per meeting to prevent instructional time shortfalls.
     - Break configuration with toggle switches, duration controls, and placement after specific periods.
   - **Separate Configurations for JHS and SHS**:
     - Independent scheduling parameters maintained and saved separately for Junior High School and Senior High School.

3. **Academic Years & Historical Archives Hub**:
   - **Active Operational School Year**: Current school year designation (S.Y. 2026–2027) and unified 3-term operational system with active term indicator (Term 1, Term 2, Term 3).
   - **Most Recent Published Schedules (Active S.Y. 2026–2027)**:
     - Real-time showcase of the active master timetables for both **Junior High School (JHS)** and **Senior High School (SHS)**.
     - Direct navigation to live interactive timetables with 60-minute period timings, breaks, and teacher subject distributions.
   - **Historical School Years Registry (3 Previous Years)**:
     - Pre-populated historical records for Diadi National High School: **S.Y. 2025–2026**, **S.Y. 2024–2025**, and **S.Y. 2023–2024**.
     - Focused exclusively on DNHS core operational entities (no individual student headcounts or room utilization):
       - Section structures (grade levels, section names, tracks, strands, class advisers).
       - Faculty rosters & ancillary duties (plantilla designations, primary/secondary majors, advisory classes, school ancillary coordinator roles, weekly contact load limits).
       - Scheduling configurations & bell timings (operating hours, 60m regular period durations, 45m Friday shortened sessions, and morning/lunch/afternoon break placements).
       - Published master schedules (archived daily period assignments for JHS and SHS).
   - **Granular Data Reusability & Carry-Over**:
     - **Inspect Archive**: Modal viewer to browse exact section rosters, teacher profiles, ancillary roles, and archived published schedules.
     - **Selective Carry-Over**: One-click import allowing users to copy sections, faculty rosters, ancillaries, bell configurations, or published schedules from any previous year into the current active school year.
     - **Full School Year Rollover**: Instant clone of all records with an automated timestamped audit trail.

---

*TuroTugma Timetable System • Developed for Philippine Public and Private Secondary Schools*


