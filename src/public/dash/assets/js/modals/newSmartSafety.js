function newSmartSafety () {
    var self = this;
    var selectedFleetId = null;
    var selectedUserId = null;
    var pending = false;

    this.findFleets = function(el) {
        var name = $(el).val();
        AjaxController('findFleets', {name:name}, adminUrl, self.findFleetsByNameHandler, errorBasicHandler, true);
    };
    this.findFleetsByNameHandler = function (response) {
        $('#fleetList').empty();

        $.each(response.data, function(key, fleet){
            fleet.name = fleet.name.replace(/ /g,'-');
            $('#fleetList').append(`<li><a onclick="self.selectFleet(this);" data-id="${fleet.id}" href="#">(${fleet.usdot}) ${fleet.name}</a></li>`);
            $('#fleetList li a[data-id="'+fleet.id+'"]').data(fleet);
        });
        if(response.data.length == 0){
            $('#fleetList').append(`<li><a href="#">No fleets</a></li>`);
        }
    };
    this.selectFleet = function (element) {
        selectedFleetId = $(element).data('id');
        $('#fleet_select').attr('data-id',selectedFleetId).val($(element).text());
    };
    this.findUsers = function(el) {
        var name = $(el).val();
        AjaxController('getUsersToAddSmartSafety', {name:name, fleetId:selectedFleetId, onlyAdmin: 1}, apiDashUrl, self.findFleetUsersByNameHandler, errorBasicHandler, true);
    };
    this.findFleetUsersByNameHandler = function (response) {
        $('#userList').empty();
        $.each(response.data.users, function(key, user){
            $('#userList').append(`<li><a href="#" data-id='${user.id}' onclick="self.selectUser(this);">(${user.email}) ${user.name} ${user.last}</a></li>`);
        });
        if(response.data.length == 0){
            $('#userList').append(`<li><a href="#">No users</a></li>`);
        }
    };
    this.selectUser = function (element) {
        selectedUserId = $(element).data('id');
        $('#user_select').attr('data-id',selectedUserId).val($(element).text());
    };
    this.createModal = function () {
        var view = `
            <form id="addSmartSafetyForm">
                <label>Fleet</label>
                <div class="row">
                    <div class="col-xs-12">
                        <input id="fleet_select" class="form-control" type="text" onfocus="self.findFleets(this)" onkeyup="self.findFleets(this)" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" autocomplete="custom" />
                        <ul class="dropdown-menu" id="fleetList"></ul>
                    </div>
                </div>
                <label>User</label>
                <div class="row">
                    <div class="col-xs-12">
                        <input id="user_select" class="form-control" type="text" onfocus="self.findUsers(this)" onkeyup="self.findUsers(this)" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" autocomplete="off" />
                        <ul class="dropdown-menu" id="userList"></ul>
                    </div>
                </div>
                <br>
                <div class="row">
                    <div class="col-xs-12">
                        <label>30 days free trial: </label>
                        <input id="trial_period" type="checkbox" />
                    </div>
                </div>
                <div class="error-handler"></div>
                <button type="button" class="btn btn-default btn-lg btn-block mt-4" onclick="self.addSmartSafety()">Enable Smart Safety</button>
            </form>
        `;

        showModal('Add Smart Safety', view, 'addSmartSafety', '');
    };

    this.addSmartSafety = function () {
        if (pending == false) {
            pending = true;
            $('.error-handler').text('');
            if (selectedUserId == null) {
                $('.error-handler').text('User not selected');
                pending = false;
            } else {
                var trial = 0;

                if ($('#trial_period').is(":checked")) {
                    trial = 1;
                }

                AjaxController('addSmartSafetyToUser', {user_id: selectedUserId, trial: trial}, apiAdminUrl, self.addSmartSafetyResponseHandler, errorBasicHandler, true);
            }
        }
    };

    this.addSmartSafetyResponseHandler = function(response) {
        pending = false;
        if (response.code == '000') {
            selectedFleetId = null;
            selectedUserId = null;
            $('#addSmartSafety').remove();
            window.location.reload();
        } else {
            $('.error-handler').text(response.message);
        }
    };

    self.createModal();
}