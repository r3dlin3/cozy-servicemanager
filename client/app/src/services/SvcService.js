(function () {
    'use strict';

    angular.module('app.services')
        .service('svcService', ['$http', SvcService]);

    /**
     * Services DataService
     * Uses embedded, hard-coded data model; acts asynchronously to simulate
     * remote data service call(s).
     *
     * @returns {{loadAll: Function}}
     * @constructor
     */
    function SvcService($http) {
        var baseUrl = '/services';

        // Promise-based API
        return {
            loadAllServices: function () {
                return $http.get(baseUrl + '/');
            },
            update: function (service) {
                return $http.put(baseUrl + '/' + service.name, service);
            },
            getDetails: function (service) {
                return $http.get(baseUrl + '/' + service.name);
            }
        };
    }

})();
