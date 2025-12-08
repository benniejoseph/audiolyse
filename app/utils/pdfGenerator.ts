import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Type definitions
type ApiResult = {
  transcription: string;
  summary: string;
  language: string;
  durationSec?: number;
  mom: { participants: string[]; decisions: string[]; actionItems: string[]; nextSteps: string[] };
  insights?: { sentiment?: string; sentimentScore?: number; topics?: string[]; keywords?: string[] };
  coaching?: {
    overallScore: number;
    categoryScores?: { opening: number; discovery: number; solutionPresentation: number; objectionHandling: number; closing: number; empathy: number; clarity: number; compliance: number };
    strengths: string[];
    weaknesses: string[];
    missedOpportunities: string[];
    customerHandling: { score: number; feedback: string };
    communicationQuality: { score: number; feedback: string };
    pitchEffectiveness: { score: number; feedback: string };
    objectionHandling: { score: number; feedback: string };
    forcedSale?: { detected: boolean; severity: 'none' | 'mild' | 'moderate' | 'severe'; indicators: string[]; feedback: string };
    improvementSuggestions: string[];
    scriptRecommendations: string[];
    redFlags: string[];
    coachingSummary: string;
  };
  conversationMetrics?: {
    agentTalkRatio: number; customerTalkRatio: number; silenceRatio: number;
    totalQuestions: number; openQuestions: number; closedQuestions: number;
    agentInterruptions: number; customerInterruptions: number;
    avgResponseTimeSec: number; longestPauseSec: number;
    wordsPerMinuteAgent: number; wordsPerMinuteCustomer: number;
  };
  conversationSegments?: { name: string; startTime: string; endTime: string; durationSec: number; quality: string; notes: string }[];
  keyMoments?: { timestamp: string; type: string; speaker: string; text: string; sentiment: string; importance: string }[];
  predictions?: { conversionProbability: number; churnRisk: string; escalationRisk: string; satisfactionLikely: string; followUpNeeded: boolean; urgencyLevel: string };
  customerProfile?: { communicationStyle: string; decisionStyle: string; engagementLevel: string; pricesSensitivity: string; concerns: string[]; preferences: string[] };
  actionItems?: { forAgent: string[]; forManager: string[]; forFollowUp: string[] };
};

type BulkCallResult = { 
  id: string; 
  fileName: string; 
  fileSize: number; 
  status: 'pending' | 'processing' | 'completed' | 'error'; 
  result?: ApiResult; 
  error?: string;
  audioUrl?: string;
};

// ============ DESIGN CONSTANTS ============
const COLORS = {
  primary: [37, 99, 235] as [number, number, number],      // Blue
  secondary: [99, 102, 241] as [number, number, number],   // Indigo
  success: [22, 163, 74] as [number, number, number],      // Green
  warning: [234, 179, 8] as [number, number, number],      // Yellow
  danger: [220, 38, 38] as [number, number, number],       // Red
  dark: [30, 41, 59] as [number, number, number],          // Slate 800
  medium: [100, 116, 139] as [number, number, number],     // Slate 500
  light: [241, 245, 249] as [number, number, number],      // Slate 100
  white: [255, 255, 255] as [number, number, number],
  black: [0, 0, 0] as [number, number, number],
};

const FONTS = {
  title: 24,
  heading: 14,
  subheading: 12,
  body: 10,
  small: 9,
  tiny: 8,
};

// ============ HELPER FUNCTIONS ============
const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const getScoreColor = (score: number): [number, number, number] => {
  if (score >= 80) return COLORS.success;
  if (score >= 60) return COLORS.warning;
  return COLORS.danger;
};

const getRiskColor = (risk: string): [number, number, number] => {
  if (risk === 'high') return COLORS.danger;
  if (risk === 'medium') return COLORS.warning;
  return COLORS.success;
};

