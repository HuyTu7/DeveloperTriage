### Use Cases

```
Use Case : Give the user/developer a list of open issues to work on.
1 Preconditions: 
  User must have Slack/Github API tokens on their system.
2 MainFlow:
  The user will request for list of open issues that they can work on. Bot will provide list of issues and user selects one of them. That issue is assigned to the user now.
3 Subflow:
  [S1] User will request for open issues to work.
  [S2] Bot will return list of issues. User selects one of them.
  [S3] Bot assigns that issue to the user.
4 Alternative Flow:
  [E1] No open issues available to work on.
```

```
Use Case: Give the user a requested person’s(id of the person) deadlines.
1 Preconditions:
  User must have Slack/Github API tokens on their system. The name of the person should exist in the repository as a collaborator. Issue should have a milestone attached and should be an open issue.
2 MainFlow:
  The user will ask for another user’s deadlines. A list of issues sorted with their deadlines will be showed to the user.
3 Subflow:
  [S1] Get a list of issues [S2] and then do [S3]
  [S2] Return a list of open issues assigned to the person whose name is supplied by the user.
  [S3] Sort a list of issues according to the “deadline” milestone.
4 Alternative Flow:
  [E1] No open issues assigned  to the person whose name is supplied by the user. In that case bot will simple reply the user has no open issues.
```

```
Use Case: Help the user with their issue(s)/task(s).
1 Preconditions:
  User must have Slack/Github API tokens on their system. It should be a valid open issue.
2 Main-Flow
  The user will ask for help with an issue assigned to them [S1]. They’ll receive a list of developers who have experience dealing with these types of issues.
3 Sub-Flow
  [S1] User will issue a help command with issue # to the bot.
  [S2] Bot will return a list of developers who have experience dealing with similar issues.
4 Alternative Flow
  [E1] The issue doesn't exists.
  [E2] No available developer with experience dealing with this issue. 
```
