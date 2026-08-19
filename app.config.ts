import {type ConfigContext, type ExpoConfig} from "expo/config"

export default ({config}: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Cocos",
  slug: "cocos",
  scheme: "cocos",
  userInterfaceStyle: "dark",
  orientation: "default",
  web: {
    output: "static",
  },
  plugins: ["expo-router", "expo-status-bar", "expo-image", "expo-font"],
  android: {
    package: "com.cocos.trading",
  },
  ios: {
    bundleIdentifier: "com.cocos.trading",
  },
  experiments: {
    reactCompiler: true,
    typedRoutes: true,
  },
})
