function managerEldTariffRequestCard(id, params = {}) {
    if(!curUserIsEzlogzEmployee()) {
        return '';
    }
    var self = this;
    //changable part
    self.cntrlUrl = apiDashUrl;
    self.id = id;
    self.tableId = 'tariffRequestManagerCard_' + self.id;
    self.modalId = 'tariff_request_manager_modal_card';
    self.modalTitle = 'ELD Tariff Request Info #' + self.id;
    self.forceSearchParams = [{key: 'id', val: self.id}];
    //some additional init params
    self.data = {};
    self.colorRefundStatuses = {
        0:'label-default',
        1:'label-info',
        2:'label-warning',
        3:'label-danger',
        4:'label-success',
    };

    //not changable part
    self.params = params;
    self.modalElement = '';
    modalCore(self);
    self.paginator = false;
    self.tabs = [];

    self.initRequest = function () {
        AjaxController('getEldTariffRequestCardInit', {id: self.id}, self.cntrlUrl, self.init, self.init, true);
    };
    self.init = function (response) {
        //retrieving init response
        self.data = response.data.eldTariffRequest;

        //always call
        self.generateHeaders();
        self.generateButtons();
        self.createModal();

        //additional clicks
        self.modalElement.find('.someButton').click(self.someButtonClick)
    };
    self.generateHeaders = function () {
        c(self.data);
        var headers = [];
        headers.push({label: 'Date Time', value: timeFromSQLDateTimeStringToUSAString(self.data.dateTime)});
        var isComment = self.data.supportComment !== null ? '- Updated by Support' : '';
        headers.push({label: 'Status', value: `<span class="label ${self.colorRefundStatuses[self.data.status]}">${refund.refundStatuses[self.data.status]}</span> ${isComment}`});
        self.setCardHeaders(headers);
    };
    self.generateButtons = function () {
        var buttons = [];
        if(self.data.status === 0) {
            buttons.push(`<button type="button" class="btn btn-default btn-lock-double-clicks" onclick="eldAdminTariffRequests.btnApprove(${self.id})">Approve</button>`);
            buttons.push(`<button type="button" class="btn btn-default btn-lock-double-clicks" onclick="eldAdminTariffRequests.btnReject(${self.id})">Reject</button>`);
        }
        if($.inArray(self.data.status, [0, 1, 2, 3, 4]) > -1){
            buttons.push(`<button class="btn btn-default" onclick="eldAdminTariffRequests.supportComment(${self.id})">Support Comment</button>`);
        }
        self.setCardActionsButtons(buttons);

        self.tabs.push({
            label: 'Refund History',
            cl: 'cl_refund_history',
            request: 'getEldTariffRequestHistoryPagination',
            handler: 'getEldTariffRequestHistoryPaginationHandler',
            tableHeader: `<tr>
                <th>Date Time</th>
                <th>User</th>
                <th>Status</th>
            </tr>`
        });
        self.tabs.push({
            label: 'Support Comments',
            cl: 'refund_comment_his',
            request: 'getEldTariffRequestHistorySupportCommentsPagination',
            handler: 'getEldTariffRequestHistorySupportCommentsPaginationHandler',
            tableHeader: `<tr>
                <th>Date Time</th>
                <th>Request History ID</th>
                <th>User</th>
                <th>Status</th>
                <th>Comment</th>
            </tr>`
        });
        self.setCardTabs(self.tabs);
    };
    self.getEldTariffRequestHistoryPaginationHandler = function (response) {
        var tbody = '';
        response.data.result.forEach((item) => {
            var isComment = item.supportComment !== null ? '- Updated by Support' : '';
            tbody += `<tr> 
                <td>${timeFromSQLDateTimeStringToUSAString(item.dateTime)}</td>
                <td>${item.userName}</td>
                <td><span class="label ${self.colorRefundStatuses[item.historyStatus]}">${refund.refundStatuses[item.historyStatus]}</span> ${isComment}</td>
            </tr>`;
        });
        self.modalElement.find('#' + self.tableId).removeClass('table-actions-block').find('tbody').html(tbody);
    };
    self.getEldTariffRequestHistorySupportCommentsPaginationHandler = function (response) {
        var tbody = '';
        response.data.result.forEach((item) => {
            var isComment = item.supportComment !== null ? '- Updated by Support' : '';
            tbody += `<tr>
                <td>${timeFromSQLDateTimeStringToUSAString(item.dateTimeComment)}</td>
                <td>${item.id}</td>
                <td>${item.name+ ' ' +item.last + item.userEmail}</td>
                <td><span class="label ${self.colorRefundStatuses[item.status]}">${refund.refundStatuses[item.status]}</span> ${isComment}</td>
                <td>${item.supportComment !== null ? item.supportComment.replace(/\r\n|\n|\r/g, '<br />') : ''}</td>
            </tr>`;
        });
        self.modalElement.find('#' + self.tableId).find('tbody').html(tbody);
    };

    self.initRequest();
}


function actionGetOneManagerEldTariffRequestsInfo(el) {
    var id = 'null';
    if ($.isNumeric(el)) {
        id = el;
    } else {
        id = $(el).attr('data-id');
    }
    new managerEldTariffRequestCard(id);
}




