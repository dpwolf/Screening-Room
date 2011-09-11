var express = require('express')
    ,app = express.createServer()
    , io = require('socket.io').listen(app)
    , OAuth = require('oauth').OAuth
    , sys = require('sys')
    , shelby = require('./lib/shelby_api')
    , sanitizer = require('sanitizer')
    , apstrata = require('./lib/apstrata')
    , persistence = require('./persistence.js')

// access tokens for dpwolf
var access_token = 'jKFREQP8HAhsGQRuhaA3Jy1vdwotKYmTrz6A9P4W',
    access_token_secret = '09XQRL5gnS2CPJ1LCYVxJJYEMQMsNjAImug1U27A';

    credentials = {}
    credentials.apstrata = {
        key: "M261074715",
        secret: "MEAF6122B07DFA4BEE598C245646C3C0"
    }

    //
    // until i figure out a better way to debug, little debug function to keep console screen tidy
    //  run node myApp.js | grep DEBUG-MSG
    //
    debug = {}
    debug.log = function(msg) {
    	console.log("DEBUG-MSG ", msg)
    }

    // get dpwolf's user info
    // shelby.users(access_token, access_token_secret, function(error){
    //     console.log('error',error);
    // }, function(data){
    //     console.log('users data',data)
    // });

// app.use(express.logger());
app.use(express.bodyParser());
app.use(express.cookieParser());
app.use(express.session({
    secret: "sadlfkjaslkjfwoeu3r2"
}));


app.configure(function(){
    app.use(express.static(__dirname + '/public'));
});


app.listen(80);

app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});

app.get('/connect', function (req, res) {
    // do stuff
    console.log('login');
    shelby.consumer().getOAuthRequestToken(function(error, oauthToken, oauthTokenSecret, results){
      if (error) {
        console.log('error',error)
        res.send("Error getting OAuth request token : " + sys.inspect(error), 500);
      } else {  
            console.log('login stuff ', oauthToken,oauthTokenSecret)
        req.session.oauthRequestToken = oauthToken;
        req.session.oauthRequestTokenSecret = oauthTokenSecret;
        res.redirect("http://dev.shelby.tv/oauth/authorize?oauth_token="+oauthToken);      
      }
    });
    
});

app.get('/oauth/callback', function(req, res){
    sys.puts(">>"+req.session.oauthRequestToken);
    sys.puts(">>"+req.session.oauthRequestTokenSecret);
    sys.puts(">>"+req.query.oauth_verifier);
    shelby.consumer().getOAuthAccessToken(req.session.oauthRequestToken, req.session.oauthRequestTokenSecret, req.query.oauth_verifier, function(error, oauthAccessToken, oauthAccessTokenSecret, results) {
    if (error) {
      res.send("Error getting OAuth access token : " + sys.inspect(error) + "["+oauthAccessToken+"]"+ "["+oauthAccessTokenSecret+"]"+ "["+sys.inspect(results)+"]", 500);
    } else {
        console.log('oauthyy', oauthAccessToken,oauthAccessTokenSecret);

      req.session.oauthAccessToken = oauthAccessToken;
      req.session.oauthAccessTokenSecret = oauthAccessTokenSecret;

      shelby.users(req.session.oauthAccessToken, req.session.oauthAccessTokenSecret, function(){console.log('error')}, function(data){
          res.redirect('/#oauth_token=' + oauthAccessToken + '&oauth_token_secret=' + oauthAccessTokenSecret + "&name=" + JSON.parse(data)[0].nickname);
      })
    }
    });
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
    // if (rooms === {}) {
    //     persistence.listChatRooms(
    //         function(savedRooms) {
    //             console.log(savedRooms)
    //             var room_list = [];
    //             for (var i=0; i<savedRooms.length; i++) {
    //                 rooms[savedRooms[i]] = {members: [], videos: []}
    //             }
    //             
    //         }, 
    //         function(err) {console.log(err)}
    //     );
    // }else{
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
    // }
 
}

function list_shelby_videos(socket){
    socket.get('oauth_token&secret', function(err, oauthandsecret){
        if(!err){
            var oauth_token = oauthandsecret.split('&')[0];
            var oauth_token_secret = oauthandsecret.split('&')[1];
            console.log(oauth_token, oauth_token_secret, '     !!');
            shelby.channels(oauth_token, oauth_token_secret, function(error){
                console.log('error',error);
            }, function(channels){
                console.log('channels',channels);
                var id = JSON.parse(channels)[1]['_id'];
                console.log('id',id);
                shelby.channel_broadcasts(id, oauth_token, oauth_token_secret, function(error){
                    console.log('error',error);
                }, function(broadcasts){
                    var json = JSON.parse(broadcasts);
                    var video_list = [];
                    for(i=0;i<json.length;i++){
                        if(json[i].video_provider_name == 'vimeo'){
                            video_list.push(json[i]);
                        }
                    }
                    socket.emit('shelby videos', video_list);
                });
            });
        }
    });
}


io.sockets.on('connection', function (socket) {
    list_rooms(socket);

    socket.on('set nickname', function (info) {
        if(sanitizer.sanitize(info.nickname)){
            socket.set('nickname', sanitizer.sanitize(info.nickname), function () {
                console.log('***********nickname set:', info.nickname)
                socket.set('oauth_token&secret', info.oauth_token + '&' + info.oauth_token_secret, function () {
                    socket.emit('nickname set');
                    list_shelby_videos(socket);
                });

            });
        }
    });
    socket.on('chat',function(message){
        if(sanitizer.sanitize(message)){
             socket.get('nickname', function(err, nickname){
                 if(err){
                     console.log('****** nickname error');
                     console.log(err);
                 }else{
                     socket.get('room', function(err, room){
                         if(err){
                             console.log('****** room error',err);
                         }else{
                             socket.emit('chat',{from:nickname,message:sanitizer.sanitize(message)});
                             socket.broadcast.to(room).emit('chat', {from:nickname,message:sanitizer.sanitize(message)});
                         }
                     });
                 }
            });
        }
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

                room = sanitizer.sanitize(room);
                if(room){
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
                    persistence.saveChatRoom(room, function(json) {
                        console.log('saved chat room',json)
                    }, function(json) {
                        console.log('error saving chat room');
                    });
                    socket.emit('room joined', room);
                    list_rooms(socket);
                    socket.emit('list room members',rooms[room].members);
                    socket.broadcast.to(room).emit('new room member', nickname);
                }
            }
        })
    })

    socket.on('leave room', function(){
        leave_room(socket);
    })
    
    socket.on('get shelby user',function(){
        console.log('get shelby user');
    });
    
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