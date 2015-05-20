angular.module('hotvibes.services', ['ionic'])

    .service('authService', function($q, $http) {
        this.isUserLoggedIn = function() {
            return false;
        };

        this.doLogin = function() {

        };

        this.doLogout = function() {

        };

        /*var LOCAL_TOKEN_KEY = 'yourTokenKey';
        var username = '';
        var isAuthenticated = false;
        var authToken;

        function loadUserCredentials() {
            var token = window.localStorage.getItem(LOCAL_TOKEN_KEY);
            if (token) {
                useCredentials(token);
            }
        }

        function storeUserCredentials(token) {
            window.localStorage.setItem(LOCAL_TOKEN_KEY, token);
            useCredentials(token);
        }

        function useCredentials(token) {
            username = token.split('.')[0];
            isAuthenticated = true;
            authToken = token;

            // Set the token as header for your requests!
            $http.defaults.headers.common['Authorization'] = 'Bearer ' + token;
        }

        function destroyUserCredentials() {
            authToken = undefined;
            username = '';
            isAuthenticated = false;
            delete $http.defaults.headers.common['Authorization'];
            window.localStorage.removeItem(LOCAL_TOKEN_KEY);
        }

        var login = function (name, pw) {
            return $q(function (resolve, reject) {
                if ((name == 'admin' && pw == '1') || (name == 'user' && pw == '1')) {
                    // Make a request and receive your auth token from your server
                    storeUserCredentials(name + '.yourServerToken');
                    resolve('Login success.');
                } else {
                    reject('Login Failed.');
                }
            });
        };

        var logout = function() {
            destroyUserCredentials();
        };

        var isAuthorized = function(authorizedRoles) {
            if (!angular.isArray(authorizedRoles)) {
                authorizedRoles = [authorizedRoles];
            }

            return (isAuthenticated && authorizedRoles.indexOf(role) !== -1);
        };

        loadUserCredentials();

        return {
            login: login,
            logout: logout,
            isAuthorized: isAuthorized,
            isAuthenticated: function () {
                return isAuthenticated;
            },
            username: function () {
                return username;
            }
        };*/
    });