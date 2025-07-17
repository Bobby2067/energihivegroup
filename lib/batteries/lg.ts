/**
 * LG RESU Battery API Client
 * 
 * Enhanced TypeScript client for interacting with LG RESU battery systems
 * through their official API. Handles authentication, data fetching, and
 * formatting of battery telemetry data with improved error handling,
 * caching, and simulation capabilities optimized for the Australian market.
 */

import { z } from 'zod';

// Type definitions for API responses and parameters
export interface BatteryStatus {
  serialNumber: string;
  lastUpdated: string;
  batteryLevel: number; // State of Charge (%)
  batteryPower: number; // Current battery power (W, + charging, - discharging)
  gridPower: number; // Power from/to grid (W, + import, - export)
  solarPower: number; // Solar generation (W)
  loadPower: number; // Home consumption (W)
  systemMode: string;
  isCharging: boolean;
  isDischarging: boolean;
  isExporting: boolean;
  isImporting: boolean;
  systemStatus: string;
  batteryTemperature?: number;
  inverterTemperature?: number;
  gridVoltage?: number;
  gridFrequency?: number;
  alerts: BatteryAlert[];
  isSimulated: boolean;
  rawData?: Record<string, any>;
  apiError?: string;
  // LG RESU specific fields
  cellBalancing?: boolean;
  batteryModules?: number;
  moduleTemperatures?: number[];
  dcLinkVoltage?: number;
  cellVoltageDeviation?: number;
  batteryType?: 'RESU10H' | 'RESU13' | 'RESU16H' | 'RESU10' | 'RESU7H' | string;
}

export interface BatteryAlert {
  code: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  timestamp: string;
  isActive: boolean;
}

export interface BatteryHistoryEntry {
  timestamp: string;
  batteryLevel: number;
  batteryPower?: number;
  gridPower?: number;
  solarPower?: number;
  loadPower?: number;
  energyCharged: number; // kWh
  energyDischarged: number; // kWh
  solarGeneration: number; // kWh
  gridImport: number; // kWh
  gridExport: number; // kWh
  homeConsumption: number; // kWh
  isSimulated: boolean;
  // LG RESU specific fields
  cellBalancingDuration?: number; // Minutes of cell balancing
  minCellVoltage?: number;
  maxCellVoltage?: number;
  cycleCount?: number;
}

export interface SystemInfo {
  serialNumber: string;
  model: string;
  firmwareVersion: string;
  installationDate: string;
  batteryCapacity: number;
  nominalPower: number;
  lastMaintenance?: string;
  systemType: string;
  isSimulated: boolean;
  // LG RESU specific fields
  cellType?: string;
  warrantyPeriod?: string;
  cycleLife?: string;
  moduleCount?: number;
  batteryChemistry?: string;
  manufacturingDate?: string;
}

export interface BatterySettings {
  minSoc?: number; // Minimum state of charge (%)
  maxGridCharge?: number; // Maximum power to use from grid for charging (W)
  timeOfUse?: TimeOfUseSettings[];
  feedInLimit?: number; // Maximum export to grid (W)
  chargeFromGrid?: boolean;
  backupReserve?: number; // Backup reserve (%)
  operationMode?: 'self_use' | 'time_of_use' | 'backup' | 'economic';
  // LG RESU specific settings
  cellBalancingMode?: 'auto' | 'scheduled' | 'disabled';
  cellBalancingSchedule?: {
    days: ('mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun')[];
    startTime: string; // HH:MM
    duration: number; // minutes
  };
}

export interface TimeOfUseSettings {
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  priority: 'grid' | 'battery' | 'mixed';
  maxPower?: number; // Maximum power to use (W)
}

export interface HistoryOptions {
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  interval?: 'day' | 'hour' | '15min';
}

// API configuration and validation schemas
const API_CONFIG = {
  baseUrl: process.env.LG_API_URL || 'https://api.lgess.com/api',
  key: process.env.LG_API_KEY,
  secret: process.env.LG_API_SECRET,
  enableSimulation: process.env.ENABLE_BATTERY_SIMULATION === 'true',
  enableSimulationFallback: process.env.ENABLE_BATTERY_SIMULATION_FALLBACK === 'true',
  region: process.env.NEXT_PUBLIC_REGION || 'au', // Default to Australia
  timezone: process.env.NEXT_PUBLIC_TIMEZONE || 'Australia/Sydney',
  debugMode: process.env.DEBUG_API_CALLS === 'true',
};

// Validation schemas
const BatteryStatusSchema = z.object({
  serialNumber: z.string(),
  lastUpdateTime: z.string().optional(),
  soc: z.number().min(0).max(100).optional(),
  batteryPower: z.number().optional(),
  gridPower: z.number().optional(),
  pvPower: z.number().optional(),
  loadPower: z.number().optional(),
  systemStatus: z.string().optional(),
  batteryTemperature: z.number().optional(),
  inverterTemperature: z.number().optional(),
  gridVoltage: z.number().optional(),
  gridFrequency: z.number().optional(),
  alerts: z.array(z.any()).optional(),
  // LG RESU specific fields
  cellBalancing: z.boolean().optional(),
  batteryModules: z.number().optional(),
  moduleTemperatures: z.array(z.number()).optional(),
  dcLinkVoltage: z.number().optional(),
  cellVoltageDeviation: z.number().optional(),
  batteryType: z.string().optional(),
});

const BatteryHistorySchema = z.array(
  z.object({
    timestamp: z.string(),
    soc: z.number().min(0).max(100).optional(),
    batteryPower: z.number().optional(),
    gridPower: z.number().optional(),
    pvPower: z.number().optional(),
    loadPower: z.number().optional(),
    energyCharged: z.number().optional(),
    energyDischarged: z.number().optional(),
    solarGeneration: z.number().optional(),
    gridImport: z.number().optional(),
    gridExport: z.number().optional(),
    homeConsumption: z.number().optional(),
    // LG RESU specific fields
    cellBalancingDuration: z.number().optional(),
    minCellVoltage: z.number().optional(),
    maxCellVoltage: z.number().optional(),
    cycleCount: z.number().optional(),
  })
);

const SystemInfoSchema = z.object({
  serialNumber: z.string(),
  model: z.string().optional(),
  firmwareVersion: z.string().optional(),
  installationDate: z.string().optional(),
  batteryCapacity: z.number().optional(),
  nominalPower: z.number().optional(),
  lastMaintenance: z.string().optional(),
  systemType: z.string().optional(),
  // LG RESU specific fields
  cellType: z.string().optional(),
  warrantyPeriod: z.string().optional(),
  cycleLife: z.string().optional(),
  moduleCount: z.number().optional(),
  batteryChemistry: z.string().optional(),
  manufacturingDate: z.string().optional(),
});

// Cache for auth tokens to avoid unnecessary requests
interface AuthTokenCache {
  token: string | null;
  expiresAt: number;
}

let authTokenCache: AuthTokenCache = {
  token: null,
  expiresAt: 0
};

