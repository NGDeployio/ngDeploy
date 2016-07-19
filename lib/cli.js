'use strict';

var fs = require('fs');
var path = require('path');
var s3 = require('s3');
var log = require('single-line-log').stdout;
var pkg = require('../package');
var prompt = require('prompt');
var _ = require('underscore');
var _open = require('open');
var utils = require('./utils');
var auth = require('./auth');
var api = require('./api');
var Table = require('cli-table');

var config = require('./config');

var logger = require('./logger');

const chalk = require('chalk');

var authedRequest = auth.request;

function clean(opts) {
    var files = [];

    opts = opts || {};

    if (opts.local) {
        files.push('./.ngdeploy');
    }

    if (opts.global) {
        files.push(config.getUserHome() + "/.ngdeploy");
    }

    if (!(opts.global || opts.local)) {
        files.push('./.ngdeploy');
    }

    utils.header();
    logger.info('Removing files... ');

    var removedAll = true;

    files.forEach(function (file) {
        if (fs.existsSync(file)) {
            fs.unlinkSync(file);
            utils.logSuccess(' ' + chalk.yellow(file));
        } else {
            utils.logError(' ' + chalk.yellow(file));
            removedAll = false;
        }
    });

    if (removedAll) {
        logger.info('Removed all files successfully.');
    } else {
        logger.info('Failed to remove some files.');
    }

    return removedAll;
}

var endpoint = 'https://api.ngdeploy.com';

