function dashAlertsController() {
    var self = this;
    this.alerts = [];
    this.boxId = 'new_alerts_box';
    this.name = 'dashAlertsC';
    this.totallyNew = 0;
    this.totally = 0;
    this.page = 1;
    this.perPage = 15;

    this.params = {};
    this.cntrlUrl = apiDashUrl;
    this.modalElement = '';
    this.tableId = 'new_alerts_table';
    this.editMode = false;
    this.modalId = 'new_alerts_box';
    this.modalTitle = 'Violations';
    this.paginator = false;
    this.listOpen = false;
    this.afterInit = false;
    this.refreshTotals = function () {
        AjaxController('getFreshAlertsStatus', {page: 0, perPage: self.perPage}, dashUrl, dashAlertsC.refreshTotalsHandler, errorBasicHandler, true);
    }
    this.refreshTotalsHandler = function (response) {
        var diff = response.data.totally - self.totally;
        self.totally = self.totallyNew = response.data.totally;
        $('#nav_alerts .messages_number.alrt').text(self.totally);
        if (self.listOpen == true) {
            self.paginator.changePagination();
        }
        if (self.totallyNew > 0) {
            $('#nav_alerts #dashHeaderNotificationIcon').removeClass('notify')
            $('#nav_alerts #dashHeaderNotificationIcon').width()
            $('#nav_alerts #dashHeaderNotificationIcon').addClass('notify')
        }
        if((getCookie('newNotificaitonsBox') == 1 || getCookie('newNotificaitonsBox') == '') && self.afterInit && diff > 0 && $('#nav_alert_box').length == 0){
            var msg = response.data.lastAlert.note.trimToLength(25);
            var style = '';
            if ($('#nav_msg_box').length > 0 && $('#nav_notif_box').length > 0) {
                $('#nav_notif_box').removeClass().addClass('nav_alert_box');
                $('#nav_msg_box').removeClass().addClass('nav_alert_box');
            } else if ($('#nav_notif_box').length > 0) {
                $('#nav_notif_box').removeClass().addClass('nav_alert_box alert_position_left');
                style = 'alert_position_right';
            } else if ($('#nav_msg_box').length > 0) {
                $('#nav_msg_box').removeClass().addClass('nav_alert_box alert_position_right');
                style = 'alert_position_left';
        }
            $('#nav_alerts').append('<div id="nav_alert_box" class="nav_alert_box ' + style + '">'+msg+'</div>');
        }
        if(self.afterInit == false){
            self.afterInit = true;
        }
    }
    this.closeList = function () {
        $('#' + self.boxId).find('.close').click();
        self.listOpen = false;
    }
    this.init = function () {
        self.listOpen = true;
        modalCore(self);
        self.generateTabs();
        self.generateButtons();
        self.createModal();
        self.modalElement.find('#' + self.tableId).addClass('table-actions-block');
        $('#nav_alert_box').remove();
    }
    this.generateTabs = function () {
        self.tabs.push({
            label: self.modalTitle,
            cl: 'alerts_table',
            request: 'getNewAlertsPagination',
            handler: 'displayAlertsPagination',
            tableHeader: `<tr>
                <th>Date</th>
				<th>Driver</th>
				<th>Alert Status</th>
				<th>Note</th>
				<th>Actions</th>
            </tr>`
        });
        self.setCardTabs(self.tabs);
    }
    this.generateButtons = function () {
        var buttons = [];
        buttons.push('<button class="btn btn-default clear_all als" style="float:right;" onclick="dashAlertsC.clearAll()">Clear All</button>');
        self.setCardActionsButtons(buttons);
    }
    this.clearAll = function () {
        AjaxController('readAllAlerts', {}, dashUrl, dashAlertsC.readAllAlertsHandler, 'errorBasicHandler', true);
    }
    this.readAllAlertsHandler = function (response) {
        self.alerts = [];
        self.totallyNew = 0;
        self.totally = 0;
        $('#nav_alerts .messages_number').text(0);
        self.paginator.changePagination();
    }
    this.displayAlertsPagination = function (response) {
        var tbody = '';
        self.totally = self.totallyNew = response.data.total;
        $.each(response.data.result, function (key, alrt) {
            var listOfButtons = [];
            listOfButtons.push('<button class="alert_contact" data-user="' + alrt.userId + '" onclick="dashAlertsC.contactDriver(this)">Message</button>');
            listOfButtons.push('<button onclick="dashAlertsC.readAlert(' + alrt.id + ')">Delete</button>')
            tbody += '<tr>' +
                    '<td>' + alrt.dateTime + '</td>' +
                    '<td>' + alrt.userName + '</td>' +
                    '<td>' + alrt.alertName + '</td>' +
                    '<td>' + alrt.note + '</td>' +
                    '<td>' + addTableActionRow(listOfButtons) + '</td>' +
                    '</tr>';
        });
        self.modalElement.find('#' + self.tableId).find('tbody').html(tbody);
    }
    this.readAlert = function (alertId) {
        AjaxController('readAlert', {alertId: alertId}, dashUrl, dashAlertsC.readAlertHandler, errorBasicHandler, true);
    }
    this.readAlertHandler = function (response) {
        self.paginator.changePagination();
    }
    this.contactDriver = function (el) {
        $('#message_form #msg_user').val($(el).attr('data-user'));
        $('#message_form #msg_msg').val($(el).attr('data-id'));
        window.location.pathname == "/dash/message/" ? $('#messages_box .one_box[data-id="' + $(el).attr('data-user') + '"]').click() : dc.getUrlContent('/dash/message/', {userId: $(el).attr('data-user')});
        self.closeList();
    };
}