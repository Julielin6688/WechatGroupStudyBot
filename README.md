# 学习群机器人 📚

微信群学习进度追踪机器人：定期拉取 GitHub 笔记，用 AI 生成播报。

---

## 项目结构

```
study-bot/
├── index.js          # 主入口，Wechaty 机器人
├── src/
│   ├── github.js     # GitHub API：拉取成员进度
│   ├── ai.js         # Claude API：生成播报 & 闲聊
│   └── scheduler.js  # 定时任务
├── .env              # 环境变量（不要提交到 Git！）
├── .env.example      # 环境变量模板
└── package.json
```

---

## GitHub Repo 结构约定

让群友在学习 Repo 里按以下结构提交笔记：

```
members/
├── 张三/
│   ├── week1-react-hooks.md
│   └── week2-useEffect.md
├── 李四/
│   └── week1-intro.md
```

每人管理自己的文件夹，文件名自取，后缀必须是 `.md`。

---

## 本地运行（测试用）

```bash
git clone https://github.com/你的用户名/study-bot.git
cd study-bot

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env，填入你的 token

# 启动
npm start
# 扫码登录微信备用号
```

---

## EC2 部署步骤

### 1. 创建 EC2 实例

AWS Console → EC2 → Launch Instance：
- AMI：**Ubuntu 22.04 LTS**
- 实例类型：**t2.micro**（Free Tier）
- 存储：8GB（默认即可）
- 安全组：开放 SSH（端口22），来源选 My IP

下载 `.pem` 密钥文件，保存好。

---

### 2. SSH 连接服务器

```bash
# 修改密钥权限
chmod 400 你的密钥.pem

# 连接
ssh -i 你的密钥.pem ubuntu@你的EC2公网IP
```

---

### 3. 服务器环境配置

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 安装 pm2（进程管理，自动重启）
sudo npm install -g pm2

# 验证安装
node -v   # 应显示 v20.x
npm -v
```

---

### 4. 上传代码

**方法 A：从 GitHub 拉取（推荐）**
```bash
git clone https://github.com/你的用户名/study-bot.git
cd study-bot
npm install
```

**方法 B：直接上传文件**
```bash
# 在本地电脑执行
scp -i 你的密钥.pem -r ./study-bot ubuntu@你的IP:~/
```

---

### 5. 配置环境变量

```bash
cd study-bot
cp .env.example .env
nano .env   # 填入所有 token
```

> ⚠️ 确认 .env 在 .gitignore 里，不要提交到 GitHub！

---

### 6. 首次启动 & 扫码

```bash
# 直接运行，在终端扫码
node index.js
```

终端会显示一个链接，浏览器打开后会看到二维码，用**备用微信号**扫码。

登录成功后显示 `✅ 登录成功` 即可按 Ctrl+C 停止。

---

### 7. 用 pm2 守护进程（正式运行）

```bash
# 启动
pm2 start index.js --name study-bot

# 设置开机自启
pm2 startup
pm2 save

# 常用命令
pm2 status          # 查看运行状态
pm2 logs study-bot  # 查看日志
pm2 restart study-bot  # 重启
pm2 stop study-bot     # 停止
```

---

### 8. 掉线处理

微信偶尔会掉线，需要重新扫码：

```bash
# 停止 pm2
pm2 stop study-bot

# 删除旧 session
rm -rf study-bot.memory-card.json

# 重新扫码
node index.js
# 扫码成功后 Ctrl+C

# 重新用 pm2 启动
pm2 restart study-bot
```

---

## 群内指令

| 发送内容 | 效果 |
|---------|------|
| `进度报告` | 立即生成并发送学习进度播报 |
| `帮助` | 显示指令列表 |
| `@机器人 + 问题` | AI 答疑互动 |

---

## 环境变量说明

| 变量 | 说明 |
|------|------|
| `GITHUB_TOKEN` | GitHub → Settings → Developer Settings → Personal Access Token（需要 repo 读取权限） |
| `GITHUB_OWNER` | 你的 GitHub 用户名或组织名 |
| `GITHUB_REPO` | 学习笔记 Repo 名称 |
| `ANTHROPIC_API_KEY` | Anthropic 控制台获取 |
| `WECHAT_ROOM_NAME` | 微信群名（包含该字符串即匹配） |
| `REPORT_INTERVAL_DAYS` | 播报间隔天数，3 或 5 |
| `REPORT_HOUR` | 每天几点播报，24小时制 |
