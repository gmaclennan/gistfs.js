var extend = require('xtend')
var q = require('queue')({ concurrency: 1 })

/**
 * A mixin for [Octokat.js](https://github.com/philschatz/octokat.js) that
 * provides a simple wrapper for writing to and reading from a gist. It
 * provides an interface similar to node.js `fs.readFile` and `fs.writeFile`.
 *
 * ## Limitations
 *
 * Currently will only read files < 1Mb
 *
 * @param  {Octokat.gist} repo A vaid repo returned from Octokat with
 * the call `octo.gists('gist_id')`. See below for examples.
 * @return {Object}      returns and instance of Gistfs with two methods
 * `readFile` and `writeFile`.
 * @example
 * var Gistfs = require('Gistfs');
 * var Octokat = require('octokat')
 *
 * var octo = new Octocat({ username: "USER_NAME", password: "PASSWORD" })
 *
 * var gh = Gistfs(octo.gists('gist_id'))
 */
function Gistfs (gist) {
  if (!(this instanceof Gistfs)) {
    return new Gistfs(gist)
  }
  // Basic checks that we have a valid octokat gist.
  if ((typeof gist !== 'function') ||
    (typeof gist.comments !== 'function') ||
    (typeof gist.star !== 'function')) {
    throw new Error('Need to provide an octokat gist to constructor')
  }
  this._gist = gist
}

/**
 * Asynchronously writes data to a file on a Gist, replacing the file if it
 * already exists. `data` can be a string or a buffer. A buffer is written
 * encoded as base64.
 *
 * @param  {String}   filename Cannot contain slashes
 * @param  {String|Buffer}   data
 * @param  {Function} callback
 * @example
 * gh.writeFile('message.txt', 'Hello Github', function (err) {
 *   if (err) throw err
 *   console.log('It\'s saved!')
 * })
 */
Gistfs.prototype.writeFile = function writeFile (filename, data, options, callback) {
  if (typeof filename !== 'string' || filename.length === 0 || /\//.test(filename)) {
    throw new Error('Must provide a valid filename')
  }
  if (typeof callback !== 'function') {
    if (typeof options === 'function') {
      callback = options
      options = undefined
    } else {
      throw new Error('Need to provide callback')
    }
  }

  var writeDefaults = {}

  options = extend(writeDefaults, options)

  if (Buffer.isBuffer(data)) {
    data = data.toString('base64')
  }

  var params = { files: {} }

  params.files[filename] = {
    content: data
  }

  var _gist = this._gist

  q.push(function (cb) {
    _gist.update(params, function (err) {
      callback(err)
      cb()
    })
  })
  q.start()
}

/**
 * Asynchronously read a file on Github.
 *
 * The file path is always interpreted from the root of the repo, whether or
 * not it is preceded by a slash.
 *
 * The callback is passed two arguments `(err, data)`, where `data` is the
 * contents of the file.
 *
 * Assumes data on gist is utf8. *TODO* read gist files encoded as base64.
 *
 * If no encoding is specified, then the raw buffer is returned.
 * @param  {String}   filename
 * @param  {Object}   [options] `options.encoding=null` (returns Buffer)
 * @param  {Function} callback
 * @example
 * gh.readFile('my_file.txt', { encoding: 'utf8' }, function (err, data) {
 *   if (err) throw err;
 *   console.log(data)
 *   // text contents of file
 * })
 */
Gistfs.prototype.readFile = function readFile (filename, options, callback) {
  if (typeof filename !== 'string' || filename.length === 0 || /\//.test(filename)) {
    throw new Error('Must provide a valid filename')
  }
  if (typeof callback !== 'function') {
    if (typeof options === 'function') {
      callback = options
      options = undefined
    } else {
      throw new Error('Need to provide callback')
    }
  }

  var readDefaults = {
    encoding: null
  }

  options = extend(readDefaults, options)

  this._gist.fetch(function (err, data) {
    if (err) return callback(err)
    var file = data.files[filename]
    if (!file) return callback(new Error('File not found'))
    if (!file.truncated) return encodeContents(file.content)
    callback(new Error('File too large to read through the API'))
  })

  function encodeContents (content) {
    content = new Buffer(content, 'utf8')
    if (options.encoding !== null) {
      content = content.toString(options.encoding)
    }
    callback(null, content)
  }
}

module.exports = Gistfs
