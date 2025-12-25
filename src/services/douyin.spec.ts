import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import * as fs from 'fs';
import { EventEmitter } from 'events';
import { DouyinProcessor } from './douyin';

// Mock axios
vi.mock('axios');

// Mock fs
vi.mock('fs', async () => {
  const actual = await vi.importActual<typeof import('fs')>('fs');
  return {
    ...actual,
    createWriteStream: vi.fn(),
    existsSync: vi.fn(),
    unlinkSync: vi.fn(),
  };
});

// Mock logger to avoid console spam during tests
vi.mock('../utils/logger', () => ({
  logInfo: vi.fn(),
  logError: vi.fn(),
  logWarn: vi.fn(),
  logDebug: vi.fn(),
  formatLogMessage: vi.fn(),
}));

describe('抖音处理器 (DouyinProcessor)', () => {
  let processor: DouyinProcessor;

  beforeEach(() => {
    vi.clearAllMocks();
    processor = new DouyinProcessor();
  });

  describe('parseShareUrl (解析分享链接)', () => {
    it('应能从文本中提取链接并解析视频信息', async () => {
      // 准备模拟数据
      const shareText = '看看这个视频 https://v.douyin.com/test/ 复制此链接';
      const redirectUrl = 'https://www.iesdouyin.com/share/video/123456/?region=CN';
      const videoHtml = `
        <html>
          <script>
            // 模拟包含视频信息的 JSON 数据
            const data = {
              "play_addr": {
                "url_list": ["https://aweme.snssdk.com/aweme/v1/playwm/?video_id=123456"]
              },
              "desc": "测试视频标题"
            };
          </script>
          <body>
            "play_addr":{"url_list":["https://aweme.snssdk.com/aweme/v1/playwm/?video_id=123456"]}
            "desc": "测试视频标题"
          </body>
        </html>
      `;

      // 设置 axios mock
      (axios.get as any).mockImplementation((url: string) => {
        if (url.includes('v.douyin.com')) {
            // 模拟重定向请求
            return Promise.resolve({
                request: {
                    res: {
                        responseUrl: redirectUrl
                    }
                }
            });
        }
        if (url.includes('iesdouyin.com/share/video')) {
            // 模拟视频页面请求
            return Promise.resolve({
                data: videoHtml
            });
        }
        return Promise.reject(new Error('未知的 URL'));
      });

      // 执行测试
      const result = await processor.parseShareUrl(shareText);

      // 验证结果
      expect(result).toMatchObject({
        videoId: '123456',
        title: '测试视频标题',
        url: 'https://aweme.snssdk.com/aweme/v1/play/?video_id=123456' // playwm replaced by play
      });
    });

    it('当文本中没有链接时应抛出错误', async () => {
      const shareText = '这是一段没有链接的文本';
      
      await expect(processor.parseShareUrl(shareText))
        .rejects
        .toThrow('未找到有效的分享链接');
    });

    it('当网络请求失败时应抛出错误', async () => {
      const shareText = 'https://v.douyin.com/error/';
      (axios.get as any).mockRejectedValue(new Error('网络连接超时'));

      await expect(processor.parseShareUrl(shareText))
        .rejects
        .toThrow('解析抖音分享链接失败: 网络连接超时');
    });
  });

  describe('downloadVideo (下载视频)', () => {
    it('应成功下载视频并报告进度', async () => {
      const videoInfo = {
        url: 'https://example.com/video.mp4',
        title: '测试视频',
        videoId: '123456'
      };

      // Mock stream
      const mockStream = new EventEmitter();
      (mockStream as any).pipe = vi.fn();

      // Mock axios response
      (axios.get as any).mockResolvedValue({
        headers: { 'content-length': '1024' },
        data: mockStream
      });

      // Mock file writer
      const mockWriter = new EventEmitter();
      (fs.createWriteStream as any).mockReturnValue(mockWriter);

      // Progress callback
      const onProgress = vi.fn();

      // Start download
      const downloadPromise = processor.downloadVideo(videoInfo, onProgress);

      // Wait for async operations to setup listeners
      await new Promise(resolve => setTimeout(resolve, 0));

      // Simulate data chunks
      mockStream.emit('data', Buffer.alloc(512));
      mockStream.emit('data', Buffer.alloc(512));

      // Simulate finish
      mockWriter.emit('finish');

      const result = await downloadPromise;

      expect(result).toContain('123456.mp4');
      expect(onProgress).toHaveBeenCalledTimes(2);
      expect(onProgress).toHaveBeenLastCalledWith({
        downloaded: 1024,
        total: 1024,
        percentage: 100
      });
    });

    it('当下载流出错时应抛出错误', async () => {
      const videoInfo = {
        url: 'https://example.com/video.mp4',
        title: '测试视频',
        videoId: '123456'
      };

      const mockStream = new EventEmitter();
      (mockStream as any).pipe = vi.fn();

      (axios.get as any).mockResolvedValue({
        headers: { 'content-length': '1024' },
        data: mockStream
      });

      const mockWriter = new EventEmitter();
      (fs.createWriteStream as any).mockReturnValue(mockWriter);

      const downloadPromise = processor.downloadVideo(videoInfo);

      // Wait for async operations to setup listeners
      await new Promise(resolve => setTimeout(resolve, 0));

      // Simulate error
      const error = new Error('Stream Error');
      mockStream.emit('error', error);

      await expect(downloadPromise).rejects.toThrow('下载视频失败: Stream Error');
    });
  });
});
