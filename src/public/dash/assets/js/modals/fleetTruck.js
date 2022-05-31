function fleetTruckCard(truckId) {
    var self = this;
    self.truckId = truckId;
    self.cntrlUrl = apiDashUrl;
    self.modalElement = '';
    self.tableId = 'fleetTruckCard_' + truckId;
    modalCore(self);

    self.modalId = 'fleet_truck_card';
    self.modalTitle = 'TRUCK INFO';
    self.paginator = false;
    self.tabs = [];
    self.forceSearchParams = [{key: 'truckId', val: truckId}]

    self.initRequest = function () {
        AjaxController('getFleetTruckCardInit', {truckId: self.truckId}, self.cntrlUrl, self.init, self.init, true);
    }

    self.init = function (response) {
        c(response);

        if (response.code == '000') {
            self.equipment = response.data.equipment;
            self.reminders = response.data.reminders;
            self.equipmentPermitDocs = response.data.equipmentPermitDocs;

            if (self.equipment.truckTrailer == 1) {
                self.modalTitle = 'TRAILER INFO';
            }

            //always call
            self.generateHeaders();
            self.generateButtons();
            self.createModal();

            if (userRole == 1 || isSoloDriver != 0) {
                self.modalElement.find('.modal-footer').append(`<div class="check_buttons_block modal_switcher">
					<button class="btn btn-default col-sm-4" onclick="doActive(this)" data-val="0" style="width:33.3%;">Edit Truck</button>
                                        <button class="btn btn-default col-sm-4" onclick="doActive(this)" data-val="2" style="width:33.3%;">Reminders</button>
					<button class="btn btn-default col-sm-4 active" onclick="doActive(this)" data-val="1" style="width:33.3%;">Truck Info</button>
				</div>`);
            }
            
            if (position == TYPE_EZLOGZ_MANAGER) {
                self.modalElement.find('.control-buttons').append('<button class="btn btn-default create-malf" data-truckid="' + self.equipment.id + '" onclick="fleetTruckModal_createMalfunctionModal(this);">Create Malfunction</button>');
            }
            
            self.modalElement.find('.modal_switcher button').click(self.modalSwitchView);
        } else {
            showModal('<span style="color:#f44336;">Error</span>', response.message);
        }
    }

    self.modalSwitchView = function () {
        if ($(this).attr('data-val') == 0) {
            c('EditTruck');
            self.showEditTruck();
        } else if ($(this).attr('data-val') == 2) {
            c('TruckReminder');
            self.showTruckTrailerReminder();
        } else {
            c('TruckInfo');
            self.returnToInitState();
        }
    }

    self.showEditTruck = function () {
        self.modalElement.find('.reminder_body').remove();

        self.modalElement.find('.switch_body').remove();
        self.modalElement.find('.save_edit, .update_result').remove();
        var truckTypes = '';
        $.each(self.equipment.truckTypes, function (k, v) {
            truckTypes += `<option value="${v.id}">${v.name}</option>`;
        });

        var stateList = '';
        $.each(self.equipment.stateList, function (k, v) {
            stateList += `<option value="${v.id}">${v.name}</option>`;
        });
        self.modalElement.find('.dropDownTabs, .modal-footer .cardPaginator.pg_pagin, .popup_box_body, .control-buttons, .tableTabButtonsBox').hide();
        self.modalElement.find('.modal-body').append(`<div class="switch_body">
            <div class="info_box">
                <input type="hidden" id="edit_tr_id" class="ez_input"/>
                <h2>General</h2>
                <div class="box_row_info">
                    <label>Unit</label>
                    <input type="text" id="edit_tr_Name" class="ez_input"/>
                </div>
                <div class="box_row_info">
                    <label>Owner</label>
                    <input type="text" id="edit_tr_Owner" class="ez_input"/>
                </div>
                <div class="box_row_info">
                    <label>Year</label>
                    <input type="text" id="edit_tr_Year" class="ez_input"/>
                </div>
                <div class="box_row_info">
                    <label>Type</label>
                    <select id="edit_tr_Type" class="ez_input">
                        ${truckTypes}
                    </select>
                </div>
                <div class="box_row_info">
                    <label>VIN</label>
                    <input type="text" value="" id="edit_tr_VIN" class="ez_input" maxlength="17" onkeydown="upperCaseText(this)"/>
                </div>
                <div class="box_row_info">
                    <label>Plate</label>
                    <input type="text" value="" id="edit_tr_Plate" class="ez_input"/>
                </div>
                <div class="box_row_info">
                    <label>State</label>
                    <select id="edit_tr_State" class="ez_input">
                        <option value=""></option>
                        ${stateList}
                    </select>
                </div>
                <div class="box_row_info" id="straight_row">
                    <label>Straight Truck</label>
                    <div class="check_buttons_block" id="edit_tr_straight">
                            <button type="button" class="btn btn-default active" onclick="doActive(this)" data-val="1">Yes</button>
                            <button type="button" class="btn btn-default" onclick="doActive(this)" data-val="0">No</button>
                    </div>
                </div>
            </div>
            <div class="info_box">
                <h2>Parameters</h2>
                <div class="box_row_info">
                    <label>Tire Size</label>
                    <input type="number" value="" id="edit_tr_TireSize" class="ez_input"/>
                </div>
                <div class="box_row_info">
                    <label>Length</label>
                    <input type="number" value="" id="edit_tr_Length" class="ez_input"/>
                </div>
                <div class="box_row_info">
                    <label>Fuel Type</label>
                    <select id="edit_tr_Fuel" class="ez_input">
                        <option value="Gasoline">Gasoline</option>
                        <option value="Diesel">Diesel</option>
                        <option value="Gasohol">Gasohol</option>
                        <option value="Propane">Propane</option>
                        <option value="LNG">LNG</option>
                        <option value="CNG">CNG</option>
                        <option value="Ethanol">Ethanol</option>
                        <option value="Methanol">Methanol</option>
                        <option value="E-85">E-85</option>
                        <option value="M-85">M-85</option>
                        <option value="A55">A55</option>
                        <option value="Biodiesel">Biodiesel</option>
                    </select>
                </div>
                <div class="box_row_info">
                    <label>Axel</label>
                    <input type="text" value="" id="edit_tr_Axel" class="ez_input"/>
                </div>
                <div class="box_row_info">
                    <label>Make</label>
                    <input type="text" value="" id="edit_tr_Make" class="ez_input"/>
                </div>
                <div class="box_row_info">
                    <label>Model</label>
                    <input type="text" value="" id="edit_tr_Model" class="ez_input"/>
                </div>
                <div class="box_row_info">
                    <label>Gross Weight</label>
                    <input type="number" value="" id="edit_tr_GrossWeight" class="ez_input"/>
                </div>
                <div class="box_row_info">
                    <label>Unland Weight</label>
                    <input type="number" value="" id="edit_tr_UnlandWeight" class="ez_input"/>
                </div>
            </div>
            <div class="info_box">
                <h2>Others</h2>
                <div class="box_row_info">
                    <label>Color</label>
                    <input type="text" value="" id="edit_tr_Color" class="ez_input"/>
                </div>
                <div class="box_row_info">
                    <label>NY Certificate</label>
                    <input type="text" value="" id="edit_tr_NYCert" class="ez_input"/>
                </div>
                <div class="box_row_info">
                    <label>Inspection Due</label>
                    <input type="text" value="" id="edit_tr_InspectionDue" class="datepicker ez_input" placeholder="mm-dd-yyyy"/>
                </div>
                <div class="box_row_info">
                    <label>90 Day Exp</label>
                    <input type="text" value="" id="edit_tr_90DayExp" class="datepicker ez_input" placeholder="mm-dd-yyyy"/>
                </div> 
                <div class="box_row_info">
                    <label>Pro Rate Exp</label>
                    <input type="text" value="" id="edit_tr_ProRateExp" class="datepicker ez_input" placeholder="mm-dd-yyyy"/>
                </div>
                <div class="box_row_info">
                    <label>Exp Date</label>
                    <input type="text" value="" id="edit_tr_ExpDate" class="datepicker ez_input" placeholder="mm-dd-yyyy"/>
                </div>
                <div class="box_row_info">
                    <label>Active</label>
                    <div class="check_buttons_block" id="edit_tr_isActive">
                            <button type="button" class="btn btn-default active" onclick="doActive(this)" data-val="1">On</button>
                            <button type="button" class="btn btn-default" onclick="doActive(this)" data-val="0">Off</button>
                    </div>
                </div>
            </div>
            <div class="info_box">
                <h2>Notes</h2>
                <div class="box_row_info">
                    <textarea id="edit_tr_Notes"></textarea>
                </div>
            </div>
            <div class="info_box">
                <h2>Permit Documents</h2>
                <div class="box_row_info">
                    <label>Permit Document Registration</label>
                    <div class="form-group " data-type="equipmentRegistration">
                        <div class="fileinput fileinput-new input-group" data-provides="fileinput">
                        <div class="form-control hide " data-trigger="fileinput">
                            <i class="glyphicon glyphicon-file fileinput-exists"></i>
                            <span class="fileinput-filename"></span>
                        </div>
                        <div class="fileinput-preview thumbnail" data-target="equipmentRegistration" data-trigger="fileinput" style="display:none !important;"></div>
                        <div>
                            <span class="btn btn-default btn-file">
                                <span class="fileinput-new" >Select document</span>
                                <span class="fileinput-exists">Change</span>
                                <input type="file" accept=".pdf" id="equipmentRegistration" class="equipmentRegistration" name="equipmentRegistration" data-fullName="Registration">
                            </span>
                            <a href="#" class="btn btn-default fileinput-exists" data-dismiss="fileinput">Remove</a>
                        </div></div>
                    </div>
                </div>
                <div class="box_row_info">
                    <label>Permit Document Annual inspection report</label>
                    <div class="form-group " data-type="equipmentAnnualReport">
                        <div class="fileinput fileinput-new input-group" data-provides="fileinput">
                        <div class="form-control hide " data-trigger="fileinput">
                            <i class="glyphicon glyphicon-file fileinput-exists"></i>
                            <span class="fileinput-filename"></span>
                        </div>
                        <div class="fileinput-preview thumbnail" data-target="equipmentAnnualReport" data-trigger="fileinput" style="display:none !important;"></div>
                        <div>
                            <span class="btn btn-default btn-file">
                                <span class="fileinput-new" >Select document</span>
                                <span class="fileinput-exists">Change</span>
                                <input type="file" accept=".pdf" id="equipmentAnnualReport" class="equipmentAnnualReport" name="equipmentAnnualReport" data-fullName="Annual inspection report">
                            </span>
                            <a href="#" class="btn btn-default fileinput-exists" data-dismiss="fileinput">Remove</a>
                        </div></div>
                    </div>
                </div>
            </div>
        </div>`);
        if(!DEV_ENV)$('#equipmentRegistration').closest('.info_box').hide();

        self.modalElement.find('.datepicker').datepicker({dateFormat: 'mm-dd-yy'});

        self.modalElement.find('.switch_body input').each(function () {
            var fname = $(this).attr('id');

            fname = fname.substring(8);

            var val = self.equipment[fname];
            if ($(this).hasClass('datepicker') && val != null) {
                var date2 = new Date(val);
                $(this).datepicker('setDate', date2);
            } else if ($(this).attr('type') == 'checkbox') {
                if (fname == 'isActive') {
                    if (val == 1) {
                        $(this).prop('checked', true);
                    } else {
                        $(this).prop('checked', false);
                    }
                }
            } else {
                if (fname == 'VIN') {
                    if (typeof self.equipment.EldVin === 'undefined') {
                        c('noEldVin');
                        $(this).val(val);
                        $(this).prop('disabled', false);
                    } else {
                        c('EldVin');
                        if (self.equipment['EldVin'] != '') {
                            $(this).val(self.equipment['EldVin']);
                            $(this).prop('disabled', true);
                        } else {
                            $(this).val(val);
                            $(this).prop('disabled', false);
                        }
                    }
                } else {
                    $(this).val(val);
                }
            }
        });

        var is_trailer = self.equipment.truckTrailer == 0 ? 0 : 1;
        if (is_trailer) {
            self.modalElement.find('#straight_row').hide();
            self.modalElement.find('#edit_tr_Type option[value="2"]').hide();
        } else {
            self.modalElement.find('#straight_row').show();
            self.modalElement.find('#edit_tr_Type option[value="2"]').show();
        }
        self.modalElement.find('#edit_tr_Fuel option[value="' + self.equipment['Fuel'] + '"]').attr('selected', true);
        self.modalElement.find('#edit_tr_Type option[value="' + self.equipment['Type'] + '"]').attr('selected', true);
        self.modalElement.find('#edit_tr_State option[value="' + self.equipment['State'] + '"]').attr('selected', true);
        self.modalElement.find('#edit_tr_Notes').val(self.equipment['Notes']);

        self.modalElement.find('#edit_tr_isActive button[data-val="' + self.equipment['isActive'] + '"]').click();
        self.modalElement.find('#edit_tr_straight button[data-val="' + self.equipment['straight'] + '"]').click();

        self.modalElement.find('.modal-footer').append('<label class="update_result"></label><button class="btn btn-default save_edit" onclick="">Save</button>');
        self.modalElement.find('.modal-footer .save_edit').click(self.updateTruck);
        $.each(self.equipmentPermitDocs, function(key, doc){
            self.modalElement.find(`.form-group[data-type=${doc['shortName']}]`).find('.thumbnail').addClass('fileupload-exists').append(`<img src="${doc['url']}">`)
            self.modalElement.find(`.form-group[data-type=${doc['shortName']}]`).find('.thumbnail').parent().removeClass('fileinput-new').addClass('fileinput-exists')
        })
    }

    self.returnToInitState = function () {
        self.modalElement.find('.dropDownTabs, .modal-footer .cardPaginator.pg_pagin, .popup_box_body, .control-buttons, .tableTabButtonsBox').show();
        self.modalElement.find('.switch_body').remove();
        self.modalElement.find('.reminder_body').remove();
        self.modalElement.find('.save_edit, .update_result').remove();
    }

    self.updateTruck = function () {
        var error = 0;
        var data = {};
        self.modalElement.find('.fileinput input[type=hidden]').remove()
        $('#fleet_truck_card .modal-body.popup_box_panel .switch_body input, #fleet_truck_card .modal-body.popup_box_panel .switch_body select').each(function () {
            var fname = $(this).attr('id');
            fname = fname.substring(8);

            if ($(this).attr('type') == 'checkbox') {
                if ($(this).is(':checked')) {
                    data[fname] = $(this).val();
                }
            } else {
                if ($(this).hasClass('datepicker') && $(this).val() != '') {
                    data[fname] = convertDateToSQL($(this).val());
                } else
                    data[fname] = $(this).val();
            }
        });
        data['equipmentPermitDocs'] = [];
        $('#equipmentAnnualReport, #equipmentRegistration').each(function(){
            var src = $(this).closest('.input-group').find('.thumbnail>img').attr('src');
            if(src != undefined){
                data['equipmentPermitDocs'].push({src:src, name:$(this).attr('data-fullName'), shortName:$(this).attr('name')})
            }
        })
        data['isActive'] = self.equipment['isActive'] = self.modalElement.find('#edit_tr_isActive button.active').attr('data-val');
        data['straight'] = self.equipment['straight'] = self.modalElement.find('#edit_tr_straight button.active').attr('data-val');
        data['Notes'] = $('#edit_tr_Notes').val();
        var vinRegex = /^([A-HJ-NPR-Z0-9]){17}$/;
        var truck_VIN = $('#edit_tr_VIN').val();
        if (!vinRegex.test(truck_VIN) && truck_VIN != '' && !$('#edit_tr_VIN').is(':disabled')) {
            error++;
            alertError($('#fleet_truck_card .modal-body.popup_box_panel .switch_body update_result'), 'VIN is incorrect', 3000);
            self.modalElement.find('.update_result').css({'color': '#ff0000'}).text('VIN is incorrect');
        }
        if (error > 0) {
            return false;
        }
        self.modalElement.find('.update_result').html('<img style="height:35px;" src="/dash/assets/img/loading.gif"/>');
//        AjaxController('updateEquip', data, MAIN_LINK + '/db/dashController/', self.updateTruckHandler, self.updateTruckHandler, true);
        AjaxController('updateEquip', data, self.cntrlUrl, self.updateTruckHandler, self.updateTruckHandler, true);
    }

    self.updateTruckHandler = function (response) {
        c('updateTruckHandler');
        c(response);
        if (response.code == '000') {

            var headers = [];

            headers.push({label: 'Vehicle ID', value: response.data.id});
            headers.push({label: response.data.truckTrailer == 1 ? 'Trailer Number' : 'Truck Number', value: getDisplayValue(response.data.Name)});

            headers.push({label: 'VIN', value: typeof response.data.EldVin !== 'undefined' && response.data.EldVin != '' ? getDisplayValue(response.data.EldVin) : getDisplayValue(response.data.VIN)});
            headers.push({label: 'Active Status', value: response.data.isActive == 1 ? 'Active' : 'Deactivated'});
            self.equipmentPermitDocs = response.data.equipmentPermitDocs;
            self.setCardHeaders(headers);
            if (window.location.pathname == '/dash/fleet/equipment/' && equipmentC.getAllTruckTrailerPagination)
                equipmentC.getAllTruckTrailerPagination.request();

            self.modalElement.find('.update_result').css({'color': '#27ae60'}).text('Success Update');
            setTimeout(function () {
                self.modalElement.find('.update_result').empty();
            }, 3000);
        } else {
            self.modalElement.find('.update_result').css({'color': 'red'}).text(response.message);
        }
    }

    self.showTruckTrailerReminder = function () {
        self.modalElement.find('.switch_body').remove();
        self.modalElement.find('.save_edit, .update_result').remove();

        self.modalElement.find('.reminder_body').remove();

        self.modalElement.find('.dropDownTabs, .modal-footer .cardPaginator.pg_pagin, .popup_box_body, .control-buttons, .tableTabButtonsBox').hide();

        self.modalElement.find('.modal-body').append(`<div class="row m-0 reminder_body">
            <div class="col-sm-12 pt-3 text-right">
                <button class="btn btn-default create_reminder">Create Reminder</button>
            </div>
        </div>`);
        
        $.each(self.reminders, function(key, value) {
            self.modalElement.find('.modal-body .reminder_body').append(self.createReminderElemet(value));
            
            self.modalElement.find('.modal-body .reminder_body .reminderElement[data-id="'+value.id+'"] .reminderInfo .header .dropdown .edit').click(self.editReminder);
            self.modalElement.find('.modal-body .reminder_body .reminderElement[data-id="'+value.id+'"] .reminderInfo .header .dropdown .reset').click(self.resetMilesReminder);
            self.modalElement.find('.modal-body .reminder_body .reminderElement[data-id="'+value.id+'"] .reminderInfo .header .dropdown .remove').click(self.removeReminderForTruckOrTrailer);
        });
        
        self.modalElement.find('.modal-body .reminder_body .create_reminder').click(self.addCreateReminderElement);
    }

    self.addCreateReminderElement = function () {
        self.modalElement.find('.modal-body .reminder_body').append(`<div class="col-sm-4 py-3 createReminderElement">
            <div class="reminderInfo">
                <div class="header">What type of reminder do you need?</div>
                <div class="body">
                    <div class="col-sm-12 px-0 py-2"><button class="btn btn-default rem_by_date">Reminder by date</button></div>
                    ${self.equipment.truckTrailer == 0 ? '<div class="col-sm-12 px-0 py-2"><button class="btn btn-default mil_rem">Mile reminder</button></div>' : ''}
                    <div class="col-sm-12 px-0 py-2"><button class="btn btn-default cancel">Cancel</button></div>
                </div>
            </div>
        </div>`);
        
        self.modalElement.find('.modal-body .reminder_body .createReminderElement .rem_by_date').click(self.generateElementReminderByDateForSave);
        self.modalElement.find('.modal-body .reminder_body .createReminderElement .mil_rem').click(self.generateReminderElementByMilesForSave);
        self.modalElement.find('.modal-body .reminder_body .createReminderElement .cancel').click(function () {
            $(this).closest('.createReminderElement').remove();
        });
    }

    self.generateElementReminderByDateForSave = function () {
        var uniqId = self.str_rand();
        $(this).closest('.createReminderElement').replaceWith(`<div class="col-sm-4 py-3 saveReminderElement" data-uniqId="${uniqId}" data-type="0">
            <div class="reminderInfo">
                <div class="header">Reminder by date</div>
                <div class="body">
                    <div class="box_row_info py-2">
                        <label style="display: block;">Reminder name:</label>
                        <input class="ez_input" value="" type="text" name="name" placeholder="Reminder name" style="width:100%;" />
                    </div>
                    <div class="box_row_info py-2">
                        <label style="display: block;">Reminder date:</label>
                        <input class="datepicker ez_input" value=""  type="text" name="date" placeholder="mm-dd-yyyy" style="width:100%;" />
                    </div>
                    <div class="box_row_info py-2">
                        <label style="display: block;">First reminder:</label>
                        <div class="range-field ez_range_field_valuelist" style="width:100%;">
                            <input value="0" type="range" name="term" data-valuelist='[{"v":"1", "l":"All"}, {"v":"2592000", "l":"30day"}, {"v":"1296000", "l":"15day"}, {"v":"86400", "l":"24h"}, {"v":"3600", "l":"1h"}, {"v":"0", "l":"None"}]' />
                        </div>
                    </div>
                    <div class="col-sm-12 px-0"><button class="btn btn-default cancel">Cancel</button> <button class="btn btn-default save">Save</button></div>
                </div>
            </div>
        </div>`);

        self.modalElement.find('.modal-body .reminder_body .saveReminderElement[data-uniqId="'+uniqId+'"] .save').click(self.saveReminderForTruckOrTrailer);

        self.modalElement.find('.modal-body .reminder_body .saveReminderElement .cancel').click(function () {
            $(this).closest('.saveReminderElement').remove();
        });

        self.modalElement.find('.datepicker').datepicker({dateFormat: 'mm-dd-yy'});

        init_range_input('.modal-body .reminder_body .saveReminderElement[data-uniqId="' + uniqId + '"] input[type=range]');
        self.modalElement.find('.modal-body .reminder_body .saveReminderElement[data-uniqId="' + uniqId + '"] input[name=term_range]').val(0);
        self.modalElement.find('.modal-body .reminder_body .saveReminderElement[data-uniqId="' + uniqId + '"] input[name=term]').val(1);
    }
    
    self.generateReminderElementByMilesForSave = function () {
        var uniqId = self.str_rand();
        $(this).closest('.createReminderElement').replaceWith(`<div class="col-sm-4 py-3 saveReminderElement" data-uniqId="${uniqId}" data-type="1">
            <div class="reminderInfo">
                <div class="header">Reminder by miles</div>
                <div class="body">
                    <div class="box_row_info py-2">
                        <label style="display: block;">Reminder name:</label>
                        <input class="ez_input" value="" type="text" name="name" placeholder="Reminder name" style="width:100%;" />
                    </div>
                    <div class="box_row_info py-2">
                        <label style="display: block;">Remind After, miles:</label>
                        <input class="ez_input" value=""  type="number" name="term" placeholder="Miles" style="width:100%;" />
                    </div>
                    <div class="col-sm-12 px-0"><button class="btn btn-default cancel">Cancel</button> <button class="btn btn-default save">Save</button></div>
                </div>
            </div>
        </div>`);

        self.modalElement.find('.modal-body .reminder_body .saveReminderElement[data-uniqId="'+uniqId+'"] .save').click(self.saveReminderForTruckOrTrailer);

        self.modalElement.find('.modal-body .reminder_body .saveReminderElement .cancel').click(function () {
            $(this).closest('.saveReminderElement').remove();
        });
    }

    self.saveReminderForTruckOrTrailer = function () {
        var parentElement = $(this).closest('.saveReminderElement');
        parentElement = $(this).closest('.saveReminderElement[data-uniqId='+parentElement.attr('data-uniqId')+']');

        var data = {};
        data['equipId'] = self.truckId;
        data['uniqId'] = parentElement.attr('data-uniqId');
        data['type'] = parentElement.attr('data-type');
        data['name'] = parentElement.find('input[name="name"]').val();
        data['term'] = parentElement.find('input[name="term"]').val();
        if (parentElement.attr('data-type') == 0) {
            data['date'] = parentElement.find('input[name="date"]').val();
        }
        
        if (data['name'] == '' || data['term'] == '') {
            data['name'] == '' ? parentElement.find('input[name="name"]').addClass('error') : '';
            data['term'] == '' ? parentElement.find('input[name="term"]').addClass('error') : '';
            return false;
        }
        if (data['type'] == 0 && data['date'] == '') {
            data['date'] =='' ? parentElement.find('input[name="date"]').addClass('error') : '';
            return false;
        }
        c(data);

        AjaxController('saveReminderForTruckOrTrailer', data, self.cntrlUrl, self.saveReminderForTruckOrTrailerHandler, self.saveReminderForTruckOrTrailerHandler, true);
    }

    self.saveReminderForTruckOrTrailerHandler = function (response) {
        c(response);
        var result = response.data.result;
        
        self.reminders.push(result);
        
        self.modalElement.find('.modal-body .reminder_body .saveReminderElement[data-uniqId="' + result.uniqId + '"]').replaceWith(self.createReminderElemet(result))
        
        self.modalElement.find('.modal-body .reminder_body .reminderElement[data-id="'+result.id+'"] .reminderInfo .header .dropdown .edit').click(self.editReminder);
        self.modalElement.find('.modal-body .reminder_body .reminderElement[data-id="'+result.id+'"] .reminderInfo .header .dropdown .reset').click(self.resetMilesReminder);
        self.modalElement.find('.modal-body .reminder_body .reminderElement[data-id="'+result.id+'"] .reminderInfo .header .dropdown .remove').click(self.removeReminderForTruckOrTrailer);
    }
    
    self.resetMilesReminder = function () {
        var parentElement = $(this).closest('.reminderElement');
        
        var data = {};
        data['id'] = parentElement.attr('data-id');
        
        AjaxController('resetMilesReminder', data, self.cntrlUrl, self.resetMilesReminderHandler, self.resetMilesReminderHandler, true);
    }
    
    self.resetMilesReminderHandler = function (response) {
        c(response);
        self.modalElement.find('.modal-body .reminder_body .saveReminderElement[data-id="' + response.data.result.id + '"]').replaceWith(self.createReminderElemet(response.data.result));
        
        /*self.modalElement.find('.modal-body .reminder_body .reminderElement[data-id="' + response.data.result.id + '"] .reminderInfo .header .dropdown .edit').click(self.editReminder);
        self.modalElement.find('.modal-body .reminder_body .reminderElement[data-id="' + response.data.result.id + '"] .reminderInfo .header .dropdown .reset').click(self.resetMilesReminder);
        self.modalElement.find('.modal-body .reminder_body .reminderElement[data-id="' + response.data.result.id + '"] .reminderInfo .header .dropdown .remove').click(self.removeReminderForTruckOrTrailer);*/
    }
    
    self.removeReminderForTruckOrTrailer = function () {
        var parentElement = $(this).closest('.reminderElement');
        
        var data = {};
        data['id'] = parentElement.attr('data-id');
        
        AjaxController('removeReminderForTruckOrTrailer', data, self.cntrlUrl, self.removeReminderForTruckOrTrailerHandler, self.removeReminderForTruckOrTrailerHandler, true);
        
        parentElement.remove();
    }
    
    self.removeReminderForTruckOrTrailerHandler = function (response) {
        c(response);
        $.each(self.reminders, function(key, value){
            if (value.id == response.data.result) {
                self.reminders.splice(key, 1);
                return false;
            }
        });
    }
    
    self.editReminder = function () {
        var parentElement = $(this).closest('.reminderElement');
        var reminderId = parentElement.attr('data-id');
        var reminderType = parentElement.attr('data-type');
        
        var reminderInfo;
        
        $.each(self.reminders, function(key, value){
            if (value.id == reminderId) {
                reminderInfo = value;
                c(reminderInfo);
            }
        });
        c('here');
        if (reminderType == '1') {
            parentElement.find('.reminderInfo').replaceWith(`<div class="reminderInfo">
                <div class="header">Update "${reminderInfo.name}"</div>
                <div class="body">
                    <div class="box_row_info py-2">
                        <label style="display: block;">Reminder name:</label>
                        <input class="ez_input" value="${reminderInfo.name}" type="text" name="name" placeholder="Reminder name" style="width:100%;" />
                    </div>
                    <div class="box_row_info py-2">
                        <label style="display: block;">Remind After, miles:</label>
                        <input class="ez_input" value="${reminderInfo.term}"  type="number" name="term" placeholder="Miles" style="width:100%;" />
                    </div>
                    <div class="col-sm-12 px-0"><button class="btn btn-default cancel">Cancel</button> <button class="btn btn-default update">Update</button></div>
                </div>
            </div>`);
        } else {
            parentElement.find('.reminderInfo').replaceWith(`<div class="reminderInfo">
                <div class="header">Update "${reminderInfo.name}"</div>
                <div class="body">
                    <div class="box_row_info py-2">
                        <label style="display: block;">Reminder name:</label>
                        <input class="ez_input" value="${reminderInfo.name}" type="text" name="name" placeholder="Reminder name" style="width:100%;" />
                    </div>
                    <div class="box_row_info py-2">
                        <label style="display: block;">Reminder date:</label>
                        <input class="datepicker ez_input" value="${convertDateToUSA(reminderInfo.remindDateTime)}"  type="text" name="date" placeholder="mm-dd-yyyy" style="width:100%;" />
                    </div>
                    <div class="box_row_info py-2">
                        <label style="display: block;">First reminder:</label>
                        <div class="range-field ez_range_field_valuelist" style="width:100%;">
                            <input value="0" type="range" name="term" data-valuelist='[{"v":"1", "l":"All"}, {"v":"2592000", "l":"30day"}, {"v":"1296000", "l":"15day"}, {"v":"86400", "l":"24h"}, {"v":"3600", "l":"1h"}, {"v":"0", "l":"None"}]' />
                        </div>
                    </div>
                    <div class="col-sm-12 px-0"><button class="btn btn-default cancel">Cancel</button> <button class="btn btn-default update">Update</button></div>
                </div>
            </div>`);
            
            parentElement.find('.datepicker').datepicker({dateFormat: 'mm-dd-yy'});
            init_range_input('.modal-body .reminder_body .reminderElement[data-id="' + reminderId + '"] input[type=range]');
            
            var termRange = getRangeValuelist(parentElement.find('input[name="term_range"]'));
            if (termRange) {
                var term_value = termRange.length - 1;
                $.each(termRange, function (k, v) {
                    if (v.v == reminderInfo.term) {
                        term_value = k;
                        return false;
                    }
                });
                parentElement.find('input[name="term_range"]').val(term_value);
                if (reminderInfo.term && parentElement.find('input[name="term"]').val() == 0)
                    parentElement.find('input[name="term"]').val(reminderInfo.term);
            }
        }
        
        self.modalElement.find('.modal-body .reminder_body .reminderElement[data-id="'+reminderId+'"] .reminderInfo .body .update').click(self.updateReminderForTruckOrTrailer);
        
        self.modalElement.find('.modal-body .reminder_body .reminderElement[data-id="'+reminderId+'"] .reminderInfo .body .cancel').click(function(){
            $(this).closest('.reminderElement').replaceWith(self.createReminderElemet(reminderInfo));
            self.modalElement.find('.modal-body .reminder_body .reminderElement[data-id="'+reminderId+'"] .reminderInfo .header .dropdown .edit').click(self.editReminder);
            self.modalElement.find('.modal-body .reminder_body .reminderElement[data-id="'+reminderId+'"] .reminderInfo .header .dropdown .reset').click(self.resetMilesReminder);
            self.modalElement.find('.modal-body .reminder_body .reminderElement[data-id="'+reminderId+'"] .reminderInfo .header .dropdown .remove').click(self.removeReminderForTruckOrTrailer);
        });
    }
    
    self.updateReminderForTruckOrTrailer = function () {
        var parentElement = $(this).closest('.reminderElement');
        var reminderStatus = parentElement.attr('data-status');
        var reminderId = parentElement.attr('data-id');
        var reminderType = parentElement.attr('data-type');
        
        var data = {};
        
        data['id'] = reminderId;
        data['status'] = reminderStatus;
        data['type'] = reminderType;
        data['name'] = parentElement.find('input[name="name"]').val();
        data['term'] = parentElement.find('input[name="term"]').val();
        if (reminderType == 0) {
            data['date'] = parentElement.find('input[name="date"]').val();
        }
        
        if (data['name'] == '' || data['term'] == '') {
            data['name'] == '' ? parentElement.find('input[name="name"]').addClass('error') : '';
            data['term'] == '' ? parentElement.find('input[name="term"]').addClass('error') : '';
            return false;
        }
        if (data['type'] == 0 && data['date'] == '') {
            data['date'] =='' ? parentElement.find('input[name="date"]').addClass('error') : '';
            return false;
        }
        
        c(data);
        
        AjaxController('updateReminderForTruckOrTrailer', data, self.cntrlUrl, self.updateReminderForTruckOrTrailerHandler, self.updateReminderForTruckOrTrailerHandler, true);
    }
    
    self.updateReminderForTruckOrTrailerHandler = function (response) {
        c(response);
        var result = response.data.result;
        
        $.each(self.reminders, function(key, value){
            if (value.id == result.id) {
                self.reminders[key] = result;
            }
        });
        
        self.modalElement.find('.modal-body .reminder_body .reminderElement[data-id="' + result.id + '"]').replaceWith(self.createReminderElemet(result))
        
        self.modalElement.find('.modal-body .reminder_body .reminderElement[data-id="' + result.id + '"] .reminderInfo .header .dropdown .edit').click(self.editReminder);
        self.modalElement.find('.modal-body .reminder_body .reminderElement[data-id="' + result.id + '"] .reminderInfo .header .dropdown .reset').click(self.resetMilesReminder);
        self.modalElement.find('.modal-body .reminder_body .reminderElement[data-id="' + result.id + '"] .reminderInfo .header .dropdown .remove').click(self.removeReminderForTruckOrTrailer);
    }
    
    self.createReminderElemet = function (data) {
        var content = '';
        
        if (data.type == 0) {
            var remindFor = 'none';
            if (data.term == '1') {
                remindFor = '30d, 15d, 24h, 1h';
            } else if (data.term == '2592000') {
                remindFor = '30d';
            } else if (data.term == '1296000') {
                remindFor = '15d';
            } else if (data.term == '86400') {
                remindFor = '24h';
            } else if (data.term == '3600') {
                remindFor = '1h';
            }
            
            var listOfButtons = [];
            listOfButtons.push(`<button class="edit">Edit reminder</button>`);
            listOfButtons.push(`<button class="remove">Remove</button>`);
            
            content = `<div class="header">${data.name}${addTableActionRow(listOfButtons, 120)}</div>
                    <div class="body">
                        <p><b>Reminder date: </b>${convertUSADateTime(data.remindDateTime)}</p>
                        <p><b>First Reminder: </b>${remindFor}</p>
                    </div>`;
        } else {
            var listOfButtons = [];
            listOfButtons.push(`<button class="edit">Edit reminder</button>`);
            listOfButtons.push(`<button class="reset">Reset</button>`);
            listOfButtons.push(`<button class="remove">Remove</button>`);
            content = `<div class="header">${data.name}${addTableActionRow(listOfButtons, 120)}</div>
                        <div class="body">
                            <p><b>Odometer: </b>${data.odometerStart} / ${data.currentOdometer}</p>
                            <p><b>Remind After: </b>${data.term} mi</p>
                        </div>`;
        }

        return `<div class="col-sm-4 py-3 reminderElement" data-id="${data.id}" data-type="${data.type}" data-status="${data.status}">
                    <div class="reminderInfo">${content}</div>
                </div>`;
    }

    self.str_rand = function (count = 32) {
        var result = '';
        var words = '0123456789qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM';
        var max_position = words.length - 1;
        for (i = 0; i < count; ++i) {
            var position = Math.floor(Math.random() * max_position);
            result = result + words.substring(position, position + 1);
        }
        return result;
    }

    self.generateHeaders = function () {
        var headers = [];

        headers.push({label: 'Vehicle ID', value: self.equipment.id});
        headers.push({label: self.equipment.truckTrailer == 1 ? 'Trailer Number' : 'Truck Number', value: getDisplayValue(self.equipment.Name)});

        headers.push({label: 'VIN', value: typeof self.equipment.EldVin !== 'undefined' && self.equipment.EldVin != '' ? getDisplayValue(self.equipment.EldVin) : getDisplayValue(self.equipment.VIN)});
        headers.push({label: 'Active Truck', value: self.equipment.isActive == 1 ? 'Active' : 'Deactivated'});

        self.setCardHeaders(headers)
        }

    self.generateButtons = function () {
        self.tabs.push({
            label: 'History',
            cl: 'history',
            request: 'getFleetTruckCardHistoryPagination',
            handler: 'getFleetTruckCardHistoryPaginationHandler',
            tableHeader: `<tr>
                <th>Id</th>
                <th>UPDATE DATE</th>
                <th>EDITED BY</th>
                <th>STATUS</th>
            </tr>`
        });

        if (self.equipment.truckTrailer != 1) {
            self.tabs.push({
                label: 'Fault Codes',
                cl: 'faultCodes',
                request: 'getFleetTruckCardFaultCodesPagination',
                handler: 'getFleetTruckCardFaultCodesPaginationHandler',
                tableHeader: `<tr>
                    <th>SPN</th>
                    <th>Source</th>
                    <th>First Detected</th>
                    <th>Last Observed</th>
                    <th>Description</th>
                    <th>Status</th>
                </tr>`
            });
            
            self.tabs.push({
                label: 'Malfunctions',
                cl: 'malfunctions',
                request: 'getFleetTruckCardMalfunctionsPagination',
                handler: 'getFleetTruckCardMalfunctionsPaginationHandler',
                tableHeader: `<tr>
                    <th>ID</th>
                    <th>DATE/TIME</th>
                    <th>DRIVER</th>
                    <th>CODE</th>
                </tr>`
            });
            
            if (position == TYPE_FRONTEND_SUPERADMIN || position == TYPE_EZLOGZ_MANAGER) {
                self.tabs.push({
                    label: 'ELD Unidentified Logs',
                    cl: 'eld-unidentified-logs',
                    tableHeader: `<tr>
                        <th data-type="dateStart">Start time</th>
                        <th data-type="dateEnd">End Time</th>
                        <th>Duration</th>
                        <th data-type="deviceLocalId">Eld Id</th>
                        <th data-type="locationNameStart">Location Start</th>
                        <th data-type="locationNameEnd">Location End</th>
                        <th data-type="odometerStart">Odometer Start</th>
                        <th data-type="odometerEnd">Odometer End</th>
                        <th data-type="distance">Distance</th>
                        <th>Actions</th>
                    </tr>`,
                    request: 'getFleetTruckCardEldUnidentifiedLogsPagination',
                    handler: 'getFleetTruckCardEldUnidentifiedLogsPaginationHandler',
                });
            }
        }
        
        self.setCardTabs(self.tabs);
    }
    
    self.getFleetTruckCardMalfunctionsPaginationHandler = function (response) {
        $('.euntizo').remove();
        
        var tbody = '';
        $.each(response.data.result, function (k, item) {
            var code = getMalfunctionNameFromMalfunctionCode(item.code)
            tbody += '<tr>\n\
                <td>' + item.id + '</td>\n\
                <td>' + moment(item.dateTime, SQLDATETIMEFORMAT).format(USADATETIMEFORMAT) + '</td>\n\
                <td>' + item.userName + '</td>\n\
                <td>' + code + '</td>\n\
            </tr>';
        });
        self.modalElement.find('#' + self.tableId).find('tbody').html(tbody);
    }
    self.getFleetTruckCardHistoryPaginationHandler = function (response) {
        c('getFleetTruckCardHistoryPaginationHandler');
        c(response);
        
        $('.euntizo').remove();

        self.history = response.data.result;

        var countEqHis = response.data.result.length;
        $.each(response.data.result, function (k, v) {
            if (v.eldVIN != null) {
                self.equipment.eldVINKey = k;
            }
        });
        var tbody = '';
        $.each(response.data.result, function (k, item) {
            var status = '';
            if (k == (countEqHis - 1)) {
                status = 'Created';
            } else {
                status = 'Updated';
            }
            if (typeof self.equipment.EldVin !== 'undefined' && self.equipment.eldVINKey == k) {
                status = 'Created ELD VIN';
            }
            tbody += '<tr data-eqhiskey="' + k + '">\n\
                <td>' + item.id + '</td>\n\
                <td>' + item.update_date + '</td>\n\
                <td>(' + getUserPositionByKey(item.user_compos) + ') ' + item.user_name + ' ' + item.user_last + '</td>\n\
                <td>' + status + '</td>\n\
            </tr>';
        });
        self.modalElement.find('#' + self.tableId).find('tbody').html(tbody);
        self.modalElement.find('#' + self.tableId).addClass('clickable');
        self.modalElement.find('.popup_box_body tbody tr').click(self.actionGlobalShowOneEqHis);
    }

    self.getFleetTruckCardFaultCodesPaginationHandler = function (response) {
        c('getFleetTruckCardFaultCodesPaginationHandler');
        c(response);
        
        $('.euntizo').remove();
        
        var tbody = '';
        response.data.result.forEach((item) => {
            tbody += '<tr>\n\
                <td>' + item.spn + '</td>\n\
                <td>' + item.source + '</td>\n\
                <td>' + item.firstFaultDate + '</td>\n\
                <td>' + item.lastFaultDate + '</td>\n\
                <td>' + item.description + '</td>\n\
                <td>' + (item.status == 0 ? '<button class="btn btn-default">OPEN</button>' : '<button class="btn btn-default">CLOSED</button>') + '</td>\n\
            </tr>';
        });
        self.modalElement.find('#' + self.tableId).find('tbody').html(tbody);
    }
    
    self.getFleetTruckCardEldUnidentifiedLogsPaginationHandler = function (response) {
        c('getFleetTruckCardEldUnidentifiedLogsPaginationHandler');
        c(response);
        
        $('.euntizo').remove();
        
        var dropDownTimeZones = '';
        
        response.data.timeZones.forEach((item) => {
            dropDownTimeZones += `<option data-short="${item.shortName}" value="${item.value}">(${item.shortName})${item.name}</option>`;
        });
        
        var includeDropDownTimeZone = `<div class="euntizo">ELD Unidentified Logs Time Zone
            <select onchange="fleetTruckModal_changeTimeZone(this)">
                <option data-short="UTC" value="0" selected >UTC</option>
                ${dropDownTimeZones}
            </select></div>`;
        
        var tbody = '';
        response.data.result.forEach((item) => {
            var duration = item.dateEnd - item.dateStart;
            var hours = Math.floor(duration / 3600);
            duration = duration - hours * 3600;
            var minutes = Math.floor(duration / 60);
            var seconds = Math.floor(duration % 60);
            
            var pad = "00";
            minutes = (pad + minutes).slice(-pad.length);
            hours = (pad + hours).slice(-pad.length);
            seconds = (pad + seconds).slice(-pad.length);
            
            tbody += `<tr data-id="${item.id}">
                <td data-dateStart="${item.dateStart}">(UTC)${timeFromSecToUSAString(item.dateStart, false)}</td>
                <td data-dateEnd="${item.dateEnd}">(UTC)${timeFromSecToUSAString(item.dateEnd, false)}</td>
                <td>${hours}:${minutes}:${seconds}</td>
                <td>${getDisplayValue(item.localId)}</td>
                <td>${item.locationNameStart}</td>
                <td>${item.locationNameEnd}</td>
                <td>${toFixedFloat(item.odometerStart, 2)}</td>
                <td>${toFixedFloat(item.odometerEnd, 2)}</td>
                <td>${toFixedFloat(item.odometerEnd - item.odometerStart, 2)} mi</td>
                <td><button class="btn btn-default" onclick="fleetTruckModal_deleteEldUnidentifiedLogModal(${item.id});">Delete</button></td>
            </tr>`;
        });
        
        self.modalElement.find('#' + self.tableId).before(includeDropDownTimeZone);
        
        self.modalElement.find('#' + self.tableId).find('tbody').html(tbody);
    }

    self.actionGlobalShowOneEqHis = function () {
        var key = parseInt($(this).attr('data-eqhiskey'));
        var truckOrTrailer = self.history.truckTrailer == 0 ? 'Truck' : 'Trailer';
        var countEqHis = self.history.length;
        var prevKey = key - 1 < 0 ? 0 : key - 1;
        var nextKey = key + 1 > countEqHis - 1 ? countEqHis - 1 : key + 1;
        var hisInfo = self.history[key];
        var newInfo = self.history;
        var VIN = '';
        if (typeof newInfo.EldVin === 'undefined') {
            if (hisInfo.VIN != newInfo.VIN) {
                VIN = `<p><b style="color: green;">${hisInfo.VIN}</b></p>`;
            } else {
                VIN = `<p>${newInfo.VIN}</p>`;
            }
        } else {
            if (newInfo.eldVINKey >= key) {
                VIN = `<p>${newInfo.EldVin}</p>`;
            } else {
                if (hisInfo.VIN != newInfo.VIN) {
                    VIN = `<p><b style="color: green;">${hisInfo.VIN}</b></p>`;
                } else {
                    VIN = `<p>${newInfo.VIN}</p>`;
                }
            }
        }

        var head = `Information about the ${truckOrTrailer} for <span id="one_eqhis_cdate">${timeFromSQLDateTimeStringToUSAString(hisInfo.update_date, true)}</span>
                <div class="buttons_control">
					<span id="one_eqhis_who" style="display: block; margin: 7px 0px;">${getUserPositionByKey(hisInfo.user_compos)}(${hisInfo.user_name} ${hisInfo.user_last})</span>
                    <button id="one_eqhis_prev" class="btn btn-default" data-eqhiskey="${prevKey}">Prev</button>
                    <button id="one_eqhis_next" class="btn btn-default" data-eqhiskey="${nextKey}">Next</button>
                </div>`;
        var content = `<div style="overflow:hidden;"><div class="info_box">
                <h2>General</h2>
                <div class="box_row" id="one_eqhis_gen_name">
                    <label>Unit</label>
                    ${hisInfo.Name != newInfo.Name ? `<p><b style="color: green;">${hisInfo.Name}</b></p>` : `<p>${newInfo.Name}</p>`}
                </div>
                <div class="box_row" id="one_eqhis_gen_owner">
                    <label>Owner</label>
                    ${hisInfo.Owner != newInfo.Owner ? `<p><b style="color: green;">${hisInfo.Owner}</b></p>` : `<p>${newInfo.Owner}</p>`}
                </div>
                <div class="box_row" id="one_eqhis_gen_year">
                    <label>Year</label>
                    ${hisInfo.Year != newInfo.Year ? `<p><b style="color: green;">${hisInfo.Year}</b></p>` : `<p>${newInfo.Year}</p>`}
                </div>
                <div class="box_row" id="one_eqhis_gen_type">
                    <label>Type</label>
                    ${hisInfo.typeName != newInfo.typeName ? `<p><b style="color: green;">${hisInfo.typeName}</b></p>` : `<p>${newInfo.typeName}</p>`}
                </div>
                <div class="box_row" id="one_eqhis_gen_vin">
                    <label>VIN</label>
                    ${VIN}
                </div>
                <div class="box_row" id="one_eqhis_gen_plate">
                    <label>Plate</label>
                    ${hisInfo.Plate != newInfo.Plate ? `<p><b style="color: green;">${hisInfo.Plate}</b></p>` : `<p>${newInfo.Plate}</p>`}
                </div>
                <div class="box_row" id="one_eqhis_gen_state">
                    <label>State</label>
                    ${hisInfo.stateName != newInfo.stateName ? `<p><b style="color: green;">${hisInfo.stateName}</b></p>` : `<p>${newInfo.stateName}</p>`}
                </div>
            </div>
            <div class="info_box">
                <h2>Parameters</h2>
                <div class="box_row" id="one_eqhis_par_tirsi">
                    <label>Tire Size</label>
                    ${hisInfo.TireSize != newInfo.TireSize ? `<p><b style="color: green;">${hisInfo.TireSize}</b></p>` : `<p>${newInfo.TireSize}</p>`}
                </div>
                <div class="box_row" id="one_eqhis_par_length">
                    <label>Length</label>
                    ${hisInfo.Length != newInfo.Length ? `<p><b style="color: green;">${hisInfo.Length}</b></p>` : `<p>${newInfo.Length}</p>`}
                </div>
                <div class="box_row" id="one_eqhis_par_fuel">
                    <label>Fuel Type</label>
                    ${hisInfo.Fuel != newInfo.Fuel ? `<p><b style="color: green;">${hisInfo.Fuel}</b></p>` : `<p>${newInfo.Fuel}</p>`}
                </div>
                <div class="box_row" id="one_eqhis_par_axel">
                    <label>Axel</label>
                    ${hisInfo.Axel != newInfo.Axel ? `<p><b style="color: green;">${hisInfo.Axel}</b></p>` : `<p>${newInfo.Axel}</p>`}
                </div>
                <div class="box_row" id="one_eqhis_par_make">
                    <label>Make</label>
                    ${hisInfo.Make != newInfo.Make ? `<p><b style="color: green;">${hisInfo.Make}</b></p>` : `<p>${newInfo.Make}</p>`}
                </div>
                <div class="box_row" id="one_eqhis_par_model">
                    <label>Model</label>
                    ${hisInfo.Model != newInfo.Model ? `<p><b style="color: green;">${hisInfo.Model}</b></p>` : `<p>${newInfo.Model}</p>`}
                </div>
                <div class="box_row" id="one_eqhis_par_growei">
                    <label>Gross Weight</label>
                    ${hisInfo.GrossWeight != newInfo.GrossWeight ? `<p><b style="color: green;">${hisInfo.GrossWeight}</b></p>` : `<p>${newInfo.GrossWeight}</p>`}
                </div>
                <div class="box_row" id="one_eqhis_par_unwei">
                    <label>Unland Weight</label>
                    ${hisInfo.UnlandWeight != newInfo.UnlandWeight ? `<p><b style="color: green;">${hisInfo.UnlandWeight}</b></p>` : `<p>${newInfo.UnlandWeight}</p>`}
                </div>
            </div>
            <div class="info_box">
                <h2>Others</h2>
                <div class="box_row" id="one_eqhis_oth_color">
                    <label>Color</label>
                    ${hisInfo.Color != newInfo.Color ? `<p><b style="color: green;">${hisInfo.Color}</b></p>` : `<p>${newInfo.Color}</p>`}
                </div>
                <div class="box_row" id="one_eqhis_oth_nycer">
                    <label>NY Certificate</label>
                    ${hisInfo.NYCert != newInfo.NYCert ? `<p><b style="color: green;">${hisInfo.NYCert}</b></p>` : `<p>${newInfo.NYCert}</p>`}
                </div>
                <div class="box_row" id="one_eqhis_oth_insdue">
                    <label>Inspection Due</label>
                    ${hisInfo.InspectionDue != newInfo.InspectionDue ? `<p><b style="color: green;">${timeFromSQLDateTimeStringToUSAString(hisInfo.InspectionDue, true)}</b></p>` : `<p>${timeFromSQLDateTimeStringToUSAString(newInfo.InspectionDue, true)}</p>`}
                </div>
                <div class="box_row" id="one_eqhis_oth_90day">
                    <label>90 Day Exp</label>
                    ${hisInfo['90DayExp'] != newInfo['90DayExp'] ? `<p><b style="color: green;">${timeFromSQLDateTimeStringToUSAString(hisInfo['90DayExp'], true)}</b></p>` : `<p>${timeFromSQLDateTimeStringToUSAString(newInfo['90DayExp'], true)}</p>`}
                </div>
                <div class="box_row" id="one_eqhis_oth_prorat">
                    <label>Pro Rate Exp</label>
                    ${hisInfo.ProRateExp != newInfo.ProRateExp ? `<p><b style="color: green;">${timeFromSQLDateTimeStringToUSAString(hisInfo.ProRateExp, true)}</b></p>` : `<p>${timeFromSQLDateTimeStringToUSAString(newInfo.ProRateExp, true)}</p>`}
                </div>
                <div class="box_row" id="one_eqhis_oth_wxpdat">
                    <label>Exp Date</label>
                    ${hisInfo.ExpDate != newInfo.ExpDate ? `<p><b style="color: green;">${timeFromSQLDateTimeStringToUSAString(hisInfo.ExpDate, true)}</b></p>` : `<p>${timeFromSQLDateTimeStringToUSAString(newInfo.ExpDate, true)}</p>`}
                </div>
                <div class="box_row" id="one_eqhis_oth_act">
                    <label>Active</label>
                    ${hisInfo.isActive != newInfo.isActive ? `<p><b style="color: green;">${hisInfo.isActive == 1 ? 'Active' : 'Deactivated'}</b></p>` : `<p>${newInfo.isActive == 1 ? 'Active' : 'Deactivated'}</p>`}
                </div>
            </div>
            <div class="info_box" id="one_eqhis_notes">
                <h2>Notes</h2>
                ${hisInfo.Notes != newInfo.Notes ? `<p><b style="color: green;">${hisInfo.Notes}</b></p>` : `<p>${newInfo.Notes}</p>`}
            </div></div>`;
        showModal(head, content, '', 'modal-lg');
        $('#one_eqhis_prev, #one_eqhis_next').click(self.actionGlobalPrevNextEqHis);
    }

    self.actionGlobalPrevNextEqHis = function () {
        var key = parseInt($(this).attr('data-eqhiskey'));
        var countEqHis = self.history.length;
        var hisInfo = self.history[key];
        var newInfo = self.history;

        var VIN = '';
        if (typeof newInfo.EldVin === 'undefined') {
            if (hisInfo.VIN != newInfo.VIN) {
                VIN = `<p><b style="color: green;">${hisInfo.VIN}</b></p>`;
            } else {
                VIN = `<p>${newInfo.VIN}</p>`;
            }
        } else {
            if (newInfo.eldVINKey >= key) {
                VIN = `<p>${newInfo.EldVin}</p>`;
            } else {
                if (hisInfo.VIN != newInfo.VIN) {
                    VIN = `<p><b style="color: green;">${hisInfo.VIN}</b></p>`;
                } else {
                    VIN = `<p>${newInfo.VIN}</p>`;
                }
            }
        }

        $('#one_eqhis_cdate').text(timeFromSQLDateTimeStringToUSAString(hisInfo.update_date, true));

        var prevKey = key - 1 < 0 ? 0 : key - 1;
        $('#one_eqhis_prev').attr('data-eqhiskey', prevKey);
        var nextKey = key + 1 > countEqHis - 1 ? countEqHis - 1 : key + 1;
        $('#one_eqhis_next').attr('data-eqhiskey', nextKey);
        $('#one_eqhis_who').text(`${getUserPositionByKey(hisInfo.user_compos)}(${hisInfo.user_name} ${hisInfo.user_last})`);
        /*General*/
        $('#one_eqhis_gen_name p').html(`${hisInfo.Name != newInfo.Name ? `<p><b style="color: green;">${hisInfo.Name}</b></p>` : `<p>${newInfo.Name}</p>`}`);
        $('#one_eqhis_gen_owner p').html(`${hisInfo.Owner != newInfo.Owner ? `<p><b style="color: green;">${hisInfo.Owner}</b></p>` : `<p>${newInfo.Owner}</p>`}`);
        $('#one_eqhis_gen_year p').html(`${hisInfo.Year != newInfo.Year ? `<p><b style="color: green;">${hisInfo.Year}</b></p>` : `<p>${newInfo.Year}</p>`}`);
        $('#one_eqhis_gen_type p').html(`${hisInfo.Type != newInfo.Type ? `<p><b style="color: green;">${hisInfo.typeName}</b></p>` : `<p>${newInfo.typeName}</p>`}`);
        $('#one_eqhis_gen_vin p').html(`${VIN}`);
        $('#one_eqhis_gen_plate p').html(`${hisInfo.Plate != newInfo.Plate ? `<p><b style="color: green;">${hisInfo.Plate}</b></p>` : `<p>${newInfo.Plate}</p>`}`);
        $('#one_eqhis_gen_state p').html(`${hisInfo.State != newInfo.State ? `<p><b style="color: green;">${hisInfo.stateName}</b></p>` : `<p>${newInfo.stateName}</p>`}`);
        /*Params*/
        $('#one_eqhis_par_tirsi p').html(`${hisInfo.TireSize != newInfo.TireSize ? `<p><b style="color: green;">${hisInfo.TireSize}</b></p>` : `<p>${newInfo.TireSize}</p>`}`);
        $('#one_eqhis_par_length p').html(`${hisInfo.Length != newInfo.Length ? `<p><b style="color: green;">${hisInfo.Length}</b></p>` : `<p>${newInfo.Length}</p>`}`);
        $('#one_eqhis_par_fuel p').html(`${hisInfo.Fuel != newInfo.Fuel ? `<p><b style="color: green;">${hisInfo.Fuel}</b></p>` : `<p>${newInfo.Fuel}</p>`}`);
        $('#one_eqhis_par_axel p').html(`${hisInfo.Axel != newInfo.Axel ? `<p><b style="color: green;">${hisInfo.Axel}</b></p>` : `<p>${newInfo.Axel}</p>`}`);
        $('#one_eqhis_par_make p').html(`${hisInfo.Make != newInfo.Make ? `<p><b style="color: green;">${hisInfo.Make}</b></p>` : `<p>${newInfo.Make}</p>`}`);
        $('#one_eqhis_par_model p').html(`${hisInfo.Model != newInfo.Model ? `<p><b style="color: green;">${hisInfo.Model}</b></p>` : `<p>${newInfo.Model}</p>`}`);
        $('#one_eqhis_par_growei p').html(`${hisInfo.GrossWeight != newInfo.GrossWeight ? `<p><b style="color: green;">${hisInfo.GrossWeight}</b></p>` : `<p>${newInfo.GrossWeight}</p>`}`);
        $('#one_eqhis_par_unwei p').html(`${hisInfo.UnlandWeight != newInfo.UnlandWeight ? `<p><b style="color: green;">${hisInfo.UnlandWeight}</b></p>` : `<p>${newInfo.UnlandWeight}</p>`}`);
        /*Others*/
        $('#one_eqhis_oth_color p').html(`${hisInfo.Color != newInfo.Color ? `<p><b style="color: green;">${hisInfo.Color}</b></p>` : `<p>${newInfo.Color}</p>`}`);
        $('#one_eqhis_oth_nycer p').html(`${hisInfo.NYCert != newInfo.NYCert ? `<p><b style="color: green;">${hisInfo.NYCert}</b></p>` : `<p>${newInfo.NYCert}</p>`}`);
        $('#one_eqhis_oth_insdue p').html(`${hisInfo.InspectionDue != newInfo.InspectionDue ? `<p><b style="color: green;">${timeFromSQLDateTimeStringToUSAString(hisInfo.InspectionDue, true)}</b></p>` : `<p>${timeFromSQLDateTimeStringToUSAString(newInfo.InspectionDue, true)}</p>`}`);
        $('#one_eqhis_oth_90day p').html(`${hisInfo['90DayExp'] != newInfo['90DayExp'] ? `<p><b style="color: green;">${timeFromSQLDateTimeStringToUSAString(hisInfo['90DayExp'], true)}</b></p>` : `<p>${timeFromSQLDateTimeStringToUSAString(newInfo['90DayExp'], true)}</p>`}`);
        $('#one_eqhis_oth_prorat p').html(`${hisInfo.ProRateExp != newInfo.ProRateExp ? `<p><b style="color: green;">${timeFromSQLDateTimeStringToUSAString(hisInfo.ProRateExp, true)}</b></p>` : `<p>${timeFromSQLDateTimeStringToUSAString(newInfo.ProRateExp, true)}</p>`}`);
        $('#one_eqhis_oth_wxpdat p').html(`${hisInfo.ExpDate != newInfo.ExpDate ? `<p><b style="color: green;">${timeFromSQLDateTimeStringToUSAString(hisInfo.ExpDate, true)}</b></p>` : `<p>${timeFromSQLDateTimeStringToUSAString(newInfo.ExpDate, true)}</p>`}`);
        $('#one_eqhis_oth_act p').html(`${hisInfo.isActive != newInfo.isActive ? `<p><b style="color: green;">${hisInfo.isActive == 1 ? 'Active' : 'Deactivated'}</b></p>` : `<p>${newInfo.isActive == 1 ? 'Active' : 'Deactivated'}</p>`}`);
        /*Notes*/
        $('#one_eqhis_notes p').html(`${hisInfo.Notes != newInfo.Notes ? `<p><b style="color: green;">${hisInfo.Notes}</b></p>` : `<p>${newInfo.Notes}</p>`}`);
    }

    self.initRequest();
}
//user card
function getOneTruckInfo(el, event) {
    var truckId = $(el).attr('data-id');
    event.stopPropagation();
    if (window.location.pathname == '/dash/') {
        var driverId = $(el).closest('tr').attr('data-id');
        fleetC.setSessionToUserCarrier(driverId)
    }
    new fleetTruckCard(truckId);

}
function clickTruckRow(el, event) {
    var truckId = $(el).attr('data-id');
    if (!$('.table_wrap').hasClass('show-map')) {
        getOneTruckInfo(el, event);
    } else {
        trucksMap.showSelectedMarkerByTruckId(truckId);
    }
}
function truckCardLink(id, name, type = false, connected = false) {
    name = (name.length > 17) ? name.substr(0, 17) + '&hellip;' : name;
    var imgSrc = '/dash/assets/svg/unit/truck_no_info.svg';
    if(type != false){
        connected = connected ? 'green' : 'grey';
        imgSrc = '/dash/assets/svg/unit/truck_'+type+'_'+connected+'.svg';
    }
    var cardLink = '<span onclick="getOneTruckInfo(this, event);" data-id="' + id + '" class="clickable_item one_unit"><img src="'+imgSrc+'" alt="unit icon"/>' + name + '</span>';
    return cardLink;
}
function getMalfunctionNameFromMalfunctionCode($code){
        $malfunctionText = '';
        if($code == 1){
            $malfunctionText = 'Power data diagnostic event';
        } else if($code == 2){
            $malfunctionText = 'Engine syncronization data diagnostic event';
        } else if($code == 3){
            $malfunctionText = 'Missing required data elements data diagnostic event';
        } else if($code == 4){
            $malfunctionText = 'Data transfer data diagnostic event';
        } else if($code == 5){
            $malfunctionText = 'Unidentified driving record data diagnostic event';
        } else if($code == 6){
            $malfunctionText = 'Other ELD identified diagnostic event';
        } else if($code == 'P'){
            $malfunctionText = 'Power complience malfunction';
        } else if($code == 'E'){
            $malfunctionText = 'Engine syncronization complience malfunction';
        } else if($code == 'T'){
            $malfunctionText = 'Timing complience malfunction';
        } else if($code == 'L'){
            $malfunctionText = 'Positioning complience malfunction';
        } else if($code == 'R'){
            $malfunctionText = 'Data recording complience malfunction';
        } else if($code == 'S'){
            $malfunctionText = 'Data transfer complience malfunction';
        } else if($code == 'P'){
            $malfunctionText = 'Other ELD detected malfunction';
        }
        return $malfunctionText;
    }

