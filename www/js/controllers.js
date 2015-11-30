var enableUserDeletion = function($scope) {
    $scope.deleteMode = false;
    $scope.toggleDeleteMode = function() {
        $scope.deleteMode = !$scope.deleteMode;
    };
    $scope.delete = function($event, $index) {
        $event.preventDefault();

        var userToDelete = $scope.users.splice($index, 1)[0];
        userToDelete.$delete();
    }
};

angular.module('hotvibes.controllers', ['hotvibes.services', 'hotvibes.models'])

    .controller('AppCtrl', function($scope, $state, $ionicHistory, $ionicPopup, $ionicLoading, __, AuthService) {
        $scope.logout = function() {
            AuthService.setCurrentUser(null);
            $state.go('login');
            $ionicHistory.clearCache();
        };

        $scope.$on('authTokenExpired', function() {
            $scope.logout();
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

        $scope.onError = function(response, params) {
            $ionicLoading.hide();
            $ionicPopup.alert({
                title: params && params.title || __("Something's wrong"),
                template: response && response.data && response.data.message
                    ? response.data.message
                    : __("We're sorry, but something went wrong. Please try again later.")
            });
        };
    })

    .controller('LoginCtrl', function(
        $scope, $state, $ionicModal, $ionicLoading, $ionicPopup,
        __, AuthService, Country, Config
    ) {
        $scope.loginData = {};
        $scope.login = function() {
            var loginArgs = $scope.loginData;

            loginArgs.onLoggedIn = function() {
                $ionicLoading.hide();
                $state.go('inside.users').then(function() {
                    delete $scope.loginData.password;
                });
            };

            loginArgs.onError = function(response) {
                $ionicLoading.hide();
                $ionicPopup.alert({
                    title: __("Something's wrong"),
                    template: response && response.message
                        ? response.message
                        : __("We're sorry, but something went wrong. Please try again later.")
                });
            };

            $ionicLoading.show({ template: __('Please wait') + '..'});
            AuthService.doLogin(loginArgs);
        };

        $scope.countries = Country.query();
        $scope.registration = {
            data: {
                clientId: Config.API_CLIENT_ID
            }, // FIXME: pre-fill country & email?

            submit: function() {
                $ionicLoading.show();

                // Submit request
                AuthService.submitRegistration(this.data)
                    .success(function(response, status, headers, config) {
                        $ionicLoading.hide();

                        // Success! Let's login now
                        $scope.loginData = {
                            username: $scope.registration.data.nickName,
                            password: $scope.registration.data.password
                        };
                        $scope.registration.modal.hide().then(function() {
                            $scope.registration.data = {};
                        });
                        $scope.login();

                    }).error(function(response, status, headers, config) {
                        $ionicLoading.hide();

                        if (status == 400 /* Bad Request*/ && response.rule && response.rule.field) {
                            var field = $scope.registration.form['registration.data.' + response.rule.field];
                            field.errorMessage = response.message;
                            field.$validators.serverError = function() { return true; }; // This will reset 'serverError' when value changes
                            field.$setValidity('serverError', false);

                        } else {
                            $ionicPopup.alert({
                                title: __("Something's wrong"),
                                template: response && response.message
                                    ? response.message
                                    : __("We're sorry, but something went wrong. Please try again later.")
                            });
                        }
                    });
            }
        };

        $ionicModal
            .fromTemplateUrl('templates/register.html', {
                scope: $scope,
                animation: 'slide-in-up'
            })
            .then(function(modal) {
                $scope.registration.modal = modal;
            });
    })

    .controller('UsersFilterCtrl', function($scope, __, Country) {
        $scope.countries = Country.query();

        var range = function(min, max, step) {
            step = step || 1;
            var input = [];
            for (var i = min; i <= max; i += step) input.push(i);
            return input;
        };

        $scope.ages = range(18, 99);
        $scope.genders = ['male', 'female'];
        $scope.toggleGender = function($index) {
            $scope.currUser.filter.gender.toggleElement($scope.genders[$index]);
        };
    })

    .controller('UsersCtrl', function($scope, $ionicSideMenuDelegate, $ionicScrollDelegate, User) {
        $scope.showFilter = function() {
            $ionicSideMenuDelegate.toggleRight();
        };

        $scope.$watch('currUser.filter', function(newFilter, oldFilter) {
            if (newFilter === oldFilter) {
                // Called due to initialization - ignore
                return;
            }

            // Search results filter has changed - re-fetch newly filtered results
            $ionicScrollDelegate.scrollTop(true);
            loadUsers();

            // Save the filter to the back-end
            newFilter.$update();

        }, true);

        var loadUsers = function() {
            var params = {
                photoSize: 'w80h80' /* include: 'profilePhoto.url(size=w80h80)' */
            };

            /*if ($scope.currUser.filter) {
                params = angular.extend(params, $scope.currUser.filter); // FIXME: format the filter properly
            }*/

            $scope.users = User.query(params);
        };

        loadUsers();
    })

    .controller('UserCtrl', function(
        $window, $scope, $state, $ionicSlideBoxDelegate, $ionicHistory, $ionicPopup,
        __, User, Request, ErrorCode
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

        }, function(error) {
            if (error && error.data && error.data.code == ErrorCode.MEMBER_HAS_BLOCKED_YOU) {
                $scope.blocked = true;

            } else {
                // TODO: display the error
            }
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
                title: __('Unlock photo!'),
                subTitle: __('Reason for unlock') + ':',
                templateUrl: 'templates/popup_input_message.html',
                scope: $scope,
                buttons: [
                    { text: __('Cancel') },
                    {
                        text: '<b>' + __('Send') + '</b>',
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
            { id: 'photos', icon: 'images', title: __('Pictures') },
            { id: 'about', icon: 'person', title: __('About me') },
            { id: 'actions', icon: 'heart', title: __('Want to...') },
            { id: 'chat', icon: 'chatbubbles', title: __('Chat') }
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
                $ionicHistory.currentView($ionicHistory.backView()); // FIXME: remove this dirty hack once 'location: replace' works as it should
                transitionParams = { location: 'replace', disableBack: true };
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
        $scope, $ionicModal, $ionicPopup, $ionicLoading, $ionicHistory,
        __, Friend, Favorite, BlockedUser, Gift, UserGift, DuelInvite
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
        $scope.sendGift = function(gift) {
            var giftSent = new UserGift({ giftId: gift.id, userId: $scope.user.id });

            giftSent.$save().then(
                function() {
                    // FIXME: these kinds of profile changes should come via server-->client event stream
                    $scope.currUser.credits -= gift.price;
                },
                function() {
                    // FIXME: handle error, like not enough credits
                }
            );

            $scope.user.gifts.push(giftSent);
            $scope.modal.hide();

            $ionicLoading.show({
                template: __('Gift was sent'),
                noBackdrop: true,
                duration: 1000
            });
        };

        $scope.inviteDuel = function() {
            $scope.duelPrompt = { reason: null };
            $ionicPopup.prompt({
                title: __('Kviesti i dvikova'),
                subTitle: __('Nori pagaliau issiaiskinti ar esi grazesnis uz kuri nors nari? Issirink sriti kurioje nori rungtyniauti ir pakviesk ji i Dvikova. Jusu dvikova vyks 3 dienas ir vartotojai nuspres kuris vertas buti nugaletoju.'),
                template: '<input type="text" placeholder="' + __('Duel reason') + '" ng-model="duelPrompt.reason" required />',
                scope: $scope,
                buttons: [
                    { text: __('Cancel') },
                    {
                        text: '<b>' + __('Send') + '</b>',
                        type: 'button-positive',
                        onTap: function(event) {
                            if (!$scope.duelPrompt.reason) {
                                event.preventDefault();
                                // TODO: show error
                                return null;
                            }

                            return $scope.duelPrompt.reason;
                        }
                    }
                ]
            }).then(function(reason) {
                if (!reason) {
                    return;
                }

                $ionicLoading.show({ template: __('Please wait') + '..' });

                var invite = new DuelInvite({
                    userId: $scope.user.id,
                    reason: reason
                });

                invite.$save().then(function() {
                    // Success
                    $ionicLoading.hide();
                    $ionicLoading.show({
                        template: __('Invite sent'),
                        noBackdrop: true,
                        duration: 1000
                    });

                }, $scope.onError);
            });
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
            withUserId: $stateParams.userId || $stateParams.id
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

    .controller('GuestsCtrl', function($scope, __, Guest) {
        $scope.title = __('Guests');
        $scope.subProperty = 'guest';
        $scope.users = Guest.query({ include: 'guest.profilePhoto.url(size=w80h80)' });
    })

    .controller('FriendsCtrl', function($scope, __, Friend) {
        $scope.title = __('Friends');
        $scope.subProperty = 'friend';
        $scope.users = Friend.query({ include: 'friend.profilePhoto.url(size=w80h80)' });

        enableUserDeletion($scope);
    })

    .controller('BlockedUsersCtrl', function($scope, __, BlockedUser) {
        $scope.title = __('My BlackList');
        $scope.subProperty = 'blockedUser';
        $scope.users = BlockedUser.query({ include: 'blockedUser.profilePhoto.url(size=w80h80)' });

        enableUserDeletion($scope);
    })

    .controller('SettingsProfileCtrl', function($scope, $ionicLoading, $ionicModal, $q, Country, City) {
        $scope.profile = {
            cityName: $scope.currUser.cityName,
            country: $scope.currUser.country,
            //phone: $scope.currUser.profile.phoneNumber,
            email: $scope.currUser.email
        };
        $scope.save = function() {
            // TODO: implement
            console.log('onSubmit');
            $ionicLoading.show();
        };

        $scope.countries = Country.query();

        $ionicModal
            .fromTemplateUrl('templates/modal_autocomplete.html', {
                scope: $scope,
                animation: 'slide-in-up'
            })
            .then(function(modal) {
                modal.search = function() {
                    $scope.modal.searching = true;

                    City.query({
                        country: $scope.profile.country,
                        name: $scope.modal.input

                    }).$promise.then(
                        function(response) {
                            $scope.modal.rows = response.resource.map(function(city) {
                                return {label: city.name}
                            });
                        },

                        $scope.onError

                    ).finally(function() {
                        $scope.modal.searching = false;
                    });
                };

                modal.onItemSelected = function($index) {
                    $scope.profile.cityName = $scope.modal.rows[$index]['label'];
                    $scope.profile.form.city.$setDirty();
                    modal.hide();
                };

                $scope.modal = modal;
            });

        $scope.password = {};
        $scope.changePassword = function() {
            $ionicLoading.show({ template: __('Please wait') + '..' });

            $scope.currUser.$update({
                password: $scope.password.new

            }).then(
                function() {
                    // TODO: implement password changes
                },
                function() {

                }

            ).finally(function() {
                $ionicLoading.hide();
            });
        };
    })

    .controller('SettingsAboutCtrl', function($scope, $ionicLoading, __) {
        $scope.selectables = [
            {id: 'maritalStatus', label: __('Status:'), options: []},
            {id: 'living', label: __('Living'), options: []},
            {id: 'smoking', label: __('Smoking'), options: []},
            {id: 'drinking', label: __('Drinking'), options: []},
            {id: 'education', label: __('Education'), options: []}
        ];

        $scope.purposes = [
            {id: 'dating', label: __('Real dates')},
            {id: 'sex', label: __('S&M')},
            {id: 'chat', label: __('Online chat')},
            {id: 'relationship', label: __('Normal relationships')},
            {id: 'marriage', label: __('Mariage')}
        ];

        $scope.save = function() {
            // TODO: implement
            $ionicLoading.show();
        };
    })

    .controller('SettingsAlbumsCtrl', function($scope, $ionicPopover, $ionicPopup, $ionicLoading, __, Album) {
        $scope.albums = Album.query({ include: 'thumbUrl(size=w80h80)' });

        $scope.promptCreateAlbum = {
            albumName: null
        };

        $scope.createAlbum = function() {
            $ionicPopup.prompt({
                title: __('Add New Album'),
                subTitle: __('Enter album name'),
                template: '<input type="text" ng-model="promptCreateAlbum.albumName" required />',
                scope: $scope,
                buttons: [
                    { text: __('Cancel') },
                    {
                        text: '<b>' + __('Create') + '</b>',
                        type: 'button-positive',
                        onTap: function(event) {
                            if (!$scope.promptCreateAlbum.albumName) {
                                event.preventDefault();
                                // TODO: show error
                                return null;
                            }

                            return $scope.promptCreateAlbum.albumName;
                        }
                    }
                ]

            }).then(function(name) {
                if (!name) {
                    return;
                }

                $ionicLoading.show({ template: __('Please wait') + '..' });

                var album = new Album({ name: name });
                album.$save().then(
                    function() {
                        $scope.albums.push(album);
                    },

                    $scope.onError

                ).finally(function() {
                    $ionicLoading.hide();
                });
            });
        };
    })

    .controller('SettingsAlbumCtrl', function(
        $scope, $stateParams, $ionicHistory, $ionicLoading, $ionicPopover,
        __, MediaFile, Album, Rule
    ) {
        var thumbParams = 'size=w80h80';

        $scope.album = Album.get({
            id: $stateParams.albumId,
            include: 'photos.url(' + thumbParams + ')'
        });

        $scope.photoOptions = function($index, $event) {
            $ionicPopover.fromTemplateUrl('templates/popover_photo_options.html', {
                scope: $scope

            }).then(function(popover) {
                popover.show($event);
            });

            // TODO: photo actions: delete, set as main, etc
        };

        var filePicker;

        $scope.$on('$ionicView.afterEnter', function() {
            filePicker = document.querySelector('ion-view[nav-view="active"] #file-picker');
            filePicker.removeEventListener('change');
            filePicker.addEventListener('change', function(event) {
                $ionicLoading.show({ template: __('Uploading') + '..' });

                var file = new MediaFile({
                    albumId: $stateParams.albumId,
                    file: event.target.files[0]
                });

                // Upload the file
                file.$save().then(function(response) {
                    // Display the newly uploaded file
                    $scope.album.photos.push(
                        MediaFile.get({
                            albumId: $stateParams.albumId,
                            id: response.id,
                            include: 'url(' + thumbParams + ')'
                        })
                    );

                }, function(error) {
                    if (
                        error.status == 400
                        && error.data.rule
                        && error.data.rule.type == Rule.MIN_VALUE
                        && (error.data.rule.field == 'width' || error.data.rule.field == 'height')
                    ) {
                        error.data.message = __('Incorrenct image dimensions');
                    }

                    $scope.onError(error);

                }).finally(function() {
                    $ionicLoading.hide();
                });
            });
        });

        $scope.openFilePicker = function() {
            ionic.trigger('click', { target: filePicker });
        };

        $scope.deleteAlbum = function() {
            $scope.album.$delete();
            //$rootScope.$broadcast('');
            // FIXME: notify albums list about deleted element

            $ionicHistory.goBack();
        };
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

    .controller('QuickieYesCtrl', function($scope, $state, __, QuickieVote) {
        $scope.title = __('Who said YES to me');
        $scope.votes = QuickieVote.query({
            votedYesForMe: true,
            include: 'voter.profilePhoto.url(size=w80h80)'
        });
    })

    .controller('QuickieMatchesCtrl', function($scope, __, QuickieVote) {
        $scope.title = __('My Matches');
        $scope.votes = QuickieVote.query({
            votedYesForMe: true,
            matched: true,
            include: 'voter.profilePhoto.url(size=w80h80)'
        });
    })

    .controller('NotificationsCtrl', function($scope, Notification) {
        $scope.notifications = Notification.query();
    })

    .controller('ChatRoomCtrl', function($scope, $stateParams, $ionicModal, $ionicLoading, $ionicPopup, __, ChatRoomPost) {
        var loadPosts = function() {
            return ChatRoomPost.query({
                roomId: $stateParams.id,
                include: 'author.profilePhoto.url(size=w80h80)'
            });
        };

        $scope.posts = loadPosts();
        $scope.doRefresh = function() {
            loadPosts().$promise.then(function(result) {
                $scope.posts = result.resource;
                $scope.$broadcast('scroll.refreshComplete');
            });
        };

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
            post.$save({
                    roomId: $stateParams.id
                },
                function() {
                    // Success
                    $ionicLoading.hide();

                    post.created = Math.round(Date.now() / 1000);
                    post.author = $scope.currUser;
                    post.cntComments = 0;

                    $scope.posts.unshift(post);

                    $scope.modal.newPost = {};
                    $scope.closePostComposer();

                },
                function(response) {
                    // Error
                    $ionicLoading.hide();

                    if (
                        response.status == 400 /* Bad Request*/
                        && response.data.field
                    ) {
                        $scope.errors[response.data.field] = response.data.message;

                    } else {
                        $ionicPopup.alert({
                            title: __("Something's wrong"),
                            template: response && response.data && response.data.message
                                ? response.data.message
                                : __("We're sorry, but something went wrong. Please try again later.")
                        });
                    }
                }
            );
        };
    });