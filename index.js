import 'dotenv/config'
import { Wechatferry } from 'wechatferry'
import { startScheduler } from './src/scheduler.js'
import { fetchAllMembersProgress } from './src/github.js'
import { generateProgressReport } from './src/ai.js'

const ROOM_NAME = process.env.WECHAT_ROOM_NAME || '学习群'
const client = new Wechatferry()

client.start()
console.log('🚀 学习群机器人启动中...')
console.log('✅ 已连接微信！')

async function sendToStudyRoom(text) {
  const contacts = client.getContacts()
  const room = contacts.find(c => c.name && c.name.includes(ROOM_NAME))
  if (!room) {
    console.error(`❌ 找不到群：${ROOM_NAME}`)
    console.log('所有群列表：', contacts.filter(c => c.wxid.endsWith('@chatroom')).map(c => c.name))
    return
  }
  client.sendTxt(text, room.wxid)
}

client.on('message', async (msg) => {
  if (!msg.roomid) return  // 只处理群消息
  const text = msg.content?.trim()
  if (!text) return

  if (text === '进度报告' || text === '查进度' || text === '播报') {
    sendToStudyRoom('📊 正在拉取 GitHub 数据，请稍等...')
    try {
      const progressData = await fetchAllMembersProgress()
      const report = await generateProgressReport(progressData)
      sendToStudyRoom(report)
    } catch (err) {
      sendToStudyRoom(`❌ 获取进度失败：${err.message}`)
    }
    return
  }

  if (text === '帮助' || text === 'help') {
    sendToStudyRoom(
      '📖 学习群机器人指令：\n' +
      '• 进度报告 — 立即生成学习进度播报\n' +
      '• 帮助 — 显示此帮助\n' +
      '📁 提交笔记：在 GitHub repo 的\n' +
      'members/你的名字/ 目录下上传 .md 文件'
    )
  }
})

startScheduler(sendToStudyRoom)
console.log(`📌 监听群：${ROOM_NAME}`)
console.log('机器人运行中，在群内发"进度报告"测试功能')