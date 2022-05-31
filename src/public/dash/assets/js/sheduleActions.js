function drawEventForm(userId){
    var hasWorkTime = 0;
    eventDateList = [];
    var userShedule = $('li[user-id="'+userId+'"]');
    $.each(userShedule.find('.check_day:checked'), function() {
        var data_day = $(this).parents('.dayWeek').attr('data-day');
        eventDateList.push(data_day);
        if($(this).parents('.day').find('.work-time').length > 0){
            hasWorkTime++;
        }
     });
    c(eventDateList);
    var userName = userShedule.find('.user').text();
	var event = {id:0, userId:userId, title:'', description:'', start:'09:00:00', end:'18:00:00', editorId:thisUserId, creatorName: thisUserName, eventType: 1};
	if(eventDateList.length == 1 && hasWorkTime > 0) { 
        var event_id = userShedule.find('.check_day:checked').parents('.dayWeek').attr('event-id'),
            eventIndex = eventsList.findIndex(x => x.id==event_id); c(eventIndex);
			if(eventIndex!=-1){
				event = JSON.parse(JSON.stringify(eventsList[eventIndex]));	
				event.start = getDateTime(event.start).sqlTime;
				event.end = getDateTime(event.end).sqlTime;
			}
        c('event'); c(event);
    }
    var eventForm = '<form id="eventForm">';
    eventForm += '<label>Employee</label><input id="userName" name="userName" type="text" value="'+userName+'" disabled/>';
    eventForm += '<label>Shedule type</label>';
    eventForm += '<select id="eventType" name="eventType" onchange="eventTypeChange(this)">';
    eventForm += '<option value="1">Work time</option>';
    eventForm += '<option value="2">Vacation</option>';
    eventForm += '</select>';
    eventForm += '<div class="half_control"><label>Start Time</label><input id="start" name="start" type="text" autocomplete="off" value="'+convertOnlyTimeFromSqlToUsa(event.start)+'"/></div>';
    eventForm += '<div class="half_control"><label>End Time</label><input id="end" name="end" type="text" autocomplete="off" value="'+convertOnlyTimeFromSqlToUsa(event.end)+'"/></div>';
    eventForm += '<input id="userId" name="userId" type="hidden" value="'+event.userId+'"/>';
    eventForm += '<input id="editId" name="id" type="hidden" value="'+event.id+'"/>';
    eventForm += '<input id="editorId" name="editorId" type="hidden" value="'+event.editorId+'"/>';	
    eventForm += '<div class="control-buttons">';
    eventForm += '<button type="button" class="btn btn-default save_event" onclick="editEvent()">Save</button>';
    eventForm += '</div>';
    eventForm += '</form>';
	var formTitle = 'Edit shedule';
    showModal(formTitle, eventForm);
    sheduleTimeControl();
	$('#eventType').val(event.eventType).trigger('change');
}
function editDaysMode(userId){
	cancelEdit();
    var editDaysCount = 0;
    var userShedule = $('li[user-id="'+userId+'"]');
    userShedule.find('.check_day').remove();
    var todayDate = new Date();
    $.each(userShedule.find('.day_of_month'), function() {
        var data_day = $(this).parents('.dayWeek').attr('data-day');
        var checkDate = new Date(data_day);
		var diff = checkDate - todayDate;
		var event_id = $(this).parents('.dayWeek').attr('event-id');
        if(diff >= 0){
			$(this).parents('.dayWeek').addClass('checkbox_div'); 
            $(this).append('<input id="day_'+data_day+'" type="checkbox" class="check_day" value="'+data_day+'" onclick="checkDayChange(this)"/>');
			$(this).before('<label class="checkbox_label" for="day_'+data_day+'"></label>');
            editDaysCount++;
        }
		if(typeof event_id!='undefined' && event_id!=0 && diff >= 0){
			$(this).parents('.day').append('<span class="removeIcon" onclick="removeEvent('+event_id+')"><i class="fa fa-trash" aria-hidden="true"></i></span>');
		}
	});
    if(editDaysCount>0){
        userShedule.find('.edit_shedule').hide();
        userShedule.find('.cancel_edit').show(); 
    }
}
function cancelEdit(){
	var userShedule = $('.user_working_shedule li');
	$('.dayWeek').removeClass('checkbox_div');
    userShedule.find('.check_day, .removeIcon, .checkbox_label').remove();
	userShedule.find('.dayWeek').removeAttr('onclick');
    userShedule.find('.edit_shedule').show();
    userShedule.find('.add_event,.cancel_edit').hide();    
}

