import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod/v3";
import { logInfo } from "./utils/logger";

// 导入配置和服务
import { validateEnvironment, initializeWorkDir } from "./config";
import {
  getDouyinDownloadLink,
  downloadDouyinVideo,
  parseDouyinVideoInfo,
} from "./tools/douyin";

// 验证环境变量并初始化工作目录
validateEnvironment();
initializeWorkDir();

// 创建 MCP 服务器
const server = new McpServer({
  name: "douyin-mcp-server",
  version: "1.0.0",
  description: "抖音视频解析与下载 MCP 服务器",
});

// 注册抖音工具处理器
server.registerTool(
  "get_douyin_download_link",
  {
    title: "获取抖音无水印下载链接",
    description: "解析抖音分享链接，获取无水印视频下载链接",
    inputSchema: z.object({
      share_link: z.string().describe("抖音分享链接或包含链接的文本"),
    }),
  },
  async ({ share_link }) => {
    try {
      const result = await getDouyinDownloadLink(share_link);

      if (result.status === "success") {
        return {
          content: [
            {
              type: "text",
              text:
                `✅ 成功获取抖音视频下载链接\n\n` +
                `📱 视频标题: ${result.title}\n` +
                `🆔 视频ID: ${result.videoId}\n` +
                `🔗 下载链接: ${result.downloadUrl}\n\n` +
                `💡 ${result.usageTip}`,
            },
          ],
        };
      } else {
        return {
          content: [
            {
              type: "text",
              text: `❌ ${result.usageTip}`,
            },
          ],
          isError: true,
        };
      }
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `获取抖音下载链接失败: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
        isError: true,
      };
    }
  }
);

server.registerTool(
  "download_douyin_video",
  {
    title: "下载抖音视频",
    description: "解析抖音分享链接并下载视频文件，显示下载进度",
    inputSchema: z.object({
      share_link: z.string().describe("抖音分享链接或包含链接的文本"),
    }),
  },
  async ({ share_link }) => {
    try {
      const result = await downloadDouyinVideo(share_link);

      if (result.status === "success") {
        return {
          content: [
            {
              type: "text",
              text:
                `✅ ${result.message}\n\n` +
                `📱 视频标题: ${result.title}\n` +
                `🆔 视频ID: ${result.videoId}\n` +
                `💾 文件路径: ${result.filePath}`,
            },
          ],
        };
      } else {
        return {
          content: [
            {
              type: "text",
              text: `❌ ${result.message}`,
            },
          ],
          isError: true,
        };
      }
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `下载抖音视频失败: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
        isError: true,
      };
    }
  }
);

server.registerTool(
  "parse_douyin_video_info",
  {
    title: "解析抖音视频信息",
    description: "解析抖音分享链接，获取视频基本信息",
    inputSchema: z.object({
      share_link: z.string().describe("抖音分享链接或包含链接的文本"),
    }),
  },
  async ({ share_link }) => {
    try {
      const result = await parseDouyinVideoInfo(share_link);

      if (result.status === "success") {
        return {
          content: [
            {
              type: "text",
              text:
                `📱 视频信息解析成功\n\n` +
                `📝 标题: ${result.title}\n` +
                `🆔 ID: ${result.videoId}\n` +
                `🔗 下载链接: ${result.downloadUrl}`,
            },
          ],
        };
      } else {
        return {
          content: [
            {
              type: "text",
              text: `❌ 解析失败: ${result.downloadUrl}`,
            },
          ],
          isError: true,
        };
      }
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `解析抖音视频信息失败: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
        isError: true,
      };
    }
  }
);

// 注册资源
server.registerResource(
  "douyin-video",
  new ResourceTemplate("douyin://video/{video_id}", { list: undefined }),
  {
    title: "抖音视频信息",
    description: "获取抖音视频的基本信息",
  },
  async (uri, { video_id }) => {
    try {
      const shareUrl = `https://www.iesdouyin.com/share/video/${video_id}`;
      const result = await parseDouyinVideoInfo(shareUrl);

      if (result.status === "success") {
        return {
          contents: [
            {
              uri: uri.href,
              mimeType: "text/plain",
              text:
                `抖音视频信息\n` +
                `视频ID: ${result.videoId}\n` +
                `标题: ${result.title}\n` +
                `下载链接: ${result.downloadUrl}`,
            },
          ],
        };
      } else {
        return {
          contents: [
            {
              uri: uri.href,
              mimeType: "text/plain",
              text: `获取视频信息失败: ${result.downloadUrl}`,
            },
          ],
        };
      }
    } catch (error) {
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "text/plain",
            text: `获取视频信息失败: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
      };
    }
  }
);

// 注册提示
server.registerPrompt(
  "douyin_video_download_guide",
  {
    title: "抖音视频下载使用指南",
    description: "抖音视频解析与下载功能使用说明",
  },
  async () => {
    return {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `# 抖音视频下载使用指南

## 功能说明
这个MCP服务器可以从抖音分享链接中提取无水印视频下载链接，并直接下载视频文件。

## 可用工具

### 1. 获取无水印下载链接
- **工具名**: \`get_douyin_download_link\`
- **功能**: 解析抖音分享链接，返回无水印视频下载链接
- **参数**: \`share_link\` - 抖音分享链接或包含链接的文本

### 2. 下载视频文件
- **工具名**: \`download_douyin_video\`
- **功能**: 解析并下载抖音视频文件，显示实时下载进度
- **参数**: \`share_link\` - 抖音分享链接或包含链接的文本

### 3. 解析视频信息
- **工具名**: \`parse_douyin_video_info\`
- **功能**: 仅解析抖音视频的基本信息
- **参数**: \`share_link\` - 抖音分享链接或包含链接的文本

## 使用示例

### 获取下载链接
\`\`\`
使用工具: get_douyin_download_link
参数: share_link = "抖音分享链接内容"
\`\`\`

### 直接下载视频
\`\`\`
使用工具: download_douyin_video
参数: share_link = "抖音分享链接内容"
\`\`\`

## 文件输出
下载的视频文件将保存到工作目录（默认: .data/），文件名格式为：\`{videoId}.mp4\`

## Claude Desktop 配置示例
\`\`\`json
{
  "mcpServers": {
    "douyin-mcp-server": {
      "command": "npx",
      "args": ["-y", "@yc-w-cn/douyin-mcp-server@latest"],
      "env": {
        "WORK_DIR": "/path/to/your/data/directory"
      }
    }
  }
}
\`\`\`

## 注意事项
- 需要有效的抖音分享链接
- 支持大部分抖音视频格式
- 下载进度会在控制台实时显示
- 文件保存在工作目录中，可通过环境变量 WORK_DIR 自定义`,
          },
        },
      ],
    };
  }
);

// 启动服务器
logInfo("🚀 启动抖音 MCP Server...");

const transport = new StdioServerTransport();
await server.connect(transport);

logInfo("✅ 抖音 MCP Server 已启动，等待连接...");
