var Promise = require("bluebird");
var _ = require("underscore");
var request = require("request");
var querystring = require('querystring');
var token = "token " + process.env.GTOKEN;
var urlRoot = "https://github.ncsu.edu/api/v3";
var repoValue = "TriageBotTesting";
var ownerValue= "hqtu";


/**
 * @return collaborators of the current working git repo
 */
function getColloborators()
{
	var options = {
		url: urlRoot + '/repos/' + ownerValue + "/"+repoValue+"/collaborators",
		method: 'GET',
		headers: {
			"content-type": "application/json",
			"Authorization": token
		}
	};

	return new Promise(function (resolve, reject)
	{
		// Send a http request to url and specify a callback that will be called upon its return.
		request(options, function (error, response, body)
		{
			var repos = JSON.parse(body);
			resolve(repos);
		});
	});
}

/**
 * @return all the issues in current working git repos
 */
function getIssues()
{
	var options = {
		url: urlRoot + "/repos/" + ownerValue +"/" + repoValue + "/issues?state=all",
		method: 'GET',
		headers: {
			"content-type": "application/json",
			"Authorization": token
		}
	};

	return new Promise(function (resolve, reject)
	{
		// Send a http request to url and specify a callback that will be called upon its return.
		request(options, function (error, response, body)
		{
			var obj = JSON.parse(body);
			resolve(obj);
		});
	});
}

/**
 * @return closed issues in current working git repos
 */
function getClosedIssues()
{
	var options = {
		url: urlRoot + "/repos/" + ownerValue +"/" + repoValue + "/issues?state=closed",
		method: 'GET',
		headers: {
			"content-type": "application/json",
			"Authorization": token
		}
	};

	return new Promise(function (resolve, reject)
	{
		// Send a http request to url and specify a callback that will be called upon its return.
		request(options, function (error, response, body)
		{
			var obj = JSON.parse(body);
			resolve(obj);
		});
	});
}

/**
 * @desc assign an issue to an user on the current working github repo
 * @param issue that the user want to assign a developer with
 * @param assignee that the user want to assign the issue to
 */
function assignIssue(issue, assignee)
{

	var options = {
		url: urlRoot + "/repos/" + ownerValue +"/" + repoValue + "/issues/"+issue+"/assignees",
		method: 'POST',
		headers: {
			"content-type": "application/json",
			"Authorization": token
		},
		json: {
			"assignees" : [assignee]
		}
	};

	return new Promise(function (resolve, reject)
	{
		// Send a http request to url and specify a callback that will be called upon its return.
		request(options, function (error, response, body)
		{
			resolve(response);
		});
	});
}

/**
 * @param ID number of the issue
 * @return the details of the issue on the current working github repo
 */
function getAnIssue(number)
{
	var options = {
		url: urlRoot + "/repos/" + ownerValue +"/" + repoValue + "/issues/"+number,
		method: 'GET',
		headers: {
			"content-type": "application/json",
			"Authorization": token
		}
	};

	return new Promise(function (resolve, reject)
	{
		// Send a http request to url and specify a callback that will be called upon its return.
		request(options, function (error, response, body)
		{
			var obj = JSON.parse(body);
			resolve(obj);
		});
	});
}

exports.getColloborators = getColloborators;
exports.getClosedIssues = getClosedIssues;
exports.getIssues = getIssues;
exports.getAnIssue = getAnIssue;
exports.assignIssue = assignIssue;
