// 测试版Popup脚本
document.addEventListener('DOMContentLoaded', function() {
    console.log('测试版Popup已加载');
    
    // 绑定测试按钮
    document.getElementById('test-connection').addEventListener('click', testConnection);
    document.getElementById('test-message').addEventListener('click', testMessage);
    document.getElementById('test-paper-screening').addEventListener('click', testPaperScreening);
    
    // 显示调试信息
    showDebugInfo();
});

function showDebugInfo() {
    const debugInfo = document.getElementById('debug-info');
    debugInfo.innerHTML = `
        <div>Chrome版本: ${navigator.userAgent}</div>
        <div>扩展ID: ${chrome.runtime.id}</div>
        <div>时间: ${new Date().toLocaleString()}</div>
    `;
}

function testConnection() {
    const status = document.getElementById('connection-status');
    status.innerHTML = '<div class="info">正在测试连接...</div>';
    
    // 测试chrome.runtime是否可用
    if (typeof chrome === 'undefined' || !chrome.runtime) {
        status.innerHTML = '<div class="error">❌ chrome.runtime不可用</div>';
        return;
    }
    
    // 测试发送消息
    chrome.runtime.sendMessage({ action: 'test' }, function(response) {
        if (chrome.runtime.lastError) {
            status.innerHTML = `<div class="error">❌ 连接失败: ${chrome.runtime.lastError.message}</div>`;
        } else if (response && response.success) {
            status.innerHTML = '<div class="success">✅ 连接成功</div>';
        } else {
            status.innerHTML = '<div class="error">❌ 连接失败: 无响应</div>';
        }
    });
}

function testMessage() {
    const status = document.getElementById('connection-status');
    status.innerHTML = '<div class="info">正在测试消息传递...</div>';
    
    chrome.runtime.sendMessage({ 
        action: 'test',
        data: { test: 'message' }
    }, function(response) {
        if (chrome.runtime.lastError) {
            status.innerHTML = `<div class="error">❌ 消息传递失败: ${chrome.runtime.lastError.message}</div>`;
        } else {
            status.innerHTML = `<div class="success">✅ 消息传递成功: ${JSON.stringify(response)}</div>`;
        }
    });
}

function testPaperScreening() {
    const status = document.getElementById('feature-status');
    const button = document.getElementById('test-paper-screening');
    
    status.innerHTML = '<div class="info">正在测试论文初筛功能...</div>';
    button.disabled = true;
    button.textContent = '测试中...';
    
    const startTime = Date.now();
    
    chrome.runtime.sendMessage({
        action: 'startFeature',
        feature: 'paper-screening',
        config: {
            keywords: 'agent benchmark',
            sources: 'arxiv',
            maxResults: 3
        }
    }, function(response) {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        button.disabled = false;
        button.textContent = '测试论文初筛';
        
        if (chrome.runtime.lastError) {
            status.innerHTML = `<div class="error">❌ 论文初筛失败: ${chrome.runtime.lastError.message}</div>`;
        } else if (response && response.success) {
            status.innerHTML = `<div class="success">✅ 论文初筛成功 (${duration}ms)<br>${response.message}</div>`;
        } else {
            status.innerHTML = `<div class="error">❌ 论文初筛失败: ${response ? response.error : '无响应'}</div>`;
        }
    });
}
