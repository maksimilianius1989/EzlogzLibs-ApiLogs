var infowindow = {};
function clearOverlays() {
    for (var i = 0; i < markersArray.length; i++ ) {
        if(poiGroup.contains( markersArray[i])){  //markersArray[i].setMap(null);
			poiGroup.removeObject( markersArray[i]);
		}
    }
    markersArray.length = 0;
}
function parkingHandler(response){
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
var markersArray = [];
function infoRatingHandler(response){
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
function poiItemsHandler(response){
    c('poiItemsHandler');
    clearOverlays(); 
    if(response.data.length > 0){
        $.each(response.data, function(index, item){
            var lat = item.lt;
            var lon = item.ln;
            var group = item.groupId;
            var icon = '/dash/assets/img/poi/'+group+'/marker/ic_launcher.png'; // null = default icon
            var iconParam = new H.map.Icon(icon),
                coords = {lat: lat, lng: lon},
                marker = new H.map.Marker(coords, {icon: iconParam});
            markersArray.push(marker);
            poiGroup.addObject(marker);
            addInfoWindow(marker, item, 1);
        });
    }
    $('#poi_items input').prop('disabled', false);
}
function poiWSHandler(response){
    c('poiWSHandler');
    clearOverlays(); 
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
			markersArray.push(marker);
			poiGroup.addObject(marker);
            addInfoWindow(marker, item, 1);
        });
    }
}
function getInfoContent(item, type){
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
            <h3 class="info_link">'+title+'</h3>\n\
            <div class="address_box">'+addressLine+stateZipLine+phoneLine+'</div> \n\
            <div class="rating_box"><img class="loading" src="/dash/assets/img/loading.gif"/></div>'+additionalInfo+'\n\
            </div>';
}
function addInfoWindow(marker, item, type){//0 - others, 1 - ws, 2 - parking
    var contentString = getInfoContent(item, type);
    var id = item.id;
	marker.addEventListener('tap', function(evt) { c('tap marker');
		var bubble =  new H.ui.InfoBubble(evt.target.getPosition(), { content: contentString });
		poiMapUi.getBubbles().forEach(bub => poiMapUi.removeBubble(bub));
		poiMapUi.addBubble(bubble);
		c(bubble.getElement());
		c($(bubble.getElement()));
		//bubble.getElement().addEventListener('show', function(e) {});
		$(bubble.getElement()).addClass('poi_box');
		infowindow[item.id] = bubble;
		action = 'PlaceRating';
        data = {placeId:id};
		AjaxController(action, data, dashUrl, 'infoRatingHandler', errorBasicHandler);
        if(item.groupId == 0 || item.groupId == 5){
            action = 'ParkingStatus';
            data = {placeId:id};
            AjaxController(action, data, dashUrl, 'parkingHandler', errorBasicHandler);
        }
	});
}
function doWSCheck(){
    clearOverlays();
    var coords = getMapCoords();
    action = 'PoiWS';
    data = {lat1:coords.lat1, lon1:coords.lon1, lat2:coords.lat2, lon2:coords.lon2};
    AjaxController(action, data, dashUrl, 'poiWSHandler', errorBasicHandler);
}
function getMapCoords(){ c('getMapCoords');
	poiMapUi.getBubbles().forEach(bub => poiMapUi.removeBubble(bub));
    var center = poiMap.getCenter(); 
	var viewBounds = poiMap.getViewBounds(); c('viewBounds'); c(viewBounds);
	var topRight = poiMap.screenToGeo($('#hereMap').width()-2, 0);  c('topRight'); c(topRight);
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
	rectangle = new H.map.Rect(boundingBox, {
	  style: {
		fillColor: 'rgba(255, 255, 255, 0.4)',
		strokeColor: 'rgba(0, 0, 0, 0.8)',
		lineWidth: 2
	  },
	});
	poiGroup.addObject(rectangle);
    return {lat1:lat1,lon1:lon1,lat2:lat2,lon2:lon2};
}
function getPoiItems(poi, lat1, lon1, lat2, lon2){
    action = 'PoiItemsRad';
    data = {items:poi, lat1:lat1, lon1:lon1, lat2:lat2, lon2:lon2};
    $('#poi_items input').prop('disabled', true);
    AjaxController(action, data, dashUrl, 'poiItemsHandler', errorBasicHandler);
}

