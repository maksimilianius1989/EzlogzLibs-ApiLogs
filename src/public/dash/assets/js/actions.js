function showCurStatuses(e) {
    var drSt = $(e).find('.text').text();
    if (drSt == 'Drivers on duty') {
        createCookie('driverSt', 'ON');
    } else if (drSt == 'Drivers on the road') {
        createCookie('driverSt', 'DR');
    } else if (drSt == 'Drivers off duty') {
        createCookie('driverSt', 'OFF');
    } else if (drSt == 'Sleeper berth') {
        createCookie('driverSt', 'SB');
    }
    if (window.location.pathname == "/dash/drivers/")
        checkSt(true); 
    else {
        $('.body-panel-header').append('<a href="/dash/drivers/" class="dash_url_button" style="display:none" id="move_but">LOGS</a>')
        $('#move_but').click();
    } 
}
var notificationEvent = false; 
$().ready(function () {
    $(document).keyup(function (e) {
		if (e.keyCode == 27 && $('.fullScreenMap').length > 0) {
			$('.fullScreenMap').find('.mapFullScreenControl').click();
		}
	});
    $('.content').on('shown.bs.dropdown', function (e) {
        var el = $(e.target).closest('.table_wrap')
        if (el.length && $(el).get(0).scrollHeight > $(el).get(0).offsetHeight) {
            $(el).height($(el).get(0).scrollHeight + 15)
        }
    })
    $('.content').on('hide.bs.dropdown', function (e) {
        var el = $(e.target).closest('.table_wrap');
        if (el.length) {
            $(el).height('auto');
        }
    })
	AjaxController('getEldCables', {}, dashUrl, 'getEldCablesHandler', errorBasicHandler, true);
    $('body').on('click', '#dvirs_box.dispatcherDvirsBox tbody tr', function (e)
    {
        e.stopPropagation();
        if (e.target.localName == 'button' || typeof $(this).attr('data-id') == 'undefined')
            return;
        dc.getUrlContent('/dash/history/dvir/', {driverId: $(this).attr('data-id'), date: $(this).attr('data-date'), time: $(this).attr('data-time'), truckId: $(this).attr('data-truck'), dvirId: $(this).attr('data-dvirid')});
    });
    $('body').on('click', '#logs_box.dispatcherLogsBox tbody tr', function (e)
    {
        e.stopPropagation();
        if (typeof $(this).attr('data-id') == 'undefined')
            return;
        dc.getUrlContent('/dash/history/log/', {driverId: $(this).attr('data-id'), date: $(this).attr('data-date')});
    });
    $('body').on('click', '#logs_box.driverLogsBox tbody tr', function (e)
    {
        e.stopPropagation();
        dc.getUrlContent('/dash/drivers/log/', {driverId: $(this).attr('data-id'), date: $(this).attr('data-date'), driverStatus: true});
    });
    $('body').on('click', '#dvirs_box.driverDrivsBox tbody tr', function (e) {
        e.stopPropagation();
        if (typeof $(this).attr('data-id') == 'undefined')
            return;
        dc.getUrlContent('/dash/trucks/dvir/', {driverId: $(this).attr('data-id'), date: $(this).attr('data-date'), time: $(this).attr('data-time'), truckId: $(this).attr('data-truck'), notFleet: 12, dvirId: $(this).attr('data-dvirid')});
    });
    $('body').on('click', '.close_edit', function ()
    {
        if ($(this).hasClass('remove')) {
			$(this).closest('.one_part_box').remove();
        } else
			$(this).closest('.one_part_box').hide();
    });
    $('body').on('click', '#days_table .date', function () {
        var x = $(this).attr('dadat-day');
        var add_new_status = $('#add_new_status');
        if (add_new_status.length > 0) {
            var year = $('#rep_year option:selected').text();
            var month = $('#rep_month option:selected').val();
            month = ("0" + month).slice(-2);
            add_new_status.attr('data-day', year + '-' + month + '-' + x);
            add_new_status.attr('onclick', 'createNewStatusPopup(this);');
            $('.selected_day').text('Select: ' + year + '-' + month + '-' + x);
        }
    });
    $('body').on('click', '.worked', function ()
    {
        var report = '';
        var workedHours = 0;
        var workedMins = 0;
        var x = $(this).attr('dadat-day');
        var add_new_status = $('#add_new_status');
        if (add_new_status.length > 0) {
            var year = $('#rep_year option:selected').text();
            var month = $('#rep_month option:selected').val();
            month = ("0" + month).slice(-2);
            add_new_status.attr('data-day', year + '-' + month + '-' + x);
            add_new_status.attr('onclick', 'createNewStatusPopup(this);');
            $('.selected_day').text('Select: ' + year + '-' + month + '-' + x);
        }
        $.each(dates, function (key, item) {
            var thisDate = parseInt(item.date.slice(-2));
            if (x == thisDate) {
                if ($('#log_book').length > 0)
                    getEmployeeLogbook(item.date);
                workedHours = parseInt(item.hours);
                workedMins = parseInt(item.minutes);
                if (workedHours != 0 || workedMins != 0) {
                    report = item.reports;
                }
            }
        })
    });
    $('body').on('click', '#messages_box .one_box', function ()
    {
        $('.one_box').removeClass('active');
        $(this).addClass('active');
        var driverId = $(this).attr('data-id');
        var driverName = $(this).attr('data-name');
        var type = 0; 
        if (driverId != undefined) {
            var msgs = dcc.fleetMessagesDrivers[driverId].messages;
            $('#chat_el .name').empty().text(driverName);
            $('#chat_msgs').empty();
            $('#chat_input').attr('data-id', driverId).attr('data-type', type);
            var drName = driverName;
            var userName = getCookie("user");
            $.each(msgs, function (key, message) {
                addMessageOnScreen(message, userName, drName, driverId);
            });
            $("#chat_msgs").scrollTop($("#chat_msgs")[0].scrollHeight);
            if ($("#chat_msgs").scrollTop() == 0 && !$(this).hasClass('loaded'))
            {
                getMoreFleetMessages(driverId, $('#chat_msgs .chat_one_msg:first').attr('data-time'));
            }
            if ($(this).hasClass('hasNotReadFleetMessages'))
            {
                readFleetMessage(driverId)
            }
            $('.right_sec.messages_page').removeClass('display');
        }
    });
    $(window).resize(function () {
        //$('.dash_footer').width($('.wrapper.dash_wrap').width());
        if ($('#user_nav').length > 0) {
            if ($(window).width() > 980)
            {
                $('#user_tabs').css('right', 0);
                $('#user_tabs').css('left', 'initial');
            } else
            {
                $('#user_tabs').css('left', $('#user_nav').offset().left);
                $('#user_tabs').css('right', 'initial');
            }
        } else if ($('#user_tabs').length > 0) {
            $('#user_tabs').css('left', $('.account_access a').offset().left - 80);
        }
    });
    //$('.dash_footer').width($('.wrapper.dash_wrap').width());

    $('body').on('click', '#go_policy', function () {
        $('#policy').toggle();
    })
    $('body').on('click', '#close_policy', function () {
        $('#policy').hide();
    })
    $('body').on('click', '#acc_set', function () {
        window.location.href = MAIN_LINK + "/dash/settings/account/";
    })
    $('body').on('click', '#fleet_set', function () {
        window.location.href = MAIN_LINK + "/dash/settings/fleet_settings/";
    })
    $('body').on('click', '#poi_chose', function () {
        if ($('#expanded_map').is(':visible')) {
            $('#poi_chose_box').css('bottom', '-15px');
        } else {
            $('#poi_chose_box').css('bottom', '15px');
        }
            var m = $('#googleMap');
        $('#poi_chose_box').css('height', m.height()).animate({'width': '280px'}, 500);
    })
    $('body').on('click', '#close_poi', function () {
        $('#poi_chose_box').animate({'width': '0'}, 500);
    })
    $('body').on('click', '#expandMap', function () {
        if ($('#expanded_map').is(":visible")) {
            $('#section_1 .left_sec').append($('#googleMap'));
            $('#expanded_map').empty().hide();

        } else {
            $b1 = $('#showAll').clone().remove();
            $b2 = $('#expandMap').clone().remove();
            $b3 = $('#poi_chose').clone().remove();
            $b5 = $('#w_s_button').clone().remove();
            $b4 = $('#poi_chose_box').clone().remove();
            $('#expanded_map')
                .append($('#googleMap'))
                .append($b1).append($b3).append($b4).append($b5)
                .append($b2).show();
        $('#expanded_map #expandMap').removeClass('icon-expand').addClass('icon-decrease');

        }   
        center = map.getCenter();
        google.maps.event.trigger(map, "resize");
        map.setCenter(center);
    });

    $('body').on('click', '#alerts_close', function () {
        $('#alerts_box').toggle();
    });

    $('body').on('click', '#left_arrow', function () {
            slide('right');
    });
    $('body').on('click', '#right_arrow', function () {
            slide('left');
    });

    $(window).scroll(function () {

        $('.icon_box img').each(function () {
            if (isScrolledIntoView($(this))) {
                $(this).animate({'opacity': '1'}, 1500);
			}
		});
		hideDaterange();
    });
    $(window).bind('mousewheel DOMMouseScroll', function (event) {
		hideDaterange();
	});
    $('body').on('click', '#box_sign_in', function () {
            var email = $('#box_email').val();
            $('.log_form input').removeClass('inp_error');
            $('#reg_email').val(email);
        if (!IsEmail(email)) {
                    $('#reg_email').addClass('inp_error');
                    $('.log_error.em_reg').text('Please enter valid email');
            }
            $('.sign_in').click();
    });
    
    
    
    $('body').on('click', '#user_nav i, #dashHeaderUserName', function () {
        $('#user_tabs').toggle();
    });
    $('body').on('click', '#user_nav #dashHeaderAvatar, #user_tabs #soc_button', function () {
        if (fleetC.checkDemoAccess()) {
            return false;
        }
        window.location.href = MAIN_LINK + "/social/";
    });
    $('body').on('click', '#dash_button', function () {
        if ($(this).hasClass('driver')) {
			createCookie('dashboard', 'driver', 30);
        } else if ($(this).hasClass('fleet')) {
			eraseCookie('dashboard');
			}
        window.location.href = MAIN_LINK + "/dash/";
    });
    $('.datepicker.from').change(function () {
        $('.datepicker.till').datepicker('option', 'minDate', new Date($('.datepicker.from').val()));
    });
    
    function hideDaterange() {
        if ($('.daterangepicker').length > 0 && typeof $('.daterange').data('daterangepicker') != 'undefined') {
			$(window).resize();
            for (var x = 10; x <= 250; x += 10) {
                setTimeout(function () {
                    $(window).resize();
                }, x)
			}
		}
	}
    
    $('#user_new_pass, #user_new_pass_again').keyup(function () {
        if ($('#user_new_pass').removeClass('error').val() != $('#user_new_pass_again').removeClass('error').val() || $('#user_new_pass').val().length < 6) {
            $('#user_new_pass, #user_new_pass_again').addClass('error');
        }
    })

    $('body').on('click', '#acc_update_user', function () {
        if (fleetC.checkDemoAccess()) {
            return false;
        }
        var isSoloDriver = parseInt($('#isSoloDriver').val()),
            is_recurring = $('#is_recurring').val(),
            type = parseInt($('#user_role').val());
        //Confirmation
        if (is_recurring == 1 && isSoloDriver === 1 && type !== TYPE_DRIVER_ELD) {
            $('.modal-bs-basic').remove();
            showModalConfirmation('Warning', '<p class="text-center">In case of account type change all recurring payments will be cancelled!</p>');
            $('#confirmationModal').off('click', '#btnConfirmClick').on('click', '#btnConfirmClick', function (e) {
                updateUser();
            });
        } else {
            updateUser();
        }
    });

    function updateUser() {
        var no_error = true,
            name = $('#user_name').val(),
            last = $('#user_last').val(),
            phone = $('#user_phone').val(),
            type = parseInt($('#user_role').val()),
            email = $('#user_email').val();

        resetError();
        $('#acc_user_result').text('');
        $('#acc_user_result').removeClass('confirm');

        if (name == '') {
            no_error = setError($('#user_name'), 'Enter First Name');
        } else if (!/^[A-Za-z-']+( [A-Za-z-']+)*$/.test(name)) {
            no_error = setError($('#user_name'), 'Enter only Latin letters');
        } else if (name.length < 2) {
            no_error = setError($('#user_name'), 'Min allowed 2 characters');
        } else if (name.length > 30) {
            no_error = setError($('#user_name'), 'Max allowed 30 characters');
        }

        if (last == '') {
            no_error = setError($('#user_last'), 'Enter Last Name');
        } else if (!/^[A-Za-z-']+( [A-Za-z-']+)*$/.test(last)) {
            no_error = setError($('#user_last'), 'Enter only Latin letters');
        } else if (last.length < 2) {
            no_error = setError($('#user_last'), 'Min allowed 2 characters');
        } else if (last.length > 30) {
            no_error = setError($('#user_last'), 'Max allowed 30 characters');
        }
		
        if ($('#user_email').length > 0)
            if (email == '') {
            no_error = setError($('#user_email'), 'Enter Email');
            } else if (!isValidEmailAddress(email)) {
            no_error = setError($('#user_email'), 'Email address not valid');
            } else if (email.length > 75) {
            no_error = setError($('#user_email'), 'Max allowed 75 characters');
        }

        if ($('#user_new_pass').val() != '' && $('#user_new_pass').val().length < 5) {
            no_error = setError($('#user_new_pass'), 'Password length must be more than 5 characters');
        } else if ($('#user_new_pass').val() != '' && $('#user_new_pass').val().length > 32) {
            no_error = setError($('#user_new_pass'), 'Max allowed 32 characters');
        } else if ($('#user_new_pass').val() != '' && !/^[A-Za-z0-9-_+=.,?!]+$/.test($('#user_new_pass').val())) {
            no_error = setError($('#user_new_pass'), 'Password must contain only letters and numbers');
        }

        if (phone == '') {
            no_error = setError($('#user_phone'), 'Phone can not be empty');
        } else if (phone.length != 12) {
            no_error = setError($('#user_phone'), 'Phone length must be 10 characters');
        }

        if ($('#user_new_pass').val() != '' && $('#user_new_pass').val() != $('#user_new_pass_again').val()) {
            no_error = setError($('#user_new_pass_again'), 'Passwords not match');
        } else {
            var pass = $('#user_new_pass').val();
        }
        if (no_error == true) {
            var data = {
                data: {
                    action: 'updateAccountInfo',
                    name: name,
                    last: last,
                    email: email,
                    phone: phone, /*ext:ext,*/
                    pass: pass,
                    type: type
                }
            };
            $.ajax({
                url: MAIN_LINK + '/db/dashController/' + '?' + window.location.search.substring(1),
                method: "POST",
                contentType: "application/json", // send as JSON
                data: JSON.stringify(data),
                success: function (data) {
                    $('#accountInfoMessages').empty();
                    var response = jQuery.parseJSON(data);
                    if (response.code == '000') {
                        eraseCookie("last");
                        eraseCookie("user");
                        eraseCookie("compos");
                        createCookie('user', name, 30);
                        createCookie('last', last, 30);
                        createCookie('compos', type, 30);
                        $('#user_nav button').first().text(name + ' ' + last);
                        if ($('#user_role').val() != $('#user_role').attr('data-type')) {
                            if ($('#user_role').val() == 0 || $('#user_role').val() == 6) {
                                window.location.href = '/social/';
                            } else {
                                window.location.href = window.location.href;
                            }
                        } else {
                            alertMessage($('#accountInfoMessages'), 'Saved', 3000);
                        }
                    } else if (response.code == '245') {
						c('createVerificationCode');
                        verifyC.createVerificationCode('user_phone');
                        alertMessage($('#accountInfoMessages'), response.message, 4000);
                    } else if (response.code == '246') {
                        var oldEmail = $('#user_email').attr('data-old'),
                            newEmail = $('#user_email').val(),
                                message = 'Need confirm email by link. Please, check your mail "' + newEmail + '"';
                        if (oldEmail != newEmail) {
                            $('#user_email').val(oldEmail);
                        }
                        alertMessage($('#accountInfoMessages'), response.message, 4000);
					} else {
                        alertError($('#accountInfoMessages'), response.message, 3000);
                    }
                }
            });
        }
    }
    $('body').on('click', '#join_fleet_c', function () {
        $('#join_fleet_window').hide();
    });
    $('body').on('click', '#acc_join_fleet', function () {
        $('#join_fleet_window').show();
    });
    $('body').on('click', '#join_fleet_check', function (e) {
        e.preventDefault();
        resetError();
        $('#update_result').attr('data-usdot', '');

        if ($('#join_fleet_input').val() == '')
            return setError($('#join_fleet_input'), 'Enter USDOT number');
        else if ($('#join_fleet_input').val().length > 9)
            return setError($('#join_fleet_input'), 'USDOT length can\'t be more than 9 characters');

        $.ajax({
            url: MAIN_LINK + '/db/reg_search/' + '?' + window.location.search.substring(1),
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify({data: {usdot: $('#join_fleet_input').val(), action: 'chose_usdot'}}),
            success: function (data) {
                var response = jQuery.parseJSON(data);
                if (response.code == '000') {
                    alertMessage($('#formJoinFleet'), response.data.name, 3000);
                    $('#join_fleet_input').data('usdot', $('#join_fleet_input').val());
                } else if (response.code == '206' || response.code == '208') {
                    alertError($('#formJoinFleet'), response.message, 3000);
                }
            }
        });
    });
    $('body').on('keyup', '#join_fleet_input', function () {
        if ($('#join_fleet_input').val() != '') {
            $('#modalJoinFleet *').removeClass('error').find('.error-handler').remove();
            $('#modalJoinFleet *').removeClass('confirm').find('.confirm-handler').remove();
        }
    });
    $('body').on('click', '#update_driver_fleet', function () {
        resetError();
        var no_error = true;
        if ($('#driver_fleet_name').val().trim() == '')
            no_error = setError($('#driver_fleet_name'), 'Enter Fleet Name');
        else if (!/^[A-Za-z0-9-\s\#']+( [A-Za-z0-9-\s\#']+)*$/.test($('#driver_fleet_name').val()))
            no_error = setError($('#driver_fleet_name'), 'Only Latin letters and Numbers are allowed');
        else if ($('#driver_fleet_name').val().length > 64)
            no_error = setError($('#driver_fleet_name'), 'Max allowed 64 characters');

        if ($('#driver_fleet_usdot').val() == '')
            no_error = setError($('#driver_fleet_usdot'), 'Enter USDOT number');
        else if ($('#driver_fleet_usdot').val().length > 9)
            no_error = setError($('#driver_fleet_usdot'), 'USDOT length can\'t be more than 9 characters');

        if ($('#driver_fleet_address').val().trim() == '')
            no_error = setError($('#driver_fleet_address'), 'Enter fleet address');
        else if ($('#driver_fleet_address').val().length > 50)
            no_error = setError($('#driver_fleet_address'), 'Max allowed 50 characters');

        if ($('#driver_fleet_city').val().trim() == '')
            no_error = setError($('#driver_fleet_city'), 'Enter fleet city');
        else if (!/^[A-Za-z-']+( [A-Za-z-']+)*$/.test($('#driver_fleet_city').val()))
            no_error = setError($('#driver_fleet_city'), 'Enter only Latin letters');
        else if ($('#driver_fleet_city').val().length > 50)
            no_error = setError($('#driver_fleet_city'), 'Max allowed 50 characters');

        if (!parseInt($('#driver_fleet_state').val()))
            no_error = setError($('#driver_fleet_state'), 'Chose state');

        if ($('#driver_fleet_zip').val() && !validate.zip($('#driver_fleet_zip').val()))
            no_error = setError($('#driver_fleet_zip'), 'Enter Zip code');
        if (position == TYPE_DRIVER_ELD) {
            if ($('#act_license_number').val() == '')
                no_error = setError($('#act_license_number'), 'Enter driver license number');
            else if (!/^[A-Z0-9-*']+( [A-Z0-9-*']+)*$/.test($('#act_license_number').val()))
                no_error = setError($('#act_license_number'), 'Enter valid driver license number');
            else if ($('#act_license_number').val().length > 20)
                no_error = setError($('#act_license_number'), 'Length can\'t be more than 20 characters');

            if (!parseInt($('#act_license_state').val()))
                no_error = setError($('#act_license_state'), 'Chose driver license state');
        }
        if (no_error === true) {
            var data = {
                'action': 'updateDriverFleet',
                'name': $('#driver_fleet_name').val(),
                'usdot': $('#driver_fleet_usdot').val(),
                mainOffice: {
                    'address': $('#driver_fleet_address').val(),
                    'city': $('#driver_fleet_city').val(),
                    'state': $('#driver_fleet_state option:selected').text(),
                    'zip': $('#driver_fleet_zip').val()
                }
            };
            if (position == TYPE_DRIVER_ELD) {
                data['license_number'] = $('#act_license_number').val();
                data['license_state'] = $('#act_license_state').val();
            }
            c(data);
            $.ajax({
                url: MAIN_LINK + '/db/dashController/' + '?' + window.location.search.substring(1),
                method: "POST",
                contentType: "application/json",
                data: JSON.stringify({data: data}),
                success: function (data) {
                    var response = jQuery.parseJSON(data);
                    c(response);
                    if (response.code == '000') {
                        alertMessage($('#acc_fleet_result'), 'Saved', 3000);
                    } else {
                        alertError($('#acc_fleet_result'), response.message, 3000);
                    }
                }
            });
        }
    });
    $('body').on('click', '#leave_fleet_b1', function () {
        if (fleetC.checkDemoAccess()) {
            return false;
        }
        if (getCookie("role") === '1')
        {
            $('#leaveFleet .modal-body p').text('You are fleet administrator, are you sure you want to leave the fleet?');
        } else
        {
            $('#leaveFleet .modal-body p').text('Are you sure you want to leave the Fleet?');
        }
        $('#leave_fleet_warning').show();
    });
    $('body').on('click', '#leave_fleet_c', function () {
        $('#leave_fleet_warning').hide();
    });
    $('body').on('click', '#leave_fleet_b2', function () {
        $('#leaveFleet').removeClass('error').find('.error-handler').remove();
        data = {data: {action: 'leaveFleet'}};
        $.ajax({
            url: MAIN_LINK + '/db/dashController/' + '?' + window.location.search.substring(1),
            method: "POST",
            contentType: "application/json", // send as JSON
            data: JSON.stringify(data),
            success: function (data) {
                var response = jQuery.parseJSON(data);
                if (response.code == '000') {
                    window.location.href = window.location.href;
                } else if (response.code == '239') {
                    $('#leaveFleet').find('.modal-body').append('<span class="error-handler">\n\
                        You\'re the last administrator in the fleet, \n\
                        please contact support if you want fully close down the fleet or \n\
                        Upgrade other fleet member to administrator to be able to leave the fleet\n\
                    </span>');
                } else {
                    $('#leaveFleet').find('.modal-body').append('<span class="error-handler">' + response.message + '</span>');
                }
            }
        })
    });
    
    $('body').on('click', '#update_user', function (e) {
        e.preventDefault();
        eraseCookie("role");
        eraseCookie("last");
        eraseCookie("user");
        eraseCookie("PHPSESSID");
        name = $('#user_name').val();
        last = $('#user_last').val();
        phone = $('#user_phone').val();
        ext = $('#user_ext').val();
        data = {data: {action: 'updateUserInfo', name: name, last: last, phone: phone, ext: ext, last: last}};
        $.ajax({
            url: MAIN_LINK + '/db/dashController/' + '?' + window.location.search.substring(1),
            method: "POST",
            contentType: "application/json", // send as JSON
            data: JSON.stringify(data),
            success: function (data) {
                var response = jQuery.parseJSON(data);
                if (response.code == '000') {
                    
                }
            }
        })
    });
    
    $('body').on('click', '#date_right', function () {
        if ($(this).attr('data-page') != 'drivers' && $(this).attr('data-page') != 'trucks' && $(this).attr('data-page') != 'dvir')
        {
            var cur = $('#cur_day').text();
            var tot = $('#tot_days').text();
            cur--;
            if (cur < 1) {
                cur = 1;
                            $(this).addClass('waiting');
                            return;
            }
            date_str = $("#datepicker").val();
            $('#cur_date').text(date_str);
            $('#cur_day').text(cur);
        }
        if ($('#date_left').attr('data-page') == 'log')
        {
            $("#date_right").prop("disabled", true);
        }
        if ($(this).hasClass('waiting')) {
            return;
        }
        
        var date2 = $('#datepicker').datepicker('getDate', '-1d'); 
        date2.setDate(date2.getDate() + 1);
        $('#datepicker').datepicker('setDate', date2);
        if ($('#date_left').attr('data-page') == 'dvir') {
            getTruckReport(date2, $('#date_left').attr('data-truckId'), $('#date_left').attr('data-driverId'), dvirPageHandler);
            $('#date_left,#date_right').removeClass('waiting');
            return;
        }
        logbookSignatureCl.clearArea('draw-signature');
        $('.draw-signature-block').hide();
        logbook.changeLogbook();
    });
    $('body').on('click', '#date_left', function () {
        if ($(this).attr('data-page') != 'drivers' && $(this).attr('data-page') != 'trucks' && $(this).attr('data-page') != 'dvir')
        {
            var cur = $('#cur_day').text();
            var tot = $('#tot_days').text();
            cur++;
            if (cur > tot) {
                cur = tot;
                $(this).addClass('waiting');
                return;
            }
            date_str = $("#datepicker").val();
            $('#cur_date').text(date_str);
            $('#cur_day').text(cur);
        }
        if ($('#date_left').attr('data-page') == 'log')
        {
            $("#date_left").prop("disabled", true);
        }
        if ($(this).hasClass('waiting')) {
                return;
        }
        var date2 = $('#datepicker').datepicker('getDate', '+1d'); 
        date2.setDate(date2.getDate() - 1);
        $('#datepicker').datepicker('setDate', date2);
        if ($('#date_left').attr('data-page') == 'dvir') {
            getTruckReport(date2, $('#date_left').attr('data-truckid'), $('#date_left').attr('data-driverid'), dvirPageHandler);
            $('#date_left,#date_right').removeClass('waiting');
            return;
        }
        logbookSignatureCl.clearArea('draw-signature');
        $('.draw-signature-block').hide();
        logbook.changeLogbook();
    });
    $('body').on('click', '.hasDatepicker', function () {
        $(this).prop('readonly', true)
    })
    $('body').on('change', '#datepicker', function () {
        c('datepicker changed');
        //$(this).removeClass('error');
        var date2 = $('#datepicker').datepicker('getDate'); 
        if ($('#date_left').attr('data-page') == 'dvir') {
            getTruckReport(date2, $('#date_left').attr('data-truckId'), $('#date_left').attr('data-driverId'), dvirPageHandler);
            return;
        }
        logbookSignatureCl.clearArea('draw-signature');
        $('.draw-signature-block').hide();
        logbook.changeLogbook();
    });

    $('body').on('click', 'button.invite', function (e) {
        e.preventDefault();
        var name = $('#invite_name').val().trim();
        var last = $('#invite_last').val().trim();
        var email = $('#invite_email').val();
        var no_error = true;
        resetError();
        if (name == "") {
            no_error = setError($('#invite_name'), 'Please enter user Name.');
        } else if (!/^[A-Za-z-']+( [A-Za-z-']+)*$/.test(name)) {
            no_error = setError($('#invite_name'), 'Enter only Latin letters');
        }
        if (last == "") {
            no_error = setError($('#invite_last'), 'Please enter user Last Name.');
        } else if (!/^[A-Za-z-']+( [A-Za-z-']+)*$/.test(last)) {
            no_error = setError($('#invite_last'), 'Enter only Latin letters');
        }
        if (email == "") {
            no_error = setError($('#invite_email'), 'Please enter user Email.');
        } else if (!isValidEmailAddress(email)) {
            no_error = setError($('#invite_email'), 'Please enter valid Email.');
        }
        if (no_error == true) {
            var usdot = $('#usdot_number').text();
            var position = $('input[name=position]:checked').val();
            data = {
                data: {
                    action: 'inviteUser',
                    name: name,
                    last: last,
                    email: email,
                    usdot: usdot,
                    position: position
                }
            };
            $.ajax({
                url: MAIN_LINK + '/db/dashController/' + '?' + window.location.search.substring(1),
                method: "POST",
                contentType: "application/json", // send as JSON
                data: JSON.stringify(data),
                success: function (data) {
                    var response = jQuery.parseJSON(data);
                    if (response.code == '000') {
                        $('#add_user_box').find('.alert').remove();
                        alertMessage($('#add_user_box'), 'Invitation has been sent.', 3000);
                        $('#invite_name').val('');
                        $('#invite_last').val('');
                        $('#invite_email').val('');
                    } else {
                        alertError($('#add_user_box'), response.message, 5000);
                    }
                }
            });
        }
    });
    
    function isValidEmailAddress(emailAddress) {
        var pattern = /^[0-9a-z-\.\_]+\@[0-9a-z-]{1,}\.[a-z]{2,}$/i;
        return pattern.test(emailAddress);
    }
    ;
    

    $('body').on('click', '#join_comp', function (e) {
		e.preventDefault();
		var num = $('#chose_usdot').val();
		$('#chose_usdot').removeClass('inp_error');
		$('#chose_usdot').removeClass('confirm');
		$('.carr_search').removeClass('confirm');
		$('.carr_search').text('');
		$('#company_chosen').text('');
        if (num != '') {
            data = {data: {usdot: num, action: 'chose_usdot'}};
			$.ajax({
                url: MAIN_LINK + '/db/reg_search/' + '?' + window.location.search.substring(1),
                method: "POST",
				contentType: "application/json", // send as JSON
                data: JSON.stringify(data),
                success: function (data) {
					var response = jQuery.parseJSON(data);
                    if (response.code == '000') {
						$('#chose_usdot').addClass('confirm');
						$('.carr_search').addClass('confirm');
						$('.carr_search').text(response.data.name);
                    } else if (response.code == '206' || response.code == '208') {
						$('#chose_usdot').addClass('inp_error');
                        $('.carr_search').text(response.message);
					}
				}
			});
		}
	});
    $('body').on('click', '#search_company', function (e) {
        e.preventDefault();
        $('.modal *').removeClass('error').find('.error-handler').remove();
        var $usdot = $('#reg_usdot');

        $('#reg_usdot').removeClass('confirm');
        if ($usdot.val() == '') {
             return setError($usdot, 'Enter USDOT number');
        } else if ($usdot.val().length > 9) {
             return setError($usdot, 'USDOT length can\'t be more than 9 characters');
        }

        var data = {data: {usdot: $usdot.val(), action: 'reg_usdot'}};
        $.ajax({
            url: MAIN_LINK + '/db/reg_search/' + '?' + window.location.search.substring(1),
            method: "POST",
            contentType: "application/json", // send as JSON
            data: JSON.stringify(data),
            success: function (data) {
                var response = jQuery.parseJSON(data);
                if (response.code == '000') {
                    $('#reg_usdot').addClass('confirm');
                    $name = response.data.content.carrier.legalName;
                    $state = response.data.content.carrier.phyState;
                    $address = response.data.content.carrier.phyStreet;
                    $zip = response.data.content.carrier.phyZipcode;
                    $city = response.data.content.carrier.phyCity;
                    $state = response.data.content.carrier.phyState;
                    $('#reg_car_name').val($name);
                    $('#reg_office_addr').val($address);
                    $('#reg_zip').val($zip);
                    $('#reg_city').val($city);
                    $('#reg_state').val($state);
                } else if (response.code == '206' || response.code == '209' || response.code == '238') {
                    $('.modal *').removeClass('error').find('.error-handler').remove();
                    setError($('#reg_usdot'), response.message);
                }
            }
        });
    });

    $('body').on('keydown', '.modal input', function (e) {
        $(this).removeClass('error');
        $(this).parent().find('.error-handler').remove();
    });
    $('body').on('change', '.modal select', function (e) {
        $(this).removeClass('error');
        $(this).parent().find('.error-handler').remove();
    });
    $(document).on('hidden.bs.modal', function () {
        // $.each($('form'), function (c,$form) {
        //     $form.reset();
        // });
        $('.modal *').removeClass('error').find('.error-handler').remove();
        $('.modal *').removeClass('confirm').find('.confirm-handler').remove();
    });

    $(document).on('keyup blur', '#reg_usdot', function () {
        if ($("#reg_usdot").val().length == '') {
            $('#register_box_fl .log_error.usdot_reg').text('Please enter value');
            $("#reg_usdot").addClass('inp_error');
        } else if ($("#reg_usdot").val().length > 9) {
            $('#register_box_fl .log_error.usdot_reg').text('USDOT length can\'t be more than 9 characters');
            $("#reg_usdot").addClass('inp_error');
        } else {
            $('#register_box_fl .log_error.usdot_reg').empty();
            $("#reg_usdot").removeClass('inp_error');
        }
    });

    $(document).on('keyup blur', '#reg_zip', function () {
        var zip = $("#reg_zip").val();
        if (!validate.zip(zip)) {
            $('#register_box_fl .log_error.zip_reg').text('Enter correct zip');
            $("#reg_zip").addClass('inp_error');
        } else {
            $('#register_box_fl .log_error.zip_reg').empty();
            $("#reg_zip").removeClass('inp_error');
        }
    });

    

    function setError($obj, message) {
        $obj.addClass('error').after('<span class="error-handler">' + message + '</span>');
        return false;
    }
    function setMessage($obj, message) {
        $obj.addClass('confirm').after('<span class="confirm-handler text-success">' + message + '</span>');
        return true;
    }

    $('body').on('click', '#acc_cancel_fleet', function () {
		AjaxController('cancelFleetregistration', {}, dashUrl, 'cancelFleetregistrationHandler', errorBasicHandler, true);
	})
	var bounds = new google.maps.LatLngBounds();
    $('body').on('click', '#showAll', function () {
        logbook.deleteMarkers();
		directionsDisplay.setMap(null);
		var count = 0;
        $('.last_pos').each(function () {
            point = {};
			point.lt = $(this).attr('data-lt');
			point.lng = $(this).attr('data-lng');
            if (point.lt != '' && point.lng != '') {
			count++;
			var marker = new google.maps.Marker({
				map: map,
                    label: count.toString(),
                    position: new google.maps.LatLng(point.lt, point.lng)
			});
			bounds.extend(marker.position);
			markers.push(marker);   
		}
		map.fitBounds(bounds);
		});

	});
    $('body').on('click', '.check_row', function () {
        if ($(this).parents('#manage_dispatch').length > 0) {
            return false;
        }
        if (!fillParams($(this).parent())) {
                return;
            }
            $('.box_header').text('Document Info');
            $('.save_edit').hide();
            $('#one_doc_box').show();
        });
    $('body').on('click', '.edit_row', function () {
        if ($(this).parents('#manage_dispatch').length > 0) {
            return false;
        }
            $('#one_doc_box .box_header').text('Edit Document');
			emptyParams();
            $('.save_edit').addClass('editing').show();
            $('#one_doc_box').show();
        });
    $('body').on('click', '.pdf_doc', function () {
        $('.action_td a').each(function () {
            $(this).attr('href', this.href);
			});
			var params = {};
			params.name = "image";
			params.url = $(this).parent().find('a').first().attr('href');
			pdfGen.generateAndSendForm(params);

			pdfClick = true;
		});
    $('body').on('click', '#manage_dispatch .edit_row', function () {
        emptyParams();
        editRow(this);
    });
    $('body').on('click', '#manage_dispatch .open_row', function () {
        emptyParams();
        openRow(this);
    });
    $('body').on('click', '.dateFromButton, .dateTillButton', function ()
        {
            $(this).parent().find('.datepicker').datepicker("show");
        });
        $('.driver_name').click(function () {
            $("#form").attr('action', '../drivers/');
            $("#hd_driverId").val($(this).parent().attr('data-id'));
            $("#hd_date").val($(this).parent().find('.date').text());
            dc.getUrlContent('/dash/drivers/', {
                driverId: $(this).parent().attr('data-id'),
                date: $(this).parent().find('.date').text()
            });							
        });

	$("body").on({
        mouseenter: function () {
            if ($(this).text() != '' && !$('.copyIcon').length) {
				$(this).append('<span class="copyIcon" onclick="copyTdToClipboard(event)"><i class="fa fa-copy" aria-hidden="true"></i></span>');
			}
        },
        mouseleave: function () {
           $('.copyIcon').remove();
    }}, 'td.copyTooltip'); 
    if (getCookie('compos') == 11 || getCookie('compos') == 1) {
        newEventsC.checkNewClientTickets();
        newEventsC.checkNewELDEvents();
    }
	
	//save custom select settings to localStorage
    $('body').on('change', '.saveCustom', function () {
		var fieldStoreId = $(this).attr('data-save'),
			fieldStoreValue = $(this).val();
        c('fieldStoreId=' + fieldStoreId + ', fieldStoreValue=' + fieldStoreValue);
		userLocalStorage.setOption(fieldStoreId, fieldStoreValue);
	});
});
function copyTdToClipboard(event) {
  var $temp = $('<input aria-hidden="true">');
  $("body").append($temp);
  var copyText = $('.copyIcon').parent('td').text();
    if ($('.copyIcon').parent('td').hasClass('fleetName')) {
        copyText = copyText.replace(/\((.*)\)/gi, '');
  }
  $temp.val(copyText).select(); 
  document.execCommand("copy");
  $temp.remove();
  $('.copyIcon').html('Copied!');
  event.stopPropagation();
}
function emptyErrors() {
    $('.log_form input').removeClass('inp_error');
    $('.log_form select').removeClass('inp_error');
    $('.log_error').text('');
}
function checkStates() {
    if ($('#reg_state option').length < 2) {
        $.ajax({
            url: MAIN_LINK + '/db/getStates/' + '?' + window.location.search.substring(1),
            method: "POST",
            data: JSON.stringify(),
            success: function (data) {
                var response = jQuery.parseJSON(data);
                if (response.code == '000') {
                    for (var x = 0; x < response.data.length; x++) {
                        $('#reg_state').append('<option value="' + response.data[x].id + '" data-short="' + response.data[x].short + '">' + response.data[x].name + '</option>');
                    }
                }
            }
        });
    }
}
function getDurationFromSec(time, simpleway, withSec = false) {
    if (time < 0) {
            return '00:00';
        }
        var hours = Math.floor(time / 3600);
        time = time - hours * 3600;
        var minutes = Math.floor(time / 60);
        var seconds = Math.floor(time % 60);
        var pad = "00";
        if (hours > 99) {
            var hours = '99';
        } else {
            var hours = (pad + hours).slice(-pad.length);
        }
    var minutes = (pad + minutes).slice(-pad.length);
    var seconds = (pad + seconds).slice(-pad.length);
    if (simpleway) {
			
        return hours + ':' + minutes;
        }
    if (withSec) {
        return hours + 'h ' + minutes + 'm ' + seconds + 's';
			}
    return hours + 'h ' + minutes + 'm';
    }
