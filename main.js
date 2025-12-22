const fs = require('fs');
const path = require('path');

// ================= 配置区 =================
const INPUT_DIR = './Google AI Studio';  // 输入目录
const OUTPUT_DIR = './Google AI Studio MD'; // 输出目录

// 定义角色映射（根据你的 JSON 数据调整）
const ROLE_MAP = {
    'user': '👱🏻‍♂️ User',
    'model': '🤖 AI Model',
    'think': '💭 Thinking',
};
// =========================================

// ================= 工具函数区 =================

// 确保目录存在
const ensureDirectoryExists = (dirPath) => {
    const fullPath = path.resolve(__dirname, dirPath);
    if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        console.log(`📁 创建输出目录: ${dirPath}`);
    }
};

// 检查是否为有效文件类型
const isValidFileType = (filename) => {
    // 过滤隐藏文件（以.开头）
    if (filename.startsWith('.')) {
        return false;
    }

    const ext = path.extname(filename).toLowerCase();
    return ext === '.json' || ext === '';
};

// 获取文件列表并过滤
const getValidFiles = (inputDir) => {
    const files = fs.readdirSync(path.resolve(__dirname, inputDir));
    return files.filter(file => {
        const filePath = path.join(inputDir, file);
        const isFile = fs.statSync(path.resolve(__dirname, filePath)).isFile();

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
        const rawData = fs.readFileSync(path.resolve(__dirname, inputFilePath), 'utf-8');

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
        fs.writeFileSync(path.resolve(__dirname, outputFilePath), mdContent, 'utf-8');

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
const handleSpecificErrors = (error) => {
    if (error.message.includes('ENOENT')) {
        console.error(`提示: 找不到目录 ${INPUT_DIR}，请确保该目录存在。`);
    }
    if (error.message.includes('Unexpected token')) {
        console.error('提示: 某个文件可能不是标准的 JSON 格式。');
    }
    if (error.message.includes('EACCES')) {
        console.error('提示: 没有足够的权限访问文件或目录。');
    }
};

// 主处理函数
const main = () => {
    try {
        // 确保输出目录存在
        ensureDirectoryExists(OUTPUT_DIR);

        // 获取所有有效文件
        const allFiles = getValidFiles(INPUT_DIR);

        // 过滤出聊天记录文件
        const chatFiles = allFiles.filter(file => {
            const filePath = path.join(INPUT_DIR, file);
            const content = fs.readFileSync(path.resolve(__dirname, filePath), 'utf-8');
            return isValidChatJson(content);
        });

        console.log(`\n📄 找到 ${chatFiles.length} 个聊天记录文件需要处理 (共 ${allFiles.length} 个文件)`);

        // 处理每个聊天记录文件
        chatFiles.forEach((filename, fileIndex) => {
            processFile(INPUT_DIR, OUTPUT_DIR, filename, fileIndex, chatFiles.length);
        });

        console.log(`\n🎉 所有文件处理完成！输出目录: ${OUTPUT_DIR}`);

    } catch (error) {
        console.error('❌ 发生错误:', error.message);
        handleSpecificErrors(error);
    }
};

// 执行主函数
main();
