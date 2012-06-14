$(function() {
  var USERS = window.USERS = {};

  $('.people a').each(function(index, element) {
    USERS[$(element).data('username')] = 1;
  });

  //View handlers
  $(".dropdown a.selected").click(function() {
    $('.create-room').show().next("form .text").hide();
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
  var socket = io.connect();

  socket.on('error', function (reason){
    console.error('Unable to connect Socket.IO', reason);
  });

  socket.on('connect', function (){
    console.info('successfully established a working connection');
    if($('.chat .chat-box').length == 0) {
      socket.emit('history request');
    }
  });

  socket.on('history response', function(data) {
    if(data.history && data.history.length) {
      var $firstInput
        , firstInputUser;

      data.history.reverse();

      data.history.forEach(function(historyLine) {
        var time = new Date(historyLine.atTime)
          , chatBoxData = {
              nickname: historyLine.from,
              msg: historyLine.withData,
              type: 'history',
              time: time,
              tt: time.getHours() > 12 ? "PM" : "AM"
            };

        if(firstInputUser === chatBoxData.nickname) {
          $firstInput.find('h5').after(ich.chat_box_text(chatBoxData));
        } else {
          $('.chat').prepend(ich.chat_box(chatBoxData));

          $firstInput = $('.chat-box[data-type="history"]');
          firstInputUser = chatBoxData.nickname;
        }

        $('.chat').scrollTop(chatHeight());
      });
    }
  });

  socket.on('new user', function(data) {
    var message = "$username has joined the room.";

    //If user is not 'there'
    if(!$('.people a[data-username="' + data.nickname + '"]').length) {
      //Then add it
      $('.online .people').prepend(ich.people_box(data));
      USERS[data.nickname] = 1;

      // Chat notice
      message = message
            .replace('$username', data.nickname);

      // Check update time
      var time = new Date()
        , noticeBoxData = {
            user: data.nickname,
            noticeMsg: message,
            time: time,
            tt: time.getHours() > 12 ? "PM" : "AM"
          };
      
      var $lastChatInput = $('.chat').children().last();
      
      if($lastChatInput.hasClass('notice') && $lastChatInput.data('user') === data.nickname) {
        $lastChatInput.replaceWith(ich.chat_notice(noticeBoxData));
      } else {
        $('.chat').append(ich.chat_notice(noticeBoxData));
        $('.chat').scrollTop(chatHeight());
      }
    } else {
      //Instead, just check him as 'back'
      USERS[data.nickname] = 1;
    }
  });

  socket.on('user-info update', function(data) {
    var message = "$username is now $status.";

    // Update dropdown
    if(data.username === $('#username').text()) {
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

    // Check update time
    var time = new Date()
      , noticeBoxData = {
          user: data.username,
          noticeMsg: message,
          time: time,
          tt: time.getHours() > 12 ? "PM" : "AM"
        };

      var $lastChatInput = $('.chat').children().last();
      
      if($lastChatInput.hasClass('notice') && $lastChatInput.data('user') === data.username) {
        $lastChatInput.replaceWith(ich.chat_notice(noticeBoxData));
      } else {
        $('.chat').append(ich.chat_notice(noticeBoxData));
        $('.chat').scrollTop(chatHeight());
      }
  });

  socket.on('new msg', function(data) {
    var time = new Date(),
        $lastInput = $('.chat').children().last(),
        lastInputUser = $lastInput.data('user');

    data.type = 'chat';
    data.time = time;
    data.tt = time.getHours() > 12 ? "PM" : "AM";

    if($lastInput.hasClass('chat-box') && lastInputUser === data.nickname) {
      $lastInput.append(ich.chat_box_text(data));
    } else {
      $('.chat').append(ich.chat_box(data));
    }

    $('.chat').scrollTop(chatHeight());
  });

  socket.on('user leave', function(data) {
    var nickname = $('#username').text()
      , message = "$username has left the room.";
    
    for (var username in USERS) {
      if(username === data.nickname && username != nickname) {
        //Mark user as leaving
        USERS[username] = 0;

        //Wait a little before removing user
        setTimeout(function() {
          //If not connected
          if (!USERS[username]) {
            //Remove it and notify
            $('.people a[data-username="' + username + '"]').remove();

            // Chat notice
            message = message
                  .replace('$username', data.nickname);

            // Check update time
            var time = new Date(),
              noticeBoxData = {
                user: data.nickname,
                noticeMsg: message,
                time: time,
                tt: time.getHours() > 12 ? "PM" : "AM"
              };

            var $lastChatInput = $('.chat').children().last();
            
            if($lastChatInput.hasClass('notice') && $lastChatInput.data('user') === data.nickname) {
              $lastChatInput.replaceWith(ich.chat_notice(noticeBoxData));
            } else {
              $('.chat').append(ich.chat_notice(noticeBoxData));
              $('.chat').scrollTop(chatHeight());
            }
          };
        }, 2000);
      }
    }
  });

  $(".chat-input input").keypress(function(e) {
    if(e.which == 13) {
      socket.emit('my msg', {
        msg: $(this).val()
      });

      $(this).val('');

      return false;
    }
  });

  $('.dropdown-status .list a').click(function(e) {
    socket.emit('set status', {
      status: $(this).data('status')
    });
  });

  var chatHeight = function() {
    var elementsNo = $('.chat').children().length
      , maxHeight = $('.chat-box').outerHeight() || 80;

    return elementsNo * maxHeight;
  }
});