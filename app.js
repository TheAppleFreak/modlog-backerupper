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

var reddit = new _snoocore2.default({
	userAgent: "(PCMRBot Beta) Mod log backer upper script v0.2, by /u/TheAppleFreak",
	oauth: {
		type: "script",
		key: Config.key,
		secret: Config.secret,
		redirectUri: Config.redirectUri,
		username: Config.username,
		password: Config.password,
		scope: ["modlog", "read", "identity", "submit"]
	}
});

for (var action in Templates.actions) {
	Templates.actions[action].post = _handlebars2.default.compile(_fs2.default.readFileSync(__dirname + "/templates/" + action + ".hbs", "utf8"));
}

for (var _action in Templates.logs) {
	Templates.logs[_action] = _handlebars2.default.compile(Templates.logs[_action]);
}

var latestAction = {
	created_utc: null,
	id: null
};

main();
setInterval(main, Config.checkInterval * 1000);

function main() {
	var modActions;
	return regeneratorRuntime.async(function main$(_context) {
		while (1) {
			switch (_context.prev = _context.next) {
				case 0:
					console.log("starting...");

					_context.next = 3;
					return regeneratorRuntime.awrap(getNewActions(Config.watchSub));

				case 3:
					modActions = _context.sent;


					console.log("total actions this update: " + modActions.length);

				case 5:
				case "end":
					return _context.stop();
			}
		}
	}, null, this);
}

function getNewActions(subreddit) {
	var modActions = [];
	var sliceCount = 2;

	function handleSlice(slice) {
		if (slice.empty) return modActions;

		var _iteratorNormalCompletion = true;
		var _didIteratorError = false;
		var _iteratorError = undefined;

		try {
			for (var _iterator = slice.children[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
				var _action2 = _step.value;

				modActions = modActions.concat(_action2.data);
			}
		} catch (err) {
			_didIteratorError = true;
			_iteratorError = err;
		} finally {
			try {
				if (!_iteratorNormalCompletion && _iterator.return) {
					_iterator.return();
				}
			} finally {
				if (_didIteratorError) {
					throw _iteratorError;
				}
			}
		}

		if (latestAction.created_utc != null) {
			console.log(slice.children.length + " new actions in slice");

			if (modActions[0] != undefined && (0, _moment2.default)(modActions[0].created_utc * 1000).utc() > latestAction.created_utc) {
				latestAction.created_utc = (0, _moment2.default)(modActions[0].created_utc * 1000).utc();
				latestAction.id = modActions[0].id;
			}
		} else {
			console.log("INITIALIZED LATESTACTION");
			latestAction.created_utc = (0, _moment2.default)(modActions[0].created_utc * 1000).utc();
			latestAction.id = modActions[0].id;

			return modActions;
		}

		if (slice.children.length < sliceLimit) {
			return modActions;
		} else {
			return slice.next().then(handleSlice);
		}
	}

	return new Promise(function (resolve, reject) {
		return reddit("/r/" + subreddit + "/about/log").listing({ before: latestAction.id, limit: sliceLimit }).then(handleSlice).then(function (modActions) {
			resolve(modActions);
		});
	});
}
