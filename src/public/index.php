<?php

ob_start();
if (session_id() == '' && isset($_COOKIE['user'])) {
    session_start();
}
?>
<?php
require_once 'config.php';
require_once 'db/apiController.php';
global $id, $validator, $db2, $version;

$apiC = new apiController();
$apis = $apiC->getApis();
$zzSession = $db2->select('s.sessionId', 'users u left join sessions s on s.userId = u.id', "u.email='zz@zz.zz' and s.site = 0", []);
$ZZsession = !empty($zzSession) ? $zzSession[0]['sessionId'] : 0;

if (true) {
    
	if (!function_exists('redirect')) {
        function redirect($url) {
            if (headers_sent()) {
                die('<script type="text/javascript">window.location.href="' . $url . '";</script>');
            } else {
                header('Location: ' . $url);
                die();
            }
        }
	}
    
    $validator->checkSessionFull();
    $user = $db2->select('*', 'users', 'id=? and companyPosition = 2', [$id]);
    if (empty($user)) {
        redirect('/');
    }
}
$uri = explode('?', $_SERVER['REQUEST_URI']);
?>
<!doctype html>
<html>
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"/>
	<title>EzLogz</title>
	<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
	<link rel="stylesheet" href="<?= $MAIN_LINK ?>/dash/assets/css/libs/jquery-ui.css">
	<link rel="icon" type="image/png" href="<?= $MAIN_LINK ?>/frontend/assets/images/restyle/favicons/favicon_64x64.png"
		  sizes="64x64">
	<link rel="apple-touch-icon" sizes="180x180" href="<?= $MAIN_LINK ?>/assets/img/icon/apple-touch-icon.png">
	<link rel="mask-icon" href="<?= $MAIN_LINK ?>/assets/img/icon/safari-pinned-tab.svg" color="#5bbad5">
	<meta name="theme-color" content="#ffffff">
    
    <?php $version->getCssDashUri($uri[0]); ?>
    <?php
    Version::echoUrl('/dash/assets/js/libs/jquery-2.1.4.min.js');
    Version::echoUrl('/dash/assets/js/libs/bootstrap.min.js');
    Version::echoUrl('/dash/assets/js/libs/jquery-ui.js');
    Version::echoUrl('/dash/assets/js/libs/jquery.ui.touch-punch.min.js');
    Version::echoUrl('/dash/assets/js/libs/jquery-ui-timepicker-addon.js');
    Version::echoUrl('/dash/assets/js/libs/daterangepicker.min.js');
    Version::echoUrl('/assets/js/main.js');
    Version::echoUrl('/dash/assets/js/utilities.js');
    Version::echoUrl('/dash/assets/js/controllers/AjaxController.js');
    ?>

</head>
<body>

<style>
	#logs_table .one_log {
		font-size: 0;
		border-bottom: 2px solid gray;
		margin-bottom: 10px;
		height: 150px;
		min-height: 150px;
		overflow: hidden;
		position: relative;
	}

	#logs_table .one_log.small {
		height: auto;
		min-height: auto;
	}

	#logs_table .one_log .exp_button {
		width: 100%;
	}

	#logs_table .one_log .del_button {
		position: absolute;
		top: 6px;
		right: 6px;
		font-size: 16px;
	}

	.buttons_hover {
		display: none !important;
		position: absolute;
		top: -1px;
		right: 4px;
	}

	.res_response:hover .buttons_hover, .res_request:hover .buttons_hover {
		display: inline-block !important;
	}

	#logs_table .one_log.expanded {
		height: auto;
		overflow: visible;
	}

	#logs_table .one_log div {
		display: inline-block;
		box-sizing: border-box;
		font-size: 13px;
		word-wrap: break-word;
		vertical-align: top;
		padding: 1px;
	}

	#logs_nav {
		display: none;
		border-bottom: 1px solid #ccc;
		border-top: 1px solid #ccc;
		padding-top: 4px;
		padding-bottom: 2px;
	}

	#logs_nav input, #logs_nav button {
		height: 35px;
		vertical-align: middle;
	}

	.res_ip {
		text-align: center;
		width: 10%;
	}

	.res_request {
		width: 18%;
		max-height: 141px;
		overflow: auto;
	}

	.res_response {
		width: 53%;
		height: 141px;
		overflow: auto;
	}

	.res_response, .res_request {
		position: relative;
	}

	#logs_table .one_log.expanded .res_response, #logs_table .one_log.expanded .res_request {
		height: auto;
		max-height: initial;
		overflow: visible;
	}

	.res_cookies {
		width: 10%;
	}

	.platform {
		width: 7%;
		text-align: center;
	}

	.action {
		width: 5%;
		text-align: center;
	}

	.res_request_time {
		text-align: center;
		width: 13%;
	}

	.res_response_time {
		text-align: center;
		width: 6%;
	}

	#search_bar {
		border-right: 2px solid gray;
		border-left: 2px solid gray;
	}

	#dataJson {
		height: 150px;
	}

	#testRequest {

	}

	#request_response_table {
		border: 1px solid black;
		table-layout: fixed;
		width: 100%;
	}

	#request_response_table th {
		text-align: center;
		width: 150px;
	}

	#request_response_table th, #request_response_table td {
		vertical-align: top;
		border: 1px solid black;
		padding: 2px;
	}

	#request_response_table td {

	}

	#logs_result {
		clear: both;
	}

	#jsonData {
		display: block;
	}

	#examplesBox {
		height: 200px;
		border: 1px solid #ccc;
		border-radius: 5px;
		overflow-y: auto;
		overflow-x: hidden;
	}

	.oneApiBox {
		cursor: pointer;
	}

	.oneApiBox:hover, .oneApiBox.active {
		background: #ccc;
	}

	pre {
		white-space: pre-wrap; /* Since CSS 2.1 */
		white-space: -moz-pre-wrap; /* Mozilla, since 1999 */
		white-space: -pre-wrap; /* Opera 4-6 */
		white-space: -o-pre-wrap; /* Opera 7 */
		word-wrap: break-word; /* Internet Explorer 5.5+ */
	}

	#search_user_results {
		position: absolute;
		background: white;
		width: auto;
		border: 1px solid #ccc;
		border-radius: 5px;
		left: 15px;
		top: 55px;
		z-index: 999;
	}

	#search_user {
		min-width: 340px;
	}

	#search_user_results p {
		cursor: pointer;
		padding: 0 5px;
		margin: 0;
		min-width: 340px;
	}

	#search_user_results p:hover {
		background: #ccc;
	}

	#showPushLogs {
		display: block;
		margin-top: 5px;
	}

	pre {
		outline: 1px solid #ccc;
		padding: 5px;
		margin: 5px;
		background: #282923;
		color: #aaa;
	}

	.string {
		color: #E95384;
	}

	.number {
		color: darkorange;
	}

	.boolean {
		color: blue;
	}

	.null {
		color: magenta;
	}

	.key {
		color: #EAE192;
	}

	.list_box {
		position: absolute;
		background: white;
		width: 100%;
		max-width: 300px;
		border: 1px solid #ccc;
		border-radius: 4px;
		padding: 5px 0;
		max-height: 205px;
		overflow: auto;
		z-index: 999;
	}

	.list_box p {
		padding: 0 5px;
		margin: 0;
	}

	.list_box p:not(.no_click):hover {
		background: #ecfaff;
		cursor: pointer;
	}

	#showPushLogs {
		display: block;
		margin-top: 5px;
	}

	#logsStatisticsDate {
		width: 1px;
		height: 1px;
		position: absolute;
		left: 0;
		top: 20px;
		z-index: -1;
	}

	#iosixParseData {
		width: 340px;
	}

	#iosixParseData span {
		display: inline-block;
		width: 100px;
		font-weight: bold;
	}

	.wrapper {
		padding-left: 10px;
		padding-right: 10px;
		overflow-x: hidden;
	}

	.wrapper .form-group label {
		margin-bottom: 1px;
		min-height: auto;
	}

	.wrapper .form-group {
		margin-bottom: 5px;
	}

	.mobile_block {
		display: inline-block;
	}

	.one_log label {
		min-height: 15px;
	}

	#mobile_switcher_block button {
		width: 33.333%;
	}

	@media (max-width: 991px) {
		#mobile_switchable > div {
			display: none;
		}

		#mobile_switchable > div.showMobile {
			display: block;
		}

		#logs_table .one_log > div {
			width: 100%;
		}

		#logs_table .one_log {
			height: auto;
		}

		.mobile_block {
			display: block;
			margin-top: 3px;
		}

		.mobile_block label {
			width: 90px;
		}
	}

	@media (min-width: 992px) {
		#mobile_switcher {
			display: none
		}
	}
