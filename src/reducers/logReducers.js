/**
 * Handle log in code
 * @param state
 * @param action
 * @returns {*}
 */
export const logReducers = (state = { msg: "", level: 0 }, action) => {
  const { type, ...others } = action
  switch (type) {
    case "LOG":
    case "LOG_MSG": {
      return { ...state, ...others }
    }
    case "INCREASE_LOG_LEVEL": {
      const { level = 0 } = state
      const nextLevel = level + 1
      return { ...state, level: nextLevel }
    }
    case "DECREASE_LOG_LEVEL": {
      const { level = 0 } = state
      const nextLevel = level - 1
      return { ...state, level: nextLevel }
    }
    default: {
      return state
    }
  }
}

/**
 * State monitor (only log msg) by
 * Dump into console
 * @param store
 * @constructor
 */
export const LogToConsole = (getState, store) => {
  let lastLogState = null

  store.subscribe(() => {
    const logState = getState()
    const shouldLog = !lastLogState || lastLogState.msg !== logState.msg

    if (shouldLog) {
      lastLogState = logState
      const msg = (logState && logState.msg) || ""
      const level = (logState && logState.level) || 0
      const paddingLength = level * 2 + 1
      const padding = paddingLength >= 0 ? new Array(paddingLength).join(" ") : ""
      const paddingWithRootSlash = level > 0 ? `${padding}\\__` : padding
      console.log(`${paddingWithRootSlash} ${msg}`)
    }
  })
}
