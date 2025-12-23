# @fxzer/gemini-tomd

将 Google AI Studio 聊天记录转换为 Markdown 格式的命令行工具。

## 功能特性

- 🚀 批量转换：一次处理整个目录中的所有聊天记录文件
- 📝 Markdown 格式：生成易读的 Markdown 文件，保留完整的对话结构
- 🎭 角色标识：为不同角色添加表情符号标识（用户、AI 模型、思考过程）
- 📊 统计信息：显示处理的文件数量和消息条数
- 🎯 智能过滤：自动识别并跳过非聊天记录文件
- 🔢 用户消息编号：为用户消息添加序号，便于追踪对话流程
- 🌍 全局命令：安装后可在任意位置使用 `gemini-tomd` 命令

## 安装

### 全局安装

```bash
npm install -g @fxzer/gemini-tomd
```

### 本地安装

```bash
npm install @fxzer/gemini-tomd
```

## 使用方法

### 命令行用法

```bash
gemini-tomd <输入路径> [输出路径]
```

#### 参数说明

- `<输入路径>`: 输入文件或目录的路径（必填）
- `[输出路径]`: 输出文件或目录的路径（可选）
  - 目录输入：默认为 `./Google AI Studio MD`
  - 文件输入：默认为 `原文件名.md`

#### 示例

```bash
# 转换目录（使用默认输出目录）
gemini-tomd "./Google AI Studio"

# 转换单个文件（无后缀，使用默认输出文件名）
gemini-tomd "Bookmark Organization And Suggestions"
# 输出: Bookmark Organization And Suggestions.md

# 转换单个文件（带 .json 后缀，使用默认输出文件名）
gemini-tomd "chat.json"
# 输出: chat.json.md

# 转换单个文件（指定输出文件名）
gemini-tomd "chat.json" "output.md"

# 转换目录（指定输出目录）
gemini-tomd "./Google AI Studio" "./output"

# 使用绝对路径
gemini-tomd "/path/to/input" "/path/to/output"
```

### 查看帮助

```bash
gemini-tomd --help
```

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

## 支持的文件格式

- 无扩展名的 JSON 文件
- `.json` 格式的聊天记录文件
- 自动过滤无关文件（隐藏文件、.mp3、.mp4、.txt、.png等）

## 作为模块使用

你也可以在代码中直接使用：

```javascript
const { convert } = require('@fxzer/gemini-tomd');

// 转换目录
convert('./input', './output');

// 转换单个文件
convert('./chat.json', './chat.md');
```

## 配置选项

当前版本使用默认配置。如需自定义角色映射，可以修改源码中的 `ROLE_MAP`：

```javascript
const ROLE_MAP = {
    'user': '👱🏻‍♂️ User',
    'model': '🤖 AI Model',
    'think': '💭 Thinking',
};
```

## 错误处理

工具包含完善的错误处理机制：

- 自动跳过无效的 JSON 文件
- 处理文件读写权限错误
- 提供清晰的错误提示信息

## 开发

### 克隆项目

```bash
git clone https://github.com/fxzer/google-aistudio-chat-to-md.git
cd google-aistudio-chat-to-md
```

### 本地测试

```bash
# 链接到全局
npm link

# 运行测试
gemini-tomd ./test/input ./test/output
```

### 取消链接

```bash
npm unlink -g @fxzer/gemini-tomd
```

## 注意事项

1. 确保输入路径存在且包含有效的聊天记录文件
2. 输出目录会自动创建，如果不存在的话
3. 工具会覆盖输出目录中同名的文件
4. 建议在处理重要数据前先备份




## 测试总结

  完成了 20+ 项测试，工具在各种边缘情况下都运行稳定！

  测试通过的边缘情况

  | 测试场景          | 结果                           |
  |-------------------|--------------------------------|
  | 目录批量转换      | 18个文件中正确识别13个聊天记录 |
  | 单文件无后缀      | 输出到 原文件名.md             |
  | 单文件带.json后缀 | 输出到 文件名.json.md          |
  | 路径不存在        | 正确报错                       |
  | 特殊字符文件名    | ✅ 正常处理                    |
  | 带空格文件名      | ✅ 正常处理                    |
  | 非聊天JSON文件    | ✅ 正确跳过                    |
  | 空文件            | ✅ 正确跳过                    |
  | 损坏的JSON        | ✅ 正确跳过                    |
  | 隐藏文件          | ✅ 被过滤                      |
  | 长消息(10000字符) | ✅ 正常处理                    |
  | 大文件(200条消息) | ✅ 正常处理                    |
  | 只有model消息     | ✅ 正常处理                    |
  | 思考过程          | ✅ 正确标识为 💭               |
  | 多轮对话          | ✅ 用户消息正确编号            |
  | HTML内容          | ✅ 原样保留                    |
  | 嵌套目录          | ✅ 正常处理                    |
  | 相对/绝对路径     | ✅ 都正常工作                  |

  测试文件保留

  测试目录已保留，你可以随时查看：
  - test-input/ - 21个测试文件
  - test-output/ - 13个转换结果

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

## 作者

fxzer

---

**免责声明**：本工具仅用于个人学习和研究目的。请遵守相关服务条款，合理使用导出的数据。
