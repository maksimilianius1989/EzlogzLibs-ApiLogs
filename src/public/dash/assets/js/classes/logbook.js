var isLogbook = false;
var logbookClass = function () {
    var self = this;
    this.x1 = 0;  //area start
    this.x2 = 0;  //area end
    //this.originalStatuses = []; // data from db
    this.originalLogbook = getCookie('original_setting') == 1 ? true : false; //
    this.cycleStatuses = []; // cycle statuses
    this.timeZoneStatuses = []; // time zone statuses
    this.dbData = {}; // data loaded from db
    this.driverTimeZone = 0; // data loaded from db

    this.edit_parameters = {}; // admin edit fields (logbook top side)
    this.edit_lists = {vehicle: [], trailers: [], docs: [], coDriversIds: []};
    this.user_info = {};
    this.info_edits = [];

    this.changeDriverLiveParamsTrigger = true;
    this.segments = {}; //working array
    this.editedSegment = {}; // segment under cursor
    this.originalSegments = {}; // segments readonly, from BD
    this.isEditMode = false;
    this.blockedLogbookOnClick = false;
    this.offers_points = [];
    this.offerSegments = []; // for illumination of offers_points on the graph
    this.SVGPoint;
    this.svg = null; // need for points
    this.selectorSvg = '#logBook'; // for DOM
    this.svg_width = 744;
    this.editedSegmentIndex; // this.segments[i] - there is "i"
    this.new_mode = false; // for new status insert
    this.nextNewId = -1; // for new status insert
    this.isAobrd = false;
    this.isEld = false;
    this.cantEdit = false;
    this.cantEditLogbook = false;
    this.userId = 0;
    this.iftaDistances = 0;

    this.forMoveSegment = {}; // temporary, needs for moving and creating new areas
    this.forMoveDirection = 1; // temporary, needs for moving and creating new areas
    this.forMoveEditedSegmentIndex = 0; // temporary, needs for moving and creating new areas
    this.forDeleteSegments = {}; // temporary, needs for delete inserted segment
    this.c2 = [];

    this.todaysDate = false;
    this.currentDateString = convertDateToSQL('', false);
    this.todayDateString = '';
    this.todayX = false;
    this.todayX15Min = false;
    this.terminated = false;
    this.forceCarrier = false;

    this.logbookDay = false;
    this.caller = false;
    this.lat = 0;
    this.lng = 0;
    this.lastLocationTime = false;
    this.mapMoved = false;
    this.editGeneralView = false;
    this.editHimself = false;
    this.safetyCanEditOtherDriver = false;
    this.canEdit = false;
    this.firstStatusInNextDay = 0;

    this.isSuperDrivingEdit = false;

    // this.time_transition = false;
    // this.date_time_transition = false;

    this.user_settings = [];

    this.GetURLParameter = function (sParam) {
        var sPageURL = window.location.search.substring(1);
        var sURLVariables = sPageURL.split('&');

        for (var i = 0; i < sURLVariables.length; i++) {
            var sParameterName = sURLVariables[i].split('=');
            if (sParameterName[0] == sParam) {
                return sParameterName[1];
            }
        }

        return false;
    }

    if (self.GetURLParameter('original_setting')) {
        this.originalLogbook = self.GetURLParameter('original_setting');
    }

    this.initLogbook = function () {
        self.changeLogbook();
    }

    this.parseDvirsResponse = function (data) {
        var rowsStr = typeof data.dvirsArr != 'undefined' ? data.dvirsArr.map(item => getOneDvirRow(item)).join('') : '';
        if (rowsStr == '') {
            rowsStr = '<tr><td colspan="4" style="text-align: center;">No Dvirs for this date</td></tr>';
        }
        $('.dvirsBox table tbody').empty().append(rowsStr);
    }
    this.changeLogbook = function (forceDriverId = false) {
        isLogbook = true;
        self.leaveEditMode();
        $('#log_list tbody').empty();
        var driverId = $('.driver_row.active').attr('data-id') || $('.sub_driver.active').attr('data-id');
        var driverName = $('.driver_row.active').find('.driver_name_cell').text() || $('.sub_driver.active').attr('data-name');
        if ($('#date_left').attr('data-page') == 'messages') {
            driverId = $('.one_box.active').attr('data-id');
            driverName = $('.one_box.active').attr('data-name');
        }
        if ($('#date_left').attr('data-page') == 'log')
            driverId = $('#log_box').attr('data-id');
        if (!driverId)
            driverId = $('.driver_row.active').attr('data-id');
        if (!driverId)
            driverId = $('.dvirsBox').attr('data-driverid');
        if (this.GetURLParameter('driverId'))
            driverId = this.GetURLParameter('driverId');
        if (forceDriverId)
            driverId = forceDriverId;
        var d1 = new Date();
        if (this.driverTimeZone == 0) {
            this.driverTimeZone = driverTimeZone;
            self.maxDriverDate = self.newDate(d1.valueOf() + d1.getTimezoneOffset() * 60000 - (self.driverTimeZone) * 60 * 60000);
            $('#datepicker').datepicker('option', 'maxDate', self.maxDriverDate);
            $('#datepicker').datepicker('option', 'setDate', self.maxDriverDate)
        }

        var date = $('#datepicker').val();
        if (date == '' || !date) {
            date = moment().utcOffset(driverTimeZone * 60).format('MM-DD-YYYY')
        }

        if (this.GetURLParameter('date')) {
            date = this.GetURLParameter('date');
        }

        self.currentDateString = convertDateToSQL(date, false);

        if (this.GetURLParameter('driverId') && this.GetURLParameter('date')) {
            self.changeLogDate(driverId, date, 'log');
        } else {
            self.changeLogDate(driverId, date, $('#date_left').attr('data-page'));
        }


        if ($('#date_left').attr('data-page') != 'log' && $("#chat_msgs").length > 0)
            fillDashMessagePage(driverId, driverName);

    }
    this.getDistanceMlKm = function (distance) {
        distance = parseFloat(distance) || 0;
        if (self.odometerId == 1) {
            distance = distance * 1.60934;
        }
        return self.toFixedFloat(distance, 1);
    }
    this.converKmToMi = function (distance) {
        distance = distance / 1.60934;
        return distance;
    }
    this.returnFromGeneralEventView = function () {
        $('#log_title .title_text').text('Log Form');
        $('#return_button').remove();
        if (!curUserIsEzlogzEmployee())
            $('#edit_main_info').show();
        $('#general_event_info').remove();
        $('#edit_main_info').prop('disabled', false);
        self.editGeneralView = false;
        self.parseGeneralDataResponse(self.originalGenearalData);
    }
    this.editGeneralEventView = function (el) {
        self.pendingViewReturn();
        self.returnFromEditReview()
        $('#general_event_info').remove();
        self.leaveEditMode(true);
        var eventTime = $(el).closest('tr').attr('data-time');
        self.editGeneralView = true;
        self.parseGeneralDataResponse(self.editGeneralEvents[eventTime])
        $('#edit_main_info').prop('disabled', true);
        var eventTime = moment(eventTime, 'YYYY-MM-DD hh:mm:ss').format('MM-DD-YYYY hh:mm:ss A')
        $('#edit_main_info').hide();
        $('#return_button').remove();
        $('#edit_main_info').before('<button id="return_button" class="btn btn-default" onclick="logbook.returnFromGeneralEventView()" style="position: relative;bottom: 3px;">Return</button>')
        $('#log_title .title_text').html('Log Form from ' + eventTime)
    }
    this.parseEditGeneralHisotyResponse = function (editEventsRaw) {
        $('#orig_lable').show();
        $('#general_event_info').remove();
        $('#edit_main_info').prop('disabled', false);
        $('#logbookGeneralEventsHistory').remove();
        $('#return_button').remove();
        $('#edit_main_info').show();
        $('#log_title .title_text').text('Log Form');

        if (!self.editHisoty || editEventsRaw.length == 0) {
            return false;
        }
        self.editGeneralEvents = {};
        editEventsRaw.sort(function (a, b) {
            var m1 = moment(a.event_time, 'YYYY-MM-DD hh:mm:ss');
            var m2 = moment(b.event_time, 'YYYY-MM-DD hh:mm:ss');
            var secA = m1.valueOf()
            var secB = m2.valueOf()
            if (m1.utcOffset() < m2.utcOffset()) {
                secA = self.getSecondsFromDateTimeString(a.event_time);
                secB = self.getSecondsFromDateTimeString(b.event_time);
            }
            return secA - secB;
        });
        $.each(editEventsRaw, function (key, editEvent) {
            if (self.todayDateString.substring(0, 10) != editEvent.date) {
                editEvent.event_time = self.todayDateString.substring(0, 10) + ' 00:00:00';
                editEvent.signature = 0;
                editEvent.distance = 0;
                editEvent.distances = [];
            }
            editEvent.driver = self.originalGenearalData.driver;
            editEvent.iftaDistances = self.originalGenearalData.iftaDistances;
            editEvent.isAobrd = self.originalGenearalData.isAobrd;
            editEvent.isEld = self.originalGenearalData.isEld;
            editEvent.odometerId = self.originalGenearalData.odometerId;

            self.editGeneralEvents[editEvent.event_time] = editEvent;
        });

        $('#log_title').after('<div id="logbookGeneralEventsHistory" class="table_wrap" style="margin-bottom:10px;margin-top:10px;max-height: 260px;"></div>');
        $('#logbookGeneralEventsHistory').append('<table class="table table-striped table-dashboard table-hover table-sm clickable mobile_table ">\n\
            <thead>\n\
                <tr class="first_tr_row">\n\
                    <th style="width: 32px;">#</th>\n\
                    <th>Event Time</th>\n\
                    <th>Initiator</th>\n\
                    <th style="width: 75px;">Actions</th>\n\
                </tr>\n\
            </thead>\n\
            <tbody></tbody>\n\
        </table>');
        var $logbookGeneralEventsTableBodyEl = $('#logbookGeneralEventsHistory tbody');
        var counter = 1;
        $.each(self.editGeneralEvents, function (key, editEvent) {
            var initiator = editEvent.initiatorName == null ? 'UNKNOWN' : editEvent.initiatorName;
            if (editEvent.initiatingTime != null && editEvent.adminName != null) {
                var initiatingTime = moment(editEvent.initiatingTime, 'YYYY-MM-DD hh:mm:ss').utcOffset(driverTimeZone * 60).format('MM-DD-YYYY hh:mm:ss A');
                initiator += '(Edit offered by ' + editEvent.adminName + ' at ' + initiatingTime + ')';
            }
            var eventTime = moment(key, 'YYYY-MM-DD hh:mm:ss').format('MM-DD-YYYY hh:mm:ss A');

            $logbookGeneralEventsTableBodyEl.append('<tr data-time="' + key + '">\n\
                <td>' + counter + '</td>\n\
                <td>' + eventTime + '</td>\n\
                <td>' + initiator + '</td>\n\
                <td><button class="btn btn-default" onclick="logbook.editGeneralEventView(this)">View</button></td>\n\
            </tr>');
            counter++;
        });
    }
    this.parseEditHisotyResponse = function (editEventsRaw) {
        $('#logbookEventsHistory').remove();
        if (!self.editHisoty || editEventsRaw.length == 0) {
            return false;
        }
        self.editEvents = {};
        self.originalEvents = [];
        $.each(editEventsRaw, function (key, editEvent) {
            if (self.todayDateString.substring(0, 10) != editEvent.dateTime.substring(0, 10)) {
                //editEventsRaw[key].dateTime = self.todayDateString.substring(0, 10)+' 00:00:00';
            }
        });
        editEventsRaw.sort(function (a, b) {
            var m1 = moment(a.event_time, 'YYYY-MM-DD hh:mm:ss');
            var m2 = moment(b.event_time, 'YYYY-MM-DD hh:mm:ss');
            var secA = m1.valueOf();
            var secB = m2.valueOf();
            if (m1.utcOffset() < m2.utcOffset()) {
                secA = self.getSecondsFromDateTimeString(a.event_time);
                secB = self.getSecondsFromDateTimeString(b.event_time);
            }
            return secA - secB;
        });
        $.each(editEventsRaw, function (key, editEvent) {
            if (editEvent.event_time == '0000-00-00 00:00:00') {
                return true;
            }
            if (editEvent.event_type == 0) {
                self.originalEvents.push(editEvent);
                return true;
            }
            if (typeof self.editEvents[editEvent.event_time] == 'undefined') {
                self.editEvents[editEvent.event_time] = [];
            }
            self.editEvents[editEvent.event_time].push(editEvent);
        });
        $('#log_book').before('<div id="logbookEventsHistory" class="table_wrap" style="margin-bottom:10px;max-height: 260px;"></div>');
        $('#logbookEventsHistory').append('<table class="table table-striped table-dashboard table-hover table-sm clickable mobile_table ">\n\
            <thead>\n\
                <tr class="first_tr_row">\n\
                    <th style="width: 32px;">#</th>\n\
                    <th>Event Time</th>\n\
                    <th>Initiator</th>\n\
                    <th class="notes_row">Reason</th>\n\
                    <th style="width: 75px;">Actions</th>\n\
                </tr>\n\
            </thead>\n\
            <tbody></tbody>\n\
        </table>');
        var $logbookEventsTableBodyEl = $('#logbookEventsHistory tbody');
        $logbookEventsTableBodyEl.append('<tr data-time="original">\n\
            <td>1</td>\n\
            <td>Original</td>\n\
            <td>Original</td>\n\
            <td>Original</td>\n\
            <td><button class="btn btn-default" onclick="logbook.editEventView(this)">View</button></td>\n\
        </tr>');
        var counter = 2;
        $.each(self.editEvents, function (key, editEvent) {
            var initiator = editEvent[0].initiatorName == null ? 'UNKNOWN' : editEvent[0].initiatorName;
            if (editEvent[0].initiatingTime != null && editEvent[0].adminName != null) {
                var initiatingTime = moment(editEvent[0].initiatingTime, 'YYYY-MM-DD hh:mm:ss').utcOffset(driverTimeZone * 60).format('MM-DD-YYYY hh:mm:ss A');
                initiator += '(Edit offered by ' + editEvent[0].adminName + ' at ' + initiatingTime + ')';
            }
            var eventTime = moment(key, 'YYYY-MM-DD hh:mm:ss').format('MM-DD-YYYY hh:mm:ss A');
            $logbookEventsTableBodyEl.append('<tr data-time="' + key + '">\n\
                <td>' + counter + '</td>\n\
                <td>' + eventTime + '</td>\n\
                <td>' + initiator + '</td>\n\
                <td>' + editEvent[0].editAnnotation + '</td>\n\
                <td><button class="btn btn-default" onclick="logbook.editEventView(this)">View</button></td>\n\
            </tr>');
            counter++;
        });
    }
    this.parseGeneralDataResponse = function (data) {
        if (data.length == 0)
            return false;
        self.isAobrd = data.isAobrd;
        self.isEld = data.isEld;
        self.needAnnotation = self.isEld && !self.isAobrd;
        if (self.needAnnotation) {
            $('#annotation_box').parent().show();
        } else {
            $('#annotation_box').parent().hide();
        }
        self.iftaDistances = (self.isEld && !self.isAobrd) || (self.isAobrd && data.iftaDistances) ? 1 : 0;
        self.dbData = $.extend(self.dbData, data);
        self.odometerId = typeof data.odometerId == 'undefined' || !data.odometerId ? 0 : data.odometerId;
        self.distanceLabel = self.odometerId == 0 ? 'mi' : 'km';
        var trucksText = [];
        var trailersText = [];
        if (typeof data.trucks !== 'undefined') {
            $.each(data.trucks, function (key, truck) {
                if (typeof truck.name != 'undefined')
                    trucksText.push(truckCardLink(truck.id, truck.name));
            });
            $.each(data.trailers, function (key, truck) {
                if (typeof truck.name != 'undefined')
                    trailersText.push(truckCardLink(truck.id, truck.name));
            });
        }
        $('.log_vehicle').html(trucksText.length == 0 ? '<b class="error">No trucks</b>' : trucksText.join(', '));
        $('.log_trailers').html(trailersText.length == 0 ? '<b class="error">No trailers</b>' : trailersText.join(', '));
        var coDrivers = data.coDrivers.split(",");
        var coDriversText = '';
        $.each(coDrivers, function (key, driver) {
            coDriversText += coDriversText == '' ? '' : ', ';
            coDriversText += '<span class="one_codriver">' + driver + '</span>';
        });
        $('.log_coDrivers').html(coDriversText);
        $('.log_mainOffice').html(data.MainOfficeString);
        $('.log_homeTerminal').html(data.homeTerminalString);
        $('.log_carrierName').html(data.carrierName);
        $('.log_driver').html(createProfilePopupButton(self.userId, data.driver));
        $('.log_from').html(data.from);
        $('.log_to').html(data.to);
        if (self.iftaDistances) {
            var comm_distance = 0;
            $.each(data.distances, function (i, v) {
                comm_distance += parseFloat(v.distance);
            });
            // switched nonIFTA->IFTA
            if (!data.distances.length && data.distance > 0) {
                if (self.editGeneralView) {
                    $('.log_distance').html((data.distance ? self.getDistanceMlKm(data.distance) : 0) + ' ' + self.distanceLabel);
                } else {
                    $('.log_distance').html((data.distance ? self.getDistanceMlKm(data.distance) : 0) + ' ' + self.distanceLabel + '(Manual Distance)');
                }
            } else
                $('.log_distance').html(self.getDistanceMlKm(comm_distance) + ' ' + self.distanceLabel);
        } else {
            if (self.editGeneralView) {
                $('.log_distance').html((data.distance ? self.getDistanceMlKm(data.distance) : 0) + ' ' + self.distanceLabel);
            } else {
                $('.log_distance').html((data.distance ? self.getDistanceMlKm(data.distance) : 0) + ' ' + self.distanceLabel + '(Manual Distance)');
            }
        }
        $('.log_docs').html('');
        if (data.shippingDocs) {
            if (data.shippingDocs.length > 0) {
                for (var i = 0; i < data.shippingDocs.length; i++) {
                    var name = data.shippingDocs[i].name;
                    var id = data.shippingDocs[i].id;
                    var docsDate = data.shippingDocs[i].date;
                    var type = data.shippingDocs[i].type;
                    var docName = data.shippingDocs[i].reference;
                    if (!docName && data.shippingDocs[i].date)
                        docName = 'BOL ' + timeFromSQLDateTimeStringToUSAString(data.shippingDocs[i].date.substring(0, 10));
                    if (!docName)
                        docName = name;
                    if (id == '-1') {
                        $('.log_docs').append(name + "</br>");
                    } else {
                        $('.log_docs').append("<a target=\"_blank\" href=\"" + MAIN_LINK + "/docs/" + type + "/" + name + "\">" + docsDate + " | " + docName + "</a></br>");
                    }
                }
            } else {
                $('.log_docs').append('<b class="error">No Shipping Docs</b>');
            }
        } else {
            $('.log_docs').append('<b class="error">No Shipping Docs</b>');
        }

        if ($('#date_left').hasClass('loadingPart') || $('#date_right').hasClass('loadingPart')) {
            $('#date_left, #date_right').removeClass('loadingPart');
        } else {
            $('#date_left,#date_right').removeClass('waiting');
            $("#date_right, #date_left").prop("disabled", false);
            if ($('#date_left').attr('data-page') == 'log') {
                if ($("#cur_day").text() == 1) {
                    $('#date_right').addClass('waiting').prop('disabled', true);
                }
                if (parseInt($("#cur_day").text()) == parseInt($("#tot_days").text())) {
                    $('#date_left').addClass('waiting').prop('disabled', true);
                }
            }
        }
        if (data.signature) {
            if (self.editGeneralView) {
                $('.log_signature').html('<b class="confirm">Signed</b>');
            } else {
                var signature = MAIN_LINK + '/docs/signatures/' + data.signature;
                if (typeof data.awsSignature != 'undefined' && data.awsSignature != null && data.awsSignature != '') {
                    signature = data.awsSignature;
                }
                $('.log_signature').html('<b class="confirm"><img src="' + signature + '"></b>');
            }
        } else {
            var createSignatureButton = '';
            if (!self.editGeneralView && (getCookie('dashboard') == 'driver' || getCookie('role') == 0)) {
                createSignatureButton = '<button class="btn btn-default create-signature blockForDispatcher" onclick="logbookSignatureCl.createSignature();"><i class="fa fa-plus"></i></button>';
            }
            $('.log_signature').html('<b class="error">No Signature</b>' + createSignatureButton);
        }
        $('#cur_date').text(self.logbookDay);
        q = JSON.stringify({driverId: self.userId, date: self.logbookDay, driverStatus: window.location.pathname == "/dash/views/driver/log/" ? true : false});
        document.cookie = 'logPageInfo=' + JSON.stringify({driverId: self.userId, date: convertDateToSQL(self.logbookDay, false), driverStatus: window.location.pathname == "/dash/views/driver/log/" ? true : false}) + ';path=/';

        if (data.notes) {
            $('.log_notes').show().html(data.notes);
        }
        self.specials = data.specials;
        self.edit_parameters = {
            vehicle: data.trucks,
            trailers: data.trailers,
            coDrivers: data.coDrivers,
            coDriversIds: data.coDriversIds,
            distance: data.distance,
            driver: [data.driverName, data.driverLast],
            from: data.from,
            to: data.to,
            carrierName: data.carrierName,
            docs: data.shippingDocs,
            homeTerminal: data.homeTerminal,
            mainOffice: data.MainOffice,
            notes: data.notes,
            distances: data.distances,
            signature: data.signature
        }
    }
    this.displayScannerStatuses = function (scannerStatuses) {
        self.scannerStatuses = scannerStatuses;
        $('.scanner_line').remove();
        $.each(scannerStatuses, function (key, status) {
            var stX = self.convertTimeCoordToX(status.dateTime.substring(11));
            if (key == 0 && self.todayDateString != status.dateTime.substring(0, 10) && status.statusTypeId == 0) {//status starts in previous day
                return true;
            }
            if (key == 0 && status.statusTypeId == 1) {//first status  connected
                if (self.todayDateString != status.dateTime.substring(0, 10)) {//first status from yesterday
                    stX = 0;
                }
                $(self.selectorSvg).append(self.svgEl('line'));
                $(self.selectorSvg).find("line").last()
                    .attr("x1", stX)
                    .attr("x2", stX)
                    .attr("y1", 112)
                    .attr("y2", 122)
                    .attr("class", 'scanner_line')
                    .attr("style", "stroke:#5EB82A;stroke-width:2;");
            } else if (key > 0 && scannerStatuses[key - 1].statusTypeId == 1) {
                if (key == 1) {//second scanner status
                    if (self.todayDateString == scannerStatuses[key - 1].dateTime.substring(0, 10)) {
                        var stX1 = self.convertTimeCoordToX(scannerStatuses[key - 1].dateTime.substring(11));
                    } else {
                        var stX1 = 0;
                    }
                } else {
                    var stX1 = self.convertTimeCoordToX(scannerStatuses[key - 1].dateTime.substring(11));
                }

                $(self.selectorSvg).append(self.svgEl('rect'));
                $(self.selectorSvg).find("rect").last()
                    .attr("x", stX1)
                    .attr("width", stX - stX1)
                    .attr("y", 112)
                    .attr("height", 10)
                    .attr("class", 'scanner_line')
                    .attr("style", "stroke:#D7EDCA;stroke-width:2;fill:#D7EDCA;");
                if (key != 1) {
                    $(self.selectorSvg).append(self.svgEl('line'));
                    $(self.selectorSvg).find("line").last()
                        .attr("x1", stX1)
                        .attr("x2", stX1)
                        .attr("y1", 112)
                        .attr("y2", 122)
                        .attr("class", 'scanner_line')
                        .attr("style", "stroke:#5EB82A;stroke-width:2;");
                }
            }

            if (status.statusTypeId == 1 && key == scannerStatuses.length - 1) {//last status connected
                if (self.todaysDate) {
                    var stX1 = logbook.todayX;
                } else {
                    var stX1 = 744;
                }
                $(self.selectorSvg).append(self.svgEl('rect'));
                $(self.selectorSvg).find("rect").last()
                    .attr("x", stX)
                    .attr("width", stX1 - stX)
                    .attr("y", 112)
                    .attr("height", 10)
                    .attr("class", 'scanner_line')
                    .attr("style", "stroke:#D7EDCA;stroke-width:2;fill:#D7EDCA;");
            }

            $(self.selectorSvg).append(self.svgEl('line'));
            $(self.selectorSvg).find("line").last()
                .attr("x1", stX)
                .attr("x2", stX)
                .attr("y1", 112)
                .attr("y2", 122)
                .attr("class", 'scanner_line')
                .attr("style", "stroke:#5EB82A;stroke-width:2;");
        });
    }
    this.displayWeighStationsStatusesList = function () {
        $.each(self.weighStationsStatuses, function (key, status) {
            var stX = self.convertTimeCoordToX(status.dateTime.substring(11));
            var wsStatus = status.status == 0 ? 'Closed' : 'Open';
            var stTypeText = 'Passing <b>' + wsStatus + '</b> Weigh Station "' + status.title + '"';
            var time = self.convertXCoordToTime(stX, (self.isAobrd ? false : true), true);
            $('#log_list tbody').append(`<tr data-index="0" class="logbook_status" data-stx="${stX}">
                <td colspan="3">${time}</td>
                <td colspan="6">${stTypeText}</td>
            </tr>`);
        });
    }
    this.displayScannerStatusesList = function () {
        $.each(self.scannerStatuses, function (key, status) {
            var stX = self.convertTimeCoordToX(status.dateTime.substring(11));
            if (key == 0 && self.todayDateString != status.dateTime.substring(0, 10)) {//status starts in previous day
                return true;
            }
            var stTypeText = status.statusTypeId == 1 ? 'Connected' : 'Disconencted';
            var time = self.convertXCoordToTime(stX, (self.isAobrd ? false : true), true);
            $('#log_list tbody').append(`<tr data-index="0" class="logbook_status" data-stx="${stX}">
                <td class="duty " style="font-size:10px;text-align:left;" colspan="2"><img style="width: 20px;margin-right: 3px;" src="/dash/assets/img/icon/scanner_icon.png" />${stTypeText}</td>
                <td>${time}</td>
                <td colspan="6">Odometer:${self.toFixedFloat(status.odo, 2)} | Engine Hours:${status.totalEngineHours}</td>
            </tr>`);
        });
    }
    this.getStartTime = function (dateTimeStart) {
        var time = '';
        if (logbook.todayDateString == dateTimeStart.substring(0, 10)) {//same day start
            time = dateTimeStart.substring(11);
        } else {//from previous day start
            time = '00:00:00';
        }
        var startX = self.convertTimeCoordToX(time);
        return startX;
    }
    this.getEndTime = function (dateTimeEnd) {
        var time = '';
        if (dateTimeEnd == null || logbook.todayDateString != dateTimeEnd.substring(0, 10)) {//goest till the end of the day
            time = '24:00:00';
            if (self.todaysDate != false) {
                time = convertDateToSQL(self.todaysDate, true).substring(11);
            }
        } else {//same day end
            time = dateTimeEnd.substring(11);
        }
        var endX = self.convertTimeCoordToX(time);
        return endX;
    }
    this.getStatusEndTime = function (index, statuses) {
        var nextIndex = index + 1;
        if (statuses.length > nextIndex) {
            dateTime = statuses[nextIndex].dateTime;
        } else {
            dateTime = convertDateToSQL(self.todaysDate, true);
        }
        var endX = self.getEndTime(dateTime);
        return endX;
    }
    this.getYFromStatusId = function (driverStatus, teamDriverStatus = false) {
        var y = 0;
        var row = 0;
        if (driverStatus == 0) {
            row = 3;
        } else if (driverStatus == 3) {
            row = 0;
        } else if (driverStatus == 2) {
            row = 1;
        } else if (driverStatus == 1) {
            row = 2;
        }
        var h = 14;
        var y = h + row * 2 * h;
        y = teamDriverStatus ? y - 3 : y;
        return y;
    }
    this.switchDriver = function (driverId, driverName) {
        logbookSignatureCl.clearArea('draw-signature');
        $('#select_carrier').val($('#select_carrier option[data-driverid=' + driverId + ']').text());
        $('#searchType').val('driver_name').change();
        $('#searchText').val(driverName);
        if ($('#searchText').length > 0) {
            $('#searchText').keyup();
        } else
            $('#select_carrier').change();
    }
    this.addCoDriverName = function (teamDriverStatus) {
        var otherDriverId = teamDriverStatus.userId1 == self.userId ? teamDriverStatus.userId2 : teamDriverStatus.userId1;
        var driver = fleetC.getUserById(otherDriverId);
        var otherDriverFullName = driver.name + ' ' + driver.last;
        if ($('.log_coDrivers .profile_icon[data-id="' + otherDriverId + '"]').length == 0 && $('.log_coDrivers').text().includes(otherDriverFullName)) {
            var switcher = '<i class="fa fa-refresh" aria-hidden="true" style="cursor:pointer" onclick="logbook.switchDriver(' + otherDriverId + ', \'' + otherDriverFullName + '\')"></i>';
            if (curUserIsEzlogzEmployee() || (isDriver(position) && userRole == 1 && getCookie('dashboard') == 'driver')) {
                switcher = '';
            }
            $('.log_coDrivers .one_codriver:contains("' + otherDriverFullName + '")').html(createProfilePopupButton(otherDriverId, otherDriverFullName) + switcher);
        }
    }
    this.displayTeamDriversStatuses = function (teamDriversStatuses) {
        self.teamDriversStatuses = teamDriversStatuses;
        var this_day = moment(logbook.todayDateString, "YYYY-MM-DD");
        $.each(self.teamDriversStatuses, function (key, teamDriverStatus) {
            self.addCoDriverName(teamDriverStatus);
            var teamDriverLogbookTimeStartX = self.getStartTime(teamDriverStatus.dateTimeStart);
            var teamDriverLogbookTimeEndX = self.getEndTime(teamDriverStatus.dateTimeEnd);
            $.each(teamDriverStatus.teamDriverLogbookStatuses, function (key2, driverStatus) {
                var status_day = moment(driverStatus.dateTime, "YYYY-MM-DD");
                if (this_day.diff(status_day, 'days') < 0) {//status starts in next day
                    return false;
                }
                var driverStatusStartX = Math.max(self.getStartTime(driverStatus.dateTime), teamDriverLogbookTimeStartX);
                var driverStatusEndX = Math.min(self.getStatusEndTime(key2, teamDriverStatus.teamDriverLogbookStatuses), teamDriverLogbookTimeEndX);

                var y = self.getYFromStatusId(driverStatus.status, true);
                self.drawLine(driverStatusStartX, driverStatusEndX, y, y, 'working_line ', '#C4C4C4');
                if (key2 != 0) {//not first status - draw status change line
                    var y1 = self.getYFromStatusId(teamDriverStatus.teamDriverLogbookStatuses[key2 - 1].status, true);
                    self.drawLine(driverStatusStartX, driverStatusStartX, y1, y, 'working_line ', '#C4C4C4');
                }
            });
        });
    }
    this.getEngineStatusColorFromStatusTypeId = function (statusTypeId) {
        var color = '#D65B60';
        if (statusTypeId == 1) {
            color = '#3498DB';
        } else if (statusTypeId == 2) {
            color = '#3498DB';
        } else if (statusTypeId == 3) {
            color = '#3498DB';
        }
        return color;
    }
    this.displayWeighStationsStatuses = function (weighStationsStatuses) {
        self.weighStationsStatuses = weighStationsStatuses;
        $('.ws_line').remove();
        $.each(weighStationsStatuses, function (key, status) {
            var stX = self.convertTimeCoordToX(status.dateTime.substring(11));
            self.drawLine(stX, stX, 0, 111.2, 'working_line ws_line', '#aaa');
        });
    }
    this.displayEngineStatuses = function (engineStatuses) {
        self.engineStatuses = engineStatuses;
        $('.engine_line').remove();

        $.each(engineStatuses, function (key, status) {
            var stX = self.convertTimeCoordToX(status.dateTime.substring(11));
            var color = self.getEngineStatusColorFromStatusTypeId(status.statusTypeId);
            $(self.selectorSvg).append(self.svgEl('line'));
            $(self.selectorSvg).find("line").last()
                .attr("x1", stX)
                .attr("x2", stX)
                .attr("y1", 0)
                .attr("y2", -10)
                .attr("class", 'engine_line')
                .attr("style", "stroke:" + color + ";stroke-width:2;");
        });
    }
    this.getEngineStatusTextFromStatusTypeId = function (statusTypeId) {
        var txt = 'Not Moving';
        if (statusTypeId == 1) {
            txt = 'Start Moving';
        } else if (statusTypeId == 2) {
            txt = 'In motion';
        } else if (statusTypeId == 3) {
            txt = 'Power On';
        } else if (statusTypeId == 4) {
            txt = 'Power Off';
        }
        return txt;
    }
    this.displayEngineStatusesList = function () {
        $.each(self.engineStatuses, function (key, status) {
            var stX = self.convertTimeCoordToX(status.dateTime.substring(11));
            var stTypeText = self.getEngineStatusTextFromStatusTypeId(status.statusTypeId);
            var time = self.convertXCoordToTime(stX, (self.isAobrd ? false : true), true);
            $('#log_list tbody').append(`<tr data-index="0" class="logbook_status" data-stx="${stX}">
				<td class="duty " style="font-size:10px;text-align:left;" colspan="2"><img style="width: 17px;margin-right: 3px;" src="/dash/assets/img/icon/engine_icon.png" />${stTypeText}</td>
				<td>${time}</td>
				<td colspan="6">Odometer:${self.toFixedFloat(status.odo, 2)} | Engine Hours:${status.totalEngineHours} | Location: ${status.position}</td>
			</tr>`);
        });
    }
    this.aobrdAbleToEditQuickChange = function (el) {
        var aobrdAbleToEdit = $(el).attr('data-val');
        self.cantEdit = aobrdAbleToEdit == 0 ? false : true;
        AjaxCall({url: apiDashUrl, action: "aobrdAbleToEditQuickChange", data: {userId: self.userId, aobrdAbleToEdit: aobrdAbleToEdit}});
    }
    this.parseLogbookDataResponse = function (response) {
        if (response.code == 999) {//some error
            createCookie('original_setting', 0);
            self.originalLogbook = false;
            $('#select_carrier').change();
            return 1;
        }
        self.user_settings = response.data.driversData;
        // self.date_time_transition = false;
        // $(self.selectorSvg).find('.date_time_transition').remove();
        // $(self.selectorSvg).find('.timezone_abbreviation').remove();

        self.firstStatusInNextDay = response.data.firstStatusInNextDay;
        self.jurisdiction = response.data.jurisdiction;
        self.ownerOperator = response.data.ownerOperator;
        $('#chat_box').show();
        if (self.ownerOperator) {
            $('#chat_box').hide();
        }
        if (response.code == '115') {
            $('#datepicker').datepicker('option', 'setDate', new Date()).trigger('change');
            return false;
        }
        if (response.data.statuses[0].userId != self.userId || self.requestDate != response.data.date.substr(0, 10)) {
            return 1;
        }
        self.prevDayDeffered = response.data.prevDayDeffered;
        self.editGeneralView = false;
        self.timeZoneShort = response.data.timeZoneShort;
        $('#log_list .first_tr_row th').eq(2).text('Start(' + response.data.timeZoneShort + ')');
        $('.log_tz').text(response.data.timeZoneShort);
        self.scannerStatuses = [];
        self.engineStatuses = [];
        self.weighStationsStatuses = [];
        self.teamDriversStatuses = [];
        self.lat = response.data.lastLocation.lat;
        self.lng = response.data.lastLocation.lng;
        self.lastLocationTime = response.data.lastLocation.lastLocationTime;
        self.originalGenearalData = response.data.logbookInfo;
        self.parseGeneralDataResponse(response.data.logbookInfo);
        self.parseEditHisotyResponse(response.data.editHisoty);
        self.parseEditGeneralHisotyResponse(response.data.editGeneralHisoty);
        var oneDay = 24 * 60 * 60 * 1000;
        var firstDate = self.newDate(response.data.firstDay[0].date);
        $('#datepicker').datepicker('option', 'minDate', firstDate);
        var secondDate = self.newDate();
        var diffDays = Math.ceil(Math.abs((firstDate.getTime() - secondDate.getTime()) / (oneDay)));
        $('#tot_days').text(diffDays);
        var firstDate = self.newDate(response.data.date);
        var secondDate = self.newDate();
        var diffDays = Math.ceil(Math.abs((firstDate.getTime() - secondDate.getTime()) / (oneDay)));
        if (response.data.terminated && response.data.terminateDate) {
            secondDate = self.newDate(response.data.terminateDate);
            $('#datepicker').datepicker('option', 'maxDate', $.datepicker.parseDate('yy-mm-dd', response.data.terminateDate));
            diffDays = Math.ceil(Math.abs((firstDate.getTime() - secondDate.getTime() - 1) / (oneDay)));
        }

        $('#cur_day').text(diffDays);
        if (response.data.statuses.length > 0) {
            response.data.statuses[0].dateTime;
            var d = self.newDate(self.logbookDaySQL);
            d.setTime(d.getTime());
            d.setHours(0, 0, 0, 0);
            var diff = d - self.newDate(response.data.statuses[0].dateTime);//check if status is for today
            if (diff < 0) {//if it starts later than 00:00:00 - create a fake off duty status
                var fakeFirstStatus = JSON.parse(JSON.stringify(response.data.statuses[0]));
                fakeFirstStatus.special = 0;
                fakeFirstStatus.id = -9999;
                fakeFirstStatus.status = 3;
                fakeFirstStatus.dateTime = self.logbookDaySQL + ' 00:00:00';
                response.data.statuses.unshift(fakeFirstStatus);
            }
        }

        self.dbData = $.extend(self.dbData, response.data);
        self.originStatuses = response.data.statuses;
        self.cycleStatuses = response.data.cycleStatuses;
        self.timeZoneStatuses = response.data.timeZoneStatuses;
        self.cantEdit = curUserId != self.userId && response.data.cantEdit;
        self.isAobrd = response.data.aobrd;
        self.isEld = response.data.terminated ? true : response.data.eld;
        self.canEdit = !self.ownerOperator && USER_SETTINGS.InspectionMode != '1' && (curUserIsClient() || (curUserIsEzlogzEmployee() && self.userIsSmartSafety));
        if (curUserId != logbook.userId && fleetC.id > 0 && fleetC.fleetOwnerId != curUserId && response.data.dashParams.editAdminSettings == 0) {//check if admin edit not turned off
            self.canEdit = 0;
        }
        if (position == TYPE_DISPATCHER) {
            self.canEdit = 0;
        }
        if (curUserId == logbook.userId && fleetC.id > 0 && response.data.dashParams.ableEditOnOffSB == 0) {
            self.canEdit = 1;
            self.cantEditLogbook = 1;
        }

        self.checkOriginButton();
        $('.log_buttons_block .editPen').remove();
        if (self.isAobrd && self.canEdit && curUserId != self.userId) {
            $('.log_buttons_block').append('<span class="editPen ' + (self.cantEdit ? 'canEdit' : '') + '" onclick="changeCanEditLogbook(this, event)"><img src="/dash/assets/img/icons_safety/edit.svg" class="canEditImg"/><img src="/dash/assets/img/icons_safety/cantEdit.svg" class="cantEditImg"/></span>');
        }
        var terminated = response.data.terminated;
        self.terminated = response.data.terminated;
        if (self.terminated) {
            $('.attachments_tabs .attachment_add').hide();
        } else {
            $('.attachments_tabs .attachment_add').show();
        }
        $('#terminated').remove();
        if (terminated) {
            $('#log_nav .log_nav_hd.subhead.section-heading').append('<span id="terminated"> Terminated User ' + response.data.terminatedLast + ' ' + response.data.terminatedName + '</span>');
        } else {
            $('.edit_info').show();
        }

        var alerts = response.data.alerts;
        if (alerts.length > 0) {
            $.each(alerts, function (key, alert) {
                if ((alert.alertId == 9 || alert.alertId == 10 || alert.alertId == 12) && $('.day_alert[data-id="' + alert.alertId + '"]').length == 0)
                    $('#log_list').prepend(`<p class="day_alert" data-id="${alert.alertId}">${alert.note}</p>`);
            });
        }
        self.driverTimeZone = response.data.timeZone + summerTime;
        var restart34Hours = 0;

        var edits_offers = JSON.parse(response.data.edits_offers);
        self.info_edits = JSON.parse(response.data.info_edits);

        $("#show_info_edits").remove();

        var points = self.calculatePoints(self.logbookDaySQL, self.caller, response.data.statuses, 0);

        self.offers_points = [];
        self.offers_points.push({id: 0, points: points});
        var point;
        $.each(edits_offers, function (key, offer) {
            point = {id: key, points: self.calculatePoints(self.logbookDaySQL, self.caller, offer, self.offers_points.length, key)};
            self.offers_points.push(point);
            self.segmentsToList(self.pointsToSegments(point.points), '#pending_approvals .ez_table_' + key);
        });
        var hours = {on: 0, off: 0, sb: 0, dr: 0};
        var hoursSec = {on: 0, off: 0, sb: 0, dr: 0};
        self.segments = self.drawLogbookFromPoints(points);
        self.segmentsToList();
        for (var x = 0; x < points.length; x++) {
            var point = points[x];
            // if (point.hasOwnProperty('time_transition') && self.date_time_transition) {
            //    if (point.time_transition == 'WTS') {
            //        point.durationH -= 1;
            //    } else if (point.time_transition == 'STW') {
            //        point.durationH += 1;
            //    }
            // }
            if (self.isEld) {
                hours[point.status] += point.durationH * 60 + self.toInt(point.durationM) + self.toInt(point.durationS / 60);
                hoursSec[point.status] += self.toInt(point.durationH) * 3600 + self.toInt(point.durationM) * 60 + self.toInt(point.durationS);
            } else {
                hours[point.status] += point.durationH * 60 + point.durationM * 15;
            }
            self.check34restart(point);
            if (x == points.length - 1 && self.notEnds(point.hours, point.mins, point.durationH, point.durationM)) {
                self.checkFutureActions(point, restart34Hours);
            }
        }
        self.originalSegments = JSON.parse(JSON.stringify(self.segments));

        self.cancelEdit();
        $('#edit_button').remove();
        $('#pending_approvals_button, #return_original').remove();
        $('#log_book').attr('style', '');
        var padding_top = 0;
        if (self.canEdit && self.offersPointsCount(self.offers_points) > 1) {
            $('#log_book').addClass('hasPending').append('<button id="pending_approvals_button" class="btn btn-default status_edit_button" data-toggle="modal" data-target="#pending_approvals_modal">Pending Approvals</button>');
            padding_top = 1;
        } else {
            $('#log_book').removeClass('hasPending');
        }

        if ((self.isEld && self.canEdit) || curUserIsEzlogzEmployee()) {
            //showOriginalLogbook
            if ($('#log_book .origin_button').length == 0) {
                $('#log_book').prepend('<button class="btn btn-default origin_button" onclick="logbook.showLogbookOptions()" style="background:transparent;"><i class="fa fa-gear" style="font-size: 25px;"></i></button>');
                padding_top = 1;
            }
        }


        // $('#log_book').css('padding-top', '40px');


        self.addTimeControl();

        if (self.isAobrd) {
            self.setLogTime('hours_sb', hoursSec.sb, true, false);
            self.setLogTime('hours_on', hoursSec.on, true, false);
            self.setLogTime('hours_off', hoursSec.off, true, false);
            self.setLogTime('hours_dr', hoursSec.dr, true, false);
            totalSec = hoursSec.sb + hoursSec.on + hoursSec.off + hoursSec.dr;
            self.setLogTime('hours_total', totalSec, true, false);
        } else if (self.isEld) {
            self.setLogTime('hours_sb', hoursSec.sb, true);
            self.setLogTime('hours_on', hoursSec.on, true);
            self.setLogTime('hours_off', hoursSec.off, true);
            self.setLogTime('hours_dr', hoursSec.dr, true);
            totalSec = hoursSec.sb + hoursSec.on + hoursSec.off + hoursSec.dr;
            self.setLogTime('hours_total', totalSec, true);
        } else {
            self.setLogTime('hours_sb', hours.sb);
            self.setLogTime('hours_on', hours.on);
            self.setLogTime('hours_off', hours.off);
            self.setLogTime('hours_dr', hours.dr);
            total = hours.sb + hours.on + hours.off + hours.dr;
            totalSec = hoursSec.sb + hoursSec.on + hoursSec.off + hoursSec.dr;
            self.setLogTime('hours_total', total);
        }
        if (hours.dr == 0) {
            $('#log_info').addClass('no_drive');
        } else {
            $('#log_info').removeClass('no_drive');
        }
        // map route only fo safety
        if (window.location.pathname == '/dash/drivers/')
            self.drawMapRoute(response, points);
        if ($('#date_left').hasClass('loadingPart') || $('#date_right').hasClass('loadingPart')) {
            $('#date_left, #date_right').removeClass('loadingPart');
        } else {
            $('#date_left,#date_right').removeClass('waiting');
            $("#date_right, #date_left").prop("disabled", false);
            if ($('#date_left').attr('data-page') == 'log') {
                if ($("#cur_day").text() == 1) {
                    $('#date_right').addClass('waiting').prop('disabled', true);
                }
                if (parseInt($("#cur_day").text()) == parseInt($("#tot_days").text())) {
                    $('#date_left').addClass('waiting').prop('disabled', true);
                }
                if (parseInt($("#cur_day").text()) > parseInt($("#tot_days").text())) {
                    $("#cur_day").text(1);
                }
            }
        }

        $('#datepicker').datepicker('option', 'maxDate', self.maxDriverDate);
        if (response.data.terminated && response.data.terminateDate) {
            $('#datepicker').datepicker('option', 'maxDate', $.datepicker.parseDate('yy-mm-dd', response.data.terminateDate));
        } else {
            var d1 = self.newDate();
            self.maxDriverDate = self.newDate(d1.valueOf() + d1.getTimezoneOffset() * 60000 - (self.driverTimeZone) * 60 * 60000);
        }
        if (moment(logbook.todayDateString).diff(moment(logbook.maxDriverDate)) > 0 && window.location.pathname != '/dash/') {
            logbook.changeLogbook();
            return 1;
        }

        $('#log_info .form-group .dvir').remove();
        if (typeof response.data.dvir != 'undefined')
            if (curUserIsEzlogzEmployee()) {
                let issetDvir = false;
                if (response.data.dvir.dvirsArr.length > 0) {
                    issetDvir = true;
                }
                $('#log_info .form-group').append(`
                    <div class="col-sm-6 dvir">
                        <div class="row">
                            <label class="col-xs-4 control-label text-left">DVIR</label>
                            <div class="col-xs-8 control-label text-left">${issetDvir ? '<span style="color:green;">DVIR is set</span>' : '<span class="error">No DVIR for this day</span>'}</div>
                        </div>
                    </div>
                `);
                let cargoType = 'Property';
                switch (response.data.cargoType) {
                    case '1':
                        cargoType = 'Agriculture';
                        break;
                    case '2':
                        cargoType = 'Passenger';
                        break;
                    case '3':
                        cargoType = 'Oil and Gas';
                        break;
                    case '4':
                        cargoType = 'Short-Haul';
                        break;
                }
                $('#log_info .form-group').append(`
                    <div class="col-sm-6 dvir">
                        <div class="row">
                            <label class="col-xs-4 control-label text-left">CARGO TYPE</label>
                            <div class="col-xs-8 control-label text-left">${cargoType}</div>
                        </div>
                    </div>
                `);
            } else {
                self.parseDvirsResponse(response.data.dvir);
            }
        if (typeof response.data.scannerStatuses != 'undefined')
            self.displayScannerStatuses(response.data.scannerStatuses);
        if (typeof response.data.engineStatuses != 'undefined')
            self.displayEngineStatuses(response.data.engineStatuses);
        if (typeof response.data.teamDriversStatuses != 'undefined')
            self.displayTeamDriversStatuses(response.data.teamDriversStatuses);
        if (typeof response.data.weighStationsStatuses != 'undefined')
            self.displayWeighStationsStatuses(response.data.weighStationsStatuses);
        if (!self.isEditMode) {
            self.displayScannerStatusesList();
            self.displayWeighStationsStatusesList();
            self.displayEngineStatusesList();
            self.sortStatuses();
        }

        $('.edit_info').remove();
        $('#edit_main_info').hide();
        if (getCookie('original_setting') != 1 && (!curUserIsEzlogzEmployee() || self.userIsSmartSafety)) {
            if (self.canEdit) {
                var generalEditButtons = '<div class="edit_info">';

                if (!self.terminated)
                    generalEditButtons += '<button id="signature-last_30_days" class="blue-border mob_margin_top_10" onclick="logbookSignatureCl.showSignatureLast30DayPopup();">Sign last 30 days</button>';
                generalEditButtons += '<button id="6_month_pdf" class="blue-border mob_margin_top_10" onclick="logbook.show6MonthReportPDFPopap()">PDF report</button>';
                generalEditButtons += '<button class="blue-border drivers_log_pdf" onclick="generatePDFPopap();">Download PDF</button>';
                generalEditButtons += '</div><br class="show_mob"/>';
                $('.nav_sub').append(generalEditButtons);
                $('#edit_main_info').show();
                self.drawInfoEdits(self.info_edits);
            }
        }
        self.initTimeZoneSettings();
        self.clearCanadaElements();
        if (self.jurisdiction == 1) {//canada
            self.initCanadaJurisdiction();
        }
        $('.modal_card[data-userid="' + self.userId + '"] .switch_body .control-buttons .pies').remove();
        if (curUserIsEzlogzEmployee()) {
            self.parseCurrentShiftData(response.data.shiftData);
        }
        if (self.changeDriverLiveParamsTrigger) {
            self.changeDriverLiveParams();
        }
        var recapInfo_setting = getCookie('recapInfo_setting');
        if (self.GetURLParameter('recapInfo_setting')) {
            recapInfo_setting = self.GetURLParameter('recapInfo_setting');
        }
        if (recapInfo_setting == 1) {
            $('#recapInfo').show();
            self.recap(response.data.recapInfo);
        } else {
            $('#recapInfo').hide();
        }
    }
    this.recap = function (recapInfo) {
        $('#totHrsSinceRestartTitle').text(recapInfo.title);
        $('#totHrsSinceRestart').text(recapInfo.previousDays[recapInfo.previousDays.length - 1].totalTimeAfter34Restart);
        $('#hrsAvailableToday').text(recapInfo.previousDays[recapInfo.previousDays.length - 1].cycle);
        $('#hrsAvailableTomorrow').text(recapInfo.HoursAvailableTomorrow);
        $('#hrsWorkedToday').text(getDurationFromSec(recapInfo.workedToday));
        $('#hoursLeftToDrive').text(recapInfo.hoursLeftToDrive);

        $('.recapInfo .cycle').empty();
        $.each(recapInfo.previousDays, function (key, day) {
            var content = `<div class="day ${day.isFirst} ${day.isLast}">
                                <p class="date">${day.nnDay}</p>
                                <p class="time">${day.workedToday}${day['34Restart']}</p>
                            </div>`;
            $('.recapInfo .cycle').append(content);
        });
    }
    this.parseCurrentShiftData = function (shiftData) {
        var driveVal = String(shiftData.drive)[0] === '-' ? '00:00' : getDurationFromSec(shiftData.drive, true);
        var shiftVal = String(shiftData.shift)[0] === '-' ? '00:00' : getDurationFromSec(shiftData.shift, true);
        var cycleVal = String(shiftData.cycle)[0] === '-' ? '00:00' : getDurationFromSec(shiftData.cycle, true);
        var drivePerc = parseInt(shiftData.drive / shiftData.rules.driveHours / 60 / 60 * 100);
        var shiftPerc = parseInt(shiftData.shift / shiftData.rules.shiftHours / 60 / 60 * 100);
        var cyclePerc = parseInt(shiftData.cycle / shiftData.rules.cycleHours / 60 / 60 * 100);
        $('.modal_card[data-userid="' + self.userId + '"] .switch_body .control-buttons').prepend('<div class="pies"></div>');
        $('.modal_card[data-userid="' + self.userId + '"] .switch_body .control-buttons .pies').append(`<div class="one_pie"><label>Drive:</label>${self.pieChart(drivePerc, driveVal, "81AC4D")}</div>`);
        $('.modal_card[data-userid="' + self.userId + '"] .switch_body .control-buttons .pies').append(`<div class="one_pie"><label>Shift:</label>${self.pieChart(shiftPerc, shiftVal, "78B3EB")}</div>`);
        $('.modal_card[data-userid="' + self.userId + '"] .switch_body .control-buttons .pies').append(`<div class="one_pie"><label>Cycle:</label>${self.pieChart(cyclePerc, cycleVal, "767676")}</div>`);

        //recalculate user statuses (EW-939)
        $('.modal_card[data-userid="' + self.userId + '"] .switch_body .control-buttons .pies').append(`<button class="btn btn-default" onclick="showRecalculatePopap(${self.userId});">Recalculate statuses</button>`);

        self.updatePies();
    }
    this.updatePies = function () {
        $(".pie").each(function () {
            var percent = $(this).data("percent"),
                $left = $(this).find(".left_pie span"),
                $right = $(this).find(".right_pie span"),
                deg;

            if (percent <= 50) {
                // Hide left
                $left.hide();

                // Adjust right
                deg = 180 - (percent / 100 * 360);
                $right.css({
                    "-webkit-transform": "rotateZ(-" + deg + "deg)"
                });
            } else {
                // Adjust left
                deg = 180 - ((percent - 50) / 100 * 360);
                $left.css({
                    "-webkit-transform": "rotateZ(-" + deg + "deg)"
                });
            }
        });
    }
    this.pieChart = function (perc, value, color = '77aaf4') {
        return '<div class="pie" data-percent="' + perc + '" data-value="' + value + '">\
            <div class="left_pie"><span style="background-color:#' + color + ';"></span></div><div class="right_pie"><span style="background-color:#' + color + ';"></span></div>\
        </div>';
    }
    this.initTimeZoneSettings = function () {

    }
    this.clearCanadaElements = function () {
        $('#canada_general_elements').remove();
    }
    this.initCanadaJurisdiction = function () {
        $('#log_info .form-group .col-sm-6').eq(1).append('<div class="row" id="canada_general_elements"></div>');
        $('#canada_general_elements').append('<label class="col-sm-4 control-label text-left">Deffer Off Duty</label>\n\
			<div class="col-sm-8 logbook_parameter control-label text-left " >\n\
				<div class="check_buttons_block" id="defferOff">\n\
					<button type="button" class="btn btn-default" onclick="doActive(this)" data-val="1">On</button>\n\
					<button type="button" class="btn btn-default active" onclick="doActive(this)" data-val="0">Off</button>\n\
				</div>\n\
			</div>');
        checkButtonInit('defferOff', false);
        $('#defferOff button').prop('disabled', true);
        if (!logbook.prevDayDeffered) {
            $('#defferOff').parent().css({'vertical-align': 'middle', 'padding-top': 0});
            $.each(logbook.specials, function (key, spec) {
                if (spec.specId == 1) {
                    checkButtonInit('defferOff', true);
                }
            });

        } else {
            $('#defferOff').css('font-size', '14px').text('Previous day deffered');

        }
    }
    this.sortStatuses = function () {
        var tbody = $('#log_list tbody');
        tbody.find('tr').sort(function (a, b) {
            var a1 = toFixedFloat($(a).attr('data-stx'), 12);
            var b1 = toFixedFloat($(b).attr('data-stx'), 12);
            return (+a1) - (+b1);
        }).appendTo(tbody);
    }
    this.changeDriverLiveParams = function () {
        self.changeDriverLiveParamsTrigger = false;
        $('#driverLiveParameters').show();
        if (!self.isEld && !self.isAobrd || !self.todaysDate || self.originStatuses[self.originStatuses.length - 1].status == 2 || self.originStatuses[self.originStatuses.length - 1].status == 3) {
            $('#driverLiveParameters').hide();
        }
        if (globalUsersOnline[self.userId] != undefined && globalUsersOnline[self.userId].online == 1) {
            $('#speedLive').text('loading');
            $('#fuelRateLive').text('loading');
            $('#fuelPercentLive').text('loading');
            $('#voltageLive').text('loading');
        } else {
            $('#speedLive').text('Offline');
            $('#fuelRateLive').text('Offline');
            $('#fuelPercentLive').text('Offline');
            $('#voltageLive').text('Offline');
        }
    }
    this.changeLogDate = function (driverId = false, date, caller, recalculate = true) {
        $('#log_list th:nth-child(7), #log_list th:nth-child(8), #log_list th:nth-child(9), #log_list td:nth-child(7), #log_list td:nth-child(8), #log_list td:nth-child(9)').show();
        if (self.userId != driverId)
            self.changeDriverLiveParamsTrigger = true;
        isLogbook = true;
        self.mapMoved = false;
        $('.edit_info').remove();
        $('.confirm').remove();
        $('.log_carrier, .log_vehicle, .log_trailers, .log_mainOffice, .log_homeTerminal, .log_docs, .log_carrierName, .log_distance, .log_driver, .log_from, .log_to, .log_notes, .log_coDrivers').html('');
        $(self.selectorSvg).find(".working_line, .working_number").remove();
        self.logbookDay = date;
        self.logbookDaySQL = convertDateToSQL(date);

        self.userId = !driverId ? self.userId : driverId;
        self.editHimself = self.userId == parseInt(curUserId);
        self.safetyCanEditOtherDriver = userRole == 1 && getCookie('dashboard') != 'driver' && USER_SETTINGS.InspectionMode != '1';
        self.initLogbookOnClicks();
        self.leaveEditMode();
        self.offerSegments = [];
        $('#pending_approvals').html('');
        date = convertDateToSQL(date);
        self.requestDate = date;
        self.todayDateString = date;
        $('#date_left,#date_right').addClass('waiting');
        self.caller = caller;
        if (self.caller == 'trucks') {
            getTruckReport(date, $('#drivers_sec tr.active').attr('data-truckId'), self.userId, driversPageHandler);
        }
        $(self.selectorSvg).find(".working_line, .working_number").remove();
        self.originalLogbook = USER_SETTINGS.InspectionMode != '1' ? self.originalLogbook : false;
        var data = {driverId: self.userId, date: date, originalLogbook: self.originalLogbook, forceCarrier: self.forceCarrier};
        if (self.caller == 'log' && $('#log_box').attr('data-st') == 'status') {
            data.driverStatus = 'true';
        }
        $('.day_alert').remove();
        if (window.location.pathname == "/dash/drivers/" || curUserIsEzlogzEmployee()) {
            data.dvir = true;
            data.dateStart = date;
            data.dateFinish = date;
        }
        if (curUserIsEzlogzEmployee()) {
            data.cargoType = true;
        }
        self.canEdit = USER_SETTINGS.InspectionMode != '1' && curUserIsClient();
        self.editHisoty = false;
        var engine_setting = 1;
        // if (self.GetURLParameter('engine_setting')) {
        //     engine_setting = self.GetURLParameter('engine_setting');
        // }
        if ((curUserIsEzlogzEmployee() || self.canEdit) && engine_setting == 1) {
            data.engineStatuses = true;
        }
        var scanner_setting = getCookie('scanner_setting');
        if (self.GetURLParameter('scanner_setting')) {
            scanner_setting = self.GetURLParameter('scanner_setting');
        }
        if ((curUserIsEzlogzEmployee() || self.canEdit) && scanner_setting == 1) {
            data.scannerStatuses = true;
        }
        var weighStations_setting = getCookie('weighStations_setting');
        if (self.GetURLParameter('weighStations_setting')) {
            weighStations_setting = self.GetURLParameter('weighStations_setting');
        }
        if ((curUserIsEzlogzEmployee() || self.canEdit) && weighStations_setting == 1) {
            data.weighStations = true;
        }
        var editHisoty_setting = getCookie('editHisoty_setting');
        if (self.GetURLParameter('editHisoty_setting')) {
            editHisoty_setting = self.GetURLParameter('editHisoty_setting');
        }

        if (editHisoty_setting == 1) {
            $('#editHisoty_setting button[data-val="1"]').addClass('active');
        } else {
            $('#editHisoty_setting button[data-val="0"]').addClass('active');
        }

        if ((curUserIsEzlogzEmployee() || self.canEdit) && editHisoty_setting == 1 && window.location.pathname != '/dash/') {
            data.editHisoty = true;
            self.editHisoty = true;
        }
        var teamDrivers_setting = getCookie('teamDrivers_setting');
        if (self.GetURLParameter('teamDrivers_setting')) {
            teamDrivers_setting = self.GetURLParameter('teamDrivers_setting');
        }
        if ((curUserIsEzlogzEmployee() || self.canEdit) && teamDrivers_setting == 1) {
            data.teamDrivers = true;
        }
        if (self.apiRequest)
            self.apiRequest.abort();
        if (recalculate) {
            setTimeout(function () {
                AjaxController('recalculateUserStatuses', data, apiLogbookUrl, self.recalculateUserStatusesHandler, self.recalculateUserStatusesHandler, true);
            }, 1000);
        }
        self.apiRequest = AjaxController('apiGetLogbook', data, apiLogbookUrl, self.parseLogbookDataResponse, self.parseLogbookDataResponse, true);
    }

    this.recalculateUserStatusesHandler = function (response) {
        let data = response.data;
        if (self.logbookDaySQL == data.date && !data.cache) {
            if (self.GetURLParameter('driverId') && self.GetURLParameter('date')) {
                self.changeLogDate(data.driverId, data.date, 'log', false);
            } else {
                self.changeLogDate(data.driverId, data.date, $('#date_left').attr('data-page'), false);
            }
        }
    }

    this.drawLogbookFromPoints = function (points) {
        var segments = [];
        for (var x = 0; x < points.length; x++) {
            var point = points[x];
            self.addLogBookPoint(points[x]);
            if (x != 0) {
                self.drawLine(points[x - 1].svgX2, points[x - 1].svgX2, points[x - 1].svgY, point.svgY, 'working_line', '#3498db');
            }
            var coord_obj = {x1: point.svgX1, x2: point.svgX2, y: point.svgY, status: point.status, from: point};
            segments.push(coord_obj);
        }
        $.each(self.cycleStatuses, function (key, st) {
            var stX = self.convertTimeCoordToX(st.dateTime.substring(11));
            self.drawLine(stX, stX, 0, 111.2, 'working_line cycle_status', '#555354');
        });
        $.each(self.timeZoneStatuses, function (key, st) {
            var stX = self.convertTimeCoordToX(st.dateTime.substring(11));
            self.drawLine(stX, stX, 0, 111.2, 'working_line cycle_status', '#555354');
        });
        return segments;
    }
    this.pointsToSegments = function (points) {
        var segments = [];
        for (var x = 0; x < points.length; x++) {
            segments.push({x1: points[x].svgX1, x2: points[x].svgX2, y: points[x].svgY, status: points[x].status, from: points[x]});
        }
        return segments;
    }
    this.getSecondsFromDateTimeString = function (dateTime) {
        var duration = parseInt(dateTime.substr(17, 2)) + parseInt(dateTime.substr(14, 2)) * 60 + parseInt(dateTime.substr(11, 2)) * 60 * 60;
        return duration;
    }
    this.calculatePoints = function (dates, caller, items, edits, editId) {
        if (edits >= 1) {
            var editor = items['editor'];
            var statuses = items['statuses'];
        } else {
            var statuses = items;
        }
        var points = [];
        var restart34Hours = 0;
        var d = self.newDate(dates);
        d.setTime(d.getTime());
        d.setHours(0, 0, 0, 0);
        var date = dates + ' 00:00:00';
        var counter = 0;
        var statusesCount = statuses.length;
        var d1 = self.newDate();
        self.todaysDate = self.newDate(d1.valueOf() + d1.getTimezoneOffset() * 60000 - (self.driverTimeZone) * 60 * 60000);
        if (d.setHours(0, 0, 0, 0) != self.todaysDate.setHours(0, 0, 0, 0)) {
            self.todaysDate = false;
        }
        //Calculate all points and their durations
        if (statusesCount > 0) {
            if (edits >= 1) {
                var table_header_tr = '<th>№</th><th>Status</th><th>Start(PDT)</th><th>Duration</th><th>Annotation</th>';
                //$('#log_list').find('.first_tr_row').html();
                var statuses_table = '<table class="table table-striped table-dashboard table-sm mobile_table ez_table ez_table_' + editId + '"><thead>' + table_header_tr + '</thead><tbody></tbody></table>';
                var edits_str = '<div id="offer_' + editId + '" class="offer">';
                edits_str += '<div class="offer-header" id="heading_' + edits + '">';
                edits_str += '<h5 class="mb-0"><div id="offer_title_' + edits + '" class="offer_row_title collapsed" data-toggle="collapse" data-target="#collapse_' + edits + '" aria-expanded="false" aria-controls="collapse_' + edits + '">Offer by ' + editor + ' №' + editId + '</div>';
                //edits_str += '<h5 class="mb-0"><button id="offer_title_'+edits+'" class="offer_title collapsed" data-toggle="collapse" data-target="#collapse_'+edits+'" aria-expanded="false" aria-controls="collapse_'+edits+'">Offer by '+editor+' №'+edits+'</button>';
                edits_str += '<span class="delate_offer blue-border" onclick="logbook.removeEditOffers(' + edits + ');">Remove</span>';
                edits_str += '<span class="view_offer blue-border" onclick="logbook.pendingOfferView(' + edits + ');">View</span></h5></div>';
                edits_str += '<div id="collapse_' + edits + '" class="collapse" aria-labelledby="heading' + edits + '" data-parent="#accordion">';
                edits_str += '<div class="offer-body table_wrap">' + statuses_table + '</div></div></div>';
                $('#pending_approvals').append(edits_str);
            }
            statuses.sort(function (a, b) {
                return self.newDate(a.dateTime) - self.newDate(b.dateTime);
            });
            //chec if today changed winter->summer time - browser cant correctly distinguish dates
            var logbookDay = moment(self.todayDateString, 'YYYY-MM-DD hh:mm:ss');
            var logbookNextDay = moment(self.todayDateString, 'YYYY-MM-DD hh:mm:ss').add('1', 'days');
            if (logbookDay.utcOffset() < logbookNextDay.utcOffset()) {
                statuses.sort(function (a, b) {
                    var secA = self.getSecondsFromDateTimeString(a.dateTime);
                    var secB = self.getSecondsFromDateTimeString(b.dateTime);
                    if (a.dateTime.substr(8, 2) != self.todayDateString.substr(8, 2)) {
                        secA = 0;
                    }
                    if (b.dateTime.substr(8, 2) != self.todayDateString.substr(8, 2)) {
                        secB = 0;
                    }
                    return secA - secB;
                });
            }
            // fix graph after switch Eld->nonEld
            if (!self.isEld) {
                for (var x = 0; x < statuses.length; x++) {
                    statuses[x].dateTime = convertDateToSQL(self.dateTimeToNearest15Mins(self.newDate(statuses[x].dateTime)), true, false);
                }
            }
            //cut all previous days
            for (var x = 0; x < statuses.length; x++) {
                var diff = d - self.newDate(statuses[x].dateTime);//check if status is for today
                statuses[x].originalDateTime = statuses[x].dateTime + '';
                if (diff > 0) {
                    statuses[x].dateTime = date;//set to beginning of the day
                    statuses[x].coming_from_prev_day = true;
                } else {
                    statuses[x].coming_from_prev_day = false;
                }
            }
            for (var x = 0; x < statuses.length; x++) {
                counter++;
                var st = statuses[x];//get status
                var dt = st.dateTime;//get dateTime
                var duration = 0;//st.length;//get duration
                var lng = st.lng || st.long;//get longitude
                var lt = st.lt || st.lat;//get latitude
                var message = st.message || '';//get message
                var position = st.position;//get position
                var odo = st.odo;//get odometer
                var status = self.statusNumderToLiteralConvert(st.status);//get status
                var special = st.special;
                var restartFromStatusStart = false;
                restart34Hours = st.restart34;
                var diff = d - self.newDate(dt);//check if status is for today
                var coming_from_prev_day = false;
                if (st.coming_from_prev_day) {
                    restart34Hours -= (d - self.newDate(st.originalDateTime)) / 1000;
                    coming_from_prev_day = true;
                }
                var secThis = 0;
                var secNext = 24 * 60 * 60;
                if (statusesCount == x + 1 && $.type(self.todaysDate) == 'date') {//if last and today, till now
                    self.todaysDate = self.newDate(d1.valueOf() + d1.getTimezoneOffset() * 60000 - (self.driverTimeZone) * 60 * 60000);
                    var dt2 = convertDateToSQL(self.todaysDate, true);
                    secNext = self.getSecondsFromDateTimeString(dt2);
                    if (x != 0) {//not first
                        secThis = self.getSecondsFromDateTimeString(dt);
                    }
                } else if (x == 0 && statusesCount == x + 1) {//if first and last
                    secThis = 0;
                    secNext = 24 * 60 * 60;
                    if (diff > 0) {//if its earlier -then its previous day
                        dt = date;//set to beginning of the day
                    }
                } else if (x == 0) {//if first
                    secThis = 0;
                    var dt2 = statuses[x + 1].dateTime;//get dateTime of the next status
                    secNext = self.getSecondsFromDateTimeString(dt2);
                } else if (statusesCount == x + 1) {//if its the last status
                    secNext = 24 * 60 * 60;
                    secThis = self.getSecondsFromDateTimeString(dt);
                } else {
                    var dt2 = statuses[x + 1].dateTime;//get dateTime of the next status
                    secNext = self.getSecondsFromDateTimeString(dt2);
                    secThis = self.getSecondsFromDateTimeString(dt);
                }
                duration = secNext - secThis;
                if ($.type(self.todaysDate) == 'date') {
                    self.todayX = self.convertTimeCoordToX(convertDateToSQL(self.todaysDate, true).substring(11));
                    if (!self.isEld) {
                        var date_temp = self.newDate(self.currentDateString + ' ' + self.convertXCoordToTime(self.todayX, true));
                        self.todayX15Min = self.convertTimeCoordToX(self.dateTimeToNearest15Mins(date_temp).toTimeString().substr(0, 8));
                    }
                } else {
                    self.todayX = false;
                    self.todayX15Min = false;
                }

                if (duration > 24 * 60 * 60)
                    duration = 24 * 60 * 60;

                if (st.status != 0 && st.status != 1) {
                    if (restart34Hours > 0) {
                        restart34Hours -= duration;
                        if (restart34Hours <= 0) {
                            restartFromStatusStart = duration + restart34Hours;
                        }
                    }
                }

                duration = duration < 0 ? 0 : duration;

                var durationDisplay = getDurationFromSec(duration, false, (self.isAobrd ? false : true));
                // if (edits < 1 && !self.date_time_transition) {
                //     self.date_time_transition = false;
                // }
                // if (st.hasOwnProperty('time_transition') && st.hasOwnProperty('date_time_transition')) {
                //     self.date_time_transition = true;

                //     self.time_transition = st.time_transition;
                //     if (st.time_transition == 'WTS') {

                //         $(self.selectorSvg).find('.date_time_transition').remove();
                //         $(self.selectorSvg).find('.timezone_abbreviation').remove();

                //         $(self.selectorSvg).append(self.svgEl('rect'));
                //         $(self.selectorSvg).find('rect').last()
                //                 .attr("x", 62)
                //                 .attr("width", 31)
                //                 .attr("y", -1)
                //                 .attr("height", 114)
                //                 .attr("class", 'date_time_transition')
                //                 .attr("style", "fill:rgba(53, 152, 219, 0.6);");

                //         $(self.selectorSvg).append(self.svgEl('text'));
                //         $(self.selectorSvg).find('text').last().text(st.timezone_abbreviation)
                //                 .attr("x", 66)
                //                 .attr("y", 135)
                //                 .attr("class", 'timezone_abbreviation')
                //                 .attr("style", "fill: rgb(53, 152, 219);font-size:12px;font-weight:600;");

                //         durationDisplay = getDurationFromSec(duration - 3600, false, (self.isAobrd ? false : true));
                //     } else if (st.time_transition == 'STW') {
                //         durationDisplay = getDurationFromSec(duration + 3600, false, (self.isAobrd ? false : true));
                //     }
                // }

                if (!self.isEld && self.todaysDate && x == statuses.length - 1) {
                    var dur_hours = Math.floor(duration / 3600);
                    var dur_minutes = duration - dur_hours * 3600;
                    dur_minutes = Math.floor(dur_minutes / 60);
                    if (dur_minutes >= 45)
                        dur_minutes = 45;
                    else if (dur_minutes >= 30)
                        dur_minutes = 30;
                    else if (dur_minutes >= 15)
                        dur_minutes = 15;
                    else
                        dur_minutes = 0;
                    durationDisplay = getDurationFromSec(dur_hours * 3600 + dur_minutes * 60, false, false);
                }

                duration = getDurationFromSec(duration, false, true);//change duration from seconds into hours / minutes

                $('.on_edit').hide();
                var point = {
                    coming_from_prev_day: coming_from_prev_day,
                    status: status,
                    time: dt,
                    drive: st.drive,
                    shift: st.shift,
                    hadCan24Break: st.hadCan24Break,
                    shiftWork: st.shiftWork,
                    eight: st.eight,
                    cycle: st.cycle,
                    duration: duration,
                    durationDisplay: durationDisplay,
                    location: position,
                    position: position,
                    lng: lng,
                    lt: lt,
                    odo: odo,
                    totalMiles: st.totalMiles,
                    totalEngineHours: st.totalEngineHours,
                    message: message,
                    editAnnotation: st.editAnnotation ? st.editAnnotation : '',
                    restartFromStatusStart: restartFromStatusStart,
                    special: special,
                    specials: st.specials,
                    id: st.id,
                    dateTime: st.dateTime,
                    originalDateTime: st.originalDateTime,
                    documents: st.documents
                };

                // if (st.hasOwnProperty('time_transition')) {
                //     if (st.time_transition == 'WTS') {
                //         point.time_transition = 'WTS';
                //     } else if (st.time_transition == 'STW') {
                //         point.time_transition = 'STW';
                //     }
                // }

                points.push(point);
            }
        }

        //Clear last logbook lines
        $('#log_book').find('.g_line').remove();
        $('#log_book').find('.v_line').remove();
        var previousChanged = false;
        var previousStartH = false;
        var previousStartM = '';

        for (var x = 0; x < points.length; x++) {
            var point = points[x];
            point.time = point.time.slice(-8);
            point.hours = parseInt(point.time.slice(0, 2));
            point.mins = parseInt(point.time.slice(3, 5));
            point.seconds = parseInt(point.time.slice(6, 8));
            if (previousStartH == false) {
                previousStartH = point.hours;
                previousStartM = point.mins;
            } else {
                if (!self.isEld && previousStartH == point.hours && previousStartM == point.mins) {
                    points.splice(x - 1, 1);
                }
                previousStartH = point.hours;
                previousStartM = point.mins;
            }
        }

        for (var x = 0; x < points.length; x++) {
            var point = points[x];
            if (x == 0) {
                point.start = true;
            }
            point.time = point.time.slice(-8);
            point.hours = parseInt(point.time.slice(0, 2));
            point.mins = parseInt(point.time.slice(3, 5));

            if (self.isEld) {
                point.startP = parseInt(point.mins);
            } else {
                if (point.mins % 15 != 0) {
                    point.mins = point.mins - point.mins % 15;
                }
                point.startP = parseInt(point.mins) / 15;
            }

            var durations = point.duration.split(" ");
            durations[0] = durations[0].replace(/\D/g, '');
            durations[1] = durations[1].replace(/\D/g, '');
            point.durationH = durations[0] / 1;
            point.durationM = durations[1];
            point.durationS = typeof durations[2] != 'undefined' ? durations[2].replace(/\D/g, '') : '00';

            var hadChanged = false;

            if (previousChanged) {
                point.durationM = parseInt(point.durationM) + parseInt(15); //TODO: why?
                hadChanged = true;
            }
            if (!self.isEld && point.durationM % 15 != 0) {
                point.durationM = point.durationM - point.durationM % 15;
                previousChanged = true;
                if (hadChanged) {
                    previousChanged = false;
                }
            } else {
                previousChanged = false;
            }
            if (!self.isEld) {
                point.durationM = point.durationM / 15;
            }
            point = self.calculatePointCoordinates(point);
        }
        return points;
    }
    // !!! is it really offer for current day or this is ststus moved to the next day(technical)
    this.offersIsItReallyOffer = function () {
        var ret = false;
        if (self.offers_points.length > 2)
            ret = true;

        $(self.offers_points, function (x, v) {
            if (x === 0)
                return;
            if (v.pionts.time == '00:00:00') {

            }
        });
        return ret;
    }
    this.drawInfoEdits = function (info_edits) {
        var modal_message = '';
        var i = 0;
        $.each(info_edits, function (key, edit) {
            if (edit) {
                modal_message += self.drawInfoEditRow(key, edit);
                i++;
            }
        });
        edits_modal = {modal_title: 'Main Info Edits', modal_message: modal_message};
        if (i == 0) {
            $("#show_info_edits").remove();
            $('#basicModal').modal('hide');
        } else if (!$('.edit_info').is(':has(#show_info_edits)')) {
            var button_code = '<button id="show_info_edits" class="btn btn-default " onclick="showModal(edits_modal.modal_title, edits_modal.modal_message, \'basicModal\')">Pending Approvals</button>';

            $('#show_info_edits').remove();
            $('.log_buttons_block').append(button_code);

        }
    }

    this.addLogBookPoint = function (point) {
        var colr = '#3498db';
        var w = 31;
        var x1 = point.svgX1;
        var x2 = point.svgX2;
        var y = point.svgY;
        var special = point.svgSpecial;
        if (point.status == 'dr') {
            if (point.drive <= 0 || point.cycle <= 0 || point.shift <= 0 || point.eight <= 0 || point.shiftWork <= 0) {
                colr = '#ed5554';
                var errors = [];
                if (point.eight <= 0) {
                    errors.push(8);
                }
                if (point.shiftWork <= 0) {
                    errors.push('sh');
                }
                if (point.cycle <= 0) {
                    errors.push('c');
                }
                if (point.shift <= 0) {
                    errors.push(14);
                }
                if (point.drive <= 0) {
                    errors.push(11);
                }
                //TODO: need correct this logic
                /*if (point.hadCan24Break == 0) {
                    errors.push('c24');
                }*/
                if (errors.length > 1) {
                    self.drawViolTriangle(y, colr, 'v', x1, errors);
                } else {
                    self.drawViolTriangle(y, colr, errors[0], x1, errors);
                }
            }
        }

        self.drawLine(x1, x2, y, y, 'working_line', colr, special);

        if (point.status == 'dr') {
            colr = '#ed5554';
            var errors = [];
            //check if status length is more than drive
            var statsDur = point.durationH * 60 * 60 + point.durationM * (self.isEld ? 1 : 15) * 60;
            if (self.isEld && !self.isAobrd) {
                statsDur += parseInt(point.durationS);
            }
            if (point.eight > 0 && statsDur > point.eight) {
                errors = self.addError(w, x2, y, statsDur, point.eight, self.isEld, 8, errors); //var df = (statsDur - from.eight)/60;  // errors[df].push(8);
            }
            if (point.shift > 0 && statsDur > point.shift) {
                errors = self.addError(w, x2, y, statsDur, point.shift, self.isEld, 14, errors); //var df = (statsDur - from.shift)/60; //errors[df].push(14);
            }
            if (point.shiftWork > 0 && statsDur > point.shiftWork) {
                errors = self.addError(w, x2, y, statsDur, point.shiftWork, self.isEld, 'sh', errors); //var df = (statsDur - from.shiftWork)/60; //errors[df].push('s');
            }
            if (point.drive > 0 && statsDur > point.drive) {
                errors = self.addError(w, x2, y, statsDur, point.drive, self.isEld, 11, errors); //var df = (statsDur - from.drive)/60; //errors[df].push(11);
            }
            if (point.cycle > 0 && statsDur > point.cycle) {
                errors = self.addError(w, x2, y, statsDur, point.cycle, self.isEld, 'c', errors); //var df = (statsDur - from.cycle)/60; //errors[df].push('c');
            }

            for (var key in errors) {
                if (key === 'length' || !errors.hasOwnProperty(key))
                    continue;
                var errorAr = errors[key].st;
                var x1 = errors[key].x1;

                if (errorAr.length > 1) {
                    self.drawViolTriangle(y, colr, 'v', x1, errorAr);
                } else {
                    self.drawViolTriangle(y, colr, errorAr[0], x1, errorAr);
                }
            }
        }
    }

    this.drawLine = function (x1, x2, y1, y2, line_class, colr, special = '') {
        $(self.selectorSvg).append(self.svgEl('line'));
        $(self.selectorSvg).find("line").last()
            .attr("x1", x1)
            .attr("x2", x2)
            .attr("y1", y1)
            .attr("y2", y2)
            .attr("class", line_class)
            .attr("style", "stroke:" + colr + ";stroke-width:1.5;" + special);
    }

    this.drawViolTriangle = function (y, colr, violNum, x, errors) {
        y = 133;
        var x1 = x + 10;
        var x2 = x - 10;
        var y1 = y + 15;
        $(self.selectorSvg).append(self.svgEl('polygon'));
        $(self.selectorSvg).find("polygon").last()
            .attr("points", x + "," + y + "," + x1 + "," + y1 + "," + x2 + "," + y1)
            .attr("class", 'working_line violation_triangle')
            .attr("onmouseover", 'logbook.violationTriangleBox(this)')
            .attr("onmouseout", 'logbook.violationTriangleBoxClose()')
            .attr("style", "fill:" + colr + ";stroke-width:1");
        for (var s = 0; s < errors.length; s++) {
            var er = errors[s];
            $(self.selectorSvg).find("polygon").last().attr('data-' + er, er);
        }
        $(self.selectorSvg).append(self.svgEl('text'));
        if (violNum == 11 || violNum == 14) {
            x -= 2;
        }
        if (violNum == 11) {
            var numbers = self.getViolationsNumbersFromCycleId(driverCycle);
            violNum = numbers['driveHours'];
        }
        if (violNum == 14) {
            var numbers = self.getViolationsNumbersFromCycleId(driverCycle);
            violNum = numbers['shiftHours'];
        }
        if (violNum == 8) {
            violNum = 'b';
        } else if (violNum == 11) {
            violNum = 'dr';
        }
        if (violNum == 14) {
            violNum = 'sh';
        }
        $(self.selectorSvg).find("text").last().text(violNum)
            .attr("x", x - 3)
            .attr("y", y1 - 2)
            .attr("class", 'working_number violation_triangle').
        attr("style", "fill: white;font-size:10px;");
        for (var s = 0; s < errors.length; s++) {
            var er = errors[s];
            $(self.selectorSvg).find("text").last().attr('data-' + er, er);
        }
    }


    this.drawStatusIllumination = function (el) {
        if (!self.isEditMode) {
            var index = $(el).attr('data-index'),
                y0 = 0,
                y = 112,
                colr = 'rgba(90, 181, 41, 0.35)',
                x1,
                x2;
            if (typeof self.offerSegments[0] != 'undefined') {
                x1 = self.offerSegments[index].x1;
                x2 = self.offerSegments[index].x2;
            } else {
                x1 = self.segments[index].x1;
                x2 = self.segments[index].x2;
            }

            $(".statusArea, .area_tooltip, .area_time, .area_stroke_line").remove();
            $(self.selectorSvg).append(self.svgEl('polygon'));
            $(self.selectorSvg).find("polygon").last()
                .attr("points", x1 + "," + y0 + " " + x2 + "," + y0 + " " + x2 + "," + y + " " + x1 + "," + y)
                .attr("class", 'statusArea')
                .attr("id", "area_" + x1)
                .attr("style", "stroke:rgba(90, 181, 41, 1);fill:" + colr + ";");

            self.drawTooltip(x1 - 50, -30, 0, x1);
            self.drawTooltip(x2 + 50, -30, 1, x2);
            self.drawSlideButton(x1, y, 0);
            self.drawSlideButton(x2, y, 1);
            var line_color = 'rgba(90, 181, 41, 1)';
            self.drawLine(x1, x1, y0, y, 'area_stroke_line', line_color);
            self.drawLine(x2, x2, y0, y, 'area_stroke_line', line_color);
            self.drawDurationTooltip(x2 + 60, -30, x1, x2);

            $('#logBook .area_tooltip.drag.resize').remove();
            $(el).addClass('log_list_tr_active');
        }
    }
    this.drawStatusIlluminationOff = function () {
        if (!self.isEditMode) {
            $('#logBook .statusArea').remove();
            $('#logBook .area_tooltip').remove();
            $('#logBook .area_time').remove();
            $('#logBook .area_stroke_line').remove();
            $('#log_list tr.log_list_tr_active').removeClass('log_list_tr_active');
        }
    }

    this.convertTimeCoordToX = function (xTime) {
        var xTime_arr = xTime.split(':'),
            h = parseInt(xTime_arr[0]),
            m = parseInt(xTime_arr[1]),
            s = xTime_arr.length >= 2 ? parseInt(xTime_arr[2]) : 0,
            s_time = s + m * 60 + h * 60 * 60,
            x = s_time * self.svg_width / (24 * 60 * 60);
        x = self.toFixedFloat(x, 15);
        return x;
    }

    this.getViolationsNumbersFromCycleId = function (cycleId) {
        var numbers = {};
        if (cycleId == 0 || cycleId == 1) {
            numbers['shiftHours'] = 14;
            numbers['driveHours'] = 11;
        } else if (cycleId == 2 || cycleId == 3) {
            numbers['shiftHours'] = 20;
            numbers['driveHours'] = 15;
        } else if (cycleId == 4 || cycleId == 5) {
            numbers['shiftHours'] = 16;
            numbers['driveHours'] = 13;
        } else if (cycleId == 6) {
            numbers['shiftHours'] = 15;
            numbers['driveHours'] = 12;
        } else if (cycleId == 7) {
            numbers['shiftHours'] = 16;
            numbers['driveHours'] = 14;
        }
        return numbers;
    }

    this.toFixedFloat = function (num, am) {
        return parseFloat(parseFloat(num).toFixed(am));
    }

    this.drawTooltip = function (x1, y1, direction, timeX, color = 'rgba(90, 181, 41,1)') {
        var x2 = direction ? x1 - 50 : x1 + 14;
        var xT = direction ? x1 - 45 : x1 + 18;

        var colr = color;
        $(self.selectorSvg).append(self.svgEl('rect'));
        $(self.selectorSvg).find("rect").last()
            .attr('x', x2)
            .attr('y', y1 + 10 - (self.isSmartSafetySuperEdit ? 12 : 0))
            .attr('rx', 3)
            .attr('ry', 3)
            .attr('width', 36)
            .attr('height', 20)
            //                .attr("points", x1 + "," + y1 + " " + x2 + "," + y1 + " " + x2 + "," + yP + " " + xP + "," + y2 + " " + x1 + "," + y2 + " " + x1 + "," + y1)
            .attr("class", 'area_tooltip')
            .attr("id", "left_tooltip_" + x1)
            .attr("style", "stroke:#000;fill:" + colr + ";stroke-width:0");

        var timeString = self.convertXCoordToTime(timeX);
        $(self.selectorSvg).append(self.svgEl('text'));
        $(self.selectorSvg).find("text").last().text(timeString)
            .attr("x", xT)
            .attr("y", y1 + 24 - (self.isSmartSafetySuperEdit ? 11 : 0))
            .attr("class", 'area_time')
            .attr("style", "fill: #fff;font-size:11px;stroke-width:0");
    }
    this.drawDurationTooltip = function (x1, y1, timeX1, timeX2, isEditDriving = false) {
        if (isEditDriving) {
            if (x1 > 555) {
                x1 = x1 - 260;
                if (timeX2 - timeX1 < 220) {
                    x1 = timeX1 - 230;
                }
            }
        } else {
            if (x1 > 658) {
                x1 = x1 - 192;
                if (timeX2 - timeX1 < 141) {
                    x1 = timeX1 - 181;
                }
            }
        }
        var x2 = x1 + 122;
        var y2 = y1 + 25;
        var colr = 'rgba(90, 181, 41, 1)';
        $(self.selectorSvg).append(self.svgEl('rect'));
        $(self.selectorSvg).find("rect").last()
            .attr('x', x1 - 14)
            .attr('y', y1 + 5 - (self.isSmartSafetySuperEdit ? 12 : 0))
            .attr('rx', 3)
            .attr('ry', 3)
            .attr('width', isEditDriving ? 200 : 100)
            .attr('height', 30)
            //                .attr("points", x1 + "," + y1 + " " + x2 + "," + y1 + " " + x2 + "," + y2 + " " + x1 + "," + y2)
            .attr("class", 'area_tooltip')
            .attr("id", "duration_tooltip_" + x1)
            .attr("style", "fill:#fff;filter:url(#dropshadow);");

        var timeString = self.convertXCoordToTimeV2(timeX1, timeX2);
        if (timeString == '00:00' && timeX2 - timeX1 > 1)
            timeString = '24:00';
        $(self.selectorSvg).append(self.svgEl('text'));
        $(self.selectorSvg).find("text").last().text(isEditDriving ? 'Driving status cannot be overwritten' : 'DURATION: ' + timeString)
            .attr("x", x1 - 10)
            .attr("y", y1 + 24 - (self.isSmartSafetySuperEdit ? 11 : 0))
            .attr("class", 'area_time')
            .attr("style", `${isEditDriving ? 'fill:rgba(180, 87, 27, 1);font-weight:500;letter-spacing:-0.08px;' : `fill:${colr}`};font-family:Roboto;font-size:12px;`);

        /// E3-1355 :: Add speed in driving special edit
        if (typeof self.isSuperDrivingEdit !== 'undefined' && self.isSuperDrivingEdit && !self.new_mode) {
            let startStatusDateTime = moment(self.originStatuses[self.superEditStatusIndex]['originalDateTime']);
            let coord = self.x2 != 0 && self.x2 <= self.editedSegment.x2 && self.x2 >= self.editedSegment.x1 ? self.x2 : self.editedSegment.x2;
            let endStatusDateTime = moment(self.logbookDay + ' ' +  self.convertXCoordToTime(coord, true));
            let diffInHours = endStatusDateTime.diff(startStatusDateTime, 'hours', true);
            let diffInOdo = self.originStatuses[self.superEditStatusIndex + 1]['totalMiles'] - self.originStatuses[self.superEditStatusIndex]['totalMiles'];
            let speed = diffInHours != 0 ? Math.round((diffInOdo < 0 ? 0 : diffInOdo) / diffInHours) : 0;
            let isSpeedLimit = speed >= 70 ? true : false;

            let x11 = timeX1 - 145;
            if (timeX1 < 100) {
                x11 = timeX1 + 10;
                if (timeX2 - timeX1 < 141) {
                    x11 = self.isSpecialEditingError ? timeX2 + 265 : timeX2 + 165;
                }
            }
            if (timeX2 > 597) {
                x11 = x1 - 130;
            }

            $(self.selectorSvg).append(self.svgEl('rect'));
            $(self.selectorSvg).find("rect").last()
                .attr('x', x11)
                .attr('y', y1 - 7)
                .attr('rx', 3)
                .attr('ry', 3)
                .attr('width', 100)
                .attr('height', 30)
                .attr("class", 'area_tooltip')
                .attr("id", "speed_" + x1)
                .attr("style", "fill:#fff;filter:url(#dropshadow);");

            $(self.selectorSvg).append(self.svgEl('text'));
            $(self.selectorSvg).find("text").last().html('Speed: ' + speed + ' mph')
                .attr("x", x11 + 5)
                .attr("y", y1 + 13)
                .attr("class", 'area_time')
                .attr("style", `${isSpeedLimit ? 'fill:rgba(180, 87, 27, 1);font-weight:500;letter-spacing:-0.08px;' : `fill:${colr}`};font-family:Roboto;font-size:12px;`);
        }
    }
    this.drawDeleteBtn = function (timeX1, timeX2) {
        var x1 = timeX2 + 45,
            y1 = 119;
        if (x1 > 715) {
            x1 = x1 - 70;
            if (timeX2 - timeX1 < 74) {
                x1 = timeX1 - 45;
            }
        }
        // var x2 = x1 + 55;
        // var y2 = y1 + 21;
        var colr = '#3498db';
        $(self.selectorSvg).append(self.svgEl('circle'));
        $(self.selectorSvg).find("circle").last()
            .attr('cx', x1)
            .attr('cy', y1)
            .attr('r', 15)
            .attr("class", 'area_tooltip area_delete_status')
            .attr("onclick", 'logbook.deleteStatus()')
            .attr("style", ";fill:" + colr + ";");

        var img = self.svgEl('image');

        img.setAttributeNS(null, 'width', '20px');
        img.setAttributeNS(null, 'height', '20px');

        img.setAttributeNS('http://www.w3.org/1999/xlink', 'href', '/dash/assets/img/icons_safety/ic-delete.png');

        img.setAttributeNS(null,'x',x1 - 10);
        img.setAttributeNS(null,'y',y1 - 10);
        img.setAttributeNS(null, 'visibility', 'visible');

        $(self.selectorSvg).append(img);
        $(self.selectorSvg).find("image").last()
            .attr('style', 'cursor:pointer')
            .attr("class", 'area_time')
            .attr("onclick", 'logbook.deleteStatus()');
    }
    this.drawSlideButton = function (x1, y1, direction, color = '#5ab529') {
        var x2 = direction ? x1 + 12 : x1 - 12;
        var xP = direction ? x1 + 20 : x1 - 20;
        var y2 = y1 + 15;
        var yP = y1 + 7;
        var disabled = 0;

        if ((
            (x1 == 0 && direction == 0) || //first status left bar
            (x1 == 744 && direction == 1) || //last status right bar
            (self.todayX15Min !== false && x1 == self.todayX15Min && direction == 1) || //todays last status right exempt
            ($.type(self.todaysDate) == 'date' && direction == 1 && Math.round(x1) == Math.round(self.convertTimeCoordToX(convertDateToSQL(self.todaysDate, true).substring(11)))) || //todays last status right not exempt
            (self.isEditMode && self.isEld && !self.isAobrd && !self.isSuperDrivingEdit && //on edit eld
                (
                    (
                        self.editedSegment.from.status == 'dr'
                        // && self.editedSegment.from.special == 1
                    ) || //edit driving from device
                    (
                        direction == 1
                        && self.editedSegmentIndex != self.segments.length - 1
                        && self.segments[self.editedSegmentIndex + 1].from.status == 'dr'
                        // && self.segments[self.editedSegmentIndex + 1].from.special == 1
                    ) || //driving from device to the right
                    (
                        direction == 0
                        && self.editedSegmentIndex != 0
                        && self.segments[self.editedSegmentIndex - 1].from.status == 'dr'
                        // && self.segments[self.editedSegmentIndex - 1].from.special == 1
                    ) //driving from device to the left
                )
            ) //driving from device to the right
        ) && !self.new_mode) {
            colr = '#a5a5a5';
            disabled = 1;
        } else {
            colr = color;
        }

        if (self.isSuperDrivingEdit && direction == 0 && !self.new_mode) {
            disabled = 1;
            colr = '#a5a5a5';
        }
        $(self.selectorSvg).append(self.svgEl('polygon'));
        $(self.selectorSvg).find("polygon").last()
            .attr("points", x1 + "," + y1 + " " + x2 + "," + y1 + " " + xP + "," + yP + " " + x2 + "," + y2 + " " + x1 + "," + y2 + " " + x1 + "," + y1)
            .attr("class", 'area_tooltip drag resize')
            .attr("dir", direction)
            .attr("data-disabled", disabled)
            .attr("onmousedown", 'logbook.graphDragMousedown(this)')
            .attr("ontouchstart", 'logbook.graphDragMousedown(this)')
            .attr("style", "stroke:green;fill:" + colr + ";stroke-width:0");
    }
    this.convertXCoordToTime = function (x, sec, usa_format = false) {
        var time = '';

        // if (self.date_time_transition) {
        //     if (self.time_transition == 'WTS') {
        //         if (x >= 62 && x < 93) {
        //             x = x + (93 - x);
        //         }
        //     } else if (self.time_transition == 'STW') {

        //     }
        // }

        var s = 24 * 60 * 60 * x / self.svg_width,
            date = self.newDate(s * 1000),
            hh = date.getUTCHours(),
            mm = date.getUTCMinutes(),
            ss = date.getSeconds();

        if (hh < 10) {
            hh = "0" + hh;
        }
        if (mm < 10) {
            mm = "0" + mm;
        }
        if (ss < 10) {
            ss = "0" + ss;
        }

        var time = hh + ":" + mm + (sec ? ":" + ss : "");
        if (usa_format)
            time = convertOnlyTimeFromSqlToUsa(time, false);
        return time;
    }
    this.convertXCoordToTimeV2 = function (x1, x2, sec = false) {
        var time = '';
        var rez = 24 * 60 * 60 * (x2 - x1);

        // if (self.date_time_transition) {
        //    if (self.time_transition == 'WTS') {
        //        if (x1 >= 62 && x1 <= 93 && x2 >= 62 && x2 <= 93) {
        //            rez = self.svg_width;
        //        }
        //        if (x1 < 62 && x2 >= 62 && x2 <= 93) {
        //            x2 = 62;
        //            rez = 24 * 60 * 60 * (x2 - x1);
        //        }
        //        if (x1 < 62 && x2 > 93) {
        //            rez = 24 * 60 * 60 * (x2 - x1 - 31);
        //        }
        //        if (x1 >= 62 && x1 <= 93 && x2 > 93) {
        //            x1 = 93;
        //            rez = 24 * 60 * 60 * (x2 - x1);
        //        }
        //    } else if (self.time_transition == 'STW') {

        //    }
        // }

        var s = rez / self.svg_width,
            date = self.newDate(s * 1000),
            hh = date.getUTCHours(),
            mm = date.getUTCMinutes(),
            ss = date.getSeconds();

        if (hh < 10) {
            hh = "0" + hh;
        }
        if (mm < 10) {
            mm = "0" + mm;
        }
        if (ss < 10) {
            ss = "0" + ss;
        }

        var time = hh + ":" + mm + (sec ? ":" + ss : "");
        return time;
    }
    this.calculatePointCoordinates = function (point) {
        var row = 0;
        var special = '';
        var x1 = 0;
        var x2 = 0;
        var y = 0;

        var h = 14;

        if (point.status == 'on') {
            h = 13.9;

            row = 3;
            special = point.special == 1 ? 'stroke-dasharray: 2, 2;' : '';
        } else if (point.status == 'off') {
            row = 0;
            special = point.special == 1 ? 'stroke-dasharray: 2, 2;' : '';
        } else if (point.status == 'sb') {
            row = 1;
        } else if (point.status == 'dr') {
            h = 13.8;

            row = 2;
        }

        var w = 31;
        // var h = 14;
        var lengthH = point.durationH;
        var lengthM = point.durationM;
        var lengthS = parseInt(point.durationS);
        var startH = point.hours;
        var startP = point.startP;
        var startS = parseInt(point.seconds);

        var endH = parseFloat(lengthH) + parseFloat(startH);
        var endP = parseFloat(lengthM) + parseFloat(startP);
        var endS = parseFloat(lengthS) + parseFloat(startS);

        if (self.isEld) {
            x1 = self.toFixedFloat((startH + startP / 60 + startS / 3600) * w, 5);
            x2 = self.toFixedFloat((endH + endP / 60 + endS / 3600) * w, 5);
        } else {
            x1 = self.toFixedFloat((startH + startP / 4) * w, 5);
            x2 = self.toFixedFloat(x1 + (lengthH + lengthM / 4) * w, 5);
        }

        y = h + row * 2 * h;
        point.svgX1 = x1;
        point.svgX2 = x2;
        point.svgY = y;
        point.svgSpecial = special;

        return point;
    }

    this.correctionAndAnnotation = function (historyView = false) {
        if ((curUserIsEzlogzEmployee() && (!self.userIsSmartSafety || self.isSmartSafetySuperEdit)) || 
            (curUserIsSmartSafety(self.userId) && self.isSmartSafetySuperEdit && !$('#log_info').hasClass('edit_active'))) {
            self.isSuperDrivingEdit = true;
            $('#manager_user_card .modal-content, #log_box, .logbookDiv').addClass('superEdit');
            Object.keys(self.editedSegment).length == 0 ? $('#save_info').addClass('disabled-btn') : $('#save_info').removeClass('disabled-btn');
            if (self.weighStationsStatuses.length > 0) {
                let content = '';
                $.each(self.weighStationsStatuses, function (key, status) {
                    var stX = self.convertTimeCoordToX(status.dateTime.substring(11));
                    var wsStatus = status.status == 0 ? 'Closed' : 'Open';
                    var stTypeText = 'Passing <b>' + wsStatus + '</b> Weigh Station "' + status.title + '"';
                    var time = self.convertXCoordToTime(stX, (self.isAobrd ? false : true), true);
                    content += `<tr>
                        <td>${time}</td>
                        <td>${stTypeText}</td>
                    </tr>`;
                });

                $('#spesialWeighStationsStatuses').remove();
                $('#log_list').after(`
                    <div id="spesialWeighStationsStatuses">
                        <table class="table table-striped table-dashboard table-hover table-sm mobile_table">
                            <thead>
                                <tr>
                                    <th>Time</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${content}
                            </tbody>
                        </table>
                    </div>
                `)
            }
        } else {
            self.isSuperDrivingEdit = false;
            $('#spesialWeighStationsStatuses').remove();
            $('#manager_user_card .modal-content, #log_box, .logbookDiv').removeClass('superEdit superInsert');
        }

        if (!$('.status_edit_button').hasClass('edit_active') && !curUserIsEzlogzEmployee() && !self.isSuperDrivingEdit) {
            revertAttentionPopup();
        }
        logbookSignatureCl.initSignatureDraw('draw-signature');
        if (!historyView && self.cantEdit) {
            var message = '<div class="cantEditText">Driver option to edit logbook currently turned on, turn it off to be able to edit driver logbook</div>';
            showModal('Cannot Edit', message, 'basicModal', '', {footerButtons: `<button class="btn btn-default cantEdit" onclick="logbook.turnOffDriverEditMode(${self.userId})">Turn Off Driver Edit</button>`});
            return false;
        }
        $('.edit_parameter').remove();
        $('#insertStatusCoord').remove();
        if ($('#log_info').hasClass('edit_active')) {
            $('.modal-content').removeClass('superEdit');
            $('#log_info').removeClass('edit_active');
            if (curUserIsEzlogzEmployee() && !self.userIsSmartSafety) {
                $('#edit_main_info').hide();
            }
            $('#edit_main_info').removeClass('edit_active').text('EDIT');
            $('#log_info').find('.logbook_parameter').show();
            $('#save_info').attr('disabled', false).hide();
            self.leaveEditMode();

            self.segments = self.originalSegments;
            self.editedSegment = {};
            self.isSmartSafetySuperEdit = false;
            self.isErrorEditDriving = false;
            self.segmentsToList();
            if ($('.draw-signature-block').is(':visible')) {
                logbookSignatureCl.createSignature();
            }
            return false;
        } else {
            self.enterEditMode();
            $('#log_info').addClass('edit_active');
            $('#edit_main_info').addClass('edit_active').text('Cancel');
            $('#save_info, #edit_main_info, .lb_save_button').attr('disabled', true).show();
        }

        if (window.location.pathname == '/dash/drivers/') {
            var driverId = $('tr.driver_row.active').attr('data-id');
        } else {
            var driverId = $('#select_carrier option:selected').attr('data-driverid');
        }
        AjaxController('getInfoToAttachDocs', {userId: driverId, bol: 1}, apiLogbookUrl, 'drawEditFieldsSuccess', self.drawEditFieldsHandler, true);
    }
    this.drawEditFieldsHandler = function (response) {
        self.user_info = response.data;
        self.timeZones = response.data.timeZones;
        var states = locationState.getStates();
        self.user_info['vehicle'] = self.user_info['trucks'];
        self.edit_parameters.tz = self.driverTimeZone;
        $.each(self.edit_parameters, function (index, field) {
            $('.log_' + index).parents('.field').attr('id', 'field_' + index);
            $('#field_' + index).find('.logbook_parameter').hide();
            if (!$('#field_' + index).is(':has(.edit_parameter)')) {
                $('.log_' + index).after('<div class="col-xs-8 edit_parameter "></div>');
            }
            var edit_parameter = '';

            //driver
            if (index == 'driver') {
                edit_parameter += createProfilePopupButton(self.userId, field[0] + ' ' + field[1]);
                //distance
            } else if (index == 'tz') {
                edit_parameter += '<select id="' + index + '_list">';
                $.each(self.timeZones, function (key, timeZone) {
                    edit_parameter += '<option type="text" value="' + timeZone.id + '" ' + (self.timeZoneShort == timeZone.short || self.timeZoneShort == timeZone.shortSave ? 'selected="selected"' : '') + '>' + timeZone.name + '</option>';
                });
                edit_parameter += '</select>';

            } else if (index == 'distance' && !self.iftaDistances) {
                edit_parameter += '<input type="text" id="' + index + '" placeholder="0 ' + self.distanceLabel + '" value="' + (typeof field !== 'undefined' && field !== null ? self.getDistanceMlKm(field) : '') + '" oninput="logbook.distanceInputDot(this)" />';
                //var distance = typeof field !== 'undefined' && field !== null ? field : '';
            } else if (index == 'distances' && self.iftaDistances) {
                edit_parameter += '<ul id="' + index + '_list" new="0">';
                if (typeof field !== 'undefined' && field != null) {
                    var field_arr = field;
                    self.edit_lists[index.toString()] = JSON.parse(JSON.stringify(field));
                    var distance = 0;
                    if (field_arr.length > 0) {
                        $.each(field_arr, function (key, field_val) {
                            distance += field_val.distance;
                            var field_name = field_val.state_name + ' ' + self.getDistanceMlKm(field_val.distance) + ' ' + self.distanceLabel;
                            edit_parameter += '<li id="item_' + field_val.id + '" \n\
                                s-id="' + field_val.id + '" \n\
                                s-type="' + index + '" \n\
                                s-state="' + field_val.state + '" \n\
                                s-distance="' + field_val.distance + '" \n\
                                s-truck="' + field_val.truck + '" class="distance_info" onclick="logbook.distanceEdit(this)" >';
                            edit_parameter += '<span class="field_text" style="width: 100%" >' + field_name + '</span>';
                            edit_parameter += '<span class="removeEq" eq-id="' + field_val.id + '" eq-type="' + index + '" onclick="logbook.distanceRemove(this)"></span>';
                            edit_parameter += '</li>';
                        });
                    }
                }
                edit_parameter += '</ul>';
                var button_text = 'Add distance';
                edit_parameter += '<label for="distance" class="distance_label">Total: </label><span id="distance_total"></span>';
                edit_parameter += '<button id="add_' + index + '" class="edit_main_info_btn" onclick="logbook.distanceAdd()">' + button_text + '</button>';
                index = 'distance';

                //vehicle, trailers, docs
            } else if (index == 'vehicle' || index == 'trailers' || index == 'docs') {
                edit_parameter += '<ul id="' + index + '_list">';
                var span_size = 0;
                if (typeof field !== 'undefined' && field != null) {
                    var field_arr = field;
                    var field_name;
                    self.edit_lists[index.toString()] = JSON.parse(JSON.stringify(field));
                    if (field_arr.length > 0) {
                        $.each(field_arr, function (key, field_val) {
                            field_name = '';
                            if (index == 'docs') {
                                if (typeof field_val.reference != 'undefined' && field_val.reference)
                                    field_name = field_val.reference;
                                else if (field_val.date)
                                    field_name = (field_val.type == 6 ? 'BOL' : '') + ' ' + timeFromSQLDateTimeStringToUSAString(field_val.date.substring(0, 10));
                            }
                            if (!field_name)
                                field_name = field_val.name || field_val.Name;
                            if (field_name == undefined) {
                                field_name = '';
                            }

                            edit_parameter += '<li id="item_' + field_val.id + '"><span class="field_text">' + field_name + '</span>';
                            edit_parameter += '<span class="removeEq" eq-id="' + field_val.id + '" eq-type="' + index + '" onclick="logbook.equipmentRemove(this)"></span>';
                            edit_parameter += '</li>';
                        });
                    }
                    span_size = field_arr.length % 3;
                }
                var modal_title = index == 'vehicle' ? 'Add truck' : 'Add ' + index,
                    button_text = modal_title;

                edit_parameter += '</ul>';
                edit_parameter += '<button id="add_' + index + '" class="edit_main_info_btn span' + span_size + '" onclick="logbook.showFieldModal(\'' + index + '\')">' + button_text + '</button>';


                //mainOffice, homeTerminal
            } else if (index == 'mainOffice' || index == 'homeTerminal') {
                if (typeof field === 'undefined' || field == null) {
                    field = {state: "0", address: "", zip: "", city: ""};
                }
                edit_parameter += '<input type="text" id="' + index + '_address" placeholder="Enter Address" value="' + (typeof field.address !== 'undefined' ? field.address : '') + '"/>';
                edit_parameter += '<input type="text" id="' + index + '_city" placeholder="Enter City" value="' + (typeof field.city !== 'undefined' ? field.city : '') + '"/>';
                edit_parameter += '<input type="text" id="' + index + '_zip" placeholder="Enter Zip" value="' + (typeof field.zip !== 'undefined' ? field.zip : '') + '" maxlength="10"/>';
                if (states.length > 0) {
                    edit_parameter += '<select id="' + index + '_state">';
                    edit_parameter += '<option type="text" value="0">Select State</option>';
                    $.each(states, function (key, state) {
                        edit_parameter += '<option type="text" value="' + state.id + '" ' + (field.state == state.id ? 'selected="selected"' : '') + '>' + state.name + '</option>';
                    });
                    edit_parameter += '</select>';
                }
            } else if (index == 'signature') {
                var createSignatureButton = '';
                if ((self.isEld == 1 && self.isAobrd == 1) || self.isEld == 0 || self.terminated) {
                    createSignatureButton = '<button class="btn btn-default create-signature blockForDispatcher" onclick="logbookSignatureCl.createSignature();"><i class="fa fa-plus"></i></button><input type="hidden" id="signature" value="0" hidden>';
                }
                edit_parameter += '<b style="color:red;">No Signature</b>' + createSignatureButton;
            } else if (index == 'coDriversIds') {
                edit_parameter += '<ul id="' + index + '_list">';
                var span_size = 0;
                if (typeof field !== 'undefined' && field != null && field != '') {
                    self.edit_lists[index.toString()] = JSON.parse(JSON.stringify(field));
                    $.each(field, function (key, val) {
                        edit_parameter += '<li id="item_' + val.id + '" data-id="' + val.id + '"><span class="field_text">' + val.name + '</span><span class="removeEq" co-driver-id="' + val.id + '" onclick="logbook.removeCoDriver(this);"></span></li>';
                    });
                } else {
                    self.edit_lists[index.toString()] = [];
                }
                edit_parameter += '</ul>';
                var button_text = 'Add Co Driver';
                edit_parameter += '<button id="add_' + index + '" class="edit_main_info_btn span' + span_size + '" onclick="logbook.showAddCoDriverElement();">' + button_text + '</button>';
                $('#field_coDrivers').find('.edit_parameter #coDrivers').replaceWith(edit_parameter);
            } else {
                var placeholder = index.charAt(0).toUpperCase() + index.substr(1).toLowerCase();
                switch (index) {
                    case 'carrierName':
                        placeholder = 'Carrier';
                        break;
                    case 'coDrivers':
                        placeholder = 'Co-drivers name';
                        break;
                }
                edit_parameter += '<input type="text" id="' + index + '" placeholder="' + placeholder + '" value="' + (typeof field !== 'undefined' && field !== null ? field : '') + '"/>';
            }

            $('#field_' + index).find('.edit_parameter').html(edit_parameter);
        });
        if (self.iftaDistances)
            self.distanceCalculate();

        $('#save_info, #edit_main_info, .lb_save_button').attr('disabled', false);
    }
    this.showAddCoDriverElement = function () {
        if ($('#coDriversIds_list .edit_co_driver').length > 0) {
            return true;
        }
        var edit_parameter = '<div class="edit_distance edit_co_driver"><div><select class="js-example-basic-single" id="new_co_driver" style="width:100%;">';
        edit_parameter += '<option type="text" value="0">Select Co Driver</option>';
        $.each(fleetC.fleetUsers, function (key, val) {
            if ((val.companyPosition == 3 || val.companyPosition == 7) && val.id != self.userId) {
                edit_parameter += '<option type="text" value="' + val.id + '">' + val.name + ' ' + val.last + '</option>';
            }
        });
        edit_parameter += '</select></div>';
        edit_parameter += '<button id="save_new_co_driver" class="btn btn-default" onclick="logbook.addNewCoDriver();">Add</button><button id="cancel_new_co_driver" class="btn btn-default blue-border" onclick="logbook.hideAddCoDriverElement();">Cancel</button></div>';
        $('#coDriversIds_list').append(edit_parameter);
        $.each($('#coDriversIds_list li'), function (key, val) {
            var el = $(val);
            $('#new_co_driver option[value="' + el.attr('data-id') + '"]').remove();
        });
        $('#new_co_driver').select2();
    }
    this.addNewCoDriver = function () {
        var userId = $('#new_co_driver').val();
        if (userId == 0) {
            $('#select2-new_co_driver-container').addClass('error');
            return true;
        }
        var userFullName = $('#select2-new_co_driver-container').text();
        self.edit_lists['coDriversIds'].push({id: userId, name: userFullName});
        var edit_parameter = '<li id="item_' + userId + '" data-id="' + userId + '"><span class="field_text">' + userFullName + '</span><span class="removeEq" co-driver-id="' + userId + '" onclick="logbook.removeCoDriver(this);"></span></li>';
        $('#coDriversIds_list').append(edit_parameter);
        $('#coDriversIds_list .edit_co_driver').remove();
    }
    this.hideAddCoDriverElement = function () {
        $('#coDriversIds_list .edit_co_driver').remove();
    }
    this.removeCoDriver = function (el) {
        var id = $(el).attr('co-driver-id');
        $.each(self.edit_lists['coDriversIds'], function (key, val) {
            if (val.id == id) {
                self.edit_lists['coDriversIds'].splice(key, 1);
            }
        });
        $('#coDriversIds_list #item_' + id).remove();
    }
    this.pendingOfferView = function (i) {
        // wait for load original Logbook
        if ($('#orig_lable').length) {
            self.showOriginalLogbook();
            window.setTimeout(function () {
                self.pendingOfferViewFn(i);
            }, 800);
        } else
            self.pendingOfferViewFn(i);
    }
    this.pendingOfferViewFn = function (i) {

        $('#pending_approvals_modal').modal('hide');
        $('#pending_approvals_modal').find('.offer').removeClass('active');
        if (i > 0)
            self.leaveEditMode();
        $('#log_book').addClass('offer_active');
        $(self.selectorSvg).find(".working_line, .working_number").remove();
        var offer_title = $('#offer_title_' + i).text();
        if (i != 0) {
            var lft = ($('#log_book #edit_button').length && $('#log_book #edit_button').is(':visible') ? ($('#log_book #edit_button').position().left + $('#log_book #edit_button').width() + 40) : 0);
            if ($('#log_book #pending_approvals_button').length && !lft)
                lft = lft + $('#log_book #pending_approvals_button').position().left + $('#log_book #pending_approvals_button').width() + 40;
            lft = parseInt(lft).toString() + 'px';

            $('#log_book').append('<div class="offer_title" style="left: ' + lft + '; margin-left: 10px; right: auto;">' + offer_title + '</div>');
            $('#log_book').append('<button id="return_original" onclick="logbook.pendingViewReturn()" class="btn btn-default return_original">Return</button>');
            $('.origin_button').hide();
            $('#offer_' + i).addClass('active');
        }
        self.offerSegments = self.drawLogbookFromPoints(self.offers_points[i].points);
        if (i == 0) {
            self.offerSegments = [];
            self.segmentsToList();
        } else
            self.segmentsToList(self.offerSegments);
    }
    this.returnFromEditReview = function () {
        $('#orig_lable').show();
        $('#log_info').addClass('edit_active');
        $('#edit_main_info').addClass('edit_active');
        self.leaveEditMode(true);
    }
    this.editEventView = function (el) {
        $('#orig_lable').hide();
        $('#log_list th:nth-child(7), #log_list th:nth-child(8), #log_list th:nth-child(9)').hide();
        var eventTime = $(el).closest('tr').attr('data-time');
        self.leaveEditMode();
        $(el).closest('tr').addClass('active');
        $('#log_book').addClass('offer_active');
        $(self.selectorSvg).find(".working_line, .working_number").remove();
        var offer_title = "Logbook state from " + moment(eventTime, 'YYYY-MM-DD hh:mm:ss').format('MM-DD-YYYY hh:mm:ss A');
        if (eventTime == 'original') {
            offer_title = "Logbook Original state";
        }
        var lft = ($('#log_book #edit_button').length && $('#log_book #edit_button').is(':visible') ? ($('#log_book #edit_button').position().left + $('#log_book #edit_button').width() + 40) : 0);
        if ($('#log_book #pending_approvals_button').length && !lft)
            lft = lft + $('#log_book #pending_approvals_button').position().left + $('#log_book #pending_approvals_button').width() + 40;
        lft = parseInt(lft).toString() + 'px';

        $('#log_book').append('<div class="offer_title" style="left: ' + lft + '; margin-left: 10px; right: auto;">' + offer_title + '</div>');
        $('#log_book').append('<button id="return_original" onclick="logbook.pendingViewReturn();logbook.returnFromEditReview()" style="right: 12px;" class="btn btn-default return_original">Return</button>');
        $('.origin_button').hide();


        var editSegmentsState = JSON.parse(JSON.stringify(self.originalEvents));
        if (eventTime != 'original') {
            $.each(self.editEvents, function (time, editEventStatuses) {
                if (moment(editEventStatuses[0].dateTime.substr(0, 10), 'YYYY-MM-DD').diff(moment(logbook.todayDateString, 'YYYY-MM-DD')) < 0) {
                    var idToRemove = editSegmentsState[0].id;
                    editSegmentsState = jQuery.grep(editSegmentsState, function (a) {
                        return a.id != idToRemove;
                    });
                }
                $.each(editEventStatuses, function (key, editStatus) {
                    if (editStatus.event_type == 2) {//delete status
                        editSegmentsState = jQuery.grep(editSegmentsState, function (a) {
                            return a.id != editStatus.id;
                        });
                    } else {//edit or insert
                        editSegmentsState = jQuery.grep(editSegmentsState, function (a) {
                            return a.dateTime != editStatus.dateTime && a.id != editStatus.id;
                        });
                        editSegmentsState.push(editStatus);
                    }
                });
                if (time == eventTime) {
                    return false;
                }
            });
        }
        editSegmentsState = self.calculatePoints(self.logbookDaySQL, self.caller, editSegmentsState, 0);
        self.offerSegments = self.drawLogbookFromPoints(editSegmentsState);
        self.segments = JSON.parse(JSON.stringify(self.offerSegments));
        $.each(self.segments, function (key, segment) {//use all as new
            self.segments[key].from.id = self.nextNewId;
            var initiatingTime = 'original';
            if (eventTime != 'original') {
                initiatingTime = moment(eventTime, 'YYYY-MM-DD hh:mm:ss').format('MM-DD-YYYY hh:mm:ss A');
            }

            self.segments[key].from.editAnnotation = 'Revert logbook state from ' + initiatingTime;
            self.nextNewId--;
        });
        self.segmentsToList(self.offerSegments);
        $('#log_list td:nth-child(7), #log_list td:nth-child(8), #log_list td:nth-child(9)').hide();
    }

    this.pendingViewReturn = function () {
        $('#log_list th:nth-child(7), #log_list th:nth-child(8), #log_list th:nth-child(9), #log_list td:nth-child(7), #log_list td:nth-child(8), #log_list td:nth-child(9)').show();
        self.pendingOfferView(0);
        $('#return_original, #log_book .offer_title').remove();
        $('.origin_button').show();
        $('.offer-header').find('button[aria-expanded="true"]').click();
        $('#log_book').removeClass('offer_active');
        $('#log_status_info').removeAttr('data-id');
        $('#closeMap').click();
        $('#annotation_select').val($("#annotation_select option:first").val()).change();
    }

    this.enterEditMode = function (historyView = false) {
        if (!historyView && self.cantEdit) {
            var message = '<div class="cantEditText">Driver option to edit logbook currently turned on, turn it off to be able to edit driver logbook</div>';
            showModal('Cannot Edit', message, 'basicModal', '', {footerButtons: `<button class="btn btn-default cantEdit" onclick="logbook.turnOffDriverEditMode(${self.originStatuses[0].userId})">Turn Off Driver Edit</button>`});
            return false;
        }
        $('#aobrdAbleToEditQuick').hide();
        self.isEditMode = true;
        if (!logbook.prevDayDeffered)
            $('#defferOff button').prop('disabled', false);
        // for: enter edit mode, then leave, then enter
        self.segments = JSON.parse(JSON.stringify(self.originalSegments));
        self.forMoveSegment = JSON.parse(JSON.stringify(self.segments));
        self.forMoveDirection = 1;
        self.forMoveEditedSegmentIndex = 0;

        self.pendingViewReturn();
        $('#edit_button').html('Cancel<span class="hide_mobile"> Edit</span>');
        $('#edit_button').attr('onclick', 'logbook.correctionAndAnnotation()');
        $('.on_edit').show();
        var lft = ($('#edit_button').length && $('#edit_button').is(':visible') ? ($('#edit_button').position().left + $('#edit_button').width() + 40) : 0);
        if ($('#pending_approvals_button').length && !lft)
            lft = lft + $('#pending_approvals_button').position().left + $('#pending_approvals_button').width() + 40;
        if (!self.cantEditLogbook) {
            $('#log_book').prepend('<button id="add_button" onclick="logbook.addStatus()" class="add_status btn btn-default status_edit_button" style="left:' + (lft) + 'px; ">Insert<span class="hide_mobile"> Duty</span> Status</button>');
        }

        self.checkOriginButton();
        $('#log_list, #log_book').addClass('edit_active_box');
        $('tr.editing').removeClass('editing');
    }
    this.leaveEditMode = function (historyView = false) {
        self.cancelEdit();
        $('#defferOff button').prop('disabled', true);
        $('#aobrdAbleToEditQuick').show();
        $('#edit_button').text('EDIT');
        $('#edit_button').attr('onclick', 'logbook.correctionAndAnnotation()');
        $('#add_button, .lb_save_button, #return_original').remove();
        $('#logbookEventsHistory table tbody tr').removeClass('active');
        $('#sendLogLocation.active').click();
        //statusArea.originalSegments = JSON.parse(JSON.stringify(statusArea.veryOriginalSegments))
        //statusArea.segments = JSON.parse(JSON.stringify(statusArea.veryOriginalSegments))
        self.isEditMode = false;
        $('.on_edit').hide();
        self.new_mode = false;
        if ($('#edit_main_info').hasClass('edit_active')) {
            self.correctionAndAnnotation(historyView);
        }
        $('#log_list, #log_book').removeClass('edit_active_box');
    }
    this.cancelEdit = function () {
        $('.offer_title').remove();
        $('.add_status').attr('disabled', false);
        $('#edit_buttons').remove();
        $(".statusArea, .area_tooltip, .area_time, .area_stroke_line, .working_line.second").remove();
        $('#log_control').hide();
        if (self.offersPointsCount(self.offers_points) < 2) {
            $('#pending_approvals_modal').modal('hide');
            $('#pending_approvals_button').remove();
            $('#edit_button').css('left', '0px');
        }
    }

    this.graphInitEdit = function (index) {
        $('#edit_buttons').remove();
        $('#log_status_info').append('<div id="edit_buttons"><button onclick="revertAttentionPopup(true)" class="btn btn-default">Save</button></div>');
        if (window.location.pathname == '/dash/history/log/' || window.location.pathname == '/dash/views/dispatcher/log/') {
            $('#edit_buttons').hide();
        }

        self.editedSegmentIndex = parseInt(index);
        self.forMoveSegment = self.segments;
        self.editedSegment = self.segments[self.editedSegmentIndex];
        self.graphDrawEditArea(self.editedSegment.x1, self.editedSegment.x2);
    }
    this.graphDrawEditArea = function (x1, x2, isEditDR = false) {
        var y0 = 0;
        var y = 112;
        var colr = 'rgba(90, 181, 41, 0.35)';
        let color = 'rgba(90, 181, 41, 1)';
        let errorEditDR = false;
        let isDeleteBtn = true;
        $(".statusArea, .area_tooltip, .area_time, .area_stroke_line").remove();

        if (isEditDR && !self.isSuperDrivingEdit) {
            let errorSegment= [];
            let statusBtns = $('#log_st_buttons');
            let statusTimeFrom = $('#time_from');
            let statusTimeTo = $('#time_to');

            (self.forDeleteSegments).map(segment => {
                if (segment.status == 'dr' && segment.from.special == 1) {
                    let item = {};
    
                    if (segment.x1 < x1 && segment.x2 > x1 || segment.x1 < x2 && segment.x2 > x2) {
                        if (segment.x1 < x2 && segment.x2 > x2) {
                            item.x1 = segment.x1 < x1 && segment.x2 > x1 ? x1 : segment.x1;
                            item.x2 = x2;
                        } else {
                            item.x1 = x1;
                            item.x2 = segment.x1 < x2 && segment.x2 > x2 ? x2 : segment.x2;
                        }
                    } else if (segment.x1 >= x1 && segment.x2 <= x2) {
                        item.x1 = segment.x1;
                        item.x2 = segment.x2;
                    }
    
                    if (Object.keys(item).length != 0) {
                        item.y1 = segment.y;
                        item.y2 = self.editedSegment.y;
                        errorSegment.push(item); 
                    }   
                }
            })
    
            if (errorSegment.length != 0) {
                $('.log_buttons_block #save_info').addClass('disabled-btn').prop("disabled", true);
                $('.add_status#add_button').addClass('disabled-btn').prop("disabled", true);
                statusBtns.addClass('disabled-btn');
                statusTimeFrom.addClass('disabled-btn');
                statusTimeTo.addClass('disabled-btn');
                isDeleteBtn = false;
    
                errorSegment.forEach((el, index) => {
                    $(self.selectorSvg).append(self.svgEl('polygon'));
        
                    $(self.selectorSvg).find("polygon").last()
                        .attr("points", `${el.x1},${el.y1} ${el.x2},${el.y1} ${el.x2},${el.y2} ${el.x1},${el.y2}`)
                        .attr("class", 'statusArea')
                        .attr("id", "area_" + el.x1 + '_' + index)
                        .attr("style", "stroke: red;fill: rgba(255, 0, 0, 0.65);");
                });

                if (!self.isErrorEditDriving && self.editedSegment.status != 'dr') {
                    self.isErrorEditDriving = true;
                }
                errorEditDR = true;
                color = 'rgba(228,146,114, 1)';
            } else {
                errorEditDR = false;
                $('.log_buttons_block #save_info').removeClass('disabled-btn').prop("disabled", false);
                $('.add_status#add_button').removeClass('disabled-btn').prop("disabled", false);
                statusBtns.removeClass('disabled-btn');
                statusTimeFrom.removeClass('disabled-btn');
                statusTimeTo.removeClass('disabled-btn');
                isDeleteBtn = true;
                self.isErrorEditDriving = false;
            }
        }

        if (self.isSpecialEditingError) {
            errorEditDR = true;
            color = 'rgba(228,146,114, 1)';
        } else {
            errorEditDR = false;
        }
        
        $(self.selectorSvg).append(self.svgEl('polygon'));

        $(self.selectorSvg).find("polygon").last()
            .attr("points", x1 + "," + y0 + " " + x2 + "," + y0 + " " + x2 + "," + y + " " + x1 + "," + y)
            .attr("class", 'statusArea')
            .attr("id", "area_" + x1)
            .attr("style", "stroke:rgba(90, 181, 41, 1);fill:" + colr + ";");

        self.drawTooltip(x1 - 50, -30, 0, x1, color);
        self.drawTooltip(x2 + 50, -30, 1, x2, color);
        self.drawSlideButton(x1, y, 0, color);
        self.drawSlideButton(x2, y, 1, color);
        var line_color = 'rgba(90, 181, 41, 1)';
        self.drawLine(x1, x1, y0, y, 'area_stroke_line', line_color);
        self.drawLine(x2, x2, y0, y, 'area_stroke_line', line_color);
        self.drawDurationTooltip(x2 + 60, -30, x1, x2, errorEditDR);
        if (!$('.area_tooltip.drag.resize[dir="0"][data-disabled="1"]').length && !(self.todaysDate && self.segments.length - 1 == self.editedSegmentIndex)) {
            if (isDeleteBtn) {
                self.drawDeleteBtn(x1, x2);
            }
        }

        var isTodayX = false;
        if ($.type(self.todaysDate) == 'date' && Math.round(x2) == Math.round(self.convertTimeCoordToX(convertDateToSQL(self.todaysDate, true).substring(11)))) {
            isTodayX = true;
        }
        $('#log_control').show();
        $('#time_from').attr('readonly', true).attr('disabled', (x1 == 0 && !self.new_mode ? true : false));
        $('#time_to').attr('readonly', true).attr('disabled', ((x2 == 744 || isTodayX) && !self.new_mode ? true : false));

        var time_x1 = self.convertXCoordToTime(x1, (self.isAobrd ? false : true), true),
            time_x2 = self.convertXCoordToTime(x2, (self.isAobrd ? false : true), true);

        if ($('#time_from').val() != time_x1) {
            $('#time_from').
            val(time_x1).
            attr('data-time', self.convertXCoordToTime(x1, (self.isAobrd ? false : true), false) + (self.isAobrd ? ':00' : ''));
        }
        if ($('#time_to').val() != time_x2) {
            $('#time_to').
            val(time_x2).
            attr('data-time', self.convertXCoordToTime(x2, (self.isAobrd ? false : true), false) + (self.isAobrd ? ':00' : ''));
        }
        self.x1 = x1;
        self.x2 = x2;
    }
    this.updateSegmentsAfterMove = function () {
        var newSegments = [],
            newSegment = [];
        var x11, x12, xo1, xo2, changed;
        for (var x = 0; x < self.forMoveSegment.length; x++) {

            x11 = self.forMoveSegment[x].x1;
            x12 = self.forMoveSegment[x].x2;
            xo1 = x11;
            xo2 = x12;


            if (self.forMoveSegment[x].changed == 1)
                changed = 1;  //0-no, 1-changed, 2-deleted
            else
                changed = 0;

            if (x12 <= self.editedSegment.x1) { //current segment is to the left from edited
                if (self.x2 < x11) {
                    changed = 2;
                } else if (self.x1 < x12 && self.x2 > x11) { //status partially changed
                    changed = 1;
                    if (self.x1 < x11) {//status deleted
                        changed = 2;
                    }
                    x12 = self.x1;
                } else if (self.x1 > x12 && x < self.forMoveSegment.length - 1 && JSON.stringify(self.editedSegment) == JSON.stringify(self.forMoveSegment[x + 1])) {
                    changed = 1;
                    x12 = self.x1;
                }
            } else if (self.editedSegment.x2 <= x11) { //current segment is to the right from edited
                if (self.x1 > x12) {
                    changed = 2;
                } else if (self.x2 > x11 && self.x1 < x12) {  //status partially changed
                    changed = 1;
                    if (self.x2 > x12) {//status deleted
                        changed = 2;
                    }
                    x11 = self.x2;

                } else if (self.x2 < x11 && x > 0 && JSON.stringify(self.forMoveSegment[x - 1]) == JSON.stringify(self.editedSegment)) {
                    changed = 1;
                    x11 = self.x2;
                }
            } else {
                changed = 1;
                x11 = self.x1;
                x12 = self.x2;
            }

            // crop areas with null duration
            if (x11 == x12)
                changed = 2;

            if (changed != 2) {
                newSegment = JSON.parse(JSON.stringify(self.forMoveSegment[x]));
                newSegment.x1 = x11;
                newSegment.x2 = x12;
                newSegment.x01 = xo1;
                newSegment.x02 = xo2;
                newSegment.changed = changed;

                newSegments.push(newSegment);
            }
        }
        self.segments = JSON.parse(JSON.stringify(newSegments));

        // fix change status after one segment cover couple segments
        for (var x = 0; x < self.segments.length; x++) {
            if (self.segments[x].x1 == self.x1) {
                self.editedSegmentIndex = x;
                break;
            }
        }
    }

    self.updateSegmentsFromAfterMove = function () {
        var time_split, duration, diffTime, durationDisplay;
        for (var x = 0; x < self.segments.length; x++) {
            self.segments[x].from.time = self.convertXCoordToTime(self.segments[x].x1, true);
            self.segments[x].from.dateTime = self.currentDateString + ' ' + self.segments[x].from.time;
        }
        for (var x = 0; x < self.segments.length; x++) {

            time_split = self.segments[x].from.time.split(':');
            self.segments[x].from.hours = parseInt(time_split[0]);
            self.segments[x].from.mins = parseInt(time_split[1]);
            self.segments[x].from.seconds = parseInt(time_split[2]);

            if (typeof self.segments[x + 1] != 'undefined') {
                diffTime = self.getSecondsFromDateTimeString(self.segments[x + 1].from.dateTime) - self.getSecondsFromDateTimeString(self.segments[x].from.dateTime);
                durationDisplay = self.convertXCoordToTimeV2(self.segments[x].x1, self.segments[x].x2, true);
            } else if (self.todaysDate !== false) {
                diffTime = self.getSecondsFromDateTimeString(convertDateToSQL(self.todaysDate, true)) - self.getSecondsFromDateTimeString(self.segments[x].from.dateTime);
                //convertTimeCoordToX
                durationDisplay = self.convertXCoordToTimeV2(self.segments[x].x1, self.convertTimeCoordToX(convertDateToSQL(self.todaysDate, true).substring(11)), true);
            } else {
                diffTime = self.getSecondsFromDateTimeString(self.currentDateString + ' 23:59:59') - self.getSecondsFromDateTimeString(self.segments[x].from.dateTime) + 1;
                durationDisplay = self.convertXCoordToTimeV2(self.segments[x].x1, 743, true);
            }

            diffTime = diffTime;
            duration = getDurationFromSec(diffTime, false, (self.isAobrd ? false : true));
            time_split = duration.split(" ");
            self.segments[x].from.duration = duration;
            self.segments[x].from.durationDisplay = durationDisplay;
            self.segments[x].from.durationH = parseInt(time_split[0].replace(/\D/g, ''));
            self.segments[x].from.durationM = typeof time_split[1] != 'undefined' ? parseInt(time_split[1].replace(/\D/g, '')) : 0;
            self.segments[x].from.durationS = typeof time_split[2] != 'undefined' ? parseInt(time_split[2].replace(/\D/g, '')) : 0;
        }

        // !!! violation recount function

        self.segmentsToList();
    }

    this.beforeMoveArea = function (direction) {
        if (!self.editedSegment.inserted || direction == self.forMoveDirection) {
            return 1;
        }
        var el;
        for (var x = 0; x < self.forMoveSegment.length; x++) {
            if (direction == 0 && ((self.forMoveSegment[x].x1 <= self.x2 && self.x2 <= self.forMoveSegment[x].x2) || (self.x2 == self.svg_width && x == self.forMoveSegment.length - 1))) {
                // copy EditedSegment
                el = JSON.parse(JSON.stringify(self.forMoveSegment[self.forMoveEditedSegmentIndex]));
                el.x1 = self.x2 - 0.00001;
                el.x2 = self.x2;

                // clear prev inserted, stretch x+1 to prev inserted
                // if this isn't first move of left slider
                if (typeof self.forMoveSegment[self.forMoveEditedSegmentIndex - 1] != 'undefined') {
                    if (typeof self.forMoveSegment[self.forMoveEditedSegmentIndex + 1] != 'undefined')
                        self.forMoveSegment[self.forMoveEditedSegmentIndex - 1].x2 = self.forMoveSegment[self.forMoveEditedSegmentIndex + 1].x2;
                    // del "inserted" and next that was copied
                    self.forMoveSegment.splice(self.forMoveEditedSegmentIndex, 2);
                } else {
                    // del "inserted" and next that was copied
                    self.forMoveSegment.splice(self.forMoveEditedSegmentIndex, 1);

                    self.forMoveSegment[0].x1 = 0;
                    x = x + 1;
                }
                // move inserted to self.x2
                self.forMoveSegment.splice(x - 1, 0, el);

                // copy x and past after inserted
                el = JSON.parse(JSON.stringify(self.forMoveSegment[x - 2]));
                el.from.id = self.nextNewId;
                self.nextNewId--;
                self.forMoveSegment.splice(x, 0, el);

                // actualaze borders
                self.forMoveSegment[x - 2].x2 = self.x2 - 0.00001;
                ;
                self.forMoveSegment[x].x1 = self.x2;

                self.forMoveEditedSegmentIndex = x - 1;

                self.editedSegment = self.forMoveSegment[self.forMoveEditedSegmentIndex];

                break;
            } else if (direction == 1 && self.forMoveSegment[x].x1 <= self.x1 && self.x1 <= self.forMoveSegment[x].x2) {
                // copy EditedSegment
                el = JSON.parse(JSON.stringify(self.forMoveSegment[self.forMoveEditedSegmentIndex]));
                el.x1 = self.x1 - 0.00001;
                ;
                el.x2 = self.x1;

                // clear prev inserted, stretch x+1 to prev inserted
                if (typeof self.forMoveSegment[self.forMoveEditedSegmentIndex + 1] != 'undefined' && typeof self.forMoveSegment[self.forMoveEditedSegmentIndex - 1] != 'undefined')
                    self.forMoveSegment[self.forMoveEditedSegmentIndex - 1].x2 = self.forMoveSegment[self.forMoveEditedSegmentIndex + 1].x2;
                // del "inserted" and next that was copied
                self.forMoveSegment.splice(self.forMoveEditedSegmentIndex, 2);

                // move inserted to self.x1
                self.forMoveSegment.splice(x + 1, 0, el);

                // copy x and past after inserted
                el = JSON.parse(JSON.stringify(self.forMoveSegment[x]));
                el.from.id = self.nextNewId;
                self.nextNewId--;
                self.forMoveSegment.splice(x + 2, 0, el);

                // actualaze borders
                self.forMoveSegment[x].x2 = self.x1 - 0.00001;
                ;
                self.forMoveSegment[x + 2].x1 = self.x1;

                self.forMoveEditedSegmentIndex = x + 1;
                self.editedSegment = self.forMoveSegment[self.forMoveEditedSegmentIndex];

                break;
            }
        }
        self.forMoveDirection = direction;
    }
    this.afterMoveArea = function () {
        self.updateSegmentsFromAfterMove();
    }
    this.moveArea = function (direction, relX) {
        var date;
        if (relX < 0) {
            relX = 0;
        }
        if (direction == 0 && self.x2 < relX) {
            return false;
        } else if (direction == 1 && self.x1 > relX) {
            return false;
        }
        // omit seconds for aobrd
        if (self.isAobrd && ((direction == 0 && relX > 0) || (direction == 1 && relX < self.svg_width))) {
            // round time to min
            date = self.newDate(self.currentDateString + ' ' + self.convertXCoordToTime(relX, true));
            if (date.getSeconds() >= 30)
                date.setMinutes(date.getMinutes() + 1);
            date.setSeconds(0);
            relX = self.convertTimeCoordToX(date.toTimeString().substr(0, 8));
        }
        // exempt driver step 15 mins
        else if (!self.isEld && relX < self.svg_width) {
            date = self.newDate(self.currentDateString + ' ' + self.convertXCoordToTime(relX, true));
            relX = self.convertTimeCoordToX(self.dateTimeToNearest15Mins(date).toTimeString().substr(0, 8));
        }

        //if last today status
        if (self.todaysDate && JSON.stringify(self.segments[self.segments.length - 1]) == JSON.stringify(self.editedSegment) && self.x2 > self.segments[self.segments.length - 1].x2) {
            return false;
        }

        //if today, max x2 is now time x
        if ($.type(self.todaysDate) == 'date') {
            var todayX = self.convertTimeCoordToX(convertDateToSQL(self.todaysDate, true).substring(11));
            relX = todayX <= relX ? todayX - 1 : relX;
        }
        relX = relX < 0 ? 0 : (relX > self.svg_width ? self.svg_width : relX);
        if (direction == 0) {
            self.x1 = relX;
        } else {
            self.x2 = relX;
        }
        if (this.editedSegment.x1 == 0 && direction == 0 && !self.new_mode) {
            self.x1 = 0;
        }
        if (this.editedSegment.x2 == self.svg_width && direction == 1 && !self.new_mode) {
            self.x2 = self.svg_width;
        }
        // deny edit right time of the last status for current date
        else if ($.type(self.todaysDate) == 'date' && !self.new_mode) {
            if (Math.round(self.editedSegment.x2) == Math.round(todayX) && direction == 1) {
                self.x2 = todayX;
            }
        }
        if (direction == 1 && relX > self.svg_width) {
            self.x2 = self.svg_width;
        }
        if (!self.isEld && self.todayX15Min && direction == 1 && relX > self.todayX15Min) {
            self.x2 = self.todayX15Min;
        }

        // fix minimal during of time
        if (self.x1 == self.x2) {
            if (direction == 0)
                self.x1 = self.x2 - 0.01;
            else
                self.x2 = self.x1 + 0.01;
        }
        if (!self.isEld && Math.abs(self.x2 - self.x1) < 7.75) { // min duration is 15 min
            if (direction == 0)
                self.x1 = self.x2 - 7.75;
            else
                self.x2 = self.x1 + 7.75;
        }
        if (self.x1 < self.x2) {
            self.updateSegmentsAfterMove();
            self.graphDrawEditArea(self.x1, self.x2, true);
            self.graphDrawSecond();
            $('.edit_status').removeClass('active');
            $('#status_' + self.editedSegment.status).addClass('active');
        }
    }
    // update status table from segments
    this.segmentsToList = function (segments = false, selector = '#log_list') {
        var status_tr = '', driveTime = '', shiftTime = '', cycleTime = '', duration = '';
        if (segments === false)
            segments = self.segments;
        if (typeof segments[0].from.duration == 'undefined')
            return;

        $(selector + ' tbody').html('');
        for (var x = 0; x < segments.length; x++) {
            if (segments[x].from.durationDisplay)
                duration = segments[x].from.durationDisplay;
            else
                duration = segments[x].from.duration;
            if (self.isAobrd || !self.isEld)
                duration = duration.substr(0, 8);

            if (typeof segments[x].from.drive != 'undefined')
                driveTime = getDurationFromSec(segments[x].from.drive, true);
            if (typeof segments[x].from.shift != 'undefined')
                shiftTime = getDurationFromSec(segments[x].from.shift, true);
            if (typeof segments[x].from.cycle != 'undefined')
                cycleTime = getDurationFromSec(segments[x].from.cycle, true);
            if (driveTime.indexOf('-') > -1)
                driveTime = '<span class="error">' + driveTime.replace("-", "") + '<span>';
            if (shiftTime.indexOf('-') > -1)
                shiftTime = '<span class="error">' + shiftTime.replace("-", "") + '<span>';
            if (cycleTime.indexOf('-') > -1)
                cycleTime = '<span class="error">' + cycleTime.replace("-", "") + '<span>';
            var stX = x == 0 ? 0 : self.convertTimeCoordToX(segments[x].from.dateTime.substr(11));
            var locationWithCoords = '<img src="/dash/assets/img/dash_map_blue.svg" title="Location without coordinates" />';

            if ($.isNumeric(segments[x].from.lt) && segments[x].from.lt != 0 && segments[x].from.lt != -1 &&
                $.isNumeric(segments[x].from.lng) && segments[x].from.lng != 0 && segments[x].from.lng != -1) {
                locationWithCoords = '';
            }
            if (getCookie('locationIconWarning') === '0') {
                locationWithCoords = '';
            }
            var superEditClass = '';
            var superEditHandler = '';
            if (self.isSuperDrivingEdit && segments[x].status !== 'dr') {
                superEditClass = 'hide-status';
            }
            if (segments[x].status == 'dr') {
                if ((curUserIsEzlogzEmployee() && (superAdminRights.driving_correction == 1 || position === 1))) {
                    superEditHandler = `showSuperEditPopup(${x}); `;
                }
            }
            status_tr += '<tr ' + (selector == '#log_list' ? 'onclick="' + superEditHandler + 'logbook.editStatusClick(this);" onmouseover="logbook.drawStatusIllumination(this)" onmouseout="logbook.drawStatusIlluminationOff()" data-stx="' + stX + '" data-start="' + segments[x].from.dateTime.substr(11) + '"' : '') + ' id="' + segments[x].from.id + '" data-index="' + x + '" class="logbook_status ' + superEditClass + '">;' +
                '<td>' + (x + 1) + '</td>' +
                '<td class="duty " style="position:relative"><div class="inner_status_color ' + segments[x].status + '" style="top: 0;">' + segments[x].status + '</div></td>' +
                '<td>' + convertOnlyTimeFromSqlToUsa(self.isAobrd || !self.isEld ? segments[x].from.time.substr(0, 5) : segments[x].from.time) + '</td>' +
                '<td>' + duration + '</td>' +
                (position === TYPE_SUPERADMIN || position === TYPE_EZLOGZ_MANAGER || position === TYPE_EMPLOYEE ? '<td>' + segments[x].from.totalMiles + '</td>' : '') +
                (selector == '#log_list' ?
                        '<td data-loc="' + segments[x].from.lt + ',' + segments[x].from.lng + '">' + (segments[x].from.position ? segments[x].from.position.toUpperCase() : 'UNKNOWN') + ' ' + locationWithCoords + '</td>' +
                        '<td style="word-break: break-all;">' + segments[x].from.message + '</td>' +
                        '<td class="availbl">' + driveTime + '</td>' +
                        '<td class="availbl">' + shiftTime + '</td>' +
                        '<td class="availbl">' + cycleTime + '</td>'
                        :
                        '<td>' + segments[x].from.editAnnotation + '</td>'
                ) +
                '</tr>';
        }

        $(selector + ' tbody').append(status_tr);
        $.each(self.cycleStatuses, function (key, st) {
            var stTime = self.getSecondsFromTime(st.dateTime.substring(11));
            var appended = false;
            $('#log_list .logbook_status').each(function (index) {
                var logStTime = index == 0 ? '00:00:00' : $(this).attr('data-start');
                if (self.getSecondsFromTime(logStTime) > stTime) {
                    $("<tr><td colspan=\"3\">" + convertOnlyTimeFromSqlToUsa(st.dateTime.substring(11)) + "</td><td colspan=\"6\">Driver Cycle changed to " + st.cycleName + "</td></tr>").insertBefore($(this));
                    appended = true;
                    return false;
                }
            });
            if (!appended) {
                $(selector + ' tbody').append("<tr><td colspan=\"3\">" + convertOnlyTimeFromSqlToUsa(st.dateTime.substring(11)) + "</td><td colspan=\"6\">Driver Cycle changed to " + st.cycleName + "</td></tr>");
            }
        });
        $.each(self.timeZoneStatuses, function (key, st) {
            var stTime = self.getSecondsFromTime(st.dateTime.substring(11));
            var appended = false;
            $('#log_list .logbook_status').each(function (index) {
                var logStTime = index == 0 ? '00:00:00' : $(this).attr('data-start');
                if (self.getSecondsFromTime(logStTime) > stTime) {
                    $("<tr><td colspan=\"3\">" + convertOnlyTimeFromSqlToUsa(st.dateTime.substring(11)) + "</td><td colspan=\"6\">Driver TimeZone changed to " + st.timeZoneName + "</td></tr>").insertBefore($(this));
                    appended = true;
                    return false;
                }
            });
            if (!appended) {
                $(selector + ' tbody').append("<tr><td colspan=\"3\">" + convertOnlyTimeFromSqlToUsa(st.dateTime.substring(11)) + "</td><td colspan=\"6\">Driver TimeZone changed to " + st.timeZoneName + "</td></tr>");
            }
        });
        $(selector + ' tbody tr').removeClass('editing');
        $(selector + ' tbody tr[data-index="' + self.editedSegmentIndex + '"]').addClass('editing');

        if (!self.isEditMode) {
            self.displayScannerStatusesList();
            self.displayWeighStationsStatusesList();
            self.displayEngineStatusesList();
            self.sortStatuses();
        }
    }
    this.getSecondsFromTime = function (time) {
        var timeArr = time.split(':');
        var hours = parseInt(timeArr[0]);
        var mins = parseInt(timeArr[1]);
        var sec = parseInt(timeArr[2]);
        return sec + mins * 60 + hours * 60 * 60;
    }
    this.changeStatus = function (new_status = false) {
        var row = 0,
            h = 14,
            special = $('.log_st_buttons_ya_inp').is(':visible') && $('.log_st_buttons_ya_inp').prop('checked') ? 1 : 0;

        $('.log_st_buttons_ya_inp').prop('checked', false);
        if (new_status === false)
            new_status = self.segments[self.editedSegmentIndex].status;
        else {
            $('.log_st_buttons_ya_inp').prop('checked', false);
            checkButtonInit('advDr', false);
            checkButtonInit('h16Ex', false);
            special = 0;
        }

        self.segments[self.editedSegmentIndex].status = new_status;
        self.segments[self.editedSegmentIndex].changed = 1;
        if (new_status == 'off') {
            row = 0;
        } else if (new_status == 'sb') {
            row = 1;
        } else if (new_status == 'dr') {
            row = 2;
        } else if (new_status == 'on') {
            row = 3;
        }
        var new_y = h + row * 2 * h;

        self.editedSegment.status = new_status;

        self.segments[self.editedSegmentIndex].status = new_status;
        self.segments[self.editedSegmentIndex].from.status = self.statusLiteralToNumderConvert(new_status);
        self.segments[self.editedSegmentIndex].from.special = special;
        self.segments[self.editedSegmentIndex].from.specials = [];
        self.segments[self.editedSegmentIndex].y = new_y;

        self.forMoveSegment[self.forMoveEditedSegmentIndex].status = new_status;
        self.forMoveSegment[self.forMoveEditedSegmentIndex].from.status = self.statusLiteralToNumderConvert(new_status);
        self.forMoveSegment[self.forMoveEditedSegmentIndex].from.special = special;
        self.forMoveSegment[self.forMoveEditedSegmentIndex].from.specials = [];
        self.forMoveSegment[self.forMoveEditedSegmentIndex].y = new_y;

        // this is if insert and after at once change status
        if (!self.segments[self.editedSegmentIndex].from.dateTime){
            self.updateSegmentsFromAfterMove();
        }

        self.setSpecialsForStatus();
        self.updateSegmentsAfterMove();
        self.graphDrawEditArea(self.x1, self.x2, true);
        self.graphDrawSecond();
        self.segmentsToList();
        $('.edit_status').removeClass('active');
        $('#status_' + new_status).addClass('active');
    }

    this.createArea = function (index) {
        if (!self.isEditMode) {
            return false;
        }
        self.editedSegmentIndex = parseInt(index);
        self.forMoveEditedSegmentIndex = index;
        self.forMoveSegment = JSON.parse(JSON.stringify(self.segments));
        self.editedSegment = self.segments[self.editedSegmentIndex];
        if (!self.cantEditLogbook) {
            if(self.isSmartSafetySuperEdit && self.new_mode) {
                let t1 = moment(self.segments[self.superEditStatusIndex + 1].from.dateTime).add(1, 'minutes');
                let t2 = moment(self.segments[self.superEditStatusIndex + 2].from.dateTime).subtract(1, 'minutes');

                self.x11 = self.convertTimeCoordToX(t1.format('HH:mm:ss'))
                self.x22 = self.convertTimeCoordToX(t2.format('HH:mm:ss'))

                self.isSpecialEditingError = true;

                self.graphDrawEditArea(self.x11, self.x22, true);
            } else {
                self.graphDrawEditArea(self.segments[self.editedSegmentIndex].x1, self.segments[self.editedSegmentIndex].x2, true);
            }
        } else {
            var message = '<div class="cantEditText">You can not edit statuses, please contact your safety for more information.</div>';
            showModal('Cannot Edit', message, 'basicModal', '');
        }

        if (self.editedSegment.from != undefined && self.editedSegment.from.id != $('#log_status_info').attr('data-id')) {
            $('#log_status_info').attr('data-id', self.editedSegment.from.id);
            $('#location_name').val(self.editedSegment.from.location ? self.editedSegment.from.location : 'UNKNOWN');
            $('#latitude').val(self.editedSegment.from.lt);
            $('#longitude').val(self.editedSegment.from.lng);
            $('#note').val(self.editedSegment.from.message);
        }
        removeAttchment('all', false);
        if (self.editedSegment.from.documents.length > 0) {
            $.each(self.editedSegment.from.documents, function (i, v) {
                addAttchment(v, false);
            });
        }
        $('.edit_status').removeClass('active');
        $('#status_' + self.editedSegment.status).addClass('active');

        $('#log_list tbody tr').removeClass('editing');
        $('#log_list tbody tr[data-index="' + self.editedSegmentIndex + '"]').addClass('editing');
        $('#sendLogLocation.active').click();

        self.setSpecialsForStatus();
    }
    this.setSpecialsForStatus = function () {

        if (self.segments[self.editedSegmentIndex].status == 'off') {
            if (self.dbData.allowConveyance) {
                $('.log_st_buttons_ya_t').text('Personal conveyance');
                $('.log_st_buttons_ya_inp').prop('checked', (self.segments[self.editedSegmentIndex].from.special == 1 ? true : false));
                checkButtonInit('yardM', self.segments[self.editedSegmentIndex].from.special == 1 ? true : false);
                $('.log_st_buttons_ya').slideDown();
            }
            $('.specials_block').slideUp();
        } else if (self.segments[self.editedSegmentIndex].status == 'sb') {
            $('.log_st_buttons_ya').slideUp();
            $('.specials_block').slideUp();
        } else if (self.segments[self.editedSegmentIndex].status == 'dr') {
            $('.log_st_buttons_ya').slideUp();
            $('.specials_block').slideDown();
            if (self.user_settings.adverce_driving == 1) {
                $('#advDr').closest('.col-sm-6').show();
            } else {
                $('#advDr').closest('.col-sm-6').hide();
            }
            if (self.user_settings.hours_exception == 1) {
                $('#h16Ex').closest('.col-sm-6').show();
            } else {
                $('#h16Ex').closest('.col-sm-6').hide();
            }
        } else if (self.segments[self.editedSegmentIndex].status == 'on') {
            if (self.dbData.allowYard) {
                $('.log_st_buttons_ya_t').text('Yard mode');
                $('.log_st_buttons_ya_inp').prop('checked', (self.segments[self.editedSegmentIndex].from.special == 1 ? true : false));
                checkButtonInit('yardM', self.segments[self.editedSegmentIndex].from.special == 1 ? true : false);
                $('.log_st_buttons_ya').slideDown();
            }
            $('.specials_block').slideUp();
        }

        checkButtonInit('advDr', false);
        checkButtonInit('h16Ex', false);
        $('#specials_1, #specials_2').prop('checked', false);
        $.each(self.segments[self.editedSegmentIndex].from.specials, function (key, spec) {
            if (spec.specId == 1) {
                checkButtonInit('advDr', true);
                $('#specials_1').prop('checked', true);
            } else if (spec.specId == 2) {
                checkButtonInit('h16Ex', true);
                $('#specials_2').prop('checked', true);
            }
        });
    }
    this.graphDrawSecond = function () {
        $('.working_line.second').remove();
        for (var x = 0; x < self.segments.length; x++) {
            self.drawLine(self.segments[x].x1, self.segments[x].x2, self.segments[x].y, self.segments[x].y, 'working_line second', '#4F65E3', ((self.segments[x].status == 'off' || self.segments[x].status == 'on') && self.segments[x].from.special == 1 ? 'stroke-dasharray: 2, 2;' : ''));
            if (x < self.segments.length - 1) {
                self.drawLine(self.segments[x].x2, self.segments[x].x2, self.segments[x].y, self.segments[x + 1].y, 'working_line second', '#4F65E3', '');
            }
        }
    }

    this.initLogbookOnClicks = function () {
        self.svg = document.getElementById("logBook");
        self.SVGPoint = self.svg.createSVGPoint();

        // this click event is necessary because of "event" var
        $('#log_book').off('click').on('click', self.selectorSvg, function (event) {
            if (self.blockedLogbookOnClick === true || self.isErrorEditDriving) {
                self.blockedLogbookOnClick = false;
                return;
            }
            self.SVGPoint.x = event.clientX;
            self.SVGPoint.y = event.clientY;
            var relX = self.SVGPoint.matrixTransform(self.svg.getScreenCTM().inverse()).x,
                index = false;
            for (var x = 0; x < self.segments.length; x++) {
                if (relX >= self.segments[x].x1 && relX <= self.segments[x].x2) {
                    index = x;
                    break;
                }
            }
            if (self.new_mode && self.blockedLogbookOnClick === false) {
                // if there was inserted status but wasn't moved - delete it
                if (self.new_mode && index == logbook.editedSegmentIndex) {
                    return;
                }
                if (self.segments[0].inserted && self.segments[0].x1 == 0 && self.segments[0].x2 == 1 && self.segments[1].x1 == 1) {
                    self.segments[1].x1 = 0;
                    self.segments.splice(0, 1);
                }

                delete self.editedSegment.inserted;
                $.each(self.segments, function (k, v) {
                    if (typeof v.inserted != 'undefined') {
                        delete self.segments[k].inserted;
                        return false;
                    }
                });
                //???
                for (var x = 0; x < self.segments.length; x++) {
                    if (relX >= self.segments[x].x1 && relX <= self.segments[x].x2) {
                        index = x;
                        break;
                    }
                }
                //???
                self.updateSegmentsFromAfterMove();
            }
            self.new_mode = false;
            $('.add_status').attr('disabled', false);


            if (index !== false) {
                // for undo inserted area on delete action
                self.forDeleteSegments = JSON.parse(JSON.stringify(self.segments));
                
                if (!self.isSuperDrivingEdit) {
                    self.createArea(index);
                }
            }
        });
        $('body').off('dragstart').on('dragstart', '.drag', function () {
            return false;
        });
    }
    this.deleteStatus = function () {
        // prevent choosing other area
        self.blockedLogbookOnClick = true;
        showModalConfirmation('Confirmation', '<p class="text-center">Are you sure you want to delete the status?</p>');
        $('#confirmationModal').off('click', '#btnConfirmClick').on('click', '#btnConfirmClick', function () {
            if (typeof self.segments[self.editedSegmentIndex].inserted != 'undefined' && self.segments[self.editedSegmentIndex].inserted) {
                self.new_mode = false;
                self.segments = JSON.parse(JSON.stringify(self.forDeleteSegments));
                self.createArea(self.editedSegmentIndex > 0 ? self.editedSegmentIndex - 1 : 0);
                self.graphDrawSecond();
            } else {
                self.segments = JSON.parse(JSON.stringify(self.forDeleteSegments));
                for (var x = 0; x < self.segments.length; x++) {
                    if (x > 0 && x == self.editedSegmentIndex) {
                        self.segments[x - 1].x2 = self.segments[x].x2;
                        self.segments[x - 1].changed = 1;
                        self.segments.splice(x, 1);

                        self.updateSegmentsFromAfterMove();
                        self.createArea(x - 1);
                        self.graphDrawSecond();

                        break;
                    }
                }
            }
            // for repeat deleting
            self.forDeleteSegments = JSON.parse(JSON.stringify(self.segments));
            self.segmentsToList();
        });
        return false;
    }
    this.addStatus = function () {
        $('#location_name').val('UNKNOWN');
        $('#note').val('');

        if (self.segments[0].x2 != (self.isEld ? 1 : 7.75)) {
            delete self.editedSegment.inserted;
            $.each(self.segments, function (k, v) {
                if (typeof v.inserted != 'undefined') {
                    delete self.segments[k].inserted;
                    return false;
                }
            });

            // for undo inserted area on delete action
            self.forDeleteSegments = JSON.parse(JSON.stringify(self.segments));

            var x2 = (self.isEld ? 1 : 7.75);
            self.segments.unshift($.extend(JSON.parse(JSON.stringify(self.segments[0])), {
                x1: 0, x2: x2, y: 14, status: 'off', inserted: true,
                from: {
                    id: self.nextNewId, lt: '', lng: '', location: 'UNKNOWN', message: '',
                    odo: '', special: 0, position: 'UNKNOWN', documents: [], editAnnotation: '',
                    drive: self.segments[0].from.drive,
                    shift: self.segments[0].from.shift,
                    shiftWork: self.segments[0].from.shiftWork,
                    eight: self.segments[0].from.eight,
                    cycle: self.segments[0].from.cycle,
                    specials: self.segments[0].from.specials
                }
            }));
            self.segments[1].x1 = x2;
        }

        self.new_mode = true;

        if (self.isSmartSafetySuperEdit) {
            $('#manager_user_card .modal-content, #log_box, .logbookDiv').addClass('superInsert');
            $('#add_button').addClass('disabled-btn');
            self.superInsert = 0;
            $('#log_list').after(`
                <div id="insertStatusCoord">
                    <div class="form-group"> 
                        <label for="insertLatitude">Latitude</label>
                        <input type="text" id="insertLatitude" onkeyup="this.value = this.value.replace (/[^0-9-.]/, '')" class="form-control">
                    </div>
                    <div class="form-group"> 
                        <label for="insertLongitude">Longitude</label>
                        <input type="text" id="insertLongitude" onkeyup="this.value = this.value.replace (/[^0-9-.]/, '')" class="form-control">
                    </div>
                </div>
            `);
        } else {
            $('#add_button').removeClass('disabled-btn');
        }
        self.createArea(0);

        self.editedSegmentIndex = 0;
        self.forMoveEditedSegmentIndex = 0;
        self.forMoveDirection = 1;

        $('.log_st_buttons_ya_inp').prop('changed', false);

        $('#log_status_info').attr('data-id', self.nextNewId);
        self.nextNewId--;
    }

    this.saveTime = function () {
        var time_str = $('#time_control').val();
        time_str = time_str.replace(/ : /g, ':');
        time_str = time_str.split(' ');
        var am_pm = time_str[1];
        time_str = time_str[0].split(':');
        if (am_pm == 'PM' && time_str[0] != 12) {
            time_str[0] = String(parseInt(time_str[0]) + 12);
        } else if (am_pm == 'AM' && time_str[0] == 12) {
            time_str[0] = String(parseInt(time_str[0]) - 12);
        }
        var relX = self.convertTimeCoordToX(time_str.join(':') + (typeof time_str[2] == 'undefined' ? ':00' : '')),
            direction = $('#time_control').attr('data-time') == 'time_to' ? 1 : 0;
        $('#time_modal').modal('hide');
        $('#time_control').removeAttr('data-time');

        self.beforeMoveArea(direction);
        self.moveArea(direction, relX);
        self.updateSegmentsFromAfterMove();
    }

    this.editStatusClick = function (el) {
        if (self.isErrorEditDriving) {
            return false;
        }
        if (event.altKey || event.shiftKey) {
            if (curUserIsSmartSafety(self.userId) && !self.isEditMode && getCookie('original_setting') != 1) {
                let status = event.target.closest('.logbook_status');
                let statusIndex = status.getAttribute('data-index');
                let statusType = self.originalSegments[statusIndex]['status'];
                
                if (statusType == 'dr') {
                    showSuperEditPopup(statusIndex);
                    self.isSpecialEditingError = false;
                }
    
                return false;
            }
        }
        if (self.new_mode) {
            // if there was inserted status but wasn't moved - delete it
            if (self.segments[0].inserted && self.segments[0].x1 == 0 && self.segments[0].x2 == 1 && self.segments[1].x1 == 1) {
                self.segments[1].x1 = 0;
                self.segments.splice(0, 1);
            }

            delete self.editedSegment.inserted;
            $.each(self.segments, function (k, v) {
                if (typeof v.inserted != 'undefined') {
                    delete self.segments[k].inserted;
                    return false;
                }
            });

            self.updateSegmentsFromAfterMove();
        }
        self.new_mode = false;
        $('.add_status').attr('disabled', false);

        // for undo inserted area on delete action
        self.forDeleteSegments = JSON.parse(JSON.stringify(self.segments));
        self.createArea($(el).attr('data-index'));
    }
    this.statusYM = function (el) {
        var prop = $(el).attr('data-val') == 1 ? true : false;
        $('.log_st_buttons_ya_inp').prop('checked', prop).change();
    }
    this.statusadvDr = function (el) {
        var prop = $(el).attr('data-val') == 1 ? true : false;
        $('#specials_1').prop('checked', prop).change();
    }
    this.statush16Ex = function (el) {
        var prop = $(el).attr('data-val') == 1 ? true : false;
        $('#specials_2').prop('checked', prop).change();
    }
    this.statusFieldChange = function (obj) {
        if (!self.isEditMode) {
            return 1;
        }
        if ($(obj).attr('id') != 'note')
            $(obj).val($(obj).val().replace(/[\u0250-\ue007]/g, ''));
        var new_val = $(obj).val();
        var new_val_id = $(obj).attr('id');

        if (new_val_id == 'docId') {
            var docId_arr = [];
            $('.attachment_info_cont .attachment_info_div .attachment_info').each(function () {
                docId_arr.push(parseInt($(this).attr('data-docid')));
            });
            self.segments[self.editedSegmentIndex].from.documents = docs.filter(function (e) {
                return $.inArray(e.id, docId_arr) != -1;
            });
        } else if (new_val_id == 'special') {
            self.segments[self.editedSegmentIndex].from.special = ($(obj).is(':checked') ? 1 : 0);
            self.changeStatus();
        } else if (new_val_id == 'longitude') {
            self.segments[self.editedSegmentIndex].from.lng = new_val;
        } else if (new_val_id == 'latitude') {
            self.segments[self.editedSegmentIndex].from.lt = new_val;
        } else if (new_val_id == 'location_name') {
            if (!new_val)
                new_val = 'UNKNOWN';
            self.segments[self.editedSegmentIndex].from.position = new_val.toUpperCase();
            self.segments[self.editedSegmentIndex].from.location = new_val.toUpperCase();
            self.segments[self.editedSegmentIndex].from.lt = 0;
            self.segments[self.editedSegmentIndex].from.lng = 0;
        } else if (new_val_id == 'note') {
            self.segments[self.editedSegmentIndex].from.message = new_val.toUpperCase();
        } else if (new_val_id.substr(0, 9) == 'specials_') {
            var spec1 = $('#specials_1').is(':checked') ? 1 : 0;
            var spec2 = $('#specials_2').is(':checked') ? 1 : 0;
            var specials = [];
            if (spec1) {
                specials.push({specId: 1, val: 0});
            }
            if (spec2) {
                specials.push({specId: 2, val: 0});
            }
            self.segments[self.editedSegmentIndex].from.specials = specials;
        }

        self.segments[self.editedSegmentIndex].changed = 1;
        self.forMoveSegment[self.editedSegmentIndex].from.location = self.segments[self.editedSegmentIndex].from.location;
        self.forMoveSegment[self.editedSegmentIndex].from.position = self.segments[self.editedSegmentIndex].from.position;
        self.forMoveSegment[self.editedSegmentIndex].from.message = self.segments[self.editedSegmentIndex].from.message;
        self.segmentsToList();
    }

    this.distanceAdd = function () {
        var newIndex = $('ul#distances_list').attr('new');
        newIndex = parseInt(newIndex);
        var edit_parameter = '<li id="item_new_' + newIndex + '" \n\
        s-id="new_' + newIndex + '" \n\
        s-type="distances" \n\
        s-state="0" \n\
        s-distance="" \n\
        s-truck="0" \n\
        class="distance_info" onclick="logbook.distanceEdit(this)" >';
        edit_parameter += '<span class="field_text" style="width: 100%" ></span>';
        edit_parameter += '<span class="removeEq" eq-id="new" eq-type="distances" onclick="logbook.distanceRemove(this)"></span>';
        edit_parameter += '</li>';
        $('ul#distances_list').append(edit_parameter).attr('new', newIndex + 1);
        $('ul#distances_list').find('li#item_new_' + newIndex).click();
    }
    this.distanceRemove = function (obj) {
        $(obj).parent('li').remove();
        self.distanceCalculate();
    }
    this.distanceEdit = function (obj) {
        var edit_parameter = '';
        var states = locationState.getStates();
        var trucks = self.user_info['trucks'];
        var type = $(obj).attr('s-type'),
            id = $(obj).attr('s-id'),
            state_id = $(obj).attr('s-state'),
            truck_id = $(obj).attr('s-truck'),
            distance = $(obj).attr('s-distance');
        $('.edit_distance').remove();
        if ($('.distance_info.edited').find('.field_text').text() == '') {
            $('.distance_info.edited').remove();
        } else {
            $('ul#distances_list').find('li').removeClass('edited');
        }

        edit_parameter += '<div class="edit_distance" id="distance_' + id + '">';
        edit_parameter += distance !== 'undefined' ? '<div><label for="item_distance">Distance</label><input type="text" class="distance" id="item_distance" value="' + self.getDistanceMlKm(distance) + '" oninput="logbook.distanceInputDot(this)" /></div>' : '';

        if (states.length > 0) {
            edit_parameter += '<div><label for="item_state">State</label>';
            edit_parameter += '<select id="item_state" onchange="logbook.distanceStateChange(this)">';
            edit_parameter += '<option type="text" value="0">Select State</option>';
            $.each(states, function (key, state) {
                edit_parameter += '<option type="text" value="' + state.id + '" ' + (state_id == state.id ? 'selected="selected"' : '') + '>' + state.name + '</option>';
            });
            edit_parameter += '</select></div>';
        }
        edit_parameter += '<div><label for="item_truck">Trucks</label>';
        edit_parameter += '<select id="item_truck" onchange="logbook.distanceTruckChange(this)">';
        edit_parameter += '<option type="text" value="0">Select Trucks</option>';
        if (trucks.length > 0) {
            $.each(trucks, function (key, truck) {
                edit_parameter += '<option type="text" value="' + truck.id + '" ' + (truck_id == truck.id ? 'selected="selected"' : '') + '>' + truck.Name + '</option>';
            });
        }
        edit_parameter += '</select></div>';
        edit_parameter += '<button id="save_distance" class="btn btn-default" onclick="logbook.distanceSave(\'' + id + '\');">Save</button>';
        edit_parameter += '<button id="cancel_distance" class="btn btn-default blue-border" onclick="logbook.distanceCancelEdit()">Cancel</button>';
        edit_parameter += '</div>';
        $('ul#distances_list').find('li#item_' + id).addClass('edited').after(edit_parameter);

    }
    this.distanceSave = function (id) {
        var obj = $('.edit_distance'),
            state = obj.find('#item_state option:selected').val(),
            state_title = obj.find('#item_state option:selected').text(),
            distance = parseFloat(obj.find('#item_distance').val()),
            truck = obj.find('#item_truck option:selected').val();
        obj.find('.error').removeClass('error');
        var regex = /^[0-9]{1,4}(?:[.][0-9]{1,})?\r?$/;
        var error = 0;
        if (!regex.test(distance) || distance == 0) {
            obj.find('#item_distance').addClass('error');
            error = 1;
        }

        if (truck == 0) {
            obj.find('#item_truck').addClass('error');
            error = 1;
        }
        if (state == 0) {
            obj.find('#item_state').addClass('error');
            error = 1;
        }

        if (error) {
            return false;
        }
        if (self.odometerId == 1) {
            distance = self.converKmToMi(distance);
        }
        var distance_name = state_title + ' ' + self.getDistanceMlKm(distance, 1) + ' ' + self.distanceLabel;

        $('ul#distances_list').find('li#item_' + id)
            .attr('s-state', state)
            .attr('s-distance', distance)
            .attr('s-truck', truck)
            .find('.field_text').text(distance_name);
        self.distanceCancelEdit();
        self.distanceCalculate();
    }
    this.distanceCancelEdit = function () {
        $('.edit_distance').remove();
        if ($('ul#distances_list').find('li.edited').text() == '') {
            $('ul#distances_list').find('li.edited').remove();
        }
        $('ul#distances_list').find('li.edited').removeClass('edited');
    }
    this.distanceCalculate = function () {
        var total = 0;
        $('ul#distances_list li').each(function () {
            total += parseFloat($(this).attr('s-distance'));
        });
        $('#distance_total').text(self.getDistanceMlKm(total, 1) + ' ' + self.distanceLabel);
        $('#distance').val(total);
    }
    this.distanceStateChange = function (el) {
        $('#item_truck option').show().prop('disabled', false);
        var item_state_id = $(el).val();
        $('ul#distances_list li').each(function () {
            if ($(this).attr('s-state') == item_state_id) {
                $('#item_truck option[value="' + $(this).attr('s-truck') + '"]').prop('disabled', true).hide();
            }
        });
    }
    this.distanceTruckChange = function (el) {
        $('#item_state option').show().prop('disabled', false);
        var item_truck_id = $(el).val();
        $('ul#distances_list li').each(function () {
            if ($(this).attr('s-truck') == item_truck_id) {
                $('#item_state option[value="' + $(this).attr('s-state') + '"]').prop('disabled', true).hide();
            }
        });
    }


    this.showFieldModal = function (index) {
        var modal_message = '';
        var visibleLi = 0;
        modal_message += '<ul class="equipment_add_list ' + index + '">';
        if (index == 'docs') {
            modal_message += '<li><input type="text" id="add_field_docs" value="" placeholder="Input reference"/><span class="add_eq blue-border" eq-id="-1" eq-type="' + index + '" onclick="logbook.equipmentAdd(this);">Add</span></li>';
        }
        var obj_name;
        if (self.user_info[index].length > 0) {
            $.each(self.user_info[index], function (key, obj) {
                if (index == 'docs') {
                    if (typeof obj.reference != 'undefined' && obj.reference)
                        obj_name = obj.reference;
                    else
                        obj_name = obj.docTypeName + ' ' + timeFromSQLDateTimeStringToUSAString(obj.date.substring(0, 10));
                } else
                    obj_name = obj.Name;

                var is_hidden = $('ul#' + index + '_list').is(':has(li#item_' + obj.id + ')') ? 1 : 0;
                visibleLi += !is_hidden;
                modal_message += '<li id="' + index + '_' + obj.id + '" style="' + (is_hidden ? 'display:none' : '') + '"><span class="li_name">' + obj_name + '</span>';
                modal_message += '<span class="add_eq blue-border" eq-name="' + obj_name + '" eq-id="' + obj.id + '" eq-type="' + index + '" onclick="logbook.equipmentAdd(this);">Add</span>';
                modal_message += '</li>';
            });
        } else {
            visibleLi = 0;
        }
        modal_message += '</ul>';
        if (visibleLi == 0 && index != 'docs') {
            var field_title = '';
            switch (index) {
                case 'docs':
                    field_title = 'docs';
                    break;
                case 'vehicle':
                    field_title = 'trucks';
                    break;
                case 'trailers':
                    field_title = 'trailers';
                    break;
            }
            modal_message += 'You have no ' + field_title;
        }
        switch (index) {
            case 'vehicle':
                modal_message = '<p><input style="width:100%" type="text" placeholder="Filter" onkeyup="logbook.filterEditSearch(this)"/></p>' + modal_message;
                break;
            case 'trailers':
                modal_message = '<p><input style="width:100%" type="text" placeholder="Filter" onkeyup="logbook.filterEditSearch(this)"/></p>' + modal_message;
                break;
        }
        var modal_title = index == 'vehicle' ? 'Add truck' : 'Add ' + index;
        showModal(modal_title, modal_message, 'basicModal');
    }
    this.filterEditSearch = function (el) {
        var val = $(el).val();
        $('.equipment_add_list li').show();
        if (val == '') {
            return true;
        }
        $('.equipment_add_list .li_name').each(function () {
            var li_val = $(this).text();
            if (li_val.toLowerCase().indexOf(val.toLowerCase()) == -1) {
                $(this).parent().hide();
            }
        });
    }
    this.equipmentAdd = function (el) {
        var type = $(el).attr('eq-type'),
            id = $(el).attr('eq-id'),
            old_value = self.edit_lists[type],
            name = '';
        $(el).removeClass('error');
        if (id == -1 && type == 'docs') {
            name = $('#add_field_docs').val();
            if (!name || name.length > 64) {
                $('#add_field_docs').addClass('error');
                return false;
            }
        } else {
            name = $(el).attr('eq-name');
        }
        old_value.push({id: id, name: name});
        var new_field = '<li id="item_' + id + '"><span class="field_text">' + name + '</span>';
        new_field += '<span class="removeEq" eq-id="' + id + '" eq-type="' + type + '" onclick="logbook.equipmentRemove(this)"></span>';
        new_field += '</li>';
        $('#field_' + type).find('ul').append(new_field);
        var span_size = $('#field_' + type).find('ul li').length % 3;
        $('#field_' + type).find('.edit_main_info_btn').removeClass('span0').removeClass('span1').removeClass('span2').addClass('span' + span_size);
        $('#basicModal').modal('hide');
        //$('li#'+type+'_'+id).hide();
    }

    this.equipmentRemove = function (el) {
        var type = $(el).attr('eq-type');
        var id = $(el).attr('eq-id');
        var name = $(el).closest('li').find('.field_text').text();
        $(el).parent('li').remove();
        var old_value = self.edit_lists[type];
        for (var x = 0; x < old_value.length; x++) {
            if (id == -1) {
                var old_name = old_value[x].name;
                old_name = old_name == null ? 'undefined' : old_name;
                if (old_name == name) {
                    old_value.splice(x, 1);
                    break;
                }
            } else if (old_value[x].id == id) {
                old_value.splice(x, 1);
                break;
            }
        }
        var span_size = $('#field_' + type).find('ul li').length % 3;
        $('#field_' + type).find('.edit_main_info_btn').removeClass('span0').removeClass('span1').removeClass('span2').addClass('span' + span_size);
    }

    this.selectCarrierChange = function () {
        var data = {driverId: $('#select_carrier option:selected').attr('data-driverid'), date: convertDateToSQL($('#datepicker').val(), false)};
        if (self.dbData.terminated)
            data.driverStatus = true;
        dc.getUrlContent('/dash/views/dispatcher/log/', data);
    }

    self.pdfReportData = [];
    self.pdfReportDriverId = 0;
    self.pdfReportDate = 0;

    self.showDriverPDFReportPopap = function (object = [], driverId = 0, date = 0) {
        self.pdfReportData = object;
        self.pdfReportDriverId = driverId;
        self.pdfReportDate = date;
        var title = 'Driver Report PDF Settings';
        var message = `<div class="row">
            <div class="form-group">
                <label class="col-sm-4" class="control-label">Download PDF report</label>
                <div class="col-sm-8">
                    <div class="check_buttons_block" id="downloadPDF">
                        <button type="button" class="btn btn-default active" onclick="doActive(this)" data-val="1">Download</button>
                        <button type="button" class="btn btn-default" onclick="doActive(this)" data-val="0">Off</button>
                    </div>
                </div>
            </div>
            <div class="form-group">
                <label class="col-sm-4" class="control-label">Send to email</label>
                <div class="col-sm-8">
                    <div class="check_buttons_block" id="send_to_email">
                        <button type="button" class="btn btn-default" onclick="doActive(this);logbook.changeSendToEmail(this);" data-val="1">Send</button>
                        <button type="button" class="btn btn-default active" onclick="doActive(this);logbook.changeSendToEmail(this);" data-val="0">Off</button>
                    </div>
                    <input type="text" class="form-control" id="userEmail" placeholder="Email (may be empty)" style="display:none;margin:5px 0;">
                </div>
            </div>
            <div class="form-group">
                <label class="col-sm-4" class="control-label">Include recap hours</label>
                <div class="col-sm-8">
                    <div class="check_buttons_block" id="include_recap">
                        <button type="button" class="btn btn-default active" onclick="doActive(this)" data-val="1">On</button>
                        <button type="button" class="btn btn-default" onclick="doActive(this)" data-val="0">Off</button>
                    </div>
                </div>
            </div>
            <div class="form-group">
                <label class="col-sm-4" class="control-label">Include DVIR</label>
                <div class="col-sm-8">
                    <div class="check_buttons_block" id="include_dvir">
                        <button type="button" class="btn btn-default active" onclick="doActive(this)" data-val="1">On</button>
                        <button type="button" class="btn btn-default" onclick="doActive(this)" data-val="0">Off</button>
                    </div>
                </div>
            </div>
            <div class="form-group">
                <label class="col-sm-4" class="control-label">Show DVIR Time</label>
                <div class="col-sm-8">
                    <div class="check_buttons_block" id="show_dvir_time">
                        <button type="button" class="btn btn-default active" onclick="doActive(this)" data-val="1">Yes</button>
                        <button type="button" class="btn btn-default" onclick="doActive(this)" data-val="0">No</button>
                    </div>
                </div>
            </div>
            <div class="form-group">
                <label class="col-sm-4" class="control-label">Attach Documents</label>
                <div class="col-sm-8">
                    <div class="check_buttons_block" id="include_document">
                        <button type="button" class="btn btn-default active" onclick="doActive(this)" data-val="1">On</button>
                        <button type="button" class="btn btn-default" onclick="doActive(this)" data-val="0">Off</button>
                    </div>
                </div>
            </div>
        </div>`;
        var id = 'driver_pdf_report_popap';
        showModal(title, message, id, '', {footerButtons: `<button class="btn btn-default" onclick="logbook.driversLogPdfClick(logbook.pdfReportData, logbook.pdfReportDriverId, logbook.pdfReportDate);">Generate PDF</button>`});
    }

    this.changeDownloadPDF = function (el) {
        var elAttr = $(el).attr('data-val');
        if (elAttr == 0) {
            if ($('#send_to_email button.active').attr('data-val') == 1) {
                $('#sixMonthDriverList').show();
            }
        } else {
            $('#sixMonthDriverList').hide();
        }
    }

    this.changeSendToEmail = function (el) {
        var elAttr = $(el).attr('data-val');
        if (elAttr == 1) {
            $('#userEmail').show();
            if ($('#downloadPDF button.active').attr('data-val') == 0) {
                $('#sixMonthDriverList').show();
            }
        } else {
            $('#userEmail').val('').hide();
            $('#sixMonthDriverList').hide();
        }
    }

    this.driversLogPdfClick = function (object, driverId, date) {
        $('#userEmail').removeClass('error');
        var data = {
            print_settings: {
                incl_recap: $('#include_recap .active').attr('data-val'),
                incl_dvir: $('#include_dvir .active').attr('data-val'),
                show_dvir_time: $('#show_dvir_time .active').attr('data-val'),
                sendToEmail: $('#send_to_email .active').attr('data-val'),
                userEmail: $('#userEmail').val(),
                same_page: 0,
                incl_odometer: 0,
                incl_docs: $('#include_document .active').attr('data-val'),
                incl_logbook: 1,
                incl_fromto: 1,
                type: driverId == 0 ? 'logbooks' : 'logbook',
                read: 0
            },
            dates: object
        };

        if (data.print_settings.type == 'logbooks') {
            data.print_settings.progressBar = 1;
            data.print_settings.progressBarUniqId = self.str_rand();
        }

        if ($('#send_to_email .active').attr('data-val') == 0 && $('#downloadPDF .active').attr('data-val') == 0) {
            return false;
        }

        if ($('#send_to_email .active').attr('data-val') == 1 && $('#userEmail').val() != '' && !validateEmail($('#userEmail').val())) {
            $('#userEmail').addClass('error');
            return false;
        }

        var params = {};
        if (date != 0) {
            params.date = date;
        }
        params.name = "CreatePDF";
        if (driverId != 0) {
            params.driver_id = driverId;
        }
        params.data = JSON.stringify(data);
        pdfGen.download = $('#downloadPDF .active').attr('data-val') == 1 ? true : false;
        pdfGen.generateAndSendForm(params, {'action': 'mergeLogbookDvirDocument'});
        $('#driver_pdf_report_popap').remove();
    }

    this.str_rand = function (count = 32) {
        var result = '';
        var words = '0123456789qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM';
        var max_position = words.length - 1;
        for (i = 0; i < count; ++i) {
            position = Math.floor(Math.random() * max_position);
            result = result + words.substring(position, position + 1);
        }
        return result;
    }

    this.PDF6MonthReport = function () {
        var data = {
            print_settings: {
                incl_recap: $('#include_recap .active').attr('data-val'),
                incl_dvir: $('#include_dvir .active').attr('data-val'),
                show_dvir_time: $('#show_dvir_time .active').attr('data-val'),
                sendToEmail: $('#send_to_email .active').attr('data-val'),
                userEmail: $('#userEmail').val(),
                same_page: 0,
                incl_odometer: 0,
                incl_docs: $('#include_document .active').attr('data-val'),
                incl_logbook: 1,
                incl_fromto: 1,
                type: $('#PDFType .active').attr('data-val') == 1 ? '6MonthReport' : 'FullReport',
                progressBar: 1,
                progressBarUniqId: self.str_rand(),
                read: 0
            },
            dates: [
            ]
        };

        if ($('#send_to_email .active').attr('data-val') == 0 && $('#downloadPDF .active').attr('data-val') == 0) {
            return false;
        }

        if ($('#send_to_email .active').attr('data-val') == 1 && $('#userEmail').val() != '' && !validateEmail($('#userEmail').val())) {
            $('#userEmail').addClass('error');
            return false;
        }

        var date = '';
        var countDates = $('#PDFType .active').attr('data-val') == 1 ? 182 : $('#tot_days').text();
        for (var i = 0; i <= countDates; i++) {
            var d1 = logbook.newDate();
            var d = logbook.newDate(d1.valueOf() + d1.getTimezoneOffset() * 60000 - (logbook.driverTimeZone) * 60 * 60000);
            d.setDate(d.getDate() - i);
            var month = '' + (d.getMonth() + 1),
                day = '' + d.getDate(),
                year = d.getFullYear();

            if (month.length < 2)
                month = '0' + month;
            if (day.length < 2)
                day = '0' + day;
            if (i == 0)
                date = [year, month, day].join('-');

            data.dates.push({date: [year, month, day].join('-')});
        }

        var params = {};
        params.date = date;
        params.name = "CreatePDF";
        params.driver_id = $('#log_box').attr('data-id');
        params.data = JSON.stringify(data);

        // pdfGen.preloader = true;
        pdfGen.download = $('#downloadPDF .active').attr('data-val') == 1 ? true : false;
        pdfGen.generateAndSendForm(params, {'action': 'mergeLogbookDvirDocument'});

        if ($('#sixMonthDriverList select').val() != null && $('#sixMonthDriverList select').val().length > 0 && data.print_settings.userEmail && $('#downloadPDF .active').attr('data-val') == 0) {
            $.each($('#sixMonthDriverList select').val(), function (key, userId) {
                params.driver_id = userId;

                data.print_settings.progressBarUniqId = self.str_rand();
                params.data = JSON.stringify(data);

                pdfGen.download = false;
                pdfGen.generateAndSendForm(params, {'action': 'mergeLogbookDvirDocument'});
            });
        }

    }

    self.show6MonthReportPDFPopap = function () {
        var driverList = '';
        c(fleetC.fleetUsers);
        $.each(fleetC.fleetUsers, function (key, oneUser) {
            if ((oneUser.companyPosition == 3 || oneUser.companyPosition == 7) && $('#log_box').attr('data-id') != oneUser.id) {
                driverList += `<option value="${oneUser.id}">${oneUser.name} ${oneUser.last}</option>`;
            }
        });
        var title = 'PDF report settings';
        var message = `<div class="row">
            <div class="form-group">
                <label class="col-sm-4" class="control-label">Report for</label>
                <div class="col-sm-8">
                    <div class="check_buttons_block" id="PDFType">
                        <button type="button" class="btn btn-default active" onclick="doActive(this)" data-val="1">6 Month</button>
                        <button type="button" class="btn btn-default" onclick="doActive(this)" data-val="0">Full</button>
                    </div>
                </div>
            </div>
            <div class="form-group">
                <label class="col-sm-4" class="control-label">Download PDF report</label>
                <div class="col-sm-8">
                    <div class="check_buttons_block" id="downloadPDF">
                        <button type="button" class="btn btn-default active" onclick="doActive(this);logbook.changeDownloadPDF(this);" data-val="1">Download</button>
                        <button type="button" class="btn btn-default" onclick="doActive(this);logbook.changeDownloadPDF(this);" data-val="0">Off</button>
                    </div>
                </div>
            </div>
            <div class="form-group">
                <label class="col-sm-4" class="control-label">Send to email</label>
                <div class="col-sm-8">
                    <div class="check_buttons_block" id="send_to_email">
                        <button type="button" class="btn btn-default" onclick="doActive(this);logbook.changeSendToEmail(this);" data-val="1">Send</button>
                        <button type="button" class="btn btn-default active" onclick="doActive(this);logbook.changeSendToEmail(this);" data-val="0">Off</button>
                    </div>
                    <input type="text" class="form-control" id="userEmail" placeholder="Email (may be empty)" style="display:none;margin:5px 0;">
                </div>
                <p id="sixMonthDriverList" class="col-sm-12" style="display:none;margin:5px 0;">
                    Hold down the Ctrl (windows) or Command (Mac) button to select multiple driver. To select all drivers, press CTRL + A (Windows) or Command + A (Mac).
                    <select multiple size="10" style="width:100%;">
                        ${driverList}
                    </select>
                </p>
            </div>
            <div class="form-group">
                <label class="col-sm-4" class="control-label">Include recap hours</label>
                <div class="col-sm-8">
                    <div class="check_buttons_block" id="include_recap">
                        <button type="button" class="btn btn-default active" onclick="doActive(this)" data-val="1">On</button>
                        <button type="button" class="btn btn-default" onclick="doActive(this)" data-val="0">Off</button>
                    </div>
                </div>
            </div>
            <div class="form-group">
                <label class="col-sm-4" class="control-label">Include DVIR</label>
                <div class="col-sm-8">
                    <div class="check_buttons_block" id="include_dvir">
                        <button type="button" class="btn btn-default active" onclick="doActive(this)" data-val="1">On</button>
                        <button type="button" class="btn btn-default" onclick="doActive(this)" data-val="0">Off</button>
                    </div>
                </div>
            </div>
            <div class="form-group">
                <label class="col-sm-4" class="control-label">Show DVIR Time</label>
                <div class="col-sm-8">
                    <div class="check_buttons_block" id="show_dvir_time">
                        <button type="button" class="btn btn-default active" onclick="doActive(this)" data-val="1">Yes</button>
                        <button type="button" class="btn btn-default" onclick="doActive(this)" data-val="0">No</button>
                    </div>
                </div>
            </div>
            <div class="form-group">
                <label class="col-sm-4" class="control-label">Attach Documents</label>
                <div class="col-sm-8">
                    <div class="check_buttons_block" id="include_document">
                        <button type="button" class="btn btn-default active" onclick="doActive(this)" data-val="1">On</button>
                        <button type="button" class="btn btn-default" onclick="doActive(this)" data-val="0">Off</button>
                    </div>
                </div>
            </div>
        </div>`;
        var id = '6month_pdf_report_popap';
        showModal(title, message, id, '', {footerButtons: '<button class="btn btn-default" data-dismiss="modal" onclick="logbook.PDF6MonthReport();">Generate PDF</button>'});
    }

    this.graphDragMousedown = function (el) {
        self.blockedLogbookOnClick = true;
        if ($(el).data('disabled')){
            return false;
        }

        let posX = [];
        var direction = $(el).attr('dir');
        if (direction == 0 && self.x1 == 0 && self.x2 == (self.isEld ? 1 : 7.75)){
            return false;
        }
        if (self.isSuperDrivingEdit) {
            (self.engineStatuses).forEach(status => {
                if (typeof status.dateTime !== 'undefined' && status.dateTime != '' && status.statusTypeId == 2) {
                    let x = self.convertTimeCoordToX(status.dateTime.substring(11));
                    let startPos = self.new_mode ? self.x11 : self.editedSegment.x1;
                    let endPos = self.new_mode ? self.x22 : self.editedSegment.x2;
                    if (x >= startPos && x <= endPos) {
                        status.x1 = x;
                        posX.push(status);
                    }
                }
            })
        }

        if (self.superInsert == 0 && self.new_mode && self.isSuperDrivingEdit) {
            self.beforeMoveArea(0);
            self.superInsert = 1;
        } else {
            self.beforeMoveArea(direction);
        }

        document.onmousemove = function (event) {
            self.SVGPoint.x = event.clientX;
            self.SVGPoint.y = event.clientY;
            var loc = self.SVGPoint.matrixTransform(self.svg.getScreenCTM().inverse());

            if (self.isSuperDrivingEdit) {
                let userInfo = curUserIsSmartSafety(self.userId, true);
                let koef = typeof userInfo.companyPosition !== 'undefined' && userInfo.companyPosition != 7 ? 2.5 : 0.5;
                if (!self.new_mode && (self.editedSegment.x2 + koef) <= loc.x) {
                    return false;
                }

                if (self.new_mode) {
                    if (loc.x >= self.x22 + koef || loc.x <= self.x11 - koef) {
                        return false;
                    }
                }

                if (posX.length > 0) {
                    posX.sort((a, b) => b.x1 - a.x1);
                    if (posX[0].x1 > loc.x && !self.new_mode) {
                        self.isSpecialEditingError = true;
                        self.graphDrawEditArea(self.x1, self.x2, true);
                        return false;
                    } else if (self.new_mode) {
                        let insertStatusX1 = direction == 0 ? loc.x : self.segments[self.superEditStatusIndex + 1].x1;
                        let insertStatusX2 = direction == 1 ? loc.x : self.segments[self.superEditStatusIndex + 1].x2;
                        let insertEngineStatuses = posX.filter(item => item.x1 >= insertStatusX1 && item.x1 <= insertStatusX2);
                        let shiftedMotions = [];
                        let idx = 1;
                        let inMotionCount = 0;
                        let err = false;

                        posX.reverse().map((item, index) => {
                            if (item.x1 >= insertStatusX2) {
                                let endTimeInsert = self.convertXCoordToTime(insertStatusX2, true);
                                let newEndTimeInsert = moment(self.todayDateString + ' ' + endTimeInsert).add(idx, 'h');
                                let newEndPosInsert = self.convertTimeCoordToX(newEndTimeInsert.format('HH:mm:ss'));

                                idx++;
                                inMotionCount++;

                                shiftedMotions.push({id: item.id, dateTime: newEndTimeInsert.format('YYYY-MM-DD HH:mm:ss')});

                                if (newEndPosInsert > self.x22) {
                                    err = true;
                                }
                            }
                        })

                        if (posX.length == inMotionCount) {
                            self.afterStatusId = self.segments[self.superEditStatusIndex].from.id;
                            self.isMotionStatus = false;
                        } else {
                            self.afterStatusId = posX.reverse()[inMotionCount].id;
                            self.isMotionStatus = true;
                        }

                        self.motionStatuses = err ? [] : shiftedMotions;

                        err = err || insertEngineStatuses.length > 0;

                        if (err) {
                            self.isSpecialEditingError = true;
                            self.graphDrawEditArea(self.x1, self.x2, true);
                        } else {
                            self.isSpecialEditingError = false;
                        }
                    } else {
                        self.isSpecialEditingError = false;
                    }
                } else if (self.editedSegment.x2 - ((self.editedSegment.x2 - self.editedSegment.x1) / 3) >= loc.x && !self.new_mode) {
                    return false;
                } else {
                    self.isSpecialEditingError = false;
                    self.afterStatusId = self.segments[self.superEditStatusIndex].from.id;
                }

                if (Object.keys(self.editedSegment).length != 0 && (self.editedSegment.x2 != self.x2 || self.new_mode) && !self.isSpecialEditingError) {
                    $('#save_info').removeClass('disabled-btn');
                } else {
                    $('#save_info').addClass('disabled-btn');
                }
            }

            self.moveArea(direction, loc.x);
        };
        document.onmouseup = function () {
            self.afterMoveArea();
            document.onmousemove = document.onmouseup = null;
            window.setTimeout(function () {
                self.blockedLogbookOnClick = false;
            }, 50);

            if (self.isSuperDrivingEdit) {
                if (self.editedSegment.x2 === self.x2) {
                    $('#log_list .logbook_status.disabled-btn').removeClass('disabled-btn');
                } else {
                    $('#log_list .logbook_status:not(.hide-status, .editing)').addClass('disabled-btn');
                }
            }
        };
        el.ontouchmove = function (event) {
            var touch = event.touches[0];
            self.SVGPoint.x = touch.pageX;
            self.SVGPoint.y = touch.pageY;
            var loc = self.SVGPoint.matrixTransform(self.svg.getScreenCTM().inverse());

            self.moveArea(direction, loc.x);
        };
        el.ontouchend = function () {
            self.afterMoveArea();
            document.onmousemove = document.onmouseup = null;
            window.setTimeout(function () {
                self.blockedLogbookOnClick = false;
            }, 50);
        };
        return false;
    }

    this.saveLogbook = function () {
        var validate = true;
        if (window.location.pathname == "/dash/history/log/" && $('.log_tabs .log_tabs_el[data-tab="log"]').hasClass('active')) {
            validate = false;
        }
        var fields = {};
        var error = [];
        var fields_count = 0;
        var date = convertDateToSQL($('#datepicker').val());
        $('#edit_main_info').attr('disabled', true);
        if ($('#log_info.edit_active').length) {
            $('#save_info').attr('disabled', true);
            $('#cancel_distance').click();

            $('#log_info .edit_parameter input, #log_info .edit_parameter select').each(function () {
                $(this).val($(this).val().replace(/[\u0250-\ue007]/g, ''));
                var id = $(this).attr('id');
                var field = id.toString();
                var field_value = $(this).val();
                if (self.validateMainInfo(field, field_value) && validate) {
                    error.push(field);
                }
                fields[field] = $.trim(field_value);
                fields_count++;
            });
            $('.edit_parameter .error').removeClass('error');
            if (error.length > 0) {
                $.each(error, function (key, val) {
                    $('.edit_parameter #' + val).addClass('error');
                });
            }
            if (self.odometerId == 1) {
                fields['distance'] = self.converKmToMi(fields['distance']);
            }
            if (fields_count && !error.length) {
                fields['coDrivers'] = '';
                $.each(self.edit_lists['coDriversIds'], function (key, val) {
                    if (key == 0) {
                        fields['coDrivers'] = val.name;
                    } else {
                        fields['coDrivers'] += ', ' + val.name;
                    }
                });
                if (fields['coDrivers'] == '' && $.trim(self.dbData.coDrivers) != '' && self.dbData.coDriversIds.length == 0) {
                    fields['coDrivers'] = $.trim(self.dbData.coDrivers);
                }
                fields['coDriversIds'] = self.edit_lists['coDriversIds'];

                fields['date'] = date;
                fields['trucks'] = self.edit_lists['vehicle'];
                fields['trailers'] = self.edit_lists['trailers'];
                fields['shippingDocs'] = [];
                fields['shippingDocsFull'] = self.edit_lists['docs'];
                $.each(self.edit_lists['docs'], function (key, doc) {
                    var oneDoc = {};
                    oneDoc.id = doc.id;
                    if (oneDoc.id <= 0) {
                        oneDoc = doc;
                    }
                    fields['shippingDocs'].push(oneDoc);
                });
                fields['homeTerminal'] = {};
                fields['homeTerminal'].address = fields['homeTerminal_address'];
                fields['homeTerminal'].city = fields['homeTerminal_city'];
                fields['homeTerminal'].state = fields['homeTerminal_state'];
                fields['homeTerminal'].zip = fields['homeTerminal_zip'];
                fields['officeAddress'] = {};
                fields['officeAddress'].address = fields['mainOffice_address'];
                fields['officeAddress'].city = fields['mainOffice_city'];
                fields['officeAddress'].state = fields['mainOffice_state'];
                fields['officeAddress'].zip = fields['mainOffice_zip'];
                var distances = [];
                var totalDistance = 0;
                $('ul#distances_list li').each(function () {
                    var state = parseInt($(this).attr('s-state')),
                        distance_id = $(this).attr('s-id'),
                        distance = toFixedFloat($(this).attr('s-distance'), 12),
                        truck = parseInt($(this).attr('s-truck'));
                    totalDistance += distance;
                    var item = {id: distance_id, state: state, truck: truck, distance: distance, odometerStart: 0, odometerEnd: 0};
                    distances.push(item);
                });
                fields['distances'] = distances;
                if (self.iftaDistances)
                    fields['distance'] = toFixedFloat(totalDistance, 12);
                fields['signature'] = typeof fields['signature'] == 'undefined' ? 0 : fields['signature'];
            }
        }
        if (typeof fields.shippingDocs == 'object')
            $.each(fields.shippingDocs, function (key, doc) {
                if ((parseInt(doc.id) || 0) <= 0)
                    doc.name = doc.name == null ? 'empty' : doc.name;
            });
        if (typeof fields.shippingDocsFull == 'object')
            $.each(fields.shippingDocsFull, function (key, doc) {
                if ((parseInt(doc.id) || 0) <= 0)
                    doc.name = doc.name == null ? 'empty' : doc.name;
            });
        var additionalParams = {};
        if ($('#defferOff').length > 0) {
            additionalParams.defferOff = $('#defferOff button').length > 0 ? parseInt($('#defferOff button.active').attr('data-val')) : 0;
        }
        if (!error.length) {
            var statuses = self.getStatusesForSave();
            var data = {date: date, fields: fields, driverId: self.userId, statuses: statuses, additionalParams: additionalParams};
            setPreloader(`<div id="preloader"><div id="loader"></div></div>`);
            AjaxController('saveLogbookData', data, apiLogbookUrl, self.saveLogbookHandler, self.saveLogbookHandlerError, true);
        }
    }

    this.getStatusesForSave = function () {
        $('#editAnnotation').removeClass('error');
        var editAnnotation = $('#editAnnotation').val().trim();
        if ($('#annotation_select').val() == -1 && (editAnnotation == '' || editAnnotation.length > 60)) {
            $('#editAnnotation').addClass('error');
            return false;
        }
        var edits = [];
        var page_date = self.newDate(self.todayDateString);
        $('#edit_buttons').remove();
        $(".statusArea, .area_tooltip, .area_time, .working_line.second").remove();

        if (self.new_mode) {
            self.updateSegmentsFromAfterMove();
        }

        $('#time_control').timeEntry('option', 'minTime', null);
        $('#time_control').timeEntry('option', 'maxTime', null);

        if (self.segments.length == 0) {
            $('#log_control').hide();
            self.leaveEditMode();
            self.pendingViewReturn();
            return false;
        }
        var statusMatch, status_changed;
        $.each(self.originalSegments, function (key1, originalSegment) {
            statusMatch = false;
            status_changed = 0;

            $.each(self.segments, function (key2, segment) {
                if (segment.from.id == originalSegment.from.id) {
                    statusMatch = JSON.parse(JSON.stringify(segment));
                    if (segment.from.id < 0) {
                        statusMatch.orig = JSON.parse(JSON.stringify(segment.from));
                    } else {
                        statusMatch.orig = JSON.parse(JSON.stringify(originalSegment.from));
                    }
                }
            });

            if (!statusMatch) {
                if (originalSegment.from.originalDateTime.substring(0, 10) == self.todayDateString) {
                    edits.push({id: originalSegment.from.id, deleted: true, dateTime: originalSegment.from.dateTime, status: self.statusLiteralToNumderConvert(originalSegment.from.status)})
                }
            } else {
                var newStatusType = self.statusLiteralToNumderConvert(statusMatch.status);

                if (statusMatch.from.special != originalSegment.from.special) {
                    statusMatch.orig.special = statusMatch.from.special;
                    status_changed = 1;
                }
                if (JSON.stringify(statusMatch.from.specials) != JSON.stringify(originalSegment.from.specials)) {
                    statusMatch.orig.specials = statusMatch.from.specials;
                    status_changed = 1;
                }
                if (statusMatch.from.lt != originalSegment.from.lt) {
                    statusMatch.orig.lt = statusMatch.from.lt;
                    status_changed = 1;
                }
                if (statusMatch.from.lng != originalSegment.from.lng) {
                    statusMatch.orig.lng = statusMatch.from.lng;
                    status_changed = 1;
                }
                if (statusMatch.from.message != originalSegment.from.message && (statusMatch.from.message.length > 0 || (originalSegment.from.message != null && originalSegment.from.message.length > 0))) {
                    statusMatch.orig.message = statusMatch.from.message;
                    status_changed = 1;
                }
                if (!statusMatch.from.position) {
                    statusMatch.orig.position = 'UNKNOWN';
                    status_changed = 1;
                } else if (statusMatch.from.position != originalSegment.from.position) {
                    statusMatch.orig.position = statusMatch.from.position;
                    status_changed = 1;
                }
                if (JSON.stringify(statusMatch.from.documents) != JSON.stringify(originalSegment.from.documents)) {
                    statusMatch.orig.documents = statusMatch.from.documents;
                    status_changed = 1;
                }
                if (statusMatch.x1 != originalSegment.x1 || parseInt(newStatusType) != self.statusLiteralToNumderConvert(statusMatch.orig.status) || status_changed) {
                    if (self.originalSegments.length == 1 && self.segments.length == 1) {
                        statusMatch.orig.id = self.nextNewId;
                        self.nextNewId--;
                    }
                    var time = self.convertXCoordToTime(statusMatch.x1, 1);
                    if (statusMatch.x1 == self.svg_width) {
                        if ($.type(self.todaysDate) == 'date') {
                            statusMatch.orig.dateTime = convertDateToSQL(self.todaysDate, true);
                        } else {
                            var tomorrow_date_string = self.newDate(self.todayDateString + 'T00:00:00');
                            tomorrow_date_string.setDate(tomorrow_date_string.getDate() + 1);
                            statusMatch.orig.dateTime = convertDateToSQL(tomorrow_date_string, true);
                        }
                    } else {
                        statusMatch.orig.dateTime = self.todayDateString + ' ' + time;
                    }
                    statusMatch.orig.annotation = '';
                    statusMatch.orig.status = newStatusType;
                    statusMatch.orig.editAnnotation = editAnnotation ? editAnnotation : 'No reason selected';
                    if (key1 == 0 && statusMatch.orig.coming_from_prev_day) {
                        statusMatch.orig.id = self.nextNewId;
                        self.nextNewId--;
                    }
                    edits.push(statusMatch.orig);
                }
            }
        });

        // add new inserted statuses
        $.each(self.segments, function (key4, segment) {
            var alreadyInEdit = false;
            $.each(edits, function (key5, editStatus) {
                if (segment.from.id == editStatus.id) {
                    alreadyInEdit = true;
                }
            });
            if (segment.from.id < 0 && !alreadyInEdit) {
                var time = self.convertXCoordToTime(segment.x1, 1);
                segment.from.dateTime = self.todayDateString + ' ' + time;

                segment.from.status = self.statusLiteralToNumderConvert(segment.status);
                if ($('#annotation_select').val() > 0 && editAnnotation)
                    segment.from.editAnnotation = editAnnotation;
                edits.push(segment.from);
            }
        });
        var originaLastStatusCopy;
        //if last status is new - create previous last as first for tomorrow
        if (self.todaysDate === false && self.statusLiteralToNumderConvert(self.segments[self.segments.length - 1].from.status) != self.originStatuses[self.originStatuses.length - 1].status && self.firstStatusInNextDay == 0) {
            originaLastStatusCopy = JSON.parse(JSON.stringify(self.originalSegments[self.originalSegments.length - 1].from));
            originaLastStatusCopy.id = self.nextNewId;
            self.nextNewId--;
            originaLastStatusCopy.moveToNewDate = 1;
            var tomorrow_date_string = self.newDate(self.todayDateString);
            tomorrow_date_string.setDate(tomorrow_date_string.getDate() + 1);
            tomorrow_date_string = convertDateToSQL(tomorrow_date_string, false);
            var time = self.convertXCoordToTime(0, 1);
            originaLastStatusCopy.dateTime = tomorrow_date_string + ' ' + time;
            originaLastStatusCopy.status = self.statusLiteralToNumderConvert(originaLastStatusCopy.status);
            edits.push(originaLastStatusCopy);
        }
        // save last current status for current day, forbidden to change "current" status
        if (self.todayX !== false && self.segments[self.segments.length - 1].status != self.originalSegments[self.originalSegments.length - 1].status) {
            originaLastStatusCopy = JSON.parse(JSON.stringify(self.originalSegments[self.originalSegments.length - 1].from));
            originaLastStatusCopy.id = self.nextNewId;
            self.nextNewId--;
            originaLastStatusCopy.moveToNewDate = 1;
            originaLastStatusCopy.dateTime = convertDateToSQL((self.isEld ? self.todaysDate : self.dateTimeToNearest15Mins(self.todaysDate)), true);
            originaLastStatusCopy.status = self.statusLiteralToNumderConvert(originaLastStatusCopy.status);
            edits.push(originaLastStatusCopy);
        }

        edits.sort(function (a, b) {
            return self.newDate(a.dateTime) - self.newDate(b.dateTime);
        });

        $('#log_control').hide();
        self.leaveEditMode();
        self.pendingViewReturn();

        return edits;
    }
    this.saveLogbookHandler = function (responce) {
        deletePreloader('preloader');
        if (responce.data.hasChanges) {
            self.saveLogbookAfter(responce.data.directSave, responce.data.editHimself);
            self.changeLogbook();
        }
        $('#edit_main_info').attr('disabled', false);
    }
    self.saveLogbookAfter = function (directSave, editHimself) {
        var head = `Edit Approval`;
        var content = `<p class="text-center">The revised logs have been sent to the driver, please wait for the drivers approval message.<br>
            You'll receive an alert notification once approved or rejected</p>`;
        if (self.terminated) {
            head = `Correction Saved`;
            content = `<p class="text-center">You have successfully saved the corrected Logs, Note that terminated driver logbook now can differ from driver side logbook.</p>`;
        } else if (editHimself) {
            head = `Correction Saved`;
            content = `<p class="text-center">You have successfully saved the corrected Logs</p>`;
        } else if (directSave) {//was direct edit without approval
            content = `<p class="text-center">The revised logs have been saved, untill the next app update for the correct work of the driver logbook - ask driver to relogin</p>`;
            if (self.isAobrd || !self.isEld) {
                head = `Correction Saved`;
                content = `<p class="text-center">You have successfully saved the corrected Logs. The driver will get a pop up 	notification to sign the corrected log. Pls make sure the driver signs the logs, by doing so they will be re-certify. </p>`;
            }
        }
        showModal(head, content);
    }
    this.saveLogbookHandlerError = function (responce) {
        $('#save_info').attr('disabled', true);
        $('#edit_main_info').attr('disabled', false);
        showModal('Error on Edit', responce.message, 'basicModal');
        return false;
    }
    this.dateTimeToNearest15Mins = function (dateTime) {
        var mins = dateTime.getMinutes();
        if (mins >= 45)
            mins = 45;
        else if (mins >= 30)
            mins = 30;
        else if (mins >= 15)
            mins = 15;
        else
            mins = 0;
        dateTime.setMinutes(mins);
        dateTime.setSeconds(0);
        return dateTime;
    }

    this.statusLiteralToNumderConvert = function (status) {
        var status_arr = ['on', 'dr', 'sb', 'off'];
        if ($.inArray(status, status_arr) != -1)
            return status_arr.indexOf(status);
        return status;
    }
    this.statusNumderToLiteralConvert = function (status) {
        var status_arr = ['on', 'dr', 'sb', 'off'];
        if (typeof status_arr[status] != 'undefined')
            return status_arr[status];
        return status;
    }

    this.addError = function (w, x2, y, statsDur, from, eld = 0, error_status, errors) {
        var df = (statsDur - from) / 60,
            hours = Math.floor(df / 60),
            x1 = mins = 0,
            colr = '#ed5554';
        if (eld) {
            mins = (df - hours * 60);
            x1 = x2 - (hours + mins / 60) * w;
        } else {
            mins = (df - hours * 60) / 15;
            x1 = x2 - (hours + mins / 4) * w;
        }
        self.drawLine(x1, x2, y, y, 'working_line violation_triangle', colr);
        if (typeof errors[df] == 'undefined') {
            errors[df] = {x1: x1, st: []};
        }
        errors[df].st.push(error_status);
        return errors;
    }
    this.violationTriangleBox = function (el) {
        var errorsText = '';
        var errorsNum = 0;
        if ($(el).attr('data-14') == '14') {
            numbers = self.getViolationsNumbersFromCycleId(driverCycle);
            errorsText += '<p>"Shift Hours" violation, Shift reset required</p>';
            errorsNum++;
        }
        if ($(el).attr('data-c') == 'c') {
            errorsText += '<p>"Cycle limit" violation, Cycle reset required</p>';
            errorsNum++;
        }
        if ($(el).attr('data-11') == '11') {
            numbers = self.getViolationsNumbersFromCycleId(driverCycle);
            errorsText += '<p>"Drive Hours" violation, Shift reset required</p>';
            errorsNum++;
        }
        if ($(el).attr('data-8') == '8') {
            errorsText += '<p>"No Break" violation, 30 minutes break required</p>';
            errorsNum++;
        }
        /*if ($(el).attr('data-c24') == 'c24') {
            errorsText += '<p>Canada 24 hours break required</p>';
            errorsNum++;
        }*/
        if ($(el).attr('data-sh') == 'sh') {
            errorsText += '<p>"Shift Work Hours" violation, Shift reset required</p>';
            errorsNum++;
        }
        $('svg#logBook').after('<div id="violations_box">' + errorsText + '</div>');
        var h = 16 + errorsNum * 42;
        $('#violations_box').css({height: h + 'px', top: '32px'});
    }
    this.violationTriangleBoxClose = function (el) {
        $('#violations_box').fadeOut(300, function () {
            $(this).remove();
        });
    }

    // mapppp
    this.showLocationMap = function (el) {
        if (!$(el).hasClass('active')) {
            $("#mapBlock").show();
            var lng = $('#longitude').val();
            var lat = $('#latitude').val();
            self.getStatusGeolocation();
            // self.initStatusMap();
            $(el).addClass('active').text('Close map');
        } else {
            $(el).removeClass('active').text('Show map');
            $("#mapBlock").hide();
        }
    }
    this.getStatusGeolocation = function () {
        var lng = $('#longitude').val();
        var lat = $('#latitude').val();
        if (self.toInt(lng) != 0 && self.toInt(lat) != 0) {
            self.initStatusMap(lat, lng);
        } else {
            self.initStatusMap(40.708453, -74.00854);
            $('#longitude').val(-74.00854).trigger('change');
            $('#latitude').val(40.708453).trigger('change');
        }
    }
    this.editChangeStatusLocation = function (center) {
        $('#latitude').val(center.lat);
        $('#longitude').val(center.lng);
    }
    this.initStatusMap = function (lat, long) {
        hereMap.showMap('hereMapLogbookEdit');
        hereMap.setCenter({lat: lat, lng: long});
        hereMap.onChangeGetCenterLocation();
    }
    this.sendLocationFromLatLngHandler = function (data) {
        if (!self.isEditMode) {
            return 1;
        }
        var res = data.result;
        var placeObj = [];

        if (self.isEld && !self.isAobrd) {
            if (typeof res.Street !== 'undefined')
                placeObj.push(res.Street);
            if (typeof res.State !== 'undefined')
                placeObj.push(res.State);
            if (typeof res.Country !== 'undefined')
                placeObj.push(res.Country);
        } else {
            if (typeof res.Street !== 'undefined')
                placeObj.push(res.Street);
            if (typeof res.State !== 'undefined')
                placeObj.push(res.State);
        }
        var loc = res.searchStr.split(',')
        var textLocation = placeObj.length ? placeObj.join(", ") : 'UNKNOWN';
        $('#location_name').val(textLocation).trigger('change');
        $('#latitude').val(loc[0]).change();
        $('#longitude').val(loc[1]).change();
    }
    this.moveStatusMarker = function () {
        var location = $('#mapBlock div a')[0].href,
            stringLocStart = location.indexOf("ll="),
            stringLocFinish = location.indexOf("&");
        location = location.slice(stringLocStart + 3, stringLocFinish);
        if (!location) {
            return false;
        }
        var locationArr = location.split(","),
            lat = locationArr[0],
            lng = locationArr[1];

        $('#longitude').val(lng).trigger('change');
        $('#latitude').val(lat).trigger('change');
        plcApi.getLocationFromLatLng({lat: lat, lng: lng});
    }

    this.lastLocNotFromStatus = false;
    this.hasRoute = false;
    this.drawMapRoute = function (response, points) {
        cloudC_NoScanner = false;
        if ($('#drivers_table').length > 0 && ($('#drivers_table tr[data-id="' + self.userId + '"] .col_st .st_dr').length > 0 || $('#drivers_table tr[data-id="' + self.userId + '"] .col_st .st_on').length > 0)) {
            if ($('#drivers_table tr[data-id="' + self.userId + '"]').attr('data-scanner') != '' && !cloudC_NoScanner) {
                let scanner = $('#drivers_table tr[data-id="' + self.userId + '"]').attr('data-scanner');

                let reqData = {};
                reqData.userId = self.userId;
                reqData.macAddres = scanner;

                cloudC.getLastLocationByMacAddres(reqData);
                cloudC.runInterval();
            } else {
                liveUpdateC.subscribeForLocations(self.userId);
            }
        } else {
            cloudC.clearInterval();
            self.changeDriverLiveParams();
        }
        self.deleteMarkers();
        // resultsMap = document.getElementById("googleMap");
        // geocoder = new google.maps.Geocoder();
        var locations = [];
        points = JSON.parse(JSON.stringify(points));
        if (self.todaysDate && //only for today
            self.originStatuses[self.originStatuses.length - 1].status == 1 && //if last status driving
            new Date(self.lastLocationTime) > new Date(self.originStatuses[self.originStatuses.length - 1].dateTime) && //and last location is more fresh than status change
            self.lat != 0 && self.lat != -1 && self.lng != 0 && self.lng != -1) {//and correct location
            points.push({lt: self.lat, lng: self.lng, current: true});
            self.lastLocNotFromStatus = true;
        } else {
            self.lastLocNotFromStatus = false;
        }
        for (var x = 0; x < points.length; x++) {
            var point = points[x];
            if (typeof point.lt == undefined || typeof point.lng == undefined) {
                continue;
            }
            var pos = {};
            pos.lt = point.lt;
            pos.lng = point.lng;
            pos.status = point.status;
            if (point.current) {
                pos.status = 'cur';
            }
            pos.key = x;
            if (typeof point.current != 'undefined') {
                pos.key = -1;
            }
            if (point.lt != '' && point.lt != 'null' && point.lt != null && point.lt != 0 && point.lt != -1) {
                locations.push(pos);
            }
        }
        //get current route points
        var curLocation = [];

        if (response.data.currentRoute != '') {
            for (var x = 0; x < 3; x++) {
                if (x == 0) {
                    var pos = {};
                    pos.lt = response.data.currentRoute.startLatitude;
                    pos.lng = response.data.currentRoute.startLongitude;
                    curLocation.push(pos);
                } else if (x == 2) {
                    var pos = {};
                    pos.lt = response.data.currentRoute.endLatitude;
                    pos.lng = response.data.currentRoute.endLongitude;
                    curLocation.push(pos);
                } else {
                    $.each(response.data.currentRoute.waypoints, function (k, val) {
                        var pos = {};
                        pos.lt = val.latitude;
                        pos.lng = val.longitude;
                        curLocation.push(pos);
                    });
                }
            }
        }

        if (locations.length > 0 || curLocation.length > 0) {
            self.lastLocNotFromStatus = false;
            if (typeof hMap !== 'undefined') {
                if (locations.length > 0) {
                    self.makeRoute(hMap, locations);
                }
                if (curLocation.length > 0) {
                    self.makeCurRoute(curLocation, response.data.currentRoute.TruckDimensions);
                }
            }
        } else {
            self.deleteMarkers();
            hMap.setCenter({lat: 45.508742, lng: -90.120850});
            hMap.setZoom(3);
        }
    }
    self.lastMarker;
    this.updateMarkerLocation = function (locInfo) {
        if (logbook.userId != locInfo.userId || !self.todaysDate || self.originStatuses[self.originStatuses.length - 1].status == 2 || self.originStatuses[self.originStatuses.length - 1].status == 3) {
            return 1;
        }
        if (typeof hMap == 'undefined') {
            return 1;
        }
        self.lastLocationTime = convertDateToSQL(new Date(), true);
        self.lat = locInfo.lat;
        self.lng = locInfo.lng;
        var fuelPercent = locInfo.fuelPercent;
        var fuelRate = locInfo.fuelRate;
        var speed = locInfo.speed;
        var voltage = locInfo.voltage;
        if (self.lastLocNotFromStatus) {
            // self.lastMarker = self.hasRoute ? hMap.getObjects()[hMap.getObjects().length - 2] : hMap.getObjects()[hMap.getObjects().length - 1];
            self.lastMarker.setPosition({lat: self.lat, lng: self.lng})
        } else {
            var icon = new H.map.Icon("/dash/assets/img/logbook/truck.svg", {"size": {"w": 35, "h": 35}});
            var marker = new H.map.Marker({lat: self.lat, lng: self.lng}, {icon: icon});

            hMap.addObject(marker);
            self.hasRoute = false;
            self.lastLocNotFromStatus = true;
            self.lastMarker = hMap.getObjects()[hMap.getObjects().length - 1];
        }
        if (!self.mapMoved) {
            hMap.setCenter({lat: self.lat, lng: self.lng});
        }
        if (fuelPercent || fuelRate || speed || voltage || fuelPercent == 0 || fuelRate == 0 || speed == 0 || voltage == 0) {
            if (!$('#driverLiveParameters').is(':visible')) {
                self.changeDriverLiveParams();
            }
            speed = isNaN(parseFloat(speed)) ? 'N/A' : toFixedFloat(speed, 2);
            fuelRate = (isNaN(parseFloat(fuelRate)) || fuelRate == 0) ? 'N/A' : toFixedFloat(fuelRate, 2);
            voltage = isNaN(parseFloat(voltage)) ? 'N/A' : toFixedFloat(voltage, 2);
            fuelPercent = isNaN(parseFloat(fuelPercent)) ? 'N/A' : toFixedFloat(fuelPercent, 2);
            $('#speedLive').text(speed + ' MPH');
            $('#fuelRateLive').text(fuelRate + ' GPH');
            $('#fuelPercentLive').text(fuelPercent + '%');
            $('#voltageLive').text(voltage + ' V');
        }
    }
    this.deleteMarkers = function () {
        if (hMap.getObjects().length > 0)
            hMap.removeObjects(hMap.getObjects());
    }
    this.getMarkerColor = function (status) {
        var clr = '';
        if (status == 'sb') {
            clr = 'FFB607';
        } else if (status == 'on') {
            clr = '3498DB';
        } else if (status == 'dr') {
            clr = '74bf61';
        } else {
            clr = 'C5C5C5';
        }
        return clr;
    }
    this.makeRoute = function (resultsMap, points) {
        self.hasRoute = false;
        var wps = [];
        if (points.length == 1) {
            var point = points[0];
            var coords = {lat: point.lt, lng: point.lng};
            var stColor = self.getMarkerColor(point.status);
            var txt = typeof point.key == 'undefined' || point.key == -1 ? '' : point.key + 1;
            var iconTemplate = '<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"\n\
                width="28px" height="37.5px" viewBox="0 0 28 37.5" style="enable-background:new 0 0 28 37.5;" xml:space="preserve">\n\
            <style type="text/css">\n\
                .st0{fill:#FFFFFF;stroke:#' + stColor + ';stroke-width:2;}\n\
                .st1{fill:#' + stColor + ';}\n\
            </style>\n\
            <title>st_dr</title>\n\
            <g>\n\
                <path class="st0" d="M14,1c7.2,0,13,5.8,13,13S14,36,14,36S1,21.2,1,14S6.8,1,14,1z"/>\n\
                <text x="14" y="19" font-size="11pt" font-weight="bold" text-anchor="middle" fill="#' + stColor + '">' + txt + '</text>\n\
            </g>\n\
            </svg>\n\
            ';
            var icon = new H.map.Icon(iconTemplate, {"size": {"w": 26, "h": 35}});
            if (self.lastLocNotFromStatus) {
                icon = new H.map.Icon("/dash/assets/img/logbook/truck.svg", {"size": {"w": 35, "h": 35}});
            }
            var marker = new H.map.Marker(coords, {icon: icon});
            hMap.addObject(marker);
            if (self.lastLocNotFromStatus) {
                self.lastMarker = hMap.getObjects()[hMap.getObjects().length - 1];
            }
            hMap.setCenter(coords);
            hMap.setZoom(13);
            return 1;
        }
        var routingParameters = {
            'mode': 'fastest;car',
            'representation': 'display'
        };
        for (var x = 0; x < points.length; x++) {
            var point = points[x];
            var stColor = self.getMarkerColor(point.status);
            var txt = typeof point.key == 'undefined' || point.key == -1 ? '' : point.key + 1;
            var iconTemplate = '<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"\n\
                width="28px" height="37.5px" viewBox="0 0 28 37.5" style="enable-background:new 0 0 28 37.5;" xml:space="preserve">\n\
            <style type="text/css">\n\
                .st0{fill:#FFFFFF;stroke:#' + stColor + ';stroke-width:2;}\n\
                .st1{fill:#' + stColor + ';}\n\
            </style>\n\
            <title>st_dr</title>\n\
            <g>\n\
                <path class="st0" d="M14,1c7.2,0,13,5.8,13,13S14,36,14,36S1,21.2,1,14S6.8,1,14,1z"/>\n\
                <text x="14" y="19" font-size="11pt" font-weight="bold" text-anchor="middle" fill="#' + stColor + '">' + txt + '</text>\n\
            </g>\n\
            </svg>\n\
            ';
            var icon = new H.map.Icon(iconTemplate, {"size": {"w": 26, "h": 35}});
            if (x == points.length - 1 && (self.lastLocNotFromStatus || point.status == 'cur')) {
                icon = new H.map.Icon("/dash/assets/img/logbook/truck.svg", {"size": {"w": 35, "h": 35}});
            }
            var coords = {lat: point.lt, lng: point.lng};
            var marker = new H.map.Marker(coords, {icon: icon});
            hMap.addObject(marker);
            routingParameters['waypoint' + x] = 'geo!' + point.lt + ',' + point.lng;
        }
        var router = platform.getRoutingService();
        var onResult = function (result) {
            var route,
                routeShape,
                startPoint,
                endPoint,
                linestring;
            if (typeof result.response == 'undefined') {
                var point = points[points.length - 1];
                var coords = {lat: point.lt, lng: point.lng};
                hMap.setCenter(coords);
                return 1;
            }
            if (result.response.route) {
                self.hasRoute = true;
                // Pick the first route from the response:
                route = result.response.route[0];
                // Pick the route's shape:
                routeShape = route.shape;

                // Create a linestring to use as a point source for the route line
                linestring = new H.geo.LineString();

                // Push all the points in the shape into the linestring:
                routeShape.forEach(function (point) {
                    var parts = point.split(',');
                    linestring.pushLatLngAlt(parts[0], parts[1]);
                });
                // Create a polyline to display the route:
                var routeLine = new H.map.Polyline(linestring, {
                    style: {strokeColor: 'rgba(93, 170, 18, 0.5)', lineWidth: 10}
                });

                // Add the route polyline and the two markers to the map:
                hMap.addObjects([routeLine]);

                // Set the map's viewport to make the whole route visible:
                hMap.setViewBounds(routeLine.getBounds());
            }
        };
        router.calculateRoute(routingParameters, onResult,
            function (error) {
                alert(error.message);
            });
    }

    this.isEmpty = function (obj) {
        for (var key in obj) {
            if (obj.hasOwnProperty(key))
                return false;
        }
        return true;
    }

    this.makeCurRoute = function (points, params) {
        var routingParameters = {
            'mode': 'fastest;truck;traffic:enabled;boatFerry:-1',
            'representation': 'display',
            'routeAttributes': 'waypoints,summary,shape,legs'
        };

        if (!self.isEmpty(params)) {
            var feet = 0.3048;
            var ton = 0.00045359237;
            if (params.width != '0' || params.width != '') {
                routingParameters.vehicleWidth = (params.width * feet);
            }
            if (params.height != '0' || params.height != '') {
                routingParameters.vehicleHeight = (params.height * feet) + 'm';
            }
            if (params.length != '0' || params.length != '') {
                routingParameters.vehicleLength = (params.length * feet) + 'm';
            }
            if (params.weight != '0' || params.weight != '') {
                routingParameters.limitedVehicleWeight = (params.weight * ton) + 't';
            }
        }

        for (var x = 0; x < points.length; x++) {
            var point = points[x];

            var coords = {lat: point.lt, lng: point.lng};
            var marker = new H.map.Marker(coords);
            hMap.addObject(marker);
            routingParameters['waypoint' + x] = 'geo!' + point.lt + ',' + point.lng;
        }

        var router = platform.getRoutingService();

        var onResult = function (result) {
            var route,
                routeShape,
                startPoint,
                endPoint;
            if (result.response.route) {
                var ajaxData = {};//request data to calculateFutureViolationsInTrip
                ajaxData['driverId'] = self.userId;

                self.hasRoute = true;
                // Pick the first route from the response:
                route = result.response.route[0];
                // Pick the route's shape:
                routeShape = route.shape;

                ajaxData['route'] = route.shape;//include lat and lng route
                ajaxData['routeInfo'] = route.summary;//info about route

                // Push all the points in the shape into the linestring:
                var minDistanse;
                var keyOfMinDis;
                var driverDistanceFromSP = 0;
                if (self.lat != 0 && self.lng != 0) {
                    routeShape.forEach(function (point, k) {
                        var parts = point.split(',');
                        if (k == 0) {
                            minDistanse = self.getDistance(self.lat, self.lng, parts[0], parts[1]);
                            keyOfMinDis = k;
                        } else {
                            if (minDistanse > self.getDistance(self.lat, self.lng, parts[0], parts[1])) {
                                minDistanse = self.getDistance(self.lat, self.lng, parts[0], parts[1]);
                                keyOfMinDis = k;
                                driverDistanceFromSP += self.getDistance(routeShape[k - 1].split(',')[0], routeShape[k - 1].split(',')[1], parts[0], parts[1]);
                            }
                        }
                    });
                }

                if (typeof keyOfMinDis != 'undefined') {
                    ajaxData['driverDistanceFromSP'] = driverDistanceFromSP;
                    ajaxData['currentDriverPosition'] = {routeKey: keyOfMinDis, lat: routeShape[keyOfMinDis].split(',')[0], lng: routeShape[keyOfMinDis].split(',')[1]};
                }

                ajaxData['todaysDate'] = convertDateToSQL(self.todaysDate, true);


                AjaxController('calculateFutureViolationsInTrip', ajaxData, apiDashUrl, self.calculateFutureViolationsInTripHandler, self.calculateFutureViolationsInTripHandler, true);

                var pastErrors = {};
                if (self.originStatuses[self.originStatuses.length - 1].drive <= 0 ||
                    self.originStatuses[self.originStatuses.length - 1].cycle <= 0 ||
                    self.originStatuses[self.originStatuses.length - 1].shift <= 0 ||
                    self.originStatuses[self.originStatuses.length - 1].eight <= 0) {
                    if (self.originStatuses[self.originStatuses.length - 1].eight <= 0) {
                        pastErrors['8'] = (90 * (Math.abs(self.originStatuses[self.originStatuses.length - 1].eight) / 60 / 60)) * 1000;
                    }
                    if (self.originStatuses[self.originStatuses.length - 1].cycle <= 0) {
                        pastErrors['c'] = (90 * (Math.abs(self.originStatuses[self.originStatuses.length - 1].cycle) / 60 / 60)) * 1000;
                    }
                    if (self.originStatuses[self.originStatuses.length - 1].shift <= 0) {
                        pastErrors['14'] = (90 * (Math.abs(self.originStatuses[self.originStatuses.length - 1].shift) / 60 / 60)) * 1000;
                    }
                    if (self.originStatuses[self.originStatuses.length - 1].drive <= 0) {
                        pastErrors['11'] = (90 * (Math.abs(self.originStatuses[self.originStatuses.length - 1].drive) / 60 / 60)) * 1000;
                    }
                    /*if (self.originStatuses[self.originStatuses.length - 1].hadCan24Break == 0) {
                        pastErrors['c24'] = self.originStatuses[self.originStatuses.length - 1].hadCan24Break;
                    }*/
                }

                var redIconV8 = new H.map.Icon("/dash/assets/img/logbook/SVG_red_pin_8.svg", {"size": {"w": 22.3, "h": 30}});
                var redIconV11 = new H.map.Icon("/dash/assets/img/logbook/SVG_red_pin_11.svg", {"size": {"w": 22.3, "h": 30}});
                var redIconV14 = new H.map.Icon("/dash/assets/img/logbook/SVG_red_pin_14.svg", {"size": {"w": 22.3, "h": 30}});
                var redIconVC = new H.map.Icon("/dash/assets/img/logbook/SVG_red_pin_c.svg", {"size": {"w": 22.3, "h": 30}});

                var redAlertLine = [];
                if (!$.isEmptyObject(pastErrors) && typeof keyOfMinDis != 'undefined') {
                    var draw8 = 0;
                    var drawc = 0;
                    var draw14 = 0;
                    var draw11 = 0;
                    for (var i = keyOfMinDis; i >= 0; i--) {
                        var parts = routeShape[i].split(',');
                        if (typeof pastErrors['8'] != 'undefined') {
                            if (self.getDistance(self.lat, self.lng, parts[0], parts[1]) <= pastErrors['8']) {
                                redAlertLine.push(i);
                                if (draw8 == 0) {
                                    draw8 = 1;
                                    var parts = routeShape[i + 1].split(',');
                                    var coords = {lat: parts[0], lng: parts[1]};
                                    var marker = new H.map.Marker(coords, {icon: redIconV8});
                                    hMap.addObject(marker);
                                }
                            }
                        }
                        if (typeof pastErrors['c'] != 'undefined') {
                            if (self.getDistance(self.lat, self.lng, parts[0], parts[1]) <= pastErrors['c']) {
                                redAlertLine.push(i);
                                if (drawc == 0) {
                                    drawc = 1;
                                    var parts = routeShape[i + 1].split(',');
                                    var coords = {lat: parts[0], lng: parts[1]};
                                    var marker = new H.map.Marker(coords, {icon: redIconVC});
                                    hMap.addObject(marker);
                                }
                            }
                        }
                        if (typeof pastErrors['14'] != 'undefined') {
                            if (self.getDistance(self.lat, self.lng, parts[0], parts[1]) <= pastErrors['14']) {
                                redAlertLine.push(i);
                                if (draw14 == 0) {
                                    draw14 = 1;
                                    var parts = routeShape[i + 1].split(',');
                                    var coords = {lat: parts[0], lng: parts[1]};
                                    var marker = new H.map.Marker(coords, {icon: redIconV14});
                                    hMap.addObject(marker);
                                }
                            }
                        }
                        if (typeof pastErrors['11'] != 'undefined') {
                            if (self.getDistance(self.lat, self.lng, parts[0], parts[1]) <= pastErrors['11']) {
                                redAlertLine.push(i);
                                if (draw11 == 0) {
                                    draw11 = 1;
                                    var parts = routeShape[i + 1].split(',');
                                    var coords = {lat: parts[0], lng: parts[1]};
                                    var marker = new H.map.Marker(coords, {icon: redIconV11});
                                    hMap.addObject(marker);
                                }
                            }
                        }
                        if (i == 0 && redAlertLine.length == 0) {
                            redAlertLine.push(0);
                            var coords = {lat: parts[0], lng: parts[1]};
                            var marker = new H.map.Marker(coords);
                            hMap.addObject(marker);
                        }
                    }
                }

                // Create a linestring to use as a point source for the route line
                var linestring = new H.geo.LineString();

                // Previous route without violations
                var greanRoute = new H.geo.LineString();

                //Alert route
                var redRoute = new H.geo.LineString();

                var draw8 = 0;
                var drawc = 0;
                var draw14 = 0;
                var draw11 = 0;
                routeShape.forEach(function (point, k) {
                    var parts = point.split(',');
                    if (typeof keyOfMinDis != 'undefined') {
                        if (keyOfMinDis < k) {
                            linestring.pushLatLngAlt(parts[0], parts[1]);
                        } else if (keyOfMinDis == k) {
                            linestring.pushLatLngAlt(parts[0], parts[1]);
                            greanRoute.pushLatLngAlt(parts[0], parts[1]);
                            redRoute.pushLatLngAlt(parts[0], parts[1]);
                        } else {
                            if (redAlertLine.length > 0) {
                                if (k >= redAlertLine.sort()[0]) {
                                    redRoute.pushLatLngAlt(parts[0], parts[1]);
                                }
                                greanRoute.pushLatLngAlt(parts[0], parts[1]);
                            } else {
                                greanRoute.pushLatLngAlt(parts[0], parts[1]);
                            }
                        }
                    } else {
                        linestring.pushLatLngAlt(parts[0], parts[1]);
                    }
                });

                if (typeof keyOfMinDis != 'undefined') {
                    var icon = new H.map.Icon("/dash/assets/img/logbook/truck.svg", {"size": {"w": 35, "h": 35}});
                    var coords = {lat: routeShape[keyOfMinDis].split(',')[0], lng: routeShape[keyOfMinDis].split(',')[1]};
                    var marker = new H.map.Marker(coords, {icon: icon});
                    hMap.addObject(marker);
                }

                if (linestring.getLatLngAltArray().length > 4) {
                    // Create a polyline to display the route:
                    var routeLine = new H.map.Polyline(linestring, {
                        style: {strokeColor: 'rgba(52, 152, 219, 0.5)', lineWidth: 10}
                    });

                    // Add the route polyline and the two markers to the map:
                    hMap.addObjects([routeLine]);

                    // Set the map's viewport to make the whole route visible:
                    hMap.setViewBounds(routeLine.getBounds());
                }

                if (greanRoute.getLatLngAltArray().length > 4) {
                    // Create a polyline to display the route:
                    var greanRouteLine = new H.map.Polyline(greanRoute, {
                        style: {strokeColor: 'rgba(76, 175, 80, 0.5)', lineWidth: 10}
                    });

                    // Add the route polyline and the two markers to the map:
                    hMap.addObjects([greanRouteLine]);

                    // Set the map's viewport to make the whole route visible:
                    hMap.setViewBounds(greanRouteLine.getBounds());
                }

                if (redRoute.getLatLngAltArray().length > 4) {
                    // Create a polyline to display the route:
                    var redRouteLine = new H.map.Polyline(redRoute, {
                        style: {strokeColor: 'rgba(244, 67, 54, 0.7)', lineWidth: 10}
                    });

                    // Add the route polyline and the two markers to the map:
                    hMap.addObjects([redRouteLine]);

                    // Set the map's viewport to make the whole route visible:
                    hMap.setViewBounds(redRouteLine.getBounds());
                }
            }
        };//END onResult

        router.calculateRoute(routingParameters, onResult,
            function (error) {
                alert(error.message);
            });
    }

    self.calculateFutureViolationsInTripHandler = function (response) {
        var redIconV8 = new H.map.Icon("/dash/assets/img/logbook/SVG_red_pin_8.svg", {"size": {"w": 22.3, "h": 30}});
        var redIconV11 = new H.map.Icon("/dash/assets/img/logbook/SVG_red_pin_11.svg", {"size": {"w": 22.3, "h": 30}});
        var redIconV14 = new H.map.Icon("/dash/assets/img/logbook/SVG_red_pin_14.svg", {"size": {"w": 22.3, "h": 30}});
        var redIconVC = new H.map.Icon("/dash/assets/img/logbook/SVG_red_pin_c.svg", {"size": {"w": 22.3, "h": 30}});

        if (response.code == '000') {
            var result = response.data.result;
            $.each(result, function (key, violationMarker) {
                var coords = {lat: violationMarker.latitude, lng: violationMarker.longitude};
                var icon = '';
                switch (violationMarker.type) {
                    case 'Eight':
                        icon = redIconV8;
                        break;
                    case 'Drive':
                        icon = redIconV11;
                        break;
                    case 'Shift':
                        icon = redIconV14;
                        break;
                    case 'Cycle':
                        icon = redIconVC;
                        break;
                }
                var marker = new H.map.Marker(coords, {icon: icon});
                hMap.addObject(marker);
                if (typeof violationMarker.POI != 'undefined') {
                    self.poiItemsHandler(violationMarker.POI);
                }
            });
        }
    }

    this.poiItemsHandler = function (response) {
        if (response.length > 0) {
            $.each(response, function (index, item) {
                var lat = item.lt;
                var lon = item.ln;
                var group = item.groupId;
                var icon = '/dash/assets/img/poi/' + group + '/marker/ic_launcher.png'; // null = default icon
                var iconParam = new H.map.Icon(icon),
                    coords = {lat: lat, lng: lon},
                    marker = new H.map.Marker(coords, {icon: iconParam});
                self.addInfoWindow(marker, item, 1);
                hMap.addObject(marker);
            });
        }
    }

    this.infowindow = {};

    this.addInfoWindow = function (marker, item, type) { //0 - others, 1 - ws, 2 - parking
        var contentString = self.getInfoContent(item, type);
        var id = item.id;
        marker.addEventListener('tap', function (evt) {
            var bubble = new H.ui.InfoBubble(evt.target.getPosition(), {content: contentString});
            ui.getBubbles().forEach(bub => ui.removeBubble(bub));
            ui.addBubble(bubble);
            $(bubble.getElement()).addClass('poi_box');
            self.infowindow[item.id] = bubble;
            var action = 'PlaceRating';
            var data = {placeId: id};
            AjaxController(action, data, dashUrl, self.infoRatingHandler, errorBasicHandler);
            if (item.groupId == 0 || item.groupId == 5) {
                action = 'ParkingStatus';
                data = {placeId: id};
                AjaxController(action, data, dashUrl, self.parkingHandler, errorBasicHandler);
            }
        });
    }

    this.infoRatingHandler = function (response) {
        var rating = response.data.rating;
        var reviews = response.data.reviews;
        var placeId = response.data.placeId;
        if (rating == null) {
            rating = 0;
        }
        reviews = Math.min(reviews, 5);
        var resp = '<img src="/dash/assets/img/poi/star_grey.png" /><img src="/dash/assets/img/poi/star_grey.png" /><img src="/dash/assets/img/poi/star_grey.png" /><img src="/dash/assets/img/poi/star_grey.png" /><img src="/dash/assets/img/poi/star_grey.png" />';
        var yb = '<div class="yellow_stars_box"><div class="yellow_stars_inner_box">';
        var fl = Math.ceil(rating);
        if (rating > 0) {
            for (var x = 0; x < fl; x++) {
                yb += '<img src="/dash/assets/img/poi/star_yellow.png" class="yellow_star"/>';
            }
        }
        yb += '</div></div>';
        $('.info_map_box[data-id="' + placeId + '"] .rating_box').empty().append(resp + yb);
        var w = 20 * rating;
        var w2 = 20 * fl;
        $('.info_map_box[data-id="' + placeId + '"] .rating_box .yellow_stars_box').width(w + 'px');
        $('.info_map_box[data-id="' + placeId + '"] .rating_box .yellow_stars_inner_box').width(w2 + 'px');
    }
    this.parkingHandler = function (response) {
        var stationsStatuses = response.data.stationsStatuses;
        var placeId = response.data.placeId;
        if (stationsStatuses.length > 0) {
            var st = '';
            $.each(stationsStatuses.reverse(), function (key, status) {
                st += '<div class="one_st_box s' + status.status + '">' + status.dateTime + '</div>';
                $('.info_map_box[data-id="' + placeId + '"] .station_statuses_box').empty().append(st);
            });
        } else {
            var ttl = 'No statuses yet';
            $('.info_map_box[data-id="' + placeId + '"] .additional_info').empty().append('<p>' + ttl + '</p>');
        }
    }

    this.getInfoContent = function (item, type) {
        var title = item.title;
        var city = item.city;
        var address = item.address;
        var phone = item.phone;
        var state = item.state;
        var zip = item.zip;
        var addressLine = '';
        var stateZipLine = '';
        var phoneLine = '';
        var additionalInfo = '';
        if (address != '') {
            addressLine = '<p>' + address;
        }
        if (city != '') {
            if (addressLine != '')
                addressLine += ', ';
            addressLine += city + '</p>';
        } else {
            addressLine += '</p>';
        }
        if (state != '') {
            stateZipLine = '<p>' + state;
        }
        if (zip != '') {
            stateZipLine += ', ' + zip + '</p>';
        } else {
            stateZipLine += '</p>';
        }
        if (phone != '') {
            phoneLine = '<p>' + phone + '</p>';
        }
        if (item.groupId == 5 || item.groupId == 0) {
            if (item.groupId == 5) {
                var ttl = 'Weight Station Status';
            } else {
                var ttl = 'Parking Status';
            }
            additionalInfo = '<div class="additional_info" data-type="' + item.groupId + '" data-id="' + item.id + '">\n\
				<p>' + ttl + '</p>\n\
				<div class="station_statuses_box"><img class="loading" src="/dash/assets/img/loading.gif"/></div></div>';
        }
        return '<div class="info_map_box" data-id="' + item.id + '">\n\
				<h3 class="info_link" onclick="poiC.getMarkerInfo(this)">' + title + '</h3>\n\
				<div class="address_box">' + addressLine + stateZipLine + phoneLine + '</div> \n\
				<div class="rating_box"><img class="loading" src="/dash/assets/img/loading.gif"/></div>' + additionalInfo + '\n\
				</div>';
    }

    this.rad = function (x) {
        return x * Math.PI / 180;
    };

    this.getDistance = function (p1Lat, p1Lng, p2Lat, p2Lng) {
        var R = 6378137; // Earth’s mean radius in meter
        var dLat = self.rad(p2Lat - p1Lat);
        var dLong = self.rad(p2Lng - p1Lng);
        var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(self.rad(p1Lat)) * Math.cos(self.rad(p2Lat)) *
            Math.sin(dLong / 2) * Math.sin(dLong / 2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        var d = R * c;
        return d; // returns the distance in meter
    };
    this.calculateAndDisplayRoute = function (directionsService, directionsDisplay, org, dest, wps) {
        /*directionsService.route({
         origin: org,
         destination: dest,
         waypoints: wps,
         travelMode: google.maps.TravelMode.DRIVING
         }, function (response, status) {
         if (status === google.maps.DirectionsStatus.OK) {
         directionsDisplay.setDirections(response);
         } else {
         initializePoi();
         }
         });*/
    }





    // !!! need to see again
    this.toInt = function (n) {
        return Math.round(Number(n));
    }

    this.setLogTime = function (el, time, sec = false, showSec = true) {
        if (sec) {
            var hours = Math.floor(time / 3600);
            time = time - hours * 3600;
            var minutes = Math.floor(time / 60);
            var seconds = Math.floor(time % 60);
        } else {
            var hours = Math.floor(time / 60);
            var minutes = time % 60;
            minutes = minutes * 100 / 60;
        }
        var pad = "00";
        var minutes = (pad + minutes).slice(-pad.length);
        var hours = (pad + hours).slice(-pad.length);

        if (sec) {
            var seconds = (pad + seconds).slice(-pad.length);
            $('.' + el).text(hours + ':' + minutes + (showSec ? ':' + seconds : ''));
            $('.' + el).attr('x', '755');
        } else {
            $('.' + el).text(hours + '.' + minutes);
            $('.' + el).attr('x', '755');
            $('.' + el).attr('style', '');
        }
    }
    this.svgEl = function (tagName) {
        return document.createElementNS("http://www.w3.org/2000/svg", tagName);
    }

    this.addTimeControl = function () {
        if ($('#time_control').length == 0 || window.location.pathname == '/dash/') {
            return 1;
        }
        $('#time_control').timeEntry('destroy');
        $('#time_control').timeEntry({
            show24Hours: false,
            separator: ' : ',
            ampmPrefix: ' ',
            ampmNames: ['AM', 'PM'],
            spinnerTexts: ['Now', 'Previous field', 'Next field', 'Increment', 'Decrement'],
            appendText: '',
            showSeconds: (self.isAobrd ? false : true),
            timeSteps: (self.isEld ? [1, 1, 1] : [1, 15, 0]),
            initialField: null,
            noSeparatorEntry: true,
            useMouseWheel: true,
            defaultTime: null,
            minTime: null,
            maxTime: null,
            spinnerImage: '/dash/assets/svg/log/spinnerUpDown.png', //'/dash/assets/svg/log/up-down.svg',
            spinnerSize: [30, 32, 0],
            spinnerBigImage: '',
            spinnerBigSize: [30, 32, 0],
            spinnerIncDecOnly: true,
            spinnerRepeat: [500, 250],
            beforeShow: null,
            beforeSetTime: null
        });
    }

    this.turnOffDriverEditMode = function (driverId, el) {
        AjaxController('turnOffDriverEditMode', {driverId: driverId}, dashUrl, function () {
            self.changeLogbook();
        }, function () {
            self.changeLogbook();
        }, true);
        $(el).closest('.modal-dialog').find('.close').click();
    }

    this.check34restart = function (point) {
        if (point.restartFromStatusStart != false) {
            var restartPointMinsTotal = parseInt(point.restartFromStatusStart / 60);
            var restartPointHours = Math.floor(restartPointMinsTotal / 60);
            if (self.isEld) {
                var restartPointMins = (restartPointMinsTotal - restartPointHours * 60);
            } else {
                var restartPointMins = (restartPointMinsTotal - restartPointHours * 60) / 15;
            }
            var startH = point.hours + restartPointHours;
            var startP = point.startP + restartPointMins;
            self.draw34(startH, startP);
        }
    }
    this.draw34 = function (startH, startP) {
        var w = 31;
        if (self.isEld) {
            x1 = (startH + startP / 60) * w;
        } else {
            x1 = (startH + startP / 4) * w;
        }
        y1 = 0;
        y2 = 111;
        colr = '#27d26e';
        self.drawLine(x1, x1, y1, y2, 'working_line', colr);
        self.drawGreenCircle(y2, colr, '34', x1);
    }

    this.checkFutureActions = function (point, restart34Hours) {
        if (restart34Hours > 0) {
            var restartPointMinsTotal = parseInt(restart34Hours / 60);
            var restartPointHours = Math.floor(restartPointMinsTotal / 60);
            var restartPointMins = (restartPointMinsTotal - restartPointHours * 60) / 15;
            var startH = point.durationH + restartPointHours;
            var startP = point.durationM + restartPointMins;
            if (self.notEnds(point.hours, point.mins, startH, startP)) {
                self.draw34(startH, startP);
            }
        }
    }
    this.notEnds = function (startH, startM, durationH, durationM) {
        var total = startH + durationH + (startM + durationM * 15) / 60;
        if (total >= 24) {
            return false;
        }
        return true;
    }

    this.drawGreenCircle = function (y, colr, violNum, x) {
        y = 133;
        $(self.selectorSvg).append(self.svgEl('circle'));
        $(self.selectorSvg).find("circle").last()
            .attr("cx", x).attr("cy", y).attr("r", 8)
            .attr("class", 'working_line ')
            .attr("style", "stroke:#3498db;fill:" + colr + ";stroke-width:1");

        $(self.selectorSvg).append(self.svgEl('text'));
        $(self.selectorSvg).find("text").last().text(violNum)
            .attr("x", x - 6)
            .attr("y", y + 4)
            .attr("class", 'working_number ')
            .attr("style", "fill: white;font-size:10px;");
    }

    this.drawInfoEditRow = function (key, edit) {
        var str = '';
        var table_header_tr = '<th>Info</th><th>Data</th>';
        var edit_table = '<table class="table table-striped table-dashboard table-sm mobile_table ez_table ez_table_' + key + '"><thead>' + table_header_tr + '</thead><tbody>';
        $.each(edit.fields, function (field_type, field_value) {
            if (field_type == 'trucks' || field_type == 'trailers' || field_type == 'shippingDocs') {
                var value_array = jQuery.parseJSON(field_value);
                var field_str = '';
                $.each(value_array, function (f_key, f_value) {
                    var field_name = field_type == 'shippingDocs' && typeof f_value.reference !== 'undefined' ? f_value.reference : f_value.name;
                    field_str += (f_key != 0 ? ', ' : '') + field_name;
                });
                field_value = field_str;
            } else if (field_type == 'specials') {
                field_array = jQuery.parseJSON(field_value);
                field_value = 'Deffer Off';
                $.each(field_array, function (key, spec) {
                    if (spec.specId == 1) {
                        field_value = 'Deffer On';
                    }
                });
            } else if (field_type == 'officeAddressjson' || field_type == 'homeTerminaljson') {
                field_array = jQuery.parseJSON(field_value);
                field_value = field_array.address_string;
            } else if (field_type == 'distances') {
                var value_array = jQuery.parseJSON(field_value);
                var field_str = '';
                if (value_array.length) {
                    $.each(value_array, function (f_key, f_value) {
                        field_str += (f_key != 0 ? '; ' : '') + f_value.state_name + ' ' + f_value.distance + ' mi';
                    });
                } else
                    field_str = '0 mi';
                field_value = field_str;
            } else if (field_type == 'distance') {
                field_value += ' mi';
            }

            var field_title = field_type;
            switch (field_type) {
                case 'shippingDocs':
                    field_title = 'Shipping Docs';
                    break;
                case 'officeAddressjson':
                    field_title = 'Main Office';
                    break;
                case 'homeTerminaljson':
                    field_title = 'Home Terminal';
                    break;
                case 'coDrivers':
                    field_title = 'Co Drivers';
                    break;
                case 'carrierName':
                    field_title = 'Carrier';
                    break;
            }
            edit_table += '<tr><td class="field_title">' + field_title + '</td><td>' + (field_value.toString() ? field_value.toString() : 'None') + '</td></tr>';
        });
        edit_table += '<tbody></tbody></table>';

        str += '<div id="main_info_' + key + '" class="offer">';
        str += '<div class="offer-header" id="heading_' + key + '">';
        str += '<h5 class="mb-0"><div id="main_info_title_' + key + '" class="offer_row_title collapsed" data-toggle="collapse" data-target="#collapse_' + key + '" aria-expanded="false" aria-controls="collapse_' + key + '">Offer by ' + edit.editor + ' №' + key + '</div>';
        str += '<span class="delete_edit blue-border" onclick="logbook.removeInfoEdit(' + key + ');">Remove</span></h5></div>';
        str += '<div id="collapse_' + key + '" class="collapse" aria-labelledby="heading' + key + '" data-parent="#accordion">';
        str += '<div class="offer-body table_wrap">' + edit_table + '</div></div></div>';
        return str;
    }

    this.changeAnnotation = function (index) {
        var annotation_note = '';
        if (index == -1) {
            annotation_note = '<textarea id="editAnnotation" class="form-control" maxlength="60" rows="1" onchange="logbook.statusFieldChange(this)" placeholder="Edit Annotation"></textarea>';
            $('#annotation_value').html(annotation_note);
        } else {
            annotation_note = '<input type="hidden" class="form-control" id="editAnnotation" value="' + $('#annotation_select').find(":selected").text() + '"></input>';
            $('#annotation_value').html(annotation_note);
            //statusFieldChange($('#editAnnotation'));
        }
    }

    this.removeEditOffers = function (i) {
        var editId = self.offers_points[i].id;
        AjaxController('removeEditOffersByEditId', {editId: editId}, apiLogbookUrl, 'removeEditOffersSuccess', self.removeEditOffersHandler, true);
    }
    this.removeEditOffersHandler = function (response) {
        $.each(self.offers_points, function (key, offer) {
            if (offer === null) {
                return;
            }
            if (offer.id == response.data.editId && typeof offer != 'undefined') {
                if ($('#offer_' + offer.id).is('.active')) {
                    self.pendingViewReturn();
                }
                $('#offer_' + offer.id).remove();
                self.offers_points[key] = null;
            }
        });

        if (self.isEditMode)
            self.leaveEditMode();
        self.cancelEdit();
    }

    this.offersPointsCount = function (collection) {
        var totalCount = 0;
        for (var index = 0; index < collection.length; index++) {
            if (index in collection && collection[index]) {
                totalCount++;
            }
        }
        return totalCount;
    }

    this.checkOriginButton = function () {
        $('#orig_lable').remove();
        var original_setting = getCookie('original_setting');
        if (self.GetURLParameter('original_setting')) {
            original_setting = self.GetURLParameter('original_setting');
        }
        if (self.canEdit && original_setting == 1) {
            $('#log_book').append('<span id="orig_lable">Original</span>');
        }

    }
    this.showLogbookOptions = function () {
        var settings = '';
        if (!curUserIsEzlogzEmployee()) {
            settings += `<li>
                <label>Original</label>
                <div class="check_buttons_block" id="original_setting">
                    <button onclick="doActive(this)" data-val="1">On</button>
                    <button onclick="doActive(this)" data-val="0">Off</button>
                </div>
            </li >`;
        }
        if (self.isEld || curUserIsEzlogzEmployee()) {
            settings += `<li>
                <label>Scanner statuses</label>
                <div class="check_buttons_block" id="scanner_setting">
                    <button onclick="doActive(this)" data-val="1">On</button>
                    <button onclick="doActive(this)" data-val="0">Off</button>
                </div>
            </li>
            <!--<li>
                <label>Engine statuses</label>
                <div class="check_buttons_block" id="engine_setting">
                    <button onclick="doActive(this)" data-val="1">On</button>
                    <button onclick="doActive(this)" data-val="0">Off</button>
                </div>
            </li>-->
            <li>
                <label>Team Drivers statuses</label>
                <div class="check_buttons_block" id="teamDrivers_setting">
                    <button onclick="doActive(this)" data-val="1">On</button>
                    <button onclick="doActive(this)" data-val="0">Off</button>
                </div>
            </li>
            <li>
                <label>Weigh Stations statuses</label>
                <div class="check_buttons_block" id="weighStations_setting">
                    <button onclick="doActive(this)" data-val="1">On</button>
                    <button onclick="doActive(this)" data-val="0">Off</button>
                </div>
            </li>`;
        }
        if (window.location.pathname != '/dash/views/dispatcher/log/') {
            settings += `<li>
                <label>Show Corrections History</label>
                <div class="check_buttons_block" id="editHisoty_setting">
                    <button onclick="doActive(this)" data-val="1">On</button>
                    <button onclick="doActive(this)" data-val="0">Off</button>
                </div>
            </li>`;
        }
        settings += `<li>
                <label>Show Recap Info</label>
                <div class="check_buttons_block" id="recapInfo_setting">
                    <button onclick="doActive(this)" data-val="1">On</button>
                    <button onclick="doActive(this)" data-val="0">Off</button>
                </div>
            </li>`;
        if ($('#logbook_options').length == 0) {
            $('#log_book').append(`<ul class="dropdown-menu dropdown-menu-right dropdown-menu-actions-table-row" aria-labelledby="dropdownActionMenu_" id="logbook_options">
                ${settings}
            </ul>`);
            $('#logbook_options #original_setting button').click(self.switchOriginal);
            $('#logbook_options #scanner_setting button').click(self.switchScanner);
            $('#logbook_options #weighStations_setting button').click(self.switchWeighStations);
            $('#logbook_options #editHisoty_setting button').click(self.switchEditHisoty);
            $('#logbook_options #teamDrivers_setting button').click(self.switchTeadDrivers);
            $('#logbook_options #engine_setting button').click(self.switchEngine);
            $('#logbook_options #recapInfo_setting button').click(self.switchRecap);

            if (getCookie('original_setting') == 1) {
                $('#logbook_options #original_setting button[data-val="1"]').addClass('active');
            } else {
                $('#logbook_options #original_setting button[data-val="0"]').addClass('active');
            }

            if (getCookie('engine_setting') == 1) {
                $('#logbook_options #engine_setting button[data-val="1"]').addClass('active');
            } else {
                $('#logbook_options #engine_setting button[data-val="1"]').addClass('active');
            }

            if (getCookie('scanner_setting') == 1) {
                $('#logbook_options #scanner_setting button[data-val="1"]').addClass('active');
            } else {
                $('#logbook_options #scanner_setting button[data-val="0"]').addClass('active');
            }

            if (getCookie('weighStations_setting') == 1) {
                $('#logbook_options #weighStations_setting button[data-val="1"]').addClass('active');
            } else {
                $('#logbook_options #weighStations_setting button[data-val="0"]').addClass('active');
            }

            if (getCookie('teamDrivers_setting') == 1) {
                $('#logbook_options #teamDrivers_setting button[data-val="1"]').addClass('active');
            } else {
                $('#logbook_options #teamDrivers_setting button[data-val="0"]').addClass('active');
            }

            if (getCookie('editHisoty_setting') == 1) {
                $('#logbook_options #editHisoty_setting button[data-val="1"]').addClass('active');
            } else {
                $('#logbook_options #editHisoty_setting button[data-val="0"]').addClass('active');
            }

            if (getCookie('recapInfo_setting') == 1) {
                $('#logbook_options #recapInfo_setting button[data-val="1"]').addClass('active');
            } else {
                $('#logbook_options #recapInfo_setting button[data-val="0"]').addClass('active');
            }
        } else {
            $('#logbook_options').remove();
        }
    }
    this.switchTeadDrivers = function () {
        createCookie('teamDrivers_setting', $(this).attr('data-val'), 30);
        self.changeLogbook();
    }
    this.switchOriginal = function () {
        createCookie('original_setting', $(this).attr('data-val'), 30);
        self.showOriginalLogbook();
    }
    this.switchWeighStations = function () {
        createCookie('weighStations_setting', $(this).attr('data-val'), 30);
        self.changeLogbook();
    }
    this.switchEditHisoty = function () {
        createCookie('editHisoty_setting', $(this).attr('data-val'), 30);
        self.changeLogbook();
    }
    this.switchEditHisoty2 = function (el) {
        createCookie('editHisoty_setting', $(el).attr('data-val'), 30);
        self.changeLogbook();
    }
    this.switchScanner = function () {
        createCookie('scanner_setting', $(this).attr('data-val'), 30);
        self.changeLogbook();
    }
    this.switchEngine = function () {
        createCookie('engine_setting', 1, 30);
        self.changeLogbook();
    }
    this.switchRecap = function () {
        createCookie('recapInfo_setting', $(this).attr('data-val'), 30);
        self.changeLogbook();
    }
    this.showOriginalLogbook = function () {
        var original_setting = getCookie('original_setting');
        if (self.GetURLParameter('original_setting')) {
            original_setting = self.GetURLParameter('original_setting');
        }
        if (original_setting == 0 || original_setting == '') {
            self.originalLogbook = false;
            $('.origin_button').removeClass('original');
            $('.edit_info').show();
        } else {
            self.originalLogbook = true;
            $('.origin_button').addClass('original');
            $('.edit_info').hide();
        }
        self.changeLogbook();
        self.checkOriginButton();
    }

    this.removeInfoEdit = function (editId) {
        AjaxController('removeInfoEdit', {editId: editId}, apiLogbookUrl, 'removeInfoEditSuccess', self.removeInfoEditHandler, true);
    }
    this.removeInfoEditHandler = function (response) {
        var editId = response.data.editId;
        self.info_edits[editId] = null;
        $('#main_info_' + editId).remove();
        self.drawInfoEdits(self.info_edits);
    }

    this.validateMainInfo = function (field_type, field_value) {
        var error = 0;
        var regex = '';
        field_value = $.trim(field_value);
        switch (field_type) {
            case 'mainOffice_address':
            case 'homeTerminal_address':
                regex = /^([a-zA-Z0-9\-\,\.\;\#\:\'\s\/]){0,64}$/;
                break;
            case 'mainOffice_zip':
            case 'homeTerminal_zip':
                regex = /^([a-zA-Z0-9\-\,\.\;\#\:\'\s\/]){0,10}$/;
                break;
            case 'distance':
                regex = /^[0-9]{1,4}(?:[.][0-9]{1,})?\r?$/;
                break;
            case 'mainOffice_city':
            case 'homeTerminal_city':
                regex = /^([a-zA-Z0-9\-\'\s]){0,64}$/;
                break;
            case 'from':
                regex = /^([a-zA-Z0-9\-\,\.\;\#\:\'\s\/]){0,500}$/;
                break;
            case 'to':
                regex = /^([a-zA-Z0-9\-\,\.\;\#\:\'\s\/]){0,500}$/;
                break;
            case 'carrierName':
                regex = /^([a-zA-Z0-9\-\,\.\;\#\$\&\:\'\s\/]){4,130}$/;
                break;
            case 'coDrivers':
                regex = /^([a-zA-Z\-\'\s\.\@\,]){0,129}$/;
                break;
            case 'notes':
                regex = /^([a-zA-Z0-9\-\,\.\;\#\:\'\s\/]){0,1000}$/;
                break;
        }
        if (regex != '') {
            error = !regex.test(field_value);
        }
        if (field_type == 'distance' && field_value == '') {
            error = 0;
        }

        return error;
    }

    this.attachmentTabClick = function (el) {
        $('.attachment_tab').removeClass('active');
        $(el).addClass('active');
        if ($(el).hasClass('attachment_add')) {
            $('#attachment_list').hide();
            $('#attachment_add').show();
            // clear "Add new" form
            $('#edit_doc_type').val(-1).change();
            $('#images_form #doc_image').remove();
            $('#images_form').prepend('<input name="file" id="doc_image" style="cursor:pointer" onchange="getFileName(this);" type="file">');
            $('#box_for_images').html('');
        } else {
            $('#attachment_add').hide();
            $('#attachment_list').show();
        }
    }
    this.distanceInputDot = function (el) {
        $(el).val($(el).val().replace(',', '.'));
    }
    this.newDate = function (dateString = false) {
        if (dateString !== false) {
            if (dateString.toString().indexOf('-') > 0)
                dateString = dateString.toString().replace(/-/g, '/');
            return new Date(dateString);
        } else
            return new Date();
    }
    this.locationAutocompleteKeyup = function (el) {
        /*window.setTimeout(function () {
         c('prepend')
         $(".pac-container.pac-logo").prependTo(".location_name_cont");
         }, 10);*/
        self.statusFieldChange(el);
        var searchStr = $(el).val();
        if (searchStr == '') {
            return 1;
        }
        if (self.inputTimeout != null) {
            clearTimeout(self.inputTimeout);
        }
        self.inputTimeout = setTimeout(function () {
            plcApi.locationAutocompleteKeyup(searchStr);
        }, 500);

    }
    this.sendLocationNamesFromStrHandler = function (data) {
        var resultList = data.result;
        $(".pac-container.pac-logo").remove();
        $("#log_book .location_name_cont").append('<div class="pac-container pac-logo"></div>');
        $.each(resultList, function (key, item) {
            //$(".pac-container.pac-logo").append('<div class="pac-item"><span class="pac-icon pac-icon-marker"></span><span class="pac-item-query"><span class="pac-matched">Sd</span>erot</span><span>Israel</span></div>');
            $(".pac-container.pac-logo").append('<div onclick="logbook.selectPlace(this)" class="pac-item"><span class="pac-icon pac-icon-marker"></span><span class="pac-item-query"><span class="pac-matched">' + item + '</span></div>');
        });
        $(".pac-container.pac-logo").show();
    }
    this.selectPlace = function (el) {
        var searchStr = $(el).text();
        plcApi.selectPlace(searchStr);
    }
    this.sendLocationFromStrHandler = function (data) {
        var resultData = data.result;
        $('#location_name').val(resultData.searchStr).trigger('change');
        $('#latitude').val(resultData.lat).change();
        $('#longitude').val(resultData.lng).change();
        hereMap.setCenter({lat: resultData.lat, lng: resultData.lng});
        $(".pac-container.pac-logo").remove();
    }
}
$(document).mouseup(function (e)
{
    var container = $("#log_book .pac-container.pac-logo");
    // if the target of the click isn't the container nor a descendant of the container
    if (!container.is(e.target) && container.has(e.target).length === 0) {
        container.remove();
    }
});
var logbook = new logbookClass();

// functions for AjaxController success, because it's written by string
function drawEditFieldsSuccess(response, action) {
    logbook.drawEditFieldsHandler(response, action);
}
function saveLogbookSuccess(responce) {
    logbook.saveLogbookHandler(responce);
}
function removeEditOffersSuccess(responce) {
    logbook.removeEditOffersHandler(responce);
}
function removeInfoEditSuccess(responce) {
    logbook.removeInfoEditHandler(responce);
}
Array.prototype.insert = function (index, item) {
    this.splice(index, 0, item);
};
function toggleLogbookGeneralShow(el) {
    if ($(el).find('.fa').hasClass('fa-angle-up')) {
        $(el).find('.fa').removeClass('fa-angle-up').addClass('fa-angle-down');
        $('#log_info .form-group').slideUp();
        createCookie('logs_toggle_general', 1, 30);
    } else {
        $(el).find('.fa').addClass('fa-angle-up').removeClass('fa-angle-down');
        $('#log_info .form-group').slideDown();
        eraseCookie('logs_toggle_general');
    }
}

function testSucc(response) {
    c('testSucc');
    c(response);
}
function testErr(response) {
    c('testErr');
    c(response);
}
function changeCanEditLogbookHandler(response) {
    logbook.changeLogbook();
}
function changeCanEditLogbookConfirmed(driverId, canEdit) {
    var action = canEdit ? 'turnOffDriverEditMode' : 'turnOnDriverEditMode';
    AjaxCall({url: dashUrl, action: action, data: {driverId: driverId}, successHandler: "changeCanEditLogbookHandler"});
}
function changeCanEditLogbook(el, event) {
    event.stopPropagation();
    var driverId = logbook.userId;
    var canEdit = $(el).hasClass('canEdit');
    var text = 'Turn Off Driver Edit?';
    if (canEdit) {
        showModalConfirmation('Driver Notate & Correct', '<p class="text-center">Turn Off Driver AOBRD Can Notate & Correct?</p>');
    } else {
        showModalConfirmation('Driver Notate & Correct', '<p class="text-center">Turn On Driver AOBRD Can Notate & Correct?</p>');
    }
    $('#confirmationModal').off('click', '#btnConfirmClick').on('click', '#btnConfirmClick', function (e) {
        changeCanEditLogbookConfirmed(driverId, canEdit);
    });
}
function showRecalculatePopap(userId) {
    let id = 'recalculate_user_statuses';
    let message = `
        Date From: <input type="text" id="recalculate_datepicker_from" class="datepicker"><br>
        Date Till: <input type="text" id="recalculate_datepicker_till" class="datepicker"><br>
        <span class="result"></span>
    `;
    showModal('Recalculate user statuses by period', message, id, '', {footerButtons: `<button class="btn btn-default" onclick="recalculateUserStatuses(${userId});">Recalculate Statuses</button>`});

    $('#recalculate_user_statuses #recalculate_datepicker_from').datepicker({ dateFormat: 'mm-dd-yy' });
    $('#recalculate_user_statuses #recalculate_datepicker_till').datepicker({ dateFormat: 'mm-dd-yy' });
}
function recalculateUserStatuses(userId) {
    let dateFrom = $('#recalculate_user_statuses #recalculate_datepicker_from').val();
    let dateTill = $('#recalculate_user_statuses #recalculate_datepicker_till').val();
    if (!dateFrom || !dateTill) {
        $('#recalculate_user_statuses .result').empty().append('Fields "Date From" and "Date Till" required');
        return;
    } else {
        $('#recalculate_user_statuses .result').empty().append('The process of recalculating statuses has begun. It can take some time.');
    }

    AjaxCall({url: apiAdminUrl, action: "recalculateUserStatuses", data: {userId: userId, dateFrom: convertDateToSQL(dateFrom), dateTill: convertDateToSQL(dateTill)}, successHandler: "recalculateUserStatusesHandler"});
}
function recalculateUserStatusesHandler(response) {
    $('#recalculate_user_statuses .result').empty().append('The process of recalculating statuses has ended');
}
$(document).ready(function () {
    $('body').on('show.bs.modal', '#time_modal', function (event) {
        var selector = '#time_control';
        $(selector).timeEntry('option', 'minTime', null);
        $(selector).timeEntry('option', 'maxTime', null);
        var input_time = $(event.relatedTarget),
            time_val = input_time.attr('data-time'); //val time_val = input_time.data('title'); // Extract value from data-* attributes
        var time_field_id = input_time.attr('id');
        var date_by_time = logbook.newDate(logbook.todayDateString + ' ' + time_val);
        $(selector).removeAttr('data-time');
        var min_date_time, max_date_time;
        if (time_field_id == 'time_to') {
            if ($('#time_from').attr('data-time') != '00:00:00') {
                min_date_time = logbook.newDate(logbook.newDate(logbook.todayDateString.toString() + ' ' + $('#time_from').attr('data-time')).getTime() + 1000);
            }
            max_date_time = logbook.newDate(logbook.todayDateString.toString() + ' 23:59:59');
            if (logbook.todaysDate && max_date_time > logbook.todaysDate)
                max_date_time = logbook.newDate(logbook.todaysDate.getTime() - 1000);
        } else {
            min_date_time = logbook.newDate(logbook.todayDateString.toString() + ' 00:00:00');
            if ($('#time_to').attr('data-time') != '00:00:00') {
                max_date_time = logbook.newDate(logbook.newDate(logbook.todayDateString.toString() + ' ' + $('#time_to').attr('data-time')).getTime() - 1000);
            }
        }
        $(selector).timeEntry('setTime', date_by_time);
        $(selector).timeEntry('option', 'minTime', min_date_time);
        $(selector).timeEntry('option', 'maxTime', max_date_time);
        $(selector).attr('data-time', time_field_id);
    });
    $('body').on('hidden.bs.modal', '#attachments_modal', function (event) {
        emptyAttachmentParams();
    });
    $('body').on('keyup', '#log_info input', function (event) {
        $(this).val($(this).val().replace(/[\u0250-\ue007]/g, ''));
    });
    $('body').on('hidden.bs.modal', '#pending_approvals_modal', function (event) {
        $('.collapse.in').collapse('hide');
    });
    $('body').on('focus', 'input', function () {
        $(this).removeClass('error');
        $('#save_info').attr('disabled', false);
        $('#edit_main_info').attr('disabled', false);
    });
    $(document).click(function (event) {
        if (!$(event.target).closest('#logbook_options, .origin_button').length) {
            if ($('#logbook_options').is(":visible")) {
                $('#logbook_options').remove();
            }
        }
    });
});

// popup attention about closing edit driving statuses and revert logbook

function revertAttentionPopup(revert = false) {
    if (logbook.isSuperDrivingEdit && revert && Object.keys(logbook.editedSegment).length != 0) {
        let action = '';
        let data = {};

        if (logbook.new_mode) {
            let insertLongitude = document.getElementById('insertLongitude');
            let insertLatitude = document.getElementById('insertLatitude');
            let lngExp = /^[\-\+]?(0(\.\d{1,10})?|([1-9](\d)?)(\.\d{1,10})?|1[0-7]\d{1}(\.\d{1,10})?|180\.0{1,10})$/;
            let latExp = /^[\-\+]?((0|([1-8]\d?))(\.\d{1,10})?|90(\.0{1,10})?)$/;
            let lng = '';
            let lat = '';

            if (insertLongitude.value != '' && !lngExp.test(insertLongitude.value)) {
                insertLongitude.classList.add('error');
                return false;
            } else {
                lng = insertLongitude.value;
            }

            if (insertLatitude.value != '' && !latExp.test(insertLatitude.value)) {
                insertLongitude.classList.add('error');
                return false;
            } else {
                lat = insertLatitude.value;
            }

            let statuses = logbook.getStatusesForSave();

            action = 'insertStatus';

            data = {
                driverId : logbook.userId,
                afterStatusId: logbook.afterStatusId,
                afterOdometer: logbook.segments[logbook.superEditStatusIndex].from.totalMiles,
                afterEngineHours: logbook.segments[logbook.superEditStatusIndex].from.totalEngineHours,
                afterTime: logbook.segments[logbook.superEditStatusIndex].from.dateTime,
                statuses: statuses,
                isMotionStatus: logbook.isMotionStatus,
                motionStatuses: logbook.motionStatuses,
                lat,
                lng
            };
        } else {
            action = 'changeStatusTime';
            data = {
                userId : logbook.userId,
                statusId : logbook.segments[logbook.superEditStatusIndex + 1]['from']['id'],
                time: moment(logbook.logbookDay + ' ' +  logbook.convertXCoordToTime(logbook.x2, true)).format('YYYY-MM-DD HH:mm:ss')
            };
        }

        AjaxController(action, data, apiLogbookUrl, superChangeTypeLogbookHandler, superChangeTypeLogbookHandler, true);

        return false;
    }
    if (logbook.isEditMode && curUserIsEzlogzEmployee()) {
        logbook.saveLogbook();
        return false;
    }

    let title, footerBtns, content, className;

    if (revert) {
        className = 'closeEditDRPopup closeRevertLogbook';
        title = '“Revert” option discontinued';
        footerBtns = `
            <button type=button" class="btns-item btn btn-default" onclick="document.querySelector('.section__popup').remove()">Cancel</button>
            <button type=button" class="btns-item btn btn-primary-new" onclick="logbook.saveLogbook(); document.querySelector('.section__popup').remove()">Continue</button>
        `;
        content = `
            <div class="popup__content-row">
                <p>When editing duty status the “revert” option won’t be available. Please adjust and communicate to your teams accordingly. For any questions please reach out to our team at 800-670-7807</p>
            </div>
        `;
    } else {
        className = 'closeEditDRPopup';
        title = 'Edit driving option discontinued';
        footerBtns = `<button type=button" class="btns-item btn btn-primary-new" onclick="document.querySelector('.section__popup').remove()">I agree</button>`;
        content = `
            <div class="popup__content-row">
                <p>The FMCSA recently reached out to us to ensure the interpretation of the following law is being upheld: </p>
                <p>FMCSA LAW: Users cannot edit or change driving time that has been recorded by an electronic logging device (ELD) to non-driving time</p>
                <p>Going forward, the automatically recording of all driving time that a CMV is in motion as driving time cannot be edited to non-driving time. Please adjust and communicate to your teams accordingly</p>
                <p>For any questions please reach out to our team at 800-670-7807</p>
            </div>
        `;
    }

    showNewModal(className, title, content, footerBtns);
}

function showSuperEditPopup(index) {
    if (curUserIsEzlogzEmployee() && $('#log_info').hasClass('edit_active')) {
        return false;
    }
    let statusX1 = logbook.segments[index]['x1'];
    let statusX2 = logbook.segments[index]['x2'];
    let switchStatus = true;

    (logbook.engineStatuses).forEach(status => {
        if (status.statusTypeId == 2) {
            let x = logbook.convertTimeCoordToX(status.dateTime.substring(11));

            if (x >= statusX1 && x <= statusX2) {
                switchStatus = false;
            }
        }
    });

    
    let className = 'superEdit';
    let title = '';
    let footerBtns = 
        `<button type=button" class="btns-item btn btn-default" onclick="document.querySelector('.section__popup').remove()">Cancel</button>
        <button type=button" class="btns-item btn btn-primary-new" onclick="checkSuperEditType(${index}, ${switchStatus})">Submit</button>
    `;
    let content = `
        <div class="popup__content-row">
            <div class="item-box ${!switchStatus ? 'disabled-btn' : ''}">
                <label for="pcStatus">Switch status to PC</label>
                <input type="radio" ${!switchStatus ? '' : 'checked'} value="3" name="newStatus" id="pcStatus">
            </div>
        </div>
        <div class="popup__content-row">
            <div class="item-box ${!switchStatus ? 'disabled-btn' : ''}">
                <label for="ymStatus">Switch status to YM</label>
                <input type="radio" value="0" name="newStatus" id="ymStatus">
            </div>
        </div>
        <div class="popup__content-row">
            <div class="item-box">
                <label for="changeDuration">Change duration</label>
                <input type="radio" ${!switchStatus ? 'checked' : ''} value="1" name="newStatus" id="changeDuration">
            </div>
        </div>
    `;

    showNewModal(className, title, content, footerBtns);
}

function checkSuperEditType(index, switchStatus) {
    let newStatusType = document.querySelector('input[name="newStatus"]:checked').value;

    if (newStatusType == 1) {
        logbook.superEditStatusIndex = index;
        logbook.isSmartSafetySuperEdit = true;
        document.querySelector('.section__popup').remove();
        logbook.correctionAndAnnotation();
        logbook.editStatusClick(document.querySelector(`.logbook_status[data-index="${index}"]`));
        
        return false;
    }

    if (switchStatus) {
        let data = {
            userId : logbook.userId,
            statusId : logbook.segments[index]['from']['id'],
            time : moment(logbook.segments[index]['from']['dateTime']).format('YYYY-MM-DD HH:mm:ss'),
            statusType: newStatusType
        };

        AjaxController('changeStatusType', data, apiLogbookUrl, superChangeTypeLogbookHandler, superChangeTypeLogbookHandler, true);
        document.querySelector('.section__popup').remove();
    }
}

function superChangeTypeLogbookHandler(response) {
    showNewModal('responseHandler successHandler', '', `<p class="row__text success">Request sent successfully</p>`, '');

    setTimeout(() => {
        document.querySelector('.section__popup').remove();
    }, 2000);

    logbook.changeLogbook();
}

function curUserIsSmartSafety(userId = curUserId, info = false) {
    let curUserInfo = fleetC.getSmartSafety(userId);

    if (info) {
        return curUserInfo;
    }

    return typeof curUserInfo['SmartSafety'] != 'undefined' && curUserInfo['SmartSafety'] == 1;
}