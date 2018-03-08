import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';

import { Uri } from 'vscode';

import { getGitCommand } from '../util/gitcommand';
import { GitBlame } from './blame';
import { ErrorHandler } from '../util/errorhandler';
import { Property, Properties } from '../util/property';
import { GitCommitInfo, GitCommitAuthor } from '../interfaces';

export class GitBlameStream extends EventEmitter {
    private file: Uri;
    private workTree: string;
    private process: ChildProcess;
    private emittedCommits: { [hash: string]: true } = {};

    constructor(file: Uri, workTree: string) {
        super();

        this.file = file;
        this.workTree = workTree;

        getGitCommand().then((gitCommand) => {
            const args = this.generateArguments();
            const spawnOptions = {
                cwd: workTree
            };

            ErrorHandler.getInstance().logCommand(
                `${gitCommand} ${args.join(' ')}`
            );

            this.process = spawn(gitCommand, args, spawnOptions);

            this.setupListeners();
        });
    }

    private generateArguments(): string[] {
        const processArguments = [];

        processArguments.push('blame');

        if (Property.get(Properties.IgnoreWhitespace)) {
            processArguments.push('-w');
        }

        processArguments.push('--incremental');
        processArguments.push('--');
        processArguments.push(this.file.fsPath);

        return processArguments;
    }

    private setupListeners(): void {
        this.process.addListener('close', (code) => this.close());
        this.process.stdout.addListener('data', (chunk) => {
            this.data(chunk.toString());
        });
        this.process.stderr.addListener('data', (error: Error) =>
            this.close(error)
        );
    }

    private close(err: Error = null): void {
        this.emit('end', err);
    }

    private data(dataChunk: string): void {
        const lines = dataChunk.split('\n');
        let commitInfo = this.getCommitTemplate();

        lines.forEach((line, index) => {
            if (line && line != 'boundary') {
                const [all, key, value] = Array.from(line.match(/(.*?) (.*)/));
                if (
                    /[a-z0-9]{40}/.test(key) &&
                    lines.hasOwnProperty(index + 1) &&
                    /^(author|committer)/.test(lines[index + 1]) &&
                    commitInfo.hash !== ''
                ) {
                    this.commitInfoToCommitEmit(commitInfo);
                    commitInfo = this.getCommitTemplate();
                }
                this.processLine(key, value, commitInfo);
            }
        });

        this.commitInfoToCommitEmit(commitInfo);
    }

    private processLine(
        key: string,
        value: string,
        commitInfo: GitCommitInfo
    ): void {
        if (key === 'author') {
            commitInfo.author.name = value;
        } else if (key === 'author-mail') {
            commitInfo.author.mail = value;
        } else if (key === 'author-time') {
            commitInfo.author.timestamp = parseInt(value, 10);
        } else if (key === 'author-tz') {
            commitInfo.author.tz = value;
        } else if (key === 'committer') {
            commitInfo.committer.name = value;
        } else if (key === 'committer-mail') {
            commitInfo.committer.mail = value;
        } else if (key === 'committer-time') {
            commitInfo.committer.timestamp = parseInt(value, 10);
        } else if (key === 'committer-tz') {
            commitInfo.committer.tz = value;
        } else if (key === 'summary') {
            commitInfo.summary = value;
        } else if (key.length === 40) {
            commitInfo.hash = key;

            const hash = key;
            const [originalLine, finalLine, lines] = value
                .split(' ')
                .map((a) => parseInt(a, 10));

            this.lineGroupToLineEmit(hash, lines, finalLine);
        }
    }

    private lineGroupToLineEmit(
        hash: string,
        lines: number,
        finalLine: number
    ): void {
        for (let i = 0; i < lines; i++) {
            this.emit('line', finalLine + i, GitBlame.internalHash(hash));
        }
    }

    private commitInfoToCommitEmit(commitInfo: GitCommitInfo): void {
        const internalHash = GitBlame.internalHash(commitInfo.hash);

        if (!this.emittedCommits[internalHash]) {
            this.emittedCommits[internalHash] = true;
            this.emit('commit', internalHash, commitInfo);
        }
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
