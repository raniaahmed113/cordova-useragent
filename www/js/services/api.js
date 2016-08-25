angular.module('hotvibes.services')

    .service('Api', function($injector, ErrorCode, __) {
        var $_http;

        /**
         * @returns {$http}
         */
        this.request = function() {
            if (!$_http) {
                $_http = $injector.get('$http');
            }

            return $_http;
        };

        this.translateErrorCode = function(code) {
            switch (code) {
                case ErrorCode.INVALID_CREDENTIALS:
                    return __("Invalid username or password");

                case ErrorCode.NOT_ENOUGH_CREDITS:
                    return __("Sorry, you dont have enough x");

                case ErrorCode.VIP_REQUIRED:
                    return __("Available only for VIP members");

                case ErrorCode.PHOTO_IS_REQUIRED_HERE:
                    return __("Please first upload your profile photo");

                case ErrorCode.MEMBER_HAS_BLOCKED_YOU:
                    return __("You are blocked by this member");

                case ErrorCode.MUST_WAIT_FOR_REPLY:
                    return __("You can't send a file unless a member replyed to your message.");

                case ErrorCode.ALREADY_DID_THAT:
                    return __("Already invited"); // FIXME: this shouldn't be done globally

                case ErrorCode.CANT_PERFORM_ACTION_ON_SELF:
                    return __("Fatal error. You cannot do this :(");

                case ErrorCode.TEXT_TOO_SHORT:
                    return __("Please enter some text first.");

                case ErrorCode.EMAIL_ALREADY_TAKEN:
                    return __('Tokiu emailu vartotojas jau egzistuoja');

                case ErrorCode.USERNAME_ALREADY_TAKEN:
                    return __('User with such login already exists.');

                case ErrorCode.INAPPROPRIATE_CONTENT:
                    return __('Your message was not sent because it contains inappropriate language or spam');

                case ErrorCode.PERFORMING_ACTIONS_TOO_FAST:
                    return __('You are performing actions too fast. Please wait a little and try again.');

                case ErrorCode.PHONE_NUMBER_ALREADY_TAKEN:
                    return __("Your phone number is already registered.");

                case ErrorCode.YOU_ARE_BANNED:
                    return __("Sorry, but you are banned.");

                default:
                    // TODO: log to analytics: unknown err code
                    return __("We're sorry, but something went wrong. Please try again later.");
            }
        };

        this.formatFilter = function(filter) {
            var output = {};

            angular.forEach(filter, function(value, key) {
                if (key == 'type' || key == '$resolved') {
                    return;
                }

                if (typeof value === 'boolean') {
                    if (!value) {
                        return;
                    }

                    value = 1;

                } else if (angular.isArray(value)) {
                    value = value.join(',');

                } else if (angular.isObject(value)) {
                    var transformed = [];

                    angular.forEach(value, function(propertyVal, propertyName) {
                        if (propertyVal !== true) {
                            return;
                        }

                        transformed.push(propertyName);
                    });

                    value = transformed.join(',');
                }

                output[key] = value;
            });

            return output;
        };
    });
