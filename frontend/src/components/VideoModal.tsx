"use client";

import { AnimatePresence, motion } from "framer-motion";
import { IconX } from "@tabler/icons-react";

export default function VideoModal({
  open,
  onClose,
  videoSrc,
}: {
  open: boolean;
  onClose: () => void;
  videoSrc?: string;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 px-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-white/80 bg-black shadow-2xl"
          >
            <button
              onClick={onClose}
              aria-label="Fermer"
              className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
            >
              <IconX className="h-5 w-5" />
            </button>

            {videoSrc ? (
              <video
                src={videoSrc}
                controls
                autoPlay
                controlsList="nodownload noremoteplayback noplaybackrate"
                disablePictureInPicture
                onContextMenu={(e) => e.preventDefault()}
                className="aspect-video w-full"
              />
            ) : (
              <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 bg-[#141414] text-center">
                <p className="font-syne text-lg font-semibold text-white">
                  Vidéo de présentation à venir
                </p>
                <p className="max-w-sm text-sm text-muted-foreground">
                  Notre vidéo de présentation sera bientôt disponible ici.
                </p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
