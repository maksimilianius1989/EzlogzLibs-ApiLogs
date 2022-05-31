$().ready(function () {
	loadFleetFilters();
    $('.fleet_subnav select').change(function () {
		clearAll();
        var sect = $(this).val();
        var sectId = ''
         if (sect == 'users_allUsers') {
            $('#all_users_b').click();
            $('.subnav.sub_users').show();
        } else if (sect == 'users_activeDrivers') { 
            $('#drivers_b').click();
            $('.subnav.sub_users').show();
        } else if (sect == 'users_NActiveDrivers') {
            $('#nact_drivers_b').click();
            $('.subnav.sub_users').show();
        } else if (sect == 'add_user') {
            $('#add_user').click();
            $('.subnav.sub_add').show();
        } else if (sect == 'add_truck') {
            $('#add_tr').click();
            $('.subnav.sub_add').show();
        } else if (sect == 'add_trailer') {
            $('#add_trail').click();
            $('.subnav.sub_add').show();
        }

    });

    $(".datepicker").datepicker({dateFormat: 'mm-dd-yy'});
    $('#users').mouseover(function () {
        closeAllSubs();
        $('.sub_buttons.usrs').toggle();
    });
    $('#all_users_b').click(function () {
        closeAll();
        $(this).addClass('active');
        $('#manage_users').show();
    });
    $('#drivers_b').click(function () {
        closeAll();
        $(this).addClass('active');
        $('#active_drivers').show();
    });
    $('#nact_drivers_b').click(function () {
        closeAll();
        $(this).addClass('active');
        $('#nactive_drivers').show();
    });
    $('#equipment').mouseover(function () {
        /* closeAll();
         $(this).addClass('active');
         $('#demo_users').show();*/
        closeAllSubs();
        $('.sub_buttons.eq').toggle();
    });
    $('#equipment, #add, #users, .sub_buttons').mouseleave(function () {
        leaveSub();
    });
    function leaveSub() {
        var hovered = false;
        $('.sub_buttons').each(function () {
            if ($(this).is(':hover')) {
                hovered = true;
            }
        })
        if (!hovered) {
            closeAllSubs();
        }
    }
    $('#groups_but').click(function () {
        closeAll();
        $(this).addClass('active');
        $('#groups').show();
    });
    $('#add').mouseover(function () {
        closeAllSubs();
        $('.sub_buttons.add').toggle();
    });
    $('#add_tr').click(function () {
        closeAll();
        $(this).addClass('active');
        $('.add_truck_button').removeClass('trailer').text('Add Truck');
        $('input[type="text"].truck_add').val('');
		$('#add_truck_Type').val('0').change().find('option[value="2"]').show();
        $('#add_truck h2').first().text('Add Truck');
        $('#add_truck_Name').attr('placeholder', 'Fleet Truck Number');
        $('#add_truck').show();
    })
    $('#add_user').click(function () {
        closeAll();
        $(this).addClass('active');
        $('#add_user_box').show();
    })
    $('#add_trail').click(function () {
        closeAll();
        $(this).addClass('active');
        $('.add_truck_button').addClass('trailer').text('Add Trailer');
        $('input[type="text"].truck_add').val('');
		$('#add_truck_Type').val('0').change().find('option[value="2"]').hide();
        $('#add_truck h2').first().text('Add Trailer');
        $('#add_truck_Name').attr('placeholder', 'Fleet Trailer Number');
        $('#add_truck').show();
    })
    $('#add').click(function () {
        closeAllSubs();
        $('.sub_buttons.add').toggle();
    });
    
    $('body').on('click', '.remove_trailer', function () {

        var prev_trucks = $(this).parent().parent().parent().find('#dr_trailers').val();
        var t = $(this).attr('data-name') + ']_';
        var s = prev_trucks.replace(t, "");
        $(this).parent().parent().parent().find('#dr_trailers').val(s);
        $(this).parent().remove();
    });
    $('body').on('click', '.add_trailer', function () {
        var name = $(this).parent().find('select option:selected').text();
        var t = name + ']_';
        var s = $(this).closest('.info_box').find('#dr_trailers').val();
        var x = s.indexOf(t)
        if (x == '-1') {
            s += t;
            $(this).closest('.info_box').find('#dr_trailers').val(s);

            $(this).closest('.info_box').find('.trailers_box').append('<span> ' + name + ' <button class="remove_trailer" data-name="' + name + '">&mdash;</button></span>');

        }
    });
    function closeAllSubs() {
        $('.sub_buttons').hide();
    }
    $('.clean_button').click(function () {
       clearAll();
    });
    $('.add_truck_button').click(function () {
        var el = $(this);
		el.prop('disabled', true);
        var name = $('#add_truck_Name').val();
        var truckTrailer = 0;
        if ($(this).hasClass('trailer'))
            truckTrailer = 1;
        data = {
            data: {
                action: 'addEquipment',
                truckTrailer: truckTrailer
            }
        };
        $('.truck_add').each(function () {
            var fname = $(this).attr('id');
            fname = fname.substring(10);
            if ($(this).val() != '')
                if ($(this).attr('type') == 'checkbox') {
                    if ($(this).is(':checked')) {
                        data.data[fname] = $(this).val();
                    }
                } else {
                    data.data[fname] = $(this).val();
                }

        });
        var tr_trail = 'Truck';
        if (truckTrailer == 1)
            tr_trail = 'Trailer';

        $('.messages-container').empty();
        if ($('#add_truck_Name').val() == '') {
            alertError($('.messages-container'), 'Fleet ' + tr_trail + ' number cannot be empty');
			el.prop('disabled', false);
            return false;
        }
		var vinRegex = /^([A-HJ-NPR-Z0-9]){17}$/;
		var truck_VIN = $('#add_truck_VIN').val();
		if (!vinRegex.test(truck_VIN) && truck_VIN!='') {
			alertError($('.messages-container'), tr_trail + ' VIN is incorrect');
			el.prop('disabled', false);
            return false;
		}
		
        $.ajax({
            url: MAIN_LINK + '/db/dashController/' + '?' + window.location.search.substring(1),
            method: "POST",
            contentType: "application/json", // send as JSON
            data: JSON.stringify(data),
            success: function (data) {
                $('.messages-container').empty();
                var response = jQuery.parseJSON(data);
                if (response.code == '000') {
                    $(el).parent().find('input[type="text"]').val('');
                    alertMessage($('.messages-container'), tr_trail + ' ' + name + ' was added', 3000);
                } else {
                    alertError($('.messages-container'), response.message);
                }
				el.prop('disabled', false);
            }
        });
    });

});
function loadFleetFilters(){
	closeAll();
    switch (window.location.pathname)
    {
        case "/dash/fleet/fleetUsers/":
            $('#groups').show();
            $('#manage_users').show();
            break;
        case "/dash/fleet/fleetDrivers/":
            $('.fleet_subnav .sub_users').show();
            $('#active_drivers').show();
            break;
        case "/dash/fleet/add/":
            $('#add_user_box').show();
            $('.fleet_subnav .sub_add').show();
            break;
    }
}
function closeAll() {
	$('.sub_buttons').hide();
	$('#manage_users').hide();
	$('#demo_users').hide();
	$('#groups').hide();
	$('#add_truck').hide();
	$('#add_trailer').hide();
	$('#section_1 button').removeClass('active');
	$('#add_user_box').hide();
	$('#active_drivers').hide();
	$('#nactive_drivers').hide();
	$('.subnav.sub_users').hide();
	$('.subnav.sub_add').hide();
}
function clearAll() {
	$('#add_truck').find('input').val('');
	$('#add_truck').find('select').find('option').attr('selected', false);
	$('#add_truck').find('input:checkbox').removeAttr('checked');
	objectFadeRemove($('.alert'), 0);
	$('.messages-container').empty();
	resetError();
}
function showTerminatedUserLogs(el) {
    var userId = $('#one_nactive_driver_box #nactive_dr_id').val()
    var d = new Date();
    var curr_date = d.getDate();
    var curr_month = d.getMonth() + 1; //Months are zero based
    var curr_year = d.getFullYear();
    var pad = "00";
    var curr_month = (pad + curr_month).slice(-pad.length);
    var curr_date = (pad + curr_date).slice(-pad.length);
    var date = curr_year + "-" + curr_month + "-" + curr_date;
    dc.getUrlContent('/dash/history/log/', {driverId: userId, date: date, driverStatus: true});
}
function checkAcc(el){
	var prefix = '#';
    if($(el).closest('.ez_section').attr('id') =='active_drivers'){
        var box = '#one_driver_box ';
    }else{
       var box = '#one_nactive_driver_box ';
	   prefix = '#nactive_';
    }
    $('#one_driver_box input, #one_driver_box .trailers_box').val('');
    userId = $(el).attr('data-id');
    data = {data:{action: 'getFleetDriversData', userId:userId}};
    $.ajax({
        url:MAIN_LINK+'/db/dashController/' + '?' + window.location.search.substring(1),
        method:"POST",
        contentType: "application/json", // send as JSON
        data:JSON.stringify(data),
        success: function(data){
            var response = jQuery.parseJSON(data);
            c(response)
            if(response.code == '000'){
                $(box+'button').removeClass('active');
                var driver = response.data[0];

				var role = driver.companyPosition == 3 ? 0 : 1;
				c('driver.companyPosition ' + driver.companyPosition + ' role ' + role);
                $(box+prefix+'dr_id').val(userId);
                $(box+prefix+'dr_truck_s').val(driver.truckNumber);

				if(box == '#one_driver_box '){
					$(box+prefix+'dr_name').val(checkValue(driver.name));
					$(box+prefix+'dr_last').val(checkValue(driver.last));
				}else{
				   $(box+prefix+'dr_name').val(checkValue(driver.terminatedName));
					$(box+prefix+'dr_last').val(checkValue(driver.terminatedLast));
				}
                $(box+prefix+'dr_ssn').val(checkValue(driver.SSN));
                $(box+prefix+'dr_ein').val(checkValue(driver.EIN));
                var trailers = getTrailers(checkValue(driver.trailers));
                var trailerss = getTrailersWithButtons(checkValue(driver.trailers));
                $(box+prefix+'dr_trailers').val(trailers);
                $(box+'.trailers_box').html(trailerss);
                $(box+prefix+'dr_med').val(checkValue(driver.MedCard) == undefined ? '' : convertDateToUSA(checkValue(driver.MedCard)));
                $(box+prefix+'dr_birth').val(checkValue(driver.DateOfBirth) == undefined ? '' : convertDateToUSA(checkValue(driver.DateOfBirth)));
                $(box+prefix+'dr_hire').val(checkValue(driver.HireDate) == undefined ? '' : convertDateToUSA(checkValue(driver.HireDate)));
                $(box+prefix+'dr_term_date').val(checkValue(driver.TermitaneDate) == undefined ? '' : convertDateToUSA(checkValue(driver.TermitaneDate)));
                $(box+prefix+'dr_pull').val(checkValue(driver.PullNotice) == undefined ? '' : convertDateToUSA(checkValue(driver.PullNotice)));
				$(box+prefix+'dr_hazmat button[data-val="'+checkCheckInt(driver.HazMat)+'"]').click()
                $(box+prefix+'dr_smart_safety button[data-val="'+checkCheckInt(driver.SmartSafety)+'"]').click()
                $(box+prefix+'dr_insur button[data-val="'+checkCheckInt(driver.Insurance)+'"]').click()
				var roleVal = checkCheckInt(role);
                $(box+prefix+'dr_aobrd').prop('checked', checkCheck(driver.aobrd));
                $(box+prefix+'canEditTime').parent().attr('style','display:none !important');
				if(!driver.aobrd){
					$(box+prefix+'aobrdAbleToEdit').parent().attr('style','display:none !important');
					$(box+prefix+'iftaDistances').parent().attr('style','display:none !important');
					$(box+prefix+'iftaDistances button[data-val="'+roleVal+'"]').addClass('active');
                    $(box+prefix+'iftaDistances').attr('data-prev_val', roleVal);
                }else{
					$(box+prefix+'aobrdAbleToEdit').parent().attr('style','display:block !important');
					if (driver.aobrdAbleToEdit) $(box+prefix+'canEditTime').parent().attr('style','display:block !important');
					$(box+prefix+'iftaDistances').parent().attr('style','display:block !important');
                    $(box+prefix+'iftaDistances button[data-val="'+checkCheckInt(driver.iftaDistances)+'"]').addClass('active');
                    $(box+prefix+'iftaDistances').attr('data-prev_val', checkCheckInt(driver.iftaDistances));
                }
                $(box+prefix+'aobrdAbleToEdit button[data-val="'+checkCheckInt(driver.aobrdAbleToEdit)+'"]').addClass('active');
				$(box+prefix+'hideEngineStatuses button[data-val="'+checkCheckInt(driver.hideEngineStatuses)+'"]').click()

				if(driver.aobrd == 1)
					$(box+prefix+'dr_eld_new button[data-val="2"]').click()
				else{
					$(box+prefix+'dr_eld_new button[data-val="'+roleVal+'"]').click()
				}

				$(box+prefix+'dr_yardMode button[data-val="'+checkCheckInt(driver.yard)+'"]').click()
                $(box+prefix+'dr_conveyanceMode button[data-val="'+checkCheckInt(driver.conv)+'"]').click()
                $(box+prefix+'dr_personalCycle button[data-val="'+checkCheckInt(driver.personal_cycle)+'"]').click()
                $(box+prefix+'dr_personalTZ button[data-val="'+checkCheckInt(driver.personal_tz)+'"]').click()
                $(box+prefix+'dr_tank button[data-val="'+checkCheckInt(driver.TankerEndorsment)+'"]').click()
                $(box+prefix+'dr_cont_st').val(checkValue(driver.State));
                $(box+prefix+'dr_cont_city').val(checkValue(driver.City));
                $(box+prefix+'dr_cont_addr').val(checkValue(driver.Address));
                $(box+prefix+'dr_cont_phone').val(checkValue(driver.Phone));
				$(box+prefix+'dr_cont_sms button[data-val="'+checkCheckInt(driver.Sms)+'"]').click()
                $(box+prefix+'dr_lic_num').val(checkValue(driver.DLNumber));
                $(box+prefix+'dr_lic_st').val(checkValue(driver.DLState));
                $(box+prefix+'dr_lic_exp').val(checkValue(driver.DLExpiration) == undefined ? '' : convertDateToUSA(checkValue(driver.DLExpiration)));
                $(box+prefix+'dr_notes').val(checkValue(driver.notes));

                var rangeValuelist = getRangeValuelist($(box+'input[name="canEditTime_range"]'));
                if (rangeValuelist) {
                    var canEditTime_value = rangeValuelist.length - 1;
                    $.each(rangeValuelist, function(k, v){
                        if (v.v == driver.canEditTime) {
                            canEditTime_value = k;
                            return false;
                        }
                    });
                    $(box+'input[name="canEditTime_range"]').val(canEditTime_value);
                    if (driver.canEditTime && !$(box+'input[name="canEditTime"]').val()) $(box+'input[name="canEditTime"]').val(driver.canEditTime);
                }
				
                var medCardRemindRange = getRangeValuelist($(box+'input[name="medCardRemind_range"]'));
                if (medCardRemindRange) {
                    var medCardRemind_value = medCardRemindRange.length - 1;
                    $.each(medCardRemindRange, function(k, v){
                        if (v.v == driver.medCardRemind) {
                            medCardRemind_value = k;
                            return false;
                        }
                    });
                    $(box+'input[name="medCardRemind_range"]').val(medCardRemind_value);
                    if (driver.medCardRemind && !$(box+'input[name="medCardRemind"]').val()) $(box+'input[name="medCardRemind"]').val(driver.medCardRemind);
                }
                
                var driverLicenseRemindRange = getRangeValuelist($(box+'input[name="driverLicenseRemind_range"]'));
                if (driverLicenseRemindRange) {
                    var driverLicenseRemind_value = driverLicenseRemindRange.length - 1;
                    $.each(driverLicenseRemindRange, function(k, v){
                        if (v.v == driver.driverLicenseRemind) {
                            driverLicenseRemind_value = k;
                            return false;
                        }
                    });
                    $(box+'input[name="driverLicenseRemind_range"]').val(driverLicenseRemind_value);
                    if (driver.driverLicenseRemind && !$(box+'input[name="driverLicenseRemind"]').val()) $(box+'input[name="driverLicenseRemind"]').val(driver.driverLicenseRemind);
                }
                
				clearDoc2(box+' .attachments .loaded_doc');
				$.each(driver.attachments, function(key, attachment){
					$(box+' #'+attachment.docType).closest('.box_row').find('.loaded_doc').text(attachment.name);
					$(box+' #'+attachment.docType).closest('.box_row').find('.loaded_doc').attr('src', attachment.url);
					$(box+' #'+attachment.docType).closest('.box_row').find('.upload').text('Replace');
                    $(box+' #'+attachment.docType).closest('.box_row').addClass('file_exist');

				})
                $(box).show();
				$('.alert.alert-danger').remove();
            }else{
                alert(response.message)
            }
        }
    });
}
function clearDoc2(el){ 
	$(el).closest('.box_row').removeClass('file_loaded');
	$(el).closest('.box_row').removeClass('file_exist');
	$(el).closest('.box_row').find('.loaded_doc').hide().text('').attr('src','');
	$(el).closest('.box_row').find('.save_file').hide();
	$(el).closest('.box_row').find('.upload').text('Upload');
	$(el).closest('.box_row').find('input').val('');
}

