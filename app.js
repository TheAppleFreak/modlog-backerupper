var _ = require("lodash");
var Snoocore = require("snoocore");
var moment = require("moment");
var Config = require("./config.js");

String.prototype.format = String.prototype.f = function() {
	var s = this,
	i = arguments.length;
	while (i--) {
		if (arguments[i] == null) arguments[i] = "null";
		s = s.replace(new RegExp('\\{' + i + '\\}', 'gm'), arguments[i]);
	}
	return s;
};
var reddit = new Snoocore({
	userAgent: "Mod log backer upper script v0.1, by /u/TheAppleFreak",
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

/*
0 - Mod username
1 - Action type
2 - Time of action
3 - Post title
4 - Permalink
5 - Post type
6 - Poster username
7 - Post body
*/

var titleString = "{0} {1} {2} by /u/{3}"

var actionString = "**Moderator**: /u/{0}  \n\
**Action**: {1}  \n\
**Time**: {2}\n\n\
---\n\n\
# [{3}]({4}) ({5}) - /u/{6}\n\n\
{7}";

var latest = {
	created_utc: null,
	id: null
};

checkModlog();
setInterval(checkModlog, 60000);

function checkModlog(){
return reddit("/r/{0}/about/log".f(Config.watchSub)).listing({before: latest.id}).then(function(slice){
	if(latest.created_utc != null) {
		console.log("\nChecked for new mod actions; found {0} new actions since {1}".f(slice.children.length, latest.created_utc.format("dddd, MMMM Do YYYY, h:mm:ss a")));
	} else {
		latest.created_utc = moment(slice.children[0].data.created_utc * 1000).utc();
		latest.id = slice.children[0].data.id;
		console.log("\nChecked for mod actions starting at {0} onwards".f(latest.created_utc.format("dddd, MMMM Do YYYY, h:mm:ss a")));

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
		
		var selfPost = actionString.f(
				action.data.mod,
				action.data.action,
				moment().utc(action.data.created_utc * 1000).format("dddd, MMMM Do YYYY, h:mm:ss a"),
				action.data.target_title,
				action.data.target_permalink,
				_.startsWith(action.data.target_fullname, "t1") ? "comment" : "submission",
				action.data.target_author,
				action.data.target_body
			);
		var title = titleString.f(
				action.data.mod,
				action.data.action,
				_.startsWith(action.data.target_fullname, "t1") ? "comment" : "submission",
				action.data.target_author
			);
		
		return reddit("/api/submit").post({
			kind: "self", 
			sr: Config.logSub,
			text: selfPost,
			title: title
		}).then(function(){
			console.log("Made log post at {0} (id: {1}, post time: {2})".f(	moment().format("dddd, MMMM Do YYYY, h:mm:ss a"),
											action.data.target_fullname, 
											moment(action.data.created_utc * 1000).utc().format("l LTS")));
		});
	});
});
}
