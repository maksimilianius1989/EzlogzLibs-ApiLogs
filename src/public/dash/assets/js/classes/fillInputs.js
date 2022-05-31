function fillInputs() {
    var self = this;
    self.apiURL = '/db/api/apiFillInputsController.php'

    // Selects that we can fill due api
    self.quartersInput = $('#quarter_select');
    self.statesInput = $('#state_select');
    self.fuelTypeInput = $('#fuel_type');
    // RS EW-744 Fuel type for map to place data inside IFTA table
    self.fuelTypeInputForMap = $('#vehicle_fuel_type');
    self.truckInput = $('#truck_select');

    // Get data from php-controller and place it
    self.getData = function (inputs) {

        // Data for ajax request
        var data = {
            data:
            {
                action: 'getInputsData',
                inputs: inputs
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
            var response = $.parseJSON(data);
            // If we have response data
            if(response.code == '000') {
                // Iterate all data arrays
                for (var key in response.data.response) {
                    // If method exists
                    if (typeof window["fillInputs"]["generate" + key] === "function") {
                        // Call correct data method
                        window["fillInputs"]["generate" + key](response.data.response[key]); // succeeds
                    }
                    // /.If method exists
                }
                // /.Iterate all data arrays
            }
            // /.If we have response data
        })
        .fail(function() {
            // Print something here
        });
        // /.Ajax request to php-controller
    }




    // METHODS TO WORK WITH RESPONSE DATA
    // Work with quarters
    self.generatequarters = function (response) {
        self.quartersInput.html('');
        for (var key in response) {
            curr = response[key];
            if (!curr.title) {
                continue;
            }
            self.quartersInput.append('<option value="' + curr.year + '"  data-q="' + curr.quarter + '">' + curr.title + '</option>');
        }
    }
    // Work with states
    self.generatestates = function (response) {
        self.statesInput.html('');
        self.statesInput.append('<option value="" selected>All</option>');

        // Iterate first lavel (countries)
        for (var country in response) {

            // Create optgroup
            self.statesInput.append('<optgroup label="' + country + '">');

            // Iterate second lavel (states)
            for (var stateId in response[country]) {

                // If something wrong - continue
                var state = response[country][stateId];
                if (!state.name) {
                    continue;
                }

                var dataNonIfta = '0';
                if (state.short == 'AK' || state.short == 'HI') {
                    dataNonIfta = '1';
                }
                // Create option
                self.statesInput.append('<option value="' + state.short + '" data-name="' + state.name + '" data-nonifta="' + dataNonIfta + '">' + state.name + '</option>');
            }
            // /.Iterate second lavel (states)

            // Close optgroup
            self.statesInput.append('</optgroup>');
        }
        // /.Iterate first lavel (countries)

        self.hideNonIftaSelectOptions();
    }

    // Work with fuel types
    self.generatefuelType = function (response) {

        // Set default value
        self.fuelTypeInput.html('<option value="">All</option>');
        // Set other values
        for (var key in response) {
            curr = response[key];
            if (!curr.value) {
                continue;
            }
            // RS EW-778 Add default fuel to be selected on page load
            if (curr.default_value == 1) {
                var selected = ' selected="selected"';
            } else {
                var selected = '';
            }
            // Add value to fuel type
            self.fuelTypeInput.append('<option value="' + curr.value + '"' + selected + '>' + curr.value + '</option>');
            // RS EW-744 Fuel type for map to place data inside IFTA table
            self.fuelTypeInputForMap.append('<option value="' + curr.value + '"' + selected + '>' + curr.value + '</option>');
            // Add "All" value to truck select
            if (self.truckInput.find('.empty').length == 0) {
                self.truckInput.prepend('<option value="" data-fuel="' + curr.value + '"' + selected + '>All ' + curr.value + '</option>');
            }
        }
        if (self.truckInput.find('.empty').length == 0) {
            self.truckInput.prepend('<option class="empty" value="" data-fuel="">All</option>');
        }
        // And get trucks
        iftaGen.filterIftaTrucks();
    }

    // If hideNonIfta-checkbox is checked - lets hide nin-ifta states
    self.hideNonIftaSelectOptions = function () {
        if ($('#hideNonIfta').is(':checked')) {
            self.statesInput.find('[data-nonifta=1]').hide();
        } else {
            self.statesInput.find('[data-nonifta=1]').show();
        }
    }

}
var fillInputs = new fillInputs();