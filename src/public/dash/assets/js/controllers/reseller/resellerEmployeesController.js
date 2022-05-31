function resellerController() {
    var self = this;
    this.filters = [];
    this.employees = [];
    this.states = [];
    this.curEmployee = false;
    this.listOfButtons = [];
    this.curUserResellerType = 0;
    this.initialised = false;
    this.cntrlUrl = "/db/api/apiResellerController.php";
    this.init = function () {
        this.initialised = false;
        $('#new_employee').remove();
        $('#update_employee').remove();
        $('#update_employee_payment').remove();
        AjaxController('getResellerEmployees', {}, self.cntrlUrl, self.getResellersHandler, errorBasicHandler, true)
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
    this.deactivateResellerEmployee = function (el) {
        var employeeId = $(el).closest('tr').attr('data-id');
        AjaxController('deactivateResellerEmployee', {employeeId: employeeId}, self.cntrlUrl, self.init, self.init, true)
    }
    this.activateResellerEmployee = function (el) {
        var employeeId = $(el).closest('tr').attr('data-id');
        AjaxController('activateResellerEmployee', {employeeId: employeeId}, self.cntrlUrl, self.init, self.init, true)
    }
    this.updateResellerEmployeeToAdmin = function (el) {
        var employeeId = $(el).closest('tr').attr('data-id');
        AjaxController('updateResellerEmployeeToAdmin', {employeeId: employeeId}, self.cntrlUrl, self.init, self.init, true)
    }
    this.revokeResellerEmployeeFromAdmin = function (el) {
        var employeeId = $(el).closest('tr').attr('data-id');
        AjaxController('revokeResellerEmployeeFromAdmin', {employeeId: employeeId}, self.cntrlUrl, self.init, self.init, true)
    }
    this.giveResellerEmployeeMasterRights = function (el) {
        var employeeId = $(el).closest('tr').attr('data-id');
        AjaxController('giveResellerEmployeeMasterRights', {employeeId: employeeId}, self.cntrlUrl, self.init, self.init, true)
    }
    this.getlistOfButtonsByUserTypes = function (employeeType, active) {
        var buttons = [];
        //buttons.push('<button onclick="">View Info</button>')
        if (self.curUserResellerType == 1) {//admin
            if (employeeType == 0) {
                buttons.push('<button onclick="rEmplC.updateResellerEmployeeToAdmin(this)">Update to Admin</button>');
                if (active)
                    buttons.push('<button onclick="rEmplC.deactivateResellerEmployee(this)">Deactivate</button>');
                if (!active)
                    buttons.push('<button onclick="rEmplC.activateResellerEmployee(this)">Activate</button>');
                buttons.push('<button onclick="rEmplC.updateEmployeeBox(this);">Update Employee</button>');
            }
        } else if (self.curUserResellerType == 2) {//master admin
            if (employeeType != 2) {
                if (employeeType == 0) {
                    buttons.push('<button onclick="rEmplC.updateResellerEmployeeToAdmin(this)">Update to Admin</button>');
                } else if (employeeType == 1) {
                    buttons.push('<button onclick="rEmplC.revokeResellerEmployeeFromAdmin(this)">Revoke Admin</button>');
                }
                if (active)
                    buttons.push('<button onclick="rEmplC.deactivateResellerEmployee(this)">Deactivate</button>');
                if (!active)
                    buttons.push('<button onclick="rEmplC.activateResellerEmployee(this)">Activate</button>');
                buttons.push('<button onclick="rEmplC.updateEmployeeBox(this);">Update Employee</button>');
                buttons.push('<button onclick="rEmplC.getResellerEmployeePaymentParams(this);">Employee Payment</button>');
                buttons.push('<button onclick=rEmplC.giveResellerEmployeeMasterRights(this)"">Give Master Rights</button>');
            }


        }

        return buttons;
    }
    this.appendEmployee = function (key, employee) {
        c('appendEmployee')
        var listOfButtons = self.getlistOfButtonsByUserTypes(employee.type, employee.active);

        $('#emplpyees_table tbody').append(`<tr data-id="${employee.id}">
			<td>${employee.fullName}</td>
			<td>${employee.phone}</td>
			<td>${employee.email}</td>
			<td>${self.getEmployeeTypeFromTypeId(employee.type)}</td>
			<td>${self.getActiveTypeFromActiveId(employee.active)}</td>
			<td>${addTableActionRow(listOfButtons)}</td>
		</tr>`);
    }
    this.filterView = function () {
        $('#emplpyees_table tbody tr').hide();
        $.each(self.employees, function (key, employee) {
            var show = true;
            $('#emplpyees_table .paginationInput').each(function () {
                var vl = $(this).val();
                var datat = $(this).attr('data-type')
                if (vl == '')
                    return true;
                if (String(employee[datat]).toLowerCase().indexOf(vl) == -1) {
                    show = false;
                }
            })
            if (show) {
                $('#emplpyees_table tbody tr[data-id="' + employee.id + '"]').show();
            }
        })

    }
    this.getEmployeeById = function (employeeId) {
        var retEmployee = {};
        $.each(self.employees, function (key, employee) {
            if(employee.id == employeeId){
                retEmployee = employee;
                return false;
            }
        });
        return retEmployee;
    }
    this.initView = function () {
        $('#emplpyees_table tbody').empty();
        $.each(self.employees, self.appendEmployee);

        if (!self.initialised) {
            $('#emplpyees_table').tablesorter({sortList: [[0, 0]]});
            self.initialised = true;
        } else {
            $('#emplpyees_table tbody tr').hide();
            $('#emplpyees_table').trigger('update');
            setTimeout(function () {
                var $sort = $('#emplpyees_table').get(0).config.sortList;
                $("#emplpyees_table").trigger("sorton", [$sort]);
                $('#emplpyees_table tbody tr').show();
                self.filterView();
            }, 100);
        }
    }

    this.getResellersHandler = function (response) {
        self.states = response.data.states;
        self.employees = response.data.employees;
        self.curUserResellerType = response.data.curUserResellerType;
        self.initView();
    }

    this.newEmployeeSubmit = function (frm, ev) {
        ev.preventDefault();
        var formData = getFormData(frm);
        c(formData);
        AjaxController('newResellerEmployee', formData, self.cntrlUrl, self.init, self.newResellerErrorHandler, true)
    }

    this.newResellerErrorHandler = function (response) {
        alertError($('#new_employee .save_error'), response.message, 3000);
    }
    this.newEmployeeBox = function () {
        var statesOpts = '';
        $.each(self.states, function (key, state) {
            statesOpts += '<option value="' + state.id + '">' + state.name + '</option>'
        });
        var content = `<form class="form-horizontal " id="newEmployeeBox" onsubmit="rEmplC.newEmployeeSubmit(this, event)">
			<div class="col">
				<div class="form-group">
					<label for="inputEmail" class="col-sm-3 control-label">Email</label>
					<div class="col-sm-6">
						<input type="text" class="form-control" id="inputEmail" name="email" maxlength="132" required="">
					</div>
					<div class="col-sm-3 email_hint">@ezlogz.com</div>
				</div>
				<div class="form-group">
					<label for="inputFirstName" class="col-sm-3 control-label">First Name</label>
					<div class="col-sm-9">
						<input type="text" class="form-control" id="inputFirstName" name="name" maxlength="64" required="">
					</div>
				</div>
				<div class="form-group">
					<label for="inputLastName" class="col-sm-3 control-label">Last Name</label>
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
					<label for="inputType" class="col-sm-3 control-label">Type</label>
					<div class="col-sm-9">
						<select id="inputType" class="form-control" name="type">
							<option value="0" selected="selected">Employee</option>
							<option value="1">Admin</option>
						</select>
					</div>
				</div>
				<div class="form-group text-right">
					<div class="col-xs-12">
						<div class="save_error"></div>
					</div>
				</div>
			</div>
		</form>`;
        showModal('New Employee', content, 'new_employee', 'modal-md', {footerButtons:`<button class="btn btn-default" form="newEmployeeBox" type="submit">Create</button>`});
        $("#inputPhone").mask("000 000 0000");
    }
    this.updateEmployeeSubmit = function (frm, ev) {
        ev.preventDefault();
        var formData = getFormData(frm);
        c(formData);
        AjaxController('updateResellerEmployee', formData, self.cntrlUrl, self.init, self.updateResellerErrorHandler, true)
    }
    this.updateResellerErrorHandler = function (response) {
        alertError($('#update_employee .update_error'), response.message, 3000);
    }
    this.updateEmployeeBox = function (el) {
        var employeeId = $(el).closest('tr').attr('data-id');
        var employee = self.getEmployeeById(employeeId);
        var statesOpts = '';
        $.each(self.states, function (key, state) {
            statesOpts += '<option value="' + state.id + '">' + state.name + '</option>'
        });
        var content = `<form class="form-horizontal " id="updateEmployeeBox" onsubmit="rEmplC.updateEmployeeSubmit(this, event);">
			<div class="col">
                                <input type="hidden" name="id" value="${employee.id}" readonly>
				<div class="form-group">
					<label for="inputEmail" class="col-sm-3 control-label">Email</label>
					<div class="col-sm-9">
						<input type="text" class="form-control" name="email" value="${employee.email}" maxlength="132" readonly>
					</div>
				</div>
				<div class="form-group">
					<label for="inputFirstName" class="col-sm-3 control-label">First Name</label>
					<div class="col-sm-9">
						<input type="text" class="form-control" id="inputFirstName" name="name" value="${employee.name}" maxlength="64" required="">
					</div>
				</div>
				<div class="form-group">
					<label for="inputLastName" class="col-sm-3 control-label">Last Name</label>
					<div class="col-sm-9">
						<input type="text" class="form-control" id="inputLastName" name="last" value="${employee.last}" maxlength="64" required="">
					</div>
				</div>
				<div class="form-group">
					<label for="inputPhone" class="col-sm-3 control-label">Phone</label>
					<div class="col-sm-9">
						<input data-mask="000 000 0000" type="text" class="form-control" id="inputPhone" name="phone" value="${employee.phone}">
					</div>
				</div>
				<div class="form-group">
					<label for="inputType" class="col-sm-3 control-label">Type</label>
					<div class="col-sm-9">
						<select id="inputType" class="form-control" name="type">
							<option value="0" ${employee.type == 0 ? 'selected="selected"' : ''}>Employee</option>
							<option value="1" ${employee.type == 1 ? 'selected="selected"' : ''}>Admin</option>
						</select>
					</div>
					<div class="col-xs-12">
						<div class="update_error"></div>
					</div>
				</div>
			</div>
		</form>`;
        showModal('New Employee', content, 'update_employee', 'modal-md', {footerButtons:`<button class="btn btn-default" form="updateEmployeeBox" type="submit">Update</button>`});
        $("#inputPhone").mask("000 000 0000");
    }
    this.getResellerEmployeePaymentParams = function (el) {
        var employeeId = $(el).closest('tr').attr('data-id');
        AjaxController('getResellerEmployeePaymentParams', {'userId':employeeId}, self.cntrlUrl, self.getResellerEmployeePaymentParamsHandler, errorBasicHandler, true);
    }
    this.updateResellerEmployeePaymentParams = function (frm, ev) {
        ev.preventDefault();
        var formData = getFormData(frm);
        c(formData);
        AjaxController('updateResellerEmployeePaymentParams', formData, self.cntrlUrl, self.init, self.updateResellerErrorHandler, true)
    }
    this.getResellerEmployeePaymentParamsHandler = function (response) {
        c(response);
        var data = response.data;
        var tzones = '';
        $.each(employeesTimeZones, function(key, tz){
            tzones += '<option '+(tz.id == data.timeZone ? 'selected="selected"' : '')+' value="'+tz.id+'">'+tz.name+'</option>';
        })
        var content = `<form class="form-horizontal" id="updateResellerEmployeePayment" onsubmit="rEmplC.updateResellerEmployeePaymentParams(this, event);">
			<div class="col">
                                <input type="hidden" name="userId" value="${data.userId}" readonly>
				<div class="form-group">
					<label for="inputEmail" class="col-sm-3 control-label">Start Work</label>
					<div class="col-sm-9">
						<input class="datepicker" value="${self.checkValue(data.startWork) == undefined ? '' : self.checkValue(data.startWork)}" name="startWork" type="text" placeholder="mm-dd-yyyy" required="" autocomplete="off">
					</div>
				</div>
				<div class="form-group">
					<label for="inputFirstName" class="col-sm-3 control-label">Salary Type</label>
					<div class="col-sm-9">
						<select name="salaryType">
                                                    <option value="0" ${data.salaryType == 0 ? 'selected' : ''}>Hourly rate</option>
                                                    <!--<option value="1" ${data.salaryType == 1 ? 'selected' : ''}>Monthly rate</option>-->
                                                </select>
					</div>
				</div>
				<div class="form-group">
					<label for="inputType" class="col-sm-3 control-label">Schedule Time Zone</label>
					<div class="col-sm-9">
						<select id="inputTimeZone" class="form-control" name="timeZone">
							${tzones}
						</select>
					</div>
					<div class="col-xs-12">
						<div class="update_error"></div>
					</div>
				</div>
				<div class="form-group">
					<label for="inputLastName" class="col-sm-3 control-label">Salary</label>
					<div class="col-sm-9">
						<input type="number" class="form-control" name="salary" value="${data.salary}" min="0" maxlength="64" required="">
					</div>
					<div class="col-xs-12">
						<div class="update_error"></div>
					</div>
				</div>
			</div>
		</form>`;
        showModal('Employee Payment', content, 'update_employee_payment', 'modal-md', {footerButtons:`<button form="updateResellerEmployeePayment" class="btn btn-default" type="submit">Update</button>`});
        $(".datepicker").datepicker({dateFormat: 'yy-mm-dd', maxDate: new Date()});
    }
    this.checkValue = function (val){
    if(val !='null' && val != ''  && val != '0000-00-00'){
        return val;
    }
}
}
rEmplC = new resellerController(); 