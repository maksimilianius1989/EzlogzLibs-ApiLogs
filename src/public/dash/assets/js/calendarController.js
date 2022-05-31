function drawEventForm(event){ c('drawEventForm');
	var onlyView = thisUserId == event.editorId || is_admin ? 0:1;
	var eventForm = '<form id="eventForm">';
	eventForm += '<div class="half_control"><label>Employee</label><input id="userName" name="userName" type="text" value="'+event.userName+'" disabled/></div>';
	eventForm += '<div class="half_control"><label>Author</label><input id="creatorName" name="creatorName" type="text" value="'+event.creatorName+'" disabled/></div>';
	eventForm += '<div class="half_control"><label>Start Time</label><input id="start" name="start" type="text" autocomplete="off" value="'+convertDateToUSA(event.start, true, true)+'" '+(onlyView ? 'disabled':'')+'/></div>';
	eventForm += '<div class="half_control"><label>End Time</label><input id="end" name="end" type="text" autocomplete="off" value="'+convertDateToUSA(event.end, true, true)+'" '+(onlyView ? 'disabled':'')+'/></div>';
	eventForm += '<label>Title</label><input id="title" name="title" type="text" value="'+event.title+'" '+(onlyView ? 'disabled':'')+'/><br/>';
	if(onlyView){
		eventForm += '<label>Description</label><div id="description" name="description">'+event.description+'</div>';
	} else {
		eventForm += '<label>Description</label><textarea id="description" name="description">'+event.description+'</textarea>';
	}
	eventForm += '<input id="allDay" name="allDay" type="hidden" value="'+event.allDay+'"/>';
	eventForm += '<input id="userId" name="userId" type="hidden" value="'+event.userId+'"/>';
	
	//comments logic if not new
	if(event.id != 0){
		eventForm += '<input id="editId" name="id" type="hidden" value="'+event.id+'"/>';
		eventForm += '<input id="editorId" name="editorId" type="hidden" value="'+event.editorId+'"/>';		
		eventForm += '<label>Comments</label>';
		eventForm += '<div class="event_comments">';
		if(typeof event.commentsList!= 'undefined' && event.commentsList.length >0){
			$.each(event.commentsList, function(key, item){
				eventForm += drawComment(item);
			});
		}
		eventForm +='</div>';
		eventForm += '<textarea id="newComment" placeholder="Add comment"></textarea>';
	}
	
	//button control
	eventForm += '<div class="control-buttons">';
	if(event.id == 0){
		var formTitle = 'Add Event';
		eventForm += '<button type="button" class="btn btn-default save_event" onclick="editEvent('+(event.id !=0 ? 1:0)+')">Save</button>';
	} else if(!onlyView) {
		var formTitle = 'Edit event';
		eventForm += '<button type="button" class="btn btn-default add_comment" onclick="addComment('+event.id+')">Add comment</button>';
		eventForm += '<button type="button" class="btn btn-default save_event" onclick="editEvent('+(event.id !=0 ? 1:0)+')">Save</button>';
	} else {
		var formTitle = 'View event';
		eventForm += '<button type="button" class="btn btn-default add_comment" onclick="addComment('+event.id+')">Add comment</button>';
	}
	//eventForm += '<button type="button" class="btn btn-default close-modal" data-dismiss="modal">Close</button>';
	eventForm += '</div>';
	eventForm += '</form>';
	showModal(formTitle, eventForm);
	eventTimeControl();
}
function eventTimeControl(){ 
	$('#start, #end').datetimepicker({
		format:'YYYY-MM-DD hh:mm:ss',
		dateFormat: 'mm-dd-yy',
		timeFormat: 'h:mm:00TT',
		showButtonPanel: false,
		showTimePicker: false,
		showSecond:false,
		stepMinute: 30
	});
}

function addComment(eventId){ c('addComment');
	$('.add_comment').prop('disabled', true);
	var commentText = $('#newComment').val();
	commentText = commentText.replace(/<\/?[^>]+>/gi, '').replace(/^\s*(.*)\s*$/, '$1');
	if(commentText == '' || commentText.length > 1000){
		$('#newComment').addClass('error');
		$('.add_comment').prop('disabled', false);
		return false;
	}
	AjaxController('addCalendarComment', {creatorId:thisUserId, eventId:eventId, comment:commentText}, adminUrl, 'addCommentHandler', errorAddCommentHandler, true);
}
function drawComment(item){ c('darwCommentsList');
	var comment = '';
		comment += '<div class="comment"><div class="comment_info">';
		comment += '<span class="creator"><i class="fa fa-user-circle" aria-hidden="true"></i>'+item.userName+'</span>';
		comment += '<span class="createDate"><i class="fa fa-calendar-plus-o" aria-hidden="true"></i>'+convertDateToUSA(item.dateTime, true,true)+'</span></div><br/>';
		var commentWithBrake = item.comment.replace(/\\n/g, "<br />");
		comment += '<div class="comment_body">'+commentWithBrake+'</div></div>';
	return comment;
}

