export const site = {
  name: 'Wingwen’s Blog',
} as const;

export const features = {
  /**
   * 站点 AI 助手入口开关。
   * 真实模型接通并完成安全校验之前保持 false：页面上不会出现任何可点击的聊天入口，
   * 也不会出现「即将上线」之类的假按钮。接通后改为 true，导航右侧入口会一起出现。
   */
  aiAssistant: false,
} as const;
