var scannersArr = [];
var lastAction = '';
var oldStatus = '';
var agreeLease = false;
var agreeService = false;
var agreeLeaseService = false;
var agreeCamera = false;
function orderCUEldErrorHandler(response){
	var errorMessage = response.message;
    setError($('#rowAgreement'), errorMessage);
}
function loopScanners(scanners){
	$.each(scanners, function(key, scannerNew){
		updateScanner(scannerNew);
	});
}
function checkAllEld(el){
	var checked = $(el).prop('checked');
	if(checked){
		$('.eld_check').prop('checked', true);

	}else{
		$('.eld_check').prop('checked', false);
	}
	checkEldActions();
}
function checkEldActions(){
    	$('.bulk_actions').empty().hide();
	var actions = [];
	if($('.eld_check:checked').length > 1){
		$('.eld_check:checked').each(function(){
            actions[$(this).closest('tr').attr('status')] = $(this).closest('tr').attr('status');
		});
        var buttons = '';
        if(actions[0] != undefined || actions[1] != undefined || actions[2] != undefined || actions[10] != undefined) {
        	var act = [];
        	if(actions[0] != undefined)
                act.push(actions[0]);
        	if(actions[1] != undefined)
                act.push(actions[1]);
        	if(actions[2] != undefined)
                act.push(actions[2]);
        	if(actions[10] != undefined)
                act.push(actions[10]);
            buttons += '<button class="btn btn-primary" onclick="bulkAction(['+ act.join() +'])">Cancel Device Order</button>';
        }
        if(actions[9] != undefined){
			// buttons += '<button class="btn btn-primary" onclick="bulkAction(['+actions[9]+'])">Restore</button>';
        }
        if(actions[3] != undefined){
            buttons += '<button class="btn btn-primary" onclick="bulkAction(['+actions[3]+'])">Activate Device</button>';
        }
		$('.bulk_actions').empty().append(buttons).show();
	}
}
function startBulkAction(data){
    if(data.length > 0){
        lastAction = 'bulkAction';
        var data = JSON.parse(JSON.stringify(data));
        $('#gifBox').show();
        AjaxController('changeEldStatuses', {data: data}, dashUrl, 'basicEldHandler', errorBasicHandler, true);
    }
}
function bulkAction(actions){
	var canceled = false;
    if($.inArray(0,actions)>=0 || $.inArray(1, actions)>=0 || $.inArray(2, actions)>=0 || $.inArray(10, actions)>=0) {
    	canceled = true;
    }
    // var res = getNewStatus({status:actions[0]}, canceled, $('#confirmModal'));
    // $('#confirmModal').remove();
    // $('body').append('<div class="modal modal-white" id="confirmModal" tabindex="-1" role="dialog"><div class="modal-dialog" role="document"><div class="modal-content"><div class="modal-header"><button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button><h4 class="modal-title">Order ELD</h4></div><div class="modal-body"><p></p></div><div class="modal-footer"><button type="button" class="btn btn-default" data-dismiss="modal">Close</button><button id="confirmCancelOrderScanner" type="button" class="btn btn-primary">Confirm</button></div></div></div></div>');
    // $('#confirmModal').find('.modal-body p').text(res.popupText);
    // $("#confirmModal").modal('show');
    //
    // $(document).on('click', '#confirmCancelOrderScanner', function() {
    // });
    var bulkActions = [];
	var scannerIds = [];
	$(actions).each(function (n, action) {
		var $checkbox = $('#eld_table').find('tr[status=' + action + '] .eld_check:checked');
        scannerIds = $checkbox.closest('tr[status=' + action + ']');
	});

    // $("#confirmModal").modal('hide');
	$(scannerIds).each(function (n, scannerId) {
		if (typeof $(scannerId).attr('scannerid') != 'undefined') {
			var res = getNewStatus({id: $(scannerId).attr('scannerid'), status: parseInt($(scannerId).attr('status'))}, canceled);
			var data = {id: $(scannerId).attr('scannerid'), status: res.newStatus};
			bulkActions.push(data);
		}
    });
    startBulkAction(bulkActions);
}
function checkOneEld(){
	var checkedAll = true;
	$('.eld_check').each(function(key, item){
		if($(this).prop('checked') == false){
			checkedAll = false;
			return true;
		}
	});

	if(checkedAll){
		$('.eld_check_all').prop('checked', true);
	}else{
		$('.eld_check_all').prop('checked', false);
	}
	checkEldActions();
}
function updateScanner(scanner){
	var oldKey = -1;
        var page = $('#eld_table').parents('.ez_section').attr('id');
	$.each(scannersArr, function(key2, scannerOld){
		if(scannerOld.id == scanner.id){
			oldKey = key2;
		}
	});
	var scannerStatus = getScannerStatusFromStatusId(scanner.status, scanner.params);
	// var scannerButtons = getScannerButtonsFromStatusId(scanner.status);
	if(scanner.demo == 1 && (scanner.demoDate !== '' || scanner.demoDate !== null)){
		var time = new Date(scanner.demoDate*1000);
		time = addMonthsUTC(time,1 );
		time.setDate(time.getDate() + 7);

		var theyear = time.getFullYear();
		var themonth = time.getMonth() + 1;
		var thetoday = time.getDate();
		var endDate = themonth + "-" + thetoday + "-" + theyear;
        scannerStatus += '\n\ (Demo till '+ endDate +')';
	}
    var scannerTypeText = scanner.type == 1?'(AOBRD)':'';
    if(scanner.status == 4 && scanner.BLEAddress !== null && scanner.BLEAddress != ''){
        var light = 'green';
    }else if(scanner.status == 4 && (scanner.BLEAddress == null || scanner.BLEAddress == '')){
        var light = 'orange';
    }else{
        var light = 'red';
    }
	// aobrd, eld icon in last unit section
	var driver_type = '';
	var lastDriverInfo = scanner.lastDriverStatuse;
	if(typeof lastDriverInfo != 'undefined' && lastDriverInfo != 0){ c(lastDriverInfo);
		driver_type = scanner.type == 1 ? 'aobrd':'eld';
		if(driver_type != ''){
			var status_light = 'green';
			if(typeof lastDriverInfo.statusTypeId != 'undefined' && lastDriverInfo.statusTypeId == 0) {
					status_light = 'grey';
			}
			driver_type = '<span class="driver-scanner-icon '+driver_type+' '+status_light+'"></span>';
		}
	}
    light = '<span class="eld_light " style="width: 6px;height: 6px;background: '+light+';display: inline-block;border-radius: 50%;margin-right: 5px;"></span>'
    if(oldKey == -1){//new scanner
        scannersArr.push(scanner);
        var truckId = typeof scanner.truckId == 'undefined' ? scanner.lastTruck : scanner.truckId;
        var txt = '<tr onclick="getEldCard('+scanner.id+', this, event)" scannerid = "'+scanner.id+'" status = "'+scanner.status+'" regid = "'+scanner.registrationNumber+'" lastDriver = "'+scanner.lastDriver+'">\n\
            <td class="blockForDispatcher"><input type="checkbox" class="eld_check" onclick="checkOneEld()"/></td>\n\
            <td>'+scanner.localId+scannerTypeText+'</td>\n\
            <td>'+light+scannerStatus+'</td>\n\
            <td>'+(scanner.BLEAddress !== null ? scanner.BLEAddress : '')+'</td>\n\
            <td>'+(scanner.lastDriverName !== null ? createProfilePopupButton(scanner.lastDriver,scanner.lastDriverName) : '')+'</td>\n\
            <td>'+(scanner.vin !== null ? scanner.vin : '')+'</td>\n\
            <td>'+driver_type+(scanner.truckName !== null && typeof scanner.truckName !== 'undefined' ? truckCardLink(truckId, scanner.truckName) : '')+'</td>\n\
            <td>'+(scanner.version !== null ? scanner.version : '')+'</td>\n\
        </tr>';
        $('#eld_table tbody').append(txt);
    }else{//updating
        scannersArr[oldKey] = scanner;
        var row = $('#eld_table tr[scannerid = "'+scanner.id+'"]');
        row.attr('status', scanner.status);
        row.attr('regid', scanner.registrationNumber);
        var cells =  row.find('td');
        cells.eq(1).text(scanner.localId+scannerTypeText);
        cells.eq(2).html(light+scannerStatus);
		cells.eq(6).html(driver_type+(scanner.truckName !== null ? scanner.truckName : ''));
    }
}
$(document).off('click', '#eld_table tbody tr').on('click', '#eld_table tbody tr', function(event) {
    var $tgt = $(event.target);
    if(!$tgt.is(':checkbox')) {
        var $trClicked = $(this);
        var scannerId = $trClicked.attr('scannerid');
        $.ajax({
            url: MAIN_LINK + '/db/dashController/' + '?' + window.location.search.substring(1),
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify({data: {action: 'getEldScannerData', scannerId: scannerId}}),
            success: function (data) {
                var response = jQuery.parseJSON(data);
                if (response.code == '000') {
                    if('id' in response.data.scanner) {
                        showScannerInfo(response.data);
                    }
                    else {
                        $trClicked.remove();
                    }
                } else {
                }
            }
        });
    }
});
function showScannerInfo(data){
    var tableLines = '',
        statusName = '',
		scanner = data['scanner'],
		returns = data['returns'];

    if(data['history'].length > 0){
        data['history'].forEach(function(item){
            statusName = getScannerStatusFromStatusId(item.status, item.params)
            tableLines += '<tr>\n\
                <td>'+statusName+'</td>\n\
                <td>'+scanner.id+'</td>\n\
                <td>'+timeFromSecToUSAString(item.dateTime)+'</td>\n\
            </tr>';
        });
    }
    var buttons = '';
	var time = new Date().getTime() / 1000;
    var subscriptionTillLine = '';
    if(scanner.status >= 1) {
        subscriptionTillLine = '<div><p>Payment Type: ' + (scanner.paid_till > time ? 'Subscription till ' + toDate(scanner.paid_till) : 'Monthly') + '</p></div>';
    }
	if((scanner.status >= 0 && scanner.status <= 2) || scanner.status == 10) {
        buttons = '<button class="btn btn-default" onclick="cancelOrderScanner('+scanner.id+')">Cancel</button>';
    }
    else if(scanner.status == 3) {
        buttons = '<button class="btn btn-default" onclick="activeOrderScanner('+scanner.id+')">Activate</button>';
    }
    else if(scanner.status == 4) {
        // buttons = '<button class="btn btn-default" onclick="deactivateOrderScanner('+scanner.id+')">Dectivate</button>';
    }
    else if(scanner.status == 5) {
        buttons = '<button class="btn btn-default" onclick="activeOrderScanner('+scanner.id+')">Activate</button>';
    }
    var aobrd = '';
    if(scanner.type == 1){
        aobrd = '(AOBRD)';
        buttons +='<button class="btn btn-default" onclick="updateOrderScanner('+scanner.id+')">Update to ELD</button>';
    }
    if(scanner.status == 11 && returns.status == 1) { //Approved for Sending
        buttons = '<button class="btn btn-default" onclick="editDeliveryReturnsScanner('+scanner.id+','+returns.id+')">Enter delivery number</button>';
    }
    if(scanner.status == 3 || scanner.status == 4 || scanner.status == 5 || scanner.status == 8) {
        buttons += '<button class="btn btn-default" onclick="returnOrderScanner('+scanner.id+', 0)">Return Device</button>';
        buttons += '<button class="btn btn-default" onclick="returnOrderScanner('+scanner.id+', 1)">Replacement Request</button>';
    }
    if(scanner.status == 3 || scanner.status == 4 || scanner.status == 5 || scanner.status == 8) {
        buttons += '<button class="btn btn-default" onclick="transferEld('+scanner.id+')">Transfer to another Fleet</button>';
    }
    if(scanner.status == 103) {
        buttons += '<button class="btn btn-default" onclick="cancelTransferEld('+scanner.id+')">Cancel transfer ELD</button>';
    }

    var scannerStatus = getScannerStatusFromStatusId(scanner.status, scanner.params);
    $(".modal").modal('hide');
	$('#scannerModal').remove();
	$('body').append('<div class="modal modal-white bs-example-modal-lg" id="scannerModal"><div class="modal-dialog modal-lg"><div class="modal-content">\n' +
		'<div class="modal-header"><button type="button" class="close" data-dismiss="modal" aria-label="Close">\n' +
		'<span aria-hidden="true">&times;</span></button><h4 class="modal-title">Scanner '+aobrd+'</h4>\n' +
		'</div>\n' +
		'<div class="modal-body">\n' +
		'<div><p>Status: '+scannerStatus+'</p></div>\n' +
		subscriptionTillLine +
		'<div class="btn-group">'+buttons+'</div>'+
		'<h3>ELD History</h3>\n' +
		'<table class="table table-striped table-dashboard table-sm">\n' +
		'<thead>\n' +
		'<tr>\n' +
		'<th>Status</th>\n' +
		'<th>Scanner ID</th>\n' +
		'<th>Date</th>\n' +
		'</tr>\n' +
		'</thead>\n' +
        tableLines +
		'<tbody>\n' +
		'</tbody>\n' +
		'</table>'+
		'</div>\n' +
		'<div class="modal-footer"><button type="button" class="btn btn-default" data-dismiss="modal">Close</button>\n' +
		'</div></div></div></div>');
	$("#scannerModal").modal('show');

};
function getScannerById(scannerId){
	var scanner = {};
	$.each(scannersArr, function(key2, scannerOld){
		if(scannerOld.id == scannerId){
			scanner = scannerOld;
		}
	});
	return scanner;
}
function moveAgreeFast(el){
	var box = $(el).closest('#lease-and-agreement-popup .modal-body, #camera-agreement-popup .modal-body');
	if($(el).hasClass('up')){
		box.scrollTop(0);
	}else{
		box.scrollTop(box[0].scrollHeight);
	}

}
function openLeaseAndAgreementPopup(el, transferScannerId = 0, tariffId=null){
    event.preventDefault();
    resetError($('.checkbox.lease-and-agreement'));
    if(agreeLeaseService === true && $(el).attr('id') === 'agreementCheckboxItem') {
        agreeLeaseService = false;
        $('#agreementCheckboxItem').prop('checked', false);
        $('.changeStatus').prop('disabled', true);
        return;
    } else if(agreeLeaseService === false && $(el).attr('id') === 'agreementCheckboxItem') {
        agreeLeaseService = false;
        $('#agreementCheckboxItem').prop('checked', false);
    }

    if($('#number_device').is(':visible') && (!$('#number_device').val() || $('#number_device').val() === 0)) {
        return;
    }

    let agreeBtnType = $(el).attr('id') == 'agreementCheckboxItem' ? '' : 'lease';

    var header = 'Equipment Lease and Software Subscription Service Agreement';
    var content = `
        <div class="lease-and-agreement-popup">
            <button class="fast_move" onclick="moveAgreeFast(this);"><i class="fa fa-arrow-down"></i><i class="fa fa-arrow-up"></i></button>
            <div class="style-agreemens-block"></div>
            <div class="lease-block"></div>
            <div class="service-agreemens-block"></div>
        </div>
        <button class="btn btn-default agreement" data-btn-type="${agreeBtnType}" onclick="agreeLeaseAndAgreement(this);" style="display:none;">I Do Not Agree</button>
        <button class="btn btn-default agreement" data-btn-type="${agreeBtnType}" style="float:right;display:none;" onclick="agreeLeaseAndAgreement(this, 1);">I Agree</button>`;

    showModal(header, content, 'lease-and-agreement-popup', 'modal-lg agreemens-global-modal');

    $('#lease-and-agreement-popup .close').click(function(){
        agreeLeaseAndAgreement(this);
    })
    $('#lease-and-agreement-popup .lease-and-agreement-popup .style-agreemens-block').load('/frontend/pages/include/leaseAndServiceAgreement.php #style-agreemens');
    var orderType = $('#eldTariffs .eldTariffItem.active').data('id');
    if(transferScannerId > 0){
        orderType = $('#tablePendingTransfersEld tr[data-scannerid="'+transferScannerId+'"]').attr('data-order-type')
    }
    orderType = tariffId !== null ? tariffId : orderType;

    if (orderType == 0 || orderType == 3 || orderType == 4 || orderType == 5) {
        $('#lease-and-agreement-popup .lease-and-agreement-popup .lease-block').load('/frontend/pages/include/leaseAndServiceAgreement.php #equipment-lease-1month');
    } else if (orderType == 1 || orderType == 2) {
        $('#lease-and-agreement-popup .lease-and-agreement-popup .lease-block').load('/frontend/pages/include/leaseAndServiceAgreement.php #equipment-lease-1years');
    } else if (orderType == 13) {
        $('#lease-and-agreement-popup .lease-and-agreement-popup .lease-block').load('/frontend/pages/include/leaseAndServiceAgreement.php #equipment-lease-new-1years');
    }

    if (orderType == 15 || orderType == 16 || orderType == 17) {
        $('#lease-and-agreement-popup .lease-and-agreement-popup .lease-block').load('/frontend/pages/include/leaseAndServiceAgreement.php #purchase4');
        $('#lease-and-agreement-popup .lease-and-agreement-popup .service-agreemens-block').load('/frontend/pages/include/leaseAndServiceAgreement.php #new-saas', `orderType=${orderType}`, function () {
            $('.lease-and-agreement-popup').closest('#lease-and-agreement-popup .modal-body').scroll(function(){
                var box = $(this);
                var scrheight = box[0].scrollHeight;
                var height = box.height();
                var cur = box.scrollTop();
                if(height + cur + 50 > scrheight){
                    $('.fast_move').addClass('up');
                }else{
                    $('.fast_move').removeClass('up');
                }
            });
        });
    } else if (orderType == 18) {
        $('#lease-and-agreement-popup .lease-and-agreement-popup .lease-block').load('/frontend/pages/include/leaseAndServiceAgreement.php #purchase4');
        $('#lease-and-agreement-popup .lease-and-agreement-popup .service-agreemens-block').load('/frontend/pages/include/leaseAndServiceAgreement.php #new-saas', `orderType=${orderType}`, function () {
            $('.lease-and-agreement-popup').closest('#lease-and-agreement-popup .modal-body').scroll(function(){
                var box = $(this);
                var scrheight = box[0].scrollHeight;
                var height = box.height();
                var cur = box.scrollTop();
                if(height + cur + 50 > scrheight){
                    $('.fast_move').addClass('up');
                }else{
                    $('.fast_move').removeClass('up');
                }
            });
        });
    } else if (orderType == 19) {
        $('#lease-and-agreement-popup .lease-and-agreement-popup .lease-block').load('/frontend/pages/include/leaseAndServiceAgreement.php #purchase5');
        $('#lease-and-agreement-popup .lease-and-agreement-popup .service-agreemens-block').load('/frontend/pages/include/leaseAndServiceAgreement.php #new-saas-order13', `orderType=${orderType}`, function () {
            $('.lease-and-agreement-popup').closest('#lease-and-agreement-popup .modal-body').scroll(function(){
                var box = $(this);
                var scrheight = box[0].scrollHeight;
                var height = box.height();
                var cur = box.scrollTop();
                if(height + cur + 50 > scrheight){
                    $('.fast_move').addClass('up');
                }else{
                    $('.fast_move').removeClass('up');
                }
            });
        });
    } else {
        $('#lease-and-agreement-popup .lease-and-agreement-popup .service-agreemens-block').load('/frontend/pages/include/leaseAndServiceAgreement.php #service-agreement',`orderType=${orderType}`, function(){
            $('.lease-and-agreement-popup').closest('#lease-and-agreement-popup .modal-body').scroll(function(){
                var box = $(this);
                var scrheight = box[0].scrollHeight;
                var height = box.height();
                var cur = box.scrollTop();
                if(height + cur + 50 > scrheight){
                    $('.fast_move').addClass('up');
                }else{
                    $('.fast_move').removeClass('up');
                }
            });
        });
    }

    setTimeout(function () {
        $('#lease-and-agreement-popup .modal-body button.agreement').show();
    }, 1000);
}

