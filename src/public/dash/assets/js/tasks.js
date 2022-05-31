$().ready(function()
{
    $('body').off('click', '.task_icon').on('click', '.task_icon', function()
    {
        $('.task_result').removeClass('error').text('');
        $('.result').removeClass('error').text('');
        var taskId = $(this).attr('data-id'),
            task = '';
            
        $.each(tasks, function(key, taskInfo){
            if(taskInfo.id == taskId){
                task = taskInfo;
            }
        });
        if(task.creatorId == userId){
            $('#close_task_opt').show();
        }else{
            $('#close_task_opt').hide();
        }
        
        $('#task_id').text(task.id)
        $('#task_employee').val(task.history[task.history.length-1].employeeId);
        $('#task_creator').val(task.creatorId);
        $('#task_name').val(task.name);
        $('#showTaskType').val(task.type);
        $('#showTaskPlatform').val(task.platform);
        $('#showTaskPriority').val(task.priority);
        $('#estimated').val(task.history[task.history.length-1].estimatedTime);
        $('#spent').val(task.history[task.history.length-1].spentTime);
        $('#task_status').val(task.currentStatus);
        $('#history_box').empty();
        $('.update_task').attr('data-id',taskId);
        var history = task.history;
        var desc = '';
        var status = 0;
        var assigned = 0;
        var estimated = 0;
        var spent = 0;
        $.each(history, function(key, historyItem){
            var historyText = '<div>';
            if(key == 0){
                desc = historyItem.description.message;
                status = historyItem.status;
                assigned = historyItem.employeeId;
                historyText += 'Task: <br>' +desc.replace(/\r\n|\r|\n/g,"<br />")+'<br>';
                if(assigned != 0){
                  historyText += 'Assigned to: ' +getUserNameFromId(assigned)+'<br>';  
                }
                if(typeof historyItem.description.attachments !== 'undefined' && historyItem.description.attachments.length > 0)
                {
                    historyText += 'Attachment: <div class = "attachmentsBox">';
                    var attachments = historyItem.description.attachments;
                    for(var i = 0, lenI = attachments.length; i < lenI; i++)
                    {
                        if(attachments[i].img)
                        {
                            historyText += '<a data-popup="img" onclick="attachmentPopup(this)" href="javascript:;"><img class = "attachmentImg" src = "'+MAIN_LINK+'/dash/view'+attachments[i].img+'" alt = "attachment"></a>';                                                     

                        }
                        else if(attachments[i].video)
                        {
                            historyText += '<div class = "videoBox"><a data-popup="source" href="javascript:;" onclick="attachmentPopup(this)"><img src = "/dash/assets/img/playBut.png"><video class = "attachmentVideo"><source src = "'+MAIN_LINK+'/dash/view'+attachments[i].video+'"></source></video></a></div>';                            
                          
                        }
                        else {
                            var fileNameIndex = attachments[i].file.lastIndexOf("/") + 1;
                            var filename = attachments[i].file.substr(fileNameIndex);
                            historyText += '<a href = "'+MAIN_LINK+'/dash/view'+attachments[i].file+'" target="_blank" src = "'+MAIN_LINK+'/dash/view'+attachments[i].file+'" alt = "attachment">'+filename+'</a>';
                        }
                    }
                    historyText += '</div>';
                }
            }else{
                if(desc != historyItem.description.message ){
                    if(historyItem.description.message != '' && typeof historyItem.description.message !== 'undefined')
                        historyText += 'Comment: <br>' +historyItem.description.message.replace(/\r\n|\r|\n/g,"<br />")+'<br>';
                    desc = historyItem.description.message;
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
                    historyText += 'Assigned to: ' +getUserNameFromId(historyItem.employeeId)+'<br>';  
                    assigned = historyItem.employeeId;
                }
                if(typeof historyItem.description.attachments !== 'undefined' && historyItem.description.attachments.length > 0)
                {
                    historyText += 'Attachment: <div class = "attachmentsBox">';
                    var attachments = historyItem.description.attachments;
                    for(var i = 0, lenI = attachments.length; i < lenI; i++)
                    {
                        if(attachments[i].img)
                        {
                            historyText += '<a data-popup="img" onclick="attachmentPopup(this)" href="javascript:;"><img class = "attachmentImg" src = "'+MAIN_LINK+'/dash/view'+attachments[i].img+'" alt = "attachment"></a>';
                        }
                        else if(attachments[i].video)
                        {
                            historyText += '<div class = "videoBox"><a data-popup="source" href="javascript:;" onclick="attachmentPopup(this)"><img src = "/dash/assets/img/playBut.png"><video class = "attachmentVideo"><source src = "'+MAIN_LINK+'/dash/view'+attachments[i].video+'"></source></video></a></div>';                            
                        }
                        else {
                            var fileNameIndex = attachments[i].file.lastIndexOf("/") + 1;
                            var filename = attachments[i].file.substr(fileNameIndex);
                            historyText += '<a href = "'+MAIN_LINK+'/dash/view'+attachments[i].file+'" target="_blank" src = "'+MAIN_LINK+'/dash/view'+attachments[i].file+'" alt = "attachment">'+filename+'</a>';
                        }
                    }
                    historyText += '</div>';
                }
            }
            if(historyText != '<div>'){
                var byWhom = getUserNameFromId(historyItem.userId);
                $('#history_box').append('<div class="one_history"><span id = "oneHistoryBox"'+historyText+'</span><div id="by_whom"><span>'+byWhom+'</span><br><span> '+historyItem.dateTime+'</span></div></div>');
            }
        });
        $('#task_card').show();
    }); 
    $('body').off('click', '.file_upload').on('click', '.file_upload', function()
    {
        $('#file-upload-task').click();
    });
    $('body').off('change', '#file-upload-task').on('change', '#file-upload-task', function()
    {
        getUploadFile(this);
    });
    $('body').off('click', '.deleteFile').on('click', '.deleteFile', function()
    {
        $(this).parent().remove();
        $("#file-upload-task").val('');
    });
    /*$('body').on('change', '#taskType', function()
    {
        if($(this).val() == 2 || $(this).val() == 3)
        {
            $('#platform').prop('disabled', false);
        }
        else
        {
            $('#platform').prop('disabled', true);
            $('#platform option:first').prop('selected', true);
        }
    });*/
    $(document).bind("mousedown", function (e) 
    {
        if(!$(e.target).parents('#task_card').length > 0 && !$(e.target).parents('#create_task_box').length > 0 &&
        !$(e.target).parents('#createTeamBox').length > 0 && !$(e.target).parents('#leftTeamBox').length > 0 &&
        !$(e.target).parents('#joinTeamBox').length > 0 && !$(e.target).parents('#changeStatusBox').length > 0 &&
        !$(e.target).parents('#employee_card').length > 0 && $('#attachmentModal').length==0)
        {
           $('#task_card, #create_task_box, #createTeamBox, #leftTeamBox, #joinTeamBox, #changeStatusBox, #employee_card').hide();
        }
     });
    $('body').off('click', '#tasks').on('click', '#tasks', function()
    {
        var date = new Date();     
        date.setMonth(date.getMonth()+1);
        document.cookie = "showTeam=0;expires="+date;
        $('#teamSectionOne').hide();
        $('#teamSectionTwo').hide();
        $('#leftTeam').hide();
        $('#joinTeam').hide();
        $('#taskSection').show();   
    });
    $('body').off('click', '#team').on('click', '#team', function()
    {
        var date = new Date();     
        date.setMonth(date.getMonth()+1);
        document.cookie = "showTeam=1;expires="+date;
        $('#taskSection').hide();
        $('#teamSectionOne').show();
        if(userTeam.inTeam == 1)
        {
            $('#leftTeam').show();
            $('#teamSectionTwo').show();
            $('#joinTeam').hide();
        }
        else
        {
            $('#joinTeam').show();
            $('#teamSectionTwo').hide();
        }
    });
    $('#createTeam').click(function()
    {
        $('#createTeamBox').toggle();
    });
    $('body').off('click', '#leftTeam').on('click', '#leftTeam', function()
    {
        if(userTeam.inTeam == 1 && userTeam.teamId)
        {
            $('#leftTeamBox').toggle();
        }
    });
    $('body').off('click', '#joinTeam').on('click', '#joinTeam', function()
    {
        $('#joinTeamBox').toggle();
    });
    $('body').off('click', '#createTeamFinal').on('click', '#createTeamFinal', function()
    {
        if($('#teamName').val())
        {
            var invitedUsers = [];
            $('#invitedUsers p').each(function()
            {
                invitedUsers.push($(this).attr('id'));
            });            
            var data = {teamName: $('#teamName').val(), invitedUsers: invitedUsers};
            AjaxController('createTeam', data, adminUrl, 'createTeamHandler', errorBasicHandler, true);
        }
        else
        {
            $('#teamName').addClass('inpurError');
        }
    });
    $('body').off('click', '#clearInviteList').on('click', '#clearInviteList', function()
    {
        $('#invitedUsers').empty();
        !$('#addUsers option').each(function()
        {
            if(!$(this).hasClass('inTeamColor'))
            {
                $(this).prop('disabled', false);
            }
        });
    });
    $('body').off('change', '#addUsers').on('change', '#addUsers', function()
    {
        var value = $(this).val(),
            userName = $('#addUsers option[value="'+value+'"]').text();
        if(value != 0)
        {
            $('#invitedUsers').append('<p id="'+value+'">'+userName+'</p>');
            $('#addUsers option[value="'+value+'"').prop('disabled', true);
            $('#addUsers option[value="0"').prop('selected', true);
        }
    });
    $('body').off('click','#leaveTeamFinal').on('click','#leaveTeamFinal', function()
    {
        var data = {teamId: userTeam.teamId};
        AjaxController('leaveTeam', data, adminUrl, 'leaveTeamHandler', errorBasicHandler, true);
    });
    $('body').off('click', '#joinTeamFinal').on('click', '#joinTeamFinal', function()
    {
        var teamId = parseInt($('#selectTeam').val());
        if(teamId != 0)
        {
            var data = {teamId: teamId};
            AjaxController('joinTeam', data, adminUrl, 'joinTeamHandler', errorBasicHandler, true);            
        }
        else
        {
            $('#selectTeam').addClass('inpurError');
        }
    });
    $('body').off('click', '#changeStatus').on('click', '#changeStatus', function()
    {
        $('#changeStatusBox').toggle();
        var curTextStatus = $('#yourTextStatus').text();
        $('#newTextStatus').text(curTextStatus);
    });
    $('body').off('click', '#changeStatusFinal').on('click', '#changeStatusFinal', function()
    {
        var newStatus = $('#newStatus').val();
        if(newStatus != "none")
        {
            var data = {status: newStatus, textStatus: $('#newTextStatus').val()};
            AjaxController('updateStatus', data, adminUrl, 'updateStatusHandler', errorBasicHandler, true);                    
        }
        else
        {
            $('#newStatus').addClass('inpurError');
        }
    });
    $('body').off('click', '#cancelChangeStatus, #cancelLeaveTeam, #cancelJoin').on('click', '#cancelChangeStatus, #cancelLeaveTeam, #cancelJoin', function()
    {
        $('.close_edit').click();
    });
    $('body').off('change', '#filters input,#filters select').on('change', '#filters input,#filters select', function()
    {
        var date = new Date();     
        date.setMonth(date.getMonth()+1);
        document.cookie = $(this).attr('id')+"="+$(this).val()+";expires="+date;
        filter();
    });
    $('#filters input').keyup(function()
    {
        var date = new Date();     
        date.setMonth(date.getMonth()+1);
        document.cookie = $(this).attr('id')+"="+$(this).val()+";expires="+date;
        filter();
    });
    $('body').off('hidden.bs.modal', '#attachmentModal').on('hidden.bs.modal', '#attachmentModal', function(event){
        $("#attachmentModal").remove();
    });
});

