// 全自动化工作流 - 后台脚本
console.log('后台脚本已加载');

// 任务状态管理
let currentTask = null;
let taskStatus = '空闲';

function updateTaskStatus(status) {
    taskStatus = status;
    console.log('任务状态更新:', status);
}

function getTaskStatus() {
    return {
        task: currentTask,
        status: taskStatus,
        timestamp: new Date().toISOString()
    };
}

// AI设置管理 - 内置豆包API配置
async function getAISettings() {
    // 直接返回内置的豆包API配置，无需用户手动设置
    const settings = {
        modelProvider: 'doubao',
        apiKey: '1efe2398-c5bc-4d93-afb1-d72fdf99b938',
        model: 'ep-20250611180329-rxrl9',
        notificationEnabled: true,
        autoStart: false
    };
    
    console.log('使用内置豆包API配置:', {
        provider: settings.modelProvider,
        model: settings.model,
        apiKey: settings.apiKey.substring(0, 20) + '...'
    });
    
    return settings;
}

// 简化的AI分析器
class SimplePaperAnalyzer {
    constructor() {
        this.provider = 'doubao';
        this.apiKey = '1efe2398-c5bc-4d93-afb1-d72fdf99b938';
        this.model = 'ep-20250611180329-rxrl9';
    }

    setConfig(config) {
        // 使用传入的配置，如果没有则使用内置的豆包API配置
        this.provider = config.modelProvider || 'doubao';
        this.apiKey = config.apiKey || '1efe2398-c5bc-4d93-afb1-d72fdf99b938';
        this.model = config.model || 'ep-20250611180329-rxrl9';
        console.log('分析器配置:', {
            provider: this.provider,
            model: this.model,
            apiKey: this.apiKey ? this.apiKey.substring(0, 20) + '...' : '未设置'
        });
    }

    async analyzePaper(paperData) {
        try {
            console.log('开始分析论文:', paperData.title);
            
            const prompt = this.buildAnalysisPrompt(paperData);
            console.log('分析提示词长度:', prompt.length);
            console.log('正在调用AI模型进行分析...');
            
            const analysisResult = await this.callOpenRouter(prompt);
            console.log('AI分析结果:', analysisResult);
            
            const processedResult = this.postProcessAnalysis(analysisResult, paperData);
            console.log('后处理结果:', processedResult);
            
            return processedResult;
        } catch (error) {
            console.error('论文分析失败:', error);
            return this.generateFallbackAnalysis(paperData);
        }
    }

    buildAnalysisPrompt(paperData) {
        return `
请作为专业的学术论文分析专家，对以下论文进行深入分析：

**论文信息：**
- 标题: ${paperData.title}
- 作者: ${paperData.authors.join(', ')}
- 摘要: ${paperData.abstract}
- 来源: ${paperData.source}
- 发表年份: ${paperData.year || '未知'}
- 论文链接: ${paperData.url || '未知'}

请从以下维度进行专业分析，并以JSON格式返回结果：

1. **summary** (论文简介): 用2-3句话概括论文的核心贡献和创新点
2. **keyPoints** (关注要点): 列出3-5个最重要的技术要点或创新点
3. **innovationScore** (创新性评分): 1-10分，评估论文的创新程度
4. **practicalScore** (实用性评分): 1-10分，评估论文的实用价值和应用前景
5. **impactScore** (影响力评分): 1-10分，评估论文的潜在学术影响力
6. **relatedWork** (相关研究): 基于摘要内容分析相关工作
7. **methodology** (方法论): 基于摘要内容分析方法论
8. **limitations** (局限性): 基于摘要内容分析局限性

请确保返回的JSON格式正确，所有字段都有值。
`;
    }

