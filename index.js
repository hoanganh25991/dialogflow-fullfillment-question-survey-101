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
      data: {
        facebook: {
          attachment: {
            type: "template",
            payload: {
              template_type: "generic",
              elements: [
                {
                  title: "Title: this is a title",
                  image_url: "https://developers.google.com/actions/images/badges/XPM_BADGING_GoogleAssistant_VER.png",
                  subtitle: "This is a subtitle",
                  default_action: {
                    type: "web_url",
                    url: "https://assistant.google.com/"
                  },
                  buttons: [
                    {
                      type: "web_url",
                      url: "https://assistant.google.com/",
                      title: "This is a button"
                    }
                  ]
                },
                {
                  title: "Title: this is a title",
                  image_url: "https://developers.google.com/actions/images/badges/XPM_BADGING_GoogleAssistant_VER.png",
                  subtitle: "This is a subtitle",
                  default_action: {
                    type: "web_url",
                    url: "https://assistant.google.com/"
                  },
                  buttons: [
                    {
                      type: "web_url",
                      url: "https://assistant.google.com/",
                      title: "This is a button"
                    }
                  ]
                },
                {
                  title: "Title: this is a title",
                  image_url: "https://developers.google.com/actions/images/badges/XPM_BADGING_GoogleAssistant_VER.png",
                  subtitle: "This is a subtitle",
                  default_action: {
                    type: "web_url",
                    url: "https://assistant.google.com/"
                  },
                  buttons: [
                    {
                      type: "web_url",
                      url: "https://assistant.google.com/",
                      title: "This is a button"
                    }
                  ]
                }
              ]
            }
          }
        }
      },
      displayText: reqStr
    })
  )
}
