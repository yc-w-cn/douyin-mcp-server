import * as fs from "fs";
import { logInfo, logError } from "../utils/logger";

// 工作目录设置 - 默认使用项目根目录下的 .data 文件夹
export const WORK_DIR: string = process.env.WORK_DIR || '.data';

// 验证环境变量配置
export function validateEnvironment(): void {
  // 不再需要强制验证，因为已经有默认值
  logInfo(`📁 工作目录: ${WORK_DIR}`);
}

// 初始化工作目录
export function initializeWorkDir(): void {
  try {
    if (!fs.existsSync(WORK_DIR)) {
      fs.mkdirSync(WORK_DIR, { recursive: true });
      logInfo(`✅ 工作目录已创建: ${WORK_DIR}`);
    } else {
      logInfo(`✅ 使用工作目录: ${WORK_DIR}`);
    }
  } catch (error) {
    logError(`❌ 无法创建或访问工作目录 ${WORK_DIR}:`, error);
    logError("请检查路径是否正确且有写入权限");
    process.exit(1);
  }
}