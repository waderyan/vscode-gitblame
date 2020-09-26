import * as assert from 'assert';
import { isUrl } from '../../src/util/is-url';

suite('Is URL', (): void => {
    test('Valid', (): void => {
        assert.strictEqual(isUrl("http://github.com/"), true);
        assert.strictEqual(isUrl("https://microsoft.com/"), true);
        assert.strictEqual(isUrl("https://vscode.co.uk/"), true);
        assert.strictEqual(isUrl("https://example.com/some-path"), true);
        assert.strictEqual(isUrl("https://example.com/some-path.ext"), true);
        assert.strictEqual(isUrl("https://host:8080/some-path.ext"), true);
        assert.strictEqual(isUrl("https://user:pass@host:8080/path.ext"), true);
    });

    test('Invalid', (): void => {
        assert.strictEqual(isUrl("ftp://github.com/"), false);
        assert.strictEqual(isUrl("http:github.com"), false);
        assert.strictEqual(isUrl("http:github.com/some-path"), false);
        assert.strictEqual(isUrl("%"), false);
    });
});
