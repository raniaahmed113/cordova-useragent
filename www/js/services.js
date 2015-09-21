if (typeof String.prototype.startsWith != 'function') {
    String.prototype.startsWith = function(str) {
        return this.slice(0, str.length) == str;
    };
}

angular.module('hotvibes.services', ['ionic', 'hotvibes.config'])

    .service('Api', function($injector) {
        var $_http;

        /**
         * @returns {$http}
         */
        this.request = function() {
            if (!$_http) {
                $_http = $injector.get('$http');
            }

            return $_http;
        };

        /**
         * @param filter
         * @param prefix
         * @returns {object}
         */
        this.formatFilter = function(filter, prefix) {
            var output = {},
                self = this;

            if (prefix === undefined) {
                prefix = '';
            }

            angular.forEach(filter, function(value, key) {
                if (angular.isFunction(value)) {
                    return;
                }

                if (prefix.length > 0) {
                    key = key[0].toUpperCase() + key.substr(1);
                }

                if (angular.isArray(value)) {
                    output[prefix + key] = value.join(',');

                } else if (angular.isObject(value)) {
                    angular.extend(output, self.formatFilter(value, prefix + key));

                } else {
                    output[prefix + key] = value;
                }
            });

            return output;
        }
    })

    .service('AuthService', function($q, $window, $rootScope, Config, Api) {
        var currentUser;

        this.loadData = function() {
            var userData = localStorage['currentUser'];
            currentUser = userData ? JSON.parse(userData) : null;
        };

        /**
         * @returns {string}
         */
        this.getAccessToken = function() {
            return currentUser ? currentUser.accessToken : null;
        };

        /**
         * @returns {object}
         */
        this.getCurrentUser = function() {
            return currentUser;
        };

        /**
         * @returns {boolean}
         */
        this.isUserLoggedIn = function() {
            return currentUser != null;
        };

        this.doLogin = function(args) {
            Api.request().post(Config.API_URL_BASE + 'auth/login', {
                    username: args['username'],
                    password: args['password'],
                    grant_type: 'password',
                    client_id: Config.API_CLIENT_ID,
                    client_secret: ''
                })
                .success(function(response, status, headers, config) {
                    currentUser = response['user'];
                    currentUser.accessToken = response['access_token'];

                    localStorage['currentUser'] = JSON.stringify(currentUser);

                    if (args['onLoggedIn'] && typeof(args['onLoggedIn']) == 'function') {
                        args['onLoggedIn'](response, status, headers, config);
                    }
                })
                .error(function(response, status, headers, config) {
                    if (args['onError'] && typeof(args['onError']) == 'function') {
                        args['onError'](response, status, headers, config);
                    }
                });
        };

        this.doLogout = function() {
            currentUser = null;
            localStorage.removeItem('currentUser');
            $rootScope.$broadcast('loggedOut');
        };
    })

    .service('HttpInterceptor', function($rootScope, $window, $q, AuthService, Config) {
        this.request = function(config) {
            if (AuthService.isUserLoggedIn() && config.url.startsWith(Config.API_URL_BASE)) {
                config.headers.Authorization = 'Bearer ' + AuthService.getAccessToken();

                if (!config.headers.DPR) {
                    config.headers.DPR = $window.devicePixelRatio;
                    config.headers['Viewport-Width'] = $window.innerWidth;
                }
            }

            return config;
        };

        this.responseError = function(response) {
            if (response.status === 401 /* Unauthorized */) {
                $rootScope.$broadcast('authTokenExpired');
            }

            return $q.reject(response);
        };
    })

    .service('UserList', function($rootScope, $ionicScrollDelegate, Api) {
        this.load = function(Resource, $scope, params, transformResponse) {
            $scope.currPage = 0;
            $scope.users = [];
            $scope.users.moreAvailable = true;

            var loadUsers = function() {
                var queryParams = { page: $scope.currPage };

                if (params) {
                    queryParams = angular.extend(queryParams, params);
                }

                if ($scope.filter) {
                    queryParams = angular.extend(queryParams, Api.formatFilter($scope.filter));
                }

                Resource.query(queryParams, function(response) {
                    var users = response.resource;

                    if (angular.isFunction(transformResponse)) {
                        users = transformResponse(users);
                    }

                    $scope.users = $scope.currPage == 1 ? users : $scope.users.concat(users);
                    $scope.users.moreAvailable = response.resource.moreAvailable;
                    $scope.$broadcast('scroll.infiniteScrollComplete');
                });
            };

            $rootScope.$on('users.filterChanged', function(event, filter) {
                $ionicScrollDelegate.scrollTop(true);
                $scope.filter = filter;
                $scope.currPage = 1;
                loadUsers();
            });

            $scope.loadMore = function() {
                $scope.currPage += 1;
                loadUsers();
            };
        }
    });