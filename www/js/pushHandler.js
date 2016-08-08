var __ = require('translate');

function onNotificationReceived(notification) {
    notification.icon = "ic_stat_main";
    notification.iconColor = "#F5C73B";

    switch (notification.type) {
        case 'newMessage':
            notification.style = 'inbox';
            //notification.summaryText = __('There are %n% notifications');
            /*notification.actions = [
                { icon: '', title: __('Replay'), callback: 'message.reply' },
                { icon: '', title: __('Mark as read'), callback: 'message.markAsRead' }
            ];*/
            break;

        case 'newQuickieYes':
            notification.message = __('Some one likes you');
            break;
    }

    return true;
}

module.exports = onNotificationReceived;
