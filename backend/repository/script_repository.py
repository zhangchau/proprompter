from sqlalchemy.orm import Session
from model.script import Script
from schema.script import ScriptCreate, ScriptUpdate


class ScriptRepository:
    """
    Script 数据库访问层
    """

    @staticmethod
    def get_script(db: Session, script_id: int):
        """根据 ID 查询单个脚本"""
        return db.query(Script).filter(Script.id == script_id).first()

    @staticmethod
    def get_scripts(db: Session, skip: int = 0, limit: int = 100):
        """分页查询脚本列表"""
        return db.query(Script).offset(skip).limit(limit).all()

    @staticmethod
    def create_script(db: Session, script: ScriptCreate):
        """创建新脚本"""
        db_script = Script(**script.model_dump())
        db.add(db_script)
        db.commit()
        db.refresh(db_script)
        return db_script

    @staticmethod
    def update_script(db: Session, script_id: int, script: ScriptUpdate):
        """部分更新脚本，仅更新传入的字段"""
        db_script = db.query(Script).filter(Script.id == script_id).first()
        if db_script:
            for key, value in script.model_dump(exclude_unset=True).items():
                setattr(db_script, key, value)
            db.commit()
            db.refresh(db_script)
        return db_script

    @staticmethod
    def delete_script(db: Session, script_id: int):
        """根据 ID 删除脚本"""
        db_script = db.query(Script).filter(Script.id == script_id).first()
        if db_script:
            db.delete(db_script)
            db.commit()
            return True
        return False
