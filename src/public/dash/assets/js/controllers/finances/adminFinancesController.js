function adminFinancesControllerClass() {
    var self = this;
    this.financesPagination = '';
    this.paymentSystems = {
        0 : 'Card',
        1 : 'PayPal',
        2 : 'Authorize.net',
        3 : 'Cash Money'
    };
    this.roles = {
        1: 'Solo Driver',
        2: 'Fleet'
    };
    this.authorizeAddCardFormErrorHandler = function (response) {
        resetError();
        $('#authorizeAddCardForm').append('<span class="error-handler response-message">'+response.message+'</span>');
    };

    this.createCardHandler = function (response) {
        if(window.location.href.toString().split(window.location.host)[1] !== '/dash/finances/finances_cards/') {
            window.location.href = '/dash/finances/finances_cards/';
        }
        // window.location.reload();
        $('#authorizeAddCardModal').modal('hide').remove();
        if(self.financesPagination !== '') {
            self.financesPagination.request();
        }
    };

    this.getCurrentCreditCard = function () {
        if($('#currentCardInfoBlock').length === 1) {
            AjaxController('getCreditCard', {currentCard: 1}, financesUrl, self.getCurrentCreditCardHandler, errorBasicHandler, true);
        }
    };

    this.getCurrentCreditCardHandler = function (response) {
        if(typeof response.data.card.creditCard !== 'undefined') {
            $('#currentCardInfoBlock').html('<span class="amount">'+ response.data.card.creditCard +'</span>');
        } else {
            $('#currentCardInfoBlock').html('<span class="amount">None</span>');
        }
    };

    this.setDefaultCard = function(customer_profile_id, customer_payment_profile_id) {
        var payment_data = ssl_b64_encrypt(JSON.stringify({customer_profile_id: customer_profile_id, customer_payment_profile_id: customer_payment_profile_id}));
        AjaxController('setDefaultCard', {payment_data: payment_data}, financesUrl, self.refreshCardsData, self.showFinancesError, true);
    };

    this.removeCard = function(customer_profile_id, customer_payment_profile_id) {
        var payment_data = ssl_b64_encrypt(JSON.stringify({customer_profile_id: customer_profile_id, customer_payment_profile_id: customer_payment_profile_id}));
        AjaxController('removeCard', {payment_data: payment_data}, financesUrl, self.refreshCardsData, self.showFinancesError, true);
    };

    this.showFinancesError = function(response) {
        showModal('Message', '<p class="text-center my-4">' + response.message + '</p>');
    };

    /**
     * Click on tab, update table data
     */
    this.refreshCardsData = function() {
        self.refreshCurrentDue();
        self.getCurrentCreditCard();
        if(self.financesPagination !== '') {
            self.financesPagination.request();
        }
    };

    /**
     * Pagination Init
     */
    this.paginationInit = function () {
        var dataTable = $('#pg_pagin').data('table');
        var requestActions = {
            'adminInvoicesTable' : 'getAdminInvoicesPagination',
            'refundTable' : 'getRefundPagination'
        };
        if (typeof requestActions[dataTable] !== 'undefined') {
            self.financesPagination = new simplePaginator({
                tableId: dataTable,
                request: requestActions[dataTable],
                requestUrl: financesUrl,
                handler: self.paginationHandler,
                perPageList: [25, 50, 100],
                defaultPerPage: 50
            });
        }
    };

    this.paginationHandler = function (response, tableId) {
        c(response);
        var rows = response.data.result;
        var table = $('#' + tableId);
        var tableBody = table.find('tbody');
        tableBody.empty();
        var headers = table.find('thead tr').first().find('th');
        if (rows.length == 0) {
            var cols = headers.length;
            tableBody.append('<tr ><td colspan="' + cols + '" style="text-align:center; font-weigth:bolder;">No Data Found</td></tr>')
        }

        var funcTd = false;
        switch(tableId){
            case 'adminInvoicesTable':
                funcTd = self.invoiceTr;
                break;
            case 'refundTable':
                funcTd = self.refundTr;
                break;
        }

        if(funcTd){
            $.each(rows, function(key, rowData){
                tableBody.append(funcTd(rowData));
            });
        }
    };

    this.invoiceTr = function(data) {
        var status = {
            0:'label-default',
            1:'label-success',
        };

        var listOfButtons = [];
        listOfButtons.push('<button type="button" data-id="'+ data.invoiceId +'" onclick="downloadInvoice(this)">Download PDF</button>');
        if((data.sumRefund === null || (data.sumRefund !== null && data.amount - data.sumRefund > 0)) && data.currentBalance < 0 && finances.checkAccessFinances() && (data.paymentSys === 0 || data.paymentSys === 1 || data.paymentSys === 2)) {
            listOfButtons.push('<button type="button" onclick="refund.refundTransaction(\''+ data.transactionId +'\', '+ data.userId +')">Refund</button>');
        }

        var balanceColor = getBalanceColorFromDue(data.amount * -1);
        var balance = data.amount !== null ? '<span class="' + balanceColor + '">' + moneyFormat(data.amount) + '</span>' : '';


        var nameData = data.fleet_usdot;
        if(data.soloOrFleet === 1) {
            nameData = `<span class="global_carrier_info clickable_item" title="User Info" data-userid="${data.userId}" onclick="getOneUserInfo(this, event);" style="cursor: pointer;">${data.user_info}</span>`;
        } else if(data.soloOrFleet === 2) {
            nameData = `<span class="global_carrier_info clickable_item" title="Carrier Info" data-carrid="${data.carrierId}" ${(data.fleet_usdot !== null ? 'onclick="actionGlobalgetOneCarrierInfo(this, event);"' : '')} style="cursor: pointer;">${(data.fleet_usdot !== null ? data.fleet_usdot : '')}</span>`;
        }
        var userInfo = `<span class="global_carrier_info clickable_item" title="User Info" data-userid="${data.userId}" onclick="getOneUserInfo(this, event);" style="cursor: pointer;">${data.user_info}</span>`;

        return '<tr>\n'+
            '<td>'+ moment(data.dateTime).format("MM-DD-YYYY h:mm:ss a") +'</td>\n'+
            '<td>'+ (data.soloOrFleet !== null ? self.roles[data.soloOrFleet] : '') +'</td>\n'+
            '<td>'+ (data.fleet_usdot !== null ? nameData : userInfo) +'</td>\n'+
            '<td>'+ data.transactionId +'</td>\n'+
            '<td>'+ data.invoiceId +'</td>\n'+
            '<td>'+ (data.paymentSys !== null ? self.paymentSystems[data.paymentSys] : '') +'</td>\n'+
            '<td>'+ balance +'</td>\n'+
            '<td>'+ (data.sumRefund !== null ? moneyFormat(data.sumRefund) : '') +'</td>\n'+
            '<td>'+ (data.card !== null ? data.card : '') +'</td>\n'+
            '<td>'+ (data.status ? '<span class="label '+ status[data.status] +'">'+ (data.status === 1 ? 'Paid' : 'Failed') +'</span>' : '') +'</td>\n'+
            '<td>'+ (data.amount > 0 ? addTableActionRow(listOfButtons, 120) : '') +'</td>\n'+
            '</tr>';
    };

    this.refundTr = function(data) {
        var status = {
            0:'label-default',
            1:'label-success',
            2:'label-warning',
            3:'label-warning',
            4:'label-success',
        };
        var listOfButtons = [];
        listOfButtons.push(`<button type="button" onclick="refund.btnUserRefundCancel(${data.id})">Cancel</button>`);
        return `<tr>
            <td>${data.id}</td>
            <td>${moneyFormat(data.amount)}</td>
            <td><span class="label ${status[data.status]}">${refund.refundStatuses[data.status]}</span></td>
            <td>${data.status === 0 ? addTableActionRow(listOfButtons, 120) : ''}</td>
        </tr>`;
    };
}

if (typeof adminFinances === 'undefined') {
    var adminFinances = new adminFinancesControllerClass();
}