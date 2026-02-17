# ProPrompter 部署指南

## 📦 部署架构

- **前端**: Vercel（免费）
- **后端**: Render（免费）
- **数据库**: Supabase（已配置）

---

## 🚀 部署步骤

### 1. 部署后端到 Render

#### 步骤：

1. **访问 Render**: https://render.com/
2. **注册/登录**账号
3. **点击 "New +" → "Web Service"**
4. **连接 GitHub 仓库**: 选择 `zhangchau/proprompter`
5. **配置服务**:
   - **Name**: `proprompter-api`
   - **Region**: Singapore（新加坡，最接近中国）
   - **Branch**: `main`
   - **Runtime**: `Python 3`
   - **Build Command**: `bash build.sh`
   - **Start Command**: `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: `Free`

6. **添加环境变量**:
   点击 "Advanced" → "Add Environment Variable"
   
   ```
   DATABASE_URL=postgresql://postgres.ipposvnkjpppwufwxftf:zc18868303307@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres
   ```

7. **点击 "Create Web Service"**
8. **等待部署完成**（约 3-5 分钟）
9. **复制后端 URL**（格式：`https://proprompter-api.onrender.com`）

---

### 2. 部署前端到 Vercel

#### 步骤：

1. **访问 Vercel**: https://vercel.com/
2. **注册/登录**账号（建议用 GitHub 登录）
3. **点击 "Add New..." → "Project"**
4. **导入 GitHub 仓库**: 选择 `zhangchau/proprompter`
5. **配置项目**:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `./`（保持默认）
   - **Build Command**: `npm run build`（自动检测）
   - **Output Directory**: `dist`（自动检测）

6. **添加环境变量**:
   点击 "Environment Variables"
   
   ```
   VITE_API_URL=https://proprompter-api.onrender.com
   ```
   
   ⚠️ **重要**: 将 `https://proprompter-api.onrender.com` 替换为您在步骤 1.9 复制的实际后端 URL

7. **点击 "Deploy"**
8. **等待部署完成**（约 1-2 分钟）
9. **访问您的应用**（格式：`https://proprompter-xxx.vercel.app`）

---

## 🔧 部署后配置

### 解决 CORS 问题

如果前端无法访问后端 API，需要在后端添加 CORS 配置：

编辑 `backend/main.py`，确保有以下配置：

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://proprompter-xxx.vercel.app"],  # 改为您的 Vercel 域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 🎯 验证部署

### 1. 测试后端 API
访问: `https://your-backend.onrender.com/docs`
应该能看到 FastAPI 自动生成的 API 文档

### 2. 测试前端应用
访问: `https://your-app.vercel.app`
打开浏览器开发者工具，检查是否有 API 请求错误

---

## 🔄 后续更新

每次修改代码后：

```bash
git add .
git commit -m "更新描述"
git push origin main
```

- **Vercel**: 自动部署（1-2 分钟）
- **Render**: 自动部署（3-5 分钟）

---

## 💰 免费额度

- **Vercel**: 
  - 无限制带宽
  - 100 GB 月流量
  - 自动 SSL 证书

- **Render**:
  - 750 小时/月（足够单个应用 24/7 运行）
  - 闲置 15 分钟后休眠（首次访问需要 30-60 秒唤醒）

- **Supabase**:
  - 500 MB 数据库存储
  - 无限制 API 请求

---

## 🐛 常见问题

### 1. Render 服务休眠
免费版闲置 15 分钟后会休眠，首次访问需要等待唤醒（30-60 秒）

**解决方案**: 升级到付费版（$7/月）或使用定时任务定期访问

### 2. CORS 错误
检查 `backend/main.py` 的 CORS 配置，确保 `allow_origins` 包含您的 Vercel 域名

### 3. 环境变量未生效
重新部署服务：Render Dashboard → Deploy → "Manual Deploy" → "Deploy latest commit"

---

## 📞 需要帮助？

如有问题，请检查：
1. Render 部署日志
2. Vercel 部署日志
3. 浏览器开发者工具 Console

---

祝部署顺利！🎉
