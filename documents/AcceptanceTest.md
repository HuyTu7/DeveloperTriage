#Acceptance Test

##Version Information
| version | Date | Author 
|---------|------|--------
| 1.0 | November 2016 | TriageBot Team 

##Testing

###Link to Slack team

You'll find the slack team [here](https://teamdevelopertriage.slack.com/messages/general/). The username is: `testinguser` and the password is: `ncsu123`.

Once you login, you can either mention `triage_bot` in the general channel or start a direct messaging with it.

###Initiate a conversation

For a first time user, the bot won't be able to recognize you unless you initiate a conversation with it. Do the following:

  * type `Hi` or `Hello`
  * Wait for the bot to respond and then tell it your nickname (The bot will use that to refer to you)
  * Confirm your nickname by saying yes, then answer the bot's question by telling it a valid github username. (one of the collaborators to the repo)
  * Confirm your github username by saying `yes`.

###UseCase 1

 * Ask the bot to give you a list of issue by saying `give me issues`
 * After getting a list of issues, choose which one you want to work on, by writing the list item number (this is not the github issue number, but the number of the issue in the list shown). For example `2`
 * The bot should tell you that this issue (with the github issue number) is now assigned to you. You can check the github [repo](https://github.ncsu.edu/hqtu/TriageBotTesting) to make sure this worked.
 * To exit the conversation, you can say `nevermind`
 
###UseCase 2

 * Ask the bot to give you deadlines for a user in the team by saying `deadlines for username`.
 * if the username you specified is a part of the team, the bot will either return the list of issues assigned to them with their deadline, or will tell you that this user doesn't have any deadlines if they don't have issues assigned to them
 * If the user does not have any deadlines, you can assign issues to the developer.

###UseCase 3

 * Ask the bot for help with one of the issues assigned to you. You can do that by saying `Help me with issue #number`. This number should be the github issue number, not the number in the list shown in usecase 1.
 * The bot should reply with some names of developers (github names) that might be able to help with the issue.
 * If no developer is available to help, or the issue you asked for help with is not assigned to you, the bot will respond accordingly.
 
##Invalid commands
 * if you type in an invalid command, the bot will tell you that it couldn't understand the command, and will instruct you to type one of the commands its familiar with.
 * When the bot expects a certain command, you need to provide it. For example: after telling it to give you issues, you must provide a number from the list. 
