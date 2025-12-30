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

    const key = (environment as any).pusherKey || '';
    const cluster = (environment as any).pusherCluster || 'eu';
    const authEndpoint = (environment as any).pusherAuthEndpoint || '';

    if (!key || !authEndpoint) {
      // Soft warn; allow app to proceed without realtime if not configured
      // eslint-disable-next-line no-console
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
    });
    this.pusher.connection.bind('connected', () => {
      // eslint-disable-next-line no-console
    });
    this.pusher.connection.bind('failed', () => {
      // eslint-disable-next-line no-console
    });
    this.pusher.connection.bind('error', (err: any) => {
      // eslint-disable-next-line no-console
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


