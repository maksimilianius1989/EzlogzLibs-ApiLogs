function WebPushController()
{
    var self = this;
    self.sendLiveLocationHandler = function (response) {
        liveUpdateC.driverLiveLocation(response.data);
    }
    self.adminVerificationHandler = function (response) {
        if($('#adminVerificationModal').length > 0){return 1};
        var body = `<div class="form-horizontal ">
            <input type="hidden" value="${response.data.fromId}" id="veriftyFromId" />
            <div class="form-group ">
                <div class="col-sm-12">
                    <p>Support manager requests to verify that its you currently on the call, please click "Approve" if it is, or click "Reject" if its not you who is currently on the call with support manager.</p>
                </div>
            </div>
        </div>`
        showModal('Support Verification', body, 'adminVerificationModal', '', 
            {footerButtons: `<button class="btn btn-primary" id="adminVerificationApproveButton">Approve</button>
                <button class="btn btn-default" id="adminVerificationRejectButton" data-val="0">Reject</button>`});
        $('#adminVerificationApproveButton').click(self.adminVerificationApproveClicked)
        $('#adminVerificationRejectButton').click(self.adminVerificationRejectClicked)
    }
    self.adminVerificationResponseHandler = function (response) {
        if(response.data.approved == 0){
            alertError($('#adminVerificationModal .response'), "Rejected");
        }else{
            alertMessage($('#adminVerificationModal .response'), "Approved");
        }
        $('#adminVerificationButton').attr('disabled', true)
    }
    self.adminVerificationApproveClicked = function(){
        self.adminVerificationResponse(1);
    }
    self.adminVerificationRejectClicked = function(){
        self.adminVerificationResponse(0);
    }
    self.adminVerificationResponse = function(approved){
        var fromId = $('#veriftyFromId').val();
        var data = {
            action:'adminVerificationResponse', 
            data: {
                fromId: curUserId,
                userId: fromId,
                approved:approved
            }
        };
        send(data);
        $('#adminVerificationModal .close').click()
    }
    self.sendDriverEventHandler = function (response) {
        liveUpdateC.sendDriverEvent(response.data);
    }
    self.newELDEventsHandler = function (response) {
        newEventsC.checkNewELDEvents();
    }
    self.requestScreenViewHandler = function(response){
        var data = jQuery.parseJSON(response.data);
        var modalObj = getModalCardObject('managerUserCard', data.userId);
        if(modalObj){
            modalObj.requestScreenViewHandler(data.requestAccepted);
        }
    }
    self.sendDriverLocationHandler = function (response) {
        var userId = parseInt(response.data.userId);
        var truckId = parseInt(response.data.truckId);
        var lat = parseFloat(response.data.lat);
        var lng = parseFloat(response.data.lng);
        if (isNaN(lat) || isNaN(lng) || isNaN(userId) || isNaN(truckId) || //check if all vars are correct nubmers
                lat == 0 || lng == 0 || lat == -1 || lng == -1 || //check if coordinates are correct
                userId == 0 || truckId == 0) {
            return false;
        }
        var data = {userId: userId, truckId: truckId, lat: lat, lng: lng};
        c(data);
        logbook.updateMarkerLocation(data)
        updateMarkerLocation(data);
    }

    self.addNewClientTicketsInTableHandler = function (response) {
        newEventsC.addNewClientTicketsInTable(response);
    }

    self.removeNewClientTicketsInTableHandler = function (response) {
        newEventsC.removeNewClientTicketsInTable(response);
    }

    self.newClientTicketsHandler = function (response) {
        newEventsC.checkNewClientTickets();
    }
    //wp
    self.getUsersOnlineStatusHandler = function (response) {
        globalUsersOnline = {};
        for (var i = 0; i < count(response.data); i++) {
            globalUsersOnline[response.data[i].userId] = response.data[i];
        }
        viewUsersOnOff();
    }
    //wp
    self.userGoingOnlineHandler = function (response) {
        if (globalUsersOnline.hasOwnProperty(response.data.userId)) {
            globalUsersOnline[response.data.userId].online = 1;
        } else {
            globalUsersOnline[response.data.userId] = {};
            globalUsersOnline[response.data.userId].userId = response.data.userId;
            globalUsersOnline[response.data.userId].online = 1;
        }
        viewOneUserOnOff(response.data.userId, 1);
        if (window.location.pathname == "/dash/drivers/" && logbook.userId == response.data.userId) {
            liveUpdateC.subscribeForLocations(response.data.userId);
        }
    }
    //wp
    self.userGoingOfflineHandler = function (response) {
        if (globalUsersOnline.hasOwnProperty(response.data.userId)) {
            globalUsersOnline[response.data.userId].online = 0;
        } else {
            globalUsersOnline[response.data.userId] = {};
            globalUsersOnline[response.data.userId].userId = response.data.userId;
            globalUsersOnline[response.data.userId].online = 0;
        }
        viewOneUserOnOff(response.data.userId, 0);
    }
    //wp
    self.unBanHandler = function (response) {
        var userId = response.data.userId;
        $('#join_public_chat #bans_list .one_ban[data-id=' + userId + ']').remove();
        if ($('#join_public_chat #bans_list .one_ban').length == 0) {
            $('#bans_list').append(`<div class="one_ban">No users in ban</div>`);
        }
    }
    //wp
    self.getBanListHandler = function (response) {
        var bans = response.data.bans;
        $('#join_public_chat #bans_list').remove();
        $('#join_public_chat').append('<div id="bans_list"></div>')
        $.each(bans, function () {
            $('#bans_list').append(`<div data-id="${this.id}" class="one_ban">${this.login} <button onclick="unBan(${this.id})" class="btn btn-default">Unban</button></div>`);
        });
        if ($('#join_public_chat #bans_list .one_ban').length == 0) {
            $('#bans_list').append(`<div class="one_ban">No users in ban</div>`);
        }
    }
    //wp
    self.getUsersCountHandler = function (response) {
        var data = response.data;
        var total = data.app + data.web;
        c('total ' + total)
        $('#cur_online_statuses .number').eq(0).text(total)
        $('#cur_online_statuses .number').eq(1).text(data.web)
        $('#cur_online_statuses .number').eq(2).text(data.app)
        $('#cur_online_statuses .number').eq(3).text(data.newIos)
        if (total == 0) {
            var data = {
                action: 'getUsersCount',
                data: {}
            };
            send(data);
        }
    };
    //wp
    self.newOrderUserActionHandler = function (response) {
        c('newOrderUserActionHandler');
        c(response);
        var data = jQuery.parseJSON(response.data);
        c(data);
        var head = 'Order #' + data.orderId + ' Info';
        var orderStatus = data.cancel == 0 ? 'accepted' : 'canceled';
        var content = `Order number ${data.orderId} was ${orderStatus} by the user`;
//        generateDashPopup(head, content, width = '350px', height = 'auto', clsrem = 1, cls = '', style = '');
        showModal(head, content);
    };
    //wp
    self.logbookEditActionHandler = function (response) {
        var data = JSON.parse(response.data);
        liveUpdateC.logbookEditAction(data);
    }
    //wp
    self.newAdminNotificationHandler = function (response) {
        var data = JSON.parse(response.data);
        refreshNotifications();
    }

    self.newNotificationHandler = function (response) {
        var data = JSON.parse(response.data);
        if (data.type == 4) {
            liveUpdateC.userJoinRequest()
        }
        dashNotifC.newNotification(data.notificationId)
    }

    self.driverStatusUpdateHandler = function (response) {
        var data = JSON.parse(response.data);
        liveUpdateC.driverStatusUpdate(data);
        updateMarkerStatus(data);
    }

    self.userDataUpdatedHandler = function (response) {
        var data = JSON.parse(response.data);
        fleetC.updateUserData(data.userId)
    }

    self.leaveFleetHandler = function (response) {
        window.location.href = window.location.href;
    }

    self.joinFleetHandler = function (response) {
        window.location.href = window.location.href;
    }

    self.iftaDistancesChangedHandler = function (response) {
        var data = JSON.parse(response.data);
        liveUpdateC.iftaDistancesChanged(data);
    }
    
    self.removeFromFleetChatHandler = function (response) {
	c('removeFromFleetChatHandler');
        var responseData = JSON.parse(response.data);
        var active = false;
        if (window.location.pathname === "/dash/ezchat/") {
            if ($('#messages_box .one_box2[data-chat="' + responseData.chatId + '"]').hasClass('active')) {
                active = true;
            }
        }
        socketLogin2();
        if (active) {
            setInterval(function(){
                $('#messages_box .one_box2[data-chat="' + responseData.chatId + '"]').click();
            },2000);
        }
        fleetC.refreshFleetData()
    }
    
    self.addToFleetChatHandler = function (response) {
	c('addToFleetChatHandler');
        var responseData = JSON.parse(response.data);
        var active = false;
        if (window.location.pathname === "/dash/ezchat/") {
            if ($('#messages_box .one_box2[data-chat="' + responseData.chatId + '"]').hasClass('active')) {
                active = true;
            }
        }
        socketLogin2();
        if (active) {
            setInterval(function(){
                $('#messages_box .one_box2[data-chat="' + responseData.chatId + '"]').click();
            },2000);
        }
        fleetC.refreshFleetData()
    }

    self.PDFProgressBarHandler = function (response) {
        var responseData = JSON.parse(response.data);
        
        pdfGen.generateProgressBarBlock();
        pdfGen.generateOneProgressBarBlock(responseData);
	}
    
}
