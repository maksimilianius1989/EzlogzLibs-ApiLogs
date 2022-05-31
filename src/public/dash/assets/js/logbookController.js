var eld = false;
var isAobrd = false;
var offers_points = [],
    info_edits = {};
var userId = 0,
    trucks = [],
    trailers = [],
    drivers = [],
    states = [],
    docs = [];
var isLogbook = 1;
var edits_modal = {};
var cantEdit = false;


function changeLogDate(driverId, date, caller){ c('changeLogDate');c('driverId='+driverId);
    leaveEditMode();
    $('#pending_approvals').html('');
    date = convertDateToSQL(date);
    today_date_string = date;
    $('#date_left,#date_right').addClass('waiting');
    if(caller == 'trucks'){
            getTruckReport(date, $('#drivers_sec tr.active').attr('data-truckId'), driverId, driversPageHandler);
    }
    svg = document.getElementById("logBook");
    $(svg).find(".working_line, .working_number").remove();
    var dates = date;
    originalLogbook = typeof originalLogbook == 'undefined' ? false :originalLogbook;
    data = {data:{action: 'apiGetLogbook', driverId:driverId, date:date, originalLogbook:originalLogbook}};
    AjaxController('recalculateUserStatuses', data, apiLogbookUrl, logbookController_recalculateUserStatusesHandler, logbookController_recalculateUserStatusesHandler, true);
    if(caller == 'log' && $('#log_box').attr('data-st') == 'status'){
        data.data.driverStatus = 'true';
    }
    $('.day_alert').remove();
    //fix error on safety page no driverId
    //if(driverId != 'undefined' && typeof driverId != 'undefined'){
    //	return false;
    //}
    $.ajax({
        url:MAIN_LINK+'/db/dashController/' + '?' + window.location.search.substring(1),
        method:"POST",
        contentType: "application/json", // send as JSON
        data:JSON.stringify(data),
        success: function(data){
            $('#log_list tbody').empty();
            $('#log_list .day_alert').remove();
            $(svg).find(".working_line, .working_number").remove();
            var response = jQuery.parseJSON(data);
            if(response.code == '000'){  c(response.data); c('response.data.length > 0 ='+response.data.length > 0);
                isLogbook = 1;
                cantEdit = response.data.cantEdit;
                isAobrd  = response.data.aobrd;
                var terminated = response.data.terminated;
                $('#terminated').remove();
                if(terminated){
                    $('#select_carrier').val(-1);
                    $('#log_nav .log_nav_hd.subhead.section-heading').append('<span id="terminated"> Terminated User '+response.data.terminatedLast+' '+response.data.terminatedName+'</span>');
                }
                userId = driverId;
                eld = response.data.eld;
                var alerts = response.data.alerts;
                
                if(alerts.length > 0){
                    $.each(alerts, function(key, alert){
                        if(alert.alertId == 9 || alert.alertId == 10)
                            $('#log_list').prepend(`<p class="day_alert">${alert.note}</p>`)
                    });
                }
                driverTimeZone = response.data.timeZone + summerTime;
                var points = [];
                var edits_offers = {};
                today_date_string = dates;
                var restart34Hours = 0;
                originStatuses = response.data.statuses;
                var firstDay = response.data.firstDay;
                if(typeof firstDay != 'undefined' && firstDay.length > 0){
                    var firstDayDate = response.data.firstDay[0].date;
                    $('#datepicker').datepicker('option', 'minDate', new Date(parseDate(firstDayDate)));
                }
                var edits_offers = JSON.parse(response.data.edits_offers);
                info_edits = JSON.parse(response.data.info_edits);

                c('statuses-->'); c(response.data.statuses);
                c('edits_offers-->'); c(edits_offers);
                c('info_edits-->'); c(info_edits);
                $("#show_info_edits").remove();
                drawInfoEdits(info_edits);	

                points = calculatePoints(dates, caller, response.data.statuses, 0);
                offers_points = [];
                offers_points.push({id: 0, points: points});
                $.each(edits_offers, function(key, offer){
                    offers_points.push({id:key, points:calculatePoints(dates, caller, offer, offers_points.length, key)});
                });
                var hours = {on:0,off:0,sb:0, dr:0}
                var hoursSec = {on:0,off:0,sb:0, dr:0}
                log_number = 1;
                var segments = []; 
                drawLogbookFromPoints(points, segments)
                for(var x = 0; x < points.length; x++){
                    var point = points[x]; 
                    if(eld){
                        hours[point.status]+=point.durationH*60 + toInt(point.durationM) + toInt(point.durationS/60);
                        hoursSec[point.status]+=toInt(point.durationH)*3600 + toInt(point.durationM)*60 + toInt(point.durationS);
                    }else
                        hours[point.status]+=point.durationH*60 + point.durationM*15;
                    check34restart(point);
                    if(x == points.length-1 && notEnds(point.hours, point.mins, point.durationH, point.durationM)){
                        checkFutureActions(point, restart34Hours);
                    }
                } 
                original_points = points;
                originalSegments = JSON.parse(JSON.stringify(segments));
                
                cancelEdit()
                $('#edit_button').remove();
                $('#pending_approvals_button, #return_original').remove();
                $('#log_book').attr('style', '');
                var padding_top = 0;
                if(USER_SETTINGS.InspectionMode != '1' && count(offers_points) > 1){
                    $('#log_book').append('<button id="pending_approvals_button" class="ez_button status_edit_button" data-toggle="modal" data-target="#pending_approvals_modal">Pending Approvals</button>'); 
                    padding_top = 1;
                }
                if(USER_SETTINGS.InspectionMode != '1' && userRole == 1 && (((window.location.pathname == "/dash/history/log/" || window.location.pathname == "/dash/views/dispatcher/log/") && !originalLogbook)  || window.location.pathname == "/dash/drivers/")){
                    $('#log_book').append('<button id="edit_button" style="'+(count(offers_points) > 1 ? 'left:150px' : 'left:0px')+'; '+(window.location.pathname == "/dash/views/dispatcher/log/" ? 'display:none;' : '')+'" class="ez_button status_edit_button" onclick="enterEditMode(this);">Correction & Annotation</button>');
                    padding_top = 1;
					if(window.location.pathname == "/dash/history/log/"){
						$('#edit_button').hide();
					}
                }
                if(USER_SETTINGS.InspectionMode != '1' && (window.location.pathname == "/dash/history/log/" || window.location.pathname == "/dash/views/dispatcher/log/") && !$('.origin_button').length && (getCookie('dashboard') != 'driver' && getCookie('role') == 1) ) {
                    $('#log_book').append('<button class="ez_button origin_button" onclick="showOriginalLogbook()"><img title="Show original option can be disabled in settings" src="/dash/assets/img/show_original.png" alt="Show Original" /></button>');
                    padding_top = 1;
                }

                if(padding_top || $('.origin_button').length){
                        $('#log_book').css('padding-top', '50px');
                }
                statusArea.fillArea(originalSegments);
                initLogbookEditInput();
                addTimeControl();
                if (isAobrd){
                    setLogTime('hours_sb', hoursSec.sb, true, false);
                    setLogTime('hours_on', hoursSec.on, true, false);
                    setLogTime('hours_off', hoursSec.off, true, false);
                    setLogTime('hours_dr', hoursSec.dr, true, false);
                    totalSec = hoursSec.sb + hoursSec.on + hoursSec.off + hoursSec.dr;
                    setLogTime('hours_total', totalSec, true, false);
                }
                else if (eld){
                    setLogTime('hours_sb', hoursSec.sb, true);
                    setLogTime('hours_on', hoursSec.on, true);
                    setLogTime('hours_off', hoursSec.off, true);
                    setLogTime('hours_dr', hoursSec.dr, true);
                    totalSec = hoursSec.sb + hoursSec.on + hoursSec.off + hoursSec.dr;
                    setLogTime('hours_total', totalSec, true);
                }else{
                    setLogTime('hours_sb', hours.sb);
                    setLogTime('hours_on', hours.on);
                    setLogTime('hours_off', hours.off);
                    setLogTime('hours_dr', hours.dr);
                    total = hours.sb + hours.on + hours.off + hours.dr;
                    totalSec = hoursSec.sb + hoursSec.on + hoursSec.off + hoursSec.dr;
                    setLogTime('hours_total', total);
                }
                drawMapRoute(response, points);
                
            }
            if($('#date_left').hasClass('loadingPart') || $('#date_right').hasClass('loadingPart')){
                $('#date_left, #date_right').removeClass('loadingPart')
            } else {
                $('#date_left,#date_right').removeClass('waiting');
                $("#date_right, #date_left").prop("disabled", false);
                if($('#date_left').attr('data-page') == 'log'){
                    if($("#cur_day").text() == 1){
                        $('#date_right').addClass('waiting');
                    }
                    if(parseInt($("#cur_day").text()) == parseInt($("#tot_days").text())){
                        $('#date_left').addClass('waiting');
                    }
                }
            }
        }
    })
}
function logbookController_recalculateUserStatusesHandler(response) {
    
}
function drawMapRoute(response, points){
    deleteMarkers();
    resultsMap = document.getElementById("googleMap");
    geocoder = new google.maps.Geocoder();
    var locations = []; 

    
    for(var x = 0; x < points.length; x++){
        var point = points[x];
        if(typeof point.lt == undefined || typeof point.lng == undefined){continue;}
        var pos = {};
        pos.lt = point.lt;
        pos.lng = point.lng;
        if(point.lt != '' && point.lt != 'null' && point.lt != null){
            locations.push(pos);
        }
    };
    if(typeof map !== 'undefined')
        directionsDisplay.setMap(map);
    if(locations.length > 0){
        if(typeof map !== 'undefined')
        makeRoute(map, locations);
    }else{
        deleteMarkers();
    }
}
function violationTriangleBox(el){
    var errorsText = '';
    var errorsNum = 0;
    if($(el).attr('data-14') == '14'){
        numbers = getViolationsNumbersFromCycleId(driverCycle);
        errorsText+='<p>'+numbers['shiftHours']+' hours work limit</p>';
        errorsNum++;
    }
    if($(el).attr('data-c') == 'c'){
        errorsText+='<p>cycle limit</p>';
        errorsNum++;
    }
    if($(el).attr('data-11') == '11'){
        numbers = getViolationsNumbersFromCycleId(driverCycle);
        errorsText+='<p>'+numbers['driveHours']+' hours drive limit</p>';
        errorsNum++;
    }
    if($(el).attr('data-8') == '8'){
        errorsText+='<p>8 hours drive limit. 30 minutes break required</p>';
        errorsNum++;
    }
    if($(el).attr('data-c24') == 'c24'){
        errorsText+='<p>Canada 24 hours break required</p>';
        errorsNum++;
    }
    $('svg#logBook').after('<div id="violations_box">'+errorsText+'</div>');
    var h = 16+errorsNum*42;
    $('#violations_box').css({height: h+'px', top: '32px'});
}
function violationTriangleBoxClose(){
    $('#violations_box').fadeOut(300, function(){
        $(this).remove();
    })
}
function choseSegmentClicked(relX){
    var clickedSegment = {};
    for(var x = 0; x < statusArea.segments.length; x++){	
        var segment = statusArea.segments[x];
        if(relX >= segment.x1 && relX <= segment.x2){
            clickedSegment = segment;
            break;
        }
    }
    return clickedSegment;
}
function initLogbookEditInput(){
    var pt = svg.createSVGPoint();
    $('#log_book').on('click', '#logBook', function(event){
        if(new_mode){
            saveCurrentNewStatusAsReal();
            c('after  saveCurrentNewStatusAsReal')
            c(statusArea.statuses)
        }
        new_mode = false;
        $('.add_status').attr('disabled', false);
        var loc = cursorPoint(pt, event);
        var relX = loc.x;
        var segmentClicked = choseSegmentClicked(relX)
        c('segmentClicked');
        c(segmentClicked);
        //if(!new_mode){
        c('before ceateArea')
        c(statusArea.statuses)
		c(statusArea.segments)
		statusArea.createArea(relX);
		c('after ceateArea')
        c(statusArea.statuses)
		c(statusArea.segments)
        //}
    });

    $('body').on('mousedown','.drag', function() {
        console.log('drag')
        var direction = $(this).attr('dir');
        document.onmousemove = function(event) {
            console.log('onmousemove')
            var loc = cursorPoint(pt, event),
            relX = loc.x; 
            if(!new_mode){
                statusArea.moveArea(direction, relX);  
            } else {
                newArea.moveArea(direction, relX); 
            }
        };
        document.onmouseup = function() {
            console.log('onmouseup')
            document.onmousemove = document.onmouseup = null;
        };
        return false;
    });

    $('body').on('dragstart','.drag',function() {
        return false;
    });

    $('#log_st_buttons').on('click','.edit_status', function(){
        var new_status = $(this).attr('status');
        if(!new_mode){
            statusArea.changeStatus(new_status);
        } else {
            newArea.changeStatus(new_status);
        }
    });
}
function calculatePointCoordinates(point){
	
    var row = 0;
    var special = '';
    var x1 = 0;
    var x2 = 0;
    var y = 0;
    if(point.status == 'on'){
        row = 3;
        special = point.special == 1 ? 'stroke-dasharray: 2, 2;' : '';
    }else if(point.status == 'off'){
        row = 0;
        special = point.special == 1 ? 'stroke-dasharray: 2, 2;' : '';
    }else if(point.status == 'sb'){
        row = 1;
    }else if(point.status == 'dr'){
        row = 2;
    }

    var w = 31;
    var h = 14;
    var lengthH = point.durationH;
    var lengthM = point.durationM;
    var lengthS = parseInt(point.durationS);
    var startH = point.hours;
    var startP = point.startP;
    var startS = parseInt(point.seconds);

    var endH = parseFloat(lengthH) + parseFloat(startH);
    var endP = parseFloat(lengthM) + parseFloat(startP);
    var endS = parseFloat(lengthS) + parseFloat(startS);

    if(eld){
        x1 = toFixedFloat((startH+startP/60 + startS/3600)*w, 5); 
        x2 = toFixedFloat((endH+endP/60 + endS/3600)*w, 5); 
    } else {
        x1 = toFixedFloat((startH+startP/4)*w, 5);
        x2 = toFixedFloat(x1 + (lengthH+lengthM/4)*w, 5);
    }

    y = h + row*2*h;
    point.svgX1 = x1;
    point.svgX2 = x2;
    point.svgY = y;
    point.svgSpecial = special;
}
function calculatePoints(dates, caller, items, edits, editId){
	c('calculatePoints')
    if(edits >= 1){
        var editor = items['editor'];
        var statuses = items['statuses'];
    } else {
        var statuses = items;   
    }
    var points = [];
    var restart34Hours = 0;
    var d = new Date(dates);
    d.setTime( d.getTime() + d.getTimezoneOffset()*60*1000 );
    d.setHours(0,0,0,0);
    var date = dates + ' 00:00:00';
    var counter = 0;
    var statusesCount = statuses.length;
    //Calculate all points and their durations
    if(statusesCount > 0){
        if(edits >= 1){
            var table_header_tr = '<th>№</th><th>Status</th><th>Start(PDT)</th><th>Duration</th><th>Annotation</th>';
            //$('#log_list').find('.first_tr_row').html();
            var statuses_table = '<table class="table table-striped table-dashboard table-sm mobile_table ez_table ez_table_'+edits+'"><thead>'+table_header_tr+'</thead><tbody></tbody></table>';
            var edits_str = '<div id="offer_'+edits+'" class="offer">';
                edits_str += '<div class="offer-header" id="heading_'+edits+'">';
                edits_str += '<h5 class="mb-0"><div id="offer_title_'+edits+'" class="offer_row_title collapsed" data-toggle="collapse" data-target="#collapse_'+edits+'" aria-expanded="false" aria-controls="collapse_'+edits+'">Offer by '+editor+' №'+editId+'</div>';
                //edits_str += '<h5 class="mb-0"><button id="offer_title_'+edits+'" class="offer_title collapsed" data-toggle="collapse" data-target="#collapse_'+edits+'" aria-expanded="false" aria-controls="collapse_'+edits+'">Offer by '+editor+' №'+edits+'</button>';
                edits_str += '<span class="delate_offer blue-border" onclick="removeEditOffers('+edits+');">Remove</span>';
                edits_str += '<span class="view_offer blue-border" onclick="viewOffer('+edits+');">View</span></h5></div>';
                edits_str += '<div id="collapse_'+edits+'" class="collapse" aria-labelledby="heading'+edits+'" data-parent="#accordion">';
                edits_str += '<div class="offer-body">'+statuses_table+'</div></div></div>';
            $('#pending_approvals').append(edits_str);
        }
        statuses.sort(function(a, b) {
            return new Date(a.dateTime)-new Date(b.dateTime);
        });
        for(var x = 0; x < statuses.length; x++){
            counter++;
            var st = statuses[x];//get status
            var dt = st.dateTime;//get dateTime
            var duration = 0;//st.length;//get duration
            var lng = st.lng;//get longitude
            var lt = st.lt;//get latitude
            var message = st.message;//get message
            var position = st.position;//get position
            var odo = st.odo;//get odometer
            var status = getStatusFromId(st.status);//get status
            var special = st.special; 
            var restartFromStatusStart = false;
            restart34Hours = st.restart34;
            var diff = d - new Date(dt.replace(/-/g,'/'));//check if status is for today
			var coming_from_prev_day = false;
            if(diff > 0){
                restart34Hours-=diff/1000;  
				coming_from_prev_day = true;
            }
            if(x == 0){//if its the first status for today
                if(statusesCount == 1){ // if there's only one status
                    duration = 24*60*60; //set it to the whole day
                }else{//else set duration up to the next status
                    var nextStatusTime = statuses[x+1].dateTime;//get next status time

                    if(diff <= 0){
                        var diffTime =new Date(nextStatusTime.replace(/-/g,'/')) - new Date(dt.replace(/-/g,'/')) ; //get difference in ms
                    } else {
                        var nt = convertUSADate(nextStatusTime);
                        if(d.getTimezoneOffset() != nt.getTimezoneOffset()){
                                var tzdiff = (nt.getTimezoneOffset()-d.getTimezoneOffset())*60*1000
                                nt.setTime( nt.getTime() - tzdiff );
                        }
                        var diffTime = nt - d; //get difference in ms
                    }
                    duration = diffTime/1000;//change to seconds
                }
                if(diff > 0){//if its earlier -then its previous day
                    dt = date;//set to beginning of the day
                    message = ''; // remove previous message
                }
                // the first status (technical) 12:00:00AM 
                if (duration == 0 && dt.indexOf('00:00:00') == 11){
                    continue;
                }
            }else{
                if(statusesCount != 1 && statusesCount != x+1){//if its not the first status and not the last
                    var dt2 = statuses[x+1].dateTime;//get dateTime of the next status
                    var diffTime = new Date(dt2.replace(/-/g,'/')) - new Date(dt.replace(/-/g,'/')); //get difference from last status till now in ms

                    duration = diffTime/1000;//change to seconds
                }
            }
            if(statusesCount == x+1){//if its the last status
                var d1 = new Date();
                if(!todaysDate){
                   todaysDate = new Date(d1.valueOf() + d1.getTimezoneOffset() * 60000 - (driverTimeZone)*60 * 60000); 
                }
                if(d.setHours(0,0,0,0) == todaysDate.setHours(0,0,0,0)){//if its today - set up till now
                    todaysDate = new Date(d1.valueOf() + d1.getTimezoneOffset() * 60000 - (driverTimeZone)*60 * 60000);
                    var diffTime = todaysDate - new Date(dt.replace(/-/g,'/')); //get difference from last status till now in ms
                    duration = diffTime/1000;//change to seconds

                }else{//else up to the end of the day
                    var endTime = d;//copy the date 
                    endTime.setHours(24,0,0,0);//set to next day midnight
                    var diffTime = endTime - new Date(dt.replace(/-/g,'/'));//get difference in ms
                    duration = diffTime/1000;//change to seconds
                    todaysDate = false;
                    // the last status (technical) 12:00:00AM 
                    if (duration == 0 && dt.indexOf('00:00:00') == 11){
                        continue;
                    }
                }
            }
            if(duration > 24*60*60)
                duration = 24*60*60;

            if(st.status != 0 && st.status != 1){
                if(restart34Hours > 0){
                    restart34Hours-=duration;
                    if(restart34Hours <= 0){
                        restartFromStatusStart = duration + restart34Hours;
                    }
                }
            }
            duration = duration < 0 ? 0 : duration;
            var durationDisplay = getDurationFromSec(duration, false, (isAobrd ? false : true));
            duration = getDurationFromSec(duration, false, true);//change duration from seconds into hours / minutes
            //add row into statuses table
            if(caller != 'trucks'){
                var driveTime = getDurationFromSec(st.drive, true);
                //c(driveTime);
                var shiftTime = getDurationFromSec(st.shift, true);
                var cycleTime = getDurationFromSec(st.cycle, true);
                if(driveTime.indexOf('-') > -1){
                    driveTime = '<span class="error">'+driveTime.replace("-", "")+'<span>';
                }
                if(shiftTime.indexOf('-') > -1){
                    shiftTime = '<span class="error">'+shiftTime.replace("-", "")+'<span>';
                }
                if(cycleTime.indexOf('-') > -1){
                    cycleTime = '<span class="error">'+cycleTime.replace("-", "")+'<span>';
                }
                var editAnnotation = typeof st.editAnnotation == 'undefined' ? '' : st.editAnnotation;		
                var status_tr = '<tr onclick="editStatusClick(this);" onmouseover="drawStatusIllumination(this)" onmouseout="drawStatusIlluminationOff()" data-start="'+dt.substr(11)+'" id="'+st.id+'">;'+
                    '<td>'+counter+'</td>'+
                    '<td class="duty "><div class="inner_status_color '+status+'">'+status+'</div></td>'+
                    '<td>'+convertOnlyTimeFromSqlToUsa((isAobrd ? dt.substr(11, 5) : dt.substr(11)))+'</td>'+
                    '<td>'+durationDisplay+'</td>';
				if(edits){status_tr += '<td>'+editAnnotation +'</td>';}
                if(!edits){ 
                    status_tr +='<td>'+position+'</td>'+
                    '<td>'+message+'</td>'+
                    '<td class="availbl">'+driveTime+'</td>'+
                    '<td class="availbl">'+shiftTime+'</td>'+
                    '<td class="availbl">'+cycleTime+'</td>';
				}
                status_tr += '</tr>';
                
                if(!edits){
                    $('#log_list tbody').append(status_tr);
                } else {
                    $('#pending_approvals').find('.ez_table_'+edits).find('tbody').append(status_tr);
                }
            }
            var docId = !edits && st.documents.length!=0 ? st.documents[0].id : false;
            $('.on_edit').hide();
            var point = {
				coming_from_prev_day:coming_from_prev_day,
                status:status,
                time:dt,
                drive:st.drive,
                shift:st.shift,
                hadCan24Break:st.hadCan24Break,
                shiftWork:st.shiftWork,
                eight:st.eight,
                cycle:st.cycle,
                duration:duration, 
                location: position,
                position: position,
                lng:lng,
                lt:lt,
                odo:odo,
                message:message,
                editAnnotation: '',
                restartFromStatusStart:restartFromStatusStart,
                special:special,
                id:st.id,
                dateTime:st.dateTime,
                docId: docId,
                documents: st.documents
            };
            
            points.push(point); 
        }
    }
    
    //Clear last logbook lines
    $('#log_book').find('.g_line').remove();
    $('#log_book').find('.v_line').remove();
    var previousChanged = false;
    var previousStartH = false;
    var previousStartM = '';
    
    for(var x = 0; x < points.length; x++){
        var point = points[x];
        point.time = point.time.slice(-8);;
        point.hours = parseInt(point.time.slice(0, 2));
        point.mins = parseInt(point.time.slice(3, 5));
        point.seconds = parseInt(point.time.slice(6, 8));
        if(previousStartH == false){
            previousStartH = point.hours;
            previousStartM = point.mins;
        }else{
            if(!eld && previousStartH == point.hours && previousStartM == point.mins){
                points.splice(x-1, 1);
            }
            previousStartH = point.hours;
            previousStartM = point.mins;
        }
    }
    
    for(var x = 0; x < points.length; x++){
        var point = points[x];
        if(x == 0){
            point.start = true;
        }
        point.time = point.time.slice(-8);
        point.hours = parseInt(point.time.slice(0, 2));
        point.mins = parseInt(point.time.slice(3, 5));
        
        if(eld){
            point.startP = parseInt(point.mins);
        } else {
            if(point.mins%15 != 0){
                point.mins = point.mins - point.mins%15;
            }
            point.startP = parseInt(point.mins)/15;
        }
        
        var durations = point.duration.split(" ");
        durations[0] = durations[0].replace(/\D/g,'');
        durations[1] = durations[1].replace(/\D/g,'');
        point.durationH = durations[0]/1;
        point.durationM = durations[1];
        point.durationS = typeof durations[2] != 'undefined' ? durations[2].replace(/\D/g,'') : '00';
        
        var hadChanged = false;
        
        if(previousChanged){
            point.durationM = parseInt(point.durationM) + parseInt(15); //TODO: why? 
            hadChanged = true;
        }
        if(!eld && point.durationM%15 != 0){ 
            point.durationM = point.durationM - point.durationM%15;
            previousChanged = true;
            if(hadChanged){
                previousChanged = false;
            }
        }else{
            previousChanged = false;
        }
        if(!eld){ 
            point.durationM = point.durationM/15;
        }
        calculatePointCoordinates(point)
    }
    return points;
}

