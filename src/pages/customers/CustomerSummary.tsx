import { Users, UserCheck, Monitor, TrendingUp, TrendingDown } from 'lucide-react';
import { customerStats } from '@/data/customersData';

function StatIcon({ icon: Icon }: { icon: React.ElementType }) {
  return (
    <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-emerald-50">
      <Icon className="size-7 text-emerald-500" />
    </div>
  );
}

export default function CustomerSummary() {
  const { totalCustomers, members, activeNow } = customerStats;

  return (
    <section aria-label="Customer statistics" className="flex items-center divide-x divide-gray-100 rounded-2xl bg-white px-6 py-5 shadow-sm">

      {/* Total Customers */}
      <div className="flex flex-1 items-center gap-4 pr-8">
        <StatIcon icon={Users} />
        <dl>
          <dt className="text-sm text-gray-400">{totalCustomers.label}</dt>
          <dd className="text-3xl font-bold text-gray-900">
            {totalCustomers.value.toLocaleString()}
          </dd>
          <dd className="mt-1 flex items-center gap-1 text-xs font-medium text-emerald-500">
            <TrendingUp className="size-3.5" aria-hidden="true" />
            <span>{totalCustomers.change}% {totalCustomers.period}</span>
          </dd>
        </dl>
      </div>

      {/* Members */}
      <div className="flex flex-1 items-center gap-4 px-8">
        <StatIcon icon={UserCheck} />
        <dl>
          <dt className="text-sm text-gray-400">{members.label}</dt>
          <dd className="text-3xl font-bold text-gray-900">
            {members.value.toLocaleString()}
          </dd>
          <dd className="mt-1 flex items-center gap-1 text-xs font-medium text-rose-500">
            <TrendingDown className="size-3.5" aria-hidden="true" />
            <span>{members.change}% {members.period}</span>
          </dd>
        </dl>
      </div>

      {/* Active Now */}
      <div className="flex flex-1 items-center gap-4 pl-8">
        <StatIcon icon={Monitor} />
        <dl>
          <dt className="text-sm text-gray-400">{activeNow.label}</dt>
          <dd className="text-3xl font-bold text-gray-900">
            {activeNow.value.toLocaleString()}
          </dd>
          <dd className="mt-1 flex items-center">
            {activeNow.avatars.map((avatar, i) => (
              <span
                key={avatar.id}
                className={`flex size-5 items-center justify-center rounded-full text-[9px] font-bold text-white ring-2 ring-white ${avatar.bg} ${i !== 0 ? '-ml-1.5' : ''}`}
                aria-label={avatar.initials}
              >
                {avatar.initials}
              </span>
            ))}
          </dd>
        </dl>
      </div>

    </section>
  );
}
