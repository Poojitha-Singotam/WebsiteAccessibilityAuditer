-- Web Accessibility Auditor Database Schema
-- MySQL 8.0+

CREATE DATABASE IF NOT EXISTS `accessibility_auditor` 
DEFAULT CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `accessibility_auditor`;

-- Drop existing tables in reverse dependency order if resetting
DROP TABLE IF EXISTS `audit_issues`;
DROP TABLE IF EXISTS `audit_summary`;
DROP TABLE IF EXISTS `audits`;
DROP TABLE IF EXISTS `users`;

-- 1. Users Table
CREATE TABLE `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(150) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Audits Table
CREATE TABLE `audits` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `page_name` VARCHAR(255) NOT NULL,
    `score` INT NOT NULL DEFAULT 100,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_audits_user` 
        FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX `idx_audits_user_created` (`user_id`, `created_at` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Audit Summary Table
CREATE TABLE `audit_summary` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `audit_id` INT NOT NULL UNIQUE,
    `critical_count` INT NOT NULL DEFAULT 0,
    `error_count` INT NOT NULL DEFAULT 0,
    `warning_count` INT NOT NULL DEFAULT 0,
    `info_count` INT NOT NULL DEFAULT 0,
    `pass_count` INT NOT NULL DEFAULT 0,
    CONSTRAINT `fk_summary_audit` 
        FOREIGN KEY (`audit_id`) REFERENCES `audits` (`id`) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Audit Issues Table
CREATE TABLE `audit_issues` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `audit_id` INT NOT NULL,
    `rule_id` VARCHAR(50) NOT NULL,
    `category` VARCHAR(50) NOT NULL,
    `severity` ENUM('CRITICAL', 'ERROR', 'WARNING', 'INFO', 'PASS') NOT NULL,
    `message` VARCHAR(255) NOT NULL,
    `element_html` TEXT,
    `explanation` TEXT,
    `recommendation` TEXT,
    `wcag_reference` VARCHAR(100),
    CONSTRAINT `fk_issues_audit` 
        FOREIGN KEY (`audit_id`) REFERENCES `audits` (`id`) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX `idx_issues_audit_id` (`audit_id`),
    INDEX `idx_issues_severity` (`severity`),
    INDEX `idx_issues_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