function getStatusFromId(st) {
        var strt = 'on';
    if (st == 0) {
            strt = 'on';
    } else if (st == 1) {
           strt = 'dr';
    } else if (st == 2) {
            strt = 'sb';
    } else if (st == 3) {
            strt = 'off';
        }
        return strt;
    }
function getTruckReport(date, truckId, driverId, handler, dvirId = null) {
    var maxDate = $("#datepicker").datepicker("option", "maxDate");
        
    if (maxDate != null) {
            var diff = daydiff(new Date(date), new Date(maxDate));
        
        if (diff < 1) {
                date = maxDate;
            }
        }
        
       
    if ($('#date_left').attr('data-type') == 'driver') {
        data = {data: {action: 'apiGetDVIRs', truckId: truckId, date: date, driverId: driverId, type: true}};
            var notFleet = 12;
    } else {
        if (moment(date).diff(moment().startOf('day')) == 0) {
				$('#date_right').prop('disabled', true);
			} else {
				$('#date_right').prop('disabled', false);
			}
        data = {data: {action: 'apiGetDVIRs', truckId: truckId, date: date, driverId: driverId}};
            var notFleet = false;
        }
        $.ajax({
        url: MAIN_LINK + '/db/dashController/' + '?' + window.location.search.substring(1),
        method: "POST",
            contentType: "application/json", // send as JSON
        data: JSON.stringify(data),
        success: function (data) {
                var response = jQuery.parseJSON(data);
            if (response.code == '000') {
                if (handler)
                    handler(response);
                document.cookie = 'dvirPageInfo=' + JSON.stringify({driverId: driverId, date: date, truckId: truckId, notFleet: notFleet, dvirId: dvirId}) + ';path=/';
                }

            }
        });
    }