function openCameraAgreement(el, transferScannerId = 0) {
    event.preventDefault();
    resetError($('.checkbox.camera-agreement'));
    if (agreeCamera === true && $(el).attr('id') === 'leaseAndAgreementCameraCheckbox') {
        agreeCamera = false;
        $('#leaseAndAgreementCameraCheckbox').prop('checked', false);
        $('.changeStatus').prop('disabled', true);
        return;
    } else if (agreeCamera === false && $(el).attr('id') === 'leaseAndAgreementCameraCheckbox') {
        agreeCamera = false;
        $('#leaseAndAgreementCameraCheckbox').prop('checked', false);
    }

    if ($('#number_device').is(':visible') && (!$('#number_device').val() || $('#number_device').val() === 0)) {
        return;
    }

    var header = 'EZSMARTCAM PURCHASE AND DATA SERVICES AGREEMENT';
    var content = `
        <div class="camera-agreement-popup">
            <button class="fast_move" onclick="moveAgreeFast(this);"><i class="fa fa-arrow-down"></i><i class="fa fa-arrow-up"></i></button>
            <div class="style-agreemens-block"></div>
            <div class="lease-block"></div>
            <div class="service-agreemens-block"></div>
        </div>
        <button class="btn btn-default agreement" onclick="agreeCameraService(this);" style="display:none;">I Do Not Agree</button>
        <button class="btn btn-default agreement" style="float:right;display:none;" onclick="agreeCameraService(this,1);">I Agree</button>`;
    showModal(header, content, 'camera-agreement-popup', 'modal-lg agreemens-global-modal');
    $('#camera-agreement-popup .close').click(function () {
        agreeCameraService(this)
    }
    )
    $('#camera-agreement-popup .camera-agreement-popup .style-agreemens-block').load('/frontend/pages/include/leaseAndServiceAgreement.php #style-agreemens');
    var orderType = $('#eldTariffs .eldTariffItem.active').data('id');
    if (transferScannerId > 0) {
        orderType = $('#tablePendingTransfersEld tr[data-scannerid="' + transferScannerId + '"]').attr('data-order-type')
    }
    $('#camera-agreement-popup .camera-agreement-popup .lease-block').load('/frontend/pages/include/leaseAndServiceAgreement.php #camera-agreement');
    setTimeout(function () {
        $('#camera-agreement-popup .modal-body button.agreement').show();
    }, 1000);
}

