function newOrderForm(params = {}) {
    var self = this;
    self.params = params;
    self.cntrlUrl = apiDashUrl;
    self.modalElement = '';
    self.tableId = 'newOrderCard';
    self.order = [];
    self.products = [];
    self.modalId = 'modalNewOrder'
    self.initRequest = function () {
        $('.new_order.btn').prop('disabled', true);
        if(!curUserIsEzlogzEmployee()) {
            finances.checkNotPaidEldOrders(function (response) {
                if(response.data.result === true) {
                    finances.showOrderPlacedPopup('/dash/finances/');
                    return false;
                } else {
                    AjaxCall({url: self.cntrlUrl, action: 'getNewOrderCardInit', data: {'active':1}, successHandler: self.init});
                }
            });
        } else {
            AjaxCall({url: self.cntrlUrl, action: 'getNewOrderCardInit', data: {'active':1}, successHandler: self.init});
        }
    };
    self.init = function (response) {
        if(typeof response.data.products !== 'undefined') {
            orderController.products = self.products = response.data.products;
        }
        self.default_values = response.data.default_values;
        self.createModal();

        //Callback init (not using if load modalCore(self);)
        if (self.params != undefined && self.params.initCallback != undefined) {
            self.params.initCallback()
            self.params.initCallback = undefined;
        }
    };

    self.toggleOrderList = function() {
        $('#order-list').toggle();
    }

    self.createModal = function () {
        let date = moment(new Date).format('L');
        let dateStartDisc = moment(BF_DISCOUNT_START).format('L');
        let dateEndDisc = moment(BF_DISCOUNT_END).format('L');

        if ($('#' + self.tableId).length > 0) {
            $('#' + self.tableId).closest('.modal_card').remove();
        }
        var view = `
        <form id="orderForm" class="order-form">
            <input type="hidden" name="user_id" id="user_id" value="">
            <div class="row row-order">
                <div class="col-md-8 col-left">
                    <div class="px-2 py-4">
                        <div id="error_place"><div class="error-handler"></div></div>
                        <!-- FLEET -->
                        <div class="block-bordered p-4 mb-4" style="display: none;" id="fleetPlace" data-manager="true">
                            <div class="form-group form-group-sm">
                                <label for="address">Fleet</label>
                                <div class="row">
                                    <div class="col-xs-8">
                                        <input id="fleet_select" class="form-control" type="text" onfocus="orderController.checkFleets(this)" onkeyup="orderController.checkFleets(this)" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" autocomplete="custom" />
                                        <ul class="dropdown-menu" id="fleetList"></ul>
                                    </div>
                                    <div class="col-xs-4">
                                       <button type="button" onclick="orderController.newFleet(this)" class="btn btn-sm btn-default btn-block newFleet" id="btnNewFleet">New Fleet</button>
                                    </div>
                                </div>
                            </div>
                            <div id="createFleet" class="mt-3" style="display: none;">
                                <h5 class="header">Create Fleet</h5>
                                <hr />
                                <div class="row">
                                    <div class="form-group form-group-sm col-sm-12">
                                        <label for="reg_fl2_usdot">USDOT #</label>
                                        <div class="row">
                                            <div class="col-xs-8">
                                                <input type="text" name="newFleet[usdot]" id="reg_fl2_usdot" class="form-control" onfocus="orderController.liveCheckUsdot(this)" onkeyup="orderController.liveCheckUsdot(this)" maxlength="10" data-mask="0000000000" placeholder="USDOT #" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" />
                                                <ul class="dropdown-menu" id="searchUsdotList"></ul>
                                            </div>
                                            <div class="col-xs-4">
                                                <button type="button" id="search_fl2_company" class="btn btn-sm btn-default btn-block" onclick="orderController.checkUsdot('#createFleet')">Search Company</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="form-group form-group-sm col-sm-6">
                                        <label for="reg_fl_state">STATE/PROVINCE</label>
                                        <select name="newFleet[state]" class="form-control" id="reg_fl_state">
                                            <option value="0">STATE/PROVINCE</option>
                                        </select>
                                    </div>
                                    <div class="form-group form-group-sm col-sm-6">
                                        <label for="reg_fl_city">CITY</label>
                                        <input type="text" name="newFleet[city]" placeholder="CITY" class="form-control" id="reg_fl_city"/>
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="form-group form-group-sm col-sm-6">
                                        <label for="reg_fl_timeZone">Time Zone</label>
                                        <select name="newFleet[timeZone]" class="form-control" id="reg_fl_timeZone">
                                            <option value="4" selected="selected">AKST Alaska Standard Time</option>
                                            <option value="8">Arizona</option>
                                            <option value="6">Atlantic time (US &amp; Canada)</option>
                                            <option value="1" selected="">Central Time (US &amp; Canada)</option>
                                            <option value="0">Eastern Time (US &amp; Canada)</option>
                                            <option value="5">Indiana (East)</option>
                                            <option value="2">Mountain Time (US &amp; Canada)</option>
                                            <option value="3">Pacific time (US &amp; Canada)</option>
                                            <option value="7">Saskatchewan (CST)</option>
                                        </select>
                                    </div>
                                    <div class="form-group form-group-sm col-sm-6">
                                        <label for="reg_fl_zip" >ZIP/POSTAL CODE</label>
                                        <input name="newFleet[zip]" placeholder="ZIP/POSTAL CODE" class="form-control" maxlength="10" id="reg_fl_zip"/>
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="form-group form-group-sm col-sm-6">
                                        <label for="reg_fl_car_name" >Carrier name</label>
                                        <input type="text" name="newFleet[car_name]" class="form-control" id="reg_fl_car_name" placeholder="Carrier name"/>
                                    </div>
                                    <div class="form-group form-group-sm col-sm-6">
                                        <label for="reg_fl2_size" >Fleet size</label>
                                        <input data-mask="0000" name="newFleet[size]" class="form-control" id="reg_fl2_size" placeholder="Fleet size"/>
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="form-group form-group-sm col-sm-6">
                                        <label for="reg_fl_office_addr" >Main office address</label>
                                        <input type="text" name="newFleet[office_addr]" class="form-control" id="reg_fl_office_addr" placeholder="Main office address"/>
                                    </div>
                                     <div class="form-group form-group-sm col-sm-6">
                                        <label for="reg_fl_ein">EIN</label>
                                    <input type="text" name="newFleet[ein]" class="form-control" id="reg_fl_ein" placeholder="EIN"/>
                                    </div>
                                </div>
                                <br />
                            </div>
                            <!-- USER -->
                            <div class="user_row" style="display: none;">
                                <div class="form-group form-group-sm">
                                    <label for="user_select">User</label>
                                    <div class="row">
                                        <div class="col-xs-8">
                                            <input id="user_select" class="form-control" type="text" onfocus="orderController.checkUsers(this)" onkeyup="orderController.checkUsers(this)" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" autocomplete="off" />
                                            <ul class="dropdown-menu" id="userList"></ul>
                                        </div>
                                        <div class="col-xs-4">
                                            <button type="button" onclick="orderController.newUser(this)" class="btn btn-sm btn-default btn-block newUser" id="btnNewUser">New User</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div id="createEldUser" class="mt-3" style="display: none;">
                                <h5 class="header">Create User</h5>
                                <hr />
                                <div class="row">
                                    <div class="form-group form-group-sm col-sm-6" id="reg_fl_type_place">
                                        <label for="reg_fl_type">COMPANY POSITION</label>
                                        <select name="newUser[type]" class="form-control" id="reg_fl_type">
                                            <option value="5">Safety Director/Administrator</option><option value="4">Dispatcher</option><option value="7">Driver</option>
                                        </select>
                                    </div>
                                    <div class="form-group form-group-sm col-sm-6">
                                        <label for="reg_fl_email">Email</label>
                                        <input name="newUser[email]" type="text" class="form-control" id="reg_fl_email" placeholder="Email" onfocus="orderController.liveCheckEmail(this)" onkeyup="orderController.liveCheckEmail(this)" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"/>
                                        <ul class="dropdown-menu" id="searchEmailList"></ul>
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="form-group form-group-sm col-sm-6">
                                        <label for="reg_fl_name">First Name</label>
                                        <input type="text" name="newUser[name]" class="form-control" id="reg_fl_name" placeholder="First Name"/>
                                    </div>
                                    <div class="form-group form-group-sm col-sm-6">
                                        <label for="reg_fl_last">Last Name</label>
                                        <input type="text" name="newUser[last]" class="form-control" id="reg_fl_last" placeholder="Last Name"/>
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="form-group form-group-sm col-sm-6">
                                        <label for="reg_fl_phone">Phone</label>
                                        <input type="text" name="newUser[phone]" class="form-control" id="reg_fl_phone" placeholder="Phone" data-mask="000 000 0000"/>
                                    </div>
                                    <div class="form-group form-group-sm col-sm-6">
                                        <label for="reg_fl_ext">Extention</label>
                                        <input type="text" name="newUser[ext]" class="form-control" id="reg_fl_ext" placeholder="Extention" data-mask="0000000000"/>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <!-- SOLO -->
                        <div class="block-bordered p-4 mb-4" id="soloDriverPlace" data-manager="true" style="display: none;">
                            <div class="form-group form-group-sm">
                                <label for="address">Solo Driver</label>
                                <div class="row">
                                    <div class="col-xs-8">
                                        <input id="solo_driver_select" class="form-control" type="text" onfocus="orderController.checkSoloDriver(this)" onkeyup="orderController.checkSoloDriver(this)" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" autocomplete="off" />
                                        <ul class="dropdown-menu" id="soloDriverList"></ul>
                                    </div>
                                    <div class="col-xs-4">
                                       <button type="button" onclick="orderController.newSoloDriver(this)" class="btn btn-sm btn-default btn-block newSoloDriver">New Solo Driver</button>
                                    </div>
                                </div>
                            </div>
                            <div id="userSoloDriverForm">
                                <h5 class="header">Create User</h5>
                                <hr />
                                <div class="form-group form-group-sm">
                                    <label for="reg_fl_email">Email</label>
                                    <input type="text" name="newUserSolo[email]" class="form-control" id="reg_solo_email" placeholder="Email"/>
                                    <ul class="dropdown-menu" id="searchEmailSoloList"></ul>
                                </div>
                                <div class="row">
                                    <div class="form-group form-group-sm col-sm-6">
                                        <label for="reg_fl_name">First Name</label>
                                        <input type="text" name="newUserSolo[name]" class="form-control" id="reg_solo_name" placeholder="First Name"/>
                                    </div>
                                    <div class="form-group form-group-sm col-sm-6">
                                        <label for="reg_fl_last">Last Name</label>
                                        <input type="text" name="newUserSolo[last]" class="form-control" id="reg_solo_last" placeholder="Last Name"/>
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="form-group form-group-sm col-sm-6">
                                        <label for="reg_fl_phone">Phone</label>
                                        <input type="text" name="newUserSolo[phone]" class="form-control" id="reg_solo_phone" placeholder="Phone" data-mask="000 000 0000"/>
                                    </div>
                                    <div class="form-group form-group-sm col-sm-6">
                                        <label for="reg_fl_ext">Extention</label>
                                        <input type="text" name="newUserSolo[ext]" class="form-control" id="reg_solo_ext" placeholder="Extention" data-mask="0000000000"/>
                                    </div>
                                </div>
                            </div>
                            <div id="soloDriverForm">
                                <h5 class="header mt-3">Create Solo Driver</h5>
                                <hr />
                                <div class="row">
                                    <div class="form-group form-group-sm col-sm-6">
                                        <label for="reg_dr_usdot">USDOT #</label>
                                        <input type="text" name="newSoloDriver[usdot]" id="reg_dr_usdot" class="form-control"  maxlength="10" data-mask="0000000000" placeholder="USDOT #" />
                                    </div>
                                    <div class="form-group form-group-sm col-sm-6">
                                        <label for="reg_dr_state">STATE/PROVINCE</label>
                                        <select name="newSoloDriver[state]" class="form-control" id="reg_dr_state">
                                            <option value="0">STATE/PROVINCE</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="form-group form-group-sm col-sm-6">
                                        <label for="reg_dr_city">CITY</label>
                                        <input name="newSoloDriver[city]" type="text"  placeholder="CITY" class="form-control" id="reg_dr_city"/>
                                    </div>
                                    <div class="form-group form-group-sm col-sm-6">
                                        <label for="reg_dr_zip" >ZIP/POSTAL CODE</label>
                                        <input name="newSoloDriver[zip]" placeholder="ZIP/POSTAL CODE" class="form-control" maxlength="10" id="reg_dr_zip"/>
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="form-group form-group-sm col-sm-6">
                                        <label for="dr_license_number">License Number</label>
                                        <input name="newSoloDriver[license_number]" id="dr_license_number" placeholder="LICENSE NUMBER" class="form-control" type="text">
                                    </div>
                                    <div class="form-group form-group-sm col-sm-6">
                                        <label for="dr_license_state">License State</label>
                                        <select name="newSoloDriver[license_state]" class="form-control" id="dr_license_state">
                                            <option value="0">STATE/PROVINCE</option>
                                            <optgroup label="USA">
                                                <option value="1" data-short="AL">Alabama</option><option value="2" data-short="AK">Alaska</option><option value="3" data-short="AZ">Arizona</option><option value="4" data-short="AR">Arkansas</option><option value="5" data-short="CA">California</option><option value="6" data-short="CO">Colorado</option><option value="7" data-short="CT">Connecticut</option><option value="8" data-short="DE">Delaware</option><option value="9" data-short="FL">Florida</option><option value="10" data-short="GA">Georgia</option><option value="11" data-short="HI">Hawaii</option><option value="12" data-short="ID">Idaho</option><option value="13" data-short="IL">Illinois</option><option value="14" data-short="IN">Indiana</option><option value="15" data-short="IA">Iowa</option><option value="16" data-short="KS">Kansas</option><option value="17" data-short="KY">Kentucky</option><option value="18" data-short="LA">Louisiana</option><option value="19" data-short="ME">Maine</option><option value="20" data-short="MD">Maryland</option><option value="21" data-short="MA">Massachusetts</option><option value="22" data-short="MI">Michigan</option><option value="23" data-short="MN">Minnesota</option><option value="24" data-short="MS">Mississippi</option><option value="25" data-short="MO">Missouri</option><option value="26" data-short="MT">Montana</option><option value="27" data-short="NE">Nebraska</option><option value="28" data-short="NV">Nevada</option><option value="29" data-short="NH">New Hampshire</option><option value="30" data-short="NJ">New Jersey</option><option value="31" data-short="NM">New Mexico</option><option value="32" data-short="NY">New York</option><option value="33" data-short="NC">North Carolina</option><option value="34" data-short="ND">North Dakota</option><option value="35" data-short="OH">Ohio</option><option value="36" data-short="OK">Oklahoma</option><option value="37" data-short="OR">Oregon</option><option value="38" data-short="PA">Pennsylvania</option><option value="39" data-short="RI">Rhode Island</option><option value="40" data-short="SC">South Carolina</option><option value="41" data-short="SD">South Dakota</option><option value="42" data-short="TN">Tennessee</option><option value="43" data-short="TX">Texas</option><option value="44" data-short="UT">Utah</option><option value="45" data-short="VT">Vermont</option><option value="46" data-short="VA">Virginia</option><option value="47" data-short="WA">Washington</option><option value="48" data-short="WV">West Virginia</option><option value="49" data-short="WI">Wisconsin</option><option value="50" data-short="WY">Wyoming</option><option value="64" data-short="DC">Washington DC</option>
                                            </optgroup>
                                            <optgroup label="Canada">
                                                <option value="51" data-short="AB">Alberta</option><option value="52" data-short="BC">British Columbia</option><option value="53" data-short="MB">Manitoba</option><option value="54" data-short="NB">New Brunswick</option><option value="55" data-short="NL">Newfoundland and Labrador</option><option value="56" data-short="NS">Nova Scotia</option><option value="57" data-short="NT">Northwest Territories</option><option value="58" data-short="NU">Nunavut</option><option value="59" data-short="ON">Ontario</option><option value="60" data-short="PE">Prince Edward Island</option><option value="61" data-short="QC">Quebec</option><option value="62" data-short="SK">Saskatchewan</option><option value="63" data-short="YT">Yukon</option>
                                            </optgroup>
                                        </select>
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="form-group form-group-sm col-sm-6">
                                        <label for="reg_dr_car_name">Carrier name</label>
                                        <input type="text" name="newSoloDriver[car_name]" class="form-control" id="reg_dr_car_name" placeholder="Carrier name"/>
                                    </div>
                                    <div class="form-group form-group-sm col-sm-6">
                                        <label for="reg_dr_office_addr">Main office address</label>
                                        <input type="text" name="newSoloDriver[addr]" class="form-control" id="reg_dr_office_addr" placeholder="Main office address"/>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <h3 class="header">1. Personal data</h3>
                        <div class="block-bordered p-4 mb-4" id="infoOrderBlock">
                            <div class="row" style="display: none">
                                <div class="col-sm-6">
                                    <div class="form-group form-group-sm">
                                        <label for="device_type_id">ELD Device manufacturer</label>
                                        <select name="device_type_id" class="form-control" id="device_type_id">
                                            
                                             
                                            <option value="2">Ez-Smart ELD</option>
                                           
                                            
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-sm-6">
                                    <!--<div class="form-group form-group-sm">
                                        <label for="amount">Quantity of ELD devices</label>
                                        <input name="amount" id="amount" class="form-control w-25 check_input_number" type="number" min="0" max="999" onchange="orderController.showBoxEldTariffs(this, $('#device_type_id').val())" onkeyup="orderController.showBoxEldTariffs(this, $('#device_type_id').val())">
                                    </div>-->
                                    <div class="form-group form-group-sm">
                                        <label for="name">First Name</label>
                                        <input name="name" id="name" class="form-control" type="text">
                                    </div>
                                    <div class="form-group form-group-sm">
                                        <label for="surname">Last Name</label>
                                        <input name="surname" id="surname" class="form-control" type="text">
                                    </div>
                                    <div class="form-group form-group-sm">
                                        <label for="phone">Phone</label>
                                        <input name="phone" id="phone" class="form-control" type="text" data-mask="000 000 0000">
                                    </div>
                                </div>
                                <div class="col-sm-6">
                                    <div class="form-group form-group-sm" id="addressesOrderPlace" style="display: none;">
                                        <label for="city">Addresses List</label>
                                        <select name="addressesOrder" id="addressesOrder" class="form-control" onchange="orderController.autocompleteAddressOrder(this)">
                                            <option value="0">Select Address</option>
                                        </select>
                                    </div>
                                    <div class="form-group form-group-sm">
                                        <label for="address">Delivery Address</label>
                                        <div class="row">
                                            <div class="col-xs-8">
                                                <input name="address" id="address" class="form-control" type="text" title="Primary address line" placeholder="Primary address line">
                                            </div>
                                            <div class="col-xs-4">
                                                <input name="address1" id="address1" class="form-control" type="text" title="Suite or apartment number only" placeholder="Apt Number">
                                            </div>
                                        </div>
                                    </div>
                                    <div class="form-group form-group-sm">
                                        <label for="city">Delivery City</label>
                                        <input name="city" value="" id="city" class="form-control" type="text">
                                    </div>
                                    <div class="form-group form-group-sm">
                                        <label for="state">Delivery State</label>
                                        <select name="state" id="state" class="form-control">
                                            <option value="0">STATE/PROVINCE</option>
                                        </select>
                                    </div>
                                    <div class="form-group form-group-sm">
                                        <label for="zip">Delivery Zip Code</label>
                                        <input id="zip" name="zip" class="form-control" type="text" maxlength="7" onclick="orderController.calculate()" onchange="orderController.calculate()" onkeyup="orderController.calculate()">
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div id="order-list">
                            <h3 class="header">2. Order list</h3>
                            <div class="border-table mb-4">
                                <table class="table table-order-devices" id="tableProductList"><tbody></tbody></table>
                            </div>
                        </div>
                        <h3 class="header" style="display: none;">Payments Methods ELD</h3>
                        <div class="row row-tariffs mb-3" id="eldTariffs"></div>
                        <h3 class="header" style="display: none;">Payments Methods Camera</h3>
                        <div class="row row-tariffs mb-3" id="cameraTariffs"></div>
                        <div class="row" style="display: none;">
                            <div class="col-sm-6">
                                <div class="form-group form-group-sm">
                                    <label for="order_type">Order type</label>
                                    <select name="order_type" class="form-control" id="order_type" onclick="orderController.calculate()" onchange="orderController.calculate()" onkeyup="orderController.calculate()"></select>
                                </div>
                            </div>
                            <div class="col-sm-6">
                                <div class="form-group form-group-sm">
                                    <label for="order_camera_type">Order camera type</label>
                                    <select name="order_camera_type" class="form-control" id="order_camera_type" onclick="orderController.calculate()" onchange="orderController.calculate()" onkeyup="orderController.calculate()"></select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-4 col-right">
                    <div class="px-2 py-4">
                        <div class="check_buttons_block mb-3 w-100" id="checkboxFleetOrSolo" style="display: none;" data-manager="true">
                            <button type="button" class="btn btn-default active" onclick="doActive(this);orderController.fleetPlaceShow();" data-val="1">Fleet</button>
                            <button type="button" class="btn btn-default" onclick="doActive(this);orderController.soloPlaceShow();" data-val="0">Solo Driver</button>
                        </div>
                        <div id="orderPriceCountPlace" class="mb-3">
                        </div>
                        <div class="form-group form-group-sm mb-4">
                            <textarea name="notes" id="notes" class="form-control" rows="3" placeholder="Order Notes"></textarea>
                        </div>
                        <div class="checkbox" id="is_demo_eld" style="display: none;" data-manager="true">
                            <label>
                                <input type="checkbox" value="1"> Demo
                            </label>
                        </div>
                        <div class="checkbox">
                            <label>
                                <input name="pick_up" value="1" type="checkbox" onclick="orderController.calculate()" onchange="orderController.calculate()" onkeyup="orderController.calculate()"> Pick up from office
                            </label>
                        </div>
                        <div class="checkbox">
                            <label>
                                <input name="overnight" value="1" type="checkbox" title="One overnight package can contain up to 12 devices or 5 cables, $31.99 for each package" onclick="orderController.calculate()" onchange="orderController.calculate()" onkeyup="orderController.calculate()"> Overnight Delivery
                            </label>
                        </div>
                        <div class="checkbox" id="agreementCheckbox" style="display: none;">
                            <label>
                                <input type="checkbox" id="agreementCheckboxItem" onclick="openLeaseAndAgreementPopup(this);" title="ELD/Dashcam Order"> <span>EQUIPMENT PURCHASE AND SOFTWARE SUBSCRIPTION SERVICE AGREEMENT</span>
                            </label>
                        </div>
                        <div class="checkbox" id="agreementLeaseCheckbox" style="display: none;">
                            <label>
                                <input type="checkbox" id="agreementLeaseCheckboxItem" onclick="openLeaseAndAgreementPopup(this);" title="ELD/Dashcam Lease Order"> <span>EQUIPMENT LEASE AND SOFTWARE SUBSCRIPTION SERVICE AGREEMENT</span>
                            </label>
                        </div>
                        <div id="orderCreditBlock" style="display: none;">
                            <div class="mt-4">
                                <h5 class="header">SmartWitness Application</h5>
                                <ul class="list-group list-group-order-price mb-1" id="list_eld_credit_fee">
                                </ul>
                                <div class="checkbox mb-2">
                                    <label>
                                        <input id="all_order_credit" type="checkbox" name="all_order_credit" onclick="orderController.checkAllInCredit();orderController.calculate();"> All order in credit
                                    </label>
                                </div>
                                <div class="row">
                                    <div class="col-md-6 pr-lg-1 mb-1">
                                        <a type="button" class="btn btn-sm btn-block btn-default" target="_blank" href="/docs/uploads/FleetManagmentCreditApplication.pdf">Download</a>
                                    </div>
                                    <div class="col-md-6 pl-lg-1 mb-1">
                                        <div id="fileSmartWitness">
                                            <div class="fileinput fileinput-new" data-provides="fileinput">
                                                <div class="fileinput-preview thumbnail" data-target="emplFile" data-trigger="fileinput" style="display: none;"></div>
                                                <div>
                                                    <span class="btn btn-default btn-block btn-file">
                                                        <span class="fileinput-new">Upload</span>
                                                        <span class="fileinput-exists">Change</span>
                                                        <input type="file" class="emplFile" name="emplFile" accept=".pdf">
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <input id="uploadSmartWitnessInput" name="uploadSmartWitnessInput" value="" style="display: none;">
                            </div>
                            <div class="checkbox mt-1" id="creditApplicationChanged">
                                <label>
                                    <input type="checkbox" value="1" disabled> Credit Application Changed
                                </label>
                            </div>
                        </div>
                        <button type="button" class="btn btn-default btn-block mt-4" id="send_order" onclick="orderController.order()">ORDER</button>
                    </div>
                </div>
            </div>
        </form>`;
        
        if(superAdminRights.superwiser){
             var view = `
        <form id="orderForm" class="order-form">
            <input type="hidden" name="user_id" id="user_id" value="">
            <div class="row row-order">
                <div class="col-md-8 col-left">
                    <div class="px-2 py-4">
                        <div id="error_place"><div class="error-handler"></div></div>
                        <!-- FLEET -->
                        <div class="block-bordered p-4 mb-4" style="display: none;" id="fleetPlace" data-manager="true">
                            <div class="form-group form-group-sm">
                                <label for="address">Fleet</label>
                                <div class="row">
                                    <div class="col-xs-8">
                                        <input id="fleet_select" class="form-control" type="text" onfocus="orderController.checkFleets(this)" onkeyup="orderController.checkFleets(this)" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" autocomplete="custom" />
                                        <ul class="dropdown-menu" id="fleetList"></ul>
                                    </div>
                                    <div class="col-xs-4">
                                       <button type="button" onclick="orderController.newFleet(this)" class="btn btn-sm btn-default btn-block newFleet" id="btnNewFleet">New Fleet</button>
                                    </div>
                                </div>
                            </div>
                            <div id="createFleet" class="mt-3" style="display: none;">
                                <h5 class="header">Create Fleet</h5>
                                <hr />
                                <div class="row">
                                    <div class="form-group form-group-sm col-sm-12">
                                        <label for="reg_fl2_usdot">USDOT #</label>
                                        <div class="row">
                                            <div class="col-xs-8">
                                                <input type="text" name="newFleet[usdot]" id="reg_fl2_usdot" class="form-control" onfocus="orderController.liveCheckUsdot(this)" onkeyup="orderController.liveCheckUsdot(this)" maxlength="10" data-mask="0000000000" placeholder="USDOT #" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" />
                                                <ul class="dropdown-menu" id="searchUsdotList"></ul>
                                            </div>
                                            <div class="col-xs-4">
                                                <button type="button" id="search_fl2_company" class="btn btn-sm btn-default btn-block" onclick="orderController.checkUsdot('#createFleet')">Search Company</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="form-group form-group-sm col-sm-6">
                                        <label for="reg_fl_state">STATE/PROVINCE</label>
                                        <select name="newFleet[state]" class="form-control" id="reg_fl_state">
                                            <option value="0">STATE/PROVINCE</option>
                                        </select>
                                    </div>
                                    <div class="form-group form-group-sm col-sm-6">
                                        <label for="reg_fl_city">CITY</label>
                                        <input type="text" name="newFleet[city]" placeholder="CITY" class="form-control" id="reg_fl_city"/>
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="form-group form-group-sm col-sm-6">
                                        <label for="reg_fl_timeZone">Time Zone</label>
                                        <select name="newFleet[timeZone]" class="form-control" id="reg_fl_timeZone">
                                            <option value="4" selected="selected">AKST Alaska Standard Time</option>
                                            <option value="8">Arizona</option>
                                            <option value="6">Atlantic time (US &amp; Canada)</option>
                                            <option value="1" selected="">Central Time (US &amp; Canada)</option>
                                            <option value="0">Eastern Time (US &amp; Canada)</option>
                                            <option value="5">Indiana (East)</option>
                                            <option value="2">Mountain Time (US &amp; Canada)</option>
                                            <option value="3">Pacific time (US &amp; Canada)</option>
                                            <option value="7">Saskatchewan (CST)</option>
                                        </select>
                                    </div>
                                    <div class="form-group form-group-sm col-sm-6">
                                        <label for="reg_fl_zip" >ZIP/POSTAL CODE</label>
                                        <input name="newFleet[zip]" placeholder="ZIP/POSTAL CODE" class="form-control" maxlength="10" id="reg_fl_zip"/>
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="form-group form-group-sm col-sm-6">
                                        <label for="reg_fl_car_name" >Carrier name</label>
                                        <input type="text" name="newFleet[car_name]" class="form-control" id="reg_fl_car_name" placeholder="Carrier name"/>
                                    </div>
                                    <div class="form-group form-group-sm col-sm-6">
                                        <label for="reg_fl2_size" >Fleet size</label>
                                        <input data-mask="0000" name="newFleet[size]" class="form-control" id="reg_fl2_size" placeholder="Fleet size"/>
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="form-group form-group-sm col-sm-6">
                                        <label for="reg_fl_office_addr" >Main office address</label>
                                        <input type="text" name="newFleet[office_addr]" class="form-control" id="reg_fl_office_addr" placeholder="Main office address"/>
                                    </div>
                                     <div class="form-group form-group-sm col-sm-6">
                                        <label for="reg_fl_ein">EIN</label>
                                    <input type="text" name="newFleet[ein]" class="form-control" id="reg_fl_ein" placeholder="EIN"/>
                                    </div>
                                </div>
                                <br />
                            </div>
                            <!-- USER -->
                            <div class="user_row" style="display: none;">
                                <div class="form-group form-group-sm">
                                    <label for="user_select">User</label>
                                    <div class="row">
                                        <div class="col-xs-8">
                                            <input id="user_select" class="form-control" type="text" onfocus="orderController.checkUsers(this)" onkeyup="orderController.checkUsers(this)" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" autocomplete="off" />
                                            <ul class="dropdown-menu" id="userList"></ul>
                                        </div>
                                        <div class="col-xs-4">
                                            <button type="button" onclick="orderController.newUser(this)" class="btn btn-sm btn-default btn-block newUser" id="btnNewUser">New User</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div id="createEldUser" class="mt-3" style="display: none;">
                                <h5 class="header">Create User</h5>
                                <hr />
                                <div class="row">
                                    <div class="form-group form-group-sm col-sm-6" id="reg_fl_type_place">
                                        <label for="reg_fl_type">COMPANY POSITION</label>
                                        <select name="newUser[type]" class="form-control" id="reg_fl_type">
                                            <option value="5">Safety Director/Administrator</option><option value="4">Dispatcher</option><option value="7">Driver</option>
                                        </select>
                                    </div>
                                    <div class="form-group form-group-sm col-sm-6">
                                        <label for="reg_fl_email">Email</label>
                                        <input name="newUser[email]" type="text" class="form-control" id="reg_fl_email" placeholder="Email" onfocus="orderController.liveCheckEmail(this)" onkeyup="orderController.liveCheckEmail(this)" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"/>
                                        <ul class="dropdown-menu" id="searchEmailList"></ul>
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="form-group form-group-sm col-sm-6">
                                        <label for="reg_fl_name">First Name</label>
                                        <input type="text" name="newUser[name]" class="form-control" id="reg_fl_name" placeholder="First Name"/>
                                    </div>
                                    <div class="form-group form-group-sm col-sm-6">
                                        <label for="reg_fl_last">Last Name</label>
                                        <input type="text" name="newUser[last]" class="form-control" id="reg_fl_last" placeholder="Last Name"/>
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="form-group form-group-sm col-sm-6">
                                        <label for="reg_fl_phone">Phone</label>
                                        <input type="text" name="newUser[phone]" class="form-control" id="reg_fl_phone" placeholder="Phone" data-mask="000 000 0000"/>
                                    </div>
                                    <div class="form-group form-group-sm col-sm-6">
                                        <label for="reg_fl_ext">Extention</label>
                                        <input type="text" name="newUser[ext]" class="form-control" id="reg_fl_ext" placeholder="Extention" data-mask="0000000000"/>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <!-- SOLO -->
                        <div class="block-bordered p-4 mb-4" id="soloDriverPlace" data-manager="true" style="display: none;">
                            <div class="form-group form-group-sm">
                                <label for="address">Solo Driver</label>
                                <div class="row">
                                    <div class="col-xs-8">
                                        <input id="solo_driver_select" class="form-control" type="text" onfocus="orderController.checkSoloDriver(this)" onkeyup="orderController.checkSoloDriver(this)" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" autocomplete="off" />
                                        <ul class="dropdown-menu" id="soloDriverList"></ul>
                                    </div>
                                    <div class="col-xs-4">
                                       <button type="button" onclick="orderController.newSoloDriver(this)" class="btn btn-sm btn-default btn-block newSoloDriver">New Solo Driver</button>
                                    </div>
                                </div>
                            </div>
                            <div id="userSoloDriverForm">
                                <h5 class="header">Create User</h5>
                                <hr />
                                <div class="form-group form-group-sm">
                                    <label for="reg_fl_email">Email</label>
                                    <input type="text" name="newUserSolo[email]" class="form-control" id="reg_solo_email" placeholder="Email"/>
                                    <ul class="dropdown-menu" id="searchEmailSoloList"></ul>
                                </div>
                                <div class="row">
                                    <div class="form-group form-group-sm col-sm-6">
                                        <label for="reg_fl_name">First Name</label>
                                        <input type="text" name="newUserSolo[name]" class="form-control" id="reg_solo_name" placeholder="First Name"/>
                                    </div>
                                    <div class="form-group form-group-sm col-sm-6">
                                        <label for="reg_fl_last">Last Name</label>
                                        <input type="text" name="newUserSolo[last]" class="form-control" id="reg_solo_last" placeholder="Last Name"/>
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="form-group form-group-sm col-sm-6">
                                        <label for="reg_fl_phone">Phone</label>
                                        <input type="text" name="newUserSolo[phone]" class="form-control" id="reg_solo_phone" placeholder="Phone" data-mask="000 000 0000"/>
                                    </div>
                                    <div class="form-group form-group-sm col-sm-6">
                                        <label for="reg_fl_ext">Extention</label>
                                        <input type="text" name="newUserSolo[ext]" class="form-control" id="reg_solo_ext" placeholder="Extention" data-mask="0000000000"/>
                                    </div>
                                </div>
                            </div>
                            <div id="soloDriverForm">
                                <h5 class="header mt-3">Create Solo Driver</h5>
                                <hr />
                                <div class="row">
                                    <div class="form-group form-group-sm col-sm-6">
                                        <label for="reg_dr_usdot">USDOT #</label>
                                        <input type="text" name="newSoloDriver[usdot]" id="reg_dr_usdot" class="form-control"  maxlength="10" data-mask="0000000000" placeholder="USDOT #" />
                                    </div>
                                    <div class="form-group form-group-sm col-sm-6">
                                        <label for="reg_dr_state">STATE/PROVINCE</label>
                                        <select name="newSoloDriver[state]" class="form-control" id="reg_dr_state">
                                            <option value="0">STATE/PROVINCE</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="form-group form-group-sm col-sm-6">
                                        <label for="reg_dr_city">CITY</label>
                                        <input name="newSoloDriver[city]" type="text"  placeholder="CITY" class="form-control" id="reg_dr_city"/>
                                    </div>
                                    <div class="form-group form-group-sm col-sm-6">
                                        <label for="reg_dr_zip" >ZIP/POSTAL CODE</label>
                                        <input name="newSoloDriver[zip]" placeholder="ZIP/POSTAL CODE" class="form-control" maxlength="10" id="reg_dr_zip"/>
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="form-group form-group-sm col-sm-6">
                                        <label for="dr_license_number">License Number</label>
                                        <input name="newSoloDriver[license_number]" id="dr_license_number" placeholder="LICENSE NUMBER" class="form-control" type="text">
                                    </div>
                                    <div class="form-group form-group-sm col-sm-6">
                                        <label for="dr_license_state">License State</label>
                                        <select name="newSoloDriver[license_state]" class="form-control" id="dr_license_state">
                                            <option value="0">STATE/PROVINCE</option>
                                            <optgroup label="USA">
                                                <option value="1" data-short="AL">Alabama</option><option value="2" data-short="AK">Alaska</option><option value="3" data-short="AZ">Arizona</option><option value="4" data-short="AR">Arkansas</option><option value="5" data-short="CA">California</option><option value="6" data-short="CO">Colorado</option><option value="7" data-short="CT">Connecticut</option><option value="8" data-short="DE">Delaware</option><option value="9" data-short="FL">Florida</option><option value="10" data-short="GA">Georgia</option><option value="11" data-short="HI">Hawaii</option><option value="12" data-short="ID">Idaho</option><option value="13" data-short="IL">Illinois</option><option value="14" data-short="IN">Indiana</option><option value="15" data-short="IA">Iowa</option><option value="16" data-short="KS">Kansas</option><option value="17" data-short="KY">Kentucky</option><option value="18" data-short="LA">Louisiana</option><option value="19" data-short="ME">Maine</option><option value="20" data-short="MD">Maryland</option><option value="21" data-short="MA">Massachusetts</option><option value="22" data-short="MI">Michigan</option><option value="23" data-short="MN">Minnesota</option><option value="24" data-short="MS">Mississippi</option><option value="25" data-short="MO">Missouri</option><option value="26" data-short="MT">Montana</option><option value="27" data-short="NE">Nebraska</option><option value="28" data-short="NV">Nevada</option><option value="29" data-short="NH">New Hampshire</option><option value="30" data-short="NJ">New Jersey</option><option value="31" data-short="NM">New Mexico</option><option value="32" data-short="NY">New York</option><option value="33" data-short="NC">North Carolina</option><option value="34" data-short="ND">North Dakota</option><option value="35" data-short="OH">Ohio</option><option value="36" data-short="OK">Oklahoma</option><option value="37" data-short="OR">Oregon</option><option value="38" data-short="PA">Pennsylvania</option><option value="39" data-short="RI">Rhode Island</option><option value="40" data-short="SC">South Carolina</option><option value="41" data-short="SD">South Dakota</option><option value="42" data-short="TN">Tennessee</option><option value="43" data-short="TX">Texas</option><option value="44" data-short="UT">Utah</option><option value="45" data-short="VT">Vermont</option><option value="46" data-short="VA">Virginia</option><option value="47" data-short="WA">Washington</option><option value="48" data-short="WV">West Virginia</option><option value="49" data-short="WI">Wisconsin</option><option value="50" data-short="WY">Wyoming</option><option value="64" data-short="DC">Washington DC</option>
                                            </optgroup>
                                            <optgroup label="Canada">
                                                <option value="51" data-short="AB">Alberta</option><option value="52" data-short="BC">British Columbia</option><option value="53" data-short="MB">Manitoba</option><option value="54" data-short="NB">New Brunswick</option><option value="55" data-short="NL">Newfoundland and Labrador</option><option value="56" data-short="NS">Nova Scotia</option><option value="57" data-short="NT">Northwest Territories</option><option value="58" data-short="NU">Nunavut</option><option value="59" data-short="ON">Ontario</option><option value="60" data-short="PE">Prince Edward Island</option><option value="61" data-short="QC">Quebec</option><option value="62" data-short="SK">Saskatchewan</option><option value="63" data-short="YT">Yukon</option>
                                            </optgroup>
                                        </select>
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="form-group form-group-sm col-sm-6">
                                        <label for="reg_dr_car_name">Carrier name</label>
                                        <input type="text" name="newSoloDriver[car_name]" class="form-control" id="reg_dr_car_name" placeholder="Carrier name"/>
                                    </div>
                                    <div class="form-group form-group-sm col-sm-6">
                                        <label for="reg_dr_office_addr">Main office address</label>
                                        <input type="text" name="newSoloDriver[addr]" class="form-control" id="reg_dr_office_addr" placeholder="Main office address"/>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <h3 class="header">1. Personal data</h3>
                        <div class="block-bordered p-4 mb-4" id="infoOrderBlock">
                            <div class="row" style="display: none">
                                <div class="col-sm-6">
                                    <div class="form-group form-group-sm">
                                        <label for="device_type_id">ELD Device manufacturer</label>
                                        <select name="device_type_id" class="form-control" id="device_type_id">
                                            
                                               <!--<option value="1">Ez-Simple ELD</option>-->
                                            <option value="2">Ez-Smart ELD</option>
                                           
                                            
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-sm-6">
                                    <!--<div class="form-group form-group-sm">
                                        <label for="amount">Quantity of ELD devices</label>
                                        <input name="amount" id="amount" class="form-control w-25 check_input_number" type="number" min="0" max="999" onchange="orderController.showBoxEldTariffs(this, $('#device_type_id').val())" onkeyup="orderController.showBoxEldTariffs(this, $('#device_type_id').val())">
                                    </div>-->
                                    <div class="form-group form-group-sm">
                                        <label for="name">First Name</label>
                                        <input name="name" id="name" class="form-control" type="text">
                                    </div>
                                    <div class="form-group form-group-sm">
                                        <label for="surname">Last Name</label>
                                        <input name="surname" id="surname" class="form-control" type="text">
                                    </div>
                                    <div class="form-group form-group-sm">
                                        <label for="phone">Phone</label>
                                        <input name="phone" id="phone" class="form-control" type="text" data-mask="000 000 0000">
                                    </div>
                                </div>
                                <div class="col-sm-6">
                                    <div class="form-group form-group-sm" id="addressesOrderPlace" style="display: none;">
                                        <label for="city">Addresses List</label>
                                        <select name="addressesOrder" id="addressesOrder" class="form-control" onchange="orderController.autocompleteAddressOrder(this)">
                                            <option value="0">Select Address</option>
                                        </select>
                                    </div>
                                    <div class="form-group form-group-sm">
                                        <label for="address">Delivery Address</label>
                                        <div class="row">
                                            <div class="col-xs-8">
                                                <input name="address" id="address" class="form-control" type="text" title="Primary address line" placeholder="Primary address line">
                                            </div>
                                            <div class="col-xs-4">
                                                <input name="address1" id="address1" class="form-control" type="text" title="Suite or apartment number only" placeholder="Apt Number">
                                            </div>
                                        </div>
                                    </div>
                                    <div class="form-group form-group-sm">
                                        <label for="city">Delivery City</label>
                                        <input name="city" value="" id="city" class="form-control" type="text">
                                    </div>
                                    <div class="form-group form-group-sm">
                                        <label for="state">Delivery State</label>
                                        <select name="state" id="state" class="form-control">
                                            <option value="0">STATE/PROVINCE</option>
                                        </select>
                                    </div>
                                    <div class="form-group form-group-sm">
                                        <label for="zip">Delivery Zip Code</label>
                                        <input id="zip" name="zip" class="form-control" type="text" maxlength="7" onclick="orderController.calculate()" onchange="orderController.calculate()" onkeyup="orderController.calculate()">
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div id="order-list">
                            <h3 class="header">2. Order list</h3>
                            <div class="border-table mb-4">
                                <table class="table table-order-devices" id="tableProductList"><tbody></tbody></table>
                            </div>
                        </div>
                        <h3 class="header" style="display: none;">Payments Methods ELD</h3>
                        <div class="row row-tariffs mb-3" id="eldTariffs"></div>
                        <h3 class="header" style="display: none;">Payments Methods Camera</h3>
                        <div class="row row-tariffs mb-3" id="cameraTariffs"></div>
                        <div class="row" style="display: none;">
                            <div class="col-sm-6">
                                <div class="form-group form-group-sm">
                                    <label for="order_type">Order type</label>
                                    <select name="order_type" class="form-control" id="order_type" onclick="orderController.calculate()" onchange="orderController.calculate()" onkeyup="orderController.calculate()"></select>
                                </div>
                            </div>
                            <div class="col-sm-6">
                                <div class="form-group form-group-sm">
                                    <label for="order_camera_type">Order camera type</label>
                                    <select name="order_camera_type" class="form-control" id="order_camera_type" onclick="orderController.calculate()" onchange="orderController.calculate()" onkeyup="orderController.calculate()"></select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-4 col-right">
                    <div class="px-2 py-4">
                        <div class="check_buttons_block mb-3 w-100" id="checkboxFleetOrSolo" style="display: none;" data-manager="true">
                            <button type="button" class="btn btn-default active" onclick="doActive(this);orderController.fleetPlaceShow();" data-val="1">Fleet</button>
                            <button type="button" class="btn btn-default" onclick="doActive(this);orderController.soloPlaceShow();" data-val="0">Solo Driver</button>
                        </div>
                        <div id="orderPriceCountPlace" class="mb-3">
                        </div>
                        <div class="form-group form-group-sm mb-4">
                            <textarea name="notes" id="notes" class="form-control" rows="3" placeholder="Order Notes"></textarea>
                        </div>
                        <div class="checkbox" id="is_demo_eld" style="display: none;" data-manager="true">
                            <label>
                                <input type="checkbox" value="1"> Demo
                            </label>
                        </div>
                        <div class="checkbox">
                            <label>
                                <input name="pick_up" value="1" type="checkbox" onclick="orderController.calculate()" onchange="orderController.calculate()" onkeyup="orderController.calculate()"> Pick up from office
                            </label>
                        </div>
                        <div class="checkbox">
                            <label>
                                <input name="overnight" value="1" type="checkbox" title="One overnight package can contain up to 12 devices or 5 cables, $31.99 for each package" onclick="orderController.calculate()" onchange="orderController.calculate()" onkeyup="orderController.calculate()"> Overnight Delivery
                            </label>
                        </div>
                        <div class="checkbox" id="agreementCheckbox" style="display: none;">
                            <label>
                                <input type="checkbox" id="agreementCheckboxItem" onclick="openLeaseAndAgreementPopup(this);" title="ELD/Dashcam Order"> <span>EQUIPMENT PURCHASE AND SOFTWARE SUBSCRIPTION SERVICE AGREEMENT</span>
                            </label>
                        </div>
                        <div class="checkbox" id="agreementLeaseCheckbox" style="display: none;">
                            <label>
                                <input type="checkbox" id="agreementLeaseCheckboxItem" onclick="openLeaseAndAgreementPopup(this);" title="ELD/Dashcam Lease Order"> <span>EQUIPMENT LEASE AND SOFTWARE SUBSCRIPTION SERVICE AGREEMENT</span>
                            </label>
                        </div>
                        <div id="orderCreditBlock" style="display: none;">
                            <div class="mt-4">
                                <h5 class="header">SmartWitness Application</h5>
                                <ul class="list-group list-group-order-price mb-1" id="list_eld_credit_fee">
                                </ul>
                                <div class="checkbox mb-2">
                                    <label>
                                        <input id="all_order_credit" type="checkbox" name="all_order_credit" onclick="orderController.checkAllInCredit();orderController.calculate();"> All order in credit
                                    </label>
                                </div>
                                <div class="row">
                                    <div class="col-md-6 pr-lg-1 mb-1">
                                        <a type="button" class="btn btn-sm btn-block btn-default" target="_blank" href="/docs/uploads/FleetManagmentCreditApplication.pdf">Download</a>
                                    </div>
                                    <div class="col-md-6 pl-lg-1 mb-1">
                                        <div id="fileSmartWitness">
                                            <div class="fileinput fileinput-new" data-provides="fileinput">
                                                <div class="fileinput-preview thumbnail" data-target="emplFile" data-trigger="fileinput" style="display: none;"></div>
                                                <div>
                                                    <span class="btn btn-default btn-block btn-file">
                                                        <span class="fileinput-new">Upload</span>
                                                        <span class="fileinput-exists">Change</span>
                                                        <input type="file" class="emplFile" name="emplFile" accept=".pdf">
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <input id="uploadSmartWitnessInput" name="uploadSmartWitnessInput" value="" style="display: none;">
                            </div>
                            <div class="checkbox mt-1" id="creditApplicationChanged">
                                <label>
                                    <input type="checkbox" value="1" disabled> Credit Application Changed
                                </label>
                            </div>
                        </div>
                        <button type="button" class="btn btn-default btn-block mt-4" id="send_order" onclick="orderController.order()">ORDER</button>
                    </div>
                </div>
            </div>
        </form>`;
            
        }

        if (moment(date).isSameOrAfter(dateStartDisc) && moment(date).isSameOrBefore(dateEndDisc)) {
            if (localStorage.getItem('blackFriday') != 1) {
                localStorage.setItem('blackFriday', 1);

                let content = `
                    <div class="downloadRec-popup blackFriday">
                        <div class="downloadRec-bg">
                            <div class="downloadRec-content">
                                <div class="download-img"><img src="/dash/assets/img/blackFriday/lamp.svg" alt="lamp image"></div>
                                <div class="download-title"><img src="/dash/assets/img/blackFriday/text-title.svg" alt="title text"></div>
                                <div class="download-text"><img src="/dash/assets/img/blackFriday/text-desc.svg" alt="description text"></div>
                                <div class="download-text">Buy one get one 50% off*</div>
                                <div class="download-row">
                                    <div class="row-item">
                                        <div class="row-img"><img src="/dash/assets/img/blackFriday/device.svg" alt="Ez-Smart ELD"></div>
                                        <div class="row-title">Ez-Smart ELD</div>
                                    </div>
                                    <div class="row-item">
                                        <div class="row-img"><img src="/dash/assets/img/blackFriday/or.svg" alt="text"></div>
                                    </div>
                                    <div class="row-item">
                                        <div class="row-img"><img src="/dash/assets/img/blackFriday/camera.svg" alt="EZSmartCam"></div>
                                        <div class="row-title">EZSmartCam</div>
                                    </div>
                                </div>
                                <div class="download-btns">
                                    <div class="btns-item btn btn-primary-new" onclick="document.querySelector('.downloadRec-popup').remove()">Take it</div>
                                </div>

                                <div class="content-bg left-bg"><img src="/dash/assets/img/blackFriday/bg-left.svg" alt="left bg"></div>
                                <div class="content-bg right-bg"><img src="/dash/assets/img/blackFriday/bg-right.svg" alt="right bg"></div>
                            </div>
                        </div>
                    </div>
                `;

                $('.dash_wrap .content').append(content);
            }
        }
        
        self.modalElement = showModal('New Order', view, self.modalId, '');
        self.modalElement.addClass('modal-order').attr('data-userId', self.userId);
        $('.new_order.btn').prop('disabled', false);

        //Hide manager forms
        self.modalElement.find('*[data-manager="true"]').hide();

        self.getTableProductList();
        //Append State List
        $.each(locationState.getStates(), function(key, state){
            $('#state').append('<option value="'+state.id+'" data-short="'+state.short+'">'+state.name+'</option>');
        });

        if(curUserIsEzlogzEmployee()) {
            $("#agreementCameraCheckbox, #agreementCheckbox").hide();
            orderController.fleetPlaceShow(self.modalElement);
        }

        $('#orderForm input[name="phone"], #orderForm input[name="newUserSolo[phone]"], #orderForm input[name="newUser[phone]"]').mask('000 000 0000');
        $('#reg_fl_ein').mask('0A-0000000', {'translation': {'A': {pattern: /[0-9]/, optional: true}}});

        $("body").on('DOMSubtreeModified', "#fileSmartWitness .fileinput-preview", function() {
            var bytesArray = $('#fileSmartWitness .fileinput-preview img').attr('src');
            if(typeof bytesArray !== 'undefined' && bytesArray !== '') {
                $('#uploadSmartWitnessInput').val(bytesArray);
                $('#creditApplicationChanged input').prop('checked', true);
            }
        });
        if(typeof self.default_values != 'undefined'){
            $.each(self.default_values, function(inputId, value){
                self.modalElement.find('#'+inputId).val(value);
            })
        }
        orderController.getOrderAddresses(0);
    };

    this.getTableProductList = function() {
        var item = `
            <tr class="product_item" data-id="2" data-parent_id="0" data-price="199.99" data-img_url="stikers.png" data-description="ELD Device manufacturer" data-name="Ez-Smart ELD" data-category_id="1">
                <td class="text-center"><img src="/dash/assets/img/eld/thumb/stikers.png" onclick="orderController.showProductInfo(this)"></td>
                <td>Ez-Smart ELD<p class="description">ELD Device manufacturer</p></td>
                <td class="hidden-xs hidden-sm"></td>
                <td class="text-center" style="min-width:70px;">
                    <input name="amount" id="amount" class="product_numbers form-control check_input_number" type="number" min="0" max="999" value="0" onchange="orderController.showBoxEldTariffs(this, 2)" onkeyup="orderController.showBoxEldTariffs(this, 2)">
                </td>
                <td class="text-center">$199.99</td>
                <td class="text-center"><button type="button" class="clear-icon" onclick="orderController.clearCables(this)"></button></td>
            </tr>
        `;
        // $('#order_type').empty();

        $.each(self.products, function(key, val) {
            var selectFeatures = '';
            if(typeof val.related_products !== 'undefined') {
                selectFeatures += '<select class="form-control" name="related_products['+ val.id +'][parent_id]" onchange="orderController.changeRelatedProduct(this);" >';
                $.each(val.related_products, function (k, related) {
                    if(related.category_id === val.category_id)
                        selectFeatures += '<option value="'+ related.id +'">'+ related.name +' '+ moneyFormat(related.price) +'</option>';
                });
                selectFeatures += '</select>';
            }

            if ($('#device_type_id').val() == 1) {
            // if ($('#device_type_id').val() == 1 && val.device_type_id == 1) {
                item += '' +
                    '<tr class="product_item" data-id="'+ val.id +'" data-parent_id="' + val.parent_id +'" data-price="'+ val.price +'" data-img_url="'+ val.img_url +'" data-description="'+ val.description +'" data-name="'+ val.name +'" data-category_id="'+ val.category_id +'">\n' +
                    '<td class="text-center"><img src="/dash/assets/img/eld/thumb/'+ val.thumb_url +'" onclick="orderController.showProductInfo(this)"></td>\n' +
                    '<td>'+ val.name +'<p class="description">'+ val.short_description +'</p></td>\n' +
                    '<td class="hidden-xs hidden-sm">'+ (val.category_id === 2 ? selectFeatures : '') +'</td>\n' +
                    '<td class="text-center" style="min-width:70px;">\n' +
                    '<input name="products['+ val.id +']" type="number" min="0" max="999" class="product_numbers form-control check_input_number" value="0" onchange="orderController.showBoxCameraTariffs(this);" onkeyup="orderController.showBoxCameraTariffs(this);" autocomplete="custom" />' +
                    '<div class="visible-xs visible-sm mt-2">'+ (val.category_id === 2 ? selectFeatures : '') +'</div>\n' +
                    '</td>\n' +
                    '<td class="text-center">'+ moneyFormat(val.price) +'</td>\n' +
                    '<td class="text-center"><button type="button" class="clear-icon" onclick="orderController.clearCables(this)"></button></td>\n' +
                    '</tr>';
            } else if ($('#device_type_id').val() == 3 && val.device_type_id == 3) {
                item += '' +
                    '<tr class="product_item" data-id="'+ val.id +'" data-parent_id="' + val.parent_id +'" data-price="'+ val.price +'" data-img_url="'+ val.img_url +'" data-description="'+ val.description +'" data-name="'+ val.name +'" data-category_id="'+ val.category_id +'">\n' +
                    '<td class="text-center"><img src="/dash/assets/img/eld/thumb/'+ val.thumb_url +'" onclick="orderController.showProductInfo(this)"></td>\n' +
                    '<td>'+ val.name +'<p class="description">'+ val.short_description +'</p></td>\n' +
                    '<td class="hidden-xs hidden-sm">'+ (val.category_id === 2 ? selectFeatures : '') +'</td>\n' +
                    '<td class="text-center" style="min-width:70px;">\n' +
                    '<input name="products['+ val.id +']" type="number" min="0" max="999" class="product_numbers form-control check_input_number" value="0" onchange="orderController.showBoxCameraTariffs(this);" onkeyup="orderController.showBoxCameraTariffs(this);" autocomplete="custom" />' +
                    '<div class="visible-xs visible-sm mt-2">'+ (val.category_id === 2 ? selectFeatures : '') +'</div>\n' +
                    '</td>\n' +
                    '<td class="text-center">'+ moneyFormat(val.price) +'</td>\n' +
                    '<td class="text-center"><button type="button" class="clear-icon" onclick="orderController.clearCables(this)"></button></td>\n' +
                    '</tr>';
            // } else if ($('#device_type_id').val() == 2 && val.id != 6) {
            } else if ($('#device_type_id').val() == 2) {
                item += '' +
                    '<tr class="product_item" data-id="'+ val.id +'" data-parent_id="' + val.parent_id +'" data-price="'+ val.price +'" data-img_url="'+ val.img_url +'" data-description="'+ val.description +'" data-name="'+ val.name +'" data-category_id="'+ val.category_id +'">\n' +
                    '<td class="text-center"><img src="/dash/assets/img/eld/thumb/'+ val.thumb_url +'" onclick="orderController.showProductInfo(this)"></td>\n' +
                    '<td>'+ val.name +'<p class="description">'+ val.short_description +'</p></td>\n' +
                    '<td class="hidden-xs hidden-sm">'+ (val.category_id === 2 ? selectFeatures : '') +'</td>\n' +
                    '<td class="text-center" style="min-width:70px;">\n' +
                    '<input name="products['+ val.id +']" type="number" min="0" max="999" class="product_numbers form-control check_input_number" value="0" onchange="orderController.showBoxCameraTariffs(this);" onkeyup="orderController.showBoxCameraTariffs(this);" autocomplete="custom" />' +
                    '<div class="visible-xs visible-sm mt-2">'+ (val.category_id === 2 ? selectFeatures : '') +'</div>\n' +
                    '</td>\n' +
                    '<td class="text-center">'+ moneyFormat(val.price) +'</td>\n' +
                    '<td class="text-center"><button type="button" class="clear-icon" onclick="orderController.clearCables(this)"></button></td>\n' +
                    '</tr>';
            }
        });
        $('#tableProductList tbody').append(item);
    };
    self.initRequest();
}

