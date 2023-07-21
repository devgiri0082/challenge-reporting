const knex = require('./db')
const { studentData, studentError } = require('./grades')

module.exports = {
  getHealth,
  getStudent,
  getStudentGradesReport,
  getCourseGradesReport,
  calculateGradeStats

}

async function getHealth (req, res, next) {
  try {
    await knex('students').first()
    res.json({ success: true })
  } catch (e) {
    console.log(e)
    res.status(500).end()
  }
}

async function getStudent (req, res, next) {
  try {
    const id = req.params.id
    const student = await knex('students')
      .select('id', 'email', 'first_name', 'last_name', 'address', 'city', 'state', 'zip', 'phone')
      .where({ id })
      .first()

    if (!student) {
      const message = `Student with ID ${id} not found`
      const notFoundError = new Error(message)
      notFoundError.statusCode = 404
      throw notFoundError
    }

    res.json(student)
  } catch (e) {
    console.log(e)
    next(e)
  }
}

async function getStudentGradesReport (req, res, next) {
  try {
    const id = req.params.id
    const student = await knex('students')
      .select('id', 'email', 'first_name', 'last_name', 'address', 'city', 'state', 'zip', 'phone')
      .where({ id })
      .first()

    if (!student) {
      const message = `Student with ID ${id} not found`
      const notFoundError = new Error(message)
      notFoundError.statusCode = 404
      throw notFoundError
    }

    const studentsGrades = await getGrades()
    const grades = studentsGrades.filter(({ id }) => id === student.id)
    const studentWithGrades = getStudentWithGrade(student, grades)
    res.json(studentWithGrades)
  } catch (e) {
    console.log(e)
    next(e)
  }
}

async function getCourseGradesReport (req, res, next) {
  try {
    const studentsGrades = await getGrades()
    const stats = await calculateGradeStats(studentsGrades)
    res.json(stats)
  } catch (e) {
    console.log(e)
    next(e)
  }
}

function getStudentWithGrade (student, grades) {
  const studentGrades = { ...student, grades }
  return studentGrades
}

async function getGrades () {
  try {
    if (studentError) {
      throw (studentError)
    }
    return studentData
  } catch (error) {
    console.error('Error reading JSON file:', error)
    throw error
  }
}

function calculateGradeStats (
  students,
  data = { highestGrade: {}, lowestGrade: {}, averageGrade: {}, index: 0 }
) {
  const CHUNK_SIZE = 1000
  return new Promise((resolve, reject) => {
    if (students.length <= data.index) {
      calculateAverage(data.averageGrade)
      return resolve({
        highestGrade: Object.values(data.highestGrade),
        lowestGrade: Object.values(data.lowestGrade),
        averageGrade: Object.values(data.averageGrade)
      })
    }
    const currStudents = students.slice(data.index, data.index + CHUNK_SIZE)
    data.index += CHUNK_SIZE

    for (const student of currStudents) {
      calculateGradeStat(student, data)
    }

    setImmediate(() => {
      calculateGradeStats(students, data).then(resolve).catch(reject)
    })
  })
}

function calculateGradeStat (student, data) {
  const { course, grade } = student
  if (!data.highestGrade[course] || data.highestGrade[course].grade < grade) {
    data.highestGrade[course] = student
  }

  if (!data.lowestGrade[course] || data.lowestGrade[course].grade > grade) {
    data.lowestGrade[course] = student
  }

  if (!data.averageGrade[course]) {
    data.averageGrade[course] = { course, sum: 0, count: 0 }
  }
  data.averageGrade[course].sum += grade
  data.averageGrade[course].count++
}

function calculateAverage (averageGrade) {
  for (const course in averageGrade) {
    averageGrade[course].average = Number((averageGrade[course].sum / averageGrade[course].count).toFixed(2))
    delete averageGrade[course].sum
    delete averageGrade[course].count
  }
}
