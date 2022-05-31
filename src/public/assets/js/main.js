String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};
$().ready(function(){
    if (typeof NEW_API_BACKEND_URL !== 'undefined') {
        $.ajax({
            type: "GET",
            url: `${NEW_API_BACKEND_URL}/api/auth`,
            xhrFields: {withCredentials: true},
            success: function (response) {
                apiSessionToken = response != '' ? response.token : '';
            },
            error: function(error) {
                console.log(error);
            }
        });
    }

    $(document).on('click', function(event){
        if( $(event.target).closest("#mobilemenu").length || $(event.target).closest(".account_access").length || $(event.target).closest("header .user_row").length || $(event.target).closest("#user_tabs").length || $(event.target).closest("#user_nav").length)
            return;
        $("#user_tabs").hide();
        event.stopPropagation();
    });

    $('.dash_nav a').click(function(){
        $("#user_tabs").hide();
    });
    $('body').on('click', '.dash_url_button', function(e){
        $("#user_tabs").hide();
    });
	
	$('body').on('paste', 'input', function(){
		var el = this;
		if(!$(el).hasClass("no_paste")) {
			setTimeout(function() {
				var filter = $(el).keyup();
			}, 100);
		}
	})
});
function minimizeMenu() {
    if ($('body').hasClass('minimize-menu')) {
        $('body').removeClass('minimize-menu');
        createCookie('minimize-menu', '');
    } else {
        $('body').addClass('minimize-menu-nohover');
        setTimeout(function(){
            $('body').removeClass('minimize-menu-nohover');
            $('body').addClass('minimize-menu');
            createCookie('minimize-menu', 'minimize-menu');
        }, 500);
    }
}

//Validation Helper
function setError($obj, message) {
    $obj.next('.error-handler').remove();
    $obj.addClass('error').after('<p class="error-handler">'+ message +'</p>');
    if($obj.hasClass('input-group'))
        $obj.find('.form-control, .input-group-btn').addClass('error');

    return false;
}
function resetError($obj) {
    if($obj){
        $obj.find('.error').removeClass('error');
        $obj.find('.error-handler').remove();
    }
    else {
        $('.error').removeClass('error');
        $('.error-handler').remove();
    }
}
$('body').on('keydown', '.modal-white input', function (e) {
    $(this).removeClass('error');
    $(this).parent().find('.error-handler').remove();
});
$('body').on('change', '.modal-white select', function (e) {
    $(this).removeClass('error');
    $(this).parent('.input-group').next('.error-handler').remove();
    $(this).parent().find('.error-handler').remove();
    $(this).find('.error-handler').remove();
});

