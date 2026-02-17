import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from database import engine, Base

# NOTE: 必须显式导入 model，否则 Base.metadata 中不包含表定义
from model.script import Script  # noqa: F401
from api import script_api

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 尝试创建数据库表，连接失败时不阻塞启动
try:
    Base.metadata.create_all(bind=engine)
    logger.info("数据库表创建/验证成功")
except Exception as e:
    logger.error(f"数据库连接失败，表创建跳过: {e}")
    logger.warning("API 仍可启动，但数据库操作将在首次请求时重试连接")

app = FastAPI(
    title="ProPrompter API",
    description="智能提词器后端服务"
)

# CORS 跨域配置
# 开发环境：允许本地端口
# 生产环境：允许所有来源（部署后可改为具体 Vercel 域名）
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "*",  # 允许所有来源（生产环境部署后建议改为具体域名）
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境暂时允许所有来源
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(script_api.router)


@app.get("/")
def read_root():
    """健康检查接口"""
    return {"message": "Welcome to ProPrompter API"}
