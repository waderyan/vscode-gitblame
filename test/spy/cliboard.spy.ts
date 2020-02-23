import { SinonSpy, spy } from "sinon";
import { container } from "tsyringe";

import { Clipboard, ClipboardImpl } from "../../src/vscode-api/clipboard";

export function initClipboardSpy(): {
    writeSpy: SinonSpy;
    enableWriteThrow: () => void;
    disableWriteThrow: () => void;
} {
    const writeSpy = spy();
    let shouldThrow = false;

    container.register<Clipboard>("Clipboard", {
        useClass: class implements Clipboard {
            public write(text: string): Promise<void> {
                if (shouldThrow) {
                    return Promise.reject();
                }

                writeSpy(text);
                return Promise.resolve();
            }
        },
    });

    return {
        writeSpy,
        enableWriteThrow: (): void => {
            shouldThrow = true;
        },
        disableWriteThrow: (): void => {
            shouldThrow = false;
        },
    }
}

export function restoreClipboard(): void {
    container.register<Clipboard>("Clipboard", {
        useClass: ClipboardImpl,
    });
}
