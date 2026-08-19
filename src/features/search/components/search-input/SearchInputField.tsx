import {Pressable, View} from "react-native"

import {Search, X} from "lucide-react-native"
import {Controller, type Control} from "react-hook-form"

import {Row} from "@/components/Row"
import {Icon} from "@/components/ui/icon"
import {Input} from "@/components/ui/input"
import {Text} from "@/components/ui/text"

import type {SearchFormValues} from "../../searchFormSchema"

type SearchInputFieldProps = {
  control: Control<SearchFormValues>
}

export const SearchInputField = ({control}: SearchInputFieldProps) => {
  return (
    <Controller
      control={control}
      name="query"
      render={({field}) => (
        <View className="gap-xs">
          <Text className="text-muted-foreground text-xs font-semibold uppercase">
            Ticker o empresa
          </Text>
          <Row className="border-input bg-panel gap-sm px-md h-14 min-h-[56px] items-center rounded-lg border">
            <Icon
              accessibilityElementsHidden
              as={Search}
              className="text-primary size-5 shrink-0"
            />
            <Input
              accessibilityLabel="Buscar ticker"
              autoCapitalize="characters"
              autoCorrect={false}
              className="h-14 min-h-14 flex-1 border-0 bg-transparent px-0 text-base"
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              placeholder="Ej. GGAL, AL30"
              returnKeyType="search"
              value={field.value}
            />
            {field.value.length > 0 ? (
              <Pressable
                accessibilityLabel="Borrar búsqueda"
                accessibilityRole="button"
                className="border-border bg-card active:bg-muted h-11 w-11 shrink-0 items-center justify-center rounded-lg border"
                hitSlop={8}
                onPress={() => field.onChange("")}
              >
                <Icon as={X} className="text-muted-foreground size-5" />
              </Pressable>
            ) : null}
          </Row>
        </View>
      )}
    />
  )
}
