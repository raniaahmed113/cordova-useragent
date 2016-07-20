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

    .directive('castToInt', function() {
        return {
            restrict: 'A',
            require: 'ngModel',
            link: function(scope, element, attrs, ngModel) {
                ngModel.$parsers.push(function (value) {
                    return parseInt(value);
                });
            }
        };
    })

    .directive('fileUpload', function() {
        return {
            restrict: 'AE',
            scope: {
                onFileChosen: '='
            },
            link: function(scope, element, attr) {
                var el = angular.element(element),
                    fileInput = angular.element('<input type="file" />');

                el.append(fileInput);
                
                el.on('click', function() {
                    setTimeout(function() {
                        ionic.trigger('click', { target: fileInput[0] });
                    }, 50);
                });

                fileInput.on('change', function () {
                    if (!fileInput[0].files || fileInput[0].files.length < 1) {
                        return;
                    }

                    scope.onFileChosen(fileInput[0].files[0]);

                    // Let's change the value of file input to null
                    // Otherwise the onChange event wouldn't trigger if we tried uploading the same photo again.
                    // For example, the user would do that if the first attempt failed because of some connectivity error
                    fileInput[0].value = null;
                });

                if ('accept' in attr) {
                    attr.$observe('accept', function uploadButtonAcceptObserve(value) {
                        fileInput.attr('accept', value);
                    });
                }
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
                list: '=list',
                promise: '=?promise',
                subProperty: '=?subProperty',
                onError: '=?onError'
            },
            templateUrl: 'templates/resource_collection.html',
            controller: function($q, $scope, $state, $resource, $ionicNavBarDelegate, __) {
                function onError(response) {
                    $scope.list.$metadata = {};

                    if (!response.data) {
                        response.data = { code: -1 };

                    } else if (!response.data.code) {
                        response.data.code = -1;
                    }

                    var error;
                    if (angular.isFunction($scope.onError) && (error = $scope.onError(response))) {
                        $scope.error = error;

                    } else {
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
                    fetch().finally(function() {
                        $scope.$broadcast('scroll.infiniteScrollComplete');
                    });
                };

                $scope.reload = function() {
                    fetch().finally(function() {
                        $scope.$broadcast('scroll.refreshComplete');
                    });
                };
            }
        };
    });