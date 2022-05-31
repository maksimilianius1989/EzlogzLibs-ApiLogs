function Pagination()
{
    this.tableJqueryObj = {};
    this.paginationJqueryObj = {};
    this.replacedInputParams = {};
    this.multiplyParamsColumnsArr = [];
    this.skipSortParam = [];
    this.skipSearchParam = [];
    this.getMultiplyParamsColumnsValue = null;
    this.getTableLineFunc = null;
    this.callbackSearchFunc = null;
    
    this.dataArr = [];
    this.countAllData = 0;
    this.allPages = 0;
    this.curPage = 1;
    this.limitPerPage = 0;
    this.orderByParam = null;
    this.orderByType = null;
    this.lastChangeInputId = null;
    this.gettingData = false;

    this.init = ({curPageLimit, pagesLimits, columnsParams, skipSortParam, skipSearchParam, orderByParam, orderByType, tableObj, getTableLineFunc, callbackSearchFunc}) => 
    {
        c('init pagination');
        if(tableObj !== null && tableObj instanceof jQuery)
        {
            this.tableJqueryObj = tableObj;
            this.tableJqueryObj.addClass('tablePagination');
        }
        else
        {
            this.error('Incorrect target table');
        }
        
        this.setPaginationParams(curPageLimit, pagesLimits);
        this.setCallbackFunctions(getTableLineFunc, callbackSearchFunc);
        this.setSortParams(columnsParams, orderByParam, orderByType);
        this.setSkipParams(skipSortParam, skipSearchParam);
        this.setEventsListeners();
        this.updatePagination();
    };
    this.getDataArr = () =>
    {
        return this.dataArr;
    };
    this.updateDataElement = (callbackFunc) =>
    {
        this.dataArr = callbackFunc(this.dataArr);
    };
    this.replaceInputParams = (params) =>
    {
        c('replaceInputParams');
        if(params !== null && Object.keys(params).length > 0)
        {
            this.replacedInputParams = params;
        }
    };
    this.setMultiplyColumnsParams = (params, callbackFunc) =>
    {
        c('replaceInputParams');
        if(params !== null && Object.keys(params).length > 0 && typeof callbackFunc === 'function')
        {
            this.multiplyParamsColumnsArr = params;
            this.getMultiplyParamsColumnsValue = callbackFunc;
        }
    };
    this.updatePagination = () =>
    {
        var allPages = this.allPages,
            countAllData = this.countAllData,
            curPage = this.curPage,
            paginationJqueryObj = this.paginationJqueryObj;

        c('updatePagination');
        allPages = allPages === 0 ? 1 : allPages;
        paginationJqueryObj.find('.pg_button').show();
        if(curPage === 1)
        {
            paginationJqueryObj.find('#pg_left, #pg_left_end').hide();
        }
        if(curPage === allPages)
        {
            paginationJqueryObj.find('#pg_right, #pg_right_end').hide();
        }
        paginationJqueryObj.find('#pg_total_pages').text(allPages);
        paginationJqueryObj.find('#pg_total').text(countAllData);
        paginationJqueryObj.find('#pg_cur_page').text(curPage);
    };
    this.changePagination = (targetElement) => 
    {
        var button = $(targetElement).attr('id'),
            limitPerPage = this.limitPerPage,
            curPage = this.curPage,
            allPages = this.allPages,
            countAllData = this.countAllData,
            paginationJqueryObj = this.paginationJqueryObj;

        if(this.gettingData !== true)
        {
            c('changePagination');
            switch(button)
            {
                case 'pg_right': 
                    curPage = curPage >= allPages ? allPages : curPage + 1;
                    break;
                case 'pg_right_end':
                    curPage = allPages;
                    break;
                case 'pg_left': 
                    curPage = curPage <= 1 ? 1 : curPage - 1;
                    break;
                case 'pg_left_end': 
                    curPage = 1;
                    break;
                case 'pg_per_page': 
                    limitPerPage = parseInt(paginationJqueryObj.find('#pg_per_page').val());
                    curPage = 1;
                    break;
            }
            allPages = Math.ceil(countAllData/limitPerPage);

            paginationJqueryObj.find('#pg_right_end, #pg_right, #pg_left_end, #pg_left').show();
            curPage === 1 ? paginationJqueryObj.find('#pg_left_end, #pg_left').hide() : '';
            curPage === allPages ? paginationJqueryObj.find('#pg_right_end, #pg_right').hide() : '';

            this.allPages = allPages;
            this.curPage = curPage;
            this.limitPerPage = limitPerPage;

            this.searchNewData();
        }
    };
    this.firstLoadGetData = () =>
    {
        this.send();
    };
    this.send = () =>
    {
        var inputParamsObj = this.getInputSearchParams(),
            data = {
                params: {
                    searchParams: inputParamsObj,
                    orderByParam: this.orderByParam,
                    orderByType: this.orderByType,
                    curPage: this.curPage,
                    limitPerPage: this.limitPerPage
                }
            };

        c('send request');
        c(data);
        this.gettingData = true;
        //this.blockControlsElements();
        this.callbackSearchFunc(data);
    };
    this.searchNewData = () =>
    {
        c('searchNewData - SEND');
        
        this.send();
    };
    this.checkSearchInput = (data) => 
    {
        var dataArr = data,
            multiplyParamsColumnsArr = this.multiplyParamsColumnsArr,
            inputVal = '',
            itemVal = '',
            checkCorrectItemVal = false;
            selectedData = [],
            inputParamsObj = {};
        
        c('checkSearchInput');
        inputParamsObj = this.getInputSearchParams();
        c(inputParamsObj);
        if(dataArr && dataArr.length > 0)
        {
            selectedData = dataArr.filter((item) =>
            {
                for(let key in inputParamsObj)
                {
                    inputVal = inputParamsObj[key];
                    
                    if(multiplyParamsColumnsArr.includes(key) && this.getMultiplyParamsColumnsValue !== null)
                    {
                        itemVal = this.getMultiplyParamsColumnsValue(key, item);
                    }
                    else
                    {
                        itemVal = item[key] !== null && typeof item[key] !== 'undefined' ? item[key] : ''; 
                    }
                    if(Array.isArray(inputVal))
                    {
                        checkCorrectItemVal = inputVal.some(item => item == itemVal);
                    }
                    else
                    {
                        checkCorrectItemVal = itemVal.toString().toLowerCase().indexOf(inputVal.toString().replace(/^-(\d+)/g, '$1').toLowerCase()) + 1;
                    }
                    if(inputVal !== '' && !checkCorrectItemVal)
                    {
                        return false;
                    }
                }
                return true;
            });
        }
        c('Search data elements');
        return selectedData;
    };
    this.changeSortParams = (data) => 
    {
        var orderByParam = '',
            orderByType = '',
            sortButton = $(data),
            tableObj = this.tableJqueryObj,
            gettingData = this.gettingData;

        if(gettingData !== true && !sortButton.hasClass('paginationSortFalse'))
        {
            c('changeSortParams');
            
            orderByParam = sortButton.attr('data-type');
            if(sortButton.hasClass('up'))
            {
                tableObj.find('th').removeClass('up down');
                sortButton.addClass('down');
                orderByType = 'down';
            }
            else
            {
                tableObj.find('th').removeClass('up down');
                sortButton.addClass('up');
                orderByType = 'up';
            }
            this.orderByParam = orderByParam;
            this.orderByType = orderByType;
            this.searchNewData();
        }
    };
    this.changeInputSearch = (e) => 
    {
        var inputDataType = $(e).attr('data-type');
        
        this.inputKeyUpDeley(() => 
        {
            if(this.gettingData !== true && !this.skipSearchParam.includes(inputDataType)) 
            {
                c('changeInputSearch - SEARCH');
                this.lastChangeInputId = inputDataType;
                this.curPage = 1;
                this.searchNewData();
            }
        }, 1000);
    };
    this.render = (dataArr) => 
    {
        var content = '',
            orderByParam = this.orderByParam,
            orderByType = this.orderByType, 
            aVal = '',
            bVal = '';

        c('render');
        if(dataArr && dataArr.length > 0)
        {
            if(orderByParam && orderByType)
            {
                dataArr.sort((a, b) =>
                {
                    aVal = a[orderByParam] !== null && typeof a[orderByParam] !== 'undefined' ? a[orderByParam] : '';
                    bVal = b[orderByParam] !== null && typeof b[orderByParam] !== 'undefined' ? b[orderByParam] : '';
                    
                    if(orderByType === 'up')
                    {
                        return this.compare(aVal, bVal);
                    }
                    else if(orderByType === 'down')
                    {
                        return this.compare(bVal, aVal);
                    }
                });
            }
            content = dataArr.map(item => this.getTableLineFunc(item)).join('');
        }
        c('Rendered data elements');
        c(dataArr);
        this.tableJqueryObj.find('tbody').empty().append(content);
        //this.unblockControlsElements();
        this.updatePagination();
        this.gettingData = false;
    };
    this.setNewDataElements = (newDataArr, countAllData) => 
    {
        var limitPerPage = this.limitPerPage,
            dataSearch = [];

        c('addDataElements');
        c(newDataArr);
        c(`Count data: ${countAllData}`);
        newDataArr = newDataArr !== null && typeof newDataArr !== 'undefined' ? newDataArr : [];
        countAllData = countAllData !== null && typeof countAllData !== 'undefined' ? countAllData : 0;
        
        this.dataArr = newDataArr;
        this.countAllData = countAllData;
        this.allPages = Math.ceil(countAllData / limitPerPage);
        
        dataSearch = this.checkSearchInput(newDataArr);
        this.render(dataSearch);
    };
    this.setPaginationParams = (curPageLimit, pagesLimits) =>
    {
        var pagination = $(`#pg_pagin[data-table="${this.tableJqueryObj.attr('id')}"]`),
            limitsPerPageStr = '';
        
        c('setPaginationParams');
        if(pagination.length > 0)
        {
            this.paginationJqueryObj = pagination; 
        }
        else
        {
            this.error('Undefined pagination');
        }
        if(pagesLimits !== null && pagesLimits.length > 0)
        {
            pagesLimits.filter((i) => i >= 1 && i <= 1000)
            .sort((a, b) => a - b)
            .forEach((item) =>
            {
                limitsPerPageStr += `<option value="${item}">${item}</option>`;            
            });
            pagination.find('#pg_per_page').empty().append(limitsPerPageStr);
        }
        else
        {
            this.error('Undefined limits per page');
        }
        if(curPageLimit >= 1 && curPageLimit <= 1000 && pagesLimits.includes(curPageLimit))
        {
            this.limitPerPage = curPageLimit;
        }
        else
        {
            this.error('Incorrect current page limit');
        }
    };
    this.setCallbackFunctions = (getTableLineFunc, callbackSearchFunc) =>
    {
        c('setCallbackFunctions');
        if(callbackSearchFunc !== null && typeof callbackSearchFunc === 'function')
        {
            this.callbackSearchFunc = callbackSearchFunc;
        }
        else
        {
            this.error('Incorrect callback function');
        }
        if(getTableLineFunc !== null && typeof getTableLineFunc === 'function')
        {
            this.getTableLineFunc = getTableLineFunc;
        }
        else
        {
            this.error('Incorrect table line callback function');
        }
    };
    this.setSortParams = (columnsParams, orderByParam, orderByType) =>
    {
        var table = this.tableJqueryObj,
            sortButtons = `<i class="fa fa-caret-down" aria-hidden="true"></i><i class="fa fa-caret-up" aria-hidden="true"></i>`;
        
        c('setSortParams');
        if(columnsParams !== null && columnsParams.length > 0 && columnsParams.length === table.find('thead th').length)
        {
            $.each(table.find('thead tr:nth-child(1) th'), (i, item) =>
            {
                $(item).attr('data-type', columnsParams[i]).addClass('paginationSort').append(sortButtons);
            });
            $.each(table.find('thead tr:nth-child(2) td input, thead tr:nth-child(2) td select'), (i, item) =>
            {
                $(item).attr('data-type', columnsParams[i]).addClass('paginationInput');
            });
        }
        else
        {
            this.error('Incorrect columns params');
        }
        if(orderByParam !== null && columnsParams.includes(orderByParam) && orderByType !== null && (orderByType === 'up' || orderByType === 'down'))
        {
            this.orderByParam = orderByParam;
            this.orderByType = orderByType;
            table.find(`thead tr:nth-child(1) th[data-type="${orderByParam}"]`).addClass(orderByType);
        }
        else
        {
            this.error('Incorrect sort params');
        }
    };
    this.setSkipParams = (skipSortParam, skipSearchParam) =>
    {
        c('setSkipParams');
        if(skipSortParam !== null && skipSortParam.length > 0)
        {
            $.each(this.tableJqueryObj.find('thead tr:nth-child(1) th'), (i, item) =>
            {
                if(skipSortParam.includes($(item).attr('data-type')))
                {
                    $(item).addClass('paginationSortFalse');
                }
            });
        }
        if(skipSearchParam !== null && skipSearchParam.length > 0)
        {
            $.each(this.tableJqueryObj.find('thead tr:nth-child(2) td input'), (i, item) =>
            {
                if(skipSearchParam.includes($(item).attr('data-type')))
                {
                    $(item).addClass('paginationInputFalse');
                }
            });
        }
        this.skipSearchParam = skipSearchParam;
        this.skipSortParam = skipSortParam;
    };
    this.setEventsListeners = () =>
    {
        var pagination = this.paginationJqueryObj,
            tableId = this.tableJqueryObj.attr('id'),
            tableElement = '',
            paginationElement = '';
        
        c('setEventsListeners');
        if(pagination.length > 0 && typeof tableId !== 'undefined')
        {
            tableElement = `#${tableId}`;
            paginationElement = `#pg_pagin[data-table="${tableId}"]`;
            
            $('body').off('change', `${paginationElement} #pg_per_page`).on('change', `${paginationElement} #pg_per_page`, (e) => this.changePagination(e.currentTarget));
            $('body').off('click', `${paginationElement} .pg_button`).on('click', `${paginationElement} .pg_button`, (e) => this.changePagination(e.currentTarget));
            $('body').off('click', `${tableElement} th`).on('click', `${tableElement} th`, (e) => this.changeSortParams(e.currentTarget));
            $('body').off('keyup', `${tableElement} thead input`).on('keyup', `${tableElement} thead input`, (e) => this.changeInputSearch(e.currentTarget));
            $('body').off('change', `${tableElement} thead select`).on('change', `${tableElement} thead select`, (e) => this.changeInputSearch(e.currentTarget));
        }
        else
        {
            this.error('Set events listeners error');
        }
    };
    this.inputKeyUpDeley = (() =>
    {
        var timer = 0;
        return (callback, ms) =>
        {
            clearTimeout(timer);
            timer = setTimeout(callback, ms);
        };
    })();
    this.compare = (aVal, bVal) =>
    {
        if(typeof aVal === 'number')
        {
            return Number(aVal) - Number(bVal);
        }
        else if(typeof aVal === 'string')
        {
            aVal = String(aVal).toLowerCase();
            bVal = String(bVal).toLowerCase();
            return aVal.localeCompare(bVal);
        }
    };
    this.getInputSearchParams = () =>
    {
        var replecedInputParams = this.replacedInputParams,
            replacedObject = {},
            inputParamsObj = {},
            replacedValsArr = null,
            inputDataType = '',
            val = '';  
            
        c('getInputSearchParams');
        $.each(this.tableJqueryObj.find('.paginationInput'), (i, item) =>
        {
            inputDataType = $(item).attr('data-type');
            val = $.trim($(item).val().replace(/[,]/g, ' ').replace(/\s+/g, ' '));
            if(val !== '')
            {
                if(inputDataType in replecedInputParams)
                {
                    replacedObject = replecedInputParams[inputDataType];
                    if(replacedObject !== null && typeof replacedObject !== 'undefined')
                    {
                        replacedValsArr = Object.keys(replacedObject)
                            .filter(key => replacedObject[key].toString().toLowerCase().indexOf(val.toString().toLowerCase()) !== -1)
                            .map(item => Number(item));
                    
                        replacedValsArr = replacedValsArr.length === 0 ? null : replacedValsArr;
                    }
                }
                inputParamsObj[inputDataType] = replacedValsArr !== null ? replacedValsArr : val;
            }
        });
        return inputParamsObj;
    };
    this.blockControlsElements = () =>
    {
        this.paginationJqueryObj.find('.pg_button, #pg_per_page').prop('disabled', true);
        this.tableJqueryObj.find('.paginationInput').prop('disabled', true);
        this.tableJqueryObj.find('th').addClass('paginationSearchProcces');
    };
    this.unblockControlsElements = () =>
    {
        this.paginationJqueryObj.find('.pg_button, #pg_per_page').prop('disabled', false);
        this.tableJqueryObj.find('.paginationInput').prop('disabled', false);
        this.tableJqueryObj.find('th').removeClass('paginationSearchProcces');
        
        this.lastChangeInputId !== null ? this.tableJqueryObj.find(`.paginationInput[data-type="${this.lastChangeInputId}"]`).focus() : '';
        this.lastChangeInputId = null;
    };
    this.error = (error) => 
    {
        throw new Error(error);
    };
};