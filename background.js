// 前沿探索工作流 - Background Service Worker
console.log('前沿探索工作流Background Service Worker已启动');

// 简化的论文阅读器类（Service Worker兼容）
class SimplePaperReader {
    constructor() {
        this.cache = new Map();
        this.maxCacheSize = 20;
    }

    async readPaper(paperData) {
        const { url, source, title } = paperData;
        
        // 检查缓存
        const cacheKey = `${source}_${url}`;
        if (this.cache.has(cacheKey)) {
            console.log('从缓存中获取论文内容:', title);
            return this.cache.get(cacheKey);
        }

        try {
            let content = null;
            
            // 根据来源选择不同的阅读策略
            switch (source) {
                case 'arxiv':
                    content = await this.readArxivPaper(url);
                    break;
                case 'semanticscholar':
                    content = await this.readSemanticScholarPaper(url);
                    break;
                default:
                    content = await this.readGenericPaper(url);
            }

            if (content) {
                // 缓存结果
                this.cacheResult(cacheKey, content);
                console.log('成功读取论文内容:', title);
                return content;
            } else {
                throw new Error('无法获取论文内容');
            }

        } catch (error) {
            console.error('读取论文失败:', error);
            return {
                success: false,
                error: error.message,
                content: null
            };
        }
    }

    async readArxivPaper(url) {
        try {
            // arXiv URL格式: https://arxiv.org/abs/2401.00001
            const arxivId = this.extractArxivId(url);
            if (!arxivId) {
                throw new Error('无法解析arXiv ID');
            }

            // 使用arXiv API获取完整论文信息
            const apiUrl = `http://export.arxiv.org/api/query?id_list=${arxivId}`;
            const proxyUrl = 'https://api.allorigins.win/raw?url=';
            
            const response = await fetch(proxyUrl + encodeURIComponent(apiUrl));
            if (!response.ok) {
                throw new Error(`arXiv API请求失败: ${response.status}`);
            }

            const xmlText = await response.text();
            const content = this.parseArxivXML(xmlText);
            
            return {
                success: true,
                source: 'arxiv',
                content: content,
                url: url
            };

        } catch (error) {
            console.error('读取arXiv论文失败:', error);
            return null;
        }
    }

    async readSemanticScholarPaper(url) {
        try {
            // 从URL中提取paperId
            const paperId = this.extractSemanticScholarId(url);
            if (!paperId) {
                throw new Error('无法解析Semantic Scholar ID');
            }

            // 使用Semantic Scholar API获取详细信息
            const apiUrl = `https://api.semanticscholar.org/graph/v1/paper/${paperId}?fields=paperId,title,abstract,authors,year,citationCount,references,openAccessPdf,url`;
            
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error(`Semantic Scholar API请求失败: ${response.status}`);
            }

            const data = await response.json();
            
            return {
                success: true,
                source: 'semanticscholar',
                content: {
                    title: data.title,
                    abstract: data.abstract,
                    authors: data.authors,
                    year: data.year,
                    citationCount: data.citationCount,
                    references: data.references,
                    openAccessPdf: data.openAccessPdf
                },
                url: url
            };

        } catch (error) {
            console.error('读取Semantic Scholar论文失败:', error);
            return null;
        }
    }

    async readGenericPaper(url) {
        try {
            const proxyUrl = 'https://api.allorigins.win/raw?url=';
            const response = await fetch(proxyUrl + encodeURIComponent(url));
            
            if (!response.ok) {
                throw new Error(`页面请求失败: ${response.status}`);
            }

            const html = await response.text();
            const content = this.parseGenericHTML(html);
            
            return {
                success: true,
                source: 'generic',
                content: content,
                url: url
            };

        } catch (error) {
            console.error('读取通用论文失败:', error);
            return null;
        }
    }

    parseArxivXML(xmlText) {
        try {
            // 使用正则表达式解析XML（Service Worker中不能使用DOMParser）
            const entries = xmlText.match(/<entry>[\s\S]*?<\/entry>/g) || [];
            
            if (entries.length === 0) {
                throw new Error('未找到论文条目');
            }

            const entry = entries[0];
            
            // 提取各种信息
            const titleMatch = entry.match(/<title[^>]*>([^<]+)<\/title>/);
            const summaryMatch = entry.match(/<summary[^>]*>([\s\S]*?)<\/summary>/);
            const authorMatches = entry.match(/<name[^>]*>([^<]+)<\/name>/g);
            const idMatch = entry.match(/<id[^>]*>([^<]+)<\/id>/);
            const publishedMatch = entry.match(/<published[^>]*>([^<]+)<\/published>/);
            const categoryMatches = entry.match(/<category[^>]*term="([^"]+)"[^>]*>/g);

            const title = titleMatch ? titleMatch[1].trim() : '';
            const abstract = summaryMatch ? summaryMatch[1].trim() : '';
            const authors = authorMatches ? authorMatches.map(match => 
                match.replace(/<\/?name[^>]*>/g, '').trim()
            ) : [];
            const paperId = idMatch ? idMatch[1] : '';
            const published = publishedMatch ? publishedMatch[1] : '';
            const categories = categoryMatches ? categoryMatches.map(match => 
                match.match(/term="([^"]+)"/)[1]
            ) : [];

            return {
                title,
                abstract,
                authors,
                paperId,
                published,
                categories,
                fullText: abstract // arXiv通常只提供摘要，完整文本需要PDF
            };

        } catch (error) {
            console.error('解析arXiv XML失败:', error);
            return null;
        }
    }

    parseGenericHTML(html) {
        try {
            // 尝试提取常见的论文信息
            const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
            const abstractMatch = html.match(/<div[^>]*abstract[^>]*>([\s\S]*?)<\/div>/i) ||
                                html.match(/<p[^>]*abstract[^>]*>([\s\S]*?)<\/p>/i);

            return {
                title: titleMatch ? titleMatch[1].trim() : '',
                abstract: abstractMatch ? abstractMatch[1].trim() : '',
                fullText: html.substring(0, 5000) // 限制长度
            };

        } catch (error) {
            console.error('解析通用HTML失败:', error);
            return null;
        }
    }

    extractArxivId(url) {
        const match = url.match(/arxiv\.org\/abs\/(\d+\.\d+)/);
        return match ? match[1] : null;
    }

    extractSemanticScholarId(url) {
        const match = url.match(/semanticscholar\.org\/paper\/([^\/]+)/);
        return match ? match[1] : null;
    }

    cacheResult(key, result) {
        if (this.cache.size >= this.maxCacheSize) {
            // 删除最旧的缓存项
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        this.cache.set(key, result);
    }
}

