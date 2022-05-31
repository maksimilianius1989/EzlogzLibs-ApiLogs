<?php

namespace Ezlogz\ApiLogs\db;

use DateTime;
use Ezlogz\ApiLogs\db\classes\Date;
use function Ezlogz\ApiLogs\db\classes\done;

require_once __DIR__ . '/connect.php';

class apiController
{
    function __construct()
    {
        $this->db2 = $GLOBALS['API_LOGS']['DB2'];
        $this->db = $GLOBALS['API_LOGS']['DB'];
        $this->mongoDb = $GLOBALS['API_LOGS']['MONGO_DB'];
        $this->mongoLogsTable = $GLOBALS['API_LOGS']['MONGO_LOGS_TABLE'];
        
        $this->today = Date::Today();
        $this->id = $GLOBALS['API_LOGS']['USER_ID'];
        $this->response = $GLOBALS['API_LOGS']['RESPONSE'];
        $this->validator = $GLOBALS['API_LOGS']['VALIDATOR'];
        $this->data = [];
    }
    
    function getApis() {
        return $this->db->select('*', 'api_docs', 1);
    }
    
    function getApisChat() {
        return $this->db->select('*', 'api_docs_chat', 1);
    }
    
    function getErrors() {
        return $this->db->select('*', 'api_errors', 1);
    }
    
    function newApi($name, $description, $example, $chat = false, $response = false) {
        if ($chat) {
            $this->db->insert('api_docs_chat', "null,'{$name}','{$description}', '{$example}', '{$response}'");
        } else {
            $this->db->insert('api_docs', "null,'{$name}','{$description}', '{$example}'");
        }
    }
    
    function editApi($apiId, $name, $description, $example, $chat = false, $response = false) {
        if ($chat) {
            $this->db->update('api_docs_chat', "name='{$name}', description='{$description}', response='{$response}', example='{$example}'", "id={$apiId}");
        } else {
            $this->db->update('api_docs', "name='{$name}', description='{$description}', example='{$example}'", "id={$apiId}");
        }
    }
    
    function deleteApi($apiId, $chat = false)
    {
        if ($chat) {
            $this->db->delete('api_docs_chat', "id={$apiId}");
        } else {
            $this->db->delete('api_docs', "id={$apiId}");
        }
    }
    
    function getApiLogs() {
        
        date_default_timezone_set('UTC');
        $startFrom = $this->data['startFrom'];
        $ip = $this->data['ip'];
        $date = $this->data['date'];
        $timeFrom = $this->data['dateFrom'];
        $timeTill = $this->data['dateTill'];
        $action = $this->data['action'];
        $userId = $this->data['userId'];
        
        $where = '';
        if (!empty($ip)) {
            $where .= "ip = '{$ip}'";
        }
        if (!empty($userId) && $userId != 0) {
            $where .= "userId = '{$userId}'";
        }
        if (!empty($date)) {
            if (!empty($where)) {
                $where .= " and ";
            }
            $timestamp = DATE::GetTimeinMsFromDateTime($date);
            $beginOfDay = strtotime("midnight", $timestamp);
            $endOfDay = strtotime("tomorrow", $beginOfDay) - 1;
            if (isset($this->data['dateFrom']) && !empty($timeFrom)) {
                
                $startDate = $date . ' ' . $timeFrom;
                
                $beginOfDay = DATE::GetTimeinMsFromDateTime($startDate);
            }
            if (isset($this->data['dateTill']) && !empty($timeTill)) {
                $startDate = $date . ' ' . $timeTill;
                $endOfDay = DATE::GetTimeinMsFromDateTime($startDate);
            }
            $where .= "dateTime >= '{$beginOfDay}' && dateTime <= '{$endOfDay}'";
        }
        
        if (empty($where)) {
            $where = '1';
        }
        
        $ret = [];
        
        if (!empty($action)) {
            $ret['logs'] = $this->db->select('*', "api_logs", "{$where} and type = 0 and action='{$action}' order by dateTime desc LIMIT {$startFrom}, 100  ");
            $ret['totally'] = $this->db->select('count(*) as totally', "api_logs", "{$where} and type=0 and action='{$action}'")[0]['totally'];
            $ids = [];
            foreach ($ret['logs'] as $log) {
                $ids[] = $log['id'];
            }
            $ids = implode(',', $ids);
            $logs2 = $this->db->select('*', "api_logs", "id in ({$ids}) and type = 1");
            $allLogs = array_merge($ret['logs'], $logs2);
            $ret['logs'] = $allLogs;
        } else {
            $ret['logs'] = $this->db->select('*', "api_logs", "{$where} order by dateTime desc LIMIT {$startFrom}, 100  ");
            
            
            $ret['totally'] = $this->db->select('count(*) as totally', "api_logs", "{$where} and type=0")[0]['totally'];
        }
        
        $ret['from'] = $startFrom;
        
        return $ret;
    }
    
