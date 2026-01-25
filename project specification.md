**Freight Bidding Marketplace - Project Specification**

**1\. Executive Summary**

This document outlines the specifications for a comprehensive freight bidding marketplace platform designed for Cameroon and neighboring countries. The platform connects shippers with carriers and drivers through a competitive bidding system, enabling efficient freight management, real-time tracking, and secure payment processing.

**2\. Project Objectives**

- Create a digital marketplace connecting shippers, carriers, brokers, and drivers
- Enable competitive bidding for freight services to optimize pricing
- Provide real-time shipment tracking and management capabilities
- Facilitate secure payment processing using local mobile payment systems
- Support multiple languages and currencies for regional accessibility
- Streamline freight operations through automation and digital documentation

**3\. Target Users**

**Primary Users**

- **Multi-Role Users**: Single users can have multiple active roles simultaneously
  - **Shippers**: Businesses and individuals needing freight transportation services
  - **Carriers/Transporters**: Companies owning and operating freight vehicles
  - **Drivers**: Individual operators assigned to complete shipments
  - **Brokers**: Intermediaries connecting shippers with carriers
  - Users can switch between roles seamlessly within the same account
  - Single login credentials (email/password) for all roles
  - Role-specific dashboards accessible from unified account

**Secondary Users**

- **Super Administrators**: Platform managers with full system oversight
- **Advertisers**: Businesses promoting services on the platform

**3.1 Multi-Role User Management**

**3.1.1 Role Activation**

- Users can activate multiple roles during or after registration
- Each role requires separate verification and documentation
- Role-specific profile information maintained separately
- Users can have active shipments in multiple roles simultaneously

**3.1.2 Role Switching**

- Quick role switcher in main navigation
- Context-aware interface adapts to selected role
- Seamless transition between role dashboards
- Notifications filtered by active role
- Transaction history separated by role

**3.1.3 Role-Specific Features**

- **As Shipper**: Access to booking, bidding, tracking features
- **As Carrier**: Access to fleet management, driver management, bid submission
- **As Driver**: Access to job assignments, navigation, earnings tracking
- **As Broker**: Access to both shipper and carrier features with commission tracking

**3.1.4 Financial Separation by Role**

- Separate wallet/earnings for each role
- Role-specific transaction history
- Clear attribution of payments and receipts
- Independent commission calculations per role
- Consolidated financial reporting available

**4\. Core System Modules**

**4.1 Shipper Module**

**4.1.1 Registration & Authentication**

- **Unified Account System**:
  - Single email and password for all roles
  - One account, multiple active roles
  - Select initial role during registration
  - Add additional roles anytime post-registration
- **Multi-Role Profile Setup**:
  - Role-specific verification requirements
  - Separate documentation per role
  - Independent profile information
- Multi-factor authentication support
- Profile management with company details (when acting as shipper/carrier)
- Document upload per role:
  - Shipper: Business registration, tax ID
  - Carrier: Business license, fleet documents
  - Driver: License, certifications
  - Broker: Broker license, insurance
- Email and SMS verification
- Role activation approval workflow

**4.1.2 Shipment Booking**

- Create shipment requests with:
  - Pickup and delivery locations with GPS coordinates
  - Shipment schedule (immediate or scheduled)
  - Load details (weight, dimensions, quantity)
  - Freight type and special handling requirements
  - Preferred truck/vehicle type
  - Insurance requirements
  - Loading/unloading requirements
- Save shipment templates for recurring loads
- Bulk shipment creation

**4.1.3 Bidding & Quote Management**

- Post shipment requests to marketplace
- Receive competitive bids from carriers and brokers in real-time
- **Real-Time Bidding Dashboard**: Live view of all incoming bids with auto-refresh
- **Bid Comparison Matrix**: Side-by-side real-time comparison of active bids
- Compare bids with detailed breakdowns
- Filter bids by price, rating, delivery time, carrier capacity
- **Watch Bids Live**: Monitor bidding activity with real-time updates and notifications
- **Instant Bid Acceptance**: Award bids immediately with one-click confirmation
- **Real-Time Negotiation**: Counter-offer functionality during active bidding
- Negotiate bid terms through messaging
- Award bids instantly from any device
- Set auto-accept criteria for bids
- **Bidding Analytics**: View real-time metrics on bid competitiveness and market rates
- **Bid Expiry Management**: Set custom bidding windows with automatic closure
- **Multiple Bidding Strategies**: Choose between open auction, sealed bid, or hybrid approaches
- **Bid Alerts Configuration**: Set up notifications for price thresholds and bid activity

**4.1.4 Shipment Management**

- View all shipments (ongoing, upcoming, past)
- Real-time shipment tracking on map
- Milestone tracking (loaded, in-transit, delivered)
- Estimated time of arrival (ETA) updates
- Digital proof of delivery (POD)
- Upload and view shipment documents
- Reschedule or cancel shipments with policies
- Request shipment modifications

**4.1.5 Communication & Notifications**

- Email notifications for bid updates, shipment status
- SMS alerts for critical updates
- Push notifications on mobile app
- In-app messaging with carriers and drivers
- Automated status updates

**4.1.6 Payment Management**

- Multiple payment options:
  - Orange Money
  - MTN Mobile Money (MoMo)
  - Credit/debit cards
  - Bank transfers
- **Payment to carriers through mobile payment aggregator with automatic deductions**
- **Platform does not hold or process payments directly**
- **All payments handled externally by mobile payment aggregator**
- Payment initiation and authorization through platform
- **Transparent payment breakdown showing**:
  - Total payment from shipper
  - Platform commission deducted
  - Aggregator fees deducted
  - Mobile money transaction fees deducted
  - Net amount paid to carrier
- Transaction history and receipts with itemized deductions
- Refund requests processed through mobile payment aggregator
- Payment status tracking and notifications

**4.1.7 Ratings & Reviews**

