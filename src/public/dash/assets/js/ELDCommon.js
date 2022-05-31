function eldCommonClass() {
    var self = this;
    self.deliveryCalculateRate = false;

    self.deliveryCalculate = function(e) {
        self.deliveryCalculateRate = $(e).data('val') === 1 ? true : false;
        calculateOrder();
    };
}

var eldCommon = new eldCommonClass();

function calculateOvernightDeliveryPrice(amount, cables) {

    var count = $.map(cables, function(n, i) { return i; }).length;
    if(4 in cables && (count > 1 || amount > 0)) {
        delete cables[4];
    }
    var countCables = Object.keys(cables).reduce((sum, key) => sum += parseInt(cables[key]), 0);
    //Sticker overnight delivery
    if(4 in cables && count == 1 && amount == 0) {
        return 31.99
    }
    return Math.ceil((countCables / 5) + (amount / 12)) * 31.99;
}
function getNum(val) {
    if (isNaN(val)) {
        return 0;
    }
    return val;
}
function calculateOrder() {
    $('#eld_order_form .error_mes').remove();
    var order_type= $('#order_type').val();
    var amount = $.trim($('#eld_order_form #number_device').val()),
        zip = $.trim($('#eld_order_form #zip').val()),
        overnightDeliveryCheck = $('#overnightDelivery')[0].checked,
        devicePrice = 0,
        firMonPrice = eldTariffs[order_type].fee_price;
    var cablesPrices = 0;

    var cables = {};
    $('.one_cable input').each(function(){
        if($(this).val() > 0){
            cables[$(this).closest('.one_cable').attr('data-id')] = $(this).val();
            cablesPrices+= toDecimal(parseFloat($(this).closest('.one_cable').attr('data-price')) * parseInt($(this).val()));
        }
    });
    var num_devices = getNum($('#number_device').val());
    if(num_devices == 0){
        num_devices = 1;
    }
    $.each(eldTariffs, function(key, val) {
        $('.order_type_one_box .order_inner_box[data-type="' + key + '"]').find('.order_price')
            .text('$' + toDecimal((key == 0 || key == 3 ? 1 : num_devices) * val.price, 2));
    });
    if ((amount != '' && amount > 0) || $.map(cables, function(n, i) { return i; }).length) {
        var orderPrice = toDecimal(amount * devicePrice),
            firstMonPrice = toDecimal(amount * firMonPrice),
            lastMonPrice = order_type === '0' || order_type === '3' ? toDecimal(amount * eldTariffs[order_type].price) : 0,
            deliveryPrice = 0;
        orderPrice += cablesPrices;
        if(order_type !== '0' && order_type !== '3') {
            orderPrice += amount * eldTariffs[order_type].price;
        }
        var descr = '';
        if(eldCommon.deliveryCalculateRate === true) {
            if (validate.zip(zip)) {
                $('#send_order').attr('disabled', true);
                var params = {
                    amount: amount,
                    zip: zip,
                    cables: cables
                };
                calculateDeliveryRate(params, function (response) {
                    if (response.code == '000') {
                        descr = '';
                        if (response.data.deliveryPrice != 0) {
                            deliveryPrice = toDecimal(response.data.deliveryPrice);
                        } else {
                            descr = response.data.deliveryError;
                        }
                        deliveryPrice = overnightDeliveryCheck ? calculateOvernightDeliveryPrice(amount, cables) : deliveryPrice;
                        displayPrices(orderPrice, firstMonPrice, deliveryPrice, descr, amount, lastMonPrice);
                    }
                    $('#send_order').attr('disabled', false);
                });
            } else {
                resetError();
                descr = 'Please enter a valid ZIP.';
                setError($('#infoOrderBlock input[name="zip"]'), descr);
                deliveryPrice = overnightDeliveryCheck ? calculateOvernightDeliveryPrice(amount, cables) : deliveryPrice;
                displayPrices(orderPrice, firstMonPrice, deliveryPrice, descr, amount, lastMonPrice);
            }
        } else {
            displayPrices(orderPrice, firstMonPrice, 0, descr, amount, lastMonPrice);
        }
    }else{
        deliveryPrice = overnightDeliveryCheck ? calculateOvernightDeliveryPrice(amount, cables) : 0;
        displayPrices(parseFloat(cablesPrices), 0, deliveryPrice, '', amount, 0);
    }
}
function calculateDeliveryRate(data, call) {
    AjaxCall({url: dashUrl, action: 'calculateDeliveryRate', data: data, successHandler: call});
}
function clearCables(el){
    $(el).closest('.one_cable').find('input').val(0);
    calculateOrder();
}
function toDecimal(val, dec = 2){
    return Number(Number(val).toFixed(dec));
}
function displayPrices(orderPrice, firstMonPrice, deliveryPrice = 0, description = '', amount=0, lastMonPrice=0){
    resetError($('#error_place'));
    $('.error-handler').empty();
    var depositFee = amount * ELD_DEPOSIT_FEE;
    var totalOrder = 0;
    if(deliveryPrice == 0){
        setError($('#error_place'), description + ' The cost of delivery can not be calculated');
        totalOrder = toDecimal(orderPrice + firstMonPrice + deliveryPrice + depositFee + lastMonPrice) + ' + delivery price(will be informed on the call)';
    }else{
        totalOrder = toDecimal(orderPrice + firstMonPrice + deliveryPrice + depositFee + lastMonPrice);
    }
    $('#eld_order_form #eld_order_price b').empty().text('$ '+ toDecimal(orderPrice));
    $('#eld_order_form #eld_first_price b').empty().text('$ '+ toDecimal(firstMonPrice));
    $('#eld_order_form #eld_last_price b').empty().text('$ '+ toDecimal(lastMonPrice));
    $('#eld_order_form #eld_delivery_price b').empty().text('$ '+ toDecimal(deliveryPrice));
    $('#eld_order_form #eld_deposit_fee b').empty().text('$ '+ toDecimal(depositFee));
    $('#eld_order_form #eld_total_order b').empty().text('$ '+ totalOrder);
}

function addMonthsUTC (date, count) {
    if (date && count) {
        var m, d = (date = new Date(+date)).getUTCDate()

        date.setUTCMonth(date.getUTCMonth() + count, 1)
        m = date.getUTCMonth()
        date.setUTCDate(d)
        if (date.getUTCMonth() !== m) date.setUTCDate(0)
    }
    return date
}