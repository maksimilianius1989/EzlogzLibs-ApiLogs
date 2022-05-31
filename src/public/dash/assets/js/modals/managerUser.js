function managerUserCard(userId, params = {}) {
    var self = this;
    self.params = params;
    self.userId = userId;
    self.cntrlUrl = apiAdminUrl;
    self.modalElement = '';
    self.tableId = 'managerUserCard_' + userId;
    modalCore(self);

    self.modalId = 'manager_user_card';
    self.modalTitle = 'USER INFO id ' + userId;
    self.paginator = false;
    self.tabs = [];
    self.forceSearchParams = [{key: 'userId', val: userId}];

    self.initRequest = function () {
        AjaxController('getManagerUserCardInit', {userId: self.userId}, self.cntrlUrl, self.init, self.init, true);
    }
    self.init = function (response) {
        self.user = response.data.user;
        if (self.user.smart_safety) {
            self.modalTitle += ' <span style="background: #9c27b0;color: white;border-radius:50px;padding: 5px 10px;">SMART SAFETY</span>';
        }
        self.generateHeaders();
        self.generateButtons();
        self.createModal();
        if (isDriver(self.user.companyPosition)) {
            self.modalElement.find('.modal-footer').append('<button class="btn btn-primary-new" id="smartIftaBtn">Smart IFTA</button><div class="check_buttons_block modal_switcher" style="display:flex;width:40%;">\
					<button class="btn btn-default" onclick="doActive(this)" data-val="2" style="">Driver Parameters</button>\
                    <button class="btn btn-default" onclick="doActive(this)" data-val="3" style="">Driver IFTA</button>\
					<button class="btn btn-default" onclick="doActive(this)" data-val="0" style="">Driver Logbook</button>\
					<button class="btn btn-default active" onclick="doActive(this)" data-val="1" style="">User Info</button>\
				</div>');
            self.modalElement.find('.modal_switcher button').click(self.modalSwitchView);
            self.modalElement.find('.modal-footer #smartIftaBtn').click(self.showSmartIftaModal);
        }
        self.modalElement.find('#verify_user_email').click(self.verifyEmail);
        self.modalElement.find('#verify_user_phone').click(self.verifyPhone);
        self.modalElement.find('.pullEldLogsButton').click(self.pullEldLogsButtonClick);
        self.modalElement.find('#preferredLanguage').val(self.user.preferredLanguage);
        self.modalElement.find('#preferredLanguage').change(self.changePreferredLanguage);
        self.modalElement.find('.forceScannerUpdate').click(self.forceScannerUpdate);
        self.modalElement.find('.adminVerification').click(self.adminVerification);
        self.modalElement.find('#change_phone_field').mask('000 000 0000');
    }
    self.adminVerification = function(){
        var body = `<div class="form-horizontal ">
            <div class="form-group ">
                <div class="col-sm-12">
                    <p>If you not 100% sure that current called client not the owner of this account, 
                        you can verify it by send a verification popup to the client dashboard. 
                        Client needs to click "Approve" in popup windon that will appear on his dashboard 
                        after you click "Send Verification Request". You will see resulf of his action(Approved, Rejected) 
                        in this window, please wait for client action. </p>
                </div>
                <div class="col-sm-12 response"></div>
            </div>
        </div>`
        showModal('Safety Verification', body, 'adminVerificationModal', '', 
            {footerButtons: `<button class="btn btn-primary" id="adminVerificationButton">Send Verification Request</button>`});
        $('#adminVerificationButton').click(self.adminVerificationClicked)
    }
    self.adminVerificationClicked = function(){
        var data = {
            action:'adminVerification', 
            data: {
                fromId: curUserId,
                userId: self.user.id
            }
        };
        send(data);
        alertMessage($('#adminVerificationModal .response'), "Request Sent", 3000);
    }
    self.forceScannerUpdate = function(){
        self.modalElement.find('.forceScannerUpdate').attr('disabled', true);
        AjaxCall({url: apiAdminUrl, action: "forceScannerUpdate", data: {userId:self.user.id, scannerId:self.user.lastScannerStatus.deviceId}, successHandler:self.forceScannerUpdateHandler})
    }
    self.forceScannerUpdateHandler = function(){
        self.modalElement.find('.forceScannerUpdate').attr('disabled', false);
        showModal('Force Device Update', 'Driver application will be forced to update ELD/AOBRD device version as soon as driver connect to the device.', '', 'modal-sm');
    }
    self.pullEldLogsButtonClick = function(){
        var body = `<div class="form-horizontal ">
        <div class="form-group ">
            <div class="col-sm-12">
                <p>Request to pull driver Device logs, please select option:</p>
            </div>
        </div>
        <div class="form-group ">
            <div class="col-sm-12 row">
                <label class="col-sm-4">On Device Connected (IOSIX logs)</label>
                <div class="check_buttons_block col-sm-8" id="deviceConnected">
                    <button class="btn btn-default " onclick="doActive(this);" data-val="1">Yes</button>
                    <button class="btn btn-default active" onclick="doActive(this);" data-val="0">No</button>
                </div>
            </div>
        </div>
    </div>`
        showModal('Pull Eld Logs Request', body, 'pullEldLogs', '', 
            {footerButtons: `<button class="btn btn-primary" id="pullLogs">Pull Logs</button>`});
        $('#pullLogs').click(self.pullEldLogs)
    }
    self.pullEldLogs = function(){
        $('#pullLogs').attr('disabled', true);
        self.modalElement.find('.pullEldLogsButton').attr('disabled', true);
        AjaxCall({url: apiAdminUrl, action: "pullEldLogs", data: {userId:self.userId, deviceConnected:$('#deviceConnected .active').attr('data-val')}, successHandler: self.pullEldLogsHandler})
    }
    self.pullEldLogsHandler = function(){
        $('#pullEldLogs .close').click();
        self.modalElement.find('.pullEldLogsButton').attr('disabled', false);
        showModal('Pull Eld Logs', 'Eld logs push sent to driver, please check Scanner Logs Tab when logs appear');
    }
    self.changePreferredLanguage = function(){
        AjaxCall({url: apiAdminUrl, action: 'changePreferredLanguage', data: {'userId': self.userId, 'preferredLanguage': self.modalElement.find('#preferredLanguage').val()}});
    }
    self.verifyPhone = function(){
        showModal('Verify User Phone Number', 'You are about to verify user phone, please use this functionality when client cannot receive SMS on his number, to manually verify phone number, please do steps:\n\
            <br><br>1.Ask client to call on support line from his account phone <br>2.Compare phone number client call from, check each number and if its totally the same as on his Ezlogz account ('+self.user.phone+') - click Verify Phone', 'verifyPhoneModal', '', 
            {footerButtons: `<button class="btn btn-primary" id="approveVerifyPhone">Verify Phone</button>`});
        $('#approveVerifyPhone').click(self.approveVerifyPhone)
    }
    self.editPhone = function () {
        showModal('Edit User Phone Number', '', 'verifyPhoneModal', '', 
            {footerButtons: `<button class="btn btn-primary" id="approveVerifyPhone">Verify Phone</button>`});
    }
    self.verifyEmail = function(){
        showModal('Verify User Email', 'You are about to verify user email, please use this functionality when client cannot receive/find our auto sent email, to manually verify email, please do steps:\n\
            <br><br>1.Ask client to send email with text and title "Test" to supportdesk@ezlogz.com<br>2.When client inform that he did that - check new emails, find client email<br>\n\
            3.Check the email name from where client sent his test email, check each letter and if its totally the same as on his Ezlogz account ('+self.user.email+') - click Verify Email', 'verifyEmailModal', '', 
            {footerButtons: `<button class="btn btn-primary" id="approveVerifyEmail">Verify Email</button>`});
        $('#approveVerifyEmail').click(self.approveVerifyEmail)
    }
    self.approveVerifyEmail = function(){
        $('#approveVerifyEmail').prop('disabled', true);
        AjaxCall({url: apiAdminUrl, action: 'approveVerifyEmail', data: {'userId': self.userId}, successHandler: self.approveVerifyEmailHandler});
    }
    self.approveVerifyEmailHandler = function(){
        $('#verifyEmailModal .close').click();
        new managerUserCard(self.userId);
    }
    self.approveVerifyPhone = function(){
        $('#approveVerifyPhone').prop('disabled', true);
        AjaxCall({url: apiAdminUrl, action: 'approveVerifyPhone', data: {'userId': self.userId}, successHandler: self.approveVerifyPhoneHandler});
    }
    self.approveVerifyPhoneHandler = function(){
        $('#verifyPhoneModal .close').click();
        new managerUserCard(self.userId);
    }
    self.generateHeaders = function () {
        var headers = [];
        var userStatus = 'Not in fleet';
        if (self.user.carrierId > 0) {
            userStatus = 'In Fleet <span class="clickable_item" onclick="actionGlobalgetOneCarrierInfo(this, event);" data-carrid="' + self.user.carrier.id + '">' + self.user.carrier.name + '(' + self.user.carrier.usdot + ')</span>';
        }
        if (self.user.isSoloDriver) {
            userStatus = 'Solo Driver';
        }
        if (self.user.isBanned === 1) {
            userStatus += '(In Ban)';
        }
        headers.push({label: 'Name', value: self.user.name});
        headers.push({label: 'Position', value: getPositionNameFromId(self.user.companyPosition, self.user.aobrd, self.user.role)});

        headers.push({label: 'Last Name', value: self.user.last});
        var emailVerified = ``;
        if(typeof self.user.emailVerificationExpire.dateTimeExpire != 'undefined'){
            emailVerified = `(Not Verified <button class="btn btn-default btn-xs" id="verify_user_email">Verify</button>)`;
        }
        var email = `<div class="userEmail">
            <span><a href="mailto:${self.user.email}" id="old_user_id">${self.user.email}</a></span>
			<div style="display:none;" id="change_user_email_cancel">
				<input style="display:none;" type="text" placeholder="email" value="${self.user.email}" id="change_email_field"/> 
				<button class="btn btn-default btn-xs" onclick="changeUserEmailCancel()" >Cancel</button>
				<button class="btn btn-default btn-xs" onclick="changeUserEmailApprove(${self.userId})" id="change_user_email_approve">Approve</button>
				<span id="change_user_email_result"></span>
			</div>
            ${emailVerified}
            <button class="btn btn-default btn-xs" onclick="changeUserEmail()" id="change_user_email">Change Email</button>
        </div>`;

        headers.push({label: 'Email', value: email});
        
        var phoneVerified = ``;
        if(typeof self.user.phoneVerification.verified == 'undefined' || self.user.phoneVerification.verified == 0){
            phoneVerified = `(Not Verified <button class="btn btn-default btn-xs" id="verify_user_phone">Verify</button>)`;
        }
        let phone = `<div class="userPhone">
            <span>${self.user.phone}</span>
			<div style="display:none;" id="change_user_phone_cancel">
				<input style="display:none;" type="text" placeholder="phone" value="${self.user.phone}" id="change_phone_field" maxlength="12"/> 
				<button class="btn btn-default btn-xs" onclick="changeUserPhoneCancel();" >Cancel</button>
				<button class="btn btn-default btn-xs" onclick="changeUserPhoneApprove(${self.userId});" id="change_phone_approve">Approve</button>
				<span id="change_user_phone_result"></span>
			</div>
            ${phoneVerified}
            <button class="btn btn-default btn-xs" onclick="changeUserPhone();" id="change_user_phone">Change Phone</button>
        </div>`;
        headers.push({label: 'Phone', value: phone});
        
        headers.push({label: 'Status', value: userStatus});
        if (isDriver(self.user.companyPosition)) {
            headers.push({label: 'Cycle', value: self.user.cycle.name});
            headers.push({label: 'Time Zone', value: self.user.timeZone.name});
        }
        if (self.user.isSoloDriver) {
            var balanceColor = getBalanceColorFromDue(self.user.soloData.currentDue);
            var recurring = (self.user.soloData.recAmount !== null ? ' (+' + self.user.soloData.recAmount + '$ till ' + convertDateToUSA(self.user.soloData.recurringTill) + ')' : '');
            var recurringButton = self.user.soloData.recAmount !== null ? `<button class="btn btn-default btn-xs" onclick="subscriptionBtnClick(${self.user.id})">Recurring</button>` : '';
            var addCardButton = `<button class="btn btn-default btn-xs" onclick="managerModalAddCreditCard({userId:${self.user.id}})">Add Card</button>`;
            var payButton = self.user.creditCardData.creditCard ? `<button class="btn btn-default btn-xs" onclick="finances.payOfCreditCardPopup(${self.user.soloData.currentDue}, ${self.user.id}, 0)">Pay</button>` : '';
            var generateInvoiceButton = `<button class="btn btn-default btn-xs" onclick="payForClientPopup(${self.user.soloData.currentDue}, ${self.user.id}, '${self.user.name}', '${self.user.last}', false, '${self.user.email}')">Generate Invoice</button>`;
            var balanceRow = `<span class="${balanceColor}" style="margin-right: 5px;">${moneyFormat((self.user.soloData.currentDue * -1))}</span>${payButton}${generateInvoiceButton}<span id="recurringCardPayInfo">${recurring}</span> ${recurringButton}${addCardButton}`;

            headers.push({label: 'Balance', value: balanceRow});
            var addDueVal = '';
            var lateFeeVal = '';
            if (self.user.soloData.usedWaiveFee === 1) {
                lateFeeVal = 'Waived';
            }
            if (finances.checkAccessFinances()) {
                if (self.user.soloData.lastEmailTime !== null && self.user.soloData.usedWaiveFee === 0) {
                    lateFeeVal = `<button type="button" data-user_id="${self.user.id}" data-fleet_id="0" class="btn btn-default btn-xs" onclick="cancelLateFee(this)">Waive</button>`;
                }
                addDueVal = `<button class="btn btn-default btn-xs" onclick="manualAddDue('${self.user.id}', '0')">Add</button>`;

            }
            headers.push({label: 'Add Due', value: addDueVal});
            headers.push({label: 'Reseller', value: getDisplayValue(self.user.soloData.resellerName)});
            headers.push({label: 'Late Fee', value: lateFeeVal});
        }
        var deviceLocalId = '';
        if (typeof self.user.lastScannerStatus != 'undefined' && self.user.lastScannerStatus.deviceId != null && self.user.lastScannerStatus.statusTypeId != 0) {
            var deviceTopVersion = '';
            var updateButton = '<button class="btn btn-default btn-xs forceScannerUpdate">Force Update</button>'
            if (parseInt(self.user.lastScannerStatus.updateVersion) > 0 && parseInt(self.user.lastScannerStatus.version) != parseInt(self.user.lastScannerStatus.updateVersion)) {
                deviceTopVersion = '<span title="device need update" class="red">, Need Update to ' + parseInt(self.user.lastScannerStatus.updateVersion) + ' ' + updateButton+'</span>';
            } else if (parseInt(self.user.lastScannerStatus.updateVersion) == 0 && parseInt(self.user.lastScannerStatus.version) != parseInt(self.user.lastScannerStatus.STABLE_DEVICE_VERSION)) {
                deviceTopVersion = '<span title="device need update" class="red">, Need Update to ' + parseInt(self.user.lastScannerStatus.STABLE_DEVICE_VERSION) + ' ' + updateButton+'</span>';
            }
            deviceLocalId = self.user.lastScannerStatus.deviceId + '(version '+self.user.lastScannerStatus.version+''+deviceTopVersion+')';
        }
        headers.push({label: 'Connected Device', value: deviceLocalId, id: 'curDrConDevice'});
        var preferredLanguage = `<select class="form-control" id="preferredLanguage">
            <option value="0">Unknown</option>
            <option value="1">English</option>
            <option value="2">Russian</option>
            <option value="3">Spanish</option>
            <option value="9">Other</option></select>`
        headers.push({label: 'Preffered language', value: preferredLanguage});
        self.setCardHeaders(headers)
    }
    self.generateButtons = function () {
        var buttons = [];
        if (self.user.isSoloDriver || self.user.carrierId !== 0) {
            buttons.push('<button class="btn btn-default" onclick="finances.showCreateInvoiceModal(' + self.userId + ');">New Invoice</button>');
        }
        buttons.push('<button onclick="forceLogoutClick(' + self.userId + ')" class="btn btn-default" >Force Logout</button>');
        buttons.push('<button onclick="add_fleet_comment(0,' + self.userId + ')" class="btn btn-default" >Add Support Comment</button>');
        buttons.push('<button class="btn btn-default" onclick="resetUserPassword(' + self.userId + ')" id="reset_password_button">Reset Password</button>');
        buttons.push('<button class="btn btn-default" onclick="requestScreenView(' + self.userId + ')" id="request_screen_view_button">Request Screen View</button>');


        if (self.user.inspection_mode) {
            buttons.push(`<button class="btn btn-default" onclick="deactivateSafeMode(${self.userId})" id="deactivateSafeMode">Deactivate Safe Mode</button>`)
        }

        if (self.user.isSoloDriver) {
            buttons.push(`<button class="btn btn-default" onclick="managerUpdateSoloToFleet(${self.userId})">Update to Fleet</button>`)
        }
        if (finances.checkAccessFinances()) {
            if (self.user.isBanned === 1) {
                buttons.push(`<button type="button" class="btn btn-default" onclick="unbannedUser('${self.userId}')">Unblock</button>`);
                buttons.push(`<button type="button" class="btn btn-default" id="waiveNotReturnedSoloButton" onclick="waiveNotReturnedSolo('${self.userId}')">Waive non-returned devices fee</button>`);
            }
        }
        if (self.user.companyPosition == TYPE_DRIVER_ELD && (position == TYPE_SUPERADMIN || (typeof superAdminRights.peperLogsAccess != 'undefined' && superAdminRights.peperLogsAccess == 1))) {
            buttons.push(`<button class="btn btn-default" onclick="paperLogsPermissionModal(${self.userId})">Paper Logs Permission</button>`)
        }
        if (isDriver(self.user.companyPosition)) {
            buttons.push(`<button class="btn btn-default pullEldLogsButton" >Pull Debug Logs</button>`)
        }
        if (self.user.role == 1) {
            buttons.push(`<button class="btn btn-default adminVerification" >Admin Verification</button>`)
        }

        self.setCardActionsButtons(buttons);
        
        self.tabs.push({
            label: 'Login Events',
            cl: 'man_usr_login',
            request: 'getManagerUserCardLoginPagination',
            handler: 'getManagerUserCardLoginPaginationHandler',
            tableHeader: `<tr>
                <th>Date Time(Browser Time Zone)</th>
                <th>Platform</th>
                <th>App Version</th>
                <th>Phone Version</th>
            </tr>`
        });

        self.tabs.push({
            label: 'Connect Events',
            cl: 'man_usr_con',
            request: 'getManagerUserCardConnectEventsPagination',
            handler: 'getManagerUserCardConnectEventsPaginationHandler',
            tableHeader: `<tr>
                <th>Date Time</th>
                <th>Device Id</th>
                <th>Version</th>
                <th>Status</th>
            </tr>`
        });

        self.tabs.push({
            label: 'Inspection Reports',
            cl: 'man_usr_insp',
            request: 'getManagerUserCardInspectionPagination',
            handler: 'getManagerUserCardInspectionPaginationHandler',
            tableHeader: `<tr>
                <th>Type</th>
                <th>Email/Comment</th>
                <th>Date</th>
                <th>Response</th>
            </tr>`
        });

        self.tabs.push({
            label: 'Support',
            cl: 'man_usr_sup',
            request: 'getManagerUserCardSupportPagination',
            handler: 'getManagerUserCardSupportPaginationHandler',
            tableHeader: `<tr>
                <th style="width: 62px;">Id</th>
                <th style="width: 134px;">Date Time</th>
                <th style="width: 240px;">User</th>
                <th>Comment</th>
            </tr>`
        });

        self.tabs.push({
            label: 'PDF Reports',
            cl: 'pdf_reports',
            request: 'getManagerUserPDFReportHistoryPagination',
            handler: 'getManagerUserPDFReportHistoryPaginationHandler',
            tableHeader: `<tr>
                <th style="width: 62px;">Id</th>
                <th style="width: 134px;">Date Time</th>
                <th>PDF report</th>
                <th>Download</th>
            </tr>`
        });
        
        self.tabs.push({
            label: 'Parameters History',
            cl: 'params_history',
            request: 'getManagerUserParamsHistoryPagination',
            handler: 'getManagerUserParamsHistoryPaginationHandler',
            tableHeader: `<tr>
                <th style="width: 62px;">Id</th>
                <th style="width: 134px;">Date Time Local</th>
                <th>Parameters Changed</th>
                <th>Initiator</th>
                <th>Carrier</th>
            </tr>`
        });
        if(isDriver(self.user.companyPosition))
        self.tabs.push({
            label: 'Scanner Logs',
            cl: 'scanner_logs',
            request: 'getManagerUserScannerLogsPagination',
            handler: 'getManagerUserScannerLogsPaginationHandler',
            tableHeader: `<tr>
                <th style="width: 62px;">Id</th>
                <th>Date Time Local</th>
                <th style="width: 230px;">Actions</th>
            </tr>`
        });

        if (self.user.isSoloDriver) {
            self.tabs.push({
                label: 'Dues',
                cl: 'man_usr_dues',
                request: 'getManagerUserCardDuesPagination',
                handler: 'getManagerUserCardDuesPaginationHandler',
                tableHeader: `<tr>
                    <th>Due Data</th>
                    <th>Description</th>
                    <th>Amount</th>
                </tr>`
            });

            self.tabs.push({
                label: 'Invoices',
                cl: 'man_usr_inv',
                request: 'getManagerUserCardInvoicesPagination',
                handler: 'getManagerUserCardInvoicesPaginationHandler',
                tableHeader: '<tr>\n' +
                        '<th>Invoice Date</th>\n' +
                        '<th>Invoice Number</th>\n' +
                        '<th>Transaction</th>\n' +
                        '<th>Credit</th>\n' +
                        '<th>Card Number</th>\n' +
                        '<th>Status</th>\n' +
                        '<th>Description</th>\n' +
                        '<th>Paid</th>\n' +
                        '<th>Amount</th>\n' +
                        '<th>Refund</th>\n' +
                        '<th>Actions</th>\n' +
                        '</tr>'
            });

            self.tabs.push({
                label: 'Eld Devices',
                cl: 'man_usr_dev',
                request: 'getManagerUserCardDevicesPagination',
                handler: 'getManagerUserCardDevicesPaginationHandler',
                tableHeader: `<tr>
                    <th>Id</th>
                    <th>Local Id</th>
                    <th>BLE Address</th>
                    <th>Version</th>
                    <th>VIN</th>
                    <th>Truck</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>`
            });

            self.tabs.push({
                label: 'Orders',
                cl: 'man_usr_ord',
                request: 'getManagerUserCardOrdersPagination',
                handler: 'getManagerUserCardOrdersPaginationHandler',
                tableHeader: `<tr>
                    <th>Id</th>
                    <th>Amount</th>
                    <th>Cables</th>
                    <th>Date</th>
                    <th>Status</th>
                </tr>`
            });

            self.tabs.push({
                label: 'User Actions',
                cl: 'man_usr_act',
                request: 'getManagerUserCardActionsPagination',
                handler: 'getManagerUserCardActionsPaginationHandler',
                tableHeader: `<tr>
                    <th style="width: 50px;">Id</th>
                    <th style="width: 134px;">Date Time</th>
                    <th style="width: 240px;">User</th>
                    <th>Action</th>
                </tr>`
            });
            var thCards = '';
            if (finances.checkAccessFinances()) {
                thCards = `<tr>
                <th>Number</th>
                <th>User</th>
                <th style="width: 100px;">Current</th>
                <th style="width: 100px;">Status</th>
                <th style="width: 100px;">Deleted</th>
                <th>Actions</th>
            </tr>`;
            } else {
                thCards = `<tr>
                <th>Number</th>
                <th>User</th>
                <th style="width: 100px;">Current</th>
                <th style="width: 100px;">Status</th>
                <th style="width: 100px;">Deleted</th>
            </tr>`;
            }
            self.tabs.push({
                label: 'Cards',
                cl: 'user_credit_cards',
                request: 'getManagerCreditCardPagination',
                handler: 'getManagerCreditCardActionsPaginationHandler',
                tableHeader: thCards
            });

        }
        self.setCardTabs(self.tabs);
    }
    self.getManagerUserCardLoginPaginationHandler = function (response) {
        var tbody = '';
        response.data.result.forEach((item) => {
            var appVersion = item.appVersion == 'null' || item.appVersion == null ? 'Unknown, Not Latest' : item.appVersion;
            var phoneVersion = item.phoneVersion == 'null' || item.phoneVersion == null ? 'Unknown' : item.phoneVersion;
            var update = item.device.includes("(After Update)") ? '(Update)' : '';
            var platform = 'web';
            if (item.phoneType == 1) {
                var platform = 'android';
            } else if (item.phoneType == 0) {
                var platform = 'ios';
            }
            tbody += `<tr>
                <td>${timeFromSecToUSAString(item.dateTime)}</id>
                <td><div class="login_event ${platform}"></div></id>
                <td>${appVersion}${update}</id>
                <td>${phoneVersion}</id>
            </tr>`;
        });
        self.modalElement.find('#' + self.tableId).find('tbody').html(tbody);
    }

    self.getManagerUserCardConnectEventsPaginationHandler = function (response) {
        var tbody = '';
        response.data.result.forEach((item) => {
            var sts = '<span class="driver-scanner-icon ' + (item.type == 0 ? 'eld' : 'aobrd') + (item.statusTypeId == 0 ? ' grey' : ' green') + '"></span>';
            var deviceId = item.deviceId == null ? '' : item.deviceId;
            item.dateTime = addHoursToDateTimeString(item.dateTime, -response.data.userTimeZoneValue);
            tbody += `<tr>
                <td>${timeFromSQLDateTimeStringToUSAString(item.dateTime)}</td>
                <td>${deviceId}</td>
                <td>${item.version == 0 ? 'No info' : item.version}</td>
                <td>${sts}</td>
            </tr>`;
        });
        self.modalElement.find('#' + self.tableId).find('tbody').html(tbody);
    }

    self.getManagerUserCardInspectionPaginationHandler = function (response) {
        var tbody = '';
        response.data.result.forEach((item) => {
            if (item.type == 1) {
                var reponse = item.response.replace(/\\"/g, '"')
                reponse = reponse.replace(/\\"/g, '"');
                reponse = reponse.replace(/\\\\/g, '');
                reponse = reponse.replace(/\\"/g, '"');
                reponse = reponse.replace(/\\/g, '\\');
                reponse = reponse.replace(/\//g, '/');
                reponse = safelyParseJSON(reponse)
                if (reponse) {
                    reponse = JSON.stringify(reponse, null, 4);
                }
                tbody += `<tr>
                    <td>Output File</id>
                    <td>${item.email}</id>
                    <td>${timeFromSecToUSAString(item.dateTime)}</td>
                    <td>${reponse}</td>
                </tr>`;
            } else {
                tbody += `<tr>
                    <td>${item.email == '' ? 'PDF' : 'Email'}</id>
                    <td>${item.email == '' ? 'Downloaded' : item.email}</id>
                    <td>${timeFromSecToUSAString(item.dateTime)}</td>
                    <td></td>
                </tr>`;
            }
        });
        self.modalElement.find('#' + self.tableId).find('tbody').html(tbody);
    }

    self.getManagerUserCardSupportPaginationHandler = function (response) {
        var tbody = '';
        response.data.result.forEach((item) => {
            tbody += `<tr data-supportid = "${item.id}"> 
                <td>${item.id}</td>
                <td>${timeFromSQLDateTimeStringToUSAString(item.dateTime)}</td>
                <td>${item.userName}</td>
                <td>${item.message.replace(/(?:\r\n|\r|\n)/g, '<br />')}</td>
            </tr>`;
        });
        self.modalElement.find('#' + self.tableId).find('tbody').html(tbody);
    }
    
    self.getManagerUserScannerLogsPaginationHandler = function(response){
        var tbody = '';
        response.data.result.forEach((item) => {
            tbody += `<tr> 
                <td>${item.id}</td>
                <td>${timeFromSQLDateTimeStringToUSAString(item.dateTime)}</td>
                <td><button class="btn btn-default" onclick="showOneEldLogs(${item.id})">Show Logs</button><a class="btn btn-default ml-1" style="height: 35px;" target="_blank" href="/debug?log=${item.id}_${self.userId}">Open log Url</a></td>
            </tr>`;
        });
        self.modalElement.find('#' + self.tableId).find('tbody').html(tbody);
    }
    self.getManagerUserParamsHistoryPaginationHandler = function(response){
        var tbody = '';
        response.data.result.forEach((item) => {
            var carrier = item.carrierId > 0 ? item.carrierName +'('+item.usdot+')' : '';
            var paramsStr = '';
            $.each(item.params, function(key, val){
                paramsStr+=getParameterString(key, val);
            })
            tbody += `<tr> 
                <td>${item.id}</td>
                <td>${timeFromSQLDateTimeStringToUSAString(item.dateTimeUTC)}</td>
                <td>${paramsStr}</td>
                <td>${item.initiatorName}</td>
                <td>${carrier}</td>
            </tr>`;
        });
        self.modalElement.find('#' + self.tableId).find('tbody').html(tbody);
    }
    self.getManagerUserPDFReportHistoryPaginationHandler = function (response) {
        var tbody = '';
        response.data.result.forEach((item) => {
            var splitName = item.pdfLink;
            var downloadName = splitName.split('/')[splitName.split('/').length - 1];
            var reportText = '<b>' + item.initName + ' ' + item.initLast + '</b> made a <b>' + item.actionType + '</b>';
            if (item.actionType == 'logbook' || item.actionType == 'dvir') {
                reportText += ' for ' + timeFromSQLDateTimeStringToUSAString(item.reportDate);
            }
            if (item.initiatorId != item.userId && item.userId > 0) {
                reportText += ' for <b>' + item.usName + ' ' + item.usLast + '</b>';
            }
            tbody += `<tr data-pdfreportid = "${item.id}"> 
                <td>${item.id}</td>
                <td>${timeFromSQLDateTimeStringToUSAString(item.actionDate)}</td>
                <td>${reportText}</td>
                <td><span style="cursor:pointer;color:#3498db;" onclick="pdfGen.downloadPDF('${item.pdfLink}');">${downloadName}</span></td>
            </tr>`;
        });
        self.modalElement.find('#' + self.tableId).find('tbody').html(tbody);
    }

    self.getManagerUserCardDuesPaginationHandler = function (response) {
        var tbody = '';
        response.data.result.forEach((item) => {
            tbody += `<tr> 
                <td>${timeFromSQLDateTimeStringToUSAString(item.dateTime)}</td>
                <td>${item.description}</td>
                <td>${item.amount}</td>
            </tr>`;
        });
        self.modalElement.find('#' + self.tableId).find('tbody').html(tbody);
    }

    self.getManagerUserCardInvoicesPaginationHandler = function (response) {
        var tbody = '';
        response.data.result.forEach((item) => {
            var cardNumber = '';
            if (item.paymentParams != 'null' && item.paymentParams != null) {
                paymentParams = JSON.parse(item.paymentParams);
                cardNumber = paymentParams.cardNum.substr(paymentParams.cardNum.length - 8);
            }
            var listOfButtons = [];
            listOfButtons.push('<button type="button" data-id="' + item.invoiceId + '" onclick="downloadInvoice(this)">Download PDF</button>');
            if ((item.sumRefund === null || (item.sumRefund !== null && item.amount - item.sumRefund > 0)) && self.user.soloData.currentDue < 0 && finances.checkAccessFinances() && (item.paymentSys === 0 || item.paymentSys === 1 || item.paymentSys === 2)) {
                listOfButtons.push('<button type="button" onclick="refund.refundTransaction(\'' + item.transactionId + '\', ' + item.userId + ')">Refund</button>');
            }
            tbody += '<tr>\n' +
                    '<td>' + timeFromSQLDateTimeStringToUSAString(item.dateTime) + '</td>\n' +
                    '<td>' + item.invoiceId + '</td>\n' +
                    '<td>' + item.transactionId + '</td>\n' +
                    '<td>' + paymentSystems[item.paymentSys] + '</td>\n' +
                    '<td>' + cardNumber + '</td>\n' +
                    '<td>' + (item.status ? '<span class="' + (item.status === 1 ? 'green' : 'red font-weight-normal') + '">' + (item.status === 1 ? 'Paid' : 'Failed') + '</span>' : '') + '</td>\n' +
                    '<td>' + item.data + '</td>\n' +
                    '<td>' + item.userName + '</td>\n' +
                    '<td>' + moneyFormat(item.amount) + '</td>\n' +
                    '<td>' + (item.sumRefund !== null ? moneyFormat(item.sumRefund) : '') + '</td>\n' +
                    '<td>' + addTableActionRow(listOfButtons, 120) + '</td>\n' +
                    '</tr>';
        });
        self.modalElement.find('#' + self.tableId).addClass('table-actions-block').find('tbody').html(tbody);
    }

    self.getManagerUserCardDevicesPaginationHandler = function (response) {
        var tbody = '';
        response.data.result.forEach((item) => {
            var scannerStatus = getScannerStatusFromStatusId(item.status, item.params);
            if (item.type == 1) {
                scannerStatus += '(AOBRD)';
            }
            if (item.status == 4 && item.BLEAddress !== null && item.BLEAddress != '') {
                var light = 'green';
            } else if (item.status == 4 && (item.BLEAddress == null || item.BLEAddress == '')) {
                var light = 'orange';
            } else {
                var light = 'red';
            }

            var listOfButtons = [];
            if (typeof window.position != 'undefined' && (position == TYPE_SUPERADMIN || (typeof superAdminRights.deactivate != 'undefined' && superAdminRights.deactivate == 1)) && item.status == 4 && (item.tariffId === 0 || item.tariffId === 3)) {//superadmin activate/deactivate scanner functionality
                listOfButtons.push(`<button onclick="deactivateDevice(${item.id}, event, this)">Deactivate</button>`);
            } else if (typeof window.position != 'undefined' && (position == TYPE_SUPERADMIN || (typeof superAdminRights.deactivate != 'undefined' && superAdminRights.deactivate == 1)) && item.status == 5 && (item.tariffId === 0 || item.tariffId === 3)) {//superadmin activate/deactivate scanner functionality
                listOfButtons.push(`<button onclick="activateDevice(${item.id}, event, this)">Activate</button>`);
            }

            light = '<span class="eld_light " style="width: 6px;height: 6px;background: ' + light + ';display: inline-block;border-radius: 50%;margin-right: 5px;"></span>'
            tbody += `<tr onclick="getEldCard(${item.id}, this, event)" class="pointer" scannerid = "${item.id}">
                <td>${item.id}</td>
                <td>${item.localId}</td>
                <td>${(item.BLEAddress !== null ? item.BLEAddress : '')}</td>
                <td>${item.version}</td>
                <td>${(item.vin !== null ? item.vin : '')}</td>
                <td>${(item.truckName !== null ? item.truckName : '')}</td>
                <td>${light}${scannerStatus}</td>
                <td>${listOfButtons.length ? addTableActionRow(listOfButtons, 120) : ''}</td>
            </tr>`;
        });
        self.modalElement.find('#' + self.tableId).find('tbody').html(tbody);
        self.modalElement.find('#' + self.tableId).addClass('table-actions-block').find('tbody').html(tbody);
    }

    self.getManagerUserCardOrdersPaginationHandler = function (response) {
        var tbody = '';
        response.data.result.forEach((item) => {
            var cablesText = '';
            var time = new Date(parseInt(item.orderDate + '000')).customFormat("#MM#-#DD#-#YYYY# #hh#:#mm#:#ss#");
            $.each(item.cables, function (key2, cable)
            {
                cablesText += cablesText === '' ? '' : '<br/>';
                cablesText += cable.amount + ' x ' + cable.name;
            });
            tbody += `<tr  onclick="getOneOrder(this)" data-orderid="${item.id}" class="pointer"> 
                <td>${item.id}</td>
                <td>${item.amount}</td>
                <td>${cablesText}</td>
                <td>${time}</td>
                <td>${getOrderStatus(item)}</td>
            </tr>`;
        });
        self.modalElement.find('#' + self.tableId).find('tbody').html(tbody);
    }

    self.getManagerUserCardActionsPaginationHandler = function (response) {
        var tbody = '';
        response.data.result.forEach((item) => {
            tbody += `<tr data-supportid = "${item.id}"> 
                <td>${item.id}</td>
                <td>${timeFromSecToUSAString(item.dateTime)}</td>
                <td>${item.name} ${item.last} (${item.email})</td>
                <td>${item.action}</td>
            </tr>`;
        });
        self.modalElement.find('#' + self.tableId).find('tbody').html(tbody);
    }
    self.modalSwitchView = function () {
        self.modalElement.find('.modal-footer #smartIftaBtn').hide();

        if ($(this).attr('data-val') == 0) {
            self.showLogbook();
        } else if ($(this).attr('data-val') == 2) {
            self.showDriverParams();
        } else if ($(this).attr('data-val') == 3) {
            self.showIftaDistance();
        } else {
            self.returnToInitState();
        }
    }
    self.showIftaDistance = function () {
        self.returnToInitState();
        self.modalElement.find('.dropDownTabs, .modal-footer .cardPaginator.pg_pagin, .popup_box_body, .control-buttons, .tableTabButtonsBox').hide();
        self.modalElement.find('.modal-footer #smartIftaBtn').show();
        if(self.modalElement.find('.modal-body.popup_box_panel .switch_body').length == 0) {
            self.modalElement.find('.modal-body.popup_box_panel').append(`<div class="switch_body">
                <section id="tripWayPointsBlock" class="container-section">
                    <div class="row margin-bottom-10px">
                        <div class="col-sm-4">
                            <span data-tutorial="tripWayPoints" class="tutorial-focus"></span>
                            <h2 class="section-heading pl-0 pt-0">Trip Way Points</h2>
                            <div class="form-up-label" id="tripWayPointsForm">
                                <div class="form-group">
                                    <label for="fromPoint" class="unselectable">Date</label>
                                    <div class="input_place">
                                        <input type="text" class="datepicker">
                                    </div>
                                </div>
                            </div>
                            <div class="form-up-label">
                                <div class="form-group">
                                    <button id="runIftaTrip" type="button" class="btn btn-default">Run Trip</button>
                                    <button type="button" class="btn btn-default" onclick="iftaMap.clearTrip()">Clear Trip</button>
                                </div>
                            </div>
                            <div class="form-up-label">
                                <div class="form-group">
                                    <div class="row">
                                        <div class="col-xs-12">
                                            <label>Vehicle Specification</label>
                                            <select class="form-control" id="vehicle_spec">
                                                <option value="0">Car</option>
                                                <!--<option value="1" >Delivery Truck</option>-->
                                                <option value="2">Truck (7.5t)</option>
                                                <option value="3">Truck (11t)</option>
                                                <option value="4" selected="true">Truck with one trailer (38t)</option>
                                                <option value="5">Trailer Truck (40t)</option>
                                                <option value="6">Car with Trailer</option>
                                                <option value="7">User Defined</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="form-up-label  opts vehicle" data-type="vehicle">
                                <h4 class="mt-1 mb-2 pl-1" style="overflow:hidden;">Vehicle Parameters <button onclick="managerUser_toggleFormBlock(this);" class="toggle_button pull-right"><i class="fa fa-angle-up"></i></button></h4>
                                <div class="form-group" style="display: none;">
                                    <div class="row">
                                        <div class="col-xs-6">
                                            <label>Vehicle Type</label>
                                            <select class="form-control" id="vehicle_type" >
                                                <option value="2">Car</option>
                                                <option value="3" selected="true">Truck</option>
                                                <!--<option value="9">Delivery Truck</option>-->
                                            </select>
                                        </div>
                                        <div class="col-xs-6">
                                            <label>Vehicle Number Of Tires</label>
                                            <input type="text" class="form-control " id="vehicle_tires" value="6">
                                        </div>
                                    </div>
                                </div>
                                <div class="form-group" style="display: none;">
                                    <div class="row">
                                        <div class="col-xs-6">
                                            <label>Vehicle Number Of Axles</label>
                                            <input type="text" class="form-control " id="vehicle_axles" value="2">
                                        </div>
                                        <div class="col-xs-6">
                                            <label>Hybrid</label>
                                            <select class="form-control" id="hybrid" >
                                                <option value="0" selected="true">Not Hybrid</option>
                                                <option value="1">Hybrid</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div class="form-group" style="display: none;">
                                    <div class="row">
                                        <div class="col-xs-6">
                                            <label>Emission Type</label>
                                            <select id="emissionType" class="form-control" >
                                                <option value="1">EURO I</option>
                                                <option value="2">EURO II</option>
                                                <option value="3">EURO III</option>
                                                <option value="4">EURO IV</option>
                                                <option value="5" selected="true">EURO V</option>
                                                <option value="6">EURO VI</option>
                                                <option value="7">EURO EEV</option>
                                                <option value="8">Electric Vehicle</option>
                                            </select>
                                        </div>
                                        <div class="col-xs-6">
                                            <label>Vehicle Height, cm</label>
                                            <input type="text" class="form-control " id="vehicle_height" value="400">
                                        </div>
                                    </div>
                                </div>
                                <div class="form-group" style="display: none;">
                                    <div class="row">
                                        <div class="col-xs-6">
                                            <label>Vehicle Weight, kg</label>
                                            <input type="text" class="form-control " id="vehicle_weight" value="24000">
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="form-up-label opts trailers" data-type="trailers">
                                <h4 class="mt-1 mb-2 pl-1" style="overflow:hidden;">Trailers Parameters <button onclick="managerUser_toggleFormBlock(this);" class="toggle_button pull-right"><i class="fa fa-angle-up"></i></button></h4>
                                <div class="form-group" style="display: none;">
                                    <div class="row">
                                        <div class="col-xs-6">
                                            <label>Trailer Type</label>
                                            <select class="form-control" id="trailer_type" >
                                                <option value="0" >None</option>
                                                <option value="1">Caravan</option>
                                                <option value="2" selected="true">Trailer</option>
                                            </select>
                                        </div>
                                        <div class="col-xs-6">
                                            <label>Trailer Number</label>
                                            <select class="form-control" id="trailer_number" >
                                                <option value="0">0</option>
                                                <option value="1" selected="true">1</option>
                                                <option value="2">2</option>
                                                <option value="3">3 or more</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div class="form-group" style="display: none;">
                                    <div class="row">
                                        <div class="col-xs-6">
                                            <label>Trailer Number Of Axles</label>
                                            <input type="text" class="form-control " id="trailer_axles" value="3">
                                        </div>
                                        <div class="col-xs-6">
                                            <label>Trailer Height, cm</label>
                                            <input type="text" class="form-control " id="trailer_height" value="400">
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="form-up-label opts others" data-type="others">
                                <h4 class="mt-1 mb-2 pl-1" style="overflow:hidden;">Other Parameters <button onclick="managerUser_toggleFormBlock(this);" class="toggle_button pull-right"><i class="fa fa-angle-up"></i></button></h4>
                                <div class="form-group" style="display: none;">
                                    <div class="row">
                                        <div class="col-xs-6">
                                            <label>Total Weight, kg</label>
                                            <input type="text" class="form-control " id="total_weight" value="38000">
                                        </div>
                                        <div class="col-xs-6">
                                            <label>Total Width, cm</label>
                                            <input type="text" class="form-control " id="total_width" value="255">
                                        </div>
                                    </div>
                                </div>
                                <div class="form-group" style="display: none;">
                                    <div class="row">
                                        <div class="col-xs-6">
                                            <label>Total Length, cm</label>
                                            <input type="text" class="form-control " id="total_length" value="1800">
                                        </div>
                                        <div class="col-xs-6">
                                            <label>Min Pollution</label>
                                            <select id="minPollution" class="form-control" >
                                                <option value="0" selected="true">No</option>
                                                <option value="1">Yes</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div class="form-group" style="display: none;">
                                    <div class="row">
                                        <div class="col-xs-6">
                                            <label>Number Passengers</label>
                                            <input type="text" class="form-control " id="passengers" value="1">
                                        </div>
                                        <div class="col-xs-6">
                                            <label>HOV</label>
                                            <select id="how" class="form-control" >
                                                <option value="0" selected="true">No</option>
                                                <option value="1">Yes</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div class="form-group" style="display: none;">
                                    <div class="row">
                                        <div class="col-xs-6">
                                            <label>Commercial</label>
                                            <select id="comm" class="form-control" >
                                                <option value="0" selected="true">No</option>
                                                <option value="1">Yes</option>
                                            </select>
                                        </div>
                                        <div class="col-xs-6">
                                            <label>Hazardous Type</label>
                                            <select id="hazardousType" class="form-control">
                                                <option value="0" selected="true">None</option>
                                                <option value="1">Explosives</option>
                                                <option value="2">Any Hazardous Material</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div class="form-group" style="display: none;">
                                    <div class="row">
                                        <div class="col-xs-6">
                                            <label>Disabled Equipped</label>
                                            <select id="dis" class="form-control" >
                                                <option value="0" selected="true">No</option>
                                                <option value="1">Yes</option>
                                            </select>
                                        </div>
                                        <div class="col-xs-6">
                                            <label>Height above 1st axle, cm</label>
                                            <input type="text" class="form-control " id="height_first_axle" value="100">
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-sm-8">
                            <div id="hereMap" class="hereMapBox" style="height:600px; margin-bottom: 10px;"></div>
                            <div id="runIftaTripResults" class="tripWayPointsResults"></div>
                            <div id="tripWayPointsResults" class="tripWayPointsResults"></div>
                        </div>
                        <hr />
                    </div>
                </section>
            </div>`);
            
            self.modalElement.find('#runIftaTrip').click(self.runIftaTrip);
            
            self.modalElement.find('#vehicle_spec').change(self.handleVehicleSpecChanged);
            self.modalElement.find('.datepicker').datepicker({dateFormat: 'mm-dd-yy', maxDate: new Date()}).datepicker("setDate", new Date());
            
            iftaMap.hMap = {};
            iftaMap.showMap();
        }
    }
    self.showSmartIftaModal = function () {
        let className = 'smartIftaModal';
        let title = 'EZ-Smart cloud IFTA';
        let footerBtns = `
            <button type="button" class="btns-item btn btn-primary-new" id="recalculateCloudIfta">Recalculate Cloud IFTA</button>
            <button type="button" class="btns-item btn btn-default" onclick="document.querySelector('.section__popup').remove()">Cancel</button>
        `;
        let content = `
            <div class="popup__content-desc">Only for smart devices</div>
            <div class="popup__content-row">
                <div class="row__title">Start date</div>
                <div class="row__content">
                    <input type="text" class="datepicker row__input" id="startDateCloudIfta">
                </div>
            </div>
            <div class="popup__content-row">
                <div class="row__title">End date</div>
                <div class="row__content">
                    <input type="text" class="datepicker row__input" id="endDateCloudIfta">
                </div>
            </div>
        `;

        showNewModal(className, title, content, footerBtns);

        $(document).find('.smartIftaModal #recalculateCloudIfta').click(self.recalculateCloudIfta);
        $(document).find('.smartIftaModal .datepicker').datepicker({dateFormat: 'yy-mm-dd', maxDate: new Date()}).datepicker("setDate", new Date());
    }
    self.recalculateCloudIfta = function () {
        let startDate = $(document).find('.smartIftaModal #startDateCloudIfta').val();
        let endDate = $(document).find('.smartIftaModal #endDateCloudIfta').val();

        if (startDate != '' && endDate != '' && self.userId != '') {
            let startDateStr = moment(startDate).format('YYYY-MM-DD');
            let endDateStr = moment(endDate).format('YYYY-MM-DD');

            let data = {action: 'test', userId: self.userId, startDate: startDateStr, endDate: endDateStr};

            AjaxController('calculateCloudDistanceForPeriod', data, apiAdminUrl, self.recalculateCloudIftaHandler, self.recalculateCloudIftaHandler, true);
        } else {
            console.log('Error! Start date or end date not found!');
        }
    }
    self.recalculateCloudIftaHandler = function (response) {
        document.querySelector('.section__popup').remove();

        if (response.code == '000') {
            let content = `
                <div class="row__img">
                    <img src="/dash/assets/img/done-icon.svg" alt="done icon">
                </div>
                <p class="row__text success">Request sent successfully</p>
            `;
            showNewModal('responseHandler successHandler', '', content, '');

            setTimeout(() => {
                document.querySelector('.section__popup').remove();
            }, 2000)
        } else {
            let btns = `<button type="button" class="btns-item btn btn-primary-new" onclick="document.querySelector('.section__popup').remove()">OK</button>`;
            let content = `
                <div class="popup__content-desc">${response.message} <br> please try again later.</div>
            `;

            showNewModal('smartIftaModal responseHandler', 'Something went wrong', content, btns);
        }
    }
    self.handleVehicleSpecChanged = function () {
        var vehicle = 1;
        var vehicleNumTires = 4;
        var trailerType = 0;
        var trailerNum = 0;
        var vehicleNumAxles = 2;
        var trailerNumAxles = 0;
        var hybrid = 0;
        var emmisionType = 5;
        var vehicleHeight = 167;
        var vehicleWeight = 1739;
        var trailerHeight = 0;
        var totalWeight = 1739;
        var totalWidth = 180;
        var totalLength = 441;
        var disabledEquipped = 0;
        var minPollution = 0;
        var hov = 0;
        var numPassengers = 2;
        var commercial = 0;
        var hazardousType = 0;
        var heightAbove1stAxle = 100;

        var vehSpecSelectionVal = self.modalElement.find('#vehicle_spec').val();
        if (vehSpecSelectionVal == 0) { // Car
            vehicle = 2;
            vehicleNumTires = 4;
            trailerType = 0;
            trailerNum = 0;
            vehicleNumAxles = 2;
            trailerNumAxles = 0;
            hybrid = 0;
            emmisionType = 5;
            vehicleHeight = 167;
            vehicleWeight = 1739;
            trailerHeight = 0;
            totalWeight = 1739;
            totalWidth = 180;
            totalLength = 441;
            disabledEquipped = 0;
            minPollution = 0;
            hov = 0;
            numPassengers = 2;
            commercial = 0;
            hazardousType = 0;
            heightAbove1stAxle = 100;
        } else if (vehSpecSelectionVal == 1) { // Delivery Truck
            vehicle = 9;
            vehicleNumTires = 4;
            trailerType = 0;
            trailerNum = 0;
            vehicleNumAxles = 2;
            trailerNumAxles = 0;
            hybrid = 0;
            emmisionType = 5;
            vehicleHeight = 255;
            vehicleWeight = 3500;
            trailerHeight = 0;
            totalWeight = 3500;
            totalWidth = 194;
            totalLength = 652;
            disabledEquipped = 0;
            minPollution = 0;
            hov = 0;
            numPassengers = 1;
            commercial = 1;
            hazardousType = 0;
            heightAbove1stAxle = 130;
        } else if (vehSpecSelectionVal == 2) { // Truck 7.5t
            vehicle = 3;
            vehicleNumTires = 4;
            trailerType = 0;
            trailerNum = 0;
            vehicleNumAxles = 2;
            trailerNumAxles = 0;
            hybrid = 0;
            emmisionType = 5;
            vehicleHeight = 340;
            vehicleWeight = 7500;
            trailerHeight = 0;
            totalWeight = 7500;
            totalWidth = 250;
            totalLength = 720;
            disabledEquipped = 0;
            minPollution = 0;
            hov = 0;
            numPassengers = 1;
            commercial = 1;
            hazardousType = 0;
            heightAbove1stAxle = 300;
        } else if (vehSpecSelectionVal == 3) { // Truck 11t
            vehicle = 3;
            vehicleNumTires = 4;
            trailerType = 0;
            trailerNum = 0;
            vehicleNumAxles = 2;
            trailerNumAxles = 0;
            hybrid = 0;
            emmisionType = 5;
            vehicleHeight = 380;
            vehicleWeight = 11000;
            trailerHeight = 0;
            totalWeight = 11000;
            totalWidth = 255;
            totalLength = 1000;
            disabledEquipped = 0;
            minPollution = 0;
            hov = 0;
            numPassengers = 1;
            commercial = 1;
            hazardousType = 0;
            heightAbove1stAxle = 300;
        } else if (vehSpecSelectionVal == 4) { // Truck one trailer 38t
            vehicle = 3;
            vehicleNumTires = 6;
            trailerType = 2;
            trailerNum = 1;
            vehicleNumAxles = 2;
            trailerNumAxles = 3;
            hybrid = 0;
            emmisionType = 5;
            vehicleHeight = 400;
            vehicleWeight = 24000;
            trailerHeight = 400;
            totalWeight = 38000;
            totalWidth = 255;
            totalLength = 1800;
            disabledEquipped = 0;
            minPollution = 0;
            hov = 0;
            numPassengers = 1;
            commercial = 1;
            hazardousType = 0;
            heightAbove1stAxle = 300;
        } else if (vehSpecSelectionVal == 5) { // Trailer Truck 40t
            vehicle = 3;
            vehicleNumTires = 6;
            trailerType = 2;
            trailerNum = 1;
            vehicleNumAxles = 3;
            trailerNumAxles = 2;
            hybrid = 0;
            emmisionType = 5;
            vehicleHeight = 400;
            vehicleWeight = 12000;
            trailerHeight = 400;
            totalWeight = 40000;
            totalWidth = 255;
            totalLength = 1650;
            disabledEquipped = 0;
            minPollution = 0;
            hov = 0;
            numPassengers = 1;
            commercial = 1;
            hazardousType = 0;
            heightAbove1stAxle = 300;
        } else if (vehSpecSelectionVal == 6) { // Car with Trailer
            vehicle = 2;
            vehicleNumTires = 3;
            trailerType = 2;
            trailerNum = 1;
            vehicleNumAxles = 2;
            trailerNumAxles = 1;
            hybrid = 0;
            emmisionType = 5;
            vehicleHeight = 167;
            vehicleWeight = 1739;
            trailerHeight = 167;
            totalWeight = 2589;
            totalWidth = 180;
            totalLength = 733;
            disabledEquipped = 0;
            minPollution = 0;
            hov = 0;
            numPassengers = 1;
            commercial = 0;
            hazardousType = 0;
            heightAbove1stAxle = 100;
        }
        $('#vehicle_type').val(vehicle);
        $('#vehicle_tires').val(vehicleNumTires);
        $('#trailer_type').val(trailerType);
        $('#trailer_number').val(trailerNum);
        $('#vehicle_axles').val(vehicleNumAxles);
        $('#trailer_axles').val(trailerNumAxles);
        $('#hybrid').val(hybrid);
        $('#emissionType').val(emmisionType);
        $('#vehicle_height').val(vehicleHeight);
        $('#vehicle_weight').val(vehicleWeight);
        $('#trailer_height').val(trailerHeight);
        $('#total_weight').val(totalWeight);
        $('#total_width').val(totalWidth);
        $('#total_length').val(totalLength);
        $('#dis').val(disabledEquipped);
        $('#minPollution').val(minPollution);
        $('#hov').val(hov);
        $('#passengers').val(numPassengers);
        $('#comm').val(commercial);
        $('#hazardousType').val(hazardousType);
        $('#height_first_axle').val(heightAbove1stAxle);
    }
    self.runIftaTrip = function () {
        self.modalElement.find('#runIftaTripResults').empty();
        self.modalElement.find('#tripWayPointsResults').empty();
        AjaxController('getUserIftaInfoByDate', {'userId': self.userId, 'date': convertDateToSQL($('#tripWayPointsForm .datepicker').val())}, apiAdminUrl, self.runIftaTripHandler, self.runIftaTripHandler, true);
    }
    self.runIftaTripHandler = function (response) {
        // console.log(response);
        
        if (response.code == '000') {
            var result = response.data.result;
            if (result.statusPoints.length > 1) {
                iftaMap.makeRoute(result.statusPoints, false);
                if (result.iftaDistances.length > 0) {
                    let tr = '';
                    let total = 0;
                    $.each(result.iftaDistances, function (key, value) {
                        tr += `<tr data-truckId="${value.truckId}" data-stateId="${value.stateId}" data-userId="${self.userId}" data-date="${value.date}">`;
                        tr += `<td data-stateName="${value.name}">${value.name}(${value.short})</td>`;
                        tr += `<td>${value.distance.toFixed(2)} mi</td>`;
                        tr += `<td>${(value.distance / 0.62137119).toFixed(2)} km</td>`;
                        total += value.distance;
                        tr += `<td><button class="btn btn-default" style="margin-top:10px;" onclick="managerUser_fixDistance(this);">Fix Distance</button></td>`;
                        tr += `</tr>`;
                    });
                    self.modalElement.find('#runIftaTripResults').empty().append(`<h4>User IFTA Distance</h4><table class="table table-striped table-dashboard table-sm">
                        <tbody>
                            ${tr}
                            <tr><td>Total:</td><td>${total.toFixed(2)} mi</td><td>${(total / 0.62137119).toFixed(2)} km</td></tr>
                        </tbody>
                    </table>`);
                } else {
                    self.modalElement.find('#runIftaTripResults').empty().append(`
                        <h4>NO User IFTA Distance</h4>
                        <button data-userid="${self.userId}" onclick="managerUser_fixAllDistance(this);">Restore all IFTA of map result</button>
                    `);
                }
            } else {
                showModal('Message', 'Driver not have status points for this day!', 'errorMessage');
            }
        }
    }
    self.getDriverFullDataHandler = function(response){
        var userData = response.data.userData;
        var driversData = response.data.driversData;
        var driversRules = response.data.driversRules;
        var viewPassButton = position == TYPE_SUPERADMIN  || superAdminRights.superwiser ? ' <i class="fa fa-eye pointer" aria-hidden="true"></i>' : '';
        
        var scannerType = 'Ez-Simple';
        if (driversData.scanner_type == 1) {
            scannerType = 'Ez-Smart';
        } else if (driversData.scanner_type == 2) {
            scannerType = 'Ez-Hard-wire';
        }
        
        let scannerTypeSelector = '<select id="driverSettingScannerType">\n\
                <option value="0" ' + (driversData.scanner_type == 0 ? 'selected' : '') + '>Ez-Simple</option>\n\
                <option value="1" ' + (driversData.scanner_type == 1 ? 'selected' : '') + '>Ez-Smart</option>\n\
            </select>';
        
        var settingsHtml = '\n\
            <style>\n\
                .popup_box_body .col-md-4 label{\n\
                width:35%;\n\
                display:inline-block; font-weight: bold;\n\
            }\n\
            .popup_box_body .col-md-4 span{\n\
                width:65%;\n\
                display:inline-block;\n\
            }\n\
            </style>\n\
            <div class="row">\n\
                <div class="col-lg-12"><h4>User data</h4></div>\n\
            </div>\n\
            <div class="row">\n\
                <div class="col-md-4"><label>Name</label><span>'+userData.name+'</span></div>\n\
                <div class="col-md-4"><label>Surname</label><span>'+userData.last+'</span></div>\n\
                <div class="col-md-4"><label>Phone</label><span>'+(checkValue(userData.phone) || '')+'</span></div>\n\
                <div class="col-md-4"><label>Ext</label><span>'+(checkValue(userData.extention) || '')+'</span></div>\n\
                <div class="col-md-4"><label>Email</label><span>'+userData.email+'</span></div>\n\
                <div class="col-md-4"><label>Password</label><span>****'+viewPassButton+'</span></div>\n\
                <div class="col-md-4"><label>Carrier</label><span>'+(userData.carrierId > 0 ? userData.carrier.name : '')+'</span></div>\n\
                <div class="col-md-4"><label>Position</label><span>'+getPositionNameFromId(userData.companyPosition, driversData.aobrd)+'</span></div>\n\
            </div>\n\
            <div class="row">\n\
                <div class="col-lg-12"><h4>Driver data</h4></div>\n\
            </div>\n\
            <div class="row">\n\
                <div class="col-md-4"><label>License Number</label><span>'+driversData.DLNumber+'</span></div>\n\
                <div class="col-md-4"><label>License State</label><span>'+locationState.getStateNameById(driversData.DLState)+'</span></div>\n\
                <div class="col-md-4"><label>License Exp</label><span>'+moment(driversData.DLExpiration, "YYYY-MM-DD").format("MM-DD-YYYY")+'</span></div>\n\
                <div class="col-md-4"><label>Yard Moves</label><span>'+(driversData.yard == 1 ? 'On' : 'Off')+'</span></div>\n\
                <div class="col-md-4"><label>Personal Conv</label><span>'+(driversData.conv == 1 ? 'On' : 'Off')+'</span></div>\n\
                <div class="col-md-4"><label>Personal Cycle</label><span>'+(driversData.personal_cycle == 1 ? 'On' : 'Off')+'</span></div>\n\
                <div class="col-md-4"><label>Personal TZ</label><span>'+(driversData.personal_tz == 1 ? 'On' : 'Off')+'</span></div>\n\
                <div class="col-md-4"><label>Able Edit ALL</label><span>'+(driversData.aobrdAbleToEdit == 1 ? 'On' : 'Off')+'</span></div>\n\
                <div class="col-md-4"><label>Edit ON/OFF/SB</label><span>'+(driversData.ableEditOnOffSB == 1 ? 'On' : 'Off')+'</span></div>\n\
                <div class="col-md-4"><label>Manual Drive</label><span>'+(driversData.aobrdManualDrive == 1 ? 'On' : 'Off')+'</span></div>\n\
                <div class="col-md-4"><label>Paper Dvir</label><span>'+(driversData.paperDvir == 1 ? 'On' : 'Off')+'</span></div>\n\
                <div class="col-md-4"><label>Scanner Type</label><span>'+scannerTypeSelector+'</span></div>\n\
                <div class="col-md-4"><label>Аdverse driving</label><span>'+(driversData.adverce_driving == 1 ? 'On' : 'Off')+'</span></div>\n\
                <div class="col-md-4"><label>16 hours exception</label><span>'+(driversData.hours_exception == 1 ? 'On' : 'Off')+'</span></div>\n\
            </div>\n\
            <div class="row">\n\
                <div class="col-lg-12"><h4>Driver Rules</h4></div>\n\
            </div>\n\
            <div class="row">\n\
                <div class="col-md-4"><label>Cycle</label><span>'+driversRules.cycle.name+'</span></div>\n\
                <div class="col-md-4"><label>Time Zone</label><span>'+driversRules.timeZone.name+'</span></div>\n\
                ' + (driversRules.teamDriver > 0 ? '<div class="col-md-4"><label>Team Driver</label><span style="cursor:pointer;color:#3498db;" data-userid="' + driversRules.teamDriver + '" onclick="getOneUserInfo(this, event);">' + driversRules.teamDriverInfo.name + ' ' + driversRules.teamDriverInfo.last + ' (click me)</span></div>' : '') + '\n\
            </div>';
        
        self.modalElement.find('.switch_body .popup_box_body').append(settingsHtml);
        self.modalElement.find('.fa-eye').click(self.showPassword);
        self.modalElement.find('#driverSettingScannerType').change(self.changeDriverScannerType);
    }
    
    self.changeDriverScannerType = function() {
        let scannerType = self.modalElement.find('#driverSettingScannerType').val();
        let userId = self.userId;
        AjaxController('changeDriverSetting', {'userId': userId, 'scannerType': scannerType}, apiAdminUrl, self.changeDriverScannerTypeHandler, self.changeDriverScannerTypeHandler, true);
    }
    
    self.changeDriverScannerTypeHandler = function(response) {
        console.log(response);
        if (response.code == '000') {
            alert('Driver setting change');
        } else {
            alert(response.message);
        }
    }
    
    self.showPasswordHandler = function(response){
        self.modalElement.find('.fa-eye').parent().text(response.data.password)
    }
    self.showPassword = function(){
        AjaxController('showPassword', {'userId': userId}, apiAdminUrl, self.showPasswordHandler, self.showPasswordHandler, true);
    }
    self.showDriverParams = function(){
        self.modalElement.find('.dropDownTabs, .modal-footer .cardPaginator.pg_pagin, .popup_box_body, .control-buttons, .tableTabButtonsBox').hide();
        self.modalElement.find('.modal-body.popup_box_panel').append('<div class="switch_body">\
			<div class="col-xs-12 text-right control-buttons">\
			</div>\
			<div class="popup_box_body container" style="    clear: both;"></div>');
        AjaxController('getDriverFullData', {'userId': userId}, apiAdminUrl, self.getDriverFullDataHandler, self.getDriverFullDataHandler, true);
    }
    self.showLogbook = function () {
        self.returnToInitState();
        self.modalElement.find('.dropDownTabs, .modal-footer .cardPaginator.pg_pagin, .popup_box_body, .control-buttons, .tableTabButtonsBox').hide();
        if(self.modalElement.find('.modal-body.popup_box_panel .switch_body').length == 0)
        self.modalElement.find('.modal-body.popup_box_panel').append('<div class="switch_body">\
			<div class="col-xs-12 text-right control-buttons">\
				<div class="check_buttons_block logbook_type">\
					<button class="btn btn-default active" onclick="doActive(this)" data-val="0">Driver</button>\
					<button class="btn btn-default" onclick="doActive(this)" data-val="1">Carrier</button>\
					<button class="btn btn-default" onclick="doActive(this)" data-val="2">Original</button>\
				</div>\
				<div id="log_s" class="form-group">\
					<input type="text" id="datepicker" class="datepicker">\
					<i class="fa fa-calendar"></i>\
					<button class="arrow" id="date_left" data-page="drivers"><i class="fa fa-angle-left"></i></button>\
					<button class="arrow" id="date_right" data-page="drivers"><i class="fa fa-angle-right"></i></button>\
					<div id="logsButtons">\
						<button class="btn btn-default drivers_log_pdf last">DOWNLOAD PDF</button>\
					</div>\
				</div>\
			</div>\
			<div class="popup_box_body" style="    clear: both;"></div>');
        if (self.user.carrierId > 0) {
            self.modalElement.find('.logbook_type button[data-val=1]').prop('disabled', false);
        } else {
            self.modalElement.find('.logbook_type button[data-val=1]').prop('disabled', true);
        }
        if (self.user.smart_safety) {
            $('#manager_user_card #edit_main_info').show();
            logbook.userIsSmartSafety = true;
        } else {
            $('#manager_user_card #edit_main_info').hide();
            logbook.userIsSmartSafety = false;
        }
        self.modalElement.find('.logbook_type button').click(self.changeLogbookType);

        AjaxController('getLogbookView', {}, apiAdminUrl, self.getLogbookViewHandler, self.getLogbookViewHandler, true);
    }
    self.returnToInitState = function () {
        self.modalElement.find('.dropDownTabs, .modal-footer .cardPaginator.pg_pagin, .popup_box_body, .control-buttons, .tableTabButtonsBox').show();
        self.modalElement.find('.switch_body').remove();
    }
    self.getLogbookViewHandler = function (response) {
        if(self.modalElement.find('.modal-body.popup_box_panel .switch_body #log_book').length == 0){
            self.modalElement.find('.switch_body .popup_box_body').append(response.data.logbookInfoView);
            self.modalElement.find('.switch_body .popup_box_body').append(response.data.logbookView);
        }
        $('#time_control').remove();
        self.modalElement.find('.datepicker').datepicker({dateFormat: 'mm-dd-yy', maxDate: new Date()}).datepicker("setDate", new Date());
        logbook.originalLogbook = false;
        logbook.forceCarrier = false;
        logbook.changeLogDate(self.user.id, convertDateToSQL(''))

    }
    self.changeLogbookType = function () {
        var type = $(this).attr('data-val')
        if (type == 2) {
            logbook.originalLogbook = true;
            logbook.forceCarrier = false;
        } else if (type == 1) {
            logbook.originalLogbook = false;
            logbook.forceCarrier = true;
        } else {
            logbook.originalLogbook = false;
            logbook.forceCarrier = false;
        }
        logbook.changeLogDate(self.user.id, convertDateToSQL(self.modalElement.find('.switch_body .datepicker').val()))
    }
    self.getManagerCreditCardActionsPaginationHandler = function (response) {
        var tbody = '';
        var status = {
            0: 'label-default',
            1: 'label-success',
        };
        response.data.result.forEach((item) => {
            var listOfButtons = [];
            listOfButtons.push(`<button type="button" onclick="setManageCreditCardDefault(${item.customer_profile_id}, ${item.customer_payment_profile_id})">Set current</button>`);
            listOfButtons.push(`<button type="button" onclick="managerCreditCardRemove(${item.customer_profile_id}, ${item.customer_payment_profile_id})">Remove</button>`);
            tbody += `<tr>
                <td><i class="fa fa-credit-card-alt"></i> ${item.creditCard}</td>
                <td>${item.userName} (${item.email})</td>
                <td>${item.currentCard === 1 ? '<span class="label label-success">Current</span>' : ''}</td>
                <td><span class="label ${status[item.validCard]}">${item.validCard === 1 ? 'Valid' : 'Not valid'}</span></td>
                <td><span class="label label-danger">${item.deleted === 1 ? 'Yes' : ''}</span></td>
                ${(finances.checkAccessFinances() ? '<td>' + addTableActionRow(listOfButtons, 120) + '</td>' : '')}
            </tr>`;
        });
        self.modalElement.find('#' + self.tableId).find('tbody').html(tbody);
        if (finances.checkAccessFinances()) {
            self.modalElement.find('#' + self.tableId).addClass('table-actions-block');
        }
    };
    self.initRequest();
    self.sendDriverEvent = function (params) {
        if(params.action == 'updateProgress'){
            if(self.modalElement.find('.updateProgressBar').length == 0)
            self.modalElement.find('.pupop_box_header').append(`
            <style>
                .updateProgressBar{
                    border-bottom: 1px solid #ccc;
                    margin: 0 !important;
                    width: 100%;
                    padding-bottom: 3px;
                    padding-top: 3px;
                }
                .progressBar{
                    width: 100%;
                    height: 10px;
                    background: white;
                    border: 1px solid #91A4B0;
                    border-radius: 9px;
                    margin-top: 5px;
                }
                .currentProgress{
                    width: 50%;
                    heigth:6px;
                    position:relative;
                    top:-1px;
                    left:-1px;
                    height: 10px;
                    background: #3498DB;
                    border-radius: 9px;
                }
                .error .progressBar{
                    border-color:#a94442;
                }
                .error .currentProgress{
                    background:#a94442;
                }
                .error .errorText{
                    color:#a94442;
                }
            </style>
            <div class="updateProgressBar container">
                <div class="row">
                    <div class="col-sm-4">Update Progress, <span class="currentProgressNum">0%</span></div>
                    <div class="col-sm-8"><div class="progressBar"><div class="currentProgress"></div></div></div>
                </div>
            </div>`)
            
            if(params.progressProcents != undefined && params.progressProcents != false && params.progressProcents != ''){
                self.modalElement.find('.currentProgress').css('width', params.progressProcents+'%');
                self.modalElement.find('.currentProgressNum').text(params.progressProcents+'%');
            }
            if(params.progressError != undefined && params.progressError != false && params.progressError != ''){
                self.modalElement.find('.currentProgressNum').html('<span class="errorText">Error, '+params.progressError+'</span>');
                $('.updateProgressBar').addClass('error');
            }
        }else if(params.action == 'deviceScreenshot'){
            self.startDeviceScreenshotTimer();
            if($('.driverScreen'). length == 0){
                $('#manager_user_card .modal-content').append(`
                    <div class="driverScreen">
                        <div class="dragPanel"></div>
                        <i class="fa fa-expand" onclick="$('.driverScreen').toggleClass('fullScreen')"></i>
                        <button type="button" class="closeView" onclick="$('.driverScreen').remove()"><span aria-hidden="true">×</span></button>
                        <img src="" alt="Driver screen"/>
                    </div>
                `)
                $('.dragPanel').mousedown(self.initScreenDrag);
                $('#manager_user_card').mouseup(self.finishScreenDrag);
            }
            $('.driverScreen').removeClass('no_connection');
            $('.driverScreen .dragPanel').text('');
            $('.driverScreen img').attr('src', 'data:image/png;base64,'+params.byteArray);
            if($('.driverScreen img').width() > $('.driverScreen img').height() && $('.driverScreen img').height() != 0){
                $('.driverScreen').addClass('landscape')
            }else{
                $('.driverScreen').removeClass('landscape')
            }
        }
    }
    self.initScreenDrag = function(){
        self.lastMoveX = 0;
        self.lastMoveY = 0;
        $( "#manager_user_card" ).on('mousemove', function( event ) {
            if(self.lastMoveX == 0){
                self.lastMoveX = event.pageX;
                self.lastMoveY = event.pageY;
                return 1;
            }
            if($('.driverScreen').length == 0){
                self.finishScreenDrag();
            }
            var msg = "Handler for .mousemove() called at ";
            msg += event.pageX + ", " + event.pageY;
            var diffX = self.lastMoveX - event.pageX;
            var diffY = self.lastMoveY - event.pageY;
            if(diffX != 0){
                $('.driverScreen').css('right',parseInt($('.driverScreen').css('right'))+diffX)
            }
            if(diffY != 0){
                $('.driverScreen').css('top',parseInt($('.driverScreen').css('top'))-diffY)
            }
            self.lastMoveX = event.pageX;
            self.lastMoveY = event.pageY;
            
        });
    }
    self.startDeviceScreenshotTimer = function(){
        if(self.deviceScreenshotTimer){
            clearTimeout(self.deviceScreenshotTimer);
        }
        self.deviceScreenshotTimer = setTimeout(function(){
            if($('.driverScreen').length == 0){
                return 1;
            }
            $('.driverScreen').addClass('no_connection');
            $('.driverScreen .dragPanel').text('No Connection');
        }, 5000);
    }
    self.finishScreenDrag = function(){
        $( "#manager_user_card" ).off('mousemove');
    }
    self.requestScreenViewHandler = function(requestAccepted){
        if(requestAccepted == 1){
            alertMessage($('#manager_user_card .control-buttons'), 'Screen View Request Granted', 3000);
        }else{
            alertError($('#manager_user_card .control-buttons'), 'Screen View Request Rejected', 3000);
        }
    }
}
function safelyParseJSON(json) {
    var parsed
    try {
        parsed = JSON.parse(json)
    } catch (e) {
        return false
    }
    return parsed;
}
//user card
function getOneUserInfo(el, event) {
    var userId = $(el).attr('data-userid');
    event.stopPropagation();
    new managerUserCard(userId);
}
function unbannedUser(userId) {
    AjaxController('unban', {'userId': userId}, adminUrl, 'unbannedUserHandler', changeUserEmailHandler, true);
}
function unbannedUserHandler(response) {
    if (response.data !== false) {
        new managerUserCard(response.data.driverId);
    }
}
function paperLogsPermissionModalConfirmErrorHandler(response) {
    alertError($('#paperLogsModal .modal-body'), response.message, 3000);
    $('#paperLogsPermissionModalButton').prop('disabled', false)
}
function paperLogsPermissionModalConfirmHandler(response) {
    $('#paperLogsModal .close').click();
    showModal('Paper Logs permission Success', 'Paper Logs Permission created and sent to user email, you can download pdf <a target="_blank" href="' + response.data.pdfResult + '">here</a>');
    $('#paperLogsPermissionModalButton').prop('disabled', false)
}
function paperLogsPermissionModalConfirm(el) {
    $('#paperLogsPermissionModalButton').prop('disabled', true)
    var dates = $('#paperLogsRange').val().split(' - ');
    var dateStart = moment(dates[0], 'MM-DD-YYYY');
    var dateEnd = moment(dates[1], 'MM-DD-YYYY');
    var daysRange = dateEnd.diff(dateStart, 'days');
    var deviceId = parseInt($('#paperLogsDevice').val()) || 0;
    var error = '';
    if (daysRange < 0) {
        error = 'Wrong Dates';
    }
    if (position != TYPE_SUPERADMIN && daysRange > 8) {
        error = 'Can\'t be more than 8 days';
    }
    if (deviceId <= 0) {
        error = 'Select Device';
    }
    if (error) {
        alertError($('#paperLogsModal .modal-body'), error, 3000);
        $('#paperLogsPermissionModalButton').prop('disabled', false)
        return true;
    }
    AjaxCall({url: apiAdminUrl, action: 'paperLogsPermissionModalConfirm', data: {'userId': $('#paperLogsUserId').val(), deviceId: deviceId, dateStart: dates[0], dateEnd: dates[1], dateStartSQL: dateStart.format('YYYY-MM-DD'), dateEndSQL: dateEnd.format('YYYY-MM-DD')},
        successHandler: paperLogsPermissionModalConfirmHandler, errorHandler: paperLogsPermissionModalConfirmErrorHandler});
}
function paperLogsPermissionModalShow(response) {
    var devicesOptions = '';
    $.each(response.data.devicesList, function (key, device) {
        if (!device.BLEAddress) {
            return true;
        }
        var deviceBLE = device.BLEAddress ? `(${device.BLEAddress})` : '';
        devicesOptions += `<option value="${device.id}">${device.id} ${deviceBLE}</option>`
    });
    var content = `<form class="form-horizontal" id="paperLogsForm">
        <input type="hidden" id="paperLogsUserId" name="paperLogsUserId" value="${response.data.userId}">
		<div class="form-group">
            <div class="col-sm-12">
                <p>You are going to give Paper Logs Permission to driver ${response.data.userName}</p>
            </div>
        </div>
        <div class="form-group">
            <label for="paperLogsRange" class="col-sm-4 control-label">Dates Range</label>
            <div class="col-sm-8">
                <input type="text" class="form-control daterange paperLogsRange" placeholder="mm-dd-yyyy" data-type="paperLogsRange" id="paperLogsRange" data-mask="00-00-0000 - 00-00-0000">
            </div>
        </div>
        <div class="form-group">
            <label for="paperLogsDevice" class="col-sm-4 control-label">ELD/AOBRD Device</label>
            <div class="col-sm-8">
                
                <select class="form-control" id="paperLogsDevice"><option value="0">Select Device</option>${devicesOptions}</select>
            </div>
        </div>
    </form>`;
    showModal('Paper Logs permission', content, 'paperLogsModal', '', {footerButtons: `<button class="btn btn-primary" id="paperLogsPermissionModalButton" onclick="paperLogsPermissionModalConfirm(this)">Confirm</button>`});
    var dateFormat = 'MM-DD-YYYY';
    var date = new Date();
    date.setDate(date.getDate() + 8);
    $('#paperLogsRange').daterangepicker({
        startDate: moment(new Date()).format(dateFormat),
        endDate: moment(date).format(dateFormat),
        minDate: '01-01-2015',
        linkedCalendars: false,
        locale: {
            format: dateFormat
        }
    });
    $('.daterangepicker').css('z-index', 9999);
    $('#paperLogsDevice').select2();
}


function paperLogsPermissionModal(userId) {
    AjaxCall({url: apiAdminUrl, action: 'getUserEldDevices', data: {'userId': userId}, successHandler: paperLogsPermissionModalShow});
}
function managerUpdateSoloToFleet(userId) {
    c(userId);
    AjaxController('getUsersInfo', {'userId': userId}, adminUrl, 'showModalUpdateSoloToFleet', errorBasicHandler, true);
}
function showModalUpdateSoloToFleet(response) {
    c(response);
    $('#modalManagerUpdateToFleet').remove();
    $('body').append(`<div class="modal modal-white" tabindex="-1" role="dialog" id="modalManagerUpdateToFleet">
    <div class="modal-dialog modal-lg" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span>
                </button>
                <h4 class="modal-title">Update To Fleet</h4>
            </div>
            <div class="modal-body">
                <form id="formUpdateToFleet">
                    <input type="hidden" name="userId" value="${response.data.user.userId}">
                    <div class="form-group">
                        <label for="reg_fl2_type">COMPANY POSITION</label>
                        <select name="type" class="form-control" id="reg_fl2_type">
                            <option value="5" selected>Safety Director/Administrator</option>
                            <option value="3">Driver</option>
                        </select>
                    </div>
                    <div class="row">
                        <div class="form-group col-sm-6">
                            <label for="reg_fl2_usdot">USDOT #</label>
                            <input type="text" name="usdot" id="reg_fl2_usdot" class="form-control" maxlength="10" data-mask="0000000000" placeholder="USDOT #" value="${response.data.carrier.usdot}"/>
                        </div>
                        <div class="form-group col-sm-6">
                            <label for="search_fl2_company"></label>
                            <button type="button" id="search_fl2_company" class="btn btn-block btn-default" onclick="searchCompany(this)">Search Company</button>
                        </div>
                    </div>
                    <div class="row">
                        <div class="form-group col-sm-6">
                            <label for="reg_fl2_state">STATE/PROVINCE</label>
                            <select name="state" class="form-control" id="reg_fl2_state">
                                <option value="0">STATE/PROVINCE</option>
                                <optgroup label="USA">
                                    <option value="1" data-short="AL">Alabama</option><option value="2" data-short="AK">Alaska</option><option value="3" data-short="AZ">Arizona</option><option value="4" data-short="AR">Arkansas</option><option value="5" data-short="CA">California</option><option value="6" data-short="CO">Colorado</option><option value="7" data-short="CT">Connecticut</option><option value="8" data-short="DE">Delaware</option><option value="9" data-short="FL">Florida</option><option value="10" data-short="GA">Georgia</option><option value="11" data-short="HI">Hawaii</option><option value="12" data-short="ID">Idaho</option><option value="13" data-short="IL">Illinois</option><option value="14" data-short="IN">Indiana</option><option value="15" data-short="IA">Iowa</option><option value="16" data-short="KS">Kansas</option><option value="17" data-short="KY">Kentucky</option><option value="18" data-short="LA">Louisiana</option><option value="19" data-short="ME">Maine</option><option value="20" data-short="MD">Maryland</option><option value="21" data-short="MA">Massachusetts</option><option value="22" data-short="MI">Michigan</option><option value="23" data-short="MN">Minnesota</option><option value="24" data-short="MS">Mississippi</option><option value="25" data-short="MO">Missouri</option><option value="26" data-short="MT">Montana</option><option value="27" data-short="NE">Nebraska</option><option value="28" data-short="NV">Nevada</option><option value="29" data-short="NH">New Hampshire</option><option value="30" data-short="NJ">New Jersey</option><option value="31" data-short="NM">New Mexico</option><option value="32" data-short="NY">New York</option><option value="33" data-short="NC">North Carolina</option><option value="34" data-short="ND">North Dakota</option><option value="35" data-short="OH">Ohio</option><option value="36" data-short="OK">Oklahoma</option><option value="37" data-short="OR">Oregon</option><option value="38" data-short="PA">Pennsylvania</option><option value="39" data-short="RI">Rhode Island</option><option value="40" data-short="SC">South Carolina</option><option value="41" data-short="SD">South Dakota</option><option value="42" data-short="TN">Tennessee</option><option value="43" data-short="TX">Texas</option><option value="44" data-short="UT">Utah</option><option value="45" data-short="VT">Vermont</option><option value="46" data-short="VA">Virginia</option><option value="47" data-short="WA">Washington</option><option value="48" data-short="WV">West Virginia</option><option value="49" data-short="WI">Wisconsin</option><option value="50" data-short="WY">Wyoming</option><option value="64" data-short="DC">Washington DC</option>
                                </optgroup>
                                <optgroup label="Canada">
                                    <option value="51" data-short="AB">Alberta</option><option value="52" data-short="BC">British Columbia</option><option value="53" data-short="MB">Manitoba</option><option value="54" data-short="NB">New Brunswick</option><option value="55" data-short="NL">Newfoundland and Labrador</option><option value="56" data-short="NS">Nova Scotia</option><option value="57" data-short="NT">Northwest Territories</option><option value="58" data-short="NU">Nunavut</option><option value="59" data-short="ON">Ontario</option><option value="60" data-short="PE">Prince Edward Island</option><option value="61" data-short="QC">Quebec</option><option value="62" data-short="SK">Saskatchewan</option><option value="63" data-short="YT">Yukon</option>
                                </optgroup>
                            </select>
                        </div>
                        <div class="form-group col-sm-6">
                            <label for="reg_fl2_city">CITY</label>
                            <input type="text" name="city" placeholder="CITY" class="form-control" id="reg_fl2_city" value="${response.data.carrier.city}"/>
                        </div>
                    </div>
                    <div class="row">
                        <div class="form-group col-sm-12">
                            <label for="reg_fl2_timeZone">Time Zone</label>
                            <select name="timeZone" class="form-control" id="reg_fl2_timeZone">
                                <option value="4" selected="selected">AKST Alaska Standard Time</option>
                                <option value="8">Arizona</option>
                                <option value="6">Atlantic time (US &amp; Canada)</option>
                                <option value="1" selected="">Central Time (US &amp; Canada)</option>
                                <option value="0">Eastern Time (US &amp; Canada)</option>
                                <option value="5">Indiana (East)</option>
                                <option value="2">Mountain Time (US &amp; Canada)</option>
                                <option value="3">Pacific time (US &amp; Canada)</option>
                                <option value="7">Saskatchewan (CST)</option>
                            </select>
                        </div>
                    </div>
                    <div class="row">
                        <div class="form-group col-sm-6">
                            <label for="reg_fl2_zip" >ZIP/POSTAL CODE</label>
                            <input name="zip" placeholder="ZIP/POSTAL CODE" class="form-control" maxlength="10" id="reg_fl2_zip" value="${response.data.carrier.zip}"/>
                        </div>
                        <div class="form-group col-sm-6">
                            <label for="reg_fl2_size" >Fleet size</label>
                            <input data-mask="0000" name="size" class="form-control" id="reg_fl2_size" placeholder="Fleet size" value="${response.data.carrier.size}"/>
                        </div>
                    </div>
                    <div class="form-group">
                        <input type="text" name="car_name" class="form-control" id="reg_fl2_car_name" placeholder="Carrier name" value="${response.data.carrier.name}"/>
                    </div>
                    <div class="form-group">
                        <input type="text" name="addr" class="form-control" id="reg_fl2_office_addr" placeholder="Main office address" value="${response.data.carrier.address}"/>
                    </div>
                    <div class="form-group">
                        <input type="text" name="ein" class="form-control" id="reg_fl2_ein" placeholder="EIN"/>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <div class="row">
                    <div class="form-group col-sm-4">
                        <button type="button" onclick="btnUpdateToFleet()" class="btn btn-block btn-default">DONE</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>`);
    $('#modalManagerUpdateToFleet').modal('show');
}
function searchCompany(e) {
    resetError();
    var $form = $(e).closest('form');
    var $usdot = $form.find('input[name="usdot"]');
    if ($usdot.val() == '') {
        return setError($usdot, 'Enter USDOT number');
    } else if ($usdot.val().length > 10) {
        return setError($usdot, 'USDOT length can\'t be more than 10 characters');
    }

    $usdot.removeClass('confirm');
    var data = {data: {usdot: $usdot.val(), action: 'reg_usdot'}};
    $.ajax({
        url: MAIN_LINK + '/db/reg_search/' + '?' + window.location.search.substring(1),
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(data),
        success: function (data) {
            var response = jQuery.parseJSON(data);
            if (response.code == '000') {
                $usdot.addClass('confirm');
                var $name = response.data.content.carrier.legalName,
                        $state = response.data.content.carrier.phyState,
                        $address = response.data.content.carrier.phyStreet,
                        $zip = response.data.content.carrier.phyZipcode,
                        $city = response.data.content.carrier.phyCity;
                $form.find('input[name="car_name"]').val($name);
                $form.find('input[name="office_addr"]').val($address);
                $form.find('input[name="zip"]').val($zip);
                $form.find('input[name="city"]').val($city);
                $form.find('input[name="state"]').val($state);
            } else if (response.code == '206' || response.code == '209' || response.code == '238') {
                resetError();
                setError($usdot, response.message);
            }
        }
    });
}
function btnUpdateToFleet() {
    var $form = $('#formUpdateToFleet');
    if (!validateUpdateToFleet($form)) {
        return false;
    }
    var data = {};
    jQuery.each($form.serializeArray(), function (i, field) {
        data[field.name] = field.value;
    });
    resetError();
    AjaxController('soloDriverUpdateToFleet', data, dashUrl, 'doneUpdateToFleet', doneUpdateToFleet, true);
}
function doneUpdateToFleet(response) {
    var $form = $('#formUpdateToFleet');
    if (response.code == '000') {
        eraseCookie('new_frontend');
        eraseCookie('token');
        window.location.href = '/dash/carriers/';
    } else {
        $form.append('<span class="error-handler response-message">' + response.message + '</span>');
    }
}
function validateUpdateToFleet($form) {
    resetError();
    var $type = $form.find('input[name="type"]'),
            $usdot = $form.find('input[name="usdot"]'),
            $state = $form.find('select[name="state"]'),
            $city = $form.find('input[name="city"]'),
            $zip = $form.find('input[name="zip"]'),
            $size = $form.find('input[name="size"]'),
            $car_name = $form.find('input[name="car_name"]'),
            $addr = $form.find('input[name="addr"]'),
            $license_number = $form.find('input[name="license_number"]'),
            $license_state = $form.find('select[name="license_state"]'),
            $ein = $form.find('input[name="ein"]');

    if (!/^([3,4,5])$/.test($type.val()))
        setError($type, 'Select valid user type');

    if (!$car_name.val())
        setError($car_name, 'Enter carrier name');
    else if (!/^[A-Za-z0-9-']+( [A-Za-z0-9-']+)*$/.test($car_name.val()))
        setError($car_name, 'Enter only Latin letters');
    else if ($car_name.val().length > 130)
        setError($car_name, 'Max allowed 130 characters');

    if (!$addr.val())
        setError($addr, 'Enter office address');
    else if (!/^[A-Za-z0-9-']+( [A-Za-z0-9-']+)*$/.test($addr.val()))
        setError($addr, 'Enter only Latin letters');
    else if ($addr.val().length > 130)
        setError($addr, 'Max allowed 130 characters');

    if (!$usdot.val())
        setError($usdot, 'Enter USDOT number');
    else if (!/^[0-9]*$/.test($usdot.val()))
        setError($usdot, 'Enter only numbers');

    if (!parseInt($state.val()))
        setError($state, 'Chose state/province');

    if ($zip.val() && !validate.zip($zip.val()))
        setError($zip, 'Enter ZIP');

    if (!$license_number.val())
        setError($license_number, 'Enter driver license number');
    else if (!/^[A-Za-z0-9-*']+( [A-Za-z0-9-*']+)*$/.test($license_number.val()))
        setError($license_number, 'Enter valid driver license number');
    else if ($license_number.val().length > 20)
        setError($license_number, 'Length can\'t be more than 20 characters');

    if (!parseInt($license_state.val()))
        setError($license_state, 'Chose driver license state');

    if (!$city.val())
        setError($city, 'Enter City');
    else if (!/^[A-Za-z-']+( [A-Za-z-']+)*$/.test($city.val()))
        setError($city, 'Enter only Latin letters');
    else if ($city.val().length > 64)
        setError($city, 'Max allowed 64 characters');

    if (isNaN(parseInt($size.val())) || !isFinite($size.val()) || $size.val() === '0')
        setError($size, 'Enter Fleet size');

    if (!$ein.val())
        setError($ein, 'Enter EIN');
    else if (!/^[0-9]\d?-\d{7}$/.test($ein.val()))
        setError($ein, 'Enter valid EIN. Example: "55-5555555", "1-2345678"');

    if (!$form.find('.error').length) {
        return true;
    } else {
        return false;
    }
}

