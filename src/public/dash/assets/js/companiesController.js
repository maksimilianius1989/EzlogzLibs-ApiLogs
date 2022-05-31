function companiesController(type, compArr){
    var self = this;
    this.type = type;
    this.box_id = '';
    this.saveAction = '';
    this.mainArr = compArr;
    this.main_table = '';
    this.section_name = '';
    this.delete_action  = '123';
    this.createSerialAction = '';
    if(type == 'broker'){
        this.box_id = 'one_broker_box';
        this.saveAction = 'saveBroker';
        this.main_table = 'brokers_table';
        this.section_name = 'manage_brokers';
        this.delete_action = 'deleteBroker';
    }else if(type == 'shipper'){
        this.box_id = 'one_shipper_box';
        this.saveAction = 'saveShipper';
        this.main_table = 'shippers_table';
        this.section_name = 'manage_shippers';
        this.delete_action = 'deleteShipper';
        this.createSerialAction = 'createShipperSerial';
    }else if(type == 'carrier'){
        this.box_id = 'one_carrier_box';
        this.saveAction = 'saveCarrier';
        this.main_table = 'carriers_table';
        this.section_name = 'manage_carriers';
        this.delete_action = 'deleteCarrier';
    }
    this.stest = function(){
        
    }
    this.callback = '';
    this.setCallback = function(callback){
        this.callback = callback;
    }
    $('body').on('click', '#'+self.box_id+' .save_edit', function(){self.saveEdits();});
    $('body').on('click', '#'+self.section_name+' tr[data-id]', function(){self.emptyParams();self.editRow(this);});
    $('body').on('click', '#'+self.section_name+' .open_row', function(e){e.stopPropagation();self.emptyParams();self.openRow(this);});
    $('body').on('click', '#'+self.section_name+' .send_link', function(e){e.stopPropagation();self.createSerial(this);});
    $('body').on('click', '#'+self.section_name+' .delete_row', function(e){e.stopPropagation();self.deleteRowAlert(this);});
    $('body').on('click', '.mes .fa-times', function(){$(this).parent().remove();});
    this.createSerial = function(but){
        var id = $(but).closest('tr').attr('data-id');
        data = {
            data:{
                action:self.createSerialAction, 
                id:id
            }
        };
        $.ajax({
            url:MAIN_LINK+'/db/dispatchController/' + '?' + window.location.search.substring(1),
            method:"POST",
            contentType: "application/json", // send as JSON
            data:JSON.stringify(data),
            success: function(data){
                var response = jQuery.parseJSON(data);
                if(response.code == '000'){
                    if(response.data.exist == '0') {
                        $('body').find('#manage_shippers').before('<div class="mes success">\n\
                                                                <i class="fa fa-envelope-o fa-2x" aria-hidden="true"></i>\n\
                                                                <span>Success!</span>\n\
                                                                <p>Link to the shipper has been created.</p>\n\
                                                                <!--<span class="st">'+response.data.serialKey+'</span>-->\n\
                                                                <!--<a href="#">Simpl Link</a>-->\n\
                                                                <i class="fa fa-times fa-2x" title="delete"></i>\n\
                                                               </div>');
                    } else {
                        $('body').find('#manage_shippers').before('<div class="mes warning">\n\
                                                                <i class="fa fa-envelope-o fa-2x" aria-hidden="true"></i>\n\
                                                                <span>Warning!</span>\n\
                                                                <p>Link to the shipper already exists.</p>\n\
                                                                <!--<a href="#">Test success link</a>-->\n\
                                                                <i class="fa fa-times fa-2x" title="delete"></i>\n\
                                                               </div>');
                    }
                }else{
                    $('body').find('#manage_shippers').before('<div class="mes error">\n\
                                                                <i class="fa fa-envelope-o fa-2x" aria-hidden="true"></i>\n\
                                                                <span>Error!</span>\n\
                                                                <p>Data base error.</p>\n\
                                                                <!--<a href="#">Test success link</a>-->\n\
                                                                <i class="fa fa-times fa-2x" title="delete"></i>\n\
                                                               </div>');
                }
            }
        });
    };
    this.emptyParams = function(){
        $('#'+self.box_id+' input[type=text],#one_broker_box input[type=hidden],#one_broker_box textarea').prop("readonly", false).removeClass('error').val('');
        $('#'+self.box_id+' .save_edit').show();
        $('#'+self.box_id+' input[type=checkbox]').prop("disabled", false).prop('checked', false);
    }
    this.show = function(){
        $('#'+self.box_id+' .box_header').text('Create ' + self.type);
        $('#'+self.box_id).show();
    }
    this.saveEdits = function(){
        var fields = {};
        var canSave = true;
        $('#'+self.box_id+' input[type=text],#'+self.box_id+' input[type=hidden],#'+self.box_id+' textarea').removeClass('error').each(function(){
            var value = $(this).val();
            var id = $(this).attr('id');
            var field = id.substring(5);
            fields[field] = value;
        })
        $('#'+self.box_id+' input[type=checkbox]').each(function(){
            var value =0;
            if($(this).is(":checked"))
            value = 1;
            var id = $(this).attr('id');
            var field = id.substring(5);
            fields[field] = value;
        })
        if(fields.name == ''){
            $('#edit_name').addClass('error');
            canSave = false;
        }
        if(fields.mc == ''){
            $('#edit_mc').addClass('error');
            canSave = false;
        }
        if(canSave){
            self.sendEdits(fields);
        }
    }
    this.sendEdits = function(fields){
        fields.action = self.saveAction;
        data = {data:fields};
        $.ajax({
            url:MAIN_LINK+'/db/dispatchController/' + '?' + window.location.search.substring(1),
            method:"POST",
            contentType: "application/json", // send as JSON
            data:JSON.stringify(data),
            success: function(data){
                var response = jQuery.parseJSON(data);
                if(response.code == '000'){
                    var broker = response.data;
                    var brokerId = broker.id;
                    var editBr = false;
                    $('#'+self.main_table+' tbody tr').each(function(){
                        if($(this).attr('data-id') == brokerId){
                            editBr = true;
                        }
                    });
                    
                    if(editBr){
                        self.editResult(broker, brokerId);
                    }else{
                        self.createItem(broker);
                    }
                    if(self.callback != '')
                    self.callback(response.data);
                    $('#'+self.box_id+' .save_edit_result').text('Saved');
                }else{
                    $('#'+self.box_id+' .save_edit_result').text(response.message);
                }
            }
        })
    }
    this.editResult = function(item, id){
        for(var x = 0; x< self.mainArr.length; x++){
            if(id == self.mainArr[x].id){
                self.mainArr[x] = item;
                break;
            }
        }
        var active = 'Active';
        if(item.active == 0){active = 'Not Active';}
        $('#'+self.main_table+' tbody tr').each(function(){
            var butSer = '';
            if(self.main_table == 'shippers_table'){
                butSer = '<i class="fa fa-envelope-o table_icon send_link" aria-hidden="true" title="send link"></i>';
            }
            if($(this).attr('data-id') == id){
                var appendStr = '<td>'+item.id+'</td>\n\
                    <td>'+item.name+'</td>\n\
                    <td>'+item.mc+'</td>\n\
                    <td>'+active+'</td>\n\
                    <td class="actions_col">\n\
                        <i class="icon-edit-logs table_icon open_row"></i>'+
                        butSer +
                        '<i class="icon-close table_icon delete_row"></i>\n\
                    </td>';
                $(this).empty().append(appendStr);
            }
        });
    }
    this.createItem = function(item){
        self.mainArr.push(item);
        var active = 'Active';
        var butSer = '';
        if(self.main_table == 'shippers_table'){
            butSer = '<i class="fa fa-envelope-o table_icon send_link" aria-hidden="true" title="send link"></i>';
        }
        if(item.active == 0){active = 'Not Active';}
        var appendStr = '<tr data-id="'+item.id+'">\n\
            <td>'+item.id+'</td>\n\
            <td>'+item.name+'</td>\n\
            <td>'+item.mc+'</td>\n\
            <td>'+active+'</td>\n\
            <td class="actions_col">\n\
                <i class="icon-edit-logs table_icon open_row"></i>'+butSer+
                '<i class="icon-close table_icon delete_row"></i>\n\
            </td>\n\
        </tr>';
        $('#'+self.main_table+' tbody').append(appendStr);
    }
    this.editRow = function(but){
        $('#'+self.box_id+' .box_header').text('Edit ' + self.type);
        var id = $(but).closest('tr').attr('data-id');
        var selectedBroker = {};
        for(var x = 0; x< self.mainArr.length; x++){
            var broker = self.mainArr[x];
            if(id == broker.id){
                selectedBroker = broker;
                break;
            }
        }
        self.fillParams(selectedBroker);
        $('#'+self.box_id+' .save_edit').show();
        $('#'+self.box_id).show();
        
    }
    this.openRow = function(but){
        $('#'+self.box_id+' .box_header').text(self.type + ' Info');
        var id = $(but).closest('tr').attr('data-id');
        var selectedBroker = {};
        for(var x = 0; x< self.mainArr.length; x++){
            var broker = self.mainArr[x];
            if(id == broker.id){
                selectedBroker = broker;
                break;
            }
        }
        self.fillParams(selectedBroker);
        $('#'+self.box_id+' input[type=text],#'+self.box_id+' input[type=hidden],#'+self.box_id+' textarea').prop("readonly", true);
        $('#'+self.box_id+' input[type=checkbox]').prop("disabled", true)
        $('#'+self.box_id+' .save_edit').hide();
        $('#'+self.box_id).show();
    }
    this.fillParams = function(broker){
        $('#'+self.box_id+' input[type=text],#'+self.box_id+' input[type=hidden],#'+self.box_id+' textarea').removeClass('error').each(function(){
            var id = $(this).attr('id');
            var field = id.substring(5);
            $(this).val(broker[field]);
        })
        $('#'+self.box_id+' input[type=checkbox]').each(function(){
            var id = $(this).attr('id');
            var field = id.substring(5);
            var value = broker[field];
            if(value == 0){
                $(this).prop('checked', false);
            }else{
                $(this).prop('checked', true);
            }
        })
    }
    this.deleteRowAlert = function(but){
        var id = $(but).closest('tr').attr('data-id');
        self.deleteRow(but);
    }
    this.deleteRow = function(but){
        var id = $(but).closest('tr').attr('data-id');
        data = {data:{action:self.delete_action, id:id}};
        $.ajax({
            url:MAIN_LINK+'/db/dispatchController/' + '?' + window.location.search.substring(1),
            method:"POST",
            contentType: "application/json", // send as JSON
            data:JSON.stringify(data),
            success: function(data){
                var response = jQuery.parseJSON(data);
                if(response.code == '000'){
                    $(but).closest('tr').remove();
                }else{
                    alert(response.message);
                }
            }
        })
    }
    
    
}