var trackingMap = {}, 
	trackingMapGroup = {},
	trackingMapUi = {},
	trackingMapMarkers = [],
	defaultCenter = { lat:38.72215217484852, lng: -98.61898462392776 },
	statesCoordinates = [],
	timeoutCities = [],
	unknownStates = [],
	unknownCities = [],
	globalUnknownCities = [];
function filterArrayByKey(array, value, key) {
    var filter_array = array.filter(x => x[key] === value);
    return filter_array; 
}
function filterArray(array, value, key) {
    var filter_array = array.filter(a => a[key] === value);
    return array.indexOf(filter_array[0]);
}
function checkCityCoordinates(item){
    var lat = item.lat,
        lng = item.lng,
        title = item.city + ', '+item.state;
        item.title = title;
    //if we know city lat, lng 
    if(lat!=null && lng!=null){
        addMarker(item);
        return true;
    }
	fillUnknown(item);
    return true;
}
function fillUnknown(obj){ 
    var stateName = obj.state.toString(); 
    var stateMarkerIndex = filterArray(trackingMapMarkers, stateName, 'title');
    if(stateMarkerIndex != -1){
        var supportMarker = trackingMapMarkers[stateMarkerIndex].support;
        $.each(obj.support, function(key, support){
            supportMarker.push(support);
        });
        trackingMapMarkers[stateMarkerIndex].support = supportMarker;
    } else {
        var stateCoordinates = filterArrayByKey(statesCoordinates, stateName, 'state_name')[0];
        if(typeof stateCoordinates != 'undefined'){
            var latlng = new google.maps.LatLng(stateCoordinates.lat, stateCoordinates.lng);
            var stateMarker = {
                //carrierId: obj.carrierId,
                city: stateName,
                title: stateName,
                lat: stateCoordinates.lat, 
				lng: stateCoordinates.lng,
                support: obj.support
            }
            addMarker(stateMarker);
        } else {
			if(unknownStates.indexOf(stateName) == -1){
				unknownStates.push(stateName);
			}
		}
    }

    if(globalUnknownCities.indexOf(obj.title)==-1){
       globalUnknownCities.push(obj.title); 
    }
}
function saveCityCoordinates(responce){  c('saveCityCoordinates');
    //c(responce);
}
function errorSaveCityCoordinates(responce){ c('errorSaveCityCoordinates');
    //c(responce);
}
function filterMap(){ c('filterMap');
    $('#date_type, #allZone').prop('disabled',true);
    AjaxController('getFleetSupportInfoMap', {dateType:$('#date_type').val(), allZone: $('#allZone').val()}, adminUrl, 'drawTrackingMap', errorTrackingMap, true);
}
function clearMap(){ c('clearMap');
    for (var i = 0; i < trackingMapMarkers.length; i++) {
		trackingMapGroup.removeObject(trackingMapMarkers[i]);
    }
    trackingMapMarkers = [];
    unknownCities = [];
}
function initializeTrackingMap(){ c('initializeTrackingMap');
	var platform = new H.service.Platform({
		app_id: HERE_APP_ID,
		app_code: HERE_APP_CODE,
		useHTTPS: true
	});
	var pixelRatio = window.devicePixelRatio || 1;
	var defaultLayers = platform.createDefaultLayers({
		tileSize: pixelRatio === 1 ? 256 : 512,
		ppi: pixelRatio === 1 ? undefined : 320
	});
	// Instantiate (and display) a map object:
	trackingMap = new H.Map(
		document.getElementById('trackingMap'), 
		defaultLayers.normal.map,{
            zoom: 3,
			center: defaultCenter
		});
	trackingMap.getBaseLayer().setMin(2);
	window.addEventListener('resize', function (){
		if ($.isFunction(trackingMap.getViewPort))
			trackingMap.getViewPort().resize();
	});
	var behavior = new H.mapevents.Behavior(new H.mapevents.MapEvents(trackingMap));
	trackingMapGroup = new H.map.Group();
	trackingMap.addObject(trackingMapGroup);
	// Create the default UI components
	trackingMapUi = H.ui.UI.createDefault(trackingMap, defaultLayers);
        // Set the UI unit system to imperial measurement
        trackingMapUi.setUnitSystem(H.ui.UnitSystem.IMPERIAL);
	fullScreenControl('trackingMap');
	trackingMapMarkers = [];
    filterMap();
}
function drawTrackingMap(responce){  c('drawTrackingMap'); c(responce);
    clearMap();
    supportStates = responce.data.supportInfo;
    statesCoordinates = responce.data.statesCoordinates;
    var managerZone = responce.data.managerStates.name;
    $('.zone').remove();
    if(typeof managerZone != 'undefined' && $('#allZone').val() == 0){
        $('.nav_dis').after('<h3 class="zone" style="margin-top: 12px; margin-left: 10px;">'+managerZone+'</h3>');
    }
    $.each(supportStates, function(key, state){
        $.each(state.cities, function(key, city){
                checkCityCoordinates(city);
        });  
    });
    $('#date_type, #allZone').prop('disabled',false);
	if(trackingMapMarkers.length > 1){
		trackingMap.setViewBounds(trackingMapGroup.getBounds());
	} else {
		trackingMap.setCenter(defaultCenter);
		trackingMap.setZoom(4);
}
}
function errorTrackingMap(responce){  
    c('errorTrackingMap');
    $('#date_type, #allZone').prop('disabled',false);
}
function changeManagerZone(obj){
    var zoneId = $(obj).val();
    var managerId = $(obj).attr('manager-id');
    AjaxController('updateManagerZone', {managerId: managerId, zoneId: zoneId}, adminUrl, 'updateManagerZone', errorUpdateManagerZone, true);
}
function updateManagerZone(responce){ 
    c('updateManagerZone'); c(responce);
}
function errorUpdateManagerZone(responce){  
    c('errorUpdateManagerZone'); c(responce);
}
function addMarker(city) { c(city);
    var support = Array.isArray(city.support) ? city.support : [city.support];
	var coords = {lat: city.lat, lng: city.lng},
		marker = new H.map.Marker(coords);
	marker.title = city.title;
    marker.support = support;
	marker.addEventListener('tap', function(evt) { c('tap marker'); c(marker);
		var lat = marker.getPosition().lat,
			lng = marker.getPosition().lng;
        var info_content ='<div class="table_wrap"><table class="table table-striped table-dashboard table-sm">';
         info_content +='<tr><th>Carrier</th><th>Address</th><th>Date and Time</th><th>Message</th></tr>';
        $.each(marker.support, function(key, support){
            var address = [];
            if(support.state!=''){  address.push(support.state); }
            if(support.city!=''){ address.push(support.city); }
            if(support.address!=''){  address.push(support.address); }
            if(support.zip!=''){  address.push(support.zip); }
            info_content +='<tr>';
            info_content += '<td>'+support.name+'</td>';
            info_content += '<td>'+address.join(', ')+'</td>';
            info_content += '<td>'+timeFromSQLDateTimeStringToUSAString(support.dateTime, true)+'</td>';
            info_content += '<td>'+support.message+'</td>';
            info_content +='</tr>';
        });
        info_content +='</table></div>';
        showModal(city.title, info_content);
		//$(window).resize();
    });
	trackingMapGroup.addObjects([marker]);
	trackingMapMarkers.push(marker);
    } 
