<?php

use MongoDB\Client;

$GLOBALS['API_LOGS']['MONGO_DB']= false;
$GLOBALS['API_LOGS']['MONGO_LOGS_TABLE'] = false;
try{
	$mongoHost = $GLOBALS['API_LOGS']['MONGO_EZLOGZ_HOST'];
	$client2 = new Client("$mongoHost/", ['ssl' => false]);

	if (isset($client2)) {
        $GLOBALS['API_LOGS']['MONGO_DB']=   $GLOBALS['API_LOGS']['MONGO_DB2'] = $client2->selectDatabase("logs");
        $GLOBALS['API_LOGS']['MONGO_LOGS_TABLE'] = $GLOBALS['API_LOGS']['MONGO_LOGS_TABLE2'] = $GLOBALS['API_LOGS']['MONGO_DB2']->selectCollection("api_logs_{$GLOBALS['API_LOGS']['REQUEST_DATE']}");
    }
}catch(Exception $e){
	echo $e;
}
