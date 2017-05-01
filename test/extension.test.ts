// 
// Note: This example test is leveraging the Mocha test framework.
// Please refer to their documentation on https://mochajs.org/ for help.
//

// The module 'assert' provides assertion methods from node
import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import {TextDecorator} from '../src/textDecorator';

// Defines a Mocha test suite to group tests of similar kind together
suite('GitBlame Tests', () => {

    test('Date Calculations', () => {
        assert.equal('3 months ago', TextDecorator.toDateText(new Date(2015, 4), new Date(2015, 1)));
        assert.equal('4 days ago', TextDecorator.toDateText(new Date(2015, 1, 5), new Date(2015, 1, 1)));
        assert.equal('2 hours ago', TextDecorator.toDateText(new Date(2015, 1, 1, 3, 0, 0), new Date(2015, 1, 1, 1, 0, 0)));
        assert.equal('30 minutes ago', TextDecorator.toDateText(new Date(2015, 1, 1, 1, 30, 0), new Date(2015, 1, 1, 1, 0, 0)));
        assert.equal('right now', TextDecorator.toDateText(new Date(2015, 1, 1, 1, 1, 0), new Date(2015, 1, 1, 1, 0, 0)));
    });

    test('Token Parser', () => {
        assert.equal('No tokens', TextDecorator.parseTokens('No ${tokens}'));
        assert.equal('Simple replace', TextDecorator.parseTokens('Simple ${replace-word}', {
            'replace-word': 'replace'
        }));
        assert.equal('Function replaced', TextDecorator.parseTokens('Function ${replace-word}', {
            'replace-word': () => 'replaced'
        }));
        assert.equal('Function value tested', TextDecorator.parseTokens('Function value ${replace,test}', {
            'replace': (value) => value + 'ed'
        }));
        assert.equal('Multiple mixed replacers', TextDecorator.parseTokens('Multiple ${type} ${what,replacer}', {
            'type': 'mixed',
            'what': (value) => value + 's'
        }));
        assert.equal('Multiple of the same replacer should yield the same result', TextDecorator.parseTokens('Multiple of the ${replace} replacer should yield the ${replace} result', {
            'replace': 'same'
        }));
        assert.equal('Should set to key if non-valid-value', TextDecorator.parseTokens('Should set to key if ${non-valid-value}', {
            'non-valid-value': []
        }));
        assert.equal('Uses path', TextDecorator.parseTokens('Uses ${climb.down}', {
            'climb': {
                'down': 'path'
            }
        }));
        assert.equal('😃 should 💦 👌💯👌', TextDecorator.parseTokens('😃 should 💦 ${ok,💯}', {
            'ok': (value) => '👌' + value + '👌'
        }));
    })
});
