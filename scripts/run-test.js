const fs = require("fs")
const exec = require("child_process").exec

const LogQueue = () => {
  let lastPromise = Promise.resolve()

  return {
    asyncLog: async str => {
      await lastPromise
      return (lastPromise = new Promise(resolve => {
        setTimeout(() => {
          console.log(str)
          resolve()
        }, 50)
      }))
    },
    watchLog: lastPromise
  }
}

const { asyncLog: myQueue } = LogQueue()

const _ = (strTemplate, ...holes) => myQueue(strTemplate[0] + holes.join(" "))

const runTest = async _path => {
  !_path && _`No path specified, try with "src"`
  const path = _path ? _path : "src"

  _`Scan: ${path}`
  const exist = fs.existsSync(path)

  if (!exist) return _`[ERR] Please provide exist path`

  const isDir = fs.lstatSync(path).isDirectory()
  const isTestFile = path.endsWith(".test.js")

  if (!isDir && !isTestFile) return

  if (!isDir && isTestFile) {
    _`Running test`
    const testFile = path
    const cmd = `babel-node ${testFile}`

    try {
      const testResult = await new Promise((resolve, reject) =>
        exec(cmd, (err, stdout) => {
          if (err) return reject(err)
          return resolve(stdout)
        })
      )
      _`${testResult}`
    } catch (err) {
      _`[ERR] Test file: ${testFile}`
    }

    return
  }

  const listInPath = fs.readdirSync(path)

  // Run single test at time
  // Parallel all of them >>> nearly killing my machine
  await listInPath.reduce(async (carry, file) => {
    await carry
    const currPath = `${path}/${file}`
    return runTest(currPath)
  }, Promise.resolve())
}
;(async () => {
  const args = process.argv.slice(2)
  const path = args[0]
  await runTest(path)
  _`All test runned`
})()
