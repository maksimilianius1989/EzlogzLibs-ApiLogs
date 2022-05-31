var roles = {
    1: 'Solo Driver',
    2: 'Fleet'
};
var scanersInfo = {lastAction: null};
function searchFleetOrUser(){
    var head = 'Search Fleet/Users';
    var content = `
            <div class="box_row" style="margin-bottom:10px;">
                <div class="check_buttons_block" id="s_type">
                    <button class="btn btn-default active" onclick="doActive(this);changePlaceholderResseler(this);" data-val="user">User</button>
                    <button class="btn btn-default" onclick="doActive(this);changePlaceholderResseler(this);" data-val="fleet">Fleet</button>
                </div>
            </div>
            <div class="box_row search_result_no_overflow" style="margin-bottom:10px;">
                <input type="text" name="find" placeholder="User email" style="width:100%" onkeyup="resselerCSearchFleetOrUser(this);">
                <div id="search_result_flus" style="display:none;" class="modal-drop-panel"></div>
            </div>
            <div class="error"></div>
            `;
    showModal(head,content,'search_fleet_users','modal-sm',{
        footerButtons:`<button class="btn btn-default" onclick="resselerSearchFleetOrUser();" data-dismiss="modal">Search</button>`
    });
}
function changePlaceholderResseler(el){
    var value = $(el).attr('data-val');
    $('.modal .modal-content .modal-body input[name="find"]').val('');
    $('#search_result_flus').hide();
    $('#search_result_flus').empty();
    if(value == 'user'){
        $('.modal .modal-content .modal-body input[name="find"]').attr('placeholder','User email');
    } else {
        $('.modal .modal-content .modal-body input[name="find"]').attr('placeholder','Fleet name or USDOT');
    }
}
function resselerCSearchFleetOrUser(el) {
    var element = $(el);
    var sType = $('#s_type .active').attr('data-val');

    if($.trim(element.val()) == ''){
        $('#search_result_flus').hide();
        $('#search_result_flus').empty();
        return false;
    }

    var data = {};
    data['type'] = sType;
    data['find'] = element.val();

    AjaxController('resselerSearchFleetOrUser', data, adminUrl, 'resselerCSearchFleetOrUserHandler', errorBasicHandler, true);
}
function resselerSearchFleetOrUser(){
    var sType = $('#s_type .active').attr('data-val');
    var find = $('.modal .modal-content .modal-body input[name="find"]').val();
    c('Type: ' + sType + ' Search: ' + find);

    var data = {};
    data['type'] = sType;
    data['find'] = find;

    AjaxController('resselerSearchFleetOrUser', data, adminUrl, 'resselerSearchFleetOrUserHandler', errorBasicHandler, true);
}
function resselerCSearchFleetOrUserHandler(response) {
    c(response);
    $('#search_result_flus').empty();
    if(response.code == '000'){
        var data = response.data;
        if(data.error == 0){
            if(data.type == 'user'){
                $.each(data.users, function(key, val){
                    $('#search_result_flus').append(`<div data-id="${val.id}" data-type="${data.type}" data-email="${val.email}" onclick="checkResellerFleetOrUser(this);">${val.name} ${val.last} (${val.email})</div>`);
                });
            } else {
                $.each(data.carriers, function(key, val){
                    $('#search_result_flus').append(`<div data-id="${val.id}" data-type="${data.type}" data-usdot="${val.usdot}" onclick="checkResellerFleetOrUser(this);">${val.name} (${val.usdot})</div>`);
                });
            }
        }
        $('#search_result_flus').show();
    }
}
function checkResellerFleetOrUser(el){
    var element = $(el);
    if(element.attr('data-type') == 'user'){
        $('.modal .modal-content .modal-body input[name="find"]').val(element.attr('data-email'));
    } else {
        $('.modal .modal-content .modal-body input[name="find"]').val(element.attr('data-usdot'));
    }
    $('#search_result_flus').hide();
    $('#search_result_flus').empty();
}
function resselerSearchFleetOrUserHandler(response) {
    c(response);
    if(response.code == '000'){
        var data = response.data;
        if(data.error == 0){
            if(data.type == 'user'){
//                AjaxController('getUsersInfo', {'userId':data.users[0].id}, adminUrl, 'getOneUserInfoHandler', errorBasicHandler, true);
                new fleetUserCard(data.users[0].id);
            } else if(data.type == 'fleet'){
                actionGlobalgetOneCarrierInfo(data.carriers[0].id);
            }
        } else {
            $('.modal .modal-content .modal-body .error').empty().text('No result found');
        }
    }
}
function getELDscannersHandler(response){
    var scanners = response.data;
    if(scanners.length > 0 && scanersInfo.lastAction == 'update'){
        if(scanners[0].terminated == true){
            $('#admin_manage_eld #eld_table tr[scannerid = "'+scanners[0].id+'"]').remove()
        }else{
            updateScannerAdmin(scanners[0]);
            if($('#eldDeviceCard_'+scanners[0].id).length > 0){
                new eldDeviceCard(scanners[0].id);
            }
        }
        $('#eld_popup').hide();
    }
    scanersInfo.lastAction = null;
}
function upToEld(el){
    var scannerId = $(el).closest('tr').attr('scannerid');
    scanersInfo.lastAction = 'update';
    AjaxController('upToEld', {scannerId:scannerId}, adminUrl, 'getELDscannersHandler', errorBasicHandler, true);
}
function deleteMacAddress(scannerId, ev = false){
    if(ev)ev.stopPropagation();
    scanersInfo.lastAction = 'update';
    AjaxController('deleteMacAddress', {scannerId:scannerId}, adminUrl, 'getELDscannersHandler', errorBasicHandler, true);
}
function getScannerTableLine(scanner)
{
    var scannerStatus = getScannerStatusFromStatusId(scanner.status, scanner.params);
    if(scanner.demo == 1){
        var time = new Date(scanner.demoDate*1000);
        time = addMonthsUTC(time,1 );
        time.setDate(time.getDate() + 7);

        var theyear = time.getFullYear();
        var themonth = time.getMonth() + 1;
        var thetoday = time.getDate();
        var endDate = themonth + "-" + thetoday + "-" + theyear;
        scannerStatus +=`<br/>(Demo till ${endDate})`;
    }
    var aobrd = '';
    if(scanner.type == 1)
        aobrd = '(AOBRD)';
    if(scanner.status == 4 && scanner.BLEAddress !== null && scanner.BLEAddress != ''){
        var light = 'green';
    }else if(scanner.status == 4 && (scanner.BLEAddress == null || scanner.BLEAddress == '')){
        var light = 'orange';
    }else{
        var light = 'red';
    }
    light = '<span class="eld_light " style="width: 6px;height: 6px;background: '+light+';display: inline-block;border-radius: 50%;margin-right: 5px;"></span>'

    var delButton = '';
    var updownbutton = '';
    if(position == TYPE_SUPERADMIN || (typeof superAdminRights.clearMac != 'undefined' && superAdminRights.clearMac == 1)){
        if(scanner.bindId == null){
            delButton = '<button onclick="deleteMacAddress('+scanner.id+', event)" class="btn btn-default">Delete</button>';
        }else{
            delButton = '<button onclick="deleteMacAddress('+scanner.id+', event)" class="btn btn-default">Del/Unbind</button>';
        }

        if(scanner.BLEAddress == null){
            delButton = '';
            scanner.BLEAddress = '';
        }
    }
    if(position == TYPE_SUPERADMIN || (typeof superAdminRights.clearMac != 'undefined' && superAdminRights.clearMac == 1)){
        if(scanner.status == 4 && scanner.type == 1){
            updownbutton = '<button onclick="upToEld(this)" class="btn btn-default" style="width: 110px;padding-left: 2px;padding-right: 2px;">Update to ELD</button>';
        }
    }
    var nameData = scanner.fleetName+'('+scanner.userId+')';
    if(scanner.soloOrFleet == 2) {
        nameData = '<span class="global_carrier_info clickable_item" title="Carrier Info" data-carrid="'+scanner.carId+'" onclick="actionGlobalgetOneCarrierInfo(this, event);" style="cursor: pointer;">'+scanner.fleetName+'('+(scanner.fleet !== null ? scanner.fleet : '')+')</span>';
    }else{
        nameData = '<span class="global_carrier_info clickable_item" title="User Info" data-userid="'+scanner.userId+'" onclick="getOneUserInfo(this, event);" style="cursor: pointer;">'+scanner.fleetName+'('+scanner.userId+')</span>';
    }
    if(scanner.recAmount != null){
        nameData += '<br>(rec $'+scanner.recAmount+' p/m)';
    }
    var line = '<tr onclick="getEldCard('+scanner.id+', this, event)" scannerid = "'+scanner.id+'" status = "'+scanner.status+'" regid = "'+scanner.registrationNumber+'">\n\
        <td>'+(scanner.id !== null ? scanner.id : '')+'</td>\n\
        <td class="copyTooltip"><span class="device_mac">'+(scanner.BLEAddress !== null ? scanner.BLEAddress +'</span>'+ delButton : '')+'</td>\n\
        <td>'+(scanner.soloOrFleet !== null ? roles[scanner.soloOrFleet] : '')+'</td>\n\
        <td class="copyTooltip fleetName">'+(scanner.fleetName !== null ? nameData : '')+'</td>\n\
        <td class="copyTooltip">'+(scanner.usdot !== null ? '<span class="global_carrier_info clickable_item" title="Carrier Info" data-carrid="'+scanner.carId+'" onclick="actionGlobalgetOneCarrierInfo(this, event);" style="cursor: pointer;">'+scanner.usdot+'</span>' : '')+'</td>\n\
        <td class="copyTooltip">'+(scanner.version !== null ? scanner.version : '')+'</td>\n\
		<td>'+timeFromSQLDateTimeStringToUSAString(scanner.lastUse)+'</td>\n\
        <td>'+light+scannerStatus+aobrd+'</td>\n\
        <td>'+getScannerButtons(scanner.status)+updownbutton+'</td>\n\
    </tr>';
    return line;
}
function showELDpopap(el, e)
{
    e.stopPropagation();
    var scannerId = parseInt($(el).closest('tr').attr('scannerid')),
        status  = parseInt($(el).closest('tr').attr('status')),
        popup = $('#eld_popup'),
        newStatus = '', popupText = '';

    switch(status)
    {
        case 1: newStatus = 2; popupText = '<div class="box_row" style="text-align:center;">\n\
                    Device Ready for delivery\n\
                </div>';break;
        case 2: newStatus = 3; popupText = 'By Clicking Save you approve that scanner was sent to the client';break;
        case 9: newStatus = 999; popupText = 'By Clicking Save you terminate the scanner totally';break;

    }
    popup.attr('newstatus', newStatus).attr('scannerid', scannerId).show().find('#info').html(popupText);
}
function changeScannerStatus()
{
    var newStatus = $(this).parents('.one_part_box').attr('newstatus'),
        scannerId = $(this).parents('.one_part_box').attr('scannerid'),
        data = {id: scannerId, status: newStatus};
    if(newStatus == 2){
        data.registration_number = $('#registration_number').val();
        data.bl_address = $('#bl_address').val();
    }
    scanersInfo.lastAction = 'update';
    AjaxController('changeEldStatus', data, adminUrl, 'getELDscannersHandler', errorBasicHandler, true);
}

