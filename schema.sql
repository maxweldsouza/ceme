-- Ceme database schema

use cemeio;

DROP TABLE IF EXISTS users;
CREATE TABLE users
(
    user_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_name TINYTEXT NOT NULL,
    user_hash TINYTEXT NOT NULL,
    user_salt VARCHAR(32) NOT NULL,
    user_email TINYTEXT NOT NULL,
    user_group TINYINT UNSIGNED NOT NULL
);

DROP TABLE IF EXISTS pages;
CREATE TABLE pages
(
    page_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    page_name TEXT NOT NULL,
    page_content TEXT NOT NULL,
    page_group TINYINT UNSIGNED NOT NULL,
    page_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    page_username VARCHAR(255),
    page_ip VARBINARY(16) NOT NULL
);