function attachmentPopup(element){
	var type = $(element).attr('data-popup');    
	var popupSource = $(element).find(type).attr('src');
        var windowHeight = $(window).height();
	var contentHeight = windowHeight - windowHeight*10/100;
	var popupContent = ''; 
	if(type=='img'){
            popupContent += '<img src="'+popupSource+'" style="max-height: '+contentHeight+'px"/>';
	} else {
            popupContent += '<video autoplay style="max-height: '+contentHeight+'px" controls>\n\
		<source type="video/webm" src="'+popupSource+'">\n\
		<source type="video/mp4" src="'+popupSource+'">\n\
		<a href="'+popupSource+'" target="_blank">Download video</a>\n\
		</video><br>';
	}
	popupTitle = 'Preview';
	showTaskModal(popupTitle, popupContent, popupSource);
	$('.modal-dialog').css({'width': '80%'});
	return false;
}

function showTaskModal(title, message, link) {
    title = title != '' && typeof title !== 'undefined' ? title : '';
    message = message != '' && typeof message !== 'undefined' ? message : '';
    var template = '<div class="modal modal-white" id="attachmentModal" tabindex="-1" role="dialog">\n\
	<div class="modal-dialog" role="document"><div class="modal-content">\n\
	<div class="modal-header">\n\
        <a href="'+link+'" id="downloadIcon" target="_blank"><i class="fa fa-cloud-download" aria-hidden="true"></i></a>\n\
	<button type="button" class="close" onclick = "hideTaskModal()" aria-label="Close">\n\
	<span aria-hidden="true">&times;</span></button><h4 class="modal-title">'+title+'</h4></div>\n\
	<div class="modal-body"><p>'+message+'</p></div>\n\
	<div class="modal-footer">\n\
	<a type="button" target="_blank" class="btn btn-default" href="'+link+'">Download</a>\n\
	<button type="button" class="btn btn-default" onclick = "hideTaskModal()">Close</button>\n\
	</div></div></div></div>';
	$('body').append(template);
	$("#attachmentModal").modal('show');
}

function hideTaskModal() {
	$("#attachmentModal").modal('hide');
}