function saveLogbookHandler(responce) { 
    //$('#edit_main_info').click();
	if((responce.data.changedStatuses && Object.keys(responce.data.changedStatuses).length > 0) || (responce.data.offers && Object.keys(responce.data.offers).length > 0)){
		editHandler({'data':responce.data.changedStatuses})
	}
    if(responce.data.approve){
		var active_driver = $('#select_carrier option:selected'),
			driverId = active_driver.attr('data-driverid'),
			date = $('#datepicker').val(),
			driver_name = responce.data.offers.driver;
		if(typeof driver_name!== 'undefined'){
			active_driver.text(driver_name);
		}
		
        changeLogbook()
    } else if(responce.data.offers){ 
        var edit_rows = '';
        $.each(responce.data.offers, function(key, edit){
            info_edits[key] = edit;
        });
		edit_lists = {vehicle:[], trailers:[], docs:[]};
        drawInfoEdits(info_edits);
		$('#edit_confirmation').remove();
        $('.edit_info').append('<div id="edit_confirmation">Edits saved</div>');
        setTimeout("$('#edit_confirmation').remove();", 4000);
		$('#save_info').attr('disabled',false);
    }
}

function saveLogbookHandlerError(responce) { 
	$('#save_info').attr('disabled',true);
	showModal('Error on Edit', responce.message, 'basicModal');
    return false;
}

function moveStatusMarker() { 
      var location = $('#mapBlock div a')[0].href,
            stringLocStart = location.indexOf("ll="),
            stringLocFinish = location.indexOf("&"),
            locationName = '';
        location = location.slice(stringLocStart + 3, stringLocFinish);
        var locationArr = location.split(","),
            lat = locationArr[0],
            lng = locationArr[1],
            latlng = new google.maps.LatLng(lat, lng),
            geocoder = new google.maps.Geocoder;
        if(!location){
            return false;
        }
        
        $('#longitude').val(lng).trigger('change');
        $('#latitude').val(lat).trigger('change');
        
        geocoder.geocode({latLng:latlng, language:"en"}, function (results, status) {
            if (status == 'OK' && results.length > 0) {
                //c(results[0].address_components);
                var locationName = '',
                    locationArr = [];
                if (isAobrd || !eld) {
                    $.each(results[0].address_components, function(k, v){
                        if (v.types[0] == 'administrative_area_level_1') locationArr[0] = v.long_name;
                        else if (v.types[0] == 'locality') locationArr[1] = v.long_name;
                    });
                    locationName = locationArr.join(', ');
                }
                else locationName = results[0].formatted_address; //full address
                $('#location_name').val(locationName).trigger('change');            
            } else{
                // Адрес не найден
            }
        });
 } 
function convertXCoordToTime(x, sec, usa_format = false){
    var time = '';
    var svg_width = $(svg).attr('width'),
        s = 24*60*60*x/svg_width,
        date = new Date(s * 1000),
        hh = date.getUTCHours(),
        mm = date.getUTCMinutes(),
        ss = date.getSeconds();

    if (hh < 10) {hh = "0"+hh;}
    if (mm < 10) {mm = "0"+mm;}
    if (ss < 10) {ss = "0"+ss;}

    var time = hh+":"+mm+(sec ? ":"+ss : "");
    if (usa_format) time = convertOnlyTimeFromSqlToUsa(time, false);
    return time;
}

