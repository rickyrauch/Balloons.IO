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

	socket.on('ready', function(data) {
		//If chat is empty, request for history!
		if($('.chat .chat-box').length == 0) {
			socket.emit('history request');
		}
	});

	socket.on('history response', function(data) {
		if(data.history && data.history.length) {
			data.history.forEach(function(historyLine) {
				console.log(historyLine);
				var time = new Date(historyLine.atTime),
					hours = time.getHours(),
					minutes = time.getMinutes(),
					seconds = time.getSeconds(),
					tt = hours > 12 ? "PM" : "AM";

				chatBoxData = {
					nickname: historyLine.username,
					msg: historyLine.message,
					time: {
						hr: hours > 12 ? hours - 12 : hours,
						min: minutes < 10 ? "0" + minutes : minutes,
						sec: seconds < 10 ? "0" + seconds : seconds,
						tt: tt
					}
				};

				$('.chat').append(ich.chat_box(chatBoxData));
				$('.chat').scrollTop($('.chat').height());
			});
		}
	});

	socket.on('new user', function(data) {
		var message = "$username has joined the room.";

		if(!USERS[data.nickname]) {
			$('.online .people').prepend(ich.people_box(data));
			USERS[data.nickname] = 1;

			// Chat notice
			message = message
						.replace('$username', data.nickname);

			$('.chat').append(ich.chat_notice({
				noticeMsg: message
			})).scrollTop($('.chat').height());
		}
	});

	socket.on('user-info update', function(data) {
		var message = "$username is now $status.";

		// Update dropdown
		if(data.username == $('#username').text()) {
			$('.dropdown-status .list a').toggleClass('current', false);
			$('.dropdown-status .list a.' + data.status).toggleClass('current', true);

			$('.dropdown-status a.selected')
				.removeClass('available away busy');

			$('.dropdown-status a.selected').addClass(data.status).html('<b></b>' + data.status);
		}

		// Update users list
		$('.people a[data-username=' + data.username + ']')
			.removeClass('available away busy')
			.addClass(data.status);

		// Chat notice
		message = message
					.replace('$username', data.username)
					.replace('$status', data.status);

		$('.chat').append(ich.chat_notice({
			noticeMsg: message
		})).scrollTop($('.chat').height());
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
		var nickname = $('#username').text(),
			message = "$username has left the room.";

		console.log("hey, " + nickname + "!! The user " + data.nickname + " is leaving somewhere!!");
		
		$('.people a').each(function(index, element) {
			var checkUsername = $(element).data('username');

			if(checkUsername == data.nickname) {
				if (checkUsername != nickname ) {
					$(element).remove();
					USERS[data.nickname] = 0;

					console.log(data.nickname + " was just removed from list at index: " + index);
					// Chat notice
					message = message
								.replace('$username', data.nickname);

					$('.chat').append(ich.chat_notice({
						noticeMsg: message
					})).scrollTop($('.chat').height());
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
		socket.emit('set status', {
			status: $(this).data('status')
		});
	})

	//THIS IS THE SAME AS NEW USER NOW
	// socket.on('ready', function(data) {
	// 	$.each(data.user_list, function(k,v) {
	// 		$('.chat-list').append('<li><div class="status-bar"><span class="status available"></span></div><div class="user-space"><img src="http://img.tweetimag.es/i/"+v class="avatar"><span class="username">' + v + '</span></div></li>');
	// 	});
	// });
});