# replacestream

A node.js through stream that does basic streaming text search and replace and
is chunk boundary friendly.

## Installation

Install via npm:

``` shell
$ npm install replacestream
```

## Examples

Say we want to do a search and replace over the following file:

```
// happybirthday.txt
Happy birthday to you!
Happy birthday to you!
Happy birthday to dear Liza!
Happy birthday to you!
```

``` js
var replaceStream = require('replacestream')
  , fs = require('fs')
  , path = require('path');

// Replace all the instances of 'birthday' with 'earthday'
fs.createReadStream(path.join(__dirname, 'happybirthday.txt'))
  .pipe(replaceStream('birthday', 'earthday'))
  .pipe(process.stdout);
```

Running this will print out:

```
$ node simple.js
Happy earthday to you!
Happy earthday to you!
Happy earthday to dear Liza!
Happy earthday to you!
```

You can also limit the number of replaces to first ```n```:

``` js
// Replace the first 2 of the instances of 'birthday' with 'earthday'
fs.createReadStream(path.join(__dirname, 'happybirthday.txt'))
  .pipe(replaceStream('birthday', 'earthday', { limit: 2 } ))
  .pipe(process.stdout);
```

Which would output:

```
$ node simple.js
Happy earthday to you!
Happy earthday to you!
Happy birthday to dear Liza!
Happy birthday to you!
```

### Changing the encoding

You can also change the text encoding of the search and replace by setting an
encoding property on the options object:

``` js
// Replace the first 2 of the instances of 'birthday' with 'earthday'
fs.createReadStream(path.join(__dirname, 'happybirthday.txt'))
  .pipe(replaceStream('birthday', 'earthday', { limit: 2, encoding: 'ascii' } ))
  .pipe(process.stdout);
```

By default the encoding will be set to 'utf8'.
