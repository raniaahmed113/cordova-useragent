angular.module('hotvibes.controllers')

    .controller('SettingsVipCtrl', function($scope, $ionicLoading, $ionicPopup, __, moment, Billing) {
        if (!Billing.isSupported()) {
            return;
        }

        $scope.billingSupported = true;
        $scope.supportContacts = __("skype: xklubas<br />37052344411");
        $scope.purchaseOptions = [
            {
                id: 'lt.vertex.flirtas.purchase.vipweekly',
                label: __("VIP for 1 week"),
                cost: '€3',
                numDays: 7
            },
            {
                id: 'lt.vertex.flirtas.purchase.vipmontly',
                label: __("VIP for 1 month"),
                cost: '€9.99',
                numDays: 30
            },
            {
                id: 'lt.vertex.flirtas.purchase.vip3months',
                label: __("VIP for 3 months"),
                cost: '€19.99',
                numDays: 90
            }
        ];

        $scope.purchase = function (productId) {
            $ionicLoading.show({ template: __("Please wait") + '..'});

            Billing.purchase(productId)
                .then(
                    function() {
                        var dateNewVipExpires;

                        switch (productId) {
                            case 'lt.vertex.flirtas.purchase.vipweekly':
                                dateNewVipExpires = moment().add(1, 'weeks');
                                break;

                            case 'lt.vertex.flirtas.purchase.vipmontly':
                                dateNewVipExpires = moment().add(1, 'months');
                                break;

                            case 'lt.vertex.flirtas.purchase.vip3months':
                                dateNewVipExpires = moment().add(3, 'months');
                                break;
                        }

                        $scope.currUser.isVip = true;
                        $scope.currUser.vipTill = dateNewVipExpires.format("YYYY-MM-DD HH:mm:ss");

                        $ionicPopup.alert({
                            title: __("Payment successful"),
                            template: __("Done - Thanks for buying VIP membership."),
                            buttons: [
                                { text: __("Cool, thanks!") }
                            ]
                        });
                    },
                    function (error) {
                        if (error.code && error.code === Billing.ERROR_PURCHASE_CANCELLED) {
                            // Ignore
                            return;
                        }

                        $scope.onError(error);
                    }
                )
                .finally($ionicLoading.hide);
        };
    });
