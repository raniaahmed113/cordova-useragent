angular.module('hotvibes.controllers')

    .controller('SettingsVipCtrl', function($scope, $ionicLoading, $ionicPopup, Config) {
        // if (window.store) {
        //     $scope.billingSupported = true;
        //
        //     //store.verbosity = store.DEBUG;
        //     store.validator = Config.API_URL_BASE + "paymentGateways/google/payments?u=" + $scope.currUser.id;
        //
        //     store.register({
        //         id: "lt.vertex.flirtas.purchase.vip",
        //         alias: "vip",
        //         type: store.PAID_SUBSCRIPTION
        //     });
        //
        //     store.when("product").approved(function(product) {
        //         $ionicLoading.show({ template: __("Please wait") + '..'});
        //         product.verify();
        //     });
        //
        //     store.when("product").verified(function(product) {
        //         $scope.currUser.isVip = true;
        //         $ionicLoading.hide();
        //
        //         product.finish();
        //
        //         $ionicPopup.alert({
        //             title: __("Payment successful"),
        //             template: __("Done - Thanks for buying VIP membership."),
        //             buttons: [
        //                 { text: __("Cool, thanks!") }
        //             ]
        //         });
        //     });
        //
        //     store.ready(function() {
        //         $scope.$apply(function() {
        //             $scope.purchaseOptions = [
        //                 {
        //                     buy: function() { store.order("vip"); },
        //                     cost: '€3',
        //                     numDays: 30
        //                 }
        //             ];
        //         });
        //     });
        //
        //     store.refresh();
        // }
    });