import { apiClient } from './client';
import { TeleprompterSettings } from '../../types';

export interface ScriptData extends TeleprompterSettings {
    id?: number;
    title?: string;
}

export const scriptApi = {
    // 获取所有脚本
    getAll: async () => {
        const response = await apiClient.get<ScriptData[]>('/scripts/');
        return response.data;
    },

    // 获取单个脚本
    getById: async (id: number) => {
        const response = await apiClient.get<ScriptData>(`/scripts/${id}`);
        return response.data;
    },

    // 创建新脚本
    create: async (data: Omit<ScriptData, 'id'>) => {
        // 映射前端 settings 到后端 schema
        const payload = {
            title: data.title || 'Untitled',
            content: data.script,
            speed: data.speed,
            font_size: data.fontSize,
            mirror_mode: data.mirrorMode,
            show_focus_line: data.showFocusLine
        };
        const response = await apiClient.post<ScriptData>('/scripts/', payload);
        return response.data;
    },

    // 更新脚本
    update: async (id: number, data: Partial<ScriptData>) => {
        // 映射前端 settings 到后端 schema
        const payload: any = {};
        if (data.script !== undefined) payload.content = data.script;
        if (data.speed !== undefined) payload.speed = data.speed;
        if (data.fontSize !== undefined) payload.font_size = data.fontSize;
        if (data.mirrorMode !== undefined) payload.mirror_mode = data.mirrorMode;
        if (data.showFocusLine !== undefined) payload.show_focus_line = data.showFocusLine;
        if (data.title !== undefined) payload.title = data.title;

        const response = await apiClient.put<ScriptData>(`/scripts/${id}`, payload);
        return response.data;
    },

    // 删除脚本
    delete: async (id: number) => {
        await apiClient.delete(`/scripts/${id}`);
    }
};
