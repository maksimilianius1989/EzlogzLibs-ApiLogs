function managerRefundCard(refundId, params = {}) {
    if(!curUserIsEzlogzEmployee()) {
        return '';
    }
    var self = this;
    //changable part
    self.cntrlUrl = financesUrl;
    self.refundId = refundId;
    self.tableId = 'refundManagerCard_' + self.refundId;
    self.modalId = 'refund_manager_modal_card';
    self.modalTitle = 'Refund Info #' + self.refundId;
    self.forceSearchParams = [{key: 'refundId', val: self.refundId}];
    //some additional init params
    self.refundData = {};
    self.authorizeClientData = {};
    self.colorRefundStatuses = {
        0:'label-default',
        1:'label-info',
        2:'label-warning',
        3:'label-danger',
        4:'label-success',
    };

    //not changable part
    self.params = params;
    self.modalElement = '';
    modalCore(self);
    self.paginator = false;
    self.tabs = [];

    self.initRequest = function () {
        AjaxController('getRefundCardInit', {refundId: self.refundId}, self.cntrlUrl, self.init, self.init, true);
    };
    self.init = function (response) {
        //retrieving init response
        self.refundData = response.data.refund;

        //always call
        self.generateHeaders();
        self.generateButtons();
        self.createModal();

        //additional clicks
        self.modalElement.find('.someButton').click(self.someButtonClick)
    };
    self.generateHeaders = function () {
        var headers = [];
        headers.push({label: 'Date Time', value: timeFromSQLDateTimeStringToUSAString(self.refundData.dateTime)});
        var isComment = self.refundData.supportComment !== null ? '- Updated by Support' : '';
        headers.push({label: 'Status', value: `<span class="label ${self.colorRefundStatuses[self.refundData.status]}">${refund.refundStatuses[self.refundData.status]}</span> ${isComment}`});
        headers.push({label: 'Amount', value: moneyFormat(self.refundData.amount)});
        if(self.refundData.paymentSys !== null) {
            headers.push({label: 'Payment System', value: finances.paymentSystems[self.refundData.paymentSys]});
        } else {
            headers.push({label: 'Info', value: 'Old Refund'});
        }
        headers.push({label: 'Reason', value: self.refundData.reason});
        self.setCardHeaders(headers);
    };
    self.generateButtons = function () {
        var buttons = [];
        if(self.refundData.status === 0) {
            buttons.push(`<button type="button" class="btn btn-default" onclick="refund.btnRefundApprove(${self.refundId})">Approve</button>`);
        }
        if (self.refundData.status === 0 || self.refundData.status === 1) {
            buttons.push(`<button type="button" class="btn btn-default" onclick="refund.btnRefundAdminReject(${self.refundId})">Reject</button>`);
        }
        if(self.refundData.paymentSys === 2 && self.refundData.status === 1 && position === TYPE_SUPERADMIN) {
            buttons.push(`<button type="button" class="btn btn-default" onclick="refund.btnRefundToCreditCard(${self.refundId})">Refund</button>`);
        }
        if($.inArray(self.refundData.status, [0, 1, 2, 3, 4]) > -1){
            buttons.push(`<button class="btn btn-default" onclick="supportRefundComment(${self.refundData.id})">Support Comment</button>`);
        }
        self.setCardActionsButtons(buttons);

        self.tabs.push({
            label: 'Refund History',
            cl: 'cl_refund_history',
            request: 'getManagerRefundsHistoryPagination',
            handler: 'getManagerRefundsHistoryPaginationHandler',
            tableHeader: `<tr>
                <th>Date Time</th>
                <th>User</th>
                <th>Status</th>
            </tr>`
        });
        self.tabs.push({
            label: 'Refund Transactions',
            cl: 'cl_refund_transactions',
            request: 'getRefundTransactionPagination',
            handler: 'getRefundTransactionPaginationHandler',
            tableHeader: `<tr>
                <th>Invoice Date</th>
                <th>Invoice Number</th>
                <th>Transaction</th>
                <th>Credit</th>
                <th>Card Number</th>
                <th>Status</th>
                <th>Description</th>
                <th>Paid</th>
                <th>Amount</th>
            </tr>`
        });
        self.tabs.push({
            label: 'Support Comments',
            cl: 'refund_comment_his',
            request: 'getManagerSupportRefundComment',
            handler: 'getManagerSupportRefundCommentHandler',
            tableHeader: `<tr>
                <th>Date Time</th>
                <th>Refund ID</th>
                <th>User</th>
                <th>Status</th>
                <th>Comment</th>
            </tr>`
        });
        self.setCardTabs(self.tabs);
    };

    self.getManagerRefundsHistoryPaginationHandler = function (response) {
        var tbody = '';
        response.data.result.forEach((item) => {
            var isComment = item.supportComment !== null ? '- Updated by Support' : '';
            tbody += `<tr> 
                <td>${timeFromSQLDateTimeStringToUSAString(item.dateTime)}</td>
                <td>${item.userName}</td>
                <td><span class="label ${self.colorRefundStatuses[item.historyStatus]}">${refund.refundStatuses[item.historyStatus]}</span> ${isComment}</td>
            </tr>`;
        });
        self.modalElement.find('#' + self.tableId).removeClass('table-actions-block').find('tbody').html(tbody);
    };
    self.getRefundTransactionPaginationHandler = function (response) {
        var tbody = '';
        response.data.result.forEach((item) => {
            var cardNumber = '';
            if (item.paymentParams != 'null' && item.paymentParams != null) {
                var paymentParams = JSON.parse(item.paymentParams);
                cardNumber = paymentParams.cardNum.substr(paymentParams.cardNum.length - 8);
            } else if (item.data == 'Manager Pay Invoice' && item.paymentSys == 2 && item.paymentData.creditCardNumber != undefined) {
                cardNumber = item.paymentData.creditCardNumber.substr(item.paymentData.creditCardNumber.length - 8);
            }
            tbody += `<tr> 
                <td>${timeFromSQLDateTimeStringToUSAString(item.dateTime)}</td>
                <td>${item.invoiceId}</td>
                <td>${item.transactionId}</td>
                <td>${paymentSystems[item.paymentSys]}</td>
                <td>${cardNumber}</td>
                <td>${refund.authorizeTransactionSatuses[item.status]}</td>
                <td>${item.description}</td>
                <td>${item.userName}</td>
                <td>${item.amount}</td>
            </tr>`;
        });
        self.modalElement.find('#' + self.tableId).removeClass('table-actions-block').find('tbody').html(tbody);
    };

    self.getManagerSupportRefundCommentHandler = function (response) {
        var tbody = '';
        response.data.result.forEach((item) => {
            var isComment = item.supportComment !== null ? '- Updated by Support' : '';
            tbody += `<tr>
                <td>${timeFromSQLDateTimeStringToUSAString(item.dateTimeComment)}</td>
                <td>${item.id}</td>
                <td>${item.name+ ' ' +item.last + item.userEmail}</td>
                <td><span class="label ${self.colorRefundStatuses[item.status]}">${refund.refundStatuses[item.status]}</span> ${isComment}</td>
                <td>${item.supportComment !== null ? item.supportComment.replace(/\r\n|\n|\r/g, '<br />') : ''}</td>
            </tr>`;
        });
        self.modalElement.find('#' + self.tableId).find('tbody').html(tbody);
    };
    self.initRequest();
}


