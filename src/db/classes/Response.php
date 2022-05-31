<?php

if (!function_exists('getallheaders')) {
    function getallheaders()
    {
        $headers = '';
        
        foreach ($_SERVER as $name => $value) {
            if (substr($name, 0, 5) == 'HTTP_') {
                $headers[str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))))] = $value;
            }
        }
        
        return $headers;
    }
}

class Response
{
    var $code = "000";
    var $message = "Success";
    var $data = "";
    var $check = "";
    var $incoming = "";
    var $app = false;
    
    function setError($error, $name = 'null', $custom = false)
    {
        if ($custom) {
            $this->code = $error;
            $this->message = $name;
        } else {
            $this->code = $error;
            if ($error == '000') {
                $this->message = "Success";
            } elseif ($error == '101') {
                $this->message = "Password can't be empty";
            } elseif ($error == '102') {
                $this->message = "Password's length must be more than 6 characters";
            } elseif ($error == '103') {
                $this->message = "Password's length must be less than 32 characters";
            } elseif ($error == '104') {
                $this->message = "Email can't be empty";
            } elseif ($error == '105') {
                $this->message = "Email length must be less than 132 characters";
            } elseif ($error == '106') {
                $this->message = "Enter valid Email";
            } elseif ($error == '107') {
                $this->message = "Name length must be less than 132 characters";
            } elseif ($error == '108') {
                $this->message = "Last name length must be less than 64 characters";
            } elseif ($error == '109') {
                $this->message = "Phone length must be less than 20 characters";
            } elseif ($error == '110') {
                $this->message = "Extension length must be less than 10 characters";
            } elseif ($error == '111') {
                $this->message = "Carrier name length must be less than 132 characters";
            } elseif ($error == '112') {
                $this->message = "Office address length must be less than 132 characters";
            } elseif ($error == '113') {
                $this->message = "Usdot length must be less than 10 characters";
            } elseif ($error == '114') {
                $this->message = "City length must be less than 64 characters";
            } elseif ($error == '115') {
                $this->message = "Wrong date format";
            } elseif ($error == '116') {
                $this->message = "Wrong status";
            } elseif ($error == '117') {
                $this->message = "$name cannot be empty";
            } elseif ($error == '118') {
                $this->message = "Zip length must be less than 10 characters";
            } elseif ($error == '119') {
                $this->message = "USDOT cannot be empty";
            } elseif ($error == '120') {
                $this->message = "Office address cannot be empty";
            } elseif ($error == '121') {
                $this->message = "City cannot be empty";
            } elseif ($error == '122') {
                $this->message = "State cannot be empty";
            } elseif ($error == '123') {
                $this->message = "Zip cannot be empty";
            } elseif ($error == '124') {
                $this->message = "Name cannot be empty";
            } elseif ($error == '125') {
                $this->message = "Carrier cannot be empty";
            } elseif ($error == '126') {
                $this->message = "Truck/trailer with this name already exists";
            } elseif ($error == '127') {
                $this->message = "Truck/trailer doesn't exist";
            } elseif ($error == '128') {
                $this->message = "Cannot create status for future time";
            } elseif ($error == '129') {
                $this->message = "Truck is required";
            } elseif ($error == '130') {
                $this->message = "Truck with this vin number already exists";
            } elseif ($error == '131') {
                $this->message = "Password must contain only letters and numbers";
            } elseif ($error == '132') {
                $this->message = "Company name cannot be empty";
            } elseif ($error == '133') {
                $this->message = "Enter valid quality";
            } elseif ($error == '134') {
                $this->message = "Surname cannot be empty";
            } elseif ($error == '135') {
                $this->message = "Enter valid phone";
            } elseif ($error == '136') {
                $this->message = "Empty driver position (longitude/latitude)";
            } elseif ($error == '137') {
                $this->message = "Empty driver id";
            } elseif ($error == '138') {
                $this->message = "Empty truck id";
            } elseif ($error == '139') {
                $this->message = "Empty date time";
            } elseif ($error == '140') {
                $this->message = "Class Model not exist";
            } elseif ($error == '141') {
                $this->message = "Incorrect class Model ";
            } elseif ($error == '142') {
                $this->message = "$name field must have the boolean type";
            } elseif ($error == '201') {
                $this->message = "No connection with database";
            } elseif ($error == '202') {
                $this->message = "There is no user with this email and password. Please register.";
            } elseif ($error == '203') {
                $this->message = "User with this email already registered";
            } elseif ($error == '204') {
                $this->message = "Database error";
            } elseif ($error == '205') {
                $this->message = "Session end, please relogin";
            } elseif ($error == '206') {
                $this->message = "There is no carrier with this USDOT number";
            } elseif ($error == '207') {
                $this->message = "Wrong action";
            } elseif ($error == '208') {
                $this->message = "Carrier not registered on " . PROJECT_TYPE;
            } elseif ($error == '209') {
                $this->message = "Carrier already registered on " . PROJECT_TYPE;
            } elseif ($error == '210') {
                $this->message = "No status with this id";
            } elseif ($error == '211') {
                $this->message = "No status with previous id";
            } elseif ($error == '212') {
                $this->message = "Not correct date/previous status";
            } elseif ($error == '213') {
                $this->message = "Wrong action";
            } elseif ($error == '214') {
                $this->message = "Token expire";
            } elseif ($error == '215') {
                $this->message = "Application is only for drivers";
            } elseif ($error == '216') {
                $this->message = "Driver not approved in Fleet, please wait";
            } elseif ($error == '217') {
                $this->message = "No image found";
            } elseif ($error == '218') {
                $this->message = "Error on creating recurring subscription: " . $name;
            } elseif ($error == '219') {
                $this->message = "Error on payment: " . $name;
            } elseif ($error == '220') {
                $this->message = "Cannot create status, next status with the same type";
            } elseif ($error == '221') {
                $this->message = "Cannot create status, previous status with the same type";
            } elseif ($error == '222') {
                $this->message = "Error on saving image";
            } elseif ($error == '223') {
                $this->message = "Error on sending email";
            } elseif ($error == '224') {
                $this->message = "Error on logs creation";
            } elseif ($error == '225') {
                $this->message = "No users with this email";
            } elseif ($error == '226') {
                $this->message = "Already Invited";
            } elseif ($error == '227') {
                $this->message = "No invite from this user";
            } elseif ($error == '228') {
                $this->message = "User not in Fleet";
            } elseif ($error == '229') {
                $this->message = "No report for this date";
            } elseif ($error == '230') {
                $this->message = "You do not have cargo";
            } elseif ($error == '231') {
                $this->message = "Something wrong on facebook side";
            } elseif ($error == '234') {
                $this->message = "Something wrong on google side";
            } elseif ($error == '232') {
                $this->message = "This account was registered under another email";
            } elseif ($error == '233') {
                $this->message = "Cant change user type";
            } elseif ($error == '235') {
                $this->message = "No document to edit";
            } elseif ($error == '236') {
                $this->message = "User is already in Fleet";
            } elseif ($error == '237') {
                $this->message = "Fleet owner/administrator cant leave the fleet";
            } elseif ($error == '238') {
                $this->message = "Carrier Info not found, please insert data manually";
            } elseif ($error == '239') {
                $this->message = "Last fleet owner/administrator cant leave the fleet";
            } elseif ($error == '240') {
                $this->message = "User not fleet owner/administrator";
            } elseif ($error == '241') {
                $this->message = "Leave fleet user error";
            } elseif ($error == '242') {
                $this->message = "Remove user from fleet error";
            } elseif ($error == '243') {
                $this->message = "Update user to fleet admin error";
            } elseif ($error == '244') {
                $this->message = "Please click the confirmation link in the email that we have sent";
            } elseif ($error == '245') {
                $this->message = "Need phone verification by SMS";
            } elseif ($error == '246') {
                $this->message = "Need confirm email by link. Please, check your mail " . $name;
            } elseif ($error == '247') {
                $this->message = "You can send a request to verify the phone once a day.";
            } elseif ($error == '248') {
                $this->message = "Code incorrect!";
            } elseif ($error == '304') {
                $this->message = "Please enter your email on registration";
            } elseif ($error == '327') {
                $this->message = "This user is already in your fleet";
            } elseif ($error == '400') {
                $this->message = "Empty comment message";
            } elseif ($error == '401') {
                $this->message = "Empty group name";
            } elseif ($error == '402') {
                $this->message = "Empty group Id";
            } elseif ($error == '403') {
                $this->message = "Empty invite Id";
            } elseif ($error == '404') {
                $this->message = "Empty post Id";
            } elseif ($error == '405') {
                $this->message = "Empty comment Id";
            } elseif ($error == '406') {
                $this->message = "Empty like Id";
            } elseif ($error == '407') {
                $this->message = "Empty message info";
            } elseif ($error == '408') {
                $this->message = "Empty user Id";
            } elseif ($error == '409') {
                $this->message = "Empty post message";
            } elseif ($error == '410') {
                $this->message = "User all ready in this group";
            } elseif ($error == '411') {
                $this->message = "User is not in this group or group not exist";
            } elseif ($error == '412') {
                $this->message = "Group does not exist";
            } elseif ($error == '413') {
                $this->message = "There are no user privileges for this group";
            } elseif ($error == '414') {
                $this->message = "Invite for this user to group all ready exist";
            } elseif ($error == '415') {
                $this->message = "Incorrect invite";
            } elseif ($error == '416') {
                $this->message = "Post not exist";
            } elseif ($error == '417') {
                $this->message = "Comment not exist";
            } elseif ($error == '418') {
                $this->message = "Empty like data Id";
            } elseif ($error == '419') {
                $this->message = "Like not exsist";
            } elseif ($error == '420') {
                $this->message = "Soc group save file error";
            } elseif ($error == '421') {
                $this->message = "Not privileges to edit this comment";
            } elseif ($error == '422') {
                $this->message = "Empty user login";
            } elseif ($error == '423') {
                $this->message = "Empty users Id arr";
            } elseif ($error == '424') {
                $this->message = "Emails are not the same";
            } elseif ($error == '425') {
                $this->message = "Like already exists";
            } elseif ($error == '426') {
                $this->message = "This is a hidden group";
            } elseif ($error == '427') {
                $this->message = "This is a private group";
            } elseif ($error == '428') {
                $this->message = "Empty user background image";
            } elseif ($error == '429') {
                $this->message = "Empty repost post Id";
            } elseif ($error == '430') {
                $this->message = "Wrong like type";
            } elseif ($error == '431') {
                $this->message = "Empty file Id";
            } elseif ($error == '432') {
                $this->message = "User file does not exist";
            } elseif ($error == '433') {
                $this->message = "Not privileges to edit this post";
            } elseif ($error == '434') {
                $this->message = "All ready decline invite";
            } elseif ($error == '435') {
                $this->message = "User all ready in friend list";
            } elseif ($error == '436') {
                $this->message = "Already accepted invite";
            } elseif ($error == '437') {
                $this->message = "Incorrect user type";
            } elseif ($error == '438') {
                $this->message = "User does not exist";
            } elseif ($error == '439') {
                $this->message = "Incorrect user id";
            } elseif ($error == '440') {
                $this->message = "Friend invite has been already sent ";
            } elseif ($error == '441') {
                $this->message = "Remove user from group error";
            } elseif ($error == '442') {
                $this->message = "Incorrect group type";
            } elseif ($error == '443') {
                $this->message = "Group join request allready exist";
            } elseif ($error == '444') {
                $this->message = "User is not in your friend list";
            } elseif ($error == '445') {
                $this->message = "Incorrect join group requests";
            } elseif ($error == '446') {
                $this->message = "The maximum number of attachments is 10";
            } elseif ($error == '447') {
                $this->message = "Limited access";
            } elseif ($error == '448') {
                $this->message = "Incorrect event type";
            } elseif ($error == '449') {
                $this->message = "Empty event photo/video";
            } elseif ($error == '450') {
                $this->message = "Empty event name";
            } elseif ($error == '451') {
                $this->message = "Empty event place";
            } elseif ($error == '452') {
                $this->message = "Empty event start time";
            } elseif ($error == '453') {
                $this->message = "Empty event finish time";
            } elseif ($error == '454') {
                $this->message = "Empty event description";
            } elseif ($error == '455') {
                $this->message = "Empty event information";
            } elseif ($error == '456') {
                $this->message = "Save file error";
            } elseif ($error == '457') {
                $this->message = "Empty event id";
            } elseif ($error == '458') {
                $this->message = "Event does not exist";
            } elseif ($error == '459') {
                $this->message = "Empty event user status";
            } elseif ($error == '460') {
                $this->message = "User all ready event participant";
            } elseif ($error == '461') {
                $this->message = 'This USDOT already exists in the system';
            } elseif ($error == '462') {
                $this->message = "Not allowed currency amount";
            } elseif ($error == '463') {
                $this->message = "Driver Currently Allowed to edit, please disable edit option for driver";
            } elseif ($error == '505') {
                $this->message = "You are banned. Please contact with support";
            } elseif ($error == '501') {
                $this->message = "Reseller with this Store Number already exist";
            } elseif ($error == '502') {
                $this->message = "Cant find Reseller";
            } elseif ($error == '601') {
                $this->message = "Cant find ELD/AOBRD Device";
            } elseif ($error == '602') {
                $this->message = "Device already created";
            } elseif ($error == '701') {
                $this->message = "Order can be placed with at least one product";
            } elseif ($error == '702') {
                $this->message = "Cancel or Pay previous order to be able to place a new one";
            } elseif ($error == '703') {
                $this->message = "Incorrect overnight type";
            } elseif ($error == '704') {
                $this->message = "Empty order id";
            } elseif ($error == '710') {
                $this->message = "You have a negative balance";
            } elseif ($error == '711') {
                $this->message = "You have not returned devices";
            } elseif ($error == '712') {
                $this->message = "You can not perform this action";
            } elseif ($error == '713') {
                $this->message = "Internal Error. " . ($name != 'null' ? $name : "");
            } elseif ($error == '714') {
                $this->message = "Transfer wasn't yet paid, please contact with $name and advise to pay for the transfer first";
            } elseif ($error == '715') {
                $this->message = "You can not send to yourself";
            } elseif ($error == '716') {
                $this->message = "Device already sent";
            } elseif ($error == '717') {
                $this->message = "Transfer not found";
            } elseif ($error == '718') {
                $this->message = "Max allowed 999 $name";
            } elseif ($error == '719') {
                $this->message = "Mac address must contain 12 characters";
            } elseif ($error == '720') {
                $this->message = "Mac address already exists";
            } elseif ($error == '721') {
                $this->message = "Fleet is in ban. If you want to continue use " . PROJECT_TYPE . " - please contact support.";
            } elseif ($error == '722') {
                $this->message = "User is in ban. If you want to continue use " . PROJECT_TYPE . " - please contact support.";
            } elseif ($error == '723') {
                $this->message = "Client didn't accept order agreement";
            } elseif ($error == '800') {
                $this->message = "Upload Error. " . ($name != 'null' ? $name : "");
            }
        }
        
        if ($this->app == true || (isset($GLOBALS['API_LOGS']['GLOB_LOG_ID']) && !empty($GLOBALS['API_LOGS']['GLOB_LOG_ID'])) || (isset($GLOBALS['API_LOGS']['GLOB_MONGO_LOG_ID']) && !empty($GLOBALS['API_LOGS']['GLOB_MONGO_LOG_ID']))) {
            $web = $this->app == true ? 0 : 1;
            $res = json_encode($GLOBALS['API_LOGS']['RESPONSE']);
            $res = $db->conn->real_escape_string(trim(strip_tags($res)));
            Logs::AddLogResponse($res);
        }
        done($this);
    }
    /* ERRORS
    000 - Success;
    101 - Password can't be empty;
    102 - Password's length must be more than 5 characters;
    103 - Password's length must be less than 32 characters;
    104 - Email can't be empty;
    105 - Email length must be less than 132 characters;
    106 - Enter valid Email;
    107 - Name length must be less than 132 characters;
    108 - Last name length must be less than 64 characters;
    109 - Phone length must be less than 20 characters;
    110 - Extension length must be less than 10 characters;
    111 - Carrier name length must be less than 132 characters;
    112 - Office address length must be less than 132 characters;
    113 - Usdot length must be less than 10 characters;
    114 - City length must be less than 64 characters;
    115 - Wrong date format;
    116 - Wrong status;
    117 - Position cannot be empty;
    118 - Zip length must be less than 10 characters;
    119 - USDOT cannot be empty;
    120 - Office address cannot be empty;
    121 - City cannot be empty;
    122 - State cannot be empty;
    123 - Zip cannot be empty;
    124 - Name cannot be empty;
    125 - Carrier cannot be empty;
    126 - Truck/trailer with this name already exists
    127 - Truck/trailer doesn't exist
    128 - Cannot create status for future time
    201 - No connection with database;
    202 - There is no user with this password and email;
    203 - User with this email already registered;
    204 - Database error;
    205 - Session end, please relogin;
    206 - There is no carrier with this USDOT number;
    207 - Wrong action;
    208 - Carrier not registered on Ezlogz;
    209 - Carrier already registered on Ezlogz;
    210 - No status with this id;
    211 - No status with previous id;
    212 - Not correct date/previous status;
    213 - Wrong action;
    214 - Token expire;
    215 - Application is only for drivers;
    216 - Driver not approved in Fleet, please wait;
    217 - No image found;
    218 - Error on creating recurring subscription: message
    223 - Error on sending email
    224 - Error on logs creation
    225 - No users with this email
    226 - Already Invited
    227 - No invite from this user
    228 - User not in Fleet
    */
}

function done($response)
{
    $GLOBALS['API_LOGS']['DB2']->close();
    die(json_encode($response));
}

function encryptIt($q)
{
    $cryptKey = 'sdsvsdvsdveavaerv32r2r232fw232wrw';
    $qEncoded = base64_encode(mcrypt_encrypt(MCRYPT_RIJNDAEL_256, md5($cryptKey), $q, MCRYPT_MODE_CBC, md5(md5($cryptKey))));
    return ($qEncoded);
}

function decryptIt($q)
{
    $cryptKey = 'sdsvsdvsdveavaerv32r2r232fw232wrw';
    $qDecoded = rtrim(mcrypt_decrypt(MCRYPT_RIJNDAEL_256, md5($cryptKey), base64_decode($q), MCRYPT_MODE_CBC, md5(md5($cryptKey))), "\0");
    return ($qDecoded);
}

?>
