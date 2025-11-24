import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LibraryImporter from './LibraryImporter';
import * as audioAnalyzer from '../services/audioAnalyzer';
import { db } from '../db/db';

// Mock dependencies
vi.mock('../db/db', () => {
  return {
    db: {
      beats: {
        add: vi.fn().mockResolvedValue('new-id'),
      },
    },
    Beat: class {},
  };
});

vi.mock('../services/audioAnalyzer', () => ({
  analyzeAudioFile: vi.fn(),
}));

describe('LibraryImporter Integration Simulation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('simulates importing an mp3 and logs output', async () => {
    // 1. Setup Console Spies
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // 2. Mock Analyzer Success
    (audioAnalyzer.analyzeAudioFile as any).mockResolvedValue({
      bpm: 120.5,
      key: 'C Major',
      energy: 0.9,
    });

    render(<LibraryImporter />);

    // 3. Find the file input
    // The input is hidden, so we look for it by selector directly or by associated label if exists (it doesn't).
    // The button triggers the click, but we can fire change directly on the input.
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeTruthy();

    // 4. Create a fake file
    const file = new File(['(binary content)'], 'test_audio.mp3', { type: 'audio/mpeg' });

    // 5. Trigger Change Event
    fireEvent.change(fileInput, { target: { files: [file] } });

    // 6. Wait for Success or Error
    // We expect "Successfully imported 1 beats!" alert or text.
    // The component uses `alert` for success in `handleFileChange`?
    // Let's check the code: "alert(`Successfully imported ${importedCount} beats!`);"
    // And also sets state: <p className="mt-3 text-green-400">Successfully imported {importedCount} new beats!</p>
    
    // Mock alert
    vi.spyOn(window, 'alert').mockImplementation(() => {});

    await waitFor(() => {
      expect(screen.getByText(/Successfully imported 1 new beats!/i)).toBeTruthy();
    });

    // 7. Analyze Output
    const logs = consoleLogSpy.mock.calls;
    const errors = consoleErrorSpy.mock.calls;
    const dbCalls = vi.mocked(db.beats.add).mock.calls;

    consoleLogSpy.mockRestore(); // Restore log to print report
    consoleErrorSpy.mockRestore();

    console.log('--- TEST SIMULATION REPORT ---');
    console.log('Console Logs:', JSON.stringify(logs, null, 2));
    console.log('Console Errors:', JSON.stringify(errors, null, 2));
    console.log('DB Add Call:', JSON.stringify(dbCalls, null, 2));
    
    // Check for error text in DOM
    const errorText = screen.queryByText(/Error:/i);
    console.log('Error Text on Screen:', errorText ? errorText.textContent : 'None');
    console.log('--- END REPORT ---');
  });

  it('simulates import failure and reports error', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock Analyzer Failure
    (audioAnalyzer.analyzeAudioFile as any).mockRejectedValue(new Error('Corrupt file'));

    render(<LibraryImporter />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File([''], 'broken.mp3', { type: 'audio/mpeg' });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
         // wait for async operations
    });
    
    const errors = consoleErrorSpy.mock.calls;
    consoleErrorSpy.mockRestore(); // Restore to print

    console.log('--- FAILURE SIMULATION REPORT ---');
    console.log('Console Errors:', JSON.stringify(errors, null, 2));
  });
});
