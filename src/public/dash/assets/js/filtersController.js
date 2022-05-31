function getPaginator(totally, pp, cname){
    if(totally == undefined || totally == null){
        totally = 0;
    }
    var pages = Math.floor(totally/pp)+1;
    var opts = [20,35,50];
    var options = '';
    for(var x =0; x< opts.length; x++){
        options+='<option value="'+opts[x]+'" ';
        if(opts[x] == pp){
            options+='selected';
        }
        options+=' >'+opts[x]+'</option>';
    }
    
    var paginator = '<div class="pg_pagin" data-name="'+cname+'">\n\
            <button class="pg_button pg_nav pg_left_end"><<</button>\n\
            <button class="pg_button pg_nav pg_left"><</button>\n\
            <div class="pg_numbers">\n\
                <button class="pg_button pg_cur_page">1</button>\n\
                <span>/</span>\n\
                <span class="pg_total_pages">'+pages+'</span>\n\
            </div>\n\
            <button class="pg_button pg_nav pg_right">></button>\n\
            <button class="pg_button pg_nav pg_right_end">>></button>\n\
            <span>|</span>\n\
            <label>Display</label>\n\
            <select class="pg_per_page" >'+options+'\n\
            </select>\n\
            <span>/</span>\n\
            <span class="pg_total">'+totally+'</span>\n\
            <span>results(s)</span>\n\
        </div>';
    return paginator;
}
function updatePaginator(totally, cname){
    if(totally == undefined || totally == null){
        totally = 0;
    }
    
    var pagin = $('.pg_pagin[data-name="'+cname+'"]');
    var pp = pagin.find('.pg_per_page').val();
    var pages = Math.floor(totally/pp)+1;
    pagin.find('.pg_total').text(totally);
    pagin.find('.pg_total_pages').text(pages);
}
function filterAction(table){
    var handler = table.attr('data-h');
    var action = table.attr('data-name');
    var ctr = table.attr('data-c');
    if(ctr == 0){
        var url = adminUrl;
    }else if(ctr == 1){
        var url = dashUrl;
    }
    var pp = table.parent().find('.pg_per_page').val();
    var p = table.parent().find('.pg_cur_page').text();
    var sortN = '';
    var sort = {};
    var activeSort = table.find('.active_f')
    if(activeSort.length > 0){
        var sortN = activeSort.closest('th').attr('data-n');
        if(activeSort.hasClass('up_f')){
            var sortV = 1;
        }else{
            var sortV = 0;
        }
        sort = {sortN:sortN, sortV:sortV};
    }
    var filtersEl = table.find(".w_filter_input").filter(function() {
        return this.value.length !== 0;
    });
    var filters = [];
    filtersEl.each(function(){
        var fName = $(this).closest('th').attr('data-n');
        var fValue = $(this).val();
        var oneFilter = {'fName':fName, 'fValue':fValue};
        filters.push(oneFilter);
    })
    var data = {sort:sort, filters:filters,pp:pp, p:p};
    AjaxController(action, data, url, handler, errorBasicHandler);
}

