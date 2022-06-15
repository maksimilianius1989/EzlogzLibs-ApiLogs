<?php

namespace Ezlogz\ApiLogs\db\classes;

use Exception;

require_once __DIR__ . '/../connect.php';

class Logs
{
    public static function AddLogV2(int $userId, ?array $body, int $platform, int $depthCallOfFunctions = 1, array $headers = [], array $cookie = [])
    {
        $GLOBALS['API_LOGS']['USER_ID'] = $userId;
        
        $backtrace = debug_backtrace();
        $action = 'unknown';
        if (isset($backtrace[$depthCallOfFunctions])) {
            $action = $backtrace[$depthCallOfFunctions]['function'];
        }

        return self::AddLog($action, $body, $platform, array_merge($headers, $cookie));
    }
    
    public static function AddLog($action, $req, $web = 0, array $cookie = [])
    {
        $GLOBALS['API_LOGS']['IP'] = getenv('HTTP_CLIENT_IP') ?:
            getenv('HTTP_X_FORWARDED_FOR') ?:
                getenv('HTTP_X_FORWARDED') ?:
                    getenv('HTTP_FORWARDED_FOR') ?:
                        getenv('HTTP_FORWARDED') ?:
                            getenv('REMOTE_ADDR');
        $insParams = array();
        $insParams['requestDateTime'] = time();
        $insParams['responseDateTime'] = time();
        $insParams['ip'] = $GLOBALS['API_LOGS']['IP'];
        $insParams['web'] = $web;
        $insParams['action'] = $action;
        $insParams['platform'] = isset($_SERVER['HTTP_USER_AGENT']) ? json_encode($_SERVER['HTTP_USER_AGENT']) : '';
        $insParams['requestData'] = is_object($req) || is_array($req) ? json_encode($req, JSON_UNESCAPED_SLASHES) : (string) $req;
        $insParams['responseData'] = '';
        $insParams['cookies'] = !empty($cookie) ? json_encode($cookie, JSON_UNESCAPED_SLASHES) : json_encode($_COOKIE, JSON_UNESCAPED_SLASHES);
        $insParams['userId'] = $GLOBALS['API_LOGS']['USER_ID'] ?? 0;
        Logs::createLogTable();
        if ($GLOBALS['API_LOGS']['LOCAL_ENV'])
            $GLOBALS['API_LOGS']['GLOB_LOG_ID'] = $GLOBALS['API_LOGS']['DB2']->insert("`api_logs_{$GLOBALS['API_LOGS']['REQUEST_DATE']}`", $insParams);
        $insParams = (object)$insParams;
        if (!$GLOBALS['API_LOGS']['LOCAL_ENV'])
            try {
                $GLOBALS['API_LOGS']['GLOB_MONGO_LOG_ID'] = $GLOBALS['API_LOGS']['MONGO_LOGS_TABLE']->insertOne($insParams);
                $GLOBALS['API_LOGS']['GLOB_MONGO_LOG_ID'] = (array)$GLOBALS['API_LOGS']['GLOB_MONGO_LOG_ID']->getInsertedId();
                $GLOBALS['API_LOGS']['GLOB_MONGO_LOG_ID'] = $GLOBALS['API_LOGS']['GLOB_MONGO_LOG_ID']['oid'];
            } catch (Exception $e) {
                l('MONGO AddLog');
                l($e->getMessage());
                l($insParams);
            }
        
        return $GLOBALS['API_LOGS']['GLOB_MONGO_LOG_ID'] ?: $GLOBALS['API_LOGS']['GLOB_LOG_ID'];
    }
    
