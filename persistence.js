var apstrata = require('./lib/apstrata')

function escapeKey(value) {
	
}

function unescapeKey(value) {

}


exports.saveChatRoom = function(name, success, failure) {
	attrs = {
		credentials: credentials.apstrata,
		operation: "RunScript", 
		params: {
			"apsdb.scriptName": "saveChatRoom",
			"name": name
		}, 
		success: function(json) {
			debug.log(json)
		}, 
		failure: function(json) {
			debug.log(json)
		}
	}

	apstrata.call(attrs)
}

exports.saveUser = function(_id, success, failure) {
	attrs = {
		credentials: credentials.apstrata,
		operation: "SaveDocument", 
		params: {
			"apsdb.store": "DefaultStore",
			"docType": "user",
			"apsdb.documentKey": _id
		}, 
		success: function(json) {
			debug.log(json)
		}, 
		failure: function(json) {
			debug.log(json)
		}
	}

	apstrata.call(attrs)
}

exports.listChatRooms = function(success, failure) {
	var chatRooms = {}
	
	attrs = {
		credentials: credentials.apstrata,
		operation: "Query", 
		params: {
			"apsdb.store": "DefaultStore",
			"apsdb.query": 'docType=\"chatroom\"',
			"apsdb.queryFields": "apsdb.documentKey, name",
			"apsdb.pageNumber": "1",
			"apsdb.resultsPerPage": "50"
		}, 
		success: function(json) {
			debug.log(json.response.result.documents)
		}, 
		failure: function(json) {
			debug.log(json)
		}
	}

	apstrata.call(attrs)	
}

exports.getUser = function(_id, success, failure) {

}