angular.module('hotvibes', ['ionic', 'hotvibes.controllers', 'hotvibes.services'])

    .run(function($ionicPlatform, $http, authService) {
        if (authService.isUserLoggedIn()) {
            $http.defaults.headers.common['Authorization'] = 'Bearer ' + authService.getAccessToken();
        }

        $ionicPlatform.ready(function() {
            // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
            // for form inputs)
            if (window.cordova && window.cordova.plugins.Keyboard) {
                cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
            }

            if (window.StatusBar) {
                // org.apache.cordova.statusbar required
                StatusBar.styleDefault();
            }
        });
    })

    .config(function($stateProvider, $urlRouterProvider, $locationProvider) {
        // Use HTML5 history API
        $locationProvider.html5Mode(true);

        // Setup default URL
        $urlRouterProvider.otherwise('/users');

        $stateProvider
            .state('login', {
                url: "/login",
                templateUrl: "templates/login.html",
                controller: 'LoginCtrl',
                onEnter: function($state, authService) {
                    if (authService.isUserLoggedIn()) {
                        $state.go('inside.users');
                    }
                }
            })

            .state('register', {
                url: "/register",
                templateUrl: "templates/register.html",
                controller: 'RegisterCtrl'
            })

            .state('inside', {
                abstract: true,
                templateUrl: "templates/menu.html",
                controller: 'AppCtrl',
                onEnter: function($state, authService) {
                    if (!authService.isUserLoggedIn()) {
                        $state.go('login');
                    }
                }
            })

            .state('inside.users', {
                url: "/users",
                views: {
                    'menuContent': {
                        templateUrl: "templates/users.html",
                        controller: 'UsersCtrl'
                    }
                }
            })

            .state('inside.users-single', {
                url: "/users/:userId",
                views: {
                    'menuContent': {
                        templateUrl: "templates/user.html",
                        controller: 'UserCtrl'
                    }
                }
            })

            .state('inside.conversations', {
                url: "/conversations",
                views: {
                    'menuContent': {
                        templateUrl: "templates/conversations.html",
                        controller: 'ConversationsCtrl'
                    }
                }
            })

            .state('inside.conversations-single', {
                url: "/conversations/:id",
                views: {
                    'menuContent': {
                        templateUrl: "templates/conversation.html",
                        controller: 'ConversationCtrl'
                    }
                }
            });
    });