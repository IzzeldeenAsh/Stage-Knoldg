import { Directive, ElementRef, HostListener, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appPasswordStrength]'
})
export class PasswordStrengthDirective {
  private meterBars: HTMLElement[];

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngOnInit() {
    this.meterBars = this.el.nativeElement.querySelectorAll('.password-meter-bar');
  }

  @HostListener('input', ['$event.target.value'])
  onInput(value: string): void {
    const strength = this.calculateStrength(value);
    this.updateMeter(strength);
  }

  private calculateStrength(password: string): number {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  }

  private updateMeter(strength: number): void {
    this.meterBars.forEach((bar, index) => {
      this.renderer.removeClass(bar, 'bg-active-success');
      this.renderer.addClass(bar, index < strength ? 'bg-active-success' : 'bg-secondary');
    });
  }
}