function driversPageHandler(response) {
        var data = response.data;
        dvirs = [];
        equipment = response.equipment;
        carName = response.carName;
        usdot = response.usdot;
        var truck = $('#drivers_sec tr.active .col_tr').html();
    if (data.length > 0) {
            $('.drivers_log_pdf').prop('disabled', false);
    } else {
            $('.drivers_log_pdf').prop('disabled', true);
        }
    for (var x = 0; x < data.length; x++) {
            var dvir = data[x];
            dvir.truckName = truck;
            dvirs.push(dvir);
            var defects = '';
            var defs = JSON.parse(dvir.defects);
        for (var y = 0; y < defs.length; y++) {
            if (defects == '') {
                    defects = defs[y].name;
            } else {
                defects += ', ' + defs[y].name;
                }
            }
        if (defects == '') {
                defects == 'Has no defects';
            }
        $('#log_list table tbody').empty().append('<tr data-c="' + x + '" class="dvir_one" data-truckid="' + dvir.truck + '" data-id="' + dvir.userId + '">\n\
            <td>' + $('#datepicker').val() + ' ' + dvir.time + '</td>\n\
            <td>' + truck + '</td>\n\
            <td>' + dvir.name + '</td>\n\
            <td>' + defects + '</td>\n\
            </tr>')
        }
    if (data.length == 0) {
            $('#log_list table tbody').empty().append('<tr class="">\n\
            <td colspan="4">No DVIR for this truck</td>\n\
            </tr>')
        }
        var box = $('#truck_report');
    }
