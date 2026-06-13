# Git 中文速查表

这份速查表面向当前项目，重点覆盖最常见的几类操作：

- 查看历史
- 查看当前修改
- 撤销未提交改动
- 回退到旧版本
- 撤销已经提交或已经推送的改动

## 1. 查看当前状态

```powershell
git status
```

作用：

- 查看哪些文件被修改了
- 查看哪些文件已经暂存
- 查看当前分支

---

## 2. 查看具体改动

```powershell
git diff
```

作用：

- 查看还没有 `git add` 的代码改动

如果想看已经暂存的改动：

```powershell
git diff --cached
```

---

## 3. 查看提交历史

```powershell
git log --oneline --decorate --graph -20
```

作用：

- 查看最近 20 条提交
- 找出想回退的提交 ID

---

## 4. 丢弃未提交的所有改动

```powershell
git restore .
```

作用：

- 把所有未提交修改恢复到最近一次提交的状态

注意：

- 这个命令会丢掉当前未提交内容

---

## 5. 只撤销某一个文件的修改

```powershell
git restore src\App.jsx
```

作用：

- 只恢复单个文件

---

## 6. 先暂时查看旧版本

```powershell
git checkout <commit-id>
```

作用：

- 临时进入某个旧提交，查看当时的文件状态

看完后回到当前主分支：

```powershell
git checkout main
```

---

## 7. 当前分支彻底回退到某个提交

```powershell
git reset --hard <commit-id>
```

作用：

- 当前分支、工作区、暂存区全部回到指定提交

注意：

- 这个命令会丢掉后续提交和当前未保存改动

---

## 8. 撤销最近一次提交，但保留文件修改

```powershell
git reset --soft HEAD~1
```

作用：

- 删除最近一次提交
- 但保留代码修改，方便重新提交

---

## 9. 撤销最近一次提交，并丢弃修改

```powershell
git reset --hard HEAD~1
```

作用：

- 删除最近一次提交
- 同时丢掉这次提交带来的所有代码改动

---

## 10. 安全撤销某个已经提交的改动

```powershell
git revert <commit-id>
```

作用：

- 生成一个新的“反向提交”
- 适合已经 push 到远端之后使用

优点：

- 不改写历史
- 对远端仓库更安全

---

## 11. 推送到 GitHub

```powershell
git push
```

如果第一次推某个新分支：

```powershell
git push -u origin main
```

---

## 12. 强制覆盖远端历史

```powershell
git push --force
```

作用：

- 用本地当前分支历史覆盖远端

注意：

- 这个命令风险较高
- 只有你明确知道自己在做什么时再用

---

## 13. 当前项目推荐工作流

### 小改动

```powershell
git status
git add .
git commit -m "your message"
git push
```

### 做大改之前

先提交一个稳定点：

```powershell
git add .
git commit -m "Checkpoint before route camera changes"
```

这样如果改坏了，就可以直接回退。

### 如果改坏了但还没提交

```powershell
git restore .
```

### 如果改坏了而且已经提交

先看历史：

```powershell
git log --oneline --decorate -10
```

然后二选一：

1. 安全撤销：

```powershell
git revert <commit-id>
```

2. 彻底回退：

```powershell
git reset --hard <commit-id>
```

---

## 14. 常见建议

- 不确定时，优先用 `git revert`
- 大改动前先做一次提交
- 少用 `git push --force`
- 回退前先跑一次 `git status`
- 找版本先看 `git log --oneline`

---

## 15. 这几个命令最常用

```powershell
git status
git diff
git log --oneline --decorate -20
git restore .
git revert <commit-id>
git add .
git commit -m "message"
git push
```
