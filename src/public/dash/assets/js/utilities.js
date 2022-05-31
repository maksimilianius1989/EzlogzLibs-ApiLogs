var dashUrl = '/db/dashController/';
var USADATETIMEFORMAT = 'MM-DD-YYYY hh:mm:ss A';
var SQLDATETIMEFORMAT = 'YYYY-MM-DD HH:mm:ss';
var USADATEFORMAT = 'MM-DD-YYYY';
var SQLDATEFORMAT = 'YYYY-MM-DD';
function clearList(){
    $('#list_box').find('h2').text('');
    $('#list_box').find('table th, table td').remove();
}
function fillList(h2, headers, body){
    $('#list_box').find('h2').text(h2);
    $('#list_box').find('table thead tr').append(headers);
    $('#list_box').find('table tbody').append(body);
}
function showList(){
    $('#list_box').show();
}
function addHoursToDateTimeString(dateTime, hours = 0){
    var t = moment(dateTime)
    t.add(hours, 'hours');
    return t.format('YYYY-MM-DD HH:mm:ss');
}
function timeFromSecToSqlString(sec, toLocal = false){
    if(toLocal)
    sec-= new Date().getTimezoneOffset()*60*1000;
    return new Date(sec).toISOString().slice(0, 19).replace('T', ' ');
}
function timeFromSecToUSAString(sec, toLocal = true){
    return convertDateToUSA(timeFromSecToSqlString(sec*1000, toLocal), true, true);
}
function timeFromSQLDateTimeStringToUSAString(dateTime, toLocal = true){
    if (dateTime == null || dateTime == '0000-00-00' || !dateTime.toString().length) return '';
    var withTime = (dateTime.toString().length <= 10 ? false : true);
	dateTime = dateTime.replace(/-/g, '/');
	if(new Date(dateTime) == 'Invalid Date'){
		return '';
	}
	var sec= new Date(dateTime).getTime() - new Date().getTimezoneOffset()*60*1000;
	return convertDateToUSA(timeFromSecToSqlString(sec, toLocal), withTime, true);
}
function convertOnlyTimeFromSqlToUsa(time, toLocal = false) {
	if (time == null || !time.toString().length) return '';
    if (time == '00:00:00') return '12:00:00AM';
    if (time == '00:00') return '12:00AM';
    if (toLocal) {
        colon_count = (time.toString().match(/:/g) || []).length;
        time_arr = time.split(':');
        sec = new Date('1970-01-02T'+(time_arr[0].toString().length == 1 ? '0'+time : time)+'Z').getTime() - new Date().getTimezoneOffset()*60*1000;
        time = new Date(sec).toISOString().replace(/^.+?T(.+?)\.000Z$/, '$1');
        if (colon_count == 1) time = time.replace(/^(\d+:\d+):\d+$/, '$1');
    }
    time = time.toString().match (/^([01]\d|2[0-3]|[0-9])(:)([0-5]\d)(:[0-5]\d)?$/) || [time];
    if (time.length > 1) { // If time format correct
      time = time.slice (1);  // Remove full string match value
      time[5] = +time[0] < 12 ? 'AM' : 'PM'; // Set AM/PM
      time[0] = +time[0] % 12 || 12; // Adjust hours
    }
    return time.join (''); // return adjusted time or original string
}
// for old compatibility
function tConvert(time) {
    return convertOnlyTimeFromSqlToUsa(time);
}
function convertDateToUSA($date, withTime, ampm){
	if(!$date) {
        return 'null';
    }
    var y = $date.substring(0, 4);
    var m = $date.substring(5, 7);
    var dd = $date.substring(8, 10);
    var rest = $date.substring(11);
    if(withTime){
        if(ampm){
            return m + "-" + dd + "-" + y + ' ' +tConvert(rest);
        }
        return m + "-" + dd + "-" + y + ' ' +rest;
    }
    return m + "-" + dd + "-" + y;
}
function pad (str, max) {
  str = str.toString();
  return str.length < max ? pad("0" + str, max) : str;
}
function convertDateToSQL($date, withTime){
    var d;
    if (/^\d{4}-\d{2}-\d{2}$/.test($date)) {
        return $date;
    } else if ($.type($date) == 'date') {
        d = $date;
    } else if($date == ''){
        d = new Date();
    } else {
        if($date.indexOf('-') > -1){
            var myDate=$date.split("-");
        }else if($date.indexOf('/') > -1){
            var myDate=$date.split("/");
        }
        if(withTime) {
            var onlyTime = myDate[2].substring(5);
            if (onlyTime.indexOf('AM') > 0) {
                onlyTime = onlyTime.replace('AM', '');
                onlyTime = onlyTime.split(':');
                if (onlyTime[0] == 12) onlyTime[0] = 0;
                onlyTime = onlyTime.join(':');
            } else if (onlyTime.indexOf('PM') > 0) {
                onlyTime = onlyTime.replace('PM', '');
                onlyTime = onlyTime.split(':');
                if (onlyTime[0] < 12) onlyTime[0] = parseInt(onlyTime[0]) + 12;
                onlyTime = onlyTime.join(':');
            }
            var newDate=myDate[2].substring(0, 4)+"/"+myDate[0]+"/"+myDate[1] + ' ' +onlyTime;
        } else {
            var newDate=myDate[2]+"/"+myDate[0]+"/"+myDate[1];
        }
        var d = new Date(newDate);
    }
    var curr_date = d.getDate();
    var curr_month = d.getMonth() + 1; //Months are zero based
    var curr_year = d.getFullYear();
    var pad = "00";
    var curr_month = (pad+curr_month).slice(-pad.length);
    var curr_date = (pad+curr_date).slice(-pad.length);
    if(withTime){
        var mins = (pad+d.getMinutes()).slice(-pad.length);
        var hours = (pad+d.getHours()).slice(-pad.length);
        var seconds = (pad+d.getSeconds()).slice(-pad.length);
        var returnVar =  curr_year + "-" + curr_month + "-" + curr_date + ' ' +hours+':'+mins+':'+seconds;
    }else
        var returnVar = curr_year + "-" + curr_month + "-" + curr_date;
    return returnVar;
}
function c(t){
    if(DEV_ENV){
        // console.log(t)
    }
}
function slide(direction){
	var left =  $('.image_box').first().css('left').replace(/[^-\d\.]/g, '');
	var marg = $('.image_box').first().css('margin-right').replace(/[^-\d\.]/g, '');
	var wid = $('.image_box').first().css('width').replace(/[^-\d\.]/g, '');
	var step = parseFloat(marg)+parseFloat(wid)+2;
	var max_left = ($('.image_box').length-4) * step;
	if(direction == 'left'){
			if(left > -max_left){
					var newLeft = parseFloat(left) - step;
					$('.image_box').animate({'left':newLeft+'px'}, 500)
			}
	}else if(direction == 'right'){
			if(left < 0){
					var newLeft = parseFloat(left) + step;
					$('.image_box').animate({'left':newLeft+'px'}, 500)
			}
	}
}

