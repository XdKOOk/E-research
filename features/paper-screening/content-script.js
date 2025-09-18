// 论文初筛功能 - Content Script
console.log('论文初筛Content Script已加载');

// 检测当前页面类型
const currentUrl = window.location.href;
const pageType = detectPaperSite(currentUrl);

console.log('当前论文网站类型:', pageType);

// 根据页面类型初始化相应的功能
switch (pageType) {
    case 'arxiv':
        initializeArxivSupport();
        break;
    case 'scholar':
        initializeScholarSupport();
        break;
    case 'semanticscholar':
        initializeSemanticScholarSupport();
        break;
    case 'pubmed':
        initializePubMedSupport();
        break;
    default:
        console.log('当前页面暂不支持论文初筛功能');
}

function detectPaperSite(url) {
    if (url.includes('arxiv.org')) return 'arxiv';
    if (url.includes('scholar.google.com')) return 'scholar';
    if (url.includes('semanticscholar.org')) return 'semanticscholar';
    if (url.includes('pubmed.ncbi.nlm.nih.gov')) return 'pubmed';
    if (url.includes('ieeexplore.ieee.org')) return 'ieee';
    if (url.includes('dl.acm.org')) return 'acm';
    return 'unknown';
}

function initializeArxivSupport() {
    console.log('初始化arXiv支持');
    
    // 监听来自background script的消息
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'extractPaperInfo') {
            const paperInfo = extractArxivPaperInfo();
            sendResponse({ success: true, data: paperInfo });
        } else if (request.action === 'startPaperScreening') {
            startPaperScreening();
            sendResponse({ success: true });
        }
    });
    
    // 添加论文初筛按钮
    addPaperScreeningButton();
}

function initializeScholarSupport() {
    console.log('初始化Google Scholar支持');
    
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'extractPaperInfo') {
            const paperInfo = extractScholarPaperInfo();
            sendResponse({ success: true, data: paperInfo });
        } else if (request.action === 'startPaperScreening') {
            startPaperScreening();
            sendResponse({ success: true });
        }
    });
    
    addPaperScreeningButton();
}

function initializeSemanticScholarSupport() {
    console.log('初始化Semantic Scholar支持');
    
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'extractPaperInfo') {
            const paperInfo = extractSemanticScholarPaperInfo();
            sendResponse({ success: true, data: paperInfo });
        } else if (request.action === 'startPaperScreening') {
            startPaperScreening();
            sendResponse({ success: true });
        }
    });
    
    addPaperScreeningButton();
}

function initializePubMedSupport() {
    console.log('初始化PubMed支持');
    
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'extractPaperInfo') {
            const paperInfo = extractPubMedPaperInfo();
            sendResponse({ success: true, data: paperInfo });
        } else if (request.action === 'startPaperScreening') {
            startPaperScreening();
            sendResponse({ success: true });
        }
    });
    
    addPaperScreeningButton();
}

function extractArxivPaperInfo() {
    try {
        const title = document.querySelector('h1.title')?.textContent?.trim();
        const authors = Array.from(document.querySelectorAll('.authors a'))
            .map(a => a.textContent.trim())
            .join(', ');
        const abstract = document.querySelector('.abstract')?.textContent?.trim();
        const categories = Array.from(document.querySelectorAll('.primary-subject'))
            .map(el => el.textContent.trim())
            .join(', ');
        const publishedDate = document.querySelector('.dateline')?.textContent?.trim();
        const pdfUrl = document.querySelector('a[href$=".pdf"]')?.href;
        
        return {
            title,
            authors,
            abstract,
            categories,
            publishedDate,
            pdfUrl,
            url: window.location.href,
            source: 'arxiv',
            doi: extractDOI(),
            keywords: extractKeywords()
        };
    } catch (error) {
        console.error('提取arXiv论文信息失败:', error);
        return null;
    }
}

function extractScholarPaperInfo() {
    try {
        const title = document.querySelector('#gs_res_ccl_mid h3 a')?.textContent?.trim();
        const authors = document.querySelector('.gs_a')?.textContent?.trim();
        const abstract = document.querySelector('.gs_rs')?.textContent?.trim();
        const citations = document.querySelector('.gs_fl a[href*="cites"]')?.textContent?.trim();
        const year = document.querySelector('.gs_a')?.textContent?.match(/\d{4}/)?.[0];
        
        return {
            title,
            authors,
            abstract,
            citations,
            year,
            url: window.location.href,
            source: 'scholar',
            doi: extractDOI(),
            keywords: extractKeywords()
        };
    } catch (error) {
        console.error('提取Google Scholar论文信息失败:', error);
        return null;
    }
}

