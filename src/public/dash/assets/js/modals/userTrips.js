function userTripsCard(userId) {
    var self = this;
    self.userId = userId;
    self.cntrlUrl = apiDashUrl;
    self.modalElement = '';
    self.tableId = 'user_trips_' + userId;
    modalCore(self);

    self.modalId = 'user_trips_box';
    self.modalTitle = 'USER TRIPS';
    self.paginator = false;
    self.tabs = [];
    self.forceSearchParams = [{key: 'userId', val: userId}];
    
    self.currentRoute;
    self.routeList;
    
    self.initRequest = function () {
        AjaxController('getUserTripsCardInit', {userId: userId}, self.cntrlUrl, self.init, self.init, true);
    }
    
    self.init = function(response) {
        c(response);
        
        self.currentRoute = response.data.result.currentRoute;
        self.routeList = response.data.result.routeList;
        
        self.generateHeaders();
        self.generateButtons();
        self.createModal();
    }
    
    self.showEditTrip = function() {
        self.modalElement.find('.switch_body').remove();
        self.modalElement.find('.save_edit, .update_result, .return_to_user_trips').remove();
        
        self.modalElement.find('.dropDownTabs, .modal-footer .cardPaginator.pg_pagin, .popup_box_body, .control-buttons, .tableTabButtonsBox').hide();
        
        var tripId = $(this).attr('data-trip-id');
        var tripInfo;
        $.each(self.routeList, function(k,v){
            if(v.id == tripId){
                tripInfo = v;
            }
        });
        var tripParams = JSON.parse(tripInfo.params);
        
        var tripWayPoints = ``;
        
        $.each(tripParams.waypoints, function(key, value){
            tripWayPoints += '<div class="form-group blockStop">\n' +
                                '<label class="unselectable">Stop '+(key + 1)+'</label>\n' +
                                '<div class="input_place input-group location_name_cont">\n' +
                                '<input type="text" value="'+value.name+'" class="form-control point" placeholder="Location Name" autocomplete="off" onkeyup="userTripsMap.autocompleteAddress(this)">\n' +
                                '<span class="input-group-btn"><button type="button" class="btn btn-default" onclick="userTripsMap.clearTripSection(this)"> - </button></span>\n' +
                            '</div></div>';
        });
        
        self.modalElement.find('.modal-body').append(`<div class="switch_body">
            <section id="tripWayPointsBlock" class="">
                <div class="col-sm-12">
                <h2>EDIT TRIP ${tripInfo.name} (${tripId})</h2>
                </div>
                    <div class="col-sm-5">
                    <div class="form-group">
                        <label class="unselectable">Name</label>
                        <div class="row">
                                <div class="col-xs-12 location_name_cont">
                                    <input type="text" value="${tripInfo.name}" class="form-control name" placeholder="Rout Name">
                                </div>
                            </div>
                        </div>
                    <div class="form-up-label" id="tripWayPointsForm">
                        <div class="form-group">
                            <label for="fromPoint" class="unselectable">From</label>
                            <div class="row">
                                    <div class="col-xs-12 location_name_cont">
                                        <input type="text" value="${tripParams.startName}" class="form-control point" placeholder="Location Name" onkeyup="userTripsMap.autocompleteAddress(this)">
                                    </div>
                                </div>
                            </div>
                            ${tripWayPoints}
                        <div class="form-group">
                            <label for="toPoint" class="unselectable">To</label>
                            <div class="row">
                                    <div class="col-xs-12 location_name_cont">
                                        <input type="text" value="${tripParams.endName}" class="form-control point" placeholder="Location Name" onkeyup="userTripsMap.autocompleteAddress(this)">
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="form-group">
                        <label class="unselectable">Active</label>
                        <div>
                            <div class="check_buttons_block" id="edit_trip_isActive">
                            <button type="button" class="btn btn-default ${tripInfo.active == 1 ? 'active' : ''}" onclick="doActive(this)" data-val="1">On</button>
                            <button type="button" class="btn btn-default ${tripInfo.active == 0 ? 'active' : ''}" onclick="doActive(this)" data-val="0">Off</button>
                            </div>
                        </div>
                    </div>
                        <div class="form-up-label">
                            <div class="form-group">
                                <button type="button" class="btn btn-default" onclick="userTripsMap.btnRunTrip()">Run Trip</button>
                                <button type="button" class="btn btn-default" onclick="userTripsMap.clearTrip()">Clear Trip</button>
                                <button type="button" class="btn btn-default" onclick="userTripsMap.addEditStop()">Add Stop</button>
                            </div>
                        </div>
                    </div>
                    <div class="col-sm-7">
                        <div id="editHereMapTrips" style="height:400px; margin-bottom: 10px;"></div>
                    </div>
            </section>
        </div>`);
        
        var formGC = $('#tripWayPointsForm .form-group').length;
        $.each($('#tripWayPointsForm input.point'), function(k,v){
            if (k == 0) {
                $(v).data({lat: tripParams.startLatitude, lng: tripParams.startLongitude});
            } else if (k == (formGC - 1)) {
                $(v).data({lat: tripParams.endLatitude, lng: tripParams.endLongitude});
            } else {
                $.each(tripParams.waypoints, function(key, value){
                    if (key == (k - 1)) {
                        $(v).data({lat: value.latitude, lng: value.longitude});
                    }
                });
            }
        });
        
        userTripsMap.initElementDrug($('#tripWayPointsForm .form-group'));
        
        userTripsMap.hMap = {};
        userTripsMap.object = editHereMapTrips;
        userTripsMap.showMap();
        userTripsMap.hMap.getViewPort().resize();
        
        userTripsMap.btnRunTrip();
        
        self.modalElement.find('.modal-footer').append('<label class="update_result"></label><button class="btn btn-default save_edit" onclick="saveOrUpdateTrips(' + tripId + ')">Save</button><button class="btn btn-default return_to_user_trips">Close</button>');
        
        self.modalElement.find('.modal-footer .return_to_user_trips').click(self.returnToInitState);
    }
    
    self.returnToInitState = function(){
        self.modalElement.find('.switch_body').remove();
        self.modalElement.find('.save_edit, .update_result, .return_to_user_trips').remove();
        
        self.modalElement.find('.dropDownTabs, .modal-footer .cardPaginator.pg_pagin, .popup_box_body, .control-buttons, .tableTabButtonsBox').show();
    };
    
    self.generateHeaders = function () {
        var headers = [];
        
        if (typeof self.currentRoute != 'undefined') {
            headers.push({label: 'Name', value: self.currentRoute.name});

            var curParams = JSON.parse(self.currentRoute.params);
            headers.push({label: 'Stop Points', value: self.splitWayPoints(curParams.waypoints)});
            headers.push({label: 'Start Point', value: `${curParams.startName} (${curParams.startLatitude},${curParams.startLongitude})`});
            headers.push({label: 'End Point', value: `${curParams.endName} (${curParams.endLatitude},${curParams.endLongitude})`});
        } else if (typeof self.routeList != 'undefined') {
            headers.push({label: 'Name', value: self.routeList[0].name});

            var curParams = JSON.parse(self.routeList[0].params);
            headers.push({label: 'Stop Points', value: self.splitWayPoints(curParams.waypoints)});
            headers.push({label: 'Start Point', value: `${curParams.startName} (${curParams.startLatitude},${curParams.startLongitude})`});
            headers.push({label: 'End Point', value: `${curParams.endName} (${curParams.endLatitude},${curParams.endLongitude})`});
        } else {
            headers.push({label: 'Name', value: ''});

            headers.push({label: 'Stop Points', value: ''});
            headers.push({label: 'Start Point', value: ''});
            headers.push({label: 'End Point', value: ''});
        }
        
        self.setCardHeaders(headers);
    }
    
    self.generateButtons = function () {
        var buttons = [];
        
        buttons.push('<button class="btn btn-default" onclick="showCreateTripsModal(' + self.userId + ')">Create Route</button>');
        
        self.setCardActionsButtons(buttons);
        
        self.tabs.push({
            label: 'Trips List',
            cl: 'tripsList',
            request: 'getUserTripsCardTripsListPagination',
            handler: 'getUserTripsCardTripsListPaginationHandler',
            tableHeader: `<tr>
                <th>ID</th>
                <th>Name</th>
                <th>Start</th>
                <th>End</th>
                <th>Stop Points</th>
                <th>Active</th>
            </tr>`
        });
        
        self.setCardTabs(self.tabs);
    }
    
    self.getUserTripsCardTripsListPaginationHandler = function(response) {
        var tbody = '';
        response.data.result.forEach((item) =>
        {
            var params = JSON.parse(item.params);
            c(JSON.parse(item.params));
            var waypoints = '';//&rArr;
            $.each(params.waypoints, function(key, val){
                if (key == 0) {
                    waypoints += val.name;
                } else {
                    waypoints += ' &rarr; ' + val.name;
                }
            });
            tbody += `<tr data-trip-id="${item.id}">
                <td>${item.id}</td>
                <td>${item.name}</td>
                <td>${params.startName}</td>
                <td>${params.endName}</td>
                <td>${waypoints != '' ? waypoints : 'No Points'}</td>
                <td>${item.active == 1 ? 'Active' : 'Not Active'}</td>
            </tr>`;
        });
        self.modalElement.find('#' + self.tableId).addClass('tripsListTable');
        self.modalElement.find('#' + self.tableId).find('tbody').html(tbody);
        
        self.modalElement.find('.tripsListTable tbody tr').click(self.showEditTrip);
    }
    
    self.splitWayPoints = function(waypoints) {
        var splitWayPoints = '';
        $.each(waypoints, function(k, value){
            if (k == 0) {
                splitWayPoints += value.name + `(${value.latitude},${value.longitude})`;
            } else {
                splitWayPoints += ' &rarr; ' + value.name + `(${value.latitude},${value.longitude})`;
            }
        });
        return splitWayPoints;
    }
    
    self.initRequest();
}

