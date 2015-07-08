angular.module('hotvibes.services', ['ionic'])

    .constant('AuthConfig', {
        CLIENT_ID_MOBILE_APP: 1
    })

    .service('authService', function($q, $http, AuthConfig) {
        this.isUserLoggedIn = function() {
            return false;
        };

        this.doLogin = function(credentialPair) {
            params = credentialPair;
            params['grant_type'] = 'password';
            params['client_id'] = AuthConfig.CLIENT_ID_MOBILE_APP;
            params['client_secret'] = '';

            $http
                .post('/api/auth/login', params)
                .success(function(response, status, headers, config) {
                    console.log('Success!', response);

                    // TODO: broadcast event
                })
                .error(function(response, status, headers, config) {
                    console.log('Failed..', response);
                });
        };

        this.doLogout = function() {
            // TODO: invalidate token on api, broadcast logout event
        };

        this.onLogout = function() {
            // TODO: delete token from local storage
        };
    });