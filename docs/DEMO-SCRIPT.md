# URSSET: Demo and video scripts

App: https://ursset.vercel.app (Robinhood Chain Testnet, chain ID 46630). All money is test Rupiah (tIDR). Say so early in every recording.

Uploaded to the submission (English only): **A. Pitch video** and **B. Demo video**. Also here: **C. 60-second backup video**, **D. Live Demo Day run** (Sunday, Jakarta; Indonesian and English), **E. Pre-flight and recording checklist**, **F. Plan B**.

Screens: Home `/`, Property `/p/[id]`, Room `/p/[id]/room/[roomId]`, Portfolio `/portfolio`, Manage `/operator` (`#listing`, `#rent`). The "Send units" action in Portfolio demonstrates the KYC rejection. With the app in English the proof link may read differently from "Lihat bukti di blockchain"; TODO: confirm the exact English label in the UI and use it in captions.

---

## A. Pitch video (English, about 3:00)

Record the deck from `docs/PITCH.md` (English version) with voice-over. Narration is the exact text; speak at a calm pace.

| Slide | Time | Narration |
|---|---|---|
| 1 | 0:00-0:20 | "This is Rina, 24. She wants a share of a property, but her capital is small and crypto sounds complicated. URSSET, short for urunan asset, lets Rina and three friends pool money to buy part of a boarding house from Rp10,000 and receive its monthly rent. Three steps, no seed phrase." |
| 2 | 0:20-0:45 | "Three barriers keep people out. Capital. Trust, because investors read rent reports they cannot check themselves. And complexity, because crypto products expect wallets and gas fees. [TODO: one sentence of real interview evidence, or cut.]" |
| 3 | 0:45-1:20 | "Sign in with email. Top up through QRIS. Tap Urunan. To pool money, create an Urunan Room, share one link, and each friend joins with their own amount. Units go straight to each person's wallet, so nobody holds anyone else's money. Every rent deposit leaves public proof anyone can open." |
| 4 | 1:20-1:50 | "Ownership, rent payouts and trades between investors happen on a public ledger the operator does not control, so investors can verify for themselves without trusting a database, while KYC rules are enforced directly by the smart contract. A transfer to an unverified wallet is rejected by the contract itself." |
| 5 | 1:50-2:05 | "The property owner pays a listing fee, about 3 percent of funds raised. That is an assumption we still need to validate with owners. Investors pay no platform fee." |
| 6 | 2:05-2:30 | "We do not claim to be compliant. The limit: tokens representing rights to property rent may be treated as financial products supervised by OJK, and payments in Indonesia must be in Rupiah. The path: the OJK Regulatory Sandbox, with the property held by a legal-entity SPV and Rupiah through a BI-licensed payment provider. For the hackathon: testnet, non-custodial, illustrative property data, no real user funds." |
| 7 | 2:30-3:00 | "What exists is a product: seven contracts, 45 passing tests, and a live app. Market traction: [TODO: real numbers, or state that there are none yet]. Next: a pilot with one real boarding house, the sandbox application, and a licensed payment partner. Try it at ursset.vercel.app. Thank you." |

Captions: one line per slide using the slide title. Show the URL on slide 7.

---

## B. Demo video (English, 2:00-3:00, target 2:40)

Set up first: open the app, use the menu language switch (ID | EN) and select EN, then reload and confirm the UI is English. Record the screen at that point, so on-screen text and narration match. Never record in Indonesian for the upload.