function convertTimeCoordToX(xTime){ //c(xTime);
    var xTime_arr = xTime.split(':'),
        h = parseInt(xTime_arr[0]),
        m = parseInt(xTime_arr[1]),
        s = xTime_arr.length >= 2 ? parseInt(xTime_arr[2]) : 0,
        s_time = s + m*60 + h*60*60,
        svg_width = $(svg).attr('width'),
        x = s_time*svg_width/(24*60*60);
        x = toFixedFloat(x, 5);
        //c('xTime_arr');
        //c(xTime_arr);
    return x;
}
editMode = false;
function enterEditMode(){
	if(cantEdit){
		showModal('Cannot Edit', 'Driver option to edit logbook currently turned on, turn it off to be able to edit driver logbook <button class="btn btn-default" style="position: absolute;bottom: 0;right: 20px;" onclick="turnOffDriverEditMode('+originStatuses[0].userId+')">Turn Off Driver Edit</button>', 'basicModal');
		return false;
	}
    resetLogbook();
    $('#edit_button').text('Cancel Edit');
    $('#edit_button').attr('onclick','leaveEditMode()')
    $('.on_edit').show();
	var lft = ($('#edit_button').length && $('#edit_button').is(':visible') ? ($('#edit_button').position().left + $('#edit_button').width() + 40) : 0);
	if ($('#pending_approvals_button').length && !lft) lft = lft + $('#pending_approvals_button').position().left + $('#pending_approvals_button').width() + 40;
	$('#log_book').append('<button id="add_button" onclick="addStatus()" class="add_status ez_button status_edit_button" style="left:'+(lft)+'px; ">Insert Duty Status</button>');
    
    editMode = true;
    checkOriginButton();
	statusArea.initEdit()
	$('#log_list, #log_book').addClass('edit_active_box');
	$('tr.editing').removeClass('editing')
}
function leaveEditMode(){c('leaveEditMode');
	cancelEdit()
	$('#edit_button').text('Correction & Annotation');
	$('#edit_button').attr('onclick','enterEditMode()');
	$('#add_button').remove();
	$('#return_original').remove();
	$('#sendLogLocation.active').click();
	statusArea.originalSegments = JSON.parse(JSON.stringify(statusArea.veryOriginalSegments))
	statusArea.segments = JSON.parse(JSON.stringify(statusArea.veryOriginalSegments))
        newArea.created = false;
        //statusArea.originalSegments = JSON.parse(JSON.stringify(statusArea.veryOriginalSegments))
	//statusArea.segments = JSON.parse(JSON.stringify(statusArea.veryOriginalSegments))
	editMode = false;
	$('.on_edit').hide();
	//c(statusArea);
  new_mode = false;
	if($('#edit_main_info').hasClass('edit_active')){
		editFields();
	}
	$('#log_list, #log_book').removeClass('edit_active_box');
}
function cancelEdit(){
    $('.offer_title').remove();
    $('.add_status').attr('disabled', false);
    $('#edit_buttons').remove();
    $(".statusArea, .area_tooltip, .area_time, .area_stroke_line, .working_line.second").remove();
    $('#log_control').hide();
    if(count(offers_points) < 2){
        $('#pending_approvals_modal').modal('hide');
        $('#pending_approvals_button').remove();
        $('#edit_button').css('left','0px');
    }
    statuses = [];
    statusArea.statuses = [];
	
}
function editHandler(response){
	c('editHandler')
    //c(response);
	var head = `Edit Approval`;
	
	var content = `<center>The revised logs have been sent to the driver, please wait for the drivers approval message.<br>
You'll receive an alert notification once approved or rejected</center>`;
	
	var edits_offers = response.data;
	c(edits_offers);
		if(edits_offers.length == 0){//was direct edit without approval
			changeLogbook();
			var content = `<center>The revised logs have been saved, untill the next app update for the correct work of the driver logbook - ask driver to relogin</center>`;
			if(isAobrd){
				head = `Correction Saved`;
				content = `<center>You have successfully saved the corrected Logs. The driver will get a pop up 	notification to sign the corrected log. Pls make sure the driver signs the logs, by doing so they will be 
					re-certify. </center>`;
			}
			generateDashPopup(head, content, '584px');
			return false;
		}
	if(isAobrd){
		head = `Correction Saved`;
		content = `<center>You have successfully saved the corrected Logs. The driver will get a pop up 	notification to sign the corrected log. Pls make sure the driver signs the logs, by doing so they will be 
		re-certify. </center>`;		
	}
	generateDashPopup(head, content, '584px');
        if(isAobrd){
            return false;
	}
        var date = $('#datepicker').val()
        
        var old_originStatuses = JSON.parse(JSON.stringify(originStatuses));
        var new_offer = [];
        $.each(old_originStatuses, function(oldKey, old){
            var element_exist = 0;
            $.each(edits_offers, function(key, offer){
                $.each(offer.statuses, function(skey, status){
                    if(old.id == status.statusId){
                        element_exist = 1;
                        return false;
                    }
                    var today_date = new Date(date);
                    var date1 = new Date(old.dateTime);
                    var date2 = new Date(status.dateTime);
                    
                    //c('today_date'); c(today_date);
                    //c('date1');c(date1);
                    //c('date2');c(date2);
                    //c('$.inArray(status, new_offer)');c($.inArray(status, new_offer));
                    if(date1 <= date2 && date2.getTime() == today_date.getTime()){
                        element_exist = 1;
                        return false;
                    }
                    if($.inArray(status, new_offer)==-1 && !status.deleted){
                        new_offer.push(status); 
                    }
                });
            });
            if(!element_exist){
                new_offer.push(old); 
            }
        }); 
        //c('new_offer');
        //c(new_offer);
        $.each(edits_offers, function(key, offer){
            offer.statuses = new_offer;
            //offers_points[key] = calculatePoints(today_date_string, $('#date_left').attr('data-page'), offer, key);
            var points = calculatePoints(today_date_string, $('#date_left').attr('data-page'), offer, offers_points.length, key);
            offers_points.push({id:key, points: points});
        });

        if(count(offers_points) > 1 && !$('#pending_approvals_button').length ){
            var pending_approvals_button = '<button id="pending_approvals_button" class="ez_button status_edit_button" data-toggle="modal" data-target="#pending_approvals_modal">Pending Approvals</button>';
            $('#edit_button').before(pending_approvals_button);
            $('#edit_button').css('left', '150px'); 
        }
        //c('offers_points');
        //c(offers_points);
}

function getStatusesForSave(){
    $('#editAnnotation').removeClass('error');
    var editAnnotation = $('#editAnnotation').val().trim();
    if($('#annotation_select').val()==-1 && (editAnnotation=='' || editAnnotation.length > 60)){
            $('#editAnnotation').addClass('error');
            return false;
    }
    var editAnnotation = $('#editAnnotation').val();
    var edits = [];
    var page_date = new Date(today_date_string);
    $('#edit_buttons').remove();
    $(".statusArea, .area_tooltip, .area_time, .working_line.second").remove();
    
    old_originStatuses = JSON.parse(JSON.stringify(originStatuses));
    if(new_mode){
        saveCurrentNewStatusAsReal();
    }
    statuses = statusArea.statuses;
    //c('statuses-->'); c(statuses);
    //c('originStatuses-->'); c(originStatuses);
    $('#time_control').timeEntry('option', 'minTime', null);
    $('#time_control').timeEntry('option', 'maxTime', null);

    if(statuses.length == 0){
        $('#log_control').hide();
        leaveEditMode();
        resetLogbook();
        return false;
    }
    var needLast = false;
    $.each(originStatuses, function(key1, originStatus){
        var statusMatch = false;
        var status_changed = 0;
		
        $.each(statuses, function(key2, status){
            if(status.from.id == originStatus.id){
                statusMatch = status;
                if(status.from.id < 0){
                    statusMatch.orig = status.from;
                } else {
                    statusMatch.orig = JSON.parse(JSON.stringify(originStatus));
                }
            }
        });

        if(!statusMatch){               
            var statusMatchDate = new Date(originStatus.dateTime.substring(0, 10));
            if(statusMatchDate <= page_date ){
                edits.push({id:originStatus.id, deleted:true, dateTime: originStatus.dateTime})
            }
        }else{ 
            //c('statusMatch'); c(statusMatch);
            var newStatusType = 0;
            if(statusMatch.status == 'on'){
                newStatusType = 0;
            }else if(statusMatch.status == 'off'){
                newStatusType = 3;
            }else if(statusMatch.status == 'sb'){
                newStatusType = 2;
            }else if(statusMatch.status == 'dr'){
                newStatusType = 1;
            }

            if(statusMatch.from.lt != originStatus.lt){
                statusMatch.orig.lt = statusMatch.from.lt;
                status_changed=1;
            }
            if(statusMatch.from.lng != originStatus.lng){
                statusMatch.orig.lng = statusMatch.from.lng;
                status_changed=1;
            }
            if(statusMatch.from.message != originStatus.message && (statusMatch.from.message.length > 0 || (originStatus.message != null && originStatus.message.length > 0))){
                statusMatch.orig.message = statusMatch.from.message;
                status_changed=1;
            }
            if(!statusMatch.from.position){
                statusMatch.orig.position = 'UNKNOWN';
                status_changed=1;
            } else if(statusMatch.from.position != originStatus.position){
                statusMatch.orig.position = statusMatch.from.position;
                status_changed=1;
            }
            if(JSON.stringify(statusMatch.from.documents)!=JSON.stringify(originStatus.documents)){
                statusMatch.orig.documents = statusMatch.from.documents;
                status_changed=1;
            }
            if(statusMatch.x1 != originStatus.x1 || parseInt(newStatusType) != parseInt(statusMatch.orig.status) || status_changed){
                    //c('statusMatch');c(statusMatch);
                if( originStatuses.length == 1 && statuses.length == 1){
                    statusMatch.orig.id = nextNewId;
                    nextNewId--;
                } 
                var time = convertXCoordToTime(statusMatch.x1, 1);
                //statusMatch.orig.dateTime = statusMatch.orig.dateTime.substring(0, 10) + ' '+time;
                if(statusMatch.x1 == $(svg).attr('width')){
                    if($.type(todaysDate) == 'date'){
                        statusMatch.orig.dateTime = convertDateToSQL(todaysDate, true);
                    } else {
                        var tomorrow_date_string = new Date(today_date_string+'T00:00:00');
                        tomorrow_date_string.setDate(tomorrow_date_string.getDate() + 1);
                        statusMatch.orig.dateTime = convertDateToSQL(tomorrow_date_string, true);
                    }
                }else{
                    statusMatch.orig.dateTime = today_date_string + ' '+time;
                }
                statusMatch.orig.annotation = '';
                statusMatch.orig.status = newStatusType;
                statusMatch.orig.editAnnotation = editAnnotation ? editAnnotation : 'No reason selected';
                if(key1 == 0){
                    statusMatch.orig.id = nextNewId;
                    nextNewId--;
                }
                if(originStatus.id == originStatuses[originStatuses.length -1].id){
                    needLast = true;
                }
                edits.push(statusMatch.orig)
            }
        }
    })
    
    $.each(statuses, function(key, status){
        var alreadyInEdit = false;
        $.each(edits, function(key, editStatus){
            if(status.from.id == editStatus.id){
                alreadyInEdit = true;
            }
        })
        if(status.from.id < 0 && !alreadyInEdit){
            var time = convertXCoordToTime(status.x1, 1);
            status.from.dateTime = today_date_string + ' '+time;
            var newStatusType = 0;
            if(status.status == 'on'){
                newStatusType = 0;
            }else if(status.status == 'off'){
                newStatusType = 3;
            }else if(status.status == 'sb'){
                newStatusType = 2;
            }else if(status.status == 'dr'){
                newStatusType = 1;
            }
            status.from.status = newStatusType;
            if ($('#annotation_select').val() > 0 && editAnnotation) status.from.editAnnotation = editAnnotation;
            edits.push(status.from);
        }
    });
    
    if(!todaysDate && ((statuses.length > 0 && statuses[statuses.length -1].from.id < 0) || needLast)){//if last status is new - create previous last as first for tomorrow
        var originaLastStatusCopy = JSON.parse(JSON.stringify(originStatuses[originStatuses.length -1]));
        originaLastStatusCopy.id = nextNewId;
        nextNewId--;
        originaLastStatusCopy.moveToNewDate = 1;
		var tomorrow_date_string = new Date(today_date_string);
		tomorrow_date_string.setDate(tomorrow_date_string.getDate() + 1);
        tomorrow_date_string = convertDateToSQL(tomorrow_date_string, false);
        var time = convertXCoordToTime(0, 1);
        originaLastStatusCopy.dateTime = tomorrow_date_string + ' '+time;
        edits.push(originaLastStatusCopy)
        
    }
    // save last current status for current day, forbidden to change "current" status
    else if($.type(todaysDate) == 'date' && statuses.length > 0){
        var todayX = convertTimeCoordToX(convertDateToSQL(todaysDate, true).substring(11));
        if (Math.round(statuses[statuses.length -1].x2) == Math.round(todayX) && statuses[statuses.length -1].status != getStatusFromId(originStatuses[originStatuses.length -1].status)) {
            var originaLastStatusCopy = JSON.parse(JSON.stringify(originStatuses[originStatuses.length -1]));
            originaLastStatusCopy.id = nextNewId;
            nextNewId--;
            originaLastStatusCopy.moveToNewDate = 1;
            originaLastStatusCopy.dateTime = convertDateToSQL(todaysDate, true);
            edits.push(originaLastStatusCopy);
        }
    }
    
    edits.sort(function(a,b){return new Date(a.dateTime)-new Date(b.dateTime)});
    c('edits-->'); c(edits);
    var driverId = 1;
    
    statuses = [];
    originStatuses = JSON.parse(JSON.stringify(old_originStatuses));
    $('#log_control').hide();
    leaveEditMode();
    resetLogbook();
    
    return edits;
}

