from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ScriptBase(BaseModel):
    """脚本基础 schema"""
    title: Optional[str] = "Untitled"
    content: str
    speed: Optional[int] = 200
    font_size: Optional[str] = "medium"
    mirror_mode: Optional[bool] = False
    show_focus_line: Optional[bool] = True


class ScriptCreate(ScriptBase):
    """创建脚本的请求 schema"""
    pass


class ScriptUpdate(BaseModel):
    """
    更新脚本的请求 schema
    NOTE: 所有字段均为可选，支持部分更新（PATCH 语义）
    """
    title: Optional[str] = None
    content: Optional[str] = None
    speed: Optional[int] = None
    font_size: Optional[str] = None
    mirror_mode: Optional[bool] = None
    show_focus_line: Optional[bool] = None


class ScriptResponse(ScriptBase):
    """脚本响应 schema"""
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
