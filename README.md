# Google AI Studio (Google Drive)聊天记录转换工具

一个用于将 Google Drive 里 Google AI Studio 目录的聊天记录转换为 Markdown 格式的 Node.js 脚本。

## 功能特性

- 🚀 批量转换：一次处理整个目录中的所有聊天记录文件
- 📝 Markdown 格式：生成易读的 Markdown 文件，保留完整的对话结构
- 🎭 角色标识：为不同角色添加表情符号标识（用户、AI 模型、思考过程）
- 📊 统计信息：显示处理的文件数量和消息条数
- 🎯 智能过滤：自动识别并跳过非聊天记录文件
- 🔢 用户消息编号：为用户消息添加序号，便于追踪对话流程

## 安装要求

- Node.js (建议 v12 或更高版本)
- 无需额外依赖包，仅使用 Node.js 内置模块

## 使用方法

### 1. 准备文件结构

```
google-aistudio-chat-to-md /
├── main.js              # 主脚本文件
├── Google AI Studio/    #  从 Google Drive 下载，需要转换的原始聊天记录的目录
│   ├── chat1
│   ├── chat2
│   └── ...
└── Google AI Studio MD/ # 生成的 Markdown 文件输出目录（自动创建）
    ├── chat1.md
    ├── chat2.md
    └── ...
```

### 2. 运行脚本

```bash
node main.js
```

### 3. 查看结果

脚本运行后，会在 `Google AI Studio MD` 目录中生成对应的 Markdown 文件。

## 配置选项

脚本顶部的配置区可以根据需要修改：

```javascript
const INPUT_DIR = './Google AI Studio';  // 输入目录
const OUTPUT_DIR = './Google AI Studio MD'; // 输出目录

// 角色映射配置
const ROLE_MAP = {
    'user': '👱🏻‍♂️ User',
    'model': '🤖 AI Model',
    'think': '💭 Thinking',
};
```

## 支持的文件格式

- 无扩展名的 JSON 文件
- JSON 格式的聊天记录文件
- 自动过滤无关文件（隐藏文件、.mp3、.mp4、.txt、.png等）

## 输出格式示例

生成的 Markdown 文件格式如下：

```markdown
# Chat History Export - chat1

> 生成时间：2024-01-01 12:00:00
> 原始文件：chat1.json

---

# 👱🏻‍♂️ User[1]

你好，请帮我解释一下这个概念。

---

# 🤖 AI Model

当然！我很乐意为您解释这个概念...

---

# 💭 Thinking

用户想了解这个概念，我需要从基础开始解释...

---

```

## 错误处理

脚本包含完善的错误处理机制：

- 自动跳过无效的 JSON 文件
- 处理文件读写权限错误
- 提供清晰的错误提示信息

## 注意事项

1. 确保输入目录存在且包含有效的聊天记录文件
2. 输出目录会自动创建，如果不存在的话
3. 脚本会覆盖输出目录中同名的文件
4. 建议在处理重要数据前先备份

## 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件。

## 贡献

欢迎提交 Issue 和 Pull Request！


## Star History

如果这个项目对你有帮助，请给个 ⭐️！

---

**免责声明**：本工具仅用于个人学习和研究目的。请遵守相关服务条款，合理使用导出的数据。
