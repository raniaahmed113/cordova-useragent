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
    })

    .service('AuthService', function($q, $window, $rootScope, $injector, Config, Api) {
        var currentUser = null;

        this.init = function() {
            var userData = localStorage['currentUser'];
            if (userData && userData != 'null') {
                currentUser = $injector.get('User').valueOf(JSON.parse(userData));
            }
        };

        /**
         * @returns {User}
         */
        this.getCurrentUser = function() {
            return currentUser;
        };

        /**
         * @param {User} user
         */
        this.setCurrentUser = function(user) {
            if (user == null) {
                localStorage.removeItem('currentUser');

            } else {
                if (user.filter) {
                    if ('id' in user.filter) {
                        delete user.filter.id;
                    }

                    var properties = [
                        'ageMin', 'ageMax', 'aroundMe', 'realMembers',
                        'withFacebook', 'withFotos', 'cityId', 'cityName', 'newMembers'
                    ];
                    for (var i in properties) {
                        if (user.filter.hasOwnProperty(properties[i]) && !user.filter[properties[i]]) {
                            delete user.filter[properties[i]];
                        }
                    }
                }

                localStorage['currentUser'] = JSON.stringify(user);
            }

            currentUser = user;
        };

        /**
         * @returns {boolean}
         */
        this.isUserLoggedIn = function() {
            return currentUser != null;
        };

        this.doLogin = function(args) {
            var self = this;

            Api.request().post(Config.API_URL_BASE + 'auth/login', {
                    username: args['username'],
                    password: args['password'],
                    grant_type: 'password',
                    client_id: Config.API_CLIENT_ID,
                    client_secret: ''
                })
                .success(function(response, status, headers, config) {
                    var user = $injector.get('User').valueOf(response['user']);
                    user.accessToken = response['access_token'];
                    self.setCurrentUser(user);

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
    })

    .service('HttpInterceptor', function($rootScope, $window, $q, AuthService, Config, ErrorCode) {
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
                        case ErrorCode.NOT_ENOUGH_CREDITS:
                            $rootScope.$broadcast('notEnoughCredits');
                            break;

                        case ErrorCode.VIP_REQUIRED:
                            $rootScope.$broadcast('vipRequired');
                            break;
                    }

                    break;
            }

            return $q.reject(response);
        };
    });