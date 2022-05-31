function adminEmployeeController() {
    var self = this;

    self.apiURL = '/db/api/apiEmployeeController.php';

    self.allEmployees = {};
    self.allTeams = {};

    self.companyPositionInfo = {
        '2': {
            'id': 2,
            'name': 'Dev Emplooyees'
        },
        '11': {
            'id': 11,
            'name': 'Sales/Support'
        }
    };

    self.adminEmployeeInit = function () {
        var data = {};
        AjaxController('getEmployeesAndTeams', data, self.apiURL, self.adminEmployeeInitHandler, errorBasicHandler, true);
    }

    self.adminEmployeeInitHandler = function (response) {
        c('adminEmployeeInitHandler');
        c(response);

        self.allEmployees = response.data.employees;
        self.allTeams = response.data.teams;
        
        self.fillEmployeeTeamTable(self.allTeams);
    }
    
    self.getEmployeeTeamById = function(teamId) {
        var teamInfo;
        $.each(self.allTeams, function(key, team){
            if(team.id == teamId) {
                teamInfo = team;
                return false;
            }
        });
        return teamInfo;
    }
    
    self.fillEmployeeTeamTable = function(data) {
        $('#teams_table tbody').empty();
        $.each(data, function (key, item) {
            // console.log(item);
            var members = '';
            var teamLead = '';
            $.each(item.members, function (key, member) {
                if (member.userId == item.teamLeadId) {
                    teamLead = member.name + ' ' + member.last;
                } else {
                    if (members != '')
                        members += '<br>';
                    members += member.name + ' ' + member.last;
                }
            });
            var teamEl = `<tr>
                        <td>${item.name}</td>
                        <td>${teamLead}</td>
                        <td>${members}</td>
                        <td>
                            <button data-id="${item.id}" class="btn btn-default" onclick="adminEmployeeC.showUpdateTeamModal(${item.id});">Edit</button>
                            <button data-id="${item.id}" class="btn btn-default" onclick="adminEmployeeC.removeTeam(this);">Remove</button>
                        </td>
                </tr>`;
            $('#teams_table tbody').append(teamEl)
        });
    }

    self.userInTeam = function (userId, teamId = 0) {
        var ret = false;
        if (self.allTeams.length > 0) {
            $.each(self.allTeams, function (key, team) {
                if (team.teamLeadId == userId && team.id != teamId) {
                    ret = true;
                }
                $.each(team.members, function (key2, member) {
                    if (member.userId == userId && team.id != teamId) {
                        ret = true;
                    }
                });
            });
        }
        return ret;
    }

    self.createEmployeeTeam = function () {
        $('#CreateTeam select, #CreateTeam input').removeClass('inpurError');
        $('#CreateTeam .members .errorMes').empty();
        var name = $('#CreateTeam .input_name').val();
        var leadId = $('#CreateTeam .input_lead').val();
        if ($.trim(name) == '' || leadId == 0) {
            if ($.trim(name) == '') {
                $('#CreateTeam .input_name').addClass('inpurError');
            }
            if (leadId == 0) {
                $('#CreateTeam .input_lead').addClass('inpurError');
            }
            return false;
        }

        var data = {};
        data.name = $.trim(name);
        data.leadId = leadId;
        data.members = [];
        var error = 0;
        $('#CreateTeam .members .input_member').each(function (key, member) {
            if ($(member).val() == 0 /*|| self.userInTeam($(member).val())*/) {
                error++;
                if ($(member).val() == 0) {
                    $(member).addClass('inpurError');
                }
                /*if (self.userInTeam($(member).val())) {
                    $(member).addClass('inpurError');
                    $(member).parent().find('.errorMes').text('This user alredy in team!');
                }*/
                }
            data.members.push({'id': $(member).val()});
        });
        c(data);
        if (error > 0) {
            return false;
        }
        data.viewAll = 0;
        if($('#CreateTeam .params .input_showAll').prop('checked')){
            data.viewAll = 1;
        }
        AjaxController('createEmployeesTeam', data, self.apiURL, self.createEmployeeTeamHandler, errorBasicHandler, true);
    }
    
    self.createEmployeeTeamHandler = function(response) {
        c(response);
        $('#CreateTeam').modal('hide');
        self.allTeams = response.data.result;
        self.fillEmployeeTeamTable(self.allTeams);
    }

    self.showCreateTeamModal = function () {
        var title = 'Create Team';

        var template = `<div class="row" style="display:flex;flex-wrap:wrap;">
                            <div class="col-lg-6">
                                <div class="form-group">
                                    <label>Team Name</label>
                                    <input type="text" class="form-control input_name" placeholder="Team Name">
                                </div>
                            </div>
                            <div class="col-lg-6">
                                <div class="form-group">
                                    <label>Team Lead</label>
                                    ${self.genereteEmployeeSelector(
                {
                    'classSelector': 'form-control input_lead'
                })}
                                </div>
                            </div>
                            <div class="col-lg-12 members">
                                <div class="form-group lead_block">
                                    <label>Members</label>
                                    <!-- include here -->
                                </div>
                                <button class="btn btn-default add_empl" onclick="adminEmployeeC.addMemberInput(this);">Add Member</button>
                            </div>
                            <div class="col-lg-12 params">
                                <div class="form-group">
                                    <label>Params</label>
                                    <div class="checkbox">
                                        <label>
                                            <input type="checkbox" class="input_showAll"> Show All Task
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>`;

        showModal(title, template, 'CreateTeam', '', {'footerButtons': '<button type="button" class="btn btn-default" onclick="adminEmployeeC.createEmployeeTeam();">Create</button>'});
    }

    self.addMemberInput = function (el, selectedUserId = 0) {
        var error = 0;
        var members = [];
        if ($('#CreateTeam').length > 0) {
            $('#CreateTeam .members .input_member').each(function (key, member) {
                if ($(member).val() == 0) {
                    error++;
                    $(member).addClass('inpurError');
                }
                members.push(Number($(member).val()));
            });
        }
        if ($('#UpdateTeam').length > 0) {
            $('#UpdateTeam .members .input_member').each(function (key, member) {
                if ($(member).val() == 0) {
                    error++;
                    $(member).addClass('inpurError');
                }
                members.push(Number($(member).val()));
            });
        }
        if (error > 0) {
            return false;
        }
        $(el).before(`<div class="form-inline form-group">
                ${self.genereteEmployeeSelector(
                {
                    'classSelector': 'form-control input_member',
                    'notIncludes': members,
                    'selectedUserId':selectedUserId
                })}
                <button class="btn btn-default remove_empl" style="display:inline-block;" onclick="adminEmployeeC.removeMemberInput(this)">-</button>
                <p class="errorMes"></p>
            </div>`);

    }

    self.removeMemberInput = function (el) {
        $(el).parent().remove();
    }

    self.changeInputLead = function () {
        if ($('#CreateTeam').length > 0) {
            $('#CreateTeam .lead_block').empty().append('<label>Members</label>' + self.genereteEmployeeSelector(
                    {
                        'classSelector': 'form-control input_member',
                        'disabled': true,
                        'selectedUserId': $('#CreateTeam .input_lead').val()
                    }) + '<p class="errorMes"></p>');
        }
        if ($('#UpdateTeam').length > 0) {
            $('#UpdateTeam .lead_block').empty().append('<label>Members</label>' + self.genereteEmployeeSelector(
                    {
                        'classSelector': 'form-control input_member',
                        'disabled': true,
                        'selectedUserId': $('#UpdateTeam .input_lead').val()
                    }) + '<p class="errorMes"></p>');
        }
    }

    self.genereteEmployeeSelector = function (params = {}) {
        var content = `<select ${typeof params.classSelector != 'undefined' && params.classSelector != '' ? `class="${params.classSelector}"` : ''} ${typeof params.disabled != 'undefined' && params.disabled == true ? 'disabled' : ''}><option value="0">Select Employee</option>`;
        $.each(self.companyPositionInfo, function (key, team) {
            content += `<optgroup label="${team.name}">`;
            $.each(self.allEmployees, function (key2, member) {
                if (typeof params.notIncludes == 'undefined') {
                    if (team.id == member.companyPosition && member.active == 1) {
                        content += `<option value="${member.id}" ${typeof params.selectedUserId != 'undefined' && params.selectedUserId == member.id ? 'selected' : ''}>${member.name} ${member.last}</option>`;
                    }
                } else {
                    if (team.id == member.companyPosition && $.inArray(member.id, params.notIncludes) < 0 && member.active == 1) {
                        content += `<option value="${member.id}" ${typeof params.selectedUserId != 'undefined' && params.selectedUserId == member.id ? 'selected' : ''}>${member.name} ${member.last}</option>`;
                    }
                }
            });
            content += `</optgroup>`;
        });
        content += '</select>';
        return content;
    }
    
    self.removeTeam = function(el) {
        var teamId = $(el).attr('data-id');
        AjaxController('removeEmployeesTeam', {teamId: teamId}, self.apiURL, self.removeTeamHandler, errorBasicHandler, true);
    }
    
    self.removeTeamHandler = function(response) {
        self.allTeams = response.data.result;
        self.fillEmployeeTeamTable(self.allTeams);
    }
    
    self.updateEmployeeTeam = function(teamId) {
        $('#UpdateTeam select, #UpdateTeam input').removeClass('inpurError');
        $('#UpdateTeam .members .errorMes').empty();
        var name = $('#UpdateTeam .input_name').val();
        var leadId = $('#UpdateTeam .input_lead').val();
        if ($.trim(name) == '' || leadId == 0) {
            if ($.trim(name) == '') {
                $('#UpdateTeam .input_name').addClass('inpurError');
            }
            if (leadId == 0) {
                $('#UpdateTeam .input_lead').addClass('inpurError');
            }
            return false;
        }

        var data = {};
        data.teamId = teamId;
        data.name = $.trim(name);
        data.leadId = leadId;
        data.members = [];
        var error = 0;
        $('#UpdateTeam .members .input_member').each(function (key, member) {
            c($(member).val());
            if ($(member).val() == 0 /*|| self.userInTeam($(member).val(),teamId)*/) {
                error++;
                if ($(member).val() == 0) {
                    $(member).addClass('inpurError');
                }
                /*if (self.userInTeam($(member).val(),teamId)) {
                    $(member).addClass('inpurError');
                    $(member).parent().find('.errorMes').text('This user alredy in team!');
                }*/
                }
            data.members.push({'id': $(member).val()})
        });
        if (error > 0) {
            return false;
        }
        data.viewAll = 0;
        if($('#UpdateTeam .params .input_showAll').prop('checked')){
            data.viewAll = 1;
        }
        c(data);
        AjaxController('updateEmployeeTeam', data, self.apiURL, self.updateEmployeeTeamHandler, errorBasicHandler, true);
    }
    
    self.updateEmployeeTeamHandler = function(response) {
        c('updateEmployeeTeamHandler');
        c(response);
        $('#UpdateTeam').modal('hide');
        self.allTeams = response.data.result;
        self.fillEmployeeTeamTable(self.allTeams);
    }
    
    self.showUpdateTeamModal = function(teamId) {
        var teamInfo = self.getEmployeeTeamById(teamId);
        
        var title = `Update Team "${teamInfo.name}"`;
        var template = `<div class="row" style="display:flex;flex-wrap:wrap;">
                <div class="col-lg-6">
                    <div class="form-group">
                        <label>Team Name</label>
                        <input type="text" value="${teamInfo.name}" class="form-control input_name" placeholder="Team Name">
                    </div>
                </div>
                <div class="col-lg-6">
                    <div class="form-group">
                        <label>Team Lead</label>
                        ${self.genereteEmployeeSelector(
                            {
                                'classSelector': 'form-control input_lead',
                                'selectedUserId': teamInfo.teamLeadId
                            })}
                    </div>
                </div>
                <div class="col-lg-12 members">
                    <div class="form-group lead_block">
                        <label>Members</label>
                        <!-- include here -->
                    </div>
                    <button class="btn btn-default add_empl" onclick="adminEmployeeC.addMemberInput(this);">Add Member</button>
                </div>
                <div class="col-lg-12 params">
                    <div class="form-group">
                        <label>Params</label>
                        <div class="checkbox">
                            <label>
                                <input type="checkbox" class="input_showAll" ${teamInfo.viewAll == 1 ? 'checked' : ''}> Show All Task
                            </label>
                        </div>
                    </div>
                </div>
            </div>`;
        
        showModal(title, template, 'UpdateTeam', '', {'footerButtons': '<button type="button" class="btn btn-default" onclick="adminEmployeeC.updateEmployeeTeam('+teamId+');">Update</button>'});
        
        self.changeInputLead();
        
        $.each(teamInfo.members, function(key, member){
            c(member.userId);
            if(member.userId != teamInfo.teamLeadId){
                self.addMemberInput($('#UpdateTeam .members .add_empl'), member.userId);
            }
        });
    }

}
adminEmployeeC = new adminEmployeeController();