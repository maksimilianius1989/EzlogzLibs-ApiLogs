function promoControllerClass() {
    var self = this;
    this.pagination = '';
    this.rows = [];
    this.statuses = {
        0 : 'New',
        1 : 'Done',
        2 : 'Canceled',
        3 : 'Ordered',
    };


    this.paginationInit = function () {
        self.pagination = new simplePaginator({
            tableId: 'surveyResultsTable',
            request: 'getSurveyResultsPagination',
            requestUrl: apiAdminUrl,
            handler: self.paginationHandler,
            perPageList: [25, 50, 100, 'All'],
            //initSort:{param:'id', dir:'desc'},
            defaultPerPage: 50
        });
    };

    this.paginationHandler = function (response, tableId) {
        self.rows = response.data.result;
        var table = $('#' + tableId);
        var tableBody = table.find('tbody');
        tableBody.empty();
        var headers = table.find('thead tr').first().find('th');
        if (self.rows.length == 0) {
            var cols = headers.length;
            tableBody.append('<tr><td colspan="' + cols + '" style="text-align:center; font-weight:bolder;">No Data Found</td></tr>')
        }
        $.each(self.rows, function(key, rowData){
            tableBody.append(self.tariffRequestsTr(rowData));
        });
    };

    this.tariffRequestsTr = function(data) {
        var status = {
            0:'label-default',
            1:'label-info',
            2:'label-warning',
            3:'label-danger',
            4:'label-success',
        };
        var listOfButtons = [];
        listOfButtons.push(`<button class="btn-lock-double-clicks" onclick="promoController.newOrderFormAutocomplete(${data.id}, 0)">Order for Fleet</button>`);
        listOfButtons.push(`<button class="btn-lock-double-clicks" onclick="promoController.newOrderFormAutocomplete(${data.id}, 1)">Order for Solo</button>`);
        listOfButtons.push(`<button class="btn-lock-double-clicks" onclick="promoController.btnCancel(${data.id})">Canceled</button>`);
        listOfButtons.push(`<button class="btn-lock-double-clicks" onclick="promoController.btnDone(${data.id})">Done</button>`);
        return `<tr data-id="${data.id}">
            <td>${timeFromSQLDateTimeStringToUSAString(data.dateTime)}</td>
            <td>${data.userFullName !== null ? data.userFullName : ''}</td>
            <td>${data.types !== null ? data.types : ''}</td>
            <td>${data.assets !== null ? data.assets : ''}</td>
            <td>${data.features !== null ? data.features : ''}</td>
            <td>${data.email !== null ? data.email : ''}</td>
            <td>${data.company !== null ? data.company : ''}</td>
            <td>${data.phone !== null ? data.phone : ''}</td>
            <td><span class="label ${status[data.status]}">${self.statuses[data.status]}</span></td>
            <td>${listOfButtons.length ? addTableActionRow(listOfButtons, 200) : ''}</td>
        </tr>`;
    };

    this.newOrderFormAutocomplete = function (id, type=0) {
        var data = self.rows.find(x => x.id === id);
        c(data);
        new newOrderForm({'initCallback':function(){
            $('#btnNewFleet').click();
            $('#btnNewUser').click();
            if(type === 0) {
                $('#fleetPlace input[name="newFleet[car_name]"]').val(data.company);
                $('#fleetPlace input[name="newUser[name]"], #infoOrderBlock input[name="name"]').val(data.name);
                $('#fleetPlace input[name="newUser[last]"], #infoOrderBlock input[name="surname"]').val(data.last);
                $('#fleetPlace input[name="newUser[phone]"], #infoOrderBlock input[name="phone"]').val(data.phone);
                $('#fleetPlace input[name="newUser[email]"]').val(data.email);
            } else if(type === 1) {
                $('#checkboxFleetOrSolo button[data-val="0"]').click();
                $('button.newSoloDriver').click();
                $('#fleetPlace input[name="newFleet[car_name]"]').val(data.company);
                $('#userSoloDriverForm input[name="newUserSolo[name]"], #infoOrderBlock input[name="name"]').val(data.name);
                $('#userSoloDriverForm input[name="newUserSolo[last]"], #infoOrderBlock input[name="surname"]').val(data.last);
                $('#userSoloDriverForm input[name="newUserSolo[phone]"], #infoOrderBlock input[name="phone"]').val(data.phone);
                $('#userSoloDriverForm input[name="newUserSolo[email]"]').val(data.email);
            }
            $('<input>').attr({type: 'hidden', name: 'our_survey_form_id', id: 'ourSurveyFormId'}).val(data.id).appendTo('#orderForm');
        }})
    };

    /**
     * Manager Done
     */
    this.btnDone = function(id) {
        var btn = `<button type="button" class="btn btn-default btn-lock-double-clicks" onclick="promoController.btnConfirm(${id}, 1)">OK</button>`;
        showModal('Customer processed?', '<p class="text-center">Сonfirm that customer has been processed.</p>', 'customerModal', '', {footerButtons:btn});
    };
    /**
     * Manager Cancel
     */
    this.btnCancel = function(id) {
        var btn = `<button type="button" class="btn btn-default btn-lock-double-clicks" onclick="promoController.btnConfirm(${id}, 2)">OK</button>`;
        showModal('Customer declined?', '<p class="text-center">Сustomer declined offer??</p>', 'customerModal', '', {footerButtons:btn});
    };
    /**
     * Change Status Confirm
     */
    this.btnConfirm = function(id, status = null) {
        $('.btn-lock-double-clicks').prop('disabled', true);
        $('#eldTariffRequestsModal').modal('hide').remove();
        AjaxCall({action: 'changeSurveyFormStatus', data: {id: id, 'status': status}, url: apiAdminUrl, successHandler: self.refreshData, errorHandler: showModalError});

    };
    /**
     * Refresh Table Data
     */
    this.refreshData = function(response) {
        $('.btn-lock-double-clicks').prop('disabled', false);
        if(typeof self.pagination !== 'undefined') {
            self.pagination.request();
        }
        $('.modal').modal('hide');
        // new managerEldTariffRequestCard(response.data.result.id);
    };
}
