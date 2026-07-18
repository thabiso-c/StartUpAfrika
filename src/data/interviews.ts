import { Interview } from "../types";

export const interviews: Interview[] = [
  {
    id: "slyzah",
    title: "Slyzah: Demystifying Creative Monetization & Crafting an On-Demand Workspace Blueprint",
    subtitle: "How Thabiso built a self-sustaining creative booking platform on zero funding and penetrated the local market.",
    founderName: "Thabiso",
    founderRole: "Founder & Architect",
    startupName: "Slyzah",
    foundedYear: 2024,
    location: "Cape Town, South Africa",
    techStack: ["React", "Vite", "Node.js", "Express", "PostgreSQL", "Tailwind CSS"],
    tags: ["Creative Economy", "Marketplace", "SaaS", "Local Payments"],
    stats: [
      { label: "Active Creatives", value: "1,200+" },
      { label: "Bookings Handled", value: "8,500+" },
      { label: "Time to Profit", value: "4 Months" },
    ],
    accentColor: "emerald",
    answers: {
      spark: "As a developer and creator myself, I watched incredibly talented local designers, videographers, and developers struggle to structure their bookings and get paid reliably. The existing global platforms charged high commission fees (often 20%) and didn't support local mobile money or regional bank structures. I realized that if local creatives had a streamlined, high-trust system designed for African market conditions, they could bypass middlemen and build sustainable micro-enterprises. That spark is what drove me to build Slyzah.",
      mvp: "The very first version of Slyzah was incredibly lean. It took me exactly 6 weeks to build. It was essentially a single-page interactive booking directory. Creatives could create a simple public profile, display their past artwork, select their booking hourly rates, and provide their local bank/mobile money details. There was no complex scheduling system; it was just a custom form that triggered direct SMS and WhatsApp notifications to both parties. I launched it with just 15 creatives whom I personally knew in Cape Town, and that simple focus validated the entire model.",
      techStackDetails: "Today, Slyzah is a robust full-stack platform. The frontend is built on React 18 with Vite for blazing-fast performance. On the server side, we run a custom lightweight Express.js API on Node.js, storing state in a highly optimized PostgreSQL database. The critical layer is our payment integration: we integrated custom payment flows using Paystack and local mobile money channels, which handle secure escrow. Styling is styled entirely using utility classes in Tailwind CSS, giving us absolute layout speed and design system uniformity.",
      traction: "To get our first 100 paying customers, I took a very hands-on approach. I knew global digital marketing would be too expensive and untargeted, so I went to local creator spaces, design hubs, and co-working offices in Cape Town. I sat down with individual creators, showed them how to build their portfolios, and offered them their first 3 bookings on Slyzah with absolutely zero platform commission. Once they saw how easy it was to receive instant payouts directly to their bank accounts, word-of-mouth spread like wildfire across the local community.",
      revenue: "Slyzah operates on a simple, transparent model: we charge a flat 5% transaction fee on successful client bookings, and a small monthly premium subscription ($8/month) for advanced analytics and custom portfolio domains. This hybrid SaaS-marketplace model kept our operational overhead very low. We reached operating profitability within exactly 4 months of launch, proving that local platforms don't need millions in venture capital to become fully self-sufficient.",
      lesson: "My biggest early mistake was trying to automate everything from day one. I spent two weeks building a complicated, automated dispute resolution system before we even had 50 transactions. It turned out that in Africa, users trust human connection. When there was an issue, they wanted to speak with a real person on WhatsApp. I scrapped that automated code and replaced it with a simple WhatsApp support widget. The lesson: do things manually until the scale forces you to automate, and never underestimate the power of direct human support."
    }
  },
  {
    id: "paystack",
    title: "Paystack: Solving Africa's Payments & Sparking a Modern Fintech Renaissance",
    subtitle: "How Shola Akinlade and Ezra Olubi built the modern payment infrastructure of Africa from Lagos.",
    founderName: "Shola Akinlade",
    founderRole: "Co-Founder & CEO",
    startupName: "Paystack",
    foundedYear: 2015,
    location: "Lagos, Nigeria",
    techStack: ["Node.js", "Angular", "PostgreSQL", "AWS Cloud", "Redis"],
    tags: ["Fintech", "Payment Gateway", "Infrastructure", "Acquisition"],
    stats: [
      { label: "Monthly Transactions", value: "$100M+" },
      { label: "Active Businesses", value: "80,000+" },
      { label: "Acquired By", value: "Stripe ($200M)" },
    ],
    accentColor: "blue",
    answers: {
      spark: "Back in 2015, online payments in Nigeria were deeply broken. If you wanted to accept card payments on a website, it took weeks of paperwork, bank approvals, and a integration process that had a 90% failure rate. Ezra and I wanted to build a simple, clean, developer-first API that could accept a payment in less than 30 minutes. The spark was a simple challenge: can we make it so easy to get paid online that any developer can copy three lines of code and launch a business?",
      mvp: "Our MVP was literally a prototype built over a few weeks. It consisted of a very simple HTML input form and a Node.js backend that could securely tokenize a credit card and process a charge through an existing bank pipeline. We didn't even have a merchant dashboard. When we wanted to onboard our first merchant, Shola literally sat in their office and manually copied card details into a command terminal to ensure the transaction went through. It was unscalable, but it proved the massive, urgent demand for seamless online billing.",
      techStackDetails: "Our platform leverages a highly resilient microservices architecture. The core APIs are built in Node.js, which handles thousands of concurrent requests with ultra-low latency. We use PostgreSQL as our primary relational datastore for high-integrity transaction logs, backed by Redis for high-speed caching and rate limiting. The entire infrastructure is hosted on AWS, utilizing load balancers and auto-scaling groups to handle massive flash-sale spikes from our merchants.",
      traction: "To get our first 100 merchants, we targeted our own community: Nigerian developers. We didn't pitch to corporate executives. Instead, we shared our documentation on tech forums, visited local startup incubators like CcHub in Yaba, Lagos, and literally helped developers integrate Paystack on their client websites for free. Because our API actually worked on the first try (unlike the legacy banking gateways), developers became our biggest advocates, driving viral adoption across the entire ecosystem.",
      revenue: "Paystack runs on a transparent transaction-fee model: a small percentage plus a flat fee per transaction (e.g., 1.5% for local transactions in Nigeria). By keeping transaction failure rates extremely low and onboarding processes fast, we grew transaction volumes exponentially. This transaction-based model made the company highly profitable within a couple of years, eventually attracting a landmark $200M acquisition by Stripe in 2020.",
      lesson: "Early on, we focused too heavily on building absolute technical perfection before understanding regulatory frameworks. We got a severe wake-up call when we had to temporarily halt transactions due to compliance updates. The lesson we learned was that in fintech, legal and regulatory infrastructure is just as important as your tech stack. Build strong relationships with regulatory bodies and compliance advisors from day one—never treat legality as an afterthought."
    }
  },
  {
    id: "piggyvest",
    title: "PiggyVest: Digitizing the Traditional African 'Ajo' to Scale Savings to Millions",
    subtitle: "How Odunayo Eweniyi and team digitized savings and investment for the young African demographic.",
    founderName: "Odunayo Eweniyi",
    founderRole: "Co-Founder & COO",
    startupName: "PiggyVest",
    foundedYear: 2016,
    location: "Lagos, Nigeria",
    techStack: ["PHP", "Laravel", "React Native", "MySQL", "DigitalOcean"],
    tags: ["Wealthtech", "Savings", "Mobile First", "Financial Inclusion"],
    stats: [
      { label: "Active Savers", value: "4.5M+" },
      { label: "Assets Managed", value: "$250M+" },
      { label: "Bootstrap Era", value: "2 Years" },
    ],
    accentColor: "indigo",
    answers: {
      spark: "The inspiration came from a simple tweet. In December 2015, a Nigerian lady tweeted a photo of her wooden savings box (locally called 'Kolo') and shared that she had saved over 300,000 Naira in cash over a year. That tweet went viral. My co-founders and I saw it and thought: in a digital world, why are people still using physical wooden boxes to save money? Why isn't there a secure, automated mobile app that locks your funds and earns you high interest, just like traditional community savings groups ('Ajo' or 'Esusu')? That was our spark.",
      mvp: "Our first MVP was launched in under a month under the name Piggybank.ng. We didn't have a banking license or a mobile app. We built a basic responsive web page using PHP (Laravel Framework) and integrated a simple recurring billing plugin. We partnered with a microfinance bank to hold our savers' deposits securely. Users could log in and authorize the app to automatically deduct 500 Naira ($1.50) from their debit cards daily. We launched it on Twitter with a single thread, and had 100 users saving real money within 48 hours.",
      techStackDetails: "Our infrastructure has evolved into a secure mobile-first engine. The backend is powered by Laravel (PHP) for robust financial transaction routing and security. Our mobile apps are written in React Native, allowing us to maintain a single clean codebase for both Android and iOS. Data security is paramount, so we utilize advanced tokenization for cards, store all user records in fully encrypted MySQL databases, and host on a resilient DigitalOcean private VPC.",
      traction: "Our early traction was powered entirely by community trust and financial transparency. We built 'Piggyvest points' and savings challenges where friends could save towards a goal together (e.g. rent or education) and share their milestones on Twitter and Instagram. This gamification turned financial saving—which is traditionally boring and stressful—into a social badge of honor, creating a self-sustaining referral loop that scaled us to our first 10,000 savers without spending a dollar on ads.",
      revenue: "PiggyVest operates on a high-yield asset management spread. When savers lock their funds, we pool these deposits and invest them in secure, high-yield low-risk instruments like government treasury bills and premium corporate bonds. We return a high interest rate to our users (up to 10-15% annually) and keep a small percentage spread as platform revenue. This keeps the app completely free of transaction fees for savers, aligning our success directly with theirs.",
      lesson: "One major mistake we made was launching our withdrawal windows too loosely. Initially, users could withdraw money whenever they wanted with minimal friction, which caused massive liquidity fluctuations when festive seasons arrived. We had to pivot and implement strict 'Withdrawal Days' (4 times a year). If users withdraw outside these days, they pay a small penalty. This single change drastically improved user savings discipline and stabilized our capital reserves overnight."
    }
  },
  {
    id: "yoco",
    title: "Yoco: Transforming Small Business Commerce via Accessible Card Payments",
    subtitle: "How Katlego Maphai democratized payments for informal merchants across South Africa.",
    founderName: "Katlego Maphai",
    founderRole: "Co-Founder & CEO",
    startupName: "Yoco",
    foundedYear: 2013,
    location: "Cape Town, South Africa",
    techStack: ["Java", "Spring Boot", "React Native", "PostgreSQL", "AWS"],
    tags: ["Point of Sale", "Hardware", "B2B SaaS", "SME Growth"],
    stats: [
      { label: "Active Merchants", value: "350,000+" },
      { label: "Card Readers Sold", value: "500,000+" },
      { label: "Funding Raised", value: "$100M+" },
    ],
    accentColor: "amber",
    answers: {
      spark: "While traveling in the US, I saw how street food vendors and local craftsmen were using small Square readers plugged into their iPhones to take card payments. Back home in South Africa, over 90% of small, informal businesses only accepted cash because getting a traditional bank card machine took months of paperwork, proof of high turnover, and expensive monthly rental fees. I realized that South African small businesses were losing up to 40% of their sales simply because they couldn't accept cards. Our mission was clear: democratize card payments for the underserved merchant.",
      mvp: "Our MVP was highly physical. We imported a small batch of 20 basic mobile card readers from Europe and built a very simple iOS app that connected to the reader via audio jack. We went out to local markets in Cape Town and literally sat with 5 small shop owners, teaching them how to process payments. We did not charge them for the reader; we just wanted to see if the local cellular network could transmit the transaction safely and if informal merchants would trust a tiny digital reader. This pilot was our proof of concept.",
      techStackDetails: "Our enterprise stack is incredibly advanced, bridging hardware and software seamlessly. The backend uses Java with Spring Boot, running containerized microservices on AWS Elastic Kubernetes Service (EKS). The transaction data is logged in a secure PostgreSQL cluster. On the merchant side, the Yoco App is built in React Native, interfacing with our custom Bluetooth card readers via a highly secured, EMV-compliant proprietary SDK.",
      traction: "Getting informal South African merchants to adopt digital payments was a massive trust hurdle. We couldn't rely on digital ads alone. We created 'Yoco Stores' in key business hubs where merchants could walk in, see a live demo, and buy a card reader in 10 minutes. We also offered a 'No Monthly Fees' structure: merchants bought the reader once and only paid a transaction fee when they made a sale. This removed all entry risk and allowed us to scale from 500 to 50,000 merchants in record time.",
      revenue: "Yoco's revenue model is split into two robust streams: Hardware and Transaction margins. We sell our proprietary card readers (Yoco Go, Yoco Neo) at an affordable one-time cost, and then charge a variable transaction fee on every card tap (ranging from 2.5% to 3% based on monthly volume). As our merchants grow, their transaction volume increases, creating a highly sticky and compounding recurring revenue stream.",
      lesson: "In our early days, we focused exclusively on card hardware, assuming that is all merchants needed. However, we quickly realized that merchants were struggling with general business health: cash flow, tracking inventory, and staff management. We learned that the card reader is just the entry point. We should have built B2B software features (like digital cash advances and sales tracking tools) much earlier to protect merchants from cash flow volatility."
    }
  }
];
