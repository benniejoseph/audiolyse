'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/lib/toast';
import { 
  Video, 
  FileText, 
  Link as LinkIcon, 
  FileQuestion, 
  BookOpen, 
  Book, 
  Hand, 
  Shield, 
  Target, 
  Phone, 
  DollarSign, 
  Swords, 
  Handshake, 
  Clipboard,
  Copy,
  Plus
} from 'lucide-react';

interface Script {
  id: string;
  title: string;
  description: string | null;
  category: string;
  script_text: string;
  scenario_tags: string[];
  usage_count: number;
  created_at: string;
}

interface Playbook {
  id: string;
  objection_text: string;
  objection_category: string;
  responses: Array<{ response: string; effectiveness: number; notes: string }>;
  best_response_index: number;
  occurrence_count: number;
  success_rate: number;
}

interface TrainingResource {
  id: string;
  title: string;
  description: string | null;
  resource_type: string;
  url: string | null;
  category: string;
  skill_level: string;
  duration_minutes: number | null;
  view_count: number;
  avg_rating: number | null;
}

export default function KnowledgePage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'scripts' | 'playbooks' | 'training'>('scripts');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  const [scripts, setScripts] = useState<Script[]>([]);
  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
  const [training, setTraining] = useState<TrainingResource[]>([]);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [isManager, setIsManager] = useState(false);
  
  // Modal state
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [newScript, setNewScript] = useState({
    title: '',
    description: '',
    category: 'opening',
    script_text: '',
    scenario_tags: '',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: membership } = await supabase
        .from('organization_members')
        .select('organization_id, role')
        .eq('user_id', user.id)
        .single();

      if (!membership) {
        router.push('/onboarding');
        return;
      }
      setOrganizationId(membership.organization_id);
      setIsManager(['owner', 'admin', 'manager'].includes(membership.role));

      // Load all knowledge base data
      const [scriptsResult, playbooksResult, trainingResult] = await Promise.all([
        supabase
          .from('script_library')
          .select('*')
          .eq('organization_id', membership.organization_id)
          .eq('is_active', true)
          .order('usage_count', { ascending: false }),
        supabase
          .from('objection_playbooks')
          .select('*')
          .eq('organization_id', membership.organization_id)
          .order('occurrence_count', { ascending: false }),
        supabase
          .from('training_resources')
          .select('*')
          .eq('organization_id', membership.organization_id)
          .eq('is_active', true)
          .order('view_count', { ascending: false }),
      ]);

      if (scriptsResult.data) setScripts(scriptsResult.data);
      if (playbooksResult.data) setPlaybooks(playbooksResult.data);
      if (trainingResult.data) setTraining(trainingResult.data);
    } catch (error) {
      console.error('Error loading knowledge base:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const createScript = async () => {
    if (!organizationId || !newScript.title || !newScript.script_text) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('script_library')
        .insert({
          organization_id: organizationId,
          title: newScript.title,
          description: newScript.description || null,
          category: newScript.category,
          script_text: newScript.script_text,
          scenario_tags: newScript.scenario_tags ? newScript.scenario_tags.split(',').map(t => t.trim()) : [],
          created_by: user?.id,
        });

      if (error) throw error;
      
      toast.success('Script created!');
      setShowScriptModal(false);
      setNewScript({ title: '', description: '', category: 'opening', script_text: '', scenario_tags: '' });
      loadData();
    } catch (error) {
      console.error('Error creating script:', error);
      toast.error('Failed to create script');
    }
  };

  const copyScript = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video size={32} className="text-red-500" />;
      case 'document': return <FileText size={32} className="text-blue-500" />;
      case 'link': return <LinkIcon size={32} className="text-gray-500" />;
      case 'quiz': return <FileQuestion size={32} className="text-purple-500" />;
      case 'course': return <BookOpen size={32} className="text-green-500" />;
      default: return <Book size={32} className="text-gray-500" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'opening': return <Hand size={16} className="text-yellow-500" />;
      case 'objection_handling': return <Shield size={16} className="text-red-500" />;
      case 'closing': return <Target size={16} className="text-green-500" />;
      case 'follow_up': return <Phone size={16} className="text-blue-500" />;
      case 'pricing': return <DollarSign size={16} className="text-green-600" />;
      case 'competitor': return <Swords size={16} className="text-red-600" />;
      case 'trust': return <Handshake size={16} className="text-purple-500" />;
      default: return <FileText size={16} className="text-gray-500" />;
    }
  };

  const filteredScripts = scripts.filter(s => {
    if (searchQuery && !s.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (categoryFilter !== 'all' && s.category !== categoryFilter) return false;
    return true;
  });

  const filteredPlaybooks = playbooks.filter(p => {
    if (searchQuery && !p.objection_text.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (categoryFilter !== 'all' && p.objection_category !== categoryFilter) return false;
    return true;
  });

  const filteredTraining = training.filter(t => {
    if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="knowledge-loading">
        <div className="loader"></div>
        <p>Loading knowledge base...</p>
      </div>
    );
  }

  return (
    <div className="knowledge-page">
      <div className="page-header">
        <div>
          <h1>Knowledge Base</h1>
          <p>Scripts, objection playbooks, and training resources</p>
        </div>
        {isManager && (
          <button className="add-btn" onClick={() => setShowScriptModal(true)}>
            <Plus size={16} style={{marginRight: 8}} /> Add Script
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button 
          className={activeTab === 'scripts' ? 'active' : ''}
          onClick={() => setActiveTab('scripts')}
        >
          <span style={{marginRight: 8}}><FileText size={16} /></span> Scripts ({scripts.length})
        </button>
        <button 
          className={activeTab === 'playbooks' ? 'active' : ''}
          onClick={() => setActiveTab('playbooks')}
        >
          <span style={{marginRight: 8}}><Shield size={16} /></span> Playbooks ({playbooks.length})
        </button>
        <button 
          className={activeTab === 'training' ? 'active' : ''}
          onClick={() => setActiveTab('training')}
        >
          <span style={{marginRight: 8}}><BookOpen size={16} /></span> Training ({training.length})
        </button>
      </div>

      {/* Search & Filter */}
      <div className="filters">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select 
          value={categoryFilter} 
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="all">All Categories</option>
          {activeTab === 'scripts' && (
            <>
              <option value="opening">Opening</option>
              <option value="objection_handling">Objection Handling</option>
              <option value="closing">Closing</option>
              <option value="follow_up">Follow Up</option>
            </>
          )}
          {activeTab === 'playbooks' && (
            <>
              <option value="pricing">Pricing</option>
              <option value="timing">Timing</option>
              <option value="competitor">Competitor</option>
              <option value="trust">Trust</option>
              <option value="need">Need</option>
            </>
          )}
          {activeTab === 'training' && (
            <>
              <option value="onboarding">Onboarding</option>
              <option value="product">Product</option>
              <option value="sales_technique">Sales Technique</option>
              <option value="compliance">Compliance</option>
            </>
          )}
        </select>
      </div>

      {/* Content */}
      <div className="content">
        {/* Scripts Tab */}
        {activeTab === 'scripts' && (
          <div className="scripts-content">
            {filteredScripts.length === 0 ? (
              <div className="no-data">
                <FileText size={48} className="opacity-50 mb-4" />
                <p>No scripts found. {isManager && 'Create your first script!'}</p>
              </div>
            ) : (
              <div className="scripts-grid">
                {filteredScripts.map(script => (
                  <div key={script.id} className="script-card">
                    <div className="script-header">
                      <span className="script-category" style={{display: 'flex', alignItems: 'center', gap: 4}}>
                        {getCategoryIcon(script.category)} {script.category.replace('_', ' ')}
                      </span>
                      <span className="usage-count">{script.usage_count} uses</span>
                    </div>
                    <h3>{script.title}</h3>
                    {script.description && <p className="script-desc">{script.description}</p>}
                    <div className="script-text">{script.script_text}</div>
                    {script.scenario_tags.length > 0 && (
                      <div className="script-tags">
                        {script.scenario_tags.map((tag, i) => (
                          <span key={i} className="tag">{tag}</span>
                        ))}
                      </div>
                    )}
                    <button className="copy-btn" onClick={() => copyScript(script.script_text)}>
                      <Clipboard size={14} style={{marginRight: 6}} /> Copy Script
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Playbooks Tab */}
        {activeTab === 'playbooks' && (
          <div className="playbooks-content">
            {filteredPlaybooks.length === 0 ? (
              <div className="no-data">
                <Shield size={48} className="opacity-50 mb-4" />
                <p>No objection playbooks yet. They&apos;ll be auto-generated from call analyses.</p>
              </div>
            ) : (
              <div className="playbooks-list">
                {filteredPlaybooks.map(playbook => (
                  <div key={playbook.id} className="playbook-card">
                    <div className="playbook-header">
                      <span className="playbook-category" style={{display: 'flex', alignItems: 'center', gap: 4}}>
                        {getCategoryIcon(playbook.objection_category)} {playbook.objection_category}
                      </span>
                      <div className="playbook-stats">
                        <span>{playbook.occurrence_count} occurrences</span>
                        {playbook.success_rate && <span>{Math.round(playbook.success_rate * 100)}% success</span>}
                      </div>
                    </div>
                    <h4 className="objection-text">&ldquo;{playbook.objection_text}&rdquo;</h4>
                    <div className="responses-list">
                      {playbook.responses.map((response, i) => (
                        <div key={i} className={`response-item ${i === playbook.best_response_index ? 'best' : ''}`}>
                          {i === playbook.best_response_index && <span className="best-badge">⭐ Best Response</span>}
                          <p>{response.response}</p>
                          <button className="copy-btn small" onClick={() => copyScript(response.response)}>
                            <Copy size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Training Tab */}
        {activeTab === 'training' && (
          <div className="training-content">
            {filteredTraining.length === 0 ? (
              <div className="no-data">
                <BookOpen size={48} className="opacity-50 mb-4" />
                <p>No training resources available yet.</p>
              </div>
            ) : (
              <div className="training-grid">
                {filteredTraining.map(resource => (
                  <div key={resource.id} className="training-card">
                    <div className="training-icon">{getResourceIcon(resource.resource_type)}</div>
                    <div className="training-content-inner">
                      <h4>{resource.title}</h4>
                      {resource.description && <p>{resource.description}</p>}
                      <div className="training-meta">
                        <span className="level">{resource.skill_level}</span>
                        {resource.duration_minutes && <span>⏱️ {resource.duration_minutes} min</span>}
                        <span>👁️ {resource.view_count} views</span>
                      </div>
                    </div>
                    {resource.url && (
                      <a href={resource.url} target="_blank" rel="noopener noreferrer" className="view-btn">
                        View →
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* New Script Modal */}
      {showScriptModal && (
        <div className="modal-overlay" onClick={() => setShowScriptModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Create New Script</h2>
            
            <div className="form-group">
              <label>Title *</label>
              <input
                type="text"
                value={newScript.title}
                onChange={(e) => setNewScript({ ...newScript, title: e.target.value })}
                placeholder="e.g., Cold Call Opening"
              />
            </div>
            
            <div className="form-group">
              <label>Category</label>
              <select
                value={newScript.category}
                onChange={(e) => setNewScript({ ...newScript, category: e.target.value })}
              >
                <option value="opening">Opening</option>
                <option value="objection_handling">Objection Handling</option>
                <option value="closing">Closing</option>
                <option value="follow_up">Follow Up</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Description</label>
              <input
                type="text"
                value={newScript.description}
                onChange={(e) => setNewScript({ ...newScript, description: e.target.value })}
                placeholder="When to use this script"
              />
            </div>
            
            <div className="form-group">
              <label>Script Text *</label>
              <textarea
                value={newScript.script_text}
                onChange={(e) => setNewScript({ ...newScript, script_text: e.target.value })}
                placeholder="Enter the script text..."
                rows={6}
              />
            </div>
            
            <div className="form-group">
              <label>Tags (comma separated)</label>
              <input
                type="text"
                value={newScript.scenario_tags}
                onChange={(e) => setNewScript({ ...newScript, scenario_tags: e.target.value })}
                placeholder="e.g., cold call, new lead, enterprise"
              />
            </div>
            
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowScriptModal(false)}>Cancel</button>
              <button className="create-btn" onClick={createScript}>Create Script</button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .knowledge-page {
          padding: 24px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
        }

        .page-header h1 {
          font-size: 28px;
          margin: 0 0 4px;
          color: var(--text);
        }

        .page-header p {
          color: var(--muted);
          margin: 0;
        }

        .add-btn {
          padding: 12px 24px;
          background: linear-gradient(135deg, var(--accent), var(--accent-2));
          border: none;
          border-radius: 8px;
          color: white;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
        }

        .tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 20px;
        }

        .tabs button {
          display: flex;
          align-items: center;
          padding: 12px 24px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: var(--muted);
          cursor: pointer;
          transition: all 0.2s;
          font-size: 14px;
        }

        .tabs button.active {
          background: rgba(0, 217, 255, 0.15);
          border-color: rgba(0, 217, 255, 0.3);
          color: var(--accent);
        }

        .filters {
          display: flex;
          gap: 16px;
          margin-bottom: 24px;
        }

        .search-box {
          flex: 1;
          position: relative;
        }

        .search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
        }

        .search-box input {
          width: 100%;
          padding: 12px 16px 12px 44px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: var(--text);
          font-size: 14px;
        }

        .filters select {
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: var(--text);
          cursor: pointer;
          min-width: 180px;
        }

        .scripts-grid, .training-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 20px;
        }

        .script-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 20px;
        }

        .script-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .script-category {
          font-size: 12px;
          color: var(--accent);
          text-transform: capitalize;
        }

        .usage-count {
          font-size: 12px;
          color: var(--muted);
        }

        .script-card h3 {
          margin: 0 0 8px;
          color: var(--text);
          font-size: 16px;
        }

        .script-desc {
          font-size: 13px;
          color: var(--muted);
          margin: 0 0 12px;
        }

        .script-text {
          background: rgba(0, 0, 0, 0.2);
          padding: 12px;
          border-radius: 8px;
          font-size: 14px;
          color: var(--text);
          line-height: 1.6;
          margin-bottom: 12px;
          font-style: italic;
        }

        .script-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 12px;
        }

        .tag {
          padding: 4px 10px;
          background: rgba(139, 92, 246, 0.15);
          color: #8b5cf6;
          border-radius: 4px;
          font-size: 11px;
        }

        .copy-btn {
          width: 100%;
          padding: 10px;
          background: rgba(0, 217, 255, 0.1);
          border: 1px solid rgba(0, 217, 255, 0.3);
          border-radius: 8px;
          color: var(--accent);
          cursor: pointer;
          font-size: 13px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .copy-btn.small {
          width: auto;
          padding: 6px 12px;
        }

        .playbooks-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .playbook-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 20px;
        }

        .playbook-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .playbook-category {
          font-size: 13px;
          color: var(--accent);
          text-transform: capitalize;
        }

        .playbook-stats {
          display: flex;
          gap: 16px;
          font-size: 12px;
          color: var(--muted);
        }

        .objection-text {
          font-size: 16px;
          color: #ef4444;
          margin: 0 0 16px;
          font-style: italic;
        }

        .responses-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .response-item {
          padding: 12px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 8px;
          position: relative;
        }

        .response-item.best {
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .best-badge {
          display: block;
          font-size: 11px;
          color: #10b981;
          margin-bottom: 8px;
        }

        .response-item p {
          margin: 0;
          color: var(--text);
          font-size: 14px;
          line-height: 1.5;
        }

        .response-item .copy-btn {
          position: absolute;
          top: 12px;
          right: 12px;
        }

        .training-card {
          display: flex;
          gap: 16px;
          padding: 20px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
        }

        .training-icon {
          font-size: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .training-content-inner {
          flex: 1;
        }

        .training-content-inner h4 {
          margin: 0 0 4px;
          color: var(--text);
        }

        .training-content-inner p {
          margin: 0 0 12px;
          color: var(--muted);
          font-size: 13px;
        }

        .training-meta {
          display: flex;
          gap: 16px;
          font-size: 12px;
          color: var(--muted);
        }

        .level {
          text-transform: capitalize;
          color: var(--accent);
        }

        .view-btn {
          padding: 8px 16px;
          background: rgba(0, 217, 255, 0.1);
          border: 1px solid rgba(0, 217, 255, 0.3);
          border-radius: 8px;
          color: var(--accent);
          text-decoration: none;
          font-size: 13px;
          align-self: center;
        }

        .no-data {
          text-align: center;
          padding: 60px 20px;
          color: var(--muted);
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .no-data span {
          font-size: 48px;
          display: block;
          margin-bottom: 16px;
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: var(--bg);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 24px;
          width: 90%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-content h2 {
          margin: 0 0 24px;
          color: var(--text);
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-size: 13px;
          color: var(--muted);
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 12px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: var(--text);
          font-size: 14px;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 24px;
        }

        .cancel-btn, .create-btn {
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
        }

        .cancel-btn {
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: var(--muted);
        }

        .create-btn {
          background: linear-gradient(135deg, var(--accent), var(--accent-2));
          border: none;
          color: white;
        }

        .knowledge-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          color: var(--muted);
        }

        .loader {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(0, 217, 255, 0.2);
          border-top-color: var(--accent);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