function agreeLeaseAndAgreement(el, agree = 0) {
    let type = $(el).attr('data-btn-type') !== '' ? 'agreementLeaseCheckboxItem' : 'agreementCheckboxItem';
    if(agree == 1) {
        agreeLeaseService = true;
        resetError();
        if (type == 'agreementCheckboxItem') {
            $('#agreementCheckboxItem').prop('checked', true);
            $('#basicModal #agreementCheckboxItem').prop('checked', true);
        } else {
            $('#agreementLeaseCheckboxItem').prop('checked', true);
            $('#basicModal #agreementLeaseCheckboxItem').prop('checked', true);
        }
        $('.changeStatus').prop('disabled', false);
    } else {
        agreeLeaseService = false;
        if (type == 'agreementCheckboxItem') {
            $('#agreementCheckboxItem').prop('checked', false);
            $('#basicModal #agreementCheckboxItem').prop('checked', false);
        } else {
            $('#agreementLeaseCheckboxItem').prop('checked', false);
            $('#basicModal #agreementLeaseCheckboxItem').prop('checked', false);
        }
        $('.changeStatus').prop('disabled', false);
    }
    if($('#transferModal').length > 0){
        transferOrder.agreeContract = agree == 1 ? true : false;
        checkIfTransferReady();
    }
    $(el).closest('#lease-and-agreement-popup').remove();
}

