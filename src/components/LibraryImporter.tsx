// src/components/LibraryImporter.tsx
import React, { useState, useRef } from 'react';
import { db, Beat } from '../db/db';
import { analyzeAudioFile } from '../services/audioAnalyzer';
import { v4 as uuidv4 } from 'uuid'; // Assuming uuid is installed: npm install uuid @types/uuid

interface LibraryImporterProps {}

const LibraryImporter: React.FC<LibraryImporterProps> = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importedCount, setImportedCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scanDirectory = async (directoryHandle: FileSystemDirectoryHandle) => {
    for await (const entry of directoryHandle.values()) {
      if (entry.kind === 'directory') {
        await scanDirectory(entry as FileSystemDirectoryHandle); // Recurse into subdirectories
      } else if (entry.kind === 'file') {
        if (entry.name.endsWith('.wav') || entry.name.endsWith('.mp3')) {
          try {
            const fileHandle = entry as FileSystemFileHandle;
            const file = await fileHandle.getFile();
            console.log(`Analyzing file: ${file.name}`);
            const { bpm, key } = await analyzeAudioFile(file);

            const newBeat: Beat = {
              id: uuidv4(),
              title: file.name,
              bpm: parseFloat(bpm.toFixed(2)), // Round BPM for cleaner storage
              key: key,
              tags: [], // Tags can be added later by the user
              fileHandle: fileHandle, // Store the file handle
            };
            await db.beats.add(newBeat);
            setImportedCount((prev) => prev + 1);
            console.log(`Added beat: ${newBeat.title}`);
          } catch (e: any) {
            console.error(`Error processing file ${entry.name}:`, e);
            setError(`Failed to process ${entry.name}: ${e.message}`);
          }
        }
      }
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setLoading(true);
    setError(null);
    setImportedCount(0);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.name.endsWith('.wav') || file.name.endsWith('.mp3')) {
          try {
            console.log(`Analyzing file: ${file.name}`);
            const { bpm, key } = await analyzeAudioFile(file);

            const newBeat: Beat = {
              id: uuidv4(),
              title: file.name,
              bpm: parseFloat(bpm.toFixed(2)),
              key: key,
              tags: [],
              fileBlob: file, // Store the blob/file directly for Firefox
            };
            await db.beats.add(newBeat);
            setImportedCount((prev) => prev + 1);
          } catch (e: any) {
            console.error(`Error processing file ${file.name}:`, e);
            // Don't stop the whole process for one bad file, but maybe warn?
          }
        }
      }
      alert(`Successfully imported ${importedCount} beats!`);
    } catch (e: any) {
       console.error('File scanning failed:', e);
       setError(`Error importing library: ${e.message}`);
    } finally {
      setLoading(false);
      // Reset input so same directory can be selected again if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleImportClick = async () => {
    // Check if the File System Access API is supported
    if ('showDirectoryPicker' in window) {
      setLoading(true);
      setError(null);
      setImportedCount(0);
      try {
        // @ts-ignore: window.showDirectoryPicker is a new API
        const directoryHandle = await window.showDirectoryPicker();
        await scanDirectory(directoryHandle);
        alert(`Successfully imported ${importedCount} beats!`);
      } catch (e: any) {
        console.error('Directory picker or scanning failed:', e);
        if (e.name === 'AbortError') {
          setError('Directory selection cancelled.');
        } else {
          setError(`Error importing library: ${e.message}`);
        }
      } finally {
        setLoading(false);
      }
    } else {
      // Fallback for Firefox/Safari: Trigger the hidden file input
      if (fileInputRef.current) {
        fileInputRef.current.click();
      } else {
        setError('File import is not supported in this browser.');
      }
    }
  };

  return (
    <div className="p-4 bg-gray-800 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold text-gray-200 mb-3">Import Local Library</h3>
      <p className="text-gray-400 mb-4">
        Select a local folder to scan for .wav and .mp3 files. BeatCatalog will analyze them and store
        the metadata locally. Files are never uploaded.
      </p>
      
      {/* Hidden input for fallback */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
        // @ts-ignore: non-standard attributes for folder selection
        webkitdirectory=""
        directory=""
        multiple
      />

      <button
        onClick={handleImportClick}
        disabled={loading}
        className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg
                   focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50
                   disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 ease-in-out"
      >
        {loading ? 'Scanning...' : 'Import Folder'}
      </button>

      {loading && (
        <p className="mt-3 text-purple-300">Scanning directory... Found {importedCount} beats so far.</p>
      )}
      {error && <p className="mt-3 text-red-400">Error: {error}</p>}
      {!loading && importedCount > 0 && (
        <p className="mt-3 text-green-400">Successfully imported {importedCount} new beats!</p>
      )}
    </div>
  );
};

export default LibraryImporter;
