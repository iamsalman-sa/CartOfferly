# Shopify Integration Guide for Premium Cart Rewards

This guide will help you integrate your milestone rewards from your Render admin app into your Shopify store (www.realbeauty.store).

## Step 1: Update Configuration

1. **Find your Render app URL**: 
   - Go to your Render dashboard
   - Find your deployed admin app URL (should be something like `https://your-app-name.onrender.com`)

2. **Update the integration script**:
   - Open `public/shopify-cart-integration.js`
   - Replace `https://your-render-app.onrender.com` with your actual Render URL
   - Update `shopifyStoreId` if needed (should match your admin database store ID)

## Step 2: Add Script to Your Shopify Theme

### Method 1: Theme Editor (Recommended)
1. Go to your Shopify admin → **Online Store** → **Themes**
2. Click **Actions** → **Edit code** on your live theme
3. Open `layout/theme.liquid`
4. Before the closing `</body>` tag, add:

```liquid
<!-- Premium Cart Rewards Integration -->
<script src="https://your-render-app.onrender.com/shopify-cart-integration.js"></script>
```

### Method 2: Assets Upload
1. In theme editor, go to **Assets** folder
2. Click **Add a new asset** → **Create a blank file**
3. Name it `cart-rewards.js`
4. Copy the contents of `public/shopify-cart-integration.js` into this file
5. In `layout/theme.liquid`, add before `</body>`:

```liquid
<script src="{{ 'cart-rewards.js' | asset_url }}"></script>
```

## Step 3: Add Milestone Container (Optional)

For better control over placement, add this to your cart template:

```liquid
<!-- In cart-drawer.liquid or cart.liquid -->
<div id="cart-rewards-milestones"></div>
```

## Step 4: Configure CORS (Important!)

Your Render admin app needs to allow requests from your Shopify store:

1. Add to your `server/index.ts` (before routes):

```javascript
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://realbeauty.store');
  res.header('Access-Control-Allow-Origin', 'https://www.realbeauty.store');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  next();
});
```

2. Redeploy your Render app

## Step 5: Test Integration

1. Visit www.realbeauty.store
2. Add items to your cart
3. You should see:
   - Milestone progress bar
   - List of your milestones from admin
   - Real-time updates as cart value changes
   - Celebration notifications when milestones unlock

## Troubleshooting

### Milestones not showing:
- Check browser console for errors (F12 → Console)
- Verify your Render app URL is correct
- Ensure CORS is configured
- Check that milestones exist in your admin database

### Cart value not updating:
- Verify Shopify cart API is accessible (`/cart.js`)
- Check console for cart polling errors
- Some themes may need different cart selectors

### Styling issues:
- The script includes built-in CSS
- You can customize styles in the script
- Add `!important` to override theme styles

## Customization

### Change milestone appearance:
Edit the CSS in the script's `<style>` section

### Adjust polling frequency:
Change `cartPollInterval` in CONFIG (default: 2 seconds)

### Custom notification styles:
Modify `showMilestoneUnlockedNotification()` function

## Support

If you encounter issues:
1. Check browser console for errors
2. Verify admin app is accessible from Shopify domain
3. Test milestone API endpoints directly
4. Check Render app logs for API errors

Your milestones should now appear on your Shopify store! 🎉