import { genId } from './utils';

/** Debug logger — enable with localStorage.setItem('pinchchat:debug', '1') */
const isDebug = () => {
  try { return localStorage.getItem('pinchchat:debug') === '1'; } catch { return false; }
};
const log = (...args: unknown[]) => { if (isDebug()) console.log('[GW]', ...args); };

/** JSON-safe payload type used for gateway messages. */
export type JsonPayload = Record<string, unknown>;

export type GatewayEventHandler = (event: string, payload: JsonPayload) => void;
export type GatewayResponseHandler = (id: string, ok: boolean, payload: JsonPayload) => void;

/** Shape of an incoming WebSocket message from the gateway. */
interface GatewayMessage {
  type: 'event' | 'res';
  // event fields
  event?: string;
  payload?: JsonPayload;
  // response fields
  id?: string;
  ok?: boolean;
  error?: string;
}

export class GatewayClient {
  private ws: WebSocket | null = null;
  private pendingRequests = new Map<string, { resolve: (v: JsonPayload) => void; reject: (e: unknown) => void }>();
  private eventHandlers: GatewayEventHandler[] = [];
  private _onStatus: (s: 'disconnected' | 'connecting' | 'connected') => void = () => {};
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private connected = false;
  private autoReconnect = true;

  private wsUrl: string;
  private authToken: string;

  constructor(wsUrl?: string, authToken?: string) {
    this.wsUrl = wsUrl || `ws://${window.location.hostname}:18789`;
    this.authToken = authToken || '';
  }

  /** Update credentials (e.g. after login). Does not reconnect automatically. */
  setCredentials(wsUrl: string, authToken: string) {
    this.wsUrl = wsUrl;
    this.authToken = authToken;
  }

  onStatus(fn: (s: 'disconnected' | 'connecting' | 'connected') => void) {
    this._onStatus = fn;
  }

  onEvent(fn: GatewayEventHandler) {
    this.eventHandlers.push(fn);
    return () => { this.eventHandlers = this.eventHandlers.filter(h => h !== fn); };
  }

  connect() {
    if (this.ws) return;
    this.autoReconnect = true;
    this._onStatus('connecting');
    this.ws = new WebSocket(this.wsUrl);

    this.ws.onopen = () => { log('WS open'); };

    this.ws.onmessage = (ev) => {
      let msg: GatewayMessage;
      try { msg = JSON.parse(ev.data as string) as GatewayMessage; } catch { log('parse error', ev.data); return; }
      log('msg:', msg.type, msg.event || msg.id || '', msg.ok);

      if (msg.type === 'event') {
        if (msg.event === 'connect.challenge') {
          this.handleChallenge();
        } else {
          for (const h of this.eventHandlers) h(msg.event ?? '', msg.payload ?? {});
        }
      } else if (msg.type === 'res' && msg.id) {
        const pending = this.pendingRequests.get(msg.id);
        if (pending) {
          this.pendingRequests.delete(msg.id);
          if (msg.ok) pending.resolve(msg.payload ?? {});
          else pending.reject(msg.payload ?? msg.error ?? 'unknown error');
        }
      }
    };

    this.ws.onclose = (ev) => {
      log('WS close:', ev.code, ev.reason);
      this.ws = null;
      this.connected = false;
      this._onStatus('disconnected');
      this.pendingRequests.forEach(p => p.reject(new Error('disconnected')));
      this.pendingRequests.clear();
      if (this.autoReconnect) this.scheduleReconnect();
    };

    this.ws.onerror = (e) => { log('WS error', e); };
  }

  private handleChallenge() {
    const id = genId('connect');
    this.request(id, 'connect', {
      minProtocol: 3,
      maxProtocol: 3,
      client: { id: 'webchat', version: __APP_VERSION__, platform: 'web', mode: 'webchat' },
      role: 'operator',
      scopes: ['operator.read', 'operator.write'],
      caps: [],
      commands: [],
      permissions: {},
      auth: { token: this.authToken },
      locale: navigator.language || 'en',
      userAgent: `pinchchat/${__APP_VERSION__}`,
    }).then((res) => {
      log('connected!', res);
      this.connected = true;
      this.reconnectAttempts = 0;
      this._onStatus('connected');
    }).catch((err) => {
      log('connect failed:', err);
      this.autoReconnect = false;
      this.disconnect();
    });
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    const base = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    const jitter = Math.random() * base * 0.3;
    const delay = base + jitter;
    this.reconnectAttempts++;
    log(`reconnecting in ${Math.round(delay)}ms (attempt ${this.reconnectAttempts})`);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  disconnect() {
    this.autoReconnect = false;
    this.reconnectAttempts = 0;
    if (this.reconnectTimer) { clearTimeout(this.reconnectTimer); this.reconnectTimer = null; }
    if (this.ws) { this.ws.close(); this.ws = null; }
    this.connected = false;
    this._onStatus('disconnected');
  }

  request(id: string, method: string, params: JsonPayload): Promise<JsonPayload> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        return reject(new Error('not connected'));
      }
      this.pendingRequests.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ type: 'req', id, method, params }));
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('timeout'));
        }
      }, 30000);
    });
  }

  async send(method: string, params: JsonPayload): Promise<JsonPayload> {
    const id = genId('req');
    return this.request(id, method, params);
  }

  get isConnected() { return this.connected; }
}
