angular.module('hotvibes.routes', [])

    .config(function($stateProvider, $translateProvider, $urlRouterProvider) {
        // Setup default URL
        $urlRouterProvider.otherwise('/users');

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

            .state('inside', {
                abstract: true,
                cache: false,
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
                        templateUrl: "templates/conversation.html",
                        controller: 'ConversationCtrl'
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
                        templateUrl: "templates/users_guests.html",
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

            .state('inside.favorites', {
                url: "/favorites",
                views: {
                    main: {
                        templateUrl: "templates/users.html",
                        controller: 'FavoritesCtrl'
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

            .state('inside.chatRoom', {
                url: "/chatRooms/:id",
                views: {
                    main: {
                        templateUrl: "templates/chat_room.html",
                        controller: 'ChatRoomCtrl'
                    }
                }
            })

            .state('inside.chatRoom-post', {
                url: "/chatRooms/:roomId/posts/:id",
                views: {
                    main: {
                        templateUrl: "templates/chat_room_post.html",
                        controller: 'ChatRoomPostCtrl'
                    }
                }
            })

            .state('inside.settings', {
                url: "/settings",
                views: {
                    main: {
                        templateUrl: "templates/settings.html"
                    }
                }
            })

            .state('inside.settings-credits', {
                url: "/settings/credits",
                views: {
                    main: {
                        templateUrl: "templates/settings_credits.html",
                         controller: 'SettingsCreditsCtrl'
                    }
                }
            })

            .state('inside.settings-vip', {
                url: "/settings/vip",
                views: {
                    main: {
                        templateUrl: "templates/settings_vip.html",
                        controller: 'SettingsVipCtrl'
                    }
                }
            })

            .state('inside.settings-profile', {
                url: "/settings/profile",
                views: {
                    main: {
                        templateUrl: "templates/settings_profile.html",
                        controller: 'SettingsProfileCtrl'
                    }
                }
            })

            .state('inside.settings-about', {
                url: "/settings/aboutMe",
                views: {
                    main: {
                        templateUrl: "templates/settings_about.html",
                        controller: 'SettingsAboutCtrl'
                    }
                }
            })

            .state('inside.settings-albums', {
                url: "/settings/albums",
                views: {
                    main: {
                        templateUrl: "templates/settings_albums.html",
                        controller: 'SettingsAlbumsCtrl'
                    },
                    'mainAlbum@inside.settings-albums' : {
                        templateUrl: "templates/settings_album.html",
                        controller: 'SettingsAlbumCtrl'
                    }
                },
                params: {
                    albumId: 0
                }
            })

            .state('inside.settings-albums-single', {
                url: "/settings/albums/:albumId",
                views: {
                    main: {
                        templateUrl: "templates/settings_album.html",
                        controller: 'SettingsAlbumCtrl'
                    }
                }
            })

            .state('inside.quickie', {
                abstract: true,
                views: {
                    main: {
                        templateUrl: "templates/quickie.html"
                    }
                }
            })

            .state('inside.quickie.swipe', {
                url: "/quickie",
                views: {
                    quickieSwipe: {
                        templateUrl: "templates/quickie_swipe.html",
                        controller: 'QuickieSwipeCtrl'
                    }
                }
            })

            .state('inside.quickie.listSaidYes', {
                url: "/quickie/saidYes",
                views: {
                    quickieSaidYes: {
                        templateUrl: "templates/quickie_list.html",
                        controller: 'QuickieYesCtrl'
                    }
                }
            })

            .state('inside.quickie.listMatches', {
                url: "/quickie/matches",
                views: {
                    quickieMatches: {
                        templateUrl: "templates/quickie_list.html",
                        controller: 'QuickieMatchesCtrl'
                    }
                }
            })

            .state('inside.quickie.listISaidYes', {
            url: "/quickie/iSaidYes",
            views: {
                quickieISaidYes: {
                    templateUrl: "templates/quickie_list_said_yes.html",
                    controller: 'QuickieISaidYesCtrl'
                }
            }
        })

            .state('inside.notifications', {
                url: "/notifications",
                views: {
                    main: {
                        templateUrl: "templates/notifications.html",
                        controller: 'NotificationsCtrl'
                    }
                }
            })

            .state('inside.support', {
                url: "/support",
                views: {
                    main: {
                        templateUrl: "templates/support.html",
                        controller: 'SupportCtrl'
                    }
                }
            });
    });