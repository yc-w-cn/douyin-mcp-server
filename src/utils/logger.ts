// 日志工具函数

/**
 * 格式化日志消息
 */
export function formatLogMessage(level: string, message: string, context?: any): string {
  const timestamp = new Date().toISOString();
  const contextStr = context ? ` [${JSON.stringify(context)}]` : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
}

/**
 * 信息级别日志
 */
export function logInfo(message: string, context?: any): void {
  console.log(formatLogMessage('info', message, context));
}

/**
 * 警告级别日志
 */
export function logWarn(message: string, context?: any): void {
  console.warn(formatLogMessage('warn', message, context));
}

/**
 * 错误级别日志
 */
export function logError(message: string, context?: any): void {
  console.error(formatLogMessage('error', message, context));
}

/**
 * 调试级别日志
 */
export function logDebug(message: string, context?: any): void {
  if (process.env.DEBUG) {
    console.debug(formatLogMessage('debug', message, context));
  }
}