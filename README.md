Modlog Backer-upper
===================

This is a very simple bot to monitor the mod log of one subreddit and back it up to another for archival purposes, which enables things like searching for posts and all that crap. 

Setup
-----

1. [Create an app on Reddit](https://www.reddit.com/prefs/apps/). Ensure it is set as type `script`. 
2. Clone this repository locally, cd into the repo directory, and run `npm install` to set up the required dependencies.
3. Duplicate or rename `config.json.sample` to `config.json` and copy the relevant information into the configuration file. Since this interfaces with the Reddit API as a script, you will need to supply both the username and password of the account it will be running under. In the future, this will likely be changed to only require a refresh token instead.
  * **Note**: `watchSub` and `logSub` should just be the subreddit names only, **not** /r/subreddit. 
4. Start the bot by running `node app.js`. 

Customization
-------------

If you want to configure the posts made on the log subreddit, you will have to edit two files, both within the `templates` directory.

* `actionName.hbs` is a [Handlebars](https://github.com/wycats/handlebars.js) file using [Markdown syntax](https://daringfireball.net/projects/markdown/syntax). Most of the variables used in the templates are straight from the response received from Reddit, though for simplicity I insert the `time` and `target_type` attributes (don't rely on `target_type` as I only handle it for comments and submissions. All of the other types are currently handled as submissions).
* `templates.json` contains a listing of all of the action types returnable by Reddit and how their title strings should be formatted. Once again, these are Handlebars strings using Markdown syntax. In the event that Reddit adds another type of event, a generic "unknown" object will be used with a raw dump of the unrecognized JSON data. 
