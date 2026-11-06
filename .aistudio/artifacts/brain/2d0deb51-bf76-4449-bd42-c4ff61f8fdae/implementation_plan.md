# ระบบความปลอดภัย: บังคับยืนยันอีเมลผ่าน Google Authentication และยกเลิกการเข้าสู่ระบบด่วน

ปรับปรุงความปลอดภัยของระบบบริหารการตรวจติดตามคุณภาพภายใน (IQA Management System) ของ บริษัท เวท ซุปพีเรีย คอนซัลแตนท์ จำกัด โดยกำหนดให้ผู้ใช้งานทุกคนต้องผ่านการตรวจสอบตัวตนและยืนยันอีเมลผ่าน Google Authentication (`email_verified == true`) ก่อนเข้าถึงข้อมูลจริงเสมอ พร้อมยกเลิกทางลัดเข้าสู่ระบบด่วน (Quick Login) ทั้งหมด

---

### User Review & Critical Decisions

> [!IMPORTANT]
> **สรุปการตัดสินใจที่ผู้ใช้งานยืนยันในขั้นตอนการวางแผน:**
> - **การยืนยันอีเมล (Confirmed):** บังคับใช้การเข้าสู่ระบบผ่าน Google Authentication และตรวจสอบว่าบัญชี Google นั้นผ่านการยืนยันอีเมล (`email_verified === true`) อย่างเคร่งครัด
> - **ยกเลิก Quick Login (Confirmed):** นำการ์ดและปุ่มเข้าสู่ระบบด่วน (Quick Login bypass) ที่เคยมีอยู่ออกทั้งหมด ไม่ให้มีการกดคลิกเดียวเข้าสู่ระบบโดยไม่ผ่านการยืนยันตัวตนจริง
> - **การจับคู่สิทธิ์และบทบาท:** เมื่อผู้ใช้ลงชื่อเข้าใช้ด้วย Google ระบบจะตรวจสอบอีเมลกับทำเนียบบุคลากร 29 ท่านในระบบ (QMR, DC, QA, Production, WH, ฯลฯ) เพื่อกำหนดบทบาทและแผนกอัตโนมัติ หากเป็นอีเมลของผู้ดูแลระบบ (`wrpn2535@gmail.com`) จะได้รับสิทธิ์ `ADMIN` ทันที

---

### 1. Overview & Core Concept

- **ปัญหาเดิม:** หน้าแรกของระบบมีทางลัดเข้าสู่ระบบด่วน (Quick Login) ซึ่งเปิดให้เลือกโปรไฟล์เจ้าหน้าที่และเข้าใช้งานได้ทันทีโดยไม่ต้องตรวจสอบว่าผู้ใช้คือเจ้าของอีเมลจริง ทำให้มีความเสี่ยงด้านการเข้าถึงข้อมูลรายงานการตรวจและใบ CAR/PAR โดยไม่ได้รับอนุญาต
- **สิ่งที่ระบบใหม่ทำ:** 
  1. แปลงหน้า Login Gate ให้เป็นหน้าตรวจสอบสิทธิ์ความปลอดภัยระดับองค์กร (Zero-Trust Security Gate)
  2. กำหนดให้การเข้าสู่ระบบทุกครั้งต้องคลิกปุ่ม **"ลงชื่อเข้าใช้ด้วย Google Account (ยืนยันอีเมล)"** ผ่าน Firebase Auth Popup
  3. ตรวจสอบสถานะความปลอดภัย: หากบัญชี Google ยังไม่ยืนยันอีเมล (`email_verified === false`) ระบบจะปฏิเสธการเข้าถึงและแจ้งเตือนให้ผู้ใช้ยืนยันอีเมลกับ Google ก่อน
  4. ทำการบันทึกประวัติการยืนยันตัวตน (Authentication Audit Log) พร้อมเวลาที่เข้าใช้งาน และซิงค์สถานะเข้าสู่ระบบลง Firebase Firestore

---

### 2. User Experience & Visual Design

#### ขั้นตอนการใช้งาน (User Flow)
1. **เมื่อเปิดระบบเข้ามา (Unauthenticated State):**
   - ผู้ใช้จะพบหน้า Login Gate ดีไซน์มาตรฐานอุตสาหกรรม (Royal Indigo / Deep Slate) ของบริษัท เวท ซุปพีเรีย คอนซัลแตนท์ จำกัด (โรงงาน: สมุทรสาคร)
   - ไม่มีปุ่มหรือการ์ด Quick Login ปรากฏอีกต่อไป
   - มีปุ่มหลักเด่นชัดเพียงปุ่มเดียว: **"เข้าสู่ระบบด้วย Google Account (ยืนยันอีเมล)"** พร้อมตราสัญลักษณ์ความปลอดภัย 3 มาตรฐาน (ISO 9001:2015, GHPs/HACCP, FAMI-QS V.6)
2. **เมื่อคลิกเข้าสู่ระบบ:**
   - ระบบจะเปิดหน้าต่าง Google Authentication Popup
   - ผู้ใช้เลือกหรือพิมพ์บัญชี Google ของตนเอง
