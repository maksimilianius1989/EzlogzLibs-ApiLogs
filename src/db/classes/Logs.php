<?php

namespace Ezlogz\ApiLogs\db\classes;

class Logs {

    public static function AddLog($action, $req, $web = 0) {
        global $db2, $requestDate, $globLogId, $id, $mongoLogsTable, $globMongoLogId;
        $ip = getenv('HTTP_CLIENT_IP') ?:
            getenv('HTTP_X_FORWARDED_FOR') ?:
                getenv('HTTP_X_FORWARDED') ?:
                    getenv('HTTP_FORWARDED_FOR') ?:
                        getenv('HTTP_FORWARDED') ?:
                            getenv('REMOTE_ADDR');
        $insParams = array();
        $insParams['requestDateTime'] = time();
        $insParams['responseDateTime'] = time();
        $insParams['ip'] = $ip;
        $insParams['web'] = $web;
        $insParams['action'] = $action;
        $insParams['platform'] = isset($_SERVER['HTTP_USER_AGENT']) ? json_encode($_SERVER['HTTP_USER_AGENT']) : '';
        $insParams['requestData'] = $req;
        $insParams['responseData'] = '';
        $insParams['cookies'] = json_encode($_COOKIE);
        $insParams['userId'] = isset($id) && !empty($id) ? $id : 0;
        Logs::createLogTable();
        if(LOCAL_ENV)
            $globLogId = $db2->insert("`api_logs_{$requestDate}`", $insParams);
        $insParams = (object)$insParams;
        if(!LOCAL_ENV)
            try{
                $globMongoLogId = $mongoLogsTable->insertOne($insParams);
                $globMongoLogId = (array)$globMongoLogId->getInsertedId();
                $globMongoLogId = $globMongoLogId['oid'];
            }catch(Exception $e){l('MONGO AddLog');l($e->getMessage());l($insParams);}
    }

    public static function LogEmail($action, $req) {
        global $db2, $requestDate, $globLogId, $id, $globMongoLogId, $mongoLogsTable;
        $userData = $db2->row('id', '`users`', ['email' => $req['to']]);
        $ip = getenv('HTTP_CLIENT_IP') ?:
            getenv('HTTP_X_FORWARDED_FOR') ?:
                getenv('HTTP_X_FORWARDED') ?:
                    getenv('HTTP_FORWARDED_FOR') ?:
                        getenv('HTTP_FORWARDED') ?:
                            getenv('REMOTE_ADDR');
        $insParams = array();
        $insParams['requestDateTime'] = time();
        $insParams['ip'] = $ip;
        $insParams['web'] = 2;
        $insParams['action'] = $action;
        $insParams['platform'] = isset($_SERVER['HTTP_USER_AGENT']) ? json_encode($_SERVER['HTTP_USER_AGENT']) : '';
        $insParams['requestData'] = json_encode($req);
        $insParams['cookies'] = json_encode($_COOKIE);
        $insParams['userId'] = !empty($userData['id']) ? (int)$userData['id'] : 0;
        Logs::createLogTable();
        if(LOCAL_ENV)
            $db2->insert("`api_logs_{$requestDate}`", $insParams);
        if(!LOCAL_ENV)
            try{
                $mongoLogsTable->insertOne($insParams);
            }catch(Exception $e){l('MONGO LogEmail');l($e->getMessage());l($insParams);}
    }

    public static function LogPDF($action, $req, $id) {
        global $db2, $requestDate, $globLogId, $globMongoLogId, $mongoLogsTable;
        $ip = getenv('HTTP_CLIENT_IP') ?:
            getenv('HTTP_X_FORWARDED_FOR') ?:
                getenv('HTTP_X_FORWARDED') ?:
                    getenv('HTTP_FORWARDED_FOR') ?:
                        getenv('HTTP_FORWARDED') ?:
                            getenv('REMOTE_ADDR');
        $insParams = array();
        $insParams['requestDateTime'] = time();
        $insParams['ip'] = $ip;
        $insParams['web'] = 6;
        $insParams['action'] = $action;
        $insParams['platform'] = isset($_SERVER['HTTP_USER_AGENT']) ? json_encode($_SERVER['HTTP_USER_AGENT']) : '';
        $insParams['requestData'] = json_encode($req);
        $insParams['cookies'] = json_encode($_COOKIE);
        $insParams['userId'] = $id;
        Logs::createLogTable();
        if(LOCAL_ENV)
            $globLogId = $db2->insert("`api_logs_{$requestDate}`", $insParams);
        if(!LOCAL_ENV)
            try{
                $mongoLogsTable->insertOne($insParams);
            }catch(Exception $e){l('MONGO LogPDF');l($e->getMessage());l($insParams);}
    }

