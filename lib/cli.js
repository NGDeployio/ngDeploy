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

var logger = require('./logger');

var system = {
    id: '',
    name: '',
    accountToken: '',
    ngDeployUrl: '',
    version: pkg.version,
    dist: './dist',
    path: process.cwd(),
    endpoint: 'https://api.ngdeploy.com',
};

const chalk = require('chalk');

var authedRequest = auth.request;

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

function readngdeploy() {
    var globalConfig = utils.configPath(1);
    var pkgConfig = utils.configPath(0);
    var _global = {};

    if (fs.existsSync(globalConfig)) {
        try {
            var sys = JSON.parse(fs.readFileSync(globalConfig));
            _global.accountToken = sys.accountToken;
        } catch (err) {
            //logger.info('Failed to load global config: ', err);
        }
    }

    if (fs.existsSync(pkgConfig)) {
        try {
            system = JSON.parse(fs.readFileSync(pkgConfig));
            system.endpoint = 'https://api.ngdeploy.com';
        } catch (err) {
        }
    }

    if (!system.accountToken || system.accountToken === '') {
        system.accountToken = _global.accountToken;
    }

    return system;
}

function clean(opts) {
    var files = [];

    opts = opts || {};

    if (opts.local) {
        files.push('./.ngdeploy');
    }
    if (opts.global) {
        files.push(utils.getUserHome() + "/.ngdeploy");
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

function createConfiguration(app,accountToken) {
    system.id = app.id;
    system.name = app.name;
    system.dist = system.dist || app.dist;
    system.ngDeployUrl = app.ngDeployUrl;
    system.accountToken = app.accountToken || accountToken || utils.findToken();

    if (system.id == null || system.name == null || system.ngDeployUrl == null) {
        var error = 'Cannot create configuration file. One of these values is null.';
        error = error + '\n Id: $ID Name: $NAME ngDeployUrl: $NG';

        error = error.replace('$ID', system.id)
            .replace('$NAME', system.name)
            .replace('$NG', system.ngDeployUrl);
        return utils.fatal(error, 1);
    }

    try {
        fs.writeFileSync('.ngdeploy', JSON.stringify(system, null, 4));
        return true;
    } catch (e) {
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
        accountToken = utils.findToken();
    }

    if (appName === undefined || appName.length < 3) {
        return;
    }

    appName = appName.replace(/[`~!@#$%^&*()_|+\-=?;:'",<>\{\}\[\]\\\/]/gi, '')
        .split(' ').join('_').toLowerCase();

    if (!accountToken) {
        return utils.fatal('An account token was not found.');
    }

    system.name = appName;
    system.ngDeployUrl = appName;

    if (dist) {
        system.dist = dist;
    } else {
        system.dist = './';
    }

    authedRequest(accountToken)
        .get({
            url: system.endpoint + '/apps',
        }, function (err, response, body) {

            if (err) {
                logger.info('There was a connectivity problem. ');
                return utils.fatal(err, 1);
            }

            if (body.error !== undefined) {
                return utils.fatal(body.error, 1);
            }

            var app = _.find(body, function (something) {
                return something.apps.ngDeployUrl === system.ngDeployUrl;
            });

            if (app == null || app === {}) {
                return utils.fatal('appName not found. Create the app first', 1);
            }

            createConfiguration(app.apps,accountToken);
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
    var config = JSON.parse(results.value.toString());

    var url = config.endpoint + '/policy?name=' + config.name;

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

        var p = path.join(config.path, config.dist);
        var name = config.name;
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

        logger.info('started uploading files from ' + chalk.bold(config.dist));
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
            logger.info('find your app at: ', utils.getUrl('development', system.ngDeployUrl));
        });
    });
}

function create(data, accountToken) {

    if (!accountToken) {
        accountToken = utils.findToken();
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
        } else if (body.response) {
            return logger.info(body.response);
        }
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
    var appName = opts.appName;

    if (!id) {
        return utils.fatal('Did not provide an app id.', 1);
    }

    authedRequest(accountToken)
        .del({
            url: system.endpoint + '/apps/' + id,
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

    if (!target) {
        return utils.fatal('no stage selected for promotion.', 1);
    }

    readngdeploy();

    authedRequest()
        .post({
            url: system.endpoint + '/apps/promotes',
            body: {
                id: system.id,
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
                logger.info(chalk.green('Check it out at ' + utils.getUrl(target, system.ngDeployUrl)));
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
            url: system.endpoint + '/apps/envs',
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

function setAccountToken(accountToken, global) {
    var cfgPath = utils.configPath(global);

    try {
        var sys = {};
        if (fs.existsSync(cfgPath)) {
            try {
                sys = JSON.parse(fs.readFileSync(cfgPath));
            } catch (e) {
                logger.info('corrupted ' + cfgPath);
            }
        }

        sys.accountToken = accountToken;
        fs.writeFileSync(cfgPath, JSON.stringify(sys));


        return true;
    } catch (e) {
        logger.info(e);
        utils.fatal('Failed to write into user home directory at ' + cfgPath, 1);
        return false;
    }
}

function _get(key) {
    return system[key];
}

function _set(key, val) {
    return system[key] = val;
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
    return setAccountToken("", !!opts.global);
}

function login(opts) {

    if (opts.accountToken) {
        return setAccountToken(opts.accountToken, !!opts.global);
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
        return setAccountToken(result.accountToken, !!opts.global);
    });
}


module.exports = {
    setAccountToken: setAccountToken,
    update: update,
    createConfiguration: createConfiguration,
    clean: clean,
    push: push,
    init: init,
    dist: dist,
    name: name,
    additionalHelp: additionalHelp,
    usage: usage,
    readngdeploy: readngdeploy,
    create: create,
    delete: _delete,
    list: list,
    promote: _promote,
    setEnv: _setEnv,
    initWithPrompt: initWithPrompt,
    get: _get,
    set: _set,
    login: login,
    logout: logout,
    logger: logger,
};