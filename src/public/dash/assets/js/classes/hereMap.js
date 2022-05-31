function hereMapClass() {
    var self = this;
    this.platform = '';
    this.hMap = '';
    this.hereUi = '';
    this.group = [];
    this.mapElement = '';
    this.selectType = '';

    /**
     * Create base map
     * @mapElement = id element init map
     * @type = 'normal', 'satellite', 'terrain'
     * @link https://developer.here.com/documentation/maps/topics/map-types.html
     */
    this.showMap = function (mapElement = '') {
        if (mapElement === '' || typeof mapElement === "undefined") {
            showModal('Error', 'Not found place for map.');
            return false;
        }
        if(hereMap.mapElement === mapElement && $('#'+mapElement).find('canvas').length) {
            c('map is load');
            return false;
        }

        self.mapElement = mapElement;
        self.platform = new H.service.Platform({app_id: HERE_APP_ID, app_code: HERE_APP_CODE, useHTTPS: true});
        var pixelRatio = window.devicePixelRatio || 1;
        var defaultLayers = self.platform.createDefaultLayers({
            tileSize: pixelRatio === 1 ? 256 : 512,
            ppi: pixelRatio === 1 ? undefined : 320
        });

        var mapType = defaultLayers.normal.map;

        // initialize a map
        self.hMap = new H.Map(document.getElementById(mapElement),
            mapType, {
                center: {lat: 39.9798817, lng: -99.3329989},
                zoom: 4,
                pixelRatio: pixelRatio
            });
        self.hMap.getBaseLayer().setMin(2);
        // MapEvents enables the event system
        // Behavior implements default interactions for pan/zoom (also on mobile touch environments)
        var behavior = new H.mapevents.Behavior(new H.mapevents.MapEvents(self.hMap));

        // create default UI with layers provided by the platform
        self.hereUi = H.ui.UI.createDefault(self.hMap, defaultLayers);
        // Set the UI unit system to imperial measurement
        self.hereUi.setUnitSystem(H.ui.UnitSystem.IMPERIAL);
        fullScreenControl(mapElement);
    };

    this.setCenter = function(params) {
        if(!hereMap.mapElement)
            return false;

        self.hMap.setCenter({lat: params.lat, lng: params.lng});
        self.hMap.setZoom(14);
    };

    this.onChangeGetCenterLocation = function() {
        self.hMap.addEventListener('mapviewchangeend', function(evt){
            var center = self.hMap.getCenter();
            logbook.editChangeStatusLocation(center);
            plcApi.getLocationFromLatLng(center);
        })
    };

    /**
     * Dynamic resize map
     */
    window.addEventListener('resize', function () {
        if ($.isFunction(self.hMap.getViewPort))
            self.hMap.getViewPort().resize();
    });
}

if (typeof hereMap == 'undefined') {
    var hereMap = new hereMapClass();
}
