var services = require('./services');
var favorite = require('./favorite');


module.exports = {
    'services': {get: services.list},
    /*
     I'm trying to follow REST principles, hence the verb PUT to update the
     status of the service, and therefore start or stop it.
     */
    'services/:name': {
        get: services.get,
        put: services.update
    },

    'favorites': {
        get: favorite.list,
        post: favorite.create
    },

    'favorites/:name': {
        delete: favorite.delete,

    },
};