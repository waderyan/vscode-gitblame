import { ChildProcess, execFile, ExecOptions } from "child_process";

import { ErrorHandler } from "./errorhandler";

export async function execute(
    command: string,
    args: string[],
    options: ExecOptions = {},
): Promise<string> {
    ErrorHandler.getInstance().logCommand(`${command} ${args.join(" ")}`);

    let execution: ChildProcess;

    try {
        execution = execFile(
            command,
            args,
            { ...options, encoding: "utf8" },
        );
    } catch (err) {
        ErrorHandler.getInstance().logError(err);
        return "";
    }

    if (execution.stdout === null) {
        return "";
    }

    let data = "";

    for await (const chunk of execution.stdout) {
        data += chunk;
    }

    return data.trim();
}
