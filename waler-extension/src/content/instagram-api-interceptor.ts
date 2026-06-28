/**
 * Instagram API Interceptor
 *
 * NOTE IMPORTANTE : Les content scripts s'exécutent dans un monde ISOLÉ et ne peuvent
 * pas intercepter les vrais appels `fetch`/`XHR` de la page. C'est le script
 * `page-interceptor.ts` (injecté dans le monde MAIN) qui surcharge réellement `fetch`/`XHR`
 * et nous transmet les réponses via `window.postMessage`.
 *
 * Cette classe écoute ces messages et déclenche les callbacks correspondants.
 */

const PAGE_INTERCEPTOR_SOURCE = 'WALER_PAGE_INTERCEPTOR';

export class InstagramAPIInterceptor {
  private followers: Set<string> = new Set();
  private isIntercepting = false;
  private onUserInfoCallback: ((data: any) => void) | null = null;
  private onFollowersCallback: ((followers: string[]) => void) | null = null;
  private messageHandler: ((event: MessageEvent) => void) | null = null;

  start(onFollowersReceived: (followers: string[]) => void, onUserInfo?: (data: any) => void) {
    // On met à jour les callbacks même si déjà en cours (utilisé pendant les scans)
    this.onFollowersCallback = onFollowersReceived;
    this.onUserInfoCallback = onUserInfo || null;

    if (this.isIntercepting) {
      console.log('🔌 API interception already active, callbacks updated');
      return;
    }

    console.log('🔌 Starting Instagram API interception (listening to MAIN world)...');
    this.isIntercepting = true;

    this.messageHandler = (event: MessageEvent) => {
      // Sécurité : n'accepter que les messages de notre propre fenêtre
      if (event.source !== window) return;

      const msg = event.data;
      if (!msg || msg.source !== PAGE_INTERCEPTOR_SOURCE || msg.type !== 'API_RESPONSE') {
        return;
      }

      this.handleApiResponse(msg.url, msg.data);
    };

    window.addEventListener('message', this.messageHandler);
  }

  private handleApiResponse(url: string, data: any) {
    try {
      // Vérifier si c'est une réponse avec des informations utilisateur
      const userNode = data?.data?.user || data?.user;
      if (userNode && this.onUserInfoCallback) {
        console.log('📊 User info detected in API response:', url);
        // Normaliser pour que data-collector reçoive toujours data.data.user
        const normalized = data?.data?.user ? data : { data: { user: userNode } };
        this.onUserInfoCallback(normalized);
      }

      // Parser les followers depuis la réponse
      this.parseFollowersFromResponse(data);

      if (this.followers.size > 0 && this.onFollowersCallback) {
        console.log(`📡 Intercepted ${this.followers.size} followers from API`);
        this.onFollowersCallback(Array.from(this.followers));
      }
    } catch (e) {
      // Ignorer les erreurs de parsing
    }
  }

  stop() {
    if (!this.isIntercepting) return;

    console.log('🔌 Stopping Instagram API interception...');
    if (this.messageHandler) {
      window.removeEventListener('message', this.messageHandler);
      this.messageHandler = null;
    }
    this.isIntercepting = false;
  }

  private parseFollowersFromResponse(data: any) {
    // Parcourir récursivement l'objet pour trouver les usernames
    const findUsernames = (obj: any) => {
      if (!obj || typeof obj !== 'object') return;
      
      // Si c'est un objet avec username
      if (obj.username && typeof obj.username === 'string') {
        this.followers.add(obj.username);
      }
      
      // Parcourir les propriétés
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          findUsernames(obj[key]);
        }
      }
    };
    
    findUsernames(data);
  }

  getFollowers(): string[] {
    return Array.from(this.followers);
  }
}
