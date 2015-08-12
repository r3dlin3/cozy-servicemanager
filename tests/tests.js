var os = require('os');
var should = require('should');
var ServiceManagerFactory = require('../server/lib/service-manager');
var factory = new ServiceManagerFactory();


describe('ServiceManagerFactory', function () {
    describe('#createServiceManager()', function () {
        var serviceManager;
        var serviceName;

        before(function () {
            serviceManager = factory.createServiceManager();
            switch (os.platform()) {
                case 'win32':
                    serviceName = 'wuauserv' // Windows update.
                    // Should be available on every Windows
                    break;
                default:
                    throw 'Platform unknown';
            }
            console.info('Testing service ' + serviceName);
        });
        it('should not throw an error', function () {
            should.exists(serviceManager);
        })
        describe('#getAll()', function () {
            this.timeout(50000);
            it('should return services', function (done) {
                var services = serviceManager.getAll(function (services) {
                    should.exists(services);
                    services.should.be.an.Array;
                    services.should.not.be.empty;
                    services.length.should.be.above(0);
                    done();
                });

            })
        });
        describe('#_getService()', function () {
            it('should return a service with status', function (done) {
                serviceManager._getService(serviceName, function (service, err) {
                    should.exists(service);
                    should.not.exists(err);
                    console.log('service = ' + JSON.stringify(service));
                    done();
                });
            });

            it('should return an error when the service does not exist', function (done) {
                serviceManager._getService("UNKNOWN", function (service, err) {
                    should.exists(err);
                    should.not.exists(service);
                    console.log('err = ', err);
                    done();
                });
            });

        });
        describe('#getDetail()', function () {
            it('should return the details', function (done) {
                serviceManager.getDetails(serviceName, function (service, err) {
                    should.exists(service);
                    should.not.exists(err);
                    console.log('service = ' + JSON.stringify(service));
                    done();
                });
            });
            it('should return an error when the service does not exist', function (done) {
                serviceManager.getDetails("UNKNOWN", function (service, err) {
                    should.exists(err);
                    should.not.exists(service);
                    console.log('err = ', err);
                    done();
                });
            });
        });
        describe('#start()', function () {
            this.timeout(50000);
            it('should start a service', function (done) {
                serviceManager.start(serviceName, function (err) {
                    should.not.exists(err);
                    done();
                });
            })
            it('should not fail when we start a service already started', function (done) {
                serviceManager.start(serviceName, function (err) {
                    should.not.exists(err);
                    serviceManager.start(serviceName, function (err) {
                        should.not.exists(err);
                        done();
                    });
                });
            });
        });
        describe('#stop()', function () {
            this.timeout(50000);
            it('should stop a service', function (done) {
                serviceManager.stop(serviceName, function (err) {
                    should.not.exists(err);
                    done();
                });
            })
            it('should not fail when we stop a service already stopped', function (done) {
                serviceManager.stop(serviceName, function (err) {
                    should.not.exists(err);
                    serviceManager.stop(serviceName, function (err) {
                        should.not.exists(err);
                        done();
                    });
                });
            });
        });
    });
});

