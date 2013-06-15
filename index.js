var through = require('through');

module.exports = ReplaceStream;
function ReplaceStream(search, replace, options) {
  var match = permuteMatch(search);
  var tail = '';
  var totalMatches = 0;
  options = options || {};
  options.limit = options.limit || Infinity;
  options.encoding = options.encoding || 'utf8';

  function write(buf) {
    var matches, before, after;
    var haystack = tail + buf.toString(options.encoding);
    var matchCount = 0;
    var lastPos = 0;
    var rewritten = '';

    while (totalMatches < options.limit &&
     (matches = match.exec(haystack)) !== null) {

      matchCount++;
      var part = matches[0];
      before = haystack.slice(lastPos, matches.index);
      if (part.length < search.length) {
        rewritten += before;
        tail = part;
      } else {
        totalMatches++;
        rewritten += before + replace;
        tail = '';
      }

      lastPos = matches.index + part.length;
    }

    if (matchCount) {
      after = haystack.slice(lastPos, haystack.length - tail.length);
      this.queue(rewritten + after);
    } else if (tail) {
      this.queue(haystack);
      tail = '';
    } else {
      this.queue(buf);
      tail = '';
    }
  }

  function end() {
    if (tail) this.queue(tail);
    this.queue(null);
  }

  var t = through(write, end);
  return t;
}

function escapeRegExp(s) {
    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

function permute(s) {
  var ret = [];
  var acc = '';
  for (var i = 0, len = s.length; i < len; i++) {
    acc += s[i];
    ret.push(acc);
  }
  return ret;
}

function permuteMatch(s) {
  var match =
    permute(s)
      .map(function (permute, i, arr) {
        return '(' + escapeRegExp(permute) +
          ((i < arr.length - 1) ? '$' : '') + ')';
      })
      .join('|');
  return new RegExp(match, 'gim');
}
