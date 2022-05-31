<?php

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/utils.php';
require_once __DIR__ . '/classes/db2.php';
require_once __DIR__ . '/version.php';
require_once __DIR__ . '/classes/Response.php';

use Ezlogz\ApiLogs\db\classes\Date;
use Ezlogz\ApiLogs\db\classes\Validator;

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

$GLOBALS['API_LOGS']['REQUEST_DATE'] = Date::Today(true, false);
if (!$GLOBALS['API_LOGS']['LOCAL_ENV'])
    require_once  __DIR__ . '/classes/MongoDb.php';
$GLOBALS['API_LOGS']['GLOB_LOG_ID'] = 0;
$GLOBALS['API_LOGS']['GLOB_MONGO_LOG_ID'] = 0;

class Database
{
    private $_connection;
    private static $_instance; //The single instance
    private $_host;
    private $_username;
    private $_password;
    private $_database;
    
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
        $this->_host = $GLOBALS['API_LOGS']['DB_HOST'];
        $this->_username = $GLOBALS['API_LOGS']['DB_USER'];
        $this->_password = $GLOBALS['API_LOGS']['DB_PASSWORD'];
        $this->_database = $GLOBALS['API_LOGS']['DB_NAME'];
        
        
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
    
    // Get mysqli connection
    public function getConnection()
    {
        return $this->_connection;
    }
}

$conn = Database::getInstance()->getConnection();
$conn_read = $conn;

$GLOBALS['API_LOGS']['RESPONSE'] = new Response();

$GLOBALS['API_LOGS']['VERSION'] = new Version();

if (!$conn) {
    $GLOBALS['API_LOGS']['RESPONSE']->setError('201');
}

$GLOBALS['API_LOGS']['VALIDATOR'] = new Validator($GLOBALS['API_LOGS']['RESPONSE'], $conn);
$GLOBALS['API_LOGS']['REQUEST'] = json_decode(file_get_contents('php://input'), true);

$data = isset($GLOBALS['API_LOGS']['REQUEST']['data']) ? $GLOBALS['API_LOGS']['REQUEST']['data'] : [];

$GLOBALS['API_LOGS']['DB2'] = new databaseControllerNew($GLOBALS['API_LOGS']['RESPONSE'], $conn, $conn_read);

$configs = $GLOBALS['API_LOGS']['DB2']->select('*', 'configs');
foreach ($configs as $config) {
    define($config['key'], $config['value']);
}
?>