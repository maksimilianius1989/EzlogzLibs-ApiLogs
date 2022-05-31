function documentsController() {
    var self = this;
    this.getOneDocLine = function (doc) {
        doc.trName = doc.trName == null ? '' : doc.trName;
        var driver = doc.userId > 0 ? createProfilePopupButton(doc.userId, doc.drName + ' ' + doc.drLast) : '';
        return '<tr class="edit_row" data-id="' + doc.id + '" onclick="docC.oneDocInfo(' + doc.id + ')">\
            <td class="docDate time_sql_to_local">' + convertDateToUSA(doc.date) + '</td>\
            <td>' + doc.reference.trunc(25) + '</td>\
            <td>' + doc.docTypeName + '</td>\
            <td>' + driver + '</td>\
            <td>'+truckCardLink(doc.trId, doc.trName)+'</td>\
            <td class="action_td" data-id="' + doc.id + '">\
                <button onclick="docC.downloadDocPdf(' + doc.id + ', event);" class="btn btn-default" title="pdf" >Download PDF</button>\
                <button onclick="docC.deleteDocument(' + doc.id + ', ' + doc.userId + ', event);" class="btn btn-default" title="delete" >Delete</button>\
            </td>\
        </tr>';
    }
    this.deleteDocument = function (docId, userId, event) {
        event.stopPropagation();
        if (confirm('Are you sure you want to DELETE this document?')) {
            AjaxController('deleteDocument', {id: docId, userId: userId}, apiDashUrl, docC.deleteDocumentHandler, docC.deleteDocumentHandler, true);
        }
    }
    this.deleteDocumentHandler = function (response) {
        // Перезагрузить текущую страницу
        document.location.reload();
    }
    this.oneDocInfo = function (docId) {
        AjaxController('getDocumentInfo', {docId: docId}, apiDashUrl, docC.getDocumentInfoHandler, docC.getDocumentInfoHandler, true);
    }
    this.getDocumentInfoHandler = function (response) {
        //emptyParams();
        var thisDoc = response.data.docInfo;
        $.each(thisDoc.docInfo, function (key, info) {
            thisDoc[info.infoName] = info.infoData
        })
        $('.save_edit').attr('data-id', thisDoc.id);
        $('.save_edit').addClass();
        $('#edit_doc_type').val(thisDoc.type).change();
        $('#edit_reference').val(thisDoc.reference);
        // var edit_date = convertDateWithTimeZone(thisDoc.date, true);
        $('#edit_dateTime').val(moment(thisDoc.date).format('MM-DD-YYYY'));
        $('#edit_truck').val(thisDoc.truckId);
        $('#edit_driver').val(thisDoc.userId);
        $('#edit_notes').val(thisDoc.note);
        var image = MAIN_LINK + '/docs/' + thisDoc.type + '/' + thisDoc.name;
        if (typeof thisDoc.awsName != 'undefined' && thisDoc.awsName != null && $.trim(thisDoc.awsName) != '') {
            image = thisDoc.awsName;
        }
    //    $('#box_for_images').append('<a href="' + image + '" target="_blank" ><img src="' + image + '"></a>');
        $('#box_for_images').append(drawImage(image));
        $('.additional.typed input,.additional.typed select').each(function () {
            var id = $(this).attr('id');
            var field = id.substring(5);
            if (thisDoc[field] == 'null' || thisDoc[field] == 'undefined')
                thisDoc[field] = '';
            if (field == 'ship_date' || field == 'delivery_date') {
                thisDoc[field] = convertDateToUSA(thisDoc[field]);
            }
           // $(this).val(thisDoc[field]);
            // RS 2020-06-25 Add checkbox checked
            if ($(this).attr('type') == 'checkbox') {
                if ($(this).val() == thisDoc[field]) {
                    $(this).prop("checked", true);
                }
            }else {

                               $(this).val(thisDoc[field]);

                           }
        })
        $('#one_doc_box .box_header').text('Edit Document');
        $('.save_edit').addClass('editing').show();
        $('#one_doc_box').show();
    }
    self.downloadDocPdf = function (documentId, event) {
        event.stopPropagation();
        var params = {};
        params.name = "image";
        params.documentId = documentId;
        pdfGen.generateAndSendForm(params, {'action': 'oneDocument'});
    }
}
var docC = new documentsController();
function getFileName(elm) {
    //c(elm);
    //c('$(elm)[0].files='+ $(elm)[0].files);
    //c('$(elm)[0].files.length='+ $(elm)[0].files.length);
    if ($(elm)[0].files.length > 0) {
        var fn = $(elm)[0].files[0].name;
        $(elm).parent().find('.fake_button').html(fn);
    }
    var form_id = $(elm).closest('form').attr('id');
    c('#form_id=' + form_id);
    submitForm(form_id);
}

