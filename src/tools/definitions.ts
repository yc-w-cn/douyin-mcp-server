// 抖音工具定义

export const toolDefinitions = {
  listChanged: false,
  tools: [
    {
      name: "get_douyin_download_link",
      description: "解析抖音分享链接，获取无水印下载地址",
      inputSchema: {
        type: "object",
        properties: {
          share_text: {
            type: "string",
            description: "抖音分享文本或链接"
          }
        },
        required: ["share_text"]
      }
    },
    {
      name: "download_douyin_video",
      description: "下载抖音视频文件",
      inputSchema: {
        type: "object",
        properties: {
          share_text: {
            type: "string",
            description: "抖音分享文本或链接"
          }
        },
        required: ["share_text"]
      }
    },
    {
      name: "parse_douyin_video_info",
      description: "解析抖音视频基本信息",
      inputSchema: {
        type: "object",
        properties: {
          share_text: {
            type: "string",
            description: "抖音分享文本或链接"
          }
        },
        required: ["share_text"]
      }
    }
  ]
};