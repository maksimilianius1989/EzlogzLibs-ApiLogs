$().ready(function ()
{
    var copiedFromMessageId = 0;
    var copiedOriginalText = 0;
    var copiedFromName = '';
    var copiedFromMessageTime = '';
    $(document).on("paste", "#input_field", function (e) {
        var time = ezchatActionC.toTime(copiedFromMessageTime / 1000);
        var date = ezchatActionC.toDate(copiedFromMessageTime / 1000);
        var nowTime = new Date().getTime();
        var curDate = ezchatActionC.toDate(nowTime / 1000);
        if (curDate == date) {
            date = 'Today';
        }
        var txt = e.originalEvent.clipboardData.getData('text/plain');
        
        if (copiedOriginalText != 0 && copiedOriginalText.replace(/\r\n|\r|\n/g, "") == e.originalEvent.clipboardData.getData('text/plain').replace(/\r\n|\r|\n/g, "")) {
            txt = '<quote contenteditable="false"><span>' + copiedFromName + ', ' + date + ' at ' + time + ':</span><br><q>' + txt.replace(/\r\n|\r|\n/g, "<br>") + '</q></quote><br><br>';
        }
        $('#input_field').html($('#input_field').html() + '' + txt);

        ezchatActionC.placeCaretAtEnd(document.getElementById("input_field"));
        e.preventDefault();
    });
    $(document).on("cut copy", "#chat_el .chat_msg", function (e) {
        copiedOriginalText = ezchatActionC.getSelectionText();
        copiedFromMessageId = $(this).closest('.chat_one_msg').attr('data-messageid');
        var chatId = $('#file_upload').attr('data-id');
        var chatInfo = dcc.getChatById(chatId);
        var userId = 0;
        copiedFromMessageTime = $(this).closest('.chat_one_msg').attr('data-time');
        $.each(chatInfo.chat_messages, function (key, message) {
            if (message.id == copiedFromMessageId) {
                userId = message.userId;
                return true;
            }
        });
        if (userId == 0) {
            return true;
        }
        copiedFromName = '';
        $.each(chatInfo.chat_users, function (key, user) {
            if (user.id == userId) {
                copiedFromName = user.login;
                return true;
            }
        });
    });
    $(document).bind("mousedown", function (e)
    {
        if (!$(e.target).parents("#user_info").length > 0 && $(e.target).attr('id') != "user_info" &&
                !$(e.target).parents(".find_user_box").length > 0 && $(e.target).attr('class') != "find_user_box" &&
                !$(e.target).parents("#roomParticipantsBox").length > 0 && $(e.target).attr('id') != "roomParticipantsBox" && $(e.target).attr('id') != "ezchatRoomParticipants" &&
                !$(e.target).parents(".create_group_box").length > 0 && $(e.target).attr('class') != "create_group_box" &&
                !$(e.target).parents("#chat_info").length > 0 && $(e.target).attr('id') != "chat_info" &&
                !$(e.target).parents('.can_invite.in_room').length > 0 && $(e.target).attr('id') != "invite" &&
                !$(e.target).parents('#status_options').length > 0 && $(e.target).parents('#status_options').attr('id') != "status_options" && $(e.target).attr('id') != "status_options" &&
                !$(e.target).parents(".custom-menu").length > 0 &&
                (!$(e.target).parents("#ezchatShowFile").length > 0 && $(e.target).attr('class') != "popup_box_panel" && $(e.target).attr('id') != "ezchatShowFile"))
        {
            $('#user_info').hide(300);
            $('#chat_info').hide(300);
            $('#status_options').hide(300);
            $(".custom-menu").hide(300);
            $('.find_user_box').hide(300);
//            $('.create_group_box').hide(300);
            $('.can_invite.in_room').slideUp();
            $('#roomParticipantsBox').slideUp();
            $('#ezchatAttachmentBox').hide();
            $('#ezchatShowFile').empty();
        }
    });
    $('body').on('focus', '#input_field', function ()
    {
        $('.input_pl').remove();
    });
    $('body').on('focusout', '#input_field', function ()
    {
        if ($(this).text() == '') {
            ezchatActionC.setInputPlaceholder();
        }
        ;
    });
    $("body").on("click", ".one_box2", function ()
    {
        $("#chat_bg").hide();
        $("#chat_el").show();
    });
    $('body').on('click', '#smilesBox img', function () {
        var newEl = $(this).clone();
        $('.input_pl').remove();
        ezchatActionC.convert(newEl);
        $('#input_field').scrollTop($("#input_field")[0].scrollHeight);
    });
    $(window).click(function () {
        if ($('#smilesBox').is(':visible')) {
            $('#smilesBox').hide();
            c('hide smiles');
        }
    });
    $('body').on('click', '#smilesBox', function (event) {
        event.stopPropagation();
    });
});