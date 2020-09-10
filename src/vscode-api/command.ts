import type { Thenable } from "../../types/thenable";

import { commands } from "vscode";

export interface Command {
    execute<T>(
        command: string,
        ...commandArguments: T[]
    ): Thenable<unknown>;
}

export class CommandImpl implements Command {
    public execute<T>(
        command: string,
        ...commandArguments: T[]
    ): Thenable<unknown> {
        return commands.executeCommand(command, ...commandArguments);
    }
}
