var dashNotifC = {};
var dashAlertsC = {};
var verifyC = {};
var tutorialsC = {};
var poiC = {};
$().ready(function () {
	dashNotifC = new dashNotificationsController(); 
	dashAlertsC = new dashAlertsController();
    if (!GetURLParameter('session')) {
        verifyC = new verificationController();
    }
	poiC = new poiController();
    tutorialsC = new tutorialsController();
	tutorialsC.init();
    dashNotifC.init();

    window.onpopstate = function (e){
        if (e.state){
            $('.content').empty().append(e.state.html);
            document.title = e.state.pageTitle;
        }
    };

    $('body').on('click', '.dash_url_button', function (e){
        if ($(this).closest('ul').hasClass('nav_list')) {
            if ($(this).closest('li').hasClass('active_nav')) {
                if ($(this).attr('href') == window.location.pathname) {
                    e.stopPropagation();
                    e.preventDefault();
                    return false;
                }
            } else {
                $(this).closest('li').addClass('active_nav')
            }

        }

        if ($(this).attr('href') == "/dash/settings/driver_settings/") {
            window.location.href = $(this).attr('href')
        }

        if ($(this).attr('href') == "/dash/drivers/"){
            eraseCookie('logPageInfo');
        }
        if (finances.justPlacedOrder === true && window.location.pathname == "/dash/finances/") {
            finances.showOrderPlacedPopup($(this).attr('href'));
            return false;
        }
        $('#menu_bg').hide();
		$('body').removeClass('menu_bg');
        dc.getUrlContent($(this).attr('href'));
        if (parseInt($('.dash_nav').css('width')) > 200) {
            $('.dash_nav').hide();
        }
        if ($('#foot_nav').is(':visible') && $(window).width() <= 768 ) {
            $('#foot_nav').slideUp(500)
        }
        e.stopPropagation();
        e.preventDefault();
    });

    dc.init();

    $(".nav_ezchat").append("<div id='countMes'></div>");
    
    $('#nav_alerts').click(function () {
        dashAlertsC.init();
        if ($('#nav_msg_box').length > 0 && $('#nav_notif_box').length > 0) {
            $('#nav_msg_box').removeClass().addClass('nav_alert_box alert_position_right');
            $('#nav_notif_box').removeClass().addClass('nav_alert_box alert_position_left');
        } else {
            $('#nav_msg_box').removeClass().addClass('nav_alert_box');
        }
    });

    $('#nav_messaegs').click(function () {
        dcc.showMessagesModal();
        if ($('#nav_alert_box').length > 0 && $('#nav_notif_box').length > 0) {
            $('#nav_alert_box').removeClass().addClass('nav_alert_box alert_position_right');
            $('#nav_notif_box').removeClass().addClass('nav_alert_box alert_position_left');
        } else {
            $('#nav_alert_box,#nav_notif_box').removeClass().addClass('nav_alert_box');
        }
    });

    dashAlertsC.refreshTotals();
    $('body').off('click', '.popup-tabs-block .popup-tabs li').on('click', '.popup-tabs-block .popup-tabs li', function () {
        var elemetn = $(this).attr('data-from');
        $('.popup-tabs-block .popup-tabs li').removeClass('active');
        $(this).addClass('active');
        $('.popup_box_panel .popup-tabs-el').hide();
        $('.popup_box_panel #' + elemetn).show();
    });
    
    $('body').on('hide.bs.modal', '#validateEmail', function(e){ 
		e.preventDefault();
		e.stopImmediatePropagation();
		return false; 
    });
    $('body').on('hide.bs.modal', '#validatePhone, #validateCode', function(e){
        if(typeof verifyC.expire!='undefined' && verifyC.expire == 1){
            e.preventDefault();
            e.stopImmediatePropagation();
            return false; 
        } else {
            createCookie('verifyPhone', 1);
        }
    });
    
    setTimeout(function () {
        getManagerEvent();
    }, 3000);
    
});