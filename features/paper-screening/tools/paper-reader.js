// 论文阅读工具 - 让AI能够访问完整论文内容
class PaperReader {
    constructor() {
        this.cache = new Map();
        this.maxCacheSize = 50;
    }

    /**
     * 读取论文完整内容
     * @param {Object} paperData - 论文数据对象
     * @returns {Promise<Object>} 包含完整论文内容的对象
     */
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
                case 'scholar':
                    content = await this.readScholarPaper(url);
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

    /**
     * 读取arXiv论文
     */
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

    /**
     * 读取Semantic Scholar论文
     */
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
            
            // 尝试获取PDF内容
            let pdfContent = null;
            if (data.openAccessPdf && data.openAccessPdf.url) {
                try {
                    pdfContent = await this.fetchPDFContent(data.openAccessPdf.url);
                } catch (error) {
                    console.warn('无法获取PDF内容:', error);
                }
            }

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
                    pdfContent: pdfContent,
                    openAccessPdf: data.openAccessPdf
                },
                url: url
            };

        } catch (error) {
            console.error('读取Semantic Scholar论文失败:', error);
            return null;
        }
    }

    /**
     * 读取Google Scholar论文
     */
    async readScholarPaper(url) {
        try {
            // Google Scholar没有公开API，尝试通过网页抓取
            const proxyUrl = 'https://api.allorigins.win/raw?url=';
            const response = await fetch(proxyUrl + encodeURIComponent(url));
            
            if (!response.ok) {
                throw new Error(`Scholar页面请求失败: ${response.status}`);
            }

            const html = await response.text();
            const content = this.parseScholarHTML(html);
            
            return {
                success: true,
                source: 'scholar',
                content: content,
                url: url
            };

        } catch (error) {
            console.error('读取Scholar论文失败:', error);
            return null;
        }
    }

    /**
     * 读取通用论文页面
     */
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

    /**
     * 获取PDF内容
     */
    async fetchPDFContent(pdfUrl) {
        try {
            const proxyUrl = 'https://api.allorigins.win/raw?url=';
            const response = await fetch(proxyUrl + encodeURIComponent(pdfUrl));
            
            if (!response.ok) {
                throw new Error(`PDF请求失败: ${response.status}`);
            }

            // 注意：这里只是获取PDF的URL，实际解析PDF内容需要专门的库
            // 在实际应用中，可能需要使用PDF.js或其他PDF解析库
            return {
                url: pdfUrl,
                accessible: true,
                note: 'PDF内容需要专门的解析工具'
            };

        } catch (error) {
            console.error('获取PDF内容失败:', error);
            return null;
        }
    }

    /**
     * 解析arXiv XML
     */
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
            const updatedMatch = entry.match(/<updated[^>]*>([^<]+)<\/updated>/);
            const categoryMatches = entry.match(/<category[^>]*term="([^"]+)"[^>]*>/g);
            const linkMatches = entry.match(/<link[^>]*href="([^"]+)"[^>]*>/g);

            const title = titleMatch ? titleMatch[1].trim() : '';
            const abstract = summaryMatch ? summaryMatch[1].trim() : '';
            const authors = authorMatches ? authorMatches.map(match => 
                match.replace(/<\/?name[^>]*>/g, '').trim()
            ) : [];
            const paperId = idMatch ? idMatch[1] : '';
            const published = publishedMatch ? publishedMatch[1] : '';
            const updated = updatedMatch ? updatedMatch[1] : '';
            const categories = categoryMatches ? categoryMatches.map(match => 
                match.match(/term="([^"]+)"/)[1]
            ) : [];
            const links = linkMatches ? linkMatches.map(match => 
                match.match(/href="([^"]+)"/)[1]
            ) : [];

            return {
                title,
                abstract,
                authors,
                paperId,
                published,
                updated,
                categories,
                links,
                fullText: abstract // arXiv通常只提供摘要，完整文本需要PDF
            };

        } catch (error) {
            console.error('解析arXiv XML失败:', error);
            return null;
        }
    }

    /**
     * 解析Scholar HTML
     */
    parseScholarHTML(html) {
        try {
            // 使用正则表达式提取信息
            const titleMatch = html.match(/<h3[^>]*class="gs_rt"[^>]*>([^<]+)<\/h3>/);
            const authorMatch = html.match(/<div[^>]*class="gs_a"[^>]*>([^<]+)<\/div>/);
            const abstractMatch = html.match(/<div[^>]*class="gs_rs"[^>]*>([\s\S]*?)<\/div>/);

            return {
                title: titleMatch ? titleMatch[1].trim() : '',
                authors: authorMatch ? authorMatch[1].trim() : '',
                abstract: abstractMatch ? abstractMatch[1].trim() : '',
                fullText: abstractMatch ? abstractMatch[1].trim() : ''
            };

        } catch (error) {
            console.error('解析Scholar HTML失败:', error);
            return null;
        }
    }

    /**
     * 解析通用HTML
     */
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

    /**
     * 提取arXiv ID
     */
    extractArxivId(url) {
        const match = url.match(/arxiv\.org\/abs\/(\d+\.\d+)/);
        return match ? match[1] : null;
    }

    /**
     * 提取Semantic Scholar ID
     */
    extractSemanticScholarId(url) {
        const match = url.match(/semanticscholar\.org\/paper\/([^\/]+)/);
        return match ? match[1] : null;
    }

    /**
     * 缓存结果
     */
    cacheResult(key, result) {
        if (this.cache.size >= this.maxCacheSize) {
            // 删除最旧的缓存项
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        this.cache.set(key, result);
    }

    /**
     * 清理缓存
     */
    clearCache() {
        this.cache.clear();
    }

    /**
     * 获取缓存统计
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            maxSize: this.maxCacheSize,
            keys: Array.from(this.cache.keys())
        };
    }
}

// 导出类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PaperReader;
} else if (typeof self !== 'undefined') {
    self.PaperReader = PaperReader;
}