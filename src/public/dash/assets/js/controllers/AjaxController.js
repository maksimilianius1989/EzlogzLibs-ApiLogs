var curVersion = 0;
var requestsPull = {};
function showUpdatePopup() {
    if ($('#updatePopup').length > 0) {
        return true;
    }
    $('body').append('<div id="updatePopup"><p>Please refresh your page, <br/>'+COMPANY_NAME+' updated some logic</p></div>')
    $('#updatePopup').animate({'bottom': '4px'}, 500);
}
function AjaxCall(params = {}) {
    var action = params.action;//mandatory
    var requestData = typeof params.data != 'undefined' ? params.data : {};//optional
    var url = params.url;//madatory
    var successHandler = typeof params.successHandler != 'undefined' ? params.successHandler : errorBasicHandler;//optional 
    var errorHandler = typeof params.errorHandler != 'undefined' ? params.errorHandler : errorBasicHandler;//optional
    var defaultErrorsHandling = typeof params.defaultErrorsHandling != 'undefined' ? params.defaultErrorsHandling : false;//optional, true for defaule element(#basicError), jquery element for basic error container
    requestData.action = action;
    var dataTotal = {data: requestData};
    if(typeof params.uniqueRequest != 'undefined'){
        if(typeof requestsPull[action] != 'undefined' && requestsPull[action]){
            requestsPull[action].abort();
        }
    }
    var request = $.ajax({
        url: url + '?' + window.location.search.substring(1),
        method: "POST",
        contentType: "application/json", // send as JSON
        data: JSON.stringify(dataTotal),
        success: function (data) {
            var response = jQuery.parseJSON(data);
            if (response.code == '000') {
                if (typeof response.data != 'undefined' && response.data != null && typeof response.data.version != 'undefined') {
                    if (curVersion == 0)
                        curVersion = response.data.version;
                    else if (curVersion != response.data.version)
                        showUpdatePopup()
                }
                if (typeof successHandler === 'string') {
                    window[successHandler](response, action, requestData);
                } else if (typeof successHandler === 'function') {
                    successHandler(response, action, requestData);
                }
            } else if (response.code == 205) {
                eraseCookies();
                window.location.href = "/";
            } else {
                if (defaultErrorsHandling != false) {
                    if (typeof defaultErrorsHandling == 'object') {
                        $.each(defaultErrorsHandling, function (key, errorHandler) {
                            if (typeof errorHandler.error == 'undefined' || errorHandler.error == response.code) {
                                var time = typeof errorHandler.time != 'undefined' ? errorHandler.time : 3000;
                                if (errorHandler.type == 1)
                                    setError($(errorHandler.el), response.message);
                                else
                                    alertError($('#basicError'), response.message, time);
                            }
                        })
                    }
                } else {
                    if (typeof errorHandler === 'string') {
                        window[errorHandler](response, action, requestData);
                    } else if (typeof errorHandler === 'function') {
                        errorHandler(response, action, requestData);
                    }
                }
            }
        }
    })
    if(typeof params.uniqueRequest != 'undefined'){
        requestsPull[action] = request;
    }
    return request;
}
function AjaxController(action, data, url, successHandler, errorHandler, clearAction, periodUpload = null, jsData = '') {
    if (clearAction) {
        data.action = action;
    } else {
        data.action = 'get' + action;
    }
    var dataTotal = {data: data};
    return $.ajax({
        url: url + '?' + window.location.search.substring(1),
        method: "POST",
        contentType: "application/json", // send as JSON
        data: JSON.stringify(dataTotal),
        xhr: function () {
            var xhr = $.ajaxSettings.xhr();
            xhr.upload.onprogress = function (evt)
            {
                var persent = Math.round((evt.loaded / evt.total) * 100);
                if (periodUpload != null) {
                    // window[periodUpload](persent);
                    // if($(periodUpload).length) {
                    $(periodUpload).css('width', persent + '%');
                    // }
                }
            };
            return xhr;
        },
        success: function (data) {
            var response = jQuery.parseJSON(data);
            response.jsData = jsData;
            if (response.code == '000') {
                if (typeof response.data != 'undefined' && response.data != null && typeof response.data.version != 'undefined') {
                    if (curVersion == 0)
                        curVersion = response.data.version;
                    else if (curVersion != response.data.version) {
                        showUpdatePopup()
                    }
                }
                if (typeof successHandler === 'string'){
                    window[successHandler](response, action, dataTotal.data);
                } else if (typeof successHandler === 'function'){
                    successHandler(response, action, dataTotal.data);
                }
            } else if (response.code == 205) {
                eraseCookies();
                window.location.href = "/";
            } else {
                errorHandler(response);
            }
        }
    })
}
function errorBasicHandler(responce) {
    c(responce.message);
}
function basicHandler(response, action) {
    var table = $('table[data-name="' + action + '"]');
    var tbody = table.find('tbody');
    if (table.length < 1) {
        return false;
    }
    var theads = table.find('thead tr').first().find('th');
    var values = [];
    var indexes = table.find('thead tr').first().attr('data-i');
    if (indexes != undefined && indexes != null) {
        indexes = indexes.split(", ");
    } else {
        indexes = [];
    }

    var actions = '';
    theads.each(function () {
        var name = $(this).attr('data-n');
        if (name != undefined && name != null) {
            values.push(name);
        }

        if ($(this).hasClass('actions')) {

            values.push('f_actions');
            actions = $(this).find('i').prop('outerHTML');
        }
    })
    tbody.empty();
    var data = response.data.data;
    for (var x = 0; x < data.length; x++) {
        var item = data[x];
        var nItem = '<tr ';
        for (var y = 0; y < indexes.length; y++) {
            var ind = indexes[y];
            nItem += 'data-' + ind + '="' + item[ind] + '" ';
        }
        nItem += '>';
        for (var y = 0; y < values.length; y++) {
            var val = values[y];
            var itemVal = item[val];
            if (itemVal == undefined || itemVal == null) {
                itemVal = '';
            }
            if (val == 'f_actions') {
                itemVal = actions;
            }
            nItem += '<td>' + itemVal + '</td>'
        }
        nItem += '</tr>';
        tbody.append(nItem);
    }
    updatePaginator(response.data.total, table.attr('data-name'));
}