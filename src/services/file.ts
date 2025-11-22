
import * as fs from "fs";
import * as path from "path";
import { WORK_DIR } from "../config";

// 清空工作区所有文件
export function clearWorkdir(): { removed: string[], message: string } {
  const files = fs.readdirSync(WORK_DIR).map(f => path.join(WORK_DIR, f));
  const removed: string[] = [];
  for (const file of files) {
    try {
      if (fs.lstatSync(file).isFile()) {
        fs.unlinkSync(file);
        removed.push(path.basename(file));
      }
    } catch (err) {
      // ignore
    }
  }
  return {
    removed,
    message: `工作区清理完成，删除文件: ${removed.join(', ')}`
  };
}