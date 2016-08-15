angular.module('hotvibes.controllers')

    .controller('SettingsVipCtrl', function($scope, $window, $ionicLoading, $ionicPopup, Config, __, moment, Billing) {
        if (!$window.store) {
            return;
        }

        $scope.billingSupported = true;
        $scope.supportContacts = __("skype: xklubas<br />37052344411");
        $scope.purchase = Billing.purchase;
        $scope.purchaseOptions = [
            {
                id: 'vip7',
                label: __("VIP for 1 week"),
                cost: '€3',
                numDays: 7
            },
            {
                id: 'vip30',
                label: __("VIP for 1 month"),
                cost: '€9.99',
                numDays: 30
            },
            {
                id: 'vip90',
                label: __("VIP for 3 months"),
                cost: '€19.99',
                numDays: 90
            }
        ];

        Billing.refresh();
    });
