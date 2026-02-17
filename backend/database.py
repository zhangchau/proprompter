import logging
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    logger.warning("DATABASE_URL not found in environment variables, falling back to SQLite.")
    DATABASE_URL = "sqlite:///./test.db"

# NOTE: PostgreSQL 需要 keepalive 参数保持长连接稳定，SQLite 不支持这些参数
is_postgres = DATABASE_URL.startswith("postgresql")

engine_kwargs = {
    "pool_pre_ping": True,
    "pool_recycle": 300,
}

if is_postgres:
    engine_kwargs["connect_args"] = {
        "keepalives": 1,
        "keepalives_idle": 30,
        "keepalives_interval": 10,
        "keepalives_count": 5,
    }

engine = create_engine(DATABASE_URL, **engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """
    数据库会话生成器，用于 FastAPI 依赖注入
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()