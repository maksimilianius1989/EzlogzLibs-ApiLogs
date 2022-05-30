<?php

function myErrorHandler($errno, $errstr, $errfile, $errline){
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

    if(DEV_ENV){
        global $request;
        error_log(json_encode($request));
		//l(debug_backtrace());
    }
	setServerTimeZoneToUserTimeZone();
}

require_once $_SERVER['DOCUMENT_ROOT'] . '/config.php';
require_once $_SERVER['DOCUMENT_ROOT'] . '/config/user_access.php';
require_once $_SERVER['DOCUMENT_ROOT'].'/vendor/autoload.php';

require_once $_SERVER['DOCUMENT_ROOT'].'/db/classes/Logger.php';
require_once $_SERVER['DOCUMENT_ROOT'].'/vendor/symfony/var-dumper/Resources/functions/dump.php';

use Ezlogz\Infrastructure\Profiler\Service\ProfilerService;
use Symfony\Component\VarDumper\VarDumper;
use Symfony\Component\VarDumper\Cloner\VarCloner;
use Symfony\Component\VarDumper\Dumper\ServerDumper;

VarDumper::setHandler(function ($var) {
    $cloner = new VarCloner();
    $dumper = new ServerDumper('tcp://127.0.0.1:9912');
    $dumper->dump($cloner->cloneVar($var));
});

if($_SERVER['REQUEST_URI'] == '/db/appController/'){
    Logger::init('app');
}else{
    Logger::init('default');
}

global $Gsession;
if (isset($_GET['session']) && !empty($_GET['session'])) {
    $Gsession = $_GET['session'];
}


require_once $_SERVER['DOCUMENT_ROOT'].'/db/utils.php';
require_once $_SERVER['DOCUMENT_ROOT'].'/db/classes/db.php';
require_once $_SERVER['DOCUMENT_ROOT'].'/db/classes/db2.php';
//require_once $_SERVER['DOCUMENT_ROOT'].'/config.dev.php';
require_once $_SERVER['DOCUMENT_ROOT'].'/db/version.php';
date_default_timezone_set('UTC');
require_once $_SERVER['DOCUMENT_ROOT'].'/db/classes/Response.php';
if ((int)phpversion() < 7) {
	require_once $_SERVER['DOCUMENT_ROOT'].'/db/classes/ValidatorOld.php';
} else {
	require_once $_SERVER['DOCUMENT_ROOT'].'/db/classes/Validator.php';
}
require_once $_SERVER['DOCUMENT_ROOT'].'/db/classes/Date.php';
require_once $_SERVER['DOCUMENT_ROOT'].'/db/classes/Logs.php';

set_error_handler("myErrorHandler");
ini_set("log_errors", 1);
if($_SERVER['REQUEST_URI'] == '/db/appController/'){
    ini_set("error_log", $_SERVER['DOCUMENT_ROOT']."php-api-error.log");
}else{
    ini_set("error_log", $_SERVER['DOCUMENT_ROOT']."php-error.log");
}

$requestDate = Date::Today(true, false);
if(!LOCAL_ENV)
    require_once $_SERVER['DOCUMENT_ROOT'].'/db/classes/MongoDb.php';
$globLogId = 0;
$globMongoLogId = 0;

if(ON_MAINTENANCE){
    global $web;
    if($web){
        require_once $_SERVER['DOCUMENT_ROOT'] . '/frontend/pages/maintanence.php';die();
    }
    $response->setError('201', MAINTENANCE_TEXT, true);
}
//$conn = connect();

$profileService = new ProfilerService();
$profileService->start();


class Database {
    private $_connection;
    private static $_instance; //The single instance
    private $_host = DB_HOST;
    private $_username = DB_USER;
    private $_password = DB_PASSWORD;
    private $_database = DB_NAME;
    /*
    Get an instance of the Database
    @return Instance
    */
    public static function getInstance() {
        if(!self::$_instance) { // If no instance then make one
            self::$_instance = new self();
        }
        return self::$_instance;
    }
    // Constructor
    private function __construct() {
        $this->_connection = new mysqli(
            $this->_host,
            $this->_username,
            $this->_password,
            $this->_database
        );

        // Error handling
        if(mysqli_connect_error()) {
            trigger_error("Failed to conencto to MySQL: " . mysqli_connect_error(),
                E_USER_ERROR);
        }

        $this->_connection->set_charset("utf8mb4");
    }
    // Magic method clone is empty to prevent duplication of connection
    private function __clone() { }
    // Get mysqli connection
    public function getConnection() {
        return $this->_connection;
    }
}

class DatabaseRead {
    private $_connection;
    private static $_instance; //The single instance
    private $_host = DB_HOST;
    private $_username = DB_USER;
    private $_password = DB_PASSWORD;
    private $_database = DB_NAME;
    /*
    Get an instance of the Database
    @return Instance
    */
    public static function getInstance() {
        if(!self::$_instance) { // If no instance then make one
            self::$_instance = new self();
        }
        return self::$_instance;
    }
    // Constructor
    private function __construct() {
        $this->_connection = new mysqli(
            $this->_host,
            $this->_username,
            $this->_password,
            $this->_database
        );

        // Error handling
        if(mysqli_connect_error()) {
            trigger_error("Failed to conencto to MySQL: " . mysqli_connect_error(),
                E_USER_ERROR);
        }
    }
    // Magic method clone is empty to prevent duplication of connection
    private function __clone() { }
    // Get mysqli connection
    public function getConnection() {
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

function connect() {
    $mysqli =  new mysqli(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME);


return $mysqli;
}

$db = new databaseController($response, $conn);

$db2 = new databaseControllerNew($response, $conn,$conn_read);

$configs = $db2->select('*','configs');
foreach($configs as $config){
    define($config['key'], $config['value']);
}
?>