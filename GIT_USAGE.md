# Git 版本管理使用指南

## 当前状态
✅ Git 仓库已初始化
✅ .gitignore 已创建
✅ 首次提交已完成

## 常用 Git 命令

### 1. 查看状态
```bash
git status
```
查看哪些文件被修改、哪些文件待提交

### 2. 添加文件到暂存区
```bash
# 添加所有修改
git add .

# 添加指定文件
git add <文件名>

# 添加所有 .js 文件
git add *.js
```

### 3. 提交更改
```bash
git commit -m "提交说明：描述本次修改的内容"
```

**提交说明格式建议：**
- `feat: 新功能` - 例如：feat: 添加地图点击筛选功能
- `fix: 修复 bug` - 例如：fix: 修复时间切换后数据为 0 的问题
- `docs: 文档更新` - 例如：docs: 更新 README
- `refactor: 代码重构` - 例如：refactor: 优化数据处理逻辑
- `style: 代码格式` - 例如：style: 格式化代码
- `test: 测试` - 例如：test: 添加单元测试

### 4. 查看提交历史
```bash
# 简洁模式
git log --oneline

# 详细模式
git log

# 查看最近 5 条
git log -5
```

### 5. 撤销更改
```bash
# 撤销工作区的修改（未 add）
git checkout -- <文件名>

# 撤销暂存区的修改（已 add 未 commit）
git reset HEAD <文件名>

# 撤销上一次 commit
git reset --soft HEAD~1
```

### 6. 分支管理
```bash
# 查看分支
git branch

# 创建新分支
git branch <分支名>

# 切换分支
git checkout <分支名>

# 创建并切换到新分支
git checkout -b <分支名>

# 合并分支
git merge <分支名>
```

### 7. 推送远程仓库（如果有）
```bash
# 添加远程仓库
git remote add origin <远程仓库地址>

# 推送到远程
git push -u origin master

# 拉取远程代码
git pull
```

## 推荐工作流程

### 日常开发流程
1. **开始工作前**
   ```bash
   git pull  # 如果有远程仓库
   ```

2. **开发过程中**
   - 经常使用 `git status` 查看状态
   - 完成一个功能点后及时提交

3. **提交代码**
   ```bash
   git add .
   git commit -m "feat: 描述本次修改"
   ```

4. **推送到远程**（如果有）
   ```bash
   git push
   ```

### 示例：开发新功能
```bash
# 1. 创建功能分支
git checkout -b feature/map-filter

# 2. 开发功能...

# 3. 提交功能
git add .
git commit -m "feat: 实现地图区域筛选功能"

# 4. 切换回主分支
git checkout master

# 5. 合并功能分支
git merge feature/map-filter

# 6. 删除功能分支（可选）
git branch -d feature/map-filter

# 7. 推送到远程
git push
```

## 注意事项

1. **提交频率**
   - 完成一个完整功能点后提交
   - 不要等到所有工作做完才提交
   - 保持提交原子化（一个提交只做一件事）

2. **提交说明**
   - 使用清晰的提交说明
   - 说明要描述"为什么"而不是"是什么"
   - 遵循统一的格式

3. **备份**
   - 定期推送到远程仓库（GitHub/Gitee 等）
   - 重要修改前先提交

4. **协作**
   - 多人开发时使用分支
   - 合并前进行代码审查

## 配置信息

当前 Git 配置：
- 用户名：Dean
- 邮箱：dean@example.com

如需修改：
```bash
git config user.name "你的名字"
git config user.email "你的邮箱@example.com"
```

## 下一步建议

1. **创建远程仓库**
   - 在 GitHub 或 Gitee 创建仓库
   - 关联本地仓库

2. **设置分支策略**
   - 主分支：`master` 或 `main`
   - 开发分支：`develop`
   - 功能分支：`feature/xxx`

3. **自动化**
   - 配置 Git hooks
   - 设置 CI/CD 流程
