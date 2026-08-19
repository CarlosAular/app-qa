import {Stack} from "expo-router/stack"

const darkStackScreenOptions = {
  contentStyle: {backgroundColor: "#020617"},
  headerShown: false,
  headerShadowVisible: false,
  headerStyle: {backgroundColor: "#020617"},
  headerTintColor: "#f8fafc",
  headerTitleStyle: {color: "#f8fafc"},
} as const

export default function SearchStackLayout() {
  return (
    <Stack screenOptions={darkStackScreenOptions}>
      <Stack.Screen name="index" options={{title: "Buscar"}} />
    </Stack>
  )
}
