# Agent Skills

面向物流园区 / 物流地产项目前期调研的 Agent 技能仓库，已发布到 [skills.sh](https://skills.sh)。

## logistics-research-workbench · 物流项目调研计划工作台

输入项目所在地（省/市/区县，地块选址可选）等前置信息后，Agent 自动调研目标城市的公开数据（物流枢纽定位、快递业务量、主导产业、物流园区、快递分拨节点、政府部门调研要点），录入城市知识库，交付一个 6 步向导式调研计划网页：

1. 项目基本信息（含区县→片区/乡镇两级联动）
2. 城市总览（行政区划 / 枢纽 / 快递单量 / 产业 / 用仓需求企业 / 园区定位建议）
3. 产业勾选 → 每产业设目标企业数 N，自动生成 N 家主选 + 约 N/2 家备选
4. 物流市场总览 + 物流园区勾选（现存 / 在建 / 规划）
5. 快递品牌节点勾选（分拨中心 / 集配站 / 站点）
6. 政府部门调研清单（按【维度】组织，勾选仍需获取项）

勾选状态浏览器本地保存，一键导出排版好的 Word 版调研计划（结构对齐：拟调研时间 → 调研人员及行程 → 前置性收集材料 → 四类拟调研企业清单）。


## Install

```bash
# 安装单个技能
npx skills add <owner>/agent-skills@logistics-research-workbench

# 或安装本仓库全部技能
npx skills add <owner>/agent-skills
```

适用于 QwenWork（千问办公）及任何支持 Agent Skills 的客户端（Claude Code、Cursor、Codex、Gemini CLI 等）。

## Layout

```
logistics-research-workbench/
├── SKILL.md          # 技能定义（触发场景、蓝图、工作流程、验证清单）
├── reference/        # 数据源清单、知识库 schema、应用规格
└── template/         # 工作台网页模板（index.html / app.js / data.js / docx.umd.js 本地打包）
```

## License

MIT
