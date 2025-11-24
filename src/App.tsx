// src/App.tsx
import { useEffect } from 'react';
import { initializeEssentia } from './services/audioAnalyzer';
import LibraryImporter from './components/LibraryImporter'; // Assuming this component will be created

function App() {
  useEffect(() => {
    // Initialize Essentia.js when the app mounts
    initializeEssentia().catch(error => {
      console.error("Failed to initialize Essentia.js:", error);
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans flex flex-col">
      {/* Header */}
      <header className="bg-gray-800 p-4 shadow-md flex justify-between items-center">
        <h1 className="text-2xl font-bold text-purple-400">BeatCatalog</h1>
        <nav>
          {/* Navigation items can go here */}
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow p-4 container mx-auto">
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-200 mb-4">Your Beat Library</h2>
          <LibraryImporter />
          {/* BeatTable component will go here */}
          {/* <BeatTable /> */}
        </section>

        {/* Other sections or dashboard components */}
      </main>

      {/* Player Footer (persistent) */}
      <footer className="bg-gray-800 p-4 shadow-lg sticky bottom-0 left-0 right-0">
        {/* Wavesurfer.js player will be integrated here */}
        <p className="text-center text-gray-400">Player Controls (Wavesurfer.js placeholder)</p>
        {/* <PlayerFooter /> */}
      </footer>
    </div>
  );
}

export default App;
