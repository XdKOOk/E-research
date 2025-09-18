// 论文工具函数
class PaperUtils {
    /**
     * 格式化论文数据
     * @param {Object} paperData - 原始论文数据
     * @returns {Object} 格式化后的论文数据
     */
    static formatPaperData(paperData) {
        return {
            id: paperData.id || this.generateId(),
            title: this.cleanText(paperData.title || ''),
            authors: this.formatAuthors(paperData.authors || []),
            abstract: this.cleanText(paperData.abstract || ''),
            year: this.extractYear(paperData.year || paperData.publishedDate),
            source: paperData.source || 'unknown',
            url: paperData.url || '',
            pdfUrl: paperData.pdfUrl || '',
            doi: paperData.doi || '',
            citationCount: parseInt(paperData.citationCount) || 0,
            categories: Array.isArray(paperData.categories) ? paperData.categories : [],
            keywords: Array.isArray(paperData.keywords) ? paperData.keywords : [],
            timestamp: new Date().toISOString()
        };
    }

    /**
     * 格式化作者信息
     * @param {Array|string} authors - 作者信息
     * @returns {Array} 格式化后的作者列表
     */
    static formatAuthors(authors) {
        if (typeof authors === 'string') {
            return authors.split(',').map(author => ({
                name: this.cleanText(author),
                affiliation: '',
                email: ''
            }));
        }
        
        if (Array.isArray(authors)) {
            return authors.map(author => {
                if (typeof author === 'string') {
                    return {
                        name: this.cleanText(author),
                        affiliation: '',
                        email: ''
                    };
                }
                return {
                    name: this.cleanText(author.name || ''),
                    affiliation: this.cleanText(author.affiliation || ''),
                    email: author.email || ''
                };
            });
        }
        
        return [];
    }

    /**
     * 清理文本
     * @param {string} text - 原始文本
     * @returns {string} 清理后的文本
     */
    static cleanText(text) {
        if (!text) return '';
        
        return text
            .replace(/\s+/g, ' ') // 合并多个空格
            .replace(/\n+/g, ' ') // 替换换行符
            .replace(/\t+/g, ' ') // 替换制表符
            .trim();
    }

    /**
     * 提取年份
     * @param {string|number} dateInput - 日期输入
     * @returns {number|null} 年份
     */
    static extractYear(dateInput) {
        if (!dateInput) return null;
        
        if (typeof dateInput === 'number') {
            return dateInput;
        }
        
        const yearMatch = dateInput.toString().match(/\d{4}/);
        return yearMatch ? parseInt(yearMatch[0]) : null;
    }

    /**
     * 生成唯一ID
     * @returns {string} 唯一ID
     */
    static generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * 验证论文数据完整性
     * @param {Object} paperData - 论文数据
     * @returns {Object} 验证结果
     */
    static validatePaperData(paperData) {
        const errors = [];
        const warnings = [];
        
        // 必需字段检查
        if (!paperData.title || paperData.title.trim().length === 0) {
            errors.push('论文标题不能为空');
        }
        
        if (!paperData.authors || paperData.authors.length === 0) {
            errors.push('作者信息不能为空');
        }
        
        if (!paperData.abstract || paperData.abstract.trim().length === 0) {
            warnings.push('缺少论文摘要');
        }
        
        if (!paperData.url) {
            warnings.push('缺少论文链接');
        }
        
        // 数据质量检查
        if (paperData.title && paperData.title.length < 10) {
            warnings.push('论文标题过短，可能不完整');
        }
        
        if (paperData.abstract && paperData.abstract.length < 50) {
            warnings.push('论文摘要过短，可能不完整');
        }
        
        if (paperData.year && (paperData.year < 1900 || paperData.year > new Date().getFullYear() + 1)) {
            warnings.push('发表年份异常');
        }
        
        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * 计算论文相似度
     * @param {Object} paper1 - 论文1
     * @param {Object} paper2 - 论文2
     * @returns {number} 相似度 (0-1)
     */
    static calculateSimilarity(paper1, paper2) {
        const title1 = (paper1.title || '').toLowerCase();
        const title2 = (paper2.title || '').toLowerCase();
        const abstract1 = (paper1.abstract || '').toLowerCase();
        const abstract2 = (paper2.abstract || '').toLowerCase();
        
        // 标题相似度
        const titleSimilarity = this.calculateTextSimilarity(title1, title2);
        
        // 摘要相似度
        const abstractSimilarity = this.calculateTextSimilarity(abstract1, abstract2);
        
        // 作者相似度
        const authorSimilarity = this.calculateAuthorSimilarity(paper1.authors, paper2.authors);
        
        // 加权平均
        return (titleSimilarity * 0.4 + abstractSimilarity * 0.4 + authorSimilarity * 0.2);
    }

    /**
     * 计算文本相似度
     * @param {string} text1 - 文本1
     * @param {string} text2 - 文本2
     * @returns {number} 相似度 (0-1)
     */
    static calculateTextSimilarity(text1, text2) {
        if (!text1 || !text2) return 0;
        
        const words1 = this.tokenize(text1);
        const words2 = this.tokenize(text2);
        
        const intersection = words1.filter(word => words2.includes(word));
        const union = [...new Set([...words1, ...words2])];
        
        return intersection.length / union.length;
    }

    /**
     * 计算作者相似度
     * @param {Array} authors1 - 作者列表1
     * @param {Array} authors2 - 作者列表2
     * @returns {number} 相似度 (0-1)
     */
    static calculateAuthorSimilarity(authors1, authors2) {
        if (!authors1 || !authors2 || authors1.length === 0 || authors2.length === 0) {
            return 0;
        }
        
        const names1 = authors1.map(author => 
            typeof author === 'string' ? author.toLowerCase() : author.name.toLowerCase()
        );
        const names2 = authors2.map(author => 
            typeof author === 'string' ? author.toLowerCase() : author.name.toLowerCase()
        );
        
        const intersection = names1.filter(name => names2.includes(name));
        const union = [...new Set([...names1, ...names2])];
        
        return intersection.length / union.length;
    }

    /**
     * 分词
     * @param {string} text - 文本
     * @returns {Array} 词汇列表
     */
    static tokenize(text) {
        return text
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 2);
    }

