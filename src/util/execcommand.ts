import { execFile, ExecOptions, ExecException } from "child_process";

import { ErrorHandler } from "./errorhandler";
import { container } from "tsyringe";

export interface Executor {
    execute(
        command: string,
        args: string[],
        options?: ExecOptions,
    ): Promise<string>;
}

export class ExecutorImpl implements Executor {
    public execute(
        command: string,
        args: string[],
        options: ExecOptions = {},
    ): Promise<string> {
        return new Promise((resolve): void => {
            container.resolve<ErrorHandler>("ErrorHandler")
                .logCommand(`${command} ${args.join(" ")}`);

            execFile(
                command,
                args,
                options,
                this.execFileCallback(command, resolve),
            );
        });
    }

    private execFileCallback(
        command: string,
        resolve: (result: string) => void,
    ): (
            error: ExecException | null,
            stdout: string,
            stderr: string,
        ) => void {
        return (
            error: ExecException | null,
            stdout: string,
            stderr: string,
        ): void => {
            if (!error) {
                resolve(stdout);
                return;
            }

            if (error.code?.toString() === "ENOENT") {
                const message = `${
                    command
                }: No such file or directory. (ENOENT)`;
                container.resolve<ErrorHandler>("ErrorHandler")
                    .logCritical(error, message);
                resolve("");
                return;
            }

            container.resolve<ErrorHandler>("ErrorHandler")
                .logError(new Error(stderr));
            resolve("");
            return;
        };
    }
}
