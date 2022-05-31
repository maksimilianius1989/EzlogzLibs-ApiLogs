function employeeTaskController()
{
    var self = this;
    
    self.apiURL = '/db/api/apiEmployeeController.php';
    self.allEmployeeTasksPagination = false;
    
    self.myTeam = [];
    self.allTeams = [];
    self.allModules = [];
    
    self.getModuleInfoById = function(id) {
        var data = {};
        data.name = '';
        $.each(self.allModules, function(k,v){
            $.each(v.modules, function(key,module){
                if (module.id == id) {
                    data = module;
                }
            });
        });
        return data;
    }
    
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
    
    self.initSelect = false;
    
    self.taskTypeInfo = {
        '0':{
            'id': 0,
            'name': '',
            'color': ''
        },
        '1':{
            'id': 1,
            'name': 'Task',
            'color': 'Task'
        },
        '2':{
            'id': 2,
            'name': 'Design bug',
            'color': 'DesignBug'
        },
        '3':{
            'id': 3,
            'name': 'Functional bug',
            'color': 'FunctionalBug'
        },
        '4':{
            'id': 4,
            'name': 'User Request',
            'color': 'UserRequestBug'
        }
    };
    
    self.taskPlatformInfo = {
        '0':{
            'id': 0,
            'name': ''
        },
        '1':{
            'id': 1,
            'name': 'Website'
        },
        '2':{
            'id': 2,
            'name': 'Android'
        },
        '3':{
            'id': 3,
            'name': 'iOs'
        }
    };
    
    self.taskStatusInfo = {
        '0':{
            'id': 0,
            'name': 'Created',
            'color': 'Created'
        },
        '1':{
            'id': 1,
            'name': 'Assigned',
            'color': 'Assigned'
        },
        '2':{
            'id': 2,
            'name': 'In Work',
            'color': 'InWork'
        },
        '3':{
            'id': 3,
            'name': 'On Hold',
            'color': 'OnHold'
        },
        '4':{
            'id': 4,
            'name': 'On Review',
            'color': 'OnReview'
        },
        '5':{
            'id': 5,
            'name': 'In Test',
            'color': 'InTest'
        },
        '8':{
            'id': 8,
            'name': 'Completed',
            'color': 'Completed'
        },
        '9':{
            'id': 9,
            'name': 'Closed',
            'color': 'Closed'
        }
    };
    
    self.taskPriorityInfo = {
        '1':{
            'id': 1,
            'name': 'Low'
        },
        '2':{
            'id': 2,
            'name': 'Middle'
        },
        '3':{
            'id': 3,
            'name': 'High'
        },
        '4':{
            'id': 4,
            'name': 'Trivial'
        },
        '5':{
            'id': 5,
            'name': 'Critical'
        }
    };
    
    self.taskProjectInfo = {
        '0':{
            'id': 0,
            'name': 'Ezlogz'
        },
        '1':{
            'id': 1,
            'name': 'LogIt ELD'
        }
    };
    
    self.userFullNameInput = 0;
    self.changeUserFullNameInput = function() {
        self.userFullNameInput = $('#userFullNameInput select').val();
    }
    
    self.userAsignFullNameInput = 0;
    self.changeUserAsignFullNameInput = function() {
        self.userAsignFullNameInput = $('#userAsignFullNameInput select').val();
    }
    
    self.taskModules = 0;
    self.changeTaskModulesInput = function() {
        self.taskModules = $('#taskModules select').val();
    }
    
    self.keyUpDelay = (function () {
        var timer = 0;
        return function (callback, ms) {
            clearTimeout(timer);
            timer = setTimeout(callback, ms);
        };
    })();
    
    self.createSelector = function(dataArray, params) {
        var optionValueField = typeof params.optionValueField != 'undefined' && params.optionValueField != '' ? params.optionValueField : 'id';
        var optionNameField = typeof params.optionNameField != 'undefined' && params.optionNameField != '' ? params.optionNameField : 'name';
        
        var content = `<select ${typeof params.selectorClass != 'undefined' && params.selectorClass != '' ? `class="${params.selectorClass}"` : ''} ${typeof params.onChange != 'undefined' && params.onChange != '' ? `onchange="${params.onChange}"` : ''}>`;
        var endContent = `</select>`;
        
        var firstOption = typeof params.firstOption != 'undefined' && typeof params.firstOption == 'object' ? 
            `<option ${typeof params.firstOption.value != 'undefined' && params.firstOption.value != '' ? `value="${params.firstOption.value}"` : ''}>
                ${typeof params.firstOption.name != 'undefined' && params.firstOption.name != '' ? `value="${params.firstOption.name}"` : ''}
            </option>` : '';
        
        var option = ``;
        if(typeof params.order != 'undefined' && typeof params.order == 'object') {
            $.each(params.order, function(key, value){
                c(dataArray[value][optionValueField]+' '+params.selectedValue);
                option += `<option value="${dataArray[value][optionValueField]}" ${typeof params.selectedValue != 'undefined' && dataArray[value][optionValueField] == params.selectedValue ? `selected` : ``}>
                            ${dataArray[value][optionNameField]}
                           </option>`;
            });
        } else {
            $.each(dataArray, function(key, value){
                option += `<option value="${value[optionValueField]}" ${typeof params.selectedValue != 'undefined' && value[optionValueField] == params.selectedValue ? `selected` : ``}>
                            ${value[optionNameField]}
                           </option>`;
            });
        }
        
        return content+firstOption+option+endContent;
    }
    
    self.employeeInit = function(){
        if(getCookie('showAll') == '1'){
            $('#show_all').attr('checked','checked');
        }
        if(getCookie('onlyMine') == '1'){
            $('#onlyMine').attr('checked','checked');
        }
        
        self.allEmployeeTasksPagination = new simplePaginator({
            tableId: 'employeeTasks',
            request: 'getAllEmployeeTasksPagination',
            requestUrl: self.apiURL,
            handler: self.getAllEmployeeTasksPaginationHandler,
            perPageList: [25, 50, 100]
        });
    }
    
    self.changeShowAll = function(el) {
        var date = new Date();
        date.setMonth(date.getMonth()+1);
        if($(el).is(":checked")) {
            document.cookie = "showAll=1;expires="+date+";path=/";
        }else{
            document.cookie = "showAll=0;expires="+date+";path=/";
        }
        self.allEmployeeTasksPagination.request();
    }
    
    self.changeOnlyMine = function(el) {
        var date = new Date();
        date.setMonth(date.getMonth()+1);
        if($(el).is(":checked")) {
            document.cookie = "onlyMine=1;expires="+date+";path=/";
        }else{
            document.cookie = "onlyMine=0;expires="+date+";path=/";
        }
        self.allEmployeeTasksPagination.request();
    }
    
    self.createTaskKeyUp = function (el, name) {
        self.keyUpDelay(function () {
            var createTaskFields = getCookie('createTaskFields');
            if (createTaskFields != '') {
                createTaskFields = JSON.parse(createTaskFields);
                createTaskFields[name] = $(el).val().replace(/\;/g,'');
                createCookie('createTaskFields', JSON.stringify(createTaskFields), 1);
            } else {
                var data = {};
                data[name] = $(el).val().replace(/\;/g,'');
                createCookie('createTaskFields', JSON.stringify(data), 1);
            }
        }, 300);
    }
    
    self.showCreateTaskModal = function() {
        var template = `<div id="CreateTaskModal" class="${!$.isFunction($.fn.bsModal) ? 'modal ' : ''} modal-white modal-bs-basic" role="dialog">
          <div class="modal-dialog">
            <!-- Modal content-->
            <div class="modal-content">
              <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal">&times;</button>
                <h4 class="modal-title">Create Task</h4>
              </div>
              <div class="modal-body">
                <div class="row">
                    <div class="col-lg-12">
                        <div class="form-group">
                          <label>Task Name</label>
                          <input type="name" class="form-control input_name" max="200" placeholder="Task Name" onkeyup="employeeTaskC.createTaskKeyUp(this,'name');">
                        </div>
                    </div>
                    <div class="col-lg-3">
                        <div class="form-group">
                          <label>Select Project</label>
                          <select class="form-control input_project" onchange="employeeTaskC.createTaskKeyUp(this,'project');employeeTaskC.changeProject();">
                            <option value="0">Ezlogz</option>
                            <option value="1">LogIt ELD</option>
                          </select>
                        </div>
                    </div>
                    <div class="col-lg-9">
                        <div class="form-group">
                          <label>Select Employee</label>
                          <select class="form-control input_employee" onchange="employeeTaskC.createTaskKeyUp(this,'employee');"></select>
                        </div>
                    </div>
                    <div class="col-lg-4">
                        <select class="form-control input_taskType" onchange="employeeTaskC.createTaskKeyUp(this,'taskType');">
                            <option value="0">Select task type</option>
                            <option value="1">Task</option>
                            <option value="2">Design bug</option>
                            <option value="3">Functional bug</option>
                        </select>
                    </div>
                    <div class="col-lg-4">
                        <select class="form-control input_platform" onchange="employeeTaskC.createTaskKeyUp(this,'platform');employeeTaskC.changePlatform();">
                            <option value="0">Select platform</option>
                            <option value="1">Website</option>
                            <option value="2">Android</option>
                            <option value="3">iOS</option>
                        </select>
                    </div>
                    <div class="col-lg-4">
                        <select class="form-control input_priotity" onchange="employeeTaskC.createTaskKeyUp(this,'priotity');">
                            <option value="4">Trivial</option>
                            <option value="1">Low</option>
                            <option value="2" selected>Middle</option>
                            <option value="3">High</option>
                            <option value="5">Critical</option>
                        </select>
                    </div>
                    <div class="col-lg-12" style="margin-top:15px;">
                        <div class="form-group">
                            <label>Select Similar Task</label>
                            <select class="form-control input_similarTask" id="similarTask"></select>
                        </div>
                    </div>
                    <div class="col-lg-12" style="margin-top:15px;">
                        <div class="form-group">
                            <label>Select Modules</label>
                            <select class="form-control input_modules" onchange="employeeTaskC.createTaskKeyUp(this,'modules');"></select>
                        </div>
                    </div>
                    <div class="col-lg-12">
                        <div class="form-group">
                            <label>Description</label>
                            <textarea class="form-control input_description" rows="5" onkeyup="employeeTaskC.createTaskKeyUp(this,'description');"></textarea>
                        </div>
                    </div>
                    <div class="col-lg-12" style="padding-top:15px;">
                        <button class="btn btn-default" onclick="employeeTaskC.fileUpload();">Add file</button>
                        <input type="file" accept="*" onchange="employeeTaskC.getUploadFile(this);" id="file-upload-task" multiple>
                        <div class="row uploadBox" style="margin:5px -15px 0 -15px;"></div>
                    </div>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
                <button type="button" class="btn btn-default" onclick="employeeTaskC.createTask();">Create Task</button>
              </div>
            </div>

          </div>
        </div>`;
        
        if($('.content').length > 0) {
            $('.content').append(template);
        }
        
        var createTaskFields = getCookie('createTaskFields');
        if (createTaskFields != '') {
            createTaskFields = JSON.parse(createTaskFields);
            if (typeof createTaskFields['name'] != 'undefined') {
                $('#CreateTaskModal .input_name').val(createTaskFields['name']);
            }
            if (typeof createTaskFields['project'] != 'undefined') {
                $('#CreateTaskModal .input_project').val(createTaskFields['project']);
            }
            if (typeof createTaskFields['employee'] != 'undefined') {
                $('#CreateTaskModal .input_employee').empty().append(self.genereteSelect({'selectedUserId':createTaskFields['employee']}));
            } else {
				$('#CreateTaskModal .input_employee').empty().append(self.genereteSelect());
			}
            if (typeof createTaskFields['taskType'] != 'undefined') {
                $('#CreateTaskModal .input_taskType option[value="'+createTaskFields['taskType']+'"]').attr('selected', true);
            }
            if (typeof createTaskFields['platform'] != 'undefined') {
                c(createTaskFields['platform']);
                $('#CreateTaskModal .input_platform option[value="'+createTaskFields['platform']+'"]').attr('selected', true);
            }
            if (typeof createTaskFields['priotity'] != 'undefined') {
                $('#CreateTaskModal .input_priotity option[value="'+createTaskFields['priotity']+'"]').attr('selected', true);
            }
            if (typeof createTaskFields['modules'] != 'undefined') {
                if (typeof createTaskFields['platform'] != 'undefined') {
                    $('#CreateTaskModal .input_modules').empty().append(self.genereteModuleSelect({'selectedUserId':createTaskFields['modules'], 'showOnly':createTaskFields['platform']}));
                } else {
                    $('#CreateTaskModal .input_modules').empty().append(self.genereteModuleSelect({'selectedUserId':createTaskFields['modules']}));
                }
            } else {
                $('#CreateTaskModal .input_modules').empty().append(self.genereteModuleSelect({'showOnly':createTaskFields['platform']}));
            }
            if (typeof createTaskFields['description'] != 'undefined') {
                $('#CreateTaskModal .input_description').val(createTaskFields['description']);
            }
        } else {
            $('#CreateTaskModal .input_employee').empty().append(self.genereteSelect());
            $('#CreateTaskModal .input_modules').empty().append(self.genereteModuleSelect());
        }
        
        if ($.isFunction($.fn.bsModal)) {
            $('.modal-bs-basic').bsModal('show');
        } else {
            $('.modal-bs-basic').modal('show');
        }
        
        self.getTasksList();
    }
    
    self.getTasksList = function(reqData = {}) {
        var project = $('#CreateTaskModal .input_project').val();
        if ($('#TaskCard .input_project').length > 0) {
            project = $('#TaskCard .input_project').val();
        }
        var platform = $('#CreateTaskModal .input_platform').val();
        if ($('#TaskCard .input_taskPlatform').length > 0) {
            platform = $('#TaskCard .input_taskPlatform').val();
        }

        if (platform == '0') {
            $('#create_tr_tasks').empty().append('<option value="">Select Task</option>');
            return false;
        } else {
            var data = {};
            data.reqData = reqData;
            data.project = (project == 0 ? 1 : 0);
            data.platform = platform;

            AjaxCall({action: 'getListTasks', data: data, url: '/db/api/apiEmployeeController/', successHandler: self.getTasksListHandler, errorHandler: self.getTasksListHandler});
        }
    }

    self.getTasksListHandler = function(response, action, requestData) {
        c(action);
        c(response);
        c(requestData.reqData.length);
        if (response.code == '000') {
            $('#similarTask').empty().append('<option value="">Select Task</option>');

            var result = response.data.result;
            $.each(result.tasks, function (key, task) {
                $('#similarTask').append('<option value="' + task.id + '">(' + task.id + ') ' + task.name + '</option>');
            });
            if (typeof requestData.reqData.similarTaskId != 'undefined') {
                $('#similarTask option[value="' + requestData.reqData.similarTaskId + '"]').attr('selected', 'true');
            }
        }
    }
    
    self.changeProject = function() {
        self.getTasksList();
    }
    
    self.changePlatform = function() {
        $('#CreateTaskModal .input_modules').empty().append(self.genereteModuleSelect({'showOnly':$('#CreateTaskModal .input_platform').val()}));
        $('#TaskCard .input_taskModule').empty().append(self.genereteModuleSelect({'showOnly':$('#TaskCard .input_taskPlatform').val()}));
        self.getTasksList();
    }
    
    self.createTask = function() {
        $('#CreateTaskModal select, #CreateTaskModal input, #CreateTaskModal textarea').removeClass('inpurError');
        var name = $.trim($('#CreateTaskModal .input_name').val()),
            userId = $('#CreateTaskModal .input_employee').val(),
            type = $('#CreateTaskModal .input_taskType').val(),
            platform = $('#CreateTaskModal .input_platform').val(),
            priority = $('#CreateTaskModal .input_priotity').val(),
            similarTask = $('#CreateTaskModal .input_similarTask').val(),
            moduleId = $('#CreateTaskModal .input_modules').val(),
            project = $('#CreateTaskModal .input_project').val(),
            message = $.trim($('#CreateTaskModal .input_description').val()),
            attachmentsInfo = [];
        if(type == 0 || platform == 0 || name == '' || message == '')
        {
            type == 0 ? $('#CreateTaskModal .input_taskType').addClass('inpurError') : '';
            platform == 0 ? $('#CreateTaskModal .input_platform').addClass('inpurError') : '';
            name == '' ? $('#CreateTaskModal .input_name').addClass('inpurError') : '';
            message == '' ? $('#CreateTaskModal .input_description').addClass('inpurError') : '';
            return false;
        }
        $('.uploadImg img').each(function()
        {
            var info = {};
            info.img = $(this).attr('src');
            info.imgName = $(this).attr('data-filename');
            attachmentsInfo.push(info);
        });
        $('.uploadVideo source').each(function()
        {
            var info = {};
            info.video = $(this).attr('src');
            info.videoName = $(this).attr('data-filename');
            attachmentsInfo.push(info);
        });
        $('.uploadFile p').each(function()
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
        $('.create_task_button').prop("disabled", true);
        var data = {userId:userId,description:JSON.stringify(description), name:name, type: type, platform: platform, priority: priority, moduleId:moduleId, 'project':project, 'similarTaskId':similarTask};
        setPreloader(`<div id="preloader"><div id="loader"></div></div>`);
        AjaxController('createTask', data, self.apiURL, self.createTaskHandler, errorBasicHandler, true);
    }
    
    self.createTaskHandler = function(response) {
        eraseCookie('createTaskFields');
        deletePreloader('preloader');
        $('#CreateTaskModal').modal('hide');
        self.allEmployeeTasksPagination.request();
    }
    
    self.fileUpload = function() {
        $('#file-upload-task').click();
    }
    
    self.deleteUploadFile = function(el) {
        $(el).parent().remove();
        $("#file-upload-task").val('');
    }
    
    self.getUploadFile = function(input) {
        $.each(input.files, function(key, oneFile){
            if(oneFile.size > 200000000) {
                return false;
            }
            var file = oneFile,
                reader = new FileReader();
            var updateTask = $('#CreateTaskModal').length > 0 ? '' : '_updateTask';
            if(oneFile.type.includes("image")) {
                reader.onload = function(e) {
                    $('.uploadBox'+updateTask).append('<div class="uploadImg'+updateTask+'">\n\
                    <button class="btn btn-default deleteFile" onclick="employeeTaskC.deleteUploadFile(this);">&times;</button>\n\
                    <img src="" alt="image"></div>');
                    $('.uploadImg'+updateTask).last().css('display','inline-block');
                    $('.uploadImg'+updateTask+' img').last().attr('src', e.target.result);
                    $('.uploadImg'+updateTask+' img').last().attr('data-filename', file.name);
                    $("#file-upload-task").val('');
                }
            } else if(oneFile.type.includes("video")) {
                reader.onload = function(e) {
                    $('.uploadBox'+updateTask).append('<div class="uploadVideo'+updateTask+'"> \n\
                    <button class="btn btn-default deleteFile" onclick="employeeTaskC.deleteUploadFile(this);">&times;</button>\n\
                    <video controls></video></div>');
                    $('.uploadVideo'+updateTask).last().css('display','inline-block');
                    $(".uploadVideo"+updateTask+" video").last().append('<source src="'+e.target.result+'" type="'+oneFile.type+'">');
                    $(".uploadVideo"+updateTask+" source").last().attr('data-filename', file.name);
                    $("#file-upload-task").val('');
                }
            } else {
                reader.onload = function(e) {
                    $('.uploadBox'+updateTask).append('<div class="uploadFile'+updateTask+'">\n\
                    <button class="btn btn-default deleteFile" onclick="employeeTaskC.deleteUploadFile(this);">&times;</button>\n\
                    <p src=""></p></div>');
                    $('.uploadFile'+updateTask).last().css('display','inline-block');
                    $('.uploadFile'+updateTask+' p').last().attr('src', e.target.result);
                    $('.uploadFile'+updateTask+' p').last().attr('data-filename', file.name).text(file.name);
                    $("#file-upload-task").val('');
                }
            }
            reader.readAsDataURL(oneFile);
        });
    }
    
    self.getAllEmployeeTasksPaginationHandler = function(response, tableId) {
        self.myTeam = response.data.result.myTeam.teams;
        self.allTeams = response.data.result.allTeam;
        self.allModules = response.data.result.allModules;
        
        var body = $('#' + tableId).find('tbody')
        body.empty();
        
        $.each(response.data.result.tasks, function (key, row) {
            body.append(self.getEmployeeTableLine(row));
        });
        
        /*if (!self.initSelect) {
            self.initSelect = true;*/
            $('#userFullNameInput .paginationInput').empty().append(self.genereteSelect({'selectedUserId':self.userFullNameInput}));
            $('#userAsignFullNameInput .paginationInput').empty().append(self.genereteSelect({'selectedUserId':self.userAsignFullNameInput}));
            $('#taskModules .paginationInput').empty().append(self.genereteModuleSelect({'selectedUserId':self.taskModules}));
        //}
    }
    
    self.getEmployeeTableLine = function(value) {
        return `<tr data-id="${value.id}" data-scopeId="${value.scopeId}" onclick="employeeTaskC.getTaskById(${value.id});" class="${value.toMe == true ? 'mine' : 'not_mine'} task_icon">
                   <td><input type="checkbox" name="taskCheck" value="${value.id}" onclick="employeeTaskC.checked(this, event);"></td>
                   <td>${value.id}</td>
                   <td>${value.userFullName}</td>
                   <td>${value.name}</td>
                   <td class="${self.taskTypeInfo[value.type].color}">${self.taskTypeInfo[value.type].name}</td>
                   <td>${self.taskPlatformInfo[value.platform].name}</td>
                   <td>${self.getModuleInfoById(value.moduleId).name}</td>
                   <td>${value.userAsignFullName}</td>
                   <td class="${self.taskStatusInfo[value.currentStatus].color}">${self.taskStatusInfo[value.currentStatus].name}</td>
                   <td>${timeFromSecToUSAString(value.updateTime)}</td>
                   <td>${self.taskPriorityInfo[value.priority].name}</td>
                   <td>${self.taskProjectInfo[value.project].name}</td>
               </tr>`;
    }
    
    self.getTaskById = function(taskId) {
        var data = {};
        data.taskId = taskId;
        AjaxController('getTaskById', data, self.apiURL, self.getTaskByIdHandler, errorBasicHandler, true);
    }
    
    self.updateTask = function() {
        $('#TaskCard select, #TaskCard input, #TaskCard textarea').removeClass('inpurError');
        var taskId = $('#TaskCard').attr('data-taskId'),
            name = $.trim($('#TaskCard .input_name').val()),
            status = $('#TaskCard .input_taskStatus').val(),
            type = $('#TaskCard .input_taskType').val(),
            spend = $('#TaskCard .input_spentTime').val(),
            platform = $('#TaskCard .input_taskPlatform').val(),
            estimate = $('#TaskCard .input_estimatedTime').val(),
            priority = $('#TaskCard .input_taskPriority').val(),
            assignedTo = $('#TaskCard .input_assignedTo').val(),
            moduleId = $('#TaskCard .input_taskModule').val(),
            project = $('#TaskCard .input_project').val(),
            similarTask = $('#TaskCard .input_similarTask').val(),
            message = $.trim($('#TaskCard .input_description').val()),
            attachmentsInfo = [];
    
        if(type == 0 || platform == 0 || name == '')
        {
            type == 0 ? $('#TaskCard .input_taskType').addClass('inpurError') : '';
            platform == 0 ? $('#TaskCard .input_taskPlatform').addClass('inpurError') : '';
            name == '' ? $('#TaskCard .input_name').addClass('inpurError') : '';
            return false;
        }
        
        $('.uploadImg_updateTask img').each(function()
        {
            var info = {};
            info.img = $(this).attr('src');
            info.imgName = $(this).attr('data-filename');
            attachmentsInfo.push(info);
        });
        $('.uploadVideo_updateTask source').each(function()
        {
            var info = {};
            info.video = $(this).attr('src');
            info.videoName = $(this).attr('data-filename');
            attachmentsInfo.push(info);
        });
        $('.uploadFile_updateTask p').each(function()
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
        
        var data = {employeeId:assignedTo, type:type, priority:priority, platform:platform, description:JSON.stringify(description), name:name, status:status, taskId:taskId, spent:spend, estimated:estimate, 'moduleId':moduleId, 'project':project, 'similarTaskId':similarTask};
        setPreloader(`<div id="preloader">
                        <div id="loader"></div>
                    </div>`);
        AjaxController('updateTask', data, self.apiURL, self.updateTaskHandler, errorBasicHandler, true);
    }
    
    self.updateTaskHandler = function(response) {
        c(response);
        deletePreloader('preloader');
        $('#TaskCard').modal('hide');
        self.allEmployeeTasksPagination.request();
    }
    
    self.getUpdateTaskHistoryPopap = function(id) {
        var message = $('#TaskCard .one_history[data-historyid="'+id+'"] .taskComment').html();
        var template = `<div id="UpdateTaskHistory" class="${!$.isFunction($.fn.bsModal) ? 'modal ' : ''} modal-white modal-bs-basic" data-taskHistoryId="${id}" role="dialog">
          <div class="modal-dialog modal-lg" id="contentBox">
            <!-- Modal content-->
            <div class="modal-content">
                <div class="modal-header">
                  <button type="button" class="close" data-dismiss="modal">&times;</button>
                  <h4 class="modal-title">Task History Update #${id}</h4>
                </div>
                <div class="modal-body">
                    <div class="row task_info_box" style="display:flex;flex-wrap:wrap;">
                        <div class="col-lg-12" style="padding-top:15px;">
                            <div class="form-group">
                                <label>Description</label>
                                <textarea class="form-control input_description" rows="5">${message.replace(/<br\s*[\/]?>/gi, "\n")}</textarea>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-default" onclick="employeeTaskC.updateTaskHistory();">Update</button>
                    <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
                </div>
            </div>

          </div>
        </div>`;
        
        if($('.content').length > 0) {
            $('.content').append(template);
        }
        
        if ($.isFunction($.fn.bsModal)) {
            $('.modal-bs-basic').bsModal('show');
        } else {
            $('.modal-bs-basic').modal('show');
        }
    }
    
    self.updateTaskHistory = function() {
        $('#UpdateTaskHistory textarea').removeClass('inpurError');
        
        var taskHistoryId = $('#UpdateTaskHistory').attr('data-taskHistoryId');
        var message = $('#UpdateTaskHistory .task_info_box .input_description').val();
        
        if(message == ''){
            $('#UpdateTaskHistory .task_info_box .input_description').addClass('inpurError');
            return false;
        }
        
        var data = {'taskHistoryId':taskHistoryId, 'message':message}
        c(data);
        AjaxController('updateTaskHistory', data, self.apiURL, self.updateTaskHistoryHandler, errorBasicHandler, true);
    }
    
    self.updateTaskHistoryHandler = function(response) {
        c(response);
        var data = response.data;
        var description = $.parseJSON(data.description);
        $('#TaskCard .one_history[data-historyid="'+data.id+'"] .taskComment').empty().html(description.message.replace(/\n/g, "<br>"));
        $('#UpdateTaskHistory').modal('hide');
    }
    
    self.getTaskByIdHandler = function(response) {
        c(response);
        var data = response.data;
        
        var template = `<div id="TaskCard" class="${!$.isFunction($.fn.bsModal) ? 'modal ' : ''} modal-white modal-bs-basic" data-taskId="${data.id}" role="dialog">
          <div class="modal-dialog modal-lg" id="contentBox">
            <!-- Modal content-->
            <div class="modal-content">
                <div class="modal-header">
                  <button type="button" class="close" data-dismiss="modal">&times;</button>
                  <h4 class="modal-title" style="float:left;cursor:pointer;" title="Click to copy" onclick="copyToClipboard('copyTaskLink');">Task #${data.id} <i class="fa fa-link"></i></h4>
                  <div id="copyTaskLink" style="display:none;">${MAIN_LINK+'/dash/tasks/?taskId='+data.id}</div>
                </div>
                <div class="modal-body">
                    <div class="row task_info_box" style="display:flex;flex-wrap:wrap;">
                        <div class="col-lg-12">
                            <div class="form-group">
                                <label>Name</label>
                                <input type="text" value="${self.escapeHtml(data.name)}" max="200" class="form-control input_name" placeholder="Name">
                            </div>
                        </div>

                        <div class="col-lg-6">
                            <div class="form-group">
                                <label>Creator</label>
                                <input type="text" value="${data.creator}" class="form-control" disabled>
                            </div>
                        </div>
        
                        <div class="col-lg-6">
                            <div class="form-group">
                                <label>Project</label>
                                ${self.createSelector(self.taskProjectInfo, {
                                    'selectorClass': 'form-control input_project',
                                    'selectedValue': data.project,
                                    'onChange': "employeeTaskC.createTaskKeyUp(this,'project');employeeTaskC.changeProject();"
                                })}
                            </div>
                        </div>
        
                        <div class="col-lg-6">
                            <div class="form-group">
                                <label>Task Status</label>
                                ${self.createSelector(self.taskStatusInfo, {
                                    'selectorClass': 'form-control input_taskStatus',
                                    'selectedValue': data.currentStatus
                                })}
                            </div>
                        </div>

                        <div class="col-lg-6">
                            <div class="form-group">
                                <label>Task Type</label>
                                ${self.createSelector(self.taskTypeInfo, {
                                    'selectorClass': 'form-control input_taskType',
                                    'selectedValue': data.type
                                })}
                            </div>
                        </div>
        
                        <div class="col-lg-6">
                            <div class="form-group">
                                <label>Spent Time (hours)</label>
                                <input type="number" value="${data.history[0].spentTime}" data-mask="0" data-mask-reverse="true" class="form-control input_spentTime">
                            </div>
                        </div>

                        <div class="col-lg-6">
                            <div class="form-group">
                                <label>Task Platform</label>
                                ${self.createSelector(self.taskPlatformInfo, {
                                    'selectorClass': 'form-control input_taskPlatform',
                                    'onChange':'employeeTaskC.changePlatform();',
                                    'selectedValue': data.platform
                                })}
                            </div>
                        </div>
        
                        <div class="col-lg-6">
                            <div class="form-group">
                                <label>Estimated Time (hours)</label>
                                <input type="number" value="${data.history[0].estimatedTime}" data-mask="0" data-mask-reverse="true" class="form-control input_estimatedTime">
                            </div>
                        </div>

                        <div class="col-lg-6">
                            <div class="form-group">
                                <label>Task Priority</label>
                                ${self.createSelector(self.taskPriorityInfo, {
                                    'selectorClass': 'form-control input_taskPriority',
                                    'order': [4,1,2,3,5],
                                    'selectedValue': data.priority
                                })}
                            </div>
                        </div>
        
                        <div class="col-lg-6">
                            <div class="form-group">
                                <label>Assigned to</label>
                                <select class="form-control input_assignedTo">
                                    ${self.genereteSelect({
                                        'selectedUserId': data.history[0].employeeId
                                    })}
                                </select>
                            </div>
                        </div>
        
                        <div class="col-lg-6">
                            <div class="form-group">
                                <label>Module</label>
                                <select class="form-control input_taskModule">
                                    ${self.genereteModuleSelect({'selectedUserId':data.moduleId,'showOnly':data.platform})}
                                </select>
                            </div>
                        </div>
        
                        <div class="col-lg-12" style="margin-top:15px;">
                            <div class="form-group">
                                <label onclick="employeeTaskC.openSimilarTask(${data.similarTaskId});" style="cursor:pointer;">Select Similar Task <i class="fa fa-link"></i></label>
                                <select class="form-control input_similarTask" id="similarTask"></select>
                            </div>
                        </div>
        
                        <div class="col-lg-12" style="padding-top:15px;">
                            <div class="form-group">
                                <label>Description</label>
                                <textarea class="form-control input_description" rows="5"></textarea>
                            </div>
                        </div>
                        
                        <div class="col-lg-12" style="padding-top:15px;">
                            <button class="btn btn-default" onclick="employeeTaskC.fileUpload();">Add file</button>
                            <input type="file" accept="*" onchange="employeeTaskC.getUploadFile(this);" id="file-upload-task" multiple>
                            <div class="row uploadBox_updateTask" style="margin:5px -15px 0 -15px;"></div>
                        </div>
                        
                        <div id="history_box" class="col-lg-12">
                            
                        </div> 
                        
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-default" onclick="employeeTaskC.updateTask();">Update</button>
                    <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
                </div>
            </div>

          </div>
        </div>`;
        
        if($('.content').length > 0) {
            $('.content').append(template);
        }
        
        var history = data.history.reverse();
        var desc = '';
        var status = 0;
        var assigned = 0;
        var estimated = 0;
        var spent = 0;
        
        $.each(history, function(key, historyItem){
            var historyText = '';
            var description = $.parseJSON(historyItem.description);
            if(key == 0){
                desc = description.message;
                status = historyItem.status;
                assigned = historyItem.employeeId;
                historyText += 'Task: <p class="taskComment">' +desc.replace(/\r\n|\r|\n/g,"<br />")+'</p>';
                if(assigned != 0){
                  historyText += 'Assigned to: ' +self.getUserNameFromId(assigned)+'<br>';  
                }
                if(typeof description.attachments !== 'undefined' && description.attachments.length > 0)
                {
                    historyText += 'Attachment: <div class = "attachmentsBox">';
                    var attachments = description.attachments;
                    for(var i = 0, lenI = attachments.length; i < lenI; i++)
                    {
                        if(attachments[i].img)
                        {
                            historyText += '<a data-popup="img" onclick="employeeTaskC.attachmentPopup(this)" href="javascript:;"><img class = "attachmentImg" src = "'+MAIN_LINK+'/dash/view'+attachments[i].img+'" alt = "attachment"></a>';                                                     

                        }
                        else if(attachments[i].video)
                        {
                            historyText += '<div class = "videoBox"><a data-popup="source" href="javascript:;" onclick="employeeTaskC.attachmentPopup(this)"><img src = "/dash/assets/img/playBut.png"><video class = "attachmentVideo"><source src = "'+MAIN_LINK+'/dash/view'+attachments[i].video+'"></source></video></a></div>';                            
                          
                        }
                        else {
                            var fileNameIndex = attachments[i].file.lastIndexOf("/") + 1;
                            var filename = attachments[i].file.substr(fileNameIndex);
                            historyText += '<a href = "'+MAIN_LINK+'/dash/view'+attachments[i].file+'" target="_blank" src = "'+MAIN_LINK+'/dash/view'+attachments[i].file+'" alt = "attachment">'+filename+'</a>';
                        }
                    }
                    historyText += '';
                }
            }else{
                if(desc != description.message ){
                    if(description.message != '' && typeof description.message !== 'undefined')
                        historyText += 'Comment: <p class="taskComment">' +description.message.replace(/\r\n|\r|\n/g,"<br />")+'</p>';
                    desc = description.message;
                }
                if(estimated != historyItem.estimatedTime){
                    historyText += 'Estimated: ' +historyItem.estimatedTime+'<br>';  
                    estimated = historyItem.estimatedTime;
                }
                if(spent != historyItem.spentTime){
                    historyText += 'Spent: ' +historyItem.spentTime+'<br>';  
                    spent = historyItem.spentTime;
                }
                if(status != historyItem.status){
                    var statusName = '';
                    switch(historyItem.status)
                    {
                        case 0: statusName = "Created";break;
                        case 1: statusName = "Assigned";break;
                        case 2: statusName = "In Work";break;
                        case 3: statusName = "On Hold";break;
                        case 4: statusName = "On Review";break;
                        case 5: statusName = "In Test";break;
                        case 8: statusName = "Completed";break;
                        case 9: statusName = "Close task";break;
                    }
                    historyText += 'Status changed to: ' +statusName+'<br>';  
                    status = historyItem.status;
                }
                if(assigned != historyItem.employeeId){
                    historyText += 'Assigned to: ' +self.getUserNameFromId(historyItem.employeeId)+'<br>';  
                    assigned = historyItem.employeeId;
                }
                if(typeof description.attachments !== 'undefined' && description.attachments.length > 0)
                {
                    historyText += 'Attachment: <div class = "attachmentsBox">';
                    var attachments = description.attachments;
                    for(var i = 0, lenI = attachments.length; i < lenI; i++)
                    {
                        if(attachments[i].img)
                        {
                            historyText += '<a data-popup="img" onclick="employeeTaskC.attachmentPopup(this)" href="javascript:;"><img class = "attachmentImg" src = "'+MAIN_LINK+'/dash/view'+attachments[i].img+'" alt = "attachment"></a>';
                        }
                        else if(attachments[i].video)
                        {
                            historyText += '<div class = "videoBox"><a data-popup="source" href="javascript:;" onclick="employeeTaskC.attachmentPopup(this)"><img src = "/dash/assets/img/playBut.png"><video class = "attachmentVideo"><source src = "'+MAIN_LINK+'/dash/view'+attachments[i].video+'"></source></video></a></div>';                            
                        }
                        else {
                            var fileNameIndex = attachments[i].file.lastIndexOf("/") + 1;
                            var filename = attachments[i].file.substr(fileNameIndex);
                            historyText += '<a href = "'+MAIN_LINK+'/dash/view'+attachments[i].file+'" target="_blank" src = "'+MAIN_LINK+'/dash/view'+attachments[i].file+'" alt = "attachment">'+filename+'</a>';
                        }
                    }
                    historyText += '';
                }
            }
            c(historyText);
            if(historyText != ''){
                var byWhom = self.getUserNameFromId(historyItem.userId);
                var mayEdit = '';
                if(curUserId == historyItem.userId && description.message != ''){
                    mayEdit = `<br><span class="btn btn-default" onclick="employeeTaskC.getUpdateTaskHistoryPopap(${historyItem.id});">Edit</span>`
                }
                $('#history_box').append('<div class="one_history" data-historyId="'+historyItem.id+'"><span id = "oneHistoryBox">'+historyText+'</span><div id="by_whom"><span>'+byWhom+'</span><br><span> '+historyItem.dateTime+'</span>'+mayEdit+'</div></div>');
            }
        });
        
        self.rightToCloseByUserID(curUserId, data);
        
        if ($.isFunction($.fn.bsModal)) {
            $('.modal-bs-basic').bsModal('show');
        } else {
            $('.modal-bs-basic').modal('show');
        }
        
        var reqData = {'similarTaskId': data.similarTaskId};
        self.getTasksList(reqData);
    }
    
    self.openSimilarTask = function(similarTaskId) {
        if (similarTaskId == 0) {
            return false;
        }
        $('#TaskCard').remove();
        
        self.getTaskById(similarTaskId);
    }
    
    self.getUserNameFromId = function(userId) {
        var userFullName = '';
        if (self.allTeams.length > 0) {
            $.each(self.allTeams, function(key, team){
                $.each(team.members, function(key2, member){
                    if(member.userId == userId){
                        userFullName = member.name+' '+member.last;
                    }
                });
            });
        }
        return userFullName;
    }
    
    self.genereteSelect = function(params = {}) {
        var content = `<option></option>`;
        if (self.allTeams.length > 0) {
            $.each(self.allTeams, function(key, team){
                content += `<optgroup label="${team.name}">`;
                $.each(team.members, function(key2, member){
                    content += `<option value="${member.userId}" ${typeof params.selectedUserId != 'undefined' && params.selectedUserId == member.userId ? 'selected' : ''}>${member.name} ${member.last}</option>`
                });
                content += `</optgroup>`;
            });
        }
        return content;
    }
    
    self.genereteModuleSelect = function(params = {}) {
        var content = `<option></option>`;
        if (self.allModules.length > 0) {
            $.each(self.allModules, function(key, team){
                if (typeof params.showOnly == 'undefined' || params.showOnly == 0 || params.showOnly == team.id) {
                    content += `<optgroup label="${team.name}" data-platform="${team.id}">`;
                    $.each(team.modules, function(key2, member){
                        content += `<option value="${member.id}" ${typeof params.selectedUserId != 'undefined' && params.selectedUserId == member.id ? 'selected' : ''}>${member.name}</option>`
                    });
                    content += `</optgroup>`;
                }
            });
        }
        return content;
    }
    
    self.escapeHtml = function(string) {
        return String(string).replace(/[&<>"'`=\/]/g, function (s) {
            return self.entityMap[s];
        });
    }
    
    self.attachmentPopup = function(element){
	var type = $(element).attr('data-popup');    
	var popupSource = $(element).find(type).attr('src');
        var windowHeight = $(window).height();
	var contentHeight = windowHeight - windowHeight*21.2/100;
	var popupContent = ''; 
	if(type=='img'){
            popupContent += '<img src="'+popupSource+'" style="width:100%;max-height: '+contentHeight+'px"/>';
	} else {
            popupContent += '<video autoplay style="max-height: '+contentHeight+'px" controls>\n\
		<source type="video/webm" src="'+popupSource+'">\n\
		<source type="video/mp4" src="'+popupSource+'">\n\
		<a href="'+popupSource+'" target="_blank">Download video</a>\n\
		</video><br>';
	}
	var popupTitle = 'Preview';
	self.showTaskModal(popupTitle, popupContent, popupSource);
	return false;
    }
    
    self.showTaskModal = function(title, message, link) {
        title = title != '' && typeof title !== 'undefined' ? title : '';
        message = message != '' && typeof message !== 'undefined' ? message : '';
        
        var template = `<div id="TaskHistoryPreview" class="${!$.isFunction($.fn.bsModal) ? 'modal ' : ''} modal-white modal-bs-basic" role="dialog">
          <div class="modal-dialog modal-lg" id="contentBox">
            <!-- Modal content-->
            <div class="modal-content">
                <div class="modal-header">
                  <a href="${link}" id="downloadIcon" download><i class="fa fa-cloud-download" aria-hidden="true"></i></a>
                  <button type="button" class="close" data-dismiss="modal">&times;</button>
                  <h4 class="modal-title">${title}</h4>
                </div>
                <div class="modal-body">
                    ${message}
                </div>
                <div class="modal-footer">
                    <a type="button" class="btn btn-default" href="${link}" download>Download</a>
                    <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
                </div>
            </div>
          </div>
        </div>`;
        
        if($('.content').length > 0) {
            $('.content').append(template);
        }
        
        if ($.isFunction($.fn.bsModal)) {
            $('.modal-bs-basic').bsModal('show');
        } else {
            $('.modal-bs-basic').modal('show');
        }
    }
    
    self.getTeamInfoByUserId = function (userId, teamId = 0) {
        var ret = false;
        if (self.allTeams.length > 0) {
            $.each(self.allTeams, function (key, team) {
                if (team.teamLeadId == userId && team.id != teamId) {
                    ret = self.allTeams[key];
                }
                $.each(team.members, function (key2, member) {
                    if (member.userId == userId && team.id != teamId) {
                        ret = self.allTeams[key];
                    }
                });
            });
        }
        return ret;
    }
    
    self.rightToCloseByUserID = function (userId, data) {
        var teamInfo = self.getTeamInfoByUserId(userId);
        if(userId == data.creatorId){
            return true;
        }
        var teamInfoCreator = self.getTeamInfoByUserId(data.creatorId);
        if(teamInfo.viewAll == 1) {
            return true;
        }
        $('#TaskCard .input_taskStatus option[value="9"]').remove();
    }
    
    self.checked = function (el, e) {
        e.stopPropagation();
        if ($('#employeeTasks tbody input[name="taskCheck"]:checked').length > 0) {
            $('.table_wrap .button-block button.add_to_scope, .table_wrap .button-block button.change_status').show();
        } else {
            $('.table_wrap .button-block button.add_to_scope, .table_wrap .button-block button.change_status').hide();
        }
    }
    
    self.showChangeStatusTaskModal = function() {
        var title = 'Change task statuses';
        var content = '<p>Change status to</p>\n\
                    <select class="employee">\n\
                        '+self.genereteSelect()+'\n\
                    </select>\n\
                    <select class="status">\n\
                        <option value="1">Assigned</option>\n\
                        <option value="2">In Work</option>\n\
                        <option value="3">On Hold</option>\n\
                        <option value="4">On Review</option>\n\
                        <option value="5">In Test</option>\n\
                        <option value="8">Completed</option>\n\
                        <option value="9">Closed</option>\n\
                    </select>';
        
        showModal(title, content, 'changeTaskStatusesModal', '', {
            footerButtons: '<button class="btn btn-default" data-dismiss="modal" onclick="employeeTaskC.changeTaskStatuses();">Change status</button>'
        });
    }
    
    self.changeTaskStatuses = function () {
        var data = {};
        
        data.employeeId = $('#changeTaskStatusesModal select.employee').val();
        data.status = $('#changeTaskStatusesModal select.status').val();
        data.tasks = [];
        
        $.each($('#employeeTasks tbody input[name="taskCheck"]:checked'), function(key, task){
            data.tasks.push($(task).val());
        });
        
        c(data);
        
        AjaxCall({url: self.apiURL, action: 'changeTaskStatuses', data: data, successHandler: self.changeTaskStatusesHandler, errorHandler: self.changeTaskStatusesHandler});
    }
    
    self.changeTaskStatusesHandler = function (response) {
        c(response);
        window.location.href = '/dash/tasks/';
    }
    
    self.addTasksToScopeModal = function () {
        AjaxCall({action: 'getAllScopes', url: self.apiURL, successHandler: self.addTasksToScopeModalHandler, errorHandler: self.addTasksToScopeModalHandler});
    }
    
    self.addTasksToScopeModalHandler = function (response) {
        c(response);
        
        var title = 'Add tasks to scope';
        
        var scopeSelect = '<select class="scope">';
        $.each(response.data.result, function (k, oneScope) {
            if (oneScope.status != 2) {
                scopeSelect += '<option value="'+oneScope.id+'">'+oneScope.name+'</option>'
            }
        });
        scopeSelect += '</select>';
        
        var content = '<p>Add to this scope</p>' + scopeSelect;
        
        showModal(title, content, 'addTaskToScopeModal', '', {
            footerButtons: '<button class="btn btn-default" data-dismiss="modal" onclick="employeeTaskC.addTasksToScope();">Add to scope</button>'
        });
    }
    
    self.addTasksToScope = function() {
        var data = {};
        
        data.scopeId = $('#addTaskToScopeModal select.scope').val();
        data.tasks = [];
        if ($('#employeeTasks').length != 0) {
            $.each($('#employeeTasks tbody input[name="taskCheck"]:checked'), function(key, task){
                if (typeof $(task).closest('tr').attr('data-scopeId') == 'undefined' || $(task).closest('tr').attr('data-scopeId') == 'null') {
                    data.tasks.push($(task).val());
                }
            });
        } else if ($('.oneModuleInfoBlock').length != 0) {
            
        }
        
        c(data);
        
        AjaxCall({action: 'addTaskToScope', data: data, url: self.apiURL, successHandler: self.addTasksToScopeHandler, errorHandler: self.addTasksToScopeHandler});
    }
    
    self.addTasksToScopeHandler = function(response) {
        c(response);
        window.location.href = '/dash/tasks/';
    }
    
}
employeeTaskC = new employeeTaskController();