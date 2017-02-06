var Promise = require("bluebird");
var chai = require("chai");
var expect = chai.expect;
var nock = require("nock");
var _ = require("underscore");
var stringSimilarity = require('string-similarity');
var github = require("./github.js");

var MAX_LABEL = 4;
var LABEL_WEIGHT = 0.15;
var TITLE_WEIGHT = 0.2;
var DESC_WEIGHT = 0.2;

/**
 * @desc Check if the username is valid
 * @param user - user name
 */
function isValidUser(user){
	return new Promise(function (resolve, reject)
	{
		github.getColloborators().then(function (userList){
			for (var i = 0; i < userList.length; i++){
				if(userList[i].login == user){
					resolve(user);
				}
			}
			reject(user);
		});
	});
}

/**
 * @desc return open/closed issues in a user's repo
 * @param user - user name
 */
function getIssues(gituser, state)
{
	return new Promise(function (resolve, reject)
	{
		github.getIssues().then(function (issues)
		{
			var states;
			if(state == "open"){
				states = _.where(issues, { state: "open"});
				//Filter out the issues which are assigned to the user we are looking for
				var issuesForAssignee = _.filter(states, function(issueVar){
					var assigneesArray = issueVar.assignees;
					for (i = 0; i < assigneesArray.length; i++){
						if(assigneesArray[i].login == gituser){
							return false;
						}
					}
					return true;
				});
				resolve(issuesForAssignee);
			} else {
				states = _.where(issues, { state: "closed"});
				resolve(states);
			}
		});
	});
}

/**
 * @desc Passing to github.js to assign issue number
 * to specific user/developer
 * @param results - the list of issues
 * @param issueNUm - the number of the issue to assign
 * @param assigneeName - the user/developer to assign the issue to
 */
function assignIssueForDeadline(results, issueNum, assigneeName)
{
	return new Promise(function(resolve, reject){
		var issue;
		if(issueNum>results.length || issueNum<1 || isNaN(issueNum)){
			reject("Invalid issue number selected");
		}else{
			issue = results[issueNum-1].number;
		}
		github.assignIssue(issue, assigneeName).then(function(response){
			var string = "Assigned Issue #"+issueNum+" To "+ assigneeName+"\nTitle: "+ results[issueNum-1].title;
			resolve(string);
		});
	});
}

/**
 * @desc Assigning issue number to specific user/developer
 * @param issuesA - is either the issue that needs help OR
 * issuesA is a list of closed issues by developer who wants open issues and
 * @param issuesB is the list of open or closed issues to compare against which will
 * be sorted according by comparing each issue on issueA for highest score
 * @return top 5 of sorted issuesB will then be returned from highest match to lowest
 */
function sortAndCompareIssues(issuesA, issuesB)
{
	return new Promise(function(resolve, reject){
		var issuesRtn = [];
		var issueScore = [];

		var issuesATitles = _.pluck(issuesA, 'title');
		var issuesBTitles = _.pluck(issuesB, 'title');

		if(_.difference(issuesBTitles, issuesATitles) == 0){
			resolve(issuesB);
		} else {
			for(var i = 0; i < issuesB.length; i++)
			{
				var issuesBLabels = _.pluck(issuesB[i].labels, 'name');
				var maxScore = 0;
				for(var j = 0; j < issuesA.length; j++)
				{
					var score = 0;
					var issuesALabels = _.pluck(issuesA[j].labels, 'name');
					var labelsDiff = _.difference(issuesALabels, issuesBLabels);
					// If all labels match or if both issues don't have labels, add to score
					if(labelsDiff.length == 0 || (issuesALabels.length == 0 && issuesBLabels.length == 0)){
						if(issuesALabels.length <= MAX_LABEL)
						{
							score += (issuesALabels.length)*LABEL_WEIGHT;
						}
					} else {
						if(labelsDiff.length <= MAX_LABEL)
						{
							score += (issuesALabels.length-labelsDiff.length)*LABEL_WEIGHT;
						}
					}
					var titleScore = stringSimilarity.compareTwoStrings(issuesB[i].title, issuesA[j].title);
					score += titleScore*TITLE_WEIGHT;
					var descScore;
					if(issuesA[j].body.length != 0 && issuesB[i].body.length != 0){
						descScore = stringSimilarity.compareTwoStrings(issuesB[i].body, issuesA[j].body);
						score += descScore*DESC_WEIGHT;
					}
					if(maxScore < score)
					{
						maxScore = score;
					}
				}
				issueScore.push(maxScore);
			}
			// Sort the issuesB and return
			var maxArray = []; // used to exclude the previous max for _.max below
			while(maxArray.length < issueScore.length)
			{
				var max = _.max(issueScore, function(num)
				{
					// only return num if it's a new max
					if(maxArray.indexOf(num) == -1) {
						return num;
					}
				});
				maxArray.push(max);
				// add the title of the issue that has the next max score
				issuesRtn.push(issuesB[issueScore.indexOf(max)]);
			}

			if(issuesRtn.length >= 5){
				resolve(issuesRtn.splice(0, 5));
			} else {
				resolve(issuesRtn);
			}
		}
	});
}


/**
 * @desc Assignes a user to an issue
 * to specific user/developer
 * @param currentUser - the current user talking to the bot
 * @param issue - the issue you want to assign to the user
 * @param assigneeName - the user/developer to assign the issue to
 */
