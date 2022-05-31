function simplePaginator(params, callback = false) {
    var self = this;
    var saveInputUsers = [TYPE_SUPERADMIN, TYPE_EMPLOYEE, TYPE_EZLOGZ_MANAGER];
    var saveInputUrls = ['/dash/users/', '/dash/eld/', '/dash/eld_orders/', '/dash/carriers/', '/dash/eld/find_malfunctions/'];
    this.saveInput = 0;
    if (saveInputUsers.includes(position) && saveInputUrls.includes(window.location.pathname)) {
        this.saveInput = 1;
    }
    this.tableId = params.tableId;
    this.paginationEl = $('.pg_pagin[data-table="' + this.tableId + '"]');
    this.storageId = $('.modal_card.in').length > 0 ? $('.modal_card.in').last().attr('id') + '_' + $('.modal_card.in').last().find('.activeCarriersTableTab').attr('data-tab') : params.tableId;
    this.tableEl = $('#' + this.tableId);
    this.perPageEl = $(this.paginationEl).find('.pagin_per_page');
    this.buttonsEl = $(this.paginationEl).find('.pagin_button');
    this.thEl = $(this.tableEl).find('th');
    this.inputsEl = $(this.tableEl).find('thead input');
    this.callback = callback;
    this.additionalData = params.additionalData != undefined ? params.additionalData : {};
    this.filters = {};
    this.overrideEmpty = false;
    if (params.overrideEmpty != undefined) {
        this.overrideEmpty = params.overrideEmpty;
    }
    this.selectEl = $(this.tableEl).find('thead select');
    if (params.customFilters != undefined) {
        $.each(params.customFilters, function (key, selector) {
            $el = $(selector);
            if ($el.is('input')) {
                self.inputsEl = self.inputsEl.add($el)
            } else if ($el.is('select')) {
                self.selectEl = self.selectEl.add($el)
            }
        })
    }
    this.forceSearchParams = params.forceSearchParams != undefined ? params.forceSearchParams : [];
    this.defaultPerPage = params.defaultPerPage != undefined ? params.defaultPerPage : false;
    if (params.perPageList != undefined) {
        self.perPageEl.empty();
        $.each(params.perPageList, function (key, pp) {
            self.perPageEl.append('<option>' + pp + '</option>')
        })
        self.perPageEl.val(self.perPageEl.find('option').first().val())
    }
    if (this.defaultPerPage) {
        self.perPageEl.val(this.defaultPerPage)
    }
    this.perPage = self.perPageEl.val();
    this.total = 0;
    this.totalPages = 1;
    this.curPage = 1;
    this.sort = {param: 'id', dir: 'desc'};
    if (params.initSort != undefined) {
        this.sort = {param: params.initSort.param, dir: params.initSort.dir};
    }

    this.apiRequest = params.request;
    this.handler = params.handler == undefined ? self.basicPaginationHandler : params.handler;
    this.requestUrl = params.requestUrl
    this.inputTimeout = null;
    this.changePagination = function (el) {
        if ($(this).hasClass('pagin_left')) {
            self.curPage = self.curPage <= 1 ? 1 : self.curPage - 1;
        } else if ($(this).hasClass('pagin_left_end')) {
            self.curPage = 1;
        } else if ($(this).hasClass('pagin_right')) {
            self.curPage = self.curPage >= self.totalPages ? self.totalPages : self.curPage + 1;
        } else if ($(this).hasClass('pagin_right_end')) {
            self.curPage = self.totalPages;
        } else if ($(this).hasClass('pagin_per_page')) {
            self.perPage = $(this).val();
            if (typeof userLocalStorage != 'undefined')
                userLocalStorage.setOptionParams(self.storageId, {'perPage': self.perPage});
            self.updatePaginTotals(self.total)
        }
        self.checkLimits();
        self.paginationEl.find('.pagin_cur_page').text(self.curPage)
        self.request();
    }
    this.checkLimits = function () {
        self.curPage = self.curPage >= self.totalPages ? self.totalPages : self.curPage;
        self.curPage = self.curPage < 1 ? 1 : self.curPage;
        self.buttonsEl.prop("disabled", false);
        if (self.curPage == 1) {
            self.paginationEl.find('.pagin_left_end, .pagin_left').prop("disabled", true);
        }
        if (self.curPage == self.totalPages) {
            self.paginationEl.find('.pagin_right_end, .pagin_right').prop("disabled", true);
        }
    }
    this.changeSortParams = function () {
        var newParam = $(this).attr('data-type');
        var dataSortable = typeof $(this).attr('data-sortable') != 'undefined' ? $(this).attr('data-sortable') : 1;
        if (newParam == undefined || dataSortable == 0) {
            return false;
        }
        if (self.sort.param == newParam) {
            self.sort.dir = self.sort.dir == 'desc' ? 'asc' : 'desc';
        } else {
            self.sort = {param: newParam, dir: 'desc'};
        }
        self.updateSortArrow();
        self.request();
        if (typeof userLocalStorage != 'undefined')
            userLocalStorage.setOptionParams(self.storageId, {'orderBy': self.sort.param, 'orderDir': self.sort.dir});
    }
    this.updateSortArrow = function () {
        var caret = self.sort.dir == 'desc' ? 'down' : 'up';
        self.thEl.removeClass('down');
        self.thEl.removeClass('up');
        $(self.tableEl).find('th[data-type="' + self.sort.param + '"]').addClass(caret)
    }
    this.changeSelect = function (el) {
        self.changeInputSearch(el);
    }
    this.changeInputSearch = function (el) {
        //for saving input/select val to lacalStorage
        var element = el.target;
        if (self.saveInput == 1 || $(element).is('select')) {
            var optionParam = {};
            if ($(element).parent().is('td') || $(element).parent().is('th')) {
                var ind = $(element).parent().index(),
                        filterName = self.thEl.eq(ind).attr('data-type');
            } else {
                var filterName = $(element).attr('data-type');
            }
            var filterValue = $(element).val();
            optionParam[filterName] = filterValue;
            if (typeof userLocalStorage != 'undefined')
                userLocalStorage.setOptionParams(self.storageId, optionParam);
        }
        //--
        self.curPage = 1;
        if (self.inputTimeout != null) {
            clearTimeout(self.inputTimeout);
        }
        self.inputTimeout = setTimeout(function () {
            self.inputTimeout = null;
            self.checkFilters();
            self.request();
        }, 1000)
    }
    this.checkFilters = function () {
        self.filters = {};
        self.inputsEl.each(function () {
            if ($(this).val() != '') {
                if ($(this).parent().is('td') || $(this).parent().is('th')) {
                    var ind = $(this).parent().index();
                    self.filters[self.thEl.eq(ind).attr('data-type')] = $(this).val()
                } else
                    self.filters[$(this).attr('data-type')] = $(this).val()
            }
        })
        self.selectEl.each(function () {
            if ($(this).val() != '') {
                if ($(this).parent().is('td') || $(this).parent().is('th')) {
                    var ind = $(this).parent().index();
                    self.filters[self.thEl.eq(ind).attr('data-type')] = $(this).val()
                } else
                    self.filters[$(this).attr('data-type')] = $(this).val()
            }
        })
        $.each(self.forceSearchParams, function (key, item) {
            self.filters[item['key']] = item['val']
        })

    }
    this.updatePaginTotals = function (newTotal) {
        self.total = newTotal;
        self.paginationEl.find('.pagin_total').text(newTotal)
        self.perPage = self.perPage === 'All' ? newTotal : self.perPage;
        self.totalPages = Math.max(1, Math.ceil(newTotal / self.perPage));
        self.paginationEl.find('.pagin_total_pages').text(self.totalPages);

        self.checkLimits();
        self.paginationEl.find('.pagin_cur_page').text(self.curPage)
    }
    this.request = function (init = false) {
        var data = {}
        data.pagination = {};
        data.pagination.page = self.curPage;
        data.pagination.perPage = self.perPage;
        data.pagination.orderBy = self.sort;
        data.pagination.filters = self.filters;
        
        data.additionalData = self.additionalData;
        
        self.appendLoader();
        AjaxController(self.apiRequest, data, self.requestUrl, function (response) {
            self.updatePaginTotals(response.data.total);
            if (response.data.total == 0 && !self.overrideEmpty) {
                var tableBody = self.tableEl.find('tbody');
                tableBody.empty();
                var cols = self.thEl.length;
                tableBody.append('<tr ><td colspan="' + cols + '" style="text-align:center; font-weigth:bolder;">No Data Found</td></tr>')
            } else
                self.handler(response, self.tableId);
            if (init && self.callback != false) {
                self.callback();
            }
        }, self.handler, true);
    }
    this.getStorageSettings = function () {
        var savedSelects = [];
        var savedInputs = [];
        self.selectEl.each(function () {
            if ($(this).parent().is('td') || $(this).parent().is('th')) {
                var ind = $(this).parent().index();
                savedSelects.push(self.thEl.eq(ind).attr('data-type'));
            } else
                savedSelects.push($(this).attr('data-type'));
        });
        if (self.saveInput == 1) {
            self.inputsEl.each(function () {
                if ($(this).parent().is('td') || $(this).parent().is('th')) {
                    var ind = $(this).parent().index();
                    savedInputs.push(self.thEl.eq(ind).attr('data-type'));
                } else
                    savedInputs.push($(this).attr('data-type'));
            });
        }
        if (typeof userLocalStorage != 'undefined')
            var storageSettings = userLocalStorage.getObjectOption(self.storageId);
        if (typeof storageSettings != 'undefined' && storageSettings != null) {
            $.each(storageSettings, function (key, value) {
                c(key + ' = ' + value);
                if (key == 'orderBy') {
                    self.sort.param = value;
                } else if (key == 'orderDir') {
                    self.sort.dir = value;
                } else if (key == 'perPage') {
                    self.perPage = value;
                    self.paginationEl.find('.pagin_per_page').val(value);
                } else if (savedSelects.indexOf(key) != -1) {
                    self.filters[key] = value;
                    var filterEl = $('[data-type="' + key + '"]');
                    if (filterEl.is('th')) {
                        var ind = filterEl.index();
                        filterEl = self.tableEl.find('tr:eq(1) td').eq(ind).find('select');
                    }
                    filterEl.find('option').removeAttr('selected').filter('[value="' + value + '"]').prop('selected', true);
                } else if (savedInputs.indexOf(key) != -1) {
                    self.filters[key] = value;
                    var filterEl = $('[data-type="' + key + '"]');
                    if (filterEl.is('th')) {
                        var ind = filterEl.index();
                        self.tableEl.find('tr:eq(1) td').eq(ind).find('input').val(value);
                    }
                }
            });
        }
    }
    this.appendLoader = function () {
        var tableBody = self.tableEl.find('tbody');
        tableBody.empty();
        var cols = self.thEl.length;
        //loading.gif
        tableBody.append('<tr ><td colspan="' + cols + '" style="text-align:center; font-weigth:bolder;"><img class="loading_gif_table" src="/dash/assets/img/loading-gif.gif" style="width: 25px;"/></td></tr>')
    };
    this.basicPaginationHandler = function (response, tableId = false) {
        var rows = response.data.result;
        var tableBody = self.tableEl.find('tbody');
        tableBody.empty();
        if (rows.length == 0) {
            var cols = self.thEl.length;
            tableBody.append('<tr ><td colspan="' + cols + '" style="text-align:center; font-weigth:bolder;">No Data Found</td></tr>')
        }
        var variables = [];
        self.thEl.each(function () {
            variables.push($(this).attr('data-type'));
        })
        $.each(rows, function (key, rowData) {
            var row = '';
            $.each(variables, function (key2, variableName) {
                row += '<td>' + rowData[variableName] + '</td>'
            })
            tableBody.append('<tr>' + row + '</tr>')
        })
    }
    this.autocompleteChange = function (event) {
        var el = event.target;
        if ($(el).hasClass('ui-autocomplete-input')) {
            self.changeInputSearch(event);
        }
    }
    self.perPageEl.off("change").change(self.changePagination)
    self.buttonsEl.off("click").click(self.changePagination)
    self.thEl.off("click").click(self.changeSortParams)
    self.inputsEl.off("keyup").keyup(self.changeInputSearch)
    self.inputsEl.off("change").change(self.autocompleteChange)
    self.inputsEl.filter('.datepicker, .daterange').off("change").change(self.changeInputSearch)
    self.selectEl.off("change").change(self.changeSelect) //.change(self.changeInputSearch)
    self.getStorageSettings();
    self.updateSortArrow();
    self.checkFilters();
    self.request(true);
}

