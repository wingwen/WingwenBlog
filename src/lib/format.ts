/** 档案式条目的两位编号：01、02 …；首页与项目列表共用同一套编号规则。 */
export function formatEntryIndex(position: number): string {
  return String(position + 1).padStart(2, '0');
}
