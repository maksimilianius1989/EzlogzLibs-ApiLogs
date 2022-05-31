function managerResellerCard(resellerId, params = {}) {
    var self = this;
    //changable part
    self.cntrlUrl = '/db/api/apiResellerController.php';
    self.resellerId = resellerId;
    self.tableId = 'resellerCard_' + self.resellerId;
    self.modalId = 'modalResellerCard';
    self.modalTitle = 'RESELLER INFO ';
    self.forceSearchParams = [{key: 'resellerId', val: self.resellerId}]
    //some additional init params
    self.returnData = {};

    //not changable part
    self.params = params;
    self.modalElement = '';
    modalCore(self);
    self.paginator = false;
    self.tabs = [];

    self.initRequest = function () {
        AjaxController('getResellers', {resellerId: self.resellerId}, self.cntrlUrl, self.init, self.init, true);
    }
    self.init = function (response) {
        c(response);
        //retrieving init response
        self.reseller = response.data.resellers[0];

        //always call
        self.generateHeaders();
        self.generateButtons();
        self.createModal();

        //additional clicks
        self.modalElement.find('.someButton').click(self.someButtonClick);
    }
    self.getResellerOfficeAddressFromObj = function(reseller) {
    var addr = '';
    if (reseller.office_address != '') {
        addr += reseller.office_address;
    }
    if (reseller.office_city != '') {
        addr = addr == '' ? addr : addr + ', ';
        addr += reseller.office_city;
    }
    if (reseller.office_state != '') {
        addr = addr == '' ? addr : addr + ', ';
        addr += locationStatesInd[reseller.office_state].name;
    }
    if (reseller.office_zip != '') {
        addr = addr == '' ? addr : addr + ', ';
        addr += reseller.office_zip;
    }
    return addr;
}
    self.getResellerStoreAddressFromObj = function (reseller) {
    var addr = '';
    if (reseller.store_address != '') {
        addr += reseller.store_address;
    }
    if (reseller.store_city != '') {
        addr = addr == '' ? addr : addr + ', ';
        addr += reseller.store_city;
    }
    if (reseller.store_state != '' && reseller.store_state != 0) {
        addr = addr == '' ? addr : addr + ', ';
        addr += locationStatesInd[reseller.store_state].name;
    }
    if (reseller.store_zip != '') {
        addr = addr == '' ? addr : addr + ', ';
        addr += reseller.store_zip;
    }
    return addr;
}
    self.getOwnerName = function (reseller) {
    var name = '';
    $.each(reseller.employees, function (key, employee) {
        if (employee.type == 2) {
            name = employee.fullName;
            return false;
        }
        });
    return name;
}
    self.generateHeaders = function () {
        var headers = [];
                        
        var options = jQuery.parseJSON(self.reseller.options);

        headers.push({label: 'Store Number', value: self.reseller.id});
        headers.push({label: 'Beneficiary', value: self.reseller.reseller_beneficiary});

        headers.push({label: 'Name', value: self.reseller.store_name});
        headers.push({label: 'Name of Bank', value: self.reseller.reseller_name_of_bank});

        headers.push({label: 'Phone', value: self.reseller.phone});
        headers.push({label: 'Bank address', value: self.reseller.reseller_bank_address});
        
        headers.push({label: 'Owner Name', value: self.getOwnerName(self.reseller)});
        headers.push({label: 'Bank phone number', value: self.reseller.reseller_bank_phone});
        
        headers.push({label: 'Office Address', value: self.getResellerOfficeAddressFromObj(self.reseller)});
        headers.push({label: 'Routing number', value: self.reseller.reseller_routing_number});
        
        headers.push({label: 'Store Address', value: self.getResellerStoreAddressFromObj(self.reseller)});
        headers.push({label: 'Account number', value: self.reseller.reseller_account_number});
        
        headers.push({label: 'Show All Tickets', value: `<div class="check_buttons_block">
                                                            <button class="btn btn-default ${options.showAllTickets == 1 ? 'active' : ''}" onclick="doActive(this);resC.setShowAllTicketsOption(${self.reseller.id}, this)" data-val="1">On</button>
                                                            <button class="btn btn-default ${options.showAllTickets == 0 ? 'active' : ''}" onclick="doActive(this);resC.setShowAllTicketsOption(${self.reseller.id}, this)" data-val="0">Off</button>
                                                        </div>`});
        headers.push({label: 'Banned', value: `<button class="btn btn-default" data-status="${self.reseller.banned == 0 ? '1' : '0'}" onclick="resC.setBanned(${self.reseller.id},this);">${self.reseller.banned == 0 ? 'Block' : 'Unblock'}</button>`});

        self.setCardHeaders(headers)
    }
    self.generateButtons = function () {
        var buttons = [];
        buttons.push(`<button class="btn btn-default" onclick="resC.editResellerBox(${self.reseller.id});">Edit</button>`);
        self.setCardActionsButtons(buttons);

        self.tabs.push({
            label: 'Employees',
            cl: 'employees',
            request: 'getManagerResellerCardEmployeesPagination',
            handler: 'getManagerResellerCardEmployeesPaginationHandler',
            tableHeader: `<tr>
                <th>ID</th>
                        <th>Name</th>
						<th>Phone</th>
                        <th>Email</th>
						<th>Type</th>
						<th>Active</th>
				</tr>`
            });
        
        self.tabs.push({
            label: 'Fleets',
            cl: 'fleets',
            request: 'getrResellerFleetListPagination',
            handler: 'getrResellerFleetListPaginationHandler',
            tableHeader: `<tr>
                <th>ID</th>
                <th>Name</th>
                <th>USDOT</th>
                <th>City</th>
                <th>State</th>
                <th>Zip</th>
                <th>Devices</th>
                <th>Balance</th>
                <th>Active</th>
            </tr>`
        });
        
        self.tabs.push({
            label: 'Solo ELD/AOBRD',
            cl: 'soloEld',
            request: 'getResellerSoloEldPagination',
            handler: 'getResellerSoloEldPaginationHandler',
            tableHeader: `<tr>
                <th>ID</th>
                <th>Name</th>
                <th>Last Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>CARRIER</th>
                <th>Balance</th>
            </tr>`
        });
        
        self.setCardTabs(self.tabs);
    }

    self.getManagerResellerCardEmployeesPaginationHandler = function (response) {
        c('getManagerResellerCardEmployeesPaginationHandler');
        c(response);
        var tbody = '';
        response.data.result.forEach((item) => {
            tbody += '<tr>\n\
                <td>' + item.id + '</td>\n\
                <td>' + item.fullName + '</td>\n\
                <td>' + item.phone + '</td>\n\
                <td>' + item.email + '</td>\n\
                <td>' + resC.getEmployeeTypeFromTypeId(item.type) + '</td>\n\
                <td>' + resC.getActiveTypeFromActiveId(item.active) + '</td>\n\
            </tr>';
        });
        self.modalElement.find('#' + self.tableId).find('tbody').html(tbody);
    }
    
    self.getrResellerFleetListPaginationHandler = function(response) {
        c('getrResellerFleetListPaginationHandler');
        c(response);
        var tbody = '';
        response.data.result.forEach((item) => {
            var balanceColor = getBalanceColorFromDue(item.currentDue);
            var recurring = (item.recAmount !== null ? '<span title="monthly +' + item.recAmount + '$ till ' + convertDateToUSA(item.recurringTill, false, false) + '">(+$' + item.recAmount + 'p/m)</span>' : '');
            var balance = (item.currentDue !== null ? '<span class="' + balanceColor + '">' + moneyFormat(item.currentDue * -1) : '') + '</span>' + recurring;
            tbody += '<tr data-carrid = "' + item.id + '" onclick="actionGlobalgetOneCarrierInfo(this, event)">\n\
                        <td>' + (item.id !== null ? item.id : '') + '</td>\n\
                        <td class="copyTooltip bold" >' + (item.name !== null ? item.name.trunc(25) : '') + '</td>\n\
                        <td class="copyTooltip">' + (item.usdot !== null ? item.usdot : '') + '</td>\n\
                        <td>' + (item.city !== null ? item.city.trunc(25) : '') + '</td>\n\
                        <td>' + (item.state !== null ? item.state : '') + '</td>\n\
                        <td>' + (item.zip !== null ? item.zip : '') + '</td>\n\
                        <td>' + (item.devices !== null ? item.devices : '') + '</td>\n\
                        <td class="copyTooltip currentDue">' + balance + '</span></td>\n\
                        <td>' + (item.deactivated === 1 ? 'Deactivated' : 'Active') + '</td>\n\
                    </tr>';
        });
        self.modalElement.find('#' + self.tableId).find('tbody').html(tbody);
    }
    
    self.getResellerSoloEldPaginationHandler = function(response) {
        c('getResellerSoloEldPaginationHandler');
        c(response);
        var tbody = '';
        response.data.result.forEach((item) => {
            var recurring = (item.recAmount !== null ? '<span title="monthly +' + item.recAmount + '$ till ' + convertDateToUSA(item.recurringTill, false, false) + '">(+$' + item.recAmount + 'p/m)</span>' : '');
            var balanceColor = getBalanceColorFromDue(item.currentDue);
            tbody += '<tr data-userid = "'+item.id+'" onclick="getOneUserInfo(this, event);">\n\
                        <td>'+(item.id !== null ? item.id : '')+'</td>\n\
                        <td class="copyTooltip">'+(item.name !== null ? item.name.trunc(25) : '')+'</td>\n\
                        <td class="copyTooltip">'+(item.last !== null ? item.last.trunc(25) : '')+'</td>\n\
                        <td class="copyTooltip">'+(item.phone !== null ? item.phone : '')+'</td>\n\
                        <td class="copyTooltip">'+(item.email !== null ? item.email.trunc(25) : '')+'</td>\n\
                        <td class="copyTooltip">'+(item.carName !== null ? '<span class="global_carrier_info" title="Carrier Info" data-carrid="'+item.carrierId+'" onclick="actionGlobalgetOneCarrierInfo(this, event);" style="cursor: pointer;">'+item.carName.trunc(25)+'</span>' : '')+'</td>\n\
                        <td class="copyTooltip currentDue"><span class="' + balanceColor + '">'+(item.currentDue !== null ? moneyFormat(item.currentDue * -1) : '')+'</span>'+recurring+'</td>\n\
                    </tr>';
        });
        self.modalElement.find('#' + self.tableId).find('tbody').html(tbody);
    }
    
    self.someButtonClick = function () {
        //do something on click
        AjaxController('someButtonClickRequest', {data: [data]}, dashUrl, self.someButtonClickRequestHandler, self.someButtonClickRequestErrorHandler, true);
}
    self.someButtonClickRequestHandler = function () {

    }
    self.someButtonClickRequestErrorHandler = function () {

    }
    self.initRequest();
}