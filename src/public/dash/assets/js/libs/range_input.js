/****************
	*  Range Input  *
    *  
    *   <div class="range-field ez_range_field_valuelist" id="canEditTime">
            <input value="0" type="range" name="canEditTime" data-valuelist='[{"v":"900", "l":"15min"}, {"v":"1800", "l":"30min"}, {"v":"3600", "l":"1h"}, {"v":"7200", "l":"2h"}, {"v":"10800", "l":"3h"}, {"v":"21600", "l":"6h"}, {"v":"28800", "l":"8h"}, {"v":"43200", "l":"12h"}, {"v":"86400", "l":"24h"}, {"v":"0", "l":"always"}]' />
        </div>
        or
        <div class="range-field">
            <input type="range" id="soloAobrdMPH" min="1" max="15" class="form-control" value="" />
        </div>
****************/
jQuery.fn.velocity = jQuery.fn.animate
var range_type = 'input[type=range]';
var range_mousedown = false;
var left;
var range_wrapper = '.range-field';

var getRangeValuelist = function(this1) {
	valuelist = false;
    if (typeof(this1.data('valuelist')) != 'undefined') valuelist = this1.data('valuelist');
    return valuelist;
};
function init_range_input(selector = ''){
    if (selector == '') {
        selector = range_type;
    }
    $(selector).each(function () {
        valuelist = getRangeValuelist($(this));
        if (valuelist) {
            $(this).after('<input type="hidden" name="'+$(this).attr('name')+'" value="'+$(this).val()+'" />');
            $(this).attr('min', 0);
            $(this).attr('max', valuelist.length - 1);
            $(this).data('name', $(this).attr('name')).attr('data-name', $(this).attr('name')).attr('name', $(this).attr('name')+'_range');
            $(this).val(valuelist[$(this).val()].v);
        }
            var thumb = $('<span class="thumb"><span class="value"></span></span>');
            $(this).after(thumb);
    });
}
init_range_input();

var showRangeBubble = function (thumb) {
    var paddingLeft = parseInt(thumb.parent().css('padding-left'));
    valuelist = getRangeValuelist(thumb.closest(range_wrapper).find('input[type="range"]'));
    if (valuelist) {
        var marginLeft = -10 + paddingLeft + 'px';
        thumb.velocity({ height: "35px", width: "35px", top: "-35px", marginLeft: marginLeft }, { duration: 300, easing: 'easeOutExpo' });
    } else {
        var marginLeft = -7 + paddingLeft + 'px';
        thumb.velocity({ height: "30px", width: "30px", top: "-30px", marginLeft: marginLeft }, { duration: 300, easing: 'easeOutExpo' });
    }
};

var calcRangeOffset = function (range) {
	var width = range.width() - 15;
	var max = parseFloat(range.attr('max'));
	var min = parseFloat(range.attr('min'));
	var percent = (parseFloat(range.val()) - min) / (max - min);
    return percent * width;
};

$(document).on('change', range_type, function () {
    valuelist = getRangeValuelist($(this));
    var thumb = $(this).siblings('.thumb');
    if (valuelist) {
        thumb.find('.value').html(valuelist[$(this).val()].l);
        $(this).nextAll('input[name="'+$(this).data('name')+'"]:first').val(valuelist[$(this).val()].v);
    } else {
        thumb.find('.value').html($(this).val());
    }
    if (!thumb.hasClass('active')) {
        showRangeBubble(thumb);
    }
    var offsetLeft = calcRangeOffset($(this));
    thumb.addClass('active').css('left', offsetLeft);
});

$(document).on('mousedown touchstart', range_type, function (e) {
    
	var thumb = $(this).siblings('.thumb');
	// If thumb indicator does not exist yet, create it
	if (thumb.length <= 0) {
		thumb = $('<span class="thumb"><span class="value"></span></span>');
		$(this).after(thumb);
	}
	
    valuelist = getRangeValuelist($(this));
	// Set indicator value
    if (valuelist) thumb.find('.value').html(valuelist[$(this).val()].l);
    else thumb.find('.value').html($(this).val());
    
	range_mousedown = true;
	$(this).addClass('active');
	
	if (!thumb.hasClass('active')) {
		showRangeBubble(thumb);
	}
	
	if (e.type !== 'input') {
		var offsetLeft = calcRangeOffset($(this));
		thumb.addClass('active').css('left', offsetLeft);
	}
});

$(document).on('mouseup touchend', range_wrapper, function () {
	range_mousedown = false;
	$(this).removeClass('active');
});

$(document).on('input mousemove touchmove', range_wrapper, function (e) {
	var thumb = $(this).children('.thumb');
	var input = $(this).find(range_type);
	
	if (range_mousedown) {
		if (!thumb.hasClass('active')) {
			showRangeBubble(thumb);
		}
		
		var offsetLeft = calcRangeOffset(input);
		thumb.addClass('active').css('left', offsetLeft);
        
        valuelist = getRangeValuelist(input);
        // Set indicator value
        if (valuelist) thumb.find('.value').html(valuelist[thumb.siblings(range_type).val()].l);
        else thumb.find('.value').html(thumb.siblings(range_type).val());
	}
});

$(document).on('mouseout touchleave', range_wrapper, function () {
	if (!range_mousedown) {
		
		var thumb = $(this).children('.thumb');
		var paddingLeft = parseInt($(this).css('padding-left'));
		var marginLeft = 7 + paddingLeft + 'px';
		
		if (thumb.hasClass('active')) {
			thumb.velocity({ height: '0', width: '0', top: '10px', marginLeft: marginLeft }, { duration: 100 });
		}
		thumb.removeClass('active');
	}
});