function resellerClientController() {
    var self = this;
    this.cntrlUrl = "/db/api/apiResellerController.php";
    this.curUserResellerType = 0;

    this.balancePagin = {page: 1, pages: 1, total: 0, perPage: 15};
    this.init = function () {
        AjaxController('getResellerStatus', {}, self.cntrlUrl, self.getResellerStatusHandler, errorBasicHandler, true)
    }
    this.getResellerStatusHandler = function (response) {
        self.curUserResellerType = response.data.curUserResellerType;
        $.each(response.data.status, function (key, val) {
            $('#' + key).text(val)
        })
        $('#balance_section').hide();
        $('#profile-section').hide();
        if (self.curUserResellerType > 0) {
            $('#balance_section').show();
			new simplePaginator({
				tableId: 'balance_table',
				request: 'getResellerStatusBalancesPagination',
				requestUrl: self.cntrlUrl,
				handler: self.getResellerStatusBalancesPaginationHandler,
				perPageList: [25, 50, 100]
			})
            self.getResellerBalanceHandler(response);
        } else {
            $('#profile-section').show();
            AjaxController('getReseller', {}, self.cntrlUrl, self.getResellerHandler, errorBasicHandler, true)
        }
    }
    this.getResellerHandler = function (response) {
		c('REs');
        c(response);
        var data = response.data;
        var thumb = getCookie("thumb");
        if (thumb != '' && thumb != null && thumb != "null") {
                thumb = thumb;
        } else {
                thumb = '/social/assets/img/thumb_blank.png';
        }
        $('#profile-section .user-info .avatar').attr('src',thumb);
        $('#profile-section .user-info .name').text(data.user.full_name);
        $('#store_number').text(data.store_number);
        $('#store_name').text(data.store_name);
        $('#store_phone').text(data.phone);
        $('#owner_name').text(data.owner_name);
        $('#store_address').text(data.office_state.name+', '+data.office_city+', '+data.office_address+', '+data.office_zip);
        
        var map = new google.maps.Map(document.getElementById('map'), {
          zoom: 4,
          center: {lat: 39.547495, lng: -101.330491}
        });
        
		var address = '';
        
        if(data.office_state.name != '' && data.office_city != '' && data.office_address != ''){
            address = data.office_state.name+', '+data.office_city+', '+data.office_address;
        } else if(data.store_state.name != '' && data.store_city != '' && data.store_address != ''){
            address = data.store_state.name+', '+data.store_city+', '+data.store_address;
        }
        if(address != ''){
            var geocoder = new google.maps.Geocoder();
            geocoder.geocode({'address': address}, function(results, status) {
              if (status === 'OK') {
				map.setZoom(10);
                map.setCenter(results[0].geometry.location);
                var marker = new google.maps.Marker({
                  map: map,
                  position: results[0].geometry.location
                });
              }
            });
        }
    }
    this.getResellerBalanceHandler = function (response) {
        $('#balance_table tbody').empty()
        var currentBalance = response.data.currentBalance;
        $('#current_balance').text(currentBalance)
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
	this.getResellerStatusBalancesPaginationHandler = function(response, tableId){
		var body = $('#' + tableId).find('tbody')
        body.empty();
        $.each(response.data.result, self.appendBalanceRow);
	}
    this.appendBalanceRow = function (key, balance_record) {
        var type = self.getRecordTypeFromTypeId(balance_record.type);
        var record_params = JSON.parse(balance_record.record_params);
        if (record_params != null && typeof record_params.paid != 'undefined' && record_params.paid != 0) {
            type += '(Paid)';
        }
        c(record_params);
        var client = balance_record.carrierId == 0 ? balance_record.clientName : balance_record.carrierName;
        $('#balance_table tbody').append(`<tr>
			<td>${timeFromSecToUSAString(balance_record.dateTime)}</td>
			<td>${getDisplayValue(client)}</td>
			<td>${type}</td>
			<td>${balance_record.description}</td>
			<td>${balance_record.amount}$</td>
			<td>${balance_record.final_amount}$</td>
		</tr>`)
    }
    this.pgChange = function (v, el) {
        checkUserPagin(v, el)
        var pp = $('.reseller_balance_pagin #pg_per_page').length > 0 ? $('.reseller_balance_pagin #pg_per_page').val() : 15;
        var curPage = $('.reseller_balance_pagin #pg_cur_page').length > 0 ? $('.reseller_balance_pagin #pg_cur_page').text() : 1;
        AjaxController('getResellerBalance', {pp: pp, curPage: curPage}, self.cntrlUrl, self.getResellerBalanceHandler, errorBasicHandler, true)
    }
}
rClientC = new resellerClientController();
