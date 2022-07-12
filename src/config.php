<?php
if (isset($_SERVER['DOCUMENT_ROOT']) && file_exists($_SERVER['DOCUMENT_ROOT'] . '/config.php')) {
    include_once $_SERVER['DOCUMENT_ROOT'] . '/config.php';
}

if (!isset($GLOBALS['API_LOGS'])) {
    global $id;
    $GLOBALS['API_LOGS'] = [
        'USER_ID' => $id ?? 0,
    ];
}

if (isset($_ENV['DATABASE_URL'])) {
    $dbHost = str_replace('mysql://', '', $_ENV['DATABASE_URL']);
    $userAndUrl = explode('@', $dbHost);
    $user = explode(':', $userAndUrl[0]);
    $hostAndDB = explode('/', $userAndUrl[1]);
}

$GLOBALS['API_LOGS'] = array_merge($GLOBALS['API_LOGS'], [
    'MAIN_LINK' => defined('MAIN_LINK') ? MAIN_LINK : $_SERVER['SERVER_NAME'] ?? 'https://api-logs.ezlogz.local',
    'DB_HOST' => defined('DB_HOST') ? DB_HOST : $hostAndDB[0] ?? $_ENV['DB_HOST'] ?? false,
    'DB_USER' => defined('DB_USER') ? DB_USER : $user[0] ?? $_ENV['DB_USER'] ?? false,
    'DB_PASSWORD' => defined('DB_PASSWORD') ? DB_PASSWORD : $user[1] ?? $_ENV['DB_PASSWORD'] ?? false,
    'DB_NAME' => defined('DB_NAME') ? DB_NAME : $hostAndDB[1] ?? $_ENV['DB_NAME'] ?? false,
    'MONGO_EZLOGZ_HOST' => defined('MONGO_EZLOGZ_HOST') ? MONGO_EZLOGZ_HOST : $_ENV['MONGO_EZLOGZ_HOST'] ?? 'mongodb://172.31.32.100:27017',
    'LOCAL_ENV' => defined('DEV_ENV') ? DEV_ENV : isset($_ENV['APP_ENV']) && $_ENV['APP_ENV'] !== 'prod' ? true : false ?? true,
]);