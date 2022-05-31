function ManagerClientsTicketsController()
{
    var self = this;

    self.apiUrl = '/db/api/apiClientSupportTickets.php';
    self.allClientTicketsPagination = false;

    self.globalClientTickets = {};

    self.supportInit = function () {
        var params = {};
        params.action = 'getAllSupportsInSupportTickets';
        params.url = self.apiUrl;
        params.successHandler = self.getAllSupportsInSupportTicketsHandler;
        AjaxCall(params);
        self.allClientTicketsPagination = new simplePaginator({
            tableId: 'clientTickets',
            request: 'getAllClientSupportTicketsPagination',
            requestUrl: self.apiUrl,
            handler: self.getAllClientSupportTicketsPaginationHandler,
            perPageList: [25, 50, 100],
            additionalData: {
                userType: 'support'
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
            body.append(self.showMyClientTicketsInTable(row));
        });
    }

    self.getAllSupportsInSupportTicketsHandler = function (response) {
        c('getAllSupportsInSupportTicketsHandler');
        c(response);
        $('#supportFilter').empty().append(`<option value=""></option>`);
        $.each(response.data.result, function () {
            $('#supportFilter').append(`<option value="${this.supportId}">${this.name} ${this.last}</option>`);
        });
    }

    self.showMyClientTicketsInTable = function (data) {
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
        var tableBody = `<tr data-id="${data.id}" ${(data.status == 0 || data.status == 5) && !data.supportId ? 'onclick="ManagerClientsTicketsC.showClientTicketsCard(this, \'take\');"' : 'onclick="ManagerClientsTicketsC.showClientTicketsCard(this);"'}>
            <td>${data.id}</td>
            <td class="name">${data.name}</td>
            <td class="date">${convertDateToUSA(data.ticketDate, true)}</td>
            <td class="type" data-type="${data.type}">${self.getPlatfornById(data.type)}</td>
            <td class="company"><span class="global_carrier_info clickable_item" title="Carrier Info" data-carrid="${data.companyId}" onclick="actionGlobalgetOneCarrierInfo(this, event);" style="cursor: pointer;">${companyText}</span></td>
            <td class="user"><span class="global_carrier_info clickable_item" title="User Info" data-userid="${data.userId}" onclick="getOneUserInfo(this, event);" style="cursor: pointer;">${data.userInfo.name} ${data.userInfo.last}(${data.userInfo.email})</span></td>
            <!--<td>${infoText}</td>-->
            <!--<td class="version">${data.version}</td>-->
            <td class="support" data-support=${data.supportId}>${data.supportInfo.name} ${data.supportInfo.last}</td>
            <td class="status" data-status="${data.status}">${self.getStatusById(data.status)}</td>
        </tr>`;
        return tableBody;
    }
    self.showClientTicketsCard = function (el, popupType = 'update') {
        var ticket;
        if (self.globalClientTickets.hasOwnProperty($(el).attr('data-id'))) {
            ticket = self.globalClientTickets[$(el).attr('data-id')];
        } else {
            return false;
        }
        
        c(ticket);

        var head = `TICKET №` + ticket.id;

        var userText = `${ticket.userInfo.name} ${ticket.userInfo.name}(${ticket.userInfo.email})`;

        var equipmentText = ticket.equipmentId == '' ? '' : `${ticket.equipmentInfo.Name}${ticket.equipmentInfo.VIN == null ? '' : '(' + ticket.equipmentInfo.VIN + ')'}`;

        var orderText = `Order № ${ticket.orderId}`;

        var paymentText = `${ticket.paymentInfo.data} (${ticket.paymentInfo.amount})`;

        var chargeText = `${ticket.chargeInfo.dateTime}${ticket.chargeInfo.description} (${ticket.chargeInfo.amount})`;

        var history = ticket.ticketHistory;

        var historyText = '';

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
                        attachmentText += '<div class = "videoBox"><a data-popup="source" href="javascript:;" onclick="ManagerClientsTicketsC.attachmentPopup(this)"><video class = "attachmentVideo" controls><source src = "' + MAIN_LINK + attachments[i].video + '"></source></video></a></div>';
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
                <span>Initiator: ${whoData.name} ${whoData.last}(${convertDateToUSA(historyItem.ticketDate, true)})</span></br>
                <span>Status: <b>${self.getStatusById(historyData.status)}</b></span>${fixedText}</br>
                <span>Message: </br>${message.message}</span></br>
                ${attachmentText}
            </div>`;
        });

        var controllButton = '';
        var resovedOption = '';
        if (history.length > 0) {
            var curTime = moment();
            var lastHistoryTime = moment(history[0].ticketDate)
            var d = curTime.diff(lastHistoryTime);
            var days = d / 1000 / 60 / 60 / 24;
            if (days > 2 && (ticket.status == 4 || ticket.status == 2)) {
                resovedOption = `<option value="3" ${ticket.status == 3 ? 'selected' : ''}>Resolved</option>`;
            }
        }
        switch (popupType) {
            case 'update':
                controllButton = `
                <div class="col-lg-6"><div class="form-group">
                    <label class="col-sm-2 padding-none control-label">Status</label>
                    <div class="col-sm-10"><select id="showTicketStatus">
                        <option value="0" ${ticket.status == 0 ? 'selected' : ''}>New</option>
                        <option value="4" ${ticket.status == 4 ? 'selected' : ''}>Waiting On Customer</option>
                        <option value="6" ${ticket.status == 6 ? 'selected' : ''}>Support LVL2</option>
                        <option value="1" ${ticket.status == 1 ? 'selected' : ''}>Under Review</option>
                        <option value="2" ${ticket.status == 2 ? 'selected' : ''}>Pending Customer Action</option>
                        ${resovedOption}
                        ${fixedText}
                    </select></div></div></div>
                    <div class="col-lg-12"><div class="form-group"><textarea id="new_comment" placeholder="Add comment here"></textarea></div></div>
                    <div class="col-lg-12"><button class="btn btn-default update_task" onclick="ManagerClientsTicketsC.updateClientSupportTicketFromSupport();">Update</button>
                    <button class="btn btn-default file_upload">Add file</button></div>`;
                break;
            case 'take':
                controllButton = `<div class="col-lg-12"><button class="btn btn-default update_task" onclick="ManagerClientsTicketsC.takeClientTicket();">Take ticket</button></div>`;
                break;
        }

        var fixedText = '';
        if (ticket.fixed == 1) {
            fixedText = `<option value="3" ${ticket.status == 3 ? 'selected' : ''}>Resolved</option>`;
        }

        var contentByType = ``;

        if (ticket.type == 2 || ticket.type == 3) {
            contentByType = `<div class="col-lg-6"><b>Equipment:</b> ${equipmentText}</div>
                            <div class="col-lg-6"><b>Version:</b> ${ticket.version}</div>`;
        } else if (ticket.type == 4) {
            contentByType = `<div class="col-lg-6"><b>Order:</b> ${orderText}</div>`
        } else if (ticket.type == 5) {
            contentByType = `<div class="col-lg-6"><b>Payment:</b> ${paymentText}</div>`
        } else if (ticket.type == 6) {
            contentByType = `<div class="col-lg-6"><b>Charge:</b> ${chargeText}</div>`
        }

        var content = `<input type="hidden" value="${ticket.id}" class="ticketId" readonly>
                    <div class="col-lg-12"><b>Ticket name:</b> ${ticket.name}</div>
                    <div class="col-lg-6"><b>User:</b> ${userText}</div>
                    <div class="col-lg-6"><b>Type:</b> ${self.getPlatfornById(ticket.type)}</div>
                    ${contentByType}</br>
                    ${controllButton}
                    <input type="file" accept="*" id="file-upload-task">
                    <div class="uploadBox_updateTask" style="float:left;overflow: hidden;margin-top: 20px;"></div>
                    <div class="col-xs-12" id="history_box">
                        ${historyText}
                    </div>
                    `;
        showModal(head, content, 'modalTicket', 'modal-lg client_ticket_card');
        c(ticket);
    }
    self.takeClientTicket = function () {
        var ticketId = $('.client_ticket_card input.ticketId').val();
        var data = {ticketId: ticketId};
        var params = {};
        params.action = 'takeClientTicket';
        params.data = data;
        params.url = self.apiUrl;
        params.successHandler = self.takeClientTicketHandler;
        AjaxCall(params);
    }
    self.takeClientTicketHandler = function (response) {
        c(response);
        if (response.code == '000') {
            $('#modalTicket .close').click();
            $('#supportFilter').empty().append(`<option value=""></option>`);
            $.each(response.data.result.supports, function () {
                $('#supportFilter').append(`<option value="${this.supportId}">${this.name} ${this.last}</option>`);
            });
            $('#clientTickets tbody tr[data-id="' + response.data.result.tickets.id + '"]').replaceWith(self.showMyClientTicketsInTable(response.data.result.tickets));
            self.globalClientTickets[response.data.result.tickets.id] = response.data.result.tickets;
        }
    }
    self.updateClientSupportTicketFromSupport = function () {
        $('.task_result').removeClass('error').text('');
        var ticketId = $('.client_ticket_card input.ticketId').val(),
                status = $('.client_ticket_card #showTicketStatus').val(),
                message = $('#new_comment').val().trim(),
                attachmentsInfo = [];

        $('.uploadImg_updateTask img').each(function ()
        {
            var info = {};
            info.img = $(this).attr('src');
            info.imgName = $(this).attr('data-filename');
            attachmentsInfo.push(info);
        });
        $('.uploadVideo_updateTask source').each(function ()
        {
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
        $('.uploadFile_updateTask p').each(function ()
        {
            var info = {};
            info.file = $(this).attr('src');
            info.fileName = $(this).attr('data-filename');
            attachmentsInfo.push(info);
        });
        var description = {
            message: self.escapeHtml(message),
            attachments: attachmentsInfo
        };

        var ticket;
        if (self.globalClientTickets.hasOwnProperty(ticketId)) {
            ticket = self.globalClientTickets[ticketId];
        } else {
            return false;
        }

        if (status == ticket.status) {
            status = 4;
        }

        var data = {ticketId: ticketId, message: JSON.stringify(description), status: status};

        var params = {};
        params.action = 'updateClientSupportTicketFromSupport';
        params.data = data;
        params.url = self.apiUrl;
        params.successHandler = self.updateClientSupportTicketFromSupportHandler;
        AjaxCall(params);
    }
    self.updateClientSupportTicketFromSupportHandler = function (response) {
        c(response);
        if (response.code == '000') {
            $('#modalTicket .close').click();

            var data = response.data.result;
            delete self.globalClientTickets[data.id];
            self.globalClientTickets[data.id] = data;
            $('#clientTickets tbody tr[data-id="' + data.id + '"]').replaceWith(self.showMyClientTicketsInTable(data));
        }
    }
    /*-----------------------------*/
    self.getUploadFile = function (input) {
        if (input.files && input.files[0]) {
            if (input.files[0].size > 200000000) {
                return false;
            }
            var file = input.files[0],
                    reader = new FileReader();
            var updateTask = $('.create_cliend_ticket').is(':visible') ? '' : '_updateTask';
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
    self.getPlatfornById = function (id) {
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
    self.getStatusById = function (id) {
        switch (id) {
            case 0:
                return "<span class=\"label label-default\">New</span>";
                break;
            case 1:
                return "<span class=\"label label-info\">Under Review</span>";
                break;
            case 2:
                return "<span class=\"label label-warning\">Pending Customer Action</span>";
                break;
            case 3:
                return "<span class=\"label label-success\">Resolved</span>";
                break;
            case 4:
                return "<span class=\"label label-warning\">Waiting On Customer</span>";
                break;
            case 5:
                return "<span class=\"label label-info\">Customer Replied</span>";
                break;
            case 6:
                return "<span class=\"label label-info\">Support LVL2</span>";
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
}

ManagerClientsTicketsC = new ManagerClientsTicketsController();