function actionGetOneManagerRefundInfo(el) {
    var refundId = 'null';
    if ($.isNumeric(el)) {
        refundId = el;
    } else {
        refundId = $(el).attr('data-id');
    }
    new managerRefundCard(refundId);
}

function supportRefundComment(returnId) {
    var content = `<form id="supportReturnCommentForm">
       <div class="form-group">
            <label for="return_description">Support Comment</label>
            <textarea name="support_comment_text" class="form-control" rows="3" id="supportCommentText"></textarea>
        </div>
    </form>`;
    var btn = `<button type="button" class="btn btn-default" onclick="saveSupportRefundComment(${returnId})">Save</button>`;
    showModal('Support Comment', content, 'supportReturnCommentModal', '', {footerButtons:btn});
}

function saveSupportRefundComment(refundId) {
    $('#supportCommentText').val();
    resetError();
    var no_error = true;
    if ($('#supportCommentText').val().trim() == '') {
        no_error = setError($('#supportCommentText'), 'Enter comment');
    } else if ($('#supportCommentText').val().trim().length > 600) {
        no_error = setError($('#supportCommentText'), 'Max length 600 characters');
    }
    if (no_error == true) {
        AjaxController('saveSupportRefundComment', {refundId: refundId, comment: $('#supportCommentText').val()}, financesUrl, refreshRefundHandler, errorBasicHandler, true);
    }
}

function refreshRefundHandler(response) {
    $('.modal').modal('hide').remove();
    new managerRefundCard(response.data.refundId);
    if(typeof pagination !== 'undefined') {
        pagination.request();
    }
}