function getSimplePaginatorView() {
    return `<div class="simplePaginator ">
        <div class="displayResultBox">
            <div class="pagin_total">0</div>
            <div class="pagin_results">result(s)</div>
        </div>
        <div class="pagin_displayBox">
            <div class="pagin_displayText">Display</div>
            <select class="pagin_per_page">
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
            </select>
        </div>
        <div class="pagin_buttons">
            <div class="pagin_leftButtonsBox">
                <button class="pagin_button pagin_left_end" disabled>
                    <i class="fa fa-angle-double-left" aria-hidden="true"></i>
                </button>
                <button class="pagin_button pagin_left" disabled>
                    <i class="fa fa-angle-left" aria-hidden="true"></i>
                </button>
            </div>

            <div class="pagin_numbers">
                <div class="pagin_cur_page">1</div>
                <div>-</div>
                <div class="pagin_total_pages">1</div>
                <div class="pagin_total_pagesText"> pages</div>
            </div>
            <div class="pagin_rightButtonsBox">
                <button class="pagin_button pagin_right">
                    <i class="fa fa-angle-right" aria-hidden="true"></i>
                </button>
                <button class="pagin_button pagin_right_end">
                    <i class="fa fa-angle-double-right" aria-hidden="true"></i>
                </button>
            </div>
        </div>
    </div>`;
}