$('body').off('keydown', '#orderForm input').on('keydown', '#orderForm input', function(){
    resetError();
});

$('body').off('click', 'a[href="#"]').on('click', 'a[href="#"]', function(e){
    e.preventDefault();
});

//Autocomplete form
$(document).off('keyup', '#createEldUser input[name="newUser[name]"], #userSoloDriverForm input[name="newUserSolo[name]"]').on('keyup', '#createEldUser input[name="newUser[name]"], #userSoloDriverForm input[name="newUserSolo[name]"]', function() {
    $('#infoOrderBlock input[name="name"]').val($(this).val());
});
$(document).off('keyup', '#createEldUser input[name="newUser[last]"], #userSoloDriverForm input[name="newUserSolo[last]"]').on('keyup', '#createEldUser input[name="newUser[last]"], #userSoloDriverForm input[name="newUserSolo[last]"]', function() {
    $('#infoOrderBlock input[name="surname"]').val($(this).val());
});
$(document).off('keyup', '#createEldUser input[name="newUser[phone]"], #userSoloDriverForm input[name="newUserSolo[phone]"]').on('keyup', '#createEldUser input[name="newUser[phone]"], #userSoloDriverForm input[name="newUserSolo[phone]"]', function() {
    $('#infoOrderBlock input[name="phone"]').val($(this).val());
});
$(document).off('keyup', '#createFleet input[name="newFleet[office_addr]"], #soloDriverForm input[name="newSoloDriver[addr]"]').on('keyup', '#createFleet input[name="newFleet[office_addr]"], #soloDriverForm input[name="newSoloDriver[addr]"]', function() {
    $('#infoOrderBlock input[name="address"]').val($(this).val());
});
$(document).off('keyup', '#createFleet input[name="newFleet[city]"], #soloDriverForm input[name="newSoloDriver[city]"]').on('keyup', '#createFleet input[name="newFleet[city]"], #soloDriverForm input[name="newSoloDriver[city]"]', function() {
    $('#infoOrderBlock input[name="city"]').val($(this).val());
});
$(document).off('keyup', '#createFleet input[name="newFleet[zip]"], #soloDriverForm input[name="newSoloDriver[zip]"]').on('keyup', '#createFleet input[name="newFleet[zip]"], #soloDriverForm input[name="newSoloDriver[zip]"]', function() {
    $('#infoOrderBlock input[name="zip"]').val($(this).val());
});
$(document).off('keyup', '#createFleet input[name="newFleet[state]"], #soloDriverForm input[name="newSoloDriver[state]"]').on('keyup', '#createFleet input[name="newFleet[state]"], #soloDriverForm input[name="newSoloDriver[state]"]', function() {
    $('#infoOrderBlock select[name="state"]').val($(this).val());
});

$(document).on('change', '#device_type_id',function (e) {
    // if ($('#device_type_id').val() == 1) {
        $('#order-list').show();
    // } else {
    //     $('#order-list').hide();
    // }

    $('#tableProductList tbody').html('');
    orderController.showBoxCameraTariffs();
    orderController.calculate(e);
    self.getTableProductList();
    orderController.showBoxEldTariffs(this, $('#device_type_id').val());
});