    public static function savePushLogs($action, $data, $userId, $type) {
        global $db2, $requestDate, $id, $globMongoLogId, $mongoLogsTable;
        $ip = getenv('HTTP_CLIENT_IP') ?:
            getenv('HTTP_X_FORWARDED_FOR') ?:
                getenv('HTTP_X_FORWARDED') ?:
                    getenv('HTTP_FORWARDED_FOR') ?:
                        getenv('HTTP_FORWARDED') ?:
                            getenv('REMOTE_ADDR');
        $insParams = array();
        $insParams['requestDateTime'] = time();
        $insParams['ip'] = $ip;
        $insParams['web'] = (int)('3'.$type);
        $insParams['action'] = $action;
        $insParams['platform'] = isset($_SERVER['HTTP_USER_AGENT']) ? json_encode($_SERVER['HTTP_USER_AGENT']) : '';
        $insParams['requestData'] = json_encode($data);
        $insParams['responseData'] = $id;
        $insParams['cookies'] = json_encode($_COOKIE);
        $insParams['userId'] = (int)$userId;
        Logs::createLogTable();
        if(LOCAL_ENV)
            $db2->insert("`api_logs_{$requestDate}`", $insParams);
        if(!LOCAL_ENV)
            try{
                $mongoLogsTable->insertOne($insParams);
            }catch(Exception $e){l('MONGO savePushLogs');l($e->getMessage());l($insParams);}


        saveLogsStatistics($action, 2);
    }