    function deleteEldLogs()
    {
        $id = $this->data['id'];
        $this->db2->delete('eld_logs', 'id=?', [$id]);
        return [];
    }
    
    function getEldLogs()
    {
        $userId = $this->data['userId'];
        $logs = $this->db2->select('*', 'eld_logs', 'userId=? order by id desc', [$userId]);
        return $logs;
    }
    
    function getUsersByName()
    {
        $name = $this->data['name'];
        $name = trim($name);
        $like = "%{$name}%";
        $users = $this->db2->select('u.*, s.sessionId', 'users u left join sessions s on s.userId = u.id and site=0',
            'u.name like ? or u.last like ? or u.email like ? or concat(\'(\', u.email, \') \', u.name, \' \', u.last) like ? limit 20',
            [$like, $like, $like, $like]);
        $user = $this->db2->select('u.*, s.sessionId', 'users u left join sessions s on s.userId = u.id and site=0',
            'u.id = ? or u.name = ? or u.last = ? or u.email = ? or concat(\'(\', u.email, \') \', u.name, \' \', u.last) = ? limit 20', [$name, $name, $name, $name, $name]);
        $users = array_unique(array_merge($user, $users), SORT_REGULAR);
        return $users;
    }
    
    function getLogsStatisticsByDate()
    {
        $date = $this->data['date'];
        $beginOfDay = strtotime($date);

//            return $beginOfDay;
        return $this->db2->select('*', "logs_statistics", "date = ? order by amount desc", [$beginOfDay]);
    }
    
    function getPushLogs()
    {
        date_default_timezone_set('UTC');
        $startFrom = $this->data['startFrom'];
        $date = $this->data['date'];
        $timeFrom = $this->data['dateFrom'];
        $timeTill = $this->data['dateTill'];
        $action = $this->data['action'];
        $userId = $this->data['userId'];
        $ret = [];
        
        $where = '';
        if (!empty($action)) {
            if (!empty($where)) {
                $where .= " and ";
            }
            $where .= "action LIKE '%{$action}%'";
        }
        if (!empty($userId)) {
            if (!empty($where)) {
                $where .= " and ";
            }
            $where .= "(toId = '{$userId}' OR fromId = '{$userId}')";
        }
        if (!empty($date)) {
            if (!empty($where)) {
                $where .= " and ";
            }
            $timestamp = DATE::GetTimeinMsFromDateTime($date);
            $beginOfDay = strtotime("midnight", $timestamp);
            $endOfDay = strtotime("tomorrow", $beginOfDay) - 1;
            if (isset($this->data['dateFrom']) && !empty($timeFrom)) {
                
                $startDate = $date . ' ' . $timeFrom;
                
                $beginOfDay = DATE::GetTimeinMsFromDateTime($startDate);
            }
            if (isset($this->data['dateTill']) && !empty($timeTill)) {
                $startDate = $date . ' ' . $timeTill;
                $endOfDay = DATE::GetTimeinMsFromDateTime($startDate);
            }
            $where .= "dateTime >= '{$beginOfDay}' && dateTime <= '{$endOfDay}'";
        }
        
        if (empty($where)) {
            $where = '1';
        }
        
        $ret['logs'] = $this->db2->select('*', "api_push_logs", "{$where} order by dateTime desc LIMIT {$startFrom}, 100  ");
        $ret['totally'] = $this->db2->select('count(*) as totally', "api_push_logs", "{$where}")[0]['totally'];
        $ret['from'] = $startFrom;
        
        return $ret;
    }
    
