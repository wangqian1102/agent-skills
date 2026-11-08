---
name: logistics-research-workbench
name_en: Logistics Research Plan Workbench
name_zh: 物流项目调研计划工作台
description: Build and maintain a logistics-project survey plan workbench web app. Researches a target city's logistics hub positioning, express parcel volume, core industries, logistics parks, express network nodes, and government department data requests from public sources, encodes them into a city knowledge base, and delivers a 6-step wizard web page with checkbox plan adjustment, N primary + ~N/2 backup enterprise lists, and Word export of the final survey plan. Use when the user mentions 调研计划, 调研工作台, 物流园区调研, or asks to research and add a new city's data to the workbench.
description_en: Build and maintain a logistics-project survey plan workbench web app. Researches a target city's logistics hub positioning, express parcel volume, core industries, logistics parks, express network nodes, and government department data requests from public sources, encodes them into a city knowledge base, and delivers a 6-step wizard web page with checkbox plan adjustment, N primary + ~N/2 backup enterprise lists, and Word export of the final survey plan. Use when the user mentions 调研计划, 调研工作台, 物流园区调研, or asks to research and add a new city's data to the workbench.
description_zh: 构建并维护物流项目调研计划工作台网页：调研目标城市的物流枢纽定位、快递单量、主导产业、物流园区、快递分拨节点与政府部门调研要点等公开数据，录入城市知识库，交付6步向导式网页，支持勾选调整计划、N家主选+约N/2家备选企业名单、导出Word版调研计划。用户提到调研计划、调研工作台、物流园区调研，或要求调研录入新城市数据时使用。
argument-hint: Name the target city (e.g. 芜湖) to research and add to the workbench, or attach a survey plan reference docx
argument-hint-en: Name the target city (e.g. Wuhu) to research and add to the workbench, or attach a survey plan reference docx
argument-hint-zh: 指定目标城市（如芜湖）进行调研并录入工作台，或附上调研计划参考docx
user-invocable: true
---

# 物流项目调研计划工作台

面向物流园区/物流地产项目前期调研，构建并持续维护「调研计划工作台」网页：用户输入项目所在地等前置信息后，页面自动生成调研计划建议，通过勾选调整，最终导出 Word 版调研计划。

## 触发场景

- 用户要求新建调研计划工作台网页（指定首城，如宣城、芜湖）
- 用户指定新城市（如芜湖、蚌埠），要求调研公开数据并录入工作台
- 用户提供调研计划参考 docx，要求复用其中数据
- 用户要求调整工作台功能（步骤、勾选规则、导出格式）

## 固定蓝图（6步向导）

1. **项目基本信息**：省→市→区县（含功能区）→片区/乡镇（可选，二级联动）→地块选址（可选，未定可跳过）；调研时间段、调研周期、调研人员名单
2. **城市总览**（选定城市后自动展示）：行政区划、物流枢纽定位、快递订单体量（日均快递单量等）、产业概述（规模/全国地位/代表企业）、用仓需求企业（按需求强度排序）、园区定位建议
3. **产业勾选**：勾选要调研的产业，为每个产业设定目标调研企业数 N → 自动生成 N家主选 + 约N/2家备选（可手动调换主备选）；每个企业可单独勾选是否调研
4. **物流市场总览 + 物流园区勾选**：现存/在建/规划园区，含位置与定位
5. **快递物流企业节点**：按品牌（顺丰/中通/圆通/韵达/申通等）列出节点类型（分拨中心/集配站/站点）及具体地点，勾选
6. **政府部门调研清单**：按部门列出按【维度】组织的调研内容（规划/项目/政策/运行等），勾选仍需获取项（已获取的不勾）

最终汇总展示 → 一键导出 Word 版调研计划。

## 关键规则

