// 前沿探索工作流 - Content Script
console.log('前沿探索工作流Content Script已加载');

// 检测当前页面类型
const currentUrl = window.location.href;
const pageType = detectPageType(currentUrl);

console.log('当前页面类型:', pageType);

// 根据页面类型初始化相应的功能
switch (pageType) {
    case 'arxiv':
        initializeArxivSupport();
        break;
    case 'github':
        initializeGithubSupport();
        break;
    case 'scholar':
        initializeScholarSupport();
        break;
    default:
        console.log('当前页面暂不支持自动功能');
}

function detectPageType(url) {
    if (url.includes('arxiv.org')) return 'arxiv';
    if (url.includes('github.com')) return 'github';
    if (url.includes('scholar.google.com')) return 'scholar';
    if (url.includes('semanticscholar.org')) return 'semanticscholar';
    return 'unknown';
}

function initializeArxivSupport() {
    console.log('初始化arXiv支持');
    
    // 监听来自background script的消息
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'extractPaperInfo') {
            const paperInfo = extractArxivPaperInfo();
            sendResponse({ success: true, data: paperInfo });
        }
    });
}

function initializeGithubSupport() {
    console.log('初始化GitHub支持');
    
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'extractRepoInfo') {
            const repoInfo = extractGithubRepoInfo();
            sendResponse({ success: true, data: repoInfo });
        }
    });
}

function initializeScholarSupport() {
    console.log('初始化Google Scholar支持');
    
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'extractPaperInfo') {
            const paperInfo = extractScholarPaperInfo();
            sendResponse({ success: true, data: paperInfo });
        }
    });
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
        
        return {
            title,
            authors,
            abstract,
            categories,
            url: window.location.href,
            source: 'arxiv'
        };
    } catch (error) {
        console.error('提取arXiv论文信息失败:', error);
        return null;
    }
}

function extractGithubRepoInfo() {
    try {
        const repoName = document.querySelector('h1[data-pjax="#js-repo-pjax-container"] strong a')?.textContent?.trim();
        const owner = document.querySelector('h1[data-pjax="#js-repo-pjax-container"] span a")?.textContent?.trim();
        const description = document.querySelector('meta[name="description"]')?.getAttribute('content');
        const language = document.querySelector('.repository-content .f6 .text-gray-dark')?.textContent?.trim();
        const stars = document.querySelector('#repo-stars-counter-star')?.getAttribute('title');
        const forks = document.querySelector('#repo-network-counter')?.getAttribute('title');
        
        return {
            name: repoName,
            owner,
            description,
            language,
            stars,
            forks,
            url: window.location.href,
            source: 'github'
        };
    } catch (error) {
        console.error('提取GitHub仓库信息失败:', error);
        return null;
    }
}

function extractScholarPaperInfo() {
    try {
        const title = document.querySelector('#gs_res_ccl_mid h3 a')?.textContent?.trim();
        const authors = document.querySelector('.gs_a')?.textContent?.trim();
        const abstract = document.querySelector('.gs_rs')?.textContent?.trim();
        
        return {
            title,
            authors,
            abstract,
            url: window.location.href,
            source: 'scholar'
        };
    } catch (error) {
        console.error('提取Google Scholar论文信息失败:', error);
        return null;
    }
}

// 页面加载完成后的初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePage);
} else {
    initializePage();
}

function initializePage() {
    // 添加页面标识，便于其他脚本识别
    document.body.setAttribute('data-research-workflow', 'enabled');
    
    // 根据页面类型添加相应的UI元素
    addPageIndicator();
}

function addPageIndicator() {
    // 在页面右上角添加工作流状态指示器
    const indicator = document.createElement('div');
    indicator.id = 'research-workflow-indicator';
    indicator.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 8px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 500;
        z-index: 10000;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        cursor: pointer;
    `;
    indicator.textContent = '🔬 研究助手';
    
    // 点击指示器显示功能菜单
    indicator.addEventListener('click', showFeatureMenu);
    
    document.body.appendChild(indicator);
}

function showFeatureMenu() {
    // 创建功能菜单
    const menu = document.createElement('div');
    menu.id = 'research-workflow-menu';
    menu.style.cssText = `
        position: fixed;
        top: 60px;
        right: 20px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        padding: 10px 0;
        z-index: 10001;
        min-width: 200px;
    `;
    
    const features = [
        { name: '论文初筛', icon: '📄', action: 'paper-screening' },
        { name: 'Github调研', icon: '🔍', action: 'github-research' },
        { name: '开源追踪', icon: '📊', action: 'open-source-tracking' }
    ];
    
    features.forEach(feature => {
        const item = document.createElement('div');
        item.style.cssText = `
            padding: 10px 15px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 14px;
        `;
        item.innerHTML = `${feature.icon} ${feature.name}`;
        
        item.addEventListener('click', () => {
            chrome.runtime.sendMessage({
                action: 'startFeature',
                feature: feature.action
            });
            document.body.removeChild(menu);
        });
        
        item.addEventListener('mouseenter', () => {
            item.style.backgroundColor = '#f5f5f5';
        });
        
        item.addEventListener('mouseleave', () => {
            item.style.backgroundColor = 'transparent';
        });
        
        menu.appendChild(item);
    });
    
    // 点击外部关闭菜单
    const closeMenu = (e) => {
        if (!menu.contains(e.target) && e.target.id !== 'research-workflow-indicator') {
            document.body.removeChild(menu);
            document.removeEventListener('click', closeMenu);
        }
    };
    
    setTimeout(() => {
        document.addEventListener('click', closeMenu);
    }, 100);
    
    document.body.appendChild(menu);
}