function fleetTruckModal_changeTimeZone(el) {
    var element = $(el);
    var value = element.val();
    var short = element.find('option:selected').attr('data-short');
    
    $.each($('#fleet_truck_card .modal-content .modal-body .popup_box_body table tbody tr'), function (k, item) {
       var unixTimeDateStart = $(item).find('td[data-dateStart]').attr('data-dateStart');
       var unixTimeDateEnd = $(item).find('td[data-dateEnd]').attr('data-dateEnd');
       
       $(item).find('td[data-dateStart]').text(`(${short})${timeFromSecToUSAString(Number(unixTimeDateStart) + Number(value), false)}`);
       $(item).find('td[data-dateEnd]').text(`(${short})${timeFromSecToUSAString(Number(unixTimeDateEnd) + Number(value), false)}`);
    });
    
}

function fleetTruckModal_deleteEldUnidentifiedLogModal(unId) {
    var footerButtons = '<button data-dismiss="modal" class="btn btn-default" onclick="fleetTruckModal_deleteEldUnidentifiedLog('+unId+');">Delete</button>';
        showModal('Delete ELD Unidentified Log', '<p class="text-center">Are you sure you want to delete this undefined driving status?</p>', 'deleteEldUnidentifiedLog', '', {footerButtons: footerButtons});
}

