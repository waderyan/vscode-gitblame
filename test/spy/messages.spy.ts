import type { Thenable } from "../../types/thenable";

import { SinonSpy, spy } from "sinon";
import { container } from "tsyringe";

import { MessageService, MessageServiceImpl } from "../../src/view/messages";
import { ActionableMessageItem } from "../../src/util/actionable-message-item";

export function initMessageServiceSpy(): {
    showInfoSpy: SinonSpy;
    showErrorSpy: SinonSpy;
    prepareItemPress: (itemIndex: number) => void;
    unprepareItemPress: () => void;
} {
    const showInfoSpy = spy();
    const showErrorSpy = spy();
    let pressItem = -1;
    const prepareItemPress = (itemIndex: number): void => {
        pressItem = itemIndex;
    }
    const unprepareItemPress = (): void => prepareItemPress(-1);

    container.register<MessageService>("MessageService", {
        useClass: class implements MessageService {
            public showInfo(
                message: string,
                ...items: ActionableMessageItem[]
            ): Thenable<undefined | ActionableMessageItem> {
                showInfoSpy(message, items);

                if (pressItem in items) {
                    return Promise.resolve(items[pressItem]);
                }

                return Promise.resolve(undefined);
            }

            public showError(
                message: string,
                ...items: string[]
            ): Thenable<undefined | string> {
                showErrorSpy(message, items);

                if (pressItem in items) {
                    return Promise.resolve(items[pressItem]);
                }

                return Promise.resolve(undefined);
            }
        },
    });

    return {
        showInfoSpy,
        showErrorSpy,
        prepareItemPress,
        unprepareItemPress,
    };
}

export function restoreMessageService(): void {
    container.register<MessageService>("MessageService", {
        useClass: MessageServiceImpl,
    });
}
