const fs = require('fs');
const path = require('path');

// 角色映射配置
const ROLE_MAP = {
    'user': '👱🏻‍♂️ User',
    'model': '🤖 AI Model',
    'think': '💭 Thinking',
};

// 有效角色常量（避免每次创建新数组）
const VALID_ROLES = ['user', 'model'];

// 确保目录存在
const ensureDirectoryExists = (dirPath) => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`📁 创建输出目录: ${dirPath}`);
    }
};

// 检查是否为有效文件类型
const isValidFileType = (filename) => {
    if (filename.startsWith('.')) {
        return false;
    }
    const ext = path.extname(filename).toLowerCase();
    return ext === '.json' || ext === '';
};

// 获取文件列表并过滤
const getValidFiles = (inputDir) => {
    const files = fs.readdirSync(inputDir);
    return files.filter(file => {
        const filePath = path.join(inputDir, file);
        const isFile = fs.statSync(filePath).isFile();
        return isFile && isValidFileType(file);
    });
};

// 验证并解析聊天记录JSON（返回解析后的数据，避免重复解析）
const parseChatJson = (content) => {
    try {
        const data = JSON.parse(content);
        if (!data.chunkedPrompt || !data.chunkedPrompt.chunks) {
            return null;
        }
        const hasValidChunk = data.chunkedPrompt.chunks.some(chunk =>
            chunk.text && chunk.role && VALID_ROLES.includes(chunk.role)
        );
        return hasValidChunk ? data : null;
    } catch (error) {
        return null;
    }
};

// 获取角色显示名称
const getRoleDisplay = (roleKey) => {
    return ROLE_MAP[roleKey] || roleKey;
};

// 生成用户消息摘要
const getUserMessageSummary = (content, fallbackTitle) => {
    if (!content || content.trim().length === 0) {
        return fallbackTitle;
    }

    // 移除多余空白，按行分割
    const lines = content.trim().split(/\n+/).map(line => line.trim()).filter(Boolean);

    if (lines.length === 0) {
        return fallbackTitle;
    }

    // 取第一行作为摘要，如果超过 50 个字符则截断
    let summary = lines[0];
    if (summary.length > 50) {
        summary = summary.substring(0, 47) + '...';
    }

    return summary;
};

// 生成单个消息的Markdown内容
const generateMessageMarkdown = (msg, userMessageCount, includeThink, fallbackTitle) => {
    // 跳过 think 消息（除非明确要求包含）
    if (msg.isThought && !includeThink) {
        return '';
    }

    const roleKey = msg.isThought ? 'think' : msg.role;
    const content = msg.text;
    const roleDisplay = getRoleDisplay(roleKey);

    if (!content) return '';

    const userIndex = roleKey === 'user' ? `[${userMessageCount}]` : '';

    // 用户消息添加摘要
    let titleSuffix = '';
    if (roleKey === 'user') {
        const summary = getUserMessageSummary(content, fallbackTitle);
        titleSuffix = `: ${summary}`;
    }

    return `# ${roleDisplay}${userIndex}${titleSuffix}\n\n${content}\n\n---\n\n`;
};

// 生成完整的Markdown内容
const generateMarkdownContent = (chunks, baseName, filename, includeThink = false) => {
    const header = `# Chat History Export - ${baseName}\n\n` +
        `> 生成时间：${new Date().toLocaleString()}\n` +
        `> 原始文件：${filename}\n\n` +
        `---\n\n`;

    const parts = [header];
    let userMessageCount = 0;

    for (const msg of chunks) {
        if (msg.role === 'user' && !msg.isThought) {
            userMessageCount++;
        }
        const msgMd = generateMessageMarkdown(msg, userMessageCount, includeThink, baseName);
        if (msgMd) {
            parts.push(msgMd);
        }
    }

    return parts.join('\n');
};

// 处理单个文件
const processFile = ({ inputDir, outputDir, filename, fileIndex, totalFiles, includeThink = false, cachedData = null }) => {
    try {
        // 使用缓存的数据（如果提供），否则读取文件
        let jsonData;
        if (cachedData) {
            jsonData = cachedData;
        } else {
            const inputFilePath = path.join(inputDir, filename);
            const rawData = fs.readFileSync(inputFilePath, 'utf-8');
            jsonData = parseChatJson(rawData);
            if (!jsonData) {
                console.warn(`⚠️  跳过非聊天记录文件: ${filename}`);
                return;
            }
        }

        const chunks = jsonData.chunkedPrompt.chunks;
        const parsedPath = path.parse(filename);
        const baseName = parsedPath.name;
        const ext = parsedPath.ext;
        const outputFilename = ext ? `${filename}.md` : `${baseName}.md`;
        const outputFilePath = path.join(outputDir, outputFilename);

        const mdContent = generateMarkdownContent(chunks, baseName, filename, includeThink);
        fs.writeFileSync(outputFilePath, mdContent, 'utf-8');

        // 进度样式输出
        const progress = `[${fileIndex + 1}/${totalFiles}]`;
        const msgCount = chunks.filter(c => !c.isThought).length;
        console.log(`${progress} ✅ ${baseName}${ext} → ${outputFilename} (${msgCount}条消息)`);

    } catch (fileError) {
        console.error(`❌ ${filename}: ${fileError.message}`);
    }
};

