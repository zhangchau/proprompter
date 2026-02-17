from sqlalchemy.orm import Session
from repository.script_repository import ScriptRepository
from schema.script import ScriptCreate, ScriptUpdate

class ScriptService:
    """
    Script 业务逻辑层
    """
    
    @staticmethod
    def get_script(db: Session, script_id: int):
        return ScriptRepository.get_script(db, script_id)

    @staticmethod
    def get_scripts(db: Session, skip: int = 0, limit: int = 100):
        return ScriptRepository.get_scripts(db, skip, limit)

    @staticmethod
    def create_script(db: Session, script: ScriptCreate):
        return ScriptRepository.create_script(db, script)

    @staticmethod
    def update_script(db: Session, script_id: int, script: ScriptUpdate):
        return ScriptRepository.update_script(db, script_id, script)

    @staticmethod
    def delete_script(db: Session, script_id: int):
        return ScriptRepository.delete_script(db, script_id)
