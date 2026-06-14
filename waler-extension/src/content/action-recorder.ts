/**
 * Waler Action Recorder
 * Enregistre les actions utilisateur pour générer un script de scan optimal
 */

interface RecordedEvent {
  id: number;
  type: string;
  timestamp: number;
  elapsed_ms: number;
  data: any;
}

interface Checkpoint {
  id: string;
  label: string;
  timestamp: number;
  elapsed_ms: number;
  url: string;
  scrollPosition: number;
  followersCount: number;
  visibleFollowers: string[];
}

export class ActionRecorder {
  private recording = false;
  private events: RecordedEvent[] = [];
  private checkpoints: Checkpoint[] = [];
  private startTime = 0;
  private controlPanel: HTMLElement | null = null;
  private lastScrollTop = 0;
  private followersDetected = new Set<string>();

  constructor() {
    this.createControlPanel();
  }

  private createControlPanel() {
    const panel = document.createElement('div');
    panel.id = 'waler-recorder-panel';
    panel.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 999999;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: 2px solid #fff;
      border-radius: 16px;
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      color: white;
      min-width: 280px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.3);
    `;
    
    panel.innerHTML = `
      <div style="font-size: 18px; font-weight: bold; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
        <span>🎬</span>
        <span>WALER RECORDER</span>
      </div>
      
      <div id="rec-status" style="font-size: 13px; opacity: 0.9; margin-bottom: 12px; padding: 8px; background: rgba(255,255,255,0.1); border-radius: 8px;">
        ⏸️ En attente...
      </div>
      
      <div id="rec-stats" style="font-size: 12px; opacity: 0.8; margin-bottom: 16px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
        <div>📊 <span id="events-count">0</span> events</div>
        <div>📍 <span id="checkpoints-count">0</span> checkpoints</div>
        <div>👥 <span id="followers-count">0</span> followers</div>
        <div>⏱️ <span id="duration">0s</span></div>
      </div>
      
      <button id="btn-record" style="
        width: 100%; padding: 12px; margin-bottom: 8px;
        background: #10b981; color: white;
        border: none; border-radius: 10px;
        cursor: pointer; font-weight: bold; font-size: 14px;
        transition: all 0.2s;
      ">⏺ Démarrer l'enregistrement</button>
      
      <button id="btn-checkpoint" style="
        width: 100%; padding: 12px; margin-bottom: 8px;
        background: #f59e0b; color: white;
        border: none; border-radius: 10px;
        cursor: pointer; font-weight: bold; font-size: 14px;
        display: none;
      ">📍 Ajouter un checkpoint</button>
      
