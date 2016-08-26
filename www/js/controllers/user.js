angular.module('hotvibes.controllers')

    .controller('UserCtrl', function(
        $window, $scope, $state, $ionicSlideBoxDelegate, $ionicHistory, $ionicPopup,
        __, User, Request, ErrorCode
    ) {
        $scope.user = User.get({
            id: $state.params.userId,
            include: [
                "profile",
                "galleryAlbums",
                "photos.url(size=w" + $window.innerWidth + "h0)",
                "gifts",
                'isOnline',
                "isFriend",
                "isInvitedToFriends",
                "isFavorite",
                "isBlocked",
                "age"
            ].join(",")
        });

        $scope.showUi = false;
        $scope.toggleOverlays = function() {
            $scope.showUi = !$scope.showUi;
        };

        $scope.user.$promise.then(function() {
            $ionicSlideBoxDelegate.update();
            $scope.showUi = true;

        }, function(error) {
            $scope.error = true;

            if (!error || !error.data) {
                // Show some generic error
                $scope.errUnknown = true;
                return;
            }

            switch (error.status) {
                case 400:
                    switch (error.data.code) {
                        case ErrorCode.MEMBER_HAS_BLOCKED_YOU:
                            $scope.blocked = true;
                            break;

                        default:
                            $scope.errUnknown = true;
                            break;
                    }
                    break;

                case 404:
                    $scope.noSuchProfile = true;
                    break;

                default:
                    $scope.errUnknown = true;
                    break;
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
                    type: 'photo',
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

            $ionicSlideBoxDelegate.slide($index);
            $window.history.back();
        };
    })

    .controller('UserAboutCtrl', function($scope) {

    })

    .controller('UserActionsCtrl', function(
        $scope, $ionicModal, $ionicPopup, $ionicLoading, $ionicHistory,
        __, Friend, Favorite, BlockedUser, Gift, UserGift, DuelInvite, Request
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

        $scope.sendFriendInvite = function() {
            $ionicPopup.confirm({
                title: __('Add friend'),
                template: __('Invite %s to your friends list?').replace(/%s/, $scope.user.nickName),
                buttons: [
                    { text: __('Cancel') },
                    { text: __('Send'), type: 'button-positive', onTap: function() { return true; } }
                ]

            }).then(function(accepted) {
                if (!accepted) {
                    return;
                }

                var invite = new Request({
                    type: "friend",
                    toUserId: $scope.user.id
                });
                invite.$save();

                $scope.user.isInvitedToFriends = true;
                $ionicLoading.show({
                    template: __('Invite sent'),
                    noBackdrop: true,
                    duration: 1000
                });
            });
        };

        $scope.user.$promise.then(function() {
            var properties = [ 'user.isFriend', 'user.isFavorite', 'user.isBlocked' ];

            $scope.$watchGroup(properties, function(newValues, oldValues) {
                var relation,
                    property,
                    newVal;

                for (var i=0; i<properties.length; i++) {
                    if (newValues[i] !== oldValues[i]) {
                        property = properties[i];
                        newVal = newValues[i];
                        break;
                    }
                }

                if (!property) {
                    // Nothing has changed
                    return;
                }

                switch (property) {
                    case 'user.isFriend':
                        if (newVal) {
                            // Do nothing - may not become friends without sending an invite first
                            return;
                        }

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
        });
    });