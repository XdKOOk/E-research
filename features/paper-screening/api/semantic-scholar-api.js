// Semantic Scholar API 集成
class SemanticScholarAPI {
    constructor() {
        this.baseUrl = 'https://api.semanticscholar.org/graph/v1';
        this.apiKey = ''; // 可选，用于提高请求限制
    }

    /**
     * 设置API密钥
     * @param {string} apiKey - API密钥
     */
    setApiKey(apiKey) {
        this.apiKey = apiKey;
    }

    /**
     * 搜索论文
     * @param {Object} params - 搜索参数
     * @param {string} params.query - 搜索查询
     * @param {number} params.limit - 结果限制
     * @param {number} params.offset - 偏移量
     * @param {Array} params.fields - 返回字段
     * @returns {Promise<Object>} 搜索结果
     */
    async searchPapers(params = {}) {
        const {
            query = '',
            limit = 20,
            offset = 0,
            fields = ['paperId', 'title', 'abstract', 'authors', 'year', 'citationCount', 'influentialCitationCount']
        } = params;

        const searchParams = new URLSearchParams({
            query,
            limit: limit.toString(),
            offset: offset.toString(),
            fields: fields.join(',')
        });

        const headers = {};
        if (this.apiKey) {
            headers['x-api-key'] = this.apiKey;
        }

        try {
            const response = await fetch(`${this.baseUrl}/paper/search?${searchParams}`, {
                headers
            });

            if (!response.ok) {
                throw new Error(`Semantic Scholar API错误: ${response.status}`);
            }

            const data = await response.json();
            return this.formatSearchResults(data);
        } catch (error) {
            console.error('Semantic Scholar搜索失败:', error);
            throw error;
        }
    }

    /**
     * 根据论文ID获取详情
     * @param {string} paperId - 论文ID
     * @param {Array} fields - 返回字段
     * @returns {Promise<Object>} 论文详情
     */
    async getPaperById(paperId, fields = ['paperId', 'title', 'abstract', 'authors', 'year', 'citationCount', 'influentialCitationCount', 'references', 'citations']) {
        const searchParams = new URLSearchParams({
            fields: fields.join(',')
        });

        const headers = {};
        if (this.apiKey) {
            headers['x-api-key'] = this.apiKey;
        }

        try {
            const response = await fetch(`${this.baseUrl}/paper/${paperId}?${searchParams}`, {
                headers
            });

            if (!response.ok) {
                throw new Error(`Semantic Scholar API错误: ${response.status}`);
            }

            const data = await response.json();
            return this.formatPaperData(data);
        } catch (error) {
            console.error('获取论文详情失败:', error);
            throw error;
        }
    }

    /**
     * 根据DOI获取论文
     * @param {string} doi - DOI
     * @param {Array} fields - 返回字段
     * @returns {Promise<Object>} 论文详情
     */
    async getPaperByDOI(doi, fields = ['paperId', 'title', 'abstract', 'authors', 'year', 'citationCount', 'influentialCitationCount']) {
        const searchParams = new URLSearchParams({
            fields: fields.join(',')
        });

        const headers = {};
        if (this.apiKey) {
            headers['x-api-key'] = this.apiKey;
        }

        try {
            const response = await fetch(`${this.baseUrl}/paper/DOI:${encodeURIComponent(doi)}?${searchParams}`, {
                headers
            });

            if (!response.ok) {
                throw new Error(`Semantic Scholar API错误: ${response.status}`);
            }

            const data = await response.json();
            return this.formatPaperData(data);
        } catch (error) {
            console.error('根据DOI获取论文失败:', error);
            throw error;
        }
    }

    /**
     * 获取论文的引用
     * @param {string} paperId - 论文ID
     * @param {number} limit - 结果限制
     * @param {number} offset - 偏移量
     * @returns {Promise<Array>} 引用列表
     */
    async getPaperCitations(paperId, limit = 20, offset = 0) {
        const searchParams = new URLSearchParams({
            limit: limit.toString(),
            offset: offset.toString(),
            fields: 'paperId,title,authors,year,citationCount'
        });

        const headers = {};
        if (this.apiKey) {
            headers['x-api-key'] = this.apiKey;
        }

        try {
            const response = await fetch(`${this.baseUrl}/paper/${paperId}/citations?${searchParams}`, {
                headers
            });

            if (!response.ok) {
                throw new Error(`Semantic Scholar API错误: ${response.status}`);
            }

            const data = await response.json();
            return data.data.map(paper => this.formatPaperData(paper));
        } catch (error) {
            console.error('获取论文引用失败:', error);
            throw error;
        }
    }