// Draw a circular score gauge
const drawScoreGauge = (doc: jsPDF, x: number, y: number, score: number, radius: number = 18, label?: string) => {
  const color = getScoreColor(score);
  
  // Background circle
  doc.setDrawColor(...COLORS.light);
  doc.setLineWidth(3);
  doc.circle(x, y, radius, 'S');
  
  // Score arc (simplified as colored circle outline)
  doc.setDrawColor(...color);
  doc.setLineWidth(3);
  
  // Draw arc based on score (approximation using multiple small lines)
  const startAngle = -90;
  const endAngle = startAngle + (score / 100) * 360;
  const segments = Math.floor(score / 2);
  
  for (let i = 0; i <= segments; i++) {
    const angle1 = (startAngle + (i / segments) * (endAngle - startAngle)) * (Math.PI / 180);
    const angle2 = (startAngle + ((i + 1) / segments) * (endAngle - startAngle)) * (Math.PI / 180);
    
    const x1 = x + radius * Math.cos(angle1);
    const y1 = y + radius * Math.sin(angle1);
    const x2 = x + radius * Math.cos(angle2);
    const y2 = y + radius * Math.sin(angle2);
    
    doc.line(x1, y1, x2, y2);
  }
  
  // Score text
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...color);
  doc.text(`${score}`, x, y + 2, { align: 'center' });
  
  // Label
  if (label) {
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.medium);
    doc.text(label, x, y + radius + 6, { align: 'center' });
  }
};

// Draw a horizontal progress bar
const drawProgressBar = (doc: jsPDF, x: number, y: number, width: number, height: number, value: number, color: [number, number, number]) => {
  // Background
  doc.setFillColor(...COLORS.light);
  doc.roundedRect(x, y, width, height, 2, 2, 'F');
  
  // Fill
  const fillWidth = (value / 100) * width;
  if (fillWidth > 0) {
    doc.setFillColor(...color);
    doc.roundedRect(x, y, fillWidth, height, 2, 2, 'F');
  }
};

// Draw section header with background
const drawSectionHeader = (doc: jsPDF, y: number, title: string, icon?: string): number => {
  doc.setFillColor(...COLORS.dark);
  doc.rect(14, y, 182, 10, 'F');
  
  doc.setFontSize(FONTS.heading);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.white);
  doc.text(`${icon ? icon + '  ' : ''}${title}`, 18, y + 7);
  
  return y + 14;
};

// Draw info card with border
const drawInfoCard = (doc: jsPDF, x: number, y: number, width: number, height: number, title: string, value: string, color?: [number, number, number]) => {
  // Card background
  doc.setFillColor(...COLORS.white);
  doc.setDrawColor(...COLORS.light);
  doc.setLineWidth(0.5);
  doc.roundedRect(x, y, width, height, 3, 3, 'FD');
  
  // Title
  doc.setFontSize(FONTS.tiny);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.medium);
  doc.text(title, x + width / 2, y + 8, { align: 'center' });
  
  // Value
  doc.setFontSize(FONTS.subheading);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...(color || COLORS.dark));
  doc.text(value, x + width / 2, y + 18, { align: 'center' });
};

// Add page header
const addPageHeader = (doc: jsPDF, fileName: string) => {
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, 210, 8, 'F');
  
  doc.setFontSize(FONTS.tiny);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.medium);
  doc.text('CallTranscribe AI Analysis', 14, 14);
  doc.text(fileName, 196, 14, { align: 'right' });
  
  doc.setDrawColor(...COLORS.light);
  doc.setLineWidth(0.3);
  doc.line(14, 17, 196, 17);
};

// Add page footer
const addPageFooter = (doc: jsPDF, pageNum: number, totalPages: number) => {
  doc.setFontSize(FONTS.tiny);
  doc.setTextColor(...COLORS.medium);
  doc.text(`Page ${pageNum} of ${totalPages}`, 105, 290, { align: 'center' });
  doc.text(new Date().toLocaleDateString(), 196, 290, { align: 'right' });
};

// Check if we need a new page
const checkPageBreak = (doc: jsPDF, y: number, needed: number, fileName: string): number => {
  if (y + needed > 275) {
    doc.addPage();
    addPageHeader(doc, fileName);
    return 25;
  }
  return y;
};

