const fs = require('fs');
const path = require('path');

// 角色映射配置
const ROLE_MAP = {
    'user': '👱🏻‍♂️ User',
    'model': '🤖 AI Model',
    'think': '💭 Thinking',
};

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

// 验证是否为有效的聊天记录JSON
const isValidChatJson = (content) => {
    try {
        const data = JSON.parse(content);
        if (!data.chunkedPrompt || !data.chunkedPrompt.chunks) {
            return false;
        }
        return data.chunkedPrompt.chunks.some(chunk =>
            chunk.text && chunk.role && ['user', 'model'].includes(chunk.role)
        );
    } catch (error) {
        return false;
    }
};

// 获取角色显示名称
const getRoleDisplay = (roleKey) => {
    return ROLE_MAP[roleKey] || roleKey;
};

// 生成单个消息的Markdown内容
const generateMessageMarkdown = (msg, userMessageCount) => {
    const roleKey = msg.isThought ? 'think' : msg.role;
    const content = msg.text;
    const roleDisplay = getRoleDisplay(roleKey);

    if (!content) return '';

    const userIndex = roleKey === 'user' ? `[${userMessageCount}]` : '';
    return `# ${roleDisplay}${userIndex}\n\n${content}\n\n---\n\n`;
};

// 生成完整的Markdown内容
const generateMarkdownContent = (chunks, baseName, filename) => {
    let mdContent = `# Chat History Export - ${baseName}\n\n`;
    mdContent += `> 生成时间：${new Date().toLocaleString()}\n`;
    mdContent += `> 原始文件：${filename}\n\n`;
    mdContent += `---\n\n`;

    let userMessageCount = 0;
    chunks.forEach(msg => {
        if (msg.role === 'user' && !msg.isThought) {
            userMessageCount++;
        }
        mdContent += generateMessageMarkdown(msg, userMessageCount);
    });

    return mdContent;
};

// 处理单个文件
const processFile = (inputDir, outputDir, filename, fileIndex, totalFiles) => {
    try {
        const inputFilePath = path.join(inputDir, filename);
        const rawData = fs.readFileSync(inputFilePath, 'utf-8');

        if (!isValidChatJson(rawData)) {
            console.warn(`⚠️  跳过非聊天记录文件: ${filename}`);
            return;
        }

        const jsonData = JSON.parse(rawData);
        const chunks = jsonData.chunkedPrompt.chunks;

        const baseName = path.parse(filename).name;
        const ext = path.parse(filename).ext;
        const outputFilename = ext ? `${filename}.md` : `${baseName}.md`;
        const outputFilePath = path.join(outputDir, outputFilename);

        const mdContent = generateMarkdownContent(chunks, baseName, filename);
        fs.writeFileSync(outputFilePath, mdContent, 'utf-8');

        console.log(`✅ [${fileIndex + 1}/${totalFiles}] 转换成功！`);
        console.log(`   输入文件: ${filename}`);
        console.log(`   输出文件: ${outputFilename}`);
        console.log(`   📊 处理了 ${chunks.length} 条消息。`);
        console.log('');

    } catch (fileError) {
        console.error(`❌ 处理文件 ${filename} 时出错:`, fileError.message);
        console.error('');
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
const convert = (inputPath, outputPath) => {
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

                // 读取输入文件
                const rawData = fs.readFileSync(inputResolved, 'utf-8');
                if (!isValidChatJson(rawData)) {
                    console.warn(`⚠️  跳过非聊天记录文件: ${filename}`);
                    return;
                }

                const jsonData = JSON.parse(rawData);
                const chunks = jsonData.chunkedPrompt.chunks;

                // 生成 markdown 内容
                const baseName = path.parse(filename).name;
                const mdContent = generateMarkdownContent(chunks, baseName, filename);
                fs.writeFileSync(outputResolved, mdContent, 'utf-8');

                console.log(`✅ 转换成功！`);
                console.log(`   输入文件: ${filename}`);
                console.log(`   输出文件: ${path.basename(outputResolved)}`);
                console.log(`   📊 处理了 ${chunks.length} 条消息。`);
            } else {
                // 输出是目录：原逻辑
                ensureDirectoryExists(outputResolved);
                const filename = path.basename(inputPath);
                processFile(path.dirname(inputResolved), outputResolved, filename, 0, 1);
            }
        } else if (stat.isDirectory()) {
            // 处理目录
            ensureDirectoryExists(outputResolved);

            const allFiles = getValidFiles(inputResolved);
            const chatFiles = allFiles.filter(file => {
                const filePath = path.join(inputResolved, file);
                const content = fs.readFileSync(filePath, 'utf-8');
                return isValidChatJson(content);
            });

            console.log(`\n📄 找到 ${chatFiles.length} 个聊天记录文件需要处理 (共 ${allFiles.length} 个文件)`);

            chatFiles.forEach((filename, fileIndex) => {
                processFile(inputResolved, outputResolved, filename, fileIndex, chatFiles.length);
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
