function eldDeviceCard(deviceId, params = {}) {
    var self = this;
    self.params = params;
    self.deviceId = deviceId;
    self.cntrlUrl = apiDashUrl;
    self.modalElement = '';
    self.tableId = 'eldDeviceCard_' + deviceId;
    modalCore(self);

    self.modalId = 'eld_device_card';
    self.modalTitle = 'DEVICE INFO ';
    self.paginator = false;
    self.tabs = [];
    self.returnData = {};
    self.forceSearchParams = [{key: 'deviceId', val: deviceId}]
    self.eldTariffChangeData = '';

    self.initRequest = function () {
        AjaxController('getEldDeviceCardInit', {deviceId: self.deviceId}, self.cntrlUrl, self.init, self.init, true);
    }
    self.init = function (response) {
        self.device = response.data.device;
        self.returnData = response.data.returnData;
        self.generateHeaders();
        self.generateButtons();
        self.createModal();

        self.modalElement.find('.toEzsmart').click(self.toEzsmart)
        self.modalElement.find('.tariffRequestButton').click(self.tariffRequestClick)
        self.modalElement.find('.returnRequestButton').click(self.returnScannerClick)
        self.modalElement.find('.replacementRequestButton').click(self.replaceScannerClick)
        self.modalElement.find('.control-buttons').addClass('blockForDispatcher')
    }
    self.generateHeaders = function () {
        var headers = [];

        var subscriptionTillLine = '';
        if (self.device.status >= 1) {
            var d = new Date();
            d.setMonth(d.getMonth() + 1, 1);
            var time = (new Date(d).getTime() / 1000);
            subscriptionTillLine = '' + (self.device.paid_till > time ? 'Subscription till ' + toDate(self.device.paid_till) : 'Monthly') + '';
        }

        var aobrd = '';
        if (self.device.type == 1)
            aobrd = '(AOBRD)';
        if (self.device.status == 4 && self.device.BLEAddress !== null && self.device.BLEAddress != '') {
            var light = 'green';
        } else if (self.device.status == 4 && (self.device.BLEAddress == null || self.device.BLEAddress == '')) {
            var light = 'orange';
        } else {
            var light = 'red';
        }
        light = '<span class="eld_light " style="width: 6px;height: 6px;background: ' + light + ';display: inline-block;border-radius: 50%;margin-right: 5px;"></span>';
        var statusName = light + getScannerStatusFromStatusId(self.device.status, self.device.params) + '' + aobrd;
        if(self.device.status == 5){//deactivated manually, add till when
            if(typeof self.device.params['deactivateDate'] != 'undefined' && typeof self.device.params['deactivateDays'] != 'undefined'){
                var deactivateFinishDate = moment(self.device.params['deactivateDate'], "YYYY-MM-DD").add(self.device.params['deactivateDays'], 'days').format("MM-DD-YYYY");
                statusName+=' (till '+deactivateFinishDate+')';
            }else{
                statusName+=' (till unknown date)';
            }

        }
        var waiveDeviceDepositFeeBtn = '';
        if (self.device.deposit > 0 && ![9,10,11].includes(self.device.tariffId) && (position === TYPE_SUPERADMIN || (typeof superAdminRights.balance != 'undefined' && superAdminRights.balance == 1))) {
            waiveDeviceDepositFeeBtn = `<button class="btn btn-default btn-xs" onclick="confirmationWaiveDeviceDepositFee('${self.device.id}', '${self.device.userId}', '${self.device.fleet}')" onclick="waiveDeviceDepositFee('${self.device.id}', '${self.device.userId}', '${self.device.fleet}')">Waive Deposit Fee</button>`;
        }
        var orderId = self.device.orderId;
        if (curUserIsEzlogzEmployee()) {
            orderId = `<span style="cursor: pointer;font-weight: bold;" onclick="getOneOrder(this)" data-orderid="${self.device.orderId}">${self.device.orderId}</span>`;
        }
        var macButton = '';
        if (getDisplayValue(self.device.BLEAddress) != '' && (position == TYPE_SUPERADMIN || (typeof superAdminRights.clearMac != 'undefined' && superAdminRights.clearMac == 1)))
            macButton = '<button onclick="deleteMacAddress(' + self.deviceId + ', event)" class="btn btn-default btn-xs ml-1">Delete</button>';
        else if (getDisplayValue(self.device.BLEAddress) == '' && curUserIsEzlogzEmployee())
            macButton = '<div class="bind_box"><button class="btn btn-xs ml-1 btn-default" onclick="selectBindMacNew(' + self.deviceId + ')">Bind Mac</button></div>';

        var deviceTopVersion = '';
        if (parseInt(self.device.updateVersion) > 0 && parseInt(self.device.version) != parseInt(self.device.updateVersion)) {
            deviceTopVersion = '<span title="device need update" class="red"> (' + parseInt(self.device.updateVersion) + ')</span>';
        } else if (parseInt(self.device.updateVersion) == 0 && parseInt(self.device.version) != parseInt(self.device.STABLE_DEVICE_VERSION)) {
            deviceTopVersion = '<span title="device need update" class="red"> (' + parseInt(self.device.STABLE_DEVICE_VERSION) + ')</span>';
        }
        if (position === TYPE_SUPERADMIN || (typeof superAdminRights.deactivate != 'undefined' && superAdminRights.deactivate == 1)) {
            deviceTopVersion += '<button class="btn btn-xs ml-1 btn-default" onclick="setUpdateVersion(' + self.deviceId + ')">Set Update Version</button>'
        }
        headers.push({label: 'Device Id', value: self.deviceId});
        headers.push({label: 'Last Unit', value: getDisplayValue(self.device.truckName)});

        headers.push({label: 'Local Id', value: self.device.localId});
        headers.push({label: 'Last Unit Vin', value: getDisplayValue(self.device.vin)});

        headers.push({label: 'Status', value: statusName});
        headers.push({label: 'Last Driver', value: getDisplayValue(self.device.lastDriverName)});

        headers.push({label: 'Payment Type', value: subscriptionTillLine});
        headers.push({label: 'Order Id', value: orderId});
        c(self.device);
        headers.push({label: 'Tariff', value: self.device.tariff.name + (self.device.eldTariffChangeExist === 1 ? (', changed request tariff "' + self.device.eldTariffChange.tariffName) + '" <button class="btn btn-xs ml-1 btn-default" onclick="eldAdminTariffRequests.btnCancel(' + self.device.eldTariffChange.id + ')">Cancel request</button>' : '')});
        headers.push({label: 'Deposit fee', value: self.device.deposit + ' ' + waiveDeviceDepositFeeBtn, id: 'deviceDepositFeeAmount'});

        headers.push({label: 'Mac Address', value: getDisplayValue(self.device.BLEAddress) + macButton});
        headers.push({label: 'Version', value: getDisplayValue(self.device.version) + deviceTopVersion});
        self.setCardHeaders(headers)
    }
    self.generateButtons = function () {
        var buttons = [];

        var cname = "userId";
        var name = cname + "=";
        var decodedCookie = decodeURIComponent(document.cookie);
        var ca1 = decodedCookie.split(';');
            console.log(ca1.length);
        for(var ii = 0; ii <ca1.length; ii++) {
            var c1 = ca1[ii];
            while (c1.charAt(0) == ' ') {
                c1 = c1.substring(1);
            }
            if (c1.indexOf(name) == 0) {
                var userid1 = c1.substring(name.length, c1.length);
            }
        }
   console.log(userid1);
        if (self.device.status == 3 || self.device.status == 4 || self.device.status == 5 || self.device.status == 8) {

           if( (userid1 == 34719 || userid1==324 || superAdminRights.superwiser) && self.device.BLEAddress!=null && self.device.BLEAddress!==undefined && self.device.BLEAddress!="undefined" && !self.device.BLEAddress.includes("WQ")){

             buttons.push('<button class="btn btn-default toEzsmart">Switch to Ez-smart</button>');
           }
           
            if(self.device.eldTariffChangeExist === 0) {
                buttons.push('<button class="btn btn-default tariffRequestButton">Tariff Change</button>');
            }
            if(self.device.eldTariffChangeExist === 1) {
                buttons.push('<button class="btn btn-default" onclick="eldAdminTariffRequests.btnCancel(' + self.device.eldTariffChange.id + ')">Cancel Change Tariff Request</button>');
            }
            buttons.push('<button class="btn btn-default returnRequestButton">Return Device</button>');
            buttons.push('<button class="btn btn-default replacementRequestButton"  >Replacement Request</button>');
            if (curUserIsClient()) {
                buttons.push('<button class="btn btn-default "  onclick="transferEld(' + self.deviceId + ')">Transfer to another Fleet</button>');
            }
        }
        if (curUserIsClient()) {
            if (self.device.status == 103) {
                getPendingTransfersCallback(self.deviceId, function (response) {
                    var transferData = typeof response.data !== "undefined" && typeof response.data[0] !== "undefined" ? response.data[0] : [];
                    if(response.data.length) {
                        buttons.push('<button class="btn btn-default" onclick="cancelProjectTransferEld(' + self.deviceId + ', \'' + transferData.otherProject + '\', ' + transferData.id + ', \'owner\')">Cancel transfer ELD</button>');
                        self.setCardActionsButtons(buttons);
                    }
                });
            }
            if ((self.device.status >= 0 && self.device.status <= 2) || self.device.status == 10) {
                buttons.push('<button class="btn btn-default" onclick="cancelOrderScanner(' + self.deviceId + ')">Cancel Order Device</button>');
            }
            if (self.device.type == 1) {
                buttons.push('<button class="btn btn-default" onclick="updateOrderScanner(' + self.deviceId + ')">Update to ELD</button>');
            }
            if (self.device.status == 11 && self.returnData.status == 1) { //Approved for Sending
                buttons.push('<button class="btn btn-default" onclick="editDeliveryReturnsScanner(' + self.deviceId + ',' + self.returnData.id + ')">Enter delivery number</button>');
            }
        } else {
            if (self.device.status == 4 && (position == TYPE_SUPERADMIN || curUserId == 8203 || curUserId == 1066)) {
                buttons.push('<button class="btn btn-default" onclick="transferEldToOtherProject(' + self.device.id + ')"  >Transfer to Other Project</button>');
            }
        }
        self.setCardActionsButtons(buttons);

        self.tabs.push({
            label: 'Connect Events',
            cl: 'eld_dev_con',
            request: 'getDeviceConnectEventsPagination',
            handler: 'getDeviceConnectEventsPaginationHandler',
            tableHeader: `<tr>
                <th>Date Time</th>
                <th>Driver</th>
                <th>Version</th>
                <th>Status</th>
            </tr>`
        });

        self.tabs.push({
            label: 'Device History',
            cl: 'eld_dev_his',
            request: 'getDeviceHistoryEventsPagination',
            handler: 'getDeviceHistoryEventsPaginationHandler',
            tableHeader: `<tr>
                <th>Status</th>
                <th>User</th>
                <th>Date Time</th>
            </tr>`
        });
        self.setCardTabs(self.tabs);
    }

    self.getDeviceConnectEventsPaginationHandler = function (response) {
        var tbody = '';
        response.data.result.forEach((item) => {

            var sts = '<span class="driver-scanner-icon ' + (item.type == 0 ? 'eld' : 'aobrd') + (item.statusTypeId == 0 ? ' grey' : ' green') + '"></span>';
            item.dateTime = addHoursToDateTimeString(item.dateTime, -item.userTimeZoneValue);
            tbody += `<tr>
                <td>${timeFromSQLDateTimeStringToUSAString(item.dateTime)}</td>
                <td>${item.driverName}</td>
                <td>${item.version == 0 ? 'No info' : item.version}</td>
                <td>${sts}</td>
            </tr>`;
        });
        self.modalElement.find('#' + self.tableId).find('tbody').html(tbody);
    }

    self.getDeviceHistoryEventsPaginationHandler = function (response) {
        var tbody = '';
        response.data.result.forEach((item) => {
            let actionRow = '';
            if (item.status == 103) {
                if (item.order_info) {
                    let orderType = item.order_info.device_type_id;
                    if (item.scanner_info) {
                        if (item.scanner_info.tariffId == 0 || item.scanner_info.tariffId == 1 || item.scanner_info.tariffId == 2) {
                            orderType = 1;
                        } else if (item.scanner_info.tariffId == 9 || item.scanner_info.tariffId == 10 || item.scanner_info.tariffId == 11) {
                            orderType = 2;
                        }
                    }
                    let listOfButtons = [];
                    if(item.order_info.amount > 0) {
                        listOfButtons.push(`<button type="button" data-orderid="${item.order_info.id}" data-order_type="${orderType}" date-orderdate="${item.dateTime}" data-fleetid="${fleetC.id}" data-scannerid="${item.scannerId}" data-type="saas_agreement" onclick="downloadAllTerms(this, event);">Download SAAS Agreement</button>`);
                        if(orderType == 2) {
                            listOfButtons.push(`<button type="button" data-orderid="${item.order_info.id}" data-order_type="${orderType}" date-orderdate="${item.dateTime}" data-fleetid="${fleetC.id}" data-scannerid="${item.scannerId}" data-type="equipment_lease" onclick="downloadAllTerms(this, event);">Download Equipment Purchase</button>`);
                        } else {
                            listOfButtons.push(`<button type="button" data-orderid="${item.order_info.id}" data-order_type="${orderType}" date-orderdate="${item.dateTime}" data-fleetid="${fleetC.id}" data-scannerid="${item.scannerId}" data-type="equipment_lease" onclick="downloadAllTerms(this, event);">Download Equipment Lease</button>`);
                        }
                        actionRow = addTableActionRow(listOfButtons, 230);
                    }
                }
            }
            var sts = '<span class="driver-scanner-icon ' + (item.type == 0 ? 'eld' : 'aobrd') + (item.statusTypeId == 0 ? ' grey' : ' green') + '"></span>';
            var statusName = getScannerStatusFromStatusId(item.status, item.params);
            var userName = item.userName == null ? 'Auto' : item.userName;
            tbody += '<tr>\n\
                <td>' + statusName + '</td>\n\
                <td>' + userName + '</td>\n\
                <td style="display: flex;align-items: center;">' + timeFromSecToUSAString(item.dateTime) + ' ' + actionRow + '</td>\n\
            </tr>';
        });
        self.modalElement.find('#' + self.tableId).find('tbody').html(tbody);
    }
    self.returnScannerClick = function () {
        self.returnOrderScanner(0)
    }
    self.replaceScannerClick = function () {
        self.returnOrderScanner(1)
    }
    self.returnOrderScanner = function (type = 0) {
        var title = '';
        var inputContent = '';
        if (type == 0) { //Cancellations
            title = 'Return Device';
            inputContent = `<div class="radio cancelation">
            <label>
-                    <input type="radio" name="return_reason" value="0" checked>
-                    Return Device (return fee will be applied)
-                </label>
            </div>
            <div class="radio user_fault">
                <label>
                    <input type="radio" name="return_reason" value="3">
                    Device Broken, User Fault, $199.99 fee
                </label>
                <hr>
                     <label>
                   If you want to cancel device, please download and fill cancellation form (<a style="color:darkred" href="/cancelation_form.pdf"><b>cancellation form</b></a>) and send it to our email support@ezlogz.com for further assistance. 
                </label>
                
            </div>`;
        } else {
            title = 'Replacement Request';
            inputContent = `<div class="radio manuf_defect">
                <label>
                    <input type="radio" name="return_reason" value="2" checked>
                    Warranty replacement
                </label>
            </div>
            <div class="radio user_fault">
                <label>
                    <input type="radio" name="return_reason" value="1">
                    Device Broken, User Fault, $199.99 fee
                </label>
            </div>`;
        }
        var content = `<form id="returnEldForm">
            <div class="form-horizontal">
                <div class="form-group">
                    <label class="col-sm-3 control-label"><span class="text-left">Mac Address:</span></label>
                    <div class="col-sm-9">
                        <p class="form-control-static" id="mac_address">${self.device.BLEAddress !== null ? self.device.BLEAddress : ''}</p>
                    </div>
                </div>
            </div>
            <h3>Reason</h3>
            <div class="form-group" id="returnReason">
                ${inputContent}
            </div>
            <div class="form-group">
                <label for="return_description">Description</label>
                <textarea name="return_description" class="form-control" rows="3" id="return_description"></textarea>
            </div>
        </form>`;
        var footerButtons = `<button id="btnReturnScanner" type="button" class="btn btn-primary" ">Confirm</button>`;
        showModal(title, content, 'returnModal', '', {footerButtons: footerButtons});
        $('#returnModal #btnReturnScanner').click(self.returnELD);
    };
    self.returnELD = function () {
        resetError();
        var no_error = true;
        var $description = $('#returnModal textarea[name="return_description"]');
        var $returnReason = $('#returnModal input[name="return_reason"]:checked');

        if ($returnReason.val().trim() == '') {
            setError($('#returnReason'), 'Check value');
        }
        if ($description.val().trim() == '') {
           setError($description, 'Enter description');
        } else if ($description.val().trim().length > 300) {
           setError($description, 'Max length 300 characters');
        }

        if($('#returnModal form .error').length) {
            return false;
        }

        $('#btnReturnScanner').prop('disabled', true);
        var data = {id: self.deviceId, status: 11, description: $description.val(), returnReason: $returnReason.val()};
        AjaxCall({url: apiDashUrl, action: 'returnEld', data: data, successHandler: self.returnEldHandler, errorHandler: errorReturnEldModalFormHandler});
    }
    self.returnEldHandler = function () {
        $("#returnModal").remove();
        new eldDeviceCard(self.deviceId, {initCallback: function () {
                if (!curUserIsEzlogzEmployee()) {
                    getELDscanners();
                    $('.modal').remove();
                }
                var cl = curUserIsEzlogzEmployee() ? 'client' : 'your';
                showModal('Return Scanner', 'Return request was created, an email with more info was sent to ' + cl + ' email address.');
            }});
    };
self.toEzsmart = function () {
   
    var content = `<form id="ezSmartCahngeForm">
    
       <div class="form-group">
       <p>This device has ` +self.device.deposit+ ` which will be deducted from the price of Ez-smart, to prevent this - do the switch manually</p>
                <label for="tariffs">Ez-smart ID (Mac adress)</label>
                <input name="macAdress" id="macAdress" />
            </div>
              
    </form>`;
      var footerButtons = `<button id="btnEzSmartChange" type="button" class="btn btn-primary btn-lock-double-clicks">Confirm</button>`;

    
       showModal('Switch to Ez-smart', content, 'ezSmartChangeModal', '', {footerButtons: footerButtons});
     $('#btnEzSmartChange').click(self.ezSmartSwitch);
}
    self.tariffRequestClick = function() {
        var content = `<form id="tariffChangeForm">
            <div id="error_place"></div>
            <div class="form-group">
                <label for="tariffs">Tariffs</label>
                <select name="tariffId" class="form-control" id="tariffs" onchange="onchangeTariffShowAgreement()">
                    <option disabled value="-1" selected="selected">- Select tariff -</option>
                </select>
            </div>
            <div class="form-group">
                <label for="tariffs_note">Note</label>
                <textarea name="note" class="form-control" rows="3" id="tariffs_note"></textarea>
            </div>
            <div id="tariffAgreementPlace" class="form-group"></div>
        </form>`;
        var footerButtons = `<button id="btnTariffChange" type="button" class="btn btn-primary btn-lock-double-clicks">Confirm</button>`;
        showModal('Tariff Change', content, 'tariffChangeModal', '', {footerButtons: footerButtons});

        var scannerType = 2;

        $.each(eldTariffs[scannerType], function(key, val) {
            if (checkTariffIsActive(val) && key != 12 && key != 18) {
                $('#tariffs').append('<option value="' + key + '" ' + (self.device.tariffId == key ? 'disabled' : '') + '>' + val.name + '</option>');
            }
        });
        if(curUserIsEzlogzEmployee())
            $('#tariffAgreementPlace').hide();

        $('#tariffChangeModal #btnTariffChange').click(self.tariffChange);
    };
    self.ezSmartSwitch = function(){
       
        
           var form = $('#ezSmartCahngeForm').serializeObject();
       
      // console.log(self.device)
        
        
          
          form.scannerId = self.deviceId;
          form.userId = self.device.lastDriver;
          form.tariffId = self.device.tariffId;
          
          
            $('.btn-lock-double-clicks').prop('disabled', false);
            
              AjaxCall({url: apiDashUrl, action: 'ezSmartChangeTariff', data: form, successHandler: $(".toEzsmart").remove(),  function(){}, errorHandler: function(){}, uniqueRequest: true});
              
              var paymentForm = {};
              paymentForm.amount  = 199.99 - self.device.deposit;
              paymentForm.carrier_id = self.device.fleet;
              paymentForm.chargeCard = 1;
              paymentForm.description = "Ez-smart device price";
              paymentForm.user_id = 0;
              
             // console.log(paymentForm);
              
              paymentFom =  JSON.stringify(paymentForm);
              
             // console.log(paymentForm);
              
              AjaxCall({url: '/db/adminController/', action: 'manualAddDue', data: paymentForm, successHandler:   $('#ezSmartChangeModal').remove(), errorHandler: function(){}, uniqueRequest: true});
    }

    self.tariffChange = function() {
        c(self.device);
        var form = $('#tariffChangeForm').serializeObject();
        form.scannerId = self.deviceId;
        resetError();
        if($('#agreementCheckboxItem').is(':checked') === false && !curUserIsEzlogzEmployee())
            setError($('#tariffChangeForm .lease-and-agreement'), 'Please open and read Equipment Lease and Agreements to be able to finish order');

        if (!form.tariffId)
            setError($('#tariffs'), 'Select Tariff');

        if($('#tariffChangeForm .error').length) {
            return false;
        }
        $('.btn-lock-double-clicks').prop('disabled', false);
        AjaxCall({url: apiDashUrl, action: 'tariffChangeRequest', data: form, successHandler:$('#tariffChangeModal').modal('hide'), errorHandler: self.orderCUEldErrorHandler, uniqueRequest: true});
    };

    this.orderCUEldErrorHandler = function(response) {
        var errorMessage = response.message;
        $('#error_place').append('<div class="error-handler"></div>');
        alertError($('#error_place .error-handler'), errorMessage, 6000);
        $('.btn-lock-double-clicks').prop('disabled', false);
    };

    self.doneTariffChangeRequest = function(response) {
        $('#tariffChangeModal').modal('hide');
        eldAdminTariffRequests.refreshELDData(response);
    };

    self.initRequest();
}