</style>
<section>
	<div class="wrapper">
		<div class="form-horizontal mt-2" id="mobile_switcher">
			<div class="form-group">
				<div class="col-sm-12">
					<div class="check_buttons_block new full_width modal_switcher" id="mobile_switcher_block">
						<button class="btn btn-default active" onclick="doActive(this);switchMobileSection(this)"
								data-val="test_bar">Requests
						</button>
						<button class="btn btn-default" onclick="doActive(this);switchMobileSection(this)"
								data-val="search_bar">Search
						</button>
						<button class="btn btn-default" onclick="doActive(this);switchMobileSection(this)"
								data-val="eld_logs">Eld Logs
						</button>
					</div>
				</div>
			</div>
		</div>
		<div class="row" id="mobile_switchable">
			<div id="test_bar" class="col-md-4 pt-2">
				<div class="form-horizontal">
					<div class="form-group">
						<div class="col-sm-12">
							<label>Session Id</label>
							<input class="form-control" type="text" placeholder="Session Id" id="sessionId"
								   value="<?= $ZZsession ?>"/>
						</div>
					</div>
					<div class="form-group">
						<div class="col-sm-12">
							<label>Action</label>
							<input class="form-control" type="text" placeholder="Action" id="action" value="logIn"
								   onkeyup="checkReqActions(this)"/>
						</div>
					</div>
					<div class="form-group">
						<div class="col-sm-12">
							<label id="jsonData">Data json</label>
							<div id="examplesBox" class="mb-1"></div>
							<textarea class="form-control" type="text" placeholder="Action" id="dataJson">{"email":"zz@zz.zz","pass":"zzzzzz", "version":7, "debug":1, "phoneType": 1, "appVersion": "1.43.9"}</textarea>
						</div>
					</div>
					<div class="form-group">
						<div class="col-sm-12">
							<button id="testRequest" class="btn btn-default">Send Request</button>
						</div>
					</div>
				</div>

			</div>
			<div id="search_bar" class="col-md-4 pt-2">
				<div class="form-horizontal">
					<div class="form-group">
						<div class="col-sm-12">
							<label>Ip</label>
							<input class="form-control" type="text" placeholder="ip" id="ip"/>
						</div>
					</div>
					<div class="form-group">
						<div class="col-sm-12">
							<label>Date</label>
							<input class="datepicker form-control" placeholder="date" id="date"/>
						</div>
					</div>
					<div class="form-group">
						<div class="col-sm-12">
							<label>Time From</label>
							<input type="text" placeholder="time from" class="datetimepicker form-control"
								   id="dateFrom"/>
						</div>
					</div>
					<div class="form-group">
						<div class="col-sm-12">
							<label>Time Till</label>
							<input type="text" placeholder="time till" class="datetimepicker form-control"
								   id="dateTill"/>
						</div>
					</div>
					<div class="form-group">
						<div class="col-sm-12">
							<label>User Id</label>
							<input class="form-control" type="text" placeholder="" user id" id="userId"/>
						</div>
					</div>
					<div class="form-group">
						<div class="col-sm-12">
							<label>Actions</label>
							<input class="form-control" placeholder="action" id="action_req"
								   onkeyup="checkReqActions(this)"></textarea>
						</div>
					</div>
					<div class="form-group">
						<div class="col-sm-12">
							<label>Platform</label>
							<select class="form-control" id="platform_req">
								<option value="-1">All</option>
								<option value="0">App</option>
								<option value="1">Web</option>
								<option value="2">Email</option>
								<option value="5">FMCSA Output logs</option>
								<option value="6">PDF</option>
								<option value="7">Finances</option>
								<option value="8">Finances Recurring</option>
								<option value="9">Charging Fleets</option>
								<option value="10">Charging Solo Drivers</option>
								<option value="32">Background Push</option>
								<option value="31">Visible Push</option>
								<option value="33">Web Push</option>
							</select>
						</div>
					</div>
					<div class="form-group">
						<div class="col-sm-12">
							<label>Amount</label>
							<select class="form-control" id="search_amount">
								<option>1</option>
								<option>5</option>
								<option>25</option>
								<option>50</option>
								<option selected="selected">100</option>
								<option>200</option>
								<option>500</option>
								<option>1000</option>
							</select>
						</div>
					</div>
				</div>
				<div class="one_field" style="position:relative">
					<button onclick="searchClick()" class="btn btn-default">Search</button>
					<button onclick="liveView(true)" id="liveViewBtn" class="btn btn-default">Live Data</button>
					<button onclick="cleaLiveData(true)" id="cleaLiveDataBtn" class="btn btn-default">Clear Result
					</button>
					<button id="showLogsStatistics" class="btn btn-default">Show logs statistics</button>
					<input type="text" class="datepicker" id="logsStatisticsDate"/>
				</div>
			</div>
			<div id="eld_logs" class="col-md-4 pt-2">
				<div class="form-horizontal">
					<div class="form-group">
						<div class="col-sm-12">
							<label>Show User Eld Logs</label>
							<input class="form-control" onkeyup="getUsers();" type="text" id="search_user"/>
							<div id="search_user_results"></div>
						</div>
					</div>
					<div class="form-group">
						<div class="col-sm-12">
							<button onclick="showLogs();" class="btn btn-default">Show Logs</button>
						</div>
					</div>
					<div class="form-group">
						<div class="col-sm-12">
							<a href="https://jsonformatter.curiousconcept.com/" target="_blank" style="font-size:15px;">Validator
								1</a><br/>
							<a href="https://jsonlint.com/" target="_blank" style="font-size:15px;">Validator 2</a>
						</div>
					</div>
					<div class="form-group">
						<div class="col-sm-12">
							<label>Iosix Row Parser</label>
							<textarea class="form-control" placeholder="iosix row" id="iosixData" style="height: 80px;">0,3AKNHHDR4KSKA0055,0,0,193514.315,0.000,2230.85,0.00,13.31,05/19/19,16:35:14,42.782276,-74.029510,0,36,10,120,1.1,8008,271</textarea>
						</div>
					</div>
					<div class="form-group">
						<div class="col-sm-12">
							<button onclick="parseIosix($('#iosixData').val())" class="btn btn-default">Parse Iosix
							</button>
							<button onclick="$('#iosixParseData').text('')" class="btn btn-default">Clear</button>
							<div id="iosixParseData"></div>
						</div>
					</div>
				</div>


			</div>
		</div>
		<div class="row">
			<div id="logs_result" class="col-md-12">
				<div id="logs_nav">
					<button id="left_end" class="btn btn-default"><<</button>
					<button id="left" class="btn btn-default"><</button>
					<span id="from"></span>-
					<span id="till"></span>/
					<span id="total"></span>
					<button id="right" class="btn btn-default">></button>
					<button id="right_end" class="btn btn-default">>></button>
					<div class="mobile_block">
						<label>Filter:</label>
						<input type="text" id="filter_search" onkeyup="filterSearch()" class="form-control"
							   style="width:160px;display: inline-block;">
					</div>
					<div class="mobile_block">
						<label>Move to page:</label>
						<input id="moveTo" class="form-control" style="width:160px;display: inline-block;"></select>
					</div>
					<button id="moveToButton" class="btn btn-default">Move</button>
				</div>
				<div id="logs_table">

				</div>
			</div>
		</div>
	</div>
