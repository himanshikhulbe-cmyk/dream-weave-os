import { useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ChevronRight,
  MoreHorizontal,
  Plus,
  FolderOpen,
  FilePlus,
  Pencil,
  Copy,
  Archive,
  ArchiveRestore,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { Section, VisionItem } from "@/lib/vision/types";
import {
  allItemsQuery,
  deleteSection,
  duplicateSection,
  keys,
  reorderSections,
  sectionItemsQuery,
  sectionsQuery,
  updateSection,
} from "@/lib/vision/api";
import { buildSectionTree, type SectionNode } from "./sectionTree";
import { SectionDialog } from "./SectionDialog";

function itemCountFor(sectionId: string, items: VisionItem[]) {
  return items.filter((it) => it.section_id === sectionId).length;
}

function SectionRow({
  node,
  depth,
  currentSectionId,
  items,
  onEdit,
  onAddChild,
  collapsed,
}: {
  node: SectionNode;
  depth: number;
  currentSectionId?: string | undefined;
  items: VisionItem[];
  onEdit: (section: Section) => void;
  onAddChild: (parentId: string) => void;
  collapsed: boolean;
}) {
  const [expanded, setExpanded] = useState(true);
  const queryClient = useQueryClient();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const duplicateMutation = useMutation({
    mutationFn: async () => {
      const sectionItems = await queryClient.fetchQuery(sectionItemsQuery(node.id));
      return duplicateSection(node, sectionItems);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: keys.sections });
      toast.success("Section duplicated");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const archiveMutation = useMutation({
    mutationFn: (archived: boolean) => updateSection(node.id, { archived }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: keys.sections });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteSection(node.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: keys.sections });
      void queryClient.invalidateQueries({ queryKey: keys.allItems });
      toast.success("Section deleted");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const count = itemCountFor(node.id, items);
  const active = currentSectionId === node.id;

  return (
    <div>
      <div
        className={cn(
          "group grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-1.5 rounded-2xl px-2 py-1.5 text-sm transition-colors",
          active ? "glass-strong text-foreground" : "text-foreground/80 hover:bg-glass",
        )}
        style={{ paddingLeft: collapsed ? undefined : 8 + depth * 14 }}
      >
        {node.children.length > 0 && !collapsed ? (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="grid h-5 w-5 shrink-0 place-items-center text-muted-foreground"
          >
            <ChevronRight className={cn("h-3.5 w-3.5 transition-transform", expanded && "rotate-90")} />
          </button>
        ) : (
          <span className="h-5 w-5 shrink-0" />
        )}

        <Link
          to="/app/sections/$sectionId"
          params={{ sectionId: node.id }}
          className="flex min-w-0 items-center gap-2"
        >
          {node.icon ? (
            <span className="shrink-0 text-base leading-none">{node.icon}</span>
          ) : (
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: node.color ?? "var(--rose)" }}
            />
          )}
          {!collapsed && <span className="truncate">{node.name}</span>}
        </Link>

        {!collapsed && count > 0 && (
          <span className="shrink-0 rounded-full bg-glass-strong px-1.5 py-0.5 text-[10px] text-muted-foreground">
            {count}
          </span>
        )}

        {!collapsed && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="shrink-0 rounded-full p-1 opacity-0 transition-opacity hover:bg-glass-strong group-hover:opacity-100"
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass-strong border-glass-border">
              <DropdownMenuItem asChild>
                <Link to="/app/sections/$sectionId" params={{ sectionId: node.id }}>
                  <FolderOpen /> Open
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAddChild(node.id)}>
                <FilePlus /> Add subsection
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(node)}>
                <Pencil /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => duplicateMutation.mutate()}>
                <Copy /> Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => archiveMutation.mutate(!node.archived)}>
                {node.archived ? (
                  <>
                    <ArchiveRestore /> Unarchive
                  </>
                ) : (
                  <>
                    <Archive /> Archive
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {!collapsed && expanded && node.children.length > 0 && (
        <div>
          {node.children.map((child) => (
            <SectionRow
              key={child.id}
              node={child}
              depth={depth + 1}
              currentSectionId={currentSectionId}
              items={items}
              onEdit={onEdit}
              onAddChild={onAddChild}
              collapsed={collapsed}
            />
          ))}
        </div>
      )}

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent className="glass-strong border-glass-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{node.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the section and everything inside it. This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteMutation.mutate()}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SortableTopLevel({
  node,
  currentSectionId,
  items,
  onEdit,
  onAddChild,
  collapsed,
}: {
  node: SectionNode;
  currentSectionId?: string | undefined;
  items: VisionItem[];
  onEdit: (section: Section) => void;
  onAddChild: (parentId: string) => void;
  collapsed: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: node.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <SectionRow
        node={node}
        depth={0}
        currentSectionId={currentSectionId}
        items={items}
        onEdit={onEdit}
        onAddChild={onAddChild}
        collapsed={collapsed}
      />
    </div>
  );
}

export function SectionTree({
  currentSectionId,
  collapsed,
}: {
  currentSectionId?: string | undefined;
  collapsed: boolean;
}) {
  const queryClient = useQueryClient();
  const { data: sections = [] } = useQuery(sectionsQuery);
  const { data: items = [] } = useQuery(allItemsQuery);
  const [showArchived, setShowArchived] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [newParentId, setNewParentId] = useState<string | null>(null);

  const visibleSections = useMemo(
    () => sections.filter((s) => showArchived || !s.archived),
    [sections, showArchived],
  );

  const tree = useMemo(() => buildSectionTree(visibleSections), [visibleSections]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const reorderMutation = useMutation({
    mutationFn: reorderSections,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: keys.sections }),
  });

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = tree.findIndex((n) => n.id === active.id);
    const newIndex = tree.findIndex((n) => n.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(tree, oldIndex, newIndex);
    reorderMutation.mutate(reordered.map((n) => n.id));
  }

  function openCreate(parentId: string | null) {
    setEditingSection(null);
    setNewParentId(parentId);
    setDialogOpen(true);
  }

  function openEdit(section: Section) {
    setEditingSection(section);
    setNewParentId(null);
    setDialogOpen(true);
  }

  return (
    <div className="flex flex-col gap-1">
      {!collapsed && (
        <div className="flex items-center justify-between px-2 pb-1">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Sections
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            className="rounded-full"
            onClick={() => openCreate(null)}
            aria-label="New section"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {tree.length === 0 && !collapsed && (
        <p className="px-2 py-2 text-xs text-muted-foreground">No sections yet.</p>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={tree.map((n) => n.id)} strategy={verticalListSortingStrategy}>
          {tree.map((node) => (
            <SortableTopLevel
              key={node.id}
              node={node}
              currentSectionId={currentSectionId}
              items={items}
              onEdit={openEdit}
              onAddChild={(parentId) => openCreate(parentId)}
              collapsed={collapsed}
            />
          ))}
        </SortableContext>
      </DndContext>

      {!collapsed && (
        <label className="mt-2 flex items-center justify-between gap-2 px-2 py-1 text-xs text-muted-foreground">
          <span>Show archived</span>
          <Switch checked={showArchived} onCheckedChange={setShowArchived} />
        </label>
      )}

      <SectionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        section={editingSection}
        parentId={newParentId}
      />
    </div>
  );
}
