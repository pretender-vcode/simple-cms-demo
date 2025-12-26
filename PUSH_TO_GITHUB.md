# 推送到 GitHub 的步骤

## 1. 在 GitHub 上创建新仓库
- 访问 https://github.com/new
- 填写仓库名称（例如：react-dnd-demo）
- 选择 Public 或 Private
- 不要初始化 README（我们已经有了）
- 点击 "Create repository"

## 2. 添加远程仓库并推送

将下面的命令中的 `YOUR_USERNAME` 和 `YOUR_REPO_NAME` 替换为你的实际值：

```bash
# 添加远程仓库
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# 或者使用 SSH（如果你配置了 SSH key）
# git remote add origin git@github.com:YOUR_USERNAME/YOUR_REPO_NAME.git

# 推送代码到 GitHub
git branch -M main
git push -u origin main
```

## 3. 验证

推送成功后，访问你的 GitHub 仓库页面，应该能看到所有代码文件。

