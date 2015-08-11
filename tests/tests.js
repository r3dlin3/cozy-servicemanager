var should = require('should');
var ServiceManagerFactory = require('../server/lib/service-manager');
var factory = new ServiceManagerFactory();
describe('ServiceManagerFactory', function() {
    describe('#createServiceManager()', function () {
        it('should not throw an error', function () {
            //var factory = new serviceManager.ServiceManagerFactory();
            var serviceManager = factory.createServiceManager();
            should.exists(serviceManager);

        })
        describe('#getAll()', function () {
            it('should returned services', function () {
                //var factory = new serviceManager.ServiceManagerFactory();
                var serviceManager = factory.createServiceManager();
                should.exists(serviceManager);

                var services = serviceManager.getAll();
                should.exists(services);
                services.should.be.an.Array;
                services.should.not.be.empty;

            })

        });
    });
});