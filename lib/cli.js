'use strict';

var request = require('request');
var fs = require('fs');
var path = require('path');
var s3 = require('s3');
var log = require('single-line-log').stdout;
var pkg = require('../package');
var prompt = require('prompt');
var _ = require('underscore');
var _open = require('open');

var system = {
    id: '',
    name: '',
    accountToken: '',
    ngDeployUrl: '',
    version: pkg.version,
    dist: './dist',
    path: process.cwd(),
    endpoint: 'https://api.ngdeploy.com', };

const chalk = require('chalk');

function getUrl(stage) {
  return chalk.cyan('https://' + stage + '-' + system.ngDeployUrl + '.ngdeploy.com/');
}

function getUserHome() {
  return process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'];
}

function configPath(global) {
  var filename = '.ngdeploy';
  if (global) {
    return getUserHome() + '/' + filename;
  }

  return filename;
}

function findToken() {
  var globalConfig = configPath(1);
  var pkgConfig = configPath(0);
  var sys = {};

  try {
    sys = JSON.parse(fs.readFileSync(pkgConfig));
    if (fs.existsSync(pkgConfig) && sys.accountToken) {
      return sys.accountToken;
    }
  }catch (err) {
  }

  try {
    sys = JSON.parse(fs.readFileSync(globalConfig));
    if (fs.existsSync(globalConfig) &&  sys.accountToken) {
      return sys.accountToken;
    }
  }catch (err) {
    //console.log('Failed to load global config: ', err);
  }

  return '';
}

var authedRequest = request.defaults(
    { json: true,
        headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + findToken(),
          },
      });

function name(updateName) {
  if (updateName) {
    system.name = updateName;
  }

  return system.name;
}

function dist(updateDist) {
  if (updateDist) {
    system.dist = updateDist;
  }

  return system.dist;
}

function header() {
  console.log(' ngdeploy: ' + pkg.description + ' (v' + pkg.version + ')');
}

function helpHeader() {
  header();
  console.log(' ngdeploy --help for help menu');
  console.log('');
}

function helpFooter() {
  console.log('For documentation visit http://ngdeploy.com');
  console.log('');
}

function fatal(msg, code) {
  helpHeader();
  console.log(chalk.red('Fatal error: ' + msg));
  console.log('');
  helpFooter();
  process.exit(code);
}

function clean(opts) {
  opts = opts || {};
  var files = [];
  if(opts.local){
    files.push('./.ngdeploy');
  }
  if(opts.global){
      files.push(getUserHome()+"/.ngdeploy");
  }

  if(! (opts.global || opts.local)){
      files.push('./.ngdeploy');
  }

  header();
  console.log('Removing files... ');

  var removedAll = true;

  files.forEach(function (file) {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
        console.log('Remove: ', chalk.yellow(file), chalk.green(' success'));
      }else {
        console.log('Remove: ', chalk.yellow(file), chalk.red(' fail'));
        removedAll = false;
      }
    });

  if (removedAll) {
    console.log('Removed all files successfully.');
  }else {
    console.log('Failed to remove some files.');
  }

  return removedAll;
}

function createConfiguration(app) {
  system.id = app.id;
  system.name = app.name;
  system.dist = app.dist;
  system.ngDeployUrl = app.ngDeployUrl;

  if (system.id == null || system.name == null || system.ngDeployUrl == null) {
    var error = 'Cannot create configuration file. One of these values is null.';
    error = error + '\n Id: $ID Name: $NAME ngDeployUrl: $NG';

    error = error.replace('$ID', system.id)
        .replace('$NAME', system.name)
        .replace('$NG', system.ngDeployUrl);
    return fatal(error, 1);
  }

  try {
    fs.writeFileSync('.ngdeploy', JSON.stringify(system, null, 4));
    return true;
  }catch (e) {
    return false;
  }
}

