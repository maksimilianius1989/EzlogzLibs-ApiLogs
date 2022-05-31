function calendarController() {
		var self = this;
		this.thisUserId; 
		this.thisUserName;
		this.is_admin = 0; 
		this.is_editor = 0; 
		this.eventsList = []; 
		this.managersList = [];
		this.employeesList = [];
                this.resellerAdminsList = [];
                this.resellerEmployeeList = [];
                this.driversList = [];
                this.safetyList = [];
                this.dispatchersList = [];
                this.adminsList = [];
		this.initialised = false;
                this.timeLimitList = [];
                this.vacationList = [];
                this.smallMobile = false;
                this.dateDiffFormat = 'YYYY-MM-DD HH:mm:ss';
	this.init = function (){ c('this.init')
		AjaxController('getCalendar', {}, dashUrl, calendarC.initHandler, calendarC.errorInit, true);
    }
	this.initHandler = function(responce){ c('initHandler calendar'); c(responce);
        self.initialised = true;
        self.is_admin = responce.data.is_admin;
        self.is_editor = responce.data.is_editor;
        self.thisUserName = responce.data.thisUserName;
        self.thisUserId = responce.data.thisUserId;
        $('.my_calendar').val(self.thisUserId);

        optionsList = '';
        self.managersList = responce.data.managersList;
		if(typeof self.managersList!= 'undefined' && self.managersList.length >0){
            optionsList += '<optgroup label="Managers" class="managersList">';
			$.each(self.managersList, function(key, item){
				if(item.id!=self.thisUserId){
					optionsList +='<option value="'+item.id+'">'+item.userName+'</option>';
                }
            });
            optionsList += '</optgroup>';
        }
        self.employeesList = responce.data.employeesList;
                if(typeof self.employeesList!= 'undefined' && self.employeesList.length >0){ 
            optionsList += '<optgroup label="Employees" class="employeesList">';
                    $.each(self.employeesList, function(key, item){
                        optionsList +='<option value="'+item.id+'">'+item.userName+'</option>';
            });
            optionsList += '</optgroup>';
        }
        self.resellerAdminsList = responce.data.resellerAdminsList;
        if (typeof self.resellerAdminsList != 'undefined' && self.resellerAdminsList.length > 0) {
            optionsList += '<optgroup label="Admins" class="employeesList">';
            $.each(self.resellerAdminsList, function (key, item) {
                optionsList += '<option value="' + item.id + '">' + item.userName.trunc(25) + '</option>';
            });
            optionsList += '</optgroup>';
        }
        self.resellerEmployeeList = responce.data.resellerEmployeeList;
        if (typeof self.resellerEmployeeList != 'undefined' && self.resellerEmployeeList.length > 0) {
            optionsList += '<optgroup label="Employees" class="employeesList">';
            $.each(self.resellerEmployeeList, function (key, item) {
                optionsList += '<option value="' + item.id + '">' + item.userName.trunc(25) + '</option>';
            });
            optionsList += '</optgroup>';
        }
        var adminIndexes = [];
        var safetyIndexes = [];
        self.adminsList = responce.data.adminsList;
                        if(typeof self.adminsList!= 'undefined' && self.adminsList.length >0){
            optionsList += '<optgroup label="Admins" class="adminsList">';
                                $.each(self.adminsList, function(key, item){
                adminIndexes.push(item.id);
                                        if(item.id!=self.thisUserId){
                                                optionsList +='<option value="'+item.id+'">'+item.userName+'</option>';
                }
            });
            optionsList += '</optgroup>';
        }
        self.safetyList = responce.data.safetyList;
                        if(typeof self.safetyList!= 'undefined' && self.safetyList.length >0){
            optionsList += '<optgroup label="Safety Directors" class="safetyList">';
                                $.each(self.safetyList, function(key, item){
                safetyIndexes.push(item.id);
                                        if(item.id!=self.thisUserId){
                                                optionsList +='<option value="'+item.id+'">'+item.userName+'</option>';
                }
            });
            optionsList += '</optgroup>';
        }
        self.dispatchersList = responce.data.dispatchersList;
                        if(typeof self.dispatchersList!= 'undefined' && self.dispatchersList.length >0){
            optionsList += '<optgroup label="Dispatchers" class="dispatchersList">';
                                $.each(self.dispatchersList, function(key, item){
                                        if(item.id!=self.thisUserId && adminIndexes.indexOf(item.id) == -1 && safetyIndexes.indexOf(item.id) == -1){
                                                optionsList +='<option value="'+item.id+'">'+item.userName+'</option>';
                }
            });
            optionsList += '</optgroup>';
        }
        self.driversList = responce.data.driversList;
                        if(typeof self.driversList!= 'undefined' && self.driversList.length >0){
            optionsList += '<optgroup label="Drivers" class="driversList">';
                                $.each(self.driversList, function(key, item){
                                        if(item.id!=self.thisUserId && adminIndexes.indexOf(item.id) == -1 && safetyIndexes.indexOf(item.id) == -1){
                                                optionsList +='<option value="'+item.id+'">'+item.userName+'</option>';
                }
            });
            optionsList += '</optgroup>';
        }

        $('select#usersList').append(optionsList);

		var eventsList = typeof responce.data.eventsList!= 'undefined' ? responce.data.eventsList : [];
		c('self.eventsList'); c(self.eventsList);

        //time from utc to local
		$.each(eventsList, function(key, item){
            eventsList[key].start = self.sqlToLocalSql(item.start);
            eventsList[key].end = self.sqlToLocalSql(item.end);
			if(item.eventType == 1 || item.eventType == 2){
                var timeObj = {
                    userId: item.userId,
                    date: eventsList[key].start.substring(0, 10),
                    start: eventsList[key].start.substring(11, 19),
                    end: eventsList[key].end.substring(11, 19)
                };
				if(item.eventType == 1){
                    self.timeLimitList.push(timeObj);
                }
				if(item.eventType == 2){
                    self.vacationList.push(timeObj);
                }
            } else {
                self.eventsList.push(eventsList[key]);
            }
            eventsList[key].resourceId = item.userId;
        });

        calendar = $('#calendar');
        calendar.fullCalendar({
            header: {
                left: 'prev title next',
                right: 'month,agendaDay,listDay,today' // month,agendaDay,today, agendaWeek,listWeek,listDay
            },
            views: {
                month: {allDaySlot: false, slotDuration: '00:05:00', nowIndicator: true},
                agendaWeek: {allDaySlot: false, nowIndicator: true},
                agendaDay: {allDaySlot: false, slotDuration: '00:05:00', nowIndicator: true},
            },
            buttonText: {listDay: 'day'},
            defaultDate: $('#calendar').fullCalendar('today'), //moment().day(),
            navLinks: true,
            eventLimit: true,
            timeFormat: 'hh:mm',
            slotLabelFormat: 'h(:mm) a',
            timezone: 'local',
            editable: true,
            fixedWeekCount: false,
            contentHeight: 'auto',
            events: function (start, end, tz, callback) {
                callback(self.eventsList);
            },
			selectable:true,
			selectHelper:true,
			select: function(start, end, allDay){
                var userId = $('#usersList').val();
				if(userId == 0){ 
					if($('.messages-container').text()==''){
                        alertError($('.messages-container'), 'Please, select employee!', 3000);
                    }
                    return false;
                }
                //managers & employees can't add events for other. Exception is editors group.
				if(userId!=self.thisUserId && !self.is_admin && !self.is_editor){
                    return false;
                }
                var view = calendar.fullCalendar('getView'),
					allDayParam = view.name == 'month' ? 1:0,
					customEnd = start.clone().add(30,'minutes'),
                        start = $.fullCalendar.formatDate(start, "Y-MM-DD HH:mm:ss"),
                        end = $.fullCalendar.formatDate(customEnd, "Y-MM-DD HH:mm:ss"),
                        userId = $('#usersList').val(),
					userName = userId == self.thisUserId ? self.thisUserName : $('#usersList option[value="'+userId+'"]').text();
                var dayStart = $(allDay.target).attr('data-start');
                var dayEnd = $(allDay.target).attr('data-end');
				if(typeof dayStart!='undefined' && typeof dayEnd!='undefined'){
					if(dayStart == 0){
                        return false;
                    }
                    start = dayStart;
                    end = dayEnd;
                }
                                var event = {id:0, userId:userId, title:'', description:'',start:start, end:end, allDay: allDayParam,  editorId:self.thisUserId, userName:userName, creatorName: self.thisUserName};
                c(event);
                self.drawEventForm(event);
            },
            windowResize:function(view){ 
				c('windowResize');
				self.mobileView(view);
			},
			eventResize: function(event, delta, revertFunc) {
				var start = self.LocalToUtc(event.start);
				var end = self.LocalToUtc(event.end);
				var checkStart = moment(start).format(self.dateDiffFormat); 
				var checkToday = moment().utc().format(self.dateDiffFormat);
				if(!self.is_admin && self.thisUserId != event.editorId || checkToday > checkStart){	
					revertFunc(); 
					return false;
				}
				
				var editEvent = {id:event.id, userId:event.userId, title:event.title, description:event.description, start:start, end:end, allDay: event.allDay, userName:event.userName};
				AjaxController('updateCalendarEvent', editEvent, dashUrl, calendarC.updateEventHandler, calendarC.errorUpdateEventHandler, true);
            },
			eventDrop:function(event, delta, revertFunc) {c(self.thisUserId);c(event.editorId);
				var start = self.LocalToUtc(event.start);
				var end = self.LocalToUtc(event.end); 
				var checkStart = moment(start).format(self.dateDiffFormat); 
				var checkToday = moment().utc().format(self.dateDiffFormat); 
				if(!self.is_admin && self.thisUserId != event.editorId || checkToday > checkStart){	
					revertFunc(); 
					return false;
				}
				var editEvent = {id:event.id, userId:event.userId, title:event.title, description:event.description, start:start, end:end, allDay: event.allDay, userName:event.userName};
				AjaxController('updateCalendarEvent', editEvent, dashUrl, calendarC.updateEventHandler, calendarC.errorUpdateEventHandler, true);
			},
			eventClick:function(event){ 
                event.start = $.fullCalendar.formatDate(event.start, "Y-MM-DD HH:mm:ss");
                event.end = $.fullCalendar.formatDate(event.end, "Y-MM-DD HH:mm:ss");
                self.drawEventForm(event);
            },
			eventRender: function eventRender( event, element, view ) { //c('eventRender');
                //filter Only Managers
				if($('#onlyManagers').is(":checked")){
					var managerIndex = self.managersList.findIndex(x => x.id==event.userId);
					if(managerIndex == -1){
                        return false;
                    }
                }
                //add custom time format
                var start = convertOnlyTimeFromSqlToUsa($.fullCalendar.formatDate(event.start, "HH:mm")),
                        end = convertOnlyTimeFromSqlToUsa($.fullCalendar.formatDate(event.end, "HH:mm")),
                        startWithSec = $.fullCalendar.formatDate(event.start, "Y-MM-DD HH:mm:ss"),
                        endWithSec = $.fullCalendar.formatDate(event.end, "Y-MM-DD HH:mm:ss");

				var customTime = start + ' - ' +end;
                $(element).find('.fc-time').html(customTime);

                //add attributes for edit & remove
                $(element).attr('event-id', event.id).attr('editor-id', event.editorId).attr('user-id', event.userId);
				$(element).find('.fc-title').html('<span class="userName">'+event.userName+': </span>'+self.reverseStripTags(event.title));			

                //check if so short event
				var date_diff = (event.end.unix() - event.start.unix())/60;
				if(date_diff <= 5){
                    $(element).addClass('short_event');
                }

                //add custom colors
				if(event.editorId == self.thisUserId || self.is_admin == 1){
                    $(element).addClass('my_edit');
                }
				if(event.userId == self.thisUserId && !calendar.hasClass('employee_calendar')){
                    $(element).addClass('my_event');
                }
				if(event.userId == self.thisUserId && self.is_admin == 1){
                    $(element).addClass('admin_event');
                }

                //filter by user
                var userId = $('#usersList').val();
				if(userId != 0 && event.userId == userId){
                    return true;
				} else if(userId == 0){
                    return true;
                }
                return false;
            },
			eventAfterAllRender: function(view){
                self.openNotificationEvent();
                var userId = $('#usersList').val();
				if(view.name == 'month') {
					$.each(self.timeLimitList, function(key, item){
						if(item.userId == userId){
                            var startUSA = convertOnlyTimeFromSqlToUsa(item.start.substring(0, 5));
                            var endUSA = convertOnlyTimeFromSqlToUsa(item.end.substring(0, 5));
							$('.fc-day-top[data-date="'+item.date+'"]').append('<div class="work-time">'+startUSA+'-'+endUSA+'</div>');
							$('.fc-day[data-date="'+item.date+'"]').attr('data-start', item.date+' '+item.start).attr('data-end', item.date+' '+item.end);
                        }
                    });
					$.each(self.vacationList, function(key, item){
						if(item.userId == userId){
							$('.fc-day-top[data-date="'+item.date+'"]').find('.fc-day-number').append('<div class="vacation-time">Vacation</div>');
							$('.fc-day[data-date="'+item.date+'"]').attr('data-start', 0).attr('data-end', 0);
                        }
                    });


                } else {
					var moment = $('#calendar').fullCalendar('getDate').format('YYYY-MM-DD'); c(moment);
					var limitIndex = self.timeLimitList.findIndex(x => x.userId==userId && x.date==moment);
					if(limitIndex != -1){
						var limitData = self.timeLimitList[limitIndex]; c(limitData);
						$('tr[data-time="'+limitData.start+'"]').addClass('work-line');
						$('tr[data-time="'+limitData.end+'"]').addClass('work-line');
                    }
                }
                self.smallMobile = $(window).width() <= 360 && view.name == 'month' ? true : false;
            },
            viewRender: function(view){
				self.mobileView(view);
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
        var view = calendar.fullCalendar('getView');
        $("body").on({
			mouseenter: function(){
                if(self.smallMobile){return;}
                var userId = $(this).attr('user-id');
                var eventId = $(this).attr('event-id');
                var editorId = $(this).attr('editor-id');
				if($(this).text()!='' && !$('.removeIcon').length && (self.is_admin || self.thisUserId == editorId)){
                    $(this).append('<span class="removeIcon" onclick="calendarC.removeEvent(event)"><i class="fa fa-trash" aria-hidden="true"></i></span>');
                }
            },
            mouseleave: function () {
                if(self.smallMobile){return;}
                $('.removeIcon').remove();
            }}, 'a.fc-event,.fc-list-item');
    }
	this.errorInit = function(responce){ 
		c('errorInit');
		c(responce);
	}
    this.mobileView = function(view){ 
		if($(window).width() <= 768){
			$('.fc-listDay-button').show();
			$('.fc-agendaDay-button').hide();
			newView = view.name == 'agendaDay' ? 'listDay':view.name;
		} else {
			$('.fc-listDay-button').hide();
			$('.fc-agendaDay-button').show();
			newView = view.name == 'listDay' ? 'agendaDay':view.name;
		}
		$('#calendar').fullCalendar('changeView', newView);
	}
    
    this.reverseStripTags = function(str){ 
		return str.replace(/\0/g, '0').replace(/\\(.)/g, "$1");
	}
	this.drawEventForm = function(event){ c('drawEventForm');
		var onlyView = self.thisUserId == event.editorId || self.is_admin ? 0:1;
		var eventForm = '<form id="eventForm">';
		eventForm += '<div class="half_control"><label>Employee</label><input id="userName" name="userName" type="text" value="'+event.userName+'" disabled/></div>';
		eventForm += '<div class="half_control"><label>Author</label><input id="creatorName" name="creatorName" type="text" value="'+event.creatorName+'" disabled/></div>';
		eventForm += '<div class="half_control"><label>Start Time</label><input id="start" name="start" type="text" autocomplete="off" value="'+convertDateToUSA(event.start, true, true)+'" '+(onlyView ? 'disabled':'')+'/></div>';
		eventForm += '<div class="half_control"><label>End Time</label><input id="end" name="end" type="text" autocomplete="off" value="'+convertDateToUSA(event.end, true, true)+'" '+(onlyView ? 'disabled':'')+'/></div>';
		eventForm += '<label>Title</label><input id="title" name="title" type="text" value="'+self.reverseStripTags(event.title)+'" '+(onlyView ? 'disabled':'')+'/><br/>';
		if(onlyView){
			eventForm += '<label>Description</label><div id="description" name="description">'+self.reverseStripTags(event.description)+'</div>';
		} else {
			eventForm += '<label>Description</label><textarea id="description" name="description">'+self.reverseStripTags(event.description)+'</textarea>';
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
					eventForm += self.drawComment(item);
				});
			}
			eventForm +='</div>';
			eventForm += '<textarea id="newComment" placeholder="Add comment"></textarea>';
		}
		
		//button control
		eventForm += '<div class="control-buttons">';
		if(event.id == 0){
			var formTitle = 'Add Event';
			eventForm += '<button type="button" class="btn btn-default save_event" onclick="calendarC.editEvent('+(event.id !=0 ? 1:0)+')">Save</button>';
		} else if(!onlyView) {
			var formTitle = 'Edit event';
			eventForm += '<button type="button" class="btn btn-default add_comment" onclick="calendarC.addComment('+event.id+')">Add comment</button>';
			eventForm += '<button type="button" class="btn btn-default save_event" onclick="calendarC.editEvent('+(event.id !=0 ? 1:0)+')">Save</button>';
		} else {
			var formTitle = 'View event';
			eventForm += '<button type="button" class="btn btn-default add_comment" onclick="calendarC.addComment('+event.id+')">Add comment</button>';
		}
		//eventForm += '<button type="button" class="btn btn-default close-modal" data-dismiss="modal">Close</button>';
		eventForm += '</div>';
		eventForm += '</form>';
		showModal(formTitle, eventForm, 'edit_calendar_event');
		self.eventTimeControl();
	}
	this.eventTimeControl = function(){
		$('#start, #end').datetimepicker({
			format:'YYYY-MM-DD hh:mm:ss',
			dateFormat: 'mm-dd-yy',
			timeFormat: 'h:mm:00TT',
			showButtonPanel: false,
			showTimePicker: false,
			showSecond:false,
			stepMinute: 5
		});
	}

	this.addComment = function(eventId){ c('addComment');
		$('.add_comment').prop('disabled', true);
		var commentText = $('#newComment').val();
		commentText = commentText.replace(/<\/?[^>]+>/gi, '').replace(/^\s*(.*)\s*$/, '$1');
		if(commentText == '' || commentText.length > 1000){
			$('#newComment').addClass('error');
			$('.add_comment').prop('disabled', false);
			return false;
		}
		AjaxController('addCalendarComment', {creatorId:self.thisUserId, eventId:eventId, comment:commentText}, dashUrl, calendarC.addCommentHandler, calendarC.errorAddCommentHandler, true);
	}
	
	this.drawComment = function(item){ c('drawComment');
		var comment = '';
			comment += '<div class="comment"><div class="comment_info">';
			comment += '<span class="creator"><i class="fa fa-user-circle" aria-hidden="true"></i>'+item.userName+'</span>';
			comment += '<span class="createDate"><i class="fa fa-calendar-plus-o" aria-hidden="true"></i>'+timeFromSQLDateTimeStringToUSAString(item.dateTime, true)+'</span></div><br/>';
			var commentWithBrake = item.comment.replace(/\\n/g, "<br />");
			comment += '<div class="comment_body">'+self.reverseStripTags(commentWithBrake)+'</div></div>';
		return comment;
	}

	this.addCommentHandler = function(responce){ c('addCommentHandler');
		var comment = responce.data;
		var commentText = self.drawComment(comment);
		var editIndex = self.eventsList.findIndex(x => x.id==comment.eventId);
		self.eventsList[editIndex]['commentsList'].push(comment);
		
		$('#newComment').val('');
		$('.event_comments').append(commentText);
		var d = $('.event_comments');
		d.animate({ scrollTop: d.prop('scrollHeight') }, 0);
		$('.add_comment').prop('disabled', false);
	}
	this.errorAddCommentHandler = function(responce){ c('errorAddCommentHandler');
		$('.add_comment').prop('disabled', false);
		alertError($('.messages-container'), responce.message);
	}
	this.editEvent = function(newEvent = 0){ c('editEvent');
		$('.save_event').prop('disabled', true);
		var error = [];
		var paramObj = {};
		$.each($('#eventForm').serializeArray(), function(key, kv) {
			fieldValue = kv.value.replace(/<\/?[^>]+>/gi, '');
			if(self.validateEventInfo(kv.name, fieldValue)){
				error.push(kv.name);
			}
			paramObj[kv.name] = fieldValue;
		});
		
		//check start - end dates
		paramObj.start = self.LocalToUtc(paramObj.start, 'MM-DD-YYYY hh:mm:ssA'); c(paramObj.start);
		paramObj.end = self.LocalToUtc(paramObj.end, 'MM-DD-YYYY hh:mm:ssA'); c(paramObj.end);

		var checkStart = moment(paramObj.start).format(self.dateDiffFormat);  //moment(paramObj.start).toDate().valueOf() / 1000;
		var checkEnd = moment(paramObj.end).format(self.dateDiffFormat); //moment(paramObj.end).toDate().valueOf()/ 1000;
		if(checkStart >= checkEnd){
			error.push('start');
			error.push('end');
		} 
		var checkToday = moment().utc().format(self.dateDiffFormat);  //new Date().setHours(0,0,0,0).valueOf() / 1000; 
		if( checkToday > checkStart){
			error.push('start');
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
			paramObj['editorId'] = self.thisUserId;
			AjaxController('addCalendarEvent', paramObj, dashUrl, calendarC.addEventHandler, calendarC.errorAddEventHandler, true);
		} else {
			//check if no changes
			var isChanged = 0;
			var checkFields = ['title','description','start','end'];
			var editIndex = self.eventsList.findIndex(x => x.id==paramObj['id']);
			$.each(checkFields, function(key, field){  
				if(self.eventsList[editIndex][field] != paramObj[field]){ c(self.eventsList[editIndex][field]+'!='+paramObj[field]); 
					isChanged = 1;
				}
			})
			if(isChanged == 0){
				$('[data-dismiss="modal"]').click();
				return false;
			}
			AjaxController('updateCalendarEvent', paramObj, dashUrl, calendarC.updateEventHandler, calendarC.errorUpdateEventHandler, true);
		}
	}
	this.updateEventHandler = function(responce){ c('updateEventHandler')
		c(responce.data);
		var editIndex = self.eventsList.findIndex(x => x.id==responce.data.id);
		responce.data.start = self.sqlToLocalSql(responce.data.start);
		responce.data.end = self.sqlToLocalSql(responce.data.end);
		self.eventsList[editIndex] = responce.data;
		calendar.fullCalendar('refetchEvents'); 
		$('[data-dismiss="modal"]').click();
	}
	this.addEventHandler = function(responce){ c('addEventHandler')
		responce.data.start = self.sqlToLocalSql(responce.data.start);
		responce.data.end = self.sqlToLocalSql(responce.data.end);
		self.eventsList.push(responce.data);
		calendar.fullCalendar('refetchEvents'); 
		$('[data-dismiss="modal"]').click();
		alertMessage($('.messages-container'), 'Event was added', 3000);
	}
	this.errorAddEventHandler = function(responce){ c('errorAddEventHandler')
		c(responce);
		$('.save_event').prop('disabled', true);
	}
	this.errorUpdateEventHandler = function(responce){ c('errorUpdateEventHandler')
		alertError($('.messages-container'), responce.message);
	}	
	this.removeEvent = function(event){ c('removeEvent');
		$(event.target).hide();
                var eventId = $(event.target).parents('a').attr('event-id');
		AjaxController('removeCalendarEvent', {id: eventId}, dashUrl, calendarC.removeEventHandler, calendarC.errorRemoveEventHandler, true);
		event.stopPropagation();
	}
	this.removeEventHandler = function(responce){ c('removeEventHandler');
		c(responce.data);
		var removedId = responce.data;
		var editIndex = self.eventsList.findIndex(x => x.id==removedId);
		self.eventsList.splice(editIndex, 1);
		calendar.fullCalendar('refetchEvents'); 
	}
	this.errorRemoveEventHandler = function(responce){ c('errorRemoveEventHandler');
		alertError($('.messages-container'), responce.message);
	}
        this.setTimeLimit = function(viewDate){
		var view = calendar.fullCalendar('getView');
		var calendarMin = $('#calendar').fullCalendar('option', 'minTime'); c(calendarMin);
		var calendarMax = $('#calendar').fullCalendar('option', 'maxTime'); c(calendarMax);
		var setDafaultLimit = true;
		var userId = $('#usersList').val();
		if(userId!=0){
			var moment = viewDate ? viewDate : $('#calendar').fullCalendar('getDate').format('YYYY-MM-DD'); c(moment);
			var limitIndex = self.timeLimitList.findIndex(x => x.userId==userId && x.date==moment);
			if(limitIndex!=-1){
				var limitData = self.timeLimitList[limitIndex]; c(limitData);
				if(calendarMin!= limitData.start){
					$('#calendar').fullCalendar('option', 'minTime', limitData.start);
				}
				if(calendarMax!= limitData.end){
					$('#calendar').fullCalendar('option', 'maxTime', limitData.end);
				}
				setDafaultLimit = false;
			} 
		}
		c('setDafaultLimit='+setDafaultLimit);
		if(setDafaultLimit){
			if(calendarMin !='00:00:00'){ c('change minTime');
				$('#calendar').fullCalendar('option', 'minTime', '00:00:00');
			}
			if(calendarMax !='24:00:00'){ c('change maxTime');
				$('#calendar').fullCalendar('option', 'maxTime', '24:00:00');
			}
		}
	}
	this.filterManagers = function(){ 
                self.clearShedule();
		//self.setTimeLimit();
		calendar.fullCalendar('rerenderEvents');
	}
	this.filterPeriod = function(obj){ 
		$('.'+$(obj).val()).click();
	}
	this.onlyManagers = function(){ 
                self.clearShedule();
		//self.setTimeLimit();
		if($('#onlyManagers').is(":checked")){
                    $('#usersList option:selected').prop("selected", false);
                    $('option.my_calendar').hide();
                    $('.employeesList').hide();
		} else {
                    $('.employeesList').show();
                    $('option.my_calendar').show();
		}
		calendar.fullCalendar('rerenderEvents');
	}
        this.clearShedule = function(){ 
            $('.work-time, .vacation-time, .work-line').remove();
	}

	this.validateEventInfo = function(field_type, field_value){
		var error = 0;
		var regex = '';
			field_value  = $.trim(field_value);
		switch (field_type) {
			case 'title': 
				var regex = /^([ёЁа-яА-Яa-zA-Z0-9\-\,\.\;\:\'\s\/\(\)]){1,200}$/; break; 
			case 'description':
				var regex = /^[^\~]{1,2000}$/; break;
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
	this.sqlToLocalSql = function(dateTime){ 
		var localTime  = moment.utc(dateTime).toDate();
		localTime = moment(localTime).format('YYYY-MM-DD HH:mm:ss');
		return localTime;
	}
	this.LocalToUtc = function(dateTime, sourceFormat='YYYY-MM-DD HH:mm:ss', resultFormat='YYYY-MM-DD HH:mm:ss'){ 
		return moment(dateTime, sourceFormat).utc().format(resultFormat);
	}
        this.openNotificationEvent = function(){ 
            c('notificationEvent'); c(notificationEvent);
            if(notificationEvent){
                $('.fc-day-grid-event[event-id="' + notificationEvent + '"]').trigger('click');
                if(window.location.pathname == "/dash/calendar/"){
                    notificationEvent = false;
                }
            }
	}
    this.switchEmailNotification = function(){
		calendarEmailMode = $(this).attr('data-val');
		AjaxController('appUserInfoSave', {field: 'calendarEmailMode', value: $(this).attr('data-val')}, dashUrl, self.switchEmailNotificationHandler, errorBasicHandler, true);
    }
	this.switchEmailNotificationHandler = function(responce){
		c('switchEmailNotificationHandler');
	}
	this.showOptions = function(){
		var settings = '';
		settings += `<li style="padding: 10px;">
					<label style="font-family: Roboto;color: #768996;font-size: 13px;margin-bottom: 0;line-height: 13px;min-height: 13px;">Email Notifications</label>
					<div class="check_buttons_block" id="email_notifications" style="width: 100%;">
						<button onclick="doActive(this)" data-val="1" style="width: 50%;display: inline-block;height: 28px;padding-top: 7px;text-align: center;">On</button>
						<button onclick="doActive(this)" data-val="0" style="width: 50%;display: inline-block;height: 28px;padding-top: 7px;text-align: center;">Off</button>
					</div>
				</li>`;
        if ($('#calendar_options').length == 0){
            $('.body-panel-header').append(`<ul style="display:block;position: absolute;top: 50px;z-index:100;" class="dropdown-menu dropdown-menu-right dropdown-menu-actions-table-row" aria-labelledby="dropdownActionMenu_" id="calendar_options">
                <li class="bottom dropdown-arrow" style="left: 87%;"></li>
                ${settings}
            </ul>`)
            $('#calendar_options #email_notifications button').click(self.switchEmailNotification)

            if (calendarEmailMode == 1){
                $('#calendar_options #email_notifications button[data-val="1"]').addClass('active');
            } else {
                $('#calendar_options #email_notifications button[data-val="0"]').addClass('active');
            }
        } else {
			$('.body-panel-header').find('#calendar_options').remove();
		}
    }
}