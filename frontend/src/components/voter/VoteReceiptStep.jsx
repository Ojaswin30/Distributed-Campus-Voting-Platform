import React from 'react';
import { ShieldCheck, Printer } from 'lucide-react';
import Modal from '../common/Modal';

export default function VoteReceiptStep({ receiptData, onSignOut }) {
  if (!receiptData) return null;

  return (
    <Modal isOpen={true} maxWidth="640px">
      <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
        <div style={{ width: '56px', height: '56px', background: 'var(--success-light)', border: '1px solid var(--success-border)', borderRadius: '50%', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
          <ShieldCheck size={32} />
        </div>
        <h2 style={{ fontSize: '1.5rem', color: 'var(--text-main)' }}>Official Voting Receipt</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          Your selections have been securely committed to SQLite for <strong>{receiptData.student_campus}</strong>.
        </p>
      </div>

      <div className="receipt-box" id="printReceiptArea">
        <div className="receipt-row">
          <span className="receipt-label">Master Batch ID:</span>
          <span className="receipt-val" style={{ color: 'var(--success)', fontFamily: 'monospace', fontWeight: 800 }}>
            {receiptData.master_receipt_id}
          </span>
        </div>
        <div className="receipt-row">
          <span className="receipt-label">Student Name / ID:</span>
          <span className="receipt-val">{receiptData.student_name} ({receiptData.student_id})</span>
        </div>
        <div className="receipt-row">
          <span className="receipt-label">Campus Location:</span>
          <span className="receipt-val" style={{ color: 'var(--primary)', fontWeight: 700 }}>📍 {receiptData.student_campus}</span>
        </div>
        <div className="receipt-row">
          <span className="receipt-label">Voter Email:</span>
          <span className="receipt-val" style={{ fontFamily: 'monospace' }}>{receiptData.student_email}</span>
        </div>
        <div className="receipt-row">
          <span className="receipt-label">Timestamp:</span>
          <span className="receipt-val">{receiptData.timestamp}</span>
        </div>

        {/* Individual Club Ballots Breakdown */}
        <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-medium)' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-secondary)' }}>
            🗳️ Recorded Club Ballots ({receiptData.ballots?.length || 0}):
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {receiptData.ballots && receiptData.ballots.map(ballot => (
              <div key={ballot.vote_id} style={{ padding: '8px 10px', background: '#ffffff', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{ballot.club_name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>Code: {ballot.vote_id}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '0.9rem' }}>
                    {ballot.candidate_name}
                  </span>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ballot.candidate_department}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginTop: '1.25rem' }}>
        <button 
          type="button" 
          className="btn btn-secondary" 
          style={{ flex: 1 }}
          onClick={() => window.print()}
        >
          <Printer size={16} /> Print Receipt
        </button>
        <button 
          type="button" 
          className="btn btn-primary" 
          style={{ flex: 1 }}
          onClick={onSignOut}
        >
          Done & Sign Out
        </button>
      </div>
    </Modal>
  );
}
