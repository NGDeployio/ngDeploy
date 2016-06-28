'use strict';

var request = require('request');
var fs = require('fs');
var path = require('path');
var s3 = require('s3');
var log = require('single-line-log').stdout;
var pkg = require('../package');
var _ = require('underscore');
var util = require('util');
var authedRequest = request.defaults(
        { json: true,
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + findToken(),
          },
        });

var system = {
    id: '',
    name: '',
    accountToken: '',
    ngDeployUrl: '',
    version: pkg.version,
    dist: './dist',
    path: process.cwd(),
    endpoint: 'https://api.ngdeploy.com', };

function findToken() {
  var globalConfig = configPath(1);
  var pkgConfig = configPath(0);
  var sys = {};

  try {
    if (fs.existsSync(pkgConfig)
        && (sys = JSON.parse(fs.readFileSync(pkgConfig)))
        && sys.accountToken) {
      return sys.accountToken;
    }
  }catch (err) {
  }

  try {
    if (fs.existsSync(globalConfig)
        && (sys = JSON.parse(fs.readFileSync(globalConfig)))
        &&  sys.accountToken) {
      return sys.accountToken;
    }
  }catch (err) {
    console.log('Failed to load global config: ', err);
  }

  return '';
}

const chalk = require('chalk');

function getUserHome() {
  return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
}

function configPath(global) {
  var filename = '.ngdeploy';
  if (global) {
    return getUserHome() + '/' + filename;
  }

  return filename;
}

function name(updateName) {
  if (updateName)
      system.name = updateName;
  return system.name;
}

function dist(updateDist) {
  if (updateDist)
      system.dist = updateDist;

  return system.dist;
}

function clean() {
  header();
  console.log('Removing files... ');
  var files = ['.ngdeploy'];
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

function header() {
  console.log(' ngdeploy: ' + pkg.description + ' (v' + pkg.version + ')');
}

function helpHeader() {
  header();
  console.log(' ngdeploy --help for help menu');
  console.log('');
}

function helpFooter() {
  console.log('for documentation visit http://ngdeploy.com');
  console.log('');
}

function fatal(msg, code) {
  helpHeader();
  console.log(chalk.red('Fatal error: ' + msg));
  console.log('');
  helpFooter();
  process.exit(code);
}

function createConfiguration(app) {
  system.id = app.id || null;
  system.name = app.name || null;
  var error;

  system.ngDeployUrl = app.ngDeployUrl || null;
  if (system.id == null || system.name == null || system.ngDeployUrl == null) {
    error = 'Cannot create configuration file. One of these values is null.',
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
      console.log(globalConfig);
    }catch (err) {
      console.log('Failed to load global config: ', err);
    }
  }

  if (fs.existsSync(pkgConfig)) {
    try {
      system = JSON.parse(fs.readFileSync(pkgConfig));
      system.endpoint = 'https://api.ngdeploy.com';
      console.log(system);
    }catch (err) {
      fatal('Cannot read ' + pkgConfig + ' file. Probably not formatted correctly.', 1);
      return false;
    }

    return true;
  }

  if (system.accountToken == null || system.accountToken == '') {
    system.accountToken = _global.accountToken;
  }

  return false;
}

function init(appName, dist, opts) {
  readngdeploy();

  if (appName == undefined || appName.length < 1) return;

  appName = appName.replace(/[`~!@#$%^&*()_|+\-=?;:'",<>\{\}\[\]\\\/]/gi, '');
  appName = appName.split(' ').join('_').toLowerCase();

  if (opts.accountToken) {
    system.accountToken = opts.accountToken;
  }

  if (!system.accountToken) {
    console.log(system);
    return fatal('accountToken is required.');
  }

  system.name = appName;
  system.ngDeployUrl = appName;

  if (dist) {
    system.dist = dist;
  }

  console.log(system);
  authedRequest
      .get({
          url: system.endpoint + '/apps',
        }, function (err, response, body) {

          if (err) {
            fatal('There was a problem: ' + err, 1);
            return;
          }

          if (typeof body.error != 'undefined') {
            return fatal(body.error, 1);
          }

          var app = _.find(body, function (something) {
              return something.apps.ngDeployUrl === system.ngDeployUrl;
            });

          if (app == null || app == {}) {
            return fatal('appName not found. Create the app first', 1);
          }

          createConfiguration(app.apps);
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
    fatal('No .ngdeploy file found.' + require('os').EOL
          + 'Initiate the app with' + require('os').EOL
          + chalk.bold('ngdeploy init <appname> <distribution folder>'));
  }

  var next = function () {
      if (root === path.sep) return {
          value: undefined,
          done: true,
        };

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
  var config = system = JSON.parse(results.value.toString());

  var url = system.endpoint + '/policy?name=' + config.name;
  console.log(url);
  authedRequest.get({
              url: url,
            }, function (error, response, body) {
    if (error) console.log(error);

    var data = body.data;

    var s3Options = {
              accessKeyId: data.Credentials.AccessKeyId,
              secretAccessKey: data.Credentials.SecretAccessKey,
              sessionToken: data.Credentials.SessionToken,

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
        console.log('find your app at: ', 'https://development-' + config.name + '.ngdeploy.com');
      });
  });
}

function create(data, accountToken) {
  readngdeploy();

  if (typeof accountToken == 'undefined') {
    accountToken = system.accountToken;
  }

  authedRequest.post({
          url: 'https://api.ngdeploy.com/apps',
          body: data,
        }, function (error, response, body) {
          if (error) {
            return fatal('Failed to create app ' + data);
          }

          if (body) {
            console.log('Successfully created app.');
            return true;
          }
        });
}

function additionalHelp() {
  console.log(' usage:');
  console.log('');
  console.log(chalk.yellow('    $ ngdeploy --help'));
  console.log(chalk.yellow('1.    $ ngdeploy set -g -a <AccountToken>'));
  console.log(chalk.yellow('2.    $ ngdeploy create appName'));
  console.log(chalk.yellow('3.    $ ngdeploy init <appName> <distDir>'));
  console.log(chalk.yellow('4.    $ ngdeploy push'));
  console.log(chalk.cyan('Example: '));
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
              console.log(chalk.bold(item.apps.id) + '...');
              console.log(item.apps.name + '...' + item.teams.type);
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

          if (typeof body.error != 'undefined') {
            return fatal(body.error, 1);
          }

          if (typeof body.response != 'undefined') {
            return console.log(body.response);
          }else {
            return console.log('Finished deleting.', body);
          }
        });
}

function url(stage) {
  return 'https://' + stage + '-' + system.ngDeployUrl + '.ngdeploy.com';
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

          var check;

          if ((check = body) && typeof check.response != 'undefined') {
            console.log('Check it out at ' + url(target));
          }

          console.log(check);

        });
}

function _setEnv(appId, stage, kv) {
  console.log(arguments);

  if (!appId) { return fatal('Need to set the id. -appId ', 1); }

  if (!stage) { return fatal('Need to set the stage. -stage [development|staging|production] '); }

  if (!kv)   { return fatal('Need to set the key value. -kv key=value'); }

  readngdeploy();

  authedRequest
      .post({
          url: system.endpoint + '/apps/envs',
          body: {
              id: Number(appId),
              stage: stage,
              kv: kv,
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

          var check;

          if ((check = body) && typeof check.response != 'undefined') {
            console.log('Check it out at ' + url(stage));
          }

          console.log(check);

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
