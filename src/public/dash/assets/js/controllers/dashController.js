function dashController() {
    var self = this;
    self.curUrl = window.location.pathname;
    self.openPageParams = '';
    this.init = function () {
        self.getUrlContent(self.curUrl, {}, window.location.search.substring(1));
    }
    this.getUrlContent = function (curUrl, ajaxParams = {}, openPageParams = ''){
        var dataTotal = {},
                curUrlArr = curUrl.split('/'),
                url = "/db/dashSpaController/" + '?' + window.location.search.substring(1);
        self.openPageParams = openPageParams;
        // console.time('mark');
        $('#gifBox').fadeIn(500);
        self.curUrl = curUrl;
        dataTotal.data = ajaxParams;
        dataTotal.data.curUrl = curUrl;
        dataTotal.data.page = curUrlArr[curUrlArr.length - 2];
        dataTotal.data.onePageParams = openPageParams;
        dataTotal.data.action = 'getPage';

        if (dataTotal.data.page == 'dash') {
            dataTotal.data.page = 'dashboard';
        }
        c(curUrlArr);
        $.ajax({
            url: url,
            method: "POST",
            contentType: "application/json", // send as JSON
            data: JSON.stringify(dataTotal),
            success: function (data) {
                var response = jQuery.parseJSON(data);
                if (response.code != 205)
                {
                    c(response);
                    self.processAjaxData(response.data.view);
                } else
                {
                    window.location = window.location.origin;
                }
            }
        });
    }
    this.processAjaxData = function (response) {
        var tempUrlArr = self.curUrl.split('/'),
                coutntNotReadMessages = dcc.countAllNotReadEzchatMessage > 0 ? '(' + dcc.countAllNotReadEzchatMessage + ') ' : '';
        title = tempUrlArr[tempUrlArr.length - 2];

        switch (tempUrlArr.length)
        {
            case 3:
                $('.dash_nav li').removeClass('active_nav');
                $('.dash_nav li[data-tabname = "' + tempUrlArr[tempUrlArr.length - 2] + '"]').addClass('active_nav');
                break;
            case 4:
                $('.dash_nav li').removeClass('active_nav');
                if ((tempUrlArr[tempUrlArr.length - 2] == 'trucks' || tempUrlArr[tempUrlArr.length - 2] == 'drivers' || tempUrlArr[tempUrlArr.length - 2] == 'maps') && $('.dash_nav li[data-tabname = "dash"]').hasClass('nav_safety'))
                {
                    $('.dash_nav li[data-tabname = "dash"]').addClass('active_nav');
                    break;
                }
                $('.dash_nav li[data-tabname = "' + tempUrlArr[tempUrlArr.length - 2] + '"]').addClass('active_nav');
                break;
            case 5:
                $('.dash_nav li').removeClass('active_nav');
                $('.dash_nav li[data-tabname = "' + tempUrlArr[tempUrlArr.length - 3] + '"]').addClass('active_nav');
                break;
        }
        title = title[0].toUpperCase() + title.slice(1).replace('_', ' ');
        if (window.history.pushState) {
            // if "response" contain bad russian encoding it's won't process
            try {
                window.history.pushState({"html": response, "pageTitle": COMPANY_NAME + ' - ' + title}, "", self.curUrl + (self.openPageParams == '' ? '' : '?' + self.openPageParams));
            } catch (err) {
                window.history.pushState({"html": "", "pageTitle": COMPANY_NAME + ' - ' + title}, "", self.curUrl);
            }
        }
        document.title = coutntNotReadMessages + COMPANY_NAME + ' - ' + title;
        // convert date format
        response = $(response);
        response.find('.time_sql_to_usa').each(function () {
            date = timeFromSQLDateTimeStringToUSAString($(this).text(), false);
            $(this).text(date);
        });
        response.find('.time_sql_to_local').each(function () {
            date = timeFromSQLDateTimeStringToUSAString($(this).text(), true);
            $(this).text(date);
        });
        $('section.content').empty().append(response);
        getActiveNavTab()
        c(self.curUrl);
        // console.timeEnd('mark');
        if (!GetURLParameter('session')) {
            verifyC.checkUserVerification();
            tutorialsC.getUserTutorials();
        }
        !(self.curUrl == '/dash/ezchat/' || self.curUrl == '/dash/message/') ? $('#gifBox').fadeOut(500) : '';
    }
}