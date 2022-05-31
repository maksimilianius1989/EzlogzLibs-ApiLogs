function employeesController() {
    var self = this;
    this.showDeactivated = false;
    this.filters = [];
    this.employees = [];
    this.totally_unpaid = 0;
    this.resellerId = 0;
    this.curEmployee = {};
    this.init = function () {
        $('#show_all').prop('checked', self.showDeactivated);
        if(self.employees.length == 0){
            AjaxController('getEzEmployees', {'resellerId':self.resellerId}, adminUrl, emplC.getEmployeesHandler, errorBasicHandler, true);
        } else {
            self.initView();
        }
    }
    this.createEmployee = function () {
        var email = $('#create_user_box .email').val();
        var name = $('#create_user_box .name').val();
        var last = $('#create_user_box .last').val();
        var type = $('#create_user_box .type').val();
        if (email == '') {
            $('#create_user_box .email').addClass('error');
            return false;
        }
        if (name == '') {
            $('#create_user_box .email').addClass('error');
            return false;
        }
        if (last == '') {
            $('#create_user_box .email').addClass('error');
            return false;
        }

        var data = {email: email, name: name, last: last, type: type};
        AjaxController('createEmployee', data, adminUrl, emplC.createEmployeeHandler, errorBasicHandler, true);
    };
    this.createEmployeeHandler = function (response) {
        $('#create_user_box').hide();
        self.employees.push(response.data)
        self.addEmployee(response.data)
        self.filterView();
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
    this.getEmployeesHandler = function (response) {
        self.employees = response.data.employees;
        self.initView()
    }
    this.initView = function () {
        self.sortEmployees();
        self.viewEmployees();
        if (window.location.pathname == "/dash/employees/employees/") {
            $('.tablesorter').tablesorter({sortList: [[1, 0]]});
            self.filterView();
        } else if (window.location.pathname == "/dash/employees/working_schedule/" || window.location.pathname == "/dash/resellers/employees_working/" || window.location.pathname == "/dash/working_schedule/") {
            if (position != TYPE_EZLOGZ_MANAGER) {
                $('.user_working_shedule ul').append(`<li id="employeeSalaryTotal">Total: <span>0</span>$</li>`);
            }
            var d = new Date();
            var n = d.getMonth() + 1;
            $('#rep_month').val(n);
            grafWeeks();
            getMonthReport();
        }
    }

    this.viewEmployees = function () {
        if (window.location.pathname == "/dash/employees/employees/") {
            $('#emplpyees_table tbody').empty();
        } else if (window.location.pathname == "/dash/employees/employees_report/") {
            $('select.employee option[value!=0]').remove();
        }
        $.each(self.employees, function (key, employee) {
            if (employee.companyPosition == TYPE_SUPERADMIN) {
                return false;
            }
            self.addEmployee(employee);
        })
        self.setTotal();
    }
    this.addEmployee = function (employee) {
        if (window.location.pathname == "/dash/employees/employees/") {
            var companyPosition = 'Employee';
            if (employee.companyPosition == TYPE_EZLOGZ_MANAGER) {
                companyPosition = 'Manager';
            }
            var st = employee.active == 0 ? 'Not Active' : 'Active';
            var listOfButtons = [];
            $('#emplpyees_table tbody').append(`<tr data-id="${employee.id}" data-type="${employee.companyPosition}" onclick="emplC.employeeCard(${employee.id})">
                <td>${employee.id}</td>
                <td>${employee.userName}</td>
                <td>${employee.phone == null ? '' : employee.phone}</td>
                <td>${employee.email}</td>
                <td>${employee.extention == null ? '' : employee.extention}</td>
				<td>${companyPosition}</td>
				<td>${toFixedFloat(employee.currentNotPaidBalance, 2)}$</td>
				<td>${st}</td>
            </tr>`);

        } else if (window.location.pathname == "/dash/employees/employees_report/") {
            if (self.showDeactivated || (!self.showDeactivated && employee.active))
                $('select.employee').append('<option value="' + employee.id + '">' + employee.userName + '</option>');
        } else if (window.location.pathname == "/dash/employees/working_schedule/" || window.location.pathname == "/dash/resellers/employees_working/" || window.location.pathname == "/dash/working_schedule/") {
            if (!employee.active) {
                return false;
            }
            var curStatus = 'off';
            if (employee.curStatus.length > 0 && employee.curStatus[0].statusId == 1) {
                curStatus = 'working';
            }
            if (position == TYPE_EZLOGZ_MANAGER && employee.companyPosition == TYPE_EMPLOYEE) {
                return false;
            }
            var totals = '';
            if (position != TYPE_EZLOGZ_MANAGER) {
                totals = '<div class = "totalUserPaymentBox"><div class = "totalUserPayment"></div></div>'
            }
            $('.user_working_shedule ul').append(`<li user-id="${employee.id}" user-position="${employee.companyPosition}">
				<div class="user ${curStatus}">${employee.userName}</div>
				<div class="days"></div>
					${totals}
				</li><hr>`);
        }
    };
    this.showAllChange = function () {
        self.showDeactivated = $('#show_all').prop('checked');
        self.init();
    }
    this.setTotal = function () {
        self.totally_unpaid = 0;
        $.each(self.employees, function (key, employee) {
            if(typeof employee.currentNotPaidBalance != 'object'){
                self.totally_unpaid += toFixedFloat(employee.currentNotPaidBalance, 2);
            }
        });
        self.totally_unpaid = toFixedFloat(self.totally_unpaid, 2);
        $('#totally_unpaid').text(self.totally_unpaid);
    }
    this.getEmployeeById = function (userId) {
        var user = {}
        $.each(self.employees, function (key, employee) {
            if (employee.id == userId) {
                user = employee;
                return true;
            }
        })
        return user;
    }
    this.changeSuperSettings = function (el) {
        doActive(el);
        var param = $(el).closest('.check_buttons_block').attr('data-param');
        var val = $(el).attr('data-val');
        self.curEmployee.superadminRights[param] = val;
        AjaxController('updateEmployeeRights', {userId: self.curEmployee.id, param: param, val: val}, adminUrl, emplC.updateEmployeeHandler, errorBasicHandler, true)
    }
    this.employeeCard = function (userId) {
        var user = self.getEmployeeById(userId);
        self.curEmployee = user;
        new EmployeeCard(userId)
    }
    this.sortPayments = function () {
        var cont = $("#history_box tbody tr");
        cont.detach().sort(function (a, b) {
            var astts = Date.parse($(a).find('td').eq(1).text());
            var bstts = Date.parse($(b).find('td').eq(1).text());
            //return astts - bstts;
            return (bstts > astts) ? (bstts > astts) ? 1 : 0 : -1;
        });
        $('#history_box tbody').append(cont);
    }
    this.sortEmployees = function () {
        self.employees = self.employees.sort(function (a, b) {
            var aName = a.userName.toLowerCase();
            var bName = b.userName.toLowerCase();
            return ((aName < bName) ? -1 : ((aName > bName) ? 1 : 0));
        });
    }
    this.addPayment = function (payment) {
        var user = self.getEmployeeById(payment.userId);
        $('#history_box tbody').append('<tr>\n\
            <td>' + payment.paymentAmount + '</td>\n\
            <td>' + payment.dateTime + '</td>\n\
            <td>' + payment.balanceBefore + '</td>\n\
            <td>' + payment.balanceAfter + '</td></tr>');
    }
    this.payEmployeeHandler = function (response) {
        self.updateEmployeeHandler(response);
        self.employeeCard(response.data.id)
        self.setTotal();
    }
    this.payEmployee = function (el) {
        var userId = self.curEmployee.id;
        var amount = toFixedFloat($('#emp_pay').val(), 2);
        var date = $('#emp_pay_date').val();
        if (amount > 0 && userId > 0) {
            var data = {userId: userId, amount: amount, date: date};
            AjaxController('payEmployee', data, adminUrl, emplC.payEmployeeHandler, errorReportPayHandler, true);
        }
    }
    this.updateUser = function () {
        $('.result').removeClass('error').text('');
        var userId = self.curEmployee.id;
        var data = {
            userId: userId,
            name: $('#emp_name').val(),
            last: $('#emp_last').val(),
            email: $('#emp_email').val(),
            remail: $('#emp_remail').val(),
            phone: $('#emp_phone').val(),
            start: $('#emp_start').val(),
            type: $('#emp_type').val(),
            rate: $('#emp_rate').val(),
            active: $('#emp_active').val(),
            timeZone: $('#emp_tz').val(),
            not_paid: $('#emp_not_paid').val()};
        AjaxController('updateEmployee', data, adminUrl, emplC.updateEmployeeHandler, errorReportHandler, true);
    }
    this.updateUserData = function (user) {
        $.each(self.employees, function (key, employee) {
            if (employee.id == user.id) {
                self.employees[key] = user;
                return true;
            }
        })
    }
    this.updateEmployeeHandler = function (response) {
        var user = response.data;
        self.updateUserData(user)
        var $userRow = $('#emplpyees_table tr[data-id="' + user.id + '"]').find('td');
        $userRow.eq(1).text(user.userName);
        $userRow.eq(2).text(user.phone);
        $userRow.eq(3).text(user.email);
        $userRow.eq(4).text(user.extention);
        var st = user.active == 0 ? 'Not Active' : 'Active';
        $userRow.eq(6).text(user.currentNotPaidBalance + '$');
        $userRow.eq(7).text(st);
        $('.result').removeClass('error').text('Saved');
        self.sortPayments();
        self.filterView();
    }
    this.setReseller = function(el) {
        var value = 0;
        if(typeof el == 'number'){
            value = el;
        } else {
            value = $(el).val();
        }
        if(self.resellerId != value) {
            self.resellerId = value;
            self.employees = [];
            $('#emplpyees_table tbody tr').empty();
            self.init();
        }
    }
}
emplC = new employeesController(); 