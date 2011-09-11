var apstrata = require('./lib/apstrata')

exports.saveChatRoom = function(name, success, failure) {
	attrs = {
		credentials: credentials.apstrata,
		operation: "SaveDocument", 
		params: {
			"apsdb.store": "DefaultStore",
			"docType": "chatroom",
			"apsdb.documentKey": name
		}, 
		success: function(json) {
			debug.log(json)
		}, 
		failure: function(json) {
			debug.log(json)
		}
	}
	// call apstrata
	var a = 1
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
	return chatRooms
}

exports.getUser = function(_id, success, failure) {

}