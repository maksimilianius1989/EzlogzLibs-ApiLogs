function callCenterController() {
    var self = this;

    self.tableId = 'callCenterTable';
    self.apiURL = '/db/api/apiCallCenterController.php'
    self.callCenterPagination = false;

    self.callCenterInit = function () {
        self.callCenterPagination = new simplePaginator({
            tableId: self.tableId,
            request: 'getAllInternalContactsListPagination',
            requestUrl: self.apiURL,
            handler: self.getAllInternalContactsListPaginationHandler,
            perPageList: [25, 50, 100]
        });
    }

    self.getAllInternalContactsListPaginationHandler = function (response, tableId) {
        c('getAllInternalContactsListPaginationHandler');
        c(response);

        var body = $('#' + tableId).find('tbody')
        body.empty();

        $.each(response.data.result, function (key, row) {
            body.append(self.drawCallCenterInfoTableLine(row));
        });
    }

    self.drawCallCenterInfoTableLine = function (value) {
        var phoneNumbers = '';
        if (typeof value.phoneNumbers != 'undefined') {
            $.each(value.phoneNumbers, function (key, phoneNumber) {
                phoneNumbers += '<p>(' + phoneNumber.type + ') ' + phoneNumber.phoneNumber + '</p>'
            });
        }
        return '<tr data-id="' + value.id + '" onclick="callCenterC.getCallLogById(' + value.id + ')">\n\
                    <td>' + value.id + '</td>\n\
                    <td>' + value.extensionNumber + '</td>\n\
                    <td>' + value.firstName + '</td>\n\
                    <td>' + value.lastName + '</td>\n\
                    <td>' + value.email + '</td>\n\
                    <td>' + phoneNumbers + '</td>\n\
                    <td>' + (typeof value.jobTitle != 'undefined' ? value.jobTitle : '') + '</td>\n\
                    <td>' + (typeof value.department != 'undefined' ? value.department : '') + '</td>\n\
                    <td>' + value.status + '</td>\n\
                </tr>';
    }

    self.getCallLogById = function (id) {
        var body = '<div id="pg_pagin" data-table="callLogTable" class="pg_pagin empty_header">\n\
                <div class="simplePaginator ">\n\
                    <div class="displayResultBox">\n\
                        <div class="pagin_total">0</div>\n\
                        <div class="pagin_results">result(s)</div>\n\
                    </div>\n\
                    <div class="pagin_displayBox">\n\
                        <div class="pagin_displayText">Display</div>\n\
                        <select class="pagin_per_page">\n\
                            <option value="10">10</option>\n\
                            <option value="25">25</option>\n\
                            <option value="50">50</option>\n\
                        </select>\n\
                    </div>\n\
                    <div class="pagin_buttons">\n\
                        <div class="pagin_leftButtonsBox">\n\
                            <button class="pagin_button pagin_left_end" disabled>\n\
                                <i class="fa fa-angle-double-left" aria-hidden="true"></i>\n\
                            </button>\n\
                            <button class="pagin_button pagin_left" disabled>\n\
                                <i class="fa fa-angle-left" aria-hidden="true"></i>\n\
                            </button>\n\
                        </div>\n\
                        <div class="pagin_numbers">\n\
                            <div class="pagin_cur_page">1</div>\n\
                            <div>-</div>\n\
                            <div class="pagin_total_pages">1</div>\n\
                            <div class="pagin_total_pagesText"> pages</div>\n\
                        </div>\n\
                        <div class="pagin_rightButtonsBox">\n\
                            <button class="pagin_button pagin_right">\n\
                                <i class="fa fa-angle-right" aria-hidden="true"></i>\n\
                            </button>\n\
                            <button class="pagin_button pagin_right_end">\n\
                                <i class="fa fa-angle-double-right" aria-hidden="true"></i>\n\
                            </button>\n\
                        </div>\n\
                    </div>\n\
                </div>\n\
                </div>\n\
                <div class="table_wrap" style="max-height: 500px;">\n\
                <table id="callLogTable" data-extensionNumber="' + id + '" class="table table-striped table-dashboard table-hover table-sm clickable"><thead>\n\
                    <tr>\n\
                        <th>Action</th>\n\
                        <th>Record</th>\n\
                        <th>Start Time</th>\n\
                        <th>From</th>\n\
                        <th>To</th>\n\
                        <th>Duration</th>\n\
                        <th>Result</th>\n\
                        <th>Reason</th>\n\
                        <th>Type</th>\n\
                    </tr>\n\
	</thead><tbody></tbody><table></div>';
        showModal('Call Logs', body, '', '" style="width:80%;"');

        self.callCenterPagination = new simplePaginator({
            tableId: 'callLogTable',
            request: 'getCallLogById',
            requestUrl: self.apiURL,
            handler: self.getCallLogByIdHandle,
            perPageList: [25, 50, 100],
            additionalData: {
                id: id
            }
        });
    }

    self.getCallLogByIdHandle = function (response, tableId) {
        c(response);
        var body = $('#' + tableId).find('tbody')
        body.empty();
        $.each(response.data.result, function (key, log) {
            var tr = '';
            var audio = '';
            if (log.hasOwnProperty('recording')) {
                if (typeof log.recording.recordProjectLink != 'undefined') {
                    audio = '<audio controls>\n\
                                <source src="' + log.recording.recordProjectLink + '">\n\
                                Your browser does not support the audio element.\n\
                            </audio>';
                } else {
                    audio = '<span class="btn btn-default" onclick="callCenterC.uploadRecord(this, ' + log.recording.id + ');">Download audio</span>'
                }
            }
            tr = '<tr>\n\
			<td>' + log.action + '</td>\n\
                        <td>' + audio + '</td>\n\
			<td>' + log.startTime + '</td>\n\
			<td>' + log.from.phoneNumber + '</td>\n\
			<td>' + log.to.phoneNumber + '</td>\n\
                        <td>' + log.duration + '</td>\n\
                        <td>' + log.result + '</td>\n\
                        <td>' + (typeof log.reason != 'undefined' ? '<p><b>' + log.reason + '</b></p><p>' + log.reasonDescription + '</p>' : 'no info') + '</td>\n\
                        <td>' + log.type + '</td>\n\
                    </tr>';
            body.append(tr);
        });
    }

    self.uploadRecord = function (el, recordId) {
        var data = {};

        data.extensionNumber = $('#callLogTable').attr('data-extensionNumber');
        data.recordId = recordId;

        $(el).empty().append('<img class="loading_gif_table" src="/dash/assets/img/loading-gif.gif" style="width: 25px;"/>');

        AjaxCall({action: 'uploadRecord', url: self.apiURL, data: data, successHandler: function (response) {
                if (response.data.result != '') {
                    $(el).replaceWith('<audio controls>\n\
                                <source src="' + response.data.result + '">\n\
                                Your browser does not support the audio element.\n\
                            </audio>');
                } else {
                    $(el).replaceWith('<span class="btn btn-default" onclick="callCenterC.uploadRecord(this, ' + recordId + ');">Download audio</span>');
                }
            }, errorHandler: function () {}})
    }
}
callCenterC = new callCenterController();