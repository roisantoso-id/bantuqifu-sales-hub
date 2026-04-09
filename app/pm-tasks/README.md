# PM Task Assignment (PM任务指派)

## Overview

The PM Task Assignment page is a specialized dashboard for Project Managers to monitor opportunities in P2-P5 pipeline stages and manage the activation process to P6/P7 delivery stages.

## Features

### 1. Department Overview (部门概览)
- **Waiting for P6**: Count of opportunities in P2-P5 stages that haven't been activated
- **In P7**: Count of opportunities currently in the P7 (Final Delivery) stage
- **Delayed**: Count of opportunities that have exceeded their expected close date

### 2. Project Pool Table (商机池表格)
Displays all opportunities ready for activation with the following columns:
- **Opportunity Code**: Unique identifier (e.g., OPP-001)
- **Customer Name**: Associated customer/client name
- **Current Stage**: Current pipeline stage (P2/P3/P4/P5)
- **Amount**: Estimated opportunity value with currency
- **Expected Close Date**: Target completion date
- **Action**: "Activate" button to initiate the activation workflow

### 3. Activation Modal (激活模态框)
When clicking the "Activate" button, a dialog opens to:
- **P6 Target Date**: Set the target date for Materials Collection phase
- **P7 Target Date**: Set the target date for Final Delivery phase
- **Coordination Notes**: Add internal coordination remarks
- **Validation**: Ensures P7 date >= P6 date

## Data Structure

### OpportunityListRow
```typescript
{
  id: string
  opportunityCode: string
  stageId: 'P2' | 'P3' | 'P4' | 'P5'
  customer: {
    customerName: string
  }
  estimatedAmount: number
  currency: 'CNY' | 'USD'
  expectedCloseDate: string (ISO format)
}
```

## Server Actions

### `getPMTaskOpportunitiesAction()`
Fetches all opportunities in P2-P5 stages for the current tenant/organization.

**Returns**: `PMTaskOpportunity[]`

### `getDepartmentMetricsAction()`
Calculates department-wide metrics for the overview cards.

**Returns**: 
```typescript
{
  waitingForP6: number
  inP7: number
  delayed: number
}
```

### `activateOpportunityAction(opportunityId: string, data: {...})`
Updates an opportunity with P6/P7 target dates and coordination notes.

**Parameters**:
- `opportunityId`: Target opportunity ID
- `p6TargetDate`: ISO date string (YYYY-MM-DD)
- `p7TargetDate`: ISO date string (YYYY-MM-DD)
- `coordinationNotes`: Internal coordination text

**Returns**: `{ success: boolean; error?: string }`

## File Structure

```
app/pm-tasks/
├── page.tsx                    # Server component with data fetching
├── pm-tasks-client.tsx         # Main UI with table and state
├── activation-modal.tsx        # Modal for date/note entry
├── department-overview.tsx     # Overview stats cards
├── layout.tsx                  # Route layout with metadata
└── README.md                   # This file
```

## Styling

- **Colors**: Matches the delivery dashboard aesthetic
  - P2-P5 badges: Blue tones
  - Department metrics: Blue (waiting), Green (in-progress), Red (delayed)
  - Activation button: Amber/Orange with yellow hover state
  
- **Layout**: Clean, data-heavy design with:
  - Responsive table with horizontal scroll on mobile
  - Striped rows for readability
  - Hover effects on interactive elements

## Integration

- **Route**: `/pm-tasks` (via sidebar navigation 'PM任务指派')
- **Navigation Type**: Query parameter-based (part of main navigation)
- **User Permissions**: Available to PM role users
- **Database**: Supabase PostgreSQL with real-time sync

## Future Enhancements

- [ ] Bulk activation for multiple opportunities
- [ ] Custom date templates for common P6/P7 scenarios
- [ ] Notification system when activation deadlines approach
- [ ] Historical activation tracking and analytics
- [ ] Department-specific filtering and assignment
