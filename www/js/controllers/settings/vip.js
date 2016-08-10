angular.module('hotvibes.controllers')

    .controller('SettingsVipCtrl', function($scope, $window, $ionicLoading, $ionicPopup, Config, __) {
        $scope.supportContacts = __("skype: xklubas<br />37052344411");

        if ($window.store) {
            var store = $window.store,
                gateway;

            switch ($window.cordova.platformId) {
                case "android":
                    gateway = "google";
                    break;

                case "ios":
                    gateway = "apple";
                    break;

                default:
                    throw "Unsupported payment platform: " + $window.cordova.platformId;
            }

            // store.verbosity = store.DEBUG;
            store.validator = Config.API_URL_BASE + "paymentGateways/" + gateway + "/payments?u=" + $scope.currUser.id;

            store.register({
                id: "lt.vertex.flirtas.purchase.vipweekly",
                alias: "vip7",
                type: store.PAID_SUBSCRIPTION
            });

            store.register({
                id: "lt.vertex.flirtas.purchase.vipmontly",
                alias: "vip30",
                type: store.PAID_SUBSCRIPTION
            });

            store.register({
                id: "lt.vertex.flirtas.purchase.vip3months",
                alias: "vip90",
                type: store.PAID_SUBSCRIPTION
            });

            store.when("product").approved(function(product) {
                $ionicLoading.show({ template: __("Please wait") + '..'});
                product.verify();
            });

            store.when("product").verified(function(product) {
                $scope.currUser.isVip = true;
                // FIXME: $scope.currUser.vipTill = '';
                $ionicLoading.hide();

                product.finish();

                $ionicPopup.alert({
                    title: __("Payment successful"),
                    template: __("Done - Thanks for buying VIP membership."),
                    buttons: [
                        { text: __("Cool, thanks!") }
                    ]
                });
            });

            $scope.billingSupported = true;

            store.ready(function() {
                $scope.$apply(function() {
                    $scope.purchaseOptions = [
                        {
                            buy: function() { store.order("vip7"); },
                            label: __("VIP for 1 week"),
                            cost: '€3',
                            numDays: 7
                        },
                        {
                            buy: function() { store.order("vip30"); },
                            label: __("VIP for 1 month"),
                            cost: '€9.99',
                            numDays: 30
                        },
                        {
                            buy: function() { store.order("vip90"); },
                            label: __("VIP for 3 months"),
                            cost: '€19.99',
                            numDays: 90
                        }
                    ];
                });
            });

            store.refresh();
        }
    });
