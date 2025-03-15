// app/page.tsx
'use client';
import { useState, useRef, useEffect } from 'react';
import CameraFeed from './components/CameraFeed';
import MetricsCard from './components/MetricsCard';
import SignalCombinationSelector from './components/SignalCombinationSelector';
import ChartComponent from './components/ChartComponent';
import usePPGProcessing from './hooks/usePPGProcessing';
import useSignalQuality from './hooks/useSignalQuality';

export default function Home() {
  const [isRecording, setIsRecording] = useState(false);
  const [isSampling, setIsSampling] = useState(false); // New state for sampling
  const [isUploading, setIsUploading] = useState(false);
  const [signalCombination, setSignalCombination] = useState('default');
  const [showConfig, setShowConfig] = useState(false);

  const [currentSubject, setCurrentSubject] = useState('');
  const [confirmedSubject, setConfirmedSubject] = useState('');
  const [historicalData, setHistoricalData] = useState({ avgHeartRate: 0, avgHRV: 0, lastAccess: null });

  // Define refs for video and canvas
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const {
    ppgData,
    valleys,
    heartRate,
    hrv,
    processFrame,
    startCamera,
    stopCamera,
  } = usePPGProcessing(isRecording, signalCombination, videoRef, canvasRef);

  const { signalQuality, qualityConfidence } = useSignalQuality(ppgData);

  // Start or stop recording
  useEffect(() => {
    if (isRecording) {
      startCamera();
    } else {
      stopCamera();
    }
  }, [isRecording]);

  useEffect(() => {
    let animationFrame: number;
    const processFrameLoop = () => {
      if (isRecording) {
        processFrame(); // Call the frame processing function
        animationFrame = requestAnimationFrame(processFrameLoop);
      }
    };
    if (isRecording) {
      processFrameLoop();
    }
    return () => {
      cancelAnimationFrame(animationFrame); // Clean up animation frame on unmount
    };
  }, [isRecording]);

  // Automatically send data every 10 seconds
  // Automatically send data every second when sampling is enabled
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (isSampling && ppgData.length > 0) {
      intervalId = setInterval(() => {
        pushDataToMongo();
      }, 10000); // Send data every second
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isSampling, ppgData]);

  const confirmUser = () => {
    if (currentSubject.trim()) {
      setConfirmedSubject(currentSubject.trim());
      fetchHistoricalData(currentSubject.trim());
    } else {
      alert('Please enter a valid Subject ID.');
    }
  };

  const fetchHistoricalData = async (subjectId: string) => {
    try {
      const response = await fetch(`/api/last-access?subjectId=${subjectId}`);
      const result = await response.json();
      if (result.success) {
        setHistoricalData({
          avgHeartRate: result.avgHeartRate,
          avgHRV: result.avgHRV,
          lastAccess: result.lastAccess,
        });
      } 
    } catch (error) {
      console.error('Network error:', error);
    }
  };

  const pushDataToMongo = async () => {
    if (isUploading) return; // Prevent overlapping calls

    setIsUploading(true); // Lock the function
    if (ppgData.length === 0) {
      console.warn('No PPG data to send to MongoDB');
      return;
    }
    // Prepare the record data – adjust or add additional fields as needed
    const recordData = {
      subjectId: confirmedSubject || 'unknown',
      heartRate: {
        bpm: isNaN(heartRate.bpm) ? 0 : heartRate.bpm, // Replace NaN with "ERRATIC"
        confidence: hrv.confidence || 0,
      },
      hrv: {
        sdnn: isNaN(hrv.sdnn) ? 0 : hrv.sdnn, // Replace NaN with "ERRATIC"
        confidence: hrv.confidence || 0,
      },

      ppgData: ppgData, // Use the provided ppgData array
      timestamp: new Date(),
    };

    try {
      // Make a POST request to your backend endpoint that handles saving to MongoDB
      const response = await fetch('/api/save-record', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(recordData),
      });

      const result = await response.json();
      if (result.success) {
        console.log('✅ Data successfully saved to MongoDB:', result.data);
      } else {
        console.error('❌ Upload failed:', result.error);
      }
    } catch (error) {
      console.error('🚨 Network error - failed to save data:', error);
    } finally {
      setIsUploading(false); // Unlock the function
    }
  };

  return (
    <div className="flex flex-col items-center p-4 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-center justify-between w-full max-w-6xl mb-6">
        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">HeartLen</h1>

        {/* Buttons: Recording and Sampling */}
        <div className="flex items-center gap-2">
          {/* Recording Button */}
          <button
            onClick={() => setIsRecording(!isRecording)}
            className={`p-3 rounded-lg text-sm transition-all duration-300 ${
              isRecording
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-cyan-500 hover:bg-cyan-600 text-white'
            }`}
          >
            {isRecording ? '⏹ STOP' : '⏺ START'} RECORDING
          </button>

          {/* Sampling Button */}
          <button
            onClick={() => setIsSampling(!isSampling)}
            className={`p-3 rounded-lg text-sm transition-all duration-300 ${
              isSampling
                ? 'bg-green-500 hover:bg-green-600 text-white'
                : 'bg-gray-500 hover:bg-gray-600 text-white'
            }`}
            disabled={!isRecording} // Enable only when recording is active
          >
            {isSampling ? '⏹ STOP SAMPLING' : '⏺ START SAMPLING'}
          </button>
        </div>
      </div>

      {/* User Panel */}
      <div className="w-full max-w-6xl mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="flex flex-col md:flex-row items-center gap-4">
          {/* Input Field */}
          <input
            type="text"
            value={currentSubject}
            onChange={(e) => setCurrentSubject(e.target.value)}
            placeholder="Enter Subject ID"
            className="w-full md:w-64 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />

          {/* Confirm Button */}
          <button
            onClick={confirmUser}
            className="w-full md:w-auto bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded-md transition-all duration-300"
          >
            Confirm User
          </button>
        </div>

        {/* Historical Data Display */}
        {confirmedSubject && historicalData.lastAccess && (
          <div className="mt-4 text-gray-700 dark:text-gray-300">
            <p><span className="font-semibold">Last Access:</span> {historicalData.lastAccess.toLocaleString()}</p>
            <p><span className="font-semibold">Avg Heart Rate:</span> {historicalData.avgHeartRate} BPM</p>
            <p><span className="font-semibold">Avg HRV:</span> {historicalData.avgHRV} ms</p>
          </div>
        )}
      </div>

      {/* Main Grid: Camera and Chart Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-6xl">
        {/* Left Column: Camera Feed and Config */}
        <div className="space-y-6">
          {/* Camera Feed */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Camera Feed</h2>
            <CameraFeed videoRef={videoRef} canvasRef={canvasRef} />
          </div>

          {/* Signal Combination Selector */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
            <button
              onClick={() => setShowConfig((prev) => !prev)}
              className="w-full px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-md transition-all duration-300"
            >
              {showConfig ? 'Hide Config' : 'Show Config'}
            </button>
            {showConfig && (
              <div className="mt-4">
                <SignalCombinationSelector
                  signalCombination={signalCombination}
                  setSignalCombination={setSignalCombination}
                />
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Chart, Metrics, and Save Button */}
        <div className="space-y-6">
          {/* Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">PPG Signal Chart</h2>
            <ChartComponent ppgData={ppgData} valleys={valleys} />
          </div>

          {/* Save Data to MongoDB Button */}
          <button
            onClick={pushDataToMongo}
            className="w-full px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md transition-all duration-300"
          >
            Save Data to MongoDB
          </button>

          {/* Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Heart Rate Card */}
            <MetricsCard
              title="HEART RATE"
              value={heartRate || {}}
              confidence={heartRate?.confidence || 0}
            />

            {/* HRV Card */}
            <MetricsCard
              title="HRV"
              value={hrv || {}}
              confidence={hrv?.confidence || 0}
            />

            {/* Signal Quality Card */}
            <MetricsCard
              title="SIGNAL QUALITY"
              value={signalQuality || '--'}
              confidence={qualityConfidence || 0}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