function agreeCameraService(el, agree=0) {
    if(agree == 1) {
        agreeCamera = true;
        resetError();
        $('#leaseAndAgreementCameraCheckbox').prop('checked', true);
        $('#basicModal #leaseAndAgreementCameraCheckbox').prop('checked', true);
        $('.changeStatus').prop('disabled', false);
    } else {
        agreeCamera = false;
        $('#leaseAndAgreementCameraCheckbox').prop('checked', false);
        $('#basicModal #leaseAndAgreementCameraCheckbox').prop('checked', false);
        $('.changeStatus').prop('disabled', true);
    }
    if($('#transferModal').length > 0){
        transferOrder.agreeContract = agree == 1 ? true : false;
        checkIfTransferReady();
    }
    $(el).closest('#camera-agreement-popup').remove();
}

//Replace minus in input
$(document).off('input', '.check_input_number').on('input', '.check_input_number', function(e) {
    /^\d*$/.test($(this).val()) || $(this).val($(this).val().replace(/\D+/g, ''));
    if($(this).val() > 999){
        $(this).val(999);
    }
});
//if amount > 0 required agreement
function activeAgreements(e) {
    if($(e).val() > 0) {
        $('#rowAgreement .checkbox.lease-and-agreement input').prop('disabled', false).removeAttr('title');
        $('#rowAgreement .lease-and-agreement a, #rowAgreement .lease-and-agreement span').removeClass('disabled');
    }
    else {
        $('#rowAgreement .checkbox.lease-and-agreement input').prop('disabled', true).prop('title', 'Only with Eld Devices Order');
        $('#rowAgreement .lease-and-agreement a, #rowAgreement .lease-and-agreement span').addClass('disabled');
    }
}
$().ready(function()
{
    if(storageAvailable('localStorage')){//if i can use local storage
        localStorage.removeItem('agreeService');
        localStorage.removeItem('agreeLease');
    }
	$('body').off('click', '.one_cable p, .one_cable h3, .one_cable img').on('click', '.one_cable p, .one_cable h3, .one_cable img', function(){
		var div = $(this).closest('.one_cable');
		var description = div.attr('data-description');
		var image_url = div.attr('data-url');
		$('#one_cable_popup h2').html(div.find('h3').text())
		$('#one_cable_popup div img').attr('src', `/dash/assets/img/eld/${image_url}`)
		$('#one_cable_popup div p').html(description)
		$('#one_cable_popup').show();
	})
	var availableForUsers = [TYPE_DRIVER, TYPE_DRIVER_ELD, TYPE_DISPATCHER, TYPE_SAFETY];
    $('body').off('click', '#order_eld_done button').on('click', '#order_eld_done button', function()
    {
        $('#order_eld_done').hide();
    });

    // $('body').off('click', '#eld_table button').on('click', '#eld_table button', function()
    // {
		// $('#eldConfirm').show();
		// var scannerId = parseInt($(this).parents('tr').attr('scannerid'));
		// var popup = $('#eld_popup');
		// if($(this).hasClass('update')){
		// 	var popupText = 'Are you sure you want to update you AOBRD deive to ELD? This action cannot be canceled, fleet can operate as an AOBRD until December 16, 2019';
		// 	popup.attr('newstatus', 'updateToELD').attr('scannerid', scannerId).show().find('#info').html(popupText);
		// }
    // });
    $('body').on('click', '.close_edit', function(){
        if(storageAvailable('localStorage')){//if i can use local storage
            localStorage.removeItem('agreeService');
            localStorage.removeItem('agreeLease');
        }
    });
    //local storage events
    if(storageAvailable('localStorage')){//if i can use local storage
        window.addEventListener('storage', function (event) {
            if(event.key == 'agreeService' && event.url == MAIN_LINK + '/service_agreement/') {
                if(event.newValue == 'yes') {
                    agreeService = true;
                    resetError($('.checkbox.service'));
                    $('.checkbox.service input').prop('checked', true);
                } else if(event.newValue == 'no'){
                    resetError($('.checkbox.service'));
                    setError($('.checkbox.service a'), 'Please open and read Agreements to be able to finish order');
                }
                localStorage.removeItem('agreeService');
            }
            if(event.key == 'agreeLease' && event.url == MAIN_LINK + '/lease/') {
                if(event.newValue == 'yes') {
                    agreeLease = true;
                    resetError($('.checkbox.lease'));
                    $('.checkbox.lease input').prop('checked', true);
                } else if(event.newValue == 'no'){
                    resetError($('.checkbox.lease'));
                    setError($('.checkbox.lease a'), 'Please open and read Equipment Lease to be able to finish order');
                }
                localStorage.removeItem('agreeLease');
            }
        });
    }
	if(window.location.pathname == '/dash/eld/' && availableForUsers.indexOf(position) != -1){
		checkPendingTransfers();
	}
});

