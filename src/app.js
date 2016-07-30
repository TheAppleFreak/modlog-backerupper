require("babel-polyfill");

import fs from "fs";
import _ from "lodash";
import Snoocore from "snoocore";
import moment from "moment";
import Handlebars from "handlebars";

var Config = JSON.parse(fs.readFileSync(__dirname + "/config.json"));
var Templates = JSON.parse(fs.readFileSync(__dirname + "/templates/templates.json"));

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

for (let action in Templates.actions) {
	Templates.actions[action].post = Handlebars.compile(fs.readFileSync(`${__dirname}/templates/${action}.hbs`, "utf8"));
	console.log(`${__dirname}/templates/${action}.hbs`);
}

for (let action in Templates.logs) {
	Templates.logs[action] = Handlebars.compile(Templates.logs[action]);
}

var latestAction = {
	created_utc: null,
	id: null
};

// main();
// setInterval(main, Config.checkInterval * 1000);

async function main() {
	let newModActions = await checkModlog();
	
	logCheck(newModActions);
	
	if (newModActions.length > 1) {
		for (let action of newModActions) {
			submitModlogPost(action).then(logSubmit);
		}
	}
}

function checkModlog() {
	let newModActions = [];
	
	function handleSlice(slice) {
		if (slice.empty) resolve (newModActions);
		
		for (let action of slice.children) {
			if (latestAction.created_utc != null) {
				if (latestAction.created_utc < moment(action.data.created_utc * 1000).utc()) {
					latestAction.created_utc = moment(action.data.created_utc * 1000).utc();
					latestAction.id = action.data.id;
				}
			} else {
				latestAction.created_utc = moment(action.data.created_utc * 1000).utc();
				latestAction.id = action.data.id;
			}
			
			newModActions.push(action.data);
		}
		
		return slice.next().then(handleSlice);
	}
	
	return new Promise(function(resolve, reject) {
		reddit(`/r/${Config.watchSub}/about/log`)
			.listing({before: latestAction.id})
			.then(handleSlice);
	});
}

function logCheck(const newModActions) {
	if (newModActions.length > 0) {
		if (latestAction.created_utc != null) {
			console.log(Templates.logs.check({
				actionsSince: newModActions.length,
				lastActionTime: latestAction.created_utc.format("dddd, MMMM Do YYYY, h:mm:ss a")
			}));
		} else {
			// iterating over this just in case index 0 isn't the largest
			for (var action of newModActions) {
				if (latest.created_utc != null) {
					if (latest.created_utc < moment(action.created_utc * 1000).utc()) {
						latest.created_utc = moment(action.created_utc * 1000).utc();
						latest.id = action.id;
					}
				} else {
					latest.created_utc = moment(action.created_utc * 1000).utc();
					latest.id = action.id;
				}
			}

			console.log(Templates.logs.check({
				actionsSince: newModActions.length,
				lastActionTime: latestAction.created_utc.format("dddd, MMMM Do YYYY, h:mm:ss a")
			}));
		}
	} else {
		console.log(Templates.logs.check({
			actionsSince: newModActions.length,
			lastActionTime: latestAction.created_utc.format("dddd, MMMM Do YYYY, h:mm:ss a")
		}));
	}
}

function submitModlogPost(let action) {
	
}