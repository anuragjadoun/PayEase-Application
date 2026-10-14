# PayEase — UPI Payment Helper

Responsive React + Spring Boot starter that creates a standard UPI payment URI and QR code.

## Important limitations
- This is not a bank, wallet, UPI PSP, or payment gateway. It does not move money or verify settlement.
- On compatible phones, Pay with UPI attempts to open an installed UPI app. On desktop, scan the QR using a UPI app on another device.
- Compatibility depends on the UPI app, device, browser and bank. Always verify recipient and amount in the UPI app.
- Card payments are not implemented; cards require a payment gateway/provider and merchant onboarding.
- Never collect/store UPI PINs, OTPs, bank passwords or card details.

## Requirements
Java 21+, Maven 3.9+, Node.js 20+ and npm.

## Run backend
```bash
cd backend
mvn spring-boot:run
```
Backend: http://localhost:8080

## Run frontend (another terminal)
```bash
cd frontend
npm install
npm run dev
```
Open the Vite URL, usually http://localhost:5173.

## API
POST `/api/payments/intent` with JSON `{"upiId":"friend@upi","payeeName":"Friend","amount":"250.00","note":"Payment"}`. Response includes a UPI URI and QR image data URL. GET `/api/health` checks service status.

## Phone testing on same Wi-Fi
Set `VITE_API_BASE_URL=http://YOUR_COMPUTER_LAN_IP:8080` in `frontend/.env`, then run `npm run dev -- --host 0.0.0.0`. Open `http://YOUR_COMPUTER_LAN_IP:5173` on phone. Allow ports through firewall. For public deployment, use HTTPS and update backend CORS to allow only your exact frontend origin.

## Deploy
Frontend may be deployed to Vercel; backend needs a Java-capable host. Set `VITE_API_BASE_URL` to the deployed backend URL before building. Do not deploy broad CORS rules. No payment confirmation, history, wallet or card processing is implemented because these require an authorized provider integration.
