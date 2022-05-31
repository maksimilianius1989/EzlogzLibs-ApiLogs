let imei = null;
let broadcast = {};
let broadcastBack = {};
let camsOption = {
    'front': {
        'startPoint': null,
        'endPoint': null
    },
    'back': {
        'startPoint': null,
        'endPoint': null
    }
}
let dashCamSetting = [];
let dashCamEventSetting = [];
let recordTimer = null;
let recordTimerBack = null;
let recStream = {
    'front_view': false,
    'back_view': false
}

//Live stream
let dashCamVideoFileName = 'playlist.m3u8';
let mediaToken = null;
let mediaAddress = null;




function dashCamCard(cameraIMEI, truckName, truckId, cameraName) {
    imei = cameraIMEI;
    camsOption.truckName = truckName;
    camsOption.truckId = truckId;
    camsOption.cameraName = cameraName;

    $.ajax({
        type: "GET",
        url: `${NEW_API_BACKEND_URL}/api/camera/${imei}`,
        headers: {
            'Authorization': 'Bearer ' + token
        },
        success: getCamInfoHandler,
        error: errorRequest
    });
}

function getCamInfoHandler(response) {
    if (response == '') {
        console.log(`Error connection for camera with IMEI ${response.imei}!`);
        return false;
    }

    if (response.status == null || response.status === '') {
        response.status = 'offline';
    }

    let content = `
        <div class="dashCamCard__tabsBtn">
            <button id="loadLive" class="active" onclick="loadLive(this, '${response.status}', '${response.lat ?? ''}', '${response.lon ?? ''}', '${kmhToMph(response.speed)}')"><span class="dashCamCard__status ${response.status}-status"></span> Live stream</button>
            <button id="loadEvent" onclick="loadEvent(this)">Events</button>
            <button id="loadRecording" onclick="loadRecording(this)">Recordings</button>
            <button id="loadSetting" onclick="loadSetting(this)">Settings</button>
            <div class="dashCamCard__search">
                <input type="text" id="dashCamCard__search" oninput="findInCamModal('modal', this)" class="dashCamCard__search-input" placeholder="Search events type, notes and more...">
                <span class="dashCamCard__search-icon">
                    <i class="icon icon-ic-search"></i>
                </span>
            </div>
        </div>
        <div class="dashCamCard__content"></div>
    `;

    footerButtons = `
        <div class="save-setting">Saved</div>
        <button type="button" id="loadEventSettings" onclick="loadEventSetting(this)" class="btn btn-default"><span class="btn-icon"><img src="/dash/assets/img/dashCam/settings-primary-icon.svg" alt="settings-primary-icon"></span>Event settings</button>
        <button type="button" id="eventCalibrate" onclick="eventCalibrate(this)" class="btn btn-default">Calibrate</button>
        <button type="button" id="saveEventSettings" disabled onclick="saveEventSettings(this)" class="btn btn-default btn-primary">Save changes</button>
        <button type="button" id="saveSettings" disabled onclick="saveSetting(this)" class="btn btn-default btn-primary">Save changes</button>
        <button type="button" id="exitEventSettings" onclick="exitEventSettings(this)" class="btn btn-default">Exit event settings</button>
        <button type="button" id="closeBnt" data-dismiss="modal" class="btn btn-default">Close</button>
    `;

    showModal(`Camera name: <span>${camsOption.cameraName}</span>`, content, 'dashCamCard', 'dashCamCard__large', {footerButtons: footerButtons});

    $('#dashCamCard [data-dismiss="modal"]').attr('data-dismiss', '');
    
    $('#dashCamCard').on('click', function(e) {
        const target = e.target;

        if (recStream.front_view || recStream.back_view) {
            if (target.closest('#dashCamCard [data-dismiss=""]') || target.closest('#dashCamCard .dashCamCard__tabsBtn button')) {
                e.preventDefault(); 
                e.stopPropagation();
                if (target.closest('#dashCamCard [data-dismiss=""]')) {
                    saveUnsavedRec(true);
                    findList = document.querySelectorAll('#smartCamTable tbody tr');
                } else {
                    saveUnsavedRec();
                }
            }
        } else {
            if (target.closest('#dashCamCard [data-dismiss=""]')) {
                if (broadcast.video_id && broadcast.video_id != undefined) {
                    if (broadcast.type == 'hls') {
                        destroy_video_hls(broadcast.video_id)
                    } else if (broadcast.type == 'webrtc') {
                        destroy_video_webrtc(broadcast.video_id)
                    }
                }
            
                if (broadcastBack.video_id && broadcastBack.video_id != undefined) {
                    if (broadcastBack.type == 'hls') {
                        destroy_video_hls(broadcastBack.video_id)
                    } else if (broadcastBack.type == 'webrtc') {
                        destroy_video_webrtc(broadcastBack.video_id)
                    }
                }
                $(target).attr('data-dismiss', 'modal').click();
                findList = document.querySelectorAll('#smartCamTable tbody tr');
            }
        }
    });

    loadLive($('#loadLive'), response.status, response.lat ?? '', response.lon ?? '', kmhToMph(response.speed));
    login();
}

/* live tab */
function loadLive(tab = '', status, lat, lon, speed) {
    setActiveTableTab(tab);
    
    let camStatusInfo = '';
    let camDriverMap = '';
    let camLocationStr = '';

    if (status == 'online') {
        statusClass = 'dr';

        camStatusInfo = `
            <div class="cam-status-container">
                Recommended live stream viewing time for current camera is 30 sec per day
                <div class="info-block">
                    <span class="info-icon"><i class="icon-icons-alert-ic-violations"></i></span>
                    <div class="info-desc">
                        These guidelines are based on the 15 minutes per month rule. For flexible use of this time, we recommend that you adhere to this information.
                    </div>
                </div>
            </div>
        `;
    } else if (status == 'standby') {
        statusClass = 'on';
        camStatusInfo = `<div class="cam-status-container">Content is unavailable because the camera in standby mode</div>`;
    } else if (status == 'offline') {
        statusClass = 'off';
        camStatusInfo = `<div class="cam-status-container">Content is unavailable because the camera is off</div>`;
    } else {
        statusClass = 'off';
        camStatusInfo = `<div class="cam-status-container">Content is unavailable because the camera in error connection</div>`;
    }

    if (status != 'offline') {
        if (lat != '' && lon != '' && lat != -1 && lon != -1) {
            camLocationStr = lat + ', ' + lon;
            camDriverMap = `
                <div class="info__content-item">
                    <h4 class="map__title">Route map</h4>
                    <div class="map__content" id="cameraLiveMap"></div>
                </div>
            `;
        }
    } else {
        camDriverMap = `
            <div class="info__content-item">
                <h4 class="map__title">Route map</h4>
                <div class="map__content-mock">
                    <img src="/dash/assets/img/dashCam/live-tab-map-bg.svg" alt="map mock">
                </div>
            </div>
        `;
    }

    camDriverInfo = `
        <div class="info__content-item">
            <div class="driving-status ${statusClass}">${statusClass}</div>
            <div class="driver-info">
                <div class="item">
                    <div class="item__icon"><img src="/dash/assets/img/dashCam/Driver.svg" alt="driver icon"></div>
                    <div class="item__name">Driver name</div>
                </div>
                <div class="item">
                    <div class="item__icon"><img src="/dash/assets/img/dashCam/Truck.svg" alt="truck icon"></div>
                    <div class="item__name">${camsOption.truckName}</div>
                </div>
                <div class="item">
                    <div class="item__icon"><img src="/dash/assets/img/dashCam/Speedometer.svg" alt="speed icon"></div>
                    <div class="item__name">${Number(speed) > 0 ? Math.round(speed) : 0} mph</div>
                </div>
                ${camLocationStr != '' ?
                    `<div class="item">
                        <div class="item__icon"><img src="/dash/assets/img/dashCam/Location.svg" alt="location icon"></div>
                        <div class="item__name">${camLocationStr}</div>
                    </div>` : ''
                }
            </div>
        </div>
    `;

    content = `
        <div class="dashCamCard__cam-status-info">${camStatusInfo}</div>
        <div class="dashCamCard__videos">
            <div class="video__items">
                <div class="video__item">
                    <h4 class="video__title">Front view</h4>
                    <div class="video__block">
                        <div class="video__container front__container">
                            <video id="remoteVideoFront" muted  webkit-playsinline="true" playsinline="true" autoplay poster="/dash/assets/img/dashCam/bg-front-view.svg"></video>
                            ${status == 'online' ?
                                '<button type="button" value="Play" onclick="play_pause_broadcast(1, this)" class="play-btn"></button>' :
                                '<img class="play-btn" src="/dash/assets/img/dashCam/not_available.svg" alt="not_available icon">'
                            }
                            <div class="record-video-stream">
                                <div class="rec__btn" onclick="startRecord(1, this)">Record</div>
                                <div class="time__btn" onclick="stopRecord(1, this)">
                                    <span class="name">Rec:</span>
                                    <span class="time">00:00</span>
                                    <span class="stop"></span>
                                </div>
                                <div class="saves__btn">
                                    <span class="saves__btn-item" onclick="saveRecord(1, this, 'lq')">LQ (~ <span class="save-video-size lq-size">200 Mb</span>)</span>
                                    <span class="saves__btn-item" onclick="saveRecord(1, this, 'hq')">HQ (~ <span class="save-video-size hq-size">500 Mb</span>)</span>
                                </div>
                                <div class="trash__btn" onclick="trashRecord(1)"><span class="trash__btn-icon btn-icon"><img src="/dash/assets/img/dashCam/trash-icon.svg" alt="trash icon"></span></div>
                                <div class="saved__btn btn__notification"><span class="saved__btn-icon btn-icon"><img src="/dash/assets/img/dashCam/info-icon.svg" alt="info icon"></span> The video will be saved in the Recordings near 5 minutes</div>
                            </div>
                            <div class="stream__notifitation btn__notification"> <span class="saved__btn-icon btn-icon"><img src="/dash/assets/img/dashCam/info-icon.svg" alt="info icon"></span> Oops! Something went wrong. Press &nbsp;<span onclick="play_pause_broadcast(1, $('.video__container.front__container .play-btn'), true)" style="text-decoration: underline;">here</span>&nbsp; to reload stream</div>
                        </div>
                    </div>
                </div>
                
                <div class="video__item">
                    <h4 class="video__title">Back view</h4>
                    <div class="video__block">
                        <div class="video__container back__container">
                            <video id="remoteVideoBack" autoplay muted  webkit-playsinline="true" playsinline="true" poster="/dash/assets/img/dashCam/bg-back-view.svg"></video>
                            ${status == 'online' ?
                                '<button type="button" value="Play" onclick="play_pause_broadcast(2, this)" class="play-btn"></button>' :
                                '<img class="play-btn" src="/dash/assets/img/dashCam/not_available.svg" alt="not_available icon">'
                            }
                            <div class="record-video-stream">
                                <div class="rec__btn" onclick="startRecord(2, this)">Record</div>
                                <div class="time__btn" onclick="stopRecord(2, this)">
                                    <span class="name">Rec:</span>
                                    <span class="time">00:00</span>
                                    <span class="stop"></span>
                                </div>
                                <div class="saves__btn">
                                    <span class="saves__btn-item" onclick="saveRecord(2, this, 'lq')">LQ (~ <span class="save-video-size lq-size">200 Mb</span>)</span>
                                    <span class="saves__btn-item" onclick="saveRecord(2, this, 'hq')">HQ (~ <span class="save-video-size hq-size">500 Mb</span>)</span>
                                </div>
                                <div class="trash__btn" onclick="trashRecord(2)"><span class="trash__btn-icon btn-icon"><img src="/dash/assets/img/dashCam/trash-icon.svg" alt="trash icon"></span></div>
                                <div class="saved__btn btn__notification"><span class="saved__btn-icon btn-icon"><img src="/dash/assets/img/dashCam/info-icon.svg" alt="info icon"></span> The video will be saved in the Recordings near 5 minutes</div>
                            </div>
                            <div class="stream__notifitation btn__notification"> <span class="saved__btn-icon btn-icon"><img src="/dash/assets/img/dashCam/info-icon.svg" alt="info icon"></span> Oops! Something went wrong. Press &nbsp;<span onclick="play_pause_broadcast(2, $('.video__container.front__container .play-btn'), true)" style="text-decoration: underline;">here</span>&nbsp; to reload stream</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="dashCamCard__cam-driver-info">
            <div class="info__content">
                ${camDriverInfo}
                ${camDriverMap != '' ? camDriverMap : ''}
            </div>
        </div>
    `;

    $('.dashCamCard__content').html(content);

    if (camDriverMap != '' && status != 'offline') {
        let option = {
            center: {
                lat: lat,
                lng: lon
            },
            zoom: 15    
        }
        let liveMap = dashCamMap('cameraLiveMap', option);
        icon = new H.map.Icon('/dash/assets/img/dashCam/map-location-icon.svg');
        liveMap.hMap.addObject(new H.map.Marker({lat:`${lat}`, lng:`${lon}`}, {icon: icon}));
    }
}

function startRecord(camType, btn) {
    checkTimeRecord(camType, 'start');

    $(btn).removeClass('active');

    if (camType == 1) {
        $('.video__container.front__container .play-btn').hide();
        $('.video__container.front__container .time__btn').addClass('active');
        $('.video__container.front__container .trash__btn').addClass('active');
        recStream.front_view = true;

        let start = 0;
 
        recordTimer = setInterval(() => {
            start++;

            let timeSrt;

            if (start <= 9) {
                timeSrt = `00:0${start}`;
            } else if (start >= 10 && start <= 59) {
                timeSrt = `00:${start}`;
            } else {
                let min = Math.floor(start / 60);
                let sec = start % 60;

                if (sec < 10) {
                    timeSrt = `0${min}:0${sec}`;
                } else if (sec > 9 && sec < 60) {
                    timeSrt = `0${min}:${sec}`;
                }
            }

            $('.video__container.front__container .time__btn .time').text(timeSrt);
        }, 1000);
    } else {
        $('.video__container.back__container .play-btn').hide();
        $('.video__container.back__container .time__btn').addClass('active');
        $('.video__container.back__container .trash__btn').addClass('active');
        recStream.back_view = true;

        let startBack = 0;

        recordTimerBack = setInterval(() => {
            startBack++;

            let timeSrtBack;

            if (startBack <= 9) {
                timeSrtBack = `00:0${startBack}`;
            } else if (startBack >= 10 && startBack <= 59) {
                timeSrtBack = `00:${startBack}`;
            } else {
                let min = Math.floor(startBack / 60);
                let sec = startBack % 60;

                if (sec < 10) {
                    timeSrtBack = `0${min}:0${sec}`;
                } else if (sec > 9 && sec < 60) {
                    timeSrtBack = `0${min}:${sec}`;
                }
            }

            $('.video__container.back__container .time__btn .time').text(timeSrtBack);
        }, 1000);
    }
}

