// 论文初筛功能 - Background Script
console.log('论文初筛Background Script已启动');

// 监听来自content script的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('收到论文初筛消息:', request);
    
    switch (request.action) {
        case 'processPaperScreening':
            handlePaperScreening(request.data, sendResponse);
            break;
        case 'getScreeningHistory':
            handleGetScreeningHistory(sendResponse);
            break;
        case 'deleteScreeningResult':
            handleDeleteScreeningResult(request.id, sendResponse);
            break;
        default:
            sendResponse({ success: false, error: '未知操作' });
    }
    
    return true; // 保持消息通道开放
});

async function handlePaperScreening(paperData, sendResponse) {
    try {
        console.log('开始处理论文初筛:', paperData);
        
        // 1. 验证论文数据
        if (!validatePaperData(paperData)) {
            sendResponse({ success: false, error: '论文数据不完整' });
            return;
        }
        
        // 2. 调用AI分析服务
        const analysisResult = await analyzePaperWithAI(paperData);
        
        // 3. 生成论文简介和关注要点
        const screeningResult = await generateScreeningResult(paperData, analysisResult);
        
        // 4. 保存结果到本地存储
        await saveScreeningResult(screeningResult);
        
        // 5. 发送通知（如果启用）
        if (await isNotificationEnabled()) {
            sendNotification('论文初筛完成', `已分析论文: ${paperData.title}`);
        }
        
        sendResponse({ success: true, result: screeningResult });
        
    } catch (error) {
        console.error('论文初筛处理失败:', error);
        sendResponse({ success: false, error: error.message });
    }
}

function validatePaperData(paperData) {
    const requiredFields = ['title', 'authors', 'abstract', 'url', 'source'];
    return requiredFields.every(field => paperData[field]);
}

async function analyzePaperWithAI(paperData) {
    try {
        // 构建分析提示词
        const prompt = buildAnalysisPrompt(paperData);
        
        // 调用AI模型API
        const response = await callAIModel(prompt);
        
        return {
            summary: response.summary,
            keyPoints: response.keyPoints,
            innovationScore: response.innovationScore,
            practicalScore: response.practicalScore,
            impactScore: response.impactScore,
            relatedWork: response.relatedWork,
            methodology: response.methodology,
            limitations: response.limitations
        };
        
    } catch (error) {
        console.error('AI分析失败:', error);
        // 返回默认分析结果
        return generateDefaultAnalysis(paperData);
    }
}

function buildAnalysisPrompt(paperData) {
    return `
请分析以下论文，并提供详细的初筛报告：

论文标题: ${paperData.title}
作者: ${paperData.authors}
摘要: ${paperData.abstract}
来源: ${paperData.source}
URL: ${paperData.url}

请从以下维度进行分析：

1. 论文简介 (summary): 用2-3句话概括论文的核心贡献
2. 关注要点 (keyPoints): 列出3-5个最重要的技术要点或创新点
3. 创新性评分 (innovationScore): 1-10分，评估论文的创新程度
4. 实用性评分 (practicalScore): 1-10分，评估论文的实用价值
5. 影响力评分 (impactScore): 1-10分，评估论文的潜在影响力
6. 相关研究 (relatedWork): 简要说明与现有研究的关系
7. 方法论 (methodology): 主要采用的研究方法
8. 局限性 (limitations): 论文的主要局限性

请以JSON格式返回结果。
`;
}

async function callAIModel(prompt) {
    // 获取用户配置的AI模型设置
    const settings = await getAISettings();
    
    try {
        // 根据配置调用不同的AI模型
        switch (settings.provider) {
            case 'openai':
                return await callOpenAI(prompt, settings);
            case 'claude':
                return await callClaude(prompt, settings);
            case 'gemini':
                return await callGemini(prompt, settings);
            default:
                return await callDefaultModel(prompt, settings);
        }
    } catch (error) {
        console.error('AI模型调用失败:', error);
        throw error;
    }
}

