function ItfaReportDistancesMap() {
    let self = this;
    this.waypts = [];
    this.stopsArray = [];
    this.markers = [];
    let map;
    const directionsService = new google.maps.DirectionsService();
    const directionsRenderer = new google.maps.DirectionsRenderer();
    const geocoder = new google.maps.Geocoder();    

    this.initMap = function () {
        map = new google.maps.Map(document.getElementById("tripWayPointsMap"), {
            center: {lat: 41.508742, lng: -90.120850},
            zoom: 4.3,
            mapTypeId: "roadmap",
        });
        directionsRenderer.setMap(map);
    }

    this.geolocate = function (input) {
        const autocomplete = new google.maps.places.Autocomplete(input);
        autocomplete.addListener("place_changed", () => {
            const place = autocomplete.getPlace();
            if( place.geometry ){
                let latLng = {
                    id: new Date().getTime(),
                    name: place.name,
                    lat: place.geometry.location.lat(),
                    lng: place.geometry.location.lng(),
                }
            }

        });
    };

    this.createRoute = () => {
        self.calculateRoute(directionsService);
    }

    this.calculateRoute = function() {
        self.waypts = [];
        if(self.stopsArray){
            for (let i = 0; i < self.stopsArray.length; i++) {
                if (self.stopsArray[i]) {
                    self.waypts.push({
                        location: self.stopsArray[i].value,
                        // stopover: false,
                    });
                }
            }
        }
        let routRequest = {
            origin: document.getElementById("start_point").value,
            destination: document.getElementById("end_point").value,
            waypoints: self.waypts,
            optimizeWaypoints: true,
            travelMode: google.maps.TravelMode.DRIVING,

        }
        directionsService.route( routRequest , self.directionsServiceHandler);
    }


            // Drawing route shape on the map
            // directionsRenderer.setDirections(response);

            // const summaryPanel = document.getElementById("tripWayPointsResults");
            // summaryPanel.innerHTML = "";

            // // For each route, display summary information.
            // // for (let i = 0; i < route.legs.length; i++) {
            // //     const routeSegment = i + 1;
            // //     summaryPanel.innerHTML +=
            // //     "<b>Route Segment: " + routeSegment + "</b><br>";
            // //     summaryPanel.innerHTML += route.legs[i].start_address + " to ";
            // //     summaryPanel.innerHTML += route.legs[i].end_address + "<br>";
            // //     summaryPanel.innerHTML += route.legs[i].distance.text + "<br><br>";
            // // }
            // self.hideAddMultipleButton(false);

    this.directionsServiceHandler = (response, status) => {
        if (status === "OK" && response) {
            // Drawing route shape on the map
            directionsRenderer.setDirections(response);

            // delete all markers
            self.deleteMarkers();

            let routeShape = response.routes[0].overview_path;
            let firstDot = {
                lat: routeShape[0].lat(),
                lng: routeShape[0].lng()
            }
            let currentState = self.getLocationState(firstDot);
            routeShape.forEach( point => {
                latlng = {
                    lat: point.lat(),
                    lng: point.lng()
                }
                state = self.getLocationState(latlng);
                if ( state != currentState ) {
                    self.addMarker(latlng);
                }
                currentState = state;
            });
            self.setMapOnAll(map);

            // for (var i = 0; i <= map.markers.length; i++) {
            //     console.log(map.markers[i]);
            // }
            // let routRequest = {
            //     origin: document.getElementById("start_point").value,
            //     destination: document.getElementById("end_point").value,
            //     waypoints: ,
            //     optimizeWaypoints: true,
            //     travelMode: google.maps.TravelMode.DRIVING,

            // }
            // directionsService.route( routRequest , self.calculateRouteStatesHandler);
            self.hideAddMultipleButton(false);
        } else {
            window.alert("Directions request failed due to " + status);
        }

    }

    this.calculateRouteStatesHandler = (response, status) => {
        console.log(response, status)
    }

    this.deleteMarkers = () => {
        self.setMapOnAll(null);
        self.markers = [];
    };
    this.addMarker = (location) => {
        const marker = new google.maps.Marker({
            position: location,
        });
        self.markers.push(marker);
    }
    this.setMapOnAll = (map) => {
        for (let i = 0; i < self.markers.length; i++) {
            self.markers[i].setMap(map);
        }
    }

    this.getLocationState = function (latlng) {
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
            var inside = self.insidePolygon(latlng.lat, latlng.lng, statesPolyArr[i].cornersX, statesPolyArr[i].cornersY);
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

    this.handleVehicleSpecChanged = function () {
        let vehicle = 1;
        let vehicleNumTires = 4;
        let trailerType = 0;
        let trailerNum = 0;
        let vehicleNumAxles = 2;
        let trailerNumAxles = 0;
        let hybrid = 0;
        let emmisionType = 5;
        let vehicleHeight = 167;
        let vehicleWeight = 1739;
        let trailerHeight = 0;
        let totalWeight = 1739;
        let totalWidth = 180;
        let totalLength = 441;
        let disabledEquipped = 0;
        let minPollution = 0;
        let hov = 0;
        let numPassengers = 2;
        let commercial = 0;
        let hazardousType = 0;
        let heightAbove1stAxle = 100;

        let vehSpecSelectionVal = $('#vehicle_spec').val();
        if (vehSpecSelectionVal == 0) { // Car
            vehicle = 2;
            vehicleNumTires = 4;
            trailerType = 0;
            trailerNum = 0;
            vehicleNumAxles = 2;
            trailerNumAxles = 0;
            hybrid = 0;
            emmisionType = 5;
            vehicleHeight = 167;
            vehicleWeight = 1739;
            trailerHeight = 0;
            totalWeight = 1739;
            totalWidth = 180;
            totalLength = 441;
            disabledEquipped = 0;
            minPollution = 0;
            hov = 0;
            numPassengers = 2;
            commercial = 0;
            hazardousType = 0;
            heightAbove1stAxle = 100;
        } else if (vehSpecSelectionVal == 1) { // Delivery Truck
            vehicle = 9;
            vehicleNumTires = 4;
            trailerType = 0;
            trailerNum = 0;
            vehicleNumAxles = 2;
            trailerNumAxles = 0;
            hybrid = 0;
            emmisionType = 5;
            vehicleHeight = 255;
            vehicleWeight = 3500;
            trailerHeight = 0;
            totalWeight = 3500;
            totalWidth = 194;
            totalLength = 652;
            disabledEquipped = 0;
            minPollution = 0;
            hov = 0;
            numPassengers = 1;
            commercial = 1;
            hazardousType = 0;
            heightAbove1stAxle = 130;
        } else if (vehSpecSelectionVal == 2) { // Truck 7.5t
            vehicle = 3;
            vehicleNumTires = 4;
            trailerType = 0;
            trailerNum = 0;
            vehicleNumAxles = 2;
            trailerNumAxles = 0;
            hybrid = 0;
            emmisionType = 5;
            vehicleHeight = 340;
            vehicleWeight = 7500;
            trailerHeight = 0;
            totalWeight = 7500;
            totalWidth = 250;
            totalLength = 720;
            disabledEquipped = 0;
            minPollution = 0;
            hov = 0;
            numPassengers = 1;
            commercial = 1;
            hazardousType = 0;
            heightAbove1stAxle = 300;
        } else if (vehSpecSelectionVal == 3) { // Truck 11t
            vehicle = 3;
            vehicleNumTires = 4;
            trailerType = 0;
            trailerNum = 0;
            vehicleNumAxles = 2;
            trailerNumAxles = 0;
            hybrid = 0;
            emmisionType = 5;
            vehicleHeight = 380;
            vehicleWeight = 11000;
            trailerHeight = 0;
            totalWeight = 11000;
            totalWidth = 255;
            totalLength = 1000;
            disabledEquipped = 0;
            minPollution = 0;
            hov = 0;
            numPassengers = 1;
            commercial = 1;
            hazardousType = 0;
            heightAbove1stAxle = 300;
        } else if (vehSpecSelectionVal == 4) { // Truck one trailer 38t
            vehicle = 3;
            vehicleNumTires = 6;
            trailerType = 2;
            trailerNum = 1;
            vehicleNumAxles = 2;
            trailerNumAxles = 3;
            hybrid = 0;
            emmisionType = 5;
            vehicleHeight = 400;
            vehicleWeight = 24000;
            trailerHeight = 400;
            totalWeight = 38000;
            totalWidth = 255;
            totalLength = 1800;
            disabledEquipped = 0;
            minPollution = 0;
            hov = 0;
            numPassengers = 1;
            commercial = 1;
            hazardousType = 0;
            heightAbove1stAxle = 300;
        } else if (vehSpecSelectionVal == 5) { // Trailer Truck 40t
            vehicle = 3;
            vehicleNumTires = 6;
            trailerType = 2;
            trailerNum = 1;
            vehicleNumAxles = 3;
            trailerNumAxles = 2;
            hybrid = 0;
            emmisionType = 5;
            vehicleHeight = 400;
            vehicleWeight = 12000;
            trailerHeight = 400;
            totalWeight = 40000;
            totalWidth = 255;
            totalLength = 1650;
            disabledEquipped = 0;
            minPollution = 0;
            hov = 0;
            numPassengers = 1;
            commercial = 1;
            hazardousType = 0;
            heightAbove1stAxle = 300;
        } else if (vehSpecSelectionVal == 6) { // Car with Trailer
            vehicle = 2;
            vehicleNumTires = 3;
            trailerType = 2;
            trailerNum = 1;
            vehicleNumAxles = 2;
            trailerNumAxles = 1;
            hybrid = 0;
            emmisionType = 5;
            vehicleHeight = 167;
            vehicleWeight = 1739;
            trailerHeight = 167;
            totalWeight = 2589;
            totalWidth = 180;
            totalLength = 733;
            disabledEquipped = 0;
            minPollution = 0;
            hov = 0;
            numPassengers = 1;
            commercial = 0;
            hazardousType = 0;
            heightAbove1stAxle = 100;
        }
        $('#vehicle_type').val(vehicle)
        $('#vehicle_tires').val(vehicleNumTires)
        $('#trailer_type').val(trailerType)
        $('#trailer_number').val(trailerNum)
        $('#vehicle_axles').val(vehicleNumAxles)
        $('#trailer_axles').val(trailerNumAxles)
        $('#hybrid').val(hybrid)
        $('#emissionType').val(emmisionType)
        $('#vehicle_height').val(vehicleHeight)
        $('#vehicle_weight').val(vehicleWeight)
        $('#trailer_height').val(trailerHeight)
        $('#total_weight').val(totalWeight)
        $('#total_width').val(totalWidth)
        $('#total_length').val(totalLength)
        $('#dis').val(disabledEquipped)
        $('#minPollution').val(minPollution)
        $('#hov').val(hov)
        $('#passengers').val(numPassengers)
        $('#comm').val(commercial)
        $('#hazardousType').val(hazardousType)
        $('#height_first_axle').val(heightAbove1stAxle)
    }

    this.addStop = (el) => {
        let id = 'stop' + new Date().getTime();
        let $lastPoint = $('#tripWayPointsForm').find('#lastPoint')

        // Create HTML-block
        var $newEl = $(`
            <div class="form-group blockStop">
                <div class="trip-location--dot dragging-item"></div>
                <div class="input_place input-group location_name_cont">
                    <label for="${id}" class="input__container validate_input">
                        <input type="text"class="form-control point input__item stopItemInput" id="${id}" autocomplete="custom" onclick="tripWayPointsMap.geolocate(this);">
                        <span class="input__label">Stop</span>
                    </label>
                    <span class="input-group-btn">
                        <button type="button" class="remove-location--button" onclick="tripWayPointsMap.removeStop(this)"> 
                            <i class="icon-icons-main-ic-delete"></i> 
                        </button>
                    </span>
                </div>
            </div>
        `);

        $lastPoint.before($newEl);
        self.initElementDrug($newEl);
        self.recalculatePoints();
    }

    this.recalculatePoints = () => {

        this.stopsArray = $(".stopItemInput");

        let $points = $('#tripWayPointsForm .form-group');
        let multipleCounter = 0;
        $.each($points, function(idx, item){
            if($(item).hasClass('blockStop')){
                $(item).find('.input__label').text(`Stop ${idx}`)
                multipleCounter++;
            }
        })

        self.hideAddMultipleButton(multipleCounter);
    }

    this.hideAddMultipleButton = function (multipleCounter) {
        if (!multipleCounter) {
            $('.add-multiple').show();
        } else {
            $('.add-multiple').hide();
        }
    }

    this.removeStop = (el) => {
        $(el).closest('.blockStop').remove();
        self.recalculatePoints();
        self.hideAddMultipleButton(false);
    }

    this.initElementDrug = function (draggable) {
        draggable.on('mousedown', function (e) {
            if (!$(e.target).is('.dragging-item')) {
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
            $('#tripWayPointsForm .dragging-item').on('mousemove', function (e) {
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
                $('#tripWayPointsForm .dragging-item').off('mousemove')
                dr.removeClass("drag");
                dr.css('top', 'auto');
            });
        });
    }
    this.checkOtherElements = function ($el) {
        var parent = $el.parent();
        var childs = $('#tripWayPointsForm .blockStop');
        childs.each(function () {
            if ($el.index() == $(this).index()) {
            } else {
                if (Math.abs($(this).offset().top - $el.offset().top) <= 30) {
                    if ($(this).offset().top > $el.offset().top) {
                        //moving down
                        $el.before($(this));
                    } else {
                        //moving up
                        $el.after($(this));
                    }
                    self.recalculatePoints();
                    return false;
                }
            }
        })
    }

    this.btnTripWayPoints = function (el) {
        if ($(el).find('.sw-label').text() === 'Close Trip Way Points') {
            $('#tripWayPointsBlock').hide();
            $(el).find('.sw-label').text('Trip Way Points');
        } else {
            $('#tripWayPointsBlock').show();
            $(el).find('.sw-label').text('Close Trip Way Points');
        }
    };

    this.toggleFormBlock = function (el) {
        if($(el).parent().hasClass('opened')){
            $(el).parent().removeClass('opened')
            $(el).parent().find('.toggle-hidden').stop(false, true).slideUp(300)
            eraseCookie('ifta_param_' + $(el).closest('.opts').attr('data-type'));
        }else{
            $('.toggle-hidden').parent().removeClass('opened')
            $('.toggle-hidden').stop(false, true).slideUp(300)
            $(el).parent().addClass('opened')
            $(el).parent().find('.toggle-hidden').stop(false, true).slideDown(300)
            createCookie('ifta_param_' + $(el).closest('.opts').attr('data-type'), 1, 30);
        }
    }

}

let tripWayPointsMap = new ItfaReportDistancesMap();