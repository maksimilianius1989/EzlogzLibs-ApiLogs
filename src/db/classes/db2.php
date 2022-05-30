<?php

ini_set('memory_limit', '556M');

class databaseControllerNew
{
    public $read_replica = false;
    public $login_function = false;
    
    function __construct($response, $conn, $conn_read = null)
    {
        $this->response = $response;
        $this->conn = $conn;
        $this->conn_read = $conn_read;
        $this->cache_server = new Memcached();
        $this->cache_server->addServer(MEMCACHED_HOST, MEMCACHED_PORT);
    }
    
    function getParamType($param)
    {
        $type = '';
        if (is_int($param)) {
            $type .= 'i';
        } elseif (is_float($param)) {
            $type .= 'd';
        } elseif (is_string($param)) {
            $type .= 's';
        } else {
            $type .= 'b';
        }
        return $type;
    }
    
    function sqlQuery($sql)
    {
        $result = $this->conn->query($sql);
    }
    
    function close()
    {
        $thread = $this->conn->thread_id;
        $this->conn->kill($thread);
        $this->conn->close();
        
    }
    
    function getColsToUpdate($tableName, $data, $ignoreFields = [])
    {
        $colsToUpdate = array_column($this->querySql('SHOW COLUMNS FROM ' . $tableName), 'Field'); //get table cols
        $colsToUpdate = array_diff($colsToUpdate, $ignoreFields); //remove not updateble keys
        $colsToUpdate = array_flip($colsToUpdate); //values to keys
        $colsToUpdate = array_intersect_key($colsToUpdate, $data); //use only keys that need to be updated
        $updateSql = '';
        $params = [];
        $insertParams = [];
        foreach ($colsToUpdate as $key => $val) {
            $updateSql .= empty($updateSql) ? '`' . trim($key) . '`' . '=?' : ',`' . trim($key) . '`=?';
            $params[] = $data[$key];
            $insertParams[$key] = $data[$key];
        }
        $isValid = true;
        if (empty($updateSql) || empty($colsToUpdate) || empty($params)) {
            $isValid = false;
        }
        return ['updateSql' => $updateSql, 'insertParams' => $insertParams, 'params' => $params, 'colsToUpdate' => $colsToUpdate, 'isValid' => $isValid];
    }
    
    /*
     *
     * $userId = 637;
      $date = '2018-03-06 00:00:00';
      $statuses = $dash->db2->querySql('(select * from status where userId = ? and dateTime < ? order by dateTime desc LIMIT 1)
      UNION
      (select * from status where userId = ? and dateTime >= ?)', [$userId, $date,$userId, $date]);
      c($statuses);
     */
    
    function querySqlLog($sql, $params = false)
    {
        $keys = [];
        $paramsDebug = [];
        foreach ($params as $key => $value) {
            $keys[] = '/\?/';
            $paramsDebug[] = '"' . $value . '"';
        }
        $count = count($params);
        $query = preg_replace($keys, $paramsDebug, $sql, 1, $count);
        $sql = trim(preg_replace('/\s+/', ' ', $sql));
        //l($query);
        return $this->querySql($sql, $params);
    }
    
    function querySql($sql, $params = false)
    {
        $query = $this->conn->prepare($sql);
        if (false === $query) {
            error_log($sql);
            error_log(json_encode($params));
            error_log(mysqli_error($this->conn));
        }
        if (!empty($params)) {
            $types = '';
            foreach ($params as $field => $param) {
                $types .= $this->getParamType($param);
                $params[$field] = &$params[$field];
            }
            $ref = new ReflectionClass('mysqli_stmt');
            $method = $ref->getMethod("bind_param");
            array_unshift($params, $types);
            $method->invokeArgs($query, $params);
        }
        if (false === $query) {
            error_log($sql);
            error_log(json_encode($params));
            error_log(mysqli_error($this->conn));
        }
        //   var_dump($query);
        $query->execute();
        
        $meta = $query->result_metadata();
        if (is_bool($meta)) {
            $query->close();
            return $meta;
        }
        $params = [];
        while ($field = $meta->fetch_field()) {
            $params[] = &$row[$field->name];
        }
        call_user_func_array(array($query, 'bind_result'), $params);
        $result = array();
        while ($query->fetch()) {
            $c = array();
            foreach ($row as $key => $val) {
                $c[$key] = $val;
            }
            $result[] = $c;
        }
        if ($result == null) {
            $result = [];
        }
        $query->close();
        return $result;
    }
    
