self.smartSafety = 0;

function fleetUserCard(userId) {
    var self = this;
    self.userId = userId;
    self.cntrlUrl = apiDashUrl;
    self.modalElement = '';
    self.tableId = 'userCard_' + userId;
    modalCore(self);

    self.modalId = 'user_info_box';
    self.modalTitle = 'USER INFO';
    self.paginator = false; 
    self.tabs = [];
    self.forceSearchParams = [{key: 'userId', val: userId}];

    self.initRequest = function () {
        AjaxController('getFleetUserCardInit', {userId: userId}, self.cntrlUrl, self.init, self.init, true);
    }
    self.init = function (response) {
        self.user = response.data.user;
        self.smartSafety = response.data.user.SmartSafety;
        self.terminated = self.user.terminated;
        self.generateHeaders();
        self.generateButtons();
        self.createModal();
        
        if (isDriver(self.user.companyPosition) && inFleet == 1 && ((position != TYPE_DRIVER && position != TYPE_DRIVER_ELD) || (userRole == 1 && getCookie("dashboard") != 'driver')) && !self.user.ownerOperator) {
            self.modalElement.find('.modal-footer').append('<div class="check_buttons_block modal_switcher blockForDispatcher">\
					<button class="btn btn-default" onclick="doActive(this)" data-val="0">Driver Settings</button>\
					<button class="btn btn-default active" onclick="doActive(this)" data-val="1">User Info</button>\
				</div>');
            self.modalElement.find('.modal_switcher button').click(self.modalSwitchView);
        }
        self.modalElement.find('.inviteTermiatedUser').click(self.inviteTermiatedUserClick);
        self.modalElement.find('.forceScannerUpdate').click(self.forceScannerUpdate);
        checkButtonInit('adminCanEdit', self.user.dashParams.editAdminSettings == 1);
        checkButtonInit('adminCanAddUsers', self.user.dashParams.adminCanAddUsers == 1);
        if (self.user.companyPosition == TYPE_DISPATCHER) {
            checkButtonInit('showLogbook', self.user.userSettings.showLogbook == 1);
        }
        checkButtonInit('adminCanAddUsers', self.user.dashParams.adminCanAddUsers == 1);
        if (self.user.companyPosition == TYPE_DRIVER_ELD && inFleet == 1 && safeMode == 0) {
            if ((getCookie('showScoreCard') == 1 || getCookie('showScoreCard') == '') && !self.user.ownerOperator) {
                self.modalElement.find('.modal_card_table > .row.row-flex').attr('width', 'calc(100% - 300px)');
                self.modalElement.find('.modal_card_table').prepend(`<div class="score_box" >
                    <span class="score_period">Loading...</span>
                    <div class="overall_box">
                        <div class="overall_score_box">
                            <span class="overall_score">0</span>
                        </div>
                        <label class="overall_label">OVERALL SCORE</label>
                    </div>
                    <div class="driver_score_box">
                        <label class="driver_label">SCORE</label>
                        <span class="driver_score">0</span>
                    </div>
                    <div class="score_list">
                        <div class="score_list_item good_score">
                            <span class="score_list_item_score hardA">0</span>
                            <span class="score_list_item_label">Hard Accelerations</span>
                        </div>
                        <div class="score_list_item good_score">
                            <span class="score_list_item_score hardB">0</span>
                            <span class="score_list_item_label">Harsh Breakes</span>
                        </div>
                        <div class="score_list_item good_score">
                            <span class="score_list_item_score totalMiles">0</span>
                            <span class="score_list_item_label">Total Miles</span>
                        </div>
                    </div>
                </div>`);
                new Chartist.Pie('.modal_card_table .score_box .driver_score_box', {
                    series: [{value: 0, className: 'score_filled'}, {value: 80, className: 'score_empty'}, {value: 20, className: 'score_white'}]
                }, {
                    donut: true,
                    donutWidth: 7,
                    donutSolid: true,
                    startAngle: 215,
                    showLabel: false
                });

                new Chartist.Pie('.modal_card_table .score_box .overall_score_box', {
                    series: [{value: 0, className: 'score_filled'}, {value: 80, className: 'score_empty'}, {value: 20, className: 'score_white'}]
                }, {
                    donut: true,
                    donutWidth: 6,
                    donutSolid: true,
                    startAngle: 215,
                    showLabel: false
                });
                self.initResize();
                self.initScore();
            }
        }
    }
    self.initScore = function () {
        AjaxController('getDriverWeekScore', {userId: self.user.id}, apiDashUrl, self.initScoreHandler, self.initScoreHandler, true);
    }
    self.initScoreHandler = function (response) {
        self.score = response.data.score;
        self.modalElement.find('.overall_score').text(Math.round(self.score.overAllScore));
        self.modalElement.find('.driver_score').text(Math.round(self.score.score));
        self.modalElement.find('.hardA').text(Math.round(self.score.hardA));
        if (parseInt(self.score.hardA) > 10) {
            self.modalElement.find('.hardA').parent().removeClass('good_score');
        }
        self.modalElement.find('.hardB').text(Math.round(self.score.hardB));
        if (parseInt(self.score.hardB) > 10) {
            self.modalElement.find('.hardB').parent().removeClass('good_score');
        }
        self.modalElement.find('.totalMiles').text(Math.round(self.score.totalMiles));
        if (parseInt(self.score.totalMiles) == 0) {
            self.modalElement.find('.totalMiles').parent().removeClass('good_score');
        } else if (parseInt(self.score.totalMiles) > 9999) {
            self.modalElement.find('.totalMiles').parent().css('width', '48px');
        }
        self.modalElement.find('.score_period').text('Last 7 days');
        var driverScorePartsFilled = parseInt(self.score.score / 100 * 80);
        var driverScorePartEmpty = 80 - driverScorePartsFilled;
        var overallScorePartsFilled = parseInt(self.score.overAllScore / 100 * 80);
        var overallScorePartEmpty = 80 - overallScorePartsFilled;
        new Chartist.Pie('.modal_card_table .score_box .driver_score_box', {
            series: [{value: driverScorePartsFilled, className: 'score_filled'}, {value: driverScorePartEmpty, className: 'score_empty'}, {value: 20, className: 'score_white'}]
        }, {
            donut: true,
            donutWidth: 7,
            donutSolid: true,
            startAngle: 215,
            showLabel: false
        });
        new Chartist.Pie('.modal_card_table .score_box .overall_score_box', {
            series: [{value: overallScorePartsFilled, className: 'score_filled'}, {value: overallScorePartEmpty, className: 'score_empty'}, {value: 20, className: 'score_white'}]
        }, {
            donut: true,
            donutWidth: 6,
            donutSolid: true,
            startAngle: 215,
            showLabel: false
        });
    }
    self.resizeScoreElement = function () {
        self.modalElement.find('.modal_card_table .score_box').height(self.modalElement.find('.modal_card_table > .row.row-flex').height());
    }
    self.initResize = function () {
        self.resizeScoreElement();
        $(window).resize(function () {
            self.resizeScoreElement();
        });
    }
    self.inviteTermiatedUserClick = function () {
        fleetC.createUser({name: self.user.name, last: self.user.last, email: self.user.email, phone: self.user.phone});
    }
    self.generateButtons = function () {
        var buttons = [];
        buttons.push('<div id="driverInfoMessages"></div>');
        var canEdit = 0;
        var userScanner = self.user?.lastScannerStatus?.BLEAddress;
        if (fleetC.id == self.user.carrierId && (self.user.companyPosition == TYPE_DRIVER || self.user.companyPosition == TYPE_DRIVER_ELD)) {
            canEdit = 1;
        }

        if (typeof userScanner !== 'undefined' && userScanner && userScanner.indexOf('WQ') + 1) {
            buttons.push('<button id="driverLocation" class="btn btn-default" data-scanner="'+ userScanner.slice(3) +'" onclick="driverLocation()">Share driver location</button>');
        }

        if(self.smartSafety == 1){
            buttons.push('<button id="downloadOutputFile" class="btn btn-default" onclick="downloadOutputFile()">Download Output File</button>');
        }
        if (!self.terminated && !self.user.ownerOperator && (fleetC.fleetOwnerId == curUserId || curUserId == self.user.id || (canEdit == 1 && userRole == 1 && self.user.role != 1 && !self.user.fleet.isOwner))) {
            buttons.push('<button id="requestAccount" class="btn btn-default" onclick="requestScreenViewForSafety(' + self.userId + ')">Request screen view</button>');
            buttons.push('<button id="editAccount" class="btn btn-default" onclick="editAccountBox(1218)">Edit Account</button>');

        } else if (self.terminated && userRole == 1) {
            buttons.push('<button id="editAccount" class="btn btn-default inviteTermiatedUser">Invite Driver</button>');
        }

        self.setCardActionsButtons(buttons);

        self.tabs.push({
            label: 'Login Events',
            cl: 'loginEvents',
            request: 'getUserCardLoginEventsPagination',
            handler: 'getUserCardLoginEventsPaginationHandler',
            tableHeader: `<tr>
                <th>Date Time</th>
                <th>Platform</th>
                <th>App Version</th>
                <th>Phone Version</th>
            </tr>`
        });
        if (isDriver(self.user.companyPosition)) {
            self.tabs.push({
                label: 'Connect Events',
                cl: 'connectEvents',
                request: 'getUserCardConnectEventsPagination',
                handler: 'getUserCardConnectEventsPaginationHandler',
                tableHeader: `<tr>
                    <th>Date Time(Driver Time Zone)</th>
                    <th>Device Id</th>
                    <th>Version</th>
                    <th>Status</th>
                </tr>`
            });
            self.tabs.push({
                label: 'Inspection Reports',
                cl: 'inspectionReports',
                request: 'getUserCardInspectionPagination',
                handler: 'getUserCardInspectionPaginationHandler',
                tableHeader: `<tr>
                    <th>Type</th>
                    <th>Email/Comment</th>
                    <th>Date</th>
                    <th>Response</th>
                </tr>`
            });
        }
        self.setCardTabs(self.tabs);
    }
    self.getUserCardLoginEventsPaginationHandler = function (response) {
        var tbody = '';
        response.data.result.forEach((item) =>
        {
            var appVersion = item.appVersion == 'null' || item.appVersion == null ? 'Unknown, Not Latest' : item.appVersion;
            var phoneVersion = item.phoneVersion == 'null' || item.phoneVersion == null ? 'Unknown' : item.phoneVersion;

            var platform = 'web';
            if (item.phoneType == 1) {
                var platform = 'android';
            } else if (item.phoneType == 0) {
                var platform = 'ios';
            }
            tbody += `<tr>
                <td>${timeFromSecToUSAString(item.dateTime)}</td>
                <td><div class="login_event ${platform}"></div></td>
                <td>${appVersion}</td>
                <td>${phoneVersion}</td>
            </tr>`;
        });
        self.modalElement.find('#' + self.tableId).find('tbody').html(tbody);
    }
    self.getUserCardInspectionPaginationHandler = function (response) {
        var tbody = '';
        response.data.result.forEach((item) => {
            if (item.type == 1) {
                var reponse = item.response.replace(/\\"/g, '"');
                reponse = reponse.replace(/\\"/g, '"');
                reponse = reponse.replace(/\\\\/g, '');
                reponse = reponse.replace(/\\"/g, '"');
                reponse = reponse.replace(/\\/g, '\\');
                reponse = reponse.replace(/\//g, '/');
                reponse = safelyParseJSON(reponse);
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
    self.getUserCardConnectEventsPaginationHandler = function (response) {
        self.modalElement.find('#' + self.tableId).find('tbody').empty();
        var tbody = '';
        response.data.result.forEach((item) => {
            var sts = '<span class="driver-scanner-icon ' + (item.type == 0 ? 'eld' : 'aobrd') + (item.statusTypeId == 0 ? ' grey' : ' green') + '"></span>';
            var deviceId = item.localId == null ? '' : item.localId;
            tbody += `<tr>
                <td>${moment(item.dateTime, 'YYYY-MM-DD hh:mm:ss').format('MM-DD-YYYY hh:mm:ss A')}</td>
                <td>${deviceId}</td>
                <td>${item.version == 0 ? 'No info' : item.version}</td>
                <td>${sts}</td>
            </tr>`;
        });
        self.modalElement.find('#' + self.tableId).find('tbody').html(tbody);
    }
    self.generateHeaders = function () {
        var headers = [];
        headers.push({label: 'Name', value: self.user.name});
        if (isDriver(self.user.companyPosition)) {
            var curStatus = getStatusFromId(self.user.currentStatus.status);
            var curSt = `<div class="inner_status_color ${curStatus}">${curStatus}</div>`;
            var lastStTime = convertDateToUSA(self.user.currentStatus.dateTime, true, true);
            if (self.terminated) {
                curSt = `N/A`;
                lastStTime = 'N/A';
            }
            headers.push({label: 'Current Status', value: curSt, id: 'curDrStatus'});
            headers.push({label: 'Last Name', value: self.user.last});
            headers.push({label: 'Last Status Time', value: lastStTime, id: 'curDrStatusTime'});
            headers.push({label: 'Phone', value: self.user.phone});
            var truckName = '';
            if (typeof self.user.truck != 'undefined' && typeof self.user.truck.Name != 'undefined') {
                truckName = self.user.truck.Name;
            }
            headers.push({label: 'Active Truck', value: truckName, id: 'curDrTruck'});
            headers.push({label: 'Email', value: self.user.email});

            var trailersNames = '';
            if (typeof self.user.trailers != 'undefined') {
                trailersNames = self.user.trailers.map(a => a.Name).join(', ');
            }
            headers.push({label: 'Active Trailers', value: trailersNames, id: 'curDrTrailers'});
            var positionName = getPositionNameFromId(self.user.companyPosition, self.user.aobrd, self.user.role);
            if (self.terminated) {
                positionName = 'Terminated Driver';
            }
            if (self.user.ownerOperator) {
                positionName += '(Owner Operator)';
            }
            headers.push({label: 'Position', value: positionName});


            var deviceLocalId = '';
            if (!self.terminated && typeof self.user.lastScannerStatus != 'undefined' && self.user.lastScannerStatus.localId != null && self.user.lastScannerStatus.statusTypeId != 0) {
                var deviceTopVersion = '';
                var updateButton = '<button class="btn btn-default btn-xs forceScannerUpdate blockForDispatcher">Force Update</button>';
                if (!DEV_ENV)
                    updateButton = '';
                if (parseInt(self.user.lastScannerStatus.updateVersion) > 0 && parseInt(self.user.lastScannerStatus.version) != parseInt(self.user.lastScannerStatus.updateVersion)) {
                    deviceTopVersion = '<span title="device need update" class="red">, Need Update to ' + parseInt(self.user.lastScannerStatus.updateVersion) + ' ' + updateButton + '</span>';
                } else if (parseInt(self.user.lastScannerStatus.updateVersion) == 0 && parseInt(self.user.lastScannerStatus.version) != parseInt(self.user.lastScannerStatus.STABLE_DEVICE_VERSION)) {
                    deviceTopVersion = '<span title="device need update" class="red">, Need Update to ' + parseInt(self.user.lastScannerStatus.STABLE_DEVICE_VERSION) + ' ' + updateButton + '</span>';
                }
                deviceLocalId = self.user.lastScannerStatus.localId + '(version ' + self.user.lastScannerStatus.version + '' + deviceTopVersion + ')';
                
            }
            headers.push({label: 'Connected Device', value: deviceLocalId, id: 'curDrConDevice'});
            if (isDriver(self.user.companyPosition)) {
                headers.push({label: 'Cycle', value: self.user.cycle.name});
                headers.push({label: 'Time Zone', value: self.user.timeZone.name});
            }
            var canEdit = 0;
            if (fleetC.id == self.user.carrierId && (self.user.companyPosition == TYPE_DRIVER || self.user.companyPosition == TYPE_DRIVER_ELD)) {
                canEdit = 1;
            }
        } else {
            var positionName = getPositionNameFromId(self.user.companyPosition, self.user.aobrd, self.user.role);
            headers.push({label: 'Last Name', value: self.user.last});
            headers.push({label: 'Phone', value: self.user.phone});
            headers.push({label: 'Email', value: self.user.email});
            headers.push({label: 'Position', value: positionName});
        }
        if (fleetC.fleetOwnerId == curUserId && curUserId != self.user.id && self.user.companyPosition == TYPE_DISPATCHER) {
            headers.push({label: 'Show Logbook', value: '<div class="check_buttons_block" style="width:150px;" id="showLogbook">\n\
                <button class="btn btn-default" onclick="doActive(this);saveAccountAdminSettings(this)" data-val="1">On</button>\n\
                <button class="btn btn-default active" onclick="doActive(this);saveAccountAdminSettings(this)" data-val="0">Off</button>\n\
            </div>'});
        }
        if (fleetC.fleetOwnerId == curUserId && curUserId != self.user.id && (self.user.role == 1)) {
            headers.push({label: 'Edit Logbook', value: '<div class="check_buttons_block" style="width:150px;" id="adminCanEdit">\n\
                <button class="btn btn-default" onclick="doActive(this);saveAccountAdminSettings(this)" data-val="1">On</button>\n\
                <button class="btn btn-default active" onclick="doActive(this);saveAccountAdminSettings(this)" data-val="0">Off</button>\n\
            </div>'});
            headers.push({label: 'Add Users', value: '<div class="check_buttons_block" style="width:150px;" id="adminCanAddUsers">\n\
                <button class="btn btn-default" onclick="doActive(this);saveAccountAdminSettings(this)" data-val="1">On</button>\n\
                <button class="btn btn-default active" onclick="doActive(this);saveAccountAdminSettings(this)" data-val="0">Off</button>\n\
            </div>'});
        } else {
            headers.push({label: '', value: ''});
        }

        self.setCardHeaders(headers);

    }
    self.forceScannerUpdate = function () {
        $('.forceScannerUpdate').attr('disabled', true);
        AjaxCall({url: apiDashUrl, action: "forceScannerUpdate", data: {userId: self.user.id, scannerId: self.user.lastScannerStatus.deviceId}, successHandler: self.forceScannerUpdateHandler});
    }
    self.forceScannerUpdateHandler = function () {
        $('.forceScannerUpdate').attr('disabled', true);
        showModal('Force Device Update', 'Driver application will be forced to update ELD/AOBRD device version as soon as driver connect to the device.', '', 'modal-sm');
    }
    self.modalSwitchView = function () {
        if ($(this).attr('data-val') == 0) {
            self.showDriverCardView();
        } else {
            self.returnToInitState();
        }
    }
    self.returnToInitState = function () {
        self.modalElement.find('.dropDownTabs, .modal-footer .cardPaginator.pg_pagin, .popup_box_body, .control-buttons, .tableTabButtonsBox').show();
        self.modalElement.find('.switch_body').remove();
        self.modalElement.find('.save_edit, .update_result').remove();
    }
    self.showDriverCardView = function () {
        self.modalElement.find('.switch_body').remove();
        self.modalElement.find('.save_edit, .update_result').remove();
        self.modalElement.find('.dropDownTabs, .modal-footer .cardPaginator.pg_pagin, .popup_box_body, .control-buttons, .tableTabButtonsBox').hide();
        var socialBlock = '';
        if (PROJECT_TYPE == 'EZLOGZ') {
            socialBlock = `<div class="box_row_info half">
                    <label>Hide Social platform <span class="pull-right"><i tabindex="0" class="fa fa-question form-icon-help" onclick="showPopover(this)" data-container="body" data-toggle="popover" data-trigger="focus" data-placement="top" data-content="In the position 'On' on driver application Ezlogz social platform will be disabled."></i></span></label>
                    <div class="check_buttons_block" id="hideSocial">
                        <button class="btn btn-default" onclick="doActive(this)" data-val="1">On</button>
                        <button class="btn btn-default " onclick="doActive(this)" data-val="0">Off</button>
                    </div>
                </div>`;
        }
        var smartSafetyOnActiveClass = self.smartSafety == 1 ? 'active' : '';
        var smartSafetyOffActiveClass = self.smartSafety == 0 ? 'active' : '';
        self.modalElement.find('.modal-body').append(`<div class="driver_settings_list switch_body">
            <div class="info_box" >
                <input type="hidden" id="dr_id"/>
                <h2>General</h2>
                <div class="box_row_info">
                    <label>First Name</label>
                    <input value="" id="dr_name" class="ez_input" type="text"/>
                </div>
                <div class="box_row_info">
                    <label>Last Name</label>
                    <input value="" id="dr_last" class="ez_input" type="text"/>
                </div>
                <div class="box_row_info">
                    <label>Account Phone</label>
                    <input value="" id="dr_phone" data-mask="000 000 0000"  class="ez_input" type="text"/>
                </div>
                <div class="box_row_info">
                    <label>SSN</label>
                    <input value="" id="dr_ssn" class="ez_input" type="text"/>
                </div>
                <div class="box_row_info">
                    <label>EIN</label>
                    <input value="" id="dr_ein" class="ez_input" type="text"/>
                </div>
                <div class="box_row_info">
                    <label>Team Driver</label>
                    <select id="dr_team_driver" class="ez_input" onchange="changeTeamDriver()"><option value="0">No team Driver</option></select>
                </div>
                <div class="box_row_info">
                    <label>Scanner Type</label>
                    <div class="check_buttons_block" id="scanner_type">
                        <button class="btn btn-default " onclick="doActive(this);" data-val="0">Ez-Simple</button>
                        <button class="btn btn-default" onclick="doActive(this);" data-val="1">Ez-Smart</button>
                        <!--<button class="btn btn-default" onclick="doActive(this);" data-val="2">Ez-Hard-wire</button>with_aobrd-->
                    </div>
                </div>
                ${self.user.cycle.id == 4 || self.user.cycle.id == 5 || self.user.cycle.id == 8 ?
                `<div class="box_row_info half ">
                    <label>Driver Type</label>
                    <div class="check_buttons_block with_aobrd" id="dr_eld_new">
                        <button class="btn btn-default " onclick="doActive(this);changeEldDriver()" data-val="0">Exempt</button>
                        <button class="btn btn-default" onclick="doActive(this);changeEldDriver()" data-val="1">ELD</button>
                        <button class="btn btn-default" onclick="doActive(this);changeEldDriver()" data-val="2">AOBRD</button>
                    </div>
                </div>` : 
                `<div class="box_row_info half ">
                    <label>Driver Type</label>
                    <div class="check_buttons_block" id="dr_eld_new">
                        <button class="btn btn-default " onclick="doActive(this);changeEldDriver()" data-val="0">Exempt</button>
                        <button class="btn btn-default" onclick="doActive(this);changeEldDriver()" data-val="1">ELD</button>
                </div>
                </div>`
                }
                <div class="box_row_info half ">
                    <label>Driver Notate & Correction <span class="pull-right"><i tabindex="0" class="fa fa-question form-icon-help" onclick="showPopover(this)" data-container="body" data-toggle="popover" data-trigger="focus" data-placement="top" data-content="In position 'on' driver can correct all his logbook statuses"></i></span></label>
                    <div class="check_buttons_block" id="aobrdAbleToEdit">
                        <button class="btn btn-default " onclick="doAobrdAbleToEdit(this)" data-val="1">On</button>
                        <button class="btn btn-default" onclick="doAobrdNotAbleToEdit(this)" data-val="0">Off</button>
                    </div>
                </div>
                <div class="box_row_info half ">
                    <label>Notate & Correct OFF,SLP,ON <span class="pull-right"><i tabindex="0" class="fa fa-question form-icon-help" onclick="showPopover(this)" data-container="body" data-toggle="popover" data-trigger="focus" data-placement="top" data-content="In position 'on' driver can correct his on duty, off duty and sleeping berth logbook statuses"></i></span></label>
                    <div class="check_buttons_block" id="ableEditOnOffSB">
                        <button class="btn btn-default " onclick="doActive(this)" data-val="1">On</button>
                        <button class="btn btn-default" onclick="doActive(this)" data-val="0">Off</button>
                    </div>
                </div>
                <div class="box_row_info ">
                    <label>AOBRD Edit Time <span class="pull-right"><i tabindex="0" class="fa fa-question form-icon-help" onclick="showPopover(this)" data-container="body" data-toggle="popover" data-trigger="focus" data-placement="top" data-content="YOu can specify for how long driver will have full logbook correct setting on"></i></span></label>
                        <div class="range-field ez_range_field_valuelist" id="canEditTime">
                        <input value="0" type="range" name="canEditTime" data-valuelist='[{"v":"900", "l":"15min"}, {"v":"1800", "l":"30min"}, {"v":"3600", "l":"1h"}, {"v":"7200", "l":"2h"}, {"v":"10800", "l":"3h"}, {"v":"21600", "l":"6h"}, {"v":"28800", "l":"8h"}, {"v":"43200", "l":"12h"}, {"v":"86400", "l":"24h"}, {"v":"0", "l":"always"}]' />
                    </div>
                </div>
                <div class="box_row_info half ">
                    <label>AOBRD Manual Drive <span class="pull-right"><i tabindex="0" class="fa fa-question form-icon-help" onclick="showPopover(this)" data-container="body" data-toggle="popover" data-trigger="focus" data-placement="top" data-content="Only for an emergency situation. In the position ‘on’ driver can select drive mode if the scanner fails to connect. "></i></span></label>
                    <div class="check_buttons_block" id="aobrdManualDrive">
                        <button class="btn btn-default " onclick="doActive(this)" data-val="1">On</button>
                        <button class="btn btn-default" onclick="doActive(this)" data-val="0">Off</button>
                    </div>
                </div>
                <div class="box_row_info half ">
                    <label>IFTA/NON IFTA <span class="pull-right"><i tabindex="0" class="fa fa-question form-icon-help" onclick="showPopover(this)" data-container="body" data-toggle="popover" data-trigger="focus" data-placement="top" data-content="In the position ‘on’ driver miles will be saved with states information and used in IFTA report."></i></span></label>
                    <div class="check_buttons_block" id="iftaDistances" data-prev_val="1">
                        <button type="button" class="btn btn-default " onclick="doAobrIFTA(this)" data-val="1" style="font-size:10px;">IFTA</button>
                        <button type="button" class="btn btn-default" onclick="doAobrNonIFTA(this)" data-val="0" style="font-size:10px;">NON IFTA</button>
                    </div>
                </div>
                <div class="box_row_info half ">
                    <label>Hide Engine and Scanner statuses <span class="pull-right"><i tabindex="0" class="fa fa-question form-icon-help" onclick="showPopover(this)" data-container="body" data-toggle="popover" data-trigger="focus" data-placement="top" data-content="In the ‘on’ position driver will not see his engine and scanner statuses on driver application"></i></span></label>
                    <div class="check_buttons_block" id="hideEngineStatuses">
                        <button class="btn btn-default " onclick="doActive(this)" data-val="1">On</button>
                        <button class="btn btn-default" onclick="doActive(this)" data-val="0">Off</button>
                    </div>
                </div>
                <div class="yard_conv_cont ">
                    <div class="box_row_info half ">
                        <label>Yard Mode <span class="pull-right"><i tabindex="0" class="fa fa-question form-icon-help" onclick="showPopover(this)" data-container="body" data-toggle="popover" data-trigger="focus" data-placement="top" data-content="The ‘on’ position allows driver to move position in the yard without effecting drive time"></i></span></label>
                        <div class="check_buttons_block" id="dr_yardMode">
                            <button class="btn btn-default " onclick="doActive(this)" data-val="1">On</button>
                            <button class="btn btn-default" onclick="doActive(this)" data-val="0">Off</button>
                        </div>
                    </div>
                    <div class="box_row_info half ">
                        <label>Conveyance Mode <span class="pull-right"><i tabindex="0" class="fa fa-question form-icon-help" onclick="showPopover(this)" data-container="body" data-toggle="popover" data-trigger="focus" data-placement="top" data-content="In the position ‘on’ driver can enable conveyance mode."></i></span></label>
                        <div class="check_buttons_block" id="dr_conveyanceMode">
                            <button class="btn btn-default " onclick="doActive(this)" data-val="1">On</button>
                            <button class="btn btn-default" onclick="doActive(this)" data-val="0">Off</button>
                        </div>
                    </div>
                </div>
                <div class="box_row_info half ">
                    <label>Personal Cycle <span class="pull-right"><i tabindex="0" class="fa fa-question form-icon-help" onclick="showPopover(this)" data-container="body" data-toggle="popover" data-trigger="focus" data-placement="top" data-content="In the position ‘on’ allows driver to change their cycle mode for compliance with other countries HOS/regulations"></i></span></label>
                    <div class="check_buttons_block" id="dr_personalCycle">
                        <button class="btn btn-default " onclick="doActive(this)" data-val="1">On</button>
                        <button class="btn btn-default" onclick="doActive(this)" data-val="0">Off</button>
                    </div>
                </div>
                <div class="box_row_info half">
                    <label>Personal Time Zone <span class="pull-right"><i tabindex="0" class="fa fa-question form-icon-help" onclick="showPopover(this)" data-container="body" data-toggle="popover" data-trigger="focus" data-placement="top" data-content="In the position ‘on’ driver can select which timezone they want to be in. In the ‘off’ position, drivers timezone will be set to fleets timezone."></i></span></label>
                    <div class="check_buttons_block" id="dr_personalTZ">
                        <button class="btn btn-default " onclick="doActive(this)" data-val="1">On</button>
                        <button class="btn btn-default" onclick="doActive(this)" data-val="0">Off</button>
                    </div>
                </div>
                <div class="box_row_info half">
                    <label>Odometer <span class="pull-right"><i tabindex="0" class="fa fa-question form-icon-help" onclick="showPopover(this)" data-container="body" data-toggle="popover" data-trigger="focus" data-placement="top" data-content="Select driver odometer measured in miles or kilometers."></i></span></label>
                    <div class="check_buttons_block" id="dr_odometerId">
                        <button class="btn btn-default " onclick="doActive(this)" data-val="0">Miles</button>
                        <button class="btn btn-default" onclick="doActive(this)" data-val="1">Km</button>
                    </div>
                </div>
                <div class="box_row_info half">
                    <label>Paper DVIR <span class="pull-right"><i tabindex="0" class="fa fa-question form-icon-help" onclick="showPopover(this)" data-container="body" data-toggle="popover" data-trigger="focus" data-placement="top" data-content="In the position 'On' driver wont be marked as in violation if no DVIR included in driver days logs."></i></span></label>
                    <div class="check_buttons_block" id="paperDvir">
                        <button class="btn btn-default" onclick="doActive(this)" data-val="1">On</button>
                        <button class="btn btn-default " onclick="doActive(this)" data-val="0">Off</button>
                    </div>
                </div>
                <div class="box_row_info half">
                    <label>Driver Validation <span class="pull-right"><i tabindex="0" class="fa fa-question form-icon-help" onclick="showPopover(this)" data-container="body" data-toggle="popover" data-trigger="focus" data-placement="top" data-content="In the position 'On' driver wont be able to go on drive(or connect ELD device) untill he fully closed previous day infromation - signature, dvir, general data."></i></span></label>
                    <div class="check_buttons_block" id="checkYesterdayValidDay">
                        <button class="btn btn-default" onclick="doActive(this)" data-val="1">On</button>
                        <button class="btn btn-default " onclick="doActive(this)" data-val="0">Off</button>
                    </div>
                </div>
                <div class="box_row_info half">
                    <label>Annotation Events<span class="pull-right"><i tabindex="0" class="fa fa-question form-icon-help" onclick="showPopover(this)" data-container="body" data-toggle="popover" data-trigger="focus" data-placement="top" data-content="In the position 'On' on driver application inspection mode will be shown all edit events."></i></span></label>
                    <div class="check_buttons_block" id="showEvents">
                        <button class="btn btn-default" onclick="doActive(this)" data-val="1">On</button>
                        <button class="btn btn-default " onclick="doActive(this)" data-val="0">Off</button>
                    </div>
                </div>
                <div class="box_row_info half">
                    <label>Scanner Events<span class="pull-right"><i tabindex="0" class="fa fa-question form-icon-help" onclick="showPopover(this)" data-container="body" data-toggle="popover" data-trigger="focus" data-placement="top" data-content="In the position 'On' on driver application inspection mode will be shown Scanner connect/disconnect events(required by FMCSA)."></i></span></label>
                    <div class="check_buttons_block" id="showScannerStatuses">
                        <button class="btn btn-default" onclick="doActive(this)" data-val="1">On</button>
                        <button class="btn btn-default " onclick="doActive(this)" data-val="0">Off</button>
                    </div>
                </div>
                <div class="box_row_info half">
                    <label>Engine Events<span class="pull-right"><i tabindex="0" class="fa fa-question form-icon-help" onclick="showPopover(this)" data-container="body" data-toggle="popover" data-trigger="focus" data-placement="top" data-content="In the position 'On' on driver application inspection mode will be shown Engine Power On/Off events(required by FMCSA)."></i></span></label>
                    <div class="check_buttons_block" id="showEngineStatuses">
                        <button class="btn btn-default" onclick="doActive(this)" data-val="1">On</button>
                        <button class="btn btn-default " onclick="doActive(this)" data-val="0">Off</button>
                    </div>
                </div>
                <div class="box_row_info half">
                    <label>Signature/Certification Events <span class="pull-right"><i tabindex="0" class="fa fa-question form-icon-help" onclick="showPopover(this)" data-container="body" data-toggle="popover" data-trigger="focus" data-placement="top" data-content="In the position 'On' on driver application inspection mode will be shown Logbook Certification(signatures) events(required by FMCSA)."></i></span></label>
                    <div class="check_buttons_block" id="showSignatureEvents">
                        <button class="btn btn-default" onclick="doActive(this)" data-val="1">On</button>
                        <button class="btn btn-default " onclick="doActive(this)" data-val="0">Off</button>
                    </div>
                </div>
                <div class="box_row_info half">
                    <label>Odometer/Engine Hours <span class="pull-right"><i tabindex="0" class="fa fa-question form-icon-help" onclick="showPopover(this)" data-container="body" data-toggle="popover" data-trigger="focus" data-placement="top" data-content="In the position 'On' on driver application inspection mode will be shown Odometer and Engine Hours(required by FMCSA)."></i></span></label>
                    <div class="check_buttons_block" id="showOdometerAndEngineHours">
                        <button class="btn btn-default" onclick="doActive(this)" data-val="1">On</button>
                        <button class="btn btn-default " onclick="doActive(this)" data-val="0">Off</button>
                    </div>
                </div>
                <div class="box_row_info half">
                    <label>Аdverse driving <span class="pull-right"><i tabindex="0" class="fa fa-question form-icon-help" onclick="showPopover(this)" data-container="body" data-toggle="popover" data-trigger="focus" data-placement="top" data-content="In the position 'On' on driver application inspection mode will be shown Logbook Certification(signatures) events(required by FMCSA)."></i></span></label>
                    <div class="check_buttons_block" id="showАdverceDriving">
                        <button class="btn btn-default" onclick="doActive(this)" data-val="1">On</button>
                        <button class="btn btn-default " onclick="doActive(this)" data-val="0">Off</button>
                    </div>
                </div>
                <div class="box_row_info half">
                    <label>16 hours exception <span class="pull-right"><i tabindex="0" class="fa fa-question form-icon-help" onclick="showPopover(this)" data-container="body" data-toggle="popover" data-trigger="focus" data-placement="top" data-content="In the position 'On' on driver application inspection mode will be shown Logbook Certification(signatures) events(required by FMCSA)."></i></span></label>
                    <div class="check_buttons_block" id="showSixteenHoursException">
                        <button class="btn btn-default" onclick="doActive(this)" data-val="1">On</button>
                        <button class="btn btn-default " onclick="doActive(this)" data-val="0">Off</button>
                    </div>
                </div>
                ${socialBlock}
            </div>
			<div class="info_box">
				<h2>Administrative</h2>
				<div class="box_row_info">
					<label>Med. Card Expiration:</label>
					<input class="datepicker ez_input" value="" id="dr_med"  type="text" placeholder="mm-dd-yyyy" />
				</div>
				<div class="box_row_info">
					<label>Med. Card Remind:</label>
					<div class="range-field ez_range_field_valuelist" id="medCardRemind">
						<input value="0" type="range" name="medCardRemind" data-valuelist='[{"v":"1", "l":"All"}, {"v":"2592000", "l":"30day"}, {"v":"1296000", "l":"15day"}, {"v":"86400", "l":"24h"}, {"v":"3600", "l":"1h"}, {"v":"0", "l":"None"}]' />
					</div>
				</div>
				<div class="box_row_info">
					<label>Date of Birth</label>
					<input class="datepicker ez_input" value="" id="dr_birth" type="text" placeholder="mm-dd-yyyy" />
				</div>
				<div class="box_row_info">
					<label>Hire Date</label>
					<input class="datepicker ez_input" value="" id="dr_hire" type="text" placeholder="mm-dd-yyyy" />
				</div>
				<div class="box_row_info">
					<label>Terminate day</label>
					<input class="datepicker ez_input" value="" id="dr_term_date" type="text" placeholder="mm-dd-yyyy" />
				</div>
				<div class="box_row_info">
					<label>Pull Notice</label>
					<input class="datepicker ez_input" value="" id="dr_pull" type="text" placeholder="mm-dd-yyyy" />
				</div>
				<div class="box_row_info half">
					<label>HazMat</label>
					<div class="check_buttons_block" id="dr_hazmat">
						<button class="btn btn-default " onclick="doActive(this)" data-val="1">On</button>
						<button class="btn btn-default" onclick="doActive(this)" data-val="0">Off</button>
					</div>
				</div>
				<div class="box_row_info half">
					<label>Insurance</label>
					<div class="check_buttons_block" id="dr_insur">
						<button class="btn btn-default" onclick="doActive(this)" data-val="1">On</button>
						<button class="btn btn-default" onclick="doActive(this)" data-val="0">Off</button>
					</div>
				</div>
				<div class="box_row_info half">
					<label>Tanker Endorsement</label>
					<div class="check_buttons_block" id="dr_tank">
						<button class="btn btn-default " onclick="doActive(this)" data-val="1">On</button>
						<button class="btn btn-default" onclick="doActive(this)" data-val="0">Off</button>
					</div>
				</div>
				<div class="box_row_info">
					<label>Notes</label>
					<textarea id="dr_notes" style="resize: none;"></textarea>
				</div>
			</div>
			<div class="info_box">
				<h2>Contact Info</h2>
				<div class="box_row_info">
					<label>State</label>
					<select name="state" id="dr_cont_st" class="ez_input">
						<option value="0">STATE/PROVINCE</option>
                        <optgroup label="USA">
                            <option value="1" data-short="AL">Alabama</option><option value="2" data-short="AK">Alaska</option><option value="3" data-short="AZ">Arizona</option><option value="4" data-short="AR">Arkansas</option><option value="5" data-short="CA">California</option><option value="6" data-short="CO">Colorado</option><option value="7" data-short="CT">Connecticut</option><option value="8" data-short="DE">Delaware</option><option value="9" data-short="FL">Florida</option><option value="10" data-short="GA">Georgia</option><option value="11" data-short="HI">Hawaii</option><option value="12" data-short="ID">Idaho</option><option value="13" data-short="IL">Illinois</option><option value="14" data-short="IN">Indiana</option><option value="15" data-short="IA">Iowa</option><option value="16" data-short="KS">Kansas</option><option value="17" data-short="KY">Kentucky</option><option value="18" data-short="LA">Louisiana</option><option value="19" data-short="ME">Maine</option><option value="20" data-short="MD">Maryland</option><option value="21" data-short="MA">Massachusetts</option><option value="22" data-short="MI">Michigan</option><option value="23" data-short="MN">Minnesota</option><option value="24" data-short="MS">Mississippi</option><option value="25" data-short="MO">Missouri</option><option value="26" data-short="MT">Montana</option><option value="27" data-short="NE">Nebraska</option><option value="28" data-short="NV">Nevada</option><option value="29" data-short="NH">New Hampshire</option><option value="30" data-short="NJ">New Jersey</option><option value="31" data-short="NM">New Mexico</option><option value="32" data-short="NY">New York</option><option value="33" data-short="NC">North Carolina</option><option value="34" data-short="ND">North Dakota</option><option value="35" data-short="OH">Ohio</option><option value="36" data-short="OK">Oklahoma</option><option value="37" data-short="OR">Oregon</option><option value="38" data-short="PA">Pennsylvania</option><option value="39" data-short="RI">Rhode Island</option><option value="40" data-short="SC">South Carolina</option><option value="41" data-short="SD">South Dakota</option><option value="42" data-short="TN">Tennessee</option><option value="43" data-short="TX">Texas</option><option value="44" data-short="UT">Utah</option><option value="45" data-short="VT">Vermont</option><option value="46" data-short="VA">Virginia</option><option value="47" data-short="WA">Washington</option><option value="48" data-short="WV">West Virginia</option><option value="49" data-short="WI">Wisconsin</option><option value="50" data-short="WY">Wyoming</option><option value="64" data-short="DC">Washington DC</option>
                        </optgroup>
                        <optgroup label="Canada">
                            <option value="51" data-short="AB">Alberta</option><option value="52" data-short="BC">British Columbia</option><option value="53" data-short="MB">Manitoba</option><option value="54" data-short="NB">New Brunswick</option><option value="55" data-short="NL">Newfoundland and Labrador</option><option value="56" data-short="NS">Nova Scotia</option><option value="57" data-short="NT">Northwest Territories</option><option value="58" data-short="NU">Nunavut</option><option value="59" data-short="ON">Ontario</option><option value="60" data-short="PE">Prince Edward Island</option><option value="61" data-short="QC">Quebec</option><option value="62" data-short="SK">Saskatchewan</option><option value="63" data-short="YT">Yukon</option>
                        </optgroup>
					</select>
				</div>
				<div class="box_row_info">
					<label>City</label>
					<input value="" id="dr_cont_city" type="text" class="ez_input"/>
				</div>
				<div class="box_row_info">
					<label>Address</label>
					<input value="" id="dr_cont_addr" type="text" class="ez_input"/>
				</div>
				<div class="box_row_info">
					<label>Phone</label>
					<input id="dr_cont_phone" type="text" data-mask="000 000 0000" value="" class="ez_input">
				</div>
				<div class="box_row_info half">
					<label>Sms</label>
					<div class="check_buttons_block" id="dr_cont_sms">
						<button class="btn btn-default " onclick="doActive(this)" data-val="1">On</button>
						<button class="btn btn-default" onclick="doActive(this)" data-val="0">Off</button>
					</div>
				</div>
			</div>
			<div class="info_box">
				<h2>Driver's License</h2>
				<div class="box_row_info">
					<label>Number</label>
					<input value="" id="dr_lic_num" type="text" class="ez_input"/>
				</div>
				<div class="box_row_info">
					<label>State</label>
					<select name="state" id="dr_lic_st" class="ez_input">
						<option value="0">STATE/PROVINCE</option>
                        <optgroup label="USA">
                            <option value="1" data-short="AL">Alabama</option><option value="2" data-short="AK">Alaska</option><option value="3" data-short="AZ">Arizona</option><option value="4" data-short="AR">Arkansas</option><option value="5" data-short="CA">California</option><option value="6" data-short="CO">Colorado</option><option value="7" data-short="CT">Connecticut</option><option value="8" data-short="DE">Delaware</option><option value="9" data-short="FL">Florida</option><option value="10" data-short="GA">Georgia</option><option value="11" data-short="HI">Hawaii</option><option value="12" data-short="ID">Idaho</option><option value="13" data-short="IL">Illinois</option><option value="14" data-short="IN">Indiana</option><option value="15" data-short="IA">Iowa</option><option value="16" data-short="KS">Kansas</option><option value="17" data-short="KY">Kentucky</option><option value="18" data-short="LA">Louisiana</option><option value="19" data-short="ME">Maine</option><option value="20" data-short="MD">Maryland</option><option value="21" data-short="MA">Massachusetts</option><option value="22" data-short="MI">Michigan</option><option value="23" data-short="MN">Minnesota</option><option value="24" data-short="MS">Mississippi</option><option value="25" data-short="MO">Missouri</option><option value="26" data-short="MT">Montana</option><option value="27" data-short="NE">Nebraska</option><option value="28" data-short="NV">Nevada</option><option value="29" data-short="NH">New Hampshire</option><option value="30" data-short="NJ">New Jersey</option><option value="31" data-short="NM">New Mexico</option><option value="32" data-short="NY">New York</option><option value="33" data-short="NC">North Carolina</option><option value="34" data-short="ND">North Dakota</option><option value="35" data-short="OH">Ohio</option><option value="36" data-short="OK">Oklahoma</option><option value="37" data-short="OR">Oregon</option><option value="38" data-short="PA">Pennsylvania</option><option value="39" data-short="RI">Rhode Island</option><option value="40" data-short="SC">South Carolina</option><option value="41" data-short="SD">South Dakota</option><option value="42" data-short="TN">Tennessee</option><option value="43" data-short="TX">Texas</option><option value="44" data-short="UT">Utah</option><option value="45" data-short="VT">Vermont</option><option value="46" data-short="VA">Virginia</option><option value="47" data-short="WA">Washington</option><option value="48" data-short="WV">West Virginia</option><option value="49" data-short="WI">Wisconsin</option><option value="50" data-short="WY">Wyoming</option><option value="64" data-short="DC">Washington DC</option>
                        </optgroup>
                        <optgroup label="Canada">
                            <option value="51" data-short="AB">Alberta</option><option value="52" data-short="BC">British Columbia</option><option value="53" data-short="MB">Manitoba</option><option value="54" data-short="NB">New Brunswick</option><option value="55" data-short="NL">Newfoundland and Labrador</option><option value="56" data-short="NS">Nova Scotia</option><option value="57" data-short="NT">Northwest Territories</option><option value="58" data-short="NU">Nunavut</option><option value="59" data-short="ON">Ontario</option><option value="60" data-short="PE">Prince Edward Island</option><option value="61" data-short="QC">Quebec</option><option value="62" data-short="SK">Saskatchewan</option><option value="63" data-short="YT">Yukon</option>
                        </optgroup>
					</select>
				</div>
				<div class="box_row_info">
					<label>Expiration</label>
					<input class="datepicker ez_input" value="" id="dr_lic_exp" type="text" placeholder="mm-dd-yyyy" />
				</div>
				<div class="box_row_info">
					<label>Driver's License Remind:</label>
					<div class="range-field ez_range_field_valuelist" id="driverLicenseRemind">
						<input value="0" type="range" name="driverLicenseRemind" data-valuelist='[{"v":"1", "l":"All"}, {"v":"2592000", "l":"30day"}, {"v":"1296000", "l":"15day"}, {"v":"86400", "l":"24h"}, {"v":"3600", "l":"1h"}, {"v":"0", "l":"None"}]' />
					</div>
				</div>
			</div>
			<div class="info_box attachments" style="border-bottom: 1px solid #ccc;">
				<h2>Attachments</h2>
				<div class="box_row_info">
					<label class="attachment_title">Driver License</label>
					<input type="file" accept="*"  id="dr_lic_att" onchange="showUploadedImage(this)" style="display:none;">
					<img class="loaded_img" src=""  style="display:none;"/>
					<label class="loaded_doc"></label>
					<div class="attachment_control">
						<button class="btn btn-default delete_file edit_file" onclick="deleteDoc(this)">Delete</button>
						<button class="btn btn-default download_file edit_file" onclick="downloadDoc(this)">Download</button>
						<button class="btn btn-default save_file" onclick="saveNewDoc(this, ${self.user.id})">Save</button> 
						<button class="btn btn-default cancel_file" onclick="cancelDoc(this)">Cancel</button>
						<button class="btn btn-default upload" onclick="uploadNewDoc(this)">Upload</button> 
					</div>
					<div class="clearfix"></div>
					<label class="update_result save_file_result"></label>
					<div class="upload_line">
						<div class="current_uploadWrap">
							<div class="current_upload"></div>
						</div>
					</div>
				</div>
				<div class="box_row_info">
					<label class="attachment_title">Application Documents</label>
					<input type="file" accept="*"  id="dr_appl_att" onchange="showUploadedImage(this)" style="display:none;"/>

					<img class="loaded_img" src=""  style="display:none;"/>
					<label class="loaded_doc"></label>
					<div class="attachment_control">
						<button class="btn btn-default delete_file edit_file" onclick="deleteDoc(this)">Delete</button>
						<button class="btn btn-default download_file edit_file" onclick="downloadDoc(this)">Download</button>
						<button class="btn btn-default save_file" onclick="saveNewDoc(this, ${self.user.id})">Save</button> 
						<button class="btn btn-default cancel_file" onclick="cancelDoc(this)">Cancel</button>
						<button class="btn btn-default upload" onclick="uploadNewDoc(this)">Upload</button> 
					</div>
					<div class="clearfix"></div>
					<label class="update_result save_file_result"></label>
					<div class="upload_line">
						<div class="current_uploadWrap">
							<div class="current_upload"></div>
						</div>
					</div>
				</div>
				<div class="box_row_info">
					<label class="attachment_title">Drug and Alcohol Test</label>
					<input type="file" accept="*"  id="dr_test_att" onchange="showUploadedImage(this)" style="display:none;"/>
					<img class="loaded_img" src=""  style="display:none;"/>
					<label class="loaded_doc"></label>
					<div class="attachment_control">
						<button class="btn btn-default delete_file edit_file" onclick="deleteDoc(this)">Delete</button>
						<button class="btn btn-default download_file edit_file" onclick="downloadDoc(this)">Download</button>
						<button class="btn btn-default save_file" onclick="saveNewDoc(this, ${self.user.id})">Save</button> 
						<button class="btn btn-default cancel_file" onclick="cancelDoc(this)">Cancel</button>
						<button class="btn btn-default upload" onclick="uploadNewDoc(this)">Upload</button> 
					</div>
					<div class="clearfix"></div>
					<label class="update_result save_file_result"></label>
					<div class="upload_line">
						<div class="current_uploadWrap">
							<div class="current_upload"></div>
						</div>
					</div>
				</div>
				<div class="box_row_info">
					<label class="attachment_title">Medical Card</label>
					<input type="file" accept="*"  id="dr_med_att" onchange="showUploadedImage(this)" style="display:none;" />
					<div class="clearfix"></div>
					<img class="loaded_img" src=""  style="display:none;"/>
					<label class="loaded_doc"></label>
					<div class="attachment_control">
						<button class="btn btn-default delete_file edit_file" onclick="deleteDoc(this)">Delete</button>
						<button class="btn btn-default download_file edit_file" onclick="downloadDoc(this)">Download</button>
						<button class="btn btn-default save_file" onclick="saveNewDoc(this, ${self.user.id})">Save</button> 
						<button class="btn btn-default cancel_file" onclick="cancelDoc(this)">Cancel</button>
						<button class="btn btn-default upload" onclick="uploadNewDoc(this)">Upload</button> 
					</div>
					<div class="clearfix"></div>
					<label class="update_result save_file_result"></label>
					<div class="upload_line">
						<div class="current_uploadWrap">
							<div class="current_upload"></div>
						</div>
					</div>
				</div>
				<div class="box_row_info">
					<label class="attachment_title">Previous Employment Verification</label>
					<input type="file" accept="*"  id="dr_prev_att" onchange="showUploadedImage(this)" style="display:none;"/>
					<div class="clearfix"></div>
					<img class="loaded_img" src=""  style="display:none;"/>
					<label class="loaded_doc"></label>
					<div class="attachment_control">
						<button class="btn btn-default delete_file edit_file" onclick="deleteDoc(this)">Delete</button>
						<button class="btn btn-default download_file edit_file" onclick="downloadDoc(this)">Download</button>
						<button class="btn btn-default save_file" onclick="saveNewDoc(this, ${self.user.id})">Save</button> 
						<button class="btn btn-default cancel_file" onclick="cancelDoc(this)">Cancel</button>
						<button class="btn btn-default upload" onclick="uploadNewDoc(this)">Upload</button> 
					</div>
					<div class="clearfix"></div>
					<label class="update_result save_file_result"></label>
					<div class="upload_line">
						<div class="current_uploadWrap">
							<div class="current_upload"></div>
						</div>
					</div>
				</div>
			</div> 
		</div>`);
        $('#dr_odometerId button').attr('disabled', false);
        if (self.terminated) {
            $('#dr_odometerId button').attr('disabled', true);
        }
        $("#dr_cont_phone").mask("000 000 0000");
        $("#dr_phone").mask("000 000 0000");
        self.modalElement.find('.info_box').hide();
        init_range_input();
        fleetC.fleetUsers.sort((a, b) => (a.name.toLowerCase() > b.name.toLowerCase()) ? 1 : ((b.name.toLowerCase() > a.name.toLowerCase()) ? -1 : 0));
        $.each(fleetC.fleetUsers, function (key, user) {
            if (isDriver(user.companyPosition) && self.user.id != user.id) {
                $('#dr_team_driver').append('<option value="' + user.id + '">' + user.name + ' ' + user.last + '</option>');
            }
        });
        self.modalElement.find('.modal-footer').append('<label class="update_result save_edit_result"></label><button class="btn btn-default oneDr save_edit" onclick="saveDriverEdit(this)">Save</button>');
        AjaxController('getFleetDriversData', {userId: self.user.id}, dashUrl, self.getFleetDriversDataHandler, self.getFleetDriversDataHandler, true);
    }
    self.getFleetDriversDataHandler = function (response) {
        self.driver = response.data[0];
        if (self.driver.userId == null) {
            self.driver.userId = self.driver.usId;
        }
        self.smartSafety = self.driver.SmartSafety;
        var role = self.driver.companyPosition == 3 ? 0 : 1;
        var name = self.driver.terminated ? self.driver.terminatedName : self.driver.name;
        var last = self.driver.terminated ? self.driver.terminatedLast : self.driver.last;
        self.modalElement.find('#dr_id').val(self.driver.userId);
        self.modalElement.find('#dr_name').val(name);
        self.modalElement.find('#dr_last').val(last);
        self.modalElement.find('#dr_phone').val(self.driver.phone);
        if (self.driver.terminated) {
            self.modalElement.find('#dr_phone').attr('disabled', true);
            self.modalElement.find('#dr_phone').hide();
        }
        self.modalElement.find('#dr_ssn').val(checkValue(self.driver.SSN));
        self.modalElement.find('#dr_ein').val(checkValue(self.driver.EIN));
        self.modalElement.find('#dr_team_driver').val(self.driver.teamDriver);
        var trailers = getTrailers(checkValue(self.driver.trailers));
        var trailerss = getTrailersWithButtons(checkValue(self.driver.trailers));
        self.modalElement.find('#dr_trailers').val(trailers);
        self.modalElement.find('.trailers_box').html(trailerss);
        self.modalElement.find('#dr_med').val(checkValue(self.driver.MedCard) == undefined ? '' : convertDateToUSA(checkValue(self.driver.MedCard)));
        self.modalElement.find('#dr_birth').val(checkValue(self.driver.DateOfBirth) == undefined ? '' : convertDateToUSA(checkValue(self.driver.DateOfBirth)));
        self.modalElement.find('#dr_hire').val(checkValue(self.driver.HireDate) == undefined ? '' : convertDateToUSA(checkValue(self.driver.HireDate)));
        self.modalElement.find('#dr_term_date').val(checkValue(self.driver.TermitaneDate) == undefined ? '' : convertDateToUSA(checkValue(self.driver.TermitaneDate)));
        self.modalElement.find('#dr_pull').val(checkValue(self.driver.PullNotice) == undefined ? '' : convertDateToUSA(checkValue(self.driver.PullNotice)));
        self.modalElement.find('#dr_hazmat button[data-val="' + checkCheckInt(self.driver.HazMat) + '"]').click();
        self.modalElement.find('#dr_insur button[data-val="' + checkCheckInt(self.driver.Insurance) + '"]').click();
        self.modalElement.find('#dr_aobrd').prop('checked', checkCheck(self.driver.aobrd));
        self.modalElement.find('#canEditTime').parent().hide();
        var roleVal = checkCheckInt(role);
        self.modalElement.find('#ableEditOnOffSB button[data-val="' + checkCheckInt(self.driver.ableEditOnOffSB) + '"]').addClass('active');
        if (!self.driver.aobrd) {
            self.modalElement.find('#aobrdAbleToEdit').parent().show();
            self.modalElement.find('#aobrdManualDrive').parent().show();
            self.modalElement.find('#iftaDistances').parent().show();
            self.modalElement.find('#iftaDistances button[data-val="' + roleVal + '"]').addClass('active');
            self.modalElement.find('#iftaDistances').attr('data-prev_val', roleVal);
        } else {
            self.modalElement.find('#aobrdAbleToEdit').parent().hide();
            self.modalElement.find('#aobrdManualDrive').parent().hide();
            if (self.driver.aobrdAbleToEdit) {
                checkButtonInit('ableEditOnOffSB', 1);
                $('#ableEditOnOffSB button').attr('disabled', true);
            }
            if (self.driver.aobrdAbleToEdit) {
                self.modalElement.find('canEditTime').parent().show();
            }
            self.modalElement.find('#iftaDistances').parent().hide();
            self.modalElement.find('#iftaDistances button[data-val="' + checkCheckInt(self.driver.iftaDistances) + '"]').addClass('active');
            self.modalElement.find('#iftaDistances').attr('data-prev_val', checkCheckInt(self.driver.iftaDistances));
        }
        self.modalElement.find('#aobrdAbleToEdit button[data-val="' + checkCheckInt(self.driver.aobrdAbleToEdit) + '"]').addClass('active');
        self.modalElement.find('#aobrdManualDrive button[data-val="' + checkCheckInt(self.driver.aobrdManualDrive) + '"]').addClass('active');
        self.modalElement.find('#hideEngineStatuses button[data-val="' + checkCheckInt(self.driver.hideEngineStatuses) + '"]').click();

        self.modalElement.find('#scanner_type button[data-val="' + self.driver.scanner_type + '"]').click();

        /*if (self.driver.available_scanner_types.ez_simple <= 0 && self.driver.available_scanner_types.ez_smart > 0) {
            self.modalElement.find('#scanner_type').removeClass('with_aobrd');
            self.modalElement.find('#scanner_type button[data-val="0"]').remove();
        }
        if (self.driver.available_scanner_types.ez_smart <= 0) {
            self.modalElement.find('#scanner_type').removeClass('with_aobrd');
            self.modalElement.find('#scanner_type button[data-val="1"]').remove();
        }
        if (self.driver.available_scanner_types.ez_hard <= 0) {
            self.modalElement.find('#scanner_type').removeClass('with_aobrd');
            self.modalElement.find('#scanner_type button[data-val="2"]').remove();
        }*/

        self.modalElement.find('#dr_eld_new button[data-val="2"]').attr('data-previousAOBRD', self.driver.previousAOBRD);
        self.modalElement.find('#dr_eld_new button[data-val="2"]').attr('data-firstClick', 1);

        if (self.driver.aobrd == 1) {
            self.modalElement.find('#dr_eld_new button[data-val="2"]').click();
        } else {
            self.modalElement.find('#dr_eld_new button[data-val="' + roleVal + '"]').click();
        }

        self.modalElement.find('#dr_eld_new button[data-val="2"]').attr('data-firstClick', 0);

        self.modalElement.find('#dr_yardMode button[data-val="' + checkCheckInt(self.driver.yard) + '"]').click();
        self.modalElement.find('#dr_conveyanceMode button[data-val="' + checkCheckInt(self.driver.conv) + '"]').click();
        self.modalElement.find('#dr_personalCycle button[data-val="' + checkCheckInt(self.driver.personal_cycle) + '"]').click();
        self.modalElement.find('#dr_personalTZ button[data-val="' + checkCheckInt(self.driver.personal_tz) + '"]').click();
        self.modalElement.find('#dr_odometerId button[data-val="' + checkCheckInt(self.driver.odometerId) + '"]').click();
        self.modalElement.find('#checkYesterdayValidDay button[data-val="' + checkCheckInt(self.driver.checkYesterdayValidDay) + '"]').click();
        self.modalElement.find('#showEvents button[data-val="' + checkCheckInt(self.driver.showEvents) + '"]').click();
        self.modalElement.find('#showScannerStatuses button[data-val="' + checkCheckInt(self.driver.showScannerStatuses) + '"]').click();
        self.modalElement.find('#showEngineStatuses button[data-val="' + checkCheckInt(self.driver.showEngineStatuses) + '"]').click();
        self.modalElement.find('#showSignatureEvents button[data-val="' + checkCheckInt(self.driver.showSignatureEvents) + '"]').click();
        self.modalElement.find('#showOdometerAndEngineHours button[data-val="' + checkCheckInt(self.driver.showOdometerAndEngineHours) + '"]').click();
        self.modalElement.find('#showАdverceDriving button[data-val="' + checkCheckInt(self.driver.adverce_driving) + '"]').click();
        self.modalElement.find('#showSixteenHoursException button[data-val="' + checkCheckInt(self.driver.hours_exception) + '"]').click();
        self.modalElement.find('#hideSocial button[data-val="' + checkCheckInt(self.driver.hideSocial) + '"]').click();
        self.modalElement.find('#paperDvir button[data-val="' + checkCheckInt(self.driver.paperDvir) + '"]').click();
        self.modalElement.find('#dr_tank button[data-val="' + checkCheckInt(self.driver.TankerEndorsment) + '"]').click();
        self.modalElement.find('#dr_cont_st').val(checkValue(self.driver.State));
        self.modalElement.find('#dr_cont_city').val(checkValue(self.driver.City));
        self.modalElement.find('#dr_cont_addr').val(checkValue(self.driver.Address));
        self.modalElement.find('#dr_cont_phone').val(checkValue(self.driver.Phone));
        self.modalElement.find('#dr_cont_sms button[data-val="' + checkCheckInt(self.driver.Sms) + '"]').click();
        self.modalElement.find('#dr_lic_num').val(checkValue(self.driver.DLNumber));
        self.modalElement.find('#dr_lic_st').val(checkValue(self.driver.DLState));
        self.modalElement.find('#dr_lic_exp').val(checkValue(self.driver.DLExpiration) == undefined ? '' : convertDateToUSA(checkValue(self.driver.DLExpiration)));
        self.modalElement.find('#dr_notes').val(checkValue(self.driver.notes));
        var rangeValuelistS = getRangeValuelist(self.modalElement.find('input[name="canEditTime_range"]'));
        if (rangeValuelistS) {
            var canEditTime_value = rangeValuelistS.length - 1;
            $.each(rangeValuelistS, function (k, v) {
                if (v.v == self.driver.canEditTime) {
                    canEditTime_value = k;
                    return false;
                }
            });
            self.modalElement.find('input[name="canEditTime_range"]').val(canEditTime_value);
            if (self.driver.canEditTime && self.modalElement.find('input[name="canEditTime"]').val() == 0)
                self.modalElement.find('input[name="canEditTime"]').val(self.driver.canEditTime);
        }

        var medCardRemindRange = getRangeValuelist(self.modalElement.find('input[name="medCardRemind_range"]'));
        if (medCardRemindRange) {
            var medCardRemind_value = medCardRemindRange.length - 1;
            $.each(medCardRemindRange, function (k, v) {
                if (v.v == self.driver.medCardRemind) {
                    medCardRemind_value = k;
                    return false;
                }
            });
            self.modalElement.find('input[name="medCardRemind_range"]').val(medCardRemind_value);
            if (self.driver.medCardRemind && self.modalElement.find('input[name="medCardRemind"]').val() == 0)
                self.modalElement.find('input[name="medCardRemind"]').val(self.driver.medCardRemind);
        }

        var driverLicenseRemindRange = getRangeValuelist(self.modalElement.find('input[name="driverLicenseRemind_range"]'));
        if (driverLicenseRemindRange) {
            var driverLicenseRemind_value = driverLicenseRemindRange.length - 1;
            $.each(driverLicenseRemindRange, function (k, v) {
                if (v.v == self.driver.driverLicenseRemind) {
                    driverLicenseRemind_value = k;
                    return false;
                }
            });
            self.modalElement.find('input[name="driverLicenseRemind_range"]').val(driverLicenseRemind_value);
            if (self.driver.driverLicenseRemind && self.modalElement.find('input[name="driverLicenseRemind"]').val() == 0) {
                self.modalElement.find('input[name="driverLicenseRemind"]').val(self.driver.driverLicenseRemind);
        }
        }
        clearDoc(self.modalElement.find('.attachments .loaded_doc'));
        $.each(self.driver.attachments, function (key, attachment) {
            self.modalElement.find(' #' + attachment.docType).closest('.box_row_info').find('.loaded_doc').text(attachment.name).show();
            self.modalElement.find(' #' + attachment.docType).closest('.box_row_info').find('.loaded_doc').attr('src', attachment.url);
            self.modalElement.find(' #' + attachment.docType).closest('.box_row_info').find('.upload').text('Replace');
            self.modalElement.find(' #' + attachment.docType).closest('.box_row_info').addClass('file_exist');
            self.modalElement.find(' #' + attachment.docType).closest('.box_row_info').find('.edit_file').show();
        });
        self.modalElement.find('#dr_birth, #dr_hire').datepicker({
            changeMonth: true,
            changeYear: true,
            yearRange: "1900:2021",
            dateFormat: 'mm-dd-yy'
        });
        self.modalElement.find('#dr_lic_exp').datepicker({
            changeMonth: true,
            changeYear: true,
            yearRange: (new Date().getFullYear() - 5) + ":" + (new Date().getFullYear() + 10),
            dateFormat: 'mm-dd-yy'
        });
        self.modalElement.find('#dr_med').datepicker({
            changeMonth: true,
            changeYear: true,
            yearRange: (new Date().getFullYear() - 5) + ":" + (new Date().getFullYear() + 5),
            dateFormat: 'mm-dd-yy'
        });
        self.modalElement.find('.datepicker').datepicker({dateFormat: 'mm-dd-yy'});
        changeTeamDriver();
        self.modalElement.find('.info_box').show();
    }
    self.initRequest();
    self.sendDriverEvent = function (params) {
        if(params.action == 'deviceScreenshot'){
            self.startDeviceScreenshotTimer();
            if($('.driverScreen'). length == 0){
                $('#user_info_box .modal-content').append(`
                    <div class="driverScreen">
                        <div class="dragPanel"></div>
                        <i class="fa fa-expand" onclick="$('.driverScreen').toggleClass('fullScreen')"></i>
<!--                        <button type="button" class="closeView" onclick="$('.driverScreen').remove()"><span aria-hidden="true">×</span></button>-->
                        <img src="" alt="Driver screen"/>
                    </div>
                `)
                $('.dragPanel').mousedown(self.initScreenDrag);
                $('#user_info_box').mouseup(self.finishScreenDrag);
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
    self.startDeviceScreenshotTimer = function() {
        if (self.deviceScreenshotTimer) {
            clearTimeout(self.deviceScreenshotTimer);
        }
        self.deviceScreenshotTimer = setTimeout(function () {
            if ($('.driverScreen').length == 0) {
                return 1;
            }
            $('.driverScreen').addClass('no_connection');
            $('.driverScreen .dragPanel').text('No Connection');
        }, 5000);
    }
    self.initScreenDrag = function(){
        self.lastMoveX = 0;
        self.lastMoveY = 0;
        $( "#user_info_box" ).on('mousemove', function( event ) {
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
    self.finishScreenDrag = function(){
        $( "#user_info_box" ).off('mousemove');
    }
}
function getProfilePopupInfo(userId, tab = 'loginEvents', el = false) {
    new fleetUserCard(userId);
}
function getPositionNameFromId(positionId, aobrd = 0, admin = 0) {
    var name = 'Basic';
    if (positionId == TYPE_DRIVER) {
        name = 'Professional Driver';
    } else if (positionId == TYPE_DRIVER_ELD) {
        if (aobrd == 1) {
            name = 'Driver AOBRD';
        } else {
            name = 'Driver ELD';
        }
    } else if (positionId == TYPE_SAFETY) {
        name = 'Safety Director';
    } else if (positionId == TYPE_DISPATCHER) {
        name = 'Dispatcher';
    }
    if (admin != 0) {
        name += '(Admin)';
    }
    return name;
}
function editAccountBox(userId) {
	var content = `
		<form class="row">
			<div class="form-group col-xs-12 password">
				<label class="form-group-label">New Password</label>
				<span class="form-group-content">
					<input class="form-control" id="user_new_pass" value="" type="password" autocomplete="off">
				</span>
			</div>
			<div class="form-group col-xs-12 password">
				<label class="form-group-label">Confirm Password</label>
				<span class="form-group-content">
					<input class="form-control" id="user_new_pass_again" value="" type="password" autocomplete="off">
				</span>
			</div>
		</form><div id="savePasswordInfoMessages"></div>`;
	var footerButtons = `<button id="cancelEdit" class="btn btn-default" data-dismiss="modal">Cancel</button><button id="saveAccount" class="btn btn-default" onclick="saveAccountEdit()">Save</button>`;	
    showModal('Edit Account', content, 'editPassword', 'modal-sm', {footerButtons: footerButtons});
}
function downloadOutputFile() {
    resetError();
    $('#downloadOutputFile').attr('disabled',true);
    var userId = $('#user_info_box').attr('data-userid');
    AjaxController('downloadOutputFile', {userId: userId}, apiDashUrl, downloadOutputFileHandler, null, true);

}

function downloadOutputFileHandler(response) {
    var sUrl = response.data.url;
    //If in Chrome or Safari - download via virtual link click
    if (window.downloadOutputFileHandler.isChrome || window.downloadOutputFileHandler.isSafari) {
        //Creating new link node.
        var link = document.createElement('a');
        link.href = sUrl;

        if (link.download !== undefined) {
            //Set HTML5 download attribute. This will prevent file from opening if supported.
            var fileName = sUrl.substring(sUrl.lastIndexOf('/') + 1, sUrl.length);
            link.download = fileName;
        }

        //Dispatching click event.
        if (document.createEvent) {
            var e = document.createEvent('MouseEvents');
            e.initEvent('click', true, true);
            link.dispatchEvent(e);
            return true;
        }
    }
    var query = '?download';
    window.open(sUrl + query, '_self');
}
window.downloadOutputFileHandler.isChrome = navigator.userAgent.toLowerCase().indexOf('chrome') > -1;
window.downloadOutputFileHandler.isSafari = navigator.userAgent.toLowerCase().indexOf('safari') > -1;

function saveAccountAdminSettingsHandler() {
    alertMessage($('#driverInfoMessages'), 'Saved', 3000);
}
function saveAccountAdminSettings() {
    resetError();
    var userId = $('#user_info_box').attr('data-userid');
    AjaxController('saveAccountAdminSettings', {userId: userId, adminCanEdit: $('#adminCanEdit button.active').attr('data-val'), adminCanAddUsers: $('#adminCanAddUsers button.active').attr('data-val'), showLogbook: $('#showLogbook button.active').attr('data-val')}, apiDashUrl, 'saveAccountAdminSettingsHandler', saveAccountAdminSettingsHandler, true);

}
function saveAccountEdit() {
    resetError();
    $('#saveAccount').prop('disabled', true);
    var no_error = true;
    if ($('#user_new_pass').val() != '' && $('#user_new_pass').val().length < 5) {
        no_error = setError($('#user_new_pass'), 'Password length must be more than 5 characters');
    } else if ($('#user_new_pass').val() != '' && $('#user_new_pass').val().length > 32) {
        no_error = setError($('#user_new_pass'), 'Max allowed 32 characters');
    } else if ($('#user_new_pass').val() != '' && !/^[A-Za-z0-9-_+=.,?!]+$/.test($('#user_new_pass').val())) {
        no_error = setError($('#user_new_pass'), 'Password must contain only letters and numbers');
    }
    if ($('#user_new_pass').val() != '' && $('#user_new_pass').val() != $('#user_new_pass_again').val()) {
        no_error = setError($('#user_new_pass_again'), 'Passwords not match');
    }
    if (no_error == true) {
        var pass = $('#user_new_pass').val();
        var userId = $('#user_info_box').attr('data-userid');
        AjaxController('updateDriverPassword', {userId: userId, pass: pass}, dashUrl, 'saveAccountEditHandler', saveAccountEditHandlerError, true);
    } else {
        $('#editPassword').find('#saveAccount').prop('disabled', false);
    }
}
function saveAccountEditHandler(response) {
	$('#saveAccount').prop('disabled', false);
	$('#user_new_pass, #user_new_pass_again').val('');
    alertMessage($('#savePasswordInfoMessages'), 'Saved', 3000);
}
function saveAccountEditHandlerError(response) {
	$('#saveAccount').prop('disabled', false);
    alertError($('#savePasswordInfoMessages'), response.message, 3000);
}
function clearDoc(el) {
    $(el).closest('.box_row_info').removeClass('file_loaded');
    $(el).closest('.box_row_info').removeClass('file_exist');
    $(el).closest('.box_row_info').find('.loaded_doc').hide().text('').attr('src', '');
    $(el).closest('.box_row_info').find('.save_file, .cancel_file, .edit_file').hide();
    $(el).closest('.box_row_info').find('.upload').text('Upload');
    $(el).closest('.box_row_info').find('input').val('');
}
function getTrailers(val) {
    if (typeof val !== 'undefined' && val != 'null' && val != '') {
        var trailers = '';
        for (var x = 0; x < val.length; x++) {
            trailers += val[x].name + ']_';

        }
        return trailers;
    }
}
function checkCheckInt(val) {
    if (typeof val !== 'undefined' && !!val && val != 'null' && val != '' && val != '0' && val != '0000-00-00') {
        return 1;
    } else {
        return 0;
    }
}
function checkCheck(val) {
    if (typeof val !== 'undefined' && !!val && val != 'null' && val != '' && val != '0' && val != '0000-00-00') {
        return true;
    } else {
        return false;
    }

}
function checkValue(val) {
    if (val != 'null' && val != '' && val != '0000-00-00') {
        return val;
    }
}
function getTrailersWithButtons(val) {
    if (typeof val !== 'undefined' && val != 'null' && val != '') {
        var trailers = '';
        for (var x = 0; x < val.length; x++) {
            trailers += '<span> ' + val[x].name + ' <button class="remove_trailer" data-name="' + val[x].name + '">&mdash;</button></span>';
        }
        return trailers;
    }
    return '';
}
function changeTeamDriver() {
    if ($('#user_info_box #dr_team_driver').val() == 0) {
        $('#user_info_box #dr_personalCycle button, #user_info_box #dr_personalTZ button').prop('disabled', false);
    } else {
        $('#user_info_box #dr_personalCycle button[data-val=0], #user_info_box #dr_personalTZ button[data-val=0]').addClass('active');
        $('#user_info_box #dr_personalCycle button[data-val=1], #user_info_box #dr_personalTZ button[data-val=1]').removeClass('active');
        $('#user_info_box #dr_personalCycle button, #user_info_box #dr_personalTZ button').prop('disabled', true);
    }
}
function changeEldDriver() {
    if ($('#user_info_box #dr_eld_new button.active').attr('data-val') == 2) {
        if ($('#user_info_box #dr_eld_new button.active').attr('data-previousAOBRD') == 1 && $('#user_info_box #dr_eld_new button.active').attr('data-firstClick') == 0) {
            showModal('Info', '<p class="text-center">This downgrade option is only for:<br>\n\
- Warranty Exchange Devices that are ELD by default<br>\n\
- Canada grandfathered-in users<br>\n\
In other cases this action can lead to viloations of HOS rules and corrupt your output file.<br>\n\
Are you sure you want to downgrade your device?</p>', 'basicModal', '', {
                footerButtons: `<button type="button" class="btn btn-primary changeStatus" data-dismiss="modal" onclick="revertToEld();">Revert To ELD</button>`
            });
        }
        $('#user_info_box #aobrdAbleToEdit').parent().show();
        $('#user_info_box #aobrdManualDrive').parent().show();
        $('#user_info_box #iftaDistances').parent().show();
        if ($('#user_info_box #aobrdAbleToEdit button.active').attr('data-val') == 1) {
            $('#user_info_box #canEditTime').parent().show();
        }
    } else {
		$('#ableEditOnOffSB button').attr('disabled', false);
        $('#user_info_box #aobrdAbleToEdit').parent().hide();
        $('#user_info_box #aobrdManualDrive').parent().hide();
        $('#user_info_box #iftaDistances').parent().hide();
        $('#user_info_box #canEditTime').parent().hide();
    }
    if ($('#user_info_box #dr_eld_new button.active').attr('data-val') == 0) {
        $('#user_info_box .yard_conv_cont').hide();
        $('#user_info_box #scanner_type').parent().hide();
    } else {
        $('#user_info_box .yard_conv_cont').show();
        $('#user_info_box #scanner_type').parent().show();
    }
}
function revertToEld() {
    $('#user_info_box #dr_eld_new button[data-val="1"]').click();
}
function doAobrdAbleToEdit(e) {
    if ($(e).not('.active').attr('data-val') == 1) {
        showModalConfirmation('Confirmation', '<p class="text-center">Are you sure you want to grand edit right to the driver?</p>');
        $('#confirmationModal').off('click', '#btnConfirmClick').on('click', '#btnConfirmClick', function () {
            doActive($(e));
            checkButtonInit('ableEditOnOffSB', 1);
            $('#ableEditOnOffSB button').attr('disabled', true);
            $(e).closest('.info_box').find('#canEditTime').parent().attr('style', 'display:block !important');
        });
    }
}
function doAobrdNotAbleToEdit(e) {
    $(e).closest('.info_box').find('#canEditTime').parent().attr('style', 'display:none !important');
	$('#ableEditOnOffSB button').attr('disabled', false); 
    doActive($(e));
}
function doAobrIFTA(e) {
    var iftaDistancesPrev = $(e).closest('#iftaDistances').data('prev_val');
    if ($(e).not('.active').attr('data-val') == 1) {
        if (iftaDistancesPrev != 1) {
            showModalConfirmation('Confirmation', '<p class="text-center">Are you sure you want to change dinstances type? <br />Distances will be removed.</p>');
            $('#confirmationModal').off('click', '#btnConfirmClick').on('click', '#btnConfirmClick', function () {
                doActive($(e));
            });
        } else {
            doActive($(e));
        }
    }
}
function doAobrNonIFTA(e) {
    var iftaDistancesPrev = $(e).closest('#iftaDistances').data('prev_val');
    if ($(e).not('.active').attr('data-val') == 0) {
        if (iftaDistancesPrev != 0) {
            showModalConfirmation('Confirmation', '<p class="text-center">Are you sure you want to change dinstances type? <br />IFTA-distance information for today will be removed.</p>');
            $('#confirmationModal').off('click', '#btnConfirmClick').on('click', '#btnConfirmClick', function () {
                doActive($(e));
            });
        } else {
            doActive($(e));
        }
    }
}
function deleteDoc(el) {
    var userId = $(el).closest('.modal').find('.info_box #dr_id').val();
    var docType = $(el).closest('.box_row_info').find('input').attr('id');
    AjaxController('removeDriverAttachment', {userId: userId, docType: docType}, dashUrl, 'removeDocHandler', removeDocErrorHandler, true);
}
function cancelDoc(el) {
    clearDoc(el);
}
function removeDocHandler(responce) {
    var docType = responce.data.docType;
    clearDoc('#' + docType);
}
function removeDocErrorHandler(responce) {
    c(responce);
}
function uploadNewDoc(el) {
    $(el).closest('.box_row_info').find('input').click();
}
function downloadDoc(el) {
    var url = $(el).closest('.box_row_info').find('.loaded_doc').attr('src');
    url += '?download';
    window.open(url, '_blank');
}
function saveNewDoc(el, userId) {
    $(el).prop('disabled', true);
    var src = $(el).closest('.box_row_info').find('.loaded_doc').attr('src');
    var docName = $(el).closest('.box_row_info').find('.loaded_doc').text();
    $(el).closest('.box_row_info').find('.current_upload').css('width', 0);
    $(el).closest('.box_row_info').find('.current_uploadPersent').text('0%').css('margin-left', '0');
    $(el).closest('.box_row_info').find('.upload_line').show();
    var data = {
        data: {
            action: 'saveNewDoc',
            bytesArray: src,
            name: messageFile,
            userId: userId,
            docType: $(el).closest('.box_row_info').find('input').attr('id')
        }
    };
    $.ajax({
        url: dashUrl + '?' + window.location.search.substring(1),
        method: "POST",
        contentType: "application/json", // send as JSON
        data: JSON.stringify(data),
        xhr: function () {
            var xhr = $.ajaxSettings.xhr();
            xhr.upload.onprogress = function (evt)
            {
                var persent = Math.round((evt.loaded / evt.total) * 100);
                $(el).closest('.box_row_info').find('.current_upload').css('width', persent + '%');
            };
            return xhr;
        },
        success: function (data) {
            var response = jQuery.parseJSON(data);
            if (response.code == '000') {
                $(el).closest('.box_row_info').find('.loaded_doc').attr('src', response.data.url);
                $(el).closest('.box_row_info').find('.loaded_doc').text(response.data.name);
                $(el).closest('.box_row_info').find('.save_file, .upload_line').hide();
                $(el).closest('.box_row_info').removeClass('file_loaded').addClass('file_exist');
                $(el).closest('.box_row_info').find('.edit_file').show();
                alertMessage($(el).closest('.box_row_info').find('.save_file_result'), 'Saved', 3000);
            } else {
                alertError($(el).closest('.box_row_info').find('.save_file_result'), response.message, 3000);
            }
            $(el).prop('disabled', false);
        }
    });
}
function showUploadedImage(input) {
    c('showUploadedImage');
    if (input.files.length == 0) {
        return false;
    }
    messageFile = input.files[0].name;
    var messageBox = $(input).closest('.box_row_info').find('.save_file_result');
    if (input.files && input.files[0]) {
        if (input.files[0]['size'] > 10000000)//max 10 mb
        {
            alertError($(messageBox), 'File too big, maximum 10mb', 3000);
            return false;
        }
        var reader = new FileReader();
        $(input).closest('.box_row_info').find('.loaded_doc').text(messageFile).show();
        c('input.files[0].type');
        c(input.files[0]);
        if (input.files[0].type == '') {
            alertError($(messageBox), 'Unknown format', 3000);
            return false;
        } else {
            reader.onload = function (e) {
                $(input).closest('.box_row_info').removeClass('file_exist').addClass('file_loaded');
                $(input).closest('.box_row_info').find('.upload').text('Replace');
                $(input).closest('.box_row_info').find('.loaded_doc').attr('src', e.target.result);
                $(input).closest('.box_row_info').find('.save_file').show();
            };
        }
        reader.readAsDataURL(input.files[0]);
    }

}

function showSmartSafetyAgreementPopup(el) {
    var header = 'Smart Safety Software Subscription Service Agreement';

    var content = `
        <div class="lease-and-agreement-popup">
            <button class="fast_move" onclick="moveAgreeFast(this);"><i class="fa fa-arrow-down"></i><i class="fa fa-arrow-up"></i></button>
            <div class="service-agreemens-block"></div>
        </div>
        <button class="btn btn-default agreement" onclick="closeSmartSafetyAgreementPopup(this, 0)">I Do Not Agree</button>
        <button class="btn btn-default agreement" style="float:right;" onclick="closeSmartSafetyAgreementPopup(this, 1)">I Agree</button>`;

    showModal(header, content, 'lease-and-agreement-popup', 'modal-lg agreemens-global-modal');

    $('#lease-and-agreement-popup .service-agreemens-block').load('/frontend/pages/agreeSmartSafety.php');
}

function closeSmartSafetyAgreementPopup(el, type = 1) {
        if (type != 1) {
            $('.on').removeClass('active');
            $('.off').addClass('active');
        } else {
            $('.on').addClass('active');
            $('.off').removeClass('active');
        }
        $(el).closest('#lease-and-agreement-popup').remove();
        return false;
}

function saveDriverEdit(el) {
    if (fleetC.checkDemoAccess()) {
        return false;
    }
    var error = 0;
    var box = $(el).closest('.modal').find('.driver_settings_list');

    resetError();
    if (box.find('#dr_name').val().trim() == '') {
        error++;
        alertError(box.find('#dr_name').closest('.box_row_info'), 'First name cannot be empty', 3000);
    } else if (!/^[A-Za-z-']+( [A-Za-z-']+)*$/.test(box.find('#dr_name').val().trim())) {
        error++;
        alertError(box.find('#dr_name').closest('.box_row_info'), 'Enter only Latin letters', 3000);
    } else if (box.find('#dr_name').val().trim().length < 2) {
        error++;
        alertError(box.find('#dr_name').closest('.box_row_info'), 'Min allowed 2 characters', 3000);
    }
    if (box.find('#dr_last').val().trim() == '') {
        error++;
        alertError(box.find('#dr_last').closest('.box_row_info'), 'Last name cannot be empty', 3000);
    } else if (!/^[A-Za-z-']+( [A-Za-z-']+)*$/.test(box.find('#dr_last').val().trim())) {
        error++;
        alertError(box.find('#dr_last').closest('.box_row_info'), 'Enter only Latin letters', 3000);
    }
    if (box.find('#dr_phone').is(':visible')) {
        if (!box.find('#dr_phone').val() || box.find('#dr_phone').val().length !== 12) {
            error++;
            alertError(box.find('#dr_phone').closest('.box_row_info'), 'Phone length must be 10 characters', 3000);
        }
    }
    if (error > 0) {
        return false;
    }
    $(el).parent().find('.save_edit_result').removeClass('confirm').text('');
    var eld = 0;
    var aobrd = 0;
    if (box.find('#dr_eld_new button.active').attr('data-val') == 1) {
        eld = 1;
    } else if (box.find('#dr_eld_new button.active').attr('data-val') == 2) {
        aobrd = 1;
    }
    
    var userId = box.find('#dr_id').val();
    var data = {
        userId: userId,
        name: box.find('#dr_name').val(),
        last: box.find('#dr_last').val(),
        Phone: box.find('#dr_phone').val(),
        SSN: box.find('#dr_ssn').val(),
        EIN: box.find('#dr_ein').val(),
        teamDriver: box.find('#dr_team_driver').val(),
        ELD: eld,
        AOBRD: aobrd,
        hideEngineStatuses: box.find('#hideEngineStatuses button.active').attr('data-val'),
        aobrdAbleToEdit: box.find('#aobrdAbleToEdit button.active').attr('data-val'),
        aobrdManualDrive: box.find('#aobrdManualDrive button.active').attr('data-val'),
        ableEditOnOffSB: box.find('#ableEditOnOffSB button.active').attr('data-val'),
        odometerId: box.find('#dr_odometerId button.active').attr('data-val'),
        checkYesterdayValidDay: box.find('#checkYesterdayValidDay button.active').attr('data-val'),
        showEvents: box.find('#showEvents button.active').attr('data-val'),
        showScannerStatuses: box.find('#showScannerStatuses button.active').attr('data-val'),
        showEngineStatuses: box.find('#showEngineStatuses button.active').attr('data-val'),
        showSignatureEvents: box.find('#showSignatureEvents button.active').attr('data-val'),
        showOdometerAndEngineHours: box.find('#showOdometerAndEngineHours button.active').attr('data-val'),
        adverce_driving: box.find('#showАdverceDriving button.active').attr('data-val'),
        hours_exception: box.find('#showSixteenHoursException button.active').attr('data-val'),
        hideSocial: box.find('#hideSocial button.active').attr('data-val'),
        paperDvir: box.find('#paperDvir button.active').attr('data-val'),
        iftaDistances: box.find('#iftaDistances button.active').attr('data-val') || false,
        canEditTime: $('input[name="canEditTime"]').val(),
        medCardRemind: $('input[name="medCardRemind"]').val(),
        driverLicenseRemind: $('input[name="driverLicenseRemind"]').val(),
        YardMode: box.find('#dr_yardMode button.active').attr('data-val'),
        ConveyanceMode: box.find('#dr_conveyanceMode button.active').attr('data-val'),
        PersonalCycle: box.find('#dr_personalCycle button.active').attr('data-val'),
        PersonalTZ: box.find('#dr_personalTZ button.active').attr('data-val'),
        MedCard: box.find('#dr_med').val() != '' ? convertDateToSQL(box.find('#dr_med').val()) : '0000-00-00',
        DateOfBirth: box.find('#dr_birth').val() != '' ? convertDateToSQL(box.find('#dr_birth').val()) : '0000-00-00',
        HireDate: box.find('#dr_hire').val() != '' ? convertDateToSQL(box.find('#dr_hire').val()) : '0000-00-00',
        TermitaneDate: box.find('#dr_term_date').val() != '' ? convertDateToSQL(box.find('#dr_term_date').val()) : '0000-00-00',
        PullNotice: box.find('#dr_pull').val() != '' ? convertDateToSQL(box.find('#dr_pull').val()) : '0000-00-00',
        HazMat: box.find('#dr_hazmat button.active').attr('data-val'),
        Insurance: box.find('#dr_insur button.active').attr('data-val'),
        TankerEndorsment: box.find('#dr_tank button.active').attr('data-val'),
        State: box.find('#dr_cont_st').val(),
        City: box.find('#dr_cont_city').val(),
        Address: box.find('#dr_cont_addr').val(),
        dr_cont_phone: box.find('#dr_cont_phone').val(),
        Sms: box.find('#dr_cont_sms button.active').attr('data-val'),
        DLNumber: $.trim(box.find('#dr_lic_num').val()),
        DLState: box.find('#dr_lic_st').val(),
        DLExpiration: box.find('#dr_lic_exp').val() != '' ? convertDateToSQL(box.find('#dr_lic_exp').val()) : '0000-00-00',
        notes: box.find('#dr_notes').val(),
        scanner_type: box.find('#scanner_type button.active').attr('data-val')
    };
    $(el).closest('.modal').find('.save_edit').prop('disabled', true);
    saveUserId = userId;

    AjaxCall({url: dashUrl, action: "updateDriversData", data: data, successHandler: updateDriversDataHandler, errorHandler: updateDriversDataErrorHandler});
    function updateDriversDataHandler(response) {
        var SmartSafety = response.data.fields.SmartSafety;

        var userId = response.data.userId;
        var box = $('#user_info_box[data-userid="' + userId + '"]').find('.driver_settings_list');
        alertMessage($(el).parent().find('.save_edit_result'), 'Saved', 3000);
        if ($('#active_drivers').length > 0) {
            var userId = box.find('#dr_id').val();
            var pos = 'Driver';
            if (box.find('#dr_eld_new button.active').attr('data-val') == 1) {
                pos = 'Driver Eld';
            } else if (box.find('#dr_eld_new button.active').attr('data-val') == 2) {
                pos = 'Driver Aobrd';
            }
            var fullName = box.find('#dr_name').val() + ' ' + box.find('#dr_last').val();
            $('#active_drivers tbody tr[data-id="' + userId + '"] td').eq(0).html(createProfilePopupButton(userId, fullName,SmartSafety))
            $('#active_drivers tbody tr[data-id="' + userId + '"] td').eq(3).text(pos)
        }
        $('#user_info_box[data-userid="' + userId + '"]').find('.save_edit').prop('disabled', false);
        if ((window.location.pathname == '/dash/drivers/' || window.location.pathname == '/dash/history/log/') && userId == logbook.userId) {
            logbook.changeLogbook();
        }
    }
    function updateDriversDataErrorHandler(response) {
        var box = $('#user_info_box[data-userid="' + saveUserId + '"]').find('.driver_settings_list');
        if (response.code == '999') {
            if (box.find('#dr_lic_num').is(':visible')) {
                    alertError(box.find('#dr_lic_num').closest('.box_row_info'), response.message, 3000);
            }
        }
//        alertError(box.find('.popup_box_panel .info_box_result'), response.message, 3000);
        $('#user_info_box[data-userid="' + userId + '"]').find('.save_edit').prop('disabled', false);
    }
}

function requestScreenViewForSafety(userId){
    liveUpdateC.subscribeForDriverEvents(userId);
    AjaxCall({url: apiDashUrl, action: "requestScreenView", data: {userId:userId}, successHandler: requestScreenViewForSafetyHandler})
}
function requestScreenViewForSafetyHandler(response){
    showNewModal('responseHandler successHandler', '', `<p class="row__text success">Request sent successfully</p>`, '');

    setTimeout(() => {
        document.querySelector('.section__popup').remove();
    }, 2000);
}

function driverLocation() {
    let className = 'driverLocationModal';
    let title = 'Share geolocation to';
    let footerBtns = `
            <button type="button" class="btns-item btn btn-primary-new" id="copyLink" onclick="copyToClipboard('shareLink'); showCopyAlert()">Copy Link</button>
            <button type="button" class="btns-item btn btn-primary-new" id="shareDriverLocation">Share</button>
            <button type="button" class="btns-item btn btn-default" onclick="document.querySelector('.section__popup').remove()">Close</button>
        `;
    let content = `
            <div class="popup__content-link">
                <input type="text" class="datepicker row__input" id="linkExpiration" onchange="setExpirationDate()">
                <label for="linkExpiration">Link Expiration Date</label>
            </div>
            <div class="popup__content-row email-input">
                <div class="row__content">
                    <input type="text" class="row__input" id="usersEmail" placeholder="Enter user\`s email">
                    <button type="button" class="btn btn-primary-new" onclick="addShareuser()">Add</button>
                </div>
            </div>
            <div class="popup__content-row email-list">
                <div class="row__content"></div>
            </div>
            <div class="popup__content-row social-list">
                <span class="social-text">Messengers:<br>(Download the viber/skype app to your computer to share the link via Viber or Skype)</span>
                <div class="social-items">
                    <a target="blank" href="https://web.telegram.org/" class="social-item">
                        <img src="/dash/assets/img/social/telegram.svg" alt="telegram-ico">
                    </a>
                    <a target="blank" href="viber://pa" class="social-item">
                        <img src="/dash/assets/img/social/viber.svg" alt="viber-ico">
                    </a>
                    <a target="blank" href="https://wa.me/" class="social-item">
                        <img src="/dash/assets/img/social/hangsout.svg" alt="whatsApp-ico">
                    </a>
                    <a target="blank" href="https://www.facebook.com/" class="social-item">
                        <img src="/dash/assets/img/social/facebook.svg" alt="facebook-ico">
                    </a>
                    <a target="blank" href="skype:LOGIN?chat" class="social-item">
                        <img src="/dash/assets/img/social/skype.svg" alt="skype-ico">
                    </a>
                </div>
            </div>
            <div class="popup__content-row share-link"></div>
            <div class="link-life">
                <p><i class="icon-icons-alert-ic-violations"></i>
                This link will be valid for <span id="lifeHours">0</span> hours</p>
            </div>
            <div class="popup__content-row copy-link">
                <p class="copy-link-content">
                    <i class="fa fa-copy" aria-hidden="true"></i> Link copied to clipboard!
                </p>
            </div>
        `;

    showNewModal(className, title, content, footerBtns);

    $(document).find('.driverLocationModal #shareDriverLocation').click(shareDriverLocation);
    $(document).find('.driverLocationModal .datepicker').datetimepicker({dateFormat: 'yy-mm-dd', minDate: new Date()});

    let session = getCookie('session');

    $.ajax({
        type: "POST",
        url: `${CLOUD_EZLOGZ_URL}/user/SignIn/${session}`,
        success: function(response) {
            if (typeof response.token !== 'undefined') {
                localStorage.setItem('token', response.token);
                localStorage.setItem('userRole', response.role);
            }
        },
        error: function(error) {
            console.log(error)
        }
    });
}

function setExpirationDate() {
    let linkExpiration = $('#linkExpiration').val();
    let endDate  = moment(linkExpiration);
    let startDate = moment(moment(new Date));
    let lifeHoursBox = $('#lifeHours');
    let lifeLink = $('.link-life');

    let linkExpirationHours = endDate.diff(startDate, 'hours');

    if (linkExpirationHours > 0) {
        lifeHoursBox.text(linkExpirationHours);
        lifeLink.show();
    } else {
        lifeHoursBox.text('0');
        lifeLink.hide();
    }
}

function showCopyAlert() {
    $('.copy-link').show();
}

function addShareuser() {
    let usersEmail = $('#usersEmail');
    let usersEmailVal = usersEmail.val();
    let emailList = $('.email-list .row__content');

    if (usersEmailVal == '' || !validateEmail(usersEmailVal)) {
        usersEmail.addClass('input--error');
        return false;
    } else {
        usersEmail.removeClass('input--error');
        emailList.append(
            `<div class="email-item">
                <div class="email">${usersEmailVal}</div>
                <div class="delete" onclick="deleteAddedEmail(this)">
                    <i class="icon-icons-editor-ic-close"></i>
                </div>
            </div>`
        );
        usersEmail.val('');
    }
}

function deleteAddedEmail(btn) {
    let emailItem = $(btn).parent();
    emailItem.remove();
}

function shareDriverLocation() {
    let emailList = $('.email-item');
    let scanner = [$('#driverLocation').attr('data-scanner')];
    let lifeHours = $('#lifeHours').text();
    let expirationDate = moment.utc($('#linkExpiration').val()).format();
    let users = [];
    let defaultDate = moment.utc(new Date()).add(1, 'days').format();

    if (emailList.length > 0) {
        $.each(emailList, function(index, item) {
            let email = $(item).find('.email').text();
            users.push(email);
        });
    }

    let data = {
        expirationDate: lifeHours !== '0' ? expirationDate : defaultDate,
        jsonDate: {
            users: users.length > 0 ? users : [],
            scanner
        }
    }

    let token = localStorage.getItem('token');
    let userRole = localStorage.getItem('userRole');

    $.ajax({
        type: "POST",
        url: `${CLOUD_EZLOGZ_URL}/${userRole}/createLink`,
        headers: {
            'Authorization': 'Bearer ' + token
        },
        data: JSON.stringify(data),
        processData: false,
        contentType: 'application/json',
        success: function(response) {
            $('.share-link').html(`
                <a href="https://map.ezlogz.com/map/${response.key}" 
                   target="_blank" 
                   id="shareLink"
                   class="share-link-content">https://map.ezlogz.com/map/${response.key}</a>
            `);
            $('.share-link').show();
            $('.social-list').addClass('active');
            $('#copyLink').show();

        },
        error: function(error) {
            console.log(error)
        }
    });
}