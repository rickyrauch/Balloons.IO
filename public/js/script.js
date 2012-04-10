$(function() {
	$(".dropdown a.selected").click(function() {
		$('.create-room').show().next(".text").hide();
	  $(this).toggleClass("active");
		$(this).next(".dropdown-options").toggle();
	});
	

	
	$(".create-room").click(function() {
		$(this).hide();
		$(this).next(".text").fadeIn();
	});
	
	$(".lock").click(function() {
		$(this).toggleClass('active');
	});
	
	$(".fancybox").fancybox({'margin': 0, 'padding': 0});
	
	$(".invite-people").click(function(){
		$(this).hide().after('<p class="inviting-people">Inviting peple, please wait.</p>').delay(2000).hide().after('something');
	});
	
});