function convertUSADate(dt) {
    var dateTime = dt.split(" "),
        date = dateTime[0].split("-"),
        time = dateTime[1].split(":");
    return new Date(date[0], (date[1]-1), date[2], time[0], time[1], time[2], 0);
}
function toInt(n){ return Math.round(Number(n)); };
function setLogTime(elem, time, sec = false, showSec = true){
    if(sec){
        var hours = Math.floor(time / 3600);
        time = time - hours * 3600;
        var minutes = Math.floor(time / 60);
        var seconds = Math.floor(time % 60);
    }else{
        var hours = Math.floor( time / 60);          
        var minutes = time % 60;
        minutes = minutes*100/60;
    }
    var pad = "00";
    var minutes = (pad+minutes).slice(-pad.length);
    var hours = (pad+hours).slice(-pad.length);

    if(sec){
        var seconds = (pad+seconds).slice(-pad.length);
        $('.'+elem).text(hours+':'+minutes+ (showSec ? ':'+seconds : ''));
        $('.'+elem).attr('x','749');
        $('.'+elem).css('font-size', '13px');
    } else {
        $('.'+elem).text(hours+'.'+minutes);
        $('.'+elem).attr('x','750');
        $('.'+elem).attr('style', '');
    }
}
function svgEl(tagName) {
    return document.createElementNS("http://www.w3.org/2000/svg", tagName);
}
function gLine(from, to){
    var colr = '#548AB6';
    drawLine(from.svgX2, from.svgX2, from.svgY, to.svgY, 'working_line', colr);
}
function addLogBookPoint(point){
    var colr = '#548AB6';
    var w = 31;
    var x1 = point.svgX1; 
    var x2 = point.svgX2; 
    var y = point.svgY; 
    var special = point.svgSpecial; 
    var svg = document.getElementById("logBook");
    if(point.status == 'dr'){
        //if(point.drive <= 0 || point.cycle <= 0 || point.shift <= 0 || point.eight <= 0 || point.hadCan24Break == 0){
        if(point.drive <= 0 || point.cycle <= 0 || point.shift <= 0 || point.eight <= 0){
            colr = '#FF0000';
            var errors = [];
            if(point.eight <= 0){
                errors.push(8);
            }
            if(point.shiftWork <= 0){
                errors.push('sh');
            }
            if(point.cycle <= 0){
                errors.push('c');
            }
            if(point.shift <= 0){
                errors.push(14);
            }
            if(point.drive <= 0){
                errors.push(11);
            }
            if(point.hadCan24Break == 0){
                errors.push('c24');
            }
            if(errors.length > 1){
                drawViolTriangle(svg, y, colr, 'v', x1, errors);
            }else{
                drawViolTriangle(svg, y, colr, errors[0], x1, errors);
            }
        }
    }

    drawLine(x1, x2, y, y, 'working_line', colr, special);


    //drowe number below the start
    /*$(svg).append(svgEl('text'));

    $(svg).find("text").last().text(log_number)
        .attr("x",x1-4)
        .attr("y",128)
        .attr("class",'working_number').
        attr("style","fill:"+colr+";");*/
    if(point.status == 'dr'){ 
        colr = '#FF0000'; 
        var errors = [];
        //check if status length is more than drive
        var statsDur = point.durationH*60*60 + point.durationM*(eld ? 1 : 15)*60;
        if(point.eight > 0 && statsDur > point.eight){
            errors = addError(w, x2, y, statsDur, point.eight, eld, 8, errors); //var df = (statsDur - from.eight)/60;  // errors[df].push(8); 
        }
        if(point.shift > 0 && statsDur > point.shift){ 
            errors = addError(w, x2, y, statsDur, point.shift, eld, 14, errors); //var df = (statsDur - from.shift)/60; //errors[df].push(14);
        }
        if(point.shiftWork > 0 && statsDur > point.shiftWork){
            errors = addError(w, x2, y, statsDur, point.shiftWork, eld, 's', errors); //var df = (statsDur - from.shiftWork)/60; //errors[df].push('s');   
        }
        if(point.drive > 0 && statsDur > point.drive){
            errors = addError(w, x2, y, statsDur, point.drive, eld, 11, errors); //var df = (statsDur - from.drive)/60; //errors[df].push(11);  
        }
        if(point.cycle > 0 && statsDur > point.cycle){
            errors = addError(w, x2, y, statsDur, point.cycle, eld, 'c', errors); //var df = (statsDur - from.cycle)/60; //errors[df].push('c'); 
        }

        for (var key in errors) {
            if (key === 'length' || !errors.hasOwnProperty(key)) continue;
            var errorAr = errors[key].st;
            var x1 = errors[key].x1;

            if(errorAr.length>1){
                drawViolTriangle(svg, y, colr, 'v', x1, errorAr);
            }else{
                drawViolTriangle(svg, y, colr, errorAr[0], x1, errorAr);
            }
        }
    }
    log_number++;
}
function toFixedFloat(num, am){
    return parseFloat(parseFloat(num).toFixed(am));
}
function drawLine(x1, x2, y1, y2, line_class, colr, special=''){
	c('drawLine x1 ' +x1 + ' x2 '+x2)
    $(svg).append(svgEl('line'));
    $(svg).find("line").last()
    .attr("x1",x1)
    .attr("x2",x2)
    .attr("y1",y1)
    .attr("y2",y2).
    attr("class",line_class).
    attr("style","stroke:"+colr+";stroke-width:2;"+special);
}
    
function addError(w, x2, y, statsDur, from, eld = 0, error_status, errors){
    var df = (statsDur - from)/60,
        hours = Math.floor(df/60),
        x1 = mins = 0,
        colr = '#FF0000';
    if(eld){
        mins = (df - hours*60);
        x1 = x2 - (hours+mins/60)*w;
    } else {
        mins = (df - hours*60)/15;
        x1 = x2 - (hours+mins/4)*w;
    }
    drawLine(x1, x2, y, y, 'working_line violation_triangle', colr);
    if (typeof errors[df] == 'undefined') {
        errors[df] = {x1:x1, st:[]};
    }
    errors[df].st.push(error_status);
    return errors;
}
    
// Get point in global SVG space
function cursorPoint(pt, evt){
    pt.x = evt.clientX; pt.y = evt.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
}
    
function drawViolTriangle(svg, y, colr, violNum, x, errors){
    y=133;
    var x1 = x+10;
    var x2 = x-10;
    var y1 = y+15;
    $(svg).append(svgEl('polygon'));
    $(svg).find("polygon").last()
        .attr("points",x+","+y+","+x1+","+y1+","+x2+","+y1)
        .attr("class",'working_line violation_triangle')
        .attr("onmouseover",'violationTriangleBox(this)')
        .attr("onmouseout",'violationTriangleBoxClose()')
        .attr("style","stroke:#548AB6;fill:"+colr+";stroke-width:1");
    for(var s=0;s<errors.length;s++){
        var er = errors[s];
        $(svg).find("polygon").last().attr('data-'+er, er);
    }
    $(svg).append(svgEl('text'));
    if(violNum == 11 || violNum == 14){
        x-=3;
    }
            if(violNum == 11){
                    var numbers = getViolationsNumbersFromCycleId(driverCycle);
                    violNum = numbers['driveHours'];
            }
            if(violNum == 14){
                    var numbers = getViolationsNumbersFromCycleId(driverCycle);
                    violNum = numbers['shiftHours'];
            }
    $(svg).find("text").last().text(violNum)
        .attr("x",x-3)
        .attr("y",y1-2)
        .attr("class",'working_number violation_triangle').
        attr("style","fill: white;font-size:10px;");
    for(var s=0;s<errors.length;s++){
        var er = errors[s];
        $(svg).find("text").last().attr('data-'+er, er);
    }
}
    
function deleteStatus(){
    c('deleteStatus');   
}

function drawGraph(segments){
    //c('drawGraph');
    //c(segments);
    $('.working_line.second').remove();
    for(var x = 0; x < segments.length; x++){
        drawLine(segments[x].x1, segments[x].x2, segments[x].y, segments[x].y, 'working_line second', '#007', ''); 
        if(x < segments.length-1){
           drawLine(segments[x].x2, segments[x].x2, segments[x].y, segments[x+1].y, 'working_line second', '#007', '');
        }
    } 
}
 
function drawTooltip(x1, y1, direction, timeX){
   var x2 = direction ? x1-50 : x1+50;
   var xP = direction ? x1-43 : x1+43;
   var xT = direction ? x1-40 : x1+10;
   var y2 = y1+25;
   var yP = 0;

   colr = 'rgba(90, 181, 41,1)'; //rgba(0,128,0,0.9);
   $(svg).append(svgEl('polygon'));
   $(svg).find("polygon").last()
       .attr("points",x1+","+y1+" "+x2+","+y1+" "+x2+","+yP+" "+xP+","+y2+" "+x1+","+y2+" "+x1+","+y1)
       .attr("class",'area_tooltip')
       .attr("id","left_tooltip_"+x1)
       .attr("style","stroke:#000;fill:"+colr+";stroke-width:0");

   var timeString = convertXCoordToTime(timeX);
   $(svg).append(svgEl('text'));
   $(svg).find("text").last().text(timeString)
       .attr("x", xT)
       .attr("y",y1+16)
       .attr("class",'area_time').
       attr("style","fill: #fff;font-size:14px;stroke-width:0");
}
function drawDurationTooltip(x1, y1, timeX1, timeX2){
    if (x1 > 658) {
        x1 = x1 - 192;
        if (timeX2 - timeX1 < 141) {
            x1 = timeX1 - 181;
        }
    }
    var x2 = x1 + 122;
    var y2 = y1 + 25;
    colr = 'rgba(90, 181, 41,1)';
    $(svg).append(svgEl('polygon'));
    $(svg).find("polygon").last()
        .attr("points",x1+","+y1+" "+x2+","+y1+" "+x2+","+y2+" "+x1+","+y2)
        .attr("class",'area_tooltip')
        .attr("id","duration_tooltip_"+x1)
        .attr("style","stroke:"+colr+";fill:#fff;stroke-width:1;");
    timeString = convertXCoordToTime(timeX2 - timeX1);
    if (timeString == '00:00' && timeX2 - timeX1 > 1) timeString = '24:00';
    $(svg).append(svgEl('text'));
    $(svg).find("text").last().text('DURATION: '+timeString)
        .attr("x", x1 + 8)
        .attr("y",y1 + 17)
        .attr("class",'area_time').
        attr("style","fill:"+colr+";font-size:14px;stroke-width:0;font-weight: bold;");
}
    
function drawSlideButton(x1, y1, direction){
    var x2 = direction ? x1+30 : x1-30;
    var xP = direction ? x1+38 : x1-38;
    var y2 = y1+25;
    var yP = y1+12.5;
    
    if(((x1 == 0 && direction == 0) || (x1 == 744 && direction == 1) || ($.type(todaysDate) == 'date' && direction == 1 && Math.round(x1) == Math.round(convertTimeCoordToX(convertDateToSQL(todaysDate, true).substring(11))))) && !new_mode){
        colr = '#a5a5a5';
    } else {
        colr = '#5ab529';
    }
    $(svg).append(svgEl('polygon'));
    $(svg).find("polygon").last()
        .attr("points",x1+","+y1+" "+x2+","+y1+" "+xP+","+yP+" "+x2+","+y2+" "+x1+","+y2+" "+x1+","+y1)
        .attr("class",'area_tooltip drag resize')
        .attr("dir", direction)
        .attr("style","stroke:green;fill:"+colr+";stroke-width:0");
}
    
markers = [];
function setMapOnAll(map) {
    for (var i = 0; i < markers.length; i++) {
      markers[i].setMap(map);
    }
}
function clearMarkers() {
    setMapOnAll(null);
}
function calculateAndDisplayRoute(directionsService, directionsDisplay, org, dest, wps) {
    directionsService.route({
        origin: org,
        destination: dest,
        waypoints: wps,
        travelMode: google.maps.TravelMode.DRIVING
    }, function(response, status) {
        if (status === google.maps.DirectionsStatus.OK) {
            directionsDisplay.setDirections(response);
        } else {
            initializePoi();
        }
    });
}
function deleteMarkers() {
    clearMarkers();
    markers = [];
}
function makeRoute(resultsMap, points){
    var point1 = new google.maps.LatLng(34.16510,-84.79994);
    var point2 = new google.maps.LatLng(33.74900,-84.38798);
    var point3 = new google.maps.LatLng(-33.87312358690301,151.99952697753906);
    var point4 = new google.maps.LatLng(-33.84525521656404,151.0421848297119);
    var wps = [{ location: point1 }, { location: point2 }, {location: point4}];
    var wps = [];
    var x = 0;
	
    if(points.length > 7){
        x = points.length - 8;
    }
    for(x; x < points.length; x++){
        point = points[x];
        point.pos = new google.maps.LatLng(point.lt,point.lng)
        wps.push({location:point.pos});
      }
    var org = wps[0].location;
    var dest = wps[wps.length-1].location;
    directionsService = new google.maps.DirectionsService();
    calculateAndDisplayRoute(directionsService, directionsDisplay, org, dest, wps);
    map.setZoom(4)
}
function geocodeAddress(geocoder, resultsMap, address) {
     geocoder.geocode({'address': address}, function(results, status) {
       if (status === google.maps.GeocoderStatus.OK) {
         resultsMap.setCenter(results[0].geometry.location);
         resultsMap.setZoom(4);
         var marker = new google.maps.Marker({
           map: resultsMap,
           position: results[0].geometry.location
         });
         markers.push(marker);
       } else {
         alert('Geocode was not successful for the following reason: ' + status);
       }
     });
};
function check34restart(point){
    if(point.restartFromStatusStart != false){
        var restartPointMinsTotal = parseInt(point.restartFromStatusStart/60);
        var restartPointHours = Math.floor(restartPointMinsTotal/60);
        if(eld){
            var restartPointMins = (restartPointMinsTotal - restartPointHours*60);
        }else{
            var restartPointMins = (restartPointMinsTotal - restartPointHours*60)/15;
        }
        var startH = point.hours+restartPointHours;
        var startP = point.startP+restartPointMins;
        draw34(startH, startP);
    }
}
function draw34(startH, startP){
    var w = 31;
    if(eld){
        x1 = (startH+startP/60)*w;
    }else{
		x1 = (startH+startP/4)*w;
    }
    y1 = 0;
    y2 = 111;
    colr = '#27d26e';
    drawLine(x1, x1, y1, y2, 'working_line', colr);    
    drawGreenCircle(svg, y2, colr, '34', x1)
}
function drawGreenCircle(svg, y, colr, violNum, x){
    y=133;
    $(svg).append(svgEl('circle'));
    $(svg).find("circle").last()
        .attr("cx",x).attr("cy",y).attr("r",8)
        .attr("class",'working_line ').
        attr("style","stroke:#548AB6;fill:"+colr+";stroke-width:1");

    $(svg).append(svgEl('text'));
    $(svg).find("text").last().text(violNum)
        .attr("x",x-6)
        .attr("y",y+4)
        .attr("class",'working_number ').
        attr("style","fill: white;font-size:10px;");

}
function checkFutureActions(point, restart34Hours){
    if(restart34Hours > 0){
        var restartPointMinsTotal = parseInt(restart34Hours/60);
        var restartPointHours = Math.floor(restartPointMinsTotal/60);
        var restartPointMins = (restartPointMinsTotal - restartPointHours*60)/15;
        var startH = point.durationH+restartPointHours;
        var startP = point.durationM+restartPointMins;
        if(notEnds(point.hours, point.mins, startH, startP)){
            draw34(startH, startP);
        }
    }
}
function notEnds(startH, startM, durationH, durationM){
    var total = startH + durationH + (startM+durationM*15)/60;
    if(total >= 24){
        return false;
    }
    return true;
}
function parseDate(input) 
{
    if (!input.toString().length) return input;
    var parts = input.match(/(\d+)/g);
    return new Date(parts[0], parts[1]-1, parts[2]);
}