function waiveNotReturnedSolo(userId) {
    showModal('Waive non-returned devices fee', '<p>Chose Action</p>\
            <p><button style="width: 125px;margin-right: 5px;" type="button" class="btn btn-default btn-xs waiveButton"  onclick="waiveNotReturnedSoloConfirm(' + userId + ',0)">Make Active</button><label>(Remove 60 days prorated fee and non-returned fee)</label></p>\
            <p><button style="width: 125px;margin-right: 5px;" type="button" class="btn btn-default btn-xs waiveButton"  onclick="waiveNotReturnedSoloConfirm(' + userId + ',1)">Devices Returned</button><label>(Remove non-returned fee, Charge Restocking Fee)</label></p>\
    ', 'waiveNotReturnedSoloBox')
}
function waiveNotReturnedSoloConfirmHandler(response) {
    $('#waiveNotReturnedSoloBox').remove()
    new managerUserCard(response.data.userId);
}
function waiveNotReturnedSoloConfirm(userId, type) {
    $('.waiveButton').prop('disabled', true)
    AjaxController('waiveNotReturnedSoloConfirm', {userId: userId, type: type}, adminUrl, 'waiveNotReturnedSoloConfirmHandler', changeUserEmailHandler, true);
}


function manualAddDue(userId, carrierId) {
    var content = `<form class="form-horizontal" id="manualAddDueForm">
        <input type="hidden" name="carrier_id" value="${carrierId}">
        <input type="hidden" name="user_id" value="${userId}">
        <div class="form-group">
            <label for="inputAmount" class="col-sm-4 control-label">Amount</label>
            <div class="col-sm-8">
                <input type="text" class="form-control" id="inputAmount" name="amount">
            </div>
        </div>
        <div class="form-group">
            <label for="textareaDescription" class="col-sm-4 control-label">Description</label>
            <div class="col-sm-8">
                <textarea class="form-control" name="description" rows="3" id="textareaDescription" ></textarea>
            </div>
        </div>
        <div class="form-group">
            <label for="switchChargeCard" class="col-sm-4 control-label" title="">Charge card
                <i tabindex="0" class="fa fa-question form-icon-help" onclick="showPopover(this)" data-container="body" data-toggle="popover" data-trigger="focus" data-placement="top" data-content="In the position 'On' the card will be charged."></i>
            </label>
            <div class="col-sm-8">
                <div class="check_buttons_block" id="switchChargeCard">
                    <button type="button" class="btn btn-default" onclick="doActive(this);" data-val="1">On</button>
                    <button type="button" class="btn btn-default active" onclick="doActive(this);" data-val="0">Off</button>
                </div>
            </div>
        </div>
    </form>`;
    showModal('Add Due', content, 'basicModal');
    $('#basicModal .modal-footer').prepend('<button type="button" onclick="addDueAction(\'credit\')" class="btn btn-primary">Credit</button>');
    $('#basicModal .modal-footer').prepend('<button type="button" onclick="addDueAction()" class="btn btn-primary">Charge</button>');
}
function addDueAction(action = '') {
    resetError();
    var $amount = $('#manualAddDueForm input[name="amount"]');
    var $description = $('#manualAddDueForm textarea[name="description"]');
    var amount = parseFloat($amount.val());
    if (amount == '' || isNaN(amount))
        setError($amount, 'Enter amount');
    else if (amount < 0.1)
        setError($amount, 'Minimal allowed amount is 0.1$');
    else if (amount > 999999.99)
        setError($amount, 'Max allowed amount 999999.99$');

    if (!$description.val())
        setError($description, 'Enter description');
    else if ($description.val().length > 250)
        setError($description, 'Max allowed 250 characters');

    if ($('#manualAddDueForm .error').length)
        return false;

    var data = {};
    jQuery.each($('#manualAddDueForm').serializeArray(), function (i, field) {
        data[field.name] = field.value;
    });
    data.amount = action == 'credit' ? data.amount * -1 : data.amount;
    data.chargeCard = $('#switchChargeCard button.active').attr('data-val');
    AjaxController('manualAddDue', data, adminUrl, 'resultAddDueAction', errorBasicHandler, true);
    $('#basicModal').modal('hide').remove();
}
function resultAddDueAction(response) {
    if (response.data == false)
        return false;

    if (response.data.isSoloDriver == false) {
        new managerCarrierCard(response.data.fleetId)
    } else {
        new managerUserCard(response.data.userId)
    }

}

