# GitHub 推送指南

## 方式一：手动输入（推荐）

在终端执行：
```bash
git push -u origin main
```

当提示输入时：
- **Username**: `pretender-vcode`
- **Password**: 粘贴你的 Personal Access Token（不是 GitHub 密码）

---

## 方式二：使用 Token 配置远程 URL（一次性）

如果你已经创建了 Personal Access Token，可以临时配置到远程 URL：

```bash
# 替换 YOUR_TOKEN 为你的实际 token
git remote set-url origin https://YOUR_TOKEN@github.com/pretender-vcode/simple-cms-demo.git

# 推送
git push -u origin main

# 推送完成后，恢复为普通 URL（安全起见）
git remote set-url origin https://github.com/pretender-vcode/simple-cms-demo.git
```

---

## 如何创建 Personal Access Token

1. 访问：https://github.com/settings/tokens
2. 点击 "Generate new token" → "Generate new token (classic)"
3. 设置：
   - Note: `simple-cms-demo-push`
   - Expiration: 选择有效期
   - Scopes: 勾选 `repo`（完整仓库权限）
4. 点击 "Generate token"
5. **立即复制 token**（只显示一次）

---

## 配置 Credential Helper（可选，避免每次输入）

```bash
# 配置 macOS keychain 记住凭证
git config --global credential.helper osxkeychain
```

之后第一次推送时输入 token，系统会自动保存，以后就不需要再输入了。

