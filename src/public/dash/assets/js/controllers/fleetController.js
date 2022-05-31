function fleetController() {
    var self = this;
    this.fleetUsers = [];
    this.fleetOwnerOperators = [];
    this.fleetOwnerId = 0;
    this.terminatedUsers = [];
    this.fleetTeams = [];
    this.id = 0;
    this.init = function (fleetUsers = [], fleetOwnerId, fleetId, terminatedUsers = [], multyAccount = false) {
        self.initFletUsers(fleetUsers);
        this.fleetOwnerId = fleetOwnerId;
        this.id = fleetId;
        this.terminatedUsers = terminatedUsers;
        this.multyAccount = multyAccount;
        self.checkCurrentUserFleets();
    }
    this.checkDemoAccess = function(){
        if(self.demoFleet){
            var body = `<div class="form-horizontal ">
                <div class="form-group ">
                    <div class="col-sm-12">
                        <p>This functionality is restricted for Demo accounts.</p>
                    </div>
            </div>`;
            showModal('Demo access', body, 'demoAccess');
        }
        return self.demoFleet;
    }
    this.initFletUsers = function (fleetUsers) {
        self.fleetUsers = [];
        self.fleetOwnerOperators = [];
        $.each(fleetUsers, function (key, user) {
            if (user.ownerOperator == 1) {
                self.fleetOwnerOperators.push(user);
                if (user.companyPosition == 3 || user.companyPosition == 7) {
                    self.fleetUsers.push(user);
                }
            } else {
                self.fleetUsers.push(user);
            }
        });
    }
    this.refreshFleetData = function(){
        AjaxCall({action:'refreshFleetData', url:apiDashUrl, successHandler:self.refreshFleetDataHandler})
    }
    this.refreshFleetDataHandler = function(response){
        this.fleetOwnerId = response.data.fleetOwnerId;
        this.terminatedUsers = response.data.terminatedUsers;
        this.fleetTeams = response.data.fleetTeams;
        self.initFletUsers(response.data.fleetUsers);
    }
    this.setSessionToUserCarrier = function (driverId) {
        if (typeof fleetC.multyAccount != 'object') {
            return 1;
        }
        var driver = self.getUserById(driverId);
        var carrierId = driver.ownerOperator == 1 ? driver.operatorCarrierId : driver.carrierId;
        var multyUserId = 0;
        $.each(this.multyAccount.usersList, function (key, user) {
            if (user.carrierId == carrierId) {
                multyUserId = user;
                return true;
            }
        })
        var sessionId = false;
        $.each(this.multyAccount.sessions, function (key, session) {
            if (multyUserId.id == session.userId) {
                sessionId = session.sessionId;
                return true;
            }
        })
        if (sessionId != false) {
            createCookie('session', sessionId, 30);
        }
    }
    this.setSessionToRealUser = function () {
        $.each(this.multyAccount.sessions, function (key, session) {
            if (this.multyAccount.realId == session.userId) {
                sessionId = session.sessionId;
                return true;
            }
        })
        if (sessionId != false) {
            createCookie('session', sessionId, 30);
        }
    }
    this.getCarrierNameById = function (carrierId) {
        var name = '';
        $.each(this.multyAccount.carriersList, function (key, carrier) {
            if (carrier.id == carrierId) {
                name = carrier.name;
                return true;
            }
        })
        return name;
    }
    this.getCarrierNameByDriverId = function (driverId) {
        var driver = self.getUserById(driverId);
        var carrierId = driver.ownerOperator == 1 ? driver.operatorCarrierId : driver.carrierId;
        var carrierName = self.getCarrierNameById(carrierId);
        return carrierName;
    }
    this.changeAddUserInviteType = function (el) {
        if ($(el).attr('data-val') == 1) {
            $('.password_check').show();
        } else {
            $('.password_check').hide();
        }
        self.createUserTypeChanged();
    }
    this.createUserTypeChanged = function(){
        var type = $('#invite_position').val();
        $('.email_valid_box').hide();
        if(type == 7 && $('#invite_type .active').attr('data-val') == 1){
            $('.email_valid_box').show();
        }
    }
    this.createUser = function (params = {}) {
        if(fleetC.checkDemoAccess()){return false;}
        var body = `<div class="form-horizontal ">
            <div class="form-group ">
                <div class="col-sm-6">
                    <label style="width:100%;" for="invite_type">Invite or create <span class="pull-right"><i tabindex="0" class="fa fa-question form-icon-help" onclick="showPopover(this)" data-container="body" data-toggle="popover" data-trigger="focus" data-placement="bottom" data-content="Chose if you like to invite new user if he already registered on ${PROJECT_TYPE} or create user account that will automatically be added into your current fleet"></i></span></label>
                    <div class="check_buttons_block" id="invite_type" style="width:100%;">
                        <button style="height:34px;" class="btn btn-default" onclick="doActive(this);fleetC.changeAddUserInviteType(this)" data-val="1">Create</button>
                        <button style="height:34px;" class="btn btn-default active" onclick="doActive(this);fleetC.changeAddUserInviteType(this)" data-val="0">Invite</button>
                    </div>
                </div>
                <div class="col-sm-6">
                    <label for="invite_position">Role</label>
                    <select id="invite_position" class="form-control" onchange="fleetC.createUserTypeChanged()">
                        <option  value="7">Driver ELD</option>
                        <option  value="4">Dispatcher</option>
                        <option  value="5">Safety director</option>
                    </select>
                </div>
            </div>
            <div class="form-group ">
                <div class="col-sm-6">
                    <label for="invite_name">First Name</label>
                    <input type="text" placeholder="First Name" id="invite_name" class="form-control" autocomplete="false">
                </div>
                <div class="col-sm-6">
                    <label for="invite_last">Last Name</label>
                    <input type="text" placeholder="Last Name" id="invite_last" class="form-control" autocomplete="false">
                </div>
            </div>
            <div class="form-group ">
                <div class="col-sm-6">
                    <label for="invite_email">Email Address</label>
                    <input type="text" placeholder="Email Address" id="invite_email" class="form-control" autocomplete="false">
                </div>
                <div class="col-sm-6"> 
                    <label for="invite_phone">Phone</label>
                    <input type="text" placeholder="Phone" id="invite_phone" class="form-control" autocomplete="false">
                </div>
            </div>
            <div class="form-group password_check" style="display:none;">
                <div class="col-sm-6">
                    <label for="invite_password">Password</label>
                    <input type="password" placeholder="Password" id="invite_password" name="invite_password" class="form-control" autocomplete="new-password">
                </div>
                <div class="col-sm-6">
                    <label for="invite_password_confirm">Confirm Password</label>
                    <input type="password" placeholder="Confirm Password" id="invite_password_confirm" name="invite_password_confirm" class="form-control" autocomplete="new-password-two">
                </div>
            </div>
            <div class="form-group password_check email_valid_box" style="display:none;">
                <div class="col-sm-6">
                    <label style="width:100%;" for="email_validation">Email Validation <span class="pull-right"><i tabindex="0" class="fa fa-question form-icon-help" onclick="showPopover(this)" data-container="body" data-toggle="popover" data-trigger="focus" data-placement="bottom" data-content="Only for drivers, disable/enable email validation for new user"></i></span></label>
                    <div class="check_buttons_block" id="email_validation" style="width:100%;">
                        <button style="height:34px;" class="btn btn-default" onclick="doActive(this);" data-val="1">Enable</button>
                        <button style="height:34px;" class="btn btn-default active" onclick="doActive(this);" data-val="0">Disable</button>
                    </div>
                </div>
            </div>
            <div id="add_error_box"></div>
        </div>`;

        var footerButtons = '<button class="btn btn-default" onclick="fleetC.inviteNewUser()" id="inviteModalButton">Invite new member</button>';
        if (!adminCanAddUsers) {
            body = `<div class="form-horizontal ">
                <div class="form-group ">
                    <div class="col-sm-12">
                        <p>Your right to add new users was disabled by your fleet owner/administrator</p>
                    </div>
            </div>`;
            footerButtons = '';
        }
        showModal('ADD USER', body, 'adduserModal', 'modal-lg new_form', {footerButtons: footerButtons});
        $('#invite_phone').mask('000 000 0000');
        if(typeof params.name != 'undefined'){
            $('#adduserModal #invite_name').val(params.name)
        }
        if(typeof params.last != 'undefined'){
            $('#adduserModal #invite_last').val(params.last)
        }
        if(typeof params.email != 'undefined'){
            $('#adduserModal #invite_email').val(params.email)
        }
        if(typeof params.phone != 'undefined'){
            $('#adduserModal #invite_phone').val(params.phone)
        }
    }
    this.inviteNewUser = function () {
        var name = $('#invite_name').val().trim();
        var last = $('#invite_last').val().trim();
        var email = $('#invite_email').val();
        var invite_type = $('#invite_type button.active').attr('data-val');
        var password = $('#invite_password').val();
        var confirmPassword = $('#invite_password_confirm').val();
        var no_error = true;
        resetError();
        if (name == "") {
            no_error = setError($('#invite_name'), 'Please enter user Name.');
        } else if (!/^[A-Za-z-']+( [A-Za-z-']+)*$/.test(name)) {
            no_error = setError($('#invite_name'), 'Enter only Latin letters');
        }
        if (last == "") {
            no_error = setError($('#invite_last'), 'Please enter user Last Name.');
        } else if (!/^[A-Za-z-']+( [A-Za-z-']+)*$/.test(last)) {
            no_error = setError($('#invite_last'), 'Enter only Latin letters');
        }
        if (email == "") {
            no_error = setError($('#invite_email'), 'Please enter user Email.');
        } else if (!validateEmail(email)) {
            no_error = setError($('#invite_email'), 'Please enter valid Email.');
        }
        if (invite_type == 1) {
            if (password.length < 5) {
                no_error = setError($('#invite_password'), 'Password length must be more than 5 characters');
            } else if (password.length > 32) {
                no_error = setError($('#invite_password'), 'Max allowed 32 characters');
            } else if (!/^[A-Za-z0-9-_+=.,?!]+$/.test(password)) {
                no_error = setError($('#invite_password'), 'Password must contain only letters and numbers');
            }
            if (password != confirmPassword) {
                no_error = setError($('#invite_password'), 'Passwords not match');
                no_error = setError($('#invite_password_confirm'), 'Passwords not match');
            }
        }
        if (no_error != true) {
            return 1;
        }
        $('#inviteModalButton').prop('disabled', true);
        var position = $('#invite_position').val();
        var phone = $('#invite_phone').val();
        data = {
            name: name,
            last: last,
            email: email,
            position: position,
            invite_type: invite_type,
            password: password,
            phone: phone,
            email_validation: $('#email_validation button.active').attr('data-val')
        };
        AjaxController('inviteUser', data, dashUrl, self.inviteUserHandler, self.inviteUserErrorHandler, true);
    }
    this.inviteUserHandler = function (response) {
        if ($('#invite_type button.active').attr('data-val') == 1) {
            alertMessage($('#add_error_box'), 'New user has being created, please refresh your browser page to clear new driver in fleet dashboard.', 5000)
        } else {
            alertMessage($('#add_error_box'), 'Invitation has been sent.', 5000)
        }
        $('#invite_name').val('');
        $('#invite_last').val('');
        $('#invite_email').val('');
        $('#invite_phone').val('');
        $('#invite_password').val('');
        $('#invite_password_confirm').val('');
        $('#inviteModalButton').prop('disabled', true);
    }
    this.inviteUserErrorHandler = function (response) {
        $('#inviteModalButton').prop('disabled', false);
        alertError($('#add_error_box'), response.message, 5000);
    }
    this.getUserNameById = function (userId) {
        var user = self.getUserById(userId);
        var userName = '';
        if (typeof user.name == 'undefined') {
            user = self.getTerminatedUserById(userId);
            if (typeof user.terminatedName == 'undefined') {
                userName = 'terminated user';
            } else {
                userName = user.terminatedName + ' ' + user.terminatedLast;
            }
        } else {
            userName = user.name + ' ' + user.last;
        }
        return userName;
    }
    this.getUserById = function (userId) {
        return self.fleetUsers.find(userIn => userIn.id == userId) || self.fleetOwnerOperators.find(userIn => userIn.id == userId) || {};
    }
    this.getTerminatedUserById = function (userId) {
        return self.terminatedUsers.find(userIn => userIn.id == userId) || {};
    }
    this.getUserTypeLetterById = function (userId) {
        var user = self.getUserById(userId);
        var letter = 'b';
        if (typeof user.companyPosition == 'undefined') {
            if (userId == curUserId) {
                user.companyPosition = position;
            }
        }
        if (user.ownerOperator == 1) {
            letter = 'o';
        } else if (user.companyPosition == TYPE_SAFETY) {
            letter = 's';
        } else if (user.companyPosition == TYPE_DRIVER) {
            letter = 'x';
        } else if (user.companyPosition == TYPE_DRIVER_ELD && user.aobrd == 1) {
            letter = 'a';
        } else if (user.companyPosition == TYPE_DRIVER_ELD) {
            letter = 'e';
        } else if (user.companyPosition == TYPE_DISPATCHER) {
            letter = 'd';
        } else if (typeof user.companyPosition == 'undefined') {
            letter = 't';
        }

        return letter;
    }
    this.getUserTypeNameById = function (userId) {
        var user = self.getUserById(userId);
        var letter = 'basic';
        if (typeof user.companyPosition == 'undefined') {
            if (userId == curUserId) {
                user.companyPosition = position;
            }
        }
        if (user.ownerOperator == 1) {
            letter = 'Owner Operator';
        } else if (user.companyPosition == TYPE_SAFETY) {
            letter = 'Safety Administrator';
        } else if (user.companyPosition == TYPE_DRIVER) {
            letter = 'Exempt driver';
        } else if (user.companyPosition == TYPE_DRIVER_ELD && user.aobrd == 1) {
            letter = 'AOBRD driver';
        } else if (user.companyPosition == TYPE_DRIVER_ELD) {
            letter = 'ELD driver';
        } else if (user.companyPosition == TYPE_DISPATCHER) {
            letter = 'Dispatcher';
        } else if (typeof user.companyPosition == 'undefined') {
            letter = 'Terminated';
        }

        return letter;
    }
    this.getSmartSafety = function (userId) {
        var user = self.getUserById(userId);
        // console.log(user);
        return user;
    }
    this.getUserThumbById = function (userId) {
        var user = self.getUserById(userId);
        var userThumb = typeof user.thumb == 'undefined' || user.thumb == null || user.thumb == '' ? '/social/assets/img/thumb_blank.png' : EZCHAT_LINK + user.thumb;
        if (typeof user.awsThumb != 'undefined' && user.awsThumb != null && user.awsThumb != '') {
            userThumb = user.awsThumb;
        }
        return userThumb; //typeof user.thumb == 'undefined' ? false : user.thumb;
    }
    this.updateUserData = function (userId) {
        AjaxController('getFleetUserData', {userId: userId}, dashUrl, self.getFleetUserDataHandler, self.getFleetUserDataHandler, true);
    }
    this.getFleetUserDataHandler = function (response) {
        var userData = response.data.userData;
        var userId = response.data.userId;
        liveUpdateC.liveUpdateUserData(userId, userData)
        if (typeof userData.id == 'undefined') {
            self.fleetUsers = $.grep(self.fleetUsers, function (userIn, key) {
                if (userIn.id == userId) {
                    return false;
                }
                return true;
            })
            self.fleetOwnerOperators = $.grep(self.fleetOwnerOperators, function (userIn, key) {
                if (userIn.id == userId) {
                    return false;
                }
                return true;
            })
        } else {
            var updated = false;
            $.each(self.fleetUsers, function (key, userIn) {
                if (userIn.id == userData.id) {
                    self.fleetUsers[key] = userData;
                    updated = true;
                    return true;
                }
            })
            if (!updated) {
                if (userData.ownerOperator == 1) {
                    self.fleetOwnerOperators.push(userData)
                } else {
                    self.fleetUsers.push(userData)
                }
            }
        }

    }
    this.changeFleetDashboardHandler = function () {
        window.location.href = getCookie('multyaccount') == 1 ? '/dash/' : window.location.href;
    }
    this.changeFleetDashboard = function (userId) {
        AjaxController('changeFleetDashboard', {userId: userId}, apiDashUrl, self.changeFleetDashboardHandler, self.changeFleetDashboardHandler, true);
    }
    this.addFleetToList = function (fleet) {
        /*if ($('#user_tabs #soc_button').length > 0) {
            $('#user_tabs #soc_button').after('<button class="main_ft_button fleet_dash" onclick="fleetC.changeFleetDashboard(' + fleet.userId + ')">' + fleet.carrierName + ' Dashboard</button>')
        } else {
            $('#user_tabs #dash_button').after('<button class="main_ft_button fleet_dash" onclick="fleetC.changeFleetDashboard(' + fleet.userId + ')">' + fleet.carrierName + ' Dashboard</button>')
        }*/
        $('body > header > div.dashboard-content__header-menu > div.dashboard-content__header-menu_user-settings-dropdown.mobile-hiden > div.dashboard-content__header-menu_hidden-container > ul > li:last-child').before('<li><a class="menu-link" onclick="fleetC.changeFleetDashboard(' + fleet.userId + ');">' + fleet.carrierName + ' Dashboard</a></li>');
    }
    this.checkCurrentUserFleetsHandler = function (response) {
        var fleets = response.data.list;
        var multyAcc = false;
        $.each(fleets, function (key, fleet) {
            if ((getCookie('multyaccount') == 1) || (fleet.userId != curUserId && fleet.status == "Joined")) {
                multyAcc = true;
                self.addFleetToList(fleet)
            }
        })
        if (multyAcc) {
            if (getCookie('multyaccount') != 1) {
                /*if ($('#user_tabs #soc_button').length > 0) {
                    $('#user_tabs #soc_button').before('<button class="main_ft_button fleet_dash" onclick="fleetC.changeFleetDashboard(-1)">Multyaccount Dashboard</button>')
                } else {
                    $('#user_tabs #sign_out').before('<button class="main_ft_button fleet_dash" onclick="fleetC.changeFleetDashboard(-1)">Multyaccount Dashboard</button>')
                }*/
                $('body > header > div.dashboard-content__header-menu > div.dashboard-content__header-menu_user-settings-dropdown.mobile-hiden > div.dashboard-content__header-menu_hidden-container > ul').prepend('<li><a class="menu-link" onclick="fleetC.changeFleetDashboard(-1);">Multi-Account</a></li>');
            }
        }
    }
    this.checkCurrentUserFleets = function () {
        if (position != TYPE_SAFETY) {
            return false;
        }
        AjaxController('checkCurrentUserFleets', {}, apiDashUrl, self.checkCurrentUserFleetsHandler, self.checkCurrentUserFleetsHandler, true);
    }
    this.pdfUserList = function () {
        var params = {};
        params.carrierId = self.id;
        pdfGen.generateAndSendForm(params, {'action': 'fleetUsers'});
    }
}
fleetC = new fleetController(); 