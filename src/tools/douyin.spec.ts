import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getDouyinDownloadLink, downloadDouyinVideo, parseDouyinVideoInfo } from './douyin';
import { DouyinProcessor } from '../services/douyin';

const mockParseShareUrl = vi.fn();
const mockDownloadVideo = vi.fn();

vi.mock('../services/douyin', () => {
  return {
    DouyinProcessor: vi.fn().mockImplementation(function() {
      return {
        parseShareUrl: mockParseShareUrl,
        downloadVideo: mockDownloadVideo
      };
    })
  };
});

vi.mock('../utils/logger');

describe('抖音工具集测试', () => {
  const mockVideoInfo = {
    videoId: '123456',
    title: '测试视频',
    url: 'http://example.com/video.mp4'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockParseShareUrl.mockReset();
    mockDownloadVideo.mockReset();
  });

  describe('getDouyinDownloadLink', () => {
    it('应该成功获取下载链接', async () => {
      mockParseShareUrl.mockResolvedValue(mockVideoInfo);

      const result = await getDouyinDownloadLink('http://douyin.com/share');

      expect(result.status).toBe('success');
      expect(result.videoId).toBe(mockVideoInfo.videoId);
      expect(result.title).toBe(mockVideoInfo.title);
      expect(result.downloadUrl).toBe(mockVideoInfo.url);
    });

    it('应该处理错误', async () => {
      mockParseShareUrl.mockRejectedValue(new Error('Parse failed'));

      const result = await getDouyinDownloadLink('http://douyin.com/share');

      expect(result.status).toBe('error');
      expect(result.usageTip).toContain('Parse failed');
    });
    it('应该处理非 Error 类型的错误', async () => {
      mockParseShareUrl.mockRejectedValue('String error');

      const result = await getDouyinDownloadLink('http://douyin.com/share');

      expect(result.status).toBe('error');
      expect(result.usageTip).toContain('String error');
    });
  });

  describe('downloadDouyinVideo', () => {
    it('应该成功下载视频并报告进度', async () => {
      mockParseShareUrl.mockResolvedValue(mockVideoInfo);
      
      // 模拟下载过程，调用进度回调
      mockDownloadVideo.mockImplementation(async (info, callback) => {
        if (callback) {
          callback({ percentage: 50.0, downloaded: 1024 * 1024 * 5, total: 1024 * 1024 * 10 });
        }
        return '/path/to/video.mp4';
      });

      // 监听 stdout
      const stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);

      const result = await downloadDouyinVideo('http://douyin.com/share');

      expect(result.status).toBe('success');
      expect(result.filePath).toBe('/path/to/video.mp4');
      // 验证进度条输出
      expect(stdoutSpy).toHaveBeenCalledWith(expect.stringContaining('下载进度: 50.0%'));
      
      stdoutSpy.mockRestore();
    });

    it('当进度total为0时应正确显示', async () => {
      mockParseShareUrl.mockResolvedValue(mockVideoInfo);
      
      mockDownloadVideo.mockImplementation(async (info, callback) => {
        if (callback) {
          // Trigger total=0 case
          callback({ percentage: 0, downloaded: 0, total: 0 });
        }
        return '/path/to/video.mp4';
      });

      const stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);

      await downloadDouyinVideo('http://douyin.com/share');

      // Should NOT call stdout write because of if (progress.total > 0) check
      expect(stdoutSpy).not.toHaveBeenCalledWith(expect.stringContaining('下载进度'));
      
      stdoutSpy.mockRestore();
    });

    it('应该成功下载视频', async () => {
      mockParseShareUrl.mockResolvedValue(mockVideoInfo);
      mockDownloadVideo.mockResolvedValue('/path/to/video.mp4');

      const result = await downloadDouyinVideo('http://douyin.com/share');

      expect(result.status).toBe('success');
      expect(result.filePath).toBe('/path/to/video.mp4');
    });

    it('应该处理下载错误', async () => {
      mockParseShareUrl.mockResolvedValue(mockVideoInfo);
      mockDownloadVideo.mockRejectedValue(new Error('Download failed'));

      const result = await downloadDouyinVideo('http://douyin.com/share');

      expect(result.status).toBe('error');
      expect(result.message).toContain('Download failed');
    });

    it('应该处理非 Error 类型的下载错误', async () => {
      mockParseShareUrl.mockResolvedValue(mockVideoInfo);
      mockDownloadVideo.mockRejectedValue('String error');

      const result = await downloadDouyinVideo('http://douyin.com/share');

      expect(result.status).toBe('error');
      expect(result.message).toContain('String error');
    });
  });

  describe('parseDouyinVideoInfo', () => {
    it('应该成功解析视频信息', async () => {
      mockParseShareUrl.mockResolvedValue(mockVideoInfo);

      const result = await parseDouyinVideoInfo('http://douyin.com/share');

      expect(result.status).toBe('success');
      expect(result.videoId).toBe(mockVideoInfo.videoId);
    });

    it('应该处理解析错误', async () => {
      mockParseShareUrl.mockRejectedValue(new Error('Parse failed'));

      const result = await parseDouyinVideoInfo('http://douyin.com/share');

      expect(result.status).toBe('error');
      expect(result.downloadUrl).toContain('Parse failed');
    });

    it('应该处理非 Error 类型的解析错误', async () => {
      mockParseShareUrl.mockRejectedValue('String error');

      const result = await parseDouyinVideoInfo('http://douyin.com/share');

      expect(result.status).toBe('error');
      expect(result.downloadUrl).toContain('String error');
    });
  });
});
