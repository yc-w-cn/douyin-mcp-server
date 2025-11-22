import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import { WORK_DIR } from '../config';

// 请求头，模拟移动端访问
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) EdgiOS/121.0.2277.107 Version/17.0 Mobile/15E148 Safari/604.1'
};

export interface DouyinVideoInfo {
  url: string;
  title: string;
  videoId: string;
}

export interface DownloadProgress {
  downloaded: number;
  total: number;
  percentage: number;
}

export class DouyinProcessor {
  private tempDir: string;

  constructor() {
    this.tempDir = WORK_DIR;
  }

  /**
   * 从分享文本中提取无水印视频链接
   */
  async parseShareUrl(shareText: string): Promise<DouyinVideoInfo> {
    try {
      // 提取分享链接
      const urlRegex = /https?:\/\/[^\s]+/g;
      const urls = shareText.match(urlRegex);
      
      if (!urls || urls.length === 0) {
        throw new Error('未找到有效的分享链接');
      }

      const shareUrl = urls[0];
      
      // 获取重定向后的URL
      const shareResponse = await axios.get(shareUrl, { 
        headers: HEADERS,
        maxRedirects: 5
      });
      
      // 从URL中提取视频ID
      const finalUrl = shareResponse.request?.res?.responseUrl || shareUrl;
      const videoIdMatch = finalUrl.match(/video\/([^/?]+)/);
      const videoId = videoIdMatch ? videoIdMatch[1] : this.generateVideoId();
      
      const videoPageUrl = `https://www.iesdouyin.com/share/video/${videoId}`;
      
      // 获取视频页面内容
      const response = await axios.get(videoPageUrl, { headers: HEADERS });
      
      // 从HTML中提取视频信息
      const videoInfo = this.extractVideoInfoFromHtml(response.data, videoId);
      
      return videoInfo;
    } catch (error) {
      throw new Error(`解析抖音分享链接失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 从HTML内容中提取视频信息
   */
  private extractVideoInfoFromHtml(html: string, videoId: string): DouyinVideoInfo {
    // 尝试从HTML中提取视频URL
    const videoUrlMatch = html.match(/"play_addr"[^}]*"url_list"[^\[]*\[\s*"([^"]+)"/);
    
    if (videoUrlMatch && videoUrlMatch[1]) {
      // 替换为无水印链接
      const cleanUrl = videoUrlMatch[1].replace('playwm', 'play');
      
      // 提取视频标题
      const titleMatch = html.match(/"desc"\s*:\s*"([^"]+)"/) || 
                         html.match(/<title>([^<]+)<\/title>/);
      
      const title = titleMatch ? 
        titleMatch[1].replace(/[\\/:*?"<>|]/g, '_').trim() : 
        `douyin_${videoId}`;
      
      return {
        url: cleanUrl,
        title,
        videoId
      };
    }

    // 如果无法从HTML中提取，使用备用方法
    const backupUrl = `https://aweme.snssdk.com/aweme/v1/play/?video_id=${videoId}`;
    
    return {
      url: backupUrl,
      title: `douyin_${videoId}`,
      videoId
    };
  }

  /**
   * 下载视频文件
   */
  async downloadVideo(
    videoInfo: DouyinVideoInfo, 
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<string> {
    try {
      const filename = `${videoInfo.videoId}.mp4`;
      const filepath = path.join(this.tempDir, filename);
      
      console.log(`正在下载视频: ${videoInfo.title}`);
      
      const response = await axios.get(videoInfo.url, {
        headers: HEADERS,
        responseType: 'stream'
      });
      
      const totalSize = parseInt(response.headers['content-length'] || '0', 10);
      let downloadedSize = 0;
      
      return new Promise((resolve, reject) => {
        const writer = fs.createWriteStream(filepath);
        
        response.data.on('data', (chunk: Buffer) => {
          downloadedSize += chunk.length;
          
          if (onProgress) {
            onProgress({
              downloaded: downloadedSize,
              total: totalSize,
              percentage: totalSize > 0 ? (downloadedSize / totalSize) * 100 : 0
            });
          }
          
          // 控制台进度显示
          if (totalSize > 0) {
            const percent = ((downloadedSize / totalSize) * 100).toFixed(1);
            process.stdout.write(`\r下载进度: ${percent}% (${this.formatBytes(downloadedSize)}/${this.formatBytes(totalSize)})`);
          }
        });
        
        response.data.pipe(writer);
        
        writer.on('finish', () => {
          console.log('\n✅ 视频下载完成');
          resolve(filepath);
        });
        
        writer.on('error', reject);
        response.data.on('error', reject);
      });
    } catch (error) {
      throw new Error(`下载视频失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 格式化字节大小
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 生成视频ID（当无法从URL提取时使用）
   */
  private generateVideoId(): string {
    return 'douyin_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }

  /**
   * 清理临时文件
   */
  async cleanupFiles(...filePaths: string[]): Promise<void> {
    for (const filePath of filePaths) {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (error) {
        console.warn(`无法删除文件 ${filePath}:`, error);
      }
    }
  }
}