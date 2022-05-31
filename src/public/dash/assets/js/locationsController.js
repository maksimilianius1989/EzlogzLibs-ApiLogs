//MAP LOCATIONS -------------
function hereMapLocations() {
    var self = this;
    this.fleetTrucksArr = [];
    this.fleetDriversArr = [];
    this.platform = '';
    this.hMap = '';
    this.hereUi = '';
    this.group = [];
    this.mapElement = '';
    this.selectType = '';

    this.setDefaults = function (defaults) {
        self.fleetTrucksArr = typeof defaults.tracks !== 'undefined' ? defaults.tracks : [];
        self.fleetDriversArr = typeof defaults.drivers !== 'undefined' ? defaults.drivers : [];
        self.selectType = typeof defaults.selectType !== 'undefined' ? defaults.selectType : 'truck';
        self.showLocationsMap();
        self.hMap.addEventListener('pointerdown', self.stopFollowing);
    };
    this.stopFollowing = function () {
        self.following = false;
    }
    this.getDriverById = function (driverId) {
        var driverRet = {};
        $.each(self.fleetDriversArr, function (key, driver) {
            if (driver.driverId == driverId) {
                driverRet = driver;
                return false;
            }
        })
        return driverRet;
    }
    this.getTruckByDriverId = function (driverId) {
        var truckRet = {};
        $.each(self.fleetTrucksArr, function (key, truck) {
            if (truck.driverId == driverId) {
                truckRet = truck;
                return false;
            }
        })
        return truckRet;
    }
    this.getTruckByTruckId = function (truckId) {
        var truckRet = {};
        $.each(self.fleetTrucksArr, function (key, truck) {
            if (truck.truckId == truckId) {
                truckRet = truck;
                return false;
            }
        })
        return truckRet;
    }
    this.getLocationsData = function () {
        AjaxController('getFleetMapsDataInfo', {}, dashUrl,
                function ( {data: {fleetDriversInfo, fleetTracksInfo, randomLoc}}) {
                    //delete not valid location drivers and truck
                    self.fleetDriversArr = fleetDriversInfo.filter(value => value.locationInfo !== 'undefined' && (parseInt(value.locationInfo[0].latitude) > 0 || parseInt(value.locationInfo[0].longitude) > 0));
                    self.fleetTrucksArr = fleetTracksInfo.filter(value => value.locationInfo !== 'undefined' && (parseInt(value.locationInfo[0].latitude) > 0 || parseInt(value.locationInfo[0].longitude) > 0));

                    self.selectType = 'truck';
                    self.showLocationsMap(self.fleetTrucksArr);
                },
                        errorBasicHandler,
                        true
                        );
            };

    /**
     * Create base map
     * @mapElement = id element init map
     * @type = 'normal', 'satellite', 'terrain'
     * @link https://developer.here.com/documentation/maps/topics/map-types.html
     */
    this.showMap = function (mapElement = '', type = 'normal') {
        if (mapElement === '' || typeof mapElement === "undefined") {
            showModal('Error', 'Not found place for map.');
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
        if (type == 'satellite')
            mapType = defaultLayers.satellite.map;

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

        // create group for centering bounds
        self.group = new H.map.Group();
        fullScreenControl(mapElement);
    };

    this.showLocationsMap = function (arr = [], centered = true, onlyArr = false) {
        var driverStatus = $('#fleetDtiversStatuses').val();
        if (self.selectType == 'truck') {
            arr = arr.length || onlyArr === true ? arr : self.fleetTrucksArr;
            if(driverStatus) {
                arr.filter(item => item.locationInfo.length >= 1 && item.status === Number(driverStatus)).forEach(item => self.addOneTruckLocation(item));
            } else {
                arr.filter(item => item.locationInfo.length >= 1).forEach(item => self.addOneTruckLocation(item));
            }

        } else if (self.selectType == 'driver') {
            arr = arr.length || onlyArr === true ? arr : self.fleetDriversArr;
            if(driverStatus !== '') {
                arr.filter(item => item.locationInfo.length >= 1 && item.status === Number(driverStatus)).forEach(item => self.addOneDriverLocation(item));
            } else {
                arr.filter(item => item.locationInfo.length >= 1).forEach(item => self.addOneDriverLocation(item));
            }
        }

        if (self.group.getBounds() && centered === true)
            self.hMap.setViewBounds(self.group.getBounds());
    };

    this.moveOneTruckLocation = function (truckObj) {
        if (window.location.pathname != "/dash/fleet/equipment/") {
            if ($('#driverOrTruck').val() != 'truck') {
                return 1;
            }
        }
        $.each(self.group.getObjects(), function (key, marker) {
            if (typeof marker.trackData != 'undefined' && marker.trackData.truckId == truckObj.truckId) {
                marker.setPosition({lat: truckObj.lat, lng: truckObj.lng})
                if (self.following && self.following.driverId == truckObj.driverId) {
                    self.hMap.setCenter({lat: truckObj.lat, lng: truckObj.lng})
                }
                return false;
            }
        })
    }

    this.moveOneDriverLocation = function (driverObj) {
        if (window.location.pathname == "/dash/maps/" && $('#driverOrTruck').val() != 'driver') {
            return 1;
        }
        $.each(self.group.getObjects(), function (key, marker) {
            if (typeof marker.driverData != 'undefined' && marker.driverData.driverId == driverObj.driverId) {
                marker.setPosition({lat: driverObj.lat, lng: driverObj.lng})
                if (self.following && self.following.driverId == driverObj.driverId) {
                    self.hMap.setCenter({lat: driverObj.lat, lng: driverObj.lng})
                }
                return false;
            }
        })
    }

    /**
     * Add marker to map
     * @param truckData
     */
    this.addOneTruckLocation = function (truckData) {
        //Get driver name
        var driverObj = self.fleetDriversArr.find(x => x.driverId === truckData.driverId);
        var icon = new H.map.Icon(self.getIconByStatus(truckData));
        var marker = new H.map.Marker({
            lat: truckData.locationInfo[0].latitude,
            lng: truckData.locationInfo[0].longitude
        }, {icon: icon});
        marker.trackData = truckData;
        self.group.addObject(marker);
        self.hMap.addObject(self.group);

        marker.addEventListener('tap', function (evt) {
            self.removeAllBubbles();
            self.reverseGeocode(truckData, function (result) {
                var locationBlock = '';
                if (result && typeof result.response !== 'undefined' && result.response.view.length > 0 && typeof result.response.view[0].result[0].location.address !== 'undefined') {
                    var locations = result.response.view[0].result[0].location.address;
                    var county = typeof locations.county !== 'undefined' && locations.city !== locations.county && !locations.state ? ', ' + locations.county : '';
                    var country = typeof locations.country !== 'undefined' ? ', ' + locations.country : '';
                    locationBlock = '<div class="hereMapPopupRow"><div class="hereMapPopupIcon"><img src="/dash/assets/img/mapMarker.svg"></div><div class="hereMapPopupText">' +
                            locations.city + county + (typeof locations.state !== 'undefined' && locations.country === 'USA' ? ', ' + locations.state : '') +
                            '</div></div>';
                }
                var content = '<div data-id="'+marker.trackData.truckId+'" class="truck_info_popup"><h3>Truck Info<button class="btn btn-default btn-block btn-sm pull-right pt-0" onclick="trucksMap.followTruckMarker(' + truckData.truckId + ', event)">Follow</button></h3><div class="hereMapPopupContent">' +
                        '<div class="hereMapPopupRow"><div class="hereMapPopupIcon"><img src="/dash/assets/img/truckIcon.svg"></div><div class="hereMapPopupText">' +
                        marker.trackData.truckName + '</div></div>' +
                        '<div class="hereMapPopupRow"><div class="hereMapPopupIcon"><img src="/dash/assets/img/friends-copy.svg"></div><div class="hereMapPopupText">' +
                        (typeof driverObj !== 'undefined' ? driverObj.name + ' ' + driverObj.last : '') + '</div></div>' +
                        locationBlock +
                        '</div></div>';
                var bubble = new H.ui.InfoBubble(evt.target.getPosition(), {content: content});
                bubble.driverData = driverObj;
                self.hereUi.addBubble(bubble);
            });
        }, false);
    }
    
    /**
     * Add marker to map
     * @param cameraData
     */
    this.addOneCameraLocation = function (item, dashMap = false) {
        var icon = new H.map.DomIcon(self.getCameraInfoWindowBox(item));
        var marker = new H.map.DomMarker({
            lat: item.lat,
            lng: item.lng
        }, {icon: icon});
        marker.addEventListener('tap', function (evt) {
            var locationBlock = '';
            self.removeAllBubbles();
            self.reverseGeocode(item, function (result) {
                if (typeof result.response !== 'undefined' && typeof result.response.view !== 'undefined' && result.response.view.length > 0 && typeof result.response.view[0].result[0].location.address !== 'undefined') {
                    var locations = result.response.view[0].result[0].location.address;
                    var county = typeof locations.county !== 'undefined' && locations.city !== locations.county && !locations.state ? ', ' + locations.county : '';
                    var country = typeof locations.country !== 'undefined' ? ', ' + locations.country : '';
                    locationBlock = '<div class="hereMapPopupRow"><div class="hereMapPopupIcon"><img src="/dash/assets/svg/camera/popup/location.svg"></div><div class="hereMapPopupText" style="color:#3498db">' +
                            locations.city + county + (typeof locations.state !== 'undefined' && locations.country === 'USA' ? ', ' + locations.state : '') +
                            '</div></div>';
                }
                var moveStatus = getCameraMovingStatusFromStatusId(item.moveStatus);
                var bubble = new H.ui.InfoBubble(evt.target.getPosition(), {
                    content: `<div data-id="${item.id}" class="camera_info_popup"><h3>Unit ${item.unitName.trimToLength(20)}</h3>
                        <div class="hereMapPopupContent">
                            <div class="hereMapPopupRow">
                                <div class="hereMapPopupIcon"><img src="/dash/assets/svg/camera/popup/time.svg"></div>
                                <div class="hereMapPopupText">${moment(item.lastLocTime).format(USADATETIMEFORMAT)}</div>
                            </div>
                            <div class="hereMapPopupRow">
                                <div class="hereMapPopupIcon"><img src="/dash/assets/svg/camera/popup/unit.svg"></div>
                                <div class="hereMapPopupText">${(item.unitName).trimToLength(20)}</div>
                            </div>
                            <div class="hereMapPopupRow">
                                <div class="hereMapPopupIcon"><img src="/dash/assets/svg/camera/popup/vin.svg"></div>
                                <div class="hereMapPopupText">${item.unitVin || 'No VIN number'}</div>
                            </div>
                            ${locationBlock}
                            <div class="hereMapPopupRow">
                                <div class="hereMapPopupIcon"><img src="/dash/assets/svg/camera/popup/speed.svg"></div>
                                <div class="hereMapPopupText">${km2miles(item.speed)} MPH</div>
                            </div>
                            <div class="hereMapPopupRow">
                                <div class="hereMapPopupIcon"><img src="/dash/assets/svg/camera/popup/status.svg"></div>
                                <div class="hereMapPopupText"><span class="label label-${moveStatus.statusName}">${moveStatus.statusName}</span></div>
                            </div>
                            <div class="hereMapPopupRow">
                                <div class="hereMapPopupIcon"><img src="/dash/assets/svg/camera/popup/camera.svg"></div>
                                <div class="hereMapPopupText" style="color:#3498db">${item.serialNumber}</div>
                            </div>
                        </div>
                    </div>`
                });
                self.hereUi.addBubble(bubble);
            });
        }, false);
        marker.addEventListener('pointerenter', function (evt) {
            evt.target.setZIndex(1000)
        }, false);
        marker.addEventListener('pointerleave', function (evt) {
            evt.target.setZIndex(0)
        }, false);
        marker.item = item;
        self.group.addObject(marker);
        self.hMap.addObject(self.group);
    }
    
    this.addOneCameraEventLocation = function (item, dashMap = false) {
        var icon = new H.map.DomIcon(self.getCameraEventInfoWindowBox(item));
        var marker = new H.map.DomMarker({
            lat: item.lat,
            lng: item.lng
        }, {icon: icon});
        marker.addEventListener('tap', function (evt) {
            showOneEvent(item.id)
        }, false);
        marker.addEventListener('pointerenter', function (evt) {
            evt.target.setZIndex(1000)
        }, false);
        marker.addEventListener('pointerleave', function (evt) {
            evt.target.setZIndex(0)
        }, false);
        marker.item = item;
        self.group.addObject(marker);
        self.hMap.addObject(self.group);
    }
    
    this.getCameraEventInfoWindowBox = function (item) {
        c(item);
        var imgName = '';
        if(item.eventType == 'Accelerate'){
            imgName = 'cam_acc';
        }else if(item.eventType == 'Brake'){
            imgName = 'cam_brake';
        }else if(item.eventType == 'PanicButton'){
            imgName = 'cam_panic_button';
        }else if(item.eventType == 'SevereShock' || item.eventType == 'Shock'){
            imgName = 'cam_shock';
        }else if(item.eventType == 'Speed'){
            imgName = 'cam_speed';
        }else if(item.eventType == 'Turn'){
            imgName = 'cam_turn';
        }
        return `<div class="hereOneDriverInfoWindowWrapBox" data-eventId="${item.id}" data-lat="${item.lat}" data-lng="${item.lng}"><div class="hereOneDriverInfoWindowMainBox"><div class="hereOneDriverInfoWindow">
            <div class="hereOneDriverInfoWindowImgBox">
                <img src="/dash/assets/svg/camera/dash/${imgName}.svg" alt="">
            </div>
            <div class="hereOneDriverInfoWindowNameBox">
                ${item.userName}
            </div>
            <div class="hereOneDriverInfoWindowTriangle"></div>
        </div></div></div>`;
    };
    
    this.getCameraInfoWindowBox = function (item) {
        return `<div class="hereOneDriverInfoWindowWrapBox" data-cameraid="${item.id}" data-lat="${item.lat}" data-lng="${item.lng}"><div class="hereOneDriverInfoWindowMainBox"><div class="hereOneDriverInfoWindow">
            <div class="hereOneDriverInfoWindowImgBox">
                <img src="/dash/assets/svg/camera/camera_gray.svg" alt="">
            </div>
            <div class="hereOneDriverInfoWindowNameBox">
                ${item.unitName}
            </div>
            <div class="hereOneDriverInfoStatusBox ${getCameraMovingStatusFromStatusId(item.moveStatus).classColor}"></div>
            <div class="hereOneDriverInfoWindowTriangle"></div>
        </div></div></div>`;
    };
    
    this.getOneCameraMarker = function(cameraId){
        var mark = false;
        $.each(self.group.getObjects(), function (key, marker) {
            if (typeof marker.item != 'undefined' && marker.item.id == cameraId) {
                mark = marker;
                return false;
            }
        })
        return mark;
    }
    
    this.getOneCameraEventMarker = function(eventId){
        var mark = false;
        $.each(self.group.getObjects(), function (key, marker) {
            if (typeof marker.item != 'undefined' && marker.item.id == eventId) {
                mark = marker;
                return false;
            }
        })
        return mark;
    }
    
    
    this.following = false;
    this.followTruckMarker = function (truckId, event) {
        event.stopPropagation();
        var truck = trucksMap.getTruckByTruckId(truckId);
        self.following = truck;
        self.removeAllBubbles();
    }

    this.followDriverMarker = function (driverId, event) {
        event.stopPropagation();
        var truck = trucksMap.getTruckByDriverId(driverId);
        self.following = truck;
        self.removeAllBubbles();
    }

    this.getIconByStatus = function (truckInfo) {
        var fleetTruckIcon = 'no_driver.png';
        if (truckInfo.status != null) {
            fleetTruckIcon = 'st' + truckInfo.status + '_';
            if (truckInfo.companyPosition == TYPE_DRIVER_ELD) {//eld/exempt
                if (truckInfo.aobrd == 1) {//eld/aobrd
                    fleetTruckIcon += 'aobrd_';
                } else {
                    fleetTruckIcon += 'eld_';
                }
                if (truckInfo.statusTypeId == 1) {//scanner connection
                    fleetTruckIcon += 'con';
                } else {
                    fleetTruckIcon += 'n';
                }
            } else {
                fleetTruckIcon += 'ex';
            }
            fleetTruckIcon += '.png';
        }
        return '/dash/assets/img/trucksStatuses/' + fleetTruckIcon;
    }

    /**
     * Get info of location
     * @param prox
     */
    this.reverseGeocode = function (truckData, callback) {
        var geocoder = self.platform.getGeocodingService(),
                reverseGeocodingParameters = {
                    prox: truckData.lat + ', ' + truckData.lng, //'52.5309,13.3847,150', // Berlin
                    mode: 'retrieveAddresses',
                    maxresults: '1',
                    jsonattributes: 1
                };
        geocoder.reverseGeocode(
                reverseGeocodingParameters,
                function (result) {
                    callback(result)
                },
                self.onError
                );
    }

    this.onError = function (error) {
        c(error);
    }

    /**
     * Live search Truck Name
     * @param inputValue
     */
    this.getTrucksNamesInfo = function (inputValue) {
        self.deleteGropupMarkers();
        self.selectType = 'truck';
        self.closeAllBubbles();
        var searchedElementsBox = $('#searchedElementsBox'),
                onclick = '',
                notActiveOneSelectedRowBox = '',
                trucksArr = [];

        if (inputValue !== '') {
            trucksArr = self.fleetTrucksArr
                    .filter(function (item) {
                        var truckName = item.truckName !== null ? item.truckName.toLowerCase() : '';
                        return truckName.indexOf(inputValue) !== -1;
                    })
                    .sort((a, b) => b.locationInfo.length - a.locationInfo.length)
                    .map(function (item) {
                        onclick = 'onclick="trucksMap.showSelectedMarkerByTruckId($(this).attr(\'data-truckid\'))"';
                        notActiveOneSelectedRowBox = '';
                        if (item.locationInfo.length === 0) {
                            notActiveOneSelectedRowBox = 'disabled';
                            onclick = '';
                        }
                        return `<li><span ${notActiveOneSelectedRowBox} data-truckid="${item.truckId}" ${onclick} >${(item.truckName).trimToLength(20)}</span></li>`;
                    });
        }
        if (trucksArr.length > 0) {
            searchedElementsBox.empty().append(trucksArr.slice(0, 10)).show();
        } else {
            if (inputValue !== '') {
                searchedElementsBox.empty().append('<li><span>No results found</span></li>').show();
            } else {
                searchedElementsBox.hide();
            }
            self.showLocationsMap();
        }
    };

    /**
     * Live search Driver Name
     * @param inputStr
     */
    this.getDriversNamesInfo = function (inputValue) {
        self.deleteGropupMarkers();
        self.selectType = 'driver';
        self.closeAllBubbles();
        var searchedElementsBox = $('#searchedElementsBox'),
                notActiveOneSelectedRowBox = '',
                onclick = '',
                driversArr = [];

        if (inputValue !== '') {
            driversArr = self.fleetDriversArr.filter(function (item) {
                var name = item.name !== null ? item.name.toLowerCase() : '',
                        last = item.last !== null ? item.last.toLowerCase() : '';

                return name.indexOf(inputValue) !== -1 || last.indexOf(inputValue) !== -1 || (name + ' ' + last).indexOf(inputValue) !== -1;
            })
                    .sort((a, b) => b.locationInfo.length - a.locationInfo.length)
                    .map(function (item) {
                        onclick = 'onclick="trucksMap.showSelectedInfoWindowByDriverId($(this).attr(\'data-driverid\'))"';
                        notActiveOneSelectedRowBox = '';
                        if (item.locationInfo.length < 1) {
                            notActiveOneSelectedRowBox = 'disabled';
                            onclick = '';
                        }
                        return `<li><span ${notActiveOneSelectedRowBox} data-driverid="${item.driverId}" ${onclick}>${(item.name + ' ' + item.last).trimToLength(20)}</span></li>`;
                    });
        }
        if (driversArr.length > 0) {
            searchedElementsBox.empty().append(driversArr.slice(0, 10)).show();
        } else {
            if (inputValue !== '') {
                searchedElementsBox.empty().append('<li><span>No results found</span></li>').show();
            } else {
                searchedElementsBox.hide();
            }
            self.showLocationsMap();
        }
    };

    /**
     * Show 1 point by Truck id
     * @param truckId
     */
    this.showSelectedMarkerByTruckId = function (truckId) {
        truckId = parseInt(truckId);
        $('#searchedElementsBox').hide();
        var truckData = self.fleetTrucksArr.find(x => x.truckId === truckId);
        if (truckData) {
            self.deleteGropupMarkers();
            $('#searchFleetMapTruckDrivers').val((truckData.truckName).trimToLength(40));
            self.showLocationsMap([truckData]);
        }
    };

    /**
     * Show 1 point by driver id
     * @param driverId
     */
    this.showSelectedInfoWindowByDriverId = function (driverId) {
        driverId = parseInt(driverId);
        $('#searchedElementsBox').hide();
        var driverData = self.fleetDriversArr.find(x => x.driverId === driverId);
        if (driverData) {
            self.deleteGropupMarkers();
            $('#searchFleetMapTruckDrivers').val((driverData.name + ' ' + driverData.last).trimToLength(40));
            self.showLocationsMap([driverData]);
        }
    };

    /**
     * Move marker map
     * @param params
     */
    this.updateMarkerLocation = function (params) {
        if (self.mapElement === '' || $('#' + self.mapElement).length == 0)
            return '';

        if (self.group.getObjects()) {
            self.group.getObjects().map(function (marker) {
                if ((typeof marker.trackData !== 'undefined' && marker.trackData.truckId === params.truckId) || (typeof marker.driverData !== 'undefined' && marker.driverData.driverId === params.userId)) {
                    marker.setPosition({lat: params.lat, lng: params.lng});
                    $.each(self.fleetTrucksArr, function (key, val) {
                        if (val.truckId === params.truckId) {
                            self.fleetTrucksArr[key].locationInfo[0].latitude = params.lat;
                            self.fleetTrucksArr[key].locationInfo[0].longitude = params.lng;
                        }
                    });
                    $.each(self.fleetDriversArr, function (key, val) {
                        if (val.driverId === params.userId) {
                            self.fleetDriversArr[key].locationInfo[0].latitude = params.lat;
                            self.fleetDriversArr[key].locationInfo[0].longitude = params.lng;
                        }
                    });
                }
            });
        }
    };

    /**
     * Update Marker Status
     * @param params
     */
    this.updateMarkerStatus = function (params) {
        var driverStatus = $('#fleetDtiversStatuses').val();
		if($('.driver_info_popup[data-id="'+params.userId+'"]').length > 0){//if open driver popup
			var popup = $('.driver_info_popup[data-id="'+params.userId+'"]');
			var status = self.getDriverStatus(params.status);
			popup.find('.hereOneLocationInfoBoxOneStatusBox div').attr('class', status.classColor)
			popup.find('.hereOneLocationInfoBoxOneStatusBox').closest('.hereMapPopupRow').find('.hereMapPopupText').text(status.statusName)
		}
        var data = null;
        $.each(self.fleetTrucksArr, function (key, val) {
            if (val.driverId === params.userId) {
                // Update status in array
                self.fleetTrucksArr[key].status = params.status;
                if (self.selectType == 'truck') {
                    if(driverStatus !== '' && params.status === Number(driverStatus)) {
                        data = self.fleetTrucksArr[key];
                    } else {
                        data = self.fleetTrucksArr[key];
                    }
                }
            }
        });
        $.each(self.fleetDriversArr, function (key, val) {
            if (val.driverId === params.userId) {
                // Update status in array
                self.fleetDriversArr[key].status = params.status;
                if (self.selectType == 'driver') {
                    if(driverStatus !== '' && params.status === Number(driverStatus)) {
                        data = self.fleetDriversArr[key];
                    } else {
                        data = self.fleetDriversArr[key];
                    }
                }
            }
        });

        // Remove one marker in group
        self.group.getObjects().map(function (item) {
            if (typeof item.trackData !== 'undefined' && item.trackData.driverId === params.userId) {
                self.group.removeObject(item);
            } else if (typeof item.driverData !== 'undefined' && item.driverData.driverId === params.userId && driverStatus !== '') {
                self.group.removeObject(item);
            }
        });

        // Add one marker with new status
        if (data !== null) {
            self.showLocationsMap([data], false);
        }
    }

    this.addOneDriverLocation = function (driverData, dashMap = false) {
        var icon = new H.map.DomIcon(self.getInfoWindowBox(driverData));
        var marker = new H.map.DomMarker({
            lat: driverData.locationInfo[0].latitude,
            lng: driverData.locationInfo[0].longitude
        }, {icon: icon});
        marker.addEventListener('tap', function (evt) {
            if(dashMap){
                showOneDriverLogbook(driverData.driverId);
            }else{
                var locationBlock = '';
                self.removeAllBubbles();
                self.reverseGeocode(driverData, function (result) {
                    if (typeof result.response !== 'undefined' && typeof result.response.view !== 'undefined' && result.response.view.length > 0 && typeof result.response.view[0].result[0].location.address !== 'undefined') {
                        var locations = result.response.view[0].result[0].location.address;
                        var county = typeof locations.county !== 'undefined' && locations.city !== locations.county && !locations.state ? ', ' + locations.county : '';
                        var country = typeof locations.country !== 'undefined' ? ', ' + locations.country : '';
                        locationBlock = '<div class="hereMapPopupRow"><div class="hereMapPopupIcon"><img src="/dash/assets/img/mapMarker.svg"></div><div class="hereMapPopupText">' +
                            locations.city + county + (typeof locations.state !== 'undefined' && locations.country === 'USA' ? ', ' + locations.state : '') +
                            '</div></div>';
                    }
                    var status = self.getDriverStatus(driverData.status);
                    var driverName = (driverData.name + ' ' + driverData.last).trimToLength(20);
                    var truckName = '';
                    var trailersNames = '';
                    $.each(driverData.equipment, (key, item) => {
                        if(item.truckTrailer == 0){
                            truckName = item.Name;
                        }else{ 
                            trailersNames += trailersNames == '' ? item.Name : ', '+item.Name;
                        }
                    })
                    trailersNames = trailersNames == '' ? 'No Trailers Selected' : trailersNames;
                    truckName = truckName == '' ? 'No Unit Selected' : truckName;
                    var bubble = new H.ui.InfoBubble(evt.target.getPosition(), {
                        content: `<div data-id="${driverData.driverId}" class="driver_info_popup">
                            <h3>Driver Info<button class="btn btn-default btn-block btn-sm pull-right pt-0" onclick="trucksMap.followDriverMarker(${driverData.driverId}, event)">Follow</button></h3>
                            <div class="hereMapPopupContent">
                                <div class="hereMapPopupRow">
                                    <div class="hereMapPopupIcon"><img src="/dash/assets/img/friends-copy.svg"></div>
                                    <div class="hereMapPopupText">${driverName}</div>
                                </div> 
                                ${locationBlock}
                                <div class="hereMapPopupRow">
                                    <div class="hereMapPopupIcon"><img src="/dash/assets/img/truckIcon.svg"></div>
                                    <div class="hereMapPopupText">${truckName}</div>
                                </div>
                                <div class="hereMapPopupRow">
                                    <div class="hereMapPopupIcon"><img src="/dash/assets/img/trailerIcon.svg"></div>
                                    <div class="hereMapPopupText">${trailersNames}</div>
                                </div>
                                <div class="hereMapPopupRow">
                                    <div class="hereMapPopupIcon"><div class="hereOneLocationInfoBoxOneStatusBox"><div class="${status.classColor}"></div></div></div>
                                    <div class="hereMapPopupText">${status.statusName}</div>
                                </div>
                            </div>
                        </div>`
                    });
                    self.hereUi.addBubble(bubble);
                });
            }
        }, false);
        marker.addEventListener('pointerenter', function (evt) {
            evt.target.setZIndex(1000)
        }, false);
        marker.addEventListener('pointerleave', function (evt) {
            evt.target.setZIndex(0)
        }, false);
        marker.driverData = driverData;
        self.group.addObject(marker);
        self.hMap.addObject(self.group);
    }
    this.getOneDriverMarker = function(driverId){
        var mark = false;
        $.each(self.group.getObjects(), function (key, marker) {
            if (typeof marker.driverData != 'undefined' && marker.driverData.driverId == driverId) {
                mark = marker;
                return false;
            }
        })
        return mark;
    }
    this.getInfoWindowBox = function (driver) {
        return `<div class="hereOneDriverInfoWindowWrapBox" data-driverid="${driver.driverId}" data-lat="${driver.lat}" data-lng="${driver.lng}"><div class="hereOneDriverInfoWindowMainBox"><div class="hereOneDriverInfoWindow">
            <div class="hereOneDriverInfoWindowImgBox">
                <img src="/dash/assets/img/user.svg" alt="">
            </div>
            <div class="hereOneDriverInfoWindowNameBox">
                ${(driver.name + ' ' + driver.last).trimToLength(12)}
            </div>
            <div class="hereOneDriverInfoStatusBox ${self.getDriverStatus(driver.status).classColor}" title="${self.getDriverStatus(driver.status).statusName}"></div>
            <div class="hereOneDriverInfoWindowTriangle"></div>
        </div></div></div>`;
    };

    this.getDriverStatus = function (statusId) {
        var statusName = '',
                classColor = '';

        switch (Number(statusId)) {
            case 0:
                statusName = 'On Duty';
                classColor = 'driverStatusOnDuty';
                break;
            case 1:
                statusName = 'Driving';
                classColor = 'driverStatusDriving';
                break;
            case 2:
                statusName = 'Sleeping Berth';
                classColor = 'driverStatusSleepingBerth';
                break;
            case 3:
                statusName = 'Off Duty';
                classColor = 'driverStatusOffDuty';
                break;
        }
        return {statusName, classColor};
    };

    this.showDriversByStatus = function (driver) {
        var driverStatus = $(driver).val();
        $('#searchFleetMapTruckDrivers').val('');
        $('#searchedElementsBox').hide();
        if (driverStatus === '') {
            self.showLocationsMap();
        } else {
            self.deleteGropupMarkers();
            self.hMap.setZoom(2);
            var data = [];
            if (self.selectType == 'truck') {
                for (var i = 0, len = self.fleetTrucksArr.length; i < len; i++) {
                    if (self.fleetTrucksArr[i].status === Number(driverStatus))
                        data[i] = self.fleetTrucksArr[i];
                }
            } else if (self.selectType == 'driver') {
                for (var i = 0, len = self.fleetDriversArr.length; i < len; i++) {
                    if (self.fleetDriversArr[i].status === Number(driverStatus))
                        data[i] = self.fleetDriversArr[i];
                }
            }
            self.showLocationsMap(data, true, true);
        }
    };

    // for ezsmartcam
    this.showDriversByCameraStatus = function (camera) {
        var cameraStatus = $(camera).val();
        $('#searchFleetMapTruckDrivers').val('');
        $('#searchedElementsBox').hide();
        if (cameraStatus === '') {
            self.showLocationsMap();
        } else {
            self.deleteGropupMarkers();
            self.hMap.setZoom(2);
            var data = [];

            for (var i = 0, len = self.fleetTrucksArr.length; i < len; i++) {
                if (self.fleetTrucksArr[i].cameraStatus === Number(cameraStatus))
                    data[i] = self.fleetTrucksArr[i];
            }

            self.showLocationsMap(data, true, true);
        }
    };

    //Helpers ---------
    this.deleteMarkers = function () {
        self.hMap.removeObjects(self.hMap.getObjects());
    };

    this.deleteGropupMarkers = function () {
        if (self.group.getObjects().length) {
        }
        self.group.removeObjects(self.group.getObjects());

        if (self.hMap.getObjects().length) {
            self.hMap.getObjects().map(function (object) {
                if (object['B'] === false) {
                    self.hMap.removeObject(object);
                }
            });
        }
    };

    this.closeAllBubbles = function () {
        self.hereUi.getBubbles().map(function (item) {
            item.close();
        });
    };

    this.removeAllBubbles = function () {
        self.hereUi.getBubbles().forEach(bub => self.hereUi.removeBubble(bub));
    };

    /**
     * Dynamic resize map
     */
    window.addEventListener('resize', function () {
        if ($.isFunction(self.hMap.getViewPort))
            self.hMap.getViewPort().resize();
    });
}

var trucksMap = new hereMapLocations();

function updateMarkerLocation(params) {
    if (typeof trucksMap !== 'undefined') {
        trucksMap.updateMarkerLocation(params);
    }
}

function updateMarkerStatus(params) {
    if (typeof mapLocations !== 'undefined') {
        trucksMap.updateMarkerStatus(params);
    }
}


//DRIVER HISTORY ------------------------
function driverMapLocationsHistory() {
    var self = this;
    this.platform = '';
    this.hMap = '';
    this.groupMarkers = '';
    this.hereUi = '';
    this.mapElement = '';
    this.sliderObj = null;
    this.locationsInfoArr = [];
    this.locationHistorySliderValueSec = 0;
    this.locationHistoryDataPickerValueSec = 0;
    this.timezoneOffsetSec = -new Date().getTimezoneOffset() * 60;
    this.driverTimeZone = 0;
    this.fleetTrucksArr = [];
    this.fleetDriversArr = [];

    this.setFleetTruckArr = function (fleetTracksInfo, fleetDriversInfo) {
        //delete not valid location drivers and truck
        self.fleetDriversArr = fleetDriversInfo.filter(value => value.locationInfo !== 'undefined' && (parseInt(value.locationInfo[0].latitude) > 0 || parseInt(value.locationInfo[0].longitude) > 0));
        self.fleetTrucksArr = fleetTracksInfo.filter(value => value.locationInfo !== 'undefined' && (parseInt(value.locationInfo[0].latitude) > 0 || parseInt(value.locationInfo[0].longitude) > 0));
        self.setLocationsHistorySelectInfo(self.fleetDriversArr, self.fleetTrucksArr);
    };

    /**
     * Create base map
     * @mapElement = id element init map
     * @type = 'normal', 'satellite', 'terrain'
     * @link https://developer.here.com/documentation/maps/topics/map-types.html
     */
    this.showMap = function (mapElement = '', type = 'normal') {
        if (mapElement === '' || typeof mapElement === "undefined") {
            showModal('Error', 'Not found place for map.');
            return false;
        }
        self.mapElement = mapElement;
        self.platform = new H.service.Platform({app_id: HERE_APP_ID, app_code: HERE_APP_CODE, useHTTPS: true});
        var pixelRatio = window.devicePixelRatio || 1;
        var defaultLayers = self.platform.createDefaultLayers({
            tileSize: pixelRatio === 1 ? 256 : 512,
            ppi: pixelRatio === 1 ? undefined : 320
        });

        if (type == 'satellite')
            var mapType = defaultLayers.satellite.map;
        else
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

        // create group for centering bounds
        self.groupMarkers = new H.map.Group();
        fullScreenControl(mapElement);
    };

    this.initializeControlsElements = function () {
        self.sliderObj = $('#locationHistorySearchSlider');

        $('#locationHistorySearchBox .datepicker').datepicker({
            maxDate: new Date(),
            dateFormat: 'mm-dd-yy'
        }).datepicker('setDate', new Date());

        self.sliderObj.slider({
            range: 'min',
            min: 1,
            max: 60 * 60 * 24,
            value: 1,
            create: function () {
                $('#locationHistorySearchSlider span.ui-slider-handle').append('<i id="locationHistorySearchSliderDisc" class="fa fa-bars" aria-hidden="true"></i>');
            },
            slide: (event, ui) => self.changeSlider(event, ui)
        });
    };

    this.changeSlider = function (event, ui) {
        var lastLocationDateTime = 0,
                firstLocationDateTime = 0,
                updatedSliderValSec = null,
                currentSliderValSec = ui.value;

        if (self.locationsInfoArr.length > 0) {
            lastLocationDateTime = self.getOneDaySecFromDate(self.getLastLocationInfo().dateTime);
            firstLocationDateTime = self.getOneDaySecFromDate(self.getFirstLocationInfo().dateTime);

            if (currentSliderValSec > lastLocationDateTime) {
                updatedSliderValSec = lastLocationDateTime;
            } else if (currentSliderValSec < firstLocationDateTime) {
                updatedSliderValSec = firstLocationDateTime;
            }

            if (updatedSliderValSec !== null) {
                self.locationHistorySliderValueSec = updatedSliderValSec;
                self.sliderObj.slider('value', updatedSliderValSec);
                self.updateLocationsHistoryMarkers();
                return false;
            }
        }
        self.locationHistorySliderValueSec = currentSliderValSec;
        self.updateLocationsHistoryMarkers();
    };

    this.updateLocationsHistoryMarkers = function () {
        //Remove group markers
        if (self.groupMarkers.getObjects().length > 0) {
            self.groupMarkers.removeObjects(self.groupMarkers.getObjects());
        }

        var {latitude, longitude, locInfo} = self.calculateCurDriverLocation();
        self.showOneLocInfo(locInfo);
        if (latitude !== null && longitude !== null) {
            //Add marker on time slide
            var marker = new H.map.Marker({lat: latitude, lng: longitude});
            self.groupMarkers.addObject(marker);
            self.hMap.addObject(self.groupMarkers);
        }
    };
    this.showOneLocInfo = function(locInfo){
        if(typeof locInfo.speed == 'undefined'){return 1};
        $('#locInfoBox .dateTime').text(locInfo.dateTimeUSA);
        $('#locInfoBox .location').text(locInfo.latitude + ', '+locInfo.longitude);
        $('#locInfoBox .speed').text(km2miles(locInfo.speed)+' MPH');
        $('#locInfoBox .ignitionOn').text(locInfo.ignitionOn == 0 ? 'Ignition Off' : 'Ignition On');
        $('#locInfoBox .heading').text(locInfo.heading);
        $('#locInfoBox').show();
    }
    this.setLocationsHistorySelectInfo = function (fleetDriversInfo, fleetTracksInfo) {
        var disabled = '';
        var locationHistoryDriversSelect = fleetDriversInfo.map(item => `<option value="${item.driverId}">${(item.name + ' ' + item.last).trimToLength(40)}</option>`);
        var locationHistoryTrucksSelect = fleetTracksInfo.map(function (item) {
            var disabled = typeof item.locationInfo[0].dateTime === 'undefined' || item.locationInfo[0].dateTime === null ? 'disabled' : '';
            return `<option value="${item.truckId}" ${disabled}>${(item.truckName).trimToLength(40)}</option>`;
        });

        locationHistoryDriversSelect.unshift('<option></option>');
        locationHistoryTrucksSelect.unshift('<option></option>');

        $('#locationHistorySearchDrivers').empty().append(locationHistoryDriversSelect);
        $('#locationHistorySearchTrucks').empty().append(locationHistoryTrucksSelect);
    };

    /**
     * Form action search
     */
    this.getFleetDriverLocationHistory = function () {
        var truckId = $('#locationHistorySearchTrucks').val(),
                driverId = $('#locationHistorySearchDrivers').val(),
                dateTime = $('#locationHistorySearchDate').val();
        if(randomMapRequest && typeof randomLocInit.driversArr[0].id != 'undefined'){
            getFleetDriverLocationHistory = randomLocInit.driversArr[0].id;
        }
        randomMapRequest = false;
        $('#locationHistorySearchDrivers').prop('disabled', truckId === '');
        $('#locationHistorySearchDrivers').val('');

        self.locationsInfoArr = [];
        self.deleteAllMarkers();
        if (dateTime !== '' && truckId !== '') {
            var dateFormated = dateTime.split("-");
            dateTime = (new Date(dateFormated[2], dateFormated[0] - 1, dateFormated[1]).getTime() / 1000) + self.timezoneOffsetSec;
            self.getFleetDriversWithCurrentTruckLocationHistory(truckId, driverId, dateTime);
        }
    };

    this.getFleetDriversWithCurrentTruckLocationHistory = function (truckId, driverId, dateTime) {
        AjaxController('getFleetDriversWithCurrentTruckLocationHistory', {truckId, dateTime}, dashUrl,
                function ( {data: {driversArr}}) {
                    var locationHistoryDriversSelect = driversArr.map(item => `<option value="${item.id}">${item.name} ${item.last}</option>`);
                    if (locationHistoryDriversSelect.length == 0) {
                        locationHistoryDriversSelect = '<option value="0">No Drivers this day</option>';
                    }
                    $('#locationHistorySearchDrivers').empty().append(locationHistoryDriversSelect);
                    $(`#locationHistorySearchDrivers option[value="${driverId}"]`).prop('selected', true);

                    self.getDriverLocationsHistory();
                },
                        errorBasicHandler, true
                        );
            };

    this.getDriverLocationsHistory = function () {
        var truckId = $('#locationHistorySearchTrucks').val() || '',
                driverId = $('#locationHistorySearchDrivers').val() || '',
                dateTime = $('#locationHistorySearchDate').val() || '';
        if (truckId !== '' && driverId !== '' && dateTime !== '') {
            dateTime = (newDate(dateTime).getTime() / 1000) + this.timezoneOffsetSec;
            AjaxController('getFleetDriverLocationHistory', {driverId, truckId, dateTime}, dashUrl,
                    function (result) {
                        self.driverTimeZone = result.data.timeZone + summerTime;
                        self.setDriverLocationsHistory(result.data.driverLocation);
                    },
                    errorBasicHandler, true
                    );
        }
    };

    this.setDriverLocationsHistory = function (locationsInfoArr) {
        var firstLocationDateTime = 0;
        self.locationsInfoArr = locationsInfoArr;
        var distanceBetweenTwoLocations = 0;

        if (locationsInfoArr.length > 0) {
            var firstLocation = self.locationsInfoArr.map(item => item).sort((a, b) => a.id - b.id)[0];
            //Add Icon
            var marker = new H.map.Marker({lat: firstLocation.latitude, lng: firstLocation.longitude});
            self.groupMarkers.addObject(marker);
            self.hMap.addObject(self.groupMarkers);

            firstLocationDateTime = self.getOneDaySecFromDate(self.getFirstLocationInfo().dateTime);
            var lastLocationDateTime = self.getOneDaySecFromDate(self.getLastLocationInfo().dateTime);
            var start = firstLocationDateTime / 86400 * 100;
            var width = (lastLocationDateTime - firstLocationDateTime) / 86400 * 100;
            $('#show_start_finish').remove();
            $('#locationHistorySearchSlider').append('<div id="show_start_finish" style="margin-left:' + start + '%; width:' + width + '%;"></div>');
        }

        //Set slider start position
        self.sliderObj.slider('value', firstLocationDateTime);
        self.locationHistorySliderValueSec = firstLocationDateTime;

        //Reverse dateTime timezone for compare
        var d1 = newDate($('#locationHistorySearchDate').val());
        self.locationHistoryDataPickerValueSec = newDate((d1.valueOf() - d1.getTimezoneOffset() * 60000 + (self.driverTimeZone) * 60 * 60000)).getTime() / 1000;

        routeRequestParams = {
            mode: 'fastest;car',
            representation: 'display',
            legattributes: 'li'
        };

        //Zooming of 1 point
        if (locationsInfoArr.length === 1) {
            if (self.groupMarkers.getBounds())
                self.hMap.setViewBounds(self.groupMarkers.getBounds());
        }
        //Draw lines
        else if (locationsInfoArr.length > 1) {
            locationsInfoArr.map(item => item).filter(function (item, i, arr) {
                // Marker circle
                var scgMarkup = '<svg xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns="http://www.w3.org/2000/svg" height="15.994" width="16.021" version="1.1" xmlns:cc="http://creativecommons.org/ns#" xmlns:dc="http://purl.org/dc/elements/1.1/">\n' +
                        ' <g transform="translate(22274.234,4568.4141)">\n' +
                        '  <path d="m-22257-4557.6c0,4.4183-3.582,8-8,8s-8-3.5817-8-8,3.582-8,8-8,8,3.5817,8,8z" transform="matrix(0.87469499,0.01727284,-0.01727284,0.87469499,-2869.8629,-189.29209)" stroke="#828282" stroke-dasharray="none" stroke-miterlimit="4" stroke-width="2.28846145" fill="#fff"/>\n' +
                        ' </g>\n' +
                        '</svg>';
                var dotIcon = new H.map.Icon(scgMarkup, {anchor: {x: 8, y: 8}});
                var marker = new H.map.Marker({lat: item.latitude, lng: item.longitude}, {icon: dotIcon});
                self.hMap.addObject(marker);
            });

            // Obtain routing service and create routing request parameters
            
            // calculate route
            var locationsInfoArrNew = JSON.parse(JSON.stringify(locationsInfoArr));
            if(locationsInfoArr.length > 128){
                var removeEveryNthElement = Math.ceil(locationsInfoArrNew.length / 128);
                locationsInfoArrNew = locationsInfoArrNew.filter(function(_, i) {
                    return (i + 1) % removeEveryNthElement == 0;
                });
            }
            locationsInfoArrNew.map(item => item).filter(function (item, i, arr) {
                routeRequestParams['waypoint' + i] = item.latitude + ',' + item.longitude;
            });
            var lineString = new H.geo.LineString();
            if(window.location.pathname == '/dash/maps/' && getCookie('map_show_route') === '0'){
                locationsInfoArrNew.map(item => item).filter(function (item, i, arr) {
                    lineString.pushPoint({lat: item.latitude, lng: item.longitude});
                });
                self.addPointsAndLinesOnMap(lineString)
                return 1;
            }
            var router = self.platform.getRoutingService();
            router.calculateRoute(
                routeRequestParams,
                function (response) {
                    //Static draw line
                    if (typeof response.response == 'undefined') {
                        locationsInfoArrNew.map(item => item).filter(function (item, i, arr) {
                            lineString.pushPoint({lat: item.latitude, lng: item.longitude});
                        });
                    }
                    //draw calculateRoute lines on road
                    else {
                        var route = response.response.route[0],
                                routeShape = route.shape;

                        routeShape.forEach(function (point) {
                            var parts = point.split(',');
                            lineString.pushLatLngAlt(parts[0], parts[1]);
                        });
                    }
                    self.addPointsAndLinesOnMap(lineString)
                },
                function () {
                    alert('Routing request error');
                }
            );
        }
    };
    this.addPointsAndLinesOnMap = function(lineString){
        var polyline = new H.map.Polyline(lineString, {
            style: {
                lineWidth: 8,
                strokeColor: 'rgba(93, 170, 18, 0.8)'
            },
            arrows: new mapsjs.map.ArrowStyle()
        });

        self.hMap.addObject(polyline);
        self.hMap.setViewBounds(polyline.getBounds(), true);
        self.updateLocationsHistoryMarkers()
    }
    this.getOneDaySecFromDate = function (locationDateTime) {
        var d1 = newDate(locationDateTime * 1000);
        var dateTime = newDate((d1.valueOf() + d1.getTimezoneOffset() * 60000 - (self.driverTimeZone) * 60 * 60000));
        return dateTime.getSeconds() + (dateTime.getMinutes() * 60) + (dateTime.getHours() * 60 * 60);
    };

    this.calculateCurDriverLocation = function () {
        var latitude = null,
                longitude = null;
            ig = 0;

        var targetTimeValueSec = self.locationHistoryDataPickerValueSec + self.locationHistorySliderValueSec;
        self.locationsInfoArr.some((item, i, locationsInfoArr) => {
            if (targetTimeValueSec <= item.dateTime) {
                ({latitude, longitude} = i > 0 ? locationsInfoArr[i] : locationsInfoArr[0]);
                ig = i;
                return true;
            } else if (locationsInfoArr.length - 1 === i) {
                ({latitude, longitude} = locationsInfoArr[i]);
                ig = i;
                return true;
            }
        });
        var locInfo = self.locationsInfoArr[ig];
        return {latitude, longitude, locInfo};
    };

    this.getFirstLocationInfo = function () {
        return self.locationsInfoArr.map(item => item).sort((a, b) => a.id - b.id)[0];
    };

    this.getLastLocationInfo = function () {
        return self.locationsInfoArr.map(item => item).sort((a, b) => b.id - a.id)[0];
    };

    this.deleteAllMarkers = function () {
        if (self.groupMarkers.getObjects().length)
            self.groupMarkers.removeObjects(self.groupMarkers.getObjects());

        self.deleteMarkers();
    };

    this.deleteMarkers = function () {
        self.hMap.removeObjects(self.hMap.getObjects());
    };

    /**
     * Dynamic resize map
     */
    window.addEventListener('resize', function () {
        if ($.isFunction(self.hMap.getViewPort))
            self.hMap.getViewPort().resize();
    });

    this.sendLocationFromLatLngListHandler = function (data) {
        if (typeof data.result !== 'undefined') {
            var res = data.result;
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
            $('#trucksList .coordinates[data-locsrc="' + data.lat + ',' + data.lng + '"]').text(textLocation + ' (' + data.lat + ', ' + data.lng + ')');
        }
    }
}

if (typeof driverMapHistory == 'undefined') {
    var driverMapHistory = new driverMapLocationsHistory();
}
