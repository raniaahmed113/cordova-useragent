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
        var currentUser = null,
            accToken = null;

        this.init = function() {
            accToken = localStorage['accToken'];

            var userData = localStorage['currentUser'];
            if (userData) {
                try {
                    currentUser = $injector.get('User').valueOf(JSON.parse(userData));

                } catch (e) {
                    localStorage['currentUser'] = null;
                }
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
                localStorage.removeItem('accToken');
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

        this.getAccessToken = function() {
            return accToken;
        };

        function setAccessToken(token) {
            if (!token) {
                return;
            }

            accToken = token;
            localStorage['accToken'] = token;
        };

        /**
         * @returns {boolean}
         */
        this.isUserLoggedIn = function() {
            return currentUser != null;
        };

        this.doLogin = function(username, password) {
            var self = this,
                deferred = $q.defer(),
                User = $injector.get('User');

            Api.request().post(Config.API_URL_BASE + 'auth/login', {
                    username: username,
                    password: password,
                    grant_type: 'password',
                    client_id: Config.API_CLIENT_ID,
                    client_secret: ''
                })
                .success(function(response, status, headers, config) {
                    // Login successful
                    setAccessToken(response['access_token']);

                    // Now let's retrieve info about the current user
                    User.get({
                        id: response['user_id'],
                        include: 'profilePhoto.url(size=w50h50)'

                    }).$promise.then(
                        function(userData) {
                            try {
                                var user = User.valueOf(userData);

                            } catch (e) {
                                deferred.reject();
                                return;
                            }

                            self.setCurrentUser(user);
                            deferred.resolve(user);
                        },
                        deferred.reject
                    );
                })
                .error(deferred.reject);

            return deferred.promise;
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
                config.headers['Accept-Language'] = $translate.use();

                var accToken = AuthService.getAccessToken();

                if (accToken != null) {
                    config.headers['Authorization'] = 'Bearer ' + accToken;

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