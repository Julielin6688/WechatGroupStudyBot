/**
 * 调用 Claude API 生成学习进度播报
 */
export async function generateProgressReport(progressData) {
  const summary = progressData.map(m => {
    const lastCommit = m.lastCommitDate
      ? `${new Date(m.lastCommitDate).toLocaleDateString('zh-CN')}（${m.daysSinceLastCommit}天前）`
      : '从未提交'

    return [
      `成员：${m.name}`,
      `笔记数量：${m.fileCount} 篇`,
      `文件列表：${m.files.slice(-3).join(', ') || '无'}`,
      `最近提交：${lastCommit}`,
      `最新笔记摘要：${m.latestContent || '（无内容）'}`
    ].join('\n')
  }).join('\n\n---\n\n')

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
      system: `你是一个学习群的进度播报助手，风格活泼有趣但不失认真。
根据成员的 GitHub 提交数据，生成一份简洁的群消息播报。

要求：
- 点名表扬提交最积极的成员（笔记最多 or 最近有提交）
- 委婉催促超过5天没有提交的成员，用幽默的方式
- 简要提及大家在学什么（从文件名或笔记内容推断）
- 结尾附一句鼓励的话或学习金句
- 格式适合微信群消息，不用 Markdown 符号（# * 等）
- 总长度控制在200字以内，简洁有力`,
      messages: [{
        role: 'user',
        content: `请根据以下数据生成本期学习进度播报：\n\n${summary}`
      }]
    })
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Claude API 错误：${err}`)
  }

  const data = await response.json()
  return data.content[0].text
}

/**
 * 响应群内 @ 或关键词的 AI 闲聊/答疑
 */
export async function chatReply(userMessage) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      system: '你是学习群的助手小Bot，风格轻松活泼，善于鼓励同学。回复简短，控制在100字以内。',
      messages: [{ role: 'user', content: userMessage }]
    })
  })

  const data = await response.json()
  return data.content[0].text
}
