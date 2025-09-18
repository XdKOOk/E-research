// 论文初筛功能配置
const PaperScreeningConfig = {
    // API配置
    apis: {
        arxiv: {
            baseUrl: 'http://export.arxiv.org/api/query',
            maxResults: 100,
            timeout: 10000
        },
        semanticScholar: {
            baseUrl: 'https://api.semanticscholar.org/graph/v1',
            timeout: 10000
        },
        googleScholar: {
            // Google Scholar没有官方API，使用爬虫方式
            timeout: 15000
        }
    },

    // AI模型配置
    aiModels: {
        openai: {
            baseUrl: 'https://api.openai.com/v1/chat/completions',
            defaultModel: 'gpt-3.5-turbo',
            maxTokens: 1500,
            temperature: 0.7
        },
        claude: {
            baseUrl: 'https://api.anthropic.com/v1/messages',
            defaultModel: 'claude-3-sonnet-20240229',
            maxTokens: 1500
        },
        gemini: {
            baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
            defaultModel: 'gemini-pro',
            maxTokens: 1500
        }
    },

    // 分析配置
    analysis: {
        // 分析超时时间（毫秒）
        timeout: 30000,
        // 最大重试次数
        maxRetries: 3,
        // 重试延迟（毫秒）
        retryDelay: 1000,
        // 缓存时间（毫秒）
        cacheTime: 24 * 60 * 60 * 1000, // 24小时
        // 最大缓存条目数
        maxCacheEntries: 1000
    },

    // 定时任务配置
    scheduledTasks: {
        // 默认搜索频率
        defaultFrequency: 'daily',
        // 支持的时间间隔
        frequencies: ['hourly', 'daily', 'weekly', 'monthly'],
        // 最大关键词数量
        maxKeywords: 10,
        // 每次搜索的最大结果数
        maxResultsPerSearch: 50
    },

    // 支持的论文网站
    supportedSites: [
        {
            name: 'arXiv',
            domain: 'arxiv.org',
            type: 'arxiv',
            enabled: true
        },
        {
            name: 'Google Scholar',
            domain: 'scholar.google.com',
            type: 'scholar',
            enabled: true
        },
        {
            name: 'Semantic Scholar',
            domain: 'semanticscholar.org',
            type: 'semanticscholar',
            enabled: true
        },
        {
            name: 'PubMed',
            domain: 'pubmed.ncbi.nlm.nih.gov',
            type: 'pubmed',
            enabled: true
        },
        {
            name: 'IEEE Xplore',
            domain: 'ieeexplore.ieee.org',
            type: 'ieee',
            enabled: false // 需要订阅
        },
        {
            name: 'ACM Digital Library',
            domain: 'dl.acm.org',
            type: 'acm',
            enabled: false // 需要订阅
        }
    ],

    // 论文分类
    categories: {
        'cs.AI': 'Artificial Intelligence',
        'cs.CL': 'Computation and Language',
        'cs.CV': 'Computer Vision and Pattern Recognition',
        'cs.LG': 'Machine Learning',
        'cs.NE': 'Neural and Evolutionary Computing',
        'cs.RO': 'Robotics',
        'cs.SE': 'Software Engineering',
        'cs.SY': 'Systems and Control',
        'stat.ML': 'Machine Learning',
        'stat.AP': 'Applications',
        'math.OC': 'Optimization and Control',
        'physics.data-an': 'Data Analysis, Statistics and Probability'
    },

    // 研究领域
    fieldsOfStudy: [
        'Computer Science',
        'Artificial Intelligence',
        'Machine Learning',
        'Natural Language Processing',
        'Computer Vision',
        'Robotics',
        'Data Mining',
        'Information Retrieval',
        'Human-Computer Interaction',
        'Software Engineering',
        'Computer Graphics',
        'Computer Networks',
        'Cryptography',
        'Database Systems',
        'Operating Systems',
        'Programming Languages',
        'Theoretical Computer Science'
    ],

    // 默认设置
    defaultSettings: {
        // 自动初筛
        autoScreening: false,
        // 搜索频率
        searchFrequency: 'daily',
        // 关键词
        keywords: [],
        // 通知设置
        notifications: {
            enabled: true,
            onCompletion: true,
            onError: true
        },
        // AI模型设置
        aiModel: {
            provider: 'default',
            apiKey: '',
            model: 'gpt-3.5-turbo'
        },
        // 分析设置
        analysis: {
            includeRelatedWork: true,
            includeLimitations: true,
            includeApplications: true,
            includeFutureWork: true,
            maxKeyPoints: 5
        },
        // 存储设置
        storage: {
            maxResults: 1000,
            autoCleanup: true,
            exportFormat: 'json'
        }
    },

    // 评分标准
    scoringCriteria: {
        innovation: {
            weights: {
                novelty: 0.4,
                methodology: 0.3,
                contribution: 0.3
            },
            thresholds: {
                excellent: 8,
                good: 6,
                average: 4,
                poor: 2
            }
        },
        practical: {
            weights: {
                applicability: 0.4,
                feasibility: 0.3,
                impact: 0.3
            },
            thresholds: {
                excellent: 8,
                good: 6,
                average: 4,
                poor: 2
            }
        },
        impact: {
            weights: {
                citations: 0.3,
                influence: 0.4,
                significance: 0.3
            },
            thresholds: {
                excellent: 8,
                good: 6,
                average: 4,
                poor: 2
            }
        }
    },

    // 错误消息
    errorMessages: {
        networkError: '网络连接失败，请检查网络设置',
        apiError: 'API调用失败，请稍后重试',
        parseError: '数据解析失败，请检查数据格式',
        timeoutError: '请求超时，请稍后重试',
        quotaExceeded: 'API配额已用完，请稍后重试',
        invalidApiKey: 'API密钥无效，请检查配置',
        paperNotFound: '未找到相关论文',
        analysisFailed: '论文分析失败，请重试'
    },

    // 成功消息
    successMessages: {
        analysisComplete: '论文分析完成',
        resultsSaved: '结果已保存',
        exportComplete: '导出完成',
        settingsSaved: '设置已保存'
    },

    // 验证规则
    validation: {
        keywords: {
            minLength: 2,
            maxLength: 50,
            maxCount: 10
        },
        apiKey: {
            minLength: 10,
            maxLength: 200
        },
        searchQuery: {
            minLength: 3,
            maxLength: 200
        }
    },

    // 获取配置
    getConfig: function(path) {
        const keys = path.split('.');
        let config = this;
        
        for (const key of keys) {
            if (config && typeof config === 'object' && key in config) {
                config = config[key];
            } else {
                return undefined;
            }
        }
        
        return config;
    },

    // 设置配置
    setConfig: function(path, value) {
        const keys = path.split('.');
        let config = this;
        
        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (!(key in config) || typeof config[key] !== 'object') {
                config[key] = {};
            }
            config = config[key];
        }
        
        config[keys[keys.length - 1]] = value;
    },

    // 获取默认设置
    getDefaultSettings: function() {
        return JSON.parse(JSON.stringify(this.defaultSettings));
    },

    // 验证设置
    validateSettings: function(settings) {
        const errors = [];
        
        // 验证关键词
        if (settings.keywords && Array.isArray(settings.keywords)) {
            if (settings.keywords.length > this.validation.keywords.maxCount) {
                errors.push(`关键词数量不能超过${this.validation.keywords.maxCount}个`);
            }
            
            settings.keywords.forEach((keyword, index) => {
                if (typeof keyword !== 'string') {
                    errors.push(`关键词${index + 1}必须是字符串`);
                } else if (keyword.length < this.validation.keywords.minLength) {
                    errors.push(`关键词${index + 1}长度不能少于${this.validation.keywords.minLength}个字符`);
                } else if (keyword.length > this.validation.keywords.maxLength) {
                    errors.push(`关键词${index + 1}长度不能超过${this.validation.keywords.maxLength}个字符`);
                }
            });
        }
        
        // 验证API密钥
        if (settings.aiModel && settings.aiModel.apiKey) {
            const apiKey = settings.aiModel.apiKey;
            if (apiKey.length < this.validation.apiKey.minLength) {
                errors.push('API密钥长度不能少于10个字符');
            }
            if (apiKey.length > this.validation.apiKey.maxLength) {
                errors.push('API密钥长度不能超过200个字符');
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    },

    // 获取支持的网站
    getSupportedSites: function() {
        return this.supportedSites.filter(site => site.enabled);
    },

    // 获取论文分类
    getCategories: function() {
        return Object.entries(this.categories).map(([code, name]) => ({
            code,
            name
        }));
    },

    // 获取研究领域
    getFieldsOfStudy: function() {
        return this.fieldsOfStudy;
    },

    // 获取错误消息
    getErrorMessage: function(errorType) {
        return this.errorMessages[errorType] || '未知错误';
    },

    // 获取成功消息
    getSuccessMessage: function(messageType) {
        return this.successMessages[messageType] || '操作成功';
    }
};

// 导出配置
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PaperScreeningConfig;
} else {
    window.PaperScreeningConfig = PaperScreeningConfig;
}
