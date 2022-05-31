var financesUrl = '/db/api/apiFinancesController/';

/**
 * Pay Transfer Scanner
 */
function payTransferScanner(data) {
    finances.generateInvoiceId(function (result) {
        data.invoiceId = result.data.invoiceId;
        data.description = 'Pay Transfer Scanner $' + ELD_TRANSFER_PRICE;
        data.amount = ELD_TRANSFER_PRICE;
        data.paymentAction = 'payAuthorizeTransferScanner';
        showSelectPaymentModal(data);
    });
}
/**
 * Deposit
 */
function setDeposit() {
    finances.generateInvoiceId(function (result) {
        var invoiceId = result.data.invoiceId;
        showSelectPaymentModal({
            invoiceId : invoiceId,
            paymentAction : 'deposit',
            description : 'Pay Invoice #' + invoiceId,
        });
    });
}
/**
 * Next invoice
 */
function payNextInvoce() {
    AjaxController('getCountActiveEldScanners', {}, dashUrl, 'payNextInvoceHandler', errorBasicHandler, true);
}
function payNextInvoceHandler(response) {
    finances.generateInvoiceId(function (result) {
        var invoiceId = result.data.invoiceId;
        showSelectPaymentModal({
            invoiceId : invoiceId,
            amount : response.data.price,
            description : 'Pay Next Month Invoice',
        });
    });
}
/**
 * Pay Current Invoice
 */
function payInvoice(){
    finances.generateInvoiceId(function (result) {
        var invoiceId = result.data.invoiceId;
        var amount = parseFloat($('#current_due').text().replace(/[^\d.-]/g, ''));
        if(amount > 0){
            return;
        }
        showSelectPaymentModal({
            invoiceId : invoiceId,
            amount : (amount < 0 ? amount * -1 : amount),
            description : 'Pay Current Invoice',
        });
    });
}
/**
 * Manager generate invoice
 */
function payForAuthorizeClient(){
    var amount = parseFloat($('#manager_payment_box_amount').val().replace(/,/g, '.'));
    resetError();
    if(!$('#manager_payment_box_user').data('id') || $('#manager_payment_box_user').data('id') == 0 || !$('#manager_payment_box_user').val())
        setError($('#manager_payment_box_user'), 'Please select user');

    if(amount == '' || isNaN(amount))
        setError($('#manager_payment_box_amount'), 'Enter amount');
    else if(amount < 1)
        setError($('#manager_payment_box_amount'), 'Minimal allowed amount is 1 $');
    else if(amount > 99999.99)
        setError($('#manager_payment_box_amount'), 'Max allowed amount 99999.99$');

    if($('#payForClientForm').find('.error').length)
        return false;

    AjaxController('getPaymentData', {userId : $('#manager_payment_box_user').attr('data-id')}, financesUrl, 'getPaymentDataHandler', errorBasicHandler, true);
}

/**
 * Manager generate invoice handler
 * @param response
 */
