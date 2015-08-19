var cozydb = require('cozydb');
var Favorite = require('../models/favorite');
var printit = require('printit');
var log = printit({
    prefix: 'cozy-collections',
    date: true
});
var util = require('util');

var baseController = new cozydb.SimpleController({
        model: Favorite,
        reqProp: 'favorite',
        reqParamID: 'name'
    }
);


module.exports = {
    list: baseController.listAll,
    read: baseController.send,
    fetch: baseController.fetch,
    delete: baseController.destroy,
    create: function (req, res, next) {
        log.info("Creating favorite");
        req.checkBody('name', "is required").notEmpty();
        var validationErrors = req.validationErrors();
        if (validationErrors) {
            log.error('request is invalid: ' + util.inspect(validationErrors));
            res.status(400).send(validationErrors);
            return;
        }

        var model = req.body;
        Favorite.create(model, function (err, item) {
            if (err != null) {
                log.error('Could not save Favorite: ' + +util.inspect(err));
                next(err);
            }
            else {
                log.info(util.format('Collection %s created', item.name));
                res.status(201).send(item);
            }
        });
    }


}