$(document).ready(function(){
    if(window.location.hash.indexOf('oauth_token') > -1){
        var params_array = window.location.hash.replace('#','').split('&');
        // window.location.hash = '';
        var oauth_token = params_array[0].split('=')[1];
        var oauth_token_secret = params_array[1].split('=')[1];
        // var nickname = params_array[2].split('=')[1];
        $('#oauth_token').val(oauth_token);
        $('#oauth_token_secret').val(oauth_token_secret);
        // $('#username').val(nickname);
        $('#log-in').hide();
        $('#set-nickname').show();
        // window.location.hash = '';
    }
    
    $('#log-in').live('submit',function(){
        window.location.pathname = 'connect';
        return false;
    });

    $('#set-nickname').live('submit',function(){
        set_nickname();
        return false;
    });
    
    $('.x-join-room').live('click',function(){
        if(nickname){
            var room = $(this).data('room');
            join_room(room);
        }else{
            alert('Please choose a nickname before you join a room');
        }
    });
    
    $('#chat-input').live('submit',function(){
        if(socket){
            socket.emit('chat',$('#chat-input input').val());
            $('#chat-input input').val('');
        }
        return false;
    });
    
    
})


var username_is_set = false,
    nickname = false,
    video_queue = [],
    old_video_queue = [],
    current_video = null;

function addEvent(element, eventName, callback) {
    if (element.addEventListener) {
        element.addEventListener(eventName, callback, false);
    }
    else {
        element.attachEvent(eventName, callback, false);
    }
}

function setup_event_listners(){
    var froogaloop = $f(document.querySelectorAll('iframe')[0]);
    froogaloop.addEvent('finish',play_next_video);
}

function ready() {
    setup_event_listners();
}

function embedVideo(video) {
    document.getElementById('embed').innerHTML = unescape(video.html);

    /**
     * Utility function for adding an event. Handles the inconsistencies
     * between the W3C method for adding events (addEventListener) and
     * IE's (attachEvent).
     */

    // Listen for the ready event for any vimeo video players on the page
    var vimeoPlayers = document.querySelectorAll('iframe'),
        player;

    for (var i = 0, length = vimeoPlayers.length; i < length; i++) {
        player = vimeoPlayers[i];
        console.warn(player);
        $f(player).addEvent('ready', ready);
    }
}

function set_nickname(){
    nickname = document.getElementById('username').value;
    var oauth_token = document.getElementById('oauth_token').value;
    var oauth_token_secret = document.getElementById('oauth_token_secret').value;
    if(nickname){
        socket.emit('set nickname',{"nickname":nickname,"oauth_token":oauth_token,"oauth_token_secret":oauth_token_secret})
        console.log('set nickname',nickname)
    }else{
        alert('need a name mothafucka!');
    }
}

function join_room(room){
    var room = room || document.getElementById('room').value;
    if(room){
        socket.emit('join room',room)
        console.log('join room',room)
    }else{
        alert('need a room mothafucka!');
    }
}
function leave_room(){
    socket.emit('leave room');
    $('#leave_room').hide();
}

function add_video(url){
    socket.emit('add video', url);
}

function play_next_video(){
    if(current_video){
        old_video_queue.push(current_video);
        current_video = null;
    }
    if(video_queue){
        var video = video_queue.shift();

        if(video){
            current_video = video;

            console.log('play_video',video);
            // alert(data.current_video)

            // This is the URL of the video you want to load
            var videoUrl = video.url;

            // This is the oEmbed endpoint for Vimeo (we're using JSON)
            // (Vimeo also supports oEmbed discovery. See the PHP example.)
            var endpoint = 'http://www.vimeo.com/api/oembed.json';

            // Tell Vimeo what function to call
            var callback = 'embedVideo';

            // Put together the URL
            var url = endpoint + '?url=' + encodeURIComponent(videoUrl) + '&callback=' + callback + '&width=640&height=360&autoplay=true&api=true';


            // This function loads the data from Vimeo

            // document.getElementById('from').innerHTML = 'This video is brought to you by ' + video.from;

            if(embed = document.getElementById('vimeo_embed')){
                document.getElementsByTagName('head').item(0).removeChild(embed);
            }
            var js = document.createElement('script');
            js.setAttribute('type', 'text/javascript');
            js.setAttribute('src', url);
            js.setAttribute('id','vimeo_embed');
            document.getElementsByTagName('head').item(0).appendChild(js);
        }else{
            alert('No more videos! Add one!');
        }
    }else{
        alert('No more videos! Add one!');
    }
}


function show_upcoming_video(){

}

  socket = io.connect('/');
  socket.on('list rooms',function(rooms){
      console.log('rooms',rooms)
      $('#rooms').empty();
      $(rooms).each(function(i,room){
          $('#rooms').append('<li class="x-join-room" data-room="' + room.name + '">' + room.name + ' (<span>' + room.count + '</span>)</li>');
      });
  });

  socket.on('list room members',function(members){
      $('#users-in-room').empty();
      console.log(members)
      $(members).each(function(i,member){
          $('#users-in-room').append('<li>' + member + '</li>');
      });
  })

  socket.on('update video queue',function(queue){
      video_queue = queue;
      console.log('video_queue',video_queue);
      if($('iframe').length){
          // play_next_video();
      }else{
          play_next_video();
      }
  });

  socket.on('add video',function(video){
      video_queue.push(video);
      if(!current_video){
          play_next_video();
      }
  });

  socket.on('chat', function(message){
      $('.chat-display').append('<p><span class="u-name red">' + message.from + ': </span>' + message.message + '</p>');
      console.warn('chat message',message);
  })

  socket.on('new room member',function(member){
      if(member != nickname){
          $('#users-in-room').prepend('<li>' + member + '</li>');
      }
  });

  socket.on('member left room',function(member){
      if(member == nickname){
          $('#users-in-room').empty();
          $('#current-room').empty();
          $('#embed').empty();
          current_video = false;
          video_queue = [];
          $('#add-video').hide();
          $('#add-room').show();
      }
      console.log('member left room',member);
  });

  socket.on('nickname set',function(){
      $('#set-nickname').hide();
      $('#add-room').show();
      // alert('nickname set');
  });

  socket.on('shelby videos',function(json){
      console.warn('shelby videos',json);
      js = json;
  })

  socket.on('room joined',function(room){
     $('#add-room').hide();
     $('#add-video').show();
     $('#leave_room').show();
     $('#current-room').text(room);
      // alert('room joined');
  });

  // socket.on('add video', function (video) {
  //
  // });
