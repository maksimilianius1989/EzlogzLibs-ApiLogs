function managerCarrierCard(carrierId, params = {}) {
    var self = this;
    self.params = params;
    self.carrierId = carrierId;
    self.cntrlUrl = apiAdminUrl;
    self.modalElement = '';
    self.tableId = 'carrierCard_' + carrierId;
    modalCore(self);

    self.modalId = 'modalCarrier';
    self.modalTitle = 'CARRIER INFO ID '+carrierId;
    self.paginator = false;
    self.tabs = [];
    self.forceSearchParams = [{key: 'carrierId', val: carrierId}]
    self.carrier = '';

    self.initRequest = function () {
        AjaxController('getManagerCarrierCardInit', {carrierId: carrierId}, self.cntrlUrl, self.init, self.init, true);
    }
    self.init = function (response) {
        self.carrier = response.data.carrier;
        self.generateHeaders();
        self.generateButtons();
        self.createModal();
        self.modalElement.find('.get_balance_pdf').click(self.downloadBalancePDF)
    }
    self.generateHeaders = function () {
        self.carrier.resellerName = getDisplayValue(self.carrier.resellerName);
        self.carrier.ein = getDisplayValue(self.carrier.ein);
        self.carrier.address = getDisplayValue(self.carrier.address);
        self.carrier.city = getDisplayValue(self.carrier.city);
        self.carrier.state = getDisplayValue(self.carrier.state);
        var activeStatus = '<span class="green">Active</span>';
        if(self.carrier.banned === 1) {
            activeStatus = '<span class="red">Banned</span>';
        } else if (self.carrier.deactivated === 1) {
            activeStatus = `<span class="red">Deactivated</span> (${new Date(parseInt(self.carrier.lastEmailTime + '000')).customFormat("#MM#-#DD#-#YYYY# #hh#:#mm#:#ss#")})`
        }
        var headers = [];
        var waived = '';
        if (self.carrier.usedWaiveFee === 1) {
            waived = 'Waived';
        }
        var balanceColor = getBalanceColorFromDue(self.carrier.currentDue);
        var statement = self.carrier.currentDue > 0 ? `<button class="btn btn-default btn-xs" onclick="sendStatementPDF(${self.carrier.id})">Statement</button>` : ``;
		var recurring = (self.carrier.recAmount !== null ? ' (+'+self.carrier.recAmount + '$ till '+convertDateToUSA(self.carrier.recurringTill)+')' : '');
		var recurringButton = self.carrier.recAmount !== null ? `<button class="btn btn-default btn-xs" onclick="subscriptionBtnClick(${self.carrier.ownerId})">Recurring</button>` : '';
		var addCardButton = `<button class="btn btn-default btn-xs" onclick="managerModalAddCreditCard({carrierId:${self.carrier.id}})">Add Card</button>`;
        var generateInvoiceButton = `<button class="btn btn-default btn-xs" onclick="payForClientPopup(${self.carrier.currentDue}, false, false, false, ${self.carrier.id}, false)">Generate Invoice</button>`;
        var payButton = self.carrier.creditCardData.creditCard ? `<button class="btn btn-default btn-xs" onclick="finances.payOfCreditCardPopup(${self.carrier.currentDue}, 0, ${self.carrier.id})">Pay</button>` : '';
		var balance = `<span id="fleetCurrentDueInfo" class="${balanceColor}">${moneyFormat(-self.carrier.currentDue)}</span> ${payButton}${generateInvoiceButton}${addCardButton}${recurringButton}<span id="recurringCardPayInfo">${recurring}</span>`;

        var addDue = '';
        var banned = false;
        if (self.carrier.banned === 1) {
            banned = '';
        }
        headers.push({label: 'Fleet Name', value: self.carrier.name + `<button class="btn btn-default btn-xs" style="float:right;" onclick="sendCertificateEzlogz(\'${self.carrier.name}\', \'${self.carrier.id}');">Certificate</button>`});
        headers.push({label: 'USDOT Number', value: self.carrier.usdot});

        headers.push({label: 'Address', value: self.carrier.address});
        headers.push({label: 'Fleet Id', value: self.carrier.id});

        headers.push({label: 'City', value: self.carrier.city});
        headers.push({label: 'Time Zone', value: self.carrier.timeZone});

        headers.push({label: 'State', value: self.carrier.state});
        headers.push({label: 'Default Duty Cycle', value: self.carrier.cycle});

        headers.push({label: 'EIN', value: self.carrier.ein});
        headers.push({label: 'Reseller', value: self.carrier.resellerName});

        headers.push({label: 'Status', value: activeStatus});

        if (finances.checkAccessFinances()) {
            if (self.carrier.lastEmailTime !== null && self.carrier.usedWaiveFee === 0) {
                waived = `<button type="button" data-user_id="0" data-fleet_id="${self.carrier.id}" class="btn btn-default btn-xs" onclick="cancelLateFee(this)">Waive</button>`;
            }
            addDue = `<button class="btn btn-default btn-xs" onclick="manualAddDue('0', '${self.carrier.id}')">Charge or Credit </button>`;
            if (self.carrier.banned === 1) {
                banned = `<button type="button" class="btn btn-default btn-xs" onclick="unbannedFleet('${self.carrier.id}')">Unban</button>`;
                addDue += `<button type="button" class="btn btn-default btn-xs" id="waiveNotReturnedButton" onclick="waiveNotReturned('${self.carrier.id}')">Waive non-returned devices fee</button>`;
            }
        }
        headers.push({label: 'Late Fee', value: waived});

        headers.push({label: 'Balance', value: balance});
        if(self.carrier.currentDue > 0) {
            headers.push({label: 'Statement', value: statement});
        }
        headers.push({label: 'Add Due', value: addDue});


        if (banned != false) {
            headers.push({label: '', value: ''});
            headers.push({label: 'Banned', value: banned});
        }


        self.setCardHeaders(headers)
    }
    self.downloadBalancePDF = function(){
        var params = {};
        params.name = "balance";
        params.fleetId = self.carrierId;
        pdfGen.generateAndSendForm(params, {'action':'balance'});
    }
    self.generateButtons = function () {
        var buttons = [];
        buttons.push('<button class="btn btn-default" onclick="finances.showCreateInvoiceModal(' + self.carrier.ownerId + ');">New Invoice</button>');
        if (position === TYPE_SUPERADMIN || (typeof superAdminRights.firmware !== 'undefined' && superAdminRights.firmware === 1)) {
            buttons.push('<button class="btn btn-default" onclick="showSetAllDevicesVersionPopap(' + self.carrierId + ');">Set All Version Devices</button>');
        }
        buttons.push('<button class="btn btn-default get_balance_pdf" >Balance History</button>');
        buttons.push('<button onclick="add_fleet_comment(' + self.carrierId + ')" class="btn btn-default" >Add Support Comment</button>');
        buttons.push('<button class="btn btn-default drivers_move_logs" onclick="driversMoveLogsPopup(' + self.carrierId + ', true);">Move Logs</button>');
        self.setCardActionsButtons(buttons);

        self.tabs.push({
            label: 'Users',
            cl: 'car_users',
            request: 'getManagerCarrierCardUsersPagination',
            handler: 'getManagerCarrierCardUsersPaginationHandler',
			initSort: {param: 'name', dir: 'asc'},
            tableHeader: `<tr>
                <th data-type="id">Id</th>
                <th data-type="name">Name</th>
                <th data-type="last">Last Name</th>
                <th data-type="truckName">Unit</th>
                <th data-type="phoneType">App</th>
                <th data-type="email">Email</th>
                <th data-type="companyPosition">Position</th>
            </tr>
			<tr>
				<td><input class="paginationInput" placeholder="Id" type="text"></td>
				<td><input class="paginationInput" placeholder="Name" type="text"></td>
				<td><input class="paginationInput" placeholder="Last Name" type="text"></td>
				<td><input class="paginationInput" placeholder="Truck" type="text"></td>
				<td>
					<select class="paginationInput">
						<option></option>
						<option value="0">IOS</option>
						<option value="1">Android</option>
					</select>
				</td>
				<td><input class="paginationInput" placeholder="Email" type="text"></td>
				<td>
					<select class="paginationInput">
						<option></option>
						<option value="0">Basic</option>
						<option value="3">Professional Driver</option>
						<option value="4">Dispatcher</option>
						<option value="5">Safety</option>
						<option value="7">Driver ELD</option>
						<option value="15">Driver AOBRD</option>
					</select>
				</td>
				</tr>`
        });
        self.tabs.push({
            label: 'Orders',
            cl: 'car_orders',
            request: 'getManagerCarrierCardOrdersPagination',
            handler: 'getManagerCarrierCardOrdersPaginationHandler',
            tableHeader: `<tr>
                <th>Id</th>
                <th>Amount</th>
                <th>Products</th>
                <th>Date</th>
                <th>Status</th>
                <th>Agreements</th>
            </tr>`
        });
        self.tabs.push({
            label: 'Dues',
            cl: 'car_dues',
            request: 'getManagerCarrierCardDuesPagination',
            handler: 'getManagerCarrierCardDuesPaginationHandler',
            tableHeader: `<tr>
                <th>Due Data</th>
                <th>Description</th>
                <th>Amount</th>
            </tr>`
        });
        self.tabs.push({
            label: 'Invoices',
            cl: 'car_invoices',
            request: 'getManagerCarrierCardInvoicesPagination',
            handler: 'getManagerCarrierCardInvoicesPaginationHandler',
            tableHeader: '<tr>\n'+
                '<th>Invoice Date</th>\n'+
                '<th>Invoice Number</th>\n'+
                '<th>Transaction</th>\n'+
                '<th>Credit</th>\n'+
                '<th>Card Number</th>\n'+
                '<th>Status</th>\n'+
                '<th>Description</th>\n'+
                '<th>Paid</th>\n'+
                '<th>Amount</th>\n'+
                '<th>Refund</th>\n'+
                '<th>Actions</th>\n'+
                '</tr>'
        });
        self.tabs.push({
            label: 'Eld Devices',
            cl: 'car_eld_devices',
            request: 'getManagerCarrierCardDevicesPagination',
            handler: 'getManagerCarrierCardDevicesPaginationHandler',
            initSort: {param:'id', dir:'desc'},
			defaultPerPage: 50,
			perPageList:[15, 30, 50, 100],
            tableHeader: `<tr>
                <th data-type="id">Id</th>
                <th data-type="localId">Local Id</th>
                <th data-type="BLEAddress">BLE Address</th>
                <th data-type="version">Version</th>
                <th data-type="lastUse">Last Use</th>
                <th data-type="VIN">VIN</th>
                <th data-type="lastTruck">Truck</th>
                <th data-type="lastDriver">Driver</th>
                <th data-type="status">Status</th>
                <th>Actions</th>
            </tr>
			<tr>
				<td><input class="paginationInput" placeholder="Id" type="text"></td>
				<td><input class="paginationInput" placeholder="localId" type="text"></td>
				<td><input class="paginationInput" placeholder="BLE Address" type="text"></td>
				<td><input class="paginationInput" placeholder="Version" type="text"></td>
				<td></td>
				<td><input class="paginationInput" placeholder="VIN" type="text"></td>
				<td><input class="paginationInput" placeholder="Truck" type="text"></td>
				<td><input class="paginationInput" placeholder="Driver" type="text"></td>
				<td>
					<select>
						<option></option>
						<option value="0">Ordered, not paid</option>
						<option value="1">Ordered, paid</option>
						<option value="2">Registered to the fleet</option>
						<option value="3">Sent by mail</option>
						<option value="4" selected>Active</option>
						<option value="5">Deactivated</option>
						<option value="8">Deactivated by not being paid</option>
						<option value="9">Canceled before Activation</option>
						<option value="10">Restoring</option>
						<option value="11">Returning</option>
						<option value="12">Disconnected</option>
						<option value="102">Terminated</option>
						<option value="103">Transferring</option>
					</select>
				</td>
                <td></td>
			</tr>`
        });
        self.tabs.push({
            label: 'Equipment',
            cl: 'car_eq',
            request: 'getManagerCarrierCardEquipmentPagination',
            handler: 'getManagerCarrierCardEquipmentPaginationHandler',
            initSort: {param:'id', dir:'desc'},
            tableHeader: `<tr>
                <th data-type="id">Id</th>
                <th data-type="truckTrailer">Type</th>
                <th data-type="Name">Name</th>
                <th data-type="VIN">Vin</th>
                <th data-type="Year">Year</th>
                <th data-type="Make">Make</th>
                <th data-type="Model">Model</th>
            </tr>
			<tr>
				<td><input class="paginationInput" placeholder="Id" type="text"></td>
				<td>
					<select class="paginationInput truckTrailer">
						<option></option>
						<option value="0">Truck</option>
						<option value="1">Trailer</option>
					</select>
				</td>
				<td><input class="paginationInput" placeholder="Name" type="text"></td>
				<td><input class="paginationInput" placeholder="Vin" type="text"></td>
				<td><input class="paginationInput" placeholder="Year" type="text"></td>
				<td><input class="paginationInput" placeholder="Make" type="text"></td>
				<td><input class="paginationInput" placeholder="Model" type="text"></td>
			</tr>`
        });
        self.tabs.push({
            label: 'Support',
            cl: 'car_sup',
            request: 'getManagerCarrierCardSupportPagination',
            handler: 'getManagerCarrierCardSupportPaginationHandler',
            tableHeader: `<tr>
                <th style="width: 50px;">Id</th>
                <th style="width: 134px;">Date Time</th>
                <th style="width: 240px;">UserId</th>
                <th>Comment</th>
            </tr>`
        });
        self.tabs.push({
            label: 'User Actions',
            cl: 'car_actions',
            request: 'getManagerCarrierCardActionsPagination',
            handler: 'getManagerCarrierCardActionsPaginationHandler',
            tableHeader: `<tr>
                <th style="width: 50px;">Id</th>
                <th style="width: 134px;">Date Time</th>
                <th style="width: 240px;">User</th>
                <th>Action</th>
            </tr>`
        });
        var thCards = '';
        if(finances.checkAccessFinances()) {
            thCards = `<tr>
                <th>Number</th>
                <th>User</th>
                <th style="width: 100px;">Current</th>
                <th style="width: 100px;">Status</th>
                <th style="width: 100px;">Deleted</th>
                <th>Actions</th>
            </tr>`;
        } else {
            thCards = `<tr>
                <th>Number</th>
                <th>User</th>
                <th style="width: 100px;">Current</th>
                <th style="width: 100px;">Status</th>
                <th style="width: 100px;">Deleted</th>
            </tr>`;
        }
        self.tabs.push({
            label: 'Cards',
            cl: 'car_credit_cards',
            request: 'getManagerCreditCardPagination',
            handler: 'getManagerCreditCardActionsPaginationHandler',
            tableHeader: thCards
        });
        self.setCardTabs(self.tabs);
    }
    self.getManagerCarrierCardUsersPaginationHandler = function (response) {
        var tbody = '';
        response.data.result.forEach((item) => {
            var position = getUserPositionByKey(item.companyPosition);
            if (position == 'Driver ELD' && item.aobrd == 1) {
                position = 'Driver AOBRD';
            }
            var comStatus = '';
            if (item.role === 1) {
                comStatus = '(Admin)';
            }
            if (item.id == item.ownerId) {
                comStatus = '(Owner)';
            }
            tbody += `<tr onclick="getOneUserInfo(this, event)" data-userid="${item.id}" class="pointer">
                <td>${item.id}</td>
                <td>${item.name.trunc(25)}</td>
                <td>${item.last.trunc(25)}</td>
                <td>${getDisplayValue(item.truckName)}</td>
                <td>${getDriverAppUsageVersion(item.appVersion, item.phoneType)}</td>
                <td>${item.email}</td>
                <td>${position}${comStatus}</td>
            </tr>`;
        });
        self.modalElement.find('#' + self.tableId).find('tbody').html(tbody);
    }
    self.getManagerCarrierCardOrdersPaginationHandler = function (response) {
        var tbody = '';
        response.data.result.forEach((item) => {
            var cablesText = '';
            time = timeFromSecToUSAString(item.orderDate);
            $.each(item.cables, function (key2, cable)
            {
                cablesText += cablesText === '' ? '' : '<br/>';
                cablesText += cable.amount + ' x ' + cable.name;
            });

            var agreementsBtns = [];
            if (item.amount > 0) {
                agreementsBtns.push('<button data-orderid="' + item.id + '" data-order_type="'+item.device_type_id+'" data-type="saas_agreement" onclick="downloadAllTerms(this, event);">Download SAAS Agreement</button>');
                if (item.device_type_id == 2) {
                    agreementsBtns.push('<button data-orderid="' + item.id + '" data-order_type="'+item.device_type_id+'" data-type="equipment_lease" onclick="downloadAllTerms(this, event);">Download Equipment Purchase</button>');
                } else {
                    agreementsBtns.push('<button data-orderid="' + item.id + '" data-order_type="'+item.device_type_id+'" data-type="equipment_lease" onclick="downloadAllTerms(this, event);">Download Equipment Lease</button>');
                }
            }
            if(item.cables.find(x => x.category_id === 2)) {
                agreementsBtns.push(`<button data-orderid="' + item.id + '" data-type="camera_agreement" onclick="var file_path = '/docs/CameraPurchaseandDataServiceAgreement.pdf';var a = document.createElement('A');a.href = file_path;a.download = file_path.substr(file_path.lastIndexOf('/') + 1);document.body.appendChild(a);a.click();document.body.removeChild(a);">Download Camera Agreement</button>`);
            }
            tbody += `<tr onclick="getOneOrder(this)" data-orderid="${item.id}" class="pointer"> 
                <td>${item.id}</td>
                <td>${item.amount}</td>
                <td>${cablesText}</td>
                <td>${time}</td>
                <td>${getOrderStatus(item)}</td>
                <td>${addTableActionRow(agreementsBtns, 220)}</td>
            </tr>`;
        });
        self.modalElement.find('#' + self.tableId).addClass('table-actions-block').find('tbody').html(tbody);
    }

    self.getManagerCarrierCardDuesPaginationHandler = function (response) {
        var tbody = '';
        response.data.result.forEach((item) => {
            tbody += `<tr> 
                <td>${timeFromSQLDateTimeStringToUSAString(item.dateTime)}</td>
                <td>${item.description}</td>
                <td>${item.amount}</td>
            </tr>`;
        });
        self.modalElement.find('#' + self.tableId).find('tbody').html(tbody);
    }

    self.getManagerCarrierCardInvoicesPaginationHandler = function (response) {
        var tbody = '';
        response.data.result.forEach((item) => {
            var cardNumber = '';
            if (item.paymentParams != 'null' && item.paymentParams != null) {
                paymentParams = JSON.parse(item.paymentParams);
                cardNumber = paymentParams.cardNum.substr(paymentParams.cardNum.length - 8);
            } else if (item.data == 'Manager Pay Invoice' && item.paymentSys == 2 && item.paymentData.creditCardNumber != undefined) {
                cardNumber = item.paymentData.creditCardNumber.substr(item.paymentData.creditCardNumber.length - 8);
            }
            var listOfButtons = [];
            listOfButtons.push('<button type="button" data-id="'+ item.invoiceId +'" onclick="downloadInvoice(this)">Download PDF</button>');
            if((item.sumRefund === null || (item.sumRefund !== null && item.amount - item.sumRefund > 0)) && self.carrier.currentDue < 0 && finances.checkAccessFinances() && (item.paymentSys === 0 || item.paymentSys === 1 || item.paymentSys === 2)) {
                listOfButtons.push('<button type="button" onclick="refund.refundTransaction(\''+ item.transactionId +'\', '+ item.userId +')">Refund</button>');
            }
            tbody += '<tr>\n' +
                '<td>'+ timeFromSQLDateTimeStringToUSAString(item.dateTime) +'</td>\n' +
                '<td>'+ item.invoiceId +'</td>\n' +
                '<td>'+ item.transactionId +'</td>\n' +
                '<td>'+ paymentSystems[item.paymentSys] +'</td>\n' +
                '<td>'+ cardNumber +'</td>\n' +
                '<td>'+ (item.status ? '<span class="'+ (item.status === 1 ? 'green' : 'red font-weight-normal') +'">'+ (item.status === 1 ? 'Paid' : 'Failed') +'</span>' : '') +'</td>\n' +
                '<td>'+ item.data +'</td>\n' +
                '<td>'+ item.userName +'</td>\n' +
                '<td>'+ moneyFormat(item.amount) +'</td>\n' +
                '<td>'+ (item.sumRefund !== null ? moneyFormat(item.sumRefund) : '') +'</td>\n' +
                '<td>'+ addTableActionRow(listOfButtons, 120) +'</td>\n' +
            '</tr>';
        });
        self.modalElement.find('#' + self.tableId).addClass('table-actions-block').find('tbody').html(tbody);
    }

    self.getManagerCarrierCardDevicesPaginationHandler = function (response) {
        var tbody = '';
        response.data.result.forEach((item) => {
            var scannerStatus = getScannerStatusFromStatusId(item.status, item.params);
            if (item.type == 1) {
                scannerStatus += '(AOBRD)';
            }
            if (item.status == 4 && item.BLEAddress !== null && item.BLEAddress != '') {
                var light = 'green';
            } else if (item.status == 4 && (item.BLEAddress == null || item.BLEAddress == '')) {
                var light = 'orange';
            } else {
                var light = 'red';
            }
            var listOfButtons = [];
            light = '<span class="eld_light " style="width: 6px;height: 6px;background: ' + light + ';display: inline-block;border-radius: 50%;margin-right: 5px;"></span>';
            if (typeof window.position != 'undefined' && (position == TYPE_SUPERADMIN || (typeof superAdminRights.deactivate != 'undefined' && superAdminRights.deactivate == 1)) && item.status == 4 && (item.tariffId === 0 || item.tariffId === 3 || item.tariffId === 9)) {//superadmin activate/deactivate scanner functionality
				listOfButtons.push(`<button onclick="deactivateDevice(${item.id}, event, this)">Deactivate</button>`);
            } else if (typeof window.position != 'undefined' && (position == TYPE_SUPERADMIN || (typeof superAdminRights.deactivate != 'undefined' && superAdminRights.deactivate == 1)) && item.status == 5 && (item.tariffId === 0 || item.tariffId === 3 || item.tariffId === 9)) {//superadmin activate/deactivate scanner functionality
				listOfButtons.push(`<button onclick="activateDevice(${item.id}, event, this)">Activate</button>`);
            }
            var driver = (item.driverName !== null ? item.driverName : '');
            if (item.lastDriver != 0) {
                driver = '<span onclick="getOneUserInfo(this, event)" data-userid="' + item.lastDriver + '" style="font-weight:bold;">' + driver + '</span>'
                if (item.inactive == 1) {
                    driver += '(inactive)';
                }
            }

            var deviceTopVersion = '';
            if (parseInt(item.updateVersion) > 0 && parseInt(item.version) != parseInt(item.updateVersion)) {
                deviceTopVersion = '<span title="device need update" class="red"> (' + parseInt(item.updateVersion) + ')</span>';
            } else if (parseInt(item.updateVersion) == 0 && parseInt(item.version) != parseInt(response.data.stable_device_version)) {
                deviceTopVersion = '<span title="device need update" class="red"> (' + parseInt(response.data.stable_device_version) + ')</span>';
            }

            tbody += `<tr onclick="getEldCard(${item.id}, this, event)" class="pointer" scannerid = "${item.id}"> 
                <td>${item.id}</td>
                <td>${item.localId}</td>
                <td>${(item.BLEAddress !== null ? item.BLEAddress : '')}</td>
                <td>${item.version} ${deviceTopVersion}</td>
                <td>${timeFromSQLDateTimeStringToUSAString(item.lastUse)}</td>
                <td>${(item.vin !== null ? item.vin : '')}</td>
                <td>${(item.truckName !== null ? item.truckName : '')}</td>
                <td>${driver}</td>
                <td>${light}${scannerStatus}</td>
                <td>${listOfButtons.length ? addTableActionRow(listOfButtons, 120) : ''}</td>
            </tr>`;
        });
        self.modalElement.find('#' + self.tableId).find('tbody').html(tbody);
        self.modalElement.find('#' + self.tableId).addClass('table-actions-block').find('tbody').html(tbody);
    }

    self.getManagerCarrierCardEquipmentPaginationHandler = function (response) {
        var tbody = '';
        response.data.result.forEach((item) => {
            var itemVIN = item.VIN !== null ? item.VIN : '';
            var equipmentVin = item.eldVIN !== null ?
                    item.eldVIN + ` <i style="padding-left:1px;" class="fa fa-lock" aria-hidden="true" title="Binded from ELD/AOBRD Device, not editable"></i>
                                    <button style="margin: 0;" class="btn btn-default" onclick="deleteEldVin(this, event)">Delete Vin</button>` : item.VIN;

            tbody += `<tr data-equipmentid = "${item.id}" data-eqhisid = "${item.id}" data-id = "${item.id}" data-vin = "${itemVIN}" onclick="getOneTruckInfo(this, event);" style="cursor: pointer;"> 
                <td>${item.id}</td>
                <td>${(item.truckTrailer === 1 ? 'Trailer' : 'Truck')}</td>
                <td>${item.Name}</td>
                <td>${equipmentVin !== null ? equipmentVin : ''}</td>
                <td>${item.Year !== null ? item.Year : ''}</td>
                <td>${item.Make !== null ? item.Make : ''}</td>
                <td>${item.Model !== null ? item.Model : ''}</td>
            </tr>`;
        });
        self.modalElement.find('#' + self.tableId).find('tbody').html(tbody);
    }

    self.getManagerCarrierCardSupportPaginationHandler = function (response) {
        var tbody = '';
        response.data.result.forEach((item) => {
            tbody += `<tr data-supportid = "${item.id}"> 
                <td>${item.id}</td>
                <td>${timeFromSQLDateTimeStringToUSAString(item.dateTime)}</td>
                <td>${item.userName}</td>
                <td>${item.message.replace(/(?:\r\n|\r|\n)/g, '<br />')}</td>
            </tr>`;
        });
        self.modalElement.find('#' + self.tableId).find('tbody').html(tbody);
    }

    self.getManagerCarrierCardActionsPaginationHandler = function (response) {
        var tbody = '';
        response.data.result.forEach((item) => {
            tbody += `<tr data-supportid = "${item.id}"> 
                <td>${item.id}</td>
                <td>${timeFromSecToUSAString(item.dateTime)}</td>
                <td>${item.name} ${item.last} (${item.email})</td>
                <td>${item.action}</td>
            </tr>`;
        });
        self.modalElement.find('#' + self.tableId).find('tbody').html(tbody);
    }

    self.getManagerCreditCardActionsPaginationHandler = function (response) {
        var tbody = '';
        var status = {
            0:'label-default',
            1:'label-success',
        };
        response.data.result.forEach((item) => {
            var listOfButtons = [];
            listOfButtons.push(`<button type="button" onclick="setManageCreditCardDefault(${item.customer_profile_id}, ${item.customer_payment_profile_id})">Set current</button>`);
            listOfButtons.push(`<button type="button" onclick="managerCreditCardRemove(${item.customer_profile_id}, ${item.customer_payment_profile_id})">Remove</button>`);
            tbody += `<tr>
                <td><i class="fa fa-credit-card-alt"></i> ${item.creditCard}</td>
                <td>${item.userName} (${item.email})</td>
                <td>${item.currentCard === 1 ? '<span class="label label-success">Current</span>' : ''}</td>
                <td><span class="label ${status[item.validCard]}">${item.validCard === 1 ? 'Valid' : 'Not valid'}</span></td>
                <td><span class="label label-danger">${item.deleted === 1 ? 'Yes' : ''}</span></td>
                ${(finances.checkAccessFinances() ? '<td>' + addTableActionRow(listOfButtons, 120) + '</td>' : '')}
            </tr>`;
        });
        self.modalElement.find('#' + self.tableId).find('tbody').html(tbody);
        if(finances.checkAccessFinances()) {
            self.modalElement.find('#' + self.tableId).addClass('table-actions-block');
        }
    };

    self.initRequest();
}

