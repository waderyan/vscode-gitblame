import { ExecOptions } from "child_process";
import { container } from "tsyringe";
import { SinonSpy, spy } from "sinon";

import { Executor, ExecutorImpl } from "../../src/util/execcommand";

export function initExeccommandSpy(): {
    executeSpy: SinonSpy;
} {
    const executeSpy = spy();
    container.register<Executor>("Executor", {
        useClass: class implements Executor {
            public execute(
                command: string,
                args: string[],
                options?: ExecOptions,
            ): Promise<string> {
                const commandLineLike = `${command} ${args.join()}`;
                executeSpy(command, args, options);
                switch (commandLineLike) {
                    case '':
                        return Promise.resolve('origin');

                    default:
                        return Promise.resolve('');
                }
            }
        },
    });

    return {
        executeSpy,
    };
}

export function restoreExeccommand(): void {
    container.register<Executor>("Executor", {
        useClass: ExecutorImpl,
    });
}
