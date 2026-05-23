# Abaahan POS — Roles & Responsibilities Scratchpad 📝

Use this scratchpad to capture, refine, and detail the specific workflows, permissions, and requirements for each user role in the Abaahan POS system.

---

## 🧑‍💼 1. Store Manager
*Overall owner of the shop floor, finances, and catalog settings.*

### Key Workflows:
- **Full Operational Lifecycle Management**: Can manage the entire customer journey, including customer onboarding, vehicle details entry, advisory estimates, checkout, and tracking job floor status.
- **Loyalty Program Management**: Configures reward rules (points accrual per ₹ spent, referral bonuses, and points redemption valuation) and views store-level customer retention performance.
- **Analytics & Revenue Review**: Monitors today's total store revenue, total inspections performed, conversion funnel details, and repeat customer ratios.
- **POS Checkout & Settlement**: Selects payment modes, triggers the Razorpay Checkout gateway overlay for cards/digital modes, handles cash collection, and issues invoices.

### Permissions & Views:
- Access to **all** pages and dashboard widgets:
  - `Dashboard` (with revenue/inspections counter widget)
  - `CustomerLookup` & `CustomerKYC`
  - `VehicleDetails` & `VehicleInspection`
  - `Recommendation` & `ServiceSelection`
  - `EstimateBuilder` & `BillingPOS` (Checkout)
  - `ReportsHub` & `DigitalReport`
  - `LoyaltyReports` (Exclusively available to Store Manager)

### Custom Rules/Logics:
- **Manager Approval / Bypass**: Has full visibility into financial KPIs.
- **Manual Checkout Overrides**: Can trigger billing checkout once a job is set to 'Completed'.

---

## 👩‍💻 2. POS Executive
*Front-desk user handling customer discovery, KYC registration, service estimation, and checkout.*

### Key Workflows:
- **Customer Lookup & Discovery**: Looks up returning customers by mobile number. Triggers session creation (`selectCustomer`) which automatically stamps the current date-time as the customer's `Last Visit` and displays past visit history.
- **Quick Registration (KYC)**: Captures basic details (Name, Email, Mobile, City, DOB) and associates vehicles (Make, Model, Year, Fuel Type, Odometer) for new customers.
- **Estimate Creation & Consent Gathering**: Itemizes the estimate based on recommended services and captures digital consent from the customer. Once consent is given, the job is automatically dispatched to the floor.
- **Checkout Payment Processing**: Once the technician completes the service, the POS screen unlocks. The executive collects payments using UPI, Card, NetBanking (via Razorpay Checkout SDK), or Cash, and generates the printable invoice.

### Permissions & Views:
- Access to customer registration and billing/estimation pages:
  - `Dashboard` (with revenue widget hidden for privacy)
  - `CustomerLookup` & `CustomerKYC`
  - `VehicleDetails`
  - `Recommendation` & `ServiceSelection`
  - `EstimateBuilder`
  - `BillingPOS` (Checkout)
- **Restricted Views**: Excluded from accessing `LoyaltyReports` (Reward program configurations) and `VehicleInspection` inputs.

### Custom Rules/Logics:
- **Consent-to-Floor Dispatch**: Digital consent MUST be toggled/approved by the customer to send the job to the floor.
- **Billing Lock**: The POS checkout block remains **strictly locked** (with a visual overlay) preventing payment processing until the technician marks the active job as "Completed" on the floor.

---

## 🔧 3. Technician
*Workshop floor operator performing vehicle inspections and executing active service jobs.*

### Key Workflows:
- **Visual & Diagnostic Vehicle Inspection**: Enters tread depth (mm), tyre pressure (PSI), tire brand/size, and selects visual condition (Good, Uneven Wear, Cracks/Cuts, Bulge) using the interactive Car Bird-Eye SVG. Records battery health status (Good, Weak, Replace) and monthly run averages.
- **Job Execution & Floor Tracker**: Manages active tasks via a Kanban-style Board (`JobTracker.jsx`). Claims jobs from the floor queue, transitions them to "In Bay", and marks them "Completed" when finished.
- **Digital Report Generation**: Reviews and prints the auto-generated Vehicle Health Report containing the diagnostic SVG diagrams and smart recommendations.

### Permissions & Views:
- Access to diagnostic and job control pages:
  - `Dashboard` (with revenue widgets hidden)
  - `CustomerLookup` (for verifying customer/vehicle profiles)
  - `VehicleInspection` (Diagnostic inputs)
  - `JobTracker` (Kanban Board floor control)
  - `ReportsHub` & `DigitalReport`
- **Restricted Views**: Excluded from editing service catalogs, pricing, estimates, performing billing/checkout settlements, or viewing shop financials.

### Custom Rules/Logics:
- **Interactive SVG Proportions**: Uses responsive aspect-ratio boundaries and symmetric tyre positions (perfect FL/FR, RL/RR spacing with matching gutters) for accurate, zero-distortion rendering across desktop/tablet inspection screens.
- **State Management & Completion**: Completing a job updates the central database state (`jobsDb`), automatically unlocking the POS Executive's billing dashboard for checkout.

---

## 💡 Notes & General Requirements
- **WhatsApp/SMS Reminders**: Triggered automatically upon checkout completion (auto-scheduling a 6-month reminder and sending a feedback link).
- **Session Persistence**: Sessions are saved in `localStorage` (`abhyaan_session`) and auto-expire after 24 hours.
