import assert = require("assert");

import { execute } from "../src/util/execcommand";

suite("Execute Command", () => {
    test("Simple command", async () => {
        const command = process.platform === "win32" ? "cd" : "pwd";
        const commandResult = await execute(command, []);

        assert.ok(commandResult);
    });

    test("Unavalible command", async () => {
        const commandResult = await execute("not-a-real-command", []);

        assert.equal(commandResult, "");
    });
});
