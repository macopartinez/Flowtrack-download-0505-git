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
                    ${m.date ? `<div class="milestone-date">Complété le ${formatDate(m.date)}</div>` : ''}
                  </div>
                </li>
              `).join('')}
            </ul>
          </div>
        ` : ''}
        
        <div class="footer">
          <p>Généré par FlowTrack Mode Pro - ${formatDate(new Date())}</p>
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
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Format date for display
 */
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}