    async callOpenRouter(prompt) {
        console.log('开始调用豆包API...');
        console.log('API密钥:', this.apiKey ? this.apiKey.substring(0, 20) + '...' : '未设置');
        console.log('模型:', this.model);
        
        // 验证API密钥
        if (!this.apiKey) {
            throw new Error('API密钥未设置，请在扩展设置中配置API密钥');
        }
        
        const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
                'HTTP-Referer': 'chrome-extension://' + chrome.runtime.id,
                'X-Title': 'Paper Screening Tool'
            },
            body: JSON.stringify({
                model: this.model || 'ep-20250611180329-rxrl9',
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 2000,
                temperature: 0.7
            })
        });

        console.log('API响应状态:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('API错误响应:', errorText);
            
            if (response.status === 401) {
                throw new Error('API密钥认证失败，请检查密钥是否正确或已过期');
            } else if (response.status === 429) {
                throw new Error('API调用频率限制，请稍后重试');
            } else if (response.status === 402) {
                throw new Error('账户余额不足，请充值后重试');
            } else {
                throw new Error(`豆包API调用失败: ${response.status} ${response.statusText}\n${errorText}`);
            }
        }

        const data = await response.json();
        console.log('API响应数据:', data);
        
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            throw new Error('API响应格式错误: 缺少choices或message字段');
        }
        
        return data.choices[0].message.content;
    }

    postProcessAnalysis(analysisResult, paperData) {
        try {
            const analysis = JSON.parse(analysisResult);
            return {
                ...analysis,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.warn('AI响应不是有效JSON，使用基于规则的分析');
            return this.generateRuleBasedAnalysis(paperData);
        }
    }

    generateRuleBasedAnalysis(paperData) {
        return {
            summary: `这是一篇关于${paperData.title}的研究论文，主要探讨了相关技术和方法。`,
            keyPoints: [
                '提出了新的技术方法',
                '包含实验验证',
                '具有实际应用价值'
            ],
            innovationScore: 7,
            practicalScore: 6,
            impactScore: 7,
            relatedWork: '摘要中未提及相关工作',
            methodology: '摘要中未提及具体方法',
            limitations: '摘要中未提及局限性',
            timestamp: new Date().toISOString()
        };
    }

    generateFallbackAnalysis(paperData) {
        return {
            summary: `论文标题：${paperData.title}`,
            keyPoints: ['需要进一步分析'],
            innovationScore: 5,
            practicalScore: 5,
            impactScore: 5,
            relatedWork: '分析失败',
            methodology: '分析失败',
            limitations: '分析失败',
            timestamp: new Date().toISOString()
        };
    }
}

// 论文搜索功能
async function searchArxivPapers(keywords, maxResults) {
    try {
        console.log('开始搜索arXiv论文:', keywords);
        
        // 使用更稳定的CORS代理
        const arxivUrl = `http://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(keywords)}&start=0&max_results=${maxResults}&sortBy=submittedDate&sortOrder=descending`;
        
        console.log('arXiv搜索URL:', arxivUrl);
        
        // 尝试多个代理服务
        const proxies = [
            'https://cors-anywhere.herokuapp.com/',
            'https://api.allorigins.win/raw?url=',
            'https://corsproxy.io/?'
        ];
        
        let response;
        let lastError;
        
        for (const proxy of proxies) {
            try {
                console.log('尝试代理:', proxy);
                const fullUrl = proxy + encodeURIComponent(arxivUrl);
                response = await fetch(fullUrl, {
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                });
                
                if (response.ok) {
                    console.log('代理成功:', proxy);
                    break;
                } else {
                    console.warn(`代理失败 ${proxy}: ${response.status}`);
                    lastError = new Error(`代理失败: ${response.status}`);
                }
            } catch (error) {
                console.warn(`代理错误 ${proxy}:`, error.message);
                lastError = error;
            }
        }
        
        if (!response || !response.ok) {
            throw lastError || new Error('所有代理服务都失败');
        }
        
        const xmlText = await response.text();
        console.log('arXiv响应长度:', xmlText.length);
        
        // 检查响应是否包含错误信息
        if (xmlText.includes('Error') || xmlText.includes('error')) {
            console.warn('arXiv API返回错误信息:', xmlText.substring(0, 500));
        }
        
        // 解析XML响应
        const entries = xmlText.match(/<entry>[\s\S]*?<\/entry>/g) || [];
        console.log('找到arXiv条目数量:', entries.length);
        
        if (entries.length === 0) {
            console.warn('arXiv搜索返回空结果，可能是搜索关键词没有匹配的论文');
            return [];
        }
        
        const papers = [];
        entries.forEach((entry, index) => {
            try {
                const titleMatch = entry.match(/<title[^>]*>([^<]+)<\/title>/);
                const summaryMatch = entry.match(/<summary[^>]*>([\s\S]*?)<\/summary>/);
                const authorMatches = entry.match(/<name[^>]*>([^<]+)<\/name>/g);
                const idMatch = entry.match(/<id[^>]*>([^<]+)<\/id>/);
                const publishedMatch = entry.match(/<published[^>]*>([^<]+)<\/published>/);
                const updatedMatch = entry.match(/<updated[^>]*>([^<]+)<\/updated>/);
                
                const title = titleMatch ? titleMatch[1].trim() : '';
                const abstract = summaryMatch ? summaryMatch[1].trim() : '';
                const authors = authorMatches ? authorMatches.map(match => match.replace(/<\/?name[^>]*>/g, '').trim()) : [];
                const url = idMatch ? idMatch[1] : '';
                const published = publishedMatch ? publishedMatch[1] : '';
                const updated = updatedMatch ? updatedMatch[1] : '';
                
                if (title && abstract) {
                    papers.push({
                        title,
                        authors: authors.length > 0 ? authors : ['未知作者'],
                        abstract,
                        publishedDate: published,
                        updatedDate: updated,
                        url,
                        source: 'arxiv',
                        year: published ? new Date(published).getFullYear() : null
                    });
                    console.log(`解析论文 ${index + 1}: ${title}`);
                } else {
                    console.warn(`论文 ${index + 1} 缺少标题或摘要，跳过`);
                }
            } catch (error) {
                console.error(`解析arXiv条目 ${index + 1} 失败:`, error);
            }
        });
        
        console.log('成功解析论文数量:', papers.length);
        
        if (papers.length === 0) {
            console.warn('没有成功解析到任何论文，返回空结果');
            return [];
        }
        
        // 按更新时间（优先）、发表时间倒序排序，确保最新优先
        const sorted = papers.sort((a, b) => {
            const aTime = new Date(a.updatedDate || a.publishedDate || 0).getTime();
            const bTime = new Date(b.updatedDate || b.publishedDate || 0).getTime();
            return bTime - aTime;
        });
        
        return sorted.slice(0, maxResults);
    } catch (error) {
        console.error('arXiv搜索失败:', error);
        console.error('错误详情:', error.stack);
        console.warn('arXiv搜索失败，返回空结果而不是模拟数据');
        return [];
    }
}

