function SupportManagerController() {
    var self = this;

    //variables
    self.apiUrl = '/db/api/apiSupportTickets.php'
    self.getAllSupportTicketsPagination = false;

    self.tasks = [];
    self.allTeams;
    self.employees;
    self.userTeam;
    self.userId;
    self.showAll;

    self.entityMap = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
        '/': '&#x2F;',
        '`': '&#x60;',
        '=': '&#x3D;'
    };

    self.taskTypeInfo = {
        '0': {
            'id': 0,
            'name': '',
            'color': ''
        },
        '2': {
            'id': 2,
            'name': 'Design bug',
            'color': 'DesignBug'
        },
        '3': {
            'id': 3,
            'name': 'Functional bug',
            'color': 'FunctionalBug'
        },
        '4': {
            'id': 4,
            'name': 'User Request',
            'color': 'UserRequestBug'
        }
    };

    self.taskPlatformInfo = {
        '0': {
            'id': 0,
            'name': ''
        },
        '1': {
            'id': 1,
            'name': 'Website'
        },
        '2': {
            'id': 2,
            'name': 'Android'
        },
        '3': {
            'id': 3,
            'name': 'iOs'
        },
        '4': {
            'id': 4,
            'name': 'Sales'
        }
    };

    self.taskStatusInfo = {
        '0': {
            'id': 0,
            'name': 'Created',
            'color': 'Created'
        },
        '1': {
            'id': 1,
            'name': 'Assigned',
            'color': 'Assigned'
        },
        '2': {
            'id': 2,
            'name': 'In Work',
            'color': 'InWork'
        },
        '3': {
            'id': 3,
            'name': 'On Hold',
            'color': 'OnHold'
        },
        '4': {
            'id': 4,
            'name': 'On Review',
            'color': 'OnReview'
        },
        '5': {
            'id': 5,
            'name': 'In Test',
            'color': 'InTest'
        },
        '8': {
            'id': 8,
            'name': 'Completed',
            'color': 'Completed'
        },
        '9': {
            'id': 9,
            'name': 'Closed',
            'color': 'Closed'
        }
    };

    self.taskPriorityInfo = {
        '1': {
            'id': 1,
            'name': 'Low'
        },
        '2': {
            'id': 2,
            'name': 'Middle'
        },
        '3': {
            'id': 3,
            'name': 'High'
        },
        '4': {
            'id': 4,
            'name': 'Trivial'
        },
        '5': {
            'id': 5,
            'name': 'Critical'
        }
    };

    //Seters
    self.setEmployees = function (employees) {
        self.employees = employees;
    };

    self.setUserId = function (userId) {
        self.userId = userId;
    };
    
    self.setUserTeam = function (userTeam) {
        self.userTeam = userTeam;
    }

    self.setShowAll = function (showAll) {
        self.showAll = showAll;
        if (showAll == 1) {
            $('#show_all').prop("checked", true);
        }
    };

    //metods
    self.init = function () {
        self.getAllSupportTicketsPagination = new simplePaginator({
            tableId: 'supportTickets',
            request: 'getAllSupportTicketsPagination',
            requestUrl: self.apiUrl,
            handler: self.getAllSupportTicketsPaginationHandler,
            perPageList: [25, 50, 100]
        });
    }
    self.getAllSupportTicketsPaginationHandler = function (response, tableId) {
        c('getAllSupportTicketsPaginationHandler');
        c(response);

        var body = $('#' + tableId).find('tbody')
        body.empty();

        //getOneTicket
        $.each(response.data.result, function (key, row) {
            self.tasks.push(row);
            body.append(self.getOneTicket(row));
        });
    }
    self.employeeTeamInit = function () {
//        AjaxController('getEmployeeTeam', {}, self.apiUrl, self.employeeTeamInitHandler, errorBasicHandler, true);
        var params = {};
        params.action = 'getEmployeeTeam';
        params.url = self.apiUrl;
        params.successHandler = self.employeeTeamInitHandler;
        AjaxCall(params);
    }
    self.employeeTeamInitHandler = function (response) {
        c('employeeTeamInitHandler');
        c(response);

        self.allTeams = response.data.result;

        $('#userFullNameInput .paginationInput, #userAsignFullNameInput .paginationInput').empty().append(self.genereteEmployeeSelect());
    }
    self.showCreateSupportTicketModal = function () {
        var title = 'CREATE SUPPORT TIKET';
        var content = `<input type="text" class="ez_input name" placeholder="Ticket Name"/><br>
        <div class="left">
            <select id="taskType">
                <option value="0">Select type</option>
                <option value="2">Design bug</option>
                <option value="3">Functional bug</option>
                <option value="4" selected>User Request</option>
            </select>
            <select id="platform" >
                <option value="0">Select platform</option>
                <option value="1">Website</option>
                <option value="2">Android</option>
                <option value="3">iOS</option>
                <option value="4">Sales</option>
            </select>
            <select id="priotity">
                <option value="4">Trivial</option>
                <option value="1">Low</option>
                <option value="2" selected>Middle</option>
                <option value="3">High</option>
                <option value="5">Critical</option>
            </select>
            <textarea class="ez_input description" placeholder="Ticket Description" style="resize: vertical;"></textarea><br>
        </div>
        <div class="right">
        ${[TYPE_EMPLOYEE].indexOf(position) > -1 ? '' : `
            <h3 style="margin-bottom: 10px;">Additional information for the developer</h3>
            <input type="email" placeholder="Client E-mail" id="cemail" />
            <input type="text" placeholder="Company USDOT" id="cusdot" maxlength="10"/>
            <input type="text" placeholder="Support Chat History ID" id="schid" />`
                }
        </div>
        <div style="float: left; width: 100%;">
            <button class="btn btn-default create_task_button" onclick="SupportManagerC.createTask();">Create</button>
            <button class="btn btn-default file_upload">Add file</button>
            <input type="file" accept="video/*,image/*" id="file-upload-task" onchange="SupportManagerC.getUploadFile(this);">
            <div class="uploadBox"></div>
        </div>`;

        showModal(title, content, 'create_task_box', 'modal-lg', {});
    }
    self.genereteEmployeeSelect = function (params = {}) {
        var content = `<option></option>`;
        if (self.allTeams.length > 0) {
            $.each(self.allTeams, function (key, team) {
                content += `<optgroup label="${team.name}">`;
                $.each(team.members, function (key2, member) {
                    content += `<option value="${member.userId}" ${typeof params.selectedUserId != 'undefined' && params.selectedUserId == member.userId ? 'selected' : ''}>${member.name} ${member.last}</option>`
                });
                content += `</optgroup>`;
            });
        }
        return content;
    }
    self.escapeHtml = function (string) {
        return String(string).replace(/[&<>"'`=\/]/g, function (s) {
            return self.entityMap[s];
        });
    }
    self.createTask = function () {
        $('.popup_box_panel select, .popup_box_panel input, .popup_box_panel textarea').removeClass('inpurError');
        var name = $('#create_task_box .name').val(),
                userId = 0,
                type = $('#taskType').val(),
                platform = $('#platform').val(),
                priority = $('#priotity').val(),
                attachmentsInfo = [];
        if (type == 0 || (type == 2 || type == 3 || type == 4) && platform == 0 || name == '' || $.trim($('#create_task_box .description').val()) == '') {
            type == 0 ? $('#taskType').addClass('inpurError') : '';
            (type == 2 || type == 3 || type == 4) && platform == 0 ? $('#platform').addClass('inpurError') : '';
            name == '' ? $('#create_task_box .name').addClass('inpurError') : '';
            $.trim($('#create_task_box .description').val()) == '' ? $('#create_task_box .description').addClass('inpurError') : '';
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
            info.video = $(this).attr('src');
            info.videoName = $(this).attr('data-filename');
            info.duration = $(this).parent()[0].duration;
            attachmentsInfo.push(info);
        });
        var description = {
            message: self.escapeHtml($('#create_task_box .description').val()),
            attachments: attachmentsInfo
        }
        //new
        var cUserE = $('#cemail').val();
        var cUSDOT = $('#cusdot').val();
        var schId = $('#schid').val();
        if ($.trim(cUserE) != '' && !validate.validateEmail(cUserE)) {
            $('#cemail').addClass('inpurError');
            return false;
        }
        $('.create_task_button').prop("disabled", true);
        var data = {userId: userId, description: JSON.stringify(description), name: name, type: type, platform: platform, priority: priority, cUserE: cUserE, cUSDOT: cUSDOT, schId: schId};
