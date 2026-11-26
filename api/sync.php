<?php
/**
 * TuroTugma — XAMPP MySQL & Multi-Device LAN Synchronization API
 * Endpoint: http://<host-ip>/SchedulingSystem/api/sync.php
 *
 * Automatically creates the `turotugma_db` MySQL database and relational tables
 * (`system_state`, `teachers`, `subjects`, `sections`, `published_schedules`, `historical_archives`)
 * so that all browsers and devices on the same Wi-Fi/LAN share identical live data
 * and panelists can inspect structured tables inside phpMyAdmin.
 */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

$DB_HOST = "127.0.0.1";
$DB_USER = "root";
$DB_PASS = "";
$DB_NAME = "turotugma_db";
$FALLBACK_FILE = __DIR__ . "/storage_fallback.json";

/**
 * Connect to XAMPP MySQL and auto-provision database + tables if they do not exist.
 */
function getDatabaseConnection($host, $user, $pass, $dbName) {
    try {
        $pdo = new PDO(
            "mysql:host={$host};charset=utf8mb4",
            $user,
            $pass,
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_TIMEOUT => 2,
            ]
        );

        $pdo->exec("CREATE DATABASE IF NOT EXISTS `{$dbName}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        $pdo->exec("USE `{$dbName}`");

        // 1. Master Key-Value State Table (powers instant real-time sync across all React modules)
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS `system_state` (
                `state_key` VARCHAR(120) NOT NULL PRIMARY KEY,
                `state_value` LONGTEXT NOT NULL,
                `client_id` VARCHAR(80) DEFAULT NULL,
                `updated_at` BIGINT NOT NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ");

        // 2. Structured Relational Tables (for phpMyAdmin inspection during Capstone Defense)
        $pdo->exec("
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
        ");

        $pdo->exec("
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
        ");

        $pdo->exec("
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
        ");

        $pdo->exec("
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
        ");

        return $pdo;
    } catch (Exception $e) {
        return null;
    }
}

/**
 * Mirrors structured JSON keys into relational MySQL tables so phpMyAdmin displays clean rows.
 */
function syncRelationalTables($pdo, $key, $rawValue) {
    if (!$pdo) return;
    try {
        $decoded = json_decode($rawValue, true);
        if ($decoded === null) return;

        if ($key === "turotugma_faculty" && is_array($decoded)) {
            $pdo->exec("DELETE FROM `teachers`");
            $stmt = $pdo->prepare("
                INSERT INTO `teachers`
                (`id`, `employee_id`, `name`, `position`, `appointment_status`, `major`, `minor`, `is_class_adviser`, `ancillary_assignments`, `grade_levels`, `assigned_load_percent`, `assigned_load_status`)
                VALUES (:id, :empId, :name, :pos, :appt, :major, :minor, :adv, :anc, :grades, :pct, :status)
            ");
            foreach ($decoded as $t) {
                if (!is_array($t) || empty($t["id"])) continue;
                $anc = isset($t["ancillaryAssignments"]) && is_array($t["ancillaryAssignments"])
                    ? implode(", ", $t["ancillaryAssignments"])
                    : "";
                $grades = isset($t["gradeLevelAssignments"]) && is_array($t["gradeLevelAssignments"])
                    ? implode(", ", $t["gradeLevelAssignments"])
                    : "";
                $stmt->execute([
                    ":id" => (string)$t["id"],
                    ":empId" => isset($t["employeeId"]) ? (string)$t["employeeId"] : "",
                    ":name" => isset($t["name"]) ? (string)$t["name"] : "Unnamed",
                    ":pos" => isset($t["position"]) ? (string)$t["position"] : (isset($t["designation"]) ? (string)$t["designation"] : ""),
                    ":appt" => isset($t["appointmentStatus"]) ? (string)$t["appointmentStatus"] : "Permanent",
                    ":major" => isset($t["major"]) ? (string)$t["major"] : "",
                    ":minor" => isset($t["minor"]) ? (string)$t["minor"] : "",
                    ":adv" => !empty($t["isClassAdviser"]) ? 1 : 0,
                    ":anc" => $anc,
                    ":grades" => $grades,
                    ":pct" => isset($t["assignedLoadPercent"]) ? (int)$t["assignedLoadPercent"] : 0,
                    ":status" => isset($t["assignedLoadStatus"]) ? (string)$t["assignedLoadStatus"] : "Unassigned",
                ]);
            }
        } elseif ($key === "turotugma_subjects" && is_array($decoded)) {
            $pdo->exec("DELETE FROM `subjects`");
            $stmt = $pdo->prepare("
                INSERT INTO `subjects`
                (`id`, `subject_code`, `subject_name`, `school_level`, `grade_level`, `subject_type`, `program_scope`, `classes_per_week`, `hours_per_week`)
                VALUES (:id, :code, :name, :lvl, :grade, :type, :scope, :cpw, :hpw)
            ");
            foreach ($decoded as $s) {
                if (!is_array($s) || empty($s["id"])) continue;
                $stmt->execute([
                    ":id" => (string)$s["id"],
                    ":code" => isset($s["subjectCode"]) ? (string)$s["subjectCode"] : "",
                    ":name" => isset($s["subjectName"]) ? (string)$s["subjectName"] : "",
                    ":lvl" => isset($s["schoolLevel"]) ? (string)$s["schoolLevel"] : "jhs",
                    ":grade" => isset($s["gradeLevel"]) ? (string)$s["gradeLevel"] : "",
                    ":type" => isset($s["subjectType"]) ? (string)$s["subjectType"] : "Core",
                    ":scope" => isset($s["programScope"]) ? (string)$s["programScope"] : (isset($s["strand"]) ? (string)$s["strand"] : "Universal"),
                    ":cpw" => isset($s["classesPerWeek"]) ? (int)$s["classesPerWeek"] : 4,
                    ":hpw" => isset($s["hoursPerWeek"]) ? (float)$s["hoursPerWeek"] : 4.0,
                ]);
            }
        } elseif ($key === "turotugma_sections_created" && is_array($decoded)) {
            $pdo->exec("DELETE FROM `sections`");
            $stmt = $pdo->prepare("
                INSERT INTO `sections`
                (`id`, `school_level`, `grade_level`, `section_name`, `classification_or_track`, `naming_theme`, `adviser_name`)
                VALUES (:id, :lvl, :grade, :name, :track, :theme, :adviser)
            ");
            foreach (["jhs", "shs"] as $lvl) {
                if (!isset($decoded[$lvl]) || !is_array($decoded[$lvl])) continue;
                foreach ($decoded[$lvl] as $gradeKey => $gradeObj) {
                    $gradeNum = (int)preg_replace("/\D/", "", (string)$gradeKey);
                    $theme = isset($gradeObj["theme"]) ? (string)$gradeObj["theme"] : "";
                    $secList = isset($gradeObj["sections"]) && is_array($gradeObj["sections"]) ? $gradeObj["sections"] : [];
                    foreach ($secList as $idx => $sec) {
                        if (!is_array($sec)) continue;
                        $secId = isset($sec["id"]) ? (string)$sec["id"] : "{$lvl}-{$gradeNum}-{$idx}";
                        $secName = isset($sec["name"]) ? (string)$sec["name"] : "Section " . ($idx + 1);
                        $track = isset($sec["classification"]) && $sec["classification"] !== ""
                            ? (string)$sec["classification"]
                            : (isset($sec["cluster"]) && $sec["cluster"] !== "" ? (string)$sec["cluster"] : (isset($sec["track"]) ? (string)$sec["track"] : "Regular"));
                        $stmt->execute([
                            ":id" => $secId,
                            ":lvl" => $lvl,
                            ":grade" => $gradeNum,
                            ":name" => $secName,
                            ":track" => $track,
                            ":theme" => isset($sec["theme"]) ? (string)$sec["theme"] : $theme,
                            ":adviser" => isset($sec["adviser"]) ? (string)$sec["adviser"] : "",
                        ]);
                    }
                }
            }
        } elseif ($key === "turotugma_published_schedules" && is_array($decoded)) {
            $pdo->exec("DELETE FROM `published_schedules`");
            $stmt = $pdo->prepare("
                INSERT INTO `published_schedules`
                (`schedule_key`, `academic_year`, `schedule_type`, `total_assignments`, `conflicts_count`, `published_at`, `payload_json`)
                VALUES (:skey, :ay, :stype, :total, :conflicts, :pubAt, :payload)
            ");
            foreach ($decoded as $sKey => $schedObj) {
                if (!is_array($schedObj)) continue;
                $assignmentsCount = isset($schedObj["assignments"]) && is_array($schedObj["assignments"])
                    ? count($schedObj["assignments"])
                    : 0;
                $conflictsCount = isset($schedObj["conflicts"]) && is_array($schedObj["conflicts"])
                    ? count($schedObj["conflicts"])
                    : 0;
                $stmt->execute([
                    ":skey" => (string)$sKey,
                    ":ay" => isset($schedObj["academicYear"]) ? (string)$schedObj["academicYear"] : "2026-2027",
                    ":stype" => isset($schedObj["scheduleType"]) ? (string)$schedObj["scheduleType"] : (string)$sKey,
                    ":total" => $assignmentsCount,
                    ":conflicts" => $conflictsCount,
                    ":pubAt" => isset($schedObj["publishedAt"]) ? (string)$schedObj["publishedAt"] : date("c"),
                    ":payload" => json_encode($schedObj, JSON_UNESCAPED_UNICODE),
                ]);
            }
        }
    } catch (Exception $e) {
        // Ignore relational mirror warnings so primary state sync never fails
    }
}

/**
 * Fallback file read/write if MySQL service in XAMPP is temporarily stopped while Apache is running.
 */
function readFallbackStore($file) {
    if (!file_exists($file)) return [];
    $raw = @file_get_contents($file);
    $data = $raw ? json_decode($raw, true) : [];
    return is_array($data) ? $data : [];
}

function writeFallbackStore($file, $store) {
    @file_put_contents($file, json_encode($store, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT), LOCK_EX);
}

$pdo = getDatabaseConnection($DB_HOST, $DB_USER, $DB_PASS, $DB_NAME);
$storageEngine = $pdo ? "mysql" : "file_fallback";
$nowMs = (int)round(microtime(true) * 1000);

// Handle GET requests
if ($_SERVER["REQUEST_METHOD"] === "GET") {
    $action = isset($_GET["action"]) ? $_GET["action"] : "all";

    if ($pdo) {
        if ($action === "meta") {
            $stmt = $pdo->query("SELECT MAX(`updated_at`) AS `latest_version`, COUNT(*) AS `key_count` FROM `system_state`");
            $row = $stmt->fetch();
            echo json_encode([
                "ok" => true,
                "engine" => "mysql",
                "database" => $DB_NAME,
                "version" => isset($row["latest_version"]) ? (int)$row["latest_version"] : 0,
                "keyCount" => isset($row["key_count"]) ? (int)$row["key_count"] : 0,
                "serverTime" => $nowMs,
            ]);
            exit;
        }

        $stmt = $pdo->query("SELECT `state_key`, `state_value`, `client_id`, `updated_at` FROM `system_state`");
        $rows = $stmt->fetchAll();
        $items = [];
        $maxVersion = 0;
        foreach ($rows as $r) {
            $ver = (int)$r["updated_at"];
            if ($ver > $maxVersion) $maxVersion = $ver;
            $items[$r["state_key"]] = [
                "value" => $r["state_value"],
                "clientId" => $r["client_id"],
                "updatedAt" => $ver,
            ];
        }

        echo json_encode([
            "ok" => true,
            "engine" => "mysql",
            "database" => $DB_NAME,
            "version" => $maxVersion,
            "keyCount" => count($items),
            "items" => $items,
        ]);
        exit;
    } else {
        // Fallback file store if MySQL isn't started yet
        $store = readFallbackStore($FALLBACK_FILE);
        $maxVersion = 0;
        foreach ($store as $entry) {
            $ver = isset($entry["updatedAt"]) ? (int)$entry["updatedAt"] : 0;
            if ($ver > $maxVersion) $maxVersion = $ver;
        }

        if ($action === "meta") {
            echo json_encode([
                "ok" => true,
                "engine" => "file_fallback",
                "database" => "storage_fallback.json (Start MySQL in XAMPP for phpMyAdmin)",
                "version" => $maxVersion,
                "keyCount" => count($store),
                "serverTime" => $nowMs,
            ]);
            exit;
        }

        echo json_encode([
            "ok" => true,
            "engine" => "file_fallback",
            "version" => $maxVersion,
            "keyCount" => count($store),
            "items" => $store,
        ]);
        exit;
    }
}

// Handle POST requests
if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $rawInput = file_get_contents("php://input");
    $payload = json_decode($rawInput, true);

    if (!is_array($payload)) {
        http_response_code(400);
        echo json_encode(["ok" => false, "error" => "Invalid JSON body"]);
        exit;
    }

    $action = isset($payload["action"]) ? $payload["action"] : "upsert";
    $clientId = isset($payload["clientId"]) ? (string)$payload["clientId"] : "browser";

    if ($pdo) {
        if ($action === "bulk_upsert" && isset($payload["items"]) && is_array($payload["items"])) {
            $stmt = $pdo->prepare("
                INSERT INTO `system_state` (`state_key`, `state_value`, `client_id`, `updated_at`)
                VALUES (:k, :v, :c, :u)
                ON DUPLICATE KEY UPDATE
                    `state_value` = VALUES(`state_value`),
                    `client_id` = VALUES(`client_id`),
                    `updated_at` = VALUES(`updated_at`)
            ");
            $count = 0;
            foreach ($payload["items"] as $k => $v) {
                if (strpos((string)$k, "turotugma_") !== 0) continue;
                $valStr = is_string($v) ? $v : json_encode($v, JSON_UNESCAPED_UNICODE);
                $stmt->execute([
                    ":k" => (string)$k,
                    ":v" => $valStr,
                    ":c" => $clientId,
                    ":u" => $nowMs,
                ]);
                syncRelationalTables($pdo, (string)$k, $valStr);
                $count++;
            }
            echo json_encode([
                "ok" => true,
                "engine" => "mysql",
                "updatedCount" => $count,
                "version" => $nowMs,
            ]);
            exit;
        }

        if ($action === "upsert" && !empty($payload["key"])) {
            $k = (string)$payload["key"];
            $v = isset($payload["value"]) ? $payload["value"] : "";
            $valStr = is_string($v) ? $v : json_encode($v, JSON_UNESCAPED_UNICODE);

            $stmt = $pdo->prepare("
                INSERT INTO `system_state` (`state_key`, `state_value`, `client_id`, `updated_at`)
                VALUES (:k, :v, :c, :u)
                ON DUPLICATE KEY UPDATE
                    `state_value` = VALUES(`state_value`),
                    `client_id` = VALUES(`client_id`),
                    `updated_at` = VALUES(`updated_at`)
            ");
            $stmt->execute([
                ":k" => $k,
                ":v" => $valStr,
                ":c" => $clientId,
                ":u" => $nowMs,
            ]);

            syncRelationalTables($pdo, $k, $valStr);

            echo json_encode([
                "ok" => true,
                "engine" => "mysql",
                "key" => $k,
                "version" => $nowMs,
            ]);
            exit;
        }

        if ($action === "remove" && !empty($payload["key"])) {
            $k = (string)$payload["key"];
            $stmt = $pdo->prepare("DELETE FROM `system_state` WHERE `state_key` = :k");
            $stmt->execute([":k" => $k]);
            echo json_encode([
                "ok" => true,
                "engine" => "mysql",
                "removed" => $k,
                "version" => $nowMs,
            ]);
            exit;
        }
    } else {
        // Fallback file store
        $store = readFallbackStore($FALLBACK_FILE);
        if ($action === "bulk_upsert" && isset($payload["items"]) && is_array($payload["items"])) {
            foreach ($payload["items"] as $k => $v) {
                if (strpos((string)$k, "turotugma_") !== 0) continue;
                $store[(string)$k] = [
                    "value" => is_string($v) ? $v : json_encode($v, JSON_UNESCAPED_UNICODE),
                    "clientId" => $clientId,
                    "updatedAt" => $nowMs,
                ];
            }
            writeFallbackStore($FALLBACK_FILE, $store);
            echo json_encode(["ok" => true, "engine" => "file_fallback", "version" => $nowMs]);
            exit;
        }

        if ($action === "upsert" && !empty($payload["key"])) {
            $k = (string)$payload["key"];
            $v = isset($payload["value"]) ? $payload["value"] : "";
            $store[$k] = [
                "value" => is_string($v) ? $v : json_encode($v, JSON_UNESCAPED_UNICODE),
                "clientId" => $clientId,
                "updatedAt" => $nowMs,
            ];
            writeFallbackStore($FALLBACK_FILE, $store);
            echo json_encode(["ok" => true, "engine" => "file_fallback", "key" => $k, "version" => $nowMs]);
            exit;
        }

        if ($action === "remove" && !empty($payload["key"])) {
            $k = (string)$payload["key"];
            unset($store[$k]);
            writeFallbackStore($FALLBACK_FILE, $store);
            echo json_encode(["ok" => true, "engine" => "file_fallback", "removed" => $k, "version" => $nowMs]);
            exit;
        }
    }

    echo json_encode(["ok" => false, "error" => "Unsupported action"]);
    exit;
}