function setMessagesRows(date) {
        d = new Date(date);
        
    $('.one_box').each(function () {
            $(this).find('.one_message').text('');
            $(this).find('.one_time').text(d.yyyymmdd());
        });
    data = {data: {action: 'getUserMessages', date: date}};
        $.ajax({
        url: MAIN_LINK + '/db/dashController/' + '?' + window.location.search.substring(1),
        method: "POST",
            contentType: "application/json", // send as JSON
        data: JSON.stringify(data),
        success: function (data) {
                var response = jQuery.parseJSON(data);
            if (response.code == '000') {
                for (x = 0; x < response.data.length; x++) {
                        var message = response.data[x];
                        var dateTime = message.dateTime;
                        var fromId = message.fromId;
                        var message = message.message;
                        var toid = message.toid;
                        var set = false;
                    $('.one_box').each(function () {
                        if ($(this).attr('data-id') == fromId) {
                                
                                $(this).find('.one_time').text(dateTime);
                                $(this).find('.one_message').text(message);
                                set = true;
                            }
                        });
                    }
                }
            }
        })
    }
function readFleetMessage(fromId)
{
    var data = {
        action: 'readFleetMessage',
            data: {
                fromId: fromId
            }
    };
    send(data);
}
function addMessageOnScreen(message, userName, drName, driverId) {
	var from = message.fromId;
	var to = message.toId;
    var time = toTime(message.dateTime / 1000);
	
	var name = userName;
	var addClass = '';
    if (from == driverId) {
		name = drName;
        addClass = "to";
	}
	
	var messageText = message.message;
    $('#chat_msgs').prepend('<div class="chat_one_msg ' + addClass + '" data-time = "' + message.dateTime + '">\n\
		<div class="msg_box">\n\
			<div class="chat_time">' + convertOnlyTimeFromSqlToUsa(time, true) + '</div>\n\
			<span class="chat_msg">' + emojione.unicodeToImage(emojione.escapeHTML(messageText)) + '</span>\n\
		</div>\n\
	</div>');
}
function getMoreFleetMessages(driverId, dateTime)
{       
        anchor = $('.chat_one_msg ').first().attr('data-time');
	var data = {
        action: 'getMoreFleetMessages',
		data: {
			userId: driverId,
                        dateTime: dateTime
		}
	};
        gettingMore = true;
	send(data);
}
function fillMessagePage() {
    c('fillMessagePage');
    var messages = [],
    time = '',
    countNotReadFleetMessages = 0,
	countAllNotReadMessage = 0,
    hasNotReadFleetMessages = '';
    gettingMore = true;

    if (dcc.inFleet === 1 && dcc.allReadyLogin === 1) {
        clearInterval(fillMessagePageInterval);
        $.each(dcc.fleetMessagesDrivers, function (key, driver) {
            c(driver);
            messages = driver.messages;
                        
            if (driver.notReadFleetMessages > 0) {
                hasNotReadFleetMessages = 'hasNotReadFleetMessages';
                countNotReadFleetMessages = '<div class = "countNotReadFleetMessagesChatBox">' + driver.notReadFleetMessages + '</div>';
                countAllNotReadMessage += driver.notReadFleetMessages;
            } else {
                hasNotReadFleetMessages = '';
                countNotReadFleetMessages = '<div class = "countNotReadFleetMessagesChatBox"></div>';
            }

            if (messages.length > 0) {
                time = timeFromSecToUSAString(messages[0].dateTime / 1000, true);
            } else {
                time = 'no messages';
            }
            $('#messages_box').find('[data-id="' + driver.id + '"]').remove();
            $('#messages_box').append('<div class="one_box ' + hasNotReadFleetMessages + ' fl" data-id="' + driver.id + '" data-name="' + driver.name + ' ' + driver.last + '" >\
                <div class = "fleetMessagesNameBox">\
                    <div class="one_name">' + driver.name + ' ' + driver.last + '</div>\
                    ' + countNotReadFleetMessages + '\
                </div>\
                <div class="one_time">' + time + '</div>\
                <div class="one_doc">View documents</div>\
                        </div>');
            });
		$('.messages_number.msg').text(countAllNotReadMessage);
        orderFleetChats();
        $('#chat_box, .right_sec.messages_page').show();
        readMessageDriverId != '' ? $('#messages_box .one_box[data-id="' + readMessageDriverId + '"]').click() : $('#messages_box .one_box:first').click();
        $('#gifBox').fadeOut(500);
    }
}
function fillDashMessagePage(driverId, driverName)
{
    $('.dashboardChat #chat_msgs').empty();
    if (driverId in dcc.fleetMessagesDrivers)
    {
        var msgs = dcc.fleetMessagesDrivers[driverId].messages,
            userName = getCookie("user");

        $.each(msgs, function (key, message) {
            addMessageOnScreen(message, userName, driverName, driverId);
        });
        $("#chat_msgs").scrollTop($("#chat_msgs")[0].scrollHeight);
        if ($("#chat_msgs").scrollTop() == 0 && !$(this).hasClass('loaded'))
        {
            getMoreFleetMessages(driverId, $('#chat_msgs .chat_one_msg:first').attr('data-time'));
        }
        if (dcc.fleetMessagesDrivers[driverId].notReadFleetMessages > 0)
        {
            readFleetMessage(driverId);
        }
    }
}
function orderFleetChats() {
    c('orderChats');
    var sortable = [];
    $.each(dcc.fleetMessagesDrivers, function (key, chat)
    {
        if (chat.messages.length > 0)
        {
            var lastMessage = chat.messages[0].dateTime;
            sortable.push([key, lastMessage]);
        } else
        {
            sortable.push([key, 0]);
        }
    });
    sortable.sort(
            function (a, b) {
            return a[1] - b[1]
        }
    )
    $.each(sortable, function (key, chatAr)
    {
        var chatId = chatAr[0];
        var chat = $('#messages_box .one_box[data-id="' + chatId + '"]').detach();
        $('#messages_box').prepend(chat);
    });
}
function cancelFleetregistrationHandler() {
	window.location.href = window.location.href;
}
function getActiveNavTab() {
    $('.nav_dis').children("li").each(function () {
        var childLinkAdress = this.firstChild.getAttribute('href');
        if (window.location.pathname.toString() == childLinkAdress) {
            if (this.getAttribute('class') != "active_tab") {
                this.setAttribute("class", "active_tab");
            }
        }
    })
}
function generateDashPopup(head, content, width = '350px', height = 'auto', clsrem = 1, cls = '', style = '') {
    $('body').append(`<div class="one_part_box buy_now_box ${cls}" style="display:block;">
	<div class="fader ${clsrem == 1 ? 'close_edit remove' : ''}" style="position: absolute;bottom: 0;left: 0;right: 0;top: 0;z-index: 1;width: 100%;height: 100%;"></div>
        <div class="popup_box_panel" style="width: ${width}; height: ${height}; ${style}">
            <h2 class="box_header">${head}</h2>
            ${clsrem == 1 ? '<button class="close_edit remove">X</button>' : ''}
            <div class="content">${content}</div>
        </div>
    </div>`);
}
/*Global methods*/
function getUserPositionByKey(key)
{
    var userPosition = '';
    
    switch (parseInt(key))
    {
        case 0:
            userPosition = 'Basic';
            break;
        case 1:
            userPosition = 'Superadmin';
            break;
        case 2:
            userPosition = 'Employee';
            break;
        case 3:
            userPosition = 'Driver';
            break;
        case 4:
            userPosition = 'Dispatcher';
            break;
        case 5:
            userPosition = 'Safety';
            break;
        case 6:
            userPosition = 'Shipper';
            break;
        case 7:
            userPosition = 'Driver ELD';
            break;
        case 9:
            userPosition = 'Not registererd';
            break;
        case 10:
            userPosition = 'Frontend superadmin';
            break;
        case 11:
            userPosition = COMPANY_NAME + ' manager';
            break;
        case 12:
            userPosition = COMPANY_NAME + ' superviser';
            break;
        case 15:
            userPosition = 'Driver AOBRD';
            break;
    }
    return userPosition;
}
function getScannerStatusFromStatusId(statusId, params) {
    var statusName = '';
    switch (statusId) {
        case 0 :
            statusName = 'Ordered, not paid';
            break;
        case 1 :
            statusName = 'Ordered paid';
            break;
        case 2 :
            statusName = 'Ready to be sent';
            break;
        case 3 :
            statusName = 'Sent by mail';
            break;
        case 4 :
            statusName = 'Active';
            break;
        case 5 :
            statusName = 'Deactivated';
            break;
        case 8 :
            statusName = 'Deactivated by not being paid';
            break;
        case 9 :
            statusName = 'Canceled before Activation';
            break;
        case 10 :
            statusName = 'Restoring';
            break;
        case 11 :
            statusName = getReturnTextStatus(params);
            break;
        case 12 :
            statusName = 'Disconnected';
            break;
        case 999 :
            statusName = 'Terminated';
            break;
        case 101 :
            statusName = 'Changed to ELD/AOBRD';
            break;
        case 102 :
            statusName = 'Monthly due charged';
            break;
        case 103 :
            statusName = 'Transferred to another Fleet';
            break;
        case 104 :
            statusName = 'Device Mac Cleared ' + getEldHistoryMac(params);
            break;
        case 105 :
            statusName = 'New Device Mac ' + getEldHistoryMac(params);
            break;
        case 106 :
            statusName = 'Returned';
            break;
        case 107 :
            statusName = 'Device Version Update, v' + getEldHistoryVersion(params);
            break;
        case 108 :
            statusName = 'Device Tariff Changed';
            break;
             case 109 :
            statusName = 'Switch to Ez-smart';
            break;
    }
    return statusName;
}
var statusReturn = {
    0: 'New',
    1: 'Approved for Sending',
    2: 'Rejected',
    3: 'Sending',
    4: 'Delivery Confirm',
    5: 'New',
    6: 'Replace device binded, closed'
};
function getEldHistoryVersion(params) {
    var version = '';
    if (typeof params !== 'undefined' && params !== null && typeof params.eldHistory !== 'undefined' && params.eldHistory !== null) {
        var eldHistory = JSON.parse(params.eldHistory);
        version = typeof eldHistory.version !== 'undefined' && eldHistory.version !== null ? eldHistory.version : '';
    }
    return version;
}
function getEldHistoryMac(params) {
    var mac = '';
    if (typeof params !== 'undefined' && params !== null && typeof params.eldHistory !== 'undefined' && params.eldHistory !== null) {
        var eldHistory = JSON.parse(params.eldHistory);
        mac = typeof eldHistory.mac !== 'undefined' && eldHistory.mac !== null ? eldHistory.mac : '';
    }
    return mac;
}
function getReturnTextStatus(params) {
    var statusName = 'Returns';
    if (typeof params !== 'undefined' && params !== null) {
        var statusReturnText = '';
        if (typeof params.returnStatus !== 'undefined' && typeof statusReturn[params.returnStatus] !== 'undefined') {
            statusReturnText = ' (' + statusReturn[params.returnStatus] + ')';
        }
        var returnReason = '';
        if (typeof params.returnReason !== 'undefined' && params.returnReason !== null) {
            returnReason = params.returnReason == 0 || params.returnReason == 3 ? 'Cancellation' : 'Replacement';
        }
        statusName += ' ' + returnReason + statusReturnText;
    }
    return statusName;
}
function payForClient() {
	var data = {
        action: 'paySim',
        amount: $('#manager_payment_box_amount').val(),
        name: $('#manager_payment_box_name').val(),
        last: $('#manager_payment_box_last').val(),
        userId: $('#manager_payment_box_user').attr('data-id'),
        invoiceNumber: parseInt(new Date().getTime() / 1000),
        description: 'Manager Pay Invoice'
    };
    if (typeof data.userId === 'undefined')
        return false;
    $.ajax({
        url: MAIN_LINK + '/db/adminController/' + '?' + window.location.search.substring(1),
        method: "POST",
        contentType: "application/json", // send as JSON
        data: JSON.stringify({data: data}),
        success: function (data) {
            var response = jQuery.parseJSON(data);
            if (response.code == '000') {
                var data = response.data;
				$('#payment_form').remove();
				$('body').append(`<form method="post" action="${data.PG_URL}" id="payment_form">
					<input type="hidden" name="UMaddcustomer" value="no">
					<input type="hidden" name="UMschedule" value="monthly">
					<input type="hidden" name="UMbillamount" value="0">
					<input type="hidden" name="UMnumleft" value="0">
					
					<input value="" type="hidden" name="UMkey" /> 
					<input value="" type="hidden" name="UMcommand" /> 
					<input value="" type="hidden" name="UMhash" /> 
					<input value="" type="hidden" name="UMamount" />
					<input value="" type="hidden" name="UMname" /> 
					<input value="" type="hidden" name="x_company" /> 
					<input value="" type="hidden" name="UMdescription" /> 
					<input value="" type="hidden" name="UMinvoice" />  
					<input value="" type="hidden" name="UMcustid" /> 
					<input value="" type="hidden" name="UMcustom1" /> 
					<input value="PAYMENT_FORM" type="hidden" name="x_show_form" /> 
				</form>`)
                $('#payment_form input[name="UMstart"]').remove();
                $('#payment_form input[name="UMaddcustomer"]').val('no');
                $('#payment_form input[name="UMnumleft"]').val(0);

                $('#payment_form input[name="UMkey"]').val(data.UMkey);
                $('#payment_form input[name="UMcommand"]').val(data.UMcommand);
                $('#payment_form input[name="UMhash"]').val(data.UMhash);

                $('#payment_form input[name="x_login"]').val(data.loginID);
                $('#payment_form input[name="UMamount"]').val(data.amount);
                $('#payment_form input[name="UMname"]').val(data.name + ' ' + data.lastName);
                $('#payment_form input[name="x_last_name"]').val(data.lastName);
                $('#payment_form input[name="x_company"]').val(data.carrierName);
                $('#payment_form input[name="UMdescription"]').val(data.description);
                $('#payment_form input[name="UMinvoice"]').val(data.invoice);
                $('#payment_form input[name="x_fp_sequence"]').val(data.sequence);
                $('#payment_form input[name="x_fp_timestamp"]').val(data.timeStamp);
                $('#payment_form input[name="x_fp_hash"]').val(data.fingerprint);
                $('#payment_form input[name="UMcustid"]').val(data.userId);
                $('#payment_form input[name="UMcustom1"]').val(data.userId);
                $('#payment_form').submit();
				
            }
        }
    })
}
function getBalanceColorFromDue(due) {
    var color = due > 0 ? 'red' : 'green';
    return color;
}
function downloadInvoice(el) {
	var inv = $(el).attr('data-id');
	var carrierId = $('#carrierUsersButtonsBox').attr('data-carrierid') != undefined ? $('#carrierUsersButtonsBox').attr('data-carrierid') : 0
	
	var params = {};
	params.name = "invoice";
	params.cr = carrierId;
	params.invoice = inv;
    pdfGen.generateAndSendForm(params, {'action': 'invoice'});
}
    
