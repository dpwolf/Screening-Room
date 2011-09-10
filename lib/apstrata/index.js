var MD5 = require("./MD5")
    , request = require('request')


/*
 * attrs = {credentials: [credentials *object], 
 * 			operation: [apstrata valid operation like SaveDocument *string], 
 *			params: [operation params *object], 
 *			success: [success callback *function],
 *			failure: [failure callback *function]
 */
exports.call = function(attrs) {
	var params = ""

	// transform flat params object into query string 	
	if (attrs.params) for (var arg in attrs.params) {
		params += arg + "=" + attrs.params[arg] + "&"
	}

	var url = sign(attrs.credentials, attrs.operation, params)
	debug.log (url)
	
	request(url, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			debug.log (body)
			if (attrs.success) attrs.success(JSON.parse(body))
		} else {
			debug.log ("ERROR calling:" + url)
			if (attrs.failure) attrs.failure(JSON.parse(body))
		}
	})
}

// apstrata call signing function
var sign = function (credentials, operation, params) {
	var timestamp = new Date().getTime() + '';
	
	responseType = "json"
	
	var signature = ''
	var userName =''
	var valueToHash = ''
	
	if (credentials.username && credentials.password && credentials.username != '' && credentials.password != '') {
			valueToHash = timestamp + credentials.username + operation + MD5.encode(credentials.password).toUpperCase()
			signature = MD5.encode(valueToHash)
			userName = credentials.username;
	} else if(credentials.secret && credentials.secret != ''){
			valueToHash = timestamp + credentials.key + operation + credentials.secret
			signature = MD5.encode(valueToHash)
	}

	var apswsReqUrl = "https://sandbox.apstrata.com/apsdb/rest"
					+ "/" + credentials.key
					+ "/" + operation
					+ "?apsws.time=" + timestamp
					+ ((signature!="")?"&apsws.authSig=":"") + signature
					+ ((userName!="")?"&apsws.user=":"") + userName
					+ "&apsws.responseType=json"
					+ "&apsws.authMode=simple"
					+ ((params!="")?"&":"") + params

	return {url: apswsReqUrl, signature: signature};
}