- Rate carriers and drivers after delivery
- Provide detailed feedback
- View carrier ratings and history before bidding
- Dispute resolution process

**4.1.8 Analytics & Reports**

- Shipment history reports
- Spending analytics
- Carrier performance comparison
- Cost savings reports
- Export reports in PDF/Excel formats

**4.1.9 Help & Support**

- In-app FAQ section
- Live chat support
- Support ticket system
- Video tutorials
- Help documentation

**4.2 Driver Module (Mobile-First Design)**

**4.2.1 Registration & Onboarding**

- Admin-managed registration process
- Profile setup with personal information
- Document upload:
  - Driver's license
  - National ID
  - Professional driver certification
  - Medical fitness certificate
- Background verification status

**4.2.2 Job Management**

- Receive shipment assignments
- Accept or reject requests in real-time
- View complete shipment details:
  - Pickup and delivery locations
  - Freight weight and type
  - Special handling instructions
  - Contact information
  - Payment details
- Request history (past, ongoing, upcoming)

**4.2.3 Availability Management**

- Toggle availability status (online/offline)
- Set working hours and preferences
- Indicate vehicle readiness
- Request time off through the app

**4.2.4 Navigation & Tracking**

- Built-in GPS navigation to pickup/delivery locations
- Turn-by-turn directions
- Traffic updates and alternate routes
- Real-time location sharing with shipper
- Geofencing for automatic status updates

**4.2.5 Document Management**

- Upload gate passes
- Capture delivery confirmation signatures
- Upload images:
  - Loaded freight
  - Delivery proof
  - Toll receipts
  - Damage reports
- Digital bill of lading

**4.2.6 Expense Tracking**

- Upload toll bills
- Record fuel expenses
- Log maintenance costs
- Submit expense claims

**4.2.7 Earnings Management**

- View current trip fare
- Track daily, weekly, monthly earnings
- Payment history
- Automated fare calculation
- Incentive and bonus tracking

**4.2.8 Emergency Features**

- SOS alert button
- Emergency contact notification
- Report delays or incidents
- Vehicle breakdown reporting
- Safety check-in prompts

**4.2.9 Communication**

- In-app messaging with carrier and shipper
- Call functionality with masked numbers
- Push notifications for assignments
- Status update notifications

**4.2.10 Dashboard**

- Upcoming jobs overview
- Earnings summary
- Performance metrics
- Ratings and reviews received

**4.3 Carrier/Transporter Module**

**4.3.1 Registration & Profile**

- Company registration with documentation
- Business license and permits
- Tax registration documents
- Insurance certificates
- Fleet overview and capacity

**4.3.2 Fleet Management**

- Add and update truck information:
  - Vehicle type and specifications
  - Registration and license details
  - Insurance information
  - Load capacity
  - GPS device integration
- Track vehicle locations in real-time
- Maintenance scheduling and reminders
- Vehicle usage reports
- Fuel consumption tracking
- Vehicle assignment to drivers

**4.3.3 Driver Management**

- Add and manage driver profiles
- View driver activity and performance
- Assign drivers to vehicles and shipments
- Track driver availability
- Manage driver payments and settlements
- Driver performance analytics
- Disciplinary action tracking

**4.3.4 Bidding & Load Management**

- View available load postings in real-time
- **Real-Time Bidding Interface**: Live bid submission with instant feedback
- Submit competitive bids with pricing breakdown
- **Auto-Bid Proxy System**: Set maximum bid prices and let system bid automatically
- **Live Bid Monitoring**: Track own bids and competitor activity in real-time
- **Instant Outbid Alerts**: Receive immediate notifications when outbid
- **Quick Rebid Functionality**: Rapid bid adjustment with one-click rebidding
- Auto-bid functionality based on preset rules
- Track bid status (pending, accepted, rejected, outbid)
- **Real-Time Bid Rankings**: See current standing among all bidders
- Win rate analytics
- **Bid History Timeline**: View complete bidding history with timestamps
- Load matching based on:
  - Route optimization
  - Vehicle availability
  - Current location
  - Capacity
- **Strategic Bidding Tools**:
  - Market price indicators
  - Historical winning bid data
  - Profitability calculators
  - Bid success probability scores
- **Batch Bid Management**: Submit bids on multiple loads simultaneously
- **Bid Templates**: Save and reuse bidding strategies for common routes
- **Time-Sensitive Bidding**: Flash bid alerts for urgent loads with expiring auctions

**4.3.5 Find Loads Feature**

- Post available trucks to load board
- Set up load alerts for specific routes
- Search load marketplace by:
  - Route
  - Freight type
  - Date range
  - Price range
- Saved search preferences

**4.3.6 Shipment Operations**

- Route shipments to available drivers
- Monitor ongoing shipments
- Real-time fleet tracking map
- Manage shipment schedules
- Handle shipment issues and escalations

**4.3.7 Financial Management**

- Revenue tracking and analytics
- **Automated Payment Receipt with Deductions**:
  - View payment breakdown for each shipment
  - Gross amount from shipper
  - Platform commission auto-deducted
  - Aggregator fees auto-deducted
  - Mobile money fees auto-deducted
  - Net amount received
  - Downloadable itemized receipts/invoices
- **Real-Time Payment Notifications**:
  - Payment received alerts
  - Detailed breakdown of all deductions
  - Net deposit confirmation
- **Financial Dashboard**:
  - Total earnings (gross)
  - Total platform commissions paid
  - Total aggregator fees paid
  - Total mobile money fees paid
  - Net earnings received
  - Payment history with full breakdowns
- **Fee Transparency Tools**:
  - Pre-bid fee calculator showing estimated deductions
  - Historical fee analysis
  - Commission rate display
  - Fee comparison across different payment methods
- Driver payment processing
- Expense management
- Financial reports (P&L, cash flow)
- **Comprehensive Fee Reports**: Track all automatic deductions by category and time period

