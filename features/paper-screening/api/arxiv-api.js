// arXiv API 集成
class ArxivAPI {
    constructor() {
        this.baseUrl = 'http://export.arxiv.org/api/query';
        this.maxResults = 100;
    }

    /**
     * 搜索论文
     * @param {Object} params - 搜索参数
     * @param {string} params.query - 搜索查询
     * @param {number} params.maxResults - 最大结果数
     * @param {number} params.start - 起始位置
     * @param {string} params.sortBy - 排序方式
     * @param {string} params.sortOrder - 排序顺序
     * @returns {Promise<Array>} 论文列表
     */
    async searchPapers(params = {}) {
        const {
            query = '',
            maxResults = 20,
            start = 0,
            sortBy = 'relevance',
            sortOrder = 'descending'
        } = params;

        const searchParams = new URLSearchParams({
            search_query: query,
            start: start.toString(),
            max_results: maxResults.toString(),
            sortBy: sortBy,
            sortOrder: sortOrder
        });

        try {
            const response = await fetch(`${this.baseUrl}?${searchParams}`);
            if (!response.ok) {
                throw new Error(`arXiv API错误: ${response.status}`);
            }

            const xmlText = await response.text();
            return this.parseArxivXML(xmlText);
        } catch (error) {
            console.error('arXiv搜索失败:', error);
            throw error;
        }
    }

    /**
     * 根据ID获取论文详情
     * @param {string} paperId - 论文ID
     * @returns {Promise<Object>} 论文详情
     */
    async getPaperById(paperId) {
        const searchParams = new URLSearchParams({
            id_list: paperId
        });

        try {
            const response = await fetch(`${this.baseUrl}?${searchParams}`);
            if (!response.ok) {
                throw new Error(`arXiv API错误: ${response.status}`);
            }

            const xmlText = await response.text();
            const papers = this.parseArxivXML(xmlText);
            return papers.length > 0 ? papers[0] : null;
        } catch (error) {
            console.error('获取论文详情失败:', error);
            throw error;
        }
    }

    /**
     * 获取最新论文
     * @param {string} category - 论文分类
     * @param {number} maxResults - 最大结果数
     * @returns {Promise<Array>} 最新论文列表
     */
    async getLatestPapers(category = 'cs.AI', maxResults = 20) {
        const query = `cat:${category}`;
        return this.searchPapers({
            query,
            maxResults,
            sortBy: 'submittedDate',
            sortOrder: 'descending'
        });
    }

    /**
     * 根据作者搜索论文
     * @param {string} author - 作者姓名
     * @param {number} maxResults - 最大结果数
     * @returns {Promise<Array>} 论文列表
     */
    async searchByAuthor(author, maxResults = 20) {
        const query = `au:${author}`;
        return this.searchPapers({
            query,
            maxResults,
            sortBy: 'submittedDate',
            sortOrder: 'descending'
        });
    }

    /**
     * 根据标题搜索论文
     * @param {string} title - 论文标题
     * @param {number} maxResults - 最大结果数
     * @returns {Promise<Array>} 论文列表
     */
    async searchByTitle(title, maxResults = 20) {
        const query = `ti:${title}`;
        return this.searchPapers({
            query,
            maxResults,
            sortBy: 'relevance',
            sortOrder: 'descending'
        });
    }

    /**
     * 解析arXiv XML响应
     * @param {string} xmlText - XML文本
     * @returns {Array} 解析后的论文列表
     */
    parseArxivXML(xmlText) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
        
        const entries = xmlDoc.querySelectorAll('entry');
        const papers = [];

        entries.forEach(entry => {
            const paper = this.parseEntry(entry);
            if (paper) {
                papers.push(paper);
            }
        });

