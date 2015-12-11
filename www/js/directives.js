angular.module('hotvibes.directives', [])

    .directive('imgonload', function() {
        return {
            restrict: 'A',
            link: function(scope, element, attrs) {
                element.bind('load', function() {
                    scope.$apply(attrs['imgonload']);
                });
            }
        };
    })

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
            controller: function($scope, $resource, $q, ErrorCode) {
                var onError = function(response) {
                    $scope.error = true;

                    if (response.data && response.data.code) {
                        switch (response.data.code) {
                            case ErrorCode.VIP_REQUIRED:
                                $scope.error = {
                                    icon: 'ion-star',
                                    message: 'Only for VIP members'
                                };
                                break;
                        }
                    }
                };

                $scope.$watch('list', function() {
                    $scope.error = false;
                    $scope.currPage = 1;

                    if (!$scope.promise) {
                        $scope.promise = $scope.list.$promise;
                    }

                    var deferred = $q.defer();
                    $scope.promise.then(
                        function(response) {
                            if ($scope.subProperty) {
                                var Resource = $resource(response.config.url + '/:id', { id: '@id'});

                                for (var i=0; i<response.resource.length; i++) {
                                    response.resource[i] = new Resource(response.resource[i][$scope.subProperty]);
                                }
                            }

                            deferred.resolve(response);
                        },
                        function(error) {
                            deferred.reject(error);
                            onError(error);
                        }
                    );

                    $scope.promise = deferred.promise;
                });

                var fetch = function() {
                    var config = $scope.list.$promise.$$state.value.config;
                    config.params.page = $scope.currPage;

                    $resource(config.url).query(
                        config.params,

                        function(response) {
                            var lastIndex = $scope.currPage == 1 ? 0 : $scope.list.length;

                            // Append/overwrite rows
                            for (var i=0; i<response.resource.length; i++) {
                                $scope.list[lastIndex + i] = $scope.subProperty ? response.resource[i][$scope.subProperty] : response.resource[i];
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