function extractSemanticScholarPaperInfo() {
    try {
        const title = document.querySelector('[data-test-id="paper-title"]')?.textContent?.trim();
        const authors = Array.from(document.querySelectorAll('[data-test-id="author-name"]'))
            .map(a => a.textContent.trim())
            .join(', ');
        const abstract = document.querySelector('[data-test-id="abstract-text"]')?.textContent?.trim();
        const citations = document.querySelector('[data-test-id="citation-count"]')?.textContent?.trim();
        const year = document.querySelector('[data-test-id="paper-year"]')?.textContent?.trim();
        
        return {
            title,
            authors,
            abstract,
            citations,
            year,
            url: window.location.href,
            source: 'semanticscholar',
            doi: extractDOI(),
            keywords: extractKeywords()
        };
    } catch (error) {
        console.error('提取Semantic Scholar论文信息失败:', error);
        return null;
    }
}

function extractPubMedPaperInfo() {
    try {
        const title = document.querySelector('.abstract-title')?.textContent?.trim();
        const authors = Array.from(document.querySelectorAll('.authors-list a'))
            .map(a => a.textContent.trim())
            .join(', ');
        const abstract = document.querySelector('.abstract-content')?.textContent?.trim();
        const journal = document.querySelector('.journal-title')?.textContent?.trim();
        const year = document.querySelector('.cit')?.textContent?.match(/\d{4}/)?.[0];
        
        return {
            title,
            authors,
            abstract,
            journal,
            year,
            url: window.location.href,
            source: 'pubmed',
            doi: extractDOI(),
            keywords: extractKeywords()
        };
    } catch (error) {
        console.error('提取PubMed论文信息失败:', error);
        return null;
    }
}

function extractDOI() {
    // 尝试从页面中提取DOI
    const doiPattern = /10\.\d+\/[^\s]+/g;
    const pageText = document.body.textContent;
    const doiMatch = pageText.match(doiPattern);
    return doiMatch ? doiMatch[0] : null;
}

function extractKeywords() {
    // 尝试从页面中提取关键词
    const keywords = [];
    
    // 从meta标签中提取
    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords) {
        keywords.push(...metaKeywords.content.split(',').map(k => k.trim()));
    }
    
    // 从页面内容中提取常见的研究领域关键词
    const commonKeywords = [
        'machine learning', 'deep learning', 'neural network', 'artificial intelligence',
        'computer vision', 'natural language processing', 'reinforcement learning',
        'data mining', 'big data', 'blockchain', 'cybersecurity', 'robotics'
    ];
    
    const pageText = document.body.textContent.toLowerCase();
    commonKeywords.forEach(keyword => {
        if (pageText.includes(keyword)) {
            keywords.push(keyword);
        }
    });
    
    return [...new Set(keywords)]; // 去重
}

