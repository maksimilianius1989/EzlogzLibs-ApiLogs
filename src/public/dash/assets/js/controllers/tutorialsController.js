function tutorialsController() {
    var self = this;
    this.cntrlUrl = apiDashUrl;
    this.activeTutorialId = 0;
    this.activeTutorial = {};
    this.activeStepId = 0;
    this.activeStep = {};
    this.activeTutorialSteps = {};
    this.tutorialPages = [];

    this.init = function () {
        AjaxController('getTutorialPages', {}, self.cntrlUrl, self.getTutorialPagesHandler, self.getTutorialPagesErrorHandler, true);
    }
    this.getTutorialPagesHandler = function (response) {
        if (response.code == '000') {
            self.tutorialPages = response.data.result;
        }
    }
    this.getUserTutorials = function () {
        var page = window.location.pathname;
        if (self.tutorialPages.indexOf(page) != -1) {
            setTimeout(function () {
                AjaxController('getUserTutorials', {page: page}, self.cntrlUrl, self.getUserTutorialsHandler, self.getUserTutorialsErrorHandler, true);
            }, 500);
        }
    }
    this.getUserTutorialsHandler = function (response) {
        self.activeTutorialSteps = response.data.result;
        if (typeof self.activeTutorialSteps[0] != 'undefined') {
            self.activeTutorialId = self.activeTutorialSteps[0].tutorialId;
            self.getTutorialSteps();
        }
    }
    this.getTutorialSteps = function () {
        $('#multi-step').modal('hide');
        var modalTabs = '';
        var modalContent = '';

        $.each(self.activeTutorialSteps, function (key, step) {
            var active = key == 0 ? 'active' : '';
            if (key == 0) {
                self.setActiveStep(step.id);
            }
            modalTabs += `<li role="presentation" class="${active}">  
                <a href="#step${key + 1}" data-toggle="tab" aria-controls="step${key + 1}" data-step="${step.id}" role="tab" onclick="tutorialsC.nextPrevButtonDisplay(this)">${key + 1}</a>
            </li>`;
            var image = MAIN_LINK + '/dash/assets/img/tutorials/' + step.tutorialId + '_' + step.id + '.svg';
            modalContent += `<div class="row tab-pane ${active}" role="tabpanel" id="step${key + 1}">  
                <div class="hidden-xs col-sm-5 img_fixed">
                    <img src="${image}" style="max-width: 100%;"/>
                </div>
                <div class="col-xs-12 col-sm-7 description">
                    <h3>${step.title}</h3>
                    <p>${step.description}</p>
                </div>
            </div>`;
        });
        if (self.activeTutorialSteps.length <= 1) {
            var footerButtons = `<button type="button" class="btn btn-primary got-it" onclick="tutorialsC.skipTutorial()">Got it</button>`;
        } else {
            var footerButtons = `<button type="button" class="btn btn-default skip-intro" onclick="tutorialsC.skipTutorial()">Skip intro</button>`;
        }
        footerButtons += `
			<button type="button" class="btn btn-primary prev-step hidden" onclick="tutorialsC.prevTab()"><i class="button-triangle"></i>Previous</button>
			<button type="button" class="btn btn-primary next-step" onclick="tutorialsC.nextTab()">Next<i class="button-triangle"></i></button>`;
        var bodyModal = `<div class="tab-content">${modalContent}</div><ul class="nav nav-tabs" role="tablist">${modalTabs}</ul>`;
        $('body').on('shown.bs.modal', '#multi-step', function () {});
        $('body').on('hide.bs.modal', '#multi-step', function (e) {
            $('.multi-step-element').remove();
            $('.hidden-step-element').removeClass('hidden-step-element');
        });
        $(window).resize(function () {
            if ($('#multi-step').length > 0) {
                self.moveModalToElement();
            }
        });
        showModal('', bodyModal, 'multi-step', '', {footerButtons: footerButtons});
        if (self.activeTutorialSteps.length <= 1) {
            $('#multi-step').find('.nav-tabs, .next-step').hide();
        }
        self.moveModalToElement();
    }
    this.setActiveStep = function (activeStepId) {
        self.activeStepId = activeStepId;
        self.activeStep = self.activeTutorialSteps.filter(item => item.id == self.activeStepId)[0];
    }
    this.nextTab = function () {
        var $active = $('#multi-step').find('.nav-tabs li.active');
        c($active);
        $active.next().removeClass('disabled');
        var $tabLink = $active.next().find('a[data-toggle="tab"]');
        self.setActiveStep($tabLink.attr('data-step'));
        self.moveModalToElement();
        $tabLink.click();
    }
    this.prevTab = function () {
        var $active = $('#multi-step').find('.nav-tabs li.active');
        var $tabLink = $active.prev().find('a[data-toggle="tab"]');
        self.setActiveStep($tabLink.attr('data-step'));
        self.moveModalToElement();
        $tabLink.click();
    }
    this.moveModalToElement = function () {
        $('.hidden-step-element').removeClass('hidden-step-element');
        $('.multi-step-element').remove();
        $('#multi-step .modal-body').removeAttr('style');
        $('.modal-triangle').remove();

        if (typeof self.activeStep != 'undefined' && typeof self.activeStep.focus != 'undefined' && self.activeStep.focus != '') {
            var $focusEl = $('[data-tutorial="' + self.activeStep.focus + '"]');
            if ($focusEl.length > 0) {
                //scroll to focus element
                var offset = $focusEl.offset();
                var scrollTop = offset.top - $('.content').offset().top + $('.content').scrollTop() - 10;
                $('.content').scrollTop(scrollTop);

                //calculate modal coordinates and move
                var focusCoords = self.getCoords(self.activeStep.focus),
                        ww = $(window).width(),
                        wh = $(window).height(),
                        trianglePosition = typeof $focusEl.attr('data-position') != 'undefined' ? $focusEl.attr('data-position') : 'top',
                        modal = {height: 0, width: 600, left: 0, right: 0},
                        triangle = {left: 'auto', right: 'auto'};
                //full width for small screen
                if (ww < modal.width) {
                    modal.width = ww;
                }
                //if focus right side
                if (focusCoords.left >= ww - modal.width) {
                    modal.left = ww - modal.width;
                    modal.right = 0;
                } else {
                    modal.left = focusCoords.left - 30;
                    modal.right = ww - focusCoords.left - modal.width + 30;
                }

                //limit height of modal content if size is to large
                modal.top = wh < 350 ? 0 : focusCoords.top + 20;
                modal.height = wh - modal.top - 120;
                modal.height = modal.height > 200 || wh >= 350 ? 200 : modal.height;

                if (trianglePosition == 'bottom') {
                    modal.top = wh < 350 ? 0 : modal.top - modal.height - $('.tab-pane.active h3').height() - 30;
                    triangle.bottom = '10px';
                } else {
                    triangle.top = '-15px';
                }
                triangle.left = focusCoords.left - modal.left;
                var cssModal = {'left': modal.left, 'right': modal.right, 'top': modal.top};
                $('#multi-step').css(cssModal);
                $('#multi-step .modal-body').css({'max-height': modal.height + 'px', 'overflow-y': 'auto'});

                //focus active element
                focusDiv = $('<div/>');
                focusDiv.attr({'class': 'multi-step-element'});
                focusDiv.css({top: focusCoords.top, left: focusCoords.left});
                $('body').append(focusDiv);

                self.activeStep.html = $focusEl.prop('outerHTML');
                var el = document.querySelector('[data-tutorial="' + self.activeStep.focus + '"]');
                self.copyNodeStyle(el, el);
                $focusEl.children().each(function (index, el) {
                    self.copyNodeStyle(el, el);
                });
                $focusCopy = $focusEl.clone().removeAttr('style');
                $focusCopy.attr('onclick', 'tutorialsC.triggerElementClick(event);');
                $focusCopy.attr('onchange', 'tutorialsC.triggerElementSelect(event);');
                $focusCopy.removeAttr('data-tutorial').css({margin: 0, top: 0, bottom: 0, width: $focusEl.outerWidth()}).removeClass('mob_margin_top_15');
                $('.multi-step-element').html($focusCopy);
                $('#multi-step .modal-body').append('<div class="modal-triangle ' + trianglePosition + '"></div>');
                $('.modal-triangle').css(triangle);

                $focusEl.prop('outerHTML', self.activeStep.html);
                $('[data-tutorial="' + self.activeStep.focus + '"]').addClass('hidden-step-element');
            }
        } else {
            $('#multi-step, #multi-step .modal-body').attr('style', '');
        }
    }
    this.triggerElementSelect = function (event) {
        var $hiddenEl = $('.hidden-step-element');
        var $target = $(event.target);
        if ($hiddenEl.is('select') || $target.is('select')) {
            $hiddenEl.find('option[value="' + $target.val() + '"]').prop('selected', true);
        }
        event.stopPropagation();
    }
    this.triggerElementClick = function (event) {
        var $hiddenEl = $('.hidden-step-element');
        var $target = $(event.target);
        if ($hiddenEl.is('button') || $target.is('input') || typeof $hiddenEl.attr('href') != 'undefined' || typeof $hiddenEl.attr('onclick') != 'undefined') {
            $('#multi-step').hide();
            $hiddenEl.click();
            $('#multi-step').find('[data-dismiss="modal"]').click();
        }
        event.stopPropagation();
    }
    this.copyNodeStyle = function (sourceNode, targetNode) {
        const computedStyle = window.getComputedStyle(sourceNode);
        const parentStyle = window.getComputedStyle(sourceNode.parentNode);
        Array.from(computedStyle).forEach(function (key, element) {
            if (computedStyle.getPropertyValue(key) != parentStyle.getPropertyValue(key)) {
                targetNode.style.setProperty(key, computedStyle.getPropertyValue(key), computedStyle.getPropertyPriority(key));
            }
        });
    }
    this.getCoords = function (focus) {
        var elem = document.querySelector('[data-tutorial="' + focus + '"]');
        var box = elem.getBoundingClientRect();
        return {
            top: box.top + pageYOffset,
            left: box.left + pageXOffset
        };
    }
    this.nextPrevButtonDisplay = function (el) {
        if ($(el).attr('aria-controls') == 'step1') { // && activeTutorialIndex == 0
            $('#multi-step').find('.prev-step').addClass('hidden');
        } else {
            $('#multi-step').find('.prev-step').removeClass('hidden');
        }
        if ($(el).attr('aria-controls') == 'step' + self.activeTutorialSteps.length) {
            $('#multi-step').find('.next-step').addClass('hidden');
        } else {
            $('#multi-step').find('.next-step').removeClass('hidden');
        }
        self.setActiveStep($(el).attr('data-step'));
        self.moveModalToElement();
    }
    this.skipTutorial = function () {
        AjaxController('skipTutorial', {id: self.activeTutorialId}, self.cntrlUrl, self.skipTutorialHandler, self.skipTutorialErrorHandler, true);
    }
    this.skipTutorialHandler = function (response) {
        $('#multi-step').find('[data-dismiss="modal"]').click();
        var page = window.location.pathname;
        self.tutorialPages.splice(self.tutorialPages.indexOf(page), 1);
    }
    this.skipTutorialErrorHandler = function (response) {}
    this.getUserTutorialsErrorHandler = function (response) {}
    this.getTutorialStepsErrorHandler = function (response) {}
    this.clickOnActiveStepElement = function () {
        if (typeof self.activeStep != 'undefined' && typeof self.activeStep.click != 'undefined' && self.activeStep.click != '') {
            $('#' + self.activeStep.click).trigger('click');
        }
    }
}