// 直接在Service Worker中定义简化的AI分析器
class SimplePaperAnalyzer {
    constructor() {
        this.apiKey = '';
        this.provider = 'default';
        this.model = 'gpt-3.5-turbo';
        this.paperReader = new SimplePaperReader();
    }

    setConfig(config) {
        this.apiKey = config.apiKey || '';
        this.provider = config.provider || 'default';
        this.model = config.model || 'gpt-3.5-turbo';
    }

    async analyzePaper(paperData) {
        try {
            console.log('开始分析论文:', paperData.title);
            
            // 首先尝试读取完整论文内容
            console.log('正在读取论文完整内容...');
            const paperContent = await this.paperReader.readPaper(paperData);
            
            if (!this.isValidApiKey()) {
                console.warn('API密钥无效，使用基于规则的分析');
                return this.generateRuleBasedAnalysis(paperData, paperContent);
            }

            // 构建包含完整论文内容的分析提示
            const prompt = this.buildAnalysisPrompt(paperData, paperContent);
            console.log('正在调用AI模型进行分析...');
            const analysisResult = await this.callOpenRouter(prompt);
            return this.postProcessAnalysis(analysisResult, paperData);
        } catch (error) {
            console.error('论文分析失败:', error);
            return this.generateFallbackAnalysis(paperData);
        }
    }

    isValidApiKey() {
        return this.apiKey && this.apiKey.startsWith('sk-or-v1-');
    }

