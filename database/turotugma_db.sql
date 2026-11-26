-- ============================================================================
-- TuroTugma Scheduling System — Official XAMPP MySQL Database Schema
-- Database: `turotugma_db`
-- Note: `api/sync.php` automatically creates this database and all tables
-- on first connection, and mirrors live changes into these relational tables.
-- ============================================================================

CREATE DATABASE IF NOT EXISTS `turotugma_db`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `turotugma_db`;

-- 1. Real-Time System State Table (Powers cross-browser & LAN device synchronization)
CREATE TABLE IF NOT EXISTS `system_state` (
  `state_key` VARCHAR(120) NOT NULL PRIMARY KEY,
  `state_value` LONGTEXT NOT NULL,
  `client_id` VARCHAR(80) DEFAULT NULL,
  `updated_at` BIGINT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Teachers & Faculty Workload Roster Table
CREATE TABLE IF NOT EXISTS `teachers` (
  `id` VARCHAR(80) NOT NULL PRIMARY KEY,
  `employee_id` VARCHAR(64) DEFAULT NULL,
  `name` VARCHAR(180) NOT NULL,
  `position` VARCHAR(100) DEFAULT NULL,
  `appointment_status` VARCHAR(60) DEFAULT 'Permanent',
  `major` VARCHAR(120) DEFAULT NULL,
  `minor` VARCHAR(120) DEFAULT NULL,
  `is_class_adviser` TINYINT(1) DEFAULT 0,
  `ancillary_assignments` TEXT DEFAULT NULL,
  `grade_levels` VARCHAR(180) DEFAULT NULL,
  `assigned_load_percent` INT DEFAULT 0,
  `assigned_load_status` VARCHAR(40) DEFAULT 'Unassigned',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Curriculum Subjects Catalog Table
CREATE TABLE IF NOT EXISTS `subjects` (
  `id` VARCHAR(80) NOT NULL PRIMARY KEY,
  `subject_code` VARCHAR(60) NOT NULL,
  `subject_name` VARCHAR(180) NOT NULL,
  `school_level` VARCHAR(20) DEFAULT 'jhs',
  `grade_level` VARCHAR(60) DEFAULT NULL,
  `subject_type` VARCHAR(60) DEFAULT 'Core',
  `program_scope` VARCHAR(120) DEFAULT 'Universal',
  `classes_per_week` INT DEFAULT 4,
  `hours_per_week` DECIMAL(4,2) DEFAULT 4.00,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Sections & Naming Themes Table
CREATE TABLE IF NOT EXISTS `sections` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `school_level` VARCHAR(20) NOT NULL,
  `grade_level` INT NOT NULL,
  `section_name` VARCHAR(140) NOT NULL,
  `classification_or_track` VARCHAR(120) DEFAULT 'Regular',
  `naming_theme` VARCHAR(120) DEFAULT NULL,
  `adviser_name` VARCHAR(180) DEFAULT NULL,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Published Master Timetables Table
CREATE TABLE IF NOT EXISTS `published_schedules` (
  `schedule_key` VARCHAR(60) NOT NULL PRIMARY KEY,
  `academic_year` VARCHAR(30) DEFAULT '2026-2027',
  `schedule_type` VARCHAR(40) NOT NULL,
  `total_assignments` INT DEFAULT 0,
  `conflicts_count` INT DEFAULT 0,
  `published_at` VARCHAR(60) DEFAULT NULL,
  `payload_json` LONGTEXT NOT NULL,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

