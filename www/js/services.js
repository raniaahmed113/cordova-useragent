angular.module('hotvibes.services', ['ionic', 'hotvibes.config'])

    .service('Api', function($injector) {
        var $_http;

        this.request = function() {
            if (!$_http) {
                $_http = $injector.get('$http');
            }

            return $_http;
        }
    })

    .service('AuthService', function($q, $window, $rootScope, Config, Api) {
        var accessToken,
            currentUserId;

        /**
         * @returns {string}
         */
        this.getAccessToken = function() {
            if (accessToken == null) {
                accessToken = localStorage['accToken'];
                currentUserId = localStorage['userId'];
            }

            return accessToken;
        };

        /**
         * @returns {int}
         */
        this.getCurrentUserId = function() {
            if (currentUserId == null) {
                currentUserId = localStorage['userId'];
                accessToken = localStorage['accToken'];
            }

            return currentUserId;
        };

        /**
         * @returns {boolean}
         */
        this.isUserLoggedIn = function() {
            return this.getAccessToken() != null;
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
                    accessToken = localStorage['accToken'] = response['access_token'];
                    currentUserId = localStorage['userId'] = response['user_id'];

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
            accessToken = currentUserId = null;
            localStorage.removeItem('accToken');
            localStorage.removeItem('userId');
            $rootScope.$broadcast('loggedOut');
        };
    })

    .service('HttpInterceptor', function($rootScope, $q, AuthService) {
        this.request = function(config) {
            if (AuthService.isUserLoggedIn()) {
                config.headers.Authorization = 'Bearer ' + AuthService.getAccessToken();
            }

            return config;
        };

        this.responseError = function(response) {
            if (response.status === 401 /* Unauthorized */) {
                $rootScope.$broadcast('authTokenExpired');
            }

            return $q.reject(response);
        };
    });