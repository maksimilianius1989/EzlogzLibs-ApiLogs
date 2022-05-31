$(document).ready(function () {
    getListImages();

    $('#drag-and-drop-zone').dmUploader({
        url: MAIN_LINK + '/db/fadmin_uploads/',
        dataType: 'json',
        allowedTypes: 'image/*',
        /*extFilter: 'jpg;png;gif',*/
        onInit: function () {
            add_log('Penguin initialized :)');
        },
        onBeforeUpload: function (id) {
            add_log('Starting the upload of #' + id);
            update_file_status(id, 'uploading', 'Uploading...');
        },
        onNewFile: function (id, file) {
            add_log('New file added to queue #' + id);
            add_file(id, file);
        },
        onComplete: function () {
            add_log('All pending tranfers finished');
        },
        onUploadProgress: function (id, percent) {
            var percentStr = percent + '%';
            update_file_progress(id, percentStr);
        },
        onUploadSuccess: function (id, data) {
            add_log('Upload of file #' + id + ' completed');
            add_log('Server Response for file #' + id + ': ' + JSON.stringify(data));
            update_file_status(id, 'success', 'Upload Complete');
            update_file_progress(id, '100%');
            var apText = '<tr data-id="' + data[0].id + '">\n\
                <td>' + data[0].id + '</td>\n\
                <td class="col_img"><img src="' + MAIN_LINK + '/docs/uploads/' + data[0].name + '" width="208"/></td>\n\
                <td class="col_name">' + data[0].name + '</td>\n\
                <td class="col_tit">' + data[0].title + '</td>\n\
                <td class="col_alt">' + data[0].alt + '</td>\n\
                <td class="actions_col">\n\
                    <i class="icon-close table_icon delete_row" title="delete"></i>\n\
                </td>\n\
            </tr>';
            $('#table_image_list tbody').append(apText);
        },
        onUploadError: function (id, message) {
            add_log('Failed to Upload file #' + id + ': ' + message);
            update_file_status(id, 'error', message);
        },
        onFileTypeError: function (file) {
            add_log('File \'' + file.name + '\' cannot be added: must be an image');
        },
        onFileSizeError: function (file) {
            add_log('File \'' + file.name + '\' cannot be added: size excess limit');
        },
        /*onFileExtError: function(file){
         $.danidemo.addLog('#demo-debug', 'error', 'File \'' + file.name + '\' has a Not Allowed Extension');
         },*/
        onFallbackMode: function (message) {
            alert('Browser not supported(do something else here!): ' + message);
        }
    });

    var updateArray = {};

    $('body').on('click', '#table_image_list tbody tr', function () {
        $('#update_image_info').show();

        $('#update_image_info .popup_box_panel .button_row .update_result').remove();

        var id = $(this).attr('data-id');
        updateArray['id'] = id;

        var name = $(this).find('.col_name').text();
        var splitName = name.split('.', );
        updateArray['name'] = splitName[0]+'.'+splitName[1];
        updateArray['fileType'] = '.'+splitName[splitName.length - 1];
        var title = $(this).find('.col_tit').text();
        var alt = $(this).find('.col_alt').text();

        $('#update_name').val(updateArray.name);
        $('#update_title').val(title);
        $('#update_alt').val(alt);
    });

    $('body').on('click', '.button_row .ez_button', function () {
        if ($(this).text() === 'Close') {
            $('#update_image_info').hide();
        }
        if ($(this).text() === 'Update') {
            // console.log('Update');
            updateImage(updateArray);
        }
        if ($(this).text() === 'Update & Close') {
            updateImage(updateArray);
            $('#update_image_info').hide();
        }
    });
    
    $('body').on('click', '#table_image_list tbody tr .delete_row', function (event) {
        event.stopPropagation();
        var id = $(this).closest('tr').attr('data-id');
        // console.log(id);
        delete_image('Are you sure you want to delete this image', id);
    });
});

function add_log(message)
{
    var template = '<li>[' + new Date().getTime() + '] - ' + message + '</li>';
    $('#debug').find('ul').prepend(template);
}

