import * as assert from "assert";

import { execute } from "../src/util/execcommand";

suite("Execute Command", (): void => {
    test("Simple command", async (): Promise<void> => {
        const commandResult = await execute("git", ["--version"]);

        assert.ok(commandResult);
    });

    test("Unavalible command", async (): Promise<void> => {
        const commandResult = await execute("not-a-real-command", []);

        assert.equal(commandResult, "");
    });
});
