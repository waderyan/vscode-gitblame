import * as assert from "assert";
import { stub } from "sinon";

import { defaultWebPath } from "../../src/git/util/default-web-path";
import * as prop from "../../src/util/property";

suite("Web URL formatting", (): void => {
    test("https://", (): void => {
        assert.strictEqual(
            defaultWebPath(
                "https://example.com/user/repo.git",
                "hash",
            ),
            "https://example.com/user/repo/commit/hash",
        );
        assert.strictEqual(
            defaultWebPath(
                "https://example.com/user/repo",
                "hash",
            ),
            "https://example.com/user/repo/commit/hash",
        );
    });

    test("git@", (): void => {
        assert.strictEqual(
            defaultWebPath(
                "git@example.com:user/repo.git",
                "hash",
            ),
            "https://example.com/user/repo/commit/hash",
        );
        assert.strictEqual(
            defaultWebPath(
                "git@example.com:user/repo",
                "hash",
            ),
            "https://example.com/user/repo/commit/hash",
        );
    });

    test("username@", (): void => {
        assert.strictEqual(
            defaultWebPath(
                "username@example.com:user/repo.git",
                "hash",
            ),
            "https://example.com/user/repo/commit/hash",
        );
        assert.strictEqual(
            defaultWebPath(
                "username@example.com:user/repo",
                "hash",
            ),
            "https://example.com/user/repo/commit/hash",
        );
    });

    test("username:password@", (): void => {
        assert.strictEqual(
            defaultWebPath(
                "username:password@example.com:user/repo.git",
                "hash",
            ),
            "https://example.com/user/repo/commit/hash",
        );
        assert.strictEqual(
            defaultWebPath(
                "username@example.com:user/repo",
                "hash",
            ),
            "https://example.com/user/repo/commit/hash",
        );
    });

    test("https:// with port", (): void => {
        assert.strictEqual(
            defaultWebPath(
                "https://example.com:8080/user/repo.git",
                "hash",
            ),
            "https://example.com:8080/user/repo/commit/hash",
        );
        assert.strictEqual(
            defaultWebPath(
                "https://example.com:8080/user/repo",
                "hash",
            ),
            "https://example.com:8080/user/repo/commit/hash",
        );
    });

    test("http:// with port", (): void => {
        assert.strictEqual(
            defaultWebPath(
                "http://example.com:8080/user/repo.git",
                "hash",
            ),
            "http://example.com:8080/user/repo/commit/hash",
        );
        assert.strictEqual(
            defaultWebPath(
                "http://example.com:8080/user/repo",
                "hash",
            ),
            "http://example.com:8080/user/repo/commit/hash",
        );
    });

    test("git@ with port", (): void => {
        assert.strictEqual(
            defaultWebPath(
                "git@example.com:8080/user/repo.git",
                "hash",
            ),
            "https://example.com/user/repo/commit/hash",
        );
        assert.strictEqual(
            defaultWebPath(
                "git@example.com:8080/user/repo",
                "hash",
            ),
            "https://example.com/user/repo/commit/hash",
        );
    });

    test("git@ with port and password", (): void => {
        assert.strictEqual(
            defaultWebPath(
                "git:pass@example.com:8080/user/repo.git",
                "hash",
            ),
            "https://example.com/user/repo/commit/hash",
        );
        assert.strictEqual(
            defaultWebPath(
                "git@example.com:8080/user/repo",
                "hash",
            ),
            "https://example.com/user/repo/commit/hash",
        );
    });

    test("https:// with port, username and password", (): void => {
        assert.strictEqual(
            defaultWebPath(
                "https://user:pass@example.com:8080/user/repo.git",
                "hash",
            ),
            "https://example.com:8080/user/repo/commit/hash",
        );
    });

    test("https:// with username and password", (): void => {
        assert.strictEqual(
            defaultWebPath(
                "https://user:pass@example.com/user/repo.git",
                "hash",
            ),
            "https://example.com/user/repo/commit/hash",
        );
    });

    test("https:// plural", (): void => {
        const propertyStub = stub(prop, "getProperty");
        propertyStub.withArgs("isWebPathPlural").returns(true);
        propertyStub.withArgs("pluralWebPathSubstrings").returns([]);

        assert.strictEqual(
            defaultWebPath(
                "https://example.com/user/repo.git",
                "hash",
            ),
            "https://example.com/user/repo/commits/hash",
        );
        assert.strictEqual(
            defaultWebPath(
                "https://example.com/user/repo",
                "hash",
            ),
            "https://example.com/user/repo/commits/hash",
        );

        propertyStub.restore();
    });

    test("ssh:// short host no user", (): void => {
        assert.strictEqual(
            defaultWebPath(
                "ssh://user@host:8080/SomeProject.git",
                "hash",
            ),
            "https://host/SomeProject/commit/hash",
        );
        assert.strictEqual(
            defaultWebPath(
                "ssh://user@host:8080/SomeProject",
                "hash",
            ),
            "https://host/SomeProject/commit/hash",
        );
    });

    test("non-alphanumeric in path", (): void => {
        assert.strictEqual(
            defaultWebPath(
                "https://example.com/us.er/repo.git",
                "hash",
            ),
            "https://example.com/us.er/repo/commit/hash",
        );
        assert.strictEqual(
            defaultWebPath(
                "https://example.com/user/re-po.git",
                "hash",
            ),
            "https://example.com/user/re-po/commit/hash",
        );
        assert.strictEqual(
            defaultWebPath(
                "https://example.com/user/re%20po.git",
                "hash",
            ),
            "https://example.com/user/re%20po/commit/hash",
        );
        assert.strictEqual(
            defaultWebPath(
                "ssh://user@example.com:us.er/repo.git",
                "hash",
            ),
            "https://example.com/us.er/repo/commit/hash",
        );
    });
});
