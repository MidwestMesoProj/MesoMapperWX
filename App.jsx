import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

// Changed these imports because your files are sitting directly in the root directory!
import AppLayout from './AppLayout'; 
import Dashboard from './USHeatMap'; // Using your USHeatMap/Map components as the main view
import FormulaLibrary from './FormulaManager'; // Using your FormulaManager as the library view

function App() {
  return (
    <Router>
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
