import { DouyinProcessor } from '../services/douyin';

/**
 * 获取抖音视频的无水印下载链接
 */
export async function getDouyinDownloadLink(shareLink: string): Promise<{
  status: string;
  videoId: string;
  title: string;
  downloadUrl: string;
  description: string;
  usageTip: string;
}> {
  try {
    const processor = new DouyinProcessor();
    const videoInfo = await processor.parseShareUrl(shareLink);
    
    return {
      status: 'success',
      videoId: videoInfo.videoId,
      title: videoInfo.title,
      downloadUrl: videoInfo.url,
      description: `视频标题: ${videoInfo.title}`,
      usageTip: '可以直接使用此链接下载无水印视频'
    };
  } catch (error) {
    return {
      status: 'error',
      videoId: '',
      title: '',
      downloadUrl: '',
      description: '',
      usageTip: `获取下载链接失败: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * 下载抖音视频文件
 */
export async function downloadDouyinVideo(shareLink: string): Promise<{
  status: string;
  videoId: string;
  title: string;
  filePath: string;
  message: string;
}> {
  try {
    const processor = new DouyinProcessor();
    
    // 解析分享链接
    console.log('正在解析抖音分享链接...');
    const videoInfo = await processor.parseShareUrl(shareLink);
    
    // 下载视频
    console.log(`开始下载视频: ${videoInfo.title}`);
    const filePath = await processor.downloadVideo(videoInfo, (progress) => {
      if (progress.total > 0) {
        const percent = progress.percentage.toFixed(1);
        const downloaded = (progress.downloaded / 1024 / 1024).toFixed(1);
        const total = (progress.total / 1024 / 1024).toFixed(1);
        process.stdout.write(`\r下载进度: ${percent}% (${downloaded}MB/${total}MB)`);
      }
    });
    
    return {
      status: 'success',
      videoId: videoInfo.videoId,
      title: videoInfo.title,
      filePath,
      message: `视频下载完成: ${filePath}`
    };
  } catch (error) {
    return {
      status: 'error',
      videoId: '',
      title: '',
      filePath: '',
      message: `下载视频失败: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * 解析抖音分享链接，获取视频基本信息
 */
export async function parseDouyinVideoInfo(shareLink: string): Promise<{
  status: string;
  videoId: string;
  title: string;
  downloadUrl: string;
}> {
  try {
    const processor = new DouyinProcessor();
    const videoInfo = await processor.parseShareUrl(shareLink);
    
    return {
      status: 'success',
      videoId: videoInfo.videoId,
      title: videoInfo.title,
      downloadUrl: videoInfo.url
    };
  } catch (error) {
    return {
      status: 'error',
      videoId: '',
      title: '',
      downloadUrl: `解析失败: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}