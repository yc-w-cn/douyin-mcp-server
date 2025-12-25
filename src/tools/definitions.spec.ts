import { describe, it, expect } from 'vitest';
import { toolDefinitions } from './definitions';

describe('工具定义 (Tool Definitions)', () => {
  it('应包含必要的工具列表', () => {
    expect(toolDefinitions).toHaveProperty('tools');
    expect(Array.isArray(toolDefinitions.tools)).toBe(true);
    expect(toolDefinitions.tools.length).toBeGreaterThan(0);
  });

  it('每个工具定义应符合规范', () => {
    const requiredProperties = ['name', 'description', 'inputSchema'];
    
    toolDefinitions.tools.forEach(tool => {
      requiredProperties.forEach(prop => {
        expect(tool).toHaveProperty(prop);
      });
      
      expect(typeof tool.name).toBe('string');
      expect(typeof tool.description).toBe('string');
      expect(tool.inputSchema).toHaveProperty('type', 'object');
    });
  });

  it('应包含预期的工具名称', () => {
    const toolNames = toolDefinitions.tools.map(t => t.name);
    expect(toolNames).toContain('get_douyin_download_link');
    expect(toolNames).toContain('download_douyin_video');
    expect(toolNames).toContain('parse_douyin_video_info');
  });
});
