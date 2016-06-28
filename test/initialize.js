var ngdeploy= require('../lib/cli.js');
var fs = require('fs');
var chai = require('chai');

var assert = chai.assert;
var should=chai.should();

var test = {'name':'worldtest','version':'0.1.1','dist':'./dist','path':'','endpoint':'https://api.ngdeploy.com', 'id':11};

describe('ngdeploy', function() {
        describe('.init()', function() {
            before(function() {
                if (fs.existsSync('.ngdeploy')) {
                    fs.unlinkSync('.ngdeploy')
                }
            });

            it('should not create an empty .ngdeploy file', function(){
                ngdeploy.init();
                assert.equal(fs.existsSync('.ngdeploy'),false);
            });
    });

    describe('.init(appname,./dist)', function() {
        before(function(){
            if(fs.existsSync('.ngdeploy')){
                fs.unlinkSync('.ngdeploy')
            }
        });
        it('should create an .ngdeploy file', function(){
            ngdeploy.update('name', 'HelloWorld');
            ngdeploy.update('ngDeployUrl','HelloWorld');
            ngdeploy.update('dist', './app');
            ngdeploy.update('id',1);
            ngdeploy.createConfiguration({'id':'123'});
            assert.equal(fs.existsSync('.ngdeploy'),true);

            var testJson=JSON.parse(fs.readFileSync('.ngdeploy'));
            assert.equal(testJson.name,'HelloWorld');
            assert.equal(testJson.dist,'./app');
            assert.equal(testJson.id,'123');

        });

        after(function(){
            if(fs.existsSync('.ngdeploy')){
                fs.unlinkSync('.ngdeploy')
            }
        });
    });

    describe('.clean()', function() {
        before(function(){
            ngdeploy.createConfiguration(JSON.stringify(test));
        });

        it('should remove the .ngdeploy file', function(){
            ngdeploy.clean();
            assert.equal(fs.existsSync('.ngdeploy'),false);
        });
    });

});