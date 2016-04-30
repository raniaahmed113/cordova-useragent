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

    .directive('parseUrls', function() {
        return {
            restrict: 'A',
            link: function($scope, $element, $attrs) {
                angular.element($element).on('click', function(event) {
                    var target;

                    if (event.target instanceof HTMLAnchorElement) {
                        target = event.target;

                    } else if (event.currentTarget instanceof HTMLAnchorElement) {
                        target = event.currentTarget;
                    }

                    var href = target.getAttribute('href');
                    if (!href) {
                        return;
                    }

                    event.preventDefault();
                    window.open(encodeURI(href), '_system');
                });
            }
        }
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
            controller: function($q, $scope, $state, $resource, $ionicNavBarDelegate, __, ErrorCode) {
                function onError(response) {
                    if (!response.data) {
                        response.data = { code: -1 };

                    } else if (!response.data.code) {
                        response.data.code = -1;
                    }

                    switch (response.data.code) {
                        case ErrorCode.VIP_REQUIRED:
                            $scope.error = {
                                icon: 'ion-star',
                                message: __("Only for VIP members"),
                                actions: [
                                    {
                                        label: __("Become a VIP member"),
                                        class: 'button-positive',
                                        onClick: function() {
                                            $state.go('inside.settings-vip');
                                        }
                                    }
                                ]
                            };
                            break;

                        default:
                            $scope.error = {
                                icon: 'ion-close-circled',
                                message: __("Sorry, some nasty error prevented us from showing you this page"),
                                actions: [
                                    {
                                        label: __("Try again"),
                                        onClick: function() {
                                            $scope.error = null;
                                            $scope.promise = fetch();
                                        }
                                    }
                                ]
                            };
                            break;
                    }
                }

                $scope.$watch('list', function() {
                    var deferred = $q.defer();

                    $scope.list.$promise.then(
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

                    $scope.error = null;
                    $scope.currPage = 1;
                    $scope.promise = deferred.promise;
                });

                /**
                 * @returns {promise}
                 */
                function fetch() {
                    var config = $scope.list.$promise.$$state.value.config;

                    if (!config) {
                        // value.config may be undefined when value is instanceof Error
                        $state.reload().then(function() {
                            // On entering the view show the nav-bar
                            // Workaround for https://github.com/driftyco/ionic/issues/3852
                            $ionicNavBarDelegate.showBar(true);
                        });
                        return null;
                    }

                    if (!config.params) {
                        config.params = {};
                    }

                    config.params.page = $scope.currPage;

                    return $resource(config.url).query(
                        config.params,

                        function(response) {
                            var lastIndex = $scope.currPage == 1 ? 0 : $scope.list.length;

                            // Append/overwrite rows
                            for (var i=0; i<response.resource.length; i++) {
                                $scope.list[lastIndex + i] = $scope.subProperty
                                    ? response.resource[i][$scope.subProperty]
                                    : response.resource[i];
                            }

                            // Overwrite meta-data
                            $scope.list.$metadata = response.resource.$metadata;
                        },

                        onError

                    ).$promise;
                }

                $scope.loadMore = function() {
                    $scope.currPage++;
                    fetch().then(function() {
                        $scope.$broadcast('scroll.infiniteScrollComplete');
                    });
                };

                $scope.reload = function() {
                    fetch().then(function() {
                        $scope.$broadcast('scroll.refreshComplete');
                    });
                };
            }
        };
    });