function settingsControllerClass() {
    var self = this;
    this.ordersAddressesPagination = '';

    /**
     * Pagination Init
     */
    this.paginationInit = function () {
        self.ordersAddressesPagination = new simplePaginator({
            tableId: 'addressOrdersTable',
            request: 'getAddressesOrders',
            requestUrl: apiDashUrl,
            handler: self.getAddressOrdersPaginationHandler,
            perPageList: [25, 50, 100],
            defaultPerPage: 50
        });
    };

    this.getAddressOrdersPaginationHandler = function(response, tableId) {
        var tableBody = $('#'+tableId).find('tbody');
        tableBody.empty();
        $.each(response.data.result, function(key, rowData){
            var listOfButtons = [];
            listOfButtons.push(`<button type="button" onclick="settingsController.btnEditAddressOrders(${rowData.id})">Edit</button>`);
            listOfButtons.push(`<button type="button" onclick="settingsController.btnDeleteConfirmationAddressOrders(${rowData.id})">Delete</button>`);
            var addressName = [];
            rowData.address ? addressName.push(rowData.address) : '';
            rowData.address1 != null ? addressName.push('Apt ' + rowData.address1) : '';
            rowData.city ? addressName.push(rowData.city) : '';
            rowData.stateName ? addressName.push(rowData.stateName) : '';
            rowData.zip ? addressName.push(rowData.zip) : '';
            tableBody.append(`<tr>
                <td>${addressName.length ? addressName.join(', ') : ''}</td>
                <td>${addTableActionRow(listOfButtons, 120)}</td>
        </tr>`);
        });
    };

    this.btnAddAddressOrders = function() {
        var content = `<form id="addAddressOrdersForm">
            <div class="form-group form-group-sm mb-2">
                <label for="address">Address</label>
                <div class="row">
                    <div class="col-xs-8">
                        <input name="address" id="address" class="form-control" type="text" title="Primary address line" placeholder="Primary address line">
                    </div>
                    <div class="col-xs-4">
                        <input name="address1" id="address1" class="form-control" type="text" title="Suite or apartment number only" placeholder="Apt Number">
                    </div>
                </div>
            </div>
            <div class="form-group form-group-sm mb-2">
                <label for="city">City</label>
                <input name="city" value="" id="city" class="form-control" type="text">
            </div>
            <div class="form-group form-group-sm mb-2">
                <label for="state">State</label>
                <select name="state" id="state" class="form-control">
                    <option value="0">STATE/PROVINCE</option>
                </select>
            </div>
            <div class="form-group form-group-sm mb-2">
                <label for="zip">Zip Code</label>
                <input id="zip" name="zip" class="form-control" type="text" maxlength="7">
            </div>
        </form>`;

        var footerButtons = '<button class="btn btn-default" onclick="settingsController.addAddressOrders()" type="submit">Save</button>';
        showModal('Add Address for Order', content, 'addAddressOrdersModal', '', {footerButtons: footerButtons});
        //Append State List
        $.each(locationState.getStates(), function(key, state){
            $('#state').append('<option value="'+state.id+'" data-short="'+state.short+'">'+state.name+'</option>');
        });
    };

    this.addAddressOrders = function(id) {
        resetError($('#addAddressOrdersForm'));
        var form = $('#addAddressOrdersForm').serializeObject();

        if(!$.trim(form.address))
            setError($('#address'), 'Enter delivery address');
        else if (!/^[0-9a-zA-Z_.()/-/ ]*$/.test(form.address))
            setError($('#address'), 'Enter only Latin letters');
        else if(form.address > 100)
            setError($('#address'), 'Max allowed 100 characters');

        if(form.address1) {
            if (!$.trim(form.address1))
                setError($('#address1'), 'Enter delivery apt. number');
            else if (!/^[0-9a-zA-Z_.()/-/ ]*$/.test(form.address1))
                setError($('#address1'), 'Enter only Latin letters');
            else if (form.address1.length > 100)
                setError($('#address1'), 'Max allowed 100 characters');
        }

        if(!$.trim(form.state) || form.state == 0)
            setError($('#state'), 'Select state');

        if(!$.trim(form.city))
            setError($('#city'), 'Enter City');
        else if(!/^[a-zA-Z_/-/ ]*$/.test(form.city))
            setError($('#city'), 'Enter only Latin letters');
        else if (form.city.length > 64)
            setError($('#city'), 'Max allowed 64 characters');

        if(!$.trim(form.state) || form.state == 0)
            setError($('#reg_state'), 'Chose state');

        if(!validate.zip(form.zip))
            setError($('#zip'), 'Enter Zip code');

        if($('#addAddressOrdersForm .error').length) {
            return false;
        }

        AjaxCall({url: apiDashUrl, action: 'addAddressOrders', data: form, successHandler: self.addressOrdersHandler, errorHandler: self.addAddressOrdersErrorHandler});
    };

    this.addressOrdersHandler = function (response) {
        $('#addAddressOrdersModal, #deleteConfirmationAddressOrdersModal').modal('hide');
        if(self.ordersAddressesPagination !== '') {
            self.ordersAddressesPagination.request();
        }
    };

    this.btnEditAddressOrders = function(id) {
        AjaxCall({url: apiDashUrl, action: 'getAddressOrders', data: {id:id}, successHandler: self.editAddressOrders, errorHandler: self.addAddressOrdersErrorHandler});
    };

    this.editAddressOrders = function(response) {
        self.btnAddAddressOrders();
        $('#address').val(response.data.address);
        $('#address1').val(response.data.address1);
        $('#city').val(response.data.city);
        $('#state').val(response.data.state);
        $('#zip').val(response.data.zip);
        $('<input>').attr({type: 'hidden', name: 'id'}).val(response.data.id).appendTo('#addAddressOrdersForm');
    };

    this.btnDeleteConfirmationAddressOrders = function(id) {
        var footerButtons = '<button class="btn btn-default" onclick="settingsController.btnDeleteAddressOrders('+ id +')" type="submit">Delete</button>';
        showModal('Confirm delete address', '<p class="text-center">Are you sure you want to delete the address?</p>', 'deleteConfirmationAddressOrdersModal', '', {footerButtons: footerButtons});
    };

    this.btnDeleteAddressOrders = function(id) {
        AjaxCall({url: apiDashUrl, action: 'deleteAddressOrders', data: {id:id}, successHandler: self.addressOrdersHandler, errorHandler: self.addAddressOrdersErrorHandler});
    };

    this.addAddressOrdersErrorHandler = function(response) {
        resetError();
        $('#addAddressOrdersForm').append('<span class="error-handler response-message">'+response.message+'</span>');
    };
}

if (typeof settingsController === 'undefined') {
    var settingsController = new settingsControllerClass();
}