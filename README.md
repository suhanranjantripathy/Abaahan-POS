# Abaahan POS 🚀

Abaahan POS is a modern, full-featured Point of Sale (POS) and Service Management system designed specifically for automotive service centers. Built with React, Vite, and Tailwind CSS, Abaahan POS streamlines the entire customer journey—from onboarding and vehicle inspection to billing and digital reporting.

## 🌟 Key Features

- **Customer KYC & 360° Profile:** Seamlessly register and look up customers, viewing their complete service history.
- **Vehicle Inspection & Diagnosis:** An intuitive interface for technicians to perform detailed visual inspections (tyres, battery health, and general conditions) with visual diagrams.
- **Intelligent Recommendations:** Automatically generates service recommendations based on inspection data (tread depth, pressure, condition).
- **Estimate Builder & POS Checkout:** Instantly convert recommendations into detailed cost estimates, process payments (UPI, Card, Cash), and generate invoices.
- **Real-Time Job Floor Tracker:** Track active jobs, manage service items, and mark jobs as completed on the floor.
- **Digital Reports Hub:** Maintain a history of detailed, printable, and shareable (via WhatsApp) digital inspection reports for every service session.
- **Analytics & Loyalty Programs:** Manage store performance, conversion funnels, and customer loyalty rewards directly from the manager's dashboard.

## 🛠️ Tech Stack

- **Frontend Framework:** React 18
- **Build Tool:** Vite
- **Styling:** Tailwind CSS (Custom theme tokens and modern UI)
- **Icons:** Lucide React
- **Animations:** Framer Motion
- **State Management:** React Context API (`AppProvider`)
- **Routing:** React Router DOM

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
2. **Dashboard:** Access common workflows like new customer registration, vehicle inspection, or the reports hub.
3. **KYC & Vehicle Details:** Register the customer and capture vehicle specifications.
4. **Inspection:** Technicians input tyre tread depths, battery health, and visual conditions.
5. **Recommendations:** The system suggests replacements or services based on safety thresholds.
6. **Checkout:** Apply discounts, confirm payment modes, and complete the service loop.
7. **Reporting:** A digital report is generated containing health gauges, diagrams, and historical data, which can be printed or shared with the customer.

## 🎨 UI/UX Highlights

- **Battery Health Gauge:** Custom SVGs with smooth geometry and gradients to visually indicate battery status.
- **Vehicle Bird-Eye Diagram:** Dynamic visual indicator showing the health status of individual tyres.
- **Premium Interface:** Carefully crafted aesthetic using modern typography, glassmorphism hints, and soft drop shadows for an enterprise-ready feel.