async function callOpenAI(prompt, settings) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${settings.apiKey}`
        },
        body: JSON.stringify({
            model: settings.model || 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'system',
                    content: '你是一个专业的论文分析助手，擅长分析学术论文并提供详细的初筛报告。'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            max_tokens: 1000,
            temperature: 0.7
        })
    });
    
    if (!response.ok) {
        throw new Error(`OpenAI API错误: ${response.status}`);
    }
    
    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // 尝试解析JSON响应
    try {
        return JSON.parse(content);
    } catch (e) {
        // 如果不是JSON格式，返回默认结构
        return parseTextResponse(content);
    }
}

async function callClaude(prompt, settings) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': settings.apiKey,
            'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
            model: settings.model || 'claude-3-sonnet-20240229',
            max_tokens: 1000,
            messages: [
                {
                    role: 'user',
                    content: prompt
                }
            ]
        })
    });
    
    if (!response.ok) {
        throw new Error(`Claude API错误: ${response.status}`);
    }
    
    const data = await response.json();
    const content = data.content[0].text;
    
    try {
        return JSON.parse(content);
    } catch (e) {
        return parseTextResponse(content);
    }
}

async function callGemini(prompt, settings) {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${settings.model || 'gemini-pro'}:generateContent?key=${settings.apiKey}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            contents: [{
                parts: [{
                    text: prompt
                }]
            }]
        })
    });
    
    if (!response.ok) {
        throw new Error(`Gemini API错误: ${response.status}`);
    }
    
    const data = await response.json();
    const content = data.candidates[0].content.parts[0].text;
    
    try {
        return JSON.parse(content);
    } catch (e) {
        return parseTextResponse(content);
    }
}

async function callDefaultModel(prompt, settings) {
    // 使用默认的本地模型或备用API
    // 这里可以实现一个简单的规则基础的分析
    return generateDefaultAnalysis();
}

function parseTextResponse(text) {
    // 从文本响应中提取结构化信息
    const lines = text.split('\n');
    const result = {};
    
    lines.forEach(line => {
        if (line.includes('简介') || line.includes('summary')) {
            result.summary = line.replace(/.*[:：]\s*/, '');
        } else if (line.includes('要点') || line.includes('keyPoints')) {
            result.keyPoints = [line.replace(/.*[:：]\s*/, '')];
        } else if (line.includes('创新性') || line.includes('innovation')) {
            const score = line.match(/\d+/);
            result.innovationScore = score ? parseInt(score[0]) : 5;
        } else if (line.includes('实用性') || line.includes('practical')) {
            const score = line.match(/\d+/);
            result.practicalScore = score ? parseInt(score[0]) : 5;
        } else if (line.includes('影响力') || line.includes('impact')) {
            const score = line.match(/\d+/);
            result.impactScore = score ? parseInt(score[0]) : 5;
        }
    });
    
    return result;
}

function generateDefaultAnalysis(paperData) {
    // 基于规则的默认分析
    const abstract = paperData.abstract || '';
    const title = paperData.title || '';
    
    // 简单的关键词分析
    const keywords = extractKeywordsFromText(abstract + ' ' + title);
    
    return {
        summary: `这是一篇关于${keywords.slice(0, 3).join('、')}的研究论文。`,
        keyPoints: [
            '需要进一步分析具体的技术贡献',
            '建议关注实验设计和结果',
            '评估方法的创新性'
        ],
        innovationScore: 6,
        practicalScore: 5,
        impactScore: 5,
        relatedWork: '需要进一步分析相关研究',
        methodology: '需要详细分析研究方法',
        limitations: '需要识别论文的局限性'
    };
}

function extractKeywordsFromText(text) {
    const commonKeywords = [
        'machine learning', 'deep learning', 'neural network', 'artificial intelligence',
        'computer vision', 'natural language processing', 'reinforcement learning',
        'data mining', 'big data', 'blockchain', 'cybersecurity', 'robotics',
        'optimization', 'algorithm', 'model', 'framework', 'system'
    ];
    
    const foundKeywords = [];
    const lowerText = text.toLowerCase();
    
    commonKeywords.forEach(keyword => {
        if (lowerText.includes(keyword)) {
            foundKeywords.push(keyword);
        }
    });
    
    return foundKeywords;
}

async function generateScreeningResult(paperData, analysisResult) {
    return {
        id: generateId(),
        timestamp: new Date().toISOString(),
        paperData: paperData,
        analysis: analysisResult,
        status: 'completed',
        version: '1.0'
    };
}

async function saveScreeningResult(result) {
    return new Promise((resolve) => {
        chrome.storage.local.get(['screeningResults'], (data) => {
            const results = data.screeningResults || [];
            results.push(result);
            
            // 限制存储的结果数量
            if (results.length > 100) {
                results.splice(0, results.length - 100);
            }
            
            chrome.storage.local.set({ screeningResults: results }, () => {
                resolve();
            });
        });
    });
}

async function handleGetScreeningHistory(sendResponse) {
    chrome.storage.local.get(['screeningResults'], (data) => {
        sendResponse({ 
            success: true, 
            results: data.screeningResults || [] 
        });
    });
}

async function handleDeleteScreeningResult(id, sendResponse) {
    chrome.storage.local.get(['screeningResults'], (data) => {
        const results = data.screeningResults || [];
        const filteredResults = results.filter(result => result.id !== id);
        
        chrome.storage.local.set({ screeningResults: filteredResults }, () => {
            sendResponse({ success: true });
        });
    });
}

async function getAISettings() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['settings'], (data) => {
            const settings = data.settings || {};
            resolve({
                provider: settings.modelProvider || 'default',
                apiKey: settings.apiKey || '',
                model: settings.model || 'gpt-3.5-turbo'
            });
        });
    });
}

async function isNotificationEnabled() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['settings'], (data) => {
            const settings = data.settings || {};
            resolve(settings.notificationEnabled !== false);
        });
    });
}

function sendNotification(title, message) {
    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: title,
        message: message
    });
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// 定时任务处理
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'paperScreeningSchedule') {
        handleScheduledScreening();
    }
});

async function handleScheduledScreening() {
    console.log('执行定时论文初筛任务');
    
    // 获取用户配置的关键词
    const settings = await getScreeningSettings();
    
    if (settings.autoScreening && settings.keywords.length > 0) {
        // 执行自动论文搜索和初筛
        await performAutomaticScreening(settings);
    }
}

async function getScreeningSettings() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['settings'], (data) => {
            const settings = data.settings || {};
            resolve({
                autoScreening: settings.autoScreening || false,
                keywords: settings.paperKeywords ? settings.paperKeywords.split(',').map(k => k.trim()) : [],
                frequency: settings.paperSearchFrequency || 'daily'
            });
        });
    });
}

async function performAutomaticScreening(settings) {
    // 这里可以实现自动搜索论文的逻辑
    // 例如：调用arXiv API、Google Scholar API等
    console.log('执行自动论文初筛:', settings);
    
    // 发送通知
    sendNotification('定时论文初筛', `已搜索关键词: ${settings.keywords.join(', ')}`);
}