function stopRecord(camType, btn) {
    checkTimeRecord(camType, 'end');

    $(btn).removeClass('active');

    if (camType == 1) {
        $('.video__container.front__container .play-btn').show().addClass('active');
        $('.video__container.front__container .saves__btn').addClass('active');
        clearInterval(recordTimer);
        $('.video__container.front__container .time__btn .time').text('00:00');
        let duration = (Date.parse(camsOption.front.endPoint)/1000) - (Date.parse(camsOption.front.startPoint)/1000);
        $('.video__container.front__container .save-video-size.lq-size').text(calculateVideoZize(duration, 'lq'));
        $('.video__container.front__container .save-video-size.hq-size').text(calculateVideoZize(duration, 'hq'));
    } else {
        $('.video__container.back__container .play-btn').show().addClass('active');
        $('.video__container.back__container .saves__btn').addClass('active');
        clearInterval(recordTimerBack);
        $('.video__container.back__container .time__btn .time').text('00:00');
        let duration = (Date.parse(camsOption.back.endPoint)/1000) - (Date.parse(camsOption.back.startPoint)/1000);
        $('.video__container.back__container .save-video-size.lq-size').text(calculateVideoZize(duration, 'lq'));
        $('.video__container.back__container .save-video-size.hq-size').text(calculateVideoZize(duration, 'hq'));
    }

    setTimeout(function() {
        if (camType == 1) {
            $('.video__container.front__container .play-btn').removeClass('active');
        } else {
            $('.video__container.back__container .play-btn').removeClass('active');
        }
    }, 3000)
}

function checkTimeRecord(camType, type) {
    let date = new Date();
    let cameraType = camType == 1 ? 'front' : 'back';
    let timeType = type == 'start' ? 'startPoint' : 'endPoint';

    camsOption[cameraType][timeType] = moment.utc(date).format('YYYY-MM-DDTHH:mm:ss');
}

function trashRecord(camType) {
    if (camType == 1) {
        $('.video__container.front__container .play-btn').show();
        $('.video__container.front__container .record-video-stream div').removeClass('active');
        if ($('.video__container.front__container .play-btn').val() == 'Pause') {
            $('.video__container.front__container .rec__btn').addClass('active');
        }
        clearInterval(recordTimer);
        $('.video__container.front__container .time__btn .time').text('00:00');
        recStream.front_view = false;
    } else {
        $('.video__container.back__container .play-btn').show();
        $('.video__container.back__container .record-video-stream div').removeClass('active');
        if ($('.video__container.back__container .play-btn').val() == 'Pause') {   
            $('.video__container.back__container .rec__btn').addClass('active');
        }
        clearInterval(recordTimerBack);
        $('.video__container.back__container .time__btn .time').text('00:00');
        recStream.back_view = false;
    }
}

function saveRecord(camType, btn, quality) {
    let type = camType == 1 ? 'front' : 'back';
    let start = camsOption[type]['startPoint'];
    let end = camsOption[type]['endPoint'];
    let duration = getSecondsFromDateTimeString(end) - getSecondsFromDateTimeString(start);

    $(btn).parent().removeClass('active');

    if (camType == 1) {
        $('.video__container.front__container .saved__btn').fadeIn(500, function() {
            $(this).addClass('active')
        });
        $('.video__container.front__container .trash__btn').removeClass('active');
        if ($('.video__container.front__container .play-btn').val() == 'Pause') {
            $('.video__container.front__container .rec__btn').addClass('active');
        }
        recStream.front_view = false;
    } else {
        $('.video__container.back__container .saved__btn').fadeIn(500, function() {
            $(this).addClass('active')
        });
        $('.video__container.back__container .trash__btn').removeClass('active');
        if ($('.video__container.back__container .play-btn').val() == 'Pause') {
            $('.video__container.back__container .rec__btn').addClass('active');
        }
        recStream.back_view = false;
    }

    setTimeout(function() {
        if (camType == 1) {
            $('.video__container.front__container .saved__btn').fadeOut(500, function() {
                $(this).removeClass('active')
            });
        } else {
            $('.video__container.back__container .saved__btn').fadeOut(500, function() {
                $(this).removeClass('active')
            });
        }
    }, 3000)

    saveLiveRec(camType, start, duration, quality);
}

function saveUnsavedRec(dismiss = false) {
    let duration = 0;

    if (recStream.front_view) {
        checkTimeRecord(1, 'end');
        duration = (Date.parse(camsOption.front.endPoint)/1000) - (Date.parse(camsOption.front.startPoint)/1000);
    } 
    
    if (recStream.back_view) {
        checkTimeRecord(2, 'end');
        duration = (Date.parse(camsOption.back.endPoint)/1000) - (Date.parse(camsOption.back.startPoint)/1000);
    }

    let camTypeText = '';

    if (recStream.front_view && !recStream.back_view) {
        camTypeText = 'Front';
    } else if (!recStream.front_view && recStream.back_view) {
        camTypeText = 'Back';
    } else if (recStream.front_view && recStream.back_view) {
        camTypeText = 'Front and Back';
    }

    let content = `
        <div class="downloadRec-popup">
            <div class="downloadRec-bg">
                <div class="downloadRec-content">
                    <!--<div class="download-close" onclick="document.querySelector('.downloadRec-popup').remove();">
                        <button type="button" class="close" aria-label="Close"><span aria-hidden="true">×</span></button>
                    </div>-->
                    <div class="download-title">Attention</div>
                    <div class="download-text">You have unsaved record from ${camTypeText} view camera</div>
                    <div class="download-text">Choose quality to save or discard</div>
                    <div class="download-btns">
                        <div class="btns-item btn btn-primary-new" onclick="saveClosedRec('lq', ${dismiss})">Save LQ &nbsp;<span>(~${calculateVideoZize(duration, 'lq')})</span></div>
                        <div class="btns-item btn btn-primary-new" onclick="saveClosedRec('hq', ${dismiss})">Save HQ &nbsp;<span>(~${calculateVideoZize(duration, 'hq')})</span></div>
                        <div class="btns-item btn btn-default" onclick="discardRec(${dismiss})">Discard</div>
                    </div>
                </div>
            </div>
        </div>
    `;

    $('.dash_wrap .content').append(content);
}

function calculateVideoZize(duration, quality) {
    let size = quality == 'lq' ? (duration * 52) : (duration * 52 * 60);

    if (size < 1000) {
        return `${size} Kb`;
    } else if (size >= 1000 && size < 1000000) {
        return `${(size / 1000).toFixed(2)} Mb`;
    } else if (size >= 1000000) {
        return `${(size / 1000000).toFixed(2)} Gb`;
    }
}

function discardRec(discard) {
    recStream.front_view = false;
    recStream.back_view = false;

    if ($('.video__container.front__container .play-btn').val() == 'Pause') {
        play_pause_broadcast(1, $('.video__container.front__container .play-btn'));
    }
    if ($('.video__container.back__container .play-btn').val() == 'Pause') {
        play_pause_broadcast(2, $('.video__container.back__container .play-btn'));
    }

    if (discard) {
        $('.downloadRec-popup').remove();
        $('#dashCamCard [data-dismiss]').attr('data-dismiss', 'modal').click();
    } else {
        $('.downloadRec-popup').remove();
    }
}

function saveClosedRec(quality, discard = false) {
    if (recStream.front_view) {
        let start = camsOption['front']['startPoint'];
        let end = camsOption['front']['endPoint'];
        let duration = getSecondsFromDateTimeString(end) - getSecondsFromDateTimeString(start);

        saveLiveRec('1', start, duration, quality);
    }

    if (recStream.back_view) {
        let start = camsOption['back']['startPoint'];
        let end = camsOption['back']['endPoint'];
        let duration = getSecondsFromDateTimeString(end) - getSecondsFromDateTimeString(start);

        saveLiveRec('2', start, duration, quality);
    }

    discardRec(discard);
}

function saveLiveRec(camType, start, duration, quality) {
    $.ajax({
        type: "POST",
        url: `${NEW_API_BACKEND_URL}/api/camera/${imei}/record`,
        headers: {
            'Authorization': 'Bearer ' + token
        },
        data: {
            cameraId: camType,
            dateStart: start,
            duration: duration,
            qualityLevel: quality
        },
        success: function (data) {
            console.log(data);
        },
        error: errorRequest
    });
}

/* event tab */
function loadEvent(tab = '', filter = false) {
    setActiveTableTab(tab);
    $(".dashCamCard__content").html(`<center class="dashCamCard__content-notification"><img class="loading" src="/dash/assets/img/loading.gif"/> Loading events, please wait..</center>`);
    $('.dashCamCard__search').show();

    if (filter) {
        $(".dashCamCard__content").html(`
            <div class="scroll-cam-table">
                <table id="dashCamTable" class="table table-striped table-dashboard table-hover table-sm mobile_table tablesorter">
                    <thead>
                        <tr>
                            <th></th>
                            <th class="sort-icon" onclick="sortInCamModal(event, this, 'date')" data-sort-type='asc'>Date/Time</th>
                            <th class="sort-icon" onclick="sortInCamModal(event, this)" data-sort-type='asc'>Event</th>
                            <th>Camera type</th>
                            <th>Intensity</th>
                            <th>Duration</th>
                            <th>Location</th>
                            <!--<th>Notes</th>-->
                        </tr>
                    </thead>
                    <tbody>
                        
                    </tbody>
                </table>
            </div>
        `);

        scrollbarInit(`#dashCamCard .modal-body .scroll-cam-table`);
        $('#loadEventSettings').show();

        findInCamModal('modal', document.querySelector('#dashCamCard #dashCamCard__search'));
    } else {
        let dateEnd = moment.utc(new Date).format('YYYY-MM-DDTHH:mm:ss');
        let dateStart = moment.utc(dateEnd).subtract(1, 'month').format('YYYY-MM-DDTHH:mm:ss'); 

        $.ajax({
            type: "GET",
            url: `${NEW_API_BACKEND_URL}/api/camera/${imei}/events`,
            data: {dateStart: dateStart, dateEnd: dateEnd},
            headers: {
                'Authorization': 'Bearer ' + token
            },
            success: function(data) {
                if (data.length > 0) {
                    let cameraEvents = ``;
                    
                    for (let item of data) {
                        let speedStr = item.speed !== null ? Math.round(item.speed) : 0;
                        let eventTypeStr = eventTypeToStr(item.eventType);
                        let loc = '';

                        if (item.lat != null && item.lon != null && item.lat != -1 && item.lon != -1) {
                            loc = item.lat + ', ' + item.lon;
                        }

                        if (item.files.length > 0) {
                            item.files.forEach(file => {
                                let camTypeStr = file.cameraId == 1 ? "Front view (road)" : "Back view (driver)";

                                cameraEvents += `
                                    <tr data-file-id="${file.fileId}" data-camera-id="${file.cameraId}" data-file-type="${file.fileType}" data-event-type="${eventTypeStr}" data-loc="${loc}" data-speed="${speedStr}" data-time="${item.time}" onclick="eventFile(this, true)">
                                        <td class="table-eye"></td>
                                        <td data-sort="${item.time}">${moment(item.time).format('ddd, MMM D h:mm:ss A')}</td>
                                        <td>${eventTypeStr}</td>
                                        <td>${camTypeStr}</td>
                                        <td>${kmhToMph(speedStr)} mph</td>
                                        <td>${file.fileType == 'video' ? '10 sec' : ''}</td>
                                        <td>${loc}</td>
                                        <!--<td></td>-->
                                    </tr>
                                `;
                            })
                        } else {
                            cameraEvents += `
                                <tr>
                                    <td class="table-eye not-eye"></td>
                                    <td data-sort="${item.time}">${moment(item.time).format('ddd, MMM D h:mm:ss A')}</td>
                                    <td>${eventTypeStr}</td>
                                    <td></td>
                                    <td>${kmhToMph(speedStr)} mph</td>
                                    <td></td>
                                    <td>${loc}</td>
                                    <!--<td></td>-->
                                </tr>
                            `;
                        }
                    }

                    $(".dashCamCard__content").html(`
                        <div class="scroll-cam-table">
                            <table id="dashCamTable" class="table table-striped table-dashboard table-hover table-sm mobile_table tablesorter">
                                <thead>
                                    <tr>
                                        <th></th>
                                        <th class="sort-icon" onclick="sortInCamModal(event, this, 'date')" data-sort-type='asc'>Date/Time</th>
                                        <th class="sort-icon" onclick="sortInCamModal(event, this)" data-sort-type='asc'>Event</th>
                                        <th>Camera type</th>
                                        <th>Intensity</th>
                                        <th>Duration</th>
                                        <th>Location</th>
                                        <!--<th>Notes</th>-->
                                    </tr>
                                </thead>
                                <tbody>
                                    ${cameraEvents}
                                </tbody>
                            </table>
                        </div>
                    `);
                    $('#loadEventSettings').show();

                    findList = document.querySelectorAll('#dashCamTable tbody tr');
                } else {
                    $(".dashCamCard__content").html(`<center class="dashCamCard__content-notification">No data found</center>`);
                }

                scrollbarInit(`#dashCamCard .modal-body .scroll-cam-table`);
            }, 
            error: errorRequest
        })
    }
}

