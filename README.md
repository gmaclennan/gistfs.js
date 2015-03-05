# gistfs.js

[![build status](https://secure.travis-ci.org/gmaclennan/gistfs.js.png)](http://travis-ci.org/gmaclennan/gistfs.js)

Gisthub gist API wrapper to writeFile and readFile


### `gistfs(repo)`

A mixin for [Octokat.js](https://github.com/philschatz/octokat.js) that
provides a simple wrapper for writing to and reading from a gist. It
provides an interface similar to node.js `fs.readFile` and `fs.writeFile`.

## Limitations

Currently will only read files < 1Mb


### Parameters

| parameter | type          | description                                                                                      |
| --------- | ------------- | ------------------------------------------------------------------------------------------------ |
| `repo`    | Octokat\.gist | A vaid repo returned from Octokat with the call `octo.gists('gist_id')`. See below for examples. |


### Example

```js
var gistfs = require('gistfs'); 
var Octokat = require('octokat');

var octo = new Octocat({ username: "USER_NAME", password: "PASSWORD" });

var gh = gistfs(octo.gists('gist_id'));
```


**Returns** `Object`, returns and instance of gistfs with two methods `readFile` and `writeFile`.


### `writeFile(filename, data, callback)`

Asynchronously writes data to a file on a Gist, replacing the file if it
already exists. `data` can be a string or a buffer. A buffer is written 
encoded as base64.


### Parameters

| parameter  | type           | description            |
| ---------- | -------------- | ---------------------- |
| `filename` | String         | Cannot contain slashes |
| `data`     | String\,Buffer |                        |
| `callback` | Function       |                        |


### Example

```js
gh.writeFile('message.txt', 'Hello Github', function (err) {
  if (err) throw err;
  console.log('It\'s saved!');
});
```


### `readFile(filename, [options], callback)`

Asynchronously read a file on Github.

The file path is always interpreted from the root of the repo, whether or
not it is preceded by a slash.

The callback is passed two arguments `(err, data)`, where `data` is the
contents of the file.

Assumes data on gist is utf8. *TODO* read gist files encoded as base64.

If no encoding is specified, then the raw buffer is returned.

### Parameters

| parameter   | type     | description                                          |
| ----------- | -------- | ---------------------------------------------------- |
| `filename`  | String   |                                                      |
| `[options]` | Object   | _optional:_ `options.encoding=null` (returns Buffer) |
| `callback`  | Function |                                                      |


### Example

```js
gh.readFile('my_file.txt', { encoding: 'utf8' }, function (err, data) { 
  if (err) throw err; 
  console.log(data);
  // text contents of file
});
```

## Installation

Requires [nodejs](http://nodejs.org/).

```sh
$ npm install gistfs.js
```

## Tests

```sh
$ npm test
```