function addCommentHandler(responce){ c('addCommentHandler');
	var comment = responce.data;
	var commentText = drawComment(comment);
	var editIndex = eventsList.findIndex(x => x.id==comment.eventId);
	eventsList[editIndex]['commentsList'].push(comment);
	
	$('#newComment').val('');
	$('.event_comments').append(commentText);
	var d = $('.event_comments');
	d.animate({ scrollTop: d.prop('scrollHeight') }, 0);
	$('.add_comment').prop('disabled', false);
}
function errorAddCommentHandler(responce){ 
	c('errorAddCommentHandler');
	$('.add_comment').prop('disabled', false);
	alertError($('.messages-container'), responce.message);
}
function editEvent(newEvent = 0){ c('editEvent');
	$('.save_event').prop('disabled', true);
	var error = [];
	var paramObj = {};
	$.each($('#eventForm').serializeArray(), function(key, kv) {
		fieldValue = kv.value.replace(/<\/?[^>]+>/gi, '');
		if(validateEventInfo(kv.name, fieldValue)){
            error.push(kv.name);
        }
		paramObj[kv.name] = fieldValue;
	});
	
	//check start - end dates
	paramObj.start = moment(paramObj.start, 'MM-DD-YYYY hh:mm:ssA').format('YYYY-MM-DD HH:mm:ss');
	paramObj.end = moment(paramObj.end, 'MM-DD-YYYY hh:mm:ssA').format('YYYY-MM-DD HH:mm:ss');
	
	var checkStart = new Date(paramObj.start); c('checkStart'); c(checkStart);
	var checkEnd = new Date(paramObj.end); 	c('checkEnd'); c(checkEnd);
	if(checkStart >= checkEnd){
		error.push('start');
		error.push('end');
	} 
	
	$('#eventForm .error').removeClass('error');
    if(error.length > 0 ){
        $.each(error, function(key, val){
            $('#eventForm #'+val).addClass('error');
        })
		$('.save_event').prop('disabled', false);
		return false;
    }

	if(newEvent==0){
		paramObj['editorId'] = thisUserId;
		AjaxController('addCalendarEvent', paramObj, adminUrl, 'addEventHandler', errorAddEventHandler, true);
	} else {
		//check if no changes
		var isChanged = 0;
		var checkFields = ['title','description','start','end'];
		var editIndex = eventsList.findIndex(x => x.id==paramObj['id']);
		$.each(checkFields, function(key, field){  
            if(eventsList[editIndex][field] != paramObj[field]){ c(eventsList[editIndex][field]+'!='+paramObj[field]); 
				isChanged = 1;
			}
        })
		if(isChanged == 0){
			$('[data-dismiss="modal"]').click();
			return false;
		}
		AjaxController('updateCalendarEvent', paramObj, adminUrl, 'updateEventHandler', errorUpdateEventHandler, true);
	}
}
function updateEventHandler(responce){ c('updateEventHandler')
	c(responce.data);
	var editIndex = eventsList.findIndex(x => x.id==responce.data.id);
	eventsList[editIndex] = responce.data;
	calendar.fullCalendar('refetchEvents'); 
	$('[data-dismiss="modal"]').click();
}
function addEventHandler(responce){ c('addEventHandler')
	eventsList.push(responce.data);
	calendar.fullCalendar('refetchEvents'); 
	$('[data-dismiss="modal"]').click();
	alertMessage($('.messages-container'), 'Event was added', 3000);
}
function errorAddEventHandler(responce){
	c(responce);
	$('.save_event').prop('disabled', true);
}
function errorUpdateEventHandler(responce){
	alertError($('.messages-container'), responce.message);
}	
function removeEvent(event){ c('removeEvent');
	var eventId = $(event.target).parents('a').attr('event-id');
	AjaxController('removeCalendarEvent', {id: eventId}, adminUrl, 'removeEventHandler', errorRemoveEventHandler, true);
	event.stopPropagation();
}
function removeEventHandler(responce){
	c(responce.data);
	var removedId = responce.data;
	var editIndex = eventsList.findIndex(x => x.id==removedId);
	eventsList.splice(editIndex, 1);
	calendar.fullCalendar('refetchEvents'); 
}
function errorRemoveEventHandler(responce){
	alertError($('.messages-container'), responce.message);
}
function filterManagers(){
	calendar.fullCalendar('rerenderEvents');
}
function filterPeriod(obj){
	$('.'+$(obj).val()).click();
}

