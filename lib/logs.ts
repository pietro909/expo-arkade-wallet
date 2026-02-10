import { extractError } from './error'

enum LogLevel {
  Log = 'log',
  Error = 'error',
}

export type LogLine = {
  msg: string
  time: string
  level: string
}

const logs: LogLine[] = []
const MAX_LOGS = 200

export const getLogs = (): LogLine[] => logs

export const getInfoLogs = (): LogLine[] => logs.filter((l) => l.level === 'info')

export const clearLogs = () => logs.splice(0, logs.length)

const addLog = (level: LogLevel, args: string[]) => {
  logs.push({
    level,
    msg: args.join(' '),
    time: new Date().toString(),
  })
  if (logs.length > MAX_LOGS) {
    logs.splice(0, logs.length - MAX_LOGS)
  }
}

export const consoleLog = (...args: any[]) => {
  addLog(LogLevel.Log, args)
  console.log(...args)
}

export const consoleError = (err: any, msg = '') => {
  const str = (msg ? `${msg}: ` : '') + extractError(err)
  addLog(LogLevel.Error, [str])
  console.error(str)
}
