angular.module('hotvibes.directives', [])

    .directive('resourceCollection', function() {
        return {
            restrict: 'E',
            transclude: true,
            scope: {
                list: '=',
                promise: '=',
                subProperty: '='
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

                if (!$scope.promise) {
                    $scope.promise = $scope.list.$promise;
                }

                $scope.promise = $scope.promise.then(function(response) {
                    config = response.config;

                    if ($scope.subProperty) {
                        for (i=0; i<response.resource.length; i++) {
                            response.resource[i] = response.resource[i][$scope.subProperty];
                        }

                        return response;
                    }

                }, function(response) {
                    onError(response.data);
                });

                var fetch = function() {
                    config.params.page = $scope.currPage;

                    $resource(config.url).query(
                        config.params,

                        function(response) {
                            var newEntries = response.resource;

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