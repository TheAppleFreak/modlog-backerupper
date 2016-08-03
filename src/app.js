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
	created_utc: moment().utc(),
	id: undefined
};

main();
setInterval(main, Config.checkInterval * 1000);

async function main() {	
	let modActions = await getNewActions(Config.watchSub);
	
	console.log(`total new actions this update: ${modActions.length}`);
	for (let action of modActions) {
		console.log(moment(action.created_utc * 1000).valueOf(), action.id);
	}
	console.log("");
}

function getNewActions(subreddit) {
	let modActions = [];
	let sliceLimit = 2;
	
	return new Promise((resolve, reject) => {
		console.log(latestAction.id);
		
		return reddit(`/r/${subreddit}/about/log`)
			.listing({before: latestAction.id, limit: sliceLimit})
			.then((slice) => {
				if (slice.empty) return modActions;
				
				for (let action of slice.children) {
					modActions = modActions.concat(action.data);
					
					if (latestAction.id === undefined) {
						latestAction.id = action.data.id;
						latestAction.created_utc = moment(action.data.created_utc * 1000).utc();
					} else if (moment(action.data.created_utc * 1000).utc() >= latestAction.created_utc) {
						latestAction.id = action.data.id;
						latestAction.created_utc = moment(action.data.created_utc * 1000).utc();
					}
				}
				
				return modActions;
			})
			.then((modActions) => {
				resolve(modActions);
			});
	});
}
