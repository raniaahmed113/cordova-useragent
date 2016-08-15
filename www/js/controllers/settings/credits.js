angular.module('hotvibes.controllers')

    .controller('SettingsCreditsCtrl', function($scope, $ionicPopup, $ionicLoading, __, gettextCatalog, Billing) {
        if (!Billing.isSupported()) {
            return;
        }

        $scope.billingSupported = true;
        $scope.supportContacts = __("skype: xklubas<br />37052344411");
        $scope.purchaseOptions = [
            {
                id: 'lt.vertex.flirtas.purchase.credits200',
                amount: 200
            },
            {
                id: 'lt.vertex.flirtas.purchase.credits500',
                amount: 500
            }
        ];

        $scope.purchase = function (productId) {
            $ionicLoading.show({ template: __("Please wait") + '..'});

            Billing.purchase(productId)
                .then(
                    function () {
                        var numCredits;

                        switch (productId) {
                            case 'lt.vertex.flirtas.purchase.credits200':
                                numCredits = 200;
                                break;

                            case 'lt.vertex.flirtas.purchase.credits500':
                                numCredits = 500;
                                break;
                        }

                        $scope.currUser.credits += numCredits;

                        $ionicLoading.hide();
                        $ionicPopup.alert({
                            title: __("Payment successful"),
                            template: gettextCatalog.getPlural(numCredits, "You have received %u credit", "You have received %u credits"),
                            buttons: [
                                {
                                    text: __("Cool, thanks!"),
                                    type: 'button-positive'
                                }
                            ]
                        });
                    },
                    $scope.onError
                );
        };
    });
