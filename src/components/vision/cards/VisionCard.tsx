import type { VisionItem } from "@/lib/vision/types";
import { ImageCard } from "./ImageCard";
import { VideoCard } from "./VideoCard";
import { AudioCard } from "./AudioCard";
import { TextCard } from "./TextCard";
import { DocumentCard } from "./DocumentCard";

export interface VisionCardProps {
  item: VisionItem;
  /** Smaller, denser rendering for grids / clouds / dashboard. */
  compact?: boolean | undefined;
  onOpen?: ((item: VisionItem) => void) | undefined;
  className?: string | undefined;
}

/** Renders any vision item by type: image, video, audio, text, document. */
export function VisionCard({ item, compact, onOpen, className }: VisionCardProps) {
  switch (item.type) {
    case "image":
      return <ImageCard item={item} compact={compact} onOpen={onOpen} className={className} />;
    case "video":
      return <VideoCard item={item} compact={compact} onOpen={onOpen} className={className} />;
    case "audio":
      return <AudioCard item={item} compact={compact} onOpen={onOpen} className={className} />;
    case "document":
      return <DocumentCard item={item} compact={compact} onOpen={onOpen} className={className} />;
    case "text":
    default:
      return <TextCard item={item} compact={compact} onOpen={onOpen} className={className} />;
  }
}
