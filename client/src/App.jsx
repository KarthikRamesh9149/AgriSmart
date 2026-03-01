import { ErrorBoundary } from './components/ErrorBoundary';
import MapScene from './components/MapScene';
import { AppStateProvider } from './context/AppStateContext';
import './App.css';

function App() {
  return (
    <ErrorBoundary>
      <div className="app">
        <AppStateProvider>
          <MapScene />
        </AppStateProvider>
      </div>
    </ErrorBoundary>
  );
}

export default App;
