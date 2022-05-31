function blankCard(someId, params = {}) {
    var self = this;
    //changable part
    self.cntrlUrl = apiDashUrl;
    self.someId = someId;
    self.tableId = 'blankCard_' + self.someId;
    self.modalId = 'blank_modal_card';
    self.modalTitle = 'Blank Something INFO ';
    self.forceSearchParams = [{key: 'SomethingToFilterThePaginator', val: self.someId}]
    //some additional init params
    self.returnData = {};

    //not changable part
    self.params = params;
    self.modalElement = '';
    modalCore(self);
    self.paginator = false;
    self.tabs = [];

    self.initRequest = function () {
        AjaxController('getSomethingInit', {someId: self.someId}, self.cntrlUrl, self.init, self.init, true);
    }
    self.init = function (response) {
        //retrieving init response
        self.something = response.data.something;
        self.returnData = response.data.returnData;

        //always call
        self.generateHeaders();
        self.generateButtons();
        self.createModal();

        //additional clicks
        self.modalElement.find('.someButton').click(self.someButtonClick)
    }
    self.generateHeaders = function () {
        var headers = [];

        headers.push({label: 'Header 1', value: 'head1'});
        headers.push({label: 'Header 2', value: 'head2'});

        headers.push({label: 'Header 3', value: 'head3'});
        headers.push({label: 'Header 4', value: 'head4'});

        self.setCardHeaders(headers)
    }
    self.generateButtons = function () {
        var buttons = [];
        buttons.push('<button class="btn btn-default someButton">Some Button</button>');
        self.setCardActionsButtons(buttons);

        self.tabs.push({
            label: 'Some History',
            cl: 'eld_dev_his',
            request: 'getBlankModalPagination',
            handler: 'getBlankModalPaginationHandler',
            tableHeader: `<tr>
                <th>Status</th>
                <th>User</th>
                <th>Date Time</th>
            </tr>`
        });
        self.setCardTabs(self.tabs);
    }

    self.getBlankModalPaginationHandler = function (response) {
        var tbody = '';
        response.data.result.forEach((item) => {
            tbody += '<tr>\n\
                <td>' + statusName + '</td>\n\
                <td>' + userName + '</td>\n\
                <td>' + timeFromSecToUSAString(item.dateTime) + '</td>\n\
            </tr>';
        });
        self.modalElement.find('#' + self.tableId).find('tbody').html(tbody);
    }
    self.someButtonClick = function () {
        //do something on click
        AjaxController('someButtonClickRequest', {data: [data]}, dashUrl, self.someButtonClickRequestHandler, self.someButtonClickRequestErrorHandler, true);
    }
    self.someButtonClickRequestHandler = function () {

    }
    self.someButtonClickRequestErrorHandler = function () {

    }
    self.initRequest();
}