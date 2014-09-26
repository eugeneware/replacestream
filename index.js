var through = require('through');

module.exports = ReplaceStream;
function ReplaceStream(search, replace, options) {
  var tail = '';
  var totalMatches = 0;
  options = options || {};
  options.limit = options.limit || Infinity;
  options.encoding = options.encoding || 'utf8';
  options.regExpOptions = options.regExpOptions || 'gim';
  options.max_match_len = options.max_match_len || 1000;

  var replaceFn = replace;
  if (typeof replace !== 'function' && isRegex) {
    replaceFn = function (match) {
      var newReplace = replace;
      // ability to us $1 with captures
      match.forEach(function(m, index) {
        newReplace = newReplace.replace('$' + index, m || '')
      });
      return newReplace;
    };
  }
  if (typeof replace !== 'function') {
    replaceFn = function () {
      return replace;
    };
  }

  var isRegex = search instanceof RegExp;
  var match = isRegex ? new RegExp(search.source, options.regExpOptions) : permuteMatch(search, options);

  function write(buf) {
    var matches;
    var lastPos = 0;
    var matchCount = 0;
    var rewritten = '';
    var remaining = buf;
    var haystack = tail + buf.toString(options.encoding);
    var movingWindow = '';
    tail = '';

    movingWindow = movingWindow + haystack;
    if (movingWindow > options.max_match_len * 2) {
      movingWindow = movingWindow.slice(movingWindow.length - options.max_match_len - 1);
    }

    while (totalMatches < options.limit &&
          (matches = match.exec(movingWindow)) !== null) {

      matchCount++;
      var before = haystack.slice(lastPos, matches.index);
      var regexMatch = matches;
      lastPos = matches.index + regexMatch[0].length;

      var dataToAppend = getDataToAppend(before,regexMatch);
      rewritten += dataToAppend;
    }

    if (matchCount)
      remaining = haystack.slice(lastPos, haystack.length);
    else if (tail)
      remaining = haystack;

    var dataToQueue = getDataToQueue(matchCount,remaining,rewritten);
    this.queue(dataToQueue);
  }

  function getDataToAppend(before, match) {
    var dataToAppend = before;

    if (tail)
      dataToAppend = tail + dataToAppend;

    if (!(search instanceof RegExp) && match[0].length < search.length) {
      tail = match[0];
      return dataToAppend;
    }

    tail = '';
    totalMatches++;

    dataToAppend += isRegex ? replaceFn(match) : replaceFn(match[0]);

    return dataToAppend;
  }

  function getDataToQueue(matchCount, remaining, rewritten) {
    var dataToQueue = remaining;

    if (matchCount) {

      if ((tail.length + remaining.length) < search.length) {
        tail += remaining;
        return rewritten;
      }

      dataToQueue = rewritten +tail + remaining;
    }

    tail = '';
    return dataToQueue;
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