function editStatusClick(el){
    var start_time = $(el).attr('data-start'),
        relX = convertTimeCoordToX(start_time);
    statusArea.createArea(relX);
}
Array.prototype.insert = function ( index, item ) {
    this.splice( index, 0, item );
};
var newStatuses = [];
var nextNewId = -1;
function saveCurrentNewStatusAsReal(){
    c('saveCurrentNewStatusAsReal');
    newArea.changeStatus(newArea.statuses[0].status);
	newArea.segments[0].status = newArea.statuses[0].status;
    var newSegment = JSON.parse(JSON.stringify(newArea.segments[0]));
    for(var i =0; i < statusArea.segments.length; i++){
        var segment = statusArea.segments[i];
        c(segment);
        //if old segmet fully inside new segment
        if(segment.x2 <= newSegment.x2 && segment.x1 >= newSegment.x1){
            if(i == 0){//first status
                segment.x2 = 0;
                segment.x1 = 0;
            }else if(i == statusArea.segments.length -1){//last status
                segment.x2 = 744;
                segment.x1 = 744;
            }else{//remove old segment
                statusArea.segments.splice(i, 1);
                i--;
                continue;
            }
        }
        //if new segment cuts old segment into two pieces
        if(segment.x1 < newSegment.x1 && segment.x2 > newSegment.x2){
            var splitSegment = JSON.parse(JSON.stringify(segment));
            splitSegment.x1 = newSegment.x2;
            splitSegment.from.id = nextNewId;
            nextNewId--;
            statusArea.segments.insert(i+1, splitSegment)
            segment.x2 = parseFloat(newSegment.x1);
        }
        //if new segment cut piece of old segment to the right
        if(segment.x1 < newSegment.x1 && segment.x2 < newSegment.x2 && segment.x2 > newSegment.x1){
            segment.x2 = parseFloat(newSegment.x1);
        }
        //if new segment cut piece of old segment to the left
        if(segment.x1 >= newSegment.x1 && segment.x2 > newSegment.x2 && segment.x1 < newSegment.x2){
            segment.x1 = parseFloat(newSegment.x2);
        }
    }
    if(newSegment.x1 < newSegment.x2)
        statusArea.segments.insert(i+1, newSegment)
    statusArea.segments.sort(function(a,b){return a.x1-b.x1;})
    statusArea.updateStatusesFromSegments(); 
}
function newStatusMove() { 
    c('newStatusMove');
    var new_statuse = JSON.parse(JSON.stringify(newArea.statuses));
    var old_statuses = JSON.parse(JSON.stringify(statusArea.segments));
    var new_status_type = new_statuse[0].status;
    $('.edit_status').removeClass('active');
    $('#status_'+new_status_type).addClass('active');

    var new_statuses = [],
    x1 = new_statuse[0].x1,
    x2 = new_statuse[0].x2;
    var editedStatus = new_statuse[0];
    
    old_statuses.push(new_statuse[0]);
    old_statuses.sort(function(a,b){return a.x1-b.x1;});
    var newIndex = old_statuses.indexOf(editedStatus);
    if(newIndex > 0){
        if( old_statuses[newIndex-1].x1 <= x1 && old_statuses[newIndex-1].x2 > x2){ 
            var next_obj = JSON.parse(JSON.stringify(old_statuses[newIndex-1]));
                next_obj.x1 = x2;
                next_obj.from.id = -2;
                old_statuses.splice(newIndex+1, 0, next_obj);
        }
        old_statuses[newIndex-1].x2 = x1; //change left status
    }
    if(newIndex < old_statuses.length-1) {  //change right status
        old_statuses[newIndex+1].x1 = x2; //c(old_statuses[newIndex+1]);
    }
    
    if(x1==0 && old_statuses[0].x1==0 && old_statuses[0].x2==0) { //delete (0,0)
        old_statuses.splice(0, 1); 
        newIndex--;
    }
    
    var last_index = old_statuses.length-1;
    var new_status_index = old_statuses.indexOf(editedStatus);
    if(x2 ==744 && new_status_index!=last_index && old_statuses[last_index].x2==744) {  //delete (744,744)
        old_statuses.splice(last_index, 1); 
    }
    for(var x = 0; x < old_statuses.length; x++){
        var oldStatus = old_statuses[x];
        if(x+1 < newIndex){//to the left
            if(oldStatus.x1 >= x1){
                oldStatus.x1 = x1;
            }
            if(oldStatus.x2 >= x1){
                oldStatus.x2 = x1;
            }
        }else if(x > newIndex){//to the right
            if(oldStatus.x1 <= x2){
                oldStatus.x1 = x2;
            }
            if(oldStatus.x2 <= x2){
                oldStatus.x2 = x2;
            }
        }
    }
    var currentX = 0;
    
    for(var x = 0; x < old_statuses.length; x++){
        //c('old_statuses'); c(old_statuses);
        var status = old_statuses[x];
        var x11 = status.x1,
            x12 = status.x2,
            x01 = x11,
            x02 = x12,
            changed = 0;
        if(status.x1 >= x1 && status.x2 <= x2 && x != newIndex){
            //deleted
            currentX = status.x1;
        }  else {
            if(x11 < currentX) {
                x11 = currentX;
            }
            var segment_obj = {x1:x11, x2:x12, x01:x01, x02:x02, y:old_statuses[x].y, status: old_statuses[x].status, from: old_statuses[x].from, changed:changed}; 
            c('segment_obj add')
            c(segment_obj);			
            new_statuses.push(segment_obj);  
            if(old_statuses[x] == new_statuse[0]){
                editedStatus = segment_obj;
                newArea.editedStatus.status = new_statuse[0].status;
            }
        }  
    }
    //c('new_statuses');
    //c(new_statuses);
     
    drawGraph(new_statuses); 
    newStatuses = JSON.parse(JSON.stringify(new_statuses)); 
}

function addStatus(){
    if(new_mode){
        c('addStatus newmode')
        saveCurrentNewStatusAsReal();
    }else{
        c('addStatus not newmode')
        statusArea.createArea(0);
    }
    $('#location_name').val('UNKNOWN');
    $('#note').val('');
    statusArea.editedStatus = {};
    //$('.add_status').attr('disabled', true);
    //$(".statusArea, .area_tooltip, .area_time, .working_line.second").remove();
    /*statuses = [];
    statusArea.statuses = [];*/
    var x2 = todaysDate ? convertTimeCoordToX(timeToString(todaysDate, 1)) : 744;
    var segment = [{x1:0, x2:1, y:14, status: 'off', from: {id: nextNewId, lt:'', lng:'', location:'UNKNOWN', message:'', odo:'', special:'', position:'UNKNOWN', documents: [], docId:''}}]; //, editAnnotation:''
    
	c('new statusArea')
	c(statusArea.segments)
	$.each(statusArea.statuses, function(key, arStatus){
		arStatus.x01 = arStatus.x1;
		arStatus.x02 = arStatus.x2;
	});
    newArea = new StatusArea(statusArea.segments)
    newArea.fillArea(segment);
	newArea.created = true;
    new_mode = true;
    newArea.createArea(0);
    //$('#time_from, #time_to').attr('disabled', false);
    $('#log_status_info').attr('data-id',nextNewId);
	nextNewId--;
}
function removeEditOffers(i){
    var editId = offers_points[i].id;
    AjaxController('removeEditOffersByEditId', {editId: editId}, dashUrl, 'removeEditOffersHandler', removeEditOffersHandler, true);
}
function removeEditOffersHandler(response){
    var new_offers = [];
    $.each(offers_points, function(key, offer){ //c(offer);
        if(offer === null){return;}
        if(offer.id == response.data && typeof offer!='undefined'){
            if($('#offer_'+key).is('.active')){
                resetLogbook();
            }
            $('#offer_'+key).remove();
            offers_points[key] = null;
        } 
    });
    
    if(editMode){ leaveEditMode(); }
    cancelEdit();
}

function count(collection) {  
  var totalCount = 0;
  for (var index = 0; index < collection.length; index++) {
    if (index in collection && collection[index]) {
      totalCount++;
    }
  }
  return totalCount;
}

function resetLogbook(){c('resetLogbook');
   viewOffer(0);
   $('#return_original').remove();
   $('.origin_button').show();
   $('.offer-header').find('button[aria-expanded="true"]').click();
   $('#log_book').removeClass('offer_active');
   $('#log_status_info').removeAttr('data-id');
   $('#closeMap').click();
   $('#annotation_select').val($("#annotation_select option:first").val()).change();
   //$('#log_status_info').find('#annotation_box').remove();
}
function viewOffer(i){
    $('#pending_approvals_modal').modal('hide');
    $('#pending_approvals_modal').find('.offer').removeClass('active');
    leaveEditMode();
    $('#log_book').addClass('offer_active');
    $(svg).find(".working_line, .working_number").remove();
    var segments = [];
    log_number = 1;
    var points = offers_points[i].points;
    var offer_title = $('#offer_title_'+i).text();
    if(i!=0){
        var lft = ($('#log_book #edit_button').length && $('#log_book #edit_button').is(':visible') ? ($('#log_book #edit_button').position().left + $('#log_book #edit_button').width() + 40) : 0);
        if ($('#log_book #pending_approvals_button').length && !lft) lft = lft + $('#log_book #pending_approvals_button').position().left + $('#log_book #pending_approvals_button').width() + 40;
        lft = parseInt(lft).toString()+'px';
        
        $('#log_book').append('<div class="offer_title" style="left: '+lft+'; margin-left: 10px; right: auto;">'+offer_title+'</div>');
        $('#log_book').append('<button id="return_original" onclick="resetLogbook()" class="ez_button return_original">Return</button>');
        $('.origin_button').hide();
        $('#offer_'+i).addClass('active');
    }
    drawLogbookFromPoints(points, segments);
    
}
function drawLogbookFromPoints(points, segments){
    for(var x = 0; x < points.length; x++){
        var point = points[x]; 
        addLogBookPoint(points[x], x);
        if(x != 0){
            gLine(points[x-1], point); 
        } 
        var coord_obj = {x1:point.svgX1, x2:point.svgX2, y:point.svgY, status: point.status, from: point};
        segments.push(coord_obj);
    }
}
function saveTime(){
    var time_str = $('#time_control').val(); 
    time_str = time_str.replace(/ : /g, ':');
    time_str = time_str.split(' ');
    var am_pm = time_str[1];
    time_str = time_str[0].split(':');
    if(am_pm=='PM' && time_str[0] != 12){
        time_str[0] = String(parseInt(time_str[0]) + 12);
    } else if(am_pm=='AM' && time_str[0] == 12){
        time_str[0] = String(parseInt(time_str[0]) - 12);
    }
    var relX = convertTimeCoordToX(time_str.join(':') + (typeof time_str[2] == 'undefined' ? ':00' : '')),
        direction = $('#time_control').attr('data-time') == 'time_to' ? 1 : 0;
    $('#time_modal').modal('hide');
    $('#time_control').removeAttr('data-time');
    if(!new_mode){
        statusArea.moveArea(direction, relX);  
    } else {
        newArea.moveArea(direction, relX); 
    }
}

function checkOriginButton(){
	$('#orig_lable').remove();
	if(window.location.pathname == '/dash/history/log/'){
		if($('.origin_button').hasClass('original')){
			$('#log_book').append('<span id="orig_lable">Original</span>');
			$('.origin_button').html('<img title="Show original option can be disabled in settings" src="/dash/assets/img/show_original_back.png" alt="Show Original" />');
		}else{
			$('.origin_button').html('<img title="Show original option can be disabled in settings" src="/dash/assets/img/show_original.png" alt="Show Original" />');
		}
	}else{
		 $('.origin_button').html('');
	}
}
function showOriginalLogbook(){
    if($('.origin_button').hasClass('original')){
        originalLogbook = false;
        $('.origin_button').removeClass('original')
		$('.edit_info').show();
    }else{
        originalLogbook = true;
        $('.origin_button').addClass('original')
		$('.edit_info').hide();
    }
    changeLogbook();
    checkOriginButton()
}
function statusFieldChange(obj){
    var currentId = $("#log_status_info").attr('data-id');
    if(!new_mode){
        segments = statusArea.statuses;
    } else {
        segments = newArea.statuses;
    }
    var new_val = $(obj).val();
    var new_val_id = $(obj).attr('id');
    var currentStatus = 0;
    c(new_val_id); c(new_val);
    c('statusFieldChange'); 
    c(segments);
    var relX = 0;
    for(var x = 0; x < segments.length; x++){
        segments[x].changed = 0;
        if(segments[x].from.id == currentId){
            if(new_val_id == 'docId') {
                var docId_arr =[];
                $('.attachment_info_cont .attachment_info_div .attachment_info').each(function(){
                    docId_arr.push(parseInt($(this).attr('data-docid')));
                });
                segments[x].from.documents = docs.filter(function(e){return $.inArray(e.id, docId_arr) != -1;});
            }
            if(new_val_id == 'longitude')     { segments[x].from.lng = new_val; }
            if(new_val_id == 'latitude')      { segments[x].from.lt = new_val; }
            if(new_val_id == 'location_name') {
                if (!new_val) new_val = 'UNKNOWN';
                segments[x].from.position = new_val.toUpperCase(); 
                segments[x].from.location = new_val.toUpperCase();
            }
            if(new_val_id == 'note')          { segments[x].from.message = new_val.toUpperCase(); }
            //if(new_val_id == 'editAnnotation')  { segments[x].from.editAnnotation = new_val; }
            
            segments[x].changed = 1;
            currentStatus = segments[x].status; 
            
            // docs and note save
            if (!new_mode && statusArea.segments[x] != segments[x]) statusArea.segments[x] = segments[x];
        }
    }
    c('currentStatus');c(currentStatus);
    if(new_mode && currentStatus){
        newArea.changeStatus(currentStatus);
    }
}
function drawStatusIllumination(el){
    if (!editMode) {
        var x1 = convertTimeCoordToX($(el).attr('data-start'));

        var x2 = 744;
        if ($(el).next().length) x2 = convertTimeCoordToX($(el).next().attr('data-start'));
        else if ($.type(todaysDate) == 'date') {
            var todaysDate_time = new Date(todaysDate.getTime());
            if (eld) {
                todaysDate_time = convertDateToSQL(todaysDate, true).substring(11);
            } else {
                todaysDate_time.setMinutes(todaysDate_time.getMinutes() - (todaysDate_time.getMinutes() % 15));
                todaysDate_time.setSeconds(0);
                todaysDate_time = convertDateToSQL(todaysDate_time, true).substring(11);
            }
            x2 = convertTimeCoordToX(todaysDate_time);
        }

        var y0=0;
        var y=112;
        var
        colr = 'rgba(90, 181, 41, 0.35)';
        $(".statusArea, .area_tooltip, .area_time, .area_stroke_line").remove();
        $(svg).append(svgEl('polygon'));
        $(svg).find("polygon").last()
            .attr("points",x1+","+y0+" "+x2+","+y0+" "+x2+","+y+" "+x1+","+y)
            .attr("class",'statusArea')
            .attr("id","area_"+x1)
            .attr("style","stroke:rgba(90, 181, 41, 1);fill:"+colr+";");

        drawTooltip(x1-50, -30, 0, x1);
        drawTooltip(x2+50, -30, 1, x2);
        drawSlideButton(x1, y, 0);
        drawSlideButton(x2, y, 1);    
        var line_color = 'rgba(90, 181, 41, 1)';
        drawLine(x1, x1, y0, y, 'area_stroke_line', line_color);
        drawLine(x2, x2, y0, y, 'area_stroke_line', line_color);
        drawDurationTooltip(x2+60, -30, x1, x2);

        $('#logBook .area_tooltip.drag.resize').remove();
        $(el).addClass('log_list_tr_active');
    }
}
function drawStatusIlluminationOff(){
    if (!editMode) {
        $('#logBook .statusArea').remove();
        $('#logBook .area_tooltip').remove();
        $('#logBook .area_time').remove();
        $('#logBook .area_stroke_line').remove();
        $('#log_list tr.log_list_tr_active').removeClass('log_list_tr_active');
    }
}