function eventFile(el, file = false) {
    $('#loadEventSettings').hide();
    $(".dashCamCard__content").html(`<center class="dashCamCard__content-notification"><img class="loading" src="/dash/assets/img/loading.gif"/> Loading event details, please wait..</center>`);
    $('.dashCamCard__search').hide();
    let fileContentBox = '';

    if (file) {
        let fileId = el.getAttribute('data-file-id');
        let cameraId = el.getAttribute('data-camera-id');
        let fileType = el.getAttribute('data-file-type');
        let time = el.getAttribute('data-time');
        let speed = el.getAttribute('data-speed');
        let loc = el.getAttribute('data-loc');
        let eventType = el.getAttribute('data-event-type');

        $.ajax({
            type: "POST",
            url: `${NEW_API_BACKEND_URL}/api/camera/${imei}/events/file`,
            data: {fileId: fileId, cameraId: cameraId, fileType: fileType},
            headers: {
                'Authorization': 'Bearer ' + token
            },
            success: function (data) {
                if (data != '') {
                    let file = '';
                    let eventMap = '';
                    let fileUrl = data.url;

                    if (fileType == 'video') {
                        file = `<video muted  webkit-playsinline="true" playsinline="true" controls="controls" src="${fileUrl}"></video>`;
                    } else if (fileType == 'snapshot') {
                        file = `<img src="${fileUrl}" alt="event snapshot">`;
                    }

                    if (loc != '') {
                        eventMap = `
                            <div class="fileContent__content-item fileContent__map">
                                <div class="detail__title">Map of incident</div>
                                <div class="eventFile__map">
                                    <div id="cameraEventMap" style="width: 100%; height: 100%; border-radius: 4px; border: 1px solid #ccc;"></div>
                                </div>
                                <div class="eventFile__map-link eventFile__link">View location history</div>
                            </div>
                        `;
                    }

                    fileContentBox = `
                        <div class="fileContent__content-item fileContent__file">
                        <div class="detail__title">${fileType == 'video' ? 'Video' : 'Snapshot'}</div>
                            <div class="fileContent__video">
                                <div class="eventFile__video">
                                    ${file}
                                </div>
                            </div>
                            <div class="fileContent__chart">
                                <div class="eventFile__chart">
                                    <img src="/dash/assets/img/dashCam/chart_mock.png" alt="chart">
                                </div>
                            </div>
                        </div>
                        ${eventMap}
                    `;

                    let content = `
                        <div class="fileContent">
                            <div class="fileContent__back">
                                <div class="backToList" onclick="loadEvent($('#loadEvent'), true)">
                                    <i class="icon icon-arrow-left"></i>
                                    <span>Back to list</span>
                                </div>
                            </div>
                            <div class="fileContent__container">
                                <div class="fileContent__head">
                                    <div class="fileContent__title">${eventType}</div>
                                    <div class="fileContent__date">${moment(time).format('ddd, D MMM h:mm:ss A')}</div>
                                    <!--<div class="fileContent__notes">
                                        <div class="eventFile__btn">
                                            <i class="icon icon-ic-plus"></i>
                                            <span>Notes</span>    
                                        </div>
                                    </div>-->
                                </div>
                                <div class="fileContent__content">
                                    <div class="fileContent__content-item fileContent__detail">
                                        <div class="detail__title">Details:</div>
                                        <div class="detail__content">
                                            <div class="item">
                                                <div class="item-name">Driver:</div>
                                                <div class="item-value eventFile__link">Driver name</div>
                                            </div>
                                            <div class="item">
                                                <div class="item-name">Truck:</div>
                                                <div class="item-value eventFile__link" onclick="getOneTruckInfo(this, event);" data-id="${camsOption.truckId}">${camsOption.truckName}</div>
                                            </div>
                                            <div class="item">
                                                <div class="item-name">Company:</div>
                                                <div class="item-value eventFile__link">Fleet name</div>
                                            </div>
                                            ${loc !== '' ? 
                                            `<div class="item">
                                                    <div class="item-name">Location:</div>
                                                    <div class="item-value">${loc}</div>
                                            </div>` : ''}
                                            ${speed != '' ? 
                                            `<div class="item">
                                                    <div class="item-name">Speed:</div>
                                                    <div class="item-value">${kmhToMph(speed)} mph</div>
                                            </div>` : ''}
                                            ${fileType == 'video' ? 
                                            `<div class="item">
                                                <div class="item-name">Duration:</div>
                                                <div class="item-value">10 sec</div>
                                            </div>` : ''}
                                        </div>
                                    </div>
                                    ${fileContentBox}
                                </div>
                            </div>
                        </div>
                    `;

                    $(".dashCamCard__content").html(`${content}`);

                    if (loc != '') {
                        let location = loc.split(',');
                        let option = {
                            center: {
                                lat: location[0].trim(),
                                lng: location[1].trim()
                            },
                            zoom: 15    
                        }

                        let eventMap = dashCamMap('cameraEventMap', option);
                        icon = new H.map.Icon('/dash/assets/img/dashCam/event-map-location-icon.svg');
                        eventMap.hMap.addObject(new H.map.Marker({lat:`${location[0].trim()}`, lng:`${location[1].trim()}`}, {icon: icon}));
                    }
                } else {
                    $(".dashCamCard__content").html(`<center class="dashCamCard__content-notification">Data not found!</center>`);
                }
            },
            error: errorRequest
        });
    }
}

function loadEventSetting(btn) {
    setActiveTableTab($('#loadEvent'));
    $(".dashCamCard__content").html(`<center class="dashCamCard__content-notification"><img class="loading" src="/dash/assets/img/loading.gif"/> Loading event settings, please wait..</center>`);

    $.ajax({
        type: "GET",
        url: `${NEW_API_BACKEND_URL}/api/camera/${imei}/events/settings`,
        headers: {
            'Authorization': 'Bearer ' + token
        },
        success: function (data) {     
            let eventsSettingDefault = {
                'vehicleType': {
                    dataType: 'off',
                    eventType: 'vehicleType',
                    nameStr: 'Vehicle type',
                    speedLimit: '',
                    index: '0',
                },
                'button': {
                    dataType: 'off',
                    eventType: 'button',
                    nameStr: 'Button Pressed',
                    speedLimit: '',
                    index: '1',
                },
                'cellPhoneUse': {
                    dataType: 'off',
                    eventType: 'cellPhoneUse',
                    nameStr: 'Cell Phone Use',
                    speedLimit: '',
                    index: '2',
                },
                'acceleration': {
                    dataType: 'off',
                    eventType: 'acceleration',
                    nameStr: 'Acceleration',
                    speedLimit: '',
                    index: '3',
                },
                'smoking': {
                    dataType: 'off',
                    eventType: 'smoking',
                    nameStr: 'Smoking',
                    speedLimit: '',
                    index: '4',
                },
                'deceleration': {
                    dataType: 'off',
                    eventType: 'deceleration',
                    nameStr: 'De-Acceleration',
                    speedLimit: '',
                    index: '5',
                },
                'distractedDriving': {
                    dataType: 'off',
                    eventType: 'distractedDriving',
                    nameStr: 'Distracted Driving',
                    speedLimit: '',
                    index: '6',
                },
                'sharpTurnLeft': {
                    dataType: 'off',
                    eventType: 'sharpTurnLeft',
                    nameStr: 'Violent Left Turn',
                    speedLimit: '',
                    index: '7',
                },
                'coverOpened': {
                    dataType: 'off',
                    eventType: 'coverOpened',
                    nameStr: 'Tamper',
                    speedLimit: '',
                    index: '8',
                },
                'sharpTurnRight': {
                    dataType: 'off',
                    eventType: 'sharpTurnRight',
                    nameStr: 'Violent Right Turn',
                    speedLimit: '',
                    index: '9',
                },
                'foodDrink': {
                    dataType: 'off',
                    eventType: 'foodDrink',
                    nameStr: 'Food and Drink',
                    speedLimit: '',
                    index: '10',
                },
                'jolt': {
                    dataType: 'off',
                    eventType: 'jolt',
                    nameStr: 'Vibration',
                    speedLimit: '',
                    index: '11',
                },
                'driverUnbelted': {
                    dataType: 'off',
                    eventType: 'driverUnbelted',
                    nameStr: 'Driver Unbelted',
                    speedLimit: '',
                    index: '12',
                },
                'powerDisconnectAlarm': {
                    dataType: 'off',
                    eventType: 'powerDisconnectAlarm',
                    nameStr: 'Power Disconnect',
                    speedLimit: '',
                    index: '13',
                },
                'speedLimit': {
                    dataType: 'off',
                    eventType: 'speedLimit',
                    nameStr: 'Speed Limit',
                    speedLimit: '0',
                    index: '14',
                },
                'geoFence': {
                    dataType: 'off',
                    eventType: 'geoFence',
                    nameStr: 'Fence',
                    speedLimit: '',
                    index: '15',
                },
                'accOn': {
                    dataType: 'off',
                    eventType: 'accOn',
                    nameStr: 'Power On',
                    speedLimit: '',
                    index: '16',
                },
                'accOff': {
                    dataType: 'off',
                    eventType: 'accOff',
                    nameStr: 'Power Off',
                    speedLimit: '',
                    index: '17',
                }
            };
            let eventStatusStr = {
                'none': 'Event only',
                'snapshot': 'Snapshot',
                'video': 'Video',
                'off': 'Off'
            };
            let arrEventsSettingDefault = [];
            let itemContentLeft = '';
            let itemContentRight = '';

            if (data != '' && data.events.length > 0) {
                data.events.map(event => {
                    if (eventsSettingDefault[event.eventType] !== undefined
                        && typeof eventsSettingDefault[event.eventType]['dataType'] != 'undefined') {
                        eventsSettingDefault[event.eventType]['dataType'] = event.dataType;
                    }
    
                    if (event.speedLimit !== undefined) {
                        eventsSettingDefault[event.eventType].speedLimit = event.speedLimit;
                    }
                });
            }

            eventsSettingDefault['vehicleType'].dataType = data.vehicleType;

            arrEventsSettingDefault = Object.values(eventsSettingDefault);

            arrEventsSettingDefault.map((item, index) => {
                if (index !== 0 && index < 13) {
                    itemContentLeft += `
                        <div class="item item-select">
                            <div class="item-title">
                                <span>${item.nameStr}</span>
                            </div>
                            <div class="item-icon" onclick="showEventAlertNotification('${item.eventType}', '${item.nameStr}')">
                                <img src="/dash/assets/img/dashCam/mail-settings-primary.svg" alt="mail-settings-primary">
                            </div>
                            <div class="item-custom-select select__container">
                                <div id="${item.eventType}" class="select__selected" data-value="${item.dataType}" onclick="showOptionsCustomSelect(this)">${eventStatusStr[item.dataType]}</div>
                                <div class="select__content">
                                    <div class="select__option ${item.dataType == 'off' ? 'active' : ''}" data-value="off" onclick="selectOptionsCustomSelect(this);checkEventSetting(true)">Off</div>
                                    <div class="select__option ${item.dataType == 'none' ? 'active' : ''}" data-value="none" onclick="selectOptionsCustomSelect(this);checkEventSetting(true)">Event only</div>
                                    <div class="select__option ${item.dataType == 'snapshot' ? 'active' : ''}" data-value="snapshot" onclick="selectOptionsCustomSelect(this);checkEventSetting(true)">Snapshot</div>
                                    <div class="select__option ${item.dataType == 'video' ? 'active' : ''}" data-value="video" onclick="selectOptionsCustomSelect(this);checkEventSetting(true)">Video</div>
                                </div>
                            </div>
                        </div>
                    `;
                }
            });

            itemContentRight += `
                <div class="item item-select">
                    <div class="item-title">
                        <span>${eventsSettingDefault['powerDisconnectAlarm'].nameStr}</span>
                    </div>
                    <div class="item-icon" onclick="showEventAlertNotification('${eventsSettingDefault['powerDisconnectAlarm'].eventType}', '${eventsSettingDefault['powerDisconnectAlarm'].nameStr}')">
                        <img src="/dash/assets/img/dashCam/mail-settings-primary.svg" alt="mail-settings-primary">
                    </div>
                    <div class="item-custom-select select__container">
                        <div id="${eventsSettingDefault['powerDisconnectAlarm'].eventType}" class="select__selected" data-value="${eventsSettingDefault['powerDisconnectAlarm'].dataType}" onclick="showOptionsCustomSelect(this)">${eventStatusStr[eventsSettingDefault['powerDisconnectAlarm'].dataType]}</div>
                        <div class="select__content">
                            <div class="select__option ${eventsSettingDefault['powerDisconnectAlarm'].dataType == 'off' ? 'active' : ''}" data-value="off" onclick="selectOptionsCustomSelect(this); checkEventSetting(true)">Off</div>
                            <div class="select__option ${eventsSettingDefault['powerDisconnectAlarm'].dataType == 'none' ? 'active' : ''}" data-value="none" onclick="selectOptionsCustomSelect(this); checkEventSetting(true)">Event only</div>
                            <div class="select__option ${eventsSettingDefault['powerDisconnectAlarm'].dataType == 'snapshot' ? 'active' : ''}" data-value="snapshot" onclick="selectOptionsCustomSelect(this); checkEventSetting(true)">Snapshot</div>
                            <div class="select__option ${eventsSettingDefault['powerDisconnectAlarm'].dataType == 'video' ? 'active' : ''}" data-value="video" onclick="selectOptionsCustomSelect(this); checkEventSetting(true)">Video</div>
                        </div>
                    </div>
                </div>
                <div class="item item-head">
                    <div class="item-title">
                        <span>Only email alarms notification</span>
                    </div>
                </div>
                <div class="item item-select">
                    <div class="item-title">
                        <span>${eventsSettingDefault['speedLimit'].nameStr}</span>
                    </div>
                    <div class="item-icon" onclick="showEventAlertNotification('${eventsSettingDefault['speedLimit'].eventType}', '${eventsSettingDefault['speedLimit'].nameStr}')">
                        <img src="/dash/assets/img/dashCam/mail-settings-primary.svg" alt="mail-settings-primary">
                    </div>
                    <div class="item-custom-select select__container">
                        <div id="${eventsSettingDefault['speedLimit'].eventType}" class="select__selected" data-value="${eventsSettingDefault['speedLimit'].dataType}" onclick="showOptionsCustomSelect(this)">${eventStatusStr[eventsSettingDefault['speedLimit'].dataType]}</div>
                        <div class="select__content">
                            <div class="select__option ${eventsSettingDefault['speedLimit'].dataType == 'off' ? 'active' : ''}" data-value="off" onclick="selectOptionsCustomSelect(this); checkEventSetting(true)">Off</div>
                            <div class="select__option ${eventsSettingDefault['speedLimit'].dataType == 'none' ? 'active' : ''}" data-value="none" onclick="selectOptionsCustomSelect(this); checkEventSetting(true)">Event only</div>
                        </div>
                    </div>
                </div>
                <div class="item item-input item-full">
                    <input type="number" min="0" ${eventsSettingDefault['speedLimit'].dataType == 'off' ? 'disabled' : ''} id="speedLimitValue" placeholder="Insert speed limit - mph" value="${Math.round(kmhToMph(eventsSettingDefault['speedLimit'].speedLimit))}" onkeyup="checkEventSetting(true)" onchange="checkEventSetting(true)">
                </div>
                <!--<div class="item item-notification">
                    <div class="item-title">
                        <span>${eventsSettingDefault['geoFence'].nameStr}</span>
                    </div>
                    <div class="item-icon" onclick="showEventAlertNotification('${eventsSettingDefault['geoFence'].eventType}', '${eventsSettingDefault['geoFence'].nameStr}')">
                        <img src="/dash/assets/img/dashCam/mail-settings-primary.svg" alt="mail-settings-primary">
                    </div>
                </div>
                <div class="item item-notification">
                    <div class="item-title">
                        <span>${eventsSettingDefault['accOn'].nameStr}</span>
                    </div>
                    <div class="item-icon" onclick="showEventAlertNotification('${eventsSettingDefault['accOn'].eventType}', '${eventsSettingDefault['accOn'].nameStr}')">
                        <img src="/dash/assets/img/dashCam/mail-settings-primary.svg" alt="mail-settings-primary">
                    </div>
                </div>
                <div class="item item-notification">
                    <div class="item-title">
                        <span>${eventsSettingDefault['accOff'].nameStr}</span>
                    </div>
                    <div class="item-icon" onclick="showEventAlertNotification('${eventsSettingDefault['accOff'].eventType}', '${eventsSettingDefault['accOff'].nameStr}')">
                        <img src="/dash/assets/img/dashCam/mail-settings-primary.svg" alt="mail-settings-primary">
                    </div>
                </div>-->
            `;

            let content = `
                <div class="eventSetting__content">
                    <div class="eventSetting__content-item">
                        <div class="item__title">Event settings</div>
                    </div>
                    <div class="eventSetting__content-item">
                        <div class="item item-radio">
                            <div class="item-title">
                                <span>${eventsSettingDefault.vehicleType.nameStr}</span>
                            </div>
                            <div class="item-content radio__container">
                                <div class="item-box">
                                    <input type="radio" onchange="checkEventSetting(true)" ${eventsSettingDefault.vehicleType.dataType == 'Private' ? 'checked' : ''} value="Private" name="vehicleType" id="vehiclePrivate">
                                    <label for="vehiclePrivate">Private</label>
                                </div>
                                <div class="item-box">
                                    <input type="radio" onchange="checkEventSetting(true)" ${eventsSettingDefault.vehicleType.dataType == 'Trailer' ? 'checked' : ''} value="Trailer" name="vehicleType" id="vehicleTrailer">
                                    <label for="vehicleTrailer">Trailer</label>
                                </div>
                                <div class="item-box">
                                    <input type="radio" onchange="checkEventSetting(true)" ${eventsSettingDefault.vehicleType.dataType == 'Van' ? 'checked' : ''} value="Van" name="vehicleType" id="vehicleVan">
                                    <label for="vehicleVan">Van</label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="eventSetting__content-item">
                        <div class="item-column left-column">
                            ${itemContentLeft}
                        </div>
                        <div class="item-column right-column">
                            ${itemContentRight}
                        </div>
                    </div>
                </div>
            `;

            $(".dashCamCard__content").html(content);
            // $('#eventCalibrate').show();
            $('#saveEventSettings').show();
            $('#exitEventSettings').show();
            $('#closeBnt').hide();

            scrollbarInit(`#dashCamCard .select__container .select__content`);

            dashCamEventSetting = checkEventSetting();
            checkEventSetting(true);
        },
        error: errorRequest
    });
}

