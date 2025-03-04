export const mockData = {
  users: [
    {
      username: "admin",
      password: "admin123",
      role: "admin"
    }
  ],
  
  categories: {
    'western': {
      id: 'western',
      name: '美西方',
      news_count: 2
    },
    'russia-ukraine': {
      id: 'russia-ukraine',
      name: '俄乌',
      news_count: 1
    },
    'middle-east': {
      id: 'middle-east',
      name: '中东',
      news_count: 1
    },
    'asia-pacific': {
      id: 'asia-pacific',
      name: '亚太',
      news_count: 1
    },
    'others': {
      id: 'others',
      name: '其他',
      news_count: 1
    }
  },
  
  news: [
    {
      id: 1,
      title: "美国对华政策最新动向",
      summary: "美国政府宣布新一轮对华政策措施，涉及贸易、技术等多个领域。本报道深入分析这些措施对中美关系的潜在影响。",
      content: "据报道，美国政府近日公布了新一轮对华政策措施，涉及贸易、技术等多个领域。此次政策调整被认为是美国新一届政府对华战略的重要组成部分，可能会对两国关系产生深远影响。\n\n专家分析认为，这些措施既反映了美国在某些领域与中国竞争的意图，也表明了在气候变化等全球性问题上寻求合作的可能性。中方已对此表态，强调希望美方采取理性、务实的对华政策。",
      category: "western",
      category_name: "美西方",
      image: "/testimage/test1.jpg",
      published_at: "2024-03-04T08:00:00Z",
      author: "王安",
      author_id: "千手防务",
      tags: ["美国", "中国", "外交"]
    },
    {
      id: 2,
      title: "俄乌冲突最新进展",
      summary: "俄乌双方在边境地区展开新一轮较量，国际社会继续推动和平进程。冲突持续对全球地缘政治格局产生影响。",
      content: "根据最新战报，俄乌双方在边境地区再次发生激烈交火。乌克兰方面报告称，俄军已增派新的部队到前线，而俄罗斯则指责乌方使用西方提供的武器系统攻击平民目标。\n\n与此同时，国际调解努力仍在继续，多国领导人呼吁双方保持克制，回到谈判桌前。军事专家分析认为，当前局势仍处于复杂变化中，和平进程面临诸多挑战。",
      category: "russia-ukraine",
      category_name: "俄乌",
      image: "/testimage/test2.jpg",
      published_at: "2024-03-04T09:00:00Z",
      author: "李明",
      author_id: "千手防务",
      tags: ["俄罗斯", "乌克兰", "冲突"]
    },
    {
      id: 3,
      title: "中东局势最新发展",
      summary: "巴以冲突持续升级，国际社会呼吁和平。多国外交努力旨在缓解地区紧张局势，保护平民安全。",
      content: "巴以冲突近期呈现新的发展态势，多国呼吁和平解决争端。联合国安理会已召开紧急会议，讨论如何缓解当前紧张局势，保护平民安全。\n\n区域大国已展开密集外交活动，试图推动和平进程。人道主义组织警告称，如果冲突继续升级，当地民众将面临更严峻的生存危机。国际社会正在加大援助力度，帮助受影响地区的平民度过难关。",
      category: "middle-east",
      category_name: "中东",
      image: "/testimage/test3.jpg",
      published_at: "2024-03-04T10:00:00Z",
      author: "张华",
      author_id: "千手防务",
      tags: ["中东", "巴以冲突"]
    },
    {
      id: 4,
      title: "亚太地区经济合作新动向",
      summary: "亚太地区多国签署新经济合作协议，推动区域经济一体化。专家预测这将为区域内贸易和投资带来新机遇。",
      content: "亚太地区多个国家近日签署了新的经济合作协议，旨在进一步推动区域经济一体化。该协议涵盖贸易、投资、技术合作等多个领域，被视为区域经济合作的重要里程碑。\n\n经济学家指出，这一协议将帮助降低区域内贸易壁垒，促进资本和技术的自由流动，为各国经济增长注入新动力。企业界普遍对此表示欢迎，认为这将创造更多商业机会。",
      category: "asia-pacific",
      category_name: "亚太",
      image: "/testimage/test4.jpg",
      published_at: "2024-03-04T11:00:00Z",
      author: "陈强",
      author_id: "千手防务",
      tags: ["亚太", "经济", "合作"]
    },
    {
      id: 5,
      title: "欧洲能源转型取得新进展",
      summary: "欧洲多国加速可再生能源部署，绿色电力占比创新高。分析显示清洁能源投资将继续增长，助力实现碳中和目标。",
      content: "根据最新数据，欧洲多个国家在可再生能源发展方面取得显著进展，部分国家绿色电力占比已创历史新高。这一趋势得益于政策支持和技术进步，以及民众对清洁能源的日益接受。\n\n能源专家指出，尽管面临一些短期挑战，欧洲能源转型整体保持良好势头。预计未来几年，风能和太阳能装机容量将继续快速增长，为实现碳中和目标提供有力支撑。",
      category: "western",
      category_name: "美西方",
      image: "/testimage/test5.jpg",
      published_at: "2024-03-04T12:00:00Z",
      author: "赵建",
      author_id: "千手防务",
      tags: ["欧洲", "能源", "可再生能源"]
    },
    {
      id: 6,
      title: "全球芯片供应链重构",
      summary: "国际芯片巨头宣布新投资计划，全球半导体产业格局面临调整。专家分析这一变化对技术发展和国际竞争的深远影响。",
      content: "多家国际芯片巨头近期宣布了重大投资计划，旨在重构全球半导体供应链。这些投资主要集中在先进制程、特种工艺和新材料领域，总规模达数百亿美元。\n\n产业观察人士指出，这一轮投资潮反映了全球半导体产业正在经历深刻变革。地缘政治因素、技术安全考虑以及市场需求变化，共同推动了这一进程。各国政府也纷纷出台政策，支持本国半导体产业发展。",
      category: "others",
      category_name: "其他",
      image: "/testimage/test6.jpg",
      published_at: "2024-03-04T13:00:00Z",
      author: "孙明",
      author_id: "千手防务",
      tags: ["芯片", "半导体", "供应链"]
    }
  ]
};