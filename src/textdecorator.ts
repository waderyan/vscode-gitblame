import * as moment from 'moment';
import * as ObjectPath from 'object-path';

export class TextDecorator {

    static toTextView(commit: Object) : string {
        const dateNow = new Date();
        const author = commit['author'];
        const dateText = TextDecorator.toDateText(dateNow, new Date(author['timestamp'] * 1000));

        if (commit['hash'] === '0000000000000000000000000000000000000000') {
            return author['name'];
        }
        else {
            return 'Blame ' + author['name'] + ' ( ' + dateText + ' )';
        }
    }

    static toDateText(dateNow: Date, dateThen: Date) : string {

        const momentNow = moment(dateNow);
        const momentThen = moment(dateThen);

        const months = momentNow.diff(momentThen, 'months');
        const days = momentNow.diff(momentThen, 'days');
        const hours = momentNow.diff(momentThen, 'hours');
        const minutes = momentNow.diff(momentThen, 'minutes');

        if (minutes <= 4) {
            return 'right now';
        }
        else if (minutes <= 70) {
            return minutes + ' minutes ago';
        }
        else if (hours <= 47) {
            return hours + ' hours ago';
        }
        else if (days <= 40) {
            return days + ' days ago';
        }
        else {
            return months + ' months ago';
        }
    }

    static parseTokens(target: string, tokens: object = {}): string {
        const tokenRegex = /\$\{([a-z\.\-]{1,})[,]*(|[a-z\-,]{1,})}/gi;

        return target.replace(tokenRegex, (string: string, key: string, value: string): string => {
            let currentToken = ObjectPath.get(tokens, key)

            if (typeof currentToken === 'string') {
                return currentToken;
            }
            else if (typeof currentToken === 'number') {
                return currentToken.toString();
            }
            else if (typeof currentToken === 'function') {
                let values = value.split(',');
                let newString = currentToken.call(this, key, values);

                if (typeof newString === 'string') {
                    return newString;
                }
                else if (typeof newString === 'number') {
                    return newString.toString();
                }
            }

            return key;
        });
    }
}
