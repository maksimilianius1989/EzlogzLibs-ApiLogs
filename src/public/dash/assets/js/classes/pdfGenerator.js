function pdfGenerator() {
    var self = this;
    self.timer = {};
    self.preloader = false;
    self.download = true;
    self.ajaxData = false;
    self.safaryOneSecondPassed = false;
    self.generateAndSendForm = function (params, ajaxParams = false) {
        params.initiator = curUserId;
        params.web = 1;
        if (!ajaxParams) {
            if (navigator.userAgent == 'ezlogz_dash_app') {
                params.returnUrl = true;
                $("body").css("cursor", "progress");
                $.ajax({
                    url: EZPDF_LINK + '/index.php',
                    async: false,
                    method: "POST",
                    contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
                    data: params,
                    success: function (response) {
                        $("body").css("cursor", "default");
                        var url = /*EZPDF_LINK + '/' +*/ response;
                        window.open(url, '_blank', 'location=yes');
                    }
                });
            } else {
                $("#pdf_form_new").remove();
                $('body').append('<form action="' + EZPDF_LINK + '/index.php" method="post" target="_blank" id="pdf_form_new"></form>')
                $.each(params, function (key, val) {
                    val = String(val).replace(/\\n/g, "\\n")
                        .replace(/\\'/g, "\\'")
                        .replace(/\\"/g, '\\"')
                        .replace(/\\&/g, "\\&")
                        .replace(/\\r/g, "\\r")
                        .replace(/\\t/g, "\\t")
                        .replace(/\\b/g, "\\b")
                        .replace(/\\f/g, "\\f");
                    $("#pdf_form_new").append("<input type='text' name='" + key + "' value='" + val + "'/>");
                });
                $("#pdf_form_new").submit();
                $("#pdf_form_new").remove();
            }
        } else {
            var apiURL = typeof ajaxParams.apiURL != 'undefined' && ajaxParams.apiURL != '' ? ajaxParams.apiURL : MAIN_LINK + '/db/api/apiPDFController.php';
            var action = '';
            if (typeof ajaxParams.action != 'undefined' && ajaxParams.action != '') {
                action = ajaxParams.action;
            } else {
                return false;
            }
			
            var is_safari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
            if(is_safari){
                self.ajaxData = false;
                self.safaryOneSecondPassed = false;
                setTimeout(function(){
                    if(self.ajaxData == false){
                        self.safaryOneSecondPassed = true;
                    }else{
                        $("#pdf_form_new").remove();
                        $('body').append('<form action="' + EZPDF_LINK + '/readPDF.php" method="post" target="_blank" id="pdf_form_new"><input type="text" name="pdfURL" value="'+self.ajaxData+'"/></form>');
                        $("#pdf_form_new").submit();
                        $("#pdf_form_new").remove();
                    }
                }, 1000);
                AjaxController(action, params, apiURL, self.generateAndSendFormHandler, errorBasicHandler, true);
            }else
                AjaxController(action, params, apiURL, self.generateAndSendFormHandler, errorBasicHandler, true);
            if (self.preloader) {
                $('#gifBox').fadeIn(500);
            }
        }
    }
    
    self.generateAndSendFormHandler = function(response) {
        if (self.preloader) {
            $('#gifBox').fadeOut(500);
            self.preloader = false;
        }
        if (self.download) {
        if (navigator.userAgent == 'ezlogz_dash_app') {
            $("body").css("cursor", "default");
            var url = /*EZPDF_LINK + '/' +*/ response.data.result;
            window.open(url, '_blank', 'location=yes');
        } else {
            self.ajaxData = response.data.result;
            $("#pdf_form_new").remove();
            if(self.safaryOneSecondPassed){
                $('body').append('<form action="' + EZPDF_LINK + '/readPDF.php" method="post" id="pdf_form_new"><input type="text" name="pdfURL" value="'+response.data.result+'"/></form>');
            }else{
                $('body').append('<form action="' + EZPDF_LINK + '/readPDF.php" method="post" target="_blank" id="pdf_form_new"><input type="text" name="pdfURL" value="'+response.data.result+'"/></form>');
            }
            $("#pdf_form_new").submit();
            $("#pdf_form_new").remove();
        }
    }
}
    
    self.toggleProgressBar = function () {
        var footer = $('footer.dash_footer');
        footer.find('.progressbar-block .progressbar-body').toggle();
    }
    
    self.removeProgressBarBlock = function () {
        $('footer.dash_footer .progressbar-block').remove();
    }
    
    self.generateProgressBarBlock = function () {
        var footer = $('footer.dash_footer');
        var content = '<div class="progressbar-block">\n\
                            <div class="progressbar-header">\n\
                                <p class="title">In process, wait please</p>\n\
                                <div class="action-block">\n\
                                    <i class="fa fa-fw fa-angle-down" onclick="pdfGen.toggleProgressBar();"></i>\n\
                                    <i class="fa fa-fw fa-times" onclick="pdfGen.removeProgressBarBlock();"></i>\n\
                                </div>\n\
                            </div>\n\
                            <div class="progressbar-body"></div>\n\
                        </div>';
        if (footer.find('.progressbar-block').length == 0) {
            footer.append(content);
        }
    }
    
    self.generateOneProgressBarBlock = function (progressData) {
        var progressBarBody = $('footer.dash_footer .progressbar-block .progressbar-body');
        
        var title = 'Preparing data';
        var progress = 0;
        var progressText = progress+'%';
        
        if (progressData.type == 'start') {
            progress = 0;
            progressText = progress.toFixed(2)+'%';
        } else if (progressData.type == 'progress') {
            progress = (progressData.value * 70) / progressData.countDay;
            progressText = progress.toFixed(2)+'%';
        } else if (progressData.type == 'end') {
            progress = 70;
            progressText = progress.toFixed(2)+'%';
        } else if (progressData.type == 'draw') {
            title = 'Creating PDF file';
            progress = 70;
            progressText = progress.toFixed(2)+'%';
        } else if (progressData.type == 'endDraw') {
            title = 'Success';
            progress = 100;
            progressText = progress.toFixed(2)+'% Success';
        }
        
        if (progressBarBody.find('.one-progress-block[data-uniqid="'+progressData.uniqueId+'"]').length == 0) {
            progressBarBody.append('<div class="one-progress-block" data-uniqid="'+progressData.uniqueId+'">\n\
                                        <div class="title">'+title+'</div>\n\
                                        <div class="progress">\n\
                                            <div class="progress-bar" role="progressbar" aria-valuenow="'+progress.toFixed(2)+'" aria-valuemin="0" aria-valuemax="100" style="width: '+progress.toFixed(2)+'%;">'+progressText+'</div>\n\
                                        </div>\n\
                                    </div>');
        } else {
            progressBarBody.find('.one-progress-block[data-uniqid="'+progressData.uniqueId+'"] .title').text(title);
            progressBarBody.find('.one-progress-block[data-uniqid="'+progressData.uniqueId+'"] .progress .progress-bar').attr('aria-valuenow', progress.toFixed(2));
            progressBarBody.find('.one-progress-block[data-uniqid="'+progressData.uniqueId+'"] .progress .progress-bar').css({width: progress.toFixed(2)+'%'});
            progressBarBody.find('.one-progress-block[data-uniqid="'+progressData.uniqueId+'"] .progress .progress-bar').text(progressText);
        }
        
        if (progressData.type == 'draw') {
            var amountOfTimeToDraw = progressData.countDay * 0.3;
            c(amountOfTimeToDraw);
            var thirtyPercent = (progressData.countDay * 30) / 100;
            var drawProgress = 70;
            
            pdfGen.timer[progressData.uniqueId] = setInterval(function () {
                drawProgress += (thirtyPercent / 100);
                c(drawProgress);
                if (progressBarBody.find('.one-progress-block[data-uniqid="'+progressData.uniqueId+'"]').length > 0) {
                    progressBarBody.find('.one-progress-block[data-uniqid="'+progressData.uniqueId+'"] .progress .progress-bar').attr('aria-valuenow', drawProgress.toFixed(2));
                    progressBarBody.find('.one-progress-block[data-uniqid="'+progressData.uniqueId+'"] .progress .progress-bar').css({width: drawProgress.toFixed(2)+'%'});
                    progressBarBody.find('.one-progress-block[data-uniqid="'+progressData.uniqueId+'"] .progress .progress-bar').text(drawProgress.toFixed(2)+'%');
                }
            }, (amountOfTimeToDraw/100)*1000);

            setTimeout(function () {
                clearInterval(pdfGen.timer[progressData.uniqueId]);
                delete pdfGen.timer[progressData.uniqueId];
            }, amountOfTimeToDraw*1000);
        }
        
        if (progressData.type == 'endDraw') {
            c('EndDraw');
            clearInterval(pdfGen.timer[progressData.uniqueId]);
            delete pdfGen.timer[progressData.uniqueId];
            if (progressBarBody.find('.one-progress-block[data-uniqid="'+progressData.uniqueId+'"]').length > 0) {
                var splitName = progressData.value;
                var downloadName = splitName.split('/')[splitName.split('/').length - 1];
                progressBarBody.find('.one-progress-block[data-uniqid="'+progressData.uniqueId+'"]').replaceWith('<div class="one-progress-block" data-uniqid="'+progressData.uniqueId+'">\n\
                                        <div class="title">'+title+'</div>\n\
                                        <div>\n\
                                            <p style="padding:0;">PDF report was successfully created. If you have not started the automatic download of the report, you can <span onclick="pdfGen.downloadPDF(\''+progressData.value+'\');" style="font-size:16px;color:#3498db;cursor:pointer;">click here</span></p>\n\
                                        </div>\n\
                                    </div>');
            }
            if (progressBarBody.find('.one-progress-block').length == 0) {
                $('footer.dash_footer .progressbar-block').remove();
            }
        }
    }
    
    self.downloadPDF = function (link) {
        $("#pdf_form_new").remove();
        if(self.safaryOneSecondPassed){
            $('body').append('<form action="' + EZPDF_LINK + '/readPDF.php" method="post" id="pdf_form_new"><input type="text" name="pdfURL" value="'+link+'"/></form>');
        }else{
            $('body').append('<form action="' + EZPDF_LINK + '/readPDF.php" method="post" target="_blank" id="pdf_form_new"><input type="text" name="pdfURL" value="'+link+'"/></form>');
}
        $("#pdf_form_new").submit();
        $("#pdf_form_new").remove();
    }
}
var pdfGen = new pdfGenerator(); 