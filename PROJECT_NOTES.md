# Project Notes for AI Editors

## Code Style Guidelines

### Comments
- **Minimal comments only** - This project is edited exclusively by AI
- Only add comments for complex business logic that is not self-evident
- No redundant comments explaining obvious code
- No TODO comments - use issue tracking instead

### UI Philosophy
- **Barebone UI** - Stripped down to essential functionality
- No decorative elements, gradients, or fancy styling
- Basic functional components only
- Advanced UI/UX will be implemented later as a separate initiative

### Code Optimization
- Reduce line count wherever possible without sacrificing readability
- Combine similar logic
- Remove redundant validations
- Use concise patterns

## Features

### Member Statistics
- Member statistics dashboard has been **REMOVED**
- Focus is on core member/class/coupon management only

### Coupon System
- Profile-based coupon templates
- Marketplace for selling coupons
- Sharing system for non-members only

## Deployment
- Push to feature branches (claude/*-sessionId)
- Vercel auto-deploys to preview
- Production promotion must be done via Vercel dashboard or by merging to main branch
