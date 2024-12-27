import { AfterViewInit, Directive, ElementRef, HostListener, OnDestroy } from '@angular/core';
import { fromEvent, Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
@Directive({
    selector: 'textarea[ktAutosize]',
    standalone: true
})

export class AutosizeDirective implements AfterViewInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private el: HTMLTextAreaElement;

  constructor(private elementRef: ElementRef) {
    this.el = this.elementRef.nativeElement;
  }

  ngAfterViewInit() {
    // Set initial height
    setTimeout(() => this.adjust());

    // Listen to window resize events
    fromEvent(window, 'resize')
      .pipe(
        debounceTime(200),
        takeUntil(this.destroy$)
      )
      .subscribe(() => this.adjust());
  }

  @HostListener('input')
  onInput() {
    this.adjust();
  }

  private adjust(): void {
    this.el.style.height = 'auto';
    this.el.style.height = this.el.scrollHeight + 'px';
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}