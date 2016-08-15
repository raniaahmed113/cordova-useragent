angular.module('hotvibes.services')

    .service('Billing', function ($q, $window, AuthService, Payment) {
        this.PRODUCT_CREDITS_200 = 'lt.vertex.flirtas.purchase.credits200';
        this.PRODUCT_CREDITS_500 = 'lt.vertex.flirtas.purchase.credits500';
        this.PRODUCT_SUBSCRIPTION_VIP_WEEKLY = 'lt.vertex.flirtas.purchase.vipweekly';
        this.PRODUCT_SUBSCRIPTION_VIP_MONTHLY = 'lt.vertex.flirtas.purchase.vipmontly';
        this.PRODUCT_SUBSCRIPTION_VIP_3_MONTHS = 'lt.vertex.flirtas.purchase.vip3months';

        this.ERROR_PRODUCT_ALREADY_OWNED = -9;
        this.ERROR_UNABLE_TO_CONSUME_ALREADY_OWNED = -9000;

        this.isSupported = function () {
            return !!$window.inAppPurchase;
        };

        if (!this.isSupported()) {
            return;
        }

        var Billing = this,
            store = $window.inAppPurchase,
            productIds = [
                Billing.PRODUCT_CREDITS_200,
                Billing.PRODUCT_CREDITS_500,
                Billing.PRODUCT_SUBSCRIPTION_VIP_WEEKLY,
                Billing.PRODUCT_SUBSCRIPTION_VIP_MONTHLY,
                Billing.PRODUCT_SUBSCRIPTION_VIP_3_MONTHS
            ];

        /**
         * @param {string} productId
         * @returns {Promise}
         */
        this.purchase = function (productId) {
            var deferred = $q.defer();

            store.ready
                .then(function () {
                    var isSubscription;

                    switch (productId) {
                        case Billing.PRODUCT_SUBSCRIPTION_VIP_WEEKLY:
                        case Billing.PRODUCT_SUBSCRIPTION_VIP_MONTHLY:
                        case Billing.PRODUCT_SUBSCRIPTION_VIP_3_MONTHS:
                            isSubscription = true;
                            break;

                        default:
                            isSubscription = false;
                            break;
                    }

                    var promise = isSubscription ? store.subscribe(productId) : store.buy(productId);

                    return promise.catch(
                        function (error) {
                            error.productId = productId;
                            return $q.reject(error);
                        }
                    );
                })
                .then(consumePurchase, onPurchaseFailed)
                .then(validatePurchase)
                .then(deferred.resolve, onValidationFailed)
                .catch(deferred.reject);

            return deferred.promise;
        };

        // Initialize:
        // getProducts() MUST be called before making purchases
        store.ready = store.getProducts(productIds);

        function consumePurchase(purchase) {
            return store.consume(purchase.productType, purchase.receipt, purchase.signature)
                .then(function () {
                    return purchase;
                });
        }

        function onPurchaseFailed(error) {
            switch (error.code) {
                case Billing.ERROR_PRODUCT_ALREADY_OWNED:
                    return store.restorePurchases()
                        .then(function (purchases) {
                            var pendingPurchase;

                            for (var i=0; i<purchases.length; i++) {
                                if (purchases[i].productId === error.productId) {
                                    pendingPurchase = purchases[i];
                                    break;
                                }
                            }

                            if (!pendingPurchase) {
                                return $q.reject({
                                    code: Billing.ERROR_UNABLE_TO_CONSUME_ALREADY_OWNED,
                                    message: "Unable to find owned consumable item for productId: " + error.productId
                                });
                            }

                            return consumePurchase(pendingPurchase);
                        });

                default:
                    return $q.reject(error);
            }
        }

        function validatePurchase(purchase) {
            var gateway;

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

            var payment = new Payment();
            payment.id = purchase.productId;
            payment.transaction = purchase;

            return payment.$save({
                gateway: gateway,
                u: AuthService.getCurrentUser().id
            });
        }

        function onValidationFailed(error) {
            // FIXME: implement this
            return $q.reject(error);
        }
    });