function getEldCablesHandler(response) {
		cables = response.data;
	}

function updateFleetData() {
    if (fleetC.checkDemoAccess()) {
        return false;
    }
		$('#update_result').text('');
		$("#fleet_zip").removeClass('inp_error');

		var usdot = $('#fleet_usdot').val();
		var name = $('#fleet_name').val();
		var address = $('#fleet_street').val();
		var state = $('#fleet_state option:selected').text();
		var city = $('#fleet_city').val();
		var zip = $('#fleet_zip').val();
		var size = $('#fleet_size').val();
		var cycle = $('#fleet_cycle').val();
		var tz = $('#fleet_tz').val();
		var aobrdMPH = $('#aobrdMPH').val();
		var ein = $('#fleet_ein').val();
		var agricultureDeliveries = $('#agricultureDeliveries').find('button.active').attr('data-val');
    if (!/^[1-9]\d?-\d{7}$/.test(ein)) {
            setError($('#fleet_ein'), 'Enter valid EIN. Example: "55-5555555", "1-2345678"');
			return false;
		}
    if (!/^[A-Za-z0-9-\s\#']+( [A-Za-z0-9-\s\#']+)*$/.test(name)) {
            setError($('#fleet_name'), 'Only Latin letters and Numbers are allowed');
			return false;
    } else if (name.length > 130) {
			setError($('#fleet_name'), 'Max allowed 130 characters');
			return false;
    } else if (name.length < 4) {
            setError($('#fleet_name'), 'Min allowed 4 characters');
            return false;
        }
    if (!/^[A-Za-z-']+( [A-Za-z-']+)*$/.test(city)) {
            setError($('#fleet_city'), 'Enter only Latin letters');
			return false;
		}
    if (usdot == '') {
        setError($('#fleet_usdot'), 'USDOT can not be empty');
			return false;
    } else if (usdot.length > 9) {
        setError($('#fleet_usdot'), 'Usdot length must be less than 9 characters');
			return false;
		}
    if (zip && !validate.zip(zip))
		{
			$("#fleet_zip").addClass('inp_error');
			return;
		}

    var data = {data: {
			action: 'updateFleetData',
			usdot: usdot,
            name: name,
            cycle: cycle,
            tz: tz,
            aobrdMPH: aobrdMPH,
            ein: ein,
			agricultureDeliveries: agricultureDeliveries,
            mainOffice: {
                address: address,
                city: city,
                state: state,
                zip: zip,
                size: size}
			}
		};
    $('#updateFleetDataButton').prop('disabled', true)
		$.ajax({
        url: MAIN_LINK + '/db/dashController/' + '?' + window.location.search.substring(1),
        method: "POST",
			contentType: "application/json", // send as JSON
        data: JSON.stringify(data),
        success: function (data) {
				var response = jQuery.parseJSON(data);
            if (response.code == '000') {
					resetError();
					alertMessage($('#update_result'), 'Saved', 3000);
					$('li.nav_agriculture').remove();
                if (agricultureDeliveries == 1) {
						$('li.nav_ezchat').after('<li class="nav_icon nav_agriculture" data-tabname = "ezchat"><a href="/dash/agriculture/" class="dash_url_button"><span class="menu-icon"></span><span class="menu-text">Agriculture</span></a></li>');
					} 
            } else {
					alertError($('#update_result'), response.message, 3000);
				}
            $('#updateFleetDataButton').prop('disabled', false)
			}
		})
	}
