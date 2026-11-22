import { TestBed } from '@angular/core/testing';
import type { ComputerReplyMessage, ComputerRequestMessage } from './computer-message.model';
import { COMPUTER_PACE_MS } from '@match';
import { WorkerComputer } from './worker-computer';

/** Stands in for the module Worker: records what is posted and lets the test answer or crash. */
class FakeWorker extends EventTarget {
  static readonly created: FakeWorker[] = [];
  readonly posted: ComputerRequestMessage[] = [];
  terminated = false;

  constructor() {
    super();
    FakeWorker.created.push(this);
  }

  postMessage(message: ComputerRequestMessage): void {
    this.posted.push(message);
  }

  terminate(): void {
    this.terminated = true;
  }

  reply(data: ComputerReplyMessage): void {
    this.dispatchEvent(new MessageEvent('message', { data }));
  }

  crash(): void {
    this.dispatchEvent(Object.assign(new Event('error'), { message: 'boom' }));
  }
}

const request = { moves: [], level: 'beginner' as const, seed: 1, variant: '' };

describe('WorkerComputer', () => {
  let opponent: WorkerComputer;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('Worker', FakeWorker);
    FakeWorker.created.length = 0;
    TestBed.configureTestingModule({ providers: [WorkerComputer] });
    opponent = TestBed.inject(WorkerComputer);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('starts its Worker on the first request and answers no sooner than its pace', async () => {
    let answered = false;
    const reply = opponent.reply(request).then((move) => {
      answered = true;
      return move;
    });
    const worker = FakeWorker.created[0];
    expect(FakeWorker.created).toHaveLength(1);
    worker?.reply({ id: worker.posted[0]?.id ?? -1, move: { board: 4, cell: 4 } });
    await vi.advanceTimersByTimeAsync(COMPUTER_PACE_MS - 1);
    expect(answered).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await expect(reply).resolves.toEqual({ board: 4, cell: 4 });
  });

  it('cancels by resolving null and terminating a busy Worker', async () => {
    const reply = opponent.reply(request);
    opponent.cancel();
    await vi.advanceTimersByTimeAsync(COMPUTER_PACE_MS);
    await expect(reply).resolves.toBeNull();
    expect(FakeWorker.created[0]?.terminated).toBe(true);

    void opponent.reply(request);
    expect(FakeWorker.created).toHaveLength(2);
  });

  it('drops a reply to an older request', async () => {
    void opponent.reply(request);
    const worker = FakeWorker.created[0];
    const first = worker?.posted[0]?.id ?? -1;
    const second = opponent.reply(request);
    const current = FakeWorker.created.at(-1);
    current?.reply({ id: first, move: { board: 0, cell: 0 } });
    current?.reply({ id: current.posted.at(-1)?.id ?? -1, move: { board: 8, cell: 8 } });
    await vi.advanceTimersByTimeAsync(COMPUTER_PACE_MS);
    await expect(second).resolves.toEqual({ board: 8, cell: 8 });
  });

  it('rejects on a reported error', async () => {
    const reply = opponent.reply(request);
    const assertion = expect(reply).rejects.toThrow('bad level');
    const worker = FakeWorker.created[0];
    worker?.reply({ id: worker.posted[0]?.id ?? -1, error: 'bad level' });
    await vi.advanceTimersByTimeAsync(COMPUTER_PACE_MS);
    await assertion;
  });

  it('replaces a Worker that crashed, so the next request is answered', async () => {
    const failed = opponent.reply(request);
    const assertion = expect(failed).rejects.toThrow('boom');
    FakeWorker.created[0]?.crash();
    await vi.advanceTimersByTimeAsync(COMPUTER_PACE_MS);
    await assertion;
    expect(FakeWorker.created[0]?.terminated).toBe(true);

    const next = opponent.reply(request);
    const fresh = FakeWorker.created[1];
    expect(fresh).toBeDefined();
    fresh?.reply({ id: fresh.posted[0]?.id ?? -1, move: { board: 2, cell: 2 } });
    await vi.advanceTimersByTimeAsync(COMPUTER_PACE_MS);
    await expect(next).resolves.toEqual({ board: 2, cell: 2 });
  });

  it('ends its Worker with the route', () => {
    void opponent.reply(request);
    TestBed.resetTestingModule();
    expect(FakeWorker.created[0]?.terminated).toBe(true);
  });
});
