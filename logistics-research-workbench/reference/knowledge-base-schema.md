# 城市知识库结构（JSON Schema）

文件：`data.js`（挂载 `window.CITY_DATA`），结构如下。首例完整样例为宣城。

```json
{
  "cities": {
    "宣城市": {
      "meta": { "updatedAt": "2026-11-01", "sources": ["宣城市交通运输局", "安徽省邮政管理局统计公报", "用户提供的调研计划docx"] },
      "overview": {
        "districts": ["宣州区", "宁国市", "广德市", "郎溪县", "泾县", "绩溪县", "旌德县"],
        "subLocations": {
          "宣州区": ["宣城现代服务业产业园片区", "狸桥镇", "水阳镇"],
          "宁国市": ["经开区", "港口镇"]
        },
        "locationNote": "安徽省东南部，苏浙皖三省交界，南京都市圈与杭州都市圈交汇地带",
        "logisticsHub": {
          "positioning": "陆港型物流枢纽（省级多式联运示范工程）",
          "transport": "县县通高铁（5条高铁）；9条高速、6条直指苏浙；芜申运河+水阳江航道，千吨级泊位29个；芜宣机场",
          "regionalRelations": ["长三角一小时经济圈", "海铁联运至上海洋山港/宁波舟山港", "中欧班列支线"]
        },
        "expressVolume": {
          "annualVolume": "20967.99万件（2025）", "dailyAvg": "约57.4万件（年量/365推算）",
          "revenue": "13.17亿元（2025）", "growth": "+11.24%",
          "extra": "投递量29326万件，处理量近5亿件；人均使用快递200件；收入前三县域：宣州区、泾县、宁国市",
          "source": "安徽省邮政管理局2025年宣城市邮政行业经济运行情况"
        },
        "industries": [
          { "name": "汽车零部件", "scale": "安徽省三大汽车零部件生产基地之一", "nationalPosition": "全省领先", "repFirms": ["中鼎控股", "保隆汽配", "立讯精密"], "counties": ["宁国市", "广德市", "宣城经开区"] }
        ],
        "warehouseDemand": [
          { "segment": "快递物流企业", "demandLevel": "高", "analysis": "年处理量近5亿件，现有分拨场地以租赁为主，存在智能化分拨与共配需求" }
        ],
        "parkPositioningAdvice": [
          { "direction": "区域快消/电商仓配一体分拨枢纽", "rationale": "快递业务量96%为异地件，电商与商贸流通企业密集，缺少高标准智能仓" }
        ]
      },
      "surveyIndustries": [
        { "name": "汽车零部件", "note": "以宁国、广德为核心", "firms": [
          { "name": "中鼎控股集团", "location": "宁国市", "tier": 1 },
          { "name": "保隆汽配", "location": "宁国市", "tier": 1 }
        ]}
      ],
      "surveyCommerce": [
        { "name": "电商", "firms": [ { "name": "宣城供销・邻里中心电商板块", "location": "宣城市城区", "tier": 1 } ] }
      ],
      "parks": [
        { "name": "宣城现代服务业产业园（原双桥物流园）", "status": "现存", "location": "宣州区东部", "positioning": "" }
      ],
      "expressNodes": [
        { "brand": "中通", "nodes": [ { "type": "集配站/网点", "name": "长三角快递中心网点", "location": "宣州区里仁街与宣大祥街交叉口" } ] }
      ],
      "governmentDepartments": [
        { "dept": "市发展和改革委员会", "purpose": "评估项目与顶层战略、区域物流枢纽布局及产业规划的契合度", "items": ["【规划维度】“十四五”现代物流业发展总结与“十五五”规划思路，含物流枢纽、冷链、多式联运等专项规划中涉及本市的定位与布局表述", "【项目维度】全市在建、拟建重大物流基础设施项目清单及“十五五”项目储备库", "【政策维度】物流枢纽建设、冷链、多式联运等领域各级补贴政策与专项资金申报口径", "【运行维度】社会物流总额、社会物流总费用占GDP比重等行业运行指标", "【区域协同维度】都市圈及毗邻地区物流通道、枢纽协同安排"] }
      ]
    }
  }
}
```

## 字段说明

- `overview`：城市总览第2步展示。`warehouseDemand.demandLevel` 取 高/中/低；`analysis` 必须写明依据（引用单量、企业数、现有仓储缺口等）
- `overview.subLocations`：区县→片区/乡镇二级下拉数据（键含功能区如"高新区"），覆盖重点物流/产业片区；供第1步选择
- `parkPositioningAdvice`：园区定位建议，2-4条方向，每条含 rationale（基于 overview 各模块数据的推理链）
- `surveyIndustries` / `surveyCommerce`：第3步产业勾选数据源。`firms[].tier`：1=主选优先，2=备选；主备选自动分配依据此排序；每个产业及每个商贸细分领域的企业一般不少于 10 家；页面为每个企业提供"是否调研"勾选框（localStorage 存 firmChecks，默认全选）
- `surveyCommerce`：必须按细分领域分组（商超连锁/专业市场与商贸城/电商与跨境电商/农产品流通与冷链等），并结合项目地特色单列产业链组（如襄阳牛肉面产业链：原料基地/中央厨房/速食品牌/供应链公司）
- `parks`：第4步物流园区，`status` ∈ 现存/在建/规划
- `expressNodes`：第5步快递节点，`type` ∈ 分拨中心/集配站/站点
- `governmentDepartments`：第6步政府部门清单。9部门默认模板（发改/商务/农业农村/工信/自然资源/交通运输/邮政管理/市场监管/招商，可按需增加海关等），调研内容条目按【维度】组织（规划/项目/政策/运行/区域协同/主体/节点/需求等），面向智能物流园区调研需求写细化描述；禁止写具体数据点（如“2025年快递业务量XX万件”），避免列举具体需求导致遗漏

## 新增城市流程

1. 复制宣城条目结构，替换全部数据
2. `governmentDepartments` 的 items 保留部门框架、本地化具体内容
3. 数据经 data-sources.md 指南调研获得，关键量化数据标注来源
4. `python3 -c "import json; json.load(open('data.json'))"` 校验（data.js 用 JSON 部分校验）
