function verificationController() {
    var self = this;
    this.expire = 0;
    this.verified = 0;
    this.phone = '';
	this.checkUserVerification = function () {
		if(getCookie('verifyEmail') != 1){
			AjaxController('checkEmailVerification', {}, dashUrl, self.checkEmailVerificationHandler, self.checkEmailVerificationHandler, true); 
		} else if(getCookie('verifyPhone')!= 1){ 
			self.checkPhoneVerification();
		}	
    }
	this.checkEmailVerificationHandler = function (response){
		if (response.code == '000') {
			createCookie('verifyEmail', 1);
			self.checkUserVerification();
		} else {
			var modalBody = 'Need confirm email by link in registration mail.<div id="verificationMessage"></div>';
			showModal('Email Verification', modalBody, 'validateEmail', 'modal-sm', {'footerButtons':'<button type="button" class="btn btn-default" onclick="verifyC.verificationMail()">Resend Email</button>'});
		}
    }
	this.verificationMail = function (){
		AjaxController('verificationMail', {}, dashUrl, self.verificationMailHandler, errorBasicHandler, true);
    }
	this.verificationMailHandler = function (response){
		if (response.code == '000') {
			var message = 'Email already sent. Please, check your mail.';
			alertMessage($('#verificationMessage'), message, 3000);
		}
    }
    this.checkPhoneVerification = function () {
		if($('#validatePhone').length > 0){
			return false;
		}
		var validateUsers = [TYPE_DRIVER, TYPE_DRIVER_ELD, TYPE_DISPATCHER, TYPE_SAFETY, TYPE_EZLOGZ_RESELLER];
		if(validateUsers.includes(position)){
			AjaxController('checkPhoneVerification', {}, dashUrl, self.checkPhoneVerificationHandler, errorBasicHandler, true); 
		}
    }
    this.checkPhoneVerificationHandler = function (response){
		if($('#validatePhone').length > 0){
			return false;
		}
        self.verified = typeof response.data.verified != 'undefined' ? parseInt(response.data.verified) : 0;
        self.expire = typeof response.data.expire != 'undefined' ? parseInt(response.data.expire) : 0;
        self.phone = typeof response.data.phone!='undefined' ? response.data.phone : '';
        var verifyPhone = 0;
        if(!self.verified){
            var formBody  = '<div class="step1"><label style="display: block">Please, confirm your phone number</label>';
            formBody += '<input id="userPhone" placeholder="Phone" type="text" value="'+self.phone+'"/></div>';
            showModal('Phone Verification', formBody, 'validatePhone', 'modal-sm validatePhone', {'footerButtons':'<button type="button" class="btn btn-default" onclick="verifyC.createVerificationCode(\'userPhone\')">Confirm</button>'});
			$('#validatePhone input#userPhone').mask('000 000 0000');
		}
        if(self.expire){
            verifyPhone = 0;
            $('.validatePhone button[data-dismiss="modal"]').attr('disabled', 'disabled');
        }
        verifyPhone = 1;
        createCookie('verifyPhone', verifyPhone);
    }
    this.createVerificationCode = function (phoneField) {
        var phone = $('#'+phoneField+'').val();
        AjaxController('createVerificationCode', {phone: phone}, dashUrl, self.createVerificationCodeHandler, errorBasicHandler, true);
    }
    this.verificationFormInSettings = function (phoneField) {
        var phone = $('#'+phoneField+'').val();
        self.openVerificationForm(phone);
    }
	this.openVerificationForm = function (phone, todayCodeExist){
        var formBody  = '<div class="step2"><label style="display: block">Please, enter code from SMS</label>';
            formBody += '<input id="userCode" placeholder="Code" type="text" value=""/>';
            formBody += '<input id="userPhone" type="hidden" value="'+phone+'"/></div>';
			formBody += '<span id="smsErrorMessage"></span>';
		showModal('Code Verification', formBody, 'validateCode', 'modal-sm validatePhone', {'footerButtons':'<button type="button" class="btn btn-default" onclick="verifyC.verifySMSCode()">Confirm</button>'});
		$('#phone_alert').click();
		if(typeof todayCodeExist!='undefined' && todayCodeExist==1){
			alertError($('#smsErrorMessage'), 'Today SMS already has been sent. Please, check your phone.', 4000);
		} else {
			self.addPhoneAlert(phone);
		}
	}
    this.createVerificationCodeHandler = function (response) { c(response);
		$('#validatePhone').remove();
        var phone = response.data.phone;
		var todayCodeExist = response.data.todayCodeExist;
		self.openVerificationForm(phone, todayCodeExist);
        if(self.expire){
            $('.validatePhone button[data-dismiss="modal"]').attr('disabled', 'disabled');
        }
    }
    this.verifySMSCode = function () {
        var code = $('#userCode').val();
        var phone = $('#userPhone').val();
        AjaxController('verifySMSCode', {code: code, phone: phone}, dashUrl, self.verifySMSCodeHandler, self.errorVerifySMSCodeHandler, true);
    }
    this.verifySMSCodeHandler = function (response) { c('verifySMSCodeHandler');
		var phone = response.data;
		$('#userInfoSettings').find('#user_phone').val(phone);
        $('#validateCode').remove();
		$('span#phone_alert').remove();
        createCookie('verifyPhone', 1);
    }
    this.errorVerifySMSCodeHandler = function (response) {
        //setError($('#userCode'), response.message);
		alertError($('#smsErrorMessage'), response.message, 4000);
    }
    this.addPhoneAlert = function (phone) {
		$('#phone_alert, #phoneToVerify').remove();
		var phoneAlert = '<span id="phone_alert" class="verification-alert" data-toggle="popover"><img style="max-width: 100%" src="/dash/assets/img/attention.svg"></span>';
		$('#user_phone').after(phoneAlert).after('<input id="phoneToVerify" type="hidden" value="'+phone+'"/>');
		$('.verification-alert').attr('style', 'width:20px; position:absolute; right:20px; top:5px; cursor:pointer;');
		$('.verification-alert').popover({
			trigger: 'click',
			placement: $(window).width() >= 768 ? 'right':'auto',
			html: true,
			container: 'body', 
			content:  'We already send verification code on your phone number '+phone+'. You can <span style="color:#3497db; text-decoration: underline; cursor:pointer;" onclick="verifyC.verificationFormInSettings(\'phoneToVerify\'); ">Enter code</span>  \
			or <span style="color:#3497db; text-decoration: underline; cursor:pointer;" onclick="verifyC.createVerificationCode(\'user_phone\');">Resend code</span>'
		});
	}
}