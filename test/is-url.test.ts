import * as assert from 'assert';
import { isUrl } from '../src/util/is-url';

suite('Is URL', (): void => {
    test('Valid', (): void => {
        assert.equal(isUrl("http://github.com/"), true);
        assert.equal(isUrl("https://microsoft.com/"), true);
        assert.equal(isUrl("https://vscode.co.uk/"), true);
        assert.equal(isUrl("https://example.com/some-path"), true);
        assert.equal(isUrl("https://example.com/some-path.ext"), true);
        assert.equal(isUrl("https://example.com:8080/some-path.ext"), true);
        assert.equal(isUrl("https://user:pass@host:8080/path.ext"), true);
    });

    test('Invalid', (): void => {
        assert.equal(isUrl("ftp://github.com/"), false);
        assert.equal(isUrl("http:github.com"), false);
        assert.equal(isUrl("http:github.com/some-path"), false);
        assert.equal(isUrl("%"), false);
    });
});