function checkDayChange(obj){ c(obj);
	//var checked = $(obj).find('.check_day').is(':checked'); 
	//$(obj).find('.check_day').prop('checked', !checked);
	var dayObj = $(obj).parents('li');
    if(dayObj.find('.check_day:checked').length > 0) { 
		dayObj.find('.add_event').show(); 
	} else {
		dayObj.find('.add_event').hide();
	}
}
function editEvent(){ c('editEvent');
    $('.save_event').prop('disabled', true);
    var error = [];
    var paramObj = {};
    $.each($('#eventForm').serializeArray(), function(key, kv) {
            paramObj[kv.name] = kv.value;
    });
    paramObj['editorId'] = thisUserId;
	//validate time string
	var pattern = /^([0-9]{1,2}):([0-9]{2}):([0-9]{2})(AM||PM)$/;
	if(!pattern.test(paramObj.start)){ error.push('start'); }
	if(!pattern.test(paramObj.end)){ error.push('end'); }
	
	var checkStartTime = convert12To24Hour(paramObj.start);
	var checkEndTime = convert12To24Hour(paramObj.end); 
	
	//validate from <= to
	if(paramObj.eventType!=2 && checkEndTime!='00:00:00'){
		var checkStart = eventDateList[0]+'T'+checkStartTime;  //T - fix for safari
		var checkEnd = eventDateList[0]+'T'+checkEndTime;
		var checkStartD = new Date(checkStart).getTime() / 1000; c(checkStartD);
		var checkEndD = new Date(checkEnd).getTime() / 1000; 	 c(checkEndD);
		if(checkStartD >= checkEndD){
			error.push('start');
			error.push('end');
		} 
	}
    $('#eventForm .error').removeClass('error');
    if(error.length > 0 ){
		$.each(error, function(key, val){
				$('#eventForm #'+val).addClass('error');
		})
		$('.save_event').prop('disabled', false);
		return false;
    }
	
	var title = ''; //$('#eventType option:selected').text();
	var newObjectsList = []; 
	var userShedule = $('li[user-id="'+paramObj.userId+'"]'); c(userShedule);
    $.each(eventDateList, function(key, eventDate){
		//check if edit & get event_id for update
		var event_id = userShedule.find('.dayWeek[data-day="'+eventDate+'"]').attr('event-id'); c('edit of'+ event_id);
		if(typeof event_id!='undefined'){
			paramObj.id = event_id;
		}
		var newObj = {id: paramObj.id, userId: paramObj.userId, editorId: paramObj.editorId, eventType: paramObj.eventType}; 
		if(paramObj.eventType == 2){
			newObj['start'] = eventDate + ' 00:00:00';
			newObj['title'] = 'Vacation on '+ convertDateToUSA(eventDate);
			var endDate = new Date(eventDate);
			endDate.setDate(endDate.getDate() + 1);
			newObj['end'] = convertDateToSQL(endDate) + ' 00:00:00';
		}  else {
			newObj['start'] = LocalToUtcSql(eventDate+' '+checkStartTime);
			newObj['title'] = 'Working day time for '+ convertDateToUSA(eventDate);
			if(checkEndTime=='00:00:00'){
				var endDate = new Date(eventDate);
				endDate.setDate(endDate.getDate() + 1);
				newObj['end'] = LocalToUtcSql(convertDateToSQL(endDate)+' '+checkEndTime); 
			} else {
				newObj['end'] = LocalToUtcSql(eventDate+' '+checkEndTime);
			}
		}
		newObjectsList.push(newObj);
    });
	AjaxController('updateUserShedule', {newObjectsList}, dashUrl, updateUserSheduleHandler, errorHandler, true);
}
function updateUserSheduleHandler(responce){ c('updateUserSheduleHandler')
	var events = responce.data;
	$.each(events, function(key, event) {	c(event);
		var eventStart = getDateTime(event.start);
		var eventEnd = getDateTime(event.end);

		if(event.eventType == 2){
			var workTimeStr = '<div class="work-time vacation-time">Vacation</div>';
		} else {
			var workTimeStr = '<div class="work-time">'+eventStart.onlyTime+' '+eventEnd.onlyTime+'</div>';
		}
		var eventDay = $('li[user-id="'+event.userId+'"]').find('.dayWeek[data-day="'+eventStart.onlyDate+'"]');
		//remove old event
		var oldEvent = eventDay.attr('event-id');
		var editIndex = eventsList.findIndex(x => x.id==oldEvent);
		c(editIndex);
		if(editIndex!=-1){
			eventsList[editIndex] = event; //eventsList.splice(editIndex, 1, event);
		} else {
			eventsList.push(event);
		}
		
		//add new
		eventDay.attr('event-id', event.id);
		eventDay.find('.work-time').remove(); 
		eventDay.find('.day').append(workTimeStr);
        
    });
    $('[data-dismiss="modal"]').click();
	cancelEdit();
}
function errorHandler(responce){
    c(responce);
}
function removeEvent(eventId){ c('removeEvent');
	$('.dayWeek[event-id='+eventId+']').find('.removeIcon').hide();
	AjaxController('removeCalendarEvent', {id: eventId}, dashUrl, removeEventHandler, errorHandler, true);
}
function removeEventHandler(responce){ c('removeEventHandler');
	var removedId = responce.data;
	var editIndex = eventsList.findIndex(x => x.id==removedId);
	eventsList.splice(editIndex, 1);
	$('.dayWeek[event-id='+removedId+']').find('.work-time, .removeIcon').remove();
	$('.dayWeek[event-id='+removedId+']').attr('event-id', 0);
	c('eventsList'); c(eventsList);
}
function eventTypeChange(obj){
    var type = $(obj).val();
    if(type==2){
      $('.half_control').hide();
    } else {
        $('.half_control').show();
    }
}
function sheduleTimeControl(){
    $('#start, #end').datetimepicker({ 
        timeOnly: true,
        timeFormat: 'h:mm:00TT',
        showButtonPanel: false,
        showTimePicker: false,
        showSecond:false,
        stepMinute: 5
    });
}
function getDateTime(dateTime){ 
    var sec = new Date(dateTime).getTime() - new Date().getTimezoneOffset()*60*1000,
		localDateTime = timeFromSecToSqlString(sec, true),
		onlyDate = localDateTime.substring(0, 10),
		sqlTime = localDateTime.substring(11, 19),
		onlyTime = convertOnlyTimeFromSqlToUsa(localDateTime.substring(11, 16)).replace('AM',' AM').replace('PM',' PM');
    return {localDateTime:localDateTime, onlyDate:onlyDate, onlyTime:onlyTime, sqlTime: sqlTime};
}
function convert12To24Hour(time) {
    var hours = parseInt(time.substr(0, 2));
    if(time.indexOf('AM') != -1 && hours == 12) {
        time = time.replace('12', '00');
    }
    if(time.indexOf('PM')  != -1 && hours < 12) {
        time = time.replace(hours, (hours + 12));
    }
    //fix for safari
    if(time.length == 9){
        time = ('0'+time);
    }
    return time.replace(/(AM|PM)/, '');
}
function LocalToUtcSql(dateTime){ 
	var localDate = new Date(dateTime);
	var utc = new Date(localDate.getTime() + localDate.getTimezoneOffset() * 60000);
	return convertDateToSQL(utc, true);
}