function activeOrderScanner(id) {
    var scanner = getScannerById(id);
    confirmModal(getNewStatus(scanner, false));
}
function deliveryReturnELDSend(returnId) {
    resetError();
    var no_error = true;
    var $deliveryInfo = $('#deliveryReturnsModal input[name="delivery_info"]');
    if(returnId == null || typeof returnId == 'undefined' || returnId == '') {
        no_error = setError($('#deliveryReturnsModal form'), 'Return data not found');
    }
    if($deliveryInfo.val().trim() == '') {
        no_error = setError($deliveryInfo, 'Enter delivery information');
    }
    else if($deliveryInfo.val().trim().length > 300) {
        no_error = setError($deliveryInfo, 'Max length 300 characters');
    }
    if(no_error == true) {
        var data = JSON.parse(JSON.stringify({delivery_info: $deliveryInfo.val(), status: 3, returnId:returnId}));
        AjaxController('updateReturnEld', data, dashUrl, 'returnEldHandler', errorBasicHandler, true);
    }
}
function editDeliveryReturnsScanner(id, returnId) {
    var scanner = getScannerById(id);
    $(".modal").modal('hide');
    $('#deliveryReturnsModal').find('#btnReturnScanner').remove();
    $('#mac_address').text((scanner.BLEAddress !== null ? scanner.BLEAddress : ''));
    $('#deliveryReturnsModal .modal-footer').append('<button id="btnReturnScanner" type="button" class="btn btn-primary" onclick="deliveryReturnELDSend('+returnId+')">Send</button>');
    $("#deliveryReturnsModal").modal('show');
}
function resetFormEldOrder() {
    resetError();
    agreeLeaseService = false;
    agreeCamera = false;
    $('#agreementCheckboxItem').prop('checked', false);
    $('#agreementLeaseCheckboxItem').prop('checked', false);
    $('input').prop('checked', false);
    $('input, select').removeClass('inpurError');
    $('#number_device').val('');
    $('#reg_state').val($('#reg_state').attr('default-value'));
    $('#first_name').val($('#first_name').attr('default-value'));
    $('#last_name').val($('#last_name').attr('default-value'));
    $('#phone').val($('#phone').attr('default-value'));
    $('#address1').val($('#address1').attr('default-value'));
    $('#address').val($('#address').attr('default-value'));
    $('#city').val($('#city').attr('default-value'));
    $('#zip').val($('#zip').attr('default-value'));
    $('input, select').removeClass('inpurError');
    $('.error_mes').remove();
    $('#eld_order_price b, #eld_first_price b, #eld_delivery_price b, #eld_total_order b, #eld_deposit_fee b').empty();
    $('#send_order').attr('disabled', false);
}

