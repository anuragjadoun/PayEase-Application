
import React, { useCallback, useState } from 'react';
import {
  ArrowUpRight,
  Copy,
  HeartHandshake,
  Info,
  LoaderCircle,
  QrCode,
  ShieldCheck,
  Smartphone,
  Wallet,
  X,
} from 'lucide-react';
import QrScanner from './QrScanner';

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? 'http://localhost:8080' : '')
).replace(/\/$/, '');

function parseUpiQr(text) {
  try {
    const url = new URL(text.trim());

    if (
      url.protocol.toLowerCase() !== 'upi:' ||
      url.hostname.toLowerCase() !== 'pay'
    ) {
      return null;
    }

    const params = url.searchParams;
    const upiId = params.get('pa')?.trim();

    if (
      !upiId ||
      !/^[A-Za-z0-9._-]{2,256}@[A-Za-z0-9.-]{2,64}$/.test(upiId)
    ) {
      return null;
    }

    const rawAmount = params.get('am');
    let amount = '';

    if (rawAmount !== null && rawAmount !== '') {
      const parsedAmount = Number(rawAmount);

      if (
        !Number.isFinite(parsedAmount) ||
        parsedAmount < 1 ||
        parsedAmount > 100000 ||
        !/^\d+(\.\d{1,2})?$/.test(rawAmount)
      ) {
        return null;
      }

      amount = rawAmount;
    }

    return {
      upiId,
      payeeName: params.get('pn') || '',
      amount,
      note: params.get('tn') || 'Shop payment',
      currency: params.get('cu') || 'INR',
    };
  } catch {
    return null;
  }
}

function buildUpiUri({ upiId, payeeName, amount, note }) {
  const params = new URLSearchParams();

  params.set('pa', upiId.trim());
  params.set('cu', 'INR');

  if (payeeName.trim()) {
    params.set('pn', payeeName.trim());
  }

  if (amount !== '' && amount != null) {
    params.set('am', Number(amount).toFixed(2));
  }

// Add a transaction note only when one is intentionally provided.
if (note && note.trim()) {
  params.set('tn', note.trim());
}

  return `upi://pay?${params.toString()}`;
}

