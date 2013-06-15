var expect = require('chai').expect
  , through = require('through')
  , fs = require('fs')
  , replaceStream = require('..');

function script(inner) {
  return [
    '<script type="text/javascript">',
    inner,
    '</script>'
  ].join('\n');
}

describe('replace', function () {
  it('should be able to replace within a chunk', function (done) {
    var haystack = [
      '<!DOCTYPE html>',
      '<html>',
      ' <head>',
      '   <title>Test</title>',
      ' </head>',
      ' <body>',
      '   <h1>Head</h1>',
      ' </body>',
      '</html>'
    ].join('\n');

    var acc = '';
    var inject = script(fs.readFileSync('./test/fixtures/inject.js'));
    var replace = replaceStream('</head>', inject + '</head>');
    replace.on('data', function (data) {
      acc += data;
    });
    replace.on('end', function () {
      expect(acc).to.include(inject);
      done();
    });

    replace.write(haystack);
    replace.end();
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

    var acc = '';
    var inject = script(fs.readFileSync('./test/fixtures/inject.js'));
    var replace = replaceStream('</head>', inject + '</head>');
    replace.on('data', function (data) {
      acc += data;
    });
    replace.on('end', function () {
      expect(acc).to.include(inject);
      done();
    });

    haystacks.forEach(function (haystack) {
      replace.write(haystack);
    });

    replace.end();
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

    var acc = '';
    var inject = script(fs.readFileSync('./test/fixtures/inject.js'));
    var replace = replaceStream('</head>', inject + '</head>');
    replace.on('data', function (data) {
      acc += data;
    });
    replace.on('end', function () {
      expect(acc).to.not.include(inject);
      done();
    });

    haystacks.forEach(function (haystack) {
      replace.write(haystack);
    });

    replace.end();
  });

  it('should be able to handle dangling tails', function (done) {
    var haystacks = [
      [ '<!DOCTYPE html>',
        '<html>',
        ' <head>',
        '   <title>Test</title>',
        ' </he'
      ].join('\n')
    ];

    var acc = '';
    var inject = script(fs.readFileSync('./test/fixtures/inject.js'));
    var replace = replaceStream('</head>', inject + '</head>');
    replace.on('data', function (data) {
      acc += data;
    });
    replace.on('end', function () {
      expect(acc).to.include('</he');
      done();
    });

    haystacks.forEach(function (haystack) {
      replace.write(haystack);
    });

    replace.end();
  });

  it('should be able to handle multiple searches and replaces',
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

      var acc = '';
      var inject = script(fs.readFileSync('./test/fixtures/inject.js'));
      var replace = replaceStream('</p>', ', world</p>');
      replace.on('data', function (data) {
        acc += data;
      });
      replace.on('end', function () {
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
        expect(acc).to.equal(expected);
        done();
      });

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

      var acc = '';
      var inject = script(fs.readFileSync('./test/fixtures/inject.js'));
      var replace = replaceStream('</p>', ', world</p>', { limit: 3 });
      replace.on('data', function (data) {
        acc += data;
      });
      replace.on('end', function () {
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
        expect(acc).to.equal(expected);
        done();
      });

      haystacks.forEach(function (haystack) {
        replace.write(haystack);
      });

      replace.end();
    });
});