**4.3.8 Analytics & Reporting**

- Business performance dashboards
- Key performance indicators (KPIs):
  - Revenue trends
  - Utilization rates
  - On-time delivery percentage
  - Customer satisfaction scores
- Driver performance reports
- Vehicle utilization reports
- Route profitability analysis
- Predictive analytics for demand forecasting

**4.3.9 Settings & Configuration**

- Supported freight types
- Service regions and routes
- Pricing rules and rate cards
- Tax configuration
- Bid automation rules
- Notification preferences

**4.4 Broker Module**

**4.4.1 Core Functions**

- Access to both shipper and carrier features
- Mediate between shippers and carriers
- Commission-based earnings tracking
- Relationship management tools
- Performance analytics

**4.4.2 Network Management**

- Maintain shipper network
- Maintain carrier network
- Partner ratings and preferences
- Communication hub

**4.5 Admin Panel**

**4.5.1 Dashboard**

- Real-time platform statistics
- Active shipments overview
- Revenue metrics
- User activity analytics
- System health monitoring
- Customizable widgets

**4.5.2 User Management**

- Manage shippers, carriers, drivers, brokers
- User verification and approval process
- Document verification
- Account suspension and deactivation
- Role-based access control
- Bulk user operations

**4.5.3 Service Configuration**

- Vehicle types and specifications
- Freight categories
- Supported routes and regions
- Distance calculation settings
- Service areas with geofencing

**4.5.4 Pricing & Commission**

- Platform commission rates
- Dynamic pricing rules
- Surge pricing configuration
- Discount and promotion management
- Tax rate configuration by region
- Currency exchange rates

**4.5.5 Payment Management**

- **Mobile Payment Aggregator Integration**:
  - Configure automatic deduction rules
  - Set platform commission percentages
  - Monitor aggregator fee rates
  - Track mobile money transaction fees
  - Real-time payment processing status
  - Automated settlement to platform account for commissions
- **Payment Flow Monitoring**:
  - Track shipper payments
  - Monitor automatic deductions
  - Verify carrier net payments
  - Payment reconciliation reports
- **Deduction Configuration**:
  - Set platform commission rates (flat or tiered)
  - View and adjust aggregator fees (if applicable)
  - Configure mobile money fee structures
  - Set minimum/maximum deduction thresholds
- Process refund requests through mobile payment aggregator
- Handle payment disputes coordination
- Monitor transaction success rates
- Payment gateway configuration
- **Comprehensive Settlement Reports**:
  - Total platform commission collected
  - Total aggregator fees
  - Total mobile money fees
  - Net carrier payments
  - Payment breakdown by transaction
- **Revenue Analytics**:
  - Platform commission revenue
  - Commission by carrier, route, time period
  - Average commission per transaction
  - Fee revenue forecasting

**4.5.6 Service Configuration**

- Vehicle types and specifications
- Freight categories
- Supported routes and regions
- Distance calculation settings
- Service areas with geofencing

**4.5.7 Pricing & Commission**

- Platform commission rates
- Dynamic pricing rules
- Surge pricing configuration
- Discount and promotion management
- Tax rate configuration by region
- Currency exchange rates

**4.5.8 Advertisement Management**

- Ad placement zones configuration
- Approve user-submitted ads
- Configure ad pricing tiers
- Set ad duration limits
- Ad performance analytics
- Ad content moderation

**4.5.9 Content Management**

- FAQ management
- Help documentation
- Terms and conditions
- Privacy policy
- Email/SMS templates
- Multi-language content management

**4.5.8 Dispute Resolution**

- View and manage disputes
- Communication history
- Evidence review
- Decision tracking
- Escalation workflow

**4.5.10 Reporting & Analytics**

- Platform-wide analytics
- Financial reports
- User behavior analytics
- Market trends analysis
- **Real-Time Bidding Analytics**:
  - Live bidding activity monitoring
  - Average time-to-award metrics
  - Bid competition intensity by route/time
  - Real-time platform utilization rates
  - Live revenue tracking
- Export functionality
- Scheduled automated reports

**4.5.11 System Configuration**

- Platform settings
- Security settings
- Integration management
- Backup and recovery
- Audit logs
- System maintenance mode

**5\. Technical Requirements**

**5.1 Technology Stack**

- **Frontend**: React.js
- **Backend**: Supabase (PostgreSQL database, authentication, real-time subscriptions, storage)
- **Real-Time Communication**: Supabase Realtime for live bidding updates, WebSockets for instant notifications
- **Mobile Apps**: React Native or Progressive Web App (PWA)
- **Payment Integration**: Mobile payment aggregator supporting Orange Money and MTN MoMo

**5.2 Responsive Design**

- Desktop-optimized interface for admin, carrier, and shipper modules
- Tablet compatibility for all modules
- Mobile-first design for driver module
- Progressive Web App capabilities for offline functionality

**5.3 Multi-Language Support**

- Bilingual support (French and English minimum)
- Easy addition of more languages
- Language selection in user preferences
- Automatic detection based on location
- **Language preference persists across all roles**

**5.4 Multi-Currency Support**

- Support for multiple world currencies
- XAF (Central African CFA franc) as primary currency
- Real-time exchange rate updates
- Currency conversion display

**5.5 Security Requirements**

- End-to-end encryption for sensitive data
- Secure authentication with JWT tokens
- **Role-based access control (RBAC) with multi-role support**
- **Single sign-on (SSO) across all roles**
- Two-factor authentication option
- Secure payment processing (PCI DSS compliance)
- Data backup and disaster recovery
- Regular security audits
- GDPR and local data protection compliance
- **Session management for role switching**
- **Audit logging for role-based actions**

**5.6 Performance Requirements**

- Page load time under 3 seconds
- Support for 10,000+ concurrent users
- **Real-time bid updates with latency under 500ms**
- **Support for 100+ simultaneous active auctions**
- 99.9% uptime SLA
- Real-time updates with minimal latency
- Efficient database query optimization
- CDN integration for static assets
- **WebSocket connection stability for continuous bidding sessions**