// Logger for API calls
const logger = {
  debug: (message: string, data?: any) => {
    if (API_CONFIG.debugMode) {
      console.debug(`[LG RESU] ${message}`, data);
    }
  },
  info: (message: string, data?: any) => {
    console.info(`[LG RESU] ${message}`, data ? JSON.stringify(data) : '');
  },
  warn: (message: string, error?: any) => {
    console.warn(`[LG RESU] ${message}`, error);
  },
  error: (message: string, error: any) => {
    console.error(`[LG RESU] ${message}`, error);
  }
};

/**
 * Authenticate with the LG RESU API and get an access token
 * @returns Promise<string> Access token
 */
async function getAuthToken(): Promise<string> {
  // Check if we have a cached token that's still valid
  if (authTokenCache.token && authTokenCache.expiresAt > Date.now()) {
    logger.debug('Using cached auth token');
    return authTokenCache.token;
  }

  // If we're in simulation mode, return a dummy token
  if (API_CONFIG.enableSimulation) {
    const dummyToken = 'simulated-lg-resu-token';
    authTokenCache = {
      token: dummyToken,
      expiresAt: Date.now() + 3600000 // 1 hour
    };
    logger.debug('Using simulated auth token');
    return dummyToken;
  }

  // Check if API credentials are configured
  if (!API_CONFIG.key || !API_CONFIG.secret) {
    throw new Error('LG RESU API credentials not configured. Please check your environment variables.');
  }

  // Otherwise, authenticate with the real API
  try {
    logger.debug('Authenticating with LG RESU API');
    const startTime = Date.now();
    
    const response = await fetch(`${API_CONFIG.baseUrl}/auth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        apiKey: API_CONFIG.key,
        apiSecret: API_CONFIG.secret
      })
    });

    const responseTime = Date.now() - startTime;
    logger.debug(`Authentication response time: ${responseTime}ms`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`LG RESU API authentication failed: ${errorData.message || response.statusText}`);
    }

    const data = await response.json();
    
    // Cache the token
    authTokenCache = {
      token: data.accessToken,
      expiresAt: Date.now() + ((data.expiresIn - 60) * 1000) // Subtract 60 seconds for safety margin
    };
    
    logger.info('Successfully authenticated with LG RESU API');
    return data.accessToken;
  } catch (error) {
    logger.error('Error authenticating with LG RESU API:', error);
    throw error instanceof Error 
      ? error 
      : new Error('Unknown error during LG RESU API authentication');
  }
}

/**
 * Get the current status of a battery system
 * @param serialNumber The battery system's serial number
 * @returns Promise<BatteryStatus> Battery status data
 */
export async function getBatteryStatus(serialNumber: string): Promise<BatteryStatus> {
  // Validate input
  if (!serialNumber || typeof serialNumber !== 'string') {
    throw new Error('Invalid serial number provided');
  }

  // If simulation is enabled, return simulated data
  if (API_CONFIG.enableSimulation) {
    logger.debug(`Generating simulated status for ${serialNumber}`);
    return generateSimulatedStatus(serialNumber);
  }
  
  try {
    logger.debug(`Fetching battery status for ${serialNumber}`);
    const startTime = Date.now();
    
    const token = await getAuthToken();
    
    const response = await fetch(`${API_CONFIG.baseUrl}/battery/status/${serialNumber}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const responseTime = Date.now() - startTime;
    logger.debug(`Battery status response time: ${responseTime}ms`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to get battery status: ${errorData.message || response.statusText}`);
    }

    const rawData = await response.json();
    
    // Validate the response data
    const validationResult = BatteryStatusSchema.safeParse(rawData);
    if (!validationResult.success) {
      logger.warn('Invalid battery status data received:', validationResult.error);
      // Continue with processing but log the validation error
    }
    
    // Transform the API response to our standardized format
    const result: BatteryStatus = {
      serialNumber: rawData.serialNumber || serialNumber,
      lastUpdated: rawData.lastUpdateTime || new Date().toISOString(),
      batteryLevel: rawData.soc || 0, // State of Charge (%)
      batteryPower: rawData.batteryPower || 0, // Current battery power (W, + charging, - discharging)
      gridPower: rawData.gridPower || 0, // Power from/to grid (W, + import, - export)
      solarPower: rawData.pvPower || 0, // Solar generation (W)
      loadPower: rawData.loadPower || 0, // Home consumption (W)
      systemMode: determineSystemMode(rawData),
      isCharging: (rawData.batteryPower || 0) > 0,
      isDischarging: (rawData.batteryPower || 0) < 0,
      isExporting: (rawData.gridPower || 0) < 0,
      isImporting: (rawData.gridPower || 0) > 0,
      systemStatus: rawData.systemStatus || 'Unknown',
      batteryTemperature: rawData.batteryTemperature,
      inverterTemperature: rawData.inverterTemperature,
      gridVoltage: rawData.gridVoltage,
      gridFrequency: rawData.gridFrequency,
      alerts: parseAlerts(rawData.alerts || []),
      isSimulated: false,
      // LG RESU specific fields
      cellBalancing: rawData.cellBalancing || false,
      batteryModules: rawData.batteryModules || detectModuleCount(rawData),
      moduleTemperatures: rawData.moduleTemperatures || [],
      dcLinkVoltage: rawData.dcLinkVoltage,
      cellVoltageDeviation: rawData.cellVoltageDeviation,
      batteryType: rawData.batteryType || detectBatteryType(rawData, serialNumber),
      // Include any additional data from the API
      rawData
    };

    // Apply Australian market optimizations
    applyAustralianOptimizations(result);
    
    logger.debug(`Successfully retrieved battery status for ${serialNumber}`);
    return result;
  } catch (error) {
    logger.error(`Error fetching LG RESU battery status for ${serialNumber}:`, error);
    
    // If API call fails but simulation is allowed as fallback, return simulated data
    if (API_CONFIG.enableSimulationFallback) {
      logger.info(`Falling back to simulation for ${serialNumber}`);
      return {
        ...generateSimulatedStatus(serialNumber),
        apiError: error instanceof Error ? error.message : 'Unknown error',
        isSimulated: true
      };
    }
    
    throw error instanceof Error 
      ? error 
      : new Error(`Unknown error fetching battery status for ${serialNumber}`);
  }
}

/**
 * Get historical data for a battery system
 * @param serialNumber The battery system's serial number
 * @param options Query options
 * @returns Promise<BatteryHistoryEntry[]> Historical battery data
 */
export async function getBatteryHistory(
  serialNumber: string, 
  options: HistoryOptions = {}
): Promise<BatteryHistoryEntry[]> {
  // Default options
  const { 
    startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Default to 7 days ago
    endDate = new Date().toISOString().split('T')[0], // Default to today
    interval = 'day' // Default to daily data
  } = options;
  
  // Validate inputs
  if (!serialNumber || typeof serialNumber !== 'string') {
    throw new Error('Invalid serial number provided');
  }
  
  // If simulation is enabled, return simulated historical data
  if (API_CONFIG.enableSimulation) {
    logger.debug(`Generating simulated history for ${serialNumber}`);
    return generateSimulatedHistory(serialNumber, startDate, endDate, interval);
  }
  
  try {
    logger.debug(`Fetching battery history for ${serialNumber} from ${startDate} to ${endDate} with interval ${interval}`);
    const startTime = Date.now();
    
    const token = await getAuthToken();
    
    const response = await fetch(`${API_CONFIG.baseUrl}/battery/history/${serialNumber}`, {
      method: 'POST', // Note: Using POST for history as it has a request body
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        startDate,
        endDate,
        interval
      })
    });

    const responseTime = Date.now() - startTime;
    logger.debug(`Battery history response time: ${responseTime}ms`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to get battery history: ${errorData.message || response.statusText}`);
    }

    const rawData = await response.json();
    
    // Validate the response data
    const validationResult = BatteryHistorySchema.safeParse(rawData);
    if (!validationResult.success) {
      logger.warn('Invalid battery history data received:', validationResult.error);
      // Continue with processing but log the validation error
    }
    
    // Transform the API response to our standardized format
    const result: BatteryHistoryEntry[] = rawData.map((entry: any) => ({
      timestamp: entry.timestamp,
      batteryLevel: entry.soc || 0,
      batteryPower: entry.batteryPower || 0,
      gridPower: entry.gridPower || 0,
      solarPower: entry.pvPower || 0,
      loadPower: entry.loadPower || 0,
      energyCharged: entry.energyCharged || 0, // kWh
      energyDischarged: entry.energyDischarged || 0, // kWh
      solarGeneration: entry.solarGeneration || 0, // kWh
      gridImport: entry.gridImport || 0, // kWh
      gridExport: entry.gridExport || 0, // kWh
      homeConsumption: entry.homeConsumption || 0, // kWh
      // LG RESU specific fields
      cellBalancingDuration: entry.cellBalancingDuration || 0,
      minCellVoltage: entry.minCellVoltage,
      maxCellVoltage: entry.maxCellVoltage,
      cycleCount: entry.cycleCount,
      isSimulated: false
    }));

    // Apply Australian market optimizations
    result.forEach(entry => applyAustralianHistoryOptimizations(entry));
    
    logger.debug(`Successfully retrieved battery history for ${serialNumber}`);
    return result;
  } catch (error) {
    logger.error(`Error fetching LG RESU battery history for ${serialNumber}:`, error);
    
    // If API call fails but simulation is allowed as fallback, return simulated data
    if (API_CONFIG.enableSimulationFallback) {
      logger.info(`Falling back to simulation for history of ${serialNumber}`);
      return generateSimulatedHistory(serialNumber, startDate, endDate, interval);
    }
    
    throw error instanceof Error 
      ? error 
      : new Error(`Unknown error fetching battery history for ${serialNumber}`);
  }
}

