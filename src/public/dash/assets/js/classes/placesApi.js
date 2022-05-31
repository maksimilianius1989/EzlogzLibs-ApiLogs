function placesApi() {
    var self = this;

    self.sendLocationNamesFromStrHandler = function (response) {
        logbook.sendLocationNamesFromStrHandler(response.data);
		agriC.sendLocationNamesFromStrHandler(response.data);
		iftaMap.sendLocationNamesFromStrHandler(response.data);
        userTripsMap.sendLocationNamesFromStrHandler(response.data);
    };

    self.sendLocationFromStrHandler = function (response) {
        logbook.sendLocationFromStrHandler(response.data);
		agriC.sendLocationFromStrHandler(response.data);
		iftaMap.sendLocationFromStrHandler(response.data);
        userTripsMap.sendLocationFromStrHandler(response.data);
    };

    self.sendLocationFromLatLngHandler = function (response) {
        logbook.sendLocationFromLatLngHandler(response.data);
        if(typeof driverMapHistory !== 'undefined'){
            driverMapHistory.sendLocationFromLatLngListHandler(response.data);
        }
        agriC.sendLocationFromLatLngHandler(response.data); 
        poiC.sendLocationFromLatLngHandler(response.data);
        ezchatActionC.sendLocationFromLatLngHandler(response.data);
        var res = response.data.result;
        var placeObj = [];
        if (typeof res.Street !== 'undefined')
            placeObj.push(res.Street);
        if (typeof res.State !== 'undefined')
            placeObj.push(res.State);
        if (typeof res.ZIP !== 'undefined')
            placeObj.push(res.ZIP);
        if (typeof res.Country !== 'undefined')
            placeObj.push(res.Country);
        var textLocation = placeObj.length ? placeObj.join(", ") : '';
        textLocation = textLocation == '' && typeof res.FormattedAddressLines !== 'undefined' ? res.FormattedAddressLines.join(", ") : textLocation;
        if(window.location.pathname == "/dash/drivers/"){
            $('.last_kn_pos[data-locsrc="' + response.data.result.searchStr + '"] .loc_pos').text(textLocation);
        } else if(window.location.pathname == "/dash/ez_smart_cam/"){
            $('.cam_location[data-locsrc="' + response.data.result.searchStr + '"]').text(textLocation+' ('+response.data.result.searchStr+')');
        }
    };

    this.locationAutocompleteKeyup = function (searchStr = '') {
        var data = {
            action: 'getLocationNamesFromStr',
            data: {
                searchStr: searchStr
            }
        };
        send(data);
    };

    this.selectPlace = function (searchStr = '') {
        var data = {
            action: 'getLocationFromStr',
            data: {
                searchStr: searchStr
            }
        };
        send(data);
    };

    this.getLocationFromLatLng = function (loc) {
        var data = {
            action: 'getLocationFromLatLng',
            data: {
                lat: loc.lat,
                lng: loc.lng
            }
        };
        send(data);
    };
}

if (typeof plcApi == 'undefined') {
    var plcApi = new placesApi();
}