        return papers;
    }

    /**
     * 解析单个论文条目
     * @param {Element} entry - XML条目元素
     * @returns {Object} 论文对象
     */
    parseEntry(entry) {
        try {
            const id = entry.querySelector('id')?.textContent || '';
            const title = entry.querySelector('title')?.textContent?.trim() || '';
            const summary = entry.querySelector('summary')?.textContent?.trim() || '';
            const published = entry.querySelector('published')?.textContent || '';
            const updated = entry.querySelector('updated')?.textContent || '';
            
            // 解析作者
            const authors = [];
            const authorElements = entry.querySelectorAll('author');
            authorElements.forEach(author => {
                const name = author.querySelector('name')?.textContent?.trim();
                if (name) {
                    authors.push(name);
                }
            });

            // 解析分类
            const categories = [];
            const categoryElements = entry.querySelectorAll('category');
            categoryElements.forEach(category => {
                const term = category.getAttribute('term');
                if (term) {
                    categories.push(term);
                }
            });

            // 解析链接
            const links = [];
            const linkElements = entry.querySelectorAll('link');
            linkElements.forEach(link => {
                const href = link.getAttribute('href');
                const title = link.getAttribute('title');
                const rel = link.getAttribute('rel');
                if (href) {
                    links.push({
                        href,
                        title: title || '',
                        rel: rel || ''
                    });
                }
            });

            // 提取PDF链接
            const pdfLink = links.find(link => link.title === 'pdf')?.href || '';

            // 提取DOI
            const doi = entry.querySelector('arxiv\\:doi')?.textContent || '';

            return {
                id: id.split('/').pop() || '', // 提取arXiv ID
                title,
                authors,
                abstract: summary,
                publishedDate: published,
                updatedDate: updated,
                categories,
                pdfUrl: pdfLink,
                doi,
                url: id,
                source: 'arxiv',
                links
            };
        } catch (error) {
            console.error('解析论文条目失败:', error);
            return null;
        }
    }

    /**
     * 构建搜索查询
     * @param {Object} filters - 搜索过滤器
     * @returns {string} 搜索查询字符串
     */
    buildSearchQuery(filters = {}) {
        const {
            keywords = [],
            authors = [],
            categories = [],
            dateFrom = '',
            dateTo = '',
            title = ''
        } = filters;

        const queryParts = [];

        // 关键词搜索
        if (keywords.length > 0) {
            const keywordQuery = keywords.map(keyword => `all:${keyword}`).join(' AND ');
            queryParts.push(keywordQuery);
        }

        // 作者搜索
        if (authors.length > 0) {
            const authorQuery = authors.map(author => `au:${author}`).join(' OR ');
            queryParts.push(`(${authorQuery})`);
        }

        // 分类搜索
        if (categories.length > 0) {
            const categoryQuery = categories.map(category => `cat:${category}`).join(' OR ');
            queryParts.push(`(${categoryQuery})`);
        }

        // 标题搜索
        if (title) {
            queryParts.push(`ti:${title}`);
        }

        // 日期范围搜索
        if (dateFrom) {
            queryParts.push(`submittedDate:[${dateFrom} TO *]`);
        }
        if (dateTo) {
            queryParts.push(`submittedDate:[* TO ${dateTo}]`);
        }

        return queryParts.join(' AND ');
    }

    /**
     * 获取论文分类列表
     * @returns {Array} 分类列表
     */
    getCategories() {
        return [
            { code: 'cs.AI', name: 'Artificial Intelligence' },
            { code: 'cs.CL', name: 'Computation and Language' },
            { code: 'cs.CV', name: 'Computer Vision and Pattern Recognition' },
            { code: 'cs.LG', name: 'Machine Learning' },
            { code: 'cs.NE', name: 'Neural and Evolutionary Computing' },
            { code: 'cs.RO', name: 'Robotics' },
            { code: 'cs.SE', name: 'Software Engineering' },
            { code: 'cs.SY', name: 'Systems and Control' },
            { code: 'stat.ML', name: 'Machine Learning' },
            { code: 'stat.AP', name: 'Applications' },
            { code: 'math.OC', name: 'Optimization and Control' },
            { code: 'physics.data-an', name: 'Data Analysis, Statistics and Probability' }
        ];
    }

    /**
     * 格式化日期
     * @param {string} dateString - 日期字符串
     * @returns {string} 格式化后的日期
     */
    formatDate(dateString) {
        if (!dateString) return '';
        
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            return dateString;
        }
    }

    /**
     * 验证arXiv ID格式
     * @param {string} id - arXiv ID
     * @returns {boolean} 是否有效
     */
    isValidArxivId(id) {
        // arXiv ID格式: YYMM.NNNNN 或 arch-ive/YYMMNNN
        const pattern = /^(\d{4}\.\d{4,5}|[a-z-]+\/\d{7})$/;
        return pattern.test(id);
    }
}

// 导出API类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ArxivAPI;
} else {
    window.ArxivAPI = ArxivAPI;
}
