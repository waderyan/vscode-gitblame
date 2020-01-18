import { container } from "tsyringe";

import * as assert from "assert";

import { Executor } from "../../src/util/execcommand";
import { getGitCommand } from "../../src/git/util/gitcommand";

suite("Execute Command", (): void => {
    test("Simple command", async (): Promise<void> => {
        const gitCommand = await getGitCommand();

        const commandResult = await container.resolve<Executor>("Executor")
            .execute(gitCommand, ["--version"]);

        assert.ok(commandResult);
    });

    test("Unavalible command", async (): Promise<void> => {
        const commandResult = await container.resolve<Executor>("Executor")
            .execute("not-a-real-command", []);

        assert.equal(commandResult, "");
    });
});