function validateEmail(email) {
    var re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

//Alerts
function alertMessage($obj, message, time_out) {
    $obj.find('.alert.alert-success').remove();
    $obj.append('<div class="alert alert-success fade" role="alert">'+ message +'</div>');
    $obj.find('.alert').fadeTo(0, 1);
    if(time_out > 0)
        objectFadeRemove($obj.find('.alert'), time_out);
}
function alertError($obj, message, time_out) {
    $obj.find('.alert.alert-danger').remove();
    $obj.append('<div class="alert alert-danger fade" role="alert">'+ message +'</div>');
    $obj.find('.alert').fadeTo(0, 1);
    if(time_out > 0)
        objectFadeRemove($obj.find('.alert'), time_out);
}
//Remove object with fade effect
function objectFadeRemove($obj, time_out) {
    if(time_out >= 0) {
        window.setTimeout(function() {
            $obj.fadeTo(500, 0).slideUp(500, function(){
                $(this).remove();
            });
        }, time_out);
    }
}
function convertUSADateTime(dt) {
    var dateTime = dt.split(" ");
    if(!dateTime.length)
        return '';
    var arr_date = dateTime[0].split("-");
    var time = typeof dateTime[1] != 'undefined' ? dateTime[1].split(":") : [0,0,0];
    var date = new Date(arr_date[0], (arr_date[1]-1), arr_date[2], time[0], time[1], time[2], 0);
    var d = date.getDate();
    var m = date.getMonth() + 1;
    var y = date.getFullYear();
    return (m <= 9 ? '0' + m : m) + '/' + (d <= 9 ? '0' + d : d)  + '/' + y + (typeof dateTime[1] != 'undefined' ? ' '+time[0]+':'+time[1]+':'+time[2]:'');
}

/**
 * @param date
 * @param USAFormat - if USA Format '19-07-2018'
 * @returns {string}
 */
function formatDate(date, USAFormat = false) {
    if (date !== false) {
        if (date.toString().indexOf('-') > 0) {
            date = date.toString().replace(/-/g, '/');
        }
    }

    var dateParts = date.substring(0,10).split('/');
    if(USAFormat == true) {
        date = dateParts[0] + '/' + dateParts[1] + '/' + dateParts[2];
    }
    else {
        date = dateParts[1] + '/' + dateParts[0] + '/' + dateParts[2];
    }

    date = new Date(date);
    var pad = "00";
    var day = date.getDate();
    var day = (pad+day).slice(-pad.length);
    var monthIndex = (pad + (date.getMonth()+1)).slice(-pad.length);
    var year = date.getFullYear();
    return monthIndex + '/' + day + '/' + year;
}
//Local Storage test
function storageAvailable(type) {
    try {
        var storage = window[type],
            x = '__storage_test__';
        storage.setItem(x, x);
        storage.removeItem(x);
        return true;
    }
    catch(e) {
        return e instanceof DOMException && (
            // everything except Firefox
            e.code === 22 ||
            // Firefox
            e.code === 1014 ||
            // test name field too, because code might not be present
            // everything except Firefox
            e.name === 'QuotaExceededError' ||
            // Firefox
            e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
            // acknowledge QuotaExceededError only if there's something already stored
            storage.length !== 0;
    }
}

/**
 * Charge Bootstrap popover
 * @link https://getbootstrap.com/docs/3.3/javascript/#popovers
 * @param e
 */
function showPopover(e) {
    $(e).popover('show');
}
/**
 * Bootstrap Modal
 * @param title
 * @param message
 * @param id
 */
function showModal(title='', message='', id='', sizeClass = '', additionalParams = {}) {
    var additionalButtons = '';
    if(additionalParams.footerButtons != undefined){
        additionalButtons = additionalParams.footerButtons;
    }
    var template = '<div '+(id ? 'id="'+id+'"' : '')+' class="'+(!$.isFunction($.fn.bsModal) ? 'modal ' : '')+'modal-white modal-bs-basic" role="dialog"><div class="modal-dialog '+sizeClass+'" role="document"><div class="modal-content"><div class="modal-header"><button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button><h4 class="modal-title">'+title+'</h4></div><div class="modal-body"><p>'+message+'</p></div><div class="modal-footer">'+additionalButtons+'</div></div></div></div>';
	template = $(template);
	if($('.content').length > 0)
		$('.content').append(template);
	else
		$('body').append(template);
    if($.isFunction($.fn.bsModal)) {
        $('.modal-bs-basic').bsModal('show');
    }
    else {
        $('.modal-bs-basic').modal('show');
    }
	return template;
}

/**
 * Remove last closed modal
 */
$(document).off('hidden.bs.modal','.modal-bs-basic').on('hidden.bs.modal','.modal-bs-basic', function () {
    $(this).remove().data('bs.modal', null);
    if($('.modal-bs-basic.in, .modal.in, .modal-white.in').length > 0) {
        $('body').addClass('modal-open');
    }
});

/**
 * Move class .modal-backdrop(transparent gray background) to modal
 */
$(document).off('shown.bs.modal','.modal, .modal-white, .modal-bs-basic').on('shown.bs.modal','.modal, .modal-white, .modal-bs-basic', function () {
    $(this).find('.modal-backdrop').remove();
    $('body').find('.modal-backdrop:not(.modal .modal-backdrop, .modal-white .modal-backdrop, .modal-bs-basic .modal-backdrop)').remove();
    $(this).prepend('<div class="modal-backdrop in" data-dismiss="modal"></div>');
});

/**
 * Bootstrap Modal Confirmation
 * @actions #btnConfirmClick
 * @actions #btnCancelClick
 */
function showModalConfirmation(title, message, params = {}) {
    var confirmAction = '';
    if(params.confirmAction != undefined){
        confirmAction = params.confirmAction;
    }
    $('#confirmationModal').remove();
    showModal(title, message, 'confirmationModal');
    $('#confirmationModal .modal-footer button').remove();
    $('#confirmationModal .modal-footer').append('<button type="button" class="btn btn-primary" id="btnConfirmClick" data-dismiss="modal" '+(confirmAction != '' ? 'onclick="'+confirmAction+'"' : '')+'>Confirm</button><button type="button" class="btn btn-default" id="btnCancelClick" data-dismiss="modal">Cancel</button>');
}

/**
 * AJAX response message
 * @param response
 */
function responseModalMessage(response){
    $('button').attr('disabled', false);
    if(typeof response == 'undefined' || typeof response.data.modalShow == 'undefined') {
        return;
    }
    var data = response.data.modalShow;
    if(typeof data.modalHide !== 'undefined' && data.modalHide === true) {
        $('.modal').modal('hide');
    }
    var modalId = typeof data.modalId !== 'undefined' ? data.modalId : '';
    if(typeof data.title !== 'undefined' && typeof data.message !== 'undefined') {
        showModal(data.title, data.message, modalId);
    }
}

//Hide datepicker
$("html, body").on("DOMMouseScroll MouseScrollEvent MozMousePixelScroll wheel scroll", function () {
    $("#ui-datepicker-div").hide();
});
//округление числа
function roundPlus(x, n){ //x - число, n - количество знаков
    if(isNaN(x) || isNaN(n)){
        return false;
    }
    var m = Math.pow(10,n);
    return Math.round(x*m)/m;
}
function doActive(el){
    if(!$(el).hasClass('active')){
        $(el).parent().find('button').removeClass('active');
        $(el).addClass('active')
    }
}
//get app user info settings
function mainGetAppUserInfo() {
    AjaxCall({action:'getAppUserInfo',url:dashUrl, successHandler:mainGetAppUserInfoHandler});
}
function mainGetAppUserInfoHandler(response){
    $.each(response.data, function(k, val){
        USER_SETTINGS[val.field] = val.value;
    });
    $('#dash_head').removeClass('hideViolations')
    $('#dash_head').removeClass('hideNotifications')
    if(USER_SETTINGS['InspectionMode'] == 1 && USER_SETTINGS['InspectionModeHideViolations'] == 1){
        $('#dash_head').addClass('hideViolations')
    }
    if(USER_SETTINGS['InspectionMode'] == 1 && USER_SETTINGS['InspectionModeHideNotifications'] == 1){
        $('#dash_head').addClass('hideNotifications')
    }
}

function checkAllTableCheckbox(el){
    if($(el).is(':checked')){
        $('.table-checkbox-filter>tbody>tr>td input[type="checkbox"]').prop('checked', true);
        $('.table-checkbox-filter>tbody>tr').addClass('active');
    }else{
        $('.table-checkbox-filter>tbody>tr>td input[type="checkbox"]').prop('checked', false);
        $('.table-checkbox-filter>tbody>tr').removeClass('active');
    }
}
/**
 * SSL and Base64 Data Encryption
 * @param data
 * @returns {string}
 */
function ssl_b64_encrypt(data) {
    var crypt = new JSEncrypt();
    crypt.setPublicKey(SSL_KEY_PUBLIC);
    return crypt.encrypt(data);
}

String.prototype.trunc = function( n, useWordBoundary ){
	if (this.length <= n) { return this; }
	var subString = this.substr(0, n-1);
	return (useWordBoundary 
	? subString.substr(0, subString.lastIndexOf(' ')) 
	: subString) + "&hellip;";
};

function eraseCookie(name) {
    createCookie(name, "", -1, true);
	createCookie(name, "", -1);
}

function createCookie(name, value, days, global = false) {
    var expires;
    var domain = '';
    if(global){
        domain = ";domain="+SITECOOKIES;
    }
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toGMTString();
    } else {
        expires = "";
    }
	var cook = encodeURIComponent(name) + "=" +value + expires + domain+" ;path=/";
	// console.log(cook);
    document.cookie = cook;
}

function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i=0; i<ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1);
        if (c.indexOf(name) == 0) return c.substring(name.length,c.length);
    }
    return "";
}

