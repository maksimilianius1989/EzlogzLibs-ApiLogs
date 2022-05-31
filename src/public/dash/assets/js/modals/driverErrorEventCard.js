function driverErrorEventCard(id, params = {}) {
    var self = this;
    //changable part
    self.cntrlUrl = apiAdminUrl;
    self.eventId = id;
    self.tableId = 'driverErrorEventCard_' + self.eventId;
    self.modalId = 'driverErrorEvent_modal_card';
    self.modalTitle = 'Driver Error Event Info ';
    self.forceSearchParams = [{key: 'id', val: self.eventId}]
    //some additional init params
    self.returnData = {};

    //not changable part
    self.params = params;
    self.modalElement = '';
    modalCore(self);
    self.paginator = false;
    self.tabs = [];

    self.initRequest = function () {
        AjaxCall({action:'getDriverErrorEventInit', data:{eventId: self.eventId}, url:self.cntrlUrl, successHandler:self.init});
    }
    self.init = function (response) {
        //retrieving init response
        self.eventData = response.data.eventData;
        //always call
        self.generateHeaders();
        self.generateButtons();
        self.createModal();

        //additional clicks
        self.modalElement.find('.handleEventButton').click(self.handleEventButtonClick)
    }
    self.generateHeaders = function () {
        var headers = [];

        headers.push({label: 'Id', value: self.eventId});
        headers.push({label: 'User', value: `<span class="global_carrier_info clickable_item" title="User Info" data-userid="${self.eventData.userId}" onclick="getOneUserInfo(this, event);" >${self.eventData.userName}(${self.eventData.userId})</span>`});

        headers.push({label: 'Local Time', value: moment.utc(self.eventData.dateTimeUTC, 'YYYY-MM-DD hh:mm:ss').local().format('MM-DD-YYYY hh:mm:ss A')});
        headers.push({label: 'Description', value: self.eventData.eventDescription});
        headers.push({label: 'Status', value: getDriverErrorEventStatusText(self.eventData.status)});

        self.setCardHeaders(headers)
    }
    self.generateButtons = function () {
        var buttons = [];
        if(position == TYPE_SUPERADMIN || superAdminRights.driverErrorEvents == 1){
            buttons.push('<button class="btn btn-default handleEventButton">Handle Event</button>');
            self.setCardActionsButtons(buttons);
        }
        self.tabs.push({
            label: 'Event History',
            cl: 'ev_dev_his',
            request: 'getDriverErrorEventsHistoryPagination',
            handler: 'getDriverErrorEventsHistoryPaginationHandler',
            initSort: {param:'id', dir:'desc'},
            tableHeader: `<tr>
                <th>Id</th>
                <th>Local Time</th>
                <th>User</th>
                <th>Note</th>
                <th>Status</th>
            </tr>`
        });
        self.setCardTabs(self.tabs);
    }

    self.getDriverErrorEventsHistoryPaginationHandler = function (response) {
        var tbody = '';
        response.data.result.forEach((item) => {
            tbody += '<tr>\n\
                <td>' + item.id + '</td>\n\
                <td>' + moment.utc(item.dateTime, 'YYYY-MM-DD hh:mm:ss').local().format('MM-DD-YYYY hh:mm:ss A') + '</td>\n\
                <td>' + item.userName + '</td>\n\
                <td>' + item.note + '</td>\n\
                <td>' + getDriverErrorEventStatusText(item.status) + '</td>\n\
            </tr>';
        });
        self.modalElement.find('#' + self.tableId).find('tbody').html(tbody);
    }
    self.handleEventButtonClick = function () {
        var body = `
            <div class="form-group">
                <label for="transfer_project">Status</label>
                <select class="form-control" id="event_status" >
                    <option value="0">New</option>
                    <option value="3">Call not answered</option>
                    <option value="1">Pending Fix</option>
                    <option value="2">Fixed</option>
                </select>
            </div>
            <div class="form-group">
                <label for="transfer_project">Note</label>
                <textarea class="form-control" id="event_note"></textarea>
            </div>
        `;
        var footerButtons = '<button type="button" class="btn btn-default getModalCardObjectBtn" onclick="getModalCardObject(\'driverErrorEventCard\', '+self.eventId+').handleEventConfirm()">Confirm</button>';
        showModal('Handle Event Info', body, 'driverEventHandleModal', '', {footerButtons: footerButtons});
        
    }
    self.handleEventConfirm = function(){
        $('.getModalCardObjectBtn').prop('disabled', true);
        AjaxCall({action:'handleDriverErrorEvent', data:{eventId: self.eventId, status:$('#event_status').val(), note:$('#event_note').val()}, url:self.cntrlUrl, successHandler:self.handleDriverErrorEventHandler});
    }
    self.handleDriverErrorEventHandler = function(response){
        $('.getModalCardObjectBtn').prop('disabled', false);
        $('#driverEventHandleModal .close').click();
        new driverErrorEventCard(self.eventId)
        $('.pg_pagin[data-table="driverErrorEventsTable"] .pagin_per_page').change()
    }
    self.initRequest();
}