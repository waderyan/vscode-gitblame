import { execFile, ExecOptions } from "child_process";

import { ErrorHandler } from "./errorhandler";

export function execute(
    command: string,
    args: string[],
    options: ExecOptions = {},
): Promise<string> {
    return new Promise((resolve) => {
        ErrorHandler.logCommand(`${command} ${args.join(" ")}`);
        execFile(
            command,
            args,
            options,
            execFileCallback(command, resolve, reject),
        );
    });
}

function execFileCallback(command, resolve, reject) {
    return (error: NodeJS.ErrnoException, stdout, stderr) => {
        if (!error) {
            return resolve(stdout);
        }

        if (error.code === "ENOENT") {
            const message = `${command}: No such file or directory. (ENOENT)`;
            ErrorHandler.logCritical(error, message);
            return resolve("");
        }

        ErrorHandler.logError(new Error(stderr));
        return resolve("");
    };
}
