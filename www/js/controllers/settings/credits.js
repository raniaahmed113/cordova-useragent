angular.module('hotvibes.controllers')

    .controller('SettingsCreditsCtrl', function($scope, $ionicPopup, $ionicLoading, __, gettextCatalog, Config) {
        $scope.supportContacts = __("skype: xklubas<br />37052344411");

        if (window.store) {
            //store.verbosity = store.DEBUG;
            // FIXME: resolve gateway ID properly via device platform
            store.validator = Config.API_URL_BASE + "paymentGateways/google/payments?u=" + $scope.currUser.id;

            store.register({
                id: "lt.vertex.flirtas.purchase.credits200",
                alias: "200 credits",
                type: store.CONSUMABLE
            });

            store.register({
                id: "lt.vertex.flirtas.purchase.credits500",
                alias: "500 credits",
                type: store.CONSUMABLE
            });

            /*store.register({
             id: "lt.vertex.flirtas.purchase.vip",
             alias: "vip",
             type: store.PAID_SUBSCRIPTION
             });*/

            store.when("product").approved(function(product) {
                $ionicLoading.show({ template: __("Please wait") + '..'});
                product.verify();
            });

            store.when("product").verified(function(product) {
                var numCredits;

                switch (product.alias) {
                    case '200 credits':
                        numCredits = 200;
                        break;

                    case '500 credits':
                        numCredits = 500;
                        break;

                    default:
                        throw "Unknown product: " + product.alias;
                }

                $scope.$apply(function() {
                    $scope.currUser.credits += numCredits;
                });

                $ionicLoading.hide();
                product.finish();

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
            });

            $scope.billingSupported = true;

            store.ready(function() {
                $scope.$apply(function() {
                    $scope.creditOptions = [
                        { amount: 200, buy: function() { store.order("200 credits"); } },
                        { amount: 500, buy: function() { store.order("500 credits"); } }
                    ];
                });
            });

            store.refresh();
        }
    });