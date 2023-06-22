## 1.1.1 (June 22, 2023)

### Bug Fixes

- #### fix: trailing slashes in the html params would cause formatting to fail ([#3](https://github.com/ncpa0cpl/termx-markup/pull/3))

  Fixed a bug that would cause the formatter to fail in rare situations where a backslash was the last character of a string parameter and happened to be right in front of a closing tag (see example below). From now on, the `html` tag literal should escape such characters to prevent this from happening.
  
  ```ts
  MarkupFormatter.format(html`<span>${"Hello World\\"}</span>`);
  // resulting string passed to formatter would look like this:
  // <span>Hello World\</span>
  // the backslash would cause the xml parser to escape the `<` character
  // and the whole thing would be treated as if there's no closing tag
  
  // with the fix, the resulting string will look like this:
  // <span>Hello World\\</span>
  // since the backslash itself is now escaped, parser will simply ignore it
  ```