**5.7 Integration Requirements**

- SMS gateway integration
- Email service integration
- **Mobile payment aggregator with automatic deduction capabilities**:
  - API for payment initiation
  - Webhook for payment confirmations
  - Automated split payment functionality (shipper → platform commission + carrier net amount)
  - Real-time deduction calculation and execution
  - Settlement reporting APIs
  - Refund processing APIs
  - Transaction status tracking
- GPS and mapping services (Google Maps or Mapbox)
- Push notification services
- SMS and email template services
- Analytics tools (Google Analytics, Mixpanel)

**6\. Key Functional Features**

**6.1 Real-Time Tracking**

- GPS-based location tracking
- Live map view with shipment markers
- Route visualization
- ETA calculations
- Geofence alerts
- Historical route playback

**6.2 Bidding System**

- Open bidding marketplace
- Reverse auction functionality
- Sealed bid option
- Auto-award based on criteria
- Bid expiration timers
- Bid history and analytics
- Real-time bidding (RTB) functionality

**6.2.1 Real-Time Bidding Features**

- **Live Bidding Interface**: Dynamic bid board showing all active bids updating in real-time
- **Instant Bid Notifications**: Carriers and shippers receive immediate notifications when new bids are placed or when they are outbid
- **Countdown Timers**: Visual countdown showing time remaining for bid submission with configurable durations (5 min, 15 min, 30 min, 1 hour, custom)
- **Bid Increments**: Configurable minimum bid increment rules to prevent minimal undercutting
- **Auto-Bid Proxy**: Carriers can set maximum bid amounts and the system automatically bids on their behalf up to that limit
- **Live Bid Rankings**: Real-time leaderboard showing current bid standings with carrier ratings and estimated delivery times
- **Flash Bids**: Quick-close bidding for urgent shipments with 5-15 minute bidding windows
- **Bid Retraction Rules**: Time-limited ability to retract or modify bids with penalties for abuse
- **Snipe Protection**: Automatic time extension if bids are placed in final seconds to prevent last-second sniping
- **Real-Time Price Discovery**: Live market price indicators showing current bid ranges for similar routes
- **Bid Activity Feed**: Live stream of bidding activity including new bids, retractions, and awards
- **Multi-Device Synchronization**: Real-time updates across all devices (desktop, tablet, mobile) simultaneously
- **Bid Alerts**: Customizable alerts for bid thresholds, outbid notifications, and closing auctions
- **Live Chat During Bidding**: Shippers can clarify requirements while bidding is active
- **Bid History Visualization**: Real-time graphs showing bid progression and competitive dynamics
- **Reserve Price Option**: Shippers can set minimum acceptable prices that are revealed or hidden
- **Buy-It-Now Option**: Shippers can set instant acceptance prices to skip bidding process
- **Batch Bidding**: Carriers can place bids on multiple loads simultaneously
- **Bid Validity Periods**: Automatic bid expiration with countdown warnings
- **Fair Allocation Algorithm**: When multiple identical bids exist, system uses criteria like carrier rating, proximity, or random selection

**6.3 Notification System**

- Multi-channel notifications (email, SMS, push)
- Customizable notification preferences
- Critical alert prioritization
- Notification history
- Opt-in/opt-out management
- **Payment notifications with deduction details**:
  - Payment received alerts
  - Itemized breakdown notifications
  - Commission deduction confirmations
  - Net amount deposit alerts

**6.4 Document Management**

- Digital document storage
- Document versioning
- OCR for document scanning
- Document expiration alerts
- Secure document sharing
- Download and print capabilities

**6.5 Rating & Review System**

- 5-star rating system
- Written review capability
- Rating breakdown by category (timeliness, communication, condition)
- Response to reviews
- Rating verification to prevent fraud
- Impact on user visibility and ranking

**6.6 Search & Filter**

- Advanced search functionality
- Multiple filter criteria
- Saved searches
- Search history
- Auto-suggest and autocomplete

**6.7 Advertisement System**

- Ad placement in strategic locations:
  - Dashboard banners
  - Sidebar ads
  - Search results sponsored listings
  - Email newsletter ads
- User-submitted ads with approval workflow
- Admin-managed ad campaigns
- Ad pricing tiers:
  - Duration-based pricing
  - Impression-based pricing
  - Click-based pricing
- Ad performance tracking
- Geographic targeting
- User segment targeting

**7\. Additional Features & Enhancements**

**7.1 Advanced Real-Time Bidding Features**

**7.1.1 Dynamic Pricing Engine**

- Real-time market price calculation based on supply and demand
- Surge pricing for high-demand routes or time periods
- Seasonal pricing adjustments
- Fuel price indexing for automatic rate adjustments

**7.1.2 Intelligent Auction Types**

- **Standard Auction**: Open bidding with visible bids and countdown timer
- **Sealed Bid Auction**: Bids hidden until auction closes, then best bid wins
- **Dutch Auction**: Price starts high and decreases until carrier accepts
- **Reverse Dutch Auction**: Price starts low and increases until shipper accepts
- **Vickrey Auction**: Winner pays second-highest bid price
- **Multi-Round Bidding**: Progressive rounds narrowing down to final bidders

**7.1.3 Smart Bid Recommendations**

- AI-powered suggested bid prices based on historical data
- Win probability calculator showing chances at different price points
- Competitor behavior analysis and predictions
- Optimal bidding time recommendations

**7.1.4 Real-Time Market Intelligence**

- Live supply/demand dashboard by route
- Competitor activity heatmaps
- Price trend visualizations
- Capacity availability indicators
- Peak time alerts

**7.1.5 Bid Automation Rules**

- Conditional auto-bidding based on multiple parameters
- Time-of-day bidding strategies
- Route-specific bidding rules
- Competitor-triggered bid adjustments
- Budget-constrained automatic bidding

