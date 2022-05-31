function refundControllerClass() {
    var self = this;
    this.refundPagination = '';
    this.refundStatuses = {
        0 : 'New',
        1 : 'Approved',
        2 : 'Canceled',
        3 : 'Rejected',
        4 : 'Refunded'
    };
    this.roles = {
        1: 'Solo Driver',
        2: 'Fleet'
    };
    this.authorizeTransactionSatuses = {
        1 : 'Approved',
        2 : 'Declined',
        3 : 'Error',
        4 : 'Held for Review'
    };

    /**
     * Pagination Init
     */
    this.paginationInit = function () {
        self.refundPagination = new simplePaginator({
            tableId: 'refundsAdminTable',
            request: 'getRefundsAdminPagination',
            requestUrl: financesUrl,
            handler: self.paginationHandler,
            perPageList: [25, 50, 100, 'All'],
            //initSort:{param:'id', dir:'desc'},
            defaultPerPage: 50
        });
    };

    this.paginationHandler = function (response, tableId) {
        var rows = response.data.result;
        var table = $('#' + tableId);
        var tableBody = table.find('tbody');
        tableBody.empty();
        var headers = table.find('thead tr').first().find('th');
        if (rows.length == 0) {
            var cols = headers.length;
            tableBody.append('<tr><td colspan="' + cols + '" style="text-align:center; font-weigth:bolder;">No Data Found</td></tr>')
        }
        $.each(rows, function(key, rowData){
            tableBody.append(self.refundAdminTr(rowData));
        });
    };

    this.refundAdminTr = function(data) {
        var status = {
            0:'label-default',
            1:'label-info',
            2:'label-warning',
            3:'label-danger',
            4:'label-success',
        };
        var listOfButtons = [];
        if(data.status === 0) {
            listOfButtons.push(`<button onclick="refund.btnRefundApprove(${data.id})">Approve</button>`);
        }
        if (data.status === 0 || data.status === 1) {
            listOfButtons.push(`<button onclick="refund.btnRefundAdminReject(${data.id})">Reject</button>`);
        }
        if(data.paymentSys === 2 && data.status === 1 && position === TYPE_SUPERADMIN) {
            listOfButtons.push(`<button onclick="refund.btnRefundToCreditCard(${data.id})">Refund to card</button>`);
        }


        var nameData = data.fleet_usdot;
        if(data.soloOrFleet === 1) {
            nameData = `<span class="global_carrier_info clickable_item" title="User Info" data-userid="${data.userId}" onclick="getOneUserInfo(this, event);" style="cursor: pointer;">${data.user_info}</span>`;
        } else if(data.soloOrFleet === 2) {
            nameData = `<span class="global_carrier_info clickable_item" title="Carrier Info" data-carrid="${data.carrierId}" ${(data.fleet_usdot !== null ? 'onclick="actionGlobalgetOneCarrierInfo(this, event);"' : '')} style="cursor: pointer;">${(data.fleet_usdot !== null ? data.fleet_usdot : '')}</span>`;
        }
        var userInfo = `<span class="global_carrier_info clickable_item" title="User Info" data-userid="${data.userId}" onclick="getOneUserInfo(this, event);" style="cursor: pointer;">${data.user_info}</span>`;

        return `<tr data-id="${data.id}" onclick="actionGetOneManagerRefundInfo(this)">
            <td style="width: 20px;">${data.id !== null ? data.id : ''}</td>
            <td>${timeFromSQLDateTimeStringToUSAString(data.dateTime)}</td>
            <td>${data.soloOrFleet !== null ? self.roles[data.soloOrFleet] : ''}</td>
            <td>${data.fleet_usdot !== null ? nameData : ''}</td>
            <td>${userInfo}</td>
            <td>${data.refundTransactionId}</td>
            <td>${moneyFormat(data.amount > 0 ? data.amount : -1 * data.amount)}</td>
            <td><span class="label ${status[data.status]}">${self.refundStatuses[data.status]}</span></td>
            <td>${listOfButtons.length ? addTableActionRow(listOfButtons, 200) : ''}</td>
        </tr>`;
    };

    /**
     * Manager Approve Refund
     */
    this.btnRefundApprove = function(id) {
        var btn = `<button type="button" class="btn btn-default" onclick="refund.btnAdminRefundConfirm(${id}, 1)">OK</button>`;
        showModal('Approve Refund?', '<p class="text-center">After confirming refund, an administrator will perform a refund to card.</p>', 'refundModal', '', {footerButtons:btn});
    };
    /**
     * Manager Reject Refund
     */
    this.btnRefundAdminReject = function(id) {
        var btn = `<button type="button" class="btn btn-default" onclick="refund.btnAdminRefundConfirm(${id}, 3)">OK</button>`;
        showModal('Reject Refund?', '<p class="text-center">Reject refund? Funds will be returned to the user/fleet account</p>', 'refundModal', '', {footerButtons:btn});
    };
    /**
     * Admin Refund to Credit Card
     */
    this.btnRefundToCreditCard = function (id) {
        var btn = `<button type="button" class="btn btn-default" onclick="refund.btnAdminRefundConfirm(${id}, 4)">OK</button>`;
        showModal('Refund To Credit Card', '<p class="text-center">Confirm a refund on a user\'s credit card</p>', 'refundModal', '', {footerButtons:btn});
    };
    this.btnAdminRefundConfirm = function(id, status = null) {
        $('#refundModal').modal('hide').remove();
        AjaxController('changeRefundStatusByManager', {id: id, status: status}, financesUrl, self.refreshManagerRefundTableData, showModalError, true);
    };
    /**
     * Refresh Table Data
     */
    this.refreshManagerRefundTableData = function(response) {
        self.refundPagination.request();
        if($('#refund_manager_modal_card').hasClass('in')) {
            $('#refund_manager_modal_card').modal('hide').remove();
            managerRefundCard(response.data.result.id);
        }
    };

    /**
     * Refund User
     * -----------------
     * Refund on click finances page
     */
    this.btnRefund = function(){
        self.getAuthorizeInvoicesForRefund(function(response) {
            var invoiceOptions = '';
            $.each(response.data.invoices, function(key, val){
                if((val.amount - val.sumRefund) > 0) {
                    invoiceOptions += `<option value="${val.transactionId}">${val.transactionId} | ${moneyFormat(val.amount)}</option>`;
                }
            });
            var content = `<form id="createRefundUserForm">
                <div class="row">
                    <div class="form-group col-sm-12">
                        <label for="cvv">Transactions</label>
                        <select id="refundTransactionId" class="form-control" onchange="refund.setRefundMaxAmountOfTransaction(this)">
                            ${invoiceOptions.length > 0 ? '<option value="0">Select Transaction</option>' + invoiceOptions : '<option value="0">Not Found Transactions</option>'}
                        </select>
                    </div>
                    <div class="form-group col-sm-12">
                        <label for="refuseAmountInput">Amount $</label>
                        <input type="text" max="${response.data.invoices.currentDue}" class="form-control" id="refuseAmountInput" value="">
                    </div>
                    <div class="form-group col-sm-12">
                        <label for="refundReason">Refund reason</label>
                        <textarea class="form-control" id="refundReason"></textarea>
                    </div>
                </div>
            </form>`;
            showModal('Refund', content, 'refundModal', '', {footerButtons:`<button type="button" class="btn btn-default" onclick="refund.btnRefundSend()">OK</button>`});
            $("#refuseAmountInput").mask('99999.99', {reverse: true});
        });
    };
    this.getAuthorizeInvoicesForRefund = function(callback){
        AjaxController('getAuthorizeInvoicesForRefund', {}, financesUrl, callback, errorBasicHandler, true);
    };
    this.setRefundMaxAmountOfTransaction = function(el) {
        var transactionId = $(el).val();
        if(transactionId > 0) {
            self.getRefundMaxAmount(transactionId, 0, function (response) {
                var amount = parseFloat(response.data.maxRefundAmount).toFixed(2);
                $('#refuseAmountInput').attr('max', amount).val(amount);
            });
        }
    };
    /**
     * Refund of table invoice history
     * @param transactionId
     * @returns {number}
     */
    this.refundTransaction = function(transactionId, userId = 0){
        if(!transactionId) {
            showModal('Message', '<p class="text-center">Not Found Transaction ID.</p>');
            return 0;
        }
        self.getRefundMaxAmount(transactionId, userId, function(response) {
            var content = `<form id="createRefundUserForm">
                <input type="hidden" id="refundTransactionId" value="${transactionId}">
                <div class="row">
                    <div class="form-group col-sm-12">
                        <label for="refuseAmountInput">Amount $</label>
                        <input type="text" max="${response.data.maxRefundAmount}" class="form-control" id="refuseAmountInput" value="${response.data.maxRefundAmount}">
                    </div>
                    <div class="form-group col-sm-12">
                        <label for="refundReason">Refund reason</label>
                        <textarea class="form-control" id="refundReason"></textarea>
                    </div>
                </div>
            </form>`;
            showModal('Refund', content, 'refundModal', '', {footerButtons:`<button type="button" class="btn btn-default" onclick="refund.btnRefundSend(${userId})">OK</button>`});
            $("#refuseAmountInput").mask('99999.99', {reverse: true});
            var amount = parseFloat(response.data.maxRefundAmount).toFixed(2);
            $('#refuseAmountInput').attr('max', amount).val(amount);
        });
    };
    this.getRefundMaxAmount = function(transactionId, userId = 0, callback){
        AjaxController('getRefundMaxAmount', {transactionId: transactionId, userId: userId}, financesUrl, callback, showModalError, true);
    };
    this.btnRefundSend = function(userId = 0){
        resetError();
        var amount = $('#refuseAmountInput').val(),
            max = parseFloat($('#refuseAmountInput').attr('max')),
            transactionId = parseInt($('#refundTransactionId').val()),
            refundReason = $('#refundReason').val();

        amount = parseFloat(amount.replace(/,/g, '.').trim());
        if(transactionId === 0 || !transactionId)
            setError($('#refundTransactionId'), 'Please select Invoice');

        if(amount > max)
            setError($('#refuseAmountInput'), 'Max allowed sum: ' + max);
        else if(amount < 1 || amount == '' || typeof amount === 'undefined' || isNaN(amount)) {
            setError($('#refuseAmountInput'), 'Min allowed sum: 1');
        }
        if(!refundReason)
            setError($('#refundReason'), 'Enter return reason');
        else if(refundReason.length > 5000) {
            setError($('#refundReason'), 'Maximum allowed 5000 characters.');
        } else if(refundReason.length < 10) {
            setError($('#refundReason'), 'Minimum allowed 10 characters.');
        }
        if($('#createRefundUserForm .error').length){
           return false;
        }
        $('#refundModal').modal('hide').remove();
        AjaxController('refundTransaction', {userId: userId, amount: amount, transactionId: transactionId, reason: refundReason}, financesUrl, self.refundRefreshHandler, errorBasicHandler, true);
    };
    this.btnUserRefundCancel = function(id) {
        if(!id) {
            return;
        }
        showModal('Cancel Refund?', '', 'refundModal', '', {footerButtons:`<button type="button" class="btn btn-default" onclick="refund.btnRefusedCancelConfirm(${id})">OK</button>`});
    };
    this.btnRefusedCancelConfirm = function(id) {
        if(!id) {
            return;
        }
        $('#refundModal').modal('hide').remove();
        AjaxController('refundCancel', {id:id}, financesUrl, self.refundRefreshHandler, showModalError, true);
    };
    this.refundRefreshHandler = function(response) {
        if(position === TYPE_SUPERADMIN || position === TYPE_EZLOGZ_MANAGER) {
            if(response.data.refunds[0].carrierIdDue) {
                new managerCarrierCard(response.data.refunds[0].carrierIdDue);
            } else if(response.data.refunds[0].userIdDue) {
                new managerUserCard(response.data.refunds[0].userIdDue);
            }
        } else {
            if (window.location.href.toString().split(window.location.host)[1] !== '/dash/finances/finances_refunds/') {
                window.location.href = '/dash/finances/finances_refunds/';
            }
            finances.financesPagination.request();
            finances.refreshCurrentDue();
        }
    };
    this.showModalError = function(response) {
        showModal('Message', '<p class="text-center my-4">' + response.message + '</p>');
    }
}

$('body').off('click', '.cancelBtn').on('click','.cancelBtn', function(){
    $('#refund_dates').val('');
});

if (typeof refund === 'undefined') {
    var refund = new refundControllerClass();
}