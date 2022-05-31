function orderCard(orderId, params = {}) {
    var self = this;
    self.params = params;
    self.orderId = orderId;
    self.cntrlUrl = apiDashUrl;
    self.modalElement = '';
    self.tableId = 'orderCard_' + orderId;
    self.editMode = false;

    self.modalId = 'order_card';
    self.modalTitle = 'ORDER ID ' + orderId + ' INFO ';
    self.paginator = false;
    self.tabs = [];
    self.forceSearchParams = [{key: 'orderId', val: orderId}]
    self.order = [];

    self.initRequest = function () {
        AjaxController('getOrderCardInit', {orderId: self.orderId}, self.cntrlUrl, self.init, self.init, true);
    }
    self.init = function (response) {

        modalCore(self);
        self.order = response.data.order;
        self.editedOrder = JSON.parse(JSON.stringify(self.order));
        self.generateHeaders();
        self.generateButtons();
        self.generateTabs();
        self.createModal();
        self.initEvents();
    }
    self.initEvents = function () {
        self.modalElement.find('.cancel_order_edit').click(self.disableEdit)
        self.modalElement.find('.save_order_edit').click(self.saveOrderEdit)
        self.modalElement.find('.order_status').change(self.changeOrderStatus)
        self.modalElement.find('.overnightDeliveryCheckbox').click(self.overnightDeliveryChange)
        self.modalElement.find('.changeDeliveryAddress').click(self.changeDeliveryAddressClick)
        self.modalElement.find('.changeOrderDate').click(self.changeOrderDateClick)
        self.modalElement.find('.changeOrderDateCancel').click(self.changeOrderDateCancelClick)
        self.modalElement.find('.changeOrderDateSave').click(self.changeOrderDateSaveClick)
        self.modalElement.find('.changeDeliveryPrice').click(self.changeDeliveryPriceClick)
        self.modalElement.find('.createManualTrackingId').click(self.createManualTrackingIdClick)
        self.modalElement.find('.get_tracking_refresh').click(self.getTrackingEvent)
        self.modalElement.find('.add_device_to_order').click(self.addDeviceToOrder)
        self.modalElement.find('.sendCreditApplicationToBankBtn').click(self.sendCreditApplicationToBankBtnClick)
        self.modalElement.find('.updateApplicationBtn').click(self.updateApplicationBtnClick)
    }
    self.updateApplicationBtnClick = function(){
        showModal('Send Credit Application to the Bank', `You are about to update client Credit Application, please upload new PDF file and click Save new Application:
            <div class="form-group">
                <label for="return_description">Add File</label>
                <div class="fileinput fileinput-new input-group" data-provides="fileinput">
                <div class="form-control hide " data-trigger="fileinput">
                    <i class="glyphicon glyphicon-file fileinput-exists"></i>
                    <span class="fileinput-filename"></span>
                </div>
                <div class="fileinput-preview thumbnail not_image" data-target="creditApplication" data-trigger="fileinput" style="width: 100%;"></div>
                <div>
                    <span class="btn btn-info btn-file">
                        <span class="fileinput-new">Select File</span>
                        <span class="fileinput-exists">Change</span>
                        <input type="file" class="creditApplication" name="creditApplication" accept=".pdf" >
                    </span>
                    <a href="#" class="btn btn-info fileinput-exists" data-dismiss="fileinput">Remove</a>
                </div></div>
            </div>`, 'sendCreditApplicationModal', '', 
            {footerButtons: `<button class="btn btn-primary" id="updateCreditApplication">Save new Application</button>`});
        $('#updateCreditApplication').click(self.updateCreditApplication)
    }
    self.sendCreditApplicationToBankBtnClick = function(){
        showModal('Send Credit Application to the Bank', 'You are about to send credit Application to the Bank for credit verification, before doing so, please check:\n\
            <br><br>1.All client details in Credit Application, if they are match client fleet/user data<br>2.Check with client if devices amount in order are correct and doesn\'t need change<br>\n\
            3.Check with client products that he included/excluded in credit invoice, if no changes needed, if everything correct - click Send Application', 'sendCreditApplicationModal', '', 
            {footerButtons: `<button class="btn btn-primary" id="approveSendCreditApplication">Send Application</button>`});
        $('#approveSendCreditApplication').click(self.approveSendCreditApplication)
    }
    self.approveSendCreditApplication = function(){
        $('#approveSendCreditApplication').prop('disabled', true);
        AjaxCall({url: apiAdminUrl, action: 'approveSendCreditApplication', data: {'orderId': self.orderId}, successHandler: self.approveSendCreditApplicationHandler});
    }
    self.approveSendCreditApplicationHandler = function(response){
        $('#sendCreditApplicationModal .close').click();
        new orderCard(self.orderId, {'initCallback':function(){
            showModal('Send Credit Application to the Bank', 'Credit Application was sent to the bank', 'sendCreditApplicationModalConfirm', '');
        }})
        
    }
    self.updateCreditApplication = function(){
        $('#updateCreditApplication').prop('disabled', true);
        var bytesArray = $('.thumbnail[data-target="creditApplication"] img').attr('src')
        AjaxCall({url: apiAdminUrl, action: 'updateCreditApplication', data: {'orderId': self.orderId, 'bytesArray':bytesArray}, successHandler: self.updateCreditApplicationHandler});
    }
    self.updateCreditApplicationHandler = function(response){
        $('#sendCreditApplicationModal .close').click();
        new orderCard(self.orderId, {'initCallback':function(){
            showModal('Credit Application', 'Credit Application updated', 'updateCreditApplicationModalConfirm', '');
        }})
        
    }
    self.generateHeaders = function () {
        var headers = [];

        var clientFleetName = self.order.fleetName && self.order.usdot ? `<span class="global_carrier_info" title="Carrier Info" data-carrid="${self.order.carId}" onclick="actionGlobalgetOneCarrierInfo(this, event);" style="cursor: pointer;">${self.order.fleetName}(${self.order.usdot})</span>` : 'Solo Eld';

        var addr1 = (self.order.address1 == null ? '' : self.order.address1);
        if (addr1 != '')
            addr1 = 'Apt ' + addr1;
        var addrText = self.order.address;
        if (addr1 != '') {
            addrText += ', ' + addr1;
        }
        addrText += ' ' + self.order.city + ',' + self.order.stateName + ',' + self.order.zip;
        if (curUserIsEzlogzEmployee())
            addrText += ' <button class="btn btn-default btn-xs changeDeliveryAddress">Edit</button>';
        var demoText = '';
        if (self.order.demo == 1) {
            demoText += '(Demo order)';
        }

        var fullPrice = (parseFloat(self.order.fee_price) + parseFloat(self.order.delivery_price) + parseFloat(self.order.deposit_fee) + parseFloat(self.order.orderPrice));

        if (self.order.params != null) {
            var orderParams = JSON.parse(self.order.params);
            var fullPrice = orderParams.calculate.product_calculate.total;
        }

        var trackingId = '';
        if (!curUserIsClient()) {

            trackingId = `<span data-orderid="${self.order.id}">
                <span class="delivery_tracking_span">Click to enter manually </span>
                    <input class="delivery_tracking_input" style="display:none;height: 25px;top: 2px;position: relative;" value="" />
                <button class="btn btn-default btn-xs createManualTrackingId">Edit</button>
            </span>`;
        }
        var deliveryStatus = '';
        if (self.order.deliveryInfo.length > 0 && self.order.deliveryInfo[0].trackingId != null) {
            if (curUserIsClient()) {
                trackingId = self.order.deliveryInfo[0].trackingId;
            } else {
                //var downloadLableButton = '<a href="${self.order.deliveryInfo[0].LabelUrl}">Get delivery label</a>';
                trackingId = `<span>
                    <span class="delivery_tracking_span">${self.order.deliveryInfo[0].trackingId}</span>
                    <input class="delivery_tracking_input" style="display:none;height: 25px;top: 2px;position: relative;" value="${self.order.deliveryInfo[0].trackingId}" />
                    <button class="btn btn-default btn-xs createManualTrackingId">Edit</button>
                </span>`;
            }
            deliveryStatus = `${self.order.deliveryInfo[0].lastEvent}`;
        }
        var overnightDisabled = curUserIsClient() ? 'disabled' : '';
        var overnight = `<div class="check_buttons_block" >
            <button type="button" ${overnightDisabled} class="btn btn-default overnightDeliveryCheckbox ${self.order.overnight === 1 ? 'active' : '' }" onclick="doActive(this)" data-val="1">Yes</button>
            <button type="button" ${overnightDisabled} class="btn btn-default overnightDeliveryCheckbox ${self.order.overnight === 0 ? 'active' : '' }" onclick="doActive(this)" data-val="0">No</button>
        </div>`
        if (deliveryStatus == '')
            deliveryStatus = 'No info';
        var deliveryPrice = '<span class="delivery_price_edit_span">' + self.order.delivery_price + '</span>';
        if (curUserIsEzlogzEmployee())
            deliveryPrice += '<input class="delivery_price_edit_input" style="display:none;height: 25px;top: 2px;position: relative;" value="' + self.order.delivery_price + '" /> <button class="btn btn-default btn-xs changeDeliveryPrice">Edit</button>';
        var changeOrderText = '';
        if (position == TYPE_SUPERADMIN || (typeof superAdminRights.dates != 'undefined' && superAdminRights.dates == 1)) {
            changeOrderText += ' <button class="btn btn-default btn-xs changeOrderDate"><i class="fa fa-edit"></i></button>';
            changeOrderText += ' <button class="btn btn-default btn-xs changeOrderDateCancel" style="display:none">Cancel</button>';
            changeOrderText += ' <button class="btn btn-default btn-xs changeOrderDateSave" style="display:none">Save</button>';
        }

        var iosxIds = [1,2,3,4,5];
        var scannerType = 1;
        var scannerTypeName = 'Ez-Simple ELD';
        if (!iosxIds.includes(self.order.order_type)) {
            scannerType = 2;
            scannerTypeName = 'Ez-Smart ELD';
        }


        var type = typeof eldTariffs[scannerType][self.order.order_type] !== 'undefined' && self.order.amount > 0 ? 'Scanner ('+scannerTypeName+'): '+eldTariffs[scannerType][self.order.order_type].name : ''

        if(self.order.order_camera_type > 0){
            type += type == '' ? '' : ', ';
            type += typeof cameraTariffs[self.order.order_camera_type] !== 'undefined' ? 'Camera: '+cameraTariffs[self.order.order_camera_type].name: ''
        }
        if(self.order.order_camera_type == 8){
            self.order.params = typeof(self.order.params) === 'string' ? JSON.parse(self.order.params) : self.order.params;
            var sent = '<button class="btn btn-default btn-xs sendCreditApplicationToBankBtn">Send to Bank</button>';
            if(0){
                sent = '<button class="btn btn-default btn-xs sendCreditApplicationToBankBtn">Send to Bank Again</button>';
            }
            var updateApplicationBtn = '<button class="btn btn-default btn-xs updateApplicationBtn">Update Application</button>';
            if(curUserIsClient()){
                sent = updateApplicationBtn = '';
            }
            type += '<br>Order using Bank Credit, <a target="_blank" href="'+self.order.params.credit.amazonSmartWitnessFile+'">Application</a>, <a target="_blank" href="'+self.order.params.credit.amazonInvoiceFile+'">Invoice</a><br>'+sent + updateApplicationBtn;
        }
        
        headers.push({label: 'Order Id', value: self.orderId + '' + demoText});
        headers.push({label: 'Type', value: type});

        headers.push({label: 'Date', value: '<span class="edit_date">' + timeFromSecToUSAString(self.order.orderDate) + '</span>' + changeOrderText});
        headers.push({label: 'ELD Amount', value: self.order.amount});

        headers.push({label: 'Client Fleet', value: clientFleetName});
        headers.push({label: 'ELD Deposit', value: '$' + self.order.deposit_fee});

        headers.push({label: 'Name', value: self.order.name + ' ' + self.order.surname});
        headers.push({label: 'Order price', value: '$' + self.order.orderPrice});

        headers.push({label: 'Delivery Address', value: addrText});
        headers.push({label: 'Delivery Price', value: '$' + deliveryPrice});

        headers.push({label: 'Phone', value: self.order.phone});
        headers.push({label: 'First Month Price', value: '$' + self.order.fee_price});

        headers.push({label: 'Email', value: self.order.email});
        headers.push({label: 'Full order Price', value: '$' + fullPrice.toFixed(2)});

        headers.push({label: 'Order Notes', value: self.order.notes});
        headers.push({label: 'Overnight', value: overnight});

        headers.push({label: 'Tracking ID', value: trackingId});
        headers.push({label: 'Delivery Status', value: '<i class="fa fa-refresh get_tracking_refresh" style="cursor:pointer;" aria-hidden="true"></i>  ' + deliveryStatus});
        if (!curUserIsClient()) {
            var statuses = '<select id="order_status" class="form-control order_status">\n\
                <option value="0" ' + (self.order.status == 0 ? 'selected="selected"' : '') + '>New Order</option>\n\
                <option value="3" ' + (self.order.status == 3 ? 'selected="selected"' : '') + '>Paid</option>\n\
                <option value="4" ' + (self.order.status == 4 ? 'selected="selected"' : '') + '>Sent</option>\n\
                <option value="5" ' + (self.order.status == 5 ? 'selected="selected"' : '') + '>Pick up</option>\n\
                <option value="1" ' + (self.order.status == 1 ? 'selected="selected"' : '') + '>Completed</option>\n\
                <option value="2" ' + (self.order.status == 2 ? 'selected="selected"' : '') + '>Canceled</option>\n\
            </select>';
            if(self.order.order_camera_type == 8){
                statuses = '<select id="order_status" class="form-control order_status">\n\
                    <option value="0" ' + (self.order.status == 0 ? 'selected="selected"' : '') + '>New Order</option>\n\
                    <option value="3" ' + (self.order.status == 3 ? 'selected="selected"' : '') + '>Credit Application Approved</option>\n\
                    <option value="4" ' + (self.order.status == 4 ? 'selected="selected"' : '') + '>Sent</option>\n\
                    <option value="5" ' + (self.order.status == 5 ? 'selected="selected"' : '') + '>Pick up</option>\n\
                    <option value="1" ' + (self.order.status == 1 ? 'selected="selected"' : '') + '>Completed</option>\n\
                    <option value="2" ' + (self.order.status == 2 ? 'selected="selected"' : '') + '>Canceled/Credit Application Rejected</option>\n\
                </select>';
            }
        } else {
            statuses = getOrderStatus(self.order)
        }
        headers.push({label: 'Status', value: statuses});

        self.setCardHeaders(headers)
    }
    self.generateButtons = function () {
        var buttons = [];
        var listDownloadsButtons = [];
        listDownloadsButtons.push('<button class="btn btn-sm btn-default btn-block" data-orderid="' + self.order.id + '" data-order_type="'+self.order.device_type_id+'" data-type="saas_agreement" onclick="downloadAllTerms(this, event);">SAAS Agreement</button>');
        if (self.order.device_type_id == 2) {
            listDownloadsButtons.push('<button class="btn btn-sm btn-default btn-block" data-orderid="' + self.order.id + '" data-order_type="'+self.order.device_type_id+'"data-type="equipment_lease" onclick="downloadAllTerms(this, event);">Equipment Purchase</button>');
        } else {
            listDownloadsButtons.push('<button class="btn btn-sm btn-default btn-block" data-orderid="' + self.order.id + '" data-order_type="'+self.order.device_type_id+'"data-type="equipment_lease" onclick="downloadAllTerms(this, event);">Equipment Lease</button>');
        }
        listDownloadsButtons.push(`<button class="btn btn-sm btn-default btn-block" data-orderid="' + self.order.id + '" data-type="camera_agreement" onclick="var file_path = '/docs/CameraPurchaseandDataServiceAgreement.pdf';var a = document.createElement('A');a.href = file_path;a.download = file_path.substr(file_path.lastIndexOf('/') + 1);document.body.appendChild(a);a.click();document.body.removeChild(a);">Camera Agreement</button>`);
        listDownloadsButtons.push('<button class="btn btn-sm btn-default btn-block" data-orderid="' + self.order.id + '" onclick="downloadFullOrderInfo(this);">Full Order Info</button>');
        buttons.push(addDropdownButton(listDownloadsButtons, {name:'Download PDF', width: 160}));
        if (curUserIsEzlogzEmployee()) {
            if (self.order.deliveryInfo.length > 0 && self.order.deliveryInfo[0].trackingId == null) {
                buttons.push(`<button class="btn btn-sm btn-default" onclick="generateDeliveryLabel(this);" data-id="${self.order.id}">Generate delivery label</button>`);
            } else {
                buttons.push(`<button class="btn btn-sm btn-default" onclick="generateDeliveryLabel(this);" data-id="${self.order.id}">Regenerate delivery label</button>`);
            }
            buttons.push('<button class="btn btn-sm btn-default add_device_to_order">Add Device</button>');
            buttons.push('<span style="display: inline-block;display:none;height: 100%;border-left: 2px solid #ccc;margin-left: 10px;" class="edit_order_buttons_box"><button class="btn btn-default btn-sm cancel_order_edit">Cancel</button><button class="btn btn-default btn-sm save_order_edit">Save</button></span>');

        }

        self.setCardActionsButtons(buttons);
    }
    self.generateTabs = function () {
        self.tabs.push({
            label: 'Order Devices',
            cl: 'ord_dvc',
            request: 'getOrderDevicesPagination',
            handler: 'getOrderDevicesPaginationHandler',
            tableHeader: `<tr>
                <th>Device Id</th>
                <th>Status</th>
                <th style="width: 160px;">Deposit</th>
                <th style="width: 200px;">Actions</th>
            </tr>`
        });

        self.tabs.push({
            label: 'Order Cables',
            cl: 'ord_cbl',
            request: 'getOrderCablesPagination',
            handler: 'getOrderCablesPaginationHandler',
            tableHeader: `<tr>
            <th>Name</th>
            <th>Price</th>
            <th>Amount</th>
            <th>Availability</th>
        </tr>`
        });

        if (self.order.device_type_id ==1) {
            self.tabs.push({
                label: 'Order Cameras',
                cl: 'ord_cmr',
                request: 'getOrderCamerasPagination',
                handler: 'getOrderCamerasPaginationHandler',
                tableHeader: `<tr>
                <th>Name</th>
                <th>Price</th>
                <th>Amount</th>
                <th>Availability</th>
            </tr>`
            });
        }

        self.tabs.push({
            label: 'Order History',
            cl: 'ord_his',
            request: 'getOrderHistoryPagination',
            handler: 'getOrderHistoryPaginationHandler',
            tableHeader: `<tr>
                <th>ID</th>
                <th>Date</th>
                <th>Status</th>
                <th>User</th>
                <th>Reseller</th>
                <th>Description</th>
            </tr>`
        });
        self.setCardTabs(self.tabs);
    }
    self.getOrderDevicesPaginationHandler = function (response) {
        self.disableEdit();
        var tbody = '';
        response.data.result.forEach((scanner) => {
            var buttons = '';
            if (!curUserIsClient()) {
                var terminateButton = '';
                if (scanner.status == 0 || scanner.status == 10 || scanner.status == 9) {
                    terminateButton = ' <button class="btn btn-sm btn-default terminate_button" style="margin-right: 3px;">Terminate</button>';
                }
                var scannerMac = '<button class="btn btn-sm btn-default" onclick="selectBindMacNew(' + scanner.id + ')">Bind Mac</button>';
                if (scanner.BLEAddress != null && scanner.BLEAddress != '' && scanner.BLEAddress != 'null') {
                    scannerMac = ' Mac Address: ' + scanner.BLEAddress;
                }
                buttons = terminateButton + '' + scannerMac;
            }
            var disableDeposit = self.order.status === 0 || self.order.status === 3 ? '' : 'disabled';
            // console.log("ORDER INFO: ",self.order);
            tbody += `<tr style="position:relative;" data-id="${scanner.id}" class="scan_in_ord">
                <td>${scanner.id}</td>
                <td>${getScannerStatusFromStatusId(scanner.status, scanner.params)}</td>
                <td>`;
                if (self.order.device_type_id == 1) {
                    tbody += `<div class="check_buttons_block" style="width: 100%;">
                        <button style="width: 49%;font-size: 11px;" type="button" ${disableDeposit} class="btn btn-default check_buttons_deposit ${scanner.deposit != "0.00" ? 'active' : ''}" onclick="doActive(this)" data-val="1">On</button>
                        <button style="width: 49%;font-size: 11px;" type="button" ${disableDeposit} class="btn btn-default check_buttons_deposit ${scanner.deposit == "0.00" ? 'active' : ''}" onclick="doActive(this)" data-val="0">Off</button>
                    </div>`;
                }

            tbody += `</td>
                <td style="position:relative;">${buttons}</td>
            </tr>`;
        });
        self.modalElement.find('#' + self.tableId).find('tbody').html(tbody);
        self.modalElement.find('.terminate_button').click(self.terminateFromOrder);
        self.modalElement.find('.check_buttons_deposit').click(self.checkButtonsDeposit);
    }

    self.checkButtonsDeposit = function () {
        if($(this).closest('.check_buttons_block').hasClass('deposit_recalculate')) {
            $(this).closest('.check_buttons_block').removeClass('deposit_recalculate');
        } else {
            $(this).closest('.check_buttons_block').addClass('deposit_recalculate');
        }

        if($(this).closest('table').find('.deposit_recalculate').length) {
            self.enableEdit()
        } else {
            self.disableEdit();
        }
    };

    self.getOrderCablesPaginationHandler = function (response) {
        self.disableEdit();
        var tbody = '';
        $.each(response.data.cables, function (key, cable) {
            var amount = 0;
            response.data.result.forEach((item) => {
                if (item.cableId == cable.id) {
                    amount = item.amount;
                }
            });
            amount = curUserIsClient() ? amount : `<input data-type="${cable.id}"  type="number" value="${amount}" min="0" max="999" class="form-control cables_am" id="cable_${cable.id}">`;
            var available = cable.active == 0 ? '<span class="label label-danger">Not available</span>' : 'Available';
            if (!curUserIsClient() || amount > 0)
                tbody += `<tr>
                    <td><img src="/dash/assets/img/eld/thumb/${cable.thumb_url}" style="width:40px; margin-right:3px;" />${cable.name}</td>
                    <td>$${cable.price}</td>
                    <td>${amount}</td>
                    <td>${available}</td>
                </tr>`;

            if (curUserIsClient() && response.data.result.length == 0) {
                tbody = '<tr ><td colspan="4" style="text-align:center; font-weigth:bolder;">No Data Found</td></tr>';
            }
        });

        self.modalElement.find('#' + self.tableId).find('tbody').html(tbody);
        self.modalElement.find('#' + self.tableId).find('.cables_am').keyup(self.changeCablesAmount);
        self.modalElement.find('#' + self.tableId).find('.cables_am').change(self.changeCablesAmount);

    };

    self.getOrderCamerasPaginationHandler = function (response) {
        self.disableEdit();
        var tbody = '';
        $.each(response.data.result, function (key, camera) {
            var amount = curUserIsClient() ? camera.amount : `<input data-type="${camera.cableId}" ${camera.category_id === 2 ? 'disabled="disabled"' : ''} type="number" value="${camera.amount}" min="0" max="999" class="form-control cameras_am" id="camera_${camera.cableId}">`;
            var available = camera.active == 0 ? '<span class="label label-danger">Not available</span>' : 'Available';
            if (!curUserIsClient() || amount > 0)
                tbody += `<tr>
                    <td><img src="/dash/assets/img/eld/thumb/${camera.thumb_url}" style="width:40px; margin-right:3px;" />${camera.name}</td>
                    <td>$${camera.price}</td>
                    <td>${amount}</td>
                    <td>${available}</td>
                </tr>`;

            if (curUserIsClient() && response.data.result.length == 0) {
                tbody = '<tr><td colspan="4" style="text-align:center; font-weigth:bolder;">No Data Found</td></tr>';
            }
        });

        self.modalElement.find('#' + self.tableId).find('tbody').html(tbody);
        self.modalElement.find('#' + self.tableId).find('.cameras_am').keyup(self.changeCablesAmount);
        self.modalElement.find('#' + self.tableId).find('.cameras_am').change(self.changeCablesAmount);

    };

    self.getOrderHistoryPaginationHandler = function (response) {
        self.disableEdit();
        var tbody = '';
        var changeOrderText = '';
        if (position == TYPE_SUPERADMIN || (typeof superAdminRights.dates != 'undefined' && superAdminRights.dates == 1)) {
            changeOrderText += ' <button class="btn btn-default btn-xs changeOrderDate"><i class="fa fa-edit"></i></button>';
            changeOrderText += ' <button class="btn btn-default btn-xs changeOrderDateCancel" style="display:none">Cancel</button>';
            changeOrderText += ' <button class="btn btn-default btn-xs changeOrderDateSave" style="display:none">Save</button>';
        }
        response.data.result.forEach((item) => {
            var dtRow = '<span class="edit_date">' + timeFromSecToUSAString(item.dateTime) + '</span>' + changeOrderText;
            tbody += `<tr data-id="${item.id}" data-date="${item.dateTime}">
                <td>${item.id}</td>
                <td>${dtRow}</td>
                <td>${getOrderStatus(item)}</td>
                <td>${item.userName !== null ? item.userName : ''}</td>
                <td>${item.store_name !== null ? item.store_name : ''}</td>
                <td>${item.description !== null ? item.description : ''}</td>
            </tr>`;
        });
        self.modalElement.find('#' + self.tableId).find('tbody').html(tbody);
        self.modalElement.find('#' + self.tableId).find('.changeOrderDate').click(self.changeOrderDateClick)
        self.modalElement.find('#' + self.tableId).find('.changeOrderDateCancel').click(self.changeOrderDateCancelClick)
        self.modalElement.find('#' + self.tableId).find('.changeOrderDateSave').click(self.changeOrderDateSaveClick)
    }

    self.enableEdit = function () {
        self.editMode = true;
        self.modalElement.find('.edit_order_buttons_box').show()
    }

    self.disableEdit = function () {
        if (self.editMode) {
            self.editMode = false;
            self.modalElement.find('.edit_order_buttons_box').hide()
            self.regenerateHeaders();
            self.modalElement.find('.activeCarriersTableTab').click();
        }
    }

    self.saveOrderEdit = function () {
        var orderUpdate = {orderId: self.order.id};
        self.editedOrder.delivery_price = self.modalElement.find('.delivery_price_edit_input').val()
        if(self.editedOrder.deliveryInfo.length) {
            self.editedOrder.deliveryInfo[0].trackingId = self.modalElement.find('.delivery_tracking_input').val()
        }
        self.editedOrder.status = self.modalElement.find('.order_status').val()
        self.editedOrder.overnight = self.modalElement.find('.overnightDeliveryCheckbox.active').attr('data-val')
        if (isEqual(self.order, self.editedOrder)) {
            self.disableEdit();
            return 1;
        }
        if (self.order.delivery_price != self.editedOrder.delivery_price) {
            orderUpdate.delivery = {orderId: self.order.id, newPrice: self.editedOrder.delivery_price};
        }
        if (self.order.deliveryInfo.length && self.order.deliveryInfo[0].trackingId != self.editedOrder.deliveryInfo[0].trackingId) {
            orderUpdate.createTrackingIDManual = {orderId: self.order.id, trackingId: self.editedOrder.deliveryInfo[0].trackingId};
        }
        if (self.order.status != self.editedOrder.status) {
            orderUpdate.updateOrderStatus = {orderId: self.order.id, newStatus: self.editedOrder.status, description: ''};
        }
        //Overnight
        if (self.order.overnight != self.editedOrder.overnight) {
            orderUpdate.overnight = {orderId: self.order.id, orderOvernightType: self.editedOrder.overnight};
        }
        var newDevices = self.modalElement.find('#' + self.tableId).find('.new_device');
        var terminatingDevices = self.modalElement.find('#' + self.tableId).find('.terminating')
        var cablesEqual = isEqual(self.order.cables, self.editedOrder.cables);
        if (newDevices.length > 0 || terminatingDevices.length > 0 || !cablesEqual) {
            var terminating = [];
            var cables = {};
            var deposit = 0;
            $(terminatingDevices).each(function () {
                terminating.push($(this).attr('data-id'));
            });
            $(newDevices).each(function () {
                deposit += parseInt($(this).find('.deposit_button.active').attr('data-val'))
            });
            $.each(self.editedOrder.cables, function (key, cable) {
                cables[cable.cableId] = cable.amount;
            })
            orderUpdate.addDevice = {orderId: self.order.id, amount: newDevices.length, terminating: terminating, cables: cables, deposit: deposit};
        }
        var depositChangeBtn = self.modalElement.find('#' + self.tableId).find('.deposit_recalculate');
        if (depositChangeBtn.length > 0) {
            var amounts = {};
            $(depositChangeBtn).each(function () {
                var deviceId = $(this).closest('tr').attr('data-id');
                amounts[deviceId] = {
                    id: deviceId,
                    deposit: parseInt($(this).find('.check_buttons_deposit.active').attr('data-val'))
                };
            });
            orderUpdate.recalculateDeposit = {orderId: self.order.id, amounts: amounts};
        }
        AjaxController('orderUpdate',orderUpdate, adminUrl, self.saveOrderEditHandler, self.saveOrderEditErrorShowHandler, true);
    }
    self.changeOrderStatus = function () {
        self.enableEdit()
    }
    self.overnightDeliveryChange = function () {
        self.enableEdit()
        self.editedOrder.overnight = parseInt($(this).attr('data-val'));
        self.checkIfChanged();
    }
    self.changeOrderDateSaveClick = function () {
        var newTime = $(this).parent().find('.edit_date_pick').val();
        var date = convertDateToSQL(newTime.substr(0, 10));
        var time = newTime.substr(11)
        newTime = (newDate(date + ' ' + time).getTime()) / 1000;
        if ($(this).closest('#' + self.tableId).length == 1) {
            var historyId = $(this).closest('tr').attr('data-id');
            AjaxController('orderHistoryDateChange', {newTime: newTime, orderId: self.order.id, historyId: historyId}, apiAdminUrl, self.saveOrderEditHandler, self.saveOrderEditHandler, true);
        } else {
            AjaxController('orderDateChange', {newTime: newTime, orderId: self.order.id}, apiAdminUrl, self.saveOrderEditHandler, self.saveOrderEditHandler, true);
        }
    }
    self.changeOrderDateCancelClick = function () {
        $(this).parent().find('.edit_date_pick').remove()
        $(this).parent().find('.edit_date, .changeOrderDate').show();
        $(this).parent().find('.changeOrderDateCancel, .changeOrderDateSave').hide();
    }
    self.changeOrderDateClick = function () {
        $(this).parent().find('.edit_date, .changeOrderDate').hide();
        $(this).parent().find('.changeOrderDateCancel, .changeOrderDateSave').show();
        $(this).parent().find('.edit_date_pick').remove()
        $(this).parent().prepend('<input class="datetimepicker edit_date_pick form-control input-sm" style="width: 170px;display: inline-block;"/>');
        $(this).parent().find('.edit_date_pick').datetimepicker({dateFormat: "mm-dd-yy", timeFormat: "HH:mm:ss", maxDate: new Date()});
        c(self.order.orderDate);
        if ($(this).closest('#' + self.tableId).length == 1) {
            $(this).parent().find('.edit_date_pick').datepicker('setDate', newDate(timeFromSecToSqlString($(this).closest('tr').attr('data-date') * 1000, true)))
        } else {
            $(this).parent().find('.edit_date_pick').datepicker('setDate', newDate(timeFromSecToSqlString(self.order.orderDate * 1000, true)))
        }
    }
    self.changeDeliveryAddressClick = function () {
        var addr1 = (self.order.address1 == null ? '' : self.order.address1);
        if (addr1 != '')
            addr1 = 'Apt ' + addr1;
        var addrText = self.order.address;
        if (addr1 != '') {
            addrText += ', ' + addr1;
        }
        addrText += ' ' + self.order.city + ',' + self.order.stateName + ',' + self.order.zip;
        var stateText = '<option value="0">STATE/PROVINCE</option>';
        $.each(locationStates, function (key, state) {
            stateText += '<option value="' + state.id + '" ' + (self.order.state == state.id ? 'selected="selected"' : '') + ' data-short="' + state.short + '">' + state.name + '</option>';
        })
        var modal = showModal('Edit Address', `
            <form id="deliveryAddressForm" class="form-horizontal">
                <div class="form-group">
                    <div class="col-md-4 control-label">Apartment number</div>
                    <div class="col-md-8"><input id="address1" name="address1" class="form-control" type="text" value="${self.order.address1}"></div>
                </div>
                <div class="form-group">
                    <div class="col-md-4 control-label">Address</div>
                    <div class="col-md-8"><input id="address" name="address" class="form-control" type="text" value="${self.order.address}"></div>
                </div>
                <div class="form-group">
                    <div class="col-md-4 control-label">City</div>
                    <div class="col-md-8"><input id="city" name="city" class="form-control" type="text" value="${self.order.city}"></div>
                </div>
                <div class="form-group">
                    <div class="col-md-4 control-label">State</div>
                    <div class="col-md-8">
                        <select name="state" id="reg_state" class="form-control">
                        ${stateText}
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <div class="col-md-4 control-label">Zip Code</div>
                    <div class="col-md-8"><input id="zip" name="zip" class="form-control" type="text" maxlength="10" value="${self.order.zip}"></div>
                </div>
            </form>`,
                'basicModal',
                '',
                {footerButtons: `<button class="btn btn-default save" >Save</button>`}
        )
        modal.find('.save').click(function () {
            var $form = $(this).closest('.modal').find('form'),
                    $address = $form.find('#address'),
                    $address1 = $form.find('#address1'),
                    $city = $form.find('#city'),
                    $state = $form.find('#reg_state'),
                    $zip = $form.find('#zip');

            //Validation
            resetError($form);
            if (!$address.val())
                setError($address, 'Enter office address');
            if ($address1.val()) {
                if (!/^[A-Za-z0-9\s.-]+$/.test($address1.val()))
                    setError($address1, 'Enter numbers');
                else if ($address1.val().length > 10)
                    setError($address1, 'Max allowed 10 numbers');
            }
            if (!$city.val())
                setError($city, 'Enter delivery city');
            if (!parseInt($state.val()))
                setError($state, 'Chose state');
            if (!validate.zip($zip.val()))
                setError($zip, 'Enter Zip code');
            if ($form.find('.error').length)
                return false;

            var data = {orderId: self.order.id, address: $address.val(), address1: $address1.val(), city: $city.val(), state: $state.val(), zip: $zip.val()};
            $(this).closest('.modal').remove();
            AjaxController('updateDeliveryAddress', data, adminUrl, self.saveOrderEditHandler, self.saveOrderEditHandler, true);
        })

    }

    self.changeDeliveryPriceClick = function () {
        self.enableEdit()
        if ($(this).text() == 'Edit') {
            $(this).text('Cancel')
            $('.delivery_price_edit_input').show();
            $('.delivery_price_edit_span').hide();
        } else {
            $(this).text('Edit');
            $('.delivery_price_edit_input').hide();
            $('.delivery_price_edit_span').show();
            self.checkIfChanged();
        }
    }

    self.checkIfChanged = function () {
        c('checkIfChanged')
        var hasNewDevices = self.modalElement.find('#' + self.tableId).find('.new_device').length > 0;
        var hasTerminatedDevices = self.modalElement.find('#' + self.tableId).find('.terminating').length > 0;
        if (isEqual(self.order, self.editedOrder) && !hasNewDevices && !hasTerminatedDevices) {
            self.disableEdit();
        }
    }
    self.createManualTrackingIdClick = function () {
        self.enableEdit()
        if ($(this).text() == 'Edit') {
            $(this).text('Cancel')
            $('.delivery_tracking_input').show();
            $('.delivery_tracking_span').hide();
        } else {
            $(this).text('Edit');
            $('.delivery_tracking_input').hide();
            $('.delivery_tracking_span').show();
            self.checkIfChanged();
        }
    }
    self.saveOrderEditHandler = function () {
        self.initRequest()
    }
    self.saveOrderEditErrorShowHandler = function (response) {
        new orderCard(self.orderId, {initCallback: function () {
            if(typeof response.code !== 'undefined') {
                var title = (response.code === '999' ? 'Warning' : 'Error');
                showModal(title, '<p class="text-center">' + response.message + '</p>');
            }
            response = '';
        }});
    };
    self.getTrackingEvent = function () {
        AjaxController('getTrackingEvent', {trackingId: self.order.deliveryInfo[0].trackingId}, adminUrl, self.saveOrderEditHandler, self.saveOrderEditHandler, true);
    }
    self.addDeviceToOrder = function () {
        if (!self.modalElement.find('.ord_dvc').hasClass('activeCarriersTableTab')) {
            self.modalElement.find('.ord_dvc').click();
            return 1;
        }
        var table = self.modalElement.find('#' + self.tableId);
        var item = '<tr class="new_device">\
            <td>New</td>\
            <td>Ordered not paid</td><td>';

        if (self.order.device_type_id == 1) {
            item += `<div class="check_buttons_block" style="width: 100%;padding-bottom: 2px;">
                        <button style="width: 49%;font-size: 11px;" type="button" class="btn btn-default deposit_button active" onclick="doActive(this)" data-val="1">On</button>
                        <button style="width: 49%;font-size: 11px;" type="button" class="btn btn-default deposit_button  " onclick="doActive(this)" data-val="0">Off</button>
                    </div>`;
        }

        item += '</td>\
            <td><button class="btn btn-sm btn-default remove_new">Remove</button></td>\
        </tr>';

        var $tr = $(item);
        table.find('tbody').prepend($tr);
        $tr.find('.remove_new').click(function () {
            $(this).closest('tr').remove();
            self.checkIfChanged();
        })
        self.enableEdit();
    }
    self.terminateFromOrder = function () {
        c('terminateFromOrder')
        $(this).closest('tr').addClass('terminating').hide();
        self.enableEdit();
    }
    self.changeCablesAmount = function () {
        self.enableEdit();
        var type = parseInt($(this).attr('data-type'));
        var newAmt = parseInt($(this).val());
        var hasAlready = false;
        self.editedOrder.cables = $.grep(self.editedOrder.cables, function (cable, key) {
            if (cable.cableId == type) {
                hasAlready = true;
                if (newAmt == 0 && cable.id == 0) {
                    return false;
                }
                self.editedOrder.cables[key].amount = newAmt;
            }
            return true;
        })
        if (!hasAlready && newAmt > 0) {
            self.editedOrder.cables.push({id: 0, cableId: type, amount: newAmt});
        }
        self.checkIfChanged();
    }
    self.initRequest();
}


