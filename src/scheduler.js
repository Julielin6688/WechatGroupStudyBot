import schedule from 'node-schedule'
import { fetchAllMembersProgress } from './github.js'
import { generateProgressReport } from './ai.js'

/**
 * 启动定时播报任务
 * @param {Function} sendToRoom - 发送消息到群的函数，接受字符串参数
 */
export function startScheduler(sendToRoom) {
  const intervalDays = parseInt(process.env.REPORT_INTERVAL_DAYS || '3')
  const hour = parseInt(process.env.REPORT_HOUR || '10')

  // 每 N 天触发一次
  // interval=3：每月 1, 4, 7, 10, 13... 日触发
  // interval=5：每月 1, 6, 11, 16... 日触发
  const rule = new schedule.RecurrenceRule()
  rule.hour = parseInt(process.env.REPORT_HOUR || '10')
  rule.minute = 0
  rule.second = 0

  // 用 dayOfMonth 模拟间隔天数
  const days = []
  for (let d = 1; d <= 31; d += intervalDays) {
    days.push(d)
  }
  rule.dayOfMonth = days

  console.log(`⏰ 定时播报已启动：每${intervalDays}天的 ${hour}:00 触发`)
  console.log(`   触发日期（每月）：${days.join(', ')} 号`)

  schedule.scheduleJob(rule, async () => {
    console.log(`\n📊 [${new Date().toLocaleString('zh-CN')}] 开始收集 GitHub 学习进度...`)

    try {
      await sendToRoom('📊 正在拉取 GitHub 学习数据，稍等一下～')

      const progressData = await fetchAllMembersProgress()

      if (progressData.length === 0) {
        await sendToRoom('😅 还没有人在 GitHub 提交笔记，快去建文件夹！')
        return
      }

      const report = await generateProgressReport(progressData)
      await sendToRoom(report)

      console.log('✅ 播报发送成功')
    } catch (err) {
      console.error('❌ 播报失败：', err.message)
      await sendToRoom(`⚠️ 播报生成失败：${err.message}`)
    }
  })
}
