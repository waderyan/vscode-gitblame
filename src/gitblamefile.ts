import {handleErrorToLog} from './errorhandler';
import {Uri, workspace, WorkspaceConfiguration} from 'vscode';
import {execute} from './execcommand';
import {GitBlame} from './gitblame';
import {IGitBlameInfo, IGitRepositoryInformation, IGitCommitInfo, IGitCommitLine} from './gitinterfaces';
import {getGitCommand} from './getgitcommand';
import * as gitBlameShell from 'git-blame';
import * as Path from 'path';

export class GitBlameFile {
    public fileName: Uri;
    public blameInfo: IGitBlameInfo = null;

    private workTree: string = null;
    private repository: string = null;
    private workingOn: Promise<IGitBlameInfo> = null;
    private properties: WorkspaceConfiguration;

    private workTreePromise: Promise<string> = null;
    private repositoryPromise: Promise<string> = null;

    constructor(fileName: string) {
        this.fileName = Uri.file(fileName);
        this.properties = workspace.getConfiguration('gitblame');
    }

    async getGitInfo(): Promise<IGitRepositoryInformation> {
        await this.findGitRepository();

        return Promise.resolve({
            workTree: this.workTree,
            repository: this.repository
        });
    }

    private async findGitRepository(): Promise<void> {
        if (this.workTree && this.repository) return Promise.resolve();

        this.workTreePromise = this.workTreePromise || this.findWorkTree(this.fileName);
        this.repositoryPromise = this.repositoryPromise || this.findRepository(this.fileName);

        try {
            [this.workTree, this.repository] = await Promise.all([this.workTreePromise, this.repositoryPromise]);
        } catch (err) {
            handleErrorToLog(err);
        }

    }

    hasBlameInfo(): boolean {
        return this.blameInfo !== null;
    }

    changed(): void {
        this.blameInfo = null;
    }

    private async findRepository(path: Uri): Promise<string> {
        return this.executeGitRevParseCommandInPath('--git-dir', path);
    }

    private async findWorkTree(path: Uri): Promise<string> {
        return this.executeGitRevParseCommandInPath('--show-toplevel', path);
    }

    private async executeGitRevParseCommandInPath(command: string, path: Uri): Promise<string> {
        const currentDirectory = Path.dirname(path.fsPath);
        const gitCommand = getGitCommand();
        const gitRev = await execute(`${gitCommand} rev-parse ${command}`, {
            cwd: currentDirectory
        });
        const cleanGitRev = gitRev.trim();

        if (cleanGitRev === '.git') {
            return Path.join(currentDirectory, '.git');
        }
        else {
            return cleanGitRev;
        }
    }

    async blame(): Promise<IGitBlameInfo> {
        if (this.hasBlameInfo()) {
            return Promise.resolve(this.blameInfo);
        }

        this.workingOn = this.workingOn || new Promise<IGitBlameInfo>(async (resolve, reject) => {
            const repositoryInfo = await this.getGitInfo();
            const blameInfo = GitBlame.blankBlameInfo();
            const gitBlameOptions = {
                file: this.fileName.fsPath,
                workTree: repositoryInfo.workTree,
                rev: false,
                ignoreWhitespace: this.properties.get('ignoreWhitespace')
            };
            const gitStream = gitBlameShell(repositoryInfo.repository, gitBlameOptions, getGitCommand());

            gitStream.on('data', (type, data) => {
                if (type === 'line') {
                    blameInfo['lines'][data.finalLine] = <IGitCommitLine>data;
                }
                else if (type === 'commit' && !(data.hash in blameInfo['commits'])) {
                    blameInfo['commits'][data.hash] = <IGitCommitInfo>data;
                }
            }).on('end', () => {
                this.blameInfo = blameInfo;
                this.workingOn = null;
                resolve(this.blameInfo);
            }).on('error', (err) => {
                this.workingOn = null;
                this.blameInfo = GitBlame.blankBlameInfo();
                reject(err);
            });
        });

        return this.workingOn;
    }
}
