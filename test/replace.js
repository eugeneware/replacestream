'use strict';

var concatStream = require('concat-stream');
var expect = require('chai').expect;
var replaceStream = require('..');
var stream = require('stream')

var script = [
  '<script type="text/javascript">',
  'console.log(\'hello\');',
  'document.addEventListener("DOMContentLoaded", function () {',
  '  document.body.style.backgroundColor = "red";',
  '});',
  '</script>'
].join('\n');

describe('replacestream', function () {
  it('should be able to replace within a chunk', function (done) {
    var replace = replaceStream('</head>', script + '</head>')
    replace.pipe(concatStream({encoding: 'string'}, function(data) {
      expect(data).to.include(script);
      done();
    }));
    replace.end([
      '<!DOCTYPE html>',
      '<html>',
      ' <head>',
      '   <title>Test</title>',
      ' </head>',
      ' <body>',
      '   <h1>Head</h1>',
      ' </body>',
      '</html>'
    ].join('\n'));
  });

  it('should be able to replace between chunks', function (done) {
    var haystacks = [
      [ '<!DOCTYPE html>',
        '<html>',
        ' <head>',
        '   <title>Test</title>',
        ' </he'
      ].join('\n'),
      [      'ad>',
        ' <body>',
        '   <h1>Head</h1>',
        ' </body>',
        '</html>'
      ].join('\n'),
    ];

    var replace = replaceStream('</head>', script + '</head>')
    replace.pipe(concatStream({encoding: 'string'}, function(data) {
      expect(data).to.include(script);
      done();
    }));

    haystacks.forEach(function (haystack) {
      replace.write(haystack);
    });

    replace.end();
  });

  it('should default to case insensitive string matches', function (done) {
    var replace = replaceStream('</HEAD>', script + '</head>');
    replace.pipe(concatStream({encoding: 'string'}, function(data) {
      expect(data).to.include(script);
      done();
    }));
    replace.end([
      '<!DOCTYPE html>',
      '<html>',
      ' <head>',
      '   <title>Test</title>',
      ' </head>',
      ' <body>',
      '   <h1>Head</h1>',
      ' </body>',
      '</html>'
    ].join('\n'));
  });

  it('should be possible to force case sensitive string matches', function (done) {
    var replace = replaceStream('</HEAD>', script + '</head>', {ignoreCase: false});
    replace.pipe(concatStream({encoding: 'string'}, function(data) {
      expect(data).to.not.include(script);
      done();
    }));
    replace.end([
      '<!DOCTYPE html>',
      '<html>',
      ' <head>',
      '   <title>Test</title>',
      ' </head>',
      ' <body>',
      '   <h1>Head</h1>',
      ' </body>',
      '</html>'
    ].join('\n'));
  });

  it('should be able to handle no matches', function (done) {
    var haystacks = [
      [ '<!DOCTYPE html>',
        '<html>',
        ' <head>',
        '   <title>Test</title>',
        ' </de'
      ].join('\n'),
      [      'ad>',
        ' <body>',
        '   <h1>Head</h1>',
        ' </body>',
        '</html>'
      ].join('\n'),
    ];

    var replace = replaceStream('</head>', script + '</head>');
    replace.pipe(concatStream({encoding: 'string'}, function(data) {
      expect(data).to.not.include(script);
      done();
    }));

    haystacks.forEach(function (haystack) {
      replace.write(haystack);
    });

    replace.end();
  });

  it('should be able to handle dangling tails', function (done) {
    var replace = replaceStream('</head>', script + '</head>');
    replace.pipe(concatStream({encoding: 'string'}, function(data) {
      expect(data).to.include('</he');
      done();
    }));
    replace.end([
      '<!DOCTYPE html>',
      '<html>',
      ' <head>',
      '   <title>Test</title>',
      ' </he'
    ].join('\n'));
  });

  it('should be able to handle multiple searches and replaces', function (done) {
      var haystacks = [
        [ '<!DOCTYPE html>',
          '<html>',
          ' <head>',
          '   <title>Test</title>',
          ' </head>',
          ' <body>',
          ' <p> Hello 1</p>',
          ' <p> Hello 2</'
        ].join('\n'),
        [               'p>',
          ' <p> Hello 3</p>',
          ' <p> Hello 4</p>',
          ' <p> Hello 5</p>',
          ' </body>',
          '</html>'
        ].join('\n'),
      ];

      var replace = replaceStream('</p>', ', world</p>');
      replace.pipe(concatStream({encoding: 'string'}, function(data) {
        var expected = [
          '<!DOCTYPE html>',
          '<html>',
          ' <head>',
          '   <title>Test</title>',
          ' </head>',
          ' <body>',
          ' <p> Hello 1, world</p>',
          ' <p> Hello 2, world</p>',
          ' <p> Hello 3, world</p>',
          ' <p> Hello 4, world</p>',
          ' <p> Hello 5, world</p>',
          ' </body>',
          '</html>'
        ].join('\n');
        expect(data).to.equal(expected);
        done();
      }));

      haystacks.forEach(function (haystack) {
        replace.write(haystack);
      });

      replace.end();
    });

  it('should be able to handle a limited searches and replaces',
    function (done) {
      var haystacks = [
        [ '<!DOCTYPE html>',
          '<html>',
          ' <head>',
          '   <title>Test</title>',
          ' </head>',
          ' <body>',
          ' <p> Hello 1</p>',
          ' <p> Hello 2</'
        ].join('\n'),
        [               'p>',
          ' <p> Hello 3</p>',
          ' <p> Hello 4</p>',
          ' <p> Hello 5</p>',
          ' </body>',
          '</html>'
        ].join('\n'),
      ];

      var replace = replaceStream('</p>', ', world</p>', {limit: 3})
      replace.pipe(concatStream({encoding: 'string'}, function(data) {
        var expected = [
          '<!DOCTYPE html>',
          '<html>',
          ' <head>',
          '   <title>Test</title>',
          ' </head>',
          ' <body>',
          ' <p> Hello 1, world</p>',
          ' <p> Hello 2, world</p>',
          ' <p> Hello 3, world</p>',
          ' <p> Hello 4</p>',
          ' <p> Hello 5</p>',
          ' </body>',
          '</html>'
        ].join('\n');
        expect(data).to.equal(expected);
        done();
      }));

      haystacks.forEach(function (haystack) {
        replace.write(haystack);
      });

      replace.end();
    });

  it('should be able to customize the regexp options - deprecated',
    function (done) {
      var haystacks = [
        [ '<!DOCTYPE html>',
          '<html>',
          ' <head>',
          '   <title>Test</title>',
          ' </head>',
          ' <body>',
          ' <P> Hello 1</P>',
          ' <P> Hello 2</'
        ].join('\n'),
        [               'P>',
          ' <P> Hello 3</P>',
          ' <p> Hello 4</p>',
          ' <p> Hello 5</p>',
          ' </body>',
          '</html>'
        ].join('\n'),
      ];

      var replace = replaceStream('</P>', ', world</P>', {regExpOptions: 'gm'});
      replace.pipe(concatStream({encoding: 'string'}, function(data) {
        var expected = [
          '<!DOCTYPE html>',
          '<html>',
          ' <head>',
          '   <title>Test</title>',
          ' </head>',
          ' <body>',
          ' <P> Hello 1, world</P>',
          ' <P> Hello 2, world</P>',
          ' <P> Hello 3, world</P>',
          ' <p> Hello 4</p>',
          ' <p> Hello 5</p>',
          ' </body>',
          '</html>'
        ].join('\n');
        expect(data).to.equal(expected);
        done();
      }));

      haystacks.forEach(function (haystack) {
        replace.write(haystack);
      });

      replace.end();
    });

 it('should replace characters specified and not modify partial matches', function (done) {
   var replace = replaceStream('ab','Z');
   replace.pipe(concatStream({encoding: 'string'}, function(data) {
      var expected = [
        'Z',
        'a',
        'a',
        'b'
      ].join('\n');

      expect(data).to.equal(expected);
      done();
    }));
    replace.end([
      'ab',
      'a',
      'a',
      'b'
    ].join('\n'));
  });

  it('should handle partial matches between complete matches', function (done) {
    var replace = replaceStream('ab','Z');
    replace.pipe(concatStream({encoding: 'string'}, function(data) {
        var expected = [
        'Z',
        'a',
        'Z',
        'b'
      ].join('\n');

      expect(data).to.equal(expected);
      done();
    }));
    replace.end([
      "ab",
      'a',
      'ab',
      'b'
    ].join('\n'));
  });

  it('should only replace characters specified', function (done) {
    var replace = replaceStream('ab','Z');
    replace.pipe(concatStream({encoding: 'string'}, function(data) {
      var expected = [
        'Z',
        'a',
        'b'
      ].join('\n');

      expect(data).to.equal(expected);
      done();
    }));
    replace.end([
      'ab',
      'a',
      'b'
    ].join('\n'));
  });

  it('should be able to use a replace function', function (done) {
    var haystacks = [
      [ '<!DOCTYPE html>',
        '<html>',
        ' <head>',
        '   <title>Test</title>',
        ' </he'
      ].join('\n'),
      [      'ad>',
        ' <body>',
        '   <h1>Head</h1>',
        ' </body>',
        '</html>'
      ].join('\n'),
    ];

    var replace = replaceStream('</head>', function (match) {
      expect(match).to.equal('</head>');
      return script + '</head>';
    });
    replace.pipe(concatStream({encoding: 'string'}, function(data) {
      expect(data).to.include(script);
      done();
    }));

    haystacks.forEach(function (haystack) {
      replace.write(haystack);
    });

    replace.end();
  });

  it('should be able to change each replacement value with a function',
    function (done) {
      var haystacks = [
        [ '<!DOCTYPE html>',
          '<html>',
          ' <head>',
          '   <title>Test</title>',
          ' </head>',
          ' <body>',
          ' <p> Hello 1</p>',
          ' <p> Hello 2</'
        ].join('\n'),
        [               'p>',
          ' <p> Hello 3</p>',
          ' <p> Hello 4</p>',
          ' <p> Hello 5</p>',
          ' </body>',
          '</html>'
        ].join('\n'),
      ];

      var greetings = ['Hi', 'Hey', 'Gday', 'Bonjour', 'Greetings'];

      var replace = replaceStream('Hello', greetings.shift.bind(greetings));
      replace.pipe(concatStream({encoding: 'string'}, function(data) {
        var expected = [
          '<!DOCTYPE html>',
          '<html>',
          ' <head>',
          '   <title>Test</title>',
          ' </head>',
          ' <body>',
          ' <p> Hi 1</p>',
          ' <p> Hey 2</p>',
          ' <p> Gday 3</p>',
          ' <p> Bonjour 4</p>',
          ' <p> Greetings 5</p>',
          ' </body>',
          '</html>'
        ].join('\n');
        expect(data).to.equal(expected);
        done();
      }));

      haystacks.forEach(function (haystack) {
        replace.write(haystack);
      });

      replace.end();
    });
    it('should be able to replace within a chunk using regex', function (done) {
      var replace = replaceStream(/<\/head>/, script + '</head>');
      replace.pipe(concatStream({encoding: 'string'}, function(data) {
        expect(data).to.include(script);
        done();
      }));
      replace.end([
        '<!DOCTYPE html>',
        '<html>',
        ' <head>',
        '   <title>Test</title>',
        ' </head>',
        ' <body>',
        '   <h1>Head</h1>',
        ' </body>',
        '</html>'
      ].join('\n'));
    });

    it('should be able to replace between chunks using regex', function (done) {
      var haystacks = [
        [ '<!DOCTYPE html>',
          '<html>',
          ' <head>',
          '   <title>Test</title>',
          ' </head>',
          ' <body>',
          '   <h1>I love feeeee'
        ].join('\n'),
        [      'eeeeeeeeeed</h1>',
          ' </body>',
          '</html>'
        ].join('\n'),
      ];

      var replace = replaceStream(/fe+d/, 'foooooooood');
      replace.pipe(concatStream({encoding: 'string'}, function(data) {
        expect(data).to.include('foooooooood');
        done();
      }));

      haystacks.forEach(function (haystack) {
        replace.write(haystack);
      });

      replace.end();
    });

    it('should be able to handle no matches using regex', function (done) {
      var haystacks = [
        [ '<!DOCTYPE html>',
          '<html>',
          ' <head>',
          '   <title>Test</title>',
          ' </de'
        ].join('\n'),
        [      'ad>',
          ' <body>',
          '   <h1>Head</h1>',
          ' </body>',
          '</html>'
        ].join('\n'),
      ];

      var replace = replaceStream(/<\/head>/, script + '</head>');
      replace.pipe(concatStream({encoding: 'string'}, function(data) {
        expect(data).to.not.include(script);
        done();
      }));

      haystacks.forEach(function (haystack) {
        replace.write(haystack);
      });

      replace.end();
    });

    it('should be able to handle dangling tails using regex', function (done) {
      var replace = replaceStream(/<\/head>/, script + '</head>');
      replace.pipe(concatStream({encoding: 'string'}, function(data) {
        expect(data).to.include('</he');
        done();
      }));

      replace.end([
        '<!DOCTYPE html>',
        '<html>',
        ' <head>',
        '   <title>Test</title>',
        ' </he'
      ].join('\n'));
    });

    it('should be able to handle multiple searches and replaces using regex',
      function (done) {
        var haystacks = [
          [ '<!DOCTYPE html>',
            '<html>',
            ' <head>',
            '   <title>Test</title>',
            ' </head>',
            ' <body>',
            ' <p> Hello 1</p>',
            ' <p> Hello 2</'
          ].join('\n'),
          [               'p>',
            ' <p> Hello 3</p>',
            ' <p> Hello 4</p>',
            ' <p> Hello 5</p>',
            ' </body>',
            '</html>'
          ].join('\n'),
        ];

        var replace = replaceStream(/<\/p>/g, ', world</p>');
        replace.pipe(concatStream({encoding: 'string'}, function(data) {
          var expected = [
            '<!DOCTYPE html>',
            '<html>',
            ' <head>',
            '   <title>Test</title>',
            ' </head>',
            ' <body>',
            ' <p> Hello 1, world</p>',
            ' <p> Hello 2, world</p>',
            ' <p> Hello 3, world</p>',
            ' <p> Hello 4, world</p>',
            ' <p> Hello 5, world</p>',
            ' </body>',
            '</html>'
          ].join('\n');
          expect(data).to.equal(expected);
          done();
        }));

        haystacks.forEach(function (haystack) {
          replace.write(haystack);
        });

        replace.end();
      });

    it('should be able to handle a limited searches and replaces using regex',
      function (done) {
        var haystacks = [
          [ '<!DOCTYPE html>',
            '<html>',
            ' <head>',
            '   <title>Test</title>',
            ' </head>',
            ' <body>',
            ' <p> Hello 1</p>',
            ' <p> Hello 2</'
          ].join('\n'),
          [               'p>',
            ' <p> Hello 3</p>',
            ' <p> Hello 4</p>',
            ' <p> Hello 5</p>',
            ' </body>',
            '</html>'
          ].join('\n'),
        ];

        var replace = replaceStream(/<\/p>/g, ', world</p>', { limit: 3 });
        replace.pipe(concatStream({encoding: 'string'}, function(data) {
          var expected = [
            '<!DOCTYPE html>',
            '<html>',
            ' <head>',
            '   <title>Test</title>',
            ' </head>',
            ' <body>',
            ' <p> Hello 1, world</p>',
            ' <p> Hello 2, world</p>',
            ' <p> Hello 3, world</p>',
            ' <p> Hello 4</p>',
            ' <p> Hello 5</p>',
            ' </body>',
            '</html>'
          ].join('\n');
          expect(data).to.equal(expected);
          done();
        }));

        haystacks.forEach(function (haystack) {
          replace.write(haystack);
        });

        replace.end();
      });

    it('should be able to customize the regexp options using regex - deprecated',
      function (done) {
        var haystacks = [
          [ '<!DOCTYPE html>',
            '<html>',
            ' <head>',
            '   <title>Test</title>',
            ' </head>',
            ' <body>',
            ' <P> Hello 1</P>',
            ' <P> Hello 2</'
          ].join('\n'),
          [               'P>',
            ' <P> Hello 3</P>',
            ' <p> Hello 4</p>',
            ' <p> Hello 5</p>',
            ' </body>',
            '</html>'
          ].join('\n'),
        ];

        var replace = replaceStream(/<\/P>/, ', world</P>', {regExpOptions: 'gm'});
        replace.pipe(concatStream({encoding: 'string'}, function(data) {
          var expected = [
            '<!DOCTYPE html>',
            '<html>',
            ' <head>',
            '   <title>Test</title>',
            ' </head>',
            ' <body>',
            ' <P> Hello 1, world</P>',
            ' <P> Hello 2, world</P>',
            ' <P> Hello 3, world</P>',
            ' <p> Hello 4</p>',
            ' <p> Hello 5</p>',
            ' </body>',
            '</html>'
          ].join('\n');
          expect(data).to.equal(expected);
          done();
        }));

        haystacks.forEach(function (haystack) {
          replace.write(haystack);
        });

        replace.end();
      });

    it('should be possible to specify the regexp flags when using a regex',
      function (done) {
        var haystacks = [
          [ '<!DOCTYPE html>',
            '<html>',
            ' <head>',
            '   <title>Test</title>',
            ' </head>',
            ' <body>',
            ' <P> Hello 1</P>',
            ' <P> Hello 2</'
          ].join('\n'),
          [               'P>',
            ' <P> Hello 3</P>',
            ' <p> Hello 4</p>',
            ' <p> Hello 5</p>',
            ' </body>',
            '</html>'
          ].join('\n'),
        ];

        var replace = replaceStream(/<\/P>/gm, ', world</P>');
        replace.pipe(concatStream({encoding: 'string'}, function(data) {
          var expected = [
            '<!DOCTYPE html>',
            '<html>',
            ' <head>',
            '   <title>Test</title>',
            ' </head>',
            ' <body>',
            ' <P> Hello 1, world</P>',
            ' <P> Hello 2, world</P>',
            ' <P> Hello 3, world</P>',
            ' <p> Hello 4</p>',
            ' <p> Hello 5</p>',
            ' </body>',
            '</html>'
          ].join('\n');
          expect(data).to.equal(expected);
          done();
        }));

        haystacks.forEach(function (haystack) {
          replace.write(haystack);
        });

        replace.end();
      });

    it('should replace characters specified and not modify partial matches using regex', function (done) {
      var replace = replaceStream('ab','Z');
      replace.pipe(concatStream({encoding: 'string'}, function(data) {
          var expected = [
          'Z',
          'a',
          'a',
          'b'
        ].join('\n');

        expect(data).to.equal(expected);
        done();
      }));
      replace.end([
        'ab',
        'a',
        'a',
        'b'
      ].join('\n'));
    });

    it('should handle partial matches between complete matches using regex', function (done) {
      var replace = replaceStream(/ab/g,'Z');
      replace.pipe(concatStream({encoding: 'string'}, function(data) {
          var expected = [
          'Z',
          'a',
          'Z',
          'b'
        ].join('\n');

        expect(data).to.equal(expected);
        done();
      }));
      replace.end([
        "ab",
        'a',
        'ab',
        'b'
      ].join('\n'));
    });

    it('should only replace characters specified using regex', function (done) {
      var replace = replaceStream(/ab/,'Z');
      replace.pipe(concatStream({encoding: 'string'}, function(data) {
        var expected = [
          'Z',
          'a',
          'b'
        ].join('\n');

        expect(data).to.equal(expected);
        done();
      }));
      replace.end([
        'ab',
        'a',
        'b'
      ].join('\n'));
    });

    it('should be able to use a replace function using regex', function (done) {
      var haystacks = [
        [ '<!DOCTYPE html>',
          '<html>',
          ' <head>',
          '   <title>Test</title>',
          ' </he'
        ].join('\n'),
        [      'ad>',
          ' <body>',
          '   <h1>Head</h1>',
          ' </body>',
          '</html>'
        ].join('\n'),
      ];

      function replaceFn(match, p1, offset, string) {
        expect(match).to.equal('</head>');
        expect(p1).to.equal('head');
        expect(offset).to.equal(55);
        expect(string).to.equal(haystacks.join(''));
        return script + '</head>';
      }

      var replace = replaceStream(/<\/(head)>/, replaceFn);
      replace.pipe(concatStream({encoding: 'string'}, function(data) {
        expect(data).to.include(script);
        done();
      }));

      haystacks.forEach(function (haystack) {
        replace.write(haystack);
      });

      replace.end();
    });

    it('should be able to change each replacement value with a function using regex',
      function (done) {
        var haystacks = [
          [ '<!DOCTYPE html>',
            '<html>',
            ' <head>',
            '   <title>Test</title>',
            ' </head>',
            ' <body>',
            ' <p> Hello 1</p>',
            ' <p> Hello 2</'
          ].join('\n'),
          [               'p>',
            ' <p> Hello 3</p>',
            ' <p> Hello 4</p>',
            ' <p> Hello 5</p>',
            ' </body>',
            '</html>'
          ].join('\n'),
        ];

        var greetings = ['Hi', 'Hey', 'Gday', 'Bonjour', 'Greetings'];

        var replace = replaceStream(/Hello/g, greetings.shift.bind(greetings));
        replace.pipe(concatStream({encoding: 'string'}, function(data) {
          var expected = [
            '<!DOCTYPE html>',
            '<html>',
            ' <head>',
            '   <title>Test</title>',
            ' </head>',
            ' <body>',
            ' <p> Hi 1</p>',
            ' <p> Hey 2</p>',
            ' <p> Gday 3</p>',
            ' <p> Bonjour 4</p>',
            ' <p> Greetings 5</p>',
            ' </body>',
            '</html>'
          ].join('\n');
          expect(data).to.equal(expected);
          done();
        }));

        haystacks.forEach(function (haystack) {
          replace.write(haystack);
        });

        replace.end();
      });

      it('should be able to replace captures using $1 notation', function (done) {
        var replace = replaceStream(/(a)(b)/g, 'this is $1 and this is $2 and this is again $1');
        replace.pipe(concatStream({encoding: 'string'}, function(data) {
          var expected = [
            'this is a and this is b and this is again a',
            'a',
            'this is a and this is b and this is again a',
            'b'
          ].join('\n');

          expect(data).to.equal(expected);
          done();
        }));
        replace.end([
          "ab",
          'a',
          'ab',
          'b'
        ].join('\n'));
      });

  it('should be able to replace when the match is a tail using a regex', function (done) {
    var replace = replaceStream(/<\/html>/g, script + '</html>');
    replace.pipe(concatStream({encoding: 'string'}, function(data) {
      expect(data).to.include(script);
      done();
    }));
    replace.end([
      '<!DOCTYPE html>',
      '<html>',
      ' <head>',
      '   <title>Test</title>',
      ' </head>',
      ' <body>',
      '   <h1>Head</h1>',
      ' </body>',
      '</html>'
    ].join('\n'));
  });

  it('should push chunks immediately except tail', function (done) {
    var replace = replaceStream(/REPLACE/, '')
    var replaced = new stream.PassThrough

    var recievedChunks = []
    replace.pipe(replaced)
    replaced.on('data', function(data) {
      recievedChunks.push(data)
    })
    replaced.on('end', function() {
      expect(recievedChunks.length).to.equal(3)
      expect(recievedChunks[0]).to.have.length(99)
      expect(recievedChunks[1]).to.have.length(50)
      expect(recievedChunks[2]).to.have.length(100)
      done()
    })
    replace.write((new Buffer(50)).fill(0))
    replace.write((new Buffer(49)).fill(0))
    replace.write((new Buffer(100)).fill(0))
    replace.end((new Buffer(50)).fill(0))
  });
});
