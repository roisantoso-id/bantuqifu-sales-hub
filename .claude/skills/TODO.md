# TODO Skill Configuration

## 激活条件
- 只要项目根目录存在 TODO.md，必须以此文件为最高任务准则。

## 技能逻辑 (Automation Logic)
- **Step 1 (Check):** 每次操作前，先执行 `cat TODO.md` 确认下一个 `[ ]` 任务。
- **Step 2 (Plan):** 找到对应的 Function 文档，使用 `grep` 或 `ls` 定位代码。
- **Step 3 (Execute):** 编写代码实现功能。
- **Step 4 (Verify):** 必须运行 `npm run test` (或项目对应的测试命令)。
- **Step 5 (Update):** - 测试通过：将 `[ ]` 改为 `[x]`。
    - 测试失败：严禁修改状态，必须原地修复。

## 强制约束
- 禁止跳过测试环节。
- 修改状态必须是独立的原子操作。
- 完成一个任务后，自动寻找下一个 `[ ]` 任务，直到全部完成。
