var americano = require('americano');

//callback null, app, server
var myapp,myserver;
exports.start = function (cb) {
    var port = process.env.PORT || 3000;
    americano.start({name: '', port: port},function(err,app,server){
        myapp = app;
        myserver = server;
        cb();

    });

};

exports.stop = function (cb) {
    myserver.close();

};