function getTrailers(val){
    if(typeof val !== 'undefined' &&val !='null' && val != '' ){
        var trailers = '';
        for(var x = 0; x < val.length; x++){
            trailers += val[x].name+']_';

        }
        return trailers;
    }
}
function checkCheckInt(val){
    if(typeof val !== 'undefined' && !!val && val !='null' && val !=''  && val != '0' && val != '0000-00-00'){
        return 1;
    }else {
        return 0
    }
}
function checkCheck(val){
    if(typeof val !== 'undefined' && !!val && val !='null' && val !=''  && val != '0' && val != '0000-00-00'){
        return true;
    }else {
        return false
    }

}
function checkValue(val){
    if(val !='null' && val != ''  && val != '0000-00-00'){
        return val;
    }
}
function getTrailersWithButtons(val){
    if(typeof val !== 'undefined' &&val !='null' && val != '' ){
        var trailers = '';
        for(var x = 0; x < val.length; x++){
            trailers += '<span> '+val[x].name + ' <button class="remove_trailer" data-name="'+val[x].name+'">&mdash;</button></span>';
        }
        return trailers;
    }
    return '';
}
function upperCaseText(a){
    setTimeout(function(){
        a.value = a.value.toUpperCase();
    }, 1);
}
function saveEdit(el){
    var error = 0;
	var prefix = '#';
    if($(el).hasClass('oneDr')){
        var box = '#one_driver_box ';
    }else if($(el).hasClass('oneNaDR')){
        var box = '#one_nactive_driver_box ';
		prefix = '#nactive_';
    }else if($(el).hasClass('eqSave')){
        var box = '#one_equip_box ';
    }
    if(box == '#one_equip_box '){
        data = {data:{action: 'updateEquip'}};
        $('#one_equip_box input, #one_equip_box select').each(function(){
            var fname = $(this).attr('id');
            fname = fname.substring(8);

            if($(this).attr('type') == 'checkbox'){
                if($(this).is(':checked')){
                    data.data[fname] = $(this).val();
                }
            }else{
                if($(this).hasClass('datepicker') && $(this).val() != ''){
                    data.data[fname] = convertDateToSQL($(this).val());
                }else
                    data.data[fname] = $(this).val();
            }
        });
		data.data['isActive'] = $('#edit_tr_isActive').find('button.active').attr('data-val');
        data.data['Notes'] = $('#edit_tr_Notes').val();
		var vinRegex = /^([A-HJ-NPR-Z0-9]){17}$/;
		var truck_VIN = $('#edit_tr_VIN').val();
		if (!vinRegex.test(truck_VIN) && truck_VIN!='' && !$('#edit_tr_VIN').is(':disabled')) {
			error++;
			alertError($(box+'.popup_box_panel .info_box_result'), 'VIN is incorrect',3000);
		}
		if(error > 0){
            return false;
        }
    } else{
                    resetError();
        if($(box+prefix+'dr_name').val().trim() == ''){
            error++;
            alertError($(box+prefix+'dr_name').closest('.box_row'), 'First name cannot be empty');
        }
        if($(box+prefix+'dr_last').val().trim() == ''){
            error++;
            alertError($(box+prefix+'dr_last').closest('.box_row'), 'Last name cannot be empty');
        }
        if(error > 0){
            return false;
        }
        $(el).parent().find('.save_edit_result').removeClass('confirm').text('');
                    var eld = 0;
                    var aobrd = 0;
                    if($(box+prefix+'dr_eld_new button.active').attr('data-val') == 1){
                            eld = 1;
                    }else if($(box+prefix+'dr_eld_new button.active').attr('data-val') == 2){
                            aobrd = 1;
                    }
        data = {data:{action: 'updateDriversData', 
			userId:$(box+prefix+'dr_id').val(),
			name:$(box+prefix+'dr_name').val(),
			last:$(box+prefix+'dr_last').val(),
			SSN:$(box+prefix+'dr_ssn').val(),
			EIN:$(box+prefix+'dr_ein').val(),
			ELD:eld,
			AOBRD:aobrd,
			hideEngineStatuses:$(box+prefix+'hideEngineStatuses button.active').attr('data-val'),
			aobrdAbleToEdit:$(box+prefix+'aobrdAbleToEdit button.active').attr('data-val'),
			iftaDistances: $(box+prefix+'iftaDistances button.active').attr('data-val') || false,
			canEditTime:$('input[name="canEditTime"]').val(),
			medCardRemind:$('input[name="medCardRemind"]').val(),
			driverLicenseRemind:$('input[name="driverLicenseRemind"]').val(),
			YardMode:$(box+prefix+'dr_yardMode button.active').attr('data-val'),
			ConveyanceMode:$(box+prefix+'dr_conveyanceMode button.active').attr('data-val'),
			PersonalCycle:$(box+prefix+'dr_personalCycle button.active').attr('data-val'),
			PersonalTZ:$(box+prefix+'dr_personalTZ button.active').attr('data-val'),
			MedCard:$(prefix+'dr_med').val() != '' ? convertDateToSQL($(prefix+'dr_med').val()) : '0000-00-00',
			DateOfBirth:$(prefix+'dr_birth').val() != '' ? convertDateToSQL($(prefix+'dr_birth').val()) : '0000-00-00',
			HireDate:$(prefix+'dr_hire').val() != '' ? convertDateToSQL($(prefix+'dr_hire').val()) : '0000-00-00',
			TermitaneDate:$(prefix+'dr_term_date').val() != '' ? convertDateToSQL($(prefix+'dr_term_date').val()) : '0000-00-00',
			PullNotice:$(prefix+'dr_pull').val() != '' ? convertDateToSQL($(prefix+'dr_pull').val()) : '0000-00-00',
			HazMat:$(box+prefix+'dr_hazmat button.active').attr('data-val'),
			Insurance:$(box+prefix+'dr_insur button.active').attr('data-val'),
            SmartSafety:$(box+prefix+'dr_smart_safety button.active').attr('data-val'),
			TankerEndorsment:$(box+prefix+'dr_tank button.active').attr('data-val'),
			State:$(box+prefix+'dr_cont_st').val(),
			City:$(box+prefix+'dr_cont_city').val(),
			Address:$(box+prefix+'dr_cont_addr').val(),
			Phone:$(box+prefix+'dr_cont_phone').val(),
			Sms:$(box+prefix+'dr_cont_sms button.active').attr('data-val'),
			DLNumber:$(box+prefix+'dr_lic_num').val(),
			DLState:$(box+prefix+'dr_lic_st').val(),
			DLExpiration:$(prefix+'dr_lic_exp').val() != '' ? convertDateToSQL($(prefix+'dr_lic_exp').val()) : '0000-00-00',
			notes:$(box+prefix+'dr_notes').val()}};
    }
    
    $.ajax({
        url:MAIN_LINK+'/db/dashController/' + '?' + window.location.search.substring(1),
        method:"POST",
        contentType: "application/json", // send as JSON
        data:JSON.stringify(data),
        success: function(data){
            var response = jQuery.parseJSON(data);
            if(response.code == '000'){
				if (response.data == null || typeof response.data.equipment_history === 'undefined') {
                    global_equipment_history = '';
                } else {
                    global_equipment_history = response.data;
                    $.each(global_equipment_history.equipment_history, function (k, v) {
                        if (v.eldVIN != null) {
                            global_equipment_history.eldVINKey = k;
                        }
                    });
					$('#one_equip_box .popup_box_panel .look_eq_his_table').remove();
                    $('#one_equip_box .popup_box_panel .save_edit').after(`<button class="btn btn-default look_eq_his_table" onclick="actionGlobalLookEqHisTable();">History</button>`);
                }
				if(box == '#one_equip_box '){
                    alertMessage($(box+'.popup_box_panel .info_box_result'), 'Saved', 3000);
                    var vin = response.data.EldVin == '' ? response.data.VIN : response.data.EldVin+' <i style="padding-left:1px;" class="fa fa-lock" aria-hidden="true" title="Binded from ELD/AOBRD Device, not editable"></i>';
                    var name = (response.data.Name.length > 19) ? response.data.Name.substr(0, 19) + '&hellip;' : response.data.Name;
                    $('#trucks_table tbody tr[data-id="'+response.data.id+'"] td').eq(0).html(name)
                    $('#trucks_table tbody tr[data-id="'+response.data.id+'"] td').eq(2).text(response.data.Year)
                    $('#trucks_table tbody tr[data-id="'+response.data.id+'"] td').eq(3).text(getTruckTypeFromTypeId(response.data.Type))
                    $('#trucks_table tbody tr[data-id="'+response.data.id+'"] td').eq(4).text(response.data.Make)
                    $('#trucks_table tbody tr[data-id="'+response.data.id+'"] td').eq(5).html(vin)
                    $('#trucks_table tbody tr[data-id="'+response.data.id+'"] td').eq(6).text(timeFromSQLDateTimeStringToUSAString(response.data.ExpDate))
                    $('#trucks_table tbody tr[data-id="'+response.data.id+'"] td').eq(7).text(response.data.Owner)
                    $('#trucks_table tbody tr[data-id="'+response.data.id+'"] td').eq(8).text(response.data.isActive == 1 ? 'Active' : 'Deactivated')

                }else{
					alertMessage($(box+'.popup_box_panel .save_edit_result'), 'Saved', 3000);
								   
					var userId = $(box+'#dr_id').val();
					var pos = 'Driver';
					if($(box+'#dr_eld_new button.active').attr('data-val') == 1){
							pos = 'Driver Eld';
					}else if($(box+'#dr_eld_new button.active').attr('data-val') == 2){
							pos = 'Driver Aobrd';
					}
					var fullName = $(box+'#dr_name').val() + ' '+$(box+'#dr_last').val();
					$('#active_drivers tbody tr[data-id="'+userId+'"] td').eq(0).html(createProfilePopupButton(userId,fullName))
					$('#active_drivers tbody tr[data-id="'+userId+'"] td').eq(3).text(pos)
				} 
            }else{
                alertError($(box+'.popup_box_panel .info_box_result'), response.message, 3000);
            }
        }
    })
}
function getTruckTypeFromTypeId(typeId){
	var name = 'Property';
	if(typeof truckTypes !== 'undefined'){
		$.each(truckTypes, function(key, typeIn){
			if(typeIn.id == typeId){
				name = typeIn.name;
			}
			return true;
		});
	}
	return name;
}
function editEquipment(el) {
    $('#one_equip_box .save_edit_result').empty();
    data = {data: {action: 'getEquiptmentData', eqId: $(el).attr('data-id')}};
    $('#one_equip_box input[type="text"]').val('');
    $.ajax({
        url: MAIN_LINK + '/db/dashController/' + '?' + window.location.search.substring(1),
        method: "POST",
        contentType: "application/json", // send as JSON
        data: JSON.stringify(data),
        success: function (data) {
            var response = jQuery.parseJSON(data);
            c(response);
            if (response.code == '000') {
				var is_trailer = response.data.truckTrailer == 0 ? 0 : 1;
                var popupName = !is_trailer ? 'EDIT TRUCK' : 'EDIT TRAILER';
                $('#one_equip_box .box_header').text(popupName);
                $('#one_equip_box input').each(function () {
                    var fname = $(this).attr('id')

                    fname = fname.substring(8);

                    var val = response.data[fname];
                    if ($(this).hasClass('datepicker') && val != null) {
                        var date2 = new Date(val);
                        $(this).datepicker('setDate', date2)
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
                            if (typeof response.data.EldVin === 'undefined') {
                                c('noEldVin');
                                $(this).val(val);
                                $(this).prop('disabled', false);
                            } else {
                                c('EldVin');
                                if (response.data['EldVin'] != '') {
                                    $(this).val(response.data['EldVin']);
                                    $(this).prop('disabled', true);
                                } else {
                                    $(this).val(val);
                                    $(this).prop('disabled', false);
                                }
                            }
                        } else
                            $(this).val(val);
                    }
                });
                $('#one_equip_box .popup_box_panel .look_eq_his_table').remove();
                if (typeof response.data.equipment_history === 'undefined') {
                    global_equipment_history = '';
                } else {
                    global_equipment_history = response.data;
                    $.each(global_equipment_history.equipment_history, function (k, v) {
                        if (v.eldVIN != null) {
                            global_equipment_history.eldVINKey = k;
                        }
                    });
                    $('#one_equip_box .popup_box_panel .save_edit').after(`<button class="btn btn-default look_eq_his_table" onclick="actionGlobalLookEqHisTable();">History</button>`);
                }
                var fType = response.data['Fuel'];
                $('#one_equip_box select').val(fType);
				if(is_trailer){
					$('#edit_tr_Type option[value="2"]').hide();
				} else {
					$('#edit_tr_Type option[value="2"]').show();
				}
                $('#edit_tr_Type').val(response.data['Type']);
				$('#edit_tr_State').val(response.data['State']);
                $('#edit_tr_Notes').val(response.data['Notes']);
				$('#edit_tr_isActive').find('button[data-val="'+response.data['isActive']+'"]').click();
                $('#one_equip_box').show();
            } else {
                alert(response.message)
            }
        }
    })
}