function validadeRegistrationFl() {
        var no_error = true;
        $('.modal *').removeClass('error').find('.error-handler').remove();

        var $usdot = $('#reg_usdot'),
            $state = $('#reg_state'),
            $city = $('#reg_city'),
            $car_name = $('#reg_car_name'),
            $addr = $('#reg_office_addr'),
            $zip = $('#reg_zip'),
            $size = $('#reg_size'),
            $ein = $('#reg_ein');

        if ($car_name.val() == '') {
            no_error = setError($car_name, 'Enter carrier name');
        } else if (!/^[A-Za-z0-9-\s\#']+( [A-Za-z0-9-\s\#']+)*$/.test($car_name.val())) {
            no_error = setError($car_name, 'Only Latin letters and Numbers are allowed');
        } else if ($car_name.val().length > 130) {
            no_error = setError($car_name, 'Max allowed 130 characters');
        }
        if ($ein.val() == '') {
            no_error = setError($ein, 'Enter EIN');
    } else if (!/^[1-9]\d?-\d{7}$/.test($ein.val())) {
			no_error = setError($ein, 'Enter valid EIN. Example: "55-5555555", "1-2345678"');
		}
        if ($addr.val() == '') {
            no_error = setError($addr, 'Enter office address');
    } else if (!/^[A-Za-z0-9-']+( [A-Za-z0-9-']+)*$/.test($addr.val())) {
            no_error = setError($addr, 'Enter only Latin letters');
    } else if ($addr.val().length > 130) {
            no_error = setError($addr, 'Max allowed 130 characters');
        }

        if ($usdot.val() == '') {
            no_error = setError($usdot, 'Enter USDOT number');
    } else if ($usdot.val().length > 9) {
            no_error = setError($usdot, 'USDOT length can\'t be more than 9 characters');
        }

        if ($state.val() == 0) {
            no_error = setError($state, 'Chose state/province');
        }
        if ($zip.val() && !validate.zip($zip.val())) {
            no_error = setError($zip, 'Enter correct ZIP');
        }

        if ($city.val() == '') {
            no_error = setError($city, 'Enter City');
    } else if (!/^[A-Za-z-']+( [A-Za-z-']+)*$/.test($city.val())) {
            no_error = setError($city, 'Enter only Latin letters');
    } else if ($city.val().length > 60) {
            no_error = setError($city, 'Max allowed 60 characters');
        }

        if (isNaN(parseInt($size.val())) || !isFinite($size.val()) || $size.val() == '0') {
            no_error = setError($size, 'Enter Fleet size');
        }

        return no_error;
    }
