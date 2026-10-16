# MENU NAMES

এই ফাইল সাইডবারের চূড়ান্ত নামের একমাত্র উৎস। UI-তে নাম এখান থেকেই আসবে, অন্য নাম বানাবে না।

নিয়ম: ✅ = প্রথম রিলিজে দেখাবে। 🔒 = বানানো না হওয়া পর্যন্ত লুকানো, Plan বা মডিউল চালু হলে নিজের জায়গায় দেখাবে। URL সবসময় ইংরেজিতে, ভাষা বদলালেও একই।

| # | English | বাংলা | URL | অবস্থা |
|---|---|---|---|---|
| 1 | Dashboard | ড্যাশবোর্ড | /dashboard | ✅ |
| 2 | Tasks & Approvals | কাজ ও অনুমোদন | /tasks | ✅ |
| 3 | Sell | বিক্রি | /sell | ✅ |
| 4 | Counter Sale | কাউন্টার বিক্রি | /counter-sale | 🔒 |
| 5 | Buy | কেনা | /buy | ✅ |
| 6 | Stock | মজুদ | /stock | ✅ |
| 7 | Production | উৎপাদন | /production | 🔒 |
| 8 | Customers | কাস্টমার | /customers | ✅ |
| 9 | Leads & Deals | লিড ও ডিল | /leads | 🔒 |
| 10 | Jobs & Projects | কাজ ও প্রজেক্ট | /jobs | 🔒 |
| 11 | Money & Accounts | টাকা ও হিসাব | /money | ✅ |
| 12 | Staff & Salary | কর্মী ও বেতন | /staff | 🔒 |
| 13 | Reports | রিপোর্ট | /reports | ✅ |
| 14 | Import & Export | ইমপোর্ট ও এক্সপোর্ট | /import-export | ✅ |
| 15 | Settings & Team | সেটিংস ও টিম | /settings | ✅ |

সাব-মেনু:
- Dashboard: Business Summary (ব্যবসার সারসংক্ষেপ)
- Tasks & Approvals: My Tasks (আমার কাজ); Waiting for Approval (অনুমোদনের অপেক্ষায়)
- Sell: Sales Invoices (বিক্রির বিল); Money Received (টাকা পাওয়া); Credit Notes (বিক্রি ফেরত); Money to Receive (কাস্টমারের কাছে পাওনা)
- Counter Sale 🔒: Sell at Counter (কাউন্টারে বিক্রি); Shift & Cash Drawer (শিフト ও ক্যাশ ড্রয়ার)
- Buy: Purchase Bills (কেনার বিল); Money Paid (টাকা দেওয়া); Debit Notes (কেনা ফেরত); Money to Pay (সাপ্লায়ারকে দেনা); Suppliers (সাপ্লায়ার)
- Stock: Items (পণ্য); Warehouses (গুদাম); Stock Count (মজুদ গণনা); Stock Adjustment (মজুদ সমন্বয়)
- Production 🔒: Recipes (রেসিপি); Production Orders (উৎপাদন অর্ডার); Waste (অপচয়)
- Customers: All Customers (সব কাস্টমার)
- Leads & Deals 🔒: Leads (সম্ভাব্য ক্রেতা); Deals (চলমান ডিল)
- Jobs & Projects 🔒: Jobs (কাজ); Job Costs (কাজের খরচ); Timesheets (সময়ের হিসাব)
- Money & Accounts: Cash & Bank (ক্যাশ ও ব্যাংক); Cheques (চেক); Account Book (হিসাবের খাতা); Manual Entry (হাতে এন্ট্রি); Account List (হিসাবের তালিকা); Tax & VAT (ট্যাক্স ও ভ্যাট)
- Staff & Salary 🔒: Staff (কর্মী); Attendance (হাজিরা); Leave (ছুটি); Salary (বেতন)
- Reports: Profit Report (লাভ-ক্ষতির রিপোর্ট, প্রচলিত নাম Profit & Loss ছোট করে); Assets & Debts (সম্পদ ও দেনা, Balance Sheet); Books Check (খাতা মিলানো, Trial Balance); Tax Summary (ট্যাক্স সারাংশ)
- Import & Export: Import Data (ডেটা আনুন); Export Data (ডেটা নিন)
- Settings & Team: Company Profile (কোম্পানির তথ্য); Business Type (ব্যবসার ধরন); Team & Permissions (টিম ও অনুমতি); Branches (শাখা); Plan & Billing (প্ল্যান ও বিল); Activity Log (কার্যকলাপের লগ); Backup & Data (ব্যাকআপ ও ডেটা)

উপরের বারে (সাইডবারে নয়): Search Ctrl+K (খুঁজুন); Quick Add + (নতুন যোগ করুন); Notifications (নোটিফিকেশন); Company switcher (কোম্পানি বদলান); Language (ভাষা); Theme Dark/Light (থিম); Help ? (সাহায্য)।

নোট: "Show accounting terms" সেটিং পরে আসবে, চালু করলে নামগুলো প্রচলিত হিসাবের নামে (Journal, Ledger, Receivables) দেখাবে; সাধারণ ক্লায়েন্টের ডিফল্ট সহজ নাম। আরবি নাম i18n-এ পরে যোগ হবে।
