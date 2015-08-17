(function () {
    'use strict';

    angular.module('app.services')
        .service('favoriteService', ['$q', FavoriteService]);

    /**
     * Services DataService
     * Uses embedded, hard-coded data model; acts asynchronously to simulate
     * remote data service call(s).
     *
     * @returns {{loadAll: Function}}
     * @constructor
     */
    function FavoriteService($q) {
        var favorites = [{
            "name": "AMD External Events Utility",
        }, {
            "name": "AppHostSvc",
        }];

        // Promise-based API
        return {
            loadAll: function () {
                // Simulate async nature of real remote calls
                return $q.when(favorites);
            },
            add: function (service) {
                favorites.push(service);
                return $q.when(service);
            },
            delete: function (service) {
                favorites.push(service);
                return $q.when(service);
            }
        };
    }

})();
