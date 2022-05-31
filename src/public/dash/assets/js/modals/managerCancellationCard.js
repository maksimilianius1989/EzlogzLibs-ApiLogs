function managerCancellationCard(returnId, params = {}) {
    var self = this;
    //changable part
    self.cntrlUrl = adminUrl;
    self.returnId = returnId;
    self.tableId = 'managerCancellationCard_' + self.returnId;
    self.modalId = 'manager_cancellation_modal_card';
    self.modalTitle = 'Cancellation ELD Info #' + self.returnId;
    self.forceSearchParams = [{key: 'returnId', val: self.returnId}]
    //some additional init params
    self.returnData = {};
    self.returnAdditionalParams = {};

    //not changable part
    self.params = params;
    self.modalElement = '';

    self.paginator = false;
    self.tabs = [];
    self.returnStatuses = {
        0: 'New',
        1: 'Approved for Sending',
        2: 'Rejected',
        3: 'Sending',
        4: 'Delivery Confirmed',
        5: 'New - Updated by Support',
        6: 'Replace device binded, closed'
    };
    self.colorReturnStatuses = colorReturnStatuses;
    self.returnReasons = {
        0: 'Cancellation (return fee will be applied)',
        1: 'User Fault',
        2: 'Manufacturing Defect',
        3: 'Cancellation (User Fault or Manufacturing Defect)'
    };

    self.initRequest = function () {
        AjaxController('getEldReturnInit', {returnId: self.returnId}, self.cntrlUrl, self.init, self.init, true);
    };
    self.init = function (response) {
        c(response);
        modalCore(self);
        //retrieving init response
        self.returnData = response.data.result;
        self.returnAdditionalParams = typeof response.data.result.additionalParams !== 'undefined' && response.data.result.additionalParams !== null ? response.data.result.additionalParams : [];

        //always call
        self.generateHeaders();
        self.generateButtons();
        self.createModal();

        //additional clicks
        self.initEvents();
    };
    self.initEvents = function () {
        self.modalElement.find('#changeDeliveryInfo').click(self.changeDeliveryInfoClick);
        self.modalElement.find('#changeDeliveryInfoCancel').click(self.changeDeliveryInfoCancelClick);
        self.modalElement.find('#changeDeliveryInfoSave').click(self.changeDeliveryInfoSaveClick);
        // self.modalElement.find('#btnConfirmationReturnStatus').click(self.changeReturnsEldStatus);
    };
    self.generateHeaders = function () {
        var headers = [];

        headers.push({label: 'Scanner ID', value: self.returnData.scannerId});
        var userInfo = `<span class="global_carrier_info clickable_item" title="User Info" data-userid="${self.returnData.userId}" onclick="getOneUserInfo(this, event);" style="cursor: pointer;">${self.returnData.user_info}</span>`;
        headers.push({label: 'User', value: userInfo});
        if(self.returnData.soloOrFleet === 2 && self.returnData.fleet_usdot !== null) {
            var carrierInfo = `<span class="global_carrier_info clickable_item" title="Carrier Info" data-carrid="${self.returnData.carrierId}" onclick="actionGlobalgetOneCarrierInfo(this, event);" style="cursor: pointer;">${self.returnData.fleet_usdot}</span>`;
            headers.push({label: 'Carrier', value: carrierInfo});
        }
        headers.push({label: 'Date Time', value: timeFromSecToUSAString(self.returnData.dateTime)});
        var isComment = self.returnData.supportComment !== null ? '- Updated by Support' : '';
        headers.push({label: 'Status', value: `<span class="label ${self.colorReturnStatuses[self.returnData.status]}">${self.returnStatuses[self.returnData.status]}</span> ${isComment}`});
        headers.push({label: 'User Message', value: self.returnData.description !== null && self.returnData.description !== '' ? self.returnData.description : ''});
        if (self.returnData.status > 0) {
            var changeDeliveryInfo = ' <button id="changeDeliveryInfo" class="btn btn-default btn-xs"><i class="fa fa-edit"></i></button>';
            changeDeliveryInfo += ' <button id="changeDeliveryInfoCancel" class="btn btn-default btn-xs" style="display:none">Cancel</button>';
            changeDeliveryInfo += ' <button id="changeDeliveryInfoSave" class="btn btn-default btn-xs" style="display:none">Save</button>';
            headers.push({label: 'Delivery Info', value: '<span id="deliveryInfoEditPlace">' + (self.returnData.delivery_info !== null && self.returnData.delivery_info !== '' ? self.returnData.delivery_info : '') + '</span>' + changeDeliveryInfo});
        }

        if (self.returnData.status === 4 && typeof self.returnAdditionalParams.new_scanner === 'undefined') {
            if (self.returnData.returnReason === 1) {
                headers.push({label: 'Bind Info', value: 'Create new replacement device and add it into order. Broken device replacement due is $199.99'});
            } else if (self.returnData.returnReason === 2) {
                headers.push({label: 'Bind Info', value: 'Create new replacement device and add it into order'});
            }
        }
        if (typeof self.returnData.returnReason !== 'undefined') {
            headers.push({label: 'Reason', value: self.returnReasons[self.returnData.returnReason]});
        }
        if (typeof self.returnAdditionalParams.new_scanner !== 'undefined') {
            headers.push({label: 'Replacement device ID', value: self.returnAdditionalParams.new_scanner});
        }
        if (typeof self.returnAdditionalParams.reimbursement !== 'undefined') {
            headers.push({label: 'Reimbursement for a device', value: self.returnAdditionalParams.reimbursement});
        }
        self.setCardHeaders(headers);
    };
    self.generateButtons = function () {
        var buttons = [];
        if ($.inArray(self.returnData.status, [0, 1, 3, 5]) > -1 && self.returnAdditionalParams && typeof self.returnAdditionalParams.new_scanner === 'undefined') {
            buttons.push(`<button class="btn btn-default" onclick="rejectEldSend(${self.returnData.scannerId}, ${self.returnData.id})">Reject</button>`);
        }
        if (self.returnData.status === 1) {
            buttons.push(`<button class="btn btn-default" onclick="eldSend(${self.returnData.scannerId}, ${self.returnData.id})">Send (User action)</button>`);
        }
        if (self.returnData.status === 0 || self.returnData.status === 5) {
            buttons.push(`<button class="btn btn-default" onclick="confirmEldSend(${self.returnData.scannerId}, ${self.returnData.id})">Confirm to send</button>`);
        } else if (self.returnData.status === 3) {
            buttons.push(`<button class="btn btn-default" onclick="confirmDeliveryEldSend(${self.returnData.scannerId}, ${self.returnData.id})">Delivery Confirmed</button>`);
        }
        if($.inArray(self.returnData.status, [0, 1, 2, 3, 4, 5]) > -1){
            buttons.push(`<button class="btn btn-default" onclick="supportReturnComment(${self.returnData.id})">Support Comment</button>`);
        }
        self.setCardActionsButtons(buttons);

        self.tabs.push({
            label: 'Cancellation History',
            cl: 'return_eld_his',
            request: 'getEldCancellationHistoryModalPagination',
            handler: 'getEldCancellationHistoryModalPaginationHandler',
            tableHeader: `<tr>
                <th>Date Time</th>
                <th>Scanner ID</th>
                <th>User</th>
                <th>Status</th>
            </tr>`
        });

        self.tabs.push({
            label: 'Support Comments',
            cl: 'return_comment_his',
            request: 'getManagerSupportReturnComment',
            handler: 'getManagerSupportCancellationCommentHandler',
            tableHeader: `<tr>
                <th>Date Time</th>
                <th>Scanner ID</th>
                <th>User</th>
                <th>Status</th>
                <th>Comment</th>
            </tr>`
        });
        self.setCardTabs(self.tabs);
    };

    self.getEldCancellationHistoryModalPaginationHandler = function (response) {
        var tbody = '';
        response.data.result.forEach((item) => {
            var isComment = item.supportComment !== null ? '- Updated by Support' : '';
            tbody += `<tr>
                <td>${timeFromSecToUSAString(item.dateTime)}</td>
                <td>${item.scannerId}</td>
                <td>${item.name+ ' ' +item.last + item.userEmail}</td>
                <td><span class="label ${self.colorReturnStatuses[item.status]}">${self.returnStatuses[item.status]}</span> ${isComment}</td>
            </tr>`;
        });
        self.modalElement.find('#' + self.tableId).find('tbody').html(tbody);
    };
    self.getManagerSupportCancellationCommentHandler = function (response) {
        var tbody = '';
        response.data.result.forEach((item) => {
            var isComment = item.supportComment !== null ? '- Updated by Support' : '';
            tbody += `<tr>
                <td>${timeFromSQLDateTimeStringToUSAString(item.dateTimeComment)}</td>
                <td>${item.scannerId}</td>
                <td>${item.name+ ' ' +item.last + item.userEmail}</td>
                <td><span class="label ${self.colorReturnStatuses[item.status]}">${self.returnStatuses[item.status]}</span> ${isComment}</td>
                <td>${item.supportComment !== null ? item.supportComment.replace(/\r\n|\n|\r/g, '<br />') : ''}</td>
            </tr>`;
        });
        self.modalElement.find('#' + self.tableId).find('tbody').html(tbody);
    };

    /**
     * Edit Delivery
     */
    self.changeDeliveryInfoSaveClick = function () {
        var deliveryInfo = $('#inputDeliveryInfo').val();
        AjaxController('updateReturnsDeliveryNumber', {returnId: self.returnId, delivery_info: deliveryInfo}, adminUrl, self.updateReturnsHandler, errorBasicHandler, true);
    };
    self.changeDeliveryInfoCancelClick = function () {
        $(this).parent().find('#inputDeliveryInfo').remove();
        $(this).parent().find('#deliveryInfoEditPlace, #changeDeliveryInfo').show();
        $(this).parent().find('#changeDeliveryInfoCancel, #changeDeliveryInfoSave').hide();
    };
    self.changeDeliveryInfoClick = function () {
        $(this).parent().find('#deliveryInfoEditPlace, #changeDeliveryInfo').hide();
        $(this).parent().find('#changeDeliveryInfoCancel, #changeDeliveryInfoSave').show();
        $(this).parent().find('#inputDeliveryInfo').remove()
        $(this).parent().prepend('<input id="inputDeliveryInfo" class="form-control input-sm" style="width: 170px; display: inline-block;"/>');
        $(this).parent().find('#inputDeliveryInfo').val(self.returnData.delivery_info !== null && self.returnData.delivery_info !== '' ? self.returnData.delivery_info : '');
    };
    self.updateReturnsHandler = function () {
        $(this).closest('.modal').remove();
        self.initRequest();
    };

    self.initRequest();
}

