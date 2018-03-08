import { execFile, ExecOptions } from "child_process";

import { ErrorHandler } from "./errorhandler";

export function execute(
    command: string,
    args: string[],
    options: ExecOptions = {},
): Promise<string> {
    return new Promise((resolve, reject) => {
        ErrorHandler.getInstance().logCommand(`${command} ${args.join(" ")}`);
        execFile(
            command,
            args,
            options,
            (error, stdout, stderr) => {
                if (error) {
                    ErrorHandler.getInstance().logError(new Error(stderr));
                    resolve("");
                } else {
                    resolve(stdout);
                }
            },
        );
    });
}
