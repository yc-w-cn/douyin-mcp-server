import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { clearWorkdir } from './file';
import { WORK_DIR } from '../config';

vi.mock('fs');
vi.mock('../config', () => ({
  WORK_DIR: '/mock/work/dir'
}));

describe('文件服务测试', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('clearWorkdir', () => {
    it('应该删除工作目录下的所有文件', () => {
      // Mock readdirSync to return some files
      vi.mocked(fs.readdirSync).mockReturnValue(['file1.txt', 'file2.mp4'] as any);
      // Mock lstatSync to say they are files
      vi.mocked(fs.lstatSync).mockReturnValue({ isFile: () => true } as any);
      vi.mocked(fs.unlinkSync).mockImplementation(() => undefined);

      const result = clearWorkdir();

      expect(fs.readdirSync).toHaveBeenCalledWith('/mock/work/dir');
      expect(fs.unlinkSync).toHaveBeenCalledTimes(2);
      expect(result.removed).toEqual(['file1.txt', 'file2.mp4']);
      expect(result.message).toContain('工作区清理完成');
    });

    it('应该忽略子目录', () => {
       vi.mocked(fs.readdirSync).mockReturnValue(['subdir', 'file1.txt'] as any);
       vi.mocked(fs.lstatSync).mockImplementation((filePath) => {
         if (String(filePath).endsWith('subdir')) {
           return { isFile: () => false } as any;
         }
         return { isFile: () => true } as any;
       });

       const result = clearWorkdir();

       expect(fs.unlinkSync).toHaveBeenCalledTimes(1);
       expect(result.removed).toEqual(['file1.txt']);
    });

    it('应该处理删除文件时的错误', () => {
      vi.mocked(fs.readdirSync).mockReturnValue(['error.txt'] as any);
      vi.mocked(fs.lstatSync).mockReturnValue({ isFile: () => true } as any);
      vi.mocked(fs.unlinkSync).mockImplementation(() => {
        throw new Error('Delete failed');
      });

      const result = clearWorkdir();

      expect(result.removed).toEqual([]);
    });
  });
});
