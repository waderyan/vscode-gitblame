import {exec, ExecOptions} from 'child_process';

export function execute(command: string, options: ExecOptions = {}): Promise<string> {
    return new Promise((resolve, reject) => {
        exec(command, options, (error, stdout, stderr) => {
            if (error) {
                reject(stderr);
            }
            else {
                resolve(stdout);
            }
        })
    });
}