function showCreateTripsModal(userId = 0) {
    var title = 'Create Trip';
    var content = `
        <section id="tripWayPointsBlock" class="">
            <div class="row margin-bottom-10px">
                <div class="col-sm-5">
                    <div class="form-group">
                        <label class="unselectable">Name</label>
                        <div class="row">
                            <div class="col-xs-12">
                                <input type="text" class="form-control name" placeholder="Rout Name">
                            </div>
                        </div>
                    </div>
                    <div class="form-up-label" id="tripWayPointsForm">
                        <div class="form-group">
                            <label for="fromPoint" class="unselectable">From</label>
                            <div class="row">
                                <div class="col-xs-12 location_name_cont">
                                    <input type="text" class="form-control point " placeholder="Location Name" onkeyup="userTripsMap.autocompleteAddress(this)">
                                </div>
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="toPoint" class="unselectable">To</label>
                            <div class="row">
                                <div class="col-xs-12 location_name_cont">
                                    <input type="text" class="form-control point " placeholder="Location Name" onkeyup="userTripsMap.autocompleteAddress(this)">
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="form-up-label">
                        <div class="form-group">
                            <button type="button" class="btn btn-default" onclick="userTripsMap.btnRunTrip()">Run Trip</button>
                            <button type="button" class="btn btn-default" onclick="userTripsMap.clearTrip()">Clear Trip</button>
                            <button type="button" class="btn btn-default" onclick="userTripsMap.addStop()">Add Stop</button>
                        </div>
                    </div>
                </div>
                <div class="col-sm-7">
                    <div id="createHereMapTrips" style="height:400px; margin-bottom: 10px;"></div>
                </div>
                <hr />
            </div>
        </section>
        `;
    
        var modalParams = {};
        modalParams.footerButtons = `<button class="btn btn-default" onclick="saveOrUpdateTrips(0, ${userId});">Save</button>`;
    
        showModal(title, content, 'createTripModal', 'modal-lg', modalParams);
        
        userTripsMap.hMap = {};
        userTripsMap.object = createHereMapTrips;
        userTripsMap.showMap();
        userTripsMap.hMap.getViewPort().resize();
}

