$(function() {
	var USERS = window.USERS = {};

	$('.people a').each(function(index, element) {
		USERS[$(element).data('username')] = 1;
	});

	//View handlers
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

	//Socket.io
	var socket = io.connect('http://localhost');

	socket.emit('set nickname', {
		room_id: $('#room_id').text(),
		nickname: $('#username').text()
	});

	socket.on('new user', function(data) {
		if(!USERS[data.nickname]) {
			data.status = "available"; //this should be retrieved from server!!
			$('.online .people').prepend(ich.people_box(data));
			USERS[data.nickname] = 1;
		}
	});

	socket.on('new msg', function(data) {
		var now = new Date(),
			hours = now.getHours(),
			minutes = now.getMinutes(),
			seconds = now.getSeconds(),
			tt = hours > 12 ? "PM" : "AM";

		data.time = {
			hr: hours > 12 ? hours - 12 : hours,
			min: minutes < 10 ? "0" + minutes : minutes,
			sec: seconds < 10 ? "0" + seconds : seconds,
			tt: tt
		};

		$('.chat').append(ich.chat_box(data));
		$('.chat').scrollTop($('.chat').height());
	});

	socket.on('user leave', function(data) {
		console.log("user " + data.nickname + " is leaving");
		$('.people a').each(function(index, element) {
			console.log("loking to one who leaved at index: ", index)
			if($(element).data('username') == data.nickname) {
				console.log("removed " + data.nickname + "at index: " + index)
				$(element).remove();
				USERS[data.nickname] = 0;
			}
		});
	});

	$(".chat-input input").keypress(function(e) {
		if(e.which == 13) {
			socket.emit('my msg', {
				msg: $(this).val(),
				room_id: $('#room_id').text()
			});

			$(this).val('');

			return false;
		}
	});

	//THIS IS THE SAME AS NEW USER NOW
	socket.on('ready', function(data) {
		$.each(data.user_list, function(k,v) {
			$('.chat-list').append('<li><div class="status-bar"><span class="status available"></span></div><div class="user-space"><img src="http://img.tweetimag.es/i/"+v class="avatar"><span class="username">' + v + '</span></div></li>');
		});
	});
});