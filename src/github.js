import { Octokit } from '@octokit/rest'

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN })

const OWNER = process.env.GITHUB_OWNER
const REPO = process.env.GITHUB_REPO

/**
 * 拉取所有成员的学习进度
 * 预期 Repo 结构：
 *   members/
 *     张三/week1-xxx.md
 *     李四/week1-xxx.md
 */
export async function fetchAllMembersProgress() {
  let members

  try {
    const { data } = await octokit.repos.getContent({
      owner: OWNER,
      repo: REPO,
      path: 'members'
    })
    members = data
  } catch (err) {
    throw new Error(`无法读取 members/ 目录：${err.message}`)
  }

  const progressData = []

  for (const member of members) {
    if (member.type !== 'dir') continue

    // 获取该成员的所有文件
    let files = []
    try {
      const { data } = await octokit.repos.getContent({
        owner: OWNER,
        repo: REPO,
        path: member.path
      })
      files = data
    } catch {
      // 目录为空或权限问题，跳过
      continue
    }

    const mdFiles = files.filter(f => f.name.endsWith('.md'))

    // 获取最近一次提交时间
    let lastCommitDate = null
    try {
      const { data: commits } = await octokit.repos.listCommits({
        owner: OWNER,
        repo: REPO,
        path: member.path,
        per_page: 1
      })
      lastCommitDate = commits[0]?.commit.committer.date ?? null
    } catch { /* 忽略 */ }

    // 读取最新笔记内容（供 AI 分析）
    let latestContent = ''
    if (mdFiles.length > 0) {
      const latestFile = mdFiles[mdFiles.length - 1]
      try {
        const { data: fileData } = await octokit.repos.getContent({
          owner: OWNER,
          repo: REPO,
          path: latestFile.path
        })
        const raw = Buffer.from(fileData.content, 'base64').toString('utf-8')
        latestContent = raw.slice(0, 500) // 只取前500字，节省token
      } catch { /* 忽略 */ }
    }

    progressData.push({
      name: member.name,
      fileCount: mdFiles.length,
      files: mdFiles.map(f => f.name),
      lastCommitDate,
      latestContent,
      daysSinceLastCommit: lastCommitDate
        ? Math.floor((Date.now() - new Date(lastCommitDate)) / 86400000)
        : null
    })
  }

  return progressData
}
