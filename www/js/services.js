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

    .service('AuthService', function($q, $window, $rootScope, $injector, Config, Api) {
        var currentUser = null;

        this.init = function() {
            var userData = localStorage['currentUser'];
            if (userData) {
                currentUser = $injector.get('User').loadFromJson(userData);
            }
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
                    currentUser = $injector.get('User').valueOf(response['user']);
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

    .service('HttpInterceptor', function($rootScope, $window, $q, AuthService, Config, Error) {
        this.request = function(config) {
            if (config.url.startsWith(Config.API_URL_BASE)) {
                var currentUser = AuthService.getCurrentUser();

                if (currentUser != null) {
                    config.headers.Authorization = 'Bearer ' + currentUser.accessToken;

                    if (!config.headers.DPR) {
                        config.headers.DPR = $window.devicePixelRatio;
                        config.headers['Viewport-Width'] = $window.innerWidth;
                    }
                }
            }

            return config;
        };

        this.responseError = function(response) {
            switch (response.status) {
                case 401: // Unauthorized
                    $rootScope.$broadcast('authTokenExpired');
                    break;

                case 402: // Payment Required
                    switch (response.data.code) {
                        case Error.NOT_ENOUGH_CREDITS:
                            $rootScope.$broadcast('notEnoughCredits');
                            break;

                        case Error.VIP_REQUIRED:
                            $rootScope.$broadcast('vipRequired');
                            break;
                    }

                    break;
            }

            return $q.reject(response);
        };
    });