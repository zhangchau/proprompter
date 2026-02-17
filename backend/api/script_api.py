from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from schema.script import ScriptCreate, ScriptUpdate, ScriptResponse
from service.script_service import ScriptService

router = APIRouter(
    prefix="/scripts",
    tags=["scripts"]
)

@router.post("/", response_model=ScriptResponse)
def create_script(script: ScriptCreate, db: Session = Depends(get_db)):
    """
    创建新脚本
    """
    return ScriptService.create_script(db, script)

@router.get("/", response_model=List[ScriptResponse])
def read_scripts(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    获取脚本列表
    """
    return ScriptService.get_scripts(db, skip, limit)

@router.get("/{script_id}", response_model=ScriptResponse)
def read_script(script_id: int, db: Session = Depends(get_db)):
    """
    获取特定脚本
    """
    db_script = ScriptService.get_script(db, script_id)
    if db_script is None:
        raise HTTPException(status_code=404, detail="Script not found")
    return db_script

@router.put("/{script_id}", response_model=ScriptResponse)
def update_script(script_id: int, script: ScriptUpdate, db: Session = Depends(get_db)):
    """
    更新脚本
    """
    db_script = ScriptService.update_script(db, script_id, script)
    if db_script is None:
        raise HTTPException(status_code=404, detail="Script not found")
    return db_script

@router.delete("/{script_id}")
def delete_script(script_id: int, db: Session = Depends(get_db)):
    """
    删除脚本
    """
    success = ScriptService.delete_script(db, script_id)
    if not success:
        raise HTTPException(status_code=404, detail="Script not found")
    return {"ok": True}
