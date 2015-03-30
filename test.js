var gistfs = require('./')
var test = require('tape')
var Octokat = require('octokat')
var dotenv = require('dotenv')

dotenv.load()

// var testUser = process.env.GITHUB_USER

var options = {
  auth: {
    token: process.env.GITHUB_TOKEN
  }
}

var octo = new Octokat(options.auth)

var testFile1 = 'The quick brown fox jumps over the lazy dog',
  testFile2 = JSON.stringify({
    one: {
      little: 'object'
    }
  })

var fs

function setup () {
  test('Create temporary test gist', function (t) {
    octo.gists.create({
      description: 'Test Gist',
      files: {
        'test1.txt': {
          content: testFile1
        }
      }
    }, function (err, response) {
      if (err) return t.end(err)
      options.gistId = response.id
      fs = gistfs(options)
      t.error(err, 'created temporary gist')
      t.end()
    })
  })
}

function teardown () {
  test('Delete temporary test gist', function (t) {
    octo.gists(options.gistId).remove(function (err) {
      t.error(err, 'deleted temporary gist')
      t.end()
    })
  })
}

setup()

test('Read file', function (t) {
  fs.readFile('test1.txt', { encoding: 'utf8'}, function (err, data) {
    t.error(err, "doesn't return error")
    t.equal(data, testFile1, 'file content matches')
    t.end()
  })
})

test('Write file', function (t) {
  fs.writeFile('test2.json', testFile2, { encoding: 'utf8' }, function () {
    fs.readFile('test2.json', { encoding: 'utf8'}, function (err, data) {
      t.error(err, "doesn't return error")
      t.equal(data, testFile2, 'file content matches')
      t.end()
    })
  })
})

test('Write multiple files', function (t) {
  t.plan(10)
  var tasks = Array.apply(null, Array(5))

  tasks.forEach(function (v, i) {
    fs.writeFile('test' + i + '.txt', 'test' + i, { encoding: 'utf8' }, function () {
      fs.readFile('test' + i + '.txt', { encoding: 'utf8'}, function (err, data) {
        t.error(err, "doesn't return error")
        t.equal(data, 'test' + i, 'file content matches')
      })
    })
  })
})

teardown()
