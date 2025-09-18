// AI论文分析器
class PaperAnalyzer {
    constructor() {
        this.apiKey = '';
        this.provider = 'default';
        this.model = 'gpt-3.5-turbo';
        this.analysisCache = new Map();
        this.paperReader = null;
    }

    /**
     * 设置AI配置
     * @param {Object} config - AI配置
     */
    setConfig(config) {
        this.apiKey = config.apiKey || '';
        this.provider = config.provider || 'default';
        this.model = config.model || 'gpt-3.5-turbo';
        
        // 论文阅读器将在页面中动态加载
        this.paperReader = null;
    }

    /**
     * 分析论文
     * @param {Object} paperData - 论文数据
     * @returns {Promise<Object>} 分析结果
     */
    async analyzePaper(paperData) {
        try {
            // 检查缓存
            const cacheKey = this.generateCacheKey(paperData);
            if (this.analysisCache.has(cacheKey)) {
                return this.analysisCache.get(cacheKey);
            }

            // 检查API密钥是否有效
            if (!this.isValidApiKey()) {
                console.warn('API密钥无效，使用基于规则的分析');
                return this.generateRuleBasedAnalysis(paperData);
            }

            // 暂时禁用论文阅读功能，专注于修复Service Worker问题
            let paperContent = '';
            console.log('论文阅读功能暂时禁用，使用摘要分析');

            // 生成分析提示词
            const prompt = this.buildAnalysisPrompt(paperData, paperContent);
            
            // 调用AI模型
            const analysisResult = await this.callAIModel(prompt);
            
            // 后处理分析结果
            const processedResult = this.postProcessAnalysis(analysisResult, paperData);
            
            // 缓存结果
            this.analysisCache.set(cacheKey, processedResult);
            
            return processedResult;
        } catch (error) {
            console.error('论文分析失败:', error);
            return this.generateFallbackAnalysis(paperData);
        }
    }