/**
 * Get system information for a battery
 * @param serialNumber The battery system's serial number
 * @returns Promise<SystemInfo> System information
 */
export async function getSystemInfo(serialNumber: string): Promise<SystemInfo> {
  // Validate input
  if (!serialNumber || typeof serialNumber !== 'string') {
    throw new Error('Invalid serial number provided');
  }

  // If simulation is enabled, return simulated data
  if (API_CONFIG.enableSimulation) {
    logger.debug(`Generating simulated system info for ${serialNumber}`);
    return generateSimulatedSystemInfo(serialNumber);
  }
  
  try {
    logger.debug(`Fetching system info for ${serialNumber}`);
    const startTime = Date.now();
    
    const token = await getAuthToken();
    
    const response = await fetch(`${API_CONFIG.baseUrl}/battery/system/${serialNumber}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const responseTime = Date.now() - startTime;
    logger.debug(`System info response time: ${responseTime}ms`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to get system info: ${errorData.message || response.statusText}`);
    }

    const rawData = await response.json();
    
    // Validate the response data
    const validationResult = SystemInfoSchema.safeParse(rawData);
    if (!validationResult.success) {
      logger.warn('Invalid system info data received:', validationResult.error);
      // Continue with processing but log the validation error
    }
    
    // Return the system information
    const result: SystemInfo = {
      serialNumber: rawData.serialNumber || serialNumber,
      model: rawData.model || 'Unknown',
      firmwareVersion: rawData.firmwareVersion || 'Unknown',
      installationDate: rawData.installationDate || 'Unknown',
      batteryCapacity: rawData.batteryCapacity || 0,
      nominalPower: rawData.nominalPower || 0,
      lastMaintenance: rawData.lastMaintenance,
      systemType: rawData.systemType || 'Unknown',
      // LG RESU specific fields
      cellType: rawData.cellType || 'Lithium-ion NMC',
      warrantyPeriod: rawData.warrantyPeriod || '10 years',
      cycleLife: rawData.cycleLife || '6000+ cycles',
      moduleCount: rawData.moduleCount || detectModuleCountFromCapacity(rawData.batteryCapacity),
      batteryChemistry: rawData.batteryChemistry || 'NMC (Nickel Manganese Cobalt)',
      manufacturingDate: rawData.manufacturingDate,
      isSimulated: false
    };
    
    logger.debug(`Successfully retrieved system info for ${serialNumber}`);
    return result;
  } catch (error) {
    logger.error(`Error fetching LG RESU system info for ${serialNumber}:`, error);
    
    if (API_CONFIG.enableSimulationFallback) {
      logger.info(`Falling back to simulation for system info of ${serialNumber}`);
      return generateSimulatedSystemInfo(serialNumber);
    }
    
    throw error instanceof Error 
      ? error 
      : new Error(`Unknown error fetching system info for ${serialNumber}`);
  }
}

/**
 * Update battery system settings
 * @param serialNumber The battery system's serial number
 * @param settings Settings to update
 * @returns Promise<object> Updated settings
 */
export async function updateSystemSettings(
  serialNumber: string, 
  settings: BatterySettings
): Promise<{ success: boolean; serialNumber: string; updatedSettings: BatterySettings }> {
  // Validate input
  if (!serialNumber || typeof serialNumber !== 'string') {
    throw new Error('Invalid serial number provided');
  }

  // If simulation is enabled, return simulated response
  if (API_CONFIG.enableSimulation) {
    logger.debug(`Simulating settings update for ${serialNumber}`);
    return { success: true, serialNumber, updatedSettings: settings };
  }
  
  try {
    logger.debug(`Updating settings for ${serialNumber}`, settings);
    const startTime = Date.now();
    
    const token = await getAuthToken();
    
    const response = await fetch(`${API_CONFIG.baseUrl}/battery/settings/${serialNumber}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(settings)
    });

    const responseTime = Date.now() - startTime;
    logger.debug(`Settings update response time: ${responseTime}ms`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to update settings: ${errorData.message || response.statusText}`);
    }

    const result = await response.json();
    logger.info(`Successfully updated settings for ${serialNumber}`);
    return result;
  } catch (error) {
    logger.error(`Error updating LG RESU settings for ${serialNumber}:`, error);
    throw error instanceof Error 
      ? error 
      : new Error(`Unknown error updating settings for ${serialNumber}`);
  }
}

