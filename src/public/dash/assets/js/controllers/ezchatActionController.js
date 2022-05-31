function ezchatActionController() {
    var self = this;

    self.fillEzchatPageInterval = 0;

    self.toggleMobile = function () {
        $('#section_1 .right_sec').toggleClass('display');
        self.changeCaret();
    }
    self.changeCaret = function () {
        var $mobToggle = $('#section_1 .right_sec #mob_toggle');
        if ($('#section_1 .right_sec').hasClass('display')) {
            $mobToggle.find('i').attr('class', 'fa fa-caret-right');
        } else {
            $mobToggle.find('i').attr('class', 'fa fa-caret-left');
        }
    }
    self.convert = function (smile = {}) {
        if (smile.length > 0) {//отправить смайл в чате
            var output = emojione.toImage($(smile).attr("title")),
                    textInInput = $('#input_field').html() ? $('#input_field').html() + ' ' : '';
            $('#input_field').html(textInInput + output + ' ');
        } else {//конвертировать в смайл в сообщениях чата
            $('#chat_msgs div[data-type="1"] .msg_box .chat_msg:last').each(function () {
                var output = emojione.toImage($(this).text());
                if (output.indexOf('class="emojione"') < 0) {
                    return false;//проверка повторного конвертирования смайла
                }
                $(this).html(output);
            });
    }
    }

    self.ping = function () {
        var data = {
            action: 'ping',
            data: {}
        };
        send(data);
    }

    //create room function
    self.createRoom = function () {
        $('.create_group_box .create_errors').css({'border': 'none'}).text('');
        var roomName = $('#room_name').val().replace(/(<([^>]+)>)/ig, "");
        c(roomName);
        if (roomName == '') {
            $('.create_group_box .create_errors').css({'border': '1px solid #f44336'}).text('Please enter chat name')
            return false;
        }
        var t = Math.floor(Date.now() / 1000);
        usersToInvite = [];
        $('.can_invite.on_create .chosen_invite').each(function () {
            usersToInvite.push({'userId': $(this).attr('data-id')});
            $(this).removeClass('chosen_invite').hide();
        });
        var data = {
            action: 'createChat',
            data: {
                chatName: roomName,
                type: 1,
                chatUsers: usersToInvite
            }
        };
        send(data);
        $('#createGroupChatPopap').find('.close').click();
    }

    //function to find user by email 
    self.findUsersByEmail = function () {
        var email = $('.find_user_email').val();
        $('.find_result').empty();
        if (email) {
            var data = {
                action: 'findUsersByEmail',
                data: {
                    email: email
                }
            };
            send(data);
        }
    }

    //send invitation to user by email
    self.inviteUser = function (el) {
        $('.find_errors').empty();
        $("#addContact").hide();
        var userId = el.attr('data-id');
        if ((curUserId != userId)) {
            var data = {
                action: 'createChat',
                data: {
                    chatName: '',
                    type: 0,
                    chatUsers: [{userId: userId}]
                }
            };
            send(data);
        } else {
            $('.find_errors').text('You cant invite yourself');
        }
    }

    self.unBan = function (userId) {
        var chatId = $('div.one_box2.active').attr('data-chat');
        var data = {
            action: 'unBan',
            data: {
                userId: userId,
                chatId: chatId
            }
        };
        send(data);
    }

    self.getBanList = function () {
        if ($('#join_public_chat #bans_list').length > 0) {
            $('#join_public_chat #bans_list').remove();
            return false;
        }
        var chatId = $('div.one_box2.active').attr('data-chat');
        var data = {
            action: 'getBanList',
            data: {
                chatId: chatId
            }
        };
        send(data);
    }

    self.leavePublicChat = function () {
        var chatId = window.location.pathname === "/dash/ezchat/" ? $('div.one_box2.active').attr('data-chat') : $('#oneQuickChatRoom').attr('data-chatid');
        var data = {
            action: 'leavePublicChat',
            data: {
                chatId: chatId
            }
        };
        send(data);
    }

    self.joinPublicChat = function () {
        var chatId = window.location.pathname === "/dash/ezchat/" ? $('div.one_box2.active').attr('data-chat') : $('#oneQuickChatRoom').attr('data-chatid');
        var data = {
            action: 'joinPublicChat',
            data: {
                chatId: chatId
            }
        };
        send(data);
    }

    //selected chat handler
    //el - jquery pbject pointed to current chat from list
    self.needTop = false;
    self.choseChat = function (el) {//1
        c(el);
        $("#chat_el").show().removeClass('hasPrivateChatLastVisit');
        $('#userStatusChatBox').hide().removeClass();
        self.prevMessageTime = 0;
        $('.can_invite.in_room .chosen_invite').removeClass('chosen_invite');
        $('.one_box2').removeClass('active');
        $(el).addClass('active');
        var chatId = el.attr('data-chat');
        var chatType = el.attr('data-type');
        self.restoreChatBox();
        $('#chat_msgs').empty();
        $('#send').attr('data-id', chatId);
        $('.can_invite.in_room .list div').show();
        $('.can_invite.in_room').attr('data-chat', chatId).hide();
        $('#chat_el #invite_func').hide();

        var chat = [];
        var crById = '';
        var crBy = '';
        var crAt = 0;
        var chatStatus = 0;
        $.each(dcc.chats, function (key, chatN) {
            if (chatN.id == chatId) {
                crById = chatN.createdByUserId;
                chat = chatN;
                chatStatus = 'chatStatus' in chatN ? chatN.chatStatus : null;
                crAt = chatN.createdAt / 1000;
            }
        });
        $('#ban_list_button').remove();

        if (position == 11 && chat.type == 2) {
            $('#join_public_chat').append('<button class="btn btn-default" onclick="ezchatActionC.getBanList()" id="ban_list_button">Ban List</button>');
        }

        if (crById == curUserId) {
            crBy = dcc.user.login;
        } else {
            $.each(chat.chat_users, function (key, user) {
                if (user.id == crById) {
                    crBy = user.login;
                    return false;
                }
            });
            crBy = !crBy ? dcc.user.login : crBy;
        }

        var newmes = el.attr('data-newmes');

        if (newmes > 0) {
            var data = {
                action: 'updateLastReadMes',
                data: {
                    lastMes: chat.chat_messages[chat.chat_messages.length - 1].id,
                    chatId: chat.id
                }
            };
            send(data);
            c("updateLastReadMes");
        }

        if (chatType == 0 && chatStatus) {
            switch (chatStatus) {
                case 1:
                    $('#userStatusChatBox').show().addClass('online');
                    break;
                case 2:
                    $('#userStatusChatBox').show().addClass('away');
                    break;
                case 3:
                    $('#userStatusChatBox').show().addClass('not_disturb');
                    break;
            }
        }

        var createdByText = 'Created by <span class = "chatCreatedByUser">' + crBy + '</span>' + ' on ' + self.toDate(crAt);

        if (chat.type == 2) {
            createdByText = '';
        }
        $('#chat_el .chat_el-header .user-info .name').attr('title', el.find('.one_name').text());
        $('#chat_el .chat_el-header .user-info .name').text(el.find('.one_name').text().trimToLength(50));
        $('#createdBy').html(createdByText);

        var lastVisit = el.attr('data-lastVisit');

        if ((chatType == 0) && ($('div.one_box2[data-chat="' + chat.id + '"]').find("#status").hasClass('offline')) && (lastVisit)) {
            $("#lastVisit").text("Last online: " + self.toDate(lastVisit) + " " + self.toTime(lastVisit));
            $('#chat_el').addClass('hasPrivateChatLastVisit');
        } else {
            $("#lastVisit").text("");
        }

        $('#chat_box .chat_el-header .avatar img').remove();
        $('#chat_box .chat_el-header .avatar').append('<img src="' + el.find('img').attr('src') + '" onclick="ezchatActionC.actionChatInfo(this);">');

        if (chatType == 1 || chatType == 3) {//chat room, add invitation button
            if (chatType == 1) {
                $('#invite_func').show();
            }
            $.each(chat.chat_users, function (key, user) {
                $('.can_invite.in_room .list div[data-id="' + user.id + '"]').hide();
            });
            $('#invite_to_chat').show();
            $('#chat_box .chat_el-header .avatar img').attr('data-type', 1);
            if (chat.type == 2) {
                $('#ezchatRoomParticipants').text('');
            } else {
                $('#ezchatRoomParticipants').text(' | ' + (chat.chat_users.length) + ' members');
            }
        } else {
            $('#ezchatRoomParticipants').text('');
        }

        var chatInfo = dcc.getChatById(chatId);
        c('chatType ' + chatType);
        c(chatInfo);
        if (chatInfo.type == 2) {
            $('#join_public_chat').show();
            $('#invite_func').hide();
            if (chatInfo.user_chat_status == 1) {//user joined
                $('#joinPublicChatBut').hide();
                $('#leavePublicChatBut').show();
            } else {
                $('#joinPublicChatBut').show();
                $('#leavePublicChatBut').hide();
            }
        } else {
//        $('#invite_func').show();
            $('#join_public_chat').hide();
        }

        $('#chat_box .chat_el-header .avatar img').attr('data-id', chatId);
        $('#file_upload').attr('data-id', chatId);
        $('#chat_info_block').show();

        $.each(chat.chat_messages, function (key, message) {
            self.addMessage(message, chat);
        });

        if (self.needTop) {
            c("scrolTop")
            $("#chat_msgs").scrollTop(1);
            self.needTop = false;
        } else {
            c("scrolDown");
            $("#chat_msgs").scrollTop($("#chat_msgs")[0].scrollHeight);
        }

        if (self.anchor) {
            var anchorMes = $('.chat_one_msg[data-time="' + self.anchor + '"]').offset();
            if (anchorMes) {
                if (anchorMes.top < 0) {
                    $("#chat_msgs").scrollTop($("#chat_msgs")[0].scrollHeight);
                }
                $("#chat_msgs").scrollTop(anchorMes.top - 326 + 180);
            }
            anchorMes = self.anchor = 0;
        } else {
            $("#chat_msgs").scrollTop($("#chat_msgs")[0].scrollHeight);
        }

        if ($("#chat_msgs").scrollTop() == 0 && !$('.one_box2[data-chat="' + chatId + '"]').hasClass('loaded')) {
            c('getMoreMessages1');
            c($('#chat_msgs').children().first().text());
            c($('#chat_msgs').children().first().attr('data-time'));
            self.getMoreMessages(chatId, $('#chat_msgs').children().first().attr('data-time'));
        }

        if (!el.attr("choosed")) {
            $("#chat_msgs").scrollTop($("#chat_msgs")[0].scrollHeight);
            el.attr("choosed", "1");
            self.anchor = 0;
        }
    }

    self.gettingMore = false;
    self.anchor;

    self.getMoreMessages = function (chatId, time) {
        c('getMoreMessages');
        self.anchor = time;
        c('Anchor: ' + self.anchor);
        $('#chat_msgs').prepend('<div id="loading_gif"><img src="' + MAIN_LINK + '/dash/assets/img/loading.gif" alt="loading"/></div>');
        var data = {
            action: 'getMoreMessages',
            data: {
                chatId: chatId,
                time: time
            }
        };
        self.gettingMore = true;
        send(data);
    }
    //add message to view
    self.prevMessageTime = 0;
    self.timeOffset = -new Date().getTimezoneOffset() * 60 * 1000;//?
    self.s = 0;
    self.onPage = true;
    window.onblur = function () {
        self.onPage = false;
    }
    window.onload = window.onfocus = function () {
        self.onPage = true;
    }
    self.addMessage = function (messageObj, chat) {
        if (!$(".one_box2").hasClass('active') || ($("div.one_box2.active").attr('data-chat') != chat.id)) {
            return false;
        }
        var timeOffset = -new Date().getTimezoneOffset() * 60 * 1000;
        var message = messageObj.message;
        var awsLink = false;
        if (messageObj.awsLink != null || messageObj.awsLink != '' || typeof messageObj.awsLink != 'undefined') {
            awsLink = messageObj.awsLink;
        }
        var userId = messageObj.userId;
        self.s = messageObj.dateTime;
        var timeSec = parseInt(messageObj.dateTime) + timeOffset;
        var time = self.toTime(timeSec / 1000);
        var date = self.toDate(timeSec / 1000);

        var date2 = self.toDate(self.prevMessageTime);
        if (date != date2) {
            $('#chat_msgs').append('<div data-type="9" class="chat_one_msg system newDate" data-time="' + timeSec + '">\n\
				<div class="msg_box" oncontextmenu="ezchatActionC.actionContextMenu(this,event);">\n\
					<div class="chat_name"> <span class="chat_time">' + date + '</span></div>\n\
				</div>\n\
			</div>');
        }
        self.prevMessageTime = timeSec / 1000;
        var messageId = messageObj.id;
        var to = '';
        var img = '';
        var msgOpts = '';
        var userlogin = '';
//        var downloadIcon = '';
//        var messageControlIcon = '';
        var preview = '';

        if (userId != curUserId) {
            to = 'to';
            for (var i = 0; i < chat.chat_users.length; i++) {
                if (chat.chat_users[i].id == userId) {
                    if (chat.chat_users[i].thumb) {
                        img = '<img class="message_thumb" src="' + filesLink + chat.chat_users[i].thumb + '" alt="thumb" />';
                    } else {
                        img = '<img class="message_thumb" src="' + MAIN_LINK + '/dash/assets/img/personal.png" alt="thumb" />';
                    }
                    userlogin = chat.chat_users[i].login;
                    break;
                }
            }
            if (!userlogin) {
                userlogin = "User has left";
                $('div.one_box2[data-chat="' + chat.id + '"] #status').hide();
            }
            if (position == 11) {
                msgOpts = '<ul class="custom-menu">\n\
				<li class="ban_user" onclick="ezchatActionC.actionBanUser(this);">Ban User</li>\n\
				<li class="delete_message" onclick="ezchatActionC.actionDeleteMessage(this);">Delete</li>\n\
            </ul>';
            } else if (messageObj.type == 1) {
                msgOpts = '<ul class="custom-menu">\n\
				<li class="quote_message" onclick="ezchatActionC.actionQuoteMessage(this);">Quote</li>\n\
            </ul>';
            } else if (messageObj.type == 2 || messageObj.type == 3 || messageObj.type == 4 || messageObj.type == 5) {
                msgOpts = '<ul class="custom-menu">\n\
                <li class="download_message" onclick="ezchatActionC.actionDownloadMessage(this);">Download</li>\n\
            </ul>';
            }
        } else {
            if (messageObj.type == 1) {
                msgOpts = '<ul class="custom-menu">\n\
				<li class="quote_message" onclick="ezchatActionC.actionQuoteMessage(this);">Quote</li>\n\
                <li class="delete_message" onclick="ezchatActionC.actionDeleteMessage(this);">Delete</li>\n\
                <li class="edit_message" onclick="ezchatActionC.actionEditMessage(this);">Edit</li>\n\
            </ul>';

//                messageControlIcon = '<div class="messageControlIcon">\n\
//				<div class="ezchatRemoveMessageIcon"><i class="fa fa-times" aria-hidden="true"></i><span class="ezchatRemoveMessageIconHint">Delete</span></div>\n\
//				<div class="ezchatEditMessageIcon"><i class="fa fa-pencil-square-o" aria-hidden="true"></i><span class="ezchatEditMessageIconHint">Edit</span></div>\n\
//			<div>';
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
        if (messageObj.type == 2) {
            attachmentMessageControlIcon = '';//'<div class="messageControlIcon"><div class="ezchatRemoveMessageIcon"><i class="fa fa-times" aria-hidden="true"></i><span class="ezchatRemoveMessageIconHint">Delete</span></div><div class="ezchatDownloadIcon"><i class="fa fa-cloud-download" aria-hidden="true"></i></div></div>';
            message = '<a class="get_doc downloadMes" data-src="' + (awsLink ? awsLink : filesLink + message) + '" download>' + attachmentMessageControlIcon + '<img src="' + (awsLink ? awsLink : filesLink + message) + '" alt="messageImage" class="messsage_image undeployedImg" onclick="ezchatActionC.actionMessageImage(this);" /></a>';
        } else if (messageObj.type == 3) {
            attachmentMessageControlIcon = '';//'<div class="messageControlIcon"><div class="ezchatRemoveMessageIcon"><i class="fa fa-times" aria-hidden="true"></i><span class="ezchatRemoveMessageIconHint">Delete</span></div><div class="ezchatDownloadIcon"><i class="fa fa-cloud-download" aria-hidden="true"></i></div></div>';
            message = '<div class = "playVideoButton" onclick="ezchatActionC.playVideo(this);"></div><a class="get_doc downloadMes" data-src="' + (awsLink ? awsLink : filesLink + message) + '" download>' + attachmentMessageControlIcon + '<video class="undeployedVideo"><source src="' + (awsLink ? awsLink : filesLink + message) + '"></video></a>';
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
            $('#chat_msgs').append('<div data-type="9" class="chat_one_msg system" data-time="' + timeSec + '" data-messageId="' + messageId + '">\n\
				<div class="msg_box" oncontextmenu="ezchatActionC.actionContextMenu(this,event);">\n\
					<div class="chat_name"> <span class="chat_time">' + convertOnlyTimeFromSqlToUsa(time, false) + '</span></div>\n\
					 <span class="chat_msg">' + message + '</span>\n\
					 ' + msgOpts + '\n\
				</div>\n\
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

            message = '<div class="send_contact" data-userid = "' + userId + '" onclick="ezchatActionC.actionSendContact(this);"><img src="' + thumbUrl + '" alt="thumb" /><div class="con_name">' + userName + '</div><div class="con_email">' + email + '</div></div>';
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
        if (chat.type == 1)
        {
            userLoginText = userlogin != '' ? userlogin + ', ' : '';
        }

        $('#chat_msgs').append('<div data-type="' + messageObj.type + '" data-timereal="' + parseInt(messageObj.dateTime) + '" data-time="' + timeSec + '" data-user="' + userId + '" class="chat_one_msg ' + to + '" data-messageId="' + messageId + '">' + img + '\n\
        <div class="msg_box" oncontextmenu="ezchatActionC.actionContextMenu(this,event);">\n\
            <span class="chat_msg">' + message + '</span>\n\
            ' + preview + '\n\
            ' + msgOpts + '\n\
        </div>\n\
        <div class="chat_time">' + userLoginText + convertOnlyTimeFromSqlToUsa(time) + '</div>\n\
    </div>');
        if (messageObj.size && messageObj.type == 2) {
            var weigthReal = messageObj.size[0],
                    heightReal = messageObj.size[1],
                    proportion = weigthReal / 200,
                    heightChat = heightReal / proportion;
            if (heightReal > 200)
            {
                $('#chat_msgs div.msg_box:last').css({'min-height': heightChat + 20});
            } else
            {
                $('#chat_msgs div.msg_box:last').css({'min-height': heightReal});
            }
        }
        if (messageObj.type == 4) {
            $('#chat_msgs div.msg_box:last').css({'min-height': 39});
        }
        if (messageObj.type == 5) {
            $('#chat_msgs div.msg_box:last').css({'min-height': 56});
        }
        if (messageObj.userId == curUserId || needDown) {
            $("#chat_msgs").scrollTop($("#chat_msgs")[0].scrollHeight);
        }
        self.convert();
    }

    self.messageFile;

    //function to send the file as message
    self.sendFile = function (chat, chatId, src, type) {
        $('#current_upload').css('width', 0);
        $('#current_uploadPersent').text('0%').css('margin-left', '0');
        $('#upload_line').show();
        $('#cancel_image').hide();
        data = {
            data: {
                session: getCookie('session'),
                action: 'sendChatFile',
                bytesArray: src,
                name: self.messageFile,
                chatId: chatId
            }};
        $.ajax({
            url: dashControllerUrl + '?' + window.location.search.substring(1),
            method: "POST",
            contentType: "application/json", // send as JSON
            data: JSON.stringify(data),
            xhr: function () {
                var xhr = $.ajaxSettings.xhr();
                xhr.upload.onprogress = function (evt)
                {
                    var persent = Math.round((evt.loaded / evt.total) * 100);
                    $('#current_upload').css('width', persent + '%');
                };
                return xhr;
            },
            success: function (data) {
                var response = jQuery.parseJSON(data);
                if (response.code == '000') {
                    var data = {
                        action: 'sendMessage',
                        data: {
                            chatId: chatId,
                            type: type,
                            chatMessage: response.data
                        }
                    };
                    send(data);
                    self.restoreChatBox();
                    $('#file-upload-chat').val('');
                    $("#chat_msgs").scrollTop($("#chat_msgs")[0].scrollHeight);
                    $('#file_upload').prop("disabled", false);
                }
            }
        });
    }

    //send message button handler
    self.findSmileObject = function () {
        for (var i = 0, length = $("#input_field").find("object").length; i < length; i++) {
            $("#input_field").find("object").first().replaceWith($("#input_field").find("object").first().attr("title"));
        }
    }

    self.saveimage = function (e1) {
//        var chatId = $('#chat_info .ch_info button').attr('data-id');
        var file = e1[0];
        var reader = new FileReader();
        if (file.type.includes("image")) {
            reader.onload = function (e) {
                $('#chat_info #main_image_holder img').attr('src', e.target.result).attr('data-new', 1).show();
            }
        } else {

        }
        reader.readAsDataURL(file);
    }

    self.playVideo = function (el) {
        var video = $(el).parents('.chat_msg').find('source');
        $('#ezchatShowFile').empty().append('<video controls><source src="' + video.attr('src') + '"></video>');
        $('#ezchatShowFile video')[0].addEventListener("loadedmetadata", function () {
            $('#ezchatAttachmentBox').show();
            $('#ezchatShowFile').css({'max-height': $(window).height() * 0.9 - 100});
            $('#ezchatShowFile').css({'height': el.videoHeight});
            $('#ezchatShowFile video')[0].play();
        }, false);
    }

    self.setInputPlaceholder = function () {
        $('#input_field').empty().append('<span class="input_pl">Write a message...</div>');
    }

    self.setCursorToEnd = function (ele) {
        ele.focus();
        var range = document.createRange();
        var sel = window.getSelection();
        range.setStart(ele, 0);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
    }

    self.sendMessage = function () {
        c('sendMessage');
        self.findSmileObject();//заменить <object> смайла на текст вида :smile:
        $('.input_pl').remove();

        var m = $('#input_field').html();
        m = m.split('<div>').join('\n');
        m = m.split('</div>').join('');
        m = m.replace(/\s{2,}/g, ' ');
        m = m.replace(/<br>/g, "\n");
        m = m.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
        m = m.replace(/&nbsp;/g, ' ');

        var smiles = $('#input_field .emojione');
        smiles.each(function () {
            var smileId = ($(this).attr('title'));
            m = m.split($(this)[0].outerHTML).join(smileId);
        });

        var chat = {name: name, message: m};
        chat.userId = curUserId;
        chat.dateTime = Math.floor(Date.now() / 1000);
        chat.type = 1;
        var chatId = $('#file_upload').attr('data-id');
        if ($('#loaded_img').is(':visible') && $('#loaded_img').attr('src') != '' && typeof self.messageFile != 'undefined') {
            c('image');
            $('#file_upload, #add_file').prop("disabled", true);
            self.sendFile(chat, chatId, $('#loaded_img').attr('src'), 2);
            return false;
        } else if ($('#loaded_video').is(':visible') && $('#loaded_video source').attr('src') != '' && typeof self.messageFile != 'undefined') {
            c('video');
            $('#file_upload, #add_file').prop("disabled", true);
            self.sendFile(chat, chatId, $('#loaded_video source').attr('src'), 3);
            return false;
        } else if ($('#loaded_audio').is(':visible') && $('#loaded_audio source').attr('src') != '' && typeof self.messageFile != 'undefined') {
            c('audio');
            $('#file_upload, #add_file').prop("disabled", true);
            self.sendFile(chat, chatId, $('#loaded_audio source').attr('src'), 5);
            return false;
        } else if ($('#loaded_doc').is(':visible') && $('#loaded_doc').text() != '' && typeof self.messageFile != 'undefined') {
            c('doc');
            $('#file_upload, #add_file').prop("disabled", true);
            self.sendFile(chat, chatId, $('#loaded_doc').attr('src'), 4);
            return false;
        }
        if (typeof chatId == 'undefined') {
            c('no chat id');
            return false;
        }
        if (m == '' || m == '<br>' || !m) {
            self.setInputPlaceholder();
            c('no message');
            return false;
        }
        //databaseRef.push().set(chat);
        //edit message
        if (typeof ($('#chat_input').attr('data-msgid')) != 'undefined' && $('#chat_input').attr('data-msgid') != '' &&
                typeof ($('#chat_input').attr('data-chatid')) != 'undefined' && $('#chat_input').attr('data-chatid') != '') {
            var data = {
                action: 'editMessage',
                data: {
                    chatId: chatId,
                    messageId: $('#chat_input').attr('data-msgid'),
                    chatMessage: emojione.shortnameToUnicode(m)
                }
            };
            send(data);
        } else {//new message
            var data = {
                action: 'sendMessage',
                data: {
                    chatId: chatId,
                    type: 1,
                    chatMessage: emojione.shortnameToUnicode(m)
                }
            };
            send(data);
        }
        $('#chat_input').removeAttr('data-msgid');
        $('#chat_input').removeAttr('data-chatid');
        self.setInputPlaceholder();
        $('#chat_input').val('');
    }

    self.inviteAllSelected = function (el) {
        var usersToInvite = [];
        var chatId = $('.one_box2.active').attr('data-chat');
        $('.can_invite.in_room .chosen_invite').each(function () {
            usersToInvite.push({'userId': $(this).attr('data-id')});
            $(this).removeClass('chosen_invite').hide();
        });
        if (usersToInvite.length != 0) {
            var data = {
                action: 'inviteUserToGroup',
                data: {
                    chatId: chatId,
                    usersToInvite: usersToInvite
                }
            };
            send(data);
            $('.can_invite.in_room').slideUp();
        }
    }

    //handler of new user thumb image chosen
    self.savemainimage = function (el) {
        var file = el[0];
        c(file);
        if (typeof file == 'undefined') {
            return false;
        }
        var reader = new FileReader();
        if (file.type.includes("image")) {
            reader.onload = function (e) {
                $('#user_info #main_image_holder img').attr('src', e.target.result).attr('data-new', 1).show();
            }
        } else {

        }
        reader.readAsDataURL(file);

    }

    self.updateUserInfo = function (newName, newThumb) {
        var data = {
            action: 'updateUserInfo',
            data: {
                newImg: newThumb,
                newName: newName
            }
        };
        send(data);
        $('#user_info #main_image_holder img').attr('data-new', 0);
    }

    //save user new chat name
    self.saveNewName = function () {
        //check if name changed
        var nameChanged = false;
        var imageChanged = false;
        var newName = $('#cur_user_name').val().trim().replace(/(<([^>]+)>)/ig, "");
        var oldName = $('#cur_user_name').attr('data-name').replace(/(<([^>]+)>)/ig, "");
        var bytesArray = '';
        if (newName == '') {
            $('#cur_user_name').val(oldName);
            newName = oldName;
        }
        if (newName != oldName) {
            c('NameChanged');
            nameChanged = true;
        }
        if ($('#user_info #main_image_holder img').attr('data-new') == 1) {
            c('ImageChanged');
            imageChanged = true;
        }
        if (!nameChanged && !imageChanged) {
            c('Here');
            return false;
        }
        if (nameChanged && !imageChanged) {
            c('Here2');
            self.updateUserInfo(newName, false);
            return false;
        }
        bytesArray = $('#user_info #main_image_holder img').attr('src');
        var data = {
            data: {
                session: getCookie('session'),
                action: 'updateUserThumb',
                bytesArray: bytesArray
            }};
        $.ajax({
            url: dashControllerUrl + '?' + window.location.search.substring(1),
            method: "POST",
            contentType: "application/json", // send as JSON
            data: JSON.stringify(data),
            success: function (data) {
                var response = jQuery.parseJSON(data);
                if (response.code == '000') {
                    var data = response.data;
                    var url = EZCHAT_LINK + data.link;
                    dcc.user.thumb = url;
                    if (typeof data.awsLink != 'undefined' && data.awsLink != '' && data.awsLink != null) {
                        url = data.awsLink;
                        dcc.user.awsThumb = url;
                    }
                    createCookie('thumb', url, 30);
                    dcc.setupUserInfo();
                    var newThumb = false;
                    if ($('#user_info #main_image_holder img').attr('data-new') == 1) {
                        newThumb = data;
                    }
                    self.updateUserInfo(newName, newThumb);
                }
            }
        });
    }

    //show send file elements
    self.updateChatBox = function () {
        $('.chat_el .input-message-block').addClass('addedFile');
        $('#cancel_image').show();
        $('#input_field').empty().attr('contenteditable', 'false');
        $('.fa.fa-smile-o ').hide();
        $('#audio').hide();
        $('#sendLocation').hide();
    }

    //restore send message box
    self.restoreChatBox = function () {
        c('restoreChatBox');
        $('.chat_el .input-message-block').removeClass('addedFile');
        $('#loaded_img').hide();
        $('#input_field').attr('contenteditable', 'true');
        $('#loaded_doc').hide().empty();
        $('#loaded_video').hide().empty();
        $('#loaded_audio').hide().empty();
        $('#cancel_image').hide();
        $('#upload_line').hide();
        $('#current_upload').css('width', 0);
        $('.fa.fa-smile-o ').show();
        $('#audio').show();
        $('#sendLocation').show();
        $('#add_file').show();
        self.setInputPlaceholder();
        $('#file_upload').prop("disabled", false);
    }

    //set the new room image
    self.setChatThumb = function (chatId, url) {
        $('#chat_info img').attr('src', url);
        $('img[data-id="' + chatId + '"]').attr('src', url);
        $('.one_box2[data-chat="' + chatId + '"] img').attr('src', url);
        database.ref().child('chats').child(chatId).child('thumb').set(url);
    }

    //handler of new chat image chosen
    self.updateChatName = function (chatId) {
        c('updateChatName');
        var newName = $('#chat_name').val().replace(/(<([^>]+)>)/ig, "");
        var oldName = $('#chat_name').attr('data-name').replace(/(<([^>]+)>)/ig, "");
        var bytesArray = '';
        if ($('#chat_info #main_image_holder img').attr('data-new') == 1) {
            bytesArray = $('#chat_info #main_image_holder img').attr('src');
        }
        if (newName == '') {
            $('#chat_name').val(oldName);
            newName = oldName;
        }
        if (newName != oldName) {
            c('NewN');
            var data = {
                action: 'updateChatInfo',
                data: {
                    newName: newName,
                    chatId: chatId,
                    newImg: ''
                }
            };
            send(data);
            $('#chat_name').attr('data-name', newName);
        }
        if (bytesArray != '') {
            c('BArr');
            var data = {
                data: {
                    session: getCookie('session'),
                    action: 'updateChatThumb',
                    bytesArray: bytesArray,
                    chatId: chatId
                }};
            $.ajax({
                url: dashControllerUrl + '?' + window.location.search.substring(1),
                method: "POST",
                contentType: "application/json", // send as JSON
                data: JSON.stringify(data),
                success: function (data) {
                    var response = jQuery.parseJSON(data);
                    if (response.code == '000') {
                        c('chatId ' + chatId);
                        $.each(dcc.chats, function (key, chat) {
                            if (chat.id == chatId) {
                                var data = response.data;
                                dcc.chats[key].thumb = data.thumb;
                                dcc.chats[key].awsThumb = data.awsThumb;
                                var data = {
                                    action: 'updateChatInfo',
                                    data: {
                                        newImg: dcc.chats[key].thumb,
                                        newAwsImg: dcc.chats[key].awsThumb,
                                        newName: '',
                                        chatId: chatId
                                    }
                                };
                                send(data);
                                $('.one_box2[data-chat=' + chatId + '] img').attr('src', bytesArray);
                                $('#chat_box .chat_el .avatar img').attr('src', bytesArray);
                                $('.one_box2[data-chat=' + chatId + ']').addClass('active');
                            }
                        });
                    }
                }
            });
        }
    }

    self.orderChats = function () {
        c('orderChats');
        var sortable = [];
        $.each(dcc.chats, function (key, chat) {
            var id = chat.id;
            var lastMessage = chat.lastUpdate;
            sortable.push([chat.id, lastMessage]);
        });
        sortable.sort(
                function (a, b) {
                    return a[1] - b[1]
                }
        )
        $.each(sortable, function (key, chatAr) {
            var chatId = chatAr[0];
            var chat = $('#messages_box .one_box2[data-chat="' + chatId + '"]').detach();
            $('#messages_box').prepend(chat);
        });
    }

    //function to convert seconds to time hh:mm:ss
    self.toTime = function (secs) {
        var date = new Date(1970, 0, 1); // Epoch
        //date.setSeconds(secs);
        date.setSeconds(secs);
        var hours = date.getHours();
        var minutes = date.getMinutes();
        var sec = date.getSeconds();
        /*var ampm = hours >= 12 ? 'pm' : 'am';
         hours = hours % 12;*/
        hours = hours < 24 ? hours : 0; // the hour '0' should be '12'

        minutes = minutes < 10 ? '0' + minutes : minutes;
        sec = sec < 10 ? '0' + sec : sec;
        var strTime = hours + ':' + minutes;
        return strTime;
    }

    self.toDate = function (secs) {
        var monthNames = ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];
        var date = new Date(1970, 0, 1); // Epoch
        //date.setSeconds(secs);
        date.setSeconds(secs);
        var day = date.getDate();
        var month = monthNames[date.getMonth()];
        var year = date.getFullYear();
        var strTime = day + ' ' + month + ' ' + year;
        return strTime;
    }

    //toggle invite box
    self.showInvBox = function () {
        $('.can_invite.in_room').slideToggle();
        
        $('.can_invite.in_room input.search_list').val('');
        self.actionSearchList($('.can_invite.in_room input.search_list'));
        
        $('.custom-menu').hide();
    }

    //send invitation to join chat room 
    self.inviteUserInChat = function (el) {
        if ($(el).hasClass('chosen_invite')) {
            c('Has');
            if ($('#createGroupChatPopap .selected_people .list .user_info[data-id="' + $(el).attr('data-id') + '"]').length > 0) {
                $('#createGroupChatPopap .selected_people .list .user_info[data-id="' + $(el).attr('data-id') + '"]').remove();
            }
        } else {
            c('no has');
            if ($('#createGroupChatPopap .selected_people .list .user_info[data-id="' + $(el).attr('data-id') + '"]').length <= 0) {
                c('isset');
                $('#createGroupChatPopap .selected_people .list.scroll-content').append(`<div data-id="${$(el).attr('data-id')}" class="user_info"><img src="${$(el).find('img').attr('src')}" alt="thumb" /><div class="name">${$(el).find('.name').text()}</div><span class="circle" onclick="ezchatActionC.removeChangeUser(this);"><i class="fa fa-times"></i></div></div>`);
            } else {
                $('#createGroupChatPopap .selected_people .list .user_info[data-id="' + $(el).attr('data-id') + '"]').remove();
            }
        }
        $(el).toggleClass('chosen_invite');
    }

    self.removeChangeUser = function (el) {
        var userId = $(el).closest('.user_info').attr('data-id');
        $('#createGroupChatPopap .can_invite .list .user_info[data-id="' + userId + '"]').click();
    }

    //chose new room image
    self.choseRoomImage = function () {
        $('#file-upload').click();
    }

    //chose message file
    self.choseMessageFile = function () {
        if ($('#upload_line').is(":visible")) {
            return false;
        }
        $('#file-upload-chat').click();
    }

    //chose current user thumb image
    self.choseMainThumb = function () {
        c('choseMainThumb');
        $('#file-main-upload').click();
    }

    //handler of new message file chosen
    self.showchatimage = function (input) {
        c(input.files);
        self.restoreChatBox();
        if (input.files.length == 0) {
            return false;
        }
        self.messageFile = input.files[0].name;
        if (input.files && input.files[0]) {
            if (input.files[0]['size'] > 200000000) {
                $("#error_download_file").show();
                $('#file-upload-chat').val('');
                return false;
            }
            var reader = new FileReader();
            if (input.files[0].type.includes("image")) {
                c('image');
                reader.onload = function (e) {
                    $('#loaded_img').attr('src', e.target.result).show();
                    self.updateChatBox();
                };
            } else if (input.files[0].type.includes("video")) {
                c('video');
                reader.onload = function (e) {
                    $('#loaded_video').append('<source src="' + e.target.result + '" type="' + input.files[0].type + '">').show();
                    self.updateChatBox();
                };
            } else if (input.files[0].type.includes("audio")) {
                c('audio');
                reader.onload = function (e) {
                    $('#loaded_audio').append('<source src="' + e.target.result + '" type="' + input.files[0].type + '">').show();
                    self.updateChatBox();
                };
            } else {
                c('document');
                reader.onload = function (e) {
                    $('#loaded_doc').attr('src', e.target.result).show();
                    self.updateChatBox();
                };
                $('#loaded_doc').text(input.files[0].name).show();
                self.updateChatBox();
            }
            reader.readAsDataURL(input.files[0]);
        }
    }

    //cancel changing name
    self.cancelNewName = function () {
//        var newName = $('#cur_user_name').val();
        var oldName = $('#cur_user_name').attr('data-name');
        $('#cur_user_name').val(oldName);
    }

    self.updateStatus = function (newStatus) {
        var data = {
            action: 'updateStatus',
            data: {
                newStatus: newStatus
            }
        };
        send(data);
        self.changeStatus();
    }

    self.changeStatus = function () {
        $('#status_options').toggle();
        $('#online, #away, #not_disturb, #invisiblee').removeClass('curStatus');

        $("#online").attr('onClick', 'ezchatActionC.updateStatus(1)');
        $("#away").attr('onClick', 'ezchatActionC.updateStatus(2)');
        $("#not_disturb").attr('onClick', 'ezchatActionC.updateStatus(3)');
        $("#invisiblee").attr('onClick', 'ezchatActionC.updateStatus(4)');

        var userStatus = $('#cur_user_status').children().attr('class');
        userStatus = userStatus.replace('rezult ', '');

        if ($('#cur_user_status').children().hasClass(userStatus))
        {
            $("#" + userStatus).attr('onClick', '');
            $("#" + userStatus).addClass('curStatus');
        }
    }

    self.closePopup = function () {
        $("#error_download_file").hide();
    }

    self.cancelDownload = function () {
        $('#file-upload-chat').val('');
    }

    self.audio_context;
    self.recorder;
    self.timerSec;
    self.timeLimit;
    self.n = 0;
    self.audioStream;

    self.sendAudio = function () {
        if ($('#voice_record').is(":visible")) {
            return false;
        }
        self.hideOtherWindows();
        $('#smilesBox').hide();
        $("#audio").prop("disabled", true);
        try {
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            navigator.getUserMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);
            window.URL = window.URL || window.webkitURL;
            self.audio_context = new AudioContext;
        } catch (e) {
            alert('No web audio support in this browser!');
            $("#audio").prop("disabled", false);
            return false;
        }
        $("#voice_record").append('<div id="record">\n\
            <p id="timer">00:00 / 00:25</p>\n\
            <button id="start" onclick="ezchatActionC.startRecording();" class="btn btn-default"><i class="fa fa-circle"></i></button>\n\
            <button id="stop" onclick="ezchatActionC.stopRecording();" class="btn btn-default" disabled><i class="fa fa-square"></i></button>\n\
            <button id="send" onclick="ezchatActionC.sendVoiceMessage();" class="btn btn-default" disabled><i class="fa fa-play"></i></button>\n\
            </div>\n\
            <div id="player">\n\
            </div>\n\
            <div id="messages">\n\
                <p></p>\n\
            </div>\n\
            <button id="cancel_record" onclick="ezchatActionC.cancelRecord();" class="btn btn-default">Cancel</button></div>');
        $("#voice_record").show();
        $("#start").prop("disabled", true);
        navigator.getUserMedia({audio: true}, self.startUserMedia, function (e) {
            $("#messages p").text("Microphone was disabled in browser");
        });
    }

    self.startUserMedia = function (stream) {
        $("#start").prop("disabled", false);
        self.audioStream = stream;
        var input = self.audio_context.createMediaStreamSource(stream);
        self.recorder = new Recorder(input, {
            numChannels: 1
        });
        $("#messages p").text("Click to record");
    }

    self.startRecording = function () {
        self.n = 0;
        self.recorder && self.recorder.record();
        if (!self.recorder) {
            $("#messages p").text("Error audio input");
            return false;
        }
        $("#start").prop("disabled", true);
        $("#stop").prop("disabled", false);
        $("#messages p").text("Recording...");
        self.timeLimit = setTimeout(self.stopRecording, 26000);
        self.timerSec = setInterval(self.timer, 1000);
    }

    self.timer = function () {
        self.n++;
        if (self.n <= 9) {
            self.n = "0" + self.n;
        }
        if (self.n >= 25) {
            clearInterval(self.timerSec);
        }
        $("#timer").text("00:" + self.n + " / 00:25");
    }

    self.stopRecording = function () {
        if (($("#start").attr("disabled") == "disabled") && ($("#stop").attr("disabled") == "disabled")) {
            return false;
        }
        self.recorder && self.recorder.stop();
        $("#start").prop("disabled", true);
        $("#stop").prop("disabled", true);
        self.recorder && self.recorder.exportWAV(function (blob) {});
        clearInterval(self.timerSec);
        clearTimeout(self.timeLimit);
        self.recorder.clear();
    }

    self.sendVoiceMessage = function () {
        var chatId = $("div.one_box2.active").attr("data-chat");
        if (!chatId) {
            return false;
        }
        var byteArray = $("#rec").attr('src');
        var fileName = curUserId + "_" + chatId + ".mp3";
        var data = {
            data: {
                session: getCookie('session'),
                action: 'sendChatFile',
                bytesArray: byteArray,
                name: fileName,
                chatId: chatId
            }};
        $.ajax({
            url: dashControllerUrl + '?' + window.location.search.substring(1),
            method: "POST",
            contentType: "application/json", // send as JSON
            data: JSON.stringify(data),
            success: function (data) {
                var response = jQuery.parseJSON(data);
                if (response.code == '000') {
                    var data = {
                        action: 'sendMessage',
                        data: {
                            chatId: chatId,
                            type: 5,
                            chatMessage: response.data
                        }
                    };
                    send(data);
                    self.restoreChatBox();
                }
            }
        });
        self.audioStream.getTracks()[0].stop();
        $("#audio").prop("disabled", false);
        $("#voice_record").hide();
        $("#voice_record").empty();
    }

    self.cancelRecord = function () {
        if (typeof self.recorder != 'undefined') {
            self.recorder.destroy();
        }
        clearInterval(self.timerSec);
        clearTimeout(self.timeLimit);
        $("#audio").prop("disabled", false);
        $("#voice_record").hide();
        $("#voice_record").empty();
        self.audioStream ? self.audioStream.getTracks()[0].stop() : "";
    }

    self.initialize = function (lat, long) {
        if (window.location.pathname === "/dash/drivers/") {
            return false;
        }

        if (arguments.length == 3) {//отправить геолокацию
            $('#sendGoogleMaps').empty();
            hereMap.showMap('sendGoogleMaps');
            hereMap.setCenter({lat: lat, lng: long});
        } else {//открыть сообщ с гелокацией
            $('#googleMaps').empty();
            hereMap.showMap('googleMaps');
            hereMap.setCenter({lat: lat, lng: long});
            
            var marker = new H.map.Marker({lat: lat, lng: long});
            hereMap.hMap.addObject(marker);
        }
    }

    self.addContact = function (userId) {
        $("#addContact").show();
        var data = {
            action: 'createChat',
            data: {
                chatName: '',
                type: 0,
                chatUsers: [{userId: userId}]
            }
        };
        send(data);
    }

    self.getUserGeolocation = function () {
        navigator.geolocation.getCurrentPosition(
                function (position) {
                    c('here');
                    self.initialize(position.coords.latitude, position.coords.longitude, "sendLocation");
                },
                function (positionError) {
                    self.initialize(40.708453, -74.00854, "sendLocation");
                }
        );
    }

    self.stripHTML = function (dirtyString) {
        var container = document.createElement('div');
        var text = document.createTextNode(dirtyString);
        container.appendChild(text);
        return container.innerHTML; // innerHTML will be a xss safe string
    }

    self.placeCaretAtEnd = function (el) {
        el.focus();
        if (typeof window.getSelection != "undefined" && typeof document.createRange != "undefined") {
            var range = document.createRange();
            range.selectNodeContents(el);
            range.collapse(false);
            var sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        } else if (typeof document.body.createTextRange != "undefined") {
            var textRange = document.body.createTextRange();
            textRange.moveToElementText(el);
            textRange.collapse(false);
            textRange.select();
        }
    }

    self.getSelectionText = function () {
        var text = "";
        if (window.getSelection) {
            text = window.getSelection().toString();
        } else if (document.selection && document.selection.type != "Control") {
            text = document.selection.createRange().text;
        }
        return text;
    }

    self.showTextMessageIcon = function () {
        var self = $(this);
        if ((self.attr('data-timereal') / 1000) + 3600 > (new Date().getTime() / 1000)) {
            self.find('.messageControlIcon').show();
        }
    }

    self.showAttachmentMessageIcon = function () {
        var message = $(this).parents('.chat_one_msg');
        if ((message.attr('data-timereal') / 1000) + 3600 > (new Date().getTime() / 1000)) {
            message.find('.ezchatRemoveMessageIcon').show();
            message.find('.messageControlIcon').show();
        } else {
            message.find('.ezchatRemoveMessageIcon').hide();
            message.find('.messageControlIcon').show();
        }
    }

    self.getLinkPreviewInfo = function (preview, type) {
        var classesTypes = type == 1 ? 'post' : 'quickChat',
                maxLength = type == 1 ? 150 : 20,
                previewInfo = '',
                previewTitle = '',
                previewDescription = '',
                previewUrlText = '',
                previewImage = '';

        if (preview.title && preview.url) {
            previewTitle = preview.title.length > maxLength ? preview.title.substring(0, maxLength) + "..." : preview.title;

            if (preview.description) {
                previewDescription = preview.description.length > maxLength ? preview.description.substring(0, maxLength) + "..." : preview.description;
                previewDescription = `<div class = "${classesTypes}PreviewDescription">${previewDescription}</div>`;
            }

            previewImage = preview.image ? `<div class = "${classesTypes}PreviewImageBox"><img src = "${preview.image}" alt = "image"></div>` : '';
            previewUrlText = preview.url.length > maxLength ? preview.url.substring(0, maxLength) + "..." : preview.url;

            previewInfo = `<a class="${classesTypes}Preview" href="${preview.url}" target="_blank">
                ${previewImage}
                <div class= "${classesTypes}PreviewInfoBox">
                    <div class = "${classesTypes}PreviewTitle">${previewTitle}</div>
                    ${previewDescription}
                    <div class = "${classesTypes}PreviewLinkText">${previewUrlText}</div>
                </div>
            </a>`;
        }
        return previewInfo;
    }

    self.filterChats = function () {
        var chatsTypes = JSON.parse($('#chat_types div.active').attr('data-types'));
        var searchName = $('#search_field').val();
        $('.one_box2').hide();
        if (searchName == '') {
            $('#findSocUser').remove();
            $('.one_box2').each(function () {
                if (chatsTypes.indexOf(parseInt($(this).attr('data-type'))) > -1) {
                    $(this).show();
                }
            });
        } else {
            $('.one_box2').each(function () {
                var chatName = $(this).find('.one_name').text().toLowerCase();
                if (chatName.indexOf(searchName.toLowerCase()) > -1 && chatsTypes.indexOf(parseInt($(this).attr('data-type'))) > -1) {
                    $(this).show();
                }
            });
            AjaxController('findSocUser', {login: searchName}, '/db/socialController/', self.filterChats_findSocUserHandle, self.filterChats_findSocUserHandle, true);
        }
    }

    self.filterChats_findSocUserHandle = function (response) {
        c('filterChats_findSocUserHandle');
        c(response);
        $('#findSocUser').remove();
        if (response.code != "000") {
            return false;
        }
        var mesBlock = $('#messages_box');
        mesBlock.append('<div id="findSocUser" class="findSocUser"><p class="title">Ezlogz users list</p><div class="list"></div></div>');
        $.each(response.data.users, function () {
            $('#findSocUser .list').append(self.viewOneUser(this));
        });
        if (response.data.countUsers != 0) {
            $('#findSocUser').find('.countUsers').remove();
            $('#findSocUser').append(`<div class="countUsers" onclick="ezchatActionC.seeMoreUsers();">See More</div>`);
        }
    }

    self.seeMoreUsers = function () {
        var searchName = $('#search_field').val();
        var lastUserId = $('#findSocUser .list .one-user:last-child').attr('data-user-id');

        var data = {};
        data.login = searchName;
        data.lastUserId = lastUserId;

        AjaxController('findSocUser', data, '/db/socialController/', self.seeMoreUsersHandle, self.seeMoreUsersHandle, true);
    }

    self.seeMoreUsersHandle = function (response) {
        c(response);
        if (response.code != "000") {
            return false;
        }
        if (response.data.users.length == 0) {
            $('#findSocUser .countUsers').remove();
        }
        $.each(response.data.users, function () {
            $('#findSocUser .list').append(self.viewOneUser(this));
        });
    }

    self.showChats = function (el) {
        $('#chat_types div').removeClass('active');
        $(el).addClass('active');
        if ($(el).hasClass('invites')) {
//            $('#invites_list').remove();
            self.getInvitesList();
        } else {
            $('#invites_list').remove();
        }
        self.filterChats();
    }

    self.createGroupChatPopap = function () {
        var header = 'Create Group Chat';
        var content = `<div class="create_group_box">
                <div class="input_block">
                    <input type="text" class="ez_input" id="room_name" placeholder="Room name" maxlength="100"/>
                </div>
                <div class="can_invite on_create">
                    <div class="list_rearch_box">
                        <input type="text" placeholder="Search name" class="search_list" onkeyup="ezchatActionC.actionSearchList(this);" />
                    </div>
                    <div class="scrollbar-macosx list"></div>
                </div>
                <div class="selected_people">
                    <p class="header">selected people:</p>
                    <div class="scrollbar-macosx list"></div>
                </div>
                <div class="create_errors"></div>
            </div>`;
        showModal(header, content, 'createGroupChatPopap', 'groupChatPopap ezchat', {
            'footerButtons': '<button class="btn btn-default" onclick="ezchatActionC.createRoom();">Create Group Chat</button>'
        });
        fillEzchatCanInvite();
        jQuery('.scrollbar-macosx').scrollbar({
            'autoUpdate': true
        });
    }

    self.viewOneUser = function (user) {
        var thumb = user.thumb;
        var awsThumb = user.awsThumb;
        if ((thumb == '' || thumb == null) && (awsThumb == '' || awsThumb == null)) {
            thumb = '/social/assets/img/thumb_blank.png';
        } else {
            thumb = EZCHAT_LINK + user.thumb;
            if (awsThumb) {
                thumb = awsThumb;
        }
        }
        var textButton = 'Add Friend';
        var inviteId = '';
        if (user.activeFriendInviteId) {
            textButton = 'Cancel invitation';
            inviteId = user.activeFriendInviteId;
        }
        var mutualFriends = '';
        if (user.countCommonFriends > 0) {
            mutualFriends = `<p class="mutual-friends">${user.countCommonFriends} mutual friends</p>`;
        }
        return `<div class="one-user" data-user-id="${user.id}">
                    <div class="one-user-block">
                        <div class="avatar">
                            <a href="/social/profile/${user.id}/" class="spa_link">
                                <img src="${thumb}" alt="" class="avatar"/>
                            </a>
                        </div>
                        <div class="info">
                            <p class="name">${user.login}</p>
                            ${mutualFriends}
                        </div>
                        <div class="btn-block">
                            <button class="btn btn-default" data-inviteid = "${inviteId}" onclick="ezchatActionC.sendCancelInvitation(this);">${textButton}</button>
                        </div>
                    </div>
                </div>`;
    }

    self.sendCancelInvitation = function (el) {
        var inviteId = $(el).attr('data-inviteid');
        var userId = $(el).closest('.one-user').attr('data-user-id');
        if (inviteId != '') {
            c('cancel invite');
            self.cancelInvite(userId, inviteId);
        } else {
            c('add friend');
            self.sendInvite(userId);
        }
    }

    /*Cancel invite to friends*/
    self.cancelInvite = function (userId, inviteId) {
        var url = '/db/socialController/' + '?' + window.location.search.substring(1);

        var data = {data: {
                action: 'socUserFriendCancelInvite',
                inviteId: inviteId
            }};

        $.ajax({
            url: url,
            method: "POST",
            contentType: "application/json", // send as JSON
            data: JSON.stringify(data),
            success: function (data) {
                var response = jQuery.parseJSON(data);
                if (response.code == "000") {
                    var buttonUser = $('#findSocUser .one-user[data-user-id="' + userId + '"] button');
                    buttonUser.attr('data-inviteid', '');
                    buttonUser.text('Add Friend');
                }
            }
        });
    }

    /*Send invite to adds friends*/
    self.sendInvite = function (userId) {
        var url = '/db/socialController/' + '?' + window.location.search.substring(1);

        var data = {data: {
                action: 'socUserFriendInvite',
                userId: userId
            }};

        $.ajax({
            url: url,
            method: "POST",
            contentType: "application/json", // send as JSON
            data: JSON.stringify(data),
            success: function (data) {
                var response = jQuery.parseJSON(data);
                c(response);
                var buttonUser = $('#findSocUser .one-user[data-user-id="' + userId + '"] button');
                buttonUser.attr('data-inviteid', response.data.inviteId);
                buttonUser.text('Cancel invitation');
            }
        });
    }

    self.noInputText = function (el, event) {
        event.stopPropagation();
        c('noInputText');
        с(event.key);
        event.preventDefault();
    }

    //CHAT ACTIONS

    self.actionQuoteMessage = function (el) {
        var copiedOriginalText = $(el).closest('.chat_one_msg').find('.chat_msg').text();
        var copiedFromMessageTime = $(el).closest('.chat_one_msg').attr('data-time');
        var chatId = $('#file_upload').attr('data-id');
        var copiedFromMessageId = $(el).closest('.chat_one_msg').attr('data-messageid');
        var chatInfo = dcc.getChatById(chatId);
        var copiedFromName = '';
        var userId = 0;
        $.each(chatInfo.chat_messages, function (key, message) {
            if (message.id == copiedFromMessageId) {
                userId = message.userId;
                return true;
            }
        });
        $.each(chatInfo.chat_users, function (key, user) {
            if (user.id == userId) {
                copiedFromName = user.login;
                return true;
            }
        });
        var time = toTime(copiedFromMessageTime / 1000);
        var date = toDate(copiedFromMessageTime / 1000);
        var nowTime = new Date().getTime();
        var curDate = toDate(nowTime / 1000);
        if (curDate == date) {
            date = 'Today';
        }
        var txt = copiedOriginalText;
        txt = '<quote contenteditable="false"><span>' + copiedFromName + ', ' + date + ' at ' + time + ':</span><br><q>' + txt.replace(/\r\n|\r|\n/g, "<br>") + '</q></quote><br><br>';

        $('#input_field').html($('#input_field').html() + '' + txt);

        self.placeCaretAtEnd(document.getElementById("input_field"));
        $(".custom-menu").hide();
    }

    self.actionBanUser = function (el) {
        var userId = $(el).closest('.chat_one_msg').attr('data-user');
        var chatId = $('.one_box2.active').attr('data-chat');
        var data = {
            action: 'banUser',
            data: {
                chatId: chatId,
                userId: userId
            }
        };
        send(data);
    }

    self.actionDeleteMessage = function (el) {
        if ($(el).closest('.chat_one_msg').prev().hasClass('newDate') && $(el).closest('.chat_one_msg').next().length == 0) {
            $(el).closest('.chat_one_msg').prev().remove();
        }
        var msgId = $(el).closest('.chat_one_msg').attr('data-messageId');
        var chatId = $('.one_box2.active').attr('data-chat');
        var data = {
            action: 'deleteMessage',
            data: {
                msgId: msgId,
                chatId: chatId
            }
        };
        send(data);
    }

    self.actionChatInfo = function (el) {
        if ($("#chat_info").is(":visible")) {
            var visible = true;
        }
        var chatId = $(el).attr('data-id');
        var chatInfo = dcc.getChatById(chatId);
        var type = $(el).attr('data-type');
        if (!type) {
            return false;
        }
//        $('.create_group_box').hide();
        $('.find_user_box').hide();
        $('#chat_info').remove();
        if (type == 1) {
            var chatName = chatInfo.chatName;
        } else {
            $.each(chatInfo.chat_users, function (key, user) {
                if (user.id != curUserId) {
                    userName = user.name + ' ' + user.last;
                    email = user.email;
                    userId = user.id;
                }
            });
        }

        $('#section_1').append('<div id="chat_info" class="info_box">\n\
                <input data-name="' + chatName + '" type="text" placeholder="Chat Name" id="chat_name" value="' + chatName + '" maxlength="100"/>\n\
                <div id="main_image_holder">\n\
                    <img src="' + $(el).attr('src') + '" />\n\
                    <div class="ch_info">\n\
                    </div>\n\
                </div>\n\
                <div class="buttons_box">\n\
                    <button class="btn btn-default" onclick="ezchatActionC.updateChatName(\'' + chatId + '\');">Update</button>\n\
                    <span id="same_chat_name_result"></span>\n\
                    <button class="cancel_button btn btn-default" onclick="$(\'#chat_info\').remove();">Close</button>\n\
                </div>\n\
            </div>');
        if (type == 1) {
            $('#chat_info .ch_info ').append('<input type="file" accept="image/*" id="file-upload" onchange="ezchatActionC.saveimage(this.files);"><i class="fa fa-2x fa-camera" onclick="ezchatActionC.choseRoomImage()" data-id="' + chatId + '"></i><p class="change_picture" onclick="ezchatActionC.choseRoomImage()" data-id="' + chatId + '"><ins>Change Picture</ins></p>');
        }
        if (!visible) {
            $('#chat_info').show();
        }
    }

    self.actionChatInputKeyUp = function (el, event) {
        if (event.which == 13 && $(el).val() != '') {
            $('#file_upload').click();
        } else if (event.which == 27 && $(el).val() != '') {
            $(el).val('');
            $('#chat_input').removeAttr('data-msgid');
            $('#chat_input').removeAttr('data-chatid');
        }
    }

    self.actionContextMenu = function (el, event) {
        c('contexmenu');
        event.preventDefault();
        event.stopPropagation();
        $(".custom-menu").hide();
        var cmenu = $(el).find(".custom-menu");
        if ($(el).width() - cmenu.width() > event.offsetX) {
            cmenu.toggle(100).css({top: event.offsetY + 20 + "px", left: event.offsetX + 20 + "px", right: 'auto'});
        } else {
            cmenu.toggle(100).css({top: event.offsetY + 20 + "px", right: 10 + "px", left: 'auto'});
        }
    }

    self.actionEditMessage = function (el) {
        var msgId = $(el).closest('.chat_one_msg').attr('data-messageId');
        var chatId = $('.one_box2.active').attr('data-chat');
        $('#chat_input').attr('data-msgId', msgId);
        $('#chat_input').attr('data-chatId', chatId);
        $('#chat_input').val($(el).closest('.chat_one_msg').find('.chat_msg').text());
        $('#input_field').html($(el).closest('.chat_one_msg').find('.chat_msg').html());
        $(".custom-menu").hide();
        $('#input_field').append('<br>');
        self.setCursorToEnd($("#input_field").children().last().get(0));
        $('#input_field br').remove();
        $('#audio').hide();
        $('#sendLocation').hide();
        $('#add_file').hide();
    }

    self.actionDownloadMessage = function (el) {
        var that = $(el),
                a = that.parents('.msg_box').find('a');
        if (a.hasClass('downloadMes'))
        {
            a.attr('href', a.attr('data-src'));
            a[0].click();
            a.removeAttr('href');
            $(".custom-menu").hide();
            return false;
        }
        that.closest('.chat_one_msg').find('a')[0].click();
        $(".custom-menu").hide();
    }

    self.actionSearchList = function (el) {
        var searchText = $(el).val();
        $(el).closest('.can_invite').find('.list div').removeClass('hidden');
        if (searchText == '') {
            return false;
        }
        $(el).closest('.can_invite').find('.list div:visible').each(function () {
            var name = $(this).text();
            if (name.toLowerCase().indexOf(searchText.toLowerCase()) < 0) {
                $(this).addClass('hidden');
            }
        });
    }

    self.actionChoseChat = function (el) {
        self.choseChat($(el));
        $('#section_1 .right_sec').removeClass('display');
        self.changeCaret();
    }

    self.actionShowDeleteOrLeavePopup = function (el, event) {
        event.stopPropagation();
        var chatId = $(el).closest('.one_box2').attr('data-chat');
        $("#confirmLeaveChat").show();
        $('#confirmLeaveChat').attr('data-chatid', chatId);
    }

    self.actionLeaveChat = function () {
        var chatId = $('#confirmLeaveChat').attr('data-chatid');
        if (!chatId)
        {
            return false;
        }
        var data = {
            action: 'leaveChat',
            data: {
                chatId: chatId
            }
        };
        send(data);
        $("#confirmLeaveChat").hide();
        $('#confirmLeaveChat').removeAttr('data-chatid');
    }

    self.actionCancelLeaveChat = function () {
        $('#confirmLeaveChat').removeAttr('data-chatid');
        $("#confirmLeaveChat").hide();
    }

    self.actionSendContact = function (el) {
        var userId = $(el).attr("data-userid");
        for (var i = 0; i < dcc.chats.length; i++) {
            for (var j = 0; j < dcc.chats[i].chat_users.length; j++) {
                if (dcc.chats[i].type == 0) {
                    if (dcc.chats[i].chat_users[j].id == userId) {
                        return false;
                    }
                }
            }
        }
        $("#addContact").show();
        $("#addContactTrue").attr("data-userid", userId);
    }

    self.actionAddContactTrue = function (el) {
        var userId = $(el).attr('data-userid');
        c('add friend');
        self.sendInvite(userId);
        $("#addContact").hide();
    }

    self.actionAddContactFalse = function () {
        $("#addContact").hide();
    }

    self.actionInitLocation = function (el) {
        self.hideOtherWindows();
        var long = ($(el).attr("data-long"));
        var lat = ($(el).attr("data-lat"));
        $("#mapBlock").show();
        self.initialize(lat, long);
    }

    self.actionCloseMap = function () {
        $("#mapBlock").hide();
    }

    self.actionSendContactList = function (el, event) {
        event.stopPropagation();
        var target = ($(el)).parents(".one_box2");
        var email = target.attr("data-email");
        var login = target.attr("data-name");
        var img = target.find("img").attr("src");
        var userId = target.attr("data-userid");
        var chatId = $(".can_invite.in_room").attr("data-chat");

        if (!login || !email || !img || !userId || !chatId)
        {
            $(".custom-menu").hide();
            return false;
        }
        var message = {
            id: userId,
            thumb: img,
            email: email,
            login: login
        }
        message = JSON.stringify(message);
        var data = {
            action: 'sendMessage',
            data: {
                chatId: chatId,
                type: 7,
                chatMessage: message
            }
        };
        send(data);
        $(".custom-menu").hide();
    }

    self.actionSendLocation = function () {
        self.hideOtherWindows();
        $('#smilesBox').hide();
        $("#sendLocBlock").toggle();
        self.getUserGeolocation();
    }

    self.actionSendMap = function () {
        var location = hereMap.hMap.getCenter();

        plcApi.getLocationFromLatLng({lat: location.lat, lng: location.lng});
    }

    self.sendLocationFromLatLngHandler = function (data) {
        if(['/dash/ezchat/'].indexOf(window.location.pathname) == -1){ 
            return false;
        }
        var res = data.result;
        var placeObj = [];
        if (typeof res.Street !== 'undefined')
            placeObj.push(res.Street);
        if (typeof res.State !== 'undefined')
            placeObj.push(res.State);
        if (typeof res.ZIP !== 'undefined')
            placeObj.push(res.ZIP);
        if (typeof res.Country !== 'undefined')
            placeObj.push(res.Country);
        var textLocation = placeObj.length ? placeObj.join(", ") : '';
        textLocation = textLocation == '' && typeof res.FormattedAddressLines !== 'undefined' ? res.FormattedAddressLines.join(", ") : textLocation;

        var location = hereMap.hMap.getCenter();

        var message = {
            long: location.lng,
            lat: location.lat,
            locationName: textLocation
        }
        message = JSON.stringify(message);
        var data = {
            action: 'sendMessage',
            data: {
                chatId: $('div.one_box2.active').attr('data-chat'),
                type: 8,
                chatMessage: message
            }
        };
        send(data);
        $("#sendLocBlock").hide();
    }

    self.actionCloseSendMap = function () {
        $("#sendLocBlock").hide();
    }

    self.actionMessageImage = function (el) {
        var img = new Image();
        img.onload = function ()
        {
            $('#ezchatAttachmentBox').show();
            $('#ezchatShowFile').css({'max-height': $(window).height() * 0.9 - 100});
            $('#ezchatShowFile').css({'height': img.height});
            $('#ezchatShowFile').empty().append(img);
        };
        img.src = $(el).attr('src');
    }

    self.actionEzchatRoomParticipants = function () {
        var chatId = $('.can_invite').attr('data-chat'),
                chats = dcc.chats,
                content = '';

        if ($('#roomInfoBox').hasClass('visibleParticipantsBox')) {
            $('#roomInfoBox').removeClass('visibleParticipantsBox');
            $('#roomParticipantsBox').slideToggle();
        } else {
            chats.forEach(function (chat) {
                if (chat.id == chatId) {
                    chat.chat_users.forEach(function (user) {
                        var thumb = MAIN_LINK + "/dash/assets/img/personal.png";
                        if (user.thumb) {
                            thumb = filesLink + user.thumb;
                            if (user.awsThumb) {
                                thumb = user.awsThumb;
                            }
                        }
                        content += '<div class = "oneRoomParticipants">\n\
                            <img src = "' + thumb + '" alt="thumb" >\n\
                            <span>' + user.login + '</span>\n\
                        </div>';
                    });
                }
            });
            if (content != '') {
                content = '<div id = "roomParticipantsList">' + content + '</div><button id = "closeParticipantsBox" class="btn btn-default" onclick="ezchatActionC.actionCloseParticipantsBox();">Close</button>';
                $('#roomParticipantsBox').empty().append(content).addClass('visibleParticipantsBox');
                $('#roomParticipantsBox').slideToggle();
            }
        }
    }

    self.actionCloseParticipantsBox = function () {
        $('#roomInfoBox').removeClass('visibleParticipantsBox');
        $('#roomParticipantsBox').slideToggle();
    }

    self.actionUserSettings = function () {
        $('#user_info').toggle();
        self.resizeImageHolder();
        $('#same_name_result').text('');
    }
    self.resizeImageHolder = function () {
        $('#main_image_holder').height($('#main_image_holder').width());
    }
    self.actionAddUser = function () {//not use
        $('.find_user_box').toggle();
    }

    self.actionToggleSmileBox = function () {
        self.hideOtherWindows();
        $('#smilesBox').toggle();
        event.stopPropagation();
    }
    self.hideOtherWindows = function () {
        self.cancelRecord();
        $('.chat-popup-block > div').hide();
    }

    self.getInvitesList = function () {
        $('#invites_list').remove();
        AjaxCall({action: 'getInvitesList', data: {}, url: '/db/socialController/', successHandler: self.getInvitesListHandler, errorHandler: self.getInvitesListHandler});
    }

    self.getInvitesListHandler = function (response) {
        c(response);
        self.filterChats();
        var data = response.data;

        if (data.length > 0) {
            $('#chat_types .invites').show();
            var li = '';
            $.each(data, function (key, value) {
                var userThumb = typeof value.userInfo.thumb != 'undefined' && value.userInfo.thumb != '' ? EZCHAT_LINK + value.userInfo.thumb : '/social/assets/img/thumb_blank.png';
                li += '<li><img src="' + userThumb + '" class="inviter-logo">' + value.userInfo.login + '<div class="buttons-block"><button class="btn btn-default" data-id="' + value.id + '" data-userId="' + value.userInfo.userId + '" onclick="ezchatActionC.acceptFriend(this);">Accept</button><button class="btn btn-default" data-id="' + value.id + '" onclick="ezchatActionC.declineFriend(this);">Decline</button></div></li>'
            });
            $('#messages_box').append('<div id="invites_list">\n\
                <ul>\n\
                    ' + li + '\n\
                </ul>\n\
            </div>');
        } else {
            $('#chat_types .invites').hide();
            $('#chat_types div:first-child').click();
        }
    }

    self.acceptFriend = function (el) {
        var inviteId = $(el).attr('data-id');
        var userId = $(el).attr('data-userId');
        var data = {
            action: 'createChat',
            data: {
                chatName: '',
                type: 0,
                chatUsers: [{userId: userId}]
            }
        };
        send(data);
        
        setTimeout(function(){
                AjaxCall({action: 'socFriendAcceptInvite', data: {inviteId: inviteId}, url: '/db/socialController/', successHandler: self.acceptFriendHandler, errorHandler: self.acceptFriendHandler})
            }
        , 1000);

    }

    self.acceptFriendHandler = function (response) {
        c(response);
        self.getInvitesList();
    }

    self.declineFriend = function (el) {
        var inviteId = $(el).attr('data-id');

        AjaxCall({action: 'socFriendDeclineInvitation', data: {inviteId: inviteId}, url: '/db/socialController/', successHandler: self.declineFriendHandler, errorHandler: self.declineFriendHandler});
    }

    self.declineFriendHandler = function (response) {
        c(response);
        self.getInvitesList();
    }
}

ezchatActionC = new ezchatActionController();