//        AjaxController('createSupportTicket', data, self.apiUrl, self.createTaskHandler, errorBasicHandler, true);
        var params = {};
        params.action = 'createSupportTicket';
        params.data = data;
        params.url = self.apiUrl;
        params.successHandler = self.createTaskHandler;
        AjaxCall(params);
    }
    self.createTaskHandler = function (response) {
        var task = response.data.result,
                content = '',
                type = self.taskTypeInfo[task.type].name,
                taskTypeColor = self.taskTypeInfo[task.type].color,
                statusName = self.taskStatusInfo[task.history[0].status].name,
                statusColor = self.taskStatusInfo[task.history[0].status].color,
                platform = self.taskPlatformInfo[task.platform].name,
                priority = self.taskPriorityInfo[task.priority];

        task.history[0].description = JSON.parse(task.history[0].description);
        self.tasks.push(task);
        content = '<tr data-id="' + task.id + '" class="mine" data-name="' + task.name + '" data-createdtime="' + task.history[0].dateTime + '" \n\
                data-type="' + task.type + '" data-platform="' + task.platform + '" data-assignedto="' + task.history[0].userId + '" \n\
                data-status="' + task.history[0].status + '" data-priority="' + task.priority + '" onclick="SupportManagerC.getTicketInfoBox(this)" style="display: table-row;">\n\
                   <td>' + task.id + '</td>\n\
                   <td>' + task.history[0].dateTime + '</td>\n\
                   <td>' + task.creator + '</td>\n\
                   <td>' + task.name + '</td>\n\
                   <td class="' + taskTypeColor + '">' + type + '</td>\n\
                   <td>' + platform + '</td>\n\
                   <td>' + (task.history[0].user ? task.history[0].user : '') + '</td>\n\
                   <td class="' + statusColor + '">' + statusName + '</td>\n\
                   <td>' + task.history[0].dateTime + '</td>\n\
                   <td>' + priority + '</td>\n\
               </tr>';
        $('table').find('tbody').prepend(content).trigger('update');
        $('.create_task_button').prop('disabled', false);
        $('#create_task_box').hide();
        $('#create_task_box .ez_input.name, #create_task_box .ez_input.description').val('');
        $('#create_task_box .ez_input.employee, #create_task_box #platform').val(0);
        $('#create_task_box #taskType').val(4);
        $('#create_task_box #priotity').val(2);
        $('.uploadBox').empty();
        $('#cemail').val('');
        $('#cusdot').val('');
        $('#schid').val('');
        $('#histoty_box table').attr('data-countLine', (parseInt($('#histoty_box table').attr('data-countLine')) + 1));
    }
    self.updateTask = function (el) {
        $('.popup_box_panel select, .popup_box_panel input, .popup_box_panel textarea').removeClass('inpurError');
        $('.task_result').removeClass('error').text('');
        var name = $('#task_name').val();
        var status = $('#task_status').val();
        var userId = $('#task_employee').val();
        var creatorId = $('#task_creator').val();
        var platform = $('#showTaskPlatform').val();
        var priority = $('#showTaskPriority').val();
        var type = $('#showTaskType').val();
        var attachmentsInfo = [];
        $('.uploadImg_updateTask img').each(function () {
            var info = {};
            info.img = $(this).attr('src');
            info.imgName = $(this).attr('data-filename');
            attachmentsInfo.push(info);
        });
        $('.uploadVideo_updateTask source').each(function () {
            var info = {};
            info.video = $(this).attr('src');
            info.videoName = $(this).attr('data-filename');
            info.duration = $(this).parent()[0].duration;
            attachmentsInfo.push(info);
        });
        var description = {
            message: self.escapeHtml($('#new_comment').val()),
            attachments: attachmentsInfo
        };
        var estimated = $('#estimated').val();
        var spent = $('#spent').val();
        var taskId = $(el).attr('data-id');

        var cUserE = $('#sCemail').val();
        var cUSDOT = $('#sCusdot').val();
        var schId = $('#sSchid').val();

        if ($.trim(cUserE) != '' && !validate.validateEmail(cUserE)) {
            $('#sCemail').addClass('inpurError');
            return false;
        }
        if ($.trim(name) != '') {
            $('.update_task').prop("disabled", true);
            var data = {userId: userId, type: type, priority: priority, platform: platform, creatorId: creatorId, description: JSON.stringify(description), name: name, status: status, taskId: taskId, spent: spent, estimated: estimated, cUserE: cUserE, cUSDOT: cUSDOT, schId: schId};
//            AjaxController('updateSupportTicket', data, self.apiUrl, self.updateTaskHandler, self.updateTaskErrorHandler, true);
            var params = {};
            params.action = 'updateSupportTicket';
            params.data = data;
            params.url = self.apiUrl;
            params.successHandler = self.updateTaskHandler;
            params.errorHandler = self.updateTaskErrorHandler;
            AjaxCall(params);
        } else {
            $('#task_name').addClass('inpurError');
        }
    };
    self.updateTaskHandler = function (response, close = true) {
        c(response);
        var oneNewHistory = response.data.result.history[0],
                task = response.data.result,
                statusName = self.taskStatusInfo[oneNewHistory.status].name,
                statusColor = self.taskStatusInfo[oneNewHistory.status].color,
                type = self.taskTypeInfo[task.type].name,
                taskTypeColor = self.taskTypeInfo[task.type].color,
                row = '',
                platform = self.taskPlatformInfo[task.platform].name,
                priority = self.taskPriorityInfo[task.priority].name;

        if (oneNewHistory.status == 9 && self.showAll == '0') {
            $('#histoty_box tbody tr[data-id = "' + oneNewHistory.taskId + '"] td').remove();
        } else {
            row = $('#histoty_box tbody tr[data-id = "' + oneNewHistory.taskId + '"] td');
            $(row).eq(2).text(task.creator);
            $(row).eq(3).text(task.name);
            $(row).eq(4).text(type).removeClass().addClass(taskTypeColor);
            $(row).eq(5).text(platform);
            $(row).eq(6).text(oneNewHistory.user);
            $(row).eq(7).text(statusName).removeClass().addClass(statusColor);
            $(row).eq(8).text(oneNewHistory.dateTime);
            $(row).eq(9).text(priority);
        }
        oneNewHistory.description = JSON.parse(oneNewHistory.description);
        for (var i = 0, len = self.tasks.length; i < len; i++) {
            if (self.tasks[i].id === oneNewHistory.taskId) {
                self.tasks[i].currentStatus = oneNewHistory.status;
                self.tasks[i].platform = task.platform;
                self.tasks[i].name = task.name;
                self.tasks[i].type = task.type;
                self.tasks[i].priority = task.priority;
                self.tasks[i].creatorId = task.creatorId;
                self.tasks[i].history.push(oneNewHistory);

                self.tasks[i].cUSDOT = task.cUSDOT;
                self.tasks[i].cUserE = task.cUserE;
                self.tasks[i].schId = task.schId;
            }
        }
        if (close) {
            $('.update_task').prop('disabled', false);
            $('.uploadBox_updateTask').empty();
            $('#new_comment').val('');
            $('#task_card').hide();
    }
    };
    self.updateTaskErrorHandler = function (data) {
        $('.task_result').addClass('error').text(data.message);
    };
    self.getUserNameFromId = function (userId) {
        var userName = '';
        $.each(self.employees, function (key, user) {
            if (user.id == userId) {
                userName = user.name + ' ' + user.last;
            }
        });
        return userName;
    };
    self.getOneTicket = function (ticket) {
        var priority = self.taskPriorityInfo[ticket.priority].name;
        var toMeClass = typeof ticket.toMe != 'undefined' && ticket.toMe ? 'mine' : 'not_mine';
        var lastStatus = ticket.history[ticket.history.length - 1];
        var firstStatus = ticket.history[0];
        var createdAt = firstStatus.dateTime;
        var createdBy = ticket.creator == null ? '' : ticket.creator;
        var type = self.taskTypeInfo[ticket.type].name;
        var taskTypeColor = self.taskTypeInfo[ticket.type].color;
        var platform = self.taskPlatformInfo[ticket.platform].name;
        var statusName = self.taskStatusInfo[ticket.currentStatus].name;
        var statusColor = self.taskStatusInfo[ticket.currentStatus].color;

        var userName = self.getUserNameFromId(lastStatus.employeeId);
        var t = `<tr data-id="${ticket.id}" class="${toMeClass}" data-name="${ticket.name}"
                    data-createdTime="${createdAt}" data-type="${ticket.type}" data-platform="${ticket.platform}"
                    data-assignedto="${lastStatus.employeeId}" data-status="${ticket.currentStatus}" data-priority="${ticket.priority}" onclick="SupportManagerC.getTicketInfoBox(this)">
                       <td>${ticket.id}</td>
                       <td>${createdAt}</td>
                       <!--<td>${createdBy}</td>-->
                       <td>${ticket.name}</td>
                       <!--<td class="${taskTypeColor}">${type}</td>
                       <td>${platform}</td>
                       <td>${userName}</td>
                       <td class="${statusColor}">${statusName}</td>-->
                       <td>${createdAt}</td>
                       <!--<td>${priority}</td>-->
               </tr>`;
        $('#histoty_box tbody').append(t);
        return t;
    };
    self.getTicketInfoBox = function (el) {
        $('#task_card').remove();
        var taskId = $(el).attr('data-id'),
                task = '';

        var title = 'Email Request # ' + taskId;
        var content = `<div class="employee_info_box">
                <div class="one_box">
                    <label>Ticket Name</label>
                    <input type="text" id="task_name" placeholder="Name"/>
                </div>
                <!--<div class="one_box">
                    <label>Type</label>
                    <select id="showTaskType">
                        <option value="2">Design bug</option>
                        <option value="3">Functional bug</option>
                        <option value="4">User Request</option>
                    </select>
                </div>
                <div class="one_box">
                    <label>Status</label>
                    <select id="task_status">
                        <option value="0">Created</option>
                        <option value="1">Assigned</option>
                        <option value="2">In Work</option>
                        <option value="3">On Hold</option>
                        <option value="4">On Review</option>
                        <option value="5">In Test</option>
                        <option value="8">Completed</option>
                        <option value="9" style="display:none;" id="close_task_opt">Close Ticket</option>
                    </select>
                </div>
                <div class="one_box">
                    <label>Priority</label>
                    <select id="showTaskPriority">
                        <option value="4">Trivial</option>
                        <option value="1">Low</option>
                        <option value="2">Middle</option>
                        <option value="3">High</option>
                        <option value="5">Critical</option>
                    </select>
                </div>
                <div class="one_box">
                    <label>Platform</label>
                    <select id="showTaskPlatform">
                        <option value="1">Website</option>
                        <option value="2">Android</option>
                        <option value="3">iOS</option>
                        <option value="4">Sales</option>
                    </select>
                </div>-->
                ${[TYPE_EMPLOYEE].indexOf(position) > -1 ? `
                <!--<div class="one_box">
                    <label>Assigned to</label>
                    <select class="ez_input" id="task_employee">
                        <option value="0">Select employee</option>
                    </select>
                </div>-->` : ''
                }
            </div>
            <!--<textarea id="new_comment" placeholder="Add comment here" style="resize: vertical;"></textarea>
            <button class="btn btn-default file_upload">Add file</button>
            <input type="file" accept="video/*,image/*" id="file-upload-task" onchange="SupportManagerC.getUploadFile(this);">
            <div class="uploadBox_updateTask"></div>-->
            <div style="margin-top: 20px;">
                <h3 style="margin-bottom: 10px; width: 100%;">Additional information for the developer</h3>
                <input type="email" placeholder="Client E-mail" id="sCemail" />
                <input type="text" placeholder="Company USDOT" id="sCusdot" maxlength="10"/>
                <input type="text" placeholder="Support Chat History ID" id="sSchid" />
            </div>
        ${[TYPE_EMPLOYEE].indexOf(position) > -1 ? `
            <!--<div id="additional_info" style="margin-top: 20px;">
                <h3 style="margin-bottom: 10px; width: 100%;">Additional information for the developer</h3>
                <div class="user_info">
                    <h3 class="user_info_name"></h3>
                    <p class="user_info_position"><b>Position:</b> <span></span></p>
                    <p class="user_info_phone"><b>Phone:</b> <span></span></p>
                    <p class="user_info_email"><b>E-mail:</b> <span></span></p>
                    <p class="user_info_status"><b>Status:</b> <span></span></p>
                </div>
                <div class="carrier_info">
                    <h3 class="carrier_info_name"><b>Carrier info: </b><span class="global_carrier_info" title="Carrier Info" data-carrid="" onclick="actionGlobalgetOneCarrierInfo(this);" style="cursor: pointer;"></span></h3>
                </div>
                <div class="sch_info">
                    <h3 class="sch_info_name"><b>Support chat history info: </b><span class="global_carrier_info" title="Support Chat History Info" data-schid="" onclick="oneChatHistory(this)" style="cursor: pointer;"></span></h3>
                </div>
            </div>-->` : ''}
            <div id="history_box"></div>
            <span class="task_result"></span>
            <div>`;
        
        var additionalData = {};
        additionalData.type = 'emailRequest';
        additionalData.taskId = taskId;
        var footerButton = '<button class="btn btn-default" onclick=\'ClientsTicketsC.getCreateClientSupportTicketPopupInfo(' + JSON.stringify(additionalData) + ');\'>Create Ticket</button>';

        showModal(title, content, 'task_card', 'modal-lg', {
            'footerButtons': footerButton
        });

        $.each(self.tasks, function (key, taskInfo) {
            if (taskInfo.id == taskId) {
                task = taskInfo;
            }
        });

        if (task.creatorId == self.userId) {
            $('#close_task_opt').show();
        } else {
            $('#close_task_opt').hide();
        }

        $('#task_id').text(task.id);
        c('employeeId');
        c(task.history[task.history.length - 1].employeeId);
        $('#task_employee').empty().append(self.genereteEmployeeSelect({'selectedUserId': task.history[task.history.length - 1].employeeId}));
        $('#task_creator').val(task.creatorId);
        $('#task_name').val(task.name);
        $('#showTaskType').val(task.type);
        $('#showTaskPlatform').val(task.platform);
        $('#showTaskPriority').val(task.priority);
        $('#task_status').val(task.currentStatus);
        $('#new_comment').val('');
        $('#history_box').empty();
        $('.update_task').attr('data-id', taskId);

        $('#sCemail').val(task.cUserE);
        $('#sCusdot').val(task.cUSDOT);
        $('#sSchid').val(task.schId);

        var history = task.history;
        var desc = '';
        var status = 0;
        var assigned = 0;
        var estimated = 0;
        var spent = 0;
        $.each(history, function (key, historyItem) {
            var historyText = '<div>';
            if (key == 0) {
                desc = JSON.parse(historyItem.description).message;
                status = historyItem.status;
                assigned = historyItem.employeeId;
                historyText += 'Task: <br>' + desc.replace(/\r\n|\r|\n/g, "<br />") + '<br>';
                if (assigned != 0) {
                    historyText += 'Assigned to: ' + self.getUserNameFromId(assigned) + '<br>';
                }
                if (JSON.parse(historyItem.description).attachments.length > 0) {
                    historyText += 'Attachment: <div class = "attachmentsBox">';
                    var attachments = JSON.parse(historyItem.description).attachments;
                    for (var i = 0, lenI = attachments.length; i < lenI; i++) {
                        if (attachments[i].img) {
                            historyText += '<a href = "' + MAIN_LINK + '/dash/view' + attachments[i].img + '" target="_blank"><img class = "attachmentImg" src = "' + MAIN_LINK + '/dash/view' + attachments[i].img + '" alt = "attachment"></a>';
                        } else if (attachments[i].video) {
                            historyText += '<div class = "videoBox"><img src = "/dash/assets/img/playBut.png"><a href = "' + MAIN_LINK + '/dash/view' + attachments[i].video + '" target="_blank"><video class = "attachmentVideo"><source src = "' + MAIN_LINK + '/dash/view' + attachments[i].video + '"></source></video></a></div>';
                        }
                    }
                    historyText += '</div>';
                }
            } else {
                if (desc != JSON.parse(historyItem.description).message) {
                    if (JSON.parse(historyItem.description).message != '') {
                        historyText += 'Comment: <br>' + JSON.parse(historyItem.description).message.replace(/\r\n|\r|\n/g, "<br />") + '<br>';
                    }
                    desc = JSON.parse(historyItem.description).message;
                }
                if (estimated != historyItem.estimatedTime) {
                    historyText += 'Estimated: ' + historyItem.estimatedTime + '<br>';
                    estimated = historyItem.estimatedTime;
                }
                if (spent != historyItem.spentTime) {
                    historyText += 'Spent: ' + historyItem.spentTime + '<br>';
                    spent = historyItem.spentTime;
                }
                if (status != historyItem.status) {
                    var statusName = self.taskStatusInfo[historyItem.status];
                    historyText += 'Status changed to: ' + statusName + '<br>';
                    status = historyItem.status;
                }
                if (assigned != historyItem.employeeId) {
                    historyText += 'Assigned to: ' + self.getUserNameFromId(historyItem.employeeId) + '<br>';
                    assigned = historyItem.employeeId;
                }
                if (JSON.parse(historyItem.description).attachments.length > 0) {
                    historyText += 'Attachment: <div class = "attachmentsBox">';
                    var attachments = JSON.parse(historyItem.description).attachments;
                    for (var i = 0, lenI = attachments.length; i < lenI; i++) {
                        if (attachments[i].img) {
                            historyText += '<a href = "' + MAIN_LINK + '/dash/view' + attachments[i].img + '" target="_blank"><img class = "attachmentImg" src = "' + MAIN_LINK + '/dash/view' + attachments[i].img + '" alt = "attachment"></a>';
                        } else if (attachments[i].video) {
                            historyText += '<div class = "videoBox"><img src = "/dash/assets/img/playBut.png"><a href = "' + MAIN_LINK + '/dash/view' + attachments[i].video + '" target="_blank"><video class = "attachmentVideo"><source src = "' + MAIN_LINK + '/dash/view' + attachments[i].video + '"></source></video></a></div>';
                        }
                    }
                    historyText += '</div>';
                }
            }
            if (historyText != '<div>') {
                var byWhom = self.getUserNameFromId(historyItem.userId);
                $('#history_box').append('<div class="one_history"><span id = "oneHistoryBox"' + historyText + '</span><div id="by_whom"><span>' + byWhom + '</span><br><span> ' + historyItem.dateTime + '</span></div></div>');
            }
        });
        /*if (task.user_info) {
            var user_info = $('#additional_info .user_info');
            user_info.find('.user_info_name').text(`${task.user_info.u_name} ${task.user_info.last}`);
            user_info.find('.user_info_position span').text(`${getUserPositionByKey(task.user_info.companyPosition)}`);
            user_info.find('.user_info_phone span').text(`${task.user_info.phone}`);
            user_info.find('.user_info_email span').text(`${task.user_info.email}`);
            user_info.find('.user_info_status span').text(`${task.user_info.memberStatus}`);
            $('#additional_info').show();
            $('#additional_info .user_info').show();
        } else {
            $('#additional_info').hide();
            $('#additional_info .user_info').hide();
        }
        if (task.carrier_info) {
            $('#additional_info .carrier_info .carrier_info_name span').attr('data-carrid', task.carrier_info.id).text(`${task.carrier_info.name}`);
            $('#additional_info').show();
            $('#additional_info .carrier_info').show();
        } else {
            $('#additional_info').hide();
            $('#additional_info .carrier_info').hide();
        }
        if (task.schId) {
            $('#additional_info .sch_info .sch_info_name span').attr('data-schid', task.schId).text(`${task.schId}`);
            $('#additional_info').show();
            $('#additional_info .sch_info').show();
        } else {
            $('#additional_info').hide();
            $('#additional_info .sch_info').hide();
        }*/
    };
    self.changeShowAll = function (el) {
        var date = new Date();
        date.setMonth(date.getMonth() + 1);
        if ($(el).is(":checked")) {
            document.cookie = "showAll=1;expires=" + date + ";path=/";
            window.location.href = MAIN_LINK + "/dash/support/";
        } else {
            document.cookie = "showAll=0;expires=" + date + ";path=/";
            window.location.href = MAIN_LINK + "/dash/support/";
        }
    };
    self.getUploadFile = function (input) {
        if (input.files && input.files[0]) {
            if (input.files[0].size > 200000000) {
                return false;
            }
            var file = input.files[0],
                    reader = new FileReader();
            reader.onload = function (e) {
                var updateTask = $('#create_task_box').is(':visible') ? '' : '_updateTask';
                if (input.files[0].type.includes("image")) {
                    $('.uploadBox' + updateTask).append('<div class="uploadImg' + updateTask + '">\n\
                <button class="btn btn-default deleteFile">X</button>\n\
                <img src="" alt="image"></div>');
                    $('.uploadImg' + updateTask).last().css('display', 'inline-block');
                    $('.uploadImg' + updateTask + ' img').last().attr('src', e.target.result);
                    $('.uploadImg' + updateTask + ' img').last().attr('data-filename', file.name);
                } else if (input.files[0].type.includes("video")) {
                    $('.uploadBox' + updateTask).append('<div class="uploadVideo' + updateTask + '"> \n\
                <button class="btn btn-default deleteFile">X</button>\n\
                <video controls></video></div>');
                    $('.uploadVideo' + updateTask).last().css('display', 'inline-block');
                    $(".uploadVideo" + updateTask + " video").last().append('<source src="' + e.target.result + '" type="' + input.files[0].type + '">');
                    $(".uploadVideo" + updateTask + " source").last().attr('data-filename', file.name);
                }
                $("#file-upload-task").val('');
            };
            reader.readAsDataURL(input.files[0]);
        }
    };
    self.createTaskPopup = function (el) {
        var taskId = $(el).closest('#task_card').find('#task_id').text();
        var head = `Create task for Support Ticket #${taskId}`;
        var content = '';
        var opt = '<option value="me">Assign at me</option>';
        if (self.userTeam.inTeam != 0) {
            if (self.userTeam.teamUsers) {
                $.each(self.userTeam.teamUsers, function (k, v) {
                    opt += `<option value="${v.userId}">${v.name} ${v.last}</option>`;
                });
                content = `<p>Create a task directed at me or on another team member.</p>
                        <p>Assign to: <select>${opt}</select></p>
                        <button class="btn btn-default" data-id="${taskId}" onclick="SupportManagerC.ticketToTask(this);">Create Task</button>
                        <p id="ticket_to_task"></p>`;
            } else {
                content = `<p>Create a task directed at me.</p>
                        <p>Assign to: <select>${opt}</select></p>
                        <button class="btn btn-default" data-id="${taskId}" onclick="SupportManagerC.ticketToTask(this);">Create Task</button>
                        <p id="ticket_to_task"></p>`;
            }
        } else {
            content = 'You are not in the same team to pass the task';
        }
        showModal(head, content);
    }
    self.ticketToTask = function (el) {
        var ticketId = $(el).attr('data-id');
        var assignedTo = $(el).closest('.content').find('select').val();
        var data = {}
        data.ticketId = ticketId;
        data.userId = assignedTo;
        AjaxController('ticketToTask', data, adminUrl, 'ticketToTaskHandler', ticketToTaskHandler, true);
    }
    self.ticketToTaskHandler = function (response){
        c(response);
        if(response.data.taskId) {
            $('#ticket_to_task').text(`Ticket was successfully transferred to the task under the identifier № ${response.data.taskId}`);
        }
        if(response.data.mes){
            $('#ticket_to_task').text(response.data.mes);
        }
    }
}

SupportManagerC = new SupportManagerController();