function actionGlobalgetOneCarrierInfo(el, event = false) {
    var carrierId = 'null';
    if ($.isNumeric(el)) {
        carrierId = el;
    } else {
        carrierId = $(el).attr('data-carrid');
    }
    new managerCarrierCard(carrierId)

    if (event) {
        event.stopPropagation();
    }
}
var paymentSystems = {
    0: 'Card',
    1: 'PayPal',
    2: 'Authorize.net',
    3: 'Cash Money'
};

function unbannedFleet(fleetId) {
    AjaxController('unban', {'fleetId': fleetId}, adminUrl, 'unbannedFleetHandler', changeUserEmailHandler, true);
}
function unbannedFleetHandler(response) {
    if (response.data !== false) {
        $('#carrierFleetInfoBanned').remove();
		new managerCarrierCard(response.data.flettId)
    }
}
function sendStatementPDF(carrierId) {
    var params = {};
    params.name = 'Statement';
    params.carrierId = carrierId;
    pdfGen.generateAndSendForm(params, {'action':'Statement'});
}
function sendCertificateEzlogz(companyName, carrierId) {
    var params = {};
    params.name = 'CertificateEzlogz';
    params.companyName = companyName;
    params.carrierId = carrierId;
    pdfGen.generateAndSendForm(params, {'action':'certificateEzlogz'});
}
function waiveNotReturned(fleeetId) {
    showModal('Waive non-returned devices fee', '<p>Chose Action</p>\
            <p><button style="width: 125px;margin-right: 5px;" type="button" class="btn btn-default btn-xs waiveButton"  onclick="waiveNotReturnedConfirm(' + fleeetId + ',0)">Make Active</button><label>(Remove 60 days prorated fee and non-returned fee)</label></p>\
            <p><button style="width: 125px;margin-right: 5px;" type="button" class="btn btn-default btn-xs waiveButton"  onclick="waiveNotReturnedConfirm(' + fleeetId + ',1)">Devices Returned</button><label>(Remove non-returned fee, Charge Restocking Fee)</label></p>\
    ', 'waiveNotReturnedBox')
}
function waiveNotReturnedConfirmHandler(response) {
    $('#waiveNotReturnedBox').remove()
    $('#carriersAdminTable tr[data-carrid="' + response.data.fleetId + '"]').click();
}
function waiveNotReturnedConfirm(fleetId, type) {
    $('.waiveButton').prop('disabled', true)
    AjaxController('waiveNotReturnedConfirm', {fleetId: fleetId, type: type}, adminUrl, 'waiveNotReturnedConfirmHandler', changeUserEmailHandler, true);
}

