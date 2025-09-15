# 开源追踪功能模块

## 功能描述
Excel & 飞书表格插件，手动/定时任务，更新论文对应的github开源情况

## 预期实现
- Excel & 飞书表格插件
- 手动开始任务 or 定时任务
- 更新论文对应的github开源情况

## ToDo
- [ ] 快速搞个demo

## 文件结构
```
open-source-tracking/
├── README.md                    # 本文件
├── index.html                  # 主页面
├── background-script.js        # 后台处理脚本
├── api/                        # API接口
├── excel/                      # Excel处理模块
├── feishu/                     # 飞书集成模块
├── utils/                      # 工具函数
└── config/                     # 配置文件
```

## 开发计划
1. 搭建基础框架
2. 实现Excel文件处理
3. 集成飞书表格API
4. 实现GitHub开源情况追踪
5. 添加定时任务功能
