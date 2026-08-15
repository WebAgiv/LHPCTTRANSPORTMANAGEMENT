# AITRC Transport ERP — Android App

## Overview
Mobile companion app for AITRC Vita Transport ERP.

## Features (Phase 1 — Planned)
- [ ] Student QR Bus Pass display
- [ ] Payment status and history
- [ ] Notice board notifications
- [ ] Live bus tracking (GPS)
- [ ] Push notifications for dues

## Technology Stack
- **Framework**: React Native / Flutter
- **Auth**: Same JWT tokens as web ERP
- **API**: Same backend endpoints (`/api/...`)
- **QR**: React Native QRCode library

## API Base URL
All API calls go to: `http://YOUR_SERVER_IP:5000/api/`

## Quick Start (React Native)
```bash
npm install -g react-native-cli
react-native init AITRCTransportApp
cd AITRCTransportApp
# Install dependencies
npm install @react-navigation/native axios react-native-qrcode-svg
react-native run-android
```

## Key API Endpoints Used
| Endpoint | Description |
|----------|-------------|
| POST /api/auth/login | Student login |
| GET /api/students/:id/qr-pass | Get QR pass |
| GET /api/payments/student/:id | Payment history |
| GET /api/notices | Announcements |

## Contact
SORA IT TECH Solutions | transport@aitrcvita.edu.in
