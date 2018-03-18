import * as assert from "assert";

import { execute } from "../src/util/execcommand";

suite("Execute Command", () => {
    test("Simple command", async () => {
        const commandResult = await execute("git", ["--version"]);

        assert.ok(commandResult);
    });

    test("Unavalible command", async () => {
        const commandResult = await execute("not-a-real-command", []);

        assert.equal(commandResult, "");
    });
});
