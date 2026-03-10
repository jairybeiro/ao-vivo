import { log } from "./utils";

export class EmbedPlayer {
  private iframe: HTMLIFrameElement | null = null;
  private container: HTMLElement | null = null;

  create(container: HTMLElement, url: string, title?: string): HTMLIFrameElement {
    log("EmbedPlayer: creating iframe for", url);
    this.destroy();
    this.container = container;

    const iframe = document.createElement("iframe");
    iframe.src = url;
    iframe.title = title || "Stream Player";
    iframe.width = "100%";
    iframe.height = "100%";
    iframe.frameBorder = "0";
    iframe.scrolling = "no";
    iframe.allowFullscreen = true;
    iframe.allow = "encrypted-media; autoplay; fullscreen";
    iframe.referrerPolicy = "no-referrer";
    iframe.style.cssText = "position:absolute;inset:0;width:100%;height:100%;border:none;transform:scale(1.02);transform-origin:center center;-webkit-overflow-scrolling:touch;";

    container.appendChild(iframe);
    this.iframe = iframe;
    return iframe;
  }

  destroy() {
    if (this.iframe && this.container) {
      log("EmbedPlayer: destroying iframe");
      this.container.removeChild(this.iframe);
    }
    this.iframe = null;
    this.container = null;
  }
}
