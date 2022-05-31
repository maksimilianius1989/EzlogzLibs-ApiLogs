function dashNotificationsController() {
    var self = this;
    this.notifications = [];
    this.boxId = 'notifications_info_box';
    this.name = 'dashNotifC';
    this.totallyNew = 0;
    this.totally = 0;
    this.initialised = false;
    this.listOpen = false;
    this.page = 1;
    this.perPage = 15;
    this.pages = 1;

    self.params = {};
    self.cntrlUrl = apiDashUrl;
    self.modalElement = '';
    self.tableId = 'new_notifications_table';
    self.editMode = false;
    self.modalId = 'notifications_info_box';
    self.modalTitle = 'NOTIFICATIONS';
    self.paginator = false;
    self.newNotif = false;

    this.init = function () {
        AjaxController('getNotifications', {page: self.page, perPage: self.perPage}, dashUrl, dashNotifC.initHandler, errorBasicHandler, true);
    }
    this.initHandler = function (response) {
        self.initialised = true;
        if((getCookie('newNotificaitonsBox') == 1 || getCookie('newNotificaitonsBox') == '') && self.newNotif && $('#nav_notif_box').length == 0 && response.data.notifications.length > 0){
            var msg = response.data.notifications[0].message.trimToLength(25);
            var style = '';
            if ($('#nav_msg_box').length > 0 && $('#nav_alert_box').length > 0) {
                $('#nav_alert_box').removeClass().addClass('nav_alert_box');
                $('#nav_msg_box').removeClass().addClass('nav_alert_box');
            } else if ($('#nav_alert_box').length > 0) {
                $('#nav_alert_box').removeClass().addClass('nav_alert_box alert_position_right');
                style = 'alert_position_left';
            } else if ($('#nav_msg_box').length > 0) {
                $('#nav_msg_box').removeClass().addClass('nav_alert_box alert_position_right');
                style = 'alert_position_left';
            }
            $('#dashNotifications').append('<div id="nav_notif_box" class="nav_alert_box ' + style + '">'+msg+'</div>');
        }
        if(window.location.pathname == '/dash/driverErrorEvents/' && response.data.notifications[0].type == 10){
            $('.pg_pagin[data-table="driverErrorEventsTable"] .pagin_per_page').change()
        }
        if (response.data.notifications == 0 && self.page != 1) {
            self.page--;
            self.init();
            return false;
        }
        $.each(response.data.notifications, function (key, notification) {
            $.each(notification.data, function (key2, notif) {
                notification.data[notif.notif_key] = notif.notif_value;
            });
        });
        self.notifications = response.data.notifications;
        self.totallyNew = response.data.totallyNew;
        self.totally = response.data.totally;
        self.updateNotificationsView(true);
        if (self.modalElement != '' && dashNotifC.modalElement.is(':visible') && self.modalElement.find('.pagin_cur_page').text() == 1)
            self.showNotificationsListIfOpen()
    }
    this.generateTabs = function () {
        self.tabs.push({
            label: self.modalTitle,
            cl: 'notifications_table',
            request: 'getNotificationsPagination',
            handler: 'displayNotifications',
            tableHeader: `<tr>
                <th style="width:20%;">Date</th>
                <th>Message</th>
                <th style="width:6%;">Actions</th>
            </tr>`
        });
        self.setCardTabs(self.tabs);
    }
    this.generateButtons = function () {
        var buttons = [];
        buttons.push('<button class="btn btn-default clear_all als" style="float:right;" onclick="dashNotifC.clearAll()">Clear All</button>');
        self.setCardActionsButtons(buttons);
    }
    this.clearAll = function () {
        c('clearAll Notifications');
        AjaxController('deleteAllUserNotification', {}, dashUrl, dashNotifC.deleteAllUserNotificationHandler, errorBasicHandler, true);
    }
    this.deleteAllUserNotificationHandler = function (response) {
        self.notifications = [];
        self.totally = 0;
        self.totallyNew = 0;
        var rows = '<tr><td colspan="3">No new notifications</td></tr>';
        $('#' + self.boxId + ' tbody').html(rows);
        $('#dashNotifications .messages_number').text(0);
        self.paginator.changePagination();
    }
    this.displayNotifications = function (response) {
        c('displayNotifications');
        self.listOpen = true;
        $('#' + self.boxId + ' tbody').empty();
        if (self.totallyNew != 0) {
            AjaxController('readAllUserNotifications', {}, dashUrl, function () {}, errorBasicHandler, true);
        }
        self.totallyNew = 0;
        self.updateNotificationsView();
        $.each(response.data.result, function (key, notification) {
            $.each(notification.data, function (key2, notif) {
                notification.data[notif.notif_key] = notif.notif_value;
            });
        });
        self.notifications = response.data.result;
        self.totally = response.data.total;
        var rows = '';
        if (self.notifications.length == 0) {
            rows = '<tr><td colspan="3">No new notifications</td></tr>';
        }
        $.each(self.notifications, function (key, notification) {
            rows += self.addGetNotificationRow(notification);
        });
        $('#' + self.boxId + ' tbody').append(rows);
    }
    this.updateNotificationsView = function (init = false) {
        $('#dashNotifications span').text(self.totallyNew);
        if (self.totallyNew > 0) {
            $('#dashNotifications #dashHeaderNotificationIcon').removeClass('notify')
            $('#dashNotifications #dashHeaderNotificationIcon').width()
            $('#dashNotifications #dashHeaderNotificationIcon').addClass('notify')
            if (self.newNotif && (getCookie('soundNotificaiton') == 1 || getCookie('soundNotificaiton') == '')) {
                self.newNotif = false;
                $.playSound('/dash/assets/audio/notification.mp3');
            }
    }
    };
    this.closeList = function () {
        $('#' + self.boxId).find('.close').click();
        $('#' + self.boxId).remove()
        self.listOpen = false;
    }
    this.deleteNotification = function (notificationId) {
        AjaxController('deleteUserNotification', {notificationId: notificationId}, dashUrl, dashNotifC.deleteNotificationHandler, errorBasicHandler, true);
    }
    this.deleteNotificationHandler = function (response) {
        self.updateNotificationsList();
    }
    this.newNotification = function (notificationId) {
        self.newNotif = true;
        self.init()
    }
    this.addGetNotificationRow = function (notification) {
        var listOfButtons = [];
        if (notification.type == 1 && typeof notification.data.taskId != 'undefined') {//task notification
            listOfButtons.push('<button onclick="dashNotifC.closeList();$(\'#histoty_box tr[data-id=' + notification.data.taskId + ']\').click();">Open Task</button>')
        } else if ((notification.type == 2 || notification.type == 3) && typeof notification.data.eventId != 'undefined') { //calendar notification: 2-add,edit,comment; 3-event started
            listOfButtons.push('<button onclick="dashNotifC.closeList(); notificationEvent = ' + notification.data.eventId + '; $(\'li.nav_calendar a\').click();">Open Calendar</button>')
        } else if ((notification.type == 4) && typeof notification.data.userId != 'undefined') {
            listOfButtons.push('<button onclick="dashNotifC.closeList();dc.getUrlContent($(this).attr(\'href\'));"  href="/dash/fleet/fleetUsers/">Fleet Users</button>')
        } else if ((notification.type == 10) && typeof notification.data.eventId != 'undefined') {
            listOfButtons.push('<button onclick="new driverErrorEventCard('+notification.data.eventId+')">Event Card</button>')
        }

        // RS EW-685: Highlight notification from smart safety
        notification.message = notification.message.replace(
            'Smart Safety',
            '<span class="smart_safety_notification">Smart Safety</span>'
        );

        // RS EW-685: Driver id is a link
        notification.message = notification.message.replace(
            /driver id "(\d+)"/gi,
            '<a href="#" onClick="new managerUserCard($1);return false;">' +
            'driver Id "$1"' +
            '</a>'
        );

        listOfButtons.push('<button onclick="dashNotifC.deleteNotification(' + notification.id + ')">Delete</button>')
        var title = notification.title == '' ? '' : '<p><b>'+notification.title+'</b></p>';
        var row = '<tr data-id="' + notification.id + '">';
        notification.message = notification.message.replace(/(?:\r\n|\r|\n)/g, '<br>');
        row += '<td>' + timeFromSecToUSAString(notification.dateTime) + '</td>';
        row += '<td>' + title+notification.message + '</td>';
        row += '<td>' + addTableActionRow(listOfButtons) + '</td>';
        row += '</tr>';
        return row;
    }
    this.showNotificationsListIfOpen = function () {
        if (self.listOpen) {
            self.showNotificationsList();
        }
    }
    this.updateNotificationsList = function () {
        self.paginator.changePagination();
    }
    this.showNotificationsList = function () {
        $('#nav_notif_box').remove();
        modalCore(self);
        self.generateTabs();
        self.generateButtons();
        self.createModal();
        self.modalElement.find('#' + self.tableId).addClass('table-actions-block');
        if ($('#nav_msg_box').length > 0 && $('#nav_alert_box').length > 0) {
            $('#nav_msg_box').removeClass().addClass('nav_alert_box alert_position_right');
            $('#nav_alert_box').removeClass().addClass('nav_alert_box alert_position_left');
        } else {
            $('#nav_alert_box,#nav_msg_box').removeClass().addClass('nav_alert_box');
        }
    };
}