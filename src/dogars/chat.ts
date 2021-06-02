import WebSocket from 'ws';
import PriorityQueue from 'priorityqueuejs';
import Emittery from 'emittery';

interface ChatEvents {
  message: {
    room: string;
    user: string;
    message: string;
  }
}

interface QueuedMessage {
  message: string;
  priority: number;
  timestamp: number;
  resolve: () => void;
}

const createMessageQueue = () => new PriorityQueue<QueuedMessage>((messageA, messageB) => {
  if ((messageA.priority - messageB.priority) !== 0) {
    return messageA.priority - messageB.priority;
  }

  return messageB.timestamp - messageA.timestamp;
});

interface DogarsChatClientOptions {
  url: string;
  throttle: number;
}

const defaultDogarsChatClientOptions: DogarsChatClientOptions = {
  url: 'wss://dogars.org/chat/websocket',
  throttle: 300,
};

// |/trn {name},0,{challenge}
// |/join {room}
// |{room}|{message}
// |/noreply /leave {room}
export class DogarsChatClient {
  private options: DogarsChatClientOptions;

  private queue: PriorityQueue<QueuedMessage>;

  private messageQueueInterval?: NodeJS.Timeout;

  private socket?: WebSocket;

  readonly eventEmitter: Emittery.Typed<ChatEvents>;

  constructor(options: Partial<DogarsChatClientOptions>) {
    this.options = {
      ...defaultDogarsChatClientOptions,
      ...options,
    };
    this.queue = createMessageQueue();
    this.eventEmitter = new Emittery.Typed<ChatEvents>();
  }

  private handleData(data: string) {
    const [room, command,, user, message] = data.split('|').map((value) => value.trim());
    if (command === 'c:') {
      this.eventEmitter.emit('message', {
        room: (room || '').substr(1),
        user: (user || '').substr(1),
        message: message || '',
      });
    }
  }

  public async connect(): Promise<void> {
    this.socket = new WebSocket(this.options.url);

    this.socket.addEventListener('message', (messageEvent) => {
      this.handleData(messageEvent.data.toString());
    });

    this.socket.addEventListener('error', () => {
      this.stopQueue();
      setTimeout(() => {
        this.connect();
      }, 5000);
    });

    this.socket.addEventListener('close', () => {
      this.stopQueue();
      setTimeout(async () => {
        this.connect();
      }, 5000);
    });

    return new Promise<void>((resolve, reject) => {
      const openListener = () => {
        this.socket?.removeEventListener('open', openListener);
        resolve();
      };
      const closeListener = () => {
        this.socket?.removeEventListener('close', closeListener);
        reject();
      };
      const errorListener = () => {
        this.socket?.removeEventListener('error', errorListener);
        reject();
      };

      this.socket?.addEventListener('open', openListener);
      this.socket?.addEventListener('close', closeListener);
      this.socket?.addEventListener('error', errorListener);
    }).then(() => {
      this.handleQueue();
    }).catch(() => {
      this.connect();
    });
  }

  public async send(message: string, priority: number = 0) {
    const promise = new Promise<void>((resolve) => {
      this.queue.enq({
        message,
        priority,
        timestamp: Date.now(),
        resolve,
      });
    });

    return promise;
  }

  private handleQueue() {
    this.messageQueueInterval = setInterval(() => {
      try {
        const message = this.queue.deq();
        this.sendQueued(message);
      } catch (error) {} // eslint-disable-line no-empty
    }, this.options.throttle);
  }

  private stopQueue() {
    if (this.messageQueueInterval) {
      clearInterval(this.messageQueueInterval);
      this.messageQueueInterval = undefined;
    }
  }

  private sendQueued(queuedMessage: QueuedMessage) {
    const { message, resolve } = queuedMessage;
    this.socket?.send(message, () => {
      resolve();
    });
  }
}
