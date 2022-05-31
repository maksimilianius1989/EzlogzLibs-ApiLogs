<?php

namespace Ezlogz\ApiLogs\db\classes;

class databaseController {

    function __construct($response, $conn) {
        $this->response = $response;
        $this->conn = $conn;
    }

    function saveLog($log) {
        $log1 = str_replace('"', '', $log);
        $log2 = str_replace("'", '', $log1);
        $this->insert('logs', "null, '{$log2}',NOW()");
    }

    function insert($table, $values) {
        $sql = "INSERT INTO {$table} VALUES ({$values})";
//        $this->response->check .= $sql . '<br>\r\n';
        $run = $this->conn->query($sql);
        if (!$run) {
            $this->saveLog($this->response->check);
            $this->response->setError('204');
        }
        $lastId = $this->conn->insert_id;
        return $lastId;
    }

    function select($fields, $from, $where) {
        $sql = "SELECT {$fields} FROM {$from} WHERE {$where}";
//        $this->response->check .= $sql . '<br>\r\n';
        $run = mysqli_query($this->conn, $sql);
        $result = array();
        if ($run && mysqli_num_rows($run) != 0) {
            while ($rs = $run->fetch_assoc()) {
                $result[] = $rs;
            }
        }
        return $result;
    }

    function update($table, $set, $where) {
        $sql = "UPDATE {$table} SET {$set} WHERE {$where}";
//        $this->response->check .= $sql . '<br>\r\n';
        //echo $sql. '<br>';
        $run = $this->conn->query($sql);
        if (!$run) {
            $this->saveLog($this->response->check);
            $this->response->setError('204');
        }
        return;
    }

    function delete($table, $where, $what = null) {
        if (isset($where) && !empty($where)) {
            $sql = "DELETE {$what} FROM {$table} WHERE {$where}";
//            $this->response->check .= $sql . '<br>\r\n';
            $run = $this->conn->query($sql);
            if (!$run) {
                $this->saveLog($this->response->check);
                $this->response->setError('204');
            }
        }
        return;
    }

}
