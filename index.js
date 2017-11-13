'use strict';
// https://us-central1-glass-turbine-148103.cloudfunctions.net/questionSurvey101
const http = require('http');
exports.askQuestion = (req, res) => {
  const reqParams = req.body.result;
  const reqStr = JSON.stringify(reqParams, null, 2)
  res.setHeader('Content-Type', 'application/json');

  res.send(JSON.stringify({
    'speech': reqStr, 'displayText': reqStr, contextOut: [
      {
        "name": "askQuestion",
        "parameters": {
          "nick-name": "my 300"
        },
        "lifespan": 5
      }
    ]
  }));
}