<?php

namespace Ezlogz\ApiLogs\db\classes;

class Validator
{
	function __construct($response, $conn)
	{
		$this->response = $response;
		$this->conn = $conn;
	}
	
	function redirect($url)
	{
		if (headers_sent()) {
			die('<script type="text/javascript">window.location.href="' . $url . '";</script>');
		} else {
			header('Location: ' . $url);
			die();
		}
	}
	
	function checkSessionFull($site = false, $params = [])
	{
		$session = [];
		$cookieSession = isset($_COOKIE['session']) ? $_COOKIE['session'] : null;
		$sessionValue = isset($_SERVER['HTTP_SESSION']) ? $_SERVER['HTTP_SESSION'] : $cookieSession;
		
		if ($Gsession) {
			$sessionValue = $Gsession;
		}
		
		if (isset($sessionValue))
			$session = $GLOBALS['API_LOGS']['DB2']->select('*', '`sessions`', '`sessionId`=?', [$sessionValue]);
		
		if (empty($session)) {
			if ($site) {
				unset($_COOKIE['user']);
				setcookie('user', null, -1, '/');
				unset($_COOKIE['last']);
				setcookie('last', null, -1, '/');
				unset($_COOKIE['role']);
				setcookie('role', null, -1, '/');
				unset($_COOKIE['session']);
				setcookie('session', null, -1, '/');
				unset($_COOKIE['PHPSESSID']);
				setcookie('PHPSESSID', null, -1, '/');
				session_unset();
				if (session_id() !== '')
					session_destroy();
				ob_end_flush();
				if (isset($_SERVER['HTTP_X_REQUESTED_WITH'])) {
					$this->response->setError('205');
				} else
					$this->redirect('/');
				exit();
			} else {
				$this->response->setError('205');
			}
		}

		$id = $session[0]['userId'];
	}
	
	function checkAppSessionFull()
	{
		if (isset($_COOKIE['PHPSESSID'])) {
			$session = $GLOBALS['API_LOGS']['DB2']->select('*', '`sessions`', '`sessionId`=?', [$_COOKIE['PHPSESSID']]);
			if (!empty($session)) {
				return $session[0];
			}
		}
		$oldSess = isset($_COOKIE['PHPSESSID']) ? $_COOKIE['PHPSESSID'] : '';
		$sessionemail = isset($_SESSION['email']) ? $_SESSION['email'] : '';
		$this->response->checksession = ['oldsessionId' => $oldSess,
			'newsessionId' => session_id(),
			'sessionemail' => $sessionemail];
		$this->response->setError('205');
		
	}
	
	function validateStatus($field)
	{
		$field = $this->conn->real_escape_string(trim(strip_tags($field)));
		if ($field == 'on' || $field == 'off' || $field == 'sleeping' || $field == 'driving') {
			return $field;
		} else {
			$this->response->setError('116');
		}
	}
	
	function validateAction($field)
	{
		$field = $this->conn->real_escape_string(trim(strip_tags($field)));
		if ($field == 'addStatus' ||
			$field == 'getStatusList' ||
			$field == 'deleteStatus' ||
			$field == 'editStatus') {
			return $field;
		} else {
			$this->response->setError('207');
		}
		
	}
	
	function validateOptinalText($field)
	{
		$field = $this->conn->real_escape_string(trim(strip_tags($field)));
		$field = str_replace("\\", "", $field);
		return $field;
	}
	
	function validateText($field, $name)
	{
		$field = $this->conn->real_escape_string(trim(strip_tags($field)));
		if ($field == '') {
			$this->response->setError('117', $name);
		}
		return $field;
	}
	
	function validateDateTime($field)
	{
		$format = 'Y-m-d H:i:s';
		$d = DateTime::createFromFormat($format, $field);
		if ($d && $d->format($format) == $field) {
			$field = $this->conn->real_escape_string(trim(strip_tags($field)));
			return $field;
		} else {
			$this->response->setError('115');
		}
		
	}
	
	function validateDateUSA($field, $key)
	{
		$format = 'm-d-Y';
		$d = DateTime::createFromFormat($format, $field);
		if ($d && $d->format($format) == $field) {
			$field = $this->conn->real_escape_string(trim(strip_tags($field)));
			return $field;
		} else {
			$this->response->setError('115', $key, true);
		}
	}
	
	function validateBool($value, $field = false): bool
	{
		if ($value === "true") {
			$value = true;
		} else if ($value === "false") {
			$value = false;
		}
		
		if (!empty($value) && is_string($value)) {
			$this->response->setError('142', $field);
		}
		
		return boolval($value);
	}
	
	function validatePassword($field)
	{
		$field = $this->conn->real_escape_string(trim(strip_tags($field)));
		if ($field == '') {
			$this->response->setError('101');
		} elseif (strlen($field) < 6) {
			$this->response->setError('102');
		} elseif (strlen($field) > 32) {
			$this->response->setError('103');
		} elseif (!preg_match("/^[0-9a-zA-Z-_+=.,?!]+$/", $field)) {
			$this->response->setError('131');
		}
		$field = encryptIt($field);
		return $field;
	}
	