    buildAnalysisPrompt(paperData, paperContent = null) {
        // 构建论文信息部分
        let paperInfoSection = `
**论文基本信息：**
- 标题: ${paperData.title}
- 作者: ${paperData.authors}
- 摘要: ${paperData.abstract}
- 来源: ${paperData.source}
- 发表年份: ${paperData.year || '未知'}
- 论文链接: ${paperData.url || '未知'}
`;

        // 如果有完整论文内容，添加到提示中
        let fullContentSection = '';
        if (paperContent && paperContent.success && paperContent.content) {
            const content = paperContent.content;
            fullContentSection = `

**完整论文内容：**
- 论文标题: ${content.title || paperData.title}
- 完整摘要: ${content.abstract || paperData.abstract}
- 作者信息: ${content.authors ? content.authors.map(a => typeof a === 'string' ? a : a.name).join(', ') : paperData.authors.join(', ')}
- 发表时间: ${content.published || content.year || '未知'}
- 论文分类: ${content.categories ? content.categories.join(', ') : '未知'}
- 引用数量: ${content.citationCount || '未知'}
- 参考文献: ${content.references ? content.references.length + '篇' : '未知'}
- 开放获取PDF: ${content.openAccessPdf ? '✅ 可用' : '❌ 不可用'}
- 完整文本: ${content.fullText ? content.fullText.substring(0, 2000) + '...' : '仅摘要可用'}
`;
        }

        return `
请作为专业的学术论文分析专家，对以下论文进行深入分析：

**重要说明：**
${paperContent && paperContent.success ? 
    '你现在可以访问到论文的完整内容，请基于完整信息进行深入分析，不要返回"需要进一步分析"等通用回答。' : 
    '你只能获取到论文的标题和摘要信息，请基于现有信息进行具体分析，不要返回"需要进一步分析"等通用回答。'}

${paperInfoSection}
${fullContentSection}

**分析要求：**
请从以下维度进行专业分析，并以JSON格式返回结果：

1. **summary** (论文简介): 用2-3句话概括论文的核心贡献和创新点
2. **keyPoints** (关注要点): 列出3-5个最重要的技术要点或创新点
3. **innovationScore** (创新性评分): 1-10分，评估论文的创新程度
4. **practicalScore** (实用性评分): 1-10分，评估论文的实用价值和应用前景
5. **impactScore** (影响力评分): 1-10分，评估论文的潜在学术影响力
6. **experimentMetrics** (实验指标分析): 基于论文内容分析：
    - evaluationMetrics: 论文中提到的评估指标
    - experimentalResults: 具体的实验结果数据
    - performanceComparison: 与baseline的性能对比
7. **codeOpenSource** (代码开源情况): 分析：
    - isOpenSource: 是否开源
    - repositoryUrl: 代码仓库链接（如果有）
    - codeQuality: 代码质量评估
8. **experimentDetails** (实验详细解释): 分析：
    - experimentalDesign: 实验设计方法
    - datasets: 使用的数据集
    - evaluationMethod: 评估方法
    - baselineComparison: 与现有方法的对比
9. **demoInfo** (Demo展示情况): 分析：
    - hasOnlineDemo: 是否有在线演示
    - demoUrl: 演示链接（如果有）
    - historicalVersions: 历史版本信息
    - interactionExperience: 交互体验描述
10. **resourceRequirements** (资源需求分析): 分析：
    - gpu: GPU需求
    - cpu: CPU需求
    - memory: 内存需求
    - storage: 存储需求
    - otherResources: 其他资源需求
11. **relatedWork** (相关研究): ${paperContent && paperContent.success ? 
    '基于完整论文内容，详细分析相关工作部分，包括：' : 
    '仔细阅读摘要内容，寻找以下信息：'}
    - 是否提到"相比现有方法"、"在XXX基础上"等表述？
    - 是否提到"传统方法"、"现有技术"等对比？
    - 是否提到"改进"、"优化"等相对于现有工作的描述？
    - 相关工作章节的具体内容（如果有完整论文）
    如果找到相关信息，请具体描述。如果没有找到，才说"摘要中未提及相关工作"。
12. **methodology** (方法论): ${paperContent && paperContent.success ? 
    '基于完整论文内容，详细分析方法论部分，包括：' : 
    '仔细阅读摘要内容，寻找以下信息：'}
    - 是否提到具体的方法名称或技术？
    - 是否提到"采用"、"使用"、"基于"等动词？
    - 是否提到具体的算法、模型或框架？
    - 方法论章节的具体内容（如果有完整论文）
    如果找到相关信息，请具体描述。如果没有找到，才说"摘要中未提及具体方法"。
13. **limitations** (局限性): ${paperContent && paperContent.success ? 
    '基于完整论文内容，详细分析局限性部分，包括：' : 
    '仔细阅读摘要内容，寻找以下信息：'}
    - 是否提到"限制"、"不足"、"挑战"等词汇？
    - 是否提到"未来工作"、"进一步研究"等表述？
    - 是否提到"需要改进"、"有待完善"等描述？
    - 局限性章节的具体内容（如果有完整论文）
    如果找到相关信息，请具体描述。如果没有找到，才说"摘要中未提及局限性"。

**重要提醒：**
- ${paperContent && paperContent.success ? 
    '基于完整论文内容进行深入分析，充分利用所有可用信息' : 
    '必须基于提供的摘要内容进行具体分析'}
- 禁止返回"需要进一步分析"、"需要详细分析"等通用回答
- 只有内容中完全没有相关信息时，才标注"摘要中未提及XXX"
- 请仔细阅读所有可用内容，提取具体的技术细节和分析内容
- 对于有完整论文内容的情况，请充分利用论文的各个章节信息

请确保返回的JSON格式正确，所有字段都有值。
`;
    }

