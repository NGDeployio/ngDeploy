'use strict';

var request = require('request')
    , fs = require('fs')
    , path = require('path')
    , s3=require("s3")
    , log = require('single-line-log').stdout
    , pkg = require('../package')
    , _ = require("underscore")
    , util = require('util')
    ;

const chalk = require("chalk");

var system = {
    name:'',
    accessToken:'',
    ngDeployUrl:'',
    version: pkg.version,
    dist: './dist',
    path: process.cwd(),
    endpoint: 'https://api.ngdeploy.com'
};


function getUserHome() {
    return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
}

function name(update_name){
    if(update_name)
        system.name=update_name;
    return system.name;
}

function dist(update_dist){
    if(update_dist)
        system.dist=update_dist;

    return system.dist;
}

function clean(){
    header();
    console.log("Removing files... ");
    var files= [".ngdeploy"];
    var removed_all=true;

    files.forEach(function(file){
        if(fs.existsSync(file)){
            fs.unlinkSync(file);
            console.log("Remove: ", chalk.yellow(file), chalk.green(" success"));
        }else{
            console.log("Remove: ", chalk.yellow(file), chalk.red(" fail"));
            removed_all=false;
        }
    });

    if(removed_all){
        console.log("Removed all files succesfully.");
    }else{
        console.log("Failed to remove some files.");
    }

    return removed_all;
}

function header(){
    console.log(' ngdeploy: ' + pkg.description + ' (v' + pkg.version + ')');
}

function helpHeader() {
    header();
    console.log(' ngdeploy --help for help menu');
    console.log('');
}

function helpFooter() {
    console.log(' for documentation visit http://ngdeploy.com');
    console.log('');
}

function fatal(msg, code) {
    helpHeader();
    console.log(chalk.red('Fatal error: ' + msg));
    console.log('');
    helpFooter();
    process.exit(code);
}

function create_configuration(app){
      system.id = app.id || null;
      system.name = app.name || null;
      system.ngDeployUrl = app.ngDeployUrl || null;
    if(system.id == null || system.name == null || system.ngDeployUrl == null){
        var error = "Cannot create configuration file. One of these values is null.\n Id: $ID Name: $NAME ngDeployUrl: $NG".replace("$ID",system.id).replace("$NAME",system.name).replace("$NG",system.ngDeployUrl)
        return fatal(error,1)
    }
    try{
        fs.writeFileSync(".ngdeploy", JSON.stringify(system,null,4));
        return true;
    }catch(e){
        return false;
    }
}

function readngdeploy(){
    if(fs.existsSync(".ngdeploy")){
        try{
            system = JSON.parse(fs.readFileSync('.ngdeploy'));
        }catch(err){
            fatal("Cannot read .ngdeploy file. Probably not formatted correctly.",1);
            return false
        }
        return true;
    }
    return false;
}