// ============ MAIN PDF GENERATOR ============
export const generateCallAnalysisPDF = (call: BulkCallResult) => {
  if (!call.result) return;
  
  const result = call.result;
  const fileName = call.fileName;
  const doc = new jsPDF();
  let y = 0;

  // ========== COVER PAGE ==========
  // Header bar
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, 210, 50, 'F');
  
  // Title
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.white);
  doc.text('Call Analysis Report', 105, 30, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Comprehensive AI-Powered Insights', 105, 42, { align: 'center' });
  
  // File info box
  y = 65;
  doc.setFillColor(...COLORS.light);
  doc.roundedRect(14, y, 182, 35, 4, 4, 'F');
  
  doc.setFontSize(FONTS.body);
  doc.setTextColor(...COLORS.dark);
  doc.setFont('helvetica', 'bold');
  doc.text('File:', 20, y + 12);
  doc.text('Duration:', 20, y + 22);
  doc.text('Language:', 110, y + 12);
  doc.text('Date:', 110, y + 22);
  
  doc.setFont('helvetica', 'normal');
  doc.text(fileName, 45, y + 12);
  doc.text(formatDuration(result.durationSec || 0), 45, y + 22);
  doc.text(result.language || 'Unknown', 140, y + 12);
  doc.text(new Date().toLocaleDateString(), 140, y + 22);
  
  // Key Metrics Row
  y = 115;
  doc.setFontSize(FONTS.heading);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.dark);
  doc.text('Key Performance Indicators', 14, y);
  y += 10;
  
  // Score gauges
  const coaching = result.coaching;
  const predictions = result.predictions;
  
  drawScoreGauge(doc, 40, y + 25, coaching?.overallScore || 0, 22, 'Overall Score');
  drawScoreGauge(doc, 90, y + 25, predictions?.conversionProbability || 0, 22, 'Conversion');
  
  // Risk indicators
  const churnColor = getRiskColor(predictions?.churnRisk || 'low');
  const escColor = getRiskColor(predictions?.escalationRisk || 'low');
  
  drawInfoCard(doc, 120, y, 35, 25, 'Churn Risk', (predictions?.churnRisk || 'low').toUpperCase(), churnColor);
  drawInfoCard(doc, 160, y, 35, 25, 'Escalation', (predictions?.escalationRisk || 'low').toUpperCase(), escColor);
  
  // Sentiment
  y += 55;
  const sentiment = result.insights?.sentiment || 'Neutral';
  const sentimentColor = sentiment === 'Positive' ? COLORS.success : sentiment === 'Negative' ? COLORS.danger : COLORS.warning;
  drawInfoCard(doc, 14, y, 60, 25, 'Overall Sentiment', sentiment, sentimentColor);
  drawInfoCard(doc, 80, y, 55, 25, 'Follow-up Needed', predictions?.followUpNeeded ? 'YES' : 'NO', predictions?.followUpNeeded ? COLORS.warning : COLORS.success);
  drawInfoCard(doc, 140, y, 55, 25, 'Urgency', (predictions?.urgencyLevel || 'low').toUpperCase(), getRiskColor(predictions?.urgencyLevel || 'low'));
  
  // Forced Sale Alert
  if (coaching?.forcedSale?.detected) {
    y += 35;
    doc.setFillColor(254, 226, 226);
    doc.setDrawColor(...COLORS.danger);
    doc.setLineWidth(1);
    doc.roundedRect(14, y, 182, 25, 3, 3, 'FD');
    
    doc.setFontSize(FONTS.subheading);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.danger);
    doc.text('⚠ FORCED SALE DETECTED', 20, y + 10);
    
    doc.setFontSize(FONTS.small);
    doc.setFont('helvetica', 'normal');
    doc.text(`Severity: ${coaching.forcedSale.severity.toUpperCase()} - ${coaching.forcedSale.feedback?.substring(0, 80) || ''}...`, 20, y + 19);
    y += 30;
  }
  
  // Executive Summary
  y += 10;
  y = drawSectionHeader(doc, y, 'Executive Summary', '📋');
  
  doc.setFontSize(FONTS.body);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.dark);
  const summaryLines = doc.splitTextToSize(result.summary || 'No summary available', 178);
  doc.text(summaryLines.slice(0, 8), 16, y + 5);
  
  // ========== PAGE 2: METRICS ==========
  doc.addPage();
  addPageHeader(doc, fileName);
  y = 25;
  
  y = drawSectionHeader(doc, y, 'Conversation Metrics', '📊');
  
  const metrics = result.conversationMetrics;
  if (metrics) {
    // Talk Ratio Visualization
    y += 5;
    doc.setFontSize(FONTS.small);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.dark);
    doc.text('Talk Time Distribution', 16, y);
    y += 8;
    
    // Stacked bar for talk ratios
    const barWidth = 170;
    const barHeight = 12;
    const agentWidth = (metrics.agentTalkRatio / 100) * barWidth;
    const customerWidth = (metrics.customerTalkRatio / 100) * barWidth;
    const silenceWidth = barWidth - agentWidth - customerWidth;
    
    doc.setFillColor(59, 130, 246); // Agent - Blue
    doc.rect(16, y, agentWidth, barHeight, 'F');
    doc.setFillColor(16, 185, 129); // Customer - Green
    doc.rect(16 + agentWidth, y, customerWidth, barHeight, 'F');
    doc.setFillColor(156, 163, 175); // Silence - Gray
    doc.rect(16 + agentWidth + customerWidth, y, silenceWidth, barHeight, 'F');
    
    // Labels
    y += barHeight + 6;
    doc.setFontSize(FONTS.tiny);
    doc.setFont('helvetica', 'normal');
    doc.setFillColor(59, 130, 246);
    doc.circle(20, y, 2, 'F');
    doc.setTextColor(...COLORS.dark);
    doc.text(`Agent: ${metrics.agentTalkRatio}%`, 25, y + 1);
    
    doc.setFillColor(16, 185, 129);
    doc.circle(75, y, 2, 'F');
    doc.text(`Customer: ${metrics.customerTalkRatio}%`, 80, y + 1);
    
    doc.setFillColor(156, 163, 175);
    doc.circle(140, y, 2, 'F');
    doc.text(`Silence: ${metrics.silenceRatio}%`, 145, y + 1);
    
    // Metrics Grid
    y += 15;
    const metricsData = [
      ['Total Questions', `${metrics.totalQuestions}`, 'Open Questions', `${metrics.openQuestions}`],
      ['Closed Questions', `${metrics.closedQuestions}`, 'Agent Interruptions', `${metrics.agentInterruptions}`],
      ['Customer Interruptions', `${metrics.customerInterruptions}`, 'Avg Response Time', `${metrics.avgResponseTimeSec?.toFixed(1)}s`],
      ['Longest Pause', `${metrics.longestPauseSec?.toFixed(1)}s`, 'Agent WPM', `${metrics.wordsPerMinuteAgent}`],
      ['Customer WPM', `${metrics.wordsPerMinuteCustomer}`, '', ''],
    ];
    
    autoTable(doc, {
      startY: y,
      body: metricsData,
      theme: 'striped',
      styles: { fontSize: FONTS.small, cellPadding: 3 },
      columnStyles: { 
        0: { fontStyle: 'bold', fillColor: [241, 245, 249] },
        2: { fontStyle: 'bold', fillColor: [241, 245, 249] }
      },
      alternateRowStyles: { fillColor: [255, 255, 255] },
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  }
  
  // Conversation Segments
  const segments = result.conversationSegments;
  if (segments && segments.length > 0) {
    y = checkPageBreak(doc, y, 60, fileName);
    y = drawSectionHeader(doc, y, 'Conversation Flow', '🔄');
    
    const segmentData = segments.map(seg => {
      const qualityColor = seg.quality === 'good' ? '✅' : seg.quality === 'needs_improvement' ? '⚠️' : '❌';
      return [seg.name, `${seg.startTime} - ${seg.endTime}`, `${seg.durationSec}s`, qualityColor, seg.notes || '-'];
    });
    
    autoTable(doc, {
      startY: y,
      head: [['Phase', 'Time Range', 'Duration', 'Quality', 'Notes']],
      body: segmentData,
      theme: 'grid',
      headStyles: { fillColor: COLORS.secondary, textColor: COLORS.white, fontStyle: 'bold' },
      styles: { fontSize: FONTS.tiny, cellPadding: 2 },
      columnStyles: { 4: { cellWidth: 60 } },
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  }
  
  // ========== PAGE 3: COACHING ==========
  doc.addPage();
  addPageHeader(doc, fileName);
  y = 25;
  
  y = drawSectionHeader(doc, y, 'AI Coaching Analysis', '🎯');
  
  if (coaching) {
    // Overall Score with breakdown
    y += 5;
    doc.setFontSize(FONTS.subheading);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.dark);
    doc.text('Performance Breakdown', 16, y);
    y += 10;
    
    // Category scores as progress bars
    const categories = coaching.categoryScores;
    if (categories) {
      Object.entries(categories).forEach(([key, score]) => {
        const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
        
        doc.setFontSize(FONTS.small);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...COLORS.dark);
        doc.text(label, 16, y + 3);
        
        drawProgressBar(doc, 70, y - 1, 100, 6, score, getScoreColor(score));
        
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...getScoreColor(score));
        doc.text(`${score}`, 175, y + 3);
        
        y += 10;
      });
    }
    
    // Strengths & Weaknesses
    y += 5;
    y = checkPageBreak(doc, y, 80, fileName);
    
    // Two column layout
    const colWidth = 88;
    
    // Strengths
    doc.setFillColor(236, 253, 245); // Light green
    doc.roundedRect(14, y, colWidth, 60, 3, 3, 'F');
    doc.setFontSize(FONTS.small);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.success);
    doc.text('✅ Strengths', 18, y + 8);
    
    doc.setFontSize(FONTS.tiny);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.dark);
    let strengthY = y + 15;
    (coaching.strengths || []).slice(0, 5).forEach(s => {
      const lines = doc.splitTextToSize(`• ${s}`, colWidth - 10);
      doc.text(lines, 18, strengthY);
      strengthY += lines.length * 4 + 2;
    });
    
    // Weaknesses
    doc.setFillColor(254, 242, 242); // Light red
    doc.roundedRect(106, y, colWidth, 60, 3, 3, 'F');
    doc.setFontSize(FONTS.small);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.danger);
    doc.text('⚠️ Areas to Improve', 110, y + 8);
    
    doc.setFontSize(FONTS.tiny);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.dark);
    let weaknessY = y + 15;
    (coaching.weaknesses || []).slice(0, 5).forEach(w => {
      const lines = doc.splitTextToSize(`• ${w}`, colWidth - 10);
      doc.text(lines, 110, weaknessY);
      weaknessY += lines.length * 4 + 2;
    });
    
    y += 65;
    
    // Improvement Suggestions
    y = checkPageBreak(doc, y, 50, fileName);
    doc.setFillColor(254, 249, 195); // Light yellow
    doc.roundedRect(14, y, 182, 45, 3, 3, 'F');
    doc.setFontSize(FONTS.small);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(161, 98, 7); // Amber 700
    doc.text('💡 Improvement Suggestions', 18, y + 8);
    
    doc.setFontSize(FONTS.tiny);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.dark);
    let sugY = y + 15;
    (coaching.improvementSuggestions || []).slice(0, 4).forEach((s, i) => {
      const lines = doc.splitTextToSize(`${i + 1}. ${s}`, 175);
      doc.text(lines, 18, sugY);
      sugY += lines.length * 4 + 2;
    });
    
    y += 50;
    
    // Red Flags
    if (coaching.redFlags && coaching.redFlags.length > 0) {
      y = checkPageBreak(doc, y, 40, fileName);
      doc.setFillColor(254, 226, 226);
      doc.setDrawColor(...COLORS.danger);
      doc.setLineWidth(1);
      doc.roundedRect(14, y, 182, 35, 3, 3, 'FD');
      
      doc.setFontSize(FONTS.small);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLORS.danger);
      doc.text('🚨 Red Flags - Immediate Attention Required', 18, y + 8);
      
      doc.setFontSize(FONTS.tiny);
      doc.setFont('helvetica', 'normal');
      let rfY = y + 15;
      coaching.redFlags.slice(0, 3).forEach(rf => {
        doc.text(`• ${rf}`, 18, rfY);
        rfY += 6;
      });
      y += 40;
    }
  }
  
  // ========== PAGE 4: KEY MOMENTS & PREDICTIONS ==========
  doc.addPage();
  addPageHeader(doc, fileName);
  y = 25;
  
  // Key Moments
  const keyMoments = result.keyMoments;
  if (keyMoments && keyMoments.length > 0) {
    y = drawSectionHeader(doc, y, 'Key Moments Timeline', '⚡');
    
    const momentIcons: Record<string, string> = {
      complaint: '😤', compliment: '😊', objection: '🤔', competitor_mention: '🏢',
      pricing_discussion: '💰', commitment: '✅', breakthrough: '💡', escalation_risk: '⚠️',
      pain_point: '😣', positive_signal: '👍', question: '❓'
    };
    
    const momentsData = keyMoments.slice(0, 12).map(m => [
      m.timestamp || '-',
      `${momentIcons[m.type] || '📌'} ${(m.type || '').replace(/_/g, ' ')}`,
      m.speaker || '-',
      m.sentiment || '-',
      (m.text || '').substring(0, 45) + ((m.text || '').length > 45 ? '...' : '')
    ]);
    
    autoTable(doc, {
      startY: y,
      head: [['Time', 'Event Type', 'Speaker', 'Sentiment', 'What was said']],
      body: momentsData,
      theme: 'grid',
      headStyles: { fillColor: COLORS.primary, textColor: COLORS.white, fontStyle: 'bold', fontSize: FONTS.tiny },
      styles: { fontSize: FONTS.tiny, cellPadding: 2 },
      columnStyles: { 4: { cellWidth: 55 } },
      didParseCell: (data: any) => {
        if (data.section === 'body' && data.column.index === 3) {
          const sentiment = data.cell.raw?.toLowerCase();
          if (sentiment === 'positive') data.cell.styles.textColor = COLORS.success;
          else if (sentiment === 'negative') data.cell.styles.textColor = COLORS.danger;
        }
      }
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  }
  
  // Customer Profile
  const profile = result.customerProfile;
  if (profile) {
    y = checkPageBreak(doc, y, 50, fileName);
    y = drawSectionHeader(doc, y, 'Customer Profile', '👤');
    
    const profileData = [
      ['Communication Style', profile.communicationStyle || '-', 'Decision Style', profile.decisionStyle || '-'],
      ['Engagement Level', profile.engagementLevel || '-', 'Price Sensitivity', profile.pricesSensitivity || '-'],
    ];
    
    autoTable(doc, {
      startY: y,
      body: profileData,
      theme: 'plain',
      styles: { fontSize: FONTS.small, cellPadding: 3 },
      columnStyles: { 0: { fontStyle: 'bold' }, 2: { fontStyle: 'bold' } },
    });
    y = (doc as any).lastAutoTable.finalY + 5;
    
    if (profile.concerns && profile.concerns.length > 0) {
      doc.setFontSize(FONTS.small);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLORS.dark);
      doc.text('Key Concerns:', 16, y);
      doc.setFont('helvetica', 'normal');
      doc.text(profile.concerns.join(', '), 50, y);
      y += 10;
    }
  }
  
  // Action Items
  const actions = result.actionItems;
  if (actions) {
    y = checkPageBreak(doc, y, 60, fileName);
    y = drawSectionHeader(doc, y, 'Action Items', '✅');
    
    const allActions: string[][] = [];
    (actions.forAgent || []).forEach(a => allActions.push(['Agent', a, '☐']));
    (actions.forManager || []).forEach(a => allActions.push(['Manager', a, '☐']));
    (actions.forFollowUp || []).forEach(a => allActions.push(['Follow-up', a, '☐']));
    
    if (allActions.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [['Assigned To', 'Action Item', 'Done']],
        body: allActions,
        theme: 'grid',
        headStyles: { fillColor: COLORS.success, textColor: COLORS.white, fontStyle: 'bold' },
        styles: { fontSize: FONTS.small, cellPadding: 3 },
        columnStyles: { 0: { cellWidth: 25 }, 2: { cellWidth: 15, halign: 'center' } },
      });
      y = (doc as any).lastAutoTable.finalY + 10;
    }
  }
  
  // ========== PAGE 5: TRANSCRIPT & MOM ==========
  doc.addPage();
  addPageHeader(doc, fileName);
  y = 25;
  
  // MOM
  y = drawSectionHeader(doc, y, 'Minutes of Meeting', '📝');
  
  const mom = result.mom;
  if (mom) {
    const momData = [
      ['Participants', (mom.participants || []).join(', ') || 'Not identified'],
      ['Decisions Made', (mom.decisions || []).join('; ') || 'None recorded'],
      ['Action Items', (mom.actionItems || []).join('; ') || 'None'],
      ['Next Steps', (mom.nextSteps || []).join('; ') || 'None defined'],
    ];
    
    autoTable(doc, {
      startY: y,
      body: momData,
      theme: 'striped',
      styles: { fontSize: FONTS.small, cellPadding: 4 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 35, fillColor: COLORS.light } },
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  }
  
  // Topics & Keywords
  if (result.insights?.topics || result.insights?.keywords) {
    y = checkPageBreak(doc, y, 30, fileName);
    doc.setFontSize(FONTS.small);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.dark);
    
    if (result.insights.topics && result.insights.topics.length > 0) {
      doc.text('Topics Discussed:', 16, y);
      doc.setFont('helvetica', 'normal');
      doc.text(result.insights.topics.join(', '), 55, y);
      y += 8;
    }
    
    if (result.insights.keywords && result.insights.keywords.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.text('Keywords:', 16, y);
      doc.setFont('helvetica', 'normal');
      doc.text(result.insights.keywords.join(', '), 55, y);
      y += 10;
    }
  }
  
  // Transcript (abbreviated)
  y = checkPageBreak(doc, y, 80, fileName);
  y = drawSectionHeader(doc, y, 'Transcript (First 2000 characters)', '💬');
  
  doc.setFontSize(FONTS.tiny);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.dark);
  
  const transcript = (result.transcription || 'No transcript available').substring(0, 2000);
  const transcriptLines = doc.splitTextToSize(transcript, 178);
  
  // Add transcript with pagination
  transcriptLines.forEach((line: string, i: number) => {
    if (y > 275) {
      doc.addPage();
      addPageHeader(doc, fileName);
      y = 25;
    }
    doc.text(line, 16, y);
    y += 4;
  });
  
  // ========== ADD PAGE NUMBERS ==========
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addPageFooter(doc, i, totalPages);
  }
  
  // Save
  doc.save(`CallAnalysis_${fileName.replace(/\.[^/.]+$/, '')}_${new Date().toISOString().slice(0, 10)}.pdf`);
};

