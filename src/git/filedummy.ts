import { Logger } from "../util/logger";
import { GitFile } from "./filefactory";

export class GitFileDummy implements GitFile {
    public constructor(fileName: string) {
        Logger.getInstance().info(
            `Will not try to blame file "${
                fileName
            }" as it is outside of the current workspace`,
        );
    }

    public onDispose(): void {
        // noop
    }

    public blame(): Promise<undefined> {
        return Promise.resolve(undefined);
    }

    public dispose(): void {
        // noop
    }
}
