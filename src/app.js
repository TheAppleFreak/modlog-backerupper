require("babel-polyfill");

import fs from "fs";
import _ from "lodash";
import Snoocore from "snoocore";
import moment from "moment";
import Handlebars from "handlebars";

var Config = JSON.parse(fs.readFileSync(`${__dirname}/config.json`));
var Templates = JSON.parse(fs.readFileSync(`${__dirname}/templates/templates.json`));

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
	let modActions = [];
	let sliceLimit = 2;
	let originalActionId = latestAction.id;
	
	function handleSlice(slice) {
		if (slice.empty) return modActions;
		
		for (let action of slice.children) {
			if (action.data.id != originalActionId) {
				modActions = modActions.concat(action.data);
			} else {
				return modActions;
			}
		}
		
		if (latestAction.created_utc != null) {
			console.log(`${slice.children.length} new actions in slice`);
			
			if (modActions[0] != undefined && moment(modActions[0].created_utc * 1000).utc() > latestAction.created_utc) {
				latestAction.created_utc = moment(modActions[0].created_utc * 1000).utc();
				latestAction.id = modActions[0].id;
			}
		} else {
			console.log(`INITIALIZED LATESTACTION`);
			latestAction.created_utc = moment(modActions[0].created_utc * 1000).utc();
			latestAction.id = modActions[0].id;
			
			return modActions;
		}
		
		if (slice.children.length < sliceLimit) {
			return modActions;
		} else {
			return slice.next().then(handleSlice);
		}
	}
	
	return new Promise((resolve, reject) => {
		return reddit(`/r/${subreddit}/about/log`)
			.listing({before: latestAction.id, limit: sliceLimit})
			.then(handleSlice).then((modActions) => {
				resolve(modActions);
		});
	});
}