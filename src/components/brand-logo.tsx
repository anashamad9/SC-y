import type { ImgHTMLAttributes } from "react";
import { useTheme } from "@/lib/theme";

export const brandLogoPaths = {
  dark: "/dark.png",
  light: "/light.png",
} as const;

type BrandLogoProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src">;

export default function BrandLogo({ alt = "CyberCultX Logo", ...props }: BrandLogoProps) {
  const { theme } = useTheme();
  const src = theme === "light" ? brandLogoPaths.light : brandLogoPaths.dark;

  return <img src={src} alt={alt} {...props} />;
}
