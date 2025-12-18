import { getUserAccounts } from '@/actions/dashboard';
import { defaultCategories } from '@/data/categories';
import React from 'react'
import AddTransactionForm from '../_components/transaction-form';
import { getTransaction } from '@/actions/transaction';


const AddTransactionPage = async ({searchParams}) => {
    const accounts = await getUserAccounts();
    const editId = searchParams?.edit || null;
    

    let initialData = null;
    if (editId) {
      const transaction = await getTransaction(editId);
      initialData = transaction;
    }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
       <h1 className="text-center text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
  {editId ? "Edit" : "Add"} Transaction
</h1>

        <AddTransactionForm
        accounts={accounts}
        categories={defaultCategories}
        editMode={!!editId}
        initialData={initialData}
        editId={editId}
        />
    </div>
  )
};

export default AddTransactionPage;