function actionGetOneManagerCancellationsInfo(el) {
    var id = 'null';
    if ($.isNumeric(el)) {
        id = el;
    } else {
        id = $(el).attr('data-id');
    }
    new managerCancellationCard(id);
}





// TODO: NEED CREATE CLASS ReturnController.js
function supportReturnComment(returnId) {
    var content = `<form id="supportReturnCommentForm">
       <div class="form-group">
            <label for="return_description">Support Comment</label>
            <textarea name="support_comment_text" class="form-control" rows="3" id="supportCommentText"></textarea>
        </div>
    </form>`;
    var btn = `<button type="button" class="btn btn-default" onclick="saveSupportReturnComment(${returnId})">Save</button>`;
    showModal('New support comment', content, 'supportReturnCommentModal', '', {footerButtons:btn});
}
function saveSupportReturnComment(returnId) {
    $('#supportCommentText').val();
    resetError();
    var no_error = true;
    if ($('#supportCommentText').val().trim() == '') {
        no_error = setError($('#supportCommentText'), 'Enter comment');
    } else if ($('#supportCommentText').val().trim().length > 600) {
        no_error = setError($('#supportCommentText'), 'Max length 600 characters');
    }
    if (no_error == true) {
        AjaxController('saveSupportReturnComment', {returnId: returnId, status: 5, comment: $('#supportCommentText').val()}, adminUrl, refreshReturnHandler, errorBasicHandler, true);
    }
}

