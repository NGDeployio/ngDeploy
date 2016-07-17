# ngDeploy CLI 
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)
[![TravisCI Status](https://travis-ci.org/NGDeployio/ngDeploy.svg)](https://travis-ci.org/NGDeployio)
[![bitHound Overall Score](https://www.bithound.io/github/NGDeployio/ngDeploy/badges/score.svg)](https://www.bithound.io/github/NGDeployio/ngDeploy)
[![https://david-dm.org/ngdeployio/ngdeploy](https://david-dm.org/ngdeployio/ngdeploy.svg)](https://david-dm.org/ngdeployio/ngdeploy)

> Angular and single page application hosting CLI tool.

Install this globally and you'll have access to the `ngdeploy` command anywhere on your system.

```shell
[sudo] npm install -g ngdeploy
```

**Note:** The job of the ngDeploy CLI is to publish single page applications. It's preferred to install globally, but local installations will work too. [please read this](http://nodejs.org/en/blog/npm/npm-1-0-global-vs-local-installation).


## Usage

```shell
$ ngdeploy --help
1.    $ ngdeploy login
2.    $ ngdeploy create <appName>
3.    $ ngdeploy init <appName> <distDir>
4.    $ ngdeploy push
Example: 
1.    $ ngdeploy login
2.    $ ngdeploy create helloApp
3.    $ ngdeploy init helloApp ./dist
4.    $ ngdeploy push
```

## First steps

### 1. Login
[Register or log into ngDeploy.](https://ngdeploy.com/#!/?redirectTo=private.accounts) Which will create an ngDeploy account and initiate the hosting process. 
To authenticate the terminal copy and paste the account token from the profile page. 

**Format**

> ngdeploy login

**Example**

```shell
$ ngdeploy login 
$ prompt: Open this link in a browser to register: https://ngdeploy.com/#!/?redirectTo=private.accounts
$ prompt: Account Token to use:  **************
```

### 2. Create
Creating your first application is as easy as:

**Format**  

> ngdeploy create \<Application Name> 

**Example**  

```shell
$ ngdeploy create HelloWorld
```

> Please note application names must be publicly unique.

### 3. Initialize
Now we can initialize the **.ngdeploy** configuration file using **init**. **.ngdeploy** also holds the Account Token
, Distribution directory, Application name, and in the future additional configuration information.

**Format**

> ngdeploy init \<Application Name> \<Distribution directory>

**Example**

```shell
ngdeploy init HelloWorld .  
```

### 4. Push
Push synchronizes the **Distribution directory** with our cloud. It'll compare the MD5 hash of 
the files with what's currently stored in the cloud and only upload files that have changed.

**Format**

> ngdeploy push

**Example**  

```shell
ngdeploy push
```

## Commands

**The command `ngdeploy --help` lists the available commands and `ngdeploy <command> --help` displays additional information about a command.**

For project-specific commands, you must either be inside a project directory with an
active `.ngdeploy` file.

Below is a brief list of the available commands and their function:

### Administrative Commands

Command | Description
------- | -----------
**login** | Authenticate the terminal with ngDeploy
**logout** | Destroy the authentication information
**list** | Print a list of all of your ngDeploy apps.
**help** | Display help information about the CLI or specific commands.

### Custom Domain
<!--Additional documentation can be found at http://ngdeploy.com/docs/custom-domains.-->

**Format**

> $ ngdeploy domain add --domain \<domain> --appId \<appId> --appName \<appName>   
> $ ngdeploy domain remove --domain \<domain> --appId \<appId> --appName \<appName>  

**Example**

```shell
$ ngdeploy domain add --domain ngdeploy.com --appId 10
$ ngdeploy domain add --domain ngdeploy.com --appName ngdeploy
```

### SSL for HTTPS
<!--Additional documentation can be found at http://ngdeploy.com/docs/https-support.-->

**Format**

> $ ngdeploy ssl add -k \<path to key>  
> $ ngdeploy ssl remove -k \<path to key>    

**Example**

```shell
$ ngdeploy ssl add -k .private_key.ssl
$ ngdeploy ssl remove -k .private_key.ssl  
```


### Environment
<!--Additional documentation can be found at http://ngdeploy.com/docs/environment.-->

Environmental variables can be injected into a SPA using the setEnv command. Upon a 
user request this embeds a javascript file with the given environmental variables. 

**Format** 
> ngdeploy setEnv \<Application Id> \<Stage> \<key:val>

**Example**
```shell
ngdeploy setEnv 1 production key:val
```


