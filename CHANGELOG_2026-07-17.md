# What I fixed and added — July 17, 2026

## 🐛 Bugs found and fixed

1. **"Accept bid" button did nothing.**
   `app/projects/[id]/page.tsx` rendered the button with no `onClick` at all.
   Wired it to a new `handleAcceptBid()` that calls the `accept_bid` RPC.

2. **`accept_bid()` SQL function was broken.**
   It referenced `projects.owner_id`, a column that hasn't existed since your
   schema was rebuilt (it's `client_id` now). Every accept attempt would have
   thrown `column "owner_id" does not exist`. Fixed in
   `scripts/009_fixes_and_license_verification.sql`. **You must run this
   script in the Supabase SQL Editor** for the fix to take effect.

3. **File uploads on `/projects/new` silently failed.**
   The code uploaded to a Storage bucket called `project-files`, but that
   bucket was never created anywhere in your SQL scripts — so every upload
   failed with no bucket to fail against, and the failure was swallowed
   (no error shown). Fixed two ways:
   - `009_fixes_and_license_verification.sql` creates the `project-files`
     bucket + policies.
   - The upload code now surfaces a real error message if a file fails,
     instead of hiding it.

4. **5 different "payment gateway" domains → now 1 link format.**
   `budgetOptions` pointed at 5 different subdomains
   (`digital.`, `digitals.`, `solution.`, `solutions.`, `professional.workshub.space`).
   Replaced with a single generator:
   `https://digital.workshub.space/l/{productId}?price={amount}&wanted=true`
   ⚠️ I used placeholder product IDs (`project-300`, `project-600`, …) —
   **open `app/projects/new/page.tsx`, find `budgetOptions`, and replace
   `productId` with your real product IDs from your digital storefront.**

5. **Placing an order silently failed to open the payment tab in some
   browsers.** `window.open()` was called *after* several `await` calls,
   which most browsers treat as a popup and block. Fixed by opening a blank
   tab synchronously the instant the button is clicked, then redirecting
   that tab once the project + payment URL are ready. If the browser still
   blocks it, the success screen now always shows a real clickable "Open
   payment" button/link as a fallback (previously that fallback was broken
   too — it referenced the deleted gateway list).

6. **Homepage "I'm a business owner / freelancer / affiliate" buttons did
   nothing.** They link to `/auth/signup?role=...`, but the signup form
   never read that URL parameter — everyone landed on the same generic form
   and had to notice and manually re-pick their account type. Also
   `role=client` didn't match your `business_owner` enum value. Both are
   fixed in `app/auth/signup/signup-form.tsx`.

7. **Freelancer list on a project's bid tab was always empty of names.**
   The bids query used `select("*")` with a comment saying "we don't join
   other tables", but the UI referenced `bid.profiles?.full_name` and
   `bid.reviews`. Fixed the query to actually join `profiles` and `reviews`.

8. **A profile auto-repair path defaulted everyone to `role: 'freelancer'`.**
   If a user's profile row was somehow missing when they opened
   `/projects/new`, the code silently recreated it as a freelancer — so a
   business owner who hit this edge case would lose their account type.
   Now it reads the role from their signup metadata instead of hardcoding.

## ✨ New: optional freelancer license verification

- New table `freelancer_licenses` + storage bucket `license-documents`
  (private — only the freelancer can read their own file).
- New component `components/freelancer-license-upload.tsx`: bilingual
  (English default, Arabic toggle), optional upload, with a dropdown of
  common local freelance/home-business licenses (Bahrain, Saudi Arabia, UAE,
  Qatar, Kuwait, Egypt, Tunisia, Algeria, Jordan, Iraq, Libya, Pakistan,
  India, US, UK, or "other"). Shown on `/profile` for freelancer accounts.
- On a project's bid list, a freelancer with a **verified** license now
  shows a green "موثّق / Verified" badge next to their name, so the
  business owner can see it before accepting the bid.
- Verification itself (approve/reject a submitted license) has no admin UI
  yet — right now you'd update `freelancer_licenses.status` directly in the
  Supabase table editor. Say the word and I'll build a small admin review
  screen next.
- Added a short "Verified freelancers" section to the homepage.

## 📢 Google AdSense

Added your AdSense verification script to `app/layout.tsx` using
`next/script` (the Next.js-recommended way to load third-party scripts,
safer than a raw `<script>` tag) with your client ID `ca-pub-4261863462581026`.

## ⚠️ Still needed / not done in this pass

These are genuinely large, separate projects — flagging clearly rather than
quietly skipping them:

- **Full visual redesign with photos/video and "latest UI/UX practices."**
  I didn't touch visual design in this pass (I focused on fixing what was
  actually broken first). This deserves its own dedicated pass, page by
  page, with your input on brand direction, imagery, and any video assets
  you want to use.
- **Full English/Arabic site-wide translation.** Right now the whole site is
  hardcoded Arabic (`<html lang="ar" dir="rtl">` in `app/layout.tsx`). I
  didn't want to bolt on a fake toggle — a real bilingual site needs a
  proper i18n setup (e.g. `next-intl`) so every page, not just the license
  widget, switches cleanly with correct `rtl`/`ltr` layout. I built the new
  license widget bilingually as a working example of the pattern.
- **Admin review UI for licenses.** Table + storage are ready; the
  approve/reject screen for business owners/admins isn't built yet.

## 🚀 To deploy these fixes

1. Open Supabase → SQL Editor → run
   `scripts/009_fixes_and_license_verification.sql`.
2. Replace the placeholder `productId` values in
   `app/projects/new/page.tsx` with your real digital-product IDs.
3. Deploy the updated code (Vercel/your host) as usual.