      <button id="btn-stop" style="
        width: 100%; padding: 12px;
        background: #ef4444; color: white;
        border: none; border-radius: 10px;
        cursor: pointer; font-weight: bold; font-size: 14px;
        display: none;
      ">⏹ Arrêter & Générer le code</button>
    `;
    
    document.body.appendChild(panel);
    this.controlPanel = panel;
    
    // Event listeners
    panel.querySelector('#btn-record')?.addEventListener('click', () => this.startRecording());
    panel.querySelector('#btn-checkpoint')?.addEventListener('click', () => this.addCheckpoint());
    panel.querySelector('#btn-stop')?.addEventListener('click', () => this.stopAndExport());
  }

  private startRecording() {
    this.recording = true;
    this.startTime = Date.now();
    this.events = [];
    this.checkpoints = [];
    this.followersDetected.clear();
    
    const statusEl = document.getElementById('rec-status');
    if (statusEl) {
      statusEl.innerHTML = '🔴 <strong>ENREGISTREMENT EN COURS</strong>';
      statusEl.style.background = 'rgba(239, 68, 68, 0.2)';
    }
    
    document.getElementById('btn-record')!.style.display = 'none';
    document.getElementById('btn-checkpoint')!.style.display = 'block';
    document.getElementById('btn-stop')!.style.display = 'block';
    
    // Démarrer les listeners
    this.attachListeners();
    
    // Checkpoint initial
    this.addCheckpoint('START');
    
    console.log('🎬 [Recorder] Enregistrement démarré');
  }

  private attachListeners() {
    // Scroll tracking
    document.addEventListener('scroll', this.handleScroll, true);
    
    // Click tracking
    document.addEventListener('click', this.handleClick, true);
    
    // Mutation observer pour détecter les nouveaux followers
    const observer = new MutationObserver(this.handleMutation);
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    // Update timer
    setInterval(() => this.updateStats(), 1000);
  }

  private handleScroll = (e: Event) => {
    if (!this.recording) return;
    
    const target = e.target as HTMLElement;
    const scrollTop = target === document.documentElement ? window.scrollY : target.scrollTop;
    
    // Détecter les nouveaux followers après scroll
    this.detectFollowers();
    
    // Log scroll event
    this.logEvent('scroll', {
      scrollTop,
      delta: scrollTop - this.lastScrollTop,
      target: this.getSelector(target),
      followersVisible: this.followersDetected.size
    });
    
    this.lastScrollTop = scrollTop;
  };

  private handleClick = (e: MouseEvent) => {
    if (!this.recording) return;
    
    const target = e.target as HTMLElement;
    
    // Ignorer les clics sur le panel
    if (target.closest('#waler-recorder-panel')) return;
    
    this.logEvent('click', {
      x: e.clientX,
      y: e.clientY,
      selector: this.getSelector(target),
      text: target.textContent?.slice(0, 50),
      href: (target as HTMLAnchorElement).href || null
    });
    
    // Flash visuel
    this.showClickFlash(e.clientX, e.clientY);
  };

  private handleMutation = (mutations: MutationRecord[]) => {
    if (!this.recording) return;
    
    let newNodesCount = 0;
    mutations.forEach(m => newNodesCount += m.addedNodes.length);
    
    if (newNodesCount > 5) {
      this.detectFollowers();
      this.logEvent('dom_update', {
        addedNodes: newNodesCount,
        followersDetected: this.followersDetected.size
      });
    }
  };

  private detectFollowers() {
    // Détecter les followers dans le DOM
    const modal = document.querySelector('[role="dialog"]');
    if (!modal) return;
    
    const links = modal.querySelectorAll('a[href^="/"]');
    links.forEach(link => {
      const href = link.getAttribute('href');
      if (href) {
        const match = href.match(/^\/([a-zA-Z0-9._]+)\/?/);
        if (match) {
          const username = match[1];
          const systemPages = ['explore', 'reels', 'direct', 'p', 'stories'];
          if (!systemPages.includes(username)) {
            this.followersDetected.add(username);
          }
        }
      }
    });
    
    this.updateStats();
  }

  private addCheckpoint(label?: string) {
    const checkpoint: Checkpoint = {
      id: `cp_${this.checkpoints.length + 1}`,
      label: label || `Checkpoint ${this.checkpoints.length + 1}`,
      timestamp: Date.now(),
      elapsed_ms: Date.now() - this.startTime,
      url: window.location.href,
      scrollPosition: window.scrollY,
      followersCount: this.followersDetected.size,
      visibleFollowers: Array.from(this.followersDetected)
    };
    
    this.checkpoints.push(checkpoint);
    this.showCheckpointFlash(checkpoint.label);
    this.updateStats();
    
    console.log(`📍 [Checkpoint] ${checkpoint.label}`, checkpoint);
  }

  private logEvent(type: string, data: any) {
    const event: RecordedEvent = {
      id: this.events.length,
      type,
      timestamp: Date.now(),
      elapsed_ms: Date.now() - this.startTime,
      data
    };
    
    this.events.push(event);
  }

  private stopAndExport() {
    this.recording = false;
    
    // Checkpoint final
    this.addCheckpoint('END');
    
    // Générer le code TypeScript
    const generatedCode = this.generateScanCode();
    
    // Créer le rapport complet
    const report = {
      recorded_at: new Date().toISOString(),
      duration_ms: Date.now() - this.startTime,
      total_events: this.events.length,
      total_checkpoints: this.checkpoints.length,
      total_followers: this.followersDetected.size,
      checkpoints: this.checkpoints,
      events: this.events,
      generated_code: generatedCode,
      followers_list: Array.from(this.followersDetected)
    };
    
    // Télécharger le JSON
    this.downloadJSON(report, `waler-recording-${Date.now()}.json`);
    
    // Télécharger le code généré
    this.downloadFile(generatedCode, `waler-scan-generated-${Date.now()}.ts`);
    
    // Afficher le résumé
    this.showSummary(report);
    
    console.log('✅ [Recorder] Export terminé', report);
  }

  private generateScanCode(): string {
    let code = `/**
 * Code généré automatiquement par Waler Recorder
 * Date: ${new Date().toISOString()}
 * Durée d'enregistrement: ${Math.round((Date.now() - this.startTime) / 1000)}s
 * Followers détectés: ${this.followersDetected.size}
 * Checkpoints: ${this.checkpoints.length}
 */

async function performOptimizedScan() {
  console.log('🚀 Démarrage du scan optimisé...');
  
  const scannedFollowers = new Set<string>();
  const modal = document.querySelector('[role="dialog"]');
  if (!modal) {
    console.error('❌ Modal not found');
    return [];
  }
  
  // Trouver le container scrollable
  const scrollContainer = modal as HTMLElement;
  
`;

    // Analyser les patterns de scroll
    const scrollEvents = this.events.filter(e => e.type === 'scroll');
    const avgScrollDelta = scrollEvents.reduce((sum, e) => sum + Math.abs(e.data.delta), 0) / scrollEvents.length;
    const avgDelay = scrollEvents.length > 1 
      ? (scrollEvents[scrollEvents.length - 1].elapsed_ms - scrollEvents[0].elapsed_ms) / scrollEvents.length
      : 1000;
    
    code += `  // Pattern de scroll détecté:\n`;
    code += `  // - Scroll moyen: ${Math.round(avgScrollDelta)}px\n`;
    code += `  // - Délai moyen: ${Math.round(avgDelay)}ms\n`;
    code += `  \n`;
    code += `  let lastCount = 0;\n`;
    code += `  let stableCount = 0;\n`;
    code += `  const maxStableChecks = 5;\n`;
    code += `  \n`;
    code += `  while (stableCount < maxStableChecks) {\n`;
    code += `    // Collecter les followers visibles\n`;
    code += `    const links = modal.querySelectorAll('a[href^="/"]');\n`;
    code += `    links.forEach(link => {\n`;
    code += `      const href = link.getAttribute('href');\n`;
    code += `      if (href) {\n`;
    code += `        const match = href.match(/^\\/([a-zA-Z0-9._]+)\\/?/);\n`;
    code += `        if (match) {\n`;
    code += `          const username = match[1];\n`;
    code += `          const systemPages = ['explore', 'reels', 'direct', 'p', 'stories'];\n`;
    code += `          if (!systemPages.includes(username)) {\n`;
    code += `            scannedFollowers.add(username);\n`;
    code += `          }\n`;
    code += `        }\n`;
    code += `      }\n`;
    code += `    });\n`;
    code += `    \n`;
    code += `    const currentCount = scannedFollowers.size;\n`;
    code += `    console.log(\`📊 Followers: \${currentCount}\`);\n`;
    code += `    \n`;
    code += `    if (currentCount === lastCount) {\n`;
    code += `      stableCount++;\n`;
    code += `    } else {\n`;
    code += `      stableCount = 0;\n`;
    code += `      lastCount = currentCount;\n`;
    code += `    }\n`;
    code += `    \n`;
    code += `    // Scroll optimisé (basé sur tes gestes réels)\n`;
    code += `    scrollContainer.scrollTop += ${Math.round(avgScrollDelta)};\n`;
    code += `    \n`;
    code += `    // Délai naturel (basé sur ton rythme)\n`;
    code += `    await new Promise(resolve => setTimeout(resolve, ${Math.round(avgDelay)}));\n`;
    code += `  }\n`;
    code += `  \n`;
    code += `  console.log(\`✅ Scan terminé: \${scannedFollowers.size} followers\`);\n`;
    code += `  return Array.from(scannedFollowers);\n`;
    code += `}\n`;
    
    return code;
  }