function onchangeTariffShowAgreement() {
    $('#tariffAgreementPlace').empty().append(`<div class="form-group">
        <p>Agree Agreement to finish tariff change process.</p>
        <div class="checkbox lease-and-agreement">
            <label>	
                <input type="checkbox" id="agreementCheckboxItem" onclick="openLeaseAndAgreementPopup(this, 0, ${$('#tariffs').val()});"  title="Only with Eld Devices"> <span >EQUIPMENT LEASE AND SOFTWARE SUBSCRIPTION SERVICE AGREEMENT</span>
            </label>
        </div>
    </div>`);
}

function errorReturnEldModalFormHandler(response) {
    resetError();
    $('#returnEldForm').append('<span class="error-handler response-message">'+response.message+'</span>');
    $('.modal-footer button').removeAttr('disabled');
}

//Buttons click actions
function setUpdateVersionCofnirmHandler(response) {
    var deviceId = response.data.deviceId;
    $('#set_version .close').click();
    new eldDeviceCard(deviceId);
}
function setUpdateVersionCofnirm(deviceId) {
    AjaxController('setUpdateVersion', {deviceId: deviceId, updateVersion: $('#set_version_input').val()}, apiDashUrl, 'setUpdateVersionCofnirmHandler', setUpdateVersionCofnirmHandler, true);
}
function setUpdateVersion(deviceId) {
    var body = `<div class="form-horizontal">
        <div class="form-group ">
            <div class="col-sm-12">
                <label for="set_version_input">Update version</label>
                <input id="set_version_input" class="form-control"/>
            </div>
        </div>
    </div>`;
    showModal('Set device Version', body, 'set_version', '', {footerButtons: `<button class="btn btn-default" onclick="setUpdateVersionCofnirm(${deviceId})">Update</button>`});
}
function cancelOrderScanner(id) {
    AjaxController('getEldScanner', {scannerId: id}, dashUrl, 'orderScannerHandler', errorBasicHandler, true);
}
function updateOrderScanner(id) {
    var jsData = {popupText: 'All drivers assigned to that device will be upgraded to eld.<br>\n\
                    Are you sure you want to upgrade your device?', newStatus: 'updateToELD'};
    AjaxController('getEldScanner', {scannerId: id}, dashUrl, 'orderScannerHandler', errorBasicHandler, true, null, jsData);
}
function orderScannerHandler(response) {
    var scanner = response.data.scanner;
    var jsData = response.jsData;
    var confirmData = [];
    if (typeof jsData.popupText !== 'undefined' && typeof jsData.newStatus !== 'undefined') {
        confirmData = {scannerId: scanner.id, popupText: jsData.popupText, newStatus: jsData.newStatus}
    } else {
        confirmData = getNewStatus(scanner, true)
    }
    confirmModal(confirmData);
}
function confirmModal(data) {
    if (typeof data.scannerId !== 'undefined' || typeof data.popupText !== 'undefined' || typeof data.newStatus !== 'undefined') {
        showModal((data.popupTitle !== 'undefined' && data.popupTitle != '' ? data.popupTitle : 'Order ELD'), '<p class="text-center">' + data.popupText + '</p>', 'basicModal', '', {
            footerButtons: `<button type="button" class="btn btn-primary changeStatus" onclick="changeStatusEld('${data.scannerId}','${data.newStatus}')">Confirm</button>`
        });
    }
}
function getNewStatus(scanner, cancelClass) {
    var newStatus = '';
    var popupText = '';
    var popupTitle = '';
    c('---------------------');
    c(scanner);
    switch (scanner.status)
    {
        case 0:
            newStatus = 9;
            popupText = 'Are you sure you want to cancel the order(s)?';
            break;
        case 1:
            newStatus = 9;
            popupText = 'Are you sure you want to cancel the order(s)? All paid funds will be returned to your fleet balance.';
            break;
        case 2:
            newStatus = 9;
            popupText = 'Are you sure you want to cancel the order(s)? All paid funds will be returned to your fleet balance.';
            break;
        case 3:
            if (cancelClass) {
                newStatus = 9;
                popupText = 'Are you sure you want to cancel the order(s)? All paid funds will be returned to your fleet balance except delivery price and 19.99$ restock fee when we receive scanner(s) back.';
            } else {
                newStatus = 4;
                popupText = 'Are you sure you want to activate the device? After activation you need to go to Fleet -> Drivers and assign ELD/AOBRD Drivers.';
            }
            break;
        case 4:
            newStatus = 5;
            popupText = 'You really want to deactivate the scanner(s) ' + scanner.localId + '?\n\
			After deactivation your scanner(s) will be in working condition till first day of next month, after that monthly payment will be decreased to 6.99$/month. \n\
			The scanner(s) can be reactivated.';
            break;
        case 5:
            newStatus = 4;
            popupText = 'After activation of the scanner(s) ' + scanner.localId + ' \n\
			the amount of $100 will be charged from your balance and scanner(s) will be active immediately.';
            break;
        case 9:
            newStatus = 10;
            popupText = 'The scanner(s) status will be restored if possible.';
            break;
        case 10:
            newStatus = 9;
            popupText = 'Are you sure you want to cancel the restoration process?';
            break;
        case 'removeTransferELD':
            popupTitle = 'Transfer cancel';
            newStatus = 'removeTransferELD';
            popupText = 'Are you sure you want to cancel the transfer process?';
            break;
        case 'approveTransferELD':
            popupTitle = 'Transfer approvement';
            newStatus = 'approveTransferELD';
            popupText = `<div class="row">
            <div class="col-sm-12">
                <p>Agree Agreement to finish Transfer process.</p>
                <div class="checkbox lease-and-agreement">
                    <label>	
                        <input type="checkbox" id="leaseAndAgreementCheckbox" onclick="openLeaseAndAgreementPopup(this, ${scanner.id}, ${scanner.tariffId});"  title="Only with Eld Devices Order"> <span >EQUIPMENT LEASE AND SOFTWARE SUBSCRIPTION SERVICE AGREEMENT</span>
                    </label>
                </div>
            </div>
        </div>`;
            break;
    }
    return {scannerId: scanner.id, newStatus: newStatus, popupText: popupText, popupTitle: popupTitle}
}
function changeStatusEld(scannerId, newStatus) {
    $('.modal').modal('hide');
    $('button.changeStatus').attr('disabled', 'disabled');
    lastAction = 'changeEldStatuses';
    oldStatus = newStatus;
    var data = {id: scannerId, status: newStatus};
    if ($('#eld_type').length > 0) {
        data.type = $('#eld_type').val();
    }
    AjaxController('changeEldStatuses', {data: [data]}, dashUrl, 'basicEldHandler', errorchangeStatusHandler, true);
}
function basicEldHandler(response) {
    c(response);
    if (curUserIsClient()) {
        $('#send_order').attr('disabled', false);
        $('#gifBox').hide();
        if (typeof response.data.terminated !== 'undefined') {
            dc.getUrlContent('/dash/eld/');
            return 0;
        }
        if (response.data != null) {
            if (oldStatus != 'removeTransferELD') {
            loopScanners(response.data);
            } else {
                oldStatus = '';
            }

            if (lastAction == 'orderELD') {
                $('#eld_order_form').hide();
                finances.justPlacedOrder = response.data.length && response.data[0].params.notPaidOrders ? true : false;
                dc.getUrlContent('/dash/finances/');
            }
            resetFormEldOrder();
            checkEldActions();
        } else {
            dc.getUrlContent('/dash/finances/');
        }
        checkPendingTransfers();
    } else {
        var scanner = typeof response.data[0] !== 'undefined' ? response.data[0] : [];
        updateScanner(scanner);
    }
}
function errorchangeStatusHandler(response) {
    alertError($('#basicModal .modal-body'), response.message, 3000);
}
function getScannerButtons(statusId) {
    var buttons = '';
    switch (statusId) {
        case 1:
            buttons = '<button class="btn btn-default create" onclick="showELDpopap(this, event)">Create</button>';
            break;
        case 2:
            buttons = '<button class="btn btn-default send" onclick="showELDpopap(this, event)">Send</button>';
            break;
        case 9:
            buttons = '<button class="btn btn-default terminate" style="font-size: 12px;" onclick="showELDpopap(this, event)">Terminate</button>';
            break;
    }
    ;
    return buttons;
}
function updateScannerAdmin(scanner) {
    var row = $('#admin_manage_eld #eld_table tr[scannerid = "' + scanner.id + '"]'),
            cells = row.find('td');

    row.attr('status', scanner.status),
            row.attr('regid', scanner.registrationNumber);
    var aobrd = '';
    if (scanner.type == 1)
        aobrd = '(AOBRD)';
    if (scanner.status == 4 && scanner.BLEAddress !== null && scanner.BLEAddress != '') {
        var light = 'green';
    } else if (scanner.status == 4 && (scanner.BLEAddress == null || scanner.BLEAddress == '')) {
        var light = 'orange';
    } else {
        var light = 'red';
    }
    light = '<span class="eld_light " style="width: 6px;height: 6px;background: ' + light + ';display: inline-block;border-radius: 50%;margin-right: 5px;"></span>'
    var delButton = '';
    var updownbutton = '';

    if (position == TYPE_SUPERADMIN || (typeof superAdminRights.clearMac != 'undefined' && superAdminRights.clearMac == 1)) {
        delButton = '<button onclick="deleteMacAddress(' + scanner.id + ', event)" class="btn btn-default">Delete</button>';
        if (scanner.BLEAddress == null) {
            delButton = '';
            scanner.BLEAddress = '';
        }
    } else {
        if (scanner.BLEAddress == null) {
            scanner.BLEAddress = '';
        }
    }
    if (position == TYPE_SUPERADMIN || (typeof superAdminRights.clearMac != 'undefined' && superAdminRights.clearMac == 1)) {
        if (scanner.status == 4 && scanner.type == 1) {
            updownbutton = '<button onclick="upToEld(this)" class="btn btn-default" style="width: 110px;padding-left: 2px;padding-right: 2px;">Update to ELD</button>';
        }
    }
    cells.eq(1).html(scanner.BLEAddress + delButton);
    cells.eq(7).html(light + getScannerStatusFromStatusId(scanner.status, scanner.params) + '' + aobrd);
    cells.eq(8).empty().html(getScannerButtons(scanner.status) + updownbutton);
}
function restoreEld(el, e) {
    e.stopPropagation();
    var scannerId = parseInt($(el).closest('tr').attr('scannerid'));
    scanersInfo.lastAction = 'update';
    AjaxController('restoreEld', {scannerId: scannerId}, adminUrl, 'getELDscannersHandler', errorBasicHandler, true);
}
function getEldCard(deviceId, el, e) {
    if (e) {
        e.stopPropagation();
    }
    if (!$(e.target).is("input[type=\"checkbox\"]")) {
        new eldDeviceCard(deviceId);
    }
}
function confirmationWaiveDeviceDepositFee(deviceId, userId = 0, carrierId = 0) {
    var footerButtons = '<button class="btn btn-default btn-onclick-disabled" data-dismiss="modal" onclick="waiveDeviceDepositFee('+ deviceId +','+ userId+','+carrierId +');">Confirm</button>';
    showModal('Confirmation waive fee', '<p class="text-center">Do you really want to<br/> return deposit?</p>', 'confirmationWaiveDeviceDepositFeeModal', '', {footerButtons: footerButtons});
}
function waiveDeviceDepositFee(deviceId, userId = 0, carrierId = 0) {
    $('.btn.btn-onclick-disabled').prop('disabled', true);
    AjaxController('waiveDeviceDepositFee', {deviceId: deviceId, userId: userId, carrierId: carrierId}, adminUrl, 'waiveDeviceDepositFeeHandler', function () {
        new eldDeviceCard(deviceId);
    }, true);
}
function waiveDeviceDepositFeeHandler(response) {
    if (response.data.deposit === true)
        $('#deviceDepositFeeAmount').text('0.00');
    $('#confirmationWaiveDeviceDepositFeeModal').modal('hide').remove();
}
//Transfer ELD
function transferEld(id) {
    if(fleetC.checkDemoAccess()){return false;}
    var body = `<h3 class="text-center">Service transfer ELD cost ${moneyFormat(ELD_TRANSFER_PRICE)}</h3>
        <form id="transferEldForm">
            <input type="hidden" name="eldId" value="${id}">
            <div class="form-group">
                <label for="reg_dr_role">SELECT CARRIER</label>
                <select name="carrier_role" class="form-control" id="reg_dr_role" onchange="changeTransferRole(this)">
                    <option value="1">Solo Driver ELD</option>
                    <option value="2" selected="selected">Fleet</option>
                </select>
            </div>
        </form>
    `;
    var footerButtons = '<button type="button" class="btn btn-default" data-pay="0" onclick="btnConfirmTransferEld(this)">Confirm</button>';
    if (curUserIsClient()) {
        footerButtons += '<button type="button" class="btn btn-default" data-pay="1" onclick="btnConfirmTransferEld(this)">Confirm and Pay</button>';
    }
    showModal('Transfer ELD', body, 'transferEld', '', {footerButtons: footerButtons});
    $('#transferEldForm select[name="carrier_role"]').trigger('change');
}
function transferEldToOtherProject(id) {
    var body = `<h3 class="text-center">Service transfer ELD cost ${moneyFormat(ELD_TRANSFER_PRICE)}</h3>
        <form id="transferEldForm">
            <input type="hidden" name="eldId" value="${id}">
            <div class="form-group">
                <label for="transfer_project">Select Projet</label>
                <select name="transfer_project" class="form-control" id="transfer_project" >
                    <option value="0">Select Project</option>
                    <option value="EZLOGZ">Ezlogz</option>
                    <option value="LOGIT">LogIT ELD</option>
                </select>
            </div>
        </form>
    `;
    var footerButtons = '<button type="button" class="btn btn-default" onclick="btnConfirmTransferEldToOtherProject()">Confirm</button>';
    showModal('Transfer ELD', body, 'transferEld', '', {footerButtons: footerButtons});
}
function btnConfirmTransferEldToOtherProject(){
	var $form = $('#transferEldForm');
    var $transfer_project = $form.find('select[name="transfer_project"]');

    if ($transfer_project.val() == '0')
        setError($transfer_project, 'Select Project');
    
    if ($form.find('.error').length)
        return false;

    var data = {};
    jQuery.each($form.serializeArray(), function (i, field) {
        data[field.name] = field.value;
    });
	AjaxController('transferEldToOtherProject', data, apiAdminUrl, 'transferEldToOtherProjectHandler', transferEldToOtherProjectErrorHandler, true);
}
function transferEldToOtherProjectHandler(response){
	$('#transferEld').find('button.close').click()
	$('#eld_device_card').find('button.close').click()
	if(window.location.pathname == '/dash/eld/'){
		$('.pg_pagin[data-table="eld_table"] .pagin_per_page').change()
	}
	showModal('Transfer ELD', 'Device transfer request successfully created, client can accept transfer in the new project');
}
function transferEldToOtherProjectErrorHandler(response){
	alertError($('#transferEldForm'), response.message, 3000);
}
function changeTransferRole(obj) {
    $('#formGroupUsdot, #formGroupEmail').remove();
    if ($(obj).val() == 1) {
        $('#transferEldForm').append(`<div class="form-group" id="formGroupEmail">
            <label for="inputEmail">Email</label>
            <input type="text" name="email" class="form-control" id="inputEmail" placeholder="Email"/>
        </div>`);
    } else if ($(obj).val() == 2) {
        $('#transferEldForm').append(`<div class="form-group" id="formGroupUsdot">
            <label for="inputUsdot">USDOT #</label>
            <input type="text" name="usdot" id="inputUsdot" class="form-control"  maxlength="10" data-mask="0000000000" placeholder="USDOT #"/>
        </div>`);
        $('#inputUsdot').mask('000000000');
    }
}
function btnConfirmTransferEld(e) {
    var pay = $(e).data('pay');
    resetError();
    var $form = $('#transferEldForm');
    var $email = $form.find('input[name="email"]'),
        $usdot = $form.find('input[name="usdot"]');

    if (!validateEmail($email.val()))
        setError($email, 'Enter valid email');
    else if ($email.val().length > 75)
        setError($email, 'Max allowed 75 characters');

    if (!$usdot.val())
        setError($usdot, 'Enter USDOT number');
    else if (!/^[0-9]*$/.test($usdot.val()))
        setError($usdot, 'Enter only numbers');

    if ($form.find('.error').length)
        return false;

    $(e).attr('disabled', true);

    var data = {};
    jQuery.each($form.serializeArray(), function (i, field) {
        data[field.name] = field.value;
    });

    if (pay == 1)
        AjaxController('checkToTransferEld', data, dashUrl, 'checkToTransferEldHandler', errorTransferEldHandler, true);
    else
        AjaxController('transferEld', data, dashUrl, 'transferEldHandler', errorTransferEldHandler, true);
}
function checkToTransferEldHandler(response) {
    $('.modal').modal('hide');
    c(response);
    if (response.data.eldId) {
        payTransferScanner(response.data);
    }
}
function transferEldHandler() {
    if (typeof getELDscanners != 'undefined')
        getELDscanners();
    $('#basicModal').remove();
    showModal('ELD transfer request successful', '<h3 class="text-center"> Your ELD transfer is waiting for approval</h3>');
    $('#eld_device_card').remove();
    $('#transferEld button').attr('disabled', false);
}