function getOrderStatus(order) {
    var orderStatus = 'New Order';
    if (order.status == 1) {
        orderStatus = 'Completed';
    } else if (order.status == 2) {
        orderStatus = 'Canceled';
    } else if (order.status == 3) {
        orderStatus = 'Paid';
    } else if (order.status == 4) {
        orderStatus = 'Sent';
    } else if (order.status == 5) {
        orderStatus = 'Pick Up';
    } else if (order.status == 101) {
        orderStatus = 'Update';
    }
    return orderStatus;
}

function selectBindMacNew(deviceId) {
    var body = `<div class="form-horizontal ">
            <div class="form-group ">
                <div class="col-sm-12">
                    <label for="invite_name">Select Mac</label>
                    <input id="select_mac_input" type="text" class="form-control" placeholder="Mac Addres" onkeyup="findFreeDeviceMac(this)"/>
                    <div id="select_mac" style="top: 55px;left: 15px;">
                        <div id="select_mac_list"></div>
                    </div>
                </div>
            </div>
            <div id="bind_mac_error_box"></div>
        </div>`;
    showModal('Bind Mac', body, 'bind_mac_modal', '', {footerButtons: `<button class="btn btn-default" id="bind_button" onclick="bindMacToDeviceId(${deviceId})">Bind</button>`})
    findFreeDeviceMac();
}
function findFreeDeviceMac(el = false) {
    var filter = !el ? '' : $(el).val();
    $('#select_mac_list, #select_mac').show();
    $('#select_mac input').attr('data-id', 0).removeClass('error');
    if (filter == '') {
        $('#select_mac_list').empty()
    }
    $('#bind_button').prop('disabled', true);
    AjaxController('findFreeDeviceMac', {filter: filter}, adminUrl, 'findFreeDeviceMacHandler', findFreeDeviceMacHandler, true);
}
function findFreeDeviceMacHandler(response) {
    var str = '';
    $.each(response.data.macs, function (key, mac) {
        str += `<p class="one_mac" data-id="${mac.id}" onclick="selectedBindMac(this);" style="cursor:pointer;">${mac.macId}</p>`;
    })
    str = str == '' ? 'No Mac addresses found' : str;
    $('#select_mac_list').empty().append(str);
}
function selectedBindMac(el) {
    var macId = $(el).attr('data-id');
    var macVal = $(el).text();
    $('#select_mac').hide();
    $('#select_mac_input').val(macVal);
    $('#select_mac_input').attr('data-id', macId)
    $('#bind_button').prop('disabled', false);
}
function bindMacToDeviceId(deviceId) {
    var macAddressId = $('#select_mac_input').attr('data-id');
    AjaxController('bindMacToDevice', {macAddressId: macAddressId, deviceId: deviceId}, adminUrl, bindMacToDeviceHandler, bindMacToDeviceErrorHandler, true);
}
function bindMacToDeviceHandler(response) {
    $('#bind_mac_modal .close').click();
    if ($('#orderCard_' + response.data.orderId).length > 0)
        new orderCard(response.data.orderId)
    if ($('#eldDeviceCard_' + response.data.deviceId).length > 0)
        new eldDeviceCard(response.data.deviceId);
	if ($('#eld_table tr[scannerid="' + response.data.deviceId+'"]').length > 0)
		$('#eld_table select.paginationInput').first().change()
}
function bindMacToDeviceErrorHandler(response) {
    setError($('#bind_mac_error_box'), response.message);
}

