var fs = require("fs");
var _ = require("lodash");
var Snoocore = require("snoocore");
var moment = require("moment");
var Handlebars = require("handlebars");

var Config = require("./config.json");
var templates = require("./templates/templates.json");

var reddit = new Snoocore({
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

for (var action in templates.actions) {
	templates.actions[action].post = Handlebars.compile(fs.readFileSync(__dirname + "/templates/" + action + ".hbs", "utf8"));
	templates.actions[action].title = Handlebars.compile(templates.actions[action].title);
}

for (var action in templates.logs) {
	templates.logs[action] = Handlebars.compile(templates.logs[action]);
}

var latest = {
	created_utc: null,
	id: null
};

checkModlog();
setInterval(checkModlog, Config.checkInterval * 1000);

function checkModlog(){
	return reddit("/r/" + Config.watchSub + "/about/log").listing({before: latest.id}).then(function(slice){
		if(latest.created_utc != null) {
			console.log(templates.logs.check({
				actionsSince: slice.children.length,
				lastActionTime: latest.created_utc.format("dddd, MMMM Do YYYY, h:mm:ss a")
			}));
		} else {
			latest.created_utc = moment(slice.children[0].data.created_utc * 1000).utc();
			latest.id = slice.children[0].data.id;
			console.log(templates.logs.init({
				lastActionTime: latest.created_utc.format("dddd, MMMM Do YYYY, h:mm:ss a")
			}));

			return true;
		}

		slice.children.forEach(function(action){
			if (latest.created_utc != null) {
				if (latest.created_utc < moment(action.data.created_utc * 1000).utc()) {
					latest.created_utc = moment(action.data.created_utc * 1000).utc();
					latest.id = action.data.id;
				}
			} else {
				latest.created_utc = moment(action.data.created_utc * 1000).utc();
				latest.id = action.data.id;
			}
			
			action.data.time = moment().utc(action.data.created_utc * 1000).format("dddd, MMMM Do YYYY, HH:mm:ss");
			
			if (templates.actions[action.data.action] === undefined) {
				action.data.response = JSON.stringify(action.data, null, 4).replace(/^/gm, "    ");
				
				return reddit("/api/submit").post({
					kind: "self", 
					sr: Config.logSub,
					text: templates.actions.unknown.post(action.data),
					title: templates.actions.unknown.title(action.data)
				}).then(function(){
					console.log(templates.logs.unknown({
						currentTime: moment().format("HH:mm:ss"),
						action: action.data.target_fullname,
						actionTime: moment(action.data.created_utc * 1000).utc().format("Y/M/D HH:mm:ss")
					}));
				})
				return false;
			}
			
			action.data.target_type = _.startsWith(action.data.target_fullname, "t1") ? "comment" : "submission";
			
			return reddit("/api/submit").post({
				kind: "self", 
				sr: Config.logSub,
				text: templates.actions[action.data.action].post(action.data),
				title: templates.actions[action.data.action].title(action.data)
			}).then(function(){
				console.log(templates.logs.post({
					currentTime: moment().format("HH:mm:ss"),
					action: action.data.action,
					actionTime: moment(action.data.created_utc * 1000).utc().format("Y/M/D HH:mm:ss")
				}));
			});
		});
	});
}
