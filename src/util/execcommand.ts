import child_process = require('child_process');

import { ErrorHandler } from './errorhandler';


export function execute(command: string, args: string[], options: child_process.ExecOptions = {}): Promise<string> {
    return new Promise((resolve, reject) => {
        ErrorHandler.getInstance().logCommand(`${command} ${args.join(' ')}`);
        child_process.execFile(command, args, options, (error, stdout, stderr) => {
            if (error) {
                ErrorHandler.getInstance().logError(new Error(stderr));
                resolve('');
            }
            else {
                resolve(stdout);
            }
        });
    });
}