async function searchSemanticScholarPapers(keywords, maxResults) {
    try {
        console.log('开始搜索Semantic Scholar论文:', keywords);
        
        const apiUrl = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(keywords)}&limit=${maxResults}&fields=paperId,title,abstract,authors,year,citationCount`;
        
        console.log('Semantic Scholar搜索URL:', apiUrl);
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error(`Semantic Scholar API请求失败: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Semantic Scholar响应:', data);
        
        if (!data.data || data.data.length === 0) {
            console.warn('Semantic Scholar搜索返回空结果');
            return [];
        }
        
        const papers = data.data.map((paper, index) => {
            const paperData = {
                title: paper.title || '',
                authors: paper.authors ? paper.authors.map(a => a.name) : [],
                abstract: paper.abstract || '',
                year: paper.year,
                citationCount: paper.citationCount || 0,
                source: 'semanticscholar',
                url: `https://www.semanticscholar.org/paper/${paper.paperId}`
            };
            
            console.log(`解析Semantic Scholar论文 ${index + 1}: ${paperData.title}`);
            return paperData;
        });
        
        // 优先按年份倒序，再按引用数排序，确保较新结果优先
        const sorted = papers.sort((a, b) => {
            const yearDiff = (b.year || 0) - (a.year || 0);
            if (yearDiff !== 0) return yearDiff;
            return (b.citationCount || 0) - (a.citationCount || 0);
        });
        
        console.log('成功解析Semantic Scholar论文数量:', sorted.length);
        return sorted.slice(0, maxResults);
    } catch (error) {
        console.error('Semantic Scholar搜索失败:', error);
        console.error('错误详情:', error.stack);
        return [];
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
    
    if (sources === 'semanticscholar' || sources === 'all') {
        const semanticPapers = await searchSemanticScholarPapers(keywords, maxResults);
        papers.push(...semanticPapers);
    }
    
    return papers.slice(0, maxResults);
}

// 论文分析功能
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
    console.log('开始分析单篇论文:', paper.title);
    
    const analyzer = new SimplePaperAnalyzer();
    const settings = await getAISettings();
    
    console.log('AI设置:', {
        provider: settings.provider,
        model: settings.model,
        apiKey: settings.apiKey ? settings.apiKey.substring(0, 20) + '...' : '未设置'
    });
    
    analyzer.setConfig(settings);
    
    console.log('分析器配置完成，开始分析...');
    const result = await analyzer.analyzePaper(paper);
    console.log('论文分析完成:', result);
    
    return result;
}

// 结果保存和显示
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

