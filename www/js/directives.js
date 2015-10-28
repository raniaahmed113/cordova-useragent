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
            controller: function($scope, $resource, ErrorCode) {
                $scope.error = false;
                $scope.currPage = 1;

                var config;
                var onError = function(response) {
                    console.error('error!', response); // FIXME

                    switch (response.data.code) {
                        case ErrorCode.VIP_REQUIRED:
                            $scope.error = {
                                icon: 'ion-star',
                                message: 'Only for VIP members'
                            };
                            break;

                        default:
                            $scope.error = true;
                            break;
                    }
                };

                if (!$scope.promise) {
                    $scope.promise = $scope.list.$promise;
                }

                $scope.promise = $scope.promise.then(
                    function(response) {
                        config = response.config;

                        if ($scope.subProperty) {
                            var Resource = $resource(config.url + '/:id', { id: '@id'});

                            for (i=0; i<response.resource.length; i++) {
                                response.resource[i] = new Resource(response.resource[i][$scope.subProperty]);
                            }

                            return response;
                        }
                    },

                    onError
                );

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