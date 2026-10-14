
import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export default function QrScanner({ onScan, onClose }) {
  const scannerRef = useRef(null);
  const handledRef = useRef(false);
  const onScanRef = useRef(onScan);
  const [error, setError] = useState('');

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    let cancelled = false;
    let scanner = null;

    async function startScanner() {
      const container = document.getElementById('payease-qr-reader');

      if (!container || cancelled) return;

      // Remove any leftover video elements before initializing.
      container.replaceChildren();

      try {
        handledRef.current = false;

        scanner = new Html5Qrcode('payease-qr-reader');
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 240, height: 240 },
            disableFlip: true,
            videoConstraints: {
              facingMode: 'environment',
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          },
          async (decodedText) => {
            if (cancelled || handledRef.current) return;

            handledRef.current = true;

            try {
              if (scanner.isScanning) {
                await scanner.stop();
              }
            } catch {
              // Continue after attempting to stop the camera.
            }

            if (!cancelled) {
              onScanRef.current(decodedText);
            }
          },
          () => {
            // Ignore frames without a readable QR code.
          }
        );

        if (cancelled && scanner.isScanning) {
          await scanner.stop();
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            'Camera could not start. Close the scanner and try again.'
          );
        }
      }
    }

    startScanner();

    return () => {
      cancelled = true;

      const activeScanner = scannerRef.current;

      if (activeScanner) {
        const cleanup = async () => {
          try {
            if (activeScanner.isScanning) {
              await activeScanner.stop();
            }
          } catch {
            // Ignore camera cleanup errors.
          }

          try {
            activeScanner.clear();
          } catch {
            // Container may already be cleared.
          }

          if (scannerRef.current === activeScanner) {
            scannerRef.current = null;
          }
        };

        cleanup();
      }
    };
  }, []);

  return (
    <div className="qr-scanner">
      <div id="payease-qr-reader" />

      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}

      <button
        type="button"
        className="secondary-button"
        onClick={onClose}
      >
        Cancel
      </button>
    </div>
  );
}
