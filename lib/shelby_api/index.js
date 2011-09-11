var shelbyConsumerKey = 'dxhKbqnee6MtQxG23sTkRrdhvBIoUDYELy311yvp',
    shelbyConsumerSecret = 'Vey8e37gdJXeU9RkURVdm7ISwAHvrNTFbQPefn33'
// for dpwolf user
// var access_token = 'jKFREQP8HAhsGQRuhaA3Jy1vdwotKYmTrz6A9P4W',
//     access_token_secret = '09XQRL5gnS2CPJ1LCYVxJJYEMQMsNjAImug1U27A';

var OAuth = require('oauth').OAuth;

var oAuth = new OAuth("http://dev.shelby.tv/oauth/request_token",
                 "http://dev.shelby.tv/oauth/access_token", 
                 shelbyConsumerKey,shelbyConsumerSecret,
                 "1.0", 'http://localhost/oauth/callback', "PLAINTEXT");

exports.consumer = function() {
    return new OAuth(
    "http://dev.shelby.tv/oauth/request_token", "http://dev.shelby.tv/oauth/access_token",
    shelbyConsumerKey, shelbyConsumerSecret, "1.0", "http://li364-176.members.linode.com/", "HMAC-SHA1");
}


// exports.request_token = function(req,res){
//     var oa = new OAuth("http://dev.shelby.tv/oauth/request_token",
//                      "http://dev.shelby.tv/oauth/access_token", 
//                      shelbyConsumerKey,shelbyConsumerSecret,
//                      "1.0", 'http://localhost/oauth/callback', "HMAC-SHA1");
// 
//     oa.getOAuthRequestToken(function(error, oauth_token, oauth_token_secret, results){
//         if (error){
//             console.log('error',error)
//         } else {
//             console.log('request_token', oauth_token, oauth_token_secret)
//             req.session.oauth.token = oauth_token;
//             req.session.oauth.token_secret = oauth_token_secret;
//             res.redirect('http://dev.shelby.tv/oauth/access_token?'+oauth_token);
//         }
//     });
// }




exports.users = function(access_token, access_token_secret, error, callback){
    oAuth.get("http://api.shelby.tv/v1/users.json", access_token, access_token_secret, function(e, data) {
        if(e){
            if(typeof error === 'function'){
                error();
            }else{
                console.log('error',e);
            }
        }else{
            if(typeof callback === 'function'){
                callback(data);
            }else{
                console.log('users data response', data);
            }
        }
    });
}
exports.channels = function(access_token, access_token_secret, error, callback){
    oAuth.get("http://api.shelby.tv/v1/channels.json", access_token, access_token_secret, function(e, data) {
        if(e){
            if(typeof error === 'function'){
                error();
            }else{
                console.log('error',e);
            }
        }else{
            if(typeof callback === 'function'){
                callback(data);
                console.log('user', sys.inspect(data));
            }
        }
    });
}
exports.channel_broadcasts = function(id, access_token, access_token_secret, error, callback){
    oAuth.get("http://api.shelby.tv/v1/channels/" + id + "/broadcasts.json", access_token, access_token_secret, function(e, data) {
        if(e){
            if(typeof error === 'function'){
                error();
            }else{
                console.log('error',e);
            }
        }else{
            if(typeof callback === 'function'){
                callback(data);
                console.log('user', sys.inspect(data));
            }
        }
    });
}