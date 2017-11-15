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
          buttons: [
            {
              postback: "Card Link URL or text",
              text: "Card Link Title"
            }
          ],
          imageUrl: "https://tinker.press/images/favicon.png",
          platform: "facebook",
          subtitle: "Card Subtitle",
          title: "Card Title",
          type: 1
        }
      ]
    })
  )
}
