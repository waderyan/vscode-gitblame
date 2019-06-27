import { ErrorHandler } from "../util/errorhandler";
import { GitFile } from "./filefactory";
import {
    blankBlameInfo,
    GitBlameInfo,
} from "./util/blanks";

export class GitFileDummy implements GitFile {
    public constructor(fileName: string) {
        ErrorHandler.logInfo(
            `Will not try to blame file "${
                fileName
            }" as it is outside of the current workspace`,
        );
    }

    public async blame(): Promise<GitBlameInfo> {
        return blankBlameInfo();
    }

    public dispose(): void {}
}