    function getApiLogsNew()
    {
        date_default_timezone_set('UTC');
        $startFrom = $this->data['startFrom'];
        $GLOBALS['API_LOGS']['IP'] = $this->data['ip'];
        $date = empty($this->data['date']) ? Date::Today(true, false) : $this->data['date'];
        $timeFrom = $this->data['dateFrom'];
        $timeTill = $this->data['dateTill'];
        $action_req = $this->data['action_req'];
        $userId = $this->data['userId'];
        $platform = (int)$this->data['platform'];
        $amount = (int)$this->data['amount'];
        
        $where = '';
        $mongoWhere = [];
        if (!empty($GLOBALS['API_LOGS']['IP'])) {
            $where .= "ip = '{$GLOBALS['API_LOGS']['IP']}'";
            $mongoWhere['ip'] = $GLOBALS['API_LOGS']['IP'];
        }
        if ($userId != '') {
            $where .= "userId = '{$userId}'";
            $mongoWhere['userId'] = (int)$userId;
        }
        $ret = ['logs' => [], 'totally' => 0, 'error' => false];
        if (!empty($date)) {
            if (!empty($where)) {
                $where .= " and ";
            }
            $timestamp = DATE::GetTimeinMsFromDateTime($date);
            $beginOfDay = strtotime("midnight", $timestamp);
            $endOfDay = strtotime("tomorrow", $beginOfDay) - 1;
            if (isset($this->data['dateFrom']) && !empty($timeFrom)) {
                $startDate = $date . ' ' . $timeFrom;
                $beginOfDay = DATE::GetTimeinMsFromDateTime($startDate);
            }
            if (isset($this->data['dateTill']) && !empty($timeTill)) {
                $startDate = $date . ' ' . $timeTill;
                $endOfDay = DATE::GetTimeinMsFromDateTime($startDate);
            }
            $where .= "requestDateTime >= '{$beginOfDay}' && requestDateTime <= '{$endOfDay}'";
        } else {
            $ret['error'] = 1;
            return $ret;
        }
        if ($platform > -1) {
            if (!empty($where)) {
                $where .= " and ";
            }
            $where .= " web = '{$platform}'";
            $mongoWhere['web'] = $platform;
        }
        if (empty($where)) {
            $where = '1';
        }
        $ret['where'] = $where;
        if (!empty($action_req)) {
            if ($GLOBALS['API_LOGS']['LOCAL_ENV']) {
                $ret['logs'] = $this->db2->select('SQL_CALC_FOUND_ROWS *', "`api_logs_{$date}`", "{$where} and action='{$action_req}' order by requestDateTime desc LIMIT {$startFrom}, {$amount}");
            } else {
                $action_req = array_filter(explode(',', $action_req));
                foreach ($action_req as $key => $act) {
                    $action_req[$key] = trim($act);
                }
                $mongoWhere['action'] = ['$in' => $action_req];
            }
        } else {
            if($GLOBALS['API_LOGS']['LOCAL_ENV']) {
                $ret['logs'] = $this->db->select('SQL_CALC_FOUND_ROWS *', "`api_logs_{$date}`", "{$where} order by requestDateTime desc LIMIT {$startFrom}, {$amount}  ");
            }
        }
        $ret['totally'] = $this->db2->found_rows();
        $ret['from'] = $startFrom;
        if (!$GLOBALS['API_LOGS']['LOCAL_ENV']) {
            $mongoResult = [];
            $mongoWhere['requestDateTime'] = ['$gte' => $beginOfDay, '$lte' => $endOfDay];
            
            $ret['$mongoWhere'] = $mongoWhere;
            $GLOBALS['API_LOGS']['MONGO_LOGS_TABLE'] = $this->mongoDb->selectCollection("api_logs_{$date}");
            
            $ret['totally'] = $GLOBALS['API_LOGS']['MONGO_LOGS_TABLE']->count($mongoWhere);
            
            $ret['mongoResult'] = $GLOBALS['API_LOGS']['MONGO_LOGS_TABLE']->find($mongoWhere, [
                'limit' => $amount,
                'skip' => $startFrom,
                'sort' => ['_id' => -1]
            ]);
            $ret['logs'] = $ret['mongoResult']->toArray();
            foreach ($ret['logs'] as $key => $log) {
                $id = json_decode(json_encode($log->_id), true);
                $ret['logs'][$key]['id'] = $id['$oid'];
            }
        }
        $ret['table'] = "{$where} order by requestDateTime desc LIMIT {$startFrom}, {$amount}";
        return $ret;
    }
    
}

$action = isset($data['action']) ? $data['action'] : '';
if (!empty($action)) {
    if (method_exists(apiController::class, $action)) {
        $apiC = new apiController();
        $apiC->data = $data;
        
        if (isset($data['date'])) {
            $date = DateTime::createFromFormat('Y-m-d', $data['date']);
            $date2 = DateTime::createFromFormat('Y-m-d', '2023-02-05');
            if ($date < $date2) {
                $apiC->mongoDb = $GLOBALS['API_LOGS']['MONGO_DB2'];
                $apiC->mongoLogsTable = $GLOBALS['API_LOGS']['MONGO_LOGS_TABLE2'];
            }
        }
        
        $GLOBALS['API_LOGS']['RESPONSE']->data = call_user_func_array(array($apiC, $action), array());
        done($GLOBALS['API_LOGS']['RESPONSE']);
    }
}