function drawAdminCalendar(responce){ c('drawAdminCalendar'); c(responce);
	is_admin = responce.data.is_admin;
	is_editor = responce.data.is_editor;
	
	thisUserId = responce.data.thisUserId;
	$('.my_calendar').val(thisUserId);

	managersList = responce.data.managersList;
	if(typeof managersList!= 'undefined' && managersList.length >0){
		managersOptions = '<optgroup label="Managers" class="managersList">';
		$.each(managersList, function(key, item){ 
			if(item.id!=thisUserId){
				managersOptions +='<option value="'+item.id+'">'+item.userName+'</option>';
			}
		});
		managersOptions += '</optgroup>';
		$('select#managersList').append(managersOptions);
	}

	if(is_admin!=0){
		employeesList = responce.data.employeesList;
		if(typeof employeesList!= 'undefined' && employeesList.length >0){
			employeesOptions = '<optgroup label="Employees" class="employeesList">';
			$.each(employeesList, function(key, item){ 
				employeesOptions +='<option value="'+item.id+'">'+item.userName+'</option>';
			});
			employeesOptions += '</optgroup>';
			$('select#managersList').append(employeesOptions);
		}
		/*
		employeesList = responce.data.employeesList;
		if(typeof employeesList!= 'undefined' && employeesList.length >0){
			$.each(employeesList, function(key, item){
				$('optgroup.employeesList').append('<option value="'+item.id+'">'+item.userName+'</option>');
			});
		}
		*/
	}
	
	eventsList = typeof responce.data.eventsList!= 'undefined' ? responce.data.eventsList : [];
	c('eventsList'); c(eventsList);
	calendar = $('#calendar');
	calendar.fullCalendar({
		header: {
			left: 'prev title next',
			right: 'month,agendaDay,today' // agendaWeek,listWeek,listDay
		},
		views: {
			month: {allDaySlot: false, slotDuration: '00:30:00', nowIndicator: true}, 
			agendaWeek: {allDaySlot: false, nowIndicator: true}, 
			agendaDay: {allDaySlot: false, nowIndicator: true}, 
		},
		//buttonText: {today: 'now'},
		defaultDate: $('#calendar').fullCalendar('today'), //moment().day(),
		navLinks: true, 
		eventLimit: true, 
		timeFormat: 'hh:mm',
		slotLabelFormat: 'h(:mm) a',
		editable: true,
		fixedWeekCount: false,
		contentHeight: 'auto',
		events: function (start, end, tz, callback) {
			callback(eventsList);
		},
		selectable:true,
		selectHelper:true,
		select: function(start, end, allDay){  
			var userId = $('#managersList').val();
			if(userId == 0){ 
				if($('.messages-container').text()==''){
					alertError($('.messages-container'), 'Please, select employee!', 3000);
				}
				return false;
			}
			//managers & employees can't add events for other. Exception is editors group.
			if(userId!=thisUserId && !is_admin && !is_editor){
				return false;
			}
			var view = calendar.fullCalendar('getView'),
				allDayParam = view.name == 'month' ? 1:0,
				customEnd = start.clone().add(30,'minutes'),
				start = $.fullCalendar.formatDate(start, "Y-MM-DD HH:mm:ss"),
				end = $.fullCalendar.formatDate(customEnd, "Y-MM-DD HH:mm:ss"),
				userId = $('#managersList').val(),
				userName = userId == thisUserId ? getCookie("user") : $('#managersList option[value="'+userId+'"]').text();
				creatorName = getCookie("user"); 
			var event = {id:0, userId:userId, title:'', description:'',start:start, end:end, allDay: allDayParam,  editorId:thisUserId, userName:userName, creatorName: creatorName};
			drawEventForm(event);
		},
		eventResize: function(event, delta, revertFunc) {
			if(!is_admin && thisUserId != event.editorId){	
				revertFunc(); 
				return false;
			}
			var start = $.fullCalendar.formatDate(event.start, "Y-MM-DD HH:mm:ss");
			var end = $.fullCalendar.formatDate(event.end, "Y-MM-DD HH:mm:ss");
			var editEvent = {id:event.id, userId:event.userId, title:event.title, description:event.description, start:start, end:end, allDay: event.allDay, userName:event.userName};
			AjaxController('updateCalendarEvent', editEvent, adminUrl, 'updateEventHandler', errorUpdateEventHandler, true);
		}, 
		eventDrop:function(event, delta, revertFunc) {c(thisUserId);c(event.editorId);
			if(!is_admin && thisUserId != event.editorId){	
				revertFunc(); 
				return false;
			}
			var start = $.fullCalendar.formatDate(event.start, "Y-MM-DD HH:mm:ss");
			var end = $.fullCalendar.formatDate(event.end, "Y-MM-DD HH:mm:ss");
			var editEvent = {id:event.id, userId:event.userId, title:event.title, description:event.description, start:start, end:end, allDay: event.allDay, userName:event.userName};
			AjaxController('updateCalendarEvent', editEvent, adminUrl, 'updateEventHandler', errorUpdateEventHandler, true);
		},
		eventClick:function(event){
			event.start = $.fullCalendar.formatDate(event.start, "Y-MM-DD HH:mm:ss");
			event.end = $.fullCalendar.formatDate(event.end, "Y-MM-DD HH:mm:ss");
			drawEventForm(event);
		},
		eventRender: function eventRender( event, element, view ) { c('eventRender'); 
			//filter Only Managers
			if($('#onlyManagers').is(":checked")){
				c(managersList);
				var managerIndex = managersList.findIndex(x => x.id==event.userId);
				if(managerIndex == -1){
					return false;
				}
			}
			//add custom time format
			var start = convertOnlyTimeFromSqlToUsa($.fullCalendar.formatDate(event.start, "HH:mm"));
			var end = convertOnlyTimeFromSqlToUsa($.fullCalendar.formatDate(event.end, "HH:mm"));
			var customTime = start + ' - ' +end;
			$(element).find('.fc-time').html(customTime);
			
			//add attributes for edit & remove
			$(element).attr('event-id', event.id).attr('editor-id', event.editorId).attr('user-id', event.userId);
			$(element).find('.fc-title').html('<span class="userName">'+event.userName+': </span>'+event.title);			
			
			//add custom colors
			if(event.editorId == thisUserId || is_admin == 1){
				$(element).addClass('my_edit');
			}
			if(event.userId == thisUserId && !calendar.hasClass('employee_calendar')){
				$(element).addClass('my_event');
			}
			if(event.userId == thisUserId && is_admin == 1){
				$(element).addClass('admin_event');
			}

			//filter by user
			var userId = $('#managersList').val();
			if(userId != 0 && event.userId == userId){
				return true;
			} else if(userId == 0){
				return true;
			}
			return false;
		},
		eventAfterAllRender: function(){
			c(notificationEvent);
			if(notificationEvent){
				$('.fc-day-grid-event[event-id="' + notificationEvent + '"]').trigger('click');
				notificationEvent = false;
			}
		},
		eventLimitClick: function(cellInfo, jsEvent){
			$('.fc-view').removeClass('bottom');
			if(cellInfo.segs[0].row+1 == $('.fc-row').length-1){
				$('.fc-view').addClass('bottom');
			}
			return "popover";
		},
	});
	$(window).resize();
	$("body").on({
		mouseenter: function(){
			var userId = $(this).attr('user-id');
			var eventId = $(this).attr('event-id');
			var editorId = $(this).attr('editor-id');
			//c('thisUserId='+thisUserId); c('editorId='+editorId);
			if($(this).text()!='' && !$('.removeIcon').length && (is_admin || thisUserId == editorId)){
				$(this).append('<span class="removeIcon" onclick="removeEvent(event)"><i class="fa fa-trash" aria-hidden="true"></i></span>');
			}
		},
		mouseleave: function () {
		   $('.removeIcon').remove();
	}}, 'a.fc-event'); 
}

