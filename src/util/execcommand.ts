import { ChildProcess, execFile, ExecOptions } from "child_process";

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
    public async execute(
        command: string,
        args: string[],
        options: ExecOptions = {},
    ): Promise<string> {
        container.resolve<ErrorHandler>("ErrorHandler")
            .logCommand(`${command} ${args.join(" ")}`);

        let execution: ChildProcess;

        try {
            execution = execFile(
                command,
                args,
                { ...options, encoding: "utf8" },
            );
            if (execution.stdout === null) {
                return "";
            }
        } catch (err) {
            container.resolve<ErrorHandler>("ErrorHandler").logError(err);
            return "";
        }

        let data = "";

        for await (const chunk of execution.stdout) {
            data += chunk;
        }

        return data.trim();
    }
}
