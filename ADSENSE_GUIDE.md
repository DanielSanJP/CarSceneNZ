# Google AdSense Implementation Guide for Car Scene NZ

## 📋 AdSense Policies Checklist

### ✅ Content Requirements

- [x] No illegal content
- [x] No adult/sexual content
- [x] No violence or hate speech
- [x] Original content (your car community is original)
- [x] Clear navigation structure

### ✅ Traffic Requirements

- [ ] Don't click your own ads
- [ ] Don't ask others to click ads
- [ ] Use genuine traffic (no bots or paid traffic)
- [ ] Site must be publicly accessible

### ✅ Ad Placement Rules

- [ ] Ads must be distinguishable from content
- [ ] No accidental clicks (keep ads away from buttons/links)
- [ ] Maximum 3 ads per page (recommended)
- [ ] Mobile-friendly responsive design

---

## 🎯 Step-by-Step: Creating Display Ads in AdSense Dashboard

### Step 1: Access Ad Units

1. Go to https://www.google.com/adsense
2. Click **"Ads"** in left sidebar
3. Click **"By ad unit"** tab
4. Click **"Create new ad unit"**

### Step 2: Choose Display Ads (Recommended)

1. Click **"Display ads"** (the blue recommended option)
2. This is the best option for your use case because:
   - Works well anywhere on your site
   - Automatically adapts to available space
   - Best for general content sites

### Step 3: Configure Your Ad Unit

#### Name Your Ad Unit

Use descriptive names to track performance:

- `CarSceneNZ_Homepage_Banner`
- `CarSceneNZ_Sidebar_Display`
- `CarSceneNZ_Events_InContent`
- `CarSceneNZ_Garage_Mobile`

#### Choose Ad Size

**Responsive (Recommended)**:

- ✅ Best option for your Next.js app
- Adapts to screen size automatically
- Works on mobile and desktop

**OR Fixed Sizes** (if you need specific dimensions):

- 300x250 (Medium Rectangle) - Most popular
- 728x90 (Leaderboard) - Top banners
- 336x280 (Large Rectangle) - High visibility
- 160x600 (Wide Skyscraper) - Sidebars
- 300x600 (Large Skyscraper) - Sidebars

### Step 4: Get Your Ad Code

After clicking "Create", you'll see:

```html
<script async src="..."></script>
<ins
  class="adsbygoogle"
  data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
  data-ad-slot="1234567890"
  ...
></ins>
<script>
  (adsbygoogle = window.adsbygoogle || []).push({});
</script>
```

**Copy the `data-ad-slot` number** (e.g., `1234567890`)

### Step 5: Repeat for Multiple Placements

Create 4-5 ad units for different areas:

1. Homepage Hero/Banner
2. Sidebar (for events, clubs, garage detail pages)
3. In-content ads (between list items)
4. Mobile footer
5. Profile sidebar

---

## 🚀 Implementation in Your App

### 1. Update Publisher ID

**In `src/app/layout.tsx`:**
Replace `ca-pub-XXXXXXXXXXXXXXXX` with your actual publisher ID (found in AdSense dashboard → Account → Account information)

```tsx
<Script
  async
  src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-YOUR_ACTUAL_ID"
  crossOrigin="anonymous"
  strategy="afterInteractive"
/>
```

**In `src/components/ads/google-ad.tsx`:**
Replace the same publisher ID in the `data-ad-client` attribute.

### 2. Update Ad Slot IDs

**In `src/components/ads/ad-placements.tsx`:**
Replace each `XXXXXXXXXX` with the actual ad slot IDs from your AdSense dashboard.

### 3. Recommended Ad Placements for Your App

#### Homepage (`src/app/page.tsx`)

```tsx
import { BannerAd, InContentAd } from "@/components/ads/ad-placements";

export default function HomePage() {
  return (
    <div>
      <BannerAd className="mb-8" />

      {/* Your featured content */}

      <InContentAd className="my-12" />

      {/* More content */}
    </div>
  );
}
```

#### Event Detail Page (`src/app/events/[id]/page.tsx`)

```tsx
import { SidebarAd } from "@/components/ads/ad-placements";

export default function EventDetailPage() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">{/* Event details */}</div>
      <aside className="space-y-6">
        <SidebarAd />
        {/* Other sidebar content */}
      </aside>
    </div>
  );
}
```

#### Garage List (`src/app/garage/page.tsx`)

```tsx
import { InContentAd } from "@/components/ads/ad-placements";

export default function GaragePage({ cars }) {
  return (
    <div className="space-y-6">
      {cars.slice(0, 5).map((car) => (
        <CarCard key={car.id} car={car} />
      ))}

      <InContentAd />

      {cars.slice(5, 10).map((car) => (
        <CarCard key={car.id} car={car} />
      ))}

      <InContentAd />

      {cars.slice(10).map((car) => (
        <CarCard key={car.id} car={car} />
      ))}
    </div>
  );
}
```

