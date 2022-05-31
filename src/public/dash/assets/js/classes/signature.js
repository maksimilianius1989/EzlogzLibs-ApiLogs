var signatureClass = function () {
    var self = this;
    
    this.mousePressed = false;
    this.lastX;
    this.lastY;
    this.canvasId; 
    this.imageContId; // container id for image after save
    this.signatureBlockId; // container id of "draw-signature-block"
    this.canvas; 
    this.ctx;

    // Set up mouse events for drawing
    this.drawing = false;
    this.mousePos = { x:0, y:0 };
    this.lastPos = { x:0, y:0 };
    
    this.driverId;
    this.saveFunction = false; // function for save Signature
    
    this.initSignature = function(canvasAttrId) {
        self.canvasId = '#'+canvasAttrId;
        self.canvas = document.getElementById(canvasAttrId);
        self.initSignatureDraw();
    }
    this.initSignatureDraw = function() {
        self.ctx = self.canvas.getContext("2d");
        //settings
        self.ctx.strokeStyle = 'black';
        self.ctx.lineWidth = 3;
        self.ctx.lineJoin = "round";

        self.canvas.addEventListener("mousedown", function (e) {
            self.drawing = true;
            self.lastPos = self.getMousePos(self.canvas, e);
            $(self.canvasId).closest('.canvas-block').removeClass('error');
        }, false);
        self.canvas.addEventListener("mouseup", function (e) {
            self.drawing = false;
        }, false);
        self.canvas.addEventListener("mousemove", function (e) {
            self.mousePos = self.getMousePos(self.canvas, e);
        }, false);

        // Set up touch events for mobile, etc
        self.canvas.addEventListener("touchstart", function (e) {
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
    this.getMousePos = function(canvasDom, mouseEvent) {
        var rect = canvasDom.getBoundingClientRect();
        return {
            x: mouseEvent.clientX - rect.left,
            y: mouseEvent.clientY - rect.top
        };
    }

    // Get the position of a touch relative to the canvas
    this.getTouchPos = function(canvasDom, touchEvent) {
        var rect = canvasDom.getBoundingClientRect();
        return {
            x: touchEvent.touches[0].clientX - rect.left,
            y: touchEvent.touches[0].clientY - rect.top
        };
    }
    this.createSignature = function(el) {
        c(el);
        c($(el).data('blockid'));
        if (el && $(el).data('blockid')) {
            $('#'+$(el).data('blockid')).toggle();
        } else $('.draw-signature-block').toggle();
    }
    // Draw to the canvas
    this.renderCanvas = function() {
        if (self.drawing) {
            self.ctx.moveTo(self.lastPos.x, self.lastPos.y);
            self.ctx.lineTo(self.mousePos.x, self.mousePos.y);
            self.ctx.stroke();
            self.lastPos = self.mousePos;
        }
    }
    this.clearArea = function(el) {
        $(self.canvasId).show();
        var signatureBlock = $(el).closest('.draw-signature-block');
        signatureBlock.find('.prev-signature').remove();
        signatureBlock.find('.signature_closest').val('0');
        self.canvas.width = self.canvas.width;
        self.initSignatureDraw();
    }
    this.saveSignature = function(el) {
        var signatureBlock = $(el).closest('.draw-signature-block');
        signatureBlock.find('.canvas-block').removeClass('error');
        if(signatureBlock.find('.prev-signature').length == 0) {
            if(!self.isCanvasTransparent()){
                signatureBlock.hide();
                var dataUrl = self.canvas.toDataURL('image/jpg');
                //c(dataUrl);
                AjaxController('uploadSignature', {imageArray: dataUrl}, dashUrl, function(response){
                    if(response.code == '000'){
                        signatureBlock.find('.signature_closest').val(response.data.signId);
                        $(self.imageContId).html('<img src="'+MAIN_LINK+'/docs/signatures/'+response.data.name+'" style="width:350px;" />');
                        if (self.saveFunction != false) {
                            self.saveFunction(response.data.signId, signatureBlock.find('.signature_closest').attr('id'));
                        }
                        // AjaxController('saveSignature', {date: logbook.currentDateString, signId: response.data.signId}, dashUrl, 'saveSignatureHandler', errorBasicHandler, true);
                    }
                }, errorBasicHandler, true);
            } else {
                c('tran');
                signatureBlock.find('.canvas-block').addClass('error');
            }
        } else {
            signatureBlock.hide();
            var signatureId = signatureBlock.find('.prev-signature').attr('data-id');
            signatureBlock.find('.signature_closest').val(signatureId);
            $(self.imageContId).html($('.prev-signature'));
            if (self.saveFunction != false) {
                self.saveFunction(signatureId, signatureBlock.find('.signature_closest').attr('id'));
            }
            // AjaxController('saveSignature', {date: logbook.currentDateString, signId: signatureId}, dashUrl, 'saveSignatureHandler', errorBasicHandler, true);
        }
    }
    this.saveSignatureCommon = function() {
        var signatureBlock = $(self.canvasId).closest('.draw-signature-block');
        if(signatureBlock.find('.prev-signature').length == 0 && !self.isCanvasTransparent()){
            var dataUrl = self.canvas.toDataURL('image/jpg');
            var data = {};
            data.imageArray = dataUrl;
            if (typeof self.driverId != 'undefined' || self.driverId != null) {
                data.driverId = self.driverId;
            }
            AjaxController('uploadSignature', data, dashUrl, function(response){
                if(response.code == '000'){
                    signatureBlock.find('.signature_closest').val(response.data.signId);
                }
            }, errorBasicHandler, true);
        }
    }
    this.validateSignature = function(el) {
        var ret = true; 
        var signatureBlock = $(el);
        signatureBlock.find('.canvas-block').removeClass('error');
        if(signatureBlock.find('.prev-signature').length == 0) {
            if(self.isCanvasTransparent()){
                signatureBlock.find('.canvas-block').addClass('error');
                ret = false;
            }
        }
        return ret;
    }
    
    this.usePrevious = function (el) {
        var signatureBlock = $(el).closest('.draw-signature-block');
        signatureBlock.find('.canvas-block').removeClass('error');

        var driverId = self.driverId || $('select[name="userId"]').val();
        AjaxController('getLastSignature', {driverId: driverId}, dashUrl, function (response) {
            if (response.code == '000') {
                if (response.data.signature != 0 && response.data.signatureId != 0) {
                    let signLink = MAIN_LINK + '/docs/signatures/' + response.data.signature;
                    if (response.data.signatureAWS) {
                        signLink = response.data.signatureAWS;
                    }
                    $(self.canvasId).hide();
                    $('.draw-signature-block .prev-signature').remove();
                    $(self.canvasId).before('<img src="' + signLink + '" class="prev-signature" data-id="' + response.data.signatureId + '" />');
                    signatureBlock.find('.signature_closest').val(response.data.signatureId);
                }
            }
        }, errorBasicHandler, true);
    }

    this.isCanvasTransparent = function() { // true if all pixels Alpha equals to zero
        c(self.canvasId);
        var ctx = self.canvas.getContext("2d");
        var imageData = ctx.getImageData(0, 0, self.canvas.offsetWidth, self.canvas.offsetHeight);
        for(var i=0;i<imageData.data.length;i+=4) {
            if(imageData.data[i+3]!==0) return false;
        }
        return true;
    }
}
// Get a regular interval for drawing to the screen
window.requestAnimFrame = (function (callback) {
    return window.requestAnimationFrame || 
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimaitonFrame ||
    function (callback) {
        window.setTimeout(callback, 1000/60);
    };
})();

