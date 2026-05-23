# Abaahan POS 🚀

Abaahan POS is a modern, high-end Point of Sale (POS) and Workshop Management system designed specifically for premium automotive service centers. Built with React, Vite, and Tailwind CSS, Abaahan POS streamlines the entire customer journey—from onboarding and vehicle inspection to floor execution and digital reporting—all wrapped in a stunning glassmorphism aesthetic.

## 🌟 Key Features & Workflows

- **Premium Customer KYC & Lookup:** Seamlessly register and look up customers instantly using mobile numbers. Includes session-level tracking that automatically stamps and displays a returning customer's **Last Visit** timestamp (date and exact time) under quick search results.
- **Strict Consent-to-Billing Workflow:** Enforces real-world workshop governance. Estimates require explicit digital consent from the customer before a job can be sent to the floor. The POS Billing terminal remains **locked** until the technician physically marks the job as completed.
- **Kanban-Style Job Floor Tracker:** A tablet-friendly, real-time dashboard for technicians to manage jobs (Queue ➔ In Bay ➔ Ready). Fully integrated with the billing engine to prevent invoicing without service completion.
- **Vehicle Inspection & Diagnosis:** An intuitive interface for technicians to perform detailed visual inspections (tyres, battery health, and general conditions) with interactive vehicle visuals.
- **Intelligent Recommendations:** Automatically generates service recommendations based on inspection data (tread depth, pressure, condition).
- **Split-Screen Checkout:** Instantly review an itemized estimate alongside the customer consent block.
- **Scaffolded Payment Gateway (Razorpay):** Integrates checkout processing modes supporting **UPI, Card, NetBanking, and Cash**. Triggers Razorpay Checkout SDK dynamically on execution with prefilled customer details, custom themes, and sandbox error handling.
- **Digital Reports Hub:** Maintain a history of detailed, printable, and shareable (via WhatsApp/Email) digital inspection reports for every service session.

## 🛠️ Tech Stack

- **Frontend Framework:** React 18
- **Build Tool:** Vite
- **Styling:** Tailwind CSS (Custom glassmorphism themes, dynamic blobs, and modern UI tokens)
- **Icons:** Lucide React
- **Animations:** Framer Motion
- **State Management:** React Context API (`AppProvider`)
- **Routing:** React Router DOM
- **Payment Gateway:** Razorpay Standard Checkout SDK

## 🚀 Getting Started

### Prerequisites

Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/suhanranjantripathy/Abaahan-POS.git
   cd Abaahan-POS
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

## 📱 Application Flow

1. **Login:** Authenticate as a Store Manager, POS Executive, or Technician. Role-based access ensures users only see what they need.
2. **Customer Discovery:** Fast mobile-first lookup. Shows previous customer visit histories and redirects to Quick KYC if the customer is new.
3. **Inspection:** Technicians input tyre tread depths, battery health, and visual conditions.
4. **Advisory & Estimate:** The system suggests replacements. The Sales Manager generates an estimate.
5. **Customer Consent:** Customer reviews and approves the estimate. This instantly creates the job on the workshop floor.
6. **Execution (Job Floor):** Technician claims the job, executes it, and marks it as completed.
7. **Checkout & Billing:** The POS unlocks. Manager collects payment (UPI/Card/Cash) via mock Razorpay checkout gateway and generates the receipt.
8. **Reporting:** A digital report is auto-generated containing health gauges, diagrams, and historical data, which can be shared via WhatsApp.

## 🎨 UI/UX & Visual Highlights

- **Glassmorphism & Dynamic Backgrounds:** Extensive use of `backdrop-blur`, animated gradient orbs, and soft drop shadows for an enterprise-luxury feel.
- **Symmetric Bird-Eye Car Diagrams:** Precise mathematical coordinates for FL, FR, RL, and RR tyres ensuring perfect left-right alignment and equal outer margins.
- **Preserved Aspect Ratios:** SVG components use `preserveAspectRatio="xMidYMid meet"` combined with responsive wrappers to guarantee diagrams don't stretch or distort across different viewport widths.
- **Expanded Battery Health Gauge:** Custom semicircle SVG battery gauges with proper height dimensions (`viewBox="0 0 180 130"`) and visible overflow styling to prevent rendering clips of gauge needles and status text.