function errorTransferEldHandler(response) {
    $('#transferEld button').attr('disabled', false);
    alertError($('#transferEldForm'), response.message, 3000);
}
function approveTransferEld(id) {
    var scanner = {id: id, status: 'approveTransferELD'};
    confirmModal(getNewStatus(scanner, false));
}
function cancelTransferEld(id) {
    var scanner = {id: id, status: 'removeTransferELD'};
    confirmModal(getNewStatus(scanner, false));
}
function getPendingTransfersCallback(scanner_id, callback) {
    AjaxController('getPendingTransfers', {scanner_id: scanner_id}, dashUrl, callback, errorTransferEldHandler, true);
}

function checkPendingTransfers() {
    AjaxController('getPendingTransfers', {type: 'to'}, dashUrl, 'checkPendingTransfersHandler', errorTransferEldHandler, true);
}
function checkPendingTransfersHandler(response) {
    $('#btnGetPendingTransfers').remove();
    if (response.data.length) {
        $('#manage_eld .btn-block-manage-eld').prepend('<button id="btnGetPendingTransfers" type="button" class="btn btn-primary" onclick="getPendingTransfers()">Pending Transfers</button>');
    }
}

function getPendingTransfers() {
    AjaxController('getPendingTransfers', {type: 'to'}, dashUrl, 'pendingTransfersHandler', errorTransferEldHandler, true);
}

