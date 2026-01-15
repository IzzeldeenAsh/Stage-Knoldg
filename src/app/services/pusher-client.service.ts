import { Injectable, OnDestroy } from '@angular/core';
import Pusher, { Channel } from 'pusher-js';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PusherClientService implements OnDestroy {
  private pusher: Pusher | null = null;
  private lastChannelName: string | null = null;

  private ensureClient(token: string, currentLocale: string): Pusher {
    if (this.pusher) return this.pusher;

    const key = '41745ad5e299f4af9e36';
    const cluster =  'eu';
    const authEndpoint = 'https://api.foresighta.co/broadcasting/auth';

    if (!key || !authEndpoint) {
      // Soft warn; allow app to proceed without realtime if not configured
      // eslint-disable-next-line no-console
      console.warn('[Pusher] Missing config (key/authEndpoint). Realtime disabled.', {
        hasKey: !!key,
        hasAuthEndpoint: !!authEndpoint,
        cluster
      });
    }

    // Enable Pusher console logs in non-production mode
    try {
      (Pusher as any).logToConsole = !environment.production;
    } catch {}

    // Helpful debug (sanitized)
    try {
      const maskedEndpoint = typeof authEndpoint === 'string'
        ? authEndpoint.replace(/([^/])[^/]+$/, '$1…')
        : authEndpoint;
      // eslint-disable-next-line no-console
    } catch {}

    this.pusher = new Pusher(key, {
      cluster: cluster,
      forceTLS: true,
      enabledTransports: ['ws', 'wss'],
      authEndpoint: authEndpoint,
      auth: {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          'Accept-Language': currentLocale
        }
      }
      // logToConsole: true,
    });

    this.pusher.connection.bind('state_change', (states: any) => {
      // eslint-disable-next-line no-console
      console.log('[Pusher] State change', states);
    });
    this.pusher.connection.bind('connected', () => {
      // eslint-disable-next-line no-console
      console.log('[Pusher] Connected');
    });
    this.pusher.connection.bind('failed', () => {
      // eslint-disable-next-line no-console
      console.log('[Pusher] Failed');
    });
    this.pusher.connection.bind('error', (err: any) => {
      // eslint-disable-next-line no-console  
      console.log('[Pusher] Error', err);
    });

    return this.pusher;
  }

  subscribePrivateUser(userId: number, token: string, currentLocale: string): Channel {
    const client = this.ensureClient(token, currentLocale);
    const channelName = `private-user.${userId}`;
    this.lastChannelName = channelName;
    return client.subscribe(channelName);
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
        console.warn('[Pusher] Unsubscribe warning', e);
      }
    }
  }

  disconnect() {
    if (this.pusher) {
      this.pusher.disconnect();
      this.pusher = null;
      // eslint-disable-next-line no-console
    }
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}


