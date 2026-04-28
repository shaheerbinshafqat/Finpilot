HEAD
# Finpilot.pk
A professional-level portfolio tracker + expense manager + decision-making tool, not just a basic sheet. | Personal financial command center + investment intelligence dashboard

# FinPilot — PSX Portfolio Intelligence

FinPilot is a premium, high-performance personal finance and portfolio intelligence web application specifically designed for the Pakistan Stock Exchange (PSX). It provides real-time market data, advanced capital gains tax (CGT) calculations, and deep portfolio analytics wrapped in a stunning, responsive, dark-mode-first user interface.

## 🚀 Features

- **Live Stock Screener:** Real-time PSX market data, price histories, and financial metrics in a high-density, professional screener layout.
- **Advanced Tax Calculators (Finance Act 2025):**
  - **CGT Calculator:** Multi-step intelligent calculator that computes precise taxes based on holding periods (FIFO), NCCPL rules, Filer/Non-Filer status, and offset losses.
  - **Trading Costs Calculator:** Calculates exact transaction costs including brokerage, SECP levy, PSX fees, and dynamic provincial SST.
  - **Dividend Tax:** Instant Filer vs. Non-Filer dividend yield breakdowns.
- **Portfolio Intelligence:** Track holdings, analyze net worth, and benchmark your performance against key indices (KSE-100, KMI-30, etc.).
- **Adaptive Theming:** Seamless transition between light and dark modes driven by a robust custom design system.
- **Privacy-First:** 100% client-side computations. Your financial data never leaves your browser.

## 🛠️ Tech Stack

- **Framework:** React (built with Vite)
- **Styling:** Tailwind CSS + Custom CSS Variables for Theming
- **Icons:** Lucide React
- **Data Source:** Proxy integration with live PSX data APIs

## 💻 Running Locally

1. **Clone the repository:**
   ```bash
   git clone <your-repository-url>
   cd psx-cc
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

## ⚖️ Disclaimer
This tool is for educational and estimation purposes only. It does not constitute financial or tax advice. Tax calculations are based on the Income Tax Ordinance, 2001 as amended by the Finance Act 2025. For official CGT computations, refer to NCCPL. Consult a qualified tax advisor for your specific situation.
