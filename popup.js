// 前沿探索工作流 - Popup脚本
document.addEventListener('DOMContentLoaded', function() {
    // 初始化界面
    initializePopup();
    
    // 绑定事件监听器
    bindEventListeners();
    
    // 加载任务状态
    loadTaskStatus();
});

function initializePopup() {
    console.log('前沿探索工作流插件已加载');
}

function bindEventListeners() {
    // 功能按钮点击事件
    const featureButtons = document.querySelectorAll('.feature-btn');
    featureButtons.forEach(button => {
        button.addEventListener('click', function() {
            const feature = this.getAttribute('data-feature');
            handleFeatureClick(feature);
        });
    });
    
    // 设置按钮点击事件
    const settingsBtn = document.getElementById('settings-btn');
    settingsBtn.addEventListener('click', function() {
        openSettings();
    });
}

function handleFeatureClick(feature) {
    console.log(`启动功能: ${feature}`);
    
    // 获取搜索配置
    const searchConfig = getSearchConfig();
    
    // 更新按钮状态
    const button = document.querySelector(`[data-feature="${feature}"]`);
    const originalText = button.textContent;
    button.textContent = '启动中...';
    button.disabled = true;
    
    // 发送消息到background script
    chrome.runtime.sendMessage({
        action: 'startFeature',
        feature: feature,
        config: searchConfig
    }, function(response) {
        // 恢复按钮状态
        button.textContent = originalText;
        button.disabled = false;
        
        if (response && response.success) {
            updateStatus(`${getFeatureName(feature)}任务已启动`);
        } else {
            updateStatus(`${getFeatureName(feature)}任务启动失败`);
        }
    });
}

function getSearchConfig() {
    return {
        keywords: document.getElementById('searchKeywords').value,
        sources: document.getElementById('searchSources').value,
        maxResults: parseInt(document.getElementById('maxResults').value)
    };
}

function getFeatureName(feature) {
    const names = {
        'paper-screening': '论文初筛',
        'github-research': 'Github调研',
        'open-source-tracking': '开源追踪'
    };
    return names[feature] || feature;
}

function updateStatus(message) {
    const statusList = document.getElementById('status-list');
    const statusItem = document.createElement('div');
    statusItem.className = 'status-item';
    statusItem.innerHTML = `
        <span class="status-text">${new Date().toLocaleTimeString()} - ${message}</span>
    `;
    
    // 插入到列表顶部
    statusList.insertBefore(statusItem, statusList.firstChild);
    
    // 限制状态列表长度
    const items = statusList.querySelectorAll('.status-item');
    if (items.length > 5) {
        statusList.removeChild(items[items.length - 1]);
    }
}

function loadTaskStatus() {
    // 从storage加载任务状态
    chrome.storage.local.get(['taskStatus'], function(result) {
        if (result.taskStatus) {
            const statusList = document.getElementById('status-list');
            statusList.innerHTML = '';
            
            result.taskStatus.forEach(status => {
                const statusItem = document.createElement('div');
                statusItem.className = 'status-item';
                statusItem.innerHTML = `
                    <span class="status-text">${status.time} - ${status.message}</span>
                `;
                statusList.appendChild(statusItem);
            });
        }
    });
}

function openSettings() {
    // 打开设置页面或显示设置选项
    chrome.tabs.create({
        url: chrome.runtime.getURL('settings.html')
    });
}

// 豆包API已内置，无需手动配置

// 监听来自background script的消息
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'updateStatus') {
        updateStatus(request.message);
    }
});