function pendingTransfersHandler(response) {
    c(response);
    if (!response.data.length) {
        showModal('Pending Transfer ELD ', '', 'basicModal');
        alertMessage($('#basicModal .modal-body'), 'No ELD Transfers Found');
        return false;
    }

    var tr = '';
    $.each(response.data, function (i, transfer) {
        tr += `<tr data-scannerid="${transfer.scannerId}" data-status="${transfer.status}">
            <td>${transfer.scannerId}</td>
            <td>${transfer.fleetOrUserName}</td>
            <td>${toDateTime(parseInt(transfer.dateTime) + timeOffset)}</td>
            <td>${transfer.BLEAddress != null ? transfer.BLEAddress : 'Empty'}</td>
            <td>
                    <button type="button" class="btn btn-sm btn-primary" onclick="approveTransferEld(${transfer.scannerId})">Approve</button>
                    <button type="button" class="btn btn-sm btn-default" onclick="cancelTransferEld(${transfer.scannerId})">Cancel</button>
            </td>
        </tr>`;
    });
    var body = `<table class="table table-dashboard table-sm" id="tablePendingTransfersEld">
        <thead>
            <tr>
                <th style="width: 100px;">ID</th>
                <th style="width: 30%">(USDOT) Fleet / (Email) User</th>
                <th>Date</th>
                <th>Mac Address</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody>
        ${tr}
        </tbody>
    </table>`;

    showModal('Pending Transfer ELD ', body, 'basicModal');
    $('#basicModal .modal-dialog').addClass('modal-lg');
}




