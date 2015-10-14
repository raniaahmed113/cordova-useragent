angular.module('hotvibes.controllers', ['hotvibes.services', 'hotvibes.models'])

    .controller('AppCtrl', function($scope, $state, $ionicHistory, $ionicPopup, AuthService) {
        $scope.logout = function() {
            AuthService.doLogout();
        };

        $scope.$on('authTokenExpired', function() {
            AuthService.doLogout();
        });

        $scope.$on('loggedOut', function() {
            $state.go('login');
            $ionicHistory.clearCache();
        });

        $scope.rightMenuEnabled = $state.current.views.rightMenu ? true : false;
        $scope.$on('$stateChangeStart', function(event, state) {
            $scope.rightMenuEnabled = state.views && state.views.rightMenu ? true : false;
        });

        $scope.currUser = AuthService.getCurrentUser();
        $scope.$watch('currUser', function(newUser, oldUser) {
            if (newUser === oldUser) {
                return;
            }

            AuthService.setCurrentUser(newUser);

        }, true);
    })

    .controller('LoginCtrl', function($scope, AuthService, $state, $ionicLoading, $ionicPopup) {
        $scope.loginData = {};
        $scope.login = function() {
            var loginArgs = $scope.loginData;

            loginArgs.onLoggedIn = function() {
                $ionicLoading.hide();
                $state.go('inside.users');
                delete $scope.loginData.password;
            };

            loginArgs.onError = function(response) {
                $ionicLoading.hide();
                $ionicPopup.alert({
                    title: 'Houston, we have problems',
                    template: response && response.message
                        ? response.message
                        : 'Something unexpected happened. Please try again.'
                });
            };

            $ionicLoading.show({ template: 'Logging in..'});
            AuthService.doLogin(loginArgs);
        };
    })

    .controller('UsersFilterCtrl', function($scope) {
        $scope.countries = [
            {
                id: 'LT',
                label: 'Lithuania'
            }
        ]; // FIXME: add full list of countries

        var range = function(min, max, step) {
            step = step || 1;
            var input = [];
            for (var i = min; i <= max; i += step) input.push(i);
            return input;
        };

        $scope.ages = range(18, 99);
        $scope.lookingFor = ['male', 'female'];
        $scope.toggleLookingFor = function(type) {
            var idx;

            if (!$scope.currUser.filter.lookingFor) {
                idx = -1;
                $scope.currUser.filter.lookingFor = [];

            } else {
                idx = $scope.currUser.filter.lookingFor.indexOf(type);
            }

            if (idx > -1) {
                $scope.currUser.filter.lookingFor.splice(idx, 1);

            } else {
                $scope.currUser.filter.lookingFor.push(type);
            }
        };
    })

    .controller('UsersCtrl', function($scope, $ionicSideMenuDelegate, $ionicScrollDelegate, AuthService, User) {
        $scope.showFilter = function() {
            $ionicSideMenuDelegate.toggleRight();
        };

        $scope.$watch('currUser.filter', function(newFilter, oldFilter) {
            if (newFilter === oldFilter) {
                // Called due to initialization - ignore
                return;
            }

            // Save the filter to the back-end
            newFilter.$update();

            // Search results filter has changed - re-fetch newly filtered results
            $ionicScrollDelegate.scrollTop(true);
            loadUsers();

        }, true);

        var loadUsers = function() {
            var params = {
                photoSize: 'w80h80' /* include: 'profilePhoto.url(size=w80h80)' */
            };

            if ($scope.currUser.filter) {
                params = angular.extend(params, $scope.currUser.filter); // FIXME: format the filter properly
            }

            $scope.users = User.query(params);
        };

        loadUsers();
    })

    .controller('UserCtrl', function(
        $window, $scope, $state, $ionicSlideBoxDelegate, $ionicHistory, $ionicPopup, User, Request
    ) {
        $scope.user = User.get({
            id: $state.params.userId,
            include: "profile,galleryAlbums,photos.url(size=w" + $window.innerWidth + "h0),gifts,isFriend,isFavorite,isBlocked"
        });

        $scope.showUi = false;
        $scope.toggleOverlays = function() {
            $scope.showUi = !$scope.showUi;
        };

        $scope.user.$promise.then(function() {
            $ionicSlideBoxDelegate.update();
            $scope.showUi = true;
        });

        $scope.currentPhoto = 0;
        $scope.onPhotoChanged = function($index) {
            $scope.currentPhoto = $index;
        };

        $scope.requestPhotoPermission = function($index) {
            $scope.prompt = {
                message: null,
                errors: {}
            };

            $ionicPopup.prompt({
                title: 'Request unlock photo',
                subTitle: 'Why should he/she unlock this photo for you?',
                templateUrl: 'templates/popup_input_message.html',
                scope: $scope,
                buttons: [
                    { text: 'Cancel' },
                    {
                        text: '<b>Send</b>',
                        type: 'button-positive',
                        onTap: function(event) {
                            if (!$scope.prompt.message) {
                                event.preventDefault();
                                // TODO: show error
                                return null;
                            }

                            return $scope.prompt.message;
                        }
                    }
                ]

            }).then(function(message) {
                if (!message) {
                    return;
                }

                var request = new Request({
                    type: 'file',
                    nodeId: $scope.user.photos[$index].id,
                    toUserId: $scope.user.id,
                    message: message
                });

                request.$save();
            });
        };

        $scope.currentlyActiveTab = null;
        $scope.tabs = [
            { id: 'photos', icon: 'images', title: 'Photos' },
            { id: 'about', icon: 'person', title: 'About' },
            { id: 'actions', icon: 'heart', title: 'Actions' },
            { id: 'chat', icon: 'chatbubbles', title: 'Chat' }
        ];

        $scope.toggleTab = function(tab) {
            // Clicking on the currently-active tab will close the tab
            if (tab == $scope.currentlyActiveTab) {
                var viewHistory = $ionicHistory.viewHistory();
                if (viewHistory.backView === null) {
                    $state.go('inside.user', {}, { location: 'replace' });

                } else {
                    $window.history.back();
                }

                return;
            }

            var transitionParams;
            if ($scope.currentlyActiveTab == null) {
                // Do not animate tab views when opening the tab contents menu
                $ionicHistory.nextViewOptions({ disableAnimate: true });
                transitionParams = { location: true };

            } else {
                transitionParams = { location: 'replace', disableBack: true }; // FIXME: disableBlack does not work as expected
            }

            $state.go('inside.user.' + tab, {}, transitionParams);
        };

        var onStateChanged = function(state) {
            var matches = state.name.match(/^inside.user(?:\.(.*))?$/);
            if (matches) {
                $scope.currentlyActiveTab = matches[1] && matches[1] != 'index' ? matches[1] : null;
            }
        };

        onStateChanged($state.current);
        $scope.$on('$stateChangeStart', function(event, state) {
            onStateChanged(state);
        });
    })

    .controller('UserPhotosCtrl', function($window, $scope, $ionicHistory, $ionicSlideBoxDelegate) {
        $scope.switchPhoto = function($index) {
            if ($scope.user.photos[$index].isLocked) {
                $scope.requestPhotoPermission($index);
                return;
            }

            if ($index == $scope.currentPhoto) {
                return;
            }

            $ionicSlideBoxDelegate.slide($index);
            $window.history.back();
        };
    })

    .controller('UserAboutCtrl', function($scope) {

    })

    .controller('UserActionsCtrl', function(
        $scope, $ionicModal, $ionicLoading, $ionicHistory,
        Friend, Favorite, BlockedUser, Gift, UserGift
    ) {
        $ionicModal
            .fromTemplateUrl('templates/send_gift.html', {
                scope: $scope,
                animation: 'slide-in-up'
            })
            .then(function(modal) {
                $scope.modal = modal;
            });

        $scope.showGifts = function() {
            $scope.modal.show();
        };

        $scope.hideGifts = function() {
            $scope.modal.hide();
        };

        $scope.gifts = Gift.query({ include: 'thumbUrl(size=w80h80)' });
        $scope.sendGift = function(giftId) {
            var gift = new UserGift({ giftId: giftId, userId: $scope.user.id });
            gift.$save();

            $scope.user.gifts.push(gift);
            $scope.modal.hide();

            $ionicLoading.show({ template: 'Gift sent', noBackdrop: true, duration: 1000 });
        };

        $scope.inviteDuel = function() {
            // FIXME: implement
        };

        $scope.user.$promise.then(function() {
            var properties = ['isFriend', 'isFavorite', 'isBlocked'];

            for (var i=0; i < properties.length; i++) {
                $scope.$watch('user.' + properties[i], function(newVal, oldVal) {
                    if (newVal === oldVal) {
                        return;
                    }

                    var relation;
                    switch (this.exp) {
                        case 'user.isFriend':
                            relation = new Friend({ friendId: $scope.user.id });
                            break;

                        case 'user.isFavorite':
                            relation = new Favorite({ favoriteId: $scope.user.id });
                            break;

                        case 'user.isBlocked':
                            relation = new BlockedUser({ blockedUserId: $scope.user.id });
                            break;

                        default:
                            return;
                    }

                    if (newVal) {
                        relation.$save();

                    } else {
                        relation.$delete({ userId: $scope.user.id });
                    }

                    $ionicHistory.clearCache(); // FIXME: only clear a single view
                });
            }
        });
    })

    .controller('ConversationsCtrl', function($scope, $rootScope, $ionicActionSheet, Conversation) {
        $scope.conversations = Conversation.query();
        $scope.deleteItem = function(item) {
            var index = $scope.conversations.indexOf(item);
            $scope.conversations[index].$delete();
            $scope.conversations.splice(index, 1);
        };

        $rootScope.$on('newMessage', function(event, message) {
            $scope.conversations.$promise.then(function() {
                var conversationId = message['conversationId'];

                for (var i=0; i<$scope.conversations.length; i++) {
                    // Find the right conversation in the list
                    if ($scope.conversations[i].id != conversationId) {
                        continue;
                    }

                    // Update the lastMessage info
                    $scope.conversations[i].lastMessage = message;
                }
            });
        });
    })

    .controller('ConversationCtrl', function(
        $scope, $rootScope, $stateParams, $ionicScrollDelegate,
        Conversation, Message, User
    ) {
        var params = {
            withUserId: $stateParams.id || $stateParams.userId
        };

        $scope.msgText = '';
        $scope.conversation = Conversation.get(params, null, null, function(err) {
            if (err.status == 404 /* Not Found */) {
                // There is no conversation created yet
                $scope.conversation.withUser = User.get({ id: params.withUserId }); // FIXME: get from cache
            }
        }); // FIXME: get from cache
        $scope.messages = Message.query(params, function() {
            $ionicScrollDelegate.scrollBottom(true);
            // TODO: load more
            // TODO: support for attachments
        });

        $scope.sendMessage = function() {
            var i = $scope.messages.push({
                    id: $scope.currUser.id,
                    text: $scope.msgText,
                    dateSent: null,
                    conversationId: $scope.conversation.id
                })-1;

            var msg = new Message();
            msg.id = $scope.currUser.id;
            msg.text = $scope.msgText;
            msg.$save(params, function() {
                $scope.messages[i].dateSent = Math.round(Date.now() / 1000);
                $rootScope.$broadcast('newMessage', $scope.messages[i]);

                // TODO: update conversations last message cache

            }, function(error) {
                $scope.messages[i].error = error.data.message;
            });

            $scope.msgText = '';
            $ionicScrollDelegate.scrollBottom(true);
        };

        $scope.resend = function(messageIndex) {
            if (!$scope.messages[messageIndex].error) {
                return;
            }

            delete $scope.messages[messageIndex].error;

            // FIXME: do resend
        }
    })

    .controller('GuestsCtrl', function($scope, Guest) {
        $scope.title = 'Guests';
        $scope.subProperty = 'guest';
        $scope.users = Guest.query({ include: 'guest.profilePhoto.url(size=w80h80)' });
    })

    .controller('FriendsCtrl', function($scope, Friend) {
        $scope.title = 'Friends';
        $scope.subProperty = 'friend';
        $scope.users = Friend.query({ include: 'friend.profilePhoto.url(size=w80h80)' });
    })

    .controller('BlockedUsersCtrl', function($scope, BlockedUser) {
        $scope.title = 'Block-list';
        $scope.subProperty = 'blockedUser';
        $scope.users = BlockedUser.query({ include: 'blockedUser.profilePhoto.url(size=w80h80)' });
    })

    .controller('SettingsCtrl', function($scope, AuthService) {

    })

    .controller('QuickieSwipeCtrl', function($scope, User, QuickieVote) {
        $scope.users = User.query({
            notVotedInQuickie: true,
            photoSize: 'w330h330'
        });

        $scope.cardPos = 0;
        $scope.onCardMove = function(progress) {
            $scope.cardPos = progress;
        };

        $scope.onCardDestroyed = function($index) {
            var user = $scope.users.splice($index, 1)[0];
            var quickieVote = new QuickieVote({
                voteForUserId: user.id,
                vote: $scope.cardPos > 0 ? 'yes' : 'no'
            });

            $scope.cardPos = 0;
            quickieVote.$save();
        };
    })

    .controller('QuickieYesCtrl', function($scope, $state, QuickieVote) {
        $scope.title = 'Wants to meet me';
        $scope.votes = QuickieVote.query({
            votedYesForMe: true,
            include: 'voter.profilePhoto.url(size=w80h80)'
        });
    })

    .controller('QuickieMatchesCtrl', function($scope, QuickieVote) {
        $scope.title = 'My matches';
        $scope.votes = QuickieVote.query({
            votedYesForMe: true,
            matched: true,
            include: 'voter.profilePhoto.url(size=w80h80)'
        });
    })

    .controller('NotificationsCtrl', function($scope, Notification) {
        $scope.notifications = Notification.query();
    })

    .controller('ChatRoomCtrl', function($scope, $stateParams, $ionicModal, $ionicLoading, $ionicPopup, ChatRoomPost, AuthService) {
        $scope.posts = ChatRoomPost.query({
            roomId: $stateParams.id,
            include: 'author.profilePhoto.url(size=w80h80)'
        });

        $ionicModal
            .fromTemplateUrl('templates/chat_room_post_new.html', {
                scope: $scope,
                animation: 'slide-in-up'
            })
            .then(function(modal) {
                $scope.modal = modal;
                $scope.modal.newPost = {};
            });

        $scope.openPostComposer = function() {
            $scope.modal.show();
        };

        $scope.closePostComposer = function() {
            $scope.modal.hide();
        };

        $scope.submitPost = function() {
            // Reset errors
            $scope.errors = {};

            var post = new ChatRoomPost();
            post.body = $scope.modal.newPost.text;

            $ionicLoading.show();
            post.$save({ roomId: $stateParams.id }, function() {
                // Success
                $ionicLoading.hide();

                post.created = Math.round(Date.now() / 1000);
                post.author = AuthService.getCurrentUser();
                $scope.posts.unshift(post);

                $scope.modal.newPost = {};
                $scope.closePostComposer();

            }, function(response) {
                // Error
                $ionicLoading.hide();

                if (
                    response.status == 400 /* Bad Request*/
                    && response.data.field
                ) {
                    $scope.errors[response.data.field] = response.data.message;

                } else {
                    $ionicPopup.alert({
                        title: 'Houston, we have problems',
                        template: response && response.data && response.data.message
                            ? response.data.message
                            : 'Something unexpected happened. Please try again.'
                    });
                }
            });
        };
    });