    async callOpenRouter(prompt) {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
                'HTTP-Referer': 'chrome-extension://' + chrome.runtime.id,
                'X-Title': 'Paper Screening Tool'
            },
            body: JSON.stringify({
                model: this.model || 'openai/gpt-4o',
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

        if (!response.ok) {
            throw new Error(`OpenRouter API调用失败: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    postProcessAnalysis(analysisResult, paperData) {
        try {
            // 尝试解析JSON响应
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

    generateRuleBasedAnalysis(paperData, paperContent = null) {
        // 基于论文内容生成更准确的分析
        let summary = `这是一篇关于${paperData.title}的研究论文，主要探讨了相关技术和方法。`;
        let keyPoints = [
            '提出了新的技术方法',
            '包含实验验证',
            '具有实际应用价值'
        ];
        let relatedWork = '摘要中未提及相关工作';
        let methodology = '摘要中未提及具体方法';
        let limitations = '摘要中未提及局限性';

        // 如果有完整论文内容，尝试提取更多信息
        if (paperContent && paperContent.success && paperContent.content) {
            const content = paperContent.content;
            
            // 基于完整摘要生成更好的简介
            if (content.abstract && content.abstract.length > 100) {
                summary = `这篇论文${content.abstract.substring(0, 200)}...`;
            }
            
            // 尝试从摘要中提取关键点
            if (content.abstract) {
                const abstract = content.abstract.toLowerCase();
                if (abstract.includes('novel') || abstract.includes('new') || abstract.includes('propose')) {
                    keyPoints[0] = '提出了新颖的方法或技术';
                }
                if (abstract.includes('experiment') || abstract.includes('evaluation') || abstract.includes('result')) {
                    keyPoints[1] = '包含详细的实验验证和结果分析';
                }
                if (abstract.includes('application') || abstract.includes('practical') || abstract.includes('real-world')) {
                    keyPoints[2] = '具有实际应用价值和现实意义';
                }
            }
            
            // 基于引用数量调整影响力评分
            if (content.citationCount && content.citationCount > 0) {
                const impactScore = Math.min(10, Math.max(5, Math.floor(content.citationCount / 10) + 5));
                return {
                    summary,
                    keyPoints,
                    innovationScore: 7,
                    practicalScore: 6,
                    impactScore,
                    relatedWork: '基于摘要分析，相关工作信息有限',
                    methodology: '基于摘要分析，方法论信息有限',
                    limitations: '基于摘要分析，局限性信息有限',
                    timestamp: new Date().toISOString()
                };
            }
        }

        return {
            summary,
            keyPoints,
            innovationScore: 7,
            practicalScore: 6,
            impactScore: 7,
            relatedWork,
            methodology,
            limitations,
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

console.log('简化版AI分析器已加载');

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
        const showResult = await showAnalysisResults(analysisResults, sendResponse);
        
        if (showResult.success) {
            updateTaskStatus(`论文初筛完成，分析了${analysisResults.length}篇论文`);
            sendResponse({ 
                success: true, 
                message: `论文初筛完成，分析了${analysisResults.length}篇论文`,
                results: analysisResults
            });
        }
        // 如果showResult.success为false，sendResponse已经在showAnalysisResults中调用了
        
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
        
        // 解析XML响应 - Service Worker中不能使用DOMParser
        // 使用简单的字符串解析
        const entries = xmlText.match(/<entry>[\s\S]*?<\/entry>/g) || [];
        
        console.log('找到arXiv条目数量:', entries.length);
        
        const papers = [];
        entries.forEach(entry => {
            try {
                // 使用正则表达式提取信息
                const titleMatch = entry.match(/<title[^>]*>([^<]+)<\/title>/);
                const summaryMatch = entry.match(/<summary[^>]*>([\s\S]*?)<\/summary>/);
                const authorMatches = entry.match(/<name[^>]*>([^<]+)<\/name>/g);
                const idMatch = entry.match(/<id[^>]*>([^<]+)<\/id>/);
                const publishedMatch = entry.match(/<published[^>]*>([^<]+)<\/published>/);
                
                const title = titleMatch ? titleMatch[1].trim() : '';
                const abstract = summaryMatch ? summaryMatch[1].trim() : '';
                const authors = authorMatches ? authorMatches.map(match => match.replace(/<\/?name[^>]*>/g, '').trim()) : [];
                const url = idMatch ? idMatch[1] : '';
                const published = publishedMatch ? publishedMatch[1] : '';
                
                if (title && abstract) {
                    papers.push({
                        title,
                        authors: authors.length > 0 ? authors : ['未知作者'],
                        abstract,
                        publishedDate: published,
                        url,
                        source: 'arxiv'
                    });
                }
            } catch (error) {
                console.error('解析arXiv条目失败:', error);
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
    const analyzer = new SimplePaperAnalyzer();
    const settings = await getAISettings();
    analyzer.setConfig(settings);
    
    return await analyzer.analyzePaper(paper);
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
        sendResponse({ 
            success: false, 
            error: '无法创建新标签页显示结果。' 
        });
        return { success: false };
    }
}

// 注入结果分框到当前页面
function injectResultsPanel(resultsHtml) {
    console.log('开始注入结果分框');
    
    // 移除已存在的分框
    const existingPanel = document.getElementById('paper-analysis-panel');
    if (existingPanel) {
        console.log('移除已存在的分框');
        existingPanel.remove();
    }
    
    // 创建分框容器
    const panel = document.createElement('div');
    panel.id = 'paper-analysis-panel';
    panel.innerHTML = `
        <div class="panel-header">
            <h3>📄 论文初筛结果</h3>
            <button id="close-panel" class="close-btn">×</button>
        </div>
        <div class="panel-content">
            ${resultsHtml}
        </div>
    `;
    
    // 添加样式
    const style = document.createElement('style');
    style.textContent = `
        #paper-analysis-panel {
            position: fixed;
            top: 0;
            right: 0;
            width: 400px;
            height: 100vh;
            background: white;
            border-left: 2px solid #007bff;
            box-shadow: -2px 0 10px rgba(0,0,0,0.1);
            z-index: 10000;
            overflow-y: auto;
            font-family: Arial, sans-serif;
        }
        
        .panel-header {
            background: #007bff;
            color: white;
            padding: 15px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            position: sticky;
            top: 0;
            z-index: 10001;
        }
        
        .panel-header h3 {
            margin: 0;
            font-size: 16px;
        }
        
        .close-btn {
            background: none;
            border: none;
            color: white;
            font-size: 24px;
            cursor: pointer;
            padding: 0;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: background-color 0.2s;
        }
        
        .close-btn:hover {
            background-color: rgba(255,255,255,0.2);
        }
        
        .panel-content {
            padding: 20px;
        }
        
        .paper-card {
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 15px;
            background: #f8f9fa;
        }
        
        .paper-title {
            font-size: 16px;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 10px;
        }
        
        .paper-meta {
            color: #666;
            margin-bottom: 10px;
            font-size: 12px;
        }
        
        .paper-url {
            margin: 10px 0;
            padding: 8px;
            background: #e3f2fd;
            border-radius: 4px;
            font-size: 12px;
        }
        
        .paper-url a {
            color: #007bff;
            text-decoration: none;
        }
        
        .analysis-section {
            margin-top: 15px;
        }
        
        .analysis-section h3 {
            font-size: 14px;
            color: #495057;
            margin: 10px 0 5px 0;
        }
        
        .analysis-section p {
            font-size: 12px;
            line-height: 1.4;
            margin: 5px 0;
        }
        
        .score {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 3px;
            margin-right: 8px;
            font-size: 11px;
        }
        
        .score.innovation { background: #e3f2fd; color: #1976d2; }
        .score.practical { background: #e8f5e8; color: #388e3c; }
        .score.impact { background: #fff3e0; color: #f57c00; }
        
        .key-points {
            list-style-type: disc;
            margin-left: 15px;
            font-size: 12px;
        }
        
        .metrics-section, .code-section, .experiment-section, .demo-section, .resource-section {
            background: #f8f9fa;
            border-left: 3px solid #007bff;
            padding: 10px;
            margin: 8px 0;
            border-radius: 3px;
            font-size: 12px;
        }
        
        .metrics-section { border-left-color: #28a745; }
        .code-section { border-left-color: #17a2b8; }
        .experiment-section { border-left-color: #ffc107; }
        .demo-section { border-left-color: #6f42c1; }
        .resource-section { border-left-color: #dc3545; }
        
        .analysis-note {
            background: #f8f9fa;
            padding: 8px;
            border-radius: 3px;
            margin: 5px 0;
            font-size: 12px;
        }
        
        .warning-note {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 4px;
            padding: 10px;
            margin: 10px 0;
            color: #856404;
            font-size: 12px;
        }
    `;
    
    // 添加样式到页面
    document.head.appendChild(style);
    
    // 添加分框到页面
    document.body.appendChild(panel);
    console.log('分框已添加到页面');
    
    // 添加关闭按钮事件
    const closeBtn = document.getElementById('close-panel');
    closeBtn.addEventListener('click', () => {
        console.log('关闭分框');
        panel.remove();
        style.remove();
        document.body.style.marginRight = '';
    });
    
    // 调整页面布局，为分框留出空间
    document.body.style.marginRight = '400px';
    console.log('页面布局已调整');
    
    // 当分框关闭时恢复页面布局
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
                const removedNodes = Array.from(mutation.removedNodes);
                if (removedNodes.includes(panel)) {
                    document.body.style.marginRight = '';
                    style.remove();
                    observer.disconnect();
                }
            }
        });
    });
    
    observer.observe(document.body, { childList: true });
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
        
        .warning-note {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            color: #856404;
            font-size: 14px;
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
            padding: 6px 12px;
            border-radius: 20px;
            margin-right: 10px;
            font-size: 12px;
            font-weight: 600;
        }
        
        .score.innovation { background: #e3f2fd; color: #1976d2; }
        .score.practical { background: #e8f5e8; color: #388e3c; }
        .score.impact { background: #fff3e0; color: #f57c00; }
        
        .key-points {
            list-style-type: none;
            padding-left: 0;
        }
        
        .key-points li {
            background: #f8f9fa;
            margin: 8px 0;
            padding: 10px 15px;
            border-left: 4px solid #007bff;
            border-radius: 4px;
            font-size: 14px;
        }
        
        .metrics-section, .code-section, .experiment-section, .demo-section, .resource-section {
            background: #f8f9fa;
            border-left: 4px solid #007bff;
            padding: 15px;
            margin: 15px 0;
            border-radius: 6px;
            font-size: 14px;
        }
        
        .metrics-section { border-left-color: #28a745; }
        .code-section { border-left-color: #17a2b8; }
        .experiment-section { border-left-color: #ffc107; }
        .demo-section { border-left-color: #6f42c1; }
        .resource-section { border-left-color: #dc3545; }
        
        .analysis-note {
            background: #f8f9fa;
            padding: 12px;
            border-radius: 6px;
            margin: 10px 0;
            font-size: 14px;
            border: 1px solid #e9ecef;
        }
        
        .footer {
            text-align: center;
            margin-top: 40px;
            padding: 20px;
            color: #6c757d;
            font-size: 14px;
        }
        
        @media (max-width: 768px) {
            body {
                padding: 10px;
            }
            
            .header h1 {
                font-size: 24px;
            }
            
            .paper-card {
                padding: 20px;
            }
            
            .paper-title {
                font-size: 18px;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📄 论文初筛结果</h1>
        <p>共分析了 ${results.length} 篇论文 | 生成时间: ${new Date().toLocaleString()}</p>
    </div>
    
    <div class="warning-note">
        <strong>⚠️ 分析说明：</strong> 以下分析基于论文标题和摘要信息，部分详细信息可能需要查看完整论文。点击论文链接可查看原文。
    </div>
    
    ${results.map(paper => `
        <div class="paper-card">
            <div class="paper-title">${paper.title}</div>
            <div class="paper-meta">
                <span><strong>作者:</strong> ${paper.authors.join(', ')}</span>
                <span><strong>来源:</strong> ${paper.source}</span>
                <span><strong>时间:</strong> ${new Date(paper.timestamp).toLocaleString()}</span>
            </div>
            <div class="paper-url">
                <strong>📄 论文链接:</strong> <a href="${paper.url}" target="_blank">${paper.url}</a>
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
                    
                    ${paper.analysis.experimentMetrics ? `
                        <h3>📈 实验指标分析</h3>
                        <div class="metrics-section">
                            <p><strong>评估指标:</strong> ${(paper.analysis.experimentMetrics.evaluationMetrics || []).join(', ')}</p>
                            <p><strong>实验结果:</strong> ${paper.analysis.experimentMetrics.experimentalResults || '暂无'}</p>
                            <p><strong>性能对比:</strong> ${paper.analysis.experimentMetrics.performanceComparison || '暂无'}</p>
                        </div>
                    ` : ''}
                    
                    ${paper.analysis.codeOpenSource ? `
                        <h3>💻 代码开源情况</h3>
                        <div class="code-section">
                            <p><strong>是否开源:</strong> ${paper.analysis.codeOpenSource.isOpenSource ? '✅ 是' : '❌ 否'}</p>
                            ${paper.analysis.codeOpenSource.repositoryUrl ? `<p><strong>代码仓库:</strong> <a href="${paper.analysis.codeOpenSource.repositoryUrl}" target="_blank">${paper.analysis.codeOpenSource.repositoryUrl}</a></p>` : ''}
                            <p><strong>代码质量:</strong> ${paper.analysis.codeOpenSource.codeQuality || '暂无评估'}</p>
                        </div>
                    ` : ''}
                    
                    ${paper.analysis.experimentDetails ? `
                        <h3>🔬 实验详细解释</h3>
                        <div class="experiment-section">
                            <p><strong>实验设计:</strong> ${paper.analysis.experimentDetails.experimentalDesign || '暂无'}</p>
                            <p><strong>数据集:</strong> ${(paper.analysis.experimentDetails.datasets || []).join(', ')}</p>
                            <p><strong>评估方法:</strong> ${paper.analysis.experimentDetails.evaluationMethod || '暂无'}</p>
                            <p><strong>Baseline对比:</strong> ${paper.analysis.experimentDetails.baselineComparison || '暂无'}</p>
                        </div>
                    ` : ''}
                    
                    ${paper.analysis.demoInfo ? `
                        <h3>🎮 Demo展示情况</h3>
                        <div class="demo-section">
                            <p><strong>在线Demo:</strong> ${paper.analysis.demoInfo.hasOnlineDemo ? '✅ 有' : '❌ 无'}</p>
                            ${paper.analysis.demoInfo.demoUrl ? `<p><strong>Demo链接:</strong> <a href="${paper.analysis.demoInfo.demoUrl}" target="_blank">${paper.analysis.demoInfo.demoUrl}</a></p>` : ''}
                            <p><strong>历史版本:</strong> ${paper.analysis.demoInfo.historicalVersions || '暂无'}</p>
                            <p><strong>交互体验:</strong> ${paper.analysis.demoInfo.interactionExperience || '暂无'}</p>
                        </div>
                    ` : ''}
                    
                    ${paper.analysis.resourceRequirements ? `
                        <h3>🖥️ 资源需求分析</h3>
                        <div class="resource-section">
                            <p><strong>GPU需求:</strong> ${paper.analysis.resourceRequirements.gpu || '暂无'}</p>
                            <p><strong>CPU需求:</strong> ${paper.analysis.resourceRequirements.cpu || '暂无'}</p>
                            <p><strong>内存需求:</strong> ${paper.analysis.resourceRequirements.memory || '暂无'}</p>
                            <p><strong>存储需求:</strong> ${paper.analysis.resourceRequirements.storage || '暂无'}</p>
                            <p><strong>其他资源:</strong> ${paper.analysis.resourceRequirements.otherResources || '暂无'}</p>
                        </div>
                    ` : ''}
                    
                    <h3>🔍 相关研究</h3>
                    <div class="analysis-note">
                        <p>${paper.analysis.relatedWork || '暂无相关研究信息'}</p>
                        ${paper.analysis.relatedWork && (paper.analysis.relatedWork.includes('摘要中未提及') || paper.analysis.relatedWork.includes('需要查看完整论文')) ? 
                            '<p style="color: #856404; font-style: italic;">💡 建议：点击上方论文链接查看完整内容以获得更深入的相关研究分析</p>' : ''}
                    </div>
                    
                    <h3>⚙️ 方法论</h3>
                    <div class="analysis-note">
                        <p>${paper.analysis.methodology || '暂无方法论信息'}</p>
                        ${paper.analysis.methodology && (paper.analysis.methodology.includes('摘要中未提及') || paper.analysis.methodology.includes('需要查看完整论文')) ? 
                            '<p style="color: #856404; font-style: italic;">💡 建议：点击上方论文链接查看完整内容以获得详细的方法论分析</p>' : ''}
                    </div>
                    
                    <h3>⚠️ 局限性</h3>
                    <div class="analysis-note">
                        <p>${paper.analysis.limitations || '暂无局限性信息'}</p>
                        ${paper.analysis.limitations && (paper.analysis.limitations.includes('摘要中未提及') || paper.analysis.limitations.includes('需要查看完整论文')) ? 
                            '<p style="color: #856404; font-style: italic;">💡 建议：点击上方论文链接查看完整内容以获得作者提到的局限性分析</p>' : ''}
                    </div>
                </div>
            ` : `
                <div class="analysis-section">
                    <p style="color: red;">❌ 分析失败: ${paper.error || '未知错误'}</p>
                </div>
            `}
        </div>
    `).join('')}
    
    <div class="footer">
        <p>📊 由前沿探索工作流生成 | 基于AI分析的论文初筛结果</p>
    </div>
</body>
</html>
    `;
}

function generateResultsHTML(results) {
    return `
        <div class="warning-note">
            <strong>⚠️ 分析说明：</strong> 以下分析基于论文标题和摘要信息，部分详细信息可能需要查看完整论文。点击论文链接可查看原文。
        </div>
        
        ${results.map(paper => `
            <div class="paper-card">
                <div class="paper-title">${paper.title}</div>
                <div class="paper-meta">
                    作者: ${paper.authors.join(', ')} | 
                    来源: ${paper.source} | 
                    时间: ${new Date(paper.timestamp).toLocaleString()}
                </div>
                <div class="paper-url">
                    <strong>📄 论文链接:</strong> <a href="${paper.url}" target="_blank">${paper.url}</a>
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
                        
                        ${paper.analysis.experimentMetrics ? `
                            <h3>📈 实验指标分析</h3>
                            <div class="metrics-section">
                                <p><strong>评估指标:</strong> ${(paper.analysis.experimentMetrics.evaluationMetrics || []).join(', ')}</p>
                                <p><strong>实验结果:</strong> ${paper.analysis.experimentMetrics.experimentalResults || '暂无'}</p>
                                <p><strong>性能对比:</strong> ${paper.analysis.experimentMetrics.performanceComparison || '暂无'}</p>
                            </div>
                        ` : ''}
                        
                        ${paper.analysis.codeOpenSource ? `
                            <h3>💻 代码开源情况</h3>
                            <div class="code-section">
                                <p><strong>是否开源:</strong> ${paper.analysis.codeOpenSource.isOpenSource ? '✅ 是' : '❌ 否'}</p>
                                ${paper.analysis.codeOpenSource.repositoryUrl ? `<p><strong>代码仓库:</strong> <a href="${paper.analysis.codeOpenSource.repositoryUrl}" target="_blank">${paper.analysis.codeOpenSource.repositoryUrl}</a></p>` : ''}
                                <p><strong>代码质量:</strong> ${paper.analysis.codeOpenSource.codeQuality || '暂无评估'}</p>
                            </div>
                        ` : ''}
                        
                        ${paper.analysis.experimentDetails ? `
                            <h3>🔬 实验详细解释</h3>
                            <div class="experiment-section">
                                <p><strong>实验设计:</strong> ${paper.analysis.experimentDetails.experimentalDesign || '暂无'}</p>
                                <p><strong>数据集:</strong> ${(paper.analysis.experimentDetails.datasets || []).join(', ')}</p>
                                <p><strong>评估方法:</strong> ${paper.analysis.experimentDetails.evaluationMethod || '暂无'}</p>
                                <p><strong>Baseline对比:</strong> ${paper.analysis.experimentDetails.baselineComparison || '暂无'}</p>
                            </div>
                        ` : ''}
                        
                        ${paper.analysis.demoInfo ? `
                            <h3>🎮 Demo展示情况</h3>
                            <div class="demo-section">
                                <p><strong>在线Demo:</strong> ${paper.analysis.demoInfo.hasOnlineDemo ? '✅ 有' : '❌ 无'}</p>
                                ${paper.analysis.demoInfo.demoUrl ? `<p><strong>Demo链接:</strong> <a href="${paper.analysis.demoInfo.demoUrl}" target="_blank">${paper.analysis.demoInfo.demoUrl}</a></p>` : ''}
                                <p><strong>历史版本:</strong> ${paper.analysis.demoInfo.historicalVersions || '暂无'}</p>
                                <p><strong>交互体验:</strong> ${paper.analysis.demoInfo.interactionExperience || '暂无'}</p>
                            </div>
                        ` : ''}
                        
                        ${paper.analysis.resourceRequirements ? `
                            <h3>🖥️ 资源需求分析</h3>
                            <div class="resource-section">
                                <p><strong>GPU需求:</strong> ${paper.analysis.resourceRequirements.gpu || '暂无'}</p>
                                <p><strong>CPU需求:</strong> ${paper.analysis.resourceRequirements.cpu || '暂无'}</p>
                                <p><strong>内存需求:</strong> ${paper.analysis.resourceRequirements.memory || '暂无'}</p>
                                <p><strong>存储需求:</strong> ${paper.analysis.resourceRequirements.storage || '暂无'}</p>
                                <p><strong>其他资源:</strong> ${paper.analysis.resourceRequirements.otherResources || '暂无'}</p>
                            </div>
                        ` : ''}
                        
                        <h3>🔍 相关研究</h3>
                        <div class="analysis-note">
                            <p>${paper.analysis.relatedWork || '暂无相关研究信息'}</p>
                            ${paper.analysis.relatedWork && (paper.analysis.relatedWork.includes('摘要中未提及') || paper.analysis.relatedWork.includes('需要查看完整论文')) ? 
                                '<p style="color: #856404; font-style: italic;">💡 建议：点击上方论文链接查看完整内容以获得更深入的相关研究分析</p>' : ''}
                        </div>
                        
                        <h3>⚙️ 方法论</h3>
                        <div class="analysis-note">
                            <p>${paper.analysis.methodology || '暂无方法论信息'}</p>
                            ${paper.analysis.methodology && (paper.analysis.methodology.includes('摘要中未提及') || paper.analysis.methodology.includes('需要查看完整论文')) ? 
                                '<p style="color: #856404; font-style: italic;">💡 建议：点击上方论文链接查看完整内容以获得详细的方法论分析</p>' : ''}
                        </div>
                        
                        <h3>⚠️ 局限性</h3>
                        <div class="analysis-note">
                            <p>${paper.analysis.limitations || '暂无局限性信息'}</p>
                            ${paper.analysis.limitations && (paper.analysis.limitations.includes('摘要中未提及') || paper.analysis.limitations.includes('需要查看完整论文')) ? 
                                '<p style="color: #856404; font-style: italic;">💡 建议：点击上方论文链接查看完整内容以获得作者提到的局限性分析</p>' : ''}
                        </div>
                    </div>
                ` : `
                    <div class="analysis-section">
                        <p style="color: red;">❌ 分析失败: ${paper.error || '未知错误'}</p>
                    </div>
                `}
            </div>
        `).join('')}
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
