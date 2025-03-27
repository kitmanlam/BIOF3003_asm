// hooks/useSignalQuality.ts
import { useState, useEffect, useRef } from 'react';
import * as tf from '@tensorflow/tfjs';

interface SignalQualityResults {
  signalQuality: string;
  qualityConfidence: number;
}
export default function useSignalQuality(
  ppgData: number[]
): SignalQualityResults {
  const modelRef = useRef<tf.LayersModel | null>(null);
  const [signalQuality, setSignalQuality] = useState<string>('--');
  const [qualityConfidence, setQualityConfidence] = useState<number>(0);

  // Load TensorFlow.js model
  useEffect(() => {
    const loadModel = async () => {
      try {
        const loadedModel = await tf.loadLayersModel('/tfjs_model/model.json');
        modelRef.current = loadedModel;
        console.log('PPG quality assessment model loaded successfully');
      } catch (error) {
        console.error('Error loading model:', error);
      }
    };

    loadModel();
  }, []);

  useEffect(() => {
    if (ppgData.length >= 100) {
      assessSignalQuality(ppgData);
    }
  }, [ppgData]);

  const assessSignalQuality = async (signal: number[]) => {
    if (!modelRef.current || signal.length < 100) return;

    try {
      const features = calculateFeatures(signal);
      const inputTensor = tf.tensor2d([features]);
      const prediction = (await modelRef.current.predict(
        inputTensor
      )) as tf.Tensor;
      const probabilities = await prediction.data();

      const classIndex = probabilities.indexOf(Math.max(...probabilities));
      const classes = ['bad', 'acceptable', 'excellent'];
      const predictedClass = classes[classIndex];
      const confidence = probabilities[classIndex] * 100;

      setSignalQuality(predictedClass);
      // console.log("debug", predictedClass);
      setQualityConfidence(confidence);

      inputTensor.dispose();
      prediction.dispose();
    } catch (error) {
      console.error('Error assessing signal quality:', error);
    }
  };

  const calculateFeatures = (signal: number[]): number[] => {
    if (!signal.length) return new Array(14).fill(0);

    // Calculate mean
    const mean = signal.reduce((sum, val) => sum + val, 0) / signal.length;

    // Calculate median
    const sortedSignal = [...signal].sort((a, b) => a - b);
    const median = signal.length % 2 === 0
      ? (sortedSignal[signal.length / 2 - 1] + sortedSignal[signal.length / 2]) / 2
      : sortedSignal[Math.floor(signal.length / 2)];

    // Calculate standard deviation
    const squaredDiffs = signal.map((val) => Math.pow(val - mean, 2));
    const variance =
      squaredDiffs.reduce((sum, val) => sum + val, 0) / signal.length;
    const std = Math.sqrt(variance);

    // Calculate skewness
    const cubedDiffs = signal.map((val) => Math.pow(val - mean, 3));
    const skewness =
      cubedDiffs.reduce((sum, val) => sum + val, 0) /
      signal.length /
      Math.pow(std, 3);

    // Calculate kurtosis
    const fourthPowerDiffs = signal.map((val) => Math.pow(val - mean, 4));
    const kurtosis =
      fourthPowerDiffs.reduce((sum, val) => sum + val, 0) /
      signal.length /
      Math.pow(std, 4);

    // Calculate signal range and peak-to-peak
    const max = Math.max(...signal);
    const min = Math.min(...signal);
    const signalRange = max - min;
    const peakToPeak = signalRange;

    // Calculate zero crossings
    let zeroCrossings = 0;
    for (let i = 1; i < signal.length; i++) {
      if (
        (signal[i] >= 0 && signal[i - 1] < 0) ||
        (signal[i] < 0 && signal[i - 1] >= 0)
      ) {
        zeroCrossings++;
      }
    }

    // Calculate RMS
    const squaredSum = signal.reduce((sum, val) => sum + val * val, 0);
    const rms = Math.sqrt(squaredSum / signal.length);

    // FFT Feature Calculations
    const calculateFFTFeatures = () => {
      // Convert to complex signal (real + imaginary)
      const complexSignal = tf.complex(signal, new Array(signal.length).fill(0));
      
      // Compute FFT and get magnitudes
      const fft = tf.spectral.fft(complexSignal);
      const magnitudes = tf.abs(fft);
      
      // Take first half of coefficients (Nyquist theorem)
      const halfLength = Math.floor(signal.length / 2);
      const firstHalf = magnitudes.slice([0], [halfLength]);
      const fftCoefficients = Array.from(firstHalf.dataSync());

      // Calculate statistics
      const fftMean = fftCoefficients.reduce((a, b) => a + b, 0) / fftCoefficients.length;
      const fftStd = Math.sqrt(fftCoefficients.reduce((a, b) => a + Math.pow(b - fftMean, 2), 0) / fftCoefficients.length);
      const fftMax = Math.max(...fftCoefficients);
      const fftMin = Math.min(...fftCoefficients);

      // Cleanup tensors
      complexSignal.dispose();
      fft.dispose();
      magnitudes.dispose();
      firstHalf.dispose();

      return { fftMean, fftStd, fftMax, fftMin };
    };

    const { fftMean, fftStd, fftMax, fftMin } = calculateFFTFeatures();

    return [
      mean,
      std,
      skewness,
      kurtosis,
      signalRange,
      zeroCrossings,
      rms,
      peakToPeak,
      median, 
      variance,
      fftMean, 
      fftStd, 
      fftMax, 
      fftMin
    ];
  };

  return { signalQuality, qualityConfidence };
}
