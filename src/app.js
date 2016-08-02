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
}

for (let action in Templates.logs) {
	Templates.logs[action] = Handlebars.compile(Templates.logs[action]);
}

var latestAction = {
	created_utc: null,
	id: null
};

main();
setInterval(main, Config.checkInterval * 1000);

async function main() {
	console.log("starting...");
	
	let modActions = await getNewActions(Config.watchSub);
	
	console.log(`total actions this update: ${modActions.length}`);
}

function getNewActions(subreddit) {
	let actions = [];
	console.log(`subreddit: ${subreddit}`)
	let i = 1;
	
	function handleSlice(slice) {
		if (slice.empty) return actions;
		
		for (let action of slice.children) {
			actions = actions.concat(action.data);
		}
		
		if (latestAction.created_utc != null) {
			console.log(`${slice.children.length} new actions in slice`);
			
			if (actions[0] != undefined && moment(actions[0].created_utc * 1000).utc() > latestAction.created_utc) {
				latestAction.created_utc = moment(actions[0].created_utc * 1000).utc();
				latestAction.id = actions[0].id;
			}
		} else {
			console.log(`INITIALIZED LATESTACTION`);
			latestAction.created_utc = moment(actions[0].created_utc * 1000).utc();
			latestAction.id = actions[0].id;
			
			return actions;
		}
		
		return slice.next().then(handleSlice);
	}
	
	return new Promise((resolve, reject) => {
		return reddit(`/r/${subreddit}/about/log`)
			.listing({before: latestAction.id})
			.then(handleSlice).then((actions) => {
				resolve(actions);
		});
	});
}