function submitForm(id) { //c('id='+id);
    if (window.location.pathname == "/dash/history/log/" || window.location.pathname == "/dash/views/dispatcher/log/" || window.location.pathname == "/dash/drivers/") {
        var isLogbook = 1;
    } else {
        var isLogbook = 0;
    }

    var fd = new FormData(document.getElementById(id));  //c('fd');c(fd);
    fd.append("label", "WEBUPLOAD");
    $.ajax({
        url: MAIN_LINK + "/db/imageSaver.php",
        type: "POST",
        data: fd,
        enctype: 'multipart/form-data',
        processData: false, // tell jQuery not to process the data
        contentType: false   // tell jQuery not to set contentType
    }).done(function (result) {
        var res = jQuery.parseJSON(result);
        $('#images_form .log_error').text("");
        if (res[0].error !== undefined || res[0].url === undefined) {
            $('.log_error.reg_fl_file').text(res[0].error);
            return false;
        }
        for (var x = 0; x < res.length; x++) {
            var image = res[x].url;
          //  var imageEl = '<a href="' + image + '" target="_blank"><img src="' + image + '"></a>';
          //  $('#box_for_images').empty().append(imageEl).show();
            $('#box_for_images').empty().append(drawImage(image)).show();
        }
    });
    return false;
}

function saveDoc(fields) {
    $('.save_edit').prop('disabled', true);
    if ($('.save_edit').hasClass('editing')) {
        fields.action = 'editDocument';
        fields.id = $('.save_edit').attr('data-id');
    } else {
        fields.action = 'sendDocument';
    }

    data = {data: fields};
    $.ajax({
        url: MAIN_LINK + '/db/dashController/' + '?' + window.location.search.substring(1),
        method: "POST",
        contentType: "application/json", // send as JSON
        data: JSON.stringify(data),
        success: function (data) {
            var response = jQuery.parseJSON(data);
            if (response.code == '000') {
                var doc = response.data;
                if (!isLogbook) {
                    docPaginator.changePagination();
                } else {
                    docs.push(doc)
                    appendDoc(doc);
                    $('select#doc_type option[value="' + doc.docTypeId + '"]').show();
                }

                $('.save_edit_result').text('Saved');
                $('.save_edit').prop('disabled', true).css('opacity', '0'); //$('.save_edit').prop('disabled', false);
                setTimeout("$('.close_edit').click();", 500);
            } else {
				$('.save_edit').prop('disabled', false);
				if(response.code == '115'){
					var fieldType = response.message;
					$('input[data-type="'+fieldType+'"]').addClass('error');
					return false;
				}
                $('.save_edit_result').text(response.message);
            }
        }
    });
}
function documentsPaginationHandler(response, tableId) {
	if(response.code == '115'){
		var fieldType = response.message;
		$('input[data-type="'+fieldType+'"]').addClass('error');
		return false;
	}
    var body = $('#' + tableId).find('tbody')
    body.empty();
    $.each(response.data.result, function (key, row) {
        body.append(docC.getOneDocLine(row));
    })
}
function downloadDocPdf(url, event) {
    event.stopPropagation();
    var params = {};
    params.name = "image";
    params.url = url;
    pdfGen.generateAndSendForm(params);
}
function sortDocuments() {
    return false;
    $('.tablesorter').tablesorter({
        sortList: [[0, 1]],
        headers: {
            1: {
                sorter: 'text'
            },
            5: {
                sorter: false
            }
        }
    });
    filter();
}
function fillHistoryParams(curHdoc, historyId) {
    // console.log(curHdoc);
    var thisDoc = false;
    var historyOpts = '<option value="0">Latest</option>';
    if (historyId == 0) {
        thisDoc = curHdoc;
        for (var x = curHdoc.history.length - 1; x >= 0; x--) {
            var hDoc = curHdoc.history[x];
            var hDocId = hDoc.id;
            var hDocDate = hDoc.date;
            var hDocName = hDoc.userName + ' ' + hDoc.userLast;
            historyOpts += '<option value="' + hDocId + '">' + hDocDate + ' by ' + hDocName + '</option>';
        }
    } else {
        for (var x = curHdoc.history.length - 1; x >= 0; x--) {
            var hDoc = curHdoc.history[x];
            var hDocId = hDoc.id;
            var hDocDate = hDoc.date;
            var hDocName = hDoc.userName + ' ' + hDoc.userLast;
            historyOpts += '<option value="' + hDocId + '">' + hDocDate + ' by ' + hDocName + '</option>';
            if (hDocId == historyId) {
                thisDoc = hDoc;

            }
        }

    }
    if (thisDoc == false) {
        $('.log_error.reg_fl_file').text('History file not found');
        return false;
    }
    emptyParams();
    $('#one_doc_box .popup_box_panel').append('<div id="history_selection_box"><label>Chose change date: </label><select id="chose_history" class="ez_input">' + historyOpts + '</select></div>');
    $('.save_edit').attr('data-id', thisDoc.id);
    $('#edit_doc_type').val(thisDoc.type).change();
    $('#edit_reference').val(thisDoc.reference);
    var edit_date = convertDateWithTimeZone(thisDoc.date, true);
    $('#edit_dateTime').val(edit_date);
    $('#edit_truck').val(thisDoc.truckId);
    $('#edit_driver').val(thisDoc.userId);
    $('#edit_notes').val(thisDoc.note);
    var image = MAIN_LINK + '/docs/' + thisDoc.type + '/' + thisDoc.name;
    //$('#box_for_images').append('<a href="' + image + '" target="_blank" ><img src="' + image + '"></a>');

    $('#box_for_images').append(drawImage(image));
    $('.additional.typed input,.additional.typed select').each(function () {
        var id = $(this).attr('id');
        var field = id.substring(5);
        $(this).val(thisDoc[field]);
    })
    $('.box_header').text('Document History');
    $('.save_edit').hide();
    $('#chose_history').val(historyId)
    return true;

}