- **深度分析预置**：用仓需求企业排序、园区定位建议等分析内容，在城市数据录入时由 Agent 完成并连同依据来源写入知识库；页面只做展示，不提供运行时 AI 问答
- **主备选逻辑**：企业按推荐度分级（tier 1 主选优先 / tier 2 备选），选 N 后自动取 tier 排序前 N 家为主选、其后 ceil(N/2) 家为备选；每个企业行须带"是否调研"勾选框（默认全选，取消勾选即不纳入主备选与导出）；N 输入须同时监听 input+change 事件，保证点击步进按钮实时生效
- **企业数量底线**：每个产业及每个商贸细分领域的企业一般不少于 10 家（公开渠道确无则标注"待现场调研获取"），供用户按需勾选取舍
- **商贸流通细分**：surveyCommerce 按细分领域分组（如商超连锁/专业市场与商贸城/电商与跨境电商/农产品流通与冷链），细分选项按项目所在地特色微调——若当地有知名特色产业链（如襄阳牛肉面）则单列一组，收录其全产业链企业（原料/中央厨房/速食/供应链公司）
- **政府部门条目按维度组织**：每条以【XX维度】开头（规划/项目/政策/运行/区域协同/主体/节点/需求等），结合智能物流园区调研需求写细化描述；不写具体数据点（如"2025年快递业务量XX万件"），维度式表述可避免列举具体需求点导致的遗漏
- **区县选择两级联动**：区县下拉含市辖区/县/县级市＋功能区（开发区），并联动"片区/乡镇"二级下拉（数据存 overview.subLocations）
- **Word 导出本地化与验证**：docx.js 须本地打包（docx.umd.js 随项目目录交付，index.html 引用本地文件，禁用 unpkg 等 CDN——国内网络不稳定会导致导出按钮无反应、找不到导出文件）；导出验证用 Node 原生环境跑同一套文档构造代码生成 .docx 并校验 zip/OOXML 完整性（jsdom 的 Blob/toBlob 不回调，不可用于验证导出功能）
- **Word 导出排版**：主标题居中（城市名+「项目调研计划」）＋副题（地点/时间段）＋主题色分隔线；表格宽度 100% PERCENTAGE + AUTOFIT 按内容自适应列宽，表头主题色底纹；导出成功后页面提示完整文件名及保存位置（浏览器默认下载文件夹）；**导出文档中不包含任何数据来源/出处描述**（来源仅在工作台页面展示）
- **数据来源**：全部来自公开信息（政府公开报告、十五五等规划、重大项目清单、邮政管理局统计、地图/网点信息、行业报道），关键数据标注来源
- **进度保存**：勾选状态保存在浏览器 localStorage，可随时调整

## 工作流程

### Phase 1 需求确认与现状检查
- 确认目标城市；检查工作区是否已有工作台源码/知识库（有则走"扩展"路径：只新增城市数据；无则走"新建"路径：优先复制 [template/](template/) 模板到工作区，在其基础上新增城市数据，不要从零重写网页代码）
- 用户提供参考 docx 时，先提取复用：
  ```bash
  pandoc -t plain 调研计划.docx > plan.txt
  ```
  重点提取：企业名单（含类别与所在区县）、物流园区清单（现存/在建/规划）、政府部门调研内容（逐条）、快递品牌清单。docx 表格经 pandoc 转换后较乱，用 grep 定位标题行后分段提取，再用小段 Python 脚本按 `|` 分列清洗

### Phase 2 城市数据调研
按 [reference/data-sources.md](reference/data-sources.md) 逐模块联网调研。优先政府官网（市政府、交通运输局、自然资源和规划局、省邮政管理局）。搜索结果过大被截断时，将保存的输出文件交给 explore 子代理提取，不要自己通读全文。

### Phase 3 知识库构建
按 [reference/knowledge-base-schema.md](reference/knowledge-base-schema.md) 组装城市 JSON 数据。所有数据需交叉核对：附件文档数据优先直接复用，联网数据补齐规模、定位、单量等量化信息。

### Phase 4 网页构建/更新
按 [reference/app-spec.md](reference/app-spec.md) 构建（或扩展）单页应用。新建时复制 [template/](template/)（index.html / app.js / data.js / docx.umd.js，含宣城、襄阳两城示例数据）到交付目录：app.js 已实现全部 6 步流程、主备选逻辑与 Word 导出（docx.umd.js 本地打包），**只需在 data.js 中新增城市条目**。注意：app.js 的 exportWord() 中四类调研对象的引导段落（"调研对象：当地具有代表性的……"）为示例文案，新增城市时须改写为该城市的实际产业与调研对象。已有源码时只新增城市数据条目，不改动流程框架。大文件分多次写入：先写骨架，再用 edit 分段填充。

### Phase 5 发布与验证
- 用 QW Pages 发布（static 类别），告知用户访问 URL
- 验证清单：
  - [ ] 知识库 JSON 语法校验通过（`python3 -m json.tool`）
  - [ ] 页面打开后 6 步流程可走通；区县→片区/乡镇两级下拉联动可选
  - [ ] 勾选后刷新页面状态保留（localStorage）
  - [ ] 主备选数量符合 N + ceil(N/2)；取消勾选的企业不进入主备选与导出
  - [ ] N 步进按钮点击后主备选实时重算
  - [ ] Word 导出（本地 docx.umd.js）在 Node 原生环境生成有效 .docx，结构完整（时间/人员 → 政府部门材料 → 四类调研对象清单）

## 注意事项

- 邮政局统计为年累计值，日均单量 = 年快递业务量 ÷ 365，需注明推算方式
- 企业名单中的地点写明区县级（如"宁国市""宣州区"），用于后续行程规划
- 若某数据公开渠道查不到，标注"待现场调研获取"而非编造
- 导出的 Word 调研计划结构对齐用户参考文档：一、拟调研时间；二、调研人员及行程初步计划；三、前置性收集相关材料（按部门）；四、拟调研企业清单（本地产业企业/商贸流通企业/快递物流企业/物流园区四类）