function checkEventSetting(check = false, save = false) {
    let vehicleType = $('input[name="vehicleType"]:checked').val();
    let button = $('#button').attr('data-value');
    let cellPhoneUse = $('#cellPhoneUse').attr('data-value');
    let acceleration = $('#acceleration').attr('data-value');
    let smoking = $('#smoking').attr('data-value');
    let deceleration = $('#deceleration').attr('data-value');
    let distractedDriving = $('#distractedDriving').attr('data-value');
    let sharpTurnLeft = $('#sharpTurnLeft').attr('data-value');
    let coverOpened = $('#coverOpened').attr('data-value');
    let sharpTurnRight = $('#sharpTurnRight').attr('data-value');
    let foodDrink = $('#foodDrink').attr('data-value');
    let jolt = $('#jolt').attr('data-value');
    let driverUnbelted = $('#driverUnbelted').attr('data-value');
    let powerDisconnectAlarm = $('#powerDisconnectAlarm').attr('data-value');
    let speedLimit = $('#speedLimit').attr('data-value');
    let speedLimitValue = $('#speedLimitValue').val();

    let checkEventSetting = [
        {
            'dataType': vehicleType,
            'eventType': 'vehicleType'
        }, 
        {
            'dataType': button,
            'eventType': 'button'
        }, 
        {
            'dataType': cellPhoneUse,
            'eventType': 'cellPhoneUse'
        }, 
        {
            'dataType': acceleration,
            'eventType': 'acceleration'
        }, 
        {
            'dataType': smoking,
            'eventType': 'smoking'
        }, 
        {
            'dataType': deceleration,
            'eventType': 'deceleration'
        }, 
        {
            'dataType': distractedDriving,
            'eventType': 'distractedDriving'
        }, 
        {
            'dataType': sharpTurnLeft,
            'eventType': 'sharpTurnLeft'
        }, 
        {
            'dataType': sharpTurnLeft,
            'eventType': 'sharpTurnLeft'
        }, 
        {
            'dataType': coverOpened,
            'eventType': 'coverOpened'
        }, 
        {
            'dataType': sharpTurnRight,
            'eventType': 'sharpTurnRight'
        }, 
        {
            'dataType': foodDrink,
            'eventType': 'foodDrink'
        }, 
        {
            'dataType': jolt,
            'eventType': 'jolt'
        }, 
        {
            'dataType': driverUnbelted,
            'eventType': 'driverUnbelted'
        }, 
        {
            'dataType': powerDisconnectAlarm,
            'eventType': 'powerDisconnectAlarm'
        },
        {
            'dataType': speedLimit,
            'eventType': 'speedLimit',
            'speedLimit': Math.round(speedLimitValue * 1.609)     // 1.609 коэфициент для перевода mph в kmh
        },
        {
            'dataType': 'none',
            'eventType': 'geoFence'
        },
    ];

    if (speedLimit == 'none') {
        $('#speedLimitValue').prop('disabled', false);
    } else {
        $('#speedLimitValue').prop('disabled', true);
    }

    if (save) {
        let data = {
            "vehicleType": vehicleType,
            "events": []
        }

        checkEventSetting.map((event, index) => {
            if (index != 0) {
                if (event.dataType !== 'off') {
                    data.events.push(event);
                }
            }
        });

        return data;
    }

    let isError = false;

    if(!check) {
        return checkEventSetting;
    } else {
        if(dashCamEventSetting.length != checkEventSetting.length) {
            return false;
        }

        for(i = 0; i < dashCamEventSetting.length; i++) {
            if(dashCamEventSetting[i].dataType != checkEventSetting[i].dataType) {
                isError = true;
                $('#saveEventSettings').attr('disabled', null);
            }

            if (dashCamEventSetting[i].eventType == 'speedLimit') {
                if (dashCamEventSetting[i].speedLimit != checkEventSetting[i].speedLimit) {
                    isError = true;
                    $('#saveEventSettings').attr('disabled', null);
                }
            }
        }

        if (!isError) {
            $('#saveEventSettings').attr('disabled', 'disabled');
            return true;
        } else {
            return false;
        }
    }
}

function saveEventSettings(btn) {
    let settingArray = checkEventSetting(false, true);

    $.ajax({
        type: "PUT",
        url: `${NEW_API_BACKEND_URL}/api/camera/${imei}/events/settings`,
        headers: {
            'Authorization': 'Bearer ' + token
        },
        data: settingArray,
        success: function (data, status, res) {
            if (res.status == 200) {
                $('.save-setting').addClass('active').text('Saved');
                dashCamEventSetting = checkEventSetting();
                checkEventSetting(true);

                if (btn.getAttribute('id') != 'saveEventSettings') {
                    $('.downloadRec-popup').remove();
                    loadEvent($('#loadEvent'));
                }
            } else {
                $('.save-setting').addClass('error').text(res.responseJSON.message);

                if (btn.getAttribute('id') != 'saveEventSettings') {
                    $('.downloadRec-popup').remove();
                }
            }

            setTimeout(() => {
                $('.save-setting').removeClass('active error').text('');
            }, 3000);
        },
        error: errorRequest
    });
}

