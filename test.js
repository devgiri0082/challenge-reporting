const tape = require('tape')
const jsonist = require('jsonist')

const port = (process.env.PORT = process.env.PORT || require('get-port-sync')())
const endpoint = `http://localhost:${port}`

const server = require('./server')

tape('health', async function (t) {
  const url = `${endpoint}/health`
  try {
    const { data, response } = await jsonist.get(url)
    if (response.statusCode !== 200) {
      throw new Error('Error connecting to sqlite database; did you initialize it by running `npm run init-db`?')
    }
    t.ok(data.success, 'should have successful healthcheck')
    t.end()
  } catch (e) {
    t.error(e)
  }
})

tape('GET /student/:id endpoint', function (t) {
  t.test('should return object with valid id', async (t) => {
    const studentId = 1
    const statusCode = 200
    const url = `${endpoint}/student/1`

    try {
      const { data, response } = await jsonist.get(url)
      t.equal(statusCode, response.statusCode)
      t.equal(data.id, studentId)
      t.end()
    } catch (e) {
      t.error(e)
    }
  })

  t.test('should return not found error', async (t) => {
    const studentId = 'abc'
    const statusCode = 404
    const errorMsg = 'Not Found'
    const url = `${endpoint}/student/${studentId}`

    try {
      const { data, response } = await jsonist.get(url)
      t.equal(statusCode, response.statusCode)
      t.equal(data.error, errorMsg)
      t.end()
    } catch (e) {
      t.error(e)
    }
  })
})

tape('cleanup', function (t) {
  server.closeDB()
  server.close()
  t.end()
})
