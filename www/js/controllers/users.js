function enableUserDeletion($scope) {
    $scope.users.$promise.then(function() {
        if ($scope.users.length < 1) {
            return;
        }

        // User list has loaded
        $scope.deleteMode = false;
        $scope.toggleDeleteMode = function() {
            $scope.deleteMode = !$scope.deleteMode;
        };
        $scope.delete = function($event, $index) {
            $event.preventDefault();

            var userToDelete = $scope.users.splice($index, 1)[0];
            userToDelete.$delete();
        }
    });
}

angular.module('hotvibes.controllers')

    .controller('UsersCtrl', function($scope, $ionicSideMenuDelegate, $ionicScrollDelegate, Api, User) {
        $scope.showFilter = function() {
            $ionicSideMenuDelegate.toggleRight();
        };

        $scope.$watch('currUser.filter', function(newFilter, oldFilter) {
            if (newFilter === oldFilter) {
                // Called due to initialization - ignore
                return;
            }

            if (newFilter.cityId && newFilter.country != oldFilter.country) {
                // Country has changed - let's reset the chosen city too
                newFilter.cityId = newFilter.city = null;
                return;
            }

            if (angular.isString(newFilter.ageMin)) {
                newFilter.ageMin = parseInt(newFilter.ageMin);
                return;
            }

            if (angular.isString(newFilter.ageMax)) {
                newFilter.ageMax = parseInt(newFilter.ageMax);
                return;
            }

            // Search results filter has changed - re-fetch newly filtered results
            loadUsers();
            $ionicScrollDelegate.scrollTop(true);

            // Save the filter to the back-end
            var changes = angular.copy(newFilter);
            delete changes.type;

            // TODO: send only the changes and not the entire filter

            newFilter.$update(changes);

        }, true);

        var loadUsers = function() {
            var params = {
                photoSize: 'w80h80' /* include: 'profilePhoto.url(size=w80h80)' */
            };

            if ($scope.currUser.filter) {
                params = angular.extend(params, Api.formatFilter($scope.currUser.filter));
            }

            $scope.users = User.query(params);
        };

        loadUsers();
    })

    .controller('GuestsCtrl', function($scope, $state, __, Guest) {
        $scope.users = Guest.query({
            require: 'guest',
            include: 'guest.profilePhoto.url(size=w80h80)'
        });

        $scope.users.$promise.then(function(response) {
            if (response.resource.length > 0 && !response.resource[response.resource.length-1].guest.id) {
                $scope.error = {
                    icon: 'ion-star',
                    message: __("Want to see all of them?"),
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
            }
        });

        $scope.currUser.cacheCounts.cntNewGuests = 0;
    })

    .controller('FriendsCtrl', function($scope, __, Friend) {
        $scope.title = __('Friends');
        $scope.subProperty = 'friend';
        $scope.users = Friend.query({
            require: 'friend',
            include: 'friend.profilePhoto.url(size=w80h80)'
        });

        enableUserDeletion($scope);
    })

    .controller('BlockedUsersCtrl', function($scope, __, BlockedUser) {
        $scope.title = __('My BlackList');
        $scope.subProperty = 'blockedUser';
        $scope.users = BlockedUser.query({
            require: 'blockedUser',
            include: 'blockedUser.profilePhoto.url(size=w80h80)'
        });

        enableUserDeletion($scope);
    });