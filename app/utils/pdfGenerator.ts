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
  primary: [37, 99, 235] as [number, number, number],
  primaryLight: [219, 234, 254] as [number, number, number],
  secondary: [99, 102, 241] as [number, number, number],
  success: [22, 163, 74] as [number, number, number],
  successLight: [220, 252, 231] as [number, number, number],
  warning: [234, 179, 8] as [number, number, number],
  warningLight: [254, 249, 195] as [number, number, number],
  danger: [220, 38, 38] as [number, number, number],
  dangerLight: [254, 226, 226] as [number, number, number],
  dark: [30, 41, 59] as [number, number, number],
  medium: [100, 116, 139] as [number, number, number],
  light: [241, 245, 249] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  agentBlue: [59, 130, 246] as [number, number, number],
  customerGreen: [16, 185, 129] as [number, number, number],
  silenceGray: [156, 163, 175] as [number, number, number],
};

// ============ HELPER FUNCTIONS ============
const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Normalize percentage values (API might return 0.62 for 62% or 62 for 62%)
const normalizePercentage = (value: number): number => {
  if (value === undefined || value === null) return 0;
  // If value is between 0 and 1 (exclusive), it's a decimal - multiply by 100
  if (value > 0 && value < 1) return Math.round(value * 100);
  // If value is already 0-100, return as-is
  return Math.round(value);
};

// Sanitize text to remove problematic Unicode characters
const sanitizeText = (text: string): string => {
  if (!text) return '';
  return text
    // Replace common currency symbols with text
    .replace(/₹/g, 'Rs.')
    .replace(/€/g, 'EUR ')
    .replace(/£/g, 'GBP ')
    .replace(/¥/g, 'JPY ')
    // Replace other problematic characters
    .replace(/[\u2018\u2019]/g, "'")  // Smart quotes
    .replace(/[\u201C\u201D]/g, '"')  // Smart double quotes
    .replace(/\u2013/g, '-')  // En dash
    .replace(/\u2014/g, '--') // Em dash
    .replace(/\u2026/g, '...') // Ellipsis
    // Remove any remaining non-ASCII characters that might cause issues
    .replace(/[^\x00-\x7F]/g, ' ')
    .trim();
};

const getScoreColor = (score: number): [number, number, number] => {
  if (score >= 80) return COLORS.success;
  if (score >= 60) return COLORS.warning;
  return COLORS.danger;
};

const getRiskColor = (risk: string): [number, number, number] => {
  const r = (risk || 'low').toLowerCase();
  if (r === 'high') return COLORS.danger;
  if (r === 'medium') return COLORS.warning;
  return COLORS.success;
};

const getQualityText = (quality: string): string => {
  const q = (quality || '').toLowerCase();
  if (q === 'good' || q === 'excellent') return 'Good';
  if (q === 'needs_improvement' || q === 'average') return 'Needs Work';
  if (q === 'poor') return 'Poor';
  return quality || '-';
};

// Draw section header
const drawSectionHeader = (doc: jsPDF, y: number, title: string): number => {
  doc.setFillColor(...COLORS.dark);
  doc.rect(14, y, 182, 9, 'F');
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.white);
  doc.text(title.toUpperCase(), 18, y + 6.5);
  
  return y + 13;
};

// Draw a clean score circle
const drawScoreCircle = (doc: jsPDF, x: number, y: number, score: number, size: number = 20, label?: string) => {
  const color = getScoreColor(score);
  
  // Outer circle (background)
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(2.5);
  doc.circle(x, y, size, 'S');
  
  // Score arc - draw as colored portion
  doc.setDrawColor(...color);
  doc.setLineWidth(2.5);
  
  // Simple approach: draw partial circle based on score
  const startAngle = -Math.PI / 2;
  const endAngle = startAngle + (score / 100) * 2 * Math.PI;
  
  // Draw arc using small line segments
  const steps = Math.max(1, Math.floor(score / 3));
  for (let i = 0; i < steps; i++) {
    const a1 = startAngle + (i / steps) * (endAngle - startAngle);
    const a2 = startAngle + ((i + 1) / steps) * (endAngle - startAngle);
    
    const x1 = x + size * Math.cos(a1);
    const y1 = y + size * Math.sin(a1);
    const x2 = x + size * Math.cos(a2);
    const y2 = y + size * Math.sin(a2);
    
    doc.line(x1, y1, x2, y2);
  }
  
  // Score number
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...color);
  doc.text(String(score), x, y + 4, { align: 'center' });
  
  // Label below
  if (label) {
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.medium);
    doc.text(label, x, y + size + 6, { align: 'center' });
  }
};