function readngdeploy() {
  var globalConfig = configPath(1);
  var pkgConfig = configPath(0);
  var _global = {};

  if (fs.existsSync(globalConfig)) {
    try {
      var sys = JSON.parse(fs.readFileSync(globalConfig));
      _global.accountToken = sys.accountToken;
    }catch (err) {
      //console.log('Failed to load global config: ', err);
    }
  }

  if (fs.existsSync(pkgConfig)) {
    try {
      system = JSON.parse(fs.readFileSync(pkgConfig));
      system.endpoint = 'https://api.ngdeploy.com';
    }catch (err) {
      //fatal('Cannot read ' + pkgConfig + ' file. Probably not formatted correctly.', 1);
      return false;
    }

    return true;
  }

  if (system.accountToken == null || system.accountToken === '') {
    system.accountToken = _global.accountToken;
  }

  return false;
}

var schema = {
    properties: {
        appName: {
            description: 'Application Name',
          },
        distDir: {
            description: 'Distribution directory',
          },
        accountToken: {
            description: 'Account Token to use, by default global ~/.ngdeploy',
          },
      },
  };

function init(appName, dist, opts) {
  if (opts && opts.accountToken) {
    system.accountToken = opts.accountToken;
  } else {
    system.accountToken = findToken();
  }

  if (appName === undefined || appName.length < 3) {
    return;
  }

  appName = appName.replace(/[`~!@#$%^&*()_|+\-=?;:'",<>\{\}\[\]\\\/]/gi, '')
            .split(' ').join('_').toLowerCase();

  if (!system.accountToken) {
    return fatal('An account token was not found.');
  }

  system.name = appName;
  system.ngDeployUrl = appName;

  if (dist) {
    system.dist = dist;
  }else {
    system.dist = './';
  }

  authedRequest
      .get({
          url: system.endpoint + '/apps',
        }, function (err, response, body) {

          if (err) {
            console.log('There was a connectivity problem. ');
            return fatal(err, 1);
          }

          if (body.error !== undefined) {
            return fatal(body.error, 1);
          }

          var app = _.find(body, function (something) {
              return something.apps.ngDeployUrl === system.ngDeployUrl;
            });

          if (app == null || app === {}) {
            return fatal('appName not found. Create the app first', 1);
          }

          createConfiguration(app.apps);
        });
}

function initWithPrompt() {
  prompt.start();
  prompt.get(schema, function (err, result) {
      if (err) {
        return fatal(err, 1);
      }

      init(result.appName, result.distDir, result.accountToken);
    });
}

function update(k, v) {
  system[k] = v;
  createConfiguration(system);
}

function push() {
  var root = process.cwd();
  var check = path.join(root, '.ngdeploy');
  var data;

  readngdeploy();

  if (!fs.existsSync(check)) {
    var error = 'No .ngdeploy file found.' + require('os').EOL;
    error += 'Initiate the app with' + require('os').EOL;
    error += chalk.bold('ngdeploy init <appname> <distribution folder>');
    fatal(error, 1);
  }

  var next = function () {
      if (root === path.sep) {
        return {
            value: undefined,
            done: true,
          };
      }

      var file = path.join(root, '.ngdeploy');

      root = path.resolve(root, '..');

      if (fs.existsSync(file) && (data = fs.readFileSync(file))) {
        data.__path = file;

        return {
            value: data,
            done: false,
          };
      }

      return next();
    };

  var results = next();
  var config = JSON.parse(results.value.toString());

  var url = config.endpoint + '/policy?name=' + config.name;
  console.log(url);
  authedRequest.get({
              url: url,
            }, function (error, response, body) {

    if (error) {
      console.log(error);
    }

    var data = body.data;

    var s3Options = {
              accessKeyId: data.Credentials.AccessKeyId,
              secretAccessKey: data.Credentials.SecretAccessKey,
              sessionToken: data.Credentials.SessionToken,
              region: 'us-west-2',
              // any other options are passed to new AWS.S3()
              // See: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Config.html#constructor-property
            };

    var client = s3.createClient({
        maxAsyncS3: 20, // this is the default
        s3RetryCount: 3, // this is the default
        s3RetryDelay: 1000, // this is the default
        multipartUploadThreshold: 20971520, // this is the default (20 MB)
        multipartUploadSize: 15728640, // this is the default (15 MB)
        s3Options: s3Options,
      });

    var p = path.join(config.path, config.dist);
    var name =  config.name;
    var params = {
        localDir: p,
        deleteRemoved: true, // default false, whether to remove s3 objects
        // that have no corresponding local file.

        s3Params: {
            Bucket: 'ngdeploy',
            Prefix: 'development/' + name,

            // other options supported by putObject, except Body and ContentLength.
            // See: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#putObject-property

          },
      };
    var uploader = client.uploadDir(params);

    console.log('started uploading files from ' + chalk.bold(config.dist));
    console.log('');

    uploader.on('error', function (err) {
        console.log(' ');
        console.error('unable to sync:', err);
      });

    uploader.on('progress', function () {
        log(chalk.bold('progress ' + uploader.progressAmount + '/' + uploader.progressTotal));
      });

    uploader.on('end', function () {
        console.log(' ');
        console.log('done uploading');
        console.log('find your app at: ', getUrl('development'));
      });
  });
}

function create(data, accountToken) {
  readngdeploy();

  if (accountToken === undefined) {
    accountToken = system.accountToken;
  }

  authedRequest.post({

          url: 'https://api.ngdeploy.com/apps',
          body: data,
          headers: {
              'Content-Type': 'application/json',
              Authorization: 'Bearer ' + accountToken,
            },
        }, function (error, response, body) {
          if (error) {
            return fatal('Failed to create app ' + data);
          }

          if (body.error) {
            return console.log('Error creating app', body.error);
          } else if (body.response) {
            return console.log(body.response);
          }
        });
}

function additionalHelp() {
  console.log('');
  console.log('Usage:');
  console.log(chalk.yellow('      $ ngdeploy --help'));
  console.log(chalk.yellow('1.    $ ngdeploy set -g -a <AccountToken>'));
  console.log(chalk.yellow('2.    $ ngdeploy create <appName> [-a <accountToken>]'));
  console.log(chalk.yellow('3.    $ ngdeploy init <appName> <distDir> [-a <accountToken>]'));
  console.log(chalk.yellow('4.    $ ngdeploy push'));
  console.log('');
  console.log('Example: ');
  console.log(chalk.cyan('1.    $ ngdeploy set -g -a 123456789'));
  console.log(chalk.cyan('2.    $ ngdeploy create helloApp'));
  console.log(chalk.cyan('3.    $ ngdeploy init helloApp ./dist'));
  console.log(chalk.cyan('4.    $ ngdeploy push'));
  console.log('');
}

function usage() {
  helpHeader();
  additionalHelp();
  helpFooter();
}

function _list(accountToken) {

  if (!accountToken) {
    accountToken = findToken();
  }

  request
      .get({
          url: system.endpoint + '/apps',
          json: true,
          headers: {
              'Content-Type': 'application/json',
              Authorization: 'Bearer ' + accountToken,
            },
        }, function (err, response, body) {
          if (err) {
            console.log(err);
            return fatal('Error retrieving apps. ', 1);
          }

          var items = body || [];
          console.log('Listing apps ........');
          console.log(chalk.bold('id') +  '..' + 'Name' + '..' + 'Role ');
          items.forEach(function (item) {
              console.log(chalk.bold(item.apps.id) + '...' + item.apps.name + '...' + item.teams.type);
            });
        });
}

function _delete(id, accountToken) {

  if (!id) {
    return fatal('Did not provide an app id.', 1);
  }

  if (!accountToken) {
    accountToken = findToken();
  }

  request
      .del({
          json: true,
          headers: {
              'Content-Type': 'application/json',
              Authorization: 'Bearer ' + accountToken,
            },
          url: system.endpoint + '/apps/' + id,
        }, function (err, response, body) {
          if (err) {
            console.log(err);
            return fatal('Failed to delete app. ');
          }

          if (body.error !== undefined) {
            return fatal(body.error, 1);
          }

          if (body.response !== undefined) {
            return console.log(body.response);
          }else {
            return console.log('Finished deleting.', body);
          }
        });
}

function _promote(target) {
  if (!target) {
    return fatal('no stage selected for promotion.', 1);
  }

  readngdeploy();

  authedRequest
      .post({
          url: system.endpoint + '/apps/promotes',
          body: {
              id: system.id,
              stage: target,
            },
        }, function (err, response, body) {

          if (err) {
            console.log(err);
            return fatal('Failed to promote app. ', 1);
          }

          if (body.error !== undefined) {
            return fatal(body.error);
          }

          if (body.response !== undefined) {
            console.log(body.response);
            console.log(chalk.green('Check it out at ' + getUrl(target)));
          }
        });
}

function _setEnv(appId, stage, kv) {

  if (!appId) { return fatal('Need to set the id. -appId ', 1); }

  if (!stage) { return fatal('Need to set the stage. -stage [development|staging|production] '); }

  if (!kv)   { return fatal('Need to set the key value. -kv key=value'); }

  var check;

  readngdeploy();

  authedRequest
      .post({
          url: system.endpoint + '/apps/envs',
          body: {
              id: Number(appId),
              stage: stage,
              env: kv,
            },
        }, function (err, response, body) {
          if (err) {
            console.log(err);
            return fatal(err, 1);
          }

          if (body.error) {
            console.log(body.error);
            return fatal(body.error, 1);
          }

          if ((check = body) && check.response !== undefined) {
            console.log(check.response);
          }

        });
}

function setAccountToken(accountToken, global) {
  var cfgPath = configPath(global);

  try {
    var sys = {};
    if (fs.existsSync(cfgPath)) {
      try {
        sys = JSON.parse(fs.readFileSync(cfgPath));
      }catch (e) {
        console.log('corrupted ' + cfgPath);
      }
    }

    sys.accountToken = accountToken;
    fs.writeFileSync(cfgPath, JSON.stringify(sys));
    return true;
  }catch (e) {
    console.log(e);
    fatal('Failed to write into user home directory at ' + cfgPath, 1);
    return false;
  }
}

function get (key) {
    return system[key];
}


var loginSchema = {
    properties: {
        accountToken: {
            description: 'Account Token to use, by default global ~/.ngdeploy',
            // Maybe, is it necessary?
            //hidden: true,
            //replace: '*'
        },
    },
};


function login (opts){
    console.log(chalk.bold("Open this link in a browser to login: ") +
                chalk.cyan(chalk.bold("http://ngdeploy.com/?redirectTo=private.accounts \n")) +
                chalk.bold("Paste the account token below. ") );

    prompt.start({colors:true});
    if(opts.test){
        return setAccountToken(opts.accountToken, !!opts.global);
    }

    _open("http://ngdeploy.com/#!/user/accounts");
    prompt.get(loginSchema, function (err, result) {
            if (err) {
                return fatal(err, 1);
            }
            setAccountToken(result.accountToken, !!opts.global);
   });
}


exports.setAccountToken = setAccountToken;
exports.update = update;
exports.helpHeader = helpHeader;
exports.helpFooter = helpFooter;
exports.createConfiguration = createConfiguration;
exports.clean = clean;
exports.push = push;
exports.init = init;
exports.fatal = fatal;
exports.dist = dist;
exports.name = name;
exports.additionalHelp = additionalHelp;
exports.usage = usage;
exports.readngdeploy = readngdeploy;
exports.create = create;
exports.delete = _delete;
exports.list = _list;
exports.promote = _promote;
exports.setEnv = _setEnv;
exports.initWithPrompt = initWithPrompt;
exports.get = get;
exports.getUserHome = getUserHome;
exports.login = login;