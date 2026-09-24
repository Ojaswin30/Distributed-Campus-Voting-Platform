import React from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export default function AlertBanner({ alert, type, message }) {
  const alertType = type || alert?.type;
  const alertMsg = message || alert?.message;

  if (!alertMsg) return null;

  return (
    <div className={`alert ${alertType === 'success' ? 'alert-success' : 'alert-error'}`}>
      {alertType === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
      <span>{alertMsg}</span>
    </div>
  );
}
