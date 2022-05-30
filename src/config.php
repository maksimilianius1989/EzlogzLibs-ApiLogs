<?php

if (!defined('MAIN_LINK')) {
    if (isset($_SERVER['SERVER_NAME'])) {
        $MAIN_LINK = 'https://'.$_SERVER['SERVER_NAME'];
    } else {
        $MAIN_LINK = 'https://api-logs.ezlogz.com';
    }
}