function getUserTripsPopupInfo(userId = 0) {
    c('getUserTripsPopupInfo');
    if (userId == 0) {
        if (window.location.pathname == '/dash/drivers/') {
            userId = $('#drivers_table .active').attr('data-id');
        }
    }
    c(userId);
    new userTripsCard(userId);
}

function saveOrUpdateTrips(tripId = 0, userId = 0) {
    c('saveOrUpdateTrips');
    var data = {};
    
    if(userId != 0) {
        data.userId = userId;
    }
    
    if (tripId != 0) {
        data.tripId = tripId;
    }
    
    var active = $('#edit_trip_isActive .active').attr('data-val');
    if (typeof active != 'undefined') {
        data.active = active;
    }
    
    var name = $('#tripWayPointsBlock .form-group input.name').val();
    if ($.trim(name) == '') {
        showModal('Message', 'Please enter the route name.', 'errorMessage');
        return false;
    }
    data.name = name;
    
    data.waypoints = [];
    
    var points = $('#tripWayPointsBlock .form-group input.point');
    var pointCount = points.length;
    var errorPoints = 0;
    $.each(points, function (k, point) {
        var pointName = $(point).val();
        var pointData = $(point).data();
        if (k == 0) {
            data.startName = pointName;
            if (typeof pointData.lat !== 'undefined' && typeof pointData.lng !== 'undefined') {
                //points.push({lat: pointData.lat, lng: pointData.lng});
                data.startLatitude = pointData.lat;
                data.startLongitude = pointData.lng;
            } else {
                errorPoints++;
            }
        } else if(k == (pointCount - 1)) {
            data.endName = pointName
            if (typeof pointData.lat !== 'undefined' && typeof pointData.lng !== 'undefined') {
                data.endLatitude = pointData.lat;
                data.endLongitude = pointData.lng;
            } else {
                errorPoints++;
            }
        } else {
            var waypoint = {};
            waypoint.name = pointName;
            if (typeof pointData.lat !== 'undefined' && typeof pointData.lng !== 'undefined') {
                waypoint.latitude = pointData.lat;
                waypoint.longitude = pointData.lng;
            } else {
                errorPoints++;
            }
            
            data.waypoints.push(waypoint);
        }
    });
    
    if (errorPoints > 0) {
        showModal('Message', 'Please enter the destination point of route.', 'errorMessage');
        return false;
    }
    
    c(data);
    
    AjaxController('saveOrUpdateTrips', data, apiDashUrl, 'saveOrUpdateTripsHandler', saveOrUpdateTripsHandler, true);
}

function saveOrUpdateTripsHandler(response) {
    c(response);
    if (response.code == '000') {
        if ($('#createTripModal').length > 0) {
            $('#createTripModal .modal-header button.close').click();
            $('#user_trips_box').find('.modal-header button.close').click();
            new userTripsCard(response.data.result.userId);
        } else {
            $('#user_trips_box').find('.modal-footer .update_result').css({'color':'#27ae60'}).text('Success Update');
            setTimeout(function(){
                $('#user_trips_box').find('.modal-footer .update_result').empty();
                $('#user_trips_box').find('.modal-header button.close').click();
                new userTripsCard(response.data.result.userId);
            }, 3000);
        }
    } else if(response.code == '103') {
        $('#user_trips_box').find('.modal-footer .update_result').css({'color':'#27ae60'}).text('Update successful. Driver approved needed.');
        setTimeout(function(){
            $('#user_trips_box').find('.modal-footer .update_result').empty();
        }, 5000);
    }
}
