var ngdeploy= require("../lib/cli.js");
var fs = require("fs");
var chai = require("chai");

var assert = chai.assert;
var should=chai.should();

var test = {"name":"worldtest","version":"0.1.1","dist":"./dist","path":"","endpoint":"https://api.ngdeploy.com", "id":11};

describe("ngdeploy", function() {
        describe(".init()", function() {
            before(function() {
                if (fs.existsSync(".ngdeploy")) {
                    fs.unlinkSync(".ngdeploy")
                }
            });

            it("should not create an empty .ngdeploy file", function(){
                ngdeploy.init();
                assert.equal(fs.existsSync(".ngdeploy"),false);
            });
    });

    describe(".init(appname,./dist)", function() {
        before(function(){
            if(fs.existsSync(".ngdeploy")){
                fs.unlinkSync(".ngdeploy")
            }
        });
        it("should create an .ngdeploy file", function(){
            ngdeploy.name("HelloWorld");
            ngdeploy.dist("./app");
            ngdeploy.create_configuration({"id":"123"});
            assert.equal(fs.existsSync(".ngdeploy"),true);

            var test_json=JSON.parse(fs.readFileSync('.ngdeploy'));
            assert.equal(test_json.name,"HelloWorld");
            assert.equal(test_json.dist,"./app");
            assert.equal(test_json.id,"123");

        });

        after(function(){
            if(fs.existsSync(".ngdeploy")){
                fs.unlinkSync(".ngdeploy")
            }
        });
    });

    describe(".clean()", function() {
        before(function(){
            ngdeploy.create_configuration(JSON.stringify(test));
        });

        it("should remove the .ngdeploy file", function(){
            ngdeploy.clean();
            assert.equal(fs.existsSync(".ngdeploy"),false);
        });
    });

});