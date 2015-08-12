var index = require('./index');
var services = require('./services');


module.exports = {
    '': {get: index.index},
    'services': {get: services.list},
    /*
     I'm trying to follow REST principles, hence the verb PUT to update the
     status of the service, and therefore start or stop it.
     */
    'services/:name': {
        get: services.get,
        put: services.update
    }
};