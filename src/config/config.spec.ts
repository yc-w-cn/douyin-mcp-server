import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fs from 'fs';
import { initializeWorkDir, validateEnvironment } from './config';
import { logInfo, logError } from '../utils/logger';

vi.mock('fs');
vi.mock('../utils/logger');

describe('配置模块测试', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validateEnvironment', () => {
    it('应该记录工作目录信息', () => {
      validateEnvironment();
      expect(logInfo).toHaveBeenCalledWith(expect.stringContaining('工作目录:'));
    });
  });

  describe('initializeWorkDir', () => {
    it('如果目录不存在，应该创建目录', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      vi.mocked(fs.mkdirSync).mockImplementation(() => undefined);

      initializeWorkDir();

      expect(fs.existsSync).toHaveBeenCalled();
      expect(fs.mkdirSync).toHaveBeenCalledWith(expect.any(String), { recursive: true });
      expect(logInfo).toHaveBeenCalledWith(expect.stringContaining('工作目录已创建'));
    });

    it('如果目录已存在，应该记录信息', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);

      initializeWorkDir();

      expect(fs.mkdirSync).not.toHaveBeenCalled();
      expect(logInfo).toHaveBeenCalledWith(expect.stringContaining('使用工作目录'));
    });

    it('如果创建目录失败，应该退出进程', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      vi.mocked(fs.mkdirSync).mockImplementation(() => {
        throw new Error('Permission denied');
      });
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {}) as any);

      initializeWorkDir();

      expect(logError).toHaveBeenCalled();
      expect(exitSpy).toHaveBeenCalledWith(1);
      
      exitSpy.mockRestore();
    });
  });
});
