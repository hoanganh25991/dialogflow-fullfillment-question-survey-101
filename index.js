"use strict"
// https://us-central1-glass-turbine-148103.cloudfunctions.net/questionSurvey101
const http = require("http")
const fs = require("fs")
exports.askQuestion = (req, res) => {
  const reqParams = req.body.result
  // const reqStr = JSON.stringify(req.body.originalRequest, null, 2)
  const reqStr = JSON.stringify(req.body, null, 2)
  res.setHeader("Content-Type", "application/json")

  const answerLogPath = `${__dirname}/answer.log`
  const hasFile = fs.existsSync(answerLogPath)
  const lastLogContent = hasFile ? fs.readFileSync(answerLogPath).toString() : ""

  const sessionId = req.body.sessionId

  const currTimestamp = new Date().getTime()
  const content = lastLogContent + JSON.stringify({ [currTimestamp]: sessionId })

  res.send(
    JSON.stringify({
      speech: content
    })
  )
}
