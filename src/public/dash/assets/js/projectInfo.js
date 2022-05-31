$().ready(function()
{
    c(projectInfo);
    if(projectInfo.superAdmin === 1)
    {
        $('#manageButton').show();
         showSectionsManagers();
    }
    showSectionCategories(1);
    $('#commonSection').attr('onclick', 'showSectionCategories(1)');
    $('#webSection').attr('onclick', 'showSectionCategories(2)');
    $('#appSection').attr('onclick', 'showSectionCategories(3)');
    $('#androidSpecificsSection').attr('onclick', 'showSectionCategories(4)');
    $('#iosSpecificsSection').attr('onclick', 'showSectionCategories(5)');

    $(document).bind("mousedown", function (e) 
    {
    if(!$(e.target).parents('#addSubcategoryBox').length > 0 && !$(e.target).parents('#createCategoryBox').length > 0 &&
    !$(e.target).parents('#editCategoryBox').length > 0 && !$(e.target).parents('#removeCategoryBox').length > 0 &&
    !$(e.target).parents('#showSubcategoryBox').length > 0 && !$(e.target).parents('#removeSubcategoryBox').length > 0 &&
    !$(e.target).parents('#addManagerBox').length > 0 && !$(e.target).parents('#removeManagerBox').length > 0)
    {
       $('#addSubcategoryBox, #createCategoryBox, #editCategoryBox, #removeCategoryBox, #showSubcategoryBox, #removeSubcategoryBox, #addManagerBox, #removeManagerBox').hide();
    }
    });

    $('body').on('click', '#addCategory', function()
    {
        $('#createCategoryBox').show();
    });
    $('body').on('click', '#addCategoryFinal', function()
    {
        var categoryName = $('#categoryName').val();
        if(categoryName != '')
        {
            var data = {categoryName: categoryName, sectionId: $('#categoriesInfo').attr('data-sectionid')};
            AjaxController('addCategory', data, adminUrl, 'addCategoryHandler', errorBasicHandler, true);
            $('#addCategoryFinal').prop('disabled', true);
        }
        else
        {
            $('#categoryName').addClass('inputError');
        }
    });
    $('body').on('click', '.editCategory', function()
    {
        var info = $(this).parents('.oneCategoryBox');
        $('#editCategoryBox').show();
        $('#editCategoryBox').attr('data-categoryid', $(info).attr('data-categoryid'));
        $('#removeCategoryBox').attr('data-categoryid', $(info).attr('data-categoryid'));
        $('#removeCategoryBox').attr('data-hassubcategories', $(info).hasClass('hasSubcategories'));
    });
    $('body').on('click', '#updateCategoryFinal', function()
    {
        if($('#newCategoryName').val() != '')
        {
            var data = {updateInfo: $('#newCategoryName').val(), categoryId: $('#editCategoryBox').attr('data-categoryid'), type: 0};
            AjaxController('updateCategory', data, adminUrl, 'updateCategoryHandler', errorBasicHandler, true);
        }
        else
        {
             $('#newCategoryName').addClass('inputError');
        }
    });
    $('body').on('click', '#removeCategory', function()
    {
        $('.close_edit').click();
        $('#removeCategoryBox').attr('data-hassubcategories') === 'true' ? $('#removeCategoryBox p').text('Remove category and all subcategories?') : $('#removeCategoryBox p').text('Remove category?')
        $('#removeCategoryBox').show();
    });
    $('body').on('click', '#removeCategoryFinal', function()
    {
        var hasSubcategories = $('#removeCategoryBox').attr('data-hassubcategories') === 'true' ? 1 : 0,//1 - remove subcategories
            data = {updateInfo: hasSubcategories, categoryId: $('#removeCategoryBox').attr('data-categoryid'), type: 1};
        AjaxController('updateCategory', data, adminUrl, 'updateCategoryHandler', errorBasicHandler, true);
    });
    $('body').on('click', '.addSubcategory', function()
    {
        var info = $(this).parents('.oneCategoryBox');
        $('#addSubcategoryBox, #addNewSubcategoryFile').show();
        $('#addSubcategoryBox').attr('data-categoryid', $(info).attr('data-categoryid'));
    });    
    $('body').on('click', '#addSubcategoryFile', function()
    {
        $('#file-upload-subcategory').click();
    });
    $('body').on('click', '#addNewSubcategoryFile', function()
    {
        $('#file-uploadNewFile-subcategory').click();
    });
    $('body').on('change', '#file-upload-subcategory', function()
    {
        getUploadFileCreateSubcategory(this);
    });
    $('body').on('change', '#file-uploadNewFile-subcategory', function()
    {
        getUploadFileUpdateSubcategory(this);
    });
    $('body').on('click', '.deleteFile', function()
    {
        var fileBox = $(this).parent();
        if($(this).hasClass('deleteFilesFromSubcategory'))
        {
            projectInfo.removedFilesSubcategory.push($(fileBox).attr('data-src'));
        }
        $(fileBox).remove();
        $("#file-upload-task").val('');
    });
    $('body').on('click', '#addSubcategoryFinal', function()
    {
        $('#subcategoryName, #addSubcategoryBox .description').removeClass('inputError');       
        var name = $('#subcategoryName').val(),
            message = $('#addSubcategoryBox .description').val(),
            attachmentsInfo = [];

        if(name == '' || description == '')
        {
            name == '' ? $('#subcategoryName').addClass('inputError') : '';
            message == '' ? $('#addSubcategoryBox .description').addClass('inputError') : '';
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
        $('.uploadAudio source').each(function()
        {
            var info = {};
            info.audio = $(this).attr('src');
            info.audioName =$(this).attr('data-filename');
            attachmentsInfo.push(info);
        });
        $('.otherFile p').each(function()
        {
            var info = {};
            info.file = $(this).attr('src');
            info.fileName = $(this).attr('data-filename');
            attachmentsInfo.push(info);
        });
        var description = {
            message: escapeHtml(message),
            attachments: attachmentsInfo
        }
        $('#addSubcategoryFinal').prop("disabled", true);
        var data = {name: escapeHtml(name), categoryId: $('#addSubcategoryBox').attr('data-categoryid'), description: JSON.stringify(description)}; 
        AjaxController('createSubcategory', data, adminUrl, 'createSubcategoryHandler', errorBasicHandler, true);
    });
    $('body').on('click', '.categoryInfo', function()
    {
        var categoryBox = $(this).parents('.oneCategoryBox');
        if($(categoryBox).hasClass('loading') || !$(categoryBox).hasClass('hasSubcategories'))
        {
            return false;
        }
        if(!$(categoryBox).hasClass('loaded'))
        {
            if(projectInfo.loadedCategoriesId.includes(parseInt($(categoryBox).attr('data-categoryid'))))
            {
                showLoadedSubcategoryList(parseInt($(categoryBox).attr('data-categoryid')));
                return false;
            }
            $(categoryBox).addClass('loading');
            $('.showSubcategory').prop('disabled', true);
            var data = {categoryId: $(categoryBox).attr('data-categoryid')}; 
            AjaxController('getSubcategories', data, adminUrl, 'getSubcategoriesHandler', errorBasicHandler, true);
        }
        else
        {
            if($(categoryBox).hasClass('openSubcategories'))
            {
                $(categoryBox).find('.showSubcategory').html('&#9658;')
                $(categoryBox).removeClass('openSubcategories').addClass('closeSubcategories');
                $(categoryBox).find('.subcategoryInfo').slideUp();
            }
            else
            {
                $(categoryBox).find('.showSubcategory').html('&#9660;');
                $(categoryBox).removeClass('closeSubcategories').addClass('openSubcategories');
                $(categoryBox).find('.subcategoryInfo').slideDown();
            }
        }
    });
    $('body').on('click', '.editSubcategory', function(event)
    {
        event.stopPropagation();
        $('#showSubcategoryBox').attr('data-subcategoryid', $(event.currentTarget).parent().attr('data-subcategoryid'));
        showSubcategory($(event.currentTarget).parent().attr('data-subcategoryid'), 1);
    });
    $('body').on('click', '.onesubcategoryBox', function(event)
    {
        showSubcategory($(event.currentTarget).attr('data-subcategoryid'), 0);
    });
    $('body').on('click', '#updateSubcategoryFinal', function()
    {
        $('#showSubcategoryName, #showSubcategoryDescription').removeClass('inputError');       
        var name = $('#showSubcategoryName').val(),
            message = $('#showSubcategoryDescription').val(),
            attachmentsInfo = [];

        if(name == '' || description == '')
        {
            name == '' ? $('#showSubcategoryName').addClass('inputError') : '';
            message == '' ? $('#showSubcategoryDescription').addClass('inputError') : '';
            return false;
        }

        $('.attachmentsImgBox .newAttachmentFile img').each(function()
        {
            var info = {};
            info.img = $(this).attr('src');
            info.imgName = $(this).attr('data-filename');
            attachmentsInfo.push(info);
        });
        $('.attachmentsVideoBox .newAttachmentFile source').each(function()
        {
            var info = {};
            info.video = $(this).attr('src');
            info.videoName = $(this).attr('data-filename');
            attachmentsInfo.push(info);
        });
        $('.attachmentsAudioBox .newAttachmentFile source').each(function()
        {
            var info = {};
            info.audio = $(this).attr('src');
            info.audioName =$(this).attr('data-filename');
            attachmentsInfo.push(info);
        });
        $('.attachmentsFileBox .newAttachmentFile p').each(function()
        {
            var info = {};
            info.file = $(this).attr('src');
            info.fileName = $(this).attr('data-filename');
            attachmentsInfo.push(info);
        });
        var description = {
            message: escapeHtml(message),
            attachments: attachmentsInfo
        }
        $('#updateSubcategoryFinal').prop("disabled", true);
        var data = {name: escapeHtml(name), subCategoryId: $('#showSubcategoryBox').attr('data-subcategoryid'), description: JSON.stringify(description), removedFiles: projectInfo.removedFilesSubcategory};    
        AjaxController('updateSubcategory', data, adminUrl, 'updateSubcategoryHandler', errorBasicHandler, true);            
    });
    $('body').on('click', '#removeSubcategory', function()
    {
        $('#removeSubcategoryBox').show();
    });
    $('body').on('click', '.cancel', function()
    {
        $('#removeSubcategoryBox, #removeCategoryBox, #addManagerBox, #removeManagerBox').hide();
    });
    $('body').on('click', '#removeSubcategoryFinal', function()
    {
        $('#removeSubcategoryFinal').prop("disabled", true);
        var data = {subCategoryId: parseInt($('#showSubcategoryBox').attr('data-subcategoryid'))};    
        AjaxController('removeSubcategory', data, adminUrl, 'removeSubcategoryHandler', errorBasicHandler, true);        
    });
    $('body').on('click', '#manageButton', function()
    {
        $('#mainButtonsBox button, #manageButton, #categoriesInfo').hide();
        $('#sectionButton, #manageInfo').show();
    });
    $('body').on('click', '#sectionButton', function()
    {
        $('#sectionButton, #manageInfo').hide();
        $('#mainButtonsBox button, #manageButton, #categoriesInfo').show();
    });
    $('body').on('click', '.showManagers, .sectionManageInfo span', function()
    {
        var manageBox = $(this).parents('.oneMainManageBox');
        if(!$(manageBox).find('.subcategoriesButton').hasClass('showManagers'))
        {
            return false;
        }
        if($(manageBox).hasClass('openManageInfo'))
        {
            $(manageBox).find('.showManagers').html('&#9658;')
            $(manageBox).removeClass('openManageInfo').addClass('closeManageInfo');
        }
        else
        {
            $(manageBox).find('.showManagers').html('&#9660;');
            $(manageBox).removeClass('closeManageInfo').addClass('openManageInfo');
        }
        $(manageBox).find('.managersInfo').slideToggle();
    });
    $('body').on('click', '.addManage', function()
    {
        $('#addManagerBox #addManagerSelect option:not(:first)').remove();
        var employees = projectInfo.employees,
            options = '',
            sectionId = parseInt($(this).parents('.oneMainManageBox').attr('data-sectionid'));
        for(var i = 0, len = employees.length; i < len; i++)
        {
            if(employees[i].manage.includes(sectionId))
            {
                options += '<option value = "'+employees[i].id+'" class = "allReadyManage" disabled>'+employees[i].name+' '+employees[i].last+'</option>';
            }
            else
            {
                options += '<option value = "'+employees[i].id+'">'+employees[i].name+' '+employees[i].last+'</option>';
            }
        }
        $('#addManagerBox #addManagerSelect').append(options);
        $('#addManagerBox').attr('data-sectionid', sectionId);
        $('#addManagerBox').show();
    });
    $('body').on('click', '#addManagerFinal', function()
    {
        var employeeId = parseInt($('#addManagerSelect').val()),
            sectionId = parseInt($('#addManagerBox').attr('data-sectionid'));
        if(employeeId != "0")
        {
            if(sectionId != "")
            {
                $('#addManagerFinal').prop('disabled', true);
                var data = {userId: employeeId, sectionId: sectionId};    
                AjaxController('addManager', data, adminUrl, 'addManagerHandler', errorBasicHandler, true);
            }
        }
        else
        {
            $('#addManagerSelect').addClass('inputError');
        }
    });
    $('body').on('click', '.editManage', function()
    {
        var managerId = $(this).parents('.oneManageBox').attr('data-userid'),
            sectionId = $(this).parents('.oneMainManageBox ').attr('data-sectionid');
        $('#removeManagerBox').attr('data-managerid', managerId);
        $('#removeManagerBox').attr('data-sectionid', sectionId);
        $('#removeManagerBox').show();
    });
    $('body').on('click', '#removeManagerFinal', function()
    {
        var managerId = parseInt($('#removeManagerBox').attr('data-managerid')),
            sectionId = parseInt($('#removeManagerBox').attr('data-sectionid'));
        if(managerId != '' && sectionId != '')
        {
            $('#removeManagerFinal').prop('disabled', true);
            var data = {managerId: managerId, sectionId: sectionId};    
            AjaxController('removeManager', data, adminUrl, 'removeManagerHandler', errorBasicHandler, true);
        }          
    });
    $('body').on('click', '#apiRequests, #apiErrors, #chatDocs, #chatErrors', function()
    {
        showApiInfo($(this).attr('data-type'));
    });
    $('body').on('click', '#apiDocs .oneLeftInfo', function()
    {
        showSelectedApiBox($(this).attr('data-id'));
    });
    $('#apiDocsDescription').scroll(function()
    {
        var curBoxId = apiBoxPositions($(this).scrollTop()),
            boxPosition = $('#apiDocsName .oneLeftInfo[data-id="'+curBoxId+'"]').position().top;
        $('#apiDocsName .oneLeftInfo').removeClass('curVisibleBox');
        $('#apiDocsName .oneLeftInfo[data-id="'+curBoxId+'"]').addClass('curVisibleBox');
        if((boxPosition >= ($('#apiDocs').height() - 33)) || (boxPosition + 20 <= 0))
        {
            $("#apiDocsName").scrollTop(0).scrollTop($('#apiDocsName .oneLeftInfo[data-id="'+curBoxId+'"]').position().top);
        }
    });
});