**7.1.6 Fairness & Anti-Manipulation**

- Bid pattern anomaly detection
- Shill bidding prevention algorithms
- Bid ring detection
- Rate limiting on bid frequency
- Suspicious activity flagging and review

**7.1.7 Real-Time Collaboration**

- Shipper-carrier live negotiation chat during bidding
- Bid clarification Q&A in real-time
- Terms modification during active auction
- Multi-party conferencing for complex loads

**7.2 Route Optimization**

- Intelligent route planning for multi-stop deliveries
- Load consolidation suggestions
- Return load matching
- Fuel-efficient routing

**7.2 Insurance Integration**

- Built-in insurance options
- Claims processing
- Coverage verification
- Premium calculation

**7.3 Load Sharing**

- Partial load booking
- Consolidated shipments
- LTL (Less Than Truckload) management

**7.4 Contract Management**

- Long-term contract setup
- Recurring shipment automation
- Contract renewal reminders
- SLA monitoring

**7.5 Weather Integration**

- Weather alerts affecting routes
- Delay predictions
- Alternative route suggestions

**7.6 Compliance Management**

- Regulatory compliance tracking
- Document expiration monitoring
- Permit requirements by region
- Automated compliance reporting

**7.7 Loyalty Program**

- Rewards for frequent users
- Tiered membership levels
- Referral bonuses
- Cashback and discounts

**7.8 API Access**

- RESTful API for third-party integrations
- Webhook support
- API documentation
- Rate limiting and authentication

**7.9 Carbon Footprint Tracking**

- Emissions calculation per shipment
- Sustainability reporting
- Green routing options

**7.10 Intelligent Matching**

- AI-powered load-to-carrier matching
- Predictive pricing recommendations
- Demand forecasting

**8\. Platform Monetization Model**

**8.1 Revenue Streams**

**8.1.1 Commission-Based Revenue (Primary)**

- **Carrier Commission on Awarded Bids**: Platform charges carriers a percentage of the total bid amount when they win a shipment
- Commission charged only on successful, completed shipments
- Transparent commission structure displayed before bid submission
- Commission invoiced immediately upon bid award
- Payment due within specified period (e.g., 7-30 days)

**8.1.2 Transaction Fees**

- **Withdrawal Fees**: Charged when carriers transfer earnings from the platform
- **Mobile Payment Transaction Fees**: Passed through to carriers for payment processing costs
- All fees clearly displayed in fee schedule

**8.1.3 Secondary Revenue Streams**

- Advertisement revenue from sponsored listings and banner ads
- Premium carrier subscriptions for enhanced features (optional)
- Featured listing fees for priority placement
- API access fees for enterprise integrations

**8.2 Fee Structure**

**8.2.1 Platform Commission Model**

- **Standard Commission Rate**: X% of total bid amount (configurable, e.g., 5-15%)
- **Tiered Commission Structure** (volume-based discounts):
  - Tier 1: 0-10 shipments/month - Standard rate
  - Tier 2: 11-50 shipments/month - Reduced rate (e.g., -1%)
  - Tier 3: 51-100 shipments/month - Further reduced rate (e.g., -2%)
  - Tier 4: 100+ shipments/month - Premium rate (e.g., -3%)
- Commission calculated on gross bid amount
- **Commission automatically deducted by mobile payment aggregator**
- Minimum commission amount (e.g., minimum \$5 per transaction)

**8.2.2 Additional Fees (Auto-Deducted)**

- **Mobile Payment Aggregator Fees**: Service charges for payment processing (e.g., 1-2% per transaction)
- **Mobile Money Transaction Fees**: Operator charges (Orange Money, MTN MoMo) typically 1-3% depending on amount
- **All fees automatically deducted before payment to carrier**

**8.2.3 Fee Transparency**

- All fees displayed prominently during bid submission
- Pre-bid fee calculator showing:
  - Bid amount (gross)
  - Platform commission (- X%)
  - Aggregator fees (- Y%)
  - Mobile money fees (- Z%)
  - Net amount carrier will receive
- Itemized invoice after each transaction
- No hidden charges
- Fee schedule accessible in carrier dashboard

**8.3 Payment Flow Architecture**

**8.3.1 Shipper-to-Carrier Payment Flow (with Automatic Deductions)**

- Shipper awards bid to carrier
- Shipper makes payment through mobile payment aggregator
- **Mobile payment aggregator receives full payment amount**
- **Aggregator automatically deducts in sequence**:
  - Platform commission (e.g., 10% of bid amount)
  - Aggregator service fee (e.g., 1.5% of bid amount)
  - Mobile money operator fee (e.g., 2% of bid amount)
- **Aggregator transfers net amount to carrier's mobile money account**
- **Aggregator transfers platform commission to platform's account**
- **Platform receives detailed transaction report with breakdown**:
  - Transaction ID
  - Shipper payment amount
  - Platform commission deducted
  - Aggregator fee deducted
  - Mobile money fee deducted
  - Net amount paid to carrier
  - Timestamps for all transactions
- Carrier receives payment notification with itemized breakdown
- Shipper receives payment confirmation
- Platform updates shipment status to "paid"

**Example Transaction Flow**:

- Bid Amount: \$1,000
- Platform Commission (10%): -\$100
- Aggregator Fee (1.5%): -\$15
- Mobile Money Fee (2%): -\$20
- **Net to Carrier: \$865**

**8.3.2 Invoice Generation**

- Upon successful payment, system generates itemized invoice
- Invoice includes:
  - **Shipment details** (ID, route, date)
  - **Gross amount from shipper**: \$1,000
  - **Deductions**:
    - Platform commission (10%): -\$100
    - Aggregator fee (1.5%): -\$15
    - Mobile money fee (2%): -\$20
    - **Total deductions**: -\$135
  - **Net amount received**: \$865
  - Transaction IDs and timestamps
  - Payment method details