class StatusArea { 
    constructor(originalSegments) {
        this.veryOriginalSegments = JSON.parse(JSON.stringify(originalSegments))
        this.x1 = 0;  //area start
        this.x2 = 0;  //area end
        this.created = false; 
        this.statuses = []; //working array
        this.segments = originalSegments; //points to draw
        this.originalSegments = originalSegments;  //originalSegments, don't change 
        this.editedStatus = {};  //what status we edit
    }
    
    fillArea(originalSegments){
        this.veryOriginalSegments = JSON.parse(JSON.stringify(originalSegments))
        this.originalSegments = originalSegments;
        this.segments = originalSegments;
    }
    drawEditArea(x1, x2){
        //c('drawEditArea:: '+x1+', '+x2);
        var y0=0;
        var y=112;
        var
        colr = 'rgba(90, 181, 41, 0.35)';
        $(".statusArea, .area_tooltip, .area_time, .area_stroke_line").remove();
        $(svg).append(svgEl('polygon'));
        $(svg).find("polygon").last()
            .attr("points",x1+","+y0+" "+x2+","+y0+" "+x2+","+y+" "+x1+","+y)
            .attr("class",'statusArea')
            .attr("id","area_"+x1)
            .attr("style","stroke:rgba(90, 181, 41, 1);fill:"+colr+";");
       
        drawTooltip(x1-50, -30, 0, x1);
        drawTooltip(x2+50, -30, 1, x2);
        drawSlideButton(x1, y, 0);
        drawSlideButton(x2, y, 1);    
        var line_color = 'rgba(90, 181, 41, 1)';
        drawLine(x1, x1, y0, y, 'area_stroke_line', line_color);
        drawLine(x2, x2, y0, y, 'area_stroke_line', line_color);
        drawDurationTooltip(x2+60, -30, x1, x2);
        
        //c('x1='+x1);
        //c('x2='+x2);
        var isTodayX = false;
        if($.type(todaysDate) == 'date' && Math.round(x2) == Math.round(convertTimeCoordToX(convertDateToSQL(todaysDate, true).substring(11)))) {
            isTodayX = true;  
        }
        $('#log_control').show();
        $('#time_from').attr('readonly', true).attr('disabled', (x1 == 0 && !new_mode ? true : false));
        $('#time_to').attr('readonly', true).attr('disabled', ((x2 == 744 || isTodayX) && !new_mode ? true : false)); 
        
        var time_x1 = convertXCoordToTime(x1, (isAobrd ? false : true), true),
            time_x2 = convertXCoordToTime(x2, (isAobrd ? false : true), true);
        //c('after move');

        if($('#time_from').val() != time_x1){
            $('#time_from').
                val(time_x1).
                attr('data-time', convertXCoordToTime(x1, (isAobrd ? false : true), false) + (isAobrd ? ':00' : ''));
        }
        if($('#time_to').val() != time_x2){
            $('#time_to').
                val(time_x2).
                attr('data-time', convertXCoordToTime(x2, (isAobrd ? false : true), false) + (isAobrd ? ':00' : ''));
        }
        self.x1 = x1;
        self.x2 = x2;
    }
    updateStatusesFromSegments(){
		self = this
        c('updateStatusesFromSegments')
        self.statuses = [];
        c(self.statuses)
		c('self.segments')
		c(self.segments);
        for(var x = 0; x < self.segments.length; x++){
            //c(this.segments[x].from.id);
            c(self.segments[x]);

            var x11 = self.segments[x].x1;
            var x12 = self.segments[x].x2;
			c('x11 ' +x11 + ' x12 ' +x12);
            var xo1 = x11;
            var xo2 = x12;
            //c(segments[x]);
            var changed = 0;  //0-no, 1-changed, 2-deleted
            if(self.editedStatus.x1 != undefined)
            if(self.editedStatus.x1 >= x12){ //current segment is to the left from edited
                c('left')
                if(this.x2 < x11){
                    changed = 2;
                }else if(this.x1 < x12 && this.x2 > x11){ //status partially changed
                    if(this.x1 < x11){//status deleted
                        //c('deleted')
                        changed = 2;
                    }
                    x12 = this.x1; 
                }else if(this.x1 > x12 && x < self.segments.length-1 &&  JSON.stringify(self.segments[x+1]) == JSON.stringify(this.editedStatus)){
                    x12 = this.x1;
                }

            }else if(self.editedStatus.x2 <= x11){ //current segment is to the right from edited
                c('right')
                if(this.x1 > x12){
                    changed = 2;
                }else if(this.x2 > x11 && this.x1 < x12){  //status partially changed
                    if(this.x2 > x12){//status deleted
                        //c('deleted')
                        changed = 2;
                    }
                    x11 = this.x2; 
                }else if(this.x2 < x11 && x > 0 && JSON.stringify(self.segments[x-1]) == JSON.stringify(this.editedStatus)){ 
                    x11 = this.x2; 
                }
            }else{
                //c('this.editedStatus.x1 '+this.editedStatus.x1 + ' this.editedStatus.x2 ' +this.editedStatus.x2 + ' x11 '+x11 + ' x12 ' +x12)
                //c('edited')
                x11 = this.x1;  
                x12 = this.x2;   
            }
            
            var segment_obj = {x1:x11, x2:x12, x01:xo1, x02:xo2, y:self.segments[x].y, status: self.segments[x].status, from: self.segments[x].from, changed:changed};    
            if(changed != 2){ 
                c('add status')
                c('segment_obj.x1 ' +segment_obj.x1 + ' segment_obj.x2 ' +segment_obj.x2);
                self.statuses.push(segment_obj);
                c(self.statuses)
            }else{
				c('deleted')
			}
        }
        c('leaving updateStatusesFromSegments')
        c(self.statuses)
        c(statusArea.statuses)
        c(newArea.statuses)
    }
    moveArea(direction, relX){
        c('moveArea');  
        //c(this);
        var self = this,
			svg_width = 744; //$(svg).attr('width'),
		if(direction == 0 && self.x2 < relX){
			return false;
		}else if(direction == 1 && self.x1 > relX){
			return false;
		}
        // omit seconds for aobrd
        if (isAobrd && ((direction == 0 && relX > 0) || (direction == 1 && relX < svg_width))) relX = convertTimeCoordToX(convertXCoordToTime(relX, false) + ':00');
        var x01 = this.x1,
            x02 = this.x2,
            y = 0;
        var segments = self.segments;

        //if last today status
        if(todaysDate  && JSON.stringify(segments[segments.length-1]) == JSON.stringify(this.editedStatus) && this.x2 > statusArea.statuses[statusArea.statuses.length -1].x2){
            return false;
        }
        
        //if today, max x2 is now time x
        if($.type(todaysDate) == 'date'){ 
            var todayX = convertTimeCoordToX(convertDateToSQL(todaysDate, true).substring(11));  
            relX = todayX <= relX ? todayX : relX;  
        }
        relX = relX < 0 ? 0 : (relX > svg_width ? svg_width : relX);
        self.statuses = [];
        if(direction == 0){
            this.x1 = relX;  
        } else {
            this.x2 = relX;
        }
        if(this.editedStatus.x1 == 0 && direction == 0 && !new_mode){
            this.x1 = 0;
        }
        if(this.editedStatus.x2 == 744 && direction == 1 && !new_mode){
            this.x2 = 744;
        }
        // deny edit right time of the last status for current date
        else if ($.type(todaysDate) == 'date' && !new_mode) {
            //c(this.editedStatus.x2+' == '+todayX+' && '+direction+' == 1 && !'+new_mode);
            if (Math.round(this.editedStatus.x2) == Math.round(todayX) && direction == 1) {
                this.x2 = todayX;
            }
        }
        // fix minimal during of time "2min" Roman
        if(this.x1 == this.x2){
            if(direction == 0){
                this.x1 = convertTimeCoordToX($('#time_from').attr('data-time'));
            } else {
                this.x2 = convertTimeCoordToX($('#time_to').attr('data-time'));
            }
        }

        if(this.x1 < this.x2){ //  need to exclude x1<=x01 && x2>=x02
            self.updateStatusesFromSegments()
            c('self.statuses')
            c(self.statuses)
            self.drawEditArea(this.x1, this.x2); 
            drawGraph(self.statuses); 
            var new_status_type = this.editedStatus.status;
            $('.edit_status').removeClass('active');
            $('#status_'+new_status_type).addClass('active');
            if(new_mode){
                newStatusMove(); 
            }
        }   
    }

    changeStatus(new_status){
        c('changeStatus'); 
        var row = 0,
            h = 14, 
            self = this,
            segments = self.statuses; //JSON.parse(JSON.stringify(self.statuses));
        for(var x = 0; x < segments.length; x++){
            segments[x].changed = 0;
            if(segments[x].x1 == this.x1 && segments[x].x2 == this.x2){
                segments[x].status = new_status; 
                segments[x].changed = 1;
                if(new_status == 'off'){row = 0;}
                if(new_status == 'sb'){ row = 1;}
                if(new_status == 'dr'){ row = 2;}
                if(new_status == 'on'){ row = 3;}
                var new_y = h + row*2*h; 
                segments[x].y = new_y; 
            }
        }

        self.createArea(this.x1);
        self.editedStatus.status = new_status;
        drawGraph(segments);
        if(new_mode){
            newStatusMove(); 
        }
        $('.edit_status').removeClass('active');
        $('#status_'+new_status).addClass('active');
    }
    initEdit(relX){
		self = this,
        c('initEdit')
        var segments = JSON.parse(JSON.stringify(this.originalSegments));
		$('#edit_buttons').remove(); 
		$('#log_status_info').append('<div id="edit_buttons"><button onclick="saveLogbook()" class="ez_button">Save</button></div>');
		if(window.location.pathname == '/dash/history/log/' || window.location.pathname == '/dash/views/dispatcher/log/'){
			$('#edit_buttons').hide();
		}
		
        for(var x = 0; x < segments.length; x++){
            self.created = true;
            c('13');
            originStatuses[x].x1 = segments[x].x1;
            originStatuses[x].x2 = segments[x].x2;
            var x1 = segments[x].x1,
                x2 = segments[x].x2,
                y = segments[x].status;
				
            if(relX >= x1 && relX <= x2){
                self.editedStatus = segments[x]; 
                
                self.drawEditArea(x1, x2);
            }
        }   
        statuses = JSON.parse(JSON.stringify(this.originalSegments));
		 c('set statuses initEdit')
		 c(statuses)
		 c(self.statuses)
        self.statuses = statuses;
		c(self.statuses)
		c(self);
		c(statusArea.statuses)
    }
    createArea(relX){
		self = this;
		c('createArea '+relX)
		c(self.segments)
        if(userRole != 1 || !editMode){
            return false;
        }
        if(window.location.pathname == "/dash/history/log/" || window.location.pathname == "/dash/views/dispatcher/log/" || window.location.pathname == "/dash/drivers/"){}else{
            return false;
        }
        if(typeof self.statuses == 'undefined' || self.statuses.length == 0 || !self.created){
            self.initEdit(relX);
        }else{ 
            var statuses = self.statuses;
            var segments = self.segments;
            var availStatuses = [];
            for(var x = 0; x < statuses.length; x++){
                availStatuses.push(statuses[x].from.id);
            }
            for(var x = 0; x < segments.length; x++){	
                if(availStatuses.length > 0 && $.inArray(segments[x].from.id, availStatuses) < 0){
                    segments.splice(x, 1);
                    x--;
                    continue;
                }
            }
            var editX1 = 0;
            var editX2 = 0;
            for(var x = 0; x < statuses.length; x++){
                var st = statuses[x];
                st.x01 = st.x1;
                st.x02 = st.x2;
                for(var i = 0; i < segments.length; i++){
                    if(segments[i].from.id == st.from.id){
                        segments[i].x1 = st.x1;
                        segments[i].x2 = st.x2;
                        segments[i].y = st.y;
                        // show to Vlad
                        c('relX >= st.x01 && relX < st.x02');
                        c(relX+' >= '+st.x01+' && '+relX+' < '+st.x02);
                        if(relX >= st.x01 && relX < st.x02){
                            var y = segments[i].status;
                            self.editedStatus = segments[i]
                            editX1 = st.x01;
                            editX2 = st.x02;
                            self.drawEditArea(editX1, editX2);
							$('#log_list tbody tr').removeClass('editing');
							if(self.editedStatus.from.id > 0){
								$('#log_list tbody tr[id="'+self.editedStatus.from.id+'"]').addClass('editing');
							}
                        }
                    }
                }
            }
        }
        if(statusArea.editedStatus.from != undefined &&  self.editedStatus.from.id != $('#log_status_info').attr('data-id')){
            $('#log_status_info').attr('data-id', self.editedStatus.from.id);
            $('#location_name').val(self.editedStatus.from.location ? self.editedStatus.from.location : 'UNKNOWN');
            $('#latitude').val(self.editedStatus.from.lt);
            $('#longitude').val(self.editedStatus.from.lng);
            $('#note').val(self.editedStatus.from.message);
            //$('#editAnnotation').val(self.editedStatus.from.editAnnotation);
        }
        removeAttchment('all', false);
        if(self.editedStatus.from.documents.length > 0){
            $.each(self.editedStatus.from.documents, function(i, v){
                addAttchment(v, false);
            });
        }
        var new_status_type = self.editedStatus.status;
        $('.edit_status').removeClass('active');
        $('#status_'+new_status_type).addClass('active');
		c('finish createArea')
		c(self.segments)
    }
	
}

function addTimeControl(){ c('addTimeControl init'); c($('#time_control'));
    $('#time_control').timeEntry('destroy');
    $('#time_control').timeEntry({ 
        show24Hours: false,
        separator: ' : ', 
        ampmPrefix: ' ', 
        ampmNames: ['AM', 'PM'],  
        spinnerTexts: ['Now', 'Previous field', 'Next field', 'Increment', 'Decrement'], 
        appendText: '', 
        showSeconds: (isAobrd ? false : true),
        timeSteps: [1, 1, 1], 
        initialField: null, 
        noSeparatorEntry: true,  
        useMouseWheel: true,  
        defaultTime: null,
        minTime: null, 
        maxTime: null,
        spinnerImage: '/dash/assets/svg/log/spinnerUpDown.png', //'/dash/assets/svg/log/up-down.svg', 
        spinnerSize: [30, 32, 0], 	
        spinnerBigImage: '',
        spinnerBigSize: [30, 32, 0],
        spinnerIncDecOnly: true, 
        spinnerRepeat: [500, 250], 	
        beforeShow: null,  
        beforeSetTime: null
    }); 
}

