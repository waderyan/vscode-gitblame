import child_process = require('child_process');
import { EventEmitter } from 'events';

import { Uri } from 'vscode';

import { getGitCommand } from '../util/gitcommand';
import { ErrorHandler } from '../util/errorhandler';
import {
    getProperty,
    Properties } from '../util/configuration';
import {
    GitCommitInfo,
    GitCommitAuthor,
    GitCommitLine,
    GitStreamLine,
    GitIncrementLine } from '../interfaces';


export class GitBlameStream extends EventEmitter {
    private file: Uri;
    private workTree: string;
    private process: child_process.ChildProcess;
    private emittedCommits: { [hash: string]: true } = {};

    constructor(file: Uri, workTree: string) {
        super();

        this.file = file;
        this.workTree = workTree;

        const args = this.generateArguments();
        const gitCommand = getGitCommand();
        const spawnOptions = {
            cwd: workTree
        }

        ErrorHandler.getInstance().logCommand(`${gitCommand} ${args.join(' ')}`);

        this.process = child_process.spawn(gitCommand, args, spawnOptions);

        this.setupListeners();
    }

    private generateArguments(): string[] {
        const processArguments = [];

        processArguments.push(`blame`);

        if (getProperty(Properties.IgnoreWhitespace)) {
            processArguments.push('-w');
        }

        processArguments.push('--incremental');
        processArguments.push('--');
        processArguments.push(this.file.fsPath);

        return processArguments;
    }

    private setupListeners() {
        this.process.addListener('close', (code) => this.close(code));
        this.process.stdout.addListener('data', (chunk) => this.data(chunk));
        this.process.stderr.addListener('data', (error: Error) => this.errorData(error));
    }

    private close(code: number): void {
        if (code === 0 || code === null) {
            this.emit('end');
        }
    }

    private data(dataChunk: Buffer | string): void {
        const lines = dataChunk.toString().split('\n');
        let commitInfo = this.getCommitTemplate();

        lines.forEach((line, index) => {
            if (line && line != 'boundary') {
                const [all, key, value] = Array.from(line.match(/(.*?) (.*)/));
                if (/[a-z0-9]{40}/.test(key) && lines.hasOwnProperty(index + 1) && /^(author|committer)/.test(lines[index + 1]) && commitInfo.hash !== '') {
                    this.commitInfoToCommitEmit(commitInfo);
                    commitInfo = this.getCommitTemplate();
                }
                this.processLine({key, value}, commitInfo);
            }
        });

        this.commitInfoToCommitEmit(commitInfo);
    }

    private processLine(line: GitIncrementLine, commitInfo: GitCommitInfo): void {
        if (line.key === 'author') {
            commitInfo.author.name = line.value;
        }
        else if (line.key === 'author-mail') {
            commitInfo.author.mail = line.value;
        }
        else if (line.key === 'author-time') {
            commitInfo.author.timestamp = parseInt(line.value, 10);
        }
        else if (line.key === 'author-tz') {
            commitInfo.author.tz = line.value;
        }
        else if (line.key === 'committer') {
            commitInfo.committer.name = line.value;
        }
        else if (line.key === 'committer-mail') {
            commitInfo.committer.mail = line.value;
        }
        else if (line.key === 'committer-time') {
            commitInfo.committer.timestamp = parseInt(line.value, 10);
        }
        else if (line.key === 'committer-tz') {
            commitInfo.committer.tz = line.value;
        }
        else if (line.key === 'summary') {
            commitInfo.summary = line.value;
        }
        else if (line.key.length === 40) {
            commitInfo.hash = line.key;

            const hash = line.key;
            const [originalLine, finalLine, lines] = line.value.split(' ').map((a) => parseInt(a, 10));

            this.lineGroupToLineEmit({hash, originalLine, finalLine, lines});
        }
    }

    private lineGroupToLineEmit(lineGroup: GitStreamLine): void {
        for (let i = 0; i < lineGroup.lines; i++) {
            this.emit('line', <GitCommitLine>{
                hash: lineGroup.hash,
                lineNumber: lineGroup.finalLine + i
            });
        }
    }

    private commitInfoToCommitEmit(commitInfo): void {
        if (!this.emittedCommits[commitInfo.hash]) {
            this.emittedCommits[commitInfo.hash] = true;
            this.emit('commit', commitInfo);
        }
    }

    private errorData(error: Error): void {
        this.emit('error', error);
    }

    private getCommitTemplate(): GitCommitInfo {
        return {
            hash: '',
            author: {
                name: '',
                mail: '',
                timestamp: 0,
                tz: ''
            },
            committer: {
                name: '',
                mail: '',
                timestamp: 0,
                tz: ''
            },
            summary: '',
            filename: this.file.fsPath.replace(this.workTree, '')
        };
    }

    terminate(): void {
        this.dispose();
    }

    dispose(): void {
        this.process.kill('SIGKILL');
        this.process.removeAllListeners();
    }
}