    /**
     * 提取关键词
     * @param {string} text - 文本
     * @param {number} maxKeywords - 最大关键词数量
     * @returns {Array} 关键词列表
     */
    static extractKeywords(text, maxKeywords = 10) {
        if (!text) return [];
        
        const words = this.tokenize(text);
        const wordFreq = {};
        
        // 计算词频
        words.forEach(word => {
            wordFreq[word] = (wordFreq[word] || 0) + 1;
        });
        
        // 过滤停用词
        const stopWords = new Set([
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
            'this', 'that', 'these', 'those', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
            'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
            'can', 'may', 'might', 'must', 'shall', 'from', 'as', 'we', 'you', 'they', 'it'
        ]);
        
        const filteredWords = Object.keys(wordFreq)
            .filter(word => !stopWords.has(word) && word.length > 3)
            .sort((a, b) => wordFreq[b] - wordFreq[a])
            .slice(0, maxKeywords);
        
        return filteredWords;
    }

    /**
     * 格式化日期
     * @param {string|Date} date - 日期
     * @param {string} format - 格式
     * @returns {string} 格式化后的日期
     */
    static formatDate(date, format = 'YYYY-MM-DD') {
        if (!date) return '';
        
        const d = new Date(date);
        if (isNaN(d.getTime())) return '';
        
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        
        switch (format) {
            case 'YYYY-MM-DD':
                return `${year}-${month}-${day}`;
            case 'MM/DD/YYYY':
                return `${month}/${day}/${year}`;
            case 'DD/MM/YYYY':
                return `${day}/${month}/${year}`;
            case 'YYYY年MM月DD日':
                return `${year}年${month}月${day}日`;
            default:
                return d.toLocaleDateString();
        }
    }

    /**
     * 格式化引用次数
     * @param {number} count - 引用次数
     * @returns {string} 格式化后的引用次数
     */
    static formatCitationCount(count) {
        if (!count || count === 0) return '0';
        
        if (count < 1000) {
            return count.toString();
        } else if (count < 1000000) {
            return (count / 1000).toFixed(1) + 'K';
        } else {
            return (count / 1000000).toFixed(1) + 'M';
        }
    }