- Invoice available for download (PDF format)
- Invoice sent via email to carrier
- Invoice stored in platform for record-keeping

**8.3.3 Refund Flow (with Commission Reversal)**

**Full Refund Process (100%)**:

- Shipper initiates refund request through platform
- Super Admin reviews dispute with evidence
- Admin determines full refund is warranted
- **System calculates full refund deductions**:
  - Original payment amount: \$1,000
  - Refund to shipper: \$1,000 - aggregator fee (\$15) - mobile money fee (\$20) = **\$965**
  - Platform returns commission to calculation: \$100 (returned to shipper in refund)
  - Aggregator and mobile money fees: **Non-refundable**
- **Aggregator processes refund**:
  - Debits carrier account: \$865 (net amount they received)
  - Platform returns: \$100 (commission)
  - Total refund pool: \$965
  - Credits shipper account: \$965
  - Aggregator/MM fees (\$35) retained as processing costs
- **System generates detailed refund invoice**:
- FULL REFUND INVOICEDispute ID: DSP-2026-0123Original Transaction: TXN-2026-0001Refund Date: January 22, 2026ORIGINAL PAYMENT BREAKDOWN:Shipper Payment: \$1,000.00Platform Commission (10%): -\$100.00Aggregator Fee (1.5%): -\$15.00Mobile Money Fee (2%): -\$20.00Net to Carrier: \$865.00FULL REFUND CALCULATION:Refund Base (100%): \$1,000.00Platform Commission Returned: +\$100.00Aggregator Fee (non-refundable): -\$15.00Mobile Money Fee (non-refundable): -\$20.00----------------------------------------REFUND TO SHIPPER: \$965.00FROM CARRIER ACCOUNT: -\$865.00FROM PLATFORM: -\$100.00PROCESSING FEES RETAINED: \$35.00Refund Method: MTN Mobile MoneyShipper Account: +237-XXX-XXX-XXXStatus: Completed
- All parties receive refund notification
- Shipment status updated to "Refunded - Full"

**Partial Refund Process (e.g., 30% for Late Delivery)**:

- Shipper initiates dispute for late delivery
- Super Admin reviews evidence and delivery timestamps
- Admin determines 30% partial refund based on delay criteria
- **System calculates partial refund with proportional deductions**:
  - Original payment: \$1,000
  - Refund percentage: 30%
  - Refund base amount: \$300
  - Platform commission on refund (10% of \$300): \$30
  - Aggregator fee on refund (1.5% of \$300): \$4.50
  - Mobile money fee on refund (2% of \$300): \$6.00
  - Net refund to shipper: \$300 - \$30 - \$4.50 - \$6.00 = **\$259.50**
- **Aggregator processes partial refund**:
  - Debits carrier account: \$259.50
  - Platform returns partial commission: \$30
  - Total refund to shipper: \$259.50
  - Carrier retains: \$865 - \$259.50 = \$605.50
  - Platform retains: \$100 - \$30 = \$70 commission
  - Processing fees: \$10.50 (retained)
- **System generates detailed partial refund invoice**:
- PARTIAL REFUND INVOICEDispute ID: DSP-2026-0124Dispute Type: Late DeliveryOriginal Transaction: TXN-2026-0002Refund Date: January 22, 2026ORIGINAL PAYMENT BREAKDOWN:Shipper Payment: \$1,000.00Platform Commission (10%): -\$100.00Aggregator Fee (1.5%): -\$15.00Mobile Money Fee (2%): -\$20.00Net to Carrier: \$865.00PARTIAL REFUND CALCULATION:Refund Percentage: 30%Refund Base Amount: \$300.00DEDUCTIONS FROM REFUND:Platform Commission (10%): -\$30.00Aggregator Fee (1.5%): -\$4.50Mobile Money Fee (2%): -\$6.00----------------------------------------NET REFUND TO SHIPPER: \$259.50SETTLEMENT BREAKDOWN:From Carrier Account: -\$259.50Carrier Retains: \$605.50Platform Commission Adjustment: Original Commission: \$100.00 Refunded to Shipper: -\$30.00 Platform Retains: \$70.00Processing Fees Retained: \$10.50Refund Method: MTN Mobile MoneyShipper Account: +237-XXX-XXX-XXXStatus: Completed
- All parties notified with clear breakdown
- Shipment status updated to "Refunded - Partial (30%)"

**Refund Failure Handling**:

- Insufficient carrier balance alerts
- Manual intervention workflow
- Payment plan options for carriers
- Dispute escalation for non-compliance

**8.4 Commission Payment Management**

**8.4.1 Automatic Deduction System**

- **No manual payment required from carriers**
- Commission automatically deducted by aggregator at point of payment
- Real-time commission transfer to platform account
- Instant settlement with no delays
- No payment enforcement or collection needed
- No overdue accounts or payment reminders

**8.4.2 Payment Tracking & Reconciliation**

- Automatic reconciliation of all deductions
- Real-time commission tracking
- Aggregator provides detailed transaction reports
- Daily/weekly/monthly settlement summaries
- Automated matching of payments to shipments
- Discrepancy detection and alerts

**8.4.3 Fee Verification**

- Cross-verification of deducted amounts
- Audit trail for all transactions
- Dispute resolution for incorrect deductions
- Adjustment processing for errors
- Re-calculation and correction workflows

**8.5 Financial Reporting for Carriers**

**8.5.1 Earnings Dashboard**

- **Gross Earnings**: Total amount from all awarded bids
- **Total Deductions Breakdown**:
  - Platform commission deducted: \$X
  - Aggregator fees deducted: \$Y
  - Mobile money fees deducted: \$Z
  - Total deductions: \$(X+Y+Z)
- **Net Earnings**: Actual amount received in mobile money account
- **Transaction-by-Transaction View**:
  - Each shipment with itemized deductions
  - Visual charts showing deduction categories
  - Percentage breakdown of each fee type