/*
function addAnnotation(){
    $('#log_status_info').find('#annotation_box').remove();
    var annotation = '<li id="annotation_box"><label>Annotation</label>';
        annotation += '<select id="annotation_select" onchange="changeAnnotation(value);">';
        annotation += '<option value="0" selected>No reason selected</option>';
        annotation += '<option value="1">Rental Vehicle no ELD on-board</option>';
        annotation += '<option value="2">ELD Device Failure</option>';
        annotation += '<option value="-1" >Other</option>';
        annotation += '</select><div id="annotation_value"></div></li>';
    $('#log_status_info').find('.fields_list').append(annotation);
}
*/
function changeAnnotation(index){
    var annotation_note = '';
    if(index==-1){
        annotation_note = '<textarea id="editAnnotation" maxlength="60" rows="1" onchange="statusFieldChange(this)" placeholder="Edit Annotation"></textarea>';
        $('#annotation_value').html(annotation_note);
    } else {
        annotation_note = '<input type="hidden" id="editAnnotation" value="'+$('#annotation_select').find(":selected").text()+'"></input>';
        $('#annotation_value').html(annotation_note);
        //statusFieldChange($('#editAnnotation'));
    }
}
var originalSegments = {},
    originStatuses = {},
    statusArea = new StatusArea(originalSegments),
    newArea = new StatusArea(originalSegments),
    new_mode = false,
    todaysDate = false,
    today_date_string = false;
$(document).ready(function(){
    $('body').on('show.bs.modal', '#time_modal', function(event){  c('show time_modal'); 
        var selector = '#time_control';
        $(selector).timeEntry('option', 'minTime', null);
        $(selector).timeEntry('option', 'maxTime', null);
        var input_time = $(event.relatedTarget), 
            time_val = input_time.attr('data-time'); //val time_val = input_time.data('title'); // Extract value from data-* attributes
        var time_field_id = input_time.attr('id'); 
        var date_by_time = new Date(today_date_string+'T'+time_val);
		$(selector).removeAttr('data-time');
        var min_date_time, max_date_time;
        if(time_field_id == 'time_to'){
            if($('#time_from').attr('data-time')!= '00:00:00'){
                min_date_time = new Date(new Date(today_date_string.toString()+'T'+$('#time_from').attr('data-time')).getTime() + 60000);
        	}
            max_date_time = new Date(today_date_string.toString()+'T23:59:59');
            if (todaysDate && max_date_time > todaysDate) max_date_time = new Date(todaysDate.getTime() - 60000);
        } else {
            min_date_time = new Date(today_date_string.toString()+'T00:00:00');
            if($('#time_to').attr('data-time')!= '00:00:00'){
                max_date_time = new Date(new Date(today_date_string.toString()+'T'+$('#time_to').attr('data-time')).getTime() - 60000);
            }
        }
        $(selector).timeEntry('setTime', date_by_time);
        $(selector).timeEntry('option', 'minTime', min_date_time);
        $(selector).timeEntry('option', 'maxTime', max_date_time);
        $(selector).attr('data-time', time_field_id);
    });

    $("body").on('click', "#closeStatusMap", function(){
        $("#mapBlock").hide();
    });
    $('body').on('click', '#sendLogLocation', function(){
        if(!$(this).hasClass('active')){
            $("#mapBlock").show();
            getStatusGeolocation();
            $(this).addClass('active').text('Close map');
        } else {
            $(this).removeClass('active').text('Show map');
            $("#mapBlock").hide();
            //$("#sendLocBlock").hide(); 
        } 
    });
    
    $('body').on('hidden.bs.modal', '#attachments_modal', function(event){
       emptyAttachmentParams();
    });
	
	$('body').on('hidden.bs.modal', '#pending_approvals_modal', function(event){
       //$('.offer_row_title').addClass('collapsed');
	   $('.collapse.in').collapse('hide');
    });

    $('body').on('click', '#attachment_info', function(){
        $('#attachments_modal').addClass('edit');
        $('.save_edit').addClass('editing');
        emptyParams();
        attachmentControl();
    });
    
    $('body').on('click','.attachment_tab', function(){
        $('.attachment_tab').removeClass('active');
        $(this).addClass('active');
        if($(this).hasClass('attachment_add')){
            $('#attachment_list').hide();
            $('#attachment_add').show();
        } else {
            $('#attachment_add').hide();
            $('#attachment_list').show();
        }
    });

	$('body').on('focus','input', function(){
        $(this).removeClass('error');
		$('#save_info').attr('disabled', false);
    });

	$('body').on( 'input', '#distance,#item_distance', function() { 
		var distance = $(this).val().replace(',','.');
		$(this).val(distance);
	});

});




//Edit general info
 function editFields(){
	if(cantEdit){
		showModal('Cannot Edit', 'Driver option to edit logbook currently turned on, turn it off to be able to edit driver logbook <button class="btn btn-default" style="position: absolute;bottom: 0;right: 20px;" onclick="turnOffDriverEditMode('+originStatuses[0].userId+')">Turn Off Driver Edit</button>', 'basicModal');
		return false;
	}
    $('.edit_field').remove();
    if($('#log_info').hasClass('edit_active')){
        $('#log_info').removeClass('edit_active');
		$('#edit_main_info').removeClass('edit_active').text('Correction & Annotation');
        $('#log_info').find('.f_data').show();
        $('#save_info').attr('disabled', false).hide();
		leaveEditMode();
        return false;
    } else {
		enterEditMode()
        $('#log_info').addClass('edit_active');
        $('#edit_main_info').addClass('edit_active').text('Cancel');
        $('#save_info').attr('disabled', true).show();
    }
    var driverId = $('#select_carrier option:selected').attr('data-driverid');
    AjaxController('getInfoToAttachDocs', {userId: driverId, bol: 1}, dashUrl, 'drawEditFields', drawEditFields, true);
 }
 
 var modals = {};
var edit_lists = {vehicle:[], trailers:[], docs:[]};
var user_info = {};

 function drawEditFields(response){
    user_info = response.data;   
    c('user_info');
    c(user_info);
    c('edit_fields');
    c(edit_fields);
    c('eld');
    c(eld);
    c('isAobrd');
    c(isAobrd);

    var states = user_info['states'];
    user_info['vehicle'] = user_info['trucks'];
    $.each(edit_fields, function(index, field){ 
        //c('---'+index+'---');
        //c(field);
        $('.log_'+index).parents('.field').attr('id', 'field_'+index);
        $('#field_'+index).find('.f_data').hide();
        if(!$('#field_'+index).is(':has(.edit_field)')){
            $('.log_'+index).after('<div class="edit_field"></div>');
        }
        var edit_field = '';

        //driver
        if(index == 'driver'){
            edit_field += '<input type="text" id="first_name" maxlength="64" value="'+field[0]+'"/>';
            edit_field += '<input type="text" id="last_name" maxlength="64" value="'+field[1]+'"/>';
            //distance
        } else if(index == 'distance' && eld==0 && isAobrd==0){
            edit_field += '<input type="text" id="'+index+'" placeholder="0 mi" value="'+(typeof field !== 'undefined' && field !== null ? field:'')+'"/>';
            //var distance = typeof field !== 'undefined' && field !== null ? field : '';
        } else if(index == 'distances' && (eld!=0 || isAobrd!=0)){
            edit_field += '<ul id="'+index+'_list" new="0">';
            if(typeof field !== 'undefined' && field != null){
                var field_arr = field;  
                edit_lists[index.toString()] = JSON.parse(JSON.stringify(field));
                var distance = 0;
                if(field_arr.length > 0 ){
                    $.each(field_arr, function(key, field_val){
                        distance += field_val.distance;
                        var field_name = field_val.state_name+ ' '+ field_val.distance+' mi';
                        edit_field += '<li id="item_'+field_val.id+'" \n\
                            s-id="'+field_val.id+'" \n\
                            s-type="'+index+'" \n\
                            s-state="'+field_val.state+'" \n\
                            s-distance="'+field_val.distance+'" \n\
                            s-truck="'+field_val.truck+'" class="distance_info" onclick="editDistance(this)" >';
                        edit_field += '<span class="field_text" style="width: 100%" >'+field_name+'</span>';
                        edit_field +='<span class="removeEq" eq-id="'+field_val.id+'" eq-type="'+index+'" onclick="removeDistance(this)"></span>';
                        edit_field +='</li>';
                    });
                }
            }
            edit_field += '</ul>'; 
            var button_text = 'Add distance';
			edit_field += '<label for="distance" class="distance_label">Total: </label><span id="distance_total"></span>';
            edit_field += '<button id="add_'+index+'" class="edit_main_info_btn" onclick="addDistance()">'+button_text+'</button>';        
            index = 'distance';
            
        //vehicle, trailers, docs
        } else if(index == 'vehicle' || index == 'trailers' || index == 'docs'){
            edit_field += '<ul id="'+index+'_list">';
			var span_size = 0;
            if(typeof field !== 'undefined' && field != null){
                var field_arr = field;  
                edit_lists[index.toString()] = JSON.parse(JSON.stringify(field));
                    if(field_arr.length > 0 ){
                        $.each(field_arr, function(key, field_val){
                            var field_name = index == 'docs' && typeof field_val.reference !== 'undefined' ? field_val.reference : field_val.name;
                            edit_field += '<li id="item_'+field_val.id+'"><span class="field_text">'+field_name+'</span>';
                            edit_field +='<span class="removeEq" eq-id="'+field_val.id+'" eq-type="'+index+'" onclick="removeEquipment(this)"></span>';
                            edit_field +='</li>';
                        });
                    }
            span_size = field_arr.length%3;
			}
			var modal_title = index == 'vehicle' ? 'Add truck' : 'Add '+index,
            button_text = modal_title;
			
			 edit_field += '</ul>';
			 edit_field += '<button id="add_'+index+'" class="edit_main_info_btn span'+span_size+'" onclick="showFieldModal(\''+index+'\')">'+button_text+'</button>';


            //mainOffice, homeTerminal
        } else if(index == 'mainOffice' || index == 'homeTerminal'){
            if(typeof field === 'undefined' || field == null){
                field = {state:"0",address:"",zip:"",city:""};
            }
            edit_field += '<input type="text" id="'+index+'_address" placeholder="Enter Address" value="'+(typeof field.address !== 'undefined' ? field.address : '')+'"/>';
            edit_field += '<input type="text" id="'+index+'_city" placeholder="Enter City" value="'+(typeof field.city !== 'undefined' ? field.city : '') +'"/>';
            edit_field += '<input type="text" id="'+index+'_zip" placeholder="Enter Zip" value="'+(typeof field.zip !== 'undefined' ? field.zip : '')+'" maxlength="10"/>';
            if(states.length > 0){
                edit_field += '<select id="'+index+'_state">';
                edit_field += '<option type="text" value="0">Select State</option>';
                $.each(states, function(key, state){
                    edit_field += '<option type="text" value="'+state.id+'" '+(field.state == state.id ? 'selected="selected"':'')+'>'+state.name+'</option>';
                });
                edit_field += '</select>';
            }
        } else {
			var placeholder = index.charAt(0).toUpperCase() + index.substr(1).toLowerCase();
			c('index->'+index);
			switch (index) {
				case 'carrierName': placeholder = 'Carrier'; break;
				case 'coDrivers': placeholder = 'Co-drivers name'; break;
			}
            edit_field += '<input type="text" id="'+index+'" placeholder="'+placeholder+'" value="'+(typeof field !== 'undefined' && field !== null ? field:'')+'"/>';
        }
      
        $('#field_'+index).find('.edit_field').html(edit_field);
        if(eld!=0 || isAobrd!=0){
            calculateDistance();  
        }

    });
	$('#save_info').attr('disabled', false);
 }

//var modals = {};
function showFieldModal(index){c('showFieldModal');c('index');
    var select_arr = user_info[index]; c(user_info); 
    var modal_message = '';
		var visibleLi = 0;
		modal_message += '<ul class="equipment_add_list">';
		if(index == 'docs'){
            modal_message +='<li><input type="text" id="add_field_docs" value="" placeholder="Input reference"/><span class="add_eq blue-border" eq-id="-1" eq-type="'+index+'" onclick="addEquipment(this);">Add</span></li>';
        }
		if(select_arr.length > 0){
			$.each(select_arr, function(key, obj){ c(obj);
				var obj_name = index == 'docs' && typeof obj.reference !== 'undefined' ? obj.reference : obj.Name;
				var is_hidden = $('ul#'+index+'_list').is(':has(li#item_'+obj.id+')') ? 1 : 0;
							visibleLi += !is_hidden;
				modal_message += '<li id="'+index+'_'+obj.id+'" style="'+(is_hidden ? 'display:none':'')+'">'+obj_name; 
				modal_message +='<span class="add_eq blue-border" eq-name="'+obj_name+'" eq-id="'+obj.id+'" eq-type="'+index+'" onclick="addEquipment(this);">Add</span>';
				modal_message +='</li>';
			});
		} else {
			visibleLi = 0;
		}
		modal_message += '</ul>';
	if(visibleLi == 0 && index != 'docs'){
			var field_title = '';
				switch (index) {
            case 'docs': field_title = 'docs'; break;
            case 'vehicle': field_title = 'trucks'; break;
            case 'trailers': field_title = 'trailers'; break;
        } 				
        modal_message += 'You have no '+field_title;
	}

    var modal_title = index == 'vehicle' ? 'Add truck' : 'Add '+index,
        button_text = modal_title;
    //var modal_index = index.toString();
   // modals[modal_index] = {modal_title: modal_title, modal_message:modal_message};
   // showModal(modals.'+index+'.modal_title, modals.'+index+'.modal_message);
   showModal(modal_title, modal_message, 'basicModal');
}

function addEquipment(obj){
    var type = $(obj).attr('eq-type'),
        id = $(obj).attr('eq-id'),
        old_value = edit_lists[type],
        name = '';
	$(obj).removeClass('error');
    if(id == -1 && type == 'docs'){
        name = $('#add_field_docs').val();
		if(!name || name.length > 64){
			$('#add_field_docs').addClass('error');
			return false; 
		}
    } else {
        name = $(obj).attr('eq-name');
    }
    old_value.push({id:id, name: name});
    c(old_value);
    var new_field = '<li id="item_'+id+'"><span class="field_text">'+name+'</span>';
    new_field +='<span class="removeEq" eq-id="'+id+'" eq-type="'+type+'" onclick="removeEquipment(this)"></span>';
    new_field +='</li>';
    $('#field_'+type).find('ul').append(new_field);
	var span_size = $('#field_'+type).find('ul li').length%3;
	$('#field_'+type).find('.edit_main_info_btn').removeClass('span0').removeClass('span1').removeClass('span2').addClass('span'+span_size);
    $('#basicModal').modal('hide');
    //$('li#'+type+'_'+id).hide();
 }
 
 function removeEquipment(obj){
    var type = $(obj).attr('eq-type'),
        id = $(obj).attr('eq-id');
    $(obj).parent('li').remove();
    //c($('li#'+type+'_'+id).html());
    //$('li#'+type+'_'+id).show();
    var old_value = edit_lists[type];
    for(var x = 0; x < old_value.length; x++){
        if(old_value[x].id == id){
            old_value.splice(x, 1);
        }
    }
	var span_size = $('#field_'+type).find('ul li').length%3;
	$('#field_'+type).find('.edit_main_info_btn').removeClass('span0').removeClass('span1').removeClass('span2').addClass('span'+span_size);
 }
 
 function saveDistance(id){
    var obj = $('.edit_distance'),
        state = obj.find('#item_state option:selected').val(),
        state_title = obj.find('#item_state option:selected').text(),
        distance = parseFloat(obj.find('#item_distance').val()),
        truck = obj.find('#item_truck option:selected').val();
	obj.find('.error').removeClass('error');
	var regex = /^[0-9]{1,4}(?:[.][0-9]{1,})?\r?$/;
	var error = 0;
	if(!regex.test(distance) || distance==0){
		obj.find('#item_distance').addClass('error');
		error = 1;
	}
	
	if(truck == 0){
		obj.find('#item_truck').addClass('error');
		error = 1;
	}
	if(state == 0){
		obj.find('#item_state').addClass('error');
		error = 1;
	}
    
	if(error){ return false;}
    var distance_name = state_title+' '+roundPlus(distance,1)+' mi';

    $('ul#distances_list').find('li#item_'+id)
        .attr('s-state', state)
        .attr('s-distance', distance)
        .attr('s-truck', truck)
        .find('.field_text').text(distance_name);
    cancelDistanceEdit();
    calculateDistance();
}
function cancelDistanceEdit(){
    $('.edit_distance').remove();
    if($('ul#distances_list').find('li.edited').text()==''){
        $('ul#distances_list').find('li.edited').remove();
    }
    $('ul#distances_list').find('li.edited').removeClass('edited');
}