/**
 * Set up real-time monitoring for a battery system
 * This uses a polling approach since the LG RESU API doesn't support WebSockets
 * @param serialNumber The battery system's serial number
 * @param callback Function to call with updated status
 * @param interval Polling interval in milliseconds (default: 60000 = 1 minute)
 * @returns Function to stop monitoring
 */
export function setupRealTimeMonitoring(
  serialNumber: string,
  callback: (status: BatteryStatus) => void,
  interval: number = 60000
): () => void {
  // Validate input
  if (!serialNumber || typeof serialNumber !== 'string') {
    throw new Error('Invalid serial number provided');
  }
  
  if (typeof callback !== 'function') {
    throw new Error('Callback must be a function');
  }
  
  if (interval < 10000) {
    logger.warn(`Polling interval of ${interval}ms is too short, setting to 10000ms minimum`);
    interval = 10000; // Minimum 10 seconds to prevent API abuse
  }
  
  logger.info(`Setting up real-time monitoring for ${serialNumber} with ${interval}ms interval`);
  
  // Initial fetch
  getBatteryStatus(serialNumber)
    .then(status => callback(status))
    .catch(error => logger.error(`Error in initial status fetch for ${serialNumber}:`, error));
  
  // Set up polling
  const timerId = setInterval(async () => {
    try {
      const status = await getBatteryStatus(serialNumber);
      callback(status);
    } catch (error) {
      logger.error(`Error in real-time monitoring for ${serialNumber}:`, error);
      // Continue polling despite errors
    }
  }, interval);
  
  // Return function to stop monitoring
  return () => {
    logger.info(`Stopping real-time monitoring for ${serialNumber}`);
    clearInterval(timerId);
  };
}

/**
 * Get cell balancing status and schedule
 * @param serialNumber The battery system's serial number
 * @returns Promise<object> Cell balancing status and schedule
 */
export async function getCellBalancingStatus(
  serialNumber: string
): Promise<{
  isBalancing: boolean;
  lastBalanced: string | null;
  nextScheduled: string | null;
  voltageDeviation: number;
  recommendedAction: string | null;
}> {
  // Validate input
  if (!serialNumber || typeof serialNumber !== 'string') {
    throw new Error('Invalid serial number provided');
  }

  // If simulation is enabled, return simulated data
  if (API_CONFIG.enableSimulation) {
    return generateSimulatedCellBalancingStatus(serialNumber);
  }
  
  try {
    logger.debug(`Fetching cell balancing status for ${serialNumber}`);
    const startTime = Date.now();
    
    const token = await getAuthToken();
    
    const response = await fetch(`${API_CONFIG.baseUrl}/battery/cell-balancing/${serialNumber}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const responseTime = Date.now() - startTime;
    logger.debug(`Cell balancing status response time: ${responseTime}ms`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to get cell balancing status: ${errorData.message || response.statusText}`);
    }

    const data = await response.json();
    
    return {
      isBalancing: data.isBalancing || false,
      lastBalanced: data.lastBalanced || null,
      nextScheduled: data.nextScheduled || null,
      voltageDeviation: data.voltageDeviation || 0,
      recommendedAction: data.recommendedAction || null
    };
  } catch (error) {
    logger.error(`Error fetching cell balancing status for ${serialNumber}:`, error);
    
    if (API_CONFIG.enableSimulationFallback) {
      return generateSimulatedCellBalancingStatus(serialNumber);
    }
    
    throw error instanceof Error 
      ? error 
      : new Error(`Unknown error fetching cell balancing status for ${serialNumber}`);
  }
}

/**
 * Schedule a cell balancing operation
 * @param serialNumber The battery system's serial number
 * @param schedule When to perform cell balancing
 * @returns Promise<object> Schedule confirmation
 */