function returnELD(scannerId) {
    resetError();
    var no_error = true;
    var $description = $('#returnModal textarea[name="return_description"]');
    var $returnReason = $('#returnModal input[name="return_reason"]:checked');
    if (scannerId == null || typeof scannerId == 'undefined' || scannerId == '') {
        no_error = setError($('#returnModal form'), 'Scanner not found');
    }
    if ($returnReason.val().trim() == '') {
        no_error = setError($('#returnReason'), 'Check value');
    }
    if ($description.val().trim() == '') {
        no_error = setError($description, 'Enter description');
    } else if ($description.val().trim().length > 300) {
        no_error = setError($description, 'Max length 300 characters');
    }
    if (no_error == true) {
        $('#btnReturnScanner').prop('disabled', true);
        var data = {id: scannerId, status: 11, description: $description.val(), returnReason: $returnReason.val()};
        AjaxController('changeEldStatuses', {data: [data]}, dashUrl, 'returnEldHandler', errorBasicHandler, true);
    }
}
function returnEldHandler(response) {
    if ($('#device_info_box').length > 0) {//from device card
        $('#device_info_box').remove();
        getEldCard(response.data[0].id, false, false)
    } else {//from eld page(to remove in future - need to be always from the card)
        getELDscanners();
    }

    $('.modal').modal('hide');
    var cl = curUserIsEzlogzEmployee() ? 'client' : 'your';
    showModal('Return Scanner', 'Return request was created, an email with more info was sent to ' + cl + ' email address.');
}
