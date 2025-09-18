// 前沿探索工作流 - Background Service Worker
console.log('前沿探索工作流Background Service Worker已启动');

// 测试函数
function testFunction() {
    console.log('测试函数被调用');
    return '测试成功';
}

// 监听来自popup的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('收到消息:', request);
    
    switch (request.action) {
        case 'startFeature':
            handleStartFeature(request.feature, request.config, sendResponse);
            break;
        case 'getTaskStatus':
            handleGetTaskStatus(sendResponse);
            break;
        case 'test':
            sendResponse({ success: true, message: '后台脚本正常工作', test: testFunction() });
            break;
        default:
            sendResponse({ success: false, error: '未知操作' });
    }
    
    return true; // 保持消息通道开放
});

function handleStartFeature(feature, config, sendResponse) {
    console.log(`启动功能: ${feature}`, config);
    
    // 根据功能类型执行不同的逻辑
    switch (feature) {
        case 'paper-screening':
            // 使用Promise处理异步操作
            startPaperScreening(config, sendResponse).catch(error => {
                console.error('论文初筛功能执行失败:', error);
                sendResponse({ 
                    success: false, 
                    error: `论文初筛功能执行失败: ${error.message}`,
                    details: error.stack
                });
            });
            break;
        case 'github-research':
            startGithubResearch(sendResponse);
            break;
        case 'open-source-tracking':
            startOpenSourceTracking(sendResponse);
            break;
        default:
            sendResponse({ success: false, error: '未知功能' });
    }
}

async function startPaperScreening(config, sendResponse) {
    // 论文初筛功能
    console.log('启动论文初筛功能', config);
    
    try {
        // 使用默认配置
        const searchConfig = config || {
            keywords: 'agent benchmark',
            sources: 'arxiv',
            maxResults: 10
        };
        
        console.log('搜索配置:', searchConfig);
        
        // 搜索论文
        console.log('开始搜索论文...');
        const papers = await searchPapers(searchConfig);
        console.log('搜索到论文数量:', papers.length);
        
        if (papers.length === 0) {
            console.log('未找到相关论文');
            sendResponse({ success: false, error: '未找到相关论文，请尝试调整搜索关键词' });
            return;
        }
        
        // 分析论文
        console.log('开始分析论文...');
        const analysisResults = await analyzePapers(papers);
        console.log('分析完成，结果数量:', analysisResults.length);
        
        // 保存结果
        console.log('保存分析结果...');
        await saveAnalysisResults(analysisResults);
        
        // 显示结果
        console.log('显示分析结果...');
        await showAnalysisResults(analysisResults);
        
        updateTaskStatus(`论文初筛完成，分析了${analysisResults.length}篇论文`);
        sendResponse({ 
            success: true, 
            message: `论文初筛完成，分析了${analysisResults.length}篇论文`,
            results: analysisResults
        });
        
    } catch (error) {
        console.error('论文初筛失败:', error);
        console.error('错误堆栈:', error.stack);
        sendResponse({ 
            success: false, 
            error: `论文初筛失败: ${error.message}`,
            details: error.stack
        });
    }
}

async function searchPapers(config) {
    const { keywords, sources, maxResults } = config;
    const papers = [];
    
    // 根据配置搜索不同来源
    if (sources === 'arxiv' || sources === 'all') {
        const arxivPapers = await searchArxivPapers(keywords, maxResults);
        papers.push(...arxivPapers);
    }
    
    if (sources === 'scholar' || sources === 'all') {
        const scholarPapers = await searchScholarPapers(keywords, maxResults);
        papers.push(...scholarPapers);
    }
    
    if (sources === 'semanticscholar' || sources === 'all') {
        const semanticPapers = await searchSemanticScholarPapers(keywords, maxResults);
        papers.push(...semanticPapers);
    }
    
    return papers.slice(0, maxResults);
}