function addPaperScreeningButton() {
    // 在页面右上角添加论文初筛按钮
    const button = document.createElement('div');
    button.id = 'paper-screening-button';
    button.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 12px 16px;
        border-radius: 25px;
        font-size: 14px;
        font-weight: 500;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: transform 0.2s ease;
    `;
    button.innerHTML = '📄 论文初筛';
    
    // 添加悬停效果
    button.addEventListener('mouseenter', () => {
        button.style.transform = 'translateY(-2px)';
    });
    
    button.addEventListener('mouseleave', () => {
        button.style.transform = 'translateY(0)';
    });
    
    // 点击事件
    button.addEventListener('click', () => {
        startPaperScreening();
    });
    
    document.body.appendChild(button);
}

function startPaperScreening() {
    console.log('开始论文初筛');
    
    // 显示加载状态
    showLoadingState();
    
    // 提取论文信息
    const paperInfo = extractCurrentPaperInfo();
    
    if (paperInfo) {
        // 发送到background script进行处理
        chrome.runtime.sendMessage({
            action: 'processPaperScreening',
            data: paperInfo
        }, (response) => {
            hideLoadingState();
            if (response && response.success) {
                showScreeningResult(response.result);
            } else {
                showError('论文初筛失败，请重试');
            }
        });
    } else {
        hideLoadingState();
        showError('无法提取论文信息，请确保在支持的论文网站上');
    }
}

function extractCurrentPaperInfo() {
    const pageType = detectPaperSite(window.location.href);
    
    switch (pageType) {
        case 'arxiv':
            return extractArxivPaperInfo();
        case 'scholar':
            return extractScholarPaperInfo();
        case 'semanticscholar':
            return extractSemanticScholarPaperInfo();
        case 'pubmed':
            return extractPubMedPaperInfo();
        default:
            return null;
    }
}

function showLoadingState() {
    const button = document.getElementById('paper-screening-button');
    if (button) {
        button.innerHTML = '⏳ 分析中...';
        button.style.pointerEvents = 'none';
    }
}

function hideLoadingState() {
    const button = document.getElementById('paper-screening-button');
    if (button) {
        button.innerHTML = '📄 论文初筛';
        button.style.pointerEvents = 'auto';
    }
}

function showScreeningResult(result) {
    // 创建结果弹窗
    const modal = document.createElement('div');
    modal.id = 'paper-screening-result';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        z-index: 10001;
        display: flex;
        justify-content: center;
        align-items: center;
    `;
    
    const content = document.createElement('div');
    content.style.cssText = `
        background: white;
        border-radius: 12px;
        padding: 30px;
        max-width: 600px;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    `;
    
    content.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h2 style="margin: 0; color: #2c3e50;">📄 论文初筛结果</h2>
            <button id="close-result" style="background: none; border: none; font-size: 24px; cursor: pointer;">&times;</button>
        </div>
        <div id="result-content">
            <h3>📋 论文简介</h3>
            <p>${result.summary || '暂无简介'}</p>
            
            <h3>🎯 关注要点</h3>
            <ul>
                ${result.keyPoints ? result.keyPoints.map(point => `<li>${point}</li>`).join('') : '<li>暂无关注要点</li>'}
            </ul>
            
            <h3>📊 技术指标</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-top: 15px;">
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 24px; font-weight: bold; color: #667eea;">${result.innovationScore || 'N/A'}</div>
                    <div style="font-size: 12px; color: #666;">创新性评分</div>
                </div>
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 24px; font-weight: bold; color: #28a745;">${result.practicalScore || 'N/A'}</div>
                    <div style="font-size: 12px; color: #666;">实用性评分</div>
                </div>
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 24px; font-weight: bold; color: #ffc107;">${result.impactScore || 'N/A'}</div>
                    <div style="font-size: 12px; color: #666;">影响力评分</div>
                </div>
            </div>
            
            <h3>🔍 相关研究</h3>
            <p>${result.relatedWork || '暂无相关研究信息'}</p>
            
            <div style="margin-top: 20px; text-align: center;">
                <button id="save-result" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; margin-right: 10px;">💾 保存结果</button>
                <button id="export-result" style="background: #28a745; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer;">📤 导出</button>
            </div>
        </div>
    `;
    
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    // 添加事件监听器
    document.getElementById('close-result').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    document.getElementById('save-result').addEventListener('click', () => {
        saveScreeningResult(result);
    });
    
    document.getElementById('export-result').addEventListener('click', () => {
        exportScreeningResult(result);
    });
    
    // 点击背景关闭
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
}

function showError(message) {
    const button = document.getElementById('paper-screening-button');
    if (button) {
        const originalText = button.innerHTML;
        button.innerHTML = '❌ 失败';
        button.style.background = '#dc3545';
        
        setTimeout(() => {
            button.innerHTML = originalText;
            button.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        }, 3000);
    }
    
    // 显示错误提示
    alert(message);
}

function saveScreeningResult(result) {
    // 保存到本地存储
    chrome.storage.local.get(['screeningResults'], (data) => {
        const results = data.screeningResults || [];
        results.push({
            ...result,
            timestamp: new Date().toISOString(),
            url: window.location.href
        });
        
        chrome.storage.local.set({ screeningResults: results }, () => {
            alert('结果已保存！');
        });
    });
}

function exportScreeningResult(result) {
    // 导出为JSON文件
    const dataStr = JSON.stringify(result, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `paper-screening-${Date.now()}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
}

// 页面加载完成后的初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePaperScreening);
} else {
    initializePaperScreening();
}

function initializePaperScreening() {
    // 添加页面标识
    document.body.setAttribute('data-paper-screening', 'enabled');
    
    // 根据页面类型添加相应的UI元素
    if (pageType !== 'unknown') {
        addPaperScreeningButton();
    }
}