//Update Order Notes
function changeOrderNotes(el) {
    if ($('#editOrderBox').length > 0) {
        removeEditOrderBox();
    } else {
        $(el).closest('p').append('<p id="editOrderBox"><label>Edit Order Notes</label><textarea id="update_order_note">' + $('#orderNotes').text() + '</textarea><br /><button class="btn btn-default" onclick="removeEditOrderBox(this)">Cancel</button><button class="btn btn-default" onclick="updateOrderNotes(this)">Save</button></p>')
    }
}
function updateOrderNotes(el) {
    var notes = $('#update_order_note').val();
    removeEditOrderBox();
    AjaxController('updateOrderNotes', {orderId: $('#eld_popup #info').data('id'), notes: notes}, adminUrl, 'updateOrderHandler', errorBasicHandler, true);
}
function updateOrderHandler(response) {
    removeEditOrderBox();
    getOneOrderHandler(response);
}
function removeEditOrderBox(){
    $('#editOrderBox').remove();
}

//Replace minus in input
$(document).off('input', '.cable_quantity input[type="number"]').on('input', '.cable_quantity input[type="number"]', function(e) {
    /^\d*$/.test($(this).val()) || $(this).val($(this).val().replace(/\D+/g, ''));
    if($(this).val() > 999){
        $(this).val(999);
    }
});

