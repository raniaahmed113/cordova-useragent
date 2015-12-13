angular.module('hotvibes.controllers')

    .controller('QuickieSwipeCtrl', function(
        $state, $scope, $ionicPopup,
        __, Api, User, QuickieVote, TDCardDelegate
    ) {
        $scope.photosLoaded = $scope.photosTotal = 0;
        $scope.firstPhotoLoaded = false;

        var filter = {
            notVotedInQuickie: true,
            photoSize: 'w330h330'
        };

        // Apply the filter
        if (!$scope.currUser.quickieFilter) {
            $scope.currUser.quickieFilter = $scope.currUser.filter
                ? $scope.currUser.filter
                : {
                    gender: $scope.currUser.gender == "male" ? "female" : "male"
                };
        }

        filter = angular.extend(filter, Api.formatFilter($scope.currUser.quickieFilter));

        $scope.users = User.query(
            angular.extend(filter, {
                limit: 5
            })
        );

        var excludeIds = {};

        $scope.users.$promise.then(
            function(response) {
                if (response.resource.length < 1) {
                    $scope.noMore = true;
                    return;
                }

                $scope.photosTotal += response.resource.length;
                response.resource.forEach(function(user) {
                    excludeIds[user.id] = true;
                });
            },
            function(error) {
                // Failed to load the initial batch of members
                $scope.error = true;
            }
        );

        $scope.onPhotoLoaded = function(user, $index) {
            user.loadedFully = true;
            $scope.photosLoaded++;

            if ($index == 0) {
                $scope.firstPhotoLoaded = true;
            }
        };

        $scope.cardPos = 0;
        $scope.onCardMove = function(progress) {
            $scope.cardPos = progress;
        };

        $scope.onSnapBack = function() {
            $scope.cardPos = 0;
        };

        $scope.onCardDestroyed = function($index) {
            $scope.cardPos = 0;
            $scope.photosTotal++;

            var user = $scope.users.splice($index, 1)[0];
            var quickieVote = new QuickieVote({
                voteForUserId: user.id,
                vote: $scope.cardPos > 0 ? 'yes' : 'no'
            });

            quickieVote.$save(
                function(vote) {
                    delete excludeIds[vote.voteForUserId];
                }
            );

            var nextUser = User.query(
                angular.extend(filter, {
                    limit: 1,
                    exclude: Object.keys(excludeIds).join(',')
                })
            );

            nextUser.$promise.then(
                function(response) {
                    if (response.resource.length < 1) {
                        $scope.noMore = true;
                        return;
                    }

                    response.resource.forEach(function(user) {
                        excludeIds[user.id] = true;
                        $scope.users.push(user);
                    });
                },

                function() {
                    // FIXME: Failed to retrieve the next member
                }
            );
        };

        $scope.sayYes = function() {
            TDCardDelegate.$getByHandle('members').getFirstCard().swipe('right');
        };

        $scope.sayNo = function() {
            TDCardDelegate.$getByHandle('members').getFirstCard().swipe('left');
        };

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
                            onTap: function(e) {
                                // TODO
                            }
                        }
                    ]
                });
                return false;
            }

            return true;
        }

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
    });