$('body').on('click', '.close_edit', function()
{
    $('.cable_quantity input[type="number"]').val(0);
});
function changeRole(obj) {
    $('#formGroupUsdot, #formGroupEmail').remove();
    if($(obj).val() == 1) {
        $('#transferEldForm').append(`<div class="form-group" id="formGroupEmail">
                <label for="inputEmail">Email</label>
                <input type="text" name="email" class="form-control" id="inputEmail" placeholder="Email"/>
            </div>`);
    }
    else if($(obj).val() == 2) {
        $('#transferEldForm').append(`<div class="form-group" id="formGroupUsdot">
                <label for="inputUsdot">USDOT #</label>
                <input type="text" name="usdot" id="inputUsdot" class="form-control"  maxlength="10" data-mask="0000000000" placeholder="USDOT #"/>
            </div>`);
    }
}
function errorTransferEldHandler(response) {
    alertError($('#transferEldForm'), response.message, 3000);
}
var transferOrder = {};//use
function checkIfTransferReady(){
	$('#approveTransferELDBetweenProjectsBtn').prop('disabled', true);
	if(transferOrder.agreeContract == true && transferOrder.type > -1){
		$('#approveTransferELDBetweenProjectsBtn').prop('disabled', false);
	}
}
function approveTransferELDBetweenProjectsErrorHandler(response){
	alertError($('#transferModal .modal-body'), response.message, 3000)
}
function approveTransferELDBetweenProjectsHandler(response){
	$('#transferModal .close').click();
	$('#basicModal .close').click();
	showModal('Transfer Order Type', 'Device succesfully transferred');
	$('.pg_pagin[data-table="eld_table"] .pagin_per_page').change();
}
function approveTransferELDBetweenProjects(){
	$('#approveTransferELDBetweenProjectsBtn').prop('disabled', true);
	AjaxCall({action:'approveTransferELDBetweenProjects', url:apiDashUrl, data:{'transferOrder':transferOrder}, successHandler:approveTransferELDBetweenProjectsHandler, errorHandler:approveTransferELDBetweenProjectsErrorHandler})
}
function approveTransferEld(id, otherProject, transferId) {
    if(otherProject == '0'){
        var scanner = {id:id, status:'approveTransferELD'};
        confirmModal(getNewStatus(scanner, false));
        $('.changeStatus').prop('disabled', true);
    }else{
        transferOrder = {type:-1, transferId:0, scannerId:0, agreeContract:false, otherProject:''};
        agreeLeaseService = false;
        transferOrder.scannerId = id;
        transferOrder.otherProject = otherProject;
        transferOrder.transferId = transferId;
        $('#number_device').val(1);
        showModal('Transfer Order Type', `<div id="order_type_box">
            <div class="row row-tariffs mb-3" id="eldTariffs"></div>
        </div>
        <div class="row">
            <div class="col-sm-12">
                <p>+$${ELD_DEPOSIT_FEE} Deposit</p>
                <div class="checkbox lease-and-agreement">
                    <label>	
                        <input type="checkbox" id="leaseAndAgreementCheckbox" onclick="openLeaseAndAgreementPopup(this);"  title="Only with Eld Devices Order"> <span >EQUIPMENT LEASE AND SOFTWARE SUBSCRIPTION SERVICE AGREEMENT</span>
                    </label>
                </div>
            </div>
        </div>`, 'transferModal', 'modal-lg', {footerButtons:`<button class="btn btn-default" onclick="approveTransferELDBetweenProjects();" id="approveTransferELDBetweenProjectsBtn" disabled="disabled" >Approve Transfer</button>`});
        $('#eldTariffs').append(getEldTransferTariffsBlock());
        $('#eldTariffs div.eldTariffItem:first-child').click();
    }
}

