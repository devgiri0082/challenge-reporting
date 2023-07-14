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
    const student = await knex('students').where({ id }).limit(1).first()
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
  throw new Error('This method has not been implemented yet.')
}

async function getCourseGradesReport (req, res, next) {
  throw new Error('This method has not been implemented yet.')
}