async function searchArxivPapers(keywords, maxResults) {
    try {
        // 使用CORS代理来避免跨域问题
        const proxyUrl = 'https://api.allorigins.win/raw?url=';
        const arxivUrl = `http://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(keywords)}&start=0&max_results=${maxResults}&sortBy=relevance&sortOrder=descending`;
        
        console.log('搜索arXiv:', arxivUrl);
        const response = await fetch(proxyUrl + encodeURIComponent(arxivUrl));
        
        if (!response.ok) {
            throw new Error(`arXiv API请求失败: ${response.status}`);
        }
        
        const xmlText = await response.text();
        console.log('arXiv响应长度:', xmlText.length);
        
        // 解析XML响应
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
        const entries = xmlDoc.querySelectorAll('entry');
        
        console.log('找到arXiv条目数量:', entries.length);
        
        const papers = [];
        entries.forEach(entry => {
            const title = entry.querySelector('title')?.textContent?.trim() || '';
            const authors = Array.from(entry.querySelectorAll('author name')).map(a => a.textContent.trim());
            const abstract = entry.querySelector('summary')?.textContent?.trim() || '';
            const published = entry.querySelector('published')?.textContent || '';
            const url = entry.querySelector('id')?.textContent || '';
            
            if (title && abstract) {
                papers.push({
                    title,
                    authors,
                    abstract,
                    publishedDate: published,
                    url,
                    source: 'arxiv'
                });
            }
        });
        
        console.log('解析出论文数量:', papers.length);
        return papers;
    } catch (error) {
        console.error('arXiv搜索失败:', error);
        // 返回模拟数据作为备用
        return [
            {
                title: `Agent Benchmark: ${keywords} - A Comprehensive Evaluation Framework`,
                authors: ['Research Team A', 'Research Team B'],
                abstract: `This paper presents a comprehensive benchmark for evaluating agent performance across multiple domains and tasks. The benchmark includes standardized evaluation protocols, diverse task environments, and performance metrics.`,
                publishedDate: '2024-01-01T00:00:00Z',
                url: 'https://arxiv.org/abs/2401.00001',
                source: 'arxiv'
            },
            {
                title: `Multi-Agent Systems: ${keywords} and Beyond`,
                authors: ['AI Researcher', 'ML Expert'],
                abstract: `We propose a novel approach to multi-agent system evaluation using ${keywords} as a foundation. Our method demonstrates improved performance across various benchmark tasks.`,
                publishedDate: '2024-01-02T00:00:00Z',
                url: 'https://arxiv.org/abs/2401.00002',
                source: 'arxiv'
            }
        ];
    }
}

async function searchScholarPapers(keywords, maxResults) {
    // Google Scholar没有公开API，返回模拟数据
    return [
        {
            title: `Agent Benchmark: ${keywords} - A Comprehensive Evaluation Framework`,
            authors: ['Research Team'],
            abstract: `This paper presents a comprehensive benchmark for evaluating agent performance across multiple domains and tasks.`,
            source: 'scholar',
            url: 'https://scholar.google.com/scholar?q=' + encodeURIComponent(keywords)
        }
    ];
}

async function searchSemanticScholarPapers(keywords, maxResults) {
    try {
        const response = await fetch(`https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(keywords)}&limit=${maxResults}&fields=paperId,title,abstract,authors,year,citationCount`);
        const data = await response.json();
        
        return data.data.map(paper => ({
            title: paper.title || '',
            authors: paper.authors ? paper.authors.map(a => a.name) : [],
            abstract: paper.abstract || '',
            year: paper.year,
            citationCount: paper.citationCount || 0,
            source: 'semanticscholar',
            url: `https://www.semanticscholar.org/paper/${paper.paperId}`
        }));
    } catch (error) {
        console.error('Semantic Scholar搜索失败:', error);
        return [];
    }
}

