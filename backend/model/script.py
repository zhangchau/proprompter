from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime
from sqlalchemy.sql import func
from database import Base

class Script(Base):
    """
    提词器脚本模型
    """
    __tablename__ = "scripts"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, default="Untitled")
    content = Column(Text, nullable=False)
    speed = Column(Integer, default=200)
    font_size = Column(String, default="medium")
    mirror_mode = Column(Boolean, default=False)
    show_focus_line = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<Script(id={self.id}, title='{self.title}')>"
