	$(document).ready(function(){
		var socket = io.connect('http://localhost');
		socket.emit('set nickname',{room_id:$('#room_id').text(),'nickname':$('#username').text()});
		
		socket.on('new user',function(data){
			$('.chat-list').append('<li><div class="status-bar"><span class="status available"></span></div><div class="user-space"><img src="http://img.tweetimag.es/i/'+data.nickname+'"+username class="avatar"><span class="username">'+data.nickname+'</span></div></li>');
		});

		socket.on('ready',function(data){
			$.each(data.user_list,function(k,v){
				$('.chat-list').append('<li><div class="status-bar"><span class="status available"></span></div><div class="user-space"><img src="http://img.tweetimag.es/i/"+v class="avatar"><span class="username">'+v+'</span></div></li>');
			});
		});

		socket.on('new msg',function(data){
			var usrname = $('.message-box').last().children('.username').eq(0);
			if(usrname.text() == data.nickname+' says:'){

				$('.message-box').last().children('.message-text').append('<br />'+data.msg);
				
			} else{
				var now = new Date();
				$('.chats').append('<div class="chat-box"><div class="user"><img src="http://img.tweetimag.es/i/'+data.nickname+'" class="avatar"></div><div class="message-box"><span>'+now.getHours()+':'+((now.getMinutes() < 10) ? '0' : '') + now.getMinutes() +'</span><span class="username">'+data.nickname+' says:</span><div class="message-text">'+data.msg+'</div></div></div>');
			}
			$('.chats').scrollTop($('.chats').height());
		});
		
		socket.on('user leave',function(data){
			$('.chat-list li').each(function(k,v){
				if($(v).last().last().text() == data.nickname)
					$(v).remove();
			});
		});

		$("#msgbox").keypress(function(e) {
			if (e.which == 13) {
				socket.emit('my msg',{'msg': $(this).val(),'room_id':$('#room_id').text()});
				$(this).val('');
				return false;
			}
		});
	});


