function calculateDistance(){
    var total = 0;
    $('ul#distances_list li').each(function () {
        total += parseFloat($(this).attr('s-distance'));
    });
    $('#distance_total').text(roundPlus(total,1));
    $('#distance').val(total);
}
function addDistance(){
    var newIndex = $('ul#distances_list').attr('new');
    newIndex = parseInt(newIndex);
    edit_field = '<li id="item_new_'+newIndex+'" \n\
    s-id="new_'+newIndex+'" \n\
    s-type="distances" \n\
    s-state="0" \n\
    s-distance="" \n\
    s-truck="0" \n\
	class="distance_info" onclick="editDistance(this)" >';
    edit_field += '<span class="field_text" style="width: 100%" ></span>';
    edit_field +='<span class="removeEq" eq-id="new" eq-type="distances" onclick="removeDistance(this)"></span>';
    edit_field += '</li>';
    $('ul#distances_list').append(edit_field).attr('new', newIndex+1);
    $('ul#distances_list').find('li#item_new_'+newIndex).click();
}
function removeDistance(obj){
    $(obj).parent('li').remove();
    calculateDistance();
}

 function editDistance(obj){
    var edit_field = '';
    var states = user_info['states'];
    var trucks = user_info['trucks'];
    var type = $(obj).attr('s-type'),
        id = $(obj).attr('s-id'),
        state_id = $(obj).attr('s-state'),
        truck_id = $(obj).attr('s-truck'),
        distance = $(obj).attr('s-distance');
    $('.edit_distance').remove();
	if($('.distance_info.edited').find('.field_text').text()==''){
		$('.distance_info.edited').remove();
	} else {
		$('ul#distances_list').find('li').removeClass('edited');
	}

    edit_field += '<div class="edit_distance" id="distance_'+id+'">';
    edit_field += distance !== 'undefined' ? '<div><label for="item_distance">Distance</label><input type="text" class="distance" id="item_distance" value="'+distance+'"/></div>' : '';
	
    if(states.length > 0){
        edit_field += '<div><label for="item_state">State</label>';
        edit_field += '<select id="item_state">';
        edit_field += '<option type="text" value="0">Select State</option>';
        $.each(states, function(key, state){
            edit_field += '<option type="text" value="'+state.id+'" '+(state_id == state.id ? 'selected="selected"':'')+'>'+state.name+'</option>';
        });
        edit_field += '</select></div>';
    }

    if(trucks.length > 0){
        edit_field += '<div><label for="item_truck">Trucks</label>';
        edit_field += '<select id="item_truck">';
        edit_field += '<option type="text" value="0">Select Trucks</option>';
        $.each(trucks, function(key, truck){
            edit_field += '<option type="text" value="'+truck.id+'" '+(truck_id == truck.id ? 'selected="selected"':'')+'>'+truck.Name+'</option>';
        });
        edit_field += '</select></div>';
    }
    
    edit_field += '<button id="save_distance" class="ez_button" onclick="saveDistance(\''+id+'\');">Save</button>';
    edit_field += '<button id="cancel_distance" class="ez_button blue-border" onclick="cancelDistanceEdit()">Cancel</button>';
    edit_field += '</div>';
    $('ul#distances_list').find('li#item_'+id).addClass('edited').after(edit_field);
    $('#item_state').change(function(){
        $('#item_truck option').show().prop('disabled', false);
        var item_state_id = $(this).val();
        $('ul#distances_list li').each(function(){
            if ($(this).attr('s-state') == item_state_id) {
                $('#item_truck option[value="'+$(this).attr('s-truck')+'"]').prop('disabled', true).hide();
            }
        });
    });
    $('#item_truck').change(function(){
        $('#item_state option').show().prop('disabled', false);
        var item_truck_id = $(this).val();
        $('ul#distances_list li').each(function(){
            if ($(this).attr('s-truck') == item_truck_id) {
                $('#item_state option[value="'+$(this).attr('s-state')+'"]').prop('disabled', true).hide();
            }
        });
    });    
}
 
function saveLogbook() {
    var fields = {};
    var error = [];
    var fields_count = 0;
    var date = convertDateToSQL($('#datepicker').val());
    if ($('#log_info.edit_active').length) {
        $('#save_info').attr('disabled',true);
        $('#cancel_distance').click();
        
        $('#log_info .edit_field input, #log_info .edit_field select').each(function () {
            var id = $(this).attr('id');
            var field = id.toString();
            var field_value = $(this).val();
            if(validateMainInfo(field, field_value)){
                error.push(field);
            }
            fields[field] = $.trim(field_value);
            fields_count++;
        });
        $('.edit_field .error').removeClass('error');
        if(error.length > 0 ){
            $.each(error, function(key, val){
                $('.edit_field #'+val).addClass('error');
            });
        } 
        
        if(fields_count && !error.length){
            fields['date'] = date;
            fields['trucks'] = JSON.stringify(edit_lists['vehicle']);
            fields['trailers'] = JSON.stringify(edit_lists['trailers']);
            fields['shippingDocs'] = JSON.stringify(edit_lists['docs']);

            var distances = [];
            $('ul#distances_list li').each(function () {
                var state = $(this).attr('s-state'),
                    distance_id = $(this).attr('s-id'),
                    distance = $(this).attr('s-distance'),
                    truck = $(this).attr('s-truck');
                var item = { date: date, distance: distance, id: distance_id, state: state, truck: truck, userId: driverId};
                distances.push(item);
            });
            fields['distances'] = JSON.stringify(distances);
        }
    }
    if (!error.length) {
        var driverId = $('#select_carrier option:selected').attr('data-driverid') || $('.driver_row.active').attr('data-id');
        var statuses = getStatusesForSave();
        AjaxController('saveLogbookData', { date:date,fields: fields, driverId:driverId, statuses: statuses}, dashUrl, 'saveLogbookHandler', saveLogbookHandlerError, true);
    }
}
function drawInfoEdits(info_edits) { //c(info_edits);
	var modal_message = '';
	var i = 0;
	$.each(info_edits, function(key, edit){ c(key); c(edit);
		if(edit){
			modal_message += drawInfoEditRow(key, edit);
			i++;
		}
	});
	edits_modal = {modal_title: 'Main Info Edits', modal_message:modal_message};
	c($('.edit_info').is(':has(#show_info_edits)'));
	if(i==0){
		$("#show_info_edits").remove();
					$('#basicModal').modal('hide');
	} else if(!$('.edit_info').is(':has(#show_info_edits)')){
		var button_code = '<button id="show_info_edits" class="blue-border" onclick="showModal(edits_modal.modal_title, edits_modal.modal_message, \'basicModal\')">Pending Approvals</button>';
		$(button_code).insertBefore('#edit_main_info');
	}
}
function drawInfoEditRow(key, edit) { 
    var str = '';
    var table_header_tr = '<th>Info</th><th>Data</th>';
    var edit_table = '<table class="table table-striped table-dashboard table-sm mobile_table ez_table ez_table_'+key+'"><thead>'+table_header_tr+'</thead><tbody>';
    $.each(edit.fields, function(field_type, field_value){ //c(field_type); c('---------------->'); c(field_value);
        if(field_type == 'trucks' || field_type == 'trailers' || field_type == 'shippingDocs'){
            var value_array = jQuery.parseJSON(field_value);
            var field_str = '';
            $.each(value_array, function(f_key, f_value){ c(f_value);
				var field_name =  field_type == 'shippingDocs' && typeof f_value.reference !== 'undefined' ? f_value.reference : f_value.name;
                field_str += (f_key != 0 ? ', ': '')+ field_name;
            });
            field_value = field_str;
        }
		if(field_type == 'officeAddressjson' || field_type == 'homeTerminaljson' ){
			field_array = jQuery.parseJSON(field_value); 
			field_value = field_array.address_string;
		}
		
		if(field_type == 'distances'){ c(value_array);
            var value_array = jQuery.parseJSON(field_value);
            var field_str = '';
            $.each(value_array, function(f_key, f_value){ c(f_value);
				var field_name =  f_value.state_name+' '+f_value.distance+' mi';
                    field_str += (f_key != 0 ? '; ': '')+ field_name
            });
            field_value = field_str;
		}

				
		var field_title = field_type;
        switch (field_type) {
            case 'shippingDocs': field_title = 'Shipping Docs'; break;
            case 'officeAddressjson': field_title = 'Main Office'; break;
            case 'homeTerminaljson': field_title = 'Home Terminal'; break;
            case 'coDrivers': field_title = 'Co Drivers'; break;  
            case 'carrierName': field_title = 'Carrier'; break;
        }                       
        
        edit_table += '<tr><td class="field_title">'+field_title+'</td><td>'+field_value.toString()+'<td></tr>';
    });
    edit_table += '<tbody></tbody></table>';

    str += '<div id="main_info_'+key+'" class="offer">';
    str += '<div class="offer-header" id="heading_'+key+'">';
    str += '<h5 class="mb-0"><div id="main_info_title_'+key+'" class="offer_row_title collapsed" data-toggle="collapse" data-target="#collapse_'+key+'" aria-expanded="false" aria-controls="collapse_'+key+'">Offer by '+edit.editor+' №'+key+'</div>';
    str += '<span class="delete_edit blue-border" onclick="removeInfoEdit('+key+');">Remove</span></h5></div>';
    str += '<div id="collapse_'+key+'" class="collapse" aria-labelledby="heading'+key+'" data-parent="#accordion">';
    str += '<div class="offer-body">'+edit_table+'</div></div></div>';
    return str;
}	

function removeInfoEdit(editId){
    AjaxController('removeInfoEdit', {editId: editId}, dashUrl, 'removeInfoEditHandler', removeInfoEditHandler, true);
}
function removeInfoEditHandler(response){ 
   var editId = response.data; 
   $('#main_info_'+editId).remove();
    info_edits[editId] = null;
    drawInfoEdits(info_edits);
}
function liActive(obj){
	if((obj).hasClass()){
    $(obj).removeClass('active');
	} else {
		$(obj).addClass('active');
	}
}



function validateMainInfo(field_type, field_value) {
    var error = 0;
    var regex = '';
		field_value  = $.trim(field_value);
    switch (field_type) {
        case 'mainOffice_address': 
        case 'homeTerminal_address': 
            var regex = /^([a-zA-Z0-9\-\,\.\;\#\:\'\s\/]){0,64}$/; break;
        case 'mainOffice_zip': 
        case 'homeTerminal_zip':
            var regex = /^([a-zA-Z0-9\-\,\.\;\#\:\'\s\/]){0,10}$/; break;
        case 'distance': 
            var regex = /^[0-9]{1,4}(?:[.][0-9]{1,})?\r?$/; break;
        case 'first_name':
        case 'last_name':
            var regex = /^([a-zA-Z\-\'\s]){1,64}$/; break;
        case 'mainOffice_city': 
        case 'homeTerminal_city': 
            var regex = /^([a-zA-Z\-\'\s]){0,64}$/; break;
        case 'from':
        case 'to':
            var regex = /^[^\~]{0,130}$/; break;	
        case 'carrierName':
            var regex = /^([a-zA-Z0-9\-\,\.\;\#\:\'\s\/]){0,130}$/; break;
        case 'coDrivers':
            var regex = /^([a-zA-Z\-\'\s\.\,]){0,129}$/; break;
        case 'notes':
            var regex = /^[^\~]{0,1000}$/; break;
            break;
    }
    if(regex!=''){
        error = !regex.test(field_value);
    }
	if(field_type=='distance' && field_value==''){
		error = 0;
	}

    return error;
}
function initStatusMap(lat,long) {  //c(lat); c(long);
        var latlng = new google.maps.LatLng(lat, long);
        var settings = {
           zoom: 15,
           center: latlng,
           mapTypeControl: true,
           mapTypeControlOptions: {style: google.maps.MapTypeControlStyle.DROPDOWN_MENU},
           navigationControl: true,
           navigationControlOptions: {style: google.maps.NavigationControlStyle.SMALL},
           mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        var map = new google.maps.Map(document.getElementById("googleMaps"), settings);
        map.addListener('dragend', function(){
            window.setTimeout(function(){ 
                moveStatusMarker();
            }, 400);
        });
        map.addListener('zoom_changed', function(){
            window.setTimeout(function(){ 
                moveStatusMarker();
            }, 800);
        });
 }
 
function getStatusGeolocation(){
    var lng = $('#longitude').val();
    var lat = $('#latitude').val();
    if(toInt(lat)!=0 && toInt(lat)!=0){
        initStatusMap(lat, lng, "sendLocation");
       return;
    }
    navigator.geolocation.getCurrentPosition(
    function(position) { 
            initStatusMap(position.coords.latitude, position.coords.longitude, "sendLocation");
            $('#longitude').val(position.coords.longitude).trigger('change');
            $('#latitude').val(position.coords.latitude).trigger('change');
        },
    function(positionError){
            initStatusMap(40.708453,-74.00854, "sendLocation");
            $('#longitude').val(-74.00854).trigger('change');
            $('#latitude').val(40.708453).trigger('change');
        }                
    );
  }
function timeToString(date, sec){
    var hh = date.getHours(),
        mm = date.getMinutes(),
        ss = date.getSeconds();
    if (hh < 10) {hh = "0"+hh;}
    var diff15 = mm%15;
    mm = mm - diff15;
    if (mm < 10) {mm = "0"+mm;} 
    if (ss < 10) {ss = "0"+ss;}
    
    var time_string = hh+":"+mm+(sec ? ":"+ss : "");
    return time_string;
}
function turnOffDriverEditMode(driverId, el){
    AjaxController('turnOffDriverEditMode', {driverId: driverId}, dashUrl, function(){changeLogbook()}, function(){changeLogbook()}, true);
    $(el).closest('.modal-dialog').find('.close').click();
}