    function insertLog($table, $params = [], $pre_fields = false, $pre_marks = false)
    {
        $fields = [];
        $paramsDecoded = [];
        foreach ($params as $field => $param) {
            $fields[] = $field;
            $paramsDecoded[] = '"' . $param . '"';
        }
        $fields = implode(',', $fields);
        $paramsDecoded = implode(',', $paramsDecoded);
        if ($pre_fields) {
            $fields = $pre_fields;
        }
        foreach ($fields as $key => $field) {
            $fields[$key] = strpos($field, '`') !== false ? $field : '`' . trim($field) . '`';
        }
        $table = strpos($table, '`') !== false ? $table : '`' . trim($table) . '`';
        $sql = "INSERT INTO {$table} ({$fields}) VALUES ({$paramsDecoded})";
        $sql = trim(preg_replace('/\s+/', ' ', $sql));
        l($sql);
        return $this->insert($table, $params, $pre_fields, $pre_marks);
    }
    
    function insert($table, $params, $pre_fields = false, $pre_marks = false)
    {
        $types = '';
        $fields = [];
        $questMarks = [];
        $oldparams = $params;
        foreach ($params as $field => $param) {
            $types .= $this->getParamType($param);
            $fields[] = $field;
            $questMarks[] = '?';
            if (is_string($param)) {
                unset($p);
                $p = strip_tags($params[$field]);
                $params[$field] = &$p;
            } else {
                $params[$field] = &$params[$field];
            }
        }
        if (count($questMarks) != count($params)) {
            l('insert $questMarks ' . count($questMarks) . ' $params ' . count($params));
            global $request;
            error_log($request['action']);
            error_log($request['data']['action']);
        }
        array_unshift($params, $types);
        foreach ($fields as $key => $field) {
            $fields[$key] = strpos($field, '`') !== false ? $field : '`' . trim($field) . '`';
        }
        $fields = implode(',', $fields);
        $questMarks = implode(',', $questMarks);
        if ($pre_fields) {
            $fields = $pre_fields;
        }
        if ($pre_marks) {
            $questMarks = $pre_marks;
        }
        $table = strpos($table, '`') !== false ? $table : '`' . trim($table) . '`';
        $sql = "INSERT INTO {$table} ({$fields}) VALUES ({$questMarks})";
//error_log($sql);
//error_log(json_encode($params));
        $query = $this->conn->prepare($sql);
        if (false === $query) {
            error_log($sql);
            error_log(json_encode($params));
            error_log(mysqli_error($this->conn));
            global $request;
            error_log($request['action']);
            error_log($request['data']['action']);
        }
        $ref = new ReflectionClass('mysqli_stmt');
        $method = $ref->getMethod("bind_param");
        $method->invokeArgs($query, $params);
        
        $res = $query->execute();
        if (!$res) {
            error_log($sql);
            error_log(json_encode($params));
            error_log(mysqli_error($this->conn));
            global $request;
            error_log($request['action']);
            error_log($request['data']['action']);
        }
        // ini_set('display_errors', 1);
        // ini_set('display_startup_errors', 1);
        //  error_reporting(E_ALL);
        $meta = $query->result_metadata();
        $lastId = $this->conn->insert_id;
        
        return $lastId;
    }
    
    function selectModel($fields, $from, $where = false, $params = [])
    {
        $needTotals = strpos(strtoupper($where), ' LIMIT ') !== false;
        $fields = $needTotals ? (strpos(strtoupper($fields), 'SQL_CALC_FOUND_ROWS') !== false ? $fields : 'SQL_CALC_FOUND_ROWS ' . $fields) : $fields;
        $rows = $this->select($fields, $from, $where, $params);
        $total = $needTotals ? $this->found_rows() : 0;
        return ['result' => $rows, 'total' => $total];
    }
    
    function selectModelLog($fields, $from, $where = false, $params = [])
    {
        $needTotals = strpos(strtoupper($where), ' LIMIT ') !== false;
        $fields = $needTotals ? (strpos(strtoupper($fields), 'SQL_CALC_FOUND_ROWS') !== false ? $fields : 'SQL_CALC_FOUND_ROWS ' . $fields) : $fields;
        $rows = $this->selectLog($fields, $from, $where, $params);
        $total = $needTotals ? $this->found_rows() : 0;
        return ['result' => $rows, 'total' => $total];
    }
    
    function selectLog($fields, $from, $where = false, $params = [])
    {
        $sql = "SELECT {$fields} FROM {$from} WHERE {$where}";
        $keys = [];
        $paramsDebug = [];
        foreach ($params as $key => $value) {
            $keys[] = '/\?/';
            $paramsDebug[] = '"' . $value . '"';
        }
        $sql = trim(preg_replace('/\s+/', ' ', $sql));
        $count = count($params);
        $query = preg_replace($keys, $paramsDebug, $sql, 1, $count);
        l($query);
        return $this->select($fields, $from, $where, $params);
    }
    
    function selectOne($fields, $from, $where = false, $params = false)
    {
        $items = $this->select($fields, $from, $where, $params);
        
        if (empty($items) || !is_array($items)) {
            return false;
        }
        
        return reset($items);
    }
    
