import { SinonSpy, spy } from "sinon";
import { container } from "tsyringe";

import { Command, CommandImpl } from "../../src/vscode-api/command";

export function initCommandSpy(): {
    executeSpy: SinonSpy;
} {
    const executeSpy = spy();

    container.register<Command>("Command", {
        useClass: class implements Command {
            public execute<T>(
                command: string,
                ...commandArguments: T[]
            ): Promise<void> {
                executeSpy(command, ...commandArguments);
                return Promise.resolve();
            }
        },
    });

    return {
        executeSpy,
    }
}

export function restoreCommand(): void {
    container.register<Command>("Command", {
        useClass: CommandImpl,
    });
}
