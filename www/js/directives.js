angular.module('hotvibes.directives', [])

    .directive('resourceCollection', function() {
        return {
            restrict: 'E',
            transclude: true,
            scope: {
                list: '='
            },
            templateUrl: 'templates/resource_collection.html',
            controller: function($scope, $resource) {
                $scope.error = false;
                $scope.currPage = 1;

                var config;
                var onError = function(error) {
                    console.error('error!', error); // FIXME
                    $scope.error = true;
                };

                $scope.list.$promise.then(function(response) {
                    config = response.config;

                }, function(response) {
                    onError(response.data);
                });

                var fetch = function() {
                    config.params.page = $scope.currPage;

                    $resource(config.url).query(
                        config.params,

                        function(response) {
                            var newEntries = response.resource;

                            /*if (angular.isFunction(transformResponse)) {
                                users = transformResponse(users);
                            }*/

                            if ($scope.currPage == 1) {
                                $scope.list = newEntries;

                            } else {
                                $scope.list = $scope.list.concat(newEntries);
                                $scope.list.$metadata = {
                                    moreAvailable: newEntries.$metadata.moreAvailable
                                };
                            }

                            $scope.$broadcast('scroll.infiniteScrollComplete');
                        },

                        function(error) {
                            onError(error);
                        }
                    );
                };

                $scope.loadMore = function() {
                    $scope.currPage++;
                    fetch();
                };
            }
        };
    });