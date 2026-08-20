import {Platform} from "react-native"

import axios, {type CreateAxiosDefaults} from "axios"
import * as Application from "expo-application"
import * as Device from "expo-device"
import * as Network from "expo-network"

import {resolveCandidateId} from "@/config/candidateId.config"

const Headers = {
  IP: "X-Device-IP",
  APP_BUNDLE_ID: "X-App-Bundle-ID",
  PLATFORM: "X-Platform",
  MODEL: "X-Device-Model",
  MANUFACTURER: "X-Device-Manufacturer",
  NAME: "X-Device-Name",
  OS_VERSION: "X-Device-OS-Version",
  APP_VERSION: "X-App-Version",
  DEVICE_ID: "X-Device-ID",
  CANDIDATE_ID: "X-Candidate-Id",
  ENABLE_BUGS: "X-Enable-Bugs",
} as const

const BUGS_TIERS = ["off", "easy", "medium", "hard"] as const

type BugsTier = (typeof BUGS_TIERS)[number]

const DEFAULT_BUGS_TIER: BugsTier = "off"

// The API rejects any request whose X-Enable-Bugs value is not one of the four
// known tiers, so an unexpected env value falls back to the golden path.
const resolveBugsTier = (): BugsTier => {
  const configured = process.env.EXPO_PUBLIC_BUGS_TIER?.trim().toLowerCase()

  return BUGS_TIERS.find(tier => tier === configured) ?? DEFAULT_BUGS_TIER
}

const configuredCandidateId = resolveCandidateId(
  process.env.EXPO_PUBLIC_CANDIDATE_ID
)

const baseConfig: CreateAxiosDefaults = {
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 12000,
  headers: {
    "Content-Type": "application/json",
    [Headers.ENABLE_BUGS]: resolveBugsTier(),
    [Headers.CANDIDATE_ID]: configuredCandidateId,
  },
}

export const api = axios.create(baseConfig)

api.interceptors.request.use(
  async config => {
    try {
      const [deviceId, ipAddress] = await Promise.all([
        Platform.OS === "android"
          ? Application.getAndroidId()
          : await Application.getIosIdForVendorAsync(),
        await Network.getIpAddressAsync(),
      ])

      if (deviceId) {
        config.headers[Headers.DEVICE_ID] = deviceId
      }

      if (ipAddress) {
        config.headers[Headers.IP] = ipAddress
      }

      config.headers[Headers.APP_BUNDLE_ID] = Application.applicationId
      config.headers[Headers.PLATFORM] = Platform.OS
      config.headers[Headers.MODEL] = Device.modelName
      config.headers[Headers.MANUFACTURER] = Device.manufacturer
      config.headers[Headers.NAME] = Device.deviceName
      config.headers[Headers.OS_VERSION] =
        `${Device.osName} ${Device.osVersion}`
      config.headers[Headers.APP_VERSION] = Application.nativeApplicationVersion

      return config
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error)
      return config
    }
  },
  (error: Error) =>
    Promise.reject(new Error(error?.message ?? "Request failed"))
)
