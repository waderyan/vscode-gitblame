import { container } from "tsyringe";
import { TextDocument } from "vscode";
import { SinonSpy, spy } from "sinon";

import { blankCommitInfo, GitCommitInfo } from "../../src/git/util/blanks";
import { GitBlame, GitBlameImpl } from "../../src/git/blame";

export function initGitBlameSpy(): {
    blameLineSpy: SinonSpy;
    removeDocumentSpy: SinonSpy;
    disposeSpy: SinonSpy;
    nextEmptyCommit: () => void;
    nextCrash: () => void;
} {
    const blameLineSpy = spy();
    const removeDocumentSpy = spy();
    const disposeSpy = spy();
    let emptyCommit = false;
    const nextEmptyCommit = (): void => {
        emptyCommit = true;
    }
    let crash = false;
    const nextCrash = (): void => {
        crash = true;
    }

    container.register<GitBlame>("GitBlame", {
        useClass: class implements GitBlame {
            public blameLine(
                document: TextDocument,
                lineNumber: number,
            ): Promise<GitCommitInfo> {
                blameLineSpy(document, lineNumber);

                if (emptyCommit) {
                    emptyCommit = false;
                    return Promise.resolve(blankCommitInfo());
                }

                if (crash) {
                    crash = false;
                    throw new Error('Cool test error.');
                }

                return Promise.resolve({
                    hash: "1234567890123456789012345678901234567890",
                    author: {
                        name: "Authorname",
                        mail: "author@mail.example",
                        timestamp: 1337,
                        tz: "+0200",
                    },
                    committer: {
                        name: "Commitername",
                        mail: "committer@mail.example",
                        timestamp: 1338,
                        tz: "+0300",
                    },
                    summary: "Fake commit",
                    filename: "fake/file.name",
                });
            }
            public removeDocument(document: TextDocument): Promise<void> {
                removeDocumentSpy(document);
                return Promise.resolve();
            }
            public dispose(): void {
                disposeSpy();
            }
        },
    });

    return {
        removeDocumentSpy,
        blameLineSpy,
        disposeSpy,
        nextEmptyCommit,
        nextCrash,
    }
}

export function restoreGitBlame(): void {
    container.register<GitBlame>("GitBlame", {
        useClass: GitBlameImpl,
    });
}
