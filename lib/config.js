var path = require('path');
var fs = require('fs');
var logger = require('./logger');

/**
 * @returns users home directory
 */
function getUserHome() {
    return process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'];
}

/**
 *  Paths for the configuration files.
 */
var localFile = path.join(process.cwd(), './.ngdeploy');
var globalFile = path.join(getUserHome() + '/' + '.ngdeploy');


/**
 * Create an empty configuration file.
 * @param loc
 */
function create(loc){
    if(loc === 'global'){ fs.writeFileSync(globalFile,"{}"); }
    if(loc === 'local' ){ fs.writeFileSync(localFile,"{}");  }
}


/**
 * Set the account token
 * @param accountToken
 * @param global
 * @returns {boolean}
 */
function setAccountToken(accountToken, global) {
    var cfgPath = (global)? globalFile: localFile;

    if(!fs.existsSync(cfgPath)) {
       fs.writeFileSync(cfgPath, "{}");
    }

    try {
        var sys = {};
        if (fs.existsSync(cfgPath)) {
            try {
                sys = JSON.parse(fs.readFileSync(cfgPath));
            } catch (e) {
                logger.error(e);
                logger.error('Failed to read user home directory at ' + cfgPath);
            }
        }
        sys.accountToken = accountToken;
        fs.writeFileSync(cfgPath, JSON.stringify(sys));

        return true;
    } catch (e) {
        logger.error(e);
        logger.error('Failed to write into user home directory at ' + cfgPath);
    }
    return false;
}


/**
 * Set a configuration property
 * @param accountToken
 * @param global
 * @returns {boolean}
 */
function set(key,val) {
    var cfgPath = localFile;

    if(!fs.existsSync(cfgPath)) {
        fs.writeFileSync(cfgPath, "");
    }

    try {
        var sys = {};
        if (fs.existsSync(cfgPath)) {
            try {
                sys = JSON.parse(fs.readFileSync(cfgPath));
            } catch (e) {
                logger.error(e);
                logger.error('Failed to read user home directory at ' + cfgPath);
            }
        }
        sys[key] = val;
        fs.writeFileSync(cfgPath, JSON.stringify(sys));

        return true;
    } catch (e) {
        logger.error(e);
        logger.error('Failed to update config file ' + cfgPath);
    }
    return false;
}

/**
 * Generate path to ngdeploy configuration
 * @param {boolean} global
 * @returns {String} full path to configuration file
 */
function configPath(global) {
    var filename = '.ngdeploy';
    if (global) {
        return getUserHome() + '/' + filename;
    }

    return filename;
}

/**
 * Checks the local and global configuration file for Account Token.
 * @returns {String} Account Token
 */
function findToken() {
    var globalConfig = configPath(1);
    var pkgConfig = configPath(0);
    var sys = {};

    try {
        if(fs.existsSync(pkgConfig)){
            sys = JSON.parse(fs.readFileSync(pkgConfig));
            if (sys.accountToken && sys.accountToken !== "" ) {
                return sys.accountToken;
            }
        }
    }catch (err) {
        logger.error('Failed to load local config: ', err);
    }

    try {
        if (fs.existsSync(globalConfig)){
            sys = JSON.parse(fs.readFileSync(globalConfig));
            if(sys.accountToken) {
                return sys.accountToken;
            }
        }
    }catch (err) {
        logger.error('Failed to load global config: ', err);
    }
    return '';
}

function saveConfig(cfg){
    try {
        fs.writeFileSync(localFile, JSON.stringify(cfg));
    }catch(e){
        logger.error('saveConfig: ', e);
    }
}

function getConfig(){
    if (fs.existsSync(localFile)) {

        try {
            var cfg = JSON.parse(fs.readFileSync(localFile));
            return cfg;
        } catch (e) { }
    }

    return -1;
}

function get(key){
    var cfg = getConfig();
    if(cfg !== -1){
        return cfg[key];
    }
    return null;
}

module.exports.setAccountToken = setAccountToken;
module.exports.findToken = findToken;
module.exports.configPath = configPath;
module.exports.create = create;
module.exports.getUserHome = getUserHome;
module.exports.findToken = findToken;
module.exports.getConfig=getConfig;
module.exports.saveConfig = saveConfig;
module.exports.set = set;
module.exports.get = get;