// 处理特定错误的辅助函数
const handleSpecificErrors = (error, inputDir) => {
    if (error.message.includes('ENOENT')) {
        console.error(`提示: 找不到目录 ${inputDir}，请确保该目录存在。`);
    }
    if (error.message.includes('Unexpected token')) {
        console.error('提示: 某个文件可能不是标准的 JSON 格式。');
    }
    if (error.message.includes('EACCES')) {
        console.error('提示: 没有足够的权限访问文件或目录。');
    }
};

// 主处理函数
const convert = (inputPath, outputPath, includeThink = false) => {
    try {
        const inputResolved = path.resolve(inputPath);
        const stat = fs.statSync(inputResolved);

        // 如果没有提供输出路径，根据输入类型设置默认值
        if (!outputPath) {
            if (stat.isFile()) {
                // 单文件：使用原文件名.md
                outputPath = inputResolved + '.md';
            } else {
                // 目录：使用默认输出目录
                outputPath = './Google AI Studio MD';
            }
        }

        const outputResolved = path.resolve(outputPath);
        const outputStat = fs.existsSync(outputResolved) ? fs.statSync(outputResolved) : null;
        const isOutputFile = outputResolved.endsWith('.md') || (outputStat && outputStat.isFile());

        if (stat.isFile()) {
            // 处理单个文件
            console.log(`\n📄 处理单个文件: ${inputPath}`);

            if (isOutputFile) {
                // 输出是文件：确保父目录存在，直接处理到目标文件
                const outputParentDir = path.dirname(outputResolved);
                ensureDirectoryExists(outputParentDir);

                const filename = path.basename(inputPath);

                // 读取并解析输入文件
                const rawData = fs.readFileSync(inputResolved, 'utf-8');
                const jsonData = parseChatJson(rawData);
                if (!jsonData) {
                    console.warn(`⚠️  跳过非聊天记录文件: ${filename}`);
                    return;
                }

                const chunks = jsonData.chunkedPrompt.chunks;
                const parsedPath = path.parse(filename);
                const baseName = parsedPath.name;

                // 生成 markdown 内容
                const mdContent = generateMarkdownContent(chunks, baseName, filename, includeThink);
                fs.writeFileSync(outputResolved, mdContent, 'utf-8');

                const msgCount = chunks.filter(c => !c.isThought).length;
                console.log(`[1/1] ✅ ${filename} → ${path.basename(outputResolved)} (${msgCount}条消息)`);
            } else {
                // 输出是目录：原逻辑
                ensureDirectoryExists(outputResolved);
                const filename = path.basename(inputPath);
                processFile({
                    inputDir: path.dirname(inputResolved),
                    outputDir: outputResolved,
                    filename,
                    fileIndex: 0,
                    totalFiles: 1,
                    includeThink
                });
            }
        } else if (stat.isDirectory()) {
            // 处理目录
            ensureDirectoryExists(outputResolved);

            const allFiles = getValidFiles(inputResolved);

            // 一次性读取所有文件内容并解析，避免后续重复读取
            const fileDataMap = new Map();
            const chatFiles = allFiles.filter(file => {
                const filePath = path.join(inputResolved, file);
                const rawData = fs.readFileSync(filePath, 'utf-8');
                const jsonData = parseChatJson(rawData);
                if (jsonData) {
                    fileDataMap.set(file, jsonData);
                    return true;
                }
                return false;
            });

            console.log(`\n📄 处理 ${chatFiles.length} 个文件...\n`);

            chatFiles.forEach((filename, fileIndex) => {
                processFile({
                    inputDir: inputResolved,
                    outputDir: outputResolved,
                    filename,
                    fileIndex,
                    totalFiles: chatFiles.length,
                    includeThink,
                    cachedData: fileDataMap.get(filename)
                });
            });
        }

        console.log(`\n🎉 所有文件处理完成！输出: ${outputPath}`);

    } catch (error) {
        console.error('❌ 发生错误:', error.message);
        handleSpecificErrors(error, inputPath);
        process.exit(1);
    }
};

module.exports = { convert };