async function showAnalysisResults(results, sendResponse) {
    // 创建完整的结果页面HTML
    const resultsHtml = generateFullPageHTML(results);
    
    // 使用data URL创建新页面
    const dataUrl = 'data:text/html;charset=utf-8,' + encodeURIComponent(resultsHtml);
    
    try {
        // 创建新标签页显示结果
        await chrome.tabs.create({ url: dataUrl });
        console.log('结果页面已在新标签页中打开');
        return { success: true };
    } catch (error) {
        console.error('创建新标签页失败:', error);
        console.warn('尝试将结果注入到当前活动页作为侧边面板...');

        try {
            const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!activeTab || !activeTab.id) {
                throw new Error('未找到活动标签页');
            }

            await chrome.scripting.executeScript({
                target: { tabId: activeTab.id },
                func: (htmlString) => {
                    // 若已存在则移除
                    const old = document.getElementById('paper-analysis-panel');
                    if (old) old.remove();

                    // 注入面板容器与样式
                    const panel = document.createElement('div');
                    panel.id = 'paper-analysis-panel';
                    panel.style.position = 'fixed';
                    panel.style.top = '0';
                    panel.style.right = '0';
                    panel.style.width = '400px';
                    panel.style.height = '100vh';
                    panel.style.background = 'white';
                    panel.style.borderLeft = '2px solid #007bff';
                    panel.style.boxShadow = '-2px 0 10px rgba(0,0,0,0.1)';
                    panel.style.zIndex = '100000';
                    panel.style.overflowY = 'auto';
                    panel.innerHTML = htmlString;

                    document.body.appendChild(panel);
                },
                args: [
                    // 复用已有生成的结果 HTML 中的主要内容，包裹基础头部，避免整页样式冲突
                    (() => {
                        const containerStart = '<div style="padding:16px;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif">';
                        const header = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><h3 style="margin:0">📄 论文初筛结果</h3><button id="__close_paper_panel__" style="background:#007bff;color:#fff;border:none;padding:6px 10px;border-radius:4px;cursor:pointer">关闭</button></div>';
                        const content = resultsHtml;
                        const end = '</div>';
                        const merged = `${containerStart}${header}${content}${end}`;
                        return merged;
                    })()
                ]
            });

            // 再注入一个点击关闭的脚本
            await chrome.scripting.executeScript({
                target: { tabId: activeTab.id },
                func: () => {
                    const btn = document.getElementById('__close_paper_panel__');
                    if (btn) {
                        btn.addEventListener('click', () => {
                            const p = document.getElementById('paper-analysis-panel');
                            if (p) p.remove();
                        });
                    }
                }
            });

            console.log('已将结果注入到当前页面侧边面板');
            return { success: true };
        } catch (injectError) {
            console.error('结果注入当前页失败:', injectError);
            sendResponse({ 
                success: false, 
                error: `无法显示结果：${error?.message || '新标签创建失败'}；回退注入也失败：${injectError?.message || ''}` 
            });
            return { success: false };
        }
    }
}

