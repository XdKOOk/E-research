// 前沿探索工作流 - Background Service Worker
console.log('前沿探索工作流Background Service Worker已启动');

// 监听来自popup的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('收到消息:', request);
    
    switch (request.action) {
        case 'startFeature':
            handleStartFeature(request.feature, sendResponse);
            break;
        case 'getTaskStatus':
            handleGetTaskStatus(sendResponse);
            break;
        default:
            sendResponse({ success: false, error: '未知操作' });
    }
    
    return true; // 保持消息通道开放
});

function handleStartFeature(feature, sendResponse) {
    console.log(`启动功能: ${feature}`);
    
    // 根据功能类型执行不同的逻辑
    switch (feature) {
        case 'paper-screening':
            startPaperScreening(sendResponse);
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

function startPaperScreening(sendResponse) {
    // 论文初筛功能
    console.log('启动论文初筛功能');
    
    // 获取当前标签页
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
            const currentTab = tabs[0];
            
            // 检查是否在支持的网站
            if (isSupportedPaperSite(currentTab.url)) {
                // 注入content script
                chrome.scripting.executeScript({
                    target: { tabId: currentTab.id },
                    files: ['features/paper-screening/content-script.js']
                }).then(() => {
                    updateTaskStatus('论文初筛任务已启动');
                    sendResponse({ success: true, message: '论文初筛任务已启动' });
                }).catch((error) => {
                    console.error('注入脚本失败:', error);
                    sendResponse({ success: false, error: '脚本注入失败' });
                });
            } else {
                sendResponse({ 
                    success: false, 
                    error: '请在支持的论文网站（如arXiv、Google Scholar等）上使用此功能' 
                });
            }
        }
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
            modelProvider: 'default'
        }
    });
});
