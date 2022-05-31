function getModalCardObject(type = false, id = false){
    var tableId = type+'_'+id;
    if($('.modal #'+tableId).length > 0 && window[tableId] != undefined){
        return window[tableId];
    }
    return false;
}
function modalCore(modal) {
    window[modal.tableId] = modal;
    modal.clearModal = function () {
        var self = this;
        if ($('.modal #'+modal.tableId).closest('.modal').find('.tableTabButtonsBox').find('.activeCarriersTableTab').length > 0) {
            self.lastActive = $('.modal #'+modal.tableId).closest('.modal').find('.tableTabButtonsBox').find('.activeCarriersTableTab').attr('data-tab');
        }
    }
    if ($('.modal #'+modal.tableId).length > 0)
        modal.clearModal();

    modal.modalElement = $(`<div>
	<div class="pupop_box_header">
		<div class="modal_card_table"></div>
	</div>
	<div class="col-xs-12 text-right control-buttons">
		
	</div>
	<div class="dropDownTabs" onclick="toggleDropDownTabs()">
		<span class="show_mob select_tab">Select tab</span>
		<div class="tableTabButtonsBox" id="carrierUsersButtonsBox">
		</div>	
	</div>
	<div class="popup_box_body">
            <div class="boxContent table_wrap">
                <table id="${modal.tableId}" class="table table-striped table-dashboard table-sm">
                    <thead></thead>
                    <tbody></tbody>
                </table>
            </div>
	</div>
	</div>`);
    modal.tabs = [];
    modal.setCardHeaders = function (headers) {
        var self = this;
        self.modalElement.find('.modal_card_table').empty();
        var el = '<div class="row row-flex">';
        $.each(headers, function (key, head) {
            var id = head.id == undefined ? '' : `id="${head.id}"`;
            var colClasses = self.oneColumnHeader ? 'col-sm-12 col-md-12' : 'col-sm-6 col-md-6';
            el += `<div class="form-group col-xs-12 ${colClasses}"><label class="form-group-label">${head.label}</label>
			<span class="form-group-content" ${id}>${head.value}</span></div>`
        });
        el += '</div>';
		self.modalElement.find('.modal_card_table').append(el);
    }
    modal.setCardActionsButtons = function (buttons) {
        var self = this;
        self.modalElement.find('.control-buttons').empty();
        $.each(buttons, function (key, but) {
            self.modalElement.find('.control-buttons').append(but)
        })

    }
    modal.setCardTabs = function (tabs) {
        var self = this;

        self.modalElement.find('.tableTabButtonsBox').empty();
        $.each(self.tabs, function (key, tab) {
            if (typeof self.lastActive == 'undefined' || !self.lastActive)
                var active = key == 0 ? 'activeCarriersTableTab' : '';
            else
                var active = tab.cl == self.lastActive ? 'activeCarriersTableTab' : '';
            var initSort = '';
            if(typeof tab.initSort != 'undefined'){
                initSort = 'data-param="'+tab.initSort.param+'" data-dir="'+tab.initSort.dir+'"';
            }
            var tabEl = `
            <div class="tableTabOneButtonBox">
                <button ${initSort} data-request="${tab.request}" data-handler="${tab.handler}" data-tab="${tab.cl}" class="${tab.cl} ${active}">${tab.label}</button>
            </div>`;
            self.modalElement.find('.tableTabButtonsBox').append(tabEl)

        })

    }
    modal.cardTabClicked = function (el) {
        var self = this;
        var tab = $(el).attr('data-tab');
        var tabInfo = {}
        $.each(self.tabs, function (key, innerTab) {
            if (innerTab.cl == tab) {
                tabInfo = innerTab;
                return true;
            }
        })
        var tabText = $(el).text();
		$('.select_tab').text(tabText);
        self.modalElement.find('.activeCarriersTableTab').removeClass('activeCarriersTableTab')
        $(el).addClass('activeCarriersTableTab')
        self.modalElement.find('#' + self.tableId).find('thead').html(tabInfo.tableHeader);
        self.modalElement.find('#' + self.tableId).removeClass('table-actions-block');
        self.modalElement.find('#' + self.tableId).find('tbody').empty();
        var initSort;
        if($(el).attr('data-param') != '' && $(el).attr('data-dir') != ''){
            initSort = {param:$(el).attr('data-param'), dir:$(el).attr('data-dir')};
        }
        self.paginator = new simplePaginator({
            tableId: self.tableId,
            initSort:initSort,
            request: tabInfo.request,
            requestUrl: self.cntrlUrl,
            handler: self[tabInfo.handler],
            forceSearchParams: self.forceSearchParams,
            perPageList: typeof tabInfo.perPageList != 'undefined' ? tabInfo.perPageList : [15, 30, 50],
            defaultPerPage: tabInfo.defaultPerPage
        })
    }
    modal.regenerateHeaders = function () {
        var self = this;
        if (typeof self.generateHeaders != 'undefined')
            self.generateHeaders();
        if (typeof self.generateButtons != 'undefined')
            self.generateButtons();
        if (typeof self.initEvents != 'undefined')
            self.initEvents();
    }
    modal.createModal = function () {
        var self = this;
        var pagin = getSimplePaginatorView();
        pagin = `<div class="cardPaginator pg_pagin" data-table="${self.tableId}">
			${pagin}
		</div>`;
        if ($('#' + self.tableId).length > 0) {
            $('#' + self.tableId).closest('.modal_card').remove();
        }
        self.modalElement = showModal(self.modalTitle, self.modalElement.html(), self.modalId, '', {footerButtons: pagin});
        self.modalElement.addClass('modal_card').attr('data-userId', self.userId);
        self.modalElement.find('.modal-body').addClass('popup_box_panel');
        self.modalElement.find('.tableTabOneButtonBox button').click(function () {
            self.cardTabClicked(this)
        })
        self.modalElement.find('.tableTabOneButtonBox button.activeCarriersTableTab').click()
        if (self.params != undefined && self.params.initCallback != undefined) {
            self.params.initCallback()
            self.params.initCallback = undefined;
        }
    }
}
function toggleDropDownTabs() {
	if($('.dropDownTabs').hasClass('active')){
		$('.dropDownTabs').removeClass('active');
	} else {
		$('.dropDownTabs').addClass('active');
	}
}