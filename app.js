"use strict";

var _fs = require("fs");

var _fs2 = _interopRequireDefault(_fs);

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _snoocore = require("snoocore");

var _snoocore2 = _interopRequireDefault(_snoocore);

var _moment = require("moment");

var _moment2 = _interopRequireDefault(_moment);

var _handlebars = require("handlebars");

var _handlebars2 = _interopRequireDefault(_handlebars);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

require("babel-polyfill");

var Config = JSON.parse(_fs2.default.readFileSync(__dirname + "/config.json"));
var Templates = JSON.parse(_fs2.default.readFileSync(__dirname + "/templates/templates.json"));

for (var action in Templates.actions) {
	Templates.actions[action].post = _handlebars2.default.compile(_fs2.default.readFileSync(__dirname + "/templates/" + action + ".hbs", "utf8"));
	console.log(__dirname + "/templates/" + action + ".hbs");
}

for (var _action in Templates.logs) {
	Templates.logs[_action] = _handlebars2.default.compile(Templates.logs[_action]);
}

var latestAction = {
	created_utc: null,
	id: null
};

// checkModlog();
// setInterval(checkModlog, Config.checkInterval * 1000);

// async function
