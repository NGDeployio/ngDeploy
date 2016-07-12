# NGDeploy CLI [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com) [![TravisCI Status](https://travis-ci.org/NGDeployio/ngDeploy.svg)](https://travis-ci.org/NGDeployio) [![bitHound Overall Score](https://www.bithound.io/github/NGDeployio/ngDeploy/badges/score.svg)](https://www.bithound.io/github/NGDeployio/ngDeploy) [![https://david-dm.org/ngdeployio/ngdeploy](https://david-dm.org/ngdeployio/ngdeploy.svg)](https://david-dm.org/ngdeployio/ngdeploy)

> Angular and single page application hosting CLI tool.

Install this globally and you'll have access to the `ngdeploy` command anywhere on your system.

```shell
[sudo] npm install -g ngdeploy
```
**Note:** The job of the NGDeploy CLI is to push and build single page applications. It's preferred to install globally, but local installations will work too. [please read this](http://nodejs.org/en/blog/npm/npm-1-0-global-vs-local-installation).


## Usage
```shell
$ ngdeploy --help
1.    $ ngdeploy set -g -a <AccountToken>
2.    $ ngdeploy create <appName>
3.    $ ngdeploy init <appName> <distDir>
4.    $ ngdeploy push
Example: 
1.    $ ngdeploy set -g -a 123456789
2.    $ ngdeploy create helloApp
3.    $ ngdeploy init helloApp ./dist
4.    $ ngdeploy push
```
## First steps

### 1. Install NGDeploy

**Example**
```shell
npm install -g ngdeploy 
```

### 2. Login
[Generate an account token here.](https://ngdeploy.com/#!/?redirectTo=private.accounts) We'll set the account token globally using the following command.
**Format**
> ngdeploy login

**Example**
```shell
ngdeploy login 
$ prompt: Open this link in a browser to register: https://ngdeploy.com/#!/?redirectTo=private.accounts
$ prompt: Account Token to use, by default global ~/.ngdeploy:  **************
```

### 3. Create
Creating your first application is as easy as:

**Format**  
> ngdeploy create \<Application Name> 

**Example**  
```shell
ngdeploy create HelloWorld
```
> Please note application names must be unique.

### 4. Initialize
Now we can initialize the .ngdeploy configuration file using:
**Format**
> ngdeploy init \<Application Name> \<Distribution directory>

**Example**
```shell
ngdeploy init HelloWorld .  
```

### 5. Push
> ngdeploy push

**Example**  
```shell
ngdeploy push
```

### Environment
Environmental variables can be injected into a SPA using the setEnv command. Upon a 
user request this embeds a javascript file with the given environmental variables. 

**Format** 
> ngdeploy setEnv \<Application Id> \<Stage> \<key:val>

**Example**
```shell
ngdeploy setEnv 1 production key:val
```
