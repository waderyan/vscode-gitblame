import child_process = require('child_process');

import { ErrorHandler } from './errorhandler';


export function execute(command: string, options: child_process.ExecOptions = {}): Promise<string> {
    return new Promise((resolve, reject) => {
        ErrorHandler.getInstance().logCommand(command);
        child_process.exec(command, options, (error, stdout, stderr) => {
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
