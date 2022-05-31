/**
 * Make table cols editable on click.
 * Has additional methods e.g. _something_OtherValues to work with IFTA table only
 * @param settings
 * @author Rusty Q. Shackleford
 * @date 2020-06-19
 */

function Editable(settings) {
    var self = this;
    self.settings = settings;
    /*
    'tdSelector': '.editable', // Selector for input parent,
    'trSelector': 'tr', // Selector for common row parent
    'dataParameter': 'data-tag' // Name of data-tag
    'resultSuffix': 'Result', // Suffix for result data-tad
    'countClass': 'countable', // Class that means we need to count this td
    'avaragebleCols': ['mpg'], // Cols which result need to be avarage
    'roundableCols': ['mpg'], // Cols which need to be round 4 digits after comma
    */

    // Columns which are responsible for mpg calculation
    self.settings.colsForMpg = ['mpg', 'taxDistance', 'taxGallons'];

    // Old value for editable input
    self.oldVal = false;

    // Lang values
    self.lang = {
        'alert1' : 'The distance cannot be less than the taxable miles',
        'alert2' : 'The taxable distance cannot be more than total miles',
        'alert3' : 'The tax gallons cannot be less than the tax-paid gallons',
        'alert4' : 'The tax-paid gallons cannot be more than tax gallons',
        'alert5' : 'This is not a number'
    };

    // Remove not needable chars
    self.getFloat = function (text)
    {
        if (typeof text == 'undefined' || text === null) {
            return 0;
        }

        // First of all lets get value from brackets
        text = self.fromBrackets(text);

        var val = text.toString().replace( /[^\d\-\.]+/g, '');
        val = parseFloat(val);
        if (isNaN(val)) {
            return 0;
        }
        return val;
    };

    // Convert TD value to input field
    self.tdToInput = function (t)
    {
        // If there is no input there
        if (!t.find('input').length) {
            // Get float value
            var val = self.getFloat(t.html());
            // Save old value. It will be needed
            self.oldVal = val;
            // Place it
            t.html('<input type="text" value="' + val + '">');
            t.find('input').focus();
        }
    };

    // Convert INPUT value back to TD
    self.inputToTd = function (t)
    {
        // Get value
        var val = self.getFloat(t.val());
        // If value is not a number
        if (val.toString() == '' || isNaN(val)) {
            // Show alert and call this function (inputToTd) again with old value
            self.wrongVal(t, self.lang.alert5);
            return false;
        }
        // Put it in table
        var closest = t.closest(self.settings.tdSelector);
        closest.html(
            self.formatNumber(val, closest.attr(self.settings.dataParameter))
        );
        // Calculate result
        self.calculateResult(closest.attr(self.settings.dataParameter));
    };

    // Check if value is correct
    self.checkInput = function (t)
    {
        // Get value
        var val = self.getFloat(t.val());
        // Replace value
        var rep = self.getFloat(val);
        // If value changed - put it back
        if (val != rep) {
            t.val(rep);
        }
    };

    // Calculate result
    self.calculateResult = function (name)
    {
        // Get values
        var result = self.calculateCurrentCol(name);

        // Show result
        $('[' + self.settings.dataParameter + '="' + name + self.settings.resultSuffix + '"]').html(
            self.formatNumber(result, name)
        );

        // For MPG it is special calculation. Lets do it
        if (self.settings.colsForMpg.includes(name)) {
            self.resultMpg();
        }
    };

    // Lets calculate MPG just devidin' distance and gallons
    self.resultMpg = function()
    {
        resultMpg = 0;
        // Get miles and gallons
        taxDistance = self.getFloat($('[' + self.settings.dataParameter + '="taxDistance' + self.settings.resultSuffix + '"]').html());
        taxGallons = self.getFloat($('[' + self.settings.dataParameter + '="taxGallons' + self.settings.resultSuffix + '"]').html());
        // Calculate MPG
        if (taxDistance > 0 && taxGallons > 0) {
            resultMpg = taxDistance / taxGallons;
        }
        // Show result
        $('[' + self.settings.dataParameter + '="mpg' + self.settings.resultSuffix + '"]').html(
            self.formatNumber(resultMpg, 'false') // Round to 2 digits because we do not need 4 digits in result
        );
    };

    // Calculate result values of all editable blocks in a col
    self.calculateCurrentCol = function (name)
    {
        var result = 0; // Result value
        var count = 0; // Count value

        $('[' + self.settings.dataParameter + '=' + name + ']').each(function(i) {
            // If this is not countable td - skip it
            if ($(this).hasClass(self.settings.countClass)) {

                // Get value
                var val = self.getFloat($(this).html());

                // Calculate it
                if (val != 0) {
                    result = result + val;
                    count ++;
                }
            }
        });

        // Return avarage value
        result = self.resultToAvarage(name, result, count);
        return result;
    };

    // Get avarage value
    self.resultToAvarage = function(name, result, count)
    {
        // If name exists in avaragebleCols array
        if (count > 0 && self.settings.avaragebleCols.includes(name)) {
            result = result / count;
        }
        return result;
    };

    // Format number to nice value
    self.formatNumber = function (number, fieldName)
    {
        // First of all lets check if value is less then zero
        if (number < 0) {
            return self.toBrackets(
                number.toFixed(2)
            );
        }

        // If it is not integer
        if (number == parseInt(number)) {
            // For integer everything simple
            return number.toLocaleString('ru-RU');
        }

        // Get float value. For mpd is 4 digits, for other are 2 digits
        if (self.settings.roundableCols.includes(fieldName)) {
            number = number.toFixed(4);
        } else {
            number = number.toFixed(2);
        }
        var arr = number.split('.');
        // Return result
        return parseInt(arr[0]).toLocaleString('ru-RU') + '.' + arr[1];
    };



    // Additional functions
    // validate other values
    self.validateOtherValues = function (t)
    {
        // Get value and tag name
        var val = self.getFloat(t.val());
        var dataParameter = t.closest(self.settings.tdSelector).attr(self.settings.dataParameter);

        // Switch tag name
        switch (dataParameter) {

            // Distance can not be less than tax distance
            case 'distance':

                var el = t.closest(self.settings.trSelector).find('[' + self.settings.dataParameter + '=taxDistance]');
                var elVal = self.getFloat(el.html());

                // If new value less than tax value
                /*if (val < elVal) {
                    self.wrongVal(t, self.lang.alert1);
                    return false;
                }*/
                break;

            // Tax distance can not be larger than distance
            case 'taxDistance':

                var el = t.closest(self.settings.trSelector).find('[' + self.settings.dataParameter + '=distance]');
                var elVal = self.getFloat(el.html());

                // If new value less than tax value
                /*if (val > elVal) {
                    self.wrongVal(t, self.lang.alert2);
                    return false;
                }*/
                break;

            // Tax gallons can not be larger than purchased gallons
            case 'taxGallons':
                var el = t.closest(self.settings.trSelector).find('[' + self.settings.dataParameter + '=purchasedGallons]');
                var elVal = self.getFloat(el.html());

                /*if (val < elVal) {
                    self.wrongVal(t, self.lang.alert3);
                    return false;
                }*/
                break;

            // Purchased gallons can not be less than tax  gallons
            case 'purchasedGallons':
                var el = t.closest(self.settings.trSelector).find('[' + self.settings.dataParameter + '=taxGallons]');
                var elVal = self.getFloat(el.html());

                /*if (val > elVal) {
                    self.wrongVal(t, self.lang.alert4);
                    return false;
                }*/
                break;
        }
        return true;
    };

    // Show alert when validation breaked
    self.wrongVal = function (t, message)
    {
        t.val(self.oldVal); // Return old value back
        self.inputToTd(t); // Hide input
        alert(message);
        return false; // Return false;
    };

    // Calculate other values
    self.calculateOtherValues = function (t)
    {
        // Get value of current element and data-tag nameZ
        var dataParameter = t.attr(self.settings.dataParameter);
        // Get current row parent
        var parent = t.closest(self.settings.trSelector);

        // Switch tag name
        switch (dataParameter) {

            // Calculate Taxable Gallons
            case 'taxDistance':
            case 'mpg':

                // Get current values
                var val = self.getTwoValues(parent, 'taxDistance', 'mpg');
                // Set taxable gallons
                if (val.f2 == 0) {
                    newValue = 0;
                } else {
                    var newValue = val.f1 / val.f2;
                }
                var taxGallons = parent.find('[' + self.settings.dataParameter + '=taxGallons]');
                taxGallons.html(self.formatNumber(newValue, 'taxGallons'));

                // And update "Net taxable gallons"
                self.calculateOtherValues(taxGallons);
                // Calculate totals
                self.calculateResult('taxGallons');
                break;

            // When we change tax gallons - we need to caplculate mpg
            case 'taxGallons':

                // Get current values
                var val = self.getTwoValues(parent, 'taxDistance', 'taxGallons');

                // Set mpg
                var mpg = parent.find('[' + self.settings.dataParameter + '=mpg]');
                if (val.f2 == 0) {
                    mpg.html(0);
                } else {
                    mpg.html(self.formatNumber(val.f1 / val.f2, 'mpg'));
                }

                // Calculate totals
                self.calculateResult('mpg');

            // NO BREAK BECAULE WE USE TAXGALLONS TO CALCULATE netGallons


            // Calculate "Net taxable gallons" - tax gallons minus purchased gallons
            case 'taxGallons':
            case 'purchasedGallons':

                // Get current values
                var val = self.getTwoValues(parent, 'taxGallons', 'purchasedGallons');

                // Set net taxable gallons
                var netGallons = parent.find('[' + self.settings.dataParameter + '=netGallons]');
                netGallons.html(self.formatNumber(val.f1 - val.f2, 'netGallons'));

                // And update "Tax due"
                self.calculateOtherValues(netGallons);
                // Calculate totals
                self.calculateResult('netGallons');
                break;

            // Calculate "Tax due" - multiply net gallons to tax rate
            case 'netGallons':

                // Get current values
                var val = self.getTwoValues(parent, 'netGallons', 'taxRate');

                // Set net taxable gallons
                var taxDue = parent.find('[' + self.settings.dataParameter + '=taxDue]');
                taxDue.html(self.formatNumber(val.f1 * val.f2, 'taxDue'));

                // And update "Total due"
                self.calculateOtherValues(taxDue);
                // Calculate totals
                self.calculateResult('taxDue');
                break;

            // Calculate "Total due" - add Tax Due to Interest Due
            case 'taxDue':
            case 'interestDue':

                // Get current values
                var val = self.getTwoValues(parent, 'taxDue', 'interestDue');

                // Set net taxable gallons
                var totalDue = parent.find('[' + self.settings.dataParameter + '=totalDue]');
                totalDue.html(self.formatNumber(val.f1 + val.f2, 'totalDue'));

                // Calculate totals
                self.calculateResult('totalDue');
                break;
        }
        return true;
    };

    // Get values from two fields
    self.getTwoValues = function (parent, f1, f2)
    {
        // Get first field value
        var field1 = parent.find('[' + self.settings.dataParameter + '=' + f1 + ']');
        field1Val = self.getFloat(field1.html());
        // Get value is not a number (e.g. surcharge row) - put zero there
        if (isNaN(field1Val)) {
            field1Val = 0;
        }

        // Get second field value
        var field2 = parent.find('[' + self.settings.dataParameter + '=' + f2 + ']');
        field2Val = self.getFloat(field2.html());
        // Get value is not a number (e.g. surcharge row) - put zero there
        if (isNaN(field2Val)) {
            field2Val = 0;
        }

        // Return numbers
        return {
            f1 : field1Val,
            f2 : field2Val,
        };
    };

    // Replace value in brackets to value with minus
    self.fromBrackets = function(text)
    {
        str = text.toString();
        // Check if value is in brackets
        if (str.slice(0,1) != '(' || str.slice(-1) != ')') {
            return text;
        }
        // Replace brackets to minus
        str = str.replace(/^\(/g, '-');
        str = str.replace(/\)$/g, '');
        return str;
    };

    // Place value to brackets
    self.toBrackets = function(text)
    {
        str = text.toString();
        // Check if value is in brackets
        if (str.slice(0,1) != '-') {
            return text;
        }
        // Replace brackets to minus
        str = str.replace(/^\-/g, '');
        return '(' + str + ')';
    };

    // RS EW-744 add some number to existed td
    self.sumApTdValue = function(el, value) {
        if (el.length == 0 || isNaN(value) || value == 0) {
            return false;
        }
        // Get float value
        var val = self.getFloat(el.html());
        if (isNaN(val)) {
            return false;
        }

        // Put it in table
        el.html(
            self.formatNumber(val + parseFloat(value), el.attr(self.settings.dataParameter))
        );
        // No result calculation, we calculate it in other place
    };
}
