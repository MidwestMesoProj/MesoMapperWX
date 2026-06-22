import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import AppLayout from './AppLayout';
import USHeatMap from './USHeatMap';
import SavedFormulasList from './SavedFormulasList';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Main app */}
        <Route element={<AppLayout />}>

          {/* Dashboard */}
          <Route index element={<USHeatMap />} />

          {/* Library */}
          <Route
            path="library"
            element={<SavedFormulasList />}
          />

        </Route>

      </Routes>
    </BrowserRouter>
  );
}