function TableController(name){
    var self = this;
    this.table = $('table[data-name="'+name+'"]');
    
    //activate pagination
    if(this.table.hasClass('w_pagin')){
        this.totally = parseInt(this.table.attr('data-totally'));
        this.pp = parseInt(this.table.attr('data-pp'));
        this.table.parent().prepend(getPaginator(this.totally, this.pp, this.table.attr('data-name')))
    }
    
    //activate filters
    if(this.table.hasClass('w_filters')){
        var trN = this.table.find('thead tr').clone();
        $(trN).find('th').each(function(index){
            if($(this).hasClass('no_filter')){
                $(this).text('');
                return ;
            }
            var w = self.table.find('thead tr').first().find('th').eq(index).outerWidth(true);
            w-=18; 
            $(this).addClass('w_filter_th').html('<input type="text" class="w_filter_input" style="width:'+w+'px" placeholder="'+$(this).text()+'" />');
        })
        $(window).resize(function(){
            self.table.find('thead tr').eq(1).find('th').width(0).each(function(index){
                var w = self.table.find('thead tr').first().find('th').eq(index).innerWidth();
                c('index ' + index + ' '+w + ' ' +self.table.find('thead tr').first().find('th').eq(index).text())
                $(this).width(w);
            })
        })
        this.table.find('thead').append(trN);
    }
    
    //activate sortiment
    if(this.table.hasClass('w_sort')){
        this.table.find('thead tr').first().find('th').each(function(){
            if(!$(this).hasClass('no_sort'))
            $(this).append('<button class="filter_f up_f"><</button>');
        })
    }
}
function activateInputFilters(){
    var typingTimer;                //timer identifier
    var doneTypingInterval = 500;  //time in ms, 5 second for example
    $('body').on('keyup', '.w_filter_input', function(e){
        clearTimeout(typingTimer);
        var table = $(this).closest('table');
        typingTimer = setTimeout(function(){table.parent().find('.pg_cur_page').text('1');filterAction(table)}, doneTypingInterval);
    });
    //on keydown, clear the countdown 
    $('body').on('keydown', '.w_filter_input', function(e){
        clearTimeout(typingTimer);
    });
}
function activateSort(){
    $('body').on('click', '.filter_f', function(e){
        var table = $(this).closest('table');
        e.preventDefault();
        table.find('.filter_f').not(this).removeClass('active_f').removeClass('down_f').addClass('up_f');
        if($(this).hasClass('up_f')){
            $(this).removeClass('up_f');
            $(this).addClass('down_f').addClass('active_f');
            var sortV = 0;
        }else{
            $(this).removeClass('down_f');
            $(this).addClass('up_f').addClass('active_f');
            var sortV = 1;
        }
        
        filterAction(table);
    })
}
function activatePaginationActions(){
    $('body').on('click', '.pg_nav', function(e){
        var pagin = $(this).closest('.pg_pagin');
        var table = $('table[data-name="'+pagin.attr('data-name')+'"]');
        if($(this).hasClass('pg_right')){
            pagin.find('.pg_cur_page').text(parseInt(pagin.find('.pg_cur_page').text())+1);
        }else if($(this).hasClass('pg_right_end')){
            pagin.find('.pg_cur_page').text(999999);
        }else if($(this).hasClass('pg_left')){
            pagin.find('.pg_cur_page').text(parseInt(pagin.find('.pg_cur_page').text())-1);
        }else if($(this).hasClass('pg_left_end')){
            pagin.find('.pg_cur_page').text(1);
        }
        
        checkPagin(pagin);
        filterAction(table);
    })
    $('body').on('change', '.pg_per_page', function(e){
        var pagin = $(this).closest('.pg_pagin');
        pagin.find('.pg_cur_page').text('1');
        var table = $('table[data-name="'+pagin.attr('data-name')+'"]');
        filterAction(table);
    })
}
function activateControllers(){
    $('.ez_table').each(function(){
        var name = $(this).attr('data-name');
        if(name == undefined || name == null){
            return;
        }
        var controller = new TableController(name);
        tableControllers[name] = controller;
    })
}
var tableControllers = {};
$().ready(function(){
    activateControllers();
    activateInputFilters();
    activatePaginationActions();
    activateSort();
})
function checkPagin(pagin){
    var ttlpages = parseInt(pagin.find('.pg_total_pages').text());
    var crtpage = parseInt(pagin.find('.pg_cur_page').text());
    if(ttlpages < crtpage){
        crtpage = ttlpages;
        pagin.find('.pg_cur_page').text(crtpage);
    }else if(crtpage <= 1){
        crtpage = 1;
        pagin.find('.pg_cur_page').text(crtpage);
    }
    $('.pg_right_end, .pg_right, .pg_left_end, .pg_left').show();
    if(crtpage == ttlpages){
        $('.pg_right_end, .pg_right').hide();
    }else if(crtpage <= 1){
        $('.pg_left_end, .pg_left').hide();
    }
}