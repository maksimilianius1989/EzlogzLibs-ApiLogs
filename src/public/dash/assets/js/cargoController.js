function cargoContoller(){
    var self = this;
    $('body').on('click', '#one_cargo_box .pick_shipper', function(){self.pickShipper(this);});
    $('body').on('click', '#one_cargo_box .drop_shipper', function(){self.dropShipper(this);});
    $('body').on('click', '#one_cargo_box .save_edit', function(){
        self.saveEdits($(this));
        if(location.pathname === "/dash/dispatch/dispatch/"){
            location = MAIN_LINK+'/dash/dispatch/cargo/';
        }
    });
    $('body').on('click', '#one_cargo_box .save_edit_close', function(){
        self.saveEdits($(this));
        self.hideBox();
    });
    $('body').on('click', '#one_cargo_box .dispatch', function(){
        self.saveEdits($(this));
        if(location.pathname === "/dash/dispatch/cargo/"){
            location = MAIN_LINK+'/dash/dispatch/dispatch/';
        } else if(location.pathname === "/dash/dispatch/dispatch/") {
            self.hideBox();
        }
    });
    $('body').on('click', '.history_row', function(e){e.stopPropagation();$('#one_cargo_box').hide(); self.openHistory(this);});
    this.next_id = 1;
    this.next_drop_id = 1;
    this.callback = '';
    this.setCallback = function(callback){
        this.callback = callback;
    }
    this.emptyParams = function(){
        $('.update_result').empty();
        $('#one_cargo_box input[type=text],#one_cargo_box input[type=hidden],#one_cargo_box textarea').prop("readonly", false).removeClass('error').val('');
        $('#one_cargo_box .save_edit').show();
        $('#one_cargo_box .save_edit.dispatch').show();
        $('#one_cargo_box input[type=checkbox],#one_cargo_box select').prop("disabled", false).prop('checked', false);
        $('#pick_info .ship_block').each(function(){
            if($(this).find('.pick_shipper').val() != '0'){
                $(this).remove();
            }
        });
        $('#drop_info .ship_block').each(function(){
            if($(this).find('.drop_shipper').val() != '0'){
                $(this).remove();
            }
        });
        $('#pick_info .change').each(function(){
            $(this).remove();
        });
        $('#drop_info .change').each(function(){
            $(this).remove();
        });
    }
    this.showBox = function(){
        $('#one_cargo_box .box_header').text('Create Cargo');
        $('#one_cargo_box').show();
    }
    this.hideBox = function(){
        $('#one_cargo_box').hide();
    }
    this.openHistory = function(but){
        var id = $(but).closest('tr').attr('data-id');
        $('#history_box tbody').empty();
        for(var x = 0; x< mainAr.length; x++){
            var cargo = mainAr[x];
            if(id == cargo.id){
                var history = cargo.history.reverse();
                
               for(var y = 0; y<history.length; y++){
                   var historyItem = history[y];
                   
                    for (var key in historyItem) {
                        if (historyItem.hasOwnProperty(key)) {
                           historyItem[key] = this.checkValue(historyItem[key]);
                        }
                      }
                   $('#history_box tbody').append('<tr>\n\
                        <td>'+historyItem.statusName+'</td>\n\
                        <td>'+convertDateToUSA(historyItem.statusDateTime, true)+'</td>\n\
                        <td>'+historyItem.driver+'</td>\n\
                        <td>'+historyItem.truckName+'</td>\n\
                        <td>'+historyItem.trailerName+'</td>\n\
                        <td>'+historyItem.carrierName+'</td>\n\
                        <td>'+historyItem.userName+'</td>\n\
                    </tr>')
               }
                break;
            }
        }
        $('#history_box').show();
    }
    this.checkValue = function(data){
        if (data === undefined || data === null) {
            return '';
        }
        return data;
    }
    this.pickShipper = function(el){
        this.checkPicks(el);
        if($(el).val() != '0'){
            for(var x = 0; x< shippers.length; x++){
                var shipper = shippers[x];
                if($(el).val() == shipper.id){
                    $(el).closest('.ship_block').find('.selected_address p').text(shipper.address + ', ' + shipper.city + ', ' + shipper.state)
                    break;
                }
            }
            $(el).closest('.ship_block').find('.pick_shipper option').first().text('Remove pick');
            $(el).closest('.ship_block').find('button.new_shipper').hide();
            $(el).closest('.ship_block').find('.box_row').show();
        }else {
            $(el).closest('.ship_block').find('button.new_shipper').show();
            $(el).closest('.ship_block').find('.box_row').hide();
        }
    }
    this.checkPicks = function(el){
        var haveNewBox = false;
        $($(el).closest('.info_box').find(".pick_shipper").get().reverse()).each(function() {
            if(haveNewBox && $(this).val() == '0'){
                $(this).closest('.ship_block').hide('fast', function(){$(this).remove()});
                return true;
            }
            if($(this).val() == '0'){
                haveNewBox = true;
            }
        });
        if(!haveNewBox){
            var newBox =  $(el).closest('.info_box').find('.ship_block').last().clone();
            newBox.find('.datepicker').removeClass('hasDatepicker').attr('id', 'date_'+this.next_id).datetimepicker({
                dateFormat: 'mm-dd-yy', 
                timeFormat: "HH:mm:ss"
            });
            this.next_id++;
            $(el).closest('.info_box').append(newBox);
        }
    }
    this.openRow = function(but){
        $('#one_cargo_box .box_header').text('Cargo Info');
        var id = $(but).closest('tr').attr('data-id');
        var selectedItem = {};
        for(var x = 0; x< mainAr.length; x++){
            var broker = mainAr[x];
            if(id == broker.id){
                selectedItem = broker;
                break;
            }
        }
        this.fillParams(selectedItem);
        $('#one_cargo_box .datepicker').datetimepicker("disable");
        $('#one_cargo_box input[type=text],#one_cargo_box input[type=hidden],#one_cargo_box textarea').prop("readonly", true);
        $('#one_cargo_box input[type=checkbox],#one_cargo_box select').prop("disabled", true);
        $('#one_cargo_box .box_row.ship_block').show();
        $('#one_cargo_box .box_row.ship_block:last-child').hide();
        if(selectedItem.status == 0){
            $('#one_cargo_box .dispatch').show();
        }else{
            $('#one_cargo_box .dispatch').hide();
        }
        $('#one_cargo_box .save_edit').hide();
        $('#one_cargo_box .save_edit_close').hide();
        $('#one_cargo_box').show();
    }
    this.fillParams = function(item){
        $('#general_info').find(' input[type=text], input[type=hidden], textarea, select').removeClass('error').each(function(){
            var id = $(this).attr('id');
            var field = id.substring(5);
            $(this).val(item[field]);
        })
        $('#general_info').find(' input[type=checkbox]').each(function(){
            var id = $(this).attr('id');
            var field = id.substring(5);
            var value = item[field];
            if(value == 0){
                $(this).prop('checked', false);
            }else{
                $(this).prop('checked', true);
            }
        });
        if(item.picks)
        {
        for(var x = 0; x < item.picks.length; x++){
            var this_item = item.picks[x];
            var newBox =  $('#pick_info').find('.ship_block').last().clone();
            newBox.find('.datepicker').removeClass('hasDatepicker').attr('id', 'date_'+this.next_id).datetimepicker({
                dateFormat: 'mm-dd-yy', 
                timeFormat: "HH:mm:ss"
            });
            newBox.find('.pick_shipper').val(this_item.shipperId);
            newBox.find('.pick_shipper option').first().text('Remove pick');
            newBox.find('button.new_shipper').hide();
            for(var y = 0; y< shippers.length; y++){
                var shipper = shippers[y];
                if(this_item.shipperId == shipper.id){
                    newBox.find('.selected_address p').text(shipper.address + ', ' + shipper.city + ', ' + shipper.state)
                    break;
                }
            }
            newBox.find('.datepicker').val(convertDateToUSA(this_item.dateTime, true));
            newBox.find('.selected_pcs input').val(this_item.psc);
            newBox.find('.selected_pall input').val(this_item.plts);
            newBox.find('.selected_wght input').val(this_item.plts);
            newBox.find('.selected_len input').val(this_item.len);
            newBox.find('.selected_note textarea').val(this_item.note);
            newBox.find('.box_row').show();
            this.next_id++;
            $('#pick_info').find('.ship_block').last().before(newBox);
        }
    }
	if(item.drops)
        {
        for(var x = 0; x < item.drops.length; x++){
            var this_item = item.drops[x];
            var newBox =  $('#drop_info').find('.ship_block').last().clone();
            newBox.find('.datepicker').removeClass('hasDatepicker').attr('id', 'date_d_'+this.next_drop_id).datetimepicker({
                dateFormat: 'mm-dd-yy', 
                timeFormat: "HH:mm:ss"
            });
            newBox.find('.drop_shipper').val(this_item.shipperId);
            newBox.find('.drop_shipper option').first().text('Remove pick');
            newBox.find('button.new_shipper').hide();
            for(var y = 0; y< shippers.length; y++){
                var shipper = shippers[y];
                if(this_item.shipperId == shipper.id){
                    newBox.find('.selected_address p').text(shipper.address + ', ' + shipper.city + ', ' + shipper.state)
                    break;
                }
            }
            newBox.find('.datepicker').val(convertDateToUSA(this_item.dateTime, true));
            newBox.find('.selected_pcs input').val(this_item.psc);
            newBox.find('.selected_pall input').val(this_item.plts);
            newBox.find('.selected_wght input').val(this_item.plts);
            newBox.find('.selected_len input').val(this_item.len);
            newBox.find('.selected_note textarea').val(this_item.note);
            newBox.find('.box_row').show();
            this.next_drop_id++;
            $('#drop_info').find('.ship_block').last().before(newBox);
        }
		}
    }
    this.editRow = function(but){
        $('#one_cargo_box .box_header').text('Edit Cargo');
        var id = $(but).closest('tr').attr('data-id');
        var selectedItem = {};
        for(var x = 0; x< mainAr.length; x++){
            var broker = mainAr[x];
            if(id == broker.id){
                selectedItem = broker;
                break;
            }
        }
        this.fillParams(selectedItem);
        $('#one_cargo_box .datepicker').datetimepicker("enable");
        $('#one_cargo_box .save_edit').show();
        $('#one_cargo_box .box_row.ship_block').show();
        if(selectedItem.status == 0){
            $('#one_cargo_box .save_edit.dispatch').show();
        }else{
            $('#one_cargo_box .save_edit.dispatch').hide();
        }
        
        $('#one_cargo_box').show();
        
    }
    this.dropShipper = function(el){
        this.checkDrops(el);
        if($(el).val() != '0'){
            for(var x = 0; x< shippers.length; x++){
                var shipper = shippers[x];
                if($(el).val() == shipper.id){
                    $(el).closest('.ship_block').find('.selected_address p').text(shipper.address + ', ' + shipper.city + ', ' + shipper.state)
                    break;
                }
            }
            $(el).closest('.ship_block').find('.drop_shipper option').first().text('Remove pick');
            $(el).closest('.ship_block').find('button.new_shipper').hide();
            $(el).closest('.ship_block').find('.box_row').show();
        }else{
            $(el).closest('.ship_block').find('button.new_shipper').show();
            $(el).closest('.ship_block').find('.box_row').hide();
        }
    }
    this.checkDrops = function(el){
        var haveNewBox = false;
        $($(el).closest('.info_box').find(".drop_shipper").get().reverse()).each(function() {
            if(haveNewBox && $(this).val() == '0'){
                $(this).closest('.ship_block').hide('fast', function(){$(this).remove()});
                return true;
            }
            if($(this).val() == '0'){
                haveNewBox = true;
            }
        });
        if(!haveNewBox){
            var newBox =  $(el).closest('.info_box').find('.ship_block').last().clone();
            newBox.find('.datepicker').removeClass('hasDatepicker').attr('id', 'date_d_'+this.next_drop_id).datetimepicker({
                dateFormat: 'mm-dd-yy', 
                timeFormat: "HH:mm:ss"
            });
            this.next_drop_id++;
            $(el).closest('.info_box').append(newBox);
        }
    }
    this.saveEdits = function(el){
        var fields = {picks:[], drops:[]};
        var canSave = true;
        $('#general_info').find(' input[type=text], input[type=hidden], textarea, select').removeClass('error').each(function(){
            var value = $(this).val();
            var id = $(this).attr('id');
            var field = id.substring(5);
            fields[field] = value;
        });
        $('#general_info').find(' input[type=checkbox]').each(function(){
            var value =0;
            if($(this).is(":checked"))
            value = 1;
            var id = $(this).attr('id');
            var field = id.substring(5);
            fields[field] = value;
        });
        $('#pick_info .ship_block').each(function(){
            var newPick = {};
            if($(this).find('.pick_shipper').val() != '0'){
                newPick.shipper = $(this).find('.pick_shipper').val();
                newPick.dateTime = convertDateToSQL($(this).find('.datepicker').val(), true);
                newPick.pcs = $(this).find('.selected_pcs input').val();
                newPick.pall = $(this).find('.selected_pall input').val();
                newPick.wght = $(this).find('.selected_wght input').val();
                newPick.len = $(this).find('.selected_len input').val();
                newPick.note = $(this).find('.selected_note textarea').val();
                fields.picks.push(newPick);
            }
        });
        $('#drop_info .ship_block').each(function(){
            var newPick = {};
            if($(this).find('.drop_shipper').val() != '0'){
                newPick.shipper = $(this).find('.drop_shipper').val();
                newPick.dateTime = convertDateToSQL($(this).find('.datepicker').val(), true);
                newPick.pcs = $(this).find('.selected_pcs input').val();
                newPick.pall = $(this).find('.selected_pall input').val();
                newPick.wght = $(this).find('.selected_wght input').val();
                newPick.len = $(this).find('.selected_len input').val();
                newPick.note = $(this).find('.selected_note textarea').val();
                fields.drops.push(newPick);
            }
        });
        if(el.hasClass('dispatch')){
            fields.dispatch = true;
        }
        // console.log(fields);
        if(canSave){
           this.sendEdits(fields);
        }
    }
    this.sendEdits = function(fields){
        fields.action = 'saveCargo';
        var self = this;
        data = {data:fields};
        $.ajax({
            url:MAIN_LINK+'/db/dispatchController/' + '?' + window.location.search.substring(1),
            method:"POST",
            contentType: "application/json", // send as JSON
            data:JSON.stringify(data),
            success: function(data){
                var response = jQuery.parseJSON(data);
                if(response.code == '000'){
                    
                    var cargo = response.data;
                    var cargoId = cargo.id;
                    jQuery.cookie('cargoId', cargoId, {path: '/'});
                    var editCg = false;
                    $('#cargo_table tbody tr').each(function(){
                        if($(this).attr('data-id') == cargoId){
                            editCg = true;
                        }
                    });
                    if(editCg){
                        self.editResult(cargo, cargoId);
                    }else{
                        self.createItem(cargo);
                    }
                    if(self.callback != '')
                    self.callback(response.data);
                    $('.save_edit_result').text('Saved');
                }else{
                    $('.save_edit_result').text(response.message);
                }
            }
        });
    }
    this.editResult = function(item, id){
        for(var x = 0; x< mainAr.length; x++){
            if(id == mainAr[x].id){
                mainAr[x] = item;
                break;
            }
        }
        $('#cargo_table tbody tr').each(function(){
            if($(this).attr('data-id') == id){
                var appendStr = '<td>'+item.id+'</td>\n\
                    <!--<td class="col_broker">'+item.brokerName+'</td>-->\n\
                    <td class="col_reference">'+item.reference+'</td>\n\
                    <td class="col_from">'+item.com+'</td>\n\
                    <td class="col_to">'+item.rate+'</td>\n\
                    <td>'+item.car_pay+'</td>\n\
                    <td>'+convertDateToUSA(item.statusDateTime, true)+'</td>\n\
                    <td class="col_status">'+item.statusName+'</td>\n\
                    <td class="actions_col">\n\
                        <!--<i class="icon-pencil table_icon edit_row"></i>-->\n\
                        <i class="icon-edit-logs table_icon open_row"></i>\n\
                        <i class="icon-history table_icon history_row"></i>\n\
                    </td>';
                $(this).empty().append(appendStr);
            }
        });
    }
    this.createItem = function(item){
        mainAr.push(item);
        var appendStr = '<tr data-id="'+item.id+'">\n\
            <td>'+item.id+'</td>\n\
            <td class="col_reference">'+item.reference+'</td>\n\
            <!--<td class="col_broker">'+item.brokerName+'</td>-->\n\
            <td class="col_from">'+item.com+'</td>\n\
            <td class="col_to">'+item.rate+'</td>\n\
            <td>'+item.car_pay+'</td>\n\
            <td>'+convertDateToUSA(item.statusDateTime, true)+'</td>\n\
            <td class="col_status">'+item.statusName+'</td>\n\
            <td class="actions_col">\n\
                <!--<i class="icon-pencil table_icon edit_row"></i>-->\n\
                <i class="icon-edit-logs table_icon open_row"></i>\n\
                <i class="icon-history table_icon history_row"></i>\n\
            </td>\n\
        </tr>';
        $('#cargo_table tbody').append(appendStr);
    }
}