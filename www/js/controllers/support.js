angular.module('hotvibes.controllers')

    .controller('SupportCtrl', function($scope, $ionicLoading, __, SupportRequest) {
        $scope.supportRequest = new SupportRequest();
        $scope.supportRequest.submit = function() {
            if (!this.text) {
                return;
            }

            this.$save();

            $ionicLoading.show({
                template: __('Thank you, your message has been send. We will replay you with in 48 hours.'),
                noBackdrop: true,
                duration: 2000
            });
        };
    });