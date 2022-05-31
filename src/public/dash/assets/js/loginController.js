function changePlatform(platform) {
	createCookie('cur_platform', platform, 30);
	window.location.href = window.location.href;
}
function logIn(name, last, role) {
    var tabs = $('<div id="user_tabs"></div>');
    tabs.append('<button id="dash_button" class="main_ft_button ">Dashboard</button>');
    if (safeMode == 0) {
		tabs.append('<button id="soc_button" class="main_ft_button ">Social</button>');
	}
    if (inFleet == 1 && userRole == 1 && (position == TYPE_DRIVER || position == TYPE_DRIVER_ELD) && getCookie("dashboard") != 'driver') {
		tabs.append('<button id="dash_button" class="main_ft_button driver">Driver Dashboard</button>');
    } else if (inFleet == 1 && userRole == 1 && getCookie("dashboard") == 'driver') {
		tabs.append('<button id="dash_button" class="main_ft_button fleet">Fleet Dashboard</button>');
	}
    if (curUserIsEzlogzEmployee()) {
        if (getCookie('cur_platform') == 'logit') {
			tabs.append('<button  class="main_ft_button" onclick="changePlatform(\'ezlogz\')">Ezlogz</button>');
			$('#logo').attr('src', '/dash/assets/img/logitlogo.svg').attr('alt', COMPANY_NAME).attr('title', COMPANY_NAME);
			$('#logo_mob').attr('src', '/dash/assets/img/mob_logit_logo.svg').attr('alt', COMPANY_NAME).attr('title', COMPANY_NAME);
        } else if (position == TYPE_SUPERADMIN || superAdminRights.logitAccess == 1) {
			tabs.append('<button  class="main_ft_button" onclick="changePlatform(\'logit\')">LogIt Eld</button>');
		}
		
	}
    tabs.append('<button id="sign_out" class="main_ft_button sign_out">Sign out</button>');
    last = last == "null" ? "" : last;
    $('#log_in_box').hide();
    $('.nav.nav-pills.log').empty();
    $('.nav.nav-pills.log').append('<li class="account_access"><a ><i class="icon-user"></i>' + name + ' ' + last + '</a></li>');
    if ($('#user_nav').length > 0) {
        $('#user_nav').append(tabs);
    } else {
        $('.account_access').append(tabs);
    }

    $('.bl.sign_in').hide();
    $('.gr.log_in').hide();
    if (!getCookie("user")) {
        createCookie('user', name, 30);
    }
    if (!getCookie("last")) {
        createCookie('last', last, 30);
    }
    if (!getCookie("role")) {
        createCookie('role', role, 30);
    }
    var thumb = getCookie("thumb");
    if (thumb != '' && thumb != null && thumb != "null") {
        thumb = thumb;
    } else {
            thumb = '/social/assets/img/thumb_blank.png';
    }
    $('#dashHeaderAvatar').attr('src', thumb);
//    if($('#user_nav').length > 0){
//        $('#user_tabs').css('left', $('#user_nav').offset().left)
//    }else{
//        $('#user_tabs').css('left', $('.account_access a').offset().left - 80)
//    }

}
$('body').on('click', '#soc_button', function () {
	window.location.href = '/social/';
})
$().ready(function () {
    if (getCookie("session") && getCookie("user") != '') {
        logIn(getCookie("user"), getCookie("last"), getCookie("role"));
    } else {
        eraseCookies();
    }
    $('body').on('keyup', '#log_pass', function (e) {
        if (e.which == 13) {
            $('#log_sign').click();
        }
    });
    $('body').on('click', '#log_sign', function (e) {
        c('log_sign');
        e.preventDefault();
        $('#login_block .error_log_reg').text('');
        var email = $('#login_block .log_email').val();
        var pass = $('#log_pass').val();
        emptyErrors();
        if (!validateEmail(email) || pass.length < 5) {
            if (!validateEmail(email)) {
                $('#login_block .log_email').addClass('inp_error');
                $('#login_block .error_log_reg').text('Enter valid Email');
            }
            if (pass.length < 5) {
                $('#log_pass').addClass('inp_error');
                $('#login_block .error_log_reg').text('Password\'s length must be more than 5 characters');
            }
        } else {
            data = {data: {email: email, password: pass, provider: 'password'}};
            $.ajax({
                url: MAIN_LINK + '/db/login/',
                method: "POST",
                contentType: "application/json", // send as JSON
                data: JSON.stringify(data),
                success: function (data) {
                    var response = jQuery.parseJSON(data);
                    c(response);
                    if (response.code == '000') {
                        var role = 0;
                        if (response.data.user.role == 1) {
                            role = 1;
                        }
                        createCookie('login', response.data.user.login, 30);
                        createCookie('thumb', response.data.user.awsThumb ? response.data.user.awsThumb : EZCHAT_LINK + response.data.user.thumb, 30);
						createCookie('userId', response.data.user.id, 30);
                        logIn(response.data.user.name, response.data.user.last, role);
                            window.location.href = '/dash/';
                    } else {
                        $('#login_block .error_log_reg').text(response.message);
                    }
                }
            });
        }
    });
    $('#box_sign_in').click(function () {
            var email = $('#box_email').val();
            $('.log_form input').removeClass('inp_error');
            $('#reg_email').val(email);
        if (!validateEmail(email)) {
                    $('#reg_email').addClass('inp_error');
                    $('.log_error.em_reg').text('Please enter valid email');
            }
            $('.sign_in').click();
    });
    $('#reg_position').change(function () {
        if ($(this).val() == 'Driver') {
            $('#reg_package option').show();
            $('#reg_package option[value=1]').hide();
            $('#reg_package').val(0);
        } else {
            $('#reg_package option').show();
            $('#reg_package option[value=0]').hide();
            $('#reg_package').val(1);
        }
    });
    
    $('#join_company').click(function () {
        if ($('#join_company').is(':checked')) {
            $('.truck_num').remove();
            $('#create_carrier_box').hide();
            $('#chose_carrier_box').show();
            $('#reg_package_box').css('opacity', 0);
        }
    });
    $('body').on('click', '#done_reg', function (e) {
        e.preventDefault();
        emptyErrors();
        var fields = {};
        fields.email = $('#reg_email').val();
        fields.pass = $('#reg_pass').val();
        fields.conf_pass = $('#reg_conf_pass').val();
        data = {data: {fields: fields}};
        // console.log(fields);
        if (validadeRegistration(fields)) {
            $.ajax({
                url: MAIN_LINK + '/db/registration/',
                method: "POST",
                data: JSON.stringify(data),
                success: function (data) {
                    var response = jQuery.parseJSON(data);
                    if (response.code == '000') {
                        $('#register_box').hide();
                        /*$('#log_in_box .head h2').html('Thank you for registration<br/>Verification email was sent to '+fields.email);
                        $('#log_in_box .head h2').css({'width':'100%'})
                        $('#log_in_box #log_email').val(fields.email);
                        $('#log_in_box').show();*/
                        $('#login_block .log_email').val(fields.email);
                        $('#log_in_box').show();
                    } else {
                        $('#register_box .error_log_reg').text(response.message);
                        $('#register_box .step1').click();
                    }
                }
            });
        }
    });
    $('#create_company').click(function () {
        if ($('#create_company').is(':checked')) {
            $('#create_carrier_box').show();
            $('#chose_carrier_box').hide();
            $('#reg_package_box').css('opacity', 1);
        }
    });
    
    $('#f_pass').click(function (e) {
        e.preventDefault();
        $('.pass_forgot_box').find('.log_form').remove();
        $('.pass_forgot_box').append('<form class="log_form" method="post"><input name="email" id="log_email" class="" placeholder="Email"><button id="forgot_pass_button" class="main_ft_button" name="log_sign">Reset Password</button></form>');
       
        $('.log_box').hide();
        $('.pass_forgot_box').show();
    });
    
    $('body').on('click', '#forgot_pass_button', function (e) {
        e.preventDefault();
        $email = $('.pass_forgot_box #log_email').val();
        $('.pass_forgot_box #log_email').removeClass('inp_error');
        if (!validateEmail($email)) {
            $('.pass_forgot_box #log_email').addClass('inp_error');
            return false;
        }
        data = {data: {
                action: 'resetPassword',
                email: $email
                }};
        $.ajax({
            url: MAIN_LINK + '/db/login/',
            method: "POST",
            contentType: "application/json", // send as JSON
            data: JSON.stringify(data),
            success: function (data) {
                var response = jQuery.parseJSON(data);
                if (response.code == '000') {
                    $('.pass_forgot_box #log_email').remove();
                    $('.pass_forgot_box #forgot_pass_button').remove();
                    $('.pass_forgot_box .log_form').prepend('<p id="log_email">Reset password information was sent to ' + $email + '</p>');
                }
            }
        });
    });
    $('#reg_email').val('');
    $('#reg_pass').val('');
    $('body').on('click', '.sign_out', function () {
        AjaxCall({action: 'sendWebPushToSelfToLogout', url: apiDashUrl});
        $('.nav.nav-pills.log').empty();
        $('.nav.nav-pills.log').append('<li class="log_in">Log in</li>');
        $('.nav.nav-pills.log').append('<li class="sign_in">Sign up</li>');
        $('.bl.sign_in').show();
        $('.gr.log_in').show();
        eraseCookies();
        if (window.location.hostname == 'app.ezlogz.com') {
            window.location.href = "https://ezlogz.com";
        } else {
            window.location.href = "/";
        }
    });
    
    $('body').on('click', '#register_box_fl .step2', function (e) {
        e.preventDefault();
        $('#register_box_fl .step1').removeClass('active');
        $('#register_box_fl .step2').addClass('active');
        $('#register_box_fl .form_1').hide();
        $('#register_box_fl .form_2').show();
        $('#reg_head_text').text('enter your company details');
        checkStates();
    });
    $('#register_box .step1').click(function () {
        $('#register_box .step1').addClass('active');
        $('#register_box .step2').removeClass('active');
        $('#register_box .form_1').show();
        $('#register_box .form_2').hide();
        $('#reg_head_text').text('Create your account');
    });
    $('body').on('click', '#register_box_fl .step1', function () {
        $('#register_box_fl .step1').addClass('active');
        $('#register_box_fl .step2').removeClass('active');
        $('#register_box_fl .form_1').show();
        $('#register_box_fl .form_2').hide();
        $('#reg_head_text').text('Create your account');
    });
    $('body').on('click', '#register_box_fl #next_reg', function (e) {
        e.preventDefault();
        $('#register_box_fl .step1').removeClass('active');
        $('#register_box_fl .step2').addClass('active');
        $('#register_box_fl .form_1').hide();
        $('#register_box_fl .form_2').show();
        $('#reg_head_text').text('enter your company details');
    });
    $('body').on('click', '.log_in', function () {
        $('.log_box').show();
        $('.pass_forgot_box').hide();
        $('#log_in_box').show();
        $('#register_box').hide();
        $('#register_box_fl').hide();
    });
    $('body').on('click', '.sign_in', function () {
        $('.log_box').show();
        $('.pass_forgot_box').hide();
        $('#register_box').show();
        $('#register_box_fl').hide();
        $('#log_in_box').hide();
    });
    $('body').on('click', '.sign_fl', function () {
        $('.log_box').show();
        $('.pass_forgot_box').hide();
        $('#register_box_fl').show();
        $('#register_box').hide();
        $('#log_in_box').hide();
    });
    $('#register_box .head img').click(function () {
        $('#register_box').hide();
    });
    $('body').on('click', '#register_box_fl .head img', function () {
        $('#register_box_fl').hide();
    });
    $('#log_in_box .head img').click(function () {
        $('#log_in_box').hide();
    });
    $("#box_email").keydown(function (e) {
        if (e.which == '13') {
            $('#box_sign_in').click();
        }
    });
});



/** Utilities **/
function emptyErrors() {
    $('.log_form input').removeClass('inp_error');
    $('.log_form select').removeClass('inp_error');
    $('.log_error').text('');
     $('#register_box .error_log_reg').text();
}
function validateEmail(email) {
    var re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}


function validadeRegistration(fields) {
    var no_error = true;
    if (fields.pass != fields.conf_pass) {
        $('#reg_pass').addClass('inp_error');
        $('#register_box .error_log_reg').text('passwords not match');
        $('#reg_conf_pass').addClass('inp_error');
        no_error = false;
    }

    if (fields.email != '' && validateEmail(fields.email)) {
        
    } else {
        $('#reg_email').addClass('inp_error');
        $('#register_box .error_log_reg').text('Enter valid email');
        no_error = false;
    }

    if (fields.pass != '' || fields.pass.length < 5) {
        
    } else {
        $('#reg_pass').addClass('inp_error');
        $('#register_box .error_log_reg').text('Password length must be more than 5 characters');
        no_error = false;
    }

    
    if (no_error) {
        return true;
    } else {
        return false;
    }
}
function eraseCookies() {
    // console.log('eraseCookiesDash');
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
	userLocalStorage.clearAll();
    facebookLogout();
    signOut();//google
}