function assignIssueToUser(currentUser, issue, assigneeName)
{
	return new Promise(function(resolve, reject){
		github.assignIssue(issue, assigneeName).then(function(response){
			var string = "Assigned issue #"+issue+" to "+ (assigneeName == currentUser.gitName ? "you" : assigneeName);
			resolve(string);
		});
	});
}

/**
 * @desc make the call to github.js to
 * get the list of open issues
 * @return the list of open issues
 */
function getOpenIssuesForDeadlines()
{
	return new Promise(function (resolve, reject)
	{
		// mock data needs list of issues.
		github.getIssues().then(function (issues)
		{
			var resSet=[];
			var openIssues =  _.reject(issues,function(issueVar){
				if(issueVar.state!='open')
				{
					return true;
				}else
				return false;
			});
			if(!openIssues.length){
				reject("No Open Issues found");
			}
			resolve(openIssues);
		});
	});
}

/**
 * @param assigneeName - the user/developer git username
 * @return the list of deadlines for a specific user/developer
 */
function getDeadlinesForUser(assigneeName)
{
	return new Promise(function (resolve, reject)
	{
		// Fetching all the issues from github using rest api.
		github.getIssues().then(function (issues)
		{
			var resSet=[];
			//removing issues which are not open OR dont have a milestone OR does not have a assignee
			var issuesWithAssignee =  _.reject(issues,function(issueVar){
				if(issueVar.assignee == null || issueVar.state!='open' || issueVar.milestone == null)
				{
					return true;
				}else
				return false;
			});

			//Filter out the issues which are assigned to the user we are looking for
			var issuesForAssignee = _.filter(issuesWithAssignee,function(issueVar){
				var assigneesArray =issueVar.assignees;
				for (i = 0; i < assigneesArray.length; i++){
					if(assigneesArray[i].login == assigneeName){
						return true;
					}
				}
				return false;
			});

			//If not even a single element in our results - > reject the promise
			if(!issuesForAssignee.length){
				reject("No deadlines found for ");
			}
			var states;

			var result =[];
			for(i=0;i<issuesForAssignee.length;i++){
				result.push(i+1+") "+issuesForAssignee[i].title);
				result.push(issuesForAssignee[i].html_url);
				result.push('Deadline- '+ new Date(issuesForAssignee[i].milestone.due_on));
				result.push('\n');
			}
			resolve(result.join('\n'));
		});
	});
}

/**
 * @desc return the list of closed issues that assigned to a specific user
 * @param userName - the user/developer git username
 * @return the list of deadlines for a specific user/developer
 */
function getIssuesClosedByUser(userName)
{
	return new Promise(function (resolve, reject)
	{
		github.getClosedIssues().then(function (issues)
		{
			var issuesWithAssignee =  _.reject(issues,function(issueVar){
				if(issueVar.assignee == null || issueVar.state != 'closed')
				{
					return true;
				} else {
					return false;
				}
			});
			var issuesForAssignee = _.filter(issuesWithAssignee,function(issueVar){
				var assigneesArray = issueVar.assignees;
				for (i = 0; i < assigneesArray.length; i++){
					if(assigneesArray[i].login == userName){
						return true;
					}
				}
				return false;
			});
			if(!issuesForAssignee.length){
				reject("No closed issues found for " + userName);
			}
			resolve(issuesForAssignee);
		});
	});
}


/**
 * @desc Use this to get gitnames of developers that could help you with a particular issue
 * @param number - the number of the issue to get help for in UC3
 * @return the list of users/developers that have experiences with resolving the similar issue
 */
function getHelp(name, number)
{
	return new Promise(function (resolve, reject)
	{
		github.getAnIssue(number).then(function (issue)
		{
			if(issue.state === undefined)
			{
				reject("No one can help you with something that does not exists");
				return
			}
			if(issue.state === 'closed')
			{
				reject("Hey buddy, you don't need any help, this issue is already closed");
				return
			}
			getIssues('closed').then(function(issues){
				myissue = []
				myissue.push(issue)
				sortAndCompareIssues(myissue, issues).then(function(matchingIssues){
					var result =[];
					myissuedl = [];
					if(!matchingIssues.length){
						reject("Sorry, couldn't find anyone to help you");
					}
					else{
						for(i=0;i < issue.assignees.length;i++){
							myissuedl.push(issue.assignees[i].login);
						}
						for(i = 0;i < matchingIssues.length;i++)
						{
							for(j = 0;j < matchingIssues[i].assignees.length;j++)
							{
								if(result.indexOf(matchingIssues[i].assignees[j].login) == -1){
									result.push(matchingIssues[i].assignees[j].login)
								}
							}
						}
						result = _.difference(result, myissuedl);
						result = _.without(result, name);
						if(!result.length){
							reject("Sorry, couldn't find anyone to help you");
						}
						resolve("I think " + result.join(', ') + " could help you");
					}
				});
			});
		});
	});
}

exports.isValidUser = isValidUser;
exports.assignIssueForDeadline = assignIssueForDeadline;
exports.getOpenIssuesForDeadlines = getOpenIssuesForDeadlines;
exports.getDeadlinesForUser = getDeadlinesForUser;
exports.getIssuesClosedByUser = getIssuesClosedByUser;
exports.assignIssueToUser = assignIssueToUser;
exports.getIssues = getIssues;
exports.getHelp=getHelp;
exports.sortAndCompareIssues = sortAndCompareIssues;