    public static function AddLogResponse($resp, $logId = 0)
    {
        if (empty($logId)) {
            $logId = $GLOBALS['API_LOGS']['GLOB_MONGO_LOG_ID'] ?? $GLOBALS['API_LOGS']['GLOB_LOG_ID'];
        }
        
        if (is_object($resp) || is_array($resp)) {
            $resp = json_encode($resp, JSON_UNESCAPED_SLASHES);
        }
        
        $responseDateTime = time();
        $userId = isset($id) && !empty($id) ? $id : 0;
        if ($userId != 0) {
            if ($GLOBALS['API_LOGS']['LOCAL_ENV'])
                $GLOBALS['API_LOGS']['DB2']->update("`api_logs_{$GLOBALS['API_LOGS']['REQUEST_DATE']}`", 'responseDateTime=?, responseData=?, userId=?', 'id=?', [$responseDateTime, $resp, $userId, $logId]);
            if (!$GLOBALS['API_LOGS']['LOCAL_ENV'])
                try {
                    $GLOBALS['API_LOGS']['MONGO_LOGS_TABLE']->updateOne(
                        ['_id' => new \MongoDB\BSON\ObjectId($logId)],
                        ['$set' => ['responseDateTime' => $responseDateTime, 'responseData' => $resp, 'userId' => $userId]]
                    );
                } catch (Exception $e) {
                    l('MONGO AddLogResponse');
                    l($e->getMessage());
                    l([$responseDateTime, $resp, $userId, $logId]);
                }
            
        } else {
            if ($GLOBALS['API_LOGS']['LOCAL_ENV'])
                $GLOBALS['API_LOGS']['DB2']->update("`api_logs_{$GLOBALS['API_LOGS']['REQUEST_DATE']}`", 'responseDateTime=?, responseData=?', 'id=?', [$responseDateTime, $resp, $logId]);
            if (!$GLOBALS['API_LOGS']['LOCAL_ENV'])
                try {
                    $GLOBALS['API_LOGS']['MONGO_LOGS_TABLE']->updateOne(
                        ['_id' => new \MongoDB\BSON\ObjectId($logId)],
                        ['$set' => ['responseDateTime' => $responseDateTime, 'responseData' => $resp]]
                    );
                } catch (Exception $e) {
                    l('MONGO AddLogResponse2');
                    l($e->getMessage());
                    l([$responseDateTime, $resp, $logId]);
                }
            
        }
    }
    
    public static function LogEmail($action, $req)
    {
        $userData = $GLOBALS['API_LOGS']['DB2']->row('id', '`users`', ['email' => $req['to']]);
        $GLOBALS['API_LOGS']['IP'] = getenv('HTTP_CLIENT_IP') ?:
            getenv('HTTP_X_FORWARDED_FOR') ?:
                getenv('HTTP_X_FORWARDED') ?:
                    getenv('HTTP_FORWARDED_FOR') ?:
                        getenv('HTTP_FORWARDED') ?:
                            getenv('REMOTE_ADDR');
        $insParams = array();
        $insParams['requestDateTime'] = time();
        $insParams['ip'] = $GLOBALS['API_LOGS']['IP'];
        $insParams['web'] = 2;
        $insParams['action'] = $action;
        $insParams['platform'] = isset($_SERVER['HTTP_USER_AGENT']) ? json_encode($_SERVER['HTTP_USER_AGENT']) : '';
        $insParams['requestData'] = json_encode($req);
        $insParams['cookies'] = json_encode($_COOKIE);
        $insParams['userId'] = !empty($userData['id']) ? (int)$userData['id'] : 0;
        Logs::createLogTable();
        if ($GLOBALS['API_LOGS']['LOCAL_ENV'])
            $GLOBALS['API_LOGS']['DB2']->insert("`api_logs_{$GLOBALS['API_LOGS']['REQUEST_DATE']}`", $insParams);
        if (!$GLOBALS['API_LOGS']['LOCAL_ENV'])
            try {
                $GLOBALS['API_LOGS']['MONGO_LOGS_TABLE']->insertOne($insParams);
            } catch (Exception $e) {
                l('MONGO LogEmail');
                l($e->getMessage());
                l($insParams);
            }
    }
    
    public static function LogPDF($action, $req, $id)
    {
        $GLOBALS['API_LOGS']['IP'] = getenv('HTTP_CLIENT_IP') ?:
            getenv('HTTP_X_FORWARDED_FOR') ?:
                getenv('HTTP_X_FORWARDED') ?:
                    getenv('HTTP_FORWARDED_FOR') ?:
                        getenv('HTTP_FORWARDED') ?:
                            getenv('REMOTE_ADDR');
        $insParams = array();
        $insParams['requestDateTime'] = time();
        $insParams['ip'] = $GLOBALS['API_LOGS']['IP'];
        $insParams['web'] = 6;
        $insParams['action'] = $action;
        $insParams['platform'] = isset($_SERVER['HTTP_USER_AGENT']) ? json_encode($_SERVER['HTTP_USER_AGENT']) : '';
        $insParams['requestData'] = json_encode($req);
        $insParams['cookies'] = json_encode($_COOKIE);
        $insParams['userId'] = $id;
        Logs::createLogTable();
        if ($GLOBALS['API_LOGS']['LOCAL_ENV'])
            $GLOBALS['API_LOGS']['GLOB_LOG_ID'] = $GLOBALS['API_LOGS']['DB2']->insert("`api_logs_{$GLOBALS['API_LOGS']['REQUEST_DATE']}`", $insParams);
        if (!$GLOBALS['API_LOGS']['LOCAL_ENV'])
            try {
                $GLOBALS['API_LOGS']['MONGO_LOGS_TABLE']->insertOne($insParams);
            } catch (Exception $e) {
                l('MONGO LogPDF');
                l($e->getMessage());
                l($insParams);
            }
    }
    
