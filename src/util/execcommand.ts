import { ChildProcess, execFile, ExecOptions } from "child_process";

import { Logger } from "./logger";

export async function execute(
    command: string,
    args: string[],
    options: ExecOptions = {},
): Promise<string> {
    Logger.command(`${command} ${args.join(" ")}`);

    let execution: ChildProcess;

    try {
        execution = execFile(command, args, { ...options, encoding: "utf8" });
    } catch (err) {
        Logger.error(err);
        return "";
    }

    if (!execution.stdout) {
        return "";
    }

    let data = "";

    for await (const chunk of execution.stdout) {
        data += chunk;
    }

    return data.trim();
}
