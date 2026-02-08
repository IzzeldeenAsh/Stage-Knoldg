import { Injectable, OnDestroy } from '@angular/core';
import Pusher, { Channel } from 'pusher-js';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PusherClientService implements OnDestroy {
  private pusher: Pusher | null = null;
  private lastChannelName: string | null = null;
  private lastToken: string | null = null;
  private lastLocale: string | null = null;
  private didBindDebugHandlers = false;

  private getConfig() {
    const key = String(environment.pusherKey ?? '').trim();
    const cluster = String(environment.pusherCluster ?? 'eu').trim();
    const authEndpoint = String(environment.pusherAuthEndpoint ?? '').trim();

    if (!key || !authEndpoint) {
      // eslint-disable-next-line no-console
      console.error('[Pusher] Missing config. Realtime disabled.', {
        hasKey: !!key,
        hasAuthEndpoint: !!authEndpoint,
        cluster
      });
    }

    return { key, cluster, authEndpoint };
  }

  private ensureClient(token: string, currentLocale: string): Pusher {
    if (this.pusher) {
      // If auth context changed, recreate the client (prevents private-channel auth mismatch).
      if (this.lastToken !== token || this.lastLocale !== currentLocale) {
        // eslint-disable-next-line no-console
        console.warn('[Pusher] Auth context changed; reconnecting client', {
          locale: { from: this.lastLocale, to: currentLocale },
          tokenChanged: this.lastToken ? this.lastToken !== token : true
        });
        this.disconnect();
      } else {
        return this.pusher;
      }
    }

    const cfg = this.getConfig();
    this.lastToken = token;
    this.lastLocale = currentLocale;

    // Enable Pusher console logs in non-production mode
    try {
      (Pusher as any).logToConsole = !environment.production;
    } catch {}

    // eslint-disable-next-line no-console
    // console.log('[Pusher] Initializing client', {
    //   cluster: cfg.cluster,
    //   authEndpoint: cfg.authEndpoint,
    //   keySuffix: cfg.key ? cfg.key.slice(-6) : '(missing)',
    //   locale: currentLocale,
    //   tokenPrefix: token ? `${token.slice(0, 10)}…` : '(empty)'
    // });

    this.pusher = new Pusher(cfg.key, {
      cluster: cfg.cluster,
      forceTLS: true,
      enabledTransports: ['ws', 'wss'],
      authEndpoint: cfg.authEndpoint,
      auth: {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          'Accept-Language': currentLocale
        }
      }
      // logToConsole: true,
    });

    if (!this.didBindDebugHandlers) {
      this.didBindDebugHandlers = true;

      this.pusher.connection.bind('state_change', (states: any) => {
        // eslint-disable-next-line no-console
     //   console.log('[Pusher] Connection state_change', states);
      });
      this.pusher.connection.bind('connecting', () => {
        // eslint-disable-next-line no-console
    //    console.log('[Pusher] Connection connecting');
      });
      this.pusher.connection.bind('connected', () => {
        // // eslint-disable-next-line no-console
        // console.log('[Pusher] Connection connected', {
        //   socketId: (this.pusher as any)?.connection?.socket_id
        // });
      });
      this.pusher.connection.bind('disconnected', () => {
        // eslint-disable-next-line no-console
     //   console.log('[Pusher] Connection disconnected');
      });
      this.pusher.connection.bind('unavailable', () => {
        // eslint-disable-next-line no-console
      //  console.warn('[Pusher] Connection unavailable');
      });
      this.pusher.connection.bind('failed', () => {
        // eslint-disable-next-line no-console
     //   console.error('[Pusher] Connection failed');
      });
      this.pusher.connection.bind('error', (err: any) => {
        // eslint-disable-next-line no-console
   //     console.error('[Pusher] Connection error', err);
      });

      // Log *everything* that reaches the client (including internal pusher:* events).
      if (typeof (this.pusher as any).bind_global === 'function') {
        (this.pusher as any).bind_global((eventName: string, data: any) => {
          // eslint-disable-next-line no-console
          console.log('[Pusher] Global event', eventName, data);
        });
      }
    }

    return this.pusher!;
  }

  subscribePrivateUser(userId: number, token: string, currentLocale: string): Channel {
    const client = this.ensureClient(token, currentLocale);
    const channelName = `private-user.${userId}`;
    if (this.lastChannelName && this.lastChannelName !== channelName) {
      // eslint-disable-next-line no-console
      // console.log('[Pusher] Unsubscribing previous channel', {
      //   from: this.lastChannelName,
      //   to: channelName
      // });
      client.unsubscribe(this.lastChannelName);
    }
    this.lastChannelName = channelName;

    const state = (client as any)?.connection?.state;
    if (state === 'disconnected' || state === 'failed') {
      // eslint-disable-next-line no-console
      console.warn('[Pusher] Client not connected; calling connect()', { state });
      client.connect();
    }

    // eslint-disable-next-line no-console
    console.log('[Pusher] Subscribing', { channelName });
    const channel = client.subscribe(channelName);

    channel.bind('pusher:subscription_succeeded', () => {
      // eslint-disable-next-line no-console
      console.log('[Pusher] Subscription succeeded', { channelName });
    });
    channel.bind('pusher:subscription_error', (status: any) => {
      // eslint-disable-next-line no-console
      console.error('[Pusher] Subscription error', { channelName, status });
    });

    return channel;
  }

  unsubscribePrivateUser(userId: number) {
    const channelName = `private-user.${userId}`;
    if (this.pusher) {
      try {
        this.pusher.unsubscribe(channelName);
        if (this.lastChannelName === channelName) this.lastChannelName = null;
        // eslint-disable-next-line no-console
      } catch (e) {
        // eslint-disable-next-line no-console
        // console.warn('[Pusher] Unsubscribe warning', e);
      }
    }
  }

  bindGlobal(handler: (eventName: string, data: any) => void) {
    if (this.pusher && typeof (this.pusher as any).bind_global === 'function') {
      (this.pusher as any).bind_global(handler);
    }
  }

  unbindGlobal(handler: (eventName: string, data: any) => void) {
    if (this.pusher && typeof (this.pusher as any).unbind_global === 'function') {
      (this.pusher as any).unbind_global(handler);
    }
  }

  disconnect() {
    if (this.pusher) {
      // eslint-disable-next-line no-console
   //   console.log('[Pusher] Disconnecting client', { lastChannelName: this.lastChannelName });
      this.pusher.disconnect();
      this.pusher = null;
      this.lastChannelName = null;
      this.lastToken = null;
      this.lastLocale = null;
      this.didBindDebugHandlers = false;
      // eslint-disable-next-line no-console
    }
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}