    /**
     * 获取论文的参考文献
     * @param {string} paperId - 论文ID
     * @param {number} limit - 结果限制
     * @param {number} offset - 偏移量
     * @returns {Promise<Array>} 参考文献列表
     */
    async getPaperReferences(paperId, limit = 20, offset = 0) {
        const searchParams = new URLSearchParams({
            limit: limit.toString(),
            offset: offset.toString(),
            fields: 'paperId,title,authors,year,citationCount'
        });

        const headers = {};
        if (this.apiKey) {
            headers['x-api-key'] = this.apiKey;
        }

        try {
            const response = await fetch(`${this.baseUrl}/paper/${paperId}/references?${searchParams}`, {
                headers
            });

            if (!response.ok) {
                throw new Error(`Semantic Scholar API错误: ${response.status}`);
            }

            const data = await response.json();
            return data.data.map(paper => this.formatPaperData(paper));
        } catch (error) {
            console.error('获取论文参考文献失败:', error);
            throw error;
        }
    }

    /**
     * 根据作者搜索论文
     * @param {string} authorName - 作者姓名
     * @param {number} limit - 结果限制
     * @param {number} offset - 偏移量
     * @returns {Promise<Array>} 论文列表
     */
    async searchPapersByAuthor(authorName, limit = 20, offset = 0) {
        const searchParams = new URLSearchParams({
            query: authorName,
            limit: limit.toString(),
            offset: offset.toString(),
            fields: 'paperId,title,abstract,authors,year,citationCount'
        });

        const headers = {};
        if (this.apiKey) {
            headers['x-api-key'] = this.apiKey;
        }

        try {
            const response = await fetch(`${this.baseUrl}/paper/search?${searchParams}`, {
                headers
            });

            if (!response.ok) {
                throw new Error(`Semantic Scholar API错误: ${response.status}`);
            }

            const data = await response.json();
            return this.formatSearchResults(data);
        } catch (error) {
            console.error('根据作者搜索论文失败:', error);
            throw error;
        }
    }

    /**
     * 获取作者信息
     * @param {string} authorId - 作者ID
     * @param {Array} fields - 返回字段
     * @returns {Promise<Object>} 作者信息
     */
    async getAuthorById(authorId, fields = ['authorId', 'name', 'papers', 'hIndex', 'citationCount']) {
        const searchParams = new URLSearchParams({
            fields: fields.join(',')
        });

        const headers = {};
        if (this.apiKey) {
            headers['x-api-key'] = this.apiKey;
        }

        try {
            const response = await fetch(`${this.baseUrl}/author/${authorId}?${searchParams}`, {
                headers
            });

            if (!response.ok) {
                throw new Error(`Semantic Scholar API错误: ${response.status}`);
            }

            const data = await response.json();
            return this.formatAuthorData(data);
        } catch (error) {
            console.error('获取作者信息失败:', error);
            throw error;
        }
    }

    /**
     * 格式化搜索结果
     * @param {Object} data - API响应数据
     * @returns {Object} 格式化后的结果
     */
    formatSearchResults(data) {
        return {
            total: data.total || 0,
            offset: data.offset || 0,
            next: data.next || 0,
            papers: data.data.map(paper => this.formatPaperData(paper))
        };
    }