3. **การตรวจสอบผลการยืนยันอีเมล (Verification Guard):**
   - **กรณีผ่าน (`email_verified: true`):**
     - ระบบแสดงหน้าจอต้อนรับสั้นๆ ระบุชื่อ, อีเมล, แผนก, และบทบาทที่ได้รับมอบหมาย
     - นำเข้าสู่หน้าแดชบอร์ด IQA ทันที
   - **กรณีไม่ผ่าน (`email_verified: false`):**
     - ระบบปฏิเสธการเข้าสู่ระบบทันที พร้อมแสดงข้อความเตือนสีส้ม/แดง: *"บัญชี Google นี้ยังไม่ได้รับการยืนยันอีเมล กรุณายืนยันอีเมลในระบบ Google Account ก่อนเข้าใช้งาน"*
4. **การออกจากระบบ (Sign Out):**
   - มีปุ่มลงชื่อออกอย่างชัดเจนทั้งใน Header และเมนูตั้งค่า เมื่อลงชื่อออก ระบบจะเคลียร์เซสชันทั้งในแอปและ Firebase Auth นำกลับสู่หน้า Login Gate ทันที

#### องค์ประกอบทางภาพ (Visual Identity & Theme)
- โทนสี: Deep Royal Indigo (`#4338CA`), Slate (`#0F172A`), และ Emerald (`#059669`) สำหรับสถานะ Verified
- ไทโปกราฟี: ฟอนต์ Sarabun สำหรับภาษาไทยคู่กับ Plus Jakarta Sans และ JetBrains Mono สำหรับอีเมลและรหัสระบบ
- ข้อมูลและสถานะ: แสดงแบบ Clean Text พร้อมเครื่องหมาย `CheckCircle2` สีเขียว ไม่มี Capsule/Pill รกสายตา

---

### 3. Key Product Decisions & Trade-Offs

- **การยกเลิก Quick Login:**
  - *เหตุผล:* ป้องกันการสวมสิทธิ์ในระหว่างการตรวจติดตามคุณภาพภายใน ซึ่งต้องการความถูกต้องของ Lead Auditor และ Auditee ตามข้อกำหนด ISO 19011
  - *ข้อดี:* ยกระดับมาตรฐานความปลอดภัย สอดคล้องกับข้อกำหนดการควบคุมการเข้าถึงสารสนเทศ
- **การใช้ Firebase Google Auth `emailVerified`:**
  - *เหตุผล:* ใช้มาตรฐาน OAuth 2.0 ของ Google ที่มี Digital Signature ป้องกันการปลอมแปลงอีเมลได้อย่างสมบูรณ์
  - *ทางเลือกอื่นที่พิจารณา:* การส่งรหัส OTP ทางอีเมล มีความซับซ้อนและอาจล่าช้าจากปัญหาอีเมลตกหล่นใน Spam Folder ขณะที่ Google Auth ทำงานได้ทันทีและยืนยันตัวตนได้ 100%

---

### 4. Technical Architecture & Data Strategy *(Technical Reference)*

```
┌────────────────────────────────────────────────────────────────────────┐
│                        User Web Browser (Vercel)                       │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                      [1] Click Google Sign-In
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   Firebase Authentication (Google OAuth)               │
│                                                                        │
│   • Authenticates credentials via Google Identity Provider             │
│   • Returns UserCredential: { email, emailVerified: true/false, uid }   │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                      [2] Inspect emailVerified Flag
                                   │
         ┌─────────────────────────┴─────────────────────────┐
         │ emailVerified == true                             │ emailVerified == false
         ▼                                                   ▼
┌───────────────────────────────────────┐   ┌────────────────────────────────┐
│      Match Roster & Permissions       │   │ Block Entry & Display Alert    │
│ • Match email with 29 Company Roster  │   │ "Please verify your email via  │
│ • Assign Admin if wrpn2535@gmail.com  │   │ Google Account settings first" │
│ • Update Firestore /users/{uid}       │   └────────────────────────────────┘
│ • Grant App State Access              │
└───────────────────────────────────────┘
```

#### แผนการปรับแต่งไฟล์โค้ด (Implementation Steps)
1. **`src/services/firebase.ts`:**
   - เพิ่มฟังก์ชันตรวจสอบ `user.emailVerified` ในขั้นตอน `loginWithGoogle()` หาก `!user.emailVerified` ให้ยกเลิกและโยนข้อผิดพลาด `EMAIL_NOT_VERIFIED`
2. **`src/App.tsx`:**
   - ลบส่วนแสดงผล `keyQuickUsers` และการ์ด Quick Login ทั้ง 6 ใบออกจากหน้า Login Gate
   - แทนที่ด้วยกล่องลงชื่อเข้าใช้ด้วย Google Account อย่างปลอดภัย (Single Primary Google Authentication Button)
   - ปรับสถานะเริ่มต้น `isAuthenticated` ให้ขึ้นอยู่กับผลการยืนยันอีเมลจริงเท่านั้น
3. **`src/components/GoogleAuthModal.tsx`:**
   - ปรับปรุงให้หน้าต่างมีปุ่มยืนยันตัวตนผ่าน Google จริงเป็นหลัก และกำกับว่าบัญชีต้องผ่านการยืนยันอีเมลแล้วเท่านั้น
4. **`firestore.rules`:**
   - คงความเข้มงวดในการตรวจสอบ `request.auth.token.email_verified == true` สำหรับทุกการบันทึกข้อมูล