    public static function savePushLogs($action, $data, $userId, $type)
    {
        $GLOBALS['API_LOGS']['IP'] = getenv('HTTP_CLIENT_IP') ?:
            getenv('HTTP_X_FORWARDED_FOR') ?:
                getenv('HTTP_X_FORWARDED') ?:
                    getenv('HTTP_FORWARDED_FOR') ?:
                        getenv('HTTP_FORWARDED') ?:
                            getenv('REMOTE_ADDR');
        $insParams = array();
        $insParams['requestDateTime'] = time();
        $insParams['ip'] = $GLOBALS['API_LOGS']['IP'];
        $insParams['web'] = (int)('3' . $type);
        $insParams['action'] = $action;
        $insParams['platform'] = isset($_SERVER['HTTP_USER_AGENT']) ? json_encode($_SERVER['HTTP_USER_AGENT']) : '';
        $insParams['requestData'] = json_encode($data);
        $insParams['responseData'] = $id;
        $insParams['cookies'] = json_encode($_COOKIE);
        $insParams['userId'] = (int)$userId;
        Logs::createLogTable();
        if ($GLOBALS['API_LOGS']['LOCAL_ENV'])
            $GLOBALS['API_LOGS']['DB2']->insert("`api_logs_{$GLOBALS['API_LOGS']['REQUEST_DATE']}`", $insParams);
        if (!$GLOBALS['API_LOGS']['LOCAL_ENV'])
            try {
                $GLOBALS['API_LOGS']['MONGO_LOGS_TABLE']->insertOne($insParams);
            } catch (Exception $e) {
                l('MONGO savePushLogs');
                l($e->getMessage());
                l($insParams);
            }
        
        
        saveLogsStatistics($action, 2);
    }
    
