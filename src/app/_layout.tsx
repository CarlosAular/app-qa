import {BottomSheetModalProvider} from "@gorhom/bottom-sheet"
import {QueryClientProvider} from "@tanstack/react-query"
import {useFonts} from "expo-font"
import {DarkTheme, Stack, ThemeProvider} from "expo-router"
import {GestureHandlerRootView} from "react-native-gesture-handler"
import {KeyboardProvider} from "react-native-keyboard-controller"
import {
  initialWindowMetrics,
  SafeAreaListener,
  SafeAreaProvider,
} from "react-native-safe-area-context"
import {Toaster} from "sonner-native"
import {Uniwind} from "uniwind"

import "../global.css"

import {ModalProvider} from "@/components/modals/ModalContext"
import {fontAssets} from "@/config/fonts.config"
import {queryClient} from "@/config/query.config"

Uniwind.setTheme("dark")

export const unstable_settings = {
  initialRouteName: "(tabs)",
}

export default function Layout() {
  const [fontsLoaded] = useFonts(fontAssets)

  if (!fontsLoaded) {
    return null
  }

  return (
    <GestureHandlerRootView className="bg-background flex-1">
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <SafeAreaListener
          onChange={({insets}) => {
            Uniwind.updateInsets(insets)
          }}
        >
          <QueryClientProvider client={queryClient}>
            <KeyboardProvider>
              <BottomSheetModalProvider>
                <ModalProvider>
                  <ThemeProvider value={DarkTheme}>
                    <Stack
                      screenOptions={{
                        contentStyle: {backgroundColor: "#020617"},
                        headerShown: false,
                      }}
                    >
                      <Stack.Screen name="(tabs)" />
                      <Stack.Screen
                        name="instrument/[instrumentId]"
                        options={{
                          animation: "slide_from_right",
                          gestureEnabled: true,
                        }}
                      />
                    </Stack>
                  </ThemeProvider>
                </ModalProvider>
              </BottomSheetModalProvider>
              <Toaster
                closeButton
                position="top-center"
                richColors
                theme="dark"
              />
            </KeyboardProvider>
          </QueryClientProvider>
        </SafeAreaListener>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