	function validateEmail($field)
	{
		$field = $this->conn->real_escape_string(trim(strip_tags($field)));
		if ($field == '') {
			$this->response->setError('104');
		} elseif (strlen($field) > 132) {
			$this->response->setError('105');
		} elseif (!filter_var($field, FILTER_VALIDATE_EMAIL)) {
			$this->response->setError('106');
		}
		return $field;
	}
	
	function validateSocEmail($field)
	{
		$field = $this->conn->real_escape_string(trim(strip_tags($field)));
		if ($field == '') {
			$this->response->setError('304');
		}
		return $field;
	}
	
	function validateName($field)
	{
		$field = $this->conn->real_escape_string(trim(strip_tags($field)));
		if (strlen($field) > 64) {
			$this->response->setError('107');
		} elseif (strlen($field) == 0) {
			$this->response->setError('124');
		}
		return $field;
	}
	
	function validateLast($field)
	{
		$field = $this->conn->real_escape_string(trim(strip_tags($field)));
		if (strlen($field) > 64) {
			$this->response->setError('108');
		}
		return $field;
	}
	
	function validatePhone($field)
	{
		$field = $this->conn->real_escape_string(trim(strip_tags($field)));
		if (strlen($field) > 20) {
			$this->response->setError('109');
		}
		$correctPhone = preg_replace('~[^0-9]+~', '', $field);
		return $this->formatPhone($correctPhone);
	}
	
	function formatPhone($phone)
	{
		$count = 0;
		a:
		if (empty($phone))
			return "";
		if (strlen($phone) < 10) {
			$zero = '';
			$len = 10 - strlen($phone);
			for ($i = 0; $i < $len; $i++) {
				$zero .= '0';
			}
			$phone = $zero . $phone;
			sscanf($phone, "%3s%3s%4s", $area, $prefix, $exchange);
		} else if (strlen($phone) == 10)
			sscanf($phone, "%3s%3s%4s", $area, $prefix, $exchange);
		else if (strlen($phone) > 10)
			sscanf($phone, "%3s%3s%4s%s", $area, $prefix, $exchange, $extension);
		else
			return 'unknown phone format:' . $phone;
		$out = "";
		$out .= isset($country) ? $country . ' ' : '';
		$out .= isset($area) ? $area . ' ' : '';
		$out .= $prefix . ' ' . $exchange;
		if (isset($extension)) {
			$phone = substr($phone, -10);
			unset($extension);
			goto a;
		}
		return $out;
	}
	
	function validateExt($field)
	{
		$field = $this->conn->real_escape_string(trim(strip_tags($field)));
		if (strlen($field) > 10) {
			$this->response->setError('110');
		}
		return $field;
	}
	
	function validateCarName($field)
	{
		$field = $this->conn->real_escape_string(trim(strip_tags($field)));
		if (strlen($field) > 132) {
			$this->response->setError('111');
		} elseif (strlen($field) == 0) {
			$this->response->setError('124');
		}
		return $field;
	}
	
	function validateOfficeAddr($field)
	{
		$field = $this->conn->real_escape_string(trim(strip_tags($field)));
		if (strlen($field) > 132) {
			$this->response->setError('112');
		} elseif (strlen($field) == 0) {
			$this->response->setError('120');
		}
		return $field;
	}
	
	function validateUsdot($field)
	{
		$field = $this->conn->real_escape_string(trim(strip_tags($field)));
		if (strlen($field) > 10) {
			$this->response->setError('113');
		} elseif (strlen($field) == 0) {
			$this->response->setError('119');
		}
		return $field;
	}
	
	function validateState($field)
	{
		$field = $this->conn->real_escape_string(trim(strip_tags($field)));
		if (strlen($field) == 0) {
			$this->response->setError('122');
		}
		return $field;
	}
	
	function validateZip($field)
	{
		$field = $this->conn->real_escape_string(trim(strip_tags($field)));
		if (strlen($field) > 10) {
			$this->response->setError('118');
		} elseif (strlen($field) == 0) {
			$this->response->setError('123');
		}
		return $field;
	}
	
	function validateCity($field)
	{
		$field = $this->conn->real_escape_string(trim(strip_tags($field)));
		if (strlen($field) > 64) {
			$this->response->setError('114');
		} elseif (strlen($field) == 0) {
			$this->response->setError('121');
		}
		return $field;
	}
	
	function validateFleet($field)
	{
		$field = $this->conn->real_escape_string(trim(strip_tags($field)));
		return $field;
	}
	
	function validatePosition($field)
	{
		$field = $this->conn->real_escape_string(trim(strip_tags($field)));
		return $field;
	}
	
	function validateCarrierId($field)
	{
		$field = $this->conn->real_escape_string(trim(strip_tags($field)));
		if (strlen($field) == 0) {
			$this->response->setError('125');
		}
		return $field;
	}
}
