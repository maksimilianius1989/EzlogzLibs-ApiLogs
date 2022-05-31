var login = 0;
var regInfo = {};
$('.g-signin2').click(function(){
    login = 1;
});
$('#reg_google').click(function()
{
    login = 1;
});

function onSignIn(googleUser) {
    if(window.location.pathname == '/dash/settings/account/' || window.location.pathname == '/social/settings/'){
        if(fleetC.checkDemoAccess()){return false;}
        if ($("#linkGoogleButton").hasClass('click')){
            var profile = googleUser.getBasicProfile();
            var data = {email: profile.getEmail(), ggltoken: googleUser.getAuthResponse().id_token};
			AjaxCall({url:'/db/dashController/', action:'apiLinkggl', data:data, successHandler: apiLinkgglHandler, errorHandler: apiLinkgglHandler});
        }
    }
    if(login == 1)
    {    
        var profile = googleUser.getBasicProfile();
        var data = {email: profile.getEmail(), ggltoken: googleUser.getAuthResponse().id_token, provider: 'google.com'};
		AjaxCall({url:apiFrontUrl, action:'doLogin', data:data, successHandler: googleLoginHandler, errorHandler: googleLoginHandler});
    }
}

$(document).ready(function () {
    gapi.load('auth2', function()
    {
        gapi.auth2.init();
        var auth2 = gapi.auth2.getAuthInstance();
    });
});
function apiLinkgglHandler(response){
	if (response.code == '000') {
		updatelink();
	}
	else {
		resetError();
		setError($("#linkInfoGoogle"), response.message);
	}
}
function googleLoginHandler(response){
	if(response.code == '000'){
		if(response.data.getAdditionallyInfo){
			regInfo = response.data;
			if($.isFunction($.fn.bsModal) == true) {
				$('.modal-white').bsModal('hide');
				$('#modalRegisterSocial').bsModal('show');
			}
			else {
				$('.modal').modal('hide');
				$('#modalRegisterSocial').modal('show');
			}
			$('#formRegisterSocial input[name="name_reg"]').val(response.data.nameFirst);
			$('#formRegisterSocial input[name="last_reg"]').val(response.data.nameLast);
            $('#formRegisterSocial input[name="email"]').val(response.data.email);
		} else {
			var role = 0;
			if(response.data.user.role == 1){
				role = 1;
			}
			createCookie('login', response.data.user.login, 30);
			createCookie('thumb', response.data.user.awsThumb ? response.data.user.awsThumb : EZCHAT_LINK + response.data.user.thumb, 30);
			createCookie('userId', response.data.user.id, 30);
			createCookie('compos', response.data.user.companyPosition, 30);
			logIn(response.data.user.name, response.data.user.last, role);
			if(response.data.user.companyPosition == 0 || response.data.user.companyPosition == 6 || window.location.href.includes("social")){
				window.location.href = '/social/';
			}else
				window.location.href = '/dash/';
		}
	}else{
		resetError();
		setError($('#formLogin, #formRegistration, #login_block, #register_box'), response.message);
	}
}
function signOut() {
    if (typeof(auth2) != 'undefined' && auth2 != null ) {
        var auth2 = gapi.auth2.getAuthInstance();
        auth2.signOut().then(function () {
            window.location.href = "/";
        });
    }
}