var extend = require('xtend')
var Octokat = require('octokat')
var queue = require('queue')

var queues = {}

/**
 * A mixin for [Octokat.js](https://github.com/philschatz/octokat.js) that
 * provides a simple wrapper for writing to and reading from a gist. It
 * provides an interface similar to node.js `fs.readFile` and `fs.writeFile`.
 *
 * **Limitations**
 *
 * Currently will only read files < 1Mb
 *
 * ### Breaking change in v1.0.0
 *
 * No longer operates as a Octokat mixin, instead new instances are created
 * with an `options` object with the owner, repo and auth, which is passed
 * to Octokat.
 *
 * @param  {Object} options `options.gistId` (required) valid gistId,
 * `options.auth` (optional) passed through to a new
 * [Octokat instance](https://github.com/philschatz/octokat.js#in-a-browser).
 * See below for examples.
 * @return {Object}      returns and instance of Gistfs with two methods
 * `readFile` and `writeFile`.
 * @example
 * var Gistfs = require('Gistfs');
 *
 * var options = {
 *   gistId = 'gist_id',
 *   auth: {
 *     username: "USER_NAME",
 *     password: "PASSWORD"
 *   }
 * }
 *
 * var gh = Gistfs(options)
 */
function Gistfs (options) {
  if (!(this instanceof Gistfs)) {
    return new Gistfs(options)
  }
  options = options || {}
  if (!options.gistId) {
    throw new Error('Need to provide options.gistId')
  }
  var gistId = options.gistId
  this._gist = new Octokat(options.auth).gists(gistId)
  this._queue = queues[gistId] = queues[gistId] || queue({ concurrency: 1 })
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

  this._queue.push(function (cb) {
    _gist.update(params, function (err) {
      callback(err)
      cb()
    })
  })
  this._queue.start()
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
