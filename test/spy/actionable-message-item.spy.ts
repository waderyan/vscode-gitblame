import { SinonSpy, spy } from "sinon";
import { container } from "tsyringe";

import {
    ActionableMessageItem,
    ActionableMessageItemImpl,
} from "../../src/util/actionable-message-item";

export function initClipboardSpy(): {
    writeSpy: SinonSpy;
} {
    const writeSpy = spy();

    container.register<ActionableMessageItem>("ActionableMessageItem", {
        useClass: class implements ActionableMessageItem {
            public title = "NO_TITLE";
            private action: () => void = (): void => {
                return;
            };

            public setTitle(title: string): void {
                this.title = title;
            }

            public setAction(action: () => void): void {
                this.action = action;
            }

            public takeAction(): void {
                this.action();
            }
        },
    });

    return {
        writeSpy,
    }
}

export function restoreActionableMessageItem(): void {
    container.register<ActionableMessageItem>("ActionableMessageItem", {
        useClass: ActionableMessageItemImpl,
    });
}
