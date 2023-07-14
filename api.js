const fs = require('fs').promises
const knex = require('./db')

module.exports = {
  getHealth,
  getStudent,
  getStudentGradesReport,
  getCourseGradesReport
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
    const student = await knex('students').where({ id }).first()

    if (!student) {
      const message = `Student with ID ${id} not found`
      const notFoundError = new Error(message)
      notFoundError.statusCode = 404
      throw notFoundError
    }

    res.json(student)
  } catch (e) {
    console.log(e)
    next()
  }
}

async function getStudentGradesReport (req, res, next) {
  try {
    const id = req.params.id
    const student = await knex('students').where({ id }).limit(1).first()

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
    next()
  }
}

async function getCourseGradesReport (req, res, next) {
  try {
    const studentsGrades = await getGrades()
    const stats = calculateGradeStats(studentsGrades)
    res.json(stats)
  } catch (e) {
    console.log(e)
    next()
  }
}

function getStudentWithGrade (student, grades) {
  const studentGrades = { ...student, grades }
  return studentGrades
}

async function getGrades () {
  try {
    const data = await fs.readFile('./grades.json', 'utf8')
    const jsonData = JSON.parse(data)
    return jsonData
  } catch (error) {
    console.error('Error reading JSON file:', error)
    throw error
  }
}

function calculateGradeStats (students) {
  const highestGrade = {}
  const lowestGrade = {}
  const averageGrade = {}
  students.forEach(student => {
    const { course, grade, id } = student

    if (!highestGrade[course] || highestGrade[course].grade < grade) {
      highestGrade[course] = student
    }

    if (!lowestGrade[course] || lowestGrade[course].grade > grade) {
      lowestGrade[course] = student
    }

    if (!averageGrade[course]) {
      averageGrade[course] = { id, course, sum: 0, count: 0 }
    }
    averageGrade[course].sum += grade
    averageGrade[course].count++
  })

  calculateAverage(averageGrade)

  return {
    highestGrade: Object.values(highestGrade),
    lowestGrade: Object.values(lowestGrade),
    averageGrade: Object.values(averageGrade)
  }
}

function calculateAverage (averageGrade) {
  for (const course in averageGrade) {
    averageGrade[course].average = Number((averageGrade[course].sum / averageGrade[course].count).toFixed(2))
    delete averageGrade[course].sum
    delete averageGrade[course].count
  }
}