- **Period Comparisons**: Daily, weekly, monthly, yearly earnings and deductions

**8.5.2 Invoice Management**

- **Automated Itemized Invoices** generated for every payment
- **Invoice Details Include**:
- PAYMENT INVOICETransaction ID: TXN-2026-0001Date: January 21, 2026Shipment ID: SHP-12345PAYMENT BREAKDOWN:Shipper Payment (Gross) \$1,000.00DEDUCTIONS:- Platform Commission (10%) -\$100.00- Aggregator Service Fee (1.5%) -\$15.00- MTN MoMo Transaction Fee (2%) -\$20.00----------------------------------------Total Deductions -\$135.00NET AMOUNT RECEIVED \$865.00Payment Method: MTN Mobile MoneyCarrier Account: +237-XXX-XXX-XXXPayment Status: CompletedPayment Date: January 21, 2026, 14:35 CAT
- Download invoices in PDF format
- Email delivery of invoices
- Bulk invoice download for accounting
- Export to Excel/CSV for bookkeeping
- Tax-compliant invoice formatting

**8.5.3 Fee Analytics**

- Historical fee trends over time
- Average deduction percentages
- Comparison across different payment methods
- Fee optimization suggestions
- Commission tier progress tracking

**8.6 Admin Financial Controls**

**8.6.1 Aggregator Integration Management**

- Configure aggregator API credentials
- Set automatic deduction rules and percentages
- Define commission calculation methods
- Monitor aggregator system health and uptime
- Handle aggregator webhook notifications
- Test payment flows in sandbox environment

**8.6.2 Commission Management**

- Set global commission rates
- Configure tiered commission structures based on volume
- Create carrier-specific commission rates (for partnerships)
- Seasonal commission adjustments
- Promotional commission reductions
- Real-time commission rate updates

**8.6.3 Fee Configuration**

- View aggregator fee schedules
- Monitor mobile money operator fees
- Set minimum and maximum commission thresholds
- Configure fee rounding rules
- Currency-specific fee structures
- Fee calculation formula management

**8.6.4 Revenue Analytics & Reporting**

- **Real-Time Revenue Dashboard**:
  - Total commission collected (today, week, month, year)
  - Total aggregator fees
  - Total mobile money fees
  - Net platform revenue after aggregator fees
- **Detailed Transaction Reports**:
  - Commission by carrier, route, time period
  - Average commission per transaction
  - Commission collection success rate
  - Fee breakdown by category
- **Settlement Reports from Aggregator**:
  - Daily settlement summaries
  - Transaction-level details
  - Discrepancy reports
  - Reconciliation status
- **Financial Forecasting**:
  - Projected revenue based on active bids
  - Historical trend analysis
  - Seasonal patterns
  - Growth metrics

**8.6.5 Payment Reconciliation Tools**

- Automated matching of aggregator settlements to platform records
- Discrepancy detection and alerting
- Manual reconciliation interface for mismatches
- Adjustment approval workflow
- Audit log of all reconciliation activities

**8.6.6 Payment Dispute Resolution**

- Centralized dispute management system
- Review transaction details and deduction breakdowns
- Communication hub with aggregator
- Refund coordination workflow
- Decision tracking and appeals process
- Evidence collection and documentation

**8.7 Compliance & Tax Management**

**8.7.1 Tax Documentation**

- Automated tax invoice generation with itemized deductions
- VAT/Sales tax calculation on platform commission
- Tax compliance for multiple jurisdictions
- Year-end tax statements for carriers showing:
  - Total gross earnings
  - Total platform commission paid
  - Total fees paid
  - Net earnings
- Tax ID collection and verification
- Withholding tax management (if applicable)

**8.7.2 Financial Regulations**

- Compliance with local financial regulations
- Anti-money laundering (AML) checks
- Know Your Customer (KYC) verification
- Transaction monitoring and reporting
- Audit trail maintenance for all deductions
- Financial reporting to regulatory authorities

**8.7.3 Aggregator Compliance**

- Aggregator license verification
- Regulatory approval documentation
- Service level agreements (SLAs)
- Data security and privacy compliance
- Settlement guarantee mechanisms
- Dispute resolution procedures

**8.8 Carrier Benefits of Commission Model**

**8.8.1 No Upfront Costs or Manual Payments**

- Free registration and onboarding
- No subscription fees to access loads
- No manual commission payments required
- Pay only when earning (success-based model)
- Automatic deduction eliminates payment hassles
- No risk of forgetting or late payments
- No payment processing on carrier's part

**8.8.2 Complete Transparency**

- Commission clearly displayed before bidding
- **Pre-bid calculator shows exact net earnings**:
  - Enter bid amount → See net amount after all deductions
  - Real-time fee calculation
  - No surprises or hidden fees
- **Itemized invoice for every transaction**:
  - Clear breakdown of all deductions
  - Easy accounting and bookkeeping
  - Professional documentation
- Predictable cost structure
- Volume discounts for active carriers

**8.8.3 Immediate Payment**

- No waiting period for commission settlement
- Funds received automatically after deductions
- Same-day payment to mobile money account
- No withdrawal requests needed
- No minimum balance requirements

**8.8.4 Simplified Accounting**

- All transactions documented with itemized invoices
- Easy tax preparation with annual summaries
- Export capabilities for accounting software
- Clear audit trail
- Professional financial records

**8.1.1 Design Principles**

- Intuitive and user-friendly interface
- Minimal clicks to complete actions
- Clear visual hierarchy
- Consistent design language across platforms
- Accessibility compliance (WCAG 2.1)

**8.2 Onboarding**

- Step-by-step guided registration
- Interactive tutorials
- Tooltips for first-time users
- Sample data for exploration

**8.3 Help & Support**

- Context-sensitive help
- Video tutorials
- Live chat support during business hours
- Knowledge base
- Community forum

