(function () {

    angular
        .module('app.services')
        .controller('svcController', [
            'svcService','favoriteService', '$log', '$q', '$scope', '$mdToast',

            SvcController
        ]);

    function SvcController(svcService,favoriteService, $log, $q, $scope, $mdToast) {
        //////////////////
        // Initialization
        //////////////////
        // Load all services
        svcService
            .loadAllServices()
            .then(function (payload) {
                var services = payload.data;
                services.forEach(function (service) {
                    if (service.status === 'started') {
                        service.isStarted = true;
                    } else {
                        service.isStarted = false;
                    }
                });
                $scope.services = [].concat(services);
            })
            .then(function () {
                async.eachLimit($scope.services, 10,function iterator(item, callback){
                    $log.debug('Getting details for ', item.name);
                    svcService.getDetails(item)
                        .then(function (payload) {
                            var updatedService = payload.data;
                            $log.debug('Got details for ', updatedService.name);
                            for (var i = 0; i < $scope.services.length; i++) {
                                if ($scope.services[i].name === updatedService.name) {

                                    $scope.services[i] = updatedService;
                                    callback(null);
                                    return;
                                }
                            }
                            $log.warn(item.name, 'was not found');

                        }, function(errorReason){
                            $log.error('Could not get details:', errorReason);
                            callback(errorReason);
                        })

                })
            });

        $scope.toggle = function (service) {
            if (service.status != undefined) {
                if (service.status === 'started') {
                    service.status = 'stopped';
                } else if (service.status === 'stopped') {
                    service.status = 'started';
                }
                svcService
                    .update(service)
                    .then(function () {
                        $mdToast.show(
                            $mdToast.simple()
                                .content('Service is now ' + service.status)
                                .hideDelay(3000)
                        );
                    })

            }
        }
        $scope.toggleFavorite = function (service) {
            if (service.isFavorite === true) {
                service.isFavorite = false;
                favoriteService
                    .delete(service)
                    .then(function () {
                        $mdToast.show(
                            $mdToast.simple()
                                .content('Service is deleted from favorites')
                                .hideDelay(3000)
                        );
                    });
            } else {
                service.isFavorite = true;
                favoriteService
                    .add(service)
                    .then(function () {
                        $mdToast.show(
                            $mdToast.simple()
                                .content('Service is added to favorites')
                                .hideDelay(3000)
                        );
                    });
            }


        }
    }
})
();