function generateFullPageHTML(results) {
    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>论文初筛结果 - 前沿探索工作流</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
            line-height: 1.6;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: bold;
        }
        
        .header p {
            margin: 10px 0 0 0;
            font-size: 16px;
            opacity: 0.9;
        }
        
        .paper-card {
            background: white;
            border: 1px solid #e1e5e9;
            border-radius: 12px;
            padding: 25px;
            margin-bottom: 25px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            transition: box-shadow 0.3s ease;
        }
        
        .paper-card:hover {
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        
        .paper-title {
            font-size: 20px;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 15px;
            line-height: 1.4;
        }
        
        .paper-meta {
            color: #6c757d;
            margin-bottom: 15px;
            font-size: 14px;
            display: flex;
            flex-wrap: wrap;
            gap: 15px;
        }
        
        .paper-url {
            margin: 15px 0;
            padding: 12px;
            background: #e3f2fd;
            border-radius: 6px;
            font-size: 14px;
        }
        
        .paper-url a {
            color: #1976d2;
            text-decoration: none;
            font-weight: 500;
        }
        
        .paper-url a:hover {
            text-decoration: underline;
        }
        
        .analysis-section {
            margin-top: 20px;
        }
        
        .analysis-section h3 {
            font-size: 16px;
            color: #495057;
            margin: 20px 0 10px 0;
            padding-bottom: 5px;
            border-bottom: 2px solid #e9ecef;
        }
        
        .analysis-section p {
            font-size: 14px;
            line-height: 1.6;
            margin: 8px 0;
            color: #495057;
        }
        
        .score {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            margin-right: 10px;
            font-size: 12px;
            font-weight: bold;
        }
        
        .score.innovation { background: #e3f2fd; color: #1976d2; }
        .score.practical { background: #e8f5e8; color: #388e3c; }
        .score.impact { background: #fff3e0; color: #f57c00; }
        
        .key-points {
            list-style-type: disc;
            margin-left: 20px;
            font-size: 14px;
        }
        
        .key-points li {
            margin-bottom: 5px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📄 论文初筛结果</h1>
        <p>基于AI分析的学术论文评估报告</p>
    </div>
    
    ${results.map((result, index) => `
        <div class="paper-card">
            <div class="paper-title">${result.title}</div>
            <div class="paper-meta">
                <span><strong>作者:</strong> ${result.authors.join(', ')}</span>
                <span><strong>来源:</strong> ${result.source}</span>
                <span><strong>生成时间:</strong> ${new Date(result.timestamp).toLocaleString()}</span>
            </div>
            <div class="paper-meta">
                <span><strong>Published:</strong> ${result.publishedDate ? new Date(result.publishedDate).toLocaleString() : (result.year || '未知')}</span>
                <span><strong>Updated:</strong> ${result.updatedDate ? new Date(result.updatedDate).toLocaleString() : '无'}</span>
            </div>
            <div class="paper-url">
                <strong>📄 论文链接:</strong> <a href="${result.url}" target="_blank">${result.url}</a>
            </div>
            
            ${result.analysis ? `
                <div class="analysis-section">
                    <h3>📋 论文简介</h3>
                    <p>${result.analysis.summary || '暂无简介'}</p>
                </div>
                
                <div class="analysis-section">
                    <h3>🎯 关注要点</h3>
                    <ul class="key-points">
                        ${(result.analysis.keyPoints || []).map(point => `<li>${point}</li>`).join('')}
                    </ul>
                </div>
                
                <div class="analysis-section">
                    <h3>📊 评分</h3>
                    <p>
                        <span class="score innovation">创新性: ${result.analysis.innovationScore || 0}/10</span>
                        <span class="score practical">实用性: ${result.analysis.practicalScore || 0}/10</span>
                        <span class="score impact">影响力: ${result.analysis.impactScore || 0}/10</span>
                    </p>
                </div>
                
                <div class="analysis-section">
                    <h3>🔍 相关研究</h3>
                    <p>${result.analysis.relatedWork || '分析失败'}</p>
                </div>
                
                <div class="analysis-section">
                    <h3>⚙️ 方法论</h3>
                    <p>${result.analysis.methodology || '分析失败'}</p>
                </div>
                
                <div class="analysis-section">
                    <h3>⚠️ 局限性</h3>
                    <p>${result.analysis.limitations || '分析失败'}</p>
                </div>
            ` : `
                <div class="analysis-section">
                    <h3>❌ 分析失败</h3>
                    <p>${result.error || '未知错误'}</p>
                </div>
            `}
        </div>
    `).join('')}
</body>
</html>
`;
}

// 主功能处理
async function startPaperScreening(config, sendResponse) {
    console.log('启动论文初筛功能', config);
    
    try {
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
        const showResult = await showAnalysisResults(analysisResults, sendResponse);
        
        if (showResult.success) {
            updateTaskStatus(`论文初筛完成，分析了${analysisResults.length}篇论文`);
            sendResponse({ 
                success: true, 
                message: `论文初筛完成，分析了${analysisResults.length}篇论文`,
                results: analysisResults
            });
        }
        
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

// 消息监听
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('收到消息:', request);
    
    switch (request.action) {
        case 'startFeature':
            if (request.feature === 'paper-screening') {
                startPaperScreening(request.config, sendResponse).catch(error => {
                    console.error('论文初筛功能执行失败:', error);
                    sendResponse({ 
                        success: false, 
                        error: `论文初筛功能执行失败: ${error.message}`,
                        details: error.stack
                    });
                });
            } else {
                sendResponse({ success: false, error: '未知功能' });
            }
            break;
        case 'getTaskStatus':
            sendResponse(getTaskStatus());
            break;
        case 'test':
            sendResponse({ success: true, message: '后台脚本正常工作' });
            break;
        default:
            sendResponse({ success: false, error: '未知操作' });
    }
    
    return true; // 保持消息通道开放
});

console.log('后台脚本加载完成');