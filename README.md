# Vendor Management System

[![Year Built](https://img.shields.io/badge/Year%20Built-2025-blue.svg)](#)


Enterprise procurement, contractor lifecycle tracking, and invoice reconciliation platform engineered with full-stack web architectures, automated verification routines, and contract auditing workflows.

```
+-----------------------------------------------------------------------------------------+
|                                   Management Portal                                     |
|                                                                                         |
|   +---------------------------------------------------------------------------------+   |
|   | Responsive Web Interface: Vendor Directory, Contracts, Invoices, Ratings        |   |
|   +----------------------------------------|----------------------------------------+   |
+--------------------------------------------|--------------------------------------------+
                                             |
                                             v
+-----------------------------------------------------------------------------------------+
|                                Application Business Logic                               |
|                                                                                         |
|   +--------------------+  +---------------------+  +--------------------------------+   |
|   | Vendor Lifecycle   |  | Contract Compliance |  | Invoice Reconciliation         |   |
|   | Onboarding, KYC,   |  | Service Level Agrmts|  | Purchase orders, approvals,    |   |
|   | performance scores |  | expiration alerts   |  | payment status tracking        |   |
|   +--------------------+  +---------------------+  +--------------------------------+   |
|                                            |                                            |
|                                            v                                            |
|   +---------------------------------------------------------------------------------+   |
|   | Automated Test Suite & Auditing Pipeline (test_*.py / test-cases)               |   |
|   +---------------------------------------------------------------------------------+   |
+-----------------------------------------------------------------------------------------+
```

## System Architecture

The platform addresses vendor qualification, contract management, and accounts payable validation for growing enterprises. By standardizing vendor profiles and monitoring contract terms, the system reduces procurement friction and prevents SLA lapses.

### Subsystem Capabilities

1. Vendor Onboarding and Directory: Centralized database tracking vendor registration credentials, tax identifiers, points of contact, and category classifications.

2. Contract and SLA Monitoring: Maintains contract documents, renewal windows, pricing tiers, and automated expiration warnings.

3. Purchase Orders and Invoicing: Reconciles incoming invoices against open purchase orders, recording approval states and payment histories.

4. Performance Scorecarding: Calculates dynamic vendor performance ratings based on delivery velocity, product quality, and pricing adherence.

## Local Installation

```bash
git clone https://github.com/mianjunaid1223/Vender-management-software.git
cd Vender-management-software
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate
pip install -r requirements.txt
python app.py
```
