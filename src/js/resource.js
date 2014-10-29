//this file is responsible for handling
//client store in local storage
//make socket connections to server
//server side store in file system

(function(){

    var config = require('../config'),
        fs = require('fs');

    function fsStore = {
        getItem: function(){
            //fs.read
        },
        setItem: function(){}
    };

    var store = config.client && localStorage ? localStorage : fsStore;

    function Resource(){}

    module.exports = Resource;

})();
