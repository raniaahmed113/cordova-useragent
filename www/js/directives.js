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
                        var Resource = $resource(config.url + '/:id', { id: '@id'});

                        for (i=0; i<response.resource.length; i++) {
                            response.resource[i] = new Resource(response.resource[i][$scope.subProperty]);
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
                            var lastIndex = $scope.currPage == 1 ? 0 : $scope.list.length;

                            // Append/overwrite rows
                            for (var i=0; i<response.resource.length; i++) {
                                $scope.list[lastIndex + i] = response.resource[i];
                            }

                            // Overwrite meta-data
                            $scope.list.$metadata = response.resource.$metadata;

                            // Broadcast that our infinite-scroll load is now complete
                            $scope.$broadcast('scroll.infiniteScrollComplete');
                        },

                        onError
                    );
                };

                $scope.loadMore = function() {
                    $scope.currPage++;
                    fetch();
                };
            }
        };
    });