function exitEventSettings() {
    if (!checkEventSetting(true)) {
        let content = `
            <div class="downloadRec-popup">
                <div class="downloadRec-bg">
                    <div class="downloadRec-content exitEventSettings ">
                        <div class="download-title">Unsaved changes</div>
                        <div class="download-text">You have made changes. <br> Do you want to save or discard them?</div>
                        <div class="download-btns">
                            <div class="btns-item btn btn-primary-new" onclick="saveEventSettings(this)">Save</div>
                            <div class="btns-item btn btn-default" onclick="document.querySelector('.downloadRec-popup').remove(); loadEvent($('#loadEvent'))">Discard</div>
                            <div class="btns-item btn btn-default" onclick="document.querySelector('.downloadRec-popup').remove();">Cancel</div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        $('.dash_wrap .content').append(content);
    } else {
        loadEvent($('#loadEvent'));
    }
}

function showEventAlertNotification(eventType, eventNameStr) {
    // $.ajax({
    //     type: "POST",
    //     url: '',
    //     data: {action: 'getEmailRecipients', imei: imei, eventType: eventType},
    //     success: function(data) {
            let data = {"recipients":[{"recipient":"email@email.com","status":1},{"recipient":"test@test.test","status":1},{"recipient":"email@email.com","status":1},{"recipient":"test@test.test","status":1},{"recipient":"email@email.com","status":1},{"recipient":"test@test.test","status":1},{"recipient":"email@email.com","status":1},{"recipient":"test@test.test","status":1},{"recipient":"email@email.com","status":1},{"recipient":"test@test.test","status":1},{"recipient":"email@email.com","status":1},{"recipient":"test@test.test","status":1}],"requestId":"70a105e9-ef98-484d-b1a2-d93951de4217"};
            let emailList = data.recipients;

            // let emailList = data != '' ? JSON.parse(data).recipients : '';
            let emailListContent = '';

            if (emailList.length > 0) {
                emailList.map(email => {
                    emailListContent += `
                    <div class="recipient-item" data-email="${email.recipient}" data-status="${email.status}" data-type="${eventType}">
                        <div class="recipient-part">
                            <label class="recipient-label">
                                <input type="checkbox" ${email.status ? 'checked' : ''} class="check-input" hidden="" onchange="this.closest('.recipient-item').setAttribute('data-status', this.checked ? 1 : 0)">
                                <span></span>
                            </label>
                            <div class="check-delete"><img src="/dash/assets/img/dashCam/trash-icon.svg" alt="trash-primary-icon"></div>
                            <div>${email.recipient}</div>
                        </div>
                        <div class="recipient-part">
                            <div class="delete-block">
                                <span class="delete-block-item item-link" onclick="deleteRecipientEmail(this)">Delete</span>
                                <span class="delete-block-item" onclick="toggleDeleteRecipientEmail(this, true)">Cancel</span>
                            </div>
                            <div class="delete-btn" onclick="toggleDeleteRecipientEmail(this)"><img src="/dash/assets/img/dashCam/trash-primary-icon.svg" alt="trash-primary-icon"></div>
                        </div>
                    </div>
                    `;
                });
            }

            let content = `
                <div class="downloadRec-popup">
                    <div class="downloadRec-bg">
                        <div class="downloadRec-content recipientEmail">
                            <div class="download-title">Add recipient email for “${eventNameStr} alarms”</div>
                            ${emailList.length == 0 ? '<div class="download-text">No recipient exist for this event</div>' : ''}
                            <div class="recipient__row first">
                                <input type="email" class="recipient-email" id="recipientEmailEvent" placeholder="Enter recipient email" onkeyup="addRecipientEmail('${eventType}')">
                                <button type="button" class="btn btn-primary-new" disabled id="addRecipientEmail" onclick="addRecipientEmail('${eventType}', true)">Add</button>
                            </div>
                            <div class="recipient__row">
                                <div class="recipient-list">
                                    ${emailListContent}
                                </div>
                            </div>
                            <div class="download-btns">
                                <button type="button" class="btns-item btn btn-primary-new" onclick="saveRecipientEmail('${eventType}')">Save</button>
                                <button type=button" class="btns-item btn btn-default" onclick="document.querySelector('.downloadRec-popup').remove()">Close</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            $('.dash_wrap .content').append(content);

            scrollbarInit(`.recipient-list`);
    //     }, 
    //     error: errorRequest
    // })
}

function addRecipientEmail(eventType, add = false) {
    let re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    let email = $('#recipientEmailEvent').val();
    let addBtn = $('#addRecipientEmail');
    let emailInput = $('#recipientEmailEvent');


    if (re.test(email)) {
        $(addBtn).attr('disabled', null);
        $(emailInput).removeClass('check-error');
    } else {
        $(addBtn).attr('disabled', 'disabled');
        $(emailInput).addClass('check-error');
    }
    
    if (add) {
        $('.recipient-list .recipient-list').append(`
            <div class="recipient-item" data-email="${email}" data-status="1" data-type="'${eventType}'">
                <div class="recipient-part">
                    <label class="recipient-label">
                        <input type="checkbox" checked class="check-input" hidden="" onchange="this.closest('.recipient-item').setAttribute('data-status', this.checked ? 1 : 0)">
                        <span></span>
                    </label>
                    <div class="check-delete"><img src="/dash/assets/img/dashCam/trash-icon.svg" alt="trash-primary-icon"></div>
                    <div>${email}</div>
                </div>
                <div class="recipient-part">
                    <div class="delete-block">
                        <span class="delete-block-item item-link" onclick="deleteRecipientEmail(this)">Delete</span>
                        <span class="delete-block-item" onclick="toggleDeleteRecipientEmail(this, true)">Cancel</span>
                    </div>
                    <div class="delete-btn" onclick="toggleDeleteRecipientEmail(this)"><img src="/dash/assets/img/dashCam/trash-primary-icon.svg" alt="trash-primary-icon"></div>
                </div>
            </div>
        `);

        $(addBtn).attr('disabled', 'disabled');
        $(emailInput).removeClass('check-error').val('');
        $('.recipientEmail .download-text').remove();
    }
}

function toggleDeleteRecipientEmail(el, cancel = false) {
    let recipient = $(el).closest('.recipient-item');

    if (!cancel) {
        $(el).hide();
        $(recipient).find('.recipient-label').hide();
        $(recipient).find('.delete-block').show();
        $(recipient).find('.check-delete').show();
    } else {
        $(recipient).find('.delete-btn').show();
        $(recipient).find('.recipient-label').show();
        $(el).parent().hide();
        $(recipient).find('.check-delete').hide();
    }
}

function deleteRecipientEmail(el) {
    let emailItem = $(el).closest('.recipient-item');

    $(emailItem).remove();
}

function saveRecipientEmail(eventType) {
    let recipientList = document.querySelectorAll('.recipient-list .recipient-item');
    let emailList = [];

    if (recipientList.length > 0) {
        recipientList.forEach(email => email.getAttribute('data-status') == 1 ? emailList.push(email.getAttribute('data-email')) : '');
    } else {
        emailList = [];
    }

    $.ajax({
        type: "POST",
        url: '',
        data: {action: 'updateEventsRecipients', imei: imei, eventType: eventType, data: JSON.stringify(emailList)},
        success: function(data) {
            
        }, 
        error: errorRequest
    })
}

function eventCalibrate() {
    $.ajax({
        type: "POST",
        url: '',
        data: {action: '', orgId: '1511'},
        success: function(data) {
            if (data != '') {
                let res = JSON.parse(data).data;

                if (res.requestId !== undefined && res.requestId != '') {
                    let content = `
                        <div class="downloadRec-popup">
                            <div class="downloadRec-bg">
                                <div class="downloadRec-content calibratePopup">
                                    <div class="download-title">Calibration request successfully sent</div>
                                    <div class="download-text"></div>
                                    <div class="download-btns">
                                        <div class="btns-item btn btn-default" onclick="document.querySelector('.downloadRec-popup').remove();">Ok</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;

                    $('.dash_wrap .content').append(content);
                } else {
                    console.log(res.error + ',' + res.message);
                }
            } else {
                console.log('Calibrate response is empty!');
            }
        }, 
        error: errorRequest
    })
}

/* recording tab */
function loadRecording(tab = '') {
    setActiveTableTab(tab);
    $(".dashCamCard__content").html(`<center class="dashCamCard__content-notification"><img class="loading" src="/dash/assets/img/loading.gif"/> Loading recording, please wait..</center>`);

    let dateEnd = moment.utc(new Date).format('YYYY-MM-DDTHH:mm:ss');
    let dateStart = moment.utc(dateEnd).subtract(1, 'month').format('YYYY-MM-DDTHH:mm:ss');

    $.ajax({
        type: "GET",
        url: `${NEW_API_BACKEND_URL}/api/camera/${imei}/record`,
        headers: {
            'Authorization': 'Bearer ' + token
        },
        data: {dateStart: dateStart, dateEnd: dateEnd},
        success: function (data) {
            let recordList = data.list;
            let eventList = data.events;
            let cameraRecording = ``;

            if (recordList.length > 0) {
                recordList.sort((a, b) => a.dateStart < b.dateStart ? 1 : -1);

                for (let item of recordList) {
                    item.timelapseStart = moment(item.dateStart).format('h:mm:ss A');
                    item.timelapseEnd = moment(item.dateStart).add(item.duration, 'second').format('h:mm:ss A');
                    item.cameraType == 1 ? item.cameraIdW = "Front view (road)" : item.cameraIdW = "Back view (driver)";
                    item.type = 'Record';
                    item.location = 'Location';

                    cameraRecording += `
                        <tr onclick="recordFile(this, '${item.type}', '${moment(item.dateStart).format('ddd, MMM D')}', '${item.duration}', '${item.timelapseStart}', '${item.timelapseEnd}', '${item.cameraIdW}', '${item.location}', '${item.link}')">
                            <td class="table-eye"></td>
                            <td>${item.type}</td>
                            <td data-sort="${item.dateStart}">${moment(item.dateStart).format('ddd, MMM D')}</td>
                            <td>${item.duration} sec</td>
                            <td>${item.timelapseStart}  -  ${item.timelapseEnd}</td>
                            <td>${item.cameraIdW}</td>
                            <td>${item.location}</td>
                            <td> 
                                <a class="table-download" download href="${item.link}" onclick="event.stopPropagation()"> 
                                    <img src="/dash/assets/img/dashCam/download-icon.svg" alt="download icon"> 
                                </a>
                            </td>
                        </tr>
                    `
                }
            } 
            
            if (eventList.length > 0) {
                for (let item of eventList) {
                    item.duration = 10;
                    item.timelapseStart = moment(item.time).subtract(item.duration / 2, 'seconds').format('h:mm:ss A');
                    item.timelapseEnd = moment(item.time).add(item.duration / 2, 'second').format('h:mm:ss A');
                    item.cameraId == 1 ? item.cameraIdW = "Front view (road)" : item.cameraIdW = "Back view (driver)";
                    item.type = 'Event';
                    item.location = item.lon + ', ' + item.lat;

                    cameraRecording += `
                        <tr onclick="recordFile(this, '${item.type}', '${moment(item.time).format('ddd, MMM D')}', '${item.duration}', '${item.timelapseStart}', '${item.timelapseEnd}', '${item.cameraIdW}', '${item.location}', '${item.link}')" data-file-id="${item.fileId}" data-file-type="${item.fileType}" data-camera-id="${item.cameraId}">
                            <td class="table-eye"></td>
                            <td>${item.type}</td>
                            <td data-sort="${item.time}">${moment(item.time).format('ddd, MMM D')}</td>
                            <td>10 sec</td>
                            <td>${item.timelapseStart}  -  ${item.timelapseEnd}</td>
                            <td>${item.cameraIdW}</td>
                            <td>${item.location}</td>
                            <td> 
                                <div class="table-download" onclick="getEventRecordLink('${item.fileId}', '${item.cameraId}', '${item.fileType}'); event.stopPropagation()"> 
                                    <img src="/dash/assets/img/dashCam/download-icon.svg" alt="download icon"> 
                                </div>
                            </td>
                        </tr>
                    `
                }
            } 
            
            if (cameraRecording != '') {
                $(".dashCamCard__content").html(`
                    <div class="scroll-cam-table">
                        <table id="dashCamTable" class="table table-striped table-dashboard table-hover table-sm mobile_table tablesorter">
                            <thead>
                                <tr>
                                    <th></th>
                                    <th class="sort-icon" onclick="sortInCamModal(event, this)" data-sort-type='asc'>Type</th>
                                    <th class="sort-icon" onclick="sortInCamModal(event, this, 'date')" data-sort-type='asc'>Date</th>
                                    <th class="sort-icon" onclick="sortInCamModal(event, this)" data-sort-type='asc'>Duration</th>
                                    <th>Timelapse</th>
                                    <th>Camera type</th>
                                    <th>Location</th>
                                    <th>Download</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${cameraRecording}
                            </tbody>
                        </table>
                    </div>
                `);
            } else {
                $(".dashCamCard__content").html(`<center class="dashCamCard__content-notification">No data found</center>`);
            }

            scrollbarInit(`#dashCamCard .modal-body .scroll-cam-table`);
        }, 
        error: errorRequest
    })
}

function recordFile(el, type, date, duration, start, end, camType, location, fileUrl) {
    $(".dashCamCard__content").html(`<center class="dashCamCard__content-notification"><img class="loading" src="/dash/assets/img/loading.gif"/> Loading record details, please wait..</center>`);

    if (type == 'Event') {
        let fileId = el.getAttribute('data-file-id');
        let cameraId = el.getAttribute('data-camera-id');
        let fileType = el.getAttribute('data-file-type');

        fileUrl = getEventRecordLink(fileId, cameraId, fileType, true);
    }

    let content = `
        <div class="fileContent">
            <div class="fileContent__back">
                <div class="backToList" onclick="loadRecording($('#loadRecording'))">
                    <i class="icon icon-arrow-left"></i>
                    <span>Back to list</span>
                </div>
            </div>
            <div class="fileContent__container">
                <div class="fileContent__content record-file">
                    <div class="fileContent__content-item fileContent__file">
                        <div class="detail__title">Video</div>
                        <div class="fileContent__video">
                            <div class="eventFile__video">
                                <video webkit-playsinline="true" playsinline="true" controls src="${fileUrl}"></video>
                            </div>
                        </div>
                    </div>
                    <div class="fileContent__content-item fileContent__detail">
                        <div class="detail__title">Details:</div>
                        <div class="detail__content">
                            <div class="item">
                                <div class="item-name">Type</div>
                                <div class="item-value">${type}</div>
                            </div>
                            <div class="item">
                                <div class="item-name">Date/Time</div>
                                <div class="item-value">${date}</div>
                            </div>
                            <div class="item">
                                <div class="item-name">Duration</div>
                                <div class="item-value">${duration} sec</div>
                            </div>
                            <div class="item">
                                <div class="item-name">Timelapse</div>
                                <div class="item-value">${start} - ${end}</div>
                            </div>
                            <div class="item">
                                <div class="item-name">Camera type</div>
                                <div class="item-value">${camType}</div>
                            </div>
                            <div class="item">
                                <div class="item-name">Location:</div>
                                <div class="item-value">${location}</div>
                            </div>
                        </div>
                        <div class="detail__butns">
                            <a href="${fileUrl}" download class="btns-item btn btn-primary-new">Download video</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    $(".dashCamCard__content").html(`${content}`);
}

function getEventRecordLink(fileId, cameraId, fileType, isGetLink = false) {
    let linkRequst = $.ajax({
        type: "POST",
        async: false,
        url: `${NEW_API_BACKEND_URL}/api/camera/${imei}/events/file`,
        data: {fileId: fileId, cameraId: cameraId, fileType: fileType},
        headers: {
            'Authorization': 'Bearer ' + token
        },
        success: function (data) {
            if (data != '' && !isGetLink) {
                let link = document.createElement('a');
                link.href = data.url;
                link.setAttribute('download', '');
                link.click();
                link.remove();
            }
        },
        error: errorRequest
    });

    if (isGetLink) {
        let fileLink = '';
        linkRequst.done(data => fileLink = data.url);

        return fileLink
    }
}

/* setting tab */
function loadSetting(tab = '') {
    setActiveTableTab(tab);
    $(".dashCamCard__content").html(`<center class="dashCamCard__content-notification"><img class="loading" src="/dash/assets/img/loading.gif"/> Loading settings, please wait..</center>`)

    $.ajax({
        type: "GET",
        url: `${NEW_API_BACKEND_URL}/api/camera/${imei}/config`,
        headers: {
            'Authorization': 'Bearer ' + token
        },
        success: function (config) {
            let configsDefault = {
                "distractedDriver": {"value": false},
                "liveVideo": {"value": false},
                "textOverlay": {"value": false},
                "inCabinCameraRecording": {"value": false},
                "driverPosition": {"value": "left"},
                "speedUnits": {"value": "mph"}, 
                "audioAlarms": {"value": false}, 
                "voiceRecording": {"value": false},
                "notifyLiveStreaming": {"value": false},
                "adminPin": {"value": ""}, 
                "driverPin": {"value": ""}, 
                "brightness": {"value": 140},
                "dateTimeUnits": {"value": "us"},
                "standby": {"timeout": 60},
                "hotSpot": {"internetAccess": false},
                "driverCamera": {"value": false},
            }

            for (item in config) {
                if (item == 'privacy' || item == 'recordingEncryption' || !configsDefault[item]) {
                    continue;
                }

                if (item == 'standby') {
                    configsDefault[item].timeout = config[item].timeout;
                } else if(item == 'hotSpot') {
                    configsDefault[item].internetAccess = config[item].internetAccess;
                } else {
                    configsDefault[item].value = config[item].value;
                }
            }

            $.ajax({
                type: "POST",
                url: `${NEW_API_BACKEND_URL}/api/camera/${imei}/data-usage`,
                headers: {
                    'Authorization': 'Bearer ' + token
                },
                success: function (data) {
                    if (data == '') {
                        console.log('Device data usage not found!');
                        return false;
                    }

                    if (Object.keys(data).length == 0) {
                        console.log('Device data usage empty!');
                        return false;
                    }

                    $('#liveVideoSize').text(getDataUsageSize(data.liveStreamingUsage));
                    $('#liveVideoTime').text(`${getDataUsageTime(data.liveStreamUsageMilli)}`);
                    $('#recordStreamingSize').text(getDataUsageSize(data.recordStreamingUsage));
                    $('#recordStreamingTime').text(`${getDataUsageTime(data.recordStreamUsageMilli)}`);
                    $('#recordUploadSize').text(getDataUsageSize(data.recordingsUploadUsage));
                    $('#mobileDataSize').text(getDataUsageSize(data.mobileTx));
                    $('#videoEventsSize').text(getDataUsageSize(data.eventsUsage));
                },
                error: errorRequest
            })

            let content = `
                <div class="setting__content">
                    <div class="setting__content-item admin__detail">
                        <div class="item__title">Admin pin</div>
                        <div class="item__content">
                            <div class="item">
                                <input type="text" id="adminPin" placeholder="${configsDefault.adminPin.value}" value="${configsDefault.adminPin.value}" maxlength="4" minlength="4" onchange="checkSetting(true)">
                            </div>
                            <div class="item">
                                <button type="button" class="btn-switcher ${configsDefault.audioAlarms.value ? 'active' : ''}" id="audioAlarm" data-val="${configsDefault.audioAlarms.value ? 1 : 0}" onclick="changeActive(this);checkSetting(true);">
                                    <span class="sw-label">Audio alarm</span> 
                                    <span class="sw-switcher"></span>
                                </button>
                            </div>
                            <div class="item">
                                <button type="button" class="btn-switcher ${configsDefault.distractedDriver.value ? 'active' : ''}" id="distractedDriver" data-val="${configsDefault.distractedDriver.value ? 1 : 0}" onclick="changeActive(this);checkSetting(true);">
                                    <span class="sw-label">Distracted Driver</span> 
                                    <span class="sw-switcher"></span>
                                </button>
                            </div>
                            <div class="item">
                                <button type="button" class="btn-switcher ${configsDefault.driverCamera.value ? 'active' : ''}" id="driverCamera" data-val="${configsDefault.driverCamera.value ? 1 : 0}" onclick="changeActive(this);checkSetting(true);">
                                    <span class="sw-label">Driver Camera</span> 
                                    <span class="sw-switcher"></span>
                                </button>
                            </div>
                            <div class="item">
                                <button type="button" class="btn-switcher ${configsDefault.inCabinCameraRecording.value ? 'active' : ''}" id="inCabinCameraRecording" data-val="${configsDefault.inCabinCameraRecording.value ? 1 : 0}" onclick="changeActive(this);checkSetting(true);">
                                    <span class="sw-label">In Cabin camera recording</span> 
                                    <span class="sw-switcher"></span>
                                </button>
                            </div>
                            <div class="item">
                                <button type="button" class="btn-switcher ${configsDefault.hotSpot.internetAccess ? 'active' : ''}" id="hotSpot" data-val="${configsDefault.hotSpot.internetAccess ? 1 : 0}" onclick="changeActive(this);checkSetting(true);">
                                    <span class="sw-label">HotSpot</span> 
                                    <span class="sw-switcher"></span>
                                </button>
                            </div>
                            <div class="item">
                                <button type="button" class="btn-switcher ${configsDefault.liveVideo.value ? 'active' : ''}" id="liveVideo" data-val="${configsDefault.liveVideo.value ? 1 : 0}" onclick="changeActive(this);checkSetting(true);">
                                    <span class="sw-label">Live video</span> 
                                    <span class="sw-switcher"></span>
                                </button>
                            </div>
                            <div class="item">
                                <button type="button" class="btn-switcher ${configsDefault.voiceRecording.value ? 'active' : ''}" id="voiceRecording" data-val="${configsDefault.voiceRecording.value ? 1 : 0}" onclick="changeActive(this);checkSetting(true);">
                                    <span class="sw-label">Voice recording</span> 
                                    <span class="sw-switcher"></span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="setting__content-item driver__detail">
                        <div class="item__title">Driver pin</div>
                        <div class="item__content">
                            <div class="item">
                                <input type="text" id="driverPin" placeholder="${configsDefault.driverPin.value}" value="${configsDefault.driverPin.value}" maxlength="4" minlength="4" onchange="checkSetting(true)">
                            </div>
                            <div class="item">
                                <button type="button" class="btn-switcher double ${configsDefault.dateTimeUnits.value == 'eu' ? 'active' : ''}" id="dateTimeUnits" data-val="${configsDefault.dateTimeUnits.value == 'eu' ? 1 : 0}" onclick="changeActive(this);checkSetting(true);">
                                    <span class="sw-label">DateTime Units</span>
                                    <span class="sw-double">
                                        US
                                        <span class="sw-switcher"></span>
                                        EU
                                    </span>
                                </button>
                            </div>
                            <div class="item">
                                <button type="button" class="btn-switcher double ${configsDefault.driverPosition.value == 'left' ? 'active' : ''}" id="driverPosition" data-val="${configsDefault.driverPosition.value == 'left' ? 1 : 0}" onclick="changeActive(this);checkSetting(true);">
                                    <span class="sw-label">Driver Position</span>
                                    <span class="sw-double">
                                        Right
                                        <span class="sw-switcher"></span>
                                        Left
                                    </span>
                                </button>
                            </div>
                            <div class="item item-border">
                                <button type="button" class="btn-switcher double ${configsDefault.speedUnits.value == 'kmh' ? 'active' : ''}" id="speedUnits" data-val="${configsDefault.speedUnits.value == 'kmh' ? 1 : 0}" onclick="changeActive(this);checkSetting(true);">
                                    <span class="sw-label">Speed units</span>
                                    <span class="sw-double">
                                        MPH
                                        <span class="sw-switcher"></span>
                                        KMH
                                    </span>
                                </button>
                            </div>
                            <div class="item item-range range-field ez_range_field_valuelist">
                                <div class="item-title">
                                    <span>Brightness</span>
                                    <span class="range-value">${configsDefault.brightness.value}</span>
                                </div>
                                <input value="${configsDefault.brightness.value}" type="range" name="brightness_range" id="brightness" data-valuelist="" min="0" max="255" step="1" data-name="brightness" class="active" onchange="checkSetting(true)" oninput="showValue(this)">
                                <input type="hidden" name="brightness" value="${configsDefault.brightness.value}">
                            </div>
                            <div class="item item-select">
                                <div class="item-title">
                                    <span>Stand by</span>
                                </div>
                                <div class="item-custom-select select__container">
                                    <div id="standby" class="select__selected" data-value="${configsDefault.standby.timeout}" onclick="showOptionsCustomSelect(this)">${configsDefault.standby.timeout} minutes</div>
                                    <div class="select__content">
                                        <div class="select__option" data-value="10" onclick="selectOptionsCustomSelect(this); checkSetting(true);">10 minutes</div>
                                        <div class="select__option" data-value="15" onclick="selectOptionsCustomSelect(this); checkSetting(true);">15 minutes</div>
                                        <div class="select__option" data-value="20" onclick="selectOptionsCustomSelect(this); checkSetting(true);">20 minutes</div>
                                        <div class="select__option" data-value="25" onclick="selectOptionsCustomSelect(this); checkSetting(true);">25 minutes</div>
                                        <div class="select__option" data-value="30" onclick="selectOptionsCustomSelect(this); checkSetting(true);">30 minutes</div>
                                        <div class="select__option" data-value="35" onclick="selectOptionsCustomSelect(this); checkSetting(true);">35 minutes</div>
                                        <div class="select__option" data-value="40" onclick="selectOptionsCustomSelect(this); checkSetting(true);">40 minutes</div>
                                        <div class="select__option" data-value="45" onclick="selectOptionsCustomSelect(this); checkSetting(true);">45 minutes</div>
                                        <div class="select__option" data-value="50" onclick="selectOptionsCustomSelect(this); checkSetting(true);">50 minutes</div>
                                        <div class="select__option" data-value="55" onclick="selectOptionsCustomSelect(this); checkSetting(true);">55 minutes</div>
                                        <div class="select__option" data-value="60" onclick="selectOptionsCustomSelect(this); checkSetting(true);">60 minutes</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="setting__content-item usage__detail">
                        <div class="item__title">Data usage:</div>
                        <div class="item__content">
                            <div class="item">
                                <div class="item-name">Since</div>
                                <div class="item-value" id="dataUsageSinse">${moment().startOf('month').format('DD/MM/YYYY')}</div>
                                <div class="item-info"></div>
                            </div>
                            <div class="item">
                                <div class="item-name">Mobile Data</div>
                                <div class="item-value" id="mobileDataSize">0 B</div>
                                <div class="item-info"></div>
                            </div>
                            <div class="item">
                                <div class="item-name">Live video:</div>
                                <div class="item-value" id="liveVideoTime"></div>
                                <div class="item-info" id="liveVideoSize">0 B</div>
                            </div>
                            <div class="item">
                                <div class="item-name">Video Events:</div>
                                <div class="item-value">1 Month</div>
                                <div class="item-info" id="videoEventsSize">0 B</div>
                            </div>
                            <div class="item">
                                <div class="item-name">Recordings Uploaded:</div>
                                <div class="item-value"></div>
                                <div class="item-info" id="recordUploadSize">0 B</div>
                            </div>
                            <div class="item">
                                <div class="item-name">Record Streaming:</div>
                                <div class="item-value" id="recordStreamingTime"></div>
                                <div class="item-info" id="recordStreamingSize">0 B</div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            $('#saveSettings').show();
            $(".dashCamCard__content").html(content);
            $(`.select__container .select__option[data-value="${configsDefault.standby.timeout}"]`).addClass('active');

            scrollbarInit(`#dashCamCard .select__container .select__content`);

            dashCamSetting = checkSetting();
            checkSetting(true);
        },
        error: errorRequest
    });
}