function getPaymentDataHandler(response) {
    finances.generateInvoiceId(function (result) {
        var data = {
            action:'paySim',
            title: 'Manager Pay Invoice',
            amount: parseFloat(($('#manager_payment_box_amount').val()).replace(/,/g, '.').trim()),
            name:$('#manager_payment_box_name').val(),
            last:$('#manager_payment_box_last').val(),
            userId:$('#manager_payment_box_user').attr('data-id'),
            invoiceId: result.data.invoiceId,
            description: 'Manager Pay Invoice',
            paymentManager: 1
        };

        showModalAuthorizePayment(data);

        //Autocomplete card data
        if(typeof response.data.paymentData !== 'undefined' && response.data.paymentData != null) {
            $('#creditCardNumber').val(response.data.paymentData.creditCardNumber);
            $('#cvv').val(response.data.paymentData.cvv);
            $('#expiryDateMM').val(response.data.paymentData.expiryDateMM);
            $('#expiryDateYY').val(response.data.paymentData.expiryDateYY);
        }
    });
}
function getCurrentDay(){
    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth()+1; //January is 0!
    var yyyy = today.getFullYear();
    if(dd<10) {
        dd='0'+dd
    }
    if(mm<10) {
        mm='0'+mm
    }
    today = yyyy+'-'+mm+'-'+dd;
    return today;
}
function btnPayNow(e) {
    if(fleetC.checkDemoAccess()){return false;}
    var paymentId = $('#paymentModal .payment-systems li.active').data('payment-id');
    var amount = $('#paymentForm input[name="amount"]').val();
    if(amount < 0){
        amount = -amount;
    }
    var invoiceData = {};
    $.each($('#paymentForm input[type="hidden"]'), function() {
        invoiceData[$(this).attr('name')] = $(this).val();
    });
    if (typeof invoiceData.paymentAction !== 'undefined' && invoiceData.paymentAction === 'deposit') {
        if(validateDeposit($('#paymentForm')) === false) {
            return false;
        }
        invoiceData.paymentAction = '';
    }
    invoiceData.amount = parseFloat(amount.replace(/,/g, '.').trim()).toFixed(2);
    invoiceData.paymentId = paymentId;
    c(invoiceData);

    $(e).attr('disabled', true);

    if(paymentId == 1) {
        invoiceData['action'] = 'paySim';
        payViaCard(invoiceData);
    } else if(paymentId == 2) {
        finances.payByPayPal(invoiceData);
    } else if(paymentId == 3) {
        showModalAuthorizePayment(invoiceData);
    } else if(paymentId == 4) {
        finances.payByAuthorizeCurrentCard(invoiceData);
    }
}
function validateDeposit($obj) {
    resetError();
    var depositCount = $obj.find('input[name="amount"]').val(),
        depositCount1 = parseFloat(depositCount.replace(/,/g, '.').trim());
    if(!/^\d+([,.]{1}\d+|)$/ig.test(depositCount))
        setError($obj.find('input[name="amount"]'), 'Enter amount');
    else if(depositCount1 < 1)
        return setError($obj.find('input[name="amount"]'), 'Minimal allowed amount is 1 $');
    else if(depositCount1 > 99999.99)
        setError($obj.find('input[name="amount"]'), 'Max allowed amount 99999.99$');
    else if(isNaN(depositCount1) || typeof depositCount1 !== 'number' || depositCount1 <= 0)
        setError($obj.find('input[name="amount"]'), 'Enter correct amount');

    if($obj.find('.error').length > 0){
        return false;
    }
}
function payViaCard(data){
    if(typeof data === 'undefined')
        return false;
    $('.modal-white').modal('hide');
    $('#gifBox').show();
    $.ajax({
        url:MAIN_LINK+'/db/dashController/' + '?' + window.location.search.substring(1),
        method:"POST",
        contentType: "application/json", // send as JSON
        data:JSON.stringify({data:data}),
        success: function(data){
            var response = jQuery.parseJSON(data);
            if(response.code == '000'){
                var data = response.data;
                $('#payment_form input[name="UMstart"]').remove();
                $('#payment_form input[name="UMaddcustomer"]').val('no');
                $('#payment_form input[name="UMnumleft"]').val(0);

                $('#payment_form input[name="UMkey"]').val(data.UMkey);
                $('#payment_form input[name="UMcommand"]').val(data.UMcommand);
                $('#payment_form input[name="UMhash"]').val(data.UMhash);

                $('#payment_form input[name="x_login"]').val(data.loginID);
                $('#payment_form input[name="UMamount"]').val(data.amount);
                $('#payment_form input[name="UMname"]').val(data.name + ' ' + data.lastName);
                $('#payment_form input[name="x_last_name"]').val(data.lastName);
                $('#payment_form input[name="x_company"]').val(data.carrierName);
                $('#payment_form input[name="UMdescription"]').val(data.description);
                $('#payment_form input[name="UMinvoice"]').val(data.invoice);
                $('#payment_form input[name="x_fp_sequence"]').val(data.sequence);
                $('#payment_form input[name="x_fp_timestamp"]').val(data.timeStamp);
                $('#payment_form input[name="x_fp_hash"]').val(data.fingerprint);
                $('#payment_form input[name="UMcustid"]').val(data.userId);
                $('#payment_form input[name="UMcustom1"]').val(data.userId);
                $('#payment_form').submit();
            }
        }
    })
}

function sentPaymentAutorizenet(e){
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


    if($('#autorizenetPayForm').find('.error').length)
        return false;

    $(e).attr('disabled', true);

    var data = {};
    $.each($('#autorizenetPayForm').serializeArray(), function(i, field) {
        data[field.name] = field.value;
    });

    var payment_key = {};
    payment_key.creditCardNumber = $creditCardNumber.val();
    payment_key.expiryDateYY = $expiryDateYY.val();
    payment_key.expiryDateMM = $expiryDateMM.val();
    payment_key.cvv = $cvv.val();
    payment_key.primaryCreditCard = $('#primaryCreditCard button.active').data('val');
    data.payment_key = ssl_b64_encrypt(JSON.stringify(payment_key));
    var action = typeof data.paymentAction !== 'undefined' && data.paymentAction !== '' ? data.paymentAction : 'chargeCreditCard';
    AjaxController(action, data, financesUrl, sentPaymentAutorizenetHandler, paymentAutorizenetErrorHandler, true);
}

