angular.module('hotvibes.controllers')

    .controller('QuickieSwipeCtrl', function(
        $state, $scope, $ionicPopup, $q,
        __, Api, User, QuickieVote, TDCardDelegate
    ) {
        $scope.photosLoaded = $scope.photosTotal = 0;
        $scope.firstPhotoLoaded = false;

        var filter = {
            notVotedInQuickie: true,
            loggedInRecently: true,
            photoSize: 'w330h330'
        };

        // Apply the filter
        if (!$scope.currUser.quickieFilter) {
            $scope.currUser.quickieFilter = $scope.currUser.filter
                ? $scope.currUser.filter
                : {
                    gender: $scope.currUser.gender == "male" ? "female" : "male"
                };
        } else {
            $scope.currUser.quickieFilter.gender = $scope.currUser.filter
                ? $scope.currUser.filter.gender
                : [ $scope.currUser.gender == "male" ? "female" : "male" ];
        }

        filter = angular.extend(filter, Api.formatFilter($scope.currUser.quickieFilter));

        var limit = 20,
            cardsOnScreen = 5,
            members = null,
            excludeIds = {};

        function loadMore() {
            var deferred = $q.defer();

            if ($scope.noMore) {
                deferred.resolve([]);
                return deferred.promise;
            }

            members = User.query(
                angular.extend(filter, {
                    limit: limit,
                    exclude: Object.keys(excludeIds).join(',')
                })
            );

            members.$promise.then(
                function(response) {
                    if (response.resource.length < limit) {
                        $scope.noMore = true;
                    }

                    response.resource.forEach(function(user) {
                        excludeIds[user.id] = true;
                    });

                    deferred.resolve(response.resource);
                },
                function(error) {
                    // Failed to load the initial batch of members
                    $scope.error = true;
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
                loadMore().then(
                    function() {
                        deferred.resolve(
                            members.splice(0, 1)[0]
                        );
                    }
                );
            }

            return deferred.promise;
        }

        loadMore().then(
            function() {
                if (members.length < 1) {
                    return;
                }

                $scope.users = members.splice(0, cardsOnScreen);
                $scope.photosTotal += $scope.users.length;
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
            var user = $scope.users.splice($index, 1)[0];
            var quickieVote = new QuickieVote({
                voteForUserId: user.id,
                vote: $scope.cardPos > 0 ? 'yes' : 'no'
            });

            $scope.cardPos = 0;

            quickieVote.$save(
                function(vote) {
                    delete excludeIds[vote.voteForUserId];
                }
            );

            getNext().then(
                function(nextMember) {
                    excludeIds[nextMember.id] = true;
                    $scope.users.push(nextMember);
                    $scope.photosTotal++;
                }
            );
        };

        $scope.sayYes = function() {
            $scope.cardPos = 1;
            TDCardDelegate.$getByHandle('members').cardInstances[0].swipe('right');
        };

        $scope.sayNo = function() {
            TDCardDelegate.$getByHandle('members').cardInstances[0].swipe('left');
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