function registerFLeet(asSecondSafety = false) {
        $('.modal *').removeClass('error').find('.error-handler').remove();
		var fields = {};
    if (validadeRegistrationFl()) {
            fields.usdot = $('#reg_usdot').val();
            fields.state = $('#reg_state').val();
            fields.city = $('#reg_city').val();
        fields.timeZone = $('#reg_timeZone').val();
            fields.zip = $('#reg_zip').val();
            fields.fleet = $('#reg_size').val();
            fields.car_name = $('#reg_car_name').val();
            fields.office_addr = $('#reg_office_addr').val();
            fields.test = 'test';
			fields.ein = $('#reg_ein').val();
        data = {data: {action: 'registerFleet', fields: fields}};
			data.data.asSecondSafety = asSecondSafety;
            $.ajax({
                url: MAIN_LINK + '/db/dashController/' + '?' + window.location.search.substring(1),
                method: "POST",
                data: JSON.stringify(data),
                success: function (data) {
                    var response = jQuery.parseJSON(data);
                    if (response.code == '000') {
                        window.location.href = '/dash/settings/fleet_settings/';
                    } else if (response.code == '119') {
                        setError($('#reg_usdot'), response.message);
                    } else if (response.code == '124') {
                        setError($('#reg_car_name'), response.message);
                    } else if (response.code == '120') {
                        setError($('#reg_office_addr'), response.message);
                    } else if (response.code == '123') {
                        setError($('#reg_zip'), response.message);
                    } else if (response.code == '121') {
                        setError($('#reg_city'), response.message);
                    } else if (response.code == '209') {
                        setError($('#reg_usdot'), response.message);
                    } else {
                    $('#formCreateFleet2').append('<span class="error-handler response-message">' + response.message + '</span>');
                    }
                }
            });
        }
	}
