/**
 * Customer Profile Manager
 * 
 * Handles customer extraction from transcripts, profile matching,
 * and customer relationship management.
 */

import { createClient } from '@/lib/supabase/client';
import type { 
  CustomerCommunicationStyle, 
  CustomerDecisionStyle,
  CustomerStatus,
  CustomerLifecycleStage 
} from '@/lib/types/database';

export interface CustomerProfile {
  id: string;
  organization_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  external_id: string | null;
  preferred_language: string;
  preferred_contact_method: string;
  timezone: string | null;
  communication_style: CustomerCommunicationStyle | null;
  decision_style: CustomerDecisionStyle | null;
  price_sensitivity: 'low' | 'medium' | 'high';
  status: CustomerStatus;
  lifecycle_stage: CustomerLifecycleStage;
  account_type: string | null;
  total_calls: number;
  avg_sentiment_score: number | null;
  avg_call_score: number | null;
  last_interaction_date: string | null;
  first_interaction_date: string | null;
  notes: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface CustomerInteraction {
  id: string;
  customer_id: string;
  organization_id: string;
  interaction_type: 'call' | 'email' | 'meeting' | 'support_ticket';
  call_analysis_id: string | null;
  sentiment: string | null;
  sentiment_score: number | null;
  resolution_status: 'resolved' | 'pending' | 'escalated' | null;
  summary: string | null;
  key_topics: string[] | null;
  action_items: string[] | null;
  agent_id: string | null;
  interaction_date: string;
  duration_seconds: number | null;
}

export interface ExtractedCustomerInfo {
  name: string | null;
  phone: string | null;
  email: string | null;
  company: string | null;
  communicationStyle: CustomerCommunicationStyle | null;
  decisionStyle: CustomerDecisionStyle | null;
  priceSensitivity: 'low' | 'medium' | 'high' | null;
  concerns: string[];
  preferences: string[];
}

/**
 * Extract customer information from AI analysis results
 */
export function extractCustomerFromAnalysis(analysisJson: any): ExtractedCustomerInfo {
  const customerProfile = analysisJson?.customerProfile || {};
  
  // Try to extract name from transcript or MoM
  let name: string | null = null;
  const participants = analysisJson?.mom?.participants || [];
  const customerParticipant = participants.find((p: string) => 
    p.toLowerCase().includes('customer') || 
    p.toLowerCase().includes('patient') ||
    p.toLowerCase().includes('client')
  );
  if (customerParticipant) {
    // Extract name if format is "Customer: John" or similar
    const namePart = customerParticipant.split(':')[1]?.trim();
    if (namePart && namePart.length > 0 && namePart.length < 100) {
      name = namePart;
    }
  }
  
  // Try to extract phone/email from transcript using regex
  const transcription = analysisJson?.transcription || '';
  const phoneMatch = transcription.match(/(?:\+?91[-\s]?)?[6-9]\d{9}|(?:\+1[-\s]?)?\(?\d{3}\)?[-\s]?\d{3}[-\s]?\d{4}/);
  const emailMatch = transcription.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  
  return {
    name,
    phone: phoneMatch?.[0] || null,
    email: emailMatch?.[0] || null,
    company: null, // Could be extracted with more sophisticated NLP
    communicationStyle: customerProfile.communicationStyle || null,
    decisionStyle: customerProfile.decisionStyle || null,
    priceSensitivity: customerProfile.pricesSensitivity || customerProfile.priceSensitivity || null,
    concerns: customerProfile.concerns || [],
    preferences: customerProfile.preferences || [],
  };
}

/**
 * Find existing customer by phone, email, or name
 */
export async function findExistingCustomer(
  organizationId: string,
  info: ExtractedCustomerInfo
): Promise<CustomerProfile | null> {
  const supabase = createClient();
  
  // Try phone first (most reliable)
  if (info.phone) {
    const normalizedPhone = info.phone.replace(/[-\s()]/g, '');
    const { data: byPhone } = await supabase
      .from('customer_profiles')
      .select('*')
      .eq('organization_id', organizationId)
      .or(`phone.ilike.%${normalizedPhone}%`)
      .limit(1)
      .single();
    
    if (byPhone) return byPhone;
  }
  
  // Try email
  if (info.email) {
    const { data: byEmail } = await supabase
      .from('customer_profiles')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('email', info.email.toLowerCase())
      .limit(1)
      .single();
    
    if (byEmail) return byEmail;
  }
  
  // Try name (less reliable)
  if (info.name) {
    const { data: byName } = await supabase
      .from('customer_profiles')
      .select('*')
      .eq('organization_id', organizationId)
      .ilike('name', `%${info.name}%`)
      .limit(1)
      .single();
    
    if (byName) return byName;
  }
  
  return null;
}

/**
 * Create a new customer profile
 */
export async function createCustomerProfile(
  organizationId: string,
  info: ExtractedCustomerInfo,
  createdBy?: string
): Promise<CustomerProfile | null> {
  if (!info.name && !info.phone && !info.email) {
    return null; // Need at least some identifying information
  }
  
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('customer_profiles')
    .insert({
      organization_id: organizationId,
      name: info.name || 'Unknown Customer',
      phone: info.phone,
      email: info.email?.toLowerCase(),
      company: info.company,
      communication_style: info.communicationStyle,
      decision_style: info.decisionStyle,
      price_sensitivity: info.priceSensitivity || 'medium',
      status: 'active',
      lifecycle_stage: 'customer',
      created_by: createdBy,
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error creating customer profile:', error);
    return null;
  }
  
  return data;
}

/**
 * Update customer profile with new insights
 */
export async function updateCustomerProfile(
  customerId: string,
  updates: Partial<{
    name: string;
    phone: string | null;
    email: string | null;
    company: string | null;
    communication_style: CustomerCommunicationStyle | null;
    decision_style: CustomerDecisionStyle | null;
    price_sensitivity: 'low' | 'medium' | 'high';
    status: CustomerStatus;
    lifecycle_stage: CustomerLifecycleStage;
    notes: string | null;
    tags: string[] | null;
  }>
): Promise<CustomerProfile | null> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('customer_profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', customerId)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating customer profile:', error);
    return null;
  }
  
