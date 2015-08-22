angular.module('hotvibes', ['ionic', 'hotvibes.controllers', 'hotvibes.services', 'ion-autocomplete'])

    .config(function($stateProvider, $urlRouterProvider, $httpProvider, $resourceProvider, $cacheFactoryProvider) {
        // Setup default URL
        $urlRouterProvider.otherwise('/users');

        // Add HTTP interceptor so we could read/write headers on each request
        $httpProvider.interceptors.push('HttpInterceptor');

        var cache = $cacheFactoryProvider.$get()('resourceCache', { capacity: 100 });

        $resourceProvider.defaults.actions.get.cache = cache;
        $resourceProvider.defaults.actions.query.interceptor = {
            response: function(response) {
                response.resource.moreAvailable = (response.headers('X-Limit-MoreAvailable') ? true : false);

                angular.forEach(response.resource, function(object) {
                    if (!object.id) {
                        return;
                    }

                    //object = [200, JSON.stringify(object), response.headers(), 'OK'];
                    cache.put(response.config.url + '/' + object.id, object);
                });

                return response;
            }
        };

        $stateProvider
            .state('login', {
                url: "/login",
                templateUrl: "templates/login.html",
                controller: 'LoginCtrl',
                onEnter: function($state, AuthService) {
                    if (AuthService.isUserLoggedIn()) {
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
                onEnter: function($state, AuthService) {
                    if (!AuthService.isUserLoggedIn()) {
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
                    },
                    rightMenu: {
                        templateUrl: "templates/users-filter.html",
                        controller: 'UsersFilterCtrl'
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

            .state('inside.guests', {
                url: "/guests",
                views: {
                    'menuContent': {
                        templateUrl: "templates/users.html",
                        controller: 'GuestsCtrl'
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
    })

    .run(function($ionicPlatform) {
        $ionicPlatform.ready(function() {
            // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard for form inputs)
            if (window.cordova && window.cordova.plugins.Keyboard) {
                cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
            }

            if (window.StatusBar) {
                // org.apache.cordova.statusbar required
                StatusBar.styleDefault();
            }
        });
    })

    .filter('capitalizeFirst', function () {
        return function(input) {
            return input[0].toUpperCase() + input.substring(1);
        }
    });