var getEldTransferTariffsBlock = function() {
    var item = '';
    $('#order_type').empty();

    $.each(eldTariffs, function(key, val) {
        var price = $('#cameraTariffs').is(':visible') && (parseInt($('#order_camera_type').val()) === 7 || parseInt($('#order_camera_type').val()) === 8) ? val.price_discount_camera : val.price;
        var termsText = val.termsText !== '' ? '<span class="label label-success">'+ val.termsText +'</span>' : '';
        if($('#cameraTariffs').is(':visible') && (parseInt($('#order_camera_type').val()) === 7 || parseInt($('#order_camera_type').val()) === 8) && val.text_discount_camera !== '') {
            termsText = '<span class="label label-warning">'+ val.text_discount_camera +'</span>';
        }
        item += '' +
            '<div class="col-sm-12 col-md-4 eldTariffItem" data-id="'+ key +'" onclick="selectTransferOrderType(this)">\n' +
            '<div class="item">\n' +
            '<h4>'+val.name+'</h4>\n' +
            '<p><span class="price">'+ moneyFormat(price) +'</span> '+ val.description +'</p>\n' +
            termsText + '\n' +
            '</div>\n' +
            '</div>\n';
        $('#order_type').append('<option value="'+ key +'">'+ val.name +'</option>');
    });
    return item;
};