// ============ BULK PDF GENERATOR ============
export const generateBulkAnalysisPDF = (results: BulkCallResult[]) => {
  const doc = new jsPDF();
  let y = 0;
  
  const completed = results.filter(r => r.status === 'completed' && r.result);
  
  // ========== COVER PAGE ==========
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, 210, 60, 'F');
  
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.white);
  doc.text('Bulk Call Analysis', 105, 28, { align: 'center' });
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text('Team Performance Report', 105, 42, { align: 'center' });
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 105, 52, { align: 'center' });
  
  // Summary Stats
  y = 75;
  const avgScore = completed.reduce((a, c) => a + (c.result?.coaching?.overallScore || 0), 0) / (completed.length || 1);
  const avgConversion = completed.reduce((a, c) => a + (c.result?.predictions?.conversionProbability || 0), 0) / (completed.length || 1);
  const totalRedFlags = completed.reduce((a, c) => a + (c.result?.coaching?.redFlags?.length || 0), 0);
  const forcedSales = completed.filter(r => r.result?.coaching?.forcedSale?.detected).length;
  
  // Stats cards
  drawInfoCard(doc, 14, y, 43, 30, 'Total Calls', `${results.length}`, COLORS.primary);
  drawInfoCard(doc, 60, y, 43, 30, 'Analyzed', `${completed.length}`, COLORS.secondary);
  drawInfoCard(doc, 106, y, 43, 30, 'Avg Score', `${avgScore.toFixed(0)}`, getScoreColor(avgScore));
  drawInfoCard(doc, 152, y, 43, 30, 'Avg Conv.', `${avgConversion.toFixed(0)}%`, getScoreColor(avgConversion));
  
  y += 40;
  drawInfoCard(doc, 14, y, 60, 28, 'Red Flags', `${totalRedFlags}`, totalRedFlags > 0 ? COLORS.danger : COLORS.success);
  drawInfoCard(doc, 78, y, 60, 28, 'Forced Sales', `${forcedSales}`, forcedSales > 0 ? COLORS.danger : COLORS.success);
  
  // Sentiment breakdown
  const sentiments = completed.map(r => r.result?.insights?.sentiment?.toLowerCase() || 'neutral');
  const positive = sentiments.filter(s => s === 'positive').length;
  const negative = sentiments.filter(s => s === 'negative').length;
  const neutral = sentiments.filter(s => s === 'neutral').length;
  
  drawInfoCard(doc, 142, y, 26, 28, '😊', `${positive}`, COLORS.success);
  drawInfoCard(doc, 170, y, 26, 28, '😤', `${negative}`, COLORS.danger);
  
  // All Calls Table
  y += 40;
  y = drawSectionHeader(doc, y, 'Individual Call Results', '📋');
  
  const tableData = results.map(r => {
    if (r.status !== 'completed' || !r.result) {
      return [r.fileName.substring(0, 25), '-', '-', '-', '-', r.status];
    }
    const res = r.result;
    return [
      r.fileName.substring(0, 25),
      `${res.coaching?.overallScore || 0}`,
      res.insights?.sentiment || '-',
      `${res.predictions?.conversionProbability || 0}%`,
      res.predictions?.churnRisk || '-',
      res.coaching?.forcedSale?.detected ? '⚠️ YES' : '✓'
    ];
  });
  
  autoTable(doc, {
    startY: y,
    head: [['File Name', 'Score', 'Sentiment', 'Conv %', 'Churn', 'Forced']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: COLORS.primary, textColor: COLORS.white, fontStyle: 'bold', fontSize: FONTS.tiny },
    styles: { fontSize: FONTS.tiny, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { halign: 'center', cellWidth: 18 },
      2: { halign: 'center', cellWidth: 22 },
      3: { halign: 'center', cellWidth: 18 },
      4: { halign: 'center', cellWidth: 18 },
      5: { halign: 'center', cellWidth: 18 },
    },
    didParseCell: (data: any) => {
      if (data.section === 'body') {
        // Score color
        if (data.column.index === 1) {
          const score = parseInt(data.cell.raw) || 0;
          data.cell.styles.textColor = getScoreColor(score);
          data.cell.styles.fontStyle = 'bold';
        }
        // Forced sale highlight
        if (data.column.index === 5 && data.cell.raw?.includes('YES')) {
          data.cell.styles.textColor = COLORS.danger;
          data.cell.styles.fontStyle = 'bold';
        }
      }
    }
  });
  y = (doc as any).lastAutoTable.finalY + 15;
  
  // Team Insights
  y = checkPageBreak(doc, y, 80, 'Bulk Report');
  
  const allStrengths = completed.flatMap(r => r.result?.coaching?.strengths || []);
  const allWeaknesses = completed.flatMap(r => r.result?.coaching?.weaknesses || []);
  
  const countFreq = (arr: string[]) => {
    const freq: Record<string, number> = {};
    arr.forEach(item => { const key = item.toLowerCase().trim(); freq[key] = (freq[key] || 0) + 1; });
    return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k]) => k);
  };
  
  // Two column layout for strengths/weaknesses
  const colWidth = 88;
  
  doc.setFillColor(236, 253, 245);
  doc.roundedRect(14, y, colWidth, 55, 3, 3, 'F');
  doc.setFontSize(FONTS.small);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.success);
  doc.text('Team Strengths', 18, y + 8);
  
  doc.setFontSize(FONTS.tiny);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.dark);
  let sY = y + 15;
  countFreq(allStrengths).forEach(s => {
    doc.text(`• ${s}`, 18, sY);
    sY += 8;
  });
  
  doc.setFillColor(254, 242, 242);
  doc.roundedRect(106, y, colWidth, 55, 3, 3, 'F');
  doc.setFontSize(FONTS.small);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.danger);
  doc.text('Common Issues', 110, y + 8);
  
  doc.setFontSize(FONTS.tiny);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.dark);
  let wY = y + 15;
  countFreq(allWeaknesses).forEach(w => {
    doc.text(`• ${w}`, 110, wY);
    wY += 8;
  });
  
  // Page numbers
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(FONTS.tiny);
    doc.setTextColor(...COLORS.medium);
    doc.text(`Page ${i} of ${totalPages}`, 105, 290, { align: 'center' });
    doc.text('CallTranscribe - Bulk Analysis', 14, 290);
  }
  
  doc.save(`BulkAnalysis_${new Date().toISOString().slice(0, 10)}.pdf`);
};
