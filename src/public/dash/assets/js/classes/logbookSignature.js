function logbookSignatureClass() {
    var self = this;

    self.lastX;
    self.lastY;
    self.canvas;
    self.ctx;

    // Set up mouse events for drawing
    self.drawing = false;
    self.driver = 0;
    self.mousePos = {x: 0, y: 0};
    self.lastPos = self.mousePos;
    self.mainSignBlockId = '';

    self.initSignatureDraw = function (canvasId) {
        self.canvas = document.getElementById(canvasId);
        self.ctx = self.canvas.getContext("2d");
        //settings
        self.ctx.strokeStyle = 'black';
        self.ctx.lineWidth = 3;
        self.ctx.lineJoin = "round";

        self.canvas.addEventListener("mousedown", function (e) {
            $('.draw-signature-block .canvas-block').removeClass('error');
            self.drawing = true;
            self.lastPos = self.getMousePos(self.canvas, e);
        }, false);
        self.canvas.addEventListener("mouseup", function (e) {
            self.drawing = false;
        }, false);
        self.canvas.addEventListener("mousemove", function (e) {
            self.mousePos = self.getMousePos(self.canvas, e);
        }, false);

        // Set up touch events for mobile, etc
        self.canvas.addEventListener("touchstart", function (e) {
            $('.draw-signature-block .canvas-block').removeClass('error');
            self.mousePos = self.getTouchPos(self.canvas, e);
            var touch = e.touches[0];
            var mouseEvent = new MouseEvent("mousedown", {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            self.canvas.dispatchEvent(mouseEvent);
        }, false);
        self.canvas.addEventListener("touchend", function (e) {
            var mouseEvent = new MouseEvent("mouseup", {});
            self.canvas.dispatchEvent(mouseEvent);
        }, false);
        self.canvas.addEventListener("touchmove", function (e) {
            e.preventDefault();
            var touch = e.touches[0];
            var mouseEvent = new MouseEvent("mousemove", {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            self.canvas.dispatchEvent(mouseEvent);
        }, false);

    }

// Get the position of the mouse relative to the canvas
//https://github.com/bencentra/canvas/blob/master/signature/signature.js
    self.getMousePos = function (canvasDom, mouseEvent) {
        var rect = canvasDom.getBoundingClientRect();
        return {
            x: mouseEvent.clientX - rect.left,
            y: mouseEvent.clientY - rect.top
        };
    }

// Get the position of a touch relative to the canvas
    self.getTouchPos = function (canvasDom, touchEvent) {
        var rect = canvasDom.getBoundingClientRect();
        return {
            x: touchEvent.touches[0].clientX - rect.left,
            y: touchEvent.touches[0].clientY - rect.top
        };
    }

// Draw to the canvas
    self.renderCanvas = function () {
        if (self.drawing) {
            self.ctx.moveTo(self.lastPos.x, self.lastPos.y);
            self.ctx.lineTo(self.mousePos.x, self.mousePos.y);
            self.ctx.stroke();
            self.lastPos = self.mousePos;
        }
    }

    self.clearArea = function (canvasId) {
        if(typeof self.canvas == 'undefined'){
            self.initSignatureDraw(canvasId);
        }
        // Use the identity matrix while clearing the canvas
        $('#' + canvasId).show();
        $('.draw-signature-block .prev-signature').remove();
        $('#field_signature .edit_parameter b').replaceWith(`<b style="color: rgb(199, 69, 74);font-weight: 400;">No Signature</b>`);
        $('#signature').val('0');
        /*self.ctx.setTransform(1, 0, 0, 1, 0, 0);
         self.ctx.clearRect(0, 0, self.ctx.canvas.width, self.ctx.canvas.height);*/
        self.canvas.width = self.canvas.width;
        self.initSignatureDraw(canvasId);
    }
    
    self.usePrevious = function (canvasId) {
        var driverId = logbook.userId;
        AjaxController('getLastSignature', {driverId: driverId}, dashUrl, function (response) {
            c(response);
            if (response.code == '000') {
                if (response.data.signature != 0 && response.data.signatureId != 0) {
                    let signLink = MAIN_LINK + '/docs/signatures/' + response.data.signature;
                    if (response.data.signatureAWS) {
                        signLink = response.data.signatureAWS;
                    }
                    $('#'+canvasId).hide();
                    $('#'+canvasId).closest('.draw-signature-block').find('.prev-signature').remove();
                    $('#'+canvasId).before('<img src="' + signLink + '" class="prev-signature" data-id="' + response.data.signatureId + '" />');
                    $('#field_signature .edit_parameter b').replaceWith(`<b class="confirm"><img src="${MAIN_LINK}/docs/signatures/${response.data.signature}"></b>`);
                    $('#signature').val(response.data.signatureId);
                }
            }
        }, errorBasicHandler, true);
    }
    
    self.usePreviousLast = function(canvasId) {
        var driverId = logbook.userId;
        AjaxController('getLastSignature', {driverId: driverId}, dashUrl, function (response) {
            c(response);
            if (response.code == '000') {
                if (response.data.signature != 0 && response.data.signatureId != 0) {
                    c('tyti');
                    let signLink = MAIN_LINK + '/docs/signatures/' + response.data.signature;
                    if (response.data.signatureAWS) {
                        signLink = response.data.signatureAWS;
                    }
                    $('#'+canvasId).hide();
                    $('#'+canvasId).closest('.draw-signature-block').find('.prev-signature').remove();
//                    $('.popup_box_panel .draw-signature-block .prev-signature').remove();
                    $('#'+canvasId).before('<img src="' + signLink + '" class="prev-signature" data-id="' + response.data.signatureId + '" />');
                }
            }
        }, errorBasicHandler, true);
    }
    
    self.saveSignature = function (canvasId) {
        $('#'+canvasId).closest('.draw-signature-block').find('.canvas-block').removeClass('error');
        if ($('#'+canvasId).closest('.draw-signature-block').find('.prev-signature').length == 0) {
            if (!self.isCanvasTransparent(self.canvas)) {
                $('#'+canvasId).closest('.draw-signature-block').hide();
                var dataUrl = self.canvas.toDataURL('image/jpg');
                c(dataUrl);
                var data = {};
                data.imageArray = dataUrl;
                let dateStr = $('#cur_date').text();
                data.date = moment(dateStr).format('YYYY-MM-DD');
                var driverId = $('#select_carrier option:selected').attr('data-driverid') || $('.driver_row.active').attr('data-id');
                if(typeof driverId != 'undefined') {
                    data.driverId = driverId;
                }
                AjaxController('uploadSignature', data, dashUrl, self.uploadSignatureHandler, errorBasicHandler, true);
            } else {
                c('tran');
                $('#'+canvasId).closest('.draw-signature-block').find('.canvas-block').addClass('error');
            }
        } else {
            $('#'+canvasId).closest('.draw-signature-block').hide();
            c('Prev Signature');
            var signatureId = $('#'+canvasId).closest('.draw-signature-block').find('.prev-signature').attr('data-id');//replaceChild
            $('#signature').val(signatureId);
            if(self.driver) {
                AjaxController('saveSignature', {date: logbook.currentDateString, signId: signatureId}, dashUrl, self.saveSignatureHandler, errorBasicHandler, true);
            }
        }
    }
    
    self.uploadSignatureHandler = function (response) {
        c(response);
        if (response.code == '000') {
            $('#signature').val(response.data.signId);
            $('#field_signature .edit_parameter b').replaceWith(`<b class="confirm"><img src="${MAIN_LINK}/docs/signatures/${response.data.name}"></b>`);
            if(self.driver){
                AjaxController('saveSignature', {date: logbook.currentDateString, signId: response.data.signId}, dashUrl, self.saveSignatureHandler, errorBasicHandler, true);
            }
        }
    }
    
    self.saveSignatureHandler = function(response) {
        c(response);
        if(response.code == '000') {
            logbook.changeLogbook();
        }
    }
    
    self.showSignatureLast30DayPopup = function () {
        var header = `Sign last 30 day`;
        var content = `<div class="draw-signature-block">
            <div class="title">Create your signature</div>
            <div class="canvas-block">
                <canvas id="draw-signature-last" width="350" height="250" style="">
                    Your browser does not support Canvas
                </canvas>
            </div>
            <div class="draw-signature-button-block">
                <button class="btn btn-default clear-signature" onclick="logbookSignatureCl.clearArea('draw-signature-last');">Clear</button>
                <button class="btn btn-default clear-signature" onclick="logbookSignatureCl.usePreviousLast('draw-signature-last');">Use Previous</button>
                <button class="btn btn-default save-signature" onclick="logbookSignatureCl.sendSignatureLast30Day('draw-signature-last');">Save</button>
            </div>
        </div>`;
        showModal(header, content);
        self.initSignatureDraw('draw-signature-last');
        $('.modal .modal-body .draw-signature-block').show();
    }

    self.sendSignatureLast30Day = function (canvasId) {
        $('#'+canvasId).closest('.draw-signature-block').find('.canvas-block').removeClass('error');
        if ($('#'+canvasId).closest('.draw-signature-block').find('.prev-signature').length == 0) {
            if (!self.isCanvasTransparent(self.canvas)) {
                $('#'+canvasId).closest('.draw-signature-block').hide();
                var dataUrl = self.canvas.toDataURL('image/jpg');
                c(dataUrl);
                AjaxController('uploadSignature', {imageArray: dataUrl}, dashUrl, self.uploadSignatureLastHandler, errorBasicHandler, true);
            } else {
                c('tran');
                $('#'+canvasId).closest('.draw-signature-block').find('.canvas-block').addClass('error');
            }
        } else {
            var signatureId = $('#'+canvasId).closest('.draw-signature-block').find('.prev-signature').attr('data-id');
            var driverId = logbook.userId;
            var date = $('#datepicker').val();
            var data = {};
            data['signId'] = signatureId;
            data['driverId'] = driverId;
            data['date'] = convertDateToSQL(date);
            c(data);
            AjaxController('signatureLast30Day', data, dashUrl, self.sendSignatureLast30DayHandler, errorBasicHandler, true);
        }
    }
    
    self.uploadSignatureLastHandler = function (response) {
        c(response);
        if (response.code == '000') {
            var signatureId = response.data.signId;
            var driverId = logbook.userId;
            var date = $('#datepicker').val();
            var data = {};
            data['signId'] = signatureId;
            data['driverId'] = driverId;
            data['date'] = convertDateToSQL(date);
            c(data);
            AjaxController('signatureLast30Day', data, dashUrl, self.sendSignatureLast30DayHandler, errorBasicHandler, true);
        }
    }

    self.sendSignatureLast30DayHandler = function (response) {
        c(response);
        $('.modal .modal-header button.close').click();
        logbook.changeLogbook();
    }

    self.saveSignature1 = function (canvasId) {
        $('#'+canvasId).closest('.draw-signature-block').find('.canvas-block').removeClass('error');
        if ($('#'+canvasId).closest('.draw-signature-block').find('.prev-signature').length == 0) {
            if (!self.isCanvasTransparent(self.canvas)) {
                $('.draw-signature-block').hide();
                var dataUrl = self.canvas.toDataURL('image/jpg');
                c(dataUrl);
                AjaxController('uploadSignature', {imageArray: dataUrl}, dashUrl, self.uploadSignatureHandler, errorBasicHandler, true);
            } else {
                c('tran');
                $('.draw-signature-block .canvas-block').addClass('error');
            }
        } else {
            if ($('.popup_box_panel .draw-signature-block').length == 0) {
                $('.draw-signature-block').hide();
                c('Prev Signature');
                var signatureId = $('.draw-signature-block .prev-signature').attr('data-id');//replaceChild
                $('#signature').val(signatureId);
//            AjaxController('saveSignature', {date: logbook.currentDateString, signId: signatureId}, dashUrl, 'saveSignatureHandler', errorBasicHandler, true);
            } else {
                var signatureId = $('.draw-signature-block .prev-signature').attr('data-id');
                sendSignatureLast30Day(signatureId);
            }
        }
    }

    self.createSignature = function () {
        $('.draw-signature-block').toggle();
    }

    self.isCanvasTransparent = function (canvas) { // true if all pixels Alpha equals to zero
        var ctx = canvas.getContext("2d");
        var imageData = ctx.getImageData(0, 0, canvas.offsetWidth, canvas.offsetHeight);
        for (var i = 0; i < imageData.data.length; i += 4)
            if (imageData.data[i + 3] !== 0)
                return false;
        return true;
    }
    
    self.checkIfThisCanvas = function(el) {
        c($(el).attr('id'));
        if($(el).attr('id') != self.canvas.id){
            self.drawing = false;
            self.initSignatureDraw($(el).attr('id'));
        }
    }

}

logbookSignatureCl = new logbookSignatureClass();

// Get a regular interval for drawing to the screen
window.requestAnimFrame = (function (callback) {
    return window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.oRequestAnimationFrame ||
            window.msRequestAnimaitonFrame ||
            function (callback) {
                window.setTimeout(callback, 1000 / 60);
            };
})();
// Allow for animation
(function drawLoop() {
    requestAnimFrame(drawLoop);
    logbookSignatureCl.renderCanvas();
})();