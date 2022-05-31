function eldAdminTariffRequestsClass() {
    var self = this;
    this.pagination = undefined;
    this.statuses = {
        0 : 'New',
        1 : 'Approved',
        2 : 'Canceled',
        3 : 'Rejected',
    };

    this.roles = {
        1: 'Solo Driver',
        2: 'Fleet'
    };

    /**
     * Pagination Init
     */
    this.paginationInit = function () {
        self.pagination = new simplePaginator({
            tableId: 'eldAdminTariffRequestsTable',
            request: 'getEldAdminTariffRequestsPagination',
            requestUrl: apiDashUrl,
            handler: self.paginationHandler,
            perPageList: [25, 50, 100, 'All'],
            //initSort:{param:'id', dir:'desc'},
            defaultPerPage: 50
        });
    };

    this.paginationHandler = function (response, tableId) {
        c(response);
        var rows = response.data.result;
        var table = $('#' + tableId);
        var tableBody = table.find('tbody');
        tableBody.empty();
        var headers = table.find('thead tr').first().find('th');
        if (rows.length == 0) {
            var cols = headers.length;
            tableBody.append('<tr><td colspan="' + cols + '" style="text-align:center; font-weigth:bolder;">No Data Found</td></tr>')
        }
        $.each(rows, function(key, rowData){
            tableBody.append(self.tariffRequestsTr(rowData));
        });
    };

    this.tariffRequestsTr = function(data) {
        //c(data);
        var status = {
            0:'label-default',
            1:'label-info',
            2:'label-warning',
            3:'label-danger',
            4:'label-success',
        };
        var listOfButtons = [];
        if(data.status === 0) {
            listOfButtons.push(`<button class="btn-lock-double-clicks" onclick="eldAdminTariffRequests.btnApprove(${data.id})">Approve</button>`);
            listOfButtons.push(`<button class="btn-lock-double-clicks" onclick="eldAdminTariffRequests.btnReject(${data.id})">Reject</button>`);
        }

        var nameData = data.fleet_usdot;
        if(data.soloOrFleet === 1) {
            nameData = `<span class="global_carrier_info clickable_item" title="User Info" data-userid="${data.userId}" onclick="getOneUserInfo(this, event);" style="cursor: pointer;">${data.user_info}</span>`;
        } else if(data.soloOrFleet === 2) {
            nameData = `<span class="global_carrier_info clickable_item" title="Carrier Info" data-carrid="${data.carrierId}" ${(data.fleet_usdot !== null ? 'onclick="actionGlobalgetOneCarrierInfo(this, event);"' : '')} style="cursor: pointer;">${(data.fleet_usdot !== null ? data.fleet_usdot : '')}</span>`;
        }
        var userInfo = `<span class="global_carrier_info clickable_item" title="User Info" data-userid="${data.userId}" onclick="getOneUserInfo(this, event);" style="cursor: pointer;">${data.user_info}</span>`;

        var newTarrifType = 2;
        var oldTarrifType = 2;

        if ([0,1,2].includes(data.tariffId)) {
            var newTarrifType = 1;
        }

        if ([0,1,2].includes(data.oldTariffId)) {
            var oldTarrifType = 1;
        }

        return `<tr data-id="${data.id}" onclick="actionGetOneManagerEldTariffRequestsInfo(this)">
            <td style="width: 20px;">${data.id !== null ? data.id : ''}</td>
            <td style="width: 106px;"><a href="javascript:;" onclick="getEldCard(${data.scannerId}, this, event)">${data.scannerId}</a></td>
            <td>${timeFromSQLDateTimeStringToUSAString(data.dateTime)}</td>
            <td>${data.soloOrFleet !== null ? self.roles[data.soloOrFleet] : ''}</td>
            <td>${data.fleet_usdot !== null ? nameData : ''}</td>
            <td>${userInfo}</td>
            <td>${eldTariffs[oldTarrifType][data.oldTariffId].name}</strong> to <strong>${eldTariffs[newTarrifType][data.tariffId].name}</strong></td>
            <td><span class="label ${status[data.status]}">${self.statuses[data.status]}</span></td>
            <td>${listOfButtons.length ? addTableActionRow(listOfButtons, 200) : ''}</td>
        </tr>`;
    };

    /**
     * Manager Approve
     */
    this.btnApprove = function(id) {
        var btn = `<button type="button" class="btn btn-default btn-lock-double-clicks" onclick="eldAdminTariffRequests.btnConfirm(${id}, 1)">OK</button>`;
        showModal('Approve Tariff Requests?', '<p class="text-center">After confirming request, tariff plan will be recalculated.</p>', 'eldTariffRequestsModal', '', {footerButtons:btn});
    };
    /**
     * Manager Reject
     */
    this.btnReject = function(id) {
        var btn = `<button type="button" class="btn btn-default btn-lock-double-clicks" onclick="eldAdminTariffRequests.btnConfirm(${id}, 3)">OK</button>`;
        showModal('Reject tariff request?', '<p class="text-center">Reject tariff request?</p>', 'eldTariffRequestsModal', '', {footerButtons:btn});
    };
    /**
     * Change Status Eld Tariff Request
     */
    this.btnConfirm = function(id, status = null) {
        $('.btn-lock-double-clicks').prop('disabled', true);
        $('#eldTariffRequestsModal').modal('hide').remove();
        AjaxCall({action: 'changeEldTariffRequestStatusByManager', data: {id: id, 'status': status}, url: apiDashUrl, successHandler: self.refreshManagerEldTariffRequestData, errorHandler: showModalError});

    };
    /**
     * Refresh Table Data
     */
    this.refreshManagerEldTariffRequestData = function(response) {
        $('.btn-lock-double-clicks').prop('disabled', false);
        if(typeof self.pagination !== 'undefined') {
            self.pagination.request();
        }
        $('.modal').modal('hide');
        new managerEldTariffRequestCard(response.data.result.id);
    };



    /**
     * User Cancel
     */
    this.btnCancel = function(id) {
        var btn = `<button type="button" class="btn btn-default btn-lock-double-clicks" onclick="eldAdminTariffRequests.btnConfirm(${id}, 2)">OK</button>`;
        showModal('Cancel tariff request?', '<p class="text-center">Cancel tariff request?</p>', 'eldTariffRequestsModal', '', {footerButtons:btn});
    };
    /**
     * Refresh Table Data
     */
    this.refreshELDData = function(response) {
        c(response);
        if((window.location.pathname == '/dash/eld/' && typeof response.data.result.scannerId !== 'undefined') || curUserIsEzlogzEmployee()){
            getELDscanners(null, true);
            $('.modal').modal('hide');
            getEldCard(response.data.result.scannerId, this, event);
        }
    };
    /**
     * Change Status Eld Tariff User
     * -----------------
     */
    this.btnUserConfirm = function(el) {
        $('.btn-lock-double-clicks').prop('disabled', true);
        AjaxCall({action: 'changeEldTariffRequestStatusByManager', data: $(el).data(), url: apiDashUrl, successHandler: self.closeModal, errorHandler: self.showModalError});
    };


    this.showModalError = function(response) {
        $('.btn-lock-double-clicks').prop('disabled', false);
        if (typeof response.data.orderId !== 'undefined') {
            $('#tariff-change-agreements_' + response.data.requestId).modal('hide');
        } else {
            $('.modal').modal('hide');
        }
        showModal('Message', '<p class="text-center my-4">' + response.message + '</p>');
    };

    /**
     * Refresh Table Data
     */
    this.closeModal = function(response) {
        c(response);
        if((window.location.pathname == '/dash/eld/' && typeof response.data.result.scannerId !== 'undefined') || curUserIsEzlogzEmployee()){
            getELDscanners(null, true);
            getEldCard(response.data.result.scannerId, this, event);
        }
        $('.modal').modal('hide');
    };

    this.supportComment = function(id) {
        var content = `<form id="supportEldTariffRequestCommentForm">
            <div class="form-group">
                <label for="return_description">Support Comment</label>
                <textarea name="support_comment" class="form-control" rows="3" id="supportCommentText"></textarea>
            </div>
        </form>`;
        var btn = `<button type="button" class="btn btn-default" onclick="eldAdminTariffRequests.saveSupportComment(${id})">Save</button>`;
        showModal('Support Comment', content, 'supportCommentModal', '', {footerButtons:btn});
    };

    this.saveSupportComment = function(id) {
        resetError();
        var $form = $('#supportEldTariffRequestCommentForm');
        var $commentTextTextarea = $form.find('textarea[name="support_comment"]');
        c($commentTextTextarea);

        if ($commentTextTextarea.val().trim() == '')
           setError($commentTextTextarea, 'Enter comment');
        else if ($commentTextTextarea.val().trim().length > 600)
            setError($commentTextTextarea, 'Max length 600 characters');

        if ($form.find('.error').length)
            return false;

        AjaxCall({action: 'saveSupportEldTariffRequestHistoryComment', data: {id: id, comment: $commentTextTextarea.val()}, url: apiDashUrl, successHandler: self.refreshManagerEldTariffRequestData});
    };
}

$('body').off('click', '.cancelBtn').on('click','.cancelBtn', function(){
    $('#refund_dates').val('');
});

if (typeof eldAdminTariffRequests === 'undefined') {
    eldAdminTariffRequests = new eldAdminTariffRequestsClass();
}
