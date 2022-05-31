var local = true;

function showEmployeeLogbook(el){
	var data = {date: emplDate};
	data.timeZoneOffset = emplTimeZoneOffset*60;
	if(typeof getUserId != 'undefined'){
		data.userId = getUserId;
	}
	
	AjaxController('getEmployeeLogbook', data, adminUrl, 'getEmployeeLogbookHandler', errorBasicHandler, true);
}
function svgEl(tagName) {
    return document.createElementNS("http://www.w3.org/2000/svg", tagName);
}
function getEmployeeLogbook(date = ''){
	if(date == ''){
		var d = new Date();
		var curr_date = d.getDate();
		var curr_month = d.getMonth() + 1; //Months are zero based
		var curr_year = d.getFullYear();
		var pad = "00";
		var curr_month = (pad+curr_month).slice(-pad.length);
		var curr_date = (pad+curr_date).slice(-pad.length);
		date = curr_year + "-" + curr_month + "-" + curr_date;
	}
	if(typeof getUserId != 'undefined'){
		var data = {date: date, userId:getUserId};
	}else{
		var data = {date: date};
	}
	emplDate = date;
	AjaxController('getEmployeeLogbook', data, adminUrl, 'getEmployeeLogbookHandler', errorBasicHandler, true);
}  
emplDateData = {};

