var through = require('through');

module.exports = ReplaceStream;
function ReplaceStream(search, replace, options) {
  var tail = '';
  var totalMatches = 0;
  options = options || {};
  options.limit = options.limit || Infinity;
  options.encoding = options.encoding || 'utf8';
  options.regExpOptions = options.regExpOptions || 'gim';
  var match = permuteMatch(search, options);

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
        if (tail) {
          rewritten += tail+before;
        } else {
          rewritten += before;
        }
        tail = part;
      } else {
        totalMatches++;
        rewritten += before + replace;
        tail = '';
      }
      lastPos = matches.index + part.length;
    }

    if (matchCount) {
      after = haystack.slice(lastPos, haystack.length);
      if (tail.length + after.length < search.length) {
        tail += after;
      } else {
        rewritten += tail + after;
        tail = '';
      }
      this.queue(rewritten);
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

function permuteMatch(s, options) {
  var match =
    permute(s)
      .map(function (permute, i, arr) {
        return '(' + escapeRegExp(permute) +
          ((i < arr.length - 1) ? '$' : '') + ')';
      })
      .join('|');
  return new RegExp(match, options.regExpOptions);
}
