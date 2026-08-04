import yaml from "js-yaml"

export function parseFrontmatter(text: string): { data: Record<string, unknown>; body: string } {
  const lines = text.split(/\r?\n/)
  if (lines[0] !== "---") throw new Error("missing opening frontmatter delimiter")
  const end = lines.indexOf("---", 1)
  if (end === -1) throw new Error("missing closing frontmatter delimiter")
  const data = yaml.load(lines.slice(1, end).join("\n"))
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("frontmatter must be a mapping")
  }
  return { data: data as Record<string, unknown>, body: lines.slice(end + 1).join("\n") }
}
