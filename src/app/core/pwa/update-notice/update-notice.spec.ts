import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SwUpdate, type VersionEvent } from '@angular/service-worker';
import { type SaveStatus, ACTIVE_GAME } from '@match';
import { Subject } from 'rxjs';
import { RELOAD_PAGE } from '../app-updates';
import { UpdateNotice } from './update-notice';

function setup(withGame: boolean) {
  const versionUpdates = new Subject<VersionEvent>();
  const sw = {
    isEnabled: true,
    versionUpdates,
    unrecoverable: new Subject<unknown>(),
    checkForUpdate: vi.fn(() => Promise.resolve(false)),
    activateUpdate: vi.fn(() => Promise.resolve(true)),
  };
  const reload = vi.fn();
  const saveStatus = signal<SaveStatus>('saved');
  TestBed.configureTestingModule({
    imports: [UpdateNotice],
    providers: [
      { provide: SwUpdate, useValue: sw },
      { provide: RELOAD_PAGE, useValue: reload },
      ...(withGame
        ? [{ provide: ACTIVE_GAME, useValue: { id: 'super-3t', match: { saveStatus } } }]
        : []),
    ],
  });
  const fixture = TestBed.createComponent(UpdateNotice);
  fixture.detectChanges();
  const element = fixture.nativeElement as HTMLElement;
  const ready = () =>
    versionUpdates.next({
      type: 'VERSION_READY',
      currentVersion: { hash: 'a' },
      latestVersion: { hash: 'b' },
    });
  const button = () => element.querySelector('button');
  return { fixture, element, sw, reload, saveStatus, ready, button };
}

describe('UpdateNotice', () => {
  it('stays hidden until a new version is ready', async () => {
    const { fixture, button, ready } = setup(true);
    expect(button()).toBeNull();
    ready();
    await fixture.whenStable();
    expect(button()?.textContent).toContain('Update');
  });

  it('waits while the game is being saved before it offers the update', async () => {
    const { fixture, button, ready, saveStatus } = setup(true);
    saveStatus.set('saving');
    ready();
    await fixture.whenStable();
    expect(button()).toBeNull();
    saveStatus.set('saved');
    await fixture.whenStable();
    expect(button()).not.toBeNull();
  });

  it('activates the new version and reloads once the game is saved', async () => {
    const { fixture, button, ready, sw, reload } = setup(true);
    ready();
    await fixture.whenStable();
    button()?.click();
    await fixture.whenStable();
    await vi.waitFor(() => expect(reload).toHaveBeenCalledTimes(1));
    expect(sw.activateUpdate).toHaveBeenCalledTimes(1);
  });

  it('asks before updating a game that could not be saved', async () => {
    const { fixture, element, button, ready, saveStatus, sw, reload } = setup(true);
    saveStatus.set('quota');
    ready();
    await fixture.whenStable();
    expect(element.textContent).toContain('updating now loses its last moves');
    expect(button()?.textContent).toContain('Update anyway');
    button()?.click();
    await vi.waitFor(() => expect(reload).toHaveBeenCalledTimes(1));
    expect(sw.activateUpdate).toHaveBeenCalledTimes(1);
  });

  it('reloads by itself on a broken version once no save is under way', async () => {
    const { fixture, sw, reload, saveStatus } = setup(true);
    saveStatus.set('saving');
    sw.unrecoverable.next({ type: 'UNRECOVERABLE_STATE', reason: 'evicted' });
    await fixture.whenStable();
    expect(reload).not.toHaveBeenCalled();
    saveStatus.set('saved');
    await fixture.whenStable();
    await vi.waitFor(() => expect(reload).toHaveBeenCalledTimes(1));
    expect(sw.activateUpdate).not.toHaveBeenCalled();
  });

  it('asks the service worker for a new version when the app starts', () => {
    const { sw } = setup(true);
    expect(sw.checkForUpdate).toHaveBeenCalled();
  });

  it('reloads at once on a page without a game', async () => {
    const { fixture, button, ready, reload } = setup(false);
    ready();
    await fixture.whenStable();
    button()?.click();
    await vi.waitFor(() => expect(reload).toHaveBeenCalledTimes(1));
  });
});