function toggleItem(id){
    if($('p[data-id="'+id+'"] .poi_marker').attr('class') == 'poi_marker'){
        $('p[data-id="'+id+'"] .poi_marker').attr('class', 'poi_marker active');
        $('p[data-id="'+id+'"] .poi_marker').prop('checked', true);
    }else{
        $('p[data-id="'+id+'"] .poi_marker').attr('class', 'poi_marker');
        $('p[data-id="'+id+'"] .poi_marker').prop('checked', false);
    }
}
function setItem(id){
    $('p[data-id="'+id+'"] .poi_marker').attr('class', 'poi_marker active').prop('checked', true);
}
function deactivateItem(id){
    $('p[data-id="'+id+'"] .poi_marker').attr('class', 'poi_marker').prop('checked', false);
}
function createFullInfo(id){
    $('#full_info_box').remove();
    var infoBox = '<div id="full_info_box"><img src="/dash/assets/img/loading.gif" class="loading"/> <div class="close_additional"><img src="https://maps.gstatic.com/mapfiles/api-3/images/mapcnt6.png" draggable="false" style="position: absolute; left: -2px; top: -336px; width: 59px; height: 492px; -webkit-user-select: none; border: 0px; padding: 0px; margin: 0px; max-width: none;"></div></div>';
    $('#hereMap').parent().append(infoBox);
}
function fullInfoHandler(response){
    var info = response.data[0];
    c(info);
    var title = info.title;
    var itemInfo = '<h3>'+title+'</h3><div class="close_additional"><img src="https://maps.gstatic.com/mapfiles/api-3/images/mapcnt6.png" draggable="false" style="position: absolute; left: -2px; top: -336px; width: 59px; height: 492px; -webkit-user-select: none; border: 0px; padding: 0px; margin: 0px; max-width: none;"></div><div class="item_body">';
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
    if(info.groupId == 0 || info.groupId == 5){
        if(statuses.lenght > 0){
            $.each(statuses, function(key, item){

            });
        }else{
            
        }
    }
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
    }else{
        
    }
    var starsGray = '<img src="/dash/assets/img/poi/star_grey.png" /><img src="/dash/assets/img/poi/star_grey.png" /><img src="/dash/assets/img/poi/star_grey.png" /><img src="/dash/assets/img/poi/star_grey.png" /><img src="/dash/assets/img/poi/star_grey.png" />';
    
    itemInfo+= '<div class="rating_box"><span class="avr_rating">'+avrgRating.toFixed(1)+'</span><div class="stars_box">'+starsGray+yb+'<div class="total_rates">'+rates.length+' reviews</div></div></div>';
    var totallAddress = '';
    totallAddress = addAddressData(totallAddress, address);
    totallAddress = addAddressData(totallAddress, city);
    totallAddress = addAddressData(totallAddress, state);
    totallAddress = addAddressData(totallAddress, zip);
    itemInfo+= '<div class="address_row">'+totallAddress+'</div>';
    if(workingTime != '' && workingTime != null){
        itemInfo+= '<div class="working_time">'+workingTime+'</div>';
    }
    itemInfo+='<div class="info_rows"><h4>Information</h4>';
    itemInfo = addInfoRow(itemInfo, 'Phone', phone);
    itemInfo = addInfoRow(itemInfo, 'Fax', fax);
    itemInfo = addInfoRow(itemInfo, 'Website', web);
    itemInfo = addInfoRow(itemInfo, 'Highway', highway);
    itemInfo = addInfoRow(itemInfo, 'Exit', ext);
    
    itemInfo += '</div>';
    
    itemInfo+='<div class="info_rows"><h4>Facilities</h4>';
    itemInfo = addInfoRow(itemInfo, 'Scales', scale);
    itemInfo = addInfoRow(itemInfo, 'Showers', shower);
    itemInfo = addInfoRow(itemInfo, 'Wi-Fi Internet', wifi);
    itemInfo = addInfoRow(itemInfo, 'ATM', atm);
    itemInfo = addInfoRow(itemInfo, 'Bulk Def', bulk);
    itemInfo = addInfoRow(itemInfo, 'Tire Care', tire);
    itemInfo = addInfoRow(itemInfo, 'TRANSFLO Express', transFE);
    itemInfo = addInfoRow(itemInfo, 'RV Dump Station', RVDump);
    itemInfo = addInfoRow(itemInfo, 'Overnight Parking', overNP);
    itemInfo = addInfoRow(itemInfo, 'Truck Parking Spots', trParkSp);
    itemInfo += '</div>';
    itemInfo += '</div>';
    $('#full_info_box').empty();
    $('#full_info_box').append(itemInfo);
    var w = 20*avrgRating;
    var w2 = 20*fl;
    $('#full_info_box .yellow_stars_det_box').width(w+'px');
    $('#full_info_box .yellow_stars_inner_det_box').width(w2+'px');
}
function addInfoRow(itemInfo, name, item){
    c(name);
    c(item);
    if(item == 0 || item == null || item == ''){
        itemInfo+= '<div><span class="info_name">'+name+'</span><span class="no">NO</span></div>';
    }else if(item == '1'){
        itemInfo+= '<div><span class="info_name">'+name+'</span><span class="yes">YES</span></div>';
    }else{
        itemInfo+= '<div><span class="info_name">'+name+'</span><span class="yes">'+item+'</span></div>';
    }
    return itemInfo;
}
function addAddressData(totallAddress, oneData){
    if(oneData != ''){
        if(totallAddress != '')
            totallAddress += ', ';
        totallAddress += oneData;
    }
    return totallAddress;
}
function checkAllPoiMarkersChecked()
{
    var checkAllPoiChecked = $('#poi_items .poi_marker').toArray().every(item => $(item).prop('checked'));
    if(checkAllPoiChecked)
    {
        $('.poi_marker_n').prop('checked', true);
    }
    else
    {
        $('.poi_marker_n').prop('checked', false);
    }
}
var oldZoom = 0;
$().ready(function(){
    if(typeof poiMap != 'undefined'){
		var mapReady = true;
		poiMap.addEventListener('dragend', function(ev) {
			var target = ev.target; 
			if (target instanceof H.Map) {
				doCheck();
			}
		}, false);
	
		oldZoom = poiMap.getZoom();
		poiMap.addEventListener('mapviewchangeend', function(){
			var newZoom = poiMap.getZoom();
			if(newZoom > oldZoom || newZoom < oldZoom){
				doCheck();
				oldZoom = newZoom;
			}
		});
	}
    
    function doCheck(){ c('doCheck');
        checkAllPoiMarkersChecked();
        $('#full_info_box').remove();
        if(typeof rectangle != 'undefined' && poiGroup.contains(rectangle))
			poiGroup.removeObject(rectangle); //rectangle.setMap(null);
        if(!mapReady){ c('!mapReady');
            return false;
        }
        if($('#w_s_button').hasClass('active')){ c('w_s_button hasClass active'); c('doWSCheck'); 
            doWSCheck();
            return false;
        }
        var coords = getMapCoords();
        if(getCookie('poi')){  c('getCookie poi');
            cookie=unescape(getCookie('poi'))
            var poi=cookie.split(',');
            getPoiItems(poi, coords.lat1, coords.lon1, coords.lat2, coords.lon2);
        }else{
            if(typeof rectangle != 'undefined' && poiGroup.contains(rectangle)){
                try 
                {
                    poiGroup.removeObject(rectangle); //rectangle.setMap(null);
                }
                catch(err)
                {
                    
                }
            }
            clearOverlays(); 
        }
    }
    function getAllPoi()
    {
        var allChecked = true;
        $('.poi_marker').each(function(){
            if($(this).attr('class') != 'poi_marker active'){
                c($(this));
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
                deactivateItem(id);
            });
        }else{
            c('show all');
            $('.poi_marker').each(function(){
                var id = $(this).parent().attr('data-id');
                poi.push(id);
                setItem(id);
            });

        }
        createCookie('poi', escape(poi.join(',')), 30);
        doCheck();
    }
    $('body').on('click', '.info_map_box_outer .close_div', function(){
        c('Close');
        var id = $(this).parent().find('.info_map_box').attr('data-id');
        infowindow[id].close();
    });
    $('body').on('click', '.info_link', function(){
        var id = $(this).parent().attr('data-id');
        createFullInfo(id);
        action = 'FullInfo';
        data = {placeId:id};
        AjaxController(action, data, dashUrl, 'fullInfoHandler', errorBasicHandler);
    });
    $('body').on('click', '.close_additional', function(){
        $(this).parent().remove();
    });
    if(getCookie('poi_ws') && getCookie('poi_ws') == 1){
        $('#w_s_button').addClass('active');
    }
    if(getCookie('poi')){
        cookie=unescape(getCookie('poi'))
        var poi=cookie.split(',');
        $.each(poi,  function(index, item) {
            toggleItem(item);
        });
    }
    $('#poi_chose').click(function(){
        doCheck();
    });
    $('#w_s_button').click(function(){
        if(typeof rectangle != 'undefined' && poiGroup.contains(rectangle))
			poiGroup.removeObject(rectangle);
        if($(this).hasClass('active')){
            $(this).removeClass('active');
            doCheck();
            createCookie('poi_ws', 0);
            return false;
        }
        createCookie('poi_ws', 1);
        $(this).addClass('active');
        doWSCheck();
    });
    
    $('.poi_marker').click(function(){
        if(!getCookie('poi')){
            var poi = [];
        }else{
            cookie=unescape(getCookie('poi'))
            var poi=cookie.split(',');
        }
        var id = $(this).parent().attr('data-id');
        if($(this).attr('class') == 'poi_marker active'){
            var index = poi.indexOf(id);
            if (index > -1) {
                poi.splice(index, 1);
            }
        }else{
            poi.push(id);
        }
        createCookie('poi', escape(poi.join(',')), 30);
        toggleItem(id);
        doCheck();
    });
    $('.p_all').change(getAllPoi);
    $('#checkAllPoi').click(getAllPoi);
});