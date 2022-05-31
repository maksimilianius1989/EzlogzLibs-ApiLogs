function iftaDistancesMap() {
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
    this.multipleClass = 'multiple';

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
            $(".pac-container.pac-logo").append('<div onclick="iftaMap.selectPlace(this)" class="pac-item"><span class="pac-icon pac-icon-marker"></span><span class="pac-item-query"><span class="pac-matched">' + item + '</span></div>');
        })
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
        c('strt' + resultData.searchStr);

        // Place multiple data
        self.multipleSendLocation(resultData);

        $(".pac-container.pac-logo").remove();
    }
    // Place multiple data
    this.multipleSendLocation = function (resultData) {

        // If it is not multiple city - create a new one
        if (self.searchInput.hasClass(self.multipleClass)) {

            // Create new field
            var stopId = self.addStop(false);

            // Clear data in multiple
            self.searchInput.val('');

            // Get focus on multiple to place new data
            self.searchInput.focus();

            // Place result to new field
            self.searchInput = $(stopId);
        }

        // Place result to new field
        self.searchInput.val(resultData.searchStr);
        self.searchInput.data({lat: resultData.lat, lng: resultData.lng});

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
        self.object = document.getElementById('hereMap');
        self.starttime = new Date().getTime();
        self.platform = new H.service.Platform({
            app_id: HERE_APP_ID,
            app_code: HERE_APP_CODE,
            useHTTPS: true
        });
        // Obtain the default map types from the platform object:
        self.defaultLayers = self.platform.createDefaultLayers();
        // Instantiate (and display) a map object:
        self.hMap = new H.Map(self.object, self.defaultLayers.normal.map, {zoom: 4.3, center: {lat: 41.508742, lng: -90.120850}});
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

    this.makeRoute = function (points, addTripToPDFTable = true) {
        $('#gifBox').show();
        // var markers = [];
        var statesDistances = {};
        c('start ' + self.starttime);
        var vehicle_type = isNaN(parseInt($('#vehicle_type').val())) ? 1 : parseInt($('#vehicle_type').val());
        var vehicle_tires = isNaN(parseInt($('#vehicle_tires').val())) ? 6 : parseInt($('#vehicle_tires').val());
        var trailer_type = isNaN(parseInt($('#trailer_type').val())) ? 2 : parseInt($('#trailer_type').val());
        var trailer_number = isNaN(parseInt($('#trailer_number').val())) ? 1 : parseInt($('#trailer_number').val());
        var vehicle_axles = isNaN(parseInt($('#vehicle_axles').val())) ? 2 : parseInt($('#vehicle_axles').val());
        var trailer_axles = isNaN(parseInt($('#trailer_axles').val())) ? 3 : parseInt($('#trailer_axles').val());
        var hybrid = isNaN(parseInt($('#hybrid').val())) ? 0 : parseInt($('#hybrid').val());
        var emissionType = isNaN(parseInt($('#emissionType').val())) ? 5 : parseInt($('#emissionType').val());
        var vehicle_height = isNaN(parseInt($('#vehicle_height').val())) ? 400 : parseInt($('#vehicle_height').val());
        vehicle_height /= 100;
        var vehicle_weight = isNaN(parseInt($('#vehicle_weight').val())) ? 24000 : parseInt($('#vehicle_weight').val());
        var trailer_height = isNaN(parseInt($('#trailer_height').val())) ? 400 : parseInt($('#trailer_height').val());
        var total_weight = isNaN(parseInt($('#total_weight').val())) ? 38000 : parseInt($('#total_weight').val());
        total_weight /= 1000;
        var total_width = isNaN(parseInt($('#total_width').val())) ? 255 : parseInt($('#total_width').val());
        total_width /= 100;
        var total_length = isNaN(parseInt($('#total_length').val())) ? 1800 : parseInt($('#total_length').val());
        total_length /= 100;
        var dis = isNaN(parseInt($('#dis').val())) ? 0 : parseInt($('#dis').val());
        var minPollution = isNaN(parseInt($('#minPollution').val())) ? 0 : parseInt($('#minPollution').val());
        var hov = isNaN(parseInt($('#hov').val())) ? 0 : parseInt($('#hov').val());
        var passengers = isNaN(parseInt($('#passengers').val())) ? 1 : parseInt($('#passengers').val());
        var comm = isNaN(parseInt($('#comm').val())) ? 1 : parseInt($('#comm').val());
        var hazardousType = isNaN(parseInt($('#hazardousType').val())) ? 0 : parseInt($('#hazardousType').val());
        var height_first_axle = isNaN(parseInt($('#height_first_axle').val())) ? 100 : parseInt($('#height_first_axle').val());
        height_first_axle /= 100;
        var transportMode = "car";
        if (vehicle_type == "3") {
            transportMode = "truck";
        }
        if (vehicle_type == "9") {
            transportMode = "delivery";
        }

        var routingParameters = {
            'mode': 'fastest;' + transportMode + ';traffic:enabled',
            'representation': 'display',
            'rollup': 'none,country;tollsys',
            'tiresCount': vehicle_tires,
            'trailerType': trailer_type,
            'trailersCount': trailer_number,
            'tollVehicleType': vehicle_type,
            'vehicleNumberAxles': vehicle_axles,
            'trailerNumberAxles': trailer_axles,
            'hybrid': hybrid,
            'emissionType': emissionType,
            'trailerHeight': trailer_height + 'cm',
            'height': vehicle_height + 'm',
            'vehicleWeight': vehicle_weight + 'kg',
            'limitedWeight': total_weight + 't',
            'passengersCount': passengers,
            'disabledEquipped': dis,
            'hov': hov,
            'minimalPollution': minPollution,
            'commercial': comm,
            'width': total_width,
            'heightAbove1stAxle': height_first_axle + 'm',
            'length': total_length + 'm',
            'detail': '1',
            'cost_optimize': '0',
            'currency': 'USD'
        };
        if (parseInt(hazardousType.value) == 1) {
            routingParameters.shippedHazardousGoods = "explosive";
        } else if (parseInt(hazardousType.value) == 2) {
            routingParameters.shippedHazardousGoods = "other";
        }
        self.deleteMarkers();

        var currentState = self.getLocationState(points[0]);
        if (currentState) {
            statesDistances[currentState] = 0;
        }
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
                    var state = self.getLocationState(point);
                    if (state != false && state != currentState) {
                        c('new state ' + state)
                        if (typeof statesDistances[state] == 'undefined')
                            statesDistances[state] = 0;
                        currentState = state;
                        var marker = new H.map.Marker(point);
                        self.markers.push(marker);
                        self.hMap.addObject(marker);
                    }
                    if (state != false && k != 0) {
                        distance = self.getDistance(routeShape[k - 1], point);
                        statesDistances[currentState] += distance
                    }
                    k++;
                });

                // RS EW-744 Add table
                var tripWayPointsResults = $('#tripWayPointsResults');
                tripWayPointsResults.empty().prepend('<h4>Results:</h4>');
                tripWayPointsResults.append('<table class="table table-striped table-dashboard table-sm"></table>');

                // RS EW-744 Add rows to table
                tripWayPointsResultsTable = tripWayPointsResults.find('table');

                var fullDistance = 0;
                $.each(statesDistances, function (key, distance) {
                    statesDistances[key] = distance / 1000;
                    fullDistance += distance / 1000;
                    tripWayPointsResultsTable.append('<tr class="state" data-state="'+key+'" data-distance="'+(statesDistances[key] * 0.62137119).toFixed(2)+'"><td>' + key + '</td><td>' + (statesDistances[key] * 0.62137119).toFixed(2) + ' mi</td><td>' + statesDistances[key].toFixed(2) + ' km</td></tr>');
                });

                // RS EW-744 Add summary
                tripWayPointsResultsTable.append('<tr class="total" data-total="'+(fullDistance * 0.62137119).toFixed(2)+'"><td>Total</td><td>' + (fullDistance * 0.62137119).toFixed(2) + ' mi</td><td>' + fullDistance.toFixed(2) + ' km</td></tr>');
                tripWayPointsResultsTable.append('<tr class="total fuel"><td>Fuel Expense</td><td colspan="2">' + ((fullDistance * 0.62137119) / $('#fuel_expense').val()).toFixed(2) + ' gal</td></tr>');
                tripWayPointsResultsTable.append('<tr class="total toll"><td>Toll Cost</td><td colspan="2">$' + route.cost.totalCost + '</td></tr>');
                // if(DEV_ENV) {
                //     tripWayPointsResults.append('<p><label>Time:</label><span>' + ((new Date().getTime() - self.starttime) / 1000) + ' sec</span></div>');
                // }

                // RS EW-744: Append button to send data to IFTA-table
                if (addTripToPDFTable) {
                    tripWayPointsResults.append('<button class="btn btn-primary mt-2 btnTripToPdfTable">Add trip to PDF table</button>');
                }

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
            } else {
                showModal('Message', 'Cant calculate land route.');
                // self.clearTrip();
            }
            $('#gifBox').hide();
        };
        $('#tripWayPointsResults').empty()
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
        self.recalculatePoints();
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
            iftaMap.hMap.getViewPort().resize();
        }
    };
    this.recalculatePoints = function () {
        var points = $('#tripWayPointsForm .form-group');
        var stepsCounter = 1; // Calculate steps block
        var multipleCounter = 0; // Calculate blocks with multiple fields
        points.each(function () {
            c('index ' + $(this).index());
            // Multiple locations field
            if ($(this).find('input').hasClass(self.multipleClass)) {
                $(this).addClass('blockStop');
                $(this).find('label').text('Add multiple locations');
                $(this).find('.input_place').addClass('input-group');
                if ($(this).find('.input_place').find('.input-group-btn').length == 0) {
                    c('appending');
                    $(this).find('.input_place').append('<span class="input-group-btn"><button type="button" class="btn btn-default" onclick="iftaMap.clearTripSection(this)"> - </button></span>');
                }
                multipleCounter++;
            // First field
            } else if ($(this).index() == 0) {
                $(this).removeClass('blockStop');
                $(this).find('label').text('From');
                $(this).find('.input_place').removeClass('input-group');
                $(this).find('.input-group-btn').remove();
            // Last field
            } else if ($(this).index() == points.length - 1) {
                $(this).removeClass('blockStop');
                $(this).find('label').text('To');
                $(this).find('.input_place').removeClass('input-group');
                $(this).find('.input-group-btn').remove();
            // Steps
            } else {
                $(this).addClass('blockStop');
                $(this).find('label').text('Stop ' + stepsCounter++);
                $(this).find('.input_place').addClass('input-group');
                if ($(this).find('.input_place').find('.input-group-btn').length == 0) {
                    c('appending');
                    $(this).find('.input_place').append('<span class="input-group-btn"><button type="button" class="btn btn-default" onclick="iftaMap.clearTripSection(this)"> - </button></span>');
                }
            }
        });

        // Hide "add multiple" button
        self.hideAddMultipleButton(multipleCounter);
    }
    this.hideAddMultipleButton = function (multipleCounter) {
        if (multipleCounter == 0) {
            $('.add-multiple').show();
        } else {
            $('.add-multiple').hide();
        }
    }
    this.checkOtherElements = function ($el) {
        var parent = $el.parent();
        var childs = $('#tripWayPointsForm .form-group');
        childs.each(function () {
            if ($el.index() == $(this).index()) {

            } else {
                if (Math.abs($(this).offset().top - $el.offset().top) <= 30) {
                    if ($(this).offset().top > $el.offset().top) {//moving down
                        $el.before($(this))
                    } else {//moving up
                        $el.after($(this))
                    }
                    self.recalculatePoints()
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
        // Generate id to place data inside
        var id = 'stop' + new Date().getTime();

        var additionalClass = '';
        if (multiple) {
            additionalClass = ' ' + self.multipleClass;
        }

        // Create HTML-block
        var $newEl = $('<div class="form-group blockStop">\n' +
        '<label class="unselectable">Stop</label>\n' +
        '<div class="input_place input-group location_name_cont">\n' +
        '<input id="' + id + '" type="text" class="form-control point' + additionalClass + '" placeholder="Location Name" autocomplete="off"  onkeyup="iftaMap.autocompleteAddress(this)">\n' +
        '<span class="input-group-btn"><button type="button" class="btn btn-default" onclick="iftaMap.clearTripSection(this)"> - </button></span>\n' +
        '</div></div>');

        // Place new element
        self.placeStop($newEl);

        //Set autocomplete google locations in input
        self.initElementDrug($newEl)
        self.initAutocomplete();

        // Recalculate names, added after multiple create
        self.recalculatePoints();

        // Return ID to work with it
        return '#' + id;
    }
    this.placeStop = function ($newEl) {
        // If it is first input - just insert new one
        if ($('#tripWayPointsForm').html().trim() == '') {
            $('#tripWayPointsForm').html($newEl);
        } else {
            // Add new input before last one
            $('#tripWayPointsForm .form-group').last().before($newEl);
        }
    }

    // RS EW-744: Add trip from map to PDF-table
    this.tripToPdfTableGetData = function (tr) {

        if (typeof tr == 'undefined' || tr === null || tr.length == 0) {
            return false;
        }

        var res = {};
        res.distance = [];

        // Iterate all rows
        $.each(tr, function (key, item) {

            // Add state to result
            if ($(item).hasClass('state')) {
                var state = {};
                state.state = $(item).attr('data-state');
                state.distance = $(item).attr('data-distance');
                // Add state short
                state.stateshort = $('#state_select [data-name=' + state.state + ']').val();
                res.distance.push(state);
            }

        });

        res.settings = [];
        res.settings.mpg = $('#fuel_expense').val();
        res.settings.fuel = $('#vehicle_fuel_type option:checked').val();
        return res;
    }
}
var iftaMap = new iftaDistancesMap();