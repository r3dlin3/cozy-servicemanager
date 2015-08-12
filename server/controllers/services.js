var ServiceManagerFactory = require('../lib/service-manager');
var factory = new ServiceManagerFactory();
var serviceManager = factory.createServiceManager();

// TODO manage this as 'constant'  from class serviceManager or ServiceManagerFactory
var STATUS_STARTED = 'started';
var STATUS_STOPPED = 'stopped';

module.exports.list = function(req, res, next) {
    serviceManager.getAll(function (services) {
        res.status(200).send(services);
    });
};

module.exports.get = function (req, res, next) {
    serviceManager.getDetails(req.params.name, function (service, err) {
        if(err !== null) {
            next(err);
        } else {
            res.status(200).send(service);
        }
    });

};

module.exports.update = function (req, res, next) {
    var service = req.body;
    var serviceName = req.params.name;
    if (service.status === STATUS_STARTED) {
    serviceManager.start(serviceName, function (err) {
        if(err !== null) {
            next(err);
        } else {
            res.status(200).send();
        }
    });
    } else if (service.status === STATUS_STOPPED) {
        serviceManager.stop(serviceName, function (err) {
            if(err !== null) {
                next(err);
            } else {
                res.status(200).send();
            }
        });
    } else {
        res.status(500).send("Unknown status");
    }
};

module.exports.stop = function (req, res, next) {

};
