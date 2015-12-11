angular.module('hotvibes.controllers')

    .controller('QuickieSwipeCtrl', function($state, $scope, $ionicPopup, TDCardDelegate, __, User, QuickieVote) {
        $scope.photosLoaded = $scope.photosTotal = 0;
        $scope.firstPhotoLoaded = false;

        var queryParams = {
            notVotedInQuickie: true,
            photoSize: 'w330h330'
        };

        if ($scope.currUser.quickieFilter) {

        }

        $scope.users = User.query(
            angular.extend(queryParams, {
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
                angular.extend(queryParams, {
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

        };

        $scope.sayNo = function() {

        };

        function canPerformAction() {
            if ($scope.users.length < 1) {
                return false;
            }

            if (!$scope.currUser.isVip) {
                $ionicPopup.alert({
                    title: __("Available only for VIP members"),
                    template: __("Vip is required") // FIXME: translation
                    // FIXME: buttons
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