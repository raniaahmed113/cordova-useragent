angular.module('hotvibes.controllers')

    .controller('QuickieSwipeCtrl', function(
        $state, $scope, $ionicPopup, $q,
        __, Api, User, QuickieVote, TDCardDelegate
    ) {
        $scope.onPhotoLoaded = function(user, $index) {
            user.loadedFully = true;
            $scope.photosLoaded++;

            if ($index == 0) {
                $scope.firstPhotoLoaded = true;
            }
        };

        $scope.onCardMove = function(progress) {
            $scope.cardPos = progress;
        };

        $scope.onSnapBack = function() {
            $scope.cardPos = 0;
        };

        $scope.onCardDestroyed = onCardDestroyed;

        $scope.sayYes = function() {
            $scope.cardPos = 1;
            TDCardDelegate.$getByHandle('members').cardInstances[0].swipe('right');
        };

        $scope.sayNo = function() {
            TDCardDelegate.$getByHandle('members').cardInstances[0].swipe('left');
        };

        $scope.openChat = function() {
            if (!canPerformAction()) {
                return;
            }

            $state.go('inside.conversations-single', { id: $scope.users[0].id });
        };

        $scope.openProfile = function() {
            if (!canPerformAction()) {
                return;
            }

            $state.go('inside.user', { userId: $scope.users[0].id });
        };

        var limit = 20,
            cardsOnScreen = 5,
            members = null,
            excludeUsers = {},
            baseFilter = {
                notVotedInQuickie: true,
                loggedInRecently: true,
                photoSize: 'w330h330'
            };

        $scope.$watch('currUser.filter', function(newFilter, oldFilter) {
            if (newFilter === oldFilter) {
                // Ignore
                return;
            }

            reload(newFilter);
        }, true);

        reload($scope.currUser.filter);

        function reload(newFilter) {
            filter = angular.extend(baseFilter, Api.formatFilter(newFilter));

            $scope.cardPos = 0;
            $scope.photosLoaded = $scope.photosTotal = 0;
            $scope.firstPhotoLoaded = false;

            loadMore().then(function() {
                if (members.length < 1) {
                    return;
                }

                $scope.users = members.splice(0, cardsOnScreen);
                $scope.photosTotal += $scope.users.length;
            });
        }

        function loadMore() {
            var deferred = $q.defer();

            if ($scope.noMore) {
                deferred.resolve([]);
                return deferred.promise;
            }

            members = User.query(angular.extend(
                filter,
                {
                    limit: limit,
                    exclude: Object.keys(excludeUsers).join(',')
                }
            ));

            members.$promise.then(
                function(response) {
                    if (response.resource.length < limit) {
                        $scope.noMore = true;
                    }

                    response.resource.forEach(function(user) {
                        excludeUsers[user.id] = user;
                    });

                    deferred.resolve(response.resource);
                },
                function(error) {
                    // Failed to load the initial batch of members
                    $scope.error = {
                        icon: 'ion-close-circled',
                        message: __("Sorry, some nasty error prevented us from showing you this page"),
                        actions: [
                            {
                                label: __("Try again"),
                                onClick: function() {
                                    $scope.error = null;
                                    loadMore();
                                }
                            }
                        ]
                    };
                }
            );

            return deferred.promise;
        }

        function getNext() {
            var deferred = $q.defer();

            if (members.length > 0) {
                deferred.resolve(
                    members.splice(0, 1)[0]
                );

            } else if ($scope.noMore) {
                deferred.reject({ noMore: true });

            } else {
                loadMore().then(function() {
                    deferred.resolve(
                        members.splice(0, 1)[0]
                    );
                });
            }

            return deferred.promise;
        }

        function onCardDestroyed($index) {
            var user = $scope.users.splice($index, 1)[0],
                quickieVote = new QuickieVote({
                    voteForUserId: user.id,
                    vote: $scope.cardPos > 0 ? 'yes' : 'no'
                });

            $scope.cardPos = 0;
            submitVote(quickieVote);

            getNext().then(function(nextMember) {
                excludeUsers[nextMember.id] = nextMember;
                $scope.users.push(nextMember);
                $scope.photosTotal++;
            });
        }

        function submitVote(vote) {
            vote.$save().then(
                function () {
                    delete excludeUsers[vote.voteForUserId];
                },
                function (error) {
                    $scope.users.unshift(excludeUsers[vote.voteForUserId]);
                    $scope.photosLoaded--;
                });
        }

        function canPerformAction() {
            if ($scope.users.length < 1) {
                return false;
            }

            if (!$scope.currUser.isVip) {
                $ionicPopup.alert({
                    title: "VIP",
                    template: __("Only for VIP members"),
                    buttons: [
                        { text: __("Cancel") },
                        {
                            text: __("Get VIP"),
                            type: 'button-positive',
                            onTap: function() {
                                $state.go('inside.settings-vip');
                            }
                        }
                    ]
                });
                return false;
            }

            return true;
        }
    })

    .controller('QuickieYesCtrl', function($scope, $state, __, QuickieVote, ErrorCode) {
        $scope.title = __('Who said YES to me');
        $scope.votes = QuickieVote.query({
            votedYesForMe: true,
            require: 'voter',
            include: 'voter.profilePhoto.url(size=w80h80)'
        });

        $scope.onError = function(error) {
            switch (error.data.code) {
                case ErrorCode.VIP_REQUIRED:
                    return {
                        icon: 'ion-star',
                        message: __("Only for VIP members"),
                        actions: [
                            {
                                label: __("Become a VIP member"),
                                class: 'button-positive',
                                onClick: function () {
                                    $state.go('inside.settings-vip');
                                }
                            }
                        ]
                    };

                default:
                    return null;
            }
        };
    })

    .controller('QuickieMatchesCtrl', function($scope, $state, __, QuickieVote, ErrorCode) {
        $scope.title = __('My Matches');
        $scope.votes = QuickieVote.query({
            votedYesForMe: true,
            matched: true,
            require: 'voter',
            include: 'voter.profilePhoto.url(size=w80h80)'
        });

        $scope.onError = function(error) {
            switch (error.data.code) {
                case ErrorCode.VIP_REQUIRED:
                    return {
                        icon: 'ion-star',
                        message: __("Only for VIP members"),
                        actions: [
                            {
                                label: __("Become a VIP member"),
                                class: 'button-positive',
                                onClick: function () {
                                    $state.go('inside.settings-vip');
                                }
                            }
                        ]
                    };

                default:
                    return null;
            }
        };
    })

    .controller('QuickieISaidYesCtrl', function($scope, $state, __, QuickieVote, ErrorCode) {
        $scope.title = __('I said YES');
        $scope.votes = QuickieVote.query({
            iSaidYes: true,
            require: 'votedForUser',
            include: 'votedForUser.profilePhoto.url(size=w80h80)'
        });

        $scope.votes.$promise.then(
            function () {
                Object.keys($scope.votes).map(
                    function (value) {
                        $scope.votes[value].voter = $scope.votes[value].votedForUser;
                    })
            }
        );

        $scope.onError = function(error) {
            switch (error.data.code) {
                case ErrorCode.VIP_REQUIRED:
                    return {
                        icon: 'ion-star',
                        message: __("Only for VIP members"),
                        actions: [
                            {
                                label: __("Become a VIP member"),
                                class: 'button-positive',
                                onClick: function () {
                                    $state.go('inside.settings-vip');
                                }
                            }
                        ]
                    };

                default:
                    return null;
            }
        };
    });