function fillParams(rowEl) {
    emptyParams();

    var id = $(rowEl).attr('data-id');
    var thisDoc = '';
    for (var x = 0; x < docs.length; x++) {
        var doc = docs[x];
        if (doc.id == id) {
            thisDoc = doc;
            break;
        }
    }
    if (thisDoc == '') {
        return false;
    }
    $('.save_edit').attr('data-id', thisDoc.id);
    $('.save_edit').addClass();
    $('#edit_doc_type').val(thisDoc.type).change();
    $('#edit_reference').val(thisDoc.reference);
    var edit_date = convertDateWithTimeZone(thisDoc.date, true);
    $('#edit_dateTime').val(edit_date);
    $('#edit_truck').val(thisDoc.truckId);
    $('#edit_driver').val(thisDoc.userId);
    $('#edit_notes').val(thisDoc.note);
    var image = MAIN_LINK + '/docs/' + thisDoc.type + '/' + thisDoc.name;
    //$('#box_for_images').append('<a href="' + image + '" target="_blank" ><img src="' + image + '"></a>');
    $('#box_for_images').append(drawImage(image));
    $('.additional.typed input,.additional.typed select').each(function () {
        var id = $(this).attr('id');
        var field = id.substring(5);
        if (thisDoc[field] == 'null' || thisDoc[field] == 'undefined')
            thisDoc[field] = '';
        $(this).val(thisDoc[field]);
    })
    return true;

}