export async function scheduleCellBalancing(
  serialNumber: string,
  schedule: {
    startTime: string; // ISO date string
    duration: number; // minutes
  }
): Promise<{ success: boolean; scheduledTime: string; estimatedCompletion: string }> {
  // Validate input
  if (!serialNumber || typeof serialNumber !== 'string') {
    throw new Error('Invalid serial number provided');
  }

  // If simulation is enabled, return simulated response
  if (API_CONFIG.enableSimulation) {
    const startTime = new Date(schedule.startTime);
    const endTime = new Date(startTime.getTime() + schedule.duration * 60000);
    
    return {
      success: true,
      scheduledTime: startTime.toISOString(),
      estimatedCompletion: endTime.toISOString()
    };
  }
  
  try {
    logger.debug(`Scheduling cell balancing for ${serialNumber}`, schedule);
    const startTime = Date.now();
    
    const token = await getAuthToken();
    
    const response = await fetch(`${API_CONFIG.baseUrl}/battery/cell-balancing/${serialNumber}/schedule`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(schedule)
    });

    const responseTime = Date.now() - startTime;
    logger.debug(`Schedule cell balancing response time: ${responseTime}ms`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to schedule cell balancing: ${errorData.message || response.statusText}`);
    }

    const result = await response.json();
    logger.info(`Successfully scheduled cell balancing for ${serialNumber}`);
    return result;
  } catch (error) {
    logger.error(`Error scheduling cell balancing for ${serialNumber}:`, error);
    throw error instanceof Error 
      ? error 
      : new Error(`Unknown error scheduling cell balancing for ${serialNumber}`);
  }
}

/**
 * Determine the system mode based on power flow data
 * @param data Battery status data
 * @returns System mode description
 */
function determineSystemMode(data: any): string {
  if (!data) return 'Unknown';
  
  const { batteryPower, pvPower, gridPower, loadPower } = data;
  
  if ((batteryPower || 0) > 0) {
    return 'Charging';
  } else if ((batteryPower || 0) < 0) {
    return 'Discharging';
  } else if ((pvPower || 0) > 0 && (gridPower || 0) < 0) {
    return 'Exporting Solar';
  } else if ((gridPower || 0) > 0) {
    return 'Importing Grid';
  } else {
    return 'Idle';
  }
}

/**
 * Parse battery alerts into a standardized format
 * @param alerts Raw alerts from API
 * @returns Standardized battery alerts
 */
function parseAlerts(alerts: any[]): BatteryAlert[] {
  if (!Array.isArray(alerts) || alerts.length === 0) {
    return [];
  }
  
  return alerts.map(alert => {
    // Map raw alert to standardized format
    // LG RESU specific alert mapping
    return {
      code: alert.code || alert.alertCode || 'unknown',
      severity: determineSeverity(alert),
      message: alert.message || alert.description || 'Unknown alert',
      timestamp: alert.timestamp || new Date().toISOString(),
      isActive: alert.isActive !== undefined ? alert.isActive : true
    };
  });
}

/**
 * Determine alert severity based on alert data
 * @param alert Raw alert data
 * @returns Standardized severity level
 */
function determineSeverity(alert: any): 'info' | 'warning' | 'error' | 'critical' {
  // LG RESU specific alert severity mapping
  const code = alert.code || alert.alertCode || '';
  const level = alert.level || alert.severity || '';
  
  // LG RESU uses a different alert code system than AlphaESS
  if (level === 'critical' || code.startsWith('C')) {
    return 'critical';
  } else if (level === 'error' || code.startsWith('E')) {
    return 'error';
  } else if (level === 'warning' || code.startsWith('W')) {
    return 'warning';
  } else {
    return 'info';
  }
}

/**
 * Detect the number of battery modules from raw data
 * @param data Raw battery data
 * @returns Number of battery modules
 */
function detectModuleCount(data: any): number {
  // LG RESU specific module detection
  if (data.moduleCount) {
    return data.moduleCount;
  }
  
  // Try to detect from module temperatures array length
  if (data.moduleTemperatures && Array.isArray(data.moduleTemperatures)) {
    return data.moduleTemperatures.length;
  }
  
  // Try to detect from battery capacity
  if (data.batteryCapacity) {
    return detectModuleCountFromCapacity(data.batteryCapacity);
  }
  
  // Try to detect from battery model
  if (data.model || data.batteryType) {
    const model = (data.model || data.batteryType || '').toUpperCase();
    
    if (model.includes('RESU10H')) return 3;
    if (model.includes('RESU13')) return 4;
    if (model.includes('RESU16H')) return 5;
    if (model.includes('RESU10')) return 3;
    if (model.includes('RESU7H')) return 2;
  }
  
  // Default fallback
  return 3; // Most common is 3 modules (RESU10)
}

/**
 * Detect the number of battery modules from capacity
 * @param capacity Battery capacity in kWh
 * @returns Number of battery modules
 */
function detectModuleCountFromCapacity(capacity: number): number {
  if (!capacity) return 3; // Default
  
  // LG RESU modules are typically around 3.3-3.5 kWh each
  const estimatedModules = Math.round(capacity / 3.3);
  
  // Sanity check - LG RESU systems typically have 2-5 modules
  if (estimatedModules < 2) return 2;
  if (estimatedModules > 5) return 5;
  
  return estimatedModules;
}

/**
 * Detect the battery type from raw data and serial number
 * @param data Raw battery data
 * @param serialNumber Battery serial number
 * @returns Battery type
 */
function detectBatteryType(data: any, serialNumber: string): string {
  // Try to get from data
  if (data.batteryType) {
    return data.batteryType;
  }
  
  if (data.model) {
    return data.model;
  }
  
  // Try to detect from capacity
  if (data.batteryCapacity) {
    if (data.batteryCapacity >= 15) return 'RESU16H';
    if (data.batteryCapacity >= 12) return 'RESU13';
    if (data.batteryCapacity >= 9) return 'RESU10H';
    if (data.batteryCapacity >= 8) return 'RESU10';
    if (data.batteryCapacity >= 6) return 'RESU7H';
  }
  
  // Try to detect from serial number pattern
  // LG RESU serial numbers often have model codes embedded
  if (serialNumber.includes('R10H')) return 'RESU10H';
  if (serialNumber.includes('R13')) return 'RESU13';
  if (serialNumber.includes('R16H')) return 'RESU16H';
  if (serialNumber.includes('R10')) return 'RESU10';
  if (serialNumber.includes('R7H')) return 'RESU7H';
  
  // Default fallback
  return 'RESU10H'; // Most common model in Australia
}

/**
 * Apply Australian market optimizations to battery status data
 * @param status Battery status to optimize
 */
function applyAustralianOptimizations(status: BatteryStatus): void {
  // Australian market optimizations
  // 1. Flag potential arbitrage opportunities based on time-of-use rates
  const now = new Date();
  const hour = now.getHours();
  
  // Australian East Coast typical time-of-use periods
  const isPeakTime = (hour >= 14 && hour < 20); // 2pm-8pm typical peak
  const isShoulderTime = (hour >= 7 && hour < 14) || (hour >= 20 && hour < 22); // 7am-2pm, 8pm-10pm
  const isOffPeakTime = (hour >= 22 || hour < 7); // 10pm-7am
  
  // Add Australian market specific data
  status.rawData = status.rawData || {};
  status.rawData.australianMarket = {
    timeOfUseCategory: isPeakTime ? 'peak' : isShoulderTime ? 'shoulder' : 'off-peak',
    exportFeedInRate: 0.05, // Example 5c/kWh feed-in tariff
    currentImportRate: isPeakTime ? 0.40 : isShoulderTime ? 0.25 : 0.15, // Example TOU rates
    arbitrageOpportunity: isOffPeakTime && status.batteryLevel < 50, // Charge during off-peak if battery is low
    exportOpportunity: isPeakTime && status.batteryLevel > 80, // Export during peak if battery is high
    selfConsumeOpportunity: isShoulderTime && status.solarPower > 0, // Self-consume during shoulder periods
    // LG RESU specific optimizations
    cellBalancingRecommended: status.cellVoltageDeviation && status.cellVoltageDeviation > 0.1,
    bestTimeForCellBalancing: isOffPeakTime, // Best to balance during off-peak
    batteryEfficiency: calculateBatteryEfficiency(status),
    estimatedCycleCount: estimateCycleCount(status),
  };
  
  // Add VPP (Virtual Power Plant) participation flags for Australian market
  if (isPeakTime && status.batteryLevel > 60) {
    status.rawData.australianMarket.vppParticipationRecommended = true;
    status.rawData.australianMarket.vppPotentialRevenue = calculateVppRevenue(status);
  }
}

/**
 * Calculate battery efficiency based on status
 * @param status Battery status
 * @returns Efficiency percentage
 */
function calculateBatteryEfficiency(status: BatteryStatus): number {
  // LG RESU batteries typically have 95-98% round-trip efficiency
  // This would be calculated from actual charge/discharge data in a real implementation
  const baseEfficiency = 96; // 96% base efficiency
  
  // Efficiency decreases slightly at very high or low SOC
  if (status.batteryLevel < 20 || status.batteryLevel > 90) {
    return baseEfficiency - 2;
  }
  
  // Efficiency decreases slightly at high charge/discharge rates
  const powerRate = Math.abs(status.batteryPower);
  if (powerRate > 4000) {
    return baseEfficiency - 3;
  } else if (powerRate > 3000) {
    return baseEfficiency - 1;
  }
  
  return baseEfficiency;
}

/**
 * Estimate cycle count based on battery status
 * @param status Battery status
 * @returns Estimated cycle count
 */
function estimateCycleCount(status: BatteryStatus): number {
  // In a real implementation, this would come from the battery's actual cycle counter
  // For simulation, we'll estimate based on installation date or other factors
  
  if (status.rawData && status.rawData.cycleCount) {
    return status.rawData.cycleCount;
  }
  
  // If we have an installation date, estimate based on that
  // Assuming average of 1 cycle per day
  if (status.rawData && status.rawData.installationDate) {
    const installDate = new Date(status.rawData.installationDate);
    const now = new Date();
    const daysSinceInstall = Math.floor((now.getTime() - installDate.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(1, Math.floor(daysSinceInstall * 0.8)); // Assume 0.8 cycles per day on average
  }
  
  // Default fallback - random value between 100-500 for simulation
  return 100 + Math.floor(Math.random() * 400);
}

/**
 * Calculate potential VPP revenue based on battery status
 * @param status Battery status
 * @returns Potential revenue in AUD
 */
function calculateVppRevenue(status: BatteryStatus): number {
  // Australian VPP programs typically pay $0.30-1.00/kWh during peak events
  const vppRate = 0.75; // $0.75/kWh during VPP events
  
  // Calculate available energy for VPP (keeping 20% reserve)
  const availableEnergy = ((status.batteryLevel - 20) / 100) * getBatteryCapacityFromType(status.batteryType);
  
  // Assume a 2-hour VPP event
  return Math.max(0, availableEnergy * vppRate);
}

/**
 * Get battery capacity from battery type
 * @param batteryType Battery type/model
 * @returns Capacity in kWh
 */
function getBatteryCapacityFromType(batteryType?: string): number {
  if (!batteryType) return 10; // Default
  
  const type = batteryType.toUpperCase();
  
  if (type.includes('RESU16H')) return 16;
  if (type.includes('RESU13')) return 12.9;
  if (type.includes('RESU10H')) return 9.8;
  if (type.includes('RESU10')) return 9.3;
  if (type.includes('RESU7H')) return 7;
  
  return 10; // Default fallback
}

/**
 * Apply Australian market optimizations to historical data
 * @param entry Historical data entry to optimize
 */
function applyAustralianHistoryOptimizations(entry: BatteryHistoryEntry): void {
  // Add Australian-specific metrics and calculations
  const timestamp = new Date(entry.timestamp);
  const hour = timestamp.getHours();
  
  // Australian East Coast typical time-of-use periods
  const isPeakTime = (hour >= 14 && hour < 20); // 2pm-8pm typical peak
  const isShoulderTime = (hour >= 7 && hour < 14) || (hour >= 20 && hour < 22); // 7am-2pm, 8pm-10pm
  const isOffPeakTime = (hour >= 22 || hour < 7); // 10pm-7am
  
  // Calculate cost savings based on Australian electricity rates
  const peakRate = 0.40; // 40c/kWh during peak
  const shoulderRate = 0.25; // 25c/kWh during shoulder
  const offPeakRate = 0.15; // 15c/kWh during off-peak
  const feedInRate = 0.05; // 5c/kWh feed-in tariff
  
  const currentRate = isPeakTime ? peakRate : isShoulderTime ? shoulderRate : offPeakRate;
  
  // Calculate savings from self-consumption and battery usage
  const selfConsumptionSavings = entry.solarGeneration * currentRate;
  const batteryDischargeSavings = entry.energyDischarged * currentRate;
  const exportIncome = entry.gridExport * feedInRate;
  const importCost = entry.gridImport * currentRate;
  
  // LG RESU specific calculations - calculate cell balancing impact
  let cellBalancingImpact = 0;
  if (entry.cellBalancingDuration && entry.cellBalancingDuration > 0) {
    // Cell balancing typically improves efficiency by 1-3%
    // For simplicity, we'll say each hour of balancing improves efficiency by 0.2%
    // up to a maximum of 2%
    const efficiencyImprovement = Math.min(0.02, (entry.cellBalancingDuration / 60) * 0.002);
    cellBalancingImpact = entry.energyDischarged * currentRate * efficiencyImprovement;
  }
  
  // Add these calculations to the entry
  (entry as any).australianMarket = {
    timeOfUseCategory: isPeakTime ? 'peak' : isShoulderTime ? 'shoulder' : 'off-peak',
    currentRate,
    feedInRate,
    selfConsumptionSavings,
    batteryDischargeSavings,
    exportIncome,
    importCost,
    cellBalancingImpact,
    netSavings: selfConsumptionSavings + batteryDischargeSavings + exportIncome - importCost + cellBalancingImpact,
  };
}

/**
 * Generate simulated battery status for testing
 * @param serialNumber Battery serial number
 * @returns Simulated status data
 */
function generateSimulatedStatus(serialNumber: string): BatteryStatus {
  // Use the serial number as a seed for pseudo-random but consistent values
  const seed = serialNumber.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  const now = new Date();
  const hourOfDay = now.getHours();
  
  // Generate more realistic values based on time of day
  // More solar during daytime, more grid usage at night
  const isDaytime = hourOfDay >= 7 && hourOfDay <= 19;
  const solarFactor = isDaytime ? Math.sin((hourOfDay - 7) * Math.PI / 12) : 0;
  
  // Australian seasonal adjustments
  const month = now.getMonth(); // 0-11
  const isWinter = month >= 5 && month <= 8; // June-September
  const isSummer = month === 11 || month === 0 || month === 1; // December-February
  
  // Adjust solar generation based on season
  const seasonalSolarFactor = isSummer ? 1.3 : isWinter ? 0.7 : 1.0;
  
  // Determine LG RESU model and capacity based on serial number
  const lgResuModels = ['RESU10H', 'RESU13', 'RESU16H', 'RESU10', 'RESU7H'];
  const modelIndex = Math.abs(seed) % lgResuModels.length;
  const batteryType = lgResuModels[modelIndex];
  
  // Module count based on battery type
  let moduleCount: number;
  switch (batteryType) {
    case 'RESU10H': moduleCount = 3; break;
    case 'RESU13': moduleCount = 4; break;
    case 'RESU16H': moduleCount = 5; break;
    case 'RESU10': moduleCount = 3; break;
    case 'RESU7H': moduleCount = 2; break;
    default: moduleCount = 3;
  }
  
  // Random but somewhat realistic values - slightly different from AlphaESS
  const batteryLevel = 25 + Math.floor((seed % 10) * 7) + Math.floor(Math.random() * 15);
  const solarPower = isDaytime ? Math.floor(solarFactor * seasonalSolarFactor * 4800 * (0.75 + Math.random() * 0.25)) : 0;
  
  // Australian load patterns - higher in evenings and mornings
  let loadFactor = 1.0;
  if (hourOfDay >= 17 && hourOfDay <= 21) loadFactor = 1.5; // Evening peak
  if (hourOfDay >= 6 && hourOfDay <= 9) loadFactor = 1.3; // Morning peak
  if (hourOfDay >= 0 && hourOfDay <= 5) loadFactor = 0.6; // Overnight low
  
  // Seasonal load adjustments
  if (isSummer && hourOfDay >= 12 && hourOfDay <= 18) loadFactor *= 1.4; // Summer afternoon AC use
  if (isWinter && (hourOfDay <= 8 || hourOfDay >= 17)) loadFactor *= 1.3; // Winter heating
  
  const loadPower = Math.floor((250 + Math.floor(Math.random() * 2500)) * loadFactor); // 250W-2750W adjusted
  
  // Determine if charging or discharging based on solar vs load
  const surplus = solarPower - loadPower;
  
  // Battery charges with surplus solar, or discharges to meet deficit
  // But only if battery level allows it (don't discharge below 15%, don't charge above 90%)
  let batteryPower = 0;
  if (surplus > 0 && batteryLevel < 90) {
    batteryPower = Math.min(surplus, 3500); // Max charging rate
  } else if (surplus < 0 && batteryLevel > 15) {
    batteryPower = Math.max(surplus, -3500); // Max discharging rate
  }
  
  // Grid power makes up any remaining deficit or absorbs excess
  const gridPower = surplus - batteryPower;
  
  // Generate module temperatures (LG RESU specific)
  const moduleTemperatures: number[] = [];
  const baseTemp = 22 + Math.random() * 8; // 22-30°C base temperature
  
  for (let i = 0; i < moduleCount; i++) {
    // Each module varies slightly in temperature
    moduleTemperatures.push(baseTemp + (Math.random() * 2 - 1));
  }
  
  // Cell balancing status (LG RESU specific)
  // More likely to be balancing if SOC is high or low
  const cellBalancing = Math.random() > 0.8 || batteryLevel > 85 || batteryLevel < 20;
  
  // Cell voltage deviation (LG RESU specific)
  // Higher deviation when cell balancing is needed
  const cellVoltageDeviation = cellBalancing ? 0.15 + Math.random() * 0.1 : 0.02 + Math.random() * 0.08;
  
  // DC Link voltage (LG RESU specific)
  const dcLinkVoltage = 350 + Math.random() * 50; // 350-400V DC link
  
  // System status based on Australian conditions
  let systemStatus = 'Normal';
  if (cellVoltageDeviation > 0.2) {
    systemStatus = 'Cell Balancing Recommended';
  } else if (isSummer && hourOfDay >= 14 && hourOfDay <= 16 && Math.random() > 0.9) {
    systemStatus = 'Temperature Warning'; // Occasional summer temperature warnings
  }
  
  // Generate alerts based on conditions
  const alerts: BatteryAlert[] = [];
  
  // Occasional grid voltage fluctuation alert during peak times
  if ((hourOfDay >= 17 && hourOfDay <= 20) && Math.random() > 0.85) {
    alerts.push({
      code: 'W032',
      severity: 'warning',
      message: 'Grid voltage fluctuation detected',
      timestamp: new Date().toISOString(),
      isActive: true
    });
  }
  
  // Low battery warning if applicable
  if (batteryLevel < 15) {
    alerts.push({
      code: 'W010',
      severity: 'warning',
      message: 'Battery state of charge low',
      timestamp: new Date().toISOString(),
      isActive: true
    });
  }
  
  // Cell balancing alert if needed (LG RESU specific)
  if (cellVoltageDeviation > 0.15) {
    alerts.push({
      code: 'W050',
      severity: 'warning',
      message: 'Cell voltage deviation high, balancing recommended',
      timestamp: new Date().toISOString(),
      isActive: true
    });
  }
  
  return {
    serialNumber,
    lastUpdated: new Date().toISOString(),
    batteryLevel, // State of Charge (%)
    batteryPower, // Current battery power (W, + charging, - discharging)
    gridPower, // Power from/to grid (W, + import, - export)
    solarPower, // Solar generation (W)
    loadPower, // Home consumption (W)
    systemMode: batteryPower > 0 ? 'Charging' : batteryPower < 0 ? 'Discharging' : 'Idle',
    isCharging: batteryPower > 0,
    isDischarging: batteryPower < 0,
    isExporting: gridPower < 0,
    isImporting: gridPower > 0,
    systemStatus,
    batteryTemperature: 22 + Math.random() * 8, // 22-30°C (LG typically runs cooler than AlphaESS)
    inverterTemperature: 28 + Math.random() * 12, // 28-40°C
    gridVoltage: 232 + Math.random() * 8 - 4, // 228-236V
    gridFrequency: 50 + Math.random() * 0.15 - 0.075, // 49.925-50.075Hz
    alerts,
    isSimulated: true,
    // LG RESU specific fields
    cellBalancing,
    batteryModules: moduleCount,
    moduleTemperatures,
    dcLinkVoltage,
    cellVoltageDeviation,
    batteryType
  };
}

/**
 * Generate simulated historical data for testing
 * @param serialNumber Battery serial number
 * @param startDate Start date (YYYY-MM-DD)
 * @param endDate End date (YYYY-MM-DD)
 * @param interval Data interval ('day', 'hour', '15min')
 * @returns Simulated historical data
 */
function generateSimulatedHistory(
  serialNumber: string, 
  startDate: string, 
  endDate: string, 
  interval: string
): BatteryHistoryEntry[] {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const result: BatteryHistoryEntry[] = [];
  
  // Determine interval in milliseconds
  let intervalMs: number;
  switch (interval) {
    case 'day':
      intervalMs = 24 * 60 * 60 * 1000;
      break;
    case 'hour':
      intervalMs = 60 * 60 * 1000;
      break;
    case '15min':
      intervalMs = 15 * 60 * 1000;
      break;
    default:
      intervalMs = 24 * 60 * 60 * 1000; // Default to daily
  }
  
  // Australian seasonal patterns
  const getSolarFactor = (date: Date): number => {
    const month = date.getMonth(); // 0-11
    // Seasonal solar adjustment for Australia
    if (month >= 11 || month <= 1) return 1.3; // Summer (Dec-Feb)
    if (month >= 2 && month <= 4) return 1.0; // Autumn (Mar-May)
    if (month >= 5 && month <= 7) return 0.6; // Winter (Jun-Aug)
    return 0.9; // Spring (Sep-Nov)
  };
  
  // Generate data points
  for (let timestamp = start.getTime(); timestamp <= end.getTime(); timestamp += intervalMs) {
    const date = new Date(timestamp);
    const hourOfDay = date.getHours();
    const isDaytime = hourOfDay >= 7 && hourOfDay <= 19;
    const solarFactor = isDaytime ? Math.sin((hourOfDay - 7) * Math.PI / 12) : 0;
    const seasonalFactor = getSolarFactor(date);
    
    // Energy values for the interval - slightly different from AlphaESS
    const solarGeneration = isDaytime ? solarFactor * seasonalFactor * 1.8 * (0.75 + Math.random() * 0.25) : 0;
    
    // Australian load patterns
    let loadFactor = 1.0;
    if (hourOfDay >= 17 && hourOfDay <= 21) loadFactor = 1.5; // Evening peak
    if (hourOfDay >= 6 && hourOfDay <= 9) loadFactor = 1.3; // Morning peak
    if (hourOfDay >= 0 && hourOfDay <= 5) loadFactor = 0.6; // Overnight low
    
    const homeConsumption = (0.25 + Math.random() * 0.75) * loadFactor; // 0.25-1.0 kWh per interval, adjusted
    
    // Determine battery and grid behavior
    let energyCharged = 0;
    let energyDischarged = 0;
    let gridImport = 0;
    let gridExport = 0;
    
    const surplus = solarGeneration - homeConsumption;
    
    if (surplus > 0) {
      // Excess solar: charge battery and/or export
      energyCharged = Math.min(surplus, 1.2); // Max 1.2 kWh per interval to battery
      gridExport = Math.max(0, surplus - energyCharged);
    } else {
      // Deficit: discharge battery and/or import
      energyDischarged = Math.min(Math.abs(surplus), 1.2); // Max 1.2 kWh from battery
      gridImport = Math.max(0, Math.abs(surplus) - energyDischarged);
    }
    
    // LG RESU specific - cell balancing duration
    // More likely to have cell balancing during off-peak hours
    const cellBalancingDuration = (hourOfDay >= 1 && hourOfDay <= 5 && Math.random() > 0.7) 
      ? Math.floor(Math.random() * 60) 
      : 0; // Minutes of cell balancing
    
    // Cell voltage min/max (LG RESU specific)
    const baseVoltage = 3.7; // Base cell voltage
    const minCellVoltage = baseVoltage - (0.1 + Math.random() * 0.2); // 3.4-3.6V
    const maxCellVoltage = baseVoltage + (0.1 + Math.random() * 0.1); // 3.8-3.9V
    
    // Cycle count increases by small amount each day
    const cycleCount = Math.floor(
      (timestamp - start.getTime()) / (24 * 60 * 60 * 1000) * 0.8 + // 0.8 cycles per day on average
      (Math.random() * 0.4) // Random variation
    );
    
    result.push({
      timestamp: date.toISOString(),
      batteryLevel: 25 + Math.floor(Math.random() * 55), // Random SOC between 25-80%
      solarGeneration, // kWh
      homeConsumption, // kWh
      energyCharged, // kWh
      energyDischarged, // kWh
      gridImport, // kWh
      gridExport, // kWh
      isSimulated: true,
      // LG RESU specific data
      cellBalancingDuration,
      minCellVoltage,
      maxCellVoltage,
      cycleCount
    });
  }
  
  return result;
}

/**
 * Generate simulated system information for testing
 * @param serialNumber Battery serial number
 * @returns Simulated system information
 */
function generateSimulatedSystemInfo(serialNumber: string): SystemInfo {
  // Generate installation date between 1-3 years ago
  const now = new Date();
  const yearsAgo = 1 + Math.floor(Math.random() * 2);
  const installDate = new Date(now.getFullYear() - yearsAgo, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
  
  // Generate maintenance date in the last year
  const maintenanceDate = new Date(now.getFullYear() - 1, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
  if (maintenanceDate < installDate) {
    maintenanceDate.setFullYear(installDate.getFullYear() + 1);
  }
  
  // Generate manufacturing date (typically 3-6 months before installation)
  const manufacturingDate = new Date(installDate);
  manufacturingDate.setMonth(installDate.getMonth() - (3 + Math.floor(Math.random() * 3)));
  
  // LG RESU model selection
  const resuModels = ['RESU10H', 'RESU13', 'RESU16H', 'RESU10', 'RESU7H'];
  const modelIndex = Math.floor(Math.random() * resuModels.length);
  const model = resuModels[modelIndex];
  
  // Capacity based on model
  let capacity: number;
  let moduleCount: number;
  
  switch (model) {
    case 'RESU10H':
      capacity = 9.8;
      moduleCount = 3;
      break;
    case 'RESU13':
      capacity = 12.9;
      moduleCount = 4;
      break;
    case 'RESU16H':
      capacity = 16;
      moduleCount = 5;
      break;
    case 'RESU10':
      capacity = 9.3;
      moduleCount = 3;
      break;
    case 'RESU7H':
      capacity = 7;
      moduleCount = 2;
      break;
    default:
      capacity = 10;
      moduleCount = 3;
  }
  
  return {
    serialNumber,
    model: `LG ${model}`,
    firmwareVersion: `v${Math.floor(Math.random() * 2) + 3}.${Math.floor(Math.random() * 9)}.${Math.floor(Math.random() * 20)}`,
    installationDate: installDate.toISOString().split('T')[0],
    batteryCapacity: capacity,
    nominalPower: (Math.floor(Math.random() * 2) + 4) * 1000, // 4-5kW
    lastMaintenance: maintenanceDate.toISOString().split('T')[0],
    systemType: 'DC-Coupled',
    isSimulated: true,
    // LG RESU specific data
    cellType: 'Lithium-ion NMC',
    warrantyPeriod: '10 years',
    cycleLife: '6000+ cycles',
    moduleCount,
    batteryChemistry: 'NMC (Nickel Manganese Cobalt)',
    manufacturingDate: manufacturingDate.toISOString().split('T')[0]
  };
}

/**
 * Generate simulated cell balancing status
 * @param serialNumber Battery serial number
 * @returns Simulated cell balancing status
 */
function generateSimulatedCellBalancingStatus(serialNumber: string): {
  isBalancing: boolean;
  lastBalanced: string | null;
  nextScheduled: string | null;
  voltageDeviation: number;
  recommendedAction: string | null;
} {
  const now = new Date();
  
  // Random cell voltage deviation between 0.01V and 0.2V
  const voltageDeviation = 0.01 + Math.random() * 0.19;
  
  // Last balanced date - between 1 day and 30 days ago
  const daysAgo = 1 + Math.floor(Math.random() * 29);
  const lastBalanced = new Date(now);
  lastBalanced.setDate(lastBalanced.getDate() - daysAgo);
  
  // Currently balancing?
  const isBalancing = Math.random() > 0.9; // 10% chance of currently balancing
  
  // Next scheduled date - if deviation is high, schedule soon
  let nextScheduled: Date | null = null;
  let recommendedAction: string | null = null;
  
  if (voltageDeviation > 0.15) {
    // High deviation - schedule within next 24 hours
    nextScheduled = new Date(now);
    nextScheduled.setHours(nextScheduled.getHours() + Math.floor(Math.random() * 24));
    recommendedAction = 'Cell balancing recommended within 24 hours';
  } else if (voltageDeviation > 0.1) {
    // Medium deviation - schedule within next week
    nextScheduled = new Date(now);
    nextScheduled.setDate(nextScheduled.getDate() + Math.floor(Math.random() * 7) + 1);
    recommendedAction = 'Cell balancing recommended within 7 days';
  } else if (voltageDeviation > 0.05) {
    // Low deviation - schedule within next month
    nextScheduled = new Date(now);
    nextScheduled.setDate(nextScheduled.getDate() + Math.floor(Math.random() * 30) + 7);
    recommendedAction = 'Cell balancing recommended within 30 days';
  } else {
    // Very low deviation - no action needed
    recommendedAction = null;
  }
  
  return {
    isBalancing,
    lastBalanced: lastBalanced.toISOString(),
    nextScheduled: nextScheduled ? nextScheduled.toISOString() : null,
    voltageDeviation,
    recommendedAction
  };
}

// Export the module
export default {
  getBatteryStatus,
  getBatteryHistory,
  getSystemInfo,
  updateSystemSettings,
  setupRealTimeMonitoring,
  getCellBalancingStatus,
  scheduleCellBalancing
};
