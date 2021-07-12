import { resolve } from 'path';
import { runTests } from 'vscode-test';

async function main(): Promise<void> {
    try {
        // Download VS Code, unzip it and run the integration test
        await runTests({
            extensionDevelopmentPath: resolve(__dirname, '..'),
            extensionTestsPath: resolve(__dirname, 'suite', 'index'),
            launchArgs: [
                "--disable-extensions",
            ],
        });
    } catch (err) {
        process.exit(1);
    }
}

main();
