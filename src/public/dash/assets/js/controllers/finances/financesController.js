function financesControllerClass() {
    var self = this;
    this.financesPagination = '';
    this.paymentSystems = {
        0 : 'Card',
        1 : 'PayPal',
        2 : 'Authorize.net',
        3 : 'Cash Money'
    };
    this.orderStatus = {
        0 : 'New Order',
        1 : 'Completed',
        2 : 'Canceled',
        3 : 'Paid',
        4 : 'Sent',
        5 : 'Pick Up'
    };
    this.currentDue = 0;
    this.justPlacedOrder = false;

    this.addCreditCard = function () {
        var content = `<form id="authorizeAddCardForm">
                    <div class="row">
                        <div class="col-xs-12">
                            <span class="help-block">Accepted Payment Method Visa, MasterCard, American Express, Discover, JCB</span>
                        </div>
                        <div class="form-group col-xs-12">
                            <label for="creditCardNumber">Card Number</label>
                            <input class="form-control" id="creditCardNumber" autocomplete="off"/>
                            <span class="help-block">(enter number without spaces)</span>
                        </div>
                    </div>
                    <div class="row">
                        <div class="form-group col-sm-4">
                            <label for="cvv">CVV</label>
                            <input type="text" class="form-control" id="cvv" autocomplete="off"/>
                        </div>
                        <div class="form-group col-xs-6 col-sm-4">
                            <label for="expiryDateYY">Expiration Date</label>
                            <input type="text" class="form-control" id="expiryDateYY" placeholder="YYYY"/>
                        </div>
                        <div class="form-group col-xs-6 col-sm-4">
                            <label for="expiryDateMM" class="date_mm_label">Month</label>
                            <input type="text" class="form-control" id="expiryDateMM" placeholder="MM"/>
                        </div>
                    </div>
                    <div class="row">
                        <div class="form-group col-xs-6 col-sm-4">
                            <div><label for="primaryCreditCard">Primary credit card</label></div>
                            <div class="check_buttons_block" id="primaryCreditCard">
                                <button type="button" class="btn btn-default" onclick="doActive(this);" data-val="1">On</button>
                                <button type="button" class="btn btn-default active" onclick="doActive(this);" data-val="0">Off</button>
                            </div>
                        </div>
                    </div>
                </form>`;

        var footerButtons = '<button class="btn btn-default" onclick="finances.createCard()" type="submit">Create</button>';
        if(DEV_ENV) {
            footerButtons += '<button type="button" class="btn btn-primary" onclick="finances.autocomleteTestPaymentAutorizenet()">Autocomplete</button>';
        }
        showModal('Add card', content, 'authorizeAddCardModal', '', {footerButtons: footerButtons});
    };
    
    this.createCard = function () {
        if(fleetC.checkDemoAccess()){return false;}
        resetError();
        var $creditCardNumber = $('#creditCardNumber'),
            $cvv = $('#cvv'),
            $expiryDateYY = $('#expiryDateYY'),
            $expiryDateMM = $('#expiryDateMM');

        if (!$creditCardNumber.val())
            setError($creditCardNumber, 'Enter card number');
        else if($creditCardNumber.val().length > 16)
            setError($creditCardNumber, 'Max number 16 digit');

        if (!$cvv.val())
            setError($cvv, 'Enter CVV code');
        else if($cvv.val().length < 3 || $cvv.val().length > 4)
            setError($cvv, 'CVV code is not valid');

        if (!$expiryDateYY.val())
            setError($expiryDateYY, 'Enter expiry year in format: "YYYY"');

        if (!$expiryDateMM.val())
            setError($expiryDateMM, 'Enter expiry month in format: "MM"');
        else if(!/^(0?[1-9]|1[012]|\*{1,2})$/.test($expiryDateMM.val()))
            setError($expiryDateMM, 'Entered expiration month not valid');


        if($('#authorizeAddCardModal').find('.error').length)
            return false;

        var primaryCard = $('#primaryCreditCard button.active').data('val') == 1 ? 'primary' : 'secondary';

        var footerButtons = '<button class="btn btn-default" onclick="finances.createCardConfirmed()" type="submit">Create</button>';
        showModal('Add card', '<p class="text-center">Are you sure you want to make '+ primaryCard +' credit card?</p>', 'authorizeAddCardConfirmModal', '', {footerButtons: footerButtons});
    };

    this.createCardConfirmed = function () {
        resetError();
        var $creditCardNumber = $('#creditCardNumber'),
            $cvv = $('#cvv'),
            $expiryDateYY = $('#expiryDateYY'),
            $expiryDateMM = $('#expiryDateMM');

        if($('#authorizeAddCardModal').find('.error').length)
            return false;

        var data = {};
        $.each($('#authorizeAddCardForm').serializeArray(), function(i, field) {
            data[field.name] = field.value;
        });

        var payment_key = {};
        payment_key.creditCardNumber = $creditCardNumber.val();
        payment_key.expiryDateYY = $expiryDateYY.val();
        payment_key.expiryDateMM = $expiryDateMM.val();
        payment_key.cvv = $cvv.val();
        payment_key.primaryCreditCard = $('#primaryCreditCard button.active').data('val');
        data.payment_key = ssl_b64_encrypt(JSON.stringify(payment_key));
        AjaxController('addCreditCard', data, financesUrl, self.createCardHandler, self.authorizeAddCardFormErrorHandler, true);
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
        $('#authorizeAddCardModal, #authorizeAddCardConfirmModal').modal('hide').remove();
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

    this.autocomleteTestPaymentAutorizenet = function() {
        if(DEV_ENV) {
            var cardNumbers = ['370000000000002', '6011000000000012', '3088000000000017', '38000000000006', '4007000000027', '4012888818888', '4111111111111111', '5424000000000015', '2223000010309703', '2223000010309711'];
            var rand = Math.floor(Math.random() * cardNumbers.length);
            $('#creditCardNumber').val(cardNumbers[rand]);
            $('#cvv').val('1234');
            $('#expiryDateYY').val('2025');
            $('#expiryDateMM').val('10');
        }
    };

    /**
     * Pagination Init
     */
    this.paginationInit = function () {
        var dataTable = $('#pg_pagin').data('table');
        var requestActions = {
            'paymentHistoryTable' : 'getPaymentHistoryPagination',
            'refundTable' : 'getRefundPagination',
            'ordersTable' : 'getOrdersPagination',
            'creditCardTable' : 'getCreditCardPagination'
        };
        if(typeof requestActions[dataTable] !== 'undefined' && dataTable === 'paymentHistoryTable') {
            self.financesPagination = new simplePaginator({
                tableId: dataTable,
                request: requestActions[dataTable],
                requestUrl: financesUrl,
                handler: self.paginationHandler,
                perPageList: [25, 50, 100],
                defaultPerPage: 50,
                initSort: {param: 'dateTime', dir: 'desc'}
            });
        } else if (typeof requestActions[dataTable] !== 'undefined') {
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
            case 'paymentHistoryTable':
                funcTd = self.paymentHistoryTr;
                break;
            case 'refundTable':
                funcTd = self.refundTr;
                break;
            case 'ordersTable':
                funcTd = self.orderTr;
                break;
            case 'creditCardTable':
                //Action th table shown only fleet owner or solo driver
                $('#creditCardTable').removeClass('table-actions-block');
                $('#creditCardTable thead #actionTableTh').remove();
                if(parseInt(fleetC.fleetOwnerId) === parseInt(curUserId) || isSoloDriver) {
                    $('#creditCardTable').addClass('table-actions-block');
                    $('#creditCardTable thead tr').append('<th id="actionTableTh">Actions</th>');
                }
                funcTd = self.creditCardTr;
                break;
        }

        if(funcTd){
            $.each(rows, function(key, rowData){
                tableBody.append(funcTd(rowData));
            });
        }
    };

    this.paymentHistoryTr = function(data) {
        var status = {
            0:'label-default',
            1:'label-success',
        };
        var typesColor = {
            'Invoice':'label-success',
            'Due':'label-danger',
        };

        var listOfButtons = [];
        if(data.invoiceId > 0) {
            listOfButtons.push('<button type="button" onclick="finances.invoicePdf(' + data.invoiceId + ')">Download PDF</button>');
        }
        if((data.sumRefund === null || (data.sumRefund !== null && data.amount - data.sumRefund > 0)) && self.currentDue > 0 && data.status === 1 && (data.paymentSys === 0 || data.paymentSys === 1 || data.paymentSys === 2)) {
            listOfButtons.push('<button type="button" onclick="refund.refundTransaction(\''+ data.transactionId +'\')">Refund</button>');
        }

        var balanceColor = getBalanceColorFromDue(data.amount * -1);
        var balance = data.amount !== null ? '<span class="' + balanceColor + '">' + moneyFormat(data.amount) + '</span>' : '';

        return '<tr>\n'+
            '<td>'+ moment(data.dateTime).format("MM-DD-YYYY h:mm:ss a") +'</td>\n'+
            '<td>'+ data.transactionId +'</td>\n'+
            '<td>'+ data.invoiceId +'</td>\n'+
            '<td>'+ data.description +'</td>\n'+
            '<td>'+ (data.paymentSys !== null ? self.paymentSystems[data.paymentSys] : '') +'</td>\n'+
            '<td>'+ (data.paymentSys !== null ? data.userName : '') +'</td>\n'+
            '<td>'+ balance +'</td>\n'+
            '<td>'+ (data.sumRefund !== null ? moneyFormat(data.sumRefund) : '') +'</td>\n'+
            '<td>'+ (data.status ? '<span class="label '+ status[data.status] +'">'+ (data.status === 1 ? 'Paid' : 'Failed') +'</span>' : '') +'</td>\n'+
            '<td><span class="label '+ typesColor[data.type] +'">'+ data.type +'</span></td>\n'+
            '<td>'+ (data.amount > 0 ? addTableActionRow(listOfButtons, 140) : '') +'</td>\n'+
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

    this.orderTr = function(data) {
        var status = {
            0:'label-default', //New Order
            1:'label-success', //Completed
            2:'label-warning', //Canceled
            3:'label-info', //Paid
            4:'label-success', //Sent
        };
        var listOfButtons = [];
        if(data.amount > 0) {
            listOfButtons.push(`<button type="button" data-orderid="${data.id}" data-order_type="${data.device_type_id}" data-type="saas_agreement" onclick="downloadAllTerms(this, event);">Download SAAS Agreement</button>`);
            if(data.device_type_id == 2) {
                listOfButtons.push(`<button type="button" data-orderid="${data.id}" data-order_type="${data.device_type_id}" data-type="equipment_lease" onclick="downloadAllTerms(this, event);">Download Equipment Purchase</button>`);
            } else {
                listOfButtons.push(`<button type="button" data-orderid="${data.id}" data-order_type="${data.device_type_id}" data-type="equipment_lease" onclick="downloadAllTerms(this, event);">Download Equipment Lease</button>`);
            }
        }
        if(data.order_camera_type > 0) {
            listOfButtons.push(`<button type="button" data-orderid="${data.id}" data-type="camera_agreement" onclick="var file_path = '/docs/CameraPurchaseandDataServiceAgreement.pdf';var a = document.createElement('A');a.href = file_path;a.download = file_path.substr(file_path.lastIndexOf('/') + 1);document.body.appendChild(a);a.click();document.body.removeChild(a);">Download Camera Agreement</button>`);
        }
        listOfButtons.push(`<button type="button" data-orderid="${data.id}" onclick="downloadFullOrderInfo(this);">Download Order Info</button>`);
        return `<tr>
            <td>${data.id}</td>
            <td>${data.userName}</td>
            <td>${data.amount}</td>
            <td><span class="label ${status[data.status]}">${self.orderStatus[data.status]}</span></td>
            <td>${listOfButtons.length ? addTableActionRow(listOfButtons, 230) : ''}</td>
        </tr>`;
    };

    this.creditCardTr = function (data) {
        var status = {
            0:'label-default',
            1:'label-success',
        };
        var listOfButtons = [];
        listOfButtons.push(`<button type="button" onclick="finances.setDefaultCard(${data.customer_profile_id}, ${data.customer_payment_profile_id})">Set current</button>`);
        listOfButtons.push(`<button type="button" onclick="finances.removeCard(${data.customer_profile_id}, ${data.customer_payment_profile_id})">Remove</button>`);
        if(data.customer_payment_profile_id) {
           return `<tr>
                <td><i class="fa fa-credit-card-alt"></i> ${data.creditCard}</td>
                <td>${data.userName} (${data.email})</td>
                <td>${data.currentCard === 1 ? '<span class="label label-success">Current</span>' : ''}</td>
                <td><span class="label ${status[data.validCard]}">${data.validCard === 1 ? 'Valid' : 'Not valid'}</span></td>
                ${(parseInt(fleetC.fleetOwnerId) === parseInt(curUserId) || isSoloDriver ? '<td>' + addTableActionRow(listOfButtons, 120) + '</td>' : '')}
            </tr>`;
        }
    };

    /**
     * Refresh Current Due
     */
    this.refreshCurrentDue = function(){
        AjaxController('ajaxGetCurrentDue', {}, dashUrl, self.refreshCurrentDueHandler, errorBasicHandler, true);
    };
    this.refreshCurrentDueHandler = function(response){
        self.currentDue = parseFloat(response.data.currentDue);
        if(typeof self.currentDue !== 'undefined' && !isNaN(self.currentDue)) {
            $('#current_due').text(moneyFormat(self.currentDue));
        }
    };

    this.showOrderPlacedPopup = function(href){
        var footerButtons = '<button class="btn btn-default" data-href="'+ href +'" onclick="finances.moveForward(this)">Complete order later</button>';
        showModal('Order Not Finished', '<p>Please complete your order by paying the due invoice in the finances.</p>', '', '', {footerButtons: footerButtons});
    };
    this.getContentPageEld = function() {
        finances.checkNotPaidEldOrders(function (response) {
            if(finances.justPlacedOrder === true && response.data.result === true) {
                self.showOrderPlacedPopup('/dash/eld/');
            } else {
                dc.getUrlContent('/dash/eld/');
            }
        });
    };

    this.moveForward = function(el){
        self.justPlacedOrder = false;
        dc.getUrlContent($(el).attr('data-href'));
    };

    this.checkNotPaidEldOrders = function(callback) {
        AjaxController('checkNotPaidEldOrders', {}, financesUrl, callback, errorBasicHandler, true);
    };

    /**
     * PDF actions
     */
    this.invoicePdf = function(invoice){
        pdfGen.generateAndSendForm({name: "invoice", invoice: invoice, cr:fleetC.id}, {'action':'invoice'});
    };

    this.checkAccessFinances = function() {
        return position == TYPE_SUPERADMIN || (typeof superAdminRights.balance != 'undefined' && superAdminRights.balance == 1);
    };

    this.payByAuthorizeCurrentCard = function (data) {
        var action = typeof data.paymentAction !== 'undefined' && data.paymentAction !== '' ? data.paymentAction : 'chargeCustomerProfile';
        AjaxController(action, data, financesUrl, sentPaymentAutorizenetHandler, self.autorizenetErrorHandler, true);
    };
    this.managerPayByAuthorizeCurrentCard = function () {
        var amount = parseFloat($('#manager_payment_box_amount').val().replace(/,/g, '.'));
        resetError();

        if(amount == '' || isNaN(amount))
            setError($('#manager_payment_box_amount'), 'Enter amount');
        else if(amount < 1)
            setError($('#manager_payment_box_amount'), 'Minimal allowed amount is 1 $');
        else if(amount > 99999.99)
            setError($('#manager_payment_box_amount'), 'Max allowed amount 99999.99$');

        if($('#payForClientForm').find('.error').length)
            return false;

        var data = {
            amount: amount,
            description: 'Manager Pay Invoice',
            userId: $('#payForClientForm input[name="userId"]').val(),
            carrierId: $('#payForClientForm input[name="carrierId"]').val(),
        };

        AjaxController('chargeCustomerProfile', data, financesUrl, sentPaymentAutorizenetHandler, self.autorizenetErrorHandler, true);
    };

    this.getPaymentSystemsList = function() {
        AjaxController('getCreditCard', {currentCard: 1}, financesUrl, self.getPaymentSystemsListHandler, errorBasicHandler, true);
    };
    this.getPaymentSystemsListHandler = function(response) {
        $('#paymentSystemsList').empty();
        if(PAYPAL_ENABLE == true && typeof response.data.card.creditCard !== 'undefined' && (parseInt(fleetC.fleetOwnerId) === parseInt(curUserId) || isSoloDriver)) {
            $('#paymentSystemsList').append(`<li class="col-sm-4 active" onclick="selectPayment(this)" data-payment-id="3">
                <div class="payment-content">
                <i class="checkbox"></i>
                <div class="payment-logo"><img src="${MAIN_LINK}/dash/assets/img/finances/logo_card.png"/></div>
                </div>
                <div class="payment-title">Credit Card authorize.net</div>
            </li>
            <li class="col-sm-4" onclick="selectPayment(this)" data-payment-id="4">
                <div class="payment-content">
                    <i class="checkbox"></i>
                    <div class="payment-text">
                        <span class="credit-card-gold"></span><span class="amount">${response.data.card.creditCard}</span>
                    </div>
                </div>
                <div class="payment-title">Current Credit Card authorize.net</div>
            </li>
            <li class="col-sm-4" onclick="selectPayment(this)" data-payment-id="2">
                <div class="payment-content">
                <i class="checkbox"></i>
                <div class="payment-logo paypal-logo"><img src="${MAIN_LINK}/dash/assets/img/finances/paypal.svg"/></div>
                </div>
                <div class="payment-title">PayPal</div>
            </li>`);
        } else if(typeof response.data.card.creditCard !== 'undefined' && (parseInt(fleetC.fleetOwnerId) === parseInt(curUserId) || isSoloDriver)) {
            $('#paymentSystemsList').append(`<li class="col-md-offset-2 col-md-4 col-sm-6 active" onclick="selectPayment(this)" data-payment-id="3">
                <div class="payment-content">
                <i class="checkbox"></i>
                <div class="payment-logo"><img src="${MAIN_LINK}/dash/assets/img/finances/logo_card.png"/></div>
                </div>
                <div class="payment-title">Credit Card authorize.net</div>
            </li>
            <li class="col-md-4 col-sm-6" onclick="selectPayment(this)" data-payment-id="4">
                <div class="payment-content">
                    <i class="checkbox"></i>
                    <div class="payment-text">
                        <span class="credit-card-gold"></span><span class="amount">${response.data.card.creditCard}</span>
                    </div>
                </div>
                <div class="payment-title">Current Credit Card authorize.net</div>
            </li>`);
        } else if(PAYPAL_ENABLE == true) {
            $('#paymentSystemsList').append(`<li class="col-md-offset-2 col-md-4 col-sm-6 active" onclick="selectPayment(this)" data-payment-id="3">
                <div class="payment-content">
                <i class="checkbox"></i>
                <div class="payment-logo"><img src="${MAIN_LINK}/dash/assets/img/finances/logo_card.png"/></div>
                </div>
                <div class="payment-title">Credit Card authorize.net</div>
            </li>
            <li class="col-md-4 col-sm-6" onclick="selectPayment(this)" data-payment-id="2">
                <div class="payment-content">
                <i class="checkbox"></i>
                <div class="payment-logo paypal-logo"><img src="${MAIN_LINK}/dash/assets/img/finances/paypal.svg"/></div>
                </div>
                <div class="payment-title">PayPal</div>
            </li>`);
        } else {
            $('#paymentSystemsList').append(`<li class="col-md-offset-3 col-md-6 col-sm-12 active" onclick="selectPayment(this)" data-payment-id="3">
                <div class="payment-content">
                <i class="checkbox"></i>
                <div class="payment-logo"><img src="${MAIN_LINK}/dash/assets/img/finances/logo_card.png"/></div>
                </div>
                <div class="payment-title">Credit Card authorize.net</div>
            </li>`);
        }
    };

    this.autorizenetErrorHandler = function(response) {
        resetError();
        $('.modal form').append('<span class="error-handler response-message">'+response.message+'</span>');
        $('button').prop('disabled', false);
        self.refreshCardsData();
    };

    this.payOfCreditCardPopup = function (amount, userId = 0, carrierId = 0) {
        self.getCurrentCreditCardForManager(userId, carrierId, function (response) {
            amount = amount < 0 ? 0 : amount;
            if(typeof response.data.card.creditCard !== 'undefined') {
                var head = `Pay for Client of Credit Card`;
                var content = `<form id="payForClientForm">
                <div class="form-group">
                    <label for="manager_payment_box_amount">Pay of credit card</label>
                    <p class="form-control-static" id="placeCurrentCreditCard">${response.data.card.creditCard}</p>
                </div>
                <div class="form-group">
                    <label for="manager_payment_box_amount">Payment Amount *</label>
                    <input type="text" name="amount" class="form-control" placeholder="Payment Amount" id="manager_payment_box_amount" value="${amount}"/>
                </div>
                <div class="form-group">
                    <small class="text-muted">* &ndash; required fields</small>
                </div>
                <input type="hidden" name="userId" value="${(userId !== false ? userId : 0)}">
                <input type="hidden" name="carrierId" value="${(carrierId !== false ? carrierId : 0)}">
            </form>`;
                var footerButtons = `<button type="button" class="btn btn-default" onclick="finances.managerPayByAuthorizeCurrentCard(this)">Pay By Card</button>`;
                showModal(head, content, 'payForClientModal', '', {footerButtons: footerButtons});
            }
        });
    };

    this.getCurrentCreditCardForManager = function (userId = 0, carrierId = 0, callback) {
        AjaxController('getCreditCard', {currentCard: 1, userId: userId, carrierId: carrierId}, financesUrl, callback, errorBasicHandler, true);
    };

    this.generateInvoiceId = function (callback) {
        AjaxController('generateInvoiceId', {}, financesUrl, callback, errorBasicHandler, true);
    };

    this.showCreateInvoiceModal = function (userId=0) {
        finances.generateInvoiceId(function (result) {
            var invoiceId = result.data.invoiceId;
            var head = 'Create Invoice';
            var content = `<form id="createInvoiceForm">
                <div class="form-group">
                    <label for="manager_payment_box_amount">Invoice Number</label>
                    <p class="form-control-static" id="placeCurrentCreditCard">${invoiceId}</p>
                </div>
                <div class="form-group">
                    <label for="manager_payment_box_amount">Amount *</label>
                    <input type="text" name="amount" class="form-control" placeholder="Amount"/>
                </div>
                <div class="form-group">
                    <label for="return_description">Comment *</label>
                    <textarea name="comment" class="form-control" rows="3"></textarea>
                </div>
                <div class="form-group">
                    <small class="text-muted">* &ndash; required fields</small>
                </div>
                <input type="hidden" name="userId" value="${(userId !== false ? userId : 0)}">
                <input type="hidden" name="invoiceId" value="${invoiceId}">
            </form>`;
            var footerButtons = `<button type="button" class="btn btn-default" onclick="finances.createInvoice(this)">Save</button>`;
            showModal(head, content, 'createInvoiceModal', '', {footerButtons: footerButtons});
        });
    };

    this.createInvoice = function () {
        var amount = parseFloat($('#createInvoiceForm input[name="amount"]').val().replace(/,/g, '.'));
        resetError();

        if(amount == '' || isNaN(amount))
            setError($('#createInvoiceForm input[name="amount"]'), 'Enter amount');
        else if(amount < 1)
            setError($('#createInvoiceForm input[name="amount"]'), 'Minimal allowed amount is $1');
        else if(amount > 99999.99)
            setError($('#createInvoiceForm input[name="amount"]'), 'Max allowed amount $99999.99');

        if($('#createInvoiceForm textarea[name="comment"]').val() == '')
            setError($('#createInvoiceForm textarea[name="comment"]'), 'Enter comment');

        if($('#createInvoiceForm').find('.error').length)
            return false;

        var data = {
            amount: amount,
            description: $('#createInvoiceForm textarea[name="comment"]').val(),
            invoiceId: $('#createInvoiceForm input[name="invoiceId"]').val(),
            userId: $('#createInvoiceForm input[name="userId"]').val()
        };

        AjaxController('managerCreateInvoice', data, financesUrl, self.managerCreateInvoiceHandler, self.autorizenetErrorHandler, true);
    };

    this.managerCreateInvoiceHandler = function (response) {
        $('#createInvoiceModal').modal('hide');
        $('.car_invoices, .man_usr_inv').click();
    };

    /**
     * Pay by PayPal
     * @param data
     * @returns {boolean}
     */
    this.payByPayPal = function(data){
        if(typeof data === 'undefined') {
            return false;
        }
        $('.modal-white').modal('hide');
        $('#gifBox').show();
        AjaxController('payPal', data, dashUrl, finances.payByPayPalHandler, finances.payByPayPalErrorHandler, true);
    };
    this.payByPayPalHandler = function(response) {
        if(response.data != null && response.data.url != null) {
            window.location.href = response.data.url;
        }
    };
    this.payByPayPalErrorHandler = function(response) {
        $('#gifBox').hide();
        showModal('PayPal error', '<p class="text-center">Please try again later.</p>');
    };

    self.refreshCurrentDue();
    self.getCurrentCreditCard();
}

if (typeof finances === 'undefined') {
    var finances = new financesControllerClass();
}