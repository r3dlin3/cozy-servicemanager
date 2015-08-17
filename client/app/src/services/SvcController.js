(function () {

    angular
        .module('app.services')
        .controller('svcController', [
            'svcService', 'favoriteService', '$log', '$scope', '$mdToast',

            SvcController
        ]);

    function SvcController(svcService, favoriteService, $log, $scope, $mdToast) {
        //////////////////
        // Initialization
        //////////////////
        // Load all services
        svcService
            .loadAllServices()
            .then(function (payload) {
                var services = payload.data;
                $scope.services = [].concat(services);
            })
            .then(function () {
                async.eachLimit($scope.services, 10, function iterator(item, callback) {
                    $log.debug('Getting details for', item.name);
                    svcService.getDetails(item)
                        .then(function (payload) {
                            var updatedService = payload.data;
                            $log.debug('Got details for', updatedService.name);
                            for (var i = 0; i < $scope.services.length; i++) {
                                if ($scope.services[i].name === updatedService.name) {
                                    $log.debug('Updating scope for ', updatedService.name);
                                    //for (var k in updatedService)
                                    // $scope.services[i][k] = updatedService[k];
                                    $scope.services[i] = updatedService;
                                    callback(null);
                                    return;
                                }
                            }
                            $log.warn(item.name, 'was not found');

                        }, function (errorReason) {
                            $log.error('Could not get details:', errorReason);
                            callback(errorReason);
                        });

                })
            });

        $scope.toggle = function (service) {
            if (service.status != undefined) {

                svcService
                    .update(service)
                    .then(function () {
                        $mdToast.show(
                            $mdToast.simple()
                                .content('The service ' + (service.displayName || service.name)
                                + ' is now ' + service.status)
                                .hideDelay(3000)
                        );
                    }, function (errorReason) {
                        $log.error('Could not update the service:', errorReason);
                        $mdToast.show(
                            $mdToast.simple()
                                .content('Could not update the service ' + (service.displayName || service.name))
                                .theme('error-toast')
                                .hideDelay(3000)
                        );
                        //restore the service
                        if (service.status === 'started') {
                            service.status = 'stopped';
                        } else if (service.status === 'stopped') {
                            service.status = 'started';
                        }
                    });

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
                                .content('The service ' + (service.displayName || service.name) +' is deleted from favorites')
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
                                .content('The service ' + (service.displayName || service.name) +' is added to favorites')
                                .hideDelay(3000)
                        );
                    });
            }


        }
    }
})
();