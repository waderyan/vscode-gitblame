import type { Thenable } from "../../types/thenable";

import { env } from "vscode";

export interface Clipboard {
    write(content: string): Thenable<void>;
}

export class ClipboardImpl implements Clipboard {
    public write(content: string): Thenable<void> {
        return env.clipboard.writeText(content);
    }
}