function eraseCookies(){
    eraseCookie("thumb");
    eraseCookie("userId");
    eraseCookie("role");
    eraseCookie("last");
    eraseCookie("user");
    eraseCookie("PHPSESSID");
    eraseCookie("session");
    eraseCookie("login");
    eraseCookie("compos");
    eraseCookie("verifyPhone");
    eraseCookie("verifyEmail");
    eraseCookie("logPageInfo");
    eraseCookie("poi");
    eraseCookie("poi_ws");
    eraseCookie("cur_platform");
    facebookLogout();
    signOut();//google
}

var isEqual = function (value, other) {

	// Get the value type
	var type = Object.prototype.toString.call(value);

	// If the two objects are not the same type, return false
	if (type !== Object.prototype.toString.call(other)) return false;

	// If items are not an object or array, return false
	if (['[object Array]', '[object Object]'].indexOf(type) < 0) return false;

	// Compare the length of the length of the two items
	var valueLen = type === '[object Array]' ? value.length : Object.keys(value).length;
	var otherLen = type === '[object Array]' ? other.length : Object.keys(other).length;
	if (valueLen !== otherLen) return false;

	// Compare two items
	var compare = function (item1, item2) {

		// Get the object type
		var itemType = Object.prototype.toString.call(item1);

		// If an object or array, compare recursively
		if (['[object Array]', '[object Object]'].indexOf(itemType) >= 0) {
			if (!isEqual(item1, item2)) return false;
		}

		// Otherwise, do a simple comparison
		else {

			// If the two items are not the same type, return false
			if (itemType !== Object.prototype.toString.call(item2)) return false;

			// Else if it's a function, convert to a string and compare
			// Otherwise, just compare
			if (itemType === '[object Function]') {
				if (item1.toString() !== item2.toString()) return false;
			} else {
				if (item1 !== item2) return false;
			}

		}
	};

	// Compare properties
	if (type === '[object Array]') {
		for (var i = 0; i < valueLen; i++) {
			if (compare(value[i], other[i]) === false) return false;
		}
	} else {
		for (var key in value) {
			if (value.hasOwnProperty(key)) {
				if (compare(value[key], other[key]) === false) return false;
			}
		}
	}

	// If nothing failed, return true
	return true;

};