function init(appName, dist,opts) {
    readngdeploy()

    if (appName == undefined || appName.length < 1) return;

    appName = appName.replace(/[`~!@#$%^&*()_|+\-=?;:'",<>\{\}\[\]\\\/]/gi, '').split(' ').join('_').toLowerCase();

    if(opts.accessToken){
        system.accessToken=opts.accessToken;
    }else{
        return fatal("AccessToken is required.");
    }

    system.name = appName;
    system.ngDeployUrl = appName;

    if (dist){
        system.dist = dist;
    }

    request
        .get({
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer "+system.accessToken
            },
            url: system.endpoint+'/apps'
            //form: system
        }, function(err, response, body) {
            //console.log(body);
            if(err){
                fatal("There was a problem: " + err ,1);
                return
            }

            body = JSON.parse(body);
            if(typeof body.error != "undefined"){
                return fatal("Error: Name already exists. Please try a new one. ", 1);
            }

            var app = _.find(body,function(something){
                        return something.apps.ngDeployUrl === system.ngDeployUrl
            });

            if(app == null || app == {}){
                return fatal("appName not found. Create the app first",1);
            }
            create_configuration(app.apps)
        });
}


function update(k,v){
    system[k]=v;
    create_configuration(system)
}

function upload() {
    var root = process.cwd(),
        check = path.join(root, '.ngdeploy');

    readngdeploy()

    if(!fs.existsSync(check)){
        fatal("No .ngdeploy file found."+ require('os').EOL
              + "Initiate the app with"+ require('os').EOL
              + chalk.bold("ngdeploy init <appname> <distribution folder>"))
    }

    var next = function() {
        if (root === path.sep) return {
            value: undefined,
            done: true
        };

        var file = path.join(root, '.ngdeploy'),
            data;

        root = path.resolve(root, '..');

        if (fs.existsSync(file) && (data = fs.readFileSync(file))) {
            data.__path = file;

            return {
                value: data,
                done: false
            };
        }
        return next();
    };

    var results = next();
    var config = system = JSON.parse(results.value.toString());


    var url = system.endpoint + '/policy?name=' + config.name;
	console.log(url);
    request.get({
                 url: url
                 , headers: {
                                "Authorization": "Bearer "+system.accessToken
                            }
                }
        , function(error, response, body) {
	if(error) console.log(error);

        var response = JSON.parse(body);
        var data = response.data;

	var s3Options = {
            accessKeyId: data.Credentials.AccessKeyId,
            secretAccessKey: data.Credentials.SecretAccessKey,
            sessionToken: data.Credentials.SessionToken
            // any other options are passed to new AWS.S3()
            // See: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Config.html#constructor-property
        }

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
                Bucket: "ngdeploy",
                Prefix: 'development/'+ name,
                // other options supported by putObject, except Body and ContentLength.
                // See: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#putObject-property
            }
        };
        var uploader = client.uploadDir(params);

        console.log("started uploading files from " + chalk.bold(config.dist));
        console.log("");

        uploader.on('error', function(err) {
            console.log(" ");
            console.error("unable to sync:", err);
        });

        uploader.on('progress', function() {
            log(chalk.bold("progress "+ uploader.progressAmount + "/"+uploader.progressTotal));
        });

        uploader.on('end', function() {
            console.log(" ");
            console.log("done uploading");
            console.log("find your app at: ", "https://development-"+ config.name +".ngdeploy.com")
        });
    });
}


function create(data,accessToken){
    request.post({
            url: "https://api.ngdeploy.com/apps"
            , headers: {
                "Authorization": "Bearer "+accessToken
            }
            ,form:data
        }
        , function(error, response, body) {
            body=JSON.parse(body);
            console.log(body);
        })
}


function additional_help(){
    console.log(' usage:');
    console.log('');
    console.log(chalk.yellow('    $ ngdeploy --help'));
    console.log(chalk.yellow('    $ ngdeploy create appName -a <accessToken>'));
    console.log(chalk.yellow('    $ ngdeploy init <appName> <dist dir> -a <accessToken>'));
    console.log(chalk.yellow('    $ ngdeploy init exampleApp ./dir -a 123456'));
    console.log(chalk.yellow('    $ ngdeploy promote --source dev --target stage'));
    console.log(chalk.yellow('    $ ngdeploy upload'));
    console.log('');
}

function usage(){
    helpHeader();
    additional_help();
    helpFooter();
}

function _list(accessToken){
    request
        .get({
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer "+ accessToken
            },
            url: system.endpoint+'/apps'
        }, function(err, response, body) {
            console.log("Listing apps ... .. . . . ");
            var body= JSON.parse(body);
            console.log(chalk.bold("ngDeployUrl") +  "\t" + "Name" + "\t" + "Domain ");
            body.forEach(function(item){
                console.log( chalk.bold(item.ngDeployUrl)  + "\t\t" + item.name + "\t" + item.domain);
            })
        });
}

function _delete(name, accessToken){
    request
        .del({
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer "+ accessToken
            },
            url: system.endpoint+'/apps/'+name
        }, function(err, response, body) {
            console.log("Deleted app? ", body);
        });
}

function _promote(source){
    if( !source ){
        return fatal("no source or target for promotion.",1)
    }
    console.log(source);
    readngdeploy();
    //https://api.ngdeploy.com/apps/promotes
    //{"ngDeployUrl":"sweetie","phase":"staging"}
    request
        .post({
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer "+ system.accessToken
            },
            url: system.endpoint+'/apps/promotes',
            form: {
                ngDeployUrl: system.ngDeployUrl,
                stage: source
            }
        }, function(err, response, body) {
            console.log(body);
        });
}

exports.update=update;
exports.helpHeader=helpHeader;
exports.helpFooter=helpFooter;
exports.create_configuration = create_configuration;
exports.clean = clean;
exports.upload = upload;
exports.init = init;
exports.fatal = fatal;
exports.dist= dist;
exports.name=name;
exports.additional_help=additional_help;
exports.usage=usage;
exports.readngdeploy=readngdeploy;
exports.create=create;
exports.delete=_delete;
exports.list=_list;
exports.promote=_promote