    private static function createLogTable()
    {
        if ($GLOBALS['API_LOGS']['LOCAL_ENV']) {
            $check = $GLOBALS['API_LOGS']['DB2']->querySql("SHOW TABLES LIKE 'api_logs_{$GLOBALS['API_LOGS']['REQUEST_DATE']}'");
            if (count($check) == 0) {
                $GLOBALS['API_LOGS']['DB2']->querySql("CREATE TABLE `api_logs_{$GLOBALS['API_LOGS']['REQUEST_DATE']}` (
                        `id` BIGINT(17) NOT NULL AUTO_INCREMENT,
                        `requestDateTime` INT(11) NULL DEFAULT NULL,
                        `responseDateTime` INT(11) NULL DEFAULT NULL,
                        `ip` VARCHAR(25) NULL DEFAULT NULL,
                        `requestData` LONGTEXT NULL,
                        `responseData` LONGTEXT NULL,
                        `platform` VARCHAR(150) NULL DEFAULT NULL,
                        `action` VARCHAR(50) NULL DEFAULT NULL,
                        `userId` INT(11) NULL DEFAULT '0',
                        `web` TINYINT(4) NULL DEFAULT '0' COMMENT '0 - app, 1 - web, 2 - email',
                        `cookies` VARCHAR(500) NULL DEFAULT NULL,
                        PRIMARY KEY `id` (`id`),
                        INDEX `dateTime` (`requestDateTime`),
                        INDEX `web` (`web`),
                        INDEX `action` (`action`),
                        INDEX `ip` (`ip`),
                        INDEX `responseDateTime` (`responseDateTime`),
                        INDEX `userId` (`userId`)
                    )
                    COLLATE='utf8_general_ci'
                    ENGINE=InnoDB;");
                $GLOBALS['API_LOGS']['REQUEST_DATE_MONTH_AGO'] = strtotime($GLOBALS['API_LOGS']['REQUEST_DATE'] . ' -1 months');
                $GLOBALS['API_LOGS']['REQUEST_DATE_MONTH_AGO'] = date('Y-m-d', $GLOBALS['API_LOGS']['REQUEST_DATE_MONTH_AGO']);
                $GLOBALS['API_LOGS']['DB2']->querySql("DROP TABLE `api_logs_{$GLOBALS['API_LOGS']['REQUEST_DATE_MONTH_AGO']}`");
            }
        }
        if (!$GLOBALS['API_LOGS']['LOCAL_ENV'])
            try {
                $existCollection = $GLOBALS['API_LOGS']['MONGO_DB']->listCollections([
                    'filter' => [
                        'name' => "api_logs_{$GLOBALS['API_LOGS']['REQUEST_DATE']}",
                    ],
                ]);
                if (iterator_count($existCollection) == 0) {
                    $GLOBALS['API_LOGS']['MONGO_DB']->createCollection("api_logs_{$GLOBALS['API_LOGS']['REQUEST_DATE']}");
                    $dropDate = date('Y-m-d', Date::Today() - 100 * 86400);//100 - days to save logs
                    $GLOBALS['API_LOGS']['MONGO_DB']->dropCollection("api_logs_{$dropDate}");
                    $GLOBALS['API_LOGS']['MONGO_LOGS_TABLE'] = $GLOBALS['API_LOGS']['MONGO_DB']->selectCollection("api_logs_{$GLOBALS['API_LOGS']['REQUEST_DATE']}");
                    $GLOBALS['API_LOGS']['MONGO_LOGS_TABLE']->createIndexes([
                        ['key' => ['action' => 1]],
                        ['key' => ['userId' => 1]],
                        ['key' => ['requestDateTime' => 1]],
                        ['key' => ['platform' => 1]]
                    ]);
                }
            } catch (Exception $e) {
                l('MONGO createLogTable');
                l($e->getMessage());
            }
        
    }
    
    public static function UpdateLogUser($userId)
    {
        if ($GLOBALS['API_LOGS']['LOCAL_ENV'])
            $GLOBALS['API_LOGS']['DB2']->update("`api_logs_{$GLOBALS['API_LOGS']['REQUEST_DATE']}`", 'userId=?', 'id=?', [$userId, $GLOBALS['API_LOGS']['GLOB_LOG_ID']]);
        if (!$GLOBALS['API_LOGS']['LOCAL_ENV'])
            try {
                $GLOBALS['API_LOGS']['MONGO_LOGS_TABLE']->updateOne(
                    ['_id' => new \MongoDB\BSON\ObjectId($GLOBALS['API_LOGS']['GLOB_MONGO_LOG_ID'])],
                    ['$set' => ['userId' => $userId]]
                );
            } catch (Exception $e) {
                l('MONGO UpdateLogUser');
                l($e->getMessage());
                l([$userId, $GLOBALS['API_LOGS']['GLOB_LOG_ID']]);
            }
        
    }
    
