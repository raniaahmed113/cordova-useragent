angular.module('hotvibes.controllers')

    .controller('SettingsAboutCtrl', function($scope, $ionicLoading, __, DataMap) {
        $scope.aboutMe = angular.copy($scope.currUser.profile);

        $scope.purposes = DataMap.purpose;
        $scope.selectables = [
            { id: 'maritalStatus', label: __('Status:'), options: DataMap.maritalStatus },
            { id: 'livesWith', label: __('Living'), options: DataMap.livesWith },
            { id: 'doesSmoke', label: __('Smoking'), options: DataMap.doesSmoke },
            { id: 'doesDrink', label: __('Drinking'), options: DataMap.doesDrink },
            { id: 'education', label: __('Education'), options: DataMap.education },
            { id: 'employment', label: __('Work'), options: DataMap.employment }
        ];

        $scope.save = function() {
            $ionicLoading.show({ template: __('Please wait') + '..' });

            var form = this.aboutMeForm,
                changes = { profile: FormUtils.getDirtyFields(form).aboutMe };

            $scope.currUser.$update(changes)
                .then(
                    function() {
                        $scope.currUser = angular.merge($scope.currUser, changes);
                        form.$setPristine();

                        $ionicLoading.show({
                            template: __('Saved'),
                            noBackdrop: true,
                            duration: 1000
                        });
                    },
                    $scope.onError

                ).finally(function() {
                $ionicLoading.hide();
            });
        };
    });