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
	created_utc: (0, _moment2.default)().utc(),
	id: undefined
};

main();
setInterval(main, Config.checkInterval * 1000);

function main() {
	var modActions, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, _action2;

	return regeneratorRuntime.async(function main$(_context) {
		while (1) {
			switch (_context.prev = _context.next) {
				case 0:
					_context.next = 2;
					return regeneratorRuntime.awrap(getNewActions(Config.watchSub));

				case 2:
					modActions = _context.sent;


					console.log("total new actions this update: " + modActions.length);
					_iteratorNormalCompletion = true;
					_didIteratorError = false;
					_iteratorError = undefined;
					_context.prev = 7;
					for (_iterator = modActions[Symbol.iterator](); !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
						_action2 = _step.value;

						console.log((0, _moment2.default)(_action2.created_utc * 1000).valueOf(), _action2.id);
					}
					_context.next = 15;
					break;

				case 11:
					_context.prev = 11;
					_context.t0 = _context["catch"](7);
					_didIteratorError = true;
					_iteratorError = _context.t0;

				case 15:
					_context.prev = 15;
					_context.prev = 16;

					if (!_iteratorNormalCompletion && _iterator.return) {
						_iterator.return();
					}

				case 18:
					_context.prev = 18;

					if (!_didIteratorError) {
						_context.next = 21;
						break;
					}

					throw _iteratorError;

				case 21:
					return _context.finish(18);

				case 22:
					return _context.finish(15);

				case 23:
					console.log("");

				case 24:
				case "end":
					return _context.stop();
			}
		}
	}, null, this, [[7, 11, 15, 23], [16,, 18, 22]]);
}

function getNewActions(subreddit) {
	var modActions = [];
	var sliceLimit = 2;

	return new Promise(function (resolve, reject) {
		console.log(latestAction.id);

		return reddit("/r/" + subreddit + "/about/log").listing({ before: latestAction.id, limit: sliceLimit }).then(function (slice) {
			if (slice.empty) return modActions;

			var _iteratorNormalCompletion2 = true;
			var _didIteratorError2 = false;
			var _iteratorError2 = undefined;

			try {
				for (var _iterator2 = slice.children[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
					var _action3 = _step2.value;

					modActions = modActions.concat(_action3.data);

					if (latestAction.id === undefined) {
						latestAction.id = _action3.data.id;
						latestAction.created_utc = (0, _moment2.default)(_action3.data.created_utc * 1000).utc();
					} else if ((0, _moment2.default)(_action3.data.created_utc * 1000).utc() >= latestAction.created_utc) {
						latestAction.id = _action3.data.id;
						latestAction.created_utc = (0, _moment2.default)(_action3.data.created_utc * 1000).utc();
					}
				}
			} catch (err) {
				_didIteratorError2 = true;
				_iteratorError2 = err;
			} finally {
				try {
					if (!_iteratorNormalCompletion2 && _iterator2.return) {
						_iterator2.return();
					}
				} finally {
					if (_didIteratorError2) {
						throw _iteratorError2;
					}
				}
			}

			return modActions;
		}).then(function (modActions) {
			resolve(modActions);
		});
	});
}
