var specHelper = {}

specHelper.vows = require('vows');
specHelper.assert = require('assert');
specHelper.request = require('request');

specHelper.params = {
	"database" : {
		"host" : "127.0.0.1",
		"database" : "node_dave_api_test",
		"username" : "root",
		"password" : null,
		"port" : "3306",
		"consoleLogging" : false,
	},
	"cluster" : false,
	"webServerPort" : 8081,
	"socketServerPort" : 5001,
	"logging":false,
	"cronProcess":false
};

specHelper.tables = [
	"Caches", "Logs", "Sessions"
];

specHelper.prepare = function(next){
	specHelper.cleanDB(function(){
		specHelper.startServer(function(api){
			next(api);
		});
	});
}

////////////////////////////////////////////////////////////////////////////
// Start Test Server
specHelper.startServer = function(next){
	var nodeDaveAPI = require(__dirname + "/api.js").nodeDaveAPI;
	nodeDaveAPI.start({configChanges: specHelper.params}, function(api){
		console.log("test server started");
		next(api);
	});
}

////////////////////////////////////////////////////////////////////////////
// Clean Test DB
specHelper.cleanDB = function(next){
	var mysql = require('mysql');
	var mySQLparams = {
	  user: specHelper.params.database.username,
	  password: specHelper.params.database.password,
	  port: specHelper.params.database.port,
	  host: specHelper.params.database.host,
	  database: specHelper.params.database.database,
	};
	rawDBConnction = mysql.createClient(mySQLparams);

	var running = 0;
	for(var i in specHelper.tables){
		running++;
		rawDBConnction.query('TRUNCATE '+ specHelper.tables[i], function(err, rows, fields){
			running--
			if(running == 0){
				console.log("test DB Truncated");
				next();
			}
		});
	}
}

////////////////////////////////////////////////////////////////////////////
// API request
specHelper.apiTest = {
  general: function( method, url, data, cb ){
    //console.log( 'cb?', cb )
    specHelper.request(
      {
        method: method,
        url: "http://127.0.0.1:"+specHelper.params.webServerPort+(url||''),
        json: data || {}
      },
      function(req, res){
        cb( res )
      }
    )
  },
  get: function( url, data, cb  ){ specHelper.apiTest.general( 'GET', url, data, cb    )  },
  post: function( url, data, cb ){ specHelper.apiTest.general( 'POST', url, data, cb   )  },
  put: function( url, data, cb  ){ specHelper.apiTest.general( 'PUT', url, data, cb    )  },
  del: function( url, data, cb  ){ specHelper.apiTest.general( 'DELETE', url, data, cb )  }
}

////////////////////////////////////////////////////////////////////////////
// API object cleanup
specHelper.cleanAPIObject = function(api){
	var cleanAPI = {}
	cleanAPI["actions"] = api["actions"];
	cleanAPI["tasks"] = api["tasks"];
	cleanAPI["utils"] = api["utils"];
	return cleanAPI
}

////////////////////////////////////////////////////////////////////////////
// EXPORT
exports.specHelper = specHelper;