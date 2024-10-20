import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class FontService {
  private renderer: Renderer2;

  constructor(rendererFactory: RendererFactory2) {
    this.renderer = rendererFactory.createRenderer(null, null);
  }

  updateFont(lang: string): void {
    const fontFamily = lang === 'ar' ? 'Tajawal, sans-serif' : 'Inter, sans-serif';
    this.renderer.setStyle(document.body, 'font-family', fontFamily);
  }
}