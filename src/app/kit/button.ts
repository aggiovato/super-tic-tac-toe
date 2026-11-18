import { Directive, input } from '@angular/core';

/** The one button family (styles in src/styles/components/button.css). */
@Directive({
  selector: 'button[appButton]',
  host: {
    class: 'btn',
    '[class.btn-primary]': "variant() === 'primary'",
    '[class.btn-secondary]': "variant() === 'secondary'",
    '[class.btn-quiet]': "variant() === 'quiet'",
    '[class.btn-small]': "size() === 'small'",
    '[attr.type]': "'button'",
  },
})
export class Button {
  readonly variant = input<'primary' | 'secondary' | 'quiet'>('secondary', { alias: 'appButton' });
  readonly size = input<'regular' | 'small'>('regular');
}
