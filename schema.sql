use cemeio;

CREATE TABLE users
(
    user_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_name TINYTEXT NOT NULL,
    user_email TINYTEXT NOT NULL,
    user_password TINYTEXT NOT NULL,
    user_salt TINYTEXT NOT NULL,
    user_group TINYINT UNSIGNED NOT NULL
);

CREATE TABLE pages
(
    page_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    page_name TEXT NOT NULL,
    page_content TEXT NOT NULL,
    page_group TINYINT UNSIGNED NOT NULL,
    page_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    page_userid VARCHAR(255),
    page_ip VARBINARY(16) NOT NULL,
    page_iscurrent TINYINT UNSIGNED NOT NULL
);

