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
		var nickname = $('#username').text();

		console.log("hey, " + nickname + "!! The user " + data.nickname + " is leaving somewhere!!");
		
		$('.people a').each(function(index, element) {
			var checkUsername = $(element).data('username');

			if(checkUsername == data.nickname) {
				if (checkUsername != nickname ) {
					$(element).remove();
					USERS[data.nickname] = 0;

					console.log(data.nickname + " was just removed from list at index: " + index);
				};
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

	$('.dropdown-status .list a').click(function(e) {
		var $this = $(this),
			status = 'available';

		$('.dropdown-status .list a').toggleClass('current', false);
		$this.toggleClass('current', true);

		$('.dropdown-status a.selected')
			.removeClass('available')
			.removeClass('away')
			.removeClass('busy');

		if($this.hasClass('away')) {
			$('.dropdown-status a.selected').addClass('away').html('<b></b>away');
			status = 'away';
		} else if($this.hasClass('busy')) {
			$('.dropdown-status a.selected').addClass('busy').html('<b></b>busy');
			status = 'busy';
		} else {
			$('.dropdown-status a.selected').addClass('available').html('<b></b>available');
		}

		socket.emit('set status', {
			status: status
		});
	})

	//THIS IS THE SAME AS NEW USER NOW
	// socket.on('ready', function(data) {
	// 	$.each(data.user_list, function(k,v) {
	// 		$('.chat-list').append('<li><div class="status-bar"><span class="status available"></span></div><div class="user-space"><img src="http://img.tweetimag.es/i/"+v class="avatar"><span class="username">' + v + '</span></div></li>');
	// 	});
	// });
});