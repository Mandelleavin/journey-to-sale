import { useEffect, useRef } from "react";

type Props = {
  videoUrl: string;
  onCompleted: () => void;
  /** od 0 do 1 — ile musi obejrzeć by uznać za ukończoną (domyślnie 0.9) */
  threshold?: number;
};

/**
 * Odtwarzacz lekcji z auto-detekcją ukończenia:
 * - HTML5 video: emituje onCompleted po przekroczeniu progu czasu lub na 'ended'
 * - YouTube: ładuje IFrame API i nasłuchuje stanu ENDED + monitoruje czas
 */
export function LessonVideoPlayer({ videoUrl, onCompleted, threshold = 0.9 }: Props) {
  const firedRef = useRef(false);

  const fire = () => {
    if (firedRef.current) return;
    firedRef.current = true;
    onCompleted();
  };

  const ytId = videoUrl.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&?]+)/,
  )?.[1];

  if (ytId) {
    return <YouTubePlayer videoId={ytId} threshold={threshold} onCompleted={fire} />;
  }

  return (
    <video
      src={videoUrl}
      controls
      className="mt-4 w-full rounded-2xl bg-black"
      onTimeUpdate={(e) => {
        const v = e.currentTarget;
        if (v.duration > 0 && v.currentTime / v.duration >= threshold) fire();
      }}
      onEnded={fire}
    />
  );
}

declare global {
  interface Window {
    YT?: {
      Player: new (
        el: HTMLElement,
        opts: Record<string, unknown>,
      ) => { getCurrentTime: () => number; getDuration: () => number; destroy: () => void };
      PlayerState: { ENDED: number; PLAYING: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

const ytReadyCallbacks: Array<() => void> = [];
function loadYouTubeAPI(): Promise<void> {
  return new Promise((resolve) => {
    if (window.YT?.Player) return resolve();
    ytReadyCallbacks.push(resolve);
    if (document.querySelector('script[data-yt-iframe-api]')) return;
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    tag.dataset.ytIframeApi = "true";
    document.head.appendChild(tag);
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      ytReadyCallbacks.splice(0).forEach((cb) => cb());
    };
  });
}

function YouTubePlayer({
  videoId,
  threshold,
  onCompleted,
}: {
  videoId: string;
  threshold: number;
  onCompleted: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<ReturnType<NonNullable<Window["YT"]>["Player"]["prototype"]["constructor"]> | null>(null);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadYouTubeAPI().then(() => {
      if (cancelled || !containerRef.current || !window.YT) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const player: any = new window.YT.Player(containerRef.current, {
        videoId,
        playerVars: { rel: 0, modestbranding: 1 },
        events: {
          onStateChange: (e: { data: number }) => {
            if (e.data === window.YT!.PlayerState.ENDED) onCompleted();
            if (e.data === window.YT!.PlayerState.PLAYING && !intervalRef.current) {
              intervalRef.current = window.setInterval(() => {
                try {
                  const t = player.getCurrentTime();
                  const d = player.getDuration();
                  if (d > 0 && t / d >= threshold) onCompleted();
                } catch {
                  /* noop */
                }
              }, 3000);
            }
          },
        },
      });
      playerRef.current = player;
    });
    return () => {
      cancelled = true;
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      try {
        (playerRef.current as any)?.destroy?.();
      } catch {
        /* noop */
      }
    };
  }, [videoId, threshold, onCompleted]);

  return (
    <div className="mt-4 aspect-video rounded-2xl overflow-hidden bg-black">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