function fleetTruckModal_deleteEldUnidentifiedLog(unId) {
    AjaxController('fleetTruckModal_deleteEldUnidentifiedLog', {unId: unId}, apiDashUrl, fleetTruckModal_deleteEldUnidentifiedLogHandler, fleetTruckModal_deleteEldUnidentifiedLogHandler, true);
}

function fleetTruckModal_deleteEldUnidentifiedLogHandler (response) {
    c('fleetTruckModal_deleteEldUnidentifiedLogHandler');
    c(response);
    
    $('#fleet_truck_card .modal-content .modal-body .popup_box_body table tbody tr[data-id = "'+response.data.unId+'"]').remove();
}

function fleetTruckModal_createMalfunctionModal (el) {
    let truckId = $(el).attr('data-truckid');
    let footerButtons = `<button class="btn btn-default" data-truckid="${truckId}" onclick="fleetTruckModal_createMalfunction(this);">Create</button>`;
    let malfunctionTypes = `<select class="malf-type">
                                <option value="1">Power data diagnostic event</option>
                                <option value="2">Engine syncronization data diagnostic event</option>
                                <option value="3">Missing required data elements data diagnostic event</option>
                                <option value="4">Data transfer data diagnostic event</option>
                                <option value="5">Unidentified driving record data diagnostic event</option>
                                <option value="6">Other ELD identified diagnostic event</option>
                                <option value="P">Power complience malfunction</option>
                                <option value="E">Engine syncronization complience malfunction</option>
                                <option value="T">Timing complience malfunction</option>
                                <option value="L">Positioning complience malfunction</option>
                                <option value="R">Data recording complience malfunction</option>
                                <option value="S">Data transfer complience malfunction</option>
                                <option value="O">Other ELD detected malfunction</option>
                            </select>`;
    showModal('Create Malfunction for Unit #' + truckId, 'Choose date of malfunction:<br><input type="text" class="malf-datepicker"><br>Select type of malfunction:<br>' + malfunctionTypes, 'createMalfunction', '', {footerButtons: footerButtons});
    
    let date = new Date();
    $('.malf-datepicker').datepicker({dateFormat: 'mm-dd-yy', maxDate: date}).datepicker("setDate", date);
}

function fleetTruckModal_createMalfunction (el) {
    let truckId = $(el).attr('data-truckid');
    let malfDate = $('#createMalfunction .malf-datepicker').val();
    let malfType = $('#createMalfunction .malf-type').val();
    
    AjaxCall({url: apiDashUrl, action: 'fleetTruckModal_createMalfunction', data: {truckId:truckId, malfDate:convertDateToSQL(malfDate), malfType:malfType}, successHandler: fleetTruckModal_createMalfunctionHandler});
}

function fleetTruckModal_createMalfunctionHandler (response) {
    $('#createMalfunction').remove();
    $('#carrierUsersButtonsBox button.malfunctions').click();
}