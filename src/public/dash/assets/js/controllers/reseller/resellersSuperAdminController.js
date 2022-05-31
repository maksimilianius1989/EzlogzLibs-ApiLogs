function resellerController() {
    var self = this;
    this.filters = [];
    this.resellers = [];
    this.states = [];
    this.curReseller = false;
    this.cntrlUrl = "/db/api/apiResellerController.php";
    this.init = function () {
        $('#new_reseller').remove();
        AjaxController('getResellers', {}, self.cntrlUrl, self.getResellersHandler, errorBasicHandler, true);
    }
    this.getResellersHandler = function (response) {
        self.states = response.data.states;
        self.resellers = response.data.resellers;
        self.initView();
    }

    this.initView = function () {
        if (window.location.pathname == "/dash/resellers/resellers/") {
            var curAmount = $('#resellers_table tbody tr').length;
            $('#resellers_table tbody').empty();
            $.each(self.resellers, self.appendReseller);
            if (self.resellers.length > 0)
                if (curAmount == 0) {
                    $('.tablesorter').tablesorter({sortList: [[1, 0]]});

                } else {
                    $('.tablesorter').trigger('update');
                    setTimeout(function () {
                        var sort = $('.tablesorter').get(0).config.sortList;
                        $(".tablesorter").trigger("sorton", [sort]);
                    }, 100);
                }
        } else if (window.location.pathname == "/dash/resellers/resellers_report/") {
            $.each(self.resellers, function (key, reseller) {
                $('#reseller_report_reseller').append(`<option value="${reseller.id}">${reseller.id} ${reseller.store_name}</option>`)
            });
            self.generateReport();
        } else if (window.location.pathname == "/dash/resellers/resellers_payout/") {
            AjaxController('getPayoutRequests', {}, self.cntrlUrl, self.getPayoutRequestsHandler, errorBasicHandler, true);
        }
    }

    this.appendReseller = function (key, reseller) {
        $('#resellers_table tbody').append(`<tr data-id="${reseller.id}" onclick="resC.oneResellerPopup(${reseller.id})">
			<td>${reseller.id}</td>
			<td>${reseller.store_name}</td>
			<td>${reseller.phone}</td>
			<td>${reseller.ownerName}</td>
		</tr>`);
    }

    this.paidReseller = function (resellerId, paymentId) {
        AjaxController('paidReseller', {resellerId: resellerId, paymentId: paymentId}, self.cntrlUrl, self.paidResellerHandler, errorBasicHandler, true);
    }

    this.paidResellerHandler = function (response) {
        self.initView();
    }

    this.getPayoutRequestsHandler = function (response) {
        var requests = response.data.requests;
        $('#resellers_table tbody').empty();
        $.each(requests, function (key, request) {

            var reseller = self.getResellerById(request.resellerId);
            var listOfButtons = [];
            var rowActions = '';
            var record_params = JSON.parse(request.record_params);
            var st = 'New';
            if (record_params == null || record_params.paid == 0) {
                listOfButtons.push('<button onclick="resC.paidReseller(' + reseller.id + ', ' + request.id + ');">Paid</button>');
                rowActions = addTableActionRow(listOfButtons);
            } else {
                st = 'Paid';
            }
            var amount = request.amount < 0 ? request.amount *= (-1) : request.amount;
            $('#resellers_table tbody').append(`<tr>
				<td>${reseller.store_name}</td>
				<td>${timeFromSecToUSAString(request.dateTime)}</td>
				<td>${amount}$</td>
				<td>${st}</td>
				<td>${rowActions}</td>
			</tr>`);
        });
    }
    this.generateReport = function () {
        var year = $('#reseller_report_year').val();
        var month = $('#reseller_report_month').val();
        var reseller = $('#reseller_report_reseller').val();
        var type = $('#reseller_report_type').val();
        AjaxController('generateReport', {year: year, month: month, reseller: reseller, type: type}, self.cntrlUrl, self.generateReportHandler, errorBasicHandler, true);
    }
    this.generateReportHandler = function (response) {
        var balances = response.data.balances;
        var type = response.data.type;

        if (type == 0) {
            $('#resellers_table_balances').hide();
            $('#resellers_table_finals').show();
            $('#resellers_table_finals tbody').empty();
            if (balances.length == 0) {
                $('#resellers_table_finals tbody').append('<tr><td colspan="3" style="font-weight:bold; text-align:center;">No resellers profits</td></tr>');
            }
            $.each(balances, function (key, balance) {
                var reseller = self.getResellerById(balance.resellerId);
                $('#resellers_table_finals tbody').append(`<tr>
					<td>${balance.resellerId}</td>
					<td>${reseller.store_name}</td>
					<td>${balance.balance}$</td>
				</tr>`);
            });
        } else if (type == 1) {
            $('#resellers_table_finals').hide();
            $('#resellers_table_balances').show();
            $('#resellers_table_balances tbody').empty();
            $.each(balances, function (key, balance_record) {
                var reseller = self.getResellerById(balance_record.resellerId);
                $('#resellers_table_balances tbody').append(`<tr>
					<td>${timeFromSecToUSAString(balance_record.dateTime)}</td>
					<td>${reseller.store_name}</td>
					<td>${balance_record.carrierId}</td>
					<td>${balance_record.description}</td>
					<td>${self.getRecordTypeFromTypeId(balance_record.type)}</td>
					<td>${balance_record.amount}</td>
					<td>${balance_record.final_amount}$</td>
				</tr>`);
            });
        }

    }
    this.getEmployeeTypeFromTypeId = function (typeId) {
        var n = 'Employee';
        if (typeId == 1) {
            n = 'Admin';
        } else if (typeId == 2) {
            n = 'Master Admin';
        }
        return n;
    }
    this.getActiveTypeFromActiveId = function (activeId) {
        var n = 'Active';
        if (activeId == 0) {
            n = 'Not Active';
        }
        return n;
    }

    this.getResellerById = function (resellerId) {
        var reseller = {}
        $.each(self.resellers, function (key, resellerIn) {
            if (resellerIn.id == resellerId) {
                reseller = resellerIn;
                return false;
            }
        });
        return reseller;
    }
    this.oneResellerPopup = function (resellerId) {
        new managerResellerCard(resellerId);
    }
    this.filterView = function () {
        $('#resellers_table tbody tr').hide();
        $.each(self.resellers, function (key, reseller) {
            var show = true;
            $('#resellers_table .paginationInput').each(function () {
                var vl = $(this).val();
                var datat = $(this).attr('data-type');
                if (vl == '')
                    return true;
                if (String(reseller[datat]).toLowerCase().indexOf(vl) == -1) {
                    show = false;
                }
            });
            if (show) {
                $('#resellers_table tbody tr[data-id="' + reseller.id + '"]').show();
            }
        });

    }


    this.newResellerSubmit = function (frm, ev) {
        ev.preventDefault();
        var formData = getFormData(frm);
        c(formData);
        AjaxController('newReseller', formData, self.cntrlUrl, self.init, self.newResellerErrorHandler, true);
    }
    this.updateResellerSubmit = function (frm, ev) {
        ev.preventDefault();
        var formData = getFormData(frm);
        c(formData);
        AjaxController('updateReseller', formData, self.cntrlUrl, self.updateResellerSubmitHandler, self.newResellerErrorHandler, true);
    }
    this.updateResellerSubmitHandler = function (response) {
        c(response);
        $('#edit_reseller').remove();
        $('#reseller_info_box').remove();
        self.init();
        setTimeout(function(){
            if(response.code == '000'){
                self.oneResellerPopup(response.data.reseller);
            }
        }, 1000);
        
    }

    this.newResellerErrorHandler = function (response) {
        alertError($('#new_reseller .save_error'), response.message, 3000);
    }

    this.getRecordTypeFromTypeId = function (type) {
        var n = 'Credit'
        if (type == 1) {
            n = 'Charge';
        } else if (type == 2) {
            n = 'Payment';
        }
        return n;
    }

    this.newResellerBox = function () {
        var statesOpts = '';
        $.each(self.states, function (key, state) {
            statesOpts += '<option value="' + state.id + '">' + state.name + '</option>'
        });
        var content = `<form class="form-horizontal row" id="newResellerBox" onsubmit="resC.newResellerSubmit(this, event)">
		<div class="col-sm-6">
			<div class="form-group">
				<label for="storeNumber" class="col-sm-3 control-label">Store Number</label>
				<div class="col-sm-9">
					<input type="number" class="form-control" id="storeNumber" name="id" required="" maxlength="10">
				</div>
			</div>
			<div class="form-group">
				<label for="inputName" class="col-sm-3 control-label">Company Name</label>
				<div class="col-sm-9">
					<input type="text" class="form-control" id="inputName" name="store_name" required="" maxlength="132">
				</div>
			</div>
			<div class="form-group">
				<label for="inputEmail" class="col-sm-3 control-label">Owner Email</label>
				<div class="col-sm-6">
					<input type="text" class="form-control" id="inputEmail" name="email" maxlength="132" required="">
				</div>
                <div class="col-sm-3 email_hint">@ezlogz.com</div>
			</div>
			<div class="form-group">
				<label for="inputFirstName" class="col-sm-3 control-label">Owner First Name</label>
				<div class="col-sm-9">
					<input type="text" class="form-control" id="inputFirstName" name="name" maxlength="64" required="">
				</div>
			</div>
			<div class="form-group">
				<label for="inputLastName" class="col-sm-3 control-label">Owner Last Name</label>
				<div class="col-sm-9">
					<input type="text" class="form-control" id="inputLastName" name="last" maxlength="64" required="">
				</div>
			</div>
			<div class="form-group">
				<label for="inputPhone" class="col-sm-3 control-label">Phone</label>
				<div class="col-sm-9">
					<input data-mask="000 000 0000" type="text" class="form-control" id="inputPhone" name="phone">
				</div>
			</div>
			<div class="form-group">
				<label for="inputEIN" class="col-sm-3 control-label">EIN</label>
				<div class="col-sm-9">
					<input type="text" class="form-control" id="inputEIN" name="ein">
				</div>
			</div>
			
		</div>
		<div class="col-sm-6">
			<div class="row" style="border: 1px solid #eee;padding: 10px 10px 0 10px;border-radius: 5px; margin-bottom:5px;">
				<h4 style="text-align:center; margin-top:0">Office Address</h4>
				<div class="form-group">
					<label for="inputOfficeAddress" class="col-sm-3 control-label">Address</label>
					<div class="col-sm-9">
						<input type="text" class="form-control" id="inputOfficeAddress" name="office_address" maxlength="132">
					</div>
				</div>
				<div class="form-group">
					<label for="inputOfficeCity" class="col-sm-3 control-label">City</label>
					<div class="col-sm-9">
						<input type="text" class="form-control" id="inputOfficeCity" name="office_city" maxlength="132">
					</div>
				</div>
				<div class="form-group">
					<label for="inputOfficeState" class="col-sm-3 control-label">State</label>
					<div class="col-sm-9">
						<select id="inputOfficeState" class="form-control" name="office_state">
							<option value="0">Select State</option>
							${statesOpts}
						</select>
					</div>
				</div>
				<div class="form-group">
					<label for="inputOfficeZip" class="col-sm-3 control-label">Zip</label>
					<div class="col-sm-9">
						<input type="text" class="form-control" id="inputOfficeZip" name="office_zip" maxlength="10">
					</div>
				</div>
			</div>
			<div class="row" style="border: 1px solid #eee;padding: 10px 10px 0 10px;border-radius: 5px;margin-bottom:5px;">
				<h4 style="text-align:center; margin-top:0">Store Address</h4>
				<div class="form-group">
					<label for="inputStoreAddress" class="col-sm-3 control-label">Address</label>
					<div class="col-sm-9">
						<input type="text" class="form-control" id="inputStoreAddress" name="store_address" maxlength="132">
					</div>
				</div>
				<div class="form-group">
					<label for="inputStoreCity" class="col-sm-3 control-label">City</label>
					<div class="col-sm-9">
						<input type="text" class="form-control" id="inputStoreCity" name="store_city" maxlength="132">
					</div>
				</div>
				<div class="form-group">
					<label for="inputStoreState" class="col-sm-3 control-label">State</label>
					<div class="col-sm-9">
						<select id="inputStoreState" class="form-control" name="store_state">
							<option value="0">Select State</option>
							${statesOpts}
						</select>
					</div>
				</div>
				<div class="form-group">
					<label for="inputStoreZip" class="col-sm-3 control-label">Zip</label>
					<div class="col-sm-9">
						<input type="text" class="form-control" id="inputStoreZip" name="store_zip" maxlength="10">
					</div>
				</div>
			</div>
		</div>
			
			
			
		</form>`;
        showModal('New Reseller', content, 'new_reseller', 'modal-lg',{footerButtons:`<button class="btn btn-default" form="newResellerBox" type="submit">Create</button>`});
        $("#inputPhone").mask("000 000 0000");
    }
    this.editResellerBox = function (resellerId) {
        var reseller = self.getResellerById(resellerId);
        var statesOptsOf = '';
        $.each(self.states, function (key, state) {
            if(reseller.office_state == state.id){
                statesOptsOf += '<option value="' + state.id + '" selected>' + state.name + '</option>'
            } else {
                statesOptsOf += '<option value="' + state.id + '">' + state.name + '</option>'
            }
        });
        var statesOptsSt = '';
        $.each(self.states, function (key, state) {
            if(reseller.store_state == state.id){
                statesOptsSt += '<option value="' + state.id + '" selected>' + state.name + '</option>'
            } else {
                statesOptsSt += '<option value="' + state.id + '">' + state.name + '</option>'
            }
        });
        var ownerInfo = '';
        $.each(reseller.employees, function(key,employ){
            if(employ.id == reseller.ownerId){
                ownerInfo = employ;
            }
        });
        var content = `<form class="form-horizontal row" onsubmit="resC.updateResellerSubmit(this, event);">
		<div class="col-sm-6">
			<div class="form-group">
				<label for="storeNumber" class="col-sm-3 control-label">Store Number</label>
				<div class="col-sm-9">
                                    <input type="number" class="form-control" id="storeNumber" name="id" maxlength="10" value="${reseller.id}" readonly>
				</div>
			</div>
			<div class="form-group">
				<label for="inputName" class="col-sm-3 control-label">Company Name</label>
				<div class="col-sm-9">
					<input type="text" class="form-control" id="inputName" name="store_name" required="" maxlength="132" value="${reseller.store_name}">
				</div>
			</div>
			<div class="form-group">
				<label for="inputEmail" class="col-sm-3 control-label">Owner Email</label>
				<div class="col-sm-9">
					<input type="email" class="form-control" id="inputEmail" name="email" maxlength="132" value="${ownerInfo.email}" readonly>
				</div>
			</div>
			<div class="form-group">
				<label for="inputFirstName" class="col-sm-3 control-label">Owner First Name</label>
				<div class="col-sm-9">
					<input type="text" class="form-control" id="inputFirstName" name="name" maxlength="64" value="${ownerInfo.name}" readonly>
				</div>
			</div>
			<div class="form-group">
				<label for="inputLastName" class="col-sm-3 control-label">Owner Last Name</label>
				<div class="col-sm-9">
					<input type="text" class="form-control" id="inputLastName" name="last" maxlength="64" value="${ownerInfo.last}" readonly>
				</div>
			</div>
			<div class="form-group">
				<label for="inputPhone" class="col-sm-3 control-label">Phone</label>
				<div class="col-sm-9">
					<input data-mask="000 000 0000" type="text" class="form-control" id="inputPhone" name="phone" value="${reseller.phone}">
				</div>
			</div>
			<div class="form-group">
				<label for="inputEIN" class="col-sm-3 control-label">EIN</label>
				<div class="col-sm-9">
					<input type="text" class="form-control" id="inputEIN" name="ein" value="${reseller.ein}">
				</div>
			</div>
			
		</div>
		<div class="col-sm-6">
			<div class="row" style="border: 1px solid #eee;padding: 10px 10px 0 10px;border-radius: 5px; margin-bottom:5px;">
				<h4 style="text-align:center; margin-top:0">Office Address</h4>
				<div class="form-group">
					<label for="inputOfficeAddress" class="col-sm-3 control-label">Address</label>
					<div class="col-sm-9">
						<input type="text" class="form-control" id="inputOfficeAddress" name="office_address" maxlength="132" value="${reseller.office_address}">
					</div>
				</div>
				<div class="form-group">
					<label for="inputOfficeCity" class="col-sm-3 control-label">City</label>
					<div class="col-sm-9">
						<input type="text" class="form-control" id="inputOfficeCity" name="office_city" maxlength="132" value="${reseller.office_city}">
					</div>
				</div>
				<div class="form-group">
					<label for="inputOfficeState" class="col-sm-3 control-label">State</label>
					<div class="col-sm-9">
						<select id="inputOfficeState" class="form-control" name="office_state">
							<option value="0">Select State</option>
							${statesOptsOf}
						</select>
					</div>
				</div>
				<div class="form-group">
					<label for="inputOfficeZip" class="col-sm-3 control-label">Zip</label>
					<div class="col-sm-9">
						<input type="text" class="form-control" id="inputOfficeZip" name="office_zip" maxlength="10" value="${reseller.office_zip}">
					</div>
				</div>
			</div>
			<div class="row" style="border: 1px solid #eee;padding: 10px 10px 0 10px;border-radius: 5px;margin-bottom:5px;">
				<h4 style="text-align:center; margin-top:0">Store Address</h4>
				<div class="form-group">
					<label for="inputStoreAddress" class="col-sm-3 control-label">Address</label>
					<div class="col-sm-9">
						<input type="text" class="form-control" id="inputStoreAddress" name="store_address" maxlength="132" value="${reseller.store_address}">
					</div>
				</div>
				<div class="form-group">
					<label for="inputStoreCity" class="col-sm-3 control-label">City</label>
					<div class="col-sm-9">
						<input type="text" class="form-control" id="inputStoreCity" name="store_city" maxlength="132" value="${reseller.store_city}">
					</div>
				</div>
				<div class="form-group">
					<label for="inputStoreState" class="col-sm-3 control-label">State</label>
					<div class="col-sm-9">
						<select id="inputStoreState" class="form-control" name="store_state">
							<option value="0">Select State</option>
							${statesOptsSt}
						</select>
					</div>
				</div>
				<div class="form-group">
					<label for="inputStoreZip" class="col-sm-3 control-label">Zip</label>
					<div class="col-sm-9">
						<input type="text" class="form-control" id="inputStoreZip" name="store_zip" maxlength="10" value="${reseller.store_zip}">
					</div>
				</div>
			</div>
			<div class="form-group text-right">
				<div class="col-xs-9">
					<div class="save_error"></div>
				</div>
				<div class="col-xs-3">
					<button class="btn btn-default" type="submit">Update</button>
				</div>
			</div>
		</div>
			
			
			
		</form>`;
        showModal('Edit Reseller', content, 'edit_reseller', 'modal-lg');
        $("#inputPhone").mask("000 000 0000");
    }
    this.setBanned = function (resellerId, el) {
        var status = $(el).attr('data-status');
        var data = {};
        data.resellerId = resellerId;
        data.status = status;
        AjaxController('setBanned', data, self.cntrlUrl, self.updateResellerSubmitHandler, errorBasicHandler, true);
    }
    this.setShowAllTicketsOption = function (resellerId, el) {
        var data = {};
        data.resellerId = resellerId;
        data.option = 'showAllTickets';
        data.value = $(el).attr('data-val');
        AjaxController('setOptions', data, self.cntrlUrl, self.init, errorBasicHandler, true);
    }
}
resC = new resellerController();
