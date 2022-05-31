jssor_1_slider_init = function() {
	var jssor_1_options = {
	  $AutoPlay: true,
	  $AutoPlaySteps: 1,
	  $SlideDuration: 160,
	  $SlideWidth: 263,
	  $SlideSpacing: 50,
	  $Cols: 4,
	  $ArrowNavigatorOptions: {
		$Class: $JssorArrowNavigator$,
		$Steps: 1
	  },
	  $BulletNavigatorOptions: {
		$Class: $JssorBulletNavigator$,
		$SpacingX: 1,
		$SpacingY: 1,
		$Scale: false
	  }
	};
	
	var jssor_1_slider = new $JssorSlider$("jssor_1", jssor_1_options);
	
	//responsive code begin
	//you can remove responsive code if you don't want the slider scales while window resizes
	function ScaleSlider() {
		var refSize = jssor_1_slider.$Elmt.parentNode.clientWidth;
		if (refSize) {
			refSize = Math.min(refSize, 1200);
			jssor_1_slider.$ScaleWidth(refSize);
		}
		else {
			window.setTimeout(ScaleSlider, 30);
		}
	}
	ScaleSlider();
	$Jssor$.$AddEvent(window, "load", ScaleSlider);
	$Jssor$.$AddEvent(window, "resize", $Jssor$.$WindowResizeFilter(window, ScaleSlider));
	$Jssor$.$AddEvent(window, "orientationchange", ScaleSlider);
	//responsive code end
};
jssor_1_slider_init();

var down = false;
var animating = false;
var divs = '';
var dir = 'up'; // wheel scroll direction
var div = 0; // current div
var wide = true;
$(document).ready(function(){
	$('#v_feat').click(function(){
		window.location.href="../features/";
	});
	$('#v_pr').click(function(){
		window.location.href="../pricing/";
	});
	divs = $('.home_sec');
	checkWidth();
	$(document).mousedown(function() {
		down = true;
	}).mouseup(function() {
		down = false;  
	});
	$(document.body).on('DOMMouseScroll mousewheel', function (e) {
		if (e.originalEvent.detail > 0 || e.originalEvent.wheelDelta < 0) {
			dir = 'down';
		} else {
			dir = 'up';
		}
		div = -1;
		divs.each(function(i){
			if (div<0 && ($(this).offset().top >= $(window).scrollTop())) {
				div = i;
			}
		   
		});
		if(div < 0 || $(window).scrollTop() + $(window).height() == $(document).height()){
			div = 7;
		}
		if(div != 0)
			div--;
		checkSection(div);
		
	});
	function checkPosition(diff){
		if(wide){
			checkSection();
			animating = true;
			time = 300;
			if(diff){
				time = time*Math.abs(diff)/2;
			}
			$('html,body').stop().animate({
				scrollTop: divs.eq(div).offset().top
			}, time, function(){
				animating = false;
			});
		}
	}
	function checkSection(){
		$('.point').removeClass('active');
		$('.point').eq(div).addClass('active');
	}
	$('.point').click(function(){
		var diff = $(this).index() - div;
		div +=diff;
		checkPosition(diff)
	})
	function checkWidth(){
		if($(window).width() < 750){
			wide = false;
			$('#scroll_nav').hide();
			
		}else{
			wide = true;
			$('#scroll_nav').show();
			$('html,body').scrollTop(divs.eq(div).offset().top);
		}
	}
	
	checkPosition();
	
})
function moveSextion(direction){
	if(direction == '0'){//up
		$('.home_sec').each(function(){
			if($(this).offset().top - $(window).scrollTop() == 0){
				console.log('top section ' + $(this).attr('class'))
			}
		})
	}else{ //down
		$(window).scroll()
		$('.home_sec').each(function(){
			if($(this).offset().top - $(window).scrollTop() == 0){
			   
			}
		})
	}
}