function driversMoveLogsPopup(carrierId, isManager = false) {
    let action = isManager ? 'getManagerCarrierCardUsersPagination' : 'driversPagePagination';
    let url = isManager ? apiAdminUrl : apiDashUrl;
    let data = {
        "pagination": {
            "page": 1,
            "perPage": "1000000",
            "orderBy": {
                "param": "name",
                "dir": "asc"
            },
            "filters": {
                "carrierId": carrierId,
                "undefined": "on",
                "active": "1"
            }
        },
        "additionalData": {}
    }

    AjaxController(action, data, url, driversMoveLogs, driversMoveLogs, true);
}

function driversMoveLogs(response, action) {
    if (response.code === '000') {
        let smartSafetyFleetUsers = '<div class="select__option" data-value="" onclick="selectOptionsCustomSelect(this);">Select driver</div>';

        if (response.data.result.length > 0) {
            (response.data.result).map(user => {
                if (user.companyPosition == TYPE_DRIVER || user.companyPosition == TYPE_DRIVER_ELD) {
                    smartSafetyFleetUsers += `<div class="select__option" data-value="${user.id}" onclick="selectOptionsCustomSelect(this);">${user.name} ${user.last}</div>`;
                }
            })
        }

        let className = 'driversMoveLogs';
        let title = 'Data transfer between two drivers';
        let footerBtns = `
            <button type="button" class="btns-item btn btn-default" onclick="document.querySelector('.section__popup').remove()">Cancel</button>
            <button type="button" class="btns-item btn btn-primary-new" id="confirmDriversMoveLogsBtn" onclick="confirmDriversMoveLogs(${action == 'getManagerCarrierCardUsersPagination' ? false : true})">Confirm</button>
        `;
        let content = `
            <div class="popup__content-container">
                <div class="popup__content-row">
                    <div class="row__title">First driver</div>
                    <div class="row__content">
                        <div class="item-custom-select select__container">
                            <div id="driverFrom" class="select__selected" data-value="" onclick="showOptionsCustomSelect(this)">Select driver</div>
                            <div class="select__content">${smartSafetyFleetUsers}</div>
                        </div>
                    </div>
                </div>
                <div class="popup__content-row">
                    <div class="row__title">Second driver</div>
                    <div class="row__content">
                        <div class="item-custom-select select__container">
                            <div id="driverTo" class="select__selected" data-value="" onclick="showOptionsCustomSelect(this)">Select driver</div>
                            <div class="select__content">${smartSafetyFleetUsers}</div>
                        </div>
                    </div>
                </div>
                <div class="popup__content-row">
                    <div class="row__title">Start date</div>
                    <div class="row__content">
                        <input type="text" class="datepicker row__input" id="startDateMoveLogs">
                    </div>
                </div>
                <div class="popup__content-row">
                    <div class="row__title">End date</div>
                    <div class="row__content">
                        <input type="text" class="datepicker row__input" id="endDateMoveLogs">
                    </div>
                </div>
                <div class="popup__content-row">
                    <div class="row__title">Start time</div>
                    <div class="row__content">
                        <input type="text" class="row__input input-time" id="startTimeMoveLogs">
                    </div>
                </div>
                <div class="popup__content-row">
                    <div class="row__title">End time</div>
                    <div class="row__content">
                        <input type="text" class="row__input input-time" id="endTimeMoveLogs">
                    </div>
                </div>
            </div>
            <div class="popup__content-container">
                <div class="popup__content-row switcher">
                    <div class="row__content">
                        <button type="button" class="btn-switcher row__input" id="includeLogsInfo" data-val="0" onclick="changeActive(this);">
                            <span class="sw-label">Include logs info</span>
                            <span class="sw-switcher"></span>
                        </button>
                    </div>
                </div>
                <div class="popup__content-row switcher">
                    <div class="row__content">
                        <button type="button" class="btn-switcher row__input" id="includeDocuments" data-val="0" onclick="changeActive(this);">
                            <span class="sw-label">Include documents</span>
                            <span class="sw-switcher"></span>
                        </button>
                    </div>
                </div>
                <div class="popup__content-row switcher">
                    <div class="row__content">
                        <button type="button" class="btn-switcher row__input" id="includeDvir" data-val="0" onclick="changeActive(this);">
                            <span class="sw-label">Include DVIR</span>
                            <span class="sw-switcher"></span>
                        </button>
                    </div>
                </div>
                <div class="popup__content-row switcher">
                    <div class="row__content">
                        <button type="button" class="btn-switcher row__input" id="oneWayMove" data-val="0" onclick="changeActive(this);">
                            <span class="sw-label">One-way move</span>
                            <span class="sw-switcher"></span>
                        </button>
                    </div>
                </div>
            </div>
            <div class="popup__content-container" id="errorMsg"></div>
        `;

        showNewModal(className, title, content, footerBtns);

        $(document).find('.driversMoveLogs .datepicker').datepicker({dateFormat: 'mm-dd-yy', maxDate: new Date()}).datepicker("setDate", new Date());
        scrollbarInit(`.driversMoveLogs .select__container .select__content`);

        let selectContainers = document.querySelectorAll('.select__container .select__content');

        if (response.data.result.length < 5) {
            selectContainers.forEach( (item, index) => {
                let h = (response.data.result.length + 1) * 60;
                item.style.height = (index % 2 == 0 ? h + 2 : h) + 'px';
                item.classList.add('bgc-initial');
            });
        }

        let timeEntryOption = {
            show24Hours: false,
            separator: ' : ',
            ampmPrefix: ' ',
            ampmNames: ['AM', 'PM'],
            spinnerTexts: ['Now', 'Previous field', 'Next field', 'Increment', 'Decrement'],
            appendText: '',
            showSeconds: true,
            timeSteps: [1, 1, 1],
            initialField: null,
            noSeparatorEntry: true,
            useMouseWheel: true,
            defaultTime: null,
            minTime: null,
            maxTime: null,
            spinnerImage: '/dash/assets/svg/log/up-down.svg',
            spinnerSize: [30, 60, 0],
            spinnerBigImage: '',
            spinnerBigSize: [30, 60, 0],
            spinnerIncDecOnly: true,
            spinnerRepeat: [500, 250],
            beforeShow: null,
            beforeSetTime: null
        }

        $('#startTimeMoveLogs').timeEntry(timeEntryOption);
        $('#endTimeMoveLogs').timeEntry(timeEntryOption);
        $('#startTimeMoveLogs').timeEntry('setTime', new Date(0, 0, 0, 0, 0, 0));
        $('#endTimeMoveLogs').timeEntry('setTime', new Date(0, 0, 0, 0, 0, 0));
    }
}