    /**
     * 构建分析提示词
     * @param {Object} paperData - 论文数据
     * @param {string} paperContent - 论文原文内容
     * @returns {string} 分析提示词
     */
    buildAnalysisPrompt(paperData, paperContent = '') {
        return `
请作为专业的学术论文分析专家，对以下论文进行深入分析：

**重要说明：**
${paperContent ? 
    '你已获得论文的原文内容，请基于完整信息进行详细分析。' : 
    '你只能获取到论文的标题和摘要信息，请基于现有信息进行具体分析，不要返回"需要进一步分析"等通用回答。'
}

**论文信息：**
- 标题: ${paperData.title}
- 作者: ${paperData.authors}
- 摘要: ${paperData.abstract}
- 来源: ${paperData.source}
- 发表年份: ${paperData.year || '未知'}
- 引用次数: ${paperData.citationCount || '未知'}
- 论文链接: ${paperData.url || '未知'}

${paperContent ? `
**论文原文内容：**
${paperContent}
` : ''}

**分析要求：**
请从以下维度进行专业分析，并以JSON格式返回结果：

1. **summary** (论文简介): 用2-3句话概括论文的核心贡献和创新点
2. **keyPoints** (关注要点): 列出3-5个最重要的技术要点或创新点
3. **innovationScore** (创新性评分): 1-10分，评估论文的创新程度
4. **practicalScore** (实用性评分): 1-10分，评估论文的实用价值和应用前景
5. **impactScore** (影响力评分): 1-10分，评估论文的潜在学术影响力
6. **experimentMetrics** (实验指标分析): 
   - evaluationMetrics: 从摘要中能识别的评估指标，无法识别的标注"需要查看完整论文"
   - experimentalResults: 摘要中提到的实验结果，无则标注"需要查看完整论文"
   - performanceComparison: 摘要中的性能对比信息，无则标注"需要查看完整论文"
7. **codeOpenSource** (代码开源情况):
   - isOpenSource: 基于摘要判断是否可能开源，不确定则标注"需要查看完整论文"
   - repositoryUrl: 摘要中提到的代码链接，无则标注"需要查看完整论文"
   - codeQuality: 无法从摘要评估，标注"需要查看完整论文"
8. **experimentDetails** (实验详细解释):
   - experimentalDesign: 摘要中的实验设计描述，无则标注"需要查看完整论文"
   - datasets: 摘要中提到的数据集，无则标注"需要查看完整论文"
   - evaluationMethod: 摘要中的评估方法，无则标注"需要查看完整论文"
   - baselineComparison: 摘要中的对比方法，无则标注"需要查看完整论文"
9. **demoInfo** (Demo展示情况):
   - hasOnlineDemo: 摘要中是否提到Demo，无则标注"需要查看完整论文"
   - demoUrl: 摘要中的Demo链接，无则标注"需要查看完整论文"
   - historicalVersions: 无法从摘要获取，标注"需要查看完整论文"
   - interactionExperience: 无法从摘要获取，标注"需要查看完整论文"
10. **resourceRequirements** (资源需求分析):
    - gpu: 摘要中的GPU需求描述，无则标注"需要查看完整论文"
    - cpu: 摘要中的CPU需求描述，无则标注"需要查看完整论文"
    - memory: 摘要中的内存需求描述，无则标注"需要查看完整论文"
    - storage: 摘要中的存储需求描述，无则标注"需要查看完整论文"
    - otherResources: 摘要中的其他资源需求，无则标注"需要查看完整论文"
11. **relatedWork** (相关研究): ${paperContent ? 
    '基于论文原文内容，详细分析论文与现有研究的关系和区别，包括具体的对比方法和改进点。' :
    '仔细阅读摘要内容，寻找以下信息：是否提到"相比现有方法"、"在XXX基础上"等表述？是否提到"传统方法"、"现有技术"等对比？是否提到"改进"、"优化"等相对于现有工作的描述？如果找到相关信息，请具体描述。如果没有找到，才说"摘要中未提及相关工作"。'
}
12. **methodology** (方法论): ${paperContent ? 
    '基于论文原文内容，详细分析论文采用的研究方法、技术路线、算法和实验设计。' :
    '仔细阅读摘要内容，寻找以下信息：是否提到具体的方法名称或技术？是否提到"采用"、"使用"、"基于"等动词？是否提到具体的算法、模型或框架？如果找到相关信息，请具体描述。如果没有找到，才说"摘要中未提及具体方法"。'
}
13. **limitations** (局限性): ${paperContent ? 
    '基于论文原文内容，详细分析论文的局限性、挑战和未来工作方向。' :
    '仔细阅读摘要内容，寻找以下信息：是否提到"限制"、"不足"、"挑战"等词汇？是否提到"未来工作"、"进一步研究"等表述？是否提到"需要改进"、"有待完善"等描述？如果找到相关信息，请具体描述。如果没有找到，才说"摘要中未提及局限性"。'
}

**评分标准：**
- 创新性: 技术新颖性、方法创新性、理论贡献
- 实用性: 实际应用价值、工程可行性、商业潜力
- 影响力: 学术影响力、引用潜力、领域重要性

**重要提醒：**
- 必须基于提供的摘要内容进行具体分析
- 禁止返回"需要进一步分析"、"需要详细分析"等通用回答
- 只有摘要中完全没有相关信息时，才标注"需要查看完整论文"
- 请仔细阅读摘要，提取具体的技术细节和分析内容

请确保返回的JSON格式正确，所有字段都有值。
`;
    }

    /**
     * 调用AI模型
     * @param {string} prompt - 提示词
     * @returns {Promise<Object>} AI响应
     */
    async callAIModel(prompt) {
        switch (this.provider) {
            case 'openai':
                return await this.callOpenAI(prompt);
            case 'openrouter':
                return await this.callOpenRouter(prompt);
            case 'claude':
                return await this.callClaude(prompt);
            case 'gemini':
                return await this.callGemini(prompt);
            default:
                return await this.callDefaultModel(prompt);
        }
    }

