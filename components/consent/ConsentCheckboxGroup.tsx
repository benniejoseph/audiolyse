'use client';

import { useState, useEffect } from 'react';
import type { ConsentType, ConsentRequirement } from '@/lib/consent/types';
import { UPLOAD_CONSENT_REQUIREMENTS, hasAllRequiredConsents } from '@/lib/consent/types';

interface ConsentCheckboxGroupProps {
  requirements?: ConsentRequirement[];
  isHealthcareOrg?: boolean;
  onConsentChange: (consents: Record<ConsentType, boolean>, allRequiredGiven: boolean) => void;
  initialConsents?: Record<ConsentType, boolean>;
  disabled?: boolean;
}

/**
 * A group of consent checkboxes for collecting user consents
 * Used in upload flow and other consent-required operations
 */
export function ConsentCheckboxGroup({
  requirements = UPLOAD_CONSENT_REQUIREMENTS,
  isHealthcareOrg = false,
  onConsentChange,
  initialConsents,
  disabled = false,
}: ConsentCheckboxGroupProps) {
  const [consents, setConsents] = useState<Record<ConsentType, boolean>>(() => {
    const initial: Record<ConsentType, boolean> = {
      audio_processing: false,
      ai_analysis: false,
      data_storage: false,
      marketing: false,
      third_party_sharing: false,
      patient_data: false,
    };
    return { ...initial, ...initialConsents };
  });

  // Filter requirements based on org type
  const filteredRequirements = requirements.filter(req => {
    if (req.type === 'patient_data' && !isHealthcareOrg) {
      return false;
    }
    return true;
  });

  // Notify parent of consent changes
  useEffect(() => {
    const allRequiredGiven = hasAllRequiredConsents(consents, filteredRequirements, isHealthcareOrg);
    onConsentChange(consents, allRequiredGiven);
  }, [consents, filteredRequirements, isHealthcareOrg, onConsentChange]);

  const handleConsentChange = (type: ConsentType, checked: boolean) => {
    setConsents(prev => ({ ...prev, [type]: checked }));
  };

  const handleSelectAll = () => {
    const allSelected = filteredRequirements.every(req => consents[req.type]);
    const newConsents = { ...consents };
    filteredRequirements.forEach(req => {
      newConsents[req.type] = !allSelected;
    });
    setConsents(newConsents);
  };

  const allSelected = filteredRequirements.every(req => consents[req.type]);

  return (
    <div className="consent-group">
      <div className="consent-header">
        <h4>Required Consents</h4>
        <button
          type="button"
          className="select-all-btn"
          onClick={handleSelectAll}
          disabled={disabled}
        >
          {allSelected ? 'Deselect All' : 'Select All Required'}
        </button>
      </div>

      <div className="consent-items">
        {filteredRequirements.map((req) => (
          <label
            key={req.type}
            className={`consent-item ${req.required ? 'required' : 'optional'} ${consents[req.type] ? 'checked' : ''}`}
          >
            <input
              type="checkbox"
              checked={consents[req.type]}
              onChange={(e) => handleConsentChange(req.type, e.target.checked)}
              disabled={disabled}
            />
            <div className="consent-content">
              <span className="consent-label">
                {req.label}
                {req.required && <span className="required-badge">*Required</span>}
              </span>
              <span className="consent-description">{req.description}</span>
              {req.learnMoreUrl && (
                <a href={req.learnMoreUrl} target="_blank" rel="noopener noreferrer" className="learn-more">
                  Learn more →
                </a>
              )}
            </div>
          </label>
        ))}
      </div>

      <p className="consent-note">
        By checking the required boxes, you confirm your understanding and consent. 
        <a href="/privacy" target="_blank" rel="noopener noreferrer"> View our Privacy Policy</a>
      </p>

      <style jsx>{`
        .consent-group {
          background: rgba(0, 217, 255, 0.05);
          border: 1px solid rgba(0, 217, 255, 0.2);
          border-radius: 12px;
          padding: 1.25rem;
          margin: 1rem 0;
        }

        .consent-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .consent-header h4 {
          margin: 0;
          font-size: 1rem;
          color: var(--text);
        }

        .select-all-btn {
          background: rgba(0, 217, 255, 0.1);
          border: 1px solid rgba(0, 217, 255, 0.3);
          color: var(--accent);
          padding: 0.4rem 0.8rem;
          border-radius: 6px;
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .select-all-btn:hover:not(:disabled) {
          background: rgba(0, 217, 255, 0.2);
        }

        .select-all-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .consent-items {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .consent-item {
          display: flex;
          gap: 0.75rem;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .consent-item:hover {
          background: rgba(255, 255, 255, 0.04);
          border-color: rgba(255, 255, 255, 0.1);
        }

        .consent-item.checked {
          background: rgba(124, 255, 199, 0.05);
          border-color: rgba(124, 255, 199, 0.2);
        }

        .consent-item input[type="checkbox"] {
          width: 18px;
          height: 18px;
          margin-top: 2px;
          accent-color: var(--accent);
          cursor: pointer;
        }

        .consent-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .consent-label {
          font-weight: 500;
          color: var(--text);
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .required-badge {
          font-size: 0.7rem;
          padding: 0.15rem 0.4rem;
          background: rgba(255, 107, 107, 0.2);
          color: #ff6b6b;
          border-radius: 4px;
          font-weight: 600;
        }

        .consent-description {
          font-size: 0.85rem;
          color: var(--text-muted);
          line-height: 1.4;
        }

        .learn-more {
          font-size: 0.8rem;
          color: var(--accent);
          text-decoration: none;
        }

        .learn-more:hover {
          text-decoration: underline;
        }

        .consent-note {
          margin-top: 1rem;
          font-size: 0.8rem;
          color: var(--text-muted);
        }

        .consent-note a {
          color: var(--accent);
          text-decoration: none;
        }

        .consent-note a:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}

export default ConsentCheckboxGroup;
