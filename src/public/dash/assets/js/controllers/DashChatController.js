function DashChatController()
{
    var self = this;
    this.chats = [];
    this.user = {};
    this.chatsUsersStatus = {};
    this.fleetMessagesDrivers = {};
    this.curUserStatus = 0;
    this.inFleet = 0;
    this.allReadyLogin = 0;
    this.countAllNotReadEzchatMessage = 0;
    this.avaiable = true;
    this.soundInterval = false;

    this.listOpen = false;
    this.modalTitle = 'Messages';
    this.params = {};
    this.cntrlUrl = apiDashUrl;
    this.modalElement = '';
    this.tableId = 'new_messages_table';
    this.editMode = false;
    this.modalId = 'new_messages_box';
    this.paginator = false;
    this.aferLoginCallbacks = [];
    self.loggedIn = false;
    this.addAfterLoginCallback = function (callback) {
        if (self.loggedIn) {
            if (typeof callback === 'string') {
                window[callback]();
            } else if (typeof callback === 'function') {
                callback();
            }
            return 1;
        }
        self.aferLoginCallbacks.push(callback);
    }
    this.afterLoginCallback = function () {
        $.each(self.aferLoginCallbacks, function (key, callback) {
            if (typeof callback === 'string') {
                window[callback]();
            } else if (typeof callback === 'function') {
                callback();
            }
        })
    }
//    controllerPaginator(self);
    self.getMessagesTableRow = function (driver) {
        c('getMessagesTableRow');
        var message = driver.messages[0];
        var time = timeFromSecToUSAString(message.dateTime / 1000, true);
        var listOfButtons = [];
        listOfButtons.push('<button onclick="dcc.readMsg(this)" data-id="' + message.id + '" data-userid="' + message.fromId + '">Delete</button>');
        listOfButtons.push('<button onclick="dcc.asnwerMsg(this)" data-user="' + message.fromId + '" data-id="' + message.id + '">Reply</button>');
        var tableRow = '<tr data-id="' + message.id + '" data-userid="' + message.fromId + '">\n\
			<td><span class = "fleetMessageDate">' + time + '</span></td>\n\
			<td>' + driver.name + ' ' + driver.last + '</td>\n\
			<td class="fleetMessageTd"><span class = "fleetMessage">' + message.message + '</span><span class = "countNotReadFleetMessages">' + driver.notReadFleetMessages + '</span></td>\n\
			<td>' + addTableActionRow(listOfButtons) + '</td>\n\
		</tr>';
        return tableRow;
    }
    self.showMessagesModal = function () {
        $('#nav_msg_box').remove();
        self.listOpen = true;
        modalCore(self);
        self.generateTabs();
        self.generateButtons();
        self.createModal();
        self.modalElement.find('#' + self.tableId).addClass('table-actions-block');
    }
    self.generateTabs = function () {
        c('generateTabs');
        self.tabs.push({
            label: self.modalTitle,
            cl: 'new_messages_table',
            request: 'getMessagesPagination',
            handler: 'getMessagesPaginationHandler',
            tableHeader: `<tr>
				<th>Date</th>
				<th>Driver</th>
				<th>Message</th>
				<th>Action</th>
			</tr>`
        });
        self.setCardTabs(self.tabs);
    }
    self.generateButtons = function () {
        var buttons = [];
        buttons.push('<button class="btn btn-default clear_all msg" onclick="dcc.clearAll()" style="float:right;">Clear All</button>');
        self.setCardActionsButtons(buttons);
    }
    self.getMessagesPaginationHandler = function (response) {
        c('getMessagesPaginationHandler')
        var countAllNotReadMessage = 0;
        var rows = '';
        $('#' + self.tableId + ' tbody').empty();
        $.each(response.data.result, function (key, driver) {
            var messages = driver.messages;
            if (messages.length > 0) {
                rows += self.getMessagesTableRow(driver);
                countAllNotReadMessage += driver.notReadFleetMessages;
            }
        });
        $('#' + self.tableId + ' tbody').append(rows);
        //$('.messages_number.msg').text(countAllNotReadMessage);
    }
    self.clearAll = function () {
        AjaxController('readAllMessages', {}, dashUrl, dcc.readAllMessagesHandler, 'errorBasicHandler', true);
    }
    //Chat
    self.joinPublicChatHandler = function (response) {
        var chat = response.data.room;
        $.each(self.chats, function (key, chatIn) {
            if (chatIn.id == chat.id) {
                self.chats[key] = chat;
            }
        });
        if (window.location.pathname === "/dash/ezchat/" || window.location.pathname === "/social/ezchat/") {
            $('.one_box2[data-chat="' + chat.id + '"]').removeClass('loaded');
            $('.one_box2[data-chat="' + chat.id + '"]').click();
        } else {
            $('.oneQuickChatBoxContactList[id="' + chat.id + '"]').removeClass('loaded');
            $('.oneQuickChatBoxContactList[id="' + chat.id + '"]').click();
        }
    }
    //Chat
    self.leavePublicChatHandler = function (response) {
        var chat = response.data.room;
        $.each(self.chats, function (key, chatIn) {
            if (chatIn.id == chat.id) {
                self.chats[key] = chat;
            }
        });
        if (window.location.pathname === "/dash/ezchat/" || window.location.pathname === "/social/ezchat/") {
            $('.one_box2[data-chat="' + chat.id + '"]').removeClass('loaded');
            $('.one_box2[data-chat="' + chat.id + '"]').click();
        } else {
            $('.oneQuickChatBoxContactList[id="' + chat.id + '"]').removeClass('loaded');
            $('.oneQuickChatBoxContactList[id="' + chat.id + '"]').click();
        }

    }
    //chat
    self.sendSupportMessageHandler = function (response) {
        c('sendSupportMessageHandler')
        var chatId = response.data.chatId;
        var message = response.data.message;
        var userId = response.data.userId;
        var mine = '';
        if (userId == 0) {
            mine = 'notMine';
        }
        if ($(`.support_chat[data-id="${chatId}"] .support_messages_box`).length > 0) {
            $(`.support_chat[data-id="${chatId}"] .support_messages_box`).append(`<p class="${mine}">${message}</p>`)
            $(`.support_chat[data-id="${chatId}"] .support_messages_box`).scrollTop($(`.support_chat[data-id="${chatId}"] .support_messages_box`)[0].scrollHeight)
        }
    }
    //chat
    self.answerSupportHandler = function (response) {
        c('answerSupportHandler');
        if ($('#supportChatList').length == 0) {
            $('body').append('<div id="supportChatList"><h3>Support Calls</h3><div id="supportCallsList"></div><div id="supportChats"></div></div>');
        }
        var chatId = response.data.chatId;

        $(`.newCall[data-id="${chatId}"]`).remove();
        if ($(`.support_chat[data-id="${chatId}"]`).length == 0) {
            var placeHol = 'Type here';
            if (typeof (window.FileReader) != 'undefined') {
                placeHol += ' or drag file here';
            }
            var supportChatPosition = '';
            if ($('#supportChats .support_chat').length >= 1) {
                var numPosT = 500 + ($('#supportChats .support_chat').length * 10);
                var numPosL = $('#supportChats .support_chat').length * 10;
                supportChatPosition = 'style="top:-' + numPosT + 'px;left:' + numPosL + 'px"';
            }
            $('#supportChats').append(`<div class="support_chat active" data-id="${chatId}" ${supportChatPosition}>
				<div class="chat_active">
					<div class="support_chat_head" onmousedown="dcc.chatDraggableEnable(this);" onmouseup="dcc.chatDraggableDisable(this);">
						Support chat with Client
						<button onclick="closeChat(this);"></button>
					</div>
					<div class="support_chat_body active">
						<div class="support_chat_active_body">
							<div class="start_chat_head">
								<p><i class="fa fa-user-circle-o"></i>${response.data.chatInfo.name.trunc(25)}</p>
								<span></span>
							</div>
							<div class="support_messages_box">
								<p>Name: ${response.data.chatInfo.name}<br/>
									Email: ${response.data.chatInfo.email}<br/>
									Phone: ${response.data.chatInfo.phone}<br/></p>
							</div>
							<div class="messages_box_actions">
								<textarea placeholder="${placeHol}" onkeyup="checkIfSend(this, event)"></textarea>
								<button onclick="leaveChat(this)"><img src="/dash/assets/img/icon/leave_support_chat.png" />Leave Chat</button>
							</div>
						</div>
					</div>
				</div>
			</div>`);
            $('#supportChats .support_chat[data-id="' + chatId + '"]').draggable();
            $('#supportChats .support_chat[data-id="' + chatId + '"]').draggable('disable');
        }
        $.each(response.data.messages, function (key, message) {
            c('one msg');
            var msg = JSON.parse(message.message);
            var mine = '';
            if (message.userId == 0) {
                mine = 'notMine';
            }
            $(`.support_chat[data-id="${chatId}"] .support_messages_box`).append(`<p class="${mine}">${msg.message}</p>`);
            $(`.support_chat[data-id="${chatId}"] .support_messages_box`).scrollTop($(`.support_chat[data-id="${chatId}"] .support_messages_box`)[0].scrollHeight);
        });
        if (response.data.status == 1) {
            $('#messages_box').html('<p class="service">Chat Finished</p>');
        }

    }
    self.chatDraggableEnable = function (el) {
        c('chatDraggableEnable');
        var chatId = $(el).closest('.support_chat').attr('data-id');
        c(chatId);
        $('#supportChats .support_chat[data-id="' + chatId + '"]').draggable('enable');
    }
    self.chatDraggableDisable = function (el) {
        c('chatDraggableDisable');
        var chatId = $(el).closest('.support_chat').attr('data-id');
        c(chatId);
        $('#supportChats .support_chat[data-id="' + chatId + '"]').draggable('disable');
    }
    self.answerSupport = function (el) {
        self.stopSountInterval();
        var chatId = $(el).attr('data-id');
        var data = {
            action: 'answerSupport',
            data: {
                chatId: chatId
            }
        };
        send(data);
    }
    self.deleteSupportAnswerHandler = function (response) {
        c(response);
        var data = response.data;
        $('#supportChatList #supportCallsList button[data-id="' + data.chatId + '"]').remove();
    }
    self.startSountInterval = function () {
        this.avaiable = false;
        this.soundInterval = setInterval(function () {
            var audio = new Audio('/dash/assets/audio/beep-07.wav');
            var vol = getCookie('supportVolume') == '' ? 15 : getCookie('supportVolume');
            audio.volume = 0.2 * vol / 15;
            audio.play();
        }, 1000);
    }
    self.stopSountInterval = function () {
        clearInterval(this.soundInterval);
    }
    //chat
    self.supportCallHandler = function (response) {
        var chatId = response.data.chatId;
        if ($('#supportChatList').length == 0) {
            $('body').append('<div id="supportChatList"><h3>Support Calls</h3><div id="supportCallsList"></div><div id="supportChats"></div></div>')
        }
        var supportCallOnOff = getCookie('supportCallOnOff');
        if (supportCallOnOff == '') {
            createCookie('supportCallOnOff', 1);
            supportCallOnOff = '1';
        }
        if (supportCallOnOff == '1') {
            if (this.avaiable) {
                self.startSountInterval();
            }
            if ($(`.newCall[data-id=${chatId}]`).length == 0) {
                $('#supportCallsList').append(`<button class="newCall" data-id="${chatId}" onclick="dcc.answerSupport(this)">Answer</button>`);
            }
        }
    }
    self.supportCallOnOff = function (el) {
        createCookie('supportCallOnOff', $(el).attr('data-val'));
    }

    //chat
    self.loginHandler = function (response)
    {
        if (response.code != '000')
        {
            return false;
        }
        self.loggedIn = true;
        self.afterLoginCallback();
        self.chats = response.data.rooms.concat(response.data.publicRooms);
        self.public_chats = response.data.public_chats;
        self.user = response.data.curUserInfo;
        self.chatsUsersStatus = response.data.chatsUsersStatus;
        self.curUserStatus = response.data.curUserStatus;
        self.inFleet = response.data.inFleet;
        self.fleetMessagesDrivers = response.data.fleetMessages;
        if (self.allReadyLogin === 1)
        {
            window.location.pathname == "/dash/message/" ? fillMessagePage() : '';
            window.location.pathname == "/dash/ezchat/" ? fillEzchatPage() : '';
            window.location.pathname == "/social/ezchat/" ? fillEzchatPage() : '';
            if (window.location.pathname == "/dash/trucks/" || window.location.pathname == "/dash/drivers/")
            {
                $('#chat_input').attr('data-id') != '' && $('#chat_el .name').text() != '' ? fillDashMessagePage($('#chat_input').attr('data-id'), $('#chat_el .name').text()) : '';
            }
        }
        self.allReadyLogin = 1;

        var countAllNotReadMessage = 0,
                title = document.title,
                countAllNotReadEzchatMessage = 0,
                messages = [];

        //$('#new_messages_box .ez_table tbody').empty();
        if (self.inFleet === 1) {
            $.each(self.fleetMessagesDrivers, function (key, driver) {
                messages = driver.messages;
                if (messages.length > 0) {
                    if (driver.notReadFleetMessages > 0) {
                        countAllNotReadMessage += driver.notReadFleetMessages;
                    }
                }
            });
        }
        if (self.chats && self.chats.length > 0)
        {
            for (var i = 0, len = self.chats.length; i < len; i++)
            {
                countAllNotReadEzchatMessage += self.chats[i].notReadMes;
            }
        }
        $('.messages_number.msg').text(countAllNotReadMessage);
        self.countAllNotReadEzchatMessage = countAllNotReadEzchatMessage;
        if (countAllNotReadEzchatMessage > 0)
        {
            $('#countMes').text(countAllNotReadEzchatMessage).addClass('countMes');
            title = title.slice(title.indexOf(')') + 1);
            if (isNaN(self.countAllNotReadEzchatMessage)) {
                self.countAllNotReadEzchatMessage = 0;
            }
            document.title = '(' + self.countAllNotReadEzchatMessage + ') ' + title;
        }
    }
    self.readAllMessagesHandler = function (response) {
        $.each(self.fleetMessagesDrivers, function (key, driver) {
            self.fleetMessagesDrivers[key].messages = [];
        });
        if (window.location.pathname == "/dash/message/") {
            $('#messages_box .one_box.hasNotReadFleetMessages').removeClass('hasNotReadFleetMessages');
        }
        $('#nav_messages .messages_number').text();
        self.paginator.changePagination();
    }
    self.readMsg = function (el) {
        c(el);
        var data = {data: {
                action: 'apiReadMessage',
                userId: $(el).attr('data-userid')
            }};
        $.ajax({
            url: MAIN_LINK + '/db/dashController/' + '?' + window.location.search.substring(1),
            method: "POST",
            contentType: "application/json", // send as JSON
            data: JSON.stringify(data),
            success: function (data) {
                var number = parseInt($('.messages_number.msg').text()) - parseInt($(el).parents('tr').find('.countNotReadFleetMessages').text());
                $('.messages_number.msg').text(number);
                if (window.location.pathname == "/dash/message/") {
                    $('#messages_box .one_box[data-id="' + $(el).attr('data-userid') + '"]').removeClass('hasNotReadFleetMessages');
                }
                $(el).closest('tr').remove();
            }
        });
    }

    self.asnwerMsg = function (el) {
        $('#message_form #msg_user').val($(el).attr('data-user'));
        $('#message_form #msg_msg').val($(el).attr('data-id'));
        window.location.pathname == "/dash/message/" ? $('#messages_box .one_box[data-id="' + $(el).attr('data-user') + '"]').click() : dc.getUrlContent('/dash/message/', {userId: $(el).attr('data-user')});
        $('#new_messages_box').find('.close').click();
    }

    //chat
    self.sendFleetMessageHandler = function (response)
    {
		c(response);
        var message = response.data,
                addClass = '',
                tableMessageBox = '',
                userName = message.name + ' ' + message.last,
                chatUserId = '';

        if (message.toId == curUserId) {
            self.fleetMessagesDrivers[message.fromId].messages.unshift(message);
            chatUserId = message.fromId;
        } else {
            self.fleetMessagesDrivers[message.toId].messages.unshift(message);
            chatUserId = message.toId;
        }
        if ((($('.one_box[data-id = "' + message.toId + '"]').hasClass('active') || $('.one_box[data-id = "' + message.fromId + '"]').hasClass('active')) && window.location.pathname == "/dash/message/")
                || ((window.location.pathname == "/dash/trucks/" || window.location.pathname == "/dash/drivers/")
                        && (($('#chat_box #chat_input').attr('data-id') == message.fromId) || ($('#chat_box #chat_input').attr('data-id') == message.toId))))
        {
            if (message.fromId != curUserId)
            {
                addClass = "to";
                var data = {
                    action: 'readFleetMessage',
                    data: {
                        fromId: message.fromId,
                        toId: message.toId
                    }
                };
                send(data);
            } else
            {
                userName = getCookie("user");
            }
            $('#chat_msgs').append('<div class="chat_one_msg ' + addClass + '">\n\
                    <div class="msg_box">\n\
                        <div class="chat_time">' + convertOnlyTimeFromSqlToUsa(toTime(message.dateTime / 1000), true) + '</div>\n\
                        <span class="chat_msg">' + emojione.unicodeToImage(emojione.escapeHTML(message.message)) + '</span>\n\
                    </div>\n\
                </div>');
            window.location.pathname == "/dash/message/" ? $('#messages_box .one_box[data-id="' + chatUserId + '"] .one_time').text(timeFromSecToUSAString((message.dateTime / 1000), true)) : '';
            if (message.fromId == curUserId)
            {
                $("#chat_msgs").scrollTop($("#chat_msgs")[0].scrollHeight);
                $('#chat_input').val('');
            } else {
                $("#chat_msgs").scrollTop($("#chat_msgs")[0].scrollHeight);
            }
        } else {
            if (message.toId == curUserId){
                dcc.fleetMessagesDrivers[message.fromId].notReadFleetMessages++;
                $('#messages_box .one_box[data-id="' + message.fromId + '"] .one_time').text(timeFromSecToUSAString(message.dateTime / 1000, true));
                $('#messages_box .one_box[data-id="' + message.fromId + '"] .countNotReadFleetMessagesChatBox').show().text(dcc.fleetMessagesDrivers[message.fromId].notReadFleetMessages);
                tableMessageBox = $('#new_messages_table tbody tr[data-userid = "' + message.fromId + '"]');
                window.location.pathname == "/dash/message/" ? $('#messages_box .one_box[data-id="' + message.fromId + '"]').addClass('hasNotReadFleetMessages') : '';
                if ((getCookie('newNotificaitonsBox') == 1 || getCookie('newNotificaitonsBox') == '') && $('#nav_msg_box').length == 0) {
                    console.log("")
                    var msg = message.message.trimToLength(25);
                    var style = '';
                    if ($('#nav_notif_box').length > 0 && $('#nav_alert_box').length > 0) {
                        $('#nav_notif_box').removeClass().addClass('nav_alert_box');
                        $('#nav_alert_box').removeClass().addClass('nav_alert_box');
                    } else if ($('#nav_alert_box').length > 0) {
                        $('#nav_alert_box').removeClass().addClass('nav_alert_box alert_position_left');
                        style = 'alert_position_right';
                    } else if ($('#nav_notif_box').length > 0) {
                        $('#nav_notif_box').removeClass().addClass('nav_alert_box alert_position_left');
                        style = 'alert_position_right';
                }
                    // $('#nav_messaegs').append('<div id="nav_msg_box" class="nav_alert_box ' + style + '">' + msg + '</div>');
                    // $('#nav_messages').append('<div id="nav_msg_box" class="nav_alert_box ' + style + '">' + msg + '</div>');
                }

                $('.messages_number.msg').text(parseInt($('.messages_number.msg').text()) + 1);
                if ($(tableMessageBox).length > 0){
                    $(tableMessageBox).find('.fleetMessageDate').text(timeFromSecToUSAString(message.dateTime / 1000, true));
                    $(tableMessageBox).find('.fleetMessage').text(message.message);
                    $(tableMessageBox).find('.countNotReadFleetMessages').text(parseInt($(tableMessageBox).find('.countNotReadFleetMessages').text()) + 1);
                } else {
                    if (self.listOpen == true) {
                        self.paginator.changePagination();
                    }
                }
            } else {
                $('#messages_box .one_box[data-id="' + message.toId + '"] .one_time').text(timeFromSecToUSAString(message.dateTime / 1000, true));
            }
        }
        orderFleetChats();
    }
    //chat
    self.getMoreFleetMessagesHandler = function (response)
    {
        c(response);
        var anchorMes = 0;

        if (response.data.chat_messages.length > 0)
        {
            var drName = $('#chat_el .name').text();
            var userName = getCookie("user");
            $.each(response.data.chat_messages, function (key, message)
            {
                self.addMessageOnScreen(message, userName, drName, response.data.userId);
            });
            self.fleetMessagesDrivers[response.data.userId].messages = self.fleetMessagesDrivers[response.data.userId].messages.concat(response.data.chat_messages);
        } else
        {
            $('#messages_box .one_box[data-id="' + response.data.userId + '"]').addClass('loaded');
        }
        if (anchor)
        {
            anchorMes = $('.chat_one_msg[data-time="' + anchor + '"]').offset();
            if (anchorMes)
            {
                $("#chat_msgs").scrollTop(anchorMes.top - 211);
            }
            anchor = 0;
        }
        gettingMore = false;
    }
    self.addMessageOnScreen = function(message, userName, drName, driverId){
	var from = message.fromId;
	var to = message.toId;
	var time = toTime(message.dateTime/1000);
	
	var name = userName;
	var addClass = '';
	if(from == driverId){
		name = drName;
		addClass="to";
	}
	
	var messageText = message.message;
	$('#chat_msgs').prepend('<div class="chat_one_msg '+addClass+'" data-time = "'+message.dateTime+'">\n\
		<div class="msg_box">\n\
			<div class="chat_time">'+convertOnlyTimeFromSqlToUsa(time, true)+'</div>\n\
			<span class="chat_msg">'+emojione.unicodeToImage(emojione.escapeHTML(messageText))+'</span>\n\
		</div>\n\
	</div>');
    }
    //chat
    self.readFleetMessageHandler = function (response) {
        var userId = response.data.fromId;
        dcc.fleetMessagesDrivers[userId].notReadFleetMessages = 0;
        var totallyNotRead = 0;
        $.each(dcc.fleetMessagesDrivers, function(key, item){
            totallyNotRead+= parseInt(item.notReadFleetMessages) || 0;
        })
        $('.messages_number.msg').text(totallyNotRead);
        $('#messages_box .one_box[data-id="' + userId + '"]').removeClass('hasNotReadFleetMessages');
        $('#messages_box .one_box[data-id="' + userId + '"] .countNotReadFleetMessagesChatBox').hide().text('');
    }
    self.getChatById = function (chatId) {
        var chat = {};
        $.each(self.chats, function (key, chatN) {
            if (chatN.id == chatId) {
                chat = chatN;
            }
        })
        return chat;
    }
    //chat
    self.updateUserInfoHandler = function (response) {
        var userId = response.data.userId;
        var userInfo = response.data.userInfo;
        if (userId != curUserId)
        {
            var chatId = response.data.chatId;
            if ($('.one_box2[data-chat="' + chatId + '"]').attr("data-type") == 0)
            {
                if (userInfo.thumb) {
                    $('.one_box2[data-chat="' + chatId + '"] img').attr("src", filesLink + userInfo.thumb);
                }

                $('.one_box2[data-chat="' + chatId + '"]').find(".one_name").text(userInfo.login);
                if ($('div.one_box2[data-chat="' + chatId + '"]').hasClass('active'))
                {
                    $("span.name").text(userInfo.login);
                    if (userInfo.thumb) {
                        $(".dot img").attr("src", filesLink + userInfo.thumb);
                    }

                }
            }
            $.each(dcc.chats, function (key, chatN)
            {
                if (chatN.id == chatId)
                {
                    $.each(chatN.chat_users, function (key, userN)
                    {
                        if (userN.id == userId)
                        {
                            userN.login = userInfo.login;
                            if (userInfo.thumb) {
                                userN.thumb = userInfo.thumb;
                            }
                        }
                    });
                }
            });
            if ($('div.one_box2[data-chat="' + chatId + '"]').hasClass('active'))
            {
                $("div[data-user=" + userId + "]").find(".chat_name").children("span#userLogin").text(userInfo.login);
                if (userInfo.thumb) {
                    $("div[data-user=" + userId + "]").find(".message_thumb").attr("src", filesLink + userInfo.thumb);
                }
            }
            if ($('.oneQuickChatBoxContactList[id = "' + chatId + '"]').length > 0)
            {
                $('#oneQuickChatRoomThumb').attr('src', filesLink + userInfo.thumb);
                $('#oneQuickChatRoomName').text(userInfo.login);
            }
            quickChatC.updateQuickChatsContactList();
        } else
        {
            self.user = response.data.userInfo;
            $('#user_login, #cur_user_name').val(self.user.login).attr('data-name', self.user.login);
        }
    }
    self.setupUserInfo = function () {
        if (self.user && (self.user.thumb || self.user.awsThumb)) {
            var thumbAvatar = self.user.awsThumb ? self.user.awsThumb : filesLink + self.user.thumb;
            $('#main_image_holder img, #user_top_info img').attr('src', thumbAvatar);
        } else {
            $('#main_image_holder img, #user_top_info img').attr('src', MAIN_LINK + '/dash/assets/img/personal.png');
        }
        if (window.location.pathname === "/dash/ezchat/") {
            var thumb = '/social/assets/img/thumb_blank.png';
            if (self.user.thumb != '' && self.user.thumb != null && self.user.thumb != "null") {
                thumb = EZCHAT_LINK + self.user.thumb;
            }
            if (self.user.awsThumb != '' && self.user.awsThumb != null && self.user.awsThumb != "null") {
                thumb = self.user.awsThumb;
            }
            c(thumb);
            $('#dashHeaderAvatar').attr('src', thumb);
        }
        c('setupUserInfo');
        self.user ? $('#user_login, #cur_user_name').val(self.user.login).attr('data-name', self.user.login) : '';
    }
    //chat
    self.leaveChatHandler = function (response) {
        if (response.code == 506)
        {
            return false;
        }
        var chatId = response.data;
        if ($('div.one_box2[data-chat="' + chatId + '"]').hasClass('active'))
        {
            $("#chat_el").hide();
        }
        $.grep(self.chats, function (chatIn, key) {
            if (chatIn.id == chatId) {
                $('.one_box2[data-chat="' + chatId + '"]').remove();
                chatIn.chat_users = [];
                return false;
            }
            return true;
        });
        ezchatActionC.orderChats();
        quickChatC.updateQuickChatsContactList();
    }
    //chat
    self.getMoreMessagesHandler = function (response) {
        c('getMoreMessagesHandler');
        var data = response.data;
        data.chat_messages.reverse();
        if (data.chat_messages.length > 0) {
            $.each(self.chats, function (key, chatIn) {
                if (chatIn.id == data.chatId) {
                    self.chats[key].chat_messages = data.chat_messages.concat(self.chats[key].chat_messages);
                    if (window.location.pathname == '/dash/ezchat/' || window.location.pathname === "/social/ezchat/")
                    {
                        ezchatActionC.needTop = true;
                        $('.one_box2[data-chat="' + data.chatId + '"]').click();
                    } else
                    {
                        $('.oneQuickChatBoxContactList[id = "' + data.chatId + '"]').click();
                        $("#oneQuickChatRoomMessageBox").scrollTop(1);
                        if (ezchatActionC.anchor && $('.oneQuickChatMessageBox').length > 7)
                        {
                            var anchorMes = $('.oneQuickChatMessageBox[data-time="' + ezchatActionC.anchor + '"]').position();
                            if (anchorMes)
                            {
                                $("#oneQuickChatRoomMessageBox").scrollTop(anchorMes.top - 49);
                            }
                            ezchatActionC.anchor = 0;
                        } else
                        {
                            $('#oneQuickChatRoomMessageBox').scrollTop($("#oneQuickChatRoomMessageBox")[0].scrollHeight);
                        }
                    }
                }
            });
        } else {
            $('.one_box2[data-chat="' + data.chatId + '"], .oneQuickChatBoxContactList[id="' + data.chatId + '"]').addClass('loaded');
        }
        ezchatActionC.gettingMore = false;
        if (window.location.pathname == '/dash/ezchat/' || window.location.pathname === "/social/ezchat/")
        {
            $('#loading_gif').remove();
            ezchatActionC.orderChats();
        }
    }
    //chat
    self.updateChatInfoHandler = function (response) {
        c('updateChatInfoHandler');
        if (response.code == 506) {
            return false;
        }
        var chat = response.data.room;

        if ($('.one_box2[data-chat=' + chat.id + ']').hasClass('active')) {
            chat.updateChatBox = 1;
        }
        if (response.data.url) {
            chat.thumb = filesLink + response.data.url;
        }
        if (response.data.awsUrl) {
            chat.thumb = response.data.awsUrl;
        }
        $.each(self.chats, function (key, chatIn) {
            if (chatIn.id == chat.id) {
                self.chats[key] = chat;
                self.chats[key].notReadMes = response.newMes;
            }
        });

        if (window.location.pathname === '/dash/ezchat/' || window.location.pathname === "/social/ezchat/") {
            self.setContactRoomBox(chat);
            ezchatActionC.orderChats();
        } else {
            if ($('.oneQuickChatBoxContactList[id = "' + chat.id + '"]').length > 0) {
                $('#oneQuickChatRoomThumb').attr('src', chat.thumb);
                $('#oneQuickChatRoomName').text(chat.chatName);
            }
            quickChatC.updateQuickChatsContactList();
        }
    }
    //chat
    self.createChatHandler = function (response) {
        var chat = response.data.room,
                title = document.title;
        $.each(chat.chat_users, function (key, value) {
            $('#findSocUser .one-user[data-user-id="' + value.id + '"]').remove();
            if ($('#findSocUser .one-user').length == 0) {
                $('#findSocUser').remove();
            }
        });
        if (response.code == 502)
        {
            $('.find_result').empty();
            $('.find_result').append('<div><label>Already in contact list</label></div>');
            return false;
        } else
        {
            chat.notReadMes = 1;
            self.chats.push(chat);
            dcc.chatsUsersStatus[chat.id] = chat.chatStatus;
            self.countAllNotReadEzchatMessage > 0 ? $('#countMes').text(self.countAllNotReadEzchatMessage + 1) : $('#countMes').text(1).addClass('countMes');
            self.countAllNotReadEzchatMessage++;
            title = title.slice(title.indexOf(')') + 1);
            if (isNaN(self.countAllNotReadEzchatMessage)) {
                self.countAllNotReadEzchatMessage = 0;
            }
            document.title = '(' + self.countAllNotReadEzchatMessage + ') ' + title;
            if (chat.type == 0) {//personal chat
                if (window.location.pathname === '/dash/ezchat/' || window.location.pathname === "/social/ezchat/")
                {
                    self.setPersonalChat(chat);
                    if ($("#addContact").is(":visible"))
                    {
                        $("#addContactTrue").hide();
                        $("#addContact p").text("Added to contacts");
                    }
                    switch (chat.chatStatus)
                    {
                        case 0:
                            $('div.one_box2[data-chat="' + chat.id + '"]').find("#status").addClass('offline');
                            break;
                        case 1:
                            $('div.one_box2[data-chat="' + chat.id + '"]').find("#status").addClass('online');
                            break;
                        case 2:
                            $('div.one_box2[data-chat="' + chat.id + '"]').find("#status").addClass('away');
                            break;
                        case 3:
                            $('div.one_box2[data-chat="' + chat.id + '"]').find("#status").addClass('not_disturb');
                            break;
                        case 4:
                            $('div.one_box2[data-chat="' + chat.id + '"]').find("#status").addClass('offline');
                            break;
                    }
                    $('#status_options').hide();
                }
            } else {//room
                if (window.location.pathname === '/dash/ezchat/' || window.location.pathname === "/social/ezchat/")
                {
                    self.setContactRoomBox(chat);
                }
            }
        }
        if (window.location.pathname === '/dash/ezchat/' || window.location.pathname === "/social/ezchat/")
        {
            $('.find_user_box').hide();
            $('.find_result').empty();
            $('.find_user_email').val('');
            ezchatActionC.orderChats();
        } else
        {
            quickChatC.updateQuickChatsContactList();
        }
    }
    self.setCanInviteList = function (chat) {
        var thumbUrl = '';
        var awsThumbUrl = '';
        var userName = '';
        var userId = 0;
        $.each(chat.chat_users, function (key, user) {
            if (user.id != curUserId) {
                userName = user.login;
                userId = user.id;
                thumbUrl = user.thumb;
                awsThumbUrl = user.awsThumb;
            }
        });
        if (thumbUrl || awsThumbUrl) {
            thumbUrl = filesLink + thumbUrl;
            if (awsThumbUrl) {
                thumbUrl = awsThumbUrl;
            }
        } else {
            thumbUrl = '/dash/assets/img/personal.png';
        }
        $('.can_invite .list').append('<div data-id="' + userId + '" onclick="ezchatActionC.inviteUserInChat($(this))" class="user_info"><img src="' + thumbUrl + '" alt="thumb" /><div class="name">' + userName + '</div><span class="circle"><i class="fa fa-check"></i></div></div>');
    }
    self.setPersonalChat = function (chat) {
        var thumbUrl = '';
        var awsThumbUrl = '';
        var userName = '';
        var userId = '';
        var email = '';
        var userId = 0;
        $.each(chat.chat_users, function (key, user) {
            if (user.id != curUserId) {
                userName = user.login;
                email = user.email;
                userId = user.id;
                thumbUrl = user.thumb;
                awsThumbUrl = user.awsThumb;
            }
        })
        if (thumbUrl || awsThumbUrl)
        {
            thumbUrl = filesLink + thumbUrl;
            if (awsThumbUrl) {
                thumbUrl = awsThumbUrl;
            }
        } else
        {
            thumbUrl = '/dash/assets/img/personal.png';
        }
        if (!chat.notReadMes)
        {
            chat.notReadMes = 0;
        }
        if (!userName)
        {
            userName = "User deleted chat";
        }
        if (!chat.lastVisit)
        {
            chat.lastVisit = '';
        }

        $('#messages_box').append('\
			<div class="one_box2" data-userId ="' + userId + '" data-lastVisit = "' + chat.lastVisit + '" data-chat="' + chat.id + '" data-name="' + userName + '" data-newmes = "' + chat.notReadMes + '"\n\
			data-type="0" data-email="' + email + '" style="display: block;" onclick="ezchatActionC.actionChoseChat(this);" oncontextmenu="ezchatActionC.actionContextMenu(this,event);">\n\
                            <div class="one_box2-container">\n\
                                <div class="avatar-block">\n\
				<img src="' + thumbUrl + '" alt="thumb" /><div id = "status"> </div>\n\
                                </div>\n\
				<div class="one_name">' + userName + '</div><div id = "countmes"></div>\n\
			<ul class="custom-menu">\n\
				<li class="delete_chat" onclick="ezchatActionC.actionShowDeleteOrLeavePopup(this, event);">Delete Chat</li>\n\
                                <li class="send_contact_li" onclick="ezchatActionC.actionSendContactList(this, event);">Send Contact</li>\n\
			</ul>\n\
                        </div>\n\
			</div>')
        if (chat.notReadMes)
        {
            $('div.one_box2[data-chat="' + chat.id + '"]').find("#countmes").text(chat.notReadMes).addClass('countmes');
        }
        if (userName == "User deleted chat")
        {
            $('div.one_box2[data-chat="' + chat.id + '"]').find("#status").hide();
        } else
            $('.can_invite .list').append('<div data-id="' + userId + '" onclick="ezchatActionC.inviteUserInChat($(this))" class="user_info"><img src="' + thumbUrl + '" alt="thumb" /><div class="name">' + userName + '</div><span class="circle"><i class="fa fa-check"></i></div></div>');
    }
    self.setContactRoomBox = function (chat, publicChat = false) {
        c('setContactRoomBox');
        c(chat);
        if ($('.one_box2[data-chat=' + chat.id + ']').hasClass('active')) {
            $('#chat_box .chat_el .user-info .name').text(chat.chatName.trimToLength(50));
            if (chat.thumb != '' && chat.thumb != '0') {
                $('#chat_box .chat_el .avatar img').attr('src', filesLink + chat.thumb);
            }
        }
        
        $('.one_box2[data-chat=' + chat.id + ']').remove();
        
        if (chat.thumb != '0' && chat.thumb != '') {
            var thumbUrl = filesLink + chat.thumb;
            if (chat.awsThumb) {
                thumbUrl = chat.awsThumb;
            }
        } else {
            var thumbUrl = '/dash/assets/img/group.png';
        }
        
        if (!chat.notReadMes) {
            chat.notReadMes = 0;
        }
        
        var conMenu = `<ul class="custom-menu">
                            <li class="leave_room" onclick="ezchatActionC.actionShowDeleteOrLeavePopup(this, event);">Leave Chat</li>
			</ul>`;
        
        if (chat.type == 2 || chat.type == 3) {
            conMenu = '';
        }
        
        $('#messages_box').append('\
		<div class="one_box2" data-chat="' + chat.id + '"\n\
			data-type="' + chat.type + '" data-name="' + chat.chatName + '" data-newmes = "' + chat.notReadMes + '" \n\
		 style=""  onclick="ezchatActionC.actionChoseChat(this);"  oncontextmenu="ezchatActionC.actionContextMenu(this,event);">\n\
                <div class="one_box2-container">\n\
		<img src="' + thumbUrl + '" alt="thumb" />\n\
			<div class="one_name">' + chat.chatName + '</div><div id = "countmes" ></div> \n\
                        ' + conMenu + '\n\
		</div></div>');
        
        //chat_types
        var activeChatType = $('#chat_types .active').attr('data-types');
        $('#messages_box .one_box2').hide();
        $.each(JSON.parse(activeChatType), function (k, v) {
            c(v);
            $('#messages_box .one_box2[data-type="' + v + '"]').show();
        });
        
        if (chat.notReadMes) {
            $('div.one_box2[data-chat="' + chat.id + '"]').find("#countmes").text(chat.notReadMes).addClass('countmes');
        }
        
        if (chat.updateChatBox) {
            $('.one_box2[data-chat=' + chat.id + ']').addClass('active');
        }
        
        if (chat.curUser) {
            $("#chat_msgs").scrollTop($("#chat_msgs")[0].scrollHeight);
        }
    }
    //chat
    self.findUsersByEmailHandler = function (response) {
        var user = response.data.user;
        if (response.code == 501) {
            $('.find_result').append('<div><label>No users with this email in EzChat</label></div>');
            return false;
        }

        $('.find_result').empty();
        $('.find_result').append('<div><label>Email:&nbsp;</label><span>' + user.email + '</span><br><label>Name:&nbsp;</label><span>' + user.login + '</span><br><button class="" onclick="inviteUser($(this));" data-id="' + user.id + '" data-user="' + user.login + '">Invite</button></div>');

    }
    //chat
    self.editMessageHandler = function (response) {
        var messageObj = response.data;
        var chat;
        $.each(self.chats, function (key, chatN) {
            if (chatN.id == messageObj.chatId) {
                var chat = chatN;
                
                $.each(chat.chat_messages, function (key2, messageN) {
                    if (messageN.id == messageObj.id) {
                        chat.chat_messages[key2] = messageObj;
                    }
                });
            }
        });
        var messageText = messageObj.message.replace(/\r\n|\r|\n/g, "<br />");
        for (var x = 1; x < 10; x++) {
            messageText = messageText.split('[[' + x + ']]').join('<img data-smile="' + x + '" class="smile" src="' + filesLink + '/dash/assets/img/smiles/sm' + x + '.png" alt="smile">');
        }
        if (window.location.pathname === '/dash/ezchat/' || window.location.pathname === "/social/ezchat/")
        {
            var message = messageObj.message;
            var awsLink = false;
            if (messageObj.awsLink != null || messageObj.awsLink != '' || typeof messageObj.awsLink != 'undefined') {
                awsLink = messageObj.awsLink;
            }
            var userId = messageObj.userId;
            var timeSec = parseInt(messageObj.dateTime);
            var time = ezchatActionC.toTime(timeSec / 1000);
            var date = ezchatActionC.toDate(timeSec / 1000);
            
            var messageId = messageObj.id;
            var to = '';
            var img = '';
            var msgOpts = '';
            var userlogin = '';
            var preview = '';
            
            if (userId == curUserId) {
                if (messageObj.type == 1) {
                    msgOpts = '<ul class="custom-menu">\n\
                                    <li class="quote_message" onclick="ezchatActionC.actionQuoteMessage(this);">Quote</li>\n\
                    <li class="delete_message" onclick="ezchatActionC.actionDeleteMessage(this);">Delete</li>\n\
                    <li class="edit_message" onclick="ezchatActionC.actionEditMessage(this);">Edit</li>\n\
                </ul>';
                } else {
                    if (messageObj.type == 2 || messageObj.type == 3 || messageObj.type == 4 || messageObj.type == 5) {
                        msgOpts = '<ul class="custom-menu">\n\
                        <li class="download_message" onclick="ezchatActionC.actionDownloadMessage(this);">Download</li>\n\
                        <li class="delete_message" onclick="ezchatActionC.actionDeleteMessage(this);">Delete</li>\n\
                    </ul>';
                    } else {
                        msgOpts = '<ul class="custom-menu">\n\
                                               <li class="delete_message" onclick="ezchatActionC.actionDeleteMessage(this);">Delete</li>\n\
                                       </ul>';
                    }
                }
            }
            
            var VRegExp = new RegExp(/(.*\/)/g);
            var attachmentMessageControlIcon = '';
            if (messageObj.type == 2) {
                attachmentMessageControlIcon = '';//'<div class="messageControlIcon"><div class="ezchatRemoveMessageIcon"><i class="fa fa-times" aria-hidden="true"></i><span class="ezchatRemoveMessageIconHint">Delete</span></div><div class="ezchatDownloadIcon"><i class="fa fa-cloud-download" aria-hidden="true"></i></div></div>';
                message = '<a class="get_doc downloadMes" data-src="' + (awsLink ? awsLink : filesLink + message) + '" download>' + attachmentMessageControlIcon + '<img src="' + (awsLink ? awsLink : filesLink + message) + '" alt="messageImage" class="messsage_image undeployedImg" onclick="ezchatActionC.actionMessageImage(this);" /></a>';
            } else if (messageObj.type == 3) {
                attachmentMessageControlIcon = '';//'<div class="messageControlIcon"><div class="ezchatRemoveMessageIcon"><i class="fa fa-times" aria-hidden="true"></i><span class="ezchatRemoveMessageIconHint">Delete</span></div><div class="ezchatDownloadIcon"><i class="fa fa-cloud-download" aria-hidden="true"></i></div></div>';
                message = '<div class = "playVideoButton" onclick="ezchatActionC.playVideo(this);"></div><a class="get_doc downloadMes" data-src="' + (awsLink ? awsLink : filesLink + message) + '" download>' + attachmentMessageControlIcon + '<video class="undeployedVideo" onclick="ezchatActionC.playVideo(this);"><source src="' + (awsLink ? awsLink : filesLink + message) + '"></video></a>';
            } else if (messageObj.type == 5) {
                message = '<a class="get_doc downloadMes" data-src="' + (awsLink ? awsLink : filesLink + message) + '" download><audio controls><source src="' + (awsLink ? awsLink : filesLink + message) + '"></audio></a>';
            } else if (messageObj.type == 4) {
                message = '<a class="get_doc icon-edit-logs" data-src="' + (awsLink ? awsLink : filesLink + message) + '" href="' + (awsLink ? awsLink : filesLink + message) + '" download>' + message.replace(VRegExp, "") + '</a>';

            } else if (messageObj.type == 9) {
                if (position == 11) {
                    msgOpts = '<ul class="custom-menu">\n\
                    <li class="delete_message" onclick="ezchatActionC.actionDeleteMessage(this);">Delete</li>\n\
                </ul>';
                } else {
                    msgOpts = '';
                }
                $('#chat_msgs div[data-type="1"][data-messageid="' + messageObj.id + '"]').empty().append('\
                        <div class="msg_box" oncontextmenu="ezchatActionC.actionContextMenu(this,event);">\n\
                            <div class="chat_name"> <span class="chat_time">' + convertOnlyTimeFromSqlToUsa(time, false) + '</span></div>\n\
                             <span class="chat_msg">' + message + '</span>\n\
                             ' + msgOpts + '\n\
                        </div>');
                return 0;
            } else if (messageObj.type == 8) {
                var obj = jQuery.parseJSON(message);
                message = '<div class="location" data-long="' + obj.long + '" data-lat="' + obj.lat + '" onclick="ezchatActionC.actionInitLocation(this);">\n\
                                <img src="' + MAIN_LINK + '/dash/assets/img/location_marker.png">\n\
                                <div class="loc_name">' + obj.locationName + '</div>\n\
                            </div>';
            } else if (messageObj.type == 7) {
                var obj = jQuery.parseJSON(message);

                var thumbUrl = obj.thumb;
                var userName = obj.login;
                var email = obj.email;
                var userId = obj.id;

                if (thumbUrl) {
                    thumbUrl = thumbUrl;
                } else {
                    thumbUrl = '/dash/assets/img/personal.png';
                }

                message = '<div class="send_contact" data-userid = "' + userId + '" onclick="ezchatActionC.actionSendContact();"><img src="' + thumbUrl + '" alt="thumb" /><div class="con_name">' + userName + '</div><div class="con_email">' + email + '</div></div>';
            }
            message = message.replace(/\r\n|\r|\n/g, "<br />");
            for (var x = 1; x < 10; x++) {
                message = message.split('[[' + x + ']]').join('<img data-smile="' + x + '" class="smile" src="' + MAIN_LINK + '/dash/assets/img/smiles/sm' + x + '.png" alt="smile">');
            }
            var needDown = false;
            var elem = $("#chat_msgs");
            if (elem[0].scrollHeight - elem.scrollTop() == elem.outerHeight()) {
                needDown = true;
            }

            if ('preview' in messageObj)
            {
                preview = previewInfo = self.getLinkPreviewInfo(messageObj.preview, 1);
            }

            var userLoginText = '';
            /*if (chat.type == 1)
            {
                userLoginText = userlogin != '' ? userlogin + ', ' : '';
            }*/

            $('#chat_msgs div[data-type="1"][data-messageid="' + messageObj.id + '"]').empty().append('\
                    <div class="msg_box" oncontextmenu="ezchatActionC.actionContextMenu(this,event);">\n\
                        <span class="chat_msg">' + message + '</span>\n\
                        ' + preview + '\n\
                        ' + msgOpts + '\n\
                    </div>\n\
                    <div class="chat_time">' + userLoginText + convertOnlyTimeFromSqlToUsa(time) + '</div>');
            
            ezchatActionC.convert();
            
            /*c(messageText);
            $('#chat_msgs div[data-type="1"][data-messageid="' + messageObj.id + '"] .msg_box .chat_msg:last').each(function ()
            {
                var output = emojione.toImage(messageText);
                $(this).html(output);
            });
            $('#audio').show();
            $('#sendLocation').show();
            $('#add_file').show();*/
        } else
        {
            quickChatC.updateQuickChatsContactList();
            $('#oneQuickChatRoom[data-chatid = "' + messageObj.chatId + '"] .oneQuickChatMessageBox[data-messageid="' + messageObj.id + '"] .quickChatUserMessage').html(emojione.toImage(messageText));
        }
    }
    //chat
    self.updateLastReadMesHandler = function (response) {
        var countChatNotReadMessages = 0,
                title = document.title;

        for (var i = 0, len = self.chats.length; i < len; i++) {
            if (self.chats[i].id == response.data.chatId) {
                self.chats[i].notReadMes = 0;
            }
        }
        if (window.location.pathname === '/dash/ezchat/' || window.location.pathname === "/social/ezchat/") {
            countChatNotReadMessages = $('div.one_box2[data-chat="' + response.data.chatId + '"]').attr('data-newmes');
            $('div.one_box2[data-chat="' + response.data.chatId + '"]').attr('data-newmes', '0');
            $('div.one_box2[data-chat="' + response.data.chatId + '"]').find("#countmes").text("").removeClass('countmes');
        } else {
            countChatNotReadMessages = $('.oneQuickChatBoxContactList[id="' + response.data.chatId + '"]').attr('data-newmes');
            quickChatC.updateQuickChatsContactList();
        }
        self.countAllNotReadEzchatMessage = parseInt(self.countAllNotReadEzchatMessage) - parseInt(countChatNotReadMessages);
        title = title.slice(title.indexOf(')') + 1);
        if (self.countAllNotReadEzchatMessage <= 0 || isNaN(self.countAllNotReadEzchatMessage)) {
            $('#countMes').text('').removeClass('countMes');
            document.title = title;
        } else {
            $('#countMes').text(self.countAllNotReadEzchatMessage);
            if (isNaN(self.countAllNotReadEzchatMessage)) {
                self.countAllNotReadEzchatMessage = 0;
            }
            document.title = '(' + self.countAllNotReadEzchatMessage + ') ' + title;
        }
    }
    //chat
    self.updateStatusHandler = function (response)
    {
        var chatId = response.data.chatId,
                newStatus = response.data.newStatus,
                leftChatAt = response.data.leftChatAt,
                curUserStatus = response.data.curUserStatus;

        if (curUserStatus)
        {
            $('span.rezult').removeClass().addClass('rezult');
            switch (curUserStatus)
            {
                case 1:
                    window.location.pathname == "/dash/ezchat/" ? $('.rezult').addClass('online') : $('.rezult').html("<i class=\"fa fa-check\" aria-hidden=\"true\"></i>").addClass('online');
                    break;
                case 2:
                    window.location.pathname == "/dash/ezchat/" ? $('.rezult').addClass('away') : $('.rezult').html("<i class=\"fa fa-check\" aria-hidden=\"true\"></i>").addClass('away');
                    break;
                case 3:
                    window.location.pathname == "/dash/ezchat/" ? $('.rezult').addClass('not_disturb') : $('.rezult').html("<i class=\"fa fa-check\" aria-hidden=\"true\"></i>").addClass('not_disturb');
                    break;
                case 4:
                    window.location.pathname == "/dash/ezchat/" ? $('.rezult').addClass('invisiblee') : $('.rezult').html("<i class=\"fa fa-check\" aria-hidden=\"true\"></i>").addClass('invisiblee');
                    break;
            }
            self.curUserStatus = curUserStatus;
            return false;
        }
        self.chatsUsersStatus[chatId] = newStatus;
        self.chats.some((chat, i) =>
        {
            if (chat.id === chatId)
            {
                self.chats[i].chatStatus = newStatus;
                self.chats[i].lastVisit = leftChatAt;
                return true;
            }
        });
        $('div.one_box2[data-chat="' + chatId + '"]').find("#status").removeClass();
        switch (newStatus)
        {
            case 0:
                $('div.one_box2[data-chat="' + chatId + '"]').find("#status").addClass('offline');
                $('#oneQuickChatRoom[data-chatid = "' + chatId + '"] .quickChatUserStatus').removeClass().text('').addClass('offline quickChatUserStatus');
                $('div.one_box2[data-chat="' + chatId + '"]').attr('data-lastVisit', leftChatAt);
                if ($('div.one_box2[data-chat="' + chatId + '"]').hasClass('active'))
                {
                    $("#lastVisit").text("Last online: " + toDate(leftChatAt) + " " + toTime(leftChatAt));
                }
                break;
            case 1:
                $('div.one_box2[data-chat="' + chatId + '"]').find("#status").addClass('online');
                $('#oneQuickChatRoom[data-chatid = "' + chatId + '"] .quickChatUserStatus').removeClass().addClass('online quickChatUserStatus');
                if ($('div.one_box2[data-chat="' + chatId + '"]').hasClass('active'))
                {
                    $("#lastVisit").text("");
                }
                break;
            case 2:
                $('div.one_box2[data-chat="' + chatId + '"]').find("#status").addClass('away');
                $('#oneQuickChatRoom[data-chatid = "' + chatId + '"] .quickChatUserStatus').removeClass().addClass('away quickChatUserStatus');
                if ($('div.one_box2[data-chat="' + chatId + '"]').hasClass('active'))
                {
                    $("#lastVisit").text("");
                }
                break;
            case 3:
                $('div.one_box2[data-chat="' + chatId + '"]').find("#status").addClass('not_disturb');
                $('#oneQuickChatRoom[data-chatid = "' + chatId + '"] .quickChatUserStatus').removeClass().addClass('not_disturb quickChatUserStatus');
                if ($('div.one_box2[data-chat="' + chatId + '"]').hasClass('active'))
                {
                    $("#lastVisit").text("");
                }
                break;
            case 4:
                $('div.one_box2[data-chat="' + chatId + '"]').find("#status").text("").addClass('offline');
                $('#oneQuickChatRoom[data-chatid = "' + chatId + '"] .quickChatUserStatus').removeClass().addClass('offline quickChatUserStatus');
                $('div.one_box2[data-chat="' + chatId + '"]').attr('data-lastVisit', leftChatAt);
                if ($('div.one_box2[data-chat="' + chatId + '"]').hasClass('active'))
                {
                    $("#lastVisit").text("Last online: " + toDate(leftChatAt) + " " + toTime(leftChatAt));
                }
                break;
        }
        quickChatC.updateQuickChatsContactList();
    }
    //chat
    self.sendMessageHandler = function (response) {
        if (response.code != 000) {
            if (window.location.pathname == "/dash/ezchat/" || window.location.pathname === "/social/ezchat/") {
                $('#chat_msgs').append('<div data-type="9" class="chat_one_msg system error" data-time="">\n\
					<div class="msg_box">\n\
						<span class="chat_msg">' + response.message + '</span>\n\
					</div>\n\
				</div>');
                $("#chat_msgs").scrollTop($("#chat_msgs")[0].scrollHeight);
            } else {
                $('#oneQuickChatRoomMessageBox').append('<div class="oneQuickChatMessageBox quickChatSystemMessage quickChatSystemMessageDateTime system error">\n\
					<div class = "quickChatUserMessage">' + response.message + '</div>\n\
				</div>');
                $('#oneQuickChatRoomMessageBox').scrollTop($("#oneQuickChatRoomMessageBox")[0].scrollHeight);
            }
        }
        var message = response.data,
                title = document.title;
        chat = [];
        $.each(self.chats, function (key, chatN) {
            if (chatN.id == message.chatId) {
                chat = chatN;
                chat.chat_messages.push(message);
                chat.lastUpdate = message.dateTime;
                if (message.userId != curUserId && !ezchatActionC.onPage && chatN.type != 2) {
                    var audio = new Audio('/dash/assets/audio/beep-07.wav');
                    var vol = getCookie('supportVolume') == '' ? 15 : getCookie('supportVolume');
                    audio.volume = 0.2 * vol / 15;
                    audio.play();
                }
                if (window.location.pathname == "/dash/ezchat/" || window.location.pathname === "/social/ezchat/") {
                    if ($("div.one_box2.active").attr('data-chat') == chatN.id) {
                        if (message.userId != curUserId) {
                            var data = {
                                action: 'updateLastReadMes',
                                data: {
                                    lastMes: message.id,
                                    chatId: message.chatId
                                }
                            };
                            send(data);
                            c("updateLastReadMes");
                        }
                    } else {
                        if (message.userId != curUserId && chatN.type != 2) {
                            chat.notReadMes++;
                            $('div.one_box2[data-chat="' + chatN.id + '"]').attr('data-newmes', chat.notReadMes);
                            $('div.one_box2[data-chat="' + chatN.id + '"]').find("#countmes").text(response.newMes).addClass('countmes');
                            self.countAllNotReadEzchatMessage > 0 ? $('#countMes').text(self.countAllNotReadEzchatMessage + 1) : $('#countMes').text(1).addClass('countMes');
                            self.countAllNotReadEzchatMessage++;
                            title = title.slice(title.indexOf(')') + 1);
                            if (isNaN(self.countAllNotReadEzchatMessage)) {
                                self.countAllNotReadEzchatMessage = 0;
                            }
                            document.title = '(' + self.countAllNotReadEzchatMessage + ') ' + title;
                        }
                    }
                    ezchatActionC.addMessage(message, chat);
                    ezchatActionC.orderChats();
                    $('#add_file').prop("disabled", false);
                } else {
                    c('quick chat');
                    c(message);
                    if ($('#oneQuickChatRoom').attr('data-chatid') == message.chatId) {
                        c('chatId true');
                        $('#oneQuickChatRoomMessageBox').append(quickChatC.getOneQuickChatRoomMessages([message], 1));
                        if (message.userId != curUserId) {
                            var data = {
                                action: 'updateLastReadMes',
                                data: {
                                    lastMes: message.id,
                                    chatId: message.chatId
                                }
                            };
                            send(data);
                            c("updateLastReadMes");
                            $('#oneQuickChatRoomMessageBox').scrollTop($("#oneQuickChatRoomMessageBox")[0].scrollHeight);
                        } else {
                            $('#oneQuickChatRoomMessageBox').scrollTop($("#oneQuickChatRoomMessageBox")[0].scrollHeight);
                        }
                    } else {
                        if (message.userId != curUserId && chatN.type != 2) {
                            chat.notReadMes++;
                            self.countAllNotReadEzchatMessage > 0 ? $('#countMes').text(self.countAllNotReadEzchatMessage + 1) : $('#countMes').text(1).addClass('countMes');
                            self.countAllNotReadEzchatMessage++;
                            title = title.slice(title.indexOf(')') + 1);
                            if (isNaN(self.countAllNotReadEzchatMessage)) {
                                self.countAllNotReadEzchatMessage = 0;
                            }
                            document.title = '(' + self.countAllNotReadEzchatMessage + ') ' + title;
                        }
                    }
                    quickChatC.updateQuickChatsContactList();
                }
            }
        });
    }
    //chat
    self.deleteMessageHandler = function (response) {
        var chatId = response.data.chatId;
        var msgId = response.data.msgId;
        $.each(self.chats, function (key, chatN) {
            if (chatN.id == chatId) {
                chatN.chat_messages = $.grep(chatN.chat_messages, function (messsageN, key2) {
                    if (messsageN.id == msgId) {
                        return false;
                    }
                    return true;
                })
            }
        });
        if (window.location.pathname === '/dash/ezchat/' || window.location.pathname === "/social/ezchat/")
        {
            $('.chat_one_msg[data-messageid="' + msgId + '"]').remove();
        } else
        {
            quickChatC.updateQuickChatsContactList();
            $('#oneQuickChatRoom[data-chatid = "' + chatId + '"] .oneQuickChatMessageBox[data-messageid="' + msgId + '"]').remove();
        }
    }
    //chat
    self.inviteUserToGroupHandler = function (response)
    {
        if (response.data.curUser)
        {
            $("#chat_msgs").scrollTop($("#chat_msgs")[0].scrollHeight);
            return false;
        }
        if (response.data.updateChatUsers)
        {
            var newUsers = response.data.chatUsers,
                    chatId = response.data.chatId;

            for (var i = 0, len = self.chats.length; i < len; i++)
            {
                if (self.chats[i].id == chatId)
                {
                    for (var j = 0, lenJ = newUsers.length; j < lenJ; j++)
                    {
                        self.chats[i].chat_users.push(newUsers[j]);
                    }
                    return false;
                }
            }
            return false;
        }
        var chat = response.data.room;
        chat.notReadMes = 1;
        self.chats.push(chat);
        if (window.location.pathname === '/dash/ezchat/' || window.location.pathname === "/social/ezchat/")
        {
            self.setContactRoomBox(chat);
            ezchatActionC.orderChats();
        } else
        {
            quickChatC.updateQuickChatsContactList();
        }
    }
}
var isCtrl = false;
$().ready(function () {
    var maxFileSize = 10000000; // максимальный размер файла - 10 мб.

    $("body").on("dragover", '#supportChats .messages_box_actions', function (event) {
        event.preventDefault();
        event.stopPropagation();
    });

    $("body").on("dragleave", '#supportChats .messages_box_actions', function (event) {
        event.preventDefault();
        event.stopPropagation();
    });

    $("body").on("drop", '#supportChats .messages_box_actions', function (event) {
        event.preventDefault();
        event.stopPropagation();
        var progressFile = $('#supportChats .support_messages_box');
        progressFile.find('.error').remove();

        var file = event.originalEvent.dataTransfer.files[0];

        if (file.size > maxFileSize) {
            progressFile.append(`<p class="error">File is more than 10 mb</p>`);
            return false;
        }

        var fileType = 0;
        if (file.type.includes("image")) {
            fileType = 1;
        } else if (file.type.includes("video")) {
            fileType = 2
        } else if (file.type.includes("audio")) {
            fileType = 3;
        } else if (file.type.includes("pdf")) {

        } else if (file.type.includes("text")) {

        } else if (file.type.includes("officedocument")) {

        } else if (file.type.includes("msword")) {

        } else {
            progressFile.append(`<p class="error">The file is not a valid format</p>`);
            return false;
        }

        progressFile.append(`<p class="upload">Progress load file: <span></span></p>`);

        var chatId = $(this).closest('.support_chat').attr('data-id');

        var formdata = new FormData();

        formdata.append('action', 'saveFileSupportChat');
        formdata.append('chatId', chatId);
        formdata.append('fileType', fileType);
        formdata.append('files[]', file);

        var xhr = new XMLHttpRequest();
        0
        // обработчик для закачки
        xhr.upload.onprogress = function (event) {
            var persent = event.loaded / event.total * 100;
            progressFile.find('.upload span').text(persent + '%');
        }
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                progressFile.find('.upload').remove();
                var response = jQuery.parseJSON(xhr.response);
                sendSupportMessageFile(chatId, response.data.url, response.data.fileType);
            }
        }
        xhr.open("POST", MAIN_LINK + '/db/socialUpload/', true);
        xhr.send(formdata);
    });
    $(document).keyup(function (e) {
        if (e.which == 17)
            isCtrl = false;
    }).keydown(function (e) {
        if (e.which == 17)
            isCtrl = true;
    });
});
/* Start */
(function ($) {
    $.fn.escapeHtml = function () {
        var ua = navigator.userAgent;
        var re = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
        var e = document.createElement("div"),
                s = '';
        $(e).text($(this).val() || $(this).html() || $(this).text());
        s = $(e).text();
        if (re.exec(ua) != null) {
            $(e).remove();
        } else {
            e.remove();
        }
        return s.replace(/<\/?([a-z][a-z0-9]*)\b[^>]*>?/gi, '');
    };
})(jQuery);
/* End */
function closeChat(el) {
    $(el).closest('.support_chat').toggleClass('minimise');
}
function checkIfSend(el, event) {
    if (event.which === 13) {
        if (isCtrl) {
            c('ctrl');
            var v = $(el).val();
            c(v);
            $(el).val(v + '\n');
        } else {
            sendSupportMessage(el);
        }
    }
}
function sendSupportMessage(el) {
    var message = $(el).escapeHtml();
    if ($.trim(message) != '') {
        var chatId = $(el).closest('.support_chat').attr('data-id');
        var data = {
            action: 'sendSupportMessage',
            data: {
                chatId: chatId,
                message: message
            }
        };
        send(data);
    }
    $(el).val('');
}
function sendSupportMessageFile(chatId, url, fileType) {
    var message = '';
    if (fileType == 0) {
        message = `<a href="${url}" download>Download File</a>`;
    } else if (fileType == 1) {
        message = `<a href="${url}" download><img class="sup-img" src="${url}" alt="" title="" /></a>`;
    } else if (fileType == 2) {
        message = `<video controls><source src="${url}"></video>`;
    } else if (fileType == 3) {
        message = `<audio controls><source src="${url}"></audio>`;
    }
    var data = {
        action: 'sendSupportMessage',
        data: {
            chatId: chatId,
            message: message
        }
    };
    send(data);
}
function leaveChat(el) {
    var chatId = $(el).closest('.support_chat').attr('data-id');
    var data = {
        action: 'finishSupportChat',
        data: {
            chatId: chatId
        }
    };
    send(data);
    $(el).closest('.support_chat').remove();
}