function generateDeliveryLabel(el) {
    if ($('#generateDeliveryLabel').length == 0) {
        $('.content').append(`<div id="generateDeliveryLabel" class="one_part_box">
            <div class="popup_box_panel small-popup">
                <h2 class="box_header">Generate Delivery Label</h2>
                <button class="close_edit"><i class="fa fa-times" aria-hidden="true"></i></button>
                <div class="">
                    <div>
                        <input type="checkbox" value="Y" id="notrecship" style="width: auto;" onchange="checkboxChange(this);"/>
                        <label>Notify recipient of shipping.</label>
                        <div id="notrecship-box" style="display: none;">
                            <label>*EMail</label>
                            <input type="email" placeholder="EMail" id="notrecship-email"/><br>
                            <label>Add a Message</label>
                            <textarea maxlength="64" id="notrecship-mess"></textarea>
                        </div>
                    </div>
                    <div>
                        <label>ServiceType</label>
                        <select id="servicetype">
                            <option value="PRIORITY" selected>PRIORITY</option>
                            <option value="FIRST CLASS">FIRST CLASS</option>
                            <option value="RETAIL GROUND">RETAIL GROUND</option>
                            <option value="MEDIA MAIL">MEDIA MAIL</option>
                            <option value="LIBRARY MAIL">LIBRARY MAIL</option>
                        </select>
                    </div>
                    <div>
                        <label>*Weight In Ounces</label>
                        <input type="text" placeholder="Weight In Ounces" id="weight_in_ounces"/>
                    </div>
                    <div>
                        <input type="checkbox" value="Y" id="largedel" style="width: auto;" onchange="checkboxChange(this);"/>
                        <label>This package has a dimension measuring over 12".</label>
                        <div id="largedel-box"  style="display: none;">
                            <label>*Length</label>
                            <input type="text" placeholder="Length" id="length" /><br>
                            <label>*Width</label>
                            <input type="text" placeholder="Width" id="width" /><br>
                            <label>*Height</label>
                            <input type="text" placeholder="Height" id="height" /><br>
                            <input type="checkbox" value="Y" id="notstan" style="width: auto;" onchange="checkboxChange(this);"/>
                            <label>This package isn't a standard, rectangular box.</label>
                            <div id="notstan-box" style="display: none;">
                                <label>*Girth</label>
                                <input type="text" placeholder="Girth" id="girth" />
                            </div>
                        </div>
                    </div>
                    <div id="deliveryLabelError">

                    </div>
                    <div>
                        <button class="btn btn-default" onclick="sendGenerateDeliveryLabel(this);">Generate Delivery Label</button>
                    </div>
                </div>
            </div>
	</div>`)
    }
    var orderId = $(el).attr('data-id');
    $('#notrecship-email').val('');
    $('#notrecship-mess').val('');
    $('#weight_in_ounces').val('');
    $('#length').val('');
    $('#width').val('');
    $('#height').val('');
    $('#girth').val('');
    $('#deliveryLabelError').empty();
    $('#generateDeliveryLabel').css('z-index', '9999').attr('data-id', orderId).show();
    $('#generateDeliveryLabel #notrecship-email').val($('#order_email').text());
}