  private getSelector(element: HTMLElement): string {
    if (element.id) return `#${element.id}`;
    if (element.getAttribute('aria-label')) return `[aria-label="${element.getAttribute('aria-label')}"]`;
    if (element.getAttribute('role')) return `[role="${element.getAttribute('role')}"]`;
    return element.tagName.toLowerCase();
  }

  private showClickFlash(x: number, y: number) {
    const flash = document.createElement('div');
    flash.style.cssText = `
      position: fixed;
      left: ${x - 15}px;
      top: ${y - 15}px;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background: rgba(16, 185, 129, 0.4);
      border: 2px solid #10b981;
      pointer-events: none;
      z-index: 999998;
      animation: walerFlash 0.5s ease-out forwards;
    `;
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 500);
  }

  private showCheckpointFlash(label: string) {
    const flash = document.createElement('div');
    flash.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(245, 158, 11, 0.95);
      color: white;
      padding: 16px 32px;
      border-radius: 12px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-weight: bold;
      font-size: 18px;
      z-index: 999999;
      pointer-events: none;
      box-shadow: 0 10px 40px rgba(0,0,0,0.5);
    `;
    flash.textContent = `📍 ${label}`;
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 1500);
  }

  private updateStats() {
    const duration = Math.round((Date.now() - this.startTime) / 1000);
    document.getElementById('events-count')!.textContent = this.events.length.toString();
    document.getElementById('checkpoints-count')!.textContent = this.checkpoints.length.toString();
    document.getElementById('followers-count')!.textContent = this.followersDetected.size.toString();
    document.getElementById('duration')!.textContent = `${duration}s`;
  }

  private showSummary(report: any) {
    alert(`✅ Enregistrement terminé !

📊 Statistiques:
- Durée: ${Math.round(report.duration_ms / 1000)}s
- Events: ${report.total_events}
- Checkpoints: ${report.total_checkpoints}
- Followers détectés: ${report.total_followers}

📥 Fichiers téléchargés:
- waler-recording-*.json (données complètes)
- waler-scan-generated-*.ts (code optimisé)

Le code généré utilise tes patterns de scroll réels pour un scan indétectable !`);
  }

  private downloadJSON(data: any, filename: string) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    this.downloadBlob(blob, filename);
  }

  private downloadFile(content: string, filename: string) {
    const blob = new Blob([content], { type: 'text/plain' });
    this.downloadBlob(blob, filename);
  }

  private downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}

// Ajouter le CSS pour les animations
const style = document.createElement('style');
style.textContent = `
  @keyframes walerFlash {
    0% { transform: scale(1); opacity: 1; }
    100% { transform: scale(3); opacity: 0; }
  }
`;
document.head.appendChild(style);
