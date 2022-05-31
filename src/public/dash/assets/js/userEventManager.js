function getManagerEvent() {
    var data = {};
    AjaxController('getManagerEvent', data, dashUrl, 'getManagerEventHandler', 'getManagerEventHandler', true);
}
function scrollModalFast(el) {
    var box = $(el).closest('.modal .modal-body');
    if ($(el).hasClass('up')) {
        box.scrollTop(0);
    } else {
        box.scrollTop(box[0].scrollHeight);
    }
}
function getManagerEventHandler(response) {
    c('getManagerEventHandler');
    if (response.code === '000') {
        c(response.data);
        $.each(response.data, function (k, d) {
            if (d.action === 'newOrder') {
                var data = jQuery.parseJSON(d.data);
                c(data);
                var header = 'You have new order #' + data.orderId;
                var content = `
                        <div class="new-order-agreemens container-fluid">
                            <button class="fast_move" onclick="scrollModalFast(this);"><i class="fa fa-arrow-down"></i><i class="fa fa-arrow-up"></i></button>
                            <div class="style-agreemens-block"></div>
                            <div class="lease-block"></div>
                            <div class="service-agreemens-block"></div>
                            <div class="camera-block"></div>
                        </div>
                        <div class="row">
                            <div class="col-sm-6 text-center text-md-left mb-1 hidden-xs">
                                <button class="btn btn-default btn-cancel-lees" data-eventid="${d.id}" onclick="cancelManagerOrder(this,${data.orderId});" style="display:none;">Cancel order</button>
                            </div>
                            <div class="col-sm-6 text-center text-md-right mb-1">
                                <button class="btn btn-default btn-agree-lees" data-eventid="${d.id}" onclick="agreeManagerOrder(this,${data.orderId});" style="display:none;">I Agree</button>
                            </div>
                            <div class="col-sm-6 text-center mb-1 visible-xs">
                                <button class="btn btn-default btn-cancel-lees" data-eventid="${d.id}" onclick="cancelManagerOrder(this,${data.orderId});" style="display:none;">Cancel order</button>
                            </div>
                        </div>
                    `;

                showModal(header, content, 'new-order-agreemens_' + data.orderId, 'modal-lg agreemens-global-modal');
                var $orderAgreemensModal = $('#new-order-agreemens_' + data.orderId);
                $orderAgreemensModal.find('.modal-backdrop').removeAttr('data-dismiss');
                $orderAgreemensModal.find('.modal-header .close').remove();

                $orderAgreemensModal.find('.modal-body .new-order-agreemens .style-agreemens-block').load('/frontend/pages/include/leaseAndServiceAgreement.php #style-agreemens');
                var orderType = data.orderType;//'month';
                // console.log("ORDER TYPE 1", orderType);
                var orderCameraType = data.orderCameraType;
                if (orderType != null) {
                    if (orderType == 0 || orderType == 3 || orderType == 4 || orderType == 5) {
                        $orderAgreemensModal.find('.modal-body .new-order-agreemens .lease-block').load('/frontend/pages/include/leaseAndServiceAgreement.php #equipment-lease-1month');
                    } else if (orderType == 1 || orderType == 2) {
                        $orderAgreemensModal.find('.modal-body .new-order-agreemens .lease-block').load('/frontend/pages/include/leaseAndServiceAgreement.php #equipment-lease-1years');
                    } else if (orderType == 13 || orderType == 19) {
                        $orderAgreemensModal.find('.modal-body .new-order-agreemens .lease-block').load('/frontend/pages/include/leaseAndServiceAgreement.php #equipment-lease-new-1years');
                    }

                    if (['9', '10', '11', '14', '15', '16', '17'].includes(orderType)) {
                        $orderAgreemensModal.find('.modal-body .new-order-agreemens .lease-block').load('/frontend/pages/include/leaseAndServiceAgreement.php #purchase');
                        $orderAgreemensModal.find('.modal-body .new-order-agreemens .service-agreemens-block').load('/frontend/pages/include/leaseAndServiceAgreement.php #new-saas', `orderType=${orderType}`, function () {
                            $orderAgreemensModal.find('.modal-body').scroll(function () {
                                var box = $(this);
                                var scrheight = box[0].scrollHeight;
                                var height = box.height();
                                var cur = box.scrollTop();
                                if (height + cur + 50 > scrheight) {
                                    $('.fast_move').addClass('up');
                                } else {
                                    $('.fast_move').removeClass('up');
                                }
                            });
                        });
                    } else if (orderType == 12 || orderType == 18) {
                        $orderAgreemensModal.find('.modal-body .new-order-agreemens .lease-block').load('/frontend/pages/include/leaseAndServiceAgreement.php #purchase3');
                        $orderAgreemensModal.find('.modal-body .new-order-agreemens .service-agreemens-block').load('/frontend/pages/include/leaseAndServiceAgreement.php #new-saas', `orderType=${orderType}`, function () {
                            $('.lease-and-agreement-popup').closest('#lease-and-agreement-popup .modal-body').scroll(function(){
                                var box = $(this);
                                var scrheight = box[0].scrollHeight;
                                var height = box.height();
                                var cur = box.scrollTop();
                                if(height + cur + 50 > scrheight){
                                    $('.fast_move').addClass('up');
                                }else{
                                    $('.fast_move').removeClass('up');
                                }
                            });
                        });
                    } else if (orderType == 13 || orderType == 19) {
                        $orderAgreemensModal.find('.modal-body .new-order-agreemens .service-agreemens-block').load('/frontend/pages/include/leaseAndServiceAgreement.php #new-saas-order13', `orderType=${orderType}`, function () {
                            $('.lease-and-agreement-popup').closest('#lease-and-agreement-popup .modal-body').scroll(function(){
                                var box = $(this);
                                var scrheight = box[0].scrollHeight;
                                var height = box.height();
                                var cur = box.scrollTop();
                                if(height + cur + 50 > scrheight){
                                    $('.fast_move').addClass('up');
                                }else{
                                    $('.fast_move').removeClass('up');
                                }
                            });
                        });
                    } else {
                        $orderAgreemensModal.find('.modal-body .new-order-agreemens .service-agreemens-block').load('/frontend/pages/include/leaseAndServiceAgreement.php #service-agreement', `orderType=${orderType}`, function () {
                            $orderAgreemensModal.find('.modal-body').scroll(function () {
                                var box = $(this);
                                var scrheight = box[0].scrollHeight;
                                var height = box.height();
                                var cur = box.scrollTop();
                                if (height + cur + 50 > scrheight) {
                                    $('.fast_move').addClass('up');
                                } else {
                                    $('.fast_move').removeClass('up');
                                }
                            });
                        });
                    }



                }
                if (orderCameraType == 6 || orderCameraType == 7 || orderCameraType == 8) {
                    $orderAgreemensModal.find('.modal-body .new-order-agreemens .camera-block').load('/frontend/pages/include/leaseAndServiceAgreement.php #camera-agreement');
                }
                setTimeout(function () {
                    $orderAgreemensModal.find('.modal-body button').show();
                }, 1000);
            } else if(d.action === 'eldTariffChange') {
                var data = jQuery.parseJSON(d.data);
                c(data);
                var header = 'You have new tariff change request #' + data.requestId;
                var content = `
                        <div class="new-order-agreements container-fluid">
                            <button class="fast_move" onclick="scrollModalFast(this);"><i class="fa fa-arrow-down"></i><i class="fa fa-arrow-up"></i></button>
                            <div class="style-agreements-block"></div>
                            <div class="lease-block"></div>
                            <div class="service-agreements-block"></div>
                            <div class="camera-block"></div>
                        </div>
                        <div class="row">
                            <div class="col-sm-6 text-center text-md-left mb-1 hidden-xs">
                                <button class="btn btn-default btn-cancel-lees btn-lock-double-clicks" data-event_id="${d.id}" data-status="2" data-id="${data.requestId}" onclick="eldAdminTariffRequests.btnUserConfirm(this);" style="display:none;">Cancel tariff change</button>
                            </div>
                            <div class="col-sm-6 text-center text-md-right mb-1">
                                <button class="btn btn-default btn-agree-lees btn-lock-double-clicks" data-event_id="${d.id}" data-status="1" data-id="${data.requestId}" onclick="eldAdminTariffRequests.btnUserConfirm(this);" style="display:none;">I Agree</button>
                            </div>
                            <div class="col-sm-6 text-center mb-1 visible-xs">
                                <button class="btn btn-default btn-cancel-lees btn-lock-double-clicks" data-event_id="${d.id}" data-status="2" data-id="${data.requestId}" onclick="eldAdminTariffRequests.btnUserConfirm(this);" style="display:none;">Cancel tariff change</button>
                            </div>
                        </div>
                    `;
                showModal(header, content, 'tariff-change-agreements_' +  data.requestId, 'modal-lg agreemens-global-modal');

                var $agreementsModal = $('#tariff-change-agreements_' + data.requestId);
                $agreementsModal.find('.modal-backdrop').removeAttr('data-dismiss');
                $agreementsModal.find('.modal-header .close').remove();

                $agreementsModal.find('.modal-body .new-order-agreements .style-agreements-block').load('/frontend/pages/include/leaseAndServiceAgreement.php #style-agreements');
                var orderType = data.tariffId;//'month';
                // console.log("ORDER TYPE 2", orderType);
                // var orderCameraType = data.orderCameraType;
                if (orderType != null) {
                    if (orderType == 0 || orderType == 3 || orderType == 4 || orderType == 5) {
                        $agreementsModal.find('.modal-body .new-order-agreements .lease-block').load('/frontend/pages/include/leaseAndServiceAgreement.php #equipment-lease-1month');
                    } else if (orderType == 1 || orderType == 2) {
                        $agreementsModal.find('.modal-body .new-order-agreements .lease-block').load('/frontend/pages/include/leaseAndServiceAgreement.php #equipment-lease-1years');
                    } else if (orderType == 13) {
                        $agreementsModal.find('.modal-body .new-order-agreements .lease-block').load('/frontend/pages/include/leaseAndServiceAgreement.php #equipment-lease-new-1years');
                    }

                    if (['9','10','11','15','16','17'].includes(orderType)) {
                        $agreementsModal.find('.modal-body .new-order-agreements .lease-block').load('/frontend/pages/include/leaseAndServiceAgreement.php #purchase');
                        $agreementsModal.find('.modal-body .new-order-agreements .service-agreements-block').load('/frontend/pages/include/leaseAndServiceAgreement.php #new-saas', `orderType=${orderType}`, function () {
                            $agreementsModal.find('.modal-body').scroll(function(){
                                var box = $(this);
                                var scrheight = box[0].scrollHeight;
                                var height = box.height();
                                var cur = box.scrollTop();
                                if(height + cur + 50 > scrheight){
                                    $('.fast_move').addClass('up');
                                }else{
                                    $('.fast_move').removeClass('up');
                                }
                            });
                        });
                    } else if (orderType == 12 || orderType == 18) {
                        $agreementsModal.find('.modal-body .new-order-agreements .lease-block').load('/frontend/pages/include/leaseAndServiceAgreement.php #purchase3');
                        $agreementsModal.find('.modal-body .new-order-agreements .service-agreements-block').load('/frontend/pages/include/leaseAndServiceAgreement.php #new-saas', `orderType=${orderType}`, function () {
                            $('.lease-and-agreement-popup').closest('#lease-and-agreement-popup .modal-body').scroll(function(){
                                var box = $(this);
                                var scrheight = box[0].scrollHeight;
                                var height = box.height();
                                var cur = box.scrollTop();
                                if(height + cur + 50 > scrheight){
                                    $('.fast_move').addClass('up');
                                }else{
                                    $('.fast_move').removeClass('up');
                                }
                            });
                        });
                    } else if (orderType == 13 || orderType == 19) {
                        $agreementsModal.find('.modal-body .new-order-agreements .lease-block').load('/frontend/pages/include/leaseAndServiceAgreement.php #purchase');
                        $agreementsModal.find('.modal-body .new-order-agreements .service-agreements-block').load('/frontend/pages/include/leaseAndServiceAgreement.php #new-saas-order13', `orderType=${orderType}`, function () {
                            $('.lease-and-agreement-popup').closest('#lease-and-agreement-popup .modal-body').scroll(function(){
                                var box = $(this);
                                var scrheight = box[0].scrollHeight;
                                var height = box.height();
                                var cur = box.scrollTop();
                                if(height + cur + 50 > scrheight){
                                    $('.fast_move').addClass('up');
                                }else{
                                    $('.fast_move').removeClass('up');
                                }
                            });
                        });
                    } else {
                        $agreementsModal.find('.modal-body .new-order-agreements .service-agreements-block').load('/frontend/pages/include/leaseAndServiceAgreement.php #service-agreement', `orderType=${orderType}`, function () {
                            $agreementsModal.find('.modal-body').scroll(function () {
                                var box = $(this);
                                var scrheight = box[0].scrollHeight;
                                var height = box.height();
                                var cur = box.scrollTop();
                                if (height + cur + 50 > scrheight) {
                                    $('.fast_move').addClass('up');
                                } else {
                                    $('.fast_move').removeClass('up');
                                }
                            });
                        });
                    }
                }
                setTimeout(function () {
                    $agreementsModal.find('.modal-body button').show();
                }, 1000);

            }
        });
    }
}

