<?php

function debug(...$args) {
    $ip = defined(DEV_IP) ? DEV_IP : '62.216.44.230';
    if ($_SERVER['REMOTE_ADDR'] == $ip) {
        echo '<pre>', var_dump($args), '</pre>';
    }
}

function c($el, $userId = false) {
    if ($userId) {
        global $id;
        if ($id != $userId) {
            return;
        }
    }
    print_r($el);
    echo php_sapi_name() === 'cli' ? "\n" : '<br>';
}

function l($el, $userId = false) {
    setServerTimeZoneToUTC();
    if ($userId) {
        global $id;
        if ($id != $userId) {
            return;
        }
    }
    error_log(json_encode($el));
    setServerTimeZoneToUserTimeZone();
}

$lastTimerTime = 0;

function timer($userId = false, $text = '') {
    if (!$userId) {
        return false;
    }
    global $id, $lastTimerTime;
    if ($id != $userId) {
        return;
    }
    list($usec, $sec) = explode(" ", microtime());
    $newTimerTime = ((float) $usec + (float) $sec);
    $time = 'Timer init';
    if ($lastTimerTime != 0) {
        $time = number_format($newTimerTime - $lastTimerTime, 5);
    }
    l('|| ' . $time . ' || ' . $text, $userId);
    $lastTimerTime = $newTimerTime;
}

function saveLogsStatistics($action, $platform) {
    global $db2;
    $beginOfDay = strtotime('midnight', time());

    $db2->querySql("INSERT INTO logs_statistics (`action`, `platform`, `amount`, `date`) "
            . "VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE amount = amount + 1", [$action, $platform, 1, $beginOfDay]);
}

function get_string_between($string, $start, $end) {
    $string = ' ' . $string;
    $ini = strpos($string, $start);
    if ($ini == 0)
        return '';
    $ini += strlen($start);
    $len = strpos($string, $end, $ini) - $ini;
    return substr($string, $ini, $len);
}

function getLimitFromPagin($params) {
    $perPage = isset($params['pagination']['perPage']) ? (int) $params['pagination']['perPage'] : 20;
    $from = ($params['pagination']['page'] - 1) * $perPage;
    $limit = "limit {$from}, {$perPage}";
    return $limit;
}

function getOrderFromPagin($params) {
    $orderByText = '';
    if (!empty($params['pagination']['orderBy'])) {
        $orderBy = $params['pagination']['orderBy'];
        $orderBy['dir'] = isset($orderBy['dir']) ? $orderBy['dir'] : 'desc';
        $orderByText = 'Order by ' . $orderBy['param'] . ' ' . $orderBy['dir'];
    }
    return $orderByText;
}

function getModelLimit($params) {
    if (!isset($params['perPage']) || !isset($params['page'])) {
        return '';
    }
    $perPage = isset($params['perPage']) ? (int) $params['perPage'] : 20;
    $from = ($params['page'] - 1) * $perPage;
    $limit = "limit {$from}, {$perPage}";
    return $limit;
}

function getModelOrder($params) {
    if (!isset($params['orderBy'])) {
        return '';
    }
    $orderByText = '';
    if (!empty($params['orderBy'])) {
        $orderBy = $params['orderBy'];
        $orderBy['dir'] = isset($orderBy['dir']) ? $orderBy['dir'] : 'desc';
        $orderByText = 'Order by ' . $orderBy['param'] . ' ' . $orderBy['dir'];
    }
    return $orderByText;
}

function curUserIsEzlogzEmployee() {
    global $curUser;
    if (in_array($curUser->position, [TYPE_EMPLOYEE, TYPE_SUPERADMIN, TYPE_EZLOGZ_MANAGER, TYPE_EZLOGZ_RESELLER])) {
        return true;
    }
    return false;
}

function curUserIsClient() {
    return !curUserIsEzlogzEmployee();
}