export default function App() {
  const [upiId, setUpiId] = useState('');
  const [payeeName, setPayeeName] = useState('');
  const [amount, setAmount] = useState('100');
  const [note, setNote] = useState('Payment');

  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [help, setHelp] = useState(false);

  const [scanning, setScanning] = useState(false);
  const [scannedQr, setScannedQr] = useState(null);
  const [shopAmount, setShopAmount] = useState('');
  const [shopError, setShopError] = useState('');

  async function createPayment(e) {
    e.preventDefault();

    setError('');
    setPayment(null);
    setLoading(true);

    try {
      const response = await fetch(
        `${API_BASE}/api/payments/intent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            upiId: upiId.trim(),
            payeeName: payeeName.trim(),
            amount,
            note: note.trim() || 'Payment',
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message ||
            'Could not create payment request. Check your details and backend.'
        );
      }

      setPayment(data);
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  async function copyText(value) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);

      setTimeout(() => setCopied(false), 1500);
    } catch {
      setError('Clipboard blocked. Please copy the text manually.');
    }
  }

  const handleQrScan = useCallback((decodedText) => {
    const details = parseUpiQr(decodedText);

    setScanning(false);
    setError('');
    setShopError('');

    if (!details) {
      setScannedQr(null);
      setShopError(
        'This QR does not appear to be a supported UPI payment QR. Try scanning the shop UPI QR again.'
      );
      return;
    }

    setScannedQr(details);
    setShopAmount(details.amount);
  }, []);

  function openScanner() {
    setError('');
    setShopError('');
    setScanning(true);
  }

  function closeScannedPayment() {
    setScannedQr(null);
    setShopAmount('');
    setShopError('');
    setScanning(false);
  }

  
function continueToUpiApp() {
  if (!scannedQr) return;

  const value = shopAmount.trim();

  if (
    value === '' ||
    !/^\d+(\.\d{1,2})?$/.test(value) ||
    !Number.isFinite(Number(value)) ||
    Number(value) < 1 ||
    Number(value) > 100000
  ) {
    setShopError('Enter an amount between ₹1 and ₹1,00,000.');
    return;
  }

  if (scannedQr.currency.toUpperCase() !== 'INR') {
    setShopError('This QR does not specify INR currency.');
    return;
  }

  const uri = buildUpiUri({
    upiId: scannedQr.upiId,
    payeeName: scannedQr.payeeName,
    amount: value,
    note: scannedQr.note || '',
  });

  setShopError('');

  // Mobile par compatible UPI app launch karne ki koshish.
  // Desktop par UPI app handler na ho to QR/URI fallback dikhao.
  const isMobile = /Android|iPhone|iPad|iPod/i.test(
    navigator.userAgent
  );

  if (isMobile) {
    window.location.href = uri;
  } else {
    setShopError(
      'A UPI app could not be opened on this desktop browser. Open PayEase on your mobile phone using an HTTPS website, or enter the merchant UPI ID manually in your UPI app.'
    );
  }
}


  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#">
          <span className="brand-mark">
            <Wallet size={21} />
          </span>

          <span>
            PayEase<span className="brand-dot">.</span>
          </span>
        </a>

        <button
          className="help-button"
          type="button"
          onClick={() => setHelp(true)}
        >
          <Info size={16} />
          How it works
        </button>
      </header>

      <main className="layout">
        <section className="intro">
          <div className="eyebrow">
            <span className="live-dot" />
            SIMPLE UPI PAYMENT HELPER
          </div>

          <h1>
            Money moves.
            <br />
            <span>Friendships stay.</span>
          </h1>

          <p className="intro-copy">
            Scan a shop's UPI QR or create a payment request
            for someone you know.
          </p>

          <div className="trust-row">
            <div className="trust-icon">
              <ShieldCheck size={19} />
            </div>

            <div>
              <strong>Your payment, your UPI app</strong>
              <span>PayEase never asks for your UPI PIN.</span>
            </div>
          </div>

          <div className="feature-pills">
            <span>
              <Smartphone size={15} />
              Mobile ready
            </span>

            <span>
              <QrCode size={15} />
              QR scanning
            </span>

            <span>
              <ShieldCheck size={15} />
              No PIN stored
            </span>
          </div>
        </section>

        <section className="payment-card">
          {scanning ? (
            <div className="result-view">
              <button
                className="back-button"
                type="button"
                onClick={() => setScanning(false)}
              >
                ← Back
              </button>

              <div className="card-kicker">SCAN MERCHANT QR</div>
              <h2>Scan shop QR</h2>

              <p className="scan-copy">
                Allow camera access and place the shop's UPI QR
                inside the camera frame.
              </p>

              <QrScanner
                onScan={handleQrScan}
                onClose={() => setScanning(false)}
              />

              {shopError && (
                <div className="error-message" role="alert">
                  {shopError}
                </div>
              )}
            </div>
          ) : scannedQr ? (
            <div className="result-view">
              <button
                className="back-button"
                type="button"
                onClick={closeScannedPayment}
              >
                ← Back
              </button>

              <div className="success-icon">
                <QrCode size={29} />
              </div>

              <div className="card-kicker">QR SCANNED</div>
              <h2>Review payment</h2>

              <div className="field-hint">
                Verify the merchant details before opening a UPI app.
              </div>

              <label htmlFor="shop-upi">Merchant UPI ID</label>
              <input
                id="shop-upi"
                value={scannedQr.upiId}
                readOnly
              />

              <label htmlFor="shop-name">Merchant name</label>
              <input
                id="shop-name"
                value={scannedQr.payeeName}
                readOnly
                placeholder="Name not provided in QR"
              />

              <label htmlFor="shop-amount">
                Amount (₹) <b>*</b>
              </label>

              <input
                id="shop-amount"
                type="number"
                min="1"
                max="100000"
                step="0.01"
                value={shopAmount}
                onChange={(e) => setShopAmount(e.target.value)}
                required
              />

              <div className="field-hint">
                {scannedQr.amount
                  ? 'Amount was included in the scanned QR. Verify it before paying.'
                  : 'The QR has no fixed amount. Enter the amount shown on the shop bill.'}
              </div>

              <label htmlFor="shop-note">Payment note</label>
              <input
                id="shop-note"
                value={scannedQr.note}
                onChange={(e) =>
                  setScannedQr((previous) => ({
                    ...previous,
                    note: e.target.value,
                  }))
                }
                maxLength="50"
              />

              {shopError && (
                <div className="error-message" role="alert">
                  {shopError}
                </div>
              )}

              <button
                type="button"
                className="primary-button"
                onClick={continueToUpiApp}
              >
                Pay with UPI app
                <ArrowUpRight size={18} />
              </button>

              <button
                type="button"
                className="secondary-button"
                onClick={() => copyText(scannedQr.upiId)}
              >
                <Copy size={16} />
                {copied ? 'UPI ID copied' : 'Copy merchant UPI ID'}
              </button>

              <div className="warning-note">
                <Info size={16} />
                <span>
                  Verify the merchant name and amount inside your UPI
                  app. Authorize payment only if the details are correct.
                </span>
              </div>
            </div>
          ) : !payment ? (
            <>
              <div className="card-heading">
                <div>
                  <div className="card-kicker">NEW PAYMENT</div>
                  <h2>Pay a friend</h2>
                </div>

                <div className="card-icon">
                  <ArrowUpRight size={22} />
                </div>
              </div>

              <button
                type="button"
                className="secondary-button"
                onClick={openScanner}
              >
                <QrCode size={18} />
                Scan Shop QR
              </button>

              {shopError && (
                <div className="error-message" role="alert">
                  {shopError}
                </div>
              )}

              <div className="field-hint">
                Or enter a friend's UPI ID below.
              </div>

              <form onSubmit={createPayment}>
                <label htmlFor="upi">
                  Friend's UPI ID <b>*</b>
                </label>

                <div className="input-wrap">
                  <span className="input-prefix">@</span>

                  <input
                    id="upi"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="name@bank"
                    required
                    maxLength="100"
                    autoComplete="off"
                  />
                </div>

                <div className="field-hint">
                  Check the UPI ID carefully before continuing.
                </div>

                <label htmlFor="payee">
                  Friend's name <span>(optional)</span>
                </label>

                <input
                  id="payee"
                  value={payeeName}
                  onChange={(e) => setPayeeName(e.target.value)}
                  placeholder="e.g. Rahul"
                  maxLength="80"
                />

                <label htmlFor="amount">
                  Amount <b>*</b>
                </label>

                <div className="amount-input">
                  <span>₹</span>

                  <input
                    id="amount"
                    type="number"
                    min="1"
                    max="100000"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>

                <div className="quick-amounts">
                  {['100', '200', '500', '1000'].map((value) => (
                    <button
                      key={value}
                      type="button"
                      className={
                        amount === value ? 'quick active' : 'quick'
                      }
                      onClick={() => setAmount(value)}
                    >
                      ₹{value}
                    </button>
                  ))}
                </div>

                <label htmlFor="note">
                  Payment note <span>(optional)</span>
                </label>

                <input
                  id="note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Dinner split"
                  maxLength="50"
                />

                {error && (
                  <div className="error-message" role="alert">
                    {error}
                  </div>
                )}

                <button
                  className="primary-button"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <LoaderCircle className="spin" size={19} />
                      Creating request...
                    </>
                  ) : (
                    <>
                      Create payment QR
                      <ArrowUpRight size={18} />
                    </>
                  )}
                </button>
              </form>

              <div className="secure-note">
                <ShieldCheck size={15} />
                Your UPI PIN is entered only in your UPI app.
              </div>
            </>
          ) : (
            <div className="result-view">
              <button
                className="back-button"
                type="button"
                onClick={() => {
                  setPayment(null);
                  setError('');
                }}
              >
                ← Edit details
              </button>

              <div className="success-icon">
                <QrCode size={29} />
              </div>

              <div className="card-kicker">
                PAYMENT REQUEST READY
              </div>

              <h2>
                ₹
                {Number(payment.amount).toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </h2>

              <p className="recipient">
                {payment.payeeName || payment.upiId}
              </p>

              <div className="qr-frame">
                <img
                  src={payment.qrCodeDataUrl}
                  alt="UPI payment QR code"
                />
              </div>

              <p className="scan-copy">
                Scan this QR using a UPI app on another device.
              </p>

              <a
                className="primary-button pay-link"
                href={payment.upiUri}
              >
                Pay with UPI app
                <ArrowUpRight size={18} />
              </a>

              <button
                type="button"
                className="secondary-button"
                onClick={() => copyText(payment.upiId)}
              >
                <Copy size={16} />
                {copied ? 'UPI ID copied' : `Copy ${payment.upiId}`}
              </button>

              <div className="warning-note">
                <Info size={16} />
                <span>
                  After paying, check your UPI app/bank statement.
                  PayEase cannot independently confirm payment success.
                </span>
              </div>

              <button
                type="button"
                className="text-button"
                onClick={() => setPayment(null)}
              >
                Make another payment request
              </button>
            </div>
          )}
        </section>

        <section className="bottom-note">
          <div className="bottom-icon">
            <HeartHandshake size={20} />
          </div>

          <div>
            <strong>Made for everyday moments</strong>
            <p>
              Splitting dinner, returning a little favour, or
              paying a shop.
            </p>
          </div>
        </section>
      </main>

      <footer>
        <span>PayEase © {new Date().getFullYear()}</span>

        <span>
          Simple payment helper · Not a bank or payment service provider
        </span>
      </footer>

      {help && (
        <div
          className="modal-backdrop"
          onClick={() => setHelp(false)}
        >
          <div
            className="help-modal"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close"
              type="button"
              onClick={() => setHelp(false)}
              aria-label="Close"
            >
              <X size={19} />
            </button>

            <div className="card-icon">
              <Info size={22} />
            </div>

            <h2>How PayEase works</h2>

            <ol>
              <li>
                Scan a shop's UPI QR or enter a friend's UPI ID.
              </li>
              <li>
                Review the receiver and amount carefully.
              </li>
              <li>
                Open a compatible UPI app to authorize payment.
              </li>
              <li>
                Verify payment in your UPI app or bank statement.
              </li>
            </ol>

            <p className="modal-disclaimer">
              PayEase does not transfer funds or independently verify
              settlement. Never share your UPI PIN with anyone.
            </p>

            <button
              type="button"
              className="primary-button"
              onClick={() => setHelp(false)}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
