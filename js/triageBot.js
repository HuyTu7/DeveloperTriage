var main = require("./main.js")
var Promise = require("bluebird");
var _ = require("underscore");
if (!process.env.BOT_TOKEN) {
  console.log('Error: Specify token in environment');
  process.exit(1);
}
var Botkit = require('botkit');
var os = require('os');

var controller = Botkit.slackbot({
  debug: false
});

var bot = controller.spawn({
  token: process.env.BOT_TOKEN
}).startRTM();

/**
 * Fulfilling Use Case 1
 * @param bot - our DeveloperTriage bot
 * @param message - command
 */
controller.hears(['give me issues'], 'direct_message, direct_mention, mention', function(bot, message) {
  controller.storage.users.get(message.user, function(err, user) {
    if (user && user.name && user.gitName) {
      main.getIssues(user.gitName, "open").then(function(openI) {
        if(openI.length == 0){
          var str = "No issues to work on for now!";
          bot.reply(message, str);
        } else {
            getICBU(message, user, openI);
          }
        }).catch(function (e){ // catch getIssues
          bot.reply(message, e);
        });
      } else {
        bot.startConversation(message, function(err, convo) {
          if (!err) {
            if(!user || !user.name)
            asking_name(err,convo,message);
            else{
              bot.reply(message, 'Hello ' + user.name );
              asking_git_hub_name(err,convo,message);
            }
            // store the results in a field called nickname
            convo.on('end', function(convo) {
              if (convo.status != 'completed') {
                bot.reply(message, 'OK, nevermind!');
              }
            });
          }
        });
      }
    });
  });

/**
 * UC1's different conversation patterns and flows
 * @param response - response of the user
 * @param convo - conversation between the user and the bot
 * @param name - the user that the user want to check the current deadlines for
 * @param message - command
 */
var getICBU = function(message, user, openIssues)
{
    main.getIssuesClosedByUser(user.gitName).then(function(result) {
      bot.startConversation(message, function(error, convo){
        main.sortAndCompareIssues(result, openIssues).then(function(matchingR) {
          var string;
          if(matchingR.length == 0){
            string = "No issues to work on for now!";
          } else {
            var titles = _.pluck(matchingR, "title");
            var urls = _.pluck(matchingR, "html_url");
            string = "*Here are some open issues:*\n";
            for(var i = 0; i < matchingR.length; i++){
              string += (i + 1) + ") "+ titles[i] + ": ";
              string += urls[i] + "\n\n";
            }
          }
          convo.ask(string + "Pick an item from the list!", [
            {
              pattern: "^[0-9]+$",
              callback: function(response, convo) {
                if(response.text > matchingR.length || response.text < 1 || isNaN(response.text)){
                  convo.say("Invalid issue number selected!");
                  convo.repeat();
                  convo.next();
                } else {
                  var issue = matchingR[response.text - 1].number;
                  main.assignIssueToUser(user, issue, user.gitName).then(function(resp){
                    convo.say(resp);
                    convo.next();
                  });
                }
              }
            },
            {
              pattern: "nevermind",
              callback: function(response, convo) {
                // stop the conversation. this will cause it to end with status == 'stopped'
                convo.say("Okay! No issue was selected!");
                console.log("okay");
                convo.next();
              }
            },
            {
              default: true,
              callback: function(response, convo) {
                convo.say("Invalid issue number selected!");
                convo.repeat();
                convo.next();
              }
            }]);
          }).catch(function (e){ // catch main.sortAndCompareIssues
            bot.reply(message, e);
          });
        }); // end bot.startConversation
      }); // end main.getIssuesClosedByUser
}

/**
 * Assign issue to user that doesn't have any work at that moment
 * @param response - response of the user
 * @param convo - conversation between the user and the bot
 * @param name - the user that the user want to check the current deadlines for
 * @param message - command
 */