    function select($fields, $from, $where = false, $params = false)
    {
        if (strpos($from, ' ') === false) {
            $from = '`' . preg_replace('/`?\.`?/', '`.`', trim($from, '`')) . '`';
        }
        
        //  $con_rand = rand(0,1);
        /*
         * Connect to API to find which replica to read from
         */
//if($this->conn_read==false)
        //  $this->conn_read = DatabaseRead::getInstance()->getConnection();
        
        
        if (false) {
            $conn = $this->conn_read;
            $this->read_replica = true;
        } else {
            $conn = $this->conn;
            $this->read_replica = false;
        }
        
        
        if (is_array($where)) {
            $this->where($where);
            $where = $this->where;
            $params = $this->params;
        }
        $where = empty($where) ? '1' : $where;
        $sql = "SELECT {$fields} FROM {$from} WHERE {$where}";
        $query = $conn->prepare($sql);
        if (false === $query) {
            error_log($sql);
            error_log(json_encode($params));
            error_log(mysqli_error($conn));
        }
        if (!empty($params)) {
            $types = '';
            foreach ($params as $field => $param) {
                $types .= $this->getParamType($param);
                $params[$field] = &$params[$field];
            }
            $ref = new ReflectionClass('mysqli_stmt');
            $method = $ref->getMethod("bind_param");
            array_unshift($params, $types);
            $method->invokeArgs($query, $params);
        }
        if (false === $query) {
            
            error_log($sql);
            error_log(json_encode($params));
            error_log(mysqli_error($conn));
        }
        
        $sqlQuery = $sql;
        if (!empty($params)) {
            $paramsk = $params;
        } else {
            $paramsk = array();
        }
        
        
        //l($result);
        if (false) {
            return $result;
        } else {
            $query->execute();
            
            $meta = $query->result_metadata();
            $params = [];
            while ($field = $meta->fetch_field()) {
                $params[] = &$row[$field->name];
            }
            call_user_func_array(array($query, 'bind_result'), $params);
            $result = array();
            while ($query->fetch()) {
                $c = array();
                foreach ($row as $key => $val) {
                    $c[$key] = $val;
                }
                $result[] = $c;
            }
            if ($result == null) {
                $result = [];
            }
            $query->close();
            
            
            return $result;
        }
    }
    
    /**
     * Return One Row Without Limit
     * @param $fields
     * @param $from
     * @param bool $where
     * @param bool $params
     * @return array|mixed
     */
    function rowLog($fields, $from, $where = false, $params = false)
    {
        $result = $this->selectLog($fields, $from, $where, $params);
        return isset($result[0]) && !empty($result[0]) ? $result[0] : [];
    }
    
    function row($fields, $from, $where = false, $params = false)
    {
        $result = $this->select($fields, $from, $where, $params);
        return isset($result[0]) && !empty($result[0]) ? $result[0] : [];
    }
    
    function where($whereData = [])
    {
        $where = '1';
        $params = [];
        
        foreach ($whereData as $key => $value) {
            $where .= " AND `$key`=?";
            array_push($params, $value);
        }
        
        $this->where = $where;
        $this->params = $params;
        return $this;
    }
    
    function update2($table, array $set, array $where)
    {
        $setStr = '';
        $whereStr = '';
        $params = [];
        foreach ($set as $k => $v) {
            $setStr .= "`" . $k . "` = ?,";
            $params[] = $v;
        }
        $setStr = rtrim($setStr, ',');
        foreach ($where as $k => $v) {
            $whereStr .= "`" . $k . "` = ?,";
            $params[] = $v;
        }
        $whereStr = rtrim($whereStr, ',');
        $this->update($table, $setStr, $whereStr, $params);
    }
    
    function updateLog($table, $set, $where, $params)
    {
        $table = strpos($table, '`') !== false ? $table : '`' . trim($table) . '`';
        $set = explode(',', $set);
        foreach ($set as $key => $param) {
            $paramWithVal = strpos($param, '=') !== false;
            if ($paramWithVal) {
                $paramWithVal = explode('=', $param);
                $paramWithVal[0] = strpos($paramWithVal[0], '`') !== false ? $paramWithVal[0] : '`' . trim($paramWithVal[0]) . '`';
                $set[$key] = implode('=', $paramWithVal);
            } else
                $set[$key] = strpos($param, '`') !== false ? $param : '`' . trim($param) . '`';
        }
        $set = implode(',', $set);
        $sql = "UPDATE {$table} SET {$set} WHERE {$where}";
        $keys = [];
        $paramsDebug = [];
        foreach ($params as $key => $value) {
            $keys[] = '/\?/';
            $paramsDebug[] = '"' . $value . '"';
        }
        $count = count($params);
        $query = preg_replace($keys, $paramsDebug, $sql, 1, $count);
        $sql = trim(preg_replace('/\s+/', ' ', $sql));
        l($query);
        return $this->update($table, $set, $where, $params);
    }
    