function deactivateDeviceHandler(response) {
    if (response.data == true) {
        $('.activeCarriersTableTab').click()
        $('.activeTableTab').click()
    }
    $('#deactivateDeviceModal .close').click();
}
function activateDeviceHandler(response, ev) {
    if (response.data == true) {
        $('.activeCarriersTableTab').click()
        $('.activeTableTab').click()
    }
}
function deactivateDeviceErrorHandler(response) {
    alertError($('#deactivateDeviceModal .modal-body'), response.message, 3000);
}
function deactivateDeviceConfirm(deviceId, ev, el) {
    ev.stopPropagation();
    var days = parseInt($('#deactivateDays').val()) || 0;
    if (days < 45) {
        alertError($('#deactivateDeviceModal .modal-body'), 'Minimum 45 days', 3000);
        return 1;
    }
    $(el).prop('disabled', true);
    AjaxController('deactivateDevice', {deviceId: deviceId, deactivateDays: $('#deactivateDays').val()}, adminUrl, 'deactivateDeviceHandler', deactivateDeviceErrorHandler, true);
}
function deactivateDevice(deviceId, ev, el) {
    var content = `<form id="returnEldForm" class="form-horizontal">
            <div class="form-group">
                <label class="col-sm-12">Days Amount, minimum 45 days:</label>
                <div class="col-sm-3">
                    <input name="deactivateDays" value="45" class="form-control" type="text" id="deactivateDays" />
                </div>
            </div>
        </form>`;

    showModal('Deactivate Device Id ' + deviceId, content, 'deactivateDeviceModal', '', {footerButtons: `<button class="btn btn-primary" onclick="deactivateDeviceConfirm(${deviceId}, event, this)">Confirm</button>`});
    $('#deactivateDays').mask('000');
}
function activateDevice(deviceId, ev, el) {
	ev.stopPropagation();
	$(el).prop('disabled', true);
    AjaxController('activateDevice', {deviceId: deviceId}, adminUrl, 'activateDeviceHandler', errorBasicHandler, true);
}
/*Test work with Node.js*/
function getUsersOnlineStatus() {
    var data = {
        action: 'getUsersOnlineStatus',
        data: {
            users: globalUsersOnline
        }
    };
    send(data);
}
function viewUsersOnOff() {
    for (var user in globalUsersOnline) {
        var userEl = $('.user-onoff[data-id="' + user + '"]');
        if (userEl.length > 0) {
            if (globalUsersOnline[user].online == 1) {
                userEl.addClass('u-online');
            } else {
                userEl.removeClass('u-online');
            }
        }
    }
}
function viewOneUserOnOff(userId, online) {
    if (globalUsersOnline.hasOwnProperty(userId)) {
        var userEl = $('.user-onoff[data-id="' + userId + '"]');
        if (userEl.length > 0) {
            if (online == 1) {
                userEl.addClass('u-online');
            } else {
                userEl.removeClass('u-online');
            }
        }
    } else {
        globalUsersOnline[userId] = {};
        globalUsersOnline[userId].userId = userId;
        globalUsersOnline[userId].online = online;
    }
}
function checkUserOnOff(userId) {
    if (globalUsersOnline.hasOwnProperty(userId)) {
        return globalUsersOnline[userId].online;
    }
    return 0;
}
function createProfilePopupButton(userId, name,SmartSafety=0) {
    var userThumb = fleetC.getUserThumbById(userId);
    var userType = fleetC.getUserTypeLetterById(userId);
    var userTypeName = fleetC.getUserTypeNameById(userId);
    var nameDisp = typeof name != 'undefined' && name != null && (name.length > 19) ? name.substr(0, 19) + '&hellip;' : name;
    var smartSafetyIcon = SmartSafety==1?'ezicon-Smart-Safety':'';
    //userThumb = userThumb ? /*EZCHAT_LINK +*/ userThumb : "/social/assets/img/thumb_blank.png";
    return `<span class="user_pupop_icon" onclick="showProfilePopup(${userId}, this, event)">
        <button class="fa fa-lg fa-fw profile_icon user-onoff 
            ${checkUserOnOff(userId) ? 'u-online' : ''}" 
            data-id="${userId}" >
            <img src="${userThumb}" />
            <span class="profile_status" title="${userTypeName}">${userType}</span>
        </button>
        <span title="${name}" class="clickable_item">${nameDisp}</span>
          <span class="menu-icon ${smartSafetyIcon}"></span>
    </span>`;
}
function showProfilePopup(userId, el, e) {
    e.stopPropagation();
	fleetC.setSessionToUserCarrier(userId)
    getProfilePopupInfo(userId, 'loginEvents');
}

function contactDriver(el) {
	$('#message_form #msg_user').val($(el).attr('data-user'));
	$('#message_form #msg_msg').val($(el).attr('data-id'));
	window.location.pathname == "/dash/message/" ? $('#messages_box .one_box[data-id="' + $(el).attr('data-user') + '"]').click() : dc.getUrlContent('/dash/message/', {userId: $(el).attr('data-user')});
	dashAlertsC.closeList();
}
;
function toggleMobileMenu() {
	$('body').toggleClass('menu_bg');
	$('.dash_nav').toggle('slide', 'left', 500); 
    if ($('body').hasClass('menu_bg')) {
		$('#menu_bg').show();
	} else {
		$('#menu_bg').hide();
	}
	if ($(window).width() <= 768 && $('#foot_nav').is(':visible')) {
		$('#foot_nav').hide();
	}
}
function toggleFooterMobileMenu() {
	$('#foot_nav').slideToggle(500);
	if ($(window).width() <= 768 && $('.dash_nav').is(':visible')) {
		$('.dash_nav').hide();
		$('body').removeClass('menu_bg');
		$('#menu_bg').hide();
	}
}

function toTime(secs) {
	var date = new Date(1970, 0, 1); // Epoch
	//date.setSeconds(secs);
	date.setSeconds(secs);
	var hours = date.getHours();
	var minutes = date.getMinutes();
	var sec = date.getSeconds();
	/*var ampm = hours >= 12 ? 'pm' : 'am';
	 hours = hours % 12;*/
	hours = hours < 24 ? hours : 0; // the hour '0' should be '12'

	minutes = minutes < 10 ? '0' + minutes : minutes;
	sec = sec < 10 ? '0' + sec : sec;
	var strTime = hours + ':' + minutes;
	return strTime;
}

function toDate(secs) {
	var monthNames = ["January", "February", "March", "April", "May", "June",
		"July", "August", "September", "October", "November", "December"
	];
	var date = new Date(1970, 0, 1); // Epoch
	//date.setSeconds(secs);
	date.setSeconds(secs);
	var day = date.getDate();
	var month = monthNames[date.getMonth()];
	var year = date.getFullYear();
	var strTime = day + ' ' + month + ' ' + year;
	return strTime;
}
function toDateTime(secs, format = '') {
	var monthNames = ["January", "February", "March", "April", "May", "June",
		"July", "August", "September", "October", "November", "December"
	];
	var date = new Date(1970, 0, 1); // Epoch
	//date.setSeconds(secs);
	date.setSeconds(secs);
	var day = date.getDate();
	day = day < 10 ? '0' + day : day;
	var month = monthNames[date.getMonth()];
	var month = date.getMonth() + 1;
	month = month < 10 ? '0' + month : month;
	var year = date.getFullYear();
	var hours = date.getHours();
	var minutes = date.getMinutes();
	var sec = date.getSeconds();
	/*var ampm = hours >= 12 ? 'pm' : 'am';
	 hours = hours % 12;*/
	hours = hours < 24 ? hours : 0; // the hour '0' should be '12'
	hours = hours < 10 ? '0' + hours : hours;
	minutes = minutes < 10 ? '0' + minutes : minutes;
	sec = sec < 10 ? '0' + sec : sec;
	var strTime = month + '-' + day + '-' + year + ' ' + hours + ':' + minutes + ':' + sec;
	if (format == 'slash') {
		strTime = month + '/' + day + '/' + year + ' ' + hours + ':' + minutes + ':' + sec;
	}
	return strTime;
}
function count(collection) {  
  var totalCount = 0;
  for (var index = 0; index < collection.length; index++) {
    if (index in collection && collection[index]) {
      totalCount++;
    }
  }
  return totalCount;
}

function fullScreenControl(mapElement) {
    c('fullScreenControl FOR ' + mapElement);
    $('#' + mapElement).find('>:last-child').append('<button class="mapFullScreenControl" data-map="' + mapElement + '" onclick="switchFullScreen(this)"></button>');
}
function switchFullScreen(el) {
    var $mapElement = $('#' + $(el).attr('data-map'));
    if ($mapElement.hasClass('fullScreenMap')) {
		$('.mapFullScreenControl').hide();
		$mapElement.removeClass('fullScreenMap');
	} else {
		$mapElement.addClass('fullScreenMap');
	}
	window.dispatchEvent(new Event('resize'));
	$('.mapFullScreenControl').show();
}
function dateRangePickerKeyup($picker) {
	var dateFormat = 'MM-DD-YYYY';
	$picker.mask('00-00-0000 - 00-00-0000');
    $picker.off('keyup').on('keyup', function () {
		var pickerRange = $(this).val();
		var pickerDates = pickerRange.split(' - ');
		var d0 = moment(pickerDates[0], dateFormat),
			d1 = moment(pickerDates[1], dateFormat);
        if (d0.isValid()) {
			$(this).data('daterangepicker').setStartDate(pickerDates[0]);
			$(this).data('daterangepicker').updateCalendars();
		}
        if (d1.isValid()) {
			$(this).data('daterangepicker').setEndDate(pickerDates[1]);
			$(this).data('daterangepicker').updateCalendars();
		}
	});
}
function openCloseRcCallBlock() {
    var el = $('.dash_footer .rc_call_block');
    
    if (el.hasClass('opened')) {
        el.removeClass('opened');
    } else {
        el.addClass('opened');
    }
}

function changeAdminView(){
    if(getCookie('newDashboardBeta') && getCookie('newDashboardBeta') == 0){
        createCookie('newDashboardBeta', 1);
    }else{
        eraseCookie('newDashboardBeta');
    }
    window.location.href = window.location.href;
}