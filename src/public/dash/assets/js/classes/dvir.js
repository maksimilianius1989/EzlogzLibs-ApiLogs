var dvirClass = function () {
    var self = this;
    this.dvirId;
    this.gDvirs = '';
    this.gFirstDay = '';
    this.gEquipment = '';
    this.gCurDay = '';
    this.gCarName = '';
    this.truckId;
    this.noFleet;
    this.driverId;
    this.date;
    this.time;
    this.dvirIndex = 0;
    this.addedEditOffers = [];
    this.isCreating = false; // addFrom or editForm
    this.isEld = 0;
    this.isAobrd = 0;
    this.isAobrdCanEdit = 0;
    this.autocomplete;
    
    this.dvirSelectOpt = function () {
        self.cancelDvirForm();
        
        var equipment = self.gEquipment;
        var dvir = self.gDvirs[self.dvirIndex];
        var fday = self.gFirstDay ? self.gFirstDay[0] : null;
        if (!self.gCurDay && typeof dvir != 'undefined' && dvir.date) self.gCurDay = dvir.date;
        var curDay = convertDateToUSA(self.gCurDay);
        $('#dvir_date').text(curDay);
        $('.dvir_date_time').text('');
        $('.dvir_location').text('');
		$('.dvir_driver').text('');
        $('.dvir_carrier').text('');
        $('.dvir_odometer').text('');
        $('#dvir_truck').text('');
        $('#dvit_track_def').text('');
        $('#dvit_trailer_def').text('');
        $('#dvir_trailers').text('');
        $('#statusDvir').html('No Defect');
        
        if (!this.isEld || self.isAobrd) $('.dvir_odometer').closest('.field').hide().val('0');
        $('.hide-on-create').show();
        var dvirSelection = '', dvirSelOpt = '';
        if(self.gDvirs.length > 1){
            $('#select_dvir_for_day').remove();
            $.each(self.gDvirs, function(k,v){
                dvirSelOpt += '<option value="'+k+'" '+(k == self.dvirIndex ? 'selected' : '')+'>'+timeFromSQLDateTimeStringToUSAString(v.date+' '+v.time, false)+'</option>';
            });
            dvirSelection = `<select id="select_dvir_for_day" onchange="dvirObj.selectDvirForDay(this);">${dvirSelOpt}</select>`;
            $('.section-panel > .row > .col-md-6').first().append(dvirSelection);
        } else {
            $('#select_dvir_for_day').remove();
        }
        
        if(self.gDvirs.length == 0){
            $('#no_dvir').remove();
            $('#log_box').after(`<div id="no_dvir" style="text-align: center; font-size: 20px; margin: 20px 0; font-weight: bold;">No DVIR for this day</div>`);
            $('#log_box').hide();
        } else {
            $('#no_dvir').remove();
            $('#log_box').show();
        }
        
        if(dvir != null){
            if((dvir.defects.length > 0 || dvir.trailers.defects.length) && !dvir.mechanic) {
                $('#statusDvir').html('All defects need to be corrected');
                $('.statusDvirH2').addClass('statusDvirErr').removeClass('statusDvirOk');
            }
            else if((dvir.defects.length > 0 || dvir.trailers.defects.length) && dvir.mechanic) {
                $('#statusDvir').html('All defects corrected');
                $('.statusDvirH2').removeClass('statusDvirErr').addClass('statusDvirOk');
            }
            else {
                $('#statusDvir').html('No Defect');
                $('.statusDvirH2').removeClass('statusDvirErr').addClass('statusDvirOk');
            }
            
            $('#log_box').attr('data-dvir-id', dvir.id);
            $('.drivers_log_pdf').prop('disabled', false);
            var diff = daydiff(new Date(fday), new Date());
            $('#tot_days').html(diff);
            $('#dvir_date').text(curDay);
            $('.dvir_date_time').text(timeFromSQLDateTimeStringToUSAString(dvir.date + ' ' + dvir.time, false));
            $('.dvir_location').text(dvir.location);
			$('.dvir_driver').text(dvir.name);
            $('.dvir_carrier').text(self.gCarName);
            $('.dvir_odometer').text(dvir.odometer);
            $('.dvir_note').text(dvir.note);
            $('#dvir_truck').html(truckCardLink(dvir.truck, dvir.truckName));
            $('#signature').val(dvir.signatureId);
            $('#mechanic').val(dvir.mechanic);
            if ($('select[name="userId"]').length) $('.f_data_drivers').html($('.f_data_drivers option:selected').text());
            var trailers = dvir.trailers;
            var trailer = '';
            var trailerIds = trailers.ids;
            var trailerDefs = trailers.defects;
            for(var y = 0; y < trailerIds.length; y++){
                var name = '';
                for(var x = 0; x < equipment.length; x++){

                    if(equipment[x].id == trailerIds[y]['id']){
                        name = equipment[x].Name;
                    }
                }
                if(trailer == ''){
                    trailer = truckCardLink(trailerIds[y]['id'], name);
                }else{
                    trailer += ', ' +truckCardLink(trailerIds[y]['id'], name);
                }
            }
            var trailerDefects = 'No Defects Found';
            var defectName;
            if(trailerDefs.length > 0){
                trailerDefects = '';
                for(var y = 0; y < trailerDefs.length; y++){
                    if (trailerDefs[y].name) defectName = trailerDefs[y].name;
                    else {
                        $.each(self.defects, function(i, v){
                            if (v.id == trailerDefs[y].id) {
                                defectName = v.name;
                                return false;
                            }
                        });
                    }
                    if(trailerDefects == '') trailerDefects = defectName;
                    else trailerDefects += ', '+defectName;
                }
            }
            var defects = 'No Defects Found';
            if(dvir.defects.length > 0){
                defects = '';
                var defs = dvir.defects;
                for(var y = 0; y < defs.length; y++){
                    if (defs[y].name) defectName = defs[y].name;
                    else {
                        $.each(self.defects, function(i, v){
                            if (v.id == defs[y].id) {
                                defectName = v.name;
                                return false;
                            }
                        });
                    }
                    if(defects == '') defects = defectName;
                    else defects += ', ' +defectName;
                }
            }
            $('#dvit_track_def').text(defects);
            $('#dvit_trailer_def').text(trailerDefects);
            $('#dvir_trailers').html(trailer);
            
            if(typeof dvir.signature != 'undefined' && dvir.signature.toString().length > 0){
                var signature = MAIN_LINK+'/docs/signatures/'+dvir.signature;
                if (typeof dvir.awsSignature != 'undefined' && dvir.awsSignature != null && dvir.awsSignature != '') {
                    signature = dvir.awsSignature;
                }
                $('#driverSignature').show().html('<img src="'+signature+'" />');
            } else {
                $('#driverSignature').show().html('DVIR not signed');
            }
            
            if(typeof dvir.mechanicSignature != 'undefined' && dvir.mechanicSignature.toString().length > 0) {
                var mechSignature = MAIN_LINK+'/docs/signatures/'+dvir.mechanicSignature;
                if (typeof dvir.awsMechanicSignature != 'undefined' && dvir.awsMechanicSignature != null && dvir.awsMechanicSignature != '') {
                    mechSignature = dvir.awsMechanicSignature;
                }
                $('#mechanicSignature').show().html('<img src="'+mechSignature+'" />');
            } else {
                $('.mechanicSignature_cont').hide();
            }
            
            self.drawEditOffers(dvir.edit_offers);
            
        }else{
            $('#driverSignature, #mechanicSignature').empty().append('<p>No DVIR for the truck this date</p>');
            $('.drivers_log_pdf').prop('disabled', true);
        }
    }
    this.dvirPageHandlerFn = function(response){
        c('dvirPageHandler');
        c(response);
        self.cancelDvirForm();
        self.gDvirs = response.data;
        for(var i=0; i < self.gDvirs.length; i++){
            self.gDvirs[i].trailers = self.gDvirs[i].trailers ? JSON.parse(self.gDvirs[i].trailers) : [];
            self.gDvirs[i].defects = self.gDvirs[i].defects ? JSON.parse(self.gDvirs[i].defects) : [];
            if (typeof self.gDvirs[i].edit_offers[0] != 'undefined') {
                for(var i2=0; i2 < self.gDvirs[i].edit_offers.length; i2++){
                    self.gDvirs[i].edit_offers[i2].fields = $.parseJSON(self.gDvirs[i].edit_offers[i2].fields);
                }
            }
            if (self.dvirId == self.gDvirs[i].id) self.dvirIndex = i;
        }
        self.gFirstDay = response.firstDay;
        self.gEquipment = response.equipment;
        self.gCurDay = response.curDay;
        self.gCarName = response.carName;
        self.dvirSelectOpt();
        
        return;
    }
    
    this.cancelDvir = function(el){
        if (self.dvirId > 0) {
            self.selectDriver();
            self.cancelDvirForm();
        } else {
            dc.getUrlContent('/dash/history/dvirs/', {
                action: 'getPage',
                page: 'dvirs'
            });
        }
    }
    this.cancelDvirForm = function(el){
        $('.dvirSave, .dvirCancel, .def_corrected_cont').hide();
        $('.dvir_edit_cont').removeClass('dvir_edit_form_active');
        $('.dvirCorrection').show();
    }
    this.removeTrailerSelect = function(el){
        $(el).closest('.dv_trailer_row').remove();
        self.addTrailerSelectOptionsHide();
        if (!$('.dv_trailer_row').length) {
            $('#dvit_trailer_def').hide();
            $('#dvit_trailer_def .trailers_defects').prop('checked', false);
        }
        $('.dv_tr_row_add:hidden').show();
        self.commonDefectsChange();
    }
    this.addTrailerSelect = function(el){
        var trailerIds = [];
        $('.dv_trailer_row .trailer option:selected').each(function(){
            trailerIds.push(parseInt($(this).val()));
        });
        var trail = '';
        $.each(self.gEquipment, function(i, v){
            if (v.truckTrailer) trail += '<option value="'+v.id+'"'+($.inArray(v.id, trailerIds) != -1 ? ' style="display:none;" disabled' : '')+'>'+v.Name+'</option>';
        }); 
        $(el).before('<div class="dv_trailer_row"><select name="trailer[]" class="trailer" onchange="dvirObj.addTrailerSelectOptionsHide(this);">'+trail+'</select> <span class="dv_tr_row_del" onclick="dvirObj.removeTrailerSelect(this);" title="Remove trailer"></span></div>');
        self.addTrailerSelectOptionsHide();
        $('#dvit_trailer_def').show();
        if (!$('.dv_trailer_row:last .trailer option:not(.hidden)').length) $(el).hide();
    }
    this.addTrailerSelectOptionsHide = function(){
        var trailerIds = [];
        $('.dv_trailer_row .trailer option:selected').each(function(){
            trailerIds.push(parseInt($(this).val()));
        });
        $('.dv_trailer_row .trailer option').removeClass('hidden').prop('disabled', false);
        $('.dv_trailer_row .trailer option').each(function(){
            if ($.inArray(parseInt($(this).val()), trailerIds) != -1) $(this).addClass('hidden');
        }); 
    }
    
    this.selectDriver = function(el){
        var date = convertDateToSQL($('#datepicker').val());
        var truckId = $('#date_left').attr('data-truckId') || self.truckId;
        var driverId = $('#date_left').attr('data-driverId') || self.driverId;
        $('#date_left').attr('data-driverid', $('#select_driver option:selected').attr('data-id'));
        getTruckReport(date, truckId, driverId, dvirPageHandler);
    }
    this.selectDvirForDay = function(el){
        self.dvirIndex = $(el).val();
        self.dvirSelectOpt();
    }
    this.selectTrack = function(el){
        var date = convertDateToSQL($('#datepicker').val());
        $('#date_left').attr('data-truckId', $('#select_track option:selected').attr('data-trackid'));
        getTruckReport(date, $('#date_left').attr('data-truckId'), $('#date_left').attr('data-driverId'), dvirPageHandler);
    }
    this.turnOffDriverEditMode = function(driverId, el){
        AjaxController('turnOffDriverEditMode', {driverId: driverId}, dashUrl, function(response){
            self.isAobrdCanEdit = 0;
            if (!self.isCreating) self.dvirSelectOpt();
        }, function(){
            self.dvirSelectOpt();
        }, true);
        $(el).closest('.modal-dialog').find('.close').click();
    }
    this.correctionAndAnnotations = function(el){
        if(self.isAobrd && self.isAobrdCanEdit){
            showModal('Cannot Edit', 'Driver option to edit logbook currently turned on, turn it off to be able to edit driver logbook <button class="btn btn-default" style="position: absolute;bottom: 0;right: 20px;" onclick="dvirObj.turnOffDriverEditMode('+self.driverId+', this)">Turn Off Driver Edit</button>', 'basicModal');
            return false;
        }
        var val = '',
            autocomplete = '';
        $('#log_box .f_data_text').each(function(){
            autocomplete = $(this).data('name') == 'location' ? 'id="location_id" onclick="dvirObj.locationAutocompleteClick(this)" onkeydown="dvirObj.locationAutocompleteKeydown(this)" data-googled="0"' : '';
            $(this).html('<input type="text" name="'+$(this).data('name')+'" value="'+$(this).text()+'" class=" '+($(this).data('validate')=='number' ? 'inputOnlyNumber' : '')+'" '+autocomplete+' '+($(this).data('validate')=='number' ? ' onkeyup="dvirObj.inputOnlyNumberKeyUp(this)" ' : '')+' />');
        });
        $('#log_box .f_data_textarea').each(function(){
            $(this).html('<textarea name="'+$(this).data('name')+'" class="">'+$(this).text()+'</textarea>');
            $(this).prev('.f_name').css('vertical-align', 'top');
        });
        $('#log_box .f_data_date').each(function(){
            val = $(this).text();
            $(this).html('<input id="dvir_date_'+$(this).data('name')+'" type="text" name="'+$(this).data('name')+'" value="'+val+'" class="" readonly />');
            $( "#dvir_date_"+$(this).data('name')).datetimepicker({ dateFormat:'mm-dd-yy', timeFormat:'h:mm:ssTT', minDate: new Date(self.gCurDay+'T00:00:00'), maxDate: new Date(self.gCurDay+'T23:59:59')})
                .datetimepicker("setTime", $.datepicker.parseDateTime('mm-dd-yy', 'h:mm:ssTT', val));
        });
        var trackStr = '';
        $.each(self.gEquipment, function(i, v){
            if (!v.truckTrailer) trackStr += '<option value="'+v.id+'" '+(self.gDvirs[self.dvirIndex].truck == v.id ? 'selected' : '')+'> '+v.Name+'</option>';
        }); 
        $('#log_box .f_data_track').html('<div class="dv_truck_row"><select name="track">'+trackStr+'</select></div>');    
        
        var trailers = self.gDvirs[self.dvirIndex].trailers;
        var trails = '', trail = '';
        $('#log_box .f_data_trailers').each(function(){
            trails = '<div class="dv_trailer_cont">';
            $.each(trailers.ids, function(i, tr){
                trail = '';
                $.each(self.gEquipment, function(i, v){
                    if (v.truckTrailer) trail += '<option value="'+v.id+'" '+(tr.id == v.id ? 'selected' : '')+'> '+v.Name+'</option>';
                }); 
                trails += '<div class="dv_trailer_row"><select name="trailer[]" class="trailer" onchange="dvirObj.addTrailerSelectOptionsHide(this);">'+trail+'</select> <span class="dv_tr_row_del" onclick="dvirObj.removeTrailerSelect(this);" title="Remove trailer"></span></div>';
            });
            trails += '<span class="dv_tr_row_add" onclick="dvirObj.addTrailerSelect(this);">Add trailer</span>\
            </div>';
            $(this).html(trails);
        });
        
        var data = {data:{action: 'apiBeforeEditDVIR'}};
        $.ajax({
            url: MAIN_LINK+'/db/dashController/' + '?' + window.location.search.substring(1),
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify(data),
            success: function(data){
                var response = $.parseJSON(data);
                if(response.code == '000'){
                    self.defects = response.data.defects;
                    
                    var defects = self.gDvirs[self.dvirIndex].defects;
                    var defectsId = [];
                    $.each(defects, function(i, v){
                        defectsId.push(parseInt(v.id));
                    });
                    var def = '';
                    $.each(self.defects, function(i, v){
                        if (v.type == 0) def += '<label><input type="checkbox" value="'+v.id+'" name="defects[]" class="track_defects" '+($.inArray(v.id, defectsId) != -1 ? 'checked' : '')+' onchange="dvirObj.commonDefectsChange(this);" /> '+v.name+'</label><br />';
                    });
                    $('#log_box .f_data_defects_0').html('<div class="dvir_defects_cont">'+def+'</div>');
                    
                    defectsId = [];
                    $.each(trailers.defects, function(i, v){
                        defectsId.push(parseInt(v.id));
                    });
                    def = '';
                    $.each(self.defects, function(i, v){
                        if (v.type == 1) def += '<label><input type="checkbox" value="'+v.id+'" class="trailers_defects" name="defects[]" '+($.inArray(v.id, defectsId) != -1 ? 'checked' : '')+' onchange="dvirObj.commonDefectsChange(this);" /> '+v.name+'</label><br />';
                    });
                    $('#dvit_trailer_def').html('<div class="dvir_defects_cont">'+def+'</div>');
                
                    self.commonDefectsChange();
                    if (self.gDvirs[self.dvirIndex].mechanic) {
                        $('#dvir_def_corrected button.active').removeClass('active');
                        $('#dvir_def_corrected button[data-val="1"]').addClass('active');
                    }
                    self.statusDvirText();
					if (!$('.dv_trailer_row').length) {
						$('#dvit_trailer_def').hide();
						$('#dvit_trailer_def .trailers_defects').prop('checked', false);
					}else{
						$('#dvit_trailer_def').show();
					}
                }
            }
        });
		
        if (self.isEld && !self.isAobrd && self.driverId != curUserId) {
            $('#signature_dvir_dr').hide();
            $('#driverSignature').html('<p>Driver will sign the DVIR on offer approval</p>').show();
        }
        
        $('.dvir_edit_cont').addClass('dvir_edit_form_active');
        $('.dvirSave, .dvirCancel').show();
        $(el).hide();
    }
    this.makeAddForm = function(el){
        
        self.isCreating = true;
        $('.use-previous-signature').hide();
        $('.mechanicSignature_cont').hide();
        $('.def_corrected_cont').hide();
        
        $('.dvir_odometer').closest('.field').hide().val('0');
		$('.dvir_driver').closest('.field').hide();
        $('.dvir_carrier').closest('.field').hide();
        $('.dvirCorrection').hide();
        $('.dvirSave, .dvirCancel').show();
        
        $('.dvirDate > span').text('New DVIR');
        $('.hide-on-create').hide();
        
        var val = '',
            autocomplete = '';
        $('#log_box .f_data_text').each(function(){
            autocomplete = $(this).data('name') == 'location' ? ' id="location_id" onclick="dvirObj.locationAutocompleteClick(this)" onkeydown="dvirObj.locationAutocompleteKeydown(this)" data-googled="0"' : '';
            $(this).html('<input type="text" name="'+$(this).data('name')+'" value="'+$(this).text()+'" class="'+($(this).data('required') ? 'required' : '')+' '+($(this).data('validate')=='number' ? 'inputOnlyNumber' : '')+'" '+autocomplete+' '+($(this).data('validate')=='number' ? ' onkeyup="dvirObj.inputOnlyNumberKeyUp(this)" ' : '')+' />');
        });
        $('#log_box .f_data_textarea').each(function(){
            $(this).html('<textarea name="'+$(this).data('name')+'" class="'+($(this).data('required') ? 'required' : '')+'" >'+$(this).text()+'</textarea>');
            $(this).prev('.f_name').css('vertical-align', 'top');
        });
        $('#log_box .f_data_date').each(function(){
            val = $(this).text();
            $(this).html('<input id="dvir_date_'+$(this).data('name')+'" type="text" name="'+$(this).data('name')+'" value="'+val+'" class="'+($(this).data('required') ? 'required' : '')+'" readonly />');
            $( "#dvir_date_"+$(this).data('name')).datetimepicker({ dateFormat:'mm-dd-yy', timeFormat:'h:mm:ssTT', maxDate: new Date()})
                .datetimepicker("setTime", new Date());
        });
        
        $('input[name="odometer"]').val('0');
        $('#dvir_date').text(self.date);
        
        AjaxController('getEqupment', {}, dashUrl, function(response){
            self.gEquipment = response.data;
            
            var trackStr = '';
            $.each(self.gEquipment, function(i, v){
                if (!v.truckTrailer) trackStr += '<option value="'+v.id+'"> '+v.Name+'</option>';
            }); 
            $('#log_box .f_data_track').html('<select name="track">'+trackStr+'</select>');   
            
            var trails = '', trail = '';
            $('#log_box .f_data_trailers').each(function(){
                trails = '<div class="dv_trailer_cont">';
                $.each(self.gEquipment, function(i, v){
                    if (v.truckTrailer) trail += '<option value="'+v.id+'"> '+v.Name+'</option>';
                }); 
                trails += '<div class="dv_trailer_row"><select name="trailer[]" class="trailer" onchange="dvirObj.addTrailerSelectOptionsHide(this);">'+trail+'</select> <span class="dv_tr_row_del" onclick="dvirObj.removeTrailerSelect(this);" title="Remove trailer"></span></div>';
                trails += '<span class="dv_tr_row_add" onclick="dvirObj.addTrailerSelect(this);">Add trailer</span>\
                </div>';
                $(this).html(trails);
				if(trail != '' && self.dvirId == '-1'){
                    $('#dvit_trailer_def').show();
                }
            });
        }, function(){}, true);
        
        AjaxController('apiBeforeEditDVIR', {}, dashUrl, function(response){
            self.defects = response.data.defects;

            var def = '';
            $.each(self.defects, function(i, v){
                if (v.type == 0) def += '<label><input type="checkbox" value="'+v.id+'" name="defects[]" class="track_defects" onchange="dvirObj.commonDefectsChange(this);" /> '+v.name+'</label><br />';
            });
            $('#log_box .f_data_defects_0').html('<div class="dvir_defects_cont">'+def+'</div>');

            def = '';
            $.each(self.defects, function(i, v){
                if (v.type == 1) def += '<label><input type="checkbox" value="'+v.id+'" class="trailers_defects" name="defects[]" onchange="dvirObj.commonDefectsChange(this);" /> '+v.name+'</label><br />';
            });
            $('#dvit_trailer_def').html('<div class="dvir_defects_cont">'+def+'</div>');
			if (!$('.dv_trailer_row').length) {
				$('#dvit_trailer_def').hide();
				$('#dvit_trailer_def .trailers_defects').prop('checked', false);
			}else{
				$('#dvit_trailer_def').show();
			}
        }, function(){}, true);
        
        $('#driverSignature p').hide();
        $('#signature_dvir_dr').show();
        $('.dvir_edit_cont').addClass('dvir_edit_form_active');
        
        document.cookie = 'dvirPageInfo='+JSON.stringify({dvirId:-1, isCreate:1})+';path=/';
        
		self.statusDvirText();
        $(el).hide();
    }
    this.inputOnlyNumberKeyUp = function(el){
        $(el).val($(el).val().replace(',', '.'));
    }
    this.showDriverPDFReportPopap = function () {
        var title = 'DVIR Report PDF Settings';
        var message = `<div class="row">
            <div class="form-group">
                <label class="col-sm-4" class="control-label">Show DVIR Time</label>
                <div class="col-sm-8">
                    <div class="check_buttons_block" id="show_dvir_time">
                        <button type="button" class="btn btn-default active" onclick="doActive(this)" data-val="1">Yes</button>
                        <button type="button" class="btn btn-default" onclick="doActive(this)" data-val="0">No</button>
                    </div>
                </div>
            </div>
        </div>`;
        var id = 'driver_pdf_report_popap';
        showModal(title, message, id, '', {footerButtons: `<button class="btn btn-default" data-dismiss="modal" onclick="dvirObj.driversLogPdf();">Generate PDF</button>`});
    }
    this.driversLogPdf = function(el){
        var data = {
            print_settings:{
                incl_recap:0,
                incl_dvir:1,
                show_dvir_time: $('#show_dvir_time .active').attr('data-val'),
                same_page:0,
                incl_odometer:1,
                incl_docs:0,
                incl_logbook:0,
                incl_fromto:0,
                type: 'dvir',
                read: 0
            },
            dates:[
                {date:convertDateToSQL($('#datepicker').val()), dvirId:$('#log_box').attr('data-dvir-id') || self.dvirId}
            ]               
        };

        var params = {};
        params.name = "CreatePDF";
        params.data = JSON.stringify(data);
        params.driver_id = $('#select_driver option:selected').attr('data-id') || self.driverId;
        params.truck_id = self.truckId;
        params.date = $('#datepicker').val() || self.date;
        
        pdfGen.generateAndSendForm(params, {'action':'mergeLogbookDvirDocument'});
    }
    this.drawEditOffers = function(edit_offers) {
        var modal_message = '';
        $.each(edit_offers, function(key, offer){ 
            c(offer);
            if(offer){
                modal_message += self.drawEditOffersRow(key, offer);
            }
        });
        edits_modal = {modal_title: 'Edit offers', modal_message:modal_message};
        $("#show_info_edits").remove();
        if(edit_offers.length){
            var button_code = '<button id="show_info_edits" class="blue-border" onclick="showModal(edits_modal.modal_title, edits_modal.modal_message, \'basicModal\')">Pending Approvals</button>';
            $('.dvir_top_btns').prepend(button_code);
        } else {
            $('#basicModal').modal('hide');
        }
    }
    this.drawEditOffersRow = function(key, offer) { 
        var str = '';
        var table_header_tr = '<th>Info</th><th>Data</th>';
        var edit_table = '<table class="table table-striped table-dashboard table-sm mobile_table ez_table ez_table_'+key+'"><thead>'+table_header_tr+'</thead><tbody>';
        $.each(offer.fields, function(field_type, field_value){
            if(field_type == 'signature'){
                if (parseInt(field_value) > 0) field_value = 'Signed';
                else field_value = 'Must be signed';
            } else if(field_type == 'mechanic'){
                if (parseInt(field_value) > 0) field_value = 'Signed';
                else return;
            } else if(field_type == 'odometer' && !parseInt(field_value)){
                return;
			} else if(field_type == 'date'){
                field_value = timeFromSQLDateTimeStringToUSAString(field_value, false);
            } else if(field_type == 'time'){
                field_value = convertOnlyTimeFromSqlToUsa(field_value, false);
            } else if(field_type == 'defects'){
                var field_str = [];
                if (field_value.length) {
                    var field_array = $.parseJSON(field_value);
                    $.each(field_array, function(k, v){ 
                        field_str.push(v.name);
                    });
                }
                if (field_str.length) field_value = field_str.join(', ');
                else field_value = 'No defects';
            } else if(field_type == 'truck'){
                for(var x = 0; x < self.gEquipment.length; x++){
                    if(self.gEquipment[x].id == field_value){
                        field_value = self.gEquipment[x].Name;
                        break;
                    }
                }
            } else if(field_type == 'trailers'){
                var field_str = []; 
                if (field_value.length) {
                    field_array = $.parseJSON(field_value);
                    $.each(field_array.ids, function(k, v){ 
                        for(var x = 0; x < self.gEquipment.length; x++){
                            if(self.gEquipment[x].id == v.id){
                                field_str.push(self.gEquipment[x].Name);
                                break;
                            }
                        }
                    });
                    field_value = field_str.join(', ');
                    edit_table += '<tr><td class="field_title">Trailers</td><td>'+(field_value.toString() ? field_value.toString() : 'None')+'</td></tr>';
                    
                    field_str = [];
                    $.each(field_array.defects, function(k, v){ 
                        field_str.push(v.name);
                    });
                    field_value = field_str.join(', ');
                    if (field_str.length) edit_table += '<tr><td class="field_title">Defects</td><td>'+(field_value.toString() ? field_value.toString() : 'None')+'</td></tr>';
                    
                    return;
                    
                } else edit_table += '<tr><td class="field_title">'+field_type+'</td><td>No defects</td></tr>';
            } 
            edit_table += '<tr><td class="field_title">'+field_type+'</td><td>'+(field_value.toString() ? field_value.toString() : 'None')+'</td></tr>';
        });
        edit_table += '<tbody></tbody></table>';

        str += '<div id="main_info_'+offer.id+'" class="offer">';
        str += '<div class="offer-header" id="heading_'+offer.id+'">';
        str += '<h5 class="mb-0"><div id="main_info_title_'+offer.id+'" class="offer_row_title collapsed" data-toggle="collapse" data-target="#collapse_'+offer.id+'" aria-expanded="false" aria-controls="collapse_'+offer.id+'">Offer by '+offer.editor+' №'+offer.id+'</div>';
        str += '<span class="delete_edit blue-border" onclick="dvirObj.removeEditOffer('+offer.id+');">Remove</span></h5></div>';
        str += '<div id="collapse_'+offer.id+'" class="collapse" aria-labelledby="heading'+offer.id+'" data-parent="#accordion">';
        str += '<div class="offer-body table_wrap">'+edit_table+'</div></div></div>';
        return str;
    }
    this.removeEditOffer = function(offerId, driverId=false){
        if (driverId === false) driverId = self.driverId;
        AjaxController('apiRemoveDvirOfferById', {offerId: parseInt(offerId), userId: driverId}, dashUrl, function(response){
            $('#main_info_'+offerId).remove();
            if (!$('#basicModal .modal-body > .offer').length) {
                $("#show_info_edits").remove();
                $('#basicModal').modal('hide');
                if (self.gDvirs) {
                    self.gDvirs[self.dvirIndex].edit_offers = [];
                    self.dvirSelectOpt();
                } else {
                    $(".dvir_add_cont .dvir_pending_btn").hide();
                }
            }
        }, function(){}, true);
    }
    this.pendingApprovals = function(){
        if (!self.gEquipment.length) {
            // load tracks and trailers name
            AjaxController('getEqupment', {}, dashUrl, function(response){
                self.gEquipment = response.data;
                self.pendingApprovalsFn();
            }, function(){}, true);
        }
        else self.pendingApprovalsFn();
    }
    this.pendingApprovalsFn = function(){
        var modal_message = '';
        for(var i=0; i<self.addedEditOffers.length; i++){
            self.addedEditOffers[i];
            modal_message += self.drawPendingApprovalsRow(i, self.addedEditOffers[i]);
        }
        showModal('Add offers', modal_message, 'basicModal');
    }
    this.loadAddedEditOffers = function(){
        AjaxController('apiDvirPendingApprovals', {}, dashUrl, function(response){
            if(response.code == '000'){
                self.addedEditOffers = response.data;
                if (self.addedEditOffers.length) {
                    for(var i=0; i<self.addedEditOffers.length; i++){
                        self.addedEditOffers[i].fields = $.parseJSON(self.addedEditOffers[i].fields);
                        
                        // remove Delete buttons
                        if (self.addedEditOffers[i].forDelete) $('.removeDvir_'+self.addedEditOffers[i].dvirId).remove();
                    }
                    $('.dvir_add_cont .dvir_pending_btn').show();
                }
            }
        }, function(){}, true);
    }
    this.drawPendingApprovalsRow = function(key, offer) { 
        var str = '';
        var field_array;
        var table_header_tr = '<th>Info</th><th>Data</th>';
        var edit_table = '<table class="table table-striped table-dashboard table-sm mobile_table ez_table ez_table_'+key+'"><thead>'+table_header_tr+'</thead><tbody>';
        $.each(offer.fields, function(field_type, field_value){
            if(field_type == 'signature'){
                if (parseInt(field_value) > 0) field_value = 'Signed';
                else field_value = 'Must be signed';
            } else if(field_type == 'mechanic'){
                if (parseInt(field_value) > 0) field_value = 'Signed';
                else return;
            } else if(field_type == 'odometer' && !parseInt(field_value)){
                return;
            } if(field_type == 'date'){
                field_value = timeFromSQLDateTimeStringToUSAString(field_value, false);
            } else if(field_type == 'time'){
                field_value = convertOnlyTimeFromSqlToUsa(field_value, false);
            } else if(field_type == 'defects'){
                var field_str = [];
                if (field_value.length) {
                    field_array = $.parseJSON(field_value);
                    $.each(field_array, function(k, v){ 
                        field_str.push(v.name);
                    });
                }
                if (field_str.length) field_value = field_str.join(', ');
                else field_value = 'No defects';
            } else if(field_type == 'truck'){
                for(var x = 0; x < self.gEquipment.length; x++){
                    if(self.gEquipment[x].id == field_value){
                        field_value = self.gEquipment[x].Name;
                        break;
                    }
                }
            } else if(field_type == 'trailers'){
                var field_str = []; 
                if (field_value.length) {
                    field_array = $.parseJSON(field_value);
                    $.each(field_array.ids, function(k, v){ 
                        for(var x = 0; x < self.gEquipment.length; x++){
                            if(self.gEquipment[x].id == v.id){
                                field_str.push(self.gEquipment[x].Name);
                                break;
                            }
                        }
                    });
                    field_value = field_str.join(', ');
                    edit_table += '<tr><td class="field_title">Trailers</td><td>'+(field_value.toString() ? field_value.toString() : 'None')+'</td></tr>';
                    
                    field_str = [];
                    $.each(field_array.defects, function(k, v){ 
                        field_str.push(v.name);
                    });
                    field_value = field_str.join(', ');
                    if (field_str.length) edit_table += '<tr><td class="field_title">Defects</td><td>'+(field_value.toString() ? field_value.toString() : 'None')+'</td></tr>';
                    
                    return;
                    
                } else edit_table += '<tr><td class="field_title">'+field_type+'</td><td>No defects</td></tr>';
            } 
            if (field_type == 'userId') field_type = 'Driver';
            edit_table += '<tr><td class="field_title">'+field_type+'</td><td>'+(field_value.toString() ? field_value.toString() : 'None')+'</td></tr>';
        });
        edit_table += '<tbody></tbody></table>';

        str += '<div id="main_info_'+offer.id+'" class="offer">';
        str += '<div class="offer-header" id="heading_'+offer.id+'">';
        str += '<h5 class="mb-0"><div id="main_info_title_'+offer.id+'" class="offer_row_title collapsed" data-toggle="collapse" data-target="#collapse_'+offer.id+'" aria-expanded="false" aria-controls="collapse_'+offer.id+'">'+(offer.forDelete ? 'Remove' : 'Add')+' offer by '+offer.editor+' №'+offer.id+'</div>';
        str += '<span class="delete_edit blue-border" onclick="dvirObj.removeEditOffer('+offer.id+', '+offer.userId+');">Remove</span></h5></div>';
        str += '<div id="collapse_'+offer.id+'" class="collapse" aria-labelledby="heading'+offer.id+'" data-parent="#accordion">';
        str += '<div class="offer-body table_wrap">'+edit_table+'</div>';
        str += '</div></div>';
        return str;
    }
    this.saveDvir = function(el){
		if (self.isAobrd && self.isAobrdCanEdit) {
            showModal('Cannot Edit', 'Driver option to edit logbook currently turned on, turn it off to be able to edit driver logbook <button class="btn btn-default" style="position: absolute;bottom: 0;right: 20px;" onclick="dvirObj.turnOffDriverEditMode('+self.driverId+', this)">Turn Off Driver Edit</button>', 'basicModal');
            return false;
        }
        if (!self.validateForm()) return false;
        
        // we have to wait for signatures uploading finish
        var haveSignature = $('#signature_dvir_dr:visible').length && $('#signature').length && !parseInt($('#signature').val()) ? true : false;
        var haveMechanic = $('#signature_dvir_mech:visible').length && $('#mechanic').length && !parseInt($('#mechanic').val()) ? true : false;
        if (haveSignature || haveMechanic){
            if (haveSignature) signatureObj1.saveSignatureCommon();
            if (haveMechanic) signatureObj2.saveSignatureCommon();
            
            var prev_sign = $('#signature').val(),
                prev_mech = $('#mechanic').val(),
                i = 0;
            var timerId = setInterval(function() {
                if (i > 150) clearInterval(timerId); // 15sec timeout
                
                if (haveSignature && haveMechanic) {
                    if (prev_sign != $('#signature').val() && prev_mech != $('#mechanic').val()) {
                        clearInterval(timerId);
                        self.saveDvirFn();
                    }
                }
                else if (haveSignature && !haveMechanic && prev_sign != $('#signature').val()) {
                    clearInterval(timerId);
                    self.saveDvirFn();
                }
                else if (!haveSignature && haveMechanic && prev_mech != $('#mechanic').val()) {
                    clearInterval(timerId);
                    self.saveDvirFn();
                }
                i++;
                
            }, 100);
        } else self.saveDvirFn();
    }
    
    this.saveDvirFn = function(){
        var signature = 0,
            mechanic = 0;
        if ($('#signature').length && $('#signature').val()) signature = $('#signature').val();
        if (!signature && typeof self.gDvirs[self.dvirIndex] != 'undefined' && self.gDvirs[self.dvirIndex].signatureId) signature = self.gDvirs[self.dvirIndex].signatureId;
        if ($('#mechanic').length && $('#mechanic').val()) mechanic = $('#mechanic').val();
        if (!mechanic && typeof self.gDvirs[self.dvirIndex] != 'undefined' && self.gDvirs[self.dvirIndex].mechanic) mechanic = self.gDvirs[self.dvirIndex].mechanic;
        var old_date = $('.dvirTruckSelectBox #datepicker').val() || $('.main_data_datepicker#datepicker').val();
        if (old_date) old_date = convertDateToSQL(old_date);
        else old_date = convertDateToSQL($('input[name="time"]').val(), true, false).substr(0, 10);
        var data = {
            data: {
                action: 'apiSaveDVIR',
                oldDate: old_date,
                date: convertDateToSQL($('input[name="time"]').val(), true, false).substr(0, 10),
                userId: self.driverId || $('select[name="userId"]').val(),
                mechanic: mechanic,
                signature: signature,
                time: convertDateToSQL($('input[name="time"]').val(), true, false).substr(11, 10),
                location: $('input[name="location"]').val(),
                truck: $('select[name="track"]').val(),
                truckId: self.gDvirs[self.dvirIndex] ? self.gDvirs[self.dvirIndex].truck : 0,
                odometer: $('input[name="odometer"]').val() || 0,
                id: $('#log_box').attr('data-dvir-id'),
                note: $('textarea[name="note"]').val(),
                trailers: {},
                defects: {},
            }
        };

        var obj = {}, i = 0;
        $('select.trailer').each(function(){
            obj[i] = {};
            obj[i].id = parseInt($(this).val());
            i++;
        });
        data.data.trailers.ids = obj;
        
        obj = {}; i = 0;
        $('.trailers_defects:checked').each(function(){
            obj[i] = {};
            obj[i].id = parseInt($(this).val());
            i++;
        });
        data.data.trailers.defects = obj;
        
        obj = {}; i = 0;
        $('.track_defects:checked').each(function(){
            obj[i] = {};
            obj[i].id = parseInt($(this).val());
            i++;
        });
        data.data.defects = obj;
        
        c(data.data);

        $.ajax({
            url: MAIN_LINK+'/db/dashController/' + '?' + window.location.search.substring(1),
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify(data),
            success: function(data){
                var response = $.parseJSON(data);
                if(response.code == '000'){
                    if (response.data.dvirs.length) {
                        self.gDvirs = response.data.dvirs;
                        for(var i=0; i < self.gDvirs.length; i++){
                            self.gDvirs[i].trailers = self.gDvirs[i].trailers ? JSON.parse(self.gDvirs[i].trailers) : {};
                            self.gDvirs[i].defects = self.gDvirs[i].defects ? JSON.parse(self.gDvirs[i].defects) : {};
                            if (typeof self.gDvirs[i].edit_offers[0] != 'undefined') {
                                for(var i2=0; i2 < self.gDvirs[i].edit_offers.length; i2++){
                                    self.gDvirs[i].edit_offers[i2].fields = $.parseJSON(self.gDvirs[i].edit_offers[i2].fields);
                                }
                            }
                            // after save new DVIR, take last dvir id
                            if (self.dvirId == -1 && i == self.gDvirs.length-1 && self.gDvirs[i].id) {
                                self.dvirId = self.gDvirs[i].id;
                                self.truckId = self.gDvirs[i].truck;
                                self.driverId = self.gDvirs[i].userId;
                                self.date = self.gDvirs[i].date;
                                self.time = self.gDvirs[i].time;
                                self.dvirIndex = i;
                                self.gCarName = response.data.carName;
                                
                                $('.dvirCorrection').show();
                                $('.f_data_drivers').closest('.field').remove();
                                $('.dvir_carrier').closest('.field').show();
								$('.dvir_driver').closest('.field').show();
                                
                                document.cookie = 'dvirPageInfo='+JSON.stringify({driverId: self.driverId, date: self.date, truckId: self.truckId, notFleet: self.notFleet, dvirId:self.dvirId})+';path=/';
                            }
                        }
                        $('.draw-signature-block').hide();
                        
                        if (self.isEld && !self.isAobrd && self.driverId != curUserId) {
                            showModal('Edit approve', '<center>The driver must approve the DVIR change.</center>');
                        } else {
                            $('.dvirDate > span').html('Dvir/<span id="dvir_date"></span>');
							
                            // if was changed date of DVIR
                            if (!self.isCreating && typeof response.data.curDay != 'undefined' && response.data.curDay != self.gCurDay) $('.main_data_datepicker').val(timeFromSQLDateTimeStringToUSAString(response.data.curDay, false)).change();
                        }
                        self.dvirSelectOpt();
						// fix paginator after create
						if (self.isCreating && $('#date_left').length && (!$('#date_left').data('truckid') || !$('#date_left').data('driverid'))){
                            $('#date_left').data('truckid', self.truckId).attr('data-truckid', self.truckId);
                            $('#date_left').data('driverid', self.driverId).attr('data-driverid', self.driverId);
                            $('.main_data_datepicker').val(timeFromSQLDateTimeStringToUSAString(response.data.curDay, false));
                        }
                    } 
                    // when add with approve
                    else {
                        if (self.isCreating) {
                            showModal('Add approve', '<center>The driver must approve the addition of DVIR.</center>');
                            window.setTimeout(function(){ 
                                $('.one_part_box.buy_now_box .remove').click(function(){
                                    dc.getUrlContent('/dash/history/dvirs/', {
                                        action: 'getPage',
                                        page: 'dvirs'
                                    });
                                });
                            }, 200);
                        }
                        self.dvirSelectOpt();
                    }
                    self.isCreating = false;
                }
            }
        });
    }
    this.removeDvir = function(el, dvirId){
        showModalConfirmation('Confirmation', '<p class="text-center">Are you sure you want to delete the DVIR?</p>');
        $('#confirmationModal').off('click', '#btnConfirmClick').on('click', '#btnConfirmClick', function () {
            AjaxController('apiDvirRemove', {dvirId: dvirId}, dashUrl, function(response){
                if(response.code == '000'){
                    if (response.data.approved) $('#nav_dis_con a[href="/dash/history/dvirs/"]').click();
                    else {
                        showModal('Delete approve', '<center>The driver must approve the removal of DVIR.</center>');
                        self.loadAddedEditOffers();
                        $(el).remove();
                    }
                }
            }, function(){}, true);
        });
        return false;
    }
    this.validateForm = function(){
        var isValid = true;
        $('#log_info input[type="text"].required, #log_info textarea.required, #log_info select.required').each(function(){
            if (!$(this).val()) {
                $(this).addClass('error');
                isValid = false;
            } else $(this).removeClass('error');
        });
        if (self.isCreating && !(self.isEld && !self.isAobrd)) {
            if (!signatureObj1.validateSignature('#signature_dvir_dr')) isValid = false;
        }
        if ($('#dvir_def_corrected button.active').data('val') && $('#signature_dvir_mech:visible').length && $('#mechanic').length) {
            if (!signatureObj2.validateSignature('#signature_dvir_mech')) isValid = false;
        }
        return isValid;
    }
    this.addNewDvir = function(el){
        dc.getUrlContent('/dash/history/dvir/', {
            dvirId: -1,
            date: convertDateToSQL('')
        });
    }
    this.addNewDvirForDriver = function(){
        dc.getUrlContent('/dash/trucks/dvir/', {
            dvirId: -1,
            date: convertDateToSQL('')
        });
    }
    // 
    this.afterSaveSignatureCallback = function(signId, signType){
        AjaxController('apiSaveDvirSignature', {dvirId: self.dvirId, signId: signId, signType: signType}, dashUrl, function(){
            
        }, errorBasicHandler, true);
    }
    this.driversSelectOnchange = function(el){
        self.driverId = parseInt($(el).val());
        self.isEld = $(el).find('option:selected').data('eld');
        self.isAobrd = $(el).find('option:selected').data('aobrd');
		self.isAobrdCanEdit = $(el).find('option:selected').data('aobrd_canedit');
        if (self.isEld && !self.isAobrd && self.driverId != curUserId) {
            $('.dvir_odometer').closest('.field').show().val('0');
            $('#signature_dvir_dr').hide();
            $('#driverSignature p').text('Driver will sign the DVIR on offer approval').show();
        } else {
            if (self.driverId != curUserId) {
            $('.dvir_odometer').closest('.field').hide().val('0');
            } else {
                $('.dvir_odometer').closest('.field').show().val('0');
            }
            $('#signature_dvir_dr').show();
            $('#driverSignature p').hide();
        }
        if ($(el).val()) {
            $(el).removeClass('error');
            $('.use-previous-signature').show();
        } else {
            $(el).addClass('error');
            $('.use-previous-signature').hide();
        }
		
        // init google search
        if (self.isCreating && self.driverId) self.locationAutocompleteClick($('#location_id')[0]);

    }
    this.defectsCorrectedSwitch0 = function(el){
        if (typeof self.gDvirs[self.dvirIndex] != 'undefined' && self.gDvirs[self.dvirIndex].mechanic) {
            showModalConfirmation('Confirmation', '<p class="text-center">Are you sure you want to remove the signature of the mechanic?</p>');
            $('#confirmationModal').off('click', '#btnConfirmClick').on('click', '#btnConfirmClick', function () {
                doActive(el);
                $('#mechanic').val('');
                $('#signature_dvir_mech .clear-signature').click();
                $('.mechanicSignature_cont').hide();
                $('.statusDvirH2').addClass('statusDvirErr').removeClass('statusDvirOk');
                self.statusDvirText();
            });
        } else {
            doActive(el);
            $('#mechanic').val('');
            $('#signature_dvir_mech .clear-signature').click();
            $('.mechanicSignature_cont').hide();
            $('.statusDvirH2').addClass('statusDvirErr').removeClass('statusDvirOk');
            self.statusDvirText();
        }
    }
    this.defectsCorrectedSwitch1 = function(el){
        doActive(el);
        $('.mechanicSignature_cont').show();
        $('#mechanicSignature').hide();
        $('#signature_dvir_mech').show();
        $('.statusDvirH2').addClass('statusDvirOk').removeClass('statusDvirErr');
        self.statusDvirText();
    }
    this.commonDefectsChange = function(){
        if ($('.track_defects:checked, .trailers_defects:checked').length > 0) {
            $('.def_corrected_cont').show();
            if ($('#dvir_def_corrected button.active').data('val')) {
                $('.mechanicSignature_cont').show();
                $('#dvir_def_corrected button.active').removeClass('active');
                if (typeof self.gDvirs[self.dvirIndex] != 'undefined' && self.gDvirs[self.dvirIndex].mechanic) {
                    $('#dvir_def_corrected button[data-val="1"]').addClass('active');
                } else {
                    $('#dvir_def_corrected button[data-val="0"]').addClass('active');
                }
            }
        } else {
            $('.def_corrected_cont').hide();
            $('.mechanicSignature_cont').hide();
        }
        self.statusDvirText();
    }
    this.statusDvirText = function(){
        if ($('.track_defects:checked, .trailers_defects:checked').length > 0) {
            if ($('#dvir_def_corrected button.active').data('val')) {
                $('.statusDvirH2').removeClass('statusDvirErr').addClass('statusDvirOk');
                $('#statusDvir').html('All defects are corrected');
            } else {
                $('.statusDvirH2').addClass('statusDvirErr').removeClass('statusDvirOk');
                $('#statusDvir').html('All defects need to be corrected');
            }
        } else {
            $('.statusDvirH2').removeClass('statusDvirErr').addClass('statusDvirOk');
            $('#statusDvir').html('No Defect');
        }
    }
    
    this.locationAutocompleteKeydown = function(el) {
        c('locationAutocompleteKeydown');
        window.setTimeout(function(){ 
            $(".pac-container.pac-logo").prependTo(".f_data.dvir_location");
        }, 30);
    }
    this.locationAutocompleteClick = function(el) {
        if (self.isCreating && !self.driverId) self.driversSelectOnchange($('#dvir_driver_create_select')[0]);
        
        if (self.driverId) { 
            if ($(el).attr('data-googled') == 0) {
                var options = {};
                if (self.isAobrd || !self.isEld) options.types = ['(cities)']; //(regions)
                self.autocomplete = new google.maps.places.Autocomplete(document.getElementById('location_id'), options);
                google.maps.event.addListener(self.autocomplete, 'place_changed', function() {
                    var place = self.autocomplete.getPlace(),
                        locationName = '',
                        locationArr = [];
                    if (self.isAobrd || !self.isEld) {
                        $.each(place.address_components, function(k, v){
                            if (v.types[0] == 'administrative_area_level_1') locationArr[1] = v.long_name;
                            else if (v.types[0] == 'locality') locationArr[0] = v.long_name;
                        });
                    } else {
                        $.each(place.address_components, function(k, v){
                            if (v.types[0] == 'administrative_area_level_1') locationArr[2] = v.long_name;
                            else if (v.types[0] == 'locality') locationArr[1] = v.long_name;
                            else if (v.types[0] == 'route') locationArr[0] = v.long_name;
                        });
                        if (!locationArr[0]) locationArr.splice(0, 1);
                    }
                    locationName = locationArr.join(', ');

                    $('#location_id').val(locationName.toLocaleUpperCase()).trigger('change');
                });
                $(el).attr('data-googled', 1);
            } else {
                if (self.isAobrd || !self.isEld) self.autocomplete.setTypes(['(cities)']);
                else self.autocomplete.setTypes([]);
            }
        }
    }
}

function dvirPageHandler(response){
    dvirObj.dvirPageHandlerFn(response);
}

$(document).on('keypress', '.inputOnlyNumber', function(event) {
    //c(event.which);
    if (
        (event.which != 0) && 
        (event.which != 8) && 
        (event.which != 37) && 
        (event.which != 39) && 
        (event.which != 44 || $(this).val().indexOf('.') != -1) && 
        (event.which != 46 || $(this).val().indexOf('.') != -1) && 
        (event.which < 48 || event.which > 57)
    ) {
        event.preventDefault();
    }
});


