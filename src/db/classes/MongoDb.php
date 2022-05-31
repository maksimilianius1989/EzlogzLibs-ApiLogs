<?php
require_once __DIR__ .  '/../../libs/mongodb/Client.php';
require_once __DIR__ .  '/../../libs/mongodb/Database.php';
require_once __DIR__ .  '/../../libs/mongodb/Collection.php';
require_once __DIR__ .  '/../../libs/mongodb/Operation/Executable.php';
require_once __DIR__ .  '/../../libs/mongodb/Operation/InsertOne.php';
require_once __DIR__ .  '/../../libs/mongodb/InsertOneResult.php';
require_once __DIR__ .  '/../../libs/mongodb/Operation/Explainable.php';
require_once __DIR__ .  '/../../libs/mongodb/Operation/FindOne.php';
require_once __DIR__ .  '/../../libs/mongodb/Operation/Find.php';
require_once __DIR__ .  '/../../libs/mongodb/Operation/CreateCollection.php';
require_once __DIR__ .  '/../../libs/mongodb/Operation/Update.php';
require_once __DIR__ .  '/../../libs/mongodb/Operation/UpdateOne.php';
require_once __DIR__ .  '/../../libs/mongodb/Operation/Count.php';
require_once __DIR__ .  '/../../libs/mongodb/Operation/CountDocuments.php';
require_once __DIR__ .  '/../../libs/mongodb/Operation/DropCollection.php';
//require_once __DIR__ .  '/../../libs/mongodb/functions.php';
require_once __DIR__ .  '/../../libs/mongodb/Model/BSONDocument.php';
require_once __DIR__ .  '/../../libs/mongodb/Model/BSONArray.php';
require_once __DIR__ .  '/../../libs/mongodb/Model/CollectionInfo.php';
require_once __DIR__ .  '/../../libs/mongodb/Model/CachingIterator.php';
require_once __DIR__ .  '/../../libs/mongodb/Model/CollectionInfoIterator.php';
require_once __DIR__ .  '/../../libs/mongodb/Model/CollectionInfoCommandIterator.php';
require_once __DIR__ .  '/../../libs/mongodb/Model/IndexInput.php';
require_once __DIR__ .  '/../../libs/mongodb/UpdateResult.php';
require_once __DIR__ .  '/../../libs/mongodb/Operation/ListCollections.php';
require_once __DIR__ .  '/../../libs/mongodb/Operation/CreateIndexes.php';
require_once __DIR__ .  '/../../libs/mongodb/Operation/ListIndexes.php';

$GLOBALS['API_LOGS']['MONGO_DB']= false;
$GLOBALS['API_LOGS']['MONGO_LOGS_TABLE'] = false;
try{
	$mongoHost = $GLOBALS['API_LOGS']['MONGO_EZLOGZ_HOST'];
	$client2 = new MongoDB\Client("$mongoHost/", ['ssl' => false]);

	if (isset($client2)) {
        $GLOBALS['API_LOGS']['MONGO_DB']=   $GLOBALS['API_LOGS']['MONGO_DB2'] = $client2->selectDatabase("logs");
        $GLOBALS['API_LOGS']['MONGO_LOGS_TABLE'] = $GLOBALS['API_LOGS']['MONGO_LOGS_TABLE2'] = $GLOBALS['API_LOGS']['MONGO_DB2']->selectCollection("api_logs_{$GLOBALS['API_LOGS']['REQUEST_DATE']}");
    }
}catch(Exception $e){
	echo $e;
}
