// API密钥测试脚本
const API_KEY = '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';

// 测试OpenAI API连接
async function testOpenAIAPI() {
    console.log('测试OpenAI API连接...');
    
    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: '你是一个专业的学术论文分析助手。'
                    },
                    {
                        role: 'user',
                        content: '请简单介绍一下机器学习的基本概念。'
                    }
                ],
                max_tokens: 100,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            throw new Error(`API错误: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();
        console.log('✅ OpenAI API连接成功！');
        console.log('响应:', data.choices[0].message.content);
        
        return {
            success: true,
            message: 'API连接成功',
            data: data
        };
        
    } catch (error) {
        console.error('❌ OpenAI API连接失败:', error);
        return {
            success: false,
            message: error.message,
            error: error
        };
    }
}

// 测试论文分析功能
async function testPaperAnalysis() {
    console.log('测试论文分析功能...');
    
    const testPaperData = {
        title: "Attention Is All You Need",
        authors: ["Ashish Vaswani", "Noam Shazeer", "Niki Parmar"],
        abstract: "The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. The best performing models also connect the encoder and decoder through an attention mechanism. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely.",
        source: "arxiv",
        year: 2017,
        url: "https://arxiv.org/abs/1706.03762"
    };

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: '你是一个专业的学术论文分析专家，擅长分析各种领域的学术论文并提供深入的分析报告。请始终以JSON格式返回分析结果。'
                    },
                    {
                        role: 'user',
                        content: `
请分析以下论文，并提供详细的初筛报告：

论文标题: ${testPaperData.title}
作者: ${testPaperData.authors.join(', ')}
摘要: ${testPaperData.abstract}
来源: ${testPaperData.source}
发表年份: ${testPaperData.year}

请从以下维度进行分析，并以JSON格式返回结果：

1. summary (论文简介): 用2-3句话概括论文的核心贡献
2. keyPoints (关注要点): 列出3-5个最重要的技术要点
3. innovationScore (创新性评分): 1-10分
4. practicalScore (实用性评分): 1-10分
5. impactScore (影响力评分): 1-10分
6. relatedWork (相关研究): 简要说明与现有研究的关系
7. methodology (方法论): 主要采用的研究方法
8. limitations (局限性): 论文的主要局限性

请确保返回的JSON格式正确。
`
                    }
                ],
                max_tokens: 1000,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            throw new Error(`API错误: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;
        
        console.log('✅ 论文分析测试成功！');
        console.log('分析结果:', content);
        
        // 尝试解析JSON
        try {
            const analysisResult = JSON.parse(content);
            console.log('✅ JSON解析成功:', analysisResult);
        } catch (e) {
            console.log('⚠️ JSON解析失败，但API调用成功');
        }
        
        return {
            success: true,
            message: '论文分析测试成功',
            data: content
        };
        
    } catch (error) {
        console.error('❌ 论文分析测试失败:', error);
        return {
            success: false,
            message: error.message,
            error: error
        };
    }
}

// 保存API密钥到Chrome存储
async function saveAPIKey() {
    console.log('保存API密钥到Chrome存储...');
    
    try {
        const settings = {
            modelProvider: 'openai',
            apiKey: API_KEY,
            model: 'gpt-3.5-turbo',
            notificationEnabled: true,
            autoStart: false
        };
        
        // 保存到Chrome存储
        if (typeof chrome !== 'undefined' && chrome.storage) {
            await new Promise((resolve, reject) => {
                chrome.storage.local.set({ settings: settings }, () => {
                    if (chrome.runtime.lastError) {
                        reject(chrome.runtime.lastError);
                    } else {
                        resolve();
                    }
                });
            });
            
            console.log('✅ API密钥已保存到Chrome存储');
        } else {
            console.log('⚠️ Chrome存储不可用，使用本地存储');
            localStorage.setItem('paperScreeningSettings', JSON.stringify(settings));
        }
        
        return {
            success: true,
            message: 'API密钥保存成功'
        };
        
    } catch (error) {
        console.error('❌ API密钥保存失败:', error);
        return {
            success: false,
            message: error.message,
            error: error
        };
    }
}

// 运行所有测试
async function runAllTests() {
    console.log('🚀 开始运行API测试...');
    
    // 1. 保存API密钥
    const saveResult = await saveAPIKey();
    console.log('保存结果:', saveResult);
    
    // 2. 测试API连接
    const apiResult = await testOpenAIAPI();
    console.log('API测试结果:', apiResult);
    
    // 3. 测试论文分析
    const analysisResult = await testPaperAnalysis();
    console.log('分析测试结果:', analysisResult);
    
    // 总结
    console.log('\n📊 测试总结:');
    console.log(`API密钥保存: ${saveResult.success ? '✅' : '❌'}`);
    console.log(`API连接测试: ${apiResult.success ? '✅' : '❌'}`);
    console.log(`论文分析测试: ${analysisResult.success ? '✅' : '❌'}`);
    
    if (saveResult.success && apiResult.success && analysisResult.success) {
        console.log('\n🎉 所有测试通过！论文初筛功能已准备就绪！');
    } else {
        console.log('\n⚠️ 部分测试失败，请检查配置。');
    }
    
    return {
        saveResult,
        apiResult,
        analysisResult
    };
}

// 如果在浏览器环境中运行
if (typeof window !== 'undefined') {
    // 添加到全局对象
    window.testPaperScreeningAPI = runAllTests;
    window.testOpenAIAPI = testOpenAIAPI;
    window.testPaperAnalysis = testPaperAnalysis;
    window.saveAPIKey = saveAPIKey;
    
    console.log('API测试函数已加载到全局对象:');
    console.log('- testPaperScreeningAPI(): 运行所有测试');
    console.log('- testOpenAIAPI(): 测试API连接');
    console.log('- testPaperAnalysis(): 测试论文分析');
    console.log('- saveAPIKey(): 保存API密钥');
}

// 如果在Node.js环境中运行
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        testOpenAIAPI,
        testPaperAnalysis,
        saveAPIKey,
        runAllTests
    };
}
