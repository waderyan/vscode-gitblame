import { ErrorHandler } from "../util/errorhandler";
import { GitFile } from "./filefactory";
import { BlameInfo, blankBlameInfo } from "./util/blanks";

export class GitFileDummy implements GitFile {
    public constructor(fileName: string) {
        ErrorHandler.getInstance().logInfo(
            `Will not try to blame file "${
                fileName
            }" as it is outside of the current workspace`,
        );
    }

    public registerDisposeFunction(): void {
        // noop
    }

    public blame(): Promise<BlameInfo> {
        return Promise.resolve(blankBlameInfo());
    }

    public dispose(): void {
        // noop
    }
}
