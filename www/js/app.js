angular.module('hotvibes', ['ionic', 'hotvibes.controllers', 'hotvibes.services', 'ion-autocomplete', 'angularMoment'])

    .config(function($stateProvider, $urlRouterProvider, $httpProvider, $resourceProvider, $cacheFactoryProvider) {
        // Setup default URL
        $urlRouterProvider.otherwise('/users');

        // Add HTTP interceptor so we could read/write headers on each request
        $httpProvider.interceptors.push('HttpInterceptor');

        /*var cache = $cacheFactoryProvider.$get()('resourceCache', { capacity: 100 });

        $resourceProvider.defaults.actions.get.cache = cache;*/
        $resourceProvider.defaults.actions.query.interceptor = {
            response: function(response) {
                response.resource.moreAvailable = (response.headers('X-Limit-MoreAvailable') ? true : false);

                /*angular.forEach(response.resource, function(object) {
                    if (!object.id) {
                        return;
                    }

                    cache.put(response.config.url + '/' + object.id, object);
                });*/

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
                    main: {
                        templateUrl: "templates/users.html",
                        controller: 'UsersCtrl'
                    },
                    rightMenu: {
                        templateUrl: "templates/users-filter.html",
                        controller: 'UsersFilterCtrl'
                    }
                }
            })

            .state('inside.user', {
                url: "/users/:userId",
                views: {
                    main: {
                        templateUrl: "templates/user.html",
                        controller: 'UserCtrl'
                    },
                    'tabContent@inside.user': {
                        // Dirty hack to make nav bar work properly
                        templateUrl: "templates/user_index.html"
                    }
                }
            })

            .state('inside.user.photos', {
                url: "/photos",
                views: {
                    tabContent: {
                        templateUrl: "templates/user_photos.html",
                        controller: 'UserPhotosCtrl'
                    }
                }
            })

            .state('inside.user.about', {
                url: "/about",
                views: {
                    tabContent: {
                        templateUrl: "templates/user_about.html",
                        controller: 'UserAboutCtrl'
                    }
                }
            })

            .state('inside.user.actions', {
                url: "/actions",
                views: {
                    tabContent: {
                        templateUrl: "templates/user_actions.html",
                        controller: 'UserActionsCtrl'
                    }
                }
            })

            .state('inside.user.chat', {
                url: "/chat",
                views: {
                    tabContent: {
                        templateUrl: "templates/user_chat.html",
                        controller: 'UserChatCtrl'
                    }
                }
            })

            .state('inside.conversations', {
                url: "/conversations",
                views: {
                    main: {
                        templateUrl: "templates/conversations.html",
                        controller: 'ConversationsCtrl'
                    }
                }
            })

            .state('inside.conversations-single', {
                url: "/conversations/:id",
                views: {
                    main: {
                        templateUrl: "templates/conversation.html",
                        controller: 'ConversationCtrl'
                    }
                }
            })

            .state('inside.guests', {
                url: "/guests",
                views: {
                    main: {
                        templateUrl: "templates/users.html",
                        controller: 'GuestsCtrl'
                    }
                }
            })

            .state('inside.friends', {
                url: "/friends",
                views: {
                    main: {
                        templateUrl: "templates/users.html",
                        controller: 'FriendsCtrl'
                    }
                }
            })

            .state('inside.blockedUsers', {
                url: "/blocklist",
                views: {
                    main: {
                        templateUrl: "templates/users.html",
                        controller: 'BlockedUsersCtrl'
                    }
                }
            })

            .state('inside.settings', {
                url: "/settings",
                views: {
                    main: {
                        templateUrl: "templates/settings.html",
                        controller: 'SettingsCtrl'
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
    })

    .filter('profilePhotoUrl', function() {
        return function(photo, gender) {
            if (photo && photo.url) {
                return photo.url;
            }

            if (!gender || gender == 'male') {
                gender = 'generic';
            }

            return 'img/person-' + gender + '.png';
        }
    });