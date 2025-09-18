// 简化的Background Script用于测试
console.log('简化版Background Script已启动');

// 监听来自popup的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('收到消息:', request);
    
    switch (request.action) {
        case 'startFeature':
            handleStartFeature(request.feature, request.config, sendResponse);
            break;
        case 'test':
            sendResponse({ success: true, message: '后台脚本正常工作' });
            break;
        default:
            sendResponse({ success: false, error: '未知操作' });
    }
    
    return true; // 保持消息通道开放
});

function handleStartFeature(feature, config, sendResponse) {
    console.log(`启动功能: ${feature}`, config);
    
    if (feature === 'paper-screening') {
        // 使用简化的论文初筛功能
        startSimplePaperScreening(config, sendResponse);
    } else {
        sendResponse({ success: false, error: '功能暂未实现' });
    }
}

function startSimplePaperScreening(config, sendResponse) {
    console.log('启动简化版论文初筛功能', config);
    
    try {
        // 模拟论文数据
        const mockPapers = [
            {
                title: "Agent Benchmark: A Comprehensive Evaluation Framework",
                authors: ["Research Team A", "Research Team B"],
                abstract: "This paper presents a comprehensive benchmark for evaluating agent performance across multiple domains and tasks.",
                source: 'arxiv',
                url: 'https://arxiv.org/abs/2401.00001'
            },
            {
                title: "Multi-Agent Systems: Evaluation and Beyond",
                authors: ["AI Researcher", "ML Expert"],
                abstract: "We propose a novel approach to multi-agent system evaluation using agent benchmarks as a foundation.",
                source: 'arxiv',
                url: 'https://arxiv.org/abs/2401.00002'
            }
        ];
        
        // 模拟分析结果
        const analysisResults = mockPapers.map(paper => ({
            ...paper,
            analysis: {
                summary: `这是一篇关于${paper.title}的研究论文，提出了新的评估方法。`,
                keyPoints: [
                    '提出了新的评估框架',
                    '包含多个评估维度',
                    '提供了标准化测试协议'
                ],
                innovationScore: 8,
                practicalScore: 7,
                impactScore: 9,
                relatedWork: '与现有研究相比，提供了更全面的评估方法',
                methodology: '使用多维度评估指标和标准化测试协议',
                limitations: '评估范围有限，需要更多实际应用验证'
            },
            timestamp: new Date().toISOString()
        }));
        
        // 保存结果
        chrome.storage.local.set({ 
            analysisResults: analysisResults,
            lastUpdate: new Date().toISOString()
        }, () => {
            console.log('结果已保存');
        });
        
        // 显示结果
        showSimpleResults(analysisResults);
        
        sendResponse({ 
            success: true, 
            message: `论文初筛完成，分析了${analysisResults.length}篇论文`,
            results: analysisResults
        });
        
    } catch (error) {
        console.error('简化版论文初筛失败:', error);
        sendResponse({ 
            success: false, 
            error: `论文初筛失败: ${error.message}`
        });
    }
}

function showSimpleResults(results) {
    // 创建简单的结果显示页面
    const resultsHtml = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>论文初筛结果</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .paper-card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
        .paper-title { font-size: 18px; font-weight: bold; color: #2c3e50; margin-bottom: 10px; }
        .paper-meta { color: #666; margin-bottom: 15px; }
        .analysis-section { margin-top: 15px; }
        .score { display: inline-block; padding: 4px 8px; border-radius: 4px; margin-right: 10px; }
        .score.innovation { background: #e3f2fd; color: #1976d2; }
        .score.practical { background: #e8f5e8; color: #388e3c; }
        .score.impact { background: #fff3e0; color: #f57c00; }
        .key-points { list-style-type: disc; margin-left: 20px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>📄 论文初筛结果</h1>
        <p>共分析了 ${results.length} 篇论文</p>
    </div>
    
    ${results.map(paper => `
        <div class="paper-card">
            <div class="paper-title">${paper.title}</div>
            <div class="paper-meta">
                作者: ${paper.authors.join(', ')} | 
                来源: ${paper.source} | 
                时间: ${new Date(paper.timestamp).toLocaleString()}
            </div>
            
            <div class="analysis-section">
                <h3>📋 论文简介</h3>
                <p>${paper.analysis.summary}</p>
                
                <h3>🎯 关注要点</h3>
                <ul class="key-points">
                    ${paper.analysis.keyPoints.map(point => `<li>${point}</li>`).join('')}
                </ul>
                
                <h3>📊 评分</h3>
                <span class="score innovation">创新性: ${paper.analysis.innovationScore}/10</span>
                <span class="score practical">实用性: ${paper.analysis.practicalScore}/10</span>
                <span class="score impact">影响力: ${paper.analysis.impactScore}/10</span>
                
                <h3>🔍 相关研究</h3>
                <p>${paper.analysis.relatedWork}</p>
                
                <h3>⚙️ 方法论</h3>
                <p>${paper.analysis.methodology}</p>
                
                <h3>⚠️ 局限性</h3>
                <p>${paper.analysis.limitations}</p>
            </div>
        </div>
    `).join('')}
</body>
</html>
    `;
    
    // 使用data URL而不是blob URL
    const dataUrl = 'data:text/html;charset=utf-8,' + encodeURIComponent(resultsHtml);
    
    chrome.tabs.create({ url: dataUrl });
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
            modelProvider: 'openrouter',
            apiKey: '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',
            model: 'openai/gpt-4o'
        }
    });
});
