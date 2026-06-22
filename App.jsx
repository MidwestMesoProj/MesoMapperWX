import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

import PageNotFound from './lib/PageNotFound';
import AppLayout from '@/components/weather/AppLayout';
import Dashboard from '@/pages/Dashboard';
import FormulaLibrary from '@/pages/FormulaLibrary';

function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <Router>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/library" element={<FormulaLibrary />} />
          </Route>

          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </Router>

      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
