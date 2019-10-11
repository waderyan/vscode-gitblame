import * as assert from "assert";

import { Executor } from "../../src/util/execcommand";
import { container } from "tsyringe";

suite("Execute Command", (): void => {
    test("Simple command", async (): Promise<void> => {
        const commandResult = await container.resolve<Executor>("Executor")
            .execute("git", ["--version"]);

        assert.ok(commandResult);
    });

    test("Unavalible command", async (): Promise<void> => {
        const commandResult = await container.resolve<Executor>("Executor")
            .execute("not-a-real-command", []);

        assert.equal(commandResult, "");
    });
});