function createConfiguration(opts) {

    var system = {
        id: opts.id || '',
        name: opts.name || '',
        accountToken: opts.accountToken || config.findToken(),
        version: pkg.version,
        dist: opts.dist,
        ngDeployUrl:opts.ngDeployUrl,
        endpoint: endpoint,
        path: process.cwd(),

    };

    if (system.id == null || system.name == null || system.ngDeployUrl == null) {
        var error = 'Cannot create configuration file. One of these values is null.';
        error = error + '\n Id: $ID Name: $NAME ngDeployUrl: $NG';

        error = error.replace('$ID', system.id)
            .replace('$NAME', system.name)
            .replace('$NG', system.ngDeployUrl);
        return utils.fatal(error, 1);
    }

    try {
        config.saveConfig(system);
        logger.silly("Config created.");

        return true;
    } catch (e) {
        console.log(e);
        console.log("Failed to create configuration file .ngdeploy");
        return false;
    }
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
    var accountToken;

    if (opts && opts.accountToken) {
        accountToken = opts.accountToken;
    } else {
        accountToken = config.findToken();
    }

    if (appName === undefined || appName.length < 3) {
        return;
    }

    appName = appName.replace(/[`~!@#$%^&*()_|+\-=?;:'",<>\{\}\[\]\\\/]/gi, '')
        .split(' ').join('_').toLowerCase();

    if (!accountToken) {
        return utils.fatal('An account token was not found.');
    }

    if ( ! dist ) {
        dist = './';
    }

    authedRequest(accountToken)
        .get({
            url: endpoint + '/apps',
        }, function (err, response, body) {

            if (err) {
                logger.info('There was a connectivity problem. ');
                return utils.fatal(err, 1);
            }

            if (body.error !== undefined) {
                return utils.fatal(body.error, 1);
            }

            var app = _.find(body, function (something) {
                return something.apps.ngDeployUrl === appName;
            });

            if (app == null || app === {}) {
                return utils.fatal('appName not found. Create the app first', 1);
            }

            createConfiguration({id: app.apps.id, dist: dist, name:app.apps.name,ngDeployUrl:app.apps.ngDeployUrl, accountToken: accountToken});
        });
}

function initWithPrompt() {
    prompt.start();
    prompt.get(schema, function (err, result) {
        if (err) {
            return utils.fatal(err, 1);
        }

        init(result.appName, result.distDir, result.accountToken);
    });
}

function update(k, v) {
    config.set(k,v);
}

function push() {
    var root = process.cwd();
    var check = path.join(root, '.ngdeploy');
    var data;

    if (!fs.existsSync(check)) {
        var error = 'No .ngdeploy file found.' + require('os').EOL;
        error += 'Initiate the app with' + require('os').EOL;
        error += chalk.bold('ngdeploy init <appname> <distribution folder>');
        return utils.fatal(error, 1);
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
    if(results){
        // skip  me
    }

    var url = config.get('endpoint') + '/policy?name=' + config.get('name');

    logger.info(url);

    authedRequest().get({
        url: url,
    }, function (error, response, body) {

        if (error) {
            logger.info(error);
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

        var p = path.join(config.get('path'), config.get('dist'));
        var name = config.get('name');
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

        logger.info('started uploading files from ' + chalk.bold(config.get('dist')));
        logger.info('');

        uploader.on('error', function (err) {
            logger.info(' ');
            console.error('unable to sync:', err);
        });

        uploader.on('progress', function () {
            log(chalk.bold('progress ' + uploader.progressAmount + '/' + uploader.progressTotal));
        });

        uploader.on('end', function () {
            logger.info(' ');
            logger.info('done uploading');
            logger.info('find your app at: ', utils.getUrl('development', config.get('name')));
        });
    });
}

function create(data, accountToken) {
    var patt = new RegExp(/[`~!@#$%^&*()_|+\-=?;:'",<>\{\}\[\]\\\/]/gi);

    if(patt.test(data.name)){
        return logger.info('The appName cannot contain spaces or special characters.');
    }

    authedRequest(accountToken).post({
        url: 'https://api.ngdeploy.com/apps',
        body: data
    }, function (error, response, body) {
        if (error) {
            logger.info("Failed to create app: ", data);
            return utils.fatal(error, 1);
        }
        if (body.error) {
            return logger.info('Error creating app: ', body.error);
        }
        return logger.info("Successfully created app.");
    });
}

function additionalHelp() {
    logger.info('Usage:');
    logger.info(chalk.yellow('      $ ngdeploy --help'));
    logger.info(chalk.yellow('1.    $ ngdeploy login'));
    logger.info(chalk.yellow('2.    $ ngdeploy create <appName> [-a <accountToken>]'));
    logger.info(chalk.yellow('3.    $ ngdeploy init <appName> <distDir> [-a <accountToken>]'));
    logger.info(chalk.yellow('4.    $ ngdeploy push'));
    logger.info('');
    logger.info('Example: ');
    logger.info(chalk.cyan('1.    $ ngdeploy login'));
    logger.info(chalk.cyan('2.    $ ngdeploy create helloApp'));
    logger.info(chalk.cyan('3.    $ ngdeploy init helloApp ./dist'));
    logger.info(chalk.cyan('4.    $ ngdeploy push'));
    logger.info('');
}

function usage() {
    utils.helpHeader();
    additionalHelp();
    utils.helpFooter();
}

function list(opts) {
    api.list(opts.accountToken, function (err, items) {
        if (err) {
            console.log("Error: ", err);
            return;
        }

        if (items && items.forEach) {
            var table = new Table({
                head: ['App Id', 'appName','Role'],
                colWidths: [10, 20,10]
            });
            items.forEach(function (item) {
                table.push([chalk.bold(item.apps.id),item.apps.name, item.teams.type]);
            });
            logger.info(table.toString());
        } else {
            logger.info(chalk.bold("No applications have been found."));
            logger.info(chalk.bold("Visit http://ngdeploy.com to get started."));
        }
    });
}

function _delete(opts) {
    var appId = opts.appId;

    if (!appId) {
        return utils.fatal('Did not provide an app id.', 1);
    }

    authedRequest(opts.accountToken)
        .del({
            url: config.get('endpoint') + '/apps/' + appId,
        }, function (err, response, body) {
            if (err) {
                logger.info(err);
                return utils.fatal('Failed to delete app. ');
            }

            if (body.error) {
                return utils.fatal(body.error, 1);
            }

            if (body.response) {
                return logger.info(body.response);
            } else {
                return logger.info('Finished deleting.', body);
            }
        });
}

function _promote(opts) {
    var target = opts.to;
    var appId = opts.appId || config.get('id');

    if (!target) {
        return utils.fatal('no stage selected for promotion.', 1);
    }
    if(!appId){
        return utils.fatal('invalid app id provided.',1);
    }

    authedRequest()
        .post({
            url: config.get('endpoint') + '/apps/promotes',
            body: {
                id: Number(appId),
                stage: target,
            },
        }, function (err, response, body) {

            if (err) {
                logger.info(err);
                return utils.fatal('Failed to promote app. ', 1);
            }

            if (body && body.error) {
                return utils.fatal(body.error);
            }

            if (body && body.response) {
                logger.info(body.response);
                if(!opts.appId){
                    logger.info(chalk.green('Check it out at ' + utils.getUrl(target, config.get('ngDeployUrl'))));
                }
            }
        });
}

function _setEnv(appId, stage, kv) {

    if (!appId) {
        return utils.fatal('Need to set the id. -appId ', 1);
    }

    if (!stage) {
        return utils.fatal('Need to set the stage. -stage [development|staging|production] ');
    }

    if (!kv) {
        return utils.fatal('Need to set the key value. -kv key=value');
    }

    authedRequest()
        .post({
            url: config.get('endpoint') + '/apps/envs',
            body: {
                id: Number(appId),
                stage: stage,
                env: kv,
            },
        }, function (err, response, body) {
            if (err) {
                logger.info(err);
                return utils.fatal(err, 1);
            }

            if (body && body.error) {
                logger.info(body.error);
                return utils.fatal(body.error, 1);
            }

            if (body && body.response) {
               return logger.info(body.response);
            }

        });
}

var loginSchema = {
    properties: {
        accountToken: {
            description: 'Account Token to use',
            // Maybe, is it necessary?
            //hidden: true,
            //replace: '*'
        },
    },
};


function logout(opts) {
    return config.setAccountToken("", !!opts.global);
}

function login(opts) {

    if (opts.accountToken) {
        return config.setAccountToken(opts.accountToken, !!opts.global);
    }

    logger.info(chalk.bold("Open this link in a browser to login: ") +
        chalk.cyan(chalk.bold("https://ngdeploy.com/#!/?redirectTo=private.accounts \n")) +
        chalk.bold("Paste the account token below. "));

    prompt.start({colors: true});

    _open("https://ngdeploy.com/#!/?redirectTo=private.accounts");
    prompt.get(loginSchema, function (err, result) {
        if (err) {
            return utils.fatal(err, 1);
        }
        return config.setAccountToken(result.accountToken, !!opts.global);
    });
}


module.exports = {
    update: update,
    createConfiguration: createConfiguration,
    clean: clean,
    push: push,
    init: init,
    additionalHelp: additionalHelp,
    usage: usage,
    create: create,
    delete: _delete,
    list: list,
    promote: _promote,
    setEnv: _setEnv,
    initWithPrompt: initWithPrompt,
    login: login,
    logout: logout,
    logger: logger,
};