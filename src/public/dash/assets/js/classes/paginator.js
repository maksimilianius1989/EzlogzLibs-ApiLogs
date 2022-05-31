function controllerPaginator(cntrl){
    //pagination methods
    cntrl.paginBox = function () {
        return `<div id="pg_pagin" class="pagin_box device_table_pagin" data-table="user_table" style="position: absolute;bottom: 3px;top: auto;right: auto;">
            <button id="pg_left_end" class="pg_button" onclick="${cntrl.name}.userPgClick(-1, this)">
                <i class="fa fa-angle-double-left" aria-hidden="true"></i>
            </button>
            <button id="pg_left" class="pg_button" onclick="${cntrl.name}.userPgClick(0, this)">
                <i class="fa fa-angle-left" aria-hidden="true"></i>
            </button>
            <div id="pg_numbers">
                <span id="pg_cur_page" class="pg_button">${cntrl.page}</span>
                <span>/</span>
                <span id="pg_total_pages">${cntrl.pages}</span>
            </div>
            <button id="pg_right" class="pg_button" onclick="${cntrl.name}.userPgClick(1, this)">
                <i class="fa fa-angle-right" aria-hidden="true"></i>
            </button>
            <button id="pg_right_end" class="pg_button" onclick="${cntrl.name}.userPgClick(2, this)">
                <i class="fa fa-angle-double-right" aria-hidden="true"></i>
            </button>
            <label>Display</label>
            <select id="pg_per_page" onchange="${cntrl.name}.userPgClick(9, this)"><option>15</option><option>30</option><option>50</option></select>
            <span id="pg_total">${cntrl.totally}</span>
            <span id="pg_results">result(s)</span>
        </div>`
    }
    cntrl.updatePaginElements = function () {
        cntrl.pages = Math.max(Math.ceil(cntrl.totally / cntrl.perPage), 1);
        var totalP = cntrl.pages;
        var curP = cntrl.page;
        var box = $('#'+cntrl.boxId+' .pagin_box')
        box.find('#pg_per_page').val(cntrl.perPage)
        box.find('#pg_total_pages').text(cntrl.pages)
        box.find('#pg_total').text(cntrl.totally)
        box.find('#pg_cur_page').text(cntrl.page)
        if (curP == 1) {
            $(box).find('#pg_left_end').hide();
            $(box).find('#pg_left').hide();
        } else {
            $(box).find('#pg_left_end').show();
            $(box).find('#pg_left').show();
        }

        if (curP == totalP) {
            $(box).find('#pg_right_end').hide();
            $(box).find('#pg_right').hide();
        } else {
            $(box).find('#pg_right_end').show();
            $(box).find('#pg_right').show();
        }
        if (totalP == 1) {
            $(box).find('#pg_left_end').hide();
            $(box).find('#pg_left').hide();
            $(box).find('#pg_right_end').show();
            $(box).find('#pg_right').show();
        }
    }
    cntrl.userPgClick = function (v, el) {
        var box = $(el).closest('.pagin_box');
        var perPage = $(box).find('#pg_per_page').val();
        var total = $(box).find('#pg_total').text();
        var totalP = Math.max(Math.ceil(total / perPage), 1);
        var curP = parseInt($(box).find('#pg_cur_page').text())
        if (v == 0) {
            curP--;
        } else if (v == 1) {
            curP++;
        } else if (v == -1) {
            curP = 1;
        } else if (v == 2) {
            curP = totalP;
        }
        if (curP > totalP) {
            curP = totalP;
        }
        if (curP < 1) {
            curP = 1;
        }
        cntrl.perPage = perPage;
        cntrl.totally = total;
        cntrl.pages = totalP;
        cntrl.page = curP;
        cntrl.init();
    }
}