    /**
     * 格式化论文数据
     * @param {Object} paper - 原始论文数据
     * @returns {Object} 格式化后的论文数据
     */
    formatPaperData(paper) {
        return {
            id: paper.paperId || '',
            title: paper.title || '',
            abstract: paper.abstract || '',
            authors: paper.authors ? paper.authors.map(author => ({
                id: author.authorId || '',
                name: author.name || '',
                url: author.url || ''
            })) : [],
            year: paper.year || null,
            citationCount: paper.citationCount || 0,
            influentialCitationCount: paper.influentialCitationCount || 0,
            isOpenAccess: paper.isOpenAccess || false,
            openAccessPdf: paper.openAccessPdf ? {
                url: paper.openAccessPdf.url || '',
                status: paper.openAccessPdf.status || ''
            } : null,
            venue: paper.venue || '',
            fieldsOfStudy: paper.fieldsOfStudy || [],
            url: paper.url || '',
            source: 'semanticscholar',
            doi: paper.externalIds ? paper.externalIds.DOI : null,
            arxivId: paper.externalIds ? paper.externalIds.ArXiv : null,
            magId: paper.externalIds ? paper.externalIds.MAG : null,
            aclId: paper.externalIds ? paper.externalIds.ACL : null,
            pmcId: paper.externalIds ? paper.externalIds.PMC : null,
            pubmedId: paper.externalIds ? paper.externalIds.PubMed : null
        };
    }

    /**
     * 格式化作者数据
     * @param {Object} author - 原始作者数据
     * @returns {Object} 格式化后的作者数据
     */
    formatAuthorData(author) {
        return {
            id: author.authorId || '',
            name: author.name || '',
            aliases: author.aliases || [],
            url: author.url || '',
            hIndex: author.hIndex || 0,
            citationCount: author.citationCount || 0,
            paperCount: author.paperCount || 0,
            papers: author.papers ? author.papers.map(paper => this.formatPaperData(paper)) : []
        };
    }

    /**
     * 构建高级搜索查询
     * @param {Object} filters - 搜索过滤器
     * @returns {string} 搜索查询字符串
     */
    buildAdvancedQuery(filters = {}) {
        const {
            title = '',
            authors = [],
            abstract = '',
            venue = '',
            yearFrom = '',
            yearTo = '',
            fieldsOfStudy = [],
            minCitationCount = 0
        } = filters;

        const queryParts = [];

        if (title) {
            queryParts.push(`title:"${title}"`);
        }

        if (authors.length > 0) {
            const authorQuery = authors.map(author => `authors:"${author}"`).join(' OR ');
            queryParts.push(`(${authorQuery})`);
        }

        if (abstract) {
            queryParts.push(`abstract:"${abstract}"`);
        }

        if (venue) {
            queryParts.push(`venue:"${venue}"`);
        }

        if (yearFrom && yearTo) {
            queryParts.push(`year:${yearFrom}-${yearTo}`);
        } else if (yearFrom) {
            queryParts.push(`year:${yearFrom}-`);
        } else if (yearTo) {
            queryParts.push(`year:-${yearTo}`);
        }

        if (fieldsOfStudy.length > 0) {
            const fieldQuery = fieldsOfStudy.map(field => `fieldsOfStudy:"${field}"`).join(' OR ');
            queryParts.push(`(${fieldQuery})`);
        }

        if (minCitationCount > 0) {
            queryParts.push(`citationCount:${minCitationCount}-`);
        }

        return queryParts.join(' AND ');
    }

    /**
     * 获取研究领域列表
     * @returns {Array} 研究领域列表
     */
    getFieldsOfStudy() {
        return [
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
            'Theoretical Computer Science',
            'Mathematics',
            'Statistics',
            'Physics',
            'Biology',
            'Medicine',
            'Psychology',
            'Economics',
            'Social Sciences'
        ];
    }

    /**
     * 验证论文ID格式
     * @param {string} paperId - 论文ID
     * @returns {boolean} 是否有效
     */
    isValidPaperId(paperId) {
        // Semantic Scholar论文ID通常是32位十六进制字符串
        const pattern = /^[a-f0-9]{32}$/i;
        return pattern.test(paperId);
    }

    /**
     * 验证DOI格式
     * @param {string} doi - DOI
     * @returns {boolean} 是否有效
     */
    isValidDOI(doi) {
        const pattern = /^10\.\d{4,}\/[^\s]+$/;
        return pattern.test(doi);
    }
}

// 导出API类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SemanticScholarAPI;
} else {
    window.SemanticScholarAPI = SemanticScholarAPI;
}
