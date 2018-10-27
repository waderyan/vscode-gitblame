import * as assert from "assert";

import { GitBlame } from "../src/git/blame";

suite("Web URL formatting", () => {
  const blame = new GitBlame();

  test("https://", () => {
    assert.equal(
      blame.defaultWebPath("https://example.com/user/repo.git", "hash", false),
      "https://example.com/user/repo/commit/hash",
    );
    assert.equal(
      blame.defaultWebPath("https://example.com/user/repo", "hash", false),
      "https://example.com/user/repo/commit/hash",
    );
  });

  test("git@", () => {
    assert.equal(
      blame.defaultWebPath("git@example.com:user/repo.git", "hash", false),
      "https://example.com/user/repo/commit/hash",
    );
    assert.equal(
      blame.defaultWebPath("git@example.com:user/repo", "hash", false),
      "https://example.com/user/repo/commit/hash",
    );
  });

});
