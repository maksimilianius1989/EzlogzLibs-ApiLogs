<?php

if (!defined('MAIN_LINK')) {
    if (isset($_SERVER['SERVER_NAME'])) {
        $MAIN_LINK = 'https://'.$_SERVER['SERVER_NAME'];
    } else {
        $MAIN_LINK = 'https://api-logs.ezlogz.com';
    }
} else {
    $MAIN_LINK = MAIN_LINK;
}

$DB_HOST = defined('DB_HOST') ? DB_HOST : getenv('DB_HOST');
$DB_USER = defined('DB_USER') ? DB_USER : getenv('DB_USER');
$DB_PASSWORD = defined('DB_PASSWORD') ? DB_PASSWORD : getenv('DB_PASSWORD');
$DB_NAME = defined('DB_NAME') ? DB_NAME : getenv('DB_NAME');