    private static function createLogTable() {
        global $db2, $requestDate, $mongoDb;
        if(LOCAL_ENV){
            $check = $db2->querySql("SHOW TABLES LIKE 'api_logs_{$requestDate}'");
            if (count($check) == 0) {
                $db2->querySql("CREATE TABLE `api_logs_{$requestDate}` (
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
                $requestDateMonthAgo = strtotime($requestDate .' -1 months');
                $requestDateMonthAgo = date('Y-m-d', $requestDateMonthAgo);
                $db2->querySql("DROP TABLE `api_logs_{$requestDateMonthAgo}`");
            }
        }
        if(!LOCAL_ENV)
            try{
                $existCollection = $mongoDb->listCollections([
                    'filter' => [
                        'name' => "api_logs_{$requestDate}",
                    ],
                ]);
                if(iterator_count($existCollection) == 0){
                    $mongoDb->createCollection("api_logs_{$requestDate}");
                    $dropDate = date('Y-m-d', Date::Today() - 100 * 86400);//100 - days to save logs
                    $mongoDb->dropCollection("api_logs_{$dropDate}");
                    $mongoLogsTable = $mongoDb->selectCollection("api_logs_{$requestDate}");
                    $mongoLogsTable->createIndexes([
                        [ 'key' => [ 'action' => 1 ]],
                        [ 'key' => [ 'userId' => 1 ]],
                        [ 'key' => [ 'requestDateTime' => 1 ]],
                        [ 'key' => [ 'platform' => 1 ]]
                    ]);
                }
            }catch(Exception $e){l('MONGO createLogTable');l($e->getMessage());}

    }

    public static function UpdateLogUser($userId) {
        global $db2, $requestDate, $globLogId, $globMongoLogId, $mongoLogsTable;
        if(LOCAL_ENV)
            $db2->update("`api_logs_{$requestDate}`", 'userId=?', 'id=?', [$userId, $globLogId]);
        if(!LOCAL_ENV)
            try{
                $mongoLogsTable->updateOne(
                    [ '_id' => new MongoDB\BSON\ObjectId($globMongoLogId)],
                    [ '$set' => [ 'userId' => $userId]]
                );
            }catch(Exception $e){l('MONGO UpdateLogUser');l($e->getMessage());l([$userId, $globLogId]);}

    }

    public static function AddLogResponse($resp) {
        global $db2, $requestDate, $globLogId, $id, $globMongoLogId, $mongoLogsTable;
        $responseDateTime = time();
        $userId = isset($id) && !empty($id) ? $id : 0;
        if ($userId != 0) {
            if(LOCAL_ENV)
                $db2->update("`api_logs_{$requestDate}`", 'responseDateTime=?, responseData=?, userId=?', 'id=?', [$responseDateTime, $resp, $userId, $globLogId]);
            if(!LOCAL_ENV)
                try{
                    $mongoLogsTable->updateOne(
                        [ '_id' => new MongoDB\BSON\ObjectId($globMongoLogId)],
                        [ '$set' => [ 'responseDateTime' => $responseDateTime, 'responseData'=> $resp, 'userId'=>$userId]]
                    );
                }catch(Exception $e){l('MONGO AddLogResponse');l($e->getMessage()); l([$responseDateTime, $resp, $userId, $globLogId]);}

        } else {
            if(LOCAL_ENV)
                $db2->update("`api_logs_{$requestDate}`", 'responseDateTime=?, responseData=?', 'id=?', [$responseDateTime, $resp, $globLogId]);
            if(!LOCAL_ENV)
                try{
                    $mongoLogsTable->updateOne(
                        [ '_id' => new MongoDB\BSON\ObjectId($globMongoLogId)],
                        [ '$set' => [ 'responseDateTime' => $responseDateTime, 'responseData'=> $resp]]
                    );
                }catch(Exception $e){l('MONGO AddLogResponse2');l($e->getMessage()); l([$responseDateTime, $resp, $globLogId]);}

        }
    }

    /**
     * Custom Manual Log
     * @param $action
     * @param $req
     * @param int $web :
     *  7 Finances
     *  8 Finances Recurring
     *  9 Finances Charge
     *  10 Charging Solo Driver
     * @param bool $global
     * @return mixed
     */
    public static function customLog($action, $req, $web = 0, $global = false) {
        global $db2, $requestDate, $globLogId, $id, $mongoLogsTable;
        $ip = getenv('HTTP_CLIENT_IP') ?:
            getenv('HTTP_X_FORWARDED_FOR') ?:
                getenv('HTTP_X_FORWARDED') ?:
                    getenv('HTTP_FORWARDED_FOR') ?:
                        getenv('HTTP_FORWARDED') ?:
                            getenv('REMOTE_ADDR');
        $insParams = array();
        $insParams['requestDateTime'] = time();
        $insParams['responseDateTime'] = time();
        $insParams['ip'] = $ip;
        $insParams['web'] = $web;
        $insParams['action'] = $action;
        $insParams['platform'] = isset($_SERVER['HTTP_USER_AGENT']) ? json_encode($_SERVER['HTTP_USER_AGENT']) : '';
        $insParams['requestData'] = $req;
        $insParams['responseData'] = '';
        $insParams['cookies'] = json_encode($_COOKIE);
        $insParams['userId'] = isset($id) && !empty($id) ? $id : 0;
        Logs::createLogTable();
        if($global) {
            global $globMongoLogIdCust;
        }
        if(LOCAL_ENV) {
            if($global) {
                $globLogId = $db2->insert("`api_logs_{$requestDate}`", $insParams);
            } else {
                return $db2->insert("`api_logs_{$requestDate}`", $insParams);
            }
        }
        $insParams = (object)$insParams;
        if(!LOCAL_ENV)
            try{
                $globMongoLogIdCust = $mongoLogsTable->insertOne($insParams);
                $globMongoLogIdCust = (array)$globMongoLogIdCust->getInsertedId();
                if($global) {
                    $globMongoLogIdCust = $globMongoLogIdCust['oid'];
                } else {
                    return $globMongoLogIdCust['oid'];
                }
            }catch(Exception $e){l('MONGO AddLog');l($e->getMessage());l($insParams);}
    }

    /**
     * Custom Manual Response
     * @param $resp
     * @param $logId
     */
    public static function customLogResponse($resp, $logId = 0) {
        global $db2, $requestDate, $globLogId, $id, $globMongoLogIdCust, $mongoLogsTable;
        $logId = $logId ? $logId : (LOCAL_ENV ? $globLogId : $globMongoLogIdCust);
        $responseDateTime = time();
        $userId = isset($id) && !empty($id) ? $id : 0;
        if ($userId != 0) {
            if(LOCAL_ENV)
                $db2->update("`api_logs_{$requestDate}`", 'responseDateTime=?, responseData=?, userId=?', 'id=?', [$responseDateTime, $resp, $userId, $logId]);
            if(!LOCAL_ENV)
                try{
                    $mongoLogsTable->updateOne(
                        [ '_id' => new MongoDB\BSON\ObjectId($logId)],
                        [ '$set' => [ 'responseDateTime' => $responseDateTime, 'responseData'=> $resp, 'userId'=>$userId]]
                    );
                }catch(Exception $e){l('MONGO customLogResponse');l($e->getMessage()); l([$responseDateTime, $resp, $userId, $logId]);}

        } else {
            if(LOCAL_ENV)
                $db2->update("`api_logs_{$requestDate}`", 'responseDateTime=?, responseData=?', 'id=?', [$responseDateTime, $resp, $logId]);
            if(!LOCAL_ENV)
                try{
                    $mongoLogsTable->updateOne(
                        [ '_id' => new MongoDB\BSON\ObjectId($logId)],
                        [ '$set' => [ 'responseDateTime' => $responseDateTime, 'responseData'=> $resp]]
                    );
                }catch(Exception $e){l('MONGO customLogResponse2');l($e->getMessage()); l([$responseDateTime, $resp, $logId]);}

        }
    }

    /**
     * xml object to array
     * @param $xmlObject
     * @param array $out
     * @return array
     */
    public static function xml2array($xmlObject, $out = []) {
        foreach((array)$xmlObject as $index => $node) {
            $i = explode('\u0000', json_encode($index));
            $index = count($i) ? str_replace('"', '', end($i)) : $index;
            if(is_array($node)) {
                $out[$index][] = Logs::xml2array($node);
            } elseif(is_object($node)) {
                $out[$index] = Logs::xml2array((array)$node);
            } else {
                $out[$index] = $node;
            }
        }
        return $out;
    }
}
