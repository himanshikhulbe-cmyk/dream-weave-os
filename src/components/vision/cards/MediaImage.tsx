import { useQuery } from "@tanstack/react-query";
import { mediaUrlQuery } from "@/lib/vision/api";
import { cn } from "@/lib/utils";

/** Renders an image stored in the private vision-media bucket via a signed URL. */
export function MediaImage({
  path,
  alt,
  className,
  ...rest
}: { path: string | null | undefined; alt: string } & Omit<
  React.ImgHTMLAttributes<HTMLImageElement>,
  "src" | "alt"
>) {
  const { data: url } = useQuery(mediaUrlQuery(path));
  if (!url) {
    return <div className={cn("animate-pulse bg-glass-strong", className)} aria-hidden />;
  }
  return <img src={url} alt={alt} loading="lazy" className={className} {...rest} />;
}

/** Hook form for any media type (video/audio/doc). */
export function useMediaUrl(path: string | null | undefined) {
  return useQuery(mediaUrlQuery(path)).data ?? null;
}
