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
      data.history.reverse()
      data.history.forEach(function(historyLine) {
        var time = new Date(historyLine.atTime),
          chatBoxData = {
            nickname: historyLine.from,
            msg: historyLine.withData,
            time: time,
            tt: time.getHours() > 12 ? "PM" : "AM"
          };

        $('.chat').prepend(ich.chat_box(chatBoxData));
        $('.chat').scrollTop(chatHeight());
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

      // Check update time
      var time = new Date(),
        noticeBoxData = {
          noticeMsg: message,
          time: time,
          tt: time.getHours() > 12 ? "PM" : "AM"
        };

      $('.chat').append(ich.chat_notice(noticeBoxData));
      $('.chat').scrollTop(chatHeight());
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

    // Check update time
    var time = new Date(),
      noticeBoxData = {
        noticeMsg: message,
        time: time,
        tt: time.getHours() > 12 ? "PM" : "AM"
      };

    $('.chat').append(ich.chat_notice(noticeBoxData));
    $('.chat').scrollTop(chatHeight());
  });

  socket.on('new msg', function(data) {
    var time = new Date();

    data.time = time;
    data.tt = time.getHours() > 12 ? "PM" : "AM";

    $('.chat').append(ich.chat_box(data));
    $('.chat').scrollTop(chatHeight());
  });

  socket.on('user leave', function(data) {
    var nickname = $('#username').text()
      , message = "$username has left the room.";
    
    $('.people a').each(function(index, element) {
      var checkUsername = $(element).data('username');

      if(checkUsername == data.nickname) {
        if (checkUsername != nickname ) {
          $(element).remove();
          USERS[data.nickname] = 0;

          // Chat notice
          message = message
                .replace('$username', data.nickname);

          // Check update time
          var time = new Date(),
            noticeBoxData = {
              noticeMsg: message,
              time: time,
              tt: time.getHours() > 12 ? "PM" : "AM"
            };

          $('.chat').append(ich.chat_notice(noticeBoxData));
          $('.chat').scrollTop(chatHeight());
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
  });

  var chatHeight = function() {
    var elementsNo = $('.chat').children().length
      , maxHeight = $('.chat-box').outerHeight() || 80;

    return elementsNo * maxHeight;
  }
});