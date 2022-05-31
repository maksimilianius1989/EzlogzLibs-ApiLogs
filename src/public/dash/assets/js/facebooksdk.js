window.fbAsyncInit = function () {
    $(document).ready(function () {
        FB.init({
            appId: FACEBOOK_API_CLIENT_ID,
            cookie: true, // enable cookies to allow the server to access
            // the session
            xfbml: true, // parse social plugins on this page
            version: 'v2.8' // use graph api version 2.8
        });
    })
};

function statusChangeCallback(response) {
    if (response.status === 'connected') {
        testAPI();
    } else if (response.status === 'not_authorized') {
        $('#login_block .error_log_reg').text('Please log into this app.');
    } else {
        $('#login_block .error_log_reg').text('Please log into Facebook.');
    }
}

function checkLoginState() {
    FB.getLoginStatus(function (response) {
        statusChangeCallback(response);
    });
}

function fbAuthUser() {
    FB.login(checkLoginState, {scope: 'public_profile,email'});
}

(function (d, s, id) {
    var js, fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id))
        return;
    js = d.createElement(s);
    js.id = id;
    js.src = "//connect.facebook.net/en_US/sdk.js";
    fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));

function testAPI() {
    if ($("#linkFacebookButton").hasClass('click')) {
        FB.api('/me?fields=id,name,birthday,email', function (response) {
            var token_ = '';
            FB.getLoginStatus(function (response) {
                token_ = response.authResponse.accessToken;
            });

            var data = {email: response.email, fbtoken: token_};
			AjaxCall({url:'/db/dashController/', action:'apiLinkfb', data:data, successHandler: apiLinkfbHandler, errorHandler: apiLinkfbHandler});
                    });
    } else {
        FB.api('/me?fields=id,name,birthday,email', function (response) {
            var token_ = '';
            var id_ = '';
            FB.getLoginStatus(function (response) {
                token_ = response.authResponse.accessToken;
                id_ = response.authResponse.userID;
            });
            var data = {email: response.email, fbid: id_, fbtoken: token_, provider: 'facebook.com'};
			AjaxCall({url:apiFrontUrl, action:'doLogin', data:data, successHandler: fbLoginHandler, errorHandler: fbLoginHandler});
        });
    }
}

var regInfo = {};

function fbLoginHandler(response){
                            if (response.code == '000') {
                                if (response.data.getAdditionallyInfo) {
                                    regInfo = response.data;
                                    if ($.isFunction($.fn.bsModal) == true) {
                                        $('.modal-white').bsModal('hide');
                                        $('#modalRegisterSocial').bsModal('show');
                                    } else {
                                        $('.modal').modal('hide');
                                        $('#modalRegisterSocial').modal('show');
                                    }
                                    $('#formRegisterSocial input[name="name_reg"]').val(response.data.nameFirst);
                                    $('#formRegisterSocial input[name="last_reg"]').val(response.data.nameLast);
            $('#formRegisterSocial input[name="email"]').val(response.data.email);
                                } else {
                                    var role = 0;
                                    if (response.data.user.role == 1) {
                                        role = 1;
                                    }
                                    createCookie('login', response.data.user.login, 30);
			createCookie('thumb', response.data.user.awsThumb ? response.data.user.awsThumb : EZCHAT_LINK + response.data.user.thumb, 30);
                                    createCookie('userId', response.data.user.id, 30);
                                    createCookie('compos', response.data.user.companyPosition, 30);
                                    logIn(response.data.user.name, response.data.user.last, role);
                                    if (response.data.user.companyPosition == 0 || response.data.user.companyPosition == 6 || window.location.href.includes("social")) {
                                        window.location.href = '/social/';
                                    } else
                                        window.location.href = '/dash/';
                                }
                            } else {
                                resetError();
                                setError($('#formLogin, #formRegistration, #login_block, #register_box'), response.message);
                            }
                        }
function apiLinkfbHandler(response){
	resetError();
	if (response.code == '000') {
		updatelink();
	} else {
		setError($("#linkInfoFacebook"), response.message);
    }
}
function facebookLogout() {
    if (typeof (FB) != 'undefined' && FB != null) {
        FB.getLoginStatus(function (response) {
            if (response.status === 'connected') {
                FB.logout(function (response) {
                    window.location.href = "/";
                });
            } else {
                // window.location.href = "/";
            }
        });
    }
}