function sentPaymentAutorizenetHandler(response) {
    c('--response');
    c(response);
    if ((position === TYPE_SUPERADMIN || position === TYPE_EZLOGZ_MANAGER) && typeof response !== 'undefined') {
        var data = response.data;
        $('.modal').modal('hide').remove();

        var recurring = '';
        if(typeof data.recurring !== 'undefined' && data.recurring !== null) {
            recurring = (data.recurring.amount !== null ? '<span title="monthly +' + data.recurring.amount + '$ till ' + convertDateToUSA(data.recurring.recurringTill, false, false) + '">(+$' + data.recurring.amount + 'p/m)</span>' : '');
        }

        if(typeof data.user === 'undefined')
            return 0;

        var currentDue = '<span class="' + getBalanceColorFromDue(data.user.currentDue) + '">'+(data.user.currentDue !== null ? moneyFormat(data.user.currentDue * -1) : '')+'</span>'+recurring;
        c(currentDue);
        if (data.user.isSoloDriver === true) {
            new managerUserCard(data.user.id, {
                initCallback: function () {
                    showModal(data.modalShow.title, data.modalShow.message);
                }
            });
            $('#usersAdminTable tr[data-userid=' + data.user.id + '] td.currentDue').html(currentDue);
        } else if (data.user.inFleet === true) {
            new managerCarrierCard(data.user.carrierId, {
                initCallback: function () {
                    showModal(data.modalShow.title, data.modalShow.message);
                }
            });
            $('#carriersAdminTable tr[data-carrid=' + data.user.carrierId + '] td.currentDue').html(currentDue);
        }

    } else {
        $('#paymentModal, #autorizenetModal').modal('hide');
        responseModalMessage(response);
    }
}

function paymentAutorizenetErrorHandler(response) {
    resetError();
    $('#autorizenetPayForm').append('<span class="error-handler response-message">'+response.message+'</span>');
    $('.modal-footer button').removeAttr('disabled');
    finances.refreshCardsData();
}

function autorizenetErrorHandler(response) {
    resetError();
    $('.modal form').append('<span class="error-handler response-message">'+response.message+'</span>');
    $('.button').removeAttr('disabled');
}
/**
 * Reload page for update balance or data in tabs
 */
$(document).off('hidden.bs.modal','#successPaymentModal').on('hidden.bs.modal','#successPaymentModal', function () {
    if(position !== TYPE_SUPERADMIN && position !== TYPE_EZLOGZ_MANAGER) {
        finances.refreshCardsData();
        //Reload table pagination if transfer eld payed
        if($('#eld_table').length && typeof getELDscanners !== 'undefined') {
            getELDscanners();
        }
    }
});

