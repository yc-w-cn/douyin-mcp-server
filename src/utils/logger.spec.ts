import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatLogMessage, logInfo, logWarn, logError, logDebug } from './logger';

describe('日志工具 (Logger)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T00:00:00.000Z'));
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    delete process.env.DEBUG;
  });

  describe('formatLogMessage', () => {
    it('应该正确格式化基本日志消息', () => {
      const message = '测试消息';
      const result = formatLogMessage('info', message);
      expect(result).toBe('[2024-01-01T00:00:00.000Z] [INFO] 测试消息');
    });

    it('应该正确格式化带上下文的日志消息', () => {
      const message = '测试消息';
      const context = { id: 123 };
      const result = formatLogMessage('error', message, context);
      expect(result).toBe('[2024-01-01T00:00:00.000Z] [ERROR] 测试消息 [{"id":123}]');
    });
  });

  describe('logInfo', () => {
    it('应该调用 console.log', () => {
      logInfo('信息消息');
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('[INFO] 信息消息'));
    });
  });

  describe('logWarn', () => {
    it('应该调用 console.warn', () => {
      logWarn('警告消息');
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('[WARN] 警告消息'));
    });
  });

  describe('logError', () => {
    it('应该调用 console.error', () => {
      logError('错误消息');
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('[ERROR] 错误消息'));
    });
  });

  describe('logDebug', () => {
    it('当 DEBUG 环境变量未设置时不应输出', () => {
      logDebug('调试消息');
      expect(console.debug).not.toHaveBeenCalled();
    });

    it('当 DEBUG 环境变量设置时应该输出', () => {
      process.env.DEBUG = 'true';
      logDebug('调试消息');
      expect(console.debug).toHaveBeenCalledWith(expect.stringContaining('[DEBUG] 调试消息'));
    });
  });
});
