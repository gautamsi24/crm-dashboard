export const customerStats = {
  totalCustomers: {
    label: 'Total Customers',
    value: 5_423,
    change: 16,
    changeType: 'positive' as const,
    period: 'this month',
  },
  members: {
    label: 'Members',
    value: 1_893,
    change: 1,
    changeType: 'negative' as const,
    period: 'this month',
  },
  activeNow: {
    label: 'Active Now',
    value: 189,
    avatars: [
      { id: 1, initials: 'JC', bg: 'bg-pink-400' },
      { id: 2, initials: 'FM', bg: 'bg-amber-400' },
      { id: 3, initials: 'RR', bg: 'bg-blue-400' },
      { id: 4, initials: 'MM', bg: 'bg-green-400' },
      { id: 5, initials: 'JB', bg: 'bg-purple-400' },
    ],
  },
};
