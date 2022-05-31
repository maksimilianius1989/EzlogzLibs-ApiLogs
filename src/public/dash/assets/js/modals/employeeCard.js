function EmployeeCard(userId, params = {}) {
    var self = this;
    //changable part
    self.cntrlUrl = apiAdminUrl;
    self.userId = userId;
    self.tableId = 'employeeCard_' + self.userId;
    self.modalId = 'employee_modal_card';
    self.modalTitle = 'Employee info id '+userId;
    self.forceSearchParams = [{key: 'userId', val: userId}]
    //some additional init params
    self.user = {};
    //not changable part
    self.params = params;
    self.modalElement = '';
    modalCore(self);
    self.paginator = false;
    self.tabs = [];
    self.possibleSuperadminRights = [
        {key:'clearMac', name:'Clear Mac'},
        {key:'deactivate', name:'Deactivate/Activate devices'},
        {key:'balance', name:'Waive fee and change balance'},
        {key:'superwiser', name:'Supervisor(employees block)'},
        {key:'dates', name:'Able to edit order dates'},
        {key:'show_tasks', name:'Show other tasks'},
        {key:'logitAccess', name:'LogIT ELD Access'},
        {key:'firmware', name:'Update firmware for fleet'},
        {key:'peperLogsAccess', name:'Paper Logs Access'},
        {key:'driverErrorEvents', name:'Driver Error Events'},
        {key:'demoClient', name:'Create Demo clients Access'},
        {key:'rcCallsAccess', name:'Receive RC-incoming calls'},
        {key:'price_editing', name:'Price Editing'},
        {key:'driving_correction', name:'Driving Correction'}
    ]
    self.initRequest = function () {
        AjaxCall({action:'getEmployeeCardInit', data:{userId: self.userId}, url:self.cntrlUrl, successHandler:self.init});
    }
    self.init = function (response) {
        //retrieving init response
        self.user = response.data.user;
        self.superadminRights = response.data.superadminRights;
        self.timeZones = response.data.timeZones;
        //always call
        self.generateHeaders();
        self.generateButtons();
        self.createModal();

        //additional actions
        self.modalElement.find('.payBtn').click(self.payBtnClick)
        self.modalElement.find('.fileBtn').click(self.fileBtnClick)
        self.modalElement.find(".datepicker").datepicker({dateFormat: 'mm-dd-yy', maxDate: new Date()});
        self.modalElement.find('input[data-name="phone"]').mask('000 000 0000');
        self.modalElement.find('.modal_card_table .form-control').change(self.changeEmployeeData);
        self.modalElement.find('.modal_card_table .form-control').keyup(self.changeEmployeeData);
        self.modalElement.find('.modal-footer').append('<div class="check_buttons_block modal_switcher" style="width:35%">\
                <button class="btn btn-default" onclick="doActive(this)" data-val="0" style="width: 50%;">Employee Rights</button>\
                <button class="btn btn-default active" onclick="doActive(this)" data-val="1" style="width: 50%;">Employee Info</button>\
        </div>');
        self.modalElement.find('.modal_switcher button').click(self.modalSwitchView)
    }
    self.modalSwitchView = function () {
        if ($(this).attr('data-val') == 0) {
            self.showEmployeeRights();
        } else {
            self.returnToInitState();
        }
    }
    self.returnToInitState = function () {
        self.modalElement.find('.dropDownTabs, .modal-footer .cardPaginator.pg_pagin, .popup_box_body, .control-buttons, .tableTabButtonsBox').show();
        self.modalElement.find('.switch_body').remove();
    }
    self.showEmployeeRights = function(){
        self.modalElement.find('.dropDownTabs, .modal-footer .cardPaginator.pg_pagin, .popup_box_body, .control-buttons, .tableTabButtonsBox').hide();
        self.modalElement.find('.modal-body.popup_box_panel').append('<div class="switch_body">\
            <div class="col-xs-12 text-right control-buttons">\
            </div>\
            <div class="popup_box_body container" style="clear: both;">\n\
            <div class="row">\n\
                <div class="col-lg-12"><h4>Employee Rights</h4></div>\n\
            </div>\n\
            <div class="row">\n\
            </div>\n\
        </div>');
        
        
        $.each(self.possibleSuperadminRights, function(k, right){
            self.modalElement.find('.switch_body .popup_box_body .row').last().append(`<div class="col-sm-6">
                <label style="width:60%">${right.name}</label>
                <div class="check_buttons_block" data-param="${right.key}" style="width: 35%;">
                    <button class="btn btn-default" data-val="1" onclick="doActive(this)">On</button>
                    <button class="btn btn-default active" data-val="0" onclick="doActive(this)">Off</button>
                </div>
            </div>`);
        })
        
        $.each(self.superadminRights, function (key, right) {
            if (key == 'userId')
                return true;
            self.modalElement.find('.switch_body .popup_box_body .check_buttons_block[data-param="' + key + '"] .btn.btn-default').removeClass('active');
            self.modalElement.find('.switch_body .popup_box_body .check_buttons_block[data-param="' + key + '"] .btn.btn-default[data-val="' + right + '"]').addClass('active');
        });
        self.modalElement.find('.switch_body .popup_box_body .check_buttons_block button').click(self.employeeRightChange)
    }
    self.employeeRightChange = function(){
        var param = $(this).closest('.check_buttons_block').attr('data-param');
        var val = $(this).attr('data-val');
        emplC.curEmployee.superadminRights[param] = val;
        self.superadminRights[param] = val;
        AjaxCall({action:'updateEmployeeRights', data:{userId: self.userId, param: param, val: val}, url:self.cntrlUrl, successHandler:self.updateEmployeeRightsHandle})
    }
    self.updateEmployeeRightsHandle = function(response){
        emplC.updateEmployeeHandler({data:response.data.user})
        alertMessage(self.modalElement.find('.modal-body.popup_box_panel .switch_body'), 'Saved', 2000);
    }
    self.generateHeaders = function () {
        var headers = [];
        var salaryTypeOptions = '<option value="0">Hourly rate</option><option value="1">Monthly rate</option>';
        var activeOptions = '<option value="1">Active</option><option value="0">Not Active</option>';
        var tzOptions = '';
        $.each(self.timeZones, function(key, tz){
            tzOptions+='<option value="'+tz.id+'">'+tz.name+'</option>';
        })
        if (self.user.extensionId === null) {
            self.user.extensionId = '';
        }
        headers.push({label: 'Name', value: '<input data-name="name" type="text" value="'+self.user.name+'" class="form-control"/>'});
        headers.push({label: 'Last Name', value:'<input data-name="last" type="text" value="'+self.user.last+'" class="form-control"/>'});
        headers.push({label: 'Email', value: '<input data-name="email" type="text" value="'+self.user.email+'" class="form-control"/>'});
        headers.push({label: 'Real Email', value: '<input data-name="extention" type="text" value="'+self.user.extention+'" class="form-control"/>'});
        headers.push({label: 'Phone', value: '<input data-name="phone" type="text" value="'+self.user.phone+'" class="form-control"/>'});
        headers.push({label: 'Start work', value: '<input data-name="startWork" type="text" value="'+moment(self.user.startWork, 'YYYY-MM-DD').format('MM-DD-YYYY')+'" class="form-control datepicker"/>'});
        headers.push({label: 'Salary Type', value: '<select data-name="salaryType" class="form-control">'+salaryTypeOptions+'</select>'});
        headers.push({label: 'Salary Rate', value: '<input data-name="salary" type="text" value="'+self.user.salary+'" class="form-control"/>'});
        headers.push({label: 'Active', value: '<select data-name="active" class="form-control">'+activeOptions+'</select>'});
        headers.push({label: 'Time Zone', value: '<select data-name="timeZone" class="form-control">'+tzOptions+'</select>'});
        headers.push({label: 'Not Paid Balance', value: '<input data-name="currentNotPaidBalance" type="text" value="'+self.user.currentNotPaidBalance+'" class="form-control"/>'});
        headers.push({label: 'Password', value: '<input type="text" value="'+self.user.unpass+'" class="form-control" disabled/>'});
        headers.push({label: 'RC Extension', value: '<input data-name="extensionId" type="text" value="'+self.user.extensionId+'" max-length="10" class="form-control"/>'});
        self.setCardHeaders(headers)
        self.modalElement.find('.modal_card_table .form-control[data-name="salaryType"] option[value="'+self.user.salaryType+'"]').attr('selected', true);
        self.modalElement.find('.modal_card_table .form-control[data-name="active"] option[value="'+self.user.active+'"]').attr('selected', true);
        self.modalElement.find('.modal_card_table .form-control[data-name="timeZone"] option[value="'+self.user.timeZone+'"]').attr('selected', true);
    }
    self.inputTimeout = null;
    self.changeEmployeeData = function(){
        if(self.user[$(this).attr('data-name')] == $(this).val()){
            return 1;
        }
        self.user[$(this).attr('data-name')] = $(this).val();
        if (self.inputTimeout != null) {
            clearTimeout(self.inputTimeout);
        }
        self.inputTimeout = setTimeout(function () {
            self.inputTimeout = null;
            self.saveChangedData()
        }, 1000)
    }
    self.saveChangedData = function(){
        AjaxCall({action:'updateEmployee', data:self.user, url:self.cntrlUrl, successHandler:self.saveChangedDataHandler});
    }
    self.saveChangedDataHandler = function(response){
        emplC.updateEmployeeHandler({data:response.data.user})
        alertMessage(self.modalElement.find('.control-buttons'), 'Saved', 2000);
    }
    self.generateButtons = function () {
        var buttons = [];
        buttons.push('<button class="btn btn-default payBtn">Add Paid Record</button>');
        buttons.push('<button class="btn btn-default fileBtn">Add File</button>');
        self.setCardActionsButtons(buttons);
        
        self.tabs.push({
            label: 'Payments',
            cl: 'paymentEvents',
            request: 'getEmployeeCardPaymentsEventsPagination',
            handler: 'getEmployeeCardPaymentsEventsPaginationHandler',
            tableHeader: `<tr>
                <th>Date Time</th>
                <th>Amount</th>
                <th>Debt Before</th>
                <th>Debt After</th>
            </tr>`
        });
        
        self.tabs.push({
            label: 'Files',
            cl: 'employeeFiles',
            request: 'getEmployeeFilesPagination',
            handler: 'getEmployeeFilesPaginationHandler',
            tableHeader: `<tr>
                <th>File Name</th>
                <th>Type</th>
                <th>Actions</th>
            </tr>`
        });
        self.setCardTabs(self.tabs);
    }
    self.getEmployeeFilesPaginationHandler = function(response){
        var tbody = '';
        response.data.result.forEach((item) => {
            item.docType = item.docType == 'null' ? 'Unknown' : item.docType;
            tbody += `<tr>
                <td>${item.fileName}</td>
                <td>${item.docType}</td>
                <td><a class="btn btn-default payBtn" href="${MAIN_LINK}/dash/view${item.filePath}" download>Download</a></td>
            </tr>`;
        });
        self.modalElement.find('#' + self.tableId).find('tbody').html(tbody);
    }
    self.getEmployeeCardPaymentsEventsPaginationHandler = function(response){
        var tbody = '';
        response.data.result.forEach((item) => {
            tbody += `<tr>
                <td>${moment(item.dateTime, 'YYYY-MM-DD').format('MM-DD-YYYY')}</td>
                <td>$${item.paymentAmount}</td>
                <td>$${item.balanceBefore}</td>
                <td>$${item.balanceAfter}</td>
            </tr>`;
        });
        self.modalElement.find('#' + self.tableId).find('tbody').html(tbody);
    }
    self.getBlankModalPaginationHandler = function (response) {
        var tbody = '';
        response.data.result.forEach((item) => {
            tbody += '<tr>\n\
                <td>' + item.statusName + '</td>\n\
                <td>' + item.userName + '</td>\n\
                <td>' + timeFromSecToUSAString(item.dateTime) + '</td>\n\
            </tr>';
        });
        self.modalElement.find('#' + self.tableId).find('tbody').html(tbody);
    }
    self.payBtnClick = function(){
        var content = `<form id="payEmployee">
            <div class="form-group">
                <label for="return_description">Amount</label>
                <input type="number" min="1" step="1" class="form-control" onkeypress="return event.charCode >= 48 && event.charCode <= 57" id="paymentAmount" placeholder="999"/>
            </div>
            <div class="form-group">
                <label for="return_description">Date</label>
                <input type="text" id="paymentDate" class="form-control datepicker"/>
            </div>
         </form>`;
        var btn = `<button type="button" class="btn btn-default payConfirmButton" onclick="">Add Record</button>`;
        showModal('Employee Paid Record', content, 'payEmployeeModal', '', {footerButtons:btn});
        $('#payEmployeeModal').find(".datepicker").datepicker({dateFormat: 'mm-dd-yy', maxDate: new Date()});
        $('#payEmployeeModal .payConfirmButton').click(self.payConfirmButtonClick)
    }
    self.fileBtnClick = function(){
        var content = `<style>
            .fileinput-exists .fileinput-new, .fileinput-new .fileinput-exists {
                display: none;
            }
            .btn-file>input {
                position: absolute;
                top: 0;
                right: 0;
                margin: 0;
                opacity: 0;
                filter: alpha(opacity=0);
                font-size: 23px;
                height: 100%;
                width: 100%;
                direction: ltr;
                cursor: pointer;
                border-radius: 0px;
            }
            .btn-file {
                overflow: hidden;
                position: relative;
                vertical-align: middle;
            }
        </style><form id="fileEmployee">
            <div class="form-group">
                <label for="return_description">Document Type</label>
                <input type="text" class="form-control" id="docType" placeholder="Passport/Contract"/>
            </div>
            <div class="form-group">
                <label for="return_description">Add File</label>
                <div class="fileinput fileinput-new input-group" data-provides="fileinput">
                <div class="form-control hide " data-trigger="fileinput">
                    <i class="glyphicon glyphicon-file fileinput-exists"></i>
                    <span class="fileinput-filename"></span>
                </div>
                <div class="fileinput-preview thumbnail" data-target="emplFile" data-trigger="fileinput" style="width: 100%;"></div>
                <div>
                    <span class="btn btn-info btn-file">
                        <span class="fileinput-new">Select image</span>
                        <span class="fileinput-exists">Change</span>
                        <input type="file" class="emplFile" name="emplFile">
                    </span>
                    <a href="#" class="btn btn-info fileinput-exists" data-dismiss="fileinput">Remove</a>
                </div></div>
            </div>
         </form>`;
        var btn = `<button type="button" class="btn btn-default saveFileButton" >Add File</button>`;
        showModal('Employee File', content, 'fileEmployeeModal', '', {footerButtons:btn});
        $('#fileEmployeeModal .saveFileButton').click(self.saveFileButtonClick)
       /* $('.' + fileClass).on('change.bs.fileinput', function (event) {
            blocksConstructorCntrl.updateParam(this, param, key)
        });*/
    }
    self.payConfirmButtonClick = function(){
        $('#payEmployeeModal .payConfirmButton').prop('disabled', true);
        var userId = self.userId;
        var amount = toFixedFloat($('#payEmployeeModal #paymentAmount').val(), 2) || 0;
        var date = moment($('#payEmployeeModal #paymentDate').val(), 'MM-DD-YYYY').format('YYYY-MM-DD');
        if (amount <= 0 || userId <= 0) {
            alertError($('#payEmployeeModal .modal-body'), 'Cant add payment', 2000);
            $('#payEmployeeModal .saveFileButton').prop('disabled', false);
            return 1;
        }
        AjaxCall({action:'payEmployee', data:{userId: userId, amount: amount, date: date}, url:self.cntrlUrl, successHandler:self.payEmployeeHandler});
    }
    self.payEmployeeHandler = function(response){
        emplC.updateEmployeeHandler({data:response.data.user})
        new EmployeeCard(self.userId)
        $('#payEmployeeModal .close').click()
    }
    self.saveFileButtonClick = function(){
        $('#fileEmployeeModal .saveFileButton').prop('disabled', true);
        var userId = self.userId;
        var docType = $('#fileEmployee #docType').val();
        var bytesArray = $('#fileEmployee .fileinput-preview img').attr('src');
        var fileName = $('#fileEmployee .fileinput-filename').text();
        
        if(bytesArray == 'undefined'){
            alertError($('#fileEmployeeModal .modal-body'), 'Please select File', 2000);
            $('#fileEmployeeModal .saveFileButton').prop('disabled', false);
            return 1;
        }
        if(docType == 'undefined' || docType == ''){
            alertError($('#fileEmployeeModal .modal-body'), 'Please Enter Document Type', 2000);
            $('#fileEmployeeModal .saveFileButton').prop('disabled', false);
            return 1;
        }
        AjaxCall({action:'uploadEmployeeDocument', data:{userId: userId, docType: docType, bytesArray: bytesArray, fileName: fileName}, url:self.cntrlUrl, successHandler:self.uploadEmployeeDocumentHandler});
    }
    self.uploadEmployeeDocumentHandler = function(response){
        emplC.updateEmployeeHandler({data:response.data.user});
        new EmployeeCard(self.userId);
        $('#fileEmployeeModal .close').click();
        $('#fileEmployeeModal .saveFileButton').prop('disabled', false);
    }
    self.initRequest();
}