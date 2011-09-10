var express = require('express')
    ,app = express.createServer()
    , io = require('socket.io').listen(app)
    , OAuth = require('oauth').OAuth
    , sys = require('sys')
    , shelby = require('./lib/shelby_api')

    // access tokens for dpwolf
    var access_token = 'jKFREQP8HAhsGQRuhaA3Jy1vdwotKYmTrz6A9P4W',
        access_token_secret = '09XQRL5gnS2CPJ1LCYVxJJYEMQMsNjAImug1U27A';
        shelby.users(access_token, access_token_secret, function(error){
            console.log('error',error);
        }, function(data){
            console.log('users data',data)
        })


        // oAuth.get("http://api.shelby.tv/v1/users.json", access_token, access_token_secret, function(error, data) {
        //     console.log('users', sys.inspect(data));
        // });
        // oAuth.get("http://api.shelby.tv/v1/channels.json", access_token, access_token_secret, function(error, data) {
        //     if(!error){
        //         var channels = JSON.parse(data);
        //         if(channels.length){
        //             for(channel in channels){
        //                 console.log('channel',channels[channel]['_id'], channels[channel]);                        
        //                 oAuth.get("http://api.shelby.tv/v1/channels/" + channels[channel]['_id'] + "/broadcasts.json", access_token, access_token_secret, function(error, channel_data) {
        //                     if(!error){
        //                         console.log('channel data' ,JSON.parse(channel_data));
        //                     }
        //                 });
        //             }
        //         }
        //     }
        // });

  app.configure(function(){
    app.use(express.static(__dirname + '/public'));
  });


app.listen(80);

app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});

var rooms = {};

function leave_room(socket){
    socket.get('room',function(err,room){
        if(err){
            console.log(err);
        }else{
            socket.leave(room);
            console.log('*********leave room: ',room);
            socket.get('nickname',function(err, nickname){
                if(err){
                    console.log(err);
                }else{
                    if(rooms[room]){
                        for(var i in rooms[room].members){
                            if(rooms[room].members[i]==nickname){
                                rooms[room].members.splice(i,1);
                            }
                        }
                    }
                    socket.broadcast.to(room).emit('member left room',nickname);
                    socket.emit('member left room',nickname);
                }
                if(rooms[room]){
                    socket.broadcast.to(room).emit('list room members',rooms[room].members);
                }
                list_rooms(socket);
            });
        }
    })
}

function list_rooms(socket){
    var room_list = [];
    for(rm in rooms){
        if(rm && rooms[rm].members.length){
            room_list.push({name:rm, count:rooms[rm].members.length});
        }else{
            delete rooms[rm];
        }
    }
    socket.emit('list rooms',room_list);
    socket.broadcast.emit('list rooms',room_list);
}

io.sockets.on('connection', function (socket) {
    list_rooms(socket);

    socket.on('set nickname', function (name) {
        socket.set('nickname', name, function () {
            console.log('***********nickname set:', name)
            socket.emit('nickname set');
        });
    });
    socket.on('chat',function(message){
        socket.get('nickname', function(err, nickname){
            if(err){
                console.log('****** nickname error');
                console.log(err);
            }else{
                socket.get('room', function(err, room){
                    if(err){
                        console.log('****** room error',err);
                    }else{
                        socket.emit('chat',{from:nickname,message:message});
                        socket.broadcast.to(room).emit('chat', {from:nickname,message:message});
                    }
                });
            }
       });
       
       
    });

    socket.on('join room', function(room){
        console.log('****** joining room');
        socket.get('nickname', function(err, nickname){
            if(err){
                console.log('****** nickname error');
                console.log(err);
            }else{
                console.log('***********name:',nickname);

                // var rooms = io.sockets.manager.rooms;
                // console.log('*********io',io.sockets.manager)

                socket.get('room', function(err,oldroom){
                    if(err){
                        console.log(err);
                    }else{
                        if(oldroom){
                            leave_room(socket);
                        }
                    }
                })

                socket.join(room);
                socket.set('room', room);
                console.log('***********room:',room);

                if(rooms){
                    if(rooms[room]){
                        rooms[room].members.push(nickname);
                    }else{
                        rooms[room] = {members:[nickname],videos:[]};
                    }
                }

                socket.emit('room joined', room);
                list_rooms(socket);
                socket.emit('list room members',rooms[room].members);
                socket.broadcast.to(room).emit('new room member', nickname);
            }
        })
    })

    socket.on('leave room', function(){
        leave_room(socket);
    })
    
    // socket.send('room_name',{ current_video: 'http://vimeo.com/10866394' });
    socket.on('add video', function (url) {
        
        console.log('********* add video ',url)
        var vid = url.replace('http://vimeo.com/','').replace('http://www.vimeo.com/','').replace('/','');
        console.log('************** vid',vid);
        var api_path = '/api/v2/video/' + vid + '.json';

        socket.get('nickname',function(err, nickname){
            if(err){
                console.log(err);
            }else{
                socket.get('room', function(err,room){
                    if(err){
                        console.log(err);
                    }else{
                        var options = {url:'http://vimeo.com/' + api_path,json:true};
                        var request = require('request');
                        request(options,function(error,response,body){
                            if (!error && response.statusCode == 200) {
                                var video = body[0];
                                // console.log('****room',room);
                                var video = {url:url,from:nickname,title:video.title};
                                rooms[room].videos.push(video);
                                socket.emit('add video',video);
                                socket.broadcast.to(room).emit('add video',video);
                                // socket.emit('update video queue',rooms[room].videos);
                                // socket.broadcast.to(room).emit('update video queue',rooms[room].videos);
                            }
                        })
                    }
                })
            }
        })
    });
});