    public static function customLog($action, $req, $web = 0, $global = false)
    {
        $GLOBALS['API_LOGS']['IP'] = getenv('HTTP_CLIENT_IP') ?:
            getenv('HTTP_X_FORWARDED_FOR') ?:
                getenv('HTTP_X_FORWARDED') ?:
                    getenv('HTTP_FORWARDED_FOR') ?:
                        getenv('HTTP_FORWARDED') ?:
                            getenv('REMOTE_ADDR');
        $insParams = array();
        $insParams['requestDateTime'] = time();
        $insParams['responseDateTime'] = time();
        $insParams['ip'] = $GLOBALS['API_LOGS']['IP'];
        $insParams['web'] = $web;
        $insParams['action'] = $action;
        $insParams['platform'] = isset($_SERVER['HTTP_USER_AGENT']) ? json_encode($_SERVER['HTTP_USER_AGENT']) : '';
        $insParams['requestData'] = $req;
        $insParams['responseData'] = '';
        $insParams['cookies'] = json_encode($_COOKIE);
        $insParams['userId'] = isset($id) && !empty($id) ? $id : 0;
        Logs::createLogTable();
        if ($GLOBALS['API_LOGS']['LOCAL_ENV']) {
            if ($global) {
                $GLOBALS['API_LOGS']['GLOB_LOG_ID'] = $GLOBALS['API_LOGS']['DB2']->insert("`api_logs_{$GLOBALS['API_LOGS']['REQUEST_DATE']}`", $insParams);
            } else {
                return $GLOBALS['API_LOGS']['DB2']->insert("`api_logs_{$GLOBALS['API_LOGS']['REQUEST_DATE']}`", $insParams);
            }
        }
        $insParams = (object)$insParams;
        if (!$GLOBALS['API_LOGS']['LOCAL_ENV'])
            try {
                $GLOBALS['API_LOGS']['GLOB_MONGO_LOG_ID_CUST'] = $GLOBALS['API_LOGS']['MONGO_LOGS_TABLE']->insertOne($insParams);
                $GLOBALS['API_LOGS']['GLOB_MONGO_LOG_ID_CUST'] = (array)$GLOBALS['API_LOGS']['GLOB_MONGO_LOG_ID_CUST']->getInsertedId();
                if ($global) {
                    $GLOBALS['API_LOGS']['GLOB_MONGO_LOG_ID_CUST'] = $GLOBALS['API_LOGS']['GLOB_MONGO_LOG_ID_CUST']['oid'];
                } else {
                    return $GLOBALS['API_LOGS']['GLOB_MONGO_LOG_ID_CUST']['oid'];
                }
            } catch (Exception $e) {
                l('MONGO AddLog');
                l($e->getMessage());
                l($insParams);
            }
    }
    
    public static function customLogResponse($resp, $logId = 0)
    {
        $logId = $logId ? $logId : ($GLOBALS['API_LOGS']['LOCAL_ENV'] ? $GLOBALS['API_LOGS']['GLOB_LOG_ID'] : $GLOBALS['API_LOGS']['GLOB_MONGO_LOG_ID_CUST']);
        $responseDateTime = time();
        $userId = isset($id) && !empty($id) ? $id : 0;
        if ($userId != 0) {
            if ($GLOBALS['API_LOGS']['LOCAL_ENV'])
                $GLOBALS['API_LOGS']['DB2']->update("`api_logs_{$GLOBALS['API_LOGS']['REQUEST_DATE']}`", 'responseDateTime=?, responseData=?, userId=?', 'id=?', [$responseDateTime, $resp, $userId, $logId]);
            if (!$GLOBALS['API_LOGS']['LOCAL_ENV'])
                try {
                    $GLOBALS['API_LOGS']['MONGO_LOGS_TABLE']->updateOne(
                        ['_id' => new \MongoDB\BSON\ObjectId($logId)],
                        ['$set' => ['responseDateTime' => $responseDateTime, 'responseData' => $resp, 'userId' => $userId]]
                    );
                } catch (Exception $e) {
                    l('MONGO customLogResponse');
                    l($e->getMessage());
                    l([$responseDateTime, $resp, $userId, $logId]);
                }
            
        } else {
            if ($GLOBALS['API_LOGS']['LOCAL_ENV'])
                $GLOBALS['API_LOGS']['DB2']->update("`api_logs_{$GLOBALS['API_LOGS']['REQUEST_DATE']}`", 'responseDateTime=?, responseData=?', 'id=?', [$responseDateTime, $resp, $logId]);
            if (!$GLOBALS['API_LOGS']['LOCAL_ENV'])
                try {
                    $GLOBALS['API_LOGS']['MONGO_LOGS_TABLE']->updateOne(
                        ['_id' => new \MongoDB\BSON\ObjectId($logId)],
                        ['$set' => ['responseDateTime' => $responseDateTime, 'responseData' => $resp]]
                    );
                } catch (Exception $e) {
                    l('MONGO customLogResponse2');
                    l($e->getMessage());
                    l([$responseDateTime, $resp, $logId]);
                }
            
        }
    }
    
    public static function xml2array($xmlObject, $out = [])
    {
        foreach ((array)$xmlObject as $index => $node) {
            $i = explode('\u0000', json_encode($index));
            $index = count($i) ? str_replace('"', '', end($i)) : $index;
            if (is_array($node)) {
                $out[$index][] = Logs::xml2array($node);
            } elseif (is_object($node)) {
                $out[$index] = Logs::xml2array((array)$node);
            } else {
                $out[$index] = $node;
            }
        }
        return $out;
    }
}
