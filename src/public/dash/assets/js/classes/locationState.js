function LocationState() {
    var self = this;
    this.getStates = function () {
        return locationStates;
    };
    this.getStateNameById = function (id) {
        var stateRet = {};
        $.each(locationStates, function (key, state) {
            if (state.id == id) {
                stateRet = state;
                return false;
            }
        })
        return stateRet.name;
    };
    this.getStateById = function (id) {
        var stateRet = {};
        $.each(locationStates, function (key, state) {
            if (state.id == id) {
                stateRet = state;
                return false;
            }
        })
        return stateRet;
    };
    this.getStateByShortName = function (shName) {
        var stateRet = {};
        $.each(locationStates, function (key, state) {
            if (state.short == shName) {
                stateRet = state;
                return false;
            }
        })
        return stateRet;
    };
    this.getStateByName = function (name) {
        var stateRet = {};
        $.each(locationStates, function (key, state) {
            if (state.name == name) {
                stateRet = state;
                return false;
            }
        })
        return stateRet;
    };
}

if (typeof locationState == 'undefined') {
    var locationState = new LocationState();
}
