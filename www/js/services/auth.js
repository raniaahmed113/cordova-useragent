angular.module('hotvibes.services')

    .service('AuthService', function($q, $window, $rootScope, $filter, $injector, $cordovaFacebook, Config, Api) {
        var currentUser = null,
            accToken = null,
            AuthService = this;

        this.ERROR_LOGIN_CANCELLED = 4201;

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
                                AuthService.setCurrentUser(user);
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
         * @param {Date|string} birthday
         * @param {string} email
         *
         * @returns {Promise}
         */
        this.loginWithFb = function(birthday, email) {
            return $cordovaFacebook.login([ 'email', 'user_birthday', 'user_location' ])
                .then(function(response) {
                    if (response.status != 'connected') {
                        return $q.reject(response.status);
                    }

                    var params = {
                        accessToken: response.authResponse.accessToken
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
                });
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
            }).then(function () {
                return phoneNumber;
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
    });