function filter() {
    if ($('.dates').val() == '' && $('#search_text').val() == '' && $('#doc_type').val() == 'all') {
        $('.sec_body tbody tr').show();
    }
    $('.sec_body tbody tr').hide().each(function () {
        var canShow = true;
        if ($('.dates').val() != '' && $(this).attr('data-date').indexOf($('.dates').val()) < 0) {
            canShow = false;
        }
        if ($('#doc_type').val() != 'all' && $('#doc_type').val() != $(this).attr('data-type')) {
            canShow = false;
        }
        if ($('#search_text').val() != '') {
            //var filter = $('input[name="search_type"]:checked').val();
            var filter = $('#driverOrTruck').val();
            var filterName = '';
            var filterVal = $('#search_text').val();
            if (filter == 'tr') {
                filterName = $(this).attr('data-truck');
            } else {
                filterName = $(this).attr('data-name');
            }
            if (filterName.toLowerCase().indexOf(filterVal.toLowerCase()) < 0) {
                canShow = false;
            }

        }
        if (canShow) {
            $(this).show();
        }
    });
}
function attachmentsHandler(response) {
    c('attachmentsHandler');

    trucks = response.data.trucks,
            trailers = response.data.trailers,
            drivers = response.data.drivers,
            states = response.data.states,
            docs = response.data.docs;

    c('trucks');
    c(trucks);
    c('trailers');
    c(trailers);
    c('states');
    c(states);
    c('docs');
    c(docs);
    c('drivers');
    c(drivers);
    if ($('#attachments_modal').hasClass('edit')) {
        $('.attachment_tab.attachment_add').click();
        $('.attachments_tabs').hide();
        $('#attachments_modal h5').text('Edit document');
        var docId = $('#attachment_info').attr('data-docId');
        c('docId');
        c(docId);
        var thisDocArray = docs.filter(function (e) {
            return e.id == docId;
        });
        c('thisDocArray');
        c(thisDocArray);
        var thisDoc = thisDocArray[0];
        c('thisDoc');
        c(thisDoc);
        $('.save_edit').attr('data-id', thisDoc.id);
        $('#edit_doc_type').val(thisDoc.type).change();
        $('#edit_reference').val(thisDoc.reference);
        var edit_date = convertDateWithTimeZone(thisDoc.date, true);
        $('#edit_dateTime').val(edit_date);
        $('#edit_truck').val(thisDoc.truckId);
        $('#edit_driver').val(thisDoc.userId);
        $('#edit_notes').val(thisDoc.note);
        var image = MAIN_LINK + '/docs/' + thisDoc.type + '/' + thisDoc.name;
        //$('#box_for_images').append('<a href="' + image + '" target="_blank" ><img src="' + image + '"></a>');
        $('#box_for_images').append(drawImage(image));
        $('.additional.typed input,.additional.typed select').each(function () {
            var id = $(this).attr('id');
            var field = id.substring(5);
            $(this).val(thisDoc[field]);
        });
        $('.modal').modal('hide');
        $('#attachments_modal').modal('show');
        return false;
    }

    $('#attachment_list').find('.sec_body').html('');
    var excludeIds = [];
    $('select#doc_type option').hide();
    $('.attachment_info_cont .attachment_info_div .attachment_info').each(function () {
        if ($(this).attr('data-docid'))
            excludeIds.push(parseInt($(this).attr('data-docid')));
    });
    for (var x = 0; x < docs.length; x++) {
        if ($.inArray(docs[x].id, excludeIds) == -1) {
            appendDoc(docs[x]);
            // show only existed docTypes
            $('select#doc_type option[value="' + docs[x].docTypeId + '"]').show();
        }
    }
    $('select#doc_type option[value="all"]').show();
    $('select#doc_type').val("all").change();
    $('select#doc_type optgroup:not(:has(*))').hide();

    $('.attachments_tabs').show();
    $('.attachment_tab.attachment_list').click();
    $('#attachments_modal').modal('show');
}
function emptyAttachmentParams() {
    c('emptyAttachmentParams');
    $('#images_form .log_error').text("");
    $('.attachments_tabs, #attachment_list, #attachment_add').hide();
    $('#attachments_modal').removeClass('edit');
    $('#attachments_modal h5').text('Attach documents');
    emptyParams();
}

function emptyParams() {
    c('emptyParams');
    $('.save_edit_result').text('');
    $('.fake_button ,#edit_doc_type').removeClass('error');
    $('#history_selection_box').remove();
    $('#edit_doc_type').val('-1').change();
    $('#box_for_images').empty();
    c($('#box_for_images').html());
    $('#edit_notes').val('');
    $('#images_form').closest('form').get(0).reset();
    $('#one_doc_box .box_header').text('New Document');
    $('.save_edit').removeAttr('data-id').removeClass('editing').css('opacity', '1').prop('disabled', false).show();
}