function getEmployeeLogbookHandler(response){
	Date.prototype.stdTimezoneOffset = function () {
		var jan = new Date(this.getFullYear(), 0, 1);
		var jul = new Date(this.getFullYear(), 6, 1);
		return Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
	}

	Date.prototype.isDstObserved = function () {
		return this.getTimezoneOffset() < this.stdTimezoneOffset();
	}

	var today = new Date();
	var todaysDay = false;
	var logDay = new Date(response.data.date).getTime() + new Date(response.data.date).getTimezoneOffset()*60*1000;
	logDay = new Date(logDay);
	if(today.setHours(0,0,0,0) == logDay.setHours(0,0,0,0)){
		todaysDay = true;
	}
	if(todaysDay){
		emplTimeZoneOffset = (new Date().isDstObserved() ? response.data.employeeTzInfo.valueSave : response.data.employeeTzInfo.value)*(60);
	}else{
		emplTimeZoneOffset = (logDay.isDstObserved() ? response.data.employeeTzInfo.valueSave : response.data.employeeTzInfo.value)*(60);
	}
	
	var fullOffset = (logDay.getTimezoneOffset()+emplTimeZoneOffset)*60*1000
	svg = document.getElementById("logBook");
	var data = response.data;
	emplDateData = data;
	var statuses = data.statuses;
	var date = data.date;
	
	var d = new Date(data.date);
	d.setTime( d.getTime() +fullOffset );
	d.setHours(0,0,0,0);
	
	/*d = new Date(d.valueOf() + d.getTimezoneOffset() * 60000 );
	d.setHours(0,0,0,0);*/
	var curr_date = d.getDate();
	var curr_month = d.getMonth() + 1; //Months are zero based
	var curr_year = d.getFullYear();
	var pad = "00";
	var curr_month = (pad+curr_month).slice(-pad.length);
	var curr_date = (pad+curr_date).slice(-pad.length);
	var date = curr_year + "-" + curr_month + "-" + curr_date + ' 00:00:00';
	var points = [];
	var totWorked = 0;
	$('#full_day_report').empty();
	$('#tot_worked').text('0');
	$('#log_list tbody').empty();
	var d1 = new Date();
	var todaysDate = new Date(d1.valueOf() + fullOffset);
        var statusesCount = statuses.length;
        
	for(var x = 0; x < statusesCount; x++){
		var st = statuses[x];//get status
		var duration = 24*60*60;
                var secThis = 0;
                var secNext = 24 * 60 * 60;
                var dt = st.time;//get dateTime
		var diff = d - dt;//check if status is for today
                var stTime = moment(st.time*1000).format(SQLDATETIMEFORMAT);
                if (x == 0) {//if first
                    stTime = moment(data.date, SQLDATEFORMAT).format(SQLDATETIMEFORMAT);
                }
		if (statusesCount == x + 1 && todaysDay) {//if last and today, till now
                    secNext = getSecondsFromDateTimeString(moment(todaysDate).format(SQLDATETIMEFORMAT));
                    if (x != 0) {//not first
                        secThis = getSecondsFromDateTimeString(moment(dt*1000).format(SQLDATETIMEFORMAT));
                    }
                } else if (x == 0 && statusesCount == x + 1) {//if first and last
                    secThis = 0;
                    secNext = 24 * 60 * 60;
                    if (diff > 0) {//if its earlier -then its previous day
                        dt = date;//set to beginning of the day
                    }
                    
                } else if (x == 0) {//if first
                    secThis = 0;
                    secNext = getSecondsFromDateTimeString(moment(statuses[x + 1].time*1000).format(SQLDATETIMEFORMAT));
                } else if (statusesCount == x + 1) {//if its the last status
                    secNext = 24 * 60 * 60;
                    secThis = getSecondsFromDateTimeString(moment(dt*1000).format(SQLDATETIMEFORMAT));
                } else {
                    var dt2 = statuses[x + 1].dateTime;//get dateTime of the next status
                    secNext = statuses[x + 1].time;
                    secThis = dt;
                }
                duration = secNext - secThis;
		if(duration > 24*60*60) duration = 24*60*60;
		if(duration < 0) duration = 0;
		if(st.statusId == 1)
		totWorked+=parseInt(duration);
		duration = getDurationFromSec(duration, false, true);
		var point = {
			status:st.statusId,
			time:stTime,
			duration:duration, 
			message:st.note
		};
		points.push(point);
		addEmplStatusToList(st,x, stTime, duration);
		if(st.statusId == 1)
		$('#full_day_report').append('<span>('+stTime.slice(-8)+')'+st.note.replace(/\r\n|\r|\n/g,"<br />")+'<br><span/>');
		
	}
	$('#tot_worked').text(getDurationFromSec(totWorked))
	$('#log_book').find('.working_line').remove();
	var previousChanged = false;
	var previousStartH = 'a';
	var previousStartM = '';
	var hours = [];
	for(var x = 0; x < points.length; x++){
            var point = points[x];
            point.time = point.time.slice(-8)
            point.hours = parseInt(point.time.slice(0, 2));
            point.mins = parseInt(point.time.slice(3, 5));
            point.seconds = parseInt(point.time.slice(6, 8));
            point.startP = point.mins;

            if(previousStartH == 'a'){
                previousStartH = point.hours;
                previousStartM = point.mins;
            }else{
                if(previousStartH == point.hours && previousStartM == point.mins){
                    points.splice(x-1, 1);
                    x--;
                }
                previousStartH = point.hours;
                previousStartM = point.startP;
            }
		
	}
	for(var x = 0; x < points.length; x++){
            var point = points[x];
            if(x == 0){
                point.start = true;
            }
            point.hours = parseInt(point.time.slice(0, 2));
            point.mins = parseInt(point.time.slice(3, 5));
            point.startP = point.mins;
            var durations = point.duration.split(" ");
            durations[0] = durations[0].replace(/\D/g,'');
            durations[1] = durations[1].replace(/\D/g,'');
            durations[2] = durations[2].replace(/\D/g,'');

            point.durationH = durations[0]/1;
            point.durationM = durations[1];
            point.durationS = durations[2];
	}
	var hours = {0:0,1:0}
	for(var x = 0; x < points.length; x++){
            var point = points[x];
            addLogBookEmplPoint(points[x])
            if(x != 0){
                gLineEmpl(points[x-1], point);
            }
            hours[point.status]+=parseInt(point.durationH*60*60) + parseInt(point.durationM*60) + parseInt(point.durationS);
	}
	setLogEmplTime('hours_off', hours[0]); 
	setLogEmplTime('hours_work', hours[1]);
}
function getSecondsFromDateTimeString(dateTime) {
    var duration = parseInt(dateTime.substr(17, 2)) + parseInt(dateTime.substr(14, 2)) * 60 + parseInt(dateTime.substr(11, 2)) * 60 * 60;
    return duration;
}
function addEmplStatusToList(st, x, stTime, duration){ c('addEmplStatusToList');
	x++;
	var editRow = '';
	if(typeof getUserId == 'undefined') {
		if(st.id != 0 && st.statusId == 1 && window.location.href == MAIN_LINK+'/dash/'){
			editRow = `<td><button class="edit_empl_status employeeButton" data-id="${st.id}">Edit</button></td>`;
		}else{
			editRow = '<td></td>';
		}
            } else {
                if(st.id != 0 && st.statusId == 1){
			editRow = `<td><button class="employeeButton" data-id="${st.id}" onclick="changeStatusTime(this);">Change Time</button></td>`;
		}else{
			editRow = '<td></td>';
		}
            }
		st.note = st.note == null ? '' : st.note;
	$('#log_list tbody').append(`<tr>
		<td>${x}</td>
		<td>${getEmplStatusFromId(st.statusId)}</td>
		<td>${stTime.slice(-8)}</td>
		<td>${duration}</td>
		<td>${st.note.replace(/\r\n|\r|\n/g,"<br />")}</td>
		${editRow}
	</tr>`);
}
function changeStatusTime(el){
    var element = $(el);
    var day = $('#add_new_status').attr('data-day');
    var statusId = element.attr('data-id');
    var userId = $('select.employee option:selected').val();
    
    var data = {};
    data.statusId = statusId;
    data.userId = userId;
    data.day = day;
    
    AjaxController('getEmployeeStatusById', data, adminUrl, 'changeStatusTimeHandler', errorBasicHandler, true);
}
function changeStatusTimeHandler(response){
    c(response);
    var data = response.data;
    var header = 'Edit Status';
    var content = `
                    <div class="employeeControl">
                        <label>From:</label>
                        <input type="text" class="timeFromTo" id="time_from" data-id="${data.status.id}" />
                    </div>
                    <div class="employeeControl">
                        <label>To:</label>
                        <input type="text" class="timeFromTo" id="time_to" data-id="${data.next_status.id}" />
                    </div>
                    <div class="employeeControlButton">
                        <button class="btn btn-default" data-dismiss="modal">Cancel</button>
                        <button class="btn btn-default time_save" data-datetime="${data.status.dateTime}" onclick="saveChangesStatus(this);">Save</button>
                    </div>`;
    showModal(header, content, 'saveChangesStatus');
    
    addTimeControlEmpl(setRange);
    
    $('#time_from').timeEntry('setTime', new Date(data.status.dateTime));
    $('#time_to').timeEntry('setTime', new Date(data.next_status.dateTime));
    
    /* - - - - - */
    if (typeof response.data.day !== 'undefined') {
        var report = '';
        var workedHours = 0;
        var workedMins = 0;
        var x = response.data.day;
        $.each(dates, function (key, item) {
            var thisDate = parseInt(item.date.slice(-2));
            if (x == thisDate) {
                if ($('#log_book').length > 0) {
                    getEmployeeLogbook(item.date);
                }
                workedHours = parseInt(item.hours);
                workedMins = parseInt(item.minutes);
                if (workedHours != 0 || workedMins != 0) {
                    report = item.reports;
                }
            }
        });
    }
}
function saveChangesStatus(el){
    var element = $(el);
    c('Save Edit Status');
    c($('#time_from').val());
    c($('#time_to').val());
    
    var userId = $('select.employee option:selected').val();
    var date = element.attr('data-datetime');
    var data = {};
    data.userId = userId;
    data.timeFromId = $('#time_from').attr('data-id');
    data.timeFrom = $('#time_from').val();
    data.timeToId = $('#time_to').attr('data-id');
    data.timeTo = $('#time_to').val();
    data.date = date;
    
    AjaxController('updateEmployeeStatus', data, adminUrl, 'saveChangesStatusHandler', errorBasicHandler, true);
}
function saveChangesStatusHandler(response){
    c(response);
    $('#saveChangesStatus').remove();
    getMonthReport();
    /* - - - - - */
    var report = '';
    var workedHours = 0;
    var workedMins = 0;
    var x = parseInt(response.data.day);
    $.each(dates, function (key, item) {
        var thisDate = parseInt(item.date.slice(-2));
        if (x == thisDate) {
            if ($('#log_book').length > 0){
                getEmployeeLogbook(item.date);
            }
            workedHours = parseInt(item.hours);
            workedMins = parseInt(item.minutes);
            if (workedHours != 0 || workedMins != 0) {
                report = item.reports;
            }
        }
    });
}
function createNewStatusPopup(el){
    var element = $(el);
    var day = element.attr('data-day');
    var header = 'Create Status';
    var content = `
                    <div class="employeeControl">
                        <label>Status:</label>
                        <select id="select_status">
                            <option value="0" selected >Off</option>
                            <option value="1">Work</option>
                        </select>
                    </div>
                    <div class="employeeControl">
                        <label>From:</label>
                        <input type="text" class="timeFromTo" id="time_from" />
                    </div>
                    <div class="employeeControl">
                        <label>To:</label>
                        <input type="text" class="timeFromTo" id="time_to" />
                    </div>
                    <div class="employeeControl">
                        <label>Note:</label>
                        <textarea id="note_status"></textarea>
                    </div>
                    <div class="employeeControlButton">
                        <button class="btn btn-default" data-dismiss="modal">Cancel</button>
                        <button class="btn btn-default time_save" data-day="${day}" onclick="createNewStatus(this);">Create</button>
                    </div>`;
    showModal(header, content, 'createNewStatus');
    
    addTimeControlEmpl(setRange);
}
function createNewStatus(el){
    var element = $(el);
    var userId = $('select.employee option:selected').val();
    var date = element.attr('data-day');
    var data = {};
    data.userId = userId;
    data.status = $('#select_status option:selected').val();
    data.timeFrom = $('#time_from').val();
    data.timeTo = $('#time_to').val();
    data.note = $('#note_status').val();
    data.date = date;
    
    if(data.timeFrom == '' || data.timeTo == ''){
        return false;
    }
    
    AjaxController('createEmployeeStatus', data, adminUrl, 'createNewStatusHandler', errorBasicHandler, true);
}
function createNewStatusHandler(response) {
    c(response);
    $('#createNewStatus').remove();
    getMonthReport();
    /* - - - - - */
    var report = '';
    var workedHours = 0;
    var workedMins = 0;
    var x = parseInt(response.data.day);
    $.each(dates, function (key, item) {
        var thisDate = parseInt(item.date.slice(-2));
        if (x == thisDate) {
            if ($('#log_book').length > 0){
                getEmployeeLogbook(item.date);
            }
            workedHours = parseInt(item.hours);
            workedMins = parseInt(item.minutes);
            if (workedHours != 0 || workedMins != 0) {
                report = item.reports;
            }
        }
    });
}
function addTimeControlEmpl(beforeShow = null){
    $('input.timeFromTo').timeEntry({ 
        show24Hours: false,
        unlimitedHours: false,
        separator: ' : ', 
        ampmPrefix: ' ', 
        ampmNames: ['AM', 'PM'],  
        spinnerTexts: ['Now', 'Previous field', 'Next field', 'Increment', 'Decrement'], 
        appendText: '', 
        showSeconds: true, 
        timeSteps: [1, 1, 1], 
        initialField: null, 
        noSeparatorEntry: true,  
        useMouseWheel: true,  
        defaultTime: null,
        minTime: null, 
        maxTime: null,
        spinnerImage: '/dash/assets/svg/log/spinnerUpDown.png', //'/dash/assets/svg/log/up-down.svg', 
        spinnerSize: [30, 34, 0], 	
        spinnerBigImage: '',
        spinnerBigSize: [30, 34, 0],
        spinnerIncDecOnly: true, 
        spinnerRepeat: [500, 250], 	
        beforeShow: beforeShow,  
        beforeSetTime: null
    }); 
}
function setRange(input){
    c(input);
     return {minTime: (input.id === 'time_to' ? 
        $('#time_from').timeEntry('getTime') : null),  
        maxTime: (input.id === 'time_from' ? 
        $('#time_to').timeEntry('getTime') : null)}; 
}
function getEmplStatusFromId(st){
	var tx = 'Working';
	if(st == 0){
		tx = 'Off';
	}
	return tx;
}
function setLogEmplTime(elem, time){
	var hours = Math.floor( time / 3600);          
	var minutes = parseInt((time - hours*3600)/60);
	var pad = "00";
	var minutes = (pad+minutes).slice(-pad.length);
	var hours = (pad+hours).slice(-pad.length);
	$('.'+elem).text(hours+'.'+minutes);
}
function addLogBookEmplPoint(point){
	var colr = '#548AB6';
	row = point.status;
	var w = 31;
	var h = 14;
	var lengthH = point.durationH;
	var lengthM = point.durationM;
	var startH = point.hours;
	var startP = point.startP; 
	x1 = (startH+startP/60)*w;
	x2 = x1 + (lengthH+lengthM/60)*w;
	y = h + row*2*h;
	$(svg).append(svgEl('line'));
	$(svg).find("line").last()
		.attr("x1",x1)
		.attr("x2",x2)
		.attr("y1",y)
		.attr("y2",y).
		attr("class",'working_line').
		attr("style","stroke:"+colr+";stroke-width:2;");
}
function gLineEmpl(point1, point2){
	var colr = '#548AB6';
	var row1 = point1.status;
	var row2 = point2.status; 
	
	var w = 31;
	var h = 14;
	var lengthH = point1.durationH;
	var lengthM = point1.durationM;
	var startH = point1.hours;
	var startP = point1.startP;
	x11 = (startH+startP/60)*w;
	x12 = x11 + (lengthH+lengthM/60)*w;
	y1 = h + row1*2*h;
	 
	var lengthH2 = point2.durationH;
	var lengthM2 = point2.durationM;
	var startH2 = point2.hours;
	var startP2 = point2.startP; 
	x21 = (startH2+startP2/60)*w;
	x22 = x21 + (lengthH2+lengthM2/60)*w;
	y2 = h + row2*2*h; 
	$(svg).append(svgEl('line'));
	$(svg).find("line").last()
		.attr("x1",x12)
		.attr("x2",x12)
		.attr("y1",y1)
		.attr("y2",y2).
		attr("class",'working_line').
		attr("style","stroke:"+colr+";stroke-width:2;"); 
}
function getMsFromSecConvertedUTC(time, asSeconds = false){
	var stTime = new Date(time*1000);
	var fullOffset = (stTime.getTimezoneOffset()+emplTimeZoneOffset)*60*1000
        stTime.setTime( stTime.getTime() + fullOffset );
        if(asSeconds){
            return stTime.getTime();
        }
	return stTime;
}
function getTimeFromMS(stTime, localTime = false){
	var t = new Date(stTime.getTime());
	
	t.setTime(stTime.getTime());
	
	
	var pad = "00";
	var mins = (pad+t.getMinutes()).slice(-pad.length);
	var hours = (pad+t.getHours()).slice(-pad.length);
	
	var date = hours + ":" + mins;
	return date;
}