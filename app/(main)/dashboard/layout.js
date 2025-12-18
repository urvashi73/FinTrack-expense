import React, { Suspense } from 'react'
import DashboardPage from './page';
import { BarLoader } from 'react-spinners';



const DashboardLayout = () => {
  return (
    <div className='px-5 py-6'> 
     <h1 className='text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text mb-6'>Dashboard</h1>  
     <Suspense
        fallback={<BarLoader className="mt-4" width={"100%"} color="#9333ea" /> }
     >
        
     </Suspense>
     <DashboardPage/>
    </div>
   
   
  );
};

export default DashboardLayout;