var deadlineConversationAskingForIssueNumber = function(response, convo, results, name, message)
{
    convo.ask("What issue do you want to assign to "+name+" ?",function(response, convo) {
      main.assignIssueForDeadline(results,response.text,name).then(function(resp){
        bot.reply(message,resp);
        convo.next();
      }).catch(function (e){
        bot.reply(message,"Invalid response!");
        convo.repeat();
        convo.next();
      });
    });
  }

/**
 * Get deadlines that a specific user is assigned to
 * @param response - response of the user
 * @param convo - conversation between the user and the bot
 * @param name - the user that the user want to check the current deadlines for
 * @param message - command
 */
var deadlineConversationAskingForAssignment = function(response, convo, name, message)
{
    main.getOpenIssuesForDeadlines().then(function (results)
    {
      var result =[];
      for(i=0;i<results.length;i++){
        result.push(i+1+" ) "+results[i].title);
        result.push(results[i].html_url);
        result.push('\n');
      }
      convo.say("No Deadlines found for " + name);
      convo.ask("Do you want to assign them any of the open issues?", [
        {
          pattern: 'yes',
          callback: function(response, convo) {
            convo.say(result.join('\n'));
            deadlineConversationAskingForIssueNumber(response,convo, results,name,message);
            convo.next();
          }
        },
        {
          pattern: 'no',
          callback: function(response, convo) {
            // stop the conversation. this will cause it to end with status == 'stopped'
            convo.say("Okay! No issue was assigned to " + name);
            console.log("in deadlines");
            convo.next();
          }
        },
        {
          default: true,
          callback: function(response, convo) {
            convo.repeat();
            convo.next();
          }
        }
      ]);
    }).catch(function (e){
      //No Deadline found as well as no open issues
      bot.reply(message,"No Deadlines found!");
      convo.stop();
    });
}

controller.hears(['deadlines for (.*)', 'Deadlines for (.*)'], 'direct_message, direct_mention, mention', function(bot, message) {
    var name = message.match[1];
    controller.storage.users.get(message.user, function(err, user) {

      main.isValidUser(name).then(function (validUserName){
        main.getDeadlinesForUser(name).then(function (results)
        {
          bot.reply(message, results);
        }).catch(function (e){
          bot.startConversation(message, function(err,convo){
            deadlineConversationAskingForAssignment(err,convo,name,message);
          });
        });
      }).catch(function (e){
        bot.reply(message,"Sorry, " +name +" is not a valid user!");
      });
    });
  });


controller.hears(['closed issues by (.*)', 'Closed issues by (.*)'], 'direct_message,direct_mention,mention', function(bot, message) {
    var name = message.match[1];
    controller.storage.users.get(message.user, function(err, user) {
      main.getIssuesClosedByUser(name).then(function (results)
      {
        bot.reply(message, results);
      }).catch(function (e){
        bot.reply(message, e+name);
      });
    });
});

/**
 * Fulfilling Use Case 3
 * @param bot - our DeveloperTriage bot
 * @param message - command
 */
controller.hears(['Help me with issue #(.*)', 'help me with issue #(.*)'], 'direct_message,direct_mention,mention', function(bot, message)
{
    var number = message.match[1];
    controller.storage.users.get(message.user, function(err, user) {
      if (user && user.name && user.gitName) {
        main.getHelp(user.gitName, number).then(function (results)
        {
          bot.reply(message, results);
        }).catch(function (e){
          bot.reply(message, e);
        });
      } else {
        bot.startConversation(message, function(err, convo) {
          if (!err) {
            if(!user || !user.name)
            asking_name(err,convo,message);
            else{
              bot.reply(message, 'Hello ' + user.name );
              asking_git_hub_name(err,convo,message);
            }
            // store the results in a field called nickname
            convo.on('end', function(convo) {
              if (convo.status != 'completed') {
                bot.reply(message, 'OK, nevermind!');
              }
            });
          }
        });
      }
    });
});

/**
 * Initializing the bot and
 * set up username and git username for the current user
 * @param bot - our DeveloperTriage bot
 * @param message - command
 */
