# Kazo Technical School — website build

Plain HTML, CSS and vanilla JS. No frameworks, no build step, no dependencies.
The only external request is the Urbanist font from Google Fonts. The Google Map loads only when a visitor presses "Show map".

## Open it locally

The pages use root-relative links (`/fees/`), so serve the folder instead of double-clicking the files:

```
cd ~/Desktop/kts-website-build
python3 -m http.server 8765
```

Then open http://localhost:8765

## Structure

```
index.html                         Home
welding-course/                    Welding course
fees/                              Fees (+ #scholarship form)
welding-jobs-uganda/               Welder salary & jobs
success-stories/                   Stories index + oliver-zola/, pius-okoloi/, allan-namwanja/
visit/                             Visit (+ #book booking form, question form)
apply/                             Application form
catalog/                           Catalog + 7 product pages
donate/                            Sponsor a student
thank-you/session-booked/          Booking confirmation (noindex)
assets/css/site.css                All styles (design tokens at the top)
assets/js/site.js                  Menu, forms → WhatsApp, Saturday dates, .ics download, map
robots.txt, sitemap.xml, favicon.ico, assets/img/favicon.svg
```

## How the forms work

No server is needed. Every form checks its fields, then opens WhatsApp to +256 778 331533 with the answers already typed in. The visitor presses send.
After the booking form, the visitor is also taken to `/thank-you/session-booked/`.
To switch to a form service later (Formspree, Netlify Forms and so on), change the submit handler in `assets/js/site.js`.

## Still to set up on the host

