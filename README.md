# Git Blame

[![Build Status](https://travis-ci.org/Sertion/vscode-gitblame.svg?branch=master)](https://travis-ci.org/Sertion/vscode-gitblame)

See Git Blame information in the status bar for the currently selected line.

![Feature Usage](https://github.com/Sertion/vscode-gitblame/raw/master/images/GitBlamePreview.gif)

# Install

1. Open _Visual Studio Code_
1. Press `Ctrl+Shift+X` or `⇧⌘X`
1. Type `blame`
1. Click install on _Git Blame_

# Configuration

- `gitblame.commitUrl` (`string`, default `""`)
  - url where you can see the commit by hash
  - available tokens:
    - `${hash}` - the commit hash
  - _Example:_ `https://github.com/Sertion/vscode-gitblame/commit/${hash}`
- `gitblame.ignoreWhitespace` (`boolean`, default `false`)
  - use the git blame `-w` flag
- `gitblame.infoMessageFormat` (`string`, default `"${commit.hash} ${commit.summary}"`)
  - message that appears when the `gitblame.quickInfo` command executes (when you click the status bar message)
  - available tokens:
    - `${commit.hash}` - 40-bit hash unique to the commit
    - `${commit.hash_short,length}` - the first `length` characters of the 40-bit hash unique to the commit, defaults to `7` first characters
    - `${commit.summary}` - the first line of the commit message
    - `${commit.filename}` - the file name where the line was committed
    - `${author.name}` - the commit author's name
    - `${author.email}` - the commit author's e-mail
    - `${author.timestamp}` - timestamp for the commit author's commit
    - `${author.tz}` - the commit author's time zone
    - `${committer.name}` - the committer's name
    - `${committer.email}` - the committer's e-mail
    - `${committer.timestamp}` - timestamp for the committer's commit
    - `${committer.tz}` - the committer's time zone
    - `${time.ago}` - displays an estimation of how long ago the author committed (e.g. `10 hours ago`, `20 days ago`, `4 months ago`)
    - `${time.custom,your_format}` - custom time format based on [momentjs.format(your_format)](https://momentjs.com/docs/#/displaying/format/) (uses author timestamp)
    - `${time.from}` - format based on [momentjs.fromNow()](https://momentjs.com/docs/#/displaying/fromnow/) (uses author timestamp)
    - `${time.c_ago}` - displays an estimation of how long ago the committer committed (e.g. `10 hours ago`, `20 days ago`, `4 months ago`)
    - `${time.c_custom,your_format}` - custom time format based on [momentjs.format(your_format)](https://momentjs.com/docs/#/displaying/format/) (uses committer timestamp)
    - `${time.c_from}` - format based on [momentjs.fromNow()](https://momentjs.com/docs/#/displaying/fromnow/) (uses committer timestamp)
- `gitblame.statusBarMessageFormat` (`string`, default `"Blame ${author.name} ( ${time.ago} )"`)
  - message in the status bar about the current line's git blame commit
  - available tokens:
    - See `gitblame.infoMessageFormat`
- `gitblame.statusBarMessageNoCommit` (`string`, default `"Not Committed Yet"`)
  - message in the status bar about the current line when no commit can be found
  - available tokens:
    - _No available tokens_
- `gitblame.progressSpinner` (`array` of `string`, default `["$(sync~spin)"]`)
  - an array of strings that will be displayed in sequence to denote progress while blaming files in larger repositories
  - supports [Octoicons](https://octicons.github.com/) with the `~spin` suffix for spin action
  - when the array only contains one item that item is rendered once instead of every 100ms
  - Some suggested values:
    - `["－", "／", "｜", "＼"]`
    - `["⣾", "⣽", "⣻", "⢿", "⡿", "⣟", "⣯", "⣷"]`
    - `["[Loading ]", "[oading L]", "[ading Lo]", "[ding Loa]", "[ing Load]", "[ng Loadi]", "[g Loadin]", "[ Loading]"]`
    - `["🕐", "🕑", "🕒", "🕓", "🕔", "🕕", "🕖", "🕗", "🕘", "🕙", "🕚", "🕛"]`
- `gitblame.logLevel` (`array` of `string`, default `["info", "error", "command", "critical"]`)
  - an array of levels to log to the extension log
  - available levels:
    - `"info"`,
    - `"error"`,
    - `"command"`,
    - `"critical"`

# [Planned Features](https://github.com/Sertion/vscode-gitblame/labels/Planned)

# [Known Issues](https://github.com/Sertion/vscode-gitblame/issues)
