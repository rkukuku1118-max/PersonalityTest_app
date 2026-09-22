const DOMAIN_DESCRIPTIONS: Record<string, string> = {
  honesty:
    "人に正直かつ公平に接し、利益や地位のために他者を利用せず、控えめであろうとする傾向です。",
  emotionality:
    "危険や心配ごとへの敏感さ、つらいときに支えを求める気持ち、人への共感や愛着の強さを表します。",
  extraversion:
    "人との交流に自信や楽しさを感じ、社交の場で活発に振る舞い、前向きな気分を保つ傾向です。",
  agreeableness:
    "相手の過ちや意見の違いに、寛容さや穏やかさ、妥協する姿勢、忍耐をもって応じる傾向です。",
  conscientiousness:
    "物事を整理して計画的に進め、目標に向けて努力し、正確さや慎重さを大切にする傾向です。",
  openness:
    "芸術や自然への感受性、知識への好奇心、発想の豊かさ、慣習にとらわれない考え方を表します。",
  altruism:
    "困っている人や弱い立場の人に共感し、見返りを求めず手を差し伸べようとする傾向です。",
};

const FACET_DESCRIPTIONS: Record<string, string> = {
  sincerity: "自分の利益のために相手を操ったり取り入ったりせず、率直に接する傾向です。",
  fairness: "不正やごまかしで利益を得ることを避け、公平な方法を選ぶ傾向です。",
  greedAvoidance: "富やぜいたく、社会的な地位を得ることに強くこだわらない傾向です。",
  modesty: "自分を特別扱いされるべき存在だと考えず、控えめに捉える傾向です。",
  fearfulness: "けがや危険を敏感に察知し、用心して避けようとする傾向です。",
  anxiety: "さまざまな場面で心配しやすく、問題について考え続ける傾向です。",
  dependence: "困難なときに、一人で抱えず人から助言や心の支えを得ようとする傾向です。",
  sentimentality: "人との心のつながりを大切にし、別れや他者の気持ちに強く心を動かされる傾向です。",
  socialSelfEsteem: "人から受け入れられているという感覚をもち、自分に肯定的でいられる傾向です。",
  socialBoldness: "初対面の人や人前でも、ためらいすぎず自信をもって行動する傾向です。",
  sociability: "会話や集まりなど、人と一緒に過ごすことを楽しむ傾向です。",
  liveliness: "日常で明るさや活力を感じ、前向きな気分で過ごす傾向です。",
  forgiveness: "傷つけられた相手への怒りを長く抱えず、関係を戻そうとする傾向です。",
  gentleness: "相手を厳しく批判したり強く責めたりせず、穏やかに接する傾向です。",
  flexibility: "意見が違うときに自分の考えだけを押し通さず、妥協点を探す傾向です。",
  patience: "不満や挑発があっても、すぐに怒らず落ち着いて対応する傾向です。",
  organization: "身の回りや作業を整え、順序立てて進める傾向です。",
  diligence: "目標のために努力を続け、難しい課題にも集中して取り組む傾向です。",
  perfectionism: "間違いや抜けがないよう、細部まで確認して正確に仕上げようとする傾向です。",
  prudence: "衝動で決めず、結果を考えてから慎重に判断する傾向です。",
  aestheticAppreciation: "芸術や自然の美しさに気づき、深く味わう傾向です。",
  inquisitiveness: "幅広い知識や出来事に関心をもち、詳しく知ろうとする傾向です。",
  creativity: "想像力を働かせ、新しい発想や解決方法を生み出す傾向です。",
  unconventionality: "一般的な慣習だけにとらわれず、独自の考え方を受け入れる傾向です。",
  altruism: "助けを必要とする人に共感し、自分から手を差し伸べようとする傾向です。",
};

export function domainDescription(id: string) {
  return DOMAIN_DESCRIPTIONS[id] ?? "この性格因子が表す傾向です。";
}

export function facetDescription(id: string) {
  return FACET_DESCRIPTIONS[id] ?? "この性格の特徴が表す傾向です。";
}
