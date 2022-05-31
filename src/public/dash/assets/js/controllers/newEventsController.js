function newEventsController()
{
    var self = this;
    //ELD
    self.notRespondedNewOrders = 0;
    self.notRespondedDemoRequests = 0;
    //Returns
    self.countReturns = 0;
    //Refunds
    self.countNewRefunds = 0;
    //Support tickets
    self.countComplitedSupportTickets = 0;
    //Clients Tickets
    self.countNewClientsTickets = 0;
    //Suggestions
    self.countSuggestions = 0
    
    self.isJson = function(str) {
        try {
            JSON.parse(str);
        } catch (e) {
            return false;
        }
        return true;
    }
    
    self.checkNewELDEvents = function() {
        AjaxController('checkNewELDEvents', {}, adminUrl, self.newELDEvents, errorBasicHandler, true);
    }

    self.newELDEvents = function (response) {
        //ELD
        $('li[data-tabname="eld"] a').html('<span class="menu-icon ezicon-ELD"></span><span class="menu-text">ELD</span>');
        $('a[href="/dash/eld_orders/"]').text('Orders');
        $('a[href="/dash/eld_demo/"]').text('Demo');
        //Returns
        $('li[data-tabname="returns"] a').html('<span class="menu-icon ezicon-Returns"></span><span class="menu-text">Returns</span>');
        //Refunds
        $('li[data-tabname="finances"] a').html('<span class="menu-icon ezicon-Finances"></span><span class="menu-text">Finances</span>');
        $('a[href="/dash/finances/admin_finances_refunds/"]').text('REFUNDS');
        //Support tickets
        $('li[data-tabname="support"] a').text('Support Management');
        //Suggestions
        $('li[data-tabname="site_manage"] a').html('<span class="menu-icon ezicon-Site-management"></span><span class="menu-text">Site Management</span>');
        c(response);
        var data;
        if(self.isJson(response.data)){
            data = jQuery.parseJSON(response.data);
        } else {
            data = response.data;
        }
        //ELD
        var total = data.notRespondedDemoRequests + data.notRespondedNewOrders;
        if(total > 0){
            $('li[data-tabname="eld"] a').html('<span class="menu-icon ezicon-ELD"></span><span class="menu-text">ELD</span><span class="countMes">'+abbreviateNumber(total)+'</span>');
        }
        if(data.notRespondedNewOrders > 0){
            $('a[href="/dash/eld_orders/"]').html('Orders<span class="countMes">'+abbreviateNumber(data.notRespondedNewOrders)+'</span>');
        }
        if(data.notRespondedDemoRequests > 0){
            $('a[href="/dash/eld_demo/"]').html('Demo<span class="countMes">'+abbreviateNumber(data.notRespondedDemoRequests)+'</span>');
        }
        //Refunds
        if(data.countNewRefunds > 0){
            $('li[data-tabname="finances"] a').html('<span class="menu-icon ezicon-Finances"></span><span class="menu-text">Finances</span><span class="countMes">'+abbreviateNumber(data.countNewRefunds)+'</span>');
            $('a[href="/dash/finances/admin_finances_refunds/"]').html('REFUNDS<span class="countMes">'+abbreviateNumber(data.countNewRefunds)+'</span>');
        }
        //Returns
        if(data.countReturns > 0){
            $('li[data-tabname="returns"] a').html('<span class="menu-icon ezicon-Returns"></span><span class="menu-text">Returns</span><span class="countMes">'+abbreviateNumber(data.countReturns)+'</span>');
        }
        //Support tickets
        if(data.countComplitedSupportTickets > 0){
            $('li[data-tabname="support_chats"] a').html('<span class="menu-icon ezicon-Support-client-ticket"></span><span class="menu-text">Client Support</span><span class="countMes">'+abbreviateNumber(data.countComplitedSupportTickets)+'</span>');
        }
        //Suggestions
        if(data.countSuggestions > 0){
            $('li[data-tabname="site_manage"] a').html('<span class="menu-icon ezicon-Support-management"></span><span class="menu-text">Site Management</span><span class="countMes">'+abbreviateNumber(data.countSuggestions)+'</span>');
        }
    }
    
    self.checkNewClientTickets = function () {
        AjaxController('checkNewClientTickets', {}, '/db/api/apiClientSupportTickets.php', self.newClientTickets, errorBasicHandler, true);
    }
    
    self.newClientTickets = function (response) {
        var data;
        if(self.isJson(response.data.result)){
            data = jQuery.parseJSON(response.data.result);
        } else {
            data = response.data.result;
        }
        $('li[data-tabname="support_chats"] a').html('<span class="menu-icon ezicon-Support-client-ticket"></span><span class="menu-text">Client Support</span><span class="countMes">'+abbreviateNumber(data.total)+'</span>');
        if(data.total > 0){
            $('li[data-tabname="support_chats"] a').html('<span class="menu-icon ezicon-Support-client-ticket"></span><span class="menu-text">Client Support</span><span class="countMes">'+abbreviateNumber(data.total)+'</span>');
        }
    }
    
    self.addNewClientTicketsInTable = function (response) {
        var data;
        if(self.isJson(response.data)){
            data = jQuery.parseJSON(response.data);
        } else {
            data = response.data;
        }
        if(window.location.pathname == '/dash/support_client_tickets/'){
            var ticket = $('#new_c_tickets .table tbody tr[data-id="'+data.ticket.id+'"]').length;
            if(ticket == 0){
                ManagerClientsTicketsC.globalClientTickets[data.ticket.id] = data.ticket;
                $('#clientTickets tbody tr[data-id="' + data.ticket.id + '"]').replaceWith(ManagerClientsTicketsC.showMyClientTicketsInTable(data.ticket));
            }
        }
    }
    
    self.removeNewClientTicketsInTable = function (response) {
        var data;
        if(self.isJson(response.data)){
            data = jQuery.parseJSON(response.data);
        } else {
            data = response.data;
        }
        if(window.location.pathname == '/dash/support_client_tickets/'){
//            $('#new_c_tickets .table tbody tr[data-id="'+data.ticket.id+'"]').remove();
//            $('#tickets .table tbody').append(ManagerClientsTicketsC.showMyClientTicketsInTable(data.ticket));
            ManagerClientsTicketsC.globalClientTickets[data.ticket.id] = data.ticket;
            $('#clientTickets tbody tr[data-id="' + data.ticket.id + '"]').replaceWith(ManagerClientsTicketsC.showMyClientTicketsInTable(data.ticket));
        }
    }
    
}

newEventsC = new newEventsController();