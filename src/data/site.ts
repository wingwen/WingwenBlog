export const site = {
  name: 'Wingwen’s Blog',
} as const;

export const features = {
  /**
   * 站点 AI 助手开关。
   * 为 false 时，资料栏只显示一张不可点击的说明卡，页面上不存在对话面板。
   * 为 true 时卡片变成按钮，点击打开面板；后端未配置密钥时面板内会给出明确提示，
   * 不会静默失败，也不会假装能回答。
   */
  aiAssistant: true,
} as const;

export const assistant = {
  /** 面板里的开场白，不经过模型。 */
  greeting: '你好，我是 Wingwen 的站内助手。我只根据这个网站上的公开资料和三个项目回答，资料里没有的会直接说没有。',
  /** 接通后的引导语。 */
  hint: '项目、经历、技术栈，都可以直接问我。',
  /** 未接通时说明真实情况，不用预告式文案。 */
  pendingHint: '还在接线，接通后这里会变成对话入口。',
  /** 接通后卡片底部显示的动作文字。 */
  readyLabel: '开始对话',
  /** 面板底部的手写快捷问题，不走模型。 */
  quickQuestions: ['你在找什么机会？', 'Lisa 这个项目怎么评测的？', '你最熟的技术栈是什么？'],
} as const;
