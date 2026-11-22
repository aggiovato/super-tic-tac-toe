import { Component, ElementRef, inject, input } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'quiet';

/**
 * The one button family, applied to a native `<button>` so its semantics, focus and keyboard
 * behaviour stay native: `<button app-button="primary">`. Variants: primary (the accent action,
 * at most one per view), secondary (outlined) and quiet (text only).
 */
@Component({
  selector: 'button[app-button], a[app-button]',
  template: '<ng-content />',
  styleUrl: './button.css',
  host: {
    '[class]': "'btn-' + variant()",
    '[class.small]': "size() === 'small'",
    '[attr.type]': "isButton ? 'button' : null",
  },
})
export class Button {
  /** A link styled as a button keeps no `type`. */
  protected readonly isButton =
    inject<ElementRef<HTMLElement>>(ElementRef).nativeElement.tagName === 'BUTTON';

  readonly variant = input<ButtonVariant>('secondary', { alias: 'app-button' });
  readonly size = input<'regular' | 'small'>('regular');
}