    function update($table, $set, $where, $params)
    {
        if (!empty($where)) {
            $table = strpos($table, '`') !== false ? $table : '`' . trim($table) . '`';
            if (strpos($table, '`') === false) {
                $set = explode(',', $set);
                foreach ($set as $key => $param) {
                    $paramWithVal = strpos($param, '=') !== false;
                    if ($paramWithVal) {
                        $paramWithVal = explode('=', $param);
                        $paramWithVal[0] = strpos($paramWithVal[0], '`') !== false ? $paramWithVal[0] : '`' . trim($paramWithVal[0]) . '`';
                        $set[$key] = implode('=', $paramWithVal);
                    } else {
                        $set[$key] = strpos($param, '`') !== false ? $param : '`' . trim($param) . '`';
                    }
                }
                $set = implode(',', $set);
            }
            $sql = "UPDATE {$table} SET {$set} WHERE {$where}";
            $query = $this->conn->prepare($sql);
            if (false === $query) {
                error_log($sql);
                error_log(json_encode($params));
                error_log(mysqli_error($this->conn));
            }
            if (!empty($params)) {
                $types = '';
                foreach ($params as $field => $param) {
                    $types .= $this->getParamType($param);
                    if (is_string($param)) {
                        unset($p);
                        $p = strip_tags($param);
                        $params[$field] = &$p;
                    } else {
                        $params[$field] = &$params[$field];
                    }
                }
                $ref = new ReflectionClass('mysqli_stmt');
                $method = $ref->getMethod("bind_param");
                array_unshift($params, $types);
                $method->invokeArgs($query, $params);
            }
            if (false === $query) {
                error_log($sql);
                error_log(json_encode($params));
                error_log(mysqli_error($this->conn));
            }
            $res = $query->execute();
            if (!$res) {
                error_log($sql);
                error_log(json_encode($params));
                error_log(mysqli_error($this->conn));
            }
        }
        return;
    }
    
    function deleteLog($table, $where, $params = [], $what = null)
    {
        $sql = "DELETE {$what} FROM {$table} WHERE {$where}";
        $keys = [];
        $paramsDebug = [];
        foreach ($params as $key => $value) {
            $keys[] = '/\?/';
            $paramsDebug[] = '"' . $value . '"';
        }
        $count = count($params);
        $query = preg_replace($keys, $paramsDebug, $sql, 1, $count);
        $sql = trim(preg_replace('/\s+/', ' ', $sql));
        l($query);
        return $this->delete($table, $where, $params, $what);
    }
    
    function delete($table, $where, $params = [], $what = null)
    {
        if (isset($where) && !empty($where)) {
            $sql = "DELETE {$what} FROM {$table} WHERE {$where}";
            $query = $this->conn->prepare($sql);
            if (false === $query) {
                error_log($sql);
                error_log(json_encode($params));
                error_log(mysqli_error($this->conn));
            }
            if (!empty($params)) {
                $types = '';
                foreach ($params as $field => $param) {
                    $types .= $this->getParamType($param);
                    $params[$field] = &$params[$field];
                }
                $ref = new ReflectionClass('mysqli_stmt');
                $method = $ref->getMethod("bind_param");
                array_unshift($params, $types);
                $method->invokeArgs($query, $params);
            }
            if (false === $query) {
                error_log($sql);
                error_log(json_encode($params));
                error_log(mysqli_error($this->conn));
            }
            $query->execute();
        }
        return;
    }
    
    function found_rows()
    {
        $sql = "SELECT FOUND_ROWS() AS quantity";
        
        if ($this->read_replica) {
            $query = $this->conn_read->prepare($sql);
            $this->read_replica = false;
        } else {
            $query = $this->conn->prepare($sql);
        }
        
        if (false === $query) {
            error_log($sql);
            error_log(mysqli_error($this->conn));
        }
        $query->execute();
        
        $meta = $query->result_metadata();
        $params = [];
        while ($field = $meta->fetch_field()) {
            $params[] = &$row[$field->name];
        }
        call_user_func_array(array($query, 'bind_result'), $params);
        $result = array();
        while ($query->fetch()) {
            $c = array();
            foreach ($row as $key => $val) {
                $c[$key] = $val;
            }
            $result[] = $c;
        }
        $query->close();
        if (isset($result[0]['quantity']) && $result[0]['quantity'] > 0) {
            return $result[0]['quantity'];
        }
        return 0;
    }
    
    public function isTableExist($tableName): bool
    {
        $result = $this->select(
            '*',
            'information_schema.tables',
            'table_name = ? limit 1',
            [
                str_replace('`', '', $tableName),
            ]
        );
        
        if (empty($result)) {
            return false;
        }
        
        return true;
    }
}
