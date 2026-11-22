import { Component, input } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'quiet';

/**
 * The one button family, applied to a native `<button>` so its semantics, focus and keyboard
 * behaviour stay native: `<button app-button="primary">`. Variants: primary (the accent action,
 * at most one per view), secondary (outlined) and quiet (text only).
 */
@Component({
  selector: 'button[app-button]',
  template: '<ng-content />',
  styleUrl: './button.css',
  host: {
    '[class]': "'btn-' + variant()",
    '[class.small]': "size() === 'small'",
    '[attr.type]': "'button'",
  },
})
export class Button {
  readonly variant = input<ButtonVariant>('secondary', { alias: 'app-button' });
  readonly size = input<'regular' | 'small'>('regular');
}