function showModalAuthorizePayment(data) {
    $('#paymentModal').modal('hide').remove();
    c(data);
    var inputsHidden = '';
    data.paymentAction = typeof data.paymentAction !== 'undefined' ? data.paymentAction : '';
    $.each(data, function(key, val) {
        inputsHidden += `<input type="hidden" name="${key}" value="${val}">`;
    });
    var content = `
    <form id="autorizenetPayForm">
            ${inputsHidden}
            <div class="row">
                <div class="col-sm-9 col-md-7">
                    <div class="form-horizontal form-horizontal-info">
                        <div class="form-group">
                            <label for="cart_type" class="col-sm-4 control-label">Order Date:</label>
                            <div class="col-sm-8">
                                <p class="form-control-static" id="orderDateText">${convertDateToUSA(getCurrentDay())}</p>
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="cart_type" class="col-sm-4 control-label">Order Amount:</label>
                            <div class="col-sm-8">
                                <p class="form-control-static" id="orderAmountText">${typeof data.amount !== 'undefined' ? moneyFormat(data.amount) : 0}</p>
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="cart_type" class="col-sm-4 control-label">Order Number:</label>
                            <div class="col-sm-8">
                                <p class="form-control-static" id="orderNumberText">${typeof data.invoiceId !== 'undefined' ?  data.invoiceId : ''}</p>
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="cart_type" class="col-sm-4 control-label">Description:</label>
                            <div class="col-sm-8">
                                <p class="form-control-static" id="orderDescriptionText">${typeof data.description !== 'undefined' ? data.description : ''}</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-sm-3 col-md-5">
                    <div id="authorizeNetSealLogo" class="authorizeNetSealLogoBlock"></div>
                </div>
            </div>
        <hr />
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
    var footerButtons = '<button class="btn btn-default" onclick="sentPaymentAutorizenet(this)" type="submit">Submit</button>';
    if(DEV_ENV) {
        footerButtons += '<button type="button" class="btn btn-primary" onclick="autocomleteTestPaymentAutorizenet()">Autocomplete</button>';
    }
    data.title = typeof data.title !== 'undefined' ? data.title : 'Pay Invoice';
    showModal(data.title, content, 'autorizenetModal', 'modal-lg', {footerButtons: footerButtons});

    $('#creditCardNumber').mask('0#');
    $('#cvv').mask('0000');
    $('#expiryDateYY').mask('0000');
    $('#expiryDateMM').mask('00');
    $('#authorizeNetSealLogo').append($('#AuthorizeNetSealOriginalBlock .AuthorizeNetSeal a').clone());
}

function autocomleteTestPaymentAutorizenet() {
    if(DEV_ENV) {
        var cardNumbers = ['370000000000002', '6011000000000012', '3088000000000017', '38000000000006', '4007000000027', '4012888818888', '4111111111111111', '5424000000000015', '2223000010309703', '2223000010309711'];
        var rand = Math.floor(Math.random() * cardNumbers.length);
        $('#creditCardNumber').val(cardNumbers[rand]);
        $('#cvv').val('1234');
        $('#expiryDateYY').val('2025');
        $('#expiryDateMM').val('10');
    }
}

/**
 * Authorizenet Recurring
 */
function subscriptionBtnClick(userId=0) {
    AjaxController('getRecurring', {userId:userId}, financesUrl, 'subscriptionDataHandler', autorizenetErrorHandler, true);
}
function subscriptionDataHandler(response) {
    c(response);
    var recurring = response.data != null && response.data.recurring != null ? response.data.recurring : '';
    var recurring_price = response.data != null && response.data.minRecurringPrice != null ? response.data.minRecurringPrice : 0;
    var userId = response.data != null && response.data.userId != null ? response.data.userId : 0;

    if(typeof recurring.id !== 'undefined') {
        $('#recurringModal').remove();
        $($('.content').length > 0 ? '.content' : 'body').append(`<div class="modal modal-white" id="recurringModal">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                        <h4 class="modal-title">Recurring payments</h4>
                    </div>
                    <div class="modal-body">
                        <form class="form-horizontal" id="recurringUpdateForm">
                            <div class="form-group">
                                <label class="col-sm-4 control-label">Till</label>
                                <div class="col-sm-8">
                                    <p class="form-control-static">${(recurring.always == 1 ? 'Always' : convertDateToUSA(recurring.recurringTill))}</p>
                                </div>
                            </div>
                            <div class="form-group" id="subscriptionEditBlockAmount">
                                <label class="col-sm-4 control-label">Amount</label>
                                <div class="col-sm-5">
                                    <p class="form-control-static">${moneyFormat(recurring.amount)}/month</p>
                                </div>
                                <div class="col-sm-3 text-right">
                                    <button id="subscriptionEditAmountButton" type="button" onclick="subscriptionEditAmount(${recurring_price}, ${userId});" class="btn btn-default btn-sm">Edit</button>
                                </div>
                            </div>
                            <div class="form-group">
                                <label for="recurringAutoUpdate" class="col-sm-4 control-label" title="">Auto update 
                                    <i tabindex="0" class="fa fa-question form-icon-help" onclick="showPopover(this)" data-container="body" data-toggle="popover" data-trigger="focus" data-placement="top" data-content="In the position 'On' the amount of recurring payments of your active devices will be automatically updated."></i>
                                </label>
                                <div class="col-sm-8">
                                    <div class="check_buttons_block" id="autoUpdateSubscriptionBlock">
                                        <button type="button" class="btn btn-default ${(recurring.autoUpdate == 1 ? 'active' : '')}" onclick="doActive(this); autoUpdateSubscriptionBtn(${recurring.autoUpdate}, ${userId})" data-val="1">On</button>
                                        <button type="button" class="btn btn-default ${(recurring.autoUpdate == 0 ? 'active' : '')}" onclick="doActive(this); autoUpdateSubscriptionBtn(${recurring.autoUpdate}, ${userId})" data-val="0">Off</button>
                                    </div>
                                </div>
						    </div>
                            <div class="form-group">
                                <label class="col-sm-4 control-label">Next Payment</label>
                                <div class="col-sm-8">
                                    <p class="form-control-static">${convertDateToUSA(recurring.lastRecurringCheck)}</p>
                                </div>
                            </div>
                            <div class="placeMessages"></div>
                        </form>
                    </div>
                    <div class="modal-footer modal-footer-light">
                        <button type="button" id="cancer_sub" class="btn btn-sm btn-default" onclick="cancelSubscriptionConfirmation(${userId})">Cancel Subscription</button>
                    </div>
                </div>
            </div>
        </div>`);
        if(parseInt(recurring.autoUpdate) === 1) {
            $('#subscriptionEditAmountButton').hide();
        } else if(parseInt(recurring.autoUpdate) === 0) {
            $('#subscriptionEditAmountButton').show();
        }
        $("#recurringModal").modal('show');
    } else {
        $('#recurringModal').remove();
        $($('.content').length > 0 ? '.content' : 'body').append(`<div class="modal modal-white" id="recurringModal">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">&times;</span></button>
                        <h4 class="modal-title">Recurring payments</h4>
                    </div>
                    <div class="modal-body">
                        <p class="text-center">No recurring payments at the moment<br/>Create a new recurring payment subscription.</p>
                        <div class="form-horizontal">
                            <div class="form-group">
                                <label for="rec_months" class="col-sm-4 control-label">Months</label>
                                <div class="col-sm-8">
                                    <select class="form-control" id="rec_months">
                                        <option value="1">1</option>
                                        <option value="2">2</option>
                                        <option value="3">3</option>
                                        <option value="4">4</option>
                                        <option value="5">5</option>
                                        <option value="6">6</option>
                                        <option value="7">7</option>
                                        <option value="8">8</option>
                                        <option value="9">9</option>
                                        <option value="10">10</option>
                                        <option value="11">11</option>
                                        <option value="12" selected="selected">12</option>
                                    </select>
                                </div>
                            </div>
                            <div class="form-group">
                                <label for="cart_type" class="col-sm-4 control-label">Credit Card</label>
                                <div class="col-sm-8">
                                    <select class="form-control" id="cart_type" onchange="actionSelectCartType(this)">
                                        <option value="0" selected="selected">Chose Payment type</option>
                                        <option value="3">Credit Card Authorize.net</option>
                                    </select></div>
                            </div>
                            <div class="form-group" id="cr_card_rec_box" style="display: none;">
                                <label for="rec_amount" class="col-sm-4 control-label">Monthly amount $</label>
                                <div class="col-sm-8">
                                    <input type="text" value="0" id="rec_amount" class="form-control"/>
                                </div>
                            </div>
                            <div class="placeMessages"></div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
                        <button type="button" id="create_recurring" class="btn btn-primary" onclick="createSubscriptionBtnClick()">Create
                        </button>
                    </div>
                </div>
            </div>
        </div>`);
        $('<input>').attr({type: 'hidden', name: 'userId', id: 'rec_userId'}).val(userId).appendTo('#recurringModal .form-horizontal');
        $("#rec_amount").mask('99999.99', {reverse: true});
        $("#rec_amount").val(recurring_price);
        $("#recurringModal").modal('show');
    }
}
function actionSelectCartType(e) {
    if($(e).val() == 1){
        $('#create_recurring').show();
        $('#ach_rec_box').hide();
        $('#cr_card_rec_box').show();
    }
    else if($(e).val() == 3){
        $('#create_recurring').show();
        $('#ach_rec_box').hide();
        $('#cr_card_rec_box').show();
    }else{
        $('#create_recurring').hide();
        $('#ach_rec_box').hide();
        $('#cr_card_rec_box').hide();
    }
}
function createSubscriptionBtnClick() {
    resetError();
    var card_type = parseInt($('#cart_type').val()),
        amount = $('#rec_amount').val(),
        months = $('#rec_months').val(),
        userId = $('#rec_userId').val(),
        description = 'Creating recurring payment for $'+amount;

    amount = parseFloat(amount.replace(/,/g, '.').trim()).toFixed(2);

    if(card_type == '' || card_type == 0 || isNaN(card_type)) {
        setError($('#rec_months'), 'Chose the payment type');
    }
    if(card_type == 1) {
        if(months == '')
            setError($('#rec_months'), 'Enter month');
        else if(months < 1)
            setError($('#rec_months'), 'Min allowed 1 month');
        else if(months > 12)
            setError($('#rec_months'), 'Max allowed 12 month');
    }
    if(amount == '' || isNaN(amount))
        setError($('#rec_amount'), 'Enter amount');
    else if(amount < 1)
        setError($('#rec_amount'), 'Minimal allowed amount is 1 $');
    else if(amount > 99999.99)
        setError($('#rec_amount'), 'Max allowed amount 99999.99$');

    if($('#recurringModal').find('.error').length)
        return false;

    finances.generateInvoiceId(function (result) {
        var invoiceId = result.data.invoiceId;

        // USAEPAY
        if(card_type == 1) {
            var data = {data:{
                    action: 'createRecurring',
                    amount:amount,
                    months:months,
                    card_type:card_type,
                    invoiceId:invoiceId
                }};
            $.ajax({
                url:MAIN_LINK+'/db/dashController/' + '?' + window.location.search.substring(1),
                method:"POST",
                contentType: "application/json", // send as JSON
                data:JSON.stringify(data),
                success: function(data){
                    var response = jQuery.parseJSON(data);
                    if(response.code == '000'){
                        var data = response.data;
                        $('#payment_form').append('<input type="hidden" name="UMstart" value="'+data.UMstart+'" />');
                        $('#payment_form input[name="UMaddcustomer"]').val('yes');
                        $('#payment_form input[name="UMnumleft"]').val(data.UMnumleft == 0 ? '*' : data.UMnumleft); //Terms
                        $('#payment_form input[name="UMkey"]').val(data.UMkey);
                        $('#payment_form input[name="UMcommand"]').val(data.UMcommand);
                        $('#payment_form input[name="UMhash"]').val(data.UMhash);
                        $('#payment_form input[name="x_login"]').val(data.loginID);
                        $('#payment_form input[name="UMamount"]').val(data.amount);
                        $('#payment_form input[name="UMname"]').val(data.name + ' ' + data.lastName);
                        $('#payment_form input[name="x_last_name"]').val(data.lastName);
                        $('#payment_form input[name="x_company"]').val(data.carrierName);
                        $('#payment_form input[name="UMdescription"]').val(data.description);
                        $('#payment_form input[name="UMinvoice"]').val(data.invoice);
                        $('#payment_form input[name="x_fp_sequence"]').val(data.sequence);
                        $('#payment_form input[name="x_fp_timestamp"]').val(data.timeStamp);
                        $('#payment_form input[name="x_fp_hash"]').val(data.fingerprint);
                        $('#payment_form input[name="UMcustid"]').val(data.userId);
                        $('#payment_form input[name="UMcustom1"]').val(data.userId);
                        // console.log($('#payment_form'));

                        // alert($('#payment_form'));
                        $('#payment_form').submit();
                    }else{
                        alert(response.message);
                    }
                }
            });
        }
        // Authorize.net
        else if (card_type == 3) {
            $('.modal-white').modal('hide');

            var data = {
                action:'paymentAction',
                title: 'Recurring Payment',
                amount: amount,
                description: description,
                invoiceId: invoiceId,
                months: months,
                paymentAction: 'createSubscription',
                userId:userId
            };

            showModalAuthorizePayment(data);

            $('#autorizenetPayForm .form-horizontal-info').append(`<div class="form-group orderMonthsGroup">
        <label for="cart_type" class="col-sm-4 control-label">Months:</label>
            <div class="col-sm-8">
                <p class="form-control-static">${months}</p>
            </div>
        </div>`);
        }
    });
}

/**
 * Edit Subscription Amount
 */
function subscriptionEditAmount(minPrice, userId = 0) {
    $('#subscriptionEditBlockAmount').empty().append(`
        <label class="col-sm-4 control-label" for="rec_edit_amount">Monthly amount: $</label>
        <div class="col-sm-5">
            <input type="text" value="${minPrice}" id="rec_edit_amount" class="form-control"/>
        </div>
        <div class="col-sm-3 text-right">
            <button type="button" id="updateSubscriptionAmountButton" onclick="updateSubscriptionAmountClick(${userId})" class="btn btn-default btn-sm">Save</button>
        </div>
    `);
}
function updateSubscriptionAmountClick(userId = 0) {
    resetError();
    var amount = $('#rec_edit_amount').val();
    amount = parseFloat(amount.replace(/,/g, '.').trim()).toFixed(2);
    if(amount == '' || isNaN(amount))
        setError($('#rec_edit_amount'), 'Enter amount');
    else if(amount < 1)
        setError($('#rec_edit_amount'), 'Minimal allowed amount is 1 $');
    else if(amount > 99999.99)
        setError($('#rec_edit_amount'), 'Max allowed amount 99999.99$');

    if($('#recurringUpdateForm').find('.error').length)
        return false;

    $('#updateSubscriptionAmountButton').prop('disabled', 'disabled');
    AjaxController('updateSubscription', {amount: amount, userId: userId}, financesUrl, 'updateSubscriptionHandler', autorizenetErrorHandler, true);
}
function updateSubscriptionHandler(response) {
    $('#updateSubscriptionAmountButton').prop('disabled', false);
    if(response.data.result === true) {
        var recurring = response.data.recurring;
        var userId = typeof recurring.userId !== 'undefined' ? recurring.userId : 0;
        var amount = parseFloat(recurring.amount).toFixed(2);

        if(typeof response.data.curUserIsEzlogzEmployee !== 'undefined' && response.data.curUserIsEzlogzEmployee === true) {
            $('#recurringCardPayInfo').text(' (+'+amount + '$ till '+convertDateToUSA(recurring.recurringTill)+')');
        }

        $('#subscriptionEditBlockAmount').empty().append(`
            <label class="col-sm-4 control-label">Amount</label>
            <div class="col-sm-5">
                <p class="form-control-static">${moneyFormat(recurring.amount)}/month</p>
            </div>
            <div class="col-sm-3 text-right">
                <button type="button" onclick="subscriptionEditAmount(${response.data.minRecurringPrice}, ${userId})" class="btn btn-default btn-sm">Edit</button>
            </div>
        `);
    }
}
function autoUpdateSubscriptionBtn(autoUpdate, userId = 0) {
    resetError();
    var enabled = parseInt($('#autoUpdateSubscriptionBlock').find('button.active').attr('data-val'));
    if(autoUpdate !== enabled) {
        if(enabled === 1) {
            $('#subscriptionEditAmountButton').hide();
        } else if(enabled === 0) {
            $('#subscriptionEditAmountButton').show();
        }
        AjaxController('autoUpdateSubscriptionEnable', {enabled: enabled, userId: userId}, financesUrl, 'autoUpdateSubscriptionBtnHandler', autorizenetErrorHandler, true);
    }
}
function autoUpdateSubscriptionBtnHandler(response) {
    subscriptionBtnClick(response.data.userId);
}

/**
 * Cancel Subscription
 * @param userId
 */
function cancelSubscription(userId = 0) {
    $('#cancelSubscriptionBtn').attr('disabled', true);
    AjaxController('cancelSubscription', {userId: userId}, financesUrl, sentPaymentAutorizenetHandler, autorizenetErrorHandler, true);
}
function cancelSubscriptionConfirmation(userId = 0) {
    var content = 'Do you want to cancel the subscription?';
    var params = {footerButtons:`<button class="btn btn-default" id="cancelSubscriptionBtn" type="button" onclick="cancelSubscription(${userId})">Confirm</button>`};
    showModal('Cancel subscriptions', content, '', '', params);
}

function showSelectPaymentModal(data={}) {
    c(data);
    var inputsHidden = '';
    $.each(data, function (key, val) {
        inputsHidden += `<input type="hidden" name="${key}" value="${val}">`;
    });
    data.amount = typeof data.amount !== 'undefined' ? data.amount : 0;
    var amountPlace = `<span id="paymentAmountPlace">${typeof data.amount !== 'undefined' ? moneyFormat(data.amount) : 0}</span>`;
    if(typeof data.paymentAction !== 'undefined' && data.paymentAction === 'deposit') {
        amountPlace = '<input type="text" class="form-control input-sm" name="amount" placeholder="amount">';
    }

    var content = `
        <ul class="row payment-systems" id="paymentSystemsList"></ul>
        <div id="payment_subbox" class="table_wrap">
            <form id="paymentForm">
                ${inputsHidden}
                <div class="tableTabButtonsBox">
                    <div class="tableTabOneButtonBox">
                        <button type="button" class="car_users">Review Payment</button>
                    </div>
                </div>
                <table class="table table-striped table-dashboard table-sm mb-4">
                    <thead>
                        <tr>
                            <th>Invoice Number</th>
                            <th>Date</th>
                            <th>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td id="paymentInvoice">${typeof data.invoiceId !== 'undefined' ? 'Invoice #' + data.invoiceId : ''}</td>
                            <td>${convertDateToUSA(getCurrentDay())}</td>
                            <td>${amountPlace}</td>
                        </tr>
                    </tbody>
                </table>
            </form>
            <div class="additionalField ach">
                <div><label>Routing Number:</label> <input type="text" name="ach_rout" id="ach_rout" /></div>
                <div><label>Account Number:</label> <input type="text" name="ach_acc" id="ach_acc" /></div>
                <div><label>Name on Account:</label> <input type="text" name="ach_name" id="ach_name" /></div>
            </div>
        </div>`;

    var footerButtons = '<button class="btn btn-default" onclick="btnPayNow(this)">Pay Now</button>';
    $('#paymentModal').modal('hide');
    showModal('Pay Invoices', content, 'paymentModal', 'modal-lg', {footerButtons: footerButtons});
    finances.getPaymentSystemsList();
}

function selectPayment(e) {
    var paymentId = $(e).data('payment-id');
    $('#paymentSystemsList li').removeClass('active');
    $('#paymentSystemsList li[data-payment-id="'+paymentId+'"]').addClass('active');
    $('.modal .modal-message').remove();
    if($('#paymentSystemsList li[data-payment-id="2"].active').length && PAYPAL_TAX_PERCENT > 0) {
        $('#paymentSystemsList').after('<p class="modal-message">By paying with PayPal you will be charged additional transaction tax(2.9% + 0.3$)</p>');
    }
}
function downloadAllTerms(el, event) {
    event.stopPropagation();
    var type = $(el).attr('data-type');
    var orderId = $(el).closest('tr').attr('data-id');
    var order_type = $(el).attr('data-order_type');
    if(typeof orderId == 'undefined') {
        orderId = $(el).attr('data-orderid');
    }
    var data = {
        name: type,
        orderId: orderId,
        print_settings:{
            read: 1
        }
    };
    let fleetId = $(el).attr('data-fleetid');
    if(typeof orderId != 'undefined') {
        data.fleet_id = fleetId;
    }
    let scannerId = $(el).attr('data-scannerid');
    if(typeof scannerId != 'undefined') {
        data.scanner_id = scannerId;
    }
    let orderDate = $(el).attr('date-orderdate');
    if(typeof orderDate != 'undefined') {
        data.order_date = orderDate;
    }
    var params = {};
    params.name = "allTerms";
    params.data = JSON.stringify(data);
    if (order_type == 2) {
        if (type == 'equipment_lease') {
            pdfGen.generateAndSendForm(params, {'action': 'purchase'});
        } else {
            pdfGen.generateAndSendForm(params, {'action': 'newSaasAgreement'});
        }
    } else {
        pdfGen.generateAndSendForm(params, {'action':'allTerms'});

    }
}
function downloadFullOrderInfo(el) {
    var orderId = $(el).attr('data-orderid');
    var data = {
        name: 'FullOrderInfo',
        orderId: orderId,
        print_settings:{
            read: 0
        }
    };
    var params = {};
    params.name = "FullOrderInfo";
    params.data = JSON.stringify(data);
    pdfGen.generateAndSendForm(params, {'action': 'FullOrderInfo'});
}
/**
 * Reactivation modal
 */
function reactivatePopup (){
    $('#reactivationModal').remove();
    $($('.content').length > 0 ? '.content' : 'body').append(`<div class="modal modal-white" id="reactivationModal">
		<div class="modal-dialog"><div class="modal-content">
			<div class="modal-header">
				<button type="button" class="close" data-dismiss="modal" aria-label="Close">
					<span aria-hidden="true">&times;</span>
				</button>
				<h4 class="modal-title">Fleet Reactivation</h4>
			</div>
			<div class="modal-body">
				<div class="row">
					<div class="col-xs-12">
						<p>By Approving Fleet reactivation you will need to pay additional $34.99 reactivation fee and will have 14 days to pay all fleet dues.</p>
					</div>
				</div>
			</div>
			<div class="modal-footer">
				<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
				<button type="button" class="btn btn-primary" id="approveRactivation" onclick="approveRactivation()">Approve Reactivate</button>
			</div>
		</div>
	</div></div>`);
    $("#reactivationModal").modal('show');
}
function approveRactivation(){
    $('#approveRactivation').attr('disabled', true);
    AjaxController('approveRactivation', {}, dashUrl, 'approveRactivationHandler', errorBasicHandler, true);
}
function approveRactivationHandler(){
    window.location.href = window.location.href
}
/**
 * Generate Payment Link
 */
function generateClicked(){
    if(fleetC.checkDemoAccess()){return false;}
    var amount = parseFloat($('#gen_amt').val().replace(/,/g, '.'));
    resetError();
    if(amount == '' || isNaN(amount))
        return setError($('#gen_amt'), 'Enter amount');
    else if(amount < 1)
        return setError($('#gen_amt'), 'Minimal allowed amount is 1 $');
    else if(amount > 99999.99)
        return setError($('#gen_amt'), 'Max allowed amount 99999.99$');
    AjaxController('generatePaymentLink', {amt:amount}, financesUrl, 'generatePaymentLinkHandler', errorBasicHandler, true);
}
function generatePaymentLinkHandler(response){
    var url = window.location.origin+'/paylink/?data='+response.data.invoiceId;
    $('#paymentLinkModal .modal-footer button[onclick="generateClicked()"]').remove();
    $('#paymentLinkModal .modal-body').empty().append(`<a class="word-break-all" href="${url}" target="_blank">${url}</a>`);
}
function generatePaymentLink() {
    AjaxController('getCountActiveEldScanners', {}, dashUrl, 'generatePaymentLinkModal', errorBasicHandler, true);
}
function generatePaymentLinkModal(response) {
    var amt = response.data.price;
    $('#paymentLinkModal').remove();
    $($('.content').length > 0 ? '.content' : 'body').append(`<div class="modal modal-white" id="paymentLinkModal">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                    <h4 class="modal-title">Generate Payment Link</h4>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="refuseAmountInput">Amount $</label>
                        <input type="text" step="0.01" id="gen_amt" class="form-control" value="${amt}">
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
                    <button type="button" class="btn btn-primary" onclick="generateClicked()">Generate</button>
                </div>
            </div>
        </div>
	</div>`);
    $("#paymentLinkModal").modal('show');
}
