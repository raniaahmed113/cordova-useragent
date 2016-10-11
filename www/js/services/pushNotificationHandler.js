angular.module('hotvibes.services')

    .service('PushNotificationHandler', function($window, $rootScope, $state, AuthService, Device) {

        var PushNotificationHandler = this,
            PushNotification = null,
            push = null,
            deviceId = null,
            token = null;

        function checkCurrentRegistration() {
            Device.get({ id: deviceId }).$promise
                .catch(function(error) {
                    if (error.status == 404 /* Not Found */) {
                        // Get a new device token and re-register this device with the API
                        deviceId = null;
                        localStorage.removeItem('deviceId');
                        push.unregister(PushNotificationHandler.init);
                    }
                });
        }

        function onDeviceRegistered(data) {
            if (deviceId && data.registrationId == token) {
                checkCurrentRegistration();
                return;
            }

            var currentUser = AuthService.getCurrentUser();
            if (!currentUser) {
                // This might happen if GCM registration happens after user disconnect (eg.: if accessToken is invalidated)
                return;
            }

            token = data.registrationId;
            localStorage['deviceToken'] = token;

            if (deviceId) {
                currentUser.unregisterDevice(deviceId);
            }

            currentUser.registerDevice(token).then(function(device) {
                deviceId = device.id;
                localStorage['deviceId'] = deviceId;
            });
        }

        function onReceivedNotification(notification) {
            $rootScope.$apply(function() {
                $rootScope.$broadcast(
                    notification.additionalData._type,
                    notification.additionalData.payload
                );
            });

            // iOS gives us 30 seconds to handle our background notification
            // Let's notify the system that we have finished and our app process could be killed now
            push.finish();
        }

        function onClickedNotification(notification) {
            // TODO: test, if push.finish(); is required here

            switch (notification.additionalData._type) {
                case 'newMessage.received':
                    $state.go('inside.conversations-single', { id: notification.additionalData.payload.conversationId });
                    break;
            }
        }

        this.init = function() {
            PushNotification = $window.PushNotification;

            token = localStorage['deviceToken'];
            deviceId = localStorage['deviceId'];

            push = PushNotification.init({
                android: {
                    senderID: 957136533015
                },
                ios: {
                    alert: true,
                    badge: true,
                    sound: true/*,
                    categories: {
                        newMessage: {
                            yes: {
                                title: __('Reply'), callback: 'message.reply', destructive: false, foreground: false
                            },
                            no: {
                                title: __('Mark as read'), callback: 'message.markAsRead', destructive: false, foreground: false
                            }
                        }
                    }*/
                },
                windows: {}
            });

            push.on('registration', onDeviceRegistered);
            push.on('notification', function(notification) {
                if (!notification.additionalData || !notification.additionalData._type) {
                    // Malformed notification received. Ignore it
                    return;
                }

                if (notification.additionalData._deviceId != deviceId) {
                    unregister(notification.additionalData._deviceId);
                    return;
                }

                if (notification.additionalData.coldstart && !notification.additionalData.foreground) {
                    onClickedNotification(notification);
                    return;
                }

                onReceivedNotification(notification);
            });
        };

        this.getToken = function() {
            return token;
        };

        this.unregister = function(deviceToBeUnregisteredId) {
            if (!deviceToBeUnregisteredId) {
                if (!deviceId) {
                    return;
                }

                deviceToBeUnregisteredId = deviceId;
            }

            AuthService.getCurrentUser().unregisterDevice(deviceToBeUnregisteredId);

            if (deviceToBeUnregisteredId == deviceId) {
                token = null;
                deviceId = null;

                localStorage.removeItem('deviceId');
                localStorage.removeItem('deviceToken');

                push.unregister(function () {
                    // Push plugin quirk: requires a callback function even if it does nothing
                });
            }
        };
    });
