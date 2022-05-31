function seoController() {
    var self = this;

    self.apiURL = '/db/api/apiSEOController/';

    self.init = function () {
        self.getListUrl();
    }

    self.getListUrl = function () {
        AjaxController('getListUrl', {}, self.apiURL, self.getListUrlHandler, self.getListUrlHandler, true);
    }
    self.getListUrlHandler = function (response) {
        c(response);
        $.each(response.data.result, function (key, data) {
            var apText = '<tr data-id="' + data.id + '" onclick="seoC.showUpdateSeoUriPopap(' + data.id + ');">\n\
                <td>' + data.id + '</td>\n\
                <td class="col_url">' + data.uri + '</td>\n\
                <td class="col_tit">' + data.title + '</td>\n\
                <td class="col_des">' + data.description + '</td>\n\
                <td class="col_key">' + data.keywords + '</td>\n\
                <td class="actions_col">\n\
                    <i class="icon-close table_icon delete_row" onclick="seoC.deleteSeoUriPopap(event, ' + data.id + ');"></i>\n\
                </td>\n\
            </tr>';
            $('#table_url_list tbody').append(apText);
        });
    }

    self.showCreateSeoUriPopap = function () {
        var header = 'Create URI SEO Settings';
        var content = '<div class="row">\n\
            <div class="col-sm-6">\n\
                <h2>General Params</h2>\n\
                <div class="form-group">\n\
                    <label>URI*</label>\n\
                    <input type="text" id="add_uri" class="ez_input form-control">\n\
                </div>\n\
                <div class="form-group">\n\
                    <label>Title*</label>\n\
                    <textarea id="add_title" class="ez_input form-control"></textarea>\n\
                </div>\n\
                <div class="form-group">\n\
                    <label>Description</label>\n\
                    <textarea id="add_description" class="ez_input form-control"></textarea>\n\
                </div>\n\
                <div class="form-group">\n\
                    <label>Keywords</label>\n\
                    <textarea id="add_keywords" class="ez_input form-control"></textarea>\n\
                </div>\n\
            </div>\n\
            <div class="col-sm-6">\n\
                <h2>CANONICAL & ROBOT & LOCALE</h2>\n\
                <div class="form-group">\n\
                    <label>Canonical</label>\n\
                    <input type="text" id="add_canonical" class="ez_input form-control">\n\
                </div>\n\
                <div class="form-group">\n\
                    <label>Robot</label>\n\
                    <select id="add_robot" class="ez_input form-control">\n\
                        <option value="index, follow">index, follow</option>\n\
                        <option value="noindex, follow">noindex, follow</option>\n\
                        <option value="index, nofollow">index, nofollow</option>\n\
                        <option value="noindex, nofollow">noindex, nofollow</option>\n\
                    </select>\n\
                </div>\n\
                <div class="form-group">\n\
                    <label>Locale</label>\n\
                    <textarea id="add_locale" class="ez_input form-control"></textarea>\n\
                </div>\n\
            </div>\n\
        </div>\n\
        <div class="row">\n\
            <div class="col-sm-12">\n\
                <h2>STRUCTURED DATA & SOCIAL</h2>\n\
                <div class="form-group">\n\
                    <label>Structured Data</label>\n\
                    <textarea id="add_str_data" class="ez_input form-control"></textarea>\n\
                </div>\n\
                <div class="form-group">\n\
                    <label>Social</label>\n\
                    <textarea id="add_social" class="ez_input form-control"></textarea>\n\
                </div>\n\
            </div>\n\
        </div>';

        var params = {'footerButtons': '<button class="btn btn-default" onclick="seoC.createSeoUri();">Create</button>'}

        showModal(header, content, 'createSeoUri', 'modal-lg', params);
    }

    self.createSeoUri = function () {
        var error = 0;
        var uri = $('#add_uri').val();
        var title = $('#add_title').val();
        var description = $('#add_description').val();
        var keywords = $('#add_keywords').val();
        var canonical = $('#add_canonical').val();
        var robot = $('#add_robot').val();
        var locale = $('#add_locale').val();

        var str_data = $('#add_str_data').val();
        var social = $('#add_social').val();

        if (uri === '') {
            $('#add_uri').addClass('error');
            error = 1;
        }
        if (title === '') {
            $('#add_title').addClass('error');
            error = 1;
        }
        if (error > 0) {
            return false;
        }

        var data = {
            uri: uri,
            title: title,
            description: description,
            keywords: keywords,
            canonical: canonical,
            robot: robot,
            locale: locale,
            str_data: str_data,
            social: social
        };

        AjaxController('addUriTDK', data, self.apiURL, self.createSeoUriHandler, self.createSeoUriHandler, true);
    }

    self.createSeoUriHandler = function (response) {
        c(response);
        $('#createSeoUri').remove();
        var apText = '<tr data-id="' + response.data.result.id + '" onclick="seoC.showUpdateSeoUriPopap(' + response.data.result.id + ');">\n\
                <td>' + response.data.result.id + '</td>\n\
                <td class="col_url">' + response.data.result.uri + '</td>\n\
                <td class="col_tit">' + response.data.result.title + '</td>\n\
                <td class="col_des">' + response.data.result.description + '</td>\n\
                <td class="col_key">' + response.data.result.keywords + '</td>\n\
                <td class="actions_col">\n\
                    <i class="icon-close table_icon delete_row" onclick="seoC.deleteSeoUriPopap(event, ' + response.data.result.id + ');"></i>\n\
                </td>\n\
            </tr>';
        $('#table_url_list tbody').append(apText);
    }

    self.showUpdateSeoUriPopap = function (id) {
        AjaxController('getListUrlUpdate', {id: id}, self.apiURL, self.showUpdateSeoUriPopapHandler, self.showUpdateSeoUriPopapHandler, true);
    }

    self.showUpdateSeoUriPopapHandler = function (response) {
        c(response);
        var result = response.data.result;

        var header = 'Update URI SEO Settings';
        var content = '<div class="row">\n\
            <div class="col-sm-6">\n\
                <h2>General Params</h2>\n\
                <div class="form-group">\n\
                    <label>URI*</label>\n\
                    <input type="text" value="' + result.uri + '" id="add_uri" class="ez_input form-control">\n\
                </div>\n\
                <div class="form-group">\n\
                    <label>Title*</label>\n\
                    <textarea id="add_title" class="ez_input form-control">' + result.title + '</textarea>\n\
                </div>\n\
                <div class="form-group">\n\
                    <label>Description</label>\n\
                    <textarea id="add_description" class="ez_input form-control">' + result.description + '</textarea>\n\
                </div>\n\
                <div class="form-group">\n\
                    <label>Keywords</label>\n\
                    <textarea id="add_keywords" class="ez_input form-control">' + result.keywords + '</textarea>\n\
                </div>\n\
            </div>\n\
            <div class="col-sm-6">\n\
                <h2>CANONICAL & ROBOT & LOCALE</h2>\n\
                <div class="form-group">\n\
                    <label>Canonical</label>\n\
                    <input type="text" value="' + result.canonical + '" id="add_canonical" class="ez_input form-control">\n\
                </div>\n\
                <div class="form-group">\n\
                    <label>Robot</label>\n\
                    <select id="add_robot" class="ez_input form-control">\n\
                        <option ' + (result.robot == 'index, follow' ? 'selected' : '') + ' value="index, follow">index, follow</option>\n\
                        <option ' + (result.robot == 'noindex, follow' ? 'selected' : '') + ' value="noindex, follow">noindex, follow</option>\n\
                        <option ' + (result.robot == 'index, nofollow' ? 'selected' : '') + ' value="index, nofollow">index, nofollow</option>\n\
                        <option ' + (result.robot == 'noindex, nofollow' ? 'selected' : '') + ' value="noindex, nofollow">noindex, nofollow</option>\n\
                    </select>\n\
                </div>\n\
                <div class="form-group">\n\
                    <label>Locale</label>\n\
                    <textarea id="add_locale" class="ez_input form-control">' + result.locale + '</textarea>\n\
                </div>\n\
            </div>\n\
        </div>\n\
        <div class="row">\n\
            <div class="col-sm-12">\n\
                <h2>STRUCTURED DATA & SOCIAL</h2>\n\
                <div class="form-group">\n\
                    <label>Structured Data</label>\n\
                    <textarea id="add_str_data" class="ez_input form-control">' + result.str_data + '</textarea>\n\
                </div>\n\
                <div class="form-group">\n\
                    <label>Social</label>\n\
                    <textarea id="add_social" class="ez_input form-control">' + result.social + '</textarea>\n\
                </div>\n\
            </div>\n\
        </div>';

        var params = {'footerButtons': '<button class="btn btn-default" onclick="seoC.updateSeoUri(' + result.id + ');">Update</button>'}

        showModal(header, content, 'updateSeoUri', 'modal-lg', params);
    }

    self.updateSeoUri = function (id) {
        var error = 0;
        var uri = $('#add_uri').val();
        var title = $('#add_title').val();
        var description = $('#add_description').val();
        var keywords = $('#add_keywords').val();
        var canonical = $('#add_canonical').val();
        var robot = $('#add_robot').val();
        var locale = $('#add_locale').val();

        var str_data = $('#add_str_data').val();
        var social = $('#add_social').val();

        if (uri === '') {
            $('#add_uri').addClass('error');
            error = 1;
        }
        if (title === '') {
            $('#add_title').addClass('error');
            error = 1;
        }
        if (error > 0) {
            return;
        }

        var data = {
            id: id,
            uri: uri,
            title: title,
            description: description,
            keywords: keywords,
            canonical: canonical,
            robot: robot,
            locale: locale,
            str_data: str_data,
            social: social
        };

        AjaxController('updateUriTDK', data, self.apiURL, self.updateSeoUriHandler, self.updateSeoUriHandler, true);
    }

    self.updateSeoUriHandler = function (response) {
        c(response);
        $('#updateSeoUri').remove();
        var apText = '<tr data-id="' + response.data.result.id + '" onclick="seoC.showUpdateSeoUriPopap(' + response.data.result.id + ');">\n\
                <td>' + response.data.result.id + '</td>\n\
                <td class="col_url">' + response.data.result.uri + '</td>\n\
                <td class="col_tit">' + response.data.result.title + '</td>\n\
                <td class="col_des">' + response.data.result.description + '</td>\n\
                <td class="col_key">' + response.data.result.keywords + '</td>\n\
                <td class="actions_col">\n\
                    <i class="icon-close table_icon delete_row" onclick="seoC.deleteSeoUriPopap(event, ' + response.data.result.id + ');"></i>\n\
                </td>\n\
            </tr>';
        $('#table_url_list tbody tr[data-id="' + response.data.result.id + '"]').replaceWith(apText);
    }

    self.deleteSeoUriPopap = function (e, id) {
        e.stopPropagation();
        var header = 'Delete URI SEO Settings';
        var content = 'Delete this SEO URI settings?';

        var params = {'footerButtons': '<button class="btn btn-default" onclick="seoC.deleteSeoUri(' + id + ');">Delete</button><button class="btn btn-default" data-dismiss="modal">Cancel</button>'}

        showModal(header, content, 'deleteSeoUri', 'modal-lg', params);
    }

    self.deleteSeoUri = function (id) {
        AjaxController('deleteUriTDK', {id: id}, self.apiURL, self.deleteSeoUriHandler, self.deleteSeoUriHandler, true);
    }

    self.deleteSeoUriHandler = function (response) {
        $('#deleteSeoUri').remove();
        $('#table_url_list tbody tr[data-id="' + response.data.result + '"]').remove();
    }
}
seoC = new seoController();