function requestScreenView(userId){
    liveUpdateC.subscribeForDriverEvents(userId);
    AjaxCall({url: apiAdminUrl, action: "requestScreenView", data: {userId:userId}, successHandler: requestScreenViewHandler})
}
function requestScreenViewHandler(response){
    alertMessage($('#manager_user_card .control-buttons'), 'Screen View Request Sent', 3000);
}
function resetUserPasswordHandler(response) {
    $('#reset_password_button').prop('disabled', true);
}
function resetUserPassword(userId) {
    AjaxController('resetUserPassword', {'userId': userId}, adminUrl, 'resetUserPasswordHandler', errorBasicHandler, true);
}
function changeUserEmailHandler(response) {
    if (response.code == '000') {
        setTimeout(function () {
            changeUserEmailCancel();
        }, 3000);
        alertMessage($('#change_user_email_result'), 'Email change request submited', 3000);
    } else {
        alertError($('#change_user_email_result'), response.message, 3000);
    }
}
function changeUserEmail() {
    $('#change_user_email_cancel').show();
    $('#change_user_email_approve').show();
    $('#change_email_field').show();
    $('#change_user_email').hide();
}
function changeUserEmailCancel() {
    $('#change_user_email_cancel').hide();
    $('#change_user_email_approve').hide();
    $('#change_email_field').hide();
    $('#change_user_email').show();
}
function changeUserEmailApprove(userId) {
    AjaxController('changeUserEmail', {'userId': userId, email: $('#change_email_field').val()}, adminUrl, 'changeUserEmailHandler', changeUserEmailHandler, true);
}
function changeUserPhone() {
    $('#change_user_phone_cancel').show();
    $('#change_user_phone_approve').show();
    $('#change_phone_field').show();
    $('#change_user_phone').hide();
}
function changeUserPhoneCancel() {
    $('#change_user_phone_cancel').hide();
    $('#change_user_phone_approve').hide();
    $('#change_phone_field').hide();
    $('#change_user_phone').show();
}
function changeUserPhoneApprove(userId) {
    AjaxController('changeUserPhone', {'userId': userId, phone: $('#change_phone_field').val()}, adminUrl, 'changeUserPhoneHandler', changeUserPhoneHandler, true);
}
function changeUserPhoneHandler(response) {
    if (response.code == '000') {
        setTimeout(function () {
            changeUserPhoneCancel();
        }, 3000);
        alertMessage($('#change_user_phone_result'), 'Phone change request submited', 3000);
    } else {
        alertError($('#change_user_phone_result'), response.message, 3000);
    }
}
function deactivateSafeMode(userId) {
    AjaxController('deactivateSafeMode', {'userId': userId}, adminUrl, 'deactivateSafeHandler', deactivateSafeHandler, true);
}
function deactivateSafeHandler(response) {
    if (response.code == '000') {
        $('#deactivateSafeMode').remove();
    }
}
function forceLogoutHandler() {
    $('#confirmationModal').remove();
}
function forceLogoutConfirmed(userId) {
    AjaxCall({url: apiAdminUrl, action: "forceLogout", data: {userId}, successHandler: forceLogoutHandler})
}
function forceLogoutClick(userId) {
    showModalConfirmation('Confirmation', '<p class="text-center">Are you sure you want to Log out user? <br /><b class="red">He will lose all not synchronized data</b></p>');
    $('#confirmationModal').off('click', '#btnConfirmClick').on('click', '#btnConfirmClick', function () {
        forceLogoutConfirmed(userId);
    });
}
function getParameterString(key, val){
    if(key == 'companyPosition'){
        val = getPositionNameFromId(val);
    }else if(key == 'aobrd' && val == 1){
        key = 'companyPosition'
        val = getPositionNameFromId(TYPE_DRIVER_ELD, 1);
    }else if(key == 'MedCard' || key == 'HireDate' || key == 'PullNotice'
        || key == 'DateOfBirth' || key == 'DLExpiration' || key == 'TerminateDate'){
        val = moment(val, "YYYY-MM-DD").format("MM-DD-YYYY")
    }else if(key == 'medCardRemind' || key == 'driverLicenseRemind' || key == 'canEditTime'){
        val = val+' seconds';
    }else if(key == 'State' || key == 'DLState'){
        val = locationState.getStateNameById(val);
    }
    val = val == 'null' || val == null ? '' : val;
    return key+': '+val+'<br>'
}
function showOneEldLogs(logId){
    AjaxCall({url: apiAdminUrl, action: "showOneEldLogs", data: {logId:logId}, successHandler: showOneEldLogsHandler});
}
function showOneEldLogsHandler(response){
    c(response.data.log);
    var lineBreak = "\n";
    data = response.data.log.logs;
    data = data.split(lineBreak).reverse().join(lineBreak);
    showModal('ELD Log from '+timeFromSQLDateTimeStringToUSAString(response.data.log.dateTime), '<pre style="white-space: pre-wrap;">'+data+'</pre><style>#logsModal .modal-lg{width:99%} #logsModal .modal-backdrop{display:none}</style>', 'logsModal', 'modal-lg');
}
function managerUser_toggleFormBlock (el) {
    if ($(el).find('.fa').hasClass('fa-angle-up')) {
        $(el).find('.fa').removeClass('fa-angle-up').addClass('fa-angle-down');
        $(el).closest('.opts').find('.form-group').slideDown();
        createCookie('ifta_param_' + $(el).closest('.opts').attr('data-type'), 1, 30);
    } else {
        $(el).find('.fa').addClass('fa-angle-up').removeClass('fa-angle-down');
        $(el).closest('.opts').find('.form-group').slideUp();
        eraseCookie('ifta_param_' + $(el).closest('.opts').attr('data-type'));
    }
}
function managerUser_fixDistance (el) {
    let parent = $(el).closest('tr');
    let parentState = parent.find('td[data-stateName]').attr('data-stateName');
    
    let rightDistance = $('#tripWayPointsResults table tbody tr[data-state="'+parentState+'"]').attr('data-distance');
    if (typeof rightDistance == 'undefined') {
        showModal('Message', 'This state is not on the route!', 'errorMessage');
        $(el).remove();
        parent.css('background', 'rgba(244, 67, 54, 0.7)');
        return false;
    }
    
    let data = {
        userId: parent.attr('data-userId'),
        stateId: parent.attr('data-stateId'),
        truckId: parent.attr('data-truckId'),
        date: parent.attr('data-date'),
        rightDistance: rightDistance
    };
    
    AjaxCall({url: apiAdminUrl, action: "fixDistance", data: data, successHandler: managerUser_fixDistanceHandler});
}
function managerUser_fixDistanceHandler (response) {
    c(response);
    
    let result = response.data.result;
    
    let resultTr = $('#runIftaTripResults table tbody tr[data-stateId="'+result.stateId+'"]');
    resultTr.css('background', 'rgba(76, 175, 80, 0.7)');
    resultTr.find('button').remove();
}
function managerUser_fixAllDistance (el) {
    let date = convertDateToSQL($('#tripWayPointsForm .datepicker').val());
    let parent = $(el);
    
    let states = [];
    $('#tripWayPointsResults table tbody tr.state').each(function (key, val) {
        let state = {};
        
        state.name = $(val).attr('data-state');
        state.distance = $(val).attr('data-distance');
        
        states.push(state);
    });
    
    let data = {
        date: date,
        userId: parent.attr('data-userid'),
        states: states
    };
    
    parent.remove();
    
    AjaxCall({url: apiAdminUrl, action: "fixAllDistance", data: data, successHandler: managerUser_fixAllDistanceHandler});
}
function managerUser_fixAllDistanceHandler (response) {
    alert('All data restored. Pls choose next day or run trip again');
}