function sendGenerateDeliveryLabel(el) {
    var orderId = $(el).closest('#generateDeliveryLabel').attr('data-id');
    trackingOrderId = orderId;
    var ToContactPreference = 'WAIVED';
    var ToContactMessaging = '';
    var ToContactEMail = '';
    if ($('#notrecship').prop("checked")) {
        ToContactPreference = 'EMAIL';
        ToContactMessaging = $('#notrecship-mess').val();
        ToContactEMail = $('#notrecship-email').val();
        if (ToContactEMail == '') {
            return false;
        }
    }
    var WeightInOunces = $('#weight_in_ounces').val();
    if (WeightInOunces == '') {
        return false;
    }
    var ServiceType = $('#servicetype').val();
    var Size = 'REGULAR';
    var Width = '';
    var Length = '';
    var Height = '';
    var Girth = '';
    if ($('#largedel').prop("checked")) {
        Size = 'LARGE';
        Width = $('#width').val();
        Length = $('#length').val();
        Height = $('#height').val();
        if (Width == '' || Length == '' || Height == '') {
            return false;
        }
        if ($('#largedel').prop("checked")) {
            Girth = $('#girth').val();
            if (Girth == '') {
                return false;
            }
        }
    }

    var data = {};

    data.orderId = orderId;

    data.ToContactPreference = ToContactPreference;
    data.ToContactMessaging = ToContactMessaging;
    data.ToContactEMail = ToContactEMail;

    data.WeightInOunces = WeightInOunces;
    data.ServiceType = ServiceType;

    data.Size = Size;
    data.Width = Width;
    data.Length = Length;
    data.Height = Height;
    data.Girth = Girth;

    AjaxController('generateDeliveryLabel', data, adminUrl, 'generateDeliveryLabelHandle', generateDeliveryLabelHandle, true);
}