#### Club Detail Page (`src/app/clubs/[id]/page.tsx`)

```tsx
import { SidebarAd, MobileFooterAd } from "@/components/ads/ad-placements";

export default function ClubDetailPage() {
  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">{/* Club details */}</div>
        <aside className="hidden lg:block">
          <SidebarAd />
        </aside>
      </div>

      <MobileFooterAd />
    </>
  );
}
```

---

## 🧪 Testing Your Ads

### Local Development (localhost)

⚠️ **Ads won't show on localhost** - this is normal!

- AdSense only serves ads on live domains
- You'll see empty spaces where ads should be

### Testing on Live Site

1. Deploy your site to production
2. Wait 10-20 minutes for ads to start appearing
3. **Don't click your own ads!** (This violates AdSense policies)
4. Use different device/incognito to preview

### Verification Checklist

- [ ] AdSense script loads (check browser console)
- [ ] Ad containers appear with correct dimensions
- [ ] No console errors
- [ ] Responsive behavior works on mobile
- [ ] Ads don't interfere with navigation

---

## 📊 Best Practices for Car Scene NZ

### Ad Density

- **Homepage**: 2 ads maximum
- **Detail Pages**: 1 sidebar + 1 in-content
- **List Pages**: 1 ad per 5-10 items

### Ad Positions

1. **High-value pages**: Event details, Club details, Car profiles
2. **High-traffic pages**: Homepage, Garage list, Events list
3. **Avoid**: Login/Register pages, Form pages

### Mobile Optimization

- Use responsive ad units
- Fewer ads on mobile (1-2 per page)
- Place ads after content, not before
- Ensure 1-2 screen heights of content before first ad

### Performance

- Ads load after interactive (won't slow down page load)
- Use lazy loading for ads below the fold (optional future enhancement)
- Monitor Core Web Vitals in Google Search Console

---

## ⚠️ Common Issues & Solutions

### Ads Not Showing

- **Wait 24-48 hours** after adding code (new sites)
- Check your publisher ID is correct
- Ensure site is publicly accessible
- Verify no ad blockers are active
- Check browser console for errors

### Blank Ad Spaces

- Normal for new ad units (takes time to fill)
- Normal if user uses ad blocker
- Check ad slot IDs are correct

### Policy Violations

- Remove ads from prohibited pages
- Don't modify ad code
- Don't click own ads
- Ensure content meets policies

---

## 📈 Monitoring Performance

### AdSense Dashboard

- Check **"Reports"** for earnings
- View **"Ad units"** for individual performance
- Monitor **"Policy center"** for any issues

### Key Metrics

- **RPM** (Revenue per 1000 impressions)
- **CTR** (Click-through rate): 1-2% is typical
- **Coverage**: % of ad requests filled

### Optimization Tips

- Test different ad placements
- A/B test ad sizes
- Remove underperforming ad units
- Focus ads on high-traffic pages

---

## 🔒 Compliance Reminders

✅ **Do:**

- Place ads in natural reading flow
- Use responsive ad units
- Monitor policy center regularly
- Focus on quality content

❌ **Don't:**

- Click your own ads
- Encourage clicks ("Click here!", "Support us!")
- Place ads on error/404 pages
- Modify ad code
- Place ads in emails or software

---

## 📝 Quick Reference: Your Ad Units

Create these ad units in your AdSense dashboard:

| Ad Unit Name                | Type    | Size               | Usage                |
| --------------------------- | ------- | ------------------ | -------------------- |
| CarSceneNZ_Homepage_Banner  | Display | Responsive         | Homepage top         |
| CarSceneNZ_Sidebar_Desktop  | Display | Responsive/300x600 | Detail pages sidebar |
| CarSceneNZ_InContent_Square | Display | 300x250            | Between list items   |
| CarSceneNZ_Mobile_Footer    | Display | Responsive         | Mobile only footer   |
| CarSceneNZ_Events_Banner    | Display | 728x90             | Events list top      |

---

## 🆘 Need Help?

1. **AdSense Help Center**: https://support.google.com/adsense
2. **Policy Center**: Check your AdSense dashboard
3. **Common Issues**: https://support.google.com/adsense/topic/7334578

---

**Next Steps:**

1. ✅ Create 3-5 display ad units in AdSense dashboard
2. ✅ Copy your publisher ID and ad slot IDs
3. ✅ Update the code in `layout.tsx`, `google-ad.tsx`, and `ad-placements.tsx`
4. ✅ Deploy to production
5. ✅ Wait 24-48 hours for ads to start appearing
6. ✅ Monitor performance in AdSense dashboard