function moneyFormat(number = 0.00) {
    number = parseFloat(number).toFixed(2);
    return (number < 0 ? ('-$' + number * -1) : ('$' + number));
}


function setPreloader(preloaderContent = false) {
    if (preloaderContent) {
        $('body').append(preloaderContent);
    } else {
        
    }
}

function deletePreloader(preloaderId) {
    $('#'+preloaderId).remove();
}

String.prototype.trimToLength = function(m) {
    if(this.length <= m)
        return this;

    var arrText = $.trim(this).substring(0, m).split(" ");
    if(arrText.length === 1) {
        return arrText.slice(0).join(" ") + "..."
    } else {
        return arrText.slice(0, -1).join(" ") + "..."
    }
};

function newDate(dateString = false) {
    if (dateString !== false) {
        if (dateString.toString().indexOf('-') > 0)
            dateString = dateString.toString().replace(/-/g, '/');
        return new Date(dateString);
    } else
        return new Date();
}

function abbreviateNumber(value) {
    var newValue = value;
    if (value >= 1000) {
        var suffixes = ["", "k", "m", "b","t"];
        var suffixNum = Math.floor( (""+value).length/3 );
        var shortValue = '';
        for (var precision = 2; precision >= 1; precision--) {
            shortValue = parseFloat( (suffixNum != 0 ? (value / Math.pow(1000,suffixNum) ) : value).toPrecision(precision));
            var dotLessShortValue = (shortValue + '').replace(/[^a-zA-Z 0-9]+/g,'');
            if (dotLessShortValue.length <= 2) { break; }
        }
        if (shortValue % 1 != 0)  shortNum = shortValue.toFixed(1);
        newValue = shortValue+suffixes[suffixNum];
    }
    return newValue;
}

function getUrlParameter(sParam) {
    var sPageURL = window.location.search.substring(1),
        sURLVariables = sPageURL.split('&'),
        sParameterName,
        i;

    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');

        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? true : decodeURIComponent(sParameterName[1]);
        }
    }
};
function copyToClipboard(elem){
    var $temp = $('<input aria-hidden="true">');
    $("body").append($temp);
    var copyText = $('#'+elem).text();
    $temp.val(copyText).select(); 
    document.execCommand("copy");
    $temp.remove();
}

// new modal info
function showNewModal(className = '', title = '', content = '', footerBtns = '') {
    let container = `
        <div class="section__popup newModal ${className}">
            <div class="popup__bg">
                <div class="popup__content">
                    <div class="popup__content-title">${title}</div>
                    ${content}
                    ${footerBtns != '' ? 
                        `<div class="popup__content-btns">
                            ${footerBtns}
                        </div>` : ''}
                </div>
            </div>
        </div>
    `;

    $('body').append(container);
}

// new preloader
function newPrealoder(parentSelector, diam = 10, interval = 0.45) {
    let parent = document.querySelector(parentSelector);
    let allPreloader = parent.querySelectorAll('.preloader');
    let content = `
        <div class="preloader">
            <div class="preloader-ball"></div>
            <div class="preloader-ball"></div>
            <div class="preloader-ball"></div>
            <div class="preloader-ball"></div>
            <div class="preloader-ball"></div>
            <div class="preloader-ball"></div>
            <div class="preloader-ball"></div>
            <div class="preloader-ball"></div>
        </div>
    `;

    if (allPreloader.length > 0) {
        allPreloader.forEach(item => item.remove());
    }

    parent.innerHTML = content;
    let balls = document.querySelectorAll(".preloader-ball");
    let ballsLength = balls.length;
    let d = diam;
    let t = interval;
    balls.forEach((ball, index) => {
        let a = (index/ballsLength) * (Math.PI*2);

        ball.style.left = Math.cos(a)*d + 'px';
        ball.style.top = Math.sin(a)*d + 'px',
        ball.style.animation = `ball-anim ${t}s ease-in -${((t/ballsLength) * (ballsLength - index))}s infinite`;
    })
}

// E3-1377
function checkTariffIsActive (tariff) {
    let isActiveTariff = false;

    if (tariff.date_end == '') {
        if (tariff.date_start != '' && moment().diff(moment(tariff.date_start)) > 0) {
            isActiveTariff = true;
        }
    } else {
        if ( moment().diff(moment(tariff.date_end)) < 0) {
            isActiveTariff = true;
        }
    }

    return isActiveTariff;
}
