import * as assert from "assert";
import { container } from "tsyringe";

import { GitExtension } from "../../src/git/extension";
import { initPropertySpy } from "../spy/property.spy";

suite("Web URL formatting", (): void => {
    const extension = container.resolve<GitExtension>("GitExtension");

    test("https://", (): void => {
        assert.strictEqual(
            extension.defaultWebPath(
                "https://example.com/user/repo.git",
                "hash",
            ),
            "https://example.com/user/repo/commit/hash",
        );
        assert.strictEqual(
            extension.defaultWebPath(
                "https://example.com/user/repo",
                "hash",
            ),
            "https://example.com/user/repo/commit/hash",
        );
    });

    test("git@", (): void => {
        assert.strictEqual(
            extension.defaultWebPath(
                "git@example.com:user/repo.git",
                "hash",
            ),
            "https://example.com/user/repo/commit/hash",
        );
        assert.strictEqual(
            extension.defaultWebPath(
                "git@example.com:user/repo",
                "hash",
            ),
            "https://example.com/user/repo/commit/hash",
        );
    });

    test("username@", (): void => {
        assert.strictEqual(
            extension.defaultWebPath(
                "username@example.com:user/repo.git",
                "hash",
            ),
            "https://example.com/user/repo/commit/hash",
        );
        assert.strictEqual(
            extension.defaultWebPath(
                "username@example.com:user/repo",
                "hash",
            ),
            "https://example.com/user/repo/commit/hash",
        );
    });

    test("https:// with port", (): void => {
        assert.strictEqual(
            extension.defaultWebPath(
                "https://example.com:8080/user/repo.git",
                "hash",
            ),
            "https://example.com:8080/user/repo/commit/hash",
        );
        assert.strictEqual(
            extension.defaultWebPath(
                "https://example.com:8080/user/repo",
                "hash",
            ),
            "https://example.com:8080/user/repo/commit/hash",
        );
    });

    test("http:// with port", (): void => {
        assert.strictEqual(
            extension.defaultWebPath(
                "http://example.com:8080/user/repo.git",
                "hash",
            ),
            "http://example.com:8080/user/repo/commit/hash",
        );
        assert.strictEqual(
            extension.defaultWebPath(
                "http://example.com:8080/user/repo",
                "hash",
            ),
            "http://example.com:8080/user/repo/commit/hash",
        );
    });

    test("git@ with port", (): void => {
        assert.strictEqual(
            extension.defaultWebPath(
                "git@example.com:8080/user/repo.git",
                "hash",
            ),
            "https://example.com/user/repo/commit/hash",
        );
        assert.strictEqual(
            extension.defaultWebPath(
                "git@example.com:8080/user/repo",
                "hash",
            ),
            "https://example.com/user/repo/commit/hash",
        );
    });

    test("https:// plural", (): void => {
        const propSpy = initPropertySpy();

        propSpy.setProperty("isWebPathPlural", true);

        assert.strictEqual(
            extension.defaultWebPath(
                "https://example.com/user/repo.git",
                "hash",
            ),
            "https://example.com/user/repo/commits/hash",
        );
        assert.strictEqual(
            extension.defaultWebPath(
                "https://example.com/user/repo",
                "hash",
            ),
            "https://example.com/user/repo/commits/hash",
        );

        propSpy.restoreProperties();
    });

    test("ssh:// short host no user", (): void => {
        assert.strictEqual(
            extension.defaultWebPath(
                "ssh://user@host:8080/SomeProject.git",
                "hash",
            ),
            "https://host/SomeProject/commit/hash",
        );
        assert.strictEqual(
            extension.defaultWebPath(
                "ssh://user@host:8080/SomeProject",
                "hash",
            ),
            "https://host/SomeProject/commit/hash",
        );
    });

    test("non-alphanumeric in path", (): void => {
        assert.strictEqual(
            extension.defaultWebPath(
                "https://example.com/us.er/repo.git",
                "hash",
            ),
            "https://example.com/us.er/repo/commit/hash",
        );
        assert.strictEqual(
            extension.defaultWebPath(
                "https://example.com/user/re-po.git",
                "hash",
            ),
            "https://example.com/user/re-po/commit/hash",
        );
        assert.strictEqual(
            extension.defaultWebPath(
                "https://example.com/user/re%20po.git",
                "hash",
            ),
            "https://example.com/user/re%20po/commit/hash",
        );
        assert.strictEqual(
            extension.defaultWebPath(
                "ssh://user@example.com:us.er/repo.git",
                "hash",
            ),
            "https://example.com/us.er/repo/commit/hash",
        );
    });

});

suite("Origin to project name", (): void => {
    const extension = container.resolve<GitExtension>("GitExtension");

    test("https://", (): void => {
        assert.strictEqual(
            extension.projectNameFromOrigin(
                "https://example.com/user/repo.git",
            ),
            "repo",
        );
        assert.strictEqual(
            extension.projectNameFromOrigin("https://example.com/user/repo"),
            "repo",
        );
    });

    test("git@", (): void => {
        assert.strictEqual(
            extension.projectNameFromOrigin("git@example.com/user/repo.git"),
            "repo",
        );
        assert.strictEqual(
            extension.projectNameFromOrigin("git@example.com/user/repo"),
            "repo",
        );
    });

    test("longer than normal path", (): void => {
        assert.strictEqual(
            extension.projectNameFromOrigin(
                "git@example.com/company/group/user/repo.git",
            ),
            "repo",
        );
        assert.strictEqual(
            extension.projectNameFromOrigin(
                "git@example.com/company/group/user/repo",
            ),
            "repo",
        );
    });

    test("non-alphanumeric in path", (): void => {
        assert.strictEqual(
            extension.projectNameFromOrigin(
                "https://example.com/user/re-po.git",
            ),
            "re-po",
        );
        assert.strictEqual(
            extension.projectNameFromOrigin(
                "https://example.com/us.er/repo.git",
            ),
            "repo",
        );
        assert.strictEqual(
            extension.projectNameFromOrigin(
                "https://example.com/user/re.po.git",
            ),
            "re.po",
        );
        assert.strictEqual(
            extension.projectNameFromOrigin(
                "https://example.com/user/re.po",
            ),
            "re.po",
        );
    });
});
