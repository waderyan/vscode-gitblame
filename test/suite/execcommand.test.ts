import * as assert from "assert";

import { execute } from "../../src/util/execcommand";
import { getGitCommand } from "../../src/git/util/gitcommand";

suite("Execute Command", (): void => {
    test("Simple command", async (): Promise<void> => {
        const gitCommand = await getGitCommand();
        const commandResult = await execute(gitCommand, ["--version"]);

        assert.ok(commandResult);
    });

    test("Unavalible command", async (): Promise<void> => {
        const commandResult = await execute("not-a-real-command", []);

        assert.strictEqual(commandResult, "");
    });
});
