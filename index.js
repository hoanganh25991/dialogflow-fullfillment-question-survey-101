"use strict"
// https://us-central1-glass-turbine-148103.cloudfunctions.net/questionSurvey101
const http = require("http")
exports.askQuestion = (req, res) => {
  const reqParams = req.body.result
  // const reqStr = JSON.stringify(req.body.originalRequest, null, 2)
  const reqStr = JSON.stringify(req.body, null, 2)
  res.setHeader("Content-Type", "application/json")

  res.send(
    JSON.stringify({
      speech: "Default speech",
      messages: [
        {
          // "platform": "facebook",
          replies: ["Quick reply 1", "Quick reply 2", "Quick reply 3"],
          title: "Quick Reply Title",
          type: 2
        }
      ]
    })
  )
}
