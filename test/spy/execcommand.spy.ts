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
                const commandLineLike = `${command} ${args.join(' ')}`;
                executeSpy(command, args, options);

                switch (commandLineLike) {
                    case 'git ls-remote --get-url origin':
                        // get origin
                        return Promise.resolve(
                            'https://github.com/Sertion/vscode-gitblame.git',
                        );

                    case 'git symbolic-ref -q --short HEAD':
                        return Promise.resolve('master');

                    case 'git config --local --get branch.master.remote':
                        return Promise.resolve('origin');

                    case 'git config --local --get remote.origin.url':
                        return Promise.resolve(
                            'https://github.com/Sertion/vscode-gitblame.git',
                        );

                    case 'git rev-parse --show-toplevel':
                        return Promise.resolve('/folder');

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