| # | Time | On-screen action | Narration | Caption |
|---|---|---|---|---|
| 1 | 0:00-0:12 | Home: logo, tagline, test-network label, property cards | "This is URSSET. Three steps to own part of a boarding house. It is a testnet demo with test Rupiah." | Testnet demo, test Rupiah |
| 2 | 0:12-0:24 | Open a property: photos, progress, rent history, contract links | "Each property shows its photos, sale progress and a rent history recorded onchain." | Rent history is onchain |
| 3 | 0:24-0:36 | Start Urunan, sign in with a fresh test email | "Step one: sign in with email. A wallet is created for you, with no seed phrase, and the app covers gas." | Step 1: Sign in |
| 4 | 0:36-0:50 | Top up through QRIS, complete the identity check | "Step two: top up through QRIS and a light identity check. Both are simulated in this demo." | Step 2: Top up (simulated) |
| 5 | 0:50-1:02 | Choose an amount, tap Urunan, wait for confirmation | "Step three: Urunan. One tap, and the units are in my wallet." | Step 3: Urunan |
| 6 | 1:02-1:15 | Create an Urunan Room, copy the link, open it in a second window, friend joins with their own amount | "To pool with friends, create an Urunan Room and share the link. Each friend joins with their own amount, and units go to each wallet. Nobody holds anyone else's money." | Urunan Room |
| 7 | 1:15-1:30 | Manage, deposit rent: pick the property, enter the amount, deposit | "Now the property owner deposits the monthly rent." | Owner deposits rent |
| 8 | 1:30-1:45 | Portfolio: rent received appears, claim it | "In my portfolio, rent is split pro rata by units. I just claim it." | Rent claimed |
| 9 | 1:45-1:58 | Open the proof link on a transaction, show the explorer page | "Every transaction has a public proof. Anyone can check it without trusting our database." | Verify on the explorer |
| 10 | 1:58-2:12 | Portfolio, send units to an unverified wallet, show the rejection | "KYC is enforced by the contract. A transfer to an unverified wallet is rejected by the smart contract." | Contract rejects unverified wallet |
| 11 | 2:12-2:28 | Manage, list a property: name, city, rooms, occupancy, value, photos, submit | "Owners can list a new property in a single transaction: name, city, rooms, value and photos." | List a property in one transaction |
| 12 | 2:28-2:40 | Menu: switch language to Indonesian and back to Home | "The whole app also works in Indonesian." | Indonesian and English |
| 13 | 2:40-2:50 | End card: logo, ursset.vercel.app, github.com/seppam/ursset | "This is a testnet demo, not an investment offer. Try it at ursset.vercel.app. The code and 26 tests are on GitHub." | Testnet only. Not an investment offer. |

Links in the submission: TODO: pitch video URL, TODO: demo video URL.

---

## C. Backup video (English, 60 seconds)

For when live demo fails. Same app, English UI.

| Time | On-screen | Narration |
|---|---|---|
| 0:00-0:08 | Home, property card | "URSSET lets you co-own a boarding house from Rp10,000. Testnet, test Rupiah." |
| 0:08-0:22 | Sign in, top up, Urunan | "Sign in with email, top up, tap once. No seed phrase, no gas." |
| 0:22-0:32 | Urunan Room link, friend joins | "Friends join through one link, each into their own wallet." |
| 0:32-0:44 | Owner deposits rent, portfolio claims it | "The owner deposits rent. I claim my share, split pro rata." |
| 0:44-0:54 | Proof link, then rejected transfer | "Anyone can verify it onchain, and the contract rejects transfers to unverified wallets." |
| 0:54-1:00 | End card | "ursset.vercel.app. Testnet demo, not an investment offer." |

---

## D. Live Demo Day run (Sunday 11 Oct, Ganara Art, in person)

About 90 seconds, replaces slides 3-4 if time is short. Prepare: a signed-in Rina account with balance, a signed-in `/operator` tab, and the address of an unverified wallet.

