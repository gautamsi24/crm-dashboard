import { useState } from 'react';
import CustomerSummary from '@/pages/customers/CustomerSummary';
import CustomersTable from '@/pages/customers/CustomersTable';
import DocumentWorkspace from '@/pages/customers/DocumentWorkspace';
import type { Customer } from '@/lib/mockApi';

export default function Customers() {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  return (
    <section aria-labelledby="customers-table-heading" className="flex flex-col gap-6">
      <CustomerSummary />

      <CustomersTable
        onRowClick={setSelectedCustomer}
        selectedCustomerId={selectedCustomer?.id ?? null}
      />

      <DocumentWorkspace
        customer={selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
      />
    </section>
  );
}
