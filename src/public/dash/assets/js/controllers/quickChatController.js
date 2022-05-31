function quickChatController() {
    var self = this;

    self.showOneQuickChatRoom = function (id = null) {
        var chatId = typeof id == 'object' ? $(this).attr('id') : id,
                windowHeigth = $(window).height(),
                chats = dcc.chats,
                chatInfoContent = '',
                chatRoomMessages = '';

        chats.forEach(function (chat) {
            if (chat.id == chatId) {
                chatRoomMessages = self.getOneQuickChatRoomMessages(chat.chat_messages);
                chatInfoContent = self.getQuickChatInfo(chat);

                chatInfoContent.notReadMessages > 0 ? self.quickChatReadMessages(chat) : '';
                $('#oneQuickChatRoomInfo').text(chatInfoContent.chatName);
                if (chat.type == 2 && chat.user_chat_status == 1) {
                    $('#oneQuickChatRoomInfo').append('<button id="leavePublicChatBut" onclick="leavePublicChat()" class="btn btn-default">Leave</button>')
                } else if (chat.type == 2 && chat.user_chat_status == 0) {
                    $('#oneQuickChatRoomInfo').append('<button id="joinPublicChatBut" onclick="joinPublicChat()" class="btn btn-default">Join</button>')
                }
                $('#oneQuickChatRoomMessageBox').empty().append(chatRoomMessages).css({height: windowHeigth - 233});
            }
        });
        self.setInputPlaceholderQuickChat(chatId);
        $('#oneQuickChatRoomAttachmentFile, #oneQuickChatRoomProgressBar').hide();
        $('#oneQuickChatRoom').removeClass().addClass('visibleOneQuickChatRoom').attr('data-chatid', chatId).css({'margin-bottom': windowHeigth - 244});
        $('#quickChatShadowBox').removeClass('quickChatShadowBoxVisible');
        $('#oneQuickChatRoom, #oneQuickChatRoomMessageBox, #oneQuickChatRoomControlsBox').show();
        $('#oneQuickChatRoomMessageBox').scrollTop($("#oneQuickChatRoomMessageBox")[0].scrollHeight);
        if ($("#oneQuickChatRoomMessageBox").scrollTop() == 0 && !$('#oneQuickChatRoomMessageBox[data-chatid = "' + chatId + '"]').hasClass('loaded')) {
            self.getMoreQuickChatMessages(chatId, $('.oneQuickChatMessageBox:not(.quickChatSystemMessageDateTime):first').attr('data-time'));
    }
    }

    self.getOneQuickChatRoomMessages = function (chatMessages, sendMessage) {
        var messages = chatMessages,
                allChats = dcc.chats,
                chatId = chatMessages[0].chatId,
                prevMessageUserId = '',
                messageUserThumb = '',
                userMessage = '',
                content = '',
                messageSenger = '',
                firstUserMessageInMessagesList = '',
                chatType = 0,
                userLoginBox = '',
                previewInfo = '',
                imgHigthBox = '',
                messageDate = '',
                prevMessageDate = '',
                chatUsersInfo = {},
                timeOffset = -new Date().getTimezoneOffset() * 60 * 1000;

        prevMessageUserId = sendMessage == 1 ? $('.quickChatMessageUserThumbBox:last').parents('.oneQuickChatMessageBox ').attr('data-userid') : '',
                prevMessageDate = sendMessage === 1 ? toDate((parseInt($('.oneQuickChatMessageBox:last').attr('data-time'))) / 1000) : '';

        allChats.forEach(function (oneChat) {
            if (oneChat.id == chatId) {
                chatType = oneChat.type;
                oneChat.chat_users.forEach(function (user) {
                    chatUsersInfo[user.id] = {};
                    chatUsersInfo[user.id].thumb = !user.thumb ? MAIN_LINK + '/dash/assets/img/personal.png' : filesLink + user.thumb;
                    chatUsersInfo[user.id].login = !user.login ? 'User has left' : user.login;
                });
            }
        });
        messages.forEach(function (oneMessage, i) {
            userLoginBox = chatType == 1 ? '<div class = "userLoginBox">' + (!chatUsersInfo[oneMessage.userId] ? 'User has left' : chatUsersInfo[oneMessage.userId].login) + '</div>' : '';
            messageUserThumb = (prevMessageUserId == oneMessage.userId) && (messageSenger != 'quickChatSystemMessage') || (oneMessage.userId == curUserId) ? '' :
                    '<div class = "quickChatMessageUserThumbBox">\n\
                <img class = "quickChatMessageUserThumb" src="' + (!chatUsersInfo[oneMessage.userId] ? MAIN_LINK + '/dash/assets/img/personal.png' : chatUsersInfo[oneMessage.userId].thumb) + '"alt="thumb">\n\
                ' + userLoginBox + '\n\
            </div>';
            messageSenger = oneMessage.userId == curUserId ? 'quickChatCurUserMessageBox' : 'quickChatNotCurUserMessageBox';
            imgHigthBox = '';
            previewInfo = '';

            messageDate = toDate((parseInt(oneMessage.dateTime) + timeOffset) / 1000);
            if (i > 0) {
                prevMessageDate = toDate((parseInt(messages[i - 1].dateTime) + timeOffset) / 1000);
            }

            if (messageDate !== prevMessageDate) {
                content += '<div class="oneQuickChatMessageBox quickChatSystemMessage quickChatSystemMessageDateTime">\n\
                <div class = "quickChatUserMessage">' + messageDate + '</div>\n\
            </div>';
            }

            switch (oneMessage.type) {
                case 1:
                    oneMessage.message = oneMessage.message.replace();
                    userMessage = self.convertSmileQuickChat($('<div></div>').text(oneMessage.message), 'convert');
                    break;
                case 2:
                    userMessage = '<img class = "quickChatMessageImage" src = "' + filesLink + oneMessage.message + '">';
                    imgHigthBox = oneMessage.size ? 'style = "min-height:' + (parseInt((oneMessage.size[1] / (oneMessage.size[0] / 70)).toFixed()) + 10) + 'px"' : '';
                    break;
                case 3:
                    userMessage = '<div class = "playVideoButton"></div><video class = "quickChatMessageVideo"><source src="' + filesLink + oneMessage.message + '"></video>';
                    break;
                case 4:
                    userMessage = '<a class = "quickChatMessageDocument" href="' + filesLink + oneMessage.message + '" download>' + oneMessage.message.replace(/^[^_]*_/, '') + '</a>';
                    break;
                case 5:
                    userMessage = '<audio class = "quickChatMessageMusic" controls><source src="' + filesLink + oneMessage.message + '"></audio>';
                    break;
                case 7:
                    userMessage = JSON.parse(oneMessage.message);
                    userMessage = '<div class="send_contact quickChatMessageContact" data-userid = "' + userMessage.id + '">\n\
                        <img src="' + userMessage.thumb + '" alt="thumb"/><div class="con_name">' + userMessage.login + '</div>\n\
                    <div class="con_email">' + userMessage.email + '</div>\n\
                </div>';
                    break;
                case 8:
                    userMessage = jQuery.parseJSON(oneMessage.message);
                    userMessage = '<div class="quickChatMessageLocation" data-long="' + userMessage.long + '" data-lat="' + userMessage.lat + '">\n\
                        <img src="' + MAIN_LINK + '/dash/assets/img/location_marker.png">\n\
                        <div class="loc_name">' + userMessage.locationName + '</div>\n\
                    </div>';
                    break;
                case 9:
                    userMessage = oneMessage.message;
                    messageSenger = 'quickChatSystemMessage';
                    messageUserThumb = '';
                    break;
                default:
                    userMessage = oneMessage.message;
                    break;
            }

            if ('preview' in oneMessage) {
                previewInfo = ezchatActionC.getLinkPreviewInfo(oneMessage.preview, 2);
            }

            firstUserMessageInMessagesList = messageUserThumb != '' && chatType == 1 ? 'firstUserMessageInMessagesList' : '';
            content += '<div ' + imgHigthBox + ' class="oneQuickChatMessageBox ' + messageSenger + '" data-messageid="' + oneMessage.id + '" data-time="' + (parseInt(oneMessage.dateTime) + timeOffset) + '" data-userid="' + oneMessage.userId + '">\n\
            ' + messageUserThumb + '\n\
            <div class = "quickChatUserMessage ' + firstUserMessageInMessagesList + '">' + userMessage + '</div>\n\
            ' + previewInfo + '\n\
        </div>';
            prevMessageUserId = oneMessage.userId;
        });
        return content;
    }

    self.updateQuickChatsContactList = function () {
        if ($('#collectionQuickChatsBox').hasClass('visibleQuickChatsBox')) {
            self.showQuickChatsContactList(1);
        }
    }

    self.showQuickChatsContactList = function (updateContactList) {
        var windowHeigth = $(window).height() - 170,
                contactListInfo = {};

        if (!dcc.chats || dcc.chats.length == 0 || dcc.allReadyLogin == 0) {
            return false;
        }

        if ($('#collectionQuickChatsBox').hasClass('visibleQuickChatsBox') && updateContactList != 1) {
            $('#quickChatContactsListShowHideButton').html('<i class="fa fa-minus" aria-hidden="true"></i>').addClass('quickChatContactsListShow');
            $('#quickChatContactsList').hide();
            $('#collectionQuickChatsBox').removeClass('visibleQuickChatsBox').addClass('hiddenChatContactsList');
        } else {
            $('#quickChatContactsListShowHideButton').html('<!--<i class="fa fa-times" aria-hidden="true"></i>--><span aria-hidden="true">×</span>').removeClass('quickChatContactsListShow');
            contactListInfo = self.getQuickChatsContactList();
            contactListInfo.contactListHeigth = windowHeigth >= contactListInfo.contactListHeigth ? contactListInfo.contactListHeigth + 15 : windowHeigth;
            $('#quickChatContactsList').empty().append(contactListInfo.contactListContent);
            $('#collectionQuickChatsBox').removeClass('hiddenChatContactsList').addClass('visibleQuickChatsBox').css({'margin-bottom': contactListInfo.contactListHeigth});
            $('#quickChatContactsList').show().addClass('visibleChatContactsList').css({'height': contactListInfo.contactListHeigth});
        }
    }

    self.getQuickChatsContactList = function () {
        var chatsContactListContent = '',
                chats = dcc.chats,
                quickChatContactListHeigth = 0;

        chats.sort(function (a, b) {
            return b.lastUpdate - a.lastUpdate;
        });
        chats.forEach(function (chat) {
            if (chat.type == 2) {
                chatsContactListContent += self.getOneQuickChatBoxInContactList(chat);
                quickChatContactListHeigth += 86;
            }
        });
        chatsContactListContent += '<div class="separator" style="width: 100%;height: 1px;background: #ccc;"></div>';
        chats.forEach(function (chat) {
            if (chat.type != 2) {
                chatsContactListContent += self.getOneQuickChatBoxInContactList(chat);
                quickChatContactListHeigth += 86;
            }
        });

        return {contactListContent: chatsContactListContent, contactListHeigth: quickChatContactListHeigth};
    }

    self.getOneQuickChatBoxInContactList = function (chat) {
        var quickChatUserLastVisit = '',
                chatInfo = {},
                lastChatMessage = chat.chat_messages[chat.chat_messages.length - 1];

        chatInfo = self.getQuickChatInfo(chat);
        if (lastChatMessage != undefined) {
            lastChatMessage = lastChatMessage.type == 1 || lastChatMessage.type == 9 ? lastChatMessage.message : 'File message';
        } else {
            lastChatMessage = '';
        }
        if (chat.type === 0 && ![1, 2, 3].includes(chat.chatStatus)) {
            quickChatUserLastVisit = self.getUserLastVisitQuickChat(chat.lastVisit);
        }

        return '<div id = "' + chat.id + '" class = "oneQuickChatBoxContactList" data-chatname = "' + chatInfo.chatName + '" data-newmes = "' + chat.notReadMes + '">' +
                '<div class = "oneQuickChatBoxContactListLeftBox">\n\
                        <img src="' + chatInfo.chatThumb + '" alt="thumb">\n\
                    </div>' +
                '<div class = "oneQuickChatBoxContactListRightBox">\n\
                        <div class = "oneQuickChatname">' + chatInfo.chatName + '</div>\n\
                        <div class = "lastQuickChatMessage">' + self.convertSmileQuickChat($('<div></div>').text(lastChatMessage), 'convert') + '</div>\n\
                        <div class = "quickChatUserLastVisit">' + quickChatUserLastVisit + '</div>\n\
                        <div class = "oneQuickChatNotReadMessages">' + chatInfo.notReadMessages + '</div>\n\
                    </div>' +
                chatInfo.chatStatus +
                '</div>';
    }

    self.getQuickChatInfo = function (chat) {
        var personalChatInfo = {},
                chatName = '', chatStatus = '',
                chatThumb = '', chatInfo = {};

        if (chat.type == 0) {
            personalChatInfo = chat.chat_users[0].id != curUserId ? chat.chat_users[0] : chat.chat_users[1];
            personalChatInfo = personalChatInfo || {};
            chatName = !personalChatInfo.login ? 'User deleted chat' : personalChatInfo.login;
            chatThumb = !personalChatInfo.thumb ? MAIN_LINK + '/dash/assets/img/personal.png' : filesLink + personalChatInfo.thumb;
            switch (dcc.chatsUsersStatus[chat.id]) {
                case - 1:
                    chatStatus = '<div class = "offline quickChatUserStatus"></div>';
                    break;
                case 0:
                    chatStatus = '<div class = "offline quickChatUserStatus"></div>';
                    break;
                case 1:
                    chatStatus = '<div class = "online quickChatUserStatus"><i class=\"fa fa-check\" aria-hidden=\"true\"></i></div>';
                    break;
                case 2:
                    chatStatus = '<div class = "away quickChatUserStatus"><i class=\"fa fa-clock-o\" aria-hidden=\"true\"></i></div>';
                    break;
                case 3:
                    chatStatus = '<div class = "not_disturb quickChatUserStatus"><i class=\"fa fa-minus\" aria-hidden=\"true\"></i></div>';
                    break;
                case 4:
                    chatStatus = '<div class = "offline quickChatUserStatus"></div>';
                    break;
            }
        } else {
            chatName = chat.chatName;
            chatThumb = !chat.thumb ? MAIN_LINK + '/dash/assets/img/group.png' : filesLink + chat.thumb;
        }
        chatInfo.chatName = chatName;
        chatInfo.chatThumb = chatThumb;
        chatInfo.chatStatus = chatName == 'User deleted chat' ? '' : chatStatus;
        chatInfo.notReadMessages = chat.notReadMes > 0 ? chat.notReadMes : '';

        return chatInfo;
    }

    self.quickChatUploadFile = function () {
        var file = '',
                input = this,
                reader = new FileReader();

        if (input.files && input.files[0]) {
            file = input.files[0];
            if (file.size > 200000000) {
                return false;
            }
            reader.onload = function (e) {
                $('#oneQuickChatRoomAttachmentFile').attr('data-src', e.target.result);
                $('#oneQuickChatRoomAttachmentFileName').text(file.name);
                if (file.type.includes("image")) {
                    $('#oneQuickChatRoomAttachmentFile').attr('data-type', 2);
                } else if (file.type.includes("video")) {
                    $('#oneQuickChatRoomAttachmentFile').attr('data-type', 3);
                } else if (file.type.includes("audio")) {
                    $('#oneQuickChatRoomAttachmentFile').attr('data-type', 5);
                } else {
                    $('#oneQuickChatRoomAttachmentFile').attr('data-type', 4);
                }
                $("#quickChatUploadFile").val('');
                $('#oneQuickChatRoomControlsBox, #quickChatSmilesBox').hide();
                $('#oneQuickChatRoomAttachmentFileSize').text((file.size / 1000000).toFixed(2) + 'MB');
                $('#oneQuickChatRoomAttachmentFile, #oneQuickChatRoomCancelFile, #oneQuickChatRoomSendFile').show();
            };
            reader.readAsDataURL(file);
        }
    }

    self.convertSmileQuickChat = function (smile) {
        if (arguments.length == 1) {
            var output = emojione.toImage($(smile).attr("title")),
                    textInInput = $('#oneQuickChatRoomInputField').html() ? $('#oneQuickChatRoomInputField').html() + ' ' : '';
            $('#oneQuickChatRoomInputField').html(textInInput + output + ' ');
        } else if (arguments.length == 2) {
            return emojione.toImage($(smile).text());
        }
    }

    self.sendQuickChatMessage = function (message, type, chatId) {
        if (type == 1) {
            message = message.replace(/\s{2,}/g, ' ').replace(/<br>/g, '').replace(/^\s\s*/, '').replace(/\s\s*$/, '');
        }
        if (message == '') {
            return false;
        }

        self.messagesBuffer(chatId, '');
        if (type == 1) {
            var data = {
                action: 'sendMessage',
                data: {
                    chatId: chatId,
                    type: type,
                    chatMessage: emojione.shortnameToUnicode(message)
                }
            };
            send(data);
        } else {
            $('#oneQuickChatRoomCurrenntUpload').css('width', 0);
            $('#oneQuickChatRoomAttachmentFile').hide();
            $('#oneQuickChatRoomProgressBar').show();
            var data = {
                data: {
                    session: getCookie('session'),
                    action: 'sendChatFile',
                    bytesArray: message,
                    name: $('#oneQuickChatRoomAttachmentFileName').text(),
                    chatId: chatId
                }};
            $.ajax({
                url: dashControllerUrl + '?' + window.location.search.substring(1),
                method: "POST",
                contentType: "application/json", // send as JSON
                data: JSON.stringify(data),
                crossDomain: true,
                xhr: function () {
                    var xhr = $.ajaxSettings.xhr();
                    xhr.upload.onprogress = function (evt)
                    {
                        var persent = Math.round((evt.loaded / evt.total) * 100);
                        $('#oneQuickChatRoomCurrenntUpload').css('width', persent + '%');
                    };
                    return xhr;
                },
                success: function (data) {
                    var response = JSON.parse(data);
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
                        $('#oneQuickChatRoomSendFile').prop('disabled', false);
                        $('#oneQuickChatRoomProgressBar').hide();
                        $('#oneQuickChatRoomControlsBox').show();
                    }
                }
            });
        }
        $('#oneQuickChatRoomInputField').text('');
    }

    self.quickChatReadMessages = function (chat) {
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

    self.setInputPlaceholderQuickChat = function (chatId) {
        var unfinishedMessageText = self.messagesBuffer(chatId);
        if (unfinishedMessageText == '') {
            $('#oneQuickChatRoomInputField').empty().append('<span class="input_pl">Enter your message...</div>');
        } else {
            $('#oneQuickChatRoomInputField').text(unfinishedMessageText);
        }
    }

    self.findSmileObjectQuickChat = function () {
        for (var i = 0, length = $("#oneQuickChatRoomInputField").find("object").length; i < length; i++) {
            $("#oneQuickChatRoomInputField").find("object").first().replaceWith($("#oneQuickChatRoomInputField").find("object").first().attr("title"));
        }
    }

    self.showQuickChatLocationMessage = function (lat, long) {
        var latlng = new google.maps.LatLng(lat, long),
                settings = {
                    zoom: 15,
                    center: latlng,
                    mapTypeControl: true,
                    mapTypeControlOptions: {style: google.maps.MapTypeControlStyle.DROPDOWN_MENU},
                    navigationControl: true,
                    navigationControlOptions: {style: google.maps.NavigationControlStyle.SMALL},
                    mapTypeId: google.maps.MapTypeId.ROADMAP
                },
                map = new google.maps.Map(document.getElementById("quickChatLocation"), settings),
                companyMarker = new google.maps.Marker({
                    position: latlng,
                    map: map,
                    title: "Marker"
                });
    }

    self.quickChatAddUserToContacts = function (userId) {
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

    self.quickChatCheckUserAllReadyInConatacts = function (userId) {
        var chats = dcc.chats;

        for (var i = 0, lenI = chats.length; i < lenI; i++) {
            for (var j = 0, lenJ = chats[i].chat_users.length; j < lenJ; j++) {
                if (chats[i].type == 0) {
                    if (chats[i].chat_users[j].id == userId) {
                        return false;
                    }
                }
            }
        }
        return true;
    }
    
    self.getMoreQuickChatMessages = function (chatId, time) {
        var data = {
            action: 'getMoreMessages',
            data: {
                chatId: chatId,
                time: time
            }
        };

        ezchatActionC.gettingMore = true;
        ezchatActionC.anchor = time;
        send(data);
    }
    
    self.messagesBuffer = (function ()
    {
        var MessagesBufferObj = {};
        return function (chatId, meesageText)
        {
            if (arguments.length == 1)
            {
                return MessagesBufferObj[chatId] || '';
            } else
            {
                MessagesBufferObj[chatId] = meesageText;
            }
        };
    })();
    
    self.getClipboardInfo = function (event) {
        var items = (event.clipboardData || event.originalEvent.clipboardData).items;
        for (var index in items) {
            var item = items[index];
            if (item.kind === 'file') {
                event.preventDefault();
                var blob = item.getAsFile(),
                    reader = new FileReader();
                reader.onload = function (e) {
                    $('#oneQuickChatRoomAttachmentFile').attr('data-src', e.target.result).attr('data-type', 2);
                    ;
                    $('#oneQuickChatRoomAttachmentFileName').text(curUserId + '_' + new Date().getTime() + '.jpg');
                    $('#oneQuickChatRoomAttachmentFileSize').text((e.total / 1000000).toFixed(2) + 'MB');
                    $('#oneQuickChatRoomControlsBox, #quickChatSmilesBox').hide();
                    $('#oneQuickChatRoomAttachmentFile, #oneQuickChatRoomCancelFile, #oneQuickChatRoomSendFile').show();
                    $("#quickChatUploadFile").val('');
                };
                reader.readAsDataURL(blob);
            }
        }
    }
    
    self.getUserLastVisitQuickChat = function (time) {
        var curTime = Math.round(new Date().getTime() / 1000),
            diff = curTime - time,
            minutes = 0, hours = 0, days = 0,
            returnTime = '';

        if (diff > 0) {
            minutes = Math.floor(diff / 60);
            hours = Math.floor(diff / 60 / 60);
            days = Math.floor(diff / 60 / 60 / 24);

            if (days > 0) {
                returnTime = days === 1 ? `${days} day ago` : `${days} days ago`;
            } else if (hours > 0) {
                returnTime = hours === 1 ? `${hours} hour ago` : `${hours} hours ago`;
            } else if (minutes > 0) {
                returnTime = minutes === 1 ? `${minutes} min ago` : `${minutes} mins ago`;
            } else {
                returnTime = '1 min ago';
            }
        } else {
            returnTime = '1 min ago';
        }
        return returnTime;
    }
    
    self.escapeHtml = function (string) {
        var entityMap = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
            '/': '&#x2F;',
            '`': '&#x60;',
            '=': '&#x3D;'
        };
        return String(string).replace(/[&<>"'`=\/]/g, function (s) {
            return entityMap[s];
        });
    }
    
}

quickChatC = new quickChatController();