| Sec | Action | Indonesian | English |
|---|---|---|---|
| 0-10 | Home, open a property, point at Rp10,000 per unit and progress | "Ini Beranda. Properti kos, unit mulai Rp10.000. Semua uang di demo ini Rupiah uji di testnet." | "This is Home. A boarding house, units from Rp10,000. All money here is test Rupiah on a testnet." |
| 10-30 | Tap Urunan, enter amount, confirm | "Saya sudah masuk dengan email, tanpa seed phrase dan tanpa bayar gas. Satu tap, unit masuk ke dompet saya." | "I signed in with email, no seed phrase, no gas. One tap and the units are in my wallet." |
| 30-45 | Create an Urunan Room, show the link | "Untuk patungan, satu link. Teman masuk dengan jumlahnya sendiri, unitnya ke dompet mereka sendiri." | "To pool, one link. Friends join with their own amount, units into their own wallets." |
| 45-60 | Manage tab: deposit rent | "Sekarang pemilik menyetor sewa bulanan." | "Now the owner deposits monthly rent." |
| 60-72 | Portfolio: claim rent, open proof link | "Sewa saya muncul dan bisa diambil. Setiap transaksi punya bukti publik." | "My rent shows up and I claim it. Every transaction has public proof." |
| 72-90 | Send units to the unverified wallet, show rejection | "Ini penegakan KYC: kontrak menolak transfer ke dompet yang belum terverifikasi. Bukan aplikasi, kontraknya." | "This is KYC enforcement: the contract rejects a transfer to an unverified wallet. Not the app, the contract." |

Choose the language to match the room. Judges include international guests, so keep English ready.

---

## E. Pre-flight and recording checklist

Before (day before and 30 minutes before)
- [ ] Two fresh test emails (or Google accounts): one buyer, one friend. Fresh wallets, never verified before.
- [ ] One unverified destination wallet address (random fresh wallet, never verified). Save it in private notes.
- [ ] Operator code ready in private notes. Do not show it on screen or write it in the repo. TODO: confirm operator access matches the latest `.env`.
- [ ] Operator wallet test-ETH balance: check on https://explorer.testnet.chain.robinhood.com, refill from https://faucet.testnet.chain.robinhood.com if low. The operator pays gas for users and rent deposits. TODO: record a safe minimum after testing.
- [ ] After the final redeploy: contract addresses in the README match, properties appear on Home. TODO: confirm.
- [ ] Run `cd packages/nextjs && node scripts/e2e.mjs` once; it should pass.
- [ ] RPC: test from the venue network. Some Indonesian ISPs block the RPC domain; have a hotspot, DNS 1.1.1.1, or `NEXT_PUBLIC_RPC_URL` pointed to `/api/rpc`.
- [ ] Backup video (C) on phone and laptop.
- [ ] Rent amount for the live deposit decided in advance.

Recording tips (uploaded videos)
- Resolution 1920x1080 or higher, 30 fps, export MP4. Use desktop for the pitch video. For the demo video, either a desktop window or a phone-sized frame (mobile-first app); pick one and keep it for the whole video.
- Mic check: record 10 seconds, listen back, quiet room, same mic for every clip, no clipping.
- Hide browser bookmarks bar, extensions, other tabs, notifications and the dock; use a clean browser profile or window.
- No real emails, no real wallet addresses of yours, no operator code or any key visible. Use fresh test emails and wallets only; blur anything unsure.
- Switch the app to English before recording the demo (menu, ID | EN) and reload.
- Record in short takes; cut waiting time with jump cuts, but do not speed up a transaction in a way that misleads about speed.
- Add captions from the tables above and burn them in or upload an SRT.

## F. Plan B

| Failure | Sign | Action |
|---|---|---|
| RPC down / TLS error | Home empty, endless spinner | Switch to hotspot or DNS 1.1.1.1; use `/api/rpc`; otherwise play the backup video and narrate |
| Wallet / Privy login error | Sign-in does nothing | Reload, use the second email; else use an account already signed in on another window |
| Slow transaction | Still pending after 15 s | Keep talking about why onchain, open the proof link to show status; past 45 s, skip ahead and return |
| Operator out of test ETH | Onboarding or rent deposit fails | Refill from the faucet (about a minute); else show existing rent history on the property page |
| KYC rejection does not appear | Transfer succeeds | Confirm the destination is truly unverified; fallback: show test `test_TransferToUnverifiedWalletIsRejected` in the repo |
| Listing a property fails | Form error | Skip; show an already listed property and mention the factory transaction |
| Projector or screen issue | | Backup video from phone; same narration |
