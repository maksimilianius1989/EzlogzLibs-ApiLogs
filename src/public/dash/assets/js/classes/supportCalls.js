function supportCalls() {
    var self = this;
    self.apiURL = '/db/api/apiSupportCallsController.php';
    self.apiAction = 'getCalls';
    self.onlyActive = 0; // Get only active calls, hide unactive
    self.unActiveTime = 60*60*1; // Show unactive calls only for last hour
    self.interval = 1000; // Call api every second (1000 milliseconds)
    self.intervalId = false; // We will call every second. So this is ID for our interval
    self.ringingStatus = 'Ringing'; // Status when user is ringing
    self.callConnectedStatus = 'CallConnected'; // Status when support-girl make an answer

    /*
    * Div where we place call-buttons
     */
    self.div = false; // Div where we will place buttons
    self.divId = 'supportMessages'; // Div tag ID
    self.divIdRight = '-9999px'; // Div tag right position (must be -110px, but we need to hide it, so set -9999px)

    // Style of created div
    self.divStyle = {
        position: 'fixed',
        'z-index': '9999',
        top: '60px',
        right: self.divIdRight,
        paddingRight: '20px',
        'max-height':'85vh',
        overflow: 'auto'
    };

    /*
    * Call-buttons
     */
    self.buttonTagName = 'span'; // Tag name of button
    self.buttonClass = 'btn btn-primary';
    self.buttonStyle = {
        margin: '5px',
        display: 'block'
    };
    self.buttonIconStyle = {
        'font-size': '28px'
    };


    // Get data from php-controller and place it
    self.getData = function ()
    {
        // Data for ajax request
        var data = {
            data:
                {
                    action: self.apiAction,
                    onlyActive: self.onlyActive, // Show only active call, no unactive
                    unActiveTime: self.unActiveTime // Time to show unactive calls, e.g. one hour after call finished
                }
        };

        // Ajax request to php-controller
        $.ajax({
            url: self.apiURL,
            method: "POST",
            contentType: "application/json", // send as JSON
            data: JSON.stringify(data)
        })
            .done(function(data) {

                // If data is not a valid json - maybe, some error
                try {
                    JSON.parse(data);
                } catch (e) {
                    // Finish requests
                    self.finish();
                    // Break
                    return false;
                }

                var response = $.parseJSON(data);
                var messagesIds = []; // ID's of all new messages

                // If we have response data
                if(response.code == '000') {

                    // If there is no div - draw div to place buttons there
                    if (!self.div) {
                        $('html').append('<div id="' + self.divId + '"></div>');
                        self.div = $('#' + self.divId);
                        self.div.css(self.divStyle);

                        $(document).on('mouseover', '#' + self.divId, function(){
                            $(this).css('right', '0px');
                        });

                        $(document).on('mouseout', '#' + self.divId, function(){
                            $(this).css('right', self.divIdRight);
                        });
                    }


                    messages = $.parseJSON(response.message);

                    // Iterate all data arrays
                    for (var key in messages) {

                        var message = messages[key];

                        // If message exists
                        if (typeof(message.sessionId) != 'undefined' && message.sessionId !== null) {

                            // Save messages
                            messagesIds.push(self.createId(message));

                            // Draw button
                            self.drawButton(message);
                        }
                        // /.If message exists
                    }
                    // /.Iterate all data arrays
                } else {
                    // Finish requests
                    self.finish();
                }
                // /.If we have response data

                // Destroy old buttons
                self.destroyButtons(messagesIds);
            })
            .fail(function() {
                self.finish();
            });
        // /.Ajax request to php-controller
    }

    // Create button's ID
    self.createId = function (message)
    {
        return 'message' + message.sessionId + message.status;
    }

    // Start API calls
    self.start = function ()
    {
        // Start callin' to api every second
        self.intervalId = setInterval(
            function() {
                self.getData()
            },
            self.interval
        );
    }

    // Finish API calls
    self.finish = function ()
    {
        clearInterval(self.intervalId);
        self.intervalId = false;
    }

    // Place button to open client's info
    self.drawButton = function (message)
    {
        var exists = self.div.find('#' + self.createId(message));
        if (!exists.length) {
            self.div.prepend('<' + self.buttonTagName + ' id="' + self.createId(message) + '"></' + self.buttonTagName + '>');
            var button = $('#' + self.createId(message));

            // Add function to display user info
            if (typeof message.userId != 'undefined' && message.userId !== null) {
                button.attr('onclick', 'showProfilePopup(' + message.userId + ', this, event);return false;');
                var usertext = 'user ' + message.userId;
            } else {
                var usertext = 'NO user';
            }

            // Add style
            button.addClass(self.buttonClass);
            button.css(self.buttonStyle);

            // Check if it is own call (call to current user)
            if (typeof message.own != 'undefined' && message.own !== null && message.own == 1) {
                // Nothing to do if it is own call
            } else {
                // Make call transparent
                button.css('opacity', '0.4');
            }

            // Add phone icon
            if (message.status == self.ringingStatus) {
                button.addClass('active');
                var i = '<i class="fa fa-volume-control-phone" style="float:left;color:#00ff00;"></i>';
            } else if (message.status == self.callConnectedStatus) {
                button.addClass('active');
                var i = '<i class="fa fa-volume-control-phone" style="float:left;color:#0000ff;"></i>';
            } else {
                var i = '<i class="fa fa-phone" style="float:left;color:#ff0000;"></i>';
            }

            // Append html
            button.append('<div>' + i + message.from + '<br>' + self.timestampToTime(message.startedAt) + ', ' + usertext + '</div>');
            button.find('i').css(self.buttonIconStyle);

            // Shake phone icon
            if (message.status == self.ringingStatus) {
                button.find('i').effect("shake");
            }

            // Automatically show popup
            if (typeof message.needToShow != 'undefined' && message.needToShow !== null && message.needToShow == 1) {
                button.click();
            }

        }
    }

    // Destroy old buttons
    self.destroyButtons = function (messagesIds)
    {
        // If there is no dif (first start) - return false
        if (!self.div || typeof self.div == 'undefined' || self.div === null) {
            return false;
        }

        // If there are no elements - return false
        var tags = self.div.find(self.buttonTagName);
        if (tags.length == 0) {
            return false;
        }

        // Iterate all existed buttons
        tags.each(function(i, el){

            // If button is not in new response
            if ($.inArray( $(this).attr('id'), messagesIds ) == -1) {
                $(this).remove();
            }
            // /.If button is not in new response

        });
        // /.Iterate all existed buttons
    }

    self.timestampToTime = function (timestamp)
    {
        var date = new Date(timestamp * 1000);
        // Hours part from the timestamp
        var hours = date.getHours();
        var minutes = "0" + date.getMinutes();

        // Will display time in 10:30:23 format
        return hours + ':' + minutes.substr(-2);

    }
}

// Init class
var supportCalls = new supportCalls();
// Start callin' to api
supportCalls.start();