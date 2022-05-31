var iftaReportGenerator = function () {
    var self = this;
    this.ifta_data = null;
    this.records = null;
    this.rates = {};
    this.mpg = 0;
    this.fuelt_type = null;
    this.states = {};
    this.detailed = {};
    this.fuelDetailed = {};
    this.trucks = {};
    this.allFuelTypes = {};
    this.totMiles = 0;
    this.taxMiles = 0;
    this.taxGals = 0;
    this.totFuel = 0;
    this.totNetGals = 0;
    this.totalTaxDue = 0;
    this.totalDue = 0;
    this.totPurchasedGallons = 0;
    this.totalInterestDue = 0;
    this.newCounter = 1;
    this.listOfButtons = [];
    this.listOfButtons.push('<button onclick="iftaGen.removeState(this);">Remove</button><button onclick="iftaGen.showDetails(this);">Details</button>')
    this.statesSelect = {};

    // Tables with trips and fuels reports.
    this.table2 = false;
    this.table3 = false;

    // RS: bootstrap's tables, we need 'em to destroy before reload new information
    this.tripReportsTable = false;
    this.fuelPurchasesTable = false;

    // States that contain surcharge
    this.surchargeStates = ['IN', 'VA', 'KY'];
    // Additional text for Surcharge, also need to be replaced in makeIftaPrintControlled
    this.surchargeText = '-Surcharge';
    // Non-IFTA jurisdiction states
    this.nonIftaStates = ['AK', 'HI', 'NU', 'NT', 'YT']; // Non-IFTA states
    // Additional text for non-IFTA state, also need to be replaced in makeIftaPrintControlled ($nonIftaRegex)
    this.nonIftaText = ' (Non-IFTA)';

    // RS Show detailed info about trip
    this.showDetails = function (t) {
        showModal(
            $(t).closest('td').find('.tripTitle').html(), // Title
            $(t).closest('td').find('.tripInfo').html(), // Message
            false
        );
    }
    this.initData = function (
            ifta_data, // Ifta report for pdf-print
            fuelt_type, // Selected in form fuel type. Can be one or All, cannot be several
            states, // States (return by api)
            detailed,  // Detailed information about each day trip (return by api)
            fuelDetailed, // Detailed refueling information (return by api)
            trucks, // Trucks array (return by api)
            allFuelTypes, // All available fuels array
            quarter, // Reporting quarter
            year, // Reporting year
            hideNonIfta // Checkbox whether hide or not non-ifta states
    ) {
        // If user set fuel type - use only it, else use full array
        if (!allFuelTypes || fuelt_type != '') {
            allFuelTypes = [fuelt_type];
        }

        self.allFuelTypes = allFuelTypes;
        self.quarter = quarter;
        self.year = year;

        // Remove previous info, e.g. clear table
        $('.state_row').remove();

        // Set totals to zeros
        self.resetTotals();
        
        // RS: save detailed information to show it in modal
        self.detailed = detailed;
        self.fuelDetailed = fuelDetailed;
        
        // RS: Save trucks
        for (let i = 0; i < trucks.length; i++) {
            var truck = trucks[i];
            self.trucks[truck['id']] = truck;
        }
        // Iterate all type of fuel
        for (let i = 0; i < self.allFuelTypes.length; i++) {
            self.ifta_data = ifta_data;
            self.records = ifta_data.RECORD;
            self.states = states;

            // RS: предыдущий разработчик зачем-то удалил из отчёта два штата: Гавайи и Аляску.
            // Возможно, потому, что они не входят в ИФТА-юрисдикцию
            // Мною решено их вернуть в отчёт (для штата Орегон), но пометить как non-ifta jurisd.
            // Также CU может отметить чекбокс "hideNonIfta", в этом случае их таки скрываем
            if (hideNonIfta === true) {
                for (var state = 0; state < self.nonIftaStates.length; state++) {
                    delete self.states[ self.nonIftaStates[state] ];
                }
            }

            self.fuelt_type = self.allFuelTypes[i];
            for (var state in self.states) {

                if (!self.states.hasOwnProperty(state)) {
                    continue;
                }
                for (var fuel in state) {
                    if (!state.hasOwnProperty(fuel)) {
                        continue;
                    }
                    if (self.fuelt_type != '' && fuel != self.fuelt_type) {
                        delete self.states[state][fuel];
                    }
                }
            }
            for (var state in self.states) {
                if (!self.states.hasOwnProperty(state)) {
                    continue;
                }
                var stateFuelData = self.states[state][self.fuelt_type];
                if (typeof(stateFuelData) == 'undefined' || stateFuelData === null || typeof(self) == 'undefined' || self === null) {
                    continue;
                }
                stateFuelData.distance = parseFloat(stateFuelData.distance);
                stateFuelData.taxDistance = parseFloat(stateFuelData.distance);
                stateFuelData.fuel = toFixedFloat(stateFuelData.fuel, 4);
                stateFuelData.interestDue = 0;


                if (stateFuelData.distance == 0 && stateFuelData.fuel == 0) {
                    delete self.states[state];
                }
            }
            self.prepareRates();
            self.generateReport();
        }
        // /.Iterate all type of fuel
        this.showDownloadButton();
    }
    this.removeState = function (el) {
        var oldNewState = $(el).closest('tr').attr('data-state');
        if ($.inArray( oldNewState, self.surchargeStates ) != '-1') {
            $('.state_row[data-td="sur_' + oldNewState + '"]').remove();
        }
        $(el).closest('tr').remove();
        for (var state in self.states) {
            if (state == oldNewState) {
                delete self.states[state];
            }
        }
        self.prepareStatesData();

    }
    this.addState = function () {
        var fSt = {};
        fSt[self.fuelt_type] =
            {distance: 0,
                fuel: 0,
                taxDistance: 0,
                interestDue: 0};
        self.states['new_' + self.newCounter] = fSt;
        self.newCounter++;
        self.prepareStatesData();
    }
    this.prepareRates = function () {
        var nextSurcharge = false;
        var first = 0;
        self.statesSelect = {};
        for (var x = 0; x < self.records.length; x++) {
            var rec = self.records[x];
            var jur = rec.JURISDICTION;
            self.statesSelect[jur] = x;
            if ($.inArray( jur, self.surchargeStates ) != '-1') {
                if (first == 0) {
                    first = 1;
                    var fJur = 'Surch_' + jur;
                }
                if (nextSurcharge) {
                    jur = 'Surch_' + jur;
                    nextSurcharge = !nextSurcharge;
                } else if (!nextSurcharge) {
                    nextSurcharge = !nextSurcharge;
                }

            }


            // RS EW 769: Add rates to ifta states
            var $rates = rec.RATE;
            self.rates[jur] = this.setRates(jur, $rates);

            // Rates for surcharge
            if (first == 1) {
                first = 2;
                self.rates[fJur] = this.setRates(fJur, $rates);
            }
        }

        // RS EW 769: Add zero tax rate to non-ifta states
        for (var x = 0; x < self.nonIftaStates.length; x++) {
            self.rates[self.nonIftaStates[x]] = this.setRates(self.nonIftaStates[x], null);
        }

    }

    // RS EW-769: 2020-06-25 - group rates generation
    this.setRates = function (state, rates) {

        // If it is non-ifta state - lets create zero-rates
        if (typeof rates === 'undefined' || rates == null) {
            var rates = [];
            for (let i_count = 0; i_count < 30; i_count++) {
                rates[i_count] = 0;
            }
        }

        // Create rates object
        var obj = {};
        obj.rates = {};
        obj.state = state;

        // Rates for US
        obj.rates.US = {
            Gasoline: rates[0],
            Diesel: rates[2],
            Gasohol: rates[4],
            Propane: rates[6],
            LNG: rates[8],
            CNG: rates[10],
            Ethanol: rates[12],
            Methanol: rates[14],
            E85: rates[16],
            M85: rates[18],
            A55: rates[20],
            Biodiesel: rates[22],
            Hydrogen: rates[24],
            Electric: rates[26]
        };

        // Rates for Canada
        obj.rates.CAN = {
            Gasoline: rates[1],
            Diesel: rates[3],
            Gasohol: rates[5],
            Propane: rates[7],
            LNG: rates[9],
            CNG: rates[11],
            Ethanol: rates[13],
            Methanol: rates[15],
            E85: rates[17],
            M85: rates[19],
            A55: rates[21],
            Biodiesel: rates[23],
            Hydrogen: rates[25],
            Electric: rates[27]
        };
        return obj;
    }

    this.prepareStatesData = function () {
        for (var state in self.states) {
            if (
                !self.states.hasOwnProperty(state)
                || state.indexOf("new_") > -1
                // || typeof self.rates[state] == 'undefined'
            ) {
                continue;
            }
            var stateFuelData = self.states[state][self.fuelt_type];
            if (typeof(stateFuelData) == 'undefined' || stateFuelData === null || typeof(self) == 'undefined' || self === null) {
                continue;
            }
            // RS EW-769: If there are no taxes, but state exists (non-ifta state)
            if (typeof self.rates[state] == 'undefined' || self.rates[state] === null) {
                self.rates[state].rates.US[self.fuelt_type] = 0;
                self.rates[state].rates.CAN[self.fuelt_type] = 0;
            }
            // RS EW-769: If distance is not zero but less then one (e.g. 300 meters) - set it as "one", not zero
            stateFuelData.distance = parseFloat(stateFuelData.distance);

            // RS EW-769: by default we don't know taxable distance sot set it as distance
            stateFuelData.taxDistance = parseFloat(stateFuelData.distance);
            stateFuelData.fuel = isNaN(parseFloat(stateFuelData.fuel)) ? 0 : parseFloat(stateFuelData.fuel);
            stateFuelData.ratesUSFuelType = self.rates[state].rates.US[self.fuelt_type];

            // EW-769: Calculate taxable gallons
            if (stateFuelData.taxDistance == 0 || stateFuelData.distance == 0 || stateFuelData.fuel  == 0) {
                stateFuelData.mpg = 0;
                stateFuelData.taxGallons = 0;
            } else {
                stateFuelData.mpg = (stateFuelData.distance / stateFuelData.fuel).toFixed(4);
                stateFuelData.taxGallons = toFixedFloat(stateFuelData.taxDistance / stateFuelData.mpg, 2);
            }

            // RS EW-769: from 2020-06-25 we added "taxable" checkbox, so now we know taxFuel
            if (typeof(stateFuelData.taxFuel) == 'undefined' || stateFuelData.taxFuel === null) {
                stateFuelData.purchasedGallons = 0;
            } else {
                stateFuelData.purchasedGallons = toFixedFloat(stateFuelData.taxFuel, 2);
            }

            stateFuelData.interestDue = toFixedFloat(stateFuelData.interestDue, 2);
            stateFuelData.netTaxGallons = parseFloat(stateFuelData.taxGallons - stateFuelData.purchasedGallons);
            stateFuelData.taxDue = toFixedFloat(stateFuelData.ratesUSFuelType * stateFuelData.netTaxGallons, 2);
            stateFuelData.totalDue = toFixedFloat(stateFuelData.ratesUSFuelType * stateFuelData.netTaxGallons + stateFuelData.interestDue, 2);
        }
    }

    // Set default total values
    this.resetTotals = function () {
        self.totMiles = 0;
        self.taxMiles = 0;
        self.taxGals = 0;
        self.totFuel = 0;
        self.totNetGals = 0;
        self.totPurchasedGallons = 0;
        self.totalTaxDue = 0;
        self.totalDue = 0;
        self.totalInterestDue = 0;
    }

    // RS EW-744 Generate one row
    this.generateRow = function(
        state, // State Short, e.g. AL or WY
        stateName, // State with suffix, e.g. WY-Surcharge
        fuelt_type, // Fuel short name, e.g. G or A55
        distance, // Total distance
        taxDistance, // Taxable distance, usually = distance
        mpg, // Miles per gallon
        taxGallons, // Taxable gallons, usually = all gallons from documents table
        purchasedGallons, // Purchased gallons, usually = 0
        netTaxGallons, // Net taxable gallons = taxGallons - purchasedGallons
        ratesUSFuelType, // Rates
        taxDue, // Tax due = netTaxGallons * ratesUSFuelType
        interestDue, // Interest Due, we don't know so = 0
        totalDue, // Total due = taxDue + interestDue
        stateDataPrefix, // state-data prefix
        showActions, // Show or don't show actions col,
        isEditable // Is this row is editable
    ){
        // Create actions
        var actions = '';
        if (showActions) {
            actions = addTableActionRow(self.listOfButtons) + // Buttons
                self.getDetailedTitle(stateName) + // Title for "detailed" modal
                self.getDetailedMessage(stateName, fuelt_type); // Message for "detailed" modal
        }

        // Set this row editable
        var editable = '';
        var countable = '';
        if (isEditable) {
            editable = ' editable';
            countable = ' countable';
        }

        // Create one row
        var tr = $('<tr class="state_row" data-td="' + stateDataPrefix + state + fuelt_type + '" data-state="' + stateDataPrefix + state + '" data-fuel="' + fuelt_type + '"></tr>');
		tr.append('<td class="state_td">' + stateName + '</td>');
		tr.append('<td>' + fuelt_type + '</td>');
		tr.append('<td class="state_distance' + editable + countable + '" data-tag="distance">' + distance + '</td>');
		tr.append('<td class="state_taxDistance' + editable + countable + '" data-tag="taxDistance">' + taxDistance + '</td>');
        tr.append('<td class="state_mpg' + editable + countable + '" data-tag="mpg">' + mpg + '</td>');
		tr.append('<td class="state_taxGallons' + editable + countable + '" data-tag="taxGallons">' + taxGallons + '</td>');
		tr.append('<td class="state_gallons' + editable + countable + '" data-tag="purchasedGallons">' + purchasedGallons + '</td>');
		tr.append('<td class="state_netTaxGallons' + countable + '" data-tag="netGallons">' + netTaxGallons + '</td>');
		tr.append('<td class="state_ratesUSFuelType" data-tag="taxRate">' + ratesUSFuelType + '</td>');
		tr.append('<td class="state_taxDue' + countable + '" data-tag="taxDue">' + taxDue + '</td>');
		tr.append('<td class="state_interestDue' + editable + countable + '" data-tag="interestDue">' + interestDue + '</td>');
		tr.append('<td class="state_totalDue' + countable + '" data-tag="totalDue">' + totalDue + '</td>');
		tr.append('<td class="ifta_actions">' + actions + '</td>');

		// Return this row
		return tr;
    }

    this.generateView = function () {
        for (var state in self.states) {
            if (
                !self.states.hasOwnProperty(state)
                || state.indexOf("new_") > -1
                // || typeof self.rates[state] == 'undefined'
            ) {
                continue;
            }
            var stateFuelData = self.states[state][self.fuelt_type];



            if (typeof(stateFuelData) == 'undefined' || stateFuelData === null || typeof(self) == 'undefined' || self === null) {
                continue;
            }
            if (stateFuelData.distance == 0 && (stateFuelData.fuel == 0 || isNaN(parseFloat(stateFuelData.fuel)))) {
                continue;
            }
            // Add text to non-ifta jurisdiction states
            var stateName = state;
            if ($.inArray( state, self.nonIftaStates ) != '-1') {
                stateName = state + self.nonIftaText;
            }

            // RS EW-744 Add row to table
            var row = this.generateRow(
                    state,
                    stateName,
                    self.fuelt_type,
                    stateFuelData.distance,
                    stateFuelData.taxDistance,
                    stateFuelData.mpg,
                    stateFuelData.taxGallons,
                    stateFuelData.purchasedGallons,
                    stateFuelData.netTaxGallons,
                    stateFuelData.ratesUSFuelType,
                    stateFuelData.taxDue,
                    stateFuelData.interestDue,
                    stateFuelData.totalDue,
                    '', // state-data prefix
                    true, // Show actions
                    true // Is this row editable
                );
            $('#result tbody').append(row);

            if ($.inArray( state, self.surchargeStates ) != '-1') {
                var ratesUSFuelTypeS = self.rates['Surch_' + state].rates.US[self.fuelt_type];
                var taxDueS = toFixedFloat(ratesUSFuelTypeS * stateFuelData.taxGallons, 2);
                var totalDueS = taxDueS;

                // RS EW-744 Add row to table
                var row = this.generateRow(
                    state,
                    stateName + self.surchargeText,
                    self.fuelt_type,
                    '',
                    '',
                    '',
                    stateFuelData.taxGallons,
                    '',
                    stateFuelData.taxGallons,
                    ratesUSFuelTypeS,
                    taxDueS,
                    '',
                    totalDueS,
                    'sur_', // state-data prefix
                    false, // Show actions
                    false // Is this row editable
                );
                $('#result tbody').append(row);
            }
        }

        this.showDownloadButton();
        $('#filter .loading_gif').hide();
        $('#create_ifta').removeAttr("disabled").addClass('hov');
    }
    // Show save-pdf button
    this.showDownloadButton = function () {
        $('#save_pdf').show().removeClass('hidden');
        return false;
    }

    this.selectNewState = function (el) {
        var newState = $(el).val();
        var oldNewState = $(el).closest('tr').attr('data-state');
        if (newState == '' || newState == 0) {
            return false;
        }


        for (var state in self.states) {
            if (state == oldNewState) {
                self.states[newState] = self.states[oldNewState];
                delete self.states[state];
                var ratesUSFuelType = self.rates[newState].rates.US[self.fuelt_type];
                // Add text to non-ifta jurisdiction states
                var stateName = newState;
                if ($.inArray( newState, self.nonIftaStates ) != '-1') {
                    stateName = newState + self.nonIftaText;
                }

                // RS EW-744 Add row to table
                var row = this.generateRow(
                    newState,
                    stateName,
                    self.fuelt_type,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    ratesUSFuelType,
                    0,
                    0,
                    0,
                    '', // state-data prefix
                    true, // Show actions
                    true // Is this row editable
                );
                $('#result tbody').append(row);

                if ($.inArray( newState, self.surchargeStates ) != '-1') {
                    var ratesUSFuelTypeS = self.rates['Surch_' + newState].rates.US[self.fuelt_type];

                    // RS EW-744 Add row to table
                    var row = this.generateRow(
                        newState,
                        newState + self.surchargeText,
                        self.fuelt_type,
                        '',
                        '',
                        '',
                        0,
                        '',
                        0,
                        ratesUSFuelTypeS,
                        0,
                        '',
                        0,
                        'sur_', // state-data prefix
                        false, // Show actions
                        false // Is this row editable
                    );
                    $('#result tbody').append(row);

                }
                break;
            }
        }
        self.prepareStatesData();
    }
    this.getStatesSelect = function () {
        var statesOpts = '<select onchange="iftaGen.selectNewState(this)"><option value="0">Select State</option>';
        $.each(self.statesSelect, function (st_rate, st1) {
            var free = true;
            $.each(self.states, function (st_used, st2) {
                if (st_used == st_rate) {
                    free = false;
                }
            });
            if (free) {
                statesOpts += '<option>' + st_rate + '</option>';
            }
        });
        statesOpts += '</select>';
        return statesOpts;
    }
    this.generateReport = function () {
        self.prepareStatesData();
        self.generateView();
    }
    this.updateStateValue = function (el, param) {
        var state = $(el).closest('tr').attr('data-state');
        var fuel = $(el).closest('tr').attr('data-fuel');
        var newVal = $(el).val();

        if (newVal == '') {
            newVal = 0;
        }
        if (param == 'distance' || param == 'taxDistance') {
            newVal = parseInt(newVal);
        } else {
            newVal = toFixedFloat(newVal, 1);
        }
        newVal = Math.min(9999999, newVal);
        newVal = Math.max(0, newVal);
        newVal = isNaN(newVal) ? 0 : newVal;
        // RS: Tax distance can not be more than distance
        if (param == 'taxDistance' && iftaGen.states[state][fuel].distance < newVal) {
            newVal = iftaGen.states[state][fuel].distance;
        }
        if (param == 'distance' && iftaGen.states[state][fuel].taxDistance > newVal) {
            newVal = iftaGen.states[state][fuel].taxDistance;
        }
        // /.RS: Tax distance can not be more than distance

        $(el).val(newVal);
        iftaGen.states[state][fuel][param] = newVal;

        self.prepareStatesData();
    }
    this.filterIftaTrucks = function () {
        // Get current fuel type
        var fuel_type = $('#fuel_type').val();
        // If there is no fuel type
        if (typeof(fuel_type) == 'undefined' || typeof(fuel_type) == 'object' || fuel_type === null) {
            return false;
        }
        // Go next
        var fuel_type = fuel_type.toLowerCase();
        $('#truck_select option').removeClass('hidden');
        $('#truck_select option').each(function () {
            // Если выбрали "all fuel types",
            // то надо скрыть поля, у которых значение All,
            // при этом присутствует data-fuel
            if (
                fuel_type == '' &&
                $(this).html() == 'All' &&
                $(this).attr('data-fuel') != ''
            ) {
                $(this).addClass('hidden');

                // Далее, если выбрали топливо, то надо скрыть все поля с другими типами топлива
            } else if (
                fuel_type != '' &&
                $(this).attr('data-fuel').toLowerCase() != fuel_type
            ) {
                $(this).addClass('hidden');
            }
        });

        $('#truck_select').val($('#truck_select option:not(.hidden)').eq(0).val());

    }
    // RS: Generate report of each day distance
    // @author: Rusty Shackleford
    this.showTripReport = function () {

        // Destroy table if it exists
        if (self.tripReportsTable) {
            self.tripReportsTable.destroy();
            self.tripReportsTable = false;
        }

        // Table with report
        var reportTable = $('#trip-reports-result');

        // Lets clear table
        reportTable.html('');

        if (typeof(self.detailed) == 'undefined' || self.detailed === null) {
            return false;
        }

        // Iterate all fuel types
        for (let i = 0; i < self.allFuelTypes.length; i++) {

            // Save current fuel
            var fuelt_type = self.allFuelTypes[i];

            // Iterate all states
            for (var state in self.states) {

                // If there is no detailed info
                if (typeof(self.detailed[ state ]) == 'undefined' || self.detailed[ state ] === null) {
                    continue;
                }

                // Save detailed one row
                var detailed = self.detailed[ state ][ fuelt_type ];

                // Iterate all days
                for(var index in detailed) {

                    // Generate table row
                    var text = '<tr>' +
                        '<td>' + detailed[index]['stateName'] + '</td>' + // Jurisdiction
                        '<td>' + self.getAmericanDate(index, false) + '</td>' + // Date
                        '<td>' + self.getTruckName( detailed[index]['truckId'] ) + '</td>' + // Vehicle
                        '<td>' + fuelt_type + '</td>' + // Fuel
                        '<td>' + toFixedFloat(detailed[index]['distance'], 2) + ' mi</td>' + // Distance
                    '</tr>';

                    // Append table row
                    reportTable.append(text);
                }
            }
        }

        // Generate boottstrap's dataTable
        self.tripReportsTable = $('#trip-reports table').DataTable({
            //paging: false,
            "lengthMenu": [[25, 50, 100, -1 ], [25, 50, 100, 'All']]
        }).on( 'draw.dt', function () {
            // When we create or change a table - make new print button
            self.table2 = self.createPrintable(self.table2, '#table2', "TripReport");
        });
        // Create print buttons
        self.table2 = self.createPrintable(self.table2, '#table2', "TripReport");
    }


    // RS: Generate report about each refuel
    // @author: Rusty Shackleford
    this.showFuelReport = function () {

        // Destroy table if it exists
        if (self.fuelPurchasesTable) {
            self.fuelPurchasesTable.destroy();
            self.fuelPurchasesTable = false;
        }

        // Table with report
        var reportTable = $('#fuel-reports-result');

        // Lets clear table
        reportTable.html('');

        if (typeof(self.fuelDetailed) == 'undefined' || self.fuelDetailed === null) {
            return false;
        }

        // Iterate all fuel types
        for (let i = 0; i < self.allFuelTypes.length; i++) {

            // Save current fuel
            var fuelt_type = self.allFuelTypes[i];

            // Iterate all states
            for (var state in self.states) {

                // If there is no detailed info
                if (typeof(self.fuelDetailed[ state ]) == 'undefined' || self.fuelDetailed[ state ] === null) {
                    continue;
                }

                // Save detailed one row
                var detailed = self.fuelDetailed[ state ][ fuelt_type ];

                // Iterate all days
                for(var index in detailed) {

                    // If there is no date
                    if (typeof(detailed[index]['date']) == 'undefined' || detailed[index]['date'] === null) {
                        continue;
                    }

                    // Generate table row
                    var text = '<tr>' +
                        '<td>' + detailed[index]['stateName'] + '</td>' + // Jurisdiction
                        '<td>' + self.getAmericanDate(detailed[index]['date'], true) + '</td>' + // Date
                        '<td>' + self.getTruckName( detailed[index]['TruckId'] ) + '</td>' + // Vehicle
                        '<td>' + fuelt_type + '</td>' + // Fuel
                        '<td>' + toFixedFloat(detailed[index]['gallons'], 2) + ' gal</td>' + // Volume
                        '<td>' + toFixedFloat(detailed[index]['amount'], 2) + ' ' + detailed[index]['currency'] + '</td>' + // Amount
                    '</tr>';

                    // Append table row
                    reportTable.append(text);
                }
            }
        }

        // Generate boottstrap's dataTable
        self.fuelPurchasesTable = $('#fuel-purchases table').DataTable({
            //paging: false,
            "lengthMenu": [[25, 50, 100, -1 ], [25, 50, 100, 'All']]
        }).on( 'draw.dt', function () {
            // When we create or change a table - make new print button
            self.table3 = self.createPrintable(self.table3, '#table3', "FuelReport");
        });
        // Create print buttons
        self.table3 = self.createPrintable(self.table3, '#table3', "FuelReport");
    }
    this.createPrintable = function (el, id, name) {
        // Remove element if exists
        if (el) {
            el.remove();
        }
        // Create a new element
        el = $(id).tableExport({
            headers: true,
            formats: ['xlsx', 'csv'],
            filename: 'Ezlogz-' + name + '-' + self.quarter + 'Q' + self.year,
            position: "top",
            bootstrap: true
        });
        return el;
    }


    // RS: Show correct date in detailed info
    this.getAmericanDate = function (date, withTime) {

        // Return if there is no date
        if (typeof(date) == 'undefined' || date === null) {
            return '&mdash;';
        }

        date = date.replace(/ /g,"T");

        // Date format
        var d = new Date(date);

        // If we expect date with time, but there is no time
        if (withTime) {

            var options = {
                hour: 'numeric',
                minute: 'numeric',
                second: 'numeric'
            };

            if (
                Intl.DateTimeFormat('en',options).format(d) == '12:00:00 AM'
            ) {
                withTime = false;
            }
        }
        // /.If we expect date with time, but there is no time

        // Generate options for date or datetime
        if (withTime) {
            var options = {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: 'numeric'
            };
        } else {
            var options = {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            };
        }

        return Intl.DateTimeFormat('en', options).format(d);
    }


    // RS: generate title detailed info
    this.getDetailedTitle = function (stateName) {
        return '<div class="tripTitle" style="display:none;">' + stateName + ' Trip Details</div>';
    }


    // RS: generate message for detailed info
    this.getDetailedMessage = function (stateName, fuelt_type) {
        // If there is no detailed info
        if (typeof(self.detailed) == 'undefined' || self.detailed === null) {
            return '<div class="tripInfo" style="display:none;"></div>';
        }
        // If there is no detailed info
        if (typeof(self.detailed[ stateName ]) == 'undefined' || self.detailed[ stateName ] === null) {
            return '<div class="tripInfo" style="display:none;"></div>';
        }
        var detailed = self.detailed[ stateName ][ fuelt_type ];
        var tripInfo = '<div class="tripInfo" style="display:none;">';
        for(var index in detailed) {
            tripInfo += '<div style="width:160px;padding-bottom:20px;display:inline-block;">' +
                        self.getAmericanDate(index) +

                        '<strong>' +
                            '<br><i class="fa fa-truck" aria-hidden="true"></i> ' +
                            self.getTruckName( detailed[index]['truckId'] ) +

                            '<br><i class="fa fa-map-marker" aria-hidden="true"></i> ' +
                            detailed[index]['distance'] +
                            ' mi' +
                        '</strong>' +
                    '</div>';
        }
        tripInfo += '</div>';
        return tripInfo;
    }


    // RS: Get truck name
    // @author: Rusty Shackleford
    this.getTruckName = function (truckId) {

        var truck = self.trucks[truckId];

        // Generate truck name
        if (typeof(truck) == 'undefined' || truck === null) {
            var truckName = '';
        } else {
            var truckName = truck['Name'];
        }

        return truckName;
    }

    // RS EW-744 Place data from trip table to ifta table
    this.tripToPdfTablePlaceData = function (data)
    {
        // If something wrong - return false
        if (typeof data == 'undefined' || data === null) {
            return false;
        }
        if (typeof data.settings == 'undefined' || data.settings === null || typeof data.distance == 'undefined' || data.distance === null) {
            return false;
        }
        // Get mpg and fuel type
        var mpg = parseFloat(data.settings.mpg).toFixed(2);
        var fuel = data.settings.fuel;
        var iftaTable = $('#retult_table');

        // If data is broken
        if (isNaN(mpg) || typeof fuel == 'undefined' || fuel === null) {
            return false;
        }

        // Iterate all data state by state
        $.each(data.distance, function (key, item) {

            // Get data to place in
            var state = item.stateshort;
            var distance = item.distance;

            // Find if row exists
            var rowExists = iftaTable.find('.state_row[data-td=' + state + fuel + ']');

            // Get tax rates
            var ratesUSFuelTypeS = self.rates[state].rates.US[fuel];
            var gallons = toFixedFloat(distance / mpg, 2);

            // Add row if there is no row or u[pdate row if it exists
            if (rowExists.length == 0) {

                // Create state name
                var stateName = state;
                if ($.inArray( state, self.nonIftaStates ) != '-1') {
                    stateName = newState + self.nonIftaText;
                }

                // Add state row
                var row = self.generateRow(
                    state,
                    stateName,
                    fuel,
                    distance,
                    distance,
                    mpg,
                    gallons,
                    0,
                    gallons,
                    ratesUSFuelTypeS,
                    toFixedFloat(ratesUSFuelTypeS * gallons, 2),
                    0,
                    toFixedFloat(ratesUSFuelTypeS * gallons, 2),
                    '', // state-data prefix
                    true, // Show actions
                    true // Is this row editable
                );
                $('#result tbody').append(row);
                // /.Add state row


                // Add surcharge info
                if ($.inArray( state, self.surchargeStates ) != '-1') {
                    var ratesUSFuelTypeS = self.rates['Surch_' + state].rates.US[fuel];

                    // RS EW-744 Add row to table
                    var row = self.generateRow(
                        state,
                        stateName + self.surchargeText,
                        fuel,
                        '',
                        '',
                        '',
                        gallons,
                        '',
                        gallons,
                        ratesUSFuelTypeS,
                        toFixedFloat(ratesUSFuelTypeS * gallons, 2),
                        '',
                        toFixedFloat(ratesUSFuelTypeS * gallons, 2),
                        'sur_', // state-data prefix
                        false, // Show actions
                        false // Is this row editable
                    );
                    $('#result tbody').append(row);
                }
                // /.Add surcharge info


            // If there is row exists - update data
            } else {

                editable.sumApTdValue(rowExists.find('.state_distance'), distance);
                editable.sumApTdValue(rowExists.find('.state_taxDistance'), distance);
                editable.sumApTdValue(rowExists.find('.state_taxGallons'), gallons);
                // Calculate other cols in a row
                editable.calculateOtherValues(rowExists.find('.state_taxGallons'));

                // Update surcharge info
                if ($.inArray( state, self.surchargeStates ) != '-1') {
                    // Find row
                    var rowExistsSur = iftaTable.find('.state_row[data-td=sur_' + state + fuel + ']');
                    // If row exists
                    if (rowExistsSur.length != 0) {
                        editable.sumApTdValue(rowExistsSur.find('.state_taxGallons'), gallons);
                        editable.sumApTdValue(rowExistsSur.find('.state_netTaxGallons'), gallons);
                        // Calculate other cols in a row
                        editable.calculateOtherValues(rowExistsSur.find('.state_netTaxGallons'));
                    }
                    // /.If row exists
                }
                // /.Update surcharge info
            }
            // /Add row if there is no row or u[pdate row if it exists
        });
        // /.Iterate all data state by state

    }


    // RS EW-744 Place data from trip table to ifta table
    this.tripToPdfTablePlaceData = function (data)
    {
        // If something wrong - return false
        if (typeof data == 'undefined' || data === null) {
            return false;
        }
        if (typeof data.settings == 'undefined' || data.settings === null || typeof data.distance == 'undefined' || data.distance === null) {
            return false;
        }
        // Get mpg and fuel type
        var mpg = parseFloat(data.settings.mpg).toFixed(2);
        var fuel = data.settings.fuel;
        var iftaTable = $('#retult_table');

        // If data is broken
        if (isNaN(mpg) || typeof fuel == 'undefined' || fuel === null) {
            return false;
        }

        // Iterate all data state by state
        $.each(data.distance, function (key, item) {

            // Get data to place in
            var state = item.stateshort;
            var distance = item.distance;

            // Find if row exists
            var rowExists = iftaTable.find('.state_row[data-td=' + state + fuel + ']');

            // Get tax rates
            var ratesUSFuelTypeS = self.rates[state].rates.US[fuel];
            var gallons = toFixedFloat(distance / mpg, 2);

            // Add row if there is no row or u[pdate row if it exists
            if (rowExists.length == 0) {

                // Create state name
                var stateName = state;
                if ($.inArray( state, self.nonIftaStates ) != '-1') {
                    stateName = newState + self.nonIftaText;
                }

                // Add state row
                var row = self.generateRow(
                    state,
                    stateName,
                    fuel,
                    distance,
                    distance,
                    mpg,
                    gallons,
                    0,
                    gallons,
                    ratesUSFuelTypeS,
                    toFixedFloat(ratesUSFuelTypeS * gallons, 2),
                    0,
                    toFixedFloat(ratesUSFuelTypeS * gallons, 2),
                    '', // state-data prefix
                    true, // Show actions
                    true // Is this row editable
                );
                $('#result tbody').append(row);
                // /.Add state row


                // Add surcharge info
                if ($.inArray( state, self.surchargeStates ) != '-1') {
                    var ratesUSFuelTypeS = self.rates['Surch_' + state].rates.US[fuel];

                    // RS EW-744 Add row to table
                    var row = self.generateRow(
                        state,
                        stateName + self.surchargeText,
                        fuel,
                        '',
                        '',
                        '',
                        gallons,
                        '',
                        gallons,
                        ratesUSFuelTypeS,
                        toFixedFloat(ratesUSFuelTypeS * gallons, 2),
                        '',
                        toFixedFloat(ratesUSFuelTypeS * gallons, 2),
                        'sur_', // state-data prefix
                        false, // Show actions
                        false // Is this row editable
                    );
                    $('#result tbody').append(row);
                }
                // /.Add surcharge info


                // If there is row exists - update data
            } else {

                editable.sumApTdValue(rowExists.find('.state_distance'), distance);
                editable.sumApTdValue(rowExists.find('.state_taxDistance'), distance);
                editable.sumApTdValue(rowExists.find('.state_taxGallons'), gallons);
                // Calculate other cols in a row
                editable.calculateOtherValues(rowExists.find('.state_taxGallons'));

                // Update surcharge info
                if ($.inArray( state, self.surchargeStates ) != '-1') {
                    // Find row
                    var rowExistsSur = iftaTable.find('.state_row[data-td=sur_' + state + fuel + ']');
                    // If row exists
                    if (rowExistsSur.length != 0) {
                        editable.sumApTdValue(rowExistsSur.find('.state_taxGallons'), gallons);
                        editable.sumApTdValue(rowExistsSur.find('.state_netTaxGallons'), gallons);
                        // Calculate other cols in a row
                        editable.calculateOtherValues(rowExistsSur.find('.state_netTaxGallons'));
                    }
                    // /.If row exists
                }
                // /.Update surcharge info
            }
            // /Add row if there is no row or u[pdate row if it exists
        });
        // /.Iterate all data state by state

    }
}
var iftaGen = new iftaReportGenerator();