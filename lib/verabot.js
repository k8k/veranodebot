'use strict';

var util = require('util');
var path = require('path');
var fs = require('fs');
var SQLite = require('sqlite3');
var Bot = require('slackbots');

var VeraBot = function Constructor(settings) {
  this.settings = settings;
  this.settings.name = this.settings.name || 'verabot';
  this.dbPath = settings.dbPath || path.resolve(process.cwd(), 'data', 'verabot.db';

  this.user = null
  this.db = null

};

util.inherits(VeraBot, Bot);

module.exports = VeraBot;

VeraBot.prototype.run = function () {
  VeraBot.super_.call(this, this.settings);

  this.on('start', this._onStart);
  this.on('message', this._onMessage);
}

VeraBot.prototype._onStart = function() {
  this._loadBotUser();
  this._connectDb();
  this._firstRunCheck();
};

VeraBot.prototype._loadBotUser = function() {
  var self = this;
  this.user = this.users.filter(function (user) {
    return user.name === self.name;
  })[0];
};

VeraBot.prototype._connectDb = function () {
  if (!fs.existsSync(this.dbPath)) {
    console.error('Database path ' + '"' + this.dbPath + '" jacked up.');
    process.exit(1)
  }

  this.db = new SQLite.Database(this.dbPath)
}

VeraBot.prototype._firstRunCheck = function() {
  var self = this;
  self.db.get('SELECT val FROM info WHERE name = "last run" LIMIT 1', function (err, record) {
    if (err) {
      return console.error('db error:', err);
    }

    var currentTime = (new Date()).toJSON();

    // check if this is the first time vera bot is being introduced
    if (!record) {
      self._welcomeMessage();
      return self.db.run('INSERT INTO info(name, val) VALUES("lastrun", ?)', currentTime);
    }

    self.db.run('UPTATE info SET val = ? WHERE name = "last run');
  });
};

VeraBot.prototype._welcomeMessage = function () {
  this.postMessageToChannel(this.channels[0].name, 'You guyssssss' +
    '\n To hear my wisdom just say "tech in China" or ' + '"Verabot."',
    {as_user: true});
};

VeraBot.prototype._onMessage = function (message) {
  if (this._isChatMessage(message) &&
    this._isChannelConversation(message) &&
    !this._isFromVeraBot(message) &&
    this._isMentioningVeraBot(message)
  ) {
    this._replyWithVeraThought(message);
  }
};

// check if incoming info is actually a slack message
VeraBot.prototype._isChatMessage = function (message) {
  return message.type === 'message' && Boolean(message.text);
};

// check if message is in a channel
VeraBot.prototype._isChannelConversation = function (message) {
  return typeof message.channel === 'string' &&
    message.channel[0] === 'C';
};

// make sure verabot isnt the one messaging so we dont get a tech in china loop
VeraBot.prototype._isFromVeraBot = function (message) {
  return message.user === this.user.id;
};

// check for verabot or tech in china mention
VeraBot.prototype._isMentioningVeraBot = function (message) {
    return message.text.toLowerCase().indexOf('tech in china') > -1 ||
        message.text.toLowerCase().indexOf(this.name) > -1;
};


VeraBot.prototype._replyWithVeraThought = function (originalMessage) {
  var self = this;
  self.db.get('SELECT id, joke FROM jokes ORDER BY used ASC, RANDOM() LIMIT 1', function (err, record) {
    if (err) {
      return console.error('DATABASE ERROR:', err);
    }

    var channel = self._getChannelById(originalMessage.channel);
    self.postMessageToChannel(channel.name, record.joke, {as_user: true});
    self.db.run('UPDATE jokes SET used = used + 1 WHERE id = ?', record.id);
    });
};

VeraBot.prototype._getChannelById = function (channelId) {
  return this.channels.filter(function (item) {
    return item.id === channelId;
  })[0];
};