function generateDeliveryLabelHandle(response) {
    if (response.data.Number) {
        $('#deliveryLabelError').empty().append(`<p>${response.data.Description}</p>`);
    } else {
        $('#generateDeliveryLabel').hide();
        $('#info .tri').remove();
        $('#info .dl').remove();
        $('#info .le').remove();
        new orderCard(trackingOrderId)
    }
}

function downloadAllTerms(el, event) {
    event.stopPropagation();
    var type = $(el).attr('data-type');
    var orderId = $(el).attr('data-orderid');
    var order_type = $(el).attr('data-order_type');
    var data = {
        name: type,
        orderId: orderId,
        print_settings: {
            read: 1
        }
    };
    /*if ($('#pdf_all_terms').length == 0) {
     $('.content').append(`<form action="${EZPDF_LINK}/index.php" method="post" target="_blank" style="display:none" id="pdf_all_terms">
     <input type="hidden" name="name" value="allTerms">
     <input type="hidden" name="data" class="pdf_data">
     <input type="hidden" name="initiator" value="${curUserId}" />
     </form>`);
     }
     $('#pdf_all_terms .pdf_data').val(JSON.stringify(data));
     $('#pdf_all_terms').submit();*/
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
        print_settings: {
            read: 0
        }
    };
    var params = {};
    params.name = "FullOrderInfo";
    params.data = JSON.stringify(data);
    pdfGen.generateAndSendForm(params, {'action': 'FullOrderInfo'});
    }

function getOneOrder(el) {
    var orderId = $(el).attr('data-orderid')
    new orderCard(orderId)
}
