// 
// Note: This example test is leveraging the Mocha test framework.
// Please refer to their documentation on https://mochajs.org/ for help.
//

// The module 'assert' provides assertion methods from node
import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import * as myExtension from '../src/extension';
import {GitBlame} from '../src/gitblame';
import {GitBlameController} from '../src/controller';
import {TextDecorator} from '../src/textdecorator';

// Defines a Mocha test suite to group tests of similar kind together
suite('GitBlame Tests', () => {

    test('Date Calculations', () => {
        const decorator = new TextDecorator();

        assert.equal('3 months ago', decorator.toDateText(new Date(2015, 4), new Date(2015, 1)));
        assert.equal('4 days ago', decorator.toDateText(new Date(2015, 1, 5), new Date(2015, 1, 1)));
        assert.equal('2 hours ago', decorator.toDateText(new Date(2015, 1, 1, 3, 0, 0), new Date(2015, 1, 1, 1, 0, 0)));
        assert.equal('30 minutes ago', decorator.toDateText(new Date(2015, 1, 1, 1, 30, 0), new Date(2015, 1, 1, 1, 0, 0)));
        assert.equal('right now', decorator.toDateText(new Date(2015, 1, 1, 1, 1, 0), new Date(2015, 1, 1, 1, 0, 0)));
    });
});
