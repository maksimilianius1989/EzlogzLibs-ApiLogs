function EquipmentController() {
    var self = this;

    self.getAllTruckTrailerPagination;
    self.truckTypes;
    
    self.setTruckTypes = function(truckTypes) {
        self.truckTypes = truckTypes;
    }
    
    self.state;
    self.setState = function(state) {
        self.state = state;
    }
    
    self.getAllUnits = function(callback = false){
        if(!callback){return false}
        AjaxCall({action:'getAllUnits', url:apiDashUrl, successHandler:callback});
    }
    
    self.getAllTrailers = function(callback = false){
        if(!callback){return false}
        AjaxCall({action:'getAllTrailers', url:apiDashUrl, successHandler:callback});
    }
    
    self.getAllEquipment = function(callback = false){
        if(!callback){return false}
        AjaxCall({action:'getAllEquipment', url:apiDashUrl, successHandler:callback});
    }
    
    self.getEquipmentById = function(callback = false){
        if(!callback){return false}
        AjaxCall({action:'getEquipmentById', url:apiDashUrl, successHandler:callback});
    }
    
    self.equipmentInit = function () {
        self.getAllTruckTrailerPagination = new simplePaginator({
            overrideEmpty: true,
            tableId: 'trucks_table',
            request: 'getAllTruckTrailerPagination',
            requestUrl: apiDashUrl,
            handler: self.getAllTruckTrailerPaginationHandler,
            perPageList: [25, 50, 100],
            initSort: {param:'Name', dir:'asc'}
        });
    }
    self.driverEquipmentInit = function () {
        self.getAllTruckTrailerPagination = new simplePaginator({
            tableId: 'driver_trucks_table',
            request: 'getAllTruckTrailerPagination',
            requestUrl: apiDashUrl,
            overrideEmpty: true,
            handler: self.getAllTruckTrailerPaginationHandler,
            perPageList: [25, 50, 100],
			initSort: {param:'Name', dir:'asc'}
        });
    }
    self.getAllTruckTrailerPaginationHandler = function(response, tableId) {
        c('getAllTruckTrailerPaginationHandler');
        c(response);
        $('#search_block').find('input').removeClass('error');
		if(response.code != '000'){
			if(response.code == '115'){
				var fieldType = response.message;
				$('input[data-type="'+fieldType+'"]').addClass('error');
			}
			return false;
		}
        var body = $('#' + tableId).find('tbody')
        body.empty();
        
        $('#dash_drivers_table tbody').empty();
        if (response.data.total == 0) {
            body.append('<tr ><td colspan="8" style="text-align:center; font-weigth:bolder;">No Data Found</td></tr>');
            $('#dash_drivers_table tbody').append('<tr><td>No Data Found</td></tr>');
        }
        
        $.each(response.data.result, function (key, row) {
            var typeName = 'Property';
            var truckTrailer = row.truckTrailer == 0 ? 'Truck' : 'Trailer';
            var eld = row.EldVin == null || row.EldVin == '' ? 'No VIN code' : row.EldVin + ' <i style="padding-left:1px;" class="fa fa-lock" aria-hidden="true" title="Binded from ELD/AOBRD Device, not editable"></i>';
            var isActive = row.isActive == 1 ? 'Active' : 'Deactivated';
            $.each(self.truckTypes, function (key2, truckType) {
                if (truckType.id == row.Type) {
                    typeName = truckType.name;
                    return true;
                }
            });
            var faultCodesText = '';
            if (row.truckTrailer == 0) {
                if (row.openedFaultCodesCount > 0) {
                    faultCodesText = '<span style="display:flex;align-items: center;"><img src="/dash/assets/img/icon/error-1.png" style="margin-right:5px;width:18px;height:18px" />' + row.openedFaultCodesCount + ' Fault Codes</span>';
                } else {
                    faultCodesText = 'No Fault Codes';
                }
            }
            var name = (row.Name.length > 19) ? row.Name.substr(0, 19) + '&hellip;' : row.Name;
            body.append(`<tr class="edit_equip_row" onclick="clickTruckRow(this, event);" data-id="${row.id}">
                        <td title="${row.Name}">${truckCardLink(row.id, row.Name)}</td>
                        <td>${getDisplayValue(truckTrailer)}</td>
                        <!--<td>${getDisplayValue(row.Year)}</td>-->
                        <td>${getDisplayValue(typeName)}</td>
                        <td>${faultCodesText}</td>
                        <td>${getDisplayValue(eld)}</td>
                        <td>${timeFromSQLDateTimeStringToUSAString(row.ExpDate)}</td>
                        <td>${getDisplayValue(row.Owner)}</td>
                        <td>${getDisplayValue(isActive)}</td>
                </tr>`);
            
            $('#dash_drivers_table tbody').append(`<tr data-id="${row.id}" onclick="getLocation(${row.id});">
                                                    <td>
                                                        <div class="head">${truckCardLink(row.id, row.Name)} ${getDisplayValue(typeName)} <span class="active ${isActive != 'Active' ? 'no-active' : ''}"></span></div>
                                                        <div class="body">
                                                            <div>
                                                                VIN: ${getDisplayValue(eld)}
                                                            </div>
                                                            <div>
                                                                ${faultCodesText}
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>`);
        });
    }
    
    self.showAddTruckTrailerModal = function(truckTrailer) {
        if(fleetC.checkDemoAccess()){return false;}
        var truckTypesOpt = '';
        $.each(self.truckTypes, function (k, v) {
            truckTypesOpt += `<option value="${v.id}">${v.name}</option>`;
        });
        
        var stateList = '';
        $.each(self.state, function (k, v) {
            stateList += `<option value="${v.id}">${v.name}</option>`;
        });
        
        var headTitle = truckTrailer == 0 ? 'Unit' : 'Trailer';
        
        var head = `Add ${headTitle} <!--<br> 
            <div class="check_buttons_block" id="edit_tr_truckTrailer" style="width:20.5%;padding-top:10px;">
                <button type="button" class="btn btn-default active" onclick="doActive(this)" data-val="0">Truck</button>
                <button type="button" class="btn btn-default" onclick="doActive(this)" data-val="1">Trailer</button>
            </div>-->`;
        var content = `
            <div class="addVehicleFormGroup row">
				<input type="hidden" id="edit_tr_id" class="ez_input"/>
                <div class="col-sm-4 col-xs-12">
                    <div class="form-group">
                        <h2 style="margin:0;">General</h2>
					</div>
					<div class="form-group">
                        <label>Unit</label>
                        <input type="text" id="edit_tr_Name" class="ez_input form-control"/>
					</div>
					<div class="form-group">
                        <label>Owner</label>
                        <input type="text" id="edit_tr_Owner" class="ez_input form-control"/>
					</div>
					<div class="form-group">
                        <label>Year</label>
                        <input type="text" id="edit_tr_Year" class="ez_input form-control"/>
                    </div>
					<div class="form-group">
							<label>Type</label>
							<select id="edit_tr_Type" class="ez_input form-control">
								${truckTypesOpt}
							</select>
					</div>
					<div class="form-group">
                        <label>VIN</label>
                        <input type="text" value="" id="edit_tr_VIN" class="ez_input form-control" maxlength="17" onkeydown="upperCaseText(this)"/>
					</div>
					<div class="form-group">
                        <label>Plate</label>
                        <input type="text" value="" id="edit_tr_Plate" class="ez_input form-control"/>
					</div>
					<div class="form-group">
                        <label>State</label>
                        <select id="edit_tr_State" class="ez_input form-control">
                            <option value=""></option>
                            ${stateList}
                        </select>
                    </div>
				</div>
				<div class="col-sm-4 col-xs-12">
                    <div class="form-group">
                        <h2 style="margin:0;">Parameters</h2>
					</div>
					<div class="form-group">
                        <label>Tire Size</label>
                        <input type="number" value="" id="edit_tr_TireSize" class="ez_input form-control"/>
					</div>
					<div class="form-group">
						<label>Length</label>
						<input type="number" value="" id="edit_tr_Length" class="ez_input form-control"/>
					</div>
					<div class="form-group">
						<label>Fuel Type</label>
						<select id="edit_tr_Fuel" class="ez_input form-control">
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
					<div class="form-group">
						<label>Axel</label>
						<input type="text" value="" id="edit_tr_Axel" class="ez_input form-control"/>
					</div>
					<div class="form-group">
                        <label>Make</label>
                        <input type="text" value="" id="edit_tr_Make" class="ez_input form-control"/>
					</div>
					<div class="form-group">
                        <label>Model</label>
                        <input type="text" value="" id="edit_tr_Model" class="ez_input form-control"/>
                    </div>
					<div class="form-group">
                        <label>Gross Weight</label>
                        <input type="number" value="" id="edit_tr_GrossWeight" class="ez_input form-control"/>
                    </div>
					<div class="form-group">
                        <label>Unland Weight</label>
                        <input type="number" value="" id="edit_tr_UnlandWeight" class="ez_input form-control"/>
                    </div>
				</div>
				<div class="col-sm-4 col-xs-12">
                    <div class="form-group">
                        <h2 style="margin:0;">Others</h2>
					</div>
					<div class="form-group">
                        <label>Color</label>
                        <input type="text" value="" id="edit_tr_Color" class="ez_input form-control"/>
					</div>
					<div class="form-group">
                        <label>NY Certificate</label>
                        <input type="text" value="" id="edit_tr_NYCert" class="ez_input form-control"/>
                    </div>
					<div class="form-group">
                        <label>Inspection Due</label>
						<input type="text" value="" id="edit_tr_InspectionDue" class="datepicker ez_input form-control" placeholder="mm-dd-yyyy"/>
					</div>
					<div class="form-group">
                        <label>90 Day Exp</label>
                        <input type="text" value="" id="edit_tr_90DayExp" class="datepicker ez_input form-control" placeholder="mm-dd-yyyy"/>
					</div>
					<div class="form-group">
                        <label>Pro Rate Exp</label>
                        <input type="text" value="" id="edit_tr_ProRateExp" class="datepicker ez_input form-control" placeholder="mm-dd-yyyy"/>
					</div>
					<div class="form-group">
						<label>Exp Date</label>
                        <input type="text" value="" id="edit_tr_ExpDate" class="datepicker ez_input form-control" placeholder="mm-dd-yyyy"/>
					</div>
					<div class="form-group">
						<label>Active</label>
						<div class="check_buttons_block" id="edit_tr_isActive">
							<button type="button" class="btn btn-default active" onclick="doActive(this)" data-val="1">On</button>
							<button type="button" class="btn btn-default" onclick="doActive(this)" data-val="0">Off</button>
						</div>
					</div>
                </div>
            </div>
            `;
        
        showModal(head, content, 'addVehicle', 'modal-lg',{'footerButtons':'<button type="button" class="btn btn-default" onclick="equipmentC.addVehicle(' + truckTrailer + ');">Add</button>'});
        
        $('#addVehicle .datepicker').datepicker({dateFormat: 'mm-dd-yy'}).mask('00-00-0000');
    }
    
    self.addVehicle = function(truckTrailer) {
        var addVehicleModal = $('#addVehicle');
        
        //var truckTrailer = $('#edit_tr_truckTrailer .active').attr('data-val');
        var data = {
            truckTrailer: truckTrailer
        };
        
        var tr_trail = 'Truck';
        if(truckTrailer == 1) {
            tr_trail = 'Trailer';
        }
        
        $('#addVehicle .alert').remove();
		var errors = 0;

        if($('#edit_tr_Name').val() == ''){
            $('#edit_tr_Name').addClass('error');
            alertError(addVehicleModal.find('.modal-body'), 'Fleet ' + tr_trail + ' number cannot be empty');
            errors = 1;
        }
        var nameRegex = /^([a-zA-Z0-9#№-\s]+)$/;
        c(nameRegex.test($('#edit_tr_Name').val()));
        if (!nameRegex.test($('#edit_tr_Name').val())) {
            $('#edit_tr_Name').addClass('error');
            alertError(addVehicleModal.find('.modal-body'), 'Unit is incorrect');
            errors = 1;
        }
        
        var vinRegex = /^([A-HJ-NPR-Z0-9]){17}$/;
        var truck_VIN = $('#edit_tr_VIN').val();
        if (!vinRegex.test(truck_VIN) && truck_VIN!='') {
            $('#edit_tr_VIN').addClass('error');
            alertError(addVehicleModal.find('.modal-body'), tr_trail + ' VIN is incorrect');
            errors = 1;
        }
		
		$('#addVehicle .addVehicleFormGroup .ez_input').each(function () {
            var fname = $(this).attr('id');
            fname = fname.substring(8);
            if ($(this).val() != ''){
                if ($(this).hasClass('datepicker')){ c('datepicker'); c($(this).val());
					if(!moment($(this).val(), 'MM-DD-YYYY', true).isValid()){
						$(this).addClass('error');
						errors = 1;
					} else {
						data[fname] = convertDateToSQL($(this).val());
					}
                } else {
                    data[fname] = $(this).val();
                }
            }
        });
		
		if(errors == 1){
			return false;
		}

        data['isActive'] = $('#edit_tr_isActive .active').attr('data-val');
        
        c(data);
        
//        AjaxController('addEquipment', data, MAIN_LINK + '/db/dashController/', addVehicleHandle, addVehicleHandle, true);
        AjaxController('addEquipment', data, apiDashUrl, self.addVehicleHandle, self.addVehicleHandle, true);
        
        $('#addVehicle button[data-dismiss="modal"]').click();
    }
    
    self.addVehicleHandle = function(response) {
        c(response);
        if(response.code == '000'){
            if (window.location.pathname !== "/dash/") {
                self.getAllTruckTrailerPagination.request();
                alertMessage($('#message'), 'Vehicle was added', 3000);
            }
        }else{
            alertError($('#message'), response.message, 3000);
        }
    }
    
    self.showDownloadPDFPopap = function () {
        var title = 'Equipment Report PDF Settings';
        var message = `<div class="row">
            <div class="box_row_info">
                <label class="col-sm-4">Truck/Trailer</label>
                <div class="col-sm-8">
                    <div class="check_buttons_block with_aobrd" style="width: 100%;" id="truck_trailer">
                        <button class="btn btn-default" onclick="doActive(this);" data-val="0">Truck</button>
                        <button class="btn btn-default" onclick="doActive(this);" data-val="1">Trailer</button>
                        <button class="btn btn-default active" onclick="doActive(this);" data-val="2">All</button>
                    </div>
                </div>
            </div>
            <div class="box_row_info">
                <label class="col-sm-4">Active/Not Active</label>
                <div class="col-sm-8">
                    <div class="check_buttons_block with_aobrd" style="width: 100%;" id="act_notact">
                        <button class="btn btn-default" onclick="doActive(this);" data-val="1">Active</button>
                        <button class="btn btn-default" onclick="doActive(this);" data-val="0">Not Active</button>
                        <button class="btn btn-default active" onclick="doActive(this);" data-val="2">All</button>
                    </div>
                </div>
            </div>
        </div>`;
        var id = 'equipment_pdf_report_popap';
        showModal(title, message, id, '', {footerButtons: `<button class="btn btn-default" onclick="equipmentC.genereteEquipmentPDFReport()">Generate PDF</button>`});
    }
    
    self.genereteEquipmentPDFReport = function () {
        var params = {};
        params.carrierId = fleetC.id;
        params.truck_trailer = $('#truck_trailer .active').attr('data-val');
        params.active = $('#act_notact .active').attr('data-val');
        
        pdfGen.generateAndSendForm(params, {'action': 'fleetEquipment'});
        $('#equipment_pdf_report_popap').remove();
    }
    
}

equipmentC = new EquipmentController();