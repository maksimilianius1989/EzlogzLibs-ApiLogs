function liveUpdateController() {
    var self = this;
    self.driverLiveLocation = function (data) {
        var userId = data.userId;
        var lat = data.lat;
        var lng = data.lng;
        if (window.location.pathname == "/dash/drivers/" && parseInt(logbook.userId) == userId && logbook.originStatuses[logbook.originStatuses.length - 1].status != 2 && logbook.originStatuses[logbook.originStatuses.length - 1].status != 3) {
            logbook.updateMarkerLocation(data);
        } else if (window.location.pathname == "/dash/") {
            var driver = trucksMap.getDriverById(userId);
            var dashDriver = getDashDriver(userId);
            dashDriver.lt = lat;
            dashDriver.lng = lng;
            driver.lat = lat;
            driver.lng = lng;
            driver.driverId = userId;
            trucksMap.moveOneDriverLocation(driver)
        } else if (window.location.pathname == "/dash/maps/" || window.location.pathname == "/dash/fleet/equipment/") {
            var fuelPercent = data.fuelPercent;
            var fuelRate = data.fuelRate;
            var speed = data.speed;
            var voltage = data.voltage;
            speed = !speed ? 'N/A' : toFixedFloat(speed, 2);
            fuelRate = (!fuelRate || fuelRate == 0) ? 'N/A' : toFixedFloat(fuelRate, 2);
            voltage = !voltage ? 'N/A' : toFixedFloat(voltage, 2);
            fuelPercent = !fuelPercent ? 'N/A' : toFixedFloat(fuelPercent, 2);
            var driver = trucksMap.getDriverById(userId);
            driver.lat = lat;
            driver.lng = lng;
            if (typeof driver.locationInfo != 'undefined' && driver.locationInfo.length > 0) {
                driver.locationInfo[0].latitude = lat;
                driver.locationInfo[0].longitude = lng;
            }
            if ($('.driver_info_popup[data-id="' + userId + '"]').length > 0) {//if open driver popup
                var popup = $('.driver_info_popup[data-id="' + userId + '"]');
                if (popup.find('.live_data').length == 0) {
                    popup.find('.hereMapPopupContent').append('<div class="hereMapPopupRow live_data">\
                        <div class="hereMapPopupIcon">Speed</div>\
                        <div class="hereMapPopupText speedLive">0 MPH</div></div>');
                    popup.find('.hereMapPopupContent').append('<div class="hereMapPopupRow">\
                        <div class="hereMapPopupIcon">Fuel Rate</div>\
                        <div class="hereMapPopupText fuelRateLive">0 GPH</div></div>');
                    popup.find('.hereMapPopupContent').append('<div class="hereMapPopupRow">\
                        <div class="hereMapPopupIcon">Fuel</div>\
                        <div class="hereMapPopupText fuelPercentLive">0%</div></div>');
                    popup.find('.hereMapPopupContent').append('<div class="hereMapPopupRow">\
                        <div class="hereMapPopupIcon">Voltage</div>\
                        <div class="hereMapPopupText voltageLive">0 V</div></div>');

                }
                popup.find('.speedLive').text(speed + ' MPH');
                popup.find('.fuelRateLive').text(fuelRate + ' GPH');
                popup.find('.fuelPercentLive').text(fuelPercent + '%');
                popup.find('.voltageLive').text(voltage + ' V');
            }
            trucksMap.moveOneDriverLocation(driver)
            var truck = trucksMap.getTruckByDriverId(userId);
            truck.lat = lat;
            truck.lng = lng;
            if (typeof truck.locationInfo != 'undefined' && truck.locationInfo.length > 0) {
                truck.locationInfo[0].latitude = lat;
                truck.locationInfo[0].longitude = lng;
            }
            if ($('.truck_info_popup[data-id="' + truck.truckId + '"]').length > 0) {//if open truck popup
                var popup = $('.truck_info_popup[data-id="' + truck.truckId + '"]');
                if (popup.find('.live_data').length == 0) {
                    popup.find('.hereMapPopupContent').append('<div class="hereMapPopupRow live_data">\
                        <div class="hereMapPopupIcon">Speed</div>\
                        <div class="hereMapPopupText speedLive">0 MPH</div></div>');
                    popup.find('.hereMapPopupContent').append('<div class="hereMapPopupRow">\
                        <div class="hereMapPopupIcon">Fuel Rate</div>\
                        <div class="hereMapPopupText fuelRateLive">0 GPH</div></div>');
                    popup.find('.hereMapPopupContent').append('<div class="hereMapPopupRow">\
                        <div class="hereMapPopupIcon">Fuel</div>\
                        <div class="hereMapPopupText fuelPercentLive">0%</div></div>');
                    popup.find('.hereMapPopupContent').append('<div class="hereMapPopupRow">\
                        <div class="hereMapPopupIcon">Voltage</div>\
                        <div class="hereMapPopupText voltageLive">0 V</div></div>');

                }
                popup.find('.speedLive').text(speed + ' MPH');
                popup.find('.fuelRateLive').text(fuelRate + ' GPH');
                popup.find('.fuelPercentLive').text(fuelPercent + '%');
                popup.find('.voltageLive').text(voltage + ' V');
            }
            trucksMap.moveOneTruckLocation(truck)
        } else {
            self.unsubscribeFromLocations(userId);
        }
    }
    self.subscribeForLocations = function (userId) {
        var data = {
            action: 'subscribeForLocations',
            data: {
                userId: userId
            }
        };
        send(data);
    }
    
    self.subscribeForDriverEvents = function (userId) {
        var data = {
            action: 'subscribeForDriverEvents',
            data: {
                userId: userId
            }
        };
        send(data);
    }
    
    self.sendDriverEvent = function (data) {
        var userCard = getModalCardObject('managerUserCard', data.userId);
        if(!userCard){
            userCard = getModalCardObject('userCard', data.userId);
            if(!userCard) {
                self.unsubscribeFromDriverEvents(data.userId);
                return false;
            }
        }
        userCard.sendDriverEvent(data.params)
    }
    self.unsubscribeFromLocations = function (userId) {
        var data = {
            action: 'unsubscribeFromLocations',
            data: {
                userId: userId
            }
        };
        send(data);
    }
    
    self.unsubscribeFromDriverEvents = function (userId) {
        var data = {
            action: 'unsubscribeFromDriverEvents',
            data: {
                userId: userId
            }
        };
        send(data);
    }
    
    self.logbookEditAction = function (data) {
        if($('#log_book').length > 0)
        if ((typeof data.editId != 'undefined' && $('#offer_' + data.editId).length > 0) || //if found date edit
            (typeof data.userId != 'undefined' && $('#log_book').length > 0 && logbook.userId == data.userId &&
                typeof data.dateTime != 'undefined' && moment($('#datepicker').val(), 'MM-DD-YYYY').diff(moment(data.dateTime.substr(0,10), 'YYYY-MM-DD')) == 0) || //if currently on driver logbook same date
            (typeof data.switchedIftaDistances != 'undefined' && data.switchedIftaDistances)) {//or switched ifta distances
            logbook.changeLogbook();
        }
        if (typeof data.userId != 'undefined' && 
                logbook.userId == data.userId && 
                typeof data.dateTime != 'undefined' && 
                moment($('#datepicker').val(), 'MM-DD-YYYY').diff(moment(data.dateTime.substr(0,10), 'YYYY-MM-DD')) >= -86400000 &&
                data.dateTime.substr(11) == '00:00:00') {
            c('firstStatusInNextDay');
            logbook.firstStatusInNextDay = 1;
                }
        if (window.location.pathname == "/dash/" && moment().diff(moment(data.dateTime), 'days')  < 2 ) {
            self.updateDashDriver(data.userId);
        }
        dashAlertsC.refreshTotals();
    }
    self.driverStatusUpdate = function (data) {
        if ($('#cur_statuses').length > 0)
            AjaxController('getCurrentStatusesUpdate', {}, dashUrl, liveUpdateC.getCurrentStatusesUpdateHandler, errorBasicHandler, true);
        if (window.location.pathname == "/dash/") {
            $('#dash_drivers_table tr[data-id="' + data.userId + '"] .stat').attr('class', 'stat pull-right st_' + getStatusFromId(data.status))
            $('#dash_drivers_table tr[data-id="' + data.userId + '"] .stat').text(getStatusFromId(data.status)) +
            $('#one_data tr[data-id="' + data.userId + '"] .duty').html('<span class="stat st_' + getStatusFromId(data.status) + '">' + getStatusFromId(data.status) + '</span>')
            $('.hereOneDriverInfoWindowWrapBox[data-driverid="' + data.userId + '"] .hereOneDriverInfoStatusBox').attr('class', 'hereOneDriverInfoStatusBox '+trucksMap.getDriverStatus(data.status).classColor)
            self.updateDashDriver(data.userId);
        } else if (window.location.pathname == "/dash/drivers/") {
            if ($('#drivers_sec tr[data-id="' + data.userId + '"] .col_st').length == 0)
                return 1;
            $('#drivers_sec tr[data-id="' + data.userId + '"] .col_st').html('<span class="stat st_' + getStatusFromId(data.status) + '">' + getStatusFromId(data.status) + '</span>')
            AjaxController('getDriverLiveUpdate', {userId: data.userId}, dashUrl, liveUpdateC.driversPageDriverUpdate, errorBasicHandler, true);
        }
    }

    self.getCurrentStatusesUpdateHandler = function (response) {
        $('#cur_statuses .number').eq(0).text(response.data.statuses[0])
        $('#cur_statuses .number').eq(1).text(response.data.statuses[1])
        $('#cur_statuses .number').eq(2).text(response.data.statuses[3])
        $('#cur_statuses .number').eq(3).text(response.data.statuses[2])
    }
    self.updateDashDriver = function (userId) {
        $('#dash_drivers_table tr[data-id="' + userId + '"]').removeClass('withAlert')
        $('#one_data tr[data-id="' + userId + '"] .failure').removeClass('failure').removeClass('fa-exclamation-triangle').removeClass('fa')
        if ($('#one_driver_info[data-id="' + userId + '"]').length > 0) {
            showOneDriverDashInfo(userId, true)
        }
        if ($('#dash_logbook:visible').length > 0 && logbook.userId == userId) {
            logbook.changeLogbook(userId);
        }
        var driver = getDashDriver(userId);
        driver.alert_1 = 0;
        driver.alert_2 = 0;
        driver.alert_3 = 0;
        driver.alert_4 = 0;
        driver.alert_5 = 0;
        AjaxController('apiGetDateAlerts', {date: moment($('#dash_date').val(), USADATEFORMAT).format(SQLDATEFORMAT), userId: userId}, dashUrl, liveUpdateC.dashPageDriverUpdate, errorBasicHandler, true);
    }
    self.dashPageDriverUpdate = function (response) {
        if (window.location.pathname != "/dash/") {
            return false;
        }
        var alerts = response.data

        for (var x = 0; x < alerts.length; x++) {
            var alert = alerts[x];
            var driverId = alert.userId;
            showDriverAlerts(driverId, alert)
        }
    }
    self.driversPageDriverUpdate = function (response) {
        if (window.location.pathname != "/dash/drivers/") {
            return false;
        }
        var driver = response.data.driver;
        var newRow = getOneDriverInfo(driver, 1)
        var row = $('#drivers_sec tr[data-id="' + driver.id + '"]')
        var active = row.hasClass('active');
        row.replaceWith(newRow);
        if (active) {
            $('#drivers_sec tr[data-id="' + driver.id + '"]').addClass('active')
        }
        updatePies()
    }
    self.liveUpdateUserData = function (userId, userData) {
        if (window.location.pathname == "/dash/fleet/fleetUsers/") {
            $('.active_tab a').click();
        }
    }

    self.userJoinRequest = function () {
        if (window.location.pathname == "/dash/fleet/fleetUsers/") {
            AjaxController('getFleetJoinRequests', {}, dashUrl, liveUpdateC.getFleetJoinRequestsHandler, errorBasicHandler, true);
        }
    }
    self.getFleetJoinRequestsHandler = function (response) {
        var drivers = response.data;
        if (drivers.length == 0) {
            $('section.new_users').hide()
        } else {
            $('#request_table tbody tr').remove()
            var buttons = [];
            buttons.push('<button onclick="actionUserJoinFleet(this)" >Accept</button>');
            buttons.push('<button onclick="actionUserJoinFleet(this, false)">Reject</button>');
            $.each(drivers, function (key, driver) {
                driver.companyPosition = driver.companyPosition == TYPE_DRIVER ? TYPE_DRIVER_ELD : driver.companyPosition;
                var position = getPositionNameFromId(driver.companyPosition);
				var asOwnerOperator = driver.asOwnerOperator == 1 ? '(As Owner Operator)' : '';
                $('#request_table tbody').append('<tr>\
                    <td>' + driver.name + '</td>\
                    <td>' + driver.last + '</td>\
                    <td>' + driver.email + '</td>\
                    <td>' + position + ''+asOwnerOperator+'</td>\
                    <td data-id="' + driver.id + '">' + addTableActionRow(buttons) + '</td>\
                </tr>')
            })
            $('section.new_users').show()
        }
    }
    self.iftaDistancesChanged = function (data) {
        // update info in popup
        if (window.location.pathname == "/dash/fleet/fleetDrivers/" && $('#dr_id').length && $('#dr_id').val() == data.userId) {
            $('.check_acc.edit[data-id="' + data.userId + '"]').click();
        } else if (window.location.pathname == "/dash/settings/account/" && $('#userInfoSettings').length && $('#userInfoSettings').data('userid') == data.userId) {
            $('.active_tab a[href="/dash/settings/account/"]').click();
        }
    }
}
liveUpdateC = new liveUpdateController();