function needSaveNewOrder(){
    $('.save_new').show();
}

function checkboxChange(el) {
    var idName = $(el).attr('id');
    if(el.checked) {
        $('#'+idName+'-box').fadeIn('slow');
    } else {
        $('#'+idName+'-box').fadeOut('slow');
    }
}

$('body').on('input', '#info .tri input', function(){
    c('oninput');
    this.value = this.value.replace(/ /g, "").replace(/_/g, "-").replace(/\.+/g, ".").replace(/\-+/g, "-").replace(/[^\w.-]|^[.-]/g, "");
});

function demoOrder(el){
    $('#eld_popup').hide();
    var reqId = $(el).attr('data-id');
    var request = {};
    $.each(demo_requests, function(key, requestLoc){
        if(requestLoc.id == reqId){
            request  =requestLoc;
            return true;
        }
    })
    createOrder();
    $('#is_demo_eld').prop('checked', true);
    if(!$('#createEldFleet').is(':visible')){
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
}
function ELDOrder(el){
    var id = $(el).attr('data-id');
    AjaxController('getEldBuyNowOneRequest', {'id': id}, adminUrl, 'FillELDOrders', errorBasicHandler, true);
}
function FillELDOrders(response) {
    if(typeof response.data == undefined || response.data == '')
        return '';
    var f = response.data;

    $('#buy_now_popup').hide();
    createOrder();
    $('#is_demo_eld').prop('checked', false);
    if(!$('#createEldFleet').is(':visible')){
        $('.newFleet').click();
    }
    if(!$('#createEldUser').is(':visible')){
        $('.newUser').click();
    }
    $('#reg_fl_car_name').val(f.companyName)
    $('#reg_fl_email').val(f.email);
    $('#reg_fl_name, #first_name').val(f.name);
    $('#reg_fl_last, #last_name').val(f.surname);
    $('#reg_fl_phone, #phone').val(f.phone);
    $('#reg_fl_size').val(f.size);
    $('#number_device').val(f.quantity);
}
function pickELDDemoRequestHandler(response){
    var id = response.data.id;
    var status = getRequestStatusById(response.data.status);
    $(`#eld_demo_table tr[data-id=${id}] td`).last().text(status)
    AjaxController('getELDDemoOneRequest', {id:id}, adminUrl, 'getELDDemoRequestHandler', errorBasicHandler, true);
}
function getOneRequest(el) {
    var id = $(el).attr('data-id');
    AjaxController('getELDDemoOneRequest', {id:id}, adminUrl, 'getELDDemoRequestHandler', errorBasicHandler, true);
}
function pickELDDemoRequest(el){
    var id = $(el).attr('data-id');
    AjaxController('pickELDDemoRequest', {id:id}, adminUrl, 'pickELDDemoRequestHandler', errorBasicHandler, true);
}
function updateELDDemoRequest(el){
    var id = $(el).attr('data-id');
    var status=$(el).parent().prev().find('#buyNowStatus').val();
    AjaxController('updateELDDemoRequest', {id:id, status:status}, adminUrl, 'pickELDDemoRequestHandler', errorBasicHandler, true);
}

function getELDDemoRequestHandler(response){
    var requestData = response.data;
    managerText = '';
    if(requestData.managerName != null){
        managerText=`<div class="col-md-3">Sales:</div><div class="col-md-9">${requestData.managerName} ${requestData.managerLastName}</div><div class="col-md-12"><p></p></div>`;
        managerText+='<div class="col-md-3"><select id="buyNowStatus"><option value="1">Picked</option><option value="2">Called</option><option value="3">Closed</option></select></div>';
        managerText+=`<div class="col-md-9"><button class="btn btn-default mob_margin_top_10" style="margin: 0px;" onclick="updateELDDemoRequest(this)" data-id="${requestData.id}">Update Request</button></div>`;
    }else{
        managerText=`<div class="col-md-offset-3 col-md-9"><button class="btn btn-default" onclick="pickELDDemoRequest(this)" data-id="${requestData.id}">Pick order</button></div>`
    }
    var d = new Date(requestData.orderDate*1000);
    var orderDate = d.customFormat( "#MM#-#DD#-#YYYY# #hh#:#mm#:#ss#" );
    popupText = `<br /><div class="row">
		<div class="col-md-3">Name:</div>
		<div class="col-md-9">${requestData.name}</div>
		<div class="col-md-3">Email:</div>
		<div class="col-md-9">${requestData.email}</div>
		<div class="col-md-3">Phone:</div>
		<div class="col-md-9">${requestData.phone}</div>
		<div class="col-md-3">Company:</div>
		<div class="col-md-9">${requestData.companyName}</div>
		<div class="col-md-3">Fleet Size:</div>
		<div class="col-md-9">${requestData.size}</div>
		<div class="col-md-3">Order Date:</div>
		<div class="col-md-9">${orderDate}</div>
		${managerText}
		<div class="col-md-offset-3 col-md-9"><button class="btn btn-default" data-id="${requestData.id}" onclick="demoOrder(this);">Order Based on Demo</button></div>
	</div>
    `;

    $('#eld_popup #info').html(popupText);
    $('#eld_popup').show();
    $('#buyNowStatus').val(requestData.status);
    newEventsC.checkNewELDEvents();
}
function getRequestStatusById(statusId){
    var name = '';//0 - new, 1 - picked, 2 - called, 3 - closed
    if(statusId == 0){
        name = 'New';
    }else if(statusId == 1){
        name = 'Picked By Sales';
    }else if(statusId == 2){
        name = 'Called';
    }else if(statusId == 3){
        name = 'Closed';
    }
    return name;
}
// function removePopup(el){
//     $(el).closest('.one_part_box').remove();
// }
function pickBuyNowRequestHandler(response){
    var id = response.data.id;
    var status = getRequestStatusById(response.data.status);
    $(`#eld_buy_now_requests_table tr[data-id=${id}] td`).last().text(status)
    AjaxController('getEldBuyNowOneRequest', {id:id}, adminUrl, 'getEldBuyNowOneRequestHandler', errorBasicHandler, true);
}
function pickRequest(el){
    var id = $(el).attr('data-id');
    AjaxController('pickBuyNowRequest', {id:id}, adminUrl, 'pickBuyNowRequestHandler', errorBasicHandler, true);
}
function updateRequest(el){
    var id = $(el).attr('data-id');
    var status=$(el).prev().val();
    AjaxController('updateRequest', {id:id, status:status}, adminUrl, 'pickBuyNowRequestHandler', errorBasicHandler, true);
}
function getEldBuyNowOneRequestHandler(response){
    var requestData = response.data;
    var managerText = '';
    if(requestData.managerName != null){
        managerText=`<p></p><p>Sales: ${requestData.managerName} ${requestData.managerLastName}</p>`;
        managerText+='<select id="buyNowStatus"><option value="1">Picked</option><option value="2">Called</option><option value="3">Closed</option></select>';
        managerText+=`<button class="btn btn-default" onclick="updateRequest(this)" data-id="${requestData.id}">Update Request</button>`;
    }else{
        managerText=`<button class="btn btn-default" onclick="pickRequest(this)" data-id="${requestData.id}">Pick order</button>`
    }
    var d = new Date(requestData.orderDate*1000);
    var orderDate = d.customFormat( "#MM#-#DD#-#YYYY# #hh#:#mm#:#ss#" );
    $('.buy_now_box').remove();
    $('body').append(`<div class="one_part_box buy_now_box" id="buy_now_popup" style="display:block;">
    <div class="popup_box_panel" style="width: 350px;">
        <h2 class="box_header">Buy Now Request</h2>
        <button class="close_edit">X</button>
		<p>Name Surname: ${requestData.name} ${requestData.surname}</p>
        <p>CompanyName(usdot): ${requestData.companyName}(${requestData.usdot})</p>
		<p>Email: ${requestData.email}</p>
		<p>Phone: ${requestData.phone}</p>
		<p>quantity: ${requestData.quantity}</p>
		<p>Date: ${orderDate}</p>
		<p>${managerText}</p>
		<p><button class="btn btn-default" data-id="${requestData.id}" onclick="ELDOrder(this);">Order based on Request</button></p>
    </div>
</div>`)
    $('#buyNowStatus').val(requestData.status);
    newEventsC.checkNewELDEvents();
}
function showOneBuyNow(el){
    var id = $(el).attr('data-id');
    AjaxController('getEldBuyNowOneRequest', {id:id}, adminUrl, 'getEldBuyNowOneRequestHandler', errorBasicHandler, true);
}
function getOrderCreatorPosition(creatorPosition){
    var pos = 'Client';
    if([TYPE_EMPLOYEE, TYPE_SUPERADMIN, TYPE_EZLOGZ_MANAGER, TYPE_EZLOGZ_RESELLER].indexOf(creatorPosition) > -1){
        if(creatorPosition == TYPE_EZLOGZ_RESELLER){
            pos = 'Reseller';
        }else{
            pos = 'Manager';
        }
    }
    return pos;
}
function getMalfunctinsTableLine(malfunction) {
    return `<tr data-malfunction-id="${malfunction.id}">
                <td>${malfunction.id}</td>
                <td><span class="global_carrier_info clickable_item" title="Author Info" data-userid="${malfunction.authorId}" onclick="getOneUserInfo(this, event);" style="cursor: pointer;">${malfunction.authorName} (${malfunction.authorEmail})</span></td>
                <td><span class="global_carrier_info clickable_item" title="Driver Info" data-userid="${malfunction.userId}" onclick="getOneUserInfo(this, event);" style="cursor: pointer;">${malfunction.userName} (${malfunction.userEmail})</span></td>
                <td class="clickable_item" data-orderid = "${malfunction.deviceId}" onclick="getEldCard(${malfunction.deviceId}, this, event);" >${malfunction.deviceId}</td>
                <td class="clickable_item" onclick="clickTruckRow(this, event);" data-id="${malfunction.truckId}">${malfunction.truckId}</td>
                <td>${malfunction.dateTime}</td>
                <td><b>Type: ${malfunction.code}</b> "${getMalfunctionNameFromMalfunctionCode(malfunction.code)}"</td>
            </tr>`;
}
function getEldOrdersTableLine(order)
{
    var nameData = order.fleetName;
    if(order.soloOrFleet == 2) {
        nameData = '<span class="global_carrier_info clickable_item" data-carrid="'+order.carId+'" onclick="actionGlobalgetOneCarrierInfo(this, event);" style="cursor: pointer;">'+order.fleetName+'('+order.usdot+')</span>';
    }else{
        nameData = '<span class="global_carrier_info clickable_item" title="User Info" data-userid="'+order.userId+'" onclick="getOneUserInfo(this, event);" style="cursor: pointer;">'+order.fleetName+'('+order.userId+')</span>';
    }
    var address1 = order.address1 === null || order.address1 === ' ' ? '' : 'Apt ' + order.address1;
    var address = [order.address, address1, order.city, order.stateName, order.zip].filter(item => item).join(', ');
    var orderStatus = getOrderStatus(order);
    return '<tr data-orderid = "'+order.id+'" onclick="getOneOrder(this)"  class="pointer">\n\
        <td>'+(order.id !== null ? order.id : '')+'</td>\n\
		<td>'+ getOrderCreatorPosition(order.creatorPosition)+'</td>\n\
        <td>'+(order.soloOrFleet !== null ? roles[order.soloOrFleet] : '')+'</td>\n\
        <td class="copyTooltip fleetName">'+(order.fleetName !== null ? nameData : '')+'</td>\n\
        <td class="copyTooltip"><span class="global_carrier_info clickable_item" data-carrid="'+order.carId+'" onclick="actionGlobalgetOneCarrierInfo(this, event);" style="cursor: pointer;">'+order.usdot+'</span></td>\n\
		<td class="copyTooltip"><span class="global_carrier_info clickable_item" title="User Info" data-userid="'+order.userId+'" onclick="getOneUserInfo(this, event);" >'+(order.name + ' ' + order.surname)+'</span></td></td>\n\
        <td class="copyTooltip">'+address+'</td>\n\
        <td>'+order.amount+'</td>\n\
        <td>'+(order.overnight === 1 ? 'Yes' : 'No')+'</td>\n\
        <td>'+orderStatus+'</td>\n\
    </tr>';
}
function getEldDemoRequestsTableLine(request)
{
    var status = getRequestStatusById(request.status);
    return '<tr onclick="getOneRequest(this)" data-id= "'+request.id+'" >\n\
        <td>'+request.name+'</td>\n\
        <td>'+request.companyName+'</td>\n\
        <td>'+request.email+'</td>\n\
        <td>'+request.phone+'</td>\n\
        <td>'+request.size+'</td>\n\
        <td>'+status+'</td>\n\
    </tr>';
}
function getEldBuyNowRequestsTableLine(item)
{
    var status = getRequestStatusById(item.status);
    return `<tr style="cursor:pointer;" data-id = "${item.id}" onclick="showOneBuyNow(this)">
        <td>${item.id}</td>
		<td>${item.name}</td>
        <td>${item.surname}</td>
        <td>${item.email}</td>
        <td>${item.phone}</td>
        <td><span class="global_carrier_info clickable_item" title="Carrier Info" data-carrid="${item.carId}" onclick="actionGlobalgetOneCarrierInfo(this, event);" style="cursor: pointer;">${item.usdot}</span></td>
        <td><span class="global_carrier_info clickable_item" title="Carrier Info" data-carrid="${item.carId}" onclick="actionGlobalgetOneCarrierInfo(this, event);" style="cursor: pointer;">${item.companyName}</span></td>
        <td>${item.quantity}</td>
        <td>${status}</td>
    </tr>`;
}
function getOneNewDevice(item)
{
    return `<tr style="cursor:pointer;" data-id = "${item.id}">
        <td>${item.id}</td>
        <td>${item.macId}</td>
        <td>${item.deviceId}</td>
    </tr>`;
}
function eldOrdersSetMultiplyColumnsParams (paramKey, dataObj)
{
    var returnString = '';

    switch(paramKey)
    {
        case 'address':
            var address1 = dataObj.address1 === null || dataObj.address1 === ' ' ? '' : 'Apt ' + dataObj.address1;
            returnString = [dataObj.address, address1, dataObj.city, dataObj.stateName, dataObj.zip].filter(item => item).join(' ');
            break;
        case 'name':
            returnString = dataObj.name + ' ' + dataObj.surname;
            break;
    }
    return returnString;
}
function getELDPaginationHandler(response, tableId){
    var rows = response.data.result;
    var table = $('#'+tableId);
    var tableBody = table.find('tbody');
    tableBody.empty();
    var headers = table.find('thead tr').first().find('th');
    if(rows.length == 0){
        var cols = headers.length;
        tableBody.append('<tr ><td colspan="'+cols+'" style="text-align:center; font-weigth:bolder;">No Data Found</td></tr>')
    }
    funcTd = false;
    switch(tableId){
        case 'eld_demo_table':
            funcTd = 'getEldDemoRequestsTableLine';
            break;
        case 'eld_orders_table':
            funcTd = 'getEldOrdersTableLine';
            break;
        case 'malfunctions_table':
            funcTd = 'getMalfunctinsTableLine';
            break;
        case 'eld_table':
            funcTd = 'getScannerTableLine';
            break;
        case 'eld_new_devices':
            funcTd = 'getOneNewDevice';
            break;
    }
    if(funcTd){
        $.each(rows, function(key, rowData){
            tableBody.append(window[funcTd](rowData));
        });
    }
}
function loadAdminEld(){
    if(position != 13) {
        $('.search_resseler_b').remove();
    }
    var columnsParams = null,
        tableObj = null,
        skipSortParam = [],
        skipSearchParam = [],
        replaceInputParams = {},
        orderByParam = null,
        orderByType = null,
        callbackSearchFunc = null,
        getTableLineFunc = null;
    var availableForUsers = [TYPE_SUPERADMIN, TYPE_EZLOGZ_MANAGER, TYPE_EZLOGZ_RESELLER, TYPE_EMPLOYEE];
    if(availableForUsers.indexOf(position) != -1){
        switch (window.location.pathname) {
            case '/dash/eld/':
                new simplePaginator({
                    tableId: 'eld_table',
                    request: 'searchELDscannersPagination',
                    requestUrl: apiAdminUrl,
                    handler: getELDPaginationHandler,
                    perPageList: [25, 50, 100],
                    defaultPerPage: 50
                })
                break;
            case '/dash/eld_orders/':
                new simplePaginator({
                    tableId: 'eld_orders_table',
                    request: 'getEldOrdersPagination',
                    requestUrl: apiAdminUrl,
                    handler: getELDPaginationHandler,
                    perPageList: [25, 50, 100],
                    defaultPerPage: 50
                });

                break;
            case '/dash/eld/find_malfunctions/':
                new simplePaginator({
                    tableId: 'malfunctions_table',
                    request: 'getMalfunctionPagination',
                    requestUrl: apiAdminUrl,
                    handler: getELDPaginationHandler,
                    perPageList: [25, 50, 100],
                    defaultPerPage: 50,
                });

                break;
            case '/dash/cameraOrders/':
                new simplePaginator({
                    tableId: 'eld_orders_table',
                    request: 'getEldOrdersPagination',
                    requestUrl: apiAdminUrl,
                    handler: getELDPaginationHandler,
                    perPageList: [25, 50, 100],
                    defaultPerPage: 50,
                    customFilters: ['#camerasCheck']
                });

                break;
            case '/dash/eld_demo/':
                new simplePaginator({
                    tableId: 'eld_demo_table',
                    request: 'getEldDemoPagination',
                    requestUrl: apiAdminUrl,
                    handler: getELDPaginationHandler,
                    perPageList: [25, 50, 100],
                    initSort: {param: 'name', dir: 'desc'},
                    defaultPerPage: 50
                });

                break;
            case '/dash/new_devices/':
                new simplePaginator({
                    tableId: 'eld_new_devices',
                    request: 'getEldNewDevicesPagination',
                    requestUrl: apiAdminUrl,
                    handler: getELDPaginationHandler,
                    perPageList: [25, 50, 100],
                    initSort: {param: 'id', dir: 'desc'},
                    customFilters: ['#searchType', '#searchText', '#statusesTypes_select']
                });
                break;
            case '/dash/cameraSN/':
                new simplePaginator({
                    tableId: 'eld_camera_sn',
                    request: 'getCameraSNPagination',
                    requestUrl: apiAdminUrl,
                    handler: getCameraSNPaginationHandler,
                    perPageList: [25, 50, 100],
                    initSort: {param: 'id', dir: 'desc'}
                });
                break;
        }
        newEventsC.checkNewELDEvents();
    }
}
$().ready(function(){
    $('body').off('click', '#eldConfirm').on('click', '#eldConfirm', changeScannerStatus);
    $('body').off('click', '#eld_popup .cancel').on('click', '#eld_popup .cancel', function(){$('#eld_popup').hide();});
    $(document).click(function(event) {
        if(!$(event.target).closest('.drop_list').length) {
            $('.drop_list').addClass('hide');
        }
    });
});
