angular.module('hotvibes.controllers')

    .controller('SettingsCreditsCtrl', function($window, $scope, $ionicPopup, $ionicLoading, __, gettextCatalog, Billing) {
        if (!$window.store) {
            return;
        }

        $scope.billingSupported = true;
        $scope.supportContacts = __("skype: xklubas<br />37052344411");
        $scope.purchase = Billing.purchase;
        $scope.purchaseOptions = [
            {
                id: '200 credits',
                amount: 200
            },
            {
                id: '500 credits',
                amount: 500
            }
        ];

        Billing.refresh();
    });