  return data;
}

/**
 * Find or create customer and link to call analysis
 */
export async function linkCustomerToCall(
  organizationId: string,
  callAnalysisId: string,
  analysisJson: any,
  agentId: string
): Promise<{ customerId: string | null; isNew: boolean }> {
  const supabase = createClient();
  
  // Extract customer info from analysis
  const extractedInfo = extractCustomerFromAnalysis(analysisJson);
  
  // Try to find existing customer
  let customer = await findExistingCustomer(organizationId, extractedInfo);
  let isNew = false;
  
  // Create new if not found
  if (!customer && (extractedInfo.name || extractedInfo.phone || extractedInfo.email)) {
    customer = await createCustomerProfile(organizationId, extractedInfo, agentId);
    isNew = true;
  }
  
  if (!customer) {
    return { customerId: null, isNew: false };
  }
  
  // Update call analysis with customer_id
  await supabase
    .from('call_analyses')
    .update({ customer_id: customer.id })
    .eq('id', callAnalysisId);
  
  // Create interaction record
  const insights = analysisJson?.insights || {};
  const coaching = analysisJson?.coaching || {};
  
  await supabase
    .from('customer_interactions')
    .insert({
      customer_id: customer.id,
      organization_id: organizationId,
      interaction_type: 'call',
      call_analysis_id: callAnalysisId,
      sentiment: insights.sentiment,
      sentiment_score: insights.sentimentScore,
      summary: analysisJson?.summary,
      key_topics: insights.topics,
      action_items: analysisJson?.actionItems?.forFollowUp || [],
      agent_id: agentId,
      duration_seconds: analysisJson?.durationSec,
    });
  
  // Update customer profile with new insights if this provides more info
  if (extractedInfo.communicationStyle || extractedInfo.decisionStyle) {
    await updateCustomerProfile(customer.id, {
      communication_style: extractedInfo.communicationStyle || customer.communication_style,
      decision_style: extractedInfo.decisionStyle || customer.decision_style,
      price_sensitivity: extractedInfo.priceSensitivity || customer.price_sensitivity,
    });
  }
  
  return { customerId: customer.id, isNew };
}

/**
 * Get customer with their interaction history
 */