function checkSetting(check = false, save = false) {
    let driverCamera = $('#driverCamera').attr('data-val') == 0 ? false : true;
    let driverPin = $('#driverPin').val();
    let driverPosition = $('#driverPosition').attr('data-val') == 0 ? 'right' : 'left';
    let hotSpot = $('#hotSpot').attr('data-val') == 0 ? false : true;
    let adminPin = $('#adminPin').val();
    let brightness = $('#brightness').val();

    let audioAlarms = $('#audioAlarm').attr('data-val') == 0 ? false : true;
    let dateTimeUnits = $('#dateTimeUnits').attr('data-val') == 0 ? 'us' : 'eu';
    let distractedDriver = $('#distractedDriver').attr('data-val') == 0 ? false : true;
    let inCabinCameraRecording = $('#inCabinCameraRecording').attr('data-val') == 0 ? false : true;
    let liveVideo = $('#liveVideo').attr('data-val') == 0 ? false : true;
    let speedUnits = $('#speedUnits').attr('data-val') == 0 ? 'mph' : 'kmh';
    let standby = $('#standby').attr('data-value');
    let voiceRecording = $('#voiceRecording').attr('data-val') == 0 ? false : true;

    let checkSetting = [adminPin, audioAlarms, distractedDriver, driverCamera, inCabinCameraRecording, hotSpot, liveVideo, voiceRecording, driverPin, dateTimeUnits, driverPosition, speedUnits, brightness, standby];

    if (save) {
        let data = {
            "audioAlarms": {"value": audioAlarms},
            "dateTimeUnits": {"value": dateTimeUnits},
            "distractedDriver": {"value": distractedDriver},
            "inCabinCameraRecording": {"value": inCabinCameraRecording},
            "liveVideo": {"value": liveVideo},
            "speedUnits": {"value": speedUnits},
            "standby": {"timeout": standby},
            "voiceRecording": {"value": voiceRecording},
            "driverCamera": {"value" : driverCamera},
            "driverPin": {"value": driverPin},
            "driverPosition": {"value": driverPosition},
            "hotSpot": {"internetAccess": hotSpot},
            "adminPin": {"value": adminPin},
            "brightness": {"value": brightness}
        }

        return data;
    }

    let isError = false;

    if(!check) {
        return checkSetting;
    } else {
        if(dashCamSetting.length != checkSetting.length) {
            return false;
        }

        for(i = 0; i < dashCamSetting.length; i++) {
            if(dashCamSetting[i] != checkSetting[i]) {
                isError = true;
                $('#saveSettings').attr('disabled', null);
            }
        }

        if (!isError) {
            $('#saveSettings').attr('disabled', 'disabled');
        }
    }
}

function saveSetting(btn) {
    let settingArray = checkSetting(false, true);

    if(!/^[A-Za-z0-9-_+=.,?!]+$/.test(settingArray.driverPin.value)) {
        $('.update_result').addClass('error').text('Driver pin must contain only latin letters or numbers');
        return false;
    }

    if(!/^[A-Za-z0-9-_+=.,?!]+$/.test(settingArray.adminPin.value)) {
        $('.update_result').addClass('error').text('Admin pin must contain only latin letters or numbers');
        return false;
    }

    $.ajax({
        type: "PUT",
        url: `${NEW_API_BACKEND_URL}/api/camera/${imei}/config`,
        headers: {
            'Authorization': 'Bearer ' + token
        },
        data: settingArray,
        success: data => {
            $('.save-setting').addClass('active').text('Saved');
            dashCamSetting = checkSetting();
            checkSetting(true);

            setTimeout(() => {
                $('.save-setting').removeClass('active error').text('');
            }, 3000);
        },
        error: error => {
            $('.save-setting').addClass('error active').text(error.responseJSON.message);
        }
    });

}

/* other */

function showOptionsCustomSelect(select) {
    let isActiveSelect = $(select).closest('.select__container').hasClass('active');

    $('.select__container.active').removeClass('active');
    if (!isActiveSelect) {
        $(select).closest('.select__container').addClass('active');
    }

    $('#dashCamCard').on('click', function(e) {
        const target = e.target;

        if (!target.closest('.select__container')) {
            $(select).closest('.select__container').removeClass('active');
        }
    });
}

function selectOptionsCustomSelect(option) {
    let text = $(option).text();
    let val = $(option).attr('data-value');
    let selectContainer = $(option).closest('.select__container');
    let selectedBox = $(selectContainer).find('.select__selected');

    $(selectContainer).find('.select__option').removeClass('active');
    $(selectedBox).attr('data-value', val).text(text);
    $(selectContainer).removeClass('active');
    $(option).addClass('active');
}

function setActiveTableTab(btn) {
    $(`#dashCamCard .modal-body .scroll-cam-table`).scrollbar('destroy');
    $('#dashCamCard .dashCamCard__search').hide();
    $('#saveSettings').hide();
    $('#loadEventSettings').hide();
    $('#eventCalibrate').hide();
    $('#saveEventSettings').hide();
    $('#exitEventSettings').hide();
    $('#closeBnt').show();
    $('.dashCamCard__tabsBtn button').removeClass('active');
    clearInterval(recordTimer);
    clearInterval(recordTimerBack);

    if (broadcast.video_id && broadcast.video_id != undefined) {
        if (broadcast.type == 'hls') {
            destroy_video_hls(broadcast.video_id)
        } else if (broadcast.type == 'webrtc') {
            destroy_video_webrtc(broadcast.video_id)
        }
    }

    if (broadcastBack.video_id && broadcastBack.video_id != undefined) {
        if (broadcastBack.type == 'hls') {
            destroy_video_hls(broadcastBack.video_id)
        } else if (broadcastBack.type == 'webrtc') {
            destroy_video_webrtc(broadcastBack.video_id)
        }
    }

    $(btn).addClass('active');
}

function changeActive(el) {
    let val = $(el).attr('data-val');

    if (val == 1) {
        $(el).removeClass('active');
        $(el).attr('data-val', '0')
    } else if (val == 0) {
        $(el).addClass('active');
        $(el).attr('data-val', '1')
    }
}

function showValue(el) {
    let value = $(el).val();
    let box = $(el).parent().find('.range-value');

    $(box).html(value);
}

function getDataUsageSize(size) {
    if (size != 0) {
        if (size < 1000) {
            return size + 'B';
        } else if (size >= 1000 && size < 1000000) {
            return (size / 1000).toFixed(2) + 'kB';
        } else if (size >= 1000000 && size < 1000000000) {
            return (size / 1000000).toFixed(2) + 'MB';
        } else if (size >= 1000000000 && size < 1000000000000) {
            return (size / 1000000000).toFixed(2) + 'GB';
        }
    } else {
        return 0 + 'B';
    }
}

function getDataUsageTime(milisec) {
    if (milisec <= 0) {
        return ' ';
    } else {
        let time = milisec / 1000;
        let hours = Math.floor(time / 3600);
        time = time - hours * 3600;
        let minutes = Math.floor(time / 60);

        if (hours > 0) {
            return hours + ' Hours ' + minutes + ' Minutes';
        } else {
            return minutes + ' Minutes';
        }
    }
}

function eventTypeToStr(eventType) {
    let eventTypeStr = {
        "acceleration": {typeStr: "Acceleration"},
        "accOff": {typeStr: "Power Off"},
        "accOn": {typeStr: "Power On"},
        "activated": {typeStr: "Activated"},
        "button": {typeStr: "Button Pressed"},
        "collision": {typeStr: "Collision"},
        "coreConnection": {typeStr: "Core Connection"},
        "coverOpened": {typeStr: "Tamper"},
        "deceleration": {typeStr: "De-Acceleration"},
        "distractedDriving": {typeStr: "Distracted Driving"},
        "geoFence": {typeStr: "Fence"},
        "jolt": {typeStr: "Vibration"},
        "shakingEnded": {typeStr: "Shaking Ended"},
        "shakingStarted": {typeStr: "Shaking Started"},
        "sharpTurnLeft": {typeStr: "Violent Left Turn"},
        "sharpTurnRight": {typeStr: "Violent Right Turn"},
        "speedLimit": {typeStr: "Speed Limit"},
        "powerDisconnectAlarm": {typeStr: "Power Disconnect"},
        "smoking": {typeStr: "Smoking"},
        "foodDrink": {typeStr: "Food and Drink"},
        "cellPhoneUse": {typeStr: "Cell Phone Use"},
        "driverUnbelted": {typeStr: "Driver Unbelted"},
        "smokingBeep": {typeStr: "Smoking Beep"},
        "foodDrinkBeep": {typeStr: "Food and Drink Beep"},
        "cellPhoneUseBeep": {typeStr: "Cell Phone Use Beep"},
        "driverUnbeltedBeep": {typeStr: "Driver Unbelted Beep"},
        "distractedDriverBeep": {typeStr: "Distracted Driver Beep"},
        "virtualEvent": {typeStr: "Virtual Event"},
        "wrongPinCode": {typeStr: "Wrong Pin Code"},
        "gsensorHigh": {typeStr: "Gsensor High"},
        "gsensorRegular": {typeStr: "Gsensor Regular"},
        "accident": {typeStr: "Accident"},
        "tailgating": {typeStr: "Tailgating"},
        "obstruction": {typeStr: "Obstruction"}
    }

    return eventTypeStr[`${eventType}`] !== undefined ? eventTypeStr[`${eventType}`]['typeStr'] : eventType;
}

function findInCamModal(type, el) {
    let tableBody = type == 'modal' ? document.querySelector('#dashCamTable tbody') : document.querySelector('#smartCamTable tbody');

    let searchText = el.value;
    let res = [];

    tableBody.innerHTML = '';

    if (searchText == '') {
        [...findList].map(item => tableBody.append(item));
        return false
    }

    res = [...findList].filter(item => {
        let isInclude = false;

        [...item.children].map(child => {
            let arr = (child.innerText).toLowerCase();
            if(arr.includes(searchText.toLowerCase())) {
                isInclude = true;
            }
        })

        return isInclude
    })

    if ([...res].length > 0) {
        [...res].map(item => tableBody.append(item));
    } else {
        tableBody.innerHTML = `<tr><td colspan="${type == 'modal' ? 8 : 5}"><center class="dashCamCard__content-notification">No data found</center></td></tr>`;
    }
}

function sortInCamModal(e, el, dataType = 'string') {
    let tableBody = document.querySelector('#dashCamTable tbody');
    let sortList = tableBody.querySelectorAll('tr');
    let sortType = el.getAttribute('data-sort-type');
    let sortActiveItems = document.querySelectorAll('#dashCamTable [data-sort-type="desc"]');

    sortActiveItems.forEach(item => item.setAttribute('data-sort-type', 'asc'));

    [...sortList] = sortDashCamTableList([...sortList], e.srcElement.cellIndex, sortType, dataType);
    [...sortList].map(item => tableBody.append(item));

    el.setAttribute('data-sort-type', sortType == 'asc' ? 'desc' : 'asc');
}