function selectTransferOrderType(e){
    $(e).closest('.row-tariffs').find('.tariff-marker').remove();
    $(e).closest('.row-tariffs').find('[class*=col-]').removeClass('active');
    $(e).addClass('active').find('.item').append('<i class="tariff-marker"></i>');
	transferOrder.type = $(e).data('id');
	checkIfTransferReady();
}
function rejectTransferELDBetweenProjectsHandler(response){
	$('#rejectTransfer .close').click();
	$('#basicModal .close').click();
    dc.getUrlContent('/dash/eld/');
}
function rejectTransferELDBetweenProjects(transferId, initiator=''){
	$('#rejectTransferELDBetweenProjectsBtn').prop('disabled', true);
	AjaxCall({action:'rejectTransferELDBetweenProjects', url:apiDashUrl, data:{'transferId':transferId, initiator:initiator}, successHandler:rejectTransferELDBetweenProjectsHandler, errorHandler:rejectTransferELDBetweenProjectsHandler})
}
function cancelProjectTransferEld(id, otherProject = '0', transferId, initiator = '') {
    if(otherProject == '0'){
        var scanner = {id:id, status:'removeTransferELD'};
        confirmModal(getNewStatus(scanner, false));
    }else{
        showModal('Reject Treansfer', 'Are you sure you want to reject transfer from another Project?','rejectTransfer','',
        {footerButtons:`<button class="btn btn-default" onclick="rejectTransferELDBetweenProjects(${transferId}, '${initiator}');" id="rejectTransferELDBetweenProjectsBtn">Reject Transfer</button>`});
    }
}

function checkPendingTransfers() {
    AjaxController('getPendingTransfers', {type:'to'}, dashUrl, 'checkPendingTransfersHandler', errorTransferEldHandler, true);
}
function checkPendingTransfersHandler(response) {
    $('#btnGetPendingTransfers').remove();
    if(response.data.length) {
        $('#manage_eld .btn-block-manage-eld').prepend('<button id="btnGetPendingTransfers" type="button" class="btn btn-primary" onclick="getPendingTransfers()">Pending Transfers</button>');
    }
}

function getPendingTransfers() {
    AjaxController('getPendingTransfers', {type:'to'}, dashUrl, 'pendingTransfersHandler', errorTransferEldHandler, true);
}

function pendingTransfersHandler(response) {
    c(response);
    if(!response.data.length) {
        showModal('Pending Transfer ELD ', '', 'basicModal');
        alertMessage($('#basicModal .modal-body'), 'No ELD Transfers Found');
        return false;
    }

    var tr = '';
    $.each(response.data, function(i, transfer) {
        tr += `<tr data-scannerid="${transfer.scannerId}" data-status="${transfer.status}" data-transferId="${transfer.id}" data-order-type="${transfer.order_type}">
            <td>${transfer.scannerId}</td>
            <td>${transfer.fleetOrUserName}</td>
            <td>${toDateTime(parseInt(transfer.dateTime)+timeOffset)}</td>
            <td>${transfer.BLEAddress != null ? transfer.BLEAddress : 'Empty'}</td>
            <td>
                    <button type="button" class="btn btn-sm btn-primary" onclick="approveTransferEld(${transfer.scannerId}, '${transfer.otherProject}', ${transfer.id})">Approve</button>
                    <button type="button" class="btn btn-sm btn-default" onclick="cancelProjectTransferEld(${transfer.scannerId}, '${transfer.otherProject}', ${transfer.id})">Reject</button>
            </td>
        </tr>`;
    });
    var body = `<div class="table_wrap"><table class="table table-dashboard table-sm mobile_table" id="tablePendingTransfersEld">
        <thead>
            <tr>
                <th style="width: 100px;">ID</th>
                <th style="width: 30%">(USDOT) Fleet / (Email) User</th>
                <th>Date</th>
                <th>Mac Address</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody>
        ${tr}
        </tbody>
    </table></div>`;

    showModal('Pending Transfer ELD ', body, 'basicModal');
    $('#basicModal .modal-dialog').addClass('modal-lg');
}

function getELDscanners(){
    var pagination = new simplePaginator({
        tableId:'eld_table',
        request:'getAllEldScannersPagination',
        requestUrl:apiDashUrl,
        handler: getAllEldScannersPaginationHandler,
        perPageList:[20, 35, 50],
        initSort: {param:'status', dir:'asc'}
    });
}
function getAllEldScannersPaginationHandler(response){
    scannersArr = [];
    $('#eld_table').find('tbody').empty();
    if(curUserIsClient()) {
        $('#send_order').attr('disabled', false);
        if (response.data.result != null) {
            c('show scanner list');
            loopScanners(response.data.result);
            resetFormEldOrder();
            checkEldActions();
        }
        checkPendingTransfers();
    } else {
        var scanner = typeof response.data.result[0] !== 'undefined' ? response.data.result[0] : [];
        updateScanner(scanner);
    }
}
function selectOrderType(el){
    var order_type = $(el).attr('data-type');
    $('#order_type_box .order_type_one_box').removeClass('active');
    $(el).parent().addClass('active');
    $('#order_type').val(order_type);
    calculateOrder();
}