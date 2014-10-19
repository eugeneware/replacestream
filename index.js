var through = require('through');

module.exports = ReplaceStream;
function ReplaceStream(search, replace, options) {
  var tail = '';
  var totalMatches = 0;
  options = options || {};
  options.limit = options.limit || Infinity;
  options.encoding = options.encoding || 'utf8';
  options.regExpOptions = options.regExpOptions || 'gim';
  options.max_match_len = options.max_match_len || 100;

  var replaceFn = replace;
  var isRegex = search instanceof RegExp;

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

  var match;
  if (isRegex) {
    match = matchFromRegex(search, options)
  } else {
    match = matchFromString(search, options);
    options.max_match_len = search.length;
  }

  function write(buf) {
    var matches;
    var lastPos = 0;
    var runningMatch = '';
    var matchCount = 0;
    var rewritten = '';
    var haystack = tail + buf.toString(options.encoding);
    tail = '';

    while (totalMatches < options.limit &&
          (matches = match.exec(haystack)) !== null) {

      matchCount++;
      var before = haystack.slice(lastPos, matches.index);
      var regexMatch = matches;
      lastPos = matches.index + regexMatch[0].length;

      if (lastPos == haystack.length && regexMatch[0].length < options.max_match_len) {
        tail = regexMatch[0]
      } else {
        var dataToAppend = getDataToAppend(before,regexMatch);
        rewritten += dataToAppend;
      }
    }

    if (tail.length < 1)
      tail = haystack.slice(lastPos) > options.max_match_len ? haystack.slice(lastPos).slice(0 - options.max_match_len) : haystack.slice(lastPos)

    var dataToQueue = getDataToQueue(matchCount,haystack,rewritten,lastPos);
    this.queue(remaining);
  }

  function getDataToAppend(before, match) {
    var dataToAppend = before;

    totalMatches++;

    dataToAppend += isRegex ? replaceFn(match) : replaceFn(match[0]);

    return dataToAppend;
  }

  function getDataToQueue(matchCount, haystack, rewritten, lastPos) {
    var dataToQueue;

    if (matchCount > 0) {
      if (haystack.length > tail.length) {
        remaining = rewritten + haystack.slice(lastPos, haystack.length - tail.length)
      } else {
        remaining = rewritten
      }
    } else {
      remaining = haystack.slice(0, haystack.length - tail.length)
    }

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

function matchFromRegex(s, options) {
  if (options.regExpOptions) {
    return new RegExp(s.source, options.regExpOptions)
  } else {
    var flags = s.toString().replace(/\/[^\/]\//, '')
    return new RegExp(s.source, flags)
  }
}

function matchFromString(s, options) {
  return new RegExp(s, options.regExpOptions);
}