function sortDashCamTableList(arr, cellIndex, sortType = 'asc', dataType = 'string') {
    if (dataType == 'date') {
        return arr.sort((a, b) => {
            let itemA = a.children[cellIndex].attributes['data-sort'].value;
            let itemB = b.children[cellIndex].attributes['data-sort'].value;

            if (moment(itemA).isBefore(itemB)) {
                return sortType == 'asc' ? -1 : 1;
            } else if (moment(itemA).isAfter(itemB)) {
                return sortType == 'asc' ? 1 : -1;
            } else {
                return 0
            }
        });
    }

    return arr.sort((a, b) => {
        if (a.children[cellIndex].innerText < b.children[cellIndex].innerText) {
            return sortType == 'asc' ? -1 : 1;
        } else if (a.children[cellIndex].innerText > b.children[cellIndex].innerText) {
            return sortType == 'asc' ? 1 : -1;
        } else {
            return 0
        }
    });
}

function errorRequest (error) {
    console.log('error', error);
}

function kmhToMph(speed) {
    let koef = 1.609;

    if (!isNaN(speed) && speed >= 0 && typeof speed != 'undefined') {
        return +speed > 0 ? (+speed / koef).toFixed(2) : 0;
    } else {
        return 0
    }
}

function dashCamMap(mapElement = '', option = {}) {
    if (mapElement === '' || typeof mapElement === "undefined") {
        showModal('Error', 'Not found place for map.');
        return false;
    }

    var map = {};

    map.platform = new H.service.Platform({app_id: HERE_APP_ID, app_code: HERE_APP_CODE, useHTTPS: true});

    var pixelRatio = window.devicePixelRatio || 1;
    var defaultLayers = map.platform.createDefaultLayers({
        tileSize: pixelRatio === 1 ? 256 : 512,
        ppi: pixelRatio === 1 ? undefined : 320
    });

    mapType = option.type == 'satellite' ? defaultLayers.satellite.map : defaultLayers.normal.map;

    map.hMap = new H.Map(document.getElementById(mapElement),
            mapType, {
                center: option.center ? option.center : {lat: 39.9798817, lng: -99.3329989},
                zoom: option.zoom ? option.zoom : 4,
                pixelRatio: pixelRatio
            });
    map.hMap.getBaseLayer().setMin(2);

    var behavior = new H.mapevents.Behavior(new H.mapevents.MapEvents(map.hMap));

    map.hereUi = H.ui.UI.createDefault(map.hMap, defaultLayers);
    map.hereUi.setUnitSystem(H.ui.UnitSystem.IMPERIAL); 
    map.groupMarkers = new H.map.Group();
    fullScreenControl(mapElement);

    return map;
};

// ezsmartcam file function ==================================================================
addDatePicker('.clearableDatepicker');

$(document).ready(e => {
    $(document).on('keyup', e => {
        if ($('#dashCamCard') != null) {
            if (e.key == 'Escape') {
                findList = document.querySelectorAll('#smartCamTable tbody tr');
            }
        }
    })
})

function scrollbarInit(selector) {
    var $dvirs_labels = $(selector);
    $.each($dvirs_labels, function (idx, $dviritem) {
        $($dviritem).addClass('scrollbar-inner').scrollbar({
            'autoUpdate': true
        });
    });
}
// ===========================================================================================


// ==== init live stream video ====
function isSafariBrouser () {
    let brouserInfo = getBrowserInfo();
    return brouserInfo.name.toLowerCase() == 'safari'
}

function initVideo(camType) {
    //Selected video type webrtc or hls
    let type = isSafariBrouser() ? 'hls' : 'webrtc';
    let videosource;
    let source;
    if (camType == 1) {
        broadcast.type = type;
        // broadcast.video_status = false;
        //Video tag ID
        broadcast.video_id = 'remoteVideoFront';
        videosource = document.getElementById(broadcast.video_id);
    } else {
        broadcastBack.type = type;
        // broadcastBack.video_status = false;
        //Video tag ID
        broadcastBack.video_id = 'remoteVideoBack';
        videosource = document.getElementById(broadcastBack.video_id);
    }

    // 1-Front camera, 2-Rear camera
    let cameraType = camType;

    //Request Data
    var videoSourceUrl = mediaAddress;

    if (mediaToken === null) {
        if(cameraType == 1) {
            $('.video__container.front__container .play-btn').attr('value', 'Play');
            $('.video__container.front__container .stream__notifitation.btn__notification').fadeIn(500, function() {
                $(this).addClass('active')
            });
        } else {
            $('.video__container.back__container .play-btn').attr('value', 'Play');
            $('.video__container.back__container .stream__notifitation.btn__notification').fadeIn(500, function() {
                $(this).addClass('active')
            });
        }

        return false;
    }
    
    if (type == 'webrtc') {
        source = 'https://' + videoSourceUrl + '/webrtc/#PEERID#/' + imei + '/' + cameraType + '/' + mediaToken + '';
    } else {
        source = 'https://' + videoSourceUrl + '/' + imei + '/' + cameraType + '/' + mediaToken + '/' + dashCamVideoFileName;
    }

    if (camType == 1) {
        broadcast.source = source;
        broadcast.video_element_toggle = true;
    } else {
        broadcastBack.source = source;
        broadcastBack.video_element_toggle = true;
    }

    videosource.setAttribute('src', source);

    if (type == 'hls') {
        camType == 1 ? create_video_hls(broadcast, camType) : create_video_hls(broadcastBack, camType);
    } else if (type == 'webrtc') {
        camType == 1 ? create_video_webrtc(broadcast, camType) : create_video_webrtc(broadcastBack, camType)
    }
}

function play_pause_broadcast(camType, btn, relogin = false) {
    if (relogin) {
        login(camType, btn, relogin);
        return false;
    }

    let statusBtn = $(btn).val();
    let statusVideo = statusBtn == 'Play' ? true : false;

    if (statusVideo) {
        $(btn).attr('value', 'Pause');
        initVideo(camType);
        if (camType == 1) {
            clearInterval(recordTimer);
            $('#remoteVideoFront').addClass('play');
        } else {
            clearInterval(recordTimerBack);
            $('#remoteVideoBack').addClass('play');
        }
    } else {
        $(btn).attr('value', 'Play');
        if (camType == 1) {
            $('#remoteVideoFront').removeClass('play');
        } else {
            $('#remoteVideoBack').removeClass('play');
        }
        camType == 1 ? stop_a_broadcast(broadcast, camType) : stop_a_broadcast(broadcastBack, camType);
    }
}

function stop_a_broadcast(broadcast, camType) {
    if (broadcast.type == 'hls') {
        destroy_video_hls(broadcast.video_id)
    } else if (broadcast.type == 'webrtc') {
        destroy_video_webrtc(broadcast.video_id)
    }

    if (camType == 1) {
        if (recStream.front_view) {
            $('.video__container.front__container .record-video-stream div:not(.saves__btn, .trash__btn)').removeClass('active');
        } else {
            $('.video__container.front__container .record-video-stream div').removeClass('active');
        }
    } else {
        if (recStream.back_view) {
            $('.video__container.back__container .record-video-stream div:not(.saves__btn, .trash__btn)').removeClass('active');
        } else {
            $('.video__container.back__container .record-video-stream div').removeClass('active');
        }
    }
}

function login(camType = 1, btn = '', relogin = false) {
    $.ajax({
        type: 'POST',
        url: `${NEW_API_BACKEND_URL}/api/camera/${imei}/connect`,
        xhrFields: {withCredentials: true},
        success: function (data) {
            if (data) {
                mediaToken = data.mediaToken;
                mediaAddress = data.address;

                if (relogin) {
                    play_pause_broadcast(camType, btn);
                }
            } else {
                console.log('Error connect');
            }
        },
        error: error => console.log(error)
    })
}



// init files
// ==== hls video format ====
import('/v2/hls.js');
var videos_list = [];
var a_counter = 0;

function create_video_hls(video_data, id = 'none') {
    var video_id = video_data.video_id;
    destroy_video_hls(video_id);

    var video = document.getElementById(video_id);
    var source = video_data.source;
    var apple_source = source;    //getApplesource(source);
    var hls;
    var destroyed = false;
    var hls_timer;
    if (Hls.isSupported()) {
        var d = new Date();
        var running_counter_time = d.getTime();
        var config = {
            liveSyncDurationCount: 3,
            liveMaxLatencyDurationCount: 10
        };
        console.log("new hls created")
        hls = new Hls(config);
        hls.attachMedia(video);
        hls.on(Hls.Events.MEDIA_ATTACHED, function () {
            console.log("video and hls.js are now bound together !");
            if(id == 1) {
                if (!recStream.front_view) {
                    $('.video__container.front__container .rec__btn').addClass('active');
                }
            } else {
                if (!recStream.back_view) {
                    $('.video__container.back__container .rec__btn').addClass('active');
                }
            }
            hls.loadSource(source);
        });
        hls.on(Hls.Events.MANIFEST_PARSED, function () {
            console.log("start playing video !");
            video.play();
            //hls.loadSource('/playlist.m3u8');
        });
        hls.on(Hls.Events.ERROR, function (event, data) {
            return;
            /*if(destroyed) return;
                console.log("error encountered, try to recover");
                if (data.fatal)
                {
                switch(data.type) {
                    case Hls.ErrorTypes.NETWORK_ERROR:
                    // try to recover network error
                    console.log("fatal network error encountered, try to recover");
                    destroyed=true;
                    hls.destroy();
                    create_video_hls(video_data);
                    break;
                    case Hls.ErrorTypes.MEDIA_ERROR:
                    console.log("fatal media error encountered, try to recover");
                    //hls.recoverMediaError();
                    destroyed=true;
                    hls.destroy();
                    create_video_hls(video_data);
                    break;
                    default:
                    //cannot recover
                    destroyed=true;
                    hls.destroy();
                    create_video_hls(video_data);
                    break;
                }
                }*/
        });
        hls.on(Hls.Events.BUFFER_APPENDED, function (event, data) {
            var xx = new Date();
            running_counter_time = xx.getTime();
            console.log('video_id::', video_id);
            console.log("**** Hls.Events.BUFFER_APPENDED  event ", event, '::', running_counter_time);
            var buf = video.buffered;
            if (buf.length > 0) {
                var max_delay = 2.0;
                console.log("currentTime = ", video.currentTime, " Length=", buf.length, " start= ", buf.start(0), " end = ", buf.end(buf.length - 1));
                //if (video.currentTime + max_delay <script buf.end(buf.length-1))
                //{
                //  video.currentTime = buf.end(buf.length-1) - max_delay;
                //  console.log("Fixing currentTime=", video.currentTime);
                //}
            }
        });
        hls.loadSource(source);
        hls_timer = setInterval(hls_restart_timer, 1000);

        function hls_restart_timer() {
            var dd = new Date();
            console.log('video_id::', video_id);
            console.log('Start-running_counter_time :: ' + running_counter_time);
            console.log('Current-time               :: ' + dd.getTime());
            if ((dd.getTime() - running_counter_time) > 10000) // Here you need to set appropriate timeout – I placed 5 second
            {
                console.log('Start-running_counter_time :: ' + running_counter_time);
                console.log('Current-time               :: ' + dd.getTime());
                console.log("***** restart the video diff-time ", dd.getTime() - running_counter_time);
                //location.reload();   // Here, I placed reloading the page, but you need your code that restarts the video
                if (hls_timer) {
                    console.log('********** CLEARING TIMER************')
                    clearInterval(hls_timer);
                    hls_timer = null;
                }
                ;
                destoryed = true;
                destroy_hls();
                restart_hls_video(video_id);
                running_counter_time = dd.getTime();
            }
        }
    }
        // hls.js is not supported on platforms that do not have Media Source Extensions (MSE) enabled.
        // When the browser has built-in HLS support (check using `canPlayType`), we can provide an HLS manifest (i.e. .m3u8 URL) directly to the video element throught the `src` property.
    // This is using the built-in support of the plain video element, without using hls.js.
    else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        fetch(apple_source).then(function (error, response, body) {
            video.src = apple_source;
            video.addEventListener('canplay', function () {
                setTimeout(() => {
                    video.play();
                });
            });
        }).catch(function () {

        });
        //~ video.addEventListener('canplay',function() {
        //~ video.play();
        //~ });
    }

    function play_hls() {
        if (hls_timer) {
            clearInterval(hls_timer);
            hls_timer = null;
        }
        if (hls) {
            hls.startLoad();
        } else {
            video.play();
        }
    }

    function stop_hls() {
        if (hls_timer) {
            clearInterval(hls_timer);
            hls_timer = null;
        }
        if (hls) {
            hls.stopLoad();
        } else {
            video.pause();
            video.src = null;
        }
    }

    function destroy_hls() {
        destroyed = true;
        if (hls_timer) {
            clearInterval(hls_timer);
            hls_timer = null;
        }
        if (hls) {
            hls.destroy();
        } else {
            video.pause();
            video.src = null;
        }
    }

    video_data.play = play_hls;
    video_data.stop = stop_hls;
    video_data.destroy_hls = destroy_hls;
    videos_list[video_id] = video_data;
    return video_data;
}

function destroy_video_hls(video_id) {
    if (videos_list[video_id] !== undefined) {
        var video_data = videos_list[video_id];
        video_data.destroy_hls();
        delete videos_list[video_id];
    }
}

function restart_hls_video(video_id) {
    /*if(videos_list[video_id] !== undefined)
    {
        var video_data=videos_list[video_id];
        destroy_video_webrtc(video_id);
        setTimeout(()=>{
            create_video_webrtc(video_data);
        })
    }*/
    var cusDiv = document.getElementById('cusDiv');
    var event = new CustomEvent('restart_video', {
        detail: {
            video_id: video_id
        }
    });
    cusDiv.dispatchEvent(event);
}

function getApplesource(source) {
    var sourceArray = source.split('.m3u8');
    var apple_source = sourceArray[0] + '_cif.m3u8';
    return apple_source;


}