function IsEmail(email) {
	var regex = /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/;
	return regex.test(email);
}

function isScrolledIntoView(elem)
{
    var $elem = $(elem);
    var $window = $(window);

    var docViewTop = $window.scrollTop();
    var docViewBottom = docViewTop + $window.height();

    var elemTop = $elem.offset().top;
    var elemBottom = elemTop + $elem.height();

    return ((elemBottom <= docViewBottom) && (elemTop >= docViewTop));
}
Date.prototype.yyyymmdd = function() {
	var yyyy = this.getFullYear().toString();
	var mm = (this.getMonth()+1).toString(); // getMonth() is zero-based
	var dd  = this.getDate().toString();
	return (mm[1]?mm:"0"+mm[0]) + '-'+(dd[1]?dd:"0"+dd[0]) + '-'+yyyy; // padding
   };
Date.prototype.customFormat = function(formatString){
  var YYYY,YY,MMMM,MMM,MM,M,DDDD,DDD,DD,D,hhhh,hhh,hh,h,mm,m,ss,s,ampm,AMPM,dMod,th;
  YY = ((YYYY=this.getFullYear())+"").slice(-2);
  MM = (M=this.getMonth()+1)<10?('0'+M):M;
  MMM = (MMMM=["January","February","March","April","May","June","July","August","September","October","November","December"][M-1]).substring(0,3);
  DD = (D=this.getDate())<10?('0'+D):D;
  DDD = (DDDD=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][this.getDay()]).substring(0,3);
  th=(D>=10&&D<=20)?'th':((dMod=D%10)==1)?'st':(dMod==2)?'nd':(dMod==3)?'rd':'th';
  formatString = formatString.replace("#YYYY#",YYYY).replace("#YY#",YY).replace("#MMMM#",MMMM).replace("#MMM#",MMM).replace("#MM#",MM).replace("#M#",M).replace("#DDDD#",DDDD).replace("#DDD#",DDD).replace("#DD#",DD).replace("#D#",D).replace("#th#",th);
  h=(hhh=this.getHours());
  if (h==0) h=24;
  if (h>12) h-=12;
  hh = h<10?('0'+h):h;
  hhhh = hhh<10?('0'+hhh):hhh;
  AMPM=(ampm=hhh<12?'am':'pm').toUpperCase();
  mm=(m=this.getMinutes())<10?('0'+m):m;
  ss=(s=this.getSeconds())<10?('0'+s):s;
  return formatString.replace("#hhhh#",hhhh).replace("#hhh#",hhh).replace("#hh#",hh).replace("#h#",h).replace("#mm#",mm).replace("#m#",m).replace("#ss#",ss).replace("#s#",s).replace("#ampm#",ampm).replace("#AMPM#",AMPM);
};
function daydiff(first, second) {
    return Math.round((second-first)/(1000*60*60*24));
}

