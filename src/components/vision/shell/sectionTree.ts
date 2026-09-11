import type { Section } from "@/lib/vision/types";

export interface SectionNode extends Section {
  children: SectionNode[];
}

/** Build a nested tree of sections from a flat list (parent_id relation). */
export function buildSectionTree(sections: Section[]): SectionNode[] {
  const byId = new Map<string, SectionNode>();
  for (const s of sections) byId.set(s.id, { ...s, children: [] });

  const roots: SectionNode[] = [];
  for (const s of sections) {
    const node = byId.get(s.id);
    if (!node) continue;
    const parent = s.parent_id ? byId.get(s.parent_id) : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }
  return roots;
}

/** All descendant ids (inclusive of self) for a given section id. */
export function descendantIds(sections: Section[], id: string): Set<string> {
  const childrenOf = new Map<string, string[]>();
  for (const s of sections) {
    if (!s.parent_id) continue;
    const list = childrenOf.get(s.parent_id) ?? [];
    list.push(s.id);
    childrenOf.set(s.parent_id, list);
  }
  const result = new Set<string>([id]);
  const stack = [id];
  while (stack.length) {
    const current = stack.pop();
    if (!current) continue;
    for (const childId of childrenOf.get(current) ?? []) {
      if (!result.has(childId)) {
        result.add(childId);
        stack.push(childId);
      }
    }
  }
  return result;
}

/** Breadcrumb path of sections from root to the given id. */
export function sectionPath(sections: Section[], id: string | null | undefined): Section[] {
  if (!id) return [];
  const byId = new Map(sections.map((s) => [s.id, s] as const));
  const path: Section[] = [];
  let current: Section | undefined = byId.get(id);
  const guard = new Set<string>();
  while (current && !guard.has(current.id)) {
    guard.add(current.id);
    path.unshift(current);
    current = current.parent_id ? byId.get(current.parent_id) : undefined;
  }
  return path;
}
