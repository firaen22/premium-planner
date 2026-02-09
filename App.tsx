import React from 'react';
import Calculator from './components/Calculator';

function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-indigo-600 rounded flex items-center justify-center text-white font-bold text-xl mr-3">
              P
            </div>
            <span className="font-bold text-xl tracking-tight text-gray-900">Premium Planner</span>
          </div>
          <div className="text-xs text-gray-500 font-medium">
             內部使用 | Internal Use Only
          </div>
        </div>
      </header>
      <main>
        <Calculator />
      </main>
    </div>
  );
}

export default App;