<?php

namespace Ezlogz\ApiLogs\db\classes;

class Date
{
    function __construct()
    {
    }
    
    public static function getDurationFromSec($time, $simpleway)
    {
        $hours = floor($time / 3600);
        $time = $time - $hours * 3600;
        $minutes = floor($time / 60);
        $hours = sprintf("%02d", $hours);
        $minutes = sprintf("%02d", $minutes);
        if ($simpleway) {
            $s = $hours . ':' . $minutes;
            return $s;
        }
        return $hours . 'h ' . $minutes . 'm';
    }
    
    public static function Today($string = false, $time = false)
    {
        $today = date_create();
        if ($time) {
            $today = date_format($today, "Y-m-d H:i:s");
        } else {
            $today = date_format($today, "Y-m-d");
        }
        
        if ($string) {
            return $today;
        }
        return $todayTime = strtotime($today);
    }
    
    public static function GetDateFromDateTime($string)
    {
        $dt = new DateTime($string);
        return $dt->format('Y-m-d');
    }
    
    public static function getFormattedDateTime($string)
    {
        $dt = new DateTime($string);
        return $dt->format('Y-m-d H:i:s');
    }
    
    public static function GetTimeFromDateTime($string)
    {
        $dt = new DateTime($string);
        return $dt->format('H:i:s');
    }
    
    public static function GetTimeinMsFromDateTime($string)
    {
        return strtotime($string);
    }
    
    public static function GetDiffTimesMS($time1, $time2)
    {
        return strtotime($time1) - strtotime($time2);
    }
    
    public static function GetDiffDays($date1, $date2)
    {
        $date1 = new DateTime($date1);
        $date2 = new DateTime($date2);
        return $date1->diff($date2)->format("%r%a");
    }
    
    public static function GetDateFromMS($ms)
    {
        return date("Y-m-d", $ms);
    }
    
    public static function GetDateTimeFromMS($ms)
    {
        return date("Y-m-d H:i:s", $ms);
    }
    
    public static function GetLastHoursFromTime($time, $hours)
    {
        return date('Y-m-d H:i:s', strtotime($time) - 60 * 60 * $hours);
    }
    
    public static function AddHoursToTime($time, $hours)
    {
        return date('Y-m-d H:i:s', strtotime($time) + 60 * 60 * $hours);
    }
    
    public static function AddSecondsToTime($time, $seconds)
    {
        return date('Y-m-d H:i:s', strtotime($time) + $seconds);
    }
    
    public static function AddDaysToDate($date, $days)
    {
        return date('Y-m-d', strtotime($date . ' + ' . $days . ' days'));
    }
    
    public static function SubDaysFromDate($date, $days)
    {
        return date('Y-m-d', strtotime($date . ' - ' . $days . ' days'));
    }
    
    public static function convertDateToUSA($date, $withTime = false)
    {
        $dt = new DateTime($date);
        if ($withTime) {
            return $dt->format('m-d-Y H:i:s');
        }
        return $dt->format('m-d-Y');
    }
    
    public static function convertFromUsaToSQL($date)
    {
        $parts = explode('-', $date);
        $date = $parts[2] . '-' . $parts[0] . '-' . $parts[1];
        $date = date('Y-m-d', strtotime($date));
        return $date;
    }
    
    public static function SecToHoursMinutes($sec)
    {
        $mins = $sec / 60;
        $hours = floor($mins / 60);
        $mins = $mins - $hours * 60;
        return sprintf('%02d', $hours) . 'h ' . sprintf('%02d', $mins) . 'm';
    }
    
    public static function convertDateTime($array, $userId, $timeField = 'dateTime', $timeFieldUTC = 'dateTimeUtc')
    {
        $timeZone = Date::getUserTimeZone($userId);
        $utcTimeZone = new DateTimeZone('UTC');
        foreach ($array as &$item) {
            $dateString = $item[$timeFieldUTC];
            try {
                $date = new DateTime($dateString, $utcTimeZone);
                $date->setTimezone($timeZone);
                $item[$timeField] = $date->format('Y-m-d H:i:s');
            } catch (Exception $e) {
            }
        }
        return $array;
    }
    
    public static function convertDateTimeRow($item, $userId, $timeField = 'dateTime', $timeFieldUTC = 'dateTimeUtc')
    {
        if (!isset($item[$timeField]) || !isset($item[$timeFieldUTC])) {
            return $item;
        }
        $timeZone = Date::getUserTimeZone($userId);
        $dateString = $item[$timeFieldUTC];
        try {
            $date = new DateTime($dateString, new DateTimeZone('UTC'));
            $date->setTimezone($timeZone);
            $item[$timeField] = $date->format('Y-m-d H:i:s');
        } catch (Exception $e) {
        }
        return $item;
    }
    
    public static $timeZoneLoc = [];
    
    public static function getTimeZone($timeZoneId): DateTimeZone
    {
        if (!isset(self::$timeZoneLoc[$timeZoneId])) {
            $timeZoneTypes = $GLOBALS['API_LOGS']['DB2']->select('*', '`timeZoneTypes`', 'id=?', [$timeZoneId]);
            $timeZone = reset($timeZoneTypes);
            self::$timeZoneLoc[$timeZoneId] = $timeZone['valueSave'];
        }
        
        if (self::$timeZoneLoc[$timeZoneId] === 0) {
            return new DateTimeZone('UTC');
        } else {
            return new DateTimeZone(self::generateTimeDiff(self::$timeZoneLoc[$timeZoneId]));
        }
    }
    
    private static function generateTimeDiff($value)
    {
        $value = $value * (-1);
        return '-0' . $value . '00';
    }
}