function getTimeZoneStrFromId($timeZone) {
    if ($timeZone == 1) {
        $tzString = 'America/Chicago';
    } else if ($timeZone == 2) {
        $tzString = 'America/Denver';
    } else if ($timeZone == 3) {
        $tzString = 'America/Los_Angeles';
    } else if ($timeZone == 4) {
        $tzString = 'America/Anchorage';
    } else if ($timeZone == 5) {
        $tzString = 'America/Indiana/Indianapolis';
    } else if ($timeZone == 6) {
        $tzString = 'Canada/Atlantic';
    } else if ($timeZone == 7) {
        $tzString = 'Canada/Saskatchewan';
    } else if ($timeZone == 8) {
        $tzString = 'America/Phoenix';
    } else if ($timeZone == 97) {
        $tzString = 'Universal';
    } else if ($timeZone == 98) {
        $tzString = 'Europe/Kiev';
    } else if ($timeZone == 99) {
        $tzString = 'Asia/Manila';
    } else {
        $tzString = 'America/New_York';
    }
    return $tzString;
}

function setServerTimeZoneToUTC() {
    global $curTz;
    $curTz = date_default_timezone_get();
    date_default_timezone_set('UTC');
}

function setServerTimeZoneToOther($newTz) {
    global $curTz;
    if (is_numeric($newTz)) {
        $newTz = getTimeZoneStrFromId($newTz);
    }
    $curTz = date_default_timezone_get();
    date_default_timezone_set($newTz);
}

function setServerTimeZoneToUserTimeZone() {
    global $curTz;
    date_default_timezone_set($curTz);
}

function createRandomVal($val, $type = false) {
    $chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789,-";
    if ($type == 'NoSigns') {
        $chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    } else if ($type == 'Numbers') {
        $chars = "0123456789";
    } else if ($type == 'Letters') {
        $chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    }
    srand((double) microtime() * 1000000);
    $i = 0;
    $pass = '';
    while ($i <= $val) {
        $num = rand() % 33;
        $tmp = substr($chars, $num, 1);
        $pass = $pass . $tmp;
        $i++;
    }
    return $pass;
}

function generateSession() {
    global $db2;
    $newSession = false;
    while (!$newSession) {
        $sessionId = 'my' . createRandomVal(10) . createRandomVal(10);
        $session = $db2->select('*', '`sessions`', 'sessionId=?', [$sessionId]);
        if (empty($session)) {
            $newSession = $sessionId;
        }
    }
    return $newSession;
}

function isDriver($position) {
    return in_array($position, [TYPE_DRIVER_ELD, TYPE_DRIVER]);
}

function setTimeZoneTime($timeZone) {
    $tzString = getTimeZoneStrFromId($timeZone);
    date_default_timezone_set($tzString);
}

function getCurrentProjectName() {
    $name = PROJECT_INFO['MAIN']['COMPANY_NAME'];
    if (getCurrentProject() == 'LOGIT') {
        $name = PROJECT_INFO['LOGIT']['COMPANY_NAME'];
    }
    return $name;
}

function getCurrentProject() {
    $platform = PROJECT_TYPE;
    if (isset($_COOKIE['cur_platform']) && $_COOKIE['cur_platform'] == 'logit') {
        $platform = 'LOGIT';
    }
    return $platform;
}

function getCurrentSupportMail() {
    return EZLOGZ_EMAIL_SUPPORT;
}

function getCurrentMainLink() {
    $link = MAIN_LINK;

    if (defined('MAIN_LINK_REWRITE')) {
        $link = MAIN_LINK_REWRITE;
    }

    if (getCurrentProject() == 'LOGIT') {
        $link = LOGIT_MAIN_LINK;
    }
    return $link;
}

function getCurrentPhones() {
    $phone = PROJECT_INFO['MAIN']['COMPANY_PHONE'];
    if (getCurrentProject() == 'LOGIT') {
        $phone = PROJECT_INFO['LOGIT']['COMPANY_PHONE'];
    }
    return $phone;
}

function getValueIfExist($var, $key, $default = '') {
    return isset($var) && !empty($var) && isset($var[$key]) ? $var[$key] : $default;
}

function getCurrentProjectAppLink() {
    $appLink = array();
    $appLink['android'] = PROJECT_INFO['MAIN']['ANDROID_APP_LINK'];
    $appLink['ios'] = PROJECT_INFO['MAIN']['IOS_APP_LINK'];
    if (getCurrentProject() == 'LOGIT') {
        $appLink['android'] = PROJECT_INFO['LOGIT']['ANDROID_APP_LINK'];
        $appLink['ios'] = PROJECT_INFO['LOGIT']['IOS_APP_LINK'];
    }
    return $appLink;
}

function getTypeById($type, $id) {
    global $db2;
    $type = $db2->row('name', $type, '`id`=?', [$id]);
    $name = empty($type) ? '' : $type['name'];
    return $name;
}

