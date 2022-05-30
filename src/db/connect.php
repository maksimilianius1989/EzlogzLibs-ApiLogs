<?php

namespace Ezlogz\ApiLogs\db\classes;

require_once '../config.php';

function myErrorHandler($errno, $errstr, $errfile, $errline)
{
    setServerTimeZoneToUTC();
    
    if ($errno == E_DEPRECATED) {
        return;
    }
    
    switch ($errno) {
        case E_NOTICE:
        case E_USER_NOTICE:
            $errors = "Notice";
            break;
        case E_WARNING:
        case E_USER_WARNING:
            $errors = "Warning";
            break;
        case E_ERROR:
        case E_USER_ERROR:
            $errors = "Fatal Error";
            break;
        default:
            $errors = "Unknown Error";
            break;
    }
    
    error_log(sprintf("PHP %s:  %s in %s on line %d", $errors, $errstr, $errfile, $errline));
}

require_once 'utils.php';
require_once 'classes/db2.php';
require_once 'version.php';
require_once 'classes/Response.php';
require_once 'classes/Validator.php';
require_once 'classes/Date.php';
require_once 'classes/Logs.php';

$requestDate = Date::Today(true, false);
if (!LOCAL_ENV)
    require_once $_SERVER['DOCUMENT_ROOT'] . '/db/classes/MongoDb.php';
$globLogId = 0;
$globMongoLogId = 0;

class Database
{
    private $_connection;
    private static $_instance; //The single instance
    private $_host = $DB_HOST;
    private $_username = $$DB_USER;
    private $_password = $DB_PASSWORD;
    private $_database = $DB_NAME;
    
    /*
    Get an instance of the Database
    @return Instance
    */
    public static function getInstance()
    {
        if (!self::$_instance) { // If no instance then make one
            self::$_instance = new self();
        }
        return self::$_instance;
    }
    
    // Constructor
    private function __construct()
    {
        $this->_connection = new mysqli(
            $this->_host,
            $this->_username,
            $this->_password,
            $this->_database
        );
        
        // Error handling
        if (mysqli_connect_error()) {
            trigger_error("Failed to conencto to MySQL: " . mysqli_connect_error(),
                E_USER_ERROR);
        }
        
        $this->_connection->set_charset("utf8mb4");
    }
    
    // Magic method clone is empty to prevent duplication of connection
    private function __clone()
    {
    }
    
    // Get mysqli connection
    public function getConnection()
    {
        return $this->_connection;
    }
}

class DatabaseRead
{
    private $_connection;
    private static $_instance; //The single instance
    private $_host = $DB_HOST;
    private $_username = $$DB_USER;
    private $_password = $DB_PASSWORD;
    private $_database = $DB_NAME;
    
    /*
    Get an instance of the Database
    @return Instance
    */
    public static function getInstance()
    {
        if (!self::$_instance) { // If no instance then make one
            self::$_instance = new self();
        }
        return self::$_instance;
    }
    
    // Constructor
    private function __construct()
    {
        $this->_connection = new mysqli(
            $this->_host,
            $this->_username,
            $this->_password,
            $this->_database
        );
        
        // Error handling
        if (mysqli_connect_error()) {
            trigger_error("Failed to conencto to MySQL: " . mysqli_connect_error(),
                E_USER_ERROR);
        }
    }
    
    // Magic method clone is empty to prevent duplication of connection
    private function __clone()
    {
    }
    
    // Get mysqli connection
    public function getConnection()
    {
        return $this->_connection;
    }
}


//$conn = connect(); 
$conn = Database::getInstance()->getConnection();
$conn_read = $conn;

//$conn_read = DatabaseRead::getInstance()->getConnection();
//$conn = nDB::getInstance();


$response = new Response();

$version = new Version();
//Uncomment to enter maintenance mode
//$response->setError('201', 'Server on maintenance update, approximately till 5am PST', true);
if (!$conn) {
    $response->setError('201');
}

$validator = new Validator($response, $conn);
$request = json_decode(file_get_contents('php://input'), true);

$data = isset($request['data']) ? $request['data'] : [];

function connect()
{
    $mysqli = new mysqli($DB_HOST, $DB_USER, $DB_PASSWORD, $DB_NAME);
    
    
    return $mysqli;
}

$db = new databaseController($response, $conn);

$db2 = new databaseControllerNew($response, $conn, $conn_read);

$configs = $db2->select('*', 'configs');
foreach ($configs as $config) {
    define($config['key'], $config['value']);
}
?>