// Draw info box
const drawInfoBox = (doc: jsPDF, x: number, y: number, w: number, h: number, label: string, value: string, color?: [number, number, number]) => {
  // Box
  doc.setFillColor(...COLORS.white);
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.roundedRect(x, y, w, h, 2, 2, 'FD');
  
  // Label
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.medium);
  doc.text(label, x + w/2, y + 7, { align: 'center' });
  
  // Value
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...(color || COLORS.dark));
  doc.text(value, x + w/2, y + 16, { align: 'center' });
};

// Draw progress bar
const drawProgressBar = (doc: jsPDF, x: number, y: number, width: number, height: number, value: number, color: [number, number, number]) => {
  // Background
  doc.setFillColor(...COLORS.light);
  doc.roundedRect(x, y, width, height, 1, 1, 'F');
  
  // Fill
  const fillWidth = Math.max(0, Math.min(width, (value / 100) * width));
  if (fillWidth > 0) {
    doc.setFillColor(...color);
    doc.roundedRect(x, y, fillWidth, height, 1, 1, 'F');
  }
};

// Add page header
const addPageHeader = (doc: jsPDF, fileName: string) => {
  // Top blue bar
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, 210, 6, 'F');
  
  // Header text
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.medium);
  doc.text('CallTranscribe AI - Call Analysis Report', 14, 12);
  
  // File name (truncated)
  const displayName = fileName.length > 40 ? fileName.substring(0, 37) + '...' : fileName;
  doc.text(displayName, 196, 12, { align: 'right' });
  
  // Separator line
  doc.setDrawColor(...COLORS.light);
  doc.setLineWidth(0.5);
  doc.line(14, 15, 196, 15);
};

// Add page footer
const addPageFooter = (doc: jsPDF, pageNum: number, totalPages: number) => {
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.medium);
  doc.text(`Page ${pageNum} of ${totalPages}`, 105, 290, { align: 'center' });
  doc.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 196, 290, { align: 'right' });
};

// Check page break
const needsPageBreak = (y: number, needed: number): boolean => y + needed > 275;

