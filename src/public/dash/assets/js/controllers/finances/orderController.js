function orderControllerClass() {
    var self = this;
    self.deliveryCalculateRate = true;
    self.products = [];
    self.cameraSetupFee = 29.99;
    self.cameraInstallationFee = 100;
    self.order_type = '';
    self.order_camera_type = '';

    this.order = function () {
        if(fleetC.checkDemoAccess()){return false;}
        resetError($('#orderForm'));
        var form = $('#orderForm').serializeObject();
        const productsSum = form.products.reduce((partial_sum, a) => parseInt(partial_sum) + parseInt(a),0);
        if(Number(form.amount) < 1 && Number(productsSum) < 1) {
            self.orderCUEldErrorHandler({"code":"701","message":"Order can be placed with at least one product"});
            return false;
        }

        self.validateCUOrderForm(form);

        form.deliveryCalculateRate = self.deliveryCalculateRate;

        if(curUserIsEzlogzEmployee()) { //Manager Create Order
            self.orderELDAdmin(form);
        } else {
            c(form);
            if($('#orderForm .error').length) { //CU Create Order
                return false;
            }
            $('#send_order').attr('disabled', true);
            lastAction = 'orderELD';
            AjaxCall({url: dashUrl, action: 'orderELD', data: form, successHandler: basicEldHandler, errorHandler: self.orderCUEldErrorHandler});
        }
    };

    this.orderCUEldErrorHandler = function(response) {
        var errorMessage = response.message;
        $('#error_place').append('<div class="error-handler"></div>');
        alertError($('#error_place .error-handler'), errorMessage, 6000);
        $('#send_order').prop('disabled', false);
    };

    /**
     * GET table selected products and calculate total price
     * @returns {{calc: {cameraPrices: number, relatedPrices: number, productPrices: number}, products: Array}}
     */
    this.getSelectedProducts = function() {
        var products = [];
        var calc = {productPrices:0, cameraPrices:0, relatedPrices:0};
        $('#tableProductList input.product_numbers').each(function(){
            var $tr = $(this).closest('tr.product_item');
            var data = $tr.data();
            var amt = parseInt($(this).val());
            products[$(this).closest('tr.product_item').data('id')] = amt;
            calc.productPrices += toDecimal(parseFloat(data.price) * amt);
            if(data.category_id == 2) {
                calc.cameraPrices += toDecimal(parseFloat(data.price) * amt);
            }

            //Calc Related Products
            if($tr.find('select[name="related_products['+ data.id +'][parent_id]"]').length && amt > 0) {
                var related_product_id = parseInt($tr.find('select[name="related_products['+ data.id +'][parent_id]"]').val());
                if(related_product_id > 0) {
                    var productsCategory = self.products.find(x => x.category_id === data.category_id);
                    var related_products = productsCategory.related_products.find(x => x.id === related_product_id);
                    calc.relatedPrices += toDecimal(parseFloat(related_products.price) * amt);
                }
            }
        });
        return {products: products, calc:calc};
    };
    
    self.lastChangedRelatedProduct = false;
    self.changeRelatedProduct = function(el){
        if(self.lastChangedRelatedProduct == $(el).attr('name')){
            c('set false')
            self.lastChangedRelatedProduct = false;
            return 1;
        }
        var relatedEl = $(el).closest('tr').find('[name="'+$(el).attr('name')+'"]').not(el);
        self.lastChangedRelatedProduct = $(el).attr('name')
        c('set val')
        relatedEl.val($(el).val())
        self.lastChangedRelatedProduct = false;
        self.calculate();
    }
    
    self.calculate = function () {
        var form = $('#orderForm').serializeObject();
        self.deliveryCalculateRate = form.pick_up == 1 ? false : true;
        $('#send_order').attr('disabled', true);
        AjaxCall({url: financesUrl, action: 'calculateOrder', data: form, successHandler: self.displayPrices, errorHandler: self.orderCUEldErrorHandler, uniqueRequest: true});
    };

    this.displayPrices = function(response) {
        $('#send_order').attr('disabled', false);
        var data = response.data.result;
        var creditTr = parseInt($('#order_camera_type').val()) === 8;
        resetError();
        $('#deliveryTotalInfo').remove();
        $('.error-handler').empty();

        if(!validate.zip($('#zip').val()) && self.deliveryCalculateRate)
            setError($('#zip'), 'Please enter a valid ZIP');
        var delivery_price = typeof data.product_calculate.services === 'undefined' || typeof data.product_calculate.services.delivery_price === 'undefined' || typeof data.product_calculate.services.delivery_price.price === 'undefined' ? 0 : data.product_calculate.services.delivery_price.price;
        if(delivery_price === 0 && self.deliveryCalculateRate && data.product_calculate.total > 0){
            $('#error_place').append('<div class="error-handler"></div>');
            alertError($('#error_place .error-handler'), 'The cost of delivery can not be calculated, delivery price (will be informed on the call)', 6000);
        }
        $('#orderPriceCountPlace').empty();

        if(data.product_calculate.total > 0) {
            $('#orderPriceCountPlace').append(`<div class="border-table">
            <table class="table table-order-price-calc" id="groupOrderPriceTable">
                <head>
                    <tr>
                        <th></th>
                        <th class="text-center">Amount</th>
                        ${creditTr === true ? `<th class="text-center">Credit</th>` : ''}
                    </tr>
                </head>
                <tbody>
                </tbody>
            </table>
            </div>`);
        }
        if(typeof data.product_calculate.services !== 'undefined') {
            $.each(data.product_calculate.services, function(key, val) {
                self.orderPriceCalcTr({id:key, type: 'services', name:val.name, total: val.total, price: val.price, amount:val.amount, credit_checkbox: val.credit_checkbox, count_credit: val.count_credit});
            });
        }
        if(typeof data.product_calculate.products !== 'undefined') {
            $.each(data.product_calculate.products, function(category_id, product_categories) {
                $.each(product_categories, function(key, val) {
                    self.orderPriceCalcTr({id:key, type: 'products', name:val.name, total: val.total, price: val.price, amount:val.amount, credit_checkbox: val.credit_checkbox, count_credit: val.count_credit});
                });
            });
        }

        //TOTAL
        if(data.product_calculate.total > 0) {
            $('#groupOrderPriceTable').append(`<tr class="tr-temp">
                <td><strong>TOTAL</strong></td>
                <td class="text-center price">${moneyFormat(data.product_calculate.total)}</td>
                ${creditTr === true ? `<td class="text-center"></td>` : ''}
            </tr>`);
        }

        if(data.all_order_credit === true)
            self.checkAllInCredit();
        if(creditTr === true)
            self.calculateOrderCredit();
    };

    this.orderPriceCalcTr = function(data) {
        if (self.order_type == 15 && data.id == 'orderPrice') {
            return false;
        }
        var creditTr = parseInt($('#order_camera_type').val()) === 8;
        if(data.total > 0) {
            $('#groupOrderPriceTable').append(`<tr class="tr-temp">
            <td>${data.name}${superAdminRights.price_editing ? '<input type="number" onchange="orderController.changePriceFee(this)" onkeyup="orderController.changePriceFee(this)" name="newcredit['+data.type+']['+data.id+'][price]" value="'+data.price+'" step="0.01" min="0"  />' : ''}</td>
            <td class="text-center price">${moneyFormat(data.total)}
                <input type="hidden" name="credit[${data.type}][${data.id}][name]" value="${data.name}">
                <input type="hidden" name="credit[${data.type}][${data.id}][id]" value="${data.id}">
                <input type="hidden" name="credit[${data.type}][${data.id}][price]" value="${data.price}">
                <input type="hidden" name="credit[${data.type}][${data.id}][amount]" value="${data.amount}">
                <input type="hidden" name="credit[${data.type}][${data.id}][total]" value="${data.total}">
                ${data.credit_checkbox === false && data.count_credit === true ? `<input type="hidden" name="credit[${data.type}][${data.id}][in_credit]" value="1">`: ''}
            </td>
            ${creditTr === true ? `<td class="text-center">${data.count_credit === true ? `<input name="credit[${data.type}][${data.id}][in_credit]" value="1" ${data.credit_checkbox === false ? 'checked="checked"' : ''} ${data.credit_checkbox === false ? 'disabled="disabled"' : ''} data-checked-all="true" type="checkbox" onclick="orderController.calculateOrderCredit();">`:''}</td>` : ''}
        </tr>`);
        }
    };

    this.changePriceFee = function(){
        self.calculate();
    }

    this.calculateOrderCredit = function() {
        var form = $('#orderForm').serializeObject();
        c(form);
        self.deliveryCalculateRate = form.pick_up == 1 ? false : true;
        $('#send_order').attr('disabled', true);
        AjaxCall({url: financesUrl, action: 'calculateOrderCredit', data: form, successHandler: self.calculateOrderCreditHandler, errorHandler: self.orderCUEldErrorHandler});
    };

    this.calculateOrderCreditHandler = function(response) {
        $('#send_order').attr('disabled', false);
        c(response.data.result);
        var data = response.data.result;
        $('#groupOrderPriceList li.li-temp, #list_eld_credit_fee li.li-temp').remove();
        if(data.credit_monthly_payment > 0) {
            $('#list_eld_credit_fee').append('<li class="list-group-item li-temp"><span class="badge">'+moneyFormat(data.credit_monthly_payment)+'</span>Credit monthly payment (approximately)</li>');
        }
        if(data.credit_sum > 0) {
            $('#orderCreditBlock').show();
            $('#list_eld_credit_fee').append('<li class="list-group-item li-temp"><span class="badge" id="eld_credit_fee">'+moneyFormat(data.credit_sum)+'</span>Total credit price</li>');
        }
    };

    this.checkAllInCredit = function() {
        $('#orderPriceCountPlace input[data-checked-all="true"]').prop('checked', $('#all_order_credit').prop('checked'));
    };

    this.selectTariff = function(e) {
        if($(e).attr('disabled') !== 'disabled') {
            $(e).closest('.row-tariffs').find('.tariff-marker').remove();
            $(e).closest('.row-tariffs').find('[class*=col-]').removeClass('active');
            $(e).addClass('active').find('.item').append('<i class="tariff-marker"></i>');

            eldCommon.deliveryCalculateRate = true;
            if ($(e).hasClass('cameraTariffItem')) {
                $('#order_camera_type').val($(e).data('id'));
                self.order_camera_type = $(e).data('id');
                if ($(e).data('id') == 8) {
                    $('#orderCreditBlock').show();
                } else {
                    $('#orderCreditBlock').hide();
                    $('#all_order_credit').prop('checked', false);
                }
            } else if ($(e).hasClass('eldTariffItem')) {
                $('#order_type').val($(e).data('id'));
                self.order_type = $(e).data('id');
            }
            if($(e).closest('.row').hasClass('initialised')){
                $(e).closest('.row').removeClass('initialised')
            }else{
                self.activeAgreements();
                orderController.calculate();
            }
        }
    };

    this.showBoxEldTariffs = function(value, type = 1) {
        if($('#amount').val() > 0) {
            //Append Tariffs List
            $('#eldTariffs').empty();
            $('#eldTariffs').append(self.getEldOrderTariffsBlock(type));
            self.order_type = '';

            //Select default ELD tariff plan
            if($('#order_type > option').length) {
                $('#eldTariffs').addClass('initialised');
                $('#eldTariffs div.eldTariffItem:first-child').click();
            }
            $('#eldTariffs').show();
            $('#eldTariffs').prev('h3.header').show();
        } else {
            $('#eldTariffs').hide();
            $('#eldTariffs').prev('h3.header').hide();
        }
        self.activeAgreements();
    };

    this.getEldOrderTariffsBlock = function(type = 1) {
        var item = '';
        let tariffsArr = [];
        $.each(eldTariffs[type], function(key, val) {
            if (checkTariffIsActive(val)) {
                val['id'] = key;
                tariffsArr.push(val);
            }
        })
        tariffsArr.sort((a, b) => (a.sort > b.sort) ? 1 : -1);
        $('#order_type').empty();
        $.each(tariffsArr, function(key, val) {
            // var price = $('#cameraTariffs').is(':visible') && (parseInt($('#order_camera_type').val()) === 7 || parseInt($('#order_camera_type').val()) === 8) ? val.price_discount_camera : val.price;
            let price = val.price;
            if (val.termsText !== '' && val.termsText !== ' ' && typeof val.termsText !== 'undefined' && val.termsText !== null) {
                var termsText = '<span class="label label-success">'+ val.termsText +'</span>';
            } else {
                var termsText = '';
            }
            if($('#cameraTariffs').is(':visible') && (parseInt($('#order_camera_type').val()) === 7 || parseInt($('#order_camera_type').val()) === 8) && val.text_discount_camera !== '') {
                termsText = '<span class="label label-warning">'+ val.text_discount_camera +'</span>';
            }

            var newPrice = 0;
            var decoration = '';
            var newPriceSpan = '';


            item += '' +
                '<div class="col-sm-12 col-md-4 eldTariffItem" data-id="'+ val.id +'" onclick="orderController.selectTariff(this)">\n' +
                '<div class="item">\n' +
                '<h4>'+val.name+'</h4>\n' +
                '<p><span class="price" '+decoration+'>'+ moneyFormat(price) +'</span> ' + newPriceSpan + val.description +'</p>\n' +
                termsText + '\n' +
                '</div>\n' +
                '</div>\n';
            $('#order_type').append('<option value="'+ val.id +'">'+ val.name +'</option>');
        });
        return item;
    };

    this.showBoxCameraTariffs = function(e) {
        $('#orderCreditBlock').hide();
        var showCameraTariffs = false;
        
        $.each($('#tableProductList input.product_numbers'), function(key, val) {
            var data = $(this).closest('tr.product_item').data();
            if($(this).val() > 0 && data.category_id === 2) {
                showCameraTariffs = true;
                var products = self.products.find(x => x.category_id === data.category_id);
                //Add child products
                self.getTableChildsProductList(products.related_products);
            }
            //Remove child products
            if($(this).val() == 0) {
                $('#tableProductList tr.product_item[data-parent_id="' + data.id + '"]').remove();
            }
        });
        if(showCameraTariffs) {
            if($('#cameraTariffs').children().length === 0) {
                //Append Tariffs List
                $('#cameraTariffs').append(self.getCameraOrderTariffsBlock());
                //Select default ELD tariff plan
                $('#cameraTariffs').addClass('initialised')
                $('#cameraTariffs div[data-id="7"]').click();
            }

            $('#cameraTariffs').show();
            $('#cameraTariffs').prev('h3.header').show();

            if($('.cameraTariffItem.active').length == 0 || $('#order_camera_type').val() == null){
                $('#cameraTariffs').addClass('initialised')
                $('#cameraTariffs div[data-id="7"]').click();
            }
        } else {
            self.order_camera_type = '';
            $('#order_camera_type').val(-1)
            $('#cameraTariffs').prev('h3.header').hide();
        }
        self.activeAgreements();
        self.showBoxEldTariffs('', $('#device_type_id').val());
    };

    this.getTableChildsProductList = function(data) {
        $.each(data, function(key, val) {
            if(val.is_addition === 0) {
                var item = '' +
                    '<tr class="product_item" data-id="' + val.id + '" data-parent_id="' + val.parent_id +'" data-price="' + val.price + '" data-img_url="' + val.img_url + '" data-description="' + val.description + '" data-name="' + val.name + '" data-category_id="' + val.category_id + '">\n' +
                    '<td class="text-center"><img src="/dash/assets/img/eld/thumb/' + val.thumb_url + '" onclick="orderController.showProductInfo(this)"></td>\n' +
                    '<td>' + val.name + '<p class="description">' + val.short_description + '</p></td>\n' +
                    '<td class="hidden-xs hidden-sm"></td>\n' +
                    '<td class="text-center">' +
                    '<input name="products[' + val.id + ']" type="number" min="0" max="999" class="product_numbers form-control check_input_number" value="0"  onchange="orderController.showBoxCameraTariffs(this);" onkeyup="orderController.showBoxCameraTariffs(this);" autocomplete="custom" />' +
                    '</td>\n' +
                    '<td class="text-center">' + moneyFormat(val.price) + '</td>\n' +
                    '<td class="text-center"><button type="button" class="clear-icon" onclick="orderController.clearCables(this)"></button></td>\n' +
                    '</tr>';
                if($('#tableProductList tr.product_item[data-id="' + val.id + '"]').length === 0) {
                    $('#tableProductList tr.product_item[data-id="' + val.parent_id + '"]').after(item);
                }
            }
        });
    };

    this.getCameraOrderTariffsBlock = function() {
        var item = '';
        $('#order_camera_type').empty();
        $.each(cameraTariffs, function(key, val) {

            var newPrice = 0;
            var decoration = '';
            var newPriceSpan = '';

            item += '' +
                '<div class="col-sm-12 col-md-6 col-eq cameraTariffItem" data-id="'+ key +'" data-category_id="'+ val.category_id +'" onclick="orderController.selectTariff(this)">\n' +
                '<div class="item">\n' +
                '<h4>'+val.name+'</h4>\n' +
                '<p><span class="price" '+decoration+'>'+ moneyFormat(val.fee_price) +'</span> ' + newPriceSpan + val.description +'</p>\n' +
                (val.termsText !== '' ? '<span class="label label-success">'+ val.termsText +'</span>' : '') + '\n' +
                '</div>\n' +
                '</div>\n';
            $('#order_camera_type').append('<option value="'+ key +'">'+ val.name +'</option>');
        });
        return item;
    };

    this.activeAgreements = function() {
        let eldOrder = $('#amount').val() > 0;
        let cameraOrder = $('.product_item[data-category_id="2"] .product_numbers').val() > 0;
        let eldPaymentId = $('#eldTariffs .eldTariffItem.active').attr('data-id');

        if(!curUserIsEzlogzEmployee()) {
            if(eldOrder || cameraOrder) {
                if (eldPaymentId == 13) {
                    $('#cameraTariffs').show();
                    $('#agreementCheckbox').hide();
                    $('#agreementLeaseCheckbox').show();
                } else {
                    $('#cameraTariffs').show();
                    $('#agreementCheckbox').show();
                    $('#agreementLeaseCheckbox').hide();
                }
            } else {
                $('#cameraTariffs').hide();
                $('#agreementCheckbox').hide();
                $('#agreementLeaseCheckbox').hide();
            }
        } else {
            cameraOrder ? $('#cameraTariffs').show() : $('#cameraTariffs').hide();
            $('#agreementCheckbox').hide();
            $('#agreementLeaseCheckbox').hide();
        }

        c('activeAgreements calculate')
        self.calculate();
    };

    this.clearCables = function(el) {
        $(el).closest('tr').find('input').val(0);
        self.showBoxCameraTariffs();
    };

    this.showProductInfo = function(el) {
        var data = $(el).closest('tr.product_item').data();
        var content = `<img width="100%" src="/dash/assets/img/eld/${data.img_url}" /><p>${data.description}</p>`;
        showModal(data.name, content, '#productInfo');
    };


    // manager sections -

    this.fleetPlaceShow = function() {
        $('#soloDriverPlace, .user_row').hide();
        // $('#fleetPlace').removeClass('hide');
        $('#fleet_select, #user_select').val('').removeAttr('data-id');
        if($('#createEldUser').is(':visible')){
            $('.newUser').click();
        }
        if($('#createFleet').is(':visible')){
            $('.newFleet').click();
        }
        $('#fleetPlace, #checkboxFleetOrSolo').show();
        $('#addressesOrderPlace').hide();
    };
    this.soloPlaceShow = function() {
        $('#fleetPlace').hide();
        resetError();
        $.each($('.info-order-block form'), function (c,$form) {
            $form.reset();
        });
        $('#send_order').prop('disabled', false);
        $('.info-order-block .box_row input, #infoOrderBlock input, .order-eld textarea').val('');
        $('.info-order-block select').val(0);
        $('#solo_driver_select').val('').removeAttr('data-id');
        $('#soloDriverPlace, #checkboxFleetOrSolo').show();
        $('#userSoloDriverForm, #soloDriverForm').hide();
        $('#addressesOrderPlace').hide();
    };

    this.newFleet = function(el) {
        if ($('#createFleet').is(':visible')) {
            $('#createFleet').hide();
            $(el).text('New Fleet');
            $('#fleet_select').val('').prop('disabled', false);
            $('.user_row').hide();
        } else {
            $('#createFleet').show();
            $(el).text('Chose Fleet');
            $('#fleet_select').val('').prop('disabled', true);
            $('.user_row').show();
            $('.fleets_list').addClass('hide');
            $('#user_select').val('').removeAttr('data-id');
           self.resetInfoOrderBlockForm();
        }
    };

    /**
     * RESET FORM InfoOrderBlockForm
     */
    this.resetInfoOrderBlockForm = function () {
        $('#infoOrderBlock input').val('');
        $('#reg_fl_state').empty();
        $.each(locationState.getStates(), function(key, state){
            $('#reg_fl_state').append('<option value="'+state.id+'" data-short="'+state.short+'">'+state.name+'</option>');
        });
    };

    //Live search Email
    this.liveCheckEmail = function() {
        AjaxController('findUsers', {email: $('#createEldUser input[name="email"]').val()}, adminUrl, self.searchEmailHandler, errorBasicHandler, true);
    };
    this.searchEmailHandler = function(response) {
        $('#searchEmailList').empty();
        $.each(response.data, function(key, user){
            $('#searchEmailList').append(`<li><a onclick="orderController.completeUserDataByEmail(this);" data-user='${JSON.stringify(user)}' href="#">(${user.email}) ${user.name} ${user.last}</a></li>`);
        });
        if(response.data.length == 0){
            $('#searchEmailList').append(`<li><a href="#">No user</a></li>`);
        }
    };
    this.completeUserDataByEmail = function(el) {
        var user = $(el).data('user');
        if(user.carrierId != null) {
            $('#createFleet').hide();
            $('#btnNewFleet').text('New Fleet');
            $('#fleet_select').val('').prop('disabled', false);
            AjaxController('findFleets', {id: user.carrierId}, adminUrl, self.setEldFleet, errorBasicHandler, true);
        }
        self.newUser($('#btnNewUser'));
        self.selectEldUser(el);
    };
    this.setEldFleet = function(response) {
        $('#user_select').empty();
        var fleet = response.data[0];
        $('#infoOrderBlock input[name="address"]').val(fleet.address);
        $('#infoOrderBlock input[name="city"]').val(fleet.city);
        $('#infoOrderBlock input[name="zip"]').val(fleet.zip);
        $('#infoOrderBlock select[name="state"] option').each(function(key, item){
            if($(item).text().toLowerCase() == fleet.state.toLowerCase()){
                $('#infoOrderBlock select[name="state"]').val($(item).val());
                return false;
            }
        });
        $('#fleet_select').attr('data-id', fleet.id).val(`(${fleet.usdot}) ${fleet.name}`);
        $('.user_row').show();
    };

    this.newUser = function(el) {
        resetError();
        if($('#createEldUser').is(':visible')){
            $('#createEldUser').hide();
            $(el).text('New User');
            $('#user_select').val('').prop('disabled', false);
        }else{
            $('#createEldUser').show();
            $(el).text('Chose User');
            $('#user_select').val('').prop('disabled', true);
        }
    };
    this.newSoloDriver = function(el) {
        resetError();
        $('#eld_order_form input').val('');
        $('#eld_order_form select').val(0);
        if($('#userSoloDriverForm').is(':visible')){
            $('#userSoloDriverForm, #soloDriverForm').hide();
            $(el).text('New Solo Driver');
            $('#solo_driver_select').val('').prop('disabled', false);
        }else{
            $('#userSoloDriverForm, #soloDriverForm').show();
            $(el).text('Chose Solo Driver');
            $('#solo_driver_select').val('').prop('disabled', true);
            $('#reg_dr_state').empty();
            $.each(locationState.getStates(), function(key, state){
                $('#reg_dr_state').append('<option value="'+state.id+'" data-short="'+state.short+'">'+state.name+'</option>');
            });
        }
    };
    //Check Fleets
    this.checkFleets = function(el) {
        $('#user_select').val('').removeAttr('data-id');
        $('#infoOrderBlock input').val('');
        $('#infoOrderBlock select').val(0);
        $('#device_type_id').val(2);
        $('.user_row').hide();
        var name = $(el).val();

        AjaxController('findFleets', {name:name}, adminUrl, self.findFleetsByNameHandler, errorBasicHandler, true);
    };
    this.findFleetsByNameHandler = function(response) {
        $('#fleetList').empty();
        $.each(response.data, function(key, fleet){
            fleet.name = fleet.name.replace(/ /g,'-');
            $('#fleetList').append(`<li><a onclick="orderController.selectEldFleet(this);" data-id="${fleet.id}" href="#">(${fleet.usdot}) ${fleet.name}</a></li>`);
            $('#fleetList li a[data-id="'+fleet.id+'"]').data(fleet);
        });
        if(response.data.length == 0){
            $('#fleetList').append(`<li><a href="#">No fleets</a></li>`);
        }
    };
    this.selectEldFleet = function(el) {
        $('#user_select').empty();
        var fleet = $(el).data();
        $('#infoOrderBlock input[name="address"]').val(fleet.address);
        $('#infoOrderBlock input[name="city"]').val(fleet.city);
        $('#infoOrderBlock input[name="zip"]').val(fleet.zip);
        $('#infoOrderBlock select[name="state"] option').each(function(key, item){
            if($(item).text() == fleet.state){
                $('#infoOrderBlock select[name="state"]').val($(item).val());
                return false;
            }
        });
        $('#fleet_select').attr('data-id', fleet.id).val(`(${fleet.usdot}) ${fleet.name}`);
        $('.user_row').show();
        self.getOrderAddresses(fleet.id);
    };

    this.getOrderAddresses = function(carrierId = 0) {
        AjaxCall({url: apiDashUrl, action: 'getAddressesOrders', data: {carrierId:carrierId}, successHandler: self.getOrderAddressesHandler});
    };
    this.getOrderAddressesHandler = function(response) {
        $('#addressesOrderPlace').hide();
        self.orderAddresses = response.data.result;
        if(typeof self.orderAddresses != 'undefined' && self.orderAddresses.length > 0){
            $('#addressesOrder').empty();
            $('#addressesOrder').append('<option value="0">Select Address</option>');
            $.each(self.orderAddresses, function(key, rowData){
                var addressName = [];
                rowData.address ? addressName.push(rowData.address) : '';
                rowData.address1 != null ? addressName.push('Apt ' + rowData.address1) : '';
                rowData.city ? addressName.push(rowData.city) : '';
                rowData.stateName ? addressName.push(rowData.stateName) : '';
                rowData.zip ? addressName.push(rowData.zip) : '';
                $('#addressesOrder').append('<option value="'+rowData.id+'">'+addressName.join(', ')+'</option>');
            });
            $('#addressesOrderPlace').show();
        }
    };

    //Check Fleet Users
    this.checkUsers = function(el) {
        $('#userList').val('');
        var name = $(el).val();
        var fleetId = $('#createFleet').is(':visible')? 0 : $('#fleet_select').attr('data-id');

        AjaxController('findFleetUsersByName', {name:name, fleetId:fleetId, onlyAdmin: 1}, adminUrl, self.findFleetUsersByNameHandler, errorBasicHandler, true);
    };
    this.findFleetUsersByNameHandler = function(response) {
        $('#userList').empty();
        $.each(response.data, function(key, user){
            $('#userList').append(`<li><a href="#" data-user='${JSON.stringify(user)}' onclick="orderController.selectEldUser(this);">(${user.email}) ${user.name} ${user.last}</a></li>`);
        });
        if(response.data.length == 0){
            $('#userList').append(`<li><a href="#">No users</a></li>`);
        }
    };
    this.selectEldUser = function(el) {
        var user = $(el).data('user');
        $('#infoOrderBlock input[name="name"]').val(user.name);
        $('#infoOrderBlock input[name="surname"]').val(user.last);
        $('#infoOrderBlock input[name="phone"]').val(user.phone);
        $('#user_select').attr('data-id', user.id).val($(el).text());
        $('#user_id').val(user.id);
    };
    //Check Solo Drivers
    this.checkSoloDriver = function(el) {
        var name = $(el).val();
        AjaxController('findSoloDriverByName', {name:name}, adminUrl, self.findSoloDriverByNameHandler, errorBasicHandler, true);
    };
    this.findSoloDriverByNameHandler = function(response) {
        $('#soloDriverList').empty();
        $.each(response.data, function(key, user){
            $('#soloDriverList').append(`<li><a onclick="orderController.selectEldSoloDriver(this);" data-user='${JSON.stringify(user)}' href="#">(${user.email}) ${user.name} ${user.last}</a></li>`);
        });
        if(response.data.length == 0){
            $('#soloDriverList').append(`<li><a href="#">No Solo Drivers</a></li>`);
        }
    };
    this.selectEldSoloDriver = function(el) {
        var user = $(el).data('user');
        c(user);
        $('#orderForm #first_name').val(user.name);
        $('#orderForm #last_name').val(user.last);
        $('#orderForm #phone').val(user.phone);
        $('#orderForm #city').val(user.city);
        user.state == null ? $('#reg_state').val(0) : $('#reg_state').find('option:contains('+user.state+')').attr("selected", "selected");
        $('#orderForm #zip').val(user.zip);
        $('#orderForm #address').val(user.address);
        $('#orderForm #address1').val(user.address1);
        $('#solo_driver_select').attr('data-id', user.id).val($(el).text());
        user.companyPosition == TYPE_DRIVER_ELD ? $('#soloDriverForm').hide() : $('#soloDriverForm').show();
    };

    //Live search USDOT
    this.liveCheckUsdot = function(el) {
        AjaxController('findFleets', {usdot: $(el).val()}, adminUrl, self.searchUsdotHandler, errorBasicHandler, true);
    };
    this.searchUsdotHandler = function (response) {
        $('#searchUsdotList').empty();
        $.each(response.data, function(key, fleet){
            $('#searchUsdotList').append(`<li><a onclick="orderController.completeFleetDataByUsdot(this);" data-address='${fleet.address}' data-city='${fleet.city}' data-zip='${fleet.zip}' data-usdot='${fleet.usdot}' data-name='${fleet.name}' data-state='${fleet.state}'  href="#">(${fleet.usdot}) ${fleet.name}</a></li>`);
        });
        if(response.data.length == 0){
            $('#searchUsdotList').append(`<li><a href="#">No fleets</a></li>`);
        }
    };
    this.completeFleetDataByUsdot = function(el) {
        self.newFleet($('#btnNewFleet'));
        $('#user_select').val('').removeAttr('data-id');
        self.selectEldFleet(el);
    };

    //TODO: Check if needed
    this.checkRoleOrder = function() {
        //solo driver
        if($('#checkboxFleetOrSolo button.active').attr('data-val') === 0) {
            self.soloPlaceShow();
        }
        //fleet
        else if($('#checkboxFleetOrSolo button.active').attr('data-val') === 1) {
            self.fleetPlaceShow();
        }
    };
    this.checkUsdot = function(el) {
        resetError();
        var $usdot = $(el).find('input[name="newFleet[usdot]"]');
        if ($usdot.val() == '') {
            return setError($usdot, 'Enter USDOT number');
        }
        else if($usdot.val().length > 10) {
            return setError($usdot, 'USDOT length can\'t be more than 10 characters');
        }
        $usdot.removeClass('confirm');
        var data = {data: {usdot: $usdot.val(), action: 'reg_usdot'}};
        $.ajax({
            url: MAIN_LINK + '/db/reg_search/' + '?' + window.location.search.substring(1),
            method: "POST",
            contentType: "application/json", // send as JSON
            data: JSON.stringify(data),
            success: function (data) {
                var response = jQuery.parseJSON(data);
                c(response);
                if (response.code == '000') {
                    $usdot.addClass('confirm');
                    $name = response.data.content.carrier.legalName;
                    $state = response.data.content.carrier.phyState;
                    $address = response.data.content.carrier.phyStreet;
                    $zip = response.data.content.carrier.phyZipcode;
                    $city = response.data.content.carrier.phyCity;
                    $state = response.data.content.carrier.phyState;
                    $(el).find('input[name="car_name"]').val($name);
                    $(el).find('input[name="office_addr"]').val($address);
                    $(el).find('input[name="zip"]').val($zip);
                    $(el).find('input[name="city"]').val($city);
                    $(el).find('select[name="state"]').val($state);
                } else if (response.code == '206' || response.code == '209' || response.code == '238') {
                    resetError();
                    setError($usdot, response.message);
                }
            }
        });
    }

    //TODO: Check demo order
    this.demoOrder = function(el) {
        $('#eld_popup').hide();
        var reqId = $(el).attr('data-id');
        var request = {};
        $.each(demo_requests, function(key, requestLoc){
            if(requestLoc.id == reqId){
                request  =requestLoc;
                return true;
            }
        })
        self.createDemoOrder();
        $('#is_demo_eld').prop('checked', true);
        if(!$('#createFleet').is(':visible')){
            $('.newFleet').click();
        }
        if(!$('#createEldUser').is(':visible')){
            $('.newUser').click();
        }
        $('#reg_fl_car_name').val(request.companyName)
        $('#reg_fl_name, #first_name').val(request.name);
        $('#reg_fl_last, #last_name').val(request.last);
        $('#reg_fl_phone, #phone').val(request.phone);
        $('#reg_fl_size').val(request.size);
        $('#reg_fl_email').val(request.email);
    };
    this.createDemoOrder = function() {
        $('#fleet_select, #user_select, #solo_driver_select').val('').removeData('data-id');
        $('#checkboxFleetOrSolo').prop('checked', false);
        $('.info-order-block .box_row input').val('');
        $('#eld_first_price b, #eld_delivery_price b, #eld_order_price b, #eld_total_order b, #eld_deposit_fee b').empty();
        self.checkRoleOrder();
        if($('#createFleet').is(':visible')){
            $('.newFleet').click();
        }
        if($('#createEldUser').is(':visible')){
            $('.newUser').click();
        }
        $('#amount, .one_box .one_cable input').val(0);
        $('#is_demo_eld').prop('checked', false);
        // $('#eld_order_form').show();
        $('#order_type').empty();
        $.each(eldTariffs, function(key, val) {
            $('#order_type').append('<option value="'+ key +'">'+ val.name +'</option>');
        });
        $('#order_type').val(0);
        if(getCookie('cur_platform') == 'logit') {
            $('#order_type').val(3);
        }
        $('.popup_box_panel').scrollTop(0);
        $('input[name="phone"]').mask('000 000 0000');

        //Auto complete fields
        $('#createEldUser, #userSoloDriverForm').off('keyup', 'input[name="name"]').on('keyup', 'input[name="name"]', function() {
            $('#infoOrderBlock input[name="name"]').val($(this).val());
        });
        $('#createEldUser, #userSoloDriverForm').off('keyup', 'input[name="last"]').on('keyup', 'input[name="last"]', function() {
            $('#infoOrderBlock input[name="last"]').val($(this).val());
        });
        $('#createEldUser, #userSoloDriverForm').off('keyup', 'input[name="phone"]').on('keyup', 'input[name="phone"]', function() {
            $('#infoOrderBlock input[name="phone"]').val($(this).val());
        });
        $('#createFleet, #soloDriverForm').off('keyup', 'input[name="office_addr"], input[name="addr"]').on('keyup', 'input[name="office_addr"], input[name="addr"]', function() {
            $('#infoOrderBlock input[name="address"]').val($(this).val());
        });
        $('#createFleet, #soloDriverForm').off('keyup', 'input[name="city"]').on('keyup', 'input[name="city"]', function() {
            $('#infoOrderBlock input[name="city"]').val($(this).val());
        });
        $('#createFleet, #soloDriverForm').off('keyup', 'input[name="zip"]').on('keyup', 'input[name="zip"]', function() {
            $('#infoOrderBlock input[name="zip"]').val($(this).val());
        });
        $('#createFleet, #soloDriverForm').off('keyup', 'input[name="state"]').on('change', 'select[name="state"]', function() {
            $('#infoOrderBlock select[name="state"]').val($(this).val());
        });
    };

    /**
     * Order Manager
     */
    this.orderELDAdmin = function(data) {
        var checkboxFleetOrSolo = parseInt($('#checkboxFleetOrSolo button.active').attr('data-val'));
        if(checkboxFleetOrSolo === 1) { //FLEET
            data.solo_driver = 0;
            if ($('#createFleet').is(':visible')) {
                self.validateCreateFleetForm(data.newFleet);
            } else {
                data.fleetId = $('#fleet_select').attr('data-id');
                if (data.fleetId === 0 || data.fleetId === '' || typeof data.fleetId === 'undefined') {
                    setError($('#fleet_select'), 'Please select fleet');
                }
            }
            if ($('#createEldUser').is(':visible')) {
                self.validateCreateEldUserForm(data.newUser);
            } else {
                data.userId = $('#user_select').attr('data-id');
                if (data.userId === 0 || data.userId === '' || typeof data.userId === 'undefined') {
                    setError($('#user_select'), 'Please select user');
                }
            }
        } else if (checkboxFleetOrSolo === 0) {//SOLO
            data.solo_driver = 1;
            if ($('#userSoloDriverForm').is(':visible')) {
                self.validateCreateSoloUserForm(data.newUserSolo);
                data.newUserSolo.type = 0;
                data.newUser = data.newUserSolo;
            } else {
                data.userId = $('#solo_driver_select').attr('data-id');
                if (!data.userId) {
                    setError($('#solo_driver_select'), 'Please select user');
                }
            }
            if ($('#soloDriverForm').is(':visible')) {
                self.validateCreateSoloDriverForm(data.newSoloDriver);
            } else {
                data.userId = $('#solo_driver_select').attr('data-id');
                if (!data.userId) {
                    setError($('#solo_driver_select'), 'Please select user');
                }
            }
        }

        // data.notes = $('#eld_notes').val();
        // data.demo = $('#is_demo_eld').prop('checked') == true ? 1 : 0;
        // data.overnight = $('#overnightDelivery').prop('checked') == true ? 1 : 0;
        // data.deliveryCalculateRate = eldCommon.deliveryCalculateRate;


        if($('#orderForm .error').length) {
            $('.popup_box_panel').animate({ scrollTop: $('.error').offset().top}, 1000);
            return false;
        }
        c(data);
        // return false;
        $('#send_order').prop('disabled', true);
        AjaxController('orderELD', data, adminUrl, self.orderEldHandler, self.orderCUEldErrorHandler, true);
    };
    this.orderEldHandler = function(response) {
        self.checkRoleOrder();
        $('#send_order').prop('disabled', false);
        $('.modal-order .close').click();
        var fleetId = response.data.fleetId;
        var userId = response.data.userId;

        if(fleetId) {
            $('.tablePagination input').eq(0).keyup();
            $('body').append(`<button id="trig_show_fleet" data-carrid="${fleetId}" onclick="actionGlobalgetOneCarrierInfo(this, event)"></button>`);
            $('#trig_show_fleet').click();
            $('#trig_show_fleet').remove();
        }else if(fleetId == 0 && userId != 0) {
            $('.tablePagination input').eq(0).keyup();
            $('body').append(`<button id="trig_show_user_info" data-userid="${userId}" onclick="getOneUserInfo(this, event)"></button>`);
            $('#trig_show_user_info').click();
            $('#trig_show_user_info').remove();
        }
    };

    /**
     * Validate Client Order Form
     * @param data
     */
    this.validateCUOrderForm = function(data) {

        if (data.order_type != 13 || data.order_type === undefined) {
            if((!agreeLeaseService || $('#agreementCheckboxItem').is(':checked') === false) && data.amount >= 0 && !curUserIsEzlogzEmployee()) {
                setError($('#agreementCheckbox'), 'Please open and read Equipment Purchase and Agreements to be able to finish order');
            }
        } else if (data.order_type == 13 && data.order_type !== undefined) {
            if((!agreeLeaseService || $('#agreementLeaseCheckboxItem').is(':checked') === false) && data.amount > 0 && !curUserIsEzlogzEmployee()) {
                setError($('#agreementLeaseCheckbox'), 'Please open and read Equipment Lease and Agreements to be able to finish order');
            }
        }

        if(!data.address)
            setError($('#address'), 'Enter delivery address');
        else if (!/^[0-9a-zA-Z_.()/-/ ]*$/.test(data.address))
            setError($('#address'), 'Enter only Latin letters');
        else if(data.address > 100)
            setError($('#address'), 'Max allowed 100 characters');

        if(data.address1) {
            if (!data.address1)
                setError($('#address1'), 'Enter delivery apt. number');
            else if (!/^[0-9a-zA-Z_.()/-/ ]*$/.test(data.address1))
                setError($('#address1'), 'Enter only Latin letters');
            else if (data.address1.length > 100)
                setError($('#address1'), 'Max allowed 100 characters');
        }

        if(!data.state || data.state == 0)
            setError($('#state'), 'Select state');

        if(!data.name)
            setError($('#name'), 'First name cannot be empty');
        else if(!/^[a-zA-Z_/-/ ]*$/.test(data.name))
            setError($('#name'), 'Enter only Latin letters');
        else if(data.name.length > 64)
            setError($('#name'), 'Max allowed 64 characters');

        if(!data.surname)
            setError($('#surname'), 'Last name cannot be empty');
        else if(!/^[a-zA-Z_/-/ ]*$/.test(data.surname))
            setError($('#surname'), 'Enter only Latin letters');
        else if(data.surname.length > 64)
            setError($('#surname'), 'Max allowed 64 characters');

        if(!data.phone)
            setError($('#phone'), 'Enter correct phone number');
        if(data.phone.length != 12)
            setError($('#phone'), 'Phone length must be 10 characters');

        if(!data.city)
            setError($('#city'), 'Enter City');
        else if(!/^[a-zA-Z_/-/ ]*$/.test(data.city))
            setError($('#city'), 'Enter only Latin letters');
        else if (data.city.length > 64)
            setError($('#city'), 'Max allowed 64 characters');

        if(!data.state || data.state == 0)
            setError($('#reg_state'), 'Chose state');

        if(!validate.zip(data.zip))
            setError($('#zip'), 'Enter Zip code');

        if(!data.uploadSmartWitnessInput && typeof $('#order_camera_type').val() !== 'undefined' && parseInt($('#order_camera_type').val()) === 8) {
            setError($('#creditApplicationChanged'), 'Please Upload Credit Application file.');
            $('#creditApplicationChanged input').prop('checked', false);
        }
    };

    /**
     * Validate New User
     * @param data
     */
    this.validateCreateEldUserForm = function(data) {
        if (!/^([3,4,5,7])$/.test(data.type))
            setError($('#reg_fl_type'), 'Select valid user type');

        if(data.email == '' || !validateEmail(data.email))
            setError($('#reg_fl_email'), 'Enter valid email');
        else if(data.email.length > 75)
            setError($('#reg_fl_email'), 'Max allowed 75 characters');

        if (!data.name || typeof data.name === 'undefined')
            setError($('#reg_fl_name'), 'Enter First Name');
        else if (!/^[a-zA-Z\s,'-]*$/.test(data.name))
            setError($('#reg_fl_name'), 'Enter only Latin letters');
        else if (data.name.length > 64)
            setError($('#reg_fl_name'), 'Max allowed 64 characters');

        if (!data.last || typeof data.last === 'undefined')
            setError($('#reg_fl_last'), 'Enter Last Name');
        else if (!/^[a-zA-Z\s,'-]*$/.test(data.last))
            setError($('#reg_fl_last'), 'Enter only Latin letters');
        else if (data.last.length > 64)
            setError($('#reg_fl_last'), 'Max allowed 64 characters');

        if (!data.phone || data.phone.length !== 12)
            setError($('#reg_fl_phone'), 'Phone length must be 10 characters');

        if (data.ext) {
            if(data.ext.length > 10)
                setError($('#reg_fl_ext'), 'Max allowed 10 characters');
        }
    };

    /**
     * Validate New Fleet
     * @param data
     */
    this.validateCreateFleetForm = function(data) {
        if (!data.usdot)
            setError($('#reg_fl2_usdot'), 'Enter USDOT number');
        else if (!/^[0-9]*$/.test(data.usdot))
            setError($('#reg_fl2_usdot'), 'Enter only numbers');

        if (!parseInt(data.state))
            setError($('#reg_fl_state'), 'Chose state/province');

        if (!data.city)
            setError($('#reg_fl_city'), 'Enter City');
        else if (!/^[a-zA-Z\s,'-]*$/.test(data.city))
            setError($('#reg_fl_city'), 'Enter only Latin letters');
        else if (data.city.length > 64)
            setError($('#reg_fl_city'), 'Max allowed 64 characters');

        if (!validate.zip(data.zip))
            setError($('#reg_fl_zip'), 'Enter ZIP');

        if (!data.car_name)
            setError($('#reg_fl_car_name'), 'Enter carrier name');
        else if (!/^[a-zA-Z0-9\s,'-/&/#]*$/.test(data.car_name))
            setError($('#reg_fl_car_name'), 'Enter only Latin letters');
        else if (data.car_name.length > 130)
            setError($('#reg_fl_car_name'), 'Max allowed 130 characters');

        if (isNaN(parseInt(data.size)) || !isFinite(data.size) || data.size == '0')
            setError($('#reg_fl2_size'), 'Enter Fleet size');

        if (!data.office_addr)
            setError($('#reg_fl_office_addr'), 'Enter office address');
        else if (!/^[a-zA-Z0-9\s,'-/#]*$/.test(data.office_addr))
            setError($('#reg_fl_office_addr'), 'Enter only Latin letters');
        else if (data.office_addr.length > 130)
            setError($('#reg_fl_office_addr'), 'Max allowed 130 characters');

        if (data.ein) {
            if (!/^[a-z0-9\s,-]+$/i.test(data.ein))
                setError($('#reg_fl_ein'), 'Enter valid EIN');
            else if (data.ein > 64)
                setError($('#reg_fl_ein'), 'Max allowed 64 characters');
        }
    };

    /**
     * Validate New Solo User
     * @param data
     */
    this.validateCreateSoloUserForm = function(data) {
        if(data.email == '' || !validateEmail(data.email))
            setError($('#reg_solo_email'), 'Enter valid email');
        else if(data.email.length > 75)
            setError($('#reg_solo_email'), 'Max allowed 75 characters');

        if (!data.name || typeof data.name === 'undefined')
            setError($('#reg_solo_name'), 'Enter First Name');
        else if (!/^[a-zA-Z\s,'-]*$/.test(data.name))
            setError($('#reg_solo_name'), 'Enter only Latin letters');
        else if (data.name.length > 64)
            setError($('#reg_solo_name'), 'Max allowed 64 characters');

        if (!data.last || typeof data.last === 'undefined')
            setError($('#reg_solo_last'), 'Enter Last Name');
        else if (!/^[a-zA-Z\s,'-]*$/.test(data.last))
            setError($('#reg_solo_last'), 'Enter only Latin letters');
        else if (data.last.length > 64)
            setError($('#reg_solo_last'), 'Max allowed 64 characters');

        if (!data.phone || data.phone.length !== 12)
            setError($('#reg_solo_phone'), 'Phone length must be 10 characters');

        if (data.ext) {
            if(data.ext.length > 10)
                setError($('#reg_solo_ext'), 'Max allowed 10 characters');
        }
    };

    /**
     * Validate New Solo Driver
     * @param data
     */
    this.validateCreateSoloDriverForm = function(data) {
        if (!data.usdot)
            setError($('#reg_dr_usdot'), 'Enter USDOT number');
        else if (!/^[0-9]*$/.test(data.usdot))
            setError($('#reg_dr_usdot'), 'Enter only numbers');

        if (!parseInt(data.state))
            setError($('#reg_dr_state'), 'Chose state/province');

        if (!data.city)
            setError($('#reg_dr_city'), 'Enter City');
        else if (!/^[a-zA-Z\s,'-]*$/.test(data.city))
            setError($('#reg_dr_city'), 'Enter only Latin letters');
        else if (data.city.length > 64)
            setError($('#reg_dr_city'), 'Max allowed 64 characters');

        if (!validate.zip(data.zip))
            setError($('#reg_dr_zip'), 'Enter ZIP');

        if(!data.license_number)
            setError($('#dr_license_number'), 'Enter driver license number');
        else if (!/^[A-Za-z0-9-*']+( [A-Za-z0-9-*']+)*$/.test(data.license_number))
            setError($('#dr_license_number'), 'Enter valid driver license number');
        else if(data.license_number.length > 20)
            setError($('#dr_license_number'), 'Length can\'t be more than 20 characters');

        if (!parseInt(data.license_state))
            setError($('#dr_license_state'), 'Chose state/province');

        if (!data.car_name)
            setError($('#reg_dr_car_name'), 'Enter carrier name');
        else if (!/^[a-zA-Z0-9\s,'-/&/#]*$/.test(data.car_name))
            setError($('#reg_dr_car_name'), 'Enter only Latin letters');
        else if (data.car_name.length > 130)
            setError($('#reg_dr_car_name'), 'Max allowed 130 characters');

        if (!data.addr)
            setError($('#reg_dr_office_addr'), 'Enter office address');
        else if (!/^[a-zA-Z0-9\s,'-/#]*$/.test(data.addr))
            setError($('#reg_dr_office_addr'), 'Enter only Latin letters');
        else if (data.addr.length > 130)
            setError($('#reg_dr_office_addr'), 'Max allowed 130 characters');
    };

    this.autocompleteAddressOrder = function(e) {
        if(parseInt($(e).val())) {
            var address = self.orderAddresses.find(x => x.id === parseInt($(e).val()));
            $('#address').val(address.address);
            $('#address1').val(address.address1);
            $('#city').val(address.city);
            $('#state').val(address.state);
            $('#zip').val(address.zip);
        }
    }

}

if (typeof orderController === 'undefined') {
    var orderController = new orderControllerClass();
}