    /**
     * 调用OpenAI API
     * @param {string} prompt - 提示词
     * @returns {Promise<Object>} 分析结果
     */
    async callOpenAI(prompt) {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: this.model,
                messages: [
                    {
                        role: 'system',
                        content: '你是一个专业的学术论文分析专家，擅长分析各种领域的学术论文并提供深入的分析报告。请始终以JSON格式返回分析结果。'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 1500,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            throw new Error(`OpenAI API错误: ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;
        
        return this.parseAIResponse(content);
    }

    /**
     * 调用OpenRouter API
     * @param {string} prompt - 提示词
     * @returns {Promise<Object>} 分析结果
     */
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
                        role: 'system',
                        content: '你是一个专业的学术论文分析专家，擅长分析各种领域的学术论文并提供深入的分析报告。请始终以JSON格式返回分析结果。'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 1500,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            throw new Error(`OpenRouter API错误: ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;
        
        return this.parseAIResponse(content);
    }

    /**
     * 调用Claude API
     * @param {string} prompt - 提示词
     * @returns {Promise<Object>} 分析结果
     */
    async callClaude(prompt) {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: this.model,
                max_tokens: 1500,
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
        
        return this.parseAIResponse(content);
    }

    /**
     * 调用Gemini API
     * @param {string} prompt - 提示词
     * @returns {Promise<Object>} 分析结果
     */
    async callGemini(prompt) {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`, {
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
        
        return this.parseAIResponse(content);
    }

    /**
     * 调用默认模型（规则基础分析）
     * @param {string} prompt - 提示词
     * @returns {Promise<Object>} 分析结果
     */
    async callDefaultModel(prompt) {
        // 基于规则的简单分析
        return this.generateRuleBasedAnalysis(prompt);
    }

    /**
     * 检查API密钥是否有效
     * @returns {boolean} 是否有效
     */
    isValidApiKey() {
        if (!this.apiKey || this.apiKey.length < 10) {
            return false;
        }
        
        // 检查是否是有效的OpenAI密钥格式
        if (this.provider === 'openai') {
            return this.apiKey.startsWith('sk-') && !this.apiKey.startsWith('sk-or-v1-');
        }
        
        // 检查是否是有效的OpenRouter密钥格式
        if (this.provider === 'openrouter') {
            return this.apiKey.startsWith('sk-or-v1-');
        }
        
        return true;
    }

    /**
     * 解析AI响应
     * @param {string} content - AI响应内容
     * @returns {Object} 解析后的结果
     */
    parseAIResponse(content) {
        try {
            // 尝试直接解析JSON
            return JSON.parse(content);
        } catch (e) {
            // 如果不是JSON格式，尝试提取JSON部分
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                try {
                    return JSON.parse(jsonMatch[0]);
                } catch (e2) {
                    console.warn('无法解析AI响应为JSON:', e2);
                }
            }
            
            // 如果无法解析JSON，使用文本解析
            return this.parseTextResponse(content);
        }
    }

    /**
     * 解析文本响应
     * @param {string} text - 文本内容
     * @returns {Object} 解析后的结果
     */
    parseTextResponse(text) {
        const result = {
            summary: '',
            keyPoints: [],
            innovationScore: 5,
            practicalScore: 5,
            impactScore: 5,
            relatedWork: '',
            methodology: '',
            limitations: '',
            applications: '',
            futureWork: ''
        };

        const lines = text.split('\n');
        let currentSection = '';

        lines.forEach(line => {
            const trimmedLine = line.trim();
            
            if (trimmedLine.includes('简介') || trimmedLine.includes('summary')) {
                currentSection = 'summary';
                result.summary = trimmedLine.replace(/.*[:：]\s*/, '');
            } else if (trimmedLine.includes('要点') || trimmedLine.includes('keyPoints')) {
                currentSection = 'keyPoints';
            } else if (trimmedLine.includes('创新性') || trimmedLine.includes('innovation')) {
                const score = trimmedLine.match(/\d+/);
                result.innovationScore = score ? parseInt(score[0]) : 5;
            } else if (trimmedLine.includes('实用性') || trimmedLine.includes('practical')) {
                const score = trimmedLine.match(/\d+/);
                result.practicalScore = score ? parseInt(score[0]) : 5;
            } else if (trimmedLine.includes('影响力') || trimmedLine.includes('impact')) {
                const score = trimmedLine.match(/\d+/);
                result.impactScore = score ? parseInt(score[0]) : 5;
            } else if (trimmedLine.includes('相关研究') || trimmedLine.includes('relatedWork')) {
                currentSection = 'relatedWork';
                result.relatedWork = trimmedLine.replace(/.*[:：]\s*/, '');
            } else if (trimmedLine.includes('方法论') || trimmedLine.includes('methodology')) {
                currentSection = 'methodology';
                result.methodology = trimmedLine.replace(/.*[:：]\s*/, '');
            } else if (trimmedLine.includes('局限性') || trimmedLine.includes('limitations')) {
                currentSection = 'limitations';
                result.limitations = trimmedLine.replace(/.*[:：]\s*/, '');
            } else if (trimmedLine.includes('应用') || trimmedLine.includes('applications')) {
                currentSection = 'applications';
                result.applications = trimmedLine.replace(/.*[:：]\s*/, '');
            } else if (trimmedLine.includes('未来工作') || trimmedLine.includes('futureWork')) {
                currentSection = 'futureWork';
                result.futureWork = trimmedLine.replace(/.*[:：]\s*/, '');
            } else if (trimmedLine.startsWith('-') || trimmedLine.startsWith('•')) {
                if (currentSection === 'keyPoints') {
                    result.keyPoints.push(trimmedLine.replace(/^[-•]\s*/, ''));
                }
            }
        });

        return result;
    }

    /**
     * 后处理分析结果
     * @param {Object} analysisResult - 原始分析结果
     * @param {Object} paperData - 论文数据
     * @returns {Object} 处理后的结果
     */
    postProcessAnalysis(analysisResult, paperData) {
        // 确保所有必需字段存在
        const result = {
            summary: analysisResult.summary || '暂无简介',
            keyPoints: Array.isArray(analysisResult.keyPoints) ? analysisResult.keyPoints : [],
            innovationScore: this.validateScore(analysisResult.innovationScore),
            practicalScore: this.validateScore(analysisResult.practicalScore),
            impactScore: this.validateScore(analysisResult.impactScore),
            relatedWork: analysisResult.relatedWork || '暂无相关研究信息',
            methodology: analysisResult.methodology || '暂无方法论信息',
            limitations: analysisResult.limitations || '暂无局限性信息',
            applications: analysisResult.applications || '暂无应用信息',
            futureWork: analysisResult.futureWork || '暂无未来工作信息',
            confidence: this.calculateConfidence(analysisResult, paperData),
            timestamp: new Date().toISOString()
        };

        // 如果没有关键要点，生成默认要点
        if (result.keyPoints.length === 0) {
            result.keyPoints = this.generateDefaultKeyPoints(paperData);
        }

        return result;
    }

    /**
     * 验证评分
     * @param {number} score - 评分
     * @returns {number} 验证后的评分
     */
    validateScore(score) {
        const numScore = parseInt(score);
        if (isNaN(numScore) || numScore < 1 || numScore > 10) {
            return 5; // 默认评分
        }
        return numScore;
    }

    /**
     * 计算分析置信度
     * @param {Object} analysisResult - 分析结果
     * @param {Object} paperData - 论文数据
     * @returns {number} 置信度 (0-1)
     */
    calculateConfidence(analysisResult, paperData) {
        let confidence = 0.5; // 基础置信度

        // 根据论文数据完整性调整置信度
        if (paperData.abstract && paperData.abstract.length > 100) {
            confidence += 0.2;
        }
        if (paperData.title && paperData.title.length > 10) {
            confidence += 0.1;
        }
        if (paperData.authors && paperData.authors.length > 0) {
            confidence += 0.1;
        }

        // 根据分析结果质量调整置信度
        if (analysisResult.summary && analysisResult.summary.length > 50) {
            confidence += 0.1;
        }
        if (Array.isArray(analysisResult.keyPoints) && analysisResult.keyPoints.length > 0) {
            confidence += 0.1;
        }

        return Math.min(confidence, 1.0);
    }

    /**
     * 生成默认关键要点
     * @param {Object} paperData - 论文数据
     * @returns {Array} 默认关键要点
     */
    generateDefaultKeyPoints(paperData) {
        const points = [];
        
        if (paperData.abstract) {
            const abstract = paperData.abstract.toLowerCase();
            
            if (abstract.includes('machine learning') || abstract.includes('deep learning')) {
                points.push('涉及机器学习或深度学习技术');
            }
            if (abstract.includes('neural network')) {
                points.push('使用神经网络方法');
            }
            if (abstract.includes('algorithm')) {
                points.push('提出了新的算法或方法');
            }
            if (abstract.includes('experiment') || abstract.includes('evaluation')) {
                points.push('包含实验验证或性能评估');
            }
        }

        if (points.length === 0) {
            points.push('需要进一步分析具体的技术贡献');
            points.push('建议关注实验设计和结果');
            points.push('评估方法的创新性');
        }

        return points;
    }

    /**
     * 生成备用分析结果
     * @param {Object} paperData - 论文数据
     * @returns {Object} 备用分析结果
     */
    generateFallbackAnalysis(paperData) {
        return {
            summary: `这是一篇关于${this.extractKeywords(paperData).slice(0, 3).join('、')}的研究论文。`,
            keyPoints: this.generateDefaultKeyPoints(paperData),
            innovationScore: 6,
            practicalScore: 5,
            impactScore: 5,
            relatedWork: '需要进一步分析相关研究',
            methodology: '需要详细分析研究方法',
            limitations: '需要识别论文的局限性',
            applications: '需要分析应用领域',
            futureWork: '需要探索未来研究方向',
            confidence: 0.3,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * 基于规则的分析
     * @param {string} prompt - 提示词
     * @returns {Object} 分析结果
     */
    generateRuleBasedAnalysis(prompt) {
        // 从提示词中提取论文信息
        const titleMatch = prompt.match(/标题:\s*(.+)/);
        const abstractMatch = prompt.match(/摘要:\s*(.+)/);
        
        const title = titleMatch ? titleMatch[1] : '';
        const abstract = abstractMatch ? abstractMatch[1] : '';
        
        const keywords = this.extractKeywordsFromText(abstract + ' ' + title);
        
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
            limitations: '需要识别论文的局限性',
            applications: '需要分析应用领域',
            futureWork: '需要探索未来研究方向'
        };
    }

    /**
     * 提取关键词
     * @param {Object} paperData - 论文数据
     * @returns {Array} 关键词列表
     */
    extractKeywords(paperData) {
        const text = (paperData.title || '') + ' ' + (paperData.abstract || '');
        return this.extractKeywordsFromText(text);
    }

    /**
     * 从文本中提取关键词
     * @param {string} text - 文本内容
     * @returns {Array} 关键词列表
     */
    extractKeywordsFromText(text) {
        const commonKeywords = [
            'machine learning', 'deep learning', 'neural network', 'artificial intelligence',
            'computer vision', 'natural language processing', 'reinforcement learning',
            'data mining', 'big data', 'blockchain', 'cybersecurity', 'robotics',
            'optimization', 'algorithm', 'model', 'framework', 'system',
            'classification', 'regression', 'clustering', 'feature extraction',
            'image processing', 'text analysis', 'speech recognition', 'recommendation system'
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

    /**
     * 生成缓存键
     * @param {Object} paperData - 论文数据
     * @returns {string} 缓存键
     */
    generateCacheKey(paperData) {
        return `${paperData.title}_${paperData.authors}_${paperData.source}`;
    }

    /**
     * 清除缓存
     */
    clearCache() {
        this.analysisCache.clear();
    }

    /**
     * 获取缓存大小
     * @returns {number} 缓存大小
     */
    getCacheSize() {
        return this.analysisCache.size;
    }
}

// 导出分析器类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PaperAnalyzer;
} else if (typeof self !== 'undefined') {
    self.PaperAnalyzer = PaperAnalyzer;
}
