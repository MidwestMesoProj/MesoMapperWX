import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

// Kept your local file paths exactly as they are
import AppLayout from './AppLayout'; 
import Dashboard from './USHeatMap'; 
import FormulaLibrary from './FormulaManager'; 

function App() {
  return (
    // Added basename so React Router knows it's hosted in a subfolder on GitHub Pages
    <Router basename="/MesoMapperWX">
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/library" element={<FormulaLibrary />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
