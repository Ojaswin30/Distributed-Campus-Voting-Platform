import React from 'react';

export default function StepWizard({ currentStep }) {
  const getProgressWidth = () => {
    if (currentStep === 1) return '0%';
    if (currentStep === 2) return '50%';
    return '100%';
  };

  return (
    <div className="step-wizard">
      <div 
        className="step-wizard-progress" 
        style={{ width: getProgressWidth() }} 
      />
      <div className={`step-item ${currentStep === 1 ? 'active' : currentStep > 1 ? 'completed' : ''}`}>
        <div className="step-number">{currentStep > 1 ? '✓' : '1'}</div>
        <span className="step-label">1. Student Login</span>
      </div>
      <div className={`step-item ${currentStep === 2 ? 'active' : currentStep > 2 ? 'completed' : ''}`}>
        <div className="step-number">{currentStep > 2 ? '✓' : '2'}</div>
        <span className="step-label">2. Multi-Club Ballot</span>
      </div>
      <div className={`step-item ${currentStep === 3 ? 'active' : ''}`}>
        <div className="step-number">3</div>
        <span className="step-label">3. Digital Receipt</span>
      </div>
    </div>
  );
}