function fillEzchatCanInvite() {
    if (dcc.allReadyLogin === 1) {
        $('.can_invite .list').empty();
        if (dcc.chats && dcc.chats.length > 0) {
            for (var x = 0; x < dcc.chats.length; x++) {
                if (dcc.chats[x].type == 0) {
                    dcc.setCanInviteList(dcc.chats[x]);
                }
            }
        }
    }
}
function fillEzchatPage()
{
    if (dcc.allReadyLogin === 1)
    {
        $('#messages_box').empty();
        $('#userphoto').show();

        clearInterval(ezchatActionC.fillEzchatPageInterval);
        dcc.setupUserInfo();

        switch (dcc.curUserStatus)
        {
            case 1:
                $('.rezult').addClass('online');
                break;
            case 2:
                $('.rezult').addClass('away');
                break;
            case 3:
                $('.rezult').addClass('not_disturb');
                break;
            case 4:
                $('.rezult').addClass('invisiblee');
                break;
        }
        $('.can_invite .list').empty();
        if (dcc.chats && dcc.chats.length > 0)
        {
            for (var x = 0; x < dcc.chats.length; x++) {
                if (dcc.chats[x].type == 0) {//personal chat
                    dcc.setPersonalChat(dcc.chats[x]);
                } else {//room
                    dcc.setContactRoomBox(dcc.chats[x]);
                }
            }

            ezchatActionC.orderChats();

            var chats = dcc.chatsUsersStatus;
            for (var key in chats)
            {
                $('div.one_box2[data-chat="' + key + '"]').find("#status").removeClass();
                switch (chats[key])
                {
                    case - 1:
                        $('div.one_box2[data-chat="' + key + '"]').find("#status").addClass('offline');
                        break;
                    case 0:
                        $('div.one_box2[data-chat="' + key + '"]').find("#status").addClass('offline');
                        break;
                    case 1:
                        $('div.one_box2[data-chat="' + key + '"]').find("#status").addClass('online');
                        break;
                    case 2:
                        $('div.one_box2[data-chat="' + key + '"]').find("#status").addClass('away');
                        break;
                    case 3:
                        $('div.one_box2[data-chat="' + key + '"]').find("#status").addClass('not_disturb');
                        break;
                    case 4:
                        $('div.one_box2[data-chat="' + key + '"]').find("#status").addClass('offline');
                        break;
                }
            }
        }
        $('#gifBox').fadeOut(500);
    }
}