    /**
     * 获取论文质量评分
     * @param {Object} paperData - 论文数据
     * @returns {number} 质量评分 (0-100)
     */
    static getPaperQualityScore(paperData) {
        let score = 0;
        
        // 标题质量 (20分)
        if (paperData.title && paperData.title.length > 10) {
            score += 20;
        }
        
        // 摘要质量 (20分)
        if (paperData.abstract && paperData.abstract.length > 100) {
            score += 20;
        }
        
        // 作者信息 (15分)
        if (paperData.authors && paperData.authors.length > 0) {
            score += 15;
        }
        
        // 发表年份 (10分)
        if (paperData.year && paperData.year > 2000) {
            score += 10;
        }
        
        // 引用次数 (15分)
        if (paperData.citationCount > 0) {
            score += Math.min(15, paperData.citationCount / 10);
        }
        
        // 来源可靠性 (10分)
        const reliableSources = ['arxiv', 'ieee', 'acm', 'springer', 'elsevier'];
        if (reliableSources.some(source => paperData.source.toLowerCase().includes(source))) {
            score += 10;
        }
        
        // DOI存在 (10分)
        if (paperData.doi) {
            score += 10;
        }
        
        return Math.min(100, Math.round(score));
    }

    /**
     * 生成论文摘要
     * @param {Object} paperData - 论文数据
     * @param {number} maxLength - 最大长度
     * @returns {string} 生成的摘要
     */
    static generateSummary(paperData, maxLength = 200) {
        if (!paperData.abstract) {
            return '暂无摘要信息';
        }
        
        if (paperData.abstract.length <= maxLength) {
            return paperData.abstract;
        }
        
        // 在句号处截断
        const sentences = paperData.abstract.split(/[.!?]+/);
        let summary = '';
        
        for (const sentence of sentences) {
            if (summary.length + sentence.length > maxLength) {
                break;
            }
            summary += sentence + '.';
        }
        
        return summary || paperData.abstract.substring(0, maxLength) + '...';
    }

    /**
     * 检查论文是否重复
     * @param {Object} newPaper - 新论文
     * @param {Array} existingPapers - 现有论文列表
     * @param {number} threshold - 相似度阈值
     * @returns {Object} 重复检查结果
     */
    static checkDuplicates(newPaper, existingPapers, threshold = 0.8) {
        const duplicates = [];
        
        existingPapers.forEach((existingPaper, index) => {
            const similarity = this.calculateSimilarity(newPaper, existingPaper);
            if (similarity >= threshold) {
                duplicates.push({
                    paper: existingPaper,
                    index,
                    similarity
                });
            }
        });
        
        return {
            hasDuplicates: duplicates.length > 0,
            duplicates: duplicates.sort((a, b) => b.similarity - a.similarity)
        };
    }

    /**
     * 导出论文数据
     * @param {Array} papers - 论文列表
     * @param {string} format - 导出格式
     * @returns {string} 导出的数据
     */
    static exportPapers(papers, format = 'json') {
        switch (format.toLowerCase()) {
            case 'json':
                return JSON.stringify(papers, null, 2);
            case 'csv':
                return this.exportToCSV(papers);
            case 'bibtex':
                return this.exportToBibTeX(papers);
            default:
                return JSON.stringify(papers, null, 2);
        }
    }

    /**
     * 导出为CSV格式
     * @param {Array} papers - 论文列表
     * @returns {string} CSV数据
     */
    static exportToCSV(papers) {
        if (papers.length === 0) return '';
        
        const headers = ['Title', 'Authors', 'Year', 'Source', 'Citation Count', 'URL', 'DOI'];
        const rows = papers.map(paper => [
            paper.title || '',
            Array.isArray(paper.authors) ? paper.authors.map(a => a.name || a).join('; ') : paper.authors || '',
            paper.year || '',
            paper.source || '',
            paper.citationCount || 0,
            paper.url || '',
            paper.doi || ''
        ]);
        
        const csvContent = [headers, ...rows]
            .map(row => row.map(field => `"${field}"`).join(','))
            .join('\n');
        
        return csvContent;
    }

    /**
     * 导出为BibTeX格式
     * @param {Array} papers - 论文列表
     * @returns {string} BibTeX数据
     */
    static exportToBibTeX(papers) {
        return papers.map(paper => {
            const bibtex = `@article{${paper.id || 'paper'},\n`;
            const fields = [
                `  title = {${paper.title || ''}},\n`,
                `  author = {${Array.isArray(paper.authors) ? paper.authors.map(a => a.name || a).join(' and ') : paper.authors || ''}},\n`,
                `  year = {${paper.year || ''}},\n`,
                `  journal = {${paper.source || ''}},\n`,
                paper.url ? `  url = {${paper.url}},\n` : '',
                paper.doi ? `  doi = {${paper.doi}},\n` : ''
            ].filter(field => field);
            
            return bibtex + fields.join('') + '}';
        }).join('\n\n');
    }
}

// 导出工具类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PaperUtils;
} else {
    window.PaperUtils = PaperUtils;
}
