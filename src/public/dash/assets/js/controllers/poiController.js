function poiController() {
    var self = this;
	this.paginator = {};
    this.states = {};
    this.placesTypes = {};
	this.defaultPlace = {
		active: 1,
		title: '',
		address: '',
		ln: 0,
		lt: 0,
		state: 0,
		city: '',
		zip: '',
		ext: '',
		fax: '',
		phone: '',
		highway: '',
		web: '',
		scale: 0,
        shower: 0,
        wifi: 0,
        atm: 0,
        bulk: 0,
        tire: 0,
        transFE: 0,
        RVDump: 0,
        overNP: 0,
        trParkSp: 0,
        workingTime: '',
		groupId: '',
		note: '',
	};
	this.dataBox = '#suggest_box';
	//Default maps settings
	this.defaultLayers = {};
    
	//All places map
	this.allPoiMap = {};
    this.allPoiMapElement = 'poiMap';
	this.allPoiMapUi = {};
	this.allPoiBehavior = {};
	this.allPoiGroup = {}; 
	this.allPoiMarker = {};
	this.allPoiOldZoom = 0;
	this.rectangle = false;
	this.markersArray = [];
	this.infowindow = {};
	
	//Edit place map
	this.poiMap = {};
	this.poiMapUi = {};
	this.poiBehavior = {};
	this.poiGroup = {}; 
	this.marker = {};
	this.poiOldZoom = 0;
	this.mapEditMode = 0;
	
    this.init = function (){
        //fill states
        AjaxController('getStates', {}, dashUrl, self.getStatesHandler, errorBasicHandler, true);
        //fill placesTypes
        AjaxController('getPoiItems', {}, dashUrl, self.getPlacesTypesHandler, errorBasicHandler, true);
    }
    this.addPoiOnAnyMap = function (hereMap){
		self.allPoiMapElement = hereMap.mapElement;
		self.allPoiMap = hereMap.hMap;
		self.allPoiMapUi = hereMap.hereUi;
		self.addPoiListeners();
	}
    
    this.addPoiListeners = function (){
		self.addPoiButtons();
		self.getPoiGroupsList();
		self.allPoiGroup = new H.map.Group();
		self.allPoiMap.addObject(self.allPoiGroup);
		self.allPoiOldZoom = self.allPoiMap.getZoom();
		self.allPoiMap.addEventListener('mapviewchangeend', function(){ c('mapviewchangeend');
			self.doCheck();
		});
		$('#w_s_button, #poi_chose').removeClass('active');
		if(getCookie('poi_ws') && getCookie('poi_ws') == 1){
			$('#w_s_button').addClass('active');
		} else if(getCookie('poi')){
			$('#poi_chose').addClass('active');
		}
	}
	this.initAllPoiMap = function (map){
        var platform = new H.service.Platform({
			app_id: HERE_APP_ID,
			app_code: HERE_APP_CODE,
			useHTTPS: true
		});
		var pixelRatio = window.devicePixelRatio || 1;
		self.defaultLayers = platform.createDefaultLayers({
			tileSize: pixelRatio === 1 ? 256 : 512,
			ppi: pixelRatio === 1 ? undefined : 320
		});  
		self.allPoiMapElement = map;
		self.allPoiMap = new H.Map(
			document.getElementById(self.allPoiMapElement),
			self.defaultLayers.normal.map,{
				zoom: 4,
				center: { lat:45.508742, lng: -90.120850 }
		});
		self.allPoiMap.getBaseLayer().setMin(2);
		window.addEventListener('resize', function () {
			if($.isFunction(self.allPoiMap.getViewPort) && $('#'+self.allPoiMapElement).is(':visible')){
				self.mapHeight();
				self.allPoiMap.getViewPort().resize();
			}
		});
		self.allPoiMapUi = H.ui.UI.createDefault(self.allPoiMap, self.defaultLayers);  
                // Set the UI unit system to imperial measurement
                self.allPoiMapUi.setUnitSystem(H.ui.UnitSystem.IMPERIAL);
		self.allPoiBehavior = new H.mapevents.Behavior(new H.mapevents.MapEvents(self.allPoiMap));
		self.addPoiListeners();
    }
    this.addPoiButtons = function (){
		$('#'+self.allPoiMapElement).find('>:last-child').append('<button id="poi_chose" onclick="poiC.poiChose(this)"></button><button id="w_s_button" onclick="poiC.wsChose(this)"></button>');
	}
	this.getPoiGroupsList = function (){
		AjaxController('PoiItems', {}, dashUrl, self.getPoiGroupsListHandler, errorBasicHandler);
	}
	this.getPoiGroupsListHandler = function(response){
		var poiGroups = '';
		$.each(response.data, function(index, item){
			if(item.id == 22){
				return false;
			}
			if(item.id == 15){
				poiGroups += `<p data-id="15_2">
									<input class="poi_marker" type="checkbox" onclick="poiC.checkPoiList(this)">
									<span class="poi_15_2"></span><span>Volvo</span>
								</p>`;
				return false;
			}
			poiGroups += `<p data-id="${item.id}">
				<input class="poi_marker" type="checkbox" onclick="poiC.checkPoiList(this)">
				<span class="poi_${item.id}"></span>
				<span>${item.name}</span>
			</p>`;
		});
		var poiGroupsList =`
			<div id="poi_chose_box">
				<i id="close_poi" class="fa fa-times" aria-hidden="true"></i>
				<h2>Points of interest</h2>
				<div id="poi_items">
					<p>
						<input class="poi_marker_n p_all" type="checkbox" onchange="poiC.getAllPoi(this)">
						<span id="checkAllPoi" onclick="poiC.getAllPoi(this)">Check all</span>
					</p> 
					${poiGroups}
				</div>
			</div>`;
		$('#'+self.allPoiMapElement).find('>:last-child').append(poiGroupsList);
		if(getCookie('poi')){
			cookie = unescape(getCookie('poi'));
			var poi = cookie.split(',');
			$.each(poi, function(index, item) {
				self.toggleItem(item);
			});
		}
	}
	this.mapHeight = function (){ 
		$('#'+self.allPoiMapElement).hide();
		var contentHeight = $('.poi.tab-content').height() - 55;
		$('#'+self.allPoiMapElement).show();
		if(contentHeight > 250){
			$('#'+self.allPoiMapElement).height(contentHeight);
		} else {
			$('#'+self.allPoiMapElement).height(250);
		}
	}
	this.toggleItem = function (id){
		if($('p[data-id="'+id+'"] .poi_marker').attr('class') == 'poi_marker'){
			$('p[data-id="'+id+'"] .poi_marker').attr('class', 'poi_marker active');
			$('p[data-id="'+id+'"] .poi_marker').prop('checked', true);
		}else{
			$('p[data-id="'+id+'"] .poi_marker').attr('class', 'poi_marker');
			$('p[data-id="'+id+'"] .poi_marker').prop('checked', false);
		}
	}
	this.setItem = function (id){
		$('p[data-id="'+id+'"] .poi_marker').attr('class', 'poi_marker active').prop('checked', true);
	}
	this.deactivateItem = function (id){
		$('p[data-id="'+id+'"] .poi_marker').attr('class', 'poi_marker').prop('checked', false);
	}
	this.getAllPoi = function (){
        var allChecked = true;
        $('.poi_marker').each(function(){
            if($(this).attr('class') != 'poi_marker active'){
                allChecked = false;
                return false;
            }
        });
        if(!getCookie('poi')){
            var poi = [];
        }else{
            cookie=unescape(getCookie('poi'))
            var poi=cookie.split(',');
        }
        poi = [];
        if(allChecked){
            c('disable all');
            $('.poi_marker').each(function(){
                var id = $(this).parent().attr('data-id');
                self.deactivateItem(id);
            });
        }else{
            c('show all');
            $('.poi_marker').each(function(){
                var id = $(this).parent().attr('data-id');
                poi.push(id);
                self.setItem(id);
            });
        }
        createCookie('poi', escape(poi.join(',')), 30);
        self.doCheck();
    }
	this.getPoiItems = function (poi, lat1, lon1, lat2, lon2){
		action = 'PoiItemsRad';
		data = {items:poi, lat1:lat1, lon1:lon1, lat2:lat2, lon2:lon2};
		$('#poi_items input').prop('disabled', true);
		AjaxController(action, data, dashUrl, self.poiItemsHandler, errorBasicHandler);
	}
	this.poiItemsHandler = function (response){
		self.clearOverlays(); 
		if(response.data.length > 0){
			$.each(response.data, function(index, item){
				var lat = item.lt;
				var lon = item.ln;
				var group = item.groupId;
				var icon = '/dash/assets/img/poi/'+group+'/marker/ic_launcher.png'; // null = default icon
				var iconParam = new H.map.Icon(icon),
					coords = {lat: lat, lng: lon},
					marker = new H.map.Marker(coords, {icon: iconParam});
				self.markersArray.push(marker);
				self.allPoiGroup.addObject(marker);
				self.addInfoWindow(marker, item, 1);
			});
		}
		$('#poi_items input').prop('disabled', false);
	}
	this.wsChose = function (el){ c('wsChose');
		if(self.rectangle && self.allPoiGroup.contains(self.rectangle))
			self.allPoiGroup.removeObject(self.rectangle);
        if($(el).hasClass('active')){ c('ws is active');
            $(el).removeClass('active');
            //self.doCheck();
			self.clearOverlays();
			eraseCookie('poi_ws');
            return false;
        } else {
			$('#poi_chose').removeClass('active');
		}
        createCookie('poi_ws', 1);
        $(el).addClass('active');
        self.doWSCheck();
	}
	this.poiChose = function (el){ c('poiChose');
		$('#w_s_button').removeClass('active');
		eraseCookie('poi_ws');
		$(el).addClass('active');
		self.doCheck();
	}
	this.doWSCheck = function (){
		self.clearOverlays();
		var coords = self.getMapCoords();
		action = 'PoiWS';
		data = {lat1:coords.lat1, lon1:coords.lon1, lat2:coords.lat2, lon2:coords.lon2};
		AjaxController(action, data, dashUrl, self.poiWSHandler, errorBasicHandler);
	}
	this.doCheck = function (){ c('doCheck'); 
        if(!$('#w_s_button').hasClass('active') && !$('#poi_chose').hasClass('active')) {
			return false;
		}
		self.clearOverlays();
        self.checkAllPoiMarkersChecked();
        $('#full_info_box').remove();
        if(self.rectangle && self.allPoiGroup.contains(self.rectangle))
			self.allPoiGroup.removeObject(self.rectangle); 
        if($('#w_s_button').hasClass('active')){ 
            self.doWSCheck();
            return false;
        }
        if(getCookie('poi')){
            var coords = self.getMapCoords();
            cookie = unescape(getCookie('poi'))
            var poi = cookie.split(',');
            self.getPoiItems(poi, coords.lat1, coords.lon1, coords.lat2, coords.lon2);
        }
    }
	this.checkPoiList = function (el){
        if(!getCookie('poi')){
			var poi = [];
		}else{
			cookie = unescape(getCookie('poi'));
			var poi = cookie.split(',');
		}
		var id = $(el).parent().attr('data-id');
		if($(el).attr('class') == 'poi_marker active'){
			var index = poi.indexOf(id);
			if (index > -1) {
				poi.splice(index, 1);
			}
		}else{
			poi.push(id);
		}
		createCookie('poi', escape(poi.join(',')), 30);
		self.toggleItem(id);
		self.doCheck();
	}
	this.poiWSHandler = function (response){
		c('poiWSHandler');
		self.clearOverlays();
		if(response.data.places.length > 0){
			var x = 0;
			$.each(response.data.places, function(index, item){
				x++;
				var lat = item.lt;
				var lon = item.ln;
				var group = item.groupId;
				var id = item.id;
				var statuses = [];
				var icon = '/dash/assets/img/poi/'+group+'/marker/ic_launcher.png';
				$.each(response.data.stationsStatuses, function(index, status){
					if(status.stationId == id){
						if(statuses.length == 0){
							if(status.status == 0){//closed, 1 == open
								icon = '/dash/assets/img/poi/5_2/ic_launcher.png';
							}
						}
						statuses.push(status);
					}
				});
				item.statuses = statuses;
				var iconParam = new H.map.Icon(icon),
					coords = {lat: lat, lng: lon},
					marker = new H.map.Marker(coords, {icon: iconParam});
				self.markersArray.push(marker);
				self.allPoiGroup.addObject(marker);
				self.addInfoWindow(marker, item, 1);
			});
		}
	}
	this.addInfoWindow = function (marker, item, type){ //0 - others, 1 - ws, 2 - parking
		var contentString = self.getInfoContent(item, type);
		var id = item.id;
		marker.addEventListener('tap', function(evt) { c('tap marker');
			var bubble =  new H.ui.InfoBubble(evt.target.getPosition(), { content: contentString });
			self.allPoiMapUi.getBubbles().forEach(bub => self.allPoiMapUi.removeBubble(bub));
			self.allPoiMapUi.addBubble(bubble);
			$(bubble.getElement()).addClass('poi_box');
			self.infowindow[item.id] = bubble;
			action = 'PlaceRating';
			data = {placeId:id};
			AjaxController(action, data, dashUrl, self.infoRatingHandler, errorBasicHandler);
			if(item.groupId == 0 || item.groupId == 5){
				action = 'ParkingStatus';
				data = {placeId:id};
				AjaxController(action, data, dashUrl, self.parkingHandler, errorBasicHandler);
			}
		});
	}
	this.getInfoContent = function (item, type){
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
		if(address != ''){
			addressLine = '<p>'+address;
		}
		if(city != ''){
			if(addressLine != '')
				addressLine += ', ';
			addressLine += city+'</p>';
		}else{
			addressLine += '</p>';
		}
		if(state != ''){
			stateZipLine = '<p>'+state;
		}
		if(zip != ''){
			stateZipLine += ', '+zip+'</p>';
		}else{
			stateZipLine += '</p>';
		}
		if(phone != ''){
		   phoneLine = '<p>'+phone+'</p>'; 
		}
		if(item.groupId == 5 || item.groupId == 0){
			if(item.groupId == 5){
				var ttl = 'Weight Station Status';
			}else{
				var ttl = 'Parking Status';
			}
			additionalInfo = '<div class="additional_info" data-type="'+item.groupId+'" data-id="'+item.id+'">\n\
				<p>'+ttl+'</p>\n\
				<div class="station_statuses_box"><img class="loading" src="/dash/assets/img/loading.gif"/></div></div>';
		}
		return '<div class="info_map_box" data-id="'+item.id+'">\n\
				<h3 class="info_link" onclick="poiC.getMarkerInfo(this)">'+title+'</h3>\n\
				<div class="address_box">'+addressLine+stateZipLine+phoneLine+'</div> \n\
				<div class="rating_box"><img class="loading" src="/dash/assets/img/loading.gif"/></div>'+additionalInfo+'\n\
				</div>';
	}
	this.getMarkerInfo = function (el){
		var id = $(el).parent().attr('data-id'); c('id='+id);
        self.createFullInfo(id);
        action = 'FullInfo';
        data = {placeId:id};
        AjaxController(action, data, dashUrl, self.fullInfoHandler, errorBasicHandler);
	}
	this.createFullInfo = function (id){
		$('#full_info_box').remove();
		var infoBox = '<div id="full_info_box"><img src="/dash/assets/img/loading.gif" class="loading"/> <div class="close_additional" onclick="$(this).parent().remove();"><img src="https://maps.gstatic.com/mapfiles/api-3/images/mapcnt6.png" draggable="false" style="position: absolute; left: -2px; top: -336px; width: 59px; height: 492px; -webkit-user-select: none; border: 0px; padding: 0px; margin: 0px; max-width: none;"></div></div>';
		$('#'+self.allPoiMapElement).find('>:last-child').append(infoBox);
	}
	this.fullInfoHandler = function (response){
		var info = response.data[0];
		c(info);
		var title = info.title;
		var itemInfo = '<h3>'+title+'</h3><div class="close_additional" onclick="$(this).parent().remove();"><img src="https://maps.gstatic.com/mapfiles/api-3/images/mapcnt6.png" draggable="false" style="position: absolute; left: -2px; top: -336px; width: 59px; height: 492px; -webkit-user-select: none; border: 0px; padding: 0px; margin: 0px; max-width: none;"></div><div class="item_body">';
		var rates = info.rates;
		var state = info.state;
		var city = info.city;
		var address = info.address;
		var zip = info.zip;
		var phone = info.phone;
		var fax = info.fax;
		var highway = info.highway;
		var ext = info.ext;
		var web = info.web;
		var scale = info.scale;
		var shower = info.shower;
		var tire = info.tire;
		var bulk = info.bulk;
		var wifi = info.wifi;
		var atm = info.atm;
		var transFE = info.transFE;
		var RVDump = info.RVDump;
		var overNP = info.overNP;
		var trParkSp = info.trParkSp;
		var lastUpd = info.lastUpd;
		var workingTime = info.workingTime;
		var totalRating = 0;
		var avrgRating = 0;
		var statuses = info.statuses;
		var yb = '';
		var fl = 0;
		if(rates.length > 0){
			$.each(rates, function(key, item){
				totalRating+=parseInt(item.rating);
			});
			avrgRating = totalRating/rates.length;
			fl = Math.ceil(avrgRating);
			if(avrgRating > 0){
				yb = '<div class="yellow_stars_det_box"><div class="yellow_stars_inner_det_box">';
				for(var x =0; x < fl; x++){
					yb+='<img src="/dash/assets/img/poi/star_yellow.png" class="yellow_star" />' ;
				}
				yb += '</div></div>';
			}
		}
		var starsGray = '<img src="/dash/assets/img/poi/star_grey.png" /><img src="/dash/assets/img/poi/star_grey.png" /><img src="/dash/assets/img/poi/star_grey.png" /><img src="/dash/assets/img/poi/star_grey.png" /><img src="/dash/assets/img/poi/star_grey.png" />';
		
		itemInfo+= '<div class="rating_box"><span class="avr_rating">'+avrgRating.toFixed(1)+'</span><div class="stars_box">'+starsGray+yb+'<div class="total_rates">'+rates.length+' reviews</div></div></div>';
		var totallAddress = '';
		totallAddress = self.addAddressData(totallAddress, address);
		totallAddress = self.addAddressData(totallAddress, city);
		totallAddress = self.addAddressData(totallAddress, state);
		totallAddress = self.addAddressData(totallAddress, zip);
		itemInfo+= '<div class="address_row">'+totallAddress+'</div>';
		if(workingTime != '' && workingTime != null){
			itemInfo+= '<div class="working_time">'+workingTime+'</div>';
		}
		itemInfo+='<div class="info_rows"><h4>Information</h4>';
		itemInfo = self.addInfoRow(itemInfo, 'Phone', phone);
		itemInfo = self.addInfoRow(itemInfo, 'Fax', fax);
		itemInfo = self.addInfoRow(itemInfo, 'Website', web);
		itemInfo = self.addInfoRow(itemInfo, 'Highway', highway);
		itemInfo = self.addInfoRow(itemInfo, 'Exit', ext);
		
		itemInfo += '</div>';
		
		itemInfo+='<div class="info_rows"><h4>Facilities</h4>';
		itemInfo = self.addInfoRow(itemInfo, 'Scales', scale);
		itemInfo = self.addInfoRow(itemInfo, 'Showers', shower);
		itemInfo = self.addInfoRow(itemInfo, 'Wi-Fi Internet', wifi);
		itemInfo = self.addInfoRow(itemInfo, 'ATM', atm);
		itemInfo = self.addInfoRow(itemInfo, 'Bulk Def', bulk);
		itemInfo = self.addInfoRow(itemInfo, 'Tire Care', tire);
		itemInfo = self.addInfoRow(itemInfo, 'TRANSFLO Express', transFE);
		itemInfo = self.addInfoRow(itemInfo, 'RV Dump Station', RVDump);
		itemInfo = self.addInfoRow(itemInfo, 'Overnight Parking', overNP);
		itemInfo = self.addInfoRow(itemInfo, 'Truck Parking Spots', trParkSp);
		itemInfo += '</div>';
		itemInfo += '</div>';
		$('#full_info_box').empty();
		$('#full_info_box').append(itemInfo);
		var w = 20*avrgRating;
		var w2 = 20*fl;
		$('#full_info_box .yellow_stars_det_box').width(w+'px');
		$('#full_info_box .yellow_stars_inner_det_box').width(w2+'px');
	}
	this.addInfoRow = function (itemInfo, name, item){
		c(name); c(item);
		if(item == 0 || item == null || item == ''){
			itemInfo+= '<div><span class="info_name">'+name+'</span><span class="no">NO</span></div>';
		}else if(item == '1'){
			itemInfo+= '<div><span class="info_name">'+name+'</span><span class="yes">YES</span></div>';
		}else{
			itemInfo+= '<div><span class="info_name">'+name+'</span><span class="yes">'+item+'</span></div>';
		}
		return itemInfo;
	}
	this.addAddressData = function (totallAddress, oneData){
		if(oneData != ''){
			if(totallAddress != '')
				totallAddress += ', ';
			totallAddress += oneData;
		}
		return totallAddress;
	}
	this.infoRatingHandler = function (response){
		var rating = response.data.rating;
		var reviews = response.data.reviews;
		var placeId = response.data.placeId;
		if(rating == null){
			rating = 0;
		}
		reviews = Math.min(reviews, 5);
		var resp = '<img src="/dash/assets/img/poi/star_grey.png" /><img src="/dash/assets/img/poi/star_grey.png" /><img src="/dash/assets/img/poi/star_grey.png" /><img src="/dash/assets/img/poi/star_grey.png" /><img src="/dash/assets/img/poi/star_grey.png" />';
		var yb = '<div class="yellow_stars_box"><div class="yellow_stars_inner_box">';
		var fl = Math.ceil(rating);
		if(rating > 0){
			for(var x =0; x < fl; x++){
				yb+='<img src="/dash/assets/img/poi/star_yellow.png" class="yellow_star"/>' ;
			}
		}
		yb += '</div></div>';
		$('.info_map_box[data-id="'+placeId+'"] .rating_box').empty().append(resp+yb);
		var w = 20*rating;
		var w2 = 20*fl;
		$('.info_map_box[data-id="'+placeId+'"] .rating_box .yellow_stars_box').width(w+'px');
		$('.info_map_box[data-id="'+placeId+'"] .rating_box .yellow_stars_inner_box').width(w2+'px');
	}
	this.parkingHandler = function (response){
		var stationsStatuses = response.data.stationsStatuses;
		var placeId = response.data.placeId;
		if(stationsStatuses.length > 0){
			var st = '';
			$.each(stationsStatuses.reverse(),function(key, status){
				st+='<div class="one_st_box s'+status.status+'">'+status.dateTime+'</div>';
				$('.info_map_box[data-id="'+placeId+'"] .station_statuses_box').empty().append(st);
			});
		}else{
			var ttl='No statuses yet';
			$('.info_map_box[data-id="'+placeId+'"] .additional_info').empty().append('<p>'+ttl+'</p>');
		}
	}
	this.getMapCoords = function (){c('getMapCoords');
		self.allPoiMapUi.getBubbles().forEach(bub => self.allPoiMapUi.removeBubble(bub));
		var center = self.allPoiMap.getCenter(); 
		var viewBounds = self.allPoiMap.getViewBounds(); c('viewBounds'); c(viewBounds);
		var topRight = self.allPoiMap.screenToGeo($('#'+self.allPoiMapElement).width()-2, 0);  c('topRight'); c(topRight);
		var lonMaxDiff = 3;
		var latMaxDiff = 3; 
		var latc = center.lat; 
		var lonc = center.lng;
		var lat1 = topRight.lat; //viewBounds.ka;
		var lon1 = topRight.lng; //viewBounds.ha; 
		var latDiff = (lat1 - latc); c('latDiff='+latDiff);
		var lonDiff = (lon1 - lonc); c('lonDiff='+lonDiff);
		if(latDiff > latMaxDiff){
			lat1 = latc+latMaxDiff;
		}
		if(lonDiff > lonMaxDiff || lonDiff < 0){
			lon1 = lonc+lonMaxDiff;
		}
		var lat2 = lat1-(lat1 - latc)*2;
		var lon2 = lon1-(lon1 - lonc)*2;
		var boundingBox = new H.geo.Rect(lat2, lon2, lat1, lon1);
		self.rectangle = new H.map.Rect(boundingBox, {
		  style: {
			fillColor: 'rgba(255, 255, 255, 0.4)',
			strokeColor: 'rgba(0, 0, 0, 0.8)',
			lineWidth: 2
		  },
		});
		self.allPoiGroup.addObject(self.rectangle);
		return {lat1:lat1,lon1:lon1,lat2:lat2,lon2:lon2};
	}
	this.clearOverlays = function (){
		for (var i = 0; i < self.markersArray.length; i++ ) {
			if(self.allPoiGroup.contains( self.markersArray[i])){  //markersArray[i].setMap(null);
				self.allPoiGroup.removeObject( self.markersArray[i]);
			}
		}
		self.markersArray.length = 0;
	}
	this.checkAllPoiMarkersChecked = function (){
		var checkAllPoiChecked = $('#poi_items .poi_marker').toArray().every(item => $(item).prop('checked'));
		if(checkAllPoiChecked){
			$('.poi_marker_n').prop('checked', true);
		} else {
			$('.poi_marker_n').prop('checked', false);
		}
	}
    this.getStatesHandler = function (response){
        self.states = response.data;
        var states = '<option></option>';
        $.each(self.states, function (key, item){
            states += '<option value="'+item.id+',\''+item.name+'\',\''+item.short+'\'">'+item.name+'</option>';
        });
        $('#states select').html(states);
    }
    this.getPlacesTypesHandler = function (response){
        self.placesTypes = response.data;
        var types = '<option></option>';
        $.each(self.placesTypes, function (key, item) {
            types += '<option value="'+item.id+'">'+item.name+'</option>';
        });
        $('#type select').html(types);
    }
    this.getApprovedPlaces = function (){
        self.paginator = new simplePaginator({
            tableId: 'approved_places',
            request: 'getApprovedPlacesPagination',
            requestUrl: apiAdminUrl,
            handler: self.getApprovedPlacesPaginationHandler,
            perPageList: [25, 50, 100],
            initSort:{param:'title', dir:'asc'},
            defaultPerPage: 50
        });
    }
    this.getApprovedPlacesPaginationHandler = function (response){
        var rowStr = '';
        var body = $('#approved_places').find('tbody');
        body.empty();
        $.each(response.data.result, function (key, row) {
            rowStr += self.oneApprovedPlacesRow(row);
        });
        body.append(rowStr);
    }
    this.oneApprovedPlacesRow = function (row){ 
        var active = row.active == 1 ? 'Yes':'No',
            user = row.userId != null ? createProfilePopupButton(row.userId, row.user) : '',
            address = row.address;
            if(row.ln != 0 && row.lt != 0){
                address = address + ' ('+row.ln+', '+ row.lt+')';
            }
            if(row.city != ''){
                address = row.city +', '+ address;
            }
            if(row.zip != ''){
                address = row.zip +', '+ address;
            }
			var listOfButtons = [];
            listOfButtons.push(`<button type="button" data-id="${row.id}" onclick="poiC.editPlace(this)">Edit place</button>`);
            listOfButtons.push(`<button type="button" data-id="${row.id}" data-type="Place" onclick="poiC.deleteRow(this)">Remove</button>`);
			
            var rowStr = `<tr data-id="${row.id}" onclick="poiC.editPlace(this)">
                <td>${row.typeName}</td>
                <td>${row.title}</td>
                <td>${self.getStateId(row.state)}</td>
                <td>${address}</td>
                <td>${row.phone}</td>
                <td>${timeFromSQLDateTimeStringToUSAString(row.lastUpd, true)}</td>
				<td>${addTableActionRow(listOfButtons, 120)}</td>
            </tr>`;
        return rowStr;
    } 
    this.getSuggestions = function (){
        self.paginator = new simplePaginator({
            tableId: 'suggestion_table',
            request: 'getSuggestionsPagination',
            requestUrl: apiAdminUrl,
            handler: self.getSuggestionsHandler,
            perPageList: [25, 50, 100],
            initSort:{param:'name', dir:'asc'},
            defaultPerPage: 50
        });
    }
    this.getSuggestionsHandler = function (response){
        var rowStr = '',
            body = $('#suggestion_table').find('tbody');
        body.empty();
        $.each(response.data.result, function (key, row) {
            rowStr += self.oneSuggestionRow(row);
        });
        body.append(rowStr);
    }
    this.oneSuggestionRow = function (row){
        var typeStyle = row.typeName == null ? 'style="color: red"' : '',
			active = row.active == 1 ? 'Yes':'No',
            latLng = row.ln!= null && row.lt!= null ? ' ('+row.ln+', '+ row.lt+')' : '';
			var listOfButtons = [];
            listOfButtons.push(`<button type="button" data-id="${row.id}" onclick="poiC.editSuggestion(this)">Edit</button>`);
            listOfButtons.push(`<button type="button" data-type="Suggestion" data-id="${row.id}" onclick="poiC.deleteRow(this)">Remove</button>`);
			
            var rowStr = `<tr data-id="${row.id}" data-type="${row.type}" onclick="poiC.editSuggestion(this)">
                <td ${typeStyle}>${row.typeName}</td>
                <td>${row.name}</td>
                <td>${row.address}${latLng}</td>
                <td>${row.note}</td>
                <td><span class="global_carrier_info clickable_item" title="User Info" data-userid="${row.userId}" onclick="getOneUserInfo(this, event);" >${row.user}</span></td>
				<td>${addTableActionRow(listOfButtons, 120)}</td>
            </tr>`;
        return rowStr;
    }
    this.getEditPlaces = function (){
        self.paginator = new simplePaginator({
            tableId: 'edit_places',
            request: 'getPlacesEditsPagination',
            requestUrl: apiAdminUrl,
            handler: self.getEditPlacesHandler,
            perPageList: [25, 50, 100],
            initSort:{param:'title', dir:'asc'},
            defaultPerPage: 50
        });
    }
    this.getEditPlacesHandler = function (response){
        var rowStr = '';
        var body = $('#edit_places').find('tbody'); //$('#' + tableId).find('tbody');
        body.empty();
        $.each(response.data.result, function (key, row) {
            rowStr += self.oneEditPlaceRow(row);
        });
        body.append(rowStr);
    }
    this.oneEditPlaceRow = function (row){ 
        var active = row.active == 1 ? 'Yes':'No',
            address = row.address;
            if(row.ln != 0 && row.lt != 0){
                address = address + ' ('+row.ln+', '+ row.lt+')';
            }
            if(row.city != ''){
                address = row.city +', '+ address;
            }
            if(row.zip != ''){
                address = row.zip +', '+ address;
            }
			
			var listOfButtons = [];
			listOfButtons.push(`<button type="button" data-id="${row.id}" data-user="${row.userId}" onclick="poiC.editNewPlace(this)">Edit</button>`);
            listOfButtons.push(`<button type="button" data-type="EditPlace" data-id="${row.id}" onclick="poiC.deleteRow(this)">Remove</button>`);
			
            var rowStr = `<tr data-id="${row.id}" data-user="${row.userId}" onclick="poiC.editNewPlace(this)">
                <td>${row.typeName}</td>
                <td>${row.title}</td>
                <td>${self.getStateId(row.state)}</td>
                <td>${address}</td>
                <td>${timeFromSQLDateTimeStringToUSAString(row.lastUpd, true)}</td>
                <td>${row.note}</td>
                <td><span class="global_carrier_info clickable_item" title="User Info" data-userid="${row.userId}" onclick="getOneUserInfo(this, event);" >${row.user}</span></td>
				<td>${addTableActionRow(listOfButtons, 120)}</td>
            </tr>`;
        return rowStr;
    }
	this.getStateId = function (stateValue){ //todo save state as Id
		$.each(self.states, function (key, state) { 
			if(stateValue == state.id || stateValue == state.name || stateValue == state.short){
				stateValue = state.name;
			}
		});
		return stateValue;
	}
    this.editSuggestion = function (el){
        var data = {
            type: 'Suggestions',
            id: $(el).attr('data-id')
        };
        AjaxController('get'+data.type, data, adminUrl, self.editSuggestioneHandler, errorBasicHandler, true);
    }
	this.editPlace = function (el){
        var data = {
            id: $(el).attr('data-id'), 
        };
        AjaxController('getPlace', data, adminUrl, self.editPlaceHandler, errorBasicHandler, true);
    }
	this.editNewPlace = function (el){
        var data = {
            type: 'PlacesEdits',
            id: $(el).attr('data-id'), 
            userId: $(el).attr('data-user')
        };
        AjaxController('get'+data.type, data, adminUrl, self.editNewPlaceHandler, errorBasicHandler, true);
    }
    this.deleteRow = function (el){
        var data = {type: $(el).attr('data-type'), id: $(el).attr('data-id')};
        AjaxController('delete'+data.type, data, adminUrl, self.updateListHandler, errorBasicHandler, true);
    }
	this.updateListHandler = function (responce){ c('updateListHandler');
		$('#editPoi [data-dismiss="modal"]').click();
		self.paginator.changePagination();
    }
    this.approveEdit = function (el){ c('approveEdit');
        var error = 0;
        var par = $(el).parent();
        var data = {
                newId: $(el).attr('data-new'),
                userId: $(el).attr('data-user'),
                id: $(el).attr('data-id'),
				place:  $(el).attr('data-place'), 
        };
        par.find('input, select').each(function(){
			$(this).removeClass('error');
            var name = $(this).attr('data-name');
            var val = $(this).val();
            if(!self.validatePlaceValue(name, val)){
                $(this).addClass('error');
				if(name == 'lt' || name == 'ln'){
					var xy = self.poiMap.geoToScreen(self.marker.getPosition());
					var bubble =  new H.ui.InfoBubble(self.poiMap.screenToGeo(xy.x, xy.y - 43), { content: '<span class="error" style="padding: 10px;">Please, set marker position!</span>' });
					self.poiMapUi.getBubbles().forEach(bub => self.poiMapUi.removeBubble(bub));
					self.poiMapUi.addBubble(bubble);
				}
                error++;
            }
            data[name] = val;
        });
        par.find('.check_buttons_block').each(function(){
            var name = $(this).attr('data-name');
            var val = $(this).find('button.btn.btn-default.active').attr('data-val');
            data[name] = val;
        });
        if(error > 0){
            c('Return False');
			alertError($('#save_result'), 'Incorrect fields!', 3000);
            return false;
        }
        AjaxController('saveEdit', data, adminUrl, self.updateListHandler, errorBasicHandler, true);
    }
    this.validatePlaceValue = function(name, value, empty = true) {
        if(empty == false && $.trim(value) == ''){
            return false;
        }
		if($.trim(value) === '' && ['groupId','type','title','active'].indexOf(name) !=-1){
			return false;
		}
		if(name == 'trParkSp' && value < 0){
			return false;
		}
        if(name == 'lt' || name == 'ln'){
            return validate.validateLtLn(value);
        } else if(name == 'web' && $.trim(value) != ''){
            return validate.validateURL(value);
        }
        return true;
    } 
	self.editNewPlaceHandler = function (response){
		c(response);
		var item = response.data.item;
		var old = response.data.old;
		self.drawPlaceForm('EditPlace', item, old);
	}
	self.editSuggestioneHandler = function (response){
		c(response);
		var item = response.data.item;
		self.drawPlaceForm('Suggestion', item);
	}
	self.editPlaceHandler = function (response){
		c(response);
		var item = response.data.item;
		self.drawPlaceForm('Place', item);
	}
    this.drawPlaceForm = function (actionType, item, old){ c('drawPlaceForm');
        var modalBody = '';
        if(actionType == 'EditPlace'){ // Edit place Old vs New //typeof old != 'undefined'
			var modalTitle = 'Edit place suggestion';
			modalBody +=`
				<div id="suggest_box" class="col-xs-12 col-sm-12 m_r">
					<!--h3>New Info</h3-->${self.drawPlaceFormFields(item, true, old)}
					<button class="btn btn-default approve" data-id="${old.id}" data-user="${item.userId}" onclick="poiC.approveEdit(this)">Approve</button>
					<button class="btn btn-default remove" data-id="${old.id}" data-type="${actionType}" onclick="poiC.deleteRow(this)">Remove</button>
				</div>`;
        } else if(actionType == 'Suggestion') { //typeof item!= 'undefined'
			var modalTitle = 'New place suggestion';
             modalBody += `<div id="suggest_box" class="col-xs-12 full-width">
                ${self.drawPlaceFormFields(item, true)}
				<button class="btn btn-default approve" data-new="${item.id}" onclick="poiC.approveEdit(this)">Approve</button>
				<button class="btn btn-default remove" data-id="${item.id}" data-type="${actionType}" onclick="poiC.deleteRow(this)">Remove</button>
			</div>`;
        } else if(actionType == 'Place') { //edit approved place
			var modalTitle = 'Edit place';
             modalBody += `<div id="suggest_box" class="col-xs-12 full-width">
                ${self.drawPlaceFormFields(item)}
				<button class="btn btn-default approve" data-id="${item.id}" data-place="${item.id}" onclick="poiC.approveEdit(this)">Approve</button>
				<button class="btn btn-default remove" data-id="${item.id}" data-type="${actionType}" onclick="poiC.deleteRow(this)">Remove</button>
			</div>`;
		} else { //Add new place 
			var modalTitle = 'New place';
             modalBody += `<div id="suggest_box" class="col-xs-12 full-width">
                ${self.drawPlaceFormFields(self.defaultPlace)}
				<button class="btn btn-default approve" data-new="-1" onclick="poiC.approveEdit(this)">Approve</button>
			</div>`;
        }
        modalBody = '<div class="row">'+modalBody+'<div id="save_result" class="col-xs-12"></div></div>';
        showModal(modalTitle, modalBody, 'editPoi', 'modal-lg');
		if(actionType == 'EditPlace'){
			$.each(item, function(key, field){
				if(item[key] != old[key]){
					$('#suggest_box').find('input[data-name="'+key+'"], select[data-name="'+key+'"]').prev().addClass('isEdited').attr('data-toggle','tooltip').attr('data-placement','left').attr('title', old[key]);
				}
			});
			$('[data-toggle="tooltip"]').tooltip();
		}
		self.editMap();
        $('input[data-name="zip"]').mask('000000');
        $('input[data-name="phone"]').mask('000 000 0000');
        $('input[data-name="fax"]').mask('000 000 0000');
		
    }
    this.drawPlaceFormFields = function (items, suggestion = false, old = false){ c('new'); c(items); c('old'); c(old);
		$.each(self.defaultPlace, function(key, val){
			if(!items.hasOwnProperty(key)){
				items[key] = self.defaultPlace[key];
			} else if(items[key] == null){
				items[key] = '';
			}
		});
		var groupsSelect = '<select class="no" data-name="groupId" onchange="poiC.changePlaceGroup()"';
		groupsSelect +='<option></option>';
		$.each(self.placesTypes, function(key, place){
			groupsSelect +='<option value="'+place.id+'" '+(place.id === items.groupId ? 'selected':'')+'>'+place.name+'</option>'; 
		});
		groupsSelect += '</select>';
		
		var statesSelect = '<select class="no" data-name="state">';
        statesSelect += '<option value="0">STATE/PROVINCE</option>';
        $.each(self.states, function (key, state) {
            statesSelect += '<option value="' + state.id + '" data-short="'+state.short+'" '+(state.id == items.state || state.name == items.state || state.short == items.state ? 'selected':'')+'>' + state.name + '</option>'
        });
        statesSelect += '</select>';
		var note = suggestion ? '<div><span class="info_name">Note</span><textarea class="no">'+items.note+'</textarea></div>' : '';
        var section = `<div class="scrollbar-macosx row">
			<div class="col-xs-12 col-sm-4">
				<div class="info_rows">
				<h4>General Info</h4> 
					<div><span class="info_name">Name</span><input type="text" class="no" value="${items.title}" data-name="title"/></div>
					<div><span class="info_name">Group</span>${groupsSelect}</div>				
					<div id="editMap"></div>
					${note}
				</div>
			</div>
			<div class="col-xs-12 col-sm-4">
				<div class="info_rows">
					<h4>Address</h4>
					<div class="hidden"><span class="info_name">Latitude</span><input type="text" class="no" value="${items.lt}" data-name="lt" readonly/></div>
					<div class="hidden"><span class="info_name">Longitude</span><input type="text" class="no" value="${items.ln}" data-name="ln" readonly/></div>
					<div><span class="info_name">City</span><input type="text" class="no" value="${items.city}" data-name="city"/></div>
					<div><span class="info_name">State</span>
						 ${statesSelect}
					</div>
					<div><span class="info_name">Address</span><input type="text" class="no" value="${items.address}" data-name="address"/></div>
					<div><span class="info_name">Zip</span><input type="text" class="no" value="${items.zip}" data-name="zip"/></div>
				</div>
				<div class="info_rows">
					<h4>Information</h4>
					<div><span class="info_name">Phone</span><input type="text" class="no" value="${items.phone}" data-name="phone"/></div>
					<div><span class="info_name">Fax</span><input type="text" class="no" value="${items.fax}" data-name="fax"/></div>
					<div><span class="info_name">Website</span><input type="text" class="no" value="${items.web}" data-name="web"/></div>
					<div><span class="info_name">Highway</span><input type="text" class="no" value="${items.highway}" data-name="highway"/></div>
					<div><span class="info_name">Ext</span><input type="text" class="no" value="${items.ext}" data-name="ext"/></div>
				</div>
			</div>
			<div class="col-xs-12 col-sm-4">
				<div class="info_rows">
					<h4>Facilities</h4>
					<div><span class="info_name">Scales</span>
						<div class="no check_buttons_block" data-name="scale" style="width:47%;">
							<button class="btn btn-default ${items.scale == 1 ? 'active' : ''}" onclick="doActive(this)" data-val="1">Yes</button>
							<button class="btn btn-default ${items.scale == 0 ? 'active' : ''}" onclick="doActive(this)" data-val="0">No</button>
						</div>
					</div>
					<div><span class="info_name">Showers</span>
						<div class="no check_buttons_block" data-name="shower" style="width:47%;">
							<button class="btn btn-default ${items.shower >= 1 ? 'active' : ''}" onclick="doActive(this)" data-val="1">Yes</button>
							<button class="btn btn-default ${items.shower == 0 ? 'active' : ''}" onclick="doActive(this)" data-val="0">No</button>
						</div>
					</div>
					<div><span class="info_name">Wi-Fi Internet</span>
						<div class="no check_buttons_block" data-name="wifi" style="width:47%;">
							<button class="btn btn-default ${items.wifi == 1 ? 'active' : ''}" onclick="doActive(this)" data-val="1">Yes</button>
							<button class="btn btn-default ${items.wifi == 0 ? 'active' : ''}" onclick="doActive(this)" data-val="0">No</button>
						</div>
					</div>
					<div><span class="info_name">ATM</span>
						<div class="no check_buttons_block" data-name="atm" style="width:47%;">
							<button class="btn btn-default ${items.atm >= 1 ? 'active' : ''}" onclick="doActive(this)" data-val="1">Yes</button>
							<button class="btn btn-default ${items.atm == 0 ? 'active' : ''}" onclick="doActive(this)" data-val="0">No</button>
						</div>
					</div>
					<div><span class="info_name">Bulk Def</span>
						<div class="no check_buttons_block" data-name="bulk" style="width:47%;">
							<button class="btn btn-default ${items.bulk >= 1 ? 'active' : ''}" onclick="doActive(this)" data-val="1">Yes</button>
							<button class="btn btn-default ${items.bulk == 0 ? 'active' : ''}" onclick="doActive(this)" data-val="0">No</button>
						</div>
					</div>
					<div><span class="info_name">Tire Care</span>
						<div class="no check_buttons_block" data-name="tire" style="width:47%;">
							<button class="btn btn-default ${items.tire >= 1 ? 'active' : ''}" onclick="doActive(this)" data-val="1">Yes</button>
							<button class="btn btn-default ${items.bulk == 0 ? 'active' : ''}" onclick="doActive(this)" data-val="0">No</button>
						</div>
					</div>
					<div><span class="info_name">TRANSFLO Express</span>
						<div class="no check_buttons_block" data-name="transFE" style="width:47%;">
							<button class="btn btn-default ${items.transFE == 1 ? 'active' : ''}" onclick="doActive(this)" data-val="1">Yes</button>
							<button class="btn btn-default ${items.transFE == 0 ? 'active' : ''}" onclick="doActive(this)" data-val="0">No</button>
						</div>
					</div>
					<div><span class="info_name">RV Dump Station</span>
						<div class="no check_buttons_block" data-name="RVDump" style="width:47%;">
							<button class="btn btn-default ${items.RVDump == 1 ? 'active' : ''}" onclick="doActive(this)" data-val="1">Yes</button>
							<button class="btn btn-default ${items.RVDump == 0 ? 'active' : ''}" onclick="doActive(this)" data-val="0">No</button>
						</div>
					</div>
					<div><span class="info_name">Overnight Parking</span>
						<div class="no check_buttons_block" data-name="overNP" style="width:47%;">
							<button class="btn btn-default ${items.overNP == 1 ? 'active' : ''}" onclick="doActive(this)" data-val="1">Yes</button>
							<button class="btn btn-default ${items.overNP == 0 ? 'active' : ''}" onclick="doActive(this)" data-val="0">No</button>
						</div>
					</div>
					<div><span class="info_name">Truck Parking Spots</span><input type="number" min="0" class="no" value="${items.trParkSp}" data-name="trParkSp"/></div>
					<div><span class="info_name">Working Time</span><input type="text" class="no" value="${items.workingTime}" data-name="workingTime"/></div>
				</div>
			</div>
		</div>`;
        return section;
    }
	this.editMap = function (){
        var platform = new H.service.Platform({
			app_id: HERE_APP_ID,
			app_code: HERE_APP_CODE,
			useHTTPS: true
		});
		var pixelRatio = window.devicePixelRatio || 1;
		self.defaultLayers = platform.createDefaultLayers({
			tileSize: pixelRatio === 1 ? 256 : 512,
			ppi: pixelRatio === 1 ? undefined : 320
		});
		var lat = $(self.dataBox).find('input[data-name="lt"]').val(),
			lng = $(self.dataBox).find('input[data-name="ln"]').val();
		self.poiMap = new H.Map(
			document.getElementById('editMap'), 
			self.defaultLayers.normal.map,{
				zoom: lat==0 && lng== 0 ? 2:12,
				center: { lat:lat, lng: lng}
		});
		self.poiMap.getBaseLayer().setMin(2);
		self.poiMapUi = H.ui.UI.createDefault(self.poiMap, self.defaultLayers);  
		self.poiBehavior = new H.mapevents.Behavior(new H.mapevents.MapEvents(self.poiMap));
		self.poiGroup = new H.map.Group();
		self.poiMap.addObject(self.poiGroup);
		self.placeMarker();
		window.addEventListener('resize', function () {
			if ($.isFunction(self.poiMap.getViewPort)){
				self.poiMap.getViewPort().resize();
			}
		});
		self.poiMap.addEventListener('dragstart', function(ev) {
			var target = ev.target;
			if (target instanceof H.map.Marker) {
				self.poiBehavior.disable();
			}
		}, false);
		self.poiMap.addEventListener('dragend', function(ev) {
			var target = ev.target;
			if (target instanceof H.map.Marker) {
				self.poiBehavior.enable();
				var markerPosition = self.marker.getPosition();
				self.movePlaceMarker(markerPosition); 
				self.poiMapUi.getBubbles().forEach(bub => self.poiMapUi.removeBubble(bub));
				$('input[data-name="address"], input[data-name="zip"]').val('');
				$('select[data-name="state"] option').prop('selected', false);
				plcApi.getLocationFromLatLng(markerPosition);
			}
		}, false);
		self.poiMap.addEventListener('drag', function(ev) {
			var target = ev.target,
				pointer = ev.currentPointer;
			if (target instanceof H.map.Marker) {
				target.setPosition(self.poiMap.screenToGeo(pointer.viewportX, pointer.viewportY));
			}
		}, false);
	}
	this.movePlaceMarker = function(centerLatLng){
		var lat = centerLatLng.lat,  	 
			lng = centerLatLng.lng;
		$(self.dataBox).find('input[data-name="ln"]').val(lng);
		$(self.dataBox).find('input[data-name="lt"]').val(lat);
	}
	this.placeMarker = function (group){
		var group = $(self.dataBox).find('select[data-name="groupId"]').val(),
			lat = $(self.dataBox).find('input[data-name="lt"]').val(),
			lng = $(self.dataBox).find('input[data-name="ln"]').val(),
			coords = {lat: lat, lng: lng};
			if(group!==''){
				var iconImg = '/dash/assets/img/poi/'+group+'/marker/ic_launcher.png',
				icon = new H.map.Icon(iconImg);
				self.marker = new H.map.Marker(coords, {icon: icon});
			} else {
				self.marker = new H.map.Marker(coords);
			}
		self.marker.draggable = true;
		self.poiGroup.addObject(self.marker);
	}
	this.sendLocationFromLatLngHandler = function (data) {
        //if(window.location.pathname != '/dash/all_poi/' || window.location.pathname != '/dash/new_poi/' || window.location.pathname != '/dash/edit_poi/'){ 
		if(['/dash/all_poi/','/dash/new_poi/','/dash/edit_poi/'].indexOf(window.location.pathname)==-1){ 
			return false;
		}
		c('sendLocationFromLatLngHandler'); c(data);
        var res = data.result;
		if(typeof res.Street !== 'undefined'){
			$('input[data-name="address"]').val(res.Street);
		}
		if(typeof res.State !== 'undefined'){
			$.each(self.states, function (key, item){
				if(res.State == item.name || res.State == item.short){
					var state = item.id;
					
					$('select[data-name="state"] option[value="'+state+'"]').prop('selected', true);
				}
			});
		}
		if(typeof res.ZIP !== 'undefined'){
			$('input[data-name="zip"]').val(res.ZIP);
		}
    }
	this.changePlaceGroup = function (){
		self.poiGroup.removeObject(self.marker);
		self.placeMarker();
	}
	this.showPoiMap = function (){
		$('.map-block').show();
		$('.list-block').hide();
        if ($.isFunction(self.allPoiMap.getViewPort)){
			self.mapHeight();
			self.allPoiMap.getViewPort().resize();
		}
	}
	this.showPoiList = function (){
		$('.list-block').show();
		$('.map-block').hide();
	}
}