**10\. Testing Requirements**

**10.1 Testing Types**

- Unit testing
- Integration testing
- User acceptance testing (UAT)
- Performance testing
- Security testing
- Mobile device testing
- Cross-browser testing
- Load testing
- **Payment flow testing with mobile payment aggregator sandbox**
- **Commission calculation and invoicing testing**

**10.2 Quality Assurance**

- Automated testing where possible
- Continuous integration/continuous deployment (CI/CD)
- Bug tracking and resolution workflow
- Regression testing

**11\. Deployment & Maintenance**

**11.1 Deployment**

- Staging environment for testing
- Production environment
- Phased rollout strategy
- Rollback procedures

**11.2 Maintenance**

- Regular updates and patches
- Database optimization
- Performance monitoring
- User feedback collection and implementation
- Feature enhancement roadmap

**12\. Success Metrics**

**12.1 Key Performance Indicators**

- Number of registered users (total unique accounts)
- **Number of active roles** (total role activations across all users)
- **Multi-role users count and percentage**
- Number of shipments completed
- Platform transaction volume
- **Total commission revenue**
- **Commission collection rate (percentage paid on time)**
- **Average commission per transaction**
- Average bid response time
- On-time delivery rate
- User satisfaction scores
- User retention rate
- Revenue growth
- Average shipment value
- Platform utilization rate
- **Payment success rate through mobile aggregator**
- **Dispute rate and resolution time**
- **Refund rate (full and partial)**
- **User suspension/ban rate**
- **System uptime and performance**

**12.2 Monitoring**

- Real-time analytics dashboards
- Automated alerts for anomalies
- Regular performance reports
- User behavior analysis

**13\. Compliance & Legal**

**13.1 Regulatory Compliance**

- Local transportation regulations
- Data protection laws (GDPR compliance)
- Financial regulations for payment processing
- **Commission-based service provider regulations**
- **Mobile money operator compliance**
- Tax compliance
- Labor laws for driver classification

**13.2 Terms & Policies**

- Terms of service
- Privacy policy
- Cookie policy
- **Refund and cancellation policy** (with full and partial refund criteria)
- **Dispute resolution policy** (including refund calculation methodology)
- Acceptable use policy
- **Commission and fee policy**
- **Payment terms and conditions**
- **Carrier agreement outlining commission structure**
- **User conduct policy** (violations and consequences)
- **Multi-role user agreement**

**14\. Future Enhancements (Phase 2+)**

- Integration with warehouse management systems
- Customs clearance automation
- Multi-modal transportation support (air, sea, rail)
- Blockchain for shipment transparency
- Advanced AI for demand prediction
- IoT integration for cargo condition monitoring
- Drone delivery for last-mile
- Electric vehicle fleet optimization
- Virtual assistant/chatbot
- Augmented reality for loading guidance

**15\. Project Timeline Considerations**

While specific timelines are project-dependent, key phases include:

- Requirements gathering and refinement
- Design and prototyping
- Development (iterative sprints)
- Testing and quality assurance
- User training
- Pilot launch
- Full production launch
- Post-launch support and optimization

**17\. Multi-Role User Experience**

**17.1 User Interface for Multi-Role Users**

**17.1.1 Unified Navigation**

- **Role Switcher**:
  - Dropdown or toggle in main navigation
  - Quick switch between active roles
  - Visual indicator of current active role
  - Badge showing number of pending items per role
  - Keyboard shortcut for role switching

**17.1.2 Dashboard Design**

- **Role-Specific Dashboards**:
  - Separate dashboard view for each role
  - Retain last view/filters when switching back
  - Cross-role activity summary widget (optional)
  - Quick actions relevant to active role
- **Unified Overview** (Optional):
  - Combined view of all role activities
  - Filter by specific role
  - Color-coded by role type
  - Consolidated notifications

**17.1.3 Notification Management**

- **Role-Based Filtering**:
  - Toggle notifications by role
  - Priority notifications across all roles
  - Role-specific notification channels
  - Consolidated notification center
- **Smart Notifications**:
  - Context-aware alerts based on active role
  - Cross-role conflict detection (e.g., bidding on own shipment)
  - Aggregated daily summaries per role

**17.1.4 Profile Management**

- **Unified Account Settings**:
  - Single email/password management
  - Global preferences (language, timezone)
  - Security settings apply to all roles
- **Role-Specific Settings**:
  - Separate profile information per role
  - Role-specific notification preferences
  - Independent payment methods per role
  - Separate contact information when needed

**17.2 Business Logic for Multi-Role Users**

**17.2.1 Conflict Prevention**

- **Automatic Restrictions**:
  - Users cannot bid on their own shipments
  - Cannot rate themselves
  - Cannot dispute their own transactions
  - System alerts on potential conflicts of interest

**17.2.2 Financial Separation**

- **Role-Specific Wallets**:
  - Separate balance tracking per role
  - Independent transaction histories
  - Clear attribution of payments/receipts
  - Consolidated financial reports available

**17.2.3 Performance Metrics**

- **Independent Ratings**:
  - Separate rating as shipper vs. carrier vs. driver
  - Role-specific performance history
  - Combined reputation score (optional)

**17.3 Administrative Controls**

**17.3.1 Role Management by Super Admin**

- View all roles for each user
- Suspend/disable specific roles or entire account
- Monitor cross-role activities
- Detect and flag suspicious multi-role patterns
- Role-specific verification status

**17.3.2 Compliance Monitoring**

- Track users active in multiple roles
- Monitor for conflicts of interest
- Audit cross-role transactions
- Flag unusual patterns for review

**18\. Conclusion**

This freight bidding marketplace will revolutionize freight transportation in Cameroon and neighboring countries by providing a transparent, efficient, and technology-driven platform. The system's comprehensive features address the needs of all stakeholders while ensuring security, scalability, and user satisfaction.