const fs = require('fs')
try {
  const data = fs.readFileSync('./grades.json', 'utf8')
  const jsonData = JSON.parse(data)
  module.exports = { studentData: jsonData, studentError: null }
} catch (e) {
  module.exports = { studentData: null, studentError: e }
}