function add_file(id, file)
{
    var template = '' +
            '<div class="file" id="uploadFile' + id + '">' +
            '<div class="info">' +
            '<span class="filename" title="Size: ' + file.size + 'bytes - Mimetype: ' + file.type + '">' + file.name + '</span><br /><small>Status: <span class="status">Waiting</span></small>' +
            '</div>' +
            '<div class="bar">' +
            '<div class="progress" style="width:0%"></div>' +
            '</div>' +
            '</div>';
    $('#fileList').prepend(template);
}

function update_file_status(id, status, message)
{
    $('#uploadFile' + id).find('span.status').html(message).addClass(status);
}

function update_file_progress(id, percent)
{
    $('#uploadFile' + id).find('div.progress').width(percent);
}

function getListImages() {
    data = {data: {
            action: 'getListImages'
        }};
    $.ajax({
        url: MAIN_LINK + '/db/pagesInfo/' + '?' + window.location.search.substring(1),
        method: "POST",
        contentType: "application/json", // send as JSON
        data: JSON.stringify(data),
        success: function (data) {
            var response = jQuery.parseJSON(data);
            $.each(response.data, function (key, data) {
                var apText = '<tr data-id="' + data.id + '">\n\
                <td>' + data.id + '</td>\n\
                <td class="col_img"><img src="' + MAIN_LINK + '/docs/uploads/' + data.name + '" width="208"/></td>\n\
                <td class="col_name">' + data.name + '</td>\n\
                <td class="col_tit">' + data.title + '</td>\n\
                <td class="col_alt">' + data.alt + '</td>\n\
                <td class="actions_col">\n\
                    <i class="icon-close table_icon delete_row" title="delete"></i>\n\
                </td>\n\
            </tr>';
                $('#table_image_list tbody').append(apText);
            });
        }
    });
//    $('.tablesorter').trigger('update');
}

function updateImage(updateArray){
    // console.log(updateArray);
    var error = 0;
    var id = updateArray.id;
    var name = $('#update_name').val();
    var title = $('#update_title').val();
    var alt = $('#update_alt').val();
    var oldName = updateArray.name;
    var fileType = updateArray.fileType;
    
    if(name === ''){
        $('#update_name').addClass('error');
        error = 1;
    }
    if (error > 0) {
        return;
    }
    
    data = {data: {
            action: 'updateImage',
            id: id,
            name: name,
            title: title,
            alt: alt,
            oldName: oldName,
            fileType: fileType
        }};
    // console.log(data);
    $.ajax({
        url: MAIN_LINK + '/db/pagesInfo/' + '?' + window.location.search.substring(1),
        method: "POST",
        contentType: "application/json", // send as JSON
        data: JSON.stringify(data),
        success: function (data) {
            var response = jQuery.parseJSON(data);

            if (response.code === '000') {
                var trId = $('#table_image_list tbody tr[data-id="' + id + '"]');
                trId.find('.col_img').text('<img src="' + MAIN_LINK + '/docs/uploads/' + name + fileType + '" width="208"/>');
                trId.find('.col_name').text(name);
                trId.find('.col_tit').text(title);
                trId.find('.col_alt').text(alt);
                var apText = '<label class="update_result">Update</label>';
                $('#update_image_info .popup_box_panel .button_row').append(apText);
            }
        }
    });
}

function delete_image(message, id) {
    $('<div></div>').appendTo('body')
            .html('<div><h6>' + message + '?</h6></div>')
            .dialog({
                modal: true, title: 'Delete message', zIndex: 10000, autoOpen: true,
                width: '200px', resizable: false,
                buttons: {
                    Yes: function () {
                        data = {data: {
                                action: 'deleteImage',
                                id: id
                            }};

                        $.ajax({
                            url: MAIN_LINK + '/db/pagesInfo/' + '?' + window.location.search.substring(1),
                            method: "POST",
                            contentType: "application/json", // send as JSON
                            data: JSON.stringify(data),
                            success: function (data) {
                                var response = jQuery.parseJSON(data);

                                if (response.code === '000') {
                                    $('#table_image_list tbody tr[data-id="' + id + '"]').remove();
                                }
                            }
                        });

                        $(this).dialog("close");
                    },
                    No: function () {
                        $(this).dialog("close");
                    }
                },
                close: function (event, ui) {
                    $(this).remove();
                }
            });
};