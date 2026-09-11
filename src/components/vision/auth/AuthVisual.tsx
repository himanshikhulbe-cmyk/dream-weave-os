import chromeCalla from "@/assets/chrome-calla.jpg";

export function AuthVisual() {
  return (
    <div className="relative hidden overflow-hidden lg:block">
      <img
        src={chromeCalla}
        alt="Chrome calla lily sculpture"
        className="h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-background/40" />
      <div className="absolute inset-x-0 bottom-16 px-12">
        <p className="font-display text-3xl italic leading-snug text-foreground xl:text-4xl">
          A living universe is waiting.
        </p>
      </div>
    </div>
  );
}
