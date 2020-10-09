import { Logger } from "../util/logger";
import { File } from "./filefactory";

export class FileDummy implements File {
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
