import { container, injectable } from "tsyringe";

import { ErrorHandler } from "../util/errorhandler";
import { GitFile } from "./filefactory";
import {
    blankBlameInfo,
    GitBlameInfo,
} from "./util/blanks";

@injectable()
export class GitFileDummy implements GitFile {
    public constructor(fileName: string) {
        container.resolve(ErrorHandler).logInfo(
            `Will not try to blame file "${
                fileName
            }" as it is outside of the current workspace`,
        );
    }

    public registerDisposeFunction(): void {
        // noop
    }

    public async blame(): Promise<GitBlameInfo> {
        return blankBlameInfo();
    }

    public dispose(): void {}
}