controller.hears(['Hello', 'hi'], 'direct_message,direct_mention,mention', function(bot, message) {

    controller.storage.users.get(message.user, function(err, user) {

      if (user && user.name && user.gitName) {
        bot.reply(message, 'Hello ' + user.name );
      } else {
        bot.startConversation(message, function(err, convo) {
          if (!err) {
            if(!user || !user.name)
            asking_name(err,convo,message);
            else{
              bot.reply(message, 'Hello ' + user.name );
              asking_git_hub_name(err,convo,message);
            }
            // store the results in a field called nickname
            convo.on('end', function(convo) {
              if (convo.status != 'completed') {
                bot.reply(message, 'OK, nevermind!');
              }
            });
          }
        });
      }
    });

});


/**
 * Helper method for initializing of the bot
 * set up username for the current user
 * @param bot - our DeveloperTriage bot
 * @param message - command
 */
var asking_name = function(response, convo, message) {
    convo.say('Hey there, I do not know your name yet!');
    convo.ask('What should I call you?', function(response, convo) {
      convo.ask('You want me to call you `' + response.text + '`?', [
        {
          pattern: 'yes',
          callback: function(response, convo) {
            // since no further messages are queued after this,
            // the conversation will end naturally with status == 'completed'
            controller.storage.users.get(message.user, function(err, user) {
              if (!user) {
                user = {
                  id: message.user,
                  gitName : '',
                };
              }
              user.name = convo.extractResponse('nickname');
              controller.storage.users.save(user, function(err, id) {
                bot.reply(message, 'Got it. I will call you ' + user.name + ' from now on.');
              });
            });
            asking_git_hub_name(response,convo, message);
            convo.next();
          }
        },
        {
          pattern: 'no',
          callback: function(response, convo) {
            // stop the conversation. this will cause it to end with status == 'stopped'
            convo.stop();
          }
        },
        {
          default: true,
          callback: function(response, convo) {
            convo.repeat();
            convo.next();
          }
        }
      ]);
      convo.next();
    }, {'key': 'nickname'});
};

/**
 * Helper method for initializing of the bot
 * set up git username for the current user
 * @param bot - our DeveloperTriage bot
 * @param message - command
 */
var asking_git_hub_name = function(response, convo, message) {

  convo.ask('What is your github username?', function(response, convo) {
      main.isValidUser(response.text).then(function (validUserName){
        convo.ask('Your github user name is `' + response.text + '`? Please confirm', [
          {
            pattern: 'yes',
            callback: function(response, convo) {
              // since no further messages are queued after this,
              // the conversation will end naturally with status == 'completed'
              controller.storage.users.get(message.user, function(err, user) {
                user.gitName = convo.extractResponse('git_nickname');
                controller.storage.users.save(user, function(err, id) {
                  bot.reply(message, 'Got it! updating you github user name as ' + user.gitName + ' from now on. You can now issue commands!');
                });
              });
              convo.next();
            }
          },
          {
            pattern: 'no',
            callback: function(response, convo) {
              // stop the conversation. this will cause it to end with status == 'stopped'
              convo.stop();
            }
          },
          {
            default: true,
            callback: function(response, convo) {
              convo.repeat();
              convo.next();
            }
          }
        ]);
    convo.next();
      }).catch(function (e){
        bot.reply(message,"Sorry, " +e +" is not a valid user!");
        convo.repeat();
        convo.next();
      });
    
    }, {'key': 'git_nickname'});
};


/**
 * Responses to invalid commands
 * @param bot - our DeveloperTriage bot
 * @param message - command
 */
controller.hears(['.*'], 'direct_message, direct_mention, mention', function(bot, message) {
    controller.storage.users.get(message.user, function(err, user) {
      if (user && user.name) {
        bot.reply(message,"Sorry couldn't understand it "+ user.name );
      }else{
        bot.reply(message,"Sorry couldn't understand it ");
      }
      bot.reply(message,"Below are is the list of commands you can use:");
      bot.reply(message,"1. Deadlines for <git_user_name>");
      bot.reply(message,"2. Help me with issue #<github issue number>");
      bot.reply(message,"3. Give me issues");
    });
});
