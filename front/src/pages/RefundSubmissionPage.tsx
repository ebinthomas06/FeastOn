import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Form, Row, Col, Button, Spinner, Alert } from 'react-bootstrap';
import { CheckCircle } from 'react-bootstrap-icons';
import { useTheme } from '../context/ThemeContext';
import { refundsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface FormMeta {
  form_id: number;
  title: string;
  semester: string;
  year: number;
}

// Strips a trailing "IIITK" (any case, with optional surrounding space) from a name
const cleanDisplayName = (name: string) =>
  name.replace(/\s*IIITK\s*$/i, '').trim();

const RefundSubmissionPage: React.FC = () => {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();
  const { colors } = useTheme();
  const { user, loading: authLoading } = useAuth();

  const [formMeta, setFormMeta] = useState<FormMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFoundOrClosed, setNotFoundOrClosed] = useState(false);

  // Editable but autofilled
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [rollNumber, setRollNumber] = useState('');

  const [accountHolderName, setAccountHolderName] = useState('');
  const [bankName, setBankName] = useState('');
  const [branchName, setBranchName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [confirmAccountNumber, setConfirmAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');

  // Controls masking of the confirm-account-number field
  const [confirmTouched, setConfirmTouched] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);
  const [alreadySubmittedAt, setAlreadySubmittedAt] = useState<string | null>(null);
  const [accountNumberTouched, setAccountNumberTouched] = useState(false);
  const ACCOUNT_MASK_THRESHOLD = 11;
  const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const ifscValid = ifscRegex.test(ifscCode);
const ifscInvalid = ifscCode.length === 11 && !ifscValid;
 const inputStyle = {
    backgroundColor: colors.ui.background,
    color: colors.text.primary,
    borderColor: colors.ui.border,
  };
const isLocked = !!alreadySubmittedAt;

const lockedInputStyle = {
  ...inputStyle,
  ...(isLocked && {
    opacity: 0.75,
    cursor: 'not-allowed',
    backgroundColor: colors.ui.background,
  }),
};

  // --- Auth check ---
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate(`/login?redirect=/refund/${formId}`, { replace: true });
    }
  }, [user, authLoading, formId, navigate]);

  // --- Load form + existing submission (for pre-fill / edit) ---
  useEffect(() => {
    if (!user || !formId) return;

    const load = async () => {
      setLoading(true);
      try {
        const activeForms: FormMeta[] = await refundsApi.getActiveForms();
        const match = activeForms.find(f => f.form_id === Number(formId));

        if (!match) {
          setNotFoundOrClosed(true);
          setLoading(false);
          return;
        }
        setFormMeta(match);

        const { profile, submission } = await refundsApi.getMySubmission(Number(formId));

        // Autofill profile fields (still editable)
        setName(cleanDisplayName(profile?.name || ''));
        setEmail(profile?.email || '');
        setRollNumber(profile?.roll_number || '');

        if (submission) {
          setAccountHolderName(submission.account_holder_name || '');
          setBankName(submission.bank_name || '');
          setBranchName(submission.branch_name || '');
          setAccountNumber(submission.account_number || '');
          setConfirmAccountNumber('');
          setIfscCode(submission.ifsc_code || '');
          setAlreadySubmittedAt(submission.updated_at || null);
        } else {
          setAccountHolderName(cleanDisplayName(profile?.name || ''));
        }
      } catch (err: any) {
        setMessage({ type: 'danger', text: err.message || 'Failed to load refund form.' });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user, formId]);

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setMessage(null);

  // These are now backup guards; inline feedback already shows the user before submit
  if (accountNumber !== confirmAccountNumber) {
    setMessage({ type: 'danger', text: 'Account numbers do not match.' });
    return;
  }
  if (!ifscValid) {
    setMessage({ type: 'danger', text: 'Invalid IFSC code format (e.g. SBIN0001234).' });
    return;
  }

    if (!bankName.trim()) {
      setMessage({ type: 'danger', text: 'Bank name is required.' });
      return;
    }

    if (!branchName.trim()) {
      setMessage({ type: 'danger', text: 'Branch name is required.' });
      return;
    }

    setSubmitting(true);
    try {
      await refundsApi.submit(Number(formId), {
        account_holder_name: accountHolderName,
        bank_name: bankName.trim(),
        branch_name: branchName.trim(),
        account_number: accountNumber,
        confirm_account_number: confirmAccountNumber,
        ifsc_code: ifscCode.toUpperCase(),
      });
      window.location.reload();
      
            setMessage({ type: 'success', text: 'Your refund details have been submitted successfully!' });
    } catch (err: any) {
      setMessage({ type: 'danger', text: err.message || 'Failed to submit refund details.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center p-5">
        <Spinner animation="border" variant="success" />
      </div>
    );
  }

  if (notFoundOrClosed) {
    return (
      <div className="container py-5" style={{ maxWidth: 600 }}>
        <Alert variant="warning">
          This refund form is not currently open for submissions. Please check back later or contact the mess committee.
        </Alert>
      </div>
    );
  }

 

  return (
    <div className="container py-5" style={{ maxWidth: 700 }}>
      <Card className="shadow-sm" style={{ backgroundColor: colors.ui.card, border: `1px solid ${colors.ui.border}` }}>
        <Card.Header className="py-3" style={{ backgroundColor: colors.ui.card, borderBottom: `1px solid ${colors.ui.border}` }}>
          <span className="fw-bold fs-5" style={{ color: colors.text.primary }}>
            {formMeta?.title} ({formMeta?.semester} {formMeta?.year})
          </span>
        </Card.Header>
        <Card.Body>
          {alreadySubmittedAt && (
            <Alert variant="info" className="d-flex align-items-center gap-2">
              <CheckCircle />
              <span>
                Submitted on {new Date(alreadySubmittedAt).toLocaleString()}.{' '}
                <strong>Contact the mess committee if you need to make changes.</strong>
              </span>
            </Alert>
          )}

          {message && <Alert variant={message.type}>{message.text}</Alert>}

          <Form onSubmit={handleSubmit}>
  <Row className="mb-3">
    <Col md={4}>
      <Form.Group>
        <Form.Label style={{ color: colors.text.secondary }}>Name</Form.Label>
        <Form.Control
          value={name}
          onChange={(e) => !isLocked && setName(e.target.value)}
          readOnly={isLocked}
          style={lockedInputStyle}
        />
      </Form.Group>
    </Col>
    <Col md={4}>
      <Form.Group>
        <Form.Label style={{ color: colors.text.secondary }}>Email</Form.Label>
        <Form.Control
          value={email}
          onChange={(e) => !isLocked && setEmail(e.target.value)}
          readOnly={isLocked}
          style={lockedInputStyle}
        />
      </Form.Group>
    </Col>
    <Col md={4}>
      <Form.Group>
        <Form.Label style={{ color: colors.text.secondary }}>Roll Number</Form.Label>
        <Form.Control
          value={rollNumber}
          onChange={(e) => !isLocked && setRollNumber(e.target.value)}
          readOnly={isLocked}
          style={lockedInputStyle}
        />
      </Form.Group>
    </Col>
  </Row>

  <hr style={{ borderColor: colors.ui.border }} />

  <Form.Group className="mb-3">
    <Form.Label style={{ color: colors.text.secondary }}>Account Holder Name</Form.Label>
    <Form.Control
      required
      value={accountHolderName}
      onChange={(e) => !isLocked && setAccountHolderName(e.target.value)}
      readOnly={isLocked}
      placeholder="As per bank passbook"
      style={lockedInputStyle}
    />
    {!isLocked && (
      <Form.Text style={{ color: colors.text.secondary }}>
        Usually your own name, unless the account belongs to a parent/guardian.
      </Form.Text>
    )}
  </Form.Group>

  <Row className="mb-3">
    <Col md={6}>
      <Form.Group>
        <Form.Label style={{ color: colors.text.secondary }}>Bank Name</Form.Label>
        <Form.Control
          required
          value={bankName}
          onChange={(e) => !isLocked && setBankName(e.target.value)}
          readOnly={isLocked}
          placeholder="e.g. SBI"
          style={lockedInputStyle}
        />
      </Form.Group>
    </Col>
    <Col md={6}>
      <Form.Group>
        <Form.Label style={{ color: colors.text.secondary }}>Branch Name</Form.Label>
        <Form.Control
          required
          value={branchName}
          onChange={(e) => !isLocked && setBranchName(e.target.value)}
          readOnly={isLocked}
          placeholder="e.g. Kottayam"
          style={lockedInputStyle}
        />
      </Form.Group>
    </Col>
  </Row>

  <Row className="mb-4">
    <Col md={isLocked ? 12 : 6}>
      <Form.Group>
        <Form.Label style={{ color: colors.text.secondary }}>Account Number</Form.Label>
        <Form.Control
          required
          // Show plaintext when locked so the saved number is visible
          type={isLocked ? 'text' : (accountNumberTouched && accountNumber.length >= ACCOUNT_MASK_THRESHOLD ? 'password' : 'text')}
          inputMode="numeric"
          value={accountNumber}
          onChange={(e) => {
            if (isLocked) return;
            setAccountNumber(e.target.value.replace(/\D/g, ''));
            setAccountNumberTouched(false);
          }}
          onBlur={() => {
            if (!isLocked && accountNumber.length >= ACCOUNT_MASK_THRESHOLD)
              setAccountNumberTouched(true);
          }}
          readOnly={isLocked}
          style={lockedInputStyle}
        />
      </Form.Group>
    </Col>

    {/* Hide confirm field entirely when locked — it's always empty on reload */}
    {!isLocked && (
      <Col md={6}>
        <Form.Group>
          <Form.Label style={{ color: colors.text.secondary }}>Confirm Account Number</Form.Label>
          <Form.Control
            required
            type="password"
            inputMode="numeric"
            value={confirmAccountNumber}
            onChange={(e) => setConfirmAccountNumber(e.target.value.replace(/\D/g, ''))}
            onPaste={(e) => e.preventDefault()}
            onCopy={(e) => e.preventDefault()}
            autoComplete="off"
            isInvalid={confirmAccountNumber.length > 0 && confirmAccountNumber !== accountNumber}
            isValid={confirmAccountNumber.length > 0 && confirmAccountNumber === accountNumber}
            style={inputStyle}
          />
          {confirmAccountNumber.length > 0 && confirmAccountNumber !== accountNumber && (
            <Form.Control.Feedback type="invalid">Account numbers do not match.</Form.Control.Feedback>
          )}
          {confirmAccountNumber.length > 0 && confirmAccountNumber === accountNumber && (
            <Form.Control.Feedback type="valid">Looks good!</Form.Control.Feedback>
          )}
        </Form.Group>
      </Col>
    )}
  </Row>

  <Form.Group className="mb-4">
    <Form.Label style={{ color: colors.text.secondary }}>IFSC Code</Form.Label>
    <Form.Control
      required
      value={ifscCode}
      onChange={(e) => !isLocked && setIfscCode(e.target.value.toUpperCase())}
      readOnly={isLocked}
      placeholder="e.g. SBIN0001234"
      isValid={!isLocked && ifscCode.length === 11 && ifscValid}
      isInvalid={!isLocked && ifscInvalid}
      style={{ ...lockedInputStyle, textTransform: 'uppercase' }}
    />
    {!isLocked && ifscInvalid ? (
      <Form.Control.Feedback type="invalid">
        Invalid format. Must be 4 letters, then 0, then 6 letters/digits (e.g. SBIN0001234).
      </Form.Control.Feedback>
    ) : (
      !isLocked && (
        <Form.Text style={{ color: colors.text.secondary }}>
          Format: 4 letters, 0, then 6 letters/digits (e.g. SBIN0001234).
        </Form.Text>
      )
    )}
  </Form.Group>

  <Button
    type="submit"
    variant="success"
    disabled={submitting || isLocked}
    className="w-100"
    style={{ backgroundColor: colors.primary.main, borderColor: colors.primary.main }}
  >
    {submitting
      ? <Spinner animation="border" size="sm" />
      : isLocked
        ? 'Already Submitted'
        : 'Submit Refund Details'}
  </Button>
</Form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default RefundSubmissionPage;