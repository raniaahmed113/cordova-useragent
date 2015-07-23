angular.module('hotvibes.services', ['ionic'])

    .constant('AuthConfig', {
        CLIENT_ID_MOBILE_APP: 1
    })

    .service('authService', function($q, $http, $window, AuthConfig) {
        var accessToken, currentUserId;

        this.getAccessToken = function() {
            if (accessToken == null) {
                accessToken = $window.sessionStorage['accToken'];
                currentUserId = $window.sessionStorage['userId'];
            }

            return accessToken;
        };

        /**
         * @returns {integer}
         */
        this.getCurrentUserId = function() {
            return currentUserId;
        };

        /**
         * @returns {boolean}
         */
        this.isUserLoggedIn = function() {
            return this.getAccessToken() != null;
        };

        this.doLogin = function(args) {
            $http
                .post('/api/auth/login', {
                    username: args['username'],
                    password: args['password'],
                    grant_type: 'password',
                    client_id: AuthConfig.CLIENT_ID_MOBILE_APP,
                    client_secret: ''
                })
                .success(function(response, status, headers, config) {
                    accessToken = $window.sessionStorage['accToken'] = response['access_token'];
                    currentUserId = $window.sessionStorage['userId'] = response['user_id'];

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
            $window.sessionStorage.removeItem('accToken');
            $window.sessionStorage.removeItem('userId');
            $http.get('/api/auth/logout');
        };
    });