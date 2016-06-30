# NGDeploy CLI [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com) [![TravisCI Status](https://travis-ci.org/NGDeployio/ngDeploy.svg)](https://travis-ci.org/NGDeployio) [![bitHound Overall Score](https://www.bithound.io/github/NGDeployio/ngDeploy/badges/score.svg)](https://www.bithound.io/github/NGDeployio/ngDeploy)

> Angular and Single page application hosting CLI tool.

Install this globally and you'll have access to the `ngdeploy` command anywhere on your system.

```shell
[sudo] npm install -g ngdeploy
```
**Note:** The job of the NGDeploy CLI is to upload and build single page applications. It's preferred to install globally, but local installations will work too. [please read this](http://nodejs.org/en/blog/npm/npm-1-0-global-vs-local-installation).

## Usage
```shell
$ ngdeploy --help
1.    $ ngdeploy set -g -a <AccountToken>
2.    $ ngdeploy create appName
3.    $ ngdeploy init <appName> <distDir>
4.    $ ngdeploy push
Example: 
1.    $ ngdeploy set -g -a 123456789
2.    $ ngdeploy create helloApp
3.    $ ngdeploy init helloApp ./dist
4.    $ ngdeploy push
``