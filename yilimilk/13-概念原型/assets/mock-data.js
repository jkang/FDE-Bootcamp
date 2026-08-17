const MOCK_SCRIPTS = {

  "九点异常总览与缺口识别": [
    { role: "user", text: "看一下今天 9 点 OIP 给出的异常项，先按高风险排序。" },
    {
      role: "agent", state: "thinking",
      thinking: "识别业务意图：日前例行补调\n分析范围：线下渠道·奶粉品类·全国销售仓\n粒度：SKU × 销售仓 × 来源仓\n读取 OIP 监控报表，按备货率/订单进度识别异常",
      text: "正在读取全国销售仓监控报表，按风险排序异常项…"
    },
    {
      role: "agent", state: "tool_calling",
      tool: "读取 OIP 监控报表", tool_status_text: "正在拉取 order_gap / ship_gap / 备货率 / 订单完成率", tool_duration_ms: 1400
    },
    {
      role: "agent", state: "done",
      text: "今日识别 2 个高优先级异常、1 个中优先级异常：\n① 北京销售仓「金领冠珍护3段900g」订单进度 72%、备货率仅 45%，发货缺口 -2,700 件；\n② 南京销售仓「欣活成人奶粉800g」备货率 158%、大日期 3,200 件；上海销售仓同 SKU 备货率 58%、存在短缺。",
      citations: [
        { id: 1, label: "全国销售仓库存监控报表", field: "order_gap / from_stock_rate_before" },
        { id: 2, label: "现货库存", field: "store_num / status" }
      ],
      component: {
        type: "anomaly_table",
        title: "9 点异常总览",
        rows: [
          { risk: "高", sku: "金领冠珍护3段900g", site: "北京销售仓", stockRate: "45%", orderRate: "72%", gap: "-2,700 件" },
          { risk: "高", sku: "欣活成人奶粉800g", site: "上海销售仓", stockRate: "58%", orderRate: "71%", gap: "短缺" },
          { risk: "中", sku: "欣活成人奶粉800g", site: "南京销售仓", stockRate: "158%", orderRate: "—", gap: "大日期 3,200 件" }
        ]
      }
    }
  ],

  "分货方案推理与人工确认": [
    { role: "user", text: "先看北京仓缺货和上海缺货、南京积压能不能联动处理。" },
    {
      role: "agent", state: "thinking",
      thinking: "异常A 正向补货推理：\n北京备货率=(1,200+300+3,000)/10,000=45%\n北京订单完成率=(4,200+3,000)/10,000=72%\n中旬标准50%，72%>50%\n目标备货率=72%+20%=92%\n目标库存=10,000×92%=9,200\n建议补货=9,200-4,500=4,700 件\n异常B 横向调拨推理：南京158%有3,200大日期→优先横调消化",
      text: "正在计算目标备货率与建议补货量…"
    },
    {
      role: "agent", state: "tool_calling",
      tool: "读取基地仓可发量 / 运输时效", tool_status_text: "天津基地仓可发 8,000 件 T+1；武汉 12,000 件 T+3", tool_duration_ms: 1100
    },
    {
      role: "agent", state: "done",
      text: "建议方案：\n① 天津基地仓 → 北京销售仓，正向调拨 4,700 件（时效最优 T+1）；\n② 南京 → 上海，横向调拨 2,500 件（优先消化南京大日期）；\n③ 天津 → 上海，正向补货 1,400 件（补足剩余缺口）。\n预计效果：北京 45%→92%；上海 58%→90.5%；南京大日期减 2,500 件。",
      citations: [
        { id: 1, label: "备货率分配规则", field: "目标备货率=订单进度+20%（中旬）" },
        { id: 2, label: "大日期优先规则", field: "有临期优先横向调拨消化" }
      ],
      component: {
        type: "plan_table",
        title: "分货方案（待确认）",
        rows: [
          { action: "正向调拨", from: "JD-TJ 天津基地仓", to: "XS-BJ 北京销售仓", sku: "金领冠珍护3段900g", qty: "4,700 件", reason: "订单进度高，时效最优" },
          { action: "横向调拨", from: "XS-NJ 南京销售仓", to: "XS-SH 上海销售仓", sku: "欣活成人奶粉800g", qty: "2,500 件", reason: "消化南京大日期" },
          { action: "正向补货", from: "JD-TJ 天津基地仓", to: "XS-SH 上海销售仓", sku: "欣活成人奶粉800g", qty: "1,400 件", reason: "横调后补足缺口" }
        ]
      }
    },
    {
      role: "agent", state: "awaiting_human",
      hitl_trigger: "方案下发前确认",
      hitl_detail: "① 是否接受南京向上海横向调拨 2,500 件？② 上海正向补货 1,400 件是否需要凑车加量？③ 北京补货是否等待 11 点 WMS 可发量刷新？",
      hitl_options: ["A. 全部确认下发", "B. 调整部分数量", "C. 转人工复核"]
    },
    { role: "user", text: "北京方案确认下发；南京到上海确认；上海正向补货加到 1,600 件，方便物流凑车。" },
    {
      role: "agent", state: "done",
      text: "已记录人工修改：上海正向补货量由 1,400 件调整为 1,600 件（原因为物流凑车）。方案已更新，可生成补货单。",
      followup_text: "可继续说「生成补货单并下发」。"
    }
  ],

  "事件驱动临时补调": [
    {
      role: "agent", state: "tool_calling",
      tool: "事件监听 · 工厂排产/WMS", tool_status_text: "收到事件：天津基地仓入库延期", tool_duration_ms: 800
    },
    {
      role: "agent", state: "done",
      text: "⚠️ 事件告警：天津基地仓「金领冠珍护3段900g」原计划 T 日 18:00 入库 5,000 件，延期至 T+2；今日可发量由 8,000 件降至 3,200 件。这会影响上午已确认的北京补货方案（4,700 件）。",
      component: {
        type: "event_card",
        title: "事件中心 · 工厂入库延期",
        rows: [
          { field: "事件时间", value: "T 日 10:30" },
          { field: "影响", value: "天津基地仓可发量 8,000 → 3,200 件" }
        ]
      }
    },
    {
      role: "agent", state: "thinking",
      thinking: "重算：原方案天津→北京 4,700 件\n天津最新可发 3,200 件，缺口 1,500\n若只发 3,200，北京备货率仅到 77%<92%\n组合方案：天津3,200 + 天津销售仓横调1,200(T+1) + 武汉300(T+3)",
      text: "正在按最新可发量约束重算来源仓…"
    },
    {
      role: "agent", state: "done",
      text: "建议临时组合方案：\n① 天津基地仓 → 北京 3,200 件（可发量上限）；\n② 天津销售仓 → 北京 1,200 件（T+1 横调，天津销售仓备货率 118%→103%，不触发风险）；\n③ 武汉基地仓 → 北京 300 件（补足剩余缺口）。\n原因：原方案 4,700 件不可执行，北京未发订单 4,200 件短期履约风险高。",
      citations: [
        { id: 1, label: "可发量约束", field: "下发量不得超发货仓最新可发量" },
        { id: 2, label: "就近优先规则", field: "时效最快、距离最近优先" }
      ]
    },
    { role: "user", text: "确认临时调整，记录原因为工厂入库延期。" },
    {
      role: "agent", state: "done",
      text: "已作废原北京补货单，重新生成 3 条补调动作，并写入事件关联 ID。",
      followup_text: "可继续说「生成补货单并下发」。"
    }
  ],

  "补货单下发与经验沉淀": [
    { role: "user", text: "方案都确认了，生成补货单并下发。" },
    {
      role: "agent", state: "tool_calling",
      tool: "生成补货单 / 校验", tool_status_text: "校验收发仓编码 / SKU / 数量 / 时效", tool_duration_ms: 1200
    },
    {
      role: "agent", state: "done",
      text: "已生成 3 张补货单并校验通过：正向补货单×2、横向调拨单×1，已下发物流调度与财务核算系统。",
      component: {
        type: "order_table",
        title: "补货单草案（已下发）",
        rows: [
          { type: "正向补货单", sku: "金领冠珍护3段900g", from: "JD-TJ 天津基地仓", to: "XS-BJ 北京销售仓", qty: "4,700 件", note: "T+1 优先发运" },
          { type: "横向调拨单", sku: "欣活成人奶粉800g", from: "XS-NJ 南京", to: "XS-SH 上海", qty: "2,500 件", note: "优先出大日期批次" },
          { type: "正向补货单", sku: "欣活成人奶粉800g", from: "JD-TJ 天津", to: "XS-SH 上海", qty: "1,600 件", note: "人工凑车 +200 件" }
        ]
      },
      undo: { text: "已下发，10 秒内可撤销", action: "撤销下发" }
    },
    {
      role: "agent", state: "done",
      text: "经验已沉淀：\n① 规则例外「上海正向补货凑车加量 +200 件」已记录，下次同类情况自动提示凑车；\n② 人工修改原因（物流凑车）已写入决策依据，形成可复用偏好。",
      component: {
        type: "feedback_card",
        title: "经验沉淀",
        rows: [
          { rule: "凑车策略", content: "销售仓正向补货可 ±200 件凑整车" },
          { rule: "人工偏好", content: "优先消化大日期库存再正向补货" }
        ]
      }
    }
  ]
};
