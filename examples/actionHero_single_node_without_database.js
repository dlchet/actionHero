// load in the actionHero class
var actionHero = require(__dirname + "/../api.js").actionHero; // normally if installed by npm: var actionHero = require("actionHero").actionHero;

// if there is no config.js file in the application's root, then actionHero will load in a collection of default params.  You can overwrite them with params.configChanges
var params = {};
params.configChanges = {
	"database" : null,
	"flatFileDirectory" : "../public/"
}

// any additional functions you might wish to define to be globally accessable can be added as part of params.initFunction.  The api object will be availalbe.
params.initFunction = function(api, next){
	next();
}

// start the server!
actionHero.start(params, function(api){
	api.log("Boot Sucessful!");
});