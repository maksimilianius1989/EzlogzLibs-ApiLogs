function ClientsTicketsController()
{
    var self = this;

    self.apiUrl = '/db/api/apiClientSupportTickets.php';
    self.allClientTicketsPagination = false;

    self.userRole = getCookie('role');
    self.dashboard = getCookie('dashboard') != '' ? getCookie('dashboard') : 'fleet';
    self.globalClientTickets = {};

    self.ajaxProcess = false;

    self.clientInit = function () {//use
        self.allClientTicketsPagination = new simplePaginator({
            tableId: 'clientTickets',
            request: 'getAllClientSupportTicketsPagination',
            requestUrl: self.apiUrl,
            handler: self.getAllClientSupportTicketsPaginationHandler,
            perPageList: [25, 50, 100],
            additionalData: {
                userType: 'dispatcher'
            }
        });
    }

    self.getAllClientSupportTicketsPaginationHandler = function (response, tableId) {
        c('getAllClientSupportTicketsPaginationHandler');
        c(response);

        var body = $('#' + tableId).find('tbody')
        body.empty();

        $.each(response.data.result, function (key, row) {
            self.globalClientTickets[row.id] = row;
            body.append(self.showClientTicketsInTable(row));
        });
    }
    
    self.getCreateClientSupportTicketPopupInfo = function (additionalData = {}) {//use
        if (!self.ajaxProcess) {
            self.ajaxProcess = true;
            var data = {};
            data.additionalData = additionalData;
            if (self.userRole == 1 && self.dashboard == 'fleet') {
                data.userType = 'dispatcher';
            }
            var params = {};
            params.action = 'getCreateClientSupportTicketPopupInfo';
            params.data = data;
            params.url = self.apiUrl;
            params.successHandler = self.getCreateClientSupportTicketPopupInfoHandler;
            AjaxCall(params);
        }
        setTimeout(function () {
            self.ajaxProcess = false;
        }, 1000);
    }
    self.getCreateClientSupportTicketPopupInfoHandler = function (response) {
        c('getCreateClientSupportTicketPopupInfoHandler');
        c(response);
        self.ajaxProcess = false;
        if (response.code == '000') {
            var data = response.data.result;
            
            c(data);

            var userText = `<div class="col-lg-8"><div class="form-group"><input type="text" data-id="${data.userId}" value="${data.userInfo.name} ${data.userInfo.last}(${data.userInfo.email})" class="ez_input user" placeholder="User" readonly /></div></div>`;
            if (self.userRole == 1 && self.dashboard == 'fleet') {
                userText = `<div class="col-lg-8"><div class="form-group"><select class="user" onchange="ClientsTicketsC.changeUserInCreateTicket(this);">
                                <option value="${data.userId}" selected>It's you: ${data.userInfo.name} ${data.userInfo.last}(${data.userInfo.email})</option>`;
                $.each(data.users, function () {
                    userText += `<option value="${this.id}" >${this.name} ${this.last}(${this.email})</option>`;
                });
                userText += `</select></div></div>`;
            }
            //include equipments
            var equpmentText = `<div class="col-lg-8"><div class="form-group"><select id="equipment">
                            <option value="" selected>Select equipment</option>`;
            $.each(data.equipments, function () {
                var vin = this.VIN == null ? '' : '(' + this.VIN + ')';
                equpmentText += `<option value="${this.id}">${this.Name} ${vin}</option>`;
            });
            equpmentText += `</select></div></div>`;
            equpmentText += `<div class="col-lg-4"><div class="form-group"><input type="text" class="ez_input version" placeholder="Version"/></div></div>`

            //include orders
            var orderText = `<div class="col-lg-6"><div class="form-group"><select id="order">
                            <option value="" selected>Select order</option>`;
            $.each(data.orders, function () {
                orderText += `<option value="${this.id}">Order № ${this.id}</option>`;
            });
            orderText += `</select></div></div>`;

            //include payments
            var paymentText = `<div class="col-lg-6"><div class="form-group"><select id="payment">
                            <option value="" selected>Select payment</option>`;
            $.each(data.payments, function () {
                paymentText += `<option value="${this.id}">${this.data} (${this.amount})</option>`;
            });
            paymentText += `</select></div></div>`;

            //include charges
            var chargeText = `<div class="col-lg-6"><div class="form-group"><select id="charge">
                            <option value="" selected>Select charge</option>`;
            $.each(data.charges, function () {
                chargeText += `<option value="${this.id}">${this.dateTime} ${this.description} (${this.amount})</option>`;
            });
            chargeText += `</select></div></div>`;

            var contentByType = `
                        <div data-type="23" class="content_by_type" style="display: none;">
                            ${equpmentText}
                        </div>
                        <div data-type="4" class="content_by_type" style="display: none;">
                            ${orderText}
                        </div>
                        <div data-type="5" class="content_by_type" style="display: none;">
                            ${paymentText}
                        </div>
                        <div data-type="6" class="content_by_type" style="display: none;">
                            ${chargeText}
                        </div>
                        `;

            var content = '<div class="row">';

            content += `<div class="col-lg-12">
                            <div class="form-group">
                                <input type="text" class="ez_input name" placeholder="Subject"/>
                            </div>
                        </div>`;
            content += `` + userText;
            content += `<div class="col-lg-4"><div class="form-group"><select id="type" onchange="ClientsTicketsC.changeClientTicketTypeInCreateModal(this);">
                            <option value="" selected>Select type</option>
                            <option value="1">Website</option>
                            <option value="2">Android</option>
                            <option value="3">iOS</option>
                            <option value="4">Order</option>
                            <option value="5">Payment</option>
                            <option value="6">Charge</option>
                        </select></div></div>`;
            content += `${contentByType}
                        <div class="col-lg-12"><div class="form-group"><textarea class="ez_input description" placeholder="Task Description"></textarea></div></div>
                        <div class="col-lg-12"><button class="btn btn-default create_task_button" onclick="ClientsTicketsC.createClientSupportTicket();">Create</button>
                        <button class="btn btn-default file_upload">Add file</button>
                        <input type="file" accept="*" id="file-upload-task"></div>
                        <div class="col-lg-12 uploadBox"></div>`;
            content += `</div>`;
            var head = 'Create Ticket';
            showModal(head, content, 'create_cliend_ticket', 'create_cliend_ticket');
            
            if (typeof data.additionalData != 'undefined') {
                switch (data.additionalData.type) {
                    case 'supportChat':
                        createSupportTicket(data.additionalData.chatId);
                        break;
                    case 'emailRequest':
                        var task;
                        $.each(SupportManagerC.tasks, function (key, taskInfo) {
                            if (taskInfo.id == data.additionalData.taskId) {
                                task = taskInfo;
                            }
                        });
                        var totalMsg = '';
                        $.each(task.history, function (key, historyItem) {
                            totalMsg += JSON.parse(historyItem.description).message + '\n';
                        });
                        $('#create_cliend_ticket .name').val(task.name);
                        $('#create_cliend_ticket .description').val(totalMsg);
                        break;
                }
            }
        }
    }
    self.getUploadFile = function (input) {//use
        if (input.files && input.files[0]) {
            if (input.files[0].size > 100000000) {
                return false;
            }
            var file = input.files[0],
            reader = new FileReader();
            var updateTask = $('#create_cliend_ticket').is(':visible') ? '' : '_updateTask';
            if (input.files[0].type.includes("image")) {
                reader.onload = function (e) {
                    $('.uploadBox' + updateTask).append('<div class="uploadImg' + updateTask + '">\n\
                    <button class="btn btn-default deleteFile">X</button>\n\
                    <img src="" alt="image"></div>');
                    $('.uploadImg' + updateTask).last().css('display', 'inline-block');
                    $('.uploadImg' + updateTask + ' img').last().attr('src', e.target.result);
                    $('.uploadImg' + updateTask + ' img').last().attr('data-filename', file.name);
                    $("#file-upload-task").val('');
                }
            } else if (input.files[0].type.includes("video")) {
                reader.onload = function (e) {
                    $('.uploadBox' + updateTask).append('<div class="uploadVideo' + updateTask + '"> \n\
                    <button class="btn btn-default deleteFile">X</button>\n\
                    <video controls></video></div>');
                    $('.uploadVideo' + updateTask).last().css('display', 'inline-block');
                    $(".uploadVideo" + updateTask + " video").last().append('<source src="' + e.target.result + '" type="' + input.files[0].type + '">');
                    $(".uploadVideo" + updateTask + " source").last().attr('data-filename', file.name);
                    $("#file-upload-task").val('');
                }
            } else {
                reader.onload = function (e) {
                    $('.uploadBox' + updateTask).append('<div class="uploadFile' + updateTask + '">\n\
                    <button class="btn btn-default deleteFile">X</button>\n\
                    <p src=""></p></div>');
                    $('.uploadFile' + updateTask + ' p').last().attr('src', e.target.result);
                    $('.uploadFile' + updateTask + ' p').last().attr('data-filename', file.name).text(file.name);
                    $("#file-upload-task").val('');
                }
            }
            reader.readAsDataURL(input.files[0]);
        }
    }
    self.createClientSupportTicket = function () {//use
        $('#create_cliend_ticket select, #create_cliend_ticket input, #create_cliend_ticket textarea').removeClass('inpurError');

        var name = $('#create_cliend_ticket input.name').val().trim(),
                type = $('#type').val(),
                message = $('#create_cliend_ticket .description').val().trim(),
                attachmentsInfo = [];

        if (name == '' || type == 0 || message == '') {
            name == '' ? $('#create_cliend_ticket input.name').addClass('inpurError') : '';
            type == 0 ? $('#type').addClass('inpurError') : '';
            message == '' ? $('#create_cliend_ticket .description').addClass('inpurError') : '';
            return false;
        }

        $('.uploadImg img').each(function () {
            var info = {};
            info.img = $(this).attr('src');
            info.imgName = $(this).attr('data-filename');
            attachmentsInfo.push(info);
        });
        $('.uploadVideo source').each(function () {
            var info = {};

            var canvas = document.createElement("canvas"),
                    ctx = canvas.getContext("2d"),
                    img = new Image();
            ctx.drawImage($(this).parent()[0], 0, 0, $(this).parent()[0].videoWidth, $(this).parent()[0].videoHeight);
            img.src = canvas.toDataURL();
            var videoPreview = canvas.toDataURL();

            info.video = $(this).attr('src');
            info.videoName = $(this).attr('data-filename');
            info.duration = $(this).parent()[0].duration;

            info.videoPreview = videoPreview;

            attachmentsInfo.push(info);
        });
        $('.uploadFile p').each(function () {
            var info = {};
            info.file = $(this).attr('src');
            info.fileName = $(this).attr('data-filename');
            attachmentsInfo.push(info);
        });
        var description = {
            message: self.escapeHtml(message),
            attachments: attachmentsInfo
        };

        var data = {message: JSON.stringify(description), name: name, type: type};

        if (type == 2 || type == 3) {//Android, iOS
            var equipment = $('#equipment').val(),
                    version = $('#create_cliend_ticket input.version').val().trim();

            if (version == '') {
                $('#create_cliend_ticket input.version').addClass('inpurError');
                return false;
            }

            data.equipmentId = equipment;
            data.version = version;
        } else if (type == 4) {//Order
            var orderId = $('#create_cliend_ticket #order').val();

            if (orderId == '') {
                $('#create_cliend_ticket #order').addClass('inpurError');
                return false;
            }

            data.orderId = orderId;
        } else if (type == 5) {//Payment
            var paymentId = $('#create_cliend_ticket #payment').val();

            if (paymentId == '') {
                $('#create_cliend_ticket #payment').addClass('inpurError');
                return false;
            }

            data.paymentId = paymentId;
        } else if (type == 6) {//Charge
            var chargeId = $('#create_cliend_ticket #charge').val();

            if (chargeId == '') {
                $('#create_cliend_ticket #charge').addClass('inpurError');
                return false;
            }

            data.chargeId = chargeId;
        }

        if (self.userRole == 1 && self.dashboard == 'fleet') {
            data.userId = $('#create_cliend_ticket .user').val();
        }

        $('.create_task_button').prop("disabled", true);
        
        var params = {};
        params.action = 'createClientSupportTicket';
        params.data = data;
        params.url = self.apiUrl;
        params.successHandler = self.createClientSupportTicketHandler;
        AjaxCall(params);
    }
    self.createClientSupportTicketHandler = function (response) {
        c('createClientSupportTicketHandler');
        c(response);
        if (response.code == '000') {
            $('#create_cliend_ticket button.close').click();
            self.allClientTicketsPagination.request();
        }
    }
    self.updateClientSupportTicket = function () {//use
        $('.task_result').removeClass('error').text('');
        var ticketId = $('.client_ticket_card input.ticketId').val(),
                name = $('.client_ticket_card input.name').val().trim(),
                type = $('#showTicketType').val(),
                message = $('#new_comment').val().trim(),
                attachmentsInfo = [];
        if (name == '' || message == '') {
            name == '' ? $('#create_cliend_ticket input.name').addClass('inpurError') : '';
            message == '' ? $('#new_comment').addClass('inpurError') : '';
            return false;
        }
        $('.uploadImg_updateTask img').each(function () {
            var info = {};
            info.img = $(this).attr('src');
            info.imgName = $(this).attr('data-filename');
            attachmentsInfo.push(info);
        });
        $('.uploadVideo_updateTask source').each(function () {
            var info = {};

            var canvas = document.createElement("canvas"),
                    ctx = canvas.getContext("2d"),
                    img = new Image();
            ctx.drawImage($(this).parent()[0], 0, 0, $(this).parent()[0].videoWidth, $(this).parent()[0].videoHeight);
            img.src = canvas.toDataURL();
            var videoPreview = canvas.toDataURL();
            c(videoPreview);

            info.video = $(this).attr('src');
            info.videoName = $(this).attr('data-filename');
            info.duration = $(this).parent()[0].duration;

            info.videoPreview = videoPreview;

            attachmentsInfo.push(info);
        });
        $('.uploadFile_updateTask p').each(function () {
            var info = {};
            info.file = $(this).attr('src');
            info.fileName = $(this).attr('data-filename');
            attachmentsInfo.push(info);
        });
        var description = {
            message: self.escapeHtml(message),
            attachments: attachmentsInfo
        };
        var data = {ticketId: ticketId, message: JSON.stringify(description), name: name, type: type, equipmentId: equipment, version: version};

        if (type == 2 || type == 3) {//Android, iOS
            var equipment = $('#showTicketEquipment').val(),
                    version = $('.client_ticket_card input.version').val().trim();

            if (version == '') {
                $('.client_ticket_card input.version').addClass('inpurError');
                return false;
            }

            data.equipmentId = equipment;
            data.version = version;
        } else if (type == 4) {//Order
            var orderId = $('#showTicketOrder').val();

            if (orderId == '') {
                $('#showTicketOrder').addClass('inpurError');
                return false;
            }

            data.orderId = orderId;
        } else if (type == 5) {//Payment
            var paymentId = $('#showTicketPayment').val();

            if (paymentId == '') {
                $('#showTicketPayment').addClass('inpurError');
                return false;
            }

            data.paymentId = paymentId;
        } else if (type == 6) {//Charge
            var chargeId = $('#showTicketCharge').val();

            if (chargeId == '') {
                $('#showTicketCharge').addClass('inpurError');
                return false;
            }

            data.chargeId = chargeId;
        }

        if (self.userRole == 1 && self.dashboard == 'fleet') {
            data.userId = $('.client_ticket_card .user').val();
        }

        var ticket;
        if (self.globalClientTickets.hasOwnProperty(ticketId)) {
            ticket = self.globalClientTickets[ticketId];
        } else {
            return false;
        }

        if (ticket.name == name && description.message.trim() == '' && description.attachments.length == 0) {
            return false;
        }

        $('.close_edit.remove').click();
        
        var params = {};
        params.action = 'updateClientSupportTicket';
        params.data = data;
        params.url = self.apiUrl;
        params.successHandler = self.updateClientSupportTicketHandler;
        AjaxCall(params);
    }
    self.updateClientSupportTicketHandler = function (response) {
        c(response);
        if (response.code == '000') {
            var data = response.data.result;
            delete self.globalClientTickets[data.id];
            self.globalClientTickets[data.id] = data;
            $('#clientTickets tbody tr[data-id="' + data.id + '"]').replaceWith(self.showClientTicketsInTable(data));
        }
    }
    self.fixedClientSupportTicket = function (fixed) {//use
        c(fixed);
        var ticketId = $('.client_ticket_card input.ticketId').val();
        var data = {ticketId: ticketId, fixed: fixed};
        $('.close_edit.remove').click();
        var params = {};
        params.action = 'fixedClientSupportTicket';
        params.data = data;
        params.url = self.apiUrl;
        params.successHandler = self.fixedClientSupportTicketHandler;
        AjaxCall(params);
    }
    self.fixedClientSupportTicketHandler = function (response) {
        c(response);
        if (response.code == '000') {
            var data = response.data.result;
            delete self.globalClientTickets[data.id];
            self.globalClientTickets[data.id] = data;
            $('#clientTickets tbody tr[data-id="' + data.id + '"]').replaceWith(self.showClientTicketsInTable(data));
            $('#client_ticket_card').remove();
        }
    }
    self.showClientTicketsInTable = function (data) {//use
        c(data);
        var infoText = '';
        if (data.type == 1) {
            infoText = 'none';
        } else if (data.type == 2 || data.type == 3) {
            infoText = `${data.equipmentInfo.Name}${data.equipmentInfo.VIN == null ? '' : '(' + data.equipmentInfo.VIN + ')'}`;
        } else if (data.type == 4) {
            infoText = `Order № ${data.orderId}`;
        } else if (data.type == 5) {
            infoText = `${data.paymentInfo.data} (${data.paymentInfo.amount})`;
        } else if (data.type == 6) {
            infoText = `${data.chargeInfo.dateTime} ${data.chargeInfo.description} (${data.chargeInfo.amount})`;
        }
        var companyText = data.companyId == '' ? '' : `${data.companyInfo.name}(${data.companyInfo.usdot})`;
        var tableBody = `<tr data-id="${data.id}" onclick="ClientsTicketsC.showClientTicketsCard(this);">
            <td>${data.id}</td>
            <td class="name">${data.name}</td>
            <td class="date">${convertDateToUSA(data.ticketDate, true)}</td>
            <td class="type" data-type="${data.type}">${self.getPlatfornById(data.type)}</td>
            <td class="company">${companyText}</td>
            <td class="user">${data.userInfo.name} ${data.userInfo.last}(${data.userInfo.email})</td>
            <!--<td>${infoText}</td>-->
            <!--<td class="version">${data.version}</td>-->
            <td class="status" data-status="${data.status}">${self.getStatusById(data.status)}</td>
        </tr>`;
        return tableBody;
    }
    self.showClientTicketsCard = function (el) {//use
        var ticket;
        if (self.globalClientTickets.hasOwnProperty($(el).attr('data-id'))) {
            ticket = self.globalClientTickets[$(el).attr('data-id')];
        } else {
            return false;
        }

        var head = `TICKET №` + ticket.id;

        var update = false;
        if (getCookie('userId') == ticket.creatorId) {
            update = true;
        }

        var userText = `<input type="text" value="${ticket.userInfo.name + ' ' + ticket.userInfo.name + '(' + ticket.userInfo.email + ')'}" class="user" placeholder="Name" readonly /></br>`;
        if (self.userRole == 1 && self.dashboard == 'fleet') {
            userText = `<select class="user" onchange="ClientsTicketsC.changeUserInUpdateTicket(this);">
                            <option value="${ticket.userId}" selected>${ticket.userInfo.name + ' ' + ticket.userInfo.name + '(' + ticket.userInfo.email + ')'}</option>
                        </select>`;
        }

        //include equipment
        var equipmentText = `<div class="form-group">
                                <div class="col-lg-8">
                                    <label>Equipment</label>
                                    <select id="showTicketEquipment">`;
        equipmentText += ticket.equipmentId == '' ? '<option value="" selected>Select equipment</option>' : `<option value="">Select equipment</option><option value="${ticket.equipmentId}" selected>${ticket.equipmentInfo.Name}${ticket.equipmentInfo.VIN == null ? '' : '(' + ticket.equipmentInfo.VIN + ')'}</option>`;
        equipmentText += `</select>
                        </div>
                        <div class="col-lg-4">
                            <label>Version</label>
                            <input type="text" value="${ticket.version}" class="version" placeholder="Version">
                        </div>
                    </div>`;

        //include order
        var orderText = `<div class="form-group">
                            <div class="col-lg-6">
                                <label>Order</label>
                                <select id="showTicketOrder">`;
        orderText += ticket.orderId == '' ? '<option value="" selected>Select order</option>' : `<option value="">Select order</option><option value="${ticket.orderId}" selected>Order № ${ticket.orderId}</option>`;
        orderText += `</select></div></div>`;

        //include payment
        var paymentText = `<div class="form-group">
                                <div class="col-lg-6">
                                    <label>Payment</label>
                                    <select id="showTicketPayment">`;
        paymentText += ticket.paymentId == '' ? '<option value="" selected>Select payment</option>' : `<option value="">Select payment</option><option value="${ticket.paymentId}" selected>${ticket.paymentInfo.data} (${ticket.paymentInfo.amount})</option>`;
        paymentText += `</select></div></div>`;

        //include charge
        var chargeText = `<div class="form-group">
                            <div class="col-lg-6">
                                <label>Charge</label>
                                <select id="showTicketCharge">`;
        chargeText += ticket.chargeId == '' ? '<option value="" selected>Select charge</option>' : `<option value="">Select charge</option><option value="${ticket.chargeId}" selected>${ticket.chargeInfo.dateTime} ${ticket.chargeInfo.description} (${ticket.chargeInfo.amount})</option>`;
        chargeText += `</select></div></div>`;

        var contentByType = `
            <div data-type="23" class="content_by_type" ${ticket.type == 2 || ticket.type == 3 ? `style="display:block;"` : ''}>
                ${equipmentText}
            </div>
            <div data-type="4" class="content_by_type" ${ticket.type == 4 ? `style="display:block;"` : ''}>
                ${orderText}
            </div>
            <div data-type="5" class="content_by_type" ${ticket.type == 5 ? `style="display:block;"` : ''}>
                ${paymentText}
            </div>
            <div data-type="6" class="content_by_type" ${ticket.type == 6 ? `style="display:block;"` : ''}>
                ${chargeText}
            </div>
            `;

        var history = ticket.ticketHistory;

        var historyText = '';

        var lastMessage = '';

        $.each(history, function (key, historyItem) {
            var whoData = JSON.parse(historyItem.whoData);
            var historyData = JSON.parse(historyItem.historyData);
            var message = JSON.parse(historyItem.message);
            var attachmentText = '';
            if (typeof message.attachments !== 'undefined' && message.attachments.length > 0) {
                var attachments = message.attachments;
                attachmentText += 'Attachment: <div class = "attachmentsBox">';
                for (var i = 0, lenI = attachments.length; i < lenI; i++) {
                    if (attachments[i].img) {
                        attachmentText += '<a data-popup="img" onclick="employeeTaskC.attachmentPopup(this)" href="javascript:;"><img class = "attachmentImg" src = "' + MAIN_LINK + attachments[i].img + '" alt = "attachment"></a>';
                    } else if (attachments[i].video) {
                        attachmentText += '<div class = "videoBox"><a data-popup="source" href="javascript:;" onclick="attachmentPopup(this)"><video class = "attachmentVideo" controls><source src = "' + MAIN_LINK + attachments[i].video + '"></source></video></a></div>';
                    } else {
                        var fileNameIndex = attachments[i].file.lastIndexOf("/") + 1;
                        var filename = attachments[i].file.substr(fileNameIndex);
                        attachmentText += '<a href = "' + MAIN_LINK + attachments[i].file + '" target="_blank" src = "' + MAIN_LINK + attachments[i].file + '" alt = "attachment">' + filename + '</a>';
                    }
                }
            }
            var fixedText = ``;
            if (historyData.fixed == 1) {
                fixedText = `<span><b style="color:green;"> (Problem fixed)</b></span>`;
            } else if (historyData.fixed == 2) {
                fixedText = `<span><b style="color:red;"> (Problem not fixed)</b></span>`;
            }
            historyText += `<div class="col-lg-12 one-history">
                                <span>Initiator: ${whoData.name} ${whoData.last}(${convertDateToUSA(historyItem.ticketDate)})</span></br>
                                <span>Status: <b>${self.getStatusById(historyData.status)}</b></span>${fixedText}</br>
                                <span>Message: </br>${message.message}</span></br>
                                ${attachmentText}
                            </div>`;
            if (key == 0) {
                lastMessage = message.message;
            }
        });

        var contentByStatus = `<div class="col-lg-12"><div class="form-group"><textarea id="new_comment" placeholder="Add comment here"></textarea></div></div>
                    <div class="col-lg-12"><button class="btn btn-default update_task" onclick="ClientsTicketsC.updateClientSupportTicket();">Update</button>
                    <button class="btn btn-default file_upload">Add file</button></div>`;
        if (ticket.status == 2 && ticket.fixed == 0) {
            contentByStatus = `
                <div>
                    <p>${lastMessage}</p>
                    <p>Has your problem been resolved?</p>
                    <button class="btn btn-default" onclick="ClientsTicketsC.fixedClientSupportTicket(1);">Close Case</button>
                    <button class="btn btn-default" onclick="ClientsTicketsC.fixedClientSupportTicket(2);">Reply</button>
                </div>`;
        }

        var content = `<div class="form-horizontal"><input type="hidden" value="${ticket.id}" class="ticketId" readonly>
                    <div class="form-group">
                        <div class="col-sm-12">
                            <label>Ticket name</label>
                            <input type="text" value="${ticket.name}" class="name" placeholder="Name" ${update ? '' : 'readonly'} />
                        </div>
                    </div>
                    <div class="form-group">
                        <div class="col-lg-8">
                                <label>User</label>
                                ${userText}
                        </div>
                        <div class="col-lg-4">
                            <label>Type</label>
                            <select id="showTicketType" onchange="ClientsTicketsC.changeClientTicketTypeInUpdateModal(this);">
                                <option value="1" ${ticket.type == 1 ? 'selected' : ''}>Website</option>
                                <option value="2" ${ticket.type == 2 ? 'selected' : ''}>Android</option>
                                <option value="3" ${ticket.type == 3 ? 'selected' : ''}>iOS</option>
                                <option value="4" ${ticket.type == 4 ? 'selected' : ''}>Order</option>
                                <option value="5" ${ticket.type == 5 ? 'selected' : ''}>Payment</option>
                                <option value="6" ${ticket.type == 6 ? 'selected' : ''}>Charge</option>
                            </select>
                        </div>
                    </div>
                    ${contentByType}
                    ${contentByStatus}
                    <input type="file" accept="*" id="file-upload-task">
                    <div class="uploadBox_updateTask" style="float:left;overflow: hidden;margin-top: 20px;"></div>
                    <div class="col-lg-12" id="history_box">
                        ${historyText}
                    </div>
                    </div>`;
        showModal(head, content, 'client_ticket_card', 'modal-lg client_ticket_card');
        if (self.userRole == 1 && self.dashboard == 'fleet') {
            self.getDriversByFleet(ClientsTicketsC.addUsersToUpdateSelectFleet);
            self.getEquipmentsByUserId(ClientsTicketsC.addEquipmentToUpdateSelectDriver, {}, ticket.userId);
        } else {
            self.getEquipmentsByUserId(ClientsTicketsC.addEquipmentToUpdateSelectDriver);
        }
        c(ticket);
    }
    self.addUsersToUpdateSelectFleet = function (response) {//use
        c(response);
        if (response.code == '000') {
            var data = response.data.result;
            $.each(data.users, function () {
                var userId = $('.client_ticket_card .user').val();
                if (userId != this.id) {
                    $('.client_ticket_card .user').append(`<option value="${this.id}">${this.name + ' ' + this.name + '(' + this.email + ')'}</option>`);
                }
            });
        }
    }
    self.addEquipmentToUpdateSelectFleet = function (response) {//use
        c(response);
        if (response.code == '000') {
            var data = response.data;
            $.each(data.equipments, function () {
                $('#showTicketEquipment').append(`<option value="${this.id}">${this.Name}${this.VIN == null ? '' : '(' + this.VIN + ')'}</option>`);
            });
            $.each(data.orders, function () {
                $('#showTicketOrder').append(`<option value="${this.id}">Order № ${this.id}</option>`);
            });
            $.each(data.payments, function () {
                $('#showTicketPayment').append(`<option value="${this.id}">${this.data} (${this.amount})</option>`);
            });
            $.each(data.charges, function () {
                $('#showTicketCharge').append(`<option value="${this.id}">${this.dateTime}${this.description} (${this.amount})</option>`);
            });
        }
    }
    self.addEquipmentToUpdateSelectDriver = function (response) {//use
        c(response);
        if (response.code == '000') {
            var data = response.data.result;
            if (data.equipments.length > 0) {
                $.each(data.equipments, function () {
                    var eqId = $('#showTicketEquipment').val();
                    if (eqId != this.id) {
                        $('#showTicketEquipment').append(`<option value="${this.id}">${this.Name}${this.VIN == null ? '' : '(' + this.VIN + ')'}</option>`);
                    }
                });
            }
            if (data.orders.length > 0) {
                $.each(data.orders, function () {
                    var orId = $('#showTicketOrder').val();
                    if (orId != this.id) {
                        $('#showTicketOrder').append(`<option value="${this.id}">Order № ${this.id}</option>`);
                    }
                });
            }
            if (data.payments.length > 0) {
                $.each(data.payments, function () {
                    var paId = $('#showTicketPayment').val();
                    if (paId != this.id) {
                        $('#showTicketPayment').append(`<option value="${this.id}">${this.data} (${this.amount})</option>`);
                    }
                });
            }
            if (data.charges.length > 0) {
                $.each(data.charges, function () {
                    var chId = $('#showTicketCharge').val();
                    if (chId != this.id) {
                        $('#showTicketCharge').append(`<option value="${this.id}">${this.dateTime}${this.description} (${this.amount})</option>`);
                    }
                });
            }
        }
    }
    self.addEquipmentToCreateSelectFleet = function (response) {//use
        c(response);
        if (response.code == '000') {
            var data = response.data.result;
            $.each(data.equipments, function () {
                $('#create_cliend_ticket #equipment').append(`<option value="${this.id}">${this.Name}${this.VIN == null ? '' : '(' + this.VIN + ')'}</option>`);
            });
            $.each(data.orders, function () {
                $('#create_cliend_ticket #order').append(`<option value="${this.id}">Order № ${this.id}</option>`);
            });
            $.each(data.payments, function () {
                $('#create_cliend_ticket #payment').append(`<option value="${this.id}">${this.data} (${this.amount})</option>`);
            });
            $.each(data.charges, function () {
                $('#create_cliend_ticket #charge').append(`<option value="${this.id}">${this.dateTime}${this.description} (${this.amount})</option>`);
            });
        }
    }
    self.getEquipmentsByUserId = function (successHandler, reqData, userId = null, truck = 1) {//use
        var data = {};
        if (userId != null) {
            data.userId = userId;
        }
        if (truck == null) {
            data.truck = truck;
        }
        var params = {};
        params.action = 'getEquipmentsByUserId';
        params.data = data;
        params.url = self.apiUrl;
        params.successHandler = successHandler
        AjaxCall(params);
    }
    self.getDriversByFleet = function (successHandler, reqData) {//use
        var params = {};
        params.action = 'getDriversByFleet';
        params.url = self.apiUrl;
        params.successHandler = successHandler;
        AjaxCall(params);
    }
    self.getPlatfornById = function (id) {//use
        switch (id) {
            case 1:
                return "Website";
                break;
            case 2:
                return "Android";
                break;
            case 3:
                return "iOS";
                break;
            case 4:
                return "Order";
                break;
            case 5:
                return 'Payment';
                break;
            case 6:
                return 'Charge';
                break;
        }
    }
    self.getStatusById = function (id) {//use
        switch (id) {
            case 0:
                return "New";
                break;
            case 1:
                return "Under Review";
                break;
            case 2:
                return "Pending Customer Action";
                break;
            case 3:
                return "Resolved";
                break;
            case 4:
                return "Waiting On Customer";
                break;
            case 5:
                return "Customer Replied";
                break;
            case 6:
                return "Support LVL2";
                break;
        }
    }
    self.escapeHtml = function (unsafe) {
        return unsafe
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
    }
    self.changeClientTicketTypeInCreateModal = function (el) {
        $('#create_cliend_ticket .content_by_type').hide();
        if ($(el).val() == 2 || $(el).val() == 3) {
            $('#create_cliend_ticket .content_by_type[data-type="23"]').show();
        } else {
            $('#create_cliend_ticket .content_by_type[data-type="' + $(el).val() + '"]').show();
        }
    }
    self.changeClientTicketTypeInUpdateModal = function (el) {
        $('.client_ticket_card .content_by_type').hide();
        if ($(el).val() == 2 || $(el).val() == 3) {
            $('.client_ticket_card .content_by_type[data-type="23"]').show();
        } else {
            $('.client_ticket_card .content_by_type[data-type="' + $(el).val() + '"]').show();
        }
    }
    self.changeUserInCreateTicket = function (el) {
        $('#create_cliend_ticket #equipment').empty();
        $('#create_cliend_ticket #order').empty();
        $('#create_cliend_ticket #payment').empty();
        $('#create_cliend_ticket #charge').empty();
        $('#create_cliend_ticket #equipment').append(`<option value="" selected>Select equipment</option>`);
        self.getEquipmentsByUserId(ClientsTicketsC.addEquipmentToCreateSelectFleet, {}, $(el).val());
    }
    self.changeUserInUpdateTicket = function (el) {
        $('.client_ticket_card #showTicketEquipment').empty();
        $('.client_ticket_card #showTicketOrder').empty();
        $('.client_ticket_card #showTicketPayment').empty();
        $('.client_ticket_card #showTicketCharge').empty();
        $('.client_ticket_card #showTicketEquipment').append(`<option value="" selected>Select equipment</option>`);
        self.getEquipmentsByUserId(ClientsTicketsC.addEquipmentToUpdateSelectFleet, {}, $(el).val());
    }
}

ClientsTicketsC = new ClientsTicketsController();