// ==== webrtc video format ====
function create_video_webrtc(video_data, camera_id) {
    var video_id = video_data.video_id;
    destroy_video_webrtc(video_id);
    var video_element = video_id;
    var original_source = video_data.source;
    var mediacore_domain = new URL(original_source).hostname;
    var socket_connection_timer = null;
    var restarted = false;
    console.log('video_element', video_element);
    /* vim: set sts=4 sw=4 et :
    *
    * Demo Javascript app for negotiating and streaming a sendrecv webrtc stream
    * with a GStreamer app. Runs only in passive mode, i.e., responds to offers
    * with answers, exchanges ICE candidates, and streams.
    *
    * Author: Nirbheek Chauhan <nirbheek@centricular.com>
    */

    // Set this to override the automatic detection in websocketServerConnect()

    var ws_server;
    var ws_port;
    // Set this to use a specific peer id instead of a random one
    var default_peer_id;
    // Override with your own STUN servers if you want
    var rtc_configuration = {
        iceServers: [{urls: "stun:stun.services.mozilla.com"},
            {urls: "stun:stun.l.google.com:19302"}]
    };
    // The default constraints that will be attempted. Can be overriden by the user.
    var default_constraints = {video: true, audio: false};

    var connect_attempts = 0;
    var peer_connection;
    var ws_conn;
    // Promise for local stream after constraints are approved by the user
    var local_stream_promise;

    function getOurId() {
        return Math.floor(Math.random() * (1000000 - 10) + 10).toString();
    }

    function resetState() {
        // This will call onServerClose()
        ws_conn.close();
    }

    function handleIncomingError(error) {
        setError("ERROR: " + error);
        resetState();
    }

    function getVideoElement() {
        return document.getElementById(video_element);
    }

    function setStatus(text) {
        console.log(text);
        return;
        var span = document.getElementById("status")
        // Don't set the status if it already contains an error
        if (!span.classList.contains('error'))
            span.textContent = text;
    }

    function setError(text) {
        console.error(text);
        return;
        var span = document.getElementById("status")
        span.textContent = text;
        span.classList.add('error');
    }

    function resetVideo() {
        //return false;
        console.log(local_stream_promise);
        // Release the webcam and mic
        if (false && local_stream_promise) {
            local_stream_promise.then(stream => {
                stream ? stream.stop() : '';
            });
        }

        // Reset the video element and stop showing the last received frame
        var videoElement = getVideoElement();
        videoElement.pause();
        videoElement.src = "";
        videoElement.load();
    }

    // SDP offer received from peer, set remote description and create an answer
    function onIncomingSDP(sdp) {
        peer_connection.setRemoteDescription(sdp).then(() => {
            setStatus("Remote SDP set");
            if (sdp.type != "offer")
                return;
            setStatus("Got SDP offer");
            local_stream_promise.then((stream) => {
                setStatus("Got local stream, creating answer");
                peer_connection.createAnswer()
                    .then(onLocalDescription).catch(setError);
            }).catch(setError);
        }).catch(setError);
    }

    // Local description was set, send it to peer
    function onLocalDescription(desc) {
        console.log("Got local description: " + JSON.stringify(desc));
        peer_connection.setLocalDescription(desc).then(function () {
            setStatus("Sending SDP answer");
            sdp = {'sdp': peer_connection.localDescription}
            ws_conn.send(JSON.stringify(sdp));
        });
    }

    // ICE candidate received from peer, add it to the peer connection
    function onIncomingICE(ice) {
        var candidate = new RTCIceCandidate(ice);
        peer_connection.addIceCandidate(candidate).catch(setError);
    }

    function httpGetAnswer(text) {
        console.log("httpGetAnswer(): " + text);
    }

    function sendMessageToStartCall() {
        var theUrl = original_source.replace("#PEERID#", peer_id.toString());
        console.log("sendMessageToStartCall(): ", theUrl /*JSON.stringify(options)*/);
        //making the https get call
        httpGetAsync(theUrl, httpGetAnswer);
    }

    function httpGetAsync(theUrl, callback) {
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.onreadystatechange = function () {
            console.log(xmlHttp.readyState);
            console.log(xmlHttp.status);

            if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
                callback(xmlHttp.responseText);
                if(camera_id == 1) {
                    $('.video__container.front__container .stream__notifitation.btn__notification.active').fadeOut(500, function() {
                        $(this).removeClass('active')
                    });
                    if (!recStream.front_view) {
                        $('.video__container.front__container .rec__btn').addClass('active');
                    }
                } else {
                    $('.video__container.back__container .stream__notifitation.btn__notification.active').fadeOut(500, function() {
                        $(this).removeClass('active')
                    });
                    if (!recStream.back_view) {
                        $('.video__container.back__container .rec__btn').addClass('active');
                    }
                }
            } else if (xmlHttp.readyState == 4) {
                console.log(xmlHttp.responseText);
                if(camera_id == 1) {
                    $('.video__container.front__container .play-btn').attr('value', 'Play');
                    $('.video__container.front__container .stream__notifitation.btn__notification').fadeIn(500, function() {
                        $(this).addClass('active')
                    });
                } else {
                    $('.video__container.back__container .play-btn').attr('value', 'Play');
                    $('.video__container.back__container .stream__notifitation.btn__notification').fadeIn(500, function() {
                        $(this).addClass('active')
                    });
                }
                if (socket_connection_timer) {
                    clearTimeout(socket_connection_timer);
                }
                if (!restarted) {
                    restarted = true;
                    restart_webrtc_video(video_id);
                }
            }
        }
        xmlHttp.open("GET", theUrl, true); // true for asynchronous
        xmlHttp.send(null);
    }

    function onServerMessage(event) {
        console.log("Received " + event.data);
        switch (event.data) {
            default:
                if (event.data.startsWith("ERROR")) {
                    handleIncomingError(event.data);
                    return;
                }
                if (event.data.startsWith("HELLO")) {
                    var arr = event.data.split(" ");
                    peer_id = arr[1];
                    //document.getElementById("peer-id").textContent = peer_id;
                    setStatus("Registered with server, waiting for call");
                    sendMessageToStartCall();
                    return;
                }
                // Handle incoming JSON SDP and ICE messages
                try {
                    msg = JSON.parse(event.data);
                } catch (e) {
                    if (e instanceof SyntaxError) {
                        handleIncomingError("Error parsing incoming JSON: " + event.data);
                    } else {
                        handleIncomingError("Unknown error parsing response: " + event.data);
                    }
                    return;
                }

                // Incoming JSON signals the beginning of a call
                if (!peer_connection)
                    createCall(msg);

                if (msg.sdp != null) {
                    onIncomingSDP(msg.sdp);
                } else if (msg.ice != null) {
                    onIncomingICE(msg.ice);
                } else {
                    handleIncomingError("Unknown incoming JSON: " + msg);
                }
        }
    }

    function onServerClose(event) {
        //console.log(event);return;
        //alert('Server close');
        console.log('Server close');
        setStatus('Disconnected from server');

        
        resetVideo();

        if (peer_connection) {
            peer_connection.close();
            peer_connection = null;
        }
        if (event.reason != "stop") {
            // Reset after a second
            if (socket_connection_timer) {
                clearTimeout(socket_connection_timer);
            }
            //socket_connection_timer=window.setTimeout(websocketServerConnect, 3000);
            if (!restarted) {
                restarted = true;
                restart_webrtc_video(video_id);
            }
        }
    }

    function onServerError(event) {
        //alert('onServerError');
        setError("Unable to connect to server, did you add an exception for the certificate? " + JSON.stringify(event));
        // Retry after 3 seconds
        if (socket_connection_timer) {
            clearTimeout(socket_connection_timer);
        }
        //socket_connection_timer=window.setTimeout(websocketServerConnect, 3000);
        if (!restarted) {
            restarted = true;
            restart_webrtc_video(video_id);
        }
    }

    function getLocalStream() {
        var constraints;
        //var textarea = document.getElementById('constraints');
        //try {
        //    constraints = JSON.parse(textarea.value);
        //} catch (e) {
        //    console.error(e);
        //    setError('ERROR parsing constraints: ' + e.message + ', using default constraints');
        constraints = default_constraints;
        //}
        console.log(JSON.stringify(constraints));

        // Add local stream
        if (navigator.mediaDevices.getUserMedia) {
            return navigator.mediaDevices.getUserMedia(constraints);
        } else {
            errorUserMediaHandler();
        }
    }

    function websocketServerConnect() {
        connect_attempts++;
        if (false && connect_attempts > 3) {
            setError("Too many connection attempts, aborting. Refresh page to try again");
            return;
        }
        // Clear errors in the status span
        /*var span = document.getElementById("status");
        span.classList.remove('error');
        span.textContent = '';*/
        // Populate constraints
        //var textarea = document.getElementById('constraints');
        //if (textarea.value == '')
        //    textarea.value = JSON.stringify(default_constraints);
        // Fetch the peer id to use
        peer_id = default_peer_id || getOurId();
        console.log("peer_id is", peer_id);
        ws_port = ws_port || '8443';
        if (window.location.protocol.startsWith("file")) {
            ws_server = ws_server || "0.0.0.0";
        } else if (window.location.protocol.startsWith("http")) {
            ws_server = ws_server || window.location.hostname;
        } else {
            throw new Error("Don't know how to connect to the signalling server with uri" + window.location);
        }
        //ws_server="devmedia1.surfsolutions.com";
        ws_server = mediacore_domain;
        var ws_url = 'wss://' + ws_server + ':' + ws_port;
        setStatus("Connecting to server " + ws_url);
        var ws_options = {
            protocolVersion: 8,
            origin: 'https://0.0.0.0:8080',
            rejectUnauthorized: false
        };
        ws_conn = new WebSocket(ws_url);

        /* When connected, immediately register with the server */
        ws_conn.addEventListener('open', (event) => {
            //document.getElementById("peer-id").textContent = peer_id;
            ws_conn.send('HELLO ' + peer_id);
            setStatus("Registering with server");

            connect_attempts = 0;
        });
        ws_conn.addEventListener('error', function () {
            onServerError(camera_id);
        });
        ws_conn.addEventListener('message', onServerMessage);
        ws_conn.addEventListener('close', function () {
            onServerClose(camera_id);
        });
    }

    function destroy_webrtc() {

        resetVideo();
        if (socket_connection_timer) {
            clearTimeout(socket_connection_timer);
        }
        ws_conn.close(4000, "stop");
        if (peer_connection) {
            peer_connection.oniceconnectionstatechange = () => {
            };
            peer_connection.close();
            peer_connection = null;
        }
    }

    function onRemoteStreamAdded(event) {
        videoTracks = event.stream.getVideoTracks();
        audioTracks = event.stream.getAudioTracks();

        if (videoTracks.length > 0) {
            console.log('Incoming stream: ' + videoTracks.length + ' video tracks and ' + audioTracks.length + ' audio tracks');
            getVideoElement().srcObject = event.stream;
        } else {
            handleIncomingError('Stream with unknown tracks added, resetting');
        }
    }

    function errorUserMediaHandler() {
        setError("Browser doesn't support getUserMedia!");
    }

    function createCall(msg) {
        // Reset connection attempts because we connected successfully
        connect_attempts = 0;
        if (camera_id == 2) {
            $("#front_cam_desc").text("Front view - camera is online")
        } else {
            $("#back_cam_desc").text("Back view - camera is online")

        }
        console.log('Creating RTCPeerConnection');

        peer_connection = new RTCPeerConnection(rtc_configuration);
        peer_connection.onaddstream = onRemoteStreamAdded;
        /* Send our video/audio to the other peer */
        var browserInfo = getBrowserInfo();
        if (browserInfo.name.toLowerCase() == "safari") {
            local_stream_promise = getLocalStream().then((stream) => {
                console.log('Adding local stream');
                peer_connection.addStream(stream);
                return stream;
            }).catch(setError);
        } else {
            local_stream_promise = new Promise(function (resolve, reject) {
                resolve()
            });
        }

        if (!msg.sdp) {
            console.log("WARNING: First message wasn't an SDP message!?");
        }

        peer_connection.onicecandidate = (event) => {
            // We have a candidate, send it to the remote party with the
            // same uuid
            if (event.candidate == null) {
                console.log("ICE Candidate was null, done");
                return;
            }
            ws_conn.send(JSON.stringify({'ice': event.candidate}));
        };
        peer_connection.oniceconnectionstatechange = (event) => {
            console.log(event);
            console.log(peer_connection);
            if (peer_connection && peer_connection.iceConnectionState) {
                console.log(peer_connection.iceConnectionState);
                if (peer_connection.iceConnectionState == 'failed') {
                    peer_connection.oniceconnectionstatechange = () => {
                    };
                    if (!restarted) {
                        restarted = true;
                        restart_webrtc_video(video_id);
                    }
                }
            }
            //alert('peer connection state change')
        }
        setStatus("Created peer connection for call, waiting for SDP");
    }

    websocketServerConnect();
    video_data.websocketServerConnect = websocketServerConnect;
    video_data.destroy_webrtc = destroy_webrtc;
    videos_list[video_id] = video_data;
    return video_data;
}

function destroy_video_webrtc(video_id) {
    if (videos_list[video_id] !== undefined) {
        var video_data = videos_list[video_id];
        video_data.destroy_webrtc();
        delete videos_list[video_id];
    }
}

function restart_webrtc_video(video_id, caller) {
    /*if(videos_list[video_id] !== undefined)
    {
        var video_data=videos_list[video_id];
        destroy_video_webrtc(video_id);
        setTimeout(()=>{
            create_video_webrtc(video_data);
        })
    }*/
    var cusDiv = document.getElementById('cusDiv');
    var event = new CustomEvent('restart_video', {
        detail: {
            video_id: video_id
        }
    });
    cusDiv.dispatchEvent(event);
}

function getBrowserInfo() {
    var ua = navigator.userAgent, tem,
        M = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
    var NameBrowser = undefined;
    var VersionBrowser = undefined;

    if (/trident/i.test(M[1])) {
        tem = /\brv[ :]+(\d+)/g.exec(ua) || [];
        NameBrowser = 'IE';
        VersionBrowser = (tem[1] || '');
    }

    if (M[1] === 'Chrome') {
        tem = ua.match(/\bOPR|Edge\/(\d+)/)

        if (tem == null) {//Chrome
            NameBrowser = M[1];
            VersionBrowser = M[2];
        } else {
            if (tem[0].indexOf("Edge") > -1) {//Edge
                NameBrowser = 'Edge';
                VersionBrowser = tem[1];
            } else {// if(tem != null)
                NameBrowser = tem[0];

                if (tem[1] != undefined)
                    VersionBrowser = tem[1];

                else {
                    if (NameBrowser == "OPR")//Opera
                        VersionBrowser = tem.input.substring(tem.input.indexOf("OPR/") + 4);
                }//else
            }//else
        }//else
    }//if(M[1]==='Chrome')

    else {//Firefox
        M = M[2] ? [M[1], M[2]] : [navigator.appName, navigator.appVersion, '-?'];
        if ((tem = ua.match(/version\/(\d+)/i)) != null) {
            M.splice(1, 1, tem[1]);
        }
        NameBrowser = M[0];
        VersionBrowser = M[1];
    }

    // Look for OS-Name
    var firstBracket = ua.indexOf("(");
    var secondBracket = ua.indexOf(")");
    var NameOS = ua.substring(firstBracket + 1, secondBracket);
    var isDesktop = false;
    ["linux", "windows", "mac"].forEach(function (os) {
        if (NameOS.toLowerCase().includes(os.toLowerCase())) {
            isDesktop = true;
        }
    });
    ["android", "iphone"].forEach(function (os) {
        if (NameOS.toLowerCase().includes(os.toLowerCase())) {
            isDesktop = false;
        }
    });
    //MyPrint("getBrowserInfo() name is '" + NameBrowser + "', version is '" + VersionBrowser + "', os is '" + NameOS + "'");
    return {
        name: NameBrowser,
        version: VersionBrowser,
        os: NameOS,
        isDesktop: isDesktop
    };
}