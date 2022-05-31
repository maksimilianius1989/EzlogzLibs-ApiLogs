function agriController() {
	var self = this;
	this.newAgriMap = {}; 
	this.behavior = {};
	this.agriUi = {}; 
	this.group = []; 
	this.platform = {};
	this.circleStyle = { strokeColor: 'rgba(50, 205, 50, 0.9)', fillColor: 'rgba(50, 205, 50, 0.5)', lineWidth: 1};
	this.addAgroMode = false;
	this.markers = [];
	this.circles = [];
	
	this.initMap = function(lat, lng) { c('init Agri map');
		self.markers = [];
		self.circles = []; 
		self.platform = new H.service.Platform({
			app_id: HERE_APP_ID,
			app_code: HERE_APP_CODE,
			useHTTPS: true
		});
		var pixelRatio = window.devicePixelRatio || 1;
		var defaultLayers = self.platform.createDefaultLayers({
			tileSize: pixelRatio === 1 ? 256 : 512,
			ppi: pixelRatio === 1 ? undefined : 320
		});
		// Instantiate (and display) a map object:
		self.newAgriMap = new H.Map(
			document.getElementById('hereMap'), 
			defaultLayers.normal.map,{
				zoom: 4,
				center: { lat:lat, lng: lng }
			});
		self.newAgriMap.getBaseLayer().setMin(2);
		window.addEventListener('resize', function (){
			if ($.isFunction(self.newAgriMap.getViewPort))
				self.newAgriMap.getViewPort().resize();
		});
		// self.behavior implements default interactions for pan/zoom (also on mobile touch environments)
		self.behavior = new H.mapevents.Behavior(new H.mapevents.MapEvents(self.newAgriMap));
		self.group = new H.map.Group();
		self.newAgriMap.addObject(self.group);
		// Create the default UI components
		self.agriUi = H.ui.UI.createDefault(self.newAgriMap, defaultLayers);
                // Set the UI unit system to imperial measurement
                self.agriUi.setUnitSystem(H.ui.UnitSystem.IMPERIAL);
		AjaxController('getAgroDrivers', {}, dashUrl, self.drawAgroDrivers, self.drawAgroDrivers, true); 
		AjaxController('getAgroCenters', {}, dashUrl, self.drawAgroCenters, self.drawAgroCenters, true);
		fullScreenControl('hereMap');
		$('#agroForm').find('#phone').mask('000 000 0000');
	} 
	this.agroMode = function(){
		self.clearMap();
		$('#agroForm').find('input').val('');
		$('#map_section').addClass('addAgroMode');
		self.addAgroMode = true;
		var center = self.newAgriMap.getCenter();
		self.centerMarker(center);
	}	
	this.cancelAgroMode = function(){
		self.agriUi.getBubbles().forEach(bub => self.agriUi.removeBubble(bub));
		$('#map_section').removeClass('addAgroMode');
		var activeMarkerIndex = $('#agroForm').attr('marker-index');
		if(activeMarkerIndex!=''){
			var marker = self.markers[activeMarkerIndex];
			marker.setVisibility(true);
			self.circles[activeMarkerIndex].setVisibility(true);
			$('#agroForm').attr('marker-index','');
		}
		self.addAgroMode = false;
		self.clearMap();
		$('#agroForm input').removeClass('error');
		$('#save_ag_center').attr('disabled', false);
	}
	this.clearMap = function(){ c('clearMap');
		self.removeObjectsById('newMarker');
		self.agriUi.getBubbles().forEach(bub => self.agriUi.removeBubble(bub));
		$('#agroForm').attr('marker-index', '');
	}
	this.removeObjectsById = function(id){
		var mapObjects = self.newAgriMap.getObjects();
		var removedElements = mapObjects.filter(x => x.id==id);
		if(removedElements.length > 0){ c(self.group.getObjects()); 
			$.each(removedElements, function(key, item){
				c(self.group.contains(item));
				if(self.group.contains(item)){
					self.group.removeObject(item);
				}
			});
		}
	}    
	this.centerMarker = function(center){ c('centerMarker');
		self.removeObjectsById('newMarker');
		self.newAgriMap.setCenter(center);
		var icon = new H.map.Icon('/dash/assets/img/googleMarker.png', {size: {w: 32, h: 54}}),
			marker = new H.map.Marker(center, {icon: icon}),
			circle = new H.map.Circle(center, 277604.25,{style: self.circleStyle});
		self.group.addObject(marker);
		self.group.addObject(circle);
		marker.id = 'newMarker';
		circle.id = 'newMarker';
		self.newAgriMap.addEventListener('drag', function(ev) {
			var target = ev.target; 
			if (target instanceof H.Map) {
				var centerMap = self.newAgriMap.getCenter();
				marker.setPosition(centerMap);
				circle.setCenter(centerMap);
			}
		}, false);
		self.newAgriMap.addEventListener('dragend', function(ev) {
			var target = ev.target; 
			if (target instanceof H.Map) {
				var centerMap = self.newAgriMap.getCenter();
				self.moveMarker(centerMap);
			}
		}, false);
	}
	this.moveMarker = function(centerLatLng){
		var lat = centerLatLng.lat,  	 
		   lng = centerLatLng.lng; 
		$('#lng').val(lng);
		$('#lat').val(lat);
		plcApi.getLocationFromLatLng({lat, lng});
	}
	this.validateAgroInfo = function(field_type, field_value) { 
		var error = 0;
		var regex = '';
		field_value  = $.trim(field_value);
		switch (field_type) {
			case 'address': 
				regex = /^[^\~]{1,130}$/; break;
			case 'phone': 
				regex = /^\d{3}\s\d{3}\s\d{4}$/; break; 
			case 'name':
				regex = /^([a-zA-Z0-9\-\'\s]){1,64}$/; break;
			default:
				regex = ''; break;
		}
		if(regex!=''){
			error = !regex.test(field_value);
		}
		return !error;
	}	
	this.saveAgroCenter = function(){
		$('#save_ag_center').attr('disabled', true);
		var error = 0;
		var fields = {};
		$('#agroForm input').each(function (){
			var id = $(this).attr('id');
			var field = id.toString();
			var field_value = $(this).val();
			if(!self.validateAgroInfo(field, field_value)){
				$(this).addClass('error');
				error++;
			} else {
				fields[field] = $.trim(field_value);
			}
		}); 
		if(error>0){
			$('#save_ag_center').attr('disabled', false);
			return false;
		}
		$('#agroForm input').removeClass('error');
		
		var centerId = -1;
		var activeMarkerIndex = $('#agroForm').attr('marker-index');
		if(activeMarkerIndex!=''){
			var marker = self.markers[activeMarkerIndex];
			centerId = marker.centerId;
			fields['centerId'] = centerId;
			$('#agroForm').attr('marker-index','');
			AjaxController('updateAgroCenter', fields, dashUrl, self.updateAgroCenterHandler, self.updateAgroCenterHandler, true);
		} else {
			AjaxController('addAgroCenter', fields, dashUrl, self.addAgroCenterHandler, self.addAgroCenterHandler, true);
		}   
	}
	this.addAgroCenterHandler = function(responce){ c('addAgroCenterHandler');
		c(responce);
		self.cancelAgroMode();
		self.agroMarker(responce.data, true);
	}
	this.updateAgroCenterHandler = function(responce){ c('updateAgroCenterHandler');
		c(responce);
		self.cancelAgroMode();
		var center = responce.data;
		var centerId = center.id;
		for(var i = 0; i < self.markers.length; i++){
			if(self.markers[i].centerId == centerId){ 
				var marker = self.markers[i];
				var circle = self.circles[i];				
				c('marker'); c(marker);
				c('circle'); c(circle); 
				
				marker.title = center.name;
				marker.address = center.address;
				marker.lat = center.lat;
				marker.lng = center.lng;
				marker.phone = center.phone;
				marker.setPosition({lat: center.lat, lng: center.lng});
				circle.setCenter({lat: center.lat, lng: center.lng});
				marker.setVisibility(true);
				circle.setVisibility(true);
			}
		}
	}
	this.editAgroCenter = function(markerIndex){
		self.clearMap();
		$('#agroForm').find('input').val('');
		$('#map_section').addClass('addAgroMode');
		var oldActiveMarker = $('#agroForm').attr('marker-index');
		if(oldActiveMarker != ''){
			var old = self.markers[oldActiveMarker];
			marker.setVisibility(true); 
			self.circles[markerIndex].setVisibility(true); 
		}
		$('#agroForm').attr('marker-index', markerIndex);
		self.addAgroMode = true;
		var marker = self.markers[markerIndex];
		var lat = marker.getPosition().lat,
			lng = marker.getPosition().lng,
			name = marker.title,
			phone = marker.phone,
			address = marker.address;
		//self.newAgriMap.setCenter();
		marker.setVisibility(false); 
		self.circles[markerIndex].setVisibility(false); 
		self.centerMarker(marker.getPosition()); 
		$('#lng').val(lng);
		$('#lat').val(lat);
		$('#address').val(address);
		$('#name').val(name);
		$('#phone').val(phone);
	}
	this.removeAgroCenter = function(markerIndex){ 
		var marker = self.markers[markerIndex];
		c('removeAgroCenter');
		AjaxController('removeAgroCenter', {centerId: marker.centerId}, dashUrl, self.removeAgroCenterHandler, self.removeAgroCenterHandler, true);
	}
	this.removeAgroCenterHandler = function(responce){ 
		self.clearMap();
		c('removeAgroCenterHandler');
		var markerIndex = parseInt(responce.data);
		for(var i = 0; i < self.markers.length; i++){
			if(self.markers[i].centerId == markerIndex){
				self.markers[i].id = 'remove';
				self.circles[i].id = 'remove';
				self.removeObjectsById('remove');
			}
		} 
	}	
	this.drawAgroDrivers = function(responce){ c('drawAgroDrivers'); c(responce);
		var agroDrivers = responce.data;
		$.each(agroDrivers, function(key, driver){
			if( driver.locationInfo.length > 0){
				var driverData = {name: (driver.name+' '+driver.last), lat: driver.locationInfo[0].latitude, lng: driver.locationInfo[0].longitude};
				self.driverMarker(driverData);
			}
		});
	}
	this.drawAgroCenters = function(responce){  c('drawAgroCenters'); c(responce);
		var agroCenters = responce.data;
		$.each(agroCenters, function(key, center){
			self.agroMarker(center);
		});
	}
	this.driverMarker = function(driver) {c('driverMarker'); 
		var name = driver.name;
		var address = driver.address;
		var svgMarkup = '/dash/assets/img/fleetMapTruck.png';
		var icon = new H.map.Icon(svgMarkup),
		  coords = {lat: driver.lat, lng: driver.lng},
		  marker = new H.map.Marker(coords, {icon: icon});
		self.newAgriMap.addObject(marker);
		self.group.addObjects([marker]);
		marker.addEventListener('tap', function(evt) { c('tap driver marker');
			self.cancelAgroMode();
			var lat = marker.getPosition().lat,
				lng = marker.getPosition().lng;
			var info_content = '<div class="hereMapPopupContent"><div class="hereMapPopupRow"><div class="hereMapPopupText">'+name+'</div></div></div>';
			self.agriUi.getBubbles().forEach(bub => self.agriUi.removeBubble(bub));
			var bubble =  new H.ui.InfoBubble(evt.target.getPosition(), { content: info_content });
			self.agriUi.addBubble(bubble);
			$(window).resize();
			//.newAgriMap.getViewPort().resize();
		});
	}
	this.agroMarker = function(center, newM = false) {c('agroMarker');
		var existMarker= self.markers.findIndex(x => x.centerId==center.id);
		if(existMarker!=-1){
			return false;
		}    
		var svgMarkup = '/dash/assets/img/agri_pin.png';
		var icon = new H.map.Icon(svgMarkup),
			coords = {lat: center.lat, lng: center.lng},
			marker = new H.map.Marker(coords, {icon: icon}),
			markerCircle = new H.map.Circle({lat:center.lat, lng:center.lng}, 277604.25,{style: self.circleStyle});
		//custom params
		marker.title = center.name;
		marker.centerId = center.id;
		marker.address = center.address;
		marker.phone = center.phone;
		self.markers.push(marker);
		var markerIndex = self.markers.indexOf(marker);
		self.circles.splice(markerIndex, 0, markerCircle);
		self.group.addObjects([marker, markerCircle]);
		if(self.markers.length > 2 && !newM){
			self.newAgriMap.setViewBounds(self.group.getBounds());
		}
		marker.addEventListener('tap', function(evt) { c('tap agriCenter marker');
			self.cancelAgroMode();
			var lat = marker.getPosition().lat,
				lng = marker.getPosition().lng;
			var info_content = '<div class="hereMapPopupContent">';
				info_content += '<div class="hereMapPopupRow"><div class="hereMapPopupText"><label>Address:</label>'+marker.address+'</div></div>';
				info_content += '<div class="hereMapPopupRow"><div class="hereMapPopupText"><label>Lat:</label>'+roundPlus(lat,6)+'</div></div>';
				info_content += '<div class="hereMapPopupRow"><div class="hereMapPopupText"><label>Long:</label>'+roundPlus(lng,6)+'</div></div>';
				info_content += '<div class="hereMapPopupRow"><div class="hereMapPopupText"><label>Name:</label>'+marker.title+'</div></div>';
				info_content += '<div class="hereMapPopupRow"><div class="hereMapPopupText"><label>Phone:</label>'+marker.phone+'</div></div>';
				info_content += '<div class="hereMapPopupRow buttons blockForDispatcher"><button id="save_ag_center" class="no_left_margin btn btn-default" onclick="agriC.editAgroCenter('+markerIndex+')">Edit</button>';
				info_content += '<button id="cancel_ag_center" class="no_left_margin btn btn-default" onclick="agriC.removeAgroCenter('+markerIndex+')">Remove</button></div></div>';
			self.agriUi.getBubbles().forEach(bub => self.agriUi.removeBubble(bub));
			var bubble =  new H.ui.InfoBubble(evt.target.getPosition(), { content: info_content });
			self.agriUi.addBubble(bubble);
			$(window).resize();
		});
	}  
	this.sendLocationFromLatLngHandler = function (data) { //c('sendLocationFromLatLngHandler');
		if(window.location.pathname != '/dash/agriculture/'){ 
			return false;
		}
		var resultStr = 'No address';
        var res = data.result;
		var placeObj = [];
		if(typeof res.Street !== 'undefined'){
			placeObj.push(res.Street);
		}
		if(typeof res.State !== 'undefined'){
			placeObj.push(res.State);
		}
		if(typeof res.ZIP !== 'undefined'){
			placeObj.push(res.ZIP);
		}
		if(typeof res.Country !== 'undefined'){
			placeObj.push(res.Country);
		}
		resultStr = placeObj.length > 0 ? placeObj.join(", ") : typeof res.FormattedAddressLines !== 'undefined' ? res.FormattedAddressLines.join(", ") : resultStr;
        $('#address').val(resultStr).removeClass('error');
    }
	this.autocompleteAddress = function(el) { //c('autocompleteAddress');
		var searchStr = $(el).val(); 
		plcApi.locationAutocompleteKeyup(searchStr);
	} 
	this.sendLocationNamesFromStrHandler = function (data) { //c('sendLocationNamesFromStrHandler');
		if(window.location.pathname != '/dash/agriculture/'){
			return false;
		}
		if(typeof data.result == 'undefined'){
			c('No results');
		}
		var resultList = data.result;
		var searchedElementsBox = $('#searchedElementsBox');
		searchedElementsBox.empty();
        $.each(resultList, function (key, item) { //c(item);
            searchedElementsBox.append('<div class="oneSelectedBox" onclick="agriC.selectPlaceByStr(this)">' + item + '</div>');
		})
        searchedElementsBox.show();
    }
	this.selectPlaceByStr = function(el) { 
		var searchStr = $(el).text();
        plcApi.selectPlace(searchStr);
		$('#searchedElementsBox').empty().hide();
	} 
	this.sendLocationFromStrHandler = function (data) {
		if(window.location.pathname != '/dash/agriculture/'){
			return false;
		}
		if(typeof data.result == 'undefined'){
			c('No results');
		}
        var resultData = data.result;
        $('#address').val(resultData.searchStr).removeClass('error');
        $('#lat').val(resultData.lat);
        $('#lng').val(resultData.lng);
        $('#searchedElementsBox').empty().hide();
		self.centerMarker({lat: resultData.lat, lng: resultData.lng});
    }
}