function refreshReturnHandler(response) {
    $('.modal').modal('hide').remove();
    new managerCancellationCard(response.data.returns.id);
    if(typeof pagination !== 'undefined') {
        pagination.request();
    }
}
function changeReturnsEldStatus(returnId, newStatus) {
    $('.modal').modal('hide');
    AjaxController('changeReturnsEldStatus', {returnId: returnId, status: newStatus}, adminUrl, refreshReturnHandler, errorBasicHandler, true);
}
function eldSend(id, returnId) {
    resetError();
    if ($('#deliveryInfoEditPlace').text() == '') {
        showModal('Message', '<p class="text-center">Please insert delivery info</p>');
    } else {
        var popupText = 'Go to "Sending" status as user?';
        confirmReturnsModal({scannerId: id, returnId: returnId, popupText: popupText, popupTitle: 'Confirm sending ELD', newStatus: 3});
    }
}
function confirmEldSend(id, returnId) {
    var popupText = 'Device postal delivery details email will be sent to user.';
    confirmReturnsModal({scannerId: id, returnId: returnId, popupText: popupText, popupTitle: 'Confirm to send ELD', newStatus: 1});
}
function rejectEldSend(id, returnId) {
    var popupText = 'The client will be sent an email, with a rejection to receive the device.';
    confirmReturnsModal({scannerId: id, returnId: returnId, popupText: popupText, popupTitle: 'Reject receive ELD', newStatus: 2});
}
function confirmDeliveryEldSend(id, returnId) {
    var popupText = 'Confirm ELD delivery?';
    confirmReturnsModal({scannerId: id, returnId: returnId, popupText: popupText, popupTitle: 'Confirm ELD delivery', newStatus: 4});
}
function confirmReturnsModal(data) {
    if (typeof data.scannerId === 'undefined' || typeof data.popupText === 'undefined' || typeof data.newStatus === 'undefined' || typeof data.returnId === 'undefined') {
        return 0;
    }
    var btn = `<button type="button" class="btn btn-default" onclick="changeReturnsEldStatus(${data.returnId}, ${data.newStatus})">Confirm</button>`;
    showModal((typeof data.popupTitle !== 'undefined' ? data.popupTitle : 'ELD'), `<p class="text-center">${data.popupText}</p>`, 'returnModal', '', {footerButtons:btn});
}