import { ErrorHandler } from "../util/errorhandler";
import { GitFile } from "./filefactory";

export class GitFileDummy implements GitFile {
    public constructor(fileName: string) {
        ErrorHandler.getInstance().logInfo(
            `Will not try to blame file "${
                fileName
            }" as it is outside of the current workspace`,
        );
    }

    public setDisposeCallback(): void {
        // noop
    }

    public blame(): Promise<undefined> {
        return Promise.resolve(undefined);
    }

    public dispose(): void {
        // noop
    }
}