function onlyManagers(){ 
	if($('#onlyManagers').is(":checked")){
		$('#managersList option:selected').prop("selected", false);
		$('option.my_calendar').hide();
		$('.employeesList').hide();
	} else {
		$('.employeesList').show();
		$('option.my_calendar').show();
	}
	calendar.fullCalendar('rerenderEvents');
}
function validateEventInfo(field_type, field_value) {
    var error = 0;
    var regex = '';
		field_value  = $.trim(field_value);
    switch (field_type) {
        case 'title': 
            var regex = /^([а-яА-Яa-zA-Z0-9\-\,\.\;\:\'\s\/]){1,100}$/; break;
        case 'description':
			var regex = /^[^\~]{1,1000}$/; break;
        default: regex = ''; break;
    }
    if(regex!=''){
        error = !regex.test(field_value);
    }
	if(field_value==''){
        error = 1; 
    }
    return error;
}
function errorDrawAdminCalendar(responce){ 
	c('errorDrawAdminCalendar');
	c(responce);
}
var thisUserId, 
	is_admin = 0, is_editor = 0, 
	eventsList = [], managersList = [], employeesList = [];
$(function() {
	AjaxController('getCalendar', {}, adminUrl, 'drawAdminCalendar', errorDrawAdminCalendar, true);
	$('body').on('focus click','.error', function(){
		$(this).removeClass('error');
	});
});