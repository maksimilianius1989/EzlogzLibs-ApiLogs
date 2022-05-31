function userTripsMap() {
    var self = this;
    this.object = document.getElementById('hereMap');
    this.platform = '';
    this.defaultLayers = '';
    this.hMap = {};
    this.behavior = '';
    this.ui = '';
    this.router = '';
    this.starttime = new Date().getTime();
    this.gAutocompleteList = '';
    this.markers = [];

    /**
     * Google autocomplete locations into one input
     * @param el
     */
    this.geolocate = function (el) {
        var gMap = new google.maps.places.Autocomplete((document.getElementById($(el).attr('id'))), {types: ['geocode']});
        // google.maps.event.removeListener(self.gAutocompleteList);
        self.gAutocompleteList = gMap.addListener('place_changed', function () {
            var place = gMap.getPlace();
            if (typeof place.geometry !== 'undefined')
                $(el).data({lat: place.geometry.location.lat(), lng: place.geometry.location.lng()});
        });
    };

    this.deleteMarkers = function () {
        for (var i = 0; i < self.markers.length; i++) {
            if (self.hMap.getObjects(self.markers[i]).length != 0)
                self.hMap.removeObject(self.markers[i]);
        }
        self.markers = [];
    };

    /**
     * Set autocomplete locations inputs
     */
    this.searchInput = false;
    this.autocompleteAddress = function (el) {
        self.searchInput = $(el);
        var searchStr = $(el).val();
        plcApi.locationAutocompleteKeyup(searchStr);
    }
    this.sendLocationNamesFromStrHandler = function (data) {
        if (!self.searchInput) {
            return 1;
        }
        var resultList = data.result;
        $(".pac-container.pac-logo").remove();

        self.searchInput.parent().append('<div class="pac-container pac-logo"></div>');
        $.each(resultList, function (key, item) {
            $(".pac-container.pac-logo").append('<div onclick="userTripsMap.selectPlace(this)" class="pac-item"><span class="pac-icon pac-icon-marker"></span><span class="pac-item-query"><span class="pac-matched">' + item + '</span></div>');
        });
        $(".pac-container.pac-logo").show();
    }
    this.selectPlace = function (el) {
        var searchStr = $(el).text();
        plcApi.selectPlace(searchStr);
    }
    this.sendLocationFromStrHandler = function (data) {
        if (!self.searchInput) {
            return 1;
        }
        var resultData = data.result;
        c('strt' + resultData.searchStr)
        self.searchInput.val(resultData.searchStr);
        self.searchInput.data({lat: resultData.lat, lng: resultData.lng});
        $(".pac-container.pac-logo").remove();
    }
    this.initAutocomplete = function () {
        $(".pac-container").remove();
        $.each($('#tripWayPointsForm input.point'), function (x, point) {
            //if(typeof $(point).attr('id') !== 'undefined')
            // self.geolocate($(point));
        });
    };
    self.initAutocomplete();

    this.showMap = function () {
        c('showMap')
        self.starttime = new Date().getTime();
        self.platform = new H.service.Platform({
            app_id: HERE_APP_ID,
            app_code: HERE_APP_CODE,
            useHTTPS: true
        });
        // Obtain the default map types from the platform object:
        self.defaultLayers = self.platform.createDefaultLayers();
        // Instantiate (and display) a map object:
        self.hMap = new H.Map(self.object, self.defaultLayers.normal.map, {zoom: 3, center: {lat: 45.508742, lng: -90.120850}});
        self.hMap.getBaseLayer().setMin(2);
        // Behavior implements default interactions for pan/zoom (also on mobile touch environments)
        self.behavior = new H.mapevents.Behavior(new H.mapevents.MapEvents(self.hMap));
        // Create the default UI components
        self.ui = H.ui.UI.createDefault(self.hMap, self.defaultLayers);
        // Set the UI unit system to imperial measurement
        self.ui.setUnitSystem(H.ui.UnitSystem.IMPERIAL);
        self.router = self.platform.getRoutingService();
        fullScreenControl('hereMap');
        self.setResize();
    };

    this.makeRoute = function (points) {
        $('#gifBox').show();
        c('start ' + self.starttime);
        
        var routingParameters = {
            'mode': 'fastest;truck;traffic:enabled;boatFerry:-1',
            'representation': 'display',
            'routeAttributes':  'waypoints,summary,shape,legs'
        };

        routingParameters.width = 40;
        routingParameters.height = 40+'m';
        routingParameters.length = 60+'m';
        routingParameters.limitedWeight = 1000+'t';

        self.deleteMarkers();

        $.each(points, function (x, point) {
            var coords = {lat: point.lat, lng: point.lng};
            var marker = new H.map.Marker(coords);
            self.markers.push(marker);
            self.hMap.addObject(marker);
            routingParameters['waypoint' + x] = '' + point.lat + ',' + point.lng;
        });
        var router = self.platform.getRoutingService();
        router.a.vc = 'tce.api.here.com/2';
        router.c = false;
        router.a.c = false;
        var onResult = function (result) {
            c('result')
            c(result);
            var route,
                    routeShape,
                    startPoint,
                    endPoint,
                    linestring;
            if (result.response && result.response.route) {
                // Pick the first route from the response:
                route = result.response.route[0];
                
                // Pick the route's shape:
                routeShape = route.shape;

                // Create a linestring to use as a point source for the route line
                linestring = new H.geo.LineString();
                c('start iterating')
                // Push all the points in the shape into the linestring:
                var k = 0;
                var s = 0;
                var lat = 0;
                var lng = 0;
                var pnts = [];
                routeShape.forEach(function (point) {
                    if (k % 2 == 0) {
                        lat = point;
                    } else {
                        lng = point;
                        pnts[s] = {lat: parseFloat(lat), lng: parseFloat(lng)};
                        s++;
                    }
                    k++;
                });
                routeShape = pnts;
                var k = 0;
                routeShape.forEach(function (point) {
                    linestring.pushLatLngAlt(point.lat, point.lng);
                });
                // Create a polyline to display the route:
                var routeLine = new H.map.Polyline(linestring, {
                    style: {strokeColor: 'rgba(93, 170, 18, 0.5)', lineWidth: 10}
                });

                self.markers.push(routeLine);
                // Add the route polyline and the two markers to the map:
                self.hMap.addObjects([routeLine]);

                // Set the map's viewport to make the whole route visible:
                self.hMap.setViewBounds(routeLine.getBounds());
                c('finish ' + new Date().getTime() + ' length ' + (new Date().getTime() - self.starttime))
            } else if (result.type && result.type === 'ApplicationError') {
                showModal('Message', 'Cant calculate land route.');
                // self.clearTrip();
            }
            $('#gifBox').hide();
        };
        router.calculateRoute(routingParameters, onResult,
                function (error) {
                    alert(error.message);
                });
    };

    this.rad = function (x) {
        return x * Math.PI / 180;
    };

    this.getDistance = function (p1, p2) {
        var R = 6378137; // Earth’s mean radius in meter
        var dLat = self.rad(p2.lat - p1.lat);
        var dLong = self.rad(p2.lng - p1.lng);
        var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(self.rad(p1.lat)) * Math.cos(self.rad(p2.lat)) *
                Math.sin(dLong / 2) * Math.sin(dLong / 2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        var d = R * c;
        return d; // returns the distance in meter
    };

    this.getLocationState = function (loc) {
        var state = '';
        var statesPolyArr = [];
        for (var i = 0; i < stateCoords.length; i++) {
            var cornersX = [];
            var cornersY = [];
            var label = stateCoords[i][0];
            var points = stateCoords[i][1];
            for (j = 0; j < points.length; j++) {
                cornersX.push(points[j][0])
                cornersY.push(points[j][1])
            }
            statesPolyArr.push({cornersX: cornersX, cornersY: cornersY, points: points, label: label})
        }

        for (var i = 0; i < statesPolyArr.length; i++) {
            var inside = self.insidePolygon(loc.lat, loc.lng, statesPolyArr[i].cornersX, statesPolyArr[i].cornersY);
            if (inside) {
                state = statesPolyArr[i].label;
                break;
            }
        }
        return state;
    };

    this.insidePolygon = function (x, y, cornersX, cornersY) {
        var i, j = cornersX.length - 1;
        var oddNodes = false;

        var polyX = cornersX;
        var polyY = cornersY;

        for (i = 0; i < cornersX.length; i++) {
            if ((polyY[i] < y && polyY[j] >= y || polyY[j] < y && polyY[i] >= y) && (polyX[i] <= x || polyX[j] <= x)) {
                oddNodes ^= (polyX[i] + (y - polyY[i]) / (polyY[j] - polyY[i]) * (polyX[j] - polyX[i]) < x);
            }
            j = i;
        }

        return oddNodes;
    };

    /**
     * Dynamic resize map
     */
    this.resized = false;
    this.setResize = function () {
        if (!this.resized) {
            window.addEventListener('resize', function () {
                if (self.hMap !== '')
                    self.hMap.getViewPort().resize();
            });
            this.resized = true;
        }
    }

    this.btnRunTrip = function () {
        var points = [];
        var elementData = '';
        $.each($('#tripWayPointsForm input.point'), function (x, point) {
            elementData = $(point).data();
            if (typeof elementData.lat !== 'undefined' && typeof elementData.lng !== 'undefined') {
                points.push({lat: elementData.lat, lng: elementData.lng});
            }
        });
        // c(points);
        if (points.length > 1) {
            self.makeRoute(points);
        } else {
            showModal('Message', 'Please enter the destination point of route.', 'errorMessage');
        }
    };

    this.clearTrip = function () {
        $('#tripWayPointsBlock input.point').val('').removeData();
        $('.blockStop').remove();
        self.clearMap();
    };

    this.clearTripSection = function (el) {
        $(el).closest('.form-group').remove();
        self.clearMap();
    };

    this.clearMap = function () {
        $('#tripWayPointsResults').empty();
        self.locationPoints = '';
        self.deleteMarkers();
    };

    this.btnTripWayPoints = function (el) {
        if ($(el).text() === 'Close Trip Way Points') {
            $('#tripWayPointsBlock').hide();
            $(el).text('Trip Way Points');
        } else {
            $('#tripWayPointsBlock').show();
            $(el).text('Close Trip Way Points');

            if ($.isEmptyObject(self.hMap)) {
                c('--- Load map');
                self.showMap();
            } else {
                c('--- Show map');
                self.clearTrip();
            }
            self.hMap.getViewPort().resize();
        }
    };
    this.recalculatePoints = function () {
        var points = $('#tripWayPointsForm .form-group');
        points.each(function () {
            c('index ' + $(this).index());
            if ($(this).index() == 0) {
                $(this).removeClass('blockStop');
                $(this).find('label').text('From');
                $(this).find('.input_place').removeClass('input-group');
                $(this).find('.input-group-btn').remove();
            } else if ($(this).index() == points.length - 1) {
                $(this).removeClass('blockStop');
                $(this).find('label').text('To');
                $(this).find('.input_place').removeClass('input-group');
                $(this).find('.input-group-btn').remove();
            } else {
                $(this).addClass('blockStop');
                $(this).find('label').text('Stop ' + $(this).index());
                $(this).find('.input_place').addClass('input-group');
                if ($(this).find('.input_place').find('.input-group-btn').length == 0) {
                    c('appending');
                    $(this).find('.input_place').append('<span class="input-group-btn"><button type="button" class="btn btn-default" onclick="iftaMap.clearTripSection(this)"> - </button></span>');
                }
            }
        })
    }
    this.checkOtherElements = function ($el) {
        var parent = $el.parent();
        var childs = $('#tripWayPointsForm .form-group');
        childs.each(function () {
            if ($el.index() == $(this).index()) {

            } else {
                if (Math.abs($(this).offset().top - $el.offset().top) <= 30) {
                    if ($(this).offset().top > $el.offset().top) {//moving down
                        $el.before($(this));
                    } else {//moving up
                        $el.after($(this));
                    }
                    self.recalculatePoints();
                    return false;
                }
            }
        })
    }
    this.initElementDrug = function (draggable) {
        draggable.on('mousedown', function (e) {
            if (!$(e.target).is('.form-group')) {
                return 1;
            }
            var dr = $(this).addClass("drag").css("cursor", "move");
            var el = $(this);
            height = dr.outerHeight();
            width = dr.outerWidth();
            max_left = dr.parent().offset().left + dr.parent().width() - dr.width();
            max_top = dr.parent().offset().top + dr.parent().height() - dr.height();
            min_left = dr.parent().offset().left;
            min_top = dr.parent().offset().top;

            ypos = dr.offset().top + height - e.pageY,
                    xpos = dr.offset().left + width - e.pageX;
            $('#tripWayPointsForm .form-group').on('mousemove', function (e) {
                if (dr.hasClass("drag")) {
                    var itop = e.pageY + ypos - height;
                    var ileft = e.pageX + xpos - width;
                    self.checkOtherElements(el);
                    if (itop <= min_top) {
                        itop = min_top;
                    }
                    if (ileft <= min_left) {
                        ileft = min_left;
                    }
                    if (itop >= max_top) {
                        itop = max_top;
                    }
                    if (ileft >= max_left) {
                        ileft = max_left;
                    }
                    dr.offset({top: itop});
                }
            }).on('mouseup', function (e) {
                $('#tripWayPointsForm .form-group').off('mousemove')
                dr.removeClass("drag");
                dr.css('top', 'auto');
            });
        });
    }
    this.addStop = function (multiple) {
        var i = $('.form-group.blockStop').length + 1;

        var $newEl = $('<div class="form-group blockStop">\n' +
                '<label class="unselectable">Stop ' + i + '</label>\n' +
        '<div class="input_place input-group location_name_cont">\n' +
        '<input type="text" class="form-control point" placeholder="Location Name" autocomplete="off"  onkeyup="iftaMap.autocompleteAddress(this)">\n' +
        '<span class="input-group-btn"><button type="button" class="btn btn-default" onclick="iftaMap.clearTripSection(this)"> - </button></span>\n' +
        '</div></div>');
        $('#tripWayPointsForm .form-group').last().before($newEl);
        //Set autocomplete google locations in input
        self.initElementDrug($newEl);
        self.initAutocomplete();
    }
    this.addEditStop = function () {
        var i = $('.form-group.blockStop').length + 1;

        var $newEl = $('<div class="form-group blockStop">\n' +
        '<label class="unselectable">Stop ' + i + '</label>\n' +
        '<div class="input_place input-group location_name_cont">\n' +
        '<input type="text" class="form-control point" placeholder="Location Name" autocomplete="off"  onkeyup="iftaMap.autocompleteAddress(this)">\n' +
        '<span class="input-group-btn"><button type="button" class="btn btn-default" onclick="iftaMap.clearTripSection(this)"> - </button></span>\n' +
        '</div></div>');
        $('#tripWayPointsForm .form-group').last().before($newEl);
        //Set autocomplete google locations in input
        self.initElementDrug($newEl);
        self.initAutocomplete();
    }
}
var userTripsMap = new userTripsMap();