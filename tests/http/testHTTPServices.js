var os = require('os');
var should = require('should');
var server = require('../util/start_server');
var request = require('supertest');

describe('HTTP tests', function () {
    var serviceName;
    var url = 'http://localhost:3000';
    before(function (done) {
        switch (os.platform()) {
            case 'win32':
                serviceName = 'wuauserv' // Windows update.
                // Should be available on every Windows
                break;
            default:
                throw 'Platform unknown';
        }
        console.info('Testing service ' + serviceName);
        server.start(done);
    });

    describe('services: get', function () {
        it('should get a 200 response', function (done) {
            request(url)
                .get('/services')
                // end handles the response
                .end(function (err, res) {
                    if (err) {
                        throw err;
                    }
                    // this is should.js syntax, very clear
                    res.should.have.property('status', 200);
                    res.body.should.be.an.Array();
                    res.body.should.not.be.empty();
                    done();
                });
        });
    });
    describe('services: get details', function () {
        it('should get a 200 response', function (done) {
            request(url)
                .get('/services/' + serviceName).end(function (err, res) {
                    if (err) {
                        throw err;
                    }
                    res.should.have.property('status', 200);
                    res.body.should.have.property('name', serviceName);
                    res.body.should.have.property('status');

                    done();
                });
        });

        it('should get an error for unknown service', function (done) {
            request(url)
                .get('/services/UNKNOWN').end(function (err, res) {
                    should(err).not.be.empty();
                    err.should.have.property('status', 500);

                    done();
                });
        });
    });

    after(function () {
        server.stop();
    });
});