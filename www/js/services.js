angular.module('hotvibes.services', ['ionic', 'hotvibes.config'])

    .service('Api', function($injector, ErrorCode, __) {
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

        this.translateErrorCode = function(code) {
            switch (code) {
                case ErrorCode.INVALID_CREDENTIALS:
                    return __("Invalid username or password");

                case ErrorCode.NOT_ENOUGH_CREDITS:
                    return __("Sorry, you dont have enough x");

                case ErrorCode.VIP_REQUIRED:
                    return __("Available only for VIP members");

                case ErrorCode.MEMBER_HAS_BLOCKED_YOU:
                    return __("You are blocked by this member");

                case ErrorCode.MUST_WAIT_FOR_REPLY:
                    return __("You can't send a file unless a member replyed to your message.");

                case ErrorCode.INVITE_ALREADY_SENT:
                    return __("Already invited");

                case ErrorCode.CANT_PERFORM_ACTION_ON_SELF:
                    return __("Fatal error. You cannot do this :(");

                case ErrorCode.TEXT_TOO_SHORT:
                    return __("Please enter some text first.");

                default:
                    // TODO: log to analytics: unknown err code
                    return __("We're sorry, but something went wrong. Please try again later.");
            }
        };

        this.formatFilter = function(filter) {
            var output = {};

            angular.forEach(filter, function(value, key) {
                if (key == 'type' || key == '$resolved') {
                    return;
                }

                if (typeof value === 'boolean') {
                    if (!value) {
                        return;
                    }

                    value = 1;

                } else if (angular.isArray(value)) {
                    value = value.join(',');
                }

                output[key] = value;
            });

            return output;
        };
    })

    .service('PushNotificationHandler', function($rootScope, $state) {

        this.handle = function(notification) {
            if (!notification._payload || !notification._payload._type) {
                // Malformed notification received - do nothing
                return;
            }

            if (notification.app.asleep) {
                // If we receive this as a result of user clicking on the notification while the app is in the background..
                // .. redirect to a relevant page

                switch (notification._payload._type) {
                    case 'newMessage':
                        $state.go('inside.conversations-single', { id: notification._payload.conversationId });
                        break;
                }
            }/* else {
                console.log($state);

                $ionicLoading.show({
                    template: notification.text,
                    noBackdrop: true,
                    duration: 1000
                });
            }*/

            $rootScope.$broadcast(notification._payload._type, notification._payload);
        };
    })

    .service('AuthService', function($q, $window, $rootScope, $filter, $injector, $ionicUser, Config, Api) {
        var currentUser = null;

        this.init = function() {
            var userData = localStorage['currentUser'];
            if (userData && userData[0] == '{') {
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
                    var user = $injector.get('User').valueOf(response.user);
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

        this.submitRegistration = function(data) {
            // Do a copy so we don't modify binded values
            var params = angular.copy(data);

            if (params.birthday instanceof Date) {
                params.birthday = $filter('date')(params.birthday, 'yyyy-MM-dd');
            }

            return Api.request().post(Config.API_URL_BASE + 'auth/register', params);
        };
    })

    .service('HttpInterceptor', function($rootScope, $window, $q, $translate, AuthService, Config) {
        this.request = function(config) {
            if (config.url.startsWith(Config.API_URL_BASE)) {
                var currentUser = AuthService.getCurrentUser();

                config.headers['Accept-Language'] = $translate.use();

                if (currentUser != null) {
                    config.headers['Authorization'] = 'Bearer ' + currentUser.accessToken;

                    if (!config.headers['DPR']) {
                        config.headers['DPR'] = $window.devicePixelRatio;
                        config.headers['Viewport-Width'] = $window.innerWidth;
                    }
                }

                if (Config.XDEBUG) {
                    config.url = config.url + (config.url.indexOf('?') > -1 ? '&' : '?') + "XDEBUG_SESSION_START=PHPSTORM";
                }
            }

            return config;
        };

        this.responseError = function(response) {
            switch (response.status) {
                case 401: // Unauthorized
                    $rootScope.$broadcast('authTokenExpired');
                    break;
            }

            return $q.reject(response);
        };
    });