- 301 redirects: `/about-2` → `/success-stories/`, `/contact-us` → `/visit/`, `/apply-now` → `/apply/`
- The street address in the schema markup (in each page's `<head>`) once it is confirmed

## Brand palette

Crimson Depth `#710014` (primary, gradient `#8C0A22 → #710014 → #4A000D`), Warm Sand `#B38F6F` (decorative accents only; `#7A5A3E` for sand-toned text on light, `#D9C3AE` on dark), Soft Pearl `#F2F1ED` (surfaces), Obsidian Black `#161616` (headings, footer). Tokens are at the top of `assets/css/site.css`.

## Draft copy to review

These statements fill gaps in the original content file and need confirming. Each is marked `data-draft` in the HTML. Where facts are unknown (prices, pay figures, street address), the copy points people to ask rather than stating numbers.

**/apply/**
- a morning
- the date we confirm with you
- Your national ID or another identification document
- Your school certificates or results slips, if you have them
- It is short and practical: some simple measuring, reading a basic drawing and a few tasks in the workshop with an instructor watching. If you are not ready yet, we tell you what to work on and you can try again.

**/catalog/**
- A full cage with safety bars for heavy squats and presses.
- Price on request
- A cable pulldown station for back and arm training.
- A glute-ham developer for hamstring, back and core work.
- A flat-to-incline bench for presses and rows.
- A solid, stable bench for pressing and accessory work.
- Loadable carry handles for grip strength and conditioning.
- A pair of stands for squats and bench work in tight spaces.
- We deliver across Kampala. The delivery charge and lead time depend on the item and where you are, and we confirm both before you pay. Pay by mobile money, bank transfer or cash on delivery.

**/catalog/squat-rack-cage/**
- Built from heavy-gauge steel in our Kazo workshop and made to last. If something bends or cracks, bring it back and we will fix it.
- our students, under an instructor
- Heavy-gauge steel
- Standard, or made to your measurements
- Confirmed with your quote

**/welding-course/**
- five days a week for under a year
- Running beads in the horizontal and vertical positions
- Fillet and butt joints on steel plate
- strike and hold a steady arc, run clean beads on plate, and work safely in a welding booth.
- You practise on your own welding machine in your own booth, with the electrodes, steel and safety gear the work needs.
- Hundreds of hours of hands-on booth time
- Your instructor is an experienced welder who works beside you in the booth, not at the front of a lecture hall.

**/donate/**
- Safety kit
- Full course
- Monthly gift
- Every shilling goes back into the school.
- now works on the workshop floor with a trade in his hands
- Registration details, board members and our latest annual report are available on request. Message us on WhatsApp or email kazotechnicalschool@gmail.com.

**/fees/**
- Confirmed at your interview
- A scholarship can reduce it
- Electrodes, steel and consumables for booth practice
- Pay registration when you register, and each semester's fee at the start of that semester. We accept mobile money, bank transfer and cash. If you need to pay in instalments, ask us at your interview.

**Home + footer**
- Registration is UGX 35,000. Semester one is UGX 800,000, which covers tuition, meals on training days and student requirements. You bring your own safety boots and dust masks. Every fee is listed on the fees page, and scholarships are available for students who qualify.
- Under a year. The course runs over two semesters, and you spend two-thirds of that time in the booth with a machine in your hands.
- A trained welder in Kampala often earns more than someone with an office job, because there are fewer trained welders. Pay rises as you move from trainee to qualified, certified and self-employed work. See what welders earn.
- Yes. We help you find work when you finish, and 94% of our 2025 graduates found employment.
- You don't need a degree or any welding experience. You need to be ready to work with your hands, turn up every day and sit a short practical placement test at the school.
- Nothing yet. Don't buy anything until after your interview. You'll need safety boots that cover the ankle, dust masks and safety glasses (we supply glasses for UGX 5,000), and we'll tell you exactly what to get.
- Safety boots with safety toes that cover the ankle, dust masks to protect your lungs, and clean, scratch-free safety glasses. Your kit is checked at the start of every training day.
- One focused course in arc welding and metal fabrication, over two semesters. Semester one covers arc welding fundamentals. Semester two covers fabrication and reading engineering drawings. One-third is classroom theory, two-thirds is booth practice, with fifteen students to one instructor.
- Steady hands and patience come first. Employers also want someone who can read a drawing, weld without warping the work, turn up on time and leave the site safe. We teach all of it.
- Across Uganda's industrial sector: construction and steel structures, food-processing equipment, gates, furniture and roofing, and infrastructure projects. Many welders also run their own workshops.
- If you want to be paid for what your hands can do, yes. The course takes under a year, trains you to American Welding Society standards and ends with help finding work. 94% of our 2025 graduates found employment.
- 8:00am to 5:00pm

**/welding-jobs-uganda/**
- structural frames, roofing trusses, warehouses and bridges
- processing machines, work tables, tanks and storage
- pipework, tanks and the steelwork behind national projects
- Entry-level pay
- A steady monthly wage
- Contract rates, the highest on site
- Set by your own orders
- Want current Kampala pay figures? They are in the free Welding Pack.
- the flat, horizontal and vertical positions
- Before you graduate, our administrators contact Kampala-area companies that hire welders, tell them which students are ready and set up interviews. We keep helping after you finish until you find work.

**/success-stories/**
- At Kazo he learned to strike an arc, read a drawing and turn it into steel. He now works on the workshop floor with a trade in his hands. Like many welders in Kampala, he earns more than someone with an office job, because there are fewer of them.
- Then he faced the choice many school leavers face: wait for an office job that might never come, or learn a trade industry is hiring for. He chose welding. At Kazo he trained in the booth and learned to read engineering drawings, and he now works in a Kampala fabrication yard.
- a trade he can build a life on
- Allan came to Kazo with no welding experience. Like every student, he started on a Saturday morning with a helmet and his first arc.
- Two semesters later, after months in the booth learning to weld to American Welding Society standards, he left with a certificate and a trade in his hands.

**/visit/**
- Take a taxi towards Kazo and ask for Kazo Muganzirwazza. Call us when you are close and we will guide you in.
- Board a taxi heading to Kazo and ask the conductor to drop you at Kazo Muganzirwazza.
- Ask for Kazo Technical School in Kazo Muganzirwazza, or call us and hand the phone to the rider.

## Photos

12 photos, compressed into `assets/img/photos/` as AVIF (with JPEG fallback) at 800px and 1400px. Phones download about 30 KB per photo. The original large files in the folder root (`hero.jpg`, `kazo*.jpg`) are no longer used by the site.

The graduate stories and product cards use crimson brand panels, not photos. None of the photos is confirmed to show Oliver, Pius or Allan, and none shows the gym equipment. Send those photos and they can replace the panels.

## Motion and smooth scrolling

- Libraries (CDN, pinned, with integrity hashes): GSAP 3.15.0 + ScrollTrigger + SplitText, Lenis 1.3.26. About 54 KB gzipped.
- `assets/js/motion.js` holds all motion code; `assets/css/motion.css` holds the start states and the Lenis rules.
- Opt elements in with `data-anim="words" | "fade-up" | "image" | "parallax"`. The comment at the top of `motion.js` explains each one.
- Content is only hidden while `<html>` has the `js-anim` class. A tiny inline script in each `<head>` adds it, but only when reduced motion is off, and removes it after 3s if the motion code never ran.

## Videos

- `.video[data-video="YOUTUBE_ID"]`: a poster image plus a link until the video is played (`site.js` loads the player).
- Add `data-video-autoplay` to autoplay muted when in view. This happens on desktop only, and not for data-saver or reduced-motion users. Clicking anywhere on the video plays it from the start with sound.
- Videos in use: "A day in a student's life" (home "Come and see the workshop" section and the visit page header), and the bend test / principal interview (course page, "Training employers recognise").