function addAttchment(obj, changeStatus = true) {
    if ($('.attachment_info_cont .attachment_info_div:last .removeDoc').length > 0) {
        var last_div = $('.attachment_info_cont .attachment_info_div:last').clone();
    } else {
        var last_div = $('.attachment_info_cont .attachment_info_div');
    }
    var docId = obj.id || $(obj).attr('doc-id'),
            docTypeName = obj.docTypeName || $(obj).attr('doc-typeName');

    last_div.find('.attachment_info').attr('data-docId', docId).html(docTypeName + ' №' + docId).append('<span class="removeDoc" onclick="removeAttchment(this)"></span>');
    $('.attachment_info_cont').append(last_div);
    if (changeStatus)
        logbook.statusFieldChange('.attachment_info_cont #docId');

    $('#attachments_modal').modal('hide');
}
function attachmentControl() {
    if (!userId && isLogbook && logbook.userId)
        userId = logbook.userId;
    AjaxController('getInfoToAttachDocs', {userId: userId}, apiLogbookUrl, 'attachmentsHandler', attachmentsHandler, true);
}
function removeAttchment(obj, changeStatus = true) {
    if (obj == 'all') {
        $('.attachment_info_cont .attachment_info_div .removeDoc').each(function () {
            removeAttchment(this, changeStatus);
        });
    } else if ($('.attachment_info_cont .attachment_info_div').length > 1) {
        $(obj).closest('.attachment_info_div').remove();
        if (changeStatus)
            logbook.statusFieldChange('.attachment_info_cont #docId');
    } else {
        $(obj).closest('.attachment_info').html('').attr('data-docId', '');
        if (changeStatus)
            logbook.statusFieldChange('.attachment_info_cont #docId');
}
}
function saveDocumentEdit() {
    var fields = {};
    var attachment_block = isLogbook ? '#attachment_add' : '#one_doc_box';
    //var canSave = 0;
    var errors = 0;
   // $(attachment_block).find('input[type=text], input[type=number], select, textarea').removeClass('error').each(function () {
    // RS 2020-06-25: Add input[type=checkbox] for taxable gallons
    $(attachment_block).find('input[type=text], input[type=checkbox], input[type=number], select, textarea').removeClass('error').each(function () {
        //c(this);
        var id = $(this).attr('id');
        var field = id.substring(5);
        //c('field=');c(field);
        var value = $(this).val();

        // RS: now let's find checkboxes (first of all for taxable gallons)
        // And check if thea are checked. If no - reset value to 0
        if ($(this).attr('type') == 'checkbox' && !$(this).is(':checked')) {
            value = 0;
        }

        fields[field] = value;
        if (field == 'doc_type' && value == '-1') {
            $(this).addClass('error');
            errors++;
        }

        if (value == '0') {
            if (field == 'driver') {  // || field == 'truck' || field == 'state'
                $(this).addClass('error');
                errors++;
            }
        } else if (value == '' && (field == 'reference' || field == 'dateTime')) {
            $(this).addClass('error');
            errors++;
        }

        // RS: All dates must be required because PHP-controller will return Error500

                if ($(this).hasClass('datepicker')) {

                        // If it is not date

            var regex = /^[0-9]{2}[\-][0-9]{2}[\-][0-9]{4}$/g;

                       if(!regex.test(value)){

                $(this).addClass('error');
              errors++;

                     } else {

                $(this).removeClass('error');

                        //canSave = true;

                    }

        }

        if (field == 'amount' || field == 'gallons' || field == 'reefer_amount' || field == 'reefer_gallons') {
            if (parseInt(value) < 0 && value.length) {
                $(this).addClass('error');
                errors++;
            } else {
                $(this).removeClass('error');
                //canSave = true;
            }
        }
        /*
         if(field == 'dealer' || field == 'scale' || field == 'shipper' || field == 'delivery_date'|| field =='ship_date' || field =='location') {
         $(this).removeClass('error');
         //canSave = true;
         }
         */

        if (field == 'dateTime') {
			var regex = /^[0-9]{2}[\-][0-9]{2}[\-][0-9]{4}$/g;
			if(!regex.test(value)){
				$(this).addClass('error');
				errors++;
			} else {
				fields[field] = value; 
            }
        }
        c('field=' + field);
        c('value=' + value);
        c('errors=' + errors);
    })
    $('.fake_button').removeClass('error');
    //var image = $('#box_for_images img').attr('src');
    var image = $('#box_for_images input[type=hidden]').val();
    if (image != undefined && image != '') {
        fields['image'] = image;
    } else {
        $('.fake_button').addClass('error');
        //canSave = false;
        errors++;
        c('image error');
    }

    c('all errors=' + errors);
    if (!errors) {
        saveDoc(fields);
    }
}
function editDocTypeChange() {
    c('editDocTypeChange');
    var edit_doc_type = $('#edit_doc_type').val();
    if (!userId && isLogbook && logbook.userId)
        userId = logbook.userId;

    $('.gen .additional').remove();
    if (edit_doc_type == '-1') {
        return;
    }
    $('.gen').append('<div class="box_row additional"><label>Reference #</label>\n\<input type="text" id="edit_reference"/></div>');
    $('.gen').append('<div class="box_row additional"><label>Doc Date</label>\n\<input type="text" class="datepicker" id="edit_dateTime" placeholder="mm-dd-yyyy" data-type="editDate"/></div>');

    $("#edit_dateTime").datepicker({
        dateFormat: 'mm-dd-yy',
        autoclose: false,
        showButtonPanel: true,
    });
	$("#edit_dateTime").mask('00-00-0000');

    if (edit_doc_type == 5 || edit_doc_type == 13) {
        var trucksDiv = '<div class="box_row additional"><label>Trailer</label>\n\<select id="edit_truck"><option value="0">Select Trailer</option>';
        for (var x = 0; x < trailers.length; x++) {
            var truck = trailers[x];
            var truckId = truck.id;
            var truckName = truck.Name;
            trucksDiv += '<option value="' + truckId + '">' + truckName + '</option>';
        }
    } else {
        var trucksDiv = '<div class="box_row additional"><label>Truck</label>\n\<select id="edit_truck"><option value="0">Select Truck</option>';
        for (var x = 0; x < trucks.length; x++) {
            var truck = trucks[x];
            var truckId = truck.id;
            var truckName = truck.Name;
            trucksDiv += '<option value="' + truckId + '">' + truckName + '</option>';
        }
    }

    trucksDiv += '</select></div>';
    $('.gen').append(trucksDiv);
    var driversDiv = '<div class="box_row additional"><label>Driver</label>\n\<select id="edit_driver"><option value="0">Select Driver</option>';
    if (isLogbook) {
        var driverId = $('#select_carrier option:selected').attr('data-driverid'),
                driverName = $('#select_carrier option:selected').text().trim().split(" ");
        if (!driverId) {
            driverId = $('#drivers_sec .driver_row.active').data('id');
            driverName = $('#drivers_sec .driver_row.active .driver_name_cell .user_pupop_icon .clickable_item').text().trim().split(" ");
        }
        // driver dash
        if (!driverId) {
            driverId = $('#log_box[data-st="status"]').data('id');
            driverName[0] = $('input#first_name').val();
            driverName[1] = $('input#last_name').val();
        }
        drivers = [{usId: driverId, name: driverName[0], last: driverName[1]}];
    }
    for (var x = 0; x < drivers.length; x++) {
        var driver = drivers[x];
        var truckId = driver.usId;
        var truckName = driver.name + ' ' + driver.last;
        driversDiv += '<option value="' + truckId + '" ' + (driver.usId == userId ? 'selected' : '') + '>' + truckName + '</option>';
    }
    driversDiv += '</select></div>';
    $('.gen').append(driversDiv);

    if (edit_doc_type == 0 || edit_doc_type == 1 || edit_doc_type == 3 || edit_doc_type == 4 || edit_doc_type == 5 || edit_doc_type == 7) {
        $('.gen').append('<div class="box_row additional typed"><label>Amount</label>\n\<input type="text" id="edit_amount" min="0"/></div>');
    }
    if (edit_doc_type == 0) {
        $('.gen').append('<div class="box_row additional typed"><label>Gallons</label>\n\<input type="text" id="edit_gallons" min="0"/></div>');
        $('.gen').append('<div class="additional typed"><input type="checkbox" id="edit_taxGallons" value="1"/><label for="edit_taxGallons">&nbsp;\nAll gallons are taxable</label></div>');

        $('.gen').append('<div class="box_row additional typed"><label>Reefer Amount</label>\n\<input type="text" id="edit_reefer_amount" min="0"/></div>');
        $('.gen').append('<div class="box_row additional typed"><label>Reefer Gallons</label>\n\<input type="text" id="edit_reefer_gallons" min="0"/></div>');
    }
    if (edit_doc_type == 0 || edit_doc_type == 7) {
        var statesOpts = '<option value="0">Select State</option>';
        for (var x = 0; x < locationStates.length; x++) {
            statesOpts += '<option value="' + locationStates[x].id + '">' + locationStates[x].name + '</option>';
        }
        $('.gen').append('<div class="box_row additional typed"><label>State</label>\n\<select id="edit_state">' + statesOpts + '</select></div>');
    }
    if (edit_doc_type == 1 || edit_doc_type == 8) {
        $('.gen').append('<div class="box_row additional typed"><label>Location</label>\n\<input type="text" id="edit_location"/></div>');
    }
    if (edit_doc_type == 2) {
        $('.gen').append('<div class="box_row additional typed"><label>Scale</label>\n\<input type="text" id="edit_scale"/></div>');
    }
    if (edit_doc_type == 5 || edit_doc_type == 4) {
        $('.gen').append('<div class="box_row additional typed"><label>Dealer</label>\n\<input type="text" id="edit_dealer"/></div>');
    }
    if (edit_doc_type == 6) {
        $('.gen').append('<div class="box_row additional typed"><label>Shipper</label>\n\<input type="text" id="edit_shipper"/></div>');
        $('.gen').append('<div class="box_row additional typed"><label>Ship date</label>\n\<input type="text" class="datepicker" id="edit_ship_date"/></div>');
        $('.gen').append('<div class="box_row additional typed"><label>Delivery date</label>\n\<input type="text" class="datepicker" id="edit_delivery_date"/></div>');
    }
    if (edit_doc_type == 8 || edit_doc_type == 10) {
        var trucksDiv = '<div class="box_row additional typed"><label>Trailer</label>\n\<select id="edit_trailerId"><option value="0">Select Trailer</option>';
        for (var x = 0; x < trailers.length; x++) {
            var truck = trailers[x];
            var truckId = truck.id;
            var truckName = truck.Name;
            trucksDiv += '<option value="' + truckId + '">' + truckName + '</option>';
        }
        trucksDiv += '</select></div>';
        $('.gen').append(trucksDiv);
    }

    $('.gen').find('.datepicker').each(function () {
        $(this).datepicker({
            dateFormat: 'mm-dd-yy',
            autoclose: false,
            showButtonPanel: true,
        });
    });

}
function filterTypeChange() {
    var filter_type = $('#doc_type').val();
    $('.attachment').removeClass('first');
    if (filter_type != 'all') {
        $('.attachment').hide();
        $('.attachment[data-type="' + filter_type + '"]').show().first().addClass('first');

    } else {
        $('.attachment').show();
    }
}

