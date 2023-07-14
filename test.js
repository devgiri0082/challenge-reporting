const tape = require('tape')
const jsonist = require('jsonist')
const { calculateGradeStats } = require('./api')

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
    const url = `${endpoint}/student/${studentId}`

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

tape('GET /student/:id/grades endpoint', function (t) {
  t.test('should return object with valid id and grades', async (t) => {
    const studentId = 1
    const statusCode = 200
    const url = `${endpoint}/student/${studentId}/grades`

    try {
      const { data, response } = await jsonist.get(url)
      t.equal(statusCode, response.statusCode)
      t.equal(data.id, studentId)
      t.assert(!!data.grades)
      t.end()
    } catch (e) {
      t.error(e)
    }
  })

  t.test('should return not found error', async (t) => {
    const studentId = 'abc'
    const statusCode = 404
    const errorMsg = 'Not Found'
    const url = `${endpoint}/student/${studentId}/grades`

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

tape('GET /course/all/grades endpoint', function (t) {
  const grades = [
    {
      id: 1,
      course: 'Calculus',
      grade: 50
    },
    {
      id: 1,
      course: 'Microeconomics',
      grade: 43
    },
    {
      id: 1,
      course: 'Statistics',
      grade: 50
    },
    {
      id: 1,
      course: 'Astronomy',
      grade: 63
    },
    {
      id: 2,
      course: 'Calculus',
      grade: 9
    },
    {
      id: 2,
      course: 'Microeconomics',
      grade: 11
    },
    {
      id: 3,
      course: 'Microeconomics',
      grade: 38
    },
    {
      id: 4,
      course: 'Philosophy',
      grade: 79
    },
    {
      id: 4,
      course: 'Calculus',
      grade: 1
    },
    {
      id: 4,
      course: 'Microeconomics',
      grade: 10
    },
    {
      id: 5,
      course: 'Microeconomics',
      grade: 69
    },
    {
      id: 5,
      course: 'Philosophy',
      grade: 54
    },
    {
      id: 5,
      course: 'Statistics',
      grade: 22
    }
  ]

  const expectedStats = {
    highestGrade: [
      { id: 1, course: 'Calculus', grade: 50 },
      { id: 5, course: 'Microeconomics', grade: 69 },
      { id: 1, course: 'Statistics', grade: 50 },
      { id: 1, course: 'Astronomy', grade: 63 },
      { id: 4, course: 'Philosophy', grade: 79 }
    ],
    lowestGrade: [
      { id: 4, course: 'Calculus', grade: 1 },
      { id: 4, course: 'Microeconomics', grade: 10 },
      { id: 5, course: 'Statistics', grade: 22 },
      { id: 1, course: 'Astronomy', grade: 63 },
      { id: 5, course: 'Philosophy', grade: 54 }
    ],
    averageGrade: [
      { id: 1, course: 'Calculus', average: 20 },
      { id: 1, course: 'Microeconomics', average: 34.2 },
      { id: 1, course: 'Statistics', average: 36 },
      { id: 1, course: 'Astronomy', average: 63 },
      { id: 4, course: 'Philosophy', average: 66.5 }
    ]
  }

  t.test('should return object highestGrade, lowestGrade and averageGrade', async (t) => {
    const statusCode = 200
    const url = `${endpoint}/course/all/grades`

    try {
      const { data, response } = await jsonist.get(url)
      t.deepEqual(calculateGradeStats(grades), expectedStats)
      t.equal(statusCode, response.statusCode)
      t.assert(!!data.highestGrade)
      t.assert(!!data.lowestGrade)
      t.assert(!!data.averageGrade)
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
