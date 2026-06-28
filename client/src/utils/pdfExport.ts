/**
 * Utility functions for exporting content to PDF
 */

export interface PDFExportOptions {
  title: string;
  subtitle?: string;
  content: string;
  metadata?: {
    author?: string;
    date?: Date;
    tags?: string[];
  };
  milestones?: Array<{
    title: string;
    completed: boolean;
    status: 'success' | 'failed' | null;
    date: Date | null;
  }>;
}

/**
 * Export content to PDF using browser's print functionality
 */
export function exportToPDF(options: PDFExportOptions): void {
  const { title, subtitle, content, metadata, milestones } = options;

  // Create a hidden iframe for printing
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) {
    console.error('Failed to access iframe document');
    document.body.removeChild(iframe);
    return;
  }

  // Build HTML content for PDF
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <style>
          @page {
            size: A4;
            margin: 2cm;
          }
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #1a1a1a;
            background: white;
            padding: 20px;
          }
          
          .header {
            border-bottom: 3px solid #8b5cf6;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          
          .title {
            font-size: 32px;
            font-weight: 800;
            color: #1a1a1a;
            margin-bottom: 8px;
          }
          
          .subtitle {
            font-size: 18px;
            color: #6b7280;
            margin-bottom: 16px;
          }
          
          .metadata {
            display: flex;
            gap: 20px;
            flex-wrap: wrap;
            font-size: 14px;
            color: #6b7280;
            margin-top: 12px;
          }
          
          .metadata-item {
            display: flex;
            align-items: center;
            gap: 6px;
          }
          
          .metadata-label {
            font-weight: 600;
          }
          
          .tags {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
            margin-top: 8px;
          }
          
          .tag {
            background: #f3f4f6;
            padding: 4px 12px;
            border-radius: 6px;
            font-size: 12px;
            color: #4b5563;
            font-weight: 500;
          }
          
          .section {
            margin-bottom: 30px;
          }
          
          .section-title {
            font-size: 20px;
            font-weight: 700;
            color: #1a1a1a;
            margin-bottom: 16px;
            padding-bottom: 8px;
            border-bottom: 2px solid #e5e7eb;
          }
          
          .content {
            font-size: 14px;
            line-height: 1.8;
            color: #374151;
            white-space: pre-wrap;
            word-wrap: break-word;
          }
          
          .milestones {
            list-style: none;
          }
          
          .milestone {
            padding: 12px;
            margin-bottom: 12px;
            border-radius: 8px;
            border-left: 4px solid #e5e7eb;
            background: #f9fafb;
            display: flex;
            align-items: center;
            gap: 12px;
          }
          
          .milestone.success {
            border-left-color: #22c55e;
            background: #f0fdf4;
          }
          
          .milestone.failed {
            border-left-color: #ef4444;
            background: #fef2f2;
          }
          
          .milestone-icon {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            flex-shrink: 0;
          }
          
          .milestone.success .milestone-icon {
            background: #22c55e;
            color: white;
          }
          
          .milestone.failed .milestone-icon {
            background: #ef4444;
            color: white;
          }
          
          .milestone.pending .milestone-icon {
            background: #e5e7eb;
            color: #6b7280;
          }
          
          .milestone-content {
            flex: 1;
          }
          
          .milestone-title {
            font-weight: 600;
            color: #1a1a1a;
            margin-bottom: 4px;
          }
          
          .milestone-date {
            font-size: 12px;
            color: #6b7280;
          }
          
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            font-size: 12px;
            color: #9ca3af;
          }
          
          @media print {
            body {
              padding: 0;
            }
            
            .no-print {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="title">${escapeHtml(title)}</h1>
          ${subtitle ? `<p class="subtitle">${escapeHtml(subtitle)}</p>` : ''}
          
          ${metadata ? `
            <div class="metadata">
              ${metadata.author ? `
                <div class="metadata-item">
                  <span class="metadata-label">Auteur:</span>
                  <span>${escapeHtml(metadata.author)}</span>
                </div>
              ` : ''}
              ${metadata.date ? `
                <div class="metadata-item">
                  <span class="metadata-label">Date:</span>
                  <span>${formatDate(metadata.date)}</span>
                </div>
              ` : ''}
            </div>
            ${metadata.tags && metadata.tags.length > 0 ? `
              <div class="tags">
                ${metadata.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
              </div>
            ` : ''}
          ` : ''}
        </div>
        
        ${content ? `
          <div class="section">
            <h2 class="section-title">Notes</h2>
            <div class="content">${escapeHtml(content)}</div>
          </div>
        ` : ''}
        
        ${milestones && milestones.length > 0 ? `
          <div class="section">
            <h2 class="section-title">Milestones</h2>
            <ul class="milestones">
              ${milestones.map(m => `
                <li class="milestone ${m.completed ? (m.status === 'success' ? 'success' : 'failed') : 'pending'}">
                  <div class="milestone-icon">
                    ${m.completed ? (m.status === 'success' ? '✓' : '✗') : '○'}
                  </div>
                  <div class="milestone-content">
                    <div class="milestone-title">${escapeHtml(m.title)}</div>
                    ${m.date ? `<div class="milestone-date">Completed on ${formatDate(m.date)}</div>` : ''}
                  </div>
                </li>
              `).join('')}
            </ul>
          </div>
        ` : ''}
        
        <div class="footer">
          <p>Generated by Waler Pro Mode - ${formatDate(new Date())}</p>
        </div>
      </body>
    </html>
  `;

  // Write content to iframe
  iframeDoc.open();
  iframeDoc.write(htmlContent);
  iframeDoc.close();

  // Wait for content to load, then trigger print
  iframe.onload = () => {
    setTimeout(() => {
      iframe.contentWindow?.print();
      
      // Clean up after a delay
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 250);
  };
}

/**
 * Fiche détaillée d'une personne du réseau (export PDF individuel).
 */
export interface PersonPDFOptions {
  displayName: string;
  username: string;
  /** Badges affichés en tête : cercle, statut prospect, etc. */
  badges?: string[];
  scoreLabel: string;
  score: number;
  scoreSubtitle: string;
  addedAt?: Date;
  followDuration?: number;
  /** "Mutuel" / "Te suit" / "Tu suis" / "Aucun". */
  connectionStatus: string;
  mutualConnections: number;
  signalsCount: number;
  sector?: string;
  notes?: string;
  /** Timeline des interactions (du + récent au + ancien). */
  timeline?: Array<{
    label: string;
    date?: Date;
    postUrl?: string;
    ruptureBefore?: number;
  }>;
}

/**
 * Exporte une fiche personne complète : en-tête, badges, score principal,
 * statistiques de connexion, timeline des interactions puis notes.
 */
export function exportPersonToPDF(options: PersonPDFOptions): void {
  const {
    displayName,
    username,
    badges = [],
    scoreLabel,
    score,
    scoreSubtitle,
    addedAt,
    followDuration = 0,
    connectionStatus,
    mutualConnections,
    signalsCount,
    sector,
    notes,
    timeline = [],
  } = options;

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) {
    console.error('Failed to access iframe document');
    document.body.removeChild(iframe);
    return;
  }

  const statCard = (label: string, value: string | number, hint?: string) => `
    <div class="stat-card">
      <div class="stat-value">${escapeHtml(String(value))}</div>
      <div class="stat-label">${escapeHtml(label)}</div>
      ${hint ? `<div class="stat-hint">${escapeHtml(hint)}</div>` : ''}
    </div>
  `;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>${escapeHtml(displayName)}</title>
        <style>
          @page { size: A4; margin: 1.6cm; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.5;
            color: #1a1a1a;
            background: white;
            padding: 8px;
          }
          .header { border-bottom: 3px solid #8b5cf6; padding-bottom: 16px; margin-bottom: 24px; }
          .title { font-size: 30px; font-weight: 800; margin-bottom: 4px; }
          .subtitle { font-size: 16px; color: #6b7280; }
          .badges { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px; }
          .badge {
            background: #ede9fe;
            color: #6d28d9;
            padding: 4px 12px;
            border-radius: 999px;
            font-size: 12px;
            font-weight: 600;
          }
          .section { margin-bottom: 26px; }
          .section-title {
            font-size: 18px;
            font-weight: 700;
            margin-bottom: 14px;
            padding-bottom: 6px;
            border-bottom: 2px solid #e5e7eb;
          }
          .score-card {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            padding: 20px;
            background: #f9fafb;
          }
          .score-card .label { font-size: 18px; font-weight: 700; }
          .score-card .sub { font-size: 13px; color: #6b7280; margin-top: 4px; }
          .score-card .big { font-size: 52px; font-weight: 800; color: #111827; }
          .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
          .stat-card { border: 1px solid #e5e7eb; border-radius: 10px; padding: 14px; background: #f9fafb; }
          .stat-value { font-size: 22px; font-weight: 800; color: #111827; }
          .stat-label { font-size: 12px; color: #6b7280; margin-top: 2px; font-weight: 600; }
          .stat-hint { font-size: 11px; color: #9ca3af; margin-top: 2px; }
          .timeline { list-style: none; }
          .timeline-item {
            padding: 10px 0 10px 16px;
            border-left: 2px solid #d1d5db;
            position: relative;
          }
          .timeline-item::before {
            content: '';
            position: absolute;
            left: -5px;
            top: 14px;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #8b5cf6;
          }
          .timeline-label { font-size: 13px; font-weight: 600; color: #1f2937; }
          .timeline-date { font-size: 11px; color: #9ca3af; }
          .timeline-link { font-size: 11px; color: #7c3aed; word-break: break-all; }
          .rupture { font-size: 11px; color: #ea580c; padding: 6px 0 6px 16px; }
          .content { font-size: 13px; line-height: 1.7; color: #374151; white-space: pre-wrap; word-wrap: break-word; }
          .muted { color: #9ca3af; font-style: italic; }
          .footer {
            margin-top: 32px;
            padding-top: 16px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            font-size: 11px;
            color: #9ca3af;
          }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="title">${escapeHtml(displayName)}</h1>
          <p class="subtitle">@${escapeHtml(username)}${sector ? ` • ${escapeHtml(sector)}` : ''}</p>
          ${badges.length > 0 ? `
            <div class="badges">
              ${badges.map(b => `<span class="badge">${escapeHtml(b)}</span>`).join('')}
            </div>
          ` : ''}
        </div>

        <div class="section">
          <h2 class="section-title">${escapeHtml(scoreLabel)}</h2>
          <div class="score-card">
            <div>
              <div class="label">${escapeHtml(scoreLabel)}</div>
              <div class="sub">${escapeHtml(scoreSubtitle)}</div>
            </div>
            <div class="big">${score}<span style="font-size:20px;color:#9ca3af">/100</span></div>
          </div>
        </div>

        <div class="section">
          <h2 class="section-title">Statistics</h2>
          <div class="stats-grid">
            ${statCard('Connection', connectionStatus)}
            ${statCard('Duration', `${followDuration} d`, 'Since following')}
            ${statCard('Mutual', mutualConnections, 'In common')}
            ${statCard('Signals', signalsCount, 'Detected')}
          </div>
          ${addedAt ? `<p class="stat-hint" style="margin-top:10px">Added on ${formatDate(addedAt)}</p>` : ''}
        </div>

        <div class="section">
          <h2 class="section-title">Interaction timeline</h2>
          ${timeline.length > 0 ? `
            <ul class="timeline">
              ${timeline.map(t => `
                ${t.ruptureBefore && t.ruptureBefore > 0 ? `<li class="rupture">Break — ${t.ruptureBefore} post(s) with no interaction</li>` : ''}
                <li class="timeline-item">
                  <div class="timeline-label">${escapeHtml(t.label)}</div>
                  ${t.date ? `<div class="timeline-date">${formatDate(t.date)}</div>` : ''}
                  ${t.postUrl ? `<div class="timeline-link">${escapeHtml(t.postUrl)}</div>` : ''}
                </li>
              `).join('')}
            </ul>
          ` : `<p class="muted">No interaction detected yet.</p>`}
        </div>

        <div class="section">
          <h2 class="section-title">Notes</h2>
          <div class="content">${notes ? escapeHtml(notes) : '<span class="muted">No notes yet</span>'}</div>
        </div>

        <div class="footer">
          <p>Generated by Waler Pro Mode - ${formatDate(new Date())}</p>
        </div>
      </body>
    </html>
  `;

  iframeDoc.open();
  iframeDoc.write(htmlContent);
  iframeDoc.close();

  iframe.onload = () => {
    setTimeout(() => {
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 250);
  };
}

/**
 * Données d'un résumé global de la section People (réseau complet).
 */
export interface PeopleSummaryOptions {
  /** Titre du document (ex. "Résumé People"). */
  title?: string;
  /** Filtre éventuellement appliqué (ex. "Prospects"), sinon "Tous". */
  filterLabel?: string;
  stats: {
    totalPeople: number;
    prospects: number;
    convertedPeople: number;
    conversionRate: number;
    vip: number;
    keep: number;
    watch: number;
    avgScore: number;
    avgHealthScore: number;
  };
  /** Répartition des prospects par statut (chaud/tiède/froid/...). */
  prospectsByStatus: {
    hot: number;
    warm: number;
    cold: number;
    converted: number;
    lost: number;
  };
  /** Lignes du tableau récapitulatif (une par personne). */
  rows: Array<{
    displayName: string;
    username: string;
    type: string;
    status: string;
    score: number;
    connection: string;
  }>;
}

/**
 * Exporte un résumé global de la section People : statistiques agrégées,
 * répartition par cercle / statut, puis tableau de toutes les personnes.
 */
export function exportPeopleSummaryToPDF(options: PeopleSummaryOptions): void {
  const {
    title = 'People Summary',
    filterLabel = 'All',
    stats,
    prospectsByStatus,
    rows,
  } = options;

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) {
    console.error('Failed to access iframe document');
    document.body.removeChild(iframe);
    return;
  }

  const statCard = (label: string, value: string | number, hint?: string) => `
    <div class="stat-card">
      <div class="stat-value">${escapeHtml(String(value))}</div>
      <div class="stat-label">${escapeHtml(label)}</div>
      ${hint ? `<div class="stat-hint">${escapeHtml(hint)}</div>` : ''}
    </div>
  `;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>${escapeHtml(title)}</title>
        <style>
          @page { size: A4; margin: 1.6cm; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.5;
            color: #1a1a1a;
            background: white;
            padding: 8px;
          }
          .header {
            border-bottom: 3px solid #8b5cf6;
            padding-bottom: 16px;
            margin-bottom: 24px;
          }
          .title { font-size: 30px; font-weight: 800; margin-bottom: 6px; }
          .subtitle { font-size: 14px; color: #6b7280; }
          .section { margin-bottom: 28px; }
          .section-title {
            font-size: 18px;
            font-weight: 700;
            margin-bottom: 14px;
            padding-bottom: 6px;
            border-bottom: 2px solid #e5e7eb;
          }
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
          }
          .stat-card {
            border: 1px solid #e5e7eb;
            border-radius: 10px;
            padding: 14px;
            background: #f9fafb;
          }
          .stat-value { font-size: 26px; font-weight: 800; color: #111827; }
          .stat-label { font-size: 12px; color: #6b7280; margin-top: 2px; font-weight: 600; }
          .stat-hint { font-size: 11px; color: #9ca3af; margin-top: 2px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          thead th {
            text-align: left;
            background: #f3f4f6;
            color: #374151;
            font-weight: 700;
            padding: 8px 10px;
            border-bottom: 2px solid #e5e7eb;
          }
          tbody td { padding: 8px 10px; border-bottom: 1px solid #f0f0f0; color: #374151; }
          tbody tr:nth-child(even) { background: #fafafa; }
          .muted { color: #9ca3af; }
          .footer {
            margin-top: 32px;
            padding-top: 16px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            font-size: 11px;
            color: #9ca3af;
          }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="title">${escapeHtml(title)}</h1>
          <p class="subtitle">Filter: ${escapeHtml(filterLabel)} • ${stats.totalPeople} person(s) • Generated on ${formatDate(new Date())}</p>
        </div>

        <div class="section">
          <h2 class="section-title">Overview</h2>
          <div class="stats-grid">
            ${statCard('Total People', stats.totalPeople)}
            ${statCard('Prospects', stats.prospects, `${stats.convertedPeople} converted (${stats.conversionRate}%)`)}
            ${statCard('Average score', `${stats.avgScore}/100`, 'Prospects')}
            ${statCard('Average health', `${stats.avgHealthScore}/100`, 'Network quality')}
          </div>
        </div>

        <div class="section">
          <h2 class="section-title">Breakdown by circle</h2>
          <div class="stats-grid">
            ${statCard('VIP', stats.vip, 'Circle 1')}
            ${statCard('To keep', stats.keep, 'Circle 2')}
            ${statCard('To watch', stats.watch, 'Circle 3')}
            ${statCard('Converted', stats.convertedPeople, `${stats.conversionRate}% of prospects`)}
          </div>
        </div>

        <div class="section">
          <h2 class="section-title">Prospects by status</h2>
          <div class="stats-grid">
            ${statCard('Hot', prospectsByStatus.hot)}
            ${statCard('Warm', prospectsByStatus.warm)}
            ${statCard('Cold', prospectsByStatus.cold)}
            ${statCard('Lost', prospectsByStatus.lost)}
          </div>
        </div>

        <div class="section">
          <h2 class="section-title">People details</h2>
          ${rows.length > 0 ? `
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Account</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Score</th>
                  <th>Connection</th>
                </tr>
              </thead>
              <tbody>
                ${rows.map(r => `
                  <tr>
                    <td>${escapeHtml(r.displayName)}</td>
                    <td>@${escapeHtml(r.username)}</td>
                    <td>${escapeHtml(r.type)}</td>
                    <td>${escapeHtml(r.status)}</td>
                    <td>${r.score}/100</td>
                    <td>${escapeHtml(r.connection)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : `<p class="muted">No people to display.</p>`}
        </div>

        <div class="footer">
          <p>Generated by Waler Pro Mode - ${formatDate(new Date())}</p>
        </div>
      </body>
    </html>
  `;

  iframeDoc.open();
  iframeDoc.write(htmlContent);
  iframeDoc.close();

  iframe.onload = () => {
    setTimeout(() => {
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 250);
  };
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Format date for display. Tolère les valeurs nulles ou invalides (ex. timestamp
 * manquant dans la timeline) pour ne jamais lever « Invalid time value ».
 */
function formatDate(date: Date | string | number | undefined | null): string {
  if (date === undefined || date === null) return 'Date inconnue';
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return 'Date inconnue';
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(d);
}