function curUserIsEzlogzEmployee(){
    if([TYPE_EMPLOYEE, TYPE_SUPERADMIN, TYPE_EZLOGZ_MANAGER, TYPE_EZLOGZ_RESELLER].indexOf(position) > -1){
        return true;
    }
    return false;
}
function curUserIsClient(){
    return !curUserIsEzlogzEmployee();
}

function isDriver(pos = false){
    if(!pos) pos = position;
    if([TYPE_DRIVER, TYPE_DRIVER_ELD].indexOf(parseInt(pos)) > -1){
        return true;
    }
    return false;
}

function toFixedFloat(num, am){
    return parseFloat(parseFloat(num).toFixed(am));
}
function parseDate(input){
    if (!input.toString().length) return input;
    var parts = input.match(/(\d+)/g);
    return new Date(parts[0], parts[1]-1, parts[2]);
}

function getDisplayValue(v){
	if(v == 'null' || v == null || v == 'undefined' || v == undefined){
		v = '';
	} 
	return v; 
}
function getFormData(form){
    var unindexed_array = $(form).serializeArray();
    var indexed_array = {};

    $.map(unindexed_array, function(n, i){
        indexed_array[n['name']] = n['value'];
    });

    return indexed_array;
}
function getDriverAppUsageVersion(appVersion, phoneType) {
    var platform;
	var cellText = '';
    if (appVersion != undefined) {
        appVersion = appVersion == 'null' || appVersion == null ? 'Unknown, Not Latest' : appVersion;
        if (phoneType == 1) {
            platform = 'android';
            if (versionCompare(appVersion, APP_ANDROID_VERSION) < 0) {
                appVersion = '<span style="color: #a94442 !important;">' + appVersion + '</span> (Current ' + APP_ANDROID_VERSION + ')'
            } else {
                appVersion = '<span style="color: green !important;">' + appVersion + '</span>'
            }
        } else if (phoneType == 0) {
            platform = 'ios';
            if (versionCompare(appVersion, APP_IOS_VERSION) < 0) {
                appVersion = '<span style="color: #a94442 !important;">' + appVersion + '</span> (Current ' + APP_IOS_VERSION + ')'
            } else {
                appVersion = '<span style="color: green !important;">' + appVersion + '</span>'
            }
        }
		cellText = '<div style="display: inline-block;vertical-align: middle;" class="login_event ' + platform + '"></div>' + appVersion;
    }
    
    return cellText;
}
function versionCompare(v1, v2, options) {
    var lexicographical = options && options.lexicographical,
            zeroExtend = options && options.zeroExtend,
            v1parts = v1.split('.'),
            v2parts = v2.split('.');

    function isValidPart(x) {
        return (lexicographical ? /^\d+[A-Za-z]*$/ : /^\d+$/).test(x);
    }

    if (!v1parts.every(isValidPart) || !v2parts.every(isValidPart)) {
        return NaN;
    }

    if (zeroExtend) {
        while (v1parts.length < v2parts.length)
            v1parts.push("0");
        while (v2parts.length < v1parts.length)
            v2parts.push("0");
    }

    if (!lexicographical) {
        v1parts = v1parts.map(Number);
        v2parts = v2parts.map(Number);
    }

    for (var i = 0; i < v1parts.length; ++i) {
        if (v2parts.length == i) {
            return 1;
        }

        if (v1parts[i] == v2parts[i]) {
            continue;
        } else if (v1parts[i] > v2parts[i]) {
            return 1;
        } else {
            return -1;
        }
    }

    if (v1parts.length != v2parts.length) {
        return -1;
    }

    return 0;
}
function addTableActionRow(buttons, width){
    var buttonsText = '';
    $.each(buttons, function(key, but){
        buttonsText+='<li>'+but+'</li>';
    })
    var dropdown = 'dropdown';
    var hide = '';
    if(buttonsText == ''){
        dropdown = '';
        hide = 'opacity:0; cursor:initial;'
    }
    var style = '';
    if(width) {
        style = `style="min-width:${width}px;"`;
    }
    return `
        <div class="dropdown">
            <button style="${hide}" type="button" data-toggle="${dropdown}" onclick="dropdownBs(event)"><i class="fa fa-ellipsis-v"></i></button>
            <ul class="dropdown-menu dropdown-menu-right dropdown-menu-actions-table-row" aria-labelledby="dropdownActionMenu_" ${style}>
                <li class="bottom dropdown-arrow"></li>
                ${buttonsText}
            </ul>
        </div>`;
}

