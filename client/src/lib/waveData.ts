export interface WaveInfo {
  radius: number;
  opacity: number;
}

const waveStore: { waves: WaveInfo[], centerX: number, centerY: number } = {
  waves: [],
  centerX: 10,
  centerY: 10,
};

export function setWaveData(waves: WaveInfo[]) {
  waveStore.waves = waves;
}

export function getWaveData() {
  return waveStore;
}

export function getWaveIntensityAtPoint(x: number, y: number, thickness: number = 30): number {
  const { waves, centerX, centerY } = waveStore;
  const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
  let maxIntensity = 0;

  for (const wave of waves) {
    const diff = Math.abs(wave.radius - dist);
    if (diff < thickness) {
      const intensity = (1 - diff / thickness) * wave.opacity;
      maxIntensity = Math.max(maxIntensity, intensity);
    }
  }

  return maxIntensity;
}
