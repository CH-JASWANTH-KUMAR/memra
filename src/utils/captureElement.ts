import html2canvas from "html2canvas";

export async function captureElement(
  element: HTMLElement,
  options?: {
    backgroundColor?: string;
    watermark?: string;
    fileName?: string;
  }
): Promise<void> {
  const canvas = await html2canvas(element, {
    backgroundColor: options?.backgroundColor || "#0b0b09",
    scale: 2,
    useCORS: true,
    logging: false,
    onclone: (_doc: Document, clonedEl: HTMLElement) => {
      const walk = (el: HTMLElement) => {
        const computed = window.getComputedStyle(el);
        const unsupported = /lab\(|oklch\(|lch\(|color\(/;
        if (unsupported.test(computed.color)) el.style.color = "#e8e3d8";
        if (unsupported.test(computed.backgroundColor)) el.style.backgroundColor = "#121210";
        if (unsupported.test(computed.borderColor)) el.style.borderColor = "#2a2a22";
        Array.from(el.children).forEach(child => walk(child as HTMLElement));
      };
      walk(clonedEl);
    },
  });

  if (options?.watermark) {
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.font = "11px monospace";
      ctx.fillStyle = "rgba(200, 149, 108, 0.5)";
      ctx.textAlign = "center";
      ctx.fillText(options.watermark, canvas.width / 2, canvas.height - 16);
    }
  }

  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = options?.fileName || `memra-${Date.now()}.png`;
  link.click();
}
