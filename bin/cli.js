#!/usr/bin/env node

const { convert } = require('../lib/index');
const fs = require('fs');

// 打印使用说明
const printUsage = () => {
    console.log(`
Usage: gemini-tomd [options] <input> [output]

Description:
  Convert Google AI Studio chat records to Markdown format.

Options:
  -t, --think    Include AI thinking process in the output
  -h, --help     Show this help message

Arguments:
  input   Path to input file or directory containing chat records
  output  Path to output file or directory (optional)
          - Directory input: default is "./Google AI Studio MD"
          - File input: default is "filename.md"

Examples:
  # Convert directory (uses default output directory)
  gemini-tomd "./Google AI Studio"

  # Convert with thinking process included
  gemini-tomd -t "./Google AI Studio"
  gemini-tomd --think "./Google AI Studio"

  # Convert single file (uses default output filename)
  gemini-tomd "Bookmark Organization And Suggestions"
  # Output: Bookmark Organization And Suggestions.md

  # Convert single file (with .json extension)
  gemini-tomd "chat.json"
  # Output: chat.json.md

  # Convert single file (specify output filename)
  gemini-tomd "chat.json" "output.md"

  # Convert directory (specify output directory)
  gemini-tomd "./Google AI Studio" "./output"

  # Use absolute paths
  gemini-tomd "/path/to/input" "/path/to/output"

For more information, visit: https://github.com/fxzer/google-aistudio-chat-to-md
`);
};

// 主函数
const main = () => {
    const args = process.argv.slice(2);

    // 检查帮助参数
    if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
        printUsage();
        process.exit(0);
    }

    // 解析选项参数
    const includeThink = args.includes('-t') || args.includes('--think');
    // 过滤掉选项参数，只保留路径参数
    const pathArgs = args.filter(arg => arg !== '-t' && arg !== '--think');

    const inputPath = pathArgs[0];
    // 不传第二个参数时使用 undefined，让 convert 函数自动判断默认值
    const outputPath = pathArgs.length > 1 ? pathArgs[1] : undefined;

    // 检查输入路径是否存在
    if (!fs.existsSync(inputPath)) {
        console.error(`❌ 错误: 输入路径不存在: ${inputPath}`);
        process.exit(1);
    }

    // 执行转换
    convert(inputPath, outputPath, includeThink);
};

main();
