angular.module('hotvibes.controllers')

    .controller('SupportCtrl', function($scope, $ionicLoading, $ionicHistory, __, SupportRequest) {
        $scope.supportRequest = new SupportRequest();
        $scope.supportRequest.submit = function() {
            if (!this.text) {
                return;
            }

            $ionicLoading.show({ template: __("Please wait") + '..' });

            var self = this;

            self.$save().then(
                function() {
                    // Show success message
                    $ionicLoading.show({
                        template: __('Thank you, your message has been send. We will replay you with in 48 hours.'),
                        noBackdrop: true,
                        duration: 3000
                    });

                    // Reset the input field
                    self.text = '';

                    // Go back to previous window (if any)
                    $ionicHistory.goBack();
                },
                function() {
                    $scope.onError();
                }
            ).finally(function() {
                $ionicLoading.hide();
            });
        };
    });