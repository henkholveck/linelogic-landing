# Maintenance Mode Setup

## 🚧 How to Activate Maintenance Mode

This setup allows you to instantly put the site into maintenance mode by changing one line of code.

### Quick Activation
1. Open `app/layout.tsx`
2. Change `<MaintenanceCheck enabled={false} />` to `<MaintenanceCheck enabled={true} />`
3. Deploy to production

### What Happens
- Users get redirected to `/maintenance.html` 
- Beautiful warp background effect with Apple-style design
- Newsletter signup to capture emails during downtime
- Professional "We'll be right back" messaging

### Files Added
- `public/maintenance.html` - The maintenance page with warp effect
- `components/MaintenanceCheck.tsx` - Toggle component
- Updated `app/layout.tsx` - Added maintenance check

### To Deactivate
Simply change `enabled={true}` back to `enabled={false}` and redeploy.

### Alternative Environment Variable Method
You can also use environment variables:
1. Set `NEXT_PUBLIC_MAINTENANCE_MODE=true` in your deployment
2. Keep `enabled={false}` in the code
3. The component will check both the prop and environment variable