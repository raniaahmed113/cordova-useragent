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

                case ErrorCode.PHOTO_IS_REQUIRED_HERE:
                    return __("Please first upload your profile photo");

                case ErrorCode.MEMBER_HAS_BLOCKED_YOU:
                    return __("You are blocked by this member");

                case ErrorCode.MUST_WAIT_FOR_REPLY:
                    return __("You can't send a file unless a member replyed to your message.");

                case ErrorCode.ALREADY_DID_THAT:
                    return __("Already invited"); // FIXME: this shouldn't be done globally

                case ErrorCode.CANT_PERFORM_ACTION_ON_SELF:
                    return __("Fatal error. You cannot do this :(");

                case ErrorCode.TEXT_TOO_SHORT:
                    return __("Please enter some text first.");

                case ErrorCode.IMAGE_SIZE_INVALID:
                    return __('Incorrenct image dimensions');

                case ErrorCode.EMAIL_ALREADY_TAKEN:
                    return __('Tokiu emailu vartotojas jau egzistuoja');

                case ErrorCode.USERNAME_ALREADY_TAKEN:
                    return __('User with such login already exists.');

                case ErrorCode.INAPPROPRIATE_CONTENT:
                    return __('Your message was not sent because it contains inappropriate language or spam');

                case ErrorCode.PERFORMING_ACTIONS_TOO_FAST:
                    return __('You are performing actions too fast. Please wait a little and try again.');

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

                } else if (angular.isObject(value)) {
                    var transformed = [];

                    angular.forEach(value, function(propertyVal, propertyName) {
                        if (propertyVal !== true) {
                            return;
                        }

                        transformed.push(propertyName);
                    });

                    value = transformed.join(',');
                }

                output[key] = value;
            });

            return output;
        };
    })

    .service('PushNotificationHandler', function($rootScope, $state, AuthService) {

        var push = null,
            deviceId = null,
            token = null;

        function onDeviceRegistered(data) {
            if (data.registrationId == token) {
                return;
            }

            token = data.registrationId;
            localStorage['deviceToken'] = token;

            if (deviceId) {
                AuthService.getCurrentUser().unregisterDevice(deviceId);
            }

            AuthService.getCurrentUser().registerDevice(token).then(function(device) {
                deviceId = device.id;
                localStorage['deviceId'] = deviceId;
            });
        }

        function onReceivedNotification(notification) {
            $rootScope.$apply(function() {
                $rootScope.$broadcast(
                    notification.additionalData._type,
                    notification.additionalData.payload
                );
            });

            // iOS gives us 30 seconds to handle our background notification
            // Let's notify the system that we have finished and our app process could be killed now
            push.finish();
        }

        function onClickedNotification(notification) {
            switch (notification.additionalData._type) {
                case 'newMessage.received':
                    $state.go('inside.conversations-single', { id: notification.additionalData.payload.conversationId });
                    break;
            }
        }

        this.init = function() {
            token = localStorage['deviceToken'];
            deviceId = localStorage['deviceId'];

            push = PushNotification.init({
                android: {
                    senderID: "957136533015" // FIXME: move to config
                }/*,
                 ios: {
                 alert: true,
                 badge: true,
                 sound: true,
                 categories: {
                 newMessage: {
                 yes: {
                 title: __('Reply'), callback: 'message.reply', destructive: false, foreground: false
                 },
                 no: {
                 title: __('Mark as read'), callback: 'message.markAsRead', destructive: false, foreground: false
                 }
                 }
                 }
                 },
                 windows: {}*/
            });

            push.on('registration', onDeviceRegistered);
            push.on('notification', function(notification) {
                if (!notification.additionalData || !notification.additionalData._type) {
                    // Malformed notification received. Ignore it
                    return;
                }

                if (notification.additionalData._deviceId != deviceId) {
                    unregister(notification.additionalData._deviceId);
                    return;
                }

                // If 'notification.additionalData.coldstart' property is present (not undefined)..
                // ..it means, that we got this event because user has clicked on the notification..
                // ..so we need to handle this differently..
                if (typeof notification.additionalData.coldstart !== 'undefined') {
                    onClickedNotification(notification);
                    return;
                }

                onReceivedNotification(notification);
            });
            /*push.on('error', function(e) {
             // e.message
             });*/
        };

        this.getToken = function() {
            return token;
        };

        this.unregister = function(deviceToBeUnregisteredId) {
            if (!deviceToBeUnregisteredId) {
                if (!deviceId) {
                    return;
                }

                deviceToBeUnregisteredId = deviceId;
            }

            AuthService.getCurrentUser().unregisterDevice(deviceToBeUnregisteredId);

            if (deviceToBeUnregisteredId == deviceId) {
                token = null;
                deviceId = null;

                localStorage.removeItem('deviceId');
                localStorage.removeItem('deviceToken');

                push.unregister();
            }
        };
    })

    .service('AuthService', function($q, $window, $rootScope, $filter, $injector, Config, Api) {
        var currentUser = null,
            accToken = null,
            self = this;

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
                        'withFacebook', 'withFotos', 'cityId', 'city', 'newMembers'
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
        }

        /**
         * @returns {boolean}
         */
        this.isUserLoggedIn = function() {
            return currentUser != null;
        };

        /**
         * @param {string} authMethod
         * @param {object} loginParams
         *
         * @returns {Promise}
         */
        function login(authMethod, loginParams) {
            var deferred = $q.defer(),
                User = $injector.get('User');

            loginParams.clientId = Config.API_CLIENT_ID;

            Api.request().post(Config.API_URL_BASE + 'auth/' + authMethod, loginParams)
                .success(function(response) {
                    // Login successful
                    setAccessToken(response['access_token']);

                    // Now let's retrieve info about the current user
                    User.getInstanceForStorage(response['user_id']).then(
                        function(user) {
                            try {
                                self.setCurrentUser(user);
                                deferred.resolve(user);

                            } catch(e) {
                                //console.error(e);
                                deferred.reject(e);
                            }
                        },
                        deferred.reject
                    );
                })
                .error(deferred.reject);

            return deferred.promise;
        }

        /**
         * @param {string} username
         * @param {string} password
         *
         * @returns {Promise}
         */
        this.loginWithCredentials = function(username, password) {
            return login('login', {
                username: username,
                password: password
            });
        };

        /**
         *
         * @param {string} accessToken
         * @param {Date|string} birthday
         * @param {string} email
         *
         * @returns {Promise}
         */
        this.loginWithFb = function(accessToken, birthday, email) {
            var params = {
                accessToken: accessToken
            };

            if (birthday) {
                if (birthday instanceof Date) {
                    birthday = $filter('date')(birthday, 'yyyy-MM-dd');
                }

                params.birthday = birthday;
            }

            if (email) {
                params.email = email;
            }

            return login('fb', params);
        };

        /**
         * @param {string} phoneNumber
         *
         * @returns {HttpPromise}
         */
        this.sendConfirmationCode = function(phoneNumber) {
            return Api.request().post(Config.API_URL_BASE + 'auth/phoneNumber', {
                clientId: Config.API_CLIENT_ID,
                number: phoneNumber
            })
        };

        /**
         * @param {string} phoneNumber
         * @param {number} code
         *
         * @returns {Promise}
         */
        this.loginWithSmsCode = function(phoneNumber, code) {
            return login('smsCode', {
                code: code,
                phoneNumber: phoneNumber
            });
        };

        /**
         *
         * @param data
         * @returns {HttpPromise}
         */
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