function base64_to_file($base64_string, $output_file) {
    $ifp = fopen($output_file, "wb");
    $data = explode(',', $base64_string);
    if (isset($data[1])) {
        fwrite($ifp, base64_decode($data[1]));
    } else {
        fwrite($ifp, base64_decode($data[0]));
    }
    fclose($ifp);
    return $output_file;
}

function modelFilters($filters, $tables, $paramsFilter, $paramsTables) {
    $where = '';
    $where_val = [];
    $select = '';
    $joins = '';

    foreach ($paramsFilter as $paramKey => $paramValue) {
        if (!isset($filters[$paramKey])) {
            continue;
        }
        $filter = $filters[$paramKey];
        if ($filter['equal'] == '=') {
            $where .= " AND {$filter['table']}.{$filter['param']}=?";
            array_push($where_val, $paramValue);
        } else if ($filter['equal'] == 'like') {
            $where .= " AND {$filter['table']}.{$filter['param']} like ?";
            array_push($where_val, "%{$paramValue}%");
        } else if ($filter['equal'] == 'in') {
            $list = implode(",", $paramValue);
            $where .= " AND {$filter['table']}.{$filter['param']} IN({$list})";
        }
    }

    foreach ($paramsTables as $paramTable) {
        if (!isset($tables[$paramTable])) {
            continue;
        }
        $table = $tables[$paramTable];
        $joins .= ' ' . $table['join'];
        $select .= ',' . $table['select'];
    }

    return ['where' => $where, 'where_val' => $where_val, 'select' => $select, 'joins' => $joins];
}

function miles2km(float $c) {
    return round($c * 1.6093, 2);  // returns a string
}

function km2miles(float $c) {
    return round($c / 1.6093, 2);  // returns a string
}

function getDistance($latitude1, $longitude1, $latitude2, $longitude2) {
    $earth_radius = 6371;

    $dLat = deg2rad($latitude2 - $latitude1);
    $dLon = deg2rad($longitude2 - $longitude1);

    $a = sin($dLat / 2) * sin($dLat / 2) + cos(deg2rad($latitude1)) * cos(deg2rad($latitude2)) * sin($dLon / 2) * sin($dLon / 2);
    $c = 2 * asin(sqrt($a));
    $d = $earth_radius * $c;

    return $d;
}

function getIp() {
    $keys = [
        'HTTP_CLIENT_IP',
        'HTTP_X_FORWARDED_FOR',
        'REMOTE_ADDR'
    ];
    foreach ($keys as $key) {
        if (!empty($_SERVER[$key])) {
			$serKey = explode(',', $_SERVER[$key]);
            $ip = trim(end($serKey));
            if (filter_var($ip, FILTER_VALIDATE_IP)) {
                return $ip;
            }
        }
    }
}

function sleepHttpResponse() {
    if (!(defined('DEV_ENV') && DEV_ENV === true)) {
        return;
    }
    if (isset($_GET['sleepResponse']) && (int)$_GET['sleepResponse'] > 0) {
        sleep((int)$_GET['sleepResponse']);
        return;
    }
    if (defined('SLEEP_RESPONSE') && (int)SLEEP_RESPONSE > 0) {
        sleep((int)SLEEP_RESPONSE);
        return;
    }
}

function printToFile($message, $isDai = false) {
    $messageStr = print_r($message, true);
    
    $res = file_put_contents(__DIR__ . '/printToFile.log', '--- Start ----', FILE_APPEND);
    $res = file_put_contents(__DIR__ . '/printToFile.log', $messageStr, FILE_APPEND);
    
    if (empty($res)) {
        throw new Exception('Error save printToFile.log from printToFile()');
    }
    
    if ($isDai) {
        die('Stop from printToFile');
    }
}

function debugBacktraceToFile($isStop = false) {
    $dbt = debug_backtrace();
    foreach ($dbt as $key => $item) {
        unset($dbt[$key]['object']);
        unset($dbt[$key]['args']);
    }
    $res = print_r($dbt, true);
    file_put_contents(__DIR__ . '/debugToFile.log', '--- Start ----', FILE_APPEND);
    file_put_contents(__DIR__ . '/debugToFile.log', $res, FILE_APPEND);
    
    if ($isStop) {
        die('Stop from debugBacktraceToFile');
    }
}
