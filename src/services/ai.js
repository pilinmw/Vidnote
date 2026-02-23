import { getSetting } from './storage';

/**
 * 调用 OpenAI API 生成视频内容总结
 */
export async function generateSummary(notes, options = {}) {
    const apiKey = await getSetting('openai_api_key');

    if (!apiKey) {
        throw new Error('请先在设置中配置 OpenAI API Key');
    }

    const { mode = 'full', projectTitle = '视频', projectType = 'video' } = options;

    const typeLabels = { video: '视频', live: '直播', meeting: '会议' };
    const typeLabel = typeLabels[projectType] || '视频';

    // 构建笔记内容
    const notesText = notes
        .map((n) => `[${n.formattedTime}] ${n.content}${n.isHighlight ? ' ⭐' : ''}`)
        .join('\n');

    let systemPrompt, userPrompt;

    if (mode === 'highlights') {
        const highlightNotes = notes.filter((n) => n.isHighlight);
        const highlightsText = highlightNotes
            .map((n) => `[${n.formattedTime}] ${n.content}`)
            .join('\n');

        systemPrompt = `你是一个专业的${typeLabel}内容分析助手。请根据用户标记的高光笔记，生成精炼的重点摘要。使用中文回复。`;
        userPrompt = `以下是${typeLabel}"${projectTitle}"的高光笔记：\n\n${highlightsText}\n\n请根据这些高光笔记生成一份重点摘要，包含：\n1. 核心要点（3-5条）\n2. 关键观点总结`;
    } else {
        systemPrompt = `你是一个专业的${typeLabel}内容分析助手。请根据用户的时间戳笔记，对${typeLabel}内容进行全面总结。使用中文回复。`;
        const summaryStructure = projectType === 'meeting'
            ? `\n1. 会议概述（1-2句话）\n2. 讨论要点（按议题归类）\n3. 决策事项与行动计划（Action Items）`
            : projectType === 'live'
                ? `\n1. 内容概述（1-2句话）\n2. 核心要点（按时间顺序）\n3. 精彩观点与关键信息`
                : `\n1. 视频概述（1-2句话）\n2. 核心要点（按逻辑顺序）\n3. 关键结论或行动建议`;
        userPrompt = `以下是${typeLabel}"${projectTitle}"的时间戳笔记：\n\n${notesText}\n\n请根据这些笔记生成一份全面的${typeLabel}内容总结，包含：${summaryStructure}`;
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            temperature: 0.7,
            max_tokens: 1500,
        }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error?.message || `API 请求失败 (${response.status})`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}
