# Change Log

## 1.7.0 (April 30, 2017)

* Feature: Adding setting to ignore whitespace changes (`gitblame.ignoreWhitespace`) [#1](https://github.com/Sertion/vscode-gitblame/issues/1)
* Feature: Adding setting to open commit info in online tool (`gitblame.commitUrl`) [#6](https://github.com/Sertion/vscode-gitblame/issues/6)
* Enhancement: Status bar message no longer clickable when there is no commit associated with the current line
* Enhancement: Adding info about configuration in `README.md`
* Bug: Spawn fewer git processes when opening a file [#3](https://github.com/Sertion/vscode-gitblame/issues/3)

## 1.6.2 (April 29, 2017)

* Updating example animation
* Removing backlog from `README.md`, it is now the [`Planned` label in the issue tracker](https://github.com/Sertion/vscode-gitblame/labels/Planned)

## 1.6.1 (April 29, 2017)

* Split change log into its own file as per [suggestion from @daniel-white](https://github.com/waderyan/vscode-gitblame/issues/30)

## 1.6.0 (April 17, 2017)

* More granular time info
* Adding a re-check of blame info on save

## 1.5.0 (April 17, 2017)

* Spring cleaning

## 1.4.0 (April 16, 2017)

* Now respects changes made in the git working tree when blaming
* Updating dependencies
* Updating to new repository

## 1.3.0 (July 21, 2016)

* Merged in [PR](https://github.com/waderyan/vscode-gitblame/pull/12) to make the status bar message interactive (credit to [@j-em](https://github.com/j-em));

## 1.2.0 (July 20, 2016)

* Merged in [PR](https://github.com/waderyan/vscode-gitblame/pull/10) replacing 'Hello World' message with hash and commit message (credit to [@carloscz](https://github.com/carloscz)).

## 1.1.0 (May 20, 2016)

* Reduced text size which was causing the blame info not to show. 
* Merged in [PR](https://github.com/waderyan/vscode-gitblame/pull/5) (credit to [@fogzot](https://github.com/fogzot)) that searches for .git in parent dirs.
