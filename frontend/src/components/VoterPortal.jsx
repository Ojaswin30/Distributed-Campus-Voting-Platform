import React, { useState, useEffect, useRef } from 'react';
import { voterApi } from '../api/voterApi';
import { parseGoogleJwt } from '../utils/jwtHelper';
import TurnoutBanner from './voter/TurnoutBanner';
import StepWizard from './voter/StepWizard';
import StudentLoginStep from './voter/StudentLoginStep';
import StudentProfileHeader from './voter/StudentProfileHeader';
import ClubBallotCard from './voter/ClubBallotCard';
import FloatingVoteBar from './voter/FloatingVoteBar';
import VoteReviewModal from './voter/VoteReviewModal';
import VoteReceiptStep from './voter/VoteReceiptStep';
import AlertBanner from './common/AlertBanner';

export default function VoterPortal() {
  // Wizard steps: 1 = Login, 2 = Campus Ballot, 3 = Receipt
  const [currentStep, setCurrentStep] = useState(1);
  
  // Authenticated Student Profile & Campus Ballot
  const [studentProfile, setStudentProfile] = useState(null); 
  const [ballotClubs, setBallotClubs] = useState([]);
  const [voterEmail, setVoterEmail] = useState('');

  // Selected candidates mapping: { [club_id]: candidate_id }
  const [selections, setSelections] = useState({});

  // Review confirmation modal
  const [showReviewModal, setShowReviewModal] = useState(false);

  // Overall system turnout metrics
  const [totalVotesCast, setTotalVotesCast] = useState(0);
  const [allClubsCount, setAllClubsCount] = useState(0);

  // Status & Feedback
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [receiptData, setReceiptData] = useState(null);

  // Google OAuth Client ID (loaded from environment variable or localStorage)
  const [googleClientId, setGoogleClientId] = useState(() => {
    try {
      return (
        import.meta.env.VITE_GOOGLE_CLIENT_ID ||
        localStorage.getItem('google_client_id') ||
        ''
      );
    } catch {
      return import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
    }
  });
  const googleBtnRef = useRef(null);

  // Fetch Global Turnout Metrics on mount & poll every 4s
  useEffect(() => {
    fetchGlobalMetrics();
    const interval = setInterval(fetchGlobalMetrics, 4000);
    return () => clearInterval(interval);
  }, []);

  const fetchGlobalMetrics = async () => {
    try {
      const data = await voterApi.getClubs();
      if (data.success) {
        setTotalVotesCast(data.total_votes_cast || 0);
        setAllClubsCount(data.clubs?.length || 0);
      }
    } catch (err) {
      console.error('Error fetching live turnout:', err);
    }
  };

  // Initialize Official Google Identity Services Button on Step 1
  useEffect(() => {
    if (currentStep !== 1 || studentProfile) return;

    const renderGoogleButton = () => {
      if (window.google?.accounts?.id && googleBtnRef.current) {
        try {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: handleGoogleResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          googleBtnRef.current.innerHTML = '';
          window.google.accounts.id.renderButton(googleBtnRef.current, {
            theme: 'filled_blue',
            size: 'large',
            shape: 'rectangular',
            text: 'signin_with',
            logo_alignment: 'left',
            width: 280
          });
        } catch (e) {
          console.warn('Google Identity Services initialization warning:', e);
        }
      }
    };

    renderGoogleButton();
    const timer = setTimeout(renderGoogleButton, 400);
    return () => clearTimeout(timer);
  }, [currentStep, studentProfile, googleClientId]);

  // Handle Response from Official Google Sign-In Popup
  const handleGoogleResponse = async (response) => {
    if (!response?.credential) {
      setErrorMsg('Google authentication was cancelled or returned no credential.');
      return;
    }
    await verifyWithBackend(response.credential);
  };

  // Trigger Official Google Sign In Prompt
  const triggerGoogleSignIn = () => {
    if (window.google?.accounts?.id) {
      try {
        window.google.accounts.id.prompt();
      } catch (e) {
        console.warn('Google prompt warning:', e);
      }
    }
  };

  // Verify Google ID Token with Backend
  const verifyWithBackend = async (idToken) => {
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    let tokenToSend = idToken;
    const parsed = parseGoogleJwt(idToken);
    if (parsed?.email && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      tokenToSend = `dev:${parsed.email}`;
    }

    try {
      const data = await voterApi.googleLogin(tokenToSend);
      if (!data.success) {
        setErrorMsg(data.detail || 'Google account verification failed.');
        setLoading(false);
        return;
      }

      setStudentProfile(data.student);
      setBallotClubs(data.ballot_clubs || []);
      setSelections({});
      setVoterEmail(data.student.email);
      setSuccessMsg(`✓ Verified via Google: ${data.student.name} (${data.campus})`);
      setCurrentStep(2);
    } catch (err) {
      setErrorMsg(err.message || 'Network error communicating with authentication server.');
    } finally {
      setLoading(false);
    }
  };

  // Toggle or select candidate for a specific club
  const handleSelectCandidate = (clubId, candidateId) => {
    setSelections(prev => {
      const updated = { ...prev };
      if (updated[clubId] === candidateId) {
        delete updated[clubId];
      } else {
        updated[clubId] = candidateId;
      }
      return updated;
    });
  };

  // Calculate vote progress
  const votableClubs = ballotClubs.filter(c => !c.has_voted);
  const selectedCount = Object.keys(selections).length;
  const isAllSelected = votableClubs.length > 0 && selectedCount === votableClubs.length;

  // Submit all votes atomically
  const handleConfirmAndCastVotes = async () => {
    if (selectedCount === 0) {
      setErrorMsg('Please select at least one candidate before casting your ballot.');
      setShowReviewModal(false);
      return;
    }

    const votesPayload = Object.entries(selections).map(([clubId, candidateId]) => ({
      club_id: clubId,
      candidate_id: candidateId
    }));

    setLoading(true);
    setErrorMsg('');
    try {
      const data = await voterApi.castMultiVote({
        email: studentProfile.email || voterEmail,
        student_id: studentProfile.enrollment_id,
        votes: votesPayload
      });

      if (!data.success) {
        setErrorMsg(data.detail || 'Failed to submit ballot.');
        setShowReviewModal(false);
        setLoading(false);
        return;
      }

      setReceiptData(data.receipt);
      setShowReviewModal(false);
      setCurrentStep(3);
      fetchGlobalMetrics();
    } catch (err) {
      setErrorMsg(err.message || 'Network error while recording ballot transaction.');
    } finally {
      setLoading(false);
    }
  };

  // Sign out / Reset flow
  const handleSignOut = () => {
    setStudentProfile(null);
    setBallotClubs([]);
    setSelections({});
    setVoterEmail('');
    setReceiptData(null);
    setErrorMsg('');
    setSuccessMsg('');
    setShowReviewModal(false);
    setCurrentStep(1);
    if (window.google?.accounts?.id) {
      window.google.accounts.id.disableAutoSelect();
    }
  };

  return (
    <div>
      {/* LIVE TURNOUT BANNER */}
      <TurnoutBanner totalVotesCast={totalVotesCast} allClubsCount={allClubsCount} />

      {/* STEP PROGRESS WIZARD */}
      <StepWizard currentStep={currentStep} />

      {/* FEEDBACK ALERTS */}
      <AlertBanner type="error" message={errorMsg} />
      <AlertBanner type="success" message={successMsg} />

      {/* STEP 1: GOOGLE AUTHENTICATION */}
      {currentStep === 1 && (
        <StudentLoginStep
          loading={loading}
          googleClientId={googleClientId}
          setGoogleClientId={setGoogleClientId}
          onTriggerGoogleSignIn={triggerGoogleSignIn}
          googleBtnRef={googleBtnRef}
        />
      )}

      {/* STEP 2: MULTI-CLUB CAMPUS BALLOT */}
      {currentStep === 2 && studentProfile && (
        <div>
          <StudentProfileHeader 
            studentProfile={studentProfile} 
            onSignOut={handleSignOut} 
          />

          {/* Ballot Header & Instruction */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <h2 style={{ fontSize: '1.45rem' }}>Official Campus Ballot</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Select your preferred candidate for each election club below. You can submit all your club selections in one seamless click!
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-surface)', border: '1px solid var(--border-medium)', padding: '6px 14px', borderRadius: 'var(--radius-full)', fontWeight: 700, fontSize: '0.9rem' }}>
              <span style={{ color: isAllSelected ? 'var(--success)' : 'var(--primary)' }}>
                {selectedCount} of {votableClubs.length} Clubs Selected
              </span>
            </div>
          </div>

          {/* All Campus Clubs in View */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '5rem' }}>
            {ballotClubs.length > 0 ? (
              ballotClubs.map((club, idx) => (
                <ClubBallotCard
                  key={club.id}
                  club={club}
                  index={idx}
                  chosenCandidateId={selections[club.id]}
                  onSelectCandidate={handleSelectCandidate}
                />
              ))
            ) : (
              <div className="clean-card" style={{ textAlign: 'center', padding: '3rem' }}>
                <p style={{ color: 'var(--text-muted)' }}>No active election clubs found for {studentProfile.campus}.</p>
              </div>
            )}
          </div>

          {/* Floating Action Bar */}
          <FloatingVoteBar
            studentProfile={studentProfile}
            selectedCount={selectedCount}
            totalVotableClubs={votableClubs.length}
            loading={loading}
            onClear={() => setSelections({})}
            onReview={() => setShowReviewModal(true)}
          />

          {/* Review Modal */}
          <VoteReviewModal
            isOpen={showReviewModal}
            studentProfile={studentProfile}
            ballotClubs={ballotClubs}
            selections={selections}
            loading={loading}
            onClose={() => setShowReviewModal(false)}
            onConfirm={handleConfirmAndCastVotes}
          />
        </div>
      )}

      {/* STEP 3: DIGITAL RECEIPT */}
      {currentStep === 3 && receiptData && (
        <VoteReceiptStep receiptData={receiptData} onSignOut={handleSignOut} />
      )}
    </div>
  );
}