function convertDateWithTimeZone(docDate, DateToUSA = false) {
    var d = logbook.newDate(docDate);
    var currentDate = new Date();
    var userTimezoneOffset = currentDate.getTimezoneOffset() * 60000;
    var newDate = new Date(d.getTime() - userTimezoneOffset);
    var curr_date = newDate.getDate(),
            curr_month = newDate.getMonth() + 1,
            curr_year = newDate.getFullYear(),
            pad = "00",
            curr_month = (pad + curr_month).slice(-pad.length),
            curr_date = (pad + curr_date).slice(-pad.length);
    var dateStr = curr_year + "-" + curr_month + "-" + curr_date;
    if (DateToUSA) {
        dateStr = convertDateToUSA(dateStr);
    }
    //dateStr = dateStr.replace(' ', '');
    return dateStr;
}

function appendDoc(doc) {
    var date_block = convertDateWithTimeZone(doc.date, true); //.replace(' ', '<span class="indent"></span>');
    var doc_html = '<div id="attachment' + doc.id + '" class="attachment" data-type="' + doc.docTypeId + '">';
    doc_html += '<div class="attachment-header" id="heading_' + doc.id + '"><h5 class="mb-0">';
    doc_html += '<div id="attachment_title_' + doc.id + '" class="attachment_title collapsed" data-toggle="collapse" data-target="#collapse_' + doc.id + '" aria-expanded="false" aria-controls="collapse_' + doc.id + '">' +
            date_block + '<span class="doc_name" style="position: absolute;left: 129px;bottom: 28px;">' + doc.reference + '</span><span class="indent"></span><span class="doc_type_name" style="position: absolute;left: 129px;bottom: 11px;color: #aaa;">' + doc.docTypeName + '</span></div><span class="add_attachment blue-border" doc-typeName="' + doc.docTypeName + '" doc-id="' + doc.id + '" onclick="addAttchment(this);">Add</span></h5> </div>';
    doc_html += '<div id="collapse_' + doc.id + '" class="collapse" aria-labelledby="heading_' + doc.id + '" data-parent="#accordion">';
    doc_html += '<div class="attachment-body">';
    doc_html += '<div class="doc_info"><table class="ez_table tablesorter"><tbody>';
    doc_html += '<tr><td>Reference #</td><td>' + doc.reference + '</td></tr>';
    doc_html += '<tr><td>Date</td><td>' + convertDateWithTimeZone(doc.date, true) + '</td></tr>';
    doc_html += '<tr><td>Doc type</td><td>' + doc.docTypeName + '</td></tr>';
    doc_html += '<tr><td>User</td><td>' + doc.userName + ' ' + doc.userLast + '</td></tr>';
    doc_html += '<tr><td>Truck</td><td>' + doc.trName + '</td></tr>';

    if (doc.type == 0 || doc.type == 1 || doc.type == 3 || doc.type == 4 || doc.type == 5 || doc.type == 7) {
        doc_html += '<tr><td>Amount</td><td>' + doc.amount + '</td></tr>';
    }
    if (doc.type == 0) {
        doc_html += '<tr><td>Gallons</td><td>' + doc.gallons + '</td></tr>';
        doc_html += '<tr><td>Reefer Amount</td><td>' + doc.reefer_amount + '</td></tr>';
        doc_html += '<tr><td>Reefer Gallons</td><td>' + doc.reefer_gallons + '</td></tr>';
    }
    if (doc.type == 0 || doc.type == 7) {
        for (var x = 0; x < locationStates.length; x++) {
            if (doc.state == locationStates[x].short) {
                doc_html += '<tr><td>State</td><td>' + locationStates[x].name + '</td></tr>';
            }
        }
    }
    if (doc.type == 1 || doc.type == 8) {
        doc_html += '<tr><td>Location</td><td>' + doc.location + '</td></tr>';
    }
    if (doc.type == 2) {
        doc_html += '<tr><td>Scale</td><td>' + doc.scale + '</td></tr>';
    }
    if (doc.type == 5 || doc.type == 4) {
        doc_html += '<tr><td>Dealer</td><td>' + doc.dealer + '</td></tr>';
    }
    if (doc.type == 6) {
        doc_html += '<tr><td>Shipper</td><td>' + doc.shipper + '</td></tr>';
        doc_html += '<tr><td>Ship date</td><td>' + doc.ship_date + '</td></tr>';
        doc_html += '<tr><td>Delivery date</td><td>' + doc.delivery_date + '</td></tr>';
    }
    if (doc.type == 8) {
        doc_html += '<tr><td>Trailer</td><td>';
        for (var x = 0; x < trailers.length; x++) {
            var truck = trailers[x];
            var truckId = truck.id;
            if (doc.truckId == truckId) {
                var truckName = truck.Name;
                doc_html += truckName;
            }
        }
        doc_html += '</td></tr>';
    }
    doc_html += '<tr><td>Note</td><td>' + doc.note + '</td></tr>';
    doc_html += '</tbody></table></div>';
    var image = MAIN_LINK + '/docs/' + doc.type + '/' + doc.name;
    //doc_html += '<div class="doc_image"><a href="' + image + '" target="_blank" ><img src="' + image + '"></a></div>';
    doc_html += '<div class="doc_image">' + drawImage(image) + '</div>';
    doc_html += '</div></div>';
    doc_html += '</div>';

    //c(doc_html);
    $('#attachment_list').find('.sec_body').append(doc_html);
}

getFileExt = function (image) {
    if (typeof image === 'undefined' || image == null) {
        return null;
    }
    var imageSplit = image.split('.');
    return imageSplit[imageSplit.length - 1];
}


// return image div
drawImage = function (image) {
    // Get extension
    var ext = getFileExt(image);

    // If wrong extension
    if (typeof ext === 'undefined' || ext == null || ext == '') {
        return '';
    }

    // Draw pdf
    if (ext == 'pdf') {
        var imageEl = '<br>PDF successfully uploaded' +
            '<br><a href="' + image + '" target="_blank">' +
            '<i class="fa fa-file-pdf-o" aria-hidden="true"></i>' +
            ' Download PDF</a>';
    } else {
        // Draw image
        var imageEl = '<a href="' + image + '" target="_blank"><img src="' + image + '"></a>';
    }
    // Also we need input tag to work with file;
    var imageUri = '<input type="hidden" value="' + image + '">';
    return imageEl + imageUri;
}



var userId = 0,
        trucks = [],
        trailers = [],
        drivers = [],
        states = [],
        docs = [];



