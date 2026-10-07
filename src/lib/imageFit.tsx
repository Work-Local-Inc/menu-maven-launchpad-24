import { createContext, useContext } from "react";

export type ImageFit = "cover" | "contain";

/** Lets every ImageUpload in a form share one saved map of crop preferences, keyed per image slot. */
export const ImageFitContext = createContext<{
  fits: Record<string, ImageFit>;
  setFit: (key: string, fit: ImageFit) => void;
} | null>(null);

export const useImageFitContext = () => useContext(ImageFitContext);

export const fitLabel = (fit?: string | null) =>
  fit === "contain" ? "Show full image" : "Cropping allowed";
