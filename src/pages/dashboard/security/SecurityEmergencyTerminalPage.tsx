import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { safetyCommandService } from '../../../services/safetyCommandService';
import { realtimeService } from '../../../services/realtimeService';
import type { EmergencyIncident } from '../../../types/safetyCommand';
import { Modal } from '../../../components/ui/Modal';
import { FileUpload } from '../../../components/ui/FileUpload';
import {
  Siren,
  ShieldAlert,
  CheckCircle2,
  PhoneCall,
  MapPin,
  AlertTriangle,
  Play,
  FileCheck,
  ArrowLeft,
  Clock,
  CheckCircle,
} from 'lucide-react';

export const SecurityEmergencyTerminalPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const societyId = (currentUser as any)?.societyId || 'soc-gvs';
  const guardName = currentUser?.name || 'Officer Vikram Singh';

  const [incidents, setIncidents] = useState<EmergencyIncident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<EmergencyIncident | null>(null);

  // Response Form State
  const [showRespondModal, setShowRespondModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [responderName, setResponderName] = useState(guardName);
  const [responseNote, setResponseNote] = useState('');
  const [resolutionNote, setResolutionNote] = useState('');
  const [resolutionProofUrl, setResolutionProofUrl] = useState('');

  useEffect(() => {
    loadData();
    const unsub = realtimeService.subscribe('*', (event) => {
      if (
        event.type === 'EMERGENCY_ALERTS' ||
        event.type === 'CHILD_ALERT_TRIGGERED' ||
        event.type.includes('EMERGENCY') ||
        event.type.includes('INCIDENT')
      ) {
        loadData();
      }
    });
    const interval = setInterval(loadData, 5000);
    return () => {
      unsub();
      clearInterval(interval);
    };
  }, [societyId]);

  const loadData = () => {
    const list = safetyCommandService.getIncidents(societyId);
    setIncidents(list);
  };

  const handleAcknowledge = (incidentId: string) => {
    safetyCommandService.acknowledgeIncident(societyId, incidentId, guardName);
    loadData();
  };

  const handleRespond = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIncident || !responderName) return;

    safetyCommandService.respondIncident(
      societyId,
      selectedIncident.id,
      currentUser?.id || 'guard-1',
      responderName,
      guardName,
      responseNote
    );

    realtimeService.publish({
      type: 'EMERGENCY_ALERTS',
      payload: { incidentId: selectedIncident.id, status: 'RESPONDING', responderName }
    });

    setShowRespondModal(false);
    setResponseNote('');
    setSelectedIncident(null);
    loadData();
  };

  const handleResolve = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIncident || !resolutionNote) return;

    const fullNote = resolutionProofUrl ? `${resolutionNote} (Proof: ${resolutionProofUrl})` : resolutionNote;
    safetyCommandService.resolveIncident(societyId, selectedIncident.id, guardName, fullNote);

    realtimeService.publish({
      type: 'EMERGENCY_ALERTS',
      payload: { incidentId: selectedIncident.id, status: 'RESOLVED', guardName, proofUrl: resolutionProofUrl }
    });

    setShowResolveModal(false);
    setResolutionNote('');
    setResolutionProofUrl('');
    setSelectedIncident(null);
    loadData();
  };

  const activeTriggered = incidents.filter(i => i.status === 'TRIGGERED' || i.status === 'ACKNOWLEDGED' || i.status === 'RESPONDING');
  const resolvedIncidents = incidents.filter(i => i.status === 'RESOLVED');

  return (
    <div style={{ background: 'var(--aarizo-page, #F7FBFE)', minHeight: '100vh', paddingBottom: '5rem', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
      {/* Header Bar */}
      <div style={{ background: '#ffffff', borderBottom: '1px solid #DCE8EF', padding: '0.85rem 1.25rem' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <button
              onClick={() => navigate(-1)}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: '#F4FAFE',
                border: '1px solid #DCE8EF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#083B56',
                cursor: 'pointer',
              }}
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h1 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#083B56' }}>
                  Emergency Command Terminal
                </h1>
                <span
                  style={{
                    background: activeTriggered.length > 0 ? '#FEF2F2' : '#ECFDF5',
                    border: '1px solid',
                    borderColor: activeTriggered.length > 0 ? '#FCA5A5' : '#A7F3D0',
                    color: activeTriggered.length > 0 ? '#DC2626' : '#059669',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '12px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: activeTriggered.length > 0 ? '#DC2626' : '#10B981', display: 'inline-block' }}></span>
                  {activeTriggered.length} Active Emergency Alarms
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#52788D' }}>
                Real-time SOS panic monitoring, guard dispatch & emergency resolution
              </p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1100px', margin: '1.25rem auto', padding: '0 1rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* High Priority Alarm Notification Banner */}
        {incidents.some(i => i.status === 'TRIGGERED') && (
          <div
            style={{
              background: '#DC2626',
              color: '#ffffff',
              padding: '1rem 1.25rem',
              borderRadius: '14px',
              boxShadow: '0 4px 16px rgba(220, 38, 38, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.85rem',
            }}
          >
            <Siren size={30} style={{ color: '#ffffff', flexShrink: 0 }} />
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
                🚨 ACTIVE SOS PANIC ALARM DETECTED!
              </h2>
              <p style={{ fontSize: '0.82rem', color: '#FEE2E2', margin: '0.25rem 0 0', fontWeight: 600 }}>
                Immediate gate dispatch required. Acknowledge and dispatch guard below.
              </p>
            </div>
          </div>
        )}

        {/* Metrics Overview */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
          <div style={{ background: '#ffffff', border: '1px solid #DCE8EF', borderRadius: '12px', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: activeTriggered.length > 0 ? '#FEF2F2' : '#F4FAFE', border: '1px solid', borderColor: activeTriggered.length > 0 ? '#FCA5A5' : '#DCE8EF', color: activeTriggered.length > 0 ? '#DC2626' : '#083B56', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldAlert size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#52788D', textTransform: 'uppercase' }}>Active Emergencies</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: activeTriggered.length > 0 ? '#DC2626' : '#083B56' }}>{activeTriggered.length}</div>
            </div>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #DCE8EF', borderRadius: '12px', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#ECFDF5', border: '1px solid #6EE7B7', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#52788D', textTransform: 'uppercase' }}>Resolved Incidents</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#059669' }}>{resolvedIncidents.length}</div>
            </div>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #DCE8EF', borderRadius: '12px', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#FFFBEB', border: '1px solid #FDE68A', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#52788D', textTransform: 'uppercase' }}>Total Incidents Logged</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#D97706' }}>{incidents.length}</div>
            </div>
          </div>
        </div>

        {/* Active Emergency Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <h2 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#083B56', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={18} color="#DC2626" /> Active Emergency Incidents ({activeTriggered.length})
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
            {activeTriggered.length === 0 ? (
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: '16px',
                  border: '1px solid #DCE8EF',
                  padding: '2.5rem 1rem',
                  textAlign: 'center',
                  boxShadow: '0 2px 8px rgba(8, 59, 86, 0.03)',
                  gridColumn: '1 / -1',
                }}
              >
                <CheckCircle2 size={40} style={{ color: '#059669', margin: '0 auto 0.5rem' }} />
                <div style={{ fontWeight: 800, fontSize: '1rem', color: '#083B56' }}>All Clear - Security Gate Standby</div>
                <p style={{ fontSize: '0.82rem', color: '#52788D', margin: '0.25rem 0 0' }}>
                  No active panic SOS alarms or safety emergencies reported in the society.
                </p>
              </div>
            ) : (
              activeTriggered.map((inc) => (
                <div
                  key={inc.id}
                  style={{
                    background: '#ffffff',
                    borderRadius: '16px',
                    border: inc.status === 'TRIGGERED' ? '2px solid #DC2626' : '1px solid #DCE8EF',
                    padding: '1.25rem',
                    boxShadow: '0 4px 12px rgba(8, 59, 86, 0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '0.85rem',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, fontFamily: 'monospace', padding: '0.2rem 0.6rem', borderRadius: '6px', background: '#F4FAFE', color: '#083B56', border: '1px solid #DCE8EF' }}>
                        {inc.incidentNumber}
                      </span>
                      <span
                        style={{
                          padding: '0.25rem 0.65rem',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          borderRadius: '8px',
                          background: inc.status === 'TRIGGERED' ? '#FEF2F2' : inc.status === 'ACKNOWLEDGED' ? '#FFFBEB' : '#ECFDF5',
                          color: inc.status === 'TRIGGERED' ? '#DC2626' : inc.status === 'ACKNOWLEDGED' ? '#D97706' : '#059669',
                          border: '1px solid',
                          borderColor: inc.status === 'TRIGGERED' ? '#FCA5A5' : inc.status === 'ACKNOWLEDGED' ? '#FDE68A' : '#A7F3D0',
                        }}
                      >
                        {inc.status}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#083B56', margin: '0 0 0.35rem 0' }}>
                      {inc.type.replace(/_/g, ' ')}
                    </h3>
                    <p style={{ fontSize: '0.82rem', fontWeight: 600, color: '#52788D', display: 'flex', alignItems: 'center', gap: '0.35rem', margin: 0 }}>
                      <MapPin size={15} color="#DC2626" /> {inc.locationDetails} ({inc.tower})
                    </p>

                    <div
                      style={{
                        marginTop: '0.75rem',
                        background: '#F8FAFC',
                        padding: '0.85rem',
                        borderRadius: '10px',
                        border: '1px solid #E2E8F0',
                        fontSize: '0.82rem',
                        color: '#083B56',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.35rem',
                      }}
                    >
                      <div><strong>Reported By:</strong> {inc.reportedByName} (Flat {inc.flatNumber})</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#083B56', fontWeight: 700 }}>
                        <PhoneCall size={14} color="#083B56" /> {inc.reportedByPhone}
                      </div>
                      {inc.description && <div style={{ fontStyle: 'italic', color: '#52788D', marginTop: '2px' }}>"{inc.description}"</div>}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '0.6rem', paddingTop: '0.6rem', borderTop: '1px solid #E2E8F0' }}>
                    {inc.status === 'TRIGGERED' && (
                      <button
                        onClick={() => handleAcknowledge(inc.id)}
                        style={{
                          flex: 1,
                          padding: '0.65rem',
                          background: '#D97706',
                          color: '#ffffff',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          borderRadius: '8px',
                          border: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.35rem',
                          cursor: 'pointer',
                        }}
                      >
                        <CheckCircle2 size={15} /> Acknowledge Alarm
                      </button>
                    )}

                    {(inc.status === 'TRIGGERED' || inc.status === 'ACKNOWLEDGED') && (
                      <button
                        onClick={() => {
                          setSelectedIncident(inc);
                          setShowRespondModal(true);
                        }}
                        style={{
                          flex: 1,
                          padding: '0.65rem',
                          background: '#083B56',
                          color: '#ffffff',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          borderRadius: '8px',
                          border: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.35rem',
                          cursor: 'pointer',
                        }}
                      >
                        <Play size={15} /> Dispatch Responder
                      </button>
                    )}

                    {inc.status === 'RESPONDING' && (
                      <button
                        onClick={() => {
                          setSelectedIncident(inc);
                          setShowResolveModal(true);
                        }}
                        style={{
                          width: '100%',
                          padding: '0.65rem',
                          background: '#059669',
                          color: '#ffffff',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          borderRadius: '8px',
                          border: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.35rem',
                          cursor: 'pointer',
                        }}
                      >
                        <CheckCircle2 size={16} /> Mark Incident Resolved
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Resolved Emergency Audit Log */}
        {resolvedIncidents.length > 0 && (
          <div style={{ background: '#ffffff', border: '1px solid #DCE8EF', borderRadius: '16px', padding: '1.25rem' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 800, color: '#083B56', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle size={16} color="#059669" /> Resolved Emergency Incidents ({resolvedIncidents.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {resolvedIncidents.map((inc) => (
                <div
                  key={inc.id}
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: '10px',
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#083B56' }}>
                      {inc.incidentNumber} • {inc.type.replace(/_/g, ' ')}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#52788D' }}>
                      Location: {inc.locationDetails} • Reported by {inc.reportedByName} ({inc.flatNumber})
                    </div>
                  </div>
                  <span style={{ padding: '3px 8px', borderRadius: '6px', background: '#ECFDF5', color: '#059669', fontSize: '0.75rem', fontWeight: 700 }}>
                    RESOLVED
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal: Dispatch Responder */}
      {selectedIncident && showRespondModal && (
        <Modal isOpen={showRespondModal} onClose={() => setShowRespondModal(false)} title={`Dispatch Responder: ${selectedIncident.incidentNumber}`}>
          <form onSubmit={handleRespond} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingTop: '0.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#083B56', marginBottom: '0.35rem' }}>Assigned Guard / Responder Name</label>
              <input
                type="text"
                required
                value={responderName}
                onChange={e => setResponderName(e.target.value)}
                style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.88rem', color: '#083B56', background: '#F8FAFC', fontWeight: 600, boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#083B56', marginBottom: '0.35rem' }}>Field Response Notes</label>
              <textarea
                rows={2}
                placeholder="e.g. Guard Vikram dispatched to Lift B2 with master keys."
                value={responseNote}
                onChange={e => setResponseNote(e.target.value)}
                style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.88rem', color: '#083B56', background: '#F8FAFC', fontWeight: 600, boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #E2E8F0' }}>
              <button type="button" onClick={() => setShowRespondModal(false)} style={{ padding: '0.65rem 1.25rem', border: '1px solid #CBD5E1', borderRadius: '10px', background: '#ffffff', color: '#52788D', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
              <button type="submit" style={{ padding: '0.65rem 1.4rem', background: '#083B56', color: '#ffffff', borderRadius: '10px', fontWeight: 700, border: 'none', cursor: 'pointer' }}>Confirm Dispatch</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Resolve Incident */}
      {selectedIncident && showResolveModal && (
        <Modal isOpen={showResolveModal} onClose={() => setShowResolveModal(false)} title={`Resolve Emergency: ${selectedIncident.incidentNumber}`}>
          <form onSubmit={handleResolve} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingTop: '0.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#083B56', marginBottom: '0.35rem' }}>Resolution Summary & Action Taken</label>
              <textarea
                rows={3}
                required
                placeholder="e.g. Lift technician reset main circuit breaker. Passengers safely extracted."
                value={resolutionNote}
                onChange={e => setResolutionNote(e.target.value)}
                style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.88rem', color: '#083B56', background: '#F8FAFC', fontWeight: 600, boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#083B56', marginBottom: '0.35rem' }}>Resolution Proof Photo / Clearance Slip (Optional)</label>
              <FileUpload
                category="tickets"
                accept="image/*,.pdf"
                maxSizeMB={10}
                onUploadSuccess={(url) => setResolutionProofUrl(url)}
              />
              {resolutionProofUrl && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.35rem', color: '#059669', fontSize: '0.78rem', fontWeight: 700 }}>
                  <FileCheck size={14} /> Document attached successfully
                </div>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #E2E8F0' }}>
              <button
                type="button"
                onClick={() => setShowResolveModal(false)}
                style={{ padding: '0.65rem 1.25rem', border: '1px solid #CBD5E1', borderRadius: '10px', background: '#ffffff', color: '#52788D', fontWeight: 700, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{ padding: '0.65rem 1.4rem', background: '#059669', color: '#ffffff', borderRadius: '10px', fontWeight: 700, border: 'none', cursor: 'pointer' }}
              >
                Mark Incident Resolved
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