export async function getCustomerWithHistory(
  customerId: string,
  limit: number = 20
): Promise<{ customer: CustomerProfile | null; interactions: CustomerInteraction[] }> {
  const supabase = createClient();
  
  // Get customer profile
  const { data: customer } = await supabase
    .from('customer_profiles')
    .select('*')
    .eq('id', customerId)
    .single();
  
  if (!customer) {
    return { customer: null, interactions: [] };
  }
  
  // Get interaction history
  const { data: interactions } = await supabase
    .from('customer_interactions')
    .select('*')
    .eq('customer_id', customerId)
    .order('interaction_date', { ascending: false })
    .limit(limit);
  
  return { 
    customer, 
    interactions: interactions || [] 
  };
}

/**
 * Get customer sentiment trend over time
 */
export async function getCustomerSentimentTrend(
  customerId: string,
  days: number = 30
): Promise<Array<{ date: string; avgSentiment: number; callCount: number }>> {
  const supabase = createClient();
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const { data } = await supabase
    .from('customer_interactions')
    .select('interaction_date, sentiment_score')
    .eq('customer_id', customerId)
    .gte('interaction_date', startDate.toISOString())
    .order('interaction_date', { ascending: true });
  
  if (!data || data.length === 0) {
    return [];
  }
  
  // Group by date
  const byDate = new Map<string, { total: number; count: number }>();
  
  for (const interaction of data) {
    const date = interaction.interaction_date.split('T')[0];
    const existing = byDate.get(date) || { total: 0, count: 0 };
    if (interaction.sentiment_score !== null) {
      existing.total += interaction.sentiment_score;
      existing.count += 1;
    }
    byDate.set(date, existing);
  }
  
  return Array.from(byDate.entries()).map(([date, { total, count }]) => ({
    date,
    avgSentiment: count > 0 ? Math.round(total / count) : 0,
    callCount: count,
  }));
}

/**
 * Search customers
 */
export async function searchCustomers(
  organizationId: string,
  query: string,
  filters?: {
    status?: CustomerStatus;
    lifecycleStage?: CustomerLifecycleStage;
    tags?: string[];
  },
  limit: number = 20
): Promise<CustomerProfile[]> {
  const supabase = createClient();
  
  let queryBuilder = supabase
    .from('customer_profiles')
    .select('*')
    .eq('organization_id', organizationId);
  
  // Apply text search
  if (query) {
    queryBuilder = queryBuilder.or(
      `name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%,company.ilike.%${query}%`
    );
  }
  
  // Apply filters
  if (filters?.status) {
    queryBuilder = queryBuilder.eq('status', filters.status);
  }
  if (filters?.lifecycleStage) {
    queryBuilder = queryBuilder.eq('lifecycle_stage', filters.lifecycleStage);
  }
  if (filters?.tags && filters.tags.length > 0) {
    queryBuilder = queryBuilder.overlaps('tags', filters.tags);
  }
  
  const { data } = await queryBuilder
    .order('last_interaction_date', { ascending: false, nullsFirst: false })
    .limit(limit);
  
  return data || [];
}

/**
 * Get organization's top customers
 */
export async function getTopCustomers(
  organizationId: string,
  limit: number = 10,
  sortBy: 'calls' | 'sentiment' | 'recent' = 'calls'
): Promise<CustomerProfile[]> {
  const supabase = createClient();
  
  let orderColumn: string;
  let ascending = false;
  
  switch (sortBy) {
    case 'calls':
      orderColumn = 'total_calls';
      break;
    case 'sentiment':
      orderColumn = 'avg_sentiment_score';
      break;
    case 'recent':
      orderColumn = 'last_interaction_date';
      break;
    default:
      orderColumn = 'total_calls';
  }
  
  const { data } = await supabase
    .from('customer_profiles')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('status', 'active')
    .order(orderColumn, { ascending, nullsFirst: false })
    .limit(limit);
  
  return data || [];
}

/**
 * Get customers at risk (low sentiment, escalation risk)
 */
export async function getAtRiskCustomers(
  organizationId: string,
  limit: number = 10
): Promise<CustomerProfile[]> {
  const supabase = createClient();
  
  const { data } = await supabase
    .from('customer_profiles')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('status', 'active')
    .lt('avg_sentiment_score', 50)
    .order('avg_sentiment_score', { ascending: true })
    .limit(limit);
  
  return data || [];
}
