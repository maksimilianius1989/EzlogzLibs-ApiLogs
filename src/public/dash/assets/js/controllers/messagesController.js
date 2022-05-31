function messagesConrtollerClass() {
    var self = this;
    self.showMessageSendOptions = function(){
        $('#chat_el .send_options').toggle();
    }
    self.toggleEmojiBlock = function() {
        $('.emoji-block').toggle();
    }
    self.toggleMobileMessage = function() {
        $('.fa-caret-left').toggleClass('fa-caret-right');
        $('.message-box .message-body .right-content').toggleClass('display');
    }
    self.chatBoxKeyUp = function(e){
        if(e.which == 13){self.sendMessageTrigger()}
    }
    self.sendMessageTrigger = function(toAll = false){
        var message = $('#chat_input').val();
        if ($.trim(message) == '') {
            return false;
        }
        var userId = $('#chat_input').attr('data-id');
        var type = $('#chat_input').attr('data-type');
        if(typeof type == 'undefined'){
            type = 0;
        }
        if(toAll){
            $('#messages_box > div').each(function(){
                self.sendMessage(emojione.escapeHTML(message), $(this).attr('data-id'), type);
            })
        }else{
            self.sendMessage(emojione.escapeHTML(message), userId, type);
        }
    }
    self.sendMessage = function(message, userId, type){
        if(message == '' || userId == '')
        return;
        var data = {
            action:'sendFleetMessage', 
            data: {
                action: 'sendUserMessage',
                message:message, 
                userId:userId,
                type:type
            }
        };
        send(data);
    }
}
messagesConrtoller = new messagesConrtollerClass();