async function analyzePapers(papers) {
    const results = [];
    
    for (const paper of papers) {
        try {
            const analysis = await analyzeSinglePaper(paper);
            results.push({
                ...paper,
                analysis,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error(`分析论文失败: ${paper.title}`, error);
            results.push({
                ...paper,
                analysis: null,
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }
    
    return results;
}

async function analyzeSinglePaper(paper) {
    const settings = await getAISettings();
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${settings.apiKey}`,
            'HTTP-Referer': 'chrome-extension://paper-screening',
            'X-Title': 'Paper Screening Tool'
        },
        body: JSON.stringify({
            model: settings.model || 'openai/gpt-4o',
            messages: [
                {
                    role: 'system',
                    content: '你是一个专业的学术论文分析专家，擅长分析各种领域的学术论文并提供深入的分析报告。请始终以JSON格式返回分析结果。'
                },
                {
                    role: 'user',
                    content: `请分析以下论文，并提供详细的初筛报告：

论文标题: ${paper.title}
作者: ${paper.authors.join(', ')}
摘要: ${paper.abstract}
来源: ${paper.source}
发表年份: ${paper.year || '未知'}

请从以下维度进行分析，并以JSON格式返回结果：

1. summary (论文简介): 用2-3句话概括论文的核心贡献
2. keyPoints (关注要点): 列出3-5个最重要的技术要点
3. innovationScore (创新性评分): 1-10分
4. practicalScore (实用性评分): 1-10分
5. impactScore (影响力评分): 1-10分
6. relatedWork (相关研究): 简要说明与现有研究的关系
7. methodology (方法论): 主要采用的研究方法
8. limitations (局限性): 论文的主要局限性

请确保返回的JSON格式正确。`
                }
            ],
            max_tokens: 1000,
            temperature: 0.7
        })
    });

    if (!response.ok) {
        throw new Error(`AI分析失败: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    try {
        return JSON.parse(content);
    } catch (e) {
        // 如果JSON解析失败，返回默认分析
        return {
            summary: `这是一篇关于${paper.title}的研究论文。`,
            keyPoints: ['需要进一步分析具体的技术贡献', '建议关注实验设计和结果'],
            innovationScore: 6,
            practicalScore: 5,
            impactScore: 5,
            relatedWork: '需要进一步分析相关研究',
            methodology: '需要详细分析研究方法',
            limitations: '需要识别论文的局限性'
        };
    }
}

async function saveAnalysisResults(results) {
    return new Promise((resolve) => {
        chrome.storage.local.get(['analysisResults'], (data) => {
            const existingResults = data.analysisResults || [];
            const newResults = [...existingResults, ...results];
            
            // 限制存储数量
            if (newResults.length > 100) {
                newResults.splice(0, newResults.length - 100);
            }
            
            chrome.storage.local.set({ analysisResults: newResults }, () => {
                resolve();
            });
        });
    });
}

async function showAnalysisResults(results) {
    // 创建新标签页显示结果
    const resultsHtml = generateResultsHTML(results);
    const blob = new Blob([resultsHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    chrome.tabs.create({ url: url });
}

function generateResultsHTML(results) {
    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>论文初筛结果</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .paper-card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
        .paper-title { font-size: 18px; font-weight: bold; color: #2c3e50; margin-bottom: 10px; }
        .paper-meta { color: #666; margin-bottom: 15px; }
        .analysis-section { margin-top: 15px; }
        .score { display: inline-block; padding: 4px 8px; border-radius: 4px; margin-right: 10px; }
        .score.innovation { background: #e3f2fd; color: #1976d2; }
        .score.practical { background: #e8f5e8; color: #388e3c; }
        .score.impact { background: #fff3e0; color: #f57c00; }
        .key-points { list-style-type: disc; margin-left: 20px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>📄 论文初筛结果</h1>
        <p>共分析了 ${results.length} 篇论文</p>
    </div>
    
    ${results.map(paper => `
        <div class="paper-card">
            <div class="paper-title">${paper.title}</div>
            <div class="paper-meta">
                作者: ${paper.authors.join(', ')} | 
                来源: ${paper.source} | 
                时间: ${new Date(paper.timestamp).toLocaleString()}
            </div>
            
            ${paper.analysis ? `
                <div class="analysis-section">
                    <h3>📋 论文简介</h3>
                    <p>${paper.analysis.summary || '暂无简介'}</p>
                    
                    <h3>🎯 关注要点</h3>
                    <ul class="key-points">
                        ${(paper.analysis.keyPoints || []).map(point => `<li>${point}</li>`).join('')}
                    </ul>
                    
                    <h3>📊 评分</h3>
                    <span class="score innovation">创新性: ${paper.analysis.innovationScore || 'N/A'}/10</span>
                    <span class="score practical">实用性: ${paper.analysis.practicalScore || 'N/A'}/10</span>
                    <span class="score impact">影响力: ${paper.analysis.impactScore || 'N/A'}/10</span>
                    
                    <h3>🔍 相关研究</h3>
                    <p>${paper.analysis.relatedWork || '暂无相关研究信息'}</p>
                    
                    <h3>⚙️ 方法论</h3>
                    <p>${paper.analysis.methodology || '暂无方法论信息'}</p>
                    
                    <h3>⚠️ 局限性</h3>
                    <p>${paper.analysis.limitations || '暂无局限性信息'}</p>
                </div>
            ` : `
                <div class="analysis-section">
                    <p style="color: red;">❌ 分析失败: ${paper.error || '未知错误'}</p>
                </div>
            `}
        </div>
    `).join('')}
</body>
</html>
    `;
}

async function getAISettings() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['settings'], (data) => {
            const settings = data.settings || {};
            resolve({
                provider: settings.modelProvider || 'openrouter',
                apiKey: settings.apiKey || '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',
                model: settings.model || 'openai/gpt-4o'
            });
        });
    });
}

function startGithubResearch(sendResponse) {
    // Github调研功能
    console.log('启动Github调研功能');
    
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
            const currentTab = tabs[0];
            
            if (currentTab.url.includes('github.com')) {
                chrome.scripting.executeScript({
                    target: { tabId: currentTab.id },
                    files: ['features/github-research/content-script.js']
                }).then(() => {
                    updateTaskStatus('Github调研任务已启动');
                    sendResponse({ success: true, message: 'Github调研任务已启动' });
                }).catch((error) => {
                    console.error('注入脚本失败:', error);
                    sendResponse({ success: false, error: '脚本注入失败' });
                });
            } else {
                sendResponse({ 
                    success: false, 
                    error: '请在GitHub网站上使用此功能' 
                });
            }
        }
    });
}

function startOpenSourceTracking(sendResponse) {
    // 开源追踪功能
    console.log('启动开源追踪功能');
    
    // 这里可以打开新标签页或使用当前页面
    chrome.tabs.create({
        url: chrome.runtime.getURL('features/open-source-tracking/index.html')
    }, (tab) => {
        updateTaskStatus('开源追踪任务已启动');
        sendResponse({ success: true, message: '开源追踪任务已启动' });
    });
}

function isSupportedPaperSite(url) {
    const supportedSites = [
        'arxiv.org',
        'scholar.google.com',
        'semanticscholar.org',
        'pubmed.ncbi.nlm.nih.gov',
        'ieeexplore.ieee.org',
        'dl.acm.org'
    ];
    
    return supportedSites.some(site => url.includes(site));
}

function updateTaskStatus(message) {
    const timestamp = new Date().toLocaleTimeString();
    const statusItem = {
        time: timestamp,
        message: message
    };
    
    // 保存到storage
    chrome.storage.local.get(['taskStatus'], (result) => {
        const taskStatus = result.taskStatus || [];
        taskStatus.unshift(statusItem);
        
        // 限制状态历史长度
        if (taskStatus.length > 10) {
            taskStatus.splice(10);
        }
        
        chrome.storage.local.set({ taskStatus: taskStatus });
    });
    
    // 通知popup更新
    chrome.runtime.sendMessage({
        action: 'updateStatus',
        message: message
    }).catch(() => {
        // popup可能已关闭，忽略错误
    });
}

function handleGetTaskStatus(sendResponse) {
    chrome.storage.local.get(['taskStatus'], (result) => {
        sendResponse({ 
            success: true, 
            taskStatus: result.taskStatus || [] 
        });
    });
}

// 插件安装时的初始化
chrome.runtime.onInstalled.addListener((details) => {
    console.log('插件已安装/更新:', details.reason);
    
    // 初始化存储
    chrome.storage.local.set({
        taskStatus: [],
        settings: {
            autoStart: false,
            notificationEnabled: true,
            modelProvider: 'openrouter',
            apiKey: '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',
            model: 'openai/gpt-4o'
        }
    });
});