function save_fleet_comment(el, feetId = 0, userId = 0) {
    var carrierId = $('#carrierUsersButtonsBox').attr('data-carrierid') != undefined ? $('#carrierUsersButtonsBox').attr('data-carrierid') : 0
    var carrierId = feetId != 0 ? feetId : carrierId
    var clientId = $('#user_info_box.one_part_box').attr('data-userid') != undefined ? $('#user_info_box.one_part_box').attr('data-userid') : 0
    var clientId = userId != 0 ? userId : clientId
    var message = $('#support_comment').val();
    var data = {};
    data.carrierId = carrierId;
    data.message = message;
    data.clientId = clientId;
    AjaxController('fleetSupportInfoUpdate', data, adminUrl, 'add_support_line', errorBasicHandler, true);
    $(el).closest('.one_part_box').remove();
    $(el).closest('.modal').find('.close').click();
}
function add_support_line(data) {
    var item = data.data.supportObj;
    var msg = item.message.replace(/(?:\r\n|\r|\n)/g, '<br />')
    var body = `<tr data-supportid = "${item.id}"> 
        <td>${item.id}</td>
        <td>${convertDateToUSA(item.dateTime, true, true)}</td>
        <td>${item.userName}</td>
        <td>${msg}</td>
    </tr>`;
    if ($('#carrierUsersButtonsBox').attr('data-carrierid') != undefined && $('#carrierFleetTableBox').length && !$('#user_info_box').length)
        $('#carrierFleetTableBox tbody').prepend(body);

    if ($('#user_info_box.one_part_box').attr('data-userid') != undefined && $('#user_info_box').length)
        $('#user_info_box.one_part_box tbody').prepend(body);
}

