var specHelper = require('../_specHelper.js').specHelper;
var suite = specHelper.vows.describe('API general functions');
var apiObj = {};
var net = require('net');

var client = {};
var client2 = {};
var client3 = {};

function makeSocketRequest(thisClient, cb, message){
	var rsp = function(d){ 
		parsed = JSON.parse(d);
		thisClient.removeListener('data', rsp); 
		cb(true, parsed); 
	};
	thisClient.on('data', rsp);
	thisClient.write(message + "\r\n");
}

suite.addBatch({
  'specHelper.prepare':{
    topic: function(){
      var cb = this.callback;
      specHelper.prepare(function(api){
		  client = net.connect(specHelper.params.socketServerPort, function(){
			  client.setEncoding('utf8');
			  client2 = net.connect(specHelper.params.socketServerPort, function(){
				  client2.setEncoding('utf8');
				  client3 = net.connect(specHelper.params.socketServerPort, function(){
					  client3.setEncoding('utf8');
					  apiObj = specHelper.cleanAPIObject(api);
					  cb();
				  }); 
			  }); 
		  });
      })
    },
    'api object should exist': function(){ specHelper.assert.isObject(apiObj); },
  }
});

suite.addBatch({
	"socket connections should be able to connect and get JSON": {
		topic: function(){ 
			makeSocketRequest(client, this.callback, "hello");
		}, 'should be a JSON response 1' : function(resp, d){
			specHelper.assert.isObject(d);
			specHelper.assert.equal("hello is not a known action.", d.error);
		}
	}
});

suite.addBatch({
	"single string message are treated as actions": {
		topic: function(){ 
			makeSocketRequest(client, this.callback, "status");
		}, 'works' : function(resp, d){
			specHelper.assert.isObject(d.stats);
			specHelper.assert.equal(d.stats.socketServer.numberOfSocketRequests, 3);
		}
	}
});

suite.addBatch({
	"default parms are set": {
		topic: function(){ 
			makeSocketRequest(client, this.callback, "paramsView");
		}, 'works' : function(resp, d){
			specHelper.assert.equal(d.params.limit, 100);
			specHelper.assert.equal(d.params.offset, 0);
		}
	}
});

suite.addBatch({
	"default parms can be updated": {
		topic: function(){ makeSocketRequest(client, this.callback, "paramAdd limit=50"); }, 
		'works' : function(resp, d){ specHelper.assert.equal(d.status, "OK"); }
	}
});

suite.addBatch({
	"actions will fail without proper parmas set to the connection": {
		topic: function(){ makeSocketRequest(client, this.callback, "cacheTest"); }, 
		'works' : function(resp, d){ specHelper.assert.equal(d.error, "key is a required parameter for this action"); }
	}
});

suite.addBatch({
	"a new param can be added": {
		topic: function(){ makeSocketRequest(client, this.callback, "paramAdd key=socketTestKey"); }, 
		'works' : function(resp, d){ specHelper.assert.equal(d.status, "OK"); }
	}
});

suite.addBatch({
	"a new param can be viewed once added": {
		topic: function(){ makeSocketRequest(client, this.callback, "paramView key"); }, 
		'works' : function(resp, d){ specHelper.assert.equal(d.params.key, "socketTestKey");}
	}
});

suite.addBatch({
	"another new param can be added": {
		topic: function(){ makeSocketRequest(client, this.callback, "paramAdd value=abc123"); }, 
		'works' : function(resp, d){ specHelper.assert.equal(d.status, "OK"); }
	}
});

suite.addBatch({
	"actions will work once all the needed params are added": {
		topic: function(){ makeSocketRequest(client, this.callback, "cacheTest"); }, 
		'works' : function(resp, d){ specHelper.assert.equal(d.cacheTestResults.saveResp, true); }
	}
});

suite.addBatch({
	"updated parms persist": {
		topic: function(){ makeSocketRequest(client, this.callback, "paramsView"); }, 
		'works' : function(resp, d){ specHelper.assert.equal(d.params.limit, 50); }
	}
});

suite.addBatch({
	"clients start in the default room": {
		topic: function(){ makeSocketRequest(client, this.callback, "roomView"); }, 
		'works' : function(resp, d){ specHelper.assert.equal(d.room, apiObj.configData.defaultSocketRoom); }
	}
});

suite.addBatch({
	"clients can view additional infor about rooms they are in": {
		topic: function(){ makeSocketRequest(client, this.callback, "roomView"); }, 
		'works' : function(resp, d){ specHelper.assert.equal(d.roomStatus.membersCount, 3); }
	}
});

suite.addBatch({
	"rooms can be changed": {
		topic: function(){ makeSocketRequest(client, this.callback, "roomChange otherRoom");}, 
		'works' : function(resp, d){ specHelper.assert.equal(d.status, "OK"); }
	}
});

suite.addBatch({
	"rooms changes persist": {
		topic: function(){ makeSocketRequest(client, this.callback, "roomView"); }, 
		'works' : function(resp, d){ specHelper.assert.equal(d.room, "otherRoom"); }
	}
});

suite.addBatch({
	"connections in the first room see the count go down": {
		topic: function(){ makeSocketRequest(client2, this.callback, "roomView"); }, 
		'works' : function(resp, d){ specHelper.assert.equal(d.roomStatus.membersCount, 2); }
	}
});

suite.addBatch({
	"folks in my room hear what I say (and say works)": {
		topic: function(){ 
			cb = this.callback;
			var rsp = function(d){ 
				parsed = JSON.parse(d);
				client3.removeListener('data', rsp); 
				cb(true, parsed); 
			};
			client3.on('data', rsp);
			client2.write("say hello?" + "\r\n");
		}, 
		'works' : function(resp, d){specHelper.assert.equal(d.message, "hello?"); }
	}
});

suite.addBatch({
	"folks NOT in my room DON'T hear what I say": {
		topic: function(){ 
			cb = this.callback;
			var rsp = function(d){ 
				parsed = JSON.parse(d);
				client.removeListener('data', rsp); 
				cb(true, parsed); 
			};
			var noDataRsp = function(){
				client.removeListener('data', rsp); 
				cb(true, 'no data');
			}
			client.on('data', rsp);
			client3.write("say hello?");
			setTimeout(noDataRsp, 1000);
		}, 
		'works' : function(resp, d){ specHelper.assert.equal(d, "no data"); }
	}
});



// export
suite.export(module);
