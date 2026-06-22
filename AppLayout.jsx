import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import AppLayout from './AppLayout';
import USHeatMap from './USHeatMap';
import SavedFormulasList from './SavedFormulasList';

export default function App() {
  return (
    // 1. Added basename back for GitHub Pages routing alignment
    <BrowserRouter basename="/MesoMapperWX">
      <Routes>
        {/* Main app */}
        <Route element={<AppLayout />}>

          {/* Dashboard */}
          <Route index element={<USHeatMap />} />

          {/* Library - 2. Passed safe placeholder fallbacks so it won't crash on mounting */}
          <Route
            path="library"
            element={
              <SavedFormulasList 
                formulas={[]} 
                onSelect={() => {}} 
                onDelete={() => {}} 
                isLoading={false} 
              />
            }
          />

        </Route>
      </Routes>
    </BrowserRouter>
  );
}