function confirmDriversMoveLogs(isTeamDrivers) {
    let driverFrom = document.getElementById('driverFrom');
    let driverFromStr = driverFrom.getAttribute('data-value');
    let driverTo = document.getElementById('driverTo');
    let driverToStr = driverTo.getAttribute('data-value');
    let dateFrom = document.getElementById('startDateMoveLogs').value;
    let dateTo = document.getElementById('endDateMoveLogs').value;
    let timeFrom = $('#startTimeMoveLogs').timeEntry('getTime');
    let timeTo = $('#endTimeMoveLogs').timeEntry('getTime');
    let includeLogsInfo = document.getElementById('includeLogsInfo').getAttribute('data-val') == 1 ? true : false;
    let includeDvir = document.getElementById('includeDvir').getAttribute('data-val') == 1 ? true : false;
    let includeDocs = document.getElementById('includeDocuments').getAttribute('data-val') == 1 ? true : false;
    let oneWayMove = document.getElementById('oneWayMove').getAttribute('data-val') == 1 ? true : false;
    let error = false;
    let dateFromSrt = moment(dateFrom.replace(/-/g, "/")).format('YYYY-MM-DD') + ' ' + moment(timeFrom).format('HH:mm:ss');
    let dateToSrt = moment(dateTo.replace(/-/g, "/")).format('YYYY-MM-DD') + ' ' + moment(timeTo).format('HH:mm:ss');

    let errorLabel = document.querySelectorAll('.driversMoveLogs .error');

    errorLabel.length > 0 ? errorLabel.forEach(item => item.classList.remove('error')) : '';

    if (driverFromStr == '') {
        driverFrom.classList.add('error');
        error = true;
    }
    if (driverToStr == '') {
        driverTo.classList.add('error');
        error = true;
    }

    if (error) {
        return false;
    }

    if (isTeamDrivers) {
        if (curUserIsSmartSafety(driverFromStr) || curUserIsSmartSafety(driverToStr)) {
            isTeamDrivers = false;
        }
    }

    let data = {
        'driverFrom': driverFromStr,
        'driverTo': driverToStr,
        'dateFrom': dateFromSrt,
        'dateTo': dateToSrt,
        includeLogsInfo,
        includeDvir,
        includeDocs,
        oneWayMove,
        isTeamDrivers
    };

    AjaxController('swapDriverLogs', data, dashUrl, confirmDriversMoveLogsHandler, confirmDriversMoveLogsHandler, true);
    newPrealoder('#confirmDriversMoveLogsBtn', 10, 0.6);
}

function confirmDriversMoveLogsHandler(response) {
    if (response.code === '000') {
        document.querySelector('.section__popup').remove();
        showNewModal('responseHandler successHandler', '', `<p class="row__text success">Request sent successfully</p>`, '');

        setTimeout(() => {
            document.querySelector('.section__popup').remove();
        }, 2000);
    } else if (response.code == '400') {
        let errorMsg = document.querySelector('.driversMoveLogs #errorMsg');
        let preloader = document.querySelector('.preloader');

        preloader.closest('#confirmDriversMoveLogsBtn').innerText = 'Confirm';

        errorMsg.innerText = response.message;
        errorMsg.classList.add('active');
    } else {
        let btns = `<button type="button" class="btns-item btn btn-primary-new" onclick="document.querySelector('.section__popup').remove()">OK</button>`;
        let content = `
                <div class="popup__content-desc">${response.message} <br> please try again later.</div>
            `;

        showNewModal('responseHandler errorHandler', 'Something went wrong', content, btns);
    }
}