function add_fleet_comment(feetId = 0, userId = 0) {
    var head = `Add Support Comment`;
    var content = `<label>Add Comment:</label><br>
    <textarea placeholder="Comment here" id="support_comment" style="height: 300px;resize: none;"></textarea>`;
    showModal(head, content, '', '', {footerButtons: '<button class="btn btn-default" onclick="save_fleet_comment(this, ' + feetId + ',' + userId + ')">Save</button>'});
}

function deleteEldVin(el, event = false) {
    if (event)
        event.stopPropagation();
    var equipmentId = $(el).parents('tr').attr('data-equipmentid');
    AjaxController('deleteEldEquipmentVin',
            {equipmentId},
            adminUrl,
            () =>
    {
        $(el).closest('.modal').find('.pagin_per_page').change()
    },
            errorBasicHandler,
            true
            );
}

function findFleetUsersByNamePaymentHandler(response) {
    $('.manager_payment_box_users').empty().closest('.form-group').addClass('open');
    $.each(response.data, function(key, user){
        $('.manager_payment_box_users').append(`<li><a onclick="selectPaymentUser(this);" data-id="${user.id}" data-name="${user.name}" data-last="${user.last}" data-email="${user.email}" href="#">(${user.email}) ${user.name} ${user.last}</a></li>`);
    });
    if (response.data.length == 0) {
        $('.manager_payment_box_users').append(`<li><a href="#">No users</a></li>`);
    }
}
function selectPaymentUser(el){
    $('#manager_payment_box_name').val($(el).attr('data-name'));
    $('#manager_payment_box_last').val($(el).attr('data-last'));
    $('#manager_payment_box_user').attr('data-id', $(el).attr('data-id')).val(`(${$(el).attr('data-email')}) ${$(el).attr('data-name')} ${$(el).attr('data-last')}`);
    $('#payForClientForm input[name="userId"]').val($(el).attr('data-id'));
}
function checkManagerPaymentUser(el, carrierId) {
    AjaxController('findFleetUsersByName', {name: $(el).val(), fleetId: carrierId, onlyAdmin: true}, adminUrl, 'findFleetUsersByNamePaymentHandler', errorBasicHandler, true);
}
function payForClientPopup(due, userId = false, name = false, last = false, carrierId = false, email = false) {
    if (due < 0) {
        due = 0
    }
    $('#payment_box').closest('.buy_now_box').remove();
    var head = `Pay for Client`;
    var blockUsers = '';
    if (carrierId !== false) {
        blockUsers = `<div class="form-group relative" id="manager_payment_box">
            <label for="manager_payment_box_user">Select User *</label>
            <input type="text" class="form-control" placeholder="Client name or email" id="manager_payment_box_user" onclick="resetError($('#manager_payment_box_user'));" onkeyup="checkManagerPaymentUser(this, ${carrierId})" onfocus="checkManagerPaymentUser(this, ${carrierId})" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"/>
            <ul class="dropdown-menu life-search-dropdown manager_payment_box_users"></ul>
        </div>`;
    } else if(userId !== false) {
        blockUsers = `<input name="userId" type="hidden" id="manager_payment_box_user" data-id="${userId}" value="${userId}">`;
    }
    var content = `<form id="payForClientForm">
        ${blockUsers}
        <div class="form-group">
            <label for="manager_payment_box_name">Payer First Name</label>
            <input type="text" name="name" class="form-control" placeholder="Payer First Name" id="manager_payment_box_name"/>
        </div>
        <div class="form-group">
            <label for="manager_payment_box_last">Payer Last Name</label>
            <input type="text" name="last" class="form-control" placeholder="Payer Last Name" id="manager_payment_box_last"/>
        </div>
        <div class="form-group">
            <label for="manager_payment_box_amount">Payment Amount *</label>
            <input type="text" name="amount" class="form-control" placeholder="Payment Amount" id="manager_payment_box_amount" value="${due}"/>
        </div>
        <div class="form-group">
            <small class="text-muted">* &ndash; required fields</small>
        </div>
        <input type="hidden" name="userId" value="${(userId !== false ? userId : 0)}">
        <input type="hidden" name="carrierId" value="${(carrierId !== false ? carrierId : 0)}">
    </form>`;
    var footerButtons = `<button type="button" class="btn btn-default" onclick="generatePaymentLinkAndSendByEmail(this)">Send By Email</button>`;
    footerButtons += `<button type="button" class="btn btn-default" onclick="payForAuthorizeClient(this)">Generate Invoice</button>`;
    showModal(head, content,'payForClientModal','',{footerButtons:footerButtons});
    //If Solo Driver
    if (userId !== false) {
        $('#manager_payment_box_name').val(name);
        $('#manager_payment_box_last').val(last);
    }
}
function generatePaymentLinkAndSendByEmail(el) {
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

    finances.generateInvoiceId(function (result) {
        var data = {};
        $.each($('#payForClientForm').serializeArray(), function(i, field) {
            data[field.name] = field.value;
        });
        data.invoiceId = result.data.invoiceId;
        AjaxController('generatePaymentLinkAndSendByEmail', data, financesUrl, 'generatePaymentLinkAndSendByEmailHandler', errorBasicHandler, true);
    });
}