function addDropdownButton(buttons, params=[]){
    var buttonsText = '';
    var name = typeof params.name !== 'undefined' ? params.name : '';
    $.each(buttons, function(key, but){
        buttonsText+='<li>'+but+'</li>';
    });
    var dropdown = 'dropdown';
    var hide = '';
    if(buttonsText == ''){
        dropdown = '';
        hide = 'opacity:0; cursor:initial;'
    }
    var style = 'padding-right:20px;';
    if(typeof params.width !== 'undefined') {
        style += `min-width:${params.width}px;`;
    }
    return `
        <div class="dropdown" style="display: inline-block; position: relative;">
          <button id="dLabel" type="button" class="btn btn-default" data-toggle="${dropdown}" onclick="dropdownBs(event)" aria-haspopup="true" aria-expanded="false">
            ${name}
            <span class="caret"></span>
          </button>
          <ul class="dropdown-menu" aria-labelledby="dLabel" style="${style}">
            ${buttonsText}
          </ul>
        </div>
    `;
}

function dropdownBs(e) {
    e.stopPropagation();
    var target = e.target || e.srcElement;
    if ($(target).closest('.dropdown').find('.dropdown-menu').is(":hidden")) {
        $('.dropdown').removeClass('open');
        $(target).closest('.dropdown').find('.dropdown-menu').dropdown('toggle');
    } else {
        //Height fix
        $(target).closest('.table_wrap').height('auto');
        $(target).closest('.dropdown').removeClass('open');
    }
}

function checkButtonInit(id, active = false){
	$('#'+id+' button').removeClass('active');
	if(active){
		$('#'+id+' button[data-val=1]').addClass('active');
	}else{
		$('#'+id+' button[data-val=0]').addClass('active');
	}
}
function miles2km(c) {
    return (c * 1.6093).toFixed(2);  // returns a string
}
function km2miles(c) {
    return (c / 1.6093).toFixed(2);  // returns a string
}

function GetURLParameter (sParam) {
    var sPageURL = window.location.search.substring(1);
    var sURLVariables = sPageURL.split('&');

    for (var i = 0; i < sURLVariables.length; i++) {
        var sParameterName = sURLVariables[i].split('=');
        if (sParameterName[0] == sParam) {
            return sParameterName[1];
        }
    }

    return false;
}

function addDatePicker (selector, params = {}, mask = '') {
    if(mask != ''){
        $(selector).mask(mask).datepicker(params);
    }else{
        $(selector).datepicker(params);
    }
}

(function ($) {
    $.extend({
        playSound: function () {
            return $(
                   '<audio class="sound-player" autoplay="autoplay" style="display:none;">'
                     + '<source src="' + arguments[0] + '" />'
                     + '<embed src="' + arguments[0] + '" hidden="true" autostart="true" loop="false"/>'
                   + '</audio>'
                 ).appendTo('body');
        },
        stopSound: function () {
            $(".sound-player").remove();
        }
    });
})(jQuery);