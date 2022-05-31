function cameraCard(cameraId, params = {}) {
    var self = this;
    //changable part
    self.cntrlUrl = apiDashUrl;
    self.id = cameraId;
    self.tableId = 'cameraCard_' + self.id;
    self.modalId = 'camera_modal_card';
    self.modalTitle = 'Camera Card Info ';
    self.forceSearchParams = [{key: 'id', val: self.id}]
    //some additional init params
    self.returnData = {};

    //not changable part
    self.params = params;
    self.modalElement = '';
    modalCore(self);
    self.paginator = false;
    self.tabs = [];

    self.initRequest = function () {
        AjaxController('getCameraCardInit', {id: self.id}, self.cntrlUrl, self.init, self.init, true);
    }
    self.init = function (response) {
        //retrieving init response
        self.cameraData = response.data.cameraData;
        self.apiData = response.data.apiData;

        //always call
        self.generateHeaders();
        self.generateButtons();
        self.createModal();

        //additional clicks
        self.modalElement.find('.bindSNBtn').click(self.bindSNBtnClick)
        self.modalElement.find('.selectUnitBtn').click(self.selectUnitBtnClick)
        
        self.modalElement.find('.modal_card_table').prepend(`<div class="score_box" >
            <div class="video_box video_box1"><span>Loading...</span></div>
        </div>`)
        if(self.apiData.NoCameras == 2){
            self.modalElement.find('.score_box').prepend(`<div class="video_box video_box2"><span>Loading...</span></div>`)
            self.modalElement.find('.score_box').addClass('twoVideos')
        }
        if(!self.apiData.DeviceStatusDV == 'Installed'){
            self.modalElement.find('.video_box').text('Device not Active')
        }else{
            self.startVideo();
        }
        self.initYearMonthPicker();
    }
    self.initYearMonthPicker = function(){
        self.modalElement.find('.dateyearmonthpicker').datepicker({
            dateFormat: "mm-yy",
            changeMonth: true,
            changeYear: true,
            showButtonPanel: true,
            onClose: function(dateText, inst) {
                function isDonePressed(){
                    return ($('#ui-datepicker-div').html().indexOf('ui-datepicker-close ui-state-default ui-priority-primary ui-corner-all ui-state-hover') > -1);
                }
                if (isDonePressed()){
                    var month = $("#ui-datepicker-div .ui-datepicker-month :selected").val();
                    var year = $("#ui-datepicker-div .ui-datepicker-year :selected").val();
                    $(this).datepicker('setDate', new Date(year, month, 1)).trigger('change');
                    $('.dateyearmonthpicker').focusout().keyup()//Added to remove focus from datepicker input box on selecting date
                }
            },
            beforeShow : function(input, inst) {
                inst.dpDiv.addClass('month_year_datepicker')
                if ((datestr = $(this).val()).length > 0) {
                    year = datestr.substring(datestr.length-4, datestr.length);
                    month = datestr.substring(0, 2);
                    $(this).datepicker('option', 'defaultDate', new Date(year, month-1, 1));
                    $(this).datepicker('setDate', new Date(year, month-1, 1));
                    $(".ui-datepicker-calendar").hide();
                }
            }
        });
    }
    self.startVideo = function(){
        if(!self.apiData.RecorderID || !getModalCardObject('cameraCard', this.id)){
            self.modalElement.find('.video_box').html('<span>Cant find device</span>')
            return 1
        };
        var CameraChannel = self.apiData.NoCameras == 2 ? '1,2' : '1';
        AjaxCall({action:'getSnapshotURL', data:{recorderID: self.apiData.RecorderID,CameraChannel:CameraChannel}, url:apiDashUrl, successHandler:self.getSnapshotURLHandler, errorHandler:self.getSnapshotURLErrorHandler});
    }
    
    self.getSnapshotURLHandler = function(response){
        $.each(response.data.SnapshotURLData, (key, snapshot) => {
            if(snapshot && typeof snapshot.URL != 'undefined'){
                if(self.modalElement.find('.video_box'+snapshot.Camera+' img').length == 0){
                    self.modalElement.find('.video_box'+snapshot.Camera).html('<img src="https://smartwitness.modularis.com'+snapshot.URL+'" />')
                    self.modalElement.find('.video_box'+snapshot.Camera).append('<span class="cam_info cam_speed"></span');
                    self.modalElement.find('.video_box'+snapshot.Camera).append('<span class="cam_info cam_lat"></span');
                    self.modalElement.find('.video_box'+snapshot.Camera).append('<span class="cam_info cam_lng"></span');
                    self.modalElement.find('.video_box'+snapshot.Camera).append('<span class="cam_info cam_time"></span');
                    self.modalElement.find('.video_box'+snapshot.Camera).append('<span class="cam_info cam_type"></span');
                }
                self.modalElement.find('.video_box'+snapshot.Camera+' img').attr('src', 'https://smartwitness.modularis.com'+snapshot.URL)
                self.modalElement.find('.video_box'+snapshot.Camera+' .cam_speed').text(km2miles(snapshot.Speed)+' MPH');
                self.modalElement.find('.video_box'+snapshot.Camera+' .cam_lat').text('LAT: '+snapshot.Latitude);
                self.modalElement.find('.video_box'+snapshot.Camera+' .cam_lng').text('LNG: '+snapshot.Longitude);
                self.modalElement.find('.video_box'+snapshot.Camera+' .cam_time').text(moment(snapshot.EndDateTime).format('MM-DD-YYYY hh:mm:ss A'));
                self.modalElement.find('.video_box'+snapshot.Camera+' .cam_type').text('CAM: '+snapshot.Camera);
                
                
                
            }
        })
        self.startVideo();
    }
    
    self.getSnapshotURLErrorHandler = function(response){
        self.modalElement.find('.video_box').html('<span>'+response.message+'</span>')
    }
    
    self.generateHeaders = function () {
        var headers = [];
        var unit = self.cameraData.unitId > 0 ? truckCardLink(self.cameraData.unitId, self.cameraData.unitName) : 'No Unit';
        var moveStatus = getCameraMovingStatusFromStatusId(self.cameraData.moveStatus);
        var deviceStatus = getScannerStatusFromStatusId(self.cameraData.deviceStatus);
        self.oneColumnHeader = true;
        headers.push({label: 'Id', value: self.cameraData.id});
        headers.push({label: 'S/N', value: self.cameraData.serialNumber || 'No SN yet'});
        headers.push({label: 'Unit', value: unit});
        headers.push({label: 'Device Status', value: deviceStatus});
        headers.push({label: 'Status', value: '<span class="label label-' + moveStatus.statusName + '">' + moveStatus.statusName + '</span>'});
        self.setCardHeaders(headers)
    }
    self.generateButtons = function () {
        var buttons = [];
        if(curUserIsEzlogzEmployee()){
            buttons.push('<button class="btn btn-default bindSNBtn">Bind Serial Number</button>');
        }else{
            buttons.push('<button class="btn btn-default selectUnitBtn blockForDispatcher">Select Camera Unit</button>');
        }
        self.setCardActionsButtons(buttons);

        self.tabs.push({
            label: 'Event History',
            cl: 'cam_events_his',
            request: 'getCameraEventsPagination',
            handler: 'getCameraEventsPaginationHandler',
            initSort: {param: 'id', dir: 'desc'},
            tableHeader: `<tr>
                <th data-type="eventId" style="width:81px;">Event Id</th>
                <th data-type="monthYear">Date Time</th>
                <th data-type="eventType">Event Type</th>
                <th data-type="unitName">Unit</th>
            </tr><tr>
                <td><input class="paginationInput" placeholder="Id" type="text"></td>
                <td><input class="paginationInput dateyearmonthpicker" placeholder="Year and Month" type="text" value="${moment().format('MM-YYYY')}"></td>
                <td><input class="paginationInput" placeholder="Event Type" type="text"></td>
                <td><input class="paginationInput" placeholder="Unit" type="text"></td>
            </tr>`
        });
        if(curUserIsEzlogzEmployee())
        self.tabs.push({
            label: 'Device History',
            cl: 'cam_device_his',
            request: 'getCameraDeviceHistoryPagination',
            handler: 'getCameraDeviceHistoryPaginationHandler',
            initSort: {param: 'id', dir: 'desc'},
            tableHeader: `<tr>
                <th style="width: 62px;">Id</th>
                <th style="width: 134px;">Date Time Local</th>
                <th>Parameters Changed</th>
                <th>Initiator</th>
                <th>Carrier</th>
            </tr></td>
        </tr>`
        });
        self.setCardTabs(self.tabs);
    }
    
    self.getCameraDeviceHistoryPaginationHandler = function(response){
        var tbody = '';
        response.data.result.forEach((item) => {
            var carrier = item.carrierId > 0 ? item.carrierName +'('+item.usdot+')' : '';
            var paramsStr = '';
            $.each(item.params, function(key, val){
                paramsStr+=getParameterString(key, val);
            })
            tbody += `<tr> 
                <td>${item.id}</td>
                <td>${timeFromSQLDateTimeStringToUSAString(item.dateTimeUTC)}</td>
                <td>${paramsStr}</td>
                <td>${item.initiatorName}</td>
                <td>${carrier}</td>
            </tr>`;
        });
        self.modalElement.find('#' + self.tableId).find('tbody').html(tbody);
    }
    
    self.getCameraEventsPaginationHandler = function (response) {
        self.initYearMonthPicker();
        var tbody = '';
        response.data.result.forEach((item) => {
            tbody += '<tr>\n\
                <td>' + item.id + '</td>\n\
                <td>' + moment(item.dateTime, 'YYYY-MM-DD hh:mm:ss').format('MM-DD-YYYY hh:mm:ss A') + '</td>\n\
                <td>' + item.eventType + '</td>\n\
                <td>' + item.unitName + '</td>\n\
            </tr>';
        });
        self.modalElement.find('#' + self.tableId).find('tbody').html(tbody);
    }
    self.bindSNBtnClick = function(){
        bindSNModal(self.id)
    }
    self.selectUnitBtnClick = function(){
        equipmentC.getAllUnits(self.selectUnitGetUnitsList)
    }
    self.selectUnitGetUnitsList = function(response){
        var unitsList = '';
        $.each(response.data.units, (key, unit) => {
            unitsList+='<option value="'+unit.id+'">'+unit.Name+'</option>'
        })
        var body = `<div class="form-horizontal ">
            <div class="form-group ">
                <div class="col-sm-12">
                    <label for="invite_name">Select Unit from the list</label>
                    <select id="select_unit_input" class="form-control" >
                        <option value="0">No Unit</option>${unitsList}
                    </select>
                </div>
            </div>
            <div id="bind_mac_error_box"></div>
        </div>`;
        showModal('Select Camera Unit', body, 'select_unit_modal', '', {footerButtons: `<button class="btn btn-default" id="selectUnitSaveBtn" >Save</button>`})
        if(self.cameraData.unitId){
            $('#select_unit_input').val(self.cameraData.unitId)
        }
        $('#selectUnitSaveBtn').click(self.updateCameraUnitBtnClick)
    }
    self.updateCameraUnitBtnClick = function(){
        $('#selectUnitSaveBtn').attr('disabled', true);
        var unitId = $('#select_unit_input').val();
        AjaxCall({action:'updateCameraUnit', data:{unitId: unitId, cameraId: self.id}, url:apiDashUrl, successHandler:self.updateCameraUnitHandler, errorHandler:self.updateCameraUnitErrorHandler});
        
    }
    self.updateCameraUnitErrorHandler = function(response){
        $('#selectUnitSaveBtn').attr('disabled', false);
        alertError($('#select_unit_modal').find('.modal-body'), response.message);
    }
    self.updateCameraUnitHandler = function(response){
        $('#selectUnitSaveBtn').attr('disabled', false);
        $('#select_unit_modal .close').click()
        new cameraCard(self.id);
    }
    self.initRequest();
}
function bindSNModal(cameraId){
    var body = `<div class="form-horizontal ">
        <div class="form-group ">
            <div class="col-sm-12">
                <label for="invite_name">Select Serial Number</label>
                <input id="select_sn_input" type="text" class="form-control" placeholder="Mac Addres" onkeyup="findFreeSN(this)"/>
                <div id="select_mac" style="top: 55px;left: 15px;">
                    <div id="select_mac_list"></div>
                </div>
            </div>
        </div>
        <div id="bind_mac_error_box"></div>
    </div>`;
    showModal('Bind Mac', body, 'bind_mac_modal', '', {footerButtons: `<button class="btn btn-default" id="bind_button" onclick="bindSNConfirm(${cameraId})">Bind</button>`})
    findFreeSN();
}
function bindSNConfirm(cameraId) {
    var serialNumberId = $('#select_sn_input').attr('data-id');
    AjaxCall({action:'bindSN', data:{serialNumberId: serialNumberId, cameraId: cameraId}, url:apiAdminUrl, successHandler:bindSNHandler, errorHandler:bindSNErrorHandler});
}
function bindSNHandler(response){
    $('#bind_mac_modal .close').click();
    if ($('#orderCard_' + response.data.orderId).length > 0)
        new orderCard(response.data.orderId)
    if ($('#cameraCard_' + response.data.cameraId).length > 0)
        new cameraCard(response.data.cameraId);
	if ($('#camera_table tr[scannerid="' + response.data.cameraId+'"]').length > 0)
		$('#camera_table select.paginationInput').first().change()
}
function bindSNErrorHandler(response){
    setError($('#bind_mac_error_box'), response.message);
}
function findFreeSN(el){
    var filter = $('#select_sn_input').val();
    $('#select_sn_input, #select_mac').show();
    $('#select_mac input').attr('data-id', 0).removeClass('error');
    if (filter == '') {
        $('#select_mac_list').empty()
    }
    $('#bind_button').prop('disabled', true);
    AjaxCall({action:'findFreeDeviceMac', data:{filter: filter}, url:apiAdminUrl, successHandler:findFreeSNHandler});
}
function findFreeSNHandler(response){
    var str = '';
    $.each(response.data.serialNumbers, function (key, cameraRaw) {
        str += `<p class="one_mac" data-id="${cameraRaw.id}" onclick="selectedBindSN(this);" style="cursor:pointer;">${cameraRaw.SerialNo}</p>`;
    })
    str = str == '' ? 'No Mac addresses found' : str;
    $('#select_mac_list').empty().append(str);
}
function selectedBindSN(el) {
    var setialNumberId = $(el).attr('data-id');
    var macVal = $(el).text();
    $('#select_mac').hide();
    $('#select_sn_input').val(macVal);
    $('#select_sn_input').attr('data-id', setialNumberId)
    $('#bind_button').prop('disabled', false);
}

function getCameraMovingStatusFromStatusId(statusId) {
    var statusName = 'Parked',
        classColor = 'cameraStatusParked';

    switch (Number(statusId)) {
        case 0:
            statusName = 'Parked';
            classColor = 'cameraStatusParked';
            break;
        case 1:
            statusName = 'Idle';
            classColor = 'cameraStatusIdle';
            break;
        case 2:
            statusName = 'Moving';
            classColor = 'cameraStatusMoving';
            break;
    }
    return {statusName, classColor, statusId};
};
function cameraCardLink(id, serialNumber, moveStatus = false) {
    serialNumber = serialNumber || 'No Serial Number';
    var moveStatus = getCameraMovingStatusFromStatusId(moveStatus);
    serialNumber = (serialNumber.length > 17) ? serialNumber.substr(0, 17) + '&hellip;' : serialNumber;
    var imgSrc = '/dash/assets/svg/camera/camera_'+moveStatus.statusName+'.svg';
    return '<span onclick="new cameraCard('+id+')" data-id="' + id + '" class="clickable_item one_camera"><img src="'+imgSrc+'" alt="cam icon"/>' + serialNumber + '</span>';
}