// ============ MAIN PDF GENERATOR ============
export const generateCallAnalysisPDF = (call: BulkCallResult) => {
  if (!call.result) return;
  
  const result = call.result;
  const fileName = call.fileName;
  const doc = new jsPDF();
  let y = 0;

  // ==================== PAGE 1: COVER ====================
  // Header
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, 210, 45, 'F');
  
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.white);
  doc.text('Call Analysis Report', 105, 22, { align: 'center' });
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Comprehensive AI-Powered Analysis', 105, 34, { align: 'center' });
  
  // File Info Box
  y = 55;
  doc.setFillColor(...COLORS.light);
  doc.roundedRect(14, y, 182, 28, 3, 3, 'F');
  
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.dark);
  doc.setFont('helvetica', 'bold');
  doc.text('File:', 20, y + 10);
  doc.text('Duration:', 20, y + 20);
  doc.text('Language:', 110, y + 10);
  doc.text('Date:', 110, y + 20);
  
  doc.setFont('helvetica', 'normal');
  const shortFileName = fileName.length > 35 ? fileName.substring(0, 32) + '...' : fileName;
  doc.text(shortFileName, 38, y + 10);
  doc.text(formatDuration(result.durationSec || 0), 45, y + 20);
  doc.text(result.language || 'Unknown', 135, y + 10);
  doc.text(new Date().toLocaleDateString(), 125, y + 20);
  
  // Key Metrics Section
  y = 95;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.dark);
  doc.text('KEY PERFORMANCE INDICATORS', 14, y);
  y += 8;
  
  const coaching = result.coaching;
  const predictions = result.predictions;
  
  // Score circles row - normalize conversion probability
  const overallScore = coaching?.overallScore || 0;
  const conversionProb = normalizePercentage(predictions?.conversionProbability || 0);
  
  drawScoreCircle(doc, 35, y + 22, overallScore, 18, 'Overall Score');
  drawScoreCircle(doc, 85, y + 22, conversionProb, 18, 'Conversion %');
  
  // Risk boxes
  const churnRisk = (predictions?.churnRisk || 'low').toUpperCase();
  const escRisk = (predictions?.escalationRisk || 'low').toUpperCase();
  drawInfoBox(doc, 115, y + 2, 38, 22, 'Churn Risk', churnRisk, getRiskColor(predictions?.churnRisk || 'low'));
  drawInfoBox(doc, 158, y + 2, 38, 22, 'Escalation', escRisk, getRiskColor(predictions?.escalationRisk || 'low'));
  
  y += 50;
  
  // Second row of metrics
  const sentiment = result.insights?.sentiment || 'Neutral';
  const sentimentColor = sentiment.toLowerCase() === 'positive' ? COLORS.success : sentiment.toLowerCase() === 'negative' ? COLORS.danger : COLORS.warning;
  const followUp = predictions?.followUpNeeded ? 'YES' : 'NO';
  const followUpColor = predictions?.followUpNeeded ? COLORS.warning : COLORS.success;
  const urgency = (predictions?.urgencyLevel || 'low').toUpperCase();
  
  drawInfoBox(doc, 14, y, 55, 22, 'Sentiment', sentiment, sentimentColor);
  drawInfoBox(doc, 74, y, 55, 22, 'Follow-up Needed', followUp, followUpColor);
  drawInfoBox(doc, 134, y, 62, 22, 'Urgency Level', urgency, getRiskColor(predictions?.urgencyLevel || 'low'));
  
  y += 30;
  
  // Forced Sale Alert
  if (coaching?.forcedSale?.detected) {
    doc.setFillColor(...COLORS.dangerLight);
    doc.setDrawColor(...COLORS.danger);
    doc.setLineWidth(0.8);
    doc.roundedRect(14, y, 182, 22, 2, 2, 'FD');
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.danger);
    doc.text('WARNING: FORCED SALE TACTICS DETECTED', 20, y + 8);
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const feedbackText = sanitizeText(coaching.forcedSale.feedback || '').substring(0, 90);
    doc.text(`Severity: ${(coaching.forcedSale.severity || 'unknown').toUpperCase()} - ${feedbackText}`, 20, y + 16);
    y += 28;
  }
  
  // Executive Summary
  y += 5;
  y = drawSectionHeader(doc, y, 'Executive Summary');
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.dark);
  const summaryText = sanitizeText(result.summary || 'No summary available for this call.');
  const summaryLines = doc.splitTextToSize(summaryText, 178);
  doc.text(summaryLines.slice(0, 10), 16, y + 4);
  
  // ==================== PAGE 2: METRICS ====================
  doc.addPage();
  addPageHeader(doc, fileName);
  y = 22;
  
  y = drawSectionHeader(doc, y, 'Conversation Metrics');
  
  const metrics = result.conversationMetrics;
  if (metrics) {
    // Talk Ratio Section
    y += 4;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.dark);
    doc.text('Talk Time Distribution', 16, y);
    y += 6;
    
    // Stacked bar
    const barWidth = 170;
    const barHeight = 14;
    // Normalize percentages (API might return 0.62 for 62% or 62 for 62%)
    const agentRatio = normalizePercentage(metrics.agentTalkRatio || 0);
    const customerRatio = normalizePercentage(metrics.customerTalkRatio || 0);
    const silenceRatio = normalizePercentage(metrics.silenceRatio || 0);
    
    const agentW = (agentRatio / 100) * barWidth;
    const customerW = (customerRatio / 100) * barWidth;
    const silenceW = barWidth - agentW - customerW;
    
    // Draw bar segments
    doc.setFillColor(...COLORS.agentBlue);
    if (agentW > 0) doc.rect(16, y, agentW, barHeight, 'F');
    
    doc.setFillColor(...COLORS.customerGreen);
    if (customerW > 0) doc.rect(16 + agentW, y, customerW, barHeight, 'F');
    
    doc.setFillColor(...COLORS.silenceGray);
    if (silenceW > 0) doc.rect(16 + agentW + customerW, y, Math.max(0, silenceW), barHeight, 'F');
    
    // Border
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.rect(16, y, barWidth, barHeight, 'S');
    
    y += barHeight + 6;
    
    // Legend
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    
    doc.setFillColor(...COLORS.agentBlue);
    doc.rect(16, y - 2, 8, 4, 'F');
    doc.setTextColor(...COLORS.dark);
    doc.text(`Agent: ${agentRatio}%`, 26, y + 1);
    
    doc.setFillColor(...COLORS.customerGreen);
    doc.rect(75, y - 2, 8, 4, 'F');
    doc.text(`Customer: ${customerRatio}%`, 85, y + 1);
    
    doc.setFillColor(...COLORS.silenceGray);
    doc.rect(145, y - 2, 8, 4, 'F');
    doc.text(`Silence: ${silenceRatio}%`, 155, y + 1);
    
    y += 12;
    
    // Metrics table
    const metricsData = [
      ['Total Questions', String(metrics.totalQuestions || 0), 'Open Questions', String(metrics.openQuestions || 0)],
      ['Closed Questions', String(metrics.closedQuestions || 0), 'Agent Interruptions', String(metrics.agentInterruptions || 0)],
      ['Customer Interruptions', String(metrics.customerInterruptions || 0), 'Avg Response Time', `${(metrics.avgResponseTimeSec || 0).toFixed(1)}s`],
      ['Longest Pause', `${(metrics.longestPauseSec || 0).toFixed(1)}s`, 'Agent WPM', String(metrics.wordsPerMinuteAgent || 0)],
      ['Customer WPM', String(metrics.wordsPerMinuteCustomer || 0), '', ''],
    ];
    
    autoTable(doc, {
      startY: y,
      body: metricsData,
      theme: 'striped',
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: { 
        0: { fontStyle: 'bold', cellWidth: 45 },
        1: { cellWidth: 25 },
        2: { fontStyle: 'bold', cellWidth: 45 },
        3: { cellWidth: 25 }
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });
    y = (doc as any).lastAutoTable.finalY + 12;
  }
  
  // Conversation Flow
  const segments = result.conversationSegments;
  if (segments && segments.length > 0) {
    if (needsPageBreak(y, 60)) {
      doc.addPage();
      addPageHeader(doc, fileName);
      y = 22;
    }
    
    y = drawSectionHeader(doc, y, 'Conversation Flow');
    
    const segmentData = segments.map(seg => [
      sanitizeText(seg.name || '-'),
      `${seg.startTime || '0:00'} - ${seg.endTime || '0:00'}`,
      `${seg.durationSec || 0}s`,
      getQualityText(seg.quality),
      sanitizeText(seg.notes || '-').substring(0, 50)
    ]);
    
    autoTable(doc, {
      startY: y,
      head: [['Phase', 'Time Range', 'Duration', 'Quality', 'Notes']],
      body: segmentData,
      theme: 'grid',
      headStyles: { fillColor: COLORS.secondary, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: { 
        0: { cellWidth: 45 },
        1: { cellWidth: 28 },
        2: { cellWidth: 18 },
        3: { cellWidth: 22 },
        4: { cellWidth: 67 }
      },
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  }
  
  // ==================== PAGE 3: COACHING ====================
  doc.addPage();
  addPageHeader(doc, fileName);
  y = 22;
  
  y = drawSectionHeader(doc, y, 'AI Coaching Analysis');
  
  if (coaching) {
    // Overall Score
    y += 4;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.dark);
    doc.text('Performance Breakdown', 16, y);
    y += 10;
    
    // Category scores with progress bars
    const categories = coaching.categoryScores;
    if (categories) {
      Object.entries(categories).forEach(([key, score]) => {
        const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
        const numScore = typeof score === 'number' ? score : 0;
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...COLORS.dark);
        doc.text(label, 16, y + 3);
        
        drawProgressBar(doc, 65, y, 100, 5, numScore, getScoreColor(numScore));
        
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...getScoreColor(numScore));
        doc.text(String(numScore), 172, y + 3);
        
        y += 9;
      });
    }
    
    y += 8;
    
    // Strengths and Weaknesses - Two columns
    if (needsPageBreak(y, 70)) {
      doc.addPage();
      addPageHeader(doc, fileName);
      y = 22;
    }
    
    const colWidth = 88;
    const boxHeight = 55;
    
    // Strengths box
    doc.setFillColor(...COLORS.successLight);
    doc.roundedRect(14, y, colWidth, boxHeight, 2, 2, 'F');
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.success);
    doc.text('STRENGTHS', 18, y + 8);
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.dark);
    let sY = y + 15;
    (coaching.strengths || []).slice(0, 5).forEach(s => {
      const lines = doc.splitTextToSize('* ' + sanitizeText(s), colWidth - 8);
      doc.text(lines.slice(0, 2), 18, sY);
      sY += lines.length * 4 + 2;
    });
    
    // Weaknesses box
    doc.setFillColor(...COLORS.dangerLight);
    doc.roundedRect(106, y, colWidth, boxHeight, 2, 2, 'F');
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.danger);
    doc.text('AREAS TO IMPROVE', 110, y + 8);
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.dark);
    let wY = y + 15;
    (coaching.weaknesses || []).slice(0, 5).forEach(w => {
      const lines = doc.splitTextToSize('* ' + sanitizeText(w), colWidth - 8);
      doc.text(lines.slice(0, 2), 110, wY);
      wY += lines.length * 4 + 2;
    });
    
    y += boxHeight + 8;
    
    // Improvement Suggestions
    if (coaching.improvementSuggestions && coaching.improvementSuggestions.length > 0) {
      if (needsPageBreak(y, 45)) {
        doc.addPage();
        addPageHeader(doc, fileName);
        y = 22;
      }
      
      doc.setFillColor(...COLORS.warningLight);
      doc.roundedRect(14, y, 182, 40, 2, 2, 'F');
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(161, 98, 7);
      doc.text('IMPROVEMENT SUGGESTIONS', 18, y + 8);
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...COLORS.dark);
      let iY = y + 15;
      coaching.improvementSuggestions.slice(0, 4).forEach((s, i) => {
        const lines = doc.splitTextToSize(`${i + 1}. ${sanitizeText(s)}`, 175);
        doc.text(lines.slice(0, 2), 18, iY);
        iY += lines.length * 4 + 2;
      });
      
      y += 45;
    }
    
    // Red Flags (only if there are any)
    if (coaching.redFlags && coaching.redFlags.length > 0 && coaching.redFlags[0] !== 'None detected.' && coaching.redFlags[0] !== '') {
      if (needsPageBreak(y, 35)) {
        doc.addPage();
        addPageHeader(doc, fileName);
        y = 22;
      }
      
      doc.setFillColor(...COLORS.dangerLight);
      doc.setDrawColor(...COLORS.danger);
      doc.setLineWidth(0.8);
      doc.roundedRect(14, y, 182, 30, 2, 2, 'FD');
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLORS.danger);
      doc.text('RED FLAGS - IMMEDIATE ATTENTION', 18, y + 8);
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      let rfY = y + 15;
      coaching.redFlags.slice(0, 3).forEach(rf => {
        if (rf && rf.trim()) {
          doc.text('* ' + sanitizeText(rf).substring(0, 90), 18, rfY);
          rfY += 5;
        }
      });
      
      y += 35;
    }
    
    // Coaching Summary
    if (coaching.coachingSummary) {
      if (needsPageBreak(y, 30)) {
        doc.addPage();
        addPageHeader(doc, fileName);
        y = 22;
      }
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLORS.dark);
      doc.text('Coaching Summary:', 16, y + 5);
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      const coachSummaryLines = doc.splitTextToSize(sanitizeText(coaching.coachingSummary), 178);
      doc.text(coachSummaryLines.slice(0, 4), 16, y + 12);
      y += 30;
    }
  }
  
  // ==================== PAGE 4: KEY MOMENTS ====================
  doc.addPage();
  addPageHeader(doc, fileName);
  y = 22;
  
  // Key Moments
  const keyMoments = result.keyMoments;
  if (keyMoments && keyMoments.length > 0) {
    y = drawSectionHeader(doc, y, 'Key Moments Timeline');
    
    const momentTypeLabels: Record<string, string> = {
      complaint: 'Complaint',
      compliment: 'Compliment',
      objection: 'Objection',
      competitor_mention: 'Competitor',
      pricing_discussion: 'Pricing',
      commitment: 'Commitment',
      breakthrough: 'Breakthrough',
      escalation_risk: 'Escalation Risk',
      pain_point: 'Pain Point',
      positive_signal: 'Positive Signal',
      question: 'Question'
    };
    
    const momentsData = keyMoments.slice(0, 15).map(m => {
      const cleanText = sanitizeText(m.text || '');
      return [
        m.timestamp || '-',
        momentTypeLabels[m.type] || (m.type || '').replace(/_/g, ' '),
        m.speaker || '-',
        m.sentiment || '-',
        cleanText.substring(0, 45) + (cleanText.length > 45 ? '...' : '')
      ];
    });
    
    autoTable(doc, {
      startY: y,
      head: [['Time', 'Event Type', 'Speaker', 'Sentiment', 'Content']],
      body: momentsData,
      theme: 'grid',
      headStyles: { fillColor: COLORS.primary, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: { 
        0: { cellWidth: 18 },
        1: { cellWidth: 28 },
        2: { cellWidth: 22 },
        3: { cellWidth: 22 },
        4: { cellWidth: 90 }
      },
      didParseCell: (data: any) => {
        if (data.section === 'body' && data.column.index === 3) {
          const val = (data.cell.raw || '').toLowerCase();
          if (val === 'positive') data.cell.styles.textColor = COLORS.success;
          else if (val === 'negative') data.cell.styles.textColor = COLORS.danger;
        }
      }
    });
    y = (doc as any).lastAutoTable.finalY + 12;
  }
  
  // Customer Profile
  const profile = result.customerProfile;
  if (profile) {
    if (needsPageBreak(y, 50)) {
      doc.addPage();
      addPageHeader(doc, fileName);
      y = 22;
    }
    
    y = drawSectionHeader(doc, y, 'Customer Profile');
    
    const profileData = [
      ['Communication Style', sanitizeText(profile.communicationStyle || '-'), 'Decision Style', sanitizeText(profile.decisionStyle || '-')],
      ['Engagement Level', sanitizeText(profile.engagementLevel || '-'), 'Price Sensitivity', sanitizeText(profile.pricesSensitivity || '-')],
    ];
    
    autoTable(doc, {
      startY: y,
      body: profileData,
      theme: 'plain',
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: { 
        0: { fontStyle: 'bold', cellWidth: 40 },
        1: { cellWidth: 45 },
        2: { fontStyle: 'bold', cellWidth: 40 },
        3: { cellWidth: 45 }
      },
    });
    y = (doc as any).lastAutoTable.finalY + 4;
    
    if (profile.concerns && profile.concerns.length > 0) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLORS.dark);
      doc.text('Key Concerns:', 16, y);
      doc.setFont('helvetica', 'normal');
      const concernsText = sanitizeText(profile.concerns.join(', '));
      const concernLines = doc.splitTextToSize(concernsText, 140);
      doc.text(concernLines.slice(0, 2), 48, y);
      y += concernLines.length * 4 + 4;
    }
  }
  
  // Action Items
  const actions = result.actionItems;
  const hasActions = actions && (
    (actions.forAgent && actions.forAgent.length > 0) ||
    (actions.forManager && actions.forManager.length > 0) ||
    (actions.forFollowUp && actions.forFollowUp.length > 0)
  );
  
  if (hasActions) {
    if (needsPageBreak(y, 50)) {
      doc.addPage();
      addPageHeader(doc, fileName);
      y = 22;
    }
    
    y = drawSectionHeader(doc, y, 'Action Items');
    
    const allActions: string[][] = [];
    (actions.forAgent || []).forEach(a => allActions.push(['Agent', sanitizeText(a), '']));
    (actions.forManager || []).forEach(a => allActions.push(['Manager', sanitizeText(a), '']));
    (actions.forFollowUp || []).forEach(a => allActions.push(['Follow-up', sanitizeText(a), '']));
    
    autoTable(doc, {
      startY: y,
      head: [['Assigned To', 'Action Item', 'Status']],
      body: allActions,
      theme: 'grid',
      headStyles: { fillColor: COLORS.success, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      styles: { fontSize: 8, cellPadding: 2.5, overflow: 'linebreak' },
      columnStyles: { 
        0: { cellWidth: 22 },
        1: { cellWidth: 148 },
        2: { cellWidth: 12, halign: 'center' }
      },
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  }
  
  // ==================== PAGE 5: MOM & TRANSCRIPT ====================
  doc.addPage();
  addPageHeader(doc, fileName);
  y = 22;
  
  // Minutes of Meeting
  y = drawSectionHeader(doc, y, 'Minutes of Meeting (MOM)');
  
  const mom = result.mom;
  if (mom) {
    const momData = [
      ['Participants', sanitizeText((mom.participants || []).join(', ')) || 'Not identified'],
      ['Decisions Made', sanitizeText((mom.decisions || []).join('; ')) || 'None recorded'],
      ['Action Items', sanitizeText((mom.actionItems || []).join('; ')) || 'None'],
      ['Next Steps', sanitizeText((mom.nextSteps || []).join('; ')) || 'None defined'],
    ];
    
    autoTable(doc, {
      startY: y,
      body: momData,
      theme: 'striped',
      styles: { fontSize: 9, cellPadding: 4, overflow: 'linebreak' },
      columnStyles: { 
        0: { fontStyle: 'bold', cellWidth: 35, fillColor: COLORS.light },
        1: { cellWidth: 145 }
      },
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  }
  
  // Topics & Keywords
  if (result.insights?.topics || result.insights?.keywords) {
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.dark);
    
    if (result.insights.topics && result.insights.topics.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.text('Topics Discussed:', 16, y);
      doc.setFont('helvetica', 'normal');
      const topicsText = sanitizeText(result.insights.topics.join(', '));
      const topicLines = doc.splitTextToSize(topicsText, 140);
      doc.text(topicLines.slice(0, 2), 52, y);
      y += topicLines.length * 4 + 4;
    }
    
    if (result.insights.keywords && result.insights.keywords.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.text('Keywords:', 16, y);
      doc.setFont('helvetica', 'normal');
      const keywordsText = sanitizeText(result.insights.keywords.join(', '));
      const keywordLines = doc.splitTextToSize(keywordsText, 150);
      doc.text(keywordLines.slice(0, 2), 40, y);
      y += 10;
    }
  }
  
  // Transcript
  if (needsPageBreak(y, 50)) {
    doc.addPage();
    addPageHeader(doc, fileName);
    y = 22;
  }
  
  y = drawSectionHeader(doc, y, 'Full Transcript');
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.dark);
  
  const transcript = sanitizeText(result.transcription || 'No transcript available for this call.');
  const transcriptLines = doc.splitTextToSize(transcript, 178);
  
  // Add transcript with auto page breaks
  transcriptLines.forEach((line: string) => {
    if (y > 275) {
      doc.addPage();
      addPageHeader(doc, fileName);
      y = 22;
    }
    doc.text(line, 16, y);
    y += 4;
  });
  
  // ==================== ADD PAGE NUMBERS ====================
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addPageFooter(doc, i, totalPages);
  }
  
  // Save
  const cleanFileName = fileName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
  doc.save(`CallAnalysis_${cleanFileName}_${new Date().toISOString().slice(0, 10)}.pdf`);
};

// ============ BULK PDF GENERATOR ============
export const generateBulkAnalysisPDF = (results: BulkCallResult[]) => {
  const doc = new jsPDF();
  let y = 0;
  
  const completed = results.filter(r => r.status === 'completed' && r.result);
  
  // Cover
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, 210, 50, 'F');
  
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.white);
  doc.text('Bulk Call Analysis Report', 105, 25, { align: 'center' });
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Team Performance Summary', 105, 38, { align: 'center' });
  
  // Stats
  y = 60;
  const avgScore = completed.length > 0 
    ? completed.reduce((a, c) => a + (c.result?.coaching?.overallScore || 0), 0) / completed.length 
    : 0;
  const avgConversionRaw = completed.length > 0 
    ? completed.reduce((a, c) => a + (c.result?.predictions?.conversionProbability || 0), 0) / completed.length 
    : 0;
  const avgConversion = normalizePercentage(avgConversionRaw);
  const totalRedFlags = completed.reduce((a, c) => a + (c.result?.coaching?.redFlags?.filter(r => r && r !== 'None detected.').length || 0), 0);
  const forcedSales = completed.filter(r => r.result?.coaching?.forcedSale?.detected).length;
  
  // Stats row 1
  drawInfoBox(doc, 14, y, 43, 26, 'Total Calls', String(results.length), COLORS.primary);
  drawInfoBox(doc, 60, y, 43, 26, 'Analyzed', String(completed.length), COLORS.secondary);
  drawInfoBox(doc, 106, y, 43, 26, 'Avg Score', avgScore.toFixed(0), getScoreColor(avgScore));
  drawInfoBox(doc, 152, y, 43, 26, 'Avg Conv %', avgConversion.toFixed(0) + '%', getScoreColor(avgConversion));
  
  y += 32;
  
  // Stats row 2
  drawInfoBox(doc, 14, y, 60, 24, 'Red Flags', String(totalRedFlags), totalRedFlags > 0 ? COLORS.danger : COLORS.success);
  drawInfoBox(doc, 78, y, 60, 24, 'Forced Sales', String(forcedSales), forcedSales > 0 ? COLORS.danger : COLORS.success);
  
  // Sentiment counts
  const positive = completed.filter(r => (r.result?.insights?.sentiment || '').toLowerCase() === 'positive').length;
  const negative = completed.filter(r => (r.result?.insights?.sentiment || '').toLowerCase() === 'negative').length;
  
  drawInfoBox(doc, 142, y, 26, 24, 'Positive', String(positive), COLORS.success);
  drawInfoBox(doc, 170, y, 26, 24, 'Negative', String(negative), COLORS.danger);
  
  y += 32;
  
  // Results Table
  y = drawSectionHeader(doc, y, 'Individual Call Results');
  
  const tableData = results.map(r => {
    if (r.status !== 'completed' || !r.result) {
      return [sanitizeText(r.fileName).substring(0, 28), '-', '-', '-', '-', r.status];
    }
    const res = r.result;
    const convProb = normalizePercentage(res.predictions?.conversionProbability || 0);
    return [
      sanitizeText(r.fileName).substring(0, 28),
      String(res.coaching?.overallScore || 0),
      res.insights?.sentiment || '-',
      `${convProb}%`,
      res.predictions?.churnRisk || '-',
      res.coaching?.forcedSale?.detected ? 'YES' : 'No'
    ];
  });
  
  autoTable(doc, {
    startY: y,
    head: [['File Name', 'Score', 'Sentiment', 'Conv %', 'Churn', 'Forced']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: COLORS.primary, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 55 },
      1: { halign: 'center', cellWidth: 18 },
      2: { halign: 'center', cellWidth: 22 },
      3: { halign: 'center', cellWidth: 18 },
      4: { halign: 'center', cellWidth: 18 },
      5: { halign: 'center', cellWidth: 18 },
    },
    didParseCell: (data: any) => {
      if (data.section === 'body') {
        if (data.column.index === 1) {
          const score = parseInt(data.cell.raw) || 0;
          data.cell.styles.textColor = getScoreColor(score);
          data.cell.styles.fontStyle = 'bold';
        }
        if (data.column.index === 5 && data.cell.raw === 'YES') {
          data.cell.styles.textColor = COLORS.danger;
          data.cell.styles.fontStyle = 'bold';
        }
      }
    }
  });
  y = (doc as any).lastAutoTable.finalY + 12;
  
  // Team Insights
  if (y > 200) {
    doc.addPage();
    y = 20;
  }
  
  const allStrengths = completed.flatMap(r => r.result?.coaching?.strengths || []);
  const allWeaknesses = completed.flatMap(r => r.result?.coaching?.weaknesses || []);
  
  const countFreq = (arr: string[]) => {
    const freq: Record<string, number> = {};
    arr.forEach(item => { 
      const key = item.toLowerCase().trim(); 
      if (key) freq[key] = (freq[key] || 0) + 1; 
    });
    return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k]) => k);
  };
  
  const colWidth = 88;
  const boxHeight = 50;
  
  // Team Strengths
  doc.setFillColor(...COLORS.successLight);
  doc.roundedRect(14, y, colWidth, boxHeight, 2, 2, 'F');
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.success);
  doc.text('TEAM STRENGTHS', 18, y + 8);
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.dark);
  let sY = y + 15;
  countFreq(allStrengths).forEach(s => {
    doc.text('* ' + sanitizeText(s).substring(0, 45), 18, sY);
    sY += 6;
  });
  
  // Common Issues
  doc.setFillColor(...COLORS.dangerLight);
  doc.roundedRect(106, y, colWidth, boxHeight, 2, 2, 'F');
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.danger);
  doc.text('COMMON ISSUES', 110, y + 8);
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.dark);
  let wY = y + 15;
  countFreq(allWeaknesses).forEach(w => {
    doc.text('* ' + sanitizeText(w).substring(0, 45), 110, wY);
    wY += 6;
  });
  
  // Page numbers
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.medium);
    doc.text(`Page ${i} of ${totalPages}`, 105, 290, { align: 'center' });
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 196, 290, { align: 'right' });
  }
  
  doc.save(`BulkAnalysis_${new Date().toISOString().slice(0, 10)}.pdf`);
};
