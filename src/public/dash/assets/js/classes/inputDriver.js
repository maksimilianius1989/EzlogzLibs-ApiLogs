function inputDriver(params){
    var self = this;
    this.driversList = [];
    this.inputElement = $('#'+params.elementId); 
    this.init = function(){
        var driversLimitedList = [];
        $.each(fleetC.fleetTeams, function(key, team){
            if(team.params.dispatchers.indexOf(parseInt(curUserId)) > -1){
                driversLimitedList = team.params.drivers;
            }
        })
        if(typeof fleetC.fleetUsers != 'undefined'){
            $.each(fleetC.fleetUsers, function(key, user){
                if(!isDriver(user.companyPosition) || (driversLimitedList.length > 0 && driversLimitedList.indexOf(parseInt(user.id)) == -1)){
                    return true;
                }
                self.driversList.push(user.name+' '+user.last);
            }); 
        }
        self.inputElement.autocomplete({
			source: function (request, response) {
				var results = $.map(self.driversList, function (tag) {
					if (tag.toUpperCase().indexOf(request.term.toUpperCase()) != -1) {
						return tag;
					}
				});
				response(results.slice(0, 15));
			},
            select: function(){
                self.inputElement.trigger('change');
            },
            close: function(){
                self.inputElement.trigger('change');
            },
            search: function(){
                c('search');
            },
            change: function(){
                c('change');
            }
        });
    };
    self.init();
    self.inputElement.off('keyup');
}