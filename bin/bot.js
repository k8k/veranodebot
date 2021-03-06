
'use strict';

var VeraBot = require('../lib/verabot');

var token = process.env.BOT_API_KEY;
var dbPath = process.env.BOT_DB_PATH;
var name = process.env.BOT_NAME;

var verabot = new VeraBot({
    token: token,
    dbPath: dbPath,
    name: name
});

verabot.run();