function agreeManagerOrder(el, orderId) {
    $('.btn-cancel-lees, .btn-agree-lees').attr('disabled', true);
    var onePartBox = $(el).closest('#new-order-agreemens_' + orderId);
    var eventId = $(el).attr('data-eventid');

    var data = {};
    data.eventId = eventId;
    data.act = 'newOrder';
    data.cancel = 0;
    data.orderId = orderId;
    AjaxController('removeManagerEvent', data, dashUrl, removeManagerEventHandler, removeManagerEventHandler, true);
}

function cancelManagerOrder(el, orderId) {
    var eventId = $(el).attr('data-eventid');
    var header = 'Remove order #' + orderId;
    var content = '<p class="text-center">Are you sure you want to cancel and remove the order(s)?</p>';
    var footerButtons = '<button class="btn btn-default" onclick="agreeCancelManagerOrder(this, ' + eventId + ',' + orderId + ');">Confirm</button>';
    footerButtons += '<button class="btn btn-default" data-dismiss="modal">Close</button>';
    showModal(header, content, 'confirmationCancelManagerOrder', '', {footerButtons: footerButtons});
}

function agreeCancelManagerOrder(e, eventId, orderId) {
    $(e).attr('disabled', true);
    var data = {
        eventId: eventId,
        act: 'newOrder',
        cancel: 1,
        orderId: orderId
    };
    AjaxController('removeManagerEvent', data, dashUrl, removeManagerEventHandler, removeManagerEventHandler, true);
}

function removeManagerEventHandler(response) {
    if (typeof response.data.orderId !== 'undefined') {
        $('#new-order-agreemens_' + response.data.orderId).modal('hide');
    } else {
        $('.modal').modal('hide');
    }
    $('#confirmationCancelManagerOrder').modal('hide');
    finances.refreshCardsData();
    $('.btn-cancel-lees, .btn-agree-lees').removeAttr('disabled');
}