</section>
<script>
	var DEV_ENV = 1;
	var liveViewRunning = false;
	var apiRequest = false;
	var oldLogs = [];
	var oldLogsJson = '';

	function cleaLiveData() {
		$("#logs_table").empty();
	}

	function liveView() {
		if (liveViewRunning) {
			$('#cleaLiveDataBtn').hide();
			if (apiRequest)
				apiRequest.abort();
			liveViewRunning = false;
			$('#liveViewBtn').text('Live Data')
		} else {
			$('#cleaLiveDataBtn').show();
			$("#logs_table").empty();
			$('#liveViewBtn').html('<img style="width:20px;margin-right: 4px;" src="/dash/assets/img/loading-gif.gif"/>Stop Live Data')
			liveViewRunning = true;
			oldLogs = [];
			oldLogsJson = '';
			getLogs();
		}
	}

	function searchClick() {
		$('#logs_table').removeClass();
		startFrom = 0;
		getLogs();
	}

	function getLogs() {
		if (!liveViewRunning) {
			$("#logs_table").empty();
			$('#logs_table').append('<div class="one_log" data-id="0" style="text-align:center;text-align: center;font-size: 15px;height: auto;min-height: auto;">Searching...</div>');
		}
		var data = {
			ip: $("#ip").val(),
			date: $("#date").val(),
			startFrom: startFrom,
			dateFrom: $("#dateFrom").val(),
			dateTill: $("#dateTill").val(),
			userId: $("#userId").val(),
			action_req: $("#action_req").val(),
			platform: $("#platform_req").val(),
			amount: $('#search_amount').val()
		}

		var url = '?request=getLogs';
		$.each(data, function (key, val) {
			if (val != '') {
				url += "&" + key + "=" + val;
			}
		})
		history.pushState({}, "Ezlogz", url);
		if (apiRequest)
			apiRequest.abort();
		apiRequest = AjaxCall({
			url: '/db/apiController/',
			data: data,
			action: 'getApiLogsNew',
			successHandler: showLogsNew
		})
	}

	startFrom = 0;
	totally = 0;

	function showLogsNew(response) {
		var data = response.data;
		totally = data.totally;
		logs = data.logs;
		var fromLog = data.from;
		var till = parseInt(fromLog) + parseInt($('#search_amount').val());
		$('#total').text(totally);
		$('#from').text(fromLog);
		$('#till').text(till);
		$('#logs_nav').show();
		var newLogsJson = JSON.stringify(logs);
		if (liveViewRunning) {
			if (oldLogsJson == newLogsJson) {
				setTimeout(function () {
					getLogs();
				}, 1000)
				return;
			} else {
				$.grep(logs, function (logNew, key) {
					var hasLog = false;
					$.each(oldLogs, function (key2, logOld) {
						if (logOld.id == logNew.id) {
							hasLog = true;
						}
					})
					if (hasLog) {//remove
						return false;
					}
					return true;
				});
			}
			logs.reverse();
		} else {
			$("#logs_table").empty();
			if (logs.length == 0) {
				$('#logs_table').append('<div class="one_log" data-id="0" style="text-align:center;text-align: center;font-size: 15px;height: auto;min-height: auto;">No results</div>');
			}
		}
		oldLogsJson = newLogsJson;
		oldLogs = JSON.parse(newLogsJson);
		$.each(logs, function (key, one_log) {
			$ip = one_log.ip;
			one_log.requestData = one_log.requestData.replace(/\\"/g, '"');
			var req = safelyParseJSON(one_log.requestData)
			if (req) {
				one_log.requestData = JSON.stringify(req, null, 4);
			}
			$requestTime = toTime(one_log.requestDateTime);
			$platform = one_log.platform;
			$action = one_log.action;
			$responseTime = 'No Answer';
			one_log.responseData = String(one_log.responseData);
			if (one_log.responseData != null) {
				one_log.responseData = one_log.responseData.replace(/\\"/g, '"');
				one_log.responseData = one_log.responseData.replace(/\\\\/g, '');
				one_log.responseData = one_log.responseData.replace(/\\"/g, '"');
				one_log.responseData = one_log.responseData.replace(/\\/g, '\\');
				one_log.responseData = one_log.responseData.replace(/\//g, '/');
				var resp = safelyParseJSON(one_log.responseData)
				if (resp) {
					one_log.responseData = JSON.stringify(resp, null, 4);
				}
				$responseTime = toTime(one_log.responseDateTime);
			} else {
				$response = "no response";
			}
			$cookies = one_log.cookies;
			$type = 'App Post request';
			if (one_log.web == 1) {
				$type = 'Web Post request';
			} else if (one_log.web == 2) {
				$type = 'Email sent';
			} else if (one_log.web == 31) {
				$type = 'Visible Push';
			} else if (one_log.web == 32) {
				$type = 'Background Push';
			} else if (one_log.web == 33) {
				$type = 'Web Push';
			} else if (one_log.web == 5) {
				$type = 'FMCSA output file';
			}
			if (one_log.web == 2) {
				$log_append = $('<div class="one_log" data-id="' + one_log.id + '" >\n\
                        <div class="res_ip"><button onclick="expandRow(this)" class="exp_button btn btn-default">Expand</button><label>IP:</label>' + $ip + '<br/><label>UserId:</label>' + one_log.userId + '<br/><label>Platform:</label>' + $platform + '</div>\n\
                        <div class="res_request_time">' + $requestTime + '<br/>' + $action + '<br/>' + $type + '</div>\n\
                        <div class="res_request" style="width:77%;"><pre><div class="buttons_hover"><button onclick="copyJson(this, true)" class="btn btn-default">Copy</button><button onclick="validateJson(this, true)"  class="btn btn-default ml-1">Validator</button></div>' + syntaxHighlight(one_log.requestData) + '</pre><pre>' + $cookies + '</pre></div>\n\
                        </div>')

			} else if (one_log.web == 31 || one_log.web == 32 || one_log.web == 33) {
				$log_append = $('<div class="one_log" data-id="' + one_log.id + '" >\n\
                        <div class="res_ip"><button onclick="expandRow(this)" class="exp_button btn btn-default">Expand</button><label>IP:</label>' + $ip + '<br/><label>UserId:</label>' + one_log.userId + '<br/><label>Platform:</label>' + $platform + '</div>\n\
                        <div class="res_request_time">' + $requestTime + '<br/>' + $action + '<br/>' + $type + '<br/>From: ' + one_log.responseData + '</div>\n\
                        <div class="res_request" style="width:77%;"><pre><div class="buttons_hover"><button onclick="copyJson(this, true)"  class="btn btn-default">Copy</button><button onclick="validateJson(this, true)"  class="btn btn-default ml-1">Validator</button></div>' + syntaxHighlight(one_log.requestData) + '</pre><pre>' + $cookies + '</pre></div>\n\
                        </div>')

			} else {
				$log_append = $('<div class="one_log" data-id="' + one_log.id + '" >\n\
                        <div class="res_ip"><button onclick="expandRow(this)" class="exp_button btn btn-default">Expand</button><label>IP:</label>' + $ip + '<br/><label>UserId:</label>' + one_log.userId + '<br/><label>Platform:</label>' + $platform + '</div>\n\
                        <div class="res_request_time">' + $requestTime + '<br/>' + $action + '<br/>' + $type + '</div>\n\
                        <div class="res_request"><pre><div class="buttons_hover"><button onclick="copyJson(this, true)" class="btn btn-default">Copy</button><button onclick="validateJson(this, true)" class="btn btn-default ml-1">Validator</button></div>' + syntaxHighlight(one_log.requestData) + '</pre><pre>' + $cookies + '</pre></div>\n\
                        <div class="res_response_time">' + $responseTime + '</div>\n\
                        <div class="res_response" onclick=""><pre><div class="buttons_hover"><button onclick="copyJson(this)" class="btn btn-default">Copy</button><button onclick="validateJson(this)" class="btn btn-default ml-1">Validator</button></div>' + syntaxHighlight(one_log.responseData) + '</pre></div>\n\
                        </div>');
			}
			if (liveViewRunning) {
				$('#logs_table').prepend($log_append);
			} else
				$('#logs_table').append($log_append);
		})
		filterSearch()
		if (liveViewRunning) {
			getLogs();
		}
	}

	function switchMobileSection(el) {
		var sectionId = $(el).attr('data-val')
		$('#mobile_switchable > div').removeClass('showMobile');
		$('#' + sectionId).addClass('showMobile')
	}

	function parseIosix(rowData) {
		var pieces = rowData.split(",");
		var result = '';
		result += '<span>Engine:</span> ' + pieces[0] + '<br>';
		result += '<span>VIN:</span> ' + pieces[1] + '<br>';
		result += '<span>RPM:</span> ' + pieces[2] + '<br>';
		result += '<span>Speed:</span> ' + pieces[3] + '<br>';
		result += '<span>Odometer:</span> ' + pieces[4] + '<br>';
		result += '<span>Trip Distance:</span> ' + pieces[5] + '<br>';
		result += '<span>Engine Hours:</span> ' + pieces[6] + '<br>';
		result += '<span>Trip Hours:</span> ' + pieces[7] + '<br>';
		result += '<span>Voltage:</span> ' + pieces[8] + '<br>';
		result += '<span>Date:</span> ' + pieces[9] + '<br>';
		result += '<span>Time:</span> ' + pieces[10] + '<br>';
		result += '<span>Lat:</span> ' + pieces[11] + '<br>';
		result += '<span>Long:</span> ' + pieces[12] + '<br>';
		result += '<span>GPS Speed:</span> ' + pieces[13] + '<br>';
		result += '<span>Course:</span> ' + pieces[14] + '<br>';
		result += '<span>Satellites amt:</span> ' + pieces[15] + '<br>';
		result += '<span>msAlt:</span> ' + pieces[16] + '<br>';
		result += '<span>dop:</span> ' + pieces[17] + '<br>';
		result += '<span>Row counter:</span> ' + pieces[18] + '<br>';
		result += '<span>Version:</span> ' + pieces[19];
		c(pieces);
		$('#iosixParseData').html(result)
	}

	function filterSearch() {
		if ($('.res_request').length > 0) {// if logs
			var vl = $('#filter_search').val().toLowerCase();
			$('.one_log').show();
			if (vl != '') {
				$.each(logs, function (key, one_log) {
					if (!one_log.requestData.toLowerCase().includes(vl) && (one_log.responseData == null || !one_log.responseData.toLowerCase().includes(vl))) {
						$('.one_log[data-id="' + one_log.id + '"]').hide();
					}
				})
			}
		}
	}

	function selectAction(el) {
		var per = $(el).closest('.col-sm-12');
		per.find('input').val($(el).text())
		per.find('textarea').val($(el).text())
		$('.list_box').remove();
	}

	function checkReqActions(el) {
		var per = $(el).closest('.col-sm-12');
		var vl = $(el).val().toLowerCase();
		$('.list_box').remove();
		if (vl != '') {
			per.append('<div class="list_box"></div>')
			$.each(apiss, function (key, item) {
				if (item.name.toLowerCase().includes(vl)) {
					$('.list_box').append('<p onclick="selectAction(this)">' + item.name + '</p>')
				}
			});
			if ($('.list_box p').length == 0) {
				$('.list_box').append('<p class="no_click">No actions Found</p>')
			}
		}
	}

	var SITECOOKIES = '<?= SITECOOKIES ?>';
	var ZZsession = '<?= $ZZsession ?>';
	data = {};
	apis = <?= json_encode($apis) ?>;
	apisObj = {};
	apis.forEach(function (item) {
		var example = (item.example);
		apisObj[item.id] = {
			name: example.slice(example.indexOf('action') + 8, example.indexOf(',')).replace(/["'':]/g, ""),
			example: example.slice(example.indexOf('data') + 5, example.indexOf('}') + 1).replace(/:{/g, "{")
		};
	});
	apiss = {
		5: {
			name: 'logIn',
			example: '{"email": "test@test.com", "pass": "somepassword","dId": "asdwqeqwasd", "provider": "password"}'
		},
		6: {
			name: 'registration',
			example: '{"email": "test@test.com",  "pass": "somepassword", "phone": 12312321, "firstName": "Vlad", "lastName": "Topolsky"}'
		},
		7: {name: 'searchIfCarrierExistByUsdot', example: '{"usdot": 44110}'},
		8: {
			name: 'testPush',
			example: '{"cloudId": "123","action": "signOut","title": "qwe","message": "mes","androidVersion": "1","iosVersion":"1"}'
		},
		9: {
			name: 'setCarrier',
			example: '{"name": "testCarrier", "usdot":44110, "mainOffice": {"address": "SomeStreet" 43, "city": "Portland", "state": 12, "zip": 12345}'
		},
		10: {name: 'leaveFleet', example: '{}'},
		11: {name: 'joinCarrier', example: '{"id": 123}'},
		12: {name: 'updateLogbookRules', example: '{"cycle": {"id":1}}'},
		13: {
			name: 'createStatus', example: '{"time": "2015-12-05 05:10:20", "statusTypeId": 1, "note": "it was a good day", "documents":[12, 13], \n\
                    "location"{"lat": 30.21268333491144,  "long": -91.9906297962341,  "locationName": "Dallas, TX, "}'
		},
		14: {
			name: 'editStatus', example: '{"id": 123, "time": "2015-12-05 05:10:20", "statusTypeId": 1, "note": "it was a good day", "documents":[12, 13],\n\
                    "location"{"lat": 30.21268333491144,  "long": -91.9906297962341,  "locationName": "Dallas, TX, "}'
		},
		15: {name: 'deleteStatus', example: '{"id": 123}'},
		16: {name: 'sendMessage', example: '{"toId": 123, "message": "how are you?"}'},
		17: {name: 'checkMessages', example: '{"dateTime": "2015-10-09 16:23:26"}'},
		18: {
			name: 'updateUser',
			example: '{"phone": 123123, "firstName": "John", "lastName": "Doe", "type": "Driver"}'
		},
		19: {
			name: 'createRemark', example: '{ "time": "2015-12-05 05:10:20", "remarkTypeId": 1, "remarkTypeName": "Vehicle inspection", "note": "it was a good day",\n\
                    "location"{  "lat": 30.21268333491144,  "long": -91.9906297962341,  "locationName": "Dallas, TX,"}'
		},
		20: {
			name: 'editRemark', example: '{ "id":123, "time": "2015-12-05 05:10:20", "remarkTypeId": 1, "remarkTypeName": "Vehicle inspection," "note": "it was a good day",\n\
                    "location"{  "lat": 30.21268333491144,  "long": -91.9906297962341,  "locationName": "Dallas, TX,"}'
		},
		21: {name: 'deleteRemark', example: '{"id": 123}'},
		22: {name: 'sendLogbookData', example: '{"date":"2015-12-05", "shippingDocs":[{"id":5}"]}'},
		23: {
			name: 'DVIR', example: '{"date": "2015-12-05", "trucks": [  {   "id":5,   "location": "somewhere",   "time": 15:05:32,   "odometer": 123,\n\
                    "note": "something to say",   "signature": 12321,   "mechanicSignatureId": 12332,   "defects":[{"id":12}"}'
		},
		24: {
			name: 'sendDocument', example: '{"imageArray": "imageArrayFormat", "date": "2015-12-05 05:10:20", "type": 1, "truckId": 22,\n\
                    "price": 123, "gallons": 22, "note": "it was a good day"}'
		},
		25: {name: 'resetPassword', example: '{"email": "test@test".com}'},
		26: {name: 'uploadSignature', example: '{"imageArray": "imageArrayFormat", "useAsMain": 1}'},
		27: {name: 'getSignatureNamebyId', example: '{"id": 123}'},
		28: {name: 'createTruck', example: '{"name": "truck3545"}'},
		29: {name: 'createTrailer', example: '{"name": truck3545}'},
		30: {name: 'deleteDocument', example: '{"id": 123}'},
		31: {
			name: 'editDocument', example: '"id": 123, "imageArray": "imageArrayFormat", "date": "2015-12-05 05:10:20", "type": 1,\n\
                    "truckId": 22, "price": 123, "gallons": 22, "note": "it was a good day"'
		},
		32: {name: 'checkIfDocumentExists', example: '{"eqId": 343, "docTypeId": 1}'},
		33: {name: 'getPlacesRating', example: '{"placesId": [  {"id":123}, {"id":124}, {"id":125} ]}'},
		34: {name: 'getPlaceReviews', example: '{"placeId": 123}'},
		35: {name: 'addPlaceReview', example: '{"placeId": 132, "message": "its is a good place", "rating": 4}'},
		36: {name: 'addWSStatus', example: '{"id": 123, "status": 0}'},
		37: {name: 'addParkingStatus', example: '{"id": 123, "status": 0}'},
		38: {name: 'getWSStatuses', example: '{"ids": [  {"id":123}, {"id":124}, {"id":125} ]}'},
		39: {name: 'getParkingStatus', example: '{"id": "getParkingStatus"}'},
		40: {
			name: 'suggestionAddPlace', example: '{"name": "Burget Parking", "type": 12, "ln": 90.123123, "lt": -90.123123,\n\
                    "address": "Portland OR SomeStreet 43", "note": "Cool parking place,"}'
		},
		41: {
			name: 'suggestionEditPlace', example: '{ "id": 123, "groupId": 12, "title": parking lot, "active": 1, "lt": 90.164488, "ln": -90.123123,\n\
                    "state": "OR", "city": "Portland", "address": "SomeStreet 43", "zip": 22222, "phone": +3868118131265, "fax": +3868118131265, "highway": "H32",\n\
                    "ext": 433, "web": "parkingLot.com", "rating": 4, "scale": 1, "shower": 1, "wifi": 0, "atm": 1, "bulk": 1, "tire": 1, "transFE": 1, "RVDump": 1,\n\
                    "overNP": 1, "trParkSp": 1, "workingTime": "10 - 22", "note": "wi-fi not working here"}'
		},
		42: {
			name: 'sendInspectionEmail', example: '{"email": "test@test.com," "dates":[{"date":"2016-02-25"},{"date":"2016-02-26"}],\n\
                    "print_settings":{  "incl_recap":1,  "incl_dvir":1,  "same_page":1,  "incl_odometer":1,  "incl_docs":1 }}'
		},
		43: {
			name: 'generateInspectionPDF', example: '{"dates":[{"date":"2016-02-25"},{"date":"2016-02-26"}],\n\
                    "print_settings":{  "incl_recap":1,  "incl_dvir":1,  "same_page":1,  "incl_odometer":1,  "incl_docs":1 }'
		},
		44: {name: 'addDocToStatus', example: '{"statusId": 322, "docId": 11}'},
		45: {name: 'removeDocFromStatus', example: '{"connectionId": 332}'},
		49: {name: 'choseTruck', example: '{"id": 123}'},
		50: {name: 'choseTrailers', example: '{"trailers": [  "id":123,  "id":222 ]}'},
		51: {name: 'shareReview', example: '{ "stars" 5,  "message": "great app"}'},
		52: {name: 'createTruckSynch', example: '{ "name": "truck3545", "id": "-123"}'},
		53: {name: 'createTrailerSynch', example: '{"name": "truck3545", "id": "-123"}'},
		54: {
			name: 'synchroniseDays', example: '{"days":[  {"2016-14-11":{ "statuses":[\n\
                    {   "id": 12312,   "time": "2016-14-11 13:30:00 ",   "statusTypeId": 1,   "location": {    "lat": 12.35258333291134,    "long": -51.9406197952141, \n\
                    "locationName": "New York, TX"   },   "documents":[12, 13],   "note": "I stopped for a launch"  },\n\
                    {   "id": 23322,   "time": "2016-14-11 12:20:00 ",   "statusTypeId": 0,   "location": {    "lat": 30.21268333491144,    "long": -91.9906297962341,\n\
                      "locationName": "Dallas, TX"   },   "documents":[],   "note": "I stopped for a launch"  } ],\n\
                   "logInfo":{  "distances": [   {    "state":3,    "truck": 123,    "distance":200   },   {    "state":12,    "truck": 123,    "distance":200   }  ],\n\
                    "shipping Docs": [{"id":123}, {"id":223}],   "coDrivers":"John Doe",  "trucks": [{"id":123}, {"id":223}],   "trailers": [{"id":123}, {"id":223}],\n\
                    "officeAddress:": {   "address": "office address",   "city": "city",   "state": 10,   "zip": "zip"  },\n\
                    "homeTerminal:": {   "address": "office address",   "city": "city",   "state": 12,   "zip": "zip"  },\n\
                    "from": "IN",   "to": "WA",   "carrierName": "eqweqw",  "notes":"asdasd",  "signature": 1232  },\n\
                   "dvir":{  {   "id":124,   "truck":13,   "location":"Portland",   "time":"15:05:32",   "odometer":"432",   "note": "blabla",   "signature": 1232,\n\
                     "mechanicSignatureId":123,   "defects":[    {"id":12},    {"id":32}   ],\n\
                     "trailers":{    "ids":[     {id:12},     {id:32}    ],    "defects":[     {"id":50},     {"id":43}    ]   }  } },\n\
                   "remarks":[  {   "id":1232,   "time": "2016-14-11 13:45:00",   "remarkTypeId": 0,   "location": {    "lat": 12.35258333291134,\n\
                      "long": -51.9406197952141,    "locationName": "Dallas, TX"   },   "note": "I was inspected by officer"  } ] }  }]}'
		},
		55: {name: 'sendDocEmail', example: '{"email":"blaba@bal.com",  "documents":[{"id":10},{"id":15}]}'},
		56: {
			name: 'createEldTruck', example: '{"name": "truck3545", "odometer": 123123.112, "vin": "V213123V2134321",\n\
                    "protocol": 1, "bluetoothId":"dad12321", "id": "-123"}'
		},
		59: {
			name: 'appUserInfoSave', example: '{"field":"Route", "value":[ { "waypointsCount": 0, "waypoints": [], \n\
                    "startPoint": { "lat": "40.71", "long": "-74" }, "name": "test", "waypointsNames": [], "endPoint": { "lat": "37.77", "long": "-122.41" } }, \n\
                    { "waypointsCount": 0, "waypoints": [], "startPoint": { "lat": 34.2498501, "long": -119.1597182 }, "name": "test 2", "waypointsNames": [], \n\
                    "endPoint": { "lat": 32.7996566, "long": -117.1294072 } } ] }}'
		},
		60: {name: 'GetUserSocGroups', example: '{}'},
		62: {
			name: 'editSocGroup',
			example: '{ "id": 2, "name": "name", "thumb": "link", "image": "link", "description": "description" } '
		},
		63: {
			name: 'createSocGroup',
			example: '{"name": "name", "thumb": "link", "image": "link", "description": "description"}'
		},
		64: {name: 'JoinSocGroup', example: '{"id":12}'},
		65: {name: 'LeaveSocGroup', example: '{}'},
		66: {name: 'GetSocGroupFeed', example: '{"id":15}'},
		67: {name: 'GetSocGroupFeed', example: '{"id":15}'},
		69: {name: 'AddSocGroupPost', example: '{"id","message":"message"}'},
		70: {name: 'sendOutputFileToFmcsaServer', example: '{"outputFileComment":"message"}'},
		71: {name: 'pullDeviceDebugLogs', example: '{}'}
	};

	function createCookie(name, value, days) {
		var expires;
		if (days) {
			var date = new Date();
			date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
			expires = "; expires=" + date.toGMTString();
		} else {
			expires = "";
		}
		document.cookie = encodeURIComponent(name) + "=" + value + expires + ";path=/";
	}

	function eraseCookie(name) {
		createCookie(name, "", -1);
	}

	function getUploadFile(input) {
		if (input.files && input.files[0]) {
			if (input.files[0].size > 200000000) {
				return false;
			}
			var file = input.files[0],
				reader = new FileReader();
			reader.onload = function (e) {
				if (input.files[0].type.includes("image")) {
					z = JSON.stringify([{bytesArray: e.target.result, fileName: file.name}]);
					data = {
						action: 'createSocGroup',
						data: {
							name: "ABC",
							description: "decs",
							tags: 'ttt',
							thumb: z,
							image: z

						}
						//
					};
				} else if (input.files[0].type.includes("video")) {

				}
				$("#file-upload-task").val('');
			};
			reader.readAsDataURL(input.files[0]);
		}
	}

	function expandRow(el) {
		$(el).attr('onclick', 'smallRow(this)');
		$(el).text('Narrow')
		$(el).closest('.one_log').addClass('expanded')
	}

	function smallRow(el) {
		$(el).attr('onclick', 'expandRow(this)');
		$(el).text('Expand')
		$(el).closest('.one_log').removeClass('expanded')
	}

	function validateJson(el, req = false) {
		var id = $(el).closest('.one_log').attr('data-id');
		$.each(logs, function (key, one_log) {
			if (one_log.id == id) {
				if (req) {
					window.open('https://jsonlint.com/?json=' + one_log.requestData, '_blank');
				} else {
					window.open('https://jsonlint.com/?json=' + one_log.responseData, '_blank');
				}
			}
		})
	}

	function copy(text) {
		var input = document.createElement('input');
		input.setAttribute('value', text);
		document.body.appendChild(input);
		input.select();
		var result = document.execCommand('copy');
		document.body.removeChild(input)
		return result;
	}

	function copyJson(el, req = false) {
		var id = $(el).closest('.one_log').attr('data-id');
		$.each(logs, function (key, one_log) {
			if (one_log.id == id) {
				if (req) {
					copy(one_log.requestData);
				} else {
					copy(one_log.responseData);
				}
			}
		})
	}

	function safelyParseJSON(json) {
		// This function cannot be optimised, it's best to
		// keep it small!
		var parsed

		try {
			parsed = JSON.parse(json)
		} catch (e) {
			return false
		}

		return parsed // Could be undefined!
	}

	function syntaxHighlight(json) {
		if (json == null) {
			return '';
		}
		json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
		return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
			var cls = 'number';
			if (/^"/.test(match)) {
				if (/:$/.test(match)) {
					cls = 'key';
				} else {
					cls = 'string';
				}
			} else if (/true|false/.test(match)) {
				cls = 'boolean';
			} else if (/null/.test(match)) {
				cls = 'null';
			}
			return '<span class="' + cls + '">' + match + '</span>';
		});
	}

	function initUrl() {
		var searchParams = new URL(window.location.href).searchParams;
		if (searchParams.get("request")) {
			if (searchParams.get("request") == 'getLogs') {
				$("#ip").val(searchParams.get("ip") ? searchParams.get("ip") : '');
				$("#date").val(searchParams.get("date") ? searchParams.get("date") : '');
				$("#dateFrom").val(searchParams.get("dateFrom") ? searchParams.get("dateFrom") : '');
				$("#dateTill").val(searchParams.get("dateTill") ? searchParams.get("dateTill") : '');
				$("#userId").val(searchParams.get("userId") ? searchParams.get("userId") : '');
				$("#action_req").val(searchParams.get("action_req") ? searchParams.get("action_req") : '');
				$("#platform_req").val(searchParams.get("platform") ? searchParams.get("platform") : '');
				$("#search_amount").val(searchParams.get("amount") ? parseInt(searchParams.get("amount")) : '');
				getLogs();
			} else if (searchParams.get("request") == 'getEldLogs') {
				eldUserId = searchParams.get("userId");
				$('#search_user').val(eldUserId)
				showLogs()
			}
		}

	}

	function getPushLogs() {
		data = {
			date: $("#date").val(),
			startFrom: startFrom,
			dateFrom: $("#dateFrom").val(),
			dateTill: $("#dateTill").val(),
			userId: $("#userId").val(),
			action: $("#action_req").val()

		};
		AjaxCall({url: '/db/apiController/', data: data, action: 'getPushLogs', successHandler: showPushLogs})
	}

	function showPushLogs(response) {
		var logsInfo = response.data;
		var logsArr = logsInfo.logs;
		fromLog = logsInfo.from;
		totally = logsInfo.totally;
		logsRows = '';

		logsRows = logsArr.map(item => getOnePushLogRow(item));
		$('#total').text(totally);
		$('#from').text(fromLog);
		$('#till').text(parseInt(fromLog) + 50);
		$('#logs_nav').show();
		$('#logs_table').empty().append(logsRows);
	}

	function getOnePushLogRow(notification) {
		return `<div class="one_log">
                    <div class="res_ip"><button onclick="expandRow(this)" class="exp_button">Expand</button>Id: ${notification.id}</div>
                    <div class="res_request_time">${toTime(notification.dateTime)}</div>
                    <div class="action">From Id: ${notification.fromId}</div>
                    <div class="action">To Id: ${notification.toId}</div>
                    <div class="action">${getPushNotificationTypeById(notification.type)}</div>
                    <div class="action">${notification.action}</div>
                    <div class="res_response" style="width: 55%"><pre>${notification.data}</pre></div>
                    
                </div>`;
	}

	function getPushNotificationTypeById(pushNotificationTypeId) {
		var value = '';

		switch (Number(pushNotificationTypeId)) {
			case 1:
				value = 'visible';
				break;
			case 2:
				value = 'background';
				break;
			case 3:
				value = 'web';
				break;
		}
		return value;
	}

	function getPlatfornById(platformId) {
		var value = '';

		switch (Number(platformId)) {
			case 0:
				value = 'App';
				break;
			case 1:
				value = 'Web';
				break;
			case 2:
				value = 'Push';
				break;
		}
		return value;
	}

	function getLogsStatisticsByDate() {
		var data = {
			date: $("#logsStatisticsDate").val()
		};
		AjaxCall({
			url: '/db/apiController/',
			data: data,
			action: 'getLogsStatisticsByDate',
			successHandler: getLogsStatisticsByDateHandler
		})
	}

	function getLogsStatisticsByDateHandler(response) {
		var logsArr = response.data.map((item) => {
			return `<div class="one_log small">
                        <div class="platform">${getPlatfornById(item.platform)}</div>
                        <div class="action" style="width:20%">${item.action}</div>
                        <div class="res_response_time">${item.amount}</div>
                    </div>`;
		});
		$("#logs_nav").hide();
		$('#logs_table').empty().append(logsArr);
	}

	function toTime(secs) {
		var date = new Date(1970, 0, 1); // Epoch
		date.setSeconds(secs);
		var hours = date.getHours();
		var minutes = date.getMinutes();
		var sec = date.getSeconds();
		/*var ampm = hours >= 12 ? 'pm' : 'am';
         hours = hours % 12;*/
		hours = hours < 24 ? hours : 0; // the hour '0' should be '12'

		minutes = minutes < 10 ? '0' + minutes : minutes;
		sec = sec < 10 ? '0' + sec : sec;
		var day = date.getDate();
		var month = date.getMonth() + 1;
		var year = date.getFullYear();
		var strTime = year + '-' + month + '-' + day + ' ' + hours + ':' + minutes + ':' + sec;
		return strTime;
	}

	var eldUserId = 0;

	function selectEldUser(el) {
		eldUserId = $(el).attr('data-id');
		session = $(el).attr('data-session');
		$('#sessionId').val(session);
		$('#userId').val(eldUserId)
		$('#search_user').val($(el).text());
		$('#search_user_results').hide();

	}

	function deleteRow(el) {
		var id = $(el).closest('.one_log').attr('data-id');
		AjaxCall({
			url: '/db/apiController/', data: {id: id}, action: 'deleteEldLogs', successHandler: function (response) {
				$(el).closest('.one_log').remove()
			}
		})
	}

	function showLogs() {
		$('#logs_table').append('<div class="one_log" data-id="0" style="text-align:center;text-align: center;font-size: 15px;height: auto;min-height: auto;">Searching...</div>');
		if (eldUserId != '') {
			var url = '?request=getEldLogs';
			url += "&userId=" + eldUserId;
		}
		history.pushState({}, "Ezlogz", url);
		AjaxCall({
			url: '/db/apiController/',
			data: {userId: eldUserId},
			action: 'getEldLogs',
			successHandler: getEldLogsHandler
		})
	}

	function getEldLogsHandler(response) {
		var logs = response.data;
		$('#logs_table').empty();
		var lineBreak = "\n";
		$.each(logs, function (key, log) {
			log.logs = log.logs.split(lineBreak).reverse().join(lineBreak);
			$('#logs_table').append(`<div class="one_log eld_log" data-id="${log.id}"><button onclick="expandRow(this)" class="exp_button">Expand</button><button onclick="deleteRow(this)" class="del_button">Delete</button><pre><label>${log.dateTime}</label><br>${log.logs}</pre></div>`)
		})
		if (logs.length == 0) {
			$('#logs_table').append('<div class="one_log" data-id="0" style="text-align:center;text-align: center;font-size: 15px;height: auto;min-height: auto;">No results</div>');
		}
	}

	function getUsers() {
		var val = $('#search_user').val();
		if (val == '') {
			$('#search_user_results').empty();
			$('#search_user_results').hide();
			return false;
		}
		AjaxCall({
			url: '/db/apiController/',
			data: {name: val},
			action: 'getUsersByName',
			successHandler: getUsersByNameHandler
		})
	}

	function getUsersByNameHandler(response) {
		var users = response.data;
		$('#search_user_results').empty();
		$.each(users, function (key, user) {
			$('#search_user_results').append(`<p data-id="${user.id}" data-session="${user.sessionId}" onclick="selectEldUser(this)">${user.name} ${user.last}(${user.email}, ${user.id})</p>`)
		})
		$('#search_user_results').show();
	}

	$().ready(function () {
		$.each(apiss, function (key, item) {
			$('#examplesBox').append('<div class="oneApiBox pl-1 pr-1" data-id="' + key + '">' + item.name + '</div>')
		})
		$(document).click(function (event) {
			if (!$(event.target).closest('.list_box').length) {
				$('.list_box').remove()
			}
		});
		$('.oneApiBox').click(function () {
			$('.oneApiBox').removeClass('active');
			$(this).addClass('active');
			$('#action').val(apiss[$(this).attr('data-id')].name);
			$('#dataJson').text(apiss[$(this).attr('data-id')].example);
		});
		$('body').on('change', '#file-upload-task', function () {
			getUploadFile(this);
		});
		$("#testRequest").click(function () {
			$("#logs_table").empty();
			if ($("#sessionId").val() == "") {
				eraseCookie("PHPSESSID");
			} else {
				createCookie('PHPSESSID', $("#sessionId").val(), 30);
			}
			var data = {
				action: $("#action").val(),
				data: JSON.parse($("#dataJson").val())
			};
			$.ajax({
				url: '/db/appController/',
				method: "POST",
				contentType: "application/json", // send as JSON
				data: JSON.stringify(data),
				success: function (data) {
					var response = jQuery.parseJSON(data);
					var incoming = '';
					if (response.incoming != undefined && response.incoming != '') {
						incoming = JSON.stringify(JSON.parse(response.incoming), undefined, 2);
					}
					var append = '<table id="request_response_table">\
                                <tbody>\
                                    <tr>\
                                        <th>Code</th>\
                                        <td>' + response.code + '</td>\
                                    </tr>\
                                    <tr>\
                                        <th>Message</th>\
                                        <td>' + response.message + '</td>\
                                    </tr>\
                                    <tr>\
                                        <th>Incoming</th>\
                                        <td><pre>' + incoming + '</pre></td>\
                                    </tr>\
                                    <tr>\
                                        <th>Data</th>\
                                        <td><pre>' + JSON.stringify(response.data, undefined, 2) + '</pre></td>\
                                    </tr>';
					if ($('#withChek:checked').length > 0) {
						append += '<tr><th>Check</th><td><pre>' + JSON.stringify(response.check) + '</pre></td></tr>';
					}
					append += '</tbody>\
                            </table>';
					$("#logs_table").html(append);

				}
			})
		})

		$(".datetimepicker").datetimepicker({
			datepicker: false,
			dateFormat: '',
			timeFormat: "HH:mm:ss",
			timeOnly: true
		});
		$(".datepicker").datepicker({dateFormat: 'yy-mm-dd'}).datepicker("setDate", new Date());


		$('#showLogsStatistics').click(() => $('#logsStatisticsDate').datepicker('show'));
		$('#logsStatisticsDate').change(() => getLogsStatisticsByDate());
		$('#showPushLogs').click(() => {
			$('#logs_table').removeClass().addClass('pushLogs');
			startFrom = 0;
			getPushLogs();
		});

		$("#right").click(function () {
			startFrom += parseInt($('#search_amount').val());
			if (startFrom > totally) {
				startFrom -= parseInt($('#search_amount').val());
				return false;
			}
			if ($('#logs_table').hasClass('pushLogs')) {
				getPushLogs();
			} else {
				getLogs();
			}
		})
		$("#left").click(function () {
			startFrom -= parseInt($('#search_amount').val());
			if (startFrom < 0) {
				startFrom += parseInt($('#search_amount').val());
				return false;
			}
			getLogs();
		})
		$("#left_end").click(function () {
			startFrom = 0;
			getLogs();
		})

		$("#right_end").click(function () {
			startFrom = Math.floor(totally / $('#search_amount').val()) * $('#search_amount').val();
			getLogs();
		})
		$("#moveToButton").click(function () {
			startFrom = $('#moveTo').val() * $('#search_amount').val();
			getLogs();
		})

		$('#mobile_switcher_block .active').click();
		initUrl();
	})
</script>
</body>
</html>