function generatePaymentLinkAndSendByEmailHandler(response) {
    if(typeof response == 'undefined' || typeof response.data.modalShow == 'undefined') {
        return 0;
    }

    var data = response.data.modalShow;
    if(typeof data.title !== 'undefined' && typeof data.message !== 'undefined') {
        showModal(data.title, data.message, 'generatePaymentLinkAndSendByEmailResponseModal');
        $('#payForClientModal').modal('hide');
        $('#payForClientModal').remove();
    }
}

function cancelLateFee(obj) {
    showModal('Waive late fee', '<p class="text-center">Are you sure you want to waive late fee?</p>', 'basicModal');
    $('#basicModal .modal-footer').prepend('<button type="button" onclick="cancelLateFeeAction('+ $(obj).data('user_id') +', '+ $(obj).data('fleet_id') +')" class="btn btn-primary">Confirm</button>');
}
function cancelLateFeeAction(userId, carrierId) {
    $('#basicModal').remove();
    AjaxController('cancelLateFee', {'userId':userId, 'carrierId':carrierId}, adminUrl, 'resultLateFeeAction', errorBasicHandler,true);
}
function resultLateFeeAction(response) {
    if(response.data !== false && typeof response.data.currentDue !== 'undefined') {
        $('.man_usr_dev, .car_dues').click();
        if(response.data.isSoloDriver == false) {
			new managerCarrierCard(response.data.carrierId)
        } else {
			new managerUserCard(response.data.userId)
        }
    }
}
function showSetAllDevicesVersionPopap(fleetId) {
    var body = `<div class="form-horizontal ">
        <div class="form-group ">
            <div class="col-sm-12">
                <label for="set_version_input">Update version</label>
                <input type="number" id="set_version_input" class="form-control" min="1"/>
            </div>
        </div>
    </div>`;
    showModal('Set all devices Version', body, 'set_version', '', {footerButtons: `<button class="btn btn-default" onclick="setAllDevicesVersionCofnirm(${fleetId});">Update</button>`});
}
function managerModalAddCreditCard(params) {
    var blockUsers = '';
    if(typeof params.carrierId !== 'undefined' && params.carrierId) {
        blockUsers = `<div class="form-group relative" id="manager_payment_box">
            <label for="manager_payment_box_user">Select User *</label>
            <input type="text" class="form-control" placeholder="Client name or email" id="manager_payment_box_user" onclick="resetError($('#manager_payment_box_user'));" onkeyup="checkManagerPaymentUser(this, ${params.carrierId})" onfocus="checkManagerPaymentUser(this, ${params.carrierId})" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"/>
            <ul class="dropdown-menu life-search-dropdown manager_payment_box_users"></ul>
        </div>`;
    } else if (typeof params.userId !== 'undefined' && params.userId) {
        blockUsers = `<input type="hidden" id="manager_payment_box_user" data-id="${params.userId}" value="${params.userId}">`;
    }
    var content = `<form id="authorizeAddCardForm">
        ${blockUsers}
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

    var footerButtons = '<button class="btn btn-default" onclick="managerCreateCard()" type="submit">Create</button>';
    if(DEV_ENV) {
        footerButtons += '<button type="button" class="btn btn-primary" onclick="finances.autocomleteTestPaymentAutorizenet()">Autocomplete</button>';
    }
    showModal('Add card', content, 'authorizeAddCardModal', '', {footerButtons: footerButtons});
}
function managerCreateCard() {
    resetError();
    var $creditCardNumber = $('#creditCardNumber'),
        $cvv = $('#cvv'),
        $expiryDateYY = $('#expiryDateYY'),
        $expiryDateMM = $('#expiryDateMM');

    if(!$('#manager_payment_box_user').data('id') || $('#manager_payment_box_user').data('id') == 0 || !$('#manager_payment_box_user').val())
        setError($('#manager_payment_box_user'), 'Please select user');

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

    var footerButtons = '<button class="btn btn-default" onclick="managerCreateCardConfirmed()" type="submit">Create</button>';
    showModal('Add card', '<p class="text-center">Are you sure you want to make '+ primaryCard +' credit card?</p>', 'authorizeAddCardConfirmModal', '', {footerButtons: footerButtons});
}
managerCreateCardConfirmed = function () {
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
    data.userId = $('#manager_payment_box_user').attr('data-id');
    AjaxController('addCreditCard', data, financesUrl, refreshCreditCardsData, authorizeAddCardFormErrorHandler, true);
};
function authorizeAddCardFormErrorHandler(response) {
    resetError();
    $('#authorizeAddCardForm').append('<span class="error-handler response-message">'+response.message+'</span>');
}

//Buttons click actions
function setAllDevicesVersionCofnirmHandler(response) {
    var fleetId = response.data.fleetId;
    $('#set_version .close').click();
    new managerCarrierCard(fleetId);
}
function setAllDevicesVersionCofnirm(fleetId) {
    AjaxController('setAllDevicesVersionByFleetId', {fleetId: fleetId, version: $('#set_version_input').val()}, apiAdminUrl, 'setAllDevicesVersionCofnirmHandler', setAllDevicesVersionCofnirmHandler, true);
}
function setManageCreditCardDefault(customer_profile_id, customer_payment_profile_id) {
    var payment_data = ssl_b64_encrypt(JSON.stringify({customer_profile_id: customer_profile_id, customer_payment_profile_id: customer_payment_profile_id}));
    AjaxController('setDefaultCard', {payment_data: payment_data}, financesUrl, refreshCreditCardsData, showModalError, true);
}
function managerCreditCardRemove(customer_profile_id, customer_payment_profile_id) {
    var payment_data = ssl_b64_encrypt(JSON.stringify({customer_profile_id: customer_profile_id, customer_payment_profile_id: customer_payment_profile_id}));
    AjaxController('removeCard', {payment_data: payment_data}, financesUrl, refreshCreditCardsData, showModalError, true);
}
function showModalError(response) {
    $('.btn-lock-double-clicks').prop('disabled', false);
    showModal('Message', '<p class="text-center my-4">' + response.message + '</p>');
}
function refreshCreditCardsData(response) {
    $('#authorizeAddCardModal, #authorizeAddCardConfirmModal').modal('hide').remove();
    $('.user_credit_cards, .car_credit_cards').click();
}